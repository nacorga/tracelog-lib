import { SESSION_HEARTBEAT_INTERVAL_MS, SESSION_STORAGE_KEY, DEFAULT_SESSION_TIMEOUT_MS } from '../constants';
import { EventType } from '../types';
import { CrossTabSessionConfig, SessionEndConfig, SessionEndReason } from '../types/session.types';
import { EventManager } from '../managers/event.manager';
import { SessionManager } from '../managers/session.manager';
import { SessionRecoveryManager } from '../managers/session-recovery.manager';
import { CrossTabSessionManager } from '../managers/cross-tab-session.manager';
import { StateManager } from '../managers/state.manager';
import { StorageManager } from '../managers/storage.manager';
import { debugLog } from '../utils/logging';

interface StoredSession {
  sessionId: string;
  startTime: number;
  lastHeartbeat: number;
}

export class SessionHandler extends StateManager {
  private readonly eventManager: EventManager;
  private readonly storageManager: StorageManager;
  private readonly sessionStorageKey: string;

  private sessionManager: SessionManager | null = null;
  private recoveryManager: SessionRecoveryManager | null = null;
  private _crossTabSessionManager: CrossTabSessionManager | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  private get crossTabSessionManager(): CrossTabSessionManager | null {
    if (!this._crossTabSessionManager && this.shouldUseCrossTabs()) {
      const projectId = this.get('config')?.id;
      if (projectId) {
        this.initializeCrossTabSessionManager(projectId);
      }
    }
    return this._crossTabSessionManager;
  }

  private shouldUseCrossTabs(): boolean {
    // Only initialize if BroadcastChannel is supported (indicates potential for multiple tabs)
    // and ServiceWorker is available (better cross-tab coordination)
    return typeof BroadcastChannel !== 'undefined' && typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
  }

  constructor(storageManager: StorageManager, eventManager: EventManager) {
    super();

    this.eventManager = eventManager;
    this.storageManager = storageManager;
    this.sessionStorageKey = SESSION_STORAGE_KEY(this.get('config')?.id);

    const projectId = this.get('config')?.id;

    if (projectId) {
      this.initializeSessionRecoveryManager(projectId);
      // CrossTabSessionManager will be initialized lazily when needed via the getter
    }
  }

  startTracking(): void {
    if (this.sessionManager) {
      debugLog.debug('SessionHandler', 'Session tracking already active');
      return;
    }

    debugLog.info('SessionHandler', 'Starting session tracking');

    this.checkOrphanedSessions();

    const onActivity = async (): Promise<void> => {
      if (this.crossTabSessionManager) {
        this.crossTabSessionManager.updateSessionActivity();
      }

      if (this.get('sessionId')) {
        return;
      }

      try {
        const sessionResult = await this.createOrJoinSession();
        this.set('sessionId', sessionResult.sessionId);
        this.trackSession(EventType.SESSION_START, sessionResult.recovered);
        this.persistSession(sessionResult.sessionId);
        this.startHeartbeat();
      } catch (error) {
        debugLog.error(
          'SessionHandler',
          `Session creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
        this.forceCleanupSession();
      }
    };

    const onInactivity = (): void => {
      if (!this.get('sessionId')) {
        return;
      }

      if (this.crossTabSessionManager && this.crossTabSessionManager.getEffectiveSessionTimeout() > 0) {
        if (this.get('config')?.mode === 'qa' || this.get('config')?.mode === 'debug') {
          debugLog.debug('SessionHandler', 'Session kept alive by cross-tab activity');
        }

        return;
      }

      this.sessionManager!.endSessionManaged('inactivity')
        .then((result) => {
          if (this.get('config')?.mode === 'qa' || this.get('config')?.mode === 'debug') {
            debugLog.debug('SessionHandler', `Inactivity session end result: ${JSON.stringify(result)}`);
          }

          if (this.crossTabSessionManager) {
            this.crossTabSessionManager.endSession('inactivity');
          }

          this.clearPersistedSession();
          this.stopHeartbeat();
        })
        .catch((error) => {
          debugLog.error(
            'SessionHandler',
            `Session end failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
          this.forceCleanupSession();
        });
    };

    const sessionEndConfig: Partial<SessionEndConfig> = {
      enablePageUnloadHandlers: true,
      debugMode: (this.get('config')?.mode === 'qa' || this.get('config')?.mode === 'debug') ?? false,
      syncTimeoutMs: 2000,
      maxRetries: 3,
    };

    this.sessionManager = new SessionManager(
      onActivity,
      onInactivity,
      this.eventManager,
      this.storageManager,
      sessionEndConfig,
    );

    debugLog.debug('SessionHandler', 'Session manager initialized');

    this.startInitialSession();
  }

