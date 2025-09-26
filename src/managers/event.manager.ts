import {
  EVENT_SENT_INTERVAL_MS,
  EVENT_SENT_INTERVAL_TEST_MS,
  MAX_EVENTS_QUEUE_LENGTH,
  DUPLICATE_EVENT_THRESHOLD_MS,
} from '../constants/config.constants';
import { BaseEventsQueueDto, EventData, EventType } from '../types';
import { getUTMParameters, isUrlPathExcluded } from '../utils';
import { debugLog } from '../utils/logging';
import { SenderManager } from './sender.manager';
import { StateManager } from './state.manager';
import { StorageManager } from './storage.manager';
import { GoogleAnalyticsIntegration } from '../integrations/google-analytics.integration';

/**
 * EventManager - Core event tracking and queue management
 *
 * Responsibilities:
 * - Track user events (clicks, scrolls, page views, custom events)
 * - Queue events and batch send them to the analytics API
 * - Handle deduplication of similar events
 * - Manage event sending intervals and retry logic
 * - Integrate with Google Analytics when configured
 */
export class EventManager extends StateManager {
  private readonly googleAnalytics: GoogleAnalyticsIntegration | null;
  private readonly dataSender: SenderManager;

  private eventsQueue: EventData[] = [];
  private lastEventFingerprint: string | null = null;
  private lastEventTime = 0;
  private sendIntervalId: number | null = null;

  constructor(storeManager: StorageManager, googleAnalytics: GoogleAnalyticsIntegration | null = null) {
    super();

    this.googleAnalytics = googleAnalytics;
    this.dataSender = new SenderManager(storeManager);

    debugLog.debug('EventManager', 'EventManager initialized', {
      hasGoogleAnalytics: !!googleAnalytics,
    });
  }

  /**
   * Recovers persisted events from localStorage
   * Should be called after initialization to recover any events that failed to send
   */
  async recoverPersistedEvents(): Promise<void> {
    await this.dataSender.recoverPersistedEvents({
      onSuccess: (eventCount, recoveredEvents) => {
        if (recoveredEvents && recoveredEvents.length > 0) {
          const eventIds = recoveredEvents.map((e) => e.timestamp + '_' + e.type);
          this.removeProcessedEvents(eventIds);

          debugLog.debug('EventManager', 'Removed recovered events from queue', {
            removedCount: recoveredEvents.length,
            remainingQueueLength: this.eventsQueue.length,
          });
        }

        debugLog.info('EventManager', 'Events recovered successfully', {
          eventCount: eventCount ?? 0,
        });
      },
      onFailure: async () => {
        debugLog.warn('EventManager', 'Failed to recover persisted events');
      },
    });
  }

  /**
   * Track user events with automatic deduplication and queueing
   */
  track({
    type,
    page_url,
    from_page_url,
    scroll_data,
    click_data,
    custom_event,
    web_vitals,
    session_end_reason,
    session_start_recovered,
  }: Partial<EventData>): void {
    if (!type) {
      debugLog.warn('EventManager', 'Event type is required');
      return;
    }

    // Skip if sampling filter rejects event
    if (!this.shouldSample()) {
      debugLog.debug('EventManager', 'Event filtered by sampling');
      return;
    }

    // Build event payload
    const currentPageUrl = (page_url as string) || this.get('pageUrl');
    const payload = this.buildEventPayload({
      type: type as EventType,
      page_url: currentPageUrl,
      from_page_url,
      scroll_data,
      click_data,
      custom_event,
      web_vitals,
      session_end_reason,
      session_start_recovered,
    });

    // Check URL exclusions
    if (this.isEventExcluded(payload)) {
      return;
    }

    // Check for duplicates
    if (this.isDuplicateEvent(payload)) {
      debugLog.debug('EventManager', 'Duplicate event filtered', { type });
      return;
    }

    // Add to queue and schedule sending
    this.addToQueue(payload);
  }

  stop(): void {
    // Clear interval
    if (this.sendIntervalId) {
      clearInterval(this.sendIntervalId);
      this.sendIntervalId = null;
    }

    // Reset state
    this.eventsQueue = [];
    this.lastEventFingerprint = null;
    this.lastEventTime = 0;

    // Stop sender
    this.dataSender.stop();

    debugLog.debug('EventManager', 'EventManager stopped');
  }

  /**
   * Flush all queued events immediately (async)
   */
  async flushImmediately(): Promise<boolean> {
    return this.flushEvents(false);
  }

