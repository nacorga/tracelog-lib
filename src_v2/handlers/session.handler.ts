import {
  SESSION_HEARTBEAT_INTERVAL_MS,
  SESSION_STORAGE_KEY,
  DEFAULT_SESSION_TIMEOUT_MS,
  SESSION_SYNC_CONSTANTS,
} from '../constants';
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
  private _isInitializingCrossTab = false;
  private _crossTabInitLock: Promise<CrossTabSessionManager | null> | null = null;

  private get crossTabSessionManager(): Promise<CrossTabSessionManager | null> {
    if (this._crossTabSessionManager) {
      return Promise.resolve(this._crossTabSessionManager);
    }

    if (this._crossTabInitLock) {
      return this._crossTabInitLock;
    }

    if (!this.shouldUseCrossTabs()) {
      return Promise.resolve(null);
    }

    this._crossTabInitLock = this.initializeCrossTabWithLock();

    return this._crossTabInitLock;
  }

  private async initializeCrossTabWithLock(): Promise<CrossTabSessionManager | null> {
    if (this._crossTabSessionManager) {
      this._crossTabInitLock = null;
      return this._crossTabSessionManager;
    }

    if (this._isInitializingCrossTab) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      this._crossTabInitLock = null;
      return this._crossTabSessionManager;
    }

    this._isInitializingCrossTab = true;

    try {
      const projectId = this.get('config')?.id;
      if (!projectId) {
        throw new Error('ProjectId not available for cross-tab initialization');
      }

      this.initializeCrossTabSessionManager(projectId);

      return this._crossTabSessionManager;
    } catch (error) {
      debugLog.error('SessionHandler', 'Failed to initialize cross-tab session manager', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    } finally {
      this._isInitializingCrossTab = false;
      this._crossTabInitLock = null;
    }
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
    } else {
      debugLog.warn('SessionHandler', 'ProjectId not available, recovery manager will be initialized later');
    }
  }

  startTracking(): void {
    if (this.sessionManager) {
      debugLog.debug('SessionHandler', 'Session tracking already active');
      return;
    }

    debugLog.debug('SessionHandler', 'Starting session tracking');

    this.ensureRecoveryManagerInitialized();

    this.checkOrphanedSessions();

    const onActivity = async (): Promise<void> => {
      const crossTab = await this.crossTabSessionManager;
      if (crossTab) {
        crossTab.updateSessionActivity();
      }

      if (this.get('sessionId')) {
        return;
      }

      try {
        const sessionResult = await this.createOrJoinSession();
        await this.set('sessionId', sessionResult.sessionId);

        const crossTabActive = !!(await this.crossTabSessionManager);
        debugLog.info('SessionHandler', '🏁 Session started', {
          sessionId: sessionResult.sessionId,
          recovered: sessionResult.recovered,
          crossTabActive,
        });

        this.trackSession(EventType.SESSION_START, sessionResult.recovered);
        this.persistSession(sessionResult.sessionId);
        this.startHeartbeat();
      } catch (error) {
        debugLog.error(
          'SessionHandler',
          `Session creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
        await this.forceCleanupSession();
      }
    };

    const onInactivity = async (): Promise<void> => {
      if (!this.get('sessionId')) {
        return;
      }

      const crossTab = await this.crossTabSessionManager;
      if (crossTab && crossTab.getEffectiveSessionTimeout() > 0) {
        if (this.get('config')?.mode === 'qa' || this.get('config')?.mode === 'debug') {
          debugLog.debug('SessionHandler', 'Session kept alive by cross-tab activity');
        }

        return;
      }

      this.sessionManager!.endSessionManaged('inactivity')
        .then(async (result) => {
          debugLog.info('SessionHandler', '🛑 Session ended by inactivity', {
            sessionId: this.get('sessionId'),
            reason: result.reason,
            success: result.success,
            eventsFlushed: result.eventsFlushed,
          });

          const crossTabManager = await this.crossTabSessionManager;
          if (crossTabManager) {
            crossTabManager.endSession('inactivity');
          }

          this.clearPersistedSession();
          this.stopHeartbeat();
        })
        .catch(async (error) => {
          debugLog.error(
            'SessionHandler',
            `Session end failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
          await this.forceCleanupSession();
        });
    };

    const sessionEndConfig: Partial<SessionEndConfig> = {
      enablePageUnloadHandlers: true,
      debugMode: (this.get('config')?.mode === 'qa' || this.get('config')?.mode === 'debug') ?? false,
      syncTimeoutMs: SESSION_SYNC_CONSTANTS.SYNC_TIMEOUT_MS,
      maxRetries: SESSION_SYNC_CONSTANTS.MAX_RETRY_ATTEMPTS,
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

  async stopTracking(): Promise<void> {
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
          await this.forceCleanupSession();
        }
      }

      this.sessionManager.destroy();
      this.sessionManager = null;
    }

    if (this._crossTabSessionManager) {
      this._crossTabSessionManager.destroy();
      this._crossTabSessionManager = null;
    }

    this._isInitializingCrossTab = false;
    this._crossTabInitLock = null;

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

    const onSessionStart = async (sessionId: string): Promise<void> => {
      if (this.get('config')?.mode === 'qa' || this.get('config')?.mode === 'debug') {
        debugLog.debug('SessionHandler', `Cross-tab session started: ${sessionId}`);
      }

      await this.set('sessionId', sessionId);
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

  private ensureRecoveryManagerInitialized(): void {
    if (!this.recoveryManager) {
      const projectId = this.get('config')?.id;

      if (projectId) {
        this.initializeSessionRecoveryManager(projectId);
      } else {
        debugLog.error('SessionHandler', 'Cannot initialize recovery manager without projectId');
      }
    }
  }

  private async createOrJoinSession(): Promise<{ sessionId: string; recovered: boolean }> {
    const crossTab = await this.crossTabSessionManager;
    if (crossTab) {
      const existingSessionId = crossTab.getSessionId();
      if (existingSessionId) {
        return { sessionId: existingSessionId, recovered: false };
      }

      const sessionResult = this.sessionManager!.startSession();
      return { sessionId: sessionResult.sessionId, recovered: sessionResult.recovered ?? false };
    }

    const sessionResult = this.sessionManager!.startSession();
    return { sessionId: sessionResult.sessionId, recovered: sessionResult.recovered ?? false };
  }

  private async forceCleanupSession(): Promise<void> {
    await this.set('sessionId', null);

    this.clearPersistedSession();

    this.stopHeartbeat();

    const crossTab = await this.crossTabSessionManager;
    if (crossTab) {
      try {
        crossTab.endSession('orphaned_cleanup');
      } catch (error) {
        if (this.get('config')?.mode === 'qa' || this.get('config')?.mode === 'debug') {
          debugLog.warn(
            'SessionHandler',
            `Cross-tab cleanup failed during force cleanup: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }
      }
    }

    try {
      this.trackSession(EventType.SESSION_END, false, 'orphaned_cleanup');
    } catch (error) {
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

  private async startInitialSession(): Promise<void> {
    if (this.get('sessionId')) {
      debugLog.debug('SessionHandler', 'Session already exists, skipping initial session creation');
      return;
    }

    debugLog.debug('SessionHandler', 'Starting initial session');

    const crossTab = await this.crossTabSessionManager;
    if (crossTab) {
      const existingSessionId = crossTab.getSessionId();

      if (existingSessionId) {
        await this.set('sessionId', existingSessionId);
        this.trackSession(EventType.SESSION_START, false);
        this.persistSession(existingSessionId);
        this.startHeartbeat();

        debugLog.info('SessionHandler', '🏁 Session started (joined cross-tab session)', {
          sessionId: existingSessionId,
        });

        return;
      }

      // No existing session in cross-tab, let activity trigger create one
      debugLog.debug('SessionHandler', 'No existing cross-tab session, waiting for activity');
      return;
    }

    debugLog.debug('SessionHandler', 'Starting regular session (no cross-tab)');
    const sessionResult = this.sessionManager!.startSession();

    await this.set('sessionId', sessionResult.sessionId);
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
          const canRecover = this.recoveryManager?.hasRecoverableSession() ?? false;

          if (canRecover && this.recoveryManager) {
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
