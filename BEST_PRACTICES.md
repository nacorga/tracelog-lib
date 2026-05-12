# Best Practices Guide

Quick reference for common patterns, pitfalls, and best practices when using TraceLog.

---

## Initialization

### ✅ DO: Follow the recommended initialization order

Set up listeners and transformers **before** calling `init()` to ensure no events are missed:

```typescript
// STEP 1: Register event listeners FIRST
tracelog.on('event', (event) => {
  console.log('Event captured:', event.type);
});

tracelog.on('queue', (batch) => {
  console.log('Batch ready:', batch.events.length);
});

// STEP 2: Configure transformers SECOND (if using custom backend)
tracelog.setTransformer('beforeSend', (event) => {
  if ('type' in event) {
    return {
      ...event,
      custom_event: {
        ...event.custom_event,
        metadata: {
          ...event.custom_event?.metadata,
          app_version: '1.0.0',
        },
      },
    };
  }
  return event;
});

// STEP 3: Initialize LAST (starts tracking immediately)
await tracelog.init({
  integrations: {
    custom: { collectApiUrl: 'https://api.example.com' },
  },
});

// STEP 4: Send custom events AFTER init
tracelog.event('app_ready', { timestamp: Date.now() });
```

**Why this order matters:**

- `SESSION_START` and `PAGE_VIEW` events fire **immediately** during `init()`
- Listeners registered after `init()` will miss these critical initial events
- Transformers set after `init()` won't transform initial events
- Custom events sent before `init()` will throw errors

### ✅ DO: Register listeners BEFORE init()

```typescript
// Listen for events BEFORE initialization to catch SESSION_START
tracelog.on('event', (event) => {
  console.log(event.type, event);
});

await tracelog.init();
```

### ✅ DO: Initialize in browser-only lifecycle

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
// BAD - causes duplicate events
await tracelog.init();
await tracelog.init(); // ❌ Second init

// GOOD - check first
if (!tracelog.isInitialized()) {
  await tracelog.init();
}
```

---

## Custom Events

### ✅ DO: Use semantic event names

```typescript
// GOOD - clear, descriptive
tracelog.event('checkout_completed', { amount: 99.99 });
tracelog.event('video_played', { videoId: 'abc-123', duration: 120 });
tracelog.event('search_performed', { query: 'analytics' });

// BAD - vague
tracelog.event('click', {}); // Too generic
tracelog.event('event1', {}); // Meaningless
```

### ✅ DO: Keep metadata flat and simple

```typescript
// GOOD
tracelog.event('product_viewed', {
  productId: 'abc-123',
  category: 'electronics',
  price: 299.99,
});

// BAD - deeply nested
tracelog.event('product_viewed', {
  product: {
    details: {
      info: {
        id: 'abc-123', // Too deep
      },
    },
  },
});
```

### ❌ DON'T: Send PII in custom events

```typescript
// BAD - violates privacy
tracelog.event('signup', {
  email: 'user@example.com', // ❌ PII
  phone: '+1234567890', // ❌ PII
  address: '123 Main St', // ❌ PII
});

// GOOD - use hashed IDs
import { SHA256 } from 'crypto-js';

const userId = SHA256('user@example.com' + 'your-salt').toString();
tracelog.event('signup', {
  userId: userId, // ✅ Hashed
  plan: 'premium', // ✅ Non-sensitive
  source: 'landing_page', // ✅ Non-sensitive
});
```

### ✅ DO: Mark events as critical when they precede a navigation

For high-value events that fire right before a page unload (purchase confirmation that redirects to a thank-you page, signup that redirects to onboarding, etc.) pass `{ critical: true }`. The library uses a **double-write** strategy that guarantees delivery under every browser lifecycle quirk we've observed in production:

1. **Dedicated single-event `sendBeacon`** — the critical event is sent on its own in a tiny (<1KB) batch. Guarantees delivery even when the main queue would exceed the 64KB `sendBeacon` cap, and is independent of any async fetch already in flight.
2. **Main-queue drain via `sendBeacon`** — the rest of the queue is flushed too. If an async send is in flight when the critical event arrives, the drain is deferred and re-runs after that fetch settles (the deferred re-flush mechanism), so events tracked just before the critical one are not stranded.

```typescript
// GOOD - dedicated sendBeacon for the conversion + queue drain
tracelog.event('purchase_completed', { orderId: 'ord-789', total: 599.98 }, { critical: true });
window.location.href = '/thanks';

