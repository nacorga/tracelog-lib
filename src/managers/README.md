# Managers

Core business logic components that handle analytics data processing, state management, and external integrations.

## EventManager

**Purpose**: Core component responsible for event tracking, queue management, deduplication, rate limiting, and multi-integration API communication coordination.

**Core Functionality**:
- **Event Tracking**: Captures user interactions (clicks, scrolls, page views, custom events, web vitals, errors)
- **Queue Management**: Batches events and manages sending intervals (configurable, default 10 seconds via `SEND_EVENTS_INTERVAL_MS`) to optimize network requests
- **Deduplication**: Prevents duplicate events using LRU cache with 1000-entry fingerprint storage
- **Rate Limiting**: Client-side rate limiting (50 events/second) with exemptions for critical events
- **Per-Event Rate Limiting**: Prevents infinite loops with per-event-name limits (60/minute default)
- **Per-Session Caps**: Configurable limits prevent runaway event generation (1000 total, type-specific limits)
- **Dynamic Queue Flush**: Events sent immediately when batch threshold (50 events) is reached
- **Pending Events Buffer**: Buffers up to 100 events before session initialization to prevent data loss
- **Event Recovery**: Recovers persisted events from localStorage after crashes or network failures (independent per integration)
- **Multi-Integration Orchestration**: Manages 0-2 SenderManager instances (SaaS + Custom) with parallel async sending
- **Standalone Mode Support**: Emits queue events without network requests when no integrations configured
- **Event Emitter**: Emits events locally for standalone mode and external integrations

**Key Features**:
- **LRU Cache Deduplication**: 1000-entry fingerprint cache with automatic cleanup
  - 10px coordinate precision for click events, 500ms time threshold
  - Prunes fingerprints older than 5 seconds automatically
- **Smart queue overflow protection**: Fixed 100-event limit with priority preservation for SESSION_START/END
- **Pending events buffer**: 100-event pre-session buffer with overflow protection
- **Rate limiting**: 50 events/second with 1-second sliding window, critical events exempted
- **Per-event-name rate limiting**: 60 same event name per minute (configurable via `maxSameEventPerMinute`)
- **Per-session event caps**: Total 1000/session, Clicks 500, Page views 100, Custom 500, Viewport 200, Scroll 120
- **Dynamic flush**: Immediate send when 50-event batch threshold reached
- **Sampling support**: Client-side event sampling with configurable rate (0-1)
- **Multi-integration sending**:
  - Parallel async sending with `Promise.allSettled()` (independent success/failure per integration)
  - Sync sending with `sendBeacon()` requires all integrations to succeed
  - Independent error handling (4xx/5xx) and persistence per integration
- **Standalone mode**: Queue events emitted and cleared after emission when no integrations configured
- **Synchronous and asynchronous flushing**: Dual-mode for normal operation and page unload scenarios
- **Event persistence recovery**: Automatic recovery from localStorage on initialization (independent per integration)
- **QA mode**: Console logging for custom events without backend transmission
- **Event emitter integration**: Local event consumption via `EmitterEvent.EVENT` and `EmitterEvent.QUEUE`

**Public API Methods**:
- `track(event: Partial<EventData>)`: Adds event to queue with validation and deduplication
- `stop()`: Stops interval timer, clears queues and state (includes resetting `hasStartSession` flag for clean reinit cycles)
- `flushImmediately()`: Asynchronously flushes event queue (returns Promise<boolean>)
- `flushImmediatelySync()`: Synchronously flushes queue for page unload (returns boolean)
- `getQueueLength()`: Returns current event queue size
- `flushPendingEvents()`: Flushes pre-session buffered events after session initialization
- `recoverPersistedEvents()`: Recovers events from localStorage after crashes/failures

**State Management**:
- **`hasStartSession` Flag**: Prevents duplicate SESSION_START events across init cycles
  - Set to `true` when SESSION_START is tracked via `track()` method
  - Reset to `false` in `stop()` method to allow subsequent init() → destroy() → init() cycles
  - NOT set by SessionManager's BroadcastChannel message handler (secondary tabs don't track SESSION_START)

