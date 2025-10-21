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

### Initialization Order

**Important:** Set up listeners and transformers **before** calling `init()` to capture all events from the start:

```typescript
// 1. Register event listeners FIRST (before init)
tracelog.on('event', (event) => {
  console.log(event.type, event);
});

// 2. Configure transformers SECOND (if using custom backend)
tracelog.setTransformer('beforeSend', (event) => {
  // Transform events before they're queued
  return { ...event, custom_metadata: { app: 'v1' } };
});

// 3. Initialize LAST (starts tracking immediately)
await tracelog.init({
  integrations: {
    custom: { collectApiUrl: 'https://api.example.com' }
  }
});

// 4. Track custom events (after init)
tracelog.event('button_clicked', {
  buttonId: 'signup-cta',
  source: 'homepage'
});

// 5. Cleanup (on consent revoke or app unmount)
tracelog.destroy();
```

**Why this order?** Events like `SESSION_START` and `PAGE_VIEW` fire during initialization. Registering listeners and transformers first ensures you don't miss them.

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
| `setTransformer(hook, fn)` | Transform events before sending (see [Transformers](#transformers)) |
| `removeTransformer(hook)` | Remove a previously set transformer |
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

  // Integrations (pick one, multiple, or none)
  integrations: {
    tracelog: { projectId: 'your-id' },              // TraceLog SaaS
    custom: { collectApiUrl: 'https://api.com' },    // Custom backend
    google: {                                         // Google Analytics/GTM
      measurementId: 'G-XXXXXX',                     // GA4 measurement ID (optional)
      containerId: 'GTM-XXXXXXX'                      // GTM container ID (optional)
    },

    // Multi-integration: Send to multiple backends simultaneously
    // tracelog: { projectId: 'proj-123' },          // Analytics dashboard
    // custom: { collectApiUrl: 'https://warehouse.com' }  // Data warehouse
    // Events sent to BOTH independently with separate error handling
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

| Event Type        | What It Tracks                              | Can Disable?   |
|-------------------|---------------------------------------------|----------------|
| `page_view`       | Navigation, SPA route changes               | ❌ Core event  |
| `click`           | User interactions with elements             | ❌ Core event  |
| `session_start`   | New session creation                        | ❌ Core event  |
| `session_end`     | Session termination (timeout, page unload)  | ❌ Core event  |
| `scroll`          | Scroll depth, velocity, engagement          | ✅ Optional    |
| `web_vitals`      | Core Web Vitals (LCP, INP, CLS, FCP, TTFB) | ✅ Optional    |
| `error`           | JavaScript errors, promise rejections       | ✅ Optional    |
| `viewport_visible`| Element visibility (requires `viewport` config) | Via config |

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

## Transformers

Transform events dynamically at runtime before they're sent to integrations. Useful for adding custom logic, enrichment, or filtering.

**Important**: Transformers are **integration-specific** to protect TraceLog SaaS schema integrity:

| Integration | `beforeSend` | `beforeBatch` | Notes |
|-------------|--------------|---------------|-------|
| **TraceLog SaaS (only)** | ❌ Silently ignored | ❌ Silently ignored | Schema protection |
| **Custom Backend (only)** | ✅ Applied | ✅ Applied | Full control |
| **Multi-Integration** | ⚠️ Custom only | ⚠️ Custom only | SaaS gets original events, custom gets transformed |
| **Google Analytics** | ❌ N/A | ❌ N/A | Forwards `tracelog.event()` calls as-is |

**Multi-Integration Behavior:**
- When using both TraceLog SaaS + Custom backend simultaneously
- SaaS receives **original events** (transformers not applied)
- Custom backend receives **transformed events**
- Independent error handling and retry per integration

### Available Hooks

#### `beforeSend` - Per-Event Transformation

Transform individual events **before** deduplication, sampling, and queueing.

**Timing:**
- **Custom-only mode**: Runs in `EventManager.buildEventPayload()` (before dedup/sampling)
- **Multi-integration mode**: Runs in `SenderManager` per-integration (SaaS skipped)

```typescript
import { tracelog } from '@tracelog/lib';
import type { EventData, EventsQueue } from '@tracelog/lib';

// Add custom metadata to all events
tracelog.setTransformer('beforeSend', (data: EventData | EventsQueue) => {
  if ('type' in data) {
    return {
      ...data,
      custom_event: {
        ...data.custom_event,
        metadata: {
          ...data.custom_event?.metadata,
          environment: 'production',
          version: '1.0.0'
        }
      }
    };
  }
  return data;
});

// Filter out sensitive events
tracelog.setTransformer('beforeSend', (data) => {
  if ('type' in data && data.custom_event?.name === 'internal_event') {
    return null; // Event will be dropped
  }
  return data;
});
```

#### `beforeBatch` - Batch Transformation

Transform the entire batch before sending to backend. Runs once per batch (every 10s or 50 events).

```typescript
// Add batch-level metadata
tracelog.setTransformer('beforeBatch', (data) => {
  if ('events' in data) {
    return {
      ...data,
      global_metadata: {
        ...data.global_metadata,
        batchSize: data.events.length,
        batchTimestamp: Date.now()
      }
    };
  }
  return data;
});

// Filter batch based on conditions
tracelog.setTransformer('beforeBatch', (data) => {
  if ('events' in data && data.events.length < 5) {
    return null; // Don't send small batches
  }
  return data;
});
```

### Removing Transformers

```typescript
// Remove specific transformer
tracelog.removeTransformer('beforeSend');
tracelog.removeTransformer('beforeBatch');
```

### Error Handling & Validation

Transformers are designed to be resilient and flexible:

**Input Validation:**
- **Function type check**: `setTransformer()` throws error if `fn` is not a function
- **Example**: `tracelog.setTransformer('beforeSend', null)` → Throws `Error: [TraceLog] Transformer must be a function, received: object`

**Error Handling:**
- **Exceptions**: Caught and logged, original event/batch used
- **Invalid return**: Logged warning, original event/batch used
- **`null` return**: Event/batch filtered out (intended behavior)

**Validation:**
- **Minimal checks only**: `beforeSend` requires `'type'` field, `beforeBatch` requires `'events'` array
- **Custom schemas supported**: All other fields optional for maximum flexibility with custom backends
- **Use case**: Transform data to match your backend's schema (e.g., data warehouses, custom APIs)

```typescript
// Safe transformer - errors won't break tracking
tracelog.setTransformer('beforeSend', (data) => {
  try {
    // Complex transformation logic
    return transformData(data);
  } catch (error) {
    console.error('Transformer error:', error);
    return data; // Fallback to original
  }
});

// Custom schema example - completely reshape for your backend
tracelog.setTransformer('beforeSend', (data) => {
  if ('type' in data) {
    return {
      type: 'analytics_event',
      eventName: data.custom_event?.name,
      timestamp: Date.now(),
      // Your custom fields - TraceLog won't reject this!
      customField1: 'value',
      customField2: 123
    };
  }
  return data;
});
```

### Use Cases

**Data Enrichment:**
```typescript
tracelog.setTransformer('beforeSend', (data) => {
  if ('type' in data) {
    return {
      ...data,
      custom_event: {
        ...data.custom_event,
        metadata: {
          ...data.custom_event?.metadata,
          userId: getCurrentUserId(),
          sessionContext: getSessionContext()
        }
      }
    };
  }
  return data;
});
```

**Event Filtering:**
```typescript
// Filter out bot traffic
tracelog.setTransformer('beforeBatch', (data) => {
  if ('events' in data) {
    const filteredEvents = data.events.filter(
      event => !isBotUserAgent(navigator.userAgent)
    );
    return { ...data, events: filteredEvents };
  }
  return data;
});
```

**PII Sanitization (Custom Backend):**
```typescript
// Additional sanitization for custom backend
tracelog.setTransformer('beforeSend', (data) => {
  if ('type' in data && data.custom_event?.metadata) {
    const sanitized = { ...data.custom_event.metadata };
    delete sanitized.email;
    delete sanitized.phone;
    return {
      ...data,
      custom_event: {
        ...data.custom_event,
        metadata: sanitized
      }
    };
  }
  return data;
});
```

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

### 4. Google Analytics / Google Tag Manager
```typescript
// Option 1: GA4 only
await tracelog.init({
  integrations: {
    google: { measurementId: 'G-XXXXXX' }
  }
});

// Option 2: GTM only
await tracelog.init({
  integrations: {
    google: { containerId: 'GTM-XXXXXXX' }
  }
});

// Option 3: Both (GTM takes priority for script loading)
await tracelog.init({
  integrations: {
    google: {
      measurementId: 'G-XXXXXX',
      containerId: 'GTM-XXXXXXX'
    }
  }
});
```

**Supported formats:**
- **measurementId**: `G-XXXXXX` (GA4), `AW-XXXXXX` (Google Ads), `UA-XXXXXX` (Universal Analytics - legacy)
- **containerId**: `GTM-XXXXXX` (Google Tag Manager)

**Note:** TraceLog automatically detects the format and loads the appropriate script (gtag.js or gtm.js). If gtag/GTM is already loaded on your site, TraceLog will reuse the existing instance.

### 5. Multi-Integration (TraceLog SaaS + Custom Backend)
```typescript
await tracelog.init({
  integrations: {
    tracelog: { projectId: 'your-project-id' },           // Analytics dashboard
    custom: { collectApiUrl: 'https://warehouse.com' }    // Data warehouse
  }
});

// Events sent to BOTH endpoints independently
// - Independent error handling per integration
// - Independent retry/persistence per integration
// - Parallel sending (non-blocking)
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
