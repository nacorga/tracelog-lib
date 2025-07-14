import { MAX_EVENTS_QUEUE_LENGTH, EVENT_SENT_INTERVAL, UTM_PARAMS } from '../constants';
import {
  DeviceType,
  EventData,
  EventHandler,
  Queue,
  EventType,
  MetadataType,
  EventUtm,
  Config,
  Timestamp,
  TagConditionType,
  TagLogicalOperator,
} from '../types';
import { isEventValid } from '../utils';
import { TagManager } from './tag-manager';

export class EventManager {
  private readonly utmParams: EventUtm | null | undefined;

  private eventsQueue: EventData[] = [];
  private hasInitEventsQueueInterval = false;
  private eventsQueueIntervalId: number | null = null;
  private lastEvent: EventData | null = null;
  private pageUrl = '';

  constructor(
    private readonly config: Config,
    private readonly getUserId: () => string,
    private readonly getSessionId: () => string | undefined,
    private readonly getDevice: () => DeviceType | undefined,
    private readonly getGlobalMetadata: () => Record<string, MetadataType> | undefined,
    private readonly sendEventsQueue: (body: Queue) => Promise<boolean>,
    private readonly sendError: (error: { message: string }) => Promise<void>,
    private readonly isQaMode: () => boolean,
    private readonly isExcludedUser: () => boolean,
    private readonly isRouteExcluded: (url: string) => boolean,
  ) {
    this.pageUrl = window.location.href;
    this.utmParams = this.getUTMParameters();
  }

  handleEvent({ evType, url, fromUrl, scrollData, clickData, customEvent }: EventHandler): void {
    const eventUrl = url || this.pageUrl;
    const isDuplicatedEvent = this.isDuplicatedEvent({ evType, url: eventUrl, scrollData, clickData, customEvent });

    if (isDuplicatedEvent) {
      if (this.eventsQueue && this.eventsQueue.length > 0) {
        const lastEvent = this.eventsQueue.at(-1);
        if (lastEvent) {
          lastEvent.timestamp = Date.now() as Timestamp;
        }
      }

      return;
    }

    if (this.isExcludedUser()) {
      return;
    }

    const isRouteExcluded = this.isRouteExcluded(eventUrl);
    const isSessionEvent = [EventType.SESSION_START, EventType.SESSION_END].includes(evType);

    if (isRouteExcluded && !isSessionEvent) {
      return;
    }

    let errorMessage: string | null = null;

    if (evType === EventType.SCROLL && !scrollData) {
      errorMessage = 'scrollData is required for SCROLL event. Event ignored.';
    }

    if (evType === EventType.CLICK && !clickData) {
      errorMessage = 'clickData is required for CLICK event. Event ignored.';
    }

    if (evType === EventType.CUSTOM && !customEvent) {
      errorMessage = 'customEvent is required for CUSTOM event. Event ignored.';
    }

    if (errorMessage) {
      void this.sendError({ message: errorMessage });
      return;
    }

    const isFirstEvent = evType === EventType.SESSION_START;

    const payload: EventData = {
      type: evType,
      page_url: eventUrl,
      timestamp: Date.now() as Timestamp,
      ...(isFirstEvent && { referrer: document.referrer || 'Direct' }),
      ...(fromUrl && { from_page_url: fromUrl }),
      ...(scrollData && { scroll_data: scrollData }),
      ...(clickData && { click_data: clickData }),
      ...(customEvent && { custom_event: customEvent }),
      ...(isFirstEvent && this.utmParams && { utm: this.utmParams }),
      ...(isRouteExcluded && isSessionEvent && { excluded_route: true }),
    };

    // Tags functionality enabled
    if (this.config?.tags?.length) {
      const matchedTags = this.getEventTags(payload, this.getDevice()!);
      if (matchedTags?.length) {
        payload.tags = matchedTags;
      }
    }

    this.lastEvent = payload;
    this.sendEvent(payload);
  }

