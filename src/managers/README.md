# Managers

Core business-logic components that handle event processing, state, sessions, transport, and storage.

## EventManager

**Purpose:** core component responsible for event tracking, queue management, deduplication, rate limiting, and orchestrating transport to the (optional) TraceLog SaaS sender.

**Core functionality:**

- **Event tracking** — captures user interactions (clicks, scrolls, page views, custom events, web vitals, errors)
- **Queue management** — batches events on a configurable interval (`sendIntervalMs`, default 10 s) and on a 50-event threshold
- **Deduplication** — LRU cache with 1000-entry fingerprint storage; 10px coordinate precision for click events; 500ms time threshold; auto-prunes fingerprints older than 5 s
- **Per-session caps** — total 1000 events / session, plus type-specific caps (clicks 500, page views 100, custom 500, scroll 120)
- **Per-event-name rate limiting** — 60 events/min by default (configurable via `maxSameEventPerMinute`)
- **Sampling** — client-side via `samplingRate` (0–1); error-specific via `errorSampling`
- **Pending-events buffer** — buffers up to 100 events before session initialization; flushed once the session starts
- **Event recovery** — recovers persisted events from `localStorage` after crashes or network failures
- **Standalone-mode support** — when no integrations are configured, emits queue events locally and clears them without a network send
- **Event emitter** — emits events for local listeners via `EmitterEvent.EVENT` and `EmitterEvent.QUEUE`

**Sync flush deferral.** When an async send is in flight (`sendInProgress`), `flushImmediatelySync()` sets `pendingSyncFlush = true` and returns `false`. The in-flight async path re-runs `flushImmediatelySync()` from its `finally` block (`drainPendingSyncFlush()`). This prevents double-sending the same batch with a different idempotency token while still delivering events tracked mid-flight (notably `{ critical: true }` events that would otherwise sit in the queue until the next periodic tick).

**Public API:**

- `track(event: Partial<EventData>)` — adds an event to the queue with validation and deduplication
- `stop()` — stops the interval timer, clears queues and state (including resetting `hasStartSession`)
- `flushImmediately()` — asynchronously flushes the queue (returns `Promise<boolean>`)
- `flushImmediatelySync()` — synchronously flushes via `sendBeacon` (returns `boolean`). Defers behind in-flight async sends as described above.
- `getQueueLength()` — returns the current event-queue size
- `recoverPersistedEvents()` — recovers events from `localStorage` after crashes or failures

**State management:**

- **`hasStartSession` flag** — prevents duplicate `SESSION_START` events across init cycles
  - Set to `true` when `SESSION_START` is tracked via `track()`
  - Reset to `false` in `stop()` to allow subsequent init → destroy → init cycles
  - NOT set by `SessionManager`'s BroadcastChannel handler (secondary tabs don't track `SESSION_START`)

**App lifecycle integration.** When `App.destroy()` is called, handlers are stopped first (including `SessionHandler.stopTracking()`), which cleans up `SessionManager` resources. `EventManager.stop()` is called AFTER handlers are stopped. No events are emitted during cleanup.

---

## SenderManager

**Purpose:** transmits batches to the TraceLog SaaS endpoint with network resilience, idempotency, and crash/recovery via `localStorage`.

**Core functionality:**

- **Network transmission** — async via `fetch()` (with retries) or sync via `navigator.sendBeacon()` (for page unload and `{ critical: true }` events)
- **Request enrichment** — wraps every batch with `_metadata`:
  - `client_version` — library version from `LIB_VERSION`
  - `timestamp` — monotonic-clock-derived request timestamp
  - `referer` — current page URL
  - `idempotency_token` — deterministic FNV-1a hash of sorted event IDs, salted by `user_id` + `session_id`. Stable across retries and cross-session recovery so the backend can deduplicate.
- **Persistence** — failed batches saved to `tlog:{userId}:queue` with the idempotency token preserved
- **Permanent-error detection** — 4xx (except 408, 429) marks the batch as discarded (no retry, no persistence)
- **Sync support** — `navigator.sendBeacon()` for page unload; persists on rejection / oversize for next-page-load recovery
- **Recovery guard** — `recoveryInProgress` flag prevents concurrent recovery attempts during rapid navigation
- **v2 → v3 migration** — constructor migrates legacy `:saas` queue keys into the new unscoped key; drops the legacy `:custom` keys (their events were destined for a different backend and must not be forwarded to SaaS)

