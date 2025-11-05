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
  CONSENT_FLUSH_BATCH_SIZE,
  CONSENT_FLUSH_DELAY_MS,
} from '../constants/config.constants';
import { EventsQueue, EmitterEvent, EventData, EventType, Mode, TransformerMap } from '../types';
import { getUTMParameters, log, Emitter, generateEventId, transformEvent, transformBatch } from '../utils';
import { SenderManager } from './sender.manager';
import { StateManager } from './state.manager';
import { StorageManager } from './storage.manager';
import { GoogleAnalyticsIntegration } from '../integrations/google-analytics.integration';
import { ConsentManager } from './consent.manager';

/**
 * Core component responsible for event tracking, queue management, deduplication,
 * rate limiting, and multi-integration API communication coordination.
 *
 * **Purpose**: Central hub for all analytics events in TraceLog, managing the complete
 * event lifecycle from capture to transmission.
 *
 * **Core Functionality**:
 * - **Event Tracking**: Captures all user interactions (clicks, scrolls, page views, custom events, web vitals, errors)
 * - **Queue Management**: Batches events with 10-second intervals to optimize network requests
 * - **Deduplication**: LRU cache with 1000-entry fingerprint storage prevents duplicate events
 * - **Rate Limiting**: Client-side limits (50 events/second global, 60/minute per event name)
 * - **Per-Session Caps**: Configurable limits prevent runaway generation (1000 total, type-specific limits)
 * - **Dynamic Queue Flush**: Immediate send when 50-event batch threshold reached
 * - **Pending Events Buffer**: Buffers up to 100 events before session initialization
 * - **Event Recovery**: Recovers persisted events from localStorage after crashes (independent per integration)
 * - **Multi-Integration**: Manages 0-2 SenderManager instances (SaaS + Custom) with parallel async sending
 * - **Standalone Mode**: Emits queue events without network requests when no integrations configured
 * - **Google Analytics**: Forwards custom events to GA/GTM when configured
 *
 * **Key Features**:
 * - **LRU Deduplication**: 1000 fingerprints, 10px coordinate precision for clicks, 500ms time threshold
 * - **Smart Queue Overflow**: Fixed 100-event limit with priority preservation for SESSION_START/END
 * - **Rate Limiting**: 50 events/sec sliding window, critical events exempted
 * - **Per-Event-Name Limits**: 60 same event name per minute (configurable via `maxSameEventPerMinute`)
 * - **Per-Session Caps**: Total 1000/session, Clicks 500, Page views 100, Custom 500, Viewport 200, Scroll 120
 * - **Dynamic Flush**: Immediate send when 50-event batch threshold reached
 * - **Multi-Integration Sending**: Parallel async with `Promise.allSettled()`, independent error handling per integration
 * - **QA Mode**: Console logging for custom events without backend transmission
 *
 * **State Management**:
 * - **`hasStartSession` Flag**: Prevents duplicate SESSION_START events across init cycles
 *   - Set to `true` when SESSION_START is tracked via `track()` method
 *   - Reset to `false` in `stop()` method to allow subsequent init() → destroy() → init() cycles
 *   - NOT set by SessionManager's BroadcastChannel message handler (secondary tabs don't track SESSION_START)
 *
 * **Transformer Support**:
 * - **`beforeSend`**: Applied conditionally based on integration mode
 *   - Custom-only mode: Applied in EventManager before dedup/sampling/queueing
 *   - Multi-integration mode: Skipped in EventManager, applied in SenderManager per-integration
 * - **`beforeBatch`**: Applied in SenderManager before network transmission
 *
 * @see src/managers/README.md (lines 5-75) for detailed documentation
 *
 * @example
 * ```typescript
 * const eventManager = new EventManager(storage, googleAnalytics, consentManager, emitter, transformers);
 *
 * // Track event
 * eventManager.track({
 *   type: 'click',
 *   click_data: { x: 100, y: 200, tag: 'button' }
 * });
 *
 * // Flush immediately (async)
 * await eventManager.flushImmediately();
 *
 * // Synchronous flush (page unload)
 * eventManager.flushImmediatelySync();
 *
 * // Stop and cleanup
 * eventManager.stop();
 * ```
 */
export class EventManager extends StateManager {
  private google: GoogleAnalyticsIntegration | null;
  private readonly consentManager: ConsentManager | null;
  private readonly dataSenders: SenderManager[];
  private readonly emitter: Emitter | null;
  private readonly transformers: TransformerMap;
  private readonly recentEventFingerprints = new Map<string, number>();
  private readonly perEventRateLimits: Map<string, number[]> = new Map();

  private eventsQueue: EventData[] = [];
  private pendingEventsBuffer: Partial<EventData>[] = [];
  private consentEventsBuffer: EventData[] = [];
  private readonly consentEventsSentTo: Map<string, Set<string>> = new Map(); // eventId -> Set<integration>
  private isFlushingConsentBuffer = false;
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

