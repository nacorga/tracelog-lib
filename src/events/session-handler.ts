import { LSKey } from '../constants';

export interface SessionData {
  sessionId: string;
  startTime: number;
  lastActivity: number;
  endTrigger?: string;
}

export type SessionEndTrigger = 'timeout' | 'manual' | 'page_unload' | 'unexpected_recovery';

interface HeartbeatData {
  sessionId: string;
  timestamp: number;
}

interface StorageManager {
  set(key: string, value: any): boolean;
  get(key: string): any;
  remove(key: string): boolean;
  isAvailable(): boolean;
  clear(): void;
  getSize(): number;
}

class SafeLocalStorage implements StorageManager {
  private available: boolean;
  private memoryFallback: Map<string, string> = new Map();

  constructor() {
    this.available = this.checkAvailability();
  }

  private checkAvailability(): boolean {
    try {
      const testKey = '__tracelog_test__';
      window.localStorage.setItem(testKey, 'test');
      window.localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      console.warn('[TraceLog] localStorage not available, using memory fallback');
      return false;
    }
  }

  set(key: string, value: any): boolean {
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
    } catch (error) {
      // Storage quota exceeded or other error
      console.warn('[TraceLog] localStorage write failed:', error);

      if (error instanceof DOMException && error.code === 22) {
        // Storage quota exceeded
        this.cleanup();
        try {
          if (this.available) {
            window.localStorage.setItem(key, JSON.stringify(value));
          } else {
            this.memoryFallback.set(key, JSON.stringify(value));
          }
          return true;
        } catch (retryError) {
          this.memoryFallback.set(key, JSON.stringify(value));
          return true;
        }
      }

      return false;
    }
  }

  get(key: string): any {
    try {
      let serialized: string | null = null;

      if (this.available) {
        serialized = window.localStorage.getItem(key);
      }

      if (!serialized) {
        serialized = this.memoryFallback.get(key) || null;
      }

      return serialized ? JSON.parse(serialized) : null;
    } catch (error) {
      console.warn('[TraceLog] localStorage read failed:', error);
      return null;
    }
  }

  remove(key: string): boolean {
    try {
      if (this.available) {
        window.localStorage.removeItem(key);
      }
      this.memoryFallback.delete(key);
      return true;
    } catch (error) {
      console.warn('[TraceLog] localStorage remove failed:', error);
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
        keys.forEach((key) => {
          if (key.startsWith('tracelog_') || key.includes('_critical_events') || key.includes('_heartbeat')) {
            window.localStorage.removeItem(key);
          }
        });
      }
      this.memoryFallback.clear();
    } catch (error) {
      console.warn('[TraceLog] localStorage clear failed:', error);
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
      this.memoryFallback.forEach((value) => {
        size += value.length;
      });
      return size;
    } catch (error) {
      return 0;
    }
  }

  private cleanup(): void {
    try {
      if (!this.available) return;

      // Remove old heartbeat data (older than 24 hours)
      const cutoffTime = Date.now() - 24 * 60 * 60 * 1000;
      const keys = Object.keys(window.localStorage);

      keys.forEach((key) => {
        if (key.includes('_heartbeat') || key.includes('_critical_events')) {
          try {
            const data = JSON.parse(window.localStorage.getItem(key) || '{}');
            if (data.timestamp && data.timestamp < cutoffTime) {
              window.localStorage.removeItem(key);
            }
          } catch (error) {
            // Invalid data, remove it
            window.localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn('[TraceLog] localStorage cleanup failed:', error);
    }
  }
}

export class SessionHandler {
  private userId: string;
  private sessionData: SessionData | null = null;
  private heartbeatInterval: number | null = null;
  private storage: StorageManager;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds

  constructor(
    userId: string,
    private onSessionChange: (data: SessionData) => void,
    private isQaMode: () => boolean,
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
    } catch (error) {
      console.warn('[TraceLog] Maintenance cleanup failed:', error);
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

    if (this.isQaMode()) {
      console.log('[TraceLog] Session started:', sessionData.sessionId);
    }

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

      this.sessionData = null;
    }
  }

  getCurrentSession(): SessionData | null {
    return this.sessionData;
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
      this.heartbeatInterval = null;
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
      const heartbeatData = this.storage.get(`${this.userId}_heartbeat`);

      if (heartbeatData) {
        const timeSinceLastHeartbeat = Date.now() - heartbeatData.timestamp;

        // If more than 2 minutes since last heartbeat, session likely ended unexpectedly
        if (timeSinceLastHeartbeat > 120000) {
          this.clearHeartbeat();

          if (this.isQaMode()) {
            console.log('[TraceLog] Detected unexpected session end from previous session');
          }

          return true;
        }
      }
    } catch (error) {
      // Ignore storage errors
      console.warn('[TraceLog] Error checking for unexpected session end:', error);
    }

    return false;
  }

  cleanup(): void {
    this.stopHeartbeat();
    this.sessionData = null;
  }
}
