import {
  DEFAULT_MOTION_THRESHOLD,
  DEFAULT_SESSION_TIMEOUT_MS,
  DEFAULT_THROTTLE_DELAY_MS,
  DEFAULT_VISIBILITY_TIMEOUT_MS,
} from '../constants';
import { DeviceType, EventType } from '../types';
import { generateUUID, getDeviceType } from '../utils';
import { debugLog } from '../utils/logging';
import {
  SessionEndReason,
  SessionEndConfig,
  SessionEndResult,
  SessionEndStats,
  SessionContext,
  SessionHealth,
} from '../types/session.types';
import {
  ActivityListenerManager,
  EventListenerManager,
  KeyboardListenerManager,
  MouseListenerManager,
  TouchListenerManager,
  UnloadListenerManager,
  VisibilityListenerManager,
} from '../listeners';
import { StateManager } from './state.manager';
import { EventManager } from './event.manager';
import { SessionRecoveryManager } from './session-recovery.manager';
import { StorageManager } from './storage.manager';

interface SessionConfig {
  timeout: number;
  throttleDelay: number;
  visibilityTimeout: number;
  motionThreshold: number;
}

interface DeviceCapabilities {
  hasTouch: boolean;
  hasMouse: boolean;
  hasKeyboard: boolean;
  isMobile: boolean;
}

export class SessionManager extends StateManager {
  private readonly config: SessionConfig;
  private readonly eventManager: EventManager | null = null;
  private readonly storageManager: StorageManager | null = null;
  private readonly listenerManagers: EventListenerManager[] = [];
  private readonly deviceCapabilities: DeviceCapabilities;
  private readonly onActivity: () => void;
  private readonly onInactivity: () => void;

  // Recovery manager
  private recoveryManager: SessionRecoveryManager | null = null;

  private isSessionActive = false;
  private lastActivityTime = 0;
  private inactivityTimer: number | null = null;
  private sessionStartTime = 0;
  private throttleTimeout: number | null = null;

  // Track visibility change timeout for proper cleanup
  private visibilityChangeTimeout: number | null = null;

  // Session End Management
  private pendingSessionEnd = false;
  private sessionEndPromise: Promise<SessionEndResult> | null = null;
  private sessionEndLock: Promise<SessionEndResult> = Promise.resolve({
    success: true,
    reason: 'manual_stop',
    timestamp: Date.now(),
    eventsFlushed: 0,
    method: 'async',
  });
  private cleanupHandlers: (() => void)[] = [];
  private readonly sessionEndConfig: SessionEndConfig;
  private sessionEndReason: SessionEndReason | null = null;
  private readonly sessionEndPriority: Record<SessionEndReason, number> = {
    page_unload: 4,
    manual_stop: 3,
    orphaned_cleanup: 2,
    inactivity: 1,
    tab_closed: 0,
  };
  private readonly sessionEndStats: SessionEndStats = {
    totalSessionEnds: 0,
    successfulEnds: 0,
    failedEnds: 0,
    duplicatePrevented: 0,
    reasonCounts: {
      inactivity: 0,
      page_unload: 0,
      manual_stop: 0,
      orphaned_cleanup: 0,
      tab_closed: 0,
    },
  };

  // Session health monitoring
  private readonly sessionHealth: SessionHealth = {
    recoveryAttempts: 0,
    sessionTimeouts: 0,
    crossTabConflicts: 0,
    lastHealthCheck: Date.now(),
  };

  constructor(
    onActivity: () => void,
    onInactivity: () => void,
    eventManager?: EventManager,
    storageManager?: StorageManager,
    sessionEndConfig?: Partial<SessionEndConfig>,
  ) {
    super();

    this.config = {
      throttleDelay: DEFAULT_THROTTLE_DELAY_MS,
      visibilityTimeout: DEFAULT_VISIBILITY_TIMEOUT_MS,
      motionThreshold: DEFAULT_MOTION_THRESHOLD,
      timeout: this.get('config')?.sessionTimeout ?? DEFAULT_SESSION_TIMEOUT_MS,
    };

    this.sessionEndConfig = {
      enablePageUnloadHandlers: true,
      syncTimeoutMs: 1000,
      maxRetries: 2,
      debugMode: false,
      ...sessionEndConfig,
    };

    this.onActivity = onActivity;
    this.onInactivity = onInactivity;
    this.eventManager = eventManager ?? null;
    this.storageManager = storageManager ?? null;
    this.deviceCapabilities = this.detectDeviceCapabilities();

    this.initializeRecoveryManager();
    this.initializeListenerManagers();
    this.setupAllListeners();

    if (this.sessionEndConfig.enablePageUnloadHandlers) {
      this.setupPageUnloadHandlers();
    }

    debugLog.debug('SessionManager', 'SessionManager initialized', {
      sessionTimeout: this.config.timeout,
      deviceCapabilities: this.deviceCapabilities,
      unloadHandlersEnabled: this.sessionEndConfig.enablePageUnloadHandlers,
    });
  }