  /**
   * Flush all queued events immediately (sync)
   */
  flushImmediatelySync(): boolean {
    return this.flushEvents(true) as boolean;
  }

  /**
   * Queue management and sending intervals
   */
  getQueueLength(): number {
    return this.eventsQueue.length;
  }

  private clearSendInterval(): void {
    if (this.sendIntervalId) {
      clearInterval(this.sendIntervalId);
      this.sendIntervalId = null;
    }
  }

  /**
   * Shared flush implementation for both sync and async modes
   */
  private flushEvents(isSync: boolean): boolean | Promise<boolean> {
    if (this.eventsQueue.length === 0) {
      return isSync ? true : Promise.resolve(true);
    }

    const body = this.buildEventsPayload();
    const eventsToSend = [...this.eventsQueue];
    const eventIds = eventsToSend.map((e) => `${e.timestamp}_${e.type}`);

    if (isSync) {
      const success = this.dataSender.sendEventsQueueSync(body);

      if (success) {
        this.removeProcessedEvents(eventIds);
        this.clearSendInterval();
        debugLog.info('EventManager', 'Sync flush successful', {
          eventCount: eventsToSend.length,
        });
      }

      return success;
    } else {
      return this.dataSender.sendEventsQueue(body, {
        onSuccess: () => {
          this.removeProcessedEvents(eventIds);
          this.clearSendInterval();
          debugLog.info('EventManager', 'Async flush successful', {
            eventCount: eventsToSend.length,
          });
        },
        onFailure: () => {
          debugLog.warn('EventManager', 'Async flush failed', {
            eventCount: eventsToSend.length,
          });
        },
      });
    }
  }

  /**
   * Send queued events to the API
   */
  private async sendEventsQueue(): Promise<void> {
    if (!this.get('sessionId') || this.eventsQueue.length === 0) {
      return;
    }

    const body = this.buildEventsPayload();
    const eventsToSend = [...this.eventsQueue];
    const eventIds = eventsToSend.map((e) => `${e.timestamp}_${e.type}`);

    await this.dataSender.sendEventsQueue(body, {
      onSuccess: () => {
        this.removeProcessedEvents(eventIds);
        debugLog.info('EventManager', 'Events sent successfully', {
          eventCount: eventsToSend.length,
          remainingQueueLength: this.eventsQueue.length,
        });
      },
      onFailure: async () => {
        debugLog.warn('EventManager', 'Events send failed, keeping in queue', {
          eventCount: eventsToSend.length,
        });
      },
    });
  }

  /**
   * Build the payload for sending events to the API
   * Includes basic deduplication and sorting
   */
  private buildEventsPayload(): BaseEventsQueueDto {
    // Simple deduplication - keep latest event for each unique signature
    const eventMap = new Map<string, EventData>();

    for (const event of this.eventsQueue) {
      const signature = this.createEventSignature(event);
      eventMap.set(signature, event); // Later events overwrite earlier ones
    }

    // Sort events by timestamp
    const events = Array.from(eventMap.values()).sort((a, b) => a.timestamp - b.timestamp);

    return {
      user_id: this.get('userId'),
      session_id: this.get('sessionId') as string,
      device: this.get('device'),
      events,
      ...(this.get('config')?.globalMetadata && { global_metadata: this.get('config')?.globalMetadata }),
    };
  }

  /**
   * Helper methods for event processing
   */
  private buildEventPayload(data: Partial<EventData>): EventData {
    const isSessionStart = data.type === EventType.SESSION_START;
    const currentPageUrl = data.page_url ?? this.get('pageUrl');

    // Update session state
    if (isSessionStart) {
      this.set('hasStartSession', true);
    }

    const payload: EventData = {
      type: data.type as EventType,
      page_url: currentPageUrl,
      timestamp: Date.now(),
      ...(isSessionStart && { referrer: document.referrer || 'Direct' }),
      ...(data.from_page_url && { from_page_url: data.from_page_url }),
      ...(data.scroll_data && { scroll_data: data.scroll_data }),
      ...(data.click_data && { click_data: data.click_data }),
      ...(data.custom_event && { custom_event: data.custom_event }),
      ...(data.web_vitals && { web_vitals: data.web_vitals }),
      ...(data.session_end_reason && { session_end_reason: data.session_end_reason }),
      ...(data.session_start_recovered && { session_start_recovered: data.session_start_recovered }),
      ...(isSessionStart && getUTMParameters() && { utm: getUTMParameters() }),
    };

    // Add project tags
    const projectTags = this.get('config')?.tags;
    if (projectTags?.length) {
      payload.tags = projectTags;
    }

    return payload;
  }

