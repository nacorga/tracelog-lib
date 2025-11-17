import { log } from '../utils';

/**
 * Manages accurate timestamp generation using monotonic clock (performance.now())
 * to prevent issues from system clock changes during the session.
 *
 * **Purpose**: Provides reliable timestamps immune to system clock adjustments
 * that could cause future timestamp rejections or incorrect event ordering.
 *
 * **Core Functionality**:
 * - **Boot Time Reference**: Captures `performance.now()` and `Date.now()` at initialization
 * - **Monotonic Clock**: Uses `performance.now()` for elapsed time (immune to clock changes)
 * - **Timestamp Generation**: `bootTimestamp + (performance.now() - bootTime)`
 * - **Graceful Degradation**: Falls back to `Date.now()` if `performance.now()` unavailable
 *
 * **Key Features**:
 * - **Clock Skew Protection**: Timestamps stay accurate even if system clock changes during session
 * - **No Server Dependency**: Works in standalone mode without backend communication
 * - **High Precision**: Uses performance.now() with microsecond precision
 * - **Detect Clock Skew**: Warns when significant clock drift detected (>30 seconds)
 *
 * **Use Cases**:
 * - Generate event timestamps that won't be rejected for being in the future
 * - Maintain correct event ordering even when system clock jumps
 * - Detect and warn about clock synchronization issues
 *
 * **Limitations**:
 * - Only protects against clock changes DURING the session
 * - If clock is wrong at boot time, timestamps will reflect that initial offset
 * - Server-side validation should still allow some tolerance (e.g., 3 minutes)
 *
 * @example
 * ```typescript
 * const timeManager = new TimeManager();
 *
 * // Get accurate timestamp (immune to clock changes)
 * const timestamp = timeManager.now(); // milliseconds since epoch
 *
 * // Check if clock skew detected
 * const skew = timeManager.getClockSkew(); // milliseconds of drift
 * if (Math.abs(skew) > 30000) {
 *   console.warn('System clock drifted by', skew, 'ms');
 * }
 * ```
 */
export class TimeManager {
  private readonly bootTime: number;
  private readonly bootTimestamp: number;
  private readonly hasPerformanceNow: boolean;
  private lastClockSkewCheck = 0;
  private detectedSkew = 0;

  /**
   * Creates a TimeManager instance and establishes boot time reference.
   *
   * **Initialization**:
   * 1. Captures `performance.now()` as boot time (monotonic clock)
   * 2. Captures `Date.now()` as boot timestamp (wall clock)
   * 3. Detects if `performance.now()` is available (for fallback)
   *
   * **Boot Time**: Reference point for all subsequent timestamp calculations
   * - All timestamps are relative to this boot time
   * - Immune to system clock changes after initialization
   */
  constructor() {
    this.hasPerformanceNow = typeof performance !== 'undefined' && typeof performance.now === 'function';

    if (this.hasPerformanceNow) {
      this.bootTime = performance.now();
      this.bootTimestamp = Date.now();

      log('debug', 'TimeManager initialized with monotonic clock', {
        data: {
          bootTime: this.bootTime.toFixed(3),
          bootTimestamp: this.bootTimestamp,
        },
      });
    } else {
      // Fallback for environments without performance.now()
      this.bootTime = 0;
      this.bootTimestamp = Date.now();

      log('warn', 'performance.now() not available, falling back to Date.now()');
    }
  }

  /**
   * Returns current timestamp in milliseconds since epoch.
   *
   * **Calculation**:
   * - If `performance.now()` available: `bootTimestamp + (performance.now() - bootTime)`
   * - Otherwise: `Date.now()` (fallback)
   *
   * **Advantages over Date.now()**:
   * - Immune to system clock changes during session
   * - More accurate (microsecond precision)
   * - Prevents future timestamp errors from clock adjustments
   *
   * @returns Timestamp in milliseconds since Unix epoch
   *
   * @example
   * ```typescript
   * const eventTimestamp = timeManager.now();
   * // Always accurate relative to boot time, even if system clock changes
   * ```
   */
  now(): number {
    if (!this.hasPerformanceNow) {
      return Date.now();
    }

    const elapsed = performance.now() - this.bootTime;
    return Math.round(this.bootTimestamp + elapsed);
  }

