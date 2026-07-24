# Event Handlers

Event handlers capture specific DOM events and user interactions, converting them into trackable analytics events. All handlers extend `StateManager` for global state access and implement `startTracking()` / `stopTracking()` lifecycle methods.

## PageViewHandler

Tracks page navigation and route changes in single-page applications.

**Events generated:** `page_view`

**Triggers:**

- Initial page load
- Browser navigation (back / forward) via `popstate`
- Hash changes (`#section`) via `hashchange`
- History API calls (`pushState`, `replaceState`)

**Key features:**

- **URL normalization** — filters sensitive query parameters before tracking
  - Default protection: 15 common sensitive params (`token`, `auth`, `key`, `password`, `secret`, `api_key`, `apikey`, `access_token`, `refresh_token`, `session`, `sessionid`, `jwt`, `bearer`, `code`, `state`, `nonce`)
  - Custom params: extends defaults with `config.sensitiveQueryParams`
  - Example: `https://app.com/page?token=abc&user=john` → `https://app.com/page?user=john`
- **SPA navigation detection** — automatically patches `history.pushState()` and `history.replaceState()` to detect route changes
- **Deduplication** — compares normalized URLs against the last tracked URL to prevent consecutive duplicates
- **Throttling** — configurable throttle (default 1 second) prevents rapid navigation spam in SPAs (`config.pageViewThrottleMs`)
- **Lifecycle callback** — invokes `onTrack()` after each page view (used for session coordination)
- **Opt-in SPA flush** — when `config.flushOnSpaNavigation` is `true`, the queue is flushed after each navigation

**Event data:**

```javascript
// Navigation event (with from_page_url)
{
  type: 'page_view',
  page_url: 'https://example.com/page?param=value', // Always present; sanitized
  from_page_url: 'https://example.com/previous',    // Only present on navigation, not initial load
  page_view: {                                       // Optional — omitted entirely if all fields empty
    referrer: 'https://google.com',
    title: 'Page Title',
  },
}

// Initial page load
{
  type: 'page_view',
  page_url: 'https://example.com/',
  page_view: { title: 'Home Page' },
}
```

**Implementation notes:**

- Event listeners use the capture phase (`addEventListener(..., true)`) for early event interception
- Initial page view is tracked synchronously during `startTracking()`
- History API methods are **patched** (not replaced) — original methods are preserved and restored on cleanup
- URL normalization gracefully returns the original URL on parse errors
- Deduplication is case-sensitive and compares full normalized URLs

---

## ClickHandler

Captures mouse clicks and converts them into analytics events with element context and coordinates.

**Events generated:** `click`, `custom` (for elements with `data-tlog-name`)

**Triggers:**

- Any click event on the document
- Uses capture phase (`addEventListener('click', handler, true)`)

**Key features:**

- Smart element detection via `INTERACTIVE_SELECTORS` (buttons, links, form elements, ARIA roles, framework-specific attributes like `[routerLink]`, `[ng-click]`, common CSS classes like `.btn`, `.clickable`)
- Custom event tracking via `data-tlog-name` attributes (paired with optional `data-tlog-value`)
- Text extraction with length limits (`MAX_TEXT_LENGTH`) and priority logic
- **PII sanitization** — redacts emails, phone numbers, credit cards, IBANs, API keys, bearer tokens, and connection-string passwords from captured text
- **Privacy controls** — respects `data-tlog-ignore` on the clicked element or any ancestor
- **Click throttling** — per-element throttle (default 300 ms; `config.clickThrottleMs`)
  - Uses stable element signatures (ID > data-testid > data-tlog-name > DOM path)
  - Memory management: TTL-based pruning (5-minute TTL) + LRU eviction (1000-entry limit) prevents leaks in long-running SPAs

**Text extraction priority:**

1. Uses the clicked element's text if within the limit
2. Falls back to the relevant interactive element's text
3. Truncates with `...` if text exceeds the limit
4. Returns empty string if no text content available

**Event data:**

