# Security & Privacy Guide

This document outlines TraceLog's security guarantees, privacy protections, and best practices for implementing the library in production applications.

---

## 🔒 What TraceLog Guarantees

### ✅ We DO

1. **Input Value Protection**
   - **NEVER** capture values from `<input>`, `<textarea>`, or `<select>` elements automatically
   - Click events on form fields only capture element metadata (tag, id, class), never the `value` attribute
   - [Test Coverage: `tests/e2e/input-value-protection.spec.ts`](./tests/e2e/input-value-protection.spec.ts)

2. **PII Sanitization**
   - Automatically redact sensitive data patterns in error messages and click text:
     - Email addresses → `[REDACTED]`
     - Phone numbers (US format) → `[REDACTED]`
     - Credit card numbers → `[REDACTED]`
     - API keys/tokens → `[REDACTED]`
     - Bearer tokens → `[REDACTED]`
     - IBAN numbers → `[REDACTED]`
   - Patterns applied: [`src/constants/error.constants.ts`](./src/constants/error.constants.ts)

3. **Default URL Parameter Filtering**
   - Automatically remove sensitive query parameters from tracked URLs:
     - `token`, `auth`, `key`, `session`, `reset`, `password`
     - `api_key`, `apikey`, `secret`, `access_token`, `refresh_token`
     - `verification`, `code`, `otp`
   - Common parameters like `email` and `user` are NOT filtered by default (legitimate use in confirmation links, attribution)
   - You can extend this list with custom parameters via `config.sensitiveQueryParams`
   - Full list: [`src/constants/config.constants.ts`](./src/constants/config.constants.ts)

4. **Client-Side Controls**
   - All sampling, deduplication, and validation happen in the browser
   - No backend dependency required for privacy controls
   - Rate limiting (200 events/sec) prevents abuse

5. **XSS Protection**
   - All string metadata is sanitized against common XSS patterns
   - HTML entities encoded automatically

### ❌ We Do NOT

1. **Track Form Submissions Automatically**
   - You must explicitly send form data via custom events
   - This is by design to give you full control over what data is collected

2. **Fingerprint Users**
   - No canvas fingerprinting, browser fingerprinting, or tracking without consent
   - User IDs are optional and controlled by you

3. **Store Data Long-Term Client-Side**
   - Events expire after 2 hours in localStorage
   - Session recovery window is configurable (default: 2x session timeout)

---

## 🛡️ Your Responsibilities

TraceLog is a **tool**, not a compliance solution. You must:

### 1. **GDPR/LOPD Consent Management**

TraceLog does NOT handle consent banners or cookie consent. You must:

- **DO NOT** initialize TraceLog until user grants consent
- Use `tracelog.init()` only after consent is obtained
- Call `tracelog.destroy()` if user rejects or revokes consent

**Example: Correct Pattern**

```typescript
import { tracelog } from '@tracelog/lib';

// Wait for consent
const userConsent = await showCookieBanner(); // Your consent solution

if (userConsent.analytics) {
  // Initialize only after consent
  await tracelog.init({
    integrations: {
      tracelog: { projectId: 'your-project-id' }
    }
  });
} else {
  // User rejected - don't initialize
  console.log('Analytics consent denied');
}

// If user revokes consent later
function handleConsentRevoke() {
  tracelog.destroy(); // Stop tracking immediately
  localStorage.clear(); // Clear stored session data
}
```

**❌ WRONG: Initializing Before Consent**

```typescript
// DON'T DO THIS
await tracelog.init(); // Started without consent!
if (userConsent.analytics) {
  // Too late - already tracking
}
```

---

### 2. **Protecting Sensitive UI Elements**

Use `data-tlog-ignore` attribute to exclude sensitive elements from tracking:

```html
<!-- Payment form - completely ignored -->
<div data-tlog-ignore>
  <input type="text" name="card_number">
  <input type="text" name="cvv">
  <button>Pay Now</button>
</div>

<!-- Admin panel - ignored -->
<button data-tlog-ignore>Delete All Users</button>

<!-- Password reset - ignored -->
<form data-tlog-ignore action="/reset-password">
  <input type="password" name="new_password">
  <button>Reset Password</button>
</form>

<!-- Public action - tracked normally -->
<button>Subscribe to Newsletter</button>
```

