import { SESSION_HEARTBEAT_INTERVAL_MS, SESSION_STORAGE_KEY, DEFAULT_SESSION_TIMEOUT_MS } from '../constants';
import { EventType } from '../types';
import { SessionEndConfig } from '../types/session.types';
import { EventManager } from '../managers/event.manager';
import { SessionManager } from '../managers/session.manager';
import { SessionRecoveryManager } from '../managers/session-recovery.manager';
import { StateManager } from '../managers/state.manager';
import { StorageManager } from '../managers/storage.manager';
import { log } from '../utils';

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
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  constructor(storageManager: StorageManager, eventManager: EventManager) {
    super();

    this.eventManager = eventManager;
    this.storageManager = storageManager;
    this.sessionStorageKey = SESSION_STORAGE_KEY(this.get('config')?.id);

    const projectId = this.get('config')?.id;

    if (projectId) {
      this.recoveryManager = new SessionRecoveryManager(this.storageManager, projectId, this.eventManager);
    }
  }

  startTracking(): void {
    if (this.sessionManager) {
      return;
    }

    this.checkOrphanedSessions();

    const onActivity = (): void => {
      if (this.get('sessionId')) {
        return;
      }

      const sessionResult = this.sessionManager!.startSession();

      this.set('sessionId', sessionResult.sessionId);
      this.trackSession(EventType.SESSION_START, sessionResult.recoveryData);
      this.persistSession(sessionResult.sessionId);
      this.startHeartbeat();
    };

    const onInactivity = (): void => {
      if (!this.get('sessionId')) {
        return;
      }

      this.sessionManager!.endSessionManaged('inactivity').then((result) => {
        if (this.get('config')?.qaMode) {
          log('info', `Inactivity session end result: ${result}`);
        }

        this.clearPersistedSession();
        this.stopHeartbeat();
      });
    };

    const sessionEndConfig: Partial<SessionEndConfig> = {
      enablePageUnloadHandlers: true,
      debugMode: this.get('config')?.qaMode ?? false,
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

    this.startInitialSession();
  }

  stopTracking(): void {
    if (this.sessionManager) {
      if (this.get('sessionId')) {
        this.sessionManager.endSessionManagedSync('manual_stop');
        this.clearPersistedSession();
        this.stopHeartbeat();
      }

      this.sessionManager.destroy();
      this.sessionManager = null;
    }

    if (this.recoveryManager) {
      this.recoveryManager.cleanupOldRecoveryAttempts();
      this.recoveryManager = null;
    }
  }

  private trackSession(
    eventType: EventType.SESSION_START | EventType.SESSION_END,
    recoveryData?: {
      recovered: boolean;
    },
  ): void {
    this.eventManager.track({
      type: eventType,
      ...(eventType === EventType.SESSION_START && recoveryData && { session_start: recoveryData }),
      ...(eventType === EventType.SESSION_END && { session_end_reason: 'orphaned_cleanup' }),
    });
  }

  private startInitialSession(): void {
    if (this.get('sessionId')) {
      return;
    }

    const sessionResult = this.sessionManager!.startSession();

    this.set('sessionId', sessionResult.sessionId);
    this.trackSession(EventType.SESSION_START, sessionResult.recoveryData);
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
            // Store session context for potential recovery
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

              if (this.get('config')?.qaMode) {
                log('info', `Orphaned session stored for recovery: ${session.sessionId}`);
              }
            }
          }

          // End the orphaned session
          this.trackSession(EventType.SESSION_END);
          this.clearPersistedSession();

          if (this.get('config')?.qaMode) {
            log('info', `Orphaned session ended: ${session.sessionId}, recovery available: ${canRecover}`);
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
