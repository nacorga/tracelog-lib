import { BROADCAST_CHANNEL_NAME, DEFAULT_SESSION_TIMEOUT, SESSION_STORAGE_KEY } from '../constants';
import { EventType } from '../types';
import { log } from '../utils';
import { StateManager } from './state.manager';
import { StorageManager } from './storage.manager';
import { EventManager } from './event.manager';

interface StoredSessionData {
  id: string;
  lastActivity: number;
}

/**
 * Manages user sessions with cross-tab synchronization, inactivity detection,
 * and automatic lifecycle tracking.
 *
 * **Purpose**: Creates and manages user sessions, tracking session start
 * with automatic persistence, recovery, and multi-tab synchronization.
 * Does not track session end events (removed in v2.0.0).
 *
 * **Core Functionality**:
 * - **Session Generation**: Creates unique session IDs (`{timestamp}-{9-char-base36}`)
 * - **Activity Tracking**: Monitors user interactions to extend session timeout
 * - **Cross-Tab Sync**: BroadcastChannel synchronization across browser tabs
 * - **Persistence**: Stores session data in localStorage for recovery
 * - **Inactivity Detection**: Automatic timeout after inactivity (default 15 minutes)
 * - **Lifecycle Events**: Emits SESSION_START event only (SESSION_END removed in v1.0.0)
 *
 * **Key Features**:
 * - **Session ID Format**: `{timestamp}-{9-char-base36}` (e.g., `1704896400000-a3b4c5d6e`)
 * - **Default Timeout**: 15 minutes (900,000 ms), configurable via `sessionTimeout`
 * - **Cross-Tab Sharing**: Primary tab creates session, shares via BroadcastChannel
 * - **Secondary Tab Behavior**: Receives session from primary tab, no SESSION_START event
 * - **No Session End Events**: Library only tracks SESSION_START (v2.0.0+)
 *
 * **BroadcastChannel Integration**:
 * - **Initialized BEFORE SESSION_START**: Prevents race condition with secondary tabs
 * - **Messages**: `session_start` (share session)
 * - **Fallback**: Logs warning if BroadcastChannel not supported (no cross-tab sync)
 *
 * **Activity Detection**:
 * - Tracks user interactions via listener managers (mouse, keyboard, touch, scroll, etc.)
 * - Resets inactivity timeout on each activity
 * - Updates `lastActivity` timestamp in localStorage
 *
 * **State Management**:
 * - **`sessionId`**: Current session ID stored in global state
 * - **`hasStartSession`**: Flag in global state to prevent duplicate SESSION_START
 *
 * @see src/managers/README.md (lines 140-169) for detailed documentation
 *
 * @example
 * ```typescript
 * const sessionManager = new SessionManager(storage, eventManager, 'project123');
 *
 * // Start session tracking
 * sessionManager.startTracking();
 * // → Creates session ID: '1704896400000-a3b4c5d6e'
 * // → Emits SESSION_START event
 * // → Sets up activity listeners
 * // → Initializes cross-tab sync
 *
 * // User activity extends session
 * // (automatic via activity listeners)
 *
 * // Stop tracking (cleanup only)
 * sessionManager.stopTracking();
 * // → Cleans up listeners and timers
 * // → No SESSION_END event emitted
 * ```
 */
export class SessionManager extends StateManager {
  private readonly storageManager: StorageManager;
  private readonly eventManager: EventManager;
  private readonly projectId: string;

  private activityHandler: (() => void) | null = null;
  private visibilityChangeHandler: (() => void) | null = null;
  private sessionTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private isTracking = false;

  /**
   * Creates a SessionManager instance.
   *
   * @param storageManager - Storage manager for session persistence
   * @param eventManager - Event manager for SESSION_START events
   * @param projectId - Project identifier for namespacing session storage
   */
  constructor(storageManager: StorageManager, eventManager: EventManager, projectId: string) {
    super();
    this.storageManager = storageManager;
    this.eventManager = eventManager;
    this.projectId = projectId;
  }

