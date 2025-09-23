import {
  QUEUE_KEY,
  RETRY_BACKOFF_INITIAL,
  RETRY_BACKOFF_MAX,
  RATE_LIMIT_INTERVAL,
  EVENT_EXPIRY_HOURS,
  SYNC_XHR_TIMEOUT_MS,
} from '../constants';
import { PersistedQueueData, BaseEventsQueueDto, SpecialProjectId, Mode } from '../types';
import { debugLog } from '../utils/logging';
import { StorageManager } from './storage.manager';
import { StateManager } from './state.manager';

export class SenderManager extends StateManager {
  private readonly storeManager: StorageManager;
  private readonly queueStorageKey: string;

  private retryDelay: number = RETRY_BACKOFF_INITIAL;
  private retryTimeoutId: number | null = null;
  private lastAsyncSend = 0;
  private lastSyncSend = 0;

  constructor(storeManager: StorageManager) {
    super();

    this.storeManager = storeManager;
    this.queueStorageKey = `${QUEUE_KEY(this.get('config')?.id)}:${this.get('userId')}`;
    this.recoverPersistedEvents();
  }

  async sendEventsQueueAsync(body: BaseEventsQueueDto): Promise<boolean> {
    return this.executeSend(body, () => this.sendQueueAsync(body));
  }

  sendEventsQueueSync(body: BaseEventsQueueDto): boolean {
    return this.executeSendSync(body, () => this.sendQueueSync(body));
  }

  sendEventsQueue(body: BaseEventsQueueDto): boolean {
    return this.executeSendSync(body, () => this.sendQueue(body));
  }

  recoverPersistedEvents(): void {
    try {
      const persistedData = this.getPersistedData();

      if (!persistedData || !this.isDataRecent(persistedData) || persistedData.events.length === 0) {
        this.clearPersistedEvents();

        return;
      }

      const recoveryBody = this.createRecoveryBody(persistedData);
      const success = this.sendRecoveredEvents(recoveryBody);

      if (success) {
        debugLog.info('SenderManager', 'Persisted events recovered successfully', {
          eventsCount: persistedData.events.length,
          sessionId: persistedData.sessionId,
        });

        this.clearPersistedEvents();
      } else {
        debugLog.warn('SenderManager', 'Failed to recover persisted events, scheduling retry', {
          eventsCount: persistedData.events.length,
        });

        this.scheduleRetryForRecoveredEvents(recoveryBody);
      }
    } catch (error) {
      debugLog.error('SenderManager', 'Failed to recover persisted events', { error });
    }
  }

  stop(): void {
    this.clearRetryTimeout();
    this.resetRetryState();
  }

  /**
   * Sends recovered events without re-deduplication since they were already processed
   */
  private sendRecoveredEvents(body: BaseEventsQueueDto): boolean {
    return this.executeSendSync(body, () => this.sendQueue(body));
  }

  /**
   * Schedules retry for recovered events using the specific recovery method
   */
  private scheduleRetryForRecoveredEvents(body: BaseEventsQueueDto): void {
    if (this.retryTimeoutId !== null) {
      return;
    }

    this.retryTimeoutId = window.setTimeout(() => {
      this.retryTimeoutId = null;
      this.sendRecoveredEvents(body);
    }, this.retryDelay);

    this.retryDelay = Math.min(this.retryDelay * 2, RETRY_BACKOFF_MAX);
  }

  private canSendAsync(): boolean {
    return Date.now() - this.lastAsyncSend >= RATE_LIMIT_INTERVAL;
  }

  private canSendSync(): boolean {
    return Date.now() - this.lastSyncSend >= RATE_LIMIT_INTERVAL;
  }

  private async sendQueueAsync(body: BaseEventsQueueDto): Promise<boolean> {
    const { url, payload } = this.prepareRequest(body);

    try {
      const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        body: payload,
        headers: {
          'Content-Type': 'application/json',
          Origin: window.location.origin,
          Referer: window.location.href,
        },
      });

      return response.ok;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isCorsError =
        errorMessage.includes('CORS') || errorMessage.includes('NotSameOrigin') || errorMessage.includes('blocked');

      debugLog.error('SenderManager', 'Failed to send events async', {
        error: errorMessage,
        isCorsError,
        url: url.replace(/\/\/[^/]+/, '//[DOMAIN]'),
      });