  stopTracking(): void {
    debugLog.info('SessionHandler', 'Stopping session tracking');

    if (this.sessionManager) {
      if (this.get('sessionId')) {
        try {
          this.sessionManager.endSessionSafely('manual_stop', { forceSync: true });
          this.clearPersistedSession();
          this.stopHeartbeat();
        } catch (error) {
          debugLog.error(
            'SessionHandler',
            `Manual session stop failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
          this.forceCleanupSession();
        }
      }

      this.sessionManager.destroy();
      this.sessionManager = null;
    }

    if (this._crossTabSessionManager) {
      this._crossTabSessionManager.destroy();
      this._crossTabSessionManager = null;
    }

    if (this.recoveryManager) {
      this.recoveryManager.cleanupOldRecoveryAttempts();
      this.recoveryManager = null;
    }
  }

  private initializeSessionRecoveryManager(projectId: string): void {
    this.recoveryManager = new SessionRecoveryManager(this.storageManager, projectId, this.eventManager);
    debugLog.debug('SessionHandler', 'Session recovery manager initialized', { projectId });
  }

  private initializeCrossTabSessionManager(projectId: string): void {
    const config: Partial<CrossTabSessionConfig> = {
      debugMode: (this.get('config')?.mode === 'qa' || this.get('config')?.mode === 'debug') ?? false,
    };

    const onSessionStart = (sessionId: string): void => {
      if (this.get('config')?.mode === 'qa' || this.get('config')?.mode === 'debug') {
        debugLog.debug('SessionHandler', `Cross-tab session started: ${sessionId}`);
      }

      this.set('sessionId', sessionId);
      this.trackSession(EventType.SESSION_START, false);
      this.persistSession(sessionId);
      this.startHeartbeat();
    };

    const onSessionEnd = (reason: SessionEndReason): void => {
      if (this.get('config')?.mode === 'qa' || this.get('config')?.mode === 'debug') {
        debugLog.debug('SessionHandler', `Cross-tab session ended: ${reason}`);
      }

      this.clearPersistedSession();
      this.trackSession(EventType.SESSION_END, false, reason);
    };

    const onTabActivity = (): void => {
      if (this.get('config')?.mode === 'qa' || this.get('config')?.mode === 'debug') {
        debugLog.debug('SessionHandler', 'Cross-tab activity detected');
      }
    };

    const onCrossTabConflict = (): void => {
      if (this.get('config')?.mode === 'qa' || this.get('config')?.mode === 'debug') {
        debugLog.warn('SessionHandler', 'Cross-tab conflict detected');
      }

      // Track cross-tab conflict in session health
      if (this.sessionManager) {
        this.sessionManager.trackSessionHealth('conflict');
      }
    };

    const callbacks = {
      onSessionStart,
      onSessionEnd,
      onTabActivity,
      onCrossTabConflict,
    };

    this._crossTabSessionManager = new CrossTabSessionManager(this.storageManager, projectId, config, callbacks);
    debugLog.debug('SessionHandler', 'Cross-tab session manager initialized', { projectId });
  }

  private async createOrJoinSession(): Promise<{ sessionId: string; recovered: boolean }> {
    if (this.crossTabSessionManager) {
      const existingSessionId = this.crossTabSessionManager.getSessionId();
      if (existingSessionId) {
        return { sessionId: existingSessionId, recovered: false };
      }

      // If cross-tab manager exists but no session, create one through regular session manager
      // The cross-tab manager will coordinate with other tabs automatically
      const sessionResult = this.sessionManager!.startSession();
      return { sessionId: sessionResult.sessionId, recovered: sessionResult.recovered ?? false };
    }

    // Fallback: create regular session when no cross-tab manager
    const sessionResult = this.sessionManager!.startSession();
    return { sessionId: sessionResult.sessionId, recovered: sessionResult.recovered ?? false };
  }

  private forceCleanupSession(): void {
    // Clear session state
    this.set('sessionId', null);

    // Clear persisted session data
    this.clearPersistedSession();

    // Stop heartbeat timer
    this.stopHeartbeat();

    // Clean up cross-tab session if exists
    if (this.crossTabSessionManager) {
      try {
        this.crossTabSessionManager.endSession('orphaned_cleanup');
      } catch (error) {
        // Silent cleanup - we're already in error recovery
        if (this.get('config')?.mode === 'qa' || this.get('config')?.mode === 'debug') {
          debugLog.warn(
            'SessionHandler',
            `Cross-tab cleanup failed during force cleanup: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }
      }
    }

    // Track session end for analytics
    try {
      this.trackSession(EventType.SESSION_END, false, 'orphaned_cleanup');
    } catch (error) {
      // Silent tracking failure - we're already in error recovery
      if (this.get('config')?.mode === 'qa' || this.get('config')?.mode === 'debug') {
        debugLog.warn(
          'SessionHandler',
          `Session tracking failed during force cleanup: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    if (this.get('config')?.mode === 'qa' || this.get('config')?.mode === 'debug') {
      debugLog.debug('SessionHandler', 'Forced session cleanup completed');
    }
  }

  private trackSession(
    eventType: EventType.SESSION_START | EventType.SESSION_END,
    sessionStartRecovered = false,
    sessionEndReason?: SessionEndReason,
  ): void {
    this.eventManager.track({
      type: eventType,
      ...(eventType === EventType.SESSION_START &&
        sessionStartRecovered && { session_start_recovered: sessionStartRecovered }),
      ...(eventType === EventType.SESSION_END && { session_end_reason: sessionEndReason ?? 'orphaned_cleanup' }),
    });
  }

  private startInitialSession(): void {
    if (this.get('sessionId')) {
      debugLog.debug('SessionHandler', 'Session already exists, skipping initial session creation');
      return;
    }

    debugLog.debug('SessionHandler', 'Starting initial session');

    // Check if there's already a cross-tab session active
    if (this.crossTabSessionManager) {
      const existingSessionId = this.crossTabSessionManager.getSessionId();

      if (existingSessionId) {
        // Join existing cross-tab session
        this.set('sessionId', existingSessionId);
        this.persistSession(existingSessionId);
        this.startHeartbeat();
        return;
      }

      // No existing cross-tab session, so trigger activity to potentially create one
      // The cross-tab session manager will handle session creation when activity occurs
      return;
    }

    // Fallback: no cross-tab session manager, start regular session
    debugLog.debug('SessionHandler', 'Starting regular session (no cross-tab)');
    const sessionResult = this.sessionManager!.startSession();

    this.set('sessionId', sessionResult.sessionId);
    this.trackSession(EventType.SESSION_START, sessionResult.recovered);
    this.persistSession(sessionResult.sessionId);
    this.startHeartbeat();
  }

  private checkOrphanedSessions(): void {
    const storedSessionData = this.storageManager.getItem(this.sessionStorageKey);

    if (storedSessionData) {
      try {
        const session: StoredSession = JSON.parse(storedSessionData);
        const now = Date.now();
        const timeSinceLastHeartbeat = now - session.lastHeartbeat;
        const sessionTimeout = this.get('config')?.sessionTimeout ?? DEFAULT_SESSION_TIMEOUT_MS;

        if (timeSinceLastHeartbeat > sessionTimeout) {
          const canRecover = this.recoveryManager?.hasRecoverableSession();

          if (canRecover) {
            if (this.recoveryManager) {
              const sessionContext = {
                sessionId: session.sessionId,
                startTime: session.startTime,
                lastActivity: session.lastHeartbeat,
                tabCount: 1,
                recoveryAttempts: 0,
                metadata: {
                  userAgent: navigator.userAgent,
                  pageUrl: this.get('pageUrl'),
                },
              };

              this.recoveryManager.storeSessionContextForRecovery(sessionContext);

              if (this.get('config')?.mode === 'qa' || this.get('config')?.mode === 'debug') {
                debugLog.debug('SessionHandler', `Orphaned session stored for recovery: ${session.sessionId}`);
              }
            }
          }

          this.trackSession(EventType.SESSION_END);
          this.clearPersistedSession();

          if (this.get('config')?.mode === 'qa' || this.get('config')?.mode === 'debug') {
            debugLog.debug(
              'SessionHandler',
              `Orphaned session ended: ${session.sessionId}, recovery available: ${canRecover}`,
            );
          }
        }
      } catch {
        this.clearPersistedSession();
      }
    }
  }

  private persistSession(sessionId: string): void {
    const sessionData: StoredSession = {
      sessionId,
      startTime: Date.now(),
      lastHeartbeat: Date.now(),
    };

    this.storageManager.setItem(this.sessionStorageKey, JSON.stringify(sessionData));
  }

  private clearPersistedSession(): void {
    this.storageManager.removeItem(this.sessionStorageKey);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      const storedSessionData = this.storageManager.getItem(this.sessionStorageKey);

      if (storedSessionData) {
        try {
          const session: StoredSession = JSON.parse(storedSessionData);
          session.lastHeartbeat = Date.now();

          this.storageManager.setItem(this.sessionStorageKey, JSON.stringify(session));
        } catch {
          this.clearPersistedSession();
        }
      }
    }, SESSION_HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}
