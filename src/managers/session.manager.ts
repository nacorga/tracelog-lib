import { BROADCAST_CHANNEL_NAME, DEFAULT_SESSION_TIMEOUT, SESSION_STORAGE_KEY } from '../constants';
import { EventType, UTM } from '../types';
import { getExternalReferrer, getUTMParameters, isPrerendering, log } from '../utils';
import { StateManager } from './state.manager';
import { StorageManager } from './storage.manager';
import { EventManager } from './event.manager';

interface StoredSessionData {
  id: string;
  lastActivity: number;
  referrer?: string;
  utm?: UTM;
}

/**
 * Session ID validation pattern: {timestamp}-{9-char-base36}
 *
 * Validates recovered session IDs to prevent data corruption from:
 * - Manual localStorage manipulation by users or browser extensions
 * - Race conditions in cross-tab scenarios (partial/truncated writes)
 * - Storage corruption or quota-based truncation
 * - Malformed IDs from older library versions or external interference
 *
 * Format: 13-digit timestamp + hyphen + 9 lowercase alphanumeric characters
 * Example: 1704067200000-a3f9c2b5d
 */
const SESSION_ID_PATTERN = /^\d{13}-[a-z0-9]{9}$/;

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
 * - **Session Mirror**: Automatically mirrors session to sessionStorage for recovery after external redirects
 * - **Inactivity Detection**: Automatic timeout after inactivity (default 15 minutes)
 * - **Lifecycle Events**: Emits SESSION_START event only (SESSION_END removed in v2.0.0)
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
 * - **Messages**: Only `session_start` action (share session across tabs)
 * - **Fallback**: Logs warning if BroadcastChannel not supported (no cross-tab sync)
 *
 * **Activity Detection**:
 * - Tracks user interactions via listener managers (mouse, keyboard, touch, scroll, etc.)
 * - Resets inactivity timeout on each activity
 * - Updates `lastActivity` timestamp in localStorage
 *
 * **State Management**:
 * - **`sessionId`**: Current session ID stored in global state
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
  private needsRenewal = false;
  private prerenderActivationHandler: (() => void) | null = null;

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
      log('debug', 'BroadcastChannel not supported');
      return;
    }

    const projectId = this.getProjectId();
    this.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME(projectId));

    this.broadcastChannel.onmessage = (event): void => {
      const { action, sessionId, timestamp, projectId: messageProjectId } = event.data ?? {};

      if (messageProjectId !== projectId) {
        return;
      }

      if (action === 'session_start' && sessionId && typeof timestamp === 'number' && timestamp > Date.now() - 5000) {
        this.set('sessionId', sessionId);
        this.persistSession(sessionId, timestamp);
        if (this.isTracking) {
          this.setupSessionTimeout();
        }
      } else if (action && action !== 'session_start') {
        // Log unknown action types to help with debugging cross-tab synchronization issues
        log('debug', 'Ignored BroadcastChannel message with unknown action', { data: { action } });
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
    if (!SESSION_ID_PATTERN.test(storedSession.id)) {
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

  private persistSession(sessionId: string, lastActivity: number = Date.now(), referrer?: string, utm?: UTM): void {
    this.saveStoredSession({
      id: sessionId,
      lastActivity,
      ...(referrer && { referrer }),
      ...(utm && { utm }),
    });
  }

  private clearStoredSession(): void {
    const storageKey = this.getSessionStorageKey();
    this.storageManager.removeItem(storageKey);
    // sessionStorage mirror is intentionally NOT cleared here.
    // It persists to enable recovery after external redirects (payment processors, OAuth).
    // Stale data is rejected by the timeout check in recoverSession().
    // sessionStorage auto-clears when the tab closes.
  }

  private loadStoredSession(): StoredSessionData | null {
    const storageKey = this.getSessionStorageKey();

    // Primary: localStorage (cross-tab, persistent)
    const localData = this.storageManager.getItem(storageKey);
    if (localData !== null) {
      try {
        const parsed = JSON.parse(localData) as StoredSessionData;
        if (parsed.id && typeof parsed.lastActivity === 'number') {
          return parsed;
        }
      } catch {
        this.storageManager.removeItem(storageKey);
      }
    }

    // Fallback: sessionStorage (survives same-tab external redirects)
    const sessionData = this.storageManager.getSessionItem(storageKey);
    if (sessionData !== null) {
      try {
        const parsed = JSON.parse(sessionData) as StoredSessionData;
        if (parsed.id && typeof parsed.lastActivity === 'number') {
          return parsed;
        }
      } catch {
        this.storageManager.removeSessionItem(storageKey);
      }
    }

    return null;
  }

  private saveStoredSession(session: StoredSessionData): void {
    const storageKey = this.getSessionStorageKey();
    const data = JSON.stringify(session);
    this.storageManager.setItem(storageKey, data);
    this.storageManager.setSessionItem(storageKey, data);
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
   * - Checks localStorage for existing session (primary)
   * - Falls back to sessionStorage mirror (survives external redirects)
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
      log('debug', 'Session tracking already active');
      return;
    }

    const recoveredSessionId = this.recoverSession();
    const sessionId = recoveredSessionId ?? this.generateSessionId();

    // Capture or recover attribution data (referrer/UTM)
    let sessionReferrer: string;
    let sessionUtm: UTM | undefined;

    if (recoveredSessionId) {
      // Session recovered: load attribution from storage (with fallback to current context)
      const storedSession = this.loadStoredSession();
      sessionReferrer = storedSession?.referrer ?? getExternalReferrer();
      sessionUtm = storedSession?.utm ?? getUTMParameters();
    } else {
      // New session: capture from current page context
      sessionReferrer = getExternalReferrer();
      sessionUtm = getUTMParameters();
    }

    log('debug', 'Session tracking initialized', {
      data: {
        sessionId,
        wasRecovered: !!recoveredSessionId,
        willEmitSessionStart: !recoveredSessionId,
        sessionReferrer,
        hasUtm: !!sessionUtm,
      },
    });

    this.isTracking = true;

    try {
      this.set('sessionId', sessionId);
      this.set('sessionReferrer', sessionReferrer);
      this.set('sessionUtm', sessionUtm);
      this.persistSession(sessionId, Date.now(), sessionReferrer, sessionUtm);
      this.initCrossTabSync();
      this.shareSession(sessionId);

      // Pre-render guard. The server upserts a session from ANY event carrying a
      // session_id (not only SESSION_START), so to keep a never-activated prerender
      // from creating a phantom session the page must emit NOTHING until activation.
      // We defer the SESSION_START emit + session listeners here; App.initializeHandlers()
      // defers the interaction handlers (page view, click, ...) in parallel. `sessionId`
      // is already allocated + cross-tab shared above so init() still returns a real id.
      // This listener is registered before App's, so SESSION_START is emitted before the
      // first PAGE_VIEW on activation.
      if (isPrerendering()) {
        this.prerenderActivationHandler = (): void => {
          this.prerenderActivationHandler = null;
          if (!recoveredSessionId) {
            this.eventManager.track({ type: EventType.SESSION_START });
          }
          this.setupSessionTimeout();
          this.setupActivityListeners();
          this.setupLifecycleListeners();
        };
        document.addEventListener('prerenderingchange', this.prerenderActivationHandler, { once: true });
        return;
      }

      // Only emit SESSION_START for NEW sessions (not recovered)
      // Recovered sessions already had their SESSION_START tracked on initial creation
      // Server infers session end from last event timestamp (v2.0+)
      if (!recoveredSessionId) {
        log('debug', 'Emitting SESSION_START event', {
          data: { sessionId },
        });

        this.eventManager.track({
          type: EventType.SESSION_START,
        });
      } else {
        log('debug', 'Session recovered, skipping SESSION_START', {
          data: { sessionId },
        });
      }

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
      this.enterRenewalMode();
    }, sessionTimeout);
  }

  private resetSessionTimeout(): void {
    this.setupSessionTimeout();
    const sessionId = this.get('sessionId') as string;
    if (sessionId) {
      this.persistSession(sessionId, Date.now(), this.get('sessionReferrer'), this.get('sessionUtm'));
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
      if (this.needsRenewal) {
        this.renewSession();
      } else {
        this.resetSessionTimeout();
      }
    };

    document.addEventListener('click', this.activityHandler, { passive: true });
    document.addEventListener('keydown', this.activityHandler, { passive: true });
    document.addEventListener('scroll', this.activityHandler, { passive: true });
  }

  /**
   * Renews the session after timeout when user returns.
   * Creates a new session ID and emits SESSION_START.
   */
  private renewSession(): void {
    this.needsRenewal = false;

    const newSessionId = this.generateSessionId();
    const sessionReferrer = getExternalReferrer();
    const sessionUtm = getUTMParameters();

    log('debug', 'Renewing session after timeout', {
      data: { newSessionId },
    });

    this.set('sessionId', newSessionId);
    this.set('sessionReferrer', sessionReferrer);
    this.set('sessionUtm', sessionUtm);
    this.persistSession(newSessionId, Date.now(), sessionReferrer, sessionUtm);

    // Re-initialize cross-tab sync with new session
    this.cleanupCrossTabSync();
    this.initCrossTabSync();
    this.shareSession(newSessionId);

    this.eventManager.track({
      type: EventType.SESSION_START,
    });

    // Flush any events that were buffered during renewal mode
    this.eventManager.flushPendingEvents();

    this.setupSessionTimeout();
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
        // Check if session expired during browser suspend/hibernate
        if (this.isSessionStale()) {
          log('debug', 'Session expired during suspend, entering renewal mode');
          this.enterRenewalMode();
          return;
        }

        const sessionId = this.get('sessionId');
        if (sessionId) {
          this.setupSessionTimeout();
        }
      }
    };

    document.addEventListener('visibilitychange', this.visibilityChangeHandler);
  }

  /**
   * Checks if the current session has become stale (expired during browser suspend).
   * This handles the case where JavaScript timers are paused during suspend/hibernate.
   */
  private isSessionStale(): boolean {
    // If already in renewal mode, no need to check
    if (this.needsRenewal) {
      return false;
    }

    const sessionId = this.get('sessionId');
    if (!sessionId) {
      return false;
    }

    const storedSession = this.loadStoredSession();
    if (!storedSession) {
      return false;
    }

    const sessionTimeout = this.get('config')?.sessionTimeout ?? DEFAULT_SESSION_TIMEOUT;
    return Date.now() - storedSession.lastActivity > sessionTimeout;
  }

  private cleanupLifecycleListeners(): void {
    if (this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
      this.visibilityChangeHandler = null;
    }
  }

  /**
   * Enters renewal mode after session timeout.
   * Keeps activity listeners active to detect when user returns.
   * Called by session timeout timer.
   */
  private enterRenewalMode(): void {
    this.clearSessionTimeout();
    this.cleanupCrossTabSync();
    this.clearStoredSession();

    this.set('sessionId', null);
    this.set('hasStartSession', false);
    this.set('sessionReferrer', undefined);
    this.set('sessionUtm', undefined);

    // Keep activity listeners active but switch to renewal mode
    this.needsRenewal = true;

    log('debug', 'Session timed out, entering renewal mode');
  }

  /**
   * Fully resets session state and cleans up all resources.
   * Called by stopTracking() for explicit session termination.
   */
  private resetSessionState(): void {
    this.clearSessionTimeout();
    this.cleanupActivityListeners();
    this.cleanupLifecycleListeners();
    this.cleanupCrossTabSync();
    this.cleanupPrerenderActivation();
    this.clearStoredSession();

    this.set('sessionId', null);
    this.set('hasStartSession', false);
    this.set('sessionReferrer', undefined);
    this.set('sessionUtm', undefined);

    this.needsRenewal = false;
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
   * **Called by**: `App.destroy()` during application teardown or when session times out
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
   * 5. Resets tracking flag (`isTracking`)
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
    this.cleanupPrerenderActivation();
    this.isTracking = false;
    this.needsRenewal = false;
    this.set('hasStartSession', false);
  }

  /**
   * Removes the pending `prerenderingchange` listener when the manager is torn
   * down before activation (the discarded-prerender case). On the activation path
   * `{ once: true }` removes the listener and the handler nulls its own reference,
   * so this is a no-op then.
   */
  private cleanupPrerenderActivation(): void {
    if (this.prerenderActivationHandler) {
      document.removeEventListener('prerenderingchange', this.prerenderActivationHandler);
      this.prerenderActivationHandler = null;
    }
  }
}
