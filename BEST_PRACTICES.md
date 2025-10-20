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
          app_version: '1.0.0'
        }
      }
    };
  }
  return event;
});

// STEP 3: Initialize LAST (starts tracking immediately)
await tracelog.init({
  integrations: {
    custom: { collectApiUrl: 'https://api.example.com' }
  }
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
  price: 299.99
});

// BAD - deeply nested
tracelog.event('product_viewed', {
  product: {
    details: {
      info: {
        id: 'abc-123' // Too deep
      }
    }
  }
});
```

### ❌ DON'T: Send PII in custom events

```typescript
// BAD - violates privacy
tracelog.event('signup', {
  email: 'user@example.com', // ❌ PII
  phone: '+1234567890',      // ❌ PII
  address: '123 Main St'     // ❌ PII
});

// GOOD - use hashed IDs
import { SHA256 } from 'crypto-js';

const userId = SHA256('user@example.com' + 'your-salt').toString();
tracelog.event('signup', {
  userId: userId,           // ✅ Hashed
  plan: 'premium',          // ✅ Non-sensitive
  source: 'landing_page'    // ✅ Non-sensitive
});
```

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

## Consent & Privacy

### ✅ DO: Respect user consent

```typescript
// Initialize only after consent
async function initializeAnalytics() {
  const consent = await getUserConsent();

  if (consent.analytics) {
    await tracelog.init({
      integrations: {
        tracelog: { projectId: 'project-id' }
      }
    });
  }
}

// Handle consent revocation
function revokeConsent() {
  tracelog.destroy();
  localStorage.clear(); // Clear persisted data
}
```

### ✅ DO: Mark sensitive elements

```html
<!-- Payment forms -->
<div data-tlog-ignore>
  <input type="text" name="card_number">
  <input type="text" name="cvv">
  <button>Pay Now</button>
</div>

<!-- Admin actions -->
<button data-tlog-ignore onclick="deleteUser()">
  Delete User
</button>

<!-- Password fields -->
<form data-tlog-ignore action="/reset-password">
  <input type="password" name="new_password">
  <button>Reset Password</button>
</form>
```

### ✅ DO: Configure sensitive URL params

```typescript
await tracelog.init({
  sensitiveQueryParams: [
    'affiliate_id',   // Your custom params
    'promo_code',
    'referral_token',
    'campaign_id'
  ]
  // Merged with defaults: token, auth, key, password, etc.
});
```

---

## Performance

### ✅ DO: Disable unnecessary event types

```typescript
// Already using Sentry for errors? Disable error tracking
await tracelog.init({
  disabledEvents: ['error']
});

// High-frequency scrolls causing performance issues?
await tracelog.init({
  disabledEvents: ['scroll']
});

// Only need core analytics (page views, clicks, sessions)?
await tracelog.init({
  disabledEvents: ['scroll', 'web_vitals', 'error']
});
```

**Benefits:**
- Reduces client-side processing overhead
- Lower bandwidth usage
- Fewer backend costs
- Faster page performance on complex applications

### ✅ DO: Use sampling for high-traffic sites

```typescript
await tracelog.init({
  samplingRate: 0.1,      // Track 10% of users
  errorSampling: 0.5      // Track 50% of errors
});
```

### ✅ DO: Limit viewport tracking

```typescript
await tracelog.init({
  viewport: {
    elements: [
      // Only track critical CTAs
      { selector: '.primary-cta', id: 'hero-cta', name: 'Hero CTA' },
      { selector: '.checkout-button', id: 'checkout', name: 'Checkout' }
    ],
    threshold: 0.5,       // 50% visible
    minDwellTime: 2000    // 2 seconds
  }
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
  errorSampling: 0.1 // 10% of errors
});

// Staging: higher sampling
await tracelog.init({
  errorSampling: 1.0 // 100% of errors
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
    tracelog: { projectId: 'project-id' }
  }
});

// 3. Custom backend - your own API
await tracelog.init({
  integrations: {
    custom: {
      collectApiUrl: 'https://api.example.com/collect',
      allowHttp: false // NEVER true in production
    }
  }
});

// 4. Google Analytics - parallel tracking
await tracelog.init({
  integrations: {
    googleAnalytics: { measurementId: 'G-XXXXXX' }
  }
});

