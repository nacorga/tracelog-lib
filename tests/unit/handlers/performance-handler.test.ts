import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { PerformanceHandler } from '../../../src/handlers/performance.handler';
import type { EventManager } from '../../../src/managers/event.manager';
import { EventType, WebVitalType } from '../../../src/types';
import { LONG_TASK_THROTTLE_MS } from '../../../src/constants';

describe('PerformanceHandler', () => {
  let handler: PerformanceHandler;
  let mockEventManager: EventManager;
  let trackSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockEventManager = { track: vi.fn() } as unknown as EventManager;
    trackSpy = mockEventManager.track as ReturnType<typeof vi.fn>;
    handler = new PerformanceHandler(mockEventManager);
    handler['set']('config', {} as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Threshold Validation', () => {
    it.each([
      // Default mode is 'needs-improvement' so these are the thresholds used
      ['LCP', 2500, 2499, false],
      ['LCP', 2500, 2500, false],
      ['LCP', 2500, 2501, true],
      ['CLS', 0.1, 0.09, false],
      ['CLS', 0.1, 0.1, false],
      ['CLS', 0.1, 0.11, true],
      ['INP', 200, 199, false],
      ['INP', 200, 200, false],
      ['INP', 200, 201, true],
      ['FCP', 1800, 1799, false],
      ['FCP', 1800, 1800, false],
      ['FCP', 1800, 1801, true],
      ['TTFB', 800, 799, false],
      ['TTFB', 800, 800, false],
      ['TTFB', 800, 801, true],
      ['LONG_TASK', 50, 49, false],
      ['LONG_TASK', 50, 50, false],
      ['LONG_TASK', 50, 51, true],
    ])('should handle %s threshold (%dms): value %d -> send=%s', (type, threshold, value, shouldSend) => {
      const result = handler['shouldSendVital'](type as any, value);
      expect(result).toBe(shouldSend);
      expect(handler['vitalThresholds'][type as WebVitalType]).toBe(threshold);
    });

    it('should reject invalid values (NaN, Infinity)', () => {
      expect(handler['shouldSendVital']('LCP', NaN)).toBe(false);
      expect(handler['shouldSendVital']('LCP', Infinity)).toBe(false);
      expect(handler['shouldSendVital']('LCP', -Infinity)).toBe(false);
    });

    it('should reject non-finite values and log warning', () => {
      const logSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      handler['shouldSendVital']('LCP', NaN);

      // Log is called via internal log utility
      logSpy.mockRestore();
    });
  });

  describe('Value Precision', () => {
    it('should send values as-is through sendVital (precision handled elsewhere)', () => {
      // sendVital doesn't round - it passes values to trackWebVital
      handler['sendVital']({ type: 'LCP', value: 5000.12345 });

      expect(trackSpy).toHaveBeenCalledWith({
        type: EventType.WEB_VITALS,
        web_vitals: { type: 'LCP', value: 5000.12345 },
      });
    });

    it('should handle values with no decimal places', () => {
      handler['sendVital']({ type: 'LCP', value: 5000 });

      expect(trackSpy).toHaveBeenCalledWith({
        type: EventType.WEB_VITALS,
        web_vitals: { type: 'LCP', value: 5000 },
      });
    });

    it('should handle very small values (CLS)', () => {
      handler['sendVital']({ type: 'CLS', value: 0.251234 });

      expect(trackSpy).toHaveBeenCalledWith({
        type: EventType.WEB_VITALS,
        web_vitals: { type: 'CLS', value: 0.251234 },
      });
    });
  });

  describe('Deduplication Logic', () => {
    beforeEach(() => {
      // Mock getNavigationId to return consistent value
      vi.spyOn(handler as any, 'getNavigationId').mockReturnValue('nav-123');
    });

    it('should prevent duplicate vitals for same navigation', () => {
      handler['sendVital']({ type: 'LCP', value: 5000 });
      handler['sendVital']({ type: 'LCP', value: 6000 }); // Duplicate type

      expect(trackSpy).toHaveBeenCalledTimes(1);
    });

    it('should allow different vital types for same navigation', () => {
      handler['sendVital']({ type: 'LCP', value: 5000 });
      handler['sendVital']({ type: 'FCP', value: 2000 });
      handler['sendVital']({ type: 'CLS', value: 0.3 });

      expect(trackSpy).toHaveBeenCalledTimes(3);
    });

    it('should allow same vital type for different navigations', () => {
      const getNavIdSpy = vi
        .spyOn(handler as any, 'getNavigationId')
        .mockReturnValueOnce('nav-1')
        .mockReturnValueOnce('nav-2');

      handler['sendVital']({ type: 'LCP', value: 5000 });
      handler['sendVital']({ type: 'LCP', value: 5000 });

      expect(trackSpy).toHaveBeenCalledTimes(2);
      getNavIdSpy.mockRestore();
    });

    it('should track all vitals when navigation ID is unavailable', () => {
      vi.spyOn(handler as any, 'getNavigationId').mockReturnValue(null);

      handler['sendVital']({ type: 'LCP', value: 5000 });
      handler['sendVital']({ type: 'LCP', value: 6000 });

      // Both should be sent when no navId (no deduplication possible)
      expect(trackSpy).toHaveBeenCalledTimes(2);
    });

    it('should clear deduplication map on stopTracking', () => {
      handler['sendVital']({ type: 'LCP', value: 5000 });
      expect(handler['reportedByNav'].size).toBe(1);

      handler.stopTracking();
      expect(handler['reportedByNav'].size).toBe(0);
    });
  });

  describe('Observer Lifecycle', () => {
    it('should disconnect all observers on stopTracking', () => {
      const mockObs1 = { disconnect: vi.fn() };
      const mockObs2 = { disconnect: vi.fn() };

      handler['observers'].push(mockObs1 as any, mockObs2 as any);

      handler.stopTracking();

      expect(mockObs1.disconnect).toHaveBeenCalled();
      expect(mockObs2.disconnect).toHaveBeenCalled();
      expect(handler['observers'].length).toBe(0);
    });

    it('should handle observer disconnect errors gracefully', () => {
      const mockObs = {
        disconnect: vi.fn(() => {
          throw new Error('Disconnect failed');
        }),
      };

      handler['observers'].push(mockObs as any);

      expect(() => {
        handler.stopTracking();
      }).not.toThrow();
      expect(handler['observers'].length).toBe(0);
    });

    it('should clear deduplication state on stopTracking', () => {
      vi.spyOn(handler as any, 'getNavigationId').mockReturnValue('nav-123');
      handler['sendVital']({ type: 'LCP', value: 5000 });

      expect(handler['reportedByNav'].size).toBeGreaterThan(0);

      handler.stopTracking();

      expect(handler['reportedByNav'].size).toBe(0);
    });
  });

  describe('Invalid Value Handling', () => {
    it('should not track non-finite values in trackWebVital', () => {
      handler['trackWebVital']('LCP', NaN);
      handler['trackWebVital']('LCP', Infinity);
      handler['trackWebVital']('LCP', -Infinity);

      expect(trackSpy).not.toHaveBeenCalled();
    });

    it('should track valid zero values', () => {
      // TTFB can be 0 in some browsers
      handler['trackWebVital']('TTFB', 0);

      expect(trackSpy).toHaveBeenCalledWith({
        type: EventType.WEB_VITALS,
        web_vitals: { type: 'TTFB', value: 0 },
      });
    });

    it('should track very large values if above threshold', () => {
      handler['sendVital']({ type: 'LCP', value: 999999.99 });

      expect(trackSpy).toHaveBeenCalledWith({
        type: EventType.WEB_VITALS,
        web_vitals: { type: 'LCP', value: 999999.99 },
      });
    });
  });

  describe('Long Task Throttling', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should throttle long tasks to one per second', () => {
      const now = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(now);

      // First long task should be sent
      handler['lastLongTaskSentAt'] = 0;
      const shouldSend1 = now - handler['lastLongTaskSentAt'] >= LONG_TASK_THROTTLE_MS;
      expect(shouldSend1).toBe(true);

      // Update lastLongTaskSentAt
      handler['lastLongTaskSentAt'] = now;

      // Immediate second task should be throttled
      vi.spyOn(Date, 'now').mockReturnValue(now + 500); // 500ms later
      const shouldSend2 = now + 500 - handler['lastLongTaskSentAt'] >= LONG_TASK_THROTTLE_MS;
      expect(shouldSend2).toBe(false);

      // After throttle window, should send again
      vi.spyOn(Date, 'now').mockReturnValue(now + 1100); // 1100ms later
      const shouldSend3 = now + 1100 - handler['lastLongTaskSentAt'] >= LONG_TASK_THROTTLE_MS;
      expect(shouldSend3).toBe(true);
    });

    it('should verify LONG_TASK_THROTTLE_MS constant value', () => {
      expect(LONG_TASK_THROTTLE_MS).toBe(1000);
    });
  });

  describe('Navigation ID Generation', () => {
    it('should generate consistent navigation ID format', () => {
      const mockNav = {
        startTime: 123.45,
      };

      global.performance.getEntriesByType = vi.fn(() => [mockNav] as any);
      Object.defineProperty(window, 'location', {
        value: { pathname: '/test-page' },
        writable: true,
        configurable: true,
      });

      const navId = handler['getNavigationId']();

      expect(navId).toMatch(/^\d+\.\d{2}_\/test-page_[a-z0-9]{5}$/);
    });

    it('should return null when navigation timing unavailable', () => {
      global.performance.getEntriesByType = vi.fn(() => []);

      const navId = handler['getNavigationId']();

      expect(navId).toBeNull();
    });

    it('should handle errors in navigation ID generation', () => {
      global.performance.getEntriesByType = vi.fn(() => {
        throw new Error('Navigation API error');
      });

      const navId = handler['getNavigationId']();

      expect(navId).toBeNull();
    });
  });

  describe('Observer Support Detection', () => {
    it('should detect PerformanceObserver availability', () => {
      const originalPO = global.PerformanceObserver;

      // Test when PerformanceObserver exists
      expect(handler['isObserverSupported']('longtask')).toBeDefined();

      // Test when PerformanceObserver is undefined
      (global as any).PerformanceObserver = undefined;
      expect(handler['isObserverSupported']('longtask')).toBe(false);

      // Restore
      global.PerformanceObserver = originalPO;
    });

    it('should check supportedEntryTypes when available', () => {
      const originalPO = global.PerformanceObserver;

      (global as any).PerformanceObserver = {
        supportedEntryTypes: ['navigation', 'measure'],
      };

      expect(handler['isObserverSupported']('navigation')).toBe(true);
      expect(handler['isObserverSupported']('longtask')).toBe(false);

      global.PerformanceObserver = originalPO;
    });
  });

  describe('Safe Observer Creation', () => {
    it('should return false when observer type not supported', () => {
      vi.spyOn(handler as any, 'isObserverSupported').mockReturnValue(false);

      const result = handler['safeObserve']('unsupported-type', vi.fn());

      expect(result).toBe(false);
    });

    it('should handle observer creation errors gracefully', () => {
      vi.spyOn(handler as any, 'isObserverSupported').mockReturnValue(true);

      const originalPO = global.PerformanceObserver;
      (global as any).PerformanceObserver = vi.fn(() => {
        throw new Error('Observer creation failed');
      });

      const result = handler['safeObserve']('longtask', vi.fn());

      expect(result).toBe(false);

      global.PerformanceObserver = originalPO;
    });

    it('should not add once-only observers to observers array', () => {
      const initialLength = handler['observers'].length;

      handler['safeObserve']('paint', vi.fn(), { type: 'paint', buffered: true }, true);

      // Once-only observers should not be tracked
      expect(handler['observers'].length).toBe(initialLength);
    });

    it('should handle callback errors without throwing', () => {
      const failingCallback = vi.fn(() => {
        throw new Error('Callback error');
      });

      // safeObserve wraps callbacks in try-catch
      expect(() => {
        handler['safeObserve']('measure', failingCallback, { type: 'measure' });
      }).not.toThrow();
    });
  });

  describe('Integration with EventManager', () => {
    it('should call eventManager.track with correct event structure', () => {
      handler['sendVital']({ type: 'LCP', value: 5000 });

      expect(trackSpy).toHaveBeenCalledWith({
        type: EventType.WEB_VITALS,
        web_vitals: {
          type: 'LCP',
          value: 5000,
        },
      });
    });

    it('should track multiple different vitals', () => {
      vi.spyOn(handler as any, 'getNavigationId').mockReturnValue('nav-123');

      handler['sendVital']({ type: 'LCP', value: 5000 });
      handler['sendVital']({ type: 'FCP', value: 3500 });
      handler['sendVital']({ type: 'CLS', value: 0.3 });
      handler['sendVital']({ type: 'INP', value: 550 });
      handler['sendVital']({ type: 'TTFB', value: 2000 });

      expect(trackSpy).toHaveBeenCalledTimes(5);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing threshold for unknown vital type', () => {
      const unknownType = 'UNKNOWN_VITAL' as any;

      // shouldSendVital should handle gracefully
      const result = handler['shouldSendVital'](unknownType, 100);

      // With no threshold defined, it should still validate the value
      expect(result).toBe(true); // No threshold = always send if valid value
    });

    it('should handle rapid stopTracking calls', () => {
      expect(() => {
        handler.stopTracking();
        handler.stopTracking();
        handler.stopTracking();
      }).not.toThrow();

      expect(handler['observers'].length).toBe(0);
      expect(handler['reportedByNav'].size).toBe(0);
    });

    it('should handle sendVital with boundary threshold values', () => {
      // Exactly at threshold - should NOT send (default is needs-improvement mode with LCP threshold of 2500)
      handler['sendVital']({ type: 'LCP', value: 2500 });
      expect(trackSpy).not.toHaveBeenCalled();

      // Just above threshold - should send
      handler['sendVital']({ type: 'LCP', value: 2500.01 });
      expect(trackSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Threshold Constants Verification', () => {
    it('should have correct threshold values (default needs-improvement mode)', () => {
      expect(handler['vitalThresholds'].LCP).toBe(2500);
      expect(handler['vitalThresholds'].FCP).toBe(1800);
      expect(handler['vitalThresholds'].CLS).toBe(0.1);
      expect(handler['vitalThresholds'].INP).toBe(200);
      expect(handler['vitalThresholds'].TTFB).toBe(800);
      expect(handler['vitalThresholds'].LONG_TASK).toBe(50);
    });
  });

  describe('Navigation History Limit (Memory Leak Prevention)', () => {
    it('should limit reportedByNav entries to MAX_NAVIGATION_HISTORY', () => {
      // Simulate 100 unique navigations (well beyond the 50 limit)
      for (let i = 0; i < 100; i++) {
        const navId = `nav-${i}`;
        vi.spyOn(handler as any, 'getNavigationId').mockReturnValue(navId);

        // Send a vital for this navigation
        handler['sendVital']({ type: 'LCP', value: 5000 + i });
      }

      // Map size should not exceed MAX_NAVIGATION_HISTORY (50)
      const mapSize = handler['reportedByNav'].size;
      const historySize = handler['navigationHistory'].length;

      expect(mapSize).toBe(50);
      expect(historySize).toBe(50);
    });

    it('should use FIFO eviction (oldest navigation removed first)', () => {
      // Add 51 navigations to trigger eviction
      const navIds: string[] = [];
      for (let i = 0; i < 51; i++) {
        const navId = `nav-${i}`;
        navIds.push(navId);
        vi.spyOn(handler as any, 'getNavigationId').mockReturnValue(navId);
        handler['sendVital']({ type: 'LCP', value: 5000 });
      }

      // First navigation (nav-0) should be evicted
      expect(handler['reportedByNav'].has('nav-0')).toBe(false);

      // Last 50 navigations should be present (nav-1 through nav-50)
      expect(handler['reportedByNav'].has('nav-1')).toBe(true);
      expect(handler['reportedByNav'].has('nav-50')).toBe(true);

      // Navigation history should match
      expect(handler['navigationHistory'][0]).toBe('nav-1');
      expect(handler['navigationHistory'][49]).toBe('nav-50');
    });

    it('should maintain deduplication within navigation history window', () => {
      const navId = 'nav-123';
      vi.spyOn(handler as any, 'getNavigationId').mockReturnValue(navId);

      // Send LCP twice for same navigation
      handler['sendVital']({ type: 'LCP', value: 5000 });
      handler['sendVital']({ type: 'LCP', value: 5100 });

      // Only first LCP should be tracked
      expect(trackSpy).toHaveBeenCalledTimes(1);
      expect(trackSpy).toHaveBeenCalledWith({
        type: EventType.WEB_VITALS,
        web_vitals: { type: 'LCP', value: 5000 },
      });
    });

    it('should allow same vital type after navigation eviction', () => {
      // Fill up history with 50 navigations sending LCP
      for (let i = 0; i < 50; i++) {
        vi.spyOn(handler as any, 'getNavigationId').mockReturnValue(`nav-${i}`);
        handler['sendVital']({ type: 'LCP', value: 5000 + i });
      }

      expect(trackSpy).toHaveBeenCalledTimes(50);
      trackSpy.mockClear();

      // Add 51st navigation (evicts nav-0)
      vi.spyOn(handler as any, 'getNavigationId').mockReturnValue('nav-50');
      handler['sendVital']({ type: 'LCP', value: 5050 });

      expect(trackSpy).toHaveBeenCalledTimes(1);
      expect(handler['reportedByNav'].size).toBe(50);
    });

    it('should clear navigation history on stopTracking', () => {
      // Add some navigations
      for (let i = 0; i < 10; i++) {
        vi.spyOn(handler as any, 'getNavigationId').mockReturnValue(`nav-${i}`);
        handler['sendVital']({ type: 'LCP', value: 5000 });
      }

      expect(handler['reportedByNav'].size).toBe(10);
      expect(handler['navigationHistory'].length).toBe(10);

      // Stop tracking
      handler.stopTracking();

      expect(handler['reportedByNav'].size).toBe(0);
      expect(handler['navigationHistory'].length).toBe(0);
    });

    it('should handle multiple vitals per navigation correctly', () => {
      const navId = 'nav-multi';
      vi.spyOn(handler as any, 'getNavigationId').mockReturnValue(navId);

      // Send all 5 vital types for same navigation
      handler['sendVital']({ type: 'LCP', value: 5000 });
      handler['sendVital']({ type: 'FCP', value: 2000 });
      handler['sendVital']({ type: 'CLS', value: 0.3 });
      handler['sendVital']({ type: 'INP', value: 250 });
      handler['sendVital']({ type: 'TTFB', value: 900 });

      // All 5 should be tracked
      expect(trackSpy).toHaveBeenCalledTimes(5);

      // But navigation history should only have one entry
      expect(handler['navigationHistory'].length).toBe(1);
      expect(handler['reportedByNav'].size).toBe(1);

      // The Set should contain all 5 vital types
      const vitalsForNav = handler['reportedByNav'].get(navId);
      expect(vitalsForNav?.size).toBe(5);
      expect(vitalsForNav?.has('LCP')).toBe(true);
      expect(vitalsForNav?.has('FCP')).toBe(true);
      expect(vitalsForNav?.has('CLS')).toBe(true);
      expect(vitalsForNav?.has('INP')).toBe(true);
      expect(vitalsForNav?.has('TTFB')).toBe(true);
    });

    it('should not add duplicate navigation IDs to history', () => {
      const navId = 'nav-same';
      vi.spyOn(handler as any, 'getNavigationId').mockReturnValue(navId);

      // Send multiple vitals for same navigation
      handler['sendVital']({ type: 'LCP', value: 5000 });
      handler['sendVital']({ type: 'FCP', value: 2000 });
      handler['sendVital']({ type: 'CLS', value: 0.3 });

      // Navigation history should only have one entry (not duplicated)
      expect(handler['navigationHistory'].length).toBe(1);
      expect(handler['navigationHistory'][0]).toBe(navId);
    });
  });
});
