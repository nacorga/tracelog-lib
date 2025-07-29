import { QUEUE_KEY } from '../app.constants';
import { Config } from '../types/config.types';
import { Queue } from '../types/queue.types';
import { persistentStorage } from '../managers/storage-manager';
import { log } from '../utils/log.utils';
import { EventData } from '../types/event.types';

const RETRY_BACKOFF_INITIAL = 1000;
const RETRY_BACKOFF_MAX = 30_000;
const RATE_LIMIT_INTERVAL = 1000;
const EVENT_EXPIRY_HOURS = 24;

export class DataSender {
  private readonly config: Config;
  private readonly data: { apiUrl: string; userId: string };
  private readonly queueStorageKey: string;

  private retryDelay: number = RETRY_BACKOFF_INITIAL;
  private retryTimeoutId: number | null = null;
  private lastSendAttempt = 0;

  constructor(config: Config, data: { apiUrl: string; userId: string }) {
    this.config = config;
    this.data = data;
    this.queueStorageKey = `${QUEUE_KEY}_${data.userId}`;
  }

  async sendEventsQueue(body: Queue): Promise<boolean> {
    if (this.config.id === 'demo') {
      this.logDemoEvents(body.events);
      return true;
    }

    if (!this.canSendNow()) {
      return false;
    }

    this.lastSendAttempt = Date.now();

    try {
      const success = await this.sendWithPriority(body);

      if (success) {
        this.resetRetryState();
        this.clearPersistedEvents();
      } else {
        this.handleSendFailure(body);
      }

      return success;
    } catch (error) {
      this.logError('Failed to send events queue', error);
      this.handleSendFailure(body);
      return false;
    }
  }

  async recoverPersistedEvents(): Promise<void> {
    try {
      const persistedData = this.getPersistedData();

      if (!persistedData || !this.isDataRecent(persistedData) || persistedData.events.length === 0) {
        this.clearPersistedEvents();
        return;
      }

      const recoveryBody = this.createRecoveryBody(persistedData);
      const success = await this.sendWithPriority(recoveryBody);

      if (success) {
        this.clearPersistedEvents();
      } else {
        log('error', 'Failed to send recovered events, scheduling retry');
        this.scheduleRetry(recoveryBody);
      }
    } catch (error) {
      this.logError('Failed to recover persisted events', error);
    }
  }

  private canSendNow(): boolean {
    return Date.now() - this.lastSendAttempt >= RATE_LIMIT_INTERVAL;
  }

  private async sendWithPriority(body: Queue): Promise<boolean> {
    const blob = new Blob([JSON.stringify(body)], { type: 'application/json' });

    // Try sendBeacon first (most reliable for page unload)
    if (navigator.sendBeacon && navigator.sendBeacon(this.data.apiUrl, blob)) {
      return true;
    }

    // Fallback to fetch
    const response = await fetch(this.data.apiUrl, {
      method: 'POST',
      body: blob,
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
    });

    return response.ok;
  }

  private getPersistedData(): any | null {
    const persistedDataString = persistentStorage.getItem(this.queueStorageKey);
    return persistedDataString ? JSON.parse(persistedDataString) : null;
  }

  private isDataRecent(data: any): boolean {
    const ageInHours = (Date.now() - data.timestamp) / (1000 * 60 * 60);
    return ageInHours < EVENT_EXPIRY_HOURS;
  }

  private createRecoveryBody(data: any): Queue {
    return {
      user_id: data.userId,
      session_id: data.sessionId,
      device: data.device,
      events: data.events,
      ...(data.global_metadata && { global_metadata: data.global_metadata }),
    };
  }

  private logDemoEvents(events: EventData[]): void {
    events.forEach((event) => {
      log('info', `${event.type} event: ${JSON.stringify(event)}`);
    });
  }

  private handleSendFailure(body: Queue): void {
    this.persistFailedEvents(body);
    this.scheduleRetry(body);
  }

  private persistFailedEvents(body: Queue): void {
    try {
      const persistedData = {
        userId: body.user_id,
        sessionId: body.session_id,
        device: body.device,
        events: body.events,
        timestamp: Date.now(),
        ...(body.global_metadata && { global_metadata: body.global_metadata }),
      };

      persistentStorage.setItem(this.queueStorageKey, JSON.stringify(persistedData));
    } catch (error) {
      this.logError('Failed to persist events', error);
    }
  }

  private clearPersistedEvents(): void {
    try {
      persistentStorage.removeItem(this.queueStorageKey);
    } catch {
      // Ignore errors when clearing storage
    }
  }

  private resetRetryState(): void {
    this.retryDelay = RETRY_BACKOFF_INITIAL;
    this.clearRetryTimeout();
  }

  private scheduleRetry(body: Queue): void {
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

  private logError(message: string, error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log('error', `${message}: ${errorMessage}`);
  }
}
