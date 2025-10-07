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

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    const testEnv = await setupTestEnvironment();
    mockEventManager = testEnv.eventManager;
    document.body.innerHTML = '';
  });

  afterEach(() => {
    scrollHandler?.stopTracking();
    document.body.innerHTML = '';
    cleanupTestState();
    vi.useRealTimers();
  });

  test('should use window when no selectors configured', () => {
    scrollHandler = new ScrollHandler(mockEventManager);
    scrollHandler['set']('config', { id: 'test' } as any);

    scrollHandler.startTracking();

    expect(scrollHandler['containers']).toHaveLength(1);
    expect(scrollHandler['containers'][0].element).toBe(window);
  });

  test('should setup container when element exists', () => {
    document.body.innerHTML = '<div id="scroll-box" style="overflow: auto; height: 100px;"></div>';
    const container = document.getElementById('scroll-box') as HTMLElement;
    Object.defineProperty(container, 'scrollHeight', { value: 200, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 100, configurable: true });

    scrollHandler = new ScrollHandler(mockEventManager);
    scrollHandler['set']('config', { id: 'test', scrollContainerSelectors: '#scroll-box' } as any);

    scrollHandler.startTracking();

    expect(scrollHandler['containers']).toHaveLength(1);
    expect(scrollHandler['containers'][0].element).toBe(container);
  });

  test('should find element after retry', () => {
    scrollHandler = new ScrollHandler(mockEventManager);
    scrollHandler['set']('config', { id: 'test', scrollContainerSelectors: '.delayed' } as any);

    scrollHandler.startTracking();
    expect(scrollHandler['containers']).toHaveLength(0);

    vi.advanceTimersByTime(300);

    document.body.innerHTML = '<div class="delayed" style="overflow: auto; height: 100px;"></div>';
    const container = document.querySelector('.delayed') as HTMLElement;
    Object.defineProperty(container, 'scrollHeight', { value: 200, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 100, configurable: true });

    vi.advanceTimersByTime(200);

    expect(scrollHandler['containers']).toHaveLength(1);
  });

  test('should fallback to window after max retries', () => {
    scrollHandler = new ScrollHandler(mockEventManager);
    scrollHandler['set']('config', { id: 'test', scrollContainerSelectors: '.never-exists' } as any);

    scrollHandler.startTracking();
    vi.advanceTimersByTime(1000);

    expect(scrollHandler['containers']).toHaveLength(1);
    expect(scrollHandler['containers'][0].element).toBe(window);
  });

  test('should not add duplicate containers', () => {
    document.body.innerHTML = '<div id="once" style="overflow: auto; height: 100px;"></div>';
    const container = document.getElementById('once') as HTMLElement;
    Object.defineProperty(container, 'scrollHeight', { value: 200, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 100, configurable: true });

    scrollHandler = new ScrollHandler(mockEventManager);
    scrollHandler['set']('config', { id: 'test', scrollContainerSelectors: '#once' } as any);

    scrollHandler.startTracking();
    vi.advanceTimersByTime(1000);

    expect(scrollHandler['containers']).toHaveLength(1);
  });
});