**Application Lifecycle Integration**:
- **App.destroy() Flow**: When `App.destroy()` is called, handlers are stopped first (including `SessionHandler.stopTracking()`), which triggers `SessionManager.endSession()` that tracks SESSION_END and calls `flushImmediatelySync()`. EventManager.stop() is called AFTER handlers are stopped, so there's no redundant flush call - the queue is already processed by the time `stop()` runs.

**Transformer Support**:
- **`beforeSend` Hook**: Applied conditionally in `buildEventPayload()` based on integration mode
  - **Custom-only mode**: Applied in EventManager (before dedup/sampling/queueing)
    - Uses `transformEvent()` utility for error handling and validation
    - Integration check: `hasCustomBackend && !isMultiIntegration`
    - Transforms individual events before they enter the queue
  - **Multi-integration mode** (SaaS + Custom): Skipped in EventManager
    - SenderManager applies per-integration transformations instead (see SenderManager section)
    - Prevents SaaS from receiving transformed data (schema protection)
  - Can filter events by returning `null`
  - Errors caught by utility, original event used as fallback

## SamplingManager

**Reason**: Dead code elimination - the SamplingManager was completely unused throughout the codebase. Event sampling is now handled directly in EventManager using simple random sampling (`Math.random() < samplingRate`), providing consistent behavior across all event types while reducing bundle size and architectural complexity.

## SenderManager

**Purpose**: Integration-aware event transmission with network resilience and independent persistence per integration (SaaS/Custom).

**Core Functionality**:
- **Integration-Specific Sending**: Each instance handles one integration (identified by `integrationId`: 'saas' or 'custom')
- **Network Transmission**: Sends analytics events via HTTP POST (async) or sendBeacon (sync)
- **Independent Persistence**: localStorage-based persistence with integration-specific keys (`tlog:queue:{userId}:saas`, `tlog:queue:{userId}:custom`)
- **Permanent Error Detection**: Identifies 4xx errors as unrecoverable to prevent retry loops (clears storage, no retry)
- **Synchronous Support**: Uses `navigator.sendBeacon()` for page unload scenarios
- **Independent Recovery**: Automatically recovers persisted events when page reloads (per integration)
- **Recovery Guard**: Prevents concurrent recovery attempts during rapid navigation

**Key Features**:
- **Integration-aware architecture** - Constructor accepts `integrationId` and `apiUrl` parameters
  - Multiple instances can coexist (one per integration)
  - Independent storage keys prevent cross-integration interference
- **In-session retry with exponential backoff** - Up to 2 additional attempts for transient errors
  - Transient errors (5xx, 408, 429, network failures) trigger retry with exponential backoff
  - Backoff formula: `100ms * 2^attempt + random(0-100ms)` (delays: 200-300ms, 400-500ms)
  - Permanent errors (4xx except 408/429) bypass retries immediately
  - Failed events persist to localStorage after exhausting retries for next-page-load recovery
  - Dramatically reduces data loss while preventing infinite retry loops
- **Multi-tab protection** - Checks for recent persistence by other tabs (1-second window)
  - Prevents data loss when multiple tabs fail simultaneously
  - Last-write-wins protection via timestamp validation
- **Event expiration** - Persisted events expire after 2 hours to prevent stale data recovery
- **Dual sending modes**: Async (`fetch`) and sync (`sendBeacon`)
- **Payload Size Validation**: Checks 64KB browser limit before `sendBeacon()` call
  - Persists oversized payloads for recovery instead of silent failure
  - Prevents data loss at page unload with large event batches
  - Configured via `MAX_BEACON_PAYLOAD_SIZE` constant
- **Permanent error throttling** - 1 log per status code per minute with integration label
- **Request timeout** - 10 seconds with AbortController
- **Sanitized error logging** - Domain masking for privacy with `[saas]` or `[custom]` labels
- **Test mode support** - QA scenarios and mock failures

