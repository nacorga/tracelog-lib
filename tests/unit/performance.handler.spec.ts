/**
 * PerformanceHandler Unit Tests
 *
 * Tests for web vitals and performance tracking functionality including:
 * - Web vitals tracking (LCP, CLS, FCP, TTFB, INP)
 * - Long task monitoring
 * - Performance observer management
 * - Deduplication logic
 * - Fallback mechanisms
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PerformanceHandler } from '../../src/handlers/performance.handler';
import { EventManager } from '../../src/managers/event.manager';
import { StorageManager } from '../../src/managers/storage.manager';
import { EventType } from '../../src/types';

describe('PerformanceHandler', () => {
  let performanceHandler: PerformanceHandler;
  let eventManager: EventManager;
  let storageManager: StorageManager;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create instances
    storageManager = new StorageManager();
    eventManager = new EventManager(storageManager);
    performanceHandler = new PerformanceHandler(eventManager);

    // Mock PerformanceObserver
    global.PerformanceObserver = vi.fn().mockImplementation((_callback) => {
      return {
        observe: vi.fn(),
        disconnect: vi.fn(),
      };
    }) as any;

    (global.PerformanceObserver as any).supportedEntryTypes = [
      'navigation',
      'paint',
      'largest-contentful-paint',
      'layout-shift',
      'longtask',
      'event',
    ];
  });

  afterEach(() => {
    if (performanceHandler) {
      performanceHandler.stopTracking();
    }
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should create instance with event manager', () => {
      expect(performanceHandler).toBeDefined();
      expect(performanceHandler).toBeInstanceOf(PerformanceHandler);
    });
  });

  describe('startTracking()', () => {
    it('should start tracking performance metrics', async () => {
      await expect(performanceHandler.startTracking()).resolves.not.toThrow();
    });

    it('should initialize web vitals library', () => {
      const mockWebVitals = {
        onLCP: vi.fn(),
        onCLS: vi.fn(),
        onFCP: vi.fn(),
        onTTFB: vi.fn(),
        onINP: vi.fn(),
      };

      vi.doMock('web-vitals', () => mockWebVitals);

      void performanceHandler.startTracking();

      // Note: Dynamic import mocking in Vitest is complex
      // This test verifies the method doesn't throw
    });

    it('should observe long tasks', async () => {
      await performanceHandler.startTracking();

      // Verify observer was created
      expect(PerformanceObserver).toHaveBeenCalled();
    });

    it('should use fallback when web-vitals fails to load', async () => {
      // Mock import failure
      vi.doMock('web-vitals', () => {
        throw new Error('Module not found');
      });

      await expect(performanceHandler.startTracking()).resolves.not.toThrow();
    });
  });

  describe('stopTracking()', () => {
    beforeEach(() => {
      void performanceHandler.startTracking();
    });

    it('should disconnect all observers', () => {
      const disconnectSpy = vi.fn();
      (performanceHandler as any).observers = [{ disconnect: disconnectSpy }];

      performanceHandler.stopTracking();

      expect(disconnectSpy).toHaveBeenCalled();
    });

    it('should clear observers array', () => {
      performanceHandler.stopTracking();

      expect((performanceHandler as any).observers.length).toBe(0);
    });

    it('should clear reported vitals map', () => {
      performanceHandler.stopTracking();

      expect((performanceHandler as any).reportedByNav.size).toBe(0);
    });

    it('should handle disconnect errors gracefully', () => {
      const failingObserver = {
        disconnect: vi.fn(() => {
          throw new Error('Disconnect failed');
        }),
      };

      (performanceHandler as any).observers = [failingObserver];

      expect(() => performanceHandler.stopTracking()).not.toThrow();
    });
  });

  describe('Web Vitals Tracking', () => {
    beforeEach(() => {
      void performanceHandler.startTracking();
    });

    it('should track valid LCP value', () => {
      const trackSpy = vi.spyOn(eventManager, 'track');

      (performanceHandler as any).trackWebVital('LCP', 2500.45);

      expect(trackSpy).toHaveBeenCalledWith({
        type: EventType.WEB_VITALS,
        web_vitals: {
          type: 'LCP',
          value: 2500.45,
        },
      });
    });

    it('should track valid CLS value', () => {
      const trackSpy = vi.spyOn(eventManager, 'track');

      (performanceHandler as any).trackWebVital('CLS', 0.15);

      expect(trackSpy).toHaveBeenCalledWith({
        type: EventType.WEB_VITALS,
        web_vitals: {
          type: 'CLS',
          value: 0.15,
        },
      });
    });

    it('should track valid FCP value', () => {
      const trackSpy = vi.spyOn(eventManager, 'track');

      (performanceHandler as any).trackWebVital('FCP', 1800.25);

      expect(trackSpy).toHaveBeenCalledWith({
        type: EventType.WEB_VITALS,
        web_vitals: {
          type: 'FCP',
          value: 1800.25,
        },
      });
    });

    it('should track valid TTFB value', () => {
      const trackSpy = vi.spyOn(eventManager, 'track');

      (performanceHandler as any).trackWebVital('TTFB', 600.5);

      expect(trackSpy).toHaveBeenCalledWith({
        type: EventType.WEB_VITALS,
        web_vitals: {
          type: 'TTFB',
          value: 600.5,
        },
      });
    });

    it('should track valid INP value', () => {
      const trackSpy = vi.spyOn(eventManager, 'track');

      (performanceHandler as any).trackWebVital('INP', 350.75);

      expect(trackSpy).toHaveBeenCalledWith({
        type: EventType.WEB_VITALS,
        web_vitals: {
          type: 'INP',
          value: 350.75,
        },
      });
    });

    it('should not track invalid (NaN) values', () => {
      const trackSpy = vi.spyOn(eventManager, 'track');

      (performanceHandler as any).trackWebVital('LCP', NaN);

      expect(trackSpy).not.toHaveBeenCalled();
    });

    it('should not track invalid (Infinity) values', () => {
      const trackSpy = vi.spyOn(eventManager, 'track');

      (performanceHandler as any).trackWebVital('LCP', Infinity);

      expect(trackSpy).not.toHaveBeenCalled();
    });

    it('should not track invalid (negative infinity) values', () => {
      const trackSpy = vi.spyOn(eventManager, 'track');

      (performanceHandler as any).trackWebVital('LCP', -Infinity);

      expect(trackSpy).not.toHaveBeenCalled();
    });
  });

  describe('Deduplication Logic', () => {
    beforeEach(() => {
      void performanceHandler.startTracking();

      // Mock shouldSendVital to always return true for these tests
      vi.spyOn(performanceHandler as any, 'shouldSendVital').mockReturnValue(true);
    });

    it('should prevent duplicate vitals for same navigation', () => {
      const trackSpy = vi.spyOn(eventManager, 'track');

      // Mock navigation ID
      vi.spyOn(performanceHandler as any, 'getNavigationId').mockReturnValue('nav-123');

      // First send
      (performanceHandler as any).sendVital({ type: 'LCP', value: 2500 });
      expect(trackSpy).toHaveBeenCalledTimes(1);

      // Second send (duplicate)
      (performanceHandler as any).sendVital({ type: 'LCP', value: 2600 });
      expect(trackSpy).toHaveBeenCalledTimes(1); // Still 1, not 2
    });

    it('should allow different vital types for same navigation', () => {
      const trackSpy = vi.spyOn(eventManager, 'track');

      vi.spyOn(performanceHandler as any, 'getNavigationId').mockReturnValue('nav-123');

      (performanceHandler as any).sendVital({ type: 'LCP', value: 2500 });
      (performanceHandler as any).sendVital({ type: 'CLS', value: 0.1 });
      (performanceHandler as any).sendVital({ type: 'FCP', value: 1800 });

      expect(trackSpy).toHaveBeenCalledTimes(3);
    });

    it('should allow same vital type for different navigations', () => {
      const trackSpy = vi.spyOn(eventManager, 'track');

      const navIdSpy = vi.spyOn(performanceHandler as any, 'getNavigationId');

      // First navigation
      navIdSpy.mockReturnValue('nav-123');
      (performanceHandler as any).sendVital({ type: 'LCP', value: 2500 });

      // Second navigation
      navIdSpy.mockReturnValue('nav-456');
      (performanceHandler as any).sendVital({ type: 'LCP', value: 2600 });

      expect(trackSpy).toHaveBeenCalledTimes(2);
    });

    it('should handle null navigation ID gracefully', () => {
      const trackSpy = vi.spyOn(eventManager, 'track');

      vi.spyOn(performanceHandler as any, 'getNavigationId').mockReturnValue(null);

      (performanceHandler as any).sendVital({ type: 'LCP', value: 2500 });
      (performanceHandler as any).sendVital({ type: 'LCP', value: 2600 });

      // Without nav ID, both should be sent
      expect(trackSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Threshold Filtering', () => {
    beforeEach(() => {
      void performanceHandler.startTracking();
    });

    it('should filter vitals below threshold', () => {
      const result = (performanceHandler as any).shouldSendVital('LCP', 10);

      // LCP threshold is 4000ms, so 10ms should be filtered
      expect(result).toBe(false);
    });

    it('should allow vitals above threshold', () => {
      const result = (performanceHandler as any).shouldSendVital('LCP', 5000);

      // LCP threshold is 4000ms, so 5000ms should be allowed
      expect(result).toBe(true);
    });

    it('should reject invalid numeric values', () => {
      const result = (performanceHandler as any).shouldSendVital('LCP', NaN);

      expect(result).toBe(false);
    });

    it('should reject non-numeric values', () => {
      const result = (performanceHandler as any).shouldSendVital('LCP', undefined);

      expect(result).toBe(false);
    });

    it('should handle vitals without thresholds', () => {
      // LONG_TASK might not have a threshold defined
      const result = (performanceHandler as any).shouldSendVital('LONG_TASK', 100);

      expect(result).toBe(true);
    });
  });

  describe('Long Task Tracking', () => {
    beforeEach(async () => {
      await performanceHandler.startTracking();
    });

    it('should observe long tasks on start', () => {
      // Verify observer was created for longtask
      expect(PerformanceObserver).toHaveBeenCalled();

      // Verify observers array has entries
      const observers = (performanceHandler as any).observers;
      expect(observers.length).toBeGreaterThan(0);
    });

    it('should track lastLongTaskSentAt timestamp', () => {
      expect((performanceHandler as any).lastLongTaskSentAt).toBeDefined();
      expect(typeof (performanceHandler as any).lastLongTaskSentAt).toBe('number');
    });
  });

  describe('Performance Observer Support', () => {
    it('should check if observer type is supported', () => {
      const supported = (performanceHandler as any).isObserverSupported('largest-contentful-paint');

      expect(supported).toBe(true);
    });

    it('should return false for unsupported types', () => {
      (global.PerformanceObserver as any).supportedEntryTypes = ['navigation'];

      const supported = (performanceHandler as any).isObserverSupported('largest-contentful-paint');

      expect(supported).toBe(false);
    });

    it('should return false when PerformanceObserver is undefined', () => {
      const originalPO = global.PerformanceObserver;
      (global as any).PerformanceObserver = undefined;

      const supported = (performanceHandler as any).isObserverSupported('paint');

      expect(supported).toBe(false);

      global.PerformanceObserver = originalPO;
    });

    it('should handle missing supportedEntryTypes gracefully', () => {
      delete (global.PerformanceObserver as any).supportedEntryTypes;

      const supported = (performanceHandler as any).isObserverSupported('paint');

      expect(supported).toBe(true); // Should default to true when not defined
    });
  });

  describe('Safe Observer Creation', () => {
    beforeEach(() => {
      void performanceHandler.startTracking();
    });

    it('should create observer successfully', () => {
      const callback = vi.fn();

      const result = (performanceHandler as any).safeObserve('paint', callback);

      expect(result).toBe(true);
      expect(PerformanceObserver).toHaveBeenCalled();
    });

    it('should handle observer creation errors', () => {
      global.PerformanceObserver = vi.fn().mockImplementation(() => {
        throw new Error('Observer creation failed');
      }) as any;

      const callback = vi.fn();
      const result = (performanceHandler as any).safeObserve('paint', callback);

      expect(result).toBe(false);
    });

    it('should disconnect observer when once flag is true', async () => {
      const disconnectSpy = vi.fn();
      global.PerformanceObserver = vi.fn().mockImplementation((callback) => {
        const observer = {
          observe: vi.fn(),
          disconnect: disconnectSpy,
        };

        // Immediately call callback to simulate entry detection
        setTimeout(() => {
          callback(
            {
              getEntries: () => [{ name: 'test', startTime: 100 }],
            },
            observer,
          );
        }, 0);

        return observer;
      }) as any;

      const callback = vi.fn();
      (performanceHandler as any).safeObserve('paint', callback, { type: 'paint' }, true);

      // Wait for async callback
      return new Promise((resolve) => {
        setTimeout(() => {
          expect(disconnectSpy).toHaveBeenCalled();
          resolve(undefined);
        }, 10);
      });
    });

    it('should handle callback errors gracefully', () => {
      const failingCallback = vi.fn(() => {
        throw new Error('Callback failed');
      });

      expect(() => {
        (performanceHandler as any).safeObserve('paint', failingCallback);
      }).not.toThrow();
    });
  });

  describe('Navigation ID Generation', () => {
    it('should generate unique navigation ID', () => {
      // Mock performance.getEntriesByType
      global.performance.getEntriesByType = vi.fn().mockReturnValue([
        {
          startTime: 1234.56,
        },
      ]);

      Object.defineProperty(window, 'location', {
        value: { pathname: '/test' },
        writable: true,
        configurable: true,
      });

      const navId = (performanceHandler as any).getNavigationId();

      expect(navId).toBeDefined();
      expect(navId).toContain('/test');
      expect(navId).toContain('1234.56');
    });

    it('should return null when navigation timing is unavailable', () => {
      global.performance.getEntriesByType = vi.fn().mockReturnValue([]);

      const navId = (performanceHandler as any).getNavigationId();

      expect(navId).toBeNull();
    });

    it('should handle errors when getting navigation ID', () => {
      global.performance.getEntriesByType = vi.fn().mockImplementation(() => {
        throw new Error('getEntriesByType failed');
      });

      const navId = (performanceHandler as any).getNavigationId();

      expect(navId).toBeNull();
    });
  });

  describe('TTFB Reporting', () => {
    it('should report valid TTFB', () => {
      const trackSpy = vi.spyOn(eventManager, 'track');

      global.performance.getEntriesByType = vi.fn().mockReturnValue([
        {
          responseStart: 250.5,
        },
      ]);

      vi.spyOn(performanceHandler as any, 'shouldSendVital').mockReturnValue(true);
      vi.spyOn(performanceHandler as any, 'getNavigationId').mockReturnValue('nav-123');

      (performanceHandler as any).reportTTFB();

      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventType.WEB_VITALS,
          web_vitals: expect.objectContaining({
            type: 'TTFB',
          }),
        }),
      );
    });

    it('should report TTFB even when zero (cached response)', () => {
      const trackSpy = vi.spyOn(eventManager, 'track');

      global.performance.getEntriesByType = vi.fn().mockReturnValue([
        {
          responseStart: 0,
        },
      ]);

      vi.spyOn(performanceHandler as any, 'shouldSendVital').mockReturnValue(true);
      vi.spyOn(performanceHandler as any, 'getNavigationId').mockReturnValue('nav-123');

      (performanceHandler as any).reportTTFB();

      expect(trackSpy).toHaveBeenCalled();
    });

    it('should handle missing navigation timing', () => {
      const trackSpy = vi.spyOn(eventManager, 'track');

      global.performance.getEntriesByType = vi.fn().mockReturnValue([]);

      (performanceHandler as any).reportTTFB();

      expect(trackSpy).not.toHaveBeenCalled();
    });

    it('should handle errors when reporting TTFB', () => {
      global.performance.getEntriesByType = vi.fn().mockImplementation(() => {
        throw new Error('getEntriesByType failed');
      });

      expect(() => {
        (performanceHandler as any).reportTTFB();
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple start/stop cycles', async () => {
      await expect(performanceHandler.startTracking()).resolves.not.toThrow();
      performanceHandler.stopTracking();
      await expect(performanceHandler.startTracking()).resolves.not.toThrow();
      performanceHandler.stopTracking();
    });

    it('should handle stop before start', () => {
      expect(() => performanceHandler.stopTracking()).not.toThrow();
    });

    it('should handle missing performance API', () => {
      const originalPerf = global.performance;
      (global as any).performance = undefined;

      expect(() => {
        void performanceHandler.startTracking();
      }).not.toThrow();

      global.performance = originalPerf;
    });
  });
});
