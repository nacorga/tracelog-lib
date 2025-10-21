import {
  QUEUE_KEY,
  EVENT_EXPIRY_HOURS,
  REQUEST_TIMEOUT_MS,
  PERMANENT_ERROR_LOG_THROTTLE_MS,
  MAX_BEACON_PAYLOAD_SIZE,
  PERSISTENCE_THROTTLE_MS,
} from '../constants';
import { PersistedEventsQueue, EventsQueue, SpecialApiUrl, PermanentError, TransformerMap } from '../types';
import { log, transformEvents, transformBatch } from '../utils';
import { StorageManager } from './storage.manager';
import { StateManager } from './state.manager';
import { ConsentManager } from './consent.manager';

interface SendCallbacks {
  onSuccess?: (eventCount?: number, events?: any[], body?: EventsQueue) => void;
  onFailure?: () => void;
}

export class SenderManager extends StateManager {
  private readonly storeManager: StorageManager;
  private readonly integrationId?: 'saas' | 'custom';
  private readonly apiUrl?: string;
  private readonly consentManager: ConsentManager | null;
  private readonly transformers: TransformerMap;
  private lastPermanentErrorLog: { statusCode?: number; timestamp: number } | null = null;
  private recoveryInProgress = false;

  constructor(
    storeManager: StorageManager,
    integrationId?: 'saas' | 'custom',
    apiUrl?: string,
    consentManager: ConsentManager | null = null,
    transformers: TransformerMap = {},
  ) {
    super();

    if ((integrationId && !apiUrl) || (!integrationId && apiUrl)) {
      throw new Error('SenderManager: integrationId and apiUrl must either both be provided or both be undefined');
    }

    this.storeManager = storeManager;
    this.integrationId = integrationId;
    this.apiUrl = apiUrl;
    this.consentManager = consentManager;
    this.transformers = transformers;
  }

  /**
   * Get the integration ID for this sender
   * @returns The integration ID ('saas' or 'custom') or undefined if not set
   */
  public getIntegrationId(): 'saas' | 'custom' | undefined {
    return this.integrationId;
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

    // Check consent before sending
    if (!this.hasConsentForIntegration()) {
      log(
        'debug',
        `Skipping sync send, no consent for integration${this.integrationId ? ` [${this.integrationId}]` : ''}`,
      );
      return true; // Return true to avoid retries
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

    // Check consent before attempting recovery
    if (!this.hasConsentForIntegration()) {
      log(
        'debug',
        `Skipping recovery, no consent for integration${this.integrationId ? ` [${this.integrationId}]` : ''}`,
      );
      return; // Keep persisted events for future recovery when consent is granted
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

  private applyBeforeSendTransformer(body: EventsQueue): EventsQueue | null {
    // Skip for SaaS integration
    if (this.integrationId === 'saas') {
      return body;
    }

    const beforeSendTransformer = this.transformers.beforeSend;

    if (!beforeSendTransformer) {
      return body;
    }

    const transformedEvents = transformEvents(
      body.events,
      beforeSendTransformer,
      this.integrationId || 'SenderManager',
    );

    if (transformedEvents.length === 0) {
      return null;
    }

    return {
      ...body,
      events: transformedEvents,
    };
  }

  private applyBeforeBatchTransformer(body: EventsQueue): EventsQueue | null {
    if (this.integrationId === 'saas') {
      return body;
    }

    const beforeBatchTransformer = this.transformers.beforeBatch;

    if (!beforeBatchTransformer) {
      return body;
    }

    const transformed = transformBatch(body, beforeBatchTransformer, this.integrationId || 'SenderManager');

    return transformed;
  }

  private async send(body: EventsQueue): Promise<boolean> {
    if (this.shouldSkipSend()) {
      return this.simulateSuccessfulSend();
    }

    // Check consent before sending
    if (!this.hasConsentForIntegration()) {
      log('debug', `Skipping send, no consent for integration${this.integrationId ? ` [${this.integrationId}]` : ''}`);
      return true; // Return true to avoid retries
    }

    // Apply beforeSend (per-event transformation, custom backend only in multi-integration)
    const afterBeforeSend = this.applyBeforeSendTransformer(body);

    if (!afterBeforeSend) {
      return true;
    }

    // Apply beforeBatch (batch-level transformation)
    const transformedBody = this.applyBeforeBatchTransformer(afterBeforeSend);

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
    // Apply beforeSend (per-event transformation, custom backend only in multi-integration)
    const afterBeforeSend = this.applyBeforeSendTransformer(body);

    if (!afterBeforeSend) {
      return true;
    }

    // Apply beforeBatch (batch-level transformation)
    const transformedBody = this.applyBeforeBatchTransformer(afterBeforeSend);

    if (!transformedBody) {
      return true;
    }

    const { url, payload } = this.prepareRequest(transformedBody);

    if (payload.length > MAX_BEACON_PAYLOAD_SIZE) {
      log(
        'warn',
        `Payload exceeds sendBeacon limit, persisting for recovery${this.integrationId ? ` [${this.integrationId}]` : ''}`,
        {
          data: {
            size: payload.length,
            limit: MAX_BEACON_PAYLOAD_SIZE,
            events: transformedBody.events.length,
          },
        },
      );

      this.persistEvents(transformedBody);

      return false;
    }

    const blob = new Blob([payload], { type: 'application/json' });

    if (!this.isSendBeaconAvailable()) {
      log(
        'warn',
        `sendBeacon not available, persisting events for recovery${this.integrationId ? ` [${this.integrationId}]` : ''}`,
      );

      this.persistEvents(transformedBody);
      return false;
    }

    const accepted = navigator.sendBeacon(url, blob);

    if (!accepted) {
      log(
        'warn',
        `sendBeacon rejected request, persisting events for recovery${this.integrationId ? ` [${this.integrationId}]` : ''}`,
      );

      this.persistEvents(transformedBody);
    }

    return accepted;
  }

  private prepareRequest(body: EventsQueue): { url: string; payload: string } {
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
      log('warn', `Failed to parse persisted data${this.integrationId ? ` [${this.integrationId}]` : ''}`, { error });
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
          log(
            'debug',
            `Skipping persistence, another tab recently persisted events${this.integrationId ? ` [${this.integrationId}]` : ''}`,
            {
              data: { timeSinceExisting },
            },
          );

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
      log('warn', `Failed to persist events${this.integrationId ? ` [${this.integrationId}]` : ''}`, { error });
      return false;
    }
  }

  private clearPersistedEvents(): void {
    try {
      const key = this.getQueueStorageKey();
      this.storeManager.removeItem(key);
    } catch (error) {
      log('warn', `Failed to clear persisted events${this.integrationId ? ` [${this.integrationId}]` : ''}`, { error });
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

  /**
   * Check if this integration has consent to send data
   */
  private hasConsentForIntegration(): boolean {
    const config = this.get('config');

    // If waitForConsent is not enabled, always allow
    if (!config?.waitForConsent) {
      return true;
    }

    // If no consent manager, can't check consent
    if (!this.consentManager) {
      return true; // Fail open if consent manager not available
    }

    // Map integration ID to consent integration type
    if (this.integrationId === 'saas') {
      return this.consentManager.hasConsent('tracelog');
    }

    if (this.integrationId === 'custom') {
      return this.consentManager.hasConsent('custom');
    }

    // Unknown integration, allow by default
    return true;
  }
}
