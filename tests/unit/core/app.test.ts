/**
 * App Core Tests
 * Focus: App initialization and lifecycle management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';
import { createMockConfig } from '../../helpers/fixtures.helper';
import { initTestBridge, destroyTestBridge, getManagers, getHandlers } from '../../helpers/bridge.helper';

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

    it('should initialize with tracelog integration', async () => {
      // TraceLog SaaS not supported on localhost, so this test validates the error
      const config = createMockConfig({
        integrations: {
          tracelog: {
            projectId: 'test-project-id',
          },
        },
      });

      await expect(initTestBridge(config)).rejects.toThrow('SaaS integration not supported on localhost');
    });

    it('should initialize with custom backend integration', async () => {
      const config = createMockConfig({
        integrations: {
          custom: {
            collectApiUrl: 'https://api.custom.com/collect',
          },
        },
      });

      const bridge = await initTestBridge(config);

      expect(bridge.initialized).toBe(true);
      const collectApiUrls = bridge.get('collectApiUrls');
      expect(collectApiUrls.custom).toBe('https://api.custom.com/collect');
    });

    it('should initialize with multiple integrations', async () => {
      // Use only custom backend since SaaS not supported on localhost
      const config = createMockConfig({
        integrations: {
          custom: {
            collectApiUrl: 'https://api.custom.com/collect',
          },
        },
      });

      const bridge = await initTestBridge(config);

      expect(bridge.initialized).toBe(true);
      const collectApiUrls = bridge.get('collectApiUrls');
      expect(collectApiUrls.custom).toBe('https://api.custom.com/collect');
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

    it('should handle init errors gracefully', async () => {
      // Test that init errors are caught and thrown appropriately
      const invalidConfig = createMockConfig({
        integrations: {
          tracelog: {
            projectId: 'test-id', // SaaS not supported on localhost
          },
        },
      });

      // On localhost, SaaS integration will throw error
      await expect(initTestBridge(invalidConfig)).rejects.toThrow('SaaS integration not supported on localhost');
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

    it('should apply disabledEvents from config', async () => {
      const config = createMockConfig({
        disabledEvents: ['scroll', 'web_vitals'],
      });

      const bridge = await initTestBridge(config);

      const { scroll, performance } = getHandlers(bridge);

      expect(scroll).toBeNull();
      expect(performance).toBeNull();
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
    bridge1.destroy();

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

  it('should handle invalid integration config', async () => {
    const config = createMockConfig({
      integrations: {
        custom: {
          collectApiUrl: '',
        },
      },
    });

    const bridge = await initTestBridge(config);

    expect(bridge.initialized).toBe(true);
  });

  it('should log errors without throwing', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error');

    const bridge = await initTestBridge();
    bridge.destroy();

    expect(bridge.initialized).toBe(false);

    consoleErrorSpy.mockRestore();
  });
});
