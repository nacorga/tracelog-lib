import { QUEUE_KEY, EVENT_EXPIRY_HOURS, MAX_RETRIES, RETRY_DELAY_MS, REQUEST_TIMEOUT_MS } from '../constants';
import { PersistedQueueData, BaseEventsQueueDto, SpecialApiUrl } from '../types';
import { log } from '../utils';
import { StorageManager } from './storage.manager';
import { StateManager } from './state.manager';

interface SendCallbacks {
  onSuccess?: (eventCount?: number, events?: any[], body?: BaseEventsQueueDto) => void;
  onFailure?: () => void;
}

export class SenderManager extends StateManager {
  private readonly storeManager: StorageManager;
  private retryTimeoutId: number | null = null;
  private retryCount = 0;
  private isRetrying = false;

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
      this.resetRetryState();

      return true;
    }

    const config = this.get('config');

    if (config?.integrations?.custom?.apiUrl === SpecialApiUrl.Fail) {
      log('warn', 'Fail mode: simulating network failure (sync)', {
        data: { events: body.events.length },
      });

      return false;
    }

    const success = this.sendQueueSyncInternal(body);

    if (success) {
      this.resetRetryState();
    }

    return success;
  }

  async sendEventsQueue(body: BaseEventsQueueDto, callbacks?: SendCallbacks): Promise<boolean> {
    if (!this.shouldSkipSend()) {
      const persisted = this.persistEvents(body);

      if (!persisted) {
        log('warn', 'Failed to persist events, attempting immediate send');
      }
    }

    const success = await this.send(body);

    if (success) {
      this.clearPersistedEvents();
      this.resetRetryState();
      callbacks?.onSuccess?.(body.events.length, body.events, body);
    } else {
      this.scheduleRetry(body, callbacks);
      callbacks?.onFailure?.();
    }

    return success;
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
        this.resetRetryState();
        callbacks?.onSuccess?.(persistedData.events.length, persistedData.events, body);
      } else {
        this.scheduleRetry(body, callbacks);
        callbacks?.onFailure?.();
      }
    } catch (error) {
      log('error', 'Failed to recover persisted events', { error });
      this.clearPersistedEvents();
    }
  }

  persistEventsForRecovery(body: BaseEventsQueueDto): boolean {
    return this.persistEvents(body);
  }

  async sendEventsQueueAsync(body: BaseEventsQueueDto): Promise<boolean> {
    return this.sendEventsQueue(body);
  }

  stop(): void {
    this.clearRetryTimeout();
    this.resetRetryState();
  }

  private async send(body: BaseEventsQueueDto): Promise<boolean> {
    if (this.shouldSkipSend()) {
      return this.simulateSuccessfulSend();
    }

    const config = this.get('config');

    if (config?.integrations?.custom?.apiUrl === SpecialApiUrl.Fail) {
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
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

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

    if (this.isSendBeaconAvailable()) {
      const success = navigator.sendBeacon(url, blob);

      if (success) {
        return true;
      }
      log('warn', 'sendBeacon failed, persisting events for recovery');
    } else {
      log('warn', 'sendBeacon not available, persisting events for recovery');
    }

    this.persistEventsForRecovery(body);

    return false;
  }

  private prepareRequest(body: BaseEventsQueueDto): { url: string; payload: string } {
    const url = `${this.get('apiUrl')}/collect`;

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
      url,
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
    const isRecent = ageInHours < EVENT_EXPIRY_HOURS;

    return isRecent;
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

  private resetRetryState(): void {
    this.retryCount = 0;
    this.isRetrying = false;
    this.clearRetryTimeout();
  }

  private scheduleRetry(body: BaseEventsQueueDto, originalCallbacks?: SendCallbacks): void {
    if (this.retryTimeoutId !== null || this.isRetrying) {
      return;
    }

    if (this.retryCount >= MAX_RETRIES) {
      log('warn', 'Max retries reached, giving up', { data: { retryCount: this.retryCount } });
      this.clearPersistedEvents();
      this.resetRetryState();
      originalCallbacks?.onFailure?.();
      return;
    }

    const retryDelay = RETRY_DELAY_MS * Math.pow(2, this.retryCount); // Exponential backoff

    this.isRetrying = true;

    this.retryTimeoutId = window.setTimeout(async () => {
      this.retryTimeoutId = null;

      this.retryCount++;

      try {
        const success = await this.send(body);

        if (success) {
          this.clearPersistedEvents();
          this.resetRetryState();
          originalCallbacks?.onSuccess?.(body.events.length);
        } else if (this.retryCount >= MAX_RETRIES) {
          this.clearPersistedEvents();
          this.resetRetryState();
          originalCallbacks?.onFailure?.();
        } else {
          this.scheduleRetry(body, originalCallbacks);
        }
      } finally {
        this.isRetrying = false;
      }
    }, retryDelay);
  }

  private shouldSkipSend(): boolean {
    return !this.get('apiUrl');
  }

  private async simulateSuccessfulSend(): Promise<boolean> {
    const delay = Math.random() * 400 + 100;

    await new Promise((resolve) => setTimeout(resolve, delay));

    return true;
  }

  private isSendBeaconAvailable(): boolean {
    return typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function';
  }

  private clearRetryTimeout(): void {
    if (this.retryTimeoutId !== null) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }
  }
}
