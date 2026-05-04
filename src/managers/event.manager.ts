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
  MAX_SEND_INTERVAL_MS,
  MAX_CONSECUTIVE_SEND_FAILURES,
} from '../constants/config.constants';
import {
  SESSION_COUNTS_KEY,
  SESSION_COUNTS_EXPIRY_MS,
  SESSION_COUNTS_LAST_CLEANUP_KEY,
  SESSION_COUNTS_CLEANUP_THROTTLE_MS,
  STORAGE_BASE_KEY,
} from '../constants/storage.constants';
import {
  EventsQueue,
  EmitterEvent,
  EventData,
  EventType,
  Mode,
  TransformerMap,
  SessionEventCounts,
  CustomHeadersProvider,
} from '../types';
import { log, Emitter, generateEventId, transformEvent, transformBatch } from '../utils';
import { SenderManager } from './sender.manager';
import { StateManager } from './state.manager';
import { StorageManager } from './storage.manager';
import { TimeManager } from './time.manager';

const VALID_EVENT_TYPES: ReadonlySet<string> = new Set(Object.values(EventType));

/**
 * Extended session counts structure with metadata for expiry tracking.
 *
 * Adds timestamp and version fields to SessionEventCounts for cleanup management.
 */
interface StoredSessionCounts extends SessionEventCounts {
  /** Timestamp when counts were last saved (for 7-day expiry) */
  _timestamp: number;
  /** Schema version for future migrations */
  _version: number;
}