  private initCrossTabSync(): void {
    if (typeof BroadcastChannel === 'undefined') {
      log('warn', 'BroadcastChannel not supported');
      return;
    }

    const projectId = this.getProjectId();
    this.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME(projectId));

    this.broadcastChannel.onmessage = (event): void => {
      const { action, sessionId, timestamp, projectId: messageProjectId } = event.data ?? {};

      if (messageProjectId !== projectId) {
        return;
      }

      if (action === 'session_end') {
        this.resetSessionState();
        return;
      }

      if (action === 'session_start' && sessionId && typeof timestamp === 'number' && timestamp > Date.now() - 5000) {
        this.set('sessionId', sessionId);
        this.persistSession(sessionId, timestamp);
        if (this.isTracking) {
          this.setupSessionTimeout();
        }
      }
    };
  }

  private shareSession(sessionId: string): void {
    if (this.broadcastChannel && typeof this.broadcastChannel.postMessage === 'function') {
      this.broadcastChannel.postMessage({
        action: 'session_start',
        projectId: this.getProjectId(),
        sessionId,
        timestamp: Date.now(),
      });
    }
  }

  private cleanupCrossTabSync(): void {
    if (this.broadcastChannel) {
      if (typeof this.broadcastChannel.close === 'function') {
        this.broadcastChannel.close();
      }
      this.broadcastChannel = null;
    }
  }

  private recoverSession(): string | null {
    const storedSession = this.loadStoredSession();

    if (!storedSession) {
      return null;
    }

    // Validate session ID format: {timestamp}-{9-char-base36}
    const sessionIdPattern = /^\d{13}-[a-z0-9]{9}$/;
    if (!sessionIdPattern.test(storedSession.id)) {
      log('warn', 'Invalid session ID format recovered from storage, clearing', {
        data: { sessionId: storedSession.id },
      });
      this.clearStoredSession();
      return null;
    }

    const sessionTimeout = this.get('config')?.sessionTimeout ?? DEFAULT_SESSION_TIMEOUT;

    if (Date.now() - storedSession.lastActivity > sessionTimeout) {
      this.clearStoredSession();
      return null;
    }

    return storedSession.id;
  }

  private persistSession(sessionId: string, lastActivity: number = Date.now()): void {
    this.saveStoredSession({
      id: sessionId,
      lastActivity,
    });
  }

  private clearStoredSession(): void {
    const storageKey = this.getSessionStorageKey();
    this.storageManager.removeItem(storageKey);
  }

  private loadStoredSession(): StoredSessionData | null {
    const storageKey = this.getSessionStorageKey();
    const storedData = this.storageManager.getItem(storageKey);

    if (!storedData) {
      return null;
    }

    try {
      const parsed = JSON.parse(storedData) as StoredSessionData;
      if (!parsed.id || typeof parsed.lastActivity !== 'number') {
        return null;
      }
      return parsed;
    } catch {
      this.storageManager.removeItem(storageKey);
      return null;
    }
  }

  private saveStoredSession(session: StoredSessionData): void {
    const storageKey = this.getSessionStorageKey();
    this.storageManager.setItem(storageKey, JSON.stringify(session));
  }

  private getSessionStorageKey(): string {
    return SESSION_STORAGE_KEY(this.getProjectId());
  }

  private getProjectId(): string {
    return this.projectId;
  }

  /**
   * Starts session tracking with lifecycle management and cross-tab synchronization.
   *
   * **Purpose**: Initializes session tracking, creating or recovering a session ID,
   * setting up activity listeners, and enabling cross-tab synchronization.
   *
   * **Flow**:
   * 1. Checks if tracking already active (idempotent)
   * 2. Attempts to recover session from localStorage
   * 3. If no recovery: Generates new session ID (`{timestamp}-{9-char-base36}`)
   * 4. Sets `sessionId` in global state
   * 5. Persists session to localStorage
   * 6. Initializes BroadcastChannel for cross-tab sync (BEFORE SESSION_START)
   * 7. Shares session via BroadcastChannel (notifies other tabs)
   * 8. If NOT recovered: Tracks SESSION_START event
   * 9. Sets up inactivity timeout (default 15 minutes)
   * 10. Sets up activity listeners (click, keydown, scroll)
   * 11. Sets up lifecycle listeners (visibilitychange, beforeunload)
   *
   * **Session Recovery**:
   * - Checks localStorage for existing session
   * - Recovers if session exists and is recent (within timeout window)
   * - NO SESSION_START event if session recovered
   *
   * **Error Handling**:
   * - On error: Rolls back all setup (cleanup listeners, timers, state)
   * - Re-throws error to caller (App.init() handles failure)
   *
   * **BroadcastChannel Initialization Order**:
   * - CRITICAL: BroadcastChannel initialized BEFORE SESSION_START event
   * - Prevents race condition with secondary tabs
   * - Ensures secondary tabs can receive session_start message
   *
   * **Called by**: `SessionHandler.startTracking()` during `App.init()`
   *
   * **Important**: After successful call, `sessionId` is available in global state
   * and EventManager can flush pending events via `flushPendingEvents()`.
   *
   * @throws Error if initialization fails (rolled back automatically)
   *
   * @example
   * ```typescript
   * sessionManager.startTracking();
   * // → Session created: '1704896400000-a3b4c5d6e'
   * // → SESSION_START event tracked
   * // → Activity listeners active
   * // → Cross-tab sync enabled
   * ```
   *
   * @see src/managers/README.md (lines 140-169) for session management details
   */
  startTracking(): void {
    if (this.isTracking) {
      log('warn', 'Session tracking already active');
      return;
    }

    const recoveredSessionId = this.recoverSession();
    const sessionId = recoveredSessionId ?? this.generateSessionId();

    log('debug', 'Session tracking initialized', {
      data: {
        sessionId,
        wasRecovered: !!recoveredSessionId,
        willEmitSessionStart: true,
      },
    });

    // IMPORTANT: Always send SESSION_START on new app instance
    // Even if we recover a session ID, this is a NEW instance of the application
    // (page reload, new tab, browser restart, etc.)
    // This prevents anomalous session durations (e.g., 12+ days between START and END)
    // Recovered session ID is kept for analytics continuity, but START event marks new instance

    this.isTracking = true;

    try {
      this.set('sessionId', sessionId);
      this.persistSession(sessionId);
      this.initCrossTabSync();
      this.shareSession(sessionId);

      // ALWAYS send SESSION_START on new app instance
      log('debug', 'Emitting SESSION_START event', {
        data: { sessionId },
      });

      this.eventManager.track({
        type: EventType.SESSION_START,
      });

      this.setupSessionTimeout();
      this.setupActivityListeners();
      this.setupLifecycleListeners();
    } catch (error) {
      this.isTracking = false;
      this.clearSessionTimeout();
      this.cleanupActivityListeners();
      this.cleanupLifecycleListeners();
      this.cleanupCrossTabSync();
      this.set('sessionId', null);

      throw error;
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private setupSessionTimeout(): void {
    this.clearSessionTimeout();

    const sessionTimeout = this.get('config')?.sessionTimeout ?? DEFAULT_SESSION_TIMEOUT;

    this.sessionTimeoutId = setTimeout(() => {
      this.resetSessionState();
    }, sessionTimeout);
  }

  private resetSessionTimeout(): void {
    this.setupSessionTimeout();
    const sessionId = this.get('sessionId') as string;
    if (sessionId) {
      this.persistSession(sessionId);
    }
  }

  private clearSessionTimeout(): void {
    if (this.sessionTimeoutId) {
      clearTimeout(this.sessionTimeoutId);
      this.sessionTimeoutId = null;
    }
  }

  private setupActivityListeners(): void {
    this.activityHandler = (): void => {
      this.resetSessionTimeout();
    };

    document.addEventListener('click', this.activityHandler, { passive: true });
    document.addEventListener('keydown', this.activityHandler, { passive: true });
    document.addEventListener('scroll', this.activityHandler, { passive: true });
  }

  private cleanupActivityListeners(): void {
    if (this.activityHandler) {
      document.removeEventListener('click', this.activityHandler);
      document.removeEventListener('keydown', this.activityHandler);
      document.removeEventListener('scroll', this.activityHandler);
      this.activityHandler = null;
    }
  }

  private setupLifecycleListeners(): void {
    if (this.visibilityChangeHandler) {
      return;
    }

    this.visibilityChangeHandler = (): void => {
      if (document.hidden) {
        this.clearSessionTimeout();
      } else {
        const sessionId = this.get('sessionId');
        if (sessionId) {
          this.setupSessionTimeout();
        }
      }
    };

    document.addEventListener('visibilitychange', this.visibilityChangeHandler);
  }

  private cleanupLifecycleListeners(): void {
    if (this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
      this.visibilityChangeHandler = null;
    }
  }

  private resetSessionState(): void {
    this.clearSessionTimeout();
    this.cleanupActivityListeners();
    this.cleanupLifecycleListeners();
    this.cleanupCrossTabSync();
    this.clearStoredSession();

    this.set('sessionId', null);
    this.isTracking = false;
  }

  /**
   * Stops session tracking and cleans up all resources.
   *
   * **Purpose**: Manually stops the current session tracking and cleans up
   * all listeners and timers. Does not emit SESSION_END event (removed in v2.0.0).
   *
   * **Flow**:
   * 1. Clears inactivity timeout
   * 2. Removes activity listeners (click, keydown, scroll)
   * 3. Removes lifecycle listeners (visibilitychange)
   * 4. Closes BroadcastChannel
   * 5. Clears session from localStorage
   * 6. Resets `sessionId` and `hasStartSession` in global state
   * 7. Sets `isTracking` to false
   *
   * **Called by**: `App.destroy()` during application teardown
   *
   * **Important**: After calling, session tracking is terminated and cannot be resumed.
   * A new session will be created on next `startTracking()` call.
   *
   * @example
   * ```typescript
   * // Stop session tracking
   * sessionManager.stopTracking();
   * // → All listeners cleaned up
   * // → Session cleared from localStorage
   * // → BroadcastChannel closed
   * // → No SESSION_END event emitted
   * ```
   *
   * @see src/managers/README.md (lines 140-169) for session management details
   */
  stopTracking(): void {
    this.resetSessionState();
  }

  /**
   * Destroys the session manager and cleans up all resources.
   *
   * **Purpose**: Performs deep cleanup of session manager resources during
   * application teardown. Preserves session in localStorage for recovery.
   *
   * **Differences from stopTracking()**:
   * - Does NOT clear localStorage (preserves session for recovery)
   * - Used for internal cleanup during teardown
   *
   * **Cleanup Flow**:
   * 1. Clears inactivity timeout
   * 2. Removes activity listeners (click, keydown, scroll)
   * 3. Closes BroadcastChannel
   * 4. Removes lifecycle listeners (visibilitychange)
   * 5. Resets tracking flags (`isTracking`, `hasStartSession`)
   *
   * **Called by**: `App.destroy()` during application teardown
   *
   * @returns void
   *
   * @example
   * ```typescript
   * sessionManager.destroy();
   * // → All resources cleaned up
   * // → Session preserved in localStorage for recovery
   * ```
   */
  destroy(): void {
    this.clearSessionTimeout();
    this.cleanupActivityListeners();
    this.cleanupCrossTabSync();
    this.cleanupLifecycleListeners();
    this.isTracking = false;
    this.set('hasStartSession', false);
  }
}
