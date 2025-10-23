# TraceLog API Reference

Complete API documentation for TraceLog library. For quick start and examples, see [README.md](./README.md).

## Table of Contents

1. [Core API](#core-api)
2. [Consent Management](#consent-management)
3. [Configuration](#configuration)
4. [Event Types](#event-types)
5. [Event Emitters](#event-emitters)
6. [TypeScript Types](#typescript-types)
7. [Error Handling](#error-handling)

---

## Core API

### `init(config?: Config): Promise<void>`

Initializes TraceLog and begins tracking. Safe to call in SSR environments (no-ops in Node.js).

**Parameters:**
- `config` (optional): Configuration object. See [Configuration](#configuration) section.

**Returns:** Promise that resolves when initialization completes (max 5s timeout).

**Throws:**
- `Error` if initialization fails or times out
- `Error` if called multiple times (subsequent calls are no-ops)

**Examples:**

```typescript
// Standalone mode (no backend)
await tracelog.init();

// With TraceLog SaaS
await tracelog.init({
  integrations: {
    tracelog: { projectId: 'your-project-id' }
  }
});

// With custom backend
await tracelog.init({
  integrations: {
    custom: {
      collectApiUrl: 'https://api.example.com/collect',
      allowHttp: false  // Only true for testing
    }
  }
});

// SSR-safe usage (Angular/Next.js/Nuxt)
if (typeof window !== 'undefined') {
  await tracelog.init();
}
```

**Initialization Order Best Practice:**

For optimal setup, follow this order to ensure no events are missed:

```typescript
// 1. Register listeners FIRST
tracelog.on('event', handler);

// 2. Set transformers SECOND (if using custom backend)
tracelog.setTransformer('beforeSend', transformFn);

// 3. Initialize LAST
await tracelog.init();
```

**Why?** Events like `SESSION_START` and `PAGE_VIEW` fire immediately during `init()`. Registering listeners and transformers beforehand ensures you capture and transform these initial events.

**Notes:**
- Automatically starts tracking page views, clicks, scrolls, sessions, and performance
- Recovers any failed events from previous sessions (localStorage)
- Safe to call multiple times (idempotent)

---

### `event(name: string, metadata?: Record<string, MetadataType> | Record<string, MetadataType>[]): void`

Sends a custom event for business-specific tracking.

**Parameters:**
- `name` (required): Event name identifier (e.g., `'product_viewed'`, `'checkout_completed'`)
- `metadata` (optional): Event data as object or array of objects

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
  category: 'electronics'
});

// With array metadata
tracelog.event('cart_updated', [
  { productId: 'abc-123', quantity: 2 },
  { productId: 'def-456', quantity: 1 }
]);

// E-commerce example
tracelog.event('purchase_completed', {
  orderId: 'ord-789',
  total: 599.98,
  currency: 'USD',
  items: 3
});
```

**Rate Limiting:**
- Maximum 60 events per minute per event name (configurable via `maxSameEventPerMinute`)
- Prevents infinite loops and accidental spam

**Privacy:**
- **You are responsible** for sanitizing metadata
- Avoid passing PII (emails, phones, credit cards) in metadata
- Use generic identifiers instead of user names

---

### `on<K extends EmitterEvent>(event: K, callback: EmitterCallback<EmitterMap[K]>): void`

Subscribes to TraceLog events for real-time event consumption.

**Parameters:**
- `event`: Event type to subscribe to (`'event'`, `'queue'`, or `'consent-changed'`)
- `callback`: Function called when event fires

**Event Types:**
- `'event'`: Fired for each individual event captured (real-time)
- `'queue'`: Fired when events are batched and ready to send (every 10s or 50 events)
- `'consent-changed'`: Fired when consent state changes for any integration (see [Consent Management](#consent-management))

**Examples:**

```typescript
// Listen to individual events
tracelog.on('event', (event) => {
  console.log('Event captured:', event.type, event);

  // Access event data based on type
  if (event.type === 'click') {
    console.log('Clicked element:', event.click_data?.tag);
  }
});

// Listen to event batches
tracelog.on('queue', (batch) => {
  console.log('Batch ready:', batch.events.length, 'events');
  console.log('Session ID:', batch.session_id);
});

// Listen to consent changes (reactive UI)
tracelog.on('consent-changed', (consentState) => {
  console.log('Consent updated:', consentState);
  // { google: true, custom: false, tracelog: true }
  
  // Update UI automatically
  updatePrivacySettings(consentState);
});

// Filter specific event types
tracelog.on('event', (event) => {
  if (event.type === 'page_view') {
    console.log('Page viewed:', event.page_view?.pathname);
  }
});

// Send events to custom analytics
tracelog.on('event', (event) => {
  window.myAnalytics?.track(event.type, event);
});
```

**Notes:**
- Register listeners **before** `init()` to catch initial events (e.g., `SESSION_START`, `PAGE_VIEW`)
- Listeners registered before/during init are buffered and attached after initialization
- Safe to call in SSR (no-ops in Node.js)

---

### `off<K extends EmitterEvent>(event: K, callback: EmitterCallback<EmitterMap[K]>): void`

Unsubscribes from TraceLog events.

**Parameters:**
- `event`: Event type to unsubscribe from
- `callback`: Exact callback function reference used in `on()`

**Example:**

```typescript
const handler = (event) => {
  console.log('Event:', event.type);
};

tracelog.on('event', handler);

// Later...
tracelog.off('event', handler);
```

**Notes:**
- Must pass the **exact same function reference** used in `on()`
- Safe to call before initialization (removes from pending listeners)

---

### `isInitialized(): boolean`

Checks if TraceLog is currently initialized.

**Returns:** `true` if initialized, `false` otherwise

**Example:**

```typescript
if (tracelog.isInitialized()) {
  tracelog.event('app_ready');
}
```

---

### `destroy(): void`

Stops all tracking, cleans up listeners, and flushes pending events. Safe to call multiple times.

**Throws:**
- `Error` if destroy operation is already in progress

**Example:**

```typescript
// On consent revoke
tracelog.destroy();

// In framework cleanup hooks
onDestroy(() => {
  tracelog.destroy();
});
```

**Notes:**
- Sends any pending events with `sendBeacon()` (synchronous)
- Removes all event listeners
- Clears internal state
- After destroy, must call `init()` again to resume tracking

---

### `setQaMode(enabled: boolean): void`

Enables or disables QA (Quality Assurance) mode for debugging.

**Parameters:**
- `enabled`: `true` to enable, `false` to disable

**QA Mode Features:**
- Custom events logged to browser console
- Strict validation (throws errors instead of warnings)
- Session state visible in console
- Persistent across page reloads (sessionStorage)

**Examples:**

```typescript
// Enable QA mode
tracelog.setQaMode(true);

// Send test event (will be logged to console)
tracelog.event('test_event', { key: 'value' });

// Disable QA mode
tracelog.setQaMode(false);
```

**Alternative Activation via URL:**

```bash
# Enable
?tlog_mode=qa

# Disable
?tlog_mode=qa_off
```

**Notes:**
- QA mode custom events (via `tracelog.event()`) are:
  - **NOT sent to backend** (logged to console only)
  - **Still emitted to `on('event')` listeners** (for local testing)
  - Logged with strict validation (throws errors on invalid data)
- Automatic events (clicks, scrolls, page views, etc.) continue to be sent to backend normally
- URL parameter auto-removed after detection
- State persists in sessionStorage across page reloads

---

### `setTransformer(hook: TransformerHook, fn: (data: EventData | EventsQueue) => EventData | EventsQueue | null): void`

Sets a transformer function to modify events at runtime before sending to integrations.

**Parameters:**
- `hook`: Transformer hook type (`'beforeSend'` or `'beforeBatch'`)
- `fn`: Transformer function that receives event/batch data and returns transformed data or `null` to filter

**Throws:**
- `Error` if `fn` is not a function
- `Error` if called during `destroy()`

**Transformer Hooks:**

| Hook | Timing | Input | Applied To |
|------|--------|-------|------------|
| `beforeSend` | Per-event (before queueing) | `EventData` | Custom backend only |
| `beforeBatch` | Batch-level (before sending) | `EventsQueue` | Custom backend only |

**Integration Behavior:**
- **TraceLog SaaS (only)**: Transformers silently ignored (schema protection)
- **Custom Backend (only)**: Transformers applied as configured
- **Multi-Integration (SaaS + Custom)**: SaaS gets original events, custom gets transformed events
- **Google Analytics**: Transformers N/A (only forwards `tracelog.event()` calls as-is, no batching)

**Examples:**

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

**Error Handling:**
- Transformer exceptions are caught and logged
- Original event/batch used as fallback on error
- Returning `null` filters out the event/batch (intended behavior)
- Invalid return types logged as warnings, original data used

**Validation:**
- `beforeSend`: Only validates that `'type'` field exists (minimal check to distinguish from EventsQueue)
- `beforeBatch`: Only validates that `'events'` array exists (minimal check to distinguish from EventData)
- **Custom schemas fully supported** - transformers can return completely different structures for custom backends
- All other fields are optional to allow maximum flexibility

**Notes:**
- Only one transformer per hook (calling again replaces previous)
- Transformers NOT applied to TraceLog SaaS (schema protection)
- Use for data enrichment, filtering, or custom logic
- See [README.md Transformers section](./README.md#transformers) for detailed examples

---

### `removeTransformer(hook: TransformerHook): void`

Removes a previously set transformer function.

**Parameters:**
- `hook`: Transformer hook type to remove (`'beforeSend'` or `'beforeBatch'`)

**Throws:**
- `Error` if called during `destroy()`

**Example:**

```typescript
// Remove specific transformer
tracelog.removeTransformer('beforeSend');
tracelog.removeTransformer('beforeBatch');
```

**Notes:**
- Safe to call even if no transformer is set (doesn't throw if transformer doesn't exist)
- Transformers automatically cleared on `destroy()`

---

## Consent Management

TraceLog provides GDPR/CCPA-compliant consent management with granular control per integration. When `waitForConsent` is enabled, events are buffered until explicit consent is granted.

### `setConsent(integration: ConsentIntegration, granted: boolean): Promise<void>`

Grants or revokes consent for a specific integration or all integrations.

**Parameters:**
- `integration`: Integration identifier (`'google'`, `'custom'`, `'tracelog'`, or `'all'`)
- `granted`: `true` to grant consent, `false` to revoke

**Returns:** Promise that resolves when consent is applied and persisted

**Throws:**
- `Error` if called while TraceLog is destroyed or being destroyed
- `Error` if localStorage persistence fails (before init only)

**Examples:**

```typescript
// Grant consent for Google Analytics
await tracelog.setConsent('google', true);

// Grant consent for custom backend
await tracelog.setConsent('custom', true);

// Grant consent for TraceLog SaaS
await tracelog.setConsent('tracelog', true);

// Grant consent for ALL configured integrations
await tracelog.setConsent('all', true);

// Revoke consent
await tracelog.setConsent('google', false);
```

**Consent Flow:**

```typescript
// 1. Initialize with consent waiting
await tracelog.init({
  waitForConsent: true,
  integrations: {
    google: { measurementId: 'G-XXXXXX' },
    custom: { collectApiUrl: 'https://api.example.com' }
  }
});
// Events are buffered, not sent yet

// 2. User accepts cookie banner
await tracelog.setConsent('all', true);
// All buffered events sent retroactively

// 3. User changes preferences later
await tracelog.setConsent('google', false);
// Google Analytics stops receiving events
```

**Before Init:**

```typescript
// Can be called before init() - consent is persisted to localStorage
await tracelog.setConsent('google', true);

// Later, consent is auto-loaded
await tracelog.init({ waitForConsent: true });
```

**Notes:**
- Consent is persisted to `localStorage` with 365-day expiration
- When granted, buffered events are sent retroactively (sorted with SESSION_START first)
- When revoked, stops future sends and **clears buffered events** for that integration
- Emits `'consent-changed'` event for reactive UI updates
- Cross-tab synchronized via StorageEvent
- Safe to call before or after `init()`

**Event Cleanup on Revoke:**
When consent is revoked, buffered events waiting for that integration are automatically removed from memory:
- Events exclusively for revoked integration are discarded
- Events needed by other integrations are preserved
- Memory freed immediately for better performance

---

### `hasConsent(integration: ConsentIntegration): boolean`

Checks if consent has been granted for a specific integration.

**Parameters:**
- `integration`: Integration identifier (`'google'`, `'custom'`, `'tracelog'`, or `'all'`)

**Returns:** `true` if consent granted, `false` otherwise

**Examples:**

```typescript
// Check specific integration
if (tracelog.hasConsent('google')) {
  console.log('Google Analytics enabled');
}

// Check if ALL integrations have consent
if (tracelog.hasConsent('all')) {
  console.log('Full tracking enabled');
}

// Conditional tracking
if (tracelog.hasConsent('custom')) {
  tracelog.event('premium_feature_used');
}
```

**Before Init:**

```typescript
// Reads directly from localStorage if not initialized
const hasConsent = tracelog.hasConsent('google');
```

---

### `getConsentState(): ConsentState`

Retrieves the current consent state for all integrations.

**Returns:** Object with consent status for each integration

```typescript
interface ConsentState {
  google: boolean;
  custom: boolean;
  tracelog: boolean;
}
```

**Example:**

```typescript
const state = tracelog.getConsentState();

console.log('Consent State:', state);
// {
//   google: true,
//   custom: false,
//   tracelog: true
// }

// Build privacy dashboard
function PrivacySettings() {
  const consent = tracelog.getConsentState();
  
  return (
    <div>
      <Toggle
        checked={consent.google}
        onChange={(v) => tracelog.setConsent('google', v)}
      >
        Google Analytics
      </Toggle>
      
      <Toggle
        checked={consent.custom}
        onChange={(v) => tracelog.setConsent('custom', v)}
      >
        Custom Analytics
      </Toggle>
    </div>
  );
}
```

**Before Init:**

```typescript
// Reads directly from localStorage if not initialized
const state = tracelog.getConsentState();
```

---

## Configuration

### `Config` Interface

```typescript
interface Config {
  sessionTimeout?: number;
  globalMetadata?: Record<string, MetadataType>;
  sensitiveQueryParams?: string[];
  errorSampling?: number;
  samplingRate?: number;
  disabledEvents?: Array<'scroll' | 'web_vitals' | 'error'>;
  primaryScrollSelector?: string;
  viewport?: ViewportConfig;
  pageViewThrottleMs?: number;
  clickThrottleMs?: number;
  maxSameEventPerMinute?: number;
  waitForConsent?: boolean;
  maxConsentBufferSize?: number;
  webVitalsMode?: WebVitalsMode;
  webVitalsThresholds?: Partial<Record<WebVitalType, number>>;
  integrations?: {
    tracelog?: { projectId: string };
    custom?: { collectApiUrl: string; allowHttp?: boolean };
    google?: { measurementId?: string; containerId?: string };
  };
}
```

### Session Configuration

#### `sessionTimeout`
- **Type:** `number` (milliseconds)
- **Default:** `900000` (15 minutes)
- **Description:** Session inactivity timeout

```typescript
await tracelog.init({
  sessionTimeout: 1800000  // 30 minutes
});
```

#### `globalMetadata`
- **Type:** `Record<string, MetadataType>`
- **Default:** `undefined`
- **Description:** Metadata appended to every event

```typescript
await tracelog.init({
  globalMetadata: {
    app_version: '1.2.3',
    environment: 'production',
    user_plan: 'pro'
  }
});
```

---

### Privacy Configuration

#### `sensitiveQueryParams`
- **Type:** `string[]`
- **Default:** `['token', 'auth', 'key', 'password', 'secret', 'api_key', 'apikey', 'access_token', 'refresh_token', 'session', 'sessionid', 'jwt', 'bearer', 'code', 'state', 'nonce']`
- **Description:** Query parameters to remove from tracked URLs. Your custom params are **merged** with defaults.

```typescript
await tracelog.init({
  sensitiveQueryParams: ['affiliate_id', 'promo_code']
  // Result: default params + ['affiliate_id', 'promo_code']
});
```

#### `samplingRate`
- **Type:** `number` (0-1)
- **Default:** `1` (100%)
- **Description:** Client-side event sampling rate

```typescript
await tracelog.init({
  samplingRate: 0.5  // Track 50% of events
});
```

#### `errorSampling`
- **Type:** `number` (0-1)
- **Default:** `1` (100%)
- **Description:** Client-side error event sampling rate

```typescript
await tracelog.init({
  errorSampling: 0.1  // Track 10% of errors
});
```

#### `waitForConsent`
- **Type:** `boolean`
- **Default:** `false`
- **Description:** Wait for explicit consent before initializing integrations and sending events. When enabled, events are buffered until `setConsent()` is called.

```typescript
// Enable consent mode
await tracelog.init({
  waitForConsent: true,
  integrations: {
    google: { measurementId: 'G-XXXXXX' },
    custom: { collectApiUrl: 'https://api.example.com' }
  }
});
// Events buffered, not sent yet

// User accepts consent
await tracelog.setConsent('all', true);
// All buffered events sent retroactively
```

**Key Features:**
- Events buffered in memory until consent granted
- Retroactive send when consent granted (SESSION_START sent first)
- Integration-specific control (e.g., consent for Google but not Custom)
- Persisted to localStorage with 365-day expiration
- Cross-tab synchronized via StorageEvent
- Consent can be set before or after `init()`

**See Also:** [Consent Management](#consent-management) section for `setConsent()`, `hasConsent()`, and `getConsentState()` methods.

#### `maxConsentBufferSize`
- **Type:** `number` (positive integer)
- **Default:** `500`
- **Description:** Maximum events to buffer while waiting for consent. Older events discarded (FIFO) when limit reached, preserving critical `SESSION_START` events.

```typescript
await tracelog.init({
  waitForConsent: true,
  maxConsentBufferSize: 1000  // Buffer up to 1000 events
});
```

**Overflow Behavior:**
- FIFO (First In, First Out) eviction when limit reached
- `SESSION_START` events preserved (critical for session context)
- Non-critical events removed first (e.g., clicks, scrolls)
- Warning logged when buffer overflows

#### `disabledEvents`
- **Type:** `Array<'scroll' | 'web_vitals' | 'error'>`
- **Default:** `[]` (all events enabled)
- **Description:** Disable specific auto-tracked event types. Core events (`PAGE_VIEW`, `CLICK`, `SESSION_*`) cannot be disabled as they are essential for analytics.

```typescript
// Disable scroll tracking only
await tracelog.init({
  disabledEvents: ['scroll']
});

// Disable multiple event types
await tracelog.init({
  disabledEvents: ['scroll', 'web_vitals', 'error']
});

// Default behavior (all events enabled)
await tracelog.init({
  disabledEvents: []
});
```

**Use Cases:**
- Reduce bandwidth and backend costs by eliminating high-frequency events
- Already using dedicated error tracking (Sentry, Datadog)
- Performance optimization on complex pages with heavy scroll interaction
- Minimize data collection for privacy compliance
- Only need core analytics (page views, clicks, sessions)

**Impact:**
- `'scroll'`: No scroll depth, velocity, or engagement data
- `'web_vitals'`: No Core Web Vitals (LCP, INP, CLS, FCP, TTFB, LONG_TASK)
- `'error'`: No JavaScript errors or promise rejection tracking

---

### Performance Configuration

#### `webVitalsMode`
- **Type:** `'all' | 'needs-improvement' | 'poor'`
- **Default:** `'needs-improvement'`
- **Description:** Controls which Web Vitals metrics are tracked

```typescript
await tracelog.init({
  webVitalsMode: 'all'  // Track all metrics for trend analysis
});
```

**Mode Thresholds:**

| Metric | 'all' | 'needs-improvement' | 'poor' |
|--------|-------|---------------------|--------|
| LCP | All values | > 2500ms | > 4000ms |
| FCP | All values | > 1800ms | > 3000ms |
| CLS | All values | > 0.1 | > 0.25 |
| INP | All values | > 200ms | > 500ms |
| TTFB | All values | > 800ms | > 1800ms |

#### `webVitalsThresholds`
- **Type:** `Partial<Record<WebVitalType, number>>`
- **Default:** Core Web Vitals standards
- **Description:** Custom thresholds (overrides mode defaults)

```typescript
await tracelog.init({
  webVitalsMode: 'needs-improvement',
  webVitalsThresholds: {
    LCP: 3000,  // Stricter than default 2500ms
    FCP: 2500,  // Stricter than default 1800ms
    CLS: 0.15   // Stricter than default 0.1
  }
});
```

---

### Interaction Configuration

#### `pageViewThrottleMs`
- **Type:** `number` (milliseconds)
- **Default:** `1000` (1 second)
- **Description:** Throttle duration for page view events (prevents rapid SPA navigation spam)

```typescript
await tracelog.init({
  pageViewThrottleMs: 500  // 500ms throttle
});
```

#### `clickThrottleMs`
- **Type:** `number` (milliseconds)
- **Default:** `300` (300ms)
- **Description:** Throttle duration for click events (prevents double-clicks and spam)

```typescript
await tracelog.init({
  clickThrottleMs: 200  // 200ms throttle
});
```

#### `maxSameEventPerMinute`
- **Type:** `number`
- **Default:** `60`
- **Description:** Maximum number of same custom event name per minute (rate limiting)

```typescript
await tracelog.init({
  maxSameEventPerMinute: 30  // Allow 30 events/min max per name
});
```

---

### Scroll Configuration

#### `primaryScrollSelector`
- **Type:** `string` (CSS selector)
- **Default:** Auto-detected (main content)
- **Description:** Manually override primary scroll container detection

```typescript
await tracelog.init({
  primaryScrollSelector: '#main-content'
});
```

---

### Viewport Configuration

#### `viewport`
- **Type:** `ViewportConfig`
- **Default:** `undefined` (disabled)
- **Description:** Element visibility tracking configuration

```typescript
interface ViewportConfig {
  elements: Array<{
    selector: string;      // CSS selector
    id?: string;           // Optional unique ID
    name?: string;         // Optional display name
  }>;
  threshold?: number;      // Visibility ratio (0-1), default: 0.5
  minDwellTime?: number;   // Milliseconds visible, default: 1000
}
```

**Example:**

```typescript
await tracelog.init({
  viewport: {
    elements: [
      {
        selector: '.cta-button',
        id: 'pricing-cta',
        name: 'Pricing CTA Button'
      },
      {
        selector: '#hero-section',
        id: 'hero',
        name: 'Hero Section'
      }
    ],
    threshold: 0.5,      // 50% visible
    minDwellTime: 1000   // 1 second dwell time
  }
});
```

**Notes:**
- Fires `VIEWPORT_VISIBLE` event when conditions met
- Uses IntersectionObserver (graceful degradation if unavailable)
- Tracks visibility ratio and actual dwell time

---

### Integration Configuration

#### `integrations.tracelog`
- **Type:** `{ projectId: string }`
- **Description:** TraceLog SaaS integration

```typescript
await tracelog.init({
  integrations: {
    tracelog: {
      projectId: 'your-project-id'
    }
  }
});
```

#### `integrations.custom`
- **Type:** `{ collectApiUrl: string; allowHttp?: boolean }`
- **Description:** Custom backend integration

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

**Notes:**
- `allowHttp: true` **only for local testing** (e.g., `http://localhost:8080`)
- Production must use HTTPS

#### `integrations.google`
- **Type:** `{ measurementId?: string; containerId?: string }`
- **Description:** Google Analytics 4 / Google Tag Manager integration
- **Note:** At least one of `measurementId` or `containerId` is required

```typescript
// Option 1: GA4 only
await tracelog.init({
  integrations: {
    google: { measurementId: 'G-XXXXXXXXXX' }
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
      measurementId: 'G-XXXXXXXXXX',
      containerId: 'GTM-XXXXXXX'
    }
  }
});
```

**Supported Formats:**
- **measurementId**: `G-XXXXXXXXXX` (GA4), `AW-XXXXXXXXXX` (Google Ads), `UA-XXXXXXXXXX` (Universal Analytics - legacy)
- **containerId**: `GTM-XXXXXXX` (Google Tag Manager)

**How it works:**
- **GA4 / Google Ads / UA**: Loads gtag.js and configures with user_id
- **GTM**: Loads gtm.js and initializes dataLayer (tags configured in GTM UI)
- **Priority**: If both IDs provided, GTM container ID takes priority for script loading
- **Auto-detection**: Reuses existing gtag/GTM if already loaded on your site
- **Event forwarding (default)**: Only `tracelog.event()` custom events are forwarded via `gtag('event', ...')`
- **Event forwarding (configurable)**: Use `forwardEvents` option to forward specific event types or `'all'` events
- **Automatic events**: Clicks, scrolls, page views, etc. are NOT forwarded by default (handled locally)

**Example - Custom event forwarding:**

```typescript
// Forward specific event types
await tracelog.init({
  integrations: {
    google: {
      measurementId: 'G-XXXXXXXXXX',
      forwardEvents: ['PAGE_VIEW', 'CLICK']  // Forward page views and clicks
    }
  }
});

// Forward all events
await tracelog.init({
  integrations: {
    google: {
      measurementId: 'G-XXXXXXXXXX',
      forwardEvents: 'all'  // Forward all event types to GA
    }
  }
});
```

**Example with GTM:**

```typescript
await tracelog.init({
  integrations: {
    google: { containerId: 'GTM-ABC123' }
  }
});

// Custom events are automatically forwarded to GTM's dataLayer via gtag
tracelog.event('button_click', { button_id: 'cta' });
// ↓ Pushed to dataLayer as gtag('event', 'button_click', { button_id: 'cta' })
```

**Important GTM Configuration Notes:**

When using GTM with TraceLog:

1. **TraceLog sends events via `gtag('event', ...)`** - These events are pushed to GTM's dataLayer
2. **You must configure tags in your GTM container** to process these events:
   - Add a **GA4 Configuration tag** with your measurement ID (if using GA4)
   - Add **GA4 Event tags** to listen for custom events from TraceLog
   - Configure triggers as needed in the GTM UI
3. **GTM manages the dataLayer and gtag function** - TraceLog detects and reuses existing GTM installations
4. **Automatic events** (clicks, scrolls, page views) are NOT sent to GTM by default - use event listeners if you need them:

```typescript
// Forward all TraceLog events to GTM (optional)
tracelog.on('event', (event) => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    'event': 'tracelog_event',
    'event_type': event.type,
    'event_data': event
  });
});
```

#### Multi-Integration (TraceLog SaaS + Custom Backend)

```typescript
await tracelog.init({
  integrations: {
    tracelog: { projectId: 'your-project-id' },           // TraceLog analytics dashboard
    custom: { collectApiUrl: 'https://warehouse.com' }    // Custom data warehouse
  }
});

// Events sent to BOTH endpoints with:
// ✅ Independent error handling (4xx/5xx per integration)
// ✅ Independent retry/persistence (separate localStorage keys)
// ✅ Parallel sending (non-blocking)
```

**Use Cases:**
- **Analytics + Data Warehouse:** Send to TraceLog for dashboards + custom warehouse for long-term storage
- **Compliance:** Send to both production analytics and compliance logging system
- **Migration:** Dual-send during migration from custom backend to TraceLog SaaS

**Technical Details:**

| Feature | Behavior |
|---------|----------|
| **Error Handling** | Each integration handles 4xx (permanent) and 5xx (temporary) errors independently |
| **Persistence** | Separate localStorage keys: `tlog:queue:{userId}:saas`, `tlog:queue:{userId}:custom` |
| **Recovery** | Failed events recovered independently per integration on next page load. Recovery occurs automatically during `init()` on the subsequent page navigation. |
| **Sending** | Async: Parallel with `Promise.allSettled()`, Sync (sendBeacon): All must succeed |
| **Transformers** | SaaS receives **original events**, custom receives **transformed events** (if transformers configured) |

---

## Event Types

All events share base properties plus type-specific data.

### Base Event Properties

Every event includes:

```typescript
interface EventData {
  id: string;              // Unique event ID
  type: EventType;         // Event type enum
  page_url: string;        // Current page URL (sanitized)
  timestamp: number;       // Unix timestamp (ms)
  referrer?: string;       // HTTP referrer header
  utm?: UTM;              // UTM campaign parameters
}
```

### `PAGE_VIEW`

Navigation and page view tracking.

**Additional Properties:**
```typescript
{
  page_view: {
    referrer?: string;   // Previous page URL
    title?: string;      // Document title
    pathname?: string;   // URL pathname
    search?: string;     // URL query string
    hash?: string;       // URL hash fragment
  },
  from_page_url?: string  // Previous page for SPA navigation
}
```

**Captured When:**
- Initial page load
- SPA route changes (History API, hash changes)
- Manual `history.pushState()` / `history.replaceState()`

**Throttling:** 1 second (configurable via `pageViewThrottleMs`)

---

### `CLICK`

User click interactions.

**Additional Properties:**
```typescript
{
  click_data: {
    x: number;                      // Absolute X coordinate (px)
    y: number;                      // Absolute Y coordinate (px)
    relativeX: number;              // Relative X within element (0-1)
    relativeY: number;              // Relative Y within element (0-1)
    id?: string;                    // Element ID attribute
    class?: string;                 // Element class attribute
    tag?: string;                   // HTML tag name
    text?: string;                  // Element text content (truncated)
    href?: string;                  // Link href (for <a> elements)
    title?: string;                 // Element title attribute
    alt?: string;                   // Image alt text (for <img>)
    role?: string;                  // ARIA role attribute
    ariaLabel?: string;             // ARIA label attribute
    dataAttributes?: Record<string, string>; // Custom data-* attributes
  }
}
```

**Privacy Features:**
- Never captures values from `<input>`, `<textarea>`, `<select>`
- Respects `data-tlog-ignore` attribute
- Sanitizes text for PII (emails, phones, credit cards, etc.)
- Coordinates rounded to 10px for privacy

**Throttling:** 300ms (configurable via `clickThrottleMs`)

---

### `SCROLL`

Scroll depth and behavior tracking.

**Additional Properties:**
```typescript
{
  scroll_data: {
    depth: number;                  // Current scroll depth (0-100%)
    direction: 'up' | 'down';       // Scroll direction
    container_selector: string;     // CSS selector of scrolled container
    is_primary: boolean;            // Whether this is the primary viewport scroll
    velocity: number;               // Scroll velocity (pixels/second)
    max_depth_reached: number;      // Maximum depth reached in session (0-100%)
  }
}
```

**Features:**
- Tracks multiple scroll containers
- Auto-detects primary scroll container (main content)
- Debounced to 250ms

**Filtering Primary Scroll:**
```typescript
tracelog.on('event', (event) => {
  if (event.type === 'scroll' && event.scroll_data.is_primary) {
    console.log('Main content scroll:', event.scroll_data.depth);
  }
});
```

---

### `SESSION_START`

Session initialization event.

**No Additional Properties** (only base properties)

**Captured When:**
- First page load in session
- Session timeout expires and new session begins
- Cross-tab sync receives new session ID

**Notes:**
- Session ID accessible via `queue.session_id` in `'queue'` event
- Not duplicated on session recovery (localStorage)

---

### `SESSION_END`

Session termination event.

**Additional Properties:**
```typescript
{
  session_end_reason: 'page_unload' | 'timeout' | 'manual'
}
```

**Captured When:**
- User navigates away (page unload)
- Session timeout expires
- Manual `destroy()` call

**Notes:**
- Sent synchronously via `sendBeacon()` to ensure delivery

---

### `CUSTOM`

Business-specific custom events.

**Additional Properties:**
```typescript
{
  custom_event: {
    name: string;                   // Event name identifier
    metadata?: Record<string, any> | Record<string, any>[]; // Event data
  }
}
```

**Example Event:**
```typescript
tracelog.event('product_viewed', {
  productId: 'abc-123',
  price: 299.99
});

// Results in:
{
  type: 'custom',
  custom_event: {
    name: 'product_viewed',
    metadata: {
      productId: 'abc-123',
      price: 299.99
    }
  }
}
```

---

### `WEB_VITALS`

Web performance metrics (Core Web Vitals).

**Additional Properties:**
```typescript
{
  web_vitals: {
    type: 'LCP' | 'CLS' | 'INP' | 'FCP' | 'TTFB' | 'LONG_TASK';
    value: number;  // Varies by type
  }
}
```

**Metric Details:**

| Type | Description | Value Unit |
|------|-------------|------------|
| `LCP` | Largest Contentful Paint | Milliseconds |
| `FCP` | First Contentful Paint | Milliseconds |
| `CLS` | Cumulative Layout Shift | Unitless (0-1+) |
| `INP` | Interaction to Next Paint | Milliseconds |
| `TTFB` | Time to First Byte | Milliseconds |
| `LONG_TASK` | Tasks exceeding 50ms | Milliseconds |

**Filtering:**
Controlled by `webVitalsMode` and `webVitalsThresholds` config.

---

### `ERROR`

JavaScript errors and promise rejections.

**Additional Properties:**
```typescript
{
  error_data: {
    type: 'js_error' | 'promise_rejection';
    message: string;      // Error message (sanitized for PII)
    filename?: string;    // Source file
    line?: number;        // Line number
    column?: number;      // Column number
  }
}
```

**Privacy Features:**
- Error messages sanitized for PII
- Respects `errorSampling` config

---

### `VIEWPORT_VISIBLE`

Element visibility tracking (requires `viewport` config).

**Additional Properties:**
```typescript
{
  viewport_data: {
    selector: string;         // CSS selector that matched
    id?: string;              // Optional unique ID (from config)
    name?: string;            // Optional display name (from config)
    dwellTime: number;        // Actual time visible (ms)
    visibilityRatio: number;  // Actual visibility ratio (0-1)
  }
}
```

**Example:**
```typescript
await tracelog.init({
  viewport: {
    elements: [{ selector: '.cta-button', id: 'cta', name: 'CTA Button' }],
    threshold: 0.5,
    minDwellTime: 1000
  }
});

// Event fired when conditions met:
{
  type: 'viewport_visible',
  viewport_data: {
    selector: '.cta-button',
    id: 'cta',
    name: 'CTA Button',
    dwellTime: 1234,          // Actual dwell time
    visibilityRatio: 0.87     // Actual visibility ratio
  }
}
```

---

## Event Emitters

### `'event'` Emitter

Fires for every individual event captured.

**Callback Signature:**
```typescript
(event: EventData) => void
```

**Example:**
```typescript
tracelog.on('event', (event) => {
  console.log('Event:', event.type);

  // Type-safe access to event-specific data
  if (event.type === 'click') {
    console.log('Clicked:', event.click_data?.tag);
  }

  if (event.type === 'page_view') {
    console.log('Page:', event.page_view?.pathname);
  }

  if (event.type === 'custom') {
    console.log('Custom event:', event.custom_event?.name);
  }
});
```

---

### `'queue'` Emitter

Fires when events are batched and ready to send to backend.

**Callback Signature:**
```typescript
(queue: EventsQueue) => void
```

**EventsQueue Structure:**
```typescript
interface EventsQueue {
  user_id: string;                                // Anonymous user ID (UUID)
  session_id: string;                             // Current session ID
  device: 'mobile' | 'tablet' | 'desktop';        // Device type
  events: EventData[];                            // Array of events in batch
  global_metadata?: Record<string, MetadataType>; // Global metadata (if configured)
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
    hasGlobalMetadata: !!batch.global_metadata
  });

  // Send to custom analytics
  fetch('https://api.example.com/collect', {
    method: 'POST',
    body: JSON.stringify(batch)
  });
});
```

**Batching Rules:**
- Fires every **10 seconds** OR when **50 events** accumulated (whichever comes first)
- Sent automatically to configured backend (if any)
- Use this emitter to send events to additional analytics platforms

---

## TypeScript Types

### Core Types

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
  ViewportEventData,
  UTM,

  // Emitters
  EmitterEvent,
  EmitterCallback,
  EmitterMap,

  // Queue
  EventsQueue,

  // Common
  MetadataType
} from '@tracelog/lib';
```

### `MetadataType`

Allowed types for metadata values:

```typescript
type MetadataType = string | number | boolean | null | undefined;
```

**Restrictions:**
- No nested objects
- No arrays
- No functions
- No symbols

**Valid Examples:**
```typescript
tracelog.event('example', {
  stringValue: 'hello',
  numberValue: 42,
  booleanValue: true,
  nullValue: null,
  undefinedValue: undefined
});
```

**Invalid Examples:**
```typescript
// ❌ Nested objects not allowed
tracelog.event('example', {
  nested: { key: 'value' }  // Will be rejected
});

// ❌ Arrays not allowed (except as top-level metadata)
tracelog.event('example', {
  items: [1, 2, 3]  // Will be rejected
});

// ✅ Arrays allowed at top level
tracelog.event('example', [
  { id: 1 },
  { id: 2 }
]);
```

---

## Error Handling

### Initialization Errors

```typescript
try {
  await tracelog.init();
} catch (error) {
  console.error('TraceLog init failed:', error);
  // App continues without tracking
}
```

**Common Errors:**
- Initialization timeout (5 seconds)
- Invalid configuration
- Browser API unavailable

---

### Event Errors

```typescript
try {
  tracelog.event('example', { key: 'value' });
} catch (error) {
  console.error('Event failed:', error);
}
```

**Common Errors:**
- Called before `init()`
- Called during `destroy()`
- Rate limit exceeded

---

### Network Errors

TraceLog uses a **retry-first, then persistence-based recovery model**:

| Response | In-Session Retries | Persistence |
|----------|-------------------|-------------|
| **2xx** | N/A (success) | Events removed from queue, delivery confirmed |
| **4xx (except 408/429)** | None (permanent error) | Events discarded immediately (invalid data) |
| **408/429** | Up to 2 retries with backoff | Persist after exhausting retries |
| **5xx** | Up to 2 retries with backoff | Persist after exhausting retries |
| **Network failure** | Up to 2 retries with backoff | Persist after exhausting retries |

**In-Session Retry Strategy:**
- **Maximum Retries**: 2 additional attempts per integration (3 total attempts)
- **Backoff Formula**: `100ms * (2 ^ attempt) + random(0-100ms)`
- **Delays**: Attempt 1→2: 200-300ms, Attempt 2→3: 400-500ms
- **Transient Errors**: 5xx, 408 Request Timeout, 429 Too Many Requests, network failures
- **Permanent Errors**: 4xx (except 408, 429) - no retries, immediate discard
- **Jitter**: Random 0-100ms added to prevent thundering herd

**Persistence-Based Recovery Flow:**
1. Page loads → Check localStorage for failed events (per-integration)
2. If found → Wait for session initialization
3. Retry sending failed events (once per page, NO in-session retries on recovery)
4. Success → Clear from localStorage
5. Fail → Re-persist for next page

**Expiration:**
- Failed events expire after **2 hours** in localStorage
- Prevents stale data accumulation

**Notes:**
- Multi-integration: Independent retry/persistence (separate localStorage keys)
- Multi-tab protection (1-second recovery guard prevents concurrent recovery)
- Automatic cleanup of expired events
- Optimistic queue removal: Events removed if AT LEAST ONE integration succeeds

---

## Global Disable

Disable TraceLog entirely (no initialization):

```typescript
window.__traceLogDisabled = true;
```

**Use Cases:**
- Consent management (set before library loads)
- Bot detection
- Development environments

---

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

**Graceful Degradation:**
- BroadcastChannel (cross-tab sync): Falls back to localStorage-only
- IntersectionObserver (viewport tracking): Feature disabled
- sendBeacon (page unload): Falls back to synchronous fetch

---

## Resources

- [GitHub Repository](https://github.com/tracelog/tracelog)
- [Changelog](./CHANGELOG.md)
- [Security Guide](./SECURITY.md)
- [Handlers Documentation](./src/handlers/README.md)
- [Managers Documentation](./src/managers/README.md)

---

**Version:** 0.12.0
**License:** MIT
**Last Updated:** October 2025
