import { EVENT_SENT_INTERVAL, MAX_EVENTS_QUEUE_LENGTH } from '../app.constants';
import { Config } from '../types/config.types';
import { DeviceType } from '../types/device.types';
import { EventData, EventType } from '../types/event.types';
import { Queue } from '../types/queue.types';
import { log } from '../utils/log.utils';
import { isUrlPathExcluded } from '../utils/url.utils';
import { DataSender } from './data-sender';
import { TagsManager } from './tags-manager';

export class EventManager {
  private readonly config: Config;
  private readonly data: { userId: string; sessionId: string; device: DeviceType };
  private readonly managers: { tags: TagsManager; dataSender: DataSender };

  private eventsQueue: EventData[] = [];
  private lastEvent: EventData | null = null;
  private hasInitEventsQueueInterval = false;
  private eventsQueueIntervalId: number | null = null;

  constructor(
    config: Config,
    data: { userId: string; sessionId: string; device: DeviceType },
    managers: { tags: TagsManager; dataSender: DataSender },
  ) {
    this.config = config;
    this.data = data;
    this.managers = managers;
  }

  track({ type, page_url, from_page_url, scroll_data, click_data, custom_event, utm }: Partial<EventData>): void {
    const isDuplicatedEvent = this.isDuplicatedEvent({ type, page_url, scroll_data, click_data, custom_event });

    if (isDuplicatedEvent) {
      if (this.eventsQueue && this.eventsQueue.length > 0) {
        const lastEvent = this.eventsQueue.at(-1);

        if (lastEvent) {
          const now = Date.now();

          lastEvent.timestamp = now;

          if (this.lastEvent) {
            this.lastEvent.timestamp = now;
          }
        }
      }

      return;
    }

    const isRouteExcluded = isUrlPathExcluded(page_url as string, this.config.excludedUrlPaths);
    const isSessionEvent = [EventType.SESSION_START, EventType.SESSION_END].includes(type as EventType);

    if (isRouteExcluded && !isSessionEvent) {
      return;
    }

    const isFirstEvent = type === EventType.SESSION_START;
    const removePageUrl = isRouteExcluded && isSessionEvent;

    const payload: EventData = {
      type: type as EventType,
      page_url: removePageUrl ? '' : (page_url as string),
      timestamp: Date.now(),
      ...(isFirstEvent && { referrer: document.referrer || 'Direct' }),
      ...(from_page_url && !removePageUrl && { from_page_url }),
      ...(scroll_data && { scroll_data }),
      ...(click_data && { click_data }),
      ...(custom_event && { custom_event }),
      ...(isFirstEvent && utm && { utm }),
      ...(removePageUrl && { excluded_route: true }),
    };

    if (this.config?.tags?.length) {
      const matchedTags = this.managers.tags.getEventTagsIds(payload, this.data.device);

      if (matchedTags?.length) {
        payload.tags = this.config.qaMode
          ? matchedTags.map((id) => ({
              id,
              key: this.config?.tags?.find((t) => t.id === id)?.key ?? '',
            }))
          : matchedTags;
      }
    }

    this.lastEvent = payload;
    this.processAndSend(payload);
  }

  private processAndSend(payload: EventData): void {
    if (this.config.qaMode) {
      log('info', `${payload.type} event: ${JSON.stringify(payload)}`);
    } else {
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
    }
  }

  private initEventsQueueInterval(): void {
    this.hasInitEventsQueueInterval = true;

    this.eventsQueueIntervalId = window.setInterval(() => {
      if (this.eventsQueue.length > 0) {
        this.sendEventsQueue();
      }
    }, EVENT_SENT_INTERVAL);
  }

  private async sendEventsQueue(): Promise<void> {
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
      user_id: this.data.userId,
      session_id: this.data.sessionId,
      device: this.data.device,
      events: deduplicatedEvents,
      ...(this.config.globalMetadata && { global_metadata: this.config.globalMetadata }),
    };

    const success = await this.managers.dataSender.sendEventsQueue(body);

    this.eventsQueue = success ? [] : deduplicatedEvents;
  }

  // private processAndSend(event: BaseEvent): void {
  //   if (!this.identityManager) {
  //     return;
  //   }
  //   const trackedEvent: TrackedEvent = {
  //     ...event,
  //     timestamp: Date.now(),
  //     userId: this.identityManager.getUserId(),
  //     sessionId: this.identityManager.getSessionId(),
  //   };

  //   this.dataSender.send(trackedEvent);
  // }

  private isDuplicatedEvent({ type, page_url, scroll_data, click_data, custom_event }: Partial<EventData>): boolean {
    if (!this.lastEvent) {
      return false;
    }

    if (this.lastEvent.type !== type) {
      return false;
    }

    const currentTime = Date.now();
    const timeDiff = currentTime - this.lastEvent.timestamp;
    const timeDiffThreshold = 1000;

    if (timeDiff >= timeDiffThreshold) {
      return false;
    }

    switch (type) {
      case EventType.PAGE_VIEW: {
        return this.lastEvent.page_url === page_url;
      }

      case EventType.CLICK: {
        return this.lastEvent.click_data?.x === click_data?.x && this.lastEvent.click_data?.y === click_data?.y;
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