/**
 * Core component responsible for event tracking, queue management, deduplication,
 * rate limiting, and multi-integration API communication coordination.
 *
 * **Purpose**: Central hub for all analytics events in TraceLog, managing the complete
 * event lifecycle from capture to transmission.
 *
 * **Core Functionality**:
 * - **Event Tracking**: Captures all user interactions (clicks, scrolls, page views, custom events, web vitals, errors)
 * - **Queue Management**: Batches events with 10-second base intervals (exponential backoff on failure) to optimize network requests
 * - **Deduplication**: LRU cache with 1000-entry fingerprint storage prevents duplicate events
 * - **Rate Limiting**: Client-side limits (50 events/second global, 60/minute per event name)
 * - **Per-Session Caps**: Configurable limits prevent runaway generation (1000 total, type-specific limits)
 * - **Dynamic Queue Flush**: Immediate send when 50-event batch threshold reached
 * - **Pending Events Buffer**: Buffers up to 100 events before session initialization
 * - **Event Recovery**: Recovers persisted events from localStorage after crashes (independent per integration)
 * - **Multi-Integration**: Manages 0-2 SenderManager instances (SaaS + Custom) with parallel async sending
 * - **Standalone Mode**: Emits queue events without network requests when no integrations configured
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
 * @see src/managers/README.md for detailed documentation
 *
 * @example
 * ```typescript
 * const eventManager = new EventManager(storage, emitter, transformers);
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
  private readonly dataSenders: SenderManager[];
  private readonly emitter: Emitter | null;
  private readonly transformers: TransformerMap;
  private readonly timeManager: TimeManager;
  private readonly recentEventFingerprints = new Map<string, number>();
  private readonly perEventRateLimits: Map<string, number[]> = new Map();

  private eventsQueue: EventData[] = [];
  private pendingEventsBuffer: Partial<EventData>[] = [];
  private sendTimeoutId: number | null = null;
  private sendInProgress = false;
  private consecutiveSendFailures = 0;
  private rateLimitCounter = 0;
  private rateLimitWindowStart = 0;
  private lastSessionId: string | null = null;

  private sessionEventCounts: SessionEventCounts = {
    total: 0,
    [EventType.CLICK]: 0,
    [EventType.PAGE_VIEW]: 0,
    [EventType.CUSTOM]: 0,
    [EventType.VIEWPORT_VISIBLE]: 0,
    [EventType.SCROLL]: 0,
  };

  private readonly saveSessionCountsDebounced: ((sessionId: string) => void) | null = null;

  /**
   * Creates an EventManager instance.
   *
   * **Initialization**:
   * - Creates SenderManager instances for configured integrations (SaaS/Custom)
   * - Initializes event emitter for local consumption
   *
   * @param storeManager - Storage manager for persistence
   * @param emitter - Optional event emitter for local event consumption
   * @param transformers - Optional event transformation hooks
   * @param staticHeaders - Optional static HTTP headers for custom backend (from config)
   * @param customHeadersProvider - Optional callback for dynamic headers
   * @param fetchCredentials - Fetch credentials mode for custom backend. @default 'include'
   */
  constructor(
    storeManager: StorageManager,
    emitter: Emitter | null = null,
    transformers: TransformerMap = {},
    staticHeaders: Record<string, string> = {},
    customHeadersProvider?: CustomHeadersProvider,
    fetchCredentials: RequestCredentials = 'include',
  ) {
    super();

    this.emitter = emitter;
    this.transformers = transformers;
    this.timeManager = new TimeManager();

    this.dataSenders = [];
    const collectApiUrls = this.get('collectApiUrls');

    // SaaS integration: no custom headers (schema protection)
    if (collectApiUrls?.saas) {
      this.dataSenders.push(new SenderManager(storeManager, 'saas', collectApiUrls.saas, transformers));
    }

    // Custom integration: receives static headers, dynamic provider, and fetchCredentials
    if (collectApiUrls?.custom) {
      this.dataSenders.push(
        new SenderManager(
          storeManager,
          'custom',
          collectApiUrls.custom,
          transformers,
          staticHeaders,
          customHeadersProvider,
          fetchCredentials,
        ),
      );
    }

    // Initialize debounced session counts saver (500ms delay, trailing edge)
    // Reduces localStorage writes from ~1000 per session to ~20-30 (96-97% reduction)
    this.saveSessionCountsDebounced = this.debounce((sessionId: string) => {
      this.saveSessionCounts(sessionId);
    }, 500);

    // Cleanup expired session counts on init (7-day TTL)
    this.cleanupExpiredSessionCounts();
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
          log('debug', 'Failed to recover persisted events');
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
    viewport_data,
    page_view,
  }: Partial<EventData>): void {
    if (!type) {
      log('error', 'Event type is required - event will be ignored');
      return;
    }

    if (!VALID_EVENT_TYPES.has(type)) {
      log('error', 'Invalid event type - event will be ignored', {
        data: { type },
      });
      return;
    }

    const currentSessionId = this.get('sessionId');

    if (!currentSessionId) {
      if (this.pendingEventsBuffer.length >= MAX_PENDING_EVENTS_BUFFER) {
        this.pendingEventsBuffer.shift();
        log('debug', 'Pending events buffer full - dropping oldest event', {
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
        viewport_data,
        page_view,
      });

      return;
    }

    if (this.lastSessionId !== currentSessionId) {
      this.lastSessionId = currentSessionId;
      // Load persisted counts from localStorage instead of resetting to zero
      // This prevents count reset on page reload and allows proper enforcement of per-session limits
      this.sessionEventCounts = this.loadSessionCounts(currentSessionId);
    }

    const isCriticalEvent = type === EventType.SESSION_START;

    if (isCriticalEvent) {
      log('debug', 'Processing SESSION_START event', {
        data: { sessionId: currentSessionId },
      });
    }

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
      viewport_data,
      page_view,
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
        log('debug', 'Duplicate session_start detected', {
          data: { sessionId: currentSessionId },
        });

        return;
      }

      this.set('hasStartSession', true);
    }

    if (this.isDuplicateEvent(payload)) {
      return;
    }

    if (this.get('mode') === Mode.QA) {
      if (eventType === EventType.CUSTOM && custom_event) {
        log('info', `Custom Event: ${custom_event.name}`, {
          visibility: 'qa',
          data: {
            name: custom_event.name,
            ...(custom_event.metadata && { metadata: custom_event.metadata }),
          },
        });

        this.emitEvent(payload);

        return;
      }

      if (eventType === EventType.VIEWPORT_VISIBLE && viewport_data) {
        const displayName = viewport_data.name || viewport_data.id || viewport_data.selector;

        log('info', `Viewport Visible: ${displayName}`, {
          visibility: 'qa',
          data: {
            selector: viewport_data.selector,
            ...(viewport_data.name && { name: viewport_data.name }),
            ...(viewport_data.id && { id: viewport_data.id }),
            visibilityRatio: viewport_data.visibilityRatio,
            dwellTime: viewport_data.dwellTime,
          },
        });

        this.emitEvent(payload);

        return;
      }
    }

    this.addToQueue(payload);

    if (!isCriticalEvent) {
      this.sessionEventCounts.total++;

      if (this.sessionEventCounts[eventType] !== undefined) {
        this.sessionEventCounts[eventType]++;
      }

      // Persist updated counts to localStorage (debounced for performance)
      // Debouncing reduces localStorage writes from ~1000 to ~20-30 per session (96-97% reduction)
      // Trailing edge ensures no data loss - final counts always saved after 500ms silence
      const currentSessionId = this.get('sessionId');
      if (currentSessionId && this.saveSessionCountsDebounced) {
        this.saveSessionCountsDebounced(currentSessionId);
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
   * 1. **Clear send timeout**: Cancels pending queue flush timeout and resets backoff state
   * 2. **Clear all queues and buffers**:
   *    - `eventsQueue`: Discarded (not sent)
   *    - `pendingEventsBuffer`: Discarded (events before session init)
   * 3. **Reset rate limiting state**: Clears rate limit counters and per-event limits
   * 4. **Reset session counters**: Clears per-session event counts
   * 5. **Reset `hasStartSession` flag**: Allows SESSION_START in next init cycle
   * 6. **Stop SenderManagers**: Calls `stop()` on all SenderManager instances
   *
   * **Important Behavior**:
   * - **No final flush**: `stop()` itself does NOT send queued events
   * - `App.destroy()` calls `flushImmediatelySync()` before `stop()` automatically
   *
   * **Multi-Integration**:
   * - Stops all SenderManager instances (SaaS + Custom)
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
    // Note: customHeadersProvider is NOT cleared here since it's stored in SenderManagers
    // and those are destroyed during this stop() call anyway
    this.clearSendTimeout();
    this.sendInProgress = false;
    this.consecutiveSendFailures = 0;

    // Save session counts immediately before cleanup (bypass debounce)
    // This ensures final counts are persisted before destroying the EventManager
    const currentSessionId = this.get('sessionId');
    if (currentSessionId) {
      this.saveSessionCounts(currentSessionId);
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

  /**
   * Flushes all events in the queue asynchronously.
   *
   * **Purpose**: Force immediate sending of queued events without waiting for
   * the scheduled queue flush timeout.
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
   * Sets the custom headers provider callback for the custom integration.
   * Only affects requests to custom backend (not TraceLog SaaS).
   *
   * @param provider - Callback function that returns custom headers
   */
  setCustomHeadersProvider(provider: CustomHeadersProvider): void {
    for (const sender of this.dataSenders) {
      if (sender.getIntegrationId() === 'custom') {
        sender.setCustomHeadersProvider(provider);
      }
    }
  }

  /**
   * Removes the custom headers provider callback from the custom integration.
   */
  removeCustomHeadersProvider(): void {
    for (const sender of this.dataSenders) {
      if (sender.getIntegrationId() === 'custom') {
        sender.removeCustomHeadersProvider();
      }
    }
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
      log('debug', 'Cannot flush pending events: session not initialized - keeping in buffer', {
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

  private clearSendTimeout(): void {
    if (this.sendTimeoutId !== null) {
      clearTimeout(this.sendTimeoutId);
      this.sendTimeoutId = null;
    }
  }

  private isSuccessfulResult(result: PromiseSettledResult<boolean>): boolean {
    return result.status === 'fulfilled' && result.value === true;
  }

  private flushEvents(isSync: boolean): boolean | Promise<boolean> {
    if (this.eventsQueue.length === 0) {
      return isSync ? true : Promise.resolve(true);
    }

    // Prevent concurrent async sends — if a send is already in-flight
    // (e.g., sendEventsQueue with retries), skip to avoid duplicate requests
    if (!isSync && this.sendInProgress) {
      log('debug', 'Async flush skipped: send already in progress');
      return Promise.resolve(false);
    }

    const body = this.buildEventsPayload();
    const eventsToSend = [...this.eventsQueue];
    const eventIds = eventsToSend.map((e) => e.id);

    if (this.dataSenders.length === 0) {
      this.removeProcessedEvents(eventIds);
      this.clearSendTimeout();
      this.emitEventsQueue(body);

      return isSync ? true : Promise.resolve(true);
    }

    // An async send is in-flight via fetch(). Two reasons we do NOT persist
    // a recovery snapshot here:
    //   1) The fetch body is already streaming over the wire — the server
    //      most likely receives and persists the events even if the page
    //      unloads before the response reaches us. Persisting the same
    //      events for recovery would resurrect them on the next session
    //      and re-submit them; the API would correctly reject every event
    //      on the unique-id index, polluting ingestion telemetry with
    //      `high_duplicate_rate` warnings on every page-unload race.
    //   2) On async-send success, the SenderManager clears its localStorage
    //      via clearPersistedEvents(); on async-send failure, it persists
    //      the batch via persistEvents(). Either way the in-flight fetch
    //      already owns the lifecycle of these events. A defensive write
    //      here only adds the duplicate echo described in (1).
    //
    // Trade-off: if the page dies before the fetch streams the body to the
    // network buffer, those events are lost. With HTTP/2 connection reuse
    // and small payloads this window is small, and we prefer rare data
    // loss over systematic duplicate-flagging of events the server has
    // already accepted.
    if (isSync && this.sendInProgress) {
      log('debug', 'Sync flush skipped: async send already in-flight, trusting fetch to deliver', {
        data: { eventCount: eventIds.length },
      });
      return true;
    }

    if (isSync) {
      const results = this.dataSenders.map((sender) => sender.sendEventsQueueSync(body));
      const anySucceeded = results.some((success) => success);

      // Optimistic removal: Remove events if ANY integration succeeded
      // Each SenderManager independently persists failures in its own localStorage
      // This prevents duplicate sends to successful integrations on retry
      if (anySucceeded) {
        this.removeProcessedEvents(eventIds);
        this.clearSendTimeout();
        this.emitEventsQueue(body);
      } else {
        // All integrations failed - keep events in queue for retry on next page load
        this.clearSendTimeout();
        log('debug', 'Sync flush complete failure, events kept in queue for retry', {
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

        // Optimistic removal: Remove events if ANY integration succeeded
        // Each SenderManager independently persists failures in its own localStorage
        // This prevents duplicate sends to successful integrations on retry
        if (anySucceeded) {
          this.removeProcessedEvents(eventIds);
          this.clearSendTimeout();
          this.emitEventsQueue(body);
        } else {
          // All integrations failed - keep events in queue for retry on next page load
          log('debug', 'Async flush complete failure, events kept in queue for retry', {
            data: { eventCount: eventsToSend.length },
          });
        }

        return anySucceeded;
      });
    }
  }

  private async sendEventsQueue(): Promise<void> {
    if (!this.get('sessionId') || this.eventsQueue.length === 0 || this.sendInProgress) {
      return;
    }

    this.sendInProgress = true;

    try {
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

      const anySucceeded = results.some((result) => this.isSuccessfulResult(result));

      // Optimistic removal: Remove events if ANY integration succeeded
      // Each SenderManager independently persists failures in its own localStorage
      if (anySucceeded) {
        this.consecutiveSendFailures = 0;
        this.removeProcessedEvents(eventIds);
        this.emitEventsQueue(body);

        const failedCount = results.filter((result) => !this.isSuccessfulResult(result)).length;
        if (failedCount > 0) {
          log('debug', 'Periodic send completed with some failures, removed from queue and persisted per-integration', {
            data: { eventCount: eventsToSend.length, failedCount },
          });
        }
      } else {
        this.consecutiveSendFailures = Math.min(this.consecutiveSendFailures + 1, MAX_CONSECUTIVE_SEND_FAILURES);
        // All integrations failed - keep events in queue for retry via periodic backoff
        log('debug', 'Periodic send complete failure, events kept in queue for retry', {
          data: { eventCount: eventsToSend.length },
        });
      }

      if (this.eventsQueue.length === 0) {
        this.clearSendTimeout();
      } else {
        this.scheduleSendTimeout();
      }
    } finally {
      this.sendInProgress = false;
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
      .sort((a, b) => {
        // SESSION_START always goes first
        if (a.type === EventType.SESSION_START && b.type !== EventType.SESSION_START) return -1;
        if (b.type === EventType.SESSION_START && a.type !== EventType.SESSION_START) return 1;
        // Otherwise sort by timestamp
        return a.timestamp - b.timestamp;
      });

    let queue: EventsQueue = {
      user_id: this.get('userId'),
      session_id: this.get('sessionId') as string,
      device: this.get('device'),
      events,
      ...(this.get('config')?.globalMetadata && { global_metadata: this.get('config')?.globalMetadata }),
      ...(this.get('identity') && { identify: this.get('identity') }),
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
    const currentPageUrl = data.page_url ?? this.get('pageUrl');

    // Use TimeManager for accurate timestamps (immune to clock skew during session)
    const timestamp = this.timeManager.now();

    // Validate timestamp before creating event
    const validation = this.timeManager.validateTimestamp(timestamp);
    if (!validation.valid) {
      log('warn', 'Event timestamp validation failed', {
        data: { type: data.type, error: validation.error },
      });
      // Continue anyway with adjusted timestamp to avoid data loss
      // Backend has 3-minute tolerance as safety net
    }

    // Get session-level attribution from global state (captured once at SESSION_START)
    const sessionReferrer = this.get('sessionReferrer');
    const sessionUtm = this.get('sessionUtm');

    let payload: EventData = {
      id: generateEventId(),
      type: data.type as EventType,
      page_url: currentPageUrl,
      timestamp,
      ...(sessionReferrer && { referrer: sessionReferrer }),
      ...(data.from_page_url && { from_page_url: data.from_page_url }),
      ...(data.scroll_data && { scroll_data: data.scroll_data }),
      ...(data.click_data && { click_data: data.click_data }),
      ...(data.custom_event && { custom_event: data.custom_event }),
      ...(data.web_vitals && { web_vitals: data.web_vitals }),
      ...(data.error_data && { error_data: data.error_data }),
      ...(data.viewport_data && { viewport_data: data.viewport_data }),
      ...(data.page_view && { page_view: data.page_view }),
      ...(sessionUtm && { utm: sessionUtm }),
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

      log('debug', 'Event fingerprint cache exceeded hard limit, cleared', {
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
      if (event.custom_event.metadata) {
        fingerprint += `_${this.stableStringify(event.custom_event.metadata)}`;
      }
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

  /** Deterministic JSON string with sorted keys to ensure consistent fingerprints regardless of property insertion order */
  private stableStringify(value: unknown): string {
    return JSON.stringify(value, (_, v: unknown) => {
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        return Object.keys(v as Record<string, unknown>)
          .sort()
          .reduce<Record<string, unknown>>((sorted, key) => {
            sorted[key] = (v as Record<string, unknown>)[key];
            return sorted;
          }, {});
      }
      return v;
    });
  }

  private addToQueue(event: EventData): void {
    this.emitEvent(event);

    this.eventsQueue.push(event);

    if (this.eventsQueue.length > MAX_EVENTS_QUEUE_LENGTH) {
      const nonCriticalIndex = this.eventsQueue.findIndex((e) => e.type !== EventType.SESSION_START);

      const removedEvent =
        nonCriticalIndex >= 0 ? this.eventsQueue.splice(nonCriticalIndex, 1)[0] : this.eventsQueue.shift();

      log('warn', 'Event queue overflow, oldest non-critical event removed', {
        data: {
          maxLength: MAX_EVENTS_QUEUE_LENGTH,
          currentLength: this.eventsQueue.length,
          removedEventType: removedEvent?.type,
          wasCritical: removedEvent?.type === EventType.SESSION_START,
        },
      });
    }

    this.scheduleSendTimeout();

    if (
      this.eventsQueue.length >= BATCH_SIZE_THRESHOLD &&
      this.consecutiveSendFailures < MAX_CONSECUTIVE_SEND_FAILURES
    ) {
      void this.sendEventsQueue();
    }
  }

  private scheduleSendTimeout(): void {
    if (this.sendTimeoutId !== null) return;

    const delay = this.calculateSendDelay();
    this.sendTimeoutId = window.setTimeout(() => {
      this.sendTimeoutId = null;
      if (this.eventsQueue.length > 0) {
        void this.sendEventsQueue();
      }
    }, delay);
  }

  private calculateSendDelay(): number {
    const baseInterval = this.get('config')?.sendIntervalMs ?? EVENT_SENT_INTERVAL_MS;
    if (this.consecutiveSendFailures === 0) return baseInterval;
    const backoff = baseInterval * Math.pow(2, this.consecutiveSendFailures);
    return Math.min(backoff, MAX_SEND_INTERVAL_MS);
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

  /**
   * Creates a debounced version of a function that delays execution until after
   * a specified wait time has elapsed since the last invocation.
   *
   * **Purpose**: Reduces frequency of expensive operations (localStorage writes)
   * while ensuring no data is lost (trailing edge execution).
   *
   * **Behavior**:
   * - Each call resets the timer
   * - Function executes only after `delay` ms of silence
   * - Last invocation always executes (trailing edge)
   *
   * **Use Case**: Batches rapid successive calls into a single execution
   *
   * @param fn - Function to debounce
   * @param delay - Delay in milliseconds
   * @returns Debounced version of the function
   *
   * @internal
   */
  private debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return ((...args: Parameters<T>) => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        fn(...args);
        timeoutId = null;
      }, delay);
    }) as T;
  }

  /**
   * Returns initial zero counts for session event tracking.
   *
   * **Purpose**: DRY helper to avoid duplicating initial counts structure
   * across multiple methods (loadSessionCounts, validation fallbacks).
   *
   * @returns Fresh SessionEventCounts object with all counters at zero
   *
   * @internal
   */
  private getInitialCounts(): SessionEventCounts {
    return {
      total: 0,
      [EventType.CLICK]: 0,
      [EventType.PAGE_VIEW]: 0,
      [EventType.CUSTOM]: 0,
      [EventType.VIEWPORT_VISIBLE]: 0,
      [EventType.SCROLL]: 0,
    };
  }

  /**
   * Loads persisted session event counts from localStorage.
   *
   * **Purpose**: Restore per-session event counts after page reload to maintain
   * accurate rate limiting across page navigations within the same session.
   *
   * **Behavior**:
   * - Attempts to load counts from localStorage using session ID as key
   * - If no persisted data found: Returns initial zero counts
   * - If corrupted data found: Returns initial zero counts with warning
   *
   * **Storage Key**: `tlog:{userId}:session_counts:{sessionId}`
   *
   * **Why This Matters**:
   * - Without persistence, counts reset on every page reload
   * - This allows users to bypass per-session limits by refreshing the page
   * - Example: 100 PAGE_VIEW limit could be bypassed by reloading after 99 events
   *
   * @param sessionId - Current session identifier
   * @returns Session event counts object (either persisted or initial state)
   *
   * @internal
   */
  private loadSessionCounts(sessionId: string): SessionEventCounts {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return this.getInitialCounts();
    }

    const userId = this.get('userId') || 'anonymous';
    const storageKey = SESSION_COUNTS_KEY(userId, sessionId);

    try {
      const stored = localStorage.getItem(storageKey);

      if (!stored) {
        // No persisted data - this is a new session or first page load
        return this.getInitialCounts();
      }

      const parsed = JSON.parse(stored) as Partial<StoredSessionCounts>;

      // Check for expiry (7 days)
      if (parsed._timestamp && Date.now() - parsed._timestamp > SESSION_COUNTS_EXPIRY_MS) {
        log('debug', 'Session counts expired, clearing', {
          data: { sessionId, age: Date.now() - parsed._timestamp },
        });
        localStorage.removeItem(storageKey);
        return this.getInitialCounts();
      }

      // Robust validation: check all required fields (not just 'total')
      // Prevents partial/corrupted data from causing runtime errors
      if (
        typeof parsed.total === 'number' &&
        typeof parsed[EventType.CLICK] === 'number' &&
        typeof parsed[EventType.PAGE_VIEW] === 'number' &&
        typeof parsed[EventType.CUSTOM] === 'number' &&
        typeof parsed[EventType.VIEWPORT_VISIBLE] === 'number' &&
        typeof parsed[EventType.SCROLL] === 'number'
      ) {
        // Return only the SessionEventCounts fields (exclude _timestamp, _version)
        return {
          total: parsed.total,
          [EventType.CLICK]: parsed[EventType.CLICK],
          [EventType.PAGE_VIEW]: parsed[EventType.PAGE_VIEW],
          [EventType.CUSTOM]: parsed[EventType.CUSTOM],
          [EventType.VIEWPORT_VISIBLE]: parsed[EventType.VIEWPORT_VISIBLE],
          [EventType.SCROLL]: parsed[EventType.SCROLL],
        };
      }

      log('warn', 'Invalid session counts structure in localStorage, resetting', {
        data: { sessionId, parsed },
      });
      localStorage.removeItem(storageKey);
      log('debug', 'Session counts removed due to invalid/corrupted data', {
        data: { sessionId, parsed },
      });

      return this.getInitialCounts();
    } catch (error) {
      log('warn', 'Failed to load session counts from localStorage', {
        error,
        data: { sessionId },
      });

      return this.getInitialCounts();
    }
  }

  /**
   * Cleans up expired session counts from localStorage.
   *
   * **Purpose**: Prevents localStorage pollution from abandoned sessions by removing
   * counts older than 7 days.
   *
   * **Behavior**:
   * - Checks if cleanup was run recently (within last hour) and skips if so
   * - Iterates all localStorage keys matching the session counts prefix pattern
   * - Parses each entry and checks `_timestamp` field
   * - Removes entries where age exceeds SESSION_COUNTS_EXPIRY_MS (7 days)
   * - Silently ignores parse errors (corrupted entries cleaned on next load)
   * - Updates last cleanup timestamp after successful run
   *
   * **When Called**: Automatically on EventManager constructor initialization
   *
   * **Performance**: O(n) scan where n = localStorage keys (typically <100), but throttled
   * to run at most once per hour to prevent impact on rapid page reloads
   *
   * @internal
   */
  private cleanupExpiredSessionCounts(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }

    try {
      // Throttling: Skip if cleanup ran recently (within last hour)
      const lastCleanup = localStorage.getItem(SESSION_COUNTS_LAST_CLEANUP_KEY);

      if (lastCleanup) {
        const timeSinceLastCleanup = Date.now() - parseInt(lastCleanup, 10);

        if (timeSinceLastCleanup < SESSION_COUNTS_CLEANUP_THROTTLE_MS) {
          log('debug', 'Skipping session counts cleanup (throttled)', {
            data: { timeSinceLastCleanup, throttleMs: SESSION_COUNTS_CLEANUP_THROTTLE_MS },
          });

          return;
        }
      }

      const userId = this.get('userId') || 'anonymous';
      const prefix = `${STORAGE_BASE_KEY}:${userId}:session_counts:`;

      // Collect keys to remove (can't modify during iteration)
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        if (key?.startsWith(prefix)) {
          try {
            const stored = localStorage.getItem(key);

            if (stored) {
              const parsed = JSON.parse(stored) as Partial<StoredSessionCounts>;

              // Check expiry
              if (parsed._timestamp && Date.now() - parsed._timestamp > SESSION_COUNTS_EXPIRY_MS) {
                keysToRemove.push(key);
              }
            }
          } catch {
            // Ignore parse errors, will be cleaned on next load
          }
        }
      }

      // Remove expired entries
      keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
        log('debug', 'Cleaned up expired session counts', { data: { key } });
      });

      if (keysToRemove.length > 0) {
        log('info', `Cleaned up ${keysToRemove.length} expired session counts entries`);
      }

      // Update last cleanup timestamp
      localStorage.setItem(SESSION_COUNTS_LAST_CLEANUP_KEY, Date.now().toString());
    } catch (error) {
      log('warn', 'Failed to cleanup expired session counts', { error });
    }
  }

  /**
   * Persists current session event counts to localStorage (debounced).
   *
   * **Purpose**: Save event counts to ensure they survive page reloads and
   * maintain accurate per-session rate limiting across navigations.
   *
   * **Behavior**:
   * - Saves current `sessionEventCounts` to localStorage using session ID as key
   * - Overwrites previous counts (always reflects latest state)
   * - Fails silently if localStorage quota exceeded or unavailable
   *
   * **Storage Key**: `tlog:{userId}:session_counts:{sessionId}`
   *
   * **Debouncing**: This method is called via `saveSessionCountsDebounced()`
   * with 500ms debounce delay. Direct calls are for immediate saves (e.g., stop()).
   *
   * **Performance**: Debouncing reduces localStorage writes from ~1000 per session
   * to ~20-30 (96-97% reduction) while maintaining data integrity.
   *
   * **Cleanup**: Counts persist across page reloads for rate limiting enforcement.
   * Automatic cleanup on page reload removes expired counts (older than 7 days).
   * Note: SESSION_COUNTS_KEY entries are intentionally persistent to maintain
   * rate limits across sessions (~100 bytes per session).
   *
   * @param sessionId - Current session identifier
   *
   * @internal
   */
  private saveSessionCounts(sessionId: string): void {
    const userId = this.get('userId') || 'anonymous';
    const storageKey = SESSION_COUNTS_KEY(userId, sessionId);

    try {
      const dataToStore: StoredSessionCounts = {
        ...this.sessionEventCounts,
        _timestamp: Date.now(),
        _version: 1,
      };

      localStorage.setItem(storageKey, JSON.stringify(dataToStore));
    } catch (error) {
      log('warn', 'Failed to persist session counts to localStorage', {
        error,
        data: { sessionId },
      });
    }
  }
}