  sendCustomEvent(name: string, metadata?: Record<string, MetadataType>): void {
    const validationResult = isEventValid(name, metadata);

    if (validationResult.valid) {
      this.handleEvent({
        evType: EventType.CUSTOM,
        customEvent: {
          name,
          ...(validationResult.sanitizedMetadata && { metadata: validationResult.sanitizedMetadata }),
        },
      });
    } else if (this.isQaMode()) {
      console.error(
        `TraceLog error: sendCustomEvent "${name}" validation failed (${validationResult.error || 'unknown error'}). Please, review your event data and try again.`,
      );
    }
  }

  updatePageUrl(url: string): void {
    this.pageUrl = url;
  }

  getEventsQueue(): EventData[] {
    return this.eventsQueue;
  }

  clearEventsQueue(): void {
    this.eventsQueue = [];
  }

  private sendEvent(payload: EventData): void {
    if (this.isQaMode()) {
      console.log(`[TraceLog] ${payload.type} event:`, JSON.stringify(payload));
    } else {
      this.eventsQueue.push(payload);

      if (this.eventsQueue.length > MAX_EVENTS_QUEUE_LENGTH) {
        this.eventsQueue.shift();
      }

      if (!this.hasInitEventsQueueInterval) {
        this.initEventsQueueInterval();
      }

      if (payload.type === EventType.SESSION_END && this.eventsQueue.length > 0) {
        this.sendEventsQueueNow();
      }
    }
  }

  private initEventsQueueInterval(): void {
    this.hasInitEventsQueueInterval = true;

    this.eventsQueueIntervalId = window.setInterval(() => {
      if (this.eventsQueue.length > 0) {
        this.sendEventsQueueNow();
      }
    }, EVENT_SENT_INTERVAL);
  }

  private async sendEventsQueueNow(): Promise<void> {
    if (this.eventsQueue.length === 0) {
      return;
    }

    // Use Set for O(1) lookup and more efficient deduplication
    const uniqueEvents = new Map<string, EventData>();

    for (const event of this.eventsQueue) {
      const key = `${event.type}_${event.timestamp}_${event.page_url}`;
      if (!uniqueEvents.has(key)) {
        uniqueEvents.set(key, event);
      }
    }

    // Convert back to array
    const deduplicatedEvents = [...uniqueEvents.values()];

    // Sort by timestamp for better server processing
    deduplicatedEvents.sort((a, b) => a.timestamp - b.timestamp);

    const body: Queue = {
      user_id: this.getUserId(),
      session_id: this.getSessionId()!,
      device: this.getDevice()!,
      events: deduplicatedEvents,
      ...(this.getGlobalMetadata() && { global_metadata: this.getGlobalMetadata() }),
    };

    const success = await this.sendEventsQueue(body);

    this.eventsQueue = success ? [] : deduplicatedEvents;
  }

  private isDuplicatedEvent({ evType, url, scrollData, clickData, customEvent }: EventHandler): boolean {
    if (!this.lastEvent) {
      return false;
    }

    // Quick type check first
    if (this.lastEvent.type !== evType) {
      return false;
    }

    const currentTime = Date.now();
    const timeDiff = currentTime - this.lastEvent.timestamp;
    const timeDiffThreshold = 1000; // 1 second

    // Early return if time difference is too large
    if (timeDiff >= timeDiffThreshold) {
      return false;
    }

    // Type-specific duplicate checks
    switch (evType) {
      case EventType.PAGE_VIEW: {
        return this.lastEvent.page_url === url;
      }

      case EventType.CLICK: {
        return this.lastEvent.click_data?.x === clickData?.x && this.lastEvent.click_data?.y === clickData?.y;
      }

      case EventType.SCROLL: {
        return (
          this.lastEvent.scroll_data?.depth === scrollData?.depth &&
          this.lastEvent.scroll_data?.direction === scrollData?.direction
        );
      }

      case EventType.CUSTOM: {
        return this.lastEvent.custom_event?.name === customEvent?.name;
      }

      default: {
        return false;
      }
    }
  }

