import { generateUUID } from '../utils/uuid.utils';

export class SessionManager {
  private readonly sessionTimeout: number;
  private readonly onActivity: () => void;
  private readonly onInactivity: () => void;

  private isSessionActive = false;
  private inactivityTimer: number | null = null;
  private sessionStartTime: number;

  constructor(sessionTimeout: number, onActivity: () => void, onInactivity: () => void) {
    this.sessionTimeout = sessionTimeout;
    this.onActivity = onActivity;
    this.onInactivity = onInactivity;
    this.sessionStartTime = 0;
    this.setupActivityListeners();
  }

  startSession(): string {
    this.sessionStartTime = Date.now();
    this.isSessionActive = true;
    this.resetInactivityTimer();

    return generateUUID();
  }

  endSession(sessionId: string): void {
    if (this.sessionStartTime === 0) {
      return;
    }

    const durationMs = Date.now() - this.sessionStartTime;

    console.log('Session ended', { sessionId, durationMs });

    this.sessionStartTime = 0;
    this.isSessionActive = false;

    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }

  private readonly handleActivity = (): void => {
    if (this.isSessionActive) {
      this.resetInactivityTimer();
    } else {
      this.onActivity();
    }
  };

  private readonly handleInactivity = (): void => {
    this.onInactivity();
  };

  private readonly resetInactivityTimer = (): void => {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }

    this.inactivityTimer = window.setTimeout(this.handleInactivity, this.sessionTimeout);
  };

  private setupActivityListeners(): void {
    const options = { passive: true };

    window.addEventListener('mousemove', this.handleActivity, options);
    window.addEventListener('keydown', this.handleActivity, options);
    window.addEventListener('scroll', this.handleActivity, options);
    window.addEventListener('click', this.handleActivity, options);
  }
}
