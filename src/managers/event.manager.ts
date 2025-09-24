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
  private isSending = false;

  // Event deduplication properties
  private readonly eventFingerprints = new Map<string, number>();

  constructor(storeManager: StorageManager, googleAnalytics: GoogleAnalyticsIntegration | null = null) {
    super();

    this.storageManager = storeManager;
    this.googleAnalytics = googleAnalytics;
    this.samplingManager = new SamplingManager();
    this.tagsManager = new TagsManager();
    this.dataSender = new SenderManager(storeManager);
    this.set('circuitBreakerOpen', false);

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
      onSuccess: () => {
        this.failureCount = 0;
        this.backoffDelay = CIRCUIT_BREAKER_CONSTANTS.INITIAL_BACKOFF_DELAY_MS;
      },
      onFailure: () => {
        this.failureCount++;
        if (this.failureCount >= this.MAX_FAILURES) {
          this.openCircuitBreaker();
        }
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
    if (this.circuitOpen) {
      debugLog.debug('EventManager', 'Event dropped - circuit breaker is open', { type });
      return;
    }

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
      if (this.eventsQueue.length > 0 || this.circuitOpen) {
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
    // Prevent concurrent sends
    if (this.isSending) {
      debugLog.debug('EventManager', 'Send already in progress, skipping', {
        queueLength: this.eventsQueue.length,
      });
      return;
    }

    // Circuit breaker: check if it should be reset BEFORE checking queue length
    // This ensures the circuit breaker can reset even when queue is empty
    if (this.circuitOpen) {
      const timeSinceOpen = Date.now() - this.circuitOpenTime;
      if (timeSinceOpen >= CIRCUIT_BREAKER_CONSTANTS.RECOVERY_TIME_MS) {
        const recoverySuccess = await this.handleCircuitBreakerRecovery();

        if (!recoverySuccess) {
          // No reabrir inmediatamente, usar backoff progresivo
          this.scheduleCircuitBreakerRetry();
          return;
        }

        // Solo procesar cola normal si recovery fue exitoso
        // Continuar con el flujo normal...
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

    if (this.eventsQueue.length === 0) {
      return;
    }

    if (!this.get('sessionId')) {
      return;
    }

    const body = this.buildEventsPayload();

    // Set sending flag to prevent concurrent sends
    this.isSending = true;

    // Create immutable copy of events to send
    const eventsToSend = [...this.eventsQueue];
    const eventIds = eventsToSend.map((e) => e.timestamp + '_' + e.type);

    // Use callbacks to handle async success/failure from fetch
    await this.dataSender.sendEventsQueue(body, {
      onSuccess: () => {
        this.failureCount = 0;
        this.backoffDelay = CIRCUIT_BREAKER_CONSTANTS.INITIAL_BACKOFF_DELAY_MS;

        // Only remove events that were sent successfully
        this.removeProcessedEvents(eventIds);

        debugLog.info('EventManager', 'Events sent successfully', {
          eventCount: eventsToSend.length,
          remainingQueueLength: this.eventsQueue.length,
        });
      },
      onFailure: () => {
        this.failureCount++;

        // Events remain in queue for retry
        debugLog.warn('EventManager', 'Events send failed, keeping in queue', {
          eventCount: eventsToSend.length,
          failureCount: this.failureCount,
        });

        if (this.failureCount >= this.MAX_FAILURES) {
          this.openCircuitBreaker();
        }
      },
    });

    this.isSending = false;
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
    this.set('circuitBreakerOpen', true);

    const eventsCount = this.eventsQueue.length;

    if (eventsCount > 0) {
      const persistedData = {
        userId: this.get('userId'),
        sessionId: this.get('sessionId') as string,
        device: this.get('device'),
        events: this.eventsQueue,
        timestamp: Date.now(),
        ...(this.get('config')?.globalMetadata && { global_metadata: this.get('config')?.globalMetadata }),
      };

      try {
        const queueKey = this.dataSender.getQueueStorageKey();
        this.storageManager.setItem(queueKey, JSON.stringify(persistedData));
        debugLog.info('EventManager', 'Events persisted before circuit breaker opened', {
          eventsCount,
        });
      } catch (error) {
        debugLog.error('EventManager', 'Failed to persist events before circuit breaker opened', { error });
      }
    }

    this.eventsQueue = [];

    debugLog.warn('EventManager', 'Circuit breaker opened with time-based recovery', {
      maxFailures: this.MAX_FAILURES,
      eventsCount,
      failureCount: this.failureCount,
      recoveryTime: CIRCUIT_BREAKER_CONSTANTS.RECOVERY_TIME_MS,
      openTime: this.circuitOpenTime,
    });

    this.backoffDelay = Math.min(
      this.backoffDelay * CIRCUIT_BREAKER_CONSTANTS.BACKOFF_MULTIPLIER,
      CIRCUIT_BREAKER_CONSTANTS.MAX_BACKOFF_DELAY_MS,
    );
  }

  /**
   * Handles circuit breaker recovery attempt
   * Returns true if recovery was successful, false otherwise
   */
  private async handleCircuitBreakerRecovery(): Promise<boolean> {
    this.resetCircuitBreaker();

    this.isSending = true;
    let recoverySuccess = false;

    try {
      await this.dataSender.recoverPersistedEvents({
        onSuccess: () => {
          recoverySuccess = true;
          this.failureCount = 0;
          this.backoffDelay = CIRCUIT_BREAKER_CONSTANTS.INITIAL_BACKOFF_DELAY_MS;
          debugLog.info('EventManager', 'Circuit breaker recovery successful');
        },
        onFailure: () => {
          recoverySuccess = false;
          debugLog.warn('EventManager', 'Circuit breaker recovery failed');
        },
      });
    } catch (error) {
      recoverySuccess = false;
      debugLog.error('EventManager', 'Circuit breaker recovery error', { error });
    } finally {
      this.isSending = false;
    }

    return recoverySuccess;
  }

  /**
   * Schedules circuit breaker retry with progressive backoff
   */
  private scheduleCircuitBreakerRetry(): void {
    // Incrementar backoff delay para evitar retry agresivo
    this.backoffDelay = Math.min(
      this.backoffDelay * CIRCUIT_BREAKER_CONSTANTS.BACKOFF_MULTIPLIER,
      CIRCUIT_BREAKER_CONSTANTS.MAX_BACKOFF_DELAY_MS,
    );

    // Reabrir circuit breaker con delay aumentado
    this.circuitOpen = true;
    this.circuitOpenTime = Date.now();

    debugLog.warn('EventManager', 'Circuit breaker retry scheduled', {
      nextRetryDelay: this.backoffDelay,
      failureCount: this.failureCount,
    });
  }

  /**
   * Resets the circuit breaker and attempts to restore persisted events
   */
  private resetCircuitBreaker(): void {
    this.circuitOpen = false;
    this.circuitOpenTime = 0;
    this.failureCount = 0;
    this.circuitResetTimeoutId = null;
    this.set('circuitBreakerOpen', false);

    this.dataSender.stop();

    debugLog.info('EventManager', 'Circuit breaker reset completed', {
      currentQueueLength: this.eventsQueue.length,
      backoffDelay: this.backoffDelay,
    });
  }

  private removeProcessedEvents(eventIds: string[]): void {
    const eventIdSet = new Set(eventIds);

    this.eventsQueue = this.eventsQueue.filter((event) => {
      const eventId = event.timestamp + '_' + event.type;
      return !eventIdSet.has(eventId);
    });
  }
}
