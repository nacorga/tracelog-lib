# Event Handlers

Event handlers capture specific DOM events and user interactions, converting them into trackable analytics events.

## PageViewHandler

Tracks page navigation and route changes in single-page applications.

**Events Generated**: `page_view`

**Triggers**:
- Initial page load
- Browser navigation (back/forward) via `popstate` event
- Hash changes (`#section`) via `hashchange` event
- History API calls (`pushState`, `replaceState`)

**Key Features**:
- **URL Normalization**: Filters sensitive query parameters before tracking
  - **Default Protection**: Automatically removes 16 common sensitive params: `token`, `auth`, `key`, `session`, `reset`, `email`, `password`, `api_key`, `apikey`, `secret`, `access_token`, `refresh_token`, `verification`, `code`, `otp`
  - **Custom Parameters**: Extends defaults with user-provided `config.sensitiveQueryParams`
  - **Example**: `https://app.com/page?token=abc&user=john` → `https://app.com/page?user=john`
- **SPA Navigation Detection**: Automatically patches `history.pushState()` and `history.replaceState()` to detect route changes
- **Deduplication**: Compares normalized URLs against last tracked URL to prevent consecutive duplicate events
- **Lifecycle Callback**: Invokes `onTrack()` callback after each page view for session management integration

**Event Data**:
```javascript
// Navigation event (with from_page_url)
{
  type: 'page_view',
  page_url: 'https://example.com/page?param=value',
  from_page_url: 'https://example.com/previous', // only present on navigation, not initial load
  page_view: {                                     // optional - omitted if all fields empty
    referrer: 'https://google.com',               // document.referrer (optional)
    title: 'Page Title',                          // document.title (optional)
    pathname: '/page',                            // window.location.pathname (optional)
    search: '?param=value',                       // window.location.search (optional)
    hash: '#section'                              // window.location.hash (optional)
  }
}

// Initial page load event (no from_page_url)
{
  type: 'page_view',
  page_url: 'https://example.com/',
  page_view: {
    title: 'Home Page',
    pathname: '/'
    // ... other fields if present
  }
}
```

**Implementation Notes**:
- Event listeners use capture phase (`addEventListener(..., true)`) for early event interception
- Initial page view is tracked via separate logic during `startTracking()` initialization
- `onTrack()` callback is invoked after initial page view and after each navigation event
- History API methods are patched (not replaced) - original methods are preserved and restored on cleanup
- URL normalization gracefully handles invalid URLs by returning the original URL
- Deduplication is case-sensitive and compares full normalized URLs

## ClickHandler

Captures mouse clicks and converts them into analytics events with element context and coordinates.

**Events Generated**: `click`, `custom` (for tracked elements)

**Triggers**:
- Any click event on the document
- Uses capture phase (`addEventListener('click', handler, true)`)

**Key Features**:
- Smart element detection via `INTERACTIVE_SELECTORS` (29 selectors including buttons, links, form elements, ARIA roles, framework-specific attributes like `[routerLink]`, `[ng-click]`, and common CSS classes like `.btn`, `.clickable`)
- Relative coordinates calculation (0-1 scale, 3 decimal precision, clamped)
- Custom event tracking via `data-tlog-name` attributes
- Text extraction with length limits (255 chars max) and priority logic
- **PII Sanitization**: Automatically redacts emails, phone numbers, credit cards, API keys, and tokens from captured text
- **Privacy Controls**: Respects `data-tlog-ignore` attribute to exclude sensitive elements from tracking

**Text Extraction Priority**:
1. Uses clicked element's text if within 255 character limit
2. Falls back to relevant interactive element's text
3. Truncates with `...` ellipsis if text exceeds limit
4. Returns empty string if no text content available

