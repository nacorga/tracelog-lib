import { EventListenerManager } from './listeners.types';
import { log } from '../utils';

/**
 * Detects page unload events for session termination and data persistence.
 *
 * **Events Tracked**: `beforeunload`, `pagehide`
 *
 * **Purpose**: Ensures proper session ending and final data transmission before page closes.
 *
 * **Key Features**:
 * - Reliable unload detection across browsers
 * - Throws errors on setup failure (fail-fast approach)
 * - Essential for session boundary tracking
 * - Critical manager: Setup failures throw errors
 *
 * **Current Status**:
 * ⚠️ **Currently unused in production** - SessionManager handles `beforeunload` directly
 *
 * **Error Handling**:
 * - Setup errors: Logs and throws (prevents incomplete initialization)
 * - Cleanup errors: Logs as warnings without throwing
 *
 * @see src/listeners/README.md (lines 58-70) for detailed documentation
 *
 * @deprecated In practice, SessionManager handles unload events directly.
 * This class is kept for potential future use or alternative implementations.
 */
export class UnloadListenerManager implements EventListenerManager {
  private readonly onInactivity: () => void;
  private readonly options = { passive: true };

  constructor(onInactivity: () => void) {
    this.onInactivity = onInactivity;
  }

  /**
   * Registers page unload event listeners.
   *
   * **Events Registered**:
   * - `beforeunload`: Page is about to unload (last chance to run synchronous code)
   * - `pagehide`: Page is being hidden/unloaded (better mobile support than beforeunload)
   *
   * Both listeners use `{ passive: true }` for optimal performance.
   *
   * @throws Error if setup fails (critical manager - must succeed)
   */
  setup(): void {
    try {
      window.addEventListener('beforeunload', this.onInactivity, this.options);
      window.addEventListener('pagehide', this.onInactivity, this.options);
    } catch (error) {
      log('error', 'Failed to setup unload listeners', { error });
      throw error;
    }
  }

  /**
   * Removes all unload event listeners to prevent memory leaks.
   *
   * Cleanup errors are logged as warnings but do not throw.
   * Safe to call multiple times (idempotent).
   */
  cleanup(): void {
    try {
      window.removeEventListener('beforeunload', this.onInactivity);
      window.removeEventListener('pagehide', this.onInactivity);
    } catch (error) {
      log('warn', 'Error during unload listeners cleanup', { error });
    }
  }
}
