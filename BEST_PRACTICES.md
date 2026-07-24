# Best Practices Guide

Quick reference for common patterns, pitfalls, and best practices when using TraceLog.

---

## Initialization

### ✅ DO: Follow the recommended initialization order

Register listeners **before** calling `init()` to ensure initial events (`SESSION_START`, `PAGE_VIEW`) are captured.

```typescript
// STEP 1: Register event listeners FIRST
tracelog.on('event', (event) => {
  console.log('Event captured:', event.type);
});

tracelog.on('queue', (batch) => {
  console.log('Batch ready:', batch.events.length);
});

// STEP 2: Identify the user (optional — can be called before or after init)
tracelog.identify('cust_123', { plan: 'pro' });

// STEP 3: Initialize (starts tracking immediately)
await tracelog.init({
  integrations: { tracelog: { projectId: 'your-project-id' } },
});

// STEP 4: Send custom events
tracelog.event('app_ready', { timestamp: Date.now() });
```

**Why this order matters:**

- `SESSION_START` and `PAGE_VIEW` fire **immediately** during `init()`
- Listeners registered after `init()` will miss these initial events
- Custom events sent before `init()` will throw errors

### ✅ DO: Initialize in browser-only lifecycle hooks

```typescript
// Angular
export class AppComponent implements OnInit {
  ngOnInit() {
    if (typeof window !== 'undefined') {
      tracelog.init();
    }
  }
}

// React
useEffect(() => {
  tracelog.init();
}, []);

// Vue
onMounted(() => {
  tracelog.init();
});
```

### ❌ DON'T: Initialize multiple times

```typescript
// BAD — second call is a no-op but indicates a code-organization issue
await tracelog.init();
await tracelog.init();

// GOOD — check first if you're not sure who else might call init()
if (!tracelog.isInitialized()) {
  await tracelog.init();
}
```

---

## Custom Events

### ✅ DO: Use semantic event names

```typescript
// GOOD — clear, descriptive
tracelog.event('checkout_completed', { amount: 99.99 });
tracelog.event('video_played', { videoId: 'abc-123', duration: 120 });
tracelog.event('search_performed', { query: 'analytics' });

// BAD — vague
tracelog.event('click', {});
tracelog.event('event1', {});
```

### ✅ DO: Keep metadata flat and simple

```typescript
// GOOD
tracelog.event('product_viewed', {
  productId: 'abc-123',
  category: 'electronics',
  price: 299.99,
});

// BAD — deeply nested for no reason
tracelog.event('product_viewed', {
  product: { details: { info: { id: 'abc-123' } } },
});
```

### ❌ DON'T: Send PII in custom events

```typescript
// BAD — violates privacy
tracelog.event('signup', {
  email: 'user@example.com',
  phone: '+1234567890',
  address: '123 Main St',
});

// GOOD — use hashed/anonymized IDs
import { SHA256 } from 'crypto-js';

const userIdHash = SHA256('user@example.com' + 'your-salt').toString();
tracelog.event('signup', {
  userId: userIdHash,
  plan: 'premium',
  source: 'landing_page',
});
```

### ✅ DO: Mark events as critical when they precede a navigation

For high-value events that fire right before a page unload (purchase confirmation that redirects to a thank-you page, signup that redirects to onboarding, etc.) pass `{ critical: true }`. The library flushes the queue via `navigator.sendBeacon()` synchronously, which the browser guarantees to deliver even if the page is closing immediately after.

If an asynchronous send is in flight when the critical event is tracked, the sync flush is deferred and re-runs from the in-flight send's `finally` block — the critical event is never stranded in the queue waiting for the next periodic tick.

```typescript
// GOOD — sendBeacon survives the navigation
tracelog.event('purchase_completed', { orderId: 'ord-789', total: 599.98 }, { critical: true });
window.location.href = '/thanks';

// BAD — async fetch is cancelled by the navigation
tracelog.event('purchase_completed', { orderId: 'ord-789', total: 599.98 });
window.location.href = '/thanks'; // Event likely lost
```

**Caveats:** `sendBeacon` is capped at 64 KB per request. Oversized payloads are persisted to `localStorage` and recovered on the next `init()` via the idempotency token — relevant only if the same user returns to the same origin.

**When NOT to mark critical:** events that don't immediately precede a navigation (mid-funnel `add_to_cart`, page views, web vitals, etc.) — the default batched send (`sendIntervalMs`) plus auto-flush on `pagehide` / `visibilitychange` already covers them.