      return false;
    }
  }

  private sendQueueSync(body: BaseEventsQueueDto): boolean {
    const { url, payload } = this.prepareRequest(body);
    const blob = new Blob([payload], { type: 'application/json' });

    if (this.isSendBeaconAvailable() && navigator.sendBeacon(url, blob)) {
      return true;
    }

    return this.sendSyncXHR(url, payload);
  }

  private sendQueue(body: BaseEventsQueueDto): boolean {
    if (!this.isSendBeaconAvailable()) {
      return false;
    }

    const { url, payload } = this.prepareRequest(body);
    const blob = new Blob([payload], { type: 'application/json' });

    return navigator.sendBeacon(url, blob);
  }

  private sendSyncXHR(url: string, payload: string): boolean {
    const xhr = new XMLHttpRequest();

    try {
      xhr.open('POST', url, false);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Origin', window.location.origin);
      xhr.setRequestHeader('Referer', window.location.href);
      xhr.withCredentials = false;
      xhr.timeout = SYNC_XHR_TIMEOUT_MS;
      xhr.send(payload);

      return xhr.status >= 200 && xhr.status < 300;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isCorsError =
        errorMessage.includes('CORS') || errorMessage.includes('NotSameOrigin') || errorMessage.includes('blocked');

      debugLog.error('SenderManager', 'Sync XHR failed', {
        error: errorMessage,
        isCorsError,
        status: xhr.status ?? 'unknown',
        url: url.replace(/\/\/[^/]+/, '//[DOMAIN]'),
      });

      return false;
    }
  }

  private prepareRequest(body: BaseEventsQueueDto): { url: string; payload: string } {
    const useLocalServer = this.get('config').id === SpecialProjectId.HttpLocal;
    const baseUrl = useLocalServer ? window.location.origin : this.get('apiUrl');
    const url = `${baseUrl}/collect`;

    return {
      url,
      payload: JSON.stringify(body),
    };
  }

  private getPersistedData(): PersistedQueueData | null {
    const persistedDataString = this.storeManager.getItem(this.queueStorageKey);

    return persistedDataString ? (JSON.parse(persistedDataString) as PersistedQueueData) : null;
  }

  private isDataRecent(data: PersistedQueueData): boolean {
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

  private logQueue(queue: BaseEventsQueueDto): void {
    debugLog.info('SenderManager', ` ⏩ Queue snapshot`, queue);
  }

  private handleSendFailure(body: BaseEventsQueueDto): void {
    this.persistFailedEvents(body);
    this.scheduleRetry(body);
  }

  private persistFailedEvents(body: BaseEventsQueueDto): void {
    try {
      const persistedData: PersistedQueueData = {
        userId: body.user_id,
        sessionId: body.session_id,
        device: body.device,
        events: body.events,
        timestamp: Date.now(),
        ...(body.global_metadata && { global_metadata: body.global_metadata }),
      };

      this.storeManager.setItem(this.queueStorageKey, JSON.stringify(persistedData));
    } catch (error) {
      debugLog.error('SenderManager', 'Failed to persist events', { error });
    }
  }

  private clearPersistedEvents(): void {
    this.storeManager.removeItem(this.queueStorageKey);
  }

  private resetRetryState(): void {
    this.retryDelay = RETRY_BACKOFF_INITIAL;
    this.clearRetryTimeout();
  }

  private scheduleRetry(body: BaseEventsQueueDto): void {
    if (this.retryTimeoutId !== null) {
      return;
    }

    this.retryTimeoutId = window.setTimeout(() => {
      this.retryTimeoutId = null;
      this.sendEventsQueue(body);
    }, this.retryDelay);

    this.retryDelay = Math.min(this.retryDelay * 2, RETRY_BACKOFF_MAX);
  }

  private async executeSend(body: BaseEventsQueueDto, sendFn: () => Promise<boolean>): Promise<boolean> {
    if (this.shouldSkipSend()) {
      this.logQueue(body);

      return true;
    }

    if (!this.canSendAsync()) {
      debugLog.info('SenderManager', `⏱️ Rate limited - skipping async send`, {
        eventsCount: body.events.length,
        timeSinceLastSend: Date.now() - this.lastAsyncSend,
      });

      return false;
    }

    debugLog.info('SenderManager', `🌐 Sending events to server (async)`, {
      eventsCount: body.events.length,
      sessionId: body.session_id,
      userId: body.user_id,
    });

    this.lastAsyncSend = Date.now();

    try {
      const success = await sendFn();

      if (success) {
        debugLog.info('SenderManager', `✅ Successfully sent events to server`, {
          eventsCount: body.events.length,
          method: 'async',
        });

        this.resetRetryState();
        this.clearPersistedEvents();
      } else {
        debugLog.warn('SenderManager', 'Failed to send events', {
          eventsCount: body.events.length,
          method: 'async',
        });

        this.handleSendFailure(body);
      }

      return success;
    } catch {
      this.handleSendFailure(body);

      return false;
    }
  }

  private executeSendSync(body: BaseEventsQueueDto, sendFn: () => boolean): boolean {
    if (this.shouldSkipSend()) {
      this.logQueue(body);

      return true;
    }

    if (!this.canSendSync()) {
      debugLog.info('SenderManager', `⏱️ Rate limited - skipping sync send`, {
        eventsCount: body.events.length,
        timeSinceLastSend: Date.now() - this.lastSyncSend,
      });

      return false;
    }

    debugLog.info('SenderManager', `🌐 Sending events to server (sync)`, {
      eventsCount: body.events.length,
      sessionId: body.session_id,
      userId: body.user_id,
      method: 'sendBeacon/XHR',
    });

    this.lastSyncSend = Date.now();

    try {
      const success = sendFn();

      if (success) {
        debugLog.info('SenderManager', `✅ Successfully sent events to server`, {
          eventsCount: body.events.length,
          method: 'sync',
        });

        this.resetRetryState();
        this.clearPersistedEvents();
      } else {
        debugLog.warn('SenderManager', 'Failed to send events', {
          eventsCount: body.events.length,
          method: 'sync',
        });

        this.handleSendFailure(body);
      }

      return success;
    } catch {
      debugLog.info('SenderManager', `💥 Exception during event sending`, {
        eventsCount: body.events.length,
        method: 'sync',
      });

      this.handleSendFailure(body);

      return false;
    }
  }

  private shouldSkipSend(): boolean {
    const { id, mode } = this.get('config');
    const specialModes: Mode[] = [Mode.QA, Mode.DEBUG];

    if (id === SpecialProjectId.HttpSkip) {
      return true;
    }

    return !!mode && specialModes.includes(mode) && id !== SpecialProjectId.HttpLocal;
  }

  private isSendBeaconAvailable(): boolean {
    if (typeof navigator.sendBeacon !== 'function') {
      return false;
    }

    return true;
  }

  private clearRetryTimeout(): void {
    if (this.retryTimeoutId !== null) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }
  }
}
