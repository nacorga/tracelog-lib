import { RETRY_BACKOFF_INITIAL, RETRY_BACKOFF_MAX, LSKey, DeviceType } from '../constants';
import { TracelogQueue, TracelogAdminError, TracelogEvent, EventType, MetadataType } from '../types';

interface StorageManager {
  set(key: string, value: any): boolean;
  get(key: string): any;
  remove(key: string): boolean;
  isAvailable(): boolean;
  clear(): void;
  getSize(): number;
}

class OptimizedStorage implements StorageManager {
  private available: boolean;
  private memoryFallback: Map<string, string> = new Map();
  private compressionEnabled: boolean;

  constructor() {
    this.available = this.checkAvailability();
    this.compressionEnabled = this.checkCompressionSupport();
  }

  private checkAvailability(): boolean {
    try {
      const testKey = '__tracelog_storage_test__';
      window.localStorage.setItem(testKey, 'test');
      window.localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  private checkCompressionSupport(): boolean {
    return typeof window !== 'undefined' && 'CompressionStream' in window;
  }

  // Compression disabled due to browser compatibility issues
  private async compress(data: string): Promise<string> {
    return data;
  }

  set(key: string, value: any): boolean {
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
      console.warn('[TraceLog] Storage read failed:', error);
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
        keys.forEach((key) => {
          if (key.startsWith('tracelog_') || key.includes('_critical_events') || key.includes('_heartbeat')) {
            window.localStorage.removeItem(key);
          }
        });
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
      this.memoryFallback.forEach((value) => {
        size += value.length;
      });
      return size;
    } catch (error) {
      return 0;
    }
  }

  private performEmergencyCleanup(): void {
    try {
      if (!this.available) return;

      // Remove old data first
      const cutoffTime = Date.now() - 12 * 60 * 60 * 1000; // 12 hours
      const keys = Object.keys(window.localStorage);

      keys.forEach((key) => {
        if (key.includes('_critical_events') || key.includes('_heartbeat')) {
          try {
            const data = JSON.parse(window.localStorage.getItem(key) || '{}');
            if (data.timestamp && data.timestamp < cutoffTime) {
              window.localStorage.removeItem(key);
            }
          } catch (error) {
            window.localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn('[TraceLog] Emergency cleanup failed:', error);
    }
  }
}

export class DataSender {
  private retryDelay: number = RETRY_BACKOFF_INITIAL;
  private retryTimeoutId: number | null = null;
  private storage: StorageManager;
  private lastSendAttempt: number = 0;
  private sendAttempts: number = 0;

  constructor(
    private apiUrl: string,
    private isQaMode: () => boolean,
    private getUserId: () => string,
  ) {
    this.storage = new OptimizedStorage();
  }

  async sendEventsQueue(body: TracelogQueue): Promise<boolean> {
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

  async sendEventsSynchronously(body: TracelogQueue): Promise<boolean> {
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
    } catch (err) {
      if (this.isQaMode()) {
        console.error('[TraceLog] Synchronous send failed:', err);
      }

      return false;
    }
  }

  private async collectEventsQueue(body: TracelogQueue): Promise<boolean> {
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
    } catch (err) {
      if (this.isQaMode()) {
        console.error(
          'TraceLog error: failed to send events queue',
          err instanceof Error ? err.message : 'Unknown error',
        );
      }

      return false;
    }
  }

  private async forceImmediateSend(body: TracelogQueue): Promise<void> {
    const blob = new Blob([JSON.stringify(body)], { type: 'application/json' });

    // Intentar sendBeacon nuevamente
    if (navigator.sendBeacon) {
      const success = navigator.sendBeacon(this.apiUrl, blob);
      if (success) {
        this.clearPersistedEvents();
        return;
      }
    }

    // Fallback con fetch síncrono (menos confiable pero mejor que perder el evento)
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
        // Como último recurso, persistir eventos y programar retry
        this.persistCriticalEvents(body);
        this.scheduleRetry(body);
      }
    } catch (err) {
      // Último intento: persistir eventos críticos en localStorage
      this.persistCriticalEvents(body);
      this.scheduleRetry(body);

      if (this.isQaMode()) {
        console.error(
          'TraceLog error: failed to force send critical events, persisting to localStorage',
          err instanceof Error ? err.message : 'Unknown error',
        );
      }
    }
  }

  // Persistir eventos críticos en localStorage como respaldo
  persistCriticalEvents(body: TracelogQueue): void {
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

        window.localStorage.setItem(`${LSKey.UserId}_critical_events`, JSON.stringify(persistedData));

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

  // Limpiar eventos persistidos después de envío exitoso
  clearPersistedEvents(): void {
    try {
      window.localStorage.removeItem(`${LSKey.UserId}_critical_events`);
    } catch (error) {
      // Ignorar errores al limpiar localStorage
    }
  }

  // Recuperar y enviar eventos críticos persistidos en inicialización
  async recoverPersistedEvents(): Promise<void> {
    try {
      const persistedData = window.localStorage.getItem(`${LSKey.UserId}_critical_events`);

      if (persistedData) {
        const data = JSON.parse(persistedData);

        // Solo intentar recovery si los eventos son recientes (menos de 24 horas)
        const isRecent = Date.now() - data.timestamp < 24 * 60 * 60 * 1000;

        if (isRecent && data.events.length > 0) {
          const recoveryBody: TracelogQueue = {
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
          // Limpiar eventos antiguos
          this.clearPersistedEvents();
        }
      }
    } catch (error) {
      if (this.isQaMode()) {
        console.error('[TraceLog] Failed to recover persisted events:', error);
      }
    }
  }

  async sendError(error: TracelogAdminError): Promise<void> {
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

  private scheduleRetry(body: TracelogQueue): void {
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