// BAD - async fetch is cancelled by the navigation
tracelog.event('purchase_completed', { orderId: 'ord-789', total: 599.98 });
window.location.href = '/thanks'; // ❌ Event likely lost
```

**Backend prerequisite (MUST)**: the double-write strategy may cause the same event to be sent twice — once via the dedicated beacon, once via the periodic / unload flush. Your collector backend **must** deduplicate by `event.id` (e.g. unique index on the ingestion collection) or you'll see visible duplicates. This is the same guarantee the library already relies on for its persisted-events recovery path, so most consumers already satisfy it.

**Other caveats**: `sendBeacon` is capped at 64KB per request and does not apply custom headers. If the queue drain exceeds the cap, the failed portion is persisted to `localStorage` and recovered on the next `init()` via the idempotency token. The dedicated single-event beacon is always under the cap.

**When NOT to mark critical**: events that don't immediately precede a navigation (mid-funnel `add_to_cart`, page views, web vitals, etc.) — marking them critical sends an extra beacon per call and adds queue chatter without measurable benefit.

### ✅ DO: Force-flush before route teardown when auto-flush is disabled

The library auto-flushes on SPA navigation (`flushOnSpaNavigation`, default `true`). If you opt out — e.g. you want to control timing yourself — call `flushImmediately()` (async, with retries) before tearing down route-scoped state. For unload listeners use `flushImmediatelySync()` instead so the browser queues the request.

```typescript
// Angular: flush on every NavigationStart with auto-flush disabled
await tracelog.init({ flushOnSpaNavigation: false /* ... */ });

router.events.pipe(filter((e) => e instanceof NavigationStart)).subscribe(async () => {
  await tracelog.flushImmediately();
});
```

Both helpers resolve to `false` (rather than throwing) if the library is not initialized or another flush is in flight, so they are safe to call from guards and listeners without try/catch.

---

## Mobile platforms

### iOS Safari often skips `pagehide`/`beforeunload`

When the OS backgrounds, freezes or terminates an iOS Safari tab, the unload events the library normally relies on may never fire. To cover this, the library also flushes on `visibilitychange` when `document.hidden` becomes `true` (covers tab switch, lock screen, app backgrounding). This is gated by:

```typescript
await tracelog.init({
  flushOnPageHidden: true, // default
});
```

Set to `false` only if you want to control flush timing manually — the default is the safe choice for almost every consumer.

### Mobile networks lose async fetches mid-suspension

When the OS suspends a backgrounded tab, an in-flight `fetch()` can be aborted before its body reaches the network. `sendBeacon` is queued by the browser and survives suspension, which is why the visibility-hide / `pagehide` / `beforeunload` flush paths all use the sync (sendBeacon) path. For conversion-critical events that immediately precede a navigation, also pass `{ critical: true }` (see the dedicated section above) so the conversion is delivered before the OS gets a chance to suspend you.

**`sendBeacon` caveats apply to the visibility-hide flush too** (not just `critical: true`):

- **64KB cap per request.** If the in-memory queue is heavy when the tab backgrounds, the oversized batch is persisted to `localStorage` and only re-sent on the next `init()` (typically the next session). Most callers stay well under this; if you emit large per-event metadata, sample heavier event types or shorten `SEND_EVENTS_INTERVAL_MS` so the queue stays small.
- **Custom headers are NOT applied.** `navigator.sendBeacon()` is a fire-and-forget API with no header customisation. If your custom backend authenticates requests via `setCustomHeaders()` (e.g. `Authorization: Bearer ...`), the visibility-hide beacon will arrive unauthenticated. Mitigation: also accept cookie/origin-based auth at the collector, or accept that visibility-hide batches without auth will be re-delivered (with headers) on next `init()` via persisted-events recovery.
- **No retry.** Visibility-hide is one-shot. Transient network failures fall through to the localStorage recovery path.

### Don't rely on `beforeunload` alone

`beforeunload` has been deprecated or restricted by every major browser at some point. The library wires it as a belt-and-braces fallback alongside `pagehide` and `visibilitychange`. If you're building your own unload handler, prefer `pagehide` + `visibilitychange` (`document.hidden === true`) over `beforeunload`.

---

## Event Listeners

### ✅ DO: Unsubscribe when component unmounts

```typescript
// React
useEffect(() => {
  const handler = (event) => console.log(event);
  tracelog.on('event', handler);

  return () => {
    tracelog.off('event', handler); // Cleanup
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
// GOOD - check type first
tracelog.on('event', (event) => {
  if (event.type === 'custom') {
    const { name } = event.custom_event;
    if (name === 'purchase') {
      sendToBackend(event);
    }
  }
});

// BAD - processing all events
tracelog.on('event', (event) => {
  // Heavy processing on EVERY event
  JSON.stringify(event);
  localStorage.setItem('last_event', JSON.stringify(event));
});
```

---

## User Consent & Privacy

### ✅ DO: Obtain user consent BEFORE initialization

TraceLog requires you to manage user consent externally. Only call `init()` after obtaining explicit user consent:

```typescript
// Your responsibility: Show consent banner and obtain consent
const userConsent = await showCookieBanner(); // Your consent management system

if (userConsent.analytics) {
  // Only initialize after consent is granted
  await tracelog.init({
    integrations: {
      tracelog: { projectId: 'your-project-id' },
    },
  });
} else {
  console.log('User declined tracking - TraceLog not initialized');
}
```

### ✅ DO: Handle consent revocation

If the user revokes consent, stop tracking immediately:

```typescript
function handleConsentRevoke() {
  tracelog.destroy(); // Stop all tracking
  localStorage.clear(); // Clear stored session data
  sessionStorage.clear(); // Clear temporary data
}
```

### ✅ DO: Respect sensitive data boundaries

Mark sensitive areas with `data-tlog-ignore`:

```typescript
// Exclude payment forms, admin panels, etc.
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
    'auth_token', // App-specific params
    'api_key',
    'reset_token',
    // Merged with defaults: token, auth, key, password, etc.
  ],
});
```

### ❌ DON'T: Pass PII in custom events

YOU are responsible for sanitizing metadata passed to `tracelog.event()`:

```typescript
// ❌ BAD: Contains PII
tracelog.event('purchase', {
  email: 'user@example.com', // ❌ Email
  phone: '+1-555-123-4567', // ❌ Phone number
});