```javascript
// Standard click event
{
  type: 'click',
  click_data: {
    x: 150, y: 200,              // Absolute viewport coordinates (px)
    tag: 'button',               // HTML tag name (always present, lowercase)
    id: 'submit-btn',            // Element ID (if present)
    class: 'btn primary',        // className (if present)
    text: 'Submit Form',         // Element text (PII-sanitized, truncated)
    href: '/submit',             // Anchor href (if applicable)
  },
}

// Custom tracked element (data-tlog-name="signup-cta", data-tlog-value="premium")
{
  type: 'custom',
  custom_event: {
    name: 'signup-cta',
    metadata: { value: 'premium' },
  },
}
```

**Element detection logic:**

1. Check if the clicked element matches an interactive selector
2. If not, search ancestors for an interactive element
3. Fall back to the clicked element if no interactive parent is found

**Privacy & security:**

- **PII sanitization** — text content is sanitized via `sanitizePii()` before storage. See `src/utils/security/pii.utils.ts`.
- **Element exclusion** — elements (or any ancestor) with `data-tlog-ignore` are ignored entirely
  ```html
  <button data-tlog-ignore>Delete Account</button>

  <div data-tlog-ignore>
    <button>Submit Payment</button> <!-- NOT tracked -->
  </div>
  ```
- **Input value protection** — NEVER captures the `value` attribute from `<input>`, `<textarea>`, or `<select>` (only element metadata: tag, id, class)

**Additional implementation details:**

- **Text-node handling** — if the click target is a text node, the parent element is used
- **Both events sent** — clicking an element with `data-tlog-name` emits BOTH a `custom` event AND a `click` event
- **Error resilience** — invalid selectors in `INTERACTIVE_SELECTORS` are caught and skipped with a warning
- **Ignore check** — performed early in the handler (before any processing)

---

## ErrorHandler

Captures JavaScript errors and unhandled promise rejections for debugging and monitoring.

**Events generated:** `error`

**Triggers:**

- `window.addEventListener('error')` — JavaScript runtime errors
- `window.addEventListener('unhandledrejection')` — unhandled promise rejections

**Key features:**

- **Sampling** — configurable rate via `config.errorSampling` (default `1.0` = 100%)
- **PII sanitization** — removes emails, phone numbers, credit cards, IBANs, API keys, bearer tokens, and connection-string passwords from messages and stack traces
- **Message / stack truncation** — `MAX_ERROR_MESSAGE_LENGTH` and `MAX_STACK_TRACE_LENGTH` enforced
- **Rich context** — captures `filename`, `line`, `column` for JS errors
- **Burst detection** — when error throughput exceeds `ERROR_BURST_THRESHOLD`, triggers a `ERROR_BURST_BACKOFF_MS` cooldown to prevent server floods
- **Per-pageview signature cap** — after the 5 s dedup window expires, the same `(normalizedMessage, filename, line)` signature is capped at `MAX_ERRORS_PER_SIGNATURE_PER_PAGEVIEW` per pageview. Normalization mirrors the API's `ErrorFingerprintService` (URLs, UUIDs, hex addresses, long numbers, long quoted strings → placeholders). Counter resets on `pagehide`, `SESSION_START`, and `PAGE_VIEW` (covers SPA navigation via patched History API + popstate/hashchange). Not configurable — for QA scenarios that legitimately need every error, use `errorSampling: 0` or QA mode (`?tlog_mode=qa`).

**Event data:**

```javascript
// JavaScript error
{
  type: 'error',
  error_data: {
    type: 'js_error',
    message: 'TypeError: Cannot read property [REDACTED]',
    filename: '/app/bundle.js',
    line: 1247,
    column: 15,
  },
}

// Promise rejection
{
  type: 'error',
  error_data: {
    type: 'promise_rejection',
    message: 'Error: API call failed\n    at fetch (/api/endpoint)...',
  },
}
```

**Sampling configuration:**

```javascript
await tracelog.init({
  errorSampling: 0.25, // Capture 25% of errors (default: 1.0 = 100%)
});
```

