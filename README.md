# TraceLog

Lightweight web analytics library for tracking user behavior. Works standalone or with the TraceLog SaaS backend.

## Features

- **Zero-config** — Auto-captures clicks, scrolls, page views, sessions, performance metrics, and JavaScript errors
- **Standalone-first** — Works without any backend; opt in to TraceLog SaaS by passing a `projectId`
- **Privacy-first** — PII sanitization, client-side sampling, `data-tlog-ignore` attribute, sensitive URL param stripping
- **Cross-tab sessions** — BroadcastChannel sync with localStorage + sessionStorage recovery
- **Event-driven** — Subscribe via `on()` / `off()` for real-time consumption
- **Lightweight** — Single dependency (`web-vitals`), ~62KB gzipped

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
const { sessionId } = await tracelog.init();
console.log('Session:', sessionId);

// With TraceLog SaaS
const { sessionId } = await tracelog.init({
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

---

## Quick Start

### Initialization Order

Set up listeners **before** calling `init()` so they receive the initial `SESSION_START` and `PAGE_VIEW` events that fire during init.

```typescript
// 1. Obtain user consent first (your responsibility — see "User Consent" below)
const hasConsent = await getUserConsent();
if (!hasConsent) return;

// 2. Register listeners (before init)
tracelog.on('event', (event) => {
  console.log(event.type, event);
});

// 3. Identify the user (optional — can be called before or after init)
tracelog.identify('cust_123', { name: 'Maria Garcia', plan: 'pro' });

// 4. Initialize (starts tracking immediately)
const { sessionId } = await tracelog.init({
  integrations: {
    tracelog: { projectId: 'your-project-id' }
  }
});

// 5. Track custom events at any point after init
tracelog.event('button_clicked', { buttonId: 'signup-cta', source: 'homepage' });

// 6. On logout: reset identity (clears identity, regenerates UUID, opens a new session)
await tracelog.resetIdentity();

// 7. Cleanup on consent revoke or app unmount
tracelog.destroy();
```

**Auto-captured events** (no code required):

- Page views & navigation (including SPA route changes)
- Click interactions
- Scroll behavior
- User sessions
- Web Vitals (LCP, INP, CLS, FCP, TTFB)
- JavaScript errors & unhandled promise rejections

---

## Core API

| Method | Description |
|--------|-------------|
| `init(config?)` | Initialize tracking. Returns `Promise<{ sessionId }>`. See [Configuration](#configuration). |
| `event(name, metadata?, options?)` | Track a custom event. `options.critical: true` drains the queue via `sendBeacon` right after tracking, so the batch (the critical event + anything already queued) survives an imminent navigation. Subject to `sendBeacon`'s 64KB cap — oversized batches are persisted to `localStorage` and recovered on next `init()` via their idempotency token; the backend deduplicates by `event.id`. |
| `on(event, callback)` | Subscribe to events (`'event'` or `'queue'`). Local consumption — independent of backend sends. |
| `off(event, callback)` | Unsubscribe. Must pass the exact callback reference used in `on()`. |
| `identify(userId, traits?)` | Associate the current visitor with a known user identity. `traits` accepts a `Record<string, string>`; non-string values are dropped silently. |
| `resetIdentity()` | Flush pending events under the old identity, clear identity, regenerate the visitor UUID, and start a new session. Use for logout flows. |
| `isInitialized()` | `true` after a successful `init()`, `false` otherwise (including during teardown). |
| `getSessionId()` | Current session ID, or `null` if not initialized. |
| `getUserId()` | Current visitor UUID, or `null` if not initialized. |
| `destroy()` | Stop tracking, drain pending events via `sendBeacon`, and release all resources. |

**→ [Complete API Reference](./API_REFERENCE.md)**

---

## User Consent

TraceLog does not ship a consent manager. You are responsible for obtaining consent **before** calling `init()`.

```typescript
const userConsent = await showCookieBanner(); // Your consent solution

if (userConsent.analytics) {
  await tracelog.init({
    integrations: { tracelog: { projectId: 'your-project-id' } }
  });
} else {
  // User rejected — don't initialize
}

// If consent is revoked later
function handleConsentRevoke() {
  tracelog.destroy();
  localStorage.clear();
}
```

---

## Configuration

All configuration is optional. TraceLog works out-of-the-box with sensible defaults.

```typescript
await tracelog.init({
  // Session
  sessionTimeout: 900000,           // 15 min (default)

  // Privacy
  samplingRate: 1.0,                // 100% (default)
  errorSampling: 1.0,               // 100% (default)
  sensitiveQueryParams: ['token'],  // Added to the 15-param default deny-list

  // Throttles
  pageViewThrottleMs: 1000,         // Min interval between page_view events
  clickThrottleMs: 300,             // Min interval between click events per element
  maxSameEventPerMinute: 60,        // Per-name custom-event rate cap

  // Batch flush
  sendIntervalMs: 10000,            // Default batch interval
  flushOnSpaNavigation: false,      // Opt-in: flush after pushState / replaceState / popstate / hashchange
  flushOnPageHidden: true,          // Flush when document.hidden becomes true (mobile Safari coverage)

  // Web Vitals
  webVitalsMode: 'needs-improvement', // 'all' | 'needs-improvement' | 'poor'
  webVitalsThresholds: { LCP: 2500 }, // Optional per-metric overrides

  // Global metadata appended to every event
  globalMetadata: {
    env: 'production',
    version: '1.2.0',
    appName: 'MyApp'
  },

  // Integration (omit for standalone mode)
  integrations: {
    tracelog: {
      projectId: 'your-project-id',
      collectUrl: 'https://ingest.tracelog.io/p/your-project-id/collect', // Optional: explicit managed ingest endpoint
      shopify: false                // Optional: enable Shopify cart attribute linking
    }
  }
});
```

**→ [Full Configuration Reference](./API_REFERENCE.md#configuration)**

---

## Automatic Event Types

| Event Type      | What It Tracks                                  |
|-----------------|-------------------------------------------------|
| `page_view`     | Initial load, SPA route changes, hash changes   |
| `click`         | User interactions with elements                 |
| `session_start` | New session creation (server infers session end)|
| `scroll`        | Depth and direction per scrollable container    |
| `web_vitals`    | Core Web Vitals (LCP, INP, CLS, FCP, TTFB)      |
| `error`         | JavaScript errors, unhandled promise rejections |

**Custom events:**

```typescript
tracelog.event('purchase_completed', {
  orderId: 'ord-123',
  total: 99.99,
  currency: 'USD'
});

// Right before a navigation — guarantee delivery via sendBeacon
tracelog.event('purchase_completed', { orderId: 'ord-123' }, { critical: true });
window.location.href = '/thanks';
```

**→ [Event Types Reference](./API_REFERENCE.md#event-types)**

---

## Global Metadata

Set at `init()` time and attached to every event the library sends. Replace it by destroying and re-initializing TraceLog with a new config (typical at login / logout).

```typescript
await tracelog.init({
  globalMetadata: {
    env: 'production',
    version: '1.2.0',
    plan: user?.plan ?? 'anonymous'
  }
});
```

**Validation rules:**

- **Allowed types**: primitives (string, number, boolean), string arrays, nested objects (up to 10 levels)
- **Disallowed**: functions, symbols, `undefined`, circular references
- **Limits**: max 100 keys, 48 KB serialized size, 500 items per array, 1000 chars per string

**→ [Metadata Reference](./API_REFERENCE.md#globalmetadata)**

---

## Integration Modes

### 1. Standalone (no backend)

Default when no `integrations` are configured. Events are captured, queued, and emitted locally — no network requests.

```typescript
await tracelog.init();

tracelog.on('event', (event) => {
  myAnalytics.track(event);
});

tracelog.on('queue', (batch) => {
  console.log('Batched events:', batch.events.length);
});
```

Perfect for custom analytics pipelines, testing, or privacy-focused implementations where you want to ship events to your own destination via a listener.

### 2. TraceLog SaaS

```typescript
await tracelog.init({
  integrations: {
    tracelog: {
      projectId: 'your-project-id',
      collectUrl: 'https://ingest.tracelog.io/p/your-project-id/collect' // recommended
    }
  }
});
```

**`collectUrl` (recommended).** Optional HTTPS URL that explicitly sets the managed ingest endpoint. When present, the library uses it verbatim and skips both the CNAME-derived URL and the `localhost`/raw-IP restriction. The TraceLog dashboard surfaces the recommended value in the install snippet, so most users get it for free.

**Domain requirement (CNAME fallback).** When `collectUrl` is omitted, the SaaS endpoint is derived from the host page's domain (`https://{projectId}.{rootDomain}/collect`), so `init()` rejects when called from `localhost` or a raw IP address. For local development, omit `integrations.tracelog` to run in standalone mode, or test against a staging domain mapped via `/etc/hosts`.

**→ [Integration Reference](./API_REFERENCE.md#integration-configuration)**

---

## Error Handling & Reliability

### Automatic retry strategy

**Transient errors** (5xx, timeouts, network failures):

- Up to 2 retry attempts (3 total)
- Exponential backoff with jitter (200–300 ms, 400–500 ms)
- Persisted to `localStorage` after exhaustion for next-page recovery

**Rate limit (429):**

- No in-session retries — arms a 60-second cooldown instead
- Cooldown is mirrored to `localStorage` and shared across tabs/windows on the same origin (prevents every fresh page load from hammering the server during its 429 window)
- Events are persisted immediately and retried once the cooldown elapses
- The backend deduplicates retries via the batch idempotency token

**Permanent errors** (4xx except 408, 429):

- No retries — events are discarded
- 408 Request Timeout is treated as transient

### Error classification

| Status                | Type        | Retries          | Persistence       |
|-----------------------|-------------|------------------|-------------------|
| **2xx**               | Success     | None             | Cleared           |
| **4xx** (except 408/429) | Permanent | ❌ None          | ❌ Discarded      |
| **408**               | Transient   | ✅ Up to 2       | ✅ After exhaustion |
| **429**               | Rate Limit  | ❌ None (60s cooldown, shared across tabs) | ✅ Immediate |
| **5xx**               | Transient   | ✅ Up to 2       | ✅ After exhaustion |
| **Network error**     | Transient   | ✅ Up to 2       | ✅ After exhaustion |
| **Timeout**           | Transient   | ✅ Up to 2       | ✅ After exhaustion |

### Recovery on page load

Failed events are recovered automatically on the next `init()`:

```typescript
// Page 1: events fail to send (5xx after retries) → persisted with idempotency token
// Page 2: init() recovers and resends; backend deduplicates by idempotency token
```

Multi-tab protection: a 1-second window prevents two tabs from re-sending the same persisted batch simultaneously.

**Circuit breaker.** After `MAX_CONSECUTIVE_NETWORK_FAILURES` consecutive network-level failures (DNS, connection refused), the sender opens its circuit and skips further requests until `CIRCUIT_BREAKER_COOLDOWN_MS` elapses. A single probe request is then allowed (half-open state) before fully closing.

**→ [Full Error Handling Reference](./API_REFERENCE.md#error-handling)**

### Session continuity across external redirects

TraceLog preserves sessions across external redirects (payment processors, OAuth flows, etc.) with zero developer action. Session data is mirrored to `sessionStorage` alongside `localStorage`, so when a user returns from an external site and `localStorage` is empty, the session is recovered from `sessionStorage` transparently.

```typescript
// No special handling needed before redirect
window.location.href = paymentUrl;

// On the confirmation page, init() automatically recovers the session
const { sessionId } = await tracelog.init({ /* same config */ });
tracelog.event('purchase', { orderId: '12345', amount: 99.99 });
// Same session as before the redirect
```

- Automatic — no API calls or developer action required
- `sessionStorage` mirror survives same-tab navigation (cleared on tab close)
- Session timeout still applies (expired sessions are not recovered)

---

## Privacy & Security

TraceLog is privacy-first by design:

- ✅ **PII sanitization** — auto-redacts emails, phones, credit cards, IBANs, API keys, bearer tokens, and connection-string passwords from click text and error messages
- ✅ **Input protection** — never captures values from `<input>`, `<textarea>`, `<select>`
- ✅ **URL filtering** — removes 15 default sensitive query params (token, password, auth, secret, api_key, …) plus any you add via `sensitiveQueryParams`
- ✅ **Element exclusion** — use `data-tlog-ignore` on any container to exclude its contents from click tracking
- ✅ **Client-side controls** — sampling, dedup, and validation all happen in the browser

```html
<!-- Exclude sensitive forms entirely -->
<div data-tlog-ignore>
  <input type="password" name="password">
  <input type="text" name="credit_card">
</div>
```

**Your responsibilities:**

- Obtain user consent before calling `init()` (GDPR / CCPA / LOPD)
- Avoid PII in custom event metadata (TraceLog only sanitizes element text and error messages)
- Call `destroy()` on consent revoke

**→ [Complete Security Guide](./SECURITY.md)**

---

## QA Mode

QA mode logs custom events to the browser console so you can verify tracking implementation without inspecting the network tab.

### URL activation

```text
?tlog_mode=qa       # Enable (persists in sessionStorage for the tab)
?tlog_mode=qa_off   # Disable
```

**Effects in QA mode:**

- Custom events logged to console with their name and metadata
- Strict validation: invalid custom-event payloads throw instead of being silently dropped
- Persists across navigations within the same tab (cleared on tab close)

---

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

**SSR/SSG compatible** — safe to import in Angular Universal, Next.js, Nuxt, SvelteKit. All methods no-op in Node.js.

---

## Development

```bash
npm install              # Install dependencies
npm run build:all        # Build ESM + CJS + browser bundles
npm run check            # Lint + format validation
npm test                 # Run all tests
npm run test:coverage    # Generate coverage report
```

**→ [Contributing Guide](./CONTRIBUTING.md)**

---

## Documentation

| Document | Description |
|----------|-------------|
| **[API Reference](./API_REFERENCE.md)** | Complete API documentation: methods, config options, event types |
| **[Best Practices](./BEST_PRACTICES.md)** | Patterns, anti-patterns, optimization tips |
| **[Security Guide](./SECURITY.md)** | Privacy, GDPR compliance, security checklist |
| **[Changelog](./CHANGELOG.md)** | Release history |
| **[Handlers](./src/handlers/README.md)** | Event capture implementation details |
| **[Managers](./src/managers/README.md)** | Core component architecture |

---

## License

MIT © TraceLog