**Key features:**

- **In-session retry with exponential backoff** — up to 2 additional attempts for transient errors (5xx, 408, network failures)
  - Backoff: `100ms * 2^attempt + random(0–100ms)` → 200–300 ms, 400–500 ms
  - Rate limit (429) skips inner retries and arms a 60s cooldown (mirrored to `localStorage`, shared across tabs on the same origin)
  - Permanent errors (4xx except 408 / 429) bypass retries immediately
- **Multi-tab persistence protection** — checks for recent persistence by other tabs (1-second window); last-write-wins via timestamp validation
- **Event expiration** — persisted events expire after 2 hours
- **Payload-size validation** — checks the 64 KB browser limit before `sendBeacon()`; oversized payloads are persisted to storage instead of silently failing
- **Permanent-error log throttling** — 1 log per `(status, response_code)` pair per minute
- **Request timeout** — 10 s via `AbortController`; timed-out batches preserved for retry with the same idempotency token
- **Network circuit breaker** — opens after `MAX_CONSECUTIVE_NETWORK_FAILURES` consecutive DNS / connection-refused failures, skipping sends for `CIRCUIT_BREAKER_COOLDOWN_MS`; transitions to half-open (one probe) before fully closing
- **Cross-session recovery limit** — each failed page-load recovery increments `recoveryFailures` in the persisted record. After `MAX_RECOVERY_FAILURES` (3), the batch is discarded — prevents an infinite persistence loop against a permanently unreachable backend.

**Storage keys:**

- Queue: `tlog:{userId}:queue`
- Rate-limit cooldown: `tlog:{userId}:rate_limit`

**Standalone mode.** When `integrations.tracelog` is not configured, no `SenderManager` is created and no network requests are issued. Events still flow through the queue and are emitted via `EmitterEvent.QUEUE` for local consumption.

---

## SessionManager

**Purpose:** manages session lifecycle across browser tabs with cross-tab sync and session recovery.

**Core functionality:**

- **Session lifecycle** — creates and tracks sessions based on a configurable timeout
- **Cross-tab sync** — uses `BroadcastChannel` to maintain consistent session state across tabs with explicit action validation
- **Session recovery** — automatically recovers existing sessions from `localStorage` on page refresh (validates session-ID format)
- **Activity tracking** — monitors user engagement (click, keydown, scroll) to extend session duration
- **Event integration** — tracks `SESSION_START` events via `EventManager` only (no `SESSION_END` event — server infers session end from the last event timestamp)

**Key features:**

- Configurable session timeouts (default 15 min, range 30 s – 24 h)
- BroadcastChannel-based cross-tab communication with project-scoped namespacing, 5-second message freshness validation, and explicit `action` validation
- **BroadcastChannel initialization timing** — always initialized BEFORE `SESSION_START` tracking so cross-tab sync is ready when events are emitted
- Automatic session recovery from `localStorage` with session-ID format validation
- Page-visibility handling (pauses timeout when hidden, resumes when visible)
- Graceful cleanup and resource management with passive event listeners
- Unique session-ID format: `{timestamp}-{9-char-base36}` (e.g. `1728488234567-kx9f2m1bq`)
- **`SESSION_START` on new sessions only** — emitted only for NEW sessions, not when recovering an existing session ID (prevents duplicates)
- **Renewal after timeout (SPA support)** — when a session times out, activity listeners remain active in "renewal mode"; the next user interaction creates a new session with `SESSION_START` (prevents null `sessionId` in SPAs)
- **Graceful BroadcastChannel fallback** — sessions work without cross-tab sync if the API is unavailable
- **Project-scoped session storage** — `tlog:{projectId}:session` prevents cross-project conflicts
- **Error rollback** — if initialization fails in `startTracking()`, all setup is rolled back and the error is re-thrown

**Critical implementation details:**

