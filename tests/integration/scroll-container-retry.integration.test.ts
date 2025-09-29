import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { App } from '@/app';

describe('ScrollHandler Integration - Container Retry', () => {
  let app: App;

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    vi.useFakeTimers();
  });

  afterEach(async () => {
    if (app) {
      await app.destroy();
    }
    document.body.innerHTML = '';
    vi.useRealTimers();
  });

  test('should find container after delay', async () => {
    app = new App();

    await app.init({
      id: 'skip',
      scrollContainerSelectors: '.delayed',
    });

    vi.advanceTimersByTime(300);

    document.body.innerHTML =
      '<div class="delayed" style="overflow: auto; height: 200px;"><div style="height: 1000px;"></div></div>';
    const container = document.querySelector('.delayed') as HTMLElement;
    Object.defineProperty(container, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 200, configurable: true });

    vi.advanceTimersByTime(300);

    const scrollHandler = app['handlers'].scroll;
    expect(scrollHandler?.['containers'].length).toBeGreaterThan(0);
  });

  test('should fallback to window', async () => {
    app = new App();

    await app.init({
      id: 'skip',
      scrollContainerSelectors: '.never-exists',
    });

    vi.advanceTimersByTime(1500);

    const scrollHandler = app['handlers'].scroll;
    expect(scrollHandler?.['containers'][0].element).toBe(window);
  });
});
