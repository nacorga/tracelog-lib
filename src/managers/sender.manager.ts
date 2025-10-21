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

/**
 * Manages sending event queues to configured API endpoints with persistence,
 * recovery, and multi-integration support.
 *
 * **Purpose**: Handles reliable event transmission to backend APIs with automatic
 * persistence for crash recovery and support for multiple integration backends.
 *
 * **Core Functionality**:
 * - **Event Transmission**: Sends event batches via `fetch()` (async) or `sendBeacon()` (sync)
 * - **Persistence & Recovery**: Stores failed events in localStorage, recovers on next page load
 * - **Multi-Integration**: Separate queues for SaaS (`tracelog`) and Custom backends
 * - **Multi-Tab Protection**: 1-second window prevents duplicate sends across tabs
 * - **Event Expiry**: Discards events older than 2 hours (prevents stale data accumulation)
 * - **Consent Integration**: Skips sends when consent not granted for integration
 * - **Transformer Support**: Applies `beforeBatch` transformer before network transmission
 *
 * **Key Features**:
 * - **NO Retries In-Session**: Events removed from queue immediately after send attempt
 * - **Recovery on Next Page**: Failed events persisted to localStorage, recovered on init
 * - **Payload Size Validation**: 64KB limit for `sendBeacon()` to prevent truncation
 * - **Permanent Error Detection**: 4xx status codes (except 408, 429) marked as permanent
 * - **Independent Multi-Integration**: Separate SenderManager instances for each backend
 * - **Consent-Aware**: Checks consent before sending, skips if consent not granted
 *
 * **Error Handling**:
 * - **4xx Errors** (permanent): Logged once per minute (throttled), events discarded
 * - **5xx Errors** (transient): Events persisted for recovery on next page
 * - **Network Errors**: Events persisted for recovery on next page
 * - **Timeout**: 30-second timeout, events persisted on timeout
 *
 * **Storage Keys**:
 * - **Standalone**: `tlog:{userId}:queue` (single queue)
 * - **SaaS Integration**: `tlog:{userId}:queue:saas`
 * - **Custom Integration**: `tlog:{userId}:queue:custom`
 *
 * **Multi-Tab Protection**:
 * - Persisted events include `lastPersistTime` timestamp
 * - Recovery skips events persisted within last 1 second (active tab may retry)
 *
 * @see src/managers/README.md (lines 82-139) for detailed documentation
 *
 * @example
 * ```typescript
 * // Standalone mode (no backend)
 * const sender = new SenderManager(storage);
 * const success = await sender.send(eventsQueue); // No-op, returns true
 *
 * // SaaS integration
 * const saasSender = new SenderManager(storage, 'saas', 'https://api.tracelog.io/collect', consentManager);
 * const success = await saasSender.send(eventsQueue);
 *
 * // Custom backend
 * const customSender = new SenderManager(storage, 'custom', 'https://myapi.com/events', consentManager);
 * const success = await customSender.send(eventsQueue);
 *
 * // Synchronous send (page unload)
 * const success = sender.sendQueueSync(eventsQueue); // Uses sendBeacon()
 * ```
 */
export class SenderManager extends StateManager {
  private readonly storeManager: StorageManager;
  private readonly integrationId?: 'saas' | 'custom';
  private readonly apiUrl?: string;
  private readonly consentManager: ConsentManager | null;
  private readonly transformers: TransformerMap;
  private lastPermanentErrorLog: { statusCode?: number; timestamp: number } | null = null;
  private recoveryInProgress = false;

  /**
   * Creates a SenderManager instance.
   *
   * **Validation**: `integrationId` and `apiUrl` must both be provided or both be undefined.
   * Throws error if only one is provided.
   *
   * @param storeManager - Storage manager for event persistence
   * @param integrationId - Optional integration identifier ('saas' or 'custom')
   * @param apiUrl - Optional API endpoint URL
   * @param consentManager - Optional consent manager for GDPR compliance
   * @param transformers - Optional event transformation hooks
   * @throws Error if integrationId and apiUrl are not both provided or both undefined
   */
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

