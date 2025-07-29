import { RETRY_BACKOFF_INITIAL, RETRY_BACKOFF_MAX } from '../app.constants';
import { Config } from '../types/config.types';
import { Queue } from '../types/queue.types';
import { persistentStorage } from './storage-manager';
import { log } from '../utils/log.utils';

export class DataSender {
  private readonly config: Config;
  private readonly data: { apiUrl: string };

  private retryDelay: number = RETRY_BACKOFF_INITIAL;
  private retryTimeoutId: number | null = null;
  private lastSendAttempt = 0;

  constructor(config: Config, data: { apiUrl: string }) {
    this.config = config;
    this.data = data;
  }

  async sendEventsQueue(body: Queue): Promise<boolean> {
    if (this.config.id === 'demo') {
      this.logDemoEvents(body.events);
      return true;
    }

    const now = Date.now();

    // Rate limiting: prevent too frequent sends
    if (now - this.lastSendAttempt < 1000) {
      return false;
    }

    this.lastSendAttempt = now;

    const success = await this.sendWithPriority(body);

    if (success) {
      this.resetRetryState();
      this.clearPersistedEvents(body.user_id);
      return true;
    } else {
      this.handleSendFailure(body);
      return false;
    }
  }

  // sendEventsSynchronously(body: Queue): boolean {
  //   if (this.config.id === 'demo') {
  //     this.logDemoEvents(body.events);
  //     return true;
  //   }

  //   const blob = new Blob([JSON.stringify(body)], { type: 'application/json' });

  //   // Try beacon first
  //   if (navigator.sendBeacon) {
  //     const success = navigator.sendBeacon(this.data.apiUrl, blob);
  //     if (success) {
  //       this.clearPersistedEvents(body.user_id);
  //       return true;
  //     }
  //   }

  //   // Fallback to synchronous XHR
  //   try {
  //     const xhr = new XMLHttpRequest();
  //     xhr.open('POST', this.data.apiUrl, false);
  //     xhr.setRequestHeader('Content-Type', 'application/json');
  //     xhr.send(JSON.stringify(body));

  //     const success = xhr.status >= 200 && xhr.status < 300;
  //     if (success) {
  //       this.clearPersistedEvents(body.user_id);
  //     } else {
  //       this.persistFailedEvents(body);
  //     }

  //     return success;
  //   } catch (error) {
  //     log('error', `Synchronous send failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  //     this.persistFailedEvents(body);
  //     return false;
  //   }
  // }

  async recoverPersistedEvents(userId: string): Promise<void> {
    try {
      const storageKey = `tl:queue_${userId}`;
      const persistedDataString = persistentStorage.getItem(storageKey);

      if (persistedDataString) {
        const data = JSON.parse(persistedDataString);

        // Only try to recover if the events are recent (less than 24 hours)
        const isRecent = Date.now() - data.timestamp < 24 * 60 * 60 * 1000;

        if (isRecent && data.events.length > 0) {
          const recoveryBody: Queue = {
            user_id: data.userId,
            session_id: data.sessionId,
            device: data.device,
            events: data.events,
            ...(data.global_metadata && { global_metadata: data.global_metadata }),
          };

          const success = await this.sendWithPriority(recoveryBody);

          if (success) {
            this.clearPersistedEvents(userId);
          } else {
            log('error', 'Failed to send recovered events, scheduling retry');
            this.scheduleRetry(recoveryBody);
          }
        } else {
          this.clearPersistedEvents(userId);
        }
      }
    } catch (error) {
      log('error', `Failed to recover persisted events: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // cleanup(): void {
  //   this.clearRetryTimeout();
  // }

  private async sendWithPriority(body: Queue): Promise<boolean> {
    const blob = new Blob([JSON.stringify(body)], { type: 'application/json' });

    if (navigator.sendBeacon) {
      const success = navigator.sendBeacon(this.data.apiUrl, blob);

      if (success) {
        return true;
      }
    }

    try {
      const response = await fetch(this.data.apiUrl, {
        method: 'POST',
        body: blob,
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
      });

      return response.status >= 200 && response.status < 300;
    } catch (error) {
      throw new Error(`Failed to send events: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private logDemoEvents(events: any[]): void {
    for (const event of events) {
      log('info', `${event.type} event: ${JSON.stringify(event)}`);
    }
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

      const storageKey = `tl_queue_${body.user_id}`;
      persistentStorage.setItem(storageKey, JSON.stringify(persistedData));
    } catch (error) {
      log('error', `Failed to persist events: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private clearPersistedEvents(userId: string): void {
    try {
      const storageKey = `tl_queue_${userId}`;
      persistentStorage.removeItem(storageKey);
    } catch {
      // Ignore errors when clearing localStorage
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
}
