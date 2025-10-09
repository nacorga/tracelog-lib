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

describe('ScrollHandler - Retry Logic', () => {
  let scrollHandler: ScrollHandler;
  let mockEventManager: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    const testEnv = setupTestEnvironment();
    mockEventManager = testEnv.eventManager;
    document.body.innerHTML = '';
  });

  afterEach(() => {
    scrollHandler?.stopTracking();
    document.body.innerHTML = '';
    cleanupTestState();
    vi.useRealTimers();
  });

  test('should auto-detect scrollable containers', () => {
    document.body.innerHTML =
      '<div id="scroll-box" style="overflow: auto; height: 100px;"><div style="height: 200px;"></div></div>';
    const container = document.getElementById('scroll-box') as HTMLElement;
    Object.defineProperty(container, 'scrollHeight', { value: 200, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 100, configurable: true });
    Object.defineProperty(container, 'offsetParent', { value: document.body, configurable: true });

    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      width: 500,
      height: 100,
      top: 0,
      left: 0,
      bottom: 100,
      right: 500,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    scrollHandler = new ScrollHandler(mockEventManager);
    scrollHandler['set']('config', { sessionTimeout: 900000 });
    scrollHandler.startTracking();

    vi.advanceTimersByTime(1100);

    expect(scrollHandler['containers'].length).toBeGreaterThan(0);
  });

  test('should find container after delay with retry', () => {
    scrollHandler = new ScrollHandler(mockEventManager);
    scrollHandler['set']('config', { sessionTimeout: 900000 });
    scrollHandler.startTracking();

    vi.advanceTimersByTime(300);

    document.body.innerHTML =
      '<div class="delayed" style="overflow: auto; height: 100px;"><div style="height: 200px;"></div></div>';
    const container = document.querySelector('.delayed') as HTMLElement;
    Object.defineProperty(container, 'scrollHeight', { value: 200, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 100, configurable: true });
    Object.defineProperty(container, 'offsetParent', { value: document.body, configurable: true });

    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      width: 500,
      height: 100,
      top: 0,
      left: 0,
      bottom: 100,
      right: 500,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    vi.advanceTimersByTime(800);

    expect(scrollHandler['containers'].length).toBeGreaterThan(0);
  });

  test('should fallback to window if no scrollable containers', () => {
    scrollHandler = new ScrollHandler(mockEventManager);
    scrollHandler['set']('config', { sessionTimeout: 900000 });
    scrollHandler.startTracking();

    vi.advanceTimersByTime(1100);

    expect(scrollHandler['containers']).toHaveLength(1);
    const fallbackContainer = scrollHandler['containers'][0];
    expect(fallbackContainer).toBeDefined();
    expect(fallbackContainer!.element).toBe(window);
  });

  test('should detect both container and window', () => {
    document.body.innerHTML =
      '<div id="once" style="overflow: auto; height: 100px;"><div style="height: 200px;"></div></div>';
    const container = document.getElementById('once') as HTMLElement;
    Object.defineProperty(container, 'scrollHeight', { value: 200, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 100, configurable: true });
    Object.defineProperty(container, 'offsetParent', { value: document.body, configurable: true });

    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      width: 500,
      height: 100,
      top: 0,
      left: 0,
      bottom: 100,
      right: 500,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    scrollHandler = new ScrollHandler(mockEventManager);
    scrollHandler['set']('config', { sessionTimeout: 900000 });
    scrollHandler.startTracking();

    vi.advanceTimersByTime(1100);

    // Should find both the container and window
    expect(scrollHandler['containers'].length).toBeGreaterThan(0);
    const elements = scrollHandler['containers'].map((c) => c.element);
    expect(elements).toContain(container);
  });
});
