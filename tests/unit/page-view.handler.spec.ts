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

describe('PageViewHandler', () => {
  let pageViewHandler: PageViewHandler;
  let eventManager: EventManager;
  let storageManager: StorageManager;
  let onTrackCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset DOM state
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3000/',
        pathname: '/',
        search: '',
        hash: '',
      },
      writable: true,
      configurable: true,
    });

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
        return { sensitiveQueryParams: [] };
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

    it('should track page view on pushState', async () => {
      const trackSpy = vi.spyOn(eventManager, 'track');
      trackSpy.mockClear(); // Clear initial page view

      // Mock URL change
      const getSpy = vi.spyOn(pageViewHandler as any, 'get');
      getSpy.mockImplementation(((key: any) => {
        if (key === 'config') return { sensitiveQueryParams: [] };
        if (key === 'pageUrl') return 'http://localhost:3000/';
        return undefined;
      }) as any);

      Object.defineProperty(window, 'location', {
        value: {
          href: 'http://localhost:3000/new-page',
          pathname: '/new-page',
          search: '',
          hash: '',
        },
        writable: true,
        configurable: true,
      });

      window.history.pushState({}, '', '/new-page');
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventType.PAGE_VIEW,
        }),
      );
    });

    it('should track page view on replaceState', async () => {
      const trackSpy = vi.spyOn(eventManager, 'track');
      trackSpy.mockClear();

      const getSpy = vi.spyOn(pageViewHandler as any, 'get');
      getSpy.mockImplementation(((key: any) => {
        if (key === 'config') return { sensitiveQueryParams: [] };
        if (key === 'pageUrl') return 'http://localhost:3000/';
        return undefined;
      }) as any);

      Object.defineProperty(window, 'location', {
        value: {
          href: 'http://localhost:3000/replaced',
          pathname: '/replaced',
          search: '',
          hash: '',
        },
        writable: true,
        configurable: true,
      });

      window.history.replaceState({}, '', '/replaced');
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(trackSpy).toHaveBeenCalled();
    });

    it('should call onTrack callback on navigation', async () => {
      onTrackCallback.mockClear();

      const getSpy = vi.spyOn(pageViewHandler as any, 'get');
      getSpy.mockImplementation(((key: any) => {
        if (key === 'config') return { sensitiveQueryParams: [] };
        if (key === 'pageUrl') return 'http://localhost:3000/';
        return undefined;
      }) as any);

      Object.defineProperty(window, 'location', {
        value: {
          href: 'http://localhost:3000/page2',
          pathname: '/page2',
          search: '',
          hash: '',
        },
        writable: true,
        configurable: true,
      });

      window.history.pushState({}, '', '/page2');
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(onTrackCallback).toHaveBeenCalled();
    });
  });

  describe('Navigation Events', () => {
    beforeEach(() => {
      pageViewHandler.startTracking();
    });

    it('should track page view on popstate event', async () => {
      const trackSpy = vi.spyOn(eventManager, 'track');
      trackSpy.mockClear();

      const getSpy = vi.spyOn(pageViewHandler as any, 'get');
      getSpy.mockImplementation(((key: any) => {
        if (key === 'config') return { sensitiveQueryParams: [] };
        if (key === 'pageUrl') return 'http://localhost:3000/';
        return undefined;
      }) as any);

      Object.defineProperty(window, 'location', {
        value: {
          href: 'http://localhost:3000/back',
          pathname: '/back',
          search: '',
          hash: '',
        },
        writable: true,
        configurable: true,
      });

      const popstateEvent = new PopStateEvent('popstate', { state: {} });
      window.dispatchEvent(popstateEvent);
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(trackSpy).toHaveBeenCalled();
    });

    it('should track page view on hashchange event', async () => {
      const trackSpy = vi.spyOn(eventManager, 'track');
      trackSpy.mockClear();

      const getSpy = vi.spyOn(pageViewHandler as any, 'get');
      getSpy.mockImplementation(((key: any) => {
        if (key === 'config') return { sensitiveQueryParams: [] };
        if (key === 'pageUrl') return 'http://localhost:3000/';
        return undefined;
      }) as any);

      Object.defineProperty(window, 'location', {
        value: {
          href: 'http://localhost:3000/#section',
          pathname: '/',
          search: '',
          hash: '#section',
        },
        writable: true,
        configurable: true,
      });

      const hashchangeEvent = new HashChangeEvent('hashchange', {
        oldURL: 'http://localhost:3000/',
        newURL: 'http://localhost:3000/#section',
      });
      window.dispatchEvent(hashchangeEvent);
      await new Promise((resolve) => setTimeout(resolve, 10));

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

    it('should not track duplicate page views for same URL', async () => {
      const trackSpy = vi.spyOn(eventManager, 'track');
      trackSpy.mockClear();

      // Mock that current page URL matches
      const getSpy = vi.spyOn(pageViewHandler as any, 'get');
      getSpy.mockImplementation(((key: any) => {
        if (key === 'config') return { sensitiveQueryParams: [] };
        if (key === 'pageUrl') return 'http://localhost:3000/';
        return undefined;
      }) as any);

      // Try to track same page
      const popstateEvent = new PopStateEvent('popstate', { state: {} });
      window.dispatchEvent(popstateEvent);
      await new Promise((resolve) => setTimeout(resolve, 10));

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

    it('should include from_page_url on navigation', async () => {
      const trackSpy = vi.spyOn(eventManager, 'track');
      trackSpy.mockClear();

      const getSpy = vi.spyOn(pageViewHandler as any, 'get');
      getSpy.mockImplementation(((key: any) => {
        if (key === 'config') return { sensitiveQueryParams: [] };
        if (key === 'pageUrl') return 'http://localhost:3000/previous';
        return undefined;
      }) as any);

      Object.defineProperty(window, 'location', {
        value: {
          href: 'http://localhost:3000/current',
          pathname: '/current',
          search: '',
          hash: '',
        },
        writable: true,
        configurable: true,
      });

      window.history.pushState({}, '', '/current');
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          from_page_url: 'http://localhost:3000/previous',
        }),
      );
    });
  });
});
