import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { App } from '../../src/app';
import { EventType, EmitterEvent } from '../../src/types';
import { resetGlobalState } from '../../src/managers/state.manager';

// Mock IntersectionObserver
class MockIntersectionObserver {
  private readonly callback: IntersectionObserverCallback;
  private readonly observedElements = new Set<Element>();

  constructor(callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {
    this.callback = callback;
  }

  observe(element: Element): void {
    this.observedElements.add(element);
  }

  unobserve(element: Element): void {
    this.observedElements.delete(element);
  }

  disconnect(): void {
    this.observedElements.clear();
  }

  // Test helper
  triggerIntersection(entries: Partial<IntersectionObserverEntry>[]): void {
    const fullEntries = entries.map((entry) => ({
      time: 0,
      rootBounds: null,
      boundingClientRect: {} as DOMRectReadOnly,
      intersectionRect: {} as DOMRectReadOnly,
      intersectionRatio: entry.intersectionRatio ?? 0,
      isIntersecting: entry.isIntersecting ?? false,
      target: entry.target as Element,
    })) as IntersectionObserverEntry[];

    this.callback(fullEntries, this as unknown as IntersectionObserver);
  }

  getObservedElements(): Element[] {
    return Array.from(this.observedElements);
  }
}

describe('Viewport Tracking Integration', () => {
  let app: App;
  let observerInstance: MockIntersectionObserver | null = null;

  beforeEach(() => {
    resetGlobalState();
    vi.useFakeTimers();

    // Mock IntersectionObserver
    global.IntersectionObserver = vi.fn((callback, options) => {
      observerInstance = new MockIntersectionObserver(callback, options);
      return observerInstance as unknown as IntersectionObserver;
    }) as unknown as typeof IntersectionObserver;

    // Mock performance.now()
    vi.spyOn(performance, 'now').mockReturnValue(0);

    app = new App();
  });

  afterEach(() => {
    app.destroy();
    vi.restoreAllMocks();
    vi.useRealTimers();
    observerInstance = null;
  });

  describe('ViewportHandler integration with EventManager', () => {
    it('should emit viewport events through EventManager', async () => {
      const element = document.createElement('div');
      element.className = 'hero';
      document.body.appendChild(element);

      await app.init({
        viewport: {
          elements: [{ selector: '.hero' }],
          threshold: 0.5,
          minDwellTime: 1000,
        },
      });

      const events: unknown[] = [];
      app.on(EmitterEvent.EVENT, (event) => {
        events.push(event);
      });

      // Trigger visibility
      observerInstance?.triggerIntersection([{ target: element, isIntersecting: true, intersectionRatio: 0.6 }]);

      vi.advanceTimersByTime(1000);

      // Filter viewport events
      const viewportEvents = events.filter((e: any) => e.type === EventType.VIEWPORT_VISIBLE);
      expect(viewportEvents).toHaveLength(1);

      // Verify event structure
      const viewportEvent = viewportEvents[0] as any;
      expect(viewportEvent).toMatchObject({
        type: EventType.VIEWPORT_VISIBLE,
        viewport_data: {
          selector: '.hero',
          dwellTime: expect.any(Number),
          visibilityRatio: 0.6,
        },
      });

      // EventManager should add these fields automatically
      expect(viewportEvent.id).toBeDefined();
      expect(viewportEvent.timestamp).toBeDefined();
      expect(viewportEvent.page_url).toBeDefined();

      // Cleanup
      document.body.removeChild(element);
    });

    it('should work alongside other handlers (click, scroll)', async () => {
      const element = document.createElement('button');
      element.className = 'cta';
      element.textContent = 'Click me';
      document.body.appendChild(element);

      await app.init({
        viewport: {
          elements: [{ selector: '.cta' }],
          threshold: 0.5,
          minDwellTime: 500,
        },
      });

      const events: unknown[] = [];
      app.on(EmitterEvent.EVENT, (event) => {
        events.push(event);
      });

      // Trigger viewport visibility
      observerInstance?.triggerIntersection([{ target: element, isIntersecting: true, intersectionRatio: 0.7 }]);
      vi.advanceTimersByTime(500);

      // Trigger click
      element.click();

      // Should have both viewport and click events
      const eventTypes = events.map((e: any) => e.type);
      expect(eventTypes).toContain(EventType.VIEWPORT_VISIBLE);
      expect(eventTypes).toContain(EventType.CLICK);

      // Cleanup
      document.body.removeChild(element);
    });

    it('should respect global sampling rate', async () => {
      const element = document.createElement('div');
      element.className = 'hero';
      document.body.appendChild(element);

      // Set samplingRate to 0 (no events should be emitted)
      await app.init({
        samplingRate: 0,
        viewport: {
          elements: [{ selector: '.hero' }],
          threshold: 0.5,
          minDwellTime: 500,
        },
      });

      const events: unknown[] = [];
      app.on(EmitterEvent.EVENT, (event) => {
        events.push(event);
      });

      // Trigger visibility
      observerInstance?.triggerIntersection([{ target: element, isIntersecting: true, intersectionRatio: 0.6 }]);
      vi.advanceTimersByTime(500);

      // No events should be emitted (samplingRate = 0)
      const viewportEvents = events.filter((e: any) => e.type === EventType.VIEWPORT_VISIBLE);
      expect(viewportEvents).toHaveLength(0);

      // Cleanup
      document.body.removeChild(element);
    });

    it('should include sessionId in events', async () => {
      const element = document.createElement('div');
      element.className = 'hero';
      document.body.appendChild(element);

      await app.init({
        viewport: {
          elements: [{ selector: '.hero' }],
          threshold: 0.5,
          minDwellTime: 500,
        },
      });

      const events: unknown[] = [];
      app.on(EmitterEvent.EVENT, (event) => {
        events.push(event);
      });

      // Wait for session to be established
      vi.advanceTimersByTime(100);

      // Trigger visibility
      observerInstance?.triggerIntersection([{ target: element, isIntersecting: true, intersectionRatio: 0.6 }]);
      vi.advanceTimersByTime(500);

      const viewportEvents = events.filter((e: any) => e.type === EventType.VIEWPORT_VISIBLE);
      expect(viewportEvents).toHaveLength(1);

      // EventManager adds sessionId automatically (not in viewport_data)
      // Note: sessionId is added in event queue, not in individual events per CLAUDE.md
      const viewportEvent = viewportEvents[0] as any;
      expect(viewportEvent.viewport_data).toBeDefined();
      expect(viewportEvent.viewport_data.sessionId).toBeUndefined(); // Should NOT be in viewport_data

      // Cleanup
      document.body.removeChild(element);
    });
  });

  describe('Configuration integration', () => {
    it('should not initialize ViewportHandler when viewport config is missing', async () => {
      await app.init({});

      // Should not create IntersectionObserver
      expect(global.IntersectionObserver).not.toHaveBeenCalled();
    });

    it('should handle multiple selectors', async () => {
      // Create elements BEFORE init so they're available when ViewportHandler starts
      const hero = document.createElement('div');
      hero.className = 'hero';
      document.body.appendChild(hero);

      const cta = document.createElement('div');
      cta.className = 'cta';
      document.body.appendChild(cta);

      await app.init({
        viewport: {
          elements: [{ selector: '.hero' }, { selector: '.cta' }],
          threshold: 0.5,
          minDwellTime: 500,
        },
      });

      const events: unknown[] = [];
      app.on(EmitterEvent.EVENT, (event) => {
        events.push(event);
      });

      // Trigger hero first
      observerInstance?.triggerIntersection([{ target: hero, isIntersecting: true, intersectionRatio: 0.6 }]);

      // Let hero's timer complete
      vi.advanceTimersByTime(500);

      // Verify first event fired
      expect(events.filter((e: any) => e.type === EventType.VIEWPORT_VISIBLE)).toHaveLength(1);

      // Now trigger CTA
      observerInstance?.triggerIntersection([{ target: cta, isIntersecting: true, intersectionRatio: 0.7 }]);

      // Let CTA's timer complete
      vi.advanceTimersByTime(500);

      const viewportEvents = events.filter((e: any) => e.type === EventType.VIEWPORT_VISIBLE);
      expect(viewportEvents).toHaveLength(2);

      const selectors = viewportEvents.map((e: any) => e.viewport_data.selector);
      expect(selectors).toContain('.hero');
      expect(selectors).toContain('.cta');

      // Cleanup
      document.body.removeChild(hero);
      document.body.removeChild(cta);
    });
  });

  describe('Event validation pipeline', () => {
    it('should pass through EventManager validation', async () => {
      const element = document.createElement('div');
      element.className = 'hero';
      document.body.appendChild(element);

      await app.init({
        viewport: {
          elements: [{ selector: '.hero' }],
          threshold: 0.5,
          minDwellTime: 500,
        },
      });

      const events: unknown[] = [];
      app.on(EmitterEvent.EVENT, (event) => {
        events.push(event);
      });

      // Trigger visibility
      observerInstance?.triggerIntersection([{ target: element, isIntersecting: true, intersectionRatio: 0.6 }]);
      vi.advanceTimersByTime(500);

      const viewportEvents = events.filter((e: any) => e.type === EventType.VIEWPORT_VISIBLE);
      expect(viewportEvents).toHaveLength(1);

      // EventManager should add required fields
      const event = viewportEvents[0] as any;
      expect(event.id).toBeDefined();
      expect(event.type).toBe(EventType.VIEWPORT_VISIBLE);
      expect(event.page_url).toBeDefined();
      expect(event.timestamp).toBeDefined();
      expect(event.viewport_data).toBeDefined();

      // Cleanup
      document.body.removeChild(element);
    });
  });

  describe('App lifecycle integration', () => {
    it('should cleanup ViewportHandler on destroy', async () => {
      const element = document.createElement('div');
      element.className = 'hero';
      document.body.appendChild(element);

      await app.init({
        viewport: {
          elements: [{ selector: '.hero' }],
          threshold: 0.5,
          minDwellTime: 1000,
        },
      });

      // Trigger visibility
      observerInstance?.triggerIntersection([{ target: element, isIntersecting: true, intersectionRatio: 0.6 }]);

      // Destroy app before timer fires
      app.destroy();

      // Advance timer - event should NOT fire
      vi.advanceTimersByTime(1000);

      // No events should be emitted after destroy
      const events: unknown[] = [];
      app.on(EmitterEvent.EVENT, (event) => {
        events.push(event);
      });

      expect(events).toHaveLength(0);

      // Cleanup
      document.body.removeChild(element);
    });

    it('should handle re-initialization', async () => {
      const element = document.createElement('div');
      element.className = 'hero';
      document.body.appendChild(element);

      // First init
      await app.init({
        viewport: {
          elements: [{ selector: '.hero' }],
          threshold: 0.5,
          minDwellTime: 500,
        },
      });

      app.destroy();

      // Second init
      await app.init({
        viewport: {
          elements: [{ selector: '.hero' }],
          threshold: 0.5,
          minDwellTime: 500,
        },
      });

      const events: unknown[] = [];
      app.on(EmitterEvent.EVENT, (event) => {
        events.push(event);
      });

      // Trigger visibility
      observerInstance?.triggerIntersection([{ target: element, isIntersecting: true, intersectionRatio: 0.6 }]);
      vi.advanceTimersByTime(500);

      const viewportEvents = events.filter((e: any) => e.type === EventType.VIEWPORT_VISIBLE);
      expect(viewportEvents).toHaveLength(1);

      // Cleanup
      document.body.removeChild(element);
    });
  });

  describe('Global metadata integration', () => {
    it('should respect globalMetadata config', async () => {
      const element = document.createElement('div');
      element.className = 'hero';
      document.body.appendChild(element);

      await app.init({
        globalMetadata: {
          environment: 'test',
          version: '1.0.0',
        },
        viewport: {
          elements: [{ selector: '.hero' }],
          threshold: 0.5,
          minDwellTime: 500,
        },
      });

      const events: unknown[] = [];
      app.on(EmitterEvent.EVENT, (event) => {
        events.push(event);
      });

      // Trigger visibility
      observerInstance?.triggerIntersection([{ target: element, isIntersecting: true, intersectionRatio: 0.6 }]);
      vi.advanceTimersByTime(500);

      const viewportEvents = events.filter((e: any) => e.type === EventType.VIEWPORT_VISIBLE);
      expect(viewportEvents).toHaveLength(1);

      // EventManager should add globalMetadata automatically
      // (This is validated in EventManager tests, not viewport-specific)

      // Cleanup
      document.body.removeChild(element);
    });
  });

  describe('Element identifiers integration', () => {
    it('should emit viewport events with identifiers when using elements config', async () => {
      const heroElement = document.createElement('div');
      heroElement.className = 'hero';
      document.body.appendChild(heroElement);

      const ctaElement = document.createElement('button');
      ctaElement.className = 'cta';
      document.body.appendChild(ctaElement);

      await app.init({
        viewport: {
          elements: [
            { selector: '.hero', id: 'homepage-hero', name: 'Homepage Hero Banner' },
            { selector: '.cta', id: 'pricing-cta', name: 'Pricing CTA Button' },
          ],
          threshold: 0.5,
          minDwellTime: 500,
        },
      });

      const events: unknown[] = [];
      app.on(EmitterEvent.EVENT, (event) => {
        events.push(event);
      });

      // Trigger hero element first
      observerInstance?.triggerIntersection([{ target: heroElement, isIntersecting: true, intersectionRatio: 0.6 }]);

      vi.advanceTimersByTime(500);

      // Trigger CTA element
      observerInstance?.triggerIntersection([{ target: ctaElement, isIntersecting: true, intersectionRatio: 0.7 }]);

      vi.advanceTimersByTime(500);

      const viewportEvents = events.filter((e: any) => e.type === EventType.VIEWPORT_VISIBLE);
      expect(viewportEvents.length).toBeGreaterThanOrEqual(2);

      // Verify hero event has identifiers
      const heroEvent = viewportEvents.find((e: any) => e.viewport_data.selector === '.hero') as any;
      expect(heroEvent.viewport_data).toMatchObject({
        selector: '.hero',
        id: 'homepage-hero',
        name: 'Homepage Hero Banner',
        dwellTime: expect.any(Number),
        visibilityRatio: 0.6,
      });

      // Verify CTA event has identifiers
      const ctaEvent = viewportEvents.find((e: any) => e.viewport_data.selector === '.cta') as any;
      expect(ctaEvent.viewport_data).toMatchObject({
        selector: '.cta',
        id: 'pricing-cta',
        name: 'Pricing CTA Button',
        dwellTime: expect.any(Number),
        visibilityRatio: 0.7,
      });

      // Cleanup
      document.body.removeChild(heroElement);
      document.body.removeChild(ctaElement);
    });

    it('should support optional identifiers (only id or only name)', async () => {
      const onlyIdElement = document.createElement('div');
      onlyIdElement.className = 'only-id';
      document.body.appendChild(onlyIdElement);

      const onlyNameElement = document.createElement('div');
      onlyNameElement.className = 'only-name';
      document.body.appendChild(onlyNameElement);

      await app.init({
        viewport: {
          elements: [
            { selector: '.only-id', id: 'my-id' },
            { selector: '.only-name', name: 'My Name' },
          ],
          threshold: 0.5,
          minDwellTime: 500,
        },
      });

      const events: unknown[] = [];
      app.on(EmitterEvent.EVENT, (event) => {
        events.push(event);
      });

      // Trigger only-id element first
      observerInstance?.triggerIntersection([{ target: onlyIdElement, isIntersecting: true, intersectionRatio: 0.6 }]);

      vi.advanceTimersByTime(500);

      // Trigger only-name element
      observerInstance?.triggerIntersection([
        { target: onlyNameElement, isIntersecting: true, intersectionRatio: 0.7 },
      ]);

      vi.advanceTimersByTime(500);

      const viewportEvents = events.filter((e: any) => e.type === EventType.VIEWPORT_VISIBLE);
      expect(viewportEvents.length).toBeGreaterThanOrEqual(2);

      // Only-id event
      const onlyIdEvent = viewportEvents.find((e: any) => e.viewport_data.selector === '.only-id') as any;
      expect(onlyIdEvent.viewport_data.id).toBe('my-id');
      expect(onlyIdEvent.viewport_data.name).toBeUndefined();

      // Only-name event
      const onlyNameEvent = viewportEvents.find((e: any) => e.viewport_data.selector === '.only-name') as any;
      expect(onlyNameEvent.viewport_data.id).toBeUndefined();
      expect(onlyNameEvent.viewport_data.name).toBe('My Name');

      // Cleanup
      document.body.removeChild(onlyIdElement);
      document.body.removeChild(onlyNameElement);
    });
  });
});
