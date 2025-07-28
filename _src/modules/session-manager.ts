import { DEFAULT_SAMPLING_RATE, DEFAULT_CONFIG } from '../constants';
import { MetadataType, Config, EventType, SessionData, SessionEndTrigger, DeviceType, StorageKey } from '../types';
import { getDeviceType, isValidMetadata } from '../utils';
import { SessionHandler } from '../events';
import { IdManager } from './id-manager';
import { log } from '../utils/logger';

export class SessionManager {
  private userId: string | undefined;
  private tempUserId: string | null = null;
  private readonly device: DeviceType | undefined;
  private globalMetadata: Record<string, MetadataType> | undefined;
  private readonly sessionHandler: SessionHandler;
  private sessionEndSent = false;
  private pageUnloading = false;
  private paused = false;
  private started = false;

  constructor(
    private readonly config: Config,
    private readonly sendSessionEvent: (eventType: EventType, trigger?: string) => void,
    private readonly isQaMode: () => boolean,
  ) {
    this.userId = this.getUserId();
    this.device = getDeviceType();
    this.sessionHandler = new SessionHandler(this.userId, this.handleSessionData, this.isQaMode);
  }

  initialize(): void {
    this.validateGlobalMetadata();
  }

  getUserId(): string {
    if (this.userId) return this.userId;

    try {
      const storedId = window.localStorage.getItem(StorageKey.UserId);

      if (storedId) {
        this.userId = storedId;
        return storedId;
      }

      const newId = IdManager.create();

      window.localStorage.setItem(StorageKey.UserId, newId);

      this.userId = newId;

      return newId;
    } catch {
      if (this.tempUserId) {
        return this.tempUserId;
      }

      const newId = IdManager.create();

      this.tempUserId = newId;

      return newId;
    }
  }

  getSessionId(): string {
    const session = this.sessionHandler.getCurrentSession();
    return session?.sessionId || '';
  }

  getDevice(): DeviceType | undefined {
    return this.device;
  }

  getGlobalMetadata(): Record<string, MetadataType> | undefined {
    return this.globalMetadata;
  }

  isUserInactive(): boolean {
    const session = this.sessionHandler.getCurrentSession();
    return !session;
  }

  hasSessionEnded(): boolean {
    const session = this.sessionHandler.getCurrentSession();
    return !session;
  }

  isSessionEndSent(): boolean {
    return this.sessionEndSent;
  }

  isPageCurrentlyUnloading(): boolean {
    return this.pageUnloading;
  }

  setPageUnloading(isUnloading: boolean): void {
    this.pageUnloading = isUnloading;

    if (this.isQaMode()) {
      log('info', `Page unloading state changed: ${isUnloading}`);
    }
  }

  startSession(): void {
    this.sessionEndSent = false;
    this.paused = false;
    this.started = true;
    this.sessionHandler.startSession();
  }

  endSession(trigger?: string): void {
    let sessionTrigger: SessionEndTrigger = 'manual';

    switch (trigger) {
      case 'page_unload': {
        sessionTrigger = 'page_unload';
        break;
      }
      case 'unexpected_recovery': {
        sessionTrigger = 'unexpected_recovery';
        break;
      }
      case 'timeout': {
        sessionTrigger = 'timeout';
        break;
      }
      default: {
        sessionTrigger = 'manual';
      }
    }

    this.sessionEndSent = true;
    this.sessionHandler.endSession(sessionTrigger);
    this.started = false;
    this.paused = false;
  }

  handleInactivity(isInactive: boolean): void {
    if (!isInactive) {
      this.sessionHandler.updateActivity();
    }
  }

  pauseSession(): void {
    if (!this.started || this.paused) {
      return;
    }

    this.paused = true;
    this.sessionHandler.updateActivity();
  }

  resumeSession(): void {
    if (!this.started || !this.paused) {
      return;
    }

    const session = this.sessionHandler.getCurrentSession();
    const timeout = this.config.sessionTimeout ?? DEFAULT_CONFIG.sessionTimeout ?? 15 * 60 * 1000;

    if (session && Date.now() - session.lastActivity > timeout) {
      this.endSession('timeout');
      this.startSession();
    } else {
      this.paused = false;
      this.sessionHandler.updateActivity();
    }
  }

  hasSessionStarted(): boolean {
    return this.started;
  }

  isPaused(): boolean {
    return this.paused;
  }

  isSampledUser(): boolean {
    const rate = this.config?.qaMode ? 1 : (this.config?.samplingRate ?? DEFAULT_SAMPLING_RATE);

    if (rate >= 1) {
      return true;
    }

    if (rate <= 0) {
      return false;
    }

    const userId = this.getUserId();
    const hex = userId.replaceAll('-', '');
    const last6 = hex.slice(-6);
    const hash = Number.parseInt(last6, 16) / 0xff_ff_ff;

    return hash < rate;
  }

  checkForUnexpectedSessionEnd(): boolean {
    return this.sessionHandler.checkForUnexpectedSessionEnd();
  }

  private readonly handleSessionData = (sessionData: SessionData): void => {
    const eventType: EventType = sessionData.endTrigger ? EventType.SESSION_END : EventType.SESSION_START;

    let triggerString: string | undefined;

    if (sessionData.endTrigger) {
      triggerString = sessionData.endTrigger;
    }

    this.sendSessionEvent(eventType, triggerString);
  };

  private validateGlobalMetadata(): void {
    if (Object.keys(this.config?.globalMetadata || {}).length > 0) {
      const validationResult = isValidMetadata('globalMetadata', this.config!.globalMetadata || {});

      if (validationResult.valid) {
        this.globalMetadata = validationResult.sanitizedMetadata;
      } else {
        log(
          'error',
          `globalMetadata object validation failed (${validationResult.error || 'unknown error'}). Please, review your data and try again.`,
        );
      }
    }
  }

  cleanup(): void {
    this.sessionHandler?.cleanup();
    this.started = false;
    this.paused = false;
  }
}
