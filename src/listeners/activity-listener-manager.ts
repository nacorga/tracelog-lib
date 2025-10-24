import { EventListenerManager } from './listeners.types';
import { log } from '../utils';

/**
 * Tracks general user activity through window-level events.
 *
 * **Events Tracked**: `scroll`, `resize`, `focus`
 *
 * **Purpose**: Detects user engagement and activity patterns for session management.
 *
 * **Key Features**:
 * - Passive event listeners for optimal performance
 * - Window-level event detection
 * - Clean resource management with proper cleanup
 * - Critical manager: Setup failures throw errors (fail-fast)
 *
 * **Error Handling**:
 * - Setup errors: Logs and throws (prevents incomplete initialization)
 * - Cleanup errors: Logs as warnings without throwing
 *
 * @see src/listeners/README.md (lines 5-17) for detailed documentation
 */
export class ActivityListenerManager implements EventListenerManager {
  private readonly onActivity: () => void;
  private readonly options = { passive: true };

  constructor(onActivity: () => void) {
    this.onActivity = onActivity;
  }

  /**
   * Registers window-level activity event listeners.
   *
   * **Events Registered**:
   * - `scroll`: User scrolling activity
   * - `resize`: Window resize events
   * - `focus`: Window focus events
   *
   * All listeners use `{ passive: true }` for optimal performance.
   *
   * @throws Error if setup fails (critical manager - must succeed)
   */
  setup(): void {
    try {
      window.addEventListener('scroll', this.onActivity, this.options);
      window.addEventListener('resize', this.onActivity, this.options);
      window.addEventListener('focus', this.onActivity, this.options);
    } catch (error) {
      log('error', 'Failed to setup activity listeners', { error });
      throw error;
    }
  }

  /**
   * Removes all activity event listeners to prevent memory leaks.
   *
   * Cleanup errors are logged as warnings but do not throw.
   * Safe to call multiple times (idempotent).
   */
  cleanup(): void {
    try {
      window.removeEventListener('scroll', this.onActivity);
      window.removeEventListener('resize', this.onActivity);
      window.removeEventListener('focus', this.onActivity);
    } catch (error) {
      log('warn', 'Error during activity listeners cleanup', { error });
    }
  }
}