  /**
   * Sends events synchronously using `navigator.sendBeacon()`.
   *
   * **Purpose**: Guarantees event delivery before page unload even if network is slow.
   *
   * **Use Cases**:
   * - Page unload (`beforeunload`, `pagehide` events)
   * - Tab close scenarios
   * - Any case where async send might be interrupted
   *
   * **Behavior**:
   * - Uses `navigator.sendBeacon()` (browser-queued, synchronous API)
   * - Payload size limited to 64KB (enforced by browser)
   * - Browser guarantees delivery attempt (survives page close)
   * - NO persistence on failure (fire-and-forget)
   *
   * **Consent Check**: Skips send if consent not granted for this integration
   *
   * **Return Values**:
   * - `true`: Send succeeded OR skipped (standalone mode, no consent)
   * - `false`: Send failed (network error, browser rejected beacon)
   *
   * **Important**: No retry mechanism for failures. Events are NOT persisted.
   *
   * @param body - Event queue to send
   * @returns `true` if send succeeded or was skipped, `false` if failed
   *
   * @see sendEventsQueue for async send with persistence
   * @see src/managers/README.md (lines 82-139) for send details
   */
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

  /**
   * Sends events asynchronously using `fetch()` API with automatic persistence on failure.
   *
   * **Purpose**: Reliable event transmission with localStorage fallback for failed sends.
   *
   * **Flow**:
   * 1. Calls internal `send()` method (applies transformers, consent checks)
   * 2. On success: Clears persisted events, invokes `onSuccess` callback
   * 3. On failure: Persists events to localStorage, invokes `onFailure` callback
   * 4. On permanent error (4xx): Clears persisted events (no retry)
   *
   * **Callbacks**:
   * - `onSuccess(eventCount, events, body)`: Called after successful transmission
   * - `onFailure()`: Called after failed transmission or permanent error
   *
   * **Error Handling**:
   * - **Permanent errors** (4xx except 408, 429): Events discarded, not persisted
   * - **Transient errors** (5xx, network, timeout): Events persisted for recovery
   *
   * **Consent Check**: Skips send if consent not granted for this integration
   *
   * **Important**: Events are NOT retried in-session. Persistence is for
   * recovery on next page load via `recoverPersistedEvents()`.
   *
   * @param body - Event queue to send
   * @param callbacks - Optional success/failure callbacks
   * @returns Promise resolving to `true` if send succeeded, `false` if failed
   *
   * @see recoverPersistedEvents for recovery flow
   * @see src/managers/README.md (lines 82-139) for send details
   */
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

  /**
   * Recovers and attempts to resend events persisted from previous session.
   *
   * **Purpose**: Zero data loss guarantee - recovers events that failed to send
   * in previous session due to network errors or crashes.
   *
   * **Flow**:
   * 1. Checks if recovery already in progress (prevents duplicate attempts)
   * 2. Checks consent for this integration (skips if no consent)
   * 3. Loads persisted events from localStorage
   * 4. Validates freshness (discards events older than 2 hours)
   * 5. Applies multi-tab protection (skips events persisted within 1 second)
   * 6. Attempts to resend via `send()` method
   * 7. On success: Clears persisted events, invokes `onSuccess` callback
   * 8. On failure: Keeps events in localStorage, invokes `onFailure` callback
   * 9. On permanent error (4xx): Clears persisted events (no further retry)
   *
   * **Multi-Tab Protection**:
   * - Events persisted within last 1 second are skipped (active tab may retry)
   * - Prevents duplicate sends when multiple tabs recover simultaneously
   *
   * **Event Expiry**:
   * - Events older than 2 hours are discarded (prevents stale data accumulation)
   * - Expiry check uses event timestamps, not persistence time
   *
   * **Consent Integration**:
   * - Skips recovery if consent not granted for this integration
   * - Events remain persisted for future recovery when consent obtained
   *
   * **Callbacks**:
   * - `onSuccess(eventCount, events, body)`: Called after successful transmission
   * - `onFailure()`: Called on send failure or permanent error
   *
   * **Called by**: `EventManager.recoverPersistedEvents()` during `App.init()`
   *
   * **Important**: This method is idempotent and safe to call multiple times.
   * Recovery flag prevents concurrent attempts.
   *
   * @param callbacks - Optional success/failure callbacks
   *
   * @example
   * ```typescript
   * await senderManager.recoverPersistedEvents({
   *   onSuccess: (count, events, body) => {
   *     console.log(`Recovered ${count} events`);
   *   },
   *   onFailure: () => {
   *     console.warn('Recovery failed, will retry on next init');
   *   }
   * });
   * ```
   *
   * @see src/managers/README.md (lines 82-139) for recovery details
   */
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

  /**
   * Cleanup method called during `App.destroy()`.
   *
   * **Purpose**: Reserved for future cleanup logic (currently no-op).
   *
   * **Note**: This method is intentionally empty. SenderManager has no
   * cleanup requirements (no timers, no event listeners, no active connections).
   * Persisted events are intentionally kept in localStorage for recovery.
   *
   * **Called by**: `EventManager.stop()` during application teardown
   */
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
