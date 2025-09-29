import { BROADCAST_CHANNEL_NAME, DEFAULT_SESSION_TIMEOUT, SESSION_STORAGE_KEY } from '../constants';
import { EventType } from '../types';
import { SessionEndReason } from '../types/session.types';
import { debugLog } from '../utils/logging';
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
  private sessionTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private activityHandler: (() => void) | null = null;
  private visibilityChangeHandler: (() => void) | null = null;
  private beforeUnloadHandler: ((event: BeforeUnloadEvent) => void) | null = null;
  private isTracking = false;

  constructor(storageManager: StorageManager, eventManager: EventManager) {
    super();
    this.storageManager = storageManager;
    this.eventManager = eventManager;
  }

  /**
   * Initialize cross-tab synchronization
   */
  private initCrossTabSync(): void {
    if (typeof BroadcastChannel === 'undefined') {
      debugLog.warn('SessionManager', 'BroadcastChannel not supported');
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
        debugLog.debug('SessionManager', 'Session end synced from another tab');
        this.resetSessionState();
        return;
      }

      if (sessionId && typeof timestamp === 'number' && timestamp > Date.now() - 5000) {
        this.set('sessionId', sessionId);
        this.set('hasStartSession', true);
        this.persistSession(sessionId, timestamp);
        if (this.isTracking) {
          this.setupSessionTimeout();
        }

        debugLog.debug('SessionManager', 'Session synced from another tab', { sessionId });
      }
    };
  }

  /**
   * Share session with other tabs
   */
  private shareSession(sessionId: string): void {
    this.broadcastChannel?.postMessage({
      action: 'session_start',
      projectId: this.getProjectId(),
      sessionId,
      timestamp: Date.now(),
    });
  }

  private broadcastSessionEnd(sessionId: string | null, reason: SessionEndReason): void {
    if (!sessionId) {
      return;
    }

    this.broadcastChannel?.postMessage({
      action: 'session_end',
      projectId: this.getProjectId(),
      sessionId,
      reason,
      timestamp: Date.now(),
    });
  }

  /**
   * Cleanup cross-tab sync
   */
  private cleanupCrossTabSync(): void {
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
  }

  /**
   * Recover session from localStorage if it exists and hasn't expired
   */
  private recoverSession(): string | null {
    const storedSession = this.loadStoredSession();

    if (!storedSession) {
      return null;
    }

    const sessionTimeout = this.get('config')?.sessionTimeout ?? DEFAULT_SESSION_TIMEOUT;

    if (Date.now() - storedSession.lastActivity > sessionTimeout) {
      debugLog.debug('SessionManager', 'Stored session expired');
      this.clearStoredSession();
      return null;
    }

    debugLog.info('SessionManager', 'Session recovered from storage', { sessionId: storedSession.id });
    return storedSession.id;
  }

  /**
   * Persist session data to localStorage
   */
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
    return this.get('config')?.id ?? '';
  }

  /**
   * Start session tracking
   */
  async startTracking(): Promise<void> {
    if (this.isTracking) {
      debugLog.warn('SessionManager', 'Session tracking already active');
      return;
    }

    const recoveredSessionId = this.recoverSession();
    const sessionId = recoveredSessionId ?? this.generateSessionId();
    const isRecovered = Boolean(recoveredSessionId);

    this.isTracking = true;

    try {
      this.set('sessionId', sessionId);
      this.persistSession(sessionId);

      // Track session start event
      this.eventManager.track({
        type: EventType.SESSION_START,
        ...(isRecovered && { session_start_recovered: true }),
      });

      // Initialize components
      this.initCrossTabSync();
      this.shareSession(sessionId);
      this.setupSessionTimeout();
      this.setupActivityListeners();
      this.setupLifecycleListeners();

      debugLog.info('SessionManager', 'Session tracking started', { sessionId, recovered: isRecovered });
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

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Setup session timeout
   */
  private setupSessionTimeout(): void {
    this.clearSessionTimeout();

    const sessionTimeout = this.get('config')?.sessionTimeout ?? DEFAULT_SESSION_TIMEOUT;

    this.sessionTimeoutId = setTimeout(() => {
      this.endSession('inactivity');
    }, sessionTimeout);
  }

  /**
   * Reset session timeout and update activity
   */
  private resetSessionTimeout(): void {
    this.setupSessionTimeout();
    const sessionId = this.get('sessionId') as string;
    if (sessionId) {
      this.persistSession(sessionId);
    }
  }

  /**
   * Clear session timeout
   */
  private clearSessionTimeout(): void {
    if (this.sessionTimeoutId) {
      clearTimeout(this.sessionTimeoutId);
      this.sessionTimeoutId = null;
    }
  }

  /**
   * Setup activity listeners to track user engagement
   */
  private setupActivityListeners(): void {
    this.activityHandler = (): void => this.resetSessionTimeout();

    document.addEventListener('click', this.activityHandler, { passive: true });
    document.addEventListener('keydown', this.activityHandler, { passive: true });
    document.addEventListener('scroll', this.activityHandler, { passive: true });
  }

  /**
   * Clean up activity listeners
   */
  private cleanupActivityListeners(): void {
    if (this.activityHandler) {
      document.removeEventListener('click', this.activityHandler);
      document.removeEventListener('keydown', this.activityHandler);
      document.removeEventListener('scroll', this.activityHandler);
      this.activityHandler = null;
    }
  }

  /**
   * Setup page lifecycle listeners (visibility and unload)
   */
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
      this.eventManager.flushImmediatelySync();
    };

    // Handle tab visibility changes
    document.addEventListener('visibilitychange', this.visibilityChangeHandler);

    // Handle page unload
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

  /**
   * End current session
   */
  private endSession(reason: SessionEndReason): void {
    const sessionId = this.get('sessionId');

    if (!sessionId) {
      debugLog.warn('SessionManager', 'endSession called without active session', { reason });
      this.resetSessionState();
      return;
    }

    debugLog.info('SessionManager', 'Ending session', { sessionId, reason });

    this.eventManager.track({
      type: EventType.SESSION_END,
      session_end_reason: reason,
    });

    const finalize = (): void => {
      this.broadcastSessionEnd(sessionId, reason);
      this.resetSessionState();
    };

    const flushResult = this.eventManager.flushImmediatelySync();

    if (flushResult) {
      finalize();
      return;
    }

    this.eventManager
      .flushImmediately()
      .then(finalize)
      .catch((error) => {
        debugLog.warn('SessionManager', 'Async flush failed during session end', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        finalize();
      });
  }

  private resetSessionState(): void {
    this.clearSessionTimeout();
    this.cleanupActivityListeners();
    this.cleanupLifecycleListeners();
    this.cleanupCrossTabSync();
    this.clearStoredSession();
    this.set('sessionId', null);
    this.set('hasStartSession', false);
    this.isTracking = false;
  }

  /**
   * Stop session tracking
   */
  async stopTracking(): Promise<void> {
    this.endSession('manual_stop');
  }

  /**
   * Clean up all resources
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
