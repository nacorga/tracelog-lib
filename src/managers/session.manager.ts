import {
  DEFAULT_MOTION_THRESHOLD,
  DEFAULT_SESSION_TIMEOUT_MS,
  DEFAULT_THROTTLE_DELAY_MS,
  DEFAULT_VISIBILITY_TIMEOUT_MS,
  SESSION_END_PRIORITY_DELAY_MS,
} from '../constants';
import { DeviceType, EventType } from '../types';
import { generateUUID, getDeviceType, log, logUnknown } from '../utils';
import { SessionEndReason, SessionEndConfig, SessionEndResult, SessionEndStats } from '../types/session.types';
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
  private readonly listenerManagers: EventListenerManager[] = [];
  private readonly deviceCapabilities: DeviceCapabilities;
  private readonly onActivity: () => void;
  private readonly onInactivity: () => void;

  private isSessionActive = false;
  private lastActivityTime = 0;
  private inactivityTimer: number | null = null;
  private sessionStartTime = 0;
  private throttleTimeout: number | null = null;

  // Session End Management
  private pendingSessionEnd = false;
  private sessionEndPromise: Promise<SessionEndResult> | null = null;
  private cleanupHandlers: (() => void)[] = [];
  private readonly sessionEndConfig: SessionEndConfig;
  private sessionEndReason: SessionEndReason | null = null;
  private readonly sessionEndPriority: Record<SessionEndReason, number> = {
    page_unload: 4,
    manual_stop: 3,
    orphaned_cleanup: 2,
    inactivity: 1,
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
    },
  };

  constructor(
    onActivity: () => void,
    onInactivity: () => void,
    eventManager?: EventManager,
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
    this.deviceCapabilities = this.detectDeviceCapabilities();

    this.initializeListenerManagers();
    this.setupAllListeners();

    if (this.sessionEndConfig.enablePageUnloadHandlers) {
      this.setupPageUnloadHandlers();
    }
  }

  startSession(): string {
    this.sessionStartTime = Date.now();
    this.isSessionActive = true;
    this.lastActivityTime = Date.now();
    this.resetInactivityTimer();

    return generateUUID();
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
      this.resetInactivityTimer();
    } else {
      if (this.throttleTimeout) {
        clearTimeout(this.throttleTimeout);
      }

      this.throttleTimeout = window.setTimeout(() => {
        this.onActivity();
        this.throttleTimeout = null;
      }, 100);
    }
  };

  private readonly handleInactivity = (): void => {
    this.onInactivity();
  };

  private readonly handleVisibilityChange = (): void => {
    if (document.hidden) {
      if (this.isSessionActive) {
        if (this.inactivityTimer) {
          clearTimeout(this.inactivityTimer);
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
    }

    this.inactivityTimer = window.setTimeout(() => {
      setTimeout(() => {
        if (this.isSessionActive) {
          this.handleInactivity();
        }
      }, SESSION_END_PRIORITY_DELAY_MS);
    }, this.config.timeout);
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

  async endSessionManaged(reason: SessionEndReason): Promise<SessionEndResult> {
    this.sessionEndStats.totalSessionEnds++;
    this.sessionEndStats.reasonCounts[reason]++;

    if (this.pendingSessionEnd) {
      this.sessionEndStats.duplicatePrevented++;

      if (this.sessionEndConfig.debugMode) {
        log('info', `Session end already pending, waiting for completion. Reason: ${reason}`);
      }

      if (this.sessionEndPromise) {
        return await this.sessionEndPromise;
      }

      return {
        success: false,
        reason,
        timestamp: Date.now(),
        eventsFlushed: 0,
        method: 'async',
      };
    }

    if (!this.shouldProceedWithSessionEnd(reason)) {
      if (this.sessionEndConfig.debugMode) {
        log(
          'info',
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
    this.sessionEndPromise = this.performSessionEnd(reason, 'async');

    try {
      const result = await this.sessionEndPromise;

      return result;
    } finally {
      this.pendingSessionEnd = false;
      this.sessionEndPromise = null;
      this.sessionEndReason = null;
    }
  }

  endSessionManagedSync(reason: SessionEndReason): SessionEndResult {
    this.sessionEndStats.totalSessionEnds++;
    this.sessionEndStats.reasonCounts[reason]++;

    if (this.pendingSessionEnd) {
      this.sessionEndStats.duplicatePrevented++;

      if (this.sessionEndConfig.debugMode) {
        log('warning', `Sync session end called while async end pending. Forcing sync end. Reason: ${reason}`);
      }
    }

    if (!this.shouldProceedWithSessionEnd(reason)) {
      if (this.sessionEndConfig.debugMode) {
        log(
          'info',
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

  isPendingSessionEnd(): boolean {
    return this.pendingSessionEnd;
  }

  private async performSessionEnd(reason: SessionEndReason, method: 'async' | 'sync'): Promise<SessionEndResult> {
    const timestamp = Date.now();

    let eventsFlushed = 0;

    try {
      if (this.sessionEndConfig.debugMode) {
        log('info', `Starting ${method} session end. Reason: ${reason}`);
      }

      if (this.eventManager) {
        this.eventManager.track({
          type: EventType.SESSION_END,
          session_end_reason: reason,
        });

        eventsFlushed = this.eventManager.getQueueLength();

        const flushResult = await this.eventManager.flushImmediately();

        this.endSession();
        this.set('sessionId', null);
        this.set('hasStartSession', false);

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

      if (this.sessionEndConfig.debugMode) {
        logUnknown('error', 'Session end failed', error);
      }

      return {
        success: false,
        reason,
        timestamp,
        eventsFlushed,
        method,
      };
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

        this.endSession();
        this.set('sessionId', null);
        this.set('hasStartSession', false);

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

      const result: SessionEndResult = {
        success: true,
        reason,
        timestamp,
        eventsFlushed: 0,
        method: 'sync',
      };

      this.sessionEndStats.successfulEnds++;

      return result;
    } catch {
      this.sessionEndStats.failedEnds++;

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
      this.endSessionManagedSync('page_unload');
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
        setTimeout(() => {
          if (document.visibilityState === 'hidden' && this.get('sessionId') && !unloadHandled) {
            handlePageUnload();
          }
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
    );
  }
}
