import { QUEUE_KEY, EVENT_EXPIRY_HOURS, REQUEST_TIMEOUT_MS, PERMANENT_ERROR_LOG_THROTTLE_MS } from '../constants';
import { PersistedQueueData, BaseEventsQueueDto, SpecialApiUrl, PermanentError } from '../types';
import { log } from '../utils';
import { StorageManager } from './storage.manager';
import { StateManager } from './state.manager';

interface SendCallbacks {
  onSuccess?: (eventCount?: number, events?: any[], body?: BaseEventsQueueDto) => void;
  onFailure?: () => void;
}

export class SenderManager extends StateManager {
  private readonly storeManager: StorageManager;
  private lastPermanentErrorLog: { statusCode?: number; timestamp: number } | null = null;

  constructor(storeManager: StorageManager) {
    super();
    this.storeManager = storeManager;
  }

  private getQueueStorageKey(): string {
    const userId = this.get('userId') || 'anonymous';
    return QUEUE_KEY(userId);
  }

  sendEventsQueueSync(body: BaseEventsQueueDto): boolean {
    if (this.shouldSkipSend()) {
      return true;
    }

    const config = this.get('config');

    if (config?.integrations?.custom?.collectApiUrl === SpecialApiUrl.Fail) {
      log('warn', 'Fail mode: simulating network failure (sync)', {
        data: { events: body.events.length },
      });

      return false;
    }

    return this.sendQueueSyncInternal(body);
  }

  async sendEventsQueue(body: BaseEventsQueueDto, callbacks?: SendCallbacks): Promise<boolean> {
    try {
      const success = await this.send(body);

      if (success) {
        this.clearPersistedEvents();
        callbacks?.onSuccess?.(body.events.length, body.events, body);
      } else {
        this.persistEvents(body);
        callbacks?.onFailure?.();
      }

      return success;
    } catch (error) {
      if (error instanceof PermanentError) {
        this.logPermanentError('Permanent error, not retrying', error);
        this.clearPersistedEvents();
        callbacks?.onFailure?.();
        return false;
      }

      this.persistEvents(body);
      callbacks?.onFailure?.();
      return false;
    }
  }

  async recoverPersistedEvents(callbacks?: SendCallbacks): Promise<void> {
    try {
      const persistedData = this.getPersistedData();

      if (!persistedData || !this.isDataRecent(persistedData) || persistedData.events.length === 0) {
        this.clearPersistedEvents();
        return;
      }

      const body = this.createRecoveryBody(persistedData);
      const success = await this.send(body);

      if (success) {
        this.clearPersistedEvents();
        callbacks?.onSuccess?.(persistedData.events.length, persistedData.events, body);
      } else {
        callbacks?.onFailure?.();
      }
    } catch (error) {
      if (error instanceof PermanentError) {
        this.logPermanentError('Permanent error during recovery, clearing persisted events', error);
        this.clearPersistedEvents();
        callbacks?.onFailure?.();
        return;
      }

      log('error', 'Failed to recover persisted events', { error });
    }
  }

  stop(): void {}

  private async send(body: BaseEventsQueueDto): Promise<boolean> {
    if (this.shouldSkipSend()) {
      return this.simulateSuccessfulSend();
    }

    const config = this.get('config');

    if (config?.integrations?.custom?.collectApiUrl === SpecialApiUrl.Fail) {
      log('warn', 'Fail mode: simulating network failure', {
        data: { events: body.events.length },
      });

      return false;
    }

    const { url, payload } = this.prepareRequest(body);

    try {
      const response = await this.sendWithTimeout(url, payload);

      return response.ok;
    } catch (error) {
      if (error instanceof PermanentError) {
        throw error;
      }

      log('error', 'Send request failed', {
        error,
        data: {
          events: body.events.length,
          url: url.replace(/\/\/[^/]+/, '//[DOMAIN]'),
        },
      });

      return false;
    }
  }

