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
- Custom event tracking via `data-tl-name` attributes
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

// Custom tracked element (data-tl-name="signup-cta")
{
  type: 'custom',
  custom_event: {
    name: 'signup-cta',
    metadata: { value: 'premium' }  // data-tl-value if present
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
await TraceLog.init({
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

Tracks scroll depth and direction across multiple containers with debounced event handling and built-in guardrails.

**Events Generated**: `scroll`

**Triggers**:
- `scroll` events on window (default)
- `scroll` events on custom containers via `scrollContainerSelectors`

**Key Features**:
- **Session Guardrails**: Ignores events once the per-session cap is reached and logs a single warning.
- **Smart Filtering**: Skips non-scrollable elements and enforces significant movement + debounce.

**Event Data**:
```javascript
{
  type: 'scroll',
  scroll_data: {
    depth: 45,
    direction: 'down'
  }
}

```

**Configuration**:
```javascript
await TraceLog.init({
  id: 'project-id',
  scrollContainerSelectors: ['.main-content', '#sidebar'],
});
```

**Smart Detection Logic**:
1. Filters out non-scrollable elements (`overflow: hidden`, no content overflow)
2. Falls back to `window` if no valid containers found
3. Checks for significant movement (>10px) before processing
4. Early return if window/container not actually scrollable

**Debouncing Strategy**:
- Events debounced to 250ms to prevent spam
- Each container has independent debounce timer
- Timers properly cleaned up to prevent memory leaks

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