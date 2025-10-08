# Event Handlers

Event handlers capture specific DOM events and user interactions, converting them into trackable analytics events.

## PageViewHandler

Tracks page navigation and route changes in single-page applications.

**Events Generated**: `page_view`

**Triggers**:
- Initial page load
- Browser navigation (back/forward)
- Hash changes (`#section`)
- History API calls (`pushState`, `replaceState`)

**Key Features**:
- URL normalization with sensitive parameter filtering
- Automatic SPA navigation detection via History API patching
- Deduplication prevents tracking same URL consecutively

**Event Data**:
```javascript
{
  type: 'page_view',
  page_url: 'https://example.com/page?param=value',
  from_page_url: 'https://example.com/previous', // navigation only
  page_view: {
    referrer: 'https://google.com',
    title: 'Page Title',
    pathname: '/page',
    search: '?param=value',
    hash: '#section'
  }
}
```

## ClickHandler

Captures mouse clicks and converts them into analytics events with element context and coordinates.

**Events Generated**: `click`, `custom` (for tracked elements)

**Triggers**:
- Any click event on the document
- Uses capture phase (`addEventListener('click', handler, true)`)

**Key Features**:
- Smart element detection via `INTERACTIVE_SELECTORS` (buttons, links, form elements)
- Relative coordinates calculation (0-1 scale within element bounds)
- Custom event tracking via `data-tlog-name` attributes
- Text extraction with length limits (255 chars max)

**Event Data**:
```javascript
// Standard click event
{
  type: 'click',
  click_data: {
    x: 150, y: 200,              // Absolute coordinates
    relativeX: 0.5, relativeY: 0.3,  // Relative to element (0-1)
    tag: 'button',               // Element tag name
    id: 'submit-btn',            // Element ID if present
    class: 'btn primary',        // CSS classes
    text: 'Submit Form',         // Element text content
    href: '/submit',             // Link href if applicable
    title: 'Submit button',     // Title attribute
    ariaLabel: 'Submit form',    // Accessibility label
    dataAttributes: {            // Common attributes
      'data-testid': 'submit',
      'type': 'button'
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

## ErrorHandler

Captures JavaScript errors and unhandled promise rejections for debugging and monitoring.

**Events Generated**: `error`

**Triggers**:
- `window.addEventListener('error')` - JavaScript runtime errors
- `window.addEventListener('unhandledrejection')` - Unhandled promise rejections

**Key Features**:
- **Sampling**: Configurable error sampling rate (default 10% - `errorSampling: 0.1`)
- **PII Sanitization**: Removes emails, phone numbers, credit cards, IBAN from error messages
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
    url: '/app/bundle.js',       // Filename where error occurred
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
  errorSampling: 0.25  // Capture 25% of errors (default: 0.1 = 10%)
});
```

## PerformanceHandler

Captures Web Vitals and performance metrics using the `web-vitals` library with fallback to native Performance Observer API.

**Events Generated**: `web_vitals`

**Triggers**:
- Performance Observer API for real-time metrics
- Web Vitals library integration (primary)
- Native fallback when library unavailable

**Key Features**:
- **Dual Strategy**: Uses web-vitals library with native fallback
- **Deduplication**: Prevents duplicate metrics per navigation using unique Navigation IDs
- **CLS Reset**: Cumulative Layout Shift resets per navigation to prevent infinite accumulation
- **Precision Control**: All metrics use 2-decimal precision for consistency

**Metrics Captured**:
- **LCP** (Largest Contentful Paint): Main content loading time
- **CLS** (Cumulative Layout Shift): Visual stability score
- **FCP** (First Contentful Paint): Initial rendering time
- **TTFB** (Time to First Byte): Server response time
- **INP** (Interaction to Next Paint): Responsiveness measure
- **LONG_TASK**: Tasks blocking main thread >50ms (throttled)

