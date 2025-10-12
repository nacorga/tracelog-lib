import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { App } from '../../src/app';
import { EventType, EmitterEvent } from '../../src/types';
import {
  SCROLL_DEBOUNCE_TIME_MS,
  SCROLL_MIN_EVENT_INTERVAL_MS,
  MIN_SCROLL_DEPTH_CHANGE,
  MAX_SCROLL_EVENTS_PER_SESSION,
} from '../../src/constants/config.constants';

describe('ScrollHandler Integration - Core Behavior', () => {
  let app: App | null = null;

  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    if (app) {
      app.destroy();
      app = null;
    }
    document.body.innerHTML = '';
    vi.useRealTimers();
  });

  // Helper function to create scrollable container
  function createScrollableContainer(
    id: string,
    scrollHeight: number,
    clientHeight: number,
    scrollTop: number = 0
  ): HTMLElement {
    const div = document.createElement('div');
    div.id = id;
    div.style.overflow = 'auto';
    div.style.height = `${clientHeight}px`;
    div.innerHTML = `<div style="height: ${scrollHeight}px;"></div>`;
    document.body.appendChild(div);

    Object.defineProperty(div, 'scrollHeight', { value: scrollHeight, configurable: true });
    Object.defineProperty(div, 'clientHeight', { value: clientHeight, configurable: true });
    Object.defineProperty(div, 'scrollTop', { value: scrollTop, configurable: true, writable: true });
    Object.defineProperty(div, 'offsetParent', { value: document.body, configurable: true });

    vi.spyOn(div, 'getBoundingClientRect').mockReturnValue({
      width: 500,
      height: clientHeight,
      top: 0,
      left: 0,
      bottom: clientHeight,
      right: 500,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    return div;
  }

  test('should track scroll with correct setup', async () => {
    document.body.innerHTML =
      '<div id="scroll-container" style="overflow: auto; height: 300px;"><div style="height: 1500px;"></div></div>';
    const container = document.getElementById('scroll-container') as HTMLElement;
    Object.defineProperty(container, 'scrollHeight', { value: 1500, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 300, configurable: true });
    Object.defineProperty(container, 'offsetParent', { value: document.body, configurable: true });

    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      width: 500,
      height: 300,
      top: 0,
      left: 0,
      bottom: 300,
      right: 500,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    app = new App();
    await app.init({});

    vi.advanceTimersByTime(1100);

    const scrollHandler = app['handlers'].scroll;
    expect(scrollHandler).toBeDefined();
    expect(scrollHandler?.['containers'].length).toBeGreaterThan(0);
  });

  test('should track multiple scroll containers', async () => {
    document.body.innerHTML = `
      <div id="container-1" style="overflow: auto; height: 200px;"><div style="height: 800px;"></div></div>
      <div id="container-2" style="overflow: auto; height: 200px;"><div style="height: 800px;"></div></div>
    `;

    const container1 = document.getElementById('container-1') as HTMLElement;
    const container2 = document.getElementById('container-2') as HTMLElement;

    Object.defineProperty(container1, 'scrollHeight', { value: 800, configurable: true });
    Object.defineProperty(container1, 'clientHeight', { value: 200, configurable: true });
    Object.defineProperty(container1, 'offsetParent', { value: document.body, configurable: true });

    Object.defineProperty(container2, 'scrollHeight', { value: 800, configurable: true });
    Object.defineProperty(container2, 'clientHeight', { value: 200, configurable: true });
    Object.defineProperty(container2, 'offsetParent', { value: document.body, configurable: true });

    vi.spyOn(container1, 'getBoundingClientRect').mockReturnValue({
      width: 500,
      height: 200,
      top: 0,
      left: 0,
      bottom: 200,
      right: 500,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    vi.spyOn(container2, 'getBoundingClientRect').mockReturnValue({
      width: 500,
      height: 200,
      top: 200,
      left: 0,
      bottom: 400,
      right: 500,
      x: 0,
      y: 200,
      toJSON: () => {},
    });

    app = new App();
    await app.init({});

    vi.advanceTimersByTime(1100);

    const scrollHandler = app['handlers'].scroll;
    // Should find 2 containers + window = 3 total
    expect(scrollHandler?.['containers'].length).toBeGreaterThanOrEqual(2);
  });

  test('should cleanup listeners and timers on destroy', async () => {
    document.body.innerHTML =
      '<div id="container" style="overflow: auto; height: 200px;"><div style="height: 800px;"></div></div>';
    const container = document.getElementById('container') as HTMLElement;
    Object.defineProperty(container, 'scrollHeight', { value: 800, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 200, configurable: true });
    Object.defineProperty(container, 'scrollTop', { value: 0, configurable: true, writable: true });
    Object.defineProperty(container, 'offsetParent', { value: document.body, configurable: true });

    app = new App();
    await app.init({});

    vi.advanceTimersByTime(1100);

    const scrollHandler = app['handlers'].scroll;
    expect(scrollHandler?.['containers'].length).toBeGreaterThan(0);

    container.scrollTop = 100;
    container.dispatchEvent(new Event('scroll'));

    app.destroy();

    expect(scrollHandler?.['containers'].length).toBe(0);

    vi.advanceTimersByTime(300);
  });

  describe('Scroll Event Emission', () => {
    test('should emit scroll event with correct data when scrolling container', async () => {
      const container = createScrollableContainer('test-container', 1500, 300);

      app = new App();
      await app.init({});

      const events: any[] = [];
      app.on(EmitterEvent.EVENT, (event) => {
        if (event.type === EventType.SCROLL) {
          events.push(event);
        }
      });

      vi.advanceTimersByTime(1100);

      // Scroll to 25% depth: (1500 - 300) * 0.25 = 300
      container.scrollTop = 300;
      container.dispatchEvent(new Event('scroll'));

      // Wait for debounce
      vi.advanceTimersByTime(SCROLL_DEBOUNCE_TIME_MS + 100);

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        type: EventType.SCROLL,
        scroll_data: expect.objectContaining({
          depth: 25,
          container_selector: '#test-container',
          is_primary: expect.any(Boolean),
        }),
      });
      expect(events[0].timestamp).toBeDefined();
      expect(typeof events[0].timestamp).toBe('number');
    });

    test('should debounce rapid scroll events', async () => {
      const container = createScrollableContainer('debounce-container', 1500, 300);

      app = new App();
      await app.init({});

      const trackSpy = vi.spyOn(app['managers'].event, 'track');

      vi.advanceTimersByTime(1100);

      // Trigger 5 rapid scroll events
      for (let i = 1; i <= 5; i++) {
        container.scrollTop = i * 100;
        container.dispatchEvent(new Event('scroll'));
        vi.advanceTimersByTime(50); // 50ms between scrolls
      }

      // Should not have emitted yet (debouncing)
      expect(trackSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: EventType.SCROLL })
      );

      // Wait for debounce to complete
      vi.advanceTimersByTime(SCROLL_DEBOUNCE_TIME_MS);

      // Should emit only once with final position
      const scrollCalls = trackSpy.mock.calls.filter(
        (call) => call[0]?.type === EventType.SCROLL
      );
      expect(scrollCalls).toHaveLength(1);
    });

    test('should respect minimum event interval', async () => {
      const container = createScrollableContainer('interval-container', 3000, 300);

      app = new App();
      await app.init({});

      const events: any[] = [];
      app.on(EmitterEvent.EVENT, (event) => {
        if (event.type === EventType.SCROLL) {
          events.push(event);
        }
      });

      vi.advanceTimersByTime(1100);

      // First scroll (0% → 10%)
      container.scrollTop = 270; // ~10% depth
      container.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(SCROLL_DEBOUNCE_TIME_MS + 100);

      expect(events).toHaveLength(1);

      // Second scroll too soon (within 500ms interval)
      container.scrollTop = 540; // ~20% depth
      container.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(SCROLL_DEBOUNCE_TIME_MS + 100);

      // Should still be 1 event (blocked by interval)
      expect(events).toHaveLength(1);

      // Wait past minimum interval
      vi.advanceTimersByTime(SCROLL_MIN_EVENT_INTERVAL_MS);

      // Third scroll (after interval)
      container.scrollTop = 810; // ~30% depth
      container.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(SCROLL_DEBOUNCE_TIME_MS + 100);

      // Now should have 2 events
      expect(events).toHaveLength(2);
    });

    test('should filter small depth changes below threshold', async () => {
      const container = createScrollableContainer('depth-threshold-container', 2000, 300);

      app = new App();
      await app.init({});

      const events: any[] = [];
      app.on(EmitterEvent.EVENT, (event) => {
        if (event.type === EventType.SCROLL) {
          events.push(event);
        }
      });

      vi.advanceTimersByTime(1100);

      // First scroll to establish baseline (0% → 10%)
      container.scrollTop = 170; // ~10% depth
      container.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(SCROLL_DEBOUNCE_TIME_MS + SCROLL_MIN_EVENT_INTERVAL_MS + 100);

      expect(events).toHaveLength(1);
      const firstDepth = events[0].scroll_data.depth;

      // Small scroll change (< 5%)
      container.scrollTop = 230; // ~13.5% depth (~3.5% change)
      container.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(SCROLL_DEBOUNCE_TIME_MS + SCROLL_MIN_EVENT_INTERVAL_MS + 100);

      // Should NOT emit (depth change < MIN_SCROLL_DEPTH_CHANGE)
      expect(events).toHaveLength(1);

      // Larger scroll change (>= 5%)
      container.scrollTop = 340; // ~20% depth (~10% change from first)
      container.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(SCROLL_DEBOUNCE_TIME_MS + SCROLL_MIN_EVENT_INTERVAL_MS + 100);

      // Should emit (depth change >= MIN_SCROLL_DEPTH_CHANGE)
      expect(events).toHaveLength(2);
      expect(events[1].scroll_data.depth).toBeGreaterThanOrEqual(firstDepth + MIN_SCROLL_DEPTH_CHANGE);
    });

    test('should enforce session limit on scroll events', async () => {
      const container = createScrollableContainer('limit-container', 15000, 300);

      app = new App();
      await app.init({});

      const trackSpy = vi.spyOn(app['managers'].event, 'track');

      vi.advanceTimersByTime(1100);

      // Trigger many scroll events - make large jumps to ensure depth change threshold is met
      for (let i = 1; i <= 150; i++) {
        // Jump by 1000px each time to ensure depth changes > 5%
        container.scrollTop = i * 1000;
        container.dispatchEvent(new Event('scroll'));
        vi.advanceTimersByTime(SCROLL_DEBOUNCE_TIME_MS + SCROLL_MIN_EVENT_INTERVAL_MS + 50);
      }

      // Should have tracked at most MAX_SCROLL_EVENTS_PER_SESSION events
      const scrollCalls = trackSpy.mock.calls.filter(
        (call) => call[0]?.type === EventType.SCROLL
      );

      // The handler should enforce the limit
      expect(scrollCalls.length).toBeLessThanOrEqual(MAX_SCROLL_EVENTS_PER_SESSION);
      // Verify we actually triggered enough attempts
      expect(scrollCalls.length).toBeGreaterThan(0);
    });

    test('should track scroll depth and direction correctly', async () => {
      const container = createScrollableContainer('depth-direction-container', 2000, 300);

      app = new App();
      await app.init({});

      const events: any[] = [];
      app.on(EmitterEvent.EVENT, (event) => {
        if (event.type === EventType.SCROLL) {
          events.push(event);
        }
      });

      vi.advanceTimersByTime(1100);

      // Scroll down to 20%
      container.scrollTop = 340; // (2000 - 300) * 0.20 = 340
      container.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(SCROLL_DEBOUNCE_TIME_MS + SCROLL_MIN_EVENT_INTERVAL_MS + 100);

      expect(events).toHaveLength(1);
      expect(events[0].scroll_data.depth).toBeCloseTo(20, 1);
      expect(events[0].scroll_data.direction).toBe('down');

      // Scroll down to 50%
      container.scrollTop = 850; // ~50% depth
      container.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(SCROLL_DEBOUNCE_TIME_MS + SCROLL_MIN_EVENT_INTERVAL_MS + 100);

      expect(events).toHaveLength(2);
      expect(events[1].scroll_data.depth).toBeCloseTo(50, 1);
      expect(events[1].scroll_data.direction).toBe('down');
      expect(events[1].scroll_data.max_depth_reached).toBeCloseTo(50, 1);

      // Scroll up to 30%
      container.scrollTop = 510; // ~30% depth
      container.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(SCROLL_DEBOUNCE_TIME_MS + SCROLL_MIN_EVENT_INTERVAL_MS + 100);

      expect(events).toHaveLength(3);
      expect(events[2].scroll_data.depth).toBeCloseTo(30, 1);
      expect(events[2].scroll_data.direction).toBe('up');
      expect(events[2].scroll_data.max_depth_reached).toBeCloseTo(50, 1); // Still 50%
    });
  });

  describe('Primary Container Logic', () => {
    test('should set isPrimary flag for containers', async () => {
      const container1 = createScrollableContainer('primary-container', 2000, 300);
      const container2 = createScrollableContainer('secondary-container', 1500, 300);

      app = new App();
      await app.init({});

      vi.advanceTimersByTime(1100);

      const scrollHandler = app['handlers'].scroll;
      const containers = scrollHandler?.['containers'];

      expect(containers).toBeDefined();
      expect(containers!.length).toBeGreaterThan(0);

      // At least one container should have isPrimary defined
      const primaryContainers = containers?.filter((c) => c.isPrimary === true);
      expect(primaryContainers).toBeDefined();
      expect(primaryContainers!.length).toBeGreaterThan(0);

      // Verify primary container data structure
      const primary = primaryContainers![0];
      expect(primary).toHaveProperty('element');
      expect(primary).toHaveProperty('selector');
      expect(primary).toHaveProperty('isPrimary');
      expect(primary.isPrimary).toBe(true);
    });

    test('should mark first element as primary when window is not scrollable', async () => {
      // Make document NOT scrollable
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 500,
        configurable: true,
      });
      Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });

      const container1 = createScrollableContainer('container-1', 800, 200);
      const container2 = createScrollableContainer('container-2', 800, 200);

      app = new App();
      await app.init({});

      vi.advanceTimersByTime(1100);

      const scrollHandler = app['handlers'].scroll;
      const containers = scrollHandler?.['containers'];

      const container1Tracked = containers?.find((c) => c.element === container1);
      const container2Tracked = containers?.find((c) => c.element === container2);

      // First detected container should be primary
      expect(container1Tracked?.isPrimary).toBe(true);
      expect(container2Tracked?.isPrimary).toBe(false);
    });
  });
});