**When to use `data-tlog-ignore`:**
- Payment forms (credit card, billing info)
- Password inputs and reset forms
- Admin/privileged actions (delete, ban, promote)
- Personal data forms (SSN, ID numbers, medical info)
- Any element where even metadata (class, id) could leak sensitive context

---

### 3. **Custom Event Data Sanitization**

TraceLog automatically sanitizes error messages and click text, but **YOU** are responsible for sanitizing custom event metadata:

**✅ GOOD: Sanitized Custom Events**

```typescript
import { tracelog } from '@tracelog/lib';

// Hash sensitive IDs before sending
const userId = await hashUserId(user.id); // Use SHA-256 or similar

tracelog.event('purchase_completed', {
  user_id: userId, // Hashed, not raw
  amount: 99.99,
  currency: 'USD',
  // Do NOT send: email, card_number, address, etc.
});
```

**❌ BAD: Sending PII in Custom Events**

```typescript
// DON'T DO THIS
tracelog.event('user_registered', {
  email: user.email, // ❌ PII leak
  phone: user.phone, // ❌ PII leak
  address: user.address, // ❌ PII leak
  credit_card: user.payment.card, // ❌ Critical PII leak
});
```

---

### 4. **Conditional Sampling Based on Consent**

Different users may have different consent levels. Adjust sampling accordingly:

```typescript
import { tracelog } from '@tracelog/lib';

const consent = getUserConsent(); // Your consent manager

if (consent.level === 'full') {
  // Full analytics consent
  await tracelog.init({
    samplingRate: 1.0, // 100%
    errorSampling: 1.0,
  });
} else if (consent.level === 'essential') {
  // Essential only (minimal tracking)
  await tracelog.init({
    samplingRate: 0.1, // 10%
    errorSampling: 0.5, // 50% errors only
    disabledEvents: ['scroll', 'web_vitals'], // Only track core events
  });
} else {
  // No consent - don't initialize
}
```

---

### 5. **URL Parameter Configuration**

Extend default sensitive parameters with your application-specific ones:

```typescript
await tracelog.init({
  // Merged with defaults (token, auth, key, etc.)
  sensitiveQueryParams: [
    'affiliate_id', // Your custom param
    'promo_code',   // Your custom param
    'referral',     // Your custom param
  ],
});

// Example URLs before/after:
// Before: https://example.com/checkout?token=abc123&promo_code=SAVE20
// After:  https://example.com/checkout (both params removed)
```

---

## 📋 Pre-Production Security Checklist

Before deploying TraceLog to production (especially e-commerce):

### Code Review

- [ ] **Consent flow implemented** - TraceLog only initialized after user consent
- [ ] **Destroy on revoke** - `tracelog.destroy()` called when consent revoked
- [ ] **Sensitive elements marked** - All payment/admin UI has `data-tlog-ignore`
- [ ] **Custom events sanitized** - No PII in `tracelog.event()` metadata
- [ ] **URL params configured** - Application-specific sensitive params added to config

### Testing

- [ ] **Test checkout flow** - Verify NO credit card data in events (use browser DevTools → Network)
- [ ] **Test password reset** - Verify NO password values captured
- [ ] **Test admin actions** - Verify privileged actions properly ignored
- [ ] **Test consent rejection** - Verify library destroyed and no events sent
- [ ] **Test QA mode** - Add `?tlog_mode=qa` to URL, verify events in console

### Configuration

- [ ] **`sessionTimeout` appropriate** - Consider GDPR session limits (default 15min OK)
- [ ] **`errorSampling` set** - Reduce noise in production (0.1 = 10% recommended)
- [ ] **`disabledEvents` configured** - Disable unnecessary tracking for privacy/performance
- [ ] **`globalMetadata` reviewed** - No PII in metadata added to ALL events
- [ ] **Integration configured** - TraceLog SaaS or custom backend URL validated

### Documentation

