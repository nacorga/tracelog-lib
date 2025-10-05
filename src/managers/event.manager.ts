import {
  EVENT_SENT_INTERVAL_MS,
  MAX_EVENTS_QUEUE_LENGTH,
  DUPLICATE_EVENT_THRESHOLD_MS,
} from '../constants/config.constants';
import { BaseEventsQueueDto, EmitterEvent, EventData, EventType, Mode } from '../types';
import { getUTMParameters, isUrlPathExcluded, debugLog, Emitter } from '../utils';
import { SenderManager } from './sender.manager';
import { StateManager } from './state.manager';
import { StorageManager } from './storage.manager';
import { GoogleAnalyticsIntegration } from '../integrations/google-analytics.integration';

export class EventManager extends StateManager {
  private readonly googleAnalytics: GoogleAnalyticsIntegration | null;
  private readonly dataSender: SenderManager;
  private readonly emitter: Emitter | null;

  private eventsQueue: EventData[] = [];
  private lastEventFingerprint: string | null = null;
  private lastEventTime = 0;
  private sendIntervalId: number | null = null;

  constructor(
    storeManager: StorageManager,
    googleAnalytics: GoogleAnalyticsIntegration | null = null,
    emitter: Emitter | null = null,
  ) {
    super();

    this.googleAnalytics = googleAnalytics;
    this.dataSender = new SenderManager(storeManager);
    this.emitter = emitter;
  }

