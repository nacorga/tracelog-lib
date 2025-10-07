import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { App } from '../../src/app';

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

  test('should track scroll with correct setup', async () => {
    document.body.innerHTML =
      '<div id="scroll-container" style="overflow: auto; height: 300px;"><div style="height: 1500px;"></div></div>';
    const container = document.getElementById('scroll-container') as HTMLElement;
    Object.defineProperty(container, 'scrollHeight', { value: 1500, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 300, configurable: true });

    app = new App();
    await app.init({
      scrollContainerSelectors: '#scroll-container',
    });

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

    Object.defineProperty(container2, 'scrollHeight', { value: 800, configurable: true });
    Object.defineProperty(container2, 'clientHeight', { value: 200, configurable: true });

    app = new App();
    await app.init({
      scrollContainerSelectors: ['#container-1', '#container-2'],
    });

    const scrollHandler = app['handlers'].scroll;
    expect(scrollHandler?.['containers'].length).toBe(2);
  });

  test('should cleanup listeners and timers on destroy', async () => {
    document.body.innerHTML =
      '<div id="container" style="overflow: auto; height: 200px;"><div style="height: 800px;"></div></div>';
    const container = document.getElementById('container') as HTMLElement;
    Object.defineProperty(container, 'scrollHeight', { value: 800, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 200, configurable: true });
    Object.defineProperty(container, 'scrollTop', { value: 0, configurable: true, writable: true });

    app = new App();
    await app.init({
      scrollContainerSelectors: '#container',
    });

    const scrollHandler = app['handlers'].scroll;
    expect(scrollHandler?.['containers'].length).toBeGreaterThan(0);

    container.scrollTop = 100;
    container.dispatchEvent(new Event('scroll'));

    app.destroy();

    expect(scrollHandler?.['containers'].length).toBe(0);

    vi.advanceTimersByTime(300);
  });
});
