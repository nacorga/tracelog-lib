# Managers

Core business logic components that handle analytics data processing, state management, and external integrations.

## EventManager

**Purpose**: Core component responsible for event tracking, queue management, deduplication, rate limiting, and API communication coordination.

**Core Functionality**:
- **Event Tracking**: Captures user interactions (clicks, scrolls, page views, custom events, web vitals, errors)
- **Queue Management**: Batches events and manages sending intervals (10-second intervals) to optimize network requests
- **Deduplication**: Prevents duplicate events using LRU cache with 1000-entry fingerprint storage
- **Rate Limiting**: Client-side rate limiting (50 events/second) with exemptions for critical events
- **Per-Event Rate Limiting**: Prevents infinite loops with per-event-name limits (60/minute default)
- **Per-Session Caps**: Configurable limits prevent runaway event generation (1000 total, type-specific limits)
- **Dynamic Queue Flush**: Events sent immediately when batch threshold (50 events) is reached
- **Pending Events Buffer**: Buffers up to 100 events before session initialization to prevent data loss
- **Event Recovery**: Recovers persisted events from localStorage after crashes or network failures
- **API Communication**: Coordinates with SenderManager for reliable event transmission
- **Event Emitter**: Emits events locally for standalone mode and external integrations
- **Integration Support**: Forwards custom events to Google Analytics when configured

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
- **Synchronous and asynchronous flushing**: Dual-mode for normal operation and page unload scenarios
- **Event persistence recovery**: Automatic recovery from localStorage on initialization
- **QA mode**: Console logging for custom events without backend transmission
- **Event emitter integration**: Local event consumption via `EmitterEvent.EVENT` and `EmitterEvent.QUEUE`

**Public API Methods**:
- `track(event: Partial<EventData>)`: Adds event to queue with validation and deduplication
- `stop()`: Stops interval timer, clears queues and state
- `flushImmediately()`: Asynchronously flushes event queue (returns Promise<boolean>)
- `flushImmediatelySync()`: Synchronously flushes queue for page unload (returns boolean)
- `getQueueLength()`: Returns current event queue size
- `flushPendingEvents()`: Flushes pre-session buffered events after session initialization
- `recoverPersistedEvents()`: Recovers events from localStorage after crashes/failures

## SamplingManager

**Status**: **REMOVED** in v1 refactoring.

**Reason**: Dead code elimination - the SamplingManager was completely unused throughout the codebase. Event sampling is now handled directly in EventManager using simple random sampling (`Math.random() < samplingRate`), providing consistent behavior across all event types while reducing bundle size and architectural complexity.

## SenderManager

**Purpose**: Reliable event transmission to the analytics API with network resilience and event persistence for cross-session recovery.

**Core Functionality**:
- **Network Transmission**: Sends analytics events via HTTP POST (async) or sendBeacon (sync)
- **Event Persistence**: localStorage-based persistence for recovery after network failures
- **Permanent Error Detection**: Identifies 4xx errors as unrecoverable to prevent retry loops
- **Synchronous Support**: Uses `navigator.sendBeacon()` for page unload scenarios
- **Recovery on Next Load**: Automatically recovers persisted events when page reloads
- **Recovery Guard**: Prevents concurrent recovery attempts during rapid navigation

**Key Features**:
- **No in-session retries** - Events removed from queue immediately after send failure
  - Prevents infinite retry loops during API outages (critical fix)
  - Failed events persist to localStorage for next-page-load recovery
  - Dramatically reduces server load and network traffic during failures
- **Multi-tab protection** - Checks for recent persistence by other tabs (1-second window)
  - Prevents data loss when multiple tabs fail simultaneously
  - Last-write-wins protection via timestamp validation
- **Event expiration** - Persisted events expire after 2 hours to prevent stale data recovery
- **Dual sending modes**: Async (`fetch`) and sync (`sendBeacon`)
- **Payload Size Validation**: Checks 64KB browser limit before `sendBeacon()` call
  - Persists oversized payloads for recovery instead of silent failure
  - Prevents data loss at page unload with large event batches
  - Configured via `MAX_BEACON_PAYLOAD_SIZE` constant
- **Permanent error throttling** - 1 log per status code per minute
- **Request timeout** - 10 seconds with AbortController
- **Sanitized error logging** - Domain masking for privacy
- **Test mode support** - QA scenarios and mock failures

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
- Automatic session recovery from localStorage with conditional persistence (preserved on page_unload, cleared on inactivity/manual_stop)
- Page visibility change handling (pauses timeout when hidden, resumes when visible)
- Graceful cleanup and resource management with passive event listeners for optimal performance
- Unique session ID generation: `{timestamp}-{9-char-base36}` format (e.g., `1728488234567-kx9f2m1bq`)
- Synchronous event flush on session end with automatic localStorage persistence fallback for recovery
- Five session end reasons: `inactivity`, `page_unload`, `manual_stop`, `orphaned_cleanup`, `tab_closed`
- Graceful BroadcastChannel fallback (sessions work without cross-tab sync if API unavailable)

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
- **Core State**: `collectApiUrl`, `config`, `sessionId`, `userId`, `device`, `pageUrl`
- **Control Flags**: `mode` (QA/production), `hasStartSession`, `suppressNextScroll`
- **Runtime Counters**: `scrollEventCount` (optional)

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
- Intelligent cleanup strategy: prioritizes removing persisted events and non-critical data while preserving session, user, device, and config keys
- Quota error detection via `hasQuotaError()` method for silent data loss prevention
- Explicit `clear()` method for TraceLog-namespaced data (`tracelog_*` prefix only)
- Public `isAvailable()` checking for conditional logic
- Consistent API regardless of underlying storage mechanism
- Test key validation during initialization (`__tracelog_test__`)

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

---

All managers extend `StateManager` for global state access and follow clean code principles with comprehensive error handling, TypeScript strict mode compliance, and production-ready reliability for the v1 release.