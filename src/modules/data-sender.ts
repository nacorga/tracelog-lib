import { RETRY_BACKOFF_INITIAL, RETRY_BACKOFF_MAX } from '../constants';
import { Queue, AdminError, EventType, StorageKey } from '../types';

interface StorageManager {
  set(key: string, value: unknown): boolean;
  get(key: string): unknown;
  remove(key: string): boolean;
  isAvailable(): boolean;
  clear(): void;
  getSize(): number;
}

class OptimizedStorage implements StorageManager {
  private readonly available: boolean;
  private readonly memoryFallback: Map<string, string> = new Map();

  constructor() {
    this.available = this.checkAvailability();
  }

  private checkAvailability(): boolean {
    try {
      const testKey = '__tracelog_storage_test__';
      window.localStorage.setItem(testKey, 'test');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  set(key: string, value: unknown): boolean {
    try {
      const serialized = JSON.stringify(value);

      if (this.available) {
        // Check storage quota
        const estimatedSize = serialized.length + key.length;
        if (estimatedSize > 2 * 1024 * 1024) {
          // 2MB limit
          console.warn('[TraceLog] Data too large for storage');
          return false;
        }

        window.localStorage.setItem(key, serialized);
        return true;
      } else {
        // Use memory fallback with size limit
        if (this.memoryFallback.size > 100) {
          // Limit memory usage
          const firstKey = this.memoryFallback.keys().next().value;
          if (firstKey) {
            this.memoryFallback.delete(firstKey);
          }
        }

        this.memoryFallback.set(key, serialized);
        return true;
      }
    } catch (error) {
      if (error instanceof DOMException && error.code === 22) {
        // Storage quota exceeded
        this.performEmergencyCleanup();
        try {
          if (this.available) {
            window.localStorage.setItem(key, JSON.stringify(value));
          } else {
            this.memoryFallback.set(key, JSON.stringify(value));
          }
          return true;
        } catch (retryError) {
          console.error('[TraceLog] Storage write failed even after cleanup:', retryError);
          return false;
        }
      }

      console.warn('[TraceLog] Storage write failed:', error);
      return false;
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
    } catch (error) {
      console.warn('[TraceLog] Storage read failed:', error);
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
    } catch (error) {
      console.warn('[TraceLog] Storage remove failed:', error);
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
    } catch (error) {
      console.warn('[TraceLog] Storage clear failed:', error);
    }
  }

  getSize(): number {
    try {
      if (this.available) {
        let size = 0;
        for (const key in window.localStorage) {
          if (key.startsWith('tracelog_') || key.includes('_critical_events') || key.includes('_heartbeat')) {
            const item = window.localStorage.getItem(key);
            size += item ? item.length : 0;
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

  private performEmergencyCleanup(): void {
    try {
      if (!this.available) return;

      // Remove old data first
      const cutoffTime = Date.now() - 12 * 60 * 60 * 1000; // 12 hours
      const keys = Object.keys(window.localStorage);

      for (const key of keys) {
        if (key.includes('_critical_events') || key.includes('_heartbeat')) {
          try {
            const data = JSON.parse(window.localStorage.getItem(key) || '{}');
            if (data.timestamp && data.timestamp < cutoffTime) {
              window.localStorage.removeItem(key);
            }
          } catch {
            window.localStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.warn('[TraceLog] Emergency cleanup failed:', error);
    }
  }
}

export class DataSender {
  private retryDelay: number = RETRY_BACKOFF_INITIAL;
  private retryTimeoutId: number | null = null;
  private readonly storage: StorageManager;
  private lastSendAttempt = 0;
  private sendAttempts = 0;

  constructor(
    private readonly apiUrl: string,
    private readonly isQaMode: () => boolean,
    private readonly getUserId: () => string,
    private readonly isDemoMode = false,
  ) {
    this.storage = new OptimizedStorage();
  }

  async sendEventsQueue(body: Queue): Promise<boolean> {
    if (this.isDemoMode) {
      for (const event of body.events) {
        console.log(`[TraceLog] ${event.type} event:`, JSON.stringify(event));
      }

      return true;
    }

    const now = Date.now();

    // Rate limiting: prevent too frequent sends
    if (now - this.lastSendAttempt < 1000) {
      return false;
    }

    this.lastSendAttempt = now;
    this.sendAttempts++;

    const isSendSuccess = await this.collectEventsQueue(body);

    if (isSendSuccess) {
      this.retryDelay = RETRY_BACKOFF_INITIAL;
      this.sendAttempts = 0;
      this.clearRetryTimeout();
      this.clearPersistedEvents();
      return true;
    } else {
      // If there are critical events and sending failed, try different approach
      const hasCriticalEvents = body.events.some(
        (event) => event.type === EventType.SESSION_END || event.type === EventType.SESSION_START,
      );

      if (hasCriticalEvents) {
        await this.forceImmediateSend(body);
      } else {
        this.scheduleRetry(body);
      }
      return false;
    }
  }

  async sendEventsSynchronously(body: Queue): Promise<boolean> {
    // Handle demo mode - log events to console instead of sending to API
    if (this.isDemoMode) {
      for (const event of body.events) {
        console.log(`[TraceLog] ${event.type} event:`, JSON.stringify(event));
      }
      return true; // Always return success for demo mode
    }

    const blob = new Blob([JSON.stringify(body)], { type: 'application/json' });

    // Usar sendBeacon que es la opción más confiable para unload
    if (navigator.sendBeacon) {
      const success = navigator.sendBeacon(this.apiUrl, blob);

      if (this.isQaMode()) {
        console.log(`[TraceLog] Synchronous send via sendBeacon: ${success ? 'SUCCESS' : 'FAILED'}`);
      }

      if (success) {
        this.clearPersistedEvents();
      }

      return success;
    }

    // Fallback para navegadores sin sendBeacon (muy raro)
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', this.apiUrl, false); // false = synchronous
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(body));

      const success = xhr.status >= 200 && xhr.status < 300;

      if (this.isQaMode()) {
        console.log(`[TraceLog] Synchronous send via XHR: ${success ? 'SUCCESS' : 'FAILED'}`);
      }

      if (success) {
        this.clearPersistedEvents();
      }

      return success;
    } catch (error) {
      if (this.isQaMode()) {
        console.error('[TraceLog] Synchronous send failed:', error);
      }

      return false;
    }
  }

  private async collectEventsQueue(body: Queue): Promise<boolean> {
    const blob = new Blob([JSON.stringify(body)], { type: 'application/json' });

    if (navigator.sendBeacon) {
      const ok = navigator.sendBeacon(this.apiUrl, blob);

      if (ok) {
        return true;
      }
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        body: blob,
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
      });

      return response.status >= 200 && response.status < 300;
    } catch (error) {
      if (this.isQaMode()) {
        console.error(
          'TraceLog error: failed to send events queue',
          error instanceof Error ? error.message : 'Unknown error',
        );
      }

      return false;
    }
  }

  private async forceImmediateSend(body: Queue): Promise<void> {
    const blob = new Blob([JSON.stringify(body)], { type: 'application/json' });

    // Intentar sendBeacon nuevamente
    if (navigator.sendBeacon) {
      const success = navigator.sendBeacon(this.apiUrl, blob);
      if (success) {
        this.clearPersistedEvents();
        return;
      }
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        body: blob,
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status >= 200 && response.status < 300) {
        this.clearPersistedEvents();
      } else {
        this.persistCriticalEvents(body);
        this.scheduleRetry(body);
      }
    } catch (error) {
      this.persistCriticalEvents(body);
      this.scheduleRetry(body);

      if (this.isQaMode()) {
        console.error(
          'TraceLog error: failed to force send critical events, persisting to localStorage',
          error instanceof Error ? error.message : 'Unknown error',
        );
      }
    }
  }

  persistCriticalEvents(body: Queue): void {
    try {
      const criticalEvents = body.events.filter(
        (event) => event.type === EventType.SESSION_END || event.type === EventType.SESSION_START,
      );

      if (criticalEvents.length > 0) {
        const persistedData = {
          userId: body.user_id,
          sessionId: body.session_id,
          device: body.device,
          events: criticalEvents,
          timestamp: Date.now(),
          ...(body.global_metadata && { global_metadata: body.global_metadata }),
        };

        window.localStorage.setItem(`${StorageKey.UserId}_critical_events`, JSON.stringify(persistedData));

        if (this.isQaMode()) {
          console.log('[TraceLog] Critical events persisted to localStorage');
        }
      }
    } catch (error) {
      if (this.isQaMode()) {
        console.error('[TraceLog] Failed to persist critical events:', error);
      }
    }
  }

  clearPersistedEvents(): void {
    try {
      window.localStorage.removeItem(`${StorageKey.UserId}_critical_events`);
    } catch {
      // Ignore errors when clearing localStorage
    }
  }

  async recoverPersistedEvents(): Promise<void> {
    try {
      const persistedData = window.localStorage.getItem(`${StorageKey.UserId}_critical_events`);

      if (persistedData) {
        const data = JSON.parse(persistedData);

        // Only try to recover if the events are recent (less than 24 hours)
        const isRecent = Date.now() - data.timestamp < 24 * 60 * 60 * 1000;

        if (isRecent && data.events.length > 0) {
          const recoveryBody: Queue = {
            user_id: data.userId,
            session_id: data.sessionId,
            device: data.device,
            events: data.events,
            ...(data.global_metadata && { global_metadata: data.global_metadata }),
          };

          const success = await this.collectEventsQueue(recoveryBody);

          if (success) {
            this.clearPersistedEvents();

            if (this.isQaMode()) {
              console.log('[TraceLog] Successfully recovered and sent persisted critical events');
            }
          }
        } else {
          this.clearPersistedEvents();
        }
      }
    } catch (error) {
      if (this.isQaMode()) {
        console.error('[TraceLog] Failed to recover persisted events:', error);
      }
    }
  }

  async sendError(error: AdminError): Promise<void> {
    if (this.isDemoMode) {
      console.error(error.message);
      return;
    }

    const blob = new Blob([JSON.stringify(error)], { type: 'application/json' });

    if (navigator.sendBeacon) {
      const ok = navigator.sendBeacon(`${this.apiUrl}/error`, blob);

      if (ok) {
        return;
      }
    }

    try {
      await fetch(`${this.apiUrl}/error`, {
        method: 'POST',
        body: blob,
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      if (this.isQaMode()) {
        console.error('TraceLog error: failed to send error', error instanceof Error ? error.message : 'Unknown error');
      }
    }

    if (this.isQaMode()) {
      console.error(error.message);
    }
  }

  private scheduleRetry(body: Queue): void {
    if (this.retryTimeoutId !== null) {
      return;
    }

    this.retryTimeoutId = window.setTimeout(() => {
      this.retryTimeoutId = null;
      this.sendEventsQueue(body);
    }, this.retryDelay);

    this.retryDelay = Math.min(this.retryDelay * 2, RETRY_BACKOFF_MAX);
  }

  private clearRetryTimeout(): void {
    if (this.retryTimeoutId !== null) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }
  }

  cleanup(): void {
    this.clearRetryTimeout();
  }
}
