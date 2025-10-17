import {
  QUEUE_KEY,
  EVENT_EXPIRY_HOURS,
  REQUEST_TIMEOUT_MS,
  PERMANENT_ERROR_LOG_THROTTLE_MS,
  MAX_BEACON_PAYLOAD_SIZE,
  PERSISTENCE_THROTTLE_MS,
} from '../constants';
import { PersistedEventsQueue, EventsQueue, PermanentError } from '../types';
import { log } from '../utils';
import { StorageManager } from './storage.manager';
import { StateManager } from './state.manager';

interface SendCallbacks {
  onSuccess?: (eventCount?: number, events?: any[], body?: EventsQueue) => void;
  onFailure?: () => void;
}

export class SenderManager extends StateManager {
  private readonly storeManager: StorageManager;

  private lastPermanentErrorLog: { statusCode?: number; timestamp: number } | null = null;
  private recoveryInProgress = false;

  constructor(storeManager: StorageManager) {
    super();
    this.storeManager = storeManager;
  }

  private getQueueStorageKey(): string {
    const userId = this.get('userId') || 'anonymous';
    return QUEUE_KEY(userId);
  }

  sendEventsQueueSync(payloads: { saas?: EventsQueue; custom?: EventsQueue }): boolean {
    if (this.shouldSkipSend()) {
      return true;
    }

    const urls = this.get('collectApiUrls');
    const destinations = this.buildDestinationMap(urls, payloads);

    const results = destinations.map(({ url, payload }) => this.sendQueueSyncInternal(url, payload));
    const anySuccess = results.some((result) => result);

    if (!anySuccess) {
      const firstPayload = payloads.saas ?? payloads.custom;

      if (firstPayload) {
        this.persistEvents(firstPayload);
      }
    }

    return anySuccess;
  }

  async sendEventsQueue(
    payloads: { saas?: EventsQueue; custom?: EventsQueue },
    callbacks?: SendCallbacks,
  ): Promise<boolean> {
    const urls = this.get('collectApiUrls');
    const destinations = this.buildDestinationMap(urls, payloads);

    if (destinations.length === 0) {
      this.handleNoDestinations(payloads, callbacks);
      return true;
    }

    const results = await Promise.allSettled(
      destinations.map(async ({ name, url, payload }) => this.sendToDestination(name, url, payload)),
    );

    const successCount = results.filter((r) => r.status === 'fulfilled' && r.value.success).length;
    const anySuccess = successCount > 0;

    this.handleSendResults(anySuccess, successCount, destinations.length, payloads, callbacks);

    return anySuccess;
  }

  private buildDestinationMap(
    urls: { saas: string; custom: string },
    payloads: { saas?: EventsQueue; custom?: EventsQueue },
  ): Array<{ name: string; url: string; payload: EventsQueue }> {
    const destinations: Array<{ name: string; url: string; payload: EventsQueue }> = [];

    if (urls.saas && payloads.saas) {
      destinations.push({ name: 'saas', url: urls.saas, payload: payloads.saas });
    }

    if (urls.custom && payloads.custom) {
      destinations.push({ name: 'custom', url: urls.custom, payload: payloads.custom });
    }

    return destinations;
  }

  private handleNoDestinations(
    payloads: { saas?: EventsQueue; custom?: EventsQueue },
    callbacks?: SendCallbacks,
  ): void {
    const firstPayload = payloads.saas ?? payloads.custom;

    if (firstPayload) {
      callbacks?.onSuccess?.(firstPayload.events.length, firstPayload.events, firstPayload);
    }
  }

  private handleSendResults(
    anySuccess: boolean,
    successCount: number,
    totalCount: number,
    payloads: { saas?: EventsQueue; custom?: EventsQueue },
    callbacks?: SendCallbacks,
  ): void {
    if (anySuccess) {
      log('info', 'Events sent successfully', {
        data: { successful: successCount, total: totalCount },
      });

      this.clearPersistedEvents();

      const firstPayload = payloads.saas ?? payloads.custom;

      if (firstPayload) {
        callbacks?.onSuccess?.(firstPayload.events.length, firstPayload.events, firstPayload);
      }
    } else {
      log('warn', 'All destinations failed, persisting for recovery', {
        data: { destinations: totalCount },
      });

      const firstPayload = payloads.saas ?? payloads.custom;

      if (firstPayload) {
        this.persistEvents(firstPayload);
      }

      callbacks?.onFailure?.();
    }
  }

  private async sendToDestination(
    destination: string,
    url: string,
    payload: EventsQueue,
  ): Promise<{ destination: string; success: boolean }> {
    try {
      const success = await this.send(url, payload);

      if (!success) {
        log('warn', `Failed to send to ${destination}`, {
          data: { url: this.maskUrl(url) },
        });
      }

      return { destination, success };
    } catch (error) {
      if (error instanceof PermanentError) {
        this.logPermanentError(`Permanent error for ${destination}`, error);
      } else {
        log('error', `Error sending to ${destination}`, {
          error,
          data: { url: this.maskUrl(url) },
        });
      }

      return { destination, success: false };
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

      const { ...body } = persistedData;
      const payloads = { saas: body, custom: body };
      const success = await this.sendEventsQueue(payloads, callbacks);

      if (!success) {
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

  private async send(url: string, body: EventsQueue): Promise<boolean> {
    if (this.shouldSkipSend()) {
      return this.simulateSuccessfulSend();
    }

    const payload = this.preparePayload(body);

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
          url: this.maskUrl(url),
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

  private sendQueueSyncInternal(url: string, body: EventsQueue): boolean {
    const payload = this.preparePayload(body);

    if (payload.length > MAX_BEACON_PAYLOAD_SIZE) {
      log('warn', 'Payload exceeds sendBeacon limit', {
        data: {
          size: payload.length,
          limit: MAX_BEACON_PAYLOAD_SIZE,
          events: body.events.length,
        },
      });

      return false;
    }

    const blob = new Blob([payload], { type: 'application/json' });

    if (!this.isSendBeaconAvailable()) {
      log('warn', 'sendBeacon not available');
      return false;
    }

    const accepted = navigator.sendBeacon(url, blob);

    if (!accepted) {
      log('warn', 'sendBeacon rejected request', {
        data: { url: this.maskUrl(url) },
      });
    }

    return accepted;
  }

  private preparePayload(body: EventsQueue): string {
    const enrichedBody = {
      ...body,
      _metadata: {
        referer: typeof window !== 'undefined' ? window.location.href : undefined,
        timestamp: Date.now(),
      },
    };

    return JSON.stringify(enrichedBody);
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
    const urls = this.get('collectApiUrls');
    return !urls.saas && !urls.custom;
  }

  private maskUrl(url: string): string {
    try {
      const parsed = new URL(url);
      return `${parsed.protocol}//${parsed.hostname}/***`;
    } catch {
      return '[INVALID URL]';
    }
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
