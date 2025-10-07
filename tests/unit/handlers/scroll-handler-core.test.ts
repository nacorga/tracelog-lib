import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { ScrollHandler } from '../../../src/handlers/scroll.handler';
import { setupTestEnvironment, cleanupTestState } from '../../utils/test-setup';

vi.mock('../../../src/utils/logging', () => ({
  debugLog: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    clientWarn: vi.fn(),
  },
}));

describe('ScrollHandler - Core Functionality', () => {
  let scrollHandler: ScrollHandler;
  let mockEventManager: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    const testEnv = await setupTestEnvironment();
    mockEventManager = testEnv.eventManager;
    vi.spyOn(mockEventManager, 'track');
    document.body.innerHTML = '';
  });

  afterEach(() => {
    scrollHandler?.stopTracking();
    document.body.innerHTML = '';
    cleanupTestState();
    vi.useRealTimers();
  });

  test('should calculate scroll depth correctly', () => {
    document.body.innerHTML =
      '<div id="container" style="overflow: auto; height: 200px;"><div style="height: 1000px;"></div></div>';
    const container = document.getElementById('container') as HTMLElement;
    Object.defineProperty(container, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 200, configurable: true });
    Object.defineProperty(container, 'scrollTop', { value: 0, configurable: true, writable: true });

    scrollHandler = new ScrollHandler(mockEventManager);
    scrollHandler['set']('config', { id: 'test', scrollContainerSelectors: '#container' } as any);
    scrollHandler.startTracking();

    container.scrollTop = 400;
    container.dispatchEvent(new Event('scroll'));

    vi.advanceTimersByTime(300);

    expect(mockEventManager.track).toHaveBeenCalled();
    const call = mockEventManager.track.mock.calls[0][0];
    expect(call.scroll_data.depth).toBeGreaterThan(0);
    expect(call.scroll_data.depth).toBeLessThanOrEqual(100);
  });

  test('should detect scroll direction down', () => {
    document.body.innerHTML =
      '<div id="container" style="overflow: auto; height: 200px;"><div style="height: 1000px;"></div></div>';
    const container = document.getElementById('container') as HTMLElement;
    Object.defineProperty(container, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 200, configurable: true });
    Object.defineProperty(container, 'scrollTop', { value: 0, configurable: true, writable: true });

    scrollHandler = new ScrollHandler(mockEventManager);
    scrollHandler['set']('config', { id: 'test', scrollContainerSelectors: '#container' } as any);
    scrollHandler.startTracking();

    container.scrollTop = 100;
    container.dispatchEvent(new Event('scroll'));

    vi.advanceTimersByTime(300);

    const call = mockEventManager.track.mock.calls[0][0];
    expect(call.scroll_data.direction).toBe('down');
  });

  test('should detect scroll direction up', () => {
    document.body.innerHTML =
      '<div id="container" style="overflow: auto; height: 200px;"><div style="height: 1000px;"></div></div>';
    const container = document.getElementById('container') as HTMLElement;
    Object.defineProperty(container, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 200, configurable: true });
    Object.defineProperty(container, 'scrollTop', { value: 500, configurable: true, writable: true });

    scrollHandler = new ScrollHandler(mockEventManager);
    scrollHandler['set']('config', { id: 'test', scrollContainerSelectors: '#container' } as any);
    scrollHandler.startTracking();

    container.scrollTop = 300;
    container.dispatchEvent(new Event('scroll'));

    vi.advanceTimersByTime(300);

    const call = mockEventManager.track.mock.calls[0][0];
    expect(call.scroll_data.direction).toBe('up');
  });

  test('should skip non-scrollable elements', () => {
    document.body.innerHTML =
      '<div id="non-scrollable" style="overflow: hidden; height: 200px;"><div style="height: 100px;"></div></div>';
    const container = document.getElementById('non-scrollable') as HTMLElement;
    Object.defineProperty(container, 'scrollHeight', { value: 100, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 200, configurable: true });

    scrollHandler = new ScrollHandler(mockEventManager);
    scrollHandler['set']('config', { id: 'test', scrollContainerSelectors: '#non-scrollable' } as any);

    const isScrollable = scrollHandler['isElementScrollable'](container);

    expect(isScrollable).toBe(false);
  });

  test('should cleanup timers on stopTracking', () => {
    document.body.innerHTML =
      '<div id="container" style="overflow: auto; height: 200px;"><div style="height: 1000px;"></div></div>';
    const container = document.getElementById('container') as HTMLElement;
    Object.defineProperty(container, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 200, configurable: true });

    scrollHandler = new ScrollHandler(mockEventManager);
    scrollHandler['set']('config', { id: 'test', scrollContainerSelectors: '#container' } as any);
    scrollHandler.startTracking();

    container.scrollTop = 100;
    container.dispatchEvent(new Event('scroll'));

    scrollHandler.stopTracking();

    expect(scrollHandler['containers']).toHaveLength(0);
  });

  test('should debounce scroll events', () => {
    document.body.innerHTML =
      '<div id="container" style="overflow: auto; height: 200px;"><div style="height: 1000px;"></div></div>';
    const container = document.getElementById('container') as HTMLElement;
    Object.defineProperty(container, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 200, configurable: true });
    Object.defineProperty(container, 'scrollTop', { value: 0, configurable: true, writable: true });

    scrollHandler = new ScrollHandler(mockEventManager);
    scrollHandler['set']('config', { id: 'test', scrollContainerSelectors: '#container' } as any);
    scrollHandler.startTracking();

    container.scrollTop = 50;
    container.dispatchEvent(new Event('scroll'));
    container.scrollTop = 100;
    container.dispatchEvent(new Event('scroll'));
    container.scrollTop = 150;
    container.dispatchEvent(new Event('scroll'));

    expect(mockEventManager.track).not.toHaveBeenCalled();

    vi.advanceTimersByTime(250);

    expect(mockEventManager.track).toHaveBeenCalledTimes(1);
  });
});
