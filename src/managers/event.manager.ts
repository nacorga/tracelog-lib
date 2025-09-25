import {
  EVENT_SENT_INTERVAL_MS,
  EVENT_SENT_INTERVAL_TEST_MS,
  MAX_EVENTS_QUEUE_LENGTH,
  DUPLICATE_EVENT_THRESHOLD_MS,
} from '../constants';
import { BaseEventsQueueDto, CustomEventData, EventData, EventType, ClickData, ScrollData } from '../types';
import { getUTMParameters, isUrlPathExcluded } from '../utils';
import { debugLog } from '../utils/logging';
import { SimpleCircuitBreaker } from '../utils/simple-circuit-breaker';
import { SenderManager } from './sender.manager';
import { StateManager } from './state.manager';
import { StorageManager } from './storage.manager';
import { GoogleAnalyticsIntegration } from '../integrations/google-analytics.integration';

export class EventManager extends StateManager {
  private readonly googleAnalytics: GoogleAnalyticsIntegration | null;
  private readonly dataSender: SenderManager;
  private readonly circuitBreaker = new SimpleCircuitBreaker();

  private eventsQueue: EventData[] = [];
  private lastEvent: EventData | null = null;
  private eventsQueueIntervalId: number | null = null;
  private intervalActive = false;

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
    // Check circuit breaker
    if (!this.circuitBreaker.canAttempt()) {
      debugLog.warn('EventManager', 'Event dropped - circuit breaker open');
      return;
    }

    // Sampling check
    if (!this.shouldSample()) {
      debugLog.debug('EventManager', 'Event filtered by sampling');
      return;
    }

    // Build event payload first for deduplication check
    const effectivePageUrl = (page_url as string) || this.get('pageUrl');
    const isRouteExcluded = isUrlPathExcluded(effectivePageUrl, this.get('config')?.excludedUrlPaths ?? []);
    const hasStartSession = this.get('hasStartSession');
    const isSessionEndEvent = type == EventType.SESSION_END;

    if (isRouteExcluded && (!isSessionEndEvent || (isSessionEndEvent && !hasStartSession))) {
      if (this.get('config')?.mode === 'qa' || this.get('config')?.mode === 'debug') {
        debugLog.debug('EventManager', `Event ${type} on excluded route: ${page_url}`);
      }
      return;
    }

    const isSessionStartEvent = type === EventType.SESSION_START;

    if (isSessionStartEvent) {
      this.set('hasStartSession', true);
    }

    const utmParams = isSessionStartEvent ? getUTMParameters() : undefined;

    const payload: EventData = {
      type: type as EventType,
      page_url: isRouteExcluded ? 'excluded' : effectivePageUrl,
      timestamp: Date.now(),
      ...(isSessionStartEvent && { referrer: document.referrer || 'Direct' }),
      ...(from_page_url && !isRouteExcluded ? { from_page_url } : {}),
      ...(scroll_data && { scroll_data }),
      ...(click_data && { click_data }),
      ...(custom_event && { custom_event }),
      ...(utmParams && { utm: utmParams }),
      ...(web_vitals && { web_vitals }),
      ...(session_end_reason && { session_end_reason }),
      ...(session_start_recovered && { session_start_recovered }),
    };

    // Check for duplicates
    if (this.isDuplicate(payload)) {
      const now = Date.now();

      if (this.eventsQueue && this.eventsQueue.length > 0) {
        const lastEvent = this.eventsQueue.at(-1);
        if (lastEvent) {
          lastEvent.timestamp = now;
        }
      }

      if (this.lastEvent) {
        this.lastEvent.timestamp = now;
      }

      debugLog.debug('EventManager', 'Duplicate event detected, timestamp updated', {
        type,
        queueLength: this.eventsQueue.length,
      });

      return;
    }

    // Add static tags from config
    const projectTags = this.get('config')?.tags;
    if (projectTags?.length) {
      payload.tags = projectTags;
    }