**Integration Storage Keys**:
- **SaaS**: `tlog:queue:{userId}:saas`
- **Custom**: `tlog:queue:{userId}:custom`
- **Legacy/Standalone**: `tlog:queue:{userId}` (no suffix)

**Transformer Support**:
- **`beforeSend` Hook**: Applied in `applyBeforeSendTransformer()` for multi-integration mode
  - Operates on **array of events** (not individual events)
  - Uses `transformEvents()` utility for per-event transformation with error handling
  - Only applied for custom backend integrations (`integrationId === 'custom'`)
  - Silently bypassed for TraceLog SaaS (`integrationId === 'saas'`)
  - Filters events by returning empty array (not `null`)
  - Applied in both sync (`sendQueueSyncInternal`) and async (`send`) methods
  - **Multi-integration behavior**: In multi-integration mode (SaaS + Custom), this is where per-integration transformation happens

- **`beforeBatch` Hook**: Applied in `applyBeforeBatchTransformer()` before sending
  - Uses `transformBatch()` utility for error handling and validation
  - Transforms entire batch before network transmission
  - Only applied for custom backend integrations (`integrationId === 'custom'`)
  - Silently bypassed for TraceLog SaaS (`integrationId === 'saas'`)
  - Can filter batches by returning `null`
  - Errors caught by utility, original batch used as fallback
  - Applied in both sync (`sendQueueSyncInternal`) and async (`send`) methods

## SessionManager

**Purpose**: Manages user session lifecycle across browser tabs with cross-tab synchronization and session recovery capabilities.

**Core Functionality**:
- **Session Lifecycle**: Creates, tracks, and terminates user sessions based on configurable timeouts
- **Cross-Tab Sync**: Uses BroadcastChannel API to maintain consistent session state across tabs with message validation
- **Session Recovery**: Automatically recovers existing sessions from localStorage on page refresh (no duplicate SESSION_START events)
- **Activity Tracking**: Monitors user engagement (click, keydown, scroll) to extend session duration
- **Event Integration**: Tracks SESSION_START and SESSION_END events via EventManager with synchronous flush on session end

**Key Features**:
- Configurable session timeouts (default: 15 minutes, range: 30s - 24 hours)
- BroadcastChannel-based cross-tab communication with project-scoped namespacing and 5-second message freshness validation
- **BroadcastChannel initialization timing**: ALWAYS initialized BEFORE SESSION_START tracking to ensure cross-tab sync is ready when events are emitted
- Automatic session recovery from localStorage with conditional persistence (preserved on page_unload, cleared on inactivity/manual_stop)
- Page visibility change handling (pauses timeout when hidden, resumes when visible)
- Graceful cleanup and resource management with passive event listeners for optimal performance
- Unique session ID generation: `{timestamp}-{9-char-base36}` format (e.g., `1728488234567-kx9f2m1bq`)
- Synchronous event flush on session end with automatic localStorage persistence fallback for recovery
- **Dual endSession() protection**: Two guard flags prevent duplicate SESSION_END events:
  - `isEnding`: Prevents concurrent calls (e.g., timeout + pagehide firing simultaneously)
  - `hasEndedSession`: Prevents multiple SESSION_END per session lifecycle
- Five session end reasons: `inactivity`, `page_unload`, `manual_stop`, `orphaned_cleanup`, `tab_closed`
- **Smart page unload detection**: Uses `pagehide` event with `event.persisted` check to only fire SESSION_END when the page is permanently unloaded (`persisted=false`), not when entering BFCache (`persisted=true`)
- Graceful BroadcastChannel fallback (sessions work without cross-tab sync if API unavailable)
- **Project-scoped session storage**: Session data stored with key `tlog:session:{projectId}` to prevent cross-project conflicts
- **Error rollback**: On initialization error in `startTracking()`, all setup is rolled back (cleanup listeners, timers, state) and error re-thrown to caller