// ✅ GOOD: Generic identifiers only
tracelog.event('purchase', {
  userId: 'usr_abc123', // ✅ Hashed/anonymized ID
  amount: 99.99, // ✅ Non-PII data
  currency: 'USD',
});
```

---

## Performance

### ✅ DO: Filter unnecessary events before sending to backend

Use the `beforeSend` transformer to exclude specific event types from being sent to your backend. Events are still captured locally.

```typescript
// Already using Sentry for errors? Filter them out
tracelog.setTransformer('beforeSend', (event) => {
  if (event.type === 'error') {
    return null; // Don't send to backend
  }
  return event;
});

await tracelog.init({
  integrations: {
    custom: { collectApiUrl: 'https://api.example.com' },
  },
});

// High-frequency scrolls not needed in data warehouse?
tracelog.setTransformer('beforeSend', (event) => {
  if (event.type === 'scroll') {
    return null;
  }
  return event;
});

// Only need core analytics? Filter scroll, web_vitals, and errors
tracelog.setTransformer('beforeSend', (event) => {
  const excludeTypes = ['scroll', 'web_vitals', 'error'];
  if (excludeTypes.includes(event.type)) {
    return null;
  }
  return event;
});

// Advanced: Conditional filtering based on environment
tracelog.setTransformer('beforeSend', (event) => {
  // Only send errors in production
  if (event.type === 'error' && process.env.NODE_ENV !== 'production') {
    return null;
  }

  // Sample scroll events (send only 10%)
  if (event.type === 'scroll' && Math.random() > 0.1) {
    return null;
  }

  return event;
});
```

**Benefits:**

- Lower bandwidth usage for custom backends
- Reduced backend storage costs
- Complete control over filtering logic
- Events still available locally via `tracelog.on('event')`
- Can add custom conditions (environment, sampling, etc.)

**Important:** Transformers only apply to **custom backend integrations**. TraceLog SaaS always receives all events unmodified to maintain schema integrity. If you use both integrations, SaaS will get all events while your custom backend will get the filtered events.

### ✅ DO: Use sampling for high-traffic sites

```typescript
await tracelog.init({
  samplingRate: 0.1, // Track 10% of users
  errorSampling: 0.5, // Track 50% of errors
});
```

### ✅ DO: Limit viewport tracking

```typescript
await tracelog.init({
  viewport: {
    elements: [
      // Only track critical CTAs
      { selector: '.primary-cta', id: 'hero-cta', name: 'Hero CTA' },
      { selector: '.checkout-button', id: 'checkout', name: 'Checkout' },
    ],
    threshold: 0.5, // 50% visible
    minDwellTime: 2000, // 2 seconds
  },
});
```

### ❌ DON'T: Track every scroll event manually

```typescript
// BAD - handled automatically
window.addEventListener('scroll', () => {
  tracelog.event('scroll', { y: window.scrollY }); // ❌ Redundant
});