  private getUTMParameters(): EventUtm | null {
    const urlParameters = new URLSearchParams(window.location.search);
    const utmParameters: Partial<Record<keyof EventUtm, string>> = {};

    for (const parameter of UTM_PARAMS) {
      const value = urlParameters.get(parameter);

      if (value) {
        const key = parameter.split('utm_')[1] as keyof EventUtm;
        utmParameters[key] = value;
      }
    }

    return Object.keys(utmParameters).length > 0 ? utmParameters : null;
  }

  private getEventTags(event: EventData, deviceType: DeviceType): string[] {
    switch (event.type) {
      case EventType.PAGE_VIEW: {
        return this.checkEventTypePageView(event, deviceType);
      }
      case EventType.CLICK: {
        return this.checkEventTypeClick(event, deviceType);
      }
      default: {
        return [];
      }
    }
  }

  private checkEventTypePageView(event: EventData, deviceType: DeviceType): string[] {
    const tags = this.config?.tags?.filter((tag) => tag.triggerType === EventType.PAGE_VIEW) || [];
    if (tags.length === 0) {
      return [];
    }
    const matchedTagIds: string[] = [];
    for (const tag of tags) {
      const { id, logicalOperator, conditions } = tag;
      const results: boolean[] = [];
      for (const condition of conditions) {
        switch (condition.type) {
          case TagConditionType.URL_MATCHES: {
            results.push(TagManager.matchUrlMatches(condition, event.page_url));

            break;
          }
          case TagConditionType.DEVICE_TYPE: {
            results.push(TagManager.matchDeviceType(condition, deviceType));

            break;
          }
          case TagConditionType.UTM_SOURCE: {
            results.push(TagManager.matchUtmCondition(condition, event.utm?.source));

            break;
          }
          case TagConditionType.UTM_MEDIUM: {
            results.push(TagManager.matchUtmCondition(condition, event.utm?.medium));

            break;
          }
          case TagConditionType.UTM_CAMPAIGN: {
            results.push(TagManager.matchUtmCondition(condition, event.utm?.campaign));

            break;
          }
        }
      }

      let isMatch = false;

      isMatch = logicalOperator === TagLogicalOperator.AND ? results.every(Boolean) : results.some(Boolean);

      if (isMatch) {
        matchedTagIds.push(id);
      }
    }

    return matchedTagIds;
  }

  private checkEventTypeClick(event: EventData, deviceType: DeviceType): string[] {
    const tags = this.config?.tags?.filter((tag) => tag.triggerType === EventType.CLICK) || [];
    if (tags.length === 0) {
      return [];
    }
    const matchedTagIds: string[] = [];
    for (const tag of tags) {
      const { id, logicalOperator, conditions } = tag;
      const results: boolean[] = [];
      for (const condition of conditions) {
        if (!event.click_data) {
          results.push(false);
          continue;
        }
        const clickData = event.click_data;
        switch (condition.type) {
          case TagConditionType.ELEMENT_MATCHES: {
            results.push(TagManager.matchElementSelector(condition, clickData));

            break;
          }
          case TagConditionType.DEVICE_TYPE: {
            results.push(TagManager.matchDeviceType(condition, deviceType));

            break;
          }
          case TagConditionType.URL_MATCHES: {
            results.push(TagManager.matchUrlMatches(condition, event.page_url));

            break;
          }
          case TagConditionType.UTM_SOURCE: {
            results.push(TagManager.matchUtmCondition(condition, event.utm?.source));

            break;
          }
          case TagConditionType.UTM_MEDIUM: {
            results.push(TagManager.matchUtmCondition(condition, event.utm?.medium));

            break;
          }
          case TagConditionType.UTM_CAMPAIGN: {
            results.push(TagManager.matchUtmCondition(condition, event.utm?.campaign));

            break;
          }
        }
      }

      let isMatch = false;

      isMatch = logicalOperator === TagLogicalOperator.AND ? results.every(Boolean) : results.some(Boolean);

      if (isMatch) {
        matchedTagIds.push(id);
      }
    }

    return matchedTagIds;
  }

  cleanup(): void {
    if (this.eventsQueueIntervalId !== null) {
      clearInterval(this.eventsQueueIntervalId);
      this.eventsQueueIntervalId = null;
    }
  }
}