**Critical Implementation Details**:
- **Initialization Order**: `initCrossTabSync()` MUST be called before `eventManager.track(SESSION_START)` to prevent message loss during session initialization
- **Cross-Tab Message Handling**: Secondary tabs receiving session broadcasts do NOT set `hasStartSession` flag - this flag is managed exclusively by EventManager when SESSION_START event is tracked
- **Dual Guard System**:
  - `isEnding`: Short-lived flag prevents concurrent execution (reset in finally block)
  - `hasEndedSession`: Session-scoped flag prevents multiple SESSION_END per session (reset on new session start)
- **Guard Reset Timing**: `isEnding` reset in finally block ensures immediate cleanup, while `hasEndedSession` persists until `startTracking()` creates new session
- **pagehide vs beforeunload**: Uses `pagehide` event instead of `beforeunload` because:
  - `beforeunload` fires on EVERY navigation (including back/forward with BFCache), causing false SESSION_END events
  - `pagehide` allows checking `event.persisted` to distinguish between permanent unload and BFCache entry
  - This prevents SESSION_END when user navigates back/forward using browser history (preserving user session)

## StateManager

**Purpose**: Foundational abstract base class providing centralized state management for all TraceLog components.

**Core Functionality**:
- **Global State Access**: Synchronous read/write access to shared in-memory application state
- **Runtime State Management**: Maintains component state during application lifecycle
- **Type-Safe Operations**: Generic getter/setter methods with TypeScript constraints
- **Component Coordination**: Shared state bridge between managers and handlers

**Key Features**:
- Simple key-value store with minimal overhead
- Type-safe operations via `get<T>()`, `set<T>()`, and `getState()` methods
- Memory-efficient synchronous operations (no async overhead)
- Clean reset functionality for test isolation via `resetGlobalState()`
- Read-only state snapshots via `getGlobalState()` utility function

**Supported State Properties**:
- **Core State**: `collectApiUrls`, `config`, `sessionId`, `userId`, `device`, `pageUrl`
- **Control Flags**: `mode` (QA/production), `hasStartSession`, `suppressNextScroll`
- **Runtime Counters**: `scrollEventCount` (optional)

See `src/types/state.types.ts` for complete `State` interface definition.

**Implementation Details**:
- Abstract class pattern - all managers/handlers extend StateManager
- Access pattern: `this.get('key')`, `this.set('key', value)`, `this.getState()`
- No built-in logging - consumers handle their own state change logging
- In-memory only - no automatic persistence (use StorageManager for durable storage)
- Single global state instance shared across all StateManager subclasses

**Public API**:
- `getGlobalState(): Readonly<State>` - Returns immutable state snapshot for testing/debugging
- `resetGlobalState(): void` - Clears all state properties (test isolation)

## StorageManager

**Purpose**: Robust localStorage and sessionStorage wrapper with automatic fallback to in-memory storage for browser environments where storage APIs are unavailable.

**Core Functionality**:
- **Dual Storage Interface**: Provides consistent APIs for both localStorage and sessionStorage with automatic fallback
- **localStorage Methods**: `getItem()`, `setItem()`, `removeItem()`, `clear()`
- **sessionStorage Methods**: `getSessionItem()`, `setSessionItem()`, `removeSessionItem()`
- **Automatic Fallback**: Falls back to in-memory storage when storage APIs fail or are unavailable
- **Browser Compatibility**: Handles storage quota limits, privacy modes, and SSR environments
- **Data Persistence**: Manages session data, configuration cache, and analytics metadata

**Key Features**:
- Dual storage support: localStorage (persistent) and sessionStorage (tab-scoped)
- Separate automatic fallback Maps for each storage type
- SSR-safe initialization with window availability checks
- Storage quota error handling with automatic cleanup and retry
- Intelligent cleanup strategy: prioritizes removing persisted events and non-critical data while preserving critical keys (`tracelog_session_*`, `tracelog_user_id`, `tracelog_device_id`, `tracelog_config`)
- Quota error detection via `hasQuotaError()` method for silent data loss prevention
- Explicit `clear()` method for TraceLog-namespaced data (`tracelog_*` prefix only)
- Public `isAvailable()` checking for conditional logic
- Consistent API regardless of underlying storage mechanism
- Test key validation during initialization (`__tracelog_test__`)