- [ ] **Privacy policy updated** - Disclose what data is collected and how
- [ ] **Cookie banner includes TraceLog** - List library in consent management
- [ ] **Data retention documented** - Explain how long data is stored (client: 2hr, server: varies)

---

## 🔐 Advanced Security Patterns

### User ID Anonymization

```typescript
import { tracelog } from '@tracelog/lib';
import { SHA256 } from 'crypto-js'; // Or native Web Crypto API

// Hash user ID before setting
async function setAnonymousUser(userId: string) {
  const hashedId = SHA256(userId + 'your-secret-salt').toString();
  tracelog.setUserId(hashedId);
}

setAnonymousUser('user-12345'); // Stored as hashed value
```

### Contextual Tracking (Respecting DNT)

```typescript
// Respect "Do Not Track" browser setting
if (navigator.doNotTrack === '1') {
  console.log('User has Do Not Track enabled - skipping analytics');
} else {
  await tracelog.init({
    integrations: {
      tracelog: { projectId: 'your-project-id' }
    }
  });
}
```

### Secure Custom Backend Integration

```typescript
await tracelog.init({
  integrations: {
    custom: {
      collectApiUrl: 'https://your-api.com/collect',
      allowHttp: false, // NEVER enable in production
    }
  }
});
```

---

### Transformer Security Considerations

**New in v1.2.0:** Transformers allow runtime event modification. Use them securely to avoid introducing vulnerabilities.

#### ✅ DO: Use transformers for additional PII sanitization

```typescript
import type { EventData, EventsQueue } from '@tracelog/lib';

// Strip PII from custom backend events
tracelog.setTransformer('beforeSend', (data: EventData | EventsQueue) => {
  if ('type' in data && data.custom_event?.metadata) {
    const sanitized = { ...data.custom_event.metadata };

    // Remove known PII fields
    delete sanitized.email;
    delete sanitized.phone;
    delete sanitized.ssn;
    delete sanitized.creditCard;

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

#### ✅ DO: Filter events based on user consent level

```typescript
// Example: Filter events for users with limited consent
const userConsent = getUserConsent(); // Your consent manager

tracelog.setTransformer('beforeSend', (data) => {
  if ('type' in data) {
    // Users with "essential only" consent
    if (userConsent.level === 'essential') {
      // Only allow core events (page_view, session)
      if (data.type !== 'page_view' && data.type !== 'session_start' && data.type !== 'session_end') {
        return null; // Filter out non-essential events
      }
    }
  }
  return data;
});
```

#### ✅ DO: Remember transformers are integration-specific

**Critical Security Note:**
- **TraceLog SaaS**: Transformers silently ignored (schema protection)
- **Custom Backend**: Transformers applied (YOUR responsibility to secure)
- **Google Analytics**: `beforeSend` applied (be careful with GA)

```typescript
// Custom backend - transformers applied (YOU control security)
await tracelog.init({
  integrations: {
    custom: { collectApiUrl: 'https://your-api.com' }
  }
});

// YOUR responsibility to sanitize when using transformers with custom backend
tracelog.setTransformer('beforeSend', sanitizePII);

// TraceLog SaaS - transformers ignored (TraceLog controls security)
await tracelog.init({
  integrations: {
    tracelog: { projectId: 'project-id' }
  }
});

// Transformers NOT applied (SaaS schema protection)
tracelog.setTransformer('beforeSend', anyTransformer); // Ignored
```

#### ❌ DON'T: Add PII via transformers

```typescript
// BAD - introducing PII leak
tracelog.setTransformer('beforeSend', (data) => {
  if ('type' in data) {
    return {
      ...data,
      custom_event: {
        ...data.custom_event,
        metadata: {
          ...data.custom_event?.metadata,
          userEmail: currentUser.email, // ❌ PII leak
          userPhone: currentUser.phone   // ❌ PII leak
        }
      }
    };
  }
  return data;
});

