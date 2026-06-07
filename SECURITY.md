# Security & Privacy Guide

This document outlines TraceLog's security guarantees, privacy protections, and best practices for implementing the library in production applications.

---

## What TraceLog Guarantees

### We DO

1. **Input value protection**
   - **NEVER** capture values from `<input>`, `<textarea>`, or `<select>` elements automatically
   - Click events on form fields only capture element metadata (tag, id, class), never the `value` attribute

2. **PII sanitization**
   - Automatically redact sensitive data patterns in error messages, stack traces, click text, and click element `id` / `class` attributes:
     - Email addresses → `[REDACTED]`
     - Phone numbers (US formats) → `[REDACTED]`
     - Credit card numbers → `[REDACTED]`
     - IBAN numbers → `[REDACTED]`
     - API keys / tokens (Stripe-style) → `[REDACTED]`
     - Bearer tokens (JWT-like) → `[REDACTED]`
     - Connection-string passwords (`protocol://user:password@host`) → `[REDACTED]`
     - Sensitive URL query params (token, password, auth, secret, api_key, …) → `[REDACTED]`
   - Patterns live in [`src/utils/security/pii.utils.ts`](./src/utils/security/pii.utils.ts) and apply to `ClickHandler` and `ErrorHandler` automatically

3. **Default URL parameter filtering**
   - Automatically remove sensitive query parameters from every tracked URL — `page_url`, click `href` attributes, and referrers (14-param default deny-list: `token`, `auth`, `key`, `session`, `reset`, `password`, `api_key`, `apikey`, `secret`, `access_token`, `refresh_token`, `verification`, `code`, `otp`)
   - Common parameters like `email` and `user` are NOT filtered by default (legitimate use in confirmation links, attribution)
   - Extend the list via `config.sensitiveQueryParams`

4. **Client-side controls**
   - All sampling, deduplication, and validation happen in the browser
   - No backend dependency required for privacy controls
   - Per-event-name rate limiting (default 60/min, configurable) prevents accidental loops

5. **XSS sanitization on custom metadata**
   - String values in custom-event metadata are scanned against an `XSS_PATTERNS` deny-list and stripped of matching content
   - A warning is logged when patterns are removed, so you can audit your own event-emitting code

6. **Marketing attribution capture, never logged**
   - UTM parameters and ad-network click identifiers (`gclid`, `gbraid`, `wbraid`, `fbclid`, `ttclid`) are captured once at session start and attached to events for traffic-source classification
   - Click identifiers are cross-site advertising identifiers (not GDPR PII, and stripped by iOS), but they are scrutinized: TraceLog captures them for attribution only and **never** writes them to the console or any log, in any mode

### We Do NOT

1. **Track form submissions automatically**
   - You must explicitly send form data via custom events
   - This is by design — you control exactly what is collected

2. **Fingerprint users**
   - No canvas fingerprinting, no browser fingerprinting
   - The visitor UUID is randomly generated and stored in `localStorage` only

3. **Store data long-term client-side**
   - Failed events expire after 2 hours in `localStorage`
   - Session timeout is configurable (default 15 min, max 24 h)

---

## Your Responsibilities

TraceLog is a **tool**, not a compliance solution. You must:

### 1. GDPR / LOPD consent management

TraceLog does NOT handle consent banners or cookie consent. You must:

- **Not** initialize TraceLog until the user grants consent
- Call `tracelog.init()` only after consent is obtained
- Call `tracelog.destroy()` if the user rejects or revokes consent

**Correct pattern:**

```typescript
import { tracelog } from '@tracelog/lib';

const userConsent = await showCookieBanner(); // Your consent solution

if (userConsent.analytics) {
  await tracelog.init({
    integrations: { tracelog: { projectId: 'your-project-id' } },
  });
} else {
  console.log('Analytics consent denied');
}

// If consent is revoked later
function handleConsentRevoke() {
  tracelog.destroy();
  localStorage.clear();
}
```