---

## PerformanceHandler

Captures Web Vitals using the `web-vitals` library, buffers them per navigation, and emits ONE
consolidated event carrying every metric measured so far — never one event per metric.
Configurable filtering modes still control which measured *values* are kept.

**Events generated:** `web_vitals` (consolidated shape: `{ schema: 'consolidated', metrics: [...] }`)

**Triggers:**

- `web-vitals` library: `onLCP`, `onCLS`, `onFCP`, `onTTFB`, `onINP` (buffer measurements)
- `pagehide` / `visibilitychange` (document hidden) — flush the buffer as one event, then deliver
  it immediately via `sendBeacon`
- A navigation-boundary change (SPA route change) — flushes the previous navigation's buffer,
  since SPA route changes never fire `pagehide`. No immediate delivery: the page is not going
  away, so the normal batch interval ships it

**Configuration:**

```javascript
await tracelog.init({
  webVitalsMode: 'all', // 'all' (default) | 'needs-improvement' | 'poor'
  webVitalsThresholds: { // Optional per-metric overrides
    LCP: 3000,
    FCP: 2000,
  },
});
```

**Key features:**

- **Consolidation** — metrics for the current navigation are buffered, not sent individually;
  flushed as ONE event on `pagehide`/hidden or a navigation-boundary change. This is what makes
  capturing every value, including good ones, affordable: up to 5 per-metric events collapse
  into 1.
- **Flush ordering** — the lifecycle listeners are registered only after the `web-vitals` library
  has registered its own, so LCP/CLS/INP finalize into the buffer before the flush reads it: one
  navigation ships one event, not an early-metrics event plus a late-metrics one. The flush then
  drains the queue itself rather than depending on `App`'s listeners running afterwards, which
  they do not on a prerendered page (`App` defers handler startup to `prerenderingchange`).
- **Configurable filtering modes** (via `webVitalsMode`), applied per measured value BEFORE
  buffering:
  - `'all'` (default) — buffer every measured value, including good ones (uncensored sample)
  - `'needs-improvement'` — buffer only metrics that exceed the "good" threshold (censors good values)
  - `'poor'` — buffer only poor metrics (most heavily censored)
- **Threshold reference** (Core Web Vitals standards from web.dev; a value exactly AT a threshold
  counts as the better band, matching web.dev — an LCP of exactly 2500 ms is good, not
  needs-improvement):
  - `'needs-improvement'` defaults: LCP ≤ 2500 ms dropped, FCP ≤ 1800 ms dropped, CLS ≤ 0.1 dropped, INP ≤ 200 ms dropped, TTFB ≤ 800 ms dropped
  - `'poor'` defaults: LCP ≤ 4000 ms dropped, FCP ≤ 3000 ms dropped, CLS ≤ 0.25 dropped, INP ≤ 500 ms dropped, TTFB ≤ 1800 ms dropped
  - `'all'`: nothing dropped — no floor at all (`-Infinity`), so a CLS or TTFB of exactly 0 is kept
- **Custom thresholds** — override defaults via `webVitalsThresholds`
- **Navigation-boundary bookkeeping** — collapses repeat reports of the same metric type into the
  latest buffered value per navigation (a Map keyed by metric type)
- **CLS accumulation** — accumulates within a navigation, resets on navigation change
- **CLS input filtering** — ignores layout shifts caused by recent user input (not counted as poor UX)
- **Precision control** — all metrics use 2-decimal precision for consistency
- **Final values only** — all web vitals use `reportAllChanges: false`
- **`samplingRate` exemption** — `WEB_VITALS` is exempt from `samplingRate` (but not from rate
  limiting or session caps): a merchant's sampling rate must never silently thin the Core Web
  Vitals sample

**Metrics captured:**

- **LCP** — Largest Contentful Paint (ms)
- **CLS** — Cumulative Layout Shift (unitless)
- **FCP** — First Contentful Paint (ms)
- **TTFB** — Time to First Byte (ms)
- **INP** — Interaction to Next Paint (ms)

