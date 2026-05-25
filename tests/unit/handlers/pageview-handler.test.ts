/**
 * PageViewHandler Tests
 * Focus: Navigation tracking and SPA support
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment, setupNavigationEnvironment } from '../../helpers/setup.helper';
import { PageViewHandler } from '../../../src/handlers/page-view.handler';
import { EventManager } from '../../../src/managers/event.manager';
import { StorageManager } from '../../../src/managers/storage.manager';
import { EventType } from '../../../src/types/event.types';
import type { EventData } from '../../../src/types/event.types';

// Helper to get tracked event with proper typing
function getTrackedEvent(spy: ReturnType<typeof vi.spyOn>, index = 0): EventData {
  return spy.mock.calls[index]?.[0] as EventData;
}

describe('PageViewHandler - Isolated Unit Tests', () => {
  describe('Initialization & Lifecycle', () => {
    let handler: PageViewHandler;
    let eventManager: EventManager;
    let storageManager: StorageManager;
    let trackSpy: ReturnType<typeof vi.spyOn>;
    let onTrackCallback: ReturnType<typeof vi.fn>;
    let getSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      setupTestEnvironment();
      setupNavigationEnvironment();

      storageManager = new StorageManager();
      eventManager = new EventManager(storageManager, null);
      onTrackCallback = vi.fn();

      handler = new PageViewHandler(eventManager, onTrackCallback);

      trackSpy = vi.spyOn(eventManager, 'track');
      getSpy = vi.spyOn(handler as any, 'get');

      // @ts-expect-error - Mock implementation type
      getSpy.mockImplementation((key: string) => {
        if (key === 'config') {
          return {
            sensitiveQueryParams: [],
            pageViewThrottleMs: 1000,
          };
        }
        if (key === 'pageUrl') {
          return 'http://localhost:3000/';
        }
        return undefined;
      });
    });

    afterEach(() => {
      handler.stopTracking();
      cleanupTestEnvironment();
    });

    it('should track initial page view on startTracking()', () => {
      handler.startTracking();

      expect(trackSpy).toHaveBeenCalled();
      const event = getTrackedEvent(trackSpy);
      expect(event.type).toBe(EventType.PAGE_VIEW);
      expect(event.page_url).toBeTruthy();
    });

    it('should call onTrack callback after initial page view', () => {
      handler.startTracking();

      expect(onTrackCallback).toHaveBeenCalled();
    });

    it('should attach event listeners on startTracking()', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      handler.startTracking();

      expect(addEventListenerSpy).toHaveBeenCalledWith('popstate', expect.any(Function), true);
      expect(addEventListenerSpy).toHaveBeenCalledWith('hashchange', expect.any(Function), true);
    });

    it('should remove event listeners on stopTracking()', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      handler.startTracking();
      handler.stopTracking();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('popstate', expect.any(Function), true);
      expect(removeEventListenerSpy).toHaveBeenCalledWith('hashchange', expect.any(Function), true);
    });
  });

  describe('History API Patching', () => {
    let handler: PageViewHandler;
    let eventManager: EventManager;
    let storageManager: StorageManager;
    let onTrackCallback: ReturnType<typeof vi.fn>;
    let getSpy: ReturnType<typeof vi.spyOn>;
    let originalPushState: typeof window.history.pushState;
    let originalReplaceState: typeof window.history.replaceState;

    beforeEach(() => {
      setupTestEnvironment();
      setupNavigationEnvironment();

      storageManager = new StorageManager();
      eventManager = new EventManager(storageManager, null);
      onTrackCallback = vi.fn();

      handler = new PageViewHandler(eventManager, onTrackCallback);

      getSpy = vi.spyOn(handler as any, 'get');

      // @ts-expect-error - Mock implementation type
      getSpy.mockImplementation((key: string) => {
        if (key === 'config') {
          return {
            sensitiveQueryParams: [],
            pageViewThrottleMs: 1000,
          };
        }
        if (key === 'pageUrl') {
          return window.location.href;
        }
        return undefined;
      });

      originalPushState = window.history.pushState;
      originalReplaceState = window.history.replaceState;
    });

    afterEach(() => {
      handler.stopTracking();
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      cleanupTestEnvironment();
    });

    it('should patch pushState on startTracking()', () => {
      handler.startTracking();

      expect(window.history.pushState).not.toBe(originalPushState);
    });

    it('should patch replaceState on startTracking()', () => {
      handler.startTracking();

      expect(window.history.replaceState).not.toBe(originalReplaceState);
    });

    it('should restore original pushState on stopTracking()', () => {
      handler.startTracking();
      handler.stopTracking();

      expect(window.history.pushState).toBe(originalPushState);
    });

    it('should restore original replaceState on stopTracking()', () => {
      handler.startTracking();
      handler.stopTracking();

      expect(window.history.replaceState).toBe(originalReplaceState);
    });
  });

  describe('SPA Navigation Detection', () => {
    let handler: PageViewHandler;
    let eventManager: EventManager;
    let storageManager: StorageManager;
    let trackSpy: ReturnType<typeof vi.spyOn>;
    let onTrackCallback: ReturnType<typeof vi.fn>;
    let getSpy: ReturnType<typeof vi.spyOn>;
    let setSpy: ReturnType<typeof vi.spyOn>;
    let currentUrl: string;
    let previousUrl: string;

    beforeEach(() => {
      setupTestEnvironment();
      setupNavigationEnvironment();

      currentUrl = 'http://localhost:3000/';
      previousUrl = 'http://localhost:3000/';

      storageManager = new StorageManager();
      eventManager = new EventManager(storageManager, null);
      onTrackCallback = vi.fn();

      handler = new PageViewHandler(eventManager, onTrackCallback);

      trackSpy = vi.spyOn(eventManager, 'track');
      getSpy = vi.spyOn(handler as any, 'get');
      setSpy = vi.spyOn(handler as any, 'set');

      // @ts-expect-error - Mock implementation type
      getSpy.mockImplementation((key: string) => {
        if (key === 'config') {
          return {
            sensitiveQueryParams: [],
            pageViewThrottleMs: 100,
          };
        }
        if (key === 'pageUrl') {
          return previousUrl;
        }
        return undefined;
      });

      // @ts-expect-error - Mock implementation type
      setSpy.mockImplementation((key: string, value: unknown) => {
        if (key === 'pageUrl') {
          previousUrl = value as string;
        }
      });

      // Mock window.location.href to return dynamic currentUrl
      vi.spyOn(window.location, 'href', 'get').mockImplementation(() => currentUrl);
    });

    afterEach(() => {
      handler.stopTracking();
      cleanupTestEnvironment();
    });

    it('should detect pushState navigation', async () => {
      handler.startTracking();
      trackSpy.mockClear();

      // Wait for throttle period to pass
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Simulate navigation
      currentUrl = 'http://localhost:3000/new-page';
      window.history.pushState({}, '', '/new-page');

      expect(trackSpy).toHaveBeenCalled();
      const event = getTrackedEvent(trackSpy);
      expect(event.type).toBe(EventType.PAGE_VIEW);
    });

    it('should detect replaceState navigation', async () => {
      handler.startTracking();
      trackSpy.mockClear();

      // Wait for throttle period to pass
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Simulate navigation
      currentUrl = 'http://localhost:3000/replaced-page';
      window.history.replaceState({}, '', '/replaced-page');

      expect(trackSpy).toHaveBeenCalled();
      const event = getTrackedEvent(trackSpy);
      expect(event.type).toBe(EventType.PAGE_VIEW);
    });

    it('should detect popstate events', async () => {
      handler.startTracking();
      trackSpy.mockClear();

      // Wait for throttle period to pass
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Simulate navigation
      currentUrl = 'http://localhost:3000/back-page';
      window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));

      expect(trackSpy).toHaveBeenCalled();
      const event = getTrackedEvent(trackSpy);
      expect(event.type).toBe(EventType.PAGE_VIEW);
    });

    it('should detect hash changes', async () => {
      handler.startTracking();
      trackSpy.mockClear();

      // Wait for throttle period to pass
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Simulate navigation
      currentUrl = 'http://localhost:3000/#section';
      window.dispatchEvent(new HashChangeEvent('hashchange'));

      expect(trackSpy).toHaveBeenCalled();
      const event = getTrackedEvent(trackSpy);
      expect(event.type).toBe(EventType.PAGE_VIEW);
    });
  });

  describe('Deduplication & Throttling', () => {
    let handler: PageViewHandler;
    let eventManager: EventManager;
    let storageManager: StorageManager;
    let trackSpy: ReturnType<typeof vi.spyOn>;
    let onTrackCallback: ReturnType<typeof vi.fn>;
    let getSpy: ReturnType<typeof vi.spyOn>;
    let setSpy: ReturnType<typeof vi.spyOn>;
    let currentUrl: string;
    let previousUrl: string;

    beforeEach(() => {
      setupTestEnvironment();
      setupNavigationEnvironment();

      currentUrl = 'http://localhost:3000/';
      previousUrl = 'http://localhost:3000/';

      storageManager = new StorageManager();
      eventManager = new EventManager(storageManager, null);
      onTrackCallback = vi.fn();

      handler = new PageViewHandler(eventManager, onTrackCallback);

      trackSpy = vi.spyOn(eventManager, 'track');
      getSpy = vi.spyOn(handler as any, 'get');
      setSpy = vi.spyOn(handler as any, 'set');

      // @ts-expect-error - Mock implementation type
      getSpy.mockImplementation((key: string) => {
        if (key === 'config') {
          return {
            sensitiveQueryParams: [],
            pageViewThrottleMs: 1000,
          };
        }
        if (key === 'pageUrl') {
          return previousUrl;
        }
        return undefined;
      });

      // @ts-expect-error - Mock implementation type
      setSpy.mockImplementation((key: string, value: unknown) => {
        if (key === 'pageUrl') {
          previousUrl = value as string;
        }
      });

      vi.spyOn(window.location, 'href', 'get').mockImplementation(() => currentUrl);
    });

    afterEach(() => {
      handler.stopTracking();
      cleanupTestEnvironment();
    });

    it('should not emit duplicate PAGE_VIEW events for same URL', async () => {
      handler.startTracking();
      trackSpy.mockClear();

      // First navigation
      window.history.pushState({}, '', '/');
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Second navigation to same URL (should be ignored)
      window.history.pushState({}, '', '/');
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should not track duplicate
      expect(trackSpy).not.toHaveBeenCalled();
    });

    it('should throttle rapid navigation events', () => {
      const dateSpy = vi.spyOn(Date, 'now');
      let mockTime = 1000;
      dateSpy.mockImplementation(() => mockTime);

      handler.startTracking();
      trackSpy.mockClear();

      // Advance time past the initial throttle
      mockTime += 1100;

      // First navigation (should track)
      currentUrl = 'http://localhost:3000/page1';
      window.history.pushState({}, '', '/page1');
      expect(trackSpy).toHaveBeenCalledTimes(1);

      // Second navigation within throttle window (should be throttled)
      mockTime += 500; // Only 500ms later (< 1000ms throttle)
      currentUrl = 'http://localhost:3000/page2';
      window.history.pushState({}, '', '/page2');
      expect(trackSpy).toHaveBeenCalledTimes(1); // Still 1, throttled

      // Third navigation after throttle window (should track)
      mockTime += 600; // Total 1100ms later (> 1000ms throttle)
      currentUrl = 'http://localhost:3000/page3';
      window.history.pushState({}, '', '/page3');
      expect(trackSpy).toHaveBeenCalledTimes(2);

      dateSpy.mockRestore();
    });
  });

  describe('Auto-flush on SPA navigation', () => {
    let handler: PageViewHandler;
    let eventManager: EventManager;
    let storageManager: StorageManager;
    let flushSpy: ReturnType<typeof vi.spyOn>;
    let getSpy: ReturnType<typeof vi.spyOn>;
    let setSpy: ReturnType<typeof vi.spyOn>;
    let currentUrl: string;
    let previousUrl: string;
    let configFlushOnSpaNavigation: boolean | undefined;

    beforeEach(() => {
      setupTestEnvironment();
      setupNavigationEnvironment();

      currentUrl = 'http://localhost:3000/';
      previousUrl = 'http://localhost:3000/';
      configFlushOnSpaNavigation = undefined;

      storageManager = new StorageManager();
      eventManager = new EventManager(storageManager, null);

      handler = new PageViewHandler(eventManager, vi.fn());

      flushSpy = vi.spyOn(eventManager, 'flushImmediately').mockResolvedValue(true);
      getSpy = vi.spyOn(handler as any, 'get');
      setSpy = vi.spyOn(handler as any, 'set');

      // @ts-expect-error - Mock implementation type
      getSpy.mockImplementation((key: string) => {
        if (key === 'config') {
          return {
            sensitiveQueryParams: [],
            pageViewThrottleMs: 100,
            flushOnSpaNavigation: configFlushOnSpaNavigation,
          };
        }
        if (key === 'pageUrl') {
          return previousUrl;
        }
        return undefined;
      });

      // @ts-expect-error - Mock implementation type
      setSpy.mockImplementation((key: string, value: unknown) => {
        if (key === 'pageUrl') {
          previousUrl = value as string;
        }
      });

      vi.spyOn(window.location, 'href', 'get').mockImplementation(() => currentUrl);
    });

    afterEach(() => {
      handler.stopTracking();
      cleanupTestEnvironment();
    });

    it('should NOT auto-flush after SPA navigation when config is undefined (default false)', async () => {
      handler.startTracking();
      flushSpy.mockClear();

      await new Promise((resolve) => setTimeout(resolve, 150));

      currentUrl = 'http://localhost:3000/new-page';
      window.history.pushState({}, '', '/new-page');

      expect(flushSpy).not.toHaveBeenCalled();
    });

    it('should auto-flush after SPA navigation when flushOnSpaNavigation is true', async () => {
      configFlushOnSpaNavigation = true;
      handler.startTracking();
      flushSpy.mockClear();

      await new Promise((resolve) => setTimeout(resolve, 150));

      currentUrl = 'http://localhost:3000/another-page';
      window.history.pushState({}, '', '/another-page');

      expect(flushSpy).toHaveBeenCalledTimes(1);
    });

    it('should NOT auto-flush when flushOnSpaNavigation is false', async () => {
      configFlushOnSpaNavigation = false;
      handler.startTracking();
      flushSpy.mockClear();

      await new Promise((resolve) => setTimeout(resolve, 150));

      currentUrl = 'http://localhost:3000/silent-page';
      window.history.pushState({}, '', '/silent-page');

      expect(flushSpy).not.toHaveBeenCalled();
    });

    it('should NOT auto-flush on duplicate URL navigation', () => {
      handler.startTracking();
      flushSpy.mockClear();

      // Same URL → throttle blocks track, so no flush either
      window.history.pushState({}, '', '/');

      expect(flushSpy).not.toHaveBeenCalled();
    });
  });
});