**Event Data**:
```javascript
{
  type: 'web_vitals',
  web_vitals: {
    type: 'LCP',        // Metric type
    value: 1247.35      // Value in milliseconds (2 decimal precision)
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
```

**Navigation-Based Deduplication**:
- Each navigation gets unique ID: `{timestamp}_{pathname}_{random}`
- CLS values reset on navigation change
- Prevents reporting same metric twice per page load

## ScrollHandler

Tracks scroll depth, direction, velocity, and container identification across multiple scrollable elements using intelligent auto-detection with debounced event handling and built-in guardrails.

**Events Generated**: `scroll`

**Triggers**:
- `scroll` events on window (always tracked)
- `scroll` events on automatically detected scrollable containers

**Key Features**:
- **Automatic Container Detection**: Uses heuristic analysis to find and classify scrollable elements
- **Intelligent Classification**: Distinguishes between main content, secondary containers, and window scroll
- **Session Guardrails**: Ignores events once the per-session cap is reached and logs a single warning
- **Smart Filtering**: Skips non-scrollable/invisible elements and enforces significant movement + debounce
- **Retry System**: 5 attempts with 200ms intervals to handle dynamically loaded content (SPAs)

**Event Data**:
```javascript
{
  type: 'scroll',
  scroll_data: {
    depth: 45,                      // Current scroll depth (0-100%)
    direction: 'down',              // 'up' | 'down'
    container_selector: 'window',   // CSS selector or 'window'
    velocity: 1250,                 // Scroll velocity in px/s
    max_depth_reached: 67           // Maximum depth reached in this session (0-100%)
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

**Performance Optimizations**:
- TreeWalker with early branch pruning
- Limited to 10 containers per scan
- Maximum 5 containers tracked simultaneously
- 250ms debounce per container

**Debouncing Strategy**:
- Events debounced to 250ms to prevent spam
- Each container has independent debounce timer
- Timers properly cleaned up to prevent memory leaks

**Framework Compatibility**:
Works automatically with:
- Angular Material (`mat-sidenav-content`, `mat-drawer-content`)
- React/Vue custom scrollable containers
- Semantic HTML5 (`<main>`, `[role="main"]`)
- Any custom framework with scrollable elements

## SessionHandler

Manages user session lifecycle through delegation to SessionManager with robust error handling and state management.

**Events Generated**: `session_start`, `session_end`

**Architecture**:
- Wrapper around `SessionManager` for consistent handler interface
- Provides error handling and state validation layer
- Manages SessionManager lifecycle with proper cleanup

**Key Features**:
- **Error Recovery**: Automatic cleanup on initialization failures
- **Double-Destroy Protection**: Safe to call `destroy()` multiple times
- **State Validation**: Prevents operations on destroyed instances
- **Centralized Cleanup**: Consistent resource management

**Lifecycle Management**:
```javascript
const handler = new SessionHandler(storage, eventManager);

// Start tracking - with error handling
try {
  await handler.startTracking();
  // Session tracking active
} catch (error) {
  // Failed to start - handler remains in clean state
}

// Stop tracking - async cleanup
await handler.stopTracking();

// Destroy - synchronous cleanup (safe to call multiple times)
handler.destroy();
```

**State Management**:
- `isActive()`: Checks if SessionManager is running and handler not destroyed
- `destroyed` flag prevents use after cleanup
- Error during start leaves handler in clean, reusable state

**Error Handling Pattern**:
```javascript
// Initialization failure handling
try {
  sessionManager = new SessionManager(storage, events);
  await sessionManager.startTracking();
} catch (error) {
  // Automatic cleanup on failure
  sessionManager?.destroy();
  sessionManager = null;
  throw error; // Re-throw after cleanup
}
```

**Integration Notes**:
- Used by main App class for session management
- Provides consistent interface with other handlers
- Delegates actual session logic to SessionManager
- Adds robustness layer for production use

All handlers extend `StateManager` for global state access and implement `startTracking()`/`stopTracking()` lifecycle methods.