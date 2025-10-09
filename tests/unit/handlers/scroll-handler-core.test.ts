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

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    const testEnv = setupTestEnvironment();
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
    Object.defineProperty(container, 'offsetParent', { value: document.body, configurable: true });

    // Mock getBoundingClientRect for visibility check
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
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

    scrollHandler = new ScrollHandler(mockEventManager);
    scrollHandler['set']('config', { id: 'test' } as any);
    scrollHandler.startTracking();

    vi.advanceTimersByTime(1100);

    container.scrollTop = 400;
    container.dispatchEvent(new Event('scroll'));

    vi.advanceTimersByTime(300);

    expect(mockEventManager.track).toHaveBeenCalled();
    const call = mockEventManager.track.mock.calls[0][0];
    expect(call.scroll_data.depth).toBeGreaterThan(0);
    expect(call.scroll_data.depth).toBeLessThanOrEqual(100);
    expect(call.scroll_data.container_selector).toBeDefined();
    expect(call.scroll_data.is_primary).toBeDefined();
    expect(typeof call.scroll_data.is_primary).toBe('boolean');
  });

  test('should detect scroll direction down', () => {
    document.body.innerHTML =
      '<div id="container" style="overflow: auto; height: 200px;"><div style="height: 1000px;"></div></div>';
    const container = document.getElementById('container') as HTMLElement;
    Object.defineProperty(container, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 200, configurable: true });
    Object.defineProperty(container, 'scrollTop', { value: 0, configurable: true, writable: true });
    Object.defineProperty(container, 'offsetParent', { value: document.body, configurable: true });

    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
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

    scrollHandler = new ScrollHandler(mockEventManager);
    scrollHandler['set']('config', { id: 'test' } as any);
    scrollHandler.startTracking();

    vi.advanceTimersByTime(1100);

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
    Object.defineProperty(container, 'offsetParent', { value: document.body, configurable: true });

    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
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

    scrollHandler = new ScrollHandler(mockEventManager);
    scrollHandler['set']('config', { id: 'test' } as any);
    scrollHandler.startTracking();

    vi.advanceTimersByTime(1100);

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
    scrollHandler['set']('config', { id: 'test' } as any);

    const isScrollable = scrollHandler['isElementScrollable'](container);

    expect(isScrollable).toBe(false);
  });

  test('should cleanup timers on stopTracking', () => {
    document.body.innerHTML =
      '<div id="container" style="overflow: auto; height: 200px;"><div style="height: 1000px;"></div></div>';
    const container = document.getElementById('container') as HTMLElement;
    Object.defineProperty(container, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 200, configurable: true });
    Object.defineProperty(container, 'offsetParent', { value: document.body, configurable: true });

    scrollHandler = new ScrollHandler(mockEventManager);
    scrollHandler['set']('config', { id: 'test' } as any);
    scrollHandler.startTracking();

    vi.advanceTimersByTime(1100);

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
    Object.defineProperty(container, 'offsetParent', { value: document.body, configurable: true });

    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
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

    scrollHandler = new ScrollHandler(mockEventManager);
    scrollHandler['set']('config', { id: 'test' } as any);
    scrollHandler.startTracking();

    vi.advanceTimersByTime(1100);

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

  test('should calculate velocity correctly', () => {
    document.body.innerHTML =
      '<div id="container" style="overflow: auto; height: 200px;"><div style="height: 1000px;"></div></div>';
    const container = document.getElementById('container') as HTMLElement;
    Object.defineProperty(container, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 200, configurable: true });
    Object.defineProperty(container, 'scrollTop', { value: 0, configurable: true, writable: true });
    Object.defineProperty(container, 'offsetParent', { value: document.body, configurable: true });
    container.getBoundingClientRect = vi.fn().mockReturnValue({
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

    scrollHandler = new ScrollHandler(mockEventManager);
    scrollHandler['set']('config', { id: 'test' } as any);
    scrollHandler.startTracking();

    vi.advanceTimersByTime(1100);

    // First scroll - velocity should be 0 (no time reference)
    container.scrollTop = 100;
    container.dispatchEvent(new Event('scroll'));
    vi.advanceTimersByTime(300);

    expect(mockEventManager.track).toHaveBeenCalled();
    let call = mockEventManager.track.mock.calls[0][0];
    expect(call.scroll_data.velocity).toBe(0);

    mockEventManager.track.mockClear();

    // Second scroll after 1 second - velocity should be calculated
    vi.advanceTimersByTime(1000);
    container.scrollTop = 300; // 200px in 1s = 200 px/s
    container.dispatchEvent(new Event('scroll'));
    vi.advanceTimersByTime(300);

    expect(mockEventManager.track).toHaveBeenCalled();
    call = mockEventManager.track.mock.calls[0][0];
    expect(call.scroll_data.velocity).toBeGreaterThan(0);
  });

  test('should track max_depth_reached correctly', () => {
    document.body.innerHTML =
      '<div id="container" style="overflow: auto; height: 200px;"><div style="height: 1000px;"></div></div>';
    const container = document.getElementById('container') as HTMLElement;
    Object.defineProperty(container, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 200, configurable: true });
    Object.defineProperty(container, 'scrollTop', { value: 0, configurable: true, writable: true });
    Object.defineProperty(container, 'offsetParent', { value: document.body, configurable: true });
    container.getBoundingClientRect = vi.fn().mockReturnValue({
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

    scrollHandler = new ScrollHandler(mockEventManager);
    scrollHandler['set']('config', { id: 'test' } as any);
    scrollHandler.startTracking();

    vi.advanceTimersByTime(1100);

    // Scroll to 50% depth
    container.scrollTop = 400;
    container.dispatchEvent(new Event('scroll'));
    vi.advanceTimersByTime(300);

    let call = mockEventManager.track.mock.calls[0][0];
    const firstDepth = call.scroll_data.depth;
    expect(call.scroll_data.max_depth_reached).toBe(firstDepth);

    mockEventManager.track.mockClear();
    vi.advanceTimersByTime(500);

    // Scroll deeper to 75% depth - max should update
    container.scrollTop = 600;
    container.dispatchEvent(new Event('scroll'));
    vi.advanceTimersByTime(300);

    call = mockEventManager.track.mock.calls[0][0];
    const secondDepth = call.scroll_data.depth;
    expect(call.scroll_data.max_depth_reached).toBe(secondDepth);
    expect(call.scroll_data.max_depth_reached).toBeGreaterThan(firstDepth);

    mockEventManager.track.mockClear();
    vi.advanceTimersByTime(500);

    // Scroll back up to 25% - max should NOT change
    container.scrollTop = 200;
    container.dispatchEvent(new Event('scroll'));
    vi.advanceTimersByTime(300);

    call = mockEventManager.track.mock.calls[0][0];
    expect(call.scroll_data.depth).toBeLessThan(secondDepth);
    expect(call.scroll_data.max_depth_reached).toBe(secondDepth); // Should remain at previous max
  });

  test('should reset max_depth_reached on new session', () => {
    document.body.innerHTML =
      '<div id="container" style="overflow: auto; height: 200px;"><div style="height: 1000px;"></div></div>';
    const container = document.getElementById('container') as HTMLElement;
    Object.defineProperty(container, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 200, configurable: true });
    Object.defineProperty(container, 'scrollTop', { value: 0, configurable: true, writable: true });
    Object.defineProperty(container, 'offsetParent', { value: document.body, configurable: true });
    container.getBoundingClientRect = vi.fn().mockReturnValue({
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

    scrollHandler = new ScrollHandler(mockEventManager);
    scrollHandler['set']('config', { id: 'test' } as any);
    scrollHandler.startTracking();

    vi.advanceTimersByTime(1100);

    // First scroll to 50%
    container.scrollTop = 400;
    container.dispatchEvent(new Event('scroll'));
    vi.advanceTimersByTime(300);

    const firstCall = mockEventManager.track.mock.calls[0][0];
    const firstMaxDepth = firstCall.scroll_data.max_depth_reached;

    // Stop and restart tracking (simulating new session)
    scrollHandler.stopTracking();
    mockEventManager.track.mockClear();
    container.scrollTop = 0;

    scrollHandler.startTracking();
    vi.advanceTimersByTime(1100);

    // Scroll to 25% (less than previous max)
    container.scrollTop = 200;
    container.dispatchEvent(new Event('scroll'));
    vi.advanceTimersByTime(300);

    const secondCall = mockEventManager.track.mock.calls[0][0];
    expect(secondCall.scroll_data.max_depth_reached).toBeLessThan(firstMaxDepth);
    expect(secondCall.scroll_data.max_depth_reached).toBe(secondCall.scroll_data.depth);
  });

  test('should mark first container as primary when window not scrollable', () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 800, configurable: true });
    Object.defineProperty(document.documentElement, 'clientHeight', { value: 800, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });

    document.body.innerHTML = `
      <div id="main-container" style="overflow: auto; height: 400px;">
        <div style="height: 1000px;"></div>
      </div>
      <div id="sidebar-container" style="overflow: auto; height: 300px;">
        <div style="height: 800px;"></div>
      </div>
    `;

    const mainContainer = document.getElementById('main-container') as HTMLElement;
    const sidebarContainer = document.getElementById('sidebar-container') as HTMLElement;

    Object.defineProperty(mainContainer, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(mainContainer, 'clientHeight', { value: 400, configurable: true });
    Object.defineProperty(mainContainer, 'scrollTop', { value: 0, configurable: true, writable: true });
    Object.defineProperty(mainContainer, 'offsetParent', { value: document.body, configurable: true });
    mainContainer.getBoundingClientRect = vi.fn().mockReturnValue({
      width: 600,
      height: 400,
      top: 0,
      left: 0,
      bottom: 400,
      right: 600,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    Object.defineProperty(sidebarContainer, 'scrollHeight', { value: 800, configurable: true });
    Object.defineProperty(sidebarContainer, 'clientHeight', { value: 300, configurable: true });
    Object.defineProperty(sidebarContainer, 'scrollTop', { value: 0, configurable: true, writable: true });
    Object.defineProperty(sidebarContainer, 'offsetParent', { value: document.body, configurable: true });
    sidebarContainer.getBoundingClientRect = vi.fn().mockReturnValue({
      width: 200,
      height: 300,
      top: 0,
      left: 650,
      bottom: 300,
      right: 850,
      x: 650,
      y: 0,
      toJSON: () => {},
    });

    scrollHandler = new ScrollHandler(mockEventManager);
    scrollHandler['set']('config', { id: 'test' } as any);
    scrollHandler.startTracking();

    vi.advanceTimersByTime(1100);

    mainContainer.scrollTop = 300;
    mainContainer.dispatchEvent(new Event('scroll'));
    vi.advanceTimersByTime(300);

    sidebarContainer.scrollTop = 200;
    sidebarContainer.dispatchEvent(new Event('scroll'));
    vi.advanceTimersByTime(300);

    expect(mockEventManager.track).toHaveBeenCalledTimes(2);

    const mainCall = mockEventManager.track.mock.calls[0][0];
    expect(mainCall.scroll_data.container_selector).toBe('#main-container');
    expect(mainCall.scroll_data.is_primary).toBe(true);

    const sidebarCall = mockEventManager.track.mock.calls[1][0];
    expect(sidebarCall.scroll_data.container_selector).toBe('#sidebar-container');
    expect(sidebarCall.scroll_data.is_primary).toBe(false);
  });
});
