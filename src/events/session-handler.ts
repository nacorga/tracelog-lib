import { SessionData, SessionEndTrigger } from '../types';

interface HeartbeatData {
  sessionId: string;
  timestamp: number;
}

interface StorageManager {
  set(key: string, value: unknown): boolean;
  get(key: string): unknown;
  remove(key: string): boolean;
  isAvailable(): boolean;
  clear(): void;
  getSize(): number;
}

class SafeLocalStorage implements StorageManager {
  private readonly available: boolean;
  private readonly memoryFallback: Map<string, string> = new Map();

  constructor() {
    this.available = this.checkAvailability();
  }

  private checkAvailability(): boolean {
    try {
      const testKey = '__tracelog_test__';
      window.localStorage.setItem(testKey, 'test');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      console.warn('[TraceLog] localStorage not available, using memory fallback');
      return false;
    }
  }

  set(key: string, value: unknown): boolean {
    try {
      const serialized = JSON.stringify(value);

      if (this.available) {
        // Check available space before writing
        const estimatedSize = serialized.length + key.length;

        if (estimatedSize > 1024 * 1024) {
          // 1MB limit
          console.warn('[TraceLog] Data too large for localStorage, using memory fallback');
          this.memoryFallback.set(key, serialized);
          return true;
        }

        window.localStorage.setItem(key, serialized);
        return true;
      } else {
        this.memoryFallback.set(key, serialized);
        return true;
      }
    } catch {
      // Storage quota exceeded or other error
      console.warn('[TraceLog] localStorage write failed');

      if (this.available) {
        this.cleanup();
        try {
          window.localStorage.setItem(key, JSON.stringify(value));
        } catch {
          this.memoryFallback.set(key, JSON.stringify(value));
        }
      } else {
        this.memoryFallback.set(key, JSON.stringify(value));
      }
      return true;
    }
  }

  get(key: string): unknown {
    try {
      let serialized: string | undefined = undefined;

      if (this.available) {
        serialized = window.localStorage.getItem(key) ?? undefined;
      }

      if (!serialized) {
        serialized = this.memoryFallback.get(key) ?? undefined;
      }

      return serialized ? JSON.parse(serialized) : undefined;
    } catch {
      console.warn('[TraceLog] localStorage read failed');
      return undefined;
    }
  }

  remove(key: string): boolean {
    try {
      if (this.available) {
        window.localStorage.removeItem(key);
      }
      this.memoryFallback.delete(key);
      return true;
    } catch {
      console.warn('[TraceLog] localStorage remove failed');
      return false;
    }
  }

  isAvailable(): boolean {
    return this.available;
  }

  clear(): void {
    try {
      if (this.available) {
        // Only clear TraceLog keys
        const keys = Object.keys(window.localStorage);

        for (const key of keys) {
          if (key.startsWith('tracelog_') || key.includes('_critical_events') || key.includes('_heartbeat')) {
            window.localStorage.removeItem(key);
          }
        }
      }

      this.memoryFallback.clear();
    } catch {
      console.warn('[TraceLog] localStorage clear failed');
    }
  }

  getSize(): number {
    try {
      if (this.available) {
        let size = 0;

        for (const key in window.localStorage) {
          if (key.startsWith('tracelog_') || key.includes('_critical_events') || key.includes('_heartbeat')) {
            size += window.localStorage.getItem(key)?.length || 0;
          }
        }

        return size;
      }

      let size = 0;

      for (const value of this.memoryFallback.values()) {
        size += value.length;
      }

      return size;
    } catch {
      return 0;
    }
  }

  private cleanup(): void {
    try {
      if (!this.available) return;

      // Remove old heartbeat data (older than 24 hours)
      const cutoffTime = Date.now() - 24 * 60 * 60 * 1000;
      const keys = Object.keys(window.localStorage);

      for (const key of keys) {
        if (key.includes('_heartbeat') || key.includes('_critical_events')) {
          try {
            const data = JSON.parse(window.localStorage.getItem(key) || '{}');

            if (data.timestamp && data.timestamp < cutoffTime) {
              window.localStorage.removeItem(key);
            }
          } catch {
            // Invalid data, remove it
            window.localStorage.removeItem(key);
          }
        }
      }
    } catch {
      console.warn('[TraceLog] localStorage cleanup failed');
    }
  }
}

export class SessionHandler {
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

      // Check storage size and clean if needed
      const storageSize = this.storage.getSize();
      if (storageSize > 500 * 1024) {
        // 500KB limit
        this.storage.clear();
        if (this.isQaMode()) {
          console.log('[TraceLog] Performed storage cleanup due to size limit');
        }
      }
    } catch {
      console.warn('[TraceLog] Maintenance cleanup failed');
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

      if (this.isQaMode()) {
        console.log('[TraceLog] Session ended:', this.sessionData.sessionId, 'trigger:', trigger);
      }

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

          if (this.isQaMode()) {
            console.log('[TraceLog] Detected unexpected session end from previous session');
          }

          return true;
        }
      }
    } catch {
      // Ignore storage errors
      console.warn('[TraceLog] Error checking for unexpected session end');
    }

    return false;
  }

  cleanup(): void {
    this.stopHeartbeat();
    this.sessionData = undefined;
  }
}
