import {
  EVENT_SENT_INTERVAL_MS,
  MAX_EVENTS_QUEUE_LENGTH,
  DUPLICATE_EVENT_THRESHOLD_MS,
  RATE_LIMIT_WINDOW_MS,
  MAX_EVENTS_PER_SECOND,
  MAX_PENDING_EVENTS_BUFFER,
  BATCH_SIZE_THRESHOLD,
  MAX_SAME_EVENT_PER_MINUTE,
  PER_EVENT_RATE_LIMIT_WINDOW_MS,
  MAX_EVENTS_PER_SESSION,
  MAX_CLICKS_PER_SESSION,
  MAX_PAGE_VIEWS_PER_SESSION,
  MAX_CUSTOM_EVENTS_PER_SESSION,
  MAX_VIEWPORT_EVENTS_PER_SESSION,
  MAX_SCROLL_EVENTS_PER_SESSION,
  MAX_FINGERPRINTS,
  FINGERPRINT_CLEANUP_MULTIPLIER,
  MAX_FINGERPRINTS_HARD_LIMIT,
} from '../constants/config.constants';
import { EventsQueue, EmitterEvent, EventData, EventType, Mode, TransformerMap } from '../types';
import { getUTMParameters, log, Emitter, generateEventId, transformEvent, transformBatch } from '../utils';
import { SenderManager } from './sender.manager';
import { StateManager } from './state.manager';
import { StorageManager } from './storage.manager';
import { GoogleAnalyticsIntegration } from '../integrations/google-analytics.integration';

export class EventManager extends StateManager {
  private readonly google: GoogleAnalyticsIntegration | null;
  private readonly dataSenders: SenderManager[];
  private readonly emitter: Emitter | null;
  private readonly transformers: TransformerMap;
  private readonly recentEventFingerprints = new Map<string, number>();
  private readonly perEventRateLimits: Map<string, number[]> = new Map();

  private eventsQueue: EventData[] = [];
  private pendingEventsBuffer: Partial<EventData>[] = [];
  private sendIntervalId: number | null = null;
  private rateLimitCounter = 0;
  private rateLimitWindowStart = 0;
  private lastSessionId: string | null = null;

  private sessionEventCounts: {
    total: number;
    [key: string]: number;
  } = {
    total: 0,
    [EventType.CLICK]: 0,
    [EventType.PAGE_VIEW]: 0,
    [EventType.CUSTOM]: 0,
    [EventType.VIEWPORT_VISIBLE]: 0,
    [EventType.SCROLL]: 0,
  };

  constructor(
    storeManager: StorageManager,
    google: GoogleAnalyticsIntegration | null = null,
    emitter: Emitter | null = null,
    transformers: TransformerMap = {},
  ) {
    super();

    this.google = google;
    this.emitter = emitter;
    this.transformers = transformers;

    this.dataSenders = [];
    const collectApiUrls = this.get('collectApiUrls');

    if (collectApiUrls?.saas) {
      this.dataSenders.push(new SenderManager(storeManager, 'saas', collectApiUrls.saas, transformers));
    }

    if (collectApiUrls?.custom) {
      this.dataSenders.push(new SenderManager(storeManager, 'custom', collectApiUrls.custom, transformers));
    }
  }

