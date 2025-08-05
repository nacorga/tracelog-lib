import { SESSION_HEARTBEAT_INTERVAL_MS, SESSION_STORAGE_KEY, DEFAULT_SESSION_TIMEOUT_MS } from '../constants';
import { EventType } from '../types';
import { EventManager } from '../managers/event.manager';
import { SessionManager } from '../managers/session.manager';
import { StateManager } from '../managers/state.manager';
import { StorageManager } from '../managers/storage.manager';

interface StoredSession {
  sessionId: string;
  startTime: number;
  lastHeartbeat: number;
}

export class SessionHandler extends StateManager {
  private readonly eventManager: EventManager;
  private readonly storageManager: StorageManager;

  private sessionManager: SessionManager | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  constructor(storageManager: StorageManager, eventManager: EventManager) {
    super();

    this.eventManager = eventManager;
    this.storageManager = storageManager;
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

      const newSessionId = this.sessionManager!.startSession();
      this.set('sessionId', newSessionId);
      this.trackSession(EventType.SESSION_START);
      this.persistSession(newSessionId);
      this.startHeartbeat();
    };

    const onInactivity = (): void => {
      if (!this.get('sessionId')) {
        return;
      }

      this.sessionManager!.endSession();
      this.trackSession(EventType.SESSION_END);
      this.clearPersistedSession();
      this.stopHeartbeat();
      this.set('sessionId', null);
    };

    this.sessionManager = new SessionManager(onActivity, onInactivity);
    this.startInitialSession();
  }

  private trackSession(eventType: EventType.SESSION_START | EventType.SESSION_END): void {
    this.eventManager.track({
      type: eventType,
    });
  }

  private startInitialSession(): void {
    if (this.get('sessionId')) {
      return;
    }

    const newSessionId = this.sessionManager!.startSession();

    this.set('sessionId', newSessionId);
    this.trackSession(EventType.SESSION_START);
    this.persistSession(newSessionId);
    this.startHeartbeat();
  }

  stopTracking(): void {
    if (this.sessionManager) {
      if (this.get('sessionId')) {
        this.sessionManager.endSession();
        this.trackSession(EventType.SESSION_END);
        this.clearPersistedSession();
        this.stopHeartbeat();
        this.set('sessionId', null);
      }

      this.sessionManager.destroy();
      this.sessionManager = null;
    }
  }

  private checkOrphanedSessions(): void {
    const storedSessionData = this.storageManager.getItem(SESSION_STORAGE_KEY);

    if (storedSessionData) {
      try {
        const session: StoredSession = JSON.parse(storedSessionData);
        const now = Date.now();
        const timeSinceLastHeartbeat = now - session.lastHeartbeat;
        const sessionTimeout = this.get('config')?.sessionTimeout ?? DEFAULT_SESSION_TIMEOUT_MS;

        // If more than session timeout has passed, consider it orphaned
        if (timeSinceLastHeartbeat > sessionTimeout) {
          // Track the missed session_end event
          this.trackSession(EventType.SESSION_END);
          this.clearPersistedSession();
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

    this.storageManager.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
  }

  private clearPersistedSession(): void {
    this.storageManager.removeItem(SESSION_STORAGE_KEY);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      const storedSessionData = this.storageManager.getItem(SESSION_STORAGE_KEY);

      if (storedSessionData) {
        try {
          const session: StoredSession = JSON.parse(storedSessionData);
          session.lastHeartbeat = Date.now();
          this.storageManager.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
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
