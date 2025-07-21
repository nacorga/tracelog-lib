import { Base } from '../base';
import { SessionData, SessionEndTrigger } from '../types';
import { SafeLocalStorage, StorageManager } from '../utils';

interface HeartbeatData {
  sessionId: string;
  timestamp: number;
}

export class SessionHandler extends Base {
  private readonly userId: string;
  private sessionData: SessionData | undefined = undefined;
  private heartbeatInterval: number | undefined = undefined;
  private readonly storage: StorageManager;
  private readonly HEARTBEAT_INTERVAL = 30_000; // 30 seconds

  constructor(
    userId: string,
    private readonly onSessionChange: (data: SessionData) => void,
    private readonly isQaMode: () => boolean,
  ) {
    super();

    this.userId = userId;
    this.storage = new SafeLocalStorage();

    // Perform initial cleanup
    this.performMaintenanceCleanup();
  }

  private performMaintenanceCleanup(): void {
    try {
      // Remove old data periodically
      if (Math.random() < 0.1) {
        // 10% chance on initialization
        this.storage.clear();
      }

      // Check storage size and clean if needed (500KB limit)
      const storageSize = this.storage.getSize();
      if (storageSize > 500 * 1024) {
        this.storage.clear();
      }
    } catch {
      this.log('error', 'Maintenance cleanup failed');
    }
  }

  startSession(): SessionData {
    const sessionData: SessionData = {
      sessionId: this.generateSessionId(),
      startTime: Date.now(),
      lastActivity: Date.now(),
    };

    this.sessionData = sessionData;
    this.startHeartbeat();
    this.onSessionChange(sessionData);

    return sessionData;
  }

  updateActivity(): void {
    if (this.sessionData) {
      this.sessionData.lastActivity = Date.now();
      this.updateHeartbeat();
    }
  }

  endSession(trigger: SessionEndTrigger): void {
    if (this.sessionData) {
      this.sessionData.endTrigger = trigger;
      this.stopHeartbeat();
      this.onSessionChange(this.sessionData);
      this.sessionData = undefined;
    }
  }

  getCurrentSession(): SessionData | undefined {
    return this.sessionData;
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }

  private startHeartbeat(): void {
    this.updateHeartbeat();
    this.heartbeatInterval = window.setInterval(() => {
      this.updateHeartbeat();
    }, this.HEARTBEAT_INTERVAL);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
    this.clearHeartbeat();
  }

  private updateHeartbeat(): void {
    if (this.sessionData) {
      const heartbeatData: HeartbeatData = {
        sessionId: this.sessionData.sessionId,
        timestamp: Date.now(),
      };

      this.storage.set(`${this.userId}_heartbeat`, heartbeatData);
    }
  }

  private clearHeartbeat(): void {
    this.storage.remove(`${this.userId}_heartbeat`);
  }

  checkForUnexpectedSessionEnd(): boolean {
    try {
      const heartbeatData = this.storage.get(`${this.userId}_heartbeat`) as HeartbeatData | undefined;

      if (heartbeatData) {
        const timeSinceLastHeartbeat = Date.now() - heartbeatData.timestamp;

        // If more than 2 minutes since last heartbeat, session likely ended unexpectedly
        if (timeSinceLastHeartbeat > 120_000) {
          this.clearHeartbeat();

          return true;
        }
      }
    } catch {
      this.log('error', 'Error checking for unexpected session end');
    }

    return false;
  }

  cleanup(): void {
    this.stopHeartbeat();
    this.sessionData = undefined;
  }
}
