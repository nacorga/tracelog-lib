# TraceLog Library

A lightweight TypeScript library for web analytics and user behavior tracking. Automatically captures clicks, scrolls, page views, and performance metrics with cross-tab session management and privacy-first design.

## Features

- **Zero-config tracking** - Automatically captures clicks, scrolls, page navigation, and web vitals out of the box.
- **Cross-tab session management** - Maintains consistent user sessions across multiple browser tabs with BroadcastChannel API and automatic localStorage recovery.
- **Client-only architecture** - Fully autonomous with optional backend integrations (TraceLog SaaS, custom API, Google Analytics).
- **Privacy-first** - Built-in PII sanitization (emails, phone numbers, credit cards, API keys) and client-side sampling controls.
- **Framework agnostic** - Works with vanilla JS, React, Vue, Angular, or any web application.
- **Lightweight** - Only one dependency (`web-vitals`) with dual ESM/CJS support.
- **Event-driven** - Real-time event subscription with `on()` and `off()` methods for custom integrations.
- **Rate limiting** - Client-side rate limiting (200 events/second) with exemptions for critical events (SESSION_START/END).
- **Event recovery** - Automatic recovery of persisted events from localStorage after crashes or network failures.
- **Smart filtering** - Threshold-based web vitals reporting, deduplication (10px click precision), and intelligent queue management.

## Installation

**Prerequisites**: Modern browser with ES6+ support.

## 📦 Which File Should I Use?

| Your Setup | File to Use | How to Use |
|-----------|-------------|------------|
| **npm/yarn** (React, Vue, Angular, etc.) | Automatic | `import { tracelog } from '@tracelog/lib'` |
| **HTML + `<script>` tag** | `tracelog.js` (IIFE) | `<script src="...tracelog.js"></script>` then use `tracelog.init()` |
| **HTML + `<script type="module">`** | `tracelog.esm.js` (ESM) | `import { tracelog } from '...tracelog.esm.js'` |

### Installation Methods

#### 1. NPM/Yarn (Recommended for Modern Apps)
```bash
npm install @tracelog/lib
```

```typescript
import { tracelog } from '@tracelog/lib';

// Standalone mode (no backend required)
tracelog.init();

// OR with TraceLog SaaS integration
tracelog.init({
  integrations: {
    tracelog: { projectId: 'your-project-id' }
  }
});

tracelog.event('user_action', { data: 'example' });
```

**✅ Best for:** React, Vue, Angular, Next.js, Vite, webpack, or any bundler

---

#### 2. CDN - IIFE (Maximum Compatibility)
```html
<script src="https://cdn.jsdelivr.net/npm/@tracelog/lib@latest/dist/browser/tracelog.js"></script>
<script>
  // Standalone mode
  tracelog.init();

  // OR with TraceLog SaaS
  tracelog.init({
    integrations: {
      tracelog: { projectId: 'your-project-id' }
    }
  });
</script>
```

**✅ Best for:** WordPress, static HTML, CMS, legacy browsers, no build step

---

#### 3. CDN - ES Module (Modern Only)
```html
<script type="module">
  import { tracelog } from 'https://cdn.jsdelivr.net/npm/@tracelog/lib@latest/dist/browser/tracelog.esm.js';

  await tracelog.init(); // Standalone mode
  tracelog.event('page_view');
</script>
```

**✅ Best for:** Modern browsers, no bundler, prefer native modules
**⚠️ Note:** Won't work in IE11 or older browsers

## How It Works

- **Standalone Mode** (no `integrations`): Events captured and emitted locally via `on('event')`. No network requests.
- **With Backend** (`integrations.tracelog` or `integrations.custom`): Events sent to configured endpoint after client-side validation.

All validation, sampling, and deduplication happen client-side. Enable QA mode with `?tlog_mode=qa` URL parameter.

## Usage

```typescript
// Standalone mode
await tracelog.init({
  sessionTimeout: 30 * 60 * 1000,
  samplingRate: 1.0
});

// With TraceLog SaaS
await tracelog.init({
  integrations: {
    tracelog: { projectId: 'your-project-id' }
  }
});

// With custom backend
await tracelog.init({
  integrations: {
    custom: { collectApiUrl: 'https://your-api.com/collect' }
  }
});

// Custom events
tracelog.event('product_viewed', {
  productId: 'abc-123',
  category: 'electronics',
  price: 299.99
});

// Privacy controls
await tracelog.init({
  sensitiveQueryParams: ['token', 'session_id'],
  samplingRate: 0.5,
  errorSampling: 0.1
});
```

## API

