import { Page } from '@playwright/test';
import { TraceLogEvent, EventFilter } from '../types';

/**
 * Simple event capture utility for TraceLog E2E testing
 */
export class EventCapture {
  private page: Page | null = null;
  private events: TraceLogEvent[] = [];
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

    await this.page.exposeFunction('__tracelogEventCapture', (event: TraceLogEvent) => {
      this.events.push(event);
    });

    await this.page.evaluate(() => {
      window.addEventListener('tracelog:qa', ((event: CustomEvent<TraceLogEvent>) => {
        (window as any).__tracelogEventCapture(event.detail);
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
  getEvents(filter?: EventFilter): TraceLogEvent[] {
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
  async waitForEvent(filter: EventFilter, timeout = 5000): Promise<TraceLogEvent> {
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