### ✅ DO: Opt in to SPA flush when you need sub-`sendIntervalMs` delivery

SPA-navigation auto-flush is opt-in (`flushOnSpaNavigation`, default `false`) to avoid amplifying request volume on SPA-heavy apps. If a specific flow needs delivery between route changes that's faster than `sendIntervalMs` (e.g. step-by-step funnels you analyze in near-real-time), enable the flag globally:

```typescript
await tracelog.init({
  flushOnSpaNavigation: true,
  integrations: { tracelog: { projectId: '...' } },
});
```

For per-event guarantees right before a route teardown, prefer `{ critical: true }` on the event itself (see above).

---

## Mobile platforms

### iOS Safari often skips `pagehide` / `beforeunload`

When the OS backgrounds, freezes, or terminates an iOS Safari tab, the unload events the library normally relies on may never fire. To cover this, the library also flushes on `visibilitychange` when `document.hidden` becomes `true` (covers tab switch, lock screen, app backgrounding). This is gated by:

```typescript
await tracelog.init({
  flushOnPageHidden: true, // default
});
```

Set to `false` only if you want to control flush timing manually — the default is the safe choice for almost every consumer.

### Mobile networks lose async fetches mid-suspension

When the OS suspends a backgrounded tab, an in-flight `fetch()` can be aborted before its body reaches the network. `sendBeacon` is queued by the browser and survives suspension, which is why the visibility-hide / `pagehide` / `beforeunload` flush paths all use the sync `sendBeacon` path. For conversion-critical events that immediately precede a navigation, also pass `{ critical: true }` (see above) so the conversion is delivered before the OS gets a chance to suspend you.

**`sendBeacon` caveats apply to the visibility-hide flush too:**

- **64 KB cap per request.** If the in-memory queue is heavy when the tab backgrounds, the oversized batch is persisted to `localStorage` and only re-sent on the next `init()`. If you emit large per-event metadata, sample heavier event types or shorten `sendIntervalMs` so the queue stays small.
- **No retry.** Visibility-hide is one-shot. Transient network failures fall through to the localStorage recovery path.

### Don't rely on `beforeunload` alone

`beforeunload` has been deprecated or restricted by every major browser at some point. The library wires it as a belt-and-braces fallback alongside `pagehide` and `visibilitychange`. If you're building your own unload handler, prefer `pagehide` + `visibilitychange` (`document.hidden === true`) over `beforeunload`.

---

## Event Listeners

### ✅ DO: Unsubscribe when the component unmounts

```typescript
// React
useEffect(() => {
  const handler = (event) => console.log(event);
  tracelog.on('event', handler);

  return () => {
    tracelog.off('event', handler);
  };
}, []);

// Angular
export class AnalyticsComponent implements OnDestroy {
  private handler = (event) => console.log(event);

  ngOnInit() {
    tracelog.on('event', this.handler);
  }

  ngOnDestroy() {
    tracelog.off('event', this.handler);
  }
}
```

### ✅ DO: Filter events efficiently

```typescript
// GOOD — check type first
tracelog.on('event', (event) => {
  if (event.type === 'custom') {
    const { name } = event.custom_event;
    if (name === 'purchase') {
      sendToBackend(event);
    }
  }
});

// BAD — heavy processing on every event
tracelog.on('event', (event) => {
  JSON.stringify(event);
  localStorage.setItem('last_event', JSON.stringify(event));
});
```

### ✅ DO: Fan out events to additional destinations via listeners

Standalone mode and the `'queue'` listener are the supported way to deliver events to destinations TraceLog doesn't natively support:

```typescript
tracelog.on('queue', (batch) => {
  fetch('https://warehouse.example.com/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(batch),
  });
});
```

---

## User Consent & Privacy

### ✅ DO: Obtain user consent BEFORE initialization

TraceLog requires you to manage user consent externally. Only call `init()` after obtaining explicit user consent:

```typescript
const userConsent = await showCookieBanner();

if (userConsent.analytics) {
  await tracelog.init({
    integrations: { tracelog: { projectId: 'your-project-id' } },
  });
} else {
  console.log('User declined tracking — TraceLog not initialized');
}
```

### ✅ DO: Handle consent revocation

```typescript
function handleConsentRevoke() {
  tracelog.destroy();
  localStorage.clear();
  sessionStorage.clear();
}
```

### ✅ DO: Respect sensitive data boundaries

Mark sensitive areas with `data-tlog-ignore`:

