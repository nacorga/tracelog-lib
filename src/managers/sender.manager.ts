import { QUEUE_KEY } from '../app.constants';
import { Queue } from '../types/queue.types';
import { StorageManager } from './storage.manager';
import { StateManager } from './state.manager';
import { log } from '../utils';

const RETRY_BACKOFF_INITIAL = 1000;
const RETRY_BACKOFF_MAX = 30_000;
const RATE_LIMIT_INTERVAL = 1000;
const EVENT_EXPIRY_HOURS = 24;

export class SenderManager extends StateManager {
  private readonly storeManager: StorageManager;
  private readonly queueStorageKey: string;

  private retryDelay: number = RETRY_BACKOFF_INITIAL;
  private retryTimeoutId: number | null = null;
  private lastSendAttempt = 0;

  constructor(storeManager: StorageManager) {
    super();

    this.storeManager = storeManager;
    this.queueStorageKey = `${QUEUE_KEY}_${this.get('userId')}`;
    this.recoverPersistedEvents();
  }

  sendEventsQueue(body: Queue): boolean {
    if (this.get('config')?.qaMode) {
      this.logQueue(body);

      return true;
    }

    if (!this.canSendNow()) {
      return false;
    }

    this.lastSendAttempt = Date.now();

    try {
      const success = this.sendQueue(body);

      if (success) {
        this.resetRetryState();
        this.clearPersistedEvents();
      } else {
        this.handleSendFailure(body);
      }

      return success;
    } catch {
      this.handleSendFailure(body);

      return false;
    }
  }

  recoverPersistedEvents(): void {
    try {
      const persistedData = this.getPersistedData();

      if (!persistedData || !this.isDataRecent(persistedData) || persistedData.events.length === 0) {
        this.clearPersistedEvents();

        return;
      }

      const recoveryBody = this.createRecoveryBody(persistedData);
      const success = this.sendQueue(recoveryBody);

      if (success) {
        this.clearPersistedEvents();
      } else {
        this.scheduleRetry(recoveryBody);
      }
    } catch (error) {
      this.logError('Failed to recover persisted events', error);
    }
  }

  private canSendNow(): boolean {
    return Date.now() - this.lastSendAttempt >= RATE_LIMIT_INTERVAL;
  }

  private sendQueue(body: Queue): boolean {
    const blob = new Blob([JSON.stringify(body)], { type: 'application/json' });

    if (navigator.sendBeacon && navigator.sendBeacon(this.get('apiUrl'), blob)) {
      return true;
    }

    return false;
  }

  private getPersistedData(): any | null {
    const persistedDataString = this.storeManager.getItem(this.queueStorageKey);
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

  private logQueue(queue: Queue): void {
    log(
      'info',
      `Queue structure: ${JSON.stringify({
        user_id: queue.user_id,
        session_id: queue.session_id,
        device: queue.device,
        events_count: queue.events.length,
        has_global_metadata: !!queue.global_metadata,
      })}`,
    );
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

      this.storeManager.setItem(this.queueStorageKey, JSON.stringify(persistedData));
    } catch (error) {
      this.logError('Failed to persist events', error);
    }
  }

  private clearPersistedEvents(): void {
    this.storeManager.removeItem(this.queueStorageKey);
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
