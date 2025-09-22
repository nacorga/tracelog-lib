import { Page } from '@playwright/test';
import {
  EventLogDispatch,
  EventLogDispatchFilter,
  EventCaptureOptions,
  EventWaitOptions,
  EventCaptureStats,
} from '../types';
import { LogLevel } from '../../src/types/log.types';
import { DEFAULT_TIMEOUT } from '../constants';

/**
 * Event capture utilities for TraceLog E2E testing
 *
 * This module provides comprehensive event capture functionality for testing
 * TraceLog event dispatching in development mode. Features include:
 * - Real-time event capture with filtering
 * - Async event waiting with configurable timeouts
 * - Memory-efficient event storage with limits
 * - Robust error handling and cleanup
 *
 * @example
 * ```typescript
 * const capture = new EventCapture();
 * await capture.startCapture(page);
 *
 * // Perform test actions...
 *
 * const events = capture.getEvents({ namespace: 'App' });
 * await capture.stopCapture();
 * ```
 */

/**
 * Enhanced event capture class for TraceLog testing
 *
 * Captures 'tracelog:log' events dispatched in development mode with
 * improved error handling, memory management, and filtering capabilities.
 */
export class EventCapture {
  private page: Page | null = null;
  private events: EventLogDispatch[] = [];
  private isActive = false;
  private isDisposed = false;
  private readonly maxEvents: number;
  private eventListenerCleanup?: () => void;

  /**
   * Creates a new EventCapture instance
   *
   * @param options - Configuration options for event capture
   */
  constructor(options: EventCaptureOptions = {}) {
    this.maxEvents = options.maxEvents ?? 1000;
  }

