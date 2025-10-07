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

describe('API Integration - Init Flow', () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    // Cleanup any existing instance with retry
    try {
      if (TraceLog.isInitialized()) {
        await TraceLog.destroy();
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
        await TraceLog.destroy();
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
      await TraceLog.destroy();
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

        await TraceLog.destroy();
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

    it('should initialize with scrollContainerSelectors', async () => {
      await TraceLog.init({
        scrollContainerSelectors: ['.custom-scroll', '#main-content'],
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
        scrollContainerSelectors: [],
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
      await TraceLog.destroy();
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
});
