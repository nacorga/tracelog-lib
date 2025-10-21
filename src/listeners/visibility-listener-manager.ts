import { EventListenerManager } from './listeners.types';
import { log } from '../utils';

/**
 * Monitors page visibility state and window focus for session lifecycle management with dual callback routing.
 *
 * **Events Tracked**: `visibilitychange`, `blur`, `focus`, `online`, `offline`
 *
 * **Purpose**: Tracks when users switch tabs, minimize windows, or lose network connectivity.
 * Routes events to different callbacks based on whether they indicate user engagement or visibility changes.
 *
 * **Dual Callback Architecture**:
 * - `onActivity` callback: Triggered by `focus` and `online` events (positive user engagement)
 * - `onVisibilityChange` callback: Triggered by `visibilitychange`, `blur`, and `offline` events
 *
 * **Key Features**:
 * - Page Visibility API integration (`visibilitychange`)
 * - Window focus/blur detection
 * - Basic network status monitoring (`online`/`offline`)
 * - Simplified v1 architecture (removed mobile-specific complexity)
 * - Passive listeners for optimal performance
 * - Non-critical manager: Setup failures log errors but don't throw (graceful degradation)
 *
 * **Error Handling**:
 * - Setup errors: Logs error without throwing (allows partial functionality)
 * - Cleanup errors: Logs as warnings without throwing
 *
 * @see src/listeners/README.md (lines 32-56) for detailed documentation
 *
 * @example
 * ```typescript
 * const manager = new VisibilityListenerManager(
 *   () => console.log('User returned!'),        // focus, online
 *   () => console.log('User left or offline')   // visibilitychange, blur, offline
 * );
 * manager.setup();
 * ```
 */
export class VisibilityListenerManager implements EventListenerManager {
  private readonly onActivity: () => void;
  private readonly onVisibilityChange: () => void;
  private readonly options = { passive: true };

  constructor(onActivity: () => void, onVisibilityChange: () => void) {
    this.onActivity = onActivity;
    this.onVisibilityChange = onVisibilityChange;
  }

  /**
   * Registers visibility, focus, and network status event listeners.
   *
   * **Callback Routing**:
   * - `onActivity`: `focus`, `online`
   * - `onVisibilityChange`: `visibilitychange`, `blur`, `offline`
   *
   * **Events Registered**:
   * - `visibilitychange`: Page visibility state changes (if Visibility API supported)
   * - `blur`: Window loses focus
   * - `focus`: Window gains focus
   * - `online`: Network connectivity restored (if Navigator.onLine supported)
   * - `offline`: Network connectivity lost (if Navigator.onLine supported)
   *
   * All listeners use `{ passive: true }` for optimal performance.
   * Setup failures are logged but don't throw (graceful degradation).
   */
  setup(): void {
    try {
      // Core visibility API support (Visibility API check)
      if ('visibilityState' in document) {
        document.addEventListener('visibilitychange', this.onVisibilityChange, this.options);
      }

      // Window focus/blur events for tab switching detection
      window.addEventListener('blur', this.onVisibilityChange, this.options);
      window.addEventListener('focus', this.onActivity, this.options);

      // Basic network status detection (Navigator.onLine API)
      if ('onLine' in navigator) {
        window.addEventListener('online', this.onActivity, this.options);
        window.addEventListener('offline', this.onVisibilityChange, this.options);
      }
    } catch (error) {
      log('error', 'Failed to setup visibility listeners', { error });
      // Non-critical: Don't throw, allow partial functionality
    }
  }

  /**
   * Removes all visibility, focus, and network status event listeners to prevent memory leaks.
   *
   * Cleanup errors are logged as warnings but do not throw.
   * Safe to call multiple times (idempotent).
   */
  cleanup(): void {
    try {
      if ('visibilityState' in document) {
        document.removeEventListener('visibilitychange', this.onVisibilityChange);
      }

      window.removeEventListener('blur', this.onVisibilityChange);
      window.removeEventListener('focus', this.onActivity);

      if ('onLine' in navigator) {
        window.removeEventListener('online', this.onActivity);
        window.removeEventListener('offline', this.onVisibilityChange);
      }
    } catch (error) {
      log('warn', 'Error during visibility listeners cleanup', { error });
    }
  }
}
