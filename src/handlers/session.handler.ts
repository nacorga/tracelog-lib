import { EventManager } from '../managers/event.manager';
import { SessionManager } from '../managers/session.manager';
import { StateManager } from '../managers/state.manager';
import { StorageManager } from '../managers/storage.manager';
import { log } from '../utils';

/**
 * Wrapper around SessionManager providing consistent handler interface with robust error handling.
 *
 * **Purpose**: Manages user session lifecycle through delegation to SessionManager,
 * adding error recovery, state validation, and event buffer flushing.
 *
 * **Core Functionality**:
 * - Extracts projectId from config (tracelog/custom integrations or 'default')
 * - Creates SessionManager with storage, event manager, and projectId
 * - Flushes pending events after successful session initialization
 * - Automatic cleanup on initialization failures with nested try-catch
 *
 * **Key Features**:
 * - Idempotent operations (safe to call startTracking() multiple times)
 * - Double-destroy protection via destroyed flag
 * - State validation prevents operations on destroyed instances
 * - Centralized cleanup via cleanupSessionManager()
 *
 * **Lifecycle**:
 * - startTracking(): Creates session, sends SESSION_START event
 * - stopTracking(): Cleans up session tracking (no events emitted)
 * - destroy(): Same as stopTracking() (no events emitted in v2.0.0+)
 *
 * @example
 * ```typescript
 * const handler = new SessionHandler(storage, eventManager);
 * handler.startTracking(); // Creates session
 * handler.stopTracking(); // Ends session + cleanup
 * handler.destroy();      // Cleanup only
 * ```
 */
export class SessionHandler extends StateManager {
  private readonly eventManager: EventManager;
  private readonly storageManager: StorageManager;
  private sessionManager: SessionManager | null = null;
  private destroyed = false;

  constructor(storageManager: StorageManager, eventManager: EventManager) {
    super();
    this.eventManager = eventManager;
    this.storageManager = storageManager;
  }

  /**
   * Starts session tracking by creating SessionManager and initializing session.
   *
   * **Behavior**:
   * - Extracts projectId from config (tracelog projectId or custom collectApiUrl or 'default')
   * - Creates SessionManager instance with storage, event manager, and projectId
   * - Calls SessionManager.startTracking() to begin session lifecycle
   * - Flushes pending events buffered during initialization
   * - Idempotent: Early return if session already active
   * - Validates state: Warns and returns if handler destroyed
   *
   * **Error Handling**:
   * - On failure: Automatically cleans up SessionManager via nested try-catch
   * - Leaves handler in clean, reusable state after error
   * - Re-throws error after logging
   *
   * @throws {Error} If SessionManager initialization fails
   */
  startTracking(): void {
    if (this.isActive()) {
      return;
    }

    if (this.destroyed) {
      log('warn', 'Cannot start tracking on destroyed handler');
      return;
    }

    const config = this.get('config');
    const projectId = config?.integrations?.tracelog?.projectId ?? 'custom';

    try {
      this.sessionManager = new SessionManager(this.storageManager, this.eventManager, projectId);
      this.sessionManager.startTracking();

      this.eventManager.flushPendingEvents();
    } catch (error) {
      if (this.sessionManager) {
        try {
          this.sessionManager.destroy();
        } catch {
          /* empty */
        }
        this.sessionManager = null;
      }

      log('error', 'Failed to start session tracking', { error });
      throw error;
    }
  }

  private isActive(): boolean {
    return this.sessionManager !== null && !this.destroyed;
  }

  private cleanupSessionManager(): void {
    if (this.sessionManager) {
      this.sessionManager.stopTracking();
      this.sessionManager.destroy();
      this.sessionManager = null;
    }
  }

  /**
   * Stops session tracking by cleaning up resources.
   *
   * **Purpose**: Terminates session tracking and removes all listeners and timers.
   * No events are emitted (SESSION_END removed in v2.0.0).
   *
   * **Behavior**:
   * - Calls SessionManager.stopTracking() to clean up listeners
   * - Calls SessionManager.destroy() to finalize cleanup
   * - Safe to call multiple times (idempotent via cleanupSessionManager)
   *
   * **Note**: In v2.0.0+, this method only performs cleanup without emitting events.
   * Session end time is inferred server-side from last event timestamp.
   */
  stopTracking(): void {
    this.cleanupSessionManager();
  }

  /**
   * Destroys handler and cleans up SessionManager.
   *
   * **Purpose**: Same as stopTracking() in v2.0.0+. Both methods perform cleanup
   * without emitting events.
   *
   * **Behavior**:
   * - Idempotent: Early return if already destroyed
   * - Calls SessionManager.destroy() to clean up listeners and timers
   * - Sets sessionManager to null and destroyed flag to true
   *
   * **Note**: In v2.0.0+, there is no functional difference between stopTracking()
   * and destroy(). Both perform cleanup without emitting SESSION_END events.
   */
  destroy(): void {
    if (this.destroyed) {
      return;
    }

    if (this.sessionManager) {
      this.sessionManager.destroy();
      this.sessionManager = null;
    }

    this.destroyed = true;
  }
}
