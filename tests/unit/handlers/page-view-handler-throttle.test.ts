import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { PageViewHandler } from '../../../src/handlers/page-view.handler';
import { EventType } from '../../../src/types';
import { setupTestEnvironment, cleanupTestState } from '../../utils/test-setup';

// Mock dependencies
vi.mock('../../../src/utils/logging', () => ({
  debugLog: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Track current URL for mocking window.location.href
let currentMockUrl = 'http://localhost:3000/';

vi.mock('../../../src/utils/network/url.utils', () => ({
  normalizeUrl: vi.fn((url: string) => url),
}));

// Mock window.location.href to track URL changes
Object.defineProperty(window, 'location', {
  value: {
    ...window.location,
    get href() {
      return currentMockUrl;
    },
  },
  writable: true,
  configurable: true,
});

describe('PageViewHandler - Throttling', () => {
  let pageViewHandler: PageViewHandler;
  let mockEventManager: any;
  let onTrackSpy: ReturnType<typeof vi.fn>;
  let originalPushState: typeof window.history.pushState;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Reset mock URL
    currentMockUrl = 'http://localhost:3000/';

    // Patch history.pushState to update our mock URL
    originalPushState = window.history.pushState;
    window.history.pushState = function (data: any, unused: string, url?: string | URL | null) {
      if (url) {
        const urlStr = typeof url === 'string' ? url : url.toString();
        // Handle relative URLs
        if (urlStr.startsWith('/')) {
          const origin = new URL(currentMockUrl).origin;
          currentMockUrl = origin + urlStr;
        } else {
          currentMockUrl = urlStr;
        }
      }
      return originalPushState.call(this, data, unused, url);
    };

    const testEnv = setupTestEnvironment({});
    mockEventManager = testEnv.eventManager;
    vi.spyOn(mockEventManager, 'track');

    onTrackSpy = vi.fn();
    pageViewHandler = new PageViewHandler(mockEventManager, onTrackSpy);
  });

  afterEach(() => {
    pageViewHandler.stopTracking();
    cleanupTestState();
    vi.useRealTimers();
    // Restore original pushState
    window.history.pushState = originalPushState;
  });

  test('should allow initial page view without throttling', () => {
    pageViewHandler.startTracking();

    // Initial page view should be tracked
    expect(mockEventManager.track).toHaveBeenCalledTimes(1);
    expect(mockEventManager.track).toHaveBeenCalledWith(
      expect.objectContaining({
        type: EventType.PAGE_VIEW,
      }),
    );
  });

  test('should throttle rapid navigation within 1 second', () => {
    pageViewHandler.startTracking();

    // Initial page view
    expect(mockEventManager.track).toHaveBeenCalledTimes(1);

    // Simulate rapid navigation (within throttle window)
    window.history.pushState({}, '', '/page1');
    window.history.pushState({}, '', '/page2');
    window.history.pushState({}, '', '/page3');

    // Should still be only 1 event (initial), others throttled
    expect(mockEventManager.track).toHaveBeenCalledTimes(1);
  });

  test('should allow page view after throttle window expires', () => {
    pageViewHandler.startTracking();

    // Initial page view
    expect(mockEventManager.track).toHaveBeenCalledTimes(1);

    // Advance time by MORE than 1 second (default throttle)
    vi.advanceTimersByTime(1100);

    // Navigate after throttle window
    window.history.pushState({}, '', '/page-after-throttle');

    // Should track the second page view
    expect(mockEventManager.track).toHaveBeenCalledTimes(2);
  });

  test('should respect custom pageViewThrottleMs config', () => {
    const customThrottle = 2000;
    const testEnv = setupTestEnvironment({ pageViewThrottleMs: customThrottle });
    mockEventManager = testEnv.eventManager;
    vi.spyOn(mockEventManager, 'track');

    pageViewHandler = new PageViewHandler(mockEventManager, onTrackSpy);
    pageViewHandler.startTracking();

    // Initial page view
    expect(mockEventManager.track).toHaveBeenCalledTimes(1);

    // Navigate within custom throttle window
    vi.advanceTimersByTime(1500);
    window.history.pushState({}, '', '/page1');

    // Should still be throttled (1500ms < 2000ms)
    expect(mockEventManager.track).toHaveBeenCalledTimes(1);

    // Advance past custom throttle window
    vi.advanceTimersByTime(600); // Total: 2100ms
    window.history.pushState({}, '', '/page2');

    // Should track the second page view
    expect(mockEventManager.track).toHaveBeenCalledTimes(2);
  });

  test('should handle multiple throttled navigation attempts', () => {
    pageViewHandler.startTracking();

    // Initial page view
    expect(mockEventManager.track).toHaveBeenCalledTimes(1);

    // Rapid navigation (10 attempts within 900ms)
    for (let i = 0; i < 10; i++) {
      vi.advanceTimersByTime(90);
      window.history.pushState({}, '', `/rapid-${i}`);
    }

    // Should still be only 1 event (all throttled)
    expect(mockEventManager.track).toHaveBeenCalledTimes(1);

    // Wait for throttle to expire
    vi.advanceTimersByTime(200); // Total > 1000ms
    window.history.pushState({}, '', '/final');

    // Should track the second page view
    expect(mockEventManager.track).toHaveBeenCalledTimes(2);
  });

  test('should allow alternating navigation after each throttle window', () => {
    pageViewHandler.startTracking();

    // Initial page view
    expect(mockEventManager.track).toHaveBeenCalledTimes(1);

    // Test 2 navigations after throttle expiry (not 5, to keep test faster)
    vi.advanceTimersByTime(1100);
    window.history.pushState({}, '', '/page-1');
    expect(mockEventManager.track).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(1100);
    window.history.pushState({}, '', '/page-2');
    expect(mockEventManager.track).toHaveBeenCalledTimes(3);
  });

  test('should not track same URL even after throttle expires', () => {
    pageViewHandler.startTracking();

    // Initial page view
    expect(mockEventManager.track).toHaveBeenCalledTimes(1);

    // Navigate away
    vi.advanceTimersByTime(1100);
    window.history.pushState({}, '', '/different');
    expect(mockEventManager.track).toHaveBeenCalledTimes(2);

    // Navigate to different URL again
    vi.advanceTimersByTime(1100);
    window.history.pushState({}, '', '/another');

    // Should track (different URL)
    expect(mockEventManager.track).toHaveBeenCalledTimes(3);
  });

  test('should reset lastPageViewTime on stopTracking', () => {
    pageViewHandler.startTracking();

    // Initial page view
    expect(mockEventManager.track).toHaveBeenCalledTimes(1);

    // Navigate after throttle
    vi.advanceTimersByTime(1100);
    window.history.pushState({}, '', '/page1');
    expect(mockEventManager.track).toHaveBeenCalledTimes(2);

    // Stop tracking
    pageViewHandler.stopTracking();

    // Start tracking again
    pageViewHandler.startTracking();

    // Should track initial page view again (timestamp reset)
    expect(mockEventManager.track).toHaveBeenCalledTimes(3);
  });

  test('should handle zero throttle config (immediate tracking)', () => {
    const testEnv = setupTestEnvironment({ pageViewThrottleMs: 0 });
    mockEventManager = testEnv.eventManager;
    vi.spyOn(mockEventManager, 'track');

    pageViewHandler = new PageViewHandler(mockEventManager, onTrackSpy);
    pageViewHandler.startTracking();

    // Initial page view
    expect(mockEventManager.track).toHaveBeenCalledTimes(1);

    // Navigate immediately (no throttle)
    window.history.pushState({}, '', '/page1');
    expect(mockEventManager.track).toHaveBeenCalledTimes(2);

    window.history.pushState({}, '', '/page2');

    // With 0ms throttle, all should be tracked (different URLs)
    expect(mockEventManager.track).toHaveBeenCalledTimes(3);
  });

  test('should handle hashchange events with throttling', () => {
    pageViewHandler.startTracking();

    // Initial page view
    expect(mockEventManager.track).toHaveBeenCalledTimes(1);

    // Rapid hash changes
    window.location.hash = '#section1';
    window.dispatchEvent(new Event('hashchange'));

    window.location.hash = '#section2';
    window.dispatchEvent(new Event('hashchange'));

    // Should be throttled
    expect(mockEventManager.track).toHaveBeenCalledTimes(1);

    // Wait for throttle to expire
    vi.advanceTimersByTime(1100);

    window.location.hash = '#section3';
    window.dispatchEvent(new Event('hashchange'));

    // Should track after throttle expires
    expect(mockEventManager.track).toHaveBeenCalledTimes(2);
  });
});