**Event Data**:
```javascript
// Standard click event
{
  type: 'click',
  click_data: {
    x: 150, y: 200,              // Absolute coordinates
    relativeX: 0.5, relativeY: 0.3,  // Relative to element (0-1 scale, 3 decimal precision, clamped)
    tag: 'button',               // Element tag name (always present)
    id: 'submit-btn',            // Element ID if present
    class: 'btn primary',        // CSS classes
    text: 'Submit Form',         // Element text content (255 chars max)
    href: '/submit',             // Link href if applicable
    title: 'Submit button',      // Title attribute
    alt: 'Submit icon',          // Alt attribute (for images)
    role: 'button',              // ARIA role attribute
    ariaLabel: 'Submit form',    // Accessibility label
    dataAttributes: {            // Extracted element attributes (only included if not empty)
      'id': 'submit-btn',        // These are from the element's attributes
      'class': 'btn primary',
      'data-testid': 'submit',
      'aria-label': 'Submit form',
      'title': 'Submit button',
      'href': '/submit',
      'type': 'button',
      'name': 'submitBtn',
      'alt': 'Submit icon',
      'role': 'button'
    }
  }
}

// Custom tracked element (data-tlog-name="signup-cta")
{
  type: 'custom',
  custom_event: {
    name: 'signup-cta',
    metadata: { value: 'premium' }  // data-tlog-value if present
  }
}
```

**Element Detection Logic**:
1. Check if clicked element matches interactive selectors
2. If not, search ancestors for interactive elements
3. Fallback to clicked element if no interactive parent found

**Privacy & Security Features**:
- **PII Sanitization**: Text content is sanitized using `PII_PATTERNS` before storage:
  - Email addresses → `[REDACTED]`
  - Phone numbers (US format) → `[REDACTED]`
  - Credit card numbers → `[REDACTED]`
  - API keys/tokens → `[REDACTED]`
  - Bearer tokens → `[REDACTED]`
  - IBAN numbers → `[REDACTED]`
- **Element Exclusion**: Elements (or their parents) with `data-tlog-ignore` attribute are completely ignored
  ```html
  <!-- This button will NOT be tracked -->
  <button data-tlog-ignore>Delete Account</button>

  <!-- Children of ignored parents are also ignored -->
  <div data-tlog-ignore>
    <button>Submit Payment</button> <!-- NOT tracked -->
  </div>
  ```
- **Input Value Protection**: NEVER captures `value` attribute from `<input>`, `<textarea>`, or `<select>` elements (only element metadata like tag, id, class)

**Additional Implementation Details**:
- **Coordinate Precision**: Relative coordinates use 3 decimal places (e.g., 0.123) and are clamped to [0, 1] range
- **Text Node Handling**: If click target is a text node, uses parent element's HTML element
- **Empty Attribute Filtering**: `dataAttributes` object is only included if at least one attribute is present
- **Both Events Sent**: When clicking tracked elements (with `data-tlog-name`), BOTH custom AND click events are sent
- **Error Resilience**: Invalid selectors in `INTERACTIVE_SELECTORS` are caught and skipped with warning logs
- **Ignore Check**: Performed early in handler (before any processing) via `shouldIgnoreElement()` method

## ErrorHandler

Captures JavaScript errors and unhandled promise rejections for debugging and monitoring.

**Events Generated**: `error`

**Triggers**:
- `window.addEventListener('error')` - JavaScript runtime errors
- `window.addEventListener('unhandledrejection')` - Unhandled promise rejections

**Key Features**:
- **Sampling**: Configurable error sampling rate (default 100% - `errorSampling: 1.0`)
- **PII Sanitization**: Removes emails, phone numbers, credit cards, IBAN, API keys, Bearer tokens, and connection string passwords from error messages
- **Message Limits**: Truncates messages to 500 characters max
- **Rich Context**: Captures filename, line, column for JS errors