```html
<div data-tlog-ignore>
  <input type="password" name="password">
  <input type="text" name="credit_card">
</div>
```

### ✅ DO: Filter sensitive URL parameters

Extend the default sensitive query params list:

```typescript
await tracelog.init({
  sensitiveQueryParams: [
    'auth_token',
    'api_key',
    'reset_token',
    // Merged with the 19-param default list (token, auth, key, password, etc.)
  ],
});
```

### ❌ DON'T: Pass PII in custom events

You are responsible for sanitizing metadata passed to `tracelog.event()`. The built-in PII sanitizer only redacts free-form text in click events and error messages — it does not inspect custom-event metadata.

```typescript
// BAD
tracelog.event('purchase', {
  email: 'user@example.com',
  phone: '+1-555-123-4567',
});

// GOOD
tracelog.event('purchase', {
  userId: 'usr_abc123',
  amount: 99.99,
  currency: 'USD',
});
```

---

## Performance

### ✅ DO: Sample for high-traffic sites

```typescript
await tracelog.init({
  samplingRate: 0.1,    // Track 10% of users
  errorSampling: 0.5,   // Track 50% of errors
});
```

### ✅ DO: Leave Web Vitals on the default `'all'` mode

Metrics are consolidated into one event per navigation (not one per metric), so capturing
every value — including good ones — costs a fraction of what naive per-metric capture would.
Filtering to `'needs-improvement'` or `'poor'` censors the sample at the source: the server can
no longer distinguish a truncated sample from a complete one, and derived statistics (p75,
the good/needs-improvement/poor split) become conditional on "given the metric was already
bad". Only opt into a narrower mode if you've deliberately decided to trade that away for less
ingest and you don't need a true good/poor split.

```typescript
// Default — uncensored, full statistical fidelity
await tracelog.init({ webVitalsMode: 'all' });

// Opt-in narrowing: only report metrics that need improvement or are poor
await tracelog.init({ webVitalsMode: 'needs-improvement' });

// Custom thresholds for fine-grained control
await tracelog.init({
  webVitalsMode: 'all',
  webVitalsThresholds: { LCP: 3000, INP: 150 },
});
```

### ❌ DON'T: Re-implement automatic tracking

```typescript
// BAD — scroll tracking is handled automatically
window.addEventListener('scroll', () => {
  tracelog.event('scroll', { y: window.scrollY });
});

// GOOD — use the built-in handler
await tracelog.init();
```

---

## Error Handling

### ✅ DO: Test error tracking in development

```typescript
if (import.meta.env.DEV) {
  window.testTraceLogError = () => {
    throw new Error('Test error for TraceLog');
  };
}

// In DevTools: testTraceLogError()
```

### ✅ DO: Tune error sampling per environment

```typescript
// Production — reduce noise
await tracelog.init({ errorSampling: 0.1 });

// Staging — higher sampling
await tracelog.init({ errorSampling: 1.0 });
```

---

## Integration Modes

### ✅ DO: Choose the right integration

```typescript
// 1. Standalone (no backend) — fan out via listeners to your own destination
await tracelog.init();

tracelog.on('event', (event) => {
  myAnalytics.process(event);
});

// 2. TraceLog SaaS — managed platform
await tracelog.init({
  integrations: { tracelog: { projectId: 'project-id' } },
});
```

### ✅ DO: Stitch external pixels via `getUserId()`

When firing events from contexts outside the SDK (for example a Shopify Web Pixel running in the checkout iframe), use `getUserId()` to retrieve the visitor UUID and propagate it to that context as an attribute, header, or query param. For Shopify storefronts specifically, set `integrations.tracelog.shopify: true` and the library wires the cart-attribute write automatically.

```typescript
await tracelog.init({
  integrations: { tracelog: { projectId: 'project-id', shopify: true } },
});

// Or manually for non-Shopify integrations
const userId = tracelog.getUserId();
if (userId) {
  document.cookie = `tracelog_user_id=${userId}; path=/; SameSite=Lax`;
}
```

---

## Testing & QA

### ✅ DO: Use QA mode for debugging

```text
?tlog_mode=qa       # Enable (persists in sessionStorage for the tab)
?tlog_mode=qa_off   # Disable
```

In QA mode, custom events are:

- Logged to the console with their name and metadata
- Validated strictly (invalid payloads throw instead of being silently dropped)
- Still emitted via `tracelog.on('event', ...)` for local testing

Auto-captured events (clicks, scrolls, page views, web vitals, errors) continue to be sent to the backend normally.

### ✅ DO: Verify events in DevTools