**Methods:**
- `init(config?: Config): Promise<void>` - Initialize tracking
- `event(name: string, metadata?: Record<string, MetadataType>): void` - Send custom event
- `on(event: string, callback: Function): void` - Subscribe to events
- `off(event: string, callback: Function): void` - Unsubscribe from events
- `isInitialized(): boolean` - Check initialization status
- `destroy(): Promise<void>` - Clean up and remove listeners

**Config (all optional):**
- `sessionTimeout`: Session timeout in ms (default: 900000 / 15 minutes, range: 30s - 24 hours)
- `globalMetadata`: Metadata attached to all events
- `samplingRate`: Event sampling rate 0-1 (default: 1.0)
- `errorSampling`: Error sampling rate 0-1 (default: 1.0 / 100%)
- `sensitiveQueryParams`: Query params to remove from URLs
- `primaryScrollSelector`: Override automatic primary scroll container detection (e.g., `.mat-sidenav-content`, `window`)
- `integrations`:
  - `tracelog.projectId`: TraceLog SaaS
  - `custom.collectApiUrl`: Custom backend
  - `custom.allowHttp`: Enable HTTP for testing
  - `googleAnalytics.measurementId`: GA4

**📚 For detailed configuration and implementation, see:**
- [Handlers Documentation](./src/handlers/README.md) - Event capture logic
- [Managers Documentation](./src/managers/README.md) - Core components
- [Listeners Documentation](./src/listeners/README.md) - Activity tracking

## Event Data Structure

Each event contains a base structure with type-specific data:

**Base fields (all events):**
- `id`: Unique event identifier
- `type`: Event type (see below)
- `page_url`: Current page URL
- `timestamp`: Unix timestamp in milliseconds
- `referrer`: Document referrer (optional)
- `from_page_url`: Previous page URL (optional)
- `utm`: UTM parameters (source, medium, campaign, term, content)

**Event-specific data:**

- **`PAGE_VIEW`**: Navigation tracking
  - `page_view.referrer`: Page referrer
  - `page_view.title`: Page title
  - `page_view.pathname`: URL pathname
  - `page_view.search`: Query string
  - `page_view.hash`: URL hash

- **`CLICK`**: User interactions
  - `click_data.x/y`: Viewport coordinates
  - `click_data.relativeX/relativeY`: Element-relative position
  - `click_data.tag/id/class`: Element identifiers
  - `click_data.text/href/title/alt`: Element content
  - `click_data.role/ariaLabel`: Accessibility attributes
  - `click_data.dataAttributes`: Data attributes

- **`SCROLL`**: Scroll engagement
  - `scroll_data.depth`: Scroll depth percentage (0-100)
  - `scroll_data.direction`: Scroll direction (up/down)
  - `scroll_data.container_selector`: CSS selector identifying scroll container (e.g., `window`, `.mat-sidenav-content`, `#main`)
  - `scroll_data.is_primary`: Whether this is the main scroll container (true for primary content, false for sidebars/modals)
  - `scroll_data.velocity`: Scroll speed in pixels per second (for engagement analysis)
  - `scroll_data.max_depth_reached`: Maximum scroll depth reached in current session (0-100)

### Scroll Container Detection

**Primary Container Logic**:
- If `window` is scrollable → `window` is primary (`is_primary: true`)
- If `window` NOT scrollable → First detected container is primary (e.g., `.mat-sidenav-content` in Angular Material)
- All other containers are secondary (`is_primary: false`)

**Important Notes**:
- `is_primary` is calculated ONCE when container is detected
- Does not re-calculate if layout changes dynamically during session
- Pages without scroll: Window is marked primary but generates no events (scroll impossible)
- Historical events maintain their original `is_primary` value for consistency