**Event Data**:
```javascript
// JavaScript error
{
  type: 'error',
  error_data: {
    type: 'js_error',
    message: 'TypeError: Cannot read property [REDACTED]',
    filename: '/app/bundle.js',  // Filename where error occurred
    line: 1247,                  // Line number
    column: 15                   // Column number
  }
}

// Promise rejection
{
  type: 'error',
  error_data: {
    type: 'promise_rejection',
    message: 'Error: API call failed\n    at fetch (/api/endpoint)...'
  }
}
```

**Sampling Configuration**:
```javascript
await tracelog.init({
  id: 'project-id',
  errorSampling: 0.25  // Capture 25% of errors (default: 1.0 = 100%)
});
```

## PerformanceHandler

Captures Web Vitals and performance metrics using the `web-vitals` library with fallback to native Performance Observer API. **Only reports metrics that exceed configured quality thresholds** to focus on problematic performance issues.

**Events Generated**: `web_vitals`

**Triggers**:
- **Primary**: `web-vitals` library (onLCP, onCLS, onFCP, onTTFB, onINP)
- **Fallback**: Performance Observer API when web-vitals fails to load
- **Hybrid**: Long tasks always use Performance Observer (PerformanceObserver 'longtask')

**Key Features**:
- **Threshold Filtering**: Only sends metrics exceeding quality thresholds (e.g., LCP > 4000ms, TTFB > 800ms)
- **Dual Strategy**: Uses web-vitals library with native Performance Observer fallback
- **Deduplication**: Prevents duplicate metrics per navigation using unique Navigation IDs (except CLS and LONG_TASK)
- **CLS Accumulation**: Cumulative Layout Shift accumulates within navigation, resets on navigation change
- **CLS Input Filtering**: Ignores layout shifts caused by recent user input (not counted as poor UX)
- **Precision Control**: All metrics use 2-decimal precision for consistency
- **Long Task Throttling**: Maximum 1 long task event per second to prevent spam

**Metrics Captured**:
- **LCP** (Largest Contentful Paint): Main content loading time (threshold: >4000ms)
- **CLS** (Cumulative Layout Shift): Visual stability score (threshold: >0.25)
- **FCP** (First Contentful Paint): Initial rendering time (threshold: >1800ms)
- **TTFB** (Time to First Byte): Server response time (threshold: >800ms)
- **INP** (Interaction to Next Paint): Responsiveness measure (threshold: >200ms)
- **LONG_TASK**: Tasks blocking main thread (threshold: >50ms, throttled to 1/second)

**Quality Thresholds**:
```javascript
{
  LCP: 4000,      // milliseconds - "poor" threshold
  FCP: 1800,      // milliseconds - "good" threshold
  CLS: 0.25,      // unitless - "needs improvement" threshold
  INP: 200,       // milliseconds - "good" threshold
  TTFB: 800,      // milliseconds - "good/needs improvement" boundary
  LONG_TASK: 50   // milliseconds - standard long task definition
}
```

**Event Data**:
```javascript
{
  type: 'web_vitals',
  web_vitals: {
    type: 'LCP',        // Metric type
    value: 4247.35      // Value in milliseconds (2 decimal precision)
  }
}

// Long task example
{
  type: 'web_vitals',
  web_vitals: {
    type: 'LONG_TASK',
    value: 127.50       // Duration in milliseconds
  }
}

// CLS example (unitless)
{
  type: 'web_vitals',
  web_vitals: {
    type: 'CLS',
    value: 0.42         // Accumulated layout shift score
  }
}
```

**Navigation-Based Deduplication**:
- Each navigation gets unique ID: `{timestamp}_{pathname}_{random}`
- Metric types (LCP, FCP, INP, TTFB) only sent **once per navigation**
- **CLS** sent multiple times as it accumulates, resets on navigation
- **LONG_TASK** bypasses navigation deduplication, uses time-based throttling (1/second)
- Deduplication map cleared when handler stops

**TTFB Special Handling**:
- Calculated from `PerformanceNavigationTiming.responseStart`
- Can be 0 in legitimate scenarios (cache, Mobile Safari timing limitations)
- Zero values are still reported if threshold exceeded