  /**
   * Creates an EventManager instance.
   *
   * **Initialization**:
   * - Creates SenderManager instances for configured integrations (SaaS/Custom)
   * - Sets up Google Analytics forwarding if configured
   * - Configures consent management if enabled
   * - Initializes event emitter for local consumption
   *
   * @param storeManager - Storage manager for persistence
   * @param google - Optional Google Analytics integration
   * @param consentManager - Optional consent manager for GDPR compliance
   * @param emitter - Optional event emitter for local event consumption
   * @param transformers - Optional event transformation hooks
   */
  constructor(
    storeManager: StorageManager,
    google: GoogleAnalyticsIntegration | null = null,
    consentManager: ConsentManager | null = null,
    emitter: Emitter | null = null,
    transformers: TransformerMap = {},
  ) {
    super();

    this.google = google;
    this.consentManager = consentManager;
    this.emitter = emitter;
    this.transformers = transformers;

    this.dataSenders = [];
    const collectApiUrls = this.get('collectApiUrls');

    if (collectApiUrls?.saas) {
      this.dataSenders.push(new SenderManager(storeManager, 'saas', collectApiUrls.saas, consentManager, transformers));
    }

    if (collectApiUrls?.custom) {
      this.dataSenders.push(
        new SenderManager(storeManager, 'custom', collectApiUrls.custom, consentManager, transformers),
      );
    }
  }

  /**
   * Recovers persisted events from localStorage after a crash or page reload.
   *
   * **Purpose**: Ensures zero data loss by recovering events that failed to send
   * in the previous session due to network errors or crashes.
   *
   * **Flow**:
   * 1. Calls `recoverPersistedEvents()` on all SenderManager instances in parallel
   * 2. Each SenderManager attempts to resend its persisted events to backend
   * 3. On success: Removes recovered events from consent/pending buffers
   * 4. On failure: Logs warning (events remain in localStorage for next attempt)
   *
   * **Multi-Integration**:
   * - Independent recovery per integration (SaaS + Custom backends)
   * - Parallel recovery via `Promise.allSettled()` (one failure doesn't block others)
   * - No cross-contamination (SaaS events don't go to Custom API)
   *
   * **Called by**: `App.init()` after initialization
   *
   * **Important**: Events are NOT removed from pending/consent buffers until
   * successful network transmission.
   *
   * @see src/managers/README.md (lines 5-75) for recovery details
   */
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

