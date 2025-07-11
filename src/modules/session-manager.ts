import { LSKey, DEFAULT_SAMPLING_RATE, DeviceType } from '../constants';
import { IdManager } from './id-manager';
import { MetadataType, TracelogConfig, EventType } from '../types';
import { getDeviceType } from '../utils/device-detector';
import { isValidMetadata } from '../utils/event-check';
import { SessionHandler, SessionData, SessionEndTrigger } from '../events/session-handler';

export class SessionManager {
  private userId: string | undefined;
  private tempUserId: string | null = null;
  private readonly device: DeviceType | undefined;
  private globalMetadata: Record<string, MetadataType> | undefined;
  private readonly sessionHandler: SessionHandler;
  private sessionEndSent = false;
  private pageUnloading = false;

  constructor(
    private readonly config: TracelogConfig,
    private readonly sendSessionEvent: (eventType: EventType, trigger?: string) => void,
    private readonly isQaMode: () => boolean,
  ) {
    this.userId = this.getUserId();
    this.device = getDeviceType();

    // Initialize session handler
    this.sessionHandler = new SessionHandler(this.userId, this.handleSessionData.bind(this), this.isQaMode);
  }

  initialize(): void {
    this.validateGlobalMetadata();
  }

  // Getters
  getUserId(): string {
    if (this.userId) return this.userId;

    try {
      const storedId = window.localStorage.getItem(LSKey.UserId);

      if (storedId) {
        this.userId = storedId;
        return storedId;
      }

      const newId = IdManager.create();
      window.localStorage.setItem(LSKey.UserId, newId);
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

  // State management
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
      console.log(`[TraceLog] Page unloading state changed: ${isUnloading}`);
    }
  }

  // Session lifecycle management
  startSession(): void {
    // Reset session end flag when starting new session
    this.sessionEndSent = false;
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

    // Mark that session end will be sent
    this.sessionEndSent = true;
    this.sessionHandler.endSession(sessionTrigger);
  }

  handleInactivity(isInactive: boolean): void {
    if (!isInactive) {
      this.sessionHandler.updateActivity();
    }
  }

  // Sampling
  isSampledUser(): boolean {
    const rate = this.config?.qaMode ? 1 : this.config?.samplingRate || DEFAULT_SAMPLING_RATE;

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

  private handleSessionData(sessionData: SessionData): void {
    // Determine event type based on session data
    const eventType: EventType = sessionData.endTrigger ? EventType.SESSION_END : EventType.SESSION_START;

    // Map trigger to string for backward compatibility
    let triggerString: string | undefined;
    if (sessionData.endTrigger) {
      triggerString = sessionData.endTrigger;
    }

    this.sendSessionEvent(eventType, triggerString);
  }

  private validateGlobalMetadata(): void {
    if (Object.keys(this.config?.globalMetadata || {}).length > 0) {
      const { valid, error } = isValidMetadata('globalMetadata', this.config!.globalMetadata || {});

      if (valid) {
        this.globalMetadata = this.config!.globalMetadata;
      } else if (this.isQaMode()) {
        console.error(
          `TraceLog error: globalMetadata object validation failed (${error || 'unknown error'}). Please, review your data and try again.`,
        );
      }
    }
  }

  // Cleanup
  cleanup(): void {
    this.sessionHandler?.cleanup();
  }
}
