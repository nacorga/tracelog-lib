import { EventListenerManager } from './listeners.types';
import { log } from '../utils';

/**
 * Captures touch-based interactions on mobile and touch-enabled devices.
 *
 * **Events Tracked**: `touchstart`, `touchmove`, `touchend`, `orientationchange`
 *
 * **Purpose**: Mobile and touch device user activity detection for session management.
 *
 * **Key Features**:
 * - Essential touch event coverage (start, move, end)
 * - Orientation change detection for mobile devices
 * - Simplified v1 implementation (removed device motion complexity)
 * - Passive listeners for smooth touch performance
 * - Critical manager: Setup failures throw errors (fail-fast)
 *
 * **Error Handling**:
 * - Setup errors: Logs and throws (prevents incomplete initialization)
 * - Cleanup errors: Logs as warnings without throwing
 *
 * @see src/listeners/README.md (lines 18-30) for detailed documentation
 */
export class TouchListenerManager implements EventListenerManager {
  private readonly onActivity: () => void;
  private readonly options = { passive: true };

  constructor(onActivity: () => void) {
    this.onActivity = onActivity;
  }

  /**
   * Registers touch and orientation event listeners.
   *
   * **Events Registered**:
   * - `touchstart`: Touch interaction begins
   * - `touchmove`: Touch point moves
   * - `touchend`: Touch interaction ends
   * - `orientationchange`: Device orientation changes
   *
   * All listeners use `{ passive: true }` for optimal mobile performance.
   *
   * @throws Error if setup fails (critical manager - must succeed)
   */
  setup(): void {
    try {
      window.addEventListener('touchstart', this.onActivity, this.options);
      window.addEventListener('touchmove', this.onActivity, this.options);
      window.addEventListener('touchend', this.onActivity, this.options);
      window.addEventListener('orientationchange', this.onActivity, this.options);
    } catch (error) {
      log('error', 'Failed to setup touch listeners', { error });
      throw error;
    }
  }

  /**
   * Removes all touch and orientation event listeners to prevent memory leaks.
   *
   * Cleanup errors are logged as warnings but do not throw.
   * Safe to call multiple times (idempotent).
   */
  cleanup(): void {
    try {
      window.removeEventListener('touchstart', this.onActivity);
      window.removeEventListener('touchmove', this.onActivity);
      window.removeEventListener('touchend', this.onActivity);
      window.removeEventListener('orientationchange', this.onActivity);
    } catch (error) {
      log('warn', 'Error during touch listeners cleanup', { error });
    }
  }
}
