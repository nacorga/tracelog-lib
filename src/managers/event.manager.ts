import {
  EVENT_SENT_INTERVAL_MS,
  EVENT_SENT_INTERVAL_TEST_MS,
  MAX_EVENTS_QUEUE_LENGTH,
  DUPLICATE_EVENT_THRESHOLD_MS,
} from '../constants';
import { Queue, CustomEventData, EventData, EventType } from '../types';
import { getUTMParameters, isUrlPathExcluded, log } from '../utils';
import { SenderManager } from './sender.manager';
import { SamplingManager } from './sampling.manager';
import { StateManager } from './state.manager';
import { TagsManager } from './tags.manager';
import { StorageManager } from './storage.manager';
import { GoogleAnalyticsIntegration } from '../integrations/google-analytics.integration';

export class EventManager extends StateManager {
  private readonly googleAnalytics: GoogleAnalyticsIntegration | null;
  private readonly samplingManager: SamplingManager;
  private readonly tagsManager: TagsManager;
  private readonly dataSender: SenderManager;

  private eventsQueue: EventData[] = [];
  private lastEvent: EventData | null = null;
  private eventsQueueIntervalId: number | null = null;

  constructor(storeManager: StorageManager, googleAnalytics: GoogleAnalyticsIntegration | null = null) {
    super();

    this.googleAnalytics = googleAnalytics;
    this.samplingManager = new SamplingManager();
    this.tagsManager = new TagsManager();
    this.dataSender = new SenderManager(storeManager);
  }

  track({ type, page_url, from_page_url, scroll_data, click_data, custom_event }: Partial<EventData>): void {
    if (!this.samplingManager.isSampledIn()) {
      return;
    }

    const isDuplicatedEvent = this.isDuplicatedEvent({ type, page_url, scroll_data, click_data, custom_event });

    if (isDuplicatedEvent) {
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

      return;
    }

    const isRouteExcluded = isUrlPathExcluded(page_url as string, this.get('config').excludedUrlPaths);
    const hasStartSession = this.get('hasStartSession');
    const isSessionEndEvent = type == EventType.SESSION_END;

    if (isRouteExcluded && (!isSessionEndEvent || (isSessionEndEvent && !hasStartSession))) {
      if (this.get('config')?.qaMode) {
        log('info', `Event ${type} on excluded route: ${page_url}`);
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
      page_url: isRouteExcluded ? 'excluded' : (page_url as string) || this.get('pageUrl'),
      timestamp: Date.now(),
      ...(isSessionStartEvent && { referrer: document.referrer || 'Direct' }),
      ...(from_page_url && !isRouteExcluded ? { from_page_url } : {}),
      ...(scroll_data && { scroll_data }),
      ...(click_data && { click_data }),
      ...(custom_event && { custom_event }),
      ...(utmParams && { utm: utmParams }),
    };

    if (this.get('config')?.tags?.length) {
      const matchedTags = this.tagsManager.getEventTagsIds(payload, this.get('device'));

      if (matchedTags?.length) {
        payload.tags = this.get('config')?.qaMode
          ? matchedTags.map((id) => ({
              id,
              key: this.get('config')?.tags?.find((t) => t.id === id)?.key ?? '',
            }))
          : matchedTags;
      }
    }

    this.lastEvent = payload;
    this.processAndSend(payload);
  }

  private processAndSend(payload: EventData): void {
    const isQAMode = this.get('config')?.qaMode;

    if (isQAMode) {
      log('info', `${payload.type} event: ${JSON.stringify(payload)}`);
    }

    if (!isQAMode && this.get('config')?.ipExcluded) {
      return;
    }

    this.eventsQueue.push(payload);

    if (this.eventsQueue.length > MAX_EVENTS_QUEUE_LENGTH) {
      this.eventsQueue.shift();
    }

    if (!this.eventsQueueIntervalId) {
      this.initEventsQueueInterval();
    }

    if (payload.type === EventType.SESSION_END && this.eventsQueue.length > 0) {
      this.sendEventsQueue();
    }

    if (this.googleAnalytics && payload.type === EventType.CUSTOM) {
      const customEvent = payload.custom_event as CustomEventData;

      this.trackGoogleAnalyticsEvent(customEvent);
    }
  }

  private trackGoogleAnalyticsEvent(customEvent: CustomEventData): void {
    if (this.get('config').qaMode) {
      log('info', `Google Analytics event: ${JSON.stringify(customEvent)}`);
    } else if (this.googleAnalytics) {
      this.googleAnalytics.trackEvent(customEvent.name, customEvent.metadata ?? {});
    }
  }

  private initEventsQueueInterval(): void {
    if (this.eventsQueueIntervalId) {
      return;
    }

    const interval = this.get('config')?.id === 'test' ? EVENT_SENT_INTERVAL_TEST_MS : EVENT_SENT_INTERVAL_MS;

    this.eventsQueueIntervalId = window.setInterval(() => {
      if (this.eventsQueue.length > 0) {
        this.sendEventsQueue();
      }
    }, interval);
  }

  private sendEventsQueue(): void {
    if (this.eventsQueue.length === 0) {
      return;
    }

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

      if (!uniqueEvents.has(key)) {
        uniqueEvents.set(key, event);
      }
    }

    const deduplicatedEvents = [...uniqueEvents.values()];

    deduplicatedEvents.sort((a, b) => a.timestamp - b.timestamp);

    const body: Queue = {
      user_id: this.get('userId'),
      session_id: this.get('sessionId') as string,
      device: this.get('device'),
      events: deduplicatedEvents,
      ...(this.get('config')?.globalMetadata && { global_metadata: this.get('config')?.globalMetadata }),
    };

    const success = this.dataSender.sendEventsQueue(body);

    this.eventsQueue = success ? [] : deduplicatedEvents;
  }

  private isDuplicatedEvent({ type, page_url, scroll_data, click_data, custom_event }: Partial<EventData>): boolean {
    if (!this.lastEvent) {
      return false;
    }

    if (this.lastEvent.type !== type) {
      return false;
    }

    const currentTime = Date.now();
    const timeDiff = currentTime - this.lastEvent.timestamp;

    if (timeDiff >= DUPLICATE_EVENT_THRESHOLD_MS) {
      return false;
    }

    switch (type) {
      case EventType.PAGE_VIEW: {
        return this.lastEvent.page_url === page_url;
      }

      case EventType.CLICK: {
        // For clicks, check if they're approximately at the same location and have similar data
        const coordinatesMatch =
          Math.abs((this.lastEvent.click_data?.x ?? 0) - (click_data?.x ?? 0)) <= 5 &&
          Math.abs((this.lastEvent.click_data?.y ?? 0) - (click_data?.y ?? 0)) <= 5;

        const elementMatch =
          this.lastEvent.click_data?.tag === click_data?.tag &&
          this.lastEvent.click_data?.id === click_data?.id &&
          this.lastEvent.click_data?.text === click_data?.text;

        return coordinatesMatch && elementMatch;
      }

      case EventType.SCROLL: {
        return (
          this.lastEvent.scroll_data?.depth === scroll_data?.depth &&
          this.lastEvent.scroll_data?.direction === scroll_data?.direction
        );
      }

      case EventType.CUSTOM: {
        return this.lastEvent.custom_event?.name === custom_event?.name;
      }

      default: {
        return false;
      }
    }
  }
}
