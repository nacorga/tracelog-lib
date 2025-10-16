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

[https://nacorga.github.io/tracelog-lib](https://nacorga.github.io/tracelog-lib)

---

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
// 1. Initialize (standalone mode - no backend required)
await tracelog.init();

// 2. Track custom events
tracelog.event('button_clicked', {
  buttonId: 'signup-cta',
  source: 'homepage'
});

// 3. Subscribe to events (real-time)
tracelog.on('event', (event) => {
  console.log(event.type, event);
});

// 4. Cleanup (on consent revoke or app unmount)
tracelog.destroy();
```

**That's it!** TraceLog now automatically tracks:
- Page views & navigation (including SPA routes)
- Click interactions
- Scroll behavior
- User sessions
- Web Vitals (LCP, INP, CLS, FCP, TTFB)
- JavaScript errors

---

## Core API

| Method | Description |
|--------|-------------|
| `init(config?)` | Initialize tracking (see [Configuration](#configuration)) |
| `event(name, metadata?)` | Track custom events |
| `on(event, callback)` | Subscribe to events (`'event'` or `'queue'`) |
| `off(event, callback)` | Unsubscribe from events |
| `isInitialized()` | Check initialization status |
| `setQaMode(enabled)` | Enable/disable QA mode (console logging) |
| `destroy()` | Stop tracking and cleanup |

**→ [Complete API Reference](./API_REFERENCE.md)**

---

## Configuration

All configuration is **optional**. TraceLog works out-of-the-box with sensible defaults.

```typescript
await tracelog.init({
  // Session
  sessionTimeout: 900000,  // 15 min (default)

  // Privacy
  samplingRate: 1.0,               // 100% (default)
  sensitiveQueryParams: ['token'], // Add to defaults

  // Event Control
  disabledEvents: ['scroll'],  // Disable specific auto-tracked events
                                // Options: 'scroll', 'web_vitals', 'error'

  // Integrations (pick one or none)
  integrations: {
    tracelog: { projectId: 'your-id' },              // TraceLog SaaS
    custom: { collectApiUrl: 'https://api.com' },    // Custom backend
    googleAnalytics: { measurementId: 'G-XXXXXX' }   // GA4 forwarding
  },

  // Web Vitals filtering
  webVitalsMode: 'needs-improvement',  // 'all' | 'needs-improvement' | 'poor'

  // Viewport tracking (element visibility)
  viewport: {
    elements: [{ selector: '.cta', id: 'hero-cta' }],
    threshold: 0.5,      // 50% visible
    minDwellTime: 1000   // 1 second
  }
});
```

**→ [Full Configuration Guide](./API_REFERENCE.md#configuration)**

---

## Automatic Event Types

TraceLog captures these events automatically (no code required):

| Event Type | What It Tracks | Can Disable? |
|------------|----------------|--------------|
| `PAGE_VIEW` | Navigation, SPA route changes | ❌ Core event |
| `CLICK` | User interactions with elements | ❌ Core event |
| `SESSION_START` | New session creation | ❌ Core event |
| `SESSION_END` | Session termination (timeout, page unload) | ❌ Core event |
| `SCROLL` | Scroll depth, velocity, engagement | ✅ Optional |
| `WEB_VITALS` | Core Web Vitals (LCP, INP, CLS, FCP, TTFB) | ✅ Optional |
| `ERROR` | JavaScript errors, promise rejections | ✅ Optional |
| `VIEWPORT_VISIBLE` | Element visibility (requires `viewport` config) | Via config |

**Disabling Optional Events:**

You can disable specific auto-tracked events to reduce data volume or improve performance:

```typescript
// Disable scroll tracking only
await tracelog.init({
  disabledEvents: ['scroll']
});

// Disable multiple event types
await tracelog.init({
  disabledEvents: ['scroll', 'web_vitals', 'error']
});
```

**Use Cases:**
- Reduce bandwidth and backend costs
- Already using Sentry/Datadog for errors
- Performance optimization on complex pages
- Minimize data collection for privacy compliance

**Custom Events:**
```typescript
tracelog.event('purchase_completed', {
  orderId: 'ord-123',
  total: 99.99,
  currency: 'USD'
});
```

**→ [Event Types Reference](./API_REFERENCE.md#event-types)**

---

## Integration Modes

TraceLog supports multiple integration modes. Choose what fits your needs:

### 1. Standalone (No Backend)
```typescript
await tracelog.init();

// Consume events locally
tracelog.on('event', (event) => {
  myAnalytics.track(event);
});
```

### 2. TraceLog SaaS
```typescript
await tracelog.init({
  integrations: {
    tracelog: { projectId: 'your-project-id' }
  }
});
```

### 3. Custom Backend
```typescript
await tracelog.init({
  integrations: {
    custom: {
      collectApiUrl: 'https://api.example.com/collect',
      allowHttp: false  // Only true for local testing
    }
  }
});
```

### 4. Google Analytics
```typescript
await tracelog.init({
  integrations: {
    googleAnalytics: { measurementId: 'G-XXXXXX' }
  }
});
```

**→ [Integration Setup Guide](./API_REFERENCE.md#integration-configuration)**

---

## Privacy & Security

TraceLog is **privacy-first** by design:

- ✅ **PII Sanitization** - Auto-redacts emails, phones, credit cards, API keys
- ✅ **Input Protection** - Never captures `<input>`, `<textarea>`, `<select>` values
- ✅ **URL Filtering** - Removes sensitive query params (15 defaults + custom)
- ✅ **Element Exclusion** - Use `data-tlog-ignore` to exclude sensitive areas
- ✅ **Client-Side Controls** - All sampling and validation happens in browser

**Example:**
```html
<!-- Exclude sensitive forms -->
<div data-tlog-ignore>
  <input type="password" name="password">
  <input type="text" name="credit_card">
</div>
```

**Your Responsibilities:**
- Get user consent before calling `init()` (GDPR/CCPA)
- Sanitize custom event metadata (avoid PII)
- Call `destroy()` on consent revoke

**→ [Complete Security Guide](./SECURITY.md)**

---

## QA Mode

Enable QA mode for debugging and development:

### URL Activation
```bash
# Enable
?tlog_mode=qa

# Disable
?tlog_mode=qa_off
```

### Programmatic API
```typescript
tracelog.setQaMode(true);   // Enable
tracelog.setQaMode(false);  // Disable
```

**Features:**
- Custom events logged to browser console
- Strict validation (throws errors instead of warnings)
- Session state visible in console
- Persistent across page reloads (sessionStorage)

**→ [QA Mode Documentation](./API_REFERENCE.md#setqamodeenabled-boolean-void)**

---

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

**SSR/SSG Compatible:** Safe to import in Angular Universal, Next.js, Nuxt, SvelteKit (no-ops in Node.js).

---

## Development

```bash
npm install              # Install dependencies
npm run build:all        # Build ESM + CJS + Browser bundles
npm run check            # Lint + format validation
npm run test             # Run all tests
npm run test:coverage    # Generate coverage report
```

**→ [Contributing Guide](./CONTRIBUTING.md)**

---

## Documentation

| Document | Description |
|----------|-------------|
| **[API Reference](./API_REFERENCE.md)** | Complete API documentation with all methods, config options, and event types |
| **[Best Practices](./BEST_PRACTICES.md)** | Patterns, anti-patterns, and optimization tips |
| **[Security Guide](./SECURITY.md)** | Privacy, GDPR compliance, and security best practices |
| **[Changelog](./CHANGELOG.md)** | Release history and migration guides |
| **[Handlers](./src/handlers/README.md)** | Event capture implementation details |
| **[Managers](./src/managers/README.md)** | Core component architecture |

---

## License

MIT © TraceLog