**Wrong — initializing before consent:**

```typescript
// DON'T DO THIS
await tracelog.init(); // Started without consent!
if (userConsent.analytics) {
  // Too late — already tracking
}
```

---

### 2. Protecting sensitive UI elements

Use `data-tlog-ignore` to exclude sensitive elements from tracking:

```html
<!-- Payment form — completely ignored -->
<div data-tlog-ignore>
  <input type="text" name="card_number">
  <input type="text" name="cvv">
  <button>Pay Now</button>
</div>

<!-- Admin panel — ignored -->
<button data-tlog-ignore>Delete All Users</button>

<!-- Password reset — ignored -->
<form data-tlog-ignore action="/reset-password">
  <input type="password" name="new_password">
  <button>Reset Password</button>
</form>

<!-- Public action — tracked normally -->
<button>Subscribe to Newsletter</button>
```

**When to use `data-tlog-ignore`:**

- Payment forms (credit card, billing info)
- Password inputs and reset forms
- Admin / privileged actions (delete, ban, promote)
- Personal data forms (SSN, ID numbers, medical info)
- Any element where even metadata (class, id) could leak sensitive context

---

### 3. Custom-event data sanitization

TraceLog automatically sanitizes error messages and click text, but **you** are responsible for sanitizing custom-event metadata.

**Good — sanitized custom events:**

```typescript
import { tracelog } from '@tracelog/lib';

// Hash sensitive IDs before sending
const userId = await hashUserId(user.id); // SHA-256 or similar

tracelog.event('purchase_completed', {
  user_id: userId,    // Hashed, not raw
  amount: 99.99,
  currency: 'USD',
  // Do NOT send: email, card_number, address, etc.
});
```

**Bad — sending PII in custom events:**

```typescript
// DON'T DO THIS
tracelog.event('user_registered', {
  email: user.email,
  phone: user.phone,
  address: user.address,
  credit_card: user.payment.card, // Critical PII leak
});
```

---

### 4. Conditional sampling based on consent

Different users may have different consent levels. Adjust sampling accordingly:

```typescript
import { tracelog } from '@tracelog/lib';

const consent = getUserConsent();

if (consent.level === 'full') {
  await tracelog.init({
    samplingRate: 1.0,
    errorSampling: 1.0,
    integrations: { tracelog: { projectId: 'your-project-id' } },
  });
} else if (consent.level === 'essential') {
  await tracelog.init({
    samplingRate: 0.1,   // 10% of users
    errorSampling: 0.5,  // 50% of errors
    integrations: { tracelog: { projectId: 'your-project-id' } },
  });
} else {
  // No consent — don't initialize
}
```

For event-type-level filtering (e.g. exclude `scroll` for essential-consent users), use the `'event'` listener in standalone mode and only forward the events you're allowed to:

```typescript
const allowedTypes = new Set(['session_start', 'page_view', 'custom']);

tracelog.on('event', (event) => {
  if (!allowedTypes.has(event.type)) return;
  myAnalytics.process(event);
});

await tracelog.init(); // Standalone — no automatic backend send
```

---

### 5. URL parameter configuration

Extend the default sensitive parameters with your application-specific ones:

```typescript
await tracelog.init({
  // Merged with defaults
  sensitiveQueryParams: [
    'affiliate_id',
    'promo_code',
    'referral',
  ],
});

// Example:
// Before: https://example.com/checkout?token=abc123&promo_code=SAVE20
// After:  https://example.com/checkout (both params removed)
```

---

## Pre-Production Security Checklist

Before deploying TraceLog to production:

### Code review

- [ ] **Consent flow implemented** — `init()` only called after user consent
- [ ] **Destroy on revoke** — `tracelog.destroy()` called when consent revoked
- [ ] **Sensitive elements marked** — all payment / admin UI has `data-tlog-ignore`
- [ ] **Custom events sanitized** — no PII in `tracelog.event()` metadata
- [ ] **URL params configured** — application-specific sensitive params added

