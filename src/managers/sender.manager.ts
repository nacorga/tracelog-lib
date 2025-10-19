import {
  QUEUE_KEY,
  EVENT_EXPIRY_HOURS,
  REQUEST_TIMEOUT_MS,
  PERMANENT_ERROR_LOG_THROTTLE_MS,
  MAX_BEACON_PAYLOAD_SIZE,
  PERSISTENCE_THROTTLE_MS,
} from '../constants';
import { PersistedEventsQueue, EventsQueue, SpecialApiUrl, PermanentError, EventData } from '../types';
import { log } from '../utils';
import { StorageManager } from './storage.manager';
import { StateManager } from './state.manager';
import { TransformerHook } from '../types/transformer.types';

interface SendCallbacks {
  onSuccess?: (eventCount?: number, events?: any[], body?: EventsQueue) => void;
  onFailure?: () => void;
}

export class SenderManager extends StateManager {
  private readonly storeManager: StorageManager;
  private readonly integrationId?: 'saas' | 'custom';
  private readonly apiUrl?: string;
  private readonly transformers: Map<
    TransformerHook,
    (data: EventData | EventsQueue) => EventData | EventsQueue | null
  >;
  private lastPermanentErrorLog: { statusCode?: number; timestamp: number } | null = null;
  private recoveryInProgress = false;

  constructor(
    storeManager: StorageManager,
    integrationId?: 'saas' | 'custom',
    apiUrl?: string,
    transformers: Map<TransformerHook, (data: EventData | EventsQueue) => EventData | EventsQueue | null> = new Map(),
  ) {
    super();

    if ((integrationId && !apiUrl) || (!integrationId && apiUrl)) {
      throw new Error('SenderManager: integrationId and apiUrl must either both be provided or both be undefined');
    }

    this.storeManager = storeManager;
    this.integrationId = integrationId;
    this.apiUrl = apiUrl;
    this.transformers = transformers;
  }

  private getQueueStorageKey(): string {
    const userId = this.get('userId') || 'anonymous';
    const baseKey = QUEUE_KEY(userId);
    // Add integration suffix for multi-integration support
    return this.integrationId ? `${baseKey}:${this.integrationId}` : baseKey;
  }

  sendEventsQueueSync(body: EventsQueue): boolean {
    if (this.shouldSkipSend()) {
      return true;
    }

    if (this.apiUrl === SpecialApiUrl.Fail) {
      log(
        'warn',
        `Fail mode: simulating network failure (sync)${this.integrationId ? ` [${this.integrationId}]` : ''}`,
        {
          data: { events: body.events.length },
        },
      );

      return false;
    }

    return this.sendQueueSyncInternal(body);
  }