  /**
   * Initialize recovery manager
   */
  private initializeRecoveryManager(): void {
    if (!this.storageManager) return;

    const projectId = this.get('config')?.id;
    if (!projectId) return;

    try {
      // Initialize session recovery manager (always enabled)
      this.recoveryManager = new SessionRecoveryManager(this.storageManager, projectId, this.eventManager ?? undefined);

      debugLog.debug('SessionManager', 'Recovery manager initialized', { projectId });
    } catch (error) {
      debugLog.error('SessionManager', 'Failed to initialize recovery manager', { error, projectId });
    }
  }

  /**
   * Store session context for recovery
   */
  private storeSessionContextForRecovery(): void {
    if (!this.recoveryManager) return;

    const sessionId = this.get('sessionId');
    if (!sessionId) return;

    const sessionContext: SessionContext = {
      sessionId,
      startTime: this.sessionStartTime,
      lastActivity: this.lastActivityTime,
      tabCount: 1, // This will be updated by cross-tab manager
      recoveryAttempts: 0,
      metadata: {
        userAgent: navigator.userAgent,
        pageUrl: this.get('pageUrl'),
      },
    };

    this.recoveryManager.storeSessionContextForRecovery(sessionContext);
  }

  startSession(): { sessionId: string; recovered?: boolean } {
    const now = Date.now();

    // Attempt session recovery first
    let sessionId = '';
    let wasRecovered = false;

    if (this.recoveryManager?.hasRecoverableSession()) {
      const recoveryResult = this.recoveryManager.attemptSessionRecovery();

      if (recoveryResult.recovered && recoveryResult.recoveredSessionId) {
        sessionId = recoveryResult.recoveredSessionId;
        wasRecovered = true;

        // Track session recovery for health monitoring
        this.trackSessionHealth('recovery');

        // Update session timing from recovery context
        if (recoveryResult.context) {
          this.sessionStartTime = recoveryResult.context.startTime;
          this.lastActivityTime = now;
        } else {
          this.sessionStartTime = now;
          this.lastActivityTime = now;
        }

        debugLog.info('SessionManager', 'Session successfully recovered', {
          sessionId,
          recoveryAttempts: this.sessionHealth.recoveryAttempts,
        });
      }
    }

    // If no recovery, create new session
    if (!wasRecovered) {
      sessionId = generateUUID();

      this.sessionStartTime = now;
      this.lastActivityTime = now;

      debugLog.info('SessionManager', 'New session started', { sessionId });
    }

    this.isSessionActive = true;

    this.resetInactivityTimer();

    // Store session context for future recovery
    this.storeSessionContextForRecovery();

    return { sessionId, recovered: wasRecovered };
  }

  endSession(): number {
    if (this.sessionStartTime === 0) {
      return 0;
    }

    const durationMs = Date.now() - this.sessionStartTime;

    this.sessionStartTime = 0;
    this.isSessionActive = false;

    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }

