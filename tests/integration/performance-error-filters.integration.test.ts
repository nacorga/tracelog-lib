import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { EventManager } from '../../src/managers/event.manager';
import { PerformanceHandler } from '../../src/handlers/performance.handler';
import { ErrorHandler } from '../../src/handlers/error.handler';
import { resetGlobalState } from '../../src/managers/state.manager';
import { Config, EventType } from '../../src/types';
import {
  WEB_VITALS_THRESHOLDS,
  LONG_TASK_THROTTLE_MS,
} from '../../src/constants/performance.constants';
import {
  ERROR_BURST_THRESHOLD,
  ERROR_BURST_WINDOW_MS,
  ERROR_BURST_BACKOFF_MS,
} from '../../src/constants/error.constants';

class StubEventManager extends EventManager {
  events: EventType[] = [];

  constructor() {
    super({} as any, null, null);
    this.track = vi.fn((event) => {
      this.events.push(event.type as EventType);
    }) as any;
  }
}

describe('Integration: Performance and Error Filters', () => {
  let manager: StubEventManager;
  let performance: PerformanceHandler;
  let errorHandler: ErrorHandler;
  let config: Config;

  beforeEach(() => {
    resetGlobalState();
    config = { errorSampling: 1 };
    manager = new StubEventManager();
    performance = new PerformanceHandler(manager);
    errorHandler = new ErrorHandler(manager);
    performance['set']('config', config);
    errorHandler['set']('config', config);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Combined Behavior', () => {
    it('should emit only significant vitals and non-duplicate errors', () => {
      performance['sendVital']({ type: 'LCP', value: 1200 });
      performance['sendVital']({ type: 'LCP', value: 4200 });
      errorHandler['handleError'](new ErrorEvent('error', { message: 'Oops' }));
      errorHandler['handleError'](new ErrorEvent('error', { message: 'Oops' }));

      expect(manager.events).toEqual([EventType.WEB_VITALS, EventType.ERROR]);
    });
  });

  describe('PerformanceHandler - Web Vitals Filtering', () => {
    it('should filter LCP below threshold', () => {
      // LCP threshold is 4000ms
      performance['sendVital']({ type: 'LCP', value: 1200 });
      performance['sendVital']({ type: 'LCP', value: 3500 });

      expect(manager.events).toEqual([]);
    });

    it('should emit LCP above threshold', () => {
      // LCP threshold is 4000ms
      performance['sendVital']({ type: 'LCP', value: 4200 });

      expect(manager.events).toEqual([EventType.WEB_VITALS]);
    });

    it('should filter FCP below threshold', () => {
      // FCP threshold is 1800ms
      performance['sendVital']({ type: 'FCP', value: 1000 });
      performance['sendVital']({ type: 'FCP', value: 1700 });

      expect(manager.events).toEqual([]);
    });

    it('should emit FCP above threshold', () => {
      // FCP threshold is 1800ms
      performance['sendVital']({ type: 'FCP', value: 2000 });

      expect(manager.events).toEqual([EventType.WEB_VITALS]);
    });

    it('should filter CLS below threshold', () => {
      // CLS threshold is 0.25 (unitless)
      performance['sendVital']({ type: 'CLS', value: 0.1 });
      performance['sendVital']({ type: 'CLS', value: 0.24 });

      expect(manager.events).toEqual([]);
    });

    it('should emit CLS above threshold', () => {
      // CLS threshold is 0.25 (unitless)
      performance['sendVital']({ type: 'CLS', value: 0.3 });

      expect(manager.events).toEqual([EventType.WEB_VITALS]);
    });

    it('should filter INP below threshold', () => {
      // INP threshold is 200ms
      performance['sendVital']({ type: 'INP', value: 100 });
      performance['sendVital']({ type: 'INP', value: 199 });

      expect(manager.events).toEqual([]);
    });

    it('should emit INP above threshold', () => {
      // INP threshold is 200ms
      performance['sendVital']({ type: 'INP', value: 250 });

      expect(manager.events).toEqual([EventType.WEB_VITALS]);
    });

    it('should filter TTFB below threshold', () => {
      // TTFB threshold is 800ms
      performance['sendVital']({ type: 'TTFB', value: 500 });
      performance['sendVital']({ type: 'TTFB', value: 799 });

      expect(manager.events).toEqual([]);
    });

    it('should emit TTFB above threshold', () => {
      // TTFB threshold is 800ms
      performance['sendVital']({ type: 'TTFB', value: 900 });

      expect(manager.events).toEqual([EventType.WEB_VITALS]);
    });

    it('should emit multiple different vitals above thresholds', () => {
      performance['sendVital']({ type: 'LCP', value: 4200 });
      performance['sendVital']({ type: 'FCP', value: 2000 });
      performance['sendVital']({ type: 'INP', value: 250 });

      expect(manager.events).toEqual([
        EventType.WEB_VITALS,
        EventType.WEB_VITALS,
        EventType.WEB_VITALS,
      ]);
    });

    it('should mix filtered and emitted vitals correctly', () => {
      performance['sendVital']({ type: 'LCP', value: 1200 }); // Filtered
      performance['sendVital']({ type: 'FCP', value: 2000 }); // Emitted
      performance['sendVital']({ type: 'INP', value: 100 });  // Filtered
      performance['sendVital']({ type: 'CLS', value: 0.3 });  // Emitted

      expect(manager.events).toEqual([
        EventType.WEB_VITALS,
        EventType.WEB_VITALS,
      ]);
    });
  });

  describe('ErrorHandler - Error Sampling', () => {
    it('should sample errors at 100% rate', () => {
      errorHandler['set']('config', { errorSampling: 1 });

      for (let i = 0; i < 10; i++) {
        errorHandler['handleError'](
          new ErrorEvent('error', { message: `Error ${i}` })
        );
      }

      // All 10 unique errors should be tracked
      expect(manager.events.filter(e => e === EventType.ERROR).length).toBe(10);
    });

    it('should sample errors at 0% rate', () => {
      errorHandler['set']('config', { errorSampling: 0 });

      for (let i = 0; i < 10; i++) {
        errorHandler['handleError'](
          new ErrorEvent('error', { message: `Error ${i}` })
        );
      }

      // No errors should be tracked
      expect(manager.events).toEqual([]);
    });

    it('should sample errors at approximately 50% rate', () => {
      errorHandler['set']('config', { errorSampling: 0.5 });

      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.3)  // < 0.5, sampled
        .mockReturnValueOnce(0.7)  // >= 0.5, not sampled
        .mockReturnValueOnce(0.2)  // < 0.5, sampled
        .mockReturnValueOnce(0.9); // >= 0.5, not sampled

      errorHandler['handleError'](new ErrorEvent('error', { message: 'Error 1' }));
      errorHandler['handleError'](new ErrorEvent('error', { message: 'Error 2' }));
      errorHandler['handleError'](new ErrorEvent('error', { message: 'Error 3' }));
      errorHandler['handleError'](new ErrorEvent('error', { message: 'Error 4' }));

      // 2 out of 4 should be sampled
      expect(manager.events.filter(e => e === EventType.ERROR).length).toBe(2);
    });
  });

  describe('ErrorHandler - Deduplication', () => {
    it('should deduplicate identical error messages', () => {
      errorHandler['handleError'](new ErrorEvent('error', { message: 'Oops' }));
      errorHandler['handleError'](new ErrorEvent('error', { message: 'Oops' }));
      errorHandler['handleError'](new ErrorEvent('error', { message: 'Oops' }));

      // Only first occurrence should be tracked
      expect(manager.events).toEqual([EventType.ERROR]);
    });

    it('should track different error messages', () => {
      errorHandler['handleError'](new ErrorEvent('error', { message: 'Error A' }));
      errorHandler['handleError'](new ErrorEvent('error', { message: 'Error B' }));
      errorHandler['handleError'](new ErrorEvent('error', { message: 'Error C' }));

      expect(manager.events).toEqual([
        EventType.ERROR,
        EventType.ERROR,
        EventType.ERROR,
      ]);
    });

    it('should track first occurrence then deduplicate repeats', () => {
      errorHandler['handleError'](new ErrorEvent('error', { message: 'Error A' }));
      errorHandler['handleError'](new ErrorEvent('error', { message: 'Error A' })); // Duplicate
      errorHandler['handleError'](new ErrorEvent('error', { message: 'Error B' }));
      errorHandler['handleError'](new ErrorEvent('error', { message: 'Error B' })); // Duplicate
      errorHandler['handleError'](new ErrorEvent('error', { message: 'Error A' })); // Duplicate

      // Only first occurrence of each unique error
      expect(manager.events).toEqual([EventType.ERROR, EventType.ERROR]);
    });
  });

  describe('ErrorHandler - Burst Detection', () => {
    it('should allow errors below burst threshold', () => {
      vi.useFakeTimers();

      try {
        // ERROR_BURST_THRESHOLD is 10, so 9 unique errors should be allowed
        for (let i = 0; i < 9; i++) {
          errorHandler['handleError'](
            new ErrorEvent('error', { message: `Error ${i}` })
          );
        }

        expect(manager.events.filter(e => e === EventType.ERROR).length).toBe(9);
      } finally {
        vi.useRealTimers();
      }
    });

    it('should trigger burst protection at threshold', () => {
      vi.useFakeTimers();

      try {
        // Trigger burst: 10 unique errors in burst window
        for (let i = 0; i < 10; i++) {
          errorHandler['handleError'](
            new ErrorEvent('error', { message: `Error ${i}` })
          );
        }

        // 11th error should be blocked by burst protection
        errorHandler['handleError'](
          new ErrorEvent('error', { message: 'Error 10' })
        );

        // Only 10 errors tracked (burst protection kicks in)
        expect(manager.events.filter(e => e === EventType.ERROR).length).toBe(10);
      } finally {
        vi.useRealTimers();
      }
    });

    it('should resume after burst backoff period', () => {
      vi.useFakeTimers();

      try {
        // Trigger burst
        for (let i = 0; i < 10; i++) {
          errorHandler['handleError'](
            new ErrorEvent('error', { message: `Burst ${i}` })
          );
        }

        // This should be blocked
        errorHandler['handleError'](
          new ErrorEvent('error', { message: 'Blocked' })
        );

        expect(manager.events.filter(e => e === EventType.ERROR).length).toBe(10);

        // Advance past backoff period (5 seconds)
        vi.advanceTimersByTime(ERROR_BURST_BACKOFF_MS + 100);

        // Now errors should be tracked again
        errorHandler['handleError'](
          new ErrorEvent('error', { message: 'After backoff' })
        );

        expect(manager.events.filter(e => e === EventType.ERROR).length).toBe(11);
      } finally {
        vi.useRealTimers();
      }
    });

    it('should reset burst counter outside burst window', () => {
      vi.useFakeTimers();

      try {
        // Send 5 errors
        for (let i = 0; i < 5; i++) {
          errorHandler['handleError'](
            new ErrorEvent('error', { message: `Error ${i}` })
          );
        }

        // Wait longer than burst window (1 second)
        vi.advanceTimersByTime(ERROR_BURST_WINDOW_MS + 100);

        // Send 5 more errors (should not trigger burst since window reset)
        for (let i = 5; i < 10; i++) {
          errorHandler['handleError'](
            new ErrorEvent('error', { message: `Error ${i}` })
          );
        }

        // All 10 should be tracked (no burst triggered)
        expect(manager.events.filter(e => e === EventType.ERROR).length).toBe(10);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('Combined Sampling and Deduplication', () => {
    it('should apply sampling before deduplication', () => {
      errorHandler['set']('config', { errorSampling: 0.5 });

      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.3)  // Sampled
        .mockReturnValueOnce(0.7); // Not sampled

      errorHandler['handleError'](new ErrorEvent('error', { message: 'Error A' }));
      errorHandler['handleError'](new ErrorEvent('error', { message: 'Error A' })); // Duplicate but also not sampled

      // Only first one tracked (sampled)
      expect(manager.events).toEqual([EventType.ERROR]);
    });

    it('should deduplicate within sampled errors', () => {
      errorHandler['set']('config', { errorSampling: 1 });

      errorHandler['handleError'](new ErrorEvent('error', { message: 'Same' }));
      errorHandler['handleError'](new ErrorEvent('error', { message: 'Same' }));
      errorHandler['handleError'](new ErrorEvent('error', { message: 'Different' }));
      errorHandler['handleError'](new ErrorEvent('error', { message: 'Same' }));

      // Only 2 unique errors tracked
      expect(manager.events).toEqual([EventType.ERROR, EventType.ERROR]);
    });
  });
});