  async recoverPersistedEvents(): Promise<void> {
    await this.dataSender.recoverPersistedEvents({
      onSuccess: (_eventCount, recoveredEvents, body) => {
        if (recoveredEvents && recoveredEvents.length > 0) {
          const eventIds = recoveredEvents.map((e) => e.timestamp + '_' + e.type);
          this.removeProcessedEvents(eventIds);

          if (body) {
            this.emitEventsQueue(body);
          }
        }
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
    error_data,
    session_end_reason,
  }: Partial<EventData>): void {
    if (!type) {
      debugLog.warn('EventManager', 'Event type is required');
      return;
    }

    const eventType = type as EventType;
    const isSessionStart = eventType === EventType.SESSION_START;
    const isSessionEnd = eventType === EventType.SESSION_END;
    const isCriticalEvent = isSessionStart || isSessionEnd;

    const currentPageUrl = (page_url as string) || this.get('pageUrl');
    const payload = this.buildEventPayload({
      type: eventType,
      page_url: currentPageUrl,
      from_page_url,
      scroll_data,
      click_data,
      custom_event,
      web_vitals,
      error_data,
      session_end_reason,
    });

    if (this.isEventExcluded(payload)) {
      return;
    }

    if (!isCriticalEvent && !this.shouldSample()) {
      return;
    }

    if (isSessionStart) {
      const currentSessionId = this.get('sessionId');
      if (!currentSessionId) {
        debugLog.warn('EventManager', 'Session start event ignored: missing sessionId');
        return;
      }

      if (this.get('hasStartSession')) {
        debugLog.warn('EventManager', 'Duplicate session_start detected', {
          sessionId: currentSessionId,
        });
        return;
      }

      this.set('hasStartSession', true);
    }

    if (this.isDuplicateEvent(payload)) {
      return;
    }

    this.addToQueue(payload);
  }

  stop(): void {
    if (this.sendIntervalId) {
      clearInterval(this.sendIntervalId);
      this.sendIntervalId = null;
    }

    this.eventsQueue = [];
    this.lastEventFingerprint = null;
    this.lastEventTime = 0;

    this.dataSender.stop();
  }

  async flushImmediately(): Promise<boolean> {
    return this.flushEvents(false);
  }

  flushImmediatelySync(): boolean {
    return this.flushEvents(true) as boolean;
  }

  getQueueLength(): number {
    return this.eventsQueue.length;
  }

  private clearSendInterval(): void {
    if (this.sendIntervalId) {
      clearInterval(this.sendIntervalId);
      this.sendIntervalId = null;
    }
  }

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
        this.emitEventsQueue(body);
      }

      return success;
    } else {
      return this.dataSender.sendEventsQueue(body, {
        onSuccess: () => {
          this.removeProcessedEvents(eventIds);
          this.clearSendInterval();
          this.emitEventsQueue(body);
        },
        onFailure: () => {
          debugLog.warn('EventManager', 'Async flush failed', {
            eventCount: eventsToSend.length,
          });
        },
      });
    }
  }

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
        this.emitEventsQueue(body);
      },
      onFailure: async () => {
        debugLog.warn('EventManager', 'Events send failed, keeping in queue', {
          eventCount: eventsToSend.length,
        });
      },
    });
  }

  private buildEventsPayload(): BaseEventsQueueDto {
    const eventMap = new Map<string, EventData>();
    const order: string[] = [];

    for (const event of this.eventsQueue) {
      const signature = this.createEventSignature(event);

      if (!eventMap.has(signature)) {
        order.push(signature);
      }

      eventMap.set(signature, event);
    }

    const events = order
      .map((signature) => eventMap.get(signature))
      .filter((event): event is EventData => Boolean(event))
      .sort((a, b) => a.timestamp - b.timestamp);

    return {
      user_id: this.get('userId'),
      session_id: this.get('sessionId') as string,
      device: this.get('device'),
      events,
      ...(this.get('config')?.globalMetadata && { global_metadata: this.get('config')?.globalMetadata }),
    };
  }

  private buildEventPayload(data: Partial<EventData>): EventData {
    const isSessionStart = data.type === EventType.SESSION_START;
    const currentPageUrl = data.page_url ?? this.get('pageUrl');

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
      ...(data.error_data && { error_data: data.error_data }),
      ...(data.session_end_reason && { session_end_reason: data.session_end_reason }),
      ...(isSessionStart && getUTMParameters() && { utm: getUTMParameters() }),
    };

    return payload;
  }

  private isEventExcluded(event: EventData): boolean {
    const config = this.get('config');
    const isRouteExcluded = isUrlPathExcluded(event.page_url, config?.excludedUrlPaths ?? []);
    const hasStartSession = this.get('hasStartSession');
    const isSessionEndEvent = event.type === EventType.SESSION_END;
    const isSessionStartEvent = event.type === EventType.SESSION_START;

    if (isRouteExcluded && !isSessionStartEvent && !(isSessionEndEvent && hasStartSession)) {
      return true;
    }

    return false;
  }

  private isDuplicateEvent(event: EventData): boolean {
    const now = Date.now();
    const fingerprint = this.createEventFingerprint(event);

    if (this.lastEventFingerprint === fingerprint && now - this.lastEventTime < DUPLICATE_EVENT_THRESHOLD_MS) {
      return true;
    }

    this.lastEventFingerprint = fingerprint;
    this.lastEventTime = now;
    return false;
  }

  private createEventFingerprint(event: EventData): string {
    let fingerprint = `${event.type}_${event.page_url}`;

    if (event.click_data) {
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

    if (event.error_data) {
      fingerprint += `_error_${event.error_data.type}_${event.error_data.message}`;
    }

    return fingerprint;
  }

  private createEventSignature(event: EventData): string {
    return this.createEventFingerprint(event);
  }

  private addToQueue(event: EventData): void {
    this.eventsQueue.push(event);

    this.emitEvent(event);

    if (this.eventsQueue.length > MAX_EVENTS_QUEUE_LENGTH) {
      const nonCriticalIndex = this.eventsQueue.findIndex(
        (e) => e.type !== EventType.SESSION_START && e.type !== EventType.SESSION_END,
      );

      const removedEvent =
        nonCriticalIndex >= 0 ? this.eventsQueue.splice(nonCriticalIndex, 1)[0] : this.eventsQueue.shift();

      debugLog.warn('EventManager', 'Event queue overflow, oldest non-critical event removed', {
        maxLength: MAX_EVENTS_QUEUE_LENGTH,
        currentLength: this.eventsQueue.length,
        removedEventType: removedEvent?.type,
        wasCritical: removedEvent?.type === EventType.SESSION_START || removedEvent?.type === EventType.SESSION_END,
      });
    }

    if (!this.sendIntervalId) {
      this.startSendInterval();
    }

    this.handleGoogleAnalyticsIntegration(event);
  }

  private startSendInterval(): void {
    this.sendIntervalId = window.setInterval(() => {
      if (this.eventsQueue.length > 0) {
        this.sendEventsQueue();
      }
    }, EVENT_SENT_INTERVAL_MS);
  }

  private handleGoogleAnalyticsIntegration(event: EventData): void {
    if (this.googleAnalytics && event.type === EventType.CUSTOM && event.custom_event) {
      if (this.get('config')?.mode === Mode.QA) {
        return;
      }

      this.googleAnalytics.trackEvent(event.custom_event.name, event.custom_event.metadata ?? {});
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

  private emitEvent(eventData: EventData): void {
    if (this.emitter) {
      this.emitter.emit(EmitterEvent.EVENT, eventData);
    }
  }

  private emitEventsQueue(queue: BaseEventsQueueDto): void {
    if (this.emitter) {
      this.emitter.emit(EmitterEvent.QUEUE, queue);
    }
  }
}
