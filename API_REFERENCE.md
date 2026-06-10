# TraceLog API Reference

Complete API documentation for the TraceLog library. For quick start and examples, see [README.md](./README.md).

## Table of Contents

1. [Core API](#core-api)
2. [Configuration](#configuration)
3. [Event Types](#event-types)
4. [Event Emitters](#event-emitters)
5. [TypeScript Types](#typescript-types)
6. [Error Handling](#error-handling)
7. [Global Disable](#global-disable)
8. [Browser Compatibility](#browser-compatibility)

---

## Core API

### `init(config?: Config): Promise<InitResult>`

Initializes TraceLog and starts tracking. Safe to call in SSR — no-ops in Node.js.

**Parameters:**

- `config` (optional): Configuration object. See [Configuration](#configuration).

**Returns:** `Promise<InitResult>` with:

- `sessionId`: session identifier string (empty string in SSR or when initialization is skipped)

**Throws:**

- `Error` if initialization fails or times out
- Subsequent calls after a successful init resolve with the existing `sessionId` (idempotent)

**Examples:**

```typescript
// Standalone mode
const { sessionId } = await tracelog.init();
console.log('Session started:', sessionId);

// With TraceLog SaaS
const { sessionId } = await tracelog.init({
  integrations: {
    tracelog: { projectId: 'your-project-id' },
  },
});

// SSR-safe usage (Angular Universal, Next.js, Nuxt)
if (typeof window !== 'undefined') {
  const { sessionId } = await tracelog.init();
}
```

**Initialization order best practice:**

```typescript
// 1. Register listeners FIRST so they receive the initial SESSION_START / PAGE_VIEW
tracelog.on('event', handler);

// 2. Optionally identify the user (before or after init)
tracelog.identify('cust_123', { plan: 'pro' });

// 3. Initialize
await tracelog.init({ integrations: { tracelog: { projectId: '...' } } });
```

**Notes:**

- Automatically tracks page views, clicks, scrolls, sessions, Web Vitals, and JavaScript errors
- Recovers any persisted events from previous sessions on init
- Pre-init listeners and identity are buffered and applied automatically
- **Pre-rendering:** when called on a pre-rendered/prefetched page (Speculation Rules API, `document.prerendering === true`), `init()` returns a real `sessionId` but emits no events until the page is activated (`prerenderingchange`). A page that is pre-rendered but never activated emits nothing, matching how GA4 treats pre-renders. No configuration needed.

---

### `event(name: string, metadata?: Record<string, MetadataType> | Record<string, MetadataType>[], options?: EventOptions): void`

Sends a custom event for business-specific tracking.

**Parameters:**

- `name` (required): event name identifier (e.g., `'product_viewed'`, `'checkout_completed'`)
- `metadata` (optional): event data as object or array of objects
- `options` (optional): `EventOptions` — currently supports `critical?: boolean`

**Throws:**

- `Error` if called before `init()`
- `Error` if called during `destroy()`
- `Error` if event validation fails in QA mode

**Examples:**

```typescript
// Simple event
tracelog.event('button_clicked');

// With metadata
tracelog.event('product_viewed', {
  productId: 'abc-123',
  price: 299.99,
  category: 'electronics',
});

// With array metadata
tracelog.event('cart_updated', [
  { productId: 'abc-123', quantity: 2 },
  { productId: 'def-456', quantity: 1 },
]);

// E-commerce example
tracelog.event('purchase_completed', {
  orderId: 'ord-789',
  total: 599.98,
  currency: 'USD',
  items: 3,
});

// Critical event — flushes via sendBeacon so it survives the redirect.
tracelog.event('purchase_completed', { orderId: 'ord-789', total: 599.98 }, { critical: true });
window.location.href = '/thanks';
```

**`EventOptions`:**

| Field      | Type      | Default | Description |
|------------|-----------|---------|-------------|
| `critical` | `boolean` | `false` | If `true`, drains the event queue via `navigator.sendBeacon()` synchronously right after this event is tracked. The browser guarantees the request is queued for delivery even if the page is about to unload (typical pattern: tracking a purchase, then `window.location.href = '/thanks'`). If an async fetch is in flight when the critical event arrives, the sync flush is deferred and re-runs from the async send's `finally` block, so the critical event is not stranded in the queue. `sendBeacon` limits apply (64KB cap, no custom headers, no retry); oversized payloads are persisted to `localStorage` for recovery on next `init()`. |

**Rate limits and deduplication apply to critical events too.** `critical: true` is a delivery-transport hint, not a bypass: if the event exceeds `maxSameEventPerMinute` for its name, or is a near-duplicate of a recent event (same fingerprint within the LRU window), it is dropped *before* it reaches the queue. The subsequent `sendBeacon` flush still runs, but only carries whatever was already queued — not the dropped event. If you need an event to be guaranteed delivered regardless of bursts, choose a unique event name and call it sparingly.

**Standalone mode.** `critical: true` is a no-op for the network path (there is no backend to beacon to). Local listeners registered via `tracelog.on('queue', ...)` still observe the event exactly once via the normal flush path — no double-emission.

**Rate limiting:**

- Default 60 events per minute per event name (configurable via `maxSameEventPerMinute`)
- Prevents infinite loops and accidental spam

**Privacy:**

- **You are responsible** for sanitizing metadata
- Avoid passing PII (emails, phones, credit cards) in metadata
- Use generic identifiers instead of user names

---

### `on<K extends EmitterEvent>(event: K, callback: EmitterCallback<EmitterMap[K]>): void`

Subscribes to TraceLog events for real-time consumption.

**Parameters:**

- `event`: event type to subscribe to (`'event'` or `'queue'`)
- `callback`: function called when the event fires

**Event types:**

- `'event'`: fired for each individual event captured (real-time)
- `'queue'`: fired when events are batched and ready to send (every 10s or 50 events)

**Examples:**

```typescript
// Listen to individual events
tracelog.on('event', (event) => {
  if (event.type === 'click') {
    console.log('Clicked element:', event.click_data?.tag);
  }
});

// Listen to event batches
tracelog.on('queue', (batch) => {
  console.log('Batch ready:', batch.events.length, 'events');
});

// Send events to a custom analytics destination
tracelog.on('event', (event) => {
  window.myAnalytics?.track(event.type, event);
});
```

**Notes:**

- Register listeners **before** `init()` to catch initial events (`SESSION_START`, `PAGE_VIEW`)
- Listeners registered before init are buffered and attached after initialization
- Safe to call in SSR (no-ops in Node.js)

---

### `off<K extends EmitterEvent>(event: K, callback: EmitterCallback<EmitterMap[K]>): void`

Unsubscribes from TraceLog events.

**Parameters:**

- `event`: event type to unsubscribe from
- `callback`: exact callback function reference used in `on()`

**Example:**

```typescript
const handler = (event) => console.log('Event:', event.type);
tracelog.on('event', handler);
tracelog.off('event', handler);
```

**Notes:**

- Must pass the **exact** function reference used in `on()`
- Safe to call before initialization (removes from pending listeners)

---

### `isInitialized(): boolean`

Returns `true` after a successful `init()`, `false` otherwise (including during teardown).

```typescript
if (tracelog.isInitialized()) {
  tracelog.event('app_ready');
}
```

---

### `getSessionId(): string | null`

Returns the current session ID, or `null` if not initialized.

```typescript
await tracelog.init();
const sessionId = tracelog.getSessionId();

fetch('/api/user-action', {
  headers: { 'X-TraceLog-Session': sessionId ?? '' },
});
```

Prefer the `sessionId` returned by `init()` when possible — it's guaranteed available immediately after initialization.

---

### `getUserId(): string | null`

Returns the visitor UUID assigned by TraceLog, or `null` if not initialized.

Use this to stitch TraceLog events to events fired from contexts outside the SDK (for example a Shopify Web Pixel, where you'd write the value as a cart attribute on the storefront so checkout events can reference the same visitor).

```typescript
const userId = tracelog.getUserId();
```

When `integrations.tracelog.shopify: true`, the library wires this automatically.

---

### `destroy(): void`

Stops all tracking, drains pending events via `sendBeacon()`, and releases all resources. Safe to call multiple times.

```typescript
tracelog.destroy();

// In framework cleanup hooks
onDestroy(() => {
  tracelog.destroy();
});
```

**Notes:**

- Sends any pending events with `sendBeacon()` (synchronous)
- Removes all event listeners and lifecycle hooks
- Clears internal state
- After `destroy()` you must call `init()` again to resume tracking

---

### `identify(userId: string, traits?: Record<string, string>): void`

Associates the current anonymous visitor with a known user identity.

**Parameters:**

- `userId` (required): external user identifier (email, customer_id, etc.). Trimmed; max 256 characters.
- `traits` (optional): user attributes as `Record<string, string>`. Only string values are kept — non-string fields, arrays, and `null` are dropped silently.

**Behavior:**

- Can be called **before or after** `init()`
- If called before `init()`, identity is persisted to localStorage and applied automatically when `init()` runs
- Identity is included in every event batch (piggyback), so the backend always receives the latest identity
- Calling multiple times overwrites (last-write-wins)
- Whitespace-only or empty `userId` values are rejected (warning logged)
- `userId` is trimmed automatically

**Examples:**

```typescript
// After login
tracelog.identify('cust_123', { name: 'Maria Garcia', plan: 'pro' });

// Before init (identity queued, applied on init)
tracelog.identify('cust_123');
await tracelog.init({ integrations: { tracelog: { projectId: '...' } } });

// Update traits later (replaces previous traits — last-write-wins)
tracelog.identify('cust_123', { plan: 'enterprise' });
```

Identity persists across page reloads (localStorage, project-scoped).

---

### `resetIdentity(): Promise<void>`

Clears identity, regenerates the visitor UUID, and starts a new session. Use for logout flows. The previous visitor profile remains in the backend; the next user in the same browser gets a fresh anonymous profile.

**Behavior:**

- Flushes pending events under the **old** identity first via async `fetch` (so any in-flight authentication-related state is preserved)
- Clears identity from state and localStorage
- Generates a new anonymous UUID
- Stops and restarts the session handler, emitting a new `SESSION_START`
- If called before `init()`, just clears any pending pre-init identity silently

**Example:**

```typescript
// On logout
await tracelog.resetIdentity();

// Full login → logout flow
tracelog.identify('cust_123', { name: 'Maria' });
// ... user activity tracked with identity ...
await tracelog.resetIdentity(); // New anonymous profile
```

Async because it flushes pending events before resetting.

---

## Configuration

### `Config` interface

```typescript
interface Config {
  sessionTimeout?: number;
  globalMetadata?: Record<string, MetadataType>;
  sensitiveQueryParams?: string[];
  errorSampling?: number;
  samplingRate?: number;
  pageViewThrottleMs?: number;
  clickThrottleMs?: number;
  maxSameEventPerMinute?: number;
  sendIntervalMs?: number;
  flushOnSpaNavigation?: boolean;
  flushOnPageHidden?: boolean;
  webVitalsMode?: WebVitalsMode;
  webVitalsThresholds?: Partial<Record<WebVitalType, number>>;
  integrations?: {
    tracelog?: {
      projectId: string;
      shopify?: boolean;
      healthBeacon?: boolean;
    };
  };
}
```

### Session

#### `sessionTimeout`

- **Type:** `number` (milliseconds)
- **Default:** `900000` (15 minutes)
- **Description:** session inactivity timeout

```typescript
await tracelog.init({ sessionTimeout: 1800000 }); // 30 minutes
```

#### `globalMetadata`

- **Type:** `Record<string, MetadataType>`
- **Default:** `undefined`
- **Description:** metadata appended to every event sent to the backend

```typescript
await tracelog.init({
  globalMetadata: {
    app_version: '1.2.3',
    environment: 'production',
    user_plan: 'pro',
  },
});
```

**Validation limits:**

- Max 100 keys
- Max 48 KB serialized size
- Max 500 items per array
- Max 1000 characters per string
- Nested objects up to 10 levels

To change global metadata after init, call `destroy()` and re-initialize with the new config (typical at login / logout).

---

### Privacy

#### `sensitiveQueryParams`

- **Type:** `string[]`
- **Default:** `['token', 'auth', 'key', 'session', 'sessionid', 'session_id', 'jwt', 'bearer', 'oauth', 'reset', 'password', 'api_key', 'apikey', 'secret', 'access_token', 'refresh_token', 'verification', 'code', 'otp']`
- **Description:** query parameters stripped from every tracked URL — `page_url`, click `href`, and referrers (session attribution and `page_view.referrer`). Your custom params are **merged** with defaults.

```typescript
await tracelog.init({
  sensitiveQueryParams: ['affiliate_id', 'promo_code'],
  // Result: defaults + ['affiliate_id', 'promo_code']
});
```

#### `samplingRate`

- **Type:** `number` (0–1)
- **Default:** `1` (100%)
- **Description:** client-side event sampling rate

```typescript
await tracelog.init({ samplingRate: 0.5 }); // Track 50% of events
```

#### `errorSampling`

- **Type:** `number` (0–1)
- **Default:** `1` (100%)
- **Description:** client-side error event sampling rate

```typescript
await tracelog.init({ errorSampling: 0.1 }); // Track 10% of errors
```

---

### Performance

#### `webVitalsMode`

- **Type:** `'all' | 'needs-improvement' | 'poor'`
- **Default:** `'needs-improvement'`
- **Description:** controls which Web Vitals metrics are tracked

```typescript
await tracelog.init({ webVitalsMode: 'all' });
```

**Mode thresholds:**

| Metric | `'all'`    | `'needs-improvement'` | `'poor'`  |
|--------|------------|-----------------------|-----------|
| LCP    | All values | > 2500 ms             | > 4000 ms |
| FCP    | All values | > 1800 ms             | > 3000 ms |
| CLS    | All values | > 0.1                 | > 0.25    |
| INP    | All values | > 200 ms              | > 500 ms  |
| TTFB   | All values | > 800 ms              | > 1800 ms |

#### `webVitalsThresholds`

- **Type:** `Partial<Record<WebVitalType, number>>`
- **Default:** Core Web Vitals standards
- **Description:** per-metric overrides (override the threshold for the selected mode)

```typescript
await tracelog.init({
  webVitalsMode: 'needs-improvement',
  webVitalsThresholds: {
    LCP: 3000,
    FCP: 2500,
    CLS: 0.15,
  },
});
```

#### `sendIntervalMs`

- **Type:** `number` (milliseconds)
- **Default:** `10000` (10 seconds)
- **Min/Max:** 1000 ms – 60000 ms
- **Description:** batch flush interval

```typescript
await tracelog.init({ sendIntervalMs: 30000 }); // 30 seconds
```

#### `flushOnSpaNavigation`

- **Type:** `boolean`
- **Default:** `false`
- **Description:** opt-in. When `true`, auto-flushes the event queue after every SPA navigation (`pushState` / `replaceState` / `popstate` / `hashchange`). Off by default because per-route flushing multiplies request volume on SPA-heavy apps. Enable only if you need delivery between route changes faster than `sendIntervalMs`. No-op for MPAs.

```typescript
await tracelog.init({ flushOnSpaNavigation: true });
```

#### `flushOnPageHidden`

- **Type:** `boolean`
- **Default:** `true`
- **Description:** auto-flushes the event queue on `visibilitychange` when `document.hidden === true` (tab switch, lock screen, app backgrounding). Especially relevant on mobile Safari where `pagehide` / `beforeunload` can fire unreliably. Uses `sendBeacon` so the OS can't abort it mid-suspension.

```typescript
await tracelog.init({ flushOnPageHidden: false }); // Opt-out (rare)
```

---

### Interaction

#### `pageViewThrottleMs`

- **Type:** `number` (milliseconds)
- **Default:** `1000` (1 second)
- **Description:** throttle duration for page-view events (prevents rapid SPA navigation spam)

```typescript
await tracelog.init({ pageViewThrottleMs: 500 });
```

#### `clickThrottleMs`

- **Type:** `number` (milliseconds)
- **Default:** `300`
- **Description:** throttle duration for click events (prevents double-clicks and spam)

```typescript
await tracelog.init({ clickThrottleMs: 200 });
```

#### `maxSameEventPerMinute`

- **Type:** `number`
- **Default:** `60`
- **Description:** maximum number of same custom-event names per minute (rate limiting)

```typescript
await tracelog.init({ maxSameEventPerMinute: 30 });
```

---

### Integration

#### `integrations.tracelog`

- **Type:** `{ projectId: string; shopify?: boolean; firstParty?: boolean; healthBeacon?: boolean }`
- **Description:** TraceLog SaaS integration
- **`firstParty`** (default `false`): opt into "Accuracy mode". By default events post to the hosted endpoint `https://ingest.tracelog.io/p/{projectId}/collect`, which works the instant the snippet is pasted — **no DNS setup**. Set `true` to instead send through your own first-party subdomain (`https://{projectId}.{rootDomain}/collect`, a CNAME → middleware), which recovers ~10–30% of visits that ad-blockers strip from third-party hosts. Only enable it once the CNAME (and the domain-ownership TXT record) are verified — the dashboard surfaces this flag in your snippet only after verification.
- **`healthBeacon`** (default `true`): when ingest is rejected at the domain gate (HTTP 403), emit a diagnostic beacon so the dashboard can tell you your snippet is alive but events are blocked. Throttled to at most one per 10 minutes per browser (persisted in localStorage, shared across pages and tabs). Diagnostic only — never carries analytics data. Set `false` to opt out.

```typescript
await tracelog.init({
  integrations: {
    tracelog: {
      projectId: 'your-project-id',
      shopify: false, // Optional: enable Shopify cart attribute linking
    },
  },
});
```

**No DNS required (default).** The collect endpoint defaults to the hosted host `https://ingest.tracelog.io/p/{projectId}/collect`, so the snippet captures events the moment it is installed — on any host, including `localhost`. No CNAME, no waiting on DNS propagation.

**Domain requirement (Accuracy mode only).** When `firstParty: true`, the endpoint is derived from the host page's domain (`https://{projectId}.{rootDomain}/collect`), so `init()` from `localhost` or a raw IP address is rejected. For local development, omit `integrations.tracelog` to run in standalone mode, leave `firstParty` off to use the hosted default, or test against a staging domain mapped via `/etc/hosts`.

**`shopify`** — when `true`, the library writes the visitor UUID as a Shopify cart attribute (`tracelog_user_id`) so checkout-funnel events fired from the Web Pixel can be stitched back to the storefront visitor.

---

## Event Types

All events share base properties plus type-specific data.

### Base event properties

Every event includes:

```typescript
interface EventData {
  id: string;          // Unique event ID (timestamp-sequence-random)
  type: EventType;     // Event type enum
  page_url: string;    // Current page URL (sanitized)
  timestamp: number;   // Unix timestamp (ms)
  referrer?: string;   // HTTP referrer (sensitive query params removed)
  utm?: UTM;           // UTM campaign parameters
  click_ids?: ClickIds; // Ad-network click identifiers (gclid, fbclid, ...)
}
```

**Session attribution** — `referrer`, `utm`, and `click_ids` are captured once at session start (from the landing URL) and attached to every event in that session, so the backend can classify the session's traffic source. `click_ids` carries ad-network click identifiers auto-appended by ad platforms:

```typescript
interface ClickIds {
  gclid?: string;   // Google Ads
  gbraid?: string;  // Google Ads iOS-privacy (app campaigns)
  wbraid?: string;  // Google Ads iOS-privacy (web-to-app)
  fbclid?: string;  // Meta (Facebook/Instagram) Ads
  ttclid?: string;  // TikTok Ads
}
```

Click identifiers are cross-site advertising identifiers, not personal data — they are captured for attribution only and are **never** written to the console or any log, in any mode. The field is omitted entirely when no click identifier is present on the landing URL.

### `PAGE_VIEW`

Navigation and page view tracking.

**Additional properties:**

```typescript
{
  page_view?: {
    referrer?: string;  // Previous page URL (sensitive query params removed)
    title?: string;     // Document title
  };
  from_page_url?: string; // Previous page URL for SPA navigation
}
```

The full URL is always carried on the event envelope (`page_url`). The optional `page_view` block only contains `referrer` and `title` and is omitted entirely when both are empty.

**Captured when:**

- Initial page load
- SPA route changes (History API, hash changes)
- Manual `history.pushState()` / `history.replaceState()`

**Throttling:** 1 second (configurable via `pageViewThrottleMs`).

---

### `CLICK`

User click interactions.

**Additional properties:**

```typescript
{
  click_data: {
    x: number;        // Absolute X coordinate (px)
    y: number;        // Absolute Y coordinate (px)
    tag: string;      // HTML tag name (lowercase)
    id?: string;      // Element ID attribute (PII-sanitized)
    class?: string;   // Element class attribute (PII-sanitized)
    text?: string;    // Element text content (truncated, PII-sanitized)
    href?: string;    // Link href (anchors only, sensitive query params removed)
  };
}
```

**Privacy features:**

- Never captures values from `<input>`, `<textarea>`, `<select>`
- Respects `data-tlog-ignore` on the clicked element or any ancestor
- Sanitizes text, `id`, and `class` for PII (emails, phones, credit cards, IBANs, API keys, bearer tokens, connection-string passwords)
- Strips sensitive query parameters from `href` (same deny-list as `page_url`, extended via `sensitiveQueryParams`); relative hrefs keep their relative form

**Throttling:** 300 ms per element signature (configurable via `clickThrottleMs`).

---

### `SCROLL`

Scroll depth and direction tracking, per scrollable container.

**Additional properties:**

```typescript
{
  scroll_data: {
    depth: number;              // Current scroll depth (0-100%)
    direction: 'up' | 'down';   // Scroll direction
    container_selector: string; // CSS selector of the scrolled container (or 'window')
  };
}
```

**Features:**

- Tracks the window and any auto-detected scrollable containers
- Per-container debouncing (250 ms)
- Guardrails: min 10px position delta, min 5% depth change, min 500ms inter-event interval, max 120 events per session

---

### `SESSION_START`

Session initialization event.

**No additional properties** (only base properties).

**Captured when:**

- First page load in session
- Session timeout expires and a new session begins
- Cross-tab sync receives a new session ID

**Notes:**

- Session ID accessible via `queue.session_id` in `'queue'` events
- Not duplicated on session recovery from `localStorage` / `sessionStorage`
- The server infers session **end** from the last event timestamp — there is no `SESSION_END` event

---

### `CUSTOM`

Business-specific custom events.

**Additional properties:**

```typescript
{
  custom_event: {
    name: string;
    metadata?: Record<string, MetadataType> | Record<string, MetadataType>[];
  };
}
```

**Example:**

```typescript
tracelog.event('product_viewed', { productId: 'abc-123', price: 299.99 });
// →
// {
//   type: 'custom',
//   custom_event: {
//     name: 'product_viewed',
//     metadata: { productId: 'abc-123', price: 299.99 },
//   },
// }
```

---

### `WEB_VITALS`

Core Web Vitals performance metrics.

**Additional properties:**

```typescript
{
  web_vitals: {
    type: 'LCP' | 'CLS' | 'INP' | 'FCP' | 'TTFB';
    value: number;
  };
}
```

| Metric | Description               | Unit            |
|--------|---------------------------|-----------------|
| `LCP`  | Largest Contentful Paint  | milliseconds    |
| `FCP`  | First Contentful Paint    | milliseconds    |
| `CLS`  | Cumulative Layout Shift   | unitless (0–1+) |
| `INP`  | Interaction to Next Paint | milliseconds    |
| `TTFB` | Time to First Byte        | milliseconds    |

Filtering is controlled by `webVitalsMode` and `webVitalsThresholds`.

---

### `ERROR`

JavaScript errors and unhandled promise rejections.

**Additional properties:**

```typescript
{
  error_data: {
    type: 'js_error' | 'promise_rejection';
    message: string;     // Truncated and PII-sanitized
    filename?: string;
    line?: number;
    column?: number;
    stack?: string;      // Truncated and PII-sanitized
  };
}
```

**Privacy features:**

- Error messages and stack traces are truncated and sanitized for PII
- Respects `errorSampling`
- Burst suppression: identical errors within a short window are coalesced

---

## Event Emitters

### `'event'` emitter

Fires for every individual event captured.

**Callback signature:**

```typescript
(event: EventData) => void
```

**Example:**

```typescript
tracelog.on('event', (event) => {
  if (event.type === 'click') {
    console.log('Clicked:', event.click_data?.tag);
  }

  if (event.type === 'custom') {
    console.log('Custom event:', event.custom_event?.name);
  }
});
```

---

### `'queue'` emitter

Fires when events are batched and ready to send.

**Callback signature:**

```typescript
(queue: EventsQueue) => void
```

**`EventsQueue` structure:**

```typescript
interface EventsQueue {
  user_id: string;
  session_id: string;
  device: 'mobile' | 'tablet' | 'desktop';
  events: EventData[];
  global_metadata?: Record<string, MetadataType>;
  identify?: { userId: string; traits?: Record<string, string> };
}
```

**Example:**

```typescript
tracelog.on('queue', (batch) => {
  console.log('Batch ready:', {
    sessionId: batch.session_id,
    userId: batch.user_id,
    device: batch.device,
    eventCount: batch.events.length,
  });

  // Forward to a custom destination (in addition to TraceLog SaaS, if configured)
  fetch('https://api.example.com/collect', {
    method: 'POST',
    body: JSON.stringify(batch),
  });
});
```

**Batching rules:**

- Fires every **10 seconds** OR when **50 events** accumulate (whichever comes first)
- When `integrations.tracelog` is configured, the same batch is sent to the SaaS endpoint
- Use this emitter to fan out batches to additional destinations

---

## TypeScript Types

### Core types

```typescript
import {
  // Config
  Config,
  WebVitalsMode,

  // Events
  EventType,
  EventData,
  ScrollData,
  ClickData,
  CustomEventData,
  WebVitalsData,
  ErrorData,
  PageViewData,
  UTM,
  ClickIds,

  // Emitters
  EmitterEvent,
  EmitterCallback,
  EmitterMap,

  // Queue
  EventsQueue,
  IdentifyData,

  // Common
  MetadataType,
  InitResult,
  EventOptions,
} from '@tracelog/lib';
```

### `MetadataType`

```typescript
type MetadataType = string | number | boolean | string[] | NestedObject;
```

Custom-event metadata supports primitives, string arrays, and nested objects (up to 10 levels). Functions, symbols, and circular references are rejected by validation.

---

## Error Handling

### Initialization errors

```typescript
try {
  await tracelog.init();
} catch (error) {
  console.error('TraceLog init failed:', error);
  // App continues without tracking
}
```

**Common causes:**

- Initialization timeout
- Invalid configuration (e.g., `localhost` host with `integrations.tracelog` **and** `firstParty: true`)
- Browser API unavailable

---

### Event errors

```typescript
try {
  tracelog.event('example', { key: 'value' });
} catch (error) {
  console.error('Event failed:', error);
}
```

**Common causes:**

- Called before `init()`
- Called during `destroy()`
- Custom-event validation failure in QA mode

---

### Network errors

TraceLog uses a retry-first, then persistence-based recovery model:

| Response                 | In-session retries                                                      | Persistence                                   |
|--------------------------|-------------------------------------------------------------------------|-----------------------------------------------|
| **2xx**                  | N/A (success)                                                           | Events removed from queue                     |
| **4xx (except 408/429)** | None (permanent)                                                        | Events discarded immediately                  |
| **408**                  | Up to 2 retries with backoff                                            | Persist after exhausting retries              |
| **429**                  | None — arms 60s cooldown (mirrored to localStorage, shared across tabs) | Persist immediately                           |
| **5xx**                  | Up to 2 retries with backoff                                            | Persist after exhausting retries              |
| **Network failure**      | Up to 2 retries with backoff                                            | Persist after exhausting retries              |
| **Timeout**              | Up to 2 retries with backoff                                            | Persist after exhausting retries              |

**Retry strategy:**

- Max retries: 2 additional attempts (3 total)
- Backoff formula: `100ms * (2 ^ attempt) + random(0–100ms)`
- Delays: attempt 1 → 2: 200–300 ms; attempt 2 → 3: 400–500 ms
- Jitter: random 0–100 ms added to prevent thundering herd

**Circuit breaker:** after `MAX_CONSECUTIVE_NETWORK_FAILURES` consecutive network-level failures (DNS, connection refused), the sender opens its circuit and skips further requests until `CIRCUIT_BREAKER_COOLDOWN_MS` elapses. A single probe request is then allowed (half-open state) before fully closing.

**Recovery flow:**

1. Page loads → check `localStorage` for failed events
2. Wait for session initialization
3. Retry sending failed events (once per page; no in-session retries on recovery)
4. Success → clear from `localStorage`
5. Fail → re-persist (with incremented `recoveryFailures` counter) for next page
6. After `MAX_RECOVERY_FAILURES` attempts, persisted events are discarded to prevent an infinite loop against an unreachable backend

**Expiration:** failed events expire after **2 hours** in `localStorage`. Prevents stale data accumulation.

**Multi-tab protection:** a 1-second window prevents two tabs from re-sending the same persisted batch simultaneously.

**Idempotency.** Every batch carries `_metadata.idempotency_token` (deterministic FNV-1a hash of sorted event IDs, salted by `user_id` and `session_id`). The same retried batch produces the same token, so the backend can dedupe retries server-side.

---

## Global Disable

Disable TraceLog entirely (no initialization):

```typescript
window.__traceLogDisabled = true;
```

**Use cases:**

- User opt-out (set before the library loads)
- Bot detection
- Development environments

---

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

**Graceful degradation:**

- BroadcastChannel (cross-tab sync) — falls back to localStorage-only
- `sendBeacon` (page unload) — falls back to async `fetch` with `keepalive: true`
- `performance.now()` — falls back to `Date.now()` (no monotonic-clock protection)
- `IntersectionObserver` — not currently required by any handler

---

## Resources

- [README](./README.md)
- [Best Practices](./BEST_PRACTICES.md)
- [Security Guide](./SECURITY.md)
- [Changelog](./CHANGELOG.md)
- [Handlers Documentation](./src/handlers/README.md)
- [Managers Documentation](./src/managers/README.md)

---

**License:** MIT
