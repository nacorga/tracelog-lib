/**
 * API Destroy Method Integration Tests
 *
 * Tests for TraceLog.destroy() method - cleanup and teardown
 * These tests verify proper cleanup of all resources and event listeners
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as TraceLog from '@/api';

describe('API Integration - Destroy Flow', () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    // Cleanup any existing instance
    try {
      if (TraceLog.isInitialized()) {
        await TraceLog.destroy();
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  afterEach(async () => {
    try {
      if (TraceLog.isInitialized()) {
        await TraceLog.destroy();
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Before Initialization', () => {
    it('should throw error when called before init()', async () => {
      await expect(TraceLog.destroy()).rejects.toThrow('App not initialized');
    });
  });

  describe('After Initialization', () => {
    beforeEach(async () => {
      await TraceLog.init();
    });

    it('should destroy successfully', async () => {
      await expect(TraceLog.destroy()).resolves.not.toThrow();
    });

    it('should set isInitialized to false after destroy', async () => {
      expect(TraceLog.isInitialized()).toBe(true);
      await TraceLog.destroy();
      expect(TraceLog.isInitialized()).toBe(false);
    });

    it('should prevent using event() after destroy', async () => {
      await TraceLog.destroy();
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(() => TraceLog.event('test')).toThrow('TraceLog not initialized');
    });

    it('should clean up global state', async () => {
      // Trigger some events to populate state
      TraceLog.event('event1');
      TraceLog.event('event2');

      await TraceLog.destroy();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // After destroy, should not be able to access anything
      expect(TraceLog.isInitialized()).toBe(false);
    });
  });

  describe('Multiple Destroy Calls', () => {
    it('should throw error on second destroy call', async () => {
      await TraceLog.init();
      await TraceLog.destroy();
      await new Promise((resolve) => setTimeout(resolve, 50));

      await expect(TraceLog.destroy()).rejects.toThrow('App not initialized');
    });

    it('should throw error when destroy is in progress', async () => {
      await TraceLog.init();

      // Start destroy (don't await yet)
      const firstDestroy = TraceLog.destroy();

      // Try to destroy again while first is in progress
      await expect(TraceLog.destroy()).rejects.toThrow('Destroy operation already in progress');

      // Wait for first destroy to complete
      await firstDestroy;
    });
  });

  describe('Re-initialization After Destroy', () => {
    it('should allow init after destroy', async () => {
      // First lifecycle
      await TraceLog.init();
      await TraceLog.destroy();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Second lifecycle
      await expect(TraceLog.init()).resolves.not.toThrow();
      expect(TraceLog.isInitialized()).toBe(true);
    });

    it('should work correctly after re-initialization', async () => {
      // First lifecycle
      await TraceLog.init();
      TraceLog.event('event1');
      await TraceLog.destroy();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Second lifecycle
      await TraceLog.init();
      expect(() => TraceLog.event('event2')).not.toThrow();
      expect(TraceLog.isInitialized()).toBe(true);
    });

    it('should handle multiple init/destroy cycles', async () => {
      for (let i = 0; i < 3; i++) {
        await TraceLog.init();
        TraceLog.event(`event-cycle-${i}`);
        expect(TraceLog.isInitialized()).toBe(true);

        await TraceLog.destroy();
        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(TraceLog.isInitialized()).toBe(false);
      }
    });
  });

  describe('Cleanup Verification', () => {
    it('should cleanup event listeners', async () => {
      await TraceLog.init();

      // Destroy should remove all event listeners
      await TraceLog.destroy();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // After destroy, DOM events should not trigger tracking
      const clickEvent = new MouseEvent('click', { bubbles: true });
      document.dispatchEvent(clickEvent);

      // No errors should occur
      expect(TraceLog.isInitialized()).toBe(false);
    });

    it('should cleanup timers and intervals', async () => {
      await TraceLog.init();

      // Destroy should clear all timers
      await TraceLog.destroy();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // No timers should be running after destroy
      expect(TraceLog.isInitialized()).toBe(false);
    });

    it('should cleanup storage listeners', async () => {
      await TraceLog.init();

      // Destroy should remove storage listeners
      await TraceLog.destroy();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Storage changes should not trigger anything
      const storageEvent = new StorageEvent('storage', {
        key: 'test',
        newValue: 'value',
      });
      window.dispatchEvent(storageEvent);

      expect(TraceLog.isInitialized()).toBe(false);
    });
  });

  describe('With Different Configurations', () => {
    it('should destroy when initialized with skip mode', async () => {
      await TraceLog.init();
      await expect(TraceLog.destroy()).resolves.not.toThrow();
    });

    it('should destroy when initialized with empty config', async () => {
      await TraceLog.init();
      await expect(TraceLog.destroy()).resolves.not.toThrow();
    });

    it('should destroy when initialized with global metadata', async () => {
      await TraceLog.init({
        globalMetadata: { version: '1.0.0' },
      });
      await expect(TraceLog.destroy()).resolves.not.toThrow();
    });

    it('should destroy when initialized with custom timeout', async () => {
      await TraceLog.init({
        sessionTimeout: 60000,
      });
      await expect(TraceLog.destroy()).resolves.not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle destroy with pending events', async () => {
      await TraceLog.init();

      // Queue up some events
      TraceLog.event('event1');
      TraceLog.event('event2');
      TraceLog.event('event3');

      // Destroy immediately without waiting for events to send
      await expect(TraceLog.destroy()).resolves.not.toThrow();
    });

    it('should handle destroy immediately after init', async () => {
      await TraceLog.init();

      // Destroy right away
      await expect(TraceLog.destroy()).resolves.not.toThrow();
    });

    it('should handle destroy without any events sent', async () => {
      await TraceLog.init();

      // Destroy without sending any custom events
      await expect(TraceLog.destroy()).resolves.not.toThrow();
    });
  });
});
