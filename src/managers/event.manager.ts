import {
  EVENT_SENT_INTERVAL_MS,
  EVENT_SENT_INTERVAL_TEST_MS,
  MAX_EVENTS_QUEUE_LENGTH,
  DUPLICATE_EVENT_THRESHOLD_MS,
  CIRCUIT_BREAKER_CONSTANTS,
  MAX_FINGERPRINTS,
  FINGERPRINT_CLEANUP_MULTIPLIER,
  CLICK_COORDINATE_PRECISION,
} from '../constants';
import { BaseEventsQueueDto, CustomEventData, EventData, EventType } from '../types';
import { getUTMParameters, isUrlPathExcluded } from '../utils';
import { debugLog } from '../utils/logging';
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
  private readonly storageManager: StorageManager;

  private eventsQueue: EventData[] = [];
  private lastEvent: EventData | null = null;
  private eventsQueueIntervalId: number | null = null;
  private intervalActive = false;

  // Circuit breaker properties
  private failureCount = 0;
  private readonly MAX_FAILURES = CIRCUIT_BREAKER_CONSTANTS.MAX_FAILURES;
  private circuitOpen = false;
  private circuitOpenTime = 0;
  private backoffDelay: number = CIRCUIT_BREAKER_CONSTANTS.INITIAL_BACKOFF_DELAY_MS;
  private circuitResetTimeoutId: ReturnType<typeof setTimeout> | null = null;

  // Event deduplication properties
  private readonly eventFingerprints = new Map<string, number>();

  // Persistence storage key
  private readonly PERSISTENCE_KEY = 'tl:circuit_breaker_events';

  constructor(storeManager: StorageManager, googleAnalytics: GoogleAnalyticsIntegration | null = null) {
    super();

    this.storageManager = storeManager;
    this.googleAnalytics = googleAnalytics;
    this.samplingManager = new SamplingManager();
    this.tagsManager = new TagsManager();
    this.dataSender = new SenderManager(storeManager);

    // Restore any persisted events on initialization
    this.restoreEventsFromStorage();

    debugLog.debug('EventManager', 'EventManager initialized', {
      hasGoogleAnalytics: !!googleAnalytics,
      restoredEventsCount: this.eventsQueue.length,
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
    debugLog.info('EventManager', `📥 Event captured: ${type}`, {
      type,
      page_url,
      hasCustomEvent: !!custom_event,
      hasClickData: !!click_data,
      hasScrollData: !!scroll_data,
      hasWebVitals: !!web_vitals,
    });

    if (!this.samplingManager.shouldSampleEvent(type as EventType, web_vitals)) {
      debugLog.debug('EventManager', 'Event filtered by sampling', { type, samplingActive: true });

      return;
    }

    const isDuplicatedEvent = this.isDuplicatedEvent({
      type,
      page_url,
      scroll_data,
      click_data,
      custom_event,
      web_vitals,
      session_end_reason,
      session_start_recovered,
    });

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

      debugLog.debug('EventManager', 'Duplicate event detected, timestamp updated', {
        type,
        queueLength: this.eventsQueue.length,
      });

      return;
    }

    const effectivePageUrl = (page_url as string) || this.get('pageUrl');
    const isRouteExcluded = isUrlPathExcluded(effectivePageUrl, this.get('config').excludedUrlPaths);
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

    if (this.get('config')?.tags?.length) {
      const matchedTags = this.tagsManager.getEventTagsIds(payload, this.get('device'));

      if (matchedTags?.length) {
        payload.tags =
          this.get('config')?.mode === 'qa' || this.get('config')?.mode === 'debug'
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

  stop(): void {
    // Clear interval and reset interval state
    if (this.eventsQueueIntervalId) {
      clearInterval(this.eventsQueueIntervalId);
      this.eventsQueueIntervalId = null;
      this.intervalActive = false;
    }

    // Clean up circuit breaker timeout
    if (this.circuitResetTimeoutId) {
      clearTimeout(this.circuitResetTimeoutId);
      this.circuitResetTimeoutId = null;
    }

    // Persist any remaining events before stopping
    if (this.eventsQueue.length > 0) {
      this.persistEventsToStorage();
    }

    // Clean up all state variables
    this.eventFingerprints.clear();
    this.circuitOpen = false;
    this.circuitOpenTime = 0;
    this.failureCount = 0;
    this.backoffDelay = CIRCUIT_BREAKER_CONSTANTS.INITIAL_BACKOFF_DELAY_MS;
    this.lastEvent = null;

    // Stop the data sender to clean up retry timeouts
    this.dataSender.stop();
  }

  private processAndSend(payload: EventData): void {
    debugLog.info('EventManager', `🔄 Event processed and queued: ${payload.type}`, {
      type: payload.type,
      timestamp: payload.timestamp,
      page_url: payload.page_url,
      queueLengthBefore: this.eventsQueue.length,
    });

    if (this.get('config').ipExcluded) {
      debugLog.info('EventManager', `❌ Event blocked: IP excluded`);

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

    if (!this.eventsQueueIntervalId) {
      this.initEventsQueueInterval();
      debugLog.info('EventManager', `⏰ Event sender initialized - queue will be sent periodically`, {
        queueLength: this.eventsQueue.length,
      });
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

    const interval = this.get('config')?.id === 'test' ? EVENT_SENT_INTERVAL_TEST_MS : EVENT_SENT_INTERVAL_MS;

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
    const success = await this.dataSender.sendEventsQueueAsync(body);

    if (success) {
      this.eventsQueue = [];
      this.clearQueueInterval();
    }

    return success;
  }

  flushImmediatelySync(): boolean {
    if (this.eventsQueue.length === 0) {
      return true;
    }

    const body = this.buildEventsPayload();
    const success = this.dataSender.sendEventsQueueSync(body);

    if (success) {
      this.eventsQueue = [];
      this.clearQueueInterval();
    }

    return success;
  }

  getQueueLength(): number {
    return this.eventsQueue.length;
  }

  private sendEventsQueue(): void {
    if (this.eventsQueue.length === 0) {
      return;
    }

    debugLog.info('EventManager', `📤 Preparing to send event queue`, {
      queueLength: this.eventsQueue.length,
      hasSessionId: !!this.get('sessionId'),
      circuitOpen: this.circuitOpen,
    });

    // Circuit breaker: check if it should be reset or continue blocking
    if (this.circuitOpen) {
      const timeSinceOpen = Date.now() - this.circuitOpenTime;
      if (timeSinceOpen >= CIRCUIT_BREAKER_CONSTANTS.RECOVERY_TIME_MS) {
        this.resetCircuitBreaker();
        debugLog.info('EventManager', 'Circuit breaker reset after timeout', {
          timeSinceOpen,
          recoveryTime: CIRCUIT_BREAKER_CONSTANTS.RECOVERY_TIME_MS,
        });
      } else {
        debugLog.debug('EventManager', 'Circuit breaker is open - skipping event sending', {
          queueLength: this.eventsQueue.length,
          failureCount: this.failureCount,
          timeSinceOpen,
          recoveryTime: CIRCUIT_BREAKER_CONSTANTS.RECOVERY_TIME_MS,
        });
        return;
      }
    }

    if (!this.get('sessionId')) {
      debugLog.info('EventManager', `⏳ Queue waiting: ${this.eventsQueue.length} events waiting for active session`);
      return;
    }

    const body = this.buildEventsPayload();
    const success = this.dataSender.sendEventsQueue(body);

    if (success) {
      debugLog.info('EventManager', `✅ Event queue sent successfully`, {
        eventsCount: body.events.length,
        sessionId: body.session_id,
        uniqueEventsAfterDedup: body.events.length,
      });

      this.eventsQueue = [];
      this.failureCount = 0;
      this.backoffDelay = CIRCUIT_BREAKER_CONSTANTS.INITIAL_BACKOFF_DELAY_MS;

      // Clear any persisted events on successful send
      this.clearPersistedEvents();
    } else {
      debugLog.info('EventManager', `❌ Failed to send event queue`, {
        eventsCount: body.events.length,
        failureCount: this.failureCount + 1,
        willOpenCircuit: this.failureCount + 1 >= this.MAX_FAILURES,
      });

      // Persist failed events for recovery instead of restoring queue to prevent duplicates
      this.persistEventsToStorage();
      this.eventsQueue = [];
      this.failureCount++;

      if (this.failureCount >= this.MAX_FAILURES) {
        this.openCircuitBreaker();
      }
    }
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

  private getEventFingerprint(event: Partial<EventData>): string {
    const key = `${event.type}_${event.page_url}`;

    if (event.click_data) {
      // Round coordinates to reduce false positives
      const x = Math.round((event.click_data.x || 0) / CLICK_COORDINATE_PRECISION) * CLICK_COORDINATE_PRECISION;
      const y = Math.round((event.click_data.y || 0) / CLICK_COORDINATE_PRECISION) * CLICK_COORDINATE_PRECISION;
      return `${key}_${x}_${y}_${event.click_data.tag}_${event.click_data.id}`;
    }

    if (event.scroll_data) {
      return `${key}_${event.scroll_data.depth}_${event.scroll_data.direction}`;
    }

    if (event.custom_event) {
      return `${key}_${event.custom_event.name}`;
    }

    if (event.web_vitals) {
      return `${key}_${event.web_vitals.type}`;
    }

    if (event.session_end_reason) {
      return `${key}_${event.session_end_reason}`;
    }

    if (event.session_start_recovered !== undefined) {
      return `${key}_${event.session_start_recovered}`;
    }

    return key;
  }

  private isDuplicatedEvent(event: Partial<EventData>): boolean {
    const fingerprint = this.getEventFingerprint(event);
    const lastTime = this.eventFingerprints.get(fingerprint) ?? 0;
    const now = Date.now();

    if (now - lastTime < DUPLICATE_EVENT_THRESHOLD_MS) {
      return true;
    }

    this.eventFingerprints.set(fingerprint, now);

    // Clean up old fingerprints to prevent memory leaks
    this.cleanupOldFingerprints();

    return false;
  }

  /**
   * Cleans up old fingerprints to prevent memory leaks
   */
  private cleanupOldFingerprints(): void {
    if (this.eventFingerprints.size <= MAX_FINGERPRINTS) {
      return;
    }

    const now = Date.now();
    const cleanupThreshold = DUPLICATE_EVENT_THRESHOLD_MS * FINGERPRINT_CLEANUP_MULTIPLIER;
    const keysToDelete: string[] = [];

    for (const [key, timestamp] of this.eventFingerprints) {
      if (now - timestamp > cleanupThreshold) {
        keysToDelete.push(key);
      }
    }

    // Delete old entries
    for (const key of keysToDelete) {
      this.eventFingerprints.delete(key);
    }

    debugLog.debug('EventManager', 'Cleaned up old event fingerprints', {
      totalFingerprints: this.eventFingerprints.size + keysToDelete.length,
      cleanedCount: keysToDelete.length,
      remainingCount: this.eventFingerprints.size,
      cleanupThreshold,
    });
  }

  /**
   * Opens the circuit breaker with time-based recovery and event persistence
   */
  private openCircuitBreaker(): void {
    this.circuitOpen = true;
    this.circuitOpenTime = Date.now();

    // Persist events before clearing queue to prevent data loss
    this.persistEventsToStorage();

    const eventsCount = this.eventsQueue.length;
    this.eventsQueue = []; // Clear memory queue

    debugLog.warn('EventManager', 'Circuit breaker opened with time-based recovery', {
      maxFailures: this.MAX_FAILURES,
      persistedEvents: eventsCount,
      failureCount: this.failureCount,
      recoveryTime: CIRCUIT_BREAKER_CONSTANTS.RECOVERY_TIME_MS,
      openTime: this.circuitOpenTime,
    });

    // Increase backoff for next failure
    this.backoffDelay = Math.min(
      this.backoffDelay * CIRCUIT_BREAKER_CONSTANTS.BACKOFF_MULTIPLIER,
      CIRCUIT_BREAKER_CONSTANTS.MAX_BACKOFF_DELAY_MS,
    );
  }

  /**
   * Resets the circuit breaker and attempts to restore persisted events
   */
  private resetCircuitBreaker(): void {
    this.circuitOpen = false;
    this.circuitOpenTime = 0;
    this.failureCount = 0;
    this.circuitResetTimeoutId = null;

    debugLog.info('EventManager', 'Circuit breaker reset - attempting to restore events', {
      currentQueueLength: this.eventsQueue.length,
    });

    // Restore persisted events
    this.restoreEventsFromStorage();

    debugLog.info('EventManager', 'Circuit breaker reset completed', {
      restoredQueueLength: this.eventsQueue.length,
      backoffDelay: this.backoffDelay,
    });
  }

  /**
   * Persists current events queue to localStorage for recovery
   */
  private persistEventsToStorage(): void {
    try {
      if (this.eventsQueue.length === 0) {
        return;
      }

      const persistData = {
        events: this.eventsQueue,
        timestamp: Date.now(),
        failureCount: this.failureCount,
      };

      this.storageManager.setItem(this.PERSISTENCE_KEY, JSON.stringify(persistData));

      debugLog.debug('EventManager', 'Events persisted to storage for recovery', {
        eventsCount: this.eventsQueue.length,
        failureCount: this.failureCount,
      });
    } catch (error) {
      debugLog.warn('EventManager', 'Failed to persist events to storage', {
        error: error instanceof Error ? error.message : 'Unknown error',
        eventsCount: this.eventsQueue.length,
      });
    }
  }

  /**
   * Restores events from localStorage if available and not expired
   */
  private restoreEventsFromStorage(): void {
    try {
      const persistedData = this.storageManager.getItem(this.PERSISTENCE_KEY);
      if (!persistedData) {
        return;
      }

      const parsed = JSON.parse(persistedData);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      // Check if persisted data is not too old
      if (now - parsed.timestamp > maxAge) {
        this.clearPersistedEvents();
        debugLog.debug('EventManager', 'Cleared expired persisted events', {
          age: now - parsed.timestamp,
          maxAge,
        });
        return;
      }

      // Restore events if we don't already have events in queue
      if (Array.isArray(parsed.events) && parsed.events.length > 0 && this.eventsQueue.length === 0) {
        this.eventsQueue = parsed.events;
        debugLog.info('EventManager', 'Restored events from storage', {
          restoredCount: parsed.events.length,
          originalFailureCount: parsed.failureCount ?? 0,
        });
      }
    } catch (error) {
      debugLog.warn('EventManager', 'Failed to restore events from storage', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      this.clearPersistedEvents();
    }
  }

  /**
   * Clears persisted events from localStorage
   */
  private clearPersistedEvents(): void {
    try {
      this.storageManager.removeItem(this.PERSISTENCE_KEY);
      debugLog.debug('EventManager', 'Cleared persisted events from storage');
    } catch (error) {
      debugLog.warn('EventManager', 'Failed to clear persisted events', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