### Testing

- [ ] **Checkout flow** — verify NO credit card data in events (DevTools → Network)
- [ ] **Password reset** — verify NO password values captured
- [ ] **Admin actions** — verify privileged actions are properly ignored
- [ ] **Consent rejection** — verify library is destroyed and no events are sent
- [ ] **QA mode** — add `?tlog_mode=qa` to URL, verify events appear in console

### Configuration

- [ ] **`sessionTimeout` reviewed** — default 15 min meets typical GDPR expectations
- [ ] **`errorSampling` set** — reduce noise in production (e.g. `0.1`)
- [ ] **`samplingRate` set** — appropriate for traffic volume
- [ ] **`globalMetadata` reviewed** — no PII in metadata added to every event
- [ ] **Integration configured** — TraceLog SaaS `projectId` matches the target project

### Documentation

- [ ] **Privacy policy updated** — disclose what data is collected and how
- [ ] **Cookie banner includes TraceLog** — list the library in your consent management
- [ ] **Data retention documented** — explain how long data is stored (client: 2 h failed-event retention; server: per your TraceLog plan)

---

## Advanced Security Patterns

### Hashing user identifiers

Use `identify()` with a hashed user ID instead of raw PII:

```typescript
import { tracelog } from '@tracelog/lib';
import { SHA256 } from 'crypto-js'; // Or native Web Crypto API

async function identifyAnonymous(rawUserId: string) {
  const hashedId = SHA256(rawUserId + 'your-secret-salt').toString();
  tracelog.identify(hashedId);
}

await identifyAnonymous('user-12345'); // Stored as hashed value
```

### Respecting Do Not Track

```typescript
if (navigator.doNotTrack === '1') {
  console.log('User has Do Not Track enabled — skipping analytics');
} else {
  await tracelog.init({
    integrations: { tracelog: { projectId: 'your-project-id' } },
  });
}
```

### Logout / re-identification

For logout flows, use `resetIdentity()` rather than `destroy()`. It flushes pending events under the old identity, then regenerates the visitor UUID and starts a new session:

```typescript
async function handleLogout() {
  await tracelog.resetIdentity();
  // The next user on this browser starts with a fresh anonymous profile.
}
```

`destroy()` is the right choice when consent is revoked — it stops all tracking and clears local state.

---

## Security Testing

TraceLog includes E2E security tests:

```bash
npm run test:e2e -- input-value-protection
npm run test:e2e -- data-tlog-ignore
npm run test:e2e -- error-tracking
```

---

## Additional Resources

- [GDPR compliance checklist](https://gdpr.eu/checklist/)
- [OWASP Top 10 privacy risks](https://owasp.org/www-project-top-10-privacy-risks/)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) (for hashing)
- [Do Not Track specification](https://www.w3.org/TR/tracking-dnt/)

---

## Summary

| Aspect                       | TraceLog's role                                | Your role                          |
|------------------------------|------------------------------------------------|------------------------------------|
| **Input value protection**   | ✅ Never captured                              | Trust but verify in tests          |
| **PII in text / errors**     | ✅ Auto-sanitized (emails, phones, cards, …)   | Extend for domain-specific PII     |
| **URL parameters**           | ✅ Default 15-param deny-list                  | Add app-specific params            |
| **Consent management**       | ❌ Not handled                                 | Implement before `init()`          |
| **Sensitive UI elements**    | ✅ `data-tlog-ignore` support                  | Mark all sensitive elements        |
| **Custom-event data**        | ⚠️ XSS-scanned only                            | Sanitize for PII before sending    |
| **Client-side data retention** | ✅ Failed events cleared after 2 h           | —                                  |
| **Server-side data retention** | ❌ Depends on your TraceLog plan / contract | Configure per your retention needs |

**Remember:** TraceLog is privacy-first by design, but **you** are ultimately responsible for GDPR / LOPD compliance in your application.