**Default thresholds by mode:**

```javascript
// 'all' mode (default) — no floor, nothing is ever dropped
{ LCP: -Infinity, FCP: -Infinity, CLS: -Infinity, INP: -Infinity, TTFB: -Infinity }

// 'needs-improvement' mode
{ LCP: 2500, FCP: 1800, CLS: 0.1, INP: 200, TTFB: 800 }

// 'poor' mode
{ LCP: 4000, FCP: 3000, CLS: 0.25, INP: 500, TTFB: 1800 }
```

**Event data:**

```javascript
{
  type: 'web_vitals',
  web_vitals: {
    schema: 'consolidated',
    metrics: [
      { type: 'TTFB', value: 320.15 },
      { type: 'FCP', value: 980.42 },
      { type: 'LCP', value: 1450.35 },
      { type: 'CLS', value: 0.02 },
      { type: 'INP', value: 88.7 },
    ],
  },
}

// Partial set — legitimate when a metric never materializes, e.g. no INP on a
// page the visitor never interacted with (never empty, never a repeated type)
{
  type: 'web_vitals',
  web_vitals: {
    schema: 'consolidated',
    metrics: [
      { type: 'TTFB', value: 320.15 },
      { type: 'FCP', value: 980.42 },
      { type: 'LCP', value: 1450.35 },
      { type: 'CLS', value: 0.02 },
    ],
  },
}
```

**Navigation-boundary detection:**

- Each navigation gets a deterministic ID: `{navigationStartTime}_{pathname}` (suffixed with a
  counter only on a real collision — an SPA revisit to the same path)
- A metric type reported more than once before flush overwrites the buffered value (last value
  wins), rather than being dropped
- Memory management: FIFO eviction keeps the last 50 navigations (prevents leaks in
  long-running SPAs)

**TTFB special handling:**

- Calculated from `PerformanceNavigationTiming.responseStart`
- Can be 0 in legitimate scenarios (cache, mobile Safari timing limitations) — always kept in
  the default `'all'` mode

**CLS behavior:**

- Accumulates layout-shift values throughout the navigation lifecycle
- Resets to 0 on navigation-ID change (SPA route transitions)
- Filters out shifts with `hadRecentInput: true` (user-initiated, not poor UX)
- The buffered CLS value is overwritten (not summed again) as it grows — the consolidated event
  ships the final accumulated total, not one entry per accumulation step

---

## ScrollHandler

Tracks scroll depth and direction across the window and any auto-detected scrollable containers.

**Events generated:** `scroll`

**Triggers:**

- `scroll` events on `window` (when the window is scrollable)
- `scroll` events on auto-detected scrollable containers (up to 10 per scan)

**Key features:**

- **Automatic container detection** — uses TreeWalker to find scrollable elements pre-filtered by `overflow: auto | scroll` CSS
- **Session guardrails** — ignores events once the per-session cap (`MAX_SCROLL_EVENTS_PER_SESSION`, 120) is reached and logs a single warning
- **Smart filtering** — multi-stage guardrails:
  - Visibility check: element must be connected to DOM with dimensions
  - Scrollability check: content must overflow the container
  - Significant movement: minimum `SIGNIFICANT_SCROLL_DELTA` (10 px) position delta
  - Depth change: minimum `MIN_SCROLL_DEPTH_CHANGE` (5%) between events
  - Rate limiting: minimum `SCROLL_MIN_EVENT_INTERVAL_MS` (500 ms) interval per container
  - Suppress flag: respects global `suppressNextScroll` state (used right after page-view changes)
- **Retry system** — up to 5 attempts at 200 ms intervals to handle dynamically loaded content (SPAs)

**Event data:**

```javascript
{
  type: 'scroll',
  scroll_data: {
    depth: 45,                    // Current scroll depth (0-100%)
    direction: 'down',            // 'up' | 'down'
    container_selector: 'window', // CSS selector or 'window'
  },
}
```

**Container selector identification:**