    return durationMs;
  }

  destroy(): void {
    this.clearTimers();
    this.cleanupAllListeners();
    this.resetState();
    this.cleanupHandlers.forEach((cleanup) => cleanup());
    this.cleanupHandlers = [];
    this.pendingSessionEnd = false;
    this.sessionEndPromise = null;
    this.sessionEndLock = Promise.resolve({
      success: true,
      reason: 'manual_stop',
      timestamp: Date.now(),
      eventsFlushed: 0,
      method: 'async',
    });

    if (this.recoveryManager) {
      this.recoveryManager.cleanupOldRecoveryAttempts();
      this.recoveryManager = null;
    }
  }

  private detectDeviceCapabilities(): DeviceCapabilities {
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const hasMouse = window.matchMedia('(pointer: fine)').matches;
    const hasKeyboard = !window.matchMedia('(pointer: coarse)').matches;
    const isMobile = getDeviceType() === DeviceType.Mobile;

    return { hasTouch, hasMouse, hasKeyboard, isMobile };
  }

  private initializeListenerManagers(): void {
    this.listenerManagers.push(new ActivityListenerManager(this.handleActivity));

    if (this.deviceCapabilities.hasTouch) {
      this.listenerManagers.push(new TouchListenerManager(this.handleActivity, this.config.motionThreshold));
    }

    if (this.deviceCapabilities.hasMouse) {
      this.listenerManagers.push(new MouseListenerManager(this.handleActivity));
    }

    if (this.deviceCapabilities.hasKeyboard) {
      this.listenerManagers.push(new KeyboardListenerManager(this.handleActivity));
    }

    this.listenerManagers.push(
      new VisibilityListenerManager(this.handleActivity, this.handleVisibilityChange, this.deviceCapabilities.isMobile),
    );

    this.listenerManagers.push(new UnloadListenerManager(this.handleInactivity));
  }

  private setupAllListeners(): void {
    this.listenerManagers.forEach((manager) => manager.setup());
  }

  private cleanupAllListeners(): void {
    this.listenerManagers.forEach((manager) => manager.cleanup());
  }

  private clearTimers(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }

    if (this.throttleTimeout) {
      clearTimeout(this.throttleTimeout);
      this.throttleTimeout = null;
    }
  }

  private resetState(): void {
    this.isSessionActive = false;
    this.lastActivityTime = 0;
    this.sessionStartTime = 0;
  }

  private readonly handleActivity = (): void => {
    const now = Date.now();

    if (now - this.lastActivityTime < this.config.throttleDelay) {
      return;
    }

    this.lastActivityTime = now;

    if (this.isSessionActive) {
      // Always call onActivity to update cross-tab session activity
      this.onActivity();
      this.resetInactivityTimer();
    } else {
      if (this.throttleTimeout) {
        clearTimeout(this.throttleTimeout);
        this.throttleTimeout = null;
      }

      this.throttleTimeout = window.setTimeout(() => {
        this.onActivity();
        this.throttleTimeout = null;
      }, 100);
    }
  };

  private readonly handleInactivity = (): void => {
    // Track session timeout for health monitoring
    this.trackSessionHealth('timeout');
    this.onInactivity();
  };

  private readonly handleVisibilityChange = (): void => {
    if (document.hidden) {
      if (this.isSessionActive) {
        if (this.inactivityTimer) {
          clearTimeout(this.inactivityTimer);
          this.inactivityTimer = null;
        }

        this.inactivityTimer = window.setTimeout(this.handleInactivity, this.config.visibilityTimeout);
      }
    } else {
      this.handleActivity();
    }
  };

  private readonly resetInactivityTimer = (): void => {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }

    if (this.isSessionActive) {
      this.inactivityTimer = window.setTimeout(() => {
        this.handleInactivity();
      }, this.config.timeout);
    }
  };

  clearInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }

  private shouldProceedWithSessionEnd(reason: SessionEndReason): boolean {
    return !this.sessionEndReason || this.sessionEndPriority[reason] > this.sessionEndPriority[this.sessionEndReason];
  }

  private async waitForCompletion(): Promise<SessionEndResult> {
    if (this.sessionEndPromise) {
      return await this.sessionEndPromise;
    }

    return {
      success: false,
      reason: 'inactivity',
      timestamp: Date.now(),
      eventsFlushed: 0,
      method: 'async',
    };
  }

  private createSessionEndTimeout(): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Session end timeout'));
      }, this.sessionEndConfig.syncTimeoutMs || 5000);
    });
  }

  async endSessionManaged(reason: SessionEndReason): Promise<SessionEndResult> {
    return (this.sessionEndLock = this.sessionEndLock
      .then(async (): Promise<SessionEndResult> => {
        this.sessionEndStats.totalSessionEnds++;
        this.sessionEndStats.reasonCounts[reason]++;

        if (this.pendingSessionEnd) {
          this.sessionEndStats.duplicatePrevented++;
          debugLog.debug('SessionManager', 'Session end already pending, waiting for completion', { reason });
          return this.waitForCompletion();
        }

        if (!this.shouldProceedWithSessionEnd(reason)) {
          if (this.sessionEndConfig.debugMode) {
            debugLog.debug(
              'SessionManager',
              `Session end skipped due to lower priority. Current: ${this.sessionEndReason}, Requested: ${reason}`,
            );
          }

          return {
            success: false,
            reason,
            timestamp: Date.now(),
            eventsFlushed: 0,
            method: 'async',
          };
        }

        this.sessionEndReason = reason;
        this.pendingSessionEnd = true;
        this.sessionEndPromise = Promise.race([
          this.performSessionEnd(reason, 'async'),
          this.createSessionEndTimeout(),
        ]) as Promise<SessionEndResult>;

        try {
          const result = await this.sessionEndPromise;
          return result;
        } finally {
          this.pendingSessionEnd = false;
          this.sessionEndPromise = null;
          this.sessionEndReason = null;
        }
      })
      .catch((error): SessionEndResult => {
        // Recovery del lock en caso de error
        this.pendingSessionEnd = false;
        this.sessionEndPromise = null;
        this.sessionEndReason = null;

        debugLog.error('SessionManager', 'Session end lock failed, recovering', { error, reason });

        return {
          success: false,
          reason,
          timestamp: Date.now(),
          eventsFlushed: 0,
          method: 'async' as const,
        };
      }));
  }

  endSessionSafely(
    reason: SessionEndReason,
    options?: {
      forceSync?: boolean;
      allowSync?: boolean;
    },
  ): Promise<SessionEndResult> | SessionEndResult {
    const shouldUseSync = options?.forceSync ?? (options?.allowSync && ['page_unload', 'tab_closed'].includes(reason));

    if (shouldUseSync) {
      return this.endSessionManagedSync(reason);
    }

    return this.endSessionManaged(reason);
  }

  isPendingSessionEnd(): boolean {
    return this.pendingSessionEnd;
  }

  /**
   * Track session health events for monitoring and diagnostics
   */
  trackSessionHealth(event: 'recovery' | 'timeout' | 'conflict'): void {
    const now = Date.now();

    // Update health counters
    switch (event) {
      case 'recovery':
        this.sessionHealth.recoveryAttempts++;
        break;
      case 'timeout':
        this.sessionHealth.sessionTimeouts++;
        break;
      case 'conflict':
        this.sessionHealth.crossTabConflicts++;
        break;
    }

    this.sessionHealth.lastHealthCheck = now;

    // Send health degradation event if recovery attempts are high
    if (this.sessionHealth.recoveryAttempts > 3 && this.eventManager) {
      this.eventManager.track({
        type: EventType.CUSTOM,
        custom_event: {
          name: 'session_health_degraded',
          metadata: {
            ...this.sessionHealth,
            event_trigger: event,
          },
        },
      });

      if (this.sessionEndConfig.debugMode) {
        debugLog.warn(
          'SessionManager',
          `Session health degraded: ${this.sessionHealth.recoveryAttempts} recovery attempts`,
        );
      }
    }

    if (this.sessionEndConfig.debugMode) {
      debugLog.debug('SessionManager', `Session health event tracked: ${event}`);
    }
  }

  private async performSessionEnd(reason: SessionEndReason, method: 'async' | 'sync'): Promise<SessionEndResult> {
    const timestamp = Date.now();

    let eventsFlushed = 0;

    try {
      debugLog.info('SessionManager', 'Starting session end', { method, reason, timestamp });

      if (this.eventManager) {
        this.eventManager.track({
          type: EventType.SESSION_END,
          session_end_reason: reason,
        });

        eventsFlushed = this.eventManager.getQueueLength();

        const flushResult = await this.eventManager.flushImmediately();

        await this.cleanupSessionAsync();

        const result: SessionEndResult = {
          success: flushResult,
          reason,
          timestamp,
          eventsFlushed,
          method,
        };

        if (flushResult) {
          this.sessionEndStats.successfulEnds++;
        } else {
          this.sessionEndStats.failedEnds++;
        }

        return result;
      }

      await this.cleanupSessionAsync();

      const result: SessionEndResult = {
        success: true,
        reason,
        timestamp,
        eventsFlushed: 0,
        method,
      };

      this.sessionEndStats.successfulEnds++;

      return result;
    } catch (error) {
      this.sessionEndStats.failedEnds++;

      debugLog.error('SessionManager', 'Session end failed', { error, reason, method });

      await this.cleanupSessionAsync();

      return {
        success: false,
        reason,
        timestamp,
        eventsFlushed,
        method,
      };
    }
  }

  private cleanupSession(): void {
    this.endSession();
    this.clearTimers();
    this.set('sessionId', null).catch((error) => {
      debugLog.error('SessionManager', 'Failed to clear sessionId', { error });
    });
    this.set('hasStartSession', false).catch((error) => {
      debugLog.error('SessionManager', 'Failed to clear hasStartSession', { error });
    });
  }

  private async cleanupSessionAsync(): Promise<void> {
    this.endSession();
    this.clearTimers();
    await this.set('sessionId', null);
    await this.set('hasStartSession', false);
  }

  private endSessionManagedSync(reason: SessionEndReason): SessionEndResult {
    this.sessionEndStats.totalSessionEnds++;
    this.sessionEndStats.reasonCounts[reason]++;

    if (this.pendingSessionEnd) {
      this.sessionEndStats.duplicatePrevented++;

      debugLog.warn('SessionManager', 'Sync session end called while async end pending', { reason });
    }

    if (!this.shouldProceedWithSessionEnd(reason)) {
      if (this.sessionEndConfig.debugMode) {
        debugLog.debug(
          'SessionManager',
          `Sync session end skipped due to lower priority. Current: ${this.sessionEndReason}, Requested: ${reason}`,
        );
      }

      return {
        success: false,
        reason,
        timestamp: Date.now(),
        eventsFlushed: 0,
        method: 'sync',
      };
    }

    this.sessionEndReason = reason;
    this.pendingSessionEnd = true;

    try {
      return this.performSessionEndSync(reason);
    } finally {
      this.pendingSessionEnd = false;
      this.sessionEndPromise = null;
      this.sessionEndReason = null;
    }
  }

  private performSessionEndSync(reason: SessionEndReason): SessionEndResult {
    const timestamp = Date.now();

    let eventsFlushed = 0;

    try {
      if (this.eventManager) {
        this.eventManager.track({
          type: EventType.SESSION_END,
          session_end_reason: reason,
        });

        eventsFlushed = this.eventManager.getQueueLength();

        const success = this.eventManager.flushImmediatelySync();

        this.cleanupSession();

        const result: SessionEndResult = {
          success,
          reason,
          timestamp,
          eventsFlushed,
          method: 'sync',
        };

        if (success) {
          this.sessionEndStats.successfulEnds++;
        } else {
          this.sessionEndStats.failedEnds++;
        }

        return result;
      }

      this.cleanupSession();

      const result: SessionEndResult = {
        success: true,
        reason,
        timestamp,
        eventsFlushed: 0,
        method: 'sync',
      };

      this.sessionEndStats.successfulEnds++;

      return result;
    } catch (error) {
      this.sessionEndStats.failedEnds++;

      this.cleanupSession();

      debugLog.error('SessionManager', 'Sync session end failed', { error, reason });

      return {
        success: false,
        reason,
        timestamp,
        eventsFlushed,
        method: 'sync',
      };
    }
  }

  private setupPageUnloadHandlers(): void {
    let unloadHandled = false;

    const handlePageUnload = (): void => {
      if (unloadHandled || !this.get('sessionId')) {
        return;
      }

      unloadHandled = true;
      this.clearInactivityTimer();
      this.endSessionSafely('page_unload', { forceSync: true });
    };

    // Primary handler for modern browsers
    const beforeUnloadHandler = (): void => {
      handlePageUnload();
    };

    // Fallback for older browsers and mobile Safari
    const pageHideHandler = (event: PageTransitionEvent): void => {
      if (!event.persisted) {
        handlePageUnload();
      }
    };

    // Delayed handler for visibility changes (gives time for page transitions)
    const visibilityChangeHandler = (): void => {
      if (document.visibilityState === 'hidden' && this.get('sessionId') && !unloadHandled) {
        this.visibilityChangeTimeout = window.setTimeout(() => {
          if (document.visibilityState === 'hidden' && this.get('sessionId') && !unloadHandled) {
            handlePageUnload();
          }
          this.visibilityChangeTimeout = null;
        }, 1000);
      }
    };

    window.addEventListener('beforeunload', beforeUnloadHandler);
    window.addEventListener('pagehide', pageHideHandler as EventListener);
    document.addEventListener('visibilitychange', visibilityChangeHandler);

    this.cleanupHandlers.push(
      () => window.removeEventListener('beforeunload', beforeUnloadHandler),
      () => window.removeEventListener('pagehide', pageHideHandler as EventListener),
      () => document.removeEventListener('visibilitychange', visibilityChangeHandler),
      () => {
        if (this.visibilityChangeTimeout) {
          clearTimeout(this.visibilityChangeTimeout);
          this.visibilityChangeTimeout = null;
        }
      },
    );
  }
}