- **Initialization order** — `initCrossTabSync()` MUST be called before `eventManager.track(SESSION_START)` to prevent message loss
- **Cross-tab message handling** — secondary tabs receiving session broadcasts do NOT set `hasStartSession` (managed exclusively by `EventManager` when `SESSION_START` is tracked)
- **`hasStartSession` flag** — consolidated reset in `EventManager.stop()` only (single source of truth)
- **BroadcastChannel validation** — messages require `action === 'session_start'` (prevents malformed messages)
- **Session-ID validation** — recovered IDs validated via regex; corrupted IDs cleared and regenerated
- **Queue sorting** — `SESSION_START` events always sorted first in batch payloads (guarantees order)
- **Session mirror** — session data is automatically mirrored to `sessionStorage` on every write. When `localStorage` is empty (e.g. after an external redirect), recovery falls back to `sessionStorage` transparently. Recovered sessions do NOT emit `SESSION_START`. Session timeout still applies to mirrored data.

---

## StateManager

**Purpose:** abstract base class providing centralized state management for all TraceLog components.

- **Global state access** — synchronous read/write of shared in-memory state via `this.get(key)` / `this.set(key, value)`
- **Read-only snapshots** — `this.getState()` returns an immutable shallow copy
- **Single shared instance** — every subclass operates on the same `globalState` object

**Supported state keys (see `src/types/state.types.ts` for the full `State` interface):**

- Core: `collectApiUrls`, `config`, `sessionId`, `userId`, `device`, `pageUrl`, `identity`
- Control flags: `mode` (QA/production), `hasStartSession`, `suppressNextScroll`
- Session context: `sessionReferrer`, `sessionUtm`
- Runtime counters: `scrollEventCount`

**Test surface:**

- `getGlobalState(): Readonly<State>` — read-only snapshot for tests and the dev-only TestBridge
- `resetGlobalState(): void` — clears every property on the global state (test isolation only; calling this in production breaks the running application)

---

## StorageManager

**Purpose:** robust `localStorage` and `sessionStorage` wrapper with automatic fallback to in-memory storage when browser APIs are unavailable.

**Core functionality:**

- **Dual storage** — separate APIs for `localStorage` (persistent) and `sessionStorage` (tab-scoped)
- **Automatic in-memory fallback** — when storage APIs are unavailable (SSR, privacy modes, write-test failures)
- **Test-key validation** — `__tracelog_test__` write-then-remove probe during initialization (catches Safari private-mode where the API exists but writes throw)
- **Quota handling** — on `QuotaExceededError`, runs a single-pass cleanup pass and retries once

**Cleanup strategy on `QuotaExceededError`:**

1. Collect all `tracelog_*` keys
2. Purge every `tracelog_persisted_events_*` key (largest and recoverable — they represent failed sends)
3. Purge up to 5 other non-critical `tracelog_*` keys
4. Preserve critical keys: `tracelog_session_*`, `tracelog_user_id`, `tracelog_device_id`, `tracelog_config`
5. Retry the failing `setItem` once

The dedicated `clear()` / `isAvailable()` / `hasQuotaError()` helpers from v2 were removed in v3 — no caller used them.

---

## TimeManager

**Purpose:** accurate timestamp generation using a monotonic clock (`performance.now()`) so timestamps remain accurate even if the system clock changes during a session.

- **Boot reference** — captures `performance.now()` + `Date.now()` at construction
- **`now()`** — returns `bootTimestamp + (performance.now() - bootTime)`
- **Fallback** — uses `Date.now()` when `performance.now()` is unavailable (SSR / old browsers)
- **`validateTimestamp(timestamp)`** — rejects timestamps more than 2 minutes in the future relative to the monotonic clock (backend allows 3 min; client is intentionally tighter so obvious clock-skew events are flagged before they hit the wire)

---

## UserManager

**Purpose:** simple utility for managing the unique visitor identifier across browser sessions.

- **UUID v4 generation** — RFC 4122 compliant
- **Persistence** — stored in `localStorage` (with automatic fallback to in-memory)
- **Session continuity** — reuses the existing ID across browser sessions
- **Global identity** — a single ID shared across all TraceLog projects in the same browser

**Storage key:** `tlog:uid` (fixed, not project-scoped).

**API:**

```typescript
static getId(storageManager: StorageManager): string
```
