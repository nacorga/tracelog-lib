import { RETRY_BACKOFF_INITIAL, RETRY_BACKOFF_MAX } from '../constants';
import { Queue, AdminError, EventType, StorageKey } from '../types';
import { SafeLocalStorage, StorageManager } from '../utils';

export class DataSender {
  private retryDelay: number = RETRY_BACKOFF_INITIAL;
  private retryTimeoutId: number | null = null;
  private lastSendAttempt = 0;
  private sendAttempts = 0;
  private readonly storage: StorageManager;

  constructor(
    private readonly apiUrl: string,
    private readonly isQaMode: () => boolean,
    private readonly isDemoMode = false,
  ) {
    this.storage = new SafeLocalStorage();
  }

  async sendEventsQueue(body: Queue): Promise<boolean> {
    if (this.isDemoMode) {
      for (const event of body.events) {
        console.log(`[TraceLog] ${event.type} event:`, JSON.stringify(event));
      }

      return true;
    }

    const now = Date.now();

    // Rate limiting: prevent too frequent sends
    if (now - this.lastSendAttempt < 1000) {
      return false;
    }

    this.lastSendAttempt = now;
    this.sendAttempts++;

    const isSendSuccess = await this.collectEventsQueue(body);

    if (isSendSuccess) {
      this.retryDelay = RETRY_BACKOFF_INITIAL;
      this.sendAttempts = 0;
      this.clearRetryTimeout();
      this.clearPersistedEvents(body.user_id);
      return true;
    } else {
      // If there are critical events and sending failed, try different approach
      const hasCriticalEvents = body.events.some(
        (event) => event.type === EventType.SESSION_END || event.type === EventType.SESSION_START,
      );

      if (hasCriticalEvents) {
        await this.forceImmediateSend(body);
      } else {
        this.scheduleRetry(body);
      }
      return false;
    }
  }

  sendEventsSynchronously(body: Queue): boolean {
    if (this.isDemoMode) {
      for (const event of body.events) {
        console.log(`[TraceLog] ${event.type} event:`, JSON.stringify(event));
      }

      return true;
    }

    const blob = new Blob([JSON.stringify(body)], { type: 'application/json' });

    if (navigator.sendBeacon) {
      const success = navigator.sendBeacon(this.apiUrl, blob);

      if (this.isQaMode()) {
        console.log(`[TraceLog] Synchronous send via sendBeacon: ${success ? 'SUCCESS' : 'FAILED'}`);
      }

      if (success) {
        this.clearPersistedEvents(body.user_id);
      }

      return success;
    }

    try {
      const xhr = new XMLHttpRequest();

      xhr.open('POST', this.apiUrl, false);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(body));

      const success = xhr.status >= 200 && xhr.status < 300;

      if (this.isQaMode()) {
        console.log(`[TraceLog] Synchronous send via XHR: ${success ? 'SUCCESS' : 'FAILED'}`);
      }

      if (success) {
        this.clearPersistedEvents(body.user_id);
      }

      return success;
    } catch (error) {
      if (this.isQaMode()) {
        console.error('[TraceLog] Synchronous send failed:', error);
      }

      return false;
    }
  }

  private async collectEventsQueue(body: Queue): Promise<boolean> {
    const blob = new Blob([JSON.stringify(body)], { type: 'application/json' });

    if (navigator.sendBeacon) {
      const ok = navigator.sendBeacon(this.apiUrl, blob);

      if (ok) {
        return true;
      }
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        body: blob,
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
      });

      return response.status >= 200 && response.status < 300;
    } catch (error) {
      if (this.isQaMode()) {
        console.error(
          'TraceLog error: failed to send events queue',
          error instanceof Error ? error.message : 'Unknown error',
        );
      }

      return false;
    }
  }

  private async forceImmediateSend(body: Queue): Promise<void> {
    const blob = new Blob([JSON.stringify(body)], { type: 'application/json' });

    if (navigator.sendBeacon) {
      const success = navigator.sendBeacon(this.apiUrl, blob);

      if (success) {
        this.clearPersistedEvents(body.user_id);
        return;
      }
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        body: blob,
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status >= 200 && response.status < 300) {
        this.clearPersistedEvents(body.user_id);
      } else {
        this.persistCriticalEvents(body);
        this.scheduleRetry(body);
      }
    } catch (error) {
      this.persistCriticalEvents(body);
      this.scheduleRetry(body);

      if (this.isQaMode()) {
        console.error(
          'TraceLog error: failed to force send critical events, persisting to localStorage',
          error instanceof Error ? error.message : 'Unknown error',
        );
      }
    }
  }

  persistCriticalEvents(body: Queue): void {
    try {
      const criticalEvents = body.events.filter(
        (event) => event.type === EventType.SESSION_END || event.type === EventType.SESSION_START,
      );

      if (criticalEvents.length > 0) {
        const persistedData = {
          userId: body.user_id,
          sessionId: body.session_id,
          device: body.device,
          events: criticalEvents,
          timestamp: Date.now(),
          ...(body.global_metadata && { global_metadata: body.global_metadata }),
        };

        this.storage.set(`${StorageKey.UserId}_${body.user_id}_critical_events`, persistedData);

        if (this.isQaMode()) {
          console.log('[TraceLog] Critical events persisted to storage');
        }
      }
    } catch (error) {
      if (this.isQaMode()) {
        console.error('[TraceLog] Failed to persist critical events:', error);
      }
    }
  }

  clearPersistedEvents(userId: string): void {
    try {
      this.storage.remove(`${StorageKey.UserId}_${userId}_critical_events`);
    } catch {
      // Ignore errors when clearing localStorage
    }
  }

  async recoverPersistedEvents(userId: string): Promise<void> {
    try {
      const persistedData = this.storage.get(`${StorageKey.UserId}_${userId}_critical_events`);

      if (persistedData) {
        const data = persistedData as any;

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

          const success = await this.collectEventsQueue(recoveryBody);

          if (success) {
            this.clearPersistedEvents(userId);

            if (this.isQaMode()) {
              console.log('[TraceLog] Successfully recovered and sent persisted critical events');
            }
          } else {
            if (this.isQaMode()) {
              console.error('[TraceLog] Failed to send recovered events, scheduling retry');
            }

            this.scheduleRetry(recoveryBody);
          }
        } else {
          this.clearPersistedEvents(userId);
        }
      }
    } catch (error) {
      if (this.isQaMode()) {
        console.error('[TraceLog] Failed to recover persisted events:', error);
      }
    }
  }

  async sendError(error: AdminError): Promise<void> {
    if (this.isDemoMode) {
      console.error(error.message);
      return;
    }

    const blob = new Blob([JSON.stringify(error)], { type: 'application/json' });

    if (navigator.sendBeacon) {
      const ok = navigator.sendBeacon(`${this.apiUrl}/error`, blob);

      if (ok) {
        return;
      }
    }

    try {
      await fetch(`${this.apiUrl}/error`, {
        method: 'POST',
        body: blob,
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      if (this.isQaMode()) {
        console.error('TraceLog error: failed to send error', error instanceof Error ? error.message : 'Unknown error');
      }
    }

    if (this.isQaMode()) {
      console.error(error.message);
    }
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

  cleanup(): void {
    this.clearRetryTimeout();
  }
}
