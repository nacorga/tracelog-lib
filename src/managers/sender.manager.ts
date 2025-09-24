import { QUEUE_KEY, BACKOFF_CONFIGS, EVENT_EXPIRY_HOURS, SYNC_XHR_TIMEOUT_MS, MAX_RETRY_ATTEMPTS } from '../constants';
import { PersistedQueueData, BaseEventsQueueDto, SpecialProjectId, Mode } from '../types';
import { debugLog, BackoffManager, fetchWithTimeout } from '../utils';
import { StorageManager } from './storage.manager';
import { StateManager } from './state.manager';

interface SendCallbacks {
  onSuccess?: () => void;
  onFailure?: () => void;
}

interface PersistenceResult {
  success: boolean;
  primaryError?: string;
  fallbackError?: string;
}

interface MemoryFallbackData {
  data: BaseEventsQueueDto;
  timestamp: number;
  retryCount: number;
}

export class SenderManager extends StateManager {
  private readonly storeManager: StorageManager;
  private readonly memoryFallbackStorage = new Map<string, MemoryFallbackData>();
  private readonly retryBackoffManager: BackoffManager;

  private retryTimeoutId: number | null = null;
  private retryCount = 0;
  private isRetrying = false;

  constructor(storeManager: StorageManager) {
    super();

    this.storeManager = storeManager;
    this.retryBackoffManager = new BackoffManager(BACKOFF_CONFIGS.RETRY, 'SenderManager-Retry');
  }

  getQueueStorageKey(): string {
    const key = `${QUEUE_KEY(this.get('config')?.id)}:${this.get('userId')}`;
    return key;
  }

  async sendEventsQueueAsync(body: BaseEventsQueueDto): Promise<boolean> {
    if (this.shouldSkipSend()) {
      this.logQueue(body);
      return true;
    }

    // Persist events before sending with fallback system
    const persistResult = await this.persistWithFallback(body);
    if (!persistResult.success) {
      // Try to send immediately as last resort
      const immediateSuccess = await this.sendImmediate(body);
      if (!immediateSuccess) {
        return false;
      }
      return true;
    }

    const success = await this.send(body);

    if (success) {
      this.clearPersistedEvents();
      this.resetRetryState();
    } else {
      this.scheduleRetry(body);
    }

    return success;
  }

  sendEventsQueueSync(body: BaseEventsQueueDto): boolean {
    if (this.shouldSkipSend()) {
      this.logQueue(body);
      return true;
    }

    // Note: Do NOT persist here - sync sends are fire-and-forget (beforeunload)
    const success = this.sendQueueSyncInternal(body);

    if (success) {
      this.clearPersistedEvents();
      this.resetRetryState();
    }

    return success;
  }

  async sendEventsQueue(body: BaseEventsQueueDto, callbacks?: SendCallbacks): Promise<boolean> {
    if (this.shouldSkipSend()) {
      this.logQueue(body);
      return true;
    }

    // Persist events before sending with fallback system
    const persistResult = await this.persistWithFallback(body);

    if (!persistResult.success) {
      debugLog.error('SenderManager', 'All persistence methods failed', {
        primaryError: persistResult.primaryError,
        fallbackError: persistResult.fallbackError,
        eventCount: body.events.length,
      });

      // Try to send immediately as last resort
      const immediateSuccess = await this.sendImmediate(body);

      if (!immediateSuccess) {
        callbacks?.onFailure?.();
        return false;
      }

      callbacks?.onSuccess?.();
      return true;
    }

    const success = await this.send(body);

    if (success) {
      this.clearPersistedEvents();
      this.resetRetryState();
      callbacks?.onSuccess?.();
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

      debugLog.info('SenderManager', 'Persisted events recovered', {
        eventsCount: persistedData.events.length,
        sessionId: persistedData.sessionId,
      });

      const body = this.createRecoveryBody(persistedData);
      const success = await this.send(body);

      if (success) {
        this.clearPersistedEvents();
        this.resetRetryState();
        callbacks?.onSuccess?.();
      } else {
        this.scheduleRetry(body, callbacks);
        callbacks?.onFailure?.();
      }
    } catch (error) {
      debugLog.error('SenderManager', 'Failed to recover persisted events', { error });
    }
  }