  /**
   * Tracks a user interaction event and adds it to the event queue.
   *
   * **Purpose**: Central tracking method for all analytics events (clicks, page views,
   * custom events, web vitals, errors, scroll, viewport visibility, session start/end).
   *
   * **Validation & Buffering**:
   * - Validates `type` is provided (required)
   * - If session not initialized: Buffers in `pendingEventsBuffer` (max 100 events, FIFO)
   * - If consent pending: Buffers in `consentEventsBuffer` (flushed when consent granted)
   *
   * **Rate Limiting** (non-critical events only):
   * - Global: 50 events/second sliding window (critical events exempted)
   * - Per-event-name: 60/minute for custom events (configurable via `maxSameEventPerMinute`)
   * - Per-session total: 1000 events max
   * - Per-session by type: Clicks 500, Page views 100, Custom 500, Viewport 200, Scroll 120
   *
   * **Deduplication**:
   * - LRU cache with 1000 fingerprints (10px coordinate precision for clicks, 500ms time threshold)
   * - Prevents duplicate events within 500ms window
   * - SESSION_START protected by `hasStartSession` flag
   *
   * **Sampling**:
   * - Applied after validation and rate limiting
   * - Critical events (SESSION_START/END) always included
   * - Configurable via `samplingRate` (0-1)
   *
   * **Transformation**:
   * - `beforeSend` applied (if custom-only mode) before dedup/sampling/queueing
   * - Returning `null` from `beforeSend` filters out the event
   *
   * **Queue Management**:
   * - Events added to `eventsQueue` (max 100 events, FIFO with priority for session events)
   * - Dynamic flush: Immediate send when 50-event batch threshold reached
   * - Periodic flush: Every 10 seconds
   *
   * **Multi-Integration**:
   * - Google Analytics: Forwards custom events to GA/GTM
   * - Backend integrations: Handled by SenderManager instances
   *
   * **QA Mode**:
   * - Custom events logged to console with styling
   * - Events NOT sent to backend (emitted locally only)
   *
   * @param eventData - Event data to track
   *
   * @example
   * ```typescript
   * eventManager.track({
   *   type: EventType.CLICK,
   *   click_data: { x: 0.5, y: 0.3, tag: 'button', text: 'Submit' }
   * });
   *
   * eventManager.track({
   *   type: EventType.CUSTOM,
   *   custom_event: { name: 'checkout_completed', metadata: { total: 99.99 } }
   * });
   * ```
   *
   * @see src/managers/README.md (lines 5-75) for detailed tracking logic
   */
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
      log('info', `Custom Event: ${custom_event.name}`, {
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

  /**
   * Stops event tracking and clears all queues and buffers.
   *
   * **Purpose**: Cleanup method called during `App.destroy()` to reset EventManager state
   * and allow subsequent init() → destroy() → init() cycles.
   *
   * **Cleanup Actions**:
   * 1. **Clear send interval**: Stops periodic 10-second queue flush timer
   * 2. **Clear all queues and buffers**:
   *    - `eventsQueue`: Discarded (not sent)
   *    - `pendingEventsBuffer`: Discarded (events before session init)
   *    - `consentEventsBuffer`: Discarded with warning (events awaiting consent)
   * 3. **Reset rate limiting state**: Clears rate limit counters and per-event limits
   * 4. **Reset session counters**: Clears per-session event counts
   * 5. **Reset `hasStartSession` flag**: Allows SESSION_START in next init cycle
   * 6. **Stop SenderManagers**: Calls `stop()` on all SenderManager instances
   *
   * **Important Behavior**:
   * - **No final flush**: Events in queue are NOT sent before stopping
   * - For flush before destroy, call `flushImmediatelySync()` first
   * - Consent buffer discarded: Events awaiting consent are lost (logged as warning)
   *
   * **Multi-Integration**:
   * - Stops all SenderManager instances (SaaS + Custom)
   * - Clears per-integration consent tracking
   *
   * **Called by**: `App.destroy()` during application teardown
   *
   * @example
   * ```typescript
   * // Proper cleanup with final flush
   * eventManager.flushImmediatelySync(); // Send pending events
   * eventManager.stop();                  // Stop and clear
   * ```
   *
   * @see src/managers/README.md (lines 5-75) for cleanup details
   */
  stop(): void {
    if (this.sendIntervalId) {
      clearInterval(this.sendIntervalId);
      this.sendIntervalId = null;
    }

    if (this.consentEventsBuffer.length > 0) {
      log('warn', 'Discarding consent buffer on destroy', {
        data: { bufferedEvents: this.consentEventsBuffer.length },
      });
    }

    this.eventsQueue = [];
    this.pendingEventsBuffer = [];
    this.consentEventsBuffer = [];
    this.consentEventsSentTo.clear();
    this.isFlushingConsentBuffer = false;
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

  /**
   * Flushes all events in the queue asynchronously.
   *
   * **Purpose**: Force immediate sending of queued events without waiting for
   * the 10-second periodic flush timer.
   *
   * **Use Cases**:
   * - Manual flush triggered by user action
   * - Before page unload (prefer `flushImmediatelySync()` for unload scenarios)
   * - Testing/debugging
   *
   * **Behavior**:
   * - Sends events via `fetch()` API (async, reliable, allows retries)
   * - Multi-integration: Sends to all configured backends in parallel
   * - Does NOT block (returns Promise that resolves when all sends complete)
   * - Clears queue only after successful transmission
   *
   * **Note**: For page unload, use `flushImmediatelySync()` instead,
   * which uses `sendBeacon()` for guaranteed delivery.
   *
   * @returns Promise resolving to `true` if all sends succeeded, `false` if any failed
   *
   * @example
   * ```typescript
   * // Before critical user action
   * await eventManager.flushImmediately();
   * ```
   *
   * @see flushImmediatelySync for synchronous page unload flush
   * @see src/managers/README.md (lines 5-75) for flush details
   */
  async flushImmediately(): Promise<boolean> {
    return this.flushEvents(false);
  }

  /**
   * Flushes all events in the queue synchronously using `sendBeacon()`.
   *
   * **Purpose**: Ensure events are sent before page unload, even if network is slow.
   *
   * **Use Cases**:
   * - Page unload (`beforeunload`, `pagehide` events)
   * - Tab close detection
   * - Any scenario where async flush might be interrupted
   *
   * **Behavior**:
   * - Uses `navigator.sendBeacon()` API (synchronous, queued by browser)
   * - Payload size limited to 64KB per beacon
   * - Browser guarantees delivery attempt (queued even if page closes)
   * - Clears queue immediately (no retry mechanism)
   *
   * **Multi-Integration**:
   * - Sends to all configured backends (SaaS + Custom) in parallel
   * - Independent success tracking per integration
   *
   * **Limitations**:
   * - No retry on failure (sendBeacon is fire-and-forget)
   * - 64KB payload limit (large batches may be truncated)
   *
   * @returns `true` if all sends succeeded, `false` if any failed
   *
   * @example
   * ```typescript
   * // Page unload handler
   * window.addEventListener('beforeunload', () => {
   *   eventManager.flushImmediatelySync();
   * });
   * ```
   *
   * @see flushImmediately for async flush with retries
   * @see src/managers/README.md (lines 5-75) for flush details
   */
  flushImmediatelySync(): boolean {
    return this.flushEvents(true) as boolean;
  }

  /**
   * Returns the current number of events in the main queue.
   *
   * **Purpose**: Debugging and monitoring utility to check queue length.
   *
   * **Note**: This does NOT include:
   * - Pending events buffer (events before session init)
   * - Consent events buffer (events awaiting consent)
   * - Persisted events (events in localStorage from previous sessions)
   *
   * @returns Number of events currently in the main queue
   *
   * @example
   * ```typescript
   * const queueSize = eventManager.getQueueLength();
   * console.log(`Queue has ${queueSize} events`);
   * ```
   */
  getQueueLength(): number {
    return this.eventsQueue.length;
  }

  /**
   * Returns the current number of events in the consent buffer.
   *
   * **Purpose**: Debugging and monitoring utility to check consent buffer length.
   *
   * **Use Cases**:
   * - Verify events are being buffered when consent is pending
   * - Monitor consent buffer growth before consent decision
   * - Testing consent workflows
   *
   * @returns Number of events currently awaiting consent
   *
   * @example
   * ```typescript
   * const consentBufferSize = eventManager.getConsentBufferLength();
   * console.log(`${consentBufferSize} events awaiting consent`);
   * ```
   */
  getConsentBufferLength(): number {
    return this.consentEventsBuffer.length;
  }

  /**
   * Returns a copy of current events in the queue.
   *
   * **Purpose**: Test utility to inspect queued events for validation.
   *
   * **Note**: Only available in development mode via TestBridge.
   *
   * @returns Shallow copy of events queue
   * @internal Used by test-bridge.ts for test inspection
   */
  getQueueEvents(): EventData[] {
    return [...this.eventsQueue];
  }

  /**
   * Returns a copy of consent buffer events for a specific integration.
   *
   * **Purpose**: Test utility to inspect consent-buffered events for validation.
   *
   * **Note**: Only available in development mode via TestBridge.
   *
   * @param integration - Integration to get buffered events for
   * @returns Filtered array of buffered events for the integration
   * @internal Used by test-bridge.ts for test inspection
   */
  getConsentBufferEvents(integration: 'google' | 'custom' | 'tracelog'): EventData[] {
    return this.consentEventsBuffer.filter((event) => {
      const eventId = event.id || `${event.type}-${event.timestamp}`;
      const sentTo = this.consentEventsSentTo.get(eventId) || new Set();
      return !sentTo.has(integration);
    });
  }

  /**
   * Triggers immediate queue flush (test utility).
   *
   * **Purpose**: Test utility to manually flush event queue for validation.
   *
   * **Note**: Only available in development mode via TestBridge.
   *
   * @returns Promise that resolves when flush completes
   * @internal Used by test-bridge.ts for test control
   */
  async flushQueue(): Promise<void> {
    await this.flushImmediately();
  }

  /**
   * Clears the event queue (test utility - use with caution).
   *
   * **Purpose**: Test utility to reset queue state between tests.
   *
   * **Warning**: This will discard all queued events without sending them.
   * Only use in test cleanup or when explicitly required.
   *
   * **Note**: Only available in development mode via TestBridge.
   *
   * @internal Used by test-bridge.ts for test cleanup
   */
  clearQueue(): void {
    this.eventsQueue = [];
  }

  /**
   * Flushes buffered events to a specific integration when consent is granted.
   *
   * **Purpose**: Sends events that were tracked before consent was granted to the
   * specified integration. Events are batched and sent with delays to prevent
   * overwhelming the backend.
   *
   * **Behavior**:
   * - Filters events that haven't been sent to this integration yet
   * - Sorts events: SESSION_START first, then chronological by timestamp
   * - Sends in batches of 10 events (CONSENT_FLUSH_BATCH_SIZE)
   * - 100ms delay between batches (CONSENT_FLUSH_DELAY_MS)
   * - Tracks sent events per-integration to support multi-integration scenarios
   * - Removes events from buffer when sent to all configured integrations
   *
   * **Concurrency Protection**:
   * - Guard flag `isFlushingConsentBuffer` prevents concurrent flushes
   * - Returns early if flush already in progress
   *
   * **Multi-Integration Support**:
   * - Tracks which integrations each event has been sent to
   * - Allows partial sending (e.g., sent to TraceLog but not Custom yet)
   * - Events only removed from buffer when sent to ALL configured integrations
   *
   * **Called by**: ConsentManager when consent is granted for an integration
   *
   * @param integration - Integration to flush events to ('google' | 'custom' | 'tracelog')
   * @returns Promise<void> - Resolves when all batches sent or error occurs
   *
   * @example
   * ```typescript
   * // User grants consent for TraceLog SaaS
   * await eventManager.flushConsentBuffer('tracelog');
   * // → Sends buffered events to TraceLog in batches of 10
   * // → 100ms delay between batches
   * ```
   */
  async flushConsentBuffer(integration: 'google' | 'custom' | 'tracelog'): Promise<void> {
    if (this.consentEventsBuffer.length === 0) {
      return;
    }

    if (this.isFlushingConsentBuffer) {
      log('debug', 'Consent buffer flush already in progress, skipping');
      return;
    }

    this.isFlushingConsentBuffer = true;

    try {
      const config = this.get('config');
      const collectApiUrls = this.get('collectApiUrls');

      // Determine configured integrations
      const configuredIntegrations: Set<string> = new Set();
      if (config?.integrations?.google) {
        configuredIntegrations.add('google');
      }
      if (collectApiUrls?.custom) {
        configuredIntegrations.add('custom');
      }
      if (collectApiUrls?.saas) {
        configuredIntegrations.add('tracelog');
      }

      // Filter events that haven't been sent to this integration yet
      const eventsToSend = this.consentEventsBuffer.filter((event) => {
        const eventId = event.id || `${event.type}-${event.timestamp}`;
        const sentTo = this.consentEventsSentTo.get(eventId) || new Set();
        return !sentTo.has(integration);
      });

      if (eventsToSend.length === 0) {
        log('debug', `No new events to flush for ${integration}`);
        this.isFlushingConsentBuffer = false;
        return;
      }

      log('info', 'Flushing consent buffer', {
        data: {
          totalEvents: eventsToSend.length,
          integration,
          bufferedTotal: this.consentEventsBuffer.length,
        },
      });

      // Sort events: SESSION_START first, then by timestamp
      eventsToSend.sort((a, b) => {
        if (a.type === EventType.SESSION_START && b.type !== EventType.SESSION_START) {
          return -1;
        }
        if (b.type === EventType.SESSION_START && a.type !== EventType.SESSION_START) {
          return 1;
        }
        return a.timestamp - b.timestamp;
      });

      const batchSize = CONSENT_FLUSH_BATCH_SIZE;
      let flushedCount = 0;

      for (let i = 0; i < eventsToSend.length; i += batchSize) {
        const batch = eventsToSend.slice(i, i + batchSize);

        if (integration === 'google' && this.google) {
          batch.forEach((event) => {
            this.handleGoogleAnalyticsIntegration(event);
          });
        }

        if (integration === 'custom' || integration === 'tracelog') {
          const targetSender = this.dataSenders.find((sender) => {
            const senderId = sender.getIntegrationId();

            if (integration === 'custom') {
              return senderId === 'custom';
            }

            return senderId === 'saas';
          });

          if (targetSender) {
            const batchPayload: EventsQueue = {
              user_id: this.get('userId'),
              session_id: this.get('sessionId') as string,
              device: this.get('device'),
              events: batch,
              ...(this.get('config')?.globalMetadata && { global_metadata: this.get('config')?.globalMetadata }),
            };

            // Send with automatic retries (handled by SenderManager)
            // SenderManager will retry up to 2 times for transient errors (5xx, timeout)
            const success = await targetSender.sendEventsQueue(batchPayload);

            if (!success) {
              log(
                'warn',
                `Failed to send consent buffer batch for ${integration} after retries, events persisted for recovery`,
                {
                  data: { batchSize: batch.length, integration },
                },
              );
            }
          }
        }

        batch.forEach((event) => {
          const eventId = event.id || `${event.type}-${event.timestamp}`;
          if (!this.consentEventsSentTo.has(eventId)) {
            this.consentEventsSentTo.set(eventId, new Set());
          }
          this.consentEventsSentTo.get(eventId)!.add(integration);
        });

        flushedCount += batch.length;

        if (i + batchSize < eventsToSend.length) {
          await new Promise((resolve) => setTimeout(resolve, CONSENT_FLUSH_DELAY_MS));
        }
      }

      this.consentEventsBuffer = this.consentEventsBuffer.filter((event) => {
        const eventId = event.id || `${event.type}-${event.timestamp}`;
        const sentTo = this.consentEventsSentTo.get(eventId) || new Set();

        const allSent = Array.from(configuredIntegrations).every((int) => sentTo.has(int));

        if (allSent) {
          this.consentEventsSentTo.delete(eventId);
          return false;
        }

        return true;
      });

      log('info', 'Consent buffer flushed successfully', {
        data: {
          flushedEvents: flushedCount,
          integration,
          remainingInBuffer: this.consentEventsBuffer.length,
        },
      });
    } catch (error) {
      log('error', 'Failed to flush consent buffer', { error });
    } finally {
      this.isFlushingConsentBuffer = false;
    }
  }

  /**
   * Clears consent buffer entries for a specific integration when consent is revoked.
   *
   * **Purpose**: Removes tracking data for events that were waiting to be sent to
   * an integration when the user revokes consent. Events remain in buffer if they're
   * waiting for other integrations.
   *
   * **Behavior**:
   * - Removes the integration from each event's "sent to" tracking map
   * - Events removed from buffer if they've been sent to all OTHER configured integrations
   * - Events kept in buffer if still waiting for other integrations
   * - Logs removed count for debugging
   *
   * **Multi-Integration Support**:
   * - In multi-integration mode, events may wait for multiple integrations
   * - Revoking consent for one integration doesn't affect others
   * - Example: Event sent to TraceLog but waiting for Custom → kept in buffer when TraceLog consent revoked
   *
   * **Called by**: ConsentManager when consent is revoked for an integration
   *
   * @param integration - Integration to clear tracking for ('google' | 'custom' | 'tracelog')
   * @returns void
   *
   * @example
   * ```typescript
   * // User revokes consent for Google Analytics
   * eventManager.clearConsentBufferForIntegration('google');
   * // → Removes Google from event tracking
   * // → Events still waiting for TraceLog/Custom remain in buffer
   * ```
   */
  clearConsentBufferForIntegration(integration: 'google' | 'custom' | 'tracelog'): void {
    const initialLength = this.consentEventsBuffer.length;

    if (initialLength === 0) {
      return;
    }

    this.consentEventsSentTo.forEach((sentTo, eventId) => {
      sentTo.delete(integration);
      // If event was only waiting for this integration, mark for cleanup
      if (sentTo.size === 0) {
        this.consentEventsSentTo.delete(eventId);
      }
    });

    // Determine other configured integrations
    const config = this.get('config');
    const collectApiUrls = this.get('collectApiUrls');

    const remainingIntegrations: Set<string> = new Set();
    if (config?.integrations?.google && integration !== 'google') {
      remainingIntegrations.add('google');
    }
    if (collectApiUrls?.custom && integration !== 'custom') {
      remainingIntegrations.add('custom');
    }
    if (collectApiUrls?.saas && integration !== 'tracelog') {
      remainingIntegrations.add('tracelog');
    }

    if (remainingIntegrations.size === 0) {
      // No other integrations configured, clear entire buffer
      this.consentEventsBuffer = [];
      this.consentEventsSentTo.clear();
      log('info', `Cleared entire consent buffer (${initialLength} events) - no remaining integrations`);
    } else {
      // Keep events needed by other integrations
      this.consentEventsBuffer = this.consentEventsBuffer.filter((event) => {
        const eventId = event.id || `${event.type}-${event.timestamp}`;
        const sentTo = this.consentEventsSentTo.get(eventId) || new Set();

        // Keep if not yet sent to at least one remaining integration
        return Array.from(remainingIntegrations).some((int) => !sentTo.has(int));
      });

      const removed = initialLength - this.consentEventsBuffer.length;
      if (removed > 0) {
        log('info', `Cleared ${removed} buffered events for revoked ${integration} consent`, {
          data: {
            removed,
            remaining: this.consentEventsBuffer.length,
            otherIntegrations: Array.from(remainingIntegrations),
          },
        });
      }
    }
  }

  /**
   * Flushes buffered events to the main queue after session initialization.
   *
   * **Purpose**: Re-tracks events that were captured before session initialization
   * (e.g., events fired during `App.init()` before SessionManager completes).
   *
   * **Pending Events Buffer**:
   * - Holds up to 100 events captured before `sessionId` is available
   * - FIFO eviction when buffer full (oldest events dropped with warning)
   * - Cleared and re-tracked when session becomes available
   *
   * **Flow**:
   * 1. Check if session is initialized (`sessionId` exists in global state)
   * 2. If not initialized: Log warning and keep events in buffer
   * 3. If initialized: Copy buffer, clear it, and re-track each event via `track()`
   * 4. Each event goes through full validation/dedup/rate limiting pipeline
   *
   * **Called by**:
   * - `SessionManager.startTracking()` after session initialization
   * - Ensures no events are lost during initialization phase
   *
   * **Important**: Events are re-tracked through `track()` method, so they go
   * through all validation, deduplication, rate limiting, and consent checks again.
   *
   * @example
   * ```typescript
   * // In SessionManager after session creation
   * this.set('sessionId', newSessionId);
   * eventManager.flushPendingEvents(); // Re-track buffered events
   * ```
   *
   * @see src/managers/README.md (lines 5-75) for pending buffer details
   */
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
      const anySucceeded = results.some((success) => success);

      // Optimistic removal: Remove events if AT LEAST ONE integration succeeded
      // Each integration persists independently if it fails
      if (anySucceeded) {
        this.removeProcessedEvents(eventIds);
        this.clearSendInterval();
        this.emitEventsQueue(body);
      } else {
        // All integrations failed - keep events in queue
        // Next periodic flush will retry (recovery happens on next page load)
        this.clearSendInterval();
        log('warn', 'Sync flush failed for all integrations, events remain in queue for next flush', {
          data: { eventCount: eventIds.length },
        });
      }

      return anySucceeded;
    } else {
      const sendPromises = this.dataSenders.map(async (sender) =>
        sender.sendEventsQueue(body, {
          onSuccess: () => {},
          onFailure: () => {},
        }),
      );

      return Promise.allSettled(sendPromises).then((results) => {
        const anySucceeded = results.some((result) => this.isSuccessfulResult(result));

        // Optimistic removal: Remove events if AT LEAST ONE integration succeeded
        // Each integration persists independently if it fails
        if (anySucceeded) {
          this.removeProcessedEvents(eventIds);
          this.clearSendInterval();
          this.emitEventsQueue(body);

          const failedCount = results.filter((result) => !this.isSuccessfulResult(result)).length;

          if (failedCount > 0) {
            log(
              'warn',
              'Async flush completed with partial success, events removed from queue and persisted per failed integration',
              {
                data: { eventCount: eventsToSend.length, succeededCount: results.length - failedCount, failedCount },
              },
            );
          }
        } else {
          // All integrations failed - events already persisted per-integration
          // Remove from queue anyway to avoid duplicate persistence attempts
          this.removeProcessedEvents(eventIds);
          this.clearSendInterval();
          log('error', 'Async flush failed for all integrations, events persisted per-integration for recovery', {
            data: { eventCount: eventsToSend.length, integrations: this.dataSenders.length },
          });
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
    const cutoff = DUPLICATE_EVENT_THRESHOLD_MS * FINGERPRINT_CLEANUP_MULTIPLIER;

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
    this.emitEvent(event);

    if (this.shouldBufferForConsent()) {
      this.addToConsentBuffer(event);
      return;
    }

    this.eventsQueue.push(event);

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

  /**
   * Updates the Google Analytics integration instance.
   *
   * **Purpose**: Sets or removes the Google Analytics integration instance used
   * for forwarding custom events to GA4/GTM. Called when consent is granted or revoked.
   *
   * **Behavior**:
   * - Sets `this.google` to the provided instance or null
   * - Enables/disables Google Analytics event forwarding
   * - Logs integration status change for debugging
   *
   * **Consent Integration**:
   * - Called by ConsentManager when Google consent is granted → passes GoogleAnalyticsIntegration
   * - Called by ConsentManager when Google consent is revoked → passes null
   *
   * **Use Cases**:
   * - Consent granted: Start forwarding custom events to Google Analytics
   * - Consent revoked: Stop forwarding events to Google Analytics
   * - Runtime control: Enable/disable Google Analytics without reinitialization
   *
   * @param google - GoogleAnalyticsIntegration instance or null to disable
   * @returns void
   *
   * @example
   * ```typescript
   * // Consent granted - enable Google Analytics
   * const gaIntegration = new GoogleAnalyticsIntegration(config);
   * eventManager.setGoogleAnalyticsIntegration(gaIntegration);
   * // → Custom events now forwarded to GA4
   *
   * // Consent revoked - disable Google Analytics
   * eventManager.setGoogleAnalyticsIntegration(null);
   * // → Custom events no longer forwarded to GA4
   * ```
   */
  setGoogleAnalyticsIntegration(google: GoogleAnalyticsIntegration | null): void {
    this.google = google;

    if (google) {
      log('debug', 'Google Analytics integration updated in EventManager');
    } else {
      log('debug', 'Google Analytics integration removed from EventManager');
    }
  }

  /**
   * Resolves waitForConsent requirement for a specific integration.
   * Per-integration config takes precedence over root-level config.
   * @param integration - The integration to check
   * @returns true if consent is required, false otherwise
   * @private
   */
  private getIntegrationConsentRequirement(integration: 'google' | 'custom' | 'tracelog'): boolean {
    const config = this.get('config');

    if (integration === 'google') {
      return config.integrations?.google?.waitForConsent ?? false;
    }
    if (integration === 'custom') {
      return config.integrations?.custom?.waitForConsent ?? false;
    }
    if (integration === 'tracelog') {
      return config.integrations?.tracelog?.waitForConsent ?? false;
    }

    return false;
  }

  /**
   * Determines if events should be buffered for consent instead of being sent immediately.
   *
   * **Purpose**: Implements GDPR/CCPA compliance by preventing event transmission before
   * user grants consent. Events are buffered and sent later via `flushConsentBuffer()`.
   *
   * **Logic**:
   * 1. QA mode bypasses consent checks (always returns false)
   * 2. If no consent manager, returns false (can't check consent)
   * 3. If no backend integrations configured, returns false (standalone mode)
   * 4. Check BACKEND integrations (custom, tracelog) consent requirements
   * 5. Google Analytics handled separately (not buffered, uses GoogleAnalyticsIntegration)
   * 6. Buffer ONLY if ALL backend integrations require consent AND none have it yet
   *
   * **Key Behavior**:
   * - Mixed requirements (custom no consent, tracelog needs consent):
   *   → NO buffering, events go to queue
   *   → SenderManager for tracelog skips send (no consent)
   *   → SenderManager for custom sends normally
   *
   * @returns `true` if events should be buffered, `false` if they can be sent to queue
   * @private
   */
  private shouldBufferForConsent(): boolean {
    // QA mode bypasses consent checks
    if (this.get('mode') === Mode.QA) {
      return false;
    }

    // If no consent manager, can't check consent
    if (!this.consentManager) {
      return false;
    }

    const collectApiUrls = this.get('collectApiUrls');
    const hasCustomIntegration = Boolean(collectApiUrls?.custom);
    const hasTracelogIntegration = Boolean(collectApiUrls?.saas);

    // Only consider backend integrations for buffering (Google Analytics handled separately)
    if (!hasCustomIntegration && !hasTracelogIntegration) {
      return false;
    }

    // Check which BACKEND integrations require consent
    const customRequiresConsent = hasCustomIntegration && this.getIntegrationConsentRequirement('custom');
    const tracelogRequiresConsent = hasTracelogIntegration && this.getIntegrationConsentRequirement('tracelog');

    // If NO backend integration requires consent, don't buffer
    if (!customRequiresConsent && !tracelogRequiresConsent) {
      return false;
    }

    // Buffer ONLY if ALL requiring backend integrations are missing consent
    // This allows mixed consent scenarios: custom sends immediately, tracelog waits
    const customNeedsConsentAndMissing = customRequiresConsent && !this.consentManager.hasConsent('custom');
    const tracelogNeedsConsentAndMissing = tracelogRequiresConsent && !this.consentManager.hasConsent('tracelog');

    // Buffer if:
    // - Custom requires consent and doesn't have it AND (no tracelog OR tracelog also missing)
    // - Tracelog requires consent and doesn't have it AND (no custom OR custom also missing)
    if (customRequiresConsent && tracelogRequiresConsent) {
      // Both require consent: buffer if EITHER is missing
      return customNeedsConsentAndMissing || tracelogNeedsConsentAndMissing;
    }

    // Only one requires consent: buffer if that one is missing
    return customNeedsConsentAndMissing || tracelogNeedsConsentAndMissing;
  }

  /**
   * Adds event to consent buffer with overflow protection and SESSION_START preservation.
   *
   * **Purpose**: Buffers events that were tracked before consent was granted. Events are
   * later flushed per-integration when consent is granted via `flushConsentBuffer()`.
   *
   * **Overflow Strategy**:
   * - Max buffer size: Configurable via `config.maxConsentBufferSize` (default 500)
   * - FIFO eviction: Oldest non-critical events removed first when buffer full
   * - SESSION_START preservation: Critical events always kept, non-critical removed instead
   *
   * @param event - Event to buffer (with id, type, timestamp, and event-specific data)
   * @private
   */
  private addToConsentBuffer(event: EventData): void {
    const config = this.get('config');
    const maxBufferSize = config?.maxConsentBufferSize ?? 500;

    this.consentEventsBuffer.push(event);

    // Handle buffer overflow (FIFO, but preserve SESSION_START)
    if (this.consentEventsBuffer.length > maxBufferSize) {
      const nonCriticalIndex = this.consentEventsBuffer.findIndex((e) => e.type !== EventType.SESSION_START);

      const removedEvent =
        nonCriticalIndex >= 0
          ? this.consentEventsBuffer.splice(nonCriticalIndex, 1)[0]
          : this.consentEventsBuffer.shift();

      log('warn', 'Consent buffer overflow, oldest non-critical event discarded', {
        data: {
          maxBufferSize,
          currentSize: this.consentEventsBuffer.length,
          removedEventType: removedEvent?.type,
        },
      });
    }
  }

  private startSendInterval(): void {
    this.sendIntervalId = window.setInterval(() => {
      if (this.eventsQueue.length > 0) {
        void this.sendEventsQueue();
      }
    }, EVENT_SENT_INTERVAL_MS);
  }

  private handleGoogleAnalyticsIntegration(event: EventData): void {
    if (!this.google) {
      return;
    }

    const config = this.get('config');

    if (
      config?.integrations?.google?.waitForConsent &&
      this.consentManager &&
      !this.consentManager.hasConsent('google')
    ) {
      return;
    }

    if (this.get('mode') === Mode.QA) {
      return;
    }

    const googleConfig = this.get('config').integrations?.google;
    const forwardEvents = googleConfig?.forwardEvents;

    if (forwardEvents == null || (Array.isArray(forwardEvents) && forwardEvents.length === 0)) {
      return;
    }

    const shouldForward =
      forwardEvents === 'all' || (Array.isArray(forwardEvents) && forwardEvents.includes(event.type));

    if (!shouldForward) {
      log('debug', `Skipping GA event forward: ${event.type} not in forwardEvents config`, {
        data: { eventType: event.type, forwardEvents },
      });

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
    } else if (event.type === EventType.SESSION_END) {
      this.google.trackEvent('session_end', {
        ...(event.session_end_reason && { session_end_reason: event.session_end_reason }),
        ...(event.page_url && { page_location: event.page_url }),
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
