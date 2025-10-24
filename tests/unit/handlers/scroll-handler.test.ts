/**
 * ScrollHandler Tests
 * Focus: Scroll depth tracking with debouncing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment, advanceTimers } from '../../helpers/setup.helper';
import { ScrollHandler } from '../../../src/handlers/scroll.handler';
import { EventManager } from '../../../src/managers/event.manager';
import { EventType, ScrollDirection } from '../../../src/types';
import {
  SCROLL_DEBOUNCE_TIME_MS,
  MAX_SCROLL_EVENTS_PER_SESSION,
  SCROLL_MIN_EVENT_INTERVAL_MS,
} from '../../../src/constants';

describe('ScrollHandler - Basic Tracking', () => {
  let handler: ScrollHandler;
  let mockEventManager: EventManager;

  beforeEach(() => {
    setupTestEnvironment();
    vi.useFakeTimers();

    mockEventManager = {
      track: vi.fn(),
    } as any;

    handler = new ScrollHandler(mockEventManager);
  });

  afterEach(() => {
    handler.stopTracking();
    cleanupTestEnvironment();
  });

  it('should start tracking on startTracking()', async () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 3000,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 1000,
    });

    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    handler.startTracking();
    await advanceTimers(1000);

    expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
  });

  it('should stop tracking on stopTracking()', async () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 3000,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 1000,
    });

    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    handler.startTracking();
    await advanceTimers(1000);
    handler.stopTracking();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
  });

  it('should track scroll depth percentage', async () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 3000,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 0,
      writable: true,
    });

    handler.startTracking();

    Object.defineProperty(window, 'scrollY', { value: 100 });
    window.dispatchEvent(new Event('scroll'));

    await advanceTimers(SCROLL_DEBOUNCE_TIME_MS);

    expect(mockEventManager.track).toHaveBeenCalledWith(
      expect.objectContaining({
        type: EventType.SCROLL,
        scroll_data: expect.objectContaining({
          depth: expect.any(Number),
        }),
      }),
    );

    const call = (mockEventManager.track as any).mock.calls[0][0];
    expect(call.scroll_data.depth).toBeGreaterThanOrEqual(0);
    expect(call.scroll_data.depth).toBeLessThanOrEqual(100);
  });

  it('should track scroll depth pixels', async () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 3000,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 0,
      writable: true,
    });

    handler.startTracking();

    Object.defineProperty(window, 'scrollY', { value: 200 });
    window.dispatchEvent(new Event('scroll'));

    await advanceTimers(SCROLL_DEBOUNCE_TIME_MS);

    expect(mockEventManager.track).toHaveBeenCalled();
  });

  it('should track scroll direction (up/down)', async () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 3000,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 0,
      writable: true,
    });

    handler.startTracking();

    Object.defineProperty(window, 'scrollY', { value: 200 });
    window.dispatchEvent(new Event('scroll'));
    await advanceTimers(SCROLL_DEBOUNCE_TIME_MS);

    const downCall = (mockEventManager.track as any).mock.calls[0][0];
    expect(downCall.scroll_data.direction).toBe(ScrollDirection.DOWN);

    vi.clearAllMocks();

    await advanceTimers(SCROLL_MIN_EVENT_INTERVAL_MS + 100);

    Object.defineProperty(window, 'scrollY', { value: 50 });
    window.dispatchEvent(new Event('scroll'));
    await advanceTimers(SCROLL_DEBOUNCE_TIME_MS);

    const upCall = (mockEventManager.track as any).mock.calls[0][0];
    expect(upCall.scroll_data.direction).toBe(ScrollDirection.UP);
  });

  it('should track scroll velocity', async () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 3000,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 0,
      writable: true,
    });

    handler.startTracking();

    Object.defineProperty(window, 'scrollY', { value: 200 });
    window.dispatchEvent(new Event('scroll'));

    await advanceTimers(SCROLL_DEBOUNCE_TIME_MS);

    expect(mockEventManager.track).toHaveBeenCalledWith(
      expect.objectContaining({
        scroll_data: expect.objectContaining({
          velocity: expect.any(Number),
        }),
      }),
    );
  });

  it('should track max depth reached', async () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 3000,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 0,
      writable: true,
    });

    handler.startTracking();

    Object.defineProperty(window, 'scrollY', { value: 500 });
    window.dispatchEvent(new Event('scroll'));
    await advanceTimers(SCROLL_DEBOUNCE_TIME_MS);

    const firstCall = (mockEventManager.track as any).mock.calls[0][0];
    const firstMaxDepth = firstCall.scroll_data.max_depth_reached;

    vi.clearAllMocks();
    await advanceTimers(SCROLL_MIN_EVENT_INTERVAL_MS + 100);

    Object.defineProperty(window, 'scrollY', { value: 1000 });
    window.dispatchEvent(new Event('scroll'));
    await advanceTimers(SCROLL_DEBOUNCE_TIME_MS);

    const secondCall = (mockEventManager.track as any).mock.calls[0][0];
    const secondMaxDepth = secondCall.scroll_data.max_depth_reached;

    expect(secondMaxDepth).toBeGreaterThanOrEqual(firstMaxDepth);
  });
});

describe('ScrollHandler - Debouncing', () => {
  let handler: ScrollHandler;
  let mockEventManager: EventManager;

  beforeEach(() => {
    setupTestEnvironment();
    vi.useFakeTimers();

    mockEventManager = {
      track: vi.fn(),
    } as any;

    handler = new ScrollHandler(mockEventManager);

    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 3000,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 0,
      writable: true,
    });
  });

  afterEach(() => {
    handler.stopTracking();
    cleanupTestEnvironment();
  });

  it('should debounce scroll events (250ms)', async () => {
    handler.startTracking();

    Object.defineProperty(window, 'scrollY', { value: 100 });
    window.dispatchEvent(new Event('scroll'));

    Object.defineProperty(window, 'scrollY', { value: 200 });
    window.dispatchEvent(new Event('scroll'));

    Object.defineProperty(window, 'scrollY', { value: 300 });
    window.dispatchEvent(new Event('scroll'));

    await advanceTimers(SCROLL_DEBOUNCE_TIME_MS);

    expect(mockEventManager.track).toHaveBeenCalledTimes(1);
  });

  it('should not track during debounce period', () => {
    handler.startTracking();

    Object.defineProperty(window, 'scrollY', { value: 100 });
    window.dispatchEvent(new Event('scroll'));

    expect(mockEventManager.track).not.toHaveBeenCalled();
  });

  it('should track after debounce completes', async () => {
    handler.startTracking();

    Object.defineProperty(window, 'scrollY', { value: 100 });
    window.dispatchEvent(new Event('scroll'));

    await advanceTimers(SCROLL_DEBOUNCE_TIME_MS);

    expect(mockEventManager.track).toHaveBeenCalledTimes(1);
  });
});

describe('ScrollHandler - Multi-Container', () => {
  let handler: ScrollHandler;
  let mockEventManager: EventManager;

  beforeEach(() => {
    setupTestEnvironment();
    vi.useFakeTimers();

    mockEventManager = {
      track: vi.fn(),
    } as any;

    handler = new ScrollHandler(mockEventManager);
  });

  afterEach(() => {
    handler.stopTracking();
    cleanupTestEnvironment();
  });

  it('should track window scroll by default', () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 3000,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 1000,
    });

    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    handler.startTracking();

    expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
  });

  it('should track custom container selectors', async () => {
    const container = document.createElement('div');
    container.id = 'scroll-container';
    container.style.overflow = 'auto';
    container.style.height = '500px';
    Object.defineProperty(container, 'scrollHeight', { configurable: true, value: 2000 });
    Object.defineProperty(container, 'clientHeight', { configurable: true, value: 500 });
    Object.defineProperty(container, 'scrollTop', { configurable: true, value: 0, writable: true });
    Object.defineProperty(container, 'offsetParent', { configurable: true, value: document.body });

    document.body.appendChild(container);

    const addEventListenerSpy = vi.spyOn(container, 'addEventListener');

    handler.startTracking();

    await advanceTimers(1000);

    expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
  });

  it('should track multiple containers', async () => {
    const container1 = document.createElement('div');
    container1.id = 'scroll-container-1';
    container1.style.overflow = 'auto';
    container1.style.height = '500px';
    Object.defineProperty(container1, 'scrollHeight', { configurable: true, value: 2000 });
    Object.defineProperty(container1, 'clientHeight', { configurable: true, value: 500 });
    Object.defineProperty(container1, 'offsetParent', { configurable: true, value: document.body });

    const container2 = document.createElement('div');
    container2.id = 'scroll-container-2';
    container2.style.overflow = 'auto';
    container2.style.height = '500px';
    Object.defineProperty(container2, 'scrollHeight', { configurable: true, value: 2000 });
    Object.defineProperty(container2, 'clientHeight', { configurable: true, value: 500 });
    Object.defineProperty(container2, 'offsetParent', { configurable: true, value: document.body });

    document.body.appendChild(container1);
    document.body.appendChild(container2);

    const spy1 = vi.spyOn(container1, 'addEventListener');
    const spy2 = vi.spyOn(container2, 'addEventListener');

    handler.startTracking();

    await advanceTimers(1000);

    expect(spy1).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
    expect(spy2).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
  });

  it('should attach listeners to new containers', async () => {
    handler.startTracking();

    await advanceTimers(200);

    const container = document.createElement('div');
    container.id = 'late-container';
    container.style.overflow = 'auto';
    container.style.height = '500px';
    Object.defineProperty(container, 'scrollHeight', { configurable: true, value: 2000 });
    Object.defineProperty(container, 'clientHeight', { configurable: true, value: 500 });
    Object.defineProperty(container, 'offsetParent', { configurable: true, value: document.body });

    document.body.appendChild(container);

    const addEventListenerSpy = vi.spyOn(container, 'addEventListener');

    await advanceTimers(1000);

    expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
  });
});

describe('ScrollHandler - Initial Suppression', () => {
  let handler: ScrollHandler;
  let mockEventManager: EventManager;

  beforeEach(() => {
    setupTestEnvironment();
    vi.useFakeTimers();

    mockEventManager = {
      track: vi.fn(),
    } as any;

    handler = new ScrollHandler(mockEventManager);

    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 3000,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 0,
      writable: true,
    });
  });

  afterEach(() => {
    handler.stopTracking();
    cleanupTestEnvironment();
  });

  it('should suppress scroll events for 500ms after init', async () => {
    handler['set']('suppressNextScroll', true);
    handler.startTracking();

    Object.defineProperty(window, 'scrollY', { value: 200 });
    window.dispatchEvent(new Event('scroll'));

    await advanceTimers(SCROLL_DEBOUNCE_TIME_MS);

    expect(mockEventManager.track).not.toHaveBeenCalled();
  });

  it('should start tracking after suppression period', async () => {
    handler['set']('suppressNextScroll', true);
    handler.startTracking();

    Object.defineProperty(window, 'scrollY', { value: 200 });
    window.dispatchEvent(new Event('scroll'));
    await advanceTimers(SCROLL_DEBOUNCE_TIME_MS);

    expect(mockEventManager.track).not.toHaveBeenCalled();

    handler['set']('suppressNextScroll', false);

    Object.defineProperty(window, 'scrollY', { value: 400 });
    window.dispatchEvent(new Event('scroll'));
    await advanceTimers(SCROLL_DEBOUNCE_TIME_MS + SCROLL_MIN_EVENT_INTERVAL_MS);

    expect(mockEventManager.track).toHaveBeenCalled();
  });
});

describe('ScrollHandler - Rate Limiting', () => {
  let handler: ScrollHandler;
  let mockEventManager: EventManager;

  beforeEach(() => {
    setupTestEnvironment();
    vi.useFakeTimers();

    mockEventManager = {
      track: vi.fn(),
    } as any;

    handler = new ScrollHandler(mockEventManager);

    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 2500000,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 0,
      writable: true,
    });
  });

  afterEach(() => {
    handler.stopTracking();
    cleanupTestEnvironment();
  });

  it('should limit to 120 scroll events per session', async () => {
    handler.startTracking();

    handler['minDepthChange'] = 0;
    handler['minIntervalMs'] = 0;

    let scrollPos = 0;
    for (let i = 0; i < MAX_SCROLL_EVENTS_PER_SESSION + 10; i++) {
      scrollPos += 100;
      Object.defineProperty(window, 'scrollY', { value: scrollPos, writable: true });
      window.dispatchEvent(new Event('scroll'));
      await advanceTimers(SCROLL_DEBOUNCE_TIME_MS);
    }

    expect(mockEventManager.track).toHaveBeenCalledTimes(MAX_SCROLL_EVENTS_PER_SESSION);
  });

  it('should stop tracking after limit reached', async () => {
    handler.startTracking();

    handler['minDepthChange'] = 0;
    handler['minIntervalMs'] = 0;

    let scrollPos = 0;
    for (let i = 0; i < MAX_SCROLL_EVENTS_PER_SESSION; i++) {
      scrollPos += 100;
      Object.defineProperty(window, 'scrollY', { value: scrollPos, writable: true });
      window.dispatchEvent(new Event('scroll'));
      await advanceTimers(SCROLL_DEBOUNCE_TIME_MS);
    }

    const callCountAtLimit = (mockEventManager.track as any).mock.calls.length;

    scrollPos += 100;
    Object.defineProperty(window, 'scrollY', { value: scrollPos, writable: true });
    window.dispatchEvent(new Event('scroll'));
    await advanceTimers(SCROLL_DEBOUNCE_TIME_MS);

    expect(mockEventManager.track).toHaveBeenCalledTimes(callCountAtLimit);
  });
});
