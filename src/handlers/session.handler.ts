import { EventManager } from '../services/event-manager';
import { SessionManager } from '../services/session-manager';
import { StateManager } from '../services/state-manager';
import { EventType } from '../types/event.types';

const SESSION_TIMEOUT_MIN_MS = 30_000;

export class SessionHandler extends StateManager {
  private readonly eventManager: EventManager;

  private sessionManager: SessionManager | null = null;

  constructor(eventManager: EventManager) {
    super();

    this.eventManager = eventManager;
  }

  startTracking(): void {
    if (this.sessionManager) {
      return;
    }

    const onActivity = (): void => {
      if (this.get('sessionId')) {
        return;
      }

      const newSessionId = this.sessionManager!.startSession();
      this.set('sessionId', newSessionId);
      this.trackSession(EventType.SESSION_START);
    };

    const onInactivity = (): void => {
      if (!this.get('sessionId')) {
        return;
      }

      this.sessionManager!.endSession();
      this.trackSession(EventType.SESSION_END);
      this.set('sessionId', null);
    };

    this.sessionManager = new SessionManager(
      this.get('config')?.sessionTimeout ?? SESSION_TIMEOUT_MIN_MS,
      onActivity,
      onInactivity,
    );
  }

  private trackSession(eventType: EventType.SESSION_START | EventType.SESSION_END): void {
    this.eventManager.track({
      type: eventType,
    });
  }

  stopTracking(): void {
    if (this.sessionManager && this.get('sessionId')) {
      this.sessionManager.endSession();
      this.trackSession(EventType.SESSION_END);
      this.set('sessionId', null);
    }
  }
}