The handler generates CSS selectors for each scrollable container using this priority:

1. **ID selector** (highest priority): `#main-content`
2. **Class selector**: `.mat-sidenav-content` (first class from className)
3. **Tag name** (fallback): `main`, `div`, `article`
4. **Window**: `'window'` (special identifier for viewport scrolling)

**Auto-detection logic:**

1. Search the DOM via TreeWalker for performance
2. Pre-filter elements with `overflow: auto | scroll`
3. Validate visibility (connected to DOM, has dimensions, not hidden)
4. Validate scrollability (content overflows the container)
5. Generate a CSS selector for each detected container
6. Retry up to 5 times at 200 ms intervals for dynamically loaded content
7. Fall back to window-only if no containers are found after retries

**Performance optimizations:**

- TreeWalker with early branch pruning
- Limited to 10 containers per scan
- 250 ms debounce per container
- Window scrollability checked dynamically (no caching for accuracy with dynamic content)

**Debouncing strategy:**

- Events debounced to 250 ms to prevent spam
- Each container has an independent debounce timer
- Timers properly cleaned up to prevent leaks

**Cleanup & memory management:**

- Removes all event listeners on `stopTracking()`
- Clears all debounce timers
- Resets scroll event counter and warning flags
- Cancels pending retry attempts

**Framework compatibility:**

Works automatically with:

- Angular Material (`mat-sidenav-content`, `mat-drawer-content`)
- React / Vue custom scrollable containers
- Semantic HTML5 (`<main>`, `[role="main"]`)
- Any custom framework with scrollable elements

**Configurable constants** (`src/constants/config.constants.ts`):

- `SCROLL_DEBOUNCE_TIME_MS`: 250 ms (per-container debounce)
- `SIGNIFICANT_SCROLL_DELTA`: 10 px (minimum movement)
- `MIN_SCROLL_DEPTH_CHANGE`: 5% (minimum depth change)
- `SCROLL_MIN_EVENT_INTERVAL_MS`: 500 ms (minimum time between events)
- `MAX_SCROLL_EVENTS_PER_SESSION`: 120 (session cap)

---

## SessionHandler

Manages user session lifecycle through delegation to `SessionManager` with robust error handling and state management.

**Events generated:** `session_start` only. The server infers session end from the last event timestamp (no `SESSION_END` event).

**Architecture:**

- Wrapper around `SessionManager` for a consistent handler interface
- Provides error handling and state validation layer
- Manages SessionManager lifecycle with proper cleanup

**Key features:**

- **Error recovery** — automatic cleanup on initialization failures via nested try/catch
- **Event buffer flushing** — flushes pending events after successful session initialization
- **ProjectId resolution** — dynamically extracts `projectId` from `config.integrations.tracelog.projectId` (falls back to `'custom'` for standalone mode)
- **Idempotent operations** — safe to call `startTracking()` multiple times (returns early if active)
- **Double-destroy protection** — safe to call `destroy()` multiple times
- **State validation** — prevents operations on destroyed instances with warning logs
- **Centralized cleanup** — private `cleanupSessionManager()` method for consistent resource management

**Lifecycle:**

```javascript
const handler = new SessionHandler(storage, eventManager);

try {
  handler.startTracking();
  // SessionManager created with projectId from config
  // Buffered events flushed after initialization
} catch (error) {
  // Failed to start — handler remains in a clean state
  // SessionManager automatically cleaned up
}

// Stop tracking — synchronous cleanup
handler.stopTracking();

// Destroy — synchronous cleanup (safe to call multiple times)
handler.destroy();
```

**Cleanup behavior:**

- `stopTracking()` and `destroy()` perform the same cleanup without emitting events
- `SESSION_END` events are not emitted (server infers session end)

**Integration notes:**

- Used by main `App` class for session management
- Provides a consistent interface with other handlers
- Delegates actual session logic to `SessionManager`
- Adds a robustness layer for production use

---

All handlers extend `StateManager` for global state access and implement `startTracking()` / `stopTracking()` lifecycle methods.