  private isEventExcluded(event: EventData): boolean {
    const isRouteExcluded = isUrlPathExcluded(event.page_url, this.get('config')?.excludedUrlPaths ?? []);
    const hasStartSession = this.get('hasStartSession');
    const isSessionEndEvent = event.type === EventType.SESSION_END;

    // Allow session end events even on excluded routes if session was started
    if (isRouteExcluded && (!isSessionEndEvent || (isSessionEndEvent && !hasStartSession))) {
      if (this.get('config')?.mode === 'qa' || this.get('config')?.mode === 'debug') {
        debugLog.debug('EventManager', `Event ${event.type} excluded for route: ${event.page_url}`);
      }
      return true;
    }

    return this.get('config')?.ipExcluded === true;
  }

  private isDuplicateEvent(event: EventData): boolean {
    const now = Date.now();
    const fingerprint = this.createEventFingerprint(event);

    // Check if this is a duplicate within the threshold
    if (this.lastEventFingerprint === fingerprint && now - this.lastEventTime < DUPLICATE_EVENT_THRESHOLD_MS) {
      return true;
    }

    // Update tracking
    this.lastEventFingerprint = fingerprint;
    this.lastEventTime = now;
    return false;
  }

  private createEventFingerprint(event: EventData): string {
    let fingerprint = `${event.type}_${event.page_url}`;

    if (event.click_data) {
      // Round coordinates to reduce false duplicates
      const x = Math.round((event.click_data.x || 0) / 10) * 10;
      const y = Math.round((event.click_data.y || 0) / 10) * 10;
      fingerprint += `_click_${x}_${y}`;
    }

    if (event.scroll_data) {
      fingerprint += `_scroll_${event.scroll_data.depth}_${event.scroll_data.direction}`;
    }

    if (event.custom_event) {
      fingerprint += `_custom_${event.custom_event.name}`;
    }

    if (event.web_vitals) {
      fingerprint += `_vitals_${event.web_vitals.type}`;
    }

    return fingerprint;
  }

  private createEventSignature(event: EventData): string {
    // Create a signature for deduplication in payload building
    // Similar to fingerprint but with more specificity
    return this.createEventFingerprint(event) + `_${event.timestamp}`;
  }

  private addToQueue(event: EventData): void {
    this.eventsQueue.push(event);

    // Prevent queue overflow
    if (this.eventsQueue.length > MAX_EVENTS_QUEUE_LENGTH) {
      const removedEvent = this.eventsQueue.shift();
      debugLog.warn('EventManager', 'Event queue overflow, oldest event removed', {
        maxLength: MAX_EVENTS_QUEUE_LENGTH,
        currentLength: this.eventsQueue.length,
        removedEventType: removedEvent?.type,
      });
    }

    debugLog.info('EventManager', `📥 Event captured: ${event.type}`, event);

    // Start sending interval if not already active
    if (!this.sendIntervalId) {
      this.startSendInterval();
    }

    // Google Analytics integration
    this.handleGoogleAnalyticsIntegration(event);
  }

  private startSendInterval(): void {
    const isTestEnv = this.get('config')?.id === 'test' || this.get('config')?.mode === 'debug';
    const interval = isTestEnv ? EVENT_SENT_INTERVAL_TEST_MS : EVENT_SENT_INTERVAL_MS;

    this.sendIntervalId = window.setInterval(() => {
      if (this.eventsQueue.length > 0) {
        this.sendEventsQueue();
      }
    }, interval);
  }

  private handleGoogleAnalyticsIntegration(event: EventData): void {
    if (this.googleAnalytics && event.type === EventType.CUSTOM && event.custom_event) {
      if (this.get('config')?.mode === 'qa' || this.get('config')?.mode === 'debug') {
        debugLog.debug('EventManager', `Google Analytics event: ${JSON.stringify(event.custom_event)}`);
      } else {
        this.googleAnalytics.trackEvent(event.custom_event.name, event.custom_event.metadata ?? {});
      }
    }
  }

  private shouldSample(): boolean {
    const samplingRate = this.get('config')?.samplingRate ?? 1;
    return Math.random() < samplingRate;
  }

  private removeProcessedEvents(eventIds: string[]): void {
    const eventIdSet = new Set(eventIds);
    this.eventsQueue = this.eventsQueue.filter((event) => {
      const eventId = `${event.timestamp}_${event.type}`;
      return !eventIdSet.has(eventId);
    });
  }
}