// 5. Multi-Integration (NEW in v1.1.0) - simultaneous sending
await tracelog.init({
  integrations: {
    tracelog: { projectId: 'project-id' },           // Analytics dashboard
    custom: { collectApiUrl: 'https://warehouse.com' } // Data warehouse
  }
});
```

### ✅ DO: Use multi-integration for redundancy and compliance

**New in v1.1.0:** Send events to multiple backends simultaneously with independent error handling and retry logic.

```typescript
// Use Case 1: Analytics + Data Warehouse
await tracelog.init({
  integrations: {
    tracelog: { projectId: 'abc-123' },                    // Real-time dashboard
    custom: { collectApiUrl: 'https://warehouse.com' }     // Long-term storage
  }
});

// Use Case 2: Production + Compliance
await tracelog.init({
  integrations: {
    tracelog: { projectId: 'prod-analytics' },             // Business analytics
    custom: { collectApiUrl: 'https://compliance.gov' }    // Regulatory logging
  }
});

// Use Case 3: Migration (Dual-Send)
await tracelog.init({
  integrations: {
    custom: { collectApiUrl: 'https://old-system.com' },   // Legacy system
    tracelog: { projectId: 'new-project' }                 // New TraceLog
  }
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
  }
});

// GOOD - use a load balancer in front of your backend
await tracelog.init({
  integrations: {
    custom: { collectApiUrl: 'https://lb.example.com' } // Load balancer handles distribution
  }
});
```

### ❌ DON'T: Use HTTP in production

```typescript
// BAD - insecure
await tracelog.init({
  integrations: {
    custom: {
      collectApiUrl: 'http://api.example.com/collect', // ❌ HTTP
      allowHttp: true // ❌ Never in production
    }
  }
});

// GOOD - HTTPS only
await tracelog.init({
  integrations: {
    custom: {
      collectApiUrl: 'https://api.example.com/collect', // ✅ HTTPS
      allowHttp: false // ✅ Default
    }
  }
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
          region: getUserRegion()
        }
      }
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
          transformed: true
        }
      }
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
        batchTransformed: true
      }
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
    custom: { collectApiUrl: 'https://api.example.com' }
  }
});

// Transformers WILL be applied
tracelog.setTransformer('beforeSend', transformFn);
tracelog.setTransformer('beforeBatch', transformFn);

// ✅ ALSO GOOD - But transformers silently ignored
await tracelog.init({
  integrations: {
    tracelog: { projectId: 'project-id' }
  }
});

// Transformers set but NOT applied (SaaS schema protection)
tracelog.setTransformer('beforeSend', transformFn); // Ignored
tracelog.setTransformer('beforeBatch', transformFn); // Ignored
```

**Key Points:**
- **TraceLog SaaS**: Transformers silently ignored (no errors thrown)
- **Custom Backend**: Transformers applied as configured
- **Google Analytics**: `beforeSend` applied, `beforeBatch` N/A
- **Multi-Integration**: Transformers only apply to custom backend

### ❌ DON'T: Rely on transformers for TraceLog SaaS

```typescript
// BAD - won't work with TraceLog SaaS
await tracelog.init({
  integrations: {
    tracelog: { projectId: 'project-id' }
  }
});

// This won't be applied (SaaS schema protection)
tracelog.setTransformer('beforeSend', (data) => {
  // ❌ Never executed for SaaS
  return enrichedData;
});

// GOOD - use custom backend if you need transformers
await tracelog.init({
  integrations: {
    custom: { collectApiUrl: 'https://api.example.com' }
  }
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
          creditCard: paymentInfo.card   // ❌ Sensitive data
        }
      }
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
          userId: currentUser.id,                    // ✅ ID only
          paymentMethodType: paymentInfo.cardType    // ✅ Generic info
        }
      }
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
          transformed: true
        }
      }
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
          ...enrichmentData // Pre-computed
        }
      }
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
  sessionTimeout: 900000  // 15 minutes (default)
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
  webVitalsMode: 'needs-improvement' // LCP > 2500ms, INP > 200ms, etc.
});

// All metrics: For trend analysis and P75 calculations
await tracelog.init({
  webVitalsMode: 'all' // Track every metric
});

// Poor only: Minimize data volume
await tracelog.init({
  webVitalsMode: 'poor' // LCP > 4000ms, INP > 500ms, etc.
});

// Custom thresholds: Fine-grained control
await tracelog.init({
  webVitalsMode: 'needs-improvement',
  webVitalsThresholds: {
    LCP: 3000,  // Stricter than default 2500ms
    INP: 150    // Stricter than default 200ms
  }
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
    query: e.target.query.value
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

| Metric | Impact |
|--------|--------|
| **Bundle size** | +15KB gzipped |
| **Init time** | <10ms |
| **Event capture** | <1ms per event |
| **Memory usage** | ~500KB (queue + session state) |
| **Network requests** | 1 per 10 seconds OR 50 events (batched) |

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