**CLS Accumulation Behavior**:
- Accumulates layout shift values throughout navigation lifecycle
- Resets to 0 on navigation ID change (SPA route transitions)
- Filters out shifts with `hadRecentInput: true` (user-initiated, not poor UX)
- Multiple CLS events can be sent per navigation as value grows

**Long Task Throttling**:
- Maximum 1 event per 1000ms (1 second) regardless of task count
- Uses `Date.now()` timestamp comparison for throttling
- Only sends tasks exceeding 50ms duration threshold
- Prevents performance overhead from excessive event generation

## ScrollHandler

Tracks scroll depth, direction, velocity, and container identification across multiple scrollable elements using intelligent auto-detection with debounced event handling and built-in guardrails.

**Events Generated**: `scroll`

**Triggers**:
- `scroll` events on window (always tracked)
- `scroll` events on automatically detected scrollable containers

**Configuration Options**:
- `primaryScrollSelector` (optional): CSS selector or `'window'` to manually override automatic primary scroll container detection
  - Example: `tracelog.init({ primaryScrollSelector: '.mat-sidenav-content' })`
  - Validates CSS selector syntax on initialization
  - Can force a specific container to be primary regardless of auto-detection results
  - Updates existing container classifications dynamically

**Key Features**:
- **Automatic Container Detection**: Uses heuristic analysis to find and classify scrollable elements
- **Intelligent Classification**: Distinguishes between main content, secondary containers, and window scroll
- **Manual Override**: `primaryScrollSelector` config allows explicit primary container designation
- **Session Guardrails**: Ignores events once the per-session cap (120 events) is reached and logs a single warning via internal logger
- **Smart Filtering**: Multi-stage filtering with comprehensive guardrails:
  - **Visibility Check**: Element must be connected to DOM with dimensions
  - **Scrollability Check**: Content must overflow container
  - **Significant Movement**: Minimum 10px position delta required
  - **Depth Change**: Minimum 5% depth change between events
  - **Rate Limiting**: Minimum 500ms interval between events per container
  - **Session Cap**: Maximum 120 events per session
  - **Suppress Flag**: Respects global `suppressNextScroll` state
- **Retry System**: 5 attempts with 200ms intervals to handle dynamically loaded content (SPAs)

**Event Data**:
```javascript
{
  type: 'scroll',                     // Event type identifier
  scroll_data: {
    depth: 45,                        // Current scroll depth (0-100%)
    direction: 'down',                // 'up' | 'down'
    container_selector: 'window',     // CSS selector or 'window'
    is_primary: true,                 // Whether this is the main scroll container
    velocity: 1250,                   // Scroll velocity in px/s
    max_depth_reached: 67             // Maximum depth reached in this session (0-100%)
  }
}
```

**Analytics Fields**:
- **`velocity`**: Scroll speed in pixels per second
  - **Low (<500 px/s)**: Reading/engaged behavior
  - **Medium (500-2000 px/s)**: Normal browsing
  - **High (>2000 px/s)**: Scanning/bouncing behavior
  - Use case: Identify truly engaged users vs. quick scanners

- **`max_depth_reached`**: Highest scroll depth achieved in the current session
  - Tracks peak engagement per container
  - Resets on session end
  - Use case: Content engagement funnels, drop-off analysis

- **`container_selector`**: CSS selector identifying the scroll container
  - Priority order: ID selector (`#container`) > Class selector (`.content`) > Tag name (`main`)
  - Special value: `'window'` for viewport scrolling
  - Use case: Identify which content areas users engage with most

