import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { tracelog } from '../../../src/public-api';
import { EmitterEvent, EventData, EventType } from '../../../src/types';

describe('primaryScrollSelector config option', () => {
  beforeEach(() => {
    // Ensure clean state before each test
    if (tracelog.isInitialized()) {
      tracelog.destroy();
    }

    vi.useFakeTimers();
    document.body.innerHTML = `
      <div id="app-content" style="overflow: auto; height: 500px;">
        <div style="height: 1200px;">App content</div>
      </div>
      <div id="sidebar" style="overflow: auto; height: 300px;">
        <div style="height: 800px;">Sidebar</div>
      </div>
    `;

    // Setup properties for app-content
    const appContent = document.getElementById('app-content') as HTMLElement;
    Object.defineProperty(appContent, 'scrollHeight', { value: 1200, configurable: true });
    Object.defineProperty(appContent, 'clientHeight', { value: 500, configurable: true });
    Object.defineProperty(appContent, 'scrollTop', { value: 0, configurable: true, writable: true });
    Object.defineProperty(appContent, 'offsetParent', { value: document.body, configurable: true });
    vi.spyOn(appContent, 'getBoundingClientRect').mockReturnValue({
      width: 500,
      height: 500,
      top: 0,
      left: 0,
      bottom: 500,
      right: 500,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    // Setup properties for sidebar
    const sidebar = document.getElementById('sidebar') as HTMLElement;
    Object.defineProperty(sidebar, 'scrollHeight', { value: 800, configurable: true });
    Object.defineProperty(sidebar, 'clientHeight', { value: 300, configurable: true });
    Object.defineProperty(sidebar, 'scrollTop', { value: 0, configurable: true, writable: true });
    Object.defineProperty(sidebar, 'offsetParent', { value: document.body, configurable: true });
    vi.spyOn(sidebar, 'getBoundingClientRect').mockReturnValue({
      width: 300,
      height: 300,
      top: 0,
      left: 500,
      bottom: 300,
      right: 800,
      x: 500,
      y: 0,
      toJSON: () => {},
    });

    // Make window non-scrollable
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 600, configurable: true });
    Object.defineProperty(document.documentElement, 'clientHeight', { value: 600, configurable: true });
  });

  afterEach(() => {
    try {
      if (tracelog.isInitialized()) {
        tracelog.destroy();
      }
    } catch {
      // Ignore cleanup errors
    }
    document.body.innerHTML = '';
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  test('should use primaryScrollSelector from config', async () => {
    await tracelog.init({
      primaryScrollSelector: '#app-content',
    });

    vi.advanceTimersByTime(1100); // Wait for scroll container detection

    const events: any[] = [];
    tracelog.on(EmitterEvent.EVENT, (event: EventData) => {
      if (event.type === EventType.SCROLL) {
        events.push(event);
      }
    });

    const appContent = document.getElementById('app-content') as HTMLElement;
    appContent.scrollTop = 100;
    appContent.dispatchEvent(new Event('scroll'));

    vi.advanceTimersByTime(300); // Wait for debounce

    const appEvent = events.find((e) => e.scroll_data?.container_selector === '#app-content');
    expect(appEvent).toBeDefined();
    expect(appEvent?.scroll_data.is_primary).toBe(true);

    // Sidebar should be secondary
    events.length = 0;
    const sidebar = document.getElementById('sidebar') as HTMLElement;
    sidebar.scrollTop = 50;
    sidebar.dispatchEvent(new Event('scroll'));

    vi.advanceTimersByTime(300);

    const sidebarEvent = events.find((e) => e.scroll_data?.container_selector === '#sidebar');
    expect(sidebarEvent).toBeDefined();
    expect(sidebarEvent?.scroll_data.is_primary).toBe(false);
  });

  test('should override automatic detection with primaryScrollSelector', async () => {
    await tracelog.init({
      primaryScrollSelector: '#sidebar',
    });

    vi.advanceTimersByTime(1100);

    const events: any[] = [];
    tracelog.on(EmitterEvent.EVENT, (event: EventData) => {
      if (event.type === EventType.SCROLL) {
        events.push(event);
      }
    });

    // Sidebar should be primary (overriding default first-detected behavior)
    const sidebar = document.getElementById('sidebar') as HTMLElement;
    sidebar.scrollTop = 50;
    sidebar.dispatchEvent(new Event('scroll'));

    vi.advanceTimersByTime(300);

    const sidebarEvent = events.find((e) => e.scroll_data?.container_selector === '#sidebar');
    expect(sidebarEvent).toBeDefined();
    expect(sidebarEvent?.scroll_data.is_primary).toBe(true);

    // App content should be secondary
    events.length = 0;
    const appContent = document.getElementById('app-content') as HTMLElement;
    appContent.scrollTop = 100;
    appContent.dispatchEvent(new Event('scroll'));

    vi.advanceTimersByTime(300);

    const appEvent = events.find((e) => e.scroll_data?.container_selector === '#app-content');
    expect(appEvent).toBeDefined();
    expect(appEvent?.scroll_data.is_primary).toBe(false);
  });

  test('should accept window as primaryScrollSelector', async () => {
    // Verify config accepts 'window' as a valid selector
    await expect(
      tracelog.init({
        primaryScrollSelector: 'window',
      }),
    ).resolves.not.toThrow();
  });
});