// GOOD - use hashed/anonymized IDs only
tracelog.setTransformer('beforeSend', (data) => {
  if ('type' in data) {
    return {
      ...data,
      custom_event: {
        ...data.custom_event,
        metadata: {
          ...data.custom_event?.metadata,
          userId: await hashUserId(currentUser.id), // ✅ Hashed ID
          userSegment: currentUser.segment           // ✅ Generic category
        }
      }
    };
  }
  return data;
});
```

#### ❌ DON'T: Trust transformer input blindly

```typescript
// BAD - no validation
tracelog.setTransformer('beforeSend', (data) => {
  if ('type' in data) {
    // Directly using external data without validation
    return {
      ...data,
      custom_event: {
        ...data.custom_event,
        metadata: {
          ...data.custom_event?.metadata,
          ...window.externalData // ❌ Unvalidated external data
        }
      }
    };
  }
  return data;
});

// GOOD - validate and sanitize
tracelog.setTransformer('beforeSend', (data) => {
  if ('type' in data) {
    const validated = validateExternalData(window.externalData);
    const sanitized = sanitizePII(validated);

    return {
      ...data,
      custom_event: {
        ...data.custom_event,
        metadata: {
          ...data.custom_event?.metadata,
          ...sanitized // ✅ Validated and sanitized
        }
      }
    };
  }
  return data;
});
```

#### ❌ DON'T: Log sensitive data in transformers

```typescript
// BAD - logging PII in transformer
tracelog.setTransformer('beforeSend', (data) => {
  console.log('Event data:', data); // ❌ May contain PII in production logs
  return data;
});

// GOOD - conditional logging with sanitization
tracelog.setTransformer('beforeSend', (data) => {
  if (import.meta.env.DEV) {
    // Only log in development, and redact sensitive fields
    const sanitized = { ...data, custom_event: { name: data.custom_event?.name } };
    console.log('Event (sanitized):', sanitized);
  }
  return data;
});
```

#### Security Checklist for Transformers

Before using transformers in production:

- [ ] **Integration type confirmed** - Know whether transformers will be applied (SaaS vs custom)
- [ ] **PII removal verified** - Ensure transformers don't introduce PII leaks
- [ ] **Input validation** - Validate any external data added via transformers
- [ ] **Error handling** - Transformers wrapped in try-catch for safe fallback
- [ ] **Logging reviewed** - No sensitive data logged in transformer code
- [ ] **Performance tested** - Transformers don't block event processing (<5ms per call)
- [ ] **Testing completed** - Test transformers with real events in QA mode

**Example Test:**

```typescript
// Test transformer in QA mode
tracelog.setQaMode(true);

// Set transformer
tracelog.setTransformer('beforeSend', myTransformer);

// Send test event
tracelog.event('test_event', { key: 'value' });

// Check browser console - verify:
// 1. Transformation applied correctly
// 2. No PII leaked
// 3. Performance acceptable
```

---

## 🧪 Security Testing

TraceLog includes comprehensive E2E security tests:

```bash
# Run all security-related tests
npm run test:e2e -- input-value-protection
npm run test:e2e -- data-tlog-ignore

# Test PII sanitization
npm run test:e2e -- error-tracking
```

---

## 📚 Additional Resources

- [GDPR Compliance Checklist](https://gdpr.eu/checklist/)
- [OWASP Privacy Risks](https://owasp.org/www-project-top-10-privacy-risks/)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) (for hashing)
- [Do Not Track Specification](https://www.w3.org/TR/tracking-dnt/)

---

## 📝 Summary

| Aspect | TraceLog's Role | Your Role |
|--------|----------------|-----------|
| **Input value protection** | ✅ Guaranteed - never captured | Trust but verify in tests |
| **PII in text/errors** | ✅ Auto-sanitized (email, phone, cards) | Extend for domain-specific PII |
| **URL parameters** | ✅ Default list provided | Add app-specific params |
| **Consent management** | ❌ Not handled | Implement before init() |
| **Sensitive UI elements** | ✅ `data-tlog-ignore` support | Mark all sensitive elements |
| **Custom event data** | ❌ Not sanitized | Sanitize before sending |
| **Data retention** | ✅ Client: 2hr auto-cleanup | Server: configure in backend |

**Remember:** TraceLog is privacy-first by design, but **you** are ultimately responsible for GDPR/LOPD compliance in your application.