    this.lastEvent = payload;
    this.processAndSend(payload);
  }

  stop(): void {
    // Clear interval
    if (this.eventsQueueIntervalId) {
      clearInterval(this.eventsQueueIntervalId);
      this.eventsQueueIntervalId = null;
      this.intervalActive = false;
    }

    // Reset state
    this.lastEvent = null;
    this.eventsQueue = [];

    // Stop sender
    this.dataSender.stop();

    debugLog.debug('EventManager', 'EventManager stopped');
  }

  private processAndSend(payload: EventData): void {
    if (this.get('config').ipExcluded) {
      return;
    }

    this.eventsQueue.push(payload);

    if (this.eventsQueue.length > MAX_EVENTS_QUEUE_LENGTH) {
      const removedEvent = this.eventsQueue.shift();

      debugLog.warn('EventManager', 'Event queue overflow, oldest event removed', {
        maxLength: MAX_EVENTS_QUEUE_LENGTH,
        currentLength: this.eventsQueue.length,
        removedEventType: removedEvent?.type,
      });
    }

    debugLog.info('EventManager', `📥 Event captured: ${payload.type}`, payload);

    if (!this.eventsQueueIntervalId) {
      this.initEventsQueueInterval();
    }

    if (this.googleAnalytics && payload.type === EventType.CUSTOM) {
      const customEvent = payload.custom_event as CustomEventData;

      this.trackGoogleAnalyticsEvent(customEvent);
    }
  }

  private trackGoogleAnalyticsEvent(customEvent: CustomEventData): void {
    if (this.get('config').mode === 'qa' || this.get('config').mode === 'debug') {
      debugLog.debug('EventManager', `Google Analytics event: ${JSON.stringify(customEvent)}`);
    } else if (this.googleAnalytics) {
      this.googleAnalytics.trackEvent(customEvent.name, customEvent.metadata ?? {});
    }
  }

  private initEventsQueueInterval(): void {
    if (this.eventsQueueIntervalId || this.intervalActive) {
      return;
    }

    const isTestEnv = this.get('config')?.id === 'test' || this.get('config')?.mode === 'debug';
    const interval = isTestEnv ? EVENT_SENT_INTERVAL_TEST_MS : EVENT_SENT_INTERVAL_MS;

    this.eventsQueueIntervalId = window.setInterval(() => {
      if (this.eventsQueue.length > 0) {
        this.sendEventsQueue();
      }
    }, interval);

    this.intervalActive = true;
  }

  async flushImmediately(): Promise<boolean> {
    if (this.eventsQueue.length === 0) {
      return true;
    }

    const body = this.buildEventsPayload();

    // Create immutable copy of events to send
    const eventsToSend = [...this.eventsQueue];
    const eventIds = eventsToSend.map((e) => e.timestamp + '_' + e.type);

    const success = await this.dataSender.sendEventsQueueAsync(body);

    if (success) {
      // Only remove events that were sent successfully
      this.removeProcessedEvents(eventIds);
      this.clearQueueInterval();

      debugLog.info('EventManager', 'Flush immediately successful', {
        eventCount: eventsToSend.length,
        remainingQueueLength: this.eventsQueue.length,
      });
    } else {
      debugLog.warn('EventManager', 'Flush immediately failed, keeping events in queue', {
        eventCount: eventsToSend.length,
      });
    }

    return success;
  }

  flushImmediatelySync(): boolean {
    if (this.eventsQueue.length === 0) {
      return true;
    }

    const body = this.buildEventsPayload();

    // Create immutable copy of events to send
    const eventsToSend = [...this.eventsQueue];
    const eventIds = eventsToSend.map((e) => e.timestamp + '_' + e.type);

    const success = this.dataSender.sendEventsQueueSync(body);

    if (success) {
      // Only remove events that were sent successfully
      this.removeProcessedEvents(eventIds);
      this.clearQueueInterval();

      debugLog.info('EventManager', 'Flush immediately sync successful', {
        eventCount: eventsToSend.length,
        remainingQueueLength: this.eventsQueue.length,
      });
    } else {
      debugLog.warn('EventManager', 'Flush immediately sync failed, keeping events in queue', {
        eventCount: eventsToSend.length,
      });
    }

    return success;
  }

  getQueueLength(): number {
    return this.eventsQueue.length;
  }

  private async sendEventsQueue(): Promise<void> {
    // Basic validations
    if (!this.get('sessionId')) {
      debugLog.debug('EventManager', 'No session ID, skipping send');
      return;
    }

    if (this.eventsQueue.length === 0) {
      return;
    }

    if (!this.circuitBreaker.canAttempt()) {
      debugLog.debug('EventManager', 'Circuit breaker open, skipping send');
      return;
    }

    const body = this.buildEventsPayload();
    const eventsToSend = [...this.eventsQueue];
    const eventIds = eventsToSend.map((e) => e.timestamp + '_' + e.type);

    await this.dataSender.sendEventsQueue(body, {
      onSuccess: () => {
        this.circuitBreaker.recordSuccess();
        this.removeProcessedEvents(eventIds);

        debugLog.info('EventManager', 'Events sent successfully', {
          eventCount: eventsToSend.length,
          remainingQueueLength: this.eventsQueue.length,
        });
      },
      onFailure: async () => {
        this.circuitBreaker.recordFailure();

        debugLog.warn('EventManager', 'Events send failed, keeping in queue', {
          eventCount: eventsToSend.length,
          circuitState: this.circuitBreaker.getState(),
        });
      },
    });
  }

  private buildEventsPayload(): BaseEventsQueueDto {
    const uniqueEvents = new Map<string, EventData>();

    for (const event of this.eventsQueue) {
      let key = `${event.type}_${event.page_url}`;

      if (event.click_data) {
        key += `_${event.click_data.x}_${event.click_data.y}`;
      }

      if (event.scroll_data) {
        key += `_${event.scroll_data.depth}_${event.scroll_data.direction}`;
      }

      if (event.custom_event) {
        key += `_${event.custom_event.name}`;
      }

      if (event.web_vitals) {
        key += `_${event.web_vitals.type}`;
      }

      if (!uniqueEvents.has(key)) {
        uniqueEvents.set(key, event);
      }
    }

    const deduplicatedEvents = [...uniqueEvents.values()];
    deduplicatedEvents.sort((a, b) => a.timestamp - b.timestamp);

    return {
      user_id: this.get('userId'),
      session_id: this.get('sessionId') as string,
      device: this.get('device'),
      events: deduplicatedEvents,
      ...(this.get('config')?.globalMetadata && { global_metadata: this.get('config')?.globalMetadata }),
    };
  }

  private clearQueueInterval(): void {
    if (this.eventsQueueIntervalId) {
      clearInterval(this.eventsQueueIntervalId);
      this.eventsQueueIntervalId = null;
      this.intervalActive = false;
    }
  }

  /**
   * Simple sampling check using global sampling rate
   */
  private shouldSample(): boolean {
    const samplingRate = this.get('config')?.samplingRate ?? 1;
    return Math.random() < samplingRate;
  }

  /**
   * Checks if event is duplicate of last event
   */
  private isDuplicate(newEvent: EventData): boolean {
    if (!this.lastEvent) return false;

    const timeDiff = Date.now() - this.lastEvent.timestamp;
    if (timeDiff > DUPLICATE_EVENT_THRESHOLD_MS) return false;

    // Same type and URL
    if (this.lastEvent.type !== newEvent.type) return false;
    if (this.lastEvent.page_url !== newEvent.page_url) return false;

    // Type-specific comparison
    if (newEvent.click_data && this.lastEvent.click_data) {
      return this.areClicksSimilar(newEvent.click_data, this.lastEvent.click_data);
    }

    if (newEvent.scroll_data && this.lastEvent.scroll_data) {
      return this.areScrollsSimilar(newEvent.scroll_data, this.lastEvent.scroll_data);
    }

    if (newEvent.custom_event && this.lastEvent.custom_event) {
      return newEvent.custom_event.name === this.lastEvent.custom_event.name;
    }

    if (newEvent.web_vitals && this.lastEvent.web_vitals) {
      return newEvent.web_vitals.type === this.lastEvent.web_vitals.type;
    }

    return true;
  }

  /**
   * Checks if two clicks are similar within tolerance
   */
  private areClicksSimilar(click1: ClickData, click2: ClickData): boolean {
    const TOLERANCE = 5; // 5px tolerance
    const xDiff = Math.abs((click1.x || 0) - (click2.x || 0));
    const yDiff = Math.abs((click1.y || 0) - (click2.y || 0));

    return xDiff < TOLERANCE && yDiff < TOLERANCE;
  }

  /**
   * Checks if two scrolls are similar
   */
  private areScrollsSimilar(scroll1: ScrollData, scroll2: ScrollData): boolean {
    return scroll1.depth === scroll2.depth && scroll1.direction === scroll2.direction;
  }

  private removeProcessedEvents(eventIds: string[]): void {
    const eventIdSet = new Set(eventIds);

    this.eventsQueue = this.eventsQueue.filter((event) => {
      const eventId = event.timestamp + '_' + event.type;
      return !eventIdSet.has(eventId);
    });
  }
}