// GOOD - use built-in handler (automatic)
await tracelog.init(); // Scroll tracking enabled by default
```

---

## Error Handling

### ✅ DO: Test error tracking in development

```typescript
// Manually trigger errors for testing
if (import.meta.env.DEV) {
  window.testTraceLogError = () => {
    throw new Error('Test error for TraceLog');
  };
}

// Call in DevTools: testTraceLogError()
```

### ✅ DO: Monitor error sampling

```typescript
// Production: reduce noise
await tracelog.init({
  errorSampling: 0.1, // 10% of errors
});

// Staging: higher sampling
await tracelog.init({
  errorSampling: 1.0, // 100% of errors
});
```

---

## Integration Modes

### ✅ DO: Choose the right integration

```typescript
// 1. Standalone (no backend) - for local analytics
await tracelog.init();
tracelog.on('event', (event) => {
  // Process locally
  myAnalytics.process(event);
});

// 2. TraceLog SaaS - managed platform
await tracelog.init({
  integrations: {
    tracelog: { projectId: 'project-id' },
  },
});

// 3. Custom backend - your own API
await tracelog.init({
  integrations: {
    custom: {
      collectApiUrl: 'https://api.example.com/collect',
      allowHttp: false, // NEVER true in production
      fetchCredentials: 'include', // Cookie policy: 'include' | 'same-origin' | 'omit'
    },
  },
});

// 4. Multi-Integration - simultaneous sending
await tracelog.init({
  integrations: {
    tracelog: { projectId: 'project-id' }, // Analytics dashboard
    custom: { collectApiUrl: 'https://warehouse.com' }, // Data warehouse
  },
});
```

### ✅ DO: Use multi-integration for redundancy and compliance

```typescript
// Use Case 1: Analytics + Data Warehouse
await tracelog.init({
  integrations: {
    tracelog: { projectId: 'abc-123' }, // Real-time dashboard
    custom: { collectApiUrl: 'https://warehouse.com' }, // Long-term storage
  },
});

// Use Case 2: Production + Compliance
await tracelog.init({
  integrations: {
    tracelog: { projectId: 'prod-analytics' }, // Business analytics
    custom: { collectApiUrl: 'https://compliance.gov' }, // Regulatory logging
  },
});

// Use Case 3: Migration (Dual-Send)
await tracelog.init({
  integrations: {
    custom: { collectApiUrl: 'https://old-system.com' }, // Legacy system
    tracelog: { projectId: 'new-project' }, // New TraceLog
  },
});
// Gradually migrate traffic from old to new without data loss
```

**Key Benefits:**

- ✅ **Independent error handling:** 4xx/5xx errors handled per integration
- ✅ **Independent retry:** Failed events persisted separately for each backend
- ✅ **Parallel sending:** Non-blocking async requests to all endpoints
- ✅ **Zero data loss:** One backend down doesn't affect the other

### ❌ DON'T: Use multi-integration for load balancing

```typescript
// BAD - not for load balancing
await tracelog.init({
  integrations: {
    custom: { collectApiUrl: 'https://api1.example.com' },
    // ❌ Can't add second custom integration for load balancing
  },
});

