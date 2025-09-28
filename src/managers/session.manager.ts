import { DEFAULT_SESSION_TIMEOUT } from '../constants';
import { EventType } from '../types';
import { SessionEndReason } from '../types/session.types';
import { debugLog } from '../utils/logging';
import { StateManager } from './state.manager';
import { StorageManager } from './storage.manager';
import { EventManager } from './event.manager';

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

    this.broadcastChannel = new BroadcastChannel('tracelog_session');

    this.broadcastChannel.onmessage = (event): void => {
      const { sessionId, timestamp } = event.data;

      if (sessionId && timestamp && timestamp > Date.now() - 5000) {
        this.set('sessionId', sessionId);
        this.storageManager.setItem('sessionId', sessionId);
        this.storageManager.setItem('lastActivity', timestamp.toString());

        debugLog.debug('SessionManager', 'Session synced from another tab', { sessionId });
      }
    };
  }

  /**
   * Share session with other tabs
   */
  private shareSession(sessionId: string): void {
    this.broadcastChannel?.postMessage({
      sessionId,
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
    const storedSessionId = this.storageManager.getItem('sessionId');
    const lastActivity = this.storageManager.getItem('lastActivity');

    if (!storedSessionId || !lastActivity) {
      return null;
    }

    const lastActivityTime = parseInt(lastActivity, 10);
    const sessionTimeout = this.get('config')?.sessionTimeout ?? DEFAULT_SESSION_TIMEOUT;

    if (Date.now() - lastActivityTime > sessionTimeout) {
      debugLog.debug('SessionManager', 'Stored session expired');
      return null;
    }

    debugLog.info('SessionManager', 'Session recovered from storage', { sessionId: storedSessionId });
    return storedSessionId;
  }

  /**
   * Persist session data to localStorage
   */
  private persistSession(sessionId: string): void {
    this.storageManager.setItem('sessionId', sessionId);
    this.storageManager.setItem('lastActivity', Date.now().toString());
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
      this.storageManager.removeItem('sessionId');
      this.storageManager.removeItem('lastActivity');
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
      this.clearSessionTimeout();
      this.cleanupActivityListeners();
      this.cleanupCrossTabSync();
      this.cleanupLifecycleListeners();
      this.storageManager.removeItem('sessionId');
      this.storageManager.removeItem('lastActivity');
      this.set('hasStartSession', false);
      this.isTracking = false;
      this.set('sessionId', null);
      return;
    }

    debugLog.info('SessionManager', 'Ending session', { sessionId, reason });

    // Track session end event
    this.eventManager.track({
      type: EventType.SESSION_END,
      session_end_reason: reason,
    });

    // Clean up resources
    this.clearSessionTimeout();
    this.cleanupActivityListeners();
    this.cleanupCrossTabSync();
    this.cleanupLifecycleListeners();

    // Clear storage and state
    this.storageManager.removeItem('sessionId');
    this.storageManager.removeItem('lastActivity');
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