- **`is_primary`**: Boolean indicating if this is the primary scroll container
  - `true` if `window` is scrollable (traditional layout)
  - `true` for first detected container if `window` is NOT scrollable (e.g., Angular Material sidenav)
  - `false` for all secondary containers (sidebars, modals, panels)
  - Use case: Filter analytics to focus on main content scroll vs auxiliary UI elements
  - **Example queries**:
    ```javascript
    // Get only primary scroll events
    db.events.find({
      type: 'scroll',
      'scroll_data.is_primary': true
    })

    // Compare primary vs secondary engagement
    db.events.aggregate([
      { $match: { type: 'scroll' } },
      { $group: {
          _id: '$scroll_data.is_primary',
          avg_depth: { $avg: '$scroll_data.depth' },
          avg_velocity: { $avg: '$scroll_data.velocity' }
      }}
    ])
    ```

**Container Selector Identification**:

The handler generates CSS selectors for each scrollable container using this priority:

1. **ID Selector** (highest priority): `#main-content`
   - Uses element's ID attribute if present
   - Most specific and unique identifier

2. **Class Selector**: `.mat-sidenav-content`
   - Uses first class from element's className
   - Useful for framework-specific containers (Angular Material, Bootstrap, etc.)

3. **Tag Name** (fallback): `main`, `div`, `article`
   - Uses element's tag name in lowercase
   - Generic but always available

4. **Window**: `'window'`
   - Special identifier for viewport scrolling
   - Always tracked

**Auto-Detection Logic**:
1. Searches DOM using TreeWalker for performance
2. Pre-filters elements with `overflow: auto/scroll` CSS properties
3. Validates visibility (connected to DOM, has dimensions, not hidden)
4. Validates scrollability (content overflows container)
5. Generates CSS selector for each detected container
6. Retries up to 5 times with 200ms intervals for dynamically loaded content
7. Falls back to window-only if no containers found after retries

**Dynamic Changes**:
- Container classification (`is_primary`) is determined at detection time
- `primaryScrollSelector` config can override and update primary designation dynamically
- Does NOT automatically update if page layout changes (e.g., window becomes scrollable mid-session) unless triggered by config
- New containers detected after initial setup will be classified based on current state
- This ensures consistent analytics data within a session (unless manually overridden)
- Historical events maintain their original `is_primary` value

**Performance Optimizations**:
- TreeWalker with early branch pruning
- Limited to 10 containers per scan
- 250ms debounce per container
- Window scrollability result cached for performance

**Debouncing Strategy**:
- Events debounced to 250ms to prevent spam
- Each container has independent debounce timer
- Timers properly cleaned up to prevent memory leaks

**Cleanup & Memory Management**:
- Properly removes all event listeners on `stopTracking()`
- Clears all debounce timers to prevent leaks
- Resets scroll event counter and warning flags
- Clears window scrollability cache
- Cancels pending retry attempts

**Framework Compatibility**:
Works automatically with:
- Angular Material (`mat-sidenav-content`, `mat-drawer-content`)
- React/Vue custom scrollable containers
- Semantic HTML5 (`<main>`, `[role="main"]`)
- Any custom framework with scrollable elements

**Configurable Constants** (defined in `src/constants/config.constants.ts`):
- `SCROLL_DEBOUNCE_TIME_MS`: 250ms (debounce per container)
- `SIGNIFICANT_SCROLL_DELTA`: 10px (minimum movement)
- `MIN_SCROLL_DEPTH_CHANGE`: 5% (minimum depth change)
- `SCROLL_MIN_EVENT_INTERVAL_MS`: 500ms (minimum time between events)
- `MAX_SCROLL_EVENTS_PER_SESSION`: 120 (session cap)

## SessionHandler

Manages user session lifecycle through delegation to SessionManager with robust error handling and state management.

**Events Generated**: `session_start`, `session_end`

**Architecture**:
- Wrapper around `SessionManager` for consistent handler interface
- Provides error handling and state validation layer
- Manages SessionManager lifecycle with proper cleanup