// GOOD - use a load balancer endpoint
await tracelog.init({
  integrations: {
    custom: { collectApiUrl: 'https://lb.example.com' }, // Handles distribution to endpoints
  },
});
```

### ❌ DON'T: Use HTTP in production

```typescript
// BAD - insecure
await tracelog.init({
  integrations: {
    custom: {
      collectApiUrl: 'http://api.example.com/collect', // ❌ HTTP
      allowHttp: true, // ❌ Never in production
    },
  },
});

// GOOD - HTTPS only
await tracelog.init({
  integrations: {
    custom: {
      collectApiUrl: 'https://api.example.com/collect', // ✅ HTTPS
      allowHttp: false, // ✅ Default
    },
  },
});
```

---

## Transformers

### ✅ DO: Use transformers for data enrichment

```typescript
import type { EventData, EventsQueue } from '@tracelog/lib';

// Add application context to all events
tracelog.setTransformer('beforeSend', (data: EventData | EventsQueue) => {
  if ('type' in data) {
    return {
      ...data,
      custom_event: {
        ...data.custom_event,
        metadata: {
          ...data.custom_event?.metadata,
          appVersion: '2.1.0',
          environment: process.env.NODE_ENV,
          region: getUserRegion(),
        },
      },
    };
  }
  return data;
});
```

### ✅ DO: Use transformers for conditional filtering

```typescript
// Filter events based on runtime conditions
tracelog.setTransformer('beforeSend', (data) => {
  if ('type' in data) {
    // Don't send events from admin users
    if (currentUser.isAdmin) {
      return null; // Filtered out
    }

    // Don't send events in development
    if (import.meta.env.DEV) {
      return null;
    }
  }
  return data;
});

// Filter batches with insufficient data
tracelog.setTransformer('beforeBatch', (data) => {
  if ('events' in data) {
    // Only send batches with 10+ events
    if (data.events.length < 10) {
      return null; // Batch filtered
    }
  }
  return data;
});
```

### ✅ DO: Handle transformer errors gracefully

```typescript
// Safe transformer with try-catch
tracelog.setTransformer('beforeSend', (data) => {
  try {
    // Complex transformation logic
    return transformData(data);
  } catch (error) {
    console.error('Transformer error:', error);
    return data; // Fallback to original
  }
});
```

### ✅ DO: Use type guards for type safety

```typescript
import type { EventData, EventsQueue } from '@tracelog/lib';

tracelog.setTransformer('beforeSend', (data: EventData | EventsQueue) => {
  // Type guard: Check if it's an EventData
  if ('type' in data) {
    // TypeScript knows data is EventData here
    return {
      ...data,
      custom_event: {
        ...data.custom_event,
        metadata: {
          ...data.custom_event?.metadata,
          transformed: true,
        },
      },
    };
  }
  return data;
});

tracelog.setTransformer('beforeBatch', (data) => {
  // Type guard: Check if it's an EventsQueue
  if ('events' in data) {
    // TypeScript knows data is EventsQueue here
    return {
      ...data,
      global_metadata: {
        ...data.global_metadata,
        batchTransformed: true,
      },
    };
  }
  return data;
});
```

### ✅ DO: Remember integration-specific behavior

```typescript
// ✅ GOOD - Use with custom backend
await tracelog.init({
  integrations: {
    custom: { collectApiUrl: 'https://api.example.com' },
  },
});

// Transformers WILL be applied
tracelog.setTransformer('beforeSend', transformFn);
tracelog.setTransformer('beforeBatch', transformFn);

// ✅ ALSO GOOD - But transformers silently ignored
await tracelog.init({
  integrations: {
    tracelog: { projectId: 'project-id' },
  },
});

// Transformers set but NOT applied (SaaS schema protection)
tracelog.setTransformer('beforeSend', transformFn); // Ignored
tracelog.setTransformer('beforeBatch', transformFn); // Ignored
```

**Key Points:**

- **TraceLog SaaS**: Transformers silently ignored (no errors thrown)
- **Custom Backend**: Transformers applied as configured
- **Multi-Integration**: Transformers only apply to custom backend

### ❌ DON'T: Rely on transformers for TraceLog SaaS

```typescript
// BAD - won't work with TraceLog SaaS
await tracelog.init({
  integrations: {
    tracelog: { projectId: 'project-id' },
  },
});

