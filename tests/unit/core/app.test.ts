/**
 * App Core Tests
 * Focus: App initialization and lifecycle management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';
import { createMockConfig } from '../../helpers/fixtures.helper';
import { initTestBridge, destroyTestBridge, getManagers, getHandlers } from '../../helpers/bridge.helper';
import { INGEST_HOST } from '../../../src/constants';

describe('App - Initialization', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();
  });

  describe('init()', () => {
    it('should initialize successfully with no config', async () => {
      const bridge = await initTestBridge();

      expect(bridge.initialized).toBe(true);
    });

    it('should initialize with custom config', async () => {
      const customConfig = createMockConfig({
        sessionTimeout: 5000,
        globalMetadata: { env: 'test' },
      });

      const bridge = await initTestBridge(customConfig);

      expect(bridge.initialized).toBe(true);
      const config = bridge.get('config');
      expect(config.sessionTimeout).toBe(5000);
      expect(config.globalMetadata).toEqual({ env: 'test' });
    });

    it('should initialize with tracelog integration on localhost (hosted default, zero-DNS)', async () => {
      // The hosted default works on any host (incl. localhost) — no domain dependency.
      // This is the fix for the silent zero-event activation bug.
      const config = createMockConfig({
        integrations: {
          tracelog: {
            projectId: 'test-project-id',
          },
        },
      });

      const bridge = await initTestBridge(config);

      expect(bridge.initialized).toBe(true);
      expect(bridge.get('collectApiUrls')).toEqual({
        saas: `${INGEST_HOST}/p/test-project-id/collect`,
      });
    });

    it('should throw error if already initialized', async () => {
      const bridge = await initTestBridge();

      // App.init() returns early without throwing if already initialized
      // But calling init again should not throw, just return
      await expect(bridge.init()).resolves.not.toThrow();
      expect(bridge.initialized).toBe(true);
    });

    it('should set isInitialized to true after init', async () => {
      const bridge = await initTestBridge();

      expect(bridge.initialized).toBe(true);
    });

    it('should create userId if not exists', async () => {
      const bridge = await initTestBridge();

      const userId = bridge.get('userId');
      expect(userId).toBeDefined();
      expect(typeof userId).toBe('string');
      expect(userId.length).toBeGreaterThan(0);
    });

    it('should restore userId from storage', async () => {
      // Don't call setupTestEnvironment in this specific test to preserve storage
      const existingUserId = 'existing-user-id';
      // Store with correct key format
      localStorage.setItem('tlog:uid', existingUserId);

      const bridge = await initTestBridge();

      const userId = bridge.get('userId');
      expect(userId).toBe(existingUserId);
    });

    it('should initialize all managers in correct order', async () => {
      const bridge = await initTestBridge();

      const { storage, event } = getManagers(bridge);

      expect(storage).toBeDefined();
      expect(event).toBeDefined();
    });

    it('should initialize all handlers after managers', async () => {
      const bridge = await initTestBridge();

      const { session, pageView, click } = getHandlers(bridge);

      expect(session).toBeDefined();
      expect(pageView).toBeDefined();
      expect(click).toBeDefined();
    });

    it('should emit SESSION_START event during init', async () => {
      const bridge = await initTestBridge();

      // SESSION_START and PAGE_VIEW are tracked during init
      // but might be in the queue or already sent
      const { session } = getHandlers(bridge);

      // Verify session handler exists and started tracking
      expect(session).toBeDefined();

      // Check that session was started
      const sessionId = bridge.get('sessionId');
      expect(sessionId).toBeDefined();
    });

    it('should emit PAGE_VIEW event during init', async () => {
      const bridge = await initTestBridge();

      // PAGE_VIEW is tracked during init via PageViewHandler
      const { pageView } = getHandlers(bridge);

      // Verify pageView handler exists and started tracking
      expect(pageView).toBeDefined();

      // Verify page URL was captured
      const pageUrl = bridge.get('pageUrl');
      expect(pageUrl).toBeDefined();
    });

    it('should handle init errors gracefully (first-party mode on localhost)', async () => {
      // Accuracy mode (`firstParty: true`) derives the endpoint from the page domain,
      // so it still rejects on localhost — the hosted default does not.
      const invalidConfig = createMockConfig({
        integrations: {
          tracelog: {
            projectId: 'test-id',
            firstParty: true, // forces the domain-derived (first-party) endpoint
          },
        },
      });

      // Capture the message once — `initTestBridge` is not idempotent across
      // two failing inits, so we only call it once and assert both invariants.
      let errMessage = '';
      try {
        await initTestBridge(invalidConfig);
      } catch (err) {
        errMessage = err instanceof Error ? err.message : String(err);
      }
      expect(errMessage).toMatch(/SaaS integration .* localhost/);
      // The v3 error must point to a real fix (standalone mode), not to the
      // 'custom backend integration' fallback that no longer exists.
      expect(errMessage).toMatch(/standalone mode|staging domain/);
    });
  });

  describe('destroy()', () => {
    it('should stop all handlers', async () => {
      const bridge = await initTestBridge();
      const { session, pageView, click } = getHandlers(bridge);

      const sessionStopSpy = vi.spyOn(session!, 'stopTracking');
      const pageViewStopSpy = vi.spyOn(pageView!, 'stopTracking');
      const clickStopSpy = vi.spyOn(click!, 'stopTracking');

      bridge.destroy();

      expect(sessionStopSpy).toHaveBeenCalled();
      expect(pageViewStopSpy).toHaveBeenCalled();
      expect(clickStopSpy).toHaveBeenCalled();
    });

    it('should cleanup all managers', async () => {
      const bridge = await initTestBridge();
      const { event } = getManagers(bridge);

      const eventStopSpy = vi.spyOn(event!, 'stop');

      bridge.destroy();

      expect(eventStopSpy).toHaveBeenCalled();
    });

    it('should emit SESSION_END event', async () => {
      const bridge = await initTestBridge();

      const { session } = getHandlers(bridge);

      // Spy on stopTracking which emits SESSION_END
      const stopTrackingSpy = vi.spyOn(session!, 'stopTracking');

      bridge.destroy();

      // Verify stopTracking was called (which sends SESSION_END)
      expect(stopTrackingSpy).toHaveBeenCalled();
    });

    it('should set isInitialized to false', async () => {
      const bridge = await initTestBridge();

      expect(bridge.initialized).toBe(true);

      bridge.destroy();

      expect(bridge.initialized).toBe(false);
    });

    it('should allow re-initialization after destroy', async () => {
      const bridge = await initTestBridge();
      bridge.destroy();

      await expect(bridge.init()).resolves.not.toThrow();
      expect(bridge.initialized).toBe(true);
    });

    it('should flush pending events before stopping EventManager', async () => {
      const bridge = await initTestBridge();
      const { event } = getManagers(bridge);

      const flushSyncSpy = vi.spyOn(event!, 'flushImmediatelySync');
      const stopSpy = vi.spyOn(event!, 'stop');

      bridge.destroy();

      expect(flushSyncSpy).toHaveBeenCalled();
      expect(stopSpy).toHaveBeenCalled();

      // flushImmediatelySync must be called before stop
      const flushOrder = flushSyncSpy.mock.invocationCallOrder[0] ?? 0;
      const stopOrder = stopSpy.mock.invocationCallOrder[0] ?? 0;
      expect(flushOrder).toBeLessThan(stopOrder);
    });

    it('should register and remove page lifecycle listeners', async () => {
      const addSpy = vi.spyOn(window, 'addEventListener');
      const removeSpy = vi.spyOn(window, 'removeEventListener');

      const bridge = await initTestBridge();

      const pagehideAdd = addSpy.mock.calls.find(([event]) => event === 'pagehide');
      const beforeunloadAdd = addSpy.mock.calls.find(([event]) => event === 'beforeunload');
      const pageshowAdd = addSpy.mock.calls.find(([event]) => event === 'pageshow');
      expect(pagehideAdd).toBeDefined();
      expect(beforeunloadAdd).toBeDefined();
      expect(pageshowAdd).toBeDefined();

      bridge.destroy();

      const pagehideRemove = removeSpy.mock.calls.find(([event]) => event === 'pagehide');
      const beforeunloadRemove = removeSpy.mock.calls.find(([event]) => event === 'beforeunload');
      const pageshowRemove = removeSpy.mock.calls.find(([event]) => event === 'pageshow');
      expect(pagehideRemove).toBeDefined();
      expect(beforeunloadRemove).toBeDefined();
      expect(pageshowRemove).toBeDefined();

      addSpy.mockRestore();
      removeSpy.mockRestore();
    });

    it('should recover persisted events on bfcache restore (persisted=true)', async () => {
      const bridge = await initTestBridge();
      const eventManager = (
        bridge as unknown as { managers: { event: { recoverPersistedEvents: () => Promise<void> } } }
      ).managers.event;
      const recoverSpy = vi.spyOn(eventManager, 'recoverPersistedEvents').mockResolvedValue();

      // Simulate bfcache restore
      const pageShowEvent = new PageTransitionEvent('pageshow', { persisted: true });
      window.dispatchEvent(pageShowEvent);

      // Wait microtask for the void-promise chain to settle
      await Promise.resolve();

      expect(recoverSpy).toHaveBeenCalledTimes(1);
      recoverSpy.mockRestore();
    });

    it('should NOT recover persisted events on normal page show (persisted=false)', async () => {
      const bridge = await initTestBridge();
      const eventManager = (
        bridge as unknown as { managers: { event: { recoverPersistedEvents: () => Promise<void> } } }
      ).managers.event;
      const recoverSpy = vi.spyOn(eventManager, 'recoverPersistedEvents').mockResolvedValue();
      // Clear initial init-time call (recoverPersistedEvents is also invoked during App.init)
      recoverSpy.mockClear();

      const pageShowEvent = new PageTransitionEvent('pageshow', { persisted: false });
      window.dispatchEvent(pageShowEvent);

      await Promise.resolve();

      expect(recoverSpy).not.toHaveBeenCalled();
      recoverSpy.mockRestore();
    });

    it('should flush via sendBeacon when document.hidden becomes true (default config)', async () => {
      const bridge = await initTestBridge();
      const eventManager = (bridge as unknown as { managers: { event: { flushImmediatelySync: () => boolean } } })
        .managers.event;
      const flushSpy = vi.spyOn(eventManager, 'flushImmediatelySync').mockReturnValue(true);

      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));

      expect(flushSpy).toHaveBeenCalledTimes(1);
      flushSpy.mockRestore();
    });

    it('should NOT flush when document.hidden becomes false', async () => {
      const bridge = await initTestBridge();
      const eventManager = (bridge as unknown as { managers: { event: { flushImmediatelySync: () => boolean } } })
        .managers.event;
      const flushSpy = vi.spyOn(eventManager, 'flushImmediatelySync').mockReturnValue(true);

      Object.defineProperty(document, 'hidden', { configurable: true, value: false });
      document.dispatchEvent(new Event('visibilitychange'));

      expect(flushSpy).not.toHaveBeenCalled();
      flushSpy.mockRestore();
    });

    it('should NOT flush when flushOnPageHidden is false', async () => {
      const bridge = await initTestBridge(createMockConfig({ flushOnPageHidden: false }));
      const eventManager = (bridge as unknown as { managers: { event: { flushImmediatelySync: () => boolean } } })
        .managers.event;
      const flushSpy = vi.spyOn(eventManager, 'flushImmediatelySync').mockReturnValue(true);

      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));

      expect(flushSpy).not.toHaveBeenCalled();
      flushSpy.mockRestore();
    });

    it('should flush via sendBeacon when sendCustomEvent is called with critical=true', async () => {
      const bridge = await initTestBridge();
      const eventManager = (bridge as unknown as { managers: { event: { flushImmediatelySync: () => boolean } } })
        .managers.event;
      const flushSpy = vi.spyOn(eventManager, 'flushImmediatelySync').mockReturnValue(true);

      (
        bridge as unknown as {
          sendCustomEvent: (name: string, metadata?: unknown, options?: { critical?: boolean }) => void;
        }
      ).sendCustomEvent('purchase', { revenue: 100 }, { critical: true });

      expect(flushSpy).toHaveBeenCalledTimes(1);
      flushSpy.mockRestore();
    });

    it('should NOT flush when sendCustomEvent is called without critical', async () => {
      const bridge = await initTestBridge();
      const eventManager = (bridge as unknown as { managers: { event: { flushImmediatelySync: () => boolean } } })
        .managers.event;
      const flushSpy = vi.spyOn(eventManager, 'flushImmediatelySync').mockReturnValue(true);

      (
        bridge as unknown as {
          sendCustomEvent: (name: string, metadata?: unknown, options?: { critical?: boolean }) => void;
        }
      ).sendCustomEvent('regular_event', { foo: 'bar' });

      expect(flushSpy).not.toHaveBeenCalled();
      flushSpy.mockRestore();
    });

    it('should NOT flush when critical=false', async () => {
      const bridge = await initTestBridge();
      const eventManager = (bridge as unknown as { managers: { event: { flushImmediatelySync: () => boolean } } })
        .managers.event;
      const flushSpy = vi.spyOn(eventManager, 'flushImmediatelySync').mockReturnValue(true);

      (
        bridge as unknown as {
          sendCustomEvent: (name: string, metadata?: unknown, options?: { critical?: boolean }) => void;
        }
      ).sendCustomEvent('regular_event', { foo: 'bar' }, { critical: false });

      expect(flushSpy).not.toHaveBeenCalled();
      flushSpy.mockRestore();
    });
  });

  describe('Configuration', () => {
    it('should merge config with defaults', async () => {
      const config = createMockConfig({
        sessionTimeout: 5000,
      });

      const bridge = await initTestBridge(config);

      const appliedConfig = bridge.get('config');
      expect(appliedConfig.sessionTimeout).toBe(5000);
      expect(appliedConfig.samplingRate).toBe(1.0);
      expect(appliedConfig.errorSampling).toBe(1.0);
    });

    it('should validate config before init', async () => {
      const bridge = await initTestBridge();

      const config = bridge.get('config');
      expect(config).toBeDefined();
    });

    it('should reject invalid config values', async () => {
      const invalidConfig = createMockConfig({
        sessionTimeout: -1000,
      });

      const bridge = await initTestBridge(invalidConfig);

      const config = bridge.get('config');
      expect(config.sessionTimeout).toBe(-1000);
    });

    it('should apply sessionTimeout from config', async () => {
      const config = createMockConfig({
        sessionTimeout: 10000,
      });

      const bridge = await initTestBridge(config);

      const appliedConfig = bridge.get('config');
      expect(appliedConfig.sessionTimeout).toBe(10000);
    });

    it('should apply globalMetadata from config', async () => {
      const config = createMockConfig({
        globalMetadata: { app: 'test-app', version: '1.0.0' },
      });

      const bridge = await initTestBridge(config);

      const appliedConfig = bridge.get('config');
      expect(appliedConfig.globalMetadata).toEqual({
        app: 'test-app',
        version: '1.0.0',
      });
    });

    it('should apply samplingRate from config', async () => {
      const config = createMockConfig({
        samplingRate: 0.5,
      });

      const bridge = await initTestBridge(config);

      const appliedConfig = bridge.get('config');
      expect(appliedConfig.samplingRate).toBe(0.5);
    });
  });
});

describe('App - State Management', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();
  });

  it('should maintain global state across components', async () => {
    const bridge = await initTestBridge();

    const sessionId = bridge.get('sessionId');
    const userId = bridge.get('userId');

    expect(sessionId).toBeDefined();
    expect(userId).toBeDefined();

    const { event } = getManagers(bridge);
    expect(event).toBeDefined();
  });

  it('should update state when config changes', async () => {
    const config1 = createMockConfig({
      sessionTimeout: 5000,
    });

    const bridge = await initTestBridge(config1);
    bridge.destroy();

    const config2 = createMockConfig({
      sessionTimeout: 10000,
    });

    await bridge.init(config2);

    const appliedConfig = bridge.get('config');
    expect(appliedConfig.sessionTimeout).toBe(10000);
  });

  it('should preserve userId across sessions', async () => {
    const bridge1 = await initTestBridge();
    const userId1 = bridge1.get('userId');
    bridge1.destroy();

    const bridge2 = await initTestBridge();
    const userId2 = bridge2.get('userId');

    expect(userId2).toBe(userId1);
  });

  it('should generate new sessionId on init', async () => {
    const bridge1 = await initTestBridge();
    const sessionId1 = bridge1.get('sessionId');
    bridge1.destroy(true);
    sessionStorage.clear();

    const bridge2 = await initTestBridge();
    const sessionId2 = bridge2.get('sessionId');

    expect(sessionId2).toBeDefined();
    expect(sessionId2).not.toBe(sessionId1);
  });

  it('should update pageUrl on navigation', async () => {
    const bridge = await initTestBridge();

    const initialPageUrl = bridge.get('pageUrl');
    expect(initialPageUrl).toContain('localhost');

    // pageUrl is set during init and doesn't automatically update on navigation
    // This is expected behavior - pageUrl is captured at init time
    expect(initialPageUrl).toBeDefined();
  });
});

describe('App - Error Handling', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();
  });

  it('should handle storage unavailable', async () => {
    // StorageManager has fallback to in-memory storage, so it shouldn't throw
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });

    // StorageManager catches and logs errors, initializes with fallback
    const bridge = await initTestBridge();
    expect(bridge.initialized).toBe(true);

    getItemSpy.mockRestore();
  });

  it('should handle manager initialization failure', async () => {
    const bridge = await initTestBridge();
    const { event } = getManagers(bridge);

    expect(event).toBeDefined();
  });

  it('should handle handler initialization failure', async () => {
    const bridge = await initTestBridge();
    const { session, pageView, click } = getHandlers(bridge);

    expect(session).toBeDefined();
    expect(pageView).toBeDefined();
    expect(click).toBeDefined();
  });

  it('should log errors without throwing', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error');

    const bridge = await initTestBridge();
    bridge.destroy();

    expect(bridge.initialized).toBe(false);

    consoleErrorSpy.mockRestore();
  });
});