**Key Features**:
- **Error Recovery**: Automatic cleanup on initialization failures with nested try-catch
- **Event Buffer Flushing**: Flushes pending events after successful session initialization
- **ProjectId Resolution**: Dynamically extracts projectId from config (tracelog/custom integrations)
- **Idempotent Operations**: Safe to call `startTracking()` multiple times (returns early if active)
- **Double-Destroy Protection**: Safe to call `destroy()` multiple times
- **State Validation**: Prevents operations on destroyed instances with warning logs
- **Centralized Cleanup**: Private `cleanupSessionManager()` method for consistent resource management

**Lifecycle Management**:
```javascript
const handler = new SessionHandler(storage, eventManager);

// Start tracking - synchronous with error handling
try {
  handler.startTracking();
  // Session tracking active
  // SessionManager created with projectId from config
  // Buffered events flushed after initialization
} catch (error) {
  // Failed to start - handler remains in clean state
  // SessionManager automatically cleaned up
}

// Stop tracking - synchronous cleanup
// Calls stopTracking() + destroy() on SessionManager
handler.stopTracking();

// Destroy - synchronous cleanup (safe to call multiple times)
// Only calls destroy() on SessionManager (not stopTracking)
// Sets destroyed flag and prevents further operations
handler.destroy();
```

**State Management**:
- `isActive()` (private): Checks if SessionManager exists and handler not destroyed
- `destroyed` flag prevents operations with warning logs (`log('warn', ...)`)
- `hasStartSession` global state updated on destroy
- Early return if `isActive()` during `startTracking()`
- Early return if `destroyed` during `destroy()`
- Error during start leaves handler in clean, reusable state

**State Update Pattern**:
```javascript
// startTracking checks
if (this.isActive()) return;  // Already active
if (this.destroyed) {
  log('warn', 'Cannot start tracking on destroyed handler');
  return;
}

// destroy sets global state
this.destroyed = true;
this.set('hasStartSession', false);
```

**Error Handling Pattern**:
```javascript
// Initialization failure handling (synchronous)
try {
  // Extract projectId from config (tracelog/custom integrations or 'default')
  const projectId = config?.integrations?.tracelog?.projectId ??
                    config?.integrations?.custom?.collectApiUrl ??
                    'default';

  // Create SessionManager with 3 parameters
  sessionManager = new SessionManager(storageManager, eventManager, projectId);
  sessionManager.startTracking();  // Synchronous call

  // Flush events buffered during initialization
  eventManager.flushPendingEvents();
} catch (error) {
  // Nested try-catch for safe cleanup
  if (sessionManager) {
    try {
      sessionManager.destroy();
    } catch {
      // Ignore cleanup errors
    }
    sessionManager = null;
  }

  // Log error before re-throwing
  log('error', 'Failed to start session tracking', { error });
  throw error;
}
```

**Cleanup Behavior**:
```javascript
// stopTracking(): Complete session cleanup
// - Calls SessionManager.stopTracking() (ends session, sends SESSION_END event)
// - Calls SessionManager.destroy() (removes listeners, cleans state)
// - Sets sessionManager to null
handler.stopTracking();

// destroy(): Handler cleanup without session end
// - Checks destroyed flag (early return if true)
// - Calls SessionManager.destroy() only (no stopTracking)
// - Sets sessionManager to null
// - Sets destroyed flag to true
// - Updates hasStartSession global state to false
handler.destroy();

// Private: cleanupSessionManager()
// - Used internally by stopTracking()
// - Centralized cleanup logic
// - Safe null checks before operations
```

**Key Difference**: `stopTracking()` ends the session gracefully (with SESSION_END event), while `destroy()` forcefully cleans up resources without sending events.

**Integration Notes**:
- Used by main App class for session management
- Provides consistent interface with other handlers
- Delegates actual session logic to SessionManager
- Adds robustness layer for production use

All handlers extend `StateManager` for global state access and implement `startTracking()`/`stopTracking()` lifecycle methods.