  private async sendWithTimeout(url: string, payload: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: payload,
        keepalive: true,
        credentials: 'include',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const isPermanentError = response.status >= 400 && response.status < 500;

        if (isPermanentError) {
          throw new PermanentError(`HTTP ${response.status}: ${response.statusText}`, response.status);
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private sendQueueSyncInternal(body: BaseEventsQueueDto): boolean {
    const { url, payload } = this.prepareRequest(body);
    const blob = new Blob([payload], { type: 'application/json' });

    if (!this.isSendBeaconAvailable()) {
      log('warn', 'sendBeacon not available, persisting events for recovery');
      this.persistEvents(body);
      return false;
    }

    // sendBeacon only returns true/false without HTTP status codes
    // true: browser accepted the request for sending
    // false: request rejected (queue full, size limits, etc.)
    const accepted = navigator.sendBeacon(url, blob);

    if (!accepted) {
      log('warn', 'sendBeacon rejected request, persisting events for recovery');
      this.persistEvents(body);
    }

    return accepted;
  }

  private prepareRequest(body: BaseEventsQueueDto): { url: string; payload: string } {
    // Enrich payload with metadata for sendBeacon() fallback
    // sendBeacon() doesn't send custom headers, so we include referer in payload
    const enrichedBody = {
      ...body,
      _metadata: {
        referer: typeof window !== 'undefined' ? window.location.href : undefined,
        timestamp: Date.now(),
      },
    };

    return {
      url: this.get('collectApiUrl'),
      payload: JSON.stringify(enrichedBody),
    };
  }

  private getPersistedData(): PersistedQueueData | null {
    try {
      const storageKey = this.getQueueStorageKey();
      const persistedDataString = this.storeManager.getItem(storageKey);

      if (persistedDataString) {
        return JSON.parse(persistedDataString);
      }
    } catch (error) {
      log('warn', 'Failed to parse persisted data', { error });
      this.clearPersistedEvents();
    }

    return null;
  }

  private isDataRecent(data: PersistedQueueData): boolean {
    if (!data.timestamp || typeof data.timestamp !== 'number') {
      return false;
    }

    const ageInHours = (Date.now() - data.timestamp) / (1000 * 60 * 60);
    return ageInHours < EVENT_EXPIRY_HOURS;
  }

  private createRecoveryBody(data: PersistedQueueData): BaseEventsQueueDto {
    return {
      user_id: data.userId,
      session_id: data.sessionId,
      device: data.device,
      events: data.events,
      ...(data.global_metadata && { global_metadata: data.global_metadata }),
    };
  }

  private persistEvents(body: BaseEventsQueueDto): boolean {
    try {
      const persistedData: PersistedQueueData = {
        userId: body.user_id,
        sessionId: body.session_id,
        device: body.device,
        events: body.events,
        timestamp: Date.now(),
        ...(body.global_metadata && { global_metadata: body.global_metadata }),
      };

      const storageKey = this.getQueueStorageKey();
      this.storeManager.setItem(storageKey, JSON.stringify(persistedData));

      return !!this.storeManager.getItem(storageKey);
    } catch (error) {
      log('warn', 'Failed to persist events', { error });
      return false;
    }
  }

  private clearPersistedEvents(): void {
    try {
      const key = this.getQueueStorageKey();
      this.storeManager.removeItem(key);
    } catch (error) {
      log('warn', 'Failed to clear persisted events', { error });
    }
  }

  private shouldSkipSend(): boolean {
    return !this.get('collectApiUrl');
  }

  private async simulateSuccessfulSend(): Promise<boolean> {
    const delay = Math.random() * 400 + 100;

    await new Promise((resolve) => setTimeout(resolve, delay));

    return true;
  }

  private isSendBeaconAvailable(): boolean {
    return typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function';
  }

  private logPermanentError(context: string, error: PermanentError): void {
    const now = Date.now();
    const shouldLog =
      !this.lastPermanentErrorLog ||
      this.lastPermanentErrorLog.statusCode !== error.statusCode ||
      now - this.lastPermanentErrorLog.timestamp >= PERMANENT_ERROR_LOG_THROTTLE_MS;

    if (shouldLog) {
      log('error', context, {
        data: { status: error.statusCode, message: error.message },
      });

      this.lastPermanentErrorLog = { statusCode: error.statusCode, timestamp: now };
    }
  }
}
