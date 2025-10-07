# TraceLog Library

A lightweight TypeScript library for web analytics and user behavior tracking. Automatically captures clicks, scrolls, page views, and performance metrics with cross-tab session management and privacy-first design.

## Features

- **Zero-config tracking** - Automatically captures clicks, scrolls, page navigation, and web vitals out of the box.
- **Cross-tab session management** - Maintains consistent user sessions across multiple browser tabs with automatic recovery.
- **Client-only architecture** - Fully autonomous with optional backend integrations (TraceLog SaaS, custom API, Google Analytics).
- **Privacy-first** - Built-in PII sanitization and client-side sampling controls.
- **Framework agnostic** - Works with vanilla JS, React, Vue, Angular, or any web application.
- **Lightweight** - Only one dependency (`web-vitals`) with dual ESM/CJS support.
- **Event-driven** - Real-time event subscription with `on()` and `off()` methods for custom integrations.

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
tracelog.init({});

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
  tracelog.init({});

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

  await tracelog.init({}); // Standalone mode
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
    custom: { apiUrl: 'https://your-api.com/collect' }
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
- `sessionTimeout`: Session timeout in ms (default: 900000)
- `globalMetadata`: Metadata attached to all events
- `samplingRate`: Event sampling rate 0-1 (default: 1.0)
- `errorSampling`: Error sampling rate 0-1 (default: 1.0)
- `sensitiveQueryParams`: Query params to remove from URLs
- `scrollContainerSelectors`: Custom scroll containers
- `integrations`:
  - `tracelog.projectId`: TraceLog SaaS
  - `custom.apiUrl`: Custom backend
  - `custom.allowHttp`: Enable HTTP for testing
  - `googleAnalytics.measurementId`: GA4

## Event Data Structure

Each event contains a base structure with type-specific data:

**Base fields (all events):**
- `id`: Unique event identifier
- `type`: Event type (see below)
- `page_url`: Current page URL
- `timestamp`: Unix timestamp in milliseconds
- `referrer`: Document referrer (optional)
- `utm`: UTM parameters (source, medium, campaign, term, content)

**Event-specific data:**

- **`PAGE_VIEW`**: Navigation tracking
  - `page_view.title`: Page title
  - `page_view.pathname`: URL pathname
  - `page_view.search`: Query string
  - `page_view.hash`: URL hash

- **`CLICK`**: User interactions
  - `click_data.x/y`: Viewport coordinates
  - `click_data.relativeX/relativeY`: Element-relative position
  - `click_data.tag/id/class`: Element identifiers
  - `click_data.text/href/title`: Element content
  - `click_data.role/ariaLabel`: Accessibility attributes
  - `click_data.dataAttributes`: Data attributes

- **`SCROLL`**: Scroll engagement
  - `scroll_data.depth`: Scroll depth percentage (0-100)
  - `scroll_data.direction`: Scroll direction (up/down)

- **`SESSION_START`**: Session initialization
  - No additional data

- **`SESSION_END`**: Session termination
  - `session_end_reason`: Reason (timeout, manual, tab_close)

- **`CUSTOM`**: Business-specific events
  - `custom_event.name`: Event name
  - `custom_event.metadata`: Custom data (any JSON-serializable value)

- **`WEB_VITALS`**: Performance metrics
  - `web_vitals.type`: Metric type (LCP, CLS, INP, FCP, TTFB, LONG_TASK)
  - `web_vitals.value`: Metric value in milliseconds

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

await tracelog.init({});
```

**Note**: Listeners are buffered if registered before `init()`, ensuring you don't miss initial events.

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

## Compatibility

- **Runtime**: Modern browsers (Chrome 60+, Firefox 55+, Safari 12+)
- **Module formats**: ESM, CommonJS
- **TypeScript**: Full type definitions included
- **Frameworks**: React, Vue, Angular, Svelte, vanilla JS

## Debug

Enable QA mode: `?tlog_mode=qa` URL parameter

```typescript
tracelog.init({});
console.log(tracelog.isInitialized()); // true
```

## Troubleshooting

- **Session issues**: Check localStorage availability and session timeout
- **Memory usage**: Reduce `sessionTimeout`, lower `samplingRate`, call `destroy()` on cleanup
- **CI failures**: Verify Playwright installation and Node.js ≥20

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
npm run playground:setup && npm run serve  # Demo at localhost:3000
npm run test:unit                           # Unit tests
npm run test:e2e                            # E2E tests
```

## License

MIT © TraceLog. See [LICENSE](LICENSE) file for details.

## Acknowledgments

Built with [web-vitals](https://github.com/GoogleChrome/web-vitals) for performance metrics. Inspired by privacy-first analytics tools and modern web standards for user behavior tracking.