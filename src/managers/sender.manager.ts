import {
  QUEUE_KEY,
  EVENT_EXPIRY_HOURS,
  SYNC_XHR_TIMEOUT_MS,
  MAX_RETRIES,
  RETRY_DELAY_MS,
  REQUEST_TIMEOUT_MS,
} from '../constants';
import { PersistedQueueData, BaseEventsQueueDto, SpecialProjectId } from '../types';
import { debugLog } from '../utils';
import { StorageManager } from './storage.manager';
import { StateManager } from './state.manager';

interface SendCallbacks {
  onSuccess?: (eventCount?: number, events?: any[]) => void;
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
    const projectId = this.get('config')?.id || 'default';
    const userId = this.get('userId') || 'anonymous';
    return `${QUEUE_KEY(projectId)}:${userId}`;
  }

  /**
   * Send events synchronously using sendBeacon or XHR fallback
   * Used primarily for page unload scenarios
   */
  sendEventsQueueSync(body: BaseEventsQueueDto): boolean {
    if (this.shouldSkipSend()) {
      this.logQueue(body);
      return true;
    }

    const success = this.sendQueueSyncInternal(body);

    if (success) {
      this.clearPersistedEvents();
      this.resetRetryState();
    }

    return success;
  }

  /**
   * Send events asynchronously with persistence and retry logic
   * Main method for sending events during normal operation
   */
  async sendEventsQueue(body: BaseEventsQueueDto, callbacks?: SendCallbacks): Promise<boolean> {
    if (this.shouldSkipSend()) {
      this.logQueue(body);
      callbacks?.onSuccess?.(0);
      return true;
    }

    // First, try to persist events for recovery
    const persisted = this.persistEvents(body);
    if (!persisted) {
      debugLog.warn('SenderManager', 'Failed to persist events, attempting immediate send');
    }

    // Attempt to send events
    const success = await this.send(body);

    if (success) {
      this.clearPersistedEvents();
      this.resetRetryState();
      callbacks?.onSuccess?.(body.events.length);
    } else {
      this.scheduleRetry(body, callbacks);
      callbacks?.onFailure?.();
    }

    return success;
  }

  /**
   * Recover and send previously persisted events
   * Called during initialization to handle events from previous session
   */
  async recoverPersistedEvents(callbacks?: SendCallbacks): Promise<void> {
    try {
      const persistedData = this.getPersistedData();

      if (!persistedData || !this.isDataRecent(persistedData) || persistedData.events.length === 0) {
        this.clearPersistedEvents();
        return;
      }

      debugLog.info('SenderManager', 'Recovering persisted events', {
        count: persistedData.events.length,
        sessionId: persistedData.sessionId,
      });

      const body = this.createRecoveryBody(persistedData);
      const success = await this.send(body);

      if (success) {
        this.clearPersistedEvents();
        this.resetRetryState();
        callbacks?.onSuccess?.(persistedData.events.length);
      } else {
        this.scheduleRetry(body, callbacks);
        callbacks?.onFailure?.();
      }
    } catch (error) {
      debugLog.error('SenderManager', 'Failed to recover persisted events', { error });
      this.clearPersistedEvents(); // Clean up corrupted data
    }
  }

  /**
   * Persist events for recovery in case of failure
   */
  persistEventsForRecovery(body: BaseEventsQueueDto): boolean {
    return this.persistEvents(body);
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use sendEventsQueue instead
   */
  async sendEventsQueueAsync(body: BaseEventsQueueDto): Promise<boolean> {
    return this.sendEventsQueue(body);
  }

  /**
   * Stop the sender manager and clean up resources
   */
  stop(): void {
    this.clearRetryTimeout();
    this.resetRetryState();
    // Clear any persisted events on shutdown to prevent stale data
    this.clearPersistedEvents();
  }

  private async send(body: BaseEventsQueueDto): Promise<boolean> {
    const { url, payload } = this.prepareRequest(body);

    try {
      const response = await this.sendWithTimeout(url, payload);
      debugLog.debug('SenderManager', 'Send completed', { status: response.status, events: body.events.length });
      return response.ok;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      debugLog.error('SenderManager', 'Send request failed', {
        error: errorMessage,
        events: body.events.length,
        url: url.replace(/\/\/[^/]+/, '//[DOMAIN]'), // Hide domain for privacy
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: payload,
        keepalive: true,
        credentials: 'include',
        signal: controller.signal,
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

    if (this.isSendBeaconAvailable() && navigator.sendBeacon(url, blob)) {
      return true;
    }

    return this.sendSyncXHR(url, payload);
  }

  private sendSyncXHR(url: string, payload: string): boolean {
    const xhr = new XMLHttpRequest();

    try {
      xhr.open('POST', url, false);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.withCredentials = true;
      xhr.timeout = SYNC_XHR_TIMEOUT_MS;
      xhr.send(payload);

      const success = xhr.status >= 200 && xhr.status < 300;

      if (!success) {
        debugLog.warn('SenderManager', 'Sync XHR failed', {
          status: xhr.status,
          statusText: xhr.statusText || 'Unknown error',
        });
      }

      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      debugLog.warn('SenderManager', 'Sync XHR error', {
        error: errorMessage,
        status: xhr.status || 'unknown',
      });
      return false;
    }
  }

  private prepareRequest(body: BaseEventsQueueDto): { url: string; payload: string } {
    const url = `${this.get('apiUrl')}/collect`;

    return {
      url,
      payload: JSON.stringify(body),
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
      debugLog.warn('SenderManager', 'Failed to parse persisted data', { error });
      // Clean up corrupted data
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

    if (!isRecent) {
      debugLog.debug('SenderManager', 'Persisted data expired', { ageInHours });
    }

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

  private logQueue(queue: BaseEventsQueueDto): void {
    debugLog.info('SenderManager', 'Skipping send (debug mode)', {
      events: queue.events.length,
      sessionId: queue.session_id,
    });
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
      debugLog.warn('SenderManager', 'Failed to persist events', { error });
      return false;
    }
  }

  private clearPersistedEvents(): void {
    try {
      this.storeManager.removeItem(this.getQueueStorageKey());
    } catch (error) {
      debugLog.warn('SenderManager', 'Failed to clear persisted events', { error });
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
      debugLog.warn('SenderManager', 'Max retries reached, giving up', { retryCount: this.retryCount });
      this.clearPersistedEvents();
      this.resetRetryState();
      originalCallbacks?.onFailure?.();
      return;
    }

    const retryDelay = RETRY_DELAY_MS * Math.pow(2, this.retryCount); // Exponential backoff

    this.retryTimeoutId = window.setTimeout(async () => {
      this.retryTimeoutId = null;

      if (this.isRetrying) {
        return;
      }

      this.retryCount++;
      this.isRetrying = true;

      debugLog.debug('SenderManager', 'Retrying send', { attempt: this.retryCount });

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

    debugLog.debug('SenderManager', 'Retry scheduled', {
      attempt: this.retryCount + 1,
      delay: retryDelay,
      events: body.events.length,
    });
  }

  private shouldSkipSend(): boolean {
    const config = this.get('config');
    const { id } = config || {};

    return id === SpecialProjectId.Skip;
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