  /**
   * Starts capturing events from the specified page
   *
   * @param page - Playwright page instance to monitor
   * @param options - Additional capture options
   * @throws Will throw an error if capture is already active or page is invalid
   *
   * @example
   * ```typescript
   * await capture.startCapture(page, { clearPrevious: true });
   * ```
   */
  async startCapture(page: Page, options: { clearPrevious?: boolean } = {}): Promise<void> {
    if (this.isDisposed) {
      throw new Error('EventCapture instance has been disposed');
    }

    if (this.isActive) {
      throw new Error('Event capture is already active. Call stopCapture() first.');
    }

    if (!page) {
      throw new Error('Valid Playwright page instance is required');
    }

    this.page = page;
    this.isActive = true;

    if (options.clearPrevious) {
      this.events = [];
    }

    try {
      // Expose the capture function to the browser context
      await this.page.exposeFunction('__tracelogEventCapture', (event: EventLogDispatch) => {
        this.captureEvent(event);
      });

      // Set up event listener in the browser
      await this.page.evaluate(() => {
        const listener = ((event: CustomEvent<EventLogDispatch>) => {
          const captureFunc = (
            window as typeof window & {
              __tracelogEventCapture: (event: EventLogDispatch) => void;
            }
          ).__tracelogEventCapture;

          if (captureFunc && event.detail) {
            captureFunc(event.detail);
          }
        }) as EventListener;

        window.addEventListener('tracelog:log', listener);

        // Store cleanup function reference
        (window as typeof window & { __tracelogCleanup?: () => void }).__tracelogCleanup = (): void => {
          window.removeEventListener('tracelog:log', listener);
        };
      });

      this.eventListenerCleanup = async (): Promise<void> => {
        if (this.page) {
          try {
            await this.page.evaluate(() => {
              const cleanup = (window as typeof window & { __tracelogCleanup?: () => void }).__tracelogCleanup;
              if (cleanup) {
                cleanup();
                delete (window as typeof window & { __tracelogCleanup?: () => void }).__tracelogCleanup;
              }
            });
          } catch {
            // Page might be closed, ignore cleanup errors
          }
        }
      };
    } catch (error) {
      this.isActive = false;
      this.page = null;
      throw new Error(`Failed to start event capture: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Stops capturing events and cleans up resources
   *
   * @returns Promise that resolves when cleanup is complete
   */
  async stopCapture(): Promise<void> {
    if (!this.isActive) {
      return;
    }

    this.isActive = false;

    try {
      // Clean up browser-side event listeners
      if (this.eventListenerCleanup) {
        await this.eventListenerCleanup();
        this.eventListenerCleanup = undefined;
      }
    } catch (error) {
      // Log but don't throw - cleanup errors shouldn't fail the stop operation
      console.warn('Warning: Event capture cleanup encountered an error:', error);
    } finally {
      this.page = null;
    }
  }

  /**
   * Retrieves captured events, optionally filtered by criteria
   *
   * @param filter - Optional filter criteria
   * @returns Array of matching events (defensive copy)
   *
   * @example
   * ```typescript
   * // Get all events
   * const allEvents = capture.getEvents();
   *
   * // Get events from specific namespace
   * const appEvents = capture.getEvents({ namespace: 'App' });
   *
   * // Get events containing specific text
   * const errorEvents = capture.getEvents({ messageContains: 'error' });
   * ```
   */
  getEvents(filter?: EventLogDispatchFilter): EventLogDispatch[] {
    if (this.isDisposed) {
      return [];
    }

    const eventsToFilter = [...this.events]; // Defensive copy

    if (!filter) {
      return eventsToFilter;
    }

    return eventsToFilter.filter((event) => {
      // Namespace filter
      if (filter.namespace && event.namespace !== filter.namespace) {
        return false;
      }

      // Message content filter
      if (filter.messageContains && !event.message.includes(filter.messageContains)) {
        return false;
      }

      // Level filter
      if (filter.level && event.level !== filter.level) {
        return false;
      }

      // Time range filter
      if (filter.since || filter.until) {
        const eventTime = new Date(event.timestamp).getTime();

        if (filter.since && eventTime < filter.since.getTime()) {
          return false;
        }

        if (filter.until && eventTime > filter.until.getTime()) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Waits for a specific event matching the filter criteria
   *
   * @param filter - Filter criteria for the expected event
   * @param options - Wait options including timeout and polling
   * @returns Promise resolving to the matching event
   * @throws Will throw an error if timeout is exceeded or capture is inactive
   *
   * @example
   * ```typescript
   * // Wait for app initialization event
   * const initEvent = await capture.waitForEvent(
   *   { namespace: 'App', messageContains: 'initialized' },
   *   { timeout: 10000, description: 'app initialization' }
   * );
   * ```
   */
  async waitForEvent(filter: EventLogDispatchFilter, options: EventWaitOptions = {}): Promise<EventLogDispatch> {
    const { timeout = DEFAULT_TIMEOUT, interval = 100, description = 'matching event', returnLatest = true } = options;

    if (this.isDisposed) {
      throw new Error('EventCapture instance has been disposed');
    }

    if (!this.isActive) {
      throw new Error('Event capture is not active. Call startCapture() first.');
    }

    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const checkForEvent = (): void => {
        try {
          const matchingEvents = this.getEvents(filter);

          if (matchingEvents.length > 0) {
            const eventToReturn = returnLatest ? matchingEvents[matchingEvents.length - 1] : matchingEvents[0];
            resolve(eventToReturn);
            return;
          }

          if (Date.now() - startTime > timeout) {
            const filterDescription = this.formatFilterForError(filter);
            reject(new Error(`Timeout waiting for ${description} after ${timeout}ms. Filter: ${filterDescription}`));
            return;
          }

          // Continue polling if not disposed and still active
          if (!this.isDisposed && this.isActive) {
            setTimeout(checkForEvent, interval);
          } else {
            reject(new Error('Event capture was stopped or disposed while waiting'));
          }
        } catch (error) {
          reject(new Error(`Error while waiting for event: ${error instanceof Error ? error.message : String(error)}`));
        }
      };

      checkForEvent();
    });
  }

  /**
   * Waits for multiple events matching different filter criteria
   *
   * @param filters - Array of filter criteria for expected events
   * @param options - Wait options including timeout
   * @returns Promise resolving to array of matching events
   */
  async waitForEvents(filters: EventLogDispatchFilter[], options: EventWaitOptions = {}): Promise<EventLogDispatch[]> {
    const promises = filters.map((filter, index) =>
      this.waitForEvent(filter, {
        ...options,
        description: options.description ? `${options.description}[${index}]` : `event ${index}`,
      }),
    );

    return Promise.all(promises);
  }

  /**
   * Clears all captured events
   */
  clearEvents(): void {
    if (!this.isDisposed) {
      this.events = [];
    }
  }

  /**
   * Gets statistics about captured events
   *
   * @returns Object containing event counts and statistics
   */
  getStats():
    | EventCaptureStats
    | { total: number; byNamespace: Record<string, never>; byLevel: Record<string, never>; isDisposed: boolean } {
    if (this.isDisposed) {
      return { total: 0, byNamespace: {}, byLevel: {}, isDisposed: true };
    }

    const byNamespace: Record<string, number> = {};
    const byLevel: Record<string, number> = {};

    this.events.forEach((event) => {
      byNamespace[event.namespace] = (byNamespace[event.namespace] || 0) + 1;
      byLevel[event.level] = (byLevel[event.level] || 0) + 1;
    });

    return {
      total: this.events.length,
      byNamespace,
      byLevel,
      maxEvents: this.maxEvents,
      isActive: this.isActive,
      isDisposed: this.isDisposed,
    };
  }

  /**
   * Disposes the event capture instance and releases all resources
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }

    this.isDisposed = true;
    this.isActive = false;
    this.events = [];
    this.page = null;
    this.eventListenerCleanup = undefined;
  }

  /**
   * Internal method to capture and store events with memory management
   */
  private captureEvent(event: EventLogDispatch): void {
    if (this.isDisposed || !this.isActive) {
      return;
    }

    try {
      // Validate event structure
      if (!this.isValidEvent(event)) {
        console.warn('Invalid event structure received:', event);
        return;
      }

      // Add timestamp if not present
      const eventWithTimestamp: EventLogDispatch = {
        ...event,
        timestamp: event.timestamp || new Date().toISOString(),
      };

      this.events.push(eventWithTimestamp);

      // Implement memory management by limiting event count
      if (this.events.length > this.maxEvents) {
        const eventsToRemove = this.events.length - this.maxEvents;
        this.events.splice(0, eventsToRemove);
      }
    } catch (error) {
      console.warn('Error capturing event:', error);
    }
  }

  /**
   * Validates event structure
   */
  private isValidEvent(event: unknown): event is EventLogDispatch {
    if (!event || typeof event !== 'object') {
      return false;
    }

    const e = event as Partial<EventLogDispatch>;
    return !!(e.namespace && e.message && e.level);
  }

  /**
   * Formats filter criteria for error messages
   */
  private formatFilterForError(filter: EventLogDispatchFilter): string {
    const parts: string[] = [];

    if (filter.namespace) parts.push(`namespace:${filter.namespace}`);
    if (filter.messageContains) parts.push(`message:*${filter.messageContains}*`);
    if (filter.level) parts.push(`level:${filter.level}`);

    return parts.join(', ') || 'no filter';
  }
}

/**
 * Creates a new EventCapture instance with optional configuration
 *
 * @param options - Configuration options for the event capture
 * @returns New EventCapture instance
 *
 * @example
 * ```typescript
 * const capture = createEventCapture({ maxEvents: 500 });
 * ```
 */
export function createEventCapture(options?: EventCaptureOptions): EventCapture {
  return new EventCapture(options);
}

/**
 * Utility function to create common event filters
 */
export const createFilter = {
  /**
   * Creates a filter for events from a specific namespace
   */
  byNamespace: (namespace: string): EventLogDispatchFilter => ({ namespace }),

  /**
   * Creates a filter for events containing specific message text
   */
  byMessage: (messageContains: string): EventLogDispatchFilter => ({ messageContains }),

  /**
   * Creates a filter for events of a specific level
   */
  byLevel: (level: LogLevel): EventLogDispatchFilter => ({ level }),

  /**
   * Creates a filter combining namespace and message criteria
   */
  byNamespaceAndMessage: (namespace: string, messageContains: string): EventLogDispatchFilter => ({
    namespace,
    messageContains,
  }),

  /**
   * Creates a filter for events within a time range
   */
  byTimeRange: (since: Date, until?: Date): EventLogDispatchFilter => ({ since, until }),
};