- **`SESSION_START`**: Session initialization (cross-tab synchronized)
  - Session ID format: `{timestamp}-{9-char-base36}` (e.g., `1728488234567-kx9f2m1bq`)
  - See [SessionManager docs](./src/managers/README.md#sessionmanager) for cross-tab sync details

- **`SESSION_END`**: Session termination (synchronous flush before page unload)
  - `session_end_reason`: `inactivity`, `page_unload`, `manual_stop`, `orphaned_cleanup`, or `tab_closed`

- **`CUSTOM`**: Business-specific events
  - `custom_event.name`: Event name
  - `custom_event.metadata`: Custom data (any JSON-serializable value)

- **`WEB_VITALS`**: Performance metrics (only sent when exceeding quality thresholds)
  - `web_vitals.type`: Metric type (LCP, CLS, INP, FCP, TTFB, LONG_TASK)
  - `web_vitals.value`: Metric value in milliseconds or unitless (CLS)
  - **Thresholds**: LCP >4000ms, FCP >1800ms, CLS >0.25, INP >200ms, TTFB >800ms, LONG_TASK >50ms
  - See [PerformanceHandler docs](./src/handlers/README.md#performancehandler) for details

- **`ERROR`**: JavaScript errors
  - `error_data.type`: Error type (js_error, promise_rejection)
  - `error_data.message`: Error message
  - `error_data.filename/line/column`: Error location

## Advanced

**Event subscription:**
```typescript
// Important: Register listeners BEFORE init() to capture initial events (SESSION_START, PAGE_VIEW)
tracelog.on('event', (data) => console.log('Event:', data.type));
tracelog.on('queue', (data) => console.log('Queued:', data.events.length));

await tracelog.init();
```

**Note**: Listeners are buffered if registered before `init()`, ensuring you don't miss initial events.

**Filter scroll events by primary container:**
```typescript
tracelog.on('event', (event) => {
  if (event.type === 'scroll') {
    const { is_primary, container_selector, depth, velocity } = event.scroll_data;

    if (is_primary) {
      // Track main content engagement
      console.log(`Primary scroll (${container_selector}): ${depth}%`);

      // Identify engaged users (slow scroll = reading)
      if (velocity < 500 && depth > 50) {
        console.log('User is reading deeply');
      }

      // Identify bouncing users (fast scroll = scanning)
      if (velocity > 2000) {
        console.log('User is quickly scanning');
      }
    } else {
      // Track auxiliary UI interaction
      console.log(`Secondary scroll (${container_selector}): ${depth}%`);
    }
  }
});
```

**Analytics queries example:**
```typescript
// In your analytics backend
const primaryScrollEvents = events.filter(e =>
  e.type === 'scroll' && e.scroll_data.is_primary
);

const avgPrimaryDepth = primaryScrollEvents.reduce((sum, e) =>
  sum + e.scroll_data.depth, 0
) / primaryScrollEvents.length;

console.log(`Average primary content depth: ${avgPrimaryDepth}%`);
```

**TypeScript type helpers:**
```typescript
import { tracelog, isPrimaryScrollEvent, isSecondaryScrollEvent, EmitterEvent } from '@tracelog/lib';

tracelog.on(EmitterEvent.EVENT, (event) => {
  // Type guard provides type safety
  if (isPrimaryScrollEvent(event)) {
    // TypeScript knows event.scroll_data.is_primary === true
    const depth = event.scroll_data.depth;
    console.log(`Primary scroll depth: ${depth}%`);
  }

  if (isSecondaryScrollEvent(event)) {
    // TypeScript knows event.scroll_data.is_primary === false
    const selector = event.scroll_data.container_selector;
    console.log(`Secondary UI scroll: ${selector}`);
  }
});
```

**Multiple integrations:**
```typescript
await tracelog.init({
  integrations: {
    tracelog: { projectId: 'your-project-id' },
    googleAnalytics: { measurementId: 'G-XXXXXXXXXX' }
  }
});
```

**Disable globally:**
```typescript
window.__traceLogDisabled = true;
```

### Manual Primary Container Selection

For edge cases requiring manual override of automatic primary container detection:

```typescript
await tracelog.init({
  primaryScrollSelector: '#custom-content' // Override auto-detection
});

// To mark window as primary:
await tracelog.init({
  primaryScrollSelector: 'window'
});
```

**When to use**: In 99% of cases, automatic detection is sufficient. Use manual selection only when:
- You need to override automatic detection for a specific business requirement
- Your UI has multiple main content areas and you want to prioritize one

**Important Notes:**
- `primaryScrollSelector` is applied during `init()` and affects all subsequently detected containers
- The selector is applied BEFORE automatic detection to ensure priority and avoid race conditions
- If you call `init()` multiple times, only the LAST `primaryScrollSelector` will be active
- To change primary container dynamically, call `destroy()` then `init()` with new selector
- Calling `init()` does NOT clear previously detected containers unless `destroy()` is called first

## Compatibility

- **Runtime**: Modern browsers (Chrome 60+, Firefox 55+, Safari 12+)
- **Module formats**: ESM, CommonJS
- **TypeScript**: Full type definitions included
- **Frameworks**: React, Vue, Angular, Svelte, vanilla JS

## Debug

Enable QA mode: `?tlog_mode=qa` URL parameter

```typescript
tracelog.init();
console.log(tracelog.isInitialized()); // true
```

## Error Handling & Event Persistence

TraceLog uses a hybrid sendBeacon/fetch strategy with intelligent error handling:

### Send Strategy

- **Async events (normal operation)**: Uses `fetch` with full HTTP error detection
  - Detects 4xx/5xx errors and handles them appropriately
  - Returns detailed error information for debugging

- **Sync events (page unload, session end)**: Uses `sendBeacon` for guaranteed delivery
  - Browser queues the request even if the page is closing
  - No HTTP error feedback available (limitation of sendBeacon API)

### Error Handling

- **Permanent errors (4xx)**: Events are discarded immediately
  - `400 Bad Request`, `403 Forbidden`, `404 Not Found` → No persistence, no retry
  - Prevents infinite retry loops for configuration issues (e.g., excluded IPs, invalid projects)
  - Throttled logging (1 log per status code per minute) to prevent console spam

- **Temporary errors (5xx, network failures)**: Events persist in localStorage
  - `500`, `502`, `503`, `504` → Events saved for recovery on next page load
  - Network failures → Events persist and recover automatically
  - **No automatic in-session retries** to avoid performance impact and battery drain
  - Recovery attempted on next page load via `recoverPersistedEvents()`

- **Event expiry**: Persisted events expire after 2 hours to prevent stale data recovery

See [SenderManager docs](./src/managers/README.md#sendermanager) for complete error handling details.

### sendBeacon Limitations

When using `sendBeacon` (page unload scenarios):
- Browser only returns `true` (queued) or `false` (rejected)
- No visibility into HTTP response codes (403, 500, etc.)
- Events failing server-side validation won't be detected
- Accepted events are persisted as fallback and cleared on next successful session

## Troubleshooting

- **Session issues**: Check localStorage availability and session timeout. See [SessionManager docs](./src/managers/README.md#sessionmanager)
- **Memory usage**: Reduce `sessionTimeout`, lower `samplingRate`, call `destroy()` on cleanup
- **Events not sending**:
  - Check browser console for `PermanentError` logs indicating 4xx errors
  - Verify integration configuration (`projectId` or `collectApiUrl`)
  - Check network tab for failed requests to `/collect` endpoint
- **Rate limiting**: If events are being dropped, check console for rate limit warnings (200 events/second max)
- **Scroll detection issues**: Use `primaryScrollSelector` to manually specify main content container
- **CI failures**: Verify Playwright installation and Node.js ≥20

**Detailed troubleshooting guides:**
- [Handlers troubleshooting](./src/handlers/README.md) - Event capture issues
- [Managers troubleshooting](./src/managers/README.md) - State, storage, and network issues

## Development & Contributing

### Development Setup
```bash
git clone https://github.com/nacorga/tracelog-lib.git
cd tracelog-lib
npm install
npm run build:all      # Build ESM + CJS + Browser
npm run check          # Lint + format check
npm run test:e2e       # Run E2E tests
npm run test:unit      # Run unit tests
npm run test:coverage  # Run tests with coverage
```

### Workflow

1. Create feature branch
2. Submit PR to `main`
3. CI validates: security, quality, build, tests
4. Merge after approval
5. Release via GitHub Actions

## Testing

```bash
npm run docs:dev  # Demo at localhost:3000
npm run test:unit                           # Unit tests
npm run test:e2e                            # E2E tests
```

## Security & Privacy

TraceLog is designed with **privacy-first** principles. Key security guarantees:

### ✅ What We Protect

- **Input Value Protection**: NEVER captures values from `<input>`, `<textarea>`, or `<select>` elements
- **PII Sanitization**: Automatically redacts emails, phone numbers, credit cards, and API keys from error messages and click text
- **Default URL Filtering**: Removes sensitive query parameters (`token`, `auth`, `key`, `session`, `email`, `password`, etc.)
- **Client-Side Controls**: All validation, sampling, and deduplication happen in the browser
- **XSS Protection**: All metadata is sanitized against common XSS patterns

### 🛡️ Tools for You

- **`data-tlog-ignore` Attribute**: Exclude sensitive UI elements from tracking
  ```html
  <!-- Payment form - completely ignored -->
  <div data-tlog-ignore>
    <input type="text" name="card_number">
    <button>Pay Now</button>
  </div>
  ```

- **Custom URL Parameters**: Extend default filtering with your own sensitive params
  ```typescript
  await tracelog.init({
    sensitiveQueryParams: ['affiliate_id', 'promo_code'] // Merged with defaults
  });
  ```

- **Conditional Sampling**: Adjust tracking based on user consent level
  ```typescript
  const samplingRate = userConsent === 'full' ? 1.0 : 0.1;
  await tracelog.init({ samplingRate });
  ```

### 📋 Your Responsibilities

- **GDPR Consent**: Initialize TraceLog ONLY after user consent, call `destroy()` on revoke
- **Custom Event Data**: Sanitize PII before sending via `tracelog.event()`
- **Sensitive Elements**: Mark admin/payment UI with `data-tlog-ignore`

**📚 Read the full security guide:** [SECURITY.md](./SECURITY.md)

---

## License

MIT © TraceLog. See [LICENSE](LICENSE) file for details.

## Acknowledgments

Built with [web-vitals](https://github.com/GoogleChrome/web-vitals) for performance metrics. Inspired by privacy-first analytics tools and modern web standards for user behavior tracking.