  /**
   * Detects clock skew by comparing monotonic time vs system time.
   *
   * **Purpose**: Identifies when the system clock has changed during the session.
   *
   * **Detection Method**:
   * 1. Calculate expected timestamp using monotonic clock: `now()`
   * 2. Compare with actual system time: `Date.now()`
   * 3. Difference is the clock skew
   *
   * **Clock Skew Scenarios**:
   * - Positive skew: System clock jumped forward (e.g., NTP correction)
   * - Negative skew: System clock jumped backward (rare, usually manual adjustment)
   * - Near zero: No significant clock drift
   *
   * **Throttling**: Only checks every 5 seconds to avoid performance impact
   *
   * @returns Clock skew in milliseconds (positive = clock ahead, negative = clock behind)
   *
   * @example
   * ```typescript
   * const skew = timeManager.getClockSkew();
   * if (Math.abs(skew) > 30000) {
   *   console.warn(`System clock drifted by ${skew}ms`);
   * }
   * ```
   */
  getClockSkew(): number {
    if (!this.hasPerformanceNow) {
      return 0;
    }

    const now = Date.now();

    // Throttle skew checks to every 5 seconds
    if (now - this.lastClockSkewCheck < 5000) {
      return this.detectedSkew;
    }

    this.lastClockSkewCheck = now;

    const monotonicTimestamp = this.now();
    const systemTimestamp = Date.now();
    this.detectedSkew = systemTimestamp - monotonicTimestamp;

    if (Math.abs(this.detectedSkew) > 30000) {
      log('warn', 'Significant clock skew detected', {
        data: {
          skewMs: this.detectedSkew,
          skewMinutes: (this.detectedSkew / 1000 / 60).toFixed(2),
          monotonicTime: new Date(monotonicTimestamp).toISOString(),
          systemTime: new Date(systemTimestamp).toISOString(),
        },
      });
    }

    return this.detectedSkew;
  }

  /**
   * Validates if a timestamp is reasonable (not too far in the future).
   *
   * **Purpose**: Client-side validation to catch obviously wrong timestamps
   * before sending to backend.
   *
   * **Validation Rules**:
   * - Timestamp must not be >2 minutes in the future (relative to monotonic clock)
   * - Prevents backend rejections due to clock skew
   * - More lenient than backend (allows up to 2 min vs backend's 3 min)
   *
   * **Use Case**: Validate event timestamps before adding to queue
   *
   * @param timestamp - Timestamp to validate (milliseconds since epoch)
   * @returns Object with `valid` boolean and optional `error` message
   *
   * @example
   * ```typescript
   * const validation = timeManager.validateTimestamp(eventTimestamp);
   * if (!validation.valid) {
   *   console.error('Invalid timestamp:', validation.error);
   * }
   * ```
   */
  validateTimestamp(timestamp: number): { valid: boolean; error?: string } {
    const maxFutureOffset = 2 * 60 * 1000; // 2 minutes
    const currentTime = this.now();
    const offset = timestamp - currentTime;

    if (offset > maxFutureOffset) {
      return {
        valid: false,
        error: `Timestamp is ${(offset / 1000 / 60).toFixed(2)} minutes in the future (max allowed: 2 minutes)`,
      };
    }

    return { valid: true };
  }

  /**
   * Returns boot time information for debugging.
   *
   * **Purpose**: Diagnostic utility for troubleshooting timestamp issues.
   *
   * @returns Object with boot time details
   */
  getBootInfo(): {
    bootTime: number;
    bootTimestamp: number;
    hasPerformanceNow: boolean;
    clockSkew: number;
  } {
    return {
      bootTime: this.bootTime,
      bootTimestamp: this.bootTimestamp,
      hasPerformanceNow: this.hasPerformanceNow,
      clockSkew: this.getClockSkew(),
    };
  }
}
