import { log } from '../utils';
import { StateManager } from './state.manager';

/**
 * Manages accurate timestamp generation using monotonic clock (`performance.now()`)
 * to prevent issues from system clock changes during the session.
 *
 * - Boot reference: `performance.now()` + `Date.now()` captured at construction.
 * - `now()` returns `bootTimestamp + (performance.now() - bootTime)` (immune to clock changes during session).
 * - Falls back to `Date.now()` when `performance.now()` is unavailable (SSR / old browsers).
 */
export class TimeManager extends StateManager {
  private readonly bootTime: number;
  private readonly bootTimestamp: number;
  private readonly hasPerformanceNow: boolean;

  constructor() {
    super();

    if (typeof window === 'undefined') {
      this.hasPerformanceNow = false;
      this.bootTime = 0;
      this.bootTimestamp = 0;
      return;
    }

    this.hasPerformanceNow = typeof performance !== 'undefined' && typeof performance.now === 'function';

    if (this.hasPerformanceNow) {
      this.bootTime = performance.now();
      this.bootTimestamp = Date.now();
    } else {
      this.bootTime = 0;
      this.bootTimestamp = Date.now();
      log('debug', 'performance.now() not available, falling back to Date.now()');
    }
  }

  /**
   * Returns current timestamp in milliseconds since epoch, immune to clock
   * changes during the session.
   */
  now(): number {
    if (!this.hasPerformanceNow) {
      return Date.now();
    }

    const elapsed = performance.now() - this.bootTime;
    return Math.round(this.bootTimestamp + elapsed);
  }

  /**
   * Validates a timestamp is not more than 2 minutes in the future relative
   * to the monotonic clock. Backend allows 3 minutes — keep client tighter
   * so obvious clock-skew events are flagged before they hit the wire.
   */
  validateTimestamp(timestamp: number): { valid: boolean; error?: string } {
    const maxFutureOffset = 2 * 60 * 1000;
    const offset = timestamp - this.now();

    if (offset > maxFutureOffset) {
      return {
        valid: false,
        error: `Timestamp is ${(offset / 1000 / 60).toFixed(2)} minutes in the future (max allowed: 2 minutes)`,
      };
    }

    return { valid: true };
  }
}