  async recoverPersistedEvents(): Promise<void> {
    const recoveryPromises = this.dataSenders.map(async (sender) =>
      sender.recoverPersistedEvents({
        onSuccess: (_eventCount, recoveredEvents, body) => {
          if (recoveredEvents && recoveredEvents.length > 0) {
            const eventIds = recoveredEvents.map((e) => e.id);
            this.removeProcessedEvents(eventIds);

            if (body) {
              this.emitEventsQueue(body);
            }
          }
        },
        onFailure: () => {
          log('warn', 'Failed to recover persisted events');
        },
      }),
    );

    await Promise.allSettled(recoveryPromises);
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
    viewport_data,
  }: Partial<EventData>): void {
    if (!type) {
      log('error', 'Event type is required - event will be ignored');
      return;
    }

    const currentSessionId = this.get('sessionId');

    if (!currentSessionId) {
      if (this.pendingEventsBuffer.length >= MAX_PENDING_EVENTS_BUFFER) {
        this.pendingEventsBuffer.shift();
        log('warn', 'Pending events buffer full - dropping oldest event', {
          data: { maxBufferSize: MAX_PENDING_EVENTS_BUFFER },
        });
      }

      this.pendingEventsBuffer.push({
        type,
        page_url,
        from_page_url,
        scroll_data,
        click_data,
        custom_event,
        web_vitals,
        error_data,
        session_end_reason,
        viewport_data,
      });

      return;
    }

    if (this.lastSessionId !== currentSessionId) {
      this.lastSessionId = currentSessionId;
      this.sessionEventCounts = {
        total: 0,
        [EventType.CLICK]: 0,
        [EventType.PAGE_VIEW]: 0,
        [EventType.CUSTOM]: 0,
        [EventType.VIEWPORT_VISIBLE]: 0,
        [EventType.SCROLL]: 0,
      };
    }

    const isCriticalEvent = type === EventType.SESSION_START || type === EventType.SESSION_END;

    if (!isCriticalEvent && !this.checkRateLimit()) {
      return;
    }

    const eventType = type as EventType;

    if (!isCriticalEvent) {
      if (this.sessionEventCounts.total >= MAX_EVENTS_PER_SESSION) {
        log('warn', 'Session event limit reached', {
          data: {
            type: eventType,
            total: this.sessionEventCounts.total,
            limit: MAX_EVENTS_PER_SESSION,
          },
        });

        return;
      }

      const typeLimit = this.getTypeLimitForEvent(eventType);

      if (typeLimit) {
        const currentCount = this.sessionEventCounts[eventType];

        if (currentCount !== undefined && currentCount >= typeLimit) {
          log('warn', 'Session event type limit reached', {
            data: {
              type: eventType,
              count: currentCount,
              limit: typeLimit,
            },
          });

          return;
        }
      }
    }

    if (eventType === EventType.CUSTOM && custom_event?.name) {
      const maxSameEventPerMinute = this.get('config')?.maxSameEventPerMinute ?? MAX_SAME_EVENT_PER_MINUTE;

      if (!this.checkPerEventRateLimit(custom_event.name, maxSameEventPerMinute)) {
        return;
      }
    }
    const isSessionStart = eventType === EventType.SESSION_START;

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
      viewport_data,
    });

    // Handle event filtered by beforeSend transformer
    if (!payload) {
      return;
    }

    if (!isCriticalEvent && !this.shouldSample()) {
      return;
    }

    if (isSessionStart) {
      const currentSessionId = this.get('sessionId');

      if (!currentSessionId) {
        log('error', 'Session start event requires sessionId - event will be ignored');
        return;
      }

      if (this.get('hasStartSession')) {
        log('warn', 'Duplicate session_start detected', {
          data: { sessionId: currentSessionId },
        });

        return;
      }

      this.set('hasStartSession', true);
    }

    if (this.isDuplicateEvent(payload)) {
      return;
    }

    if (this.get('mode') === Mode.QA && eventType === EventType.CUSTOM && custom_event) {
      log('info', 'Event', {
        showToClient: true,
        data: {
          name: custom_event.name,
          ...(custom_event.metadata && { metadata: custom_event.metadata }),
        },
      });

      this.emitEvent(payload);

      return;
    }

    this.addToQueue(payload);

    if (!isCriticalEvent) {
      this.sessionEventCounts.total++;

      if (this.sessionEventCounts[eventType] !== undefined) {
        this.sessionEventCounts[eventType]++;
      }
    }
  }

  stop(): void {
    if (this.sendIntervalId) {
      clearInterval(this.sendIntervalId);
      this.sendIntervalId = null;
    }

    this.eventsQueue = [];
    this.pendingEventsBuffer = [];
    this.recentEventFingerprints.clear();
    this.rateLimitCounter = 0;
    this.rateLimitWindowStart = 0;
    this.perEventRateLimits.clear();
    this.sessionEventCounts = {
      total: 0,
      [EventType.CLICK]: 0,
      [EventType.PAGE_VIEW]: 0,
      [EventType.CUSTOM]: 0,
      [EventType.VIEWPORT_VISIBLE]: 0,
      [EventType.SCROLL]: 0,
    };
    this.lastSessionId = null;
    this.set('hasStartSession', false);

    this.dataSenders.forEach((sender) => {
      sender.stop();
    });
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

  flushPendingEvents(): void {
    if (this.pendingEventsBuffer.length === 0) {
      return;
    }

    const currentSessionId = this.get('sessionId');
    if (!currentSessionId) {
      log('warn', 'Cannot flush pending events: session not initialized - keeping in buffer', {
        data: { bufferedEventCount: this.pendingEventsBuffer.length },
      });

      return;
    }

    const bufferedEvents = [...this.pendingEventsBuffer];
    this.pendingEventsBuffer = [];

    bufferedEvents.forEach((event) => {
      this.track(event);
    });
  }

  private clearSendInterval(): void {
    if (this.sendIntervalId) {
      clearInterval(this.sendIntervalId);
      this.sendIntervalId = null;
    }
  }

  private isSuccessfulResult(result: PromiseSettledResult<boolean>): boolean {
    return result.status === 'fulfilled' && result.value === true;
  }

  private flushEvents(isSync: boolean): boolean | Promise<boolean> {
    if (this.eventsQueue.length === 0) {
      return isSync ? true : Promise.resolve(true);
    }

    const body = this.buildEventsPayload();
    const eventsToSend = [...this.eventsQueue];
    const eventIds = eventsToSend.map((e) => e.id);

    if (this.dataSenders.length === 0) {
      this.removeProcessedEvents(eventIds);
      this.clearSendInterval();
      this.emitEventsQueue(body);

      return isSync ? true : Promise.resolve(true);
    }

    if (isSync) {
      const results = this.dataSenders.map((sender) => sender.sendEventsQueueSync(body));
      const allSucceeded = results.every((success) => success);

      if (allSucceeded) {
        this.removeProcessedEvents(eventIds);
        this.clearSendInterval();
        this.emitEventsQueue(body);
      } else {
        this.removeProcessedEvents(eventIds);
        this.clearSendInterval();
      }

      return allSucceeded;
    } else {
      const sendPromises = this.dataSenders.map(async (sender) =>
        sender.sendEventsQueue(body, {
          onSuccess: () => {},
          onFailure: () => {},
        }),
      );

      return Promise.allSettled(sendPromises).then((results) => {
        this.removeProcessedEvents(eventIds);
        this.clearSendInterval();

        const anySucceeded = results.some((result) => this.isSuccessfulResult(result));

        if (anySucceeded) {
          this.emitEventsQueue(body);
        }

        const failedCount = results.filter((result) => !this.isSuccessfulResult(result)).length;

        if (failedCount > 0) {
          log(
            'warn',
            'Async flush completed with some failures, events removed from queue and persisted per-integration',
            {
              data: { eventCount: eventsToSend.length, failedCount },
            },
          );
        }

        return anySucceeded;
      });
    }
  }

  private async sendEventsQueue(): Promise<void> {
    if (!this.get('sessionId') || this.eventsQueue.length === 0) {
      return;
    }

    const body = this.buildEventsPayload();

    if (this.dataSenders.length === 0) {
      this.emitEventsQueue(body);
      return;
    }

    const eventsToSend = [...this.eventsQueue];
    const eventIds = eventsToSend.map((e) => e.id);

    const sendPromises = this.dataSenders.map(async (sender) =>
      sender.sendEventsQueue(body, {
        onSuccess: () => {},
        onFailure: () => {},
      }),
    );

    const results = await Promise.allSettled(sendPromises);

    this.removeProcessedEvents(eventIds);

    const anySucceeded = results.some((result) => this.isSuccessfulResult(result));

    if (anySucceeded) {
      this.emitEventsQueue(body);
    }

    if (this.eventsQueue.length === 0) {
      this.clearSendInterval();
    }

    const failedCount = results.filter((result) => !this.isSuccessfulResult(result)).length;

    if (failedCount > 0) {
      log('warn', 'Events send completed with some failures, removed from queue and persisted per-integration', {
        data: { eventCount: eventsToSend.length, failedCount },
      });
    }
  }

  private buildEventsPayload(): EventsQueue {
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

    let queue: EventsQueue = {
      user_id: this.get('userId'),
      session_id: this.get('sessionId') as string,
      device: this.get('device'),
      events,
      ...(this.get('config')?.globalMetadata && { global_metadata: this.get('config')?.globalMetadata }),
    };

    const collectApiUrls = this.get('collectApiUrls');
    const hasAnyBackend = Boolean(collectApiUrls?.custom || collectApiUrls?.saas);
    const beforeBatchTransformer = this.transformers.beforeBatch;

    if (!hasAnyBackend && beforeBatchTransformer) {
      const transformed = transformBatch(queue, beforeBatchTransformer, 'EventManager');

      if (transformed !== null) {
        queue = transformed;
      }
    }

    return queue;
  }

  private buildEventPayload(data: Partial<EventData>): EventData | null {
    const isSessionStart = data.type === EventType.SESSION_START;
    const currentPageUrl = data.page_url ?? this.get('pageUrl');

    let payload: EventData = {
      id: generateEventId(),
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
      ...(data.viewport_data && { viewport_data: data.viewport_data }),
      ...(isSessionStart && getUTMParameters() && { utm: getUTMParameters() }),
    };

    const collectApiUrls = this.get('collectApiUrls');
    const hasCustomBackend = Boolean(collectApiUrls?.custom);
    const hasSaasBackend = Boolean(collectApiUrls?.saas);
    const hasAnyBackend = hasCustomBackend || hasSaasBackend;
    const isMultiIntegration = hasCustomBackend && hasSaasBackend;
    const beforeSendTransformer = this.transformers.beforeSend;

    const shouldApplyBeforeSend =
      beforeSendTransformer && (!hasAnyBackend || (hasCustomBackend && !isMultiIntegration));

    if (shouldApplyBeforeSend) {
      const transformed = transformEvent(payload, beforeSendTransformer, 'EventManager');

      if (transformed === null) {
        return null;
      }

      payload = transformed;
    }

    return payload;
  }

  private isDuplicateEvent(event: EventData): boolean {
    const now = Date.now();
    const fingerprint = this.createEventFingerprint(event);

    const lastSeen = this.recentEventFingerprints.get(fingerprint);

    if (lastSeen && now - lastSeen < DUPLICATE_EVENT_THRESHOLD_MS) {
      this.recentEventFingerprints.set(fingerprint, now);
      return true;
    }

    this.recentEventFingerprints.set(fingerprint, now);

    if (this.recentEventFingerprints.size > MAX_FINGERPRINTS) {
      this.pruneOldFingerprints();
    }

    if (this.recentEventFingerprints.size > MAX_FINGERPRINTS_HARD_LIMIT) {
      this.recentEventFingerprints.clear();
      this.recentEventFingerprints.set(fingerprint, now);

      log('warn', 'Event fingerprint cache exceeded hard limit, cleared', {
        data: { hardLimit: MAX_FINGERPRINTS_HARD_LIMIT },
      });
    }

    return false;
  }

  private pruneOldFingerprints(): void {
    const now = Date.now();
    const cutoff = DUPLICATE_EVENT_THRESHOLD_MS * FINGERPRINT_CLEANUP_MULTIPLIER; // 5 seconds

    for (const [fingerprint, timestamp] of this.recentEventFingerprints.entries()) {
      if (now - timestamp > cutoff) {
        this.recentEventFingerprints.delete(fingerprint);
      }
    }

    log('debug', 'Pruned old event fingerprints', {
      data: {
        remaining: this.recentEventFingerprints.size,
        cutoffMs: cutoff,
      },
    });
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

      log('warn', 'Event queue overflow, oldest non-critical event removed', {
        data: {
          maxLength: MAX_EVENTS_QUEUE_LENGTH,
          currentLength: this.eventsQueue.length,
          removedEventType: removedEvent?.type,
          wasCritical: removedEvent?.type === EventType.SESSION_START || removedEvent?.type === EventType.SESSION_END,
        },
      });
    }

    if (!this.sendIntervalId) {
      this.startSendInterval();
    }

    if (this.eventsQueue.length >= BATCH_SIZE_THRESHOLD) {
      void this.sendEventsQueue();
    }

    this.handleGoogleAnalyticsIntegration(event);
  }

  private startSendInterval(): void {
    this.sendIntervalId = window.setInterval(() => {
      if (this.eventsQueue.length > 0) {
        void this.sendEventsQueue();
      }
    }, EVENT_SENT_INTERVAL_MS);
  }

  private handleGoogleAnalyticsIntegration(event: EventData): void {
    if (!this.google || this.get('mode') === Mode.QA) {
      return;
    }

    const googleConfig = this.get('config').integrations?.google;
    const forwardEvents = googleConfig?.forwardEvents;

    if (!forwardEvents?.length) {
      return;
    }

    const shouldForward = forwardEvents === 'all' || forwardEvents.includes(event.type);

    if (!shouldForward) {
      return;
    }

    if (event.type === EventType.CUSTOM && event.custom_event) {
      this.google.trackEvent(event.custom_event.name, event.custom_event.metadata ?? {});
    } else if (event.type === EventType.PAGE_VIEW) {
      this.google.trackEvent('page_view', {
        page_location: event.page_url,
        page_title: document.title,
        ...(event.from_page_url && { page_referrer: event.from_page_url }),
      });
    } else if (event.type === EventType.SESSION_START) {
      this.google.trackEvent('session_start', {
        engagement_time_msec: 0,
        ...(event.referrer && { referrer: event.referrer }),
        ...(event.utm && event.utm),
      });
    } else if (event.type === EventType.WEB_VITALS && event.web_vitals) {
      const metricName = event.web_vitals.type.toLowerCase();
      this.google.trackEvent(metricName, {
        value: event.web_vitals.value,
      });
    } else if (event.type === EventType.ERROR && event.error_data) {
      this.google.trackEvent('exception', {
        description: event.error_data.message,
        fatal: false,
      });
    } else if (event.type === EventType.SCROLL && event.scroll_data) {
      this.google.trackEvent('scroll', {
        depth: event.scroll_data.depth,
        direction: event.scroll_data.direction,
      });
    } else if (event.type === EventType.CLICK && event.click_data) {
      this.google.trackEvent('click', {
        ...(event.click_data.id && { element_id: event.click_data.id }),
        ...(event.click_data.text && { text: event.click_data.text }),
        ...(event.click_data.tag && { tag: event.click_data.tag }),
      });
    } else if (event.type === EventType.VIEWPORT_VISIBLE && event.viewport_data) {
      this.google.trackEvent('viewport_visible', {
        selector: event.viewport_data.selector,
        ...(event.viewport_data.id && { element_id: event.viewport_data.id }),
        ...(event.viewport_data.name && { element_name: event.viewport_data.name }),
        dwell_time: event.viewport_data.dwellTime,
        visibility_ratio: event.viewport_data.visibilityRatio,
      });
    }
  }

  private shouldSample(): boolean {
    const samplingRate = this.get('config')?.samplingRate ?? 1;
    return Math.random() < samplingRate;
  }

  private checkRateLimit(): boolean {
    const now = Date.now();

    if (now - this.rateLimitWindowStart > RATE_LIMIT_WINDOW_MS) {
      this.rateLimitCounter = 0;
      this.rateLimitWindowStart = now;
    }

    if (this.rateLimitCounter >= MAX_EVENTS_PER_SECOND) {
      return false;
    }

    this.rateLimitCounter++;
    return true;
  }

  private checkPerEventRateLimit(eventName: string, maxSameEventPerMinute: number): boolean {
    const now = Date.now();
    const timestamps = this.perEventRateLimits.get(eventName) ?? [];

    const validTimestamps = timestamps.filter((ts) => now - ts < PER_EVENT_RATE_LIMIT_WINDOW_MS);

    if (validTimestamps.length >= maxSameEventPerMinute) {
      log('warn', 'Per-event rate limit exceeded for custom event', {
        data: {
          eventName,
          limit: maxSameEventPerMinute,
          window: `${PER_EVENT_RATE_LIMIT_WINDOW_MS / 1000}s`,
        },
      });
      return false;
    }

    validTimestamps.push(now);
    this.perEventRateLimits.set(eventName, validTimestamps);

    return true;
  }

  private getTypeLimitForEvent(type: EventType): number | null {
    const limits: Partial<Record<EventType, number>> = {
      [EventType.CLICK]: MAX_CLICKS_PER_SESSION,
      [EventType.PAGE_VIEW]: MAX_PAGE_VIEWS_PER_SESSION,
      [EventType.CUSTOM]: MAX_CUSTOM_EVENTS_PER_SESSION,
      [EventType.VIEWPORT_VISIBLE]: MAX_VIEWPORT_EVENTS_PER_SESSION,
      [EventType.SCROLL]: MAX_SCROLL_EVENTS_PER_SESSION,
    };
    return limits[type] ?? null;
  }

  private removeProcessedEvents(eventIds: string[]): void {
    const eventIdSet = new Set(eventIds);

    this.eventsQueue = this.eventsQueue.filter((event) => {
      return !eventIdSet.has(event.id);
    });
  }

  private emitEvent(eventData: EventData): void {
    if (this.emitter) {
      this.emitter.emit(EmitterEvent.EVENT, eventData);
    }
  }

  private emitEventsQueue(queue: EventsQueue): void {
    if (this.emitter) {
      this.emitter.emit(EmitterEvent.QUEUE, queue);
    }
  }
}