  async persistEventsForRecovery(body: BaseEventsQueueDto): Promise<boolean> {
    const result = await this.persistWithFallback(body);
    return result.success;
  }

  stop(): void {
    this.clearRetryTimeout();
    this.resetRetryState();
  }

  private async send(body: BaseEventsQueueDto): Promise<boolean> {
    const { url, payload } = this.prepareRequest(body);

    try {
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: payload,
        keepalive: true,
        credentials: 'include',
        timeout: 15000, // 15 segundos timeout para events
      });

      return response.ok;
    } catch (error) {
      debugLog.error('SenderManager', 'Send request failed', { error });
      return false;
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
      xhr.setRequestHeader('Origin', window.location.origin);
      xhr.setRequestHeader('Referer', window.location.href);
      xhr.withCredentials = true;
      xhr.timeout = SYNC_XHR_TIMEOUT_MS;
      xhr.send(payload);

      return xhr.status >= 200 && xhr.status < 300;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isCorsError =
        errorMessage.includes('CORS') || errorMessage.includes('NotSameOrigin') || errorMessage.includes('blocked');

      debugLog.warn('SenderManager', 'Sync XHR failed', {
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
    // 1. Try to recover from localStorage principal
    try {
      const storageKey = this.getQueueStorageKey();
      const persistedDataString = this.storeManager.getItem(storageKey);

      if (persistedDataString) {
        return JSON.parse(persistedDataString);
      }
    } catch (error) {
      debugLog.warn('SenderManager', 'Failed to get persisted data from localStorage', { error });
    }

    // 2. Try to recover from sessionStorage fallback
    try {
      const sessionKey = this.getQueueStorageKey() + '_session_fallback';
      const sessionDataString = sessionStorage.getItem(sessionKey);

      if (sessionDataString) {
        debugLog.info('SenderManager', 'Recovering data from sessionStorage fallback');
        return JSON.parse(sessionDataString);
      }
    } catch (error) {
      debugLog.warn('SenderManager', 'Failed to get persisted data from sessionStorage', { error });
    }

    // 3. Try to recover from memory fallback
    try {
      const sessionId = this.get('sessionId');
      if (sessionId && this.memoryFallbackStorage.has(sessionId)) {
        const memoryData = this.memoryFallbackStorage.get(sessionId);
        if (memoryData) {
          debugLog.info('SenderManager', 'Recovering data from memory fallback');
          return {
            userId: memoryData.data.user_id,
            sessionId: memoryData.data.session_id,
            device: memoryData.data.device,
            events: memoryData.data.events,
            timestamp: memoryData.timestamp,
            fallbackMode: true,
            ...(memoryData.data.global_metadata && { global_metadata: memoryData.data.global_metadata }),
          };
        }
      }
    } catch (error) {
      debugLog.warn('SenderManager', 'Failed to get persisted data from memory fallback', { error });
    }

    return null;
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

  private async persistWithFallback(body: BaseEventsQueueDto): Promise<PersistenceResult> {
    // 1. Persistence in localStorage principal
    try {
      const primarySuccess = this.persistFailedEvents(body);
      if (primarySuccess) {
        return { success: true };
      }
    } catch (primaryError) {
      debugLog.warn('SenderManager', 'Primary persistence failed', { primaryError });
    }

    // 2. Persistence in sessionStorage as fallback
    try {
      const fallbackSuccess = this.persistToSessionStorage(body);
      if (fallbackSuccess) {
        debugLog.info('SenderManager', 'Using sessionStorage fallback for persistence');
        return { success: true };
      }
    } catch (fallbackError) {
      debugLog.warn('SenderManager', 'Fallback persistence failed', { fallbackError });
    }

    // 3. Persistence in memory as last resort
    try {
      this.memoryFallbackStorage.set(body.session_id, {
        data: body,
        timestamp: Date.now(),
        retryCount: 0,
      });

      debugLog.warn('SenderManager', 'Using memory fallback for persistence (data will be lost on page reload)');
      return { success: true };
    } catch {
      return {
        success: false,
        primaryError: 'localStorage failed',
        fallbackError: 'All persistence methods failed',
      };
    }
  }

  private persistToSessionStorage(body: BaseEventsQueueDto): boolean {
    try {
      const storageKey = this.getQueueStorageKey() + '_session_fallback';
      const persistedData: PersistedQueueData = {
        userId: body.user_id,
        sessionId: body.session_id,
        device: body.device,
        events: body.events,
        timestamp: Date.now(),
        fallbackMode: true,
        ...(body.global_metadata && { global_metadata: body.global_metadata }),
      };

      sessionStorage.setItem(storageKey, JSON.stringify(persistedData));
      return !!sessionStorage.getItem(storageKey);
    } catch (error) {
      debugLog.error('SenderManager', 'SessionStorage persistence failed', { error });
      return false;
    }
  }

  private async sendImmediate(body: BaseEventsQueueDto): Promise<boolean> {
    debugLog.warn('SenderManager', 'Attempting immediate send as last resort');

    try {
      const success = await this.send(body);
      if (success) {
        debugLog.info('SenderManager', 'Immediate send successful, events saved');
      }
      return success;
    } catch (error) {
      debugLog.error('SenderManager', 'Immediate send failed', { error });
      return false;
    }
  }

  private persistFailedEvents(body: BaseEventsQueueDto): boolean {
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
      debugLog.error('SenderManager', 'Failed to persist events', { error });
      return false;
    }
  }

  private clearPersistedEvents(): void {
    // Clear localStorage principal
    this.storeManager.removeItem(this.getQueueStorageKey());

    // Clear sessionStorage fallback
    try {
      const sessionKey = this.getQueueStorageKey() + '_session_fallback';
      sessionStorage.removeItem(sessionKey);
    } catch (error) {
      debugLog.warn('SenderManager', 'Failed to clear sessionStorage fallback', { error });
    }

    // Clear memory fallback
    const sessionId = this.get('sessionId');
    if (sessionId && this.memoryFallbackStorage.has(sessionId)) {
      this.memoryFallbackStorage.delete(sessionId);
      debugLog.debug('SenderManager', 'Cleared memory fallback storage', { sessionId });
    }
  }

  private resetRetryState(): void {
    this.retryBackoffManager.reset();
    this.retryCount = 0;
    this.isRetrying = false;
    this.clearRetryTimeout();
  }

  private scheduleRetry(body: BaseEventsQueueDto, originalCallbacks?: SendCallbacks): void {
    if (this.retryTimeoutId !== null || this.isRetrying) {
      return;
    }

    if (this.retryCount >= MAX_RETRY_ATTEMPTS) {
      this.clearPersistedEvents();
      this.resetRetryState();
      originalCallbacks?.onFailure?.();
      return;
    }

    if (this.isCircuitBreakerOpen()) {
      return;
    }

    this.retryTimeoutId = window.setTimeout(async () => {
      this.retryTimeoutId = null;

      if (this.isCircuitBreakerOpen() || this.isRetrying) {
        return;
      }

      this.retryCount++;
      this.isRetrying = true;

      const success = await this.send(body);
      this.isRetrying = false;

      if (success) {
        this.clearPersistedEvents();
        this.resetRetryState();
        originalCallbacks?.onSuccess?.();
      } else if (this.retryCount >= MAX_RETRY_ATTEMPTS) {
        this.clearPersistedEvents();
        this.resetRetryState();
        originalCallbacks?.onFailure?.();
      } else {
        this.scheduleRetry(body, originalCallbacks);
      }
    }, this.retryBackoffManager.getCurrentDelay());

    const nextRetryDelay = this.retryBackoffManager.getNextDelay();

    debugLog.debug('SenderManager', 'Retry scheduled', {
      retryCount: this.retryCount,
      retryDelay: nextRetryDelay,
      eventsCount: body.events.length,
    });
  }

  private shouldSkipSend(): boolean {
    const config = this.get('config');
    const { id, mode } = config || {};
    const specialModes: Mode[] = [Mode.QA, Mode.DEBUG];

    if (id === SpecialProjectId.HttpSkip) {
      return true;
    }

    const shouldSkip = !!mode && specialModes.includes(mode) && id !== SpecialProjectId.HttpLocal;

    return shouldSkip;
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

  private isCircuitBreakerOpen(): boolean {
    return this.get('circuitBreakerOpen') === true;
  }
}
