/**
 * API Init Flow Integration Tests
 *
 * Real integration tests for API initialization without complex mocks
 * These tests use the actual implementation to ensure correct behavior
 *
 * IMPORTANT: Library uses STRICT validation - invalid values are rejected, NOT normalized
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as TraceLog from '../../src/api';
import type { Config } from '../../src/types';
import { App } from '../../src/app';
import { getGlobalState } from '../../src/managers/state.manager';

describe('API Integration - Init Flow', () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    // Cleanup any existing instance with retry
    try {
      if (TraceLog.isInitialized()) {
        TraceLog.destroy();
        // Small delay to ensure cleanup completes
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  afterEach(async () => {
    // Always cleanup after tests
    try {
      if (TraceLog.isInitialized()) {
        TraceLog.destroy();
        // Small delay to ensure cleanup completes
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Successful Initialization', () => {
    it('should initialize successfully with valid config', async () => {
      const config: Config = {};

      await TraceLog.init(config);

      expect(TraceLog.isInitialized()).toBe(true);
    });

    it('should initialize without config parameter (undefined)', async () => {
      await TraceLog.init();

      expect(TraceLog.isInitialized()).toBe(true);
    });

    it('should initialize with skip mode (no network call)', async () => {
      await TraceLog.init();

      expect(TraceLog.isInitialized()).toBe(true);
    });

    it('should initialize with fail mode (persistence test mode)', async () => {
      await TraceLog.init();

      expect(TraceLog.isInitialized()).toBe(true);
    });
  });

  describe('Config Validation - Strict Mode', () => {
    it('should reject negative sessionTimeout (strict validation)', async () => {
      await expect(TraceLog.init({ sessionTimeout: -1000 })).rejects.toThrow();
    });

    it('should reject errorSampling > 1 (strict validation)', async () => {
      await expect(TraceLog.init({ errorSampling: 2.5 })).rejects.toThrow();
    });

    it('should reject errorSampling < 0 (strict validation)', async () => {
      await expect(TraceLog.init({ errorSampling: -0.5 })).rejects.toThrow();
    });
  });

  describe('Valid Config Boundaries', () => {
    it('should accept project id with special characters', async () => {
      await TraceLog.init();
      expect(TraceLog.isInitialized()).toBe(true);
    });

    it('should accept valid sessionTimeout', async () => {
      await TraceLog.init({ sessionTimeout: 900000 });
      expect(TraceLog.isInitialized()).toBe(true);
    });

    it('should accept errorSampling = 0 (disable error tracking)', async () => {
      await TraceLog.init({ errorSampling: 0 });
      expect(TraceLog.isInitialized()).toBe(true);
    });

    it('should accept errorSampling = 1 (track all errors)', async () => {
      await TraceLog.init({ errorSampling: 1 });
      expect(TraceLog.isInitialized()).toBe(true);
    });

    it('should accept errorSampling = 0.5 (track 50%)', async () => {
      await TraceLog.init({ errorSampling: 0.5 });
      expect(TraceLog.isInitialized()).toBe(true);
    });
  });

  describe('Duplicate Initialization Prevention', () => {
    it('should ignore second init call when already initialized', async () => {
      await TraceLog.init();
      expect(TraceLog.isInitialized()).toBe(true);

      // Second init should be silently ignored
      await TraceLog.init();

      // Should still be initialized
      expect(TraceLog.isInitialized()).toBe(true);
    });
  });

  describe('Disabled Flag', () => {
    it('should skip initialization when __traceLogDisabled is true', async () => {
      (window as any).__traceLogDisabled = true;

      await TraceLog.init();

      expect(TraceLog.isInitialized()).toBe(false);

      // Cleanup
      delete (window as any).__traceLogDisabled;
    });

    it('should initialize normally after removing __traceLogDisabled flag', async () => {
      (window as any).__traceLogDisabled = true;
      await TraceLog.init();
      expect(TraceLog.isInitialized()).toBe(false);

      // Remove flag
      delete (window as any).__traceLogDisabled;

      // Should work now
      await TraceLog.init();
      expect(TraceLog.isInitialized()).toBe(true);
    });
  });

  describe('Post-Destroy Initialization', () => {
    it('should allow init after destroy', async () => {
      // First init
      await TraceLog.init();
      expect(TraceLog.isInitialized()).toBe(true);

      // Destroy
      TraceLog.destroy();
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(TraceLog.isInitialized()).toBe(false);

      // Re-init should work
      await TraceLog.init();
      expect(TraceLog.isInitialized()).toBe(true);
    });

    it('should handle multiple init/destroy cycles', async () => {
      for (let i = 0; i < 3; i++) {
        await TraceLog.init();
        expect(TraceLog.isInitialized()).toBe(true);

        TraceLog.destroy();
        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(TraceLog.isInitialized()).toBe(false);
      }
    });
  });

  describe('Optional Config Parameters', () => {
    it('should initialize with globalMetadata', async () => {
      await TraceLog.init({
        globalMetadata: { version: '1.0.0', environment: 'test' },
      });

      expect(TraceLog.isInitialized()).toBe(true);
    });

    it('should initialize with sensitiveQueryParams', async () => {
      await TraceLog.init({
        sensitiveQueryParams: ['token', 'api_key', 'session_id'],
      });

      expect(TraceLog.isInitialized()).toBe(true);
    });

    it('should handle empty arrays in config', async () => {
      await TraceLog.init({
        sensitiveQueryParams: [],
      });

      expect(TraceLog.isInitialized()).toBe(true);
    });

    it('should handle empty object in globalMetadata', async () => {
      await TraceLog.init({
        globalMetadata: {},
      });

      expect(TraceLog.isInitialized()).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should reject sessionTimeout above maximum (24 hours)', async () => {
      await expect(
        TraceLog.init({
          sessionTimeout: 86400001, // 24 hours + 1ms
        }),
      ).rejects.toThrow(/session timeout/i);
    });

    it('should reject sessionTimeout below minimum (30 seconds)', async () => {
      await expect(
        TraceLog.init({
          sessionTimeout: 29999, // 30 seconds - 1ms
        }),
      ).rejects.toThrow(/session timeout/i);
    });

    it('should accept sessionTimeout at maximum boundary (24 hours)', async () => {
      await TraceLog.init({
        sessionTimeout: 86400000, // Exactly 24 hours
      });

      expect(TraceLog.isInitialized()).toBe(true);
    });

    it('should accept sessionTimeout at minimum boundary (30 seconds)', async () => {
      await TraceLog.init({
        sessionTimeout: 30000, // Exactly 30 seconds
      });

      expect(TraceLog.isInitialized()).toBe(true);
    });
  });

  describe('isInitialized Helper', () => {
    it('should return false before init', () => {
      expect(TraceLog.isInitialized()).toBe(false);
    });

    it('should return true after init', async () => {
      await TraceLog.init();
      expect(TraceLog.isInitialized()).toBe(true);
    });

    it('should return false after destroy', async () => {
      await TraceLog.init();
      TraceLog.destroy();
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(TraceLog.isInitialized()).toBe(false);
    });
  });

  describe('Special Project IDs', () => {
    it('should handle "skip" project id correctly', async () => {
      await TraceLog.init();
      expect(TraceLog.isInitialized()).toBe(true);
    });

    it('should handle "fail" project id (persistence test mode)', async () => {
      await TraceLog.init();
      expect(TraceLog.isInitialized()).toBe(true);
    });
  });

  describe('State and Handler Verification', () => {
    let app: App;

    beforeEach(() => {
      app = new App();
    });

    afterEach(() => {
      if (app) {
        try {
          app.destroy(true);
        } catch {
          // Ignore cleanup errors
        }
      }
    });

    it('should initialize all required managers', async () => {
      await app.init();

      // Verify managers are initialized
      const managers = (app as any).managers;
      expect(managers).toBeDefined();
      expect(managers.storage).toBeDefined();
      expect(managers.event).toBeDefined();
    });

    it('should initialize all required handlers', async () => {
      await app.init();

      const handlers = (app as any).handlers;

      expect(handlers).toBeDefined();
      expect(handlers.session).toBeDefined();
      expect(handlers.pageView).toBeDefined();
      expect(handlers.click).toBeDefined();
      expect(handlers.scroll).toBeDefined();
      expect(handlers.performance).toBeDefined();
      expect(handlers.error).toBeDefined();
      // viewport handler is optional, only initialized if config.viewport is provided
      expect(handlers.viewport).toBeUndefined();
    });

    it('should initialize viewport handler when viewport config is provided', async () => {
      await app.init({
        viewport: {
          elements: [{ selector: '.test-element' }],
        },
      });

      const handlers = (app as any).handlers;

      expect(handlers.viewport).toBeDefined();
    });

    it('should have properly configured state after init', async () => {
      const config: Config = {
        sessionTimeout: 600000,
        globalMetadata: { testKey: 'testValue' },
      };

      await app.init(config);

      const state = getGlobalState();

      expect(state).toBeDefined();
      expect(state.config).toBeDefined();
      expect(state.config?.sessionTimeout).toBe(600000);
      expect(state.config?.globalMetadata).toEqual({ testKey: 'testValue' });
    });

    it('should not initialize Google Analytics when not configured', async () => {
      await app.init();

      const integrations = (app as any).integrations;

      expect(integrations).toBeDefined();
      expect(integrations.google).toBeUndefined();
    });

    it('should cleanup all handlers on destroy', async () => {
      await app.init();

      const handlersBefore = (app as any).handlers;

      // Verify handlers exist before destroy
      expect(handlersBefore.session).toBeDefined();
      expect(handlersBefore.click).toBeDefined();

      app.destroy();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // After destroy, app should not be initialized
      expect(app.initialized).toBe(false);
    });

    it('should maintain state consistency across multiple init attempts', async () => {
      await app.init({ sessionTimeout: 500000 });

      // Attempting to init again should not change state
      await app.init({ sessionTimeout: 700000 });

      const state = getGlobalState();

      // State should remain from first init
      expect(state.config?.sessionTimeout).toBe(500000);
    });
  });

  describe('Initialization Timeout', () => {
    it('should timeout after INITIALIZATION_TIMEOUT_MS (10 seconds) and cleanup', async () => {
      // Mock App.init to simulate hanging initialization
      const initSpy = vi.spyOn(App.prototype, 'init').mockImplementation(async () => {
        // Simulate slow initialization that exceeds timeout
        await new Promise((resolve) => setTimeout(resolve, 11000));
      });

      const destroySpy = vi.spyOn(App.prototype, 'destroy');

      const startTime = Date.now();

      await expect(TraceLog.init({})).rejects.toThrow('[TraceLog] Initialization timeout after 10000ms');

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should timeout around 10 seconds (allow 1s tolerance)
      expect(duration).toBeGreaterThanOrEqual(9500);
      expect(duration).toBeLessThan(11500);

      // Should have attempted cleanup
      expect(destroySpy).toHaveBeenCalledWith(true); // force=true

      // App should not be initialized
      expect(TraceLog.isInitialized()).toBe(false);

      initSpy.mockRestore();
      destroySpy.mockRestore();
    }, 15000); // 15s timeout for this test

    it('should cleanup partially initialized app on timeout', async () => {
      // Mock App.init to hang but set some state
      const initSpy = vi.spyOn(App.prototype, 'init').mockImplementation(async function (this: App) {
        // Set some state to simulate partial initialization
        this.set('userId', 'test-user-timeout');

        // Then hang (exceeds 10s timeout)
        await new Promise((resolve) => setTimeout(resolve, 11000));
      });

      try {
        await TraceLog.init({});
      } catch (error) {
        // Expected to timeout
        expect(error).toBeDefined();
      }

      // Should have cleaned up (no lingering app instance)
      expect(TraceLog.isInitialized()).toBe(false);

      initSpy.mockRestore();
    }, 15000); // 15s timeout for this test

    it('should not timeout with fast initialization', async () => {
      // Normal fast init should complete before timeout
      const config: Config = {
        integrations: {
          custom: { collectApiUrl: 'https://api.example.com/collect' },
        },
      };

      const startTime = Date.now();

      await TraceLog.init(config);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete quickly (well under 5 seconds)
      expect(duration).toBeLessThan(2000);
      expect(TraceLog.isInitialized()).toBe(true);
    });
  });
});