// This won't be applied (SaaS schema protection)
tracelog.setTransformer('beforeSend', (data) => {
  // ❌ Never executed for SaaS
  return enrichedData;
});

// GOOD - use custom backend if you need transformers
await tracelog.init({
  integrations: {
    custom: { collectApiUrl: 'https://api.example.com' },
  },
});

tracelog.setTransformer('beforeSend', (data) => {
  // ✅ Applied to custom backend
  return enrichedData;
});
```

### ❌ DON'T: Transform sensitive data without sanitization

```typescript
// BAD - exposing PII
tracelog.setTransformer('beforeSend', (data) => {
  if ('type' in data) {
    return {
      ...data,
      custom_event: {
        ...data.custom_event,
        metadata: {
          ...data.custom_event?.metadata,
          userEmail: currentUser.email, // ❌ PII leak
          creditCard: paymentInfo.card, // ❌ Sensitive data
        },
      },
    };
  }
  return data;
});

// GOOD - sanitize or use IDs
tracelog.setTransformer('beforeSend', (data) => {
  if ('type' in data) {
    return {
      ...data,
      custom_event: {
        ...data.custom_event,
        metadata: {
          ...data.custom_event?.metadata,
          userId: currentUser.id, // ✅ ID only
          paymentMethodType: paymentInfo.cardType, // ✅ Generic info
        },
      },
    };
  }
  return data;
});
```

### ❌ DON'T: Mutate the input data

```typescript
// BAD - mutating input
tracelog.setTransformer('beforeSend', (data) => {
  if ('type' in data && data.custom_event) {
    // ❌ Mutating original object
    data.custom_event.metadata.transformed = true;
    return data;
  }
  return data;
});

// GOOD - return new object
tracelog.setTransformer('beforeSend', (data) => {
  if ('type' in data) {
    // ✅ Creating new object
    return {
      ...data,
      custom_event: {
        ...data.custom_event,
        metadata: {
          ...data.custom_event?.metadata,
          transformed: true,
        },
      },
    };
  }
  return data;
});
```

### ❌ DON'T: Perform heavy operations in transformers

```typescript
// BAD - slow operations block event processing
tracelog.setTransformer('beforeSend', (data) => {
  // ❌ Heavy operations
  const expensiveResult = doHeavyComputation(); // 500ms+
  const apiData = await fetch('/api/enrich'); // Async not allowed

  return { ...data, expensiveResult };
});

// GOOD - pre-compute or cache expensive data
const enrichmentData = await fetchEnrichmentData(); // Do once at init

tracelog.setTransformer('beforeSend', (data) => {
  if ('type' in data) {
    // ✅ Fast synchronous operation
    return {
      ...data,
      custom_event: {
        ...data.custom_event,
        metadata: {
          ...data.custom_event?.metadata,
          ...enrichmentData, // Pre-computed
        },
      },
    };
  }
  return data;
});
```

---

## Testing & QA

### ✅ DO: Use QA mode for debugging

```typescript
// Activate via URL
// https://example.com?tlog_mode=qa

// Or programmatically
await tracelog.init();
tracelog.setQaMode(true);

// Send test event (logged to console)
tracelog.event('test_event', { foo: 'bar' });

// Deactivate
tracelog.setQaMode(false);
```

### ✅ DO: Verify events in DevTools

```typescript
// Monitor all events
tracelog.on('event', console.log);

// Monitor queue batches
tracelog.on('queue', (batch) => {
  console.log('Queued:', batch.events.length, 'events');
});

// Check network requests
// DevTools → Network → Filter: "collect"
```

### ✅ DO: Test cross-tab behavior

```typescript
// Tab 1: Initialize
await tracelog.init();
console.log('Session ID:', tracelog.getSessionId());

// Tab 2: Initialize (should receive same session ID)
await tracelog.init();
console.log('Session ID:', tracelog.getSessionId()); // Same as Tab 1
```

---

## Session Management

### ✅ DO: Configure appropriate timeout

```typescript
await tracelog.init({
  sessionTimeout: 900000, // 15 minutes (default)
  // sessionTimeout: 1800000  // 30 minutes (longer sessions)
  // sessionTimeout: 300000   // 5 minutes (strict timeout)
});
```

### ✅ DO: Manually end sessions when needed

```typescript
// User logs out
function handleLogout() {
  tracelog.destroy(); // Ends session + cleanup
  // ... rest of logout logic
}

