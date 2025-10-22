/**
 * Public API Unit Tests
 *
 * Tests all public API methods to detect library defects:
 * - init(): initialization, concurrent calls, cleanup on failure
 * - event(): custom event tracking, validation errors
 * - on/off(): event listener registration/removal
 * - destroy(): cleanup, concurrent calls, resource management
 * - isInitialized(): state tracking
 *
 * Focus: Detect API defects, concurrency issues, and resource leaks
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as TraceLog from '../../src/api';
import { App } from '../../src/app';
import { EmitterEvent } from '../../src/types';
import { setupTestState, createTestConfig, cleanupTestState } from '../utils/test-setup';

// Mock the App class
vi.mock('../../src/app', () => {
  const mockApp = {
    init: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn().mockResolvedValue(undefined),
    sendCustomEvent: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  };

  return {
    App: vi.fn(() => mockApp),
  };
});

describe('Public API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupTestState(createTestConfig());
    cleanupTestState();
  });

  afterEach(() => {
    // Force cleanup by setting internal app to null
    try {
      if (TraceLog.isInitialized()) {
        TraceLog.destroy();
      }
    } catch {
      // Ignore errors during cleanup
    }
    cleanupTestState();
  });

  describe('init()', () => {
    it('should initialize successfully with valid config', async () => {
      const config = createTestConfig();
      await TraceLog.init(config);

      expect(TraceLog.isInitialized()).toBe(true);
      expect(App).toHaveBeenCalledTimes(1);
    });

    it('should silently no-op in non-browser environment (SSR compatibility)', async () => {
      const originalWindow = global.window;
      const originalDocument = global.document;

      // @ts-expect-error - Simulating non-browser environment
      delete global.window;
      // @ts-expect-error - Simulating non-browser environment
      delete global.document;

      const config = createTestConfig();

      // Should not throw, just return early
      await expect(TraceLog.init(config)).resolves.toBeUndefined();

      // Restore window and document
      global.window = originalWindow;
      global.document = originalDocument;

      // Should not be initialized after SSR early return
      expect(TraceLog.isInitialized()).toBe(false);
      expect(App).not.toHaveBeenCalled();
    });

    it('should skip initialization when __traceLogDisabled is true', async () => {
      window.__traceLogDisabled = true;

      const config = createTestConfig();
      await TraceLog.init(config);

      expect(TraceLog.isInitialized()).toBe(false);
      expect(App).not.toHaveBeenCalled();

      delete window.__traceLogDisabled;
    });

    it('should not reinitialize if already initialized', async () => {
      const config = createTestConfig();
      await TraceLog.init(config);
      await TraceLog.init(config); // Second call

      expect(App).toHaveBeenCalledTimes(1); // Only one instance created
    });

    it('should not allow concurrent initialization', async () => {
      const config = createTestConfig();

      // Start two concurrent initializations
      const promise1 = TraceLog.init(config);
      const promise2 = TraceLog.init(config);

      await Promise.all([promise1, promise2]);

      expect(App).toHaveBeenCalledTimes(1); // Only one instance created
    });

    it('should cleanup and rethrow on App.init() failure', async () => {
      const mockAppInstance = new App();
      const initError = new Error('Init failed');

      vi.mocked(mockAppInstance.init).mockRejectedValueOnce(initError);
      vi.mocked(mockAppInstance.destroy).mockResolvedValueOnce(undefined);

      const config = createTestConfig();

      await expect(TraceLog.init(config)).rejects.toThrow('Init failed');
      expect(TraceLog.isInitialized()).toBe(false);
      expect(mockAppInstance.destroy).toHaveBeenCalledWith(true);
    });

    it('should handle cleanup failure during init error', async () => {
      const mockAppInstance = new App();
      const initError = new Error('Init failed');
      const cleanupError = new Error('Cleanup failed');

      vi.mocked(mockAppInstance.init).mockRejectedValueOnce(initError);
      vi.mocked(mockAppInstance.destroy).mockRejectedValueOnce(cleanupError);

      const config = createTestConfig();

      // Should throw the original init error, not cleanup error
      await expect(TraceLog.init(config)).rejects.toThrow('Init failed');
      expect(TraceLog.isInitialized()).toBe(false);
    });
  });

  describe('event()', () => {
    it('should silently no-op when not initialized (SSR compatibility)', () => {
      const originalWindow = global.window;
      const originalDocument = global.document;

      // @ts-expect-error - Simulating non-browser environment
      delete global.window;
      // @ts-expect-error - Simulating non-browser environment
      delete global.document;

      // Should not throw, just return early
      expect(() => {
        TraceLog.event('test_event');
      }).not.toThrow();

      // Restore
      global.window = originalWindow;
      global.document = originalDocument;
    });

    it('should throw error when initialized but app is null', () => {
      // In browser environment but not initialized
      expect(() => {
        TraceLog.event('test_event');
      }).toThrow('TraceLog not initialized. Please call init() first.');
    });

    it('should send custom event when initialized', async () => {
      const config = createTestConfig();
      await TraceLog.init(config);

      // Get the mock instance that was created during init
      const mockAppInstance = vi.mocked(App).mock.results[0]?.value;
      TraceLog.event('test_event', { key: 'value' });

      expect(mockAppInstance?.sendCustomEvent).toHaveBeenCalledWith('test_event', { key: 'value' });
    });

    it('should send custom event without metadata', async () => {
      const config = createTestConfig();
      await TraceLog.init(config);

      const mockAppInstance = vi.mocked(App).mock.results[0]?.value;
      TraceLog.event('test_event');

      expect(mockAppInstance?.sendCustomEvent).toHaveBeenCalledWith('test_event', undefined);
    });

    it('should handle array metadata', async () => {
      const config = createTestConfig();
      await TraceLog.init(config);

      const mockAppInstance = vi.mocked(App).mock.results[0]?.value;
      const metadata = [{ item: 'value1' }, { item: 'value2' }];
      TraceLog.event('test_event', metadata as any);

      expect(mockAppInstance?.sendCustomEvent).toHaveBeenCalledWith('test_event', metadata);
    });

    it('should rethrow errors from sendCustomEvent', async () => {
      const config = createTestConfig();
      await TraceLog.init(config);

      const mockAppInstance = vi.mocked(App).mock.results[0]?.value;
      const eventError = new Error('Event validation failed');
      vi.mocked(mockAppInstance?.sendCustomEvent).mockImplementationOnce(() => {
        throw eventError;
      });

      expect(() => {
        TraceLog.event('invalid_event', { bad: 'data' });
      }).toThrow('Event validation failed');
    });
  });

  describe('on()', () => {
    it('should buffer listeners when not initialized', () => {
      const callback = vi.fn();
      expect(() => {
        TraceLog.on(EmitterEvent.EVENT, callback);
      }).not.toThrow();
    });

    it('should register event listener when initialized', async () => {
      const config = createTestConfig();
      await TraceLog.init(config);

      const mockAppInstance = vi.mocked(App).mock.results[0]?.value;
      const callback = vi.fn();
      TraceLog.on(EmitterEvent.EVENT, callback);

      expect(mockAppInstance?.on).toHaveBeenCalledWith(EmitterEvent.EVENT, callback);
    });
  });

  describe('off()', () => {
    it('should allow removing buffered listeners when not initialized', () => {
      const callback = vi.fn();
      expect(() => {
        TraceLog.off(EmitterEvent.EVENT, callback);
      }).not.toThrow();
    });

    it('should unregister event listener when initialized', async () => {
      const config = createTestConfig();
      await TraceLog.init(config);

      const mockAppInstance = vi.mocked(App).mock.results[0]?.value;
      const callback = vi.fn();
      TraceLog.off(EmitterEvent.EVENT, callback);

      expect(mockAppInstance?.off).toHaveBeenCalledWith(EmitterEvent.EVENT, callback);
    });
  });

  describe('isInitialized()', () => {
    it('should return false before initialization', () => {
      expect(TraceLog.isInitialized()).toBe(false);
    });

    it('should return true after successful initialization', async () => {
      const config = createTestConfig();
      await TraceLog.init(config);

      expect(TraceLog.isInitialized()).toBe(true);
    });

    it('should return false after destroy', async () => {
      const config = createTestConfig();
      await TraceLog.init(config);
      TraceLog.destroy();

      expect(TraceLog.isInitialized()).toBe(false);
    });

    it('should return false after failed initialization', async () => {
      const mockAppInstance = new App();
      const initError = new Error('Init failed');

      vi.mocked(mockAppInstance.init).mockRejectedValueOnce(initError);

      const config = createTestConfig();

      try {
        await TraceLog.init(config);
      } catch {
        // Ignore error
      }

      expect(TraceLog.isInitialized()).toBe(false);
    });
  });

  describe('destroy()', () => {
    it('should silently no-op when not initialized (SSR compatibility)', () => {
      const originalWindow = global.window;
      const originalDocument = global.document;

      // @ts-expect-error - Simulating non-browser environment
      delete global.window;
      // @ts-expect-error - Simulating non-browser environment
      delete global.document;

      // Should not throw, just return early
      expect(() => {
        TraceLog.destroy();
      }).not.toThrow();

      // Restore
      global.window = originalWindow;
      global.document = originalDocument;
    });

    it('should not throw error when in browser but not initialized (idempotent)', () => {
      expect(() => {
        TraceLog.destroy();
      }).not.toThrow();

      // Should still not be initialized
      expect(TraceLog.isInitialized()).toBe(false);
    });

    it('should destroy successfully when initialized', async () => {
      const config = createTestConfig();
      await TraceLog.init(config);

      const mockAppInstance = vi.mocked(App).mock.results[0]?.value;
      TraceLog.destroy();

      expect(mockAppInstance?.destroy).toHaveBeenCalledTimes(1);
      expect(TraceLog.isInitialized()).toBe(false);
    });

    it('should not throw error when calling destroy after already destroyed (idempotent)', async () => {
      const config = createTestConfig();
      await TraceLog.init(config);

      TraceLog.destroy();

      // Second destroy should be idempotent (no errors)
      expect(() => {
        TraceLog.destroy();
      }).not.toThrow();

      // Should still not be initialized
      expect(TraceLog.isInitialized()).toBe(false);
    });

    it('should force cleanup even if destroy fails', async () => {
      const config = createTestConfig();
      await TraceLog.init(config);

      const mockAppInstance = vi.mocked(App).mock.results[0]?.value;
      const destroyError = new Error('Destroy operation failed');
      vi.mocked(mockAppInstance?.destroy).mockImplementationOnce(() => {
        throw destroyError;
      });

      // Destroy should not throw - always complete successfully
      expect(() => {
        TraceLog.destroy();
      }).not.toThrow();
      expect(TraceLog.isInitialized()).toBe(false); // Still cleaned up
    });

    it('should allow reinitialization after destroy', async () => {
      const config = createTestConfig();

      await TraceLog.init(config);
      TraceLog.destroy();
      await TraceLog.init(config);

      expect(TraceLog.isInitialized()).toBe(true);
      expect(App).toHaveBeenCalledTimes(2); // Two separate instances
    });
  });
});
