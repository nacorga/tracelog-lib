/**
 * PageViewHandler Unit Tests
 *
 * Tests for page view tracking functionality including:
 * - Initial page view tracking
 * - Navigation detection (popstate, hashchange)
 * - History API patching (pushState, replaceState)
 * - URL normalization and sensitive param filtering
 * - Lifecycle management (start/stop)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PageViewHandler } from '../../src/handlers/page-view.handler';
import { EventManager } from '../../src/managers/event.manager';
import { StorageManager } from '../../src/managers/storage.manager';
import { EventType } from '../../src/types';

// Track current URL for mocking window.location.href
let currentTestUrl = 'http://localhost:3000/';

describe('PageViewHandler', () => {
  let pageViewHandler: PageViewHandler;
  let eventManager: EventManager;
  let storageManager: StorageManager;
  let onTrackCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Reset mock URL
    currentTestUrl = 'http://localhost:3000/';

    // Mock window.location.href to track URL changes
    Object.defineProperty(window, 'location', {
      value: {
        get href() {
          return currentTestUrl;
        },
        pathname: '/',
        search: '',
        hash: '',
      },
      writable: true,
      configurable: true,
    });

    // Patch history.pushState to update our mock URL
    const originalPushState = window.history.pushState;
    window.history.pushState = function (data: any, unused: string, url?: string | URL | null) {
      if (url) {
        const urlStr = typeof url === 'string' ? url : url.toString();
        if (urlStr.startsWith('/')) {
          const origin = new URL(currentTestUrl).origin;
          currentTestUrl = origin + urlStr;
        } else {
          currentTestUrl = urlStr;
        }
      }
      return originalPushState.call(this, data, unused, url);
    };

    // Patch history.replaceState similarly
    const originalReplaceState = window.history.replaceState;
    window.history.replaceState = function (data: any, unused: string, url?: string | URL | null) {
      if (url) {
        const urlStr = typeof url === 'string' ? url : url.toString();
        if (urlStr.startsWith('/')) {
          const origin = new URL(currentTestUrl).origin;
          currentTestUrl = origin + urlStr;
        } else {
          currentTestUrl = urlStr;
        }
      }
      return originalReplaceState.call(this, data, unused, url);
    };

    Object.defineProperty(document, 'referrer', {
      value: '',
      writable: true,
      configurable: true,
    });

    Object.defineProperty(document, 'title', {
      value: 'Test Page',
      writable: true,
      configurable: true,
    });

    // Create instances
    storageManager = new StorageManager();
    eventManager = new EventManager(storageManager);
    onTrackCallback = vi.fn();
    pageViewHandler = new PageViewHandler(eventManager, onTrackCallback);

    // Mock global state
    const getSpy = vi.spyOn(pageViewHandler as any, 'get');
    getSpy.mockImplementation(((key: any) => {
      if (key === 'config') {
        return { sensitiveQueryParams: [], pageViewThrottleMs: 1000 };
      }
      if (key === 'pageUrl') {
        return undefined;
      }
      return undefined;
    }) as any);

    const setSpy = vi.spyOn(pageViewHandler as any, 'set');
    setSpy.mockImplementation((() => {}) as any);
  });

  afterEach(() => {
    if (pageViewHandler) {
      pageViewHandler.stopTracking();
    }
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should create instance with event manager and callback', () => {
      expect(pageViewHandler).toBeDefined();
      expect(pageViewHandler).toBeInstanceOf(PageViewHandler);
    });
  });

  describe('startTracking()', () => {
    it('should track initial page view', () => {
      const trackSpy = vi.spyOn(eventManager, 'track');

      pageViewHandler.startTracking();

      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventType.PAGE_VIEW,
          page_url: expect.any(String),
        }),
      );
    });

    it('should call onTrack callback for initial page view', () => {
      pageViewHandler.startTracking();

      expect(onTrackCallback).toHaveBeenCalled();
    });

    it('should include page view data in initial event', () => {
      const trackSpy = vi.spyOn(eventManager, 'track');

      pageViewHandler.startTracking();

      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventType.PAGE_VIEW,
          page_view: expect.objectContaining({
            title: 'Test Page',
            pathname: '/',
          }),
        }),
      );
    });

    it('should register popstate event listener', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      pageViewHandler.startTracking();

      expect(addEventListenerSpy).toHaveBeenCalledWith('popstate', expect.any(Function), true);
    });

    it('should register hashchange event listener', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      pageViewHandler.startTracking();

      expect(addEventListenerSpy).toHaveBeenCalledWith('hashchange', expect.any(Function), true);
    });

    it('should patch history.pushState', () => {
      const originalPushState = window.history.pushState;

      pageViewHandler.startTracking();

      expect(window.history.pushState).not.toBe(originalPushState);
    });

    it('should patch history.replaceState', () => {
      const originalReplaceState = window.history.replaceState;

      pageViewHandler.startTracking();

      expect(window.history.replaceState).not.toBe(originalReplaceState);
    });
  });

  describe('stopTracking()', () => {
    beforeEach(() => {
      pageViewHandler.startTracking();
    });

    it('should remove popstate event listener', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      pageViewHandler.stopTracking();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('popstate', expect.any(Function), true);
    });

    it('should remove hashchange event listener', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      pageViewHandler.stopTracking();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('hashchange', expect.any(Function), true);
    });

    it('should restore original pushState', () => {
      const originalPushState = (pageViewHandler as any).originalPushState;

      pageViewHandler.stopTracking();

      expect(window.history.pushState).toBe(originalPushState);
    });

    it('should restore original replaceState', () => {
      const originalReplaceState = (pageViewHandler as any).originalReplaceState;

      pageViewHandler.stopTracking();

      expect(window.history.replaceState).toBe(originalReplaceState);
    });
  });

  describe('History API Patching', () => {
    beforeEach(() => {
      pageViewHandler.startTracking();
    });

    it('should track page view on pushState', () => {
      const trackSpy = vi.spyOn(eventManager, 'track');
      trackSpy.mockClear(); // Clear initial page view

      // Mock URL change - update getSpy to return current URL
      const getSpy = vi.spyOn(pageViewHandler as any, 'get');
      getSpy.mockImplementation(((key: any) => {
        if (key === 'config') return { sensitiveQueryParams: [], pageViewThrottleMs: 1000 };
        if (key === 'pageUrl') return 'http://localhost:3000/';
        return undefined;
      }) as any);

      // Advance time past throttle
      vi.advanceTimersByTime(1100);

      window.history.pushState({}, '', '/new-page');

      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventType.PAGE_VIEW,
        }),
      );
    });

    it('should track page view on replaceState', () => {
      const trackSpy = vi.spyOn(eventManager, 'track');
      trackSpy.mockClear();

      const getSpy = vi.spyOn(pageViewHandler as any, 'get');
      getSpy.mockImplementation(((key: any) => {
        if (key === 'config') return { sensitiveQueryParams: [], pageViewThrottleMs: 1000 };
        if (key === 'pageUrl') return 'http://localhost:3000/';
        return undefined;
      }) as any);

      // Advance time past throttle
      vi.advanceTimersByTime(1100);

      window.history.replaceState({}, '', '/replaced');

      expect(trackSpy).toHaveBeenCalled();
    });

    it('should call onTrack callback on navigation', () => {
      onTrackCallback.mockClear();

      const getSpy = vi.spyOn(pageViewHandler as any, 'get');
      getSpy.mockImplementation(((key: any) => {
        if (key === 'config') return { sensitiveQueryParams: [], pageViewThrottleMs: 1000 };
        if (key === 'pageUrl') return 'http://localhost:3000/';
        return undefined;
      }) as any);

      // Advance time past throttle
      vi.advanceTimersByTime(1100);

      window.history.pushState({}, '', '/page2');

      expect(onTrackCallback).toHaveBeenCalled();
    });
  });

  describe('Navigation Events', () => {
    beforeEach(() => {
      pageViewHandler.startTracking();
    });

    it('should track page view on popstate event', () => {
      const trackSpy = vi.spyOn(eventManager, 'track');
      trackSpy.mockClear();

      const getSpy = vi.spyOn(pageViewHandler as any, 'get');
      getSpy.mockImplementation(((key: any) => {
        if (key === 'config') return { sensitiveQueryParams: [], pageViewThrottleMs: 1000 };
        if (key === 'pageUrl') return 'http://localhost:3000/';
        return undefined;
      }) as any);

      // Advance time past throttle
      vi.advanceTimersByTime(1100);

      // Update current URL
      currentTestUrl = 'http://localhost:3000/back';

      const popstateEvent = new PopStateEvent('popstate', { state: {} });
      window.dispatchEvent(popstateEvent);

      expect(trackSpy).toHaveBeenCalled();
    });

    it('should track page view on hashchange event', () => {
      const trackSpy = vi.spyOn(eventManager, 'track');
      trackSpy.mockClear();

      const getSpy = vi.spyOn(pageViewHandler as any, 'get');
      getSpy.mockImplementation(((key: any) => {
        if (key === 'config') return { sensitiveQueryParams: [], pageViewThrottleMs: 1000 };
        if (key === 'pageUrl') return 'http://localhost:3000/';
        return undefined;
      }) as any);

      // Advance time past throttle
      vi.advanceTimersByTime(1100);

      // Update current URL
      currentTestUrl = 'http://localhost:3000/#section';

      const hashchangeEvent = new HashChangeEvent('hashchange', {
        oldURL: 'http://localhost:3000/',
        newURL: 'http://localhost:3000/#section',
      });
      window.dispatchEvent(hashchangeEvent);

      expect(trackSpy).toHaveBeenCalled();
    });
  });

  describe('URL Normalization', () => {
    it('should normalize URL with sensitive query params', () => {
      const getSpy = vi.spyOn(pageViewHandler as any, 'get');
      getSpy.mockImplementation(((key: any) => {
        if (key === 'config') {
          return { sensitiveQueryParams: ['token', 'api_key'] };
        }
        return undefined;
      }) as any);

      Object.defineProperty(window, 'location', {
        value: {
          href: 'http://localhost:3000/?token=secret&api_key=123&page=1',
          pathname: '/',
          search: '?token=secret&api_key=123&page=1',
          hash: '',
        },
        writable: true,
        configurable: true,
      });

      const trackSpy = vi.spyOn(eventManager, 'track');

      pageViewHandler.startTracking();

      // Should not include sensitive params in tracked URL
      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventType.PAGE_VIEW,
          page_url: expect.not.stringContaining('token=secret'),
        }),
      );
    });
  });

  describe('Deduplication', () => {
    beforeEach(() => {
      pageViewHandler.startTracking();
    });

    it('should not track duplicate page views for same URL', () => {
      const trackSpy = vi.spyOn(eventManager, 'track');
      trackSpy.mockClear();

      // Mock that current page URL matches
      const getSpy = vi.spyOn(pageViewHandler as any, 'get');
      getSpy.mockImplementation(((key: any) => {
        if (key === 'config') return { sensitiveQueryParams: [], pageViewThrottleMs: 1000 };
        if (key === 'pageUrl') return 'http://localhost:3000/';
        return undefined;
      }) as any);

      // Try to track same page
      const popstateEvent = new PopStateEvent('popstate', { state: {} });
      window.dispatchEvent(popstateEvent);

      expect(trackSpy).not.toHaveBeenCalled();
    });
  });

  describe('Page View Data Extraction', () => {
    it('should extract referrer when available', () => {
      Object.defineProperty(document, 'referrer', {
        value: 'http://google.com',
        writable: true,
        configurable: true,
      });

      const trackSpy = vi.spyOn(eventManager, 'track');

      pageViewHandler.startTracking();

      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          page_view: expect.objectContaining({
            referrer: 'http://google.com',
          }),
        }),
      );
    });

    it('should extract title when available', () => {
      Object.defineProperty(document, 'title', {
        value: 'My Page Title',
        writable: true,
        configurable: true,
      });

      const trackSpy = vi.spyOn(eventManager, 'track');

      pageViewHandler.startTracking();

      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          page_view: expect.objectContaining({
            title: 'My Page Title',
          }),
        }),
      );
    });

    it('should extract pathname when available', () => {
      Object.defineProperty(window, 'location', {
        value: {
          href: 'http://localhost:3000/products',
          pathname: '/products',
          search: '',
          hash: '',
        },
        writable: true,
        configurable: true,
      });

      const trackSpy = vi.spyOn(eventManager, 'track');

      pageViewHandler.startTracking();

      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          page_view: expect.objectContaining({
            pathname: '/products',
          }),
        }),
      );
    });

    it('should extract search params when available', () => {
      Object.defineProperty(window, 'location', {
        value: {
          href: 'http://localhost:3000/?query=test',
          pathname: '/',
          search: '?query=test',
          hash: '',
        },
        writable: true,
        configurable: true,
      });

      const trackSpy = vi.spyOn(eventManager, 'track');

      pageViewHandler.startTracking();

      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          page_view: expect.objectContaining({
            search: '?query=test',
          }),
        }),
      );
    });

    it('should extract hash when available', () => {
      Object.defineProperty(window, 'location', {
        value: {
          href: 'http://localhost:3000/#section-1',
          pathname: '/',
          search: '',
          hash: '#section-1',
        },
        writable: true,
        configurable: true,
      });

      const trackSpy = vi.spyOn(eventManager, 'track');

      pageViewHandler.startTracking();

      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          page_view: expect.objectContaining({
            hash: '#section-1',
          }),
        }),
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing document title gracefully', () => {
      Object.defineProperty(document, 'title', {
        value: '',
        writable: true,
        configurable: true,
      });

      const trackSpy = vi.spyOn(eventManager, 'track');

      expect(() => {
        pageViewHandler.startTracking();
      }).not.toThrow();
      expect(trackSpy).toHaveBeenCalled();
    });

    it('should handle missing referrer gracefully', () => {
      Object.defineProperty(document, 'referrer', {
        value: '',
        writable: true,
        configurable: true,
      });

      const trackSpy = vi.spyOn(eventManager, 'track');

      expect(() => {
        pageViewHandler.startTracking();
      }).not.toThrow();
      expect(trackSpy).toHaveBeenCalled();
    });

    it('should handle multiple start/stop cycles', () => {
      expect(() => {
        pageViewHandler.startTracking();
        pageViewHandler.stopTracking();
        pageViewHandler.startTracking();
        pageViewHandler.stopTracking();
      }).not.toThrow();
    });
  });

  describe('from_page_url Tracking', () => {
    beforeEach(() => {
      pageViewHandler.startTracking();
    });

    it('should include from_page_url on navigation', () => {
      const trackSpy = vi.spyOn(eventManager, 'track');
      trackSpy.mockClear();

      const getSpy = vi.spyOn(pageViewHandler as any, 'get');
      getSpy.mockImplementation(((key: any) => {
        if (key === 'config') return { sensitiveQueryParams: [], pageViewThrottleMs: 1000 };
        if (key === 'pageUrl') return 'http://localhost:3000/previous';
        return undefined;
      }) as any);

      // Advance time past throttle
      vi.advanceTimersByTime(1100);

      window.history.pushState({}, '', '/current');

      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          from_page_url: 'http://localhost:3000/previous',
        }),
      );
    });
  });
});