```typescript
tracelog.on('event', console.log);

tracelog.on('queue', (batch) => {
  console.log('Queued:', batch.events.length, 'events');
});

// DevTools → Network → filter "collect"
```

### ✅ DO: Test cross-tab behavior

```typescript
// Tab 1
await tracelog.init();
console.log('Session ID:', tracelog.getSessionId());

// Tab 2 — should receive the same session ID via BroadcastChannel
await tracelog.init();
console.log('Session ID:', tracelog.getSessionId());
```

---

## Session Management

### ✅ DO: Configure an appropriate timeout

```typescript
await tracelog.init({
  sessionTimeout: 900000,   // 15 minutes (default)
  // sessionTimeout: 1800000  // 30 minutes (longer sessions)
  // sessionTimeout: 300000   // 5 minutes (strict)
});
```

### ✅ DO: Reset identity on logout

```typescript
async function handleLogout() {
  await tracelog.resetIdentity();
  // Flushes pending events under the old identity, regenerates the UUID,
  // and starts a new session.
}
```

`destroy()` is for permanent teardown (consent revoke, component unmount). `resetIdentity()` is for logout flows where you want to keep tracking the next visitor on the same browser anonymously.

---

## Common Pitfalls

### ❌ AVOID: Blocking the main thread

```typescript
// BAD — synchronous processing
tracelog.on('event', (event) => {
  for (let i = 0; i < 1_000_000; i++) {
    // Heavy computation blocks UI
  }
});

// GOOD — async processing
tracelog.on('event', async (event) => {
  await processEventAsync(event);
});
```

### ❌ AVOID: Memory leaks in SPAs

```typescript
// BAD — listener never removed
export class MyComponent {
  constructor() {
    tracelog.on('event', (event) => this.handleEvent(event));
  }
}

// GOOD — cleanup on destroy
export class MyComponent {
  private handler = (event) => this.handleEvent(event);

  constructor() {
    tracelog.on('event', this.handler);
  }

  destroy() {
    tracelog.off('event', this.handler);
  }
}
```

### ❌ AVOID: Excessive custom events

```typescript
// BAD — tracking every keystroke
document.addEventListener('keydown', (e) => {
  tracelog.event('keydown', { key: e.key });
});

// GOOD — track meaningful interactions
document.querySelector('.search-form').addEventListener('submit', (e) => {
  tracelog.event('search_submitted', { query: e.target.query.value });
});
```

---

## Pre-Production Checklist

Before deploying to production:

- [ ] Consent flow implemented (init only after consent)
- [ ] `data-tlog-ignore` on payment / admin / sensitive UI areas
- [ ] No PII in custom-event metadata
- [ ] Sensitive URL params configured for your app
- [ ] Sampling rates appropriate for traffic volume
- [ ] Event listeners cleaned up on unmount
- [ ] QA mode tested (`?tlog_mode=qa`)
- [ ] Network requests verified (DevTools → Network → "collect")
- [ ] Privacy policy updated
- [ ] Cookie banner includes TraceLog

---

## Performance Benchmarks

Expected impact on your application:

| Metric                  | Impact                                                  |
|-------------------------|---------------------------------------------------------|
| **Bundle size**         | ~62 KB gzipped                                          |
| **Init time**           | <10 ms                                                  |
| **Event capture**       | ~1 ms per event (includes dedup + ID generation)        |
| **Memory usage**        | ~500 KB (queue + session state)                         |
| **Network requests**    | 1 per 10 seconds OR 50 events (batched)                 |
| **Event ID generation** | <1 ms with zero-collision guarantees (sequence counter) |

**Optimization tips:**

- Use `samplingRate` to reduce backend load (note: `WEB_VITALS` is exempt from `samplingRate` by
  design — a merchant's sampling rate must never silently thin the Core Web Vitals sample)
- Web Vitals are already consolidated into one event per navigation — only narrow
  `webVitalsMode` below the default `'all'` if you've deliberately decided to trade sample
  completeness for less ingest
- Always clean up listeners in SPAs to prevent memory leaks
- Avoid heavy synchronous work in `'event'` callbacks

---

## Additional Resources

- [README.md](./README.md) — API reference and quick start
- [API_REFERENCE.md](./API_REFERENCE.md) — full method and config reference
- [SECURITY.md](./SECURITY.md) — privacy and security guide
- [Handlers README](./src/handlers/README.md) — event handler details
- [Managers README](./src/managers/README.md) — core component details

---

**License:** MIT