  async sendEventsQueue(body: EventsQueue, callbacks?: SendCallbacks): Promise<boolean> {
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
    if (this.recoveryInProgress) {
      log('debug', 'Recovery already in progress, skipping duplicate attempt');
      return;
    }

    this.recoveryInProgress = true;

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
    } finally {
      this.recoveryInProgress = false;
    }
  }

  stop(): void {}

  private isValidEventsQueue(value: unknown): value is EventsQueue {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const queue = value as Partial<EventsQueue>;

    return Array.isArray(queue.events);
  }

  private applyBeforeBatchTransformer(body: EventsQueue): EventsQueue | null {
    if (this.integrationId === 'saas') {
      return body;
    }

    const beforeBatchTransformer = this.transformers.get('beforeBatch');

    if (!beforeBatchTransformer) {
      return body;
    }

    try {
      const transformed = beforeBatchTransformer(body);

      if (transformed === null) {
        log('debug', `Batch filtered by beforeBatch transformer [${this.integrationId}]`, {
          data: { eventCount: body.events.length },
        });

        return null;
      }

      if (this.isValidEventsQueue(transformed)) {
        return transformed;
      }

      log('warn', `beforeBatch transformer returned invalid data, using original [${this.integrationId}]`, {
        data: { eventCount: body.events.length, invalidFields: this.getMissingQueueFields(transformed) },
      });

      return body;
    } catch (error) {
      log('error', `beforeBatch transformer threw error, using original batch [${this.integrationId}]`, {
        error,
        data: { eventCount: body.events.length },
      });

      return body;
    }
  }

  private getMissingQueueFields(value: unknown): string[] {
    if (!value || typeof value !== 'object') {
      return ['value is not an object'];
    }

    const queue = value as Partial<EventsQueue>;
    const missing: string[] = [];

    if (!Array.isArray(queue.events)) {
      missing.push('events (required array to distinguish from EventData)');
    }

    return missing;
  }

  private async send(body: EventsQueue): Promise<boolean> {
    if (this.shouldSkipSend()) {
      return this.simulateSuccessfulSend();
    }

    const transformedBody = this.applyBeforeBatchTransformer(body);

    if (!transformedBody) {
      return true;
    }

    if (this.apiUrl === SpecialApiUrl.Fail) {
      log('warn', `Fail mode: simulating network failure${this.integrationId ? ` [${this.integrationId}]` : ''}`, {
        data: { events: transformedBody.events.length },
      });

      return false;
    }

    const { url, payload } = this.prepareRequest(transformedBody);

    try {
      const response = await this.sendWithTimeout(url, payload);

      return response.ok;
    } catch (error) {
      if (error instanceof PermanentError) {
        throw error;
      }

      log('error', `Send request failed${this.integrationId ? ` [${this.integrationId}]` : ''}`, {
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

  private sendQueueSyncInternal(body: EventsQueue): boolean {
    // Apply beforeBatch transformer
    const transformedBody = this.applyBeforeBatchTransformer(body);

    if (!transformedBody) {
      // Batch was filtered out by transformer
      return true;
    }

    const { url, payload } = this.prepareRequest(transformedBody);

    // Check payload size against 64KB browser limit (Phase 3)
    if (payload.length > MAX_BEACON_PAYLOAD_SIZE) {
      log('warn', 'Payload exceeds sendBeacon limit, persisting for recovery', {
        data: {
          size: payload.length,
          limit: MAX_BEACON_PAYLOAD_SIZE,
          events: transformedBody.events.length,
        },
      });
      this.persistEvents(transformedBody);
      return false;
    }

    const blob = new Blob([payload], { type: 'application/json' });

    if (!this.isSendBeaconAvailable()) {
      log('warn', 'sendBeacon not available, persisting events for recovery');
      this.persistEvents(transformedBody);
      return false;
    }

    // sendBeacon only returns true/false without HTTP status codes
    // true: browser accepted the request for sending
    // false: request rejected (queue full, size limits, etc.)
    const accepted = navigator.sendBeacon(url, blob);

    if (!accepted) {
      log('warn', 'sendBeacon rejected request, persisting events for recovery');
      this.persistEvents(transformedBody);
    }

    return accepted;
  }

  private prepareRequest(body: EventsQueue): { url: string; payload: string } {
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
      url: this.apiUrl || '',
      payload: JSON.stringify(enrichedBody),
    };
  }

  private getPersistedData(): PersistedEventsQueue | null {
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

  private isDataRecent(data: PersistedEventsQueue): boolean {
    if (!data.timestamp || typeof data.timestamp !== 'number') {
      return false;
    }

    const ageInHours = (Date.now() - data.timestamp) / (1000 * 60 * 60);
    return ageInHours < EVENT_EXPIRY_HOURS;
  }

  private createRecoveryBody(data: PersistedEventsQueue): EventsQueue {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { timestamp, ...queue } = data;
    return queue;
  }

  private persistEvents(body: EventsQueue): boolean {
    try {
      const existing = this.getPersistedData();

      if (existing && existing.timestamp) {
        const timeSinceExisting = Date.now() - existing.timestamp;

        if (timeSinceExisting < PERSISTENCE_THROTTLE_MS) {
          log('debug', 'Skipping persistence, another tab recently persisted events', {
            data: { timeSinceExisting },
          });

          return true;
        }
      }

      const persistedData: PersistedEventsQueue = {
        ...body,
        timestamp: Date.now(),
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
    return !this.apiUrl;
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
      log('error', `${context}${this.integrationId ? ` [${this.integrationId}]` : ''}`, {
        data: { status: error.statusCode, message: error.message },
      });

      this.lastPermanentErrorLog = { statusCode: error.statusCode, timestamp: now };
    }
  }
}
