import { BROADCAST_CHANNEL_NAME, DEFAULT_SESSION_TIMEOUT, SESSION_STORAGE_KEY } from '../constants';
import { EventType } from '../types';
import { SessionEndReason } from '../types/session.types';
import { log } from '../utils';
import { StateManager } from './state.manager';
import { StorageManager } from './storage.manager';
import { EventManager } from './event.manager';

interface StoredSessionData {
  id: string;
  lastActivity: number;
}

export class SessionManager extends StateManager {
  private readonly storageManager: StorageManager;
  private readonly eventManager: EventManager;
  private readonly projectId: string;

  private activityHandler: (() => void) | null = null;
  private visibilityChangeHandler: (() => void) | null = null;
  private beforeUnloadHandler: ((event: BeforeUnloadEvent) => void) | null = null;
  private sessionTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private isTracking = false;
  private isEnding = false;

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

      if (sessionId && typeof timestamp === 'number' && timestamp > Date.now() - 5000) {
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

  private broadcastSessionEnd(sessionId: string | null, reason: SessionEndReason): void {
    if (!sessionId) {
      return;
    }

    if (this.broadcastChannel && typeof this.broadcastChannel.postMessage === 'function') {
      try {
        this.broadcastChannel.postMessage({
          action: 'session_end',
          projectId: this.getProjectId(),
          sessionId,
          reason,
          timestamp: Date.now(),
        });
      } catch (error) {
        log('warn', 'Failed to broadcast session end', { error, data: { sessionId, reason } });
      }
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

  startTracking(): void {
    if (this.isTracking) {
      log('warn', 'Session tracking already active');
      return;
    }

    const recoveredSessionId = this.recoverSession();
    const sessionId = recoveredSessionId ?? this.generateSessionId();
    const isRecovered = Boolean(recoveredSessionId);

    this.isTracking = true;

    try {
      this.set('sessionId', sessionId);
      this.persistSession(sessionId);
      this.initCrossTabSync();
      this.shareSession(sessionId);

      if (!isRecovered) {
        this.eventManager.track({
          type: EventType.SESSION_START,
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
      this.endSession('inactivity');
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
    if (this.visibilityChangeHandler || this.beforeUnloadHandler) {
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

    this.beforeUnloadHandler = (): void => {
      this.endSession('page_unload');
    };

    document.addEventListener('visibilitychange', this.visibilityChangeHandler);
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
  }

  private cleanupLifecycleListeners(): void {
    if (this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
      this.visibilityChangeHandler = null;
    }

    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
    }
  }

  private endSession(reason: SessionEndReason): void {
    if (this.isEnding) {
      return;
    }

    const sessionId = this.get('sessionId');

    if (!sessionId) {
      log('warn', 'endSession called without active session', { data: { reason } });
      this.resetSessionState(reason);
      return;
    }

    this.isEnding = true;

    try {
      this.eventManager.track({
        type: EventType.SESSION_END,
        session_end_reason: reason,
      });

      const flushResult = this.eventManager.flushImmediatelySync();

      if (!flushResult) {
        log('warn', 'Sync flush failed during session end, events persisted for recovery', {
          data: { reason, sessionId },
        });
      }

      this.broadcastSessionEnd(sessionId, reason);
      this.resetSessionState(reason);
    } finally {
      this.isEnding = false;
    }
  }

  private resetSessionState(reason?: SessionEndReason): void {
    this.clearSessionTimeout();
    this.cleanupActivityListeners();
    this.cleanupLifecycleListeners();
    this.cleanupCrossTabSync();

    if (reason !== 'page_unload') {
      this.clearStoredSession();
    }

    this.set('sessionId', null);
    this.set('hasStartSession', false);
    this.isTracking = false;
  }

  stopTracking(): void {
    this.endSession('manual_stop');
  }

  destroy(): void {
    this.clearSessionTimeout();
    this.cleanupActivityListeners();
    this.cleanupCrossTabSync();
    this.cleanupLifecycleListeners();
    this.isTracking = false;
    this.set('hasStartSession', false);
  }
}
