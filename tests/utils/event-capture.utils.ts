import { Page } from '@playwright/test';
import { EventLogDispatch, EventLogDispatchFilter } from '../types';

/**
 * Captures tracelog:log events for E2E testing.
 * Events dispatched when NODE_ENV=dev with mode-based filtering.
 */
export class EventCapture {
  private page: Page | null = null;
  private events: EventLogDispatch[] = [];
  private isActive = false;

  /**
   * Start capturing events from the page
   */
  async startCapture(page: Page): Promise<void> {
    if (this.isActive) {
      throw new Error('Event capture is already active');
    }

    this.page = page;
    this.events = [];
    this.isActive = true;

    await this.page.exposeFunction('__tracelogEventCapture', (event: EventLogDispatch) => {
      this.events.push(event);
    });

    await this.page.evaluate(() => {
      window.addEventListener('tracelog:log', ((event: CustomEvent<EventLogDispatch>) => {
        (
          window as typeof window & { __tracelogEventCapture: (event: EventLogDispatch) => void }
        ).__tracelogEventCapture(event.detail);
      }) as EventListener);
    });
  }

  /**
   * Stop capturing events
   */
  async stopCapture(): Promise<void> {
    if (!this.isActive) {
      return;
    }

    this.isActive = false;
    this.page = null;
  }

  /**
   * Get all captured events, optionally filtered
   */
  getEvents(filter?: EventLogDispatchFilter): EventLogDispatch[] {
    if (!filter) {
      return [...this.events];
    }

    return this.events.filter((event) => {
      if (filter.namespace && event.namespace !== filter.namespace) {
        return false;
      }

      if (filter.messageContains && !event.message.includes(filter.messageContains)) {
        return false;
      }

      return true;
    });
  }

  /**
   * Wait for a specific event matching the filter
   */
  async waitForEvent(filter: EventLogDispatchFilter, timeout = 5000): Promise<EventLogDispatch> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const checkForEvent = (): void => {
        const matchingEvents = this.getEvents(filter);

        if (matchingEvents.length > 0) {
          resolve(matchingEvents[matchingEvents.length - 1]);
          return;
        }

        if (Date.now() - startTime > timeout) {
          reject(new Error(`Timeout waiting for event: ${JSON.stringify(filter)}`));
          return;
        }

        setTimeout(checkForEvent, 100);
      };

      checkForEvent();
    });
  }
}
