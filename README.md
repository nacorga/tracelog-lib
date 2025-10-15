# TraceLog

Lightweight web analytics library for tracking user behavior. Works standalone or with optional backend integrations.

## Features

- **Zero-config** - Auto-captures clicks, scrolls, page views, sessions, and performance metrics
- **Standalone** - No backend required; optional integrations (TraceLog SaaS, custom API, GA4)
- **Privacy-first** - PII sanitization, client-side sampling, `data-tlog-ignore` attribute
- **Cross-tab sessions** - BroadcastChannel sync with localStorage recovery
- **Event-driven** - Subscribe via `on()`/`off()` for real-time events
- **Lightweight** - Single dependency (`web-vitals`), 15KB gzipped

## Live Demo

See TraceLog in action: [https://nacorga.github.io/tracelog-lib](https://nacorga.github.io/tracelog-lib)

## Installation

### NPM (Recommended)
```bash
npm install @tracelog/lib
```

```typescript
import { tracelog } from '@tracelog/lib';

// Standalone mode (no backend)
await tracelog.init();

// With TraceLog SaaS
await tracelog.init({
  integrations: {
    tracelog: { projectId: 'your-project-id' }
  }
});
```

### CDN (Script Tag)
```html
<script src="https://cdn.jsdelivr.net/npm/@tracelog/lib@latest/dist/browser/tracelog.js"></script>
<script>
  tracelog.init();
</script>
```

### CDN (ES Module)
```html
<script type="module">
  import { tracelog } from 'https://cdn.jsdelivr.net/npm/@tracelog/lib@latest/dist/browser/tracelog.esm.js';
  await tracelog.init();
</script>
```

## Quick Start

```typescript
// Basic initialization
await tracelog.init();

// Custom events
tracelog.event('product_viewed', {
  productId: 'abc-123',
  price: 299.99
});

// Subscribe to events
tracelog.on('event', (event) => {
  console.log(event.type, event);
});

// Cleanup
await tracelog.destroy();
```

## Configuration

```typescript
await tracelog.init({
  // Session
  sessionTimeout: 900000,          // 15 min (default)

  // Sampling
  samplingRate: 1.0,               // 100% (default)
  errorSampling: 1.0,              // 100% (default)

  // Privacy
  sensitiveQueryParams: ['token'], // Merged with defaults

  // Web Vitals filtering (controls which performance metrics are tracked)
  webVitalsMode: 'needs-improvement',  // 'all' | 'needs-improvement' | 'poor' (default: 'needs-improvement')
  webVitalsThresholds: {               // Optional: override default thresholds
    LCP: 3000,  // Custom threshold in milliseconds
    FCP: 2000
  },

  // Integrations
  integrations: {
    tracelog: { projectId: 'your-id' },
    custom: { collectApiUrl: 'https://api.example.com/collect' },
    googleAnalytics: { measurementId: 'G-XXXXXX' }
  },

  // Viewport tracking
  viewport: {
    elements: [
      { selector: '.cta-button', id: 'pricing-cta', name: 'Pricing CTA' }
    ],
    threshold: 0.5,      // 50% visible
    minDwellTime: 1000   // 1 second
  }
});
```

### Methods

- `init(config?)` - Initialize tracking
- `event(name, metadata?)` - Send custom event
- `on(event, callback)` - Subscribe to events
- `off(event, callback)` - Unsubscribe
- `destroy()` - Cleanup

## Event Types

All events include: `id`, `type`, `page_url`, `timestamp`, `sessionId`, `utm`

| Type | Data Fields |
|------|-------------|
| `PAGE_VIEW` | `page_view.{title, pathname, referrer}` |
| `CLICK` | `click_data.{x, y, tag, id, text, href}` |
| `SCROLL` | `scroll_data.{depth, direction, velocity, is_primary}` |
| `SESSION_START` | Session initialization |
| `SESSION_END` | `session_end_reason` |
| `CUSTOM` | `custom_event.{name, metadata}` |
| `WEB_VITALS` | `web_vitals.{type, value}` (LCP, CLS, INP, FCP, TTFB) |
| `ERROR` | `error_data.{type, message, filename, line}` |
| `VIEWPORT_VISIBLE` | `viewport_data.{selector, dwellTime, visibilityRatio}` |

## Examples

### Event Subscription
```typescript
// Register BEFORE init() to catch initial events
tracelog.on('event', (event) => {
  console.log(event.type, event);
});

tracelog.on('queue', (batch) => {
  console.log('Queued:', batch.events.length);
});

await tracelog.init();
```

### Privacy Controls
```typescript
// Exclude sensitive elements
<div data-tlog-ignore>
  <input type="password">
</div>

// Filter URL params
await tracelog.init({
  sensitiveQueryParams: ['affiliate_id', 'promo'],
  samplingRate: 0.5  // Track 50% of users
});
```

### Filter Primary Scroll
```typescript
tracelog.on('event', (event) => {
  if (event.type === 'scroll' && event.scroll_data.is_primary) {
    console.log('Main content scroll:', event.scroll_data.depth);
  }
});
```

### Web Vitals Filtering
```typescript
// Default: Track metrics needing improvement or worse (balanced approach)
await tracelog.init({
  webVitalsMode: 'needs-improvement'
});

// Track all metrics (for full trend analysis and P75 calculations)
await tracelog.init({
  webVitalsMode: 'all'
});

// Track only poor metrics (minimize data volume)
await tracelog.init({
  webVitalsMode: 'poor'
});

// Custom thresholds (fine-grained control)
await tracelog.init({
  webVitalsMode: 'needs-improvement',
  webVitalsThresholds: {
    LCP: 3000,  // Stricter than default 2500ms
    FCP: 2500,  // Stricter than default 1800ms
    CLS: 0.15   // Stricter than default 0.1
  }
});
```

**Threshold Reference (Core Web Vitals standards):**

| Metric | 'all' | 'needs-improvement' (default) | 'poor' |
|--------|-------|-------------------------------|--------|
| LCP | Track all | > 2500ms | > 4000ms |
| FCP | Track all | > 1800ms | > 3000ms |
| CLS | Track all | > 0.1 | > 0.25 |
| INP | Track all | > 200ms | > 500ms |
| TTFB | Track all | > 800ms | > 1800ms |

### Global Disable
```typescript
window.__traceLogDisabled = true;
```

## Privacy & Security

- **PII Sanitization** - Auto-redacts emails, phones, credit cards, API keys
- **Input Protection** - Never captures input/textarea/select values
- **URL Filtering** - Removes sensitive query params (token, auth, key, password, etc.)
- **Element Exclusion** - Use `data-tlog-ignore` attribute
- **Client-Side Controls** - All validation/sampling happens in browser

**Your Responsibilities:**
- Get user consent before calling `init()` (GDPR)
- Sanitize custom event metadata
- Call `destroy()` on consent revoke

[Full Security Guide →](./SECURITY.md)

## Error Handling & Reliability

TraceLog uses a **persistence-based recovery model** with no in-session retries:

- **Success (2xx)** - Events sent immediately, queue cleared
- **Permanent errors (4xx)** - Events discarded immediately (invalid data won't succeed on retry)
- **Temporary errors (5xx/network)** - Events removed from queue and persisted to localStorage
- **Recovery** - Persisted events automatically recovered and retried on next page load
- **Expiration** - Persisted events expire after 2 hours
- **Page unload** - Uses `sendBeacon()` for synchronous delivery of session end events

**Why no in-session retries?**
- Prevents infinite retry loops during API outages
- Reduces server load and network traffic during failures
- Better battery life on mobile devices
- Natural recovery on page navigation (common in SPAs)

## QA Mode

Enable QA mode for enhanced debugging and development experience.

### Activation via URL

```bash
# Activate QA mode
?tlog_mode=qa

# Deactivate QA mode
?tlog_mode=qa_off
```

### Programmatic API

```typescript
// Enable QA mode
tracelog.setQaMode(true);

// Disable QA mode
tracelog.setQaMode(false);
```

### Features

- ✅ **Console Logging**: All events logged to browser console
- ✅ **Strict Validation**: Errors thrown instead of silent failures
- ✅ **Detailed Errors**: Enhanced error messages for debugging
- ✅ **Session State**: Session info visible in console
- ✅ **Persistent**: State saved in sessionStorage across page reloads

### Example

```typescript
// Initialize TraceLog
await tracelog.init();

// Activate QA mode
tracelog.setQaMode(true);

// Send custom event (will be logged to console)
tracelog.event('button_click', { label: 'Subscribe' });

// Deactivate QA mode
tracelog.setQaMode(false);

// Check initialization
console.log(tracelog.isInitialized()); // true
```

## Development

```bash
npm install
npm run build:all      # ESM + CJS + Browser
npm run check          # Lint + format
npm run test           # All tests
npm run test:coverage  # With coverage
```

## Browser Support

Chrome 60+, Firefox 55+, Safari 12+, Edge 79+

## SSR/SSG Support

Safe to import in SSR frameworks (Angular Universal, Next.js, Nuxt, SvelteKit). All methods silently no-op in Node.js environments.

**Best practice**
Register listeners AFTER init() in browser-only lifecycle hooks.

## Documentation

- [Best Practices](./BEST_PRACTICES.md) - Best practices & common patterns
- [API Reference](./API_REFERENCE.md) - Complete API documentation
- [Handlers](./src/handlers/README.md) - Event capture implementation
- [Managers](./src/managers/README.md) - Core components
- [Security](./SECURITY.md) - Privacy & security guide
- [Changelog](./CHANGELOG.md) - Release history

## License

MIT © TraceLog