// User navigates away from app
window.addEventListener('beforeunload', () => {
  // Session end event sent automatically via sendBeacon()
});
```

---

## Web Vitals

### ✅ DO: Choose appropriate filtering mode

```typescript
// Default: Track metrics needing improvement (balanced)
await tracelog.init({
  webVitalsMode: 'needs-improvement', // LCP > 2500ms, INP > 200ms, etc.
});

// All metrics: For trend analysis and P75 calculations
await tracelog.init({
  webVitalsMode: 'all', // Track every metric
});

// Poor only: Minimize data volume
await tracelog.init({
  webVitalsMode: 'poor', // LCP > 4000ms, INP > 500ms, etc.
});

// Custom thresholds: Fine-grained control
await tracelog.init({
  webVitalsMode: 'needs-improvement',
  webVitalsThresholds: {
    LCP: 3000, // Stricter than default 2500ms
    INP: 150, // Stricter than default 200ms
  },
});
```

---

## Common Pitfalls

### ❌ AVOID: Blocking main thread

```typescript
// BAD - synchronous processing
tracelog.on('event', (event) => {
  for (let i = 0; i < 1000000; i++) {
    // Heavy computation blocks UI
  }
});

// GOOD - async processing
tracelog.on('event', async (event) => {
  await processEventAsync(event);
});
```

### ❌ AVOID: Memory leaks in SPAs

```typescript
// BAD - listeners never removed
export class MyComponent {
  constructor() {
    tracelog.on('event', (event) => {
      this.handleEvent(event); // Memory leak on unmount
    });
  }
}

// GOOD - cleanup on destroy
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
// BAD - tracking every keystroke
document.addEventListener('keydown', (e) => {
  tracelog.event('keydown', { key: e.key }); // ❌ Too noisy
});

// GOOD - track meaningful interactions
document.querySelector('.search-form').addEventListener('submit', (e) => {
  tracelog.event('search_submitted', {
    query: e.target.query.value,
  }); // ✅ Actionable
});
```

---

## Pre-Production Checklist

Before deploying to production:

- [ ] Consent flow implemented (init after consent)
- [ ] `data-tlog-ignore` on payment/admin UI
- [ ] No PII in custom event metadata
- [ ] Sensitive URL params configured
- [ ] `allowHttp: false` (or omitted)
- [ ] Sampling rates appropriate for traffic volume
- [ ] Event listeners cleaned up on unmount
- [ ] QA mode tested (`?tlog_mode=qa`)
- [ ] Network requests verified (DevTools → Network)
- [ ] Privacy policy updated
- [ ] Cookie banner includes TraceLog

---

## Performance Benchmarks

Expected impact on your application:

| Metric                  | Impact                                                  |
| ----------------------- | ------------------------------------------------------- |
| **Bundle size**         | +15KB gzipped                                           |
| **Init time**           | <10ms                                                   |
| **Event capture**       | ~1ms per event (includes deduplication & ID generation) |
| **Memory usage**        | ~500KB (queue + session state)                          |
| **Network requests**    | 1 per 10 seconds OR 50 events (batched)                 |
| **Event ID generation** | <1ms with zero-collision guarantees (sequence counter)  |

**Efficiency Improvements (v1.7.0+):**

- **Sequence counter in event IDs**: Guarantees unique IDs even in high-frequency bursts (1000 events/ms capacity)
- **Client version tracking**: Automatic version reporting for adoption monitoring and debugging

**Optimization tips:**

- Use `samplingRate` to reduce load
- Limit viewport tracking to critical elements
- Configure `webVitalsMode: 'needs-improvement'` or `'poor'`
- Clean up listeners in SPAs to prevent memory leaks

---

## Additional Resources

- [README.md](./README.md) - API reference and quick start
- [SECURITY.md](./SECURITY.md) - Complete privacy and security guide
- [CLAUDE.md](./CLAUDE.md) - Architecture and development guide
- [Handlers README](./src/handlers/README.md) - Event handler details
- [Managers README](./src/managers/README.md) - Core component details

---

**Last Updated**: January 2025
**Version**: 0.12.0+
**License**: MIT