## ConsentManager

**Purpose**: GDPR/CCPA-compliant consent management with cross-tab synchronization and automatic consent persistence.

**Core Functionality**:
- **Consent State Management**: Tracks consent status per integration (TraceLog SaaS, Custom Backend)
- **Cross-Tab Synchronization**: Syncs consent state across browser tabs via storage events
- **Automatic Persistence**: Debounced localStorage persistence with 50ms delay to prevent thrashing
- **Consent Expiration**: Stored consent expires after 365 days requiring re-consent
- **Event Emission**: Emits `CONSENT_CHANGED` events for integration with EventManager
- **Browser Environment Checks**: Verifies browser context before consent operations

**Key Features**:
- Per-integration consent tracking (`tracelog`, `custom`)
- Debounced persistence (50ms) to optimize localStorage writes during rapid consent changes
- Cross-tab sync via storage events with message validation
- Consent expiration after 365 days (configurable via `CONSENT_EXPIRY_DAYS`)
- SSR-safe operations with browser environment detection
- Storage quota error detection and recovery
- Event-driven architecture with `EmitterEvent.CONSENT_CHANGED` emissions
- Automatic cleanup with `cleanup()` method for memory leak prevention

**Public API Methods**:
- `setConsent(integration: 'tracelog' | 'custom' | 'all', granted: boolean)`: Grants or revokes consent for specific integration or all integrations at once
- `hasConsent(integration: 'tracelog' | 'custom')`: Checks if consent granted for integration
- `getConsentState()`: Returns full consent state object with all integrations
- `getGrantedIntegrations()`: Returns array of integration names that have consent granted
- `flush(throwOnError?: boolean)`: Immediately persist pending consent (for page unload or pre-init scenarios)
- `cleanup()`: Cleans up resources (timers, listeners) without clearing persisted consent

**Integration with EventManager**:
- EventManager checks consent via `ConsentManager.hasConsent()` before tracking events
- Events tracked before consent granted are buffered in `EventManager.consentEventsBuffer`
- When consent granted, EventManager calls `flushConsentBuffer()` to send buffered events
- When consent revoked, EventManager calls `clearConsentBufferForIntegration()` to discard buffered events
- Per-integration consent allows mixed scenarios (e.g., TraceLog SaaS consent granted, Custom Backend denied)

**Consent Persistence**:
- Storage key: `tracelog_consent`
- Format:
  ```json
  {
    "state": {
      "tracelog": true,
      "custom": false
    },
    "timestamp": 1704896400000,
    "expiresAt": 1736432400000
  }
  ```
- Expiration: 365 days from grant timestamp
- Cross-tab sync: Automatic via storage event listener

**Important Implementation Details**:
- **Does NOT extend StateManager**: ConsentManager is intentionally standalone (doesn't need global state access)
- **Debouncing Strategy**: 50ms delay provides optimal balance between responsiveness and localStorage write performance
- **SSR Safety**: All operations check `typeof window !== 'undefined'` before DOM/storage access
- **Error Recovery**: Corrupted consent data automatically cleared from storage with fallback to default (no consent)

## UserManager

**Purpose**: Simple utility for managing unique user identification for analytics tracking across browser sessions.

**Core Functionality**:
- **User ID Generation**: Creates RFC4122-compliant UUID v4 identifiers
- **Persistence**: Stores user IDs in localStorage with automatic fallback
- **Session Continuity**: Reuses existing user IDs across browser sessions
- **Global User Identity**: Single user ID shared across all TraceLog projects in the same browser

**Key Features**:
- Static utility method pattern (no object instantiation required)
- UUID v4 generation for globally unique identifiers
- Fixed storage key (`tlog:uid`) for consistent user identification across projects
- Automatic fallback to memory storage when localStorage unavailable
- Minimal dependencies and zero allocation approach

**API**:
```typescript
static getId(storageManager: StorageManager): string
```

**Storage Key**: `tlog:uid` (fixed, not project-scoped)
