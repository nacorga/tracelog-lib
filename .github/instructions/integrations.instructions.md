applyTo:
  - src/integrations/**/*.ts

# Integration Review Instructions

## Integration Architecture Pattern

Integrations are **optional third-party service connectors** (Google Analytics, custom backends):

```typescript
export class CustomIntegration {
  private isInitialized = false;

  async initialize(): Promise<void> {
    // Async setup logic
    this.isInitialized = true;
  }

  sendEvent(event: Event): void {
    if (!this.isInitialized) {
      return; // Silently skip if not initialized
    }
    // Forward event to third-party service
  }

  cleanup(): void {
    // Remove scripts, clear state
    this.isInitialized = false;
  }
}
```

## Critical Checks

### 1. Initialization Safety (BLOCKING)
- ✅ Check `isInitialized` before sending data
- ✅ Handle initialization failures gracefully (no throw)
- ✅ Return early if integration not configured
- ✅ Async initialization with proper error handling
- ❌ **BLOCK**: Sending data before initialization → Potential crashes

### 2. Script Injection Safety (BLOCKING)
- ✅ Check if script already exists before injecting
- ✅ Use async/defer attributes on script tags
- ✅ Remove scripts in `cleanup()`
- ✅ Handle script load failures gracefully
- ❌ **BLOCK**: Duplicate script injection → Multiple instances

### 3. Third-Party API Safety (HIGH)
- ✅ Validate third-party API availability (`window.gtag`, `window.dataLayer`, etc.)
- ✅ Check for ad blockers (graceful degradation)
- ✅ Rate limiting for API calls (prevent abuse)
- ⚠️ **HIGH**: Assuming third-party API exists → Crashes when blocked

### 4. Error Handling (HIGH)
- ✅ Try-catch around all third-party API calls
- ✅ Silent failures (no throw) - integrations are optional
- ✅ Log errors with context via `log()` utility
- ⚠️ **HIGH**: Throwing errors from integrations → Breaks core functionality

## Google Analytics Integration Specific

### Configuration Validation
```typescript
// ✅ GOOD: Validate measurement ID
if (!measurementId || typeof measurementId !== 'string') {
  throw new Error('Google Analytics measurement ID is required');
}

if (!measurementId.match(/^(G-|UA-)/)) {
  throw new Error('Measurement ID must start with "G-" or "UA-"');
}
```

### Script Injection
```typescript
// ✅ GOOD: Safe script injection
private injectGoogleAnalyticsScript(measurementId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (document.querySelector(`script[src*="googletagmanager"]`)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.async = true;
    script.defer = true;

    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Analytics script'));

    document.head.appendChild(script);
  });
}

// ❌ BAD: No duplicate check, no error handling
private injectGoogleAnalyticsScript(measurementId: string): void {
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script); // No error handling!
}
```

### Event Forwarding
```typescript
// ✅ GOOD: Safe event forwarding
sendEvent(event: Event): void {
  if (!this.isInitialized) {
    return;
  }

  if (typeof window === 'undefined' || !window.gtag) {
    return; // Silently skip if gtag not available
  }

  try {
    window.gtag('event', event.type, {
      event_category: event.custom_event?.name || event.type,
      event_label: event.page_url,
      // ... more params
    });
  } catch (error) {
    log('warn', 'Failed to send event to Google Analytics', { error });
  }
}

// ❌ BAD: No safety checks
sendEvent(event: Event): void {
  window.gtag('event', event.type); // Crashes if gtag undefined!
}
```

### Cleanup Pattern
```typescript
// ✅ GOOD: Proper cleanup
cleanup(): void {
  this.isInitialized = false;

  // Remove injected scripts
  const scripts = document.querySelectorAll('script[src*="googletagmanager"]');
  scripts.forEach((script) => script.remove());

  // Clear global state
  if (typeof window !== 'undefined') {
    delete window.gtag;
    delete window.dataLayer;
  }
}

// ❌ BAD: No cleanup
cleanup(): void {
  // Scripts remain in DOM, state persists
}
```

## Custom Backend Integration

### URL Validation
```typescript
// ✅ GOOD: Strict URL validation
if (!collectApiUrl.startsWith('http://') && !collectApiUrl.startsWith('https://')) {
  throw new IntegrationValidationError('Custom API URL must use HTTP or HTTPS protocol');
}

const allowHttp = config.allowHttp ?? false;

if (!allowHttp && collectApiUrl.startsWith('http://')) {
  throw new IntegrationValidationError(
    'HTTP not allowed in production. Set allowHttp: true to enable (not recommended)'
  );
}

// ❌ BAD: No protocol validation
if (!collectApiUrl) {
  throw new Error('API URL required');
}
```

### Request Pattern
```typescript
// ✅ GOOD: Proper request handling
async sendBatch(events: Event[]): Promise<void> {
  if (!this.isInitialized || !this.apiUrl) {
    return;
  }

  try {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    log('error', 'Failed to send batch to custom backend', { error });
    // Don't throw - integration failures shouldn't break core library
  }
}

// ❌ BAD: No error handling
async sendBatch(events: Event[]): Promise<void> {
  await fetch(this.apiUrl, {
    method: 'POST',
    body: JSON.stringify({ events }),
  }); // Will throw on network error!
}
```

## Integration Lifecycle

### Initialization Order
1. **Validate configuration** - Check required fields, throw if invalid
2. **Check existing scripts** - Prevent duplicate injection
3. **Inject scripts** - Async load with error handling
4. **Wait for ready** - Verify third-party API available
5. **Set initialized flag** - Mark ready for use

### Event Flow
1. **Check initialized** - Return early if not ready
2. **Validate third-party API** - Check `window.gtag`, `window.dataLayer`, etc.
3. **Transform event** - Convert TraceLog event to third-party format
4. **Send with try-catch** - Handle failures gracefully
5. **Log errors** - Use `log()` for debugging

### Cleanup Flow
1. **Set initialized to false** - Prevent new events
2. **Remove scripts** - Clean up DOM
3. **Clear global state** - Delete `window.gtag`, etc.
4. **Clear references** - Null out instance variables

## Testing Requirements

### Unit Tests
- Test initialization with valid/invalid config
- Test duplicate script injection prevention
- Test event forwarding when initialized/not initialized
- Test cleanup removes all artifacts

### Integration Tests
- Test actual script loading (may require mocks)
- Test interaction with real third-party APIs (in E2E tests)
- Test ad blocker scenarios (graceful degradation)

### E2E Tests
```typescript
test('Google Analytics integration forwards events', async ({ page }) => {
  // Mock gtag to capture calls
  await page.addInitScript(() => {
    window.__gtagCalls = [];
    window.gtag = (...args) => {
      window.__gtagCalls.push(args);
    };
  });

  await tracelog.init({
    integrations: {
      google: { measurementId: 'G-TEST123' }
    }
  });

  await page.click('button');

  const gtagCalls = await page.evaluate(() => window.__gtagCalls);
  expect(gtagCalls).toContainEqual(['event', 'CLICK', expect.any(Object)]);
});
```

## Common Issues

### Critical (Must Fix)
- ❌ Sending events before initialization check
- ❌ No duplicate script injection prevention
- ❌ Throwing errors from integration code (should be silent)
- ❌ Missing cleanup in `cleanup()` method
- ❌ Assuming third-party API exists (`window.gtag` without check)
- ❌ Allowing HTTP in production without explicit opt-in

### High Priority
- ⚠️ Missing try-catch around third-party API calls
- ⚠️ No validation of third-party API response
- ⚠️ No logging of integration failures
- ⚠️ Missing SSR safety checks (`typeof window === 'undefined'`)
- ⚠️ Script injection without async/defer attributes

### Medium Priority
- 💡 Missing JSDoc comments on public methods
- 💡 Complex transformation logic not extracted to helpers
- 💡 Missing test coverage for error paths
- 💡 No rate limiting for third-party API calls

## Integration Checklist

**Before merging integration changes:**

- [ ] Initialization check before all operations
- [ ] Duplicate script injection prevention
- [ ] Async script loading with error handling
- [ ] Try-catch around all third-party API calls
- [ ] Silent failures (no throw)
- [ ] Proper cleanup in `cleanup()` method
- [ ] SSR-safe (`typeof window === 'undefined'` checks)
- [ ] HTTPS enforcement (unless `allowHttp: true`)
- [ ] Third-party API validation (`window.gtag` exists)
- [ ] Error logging with context

## Example Review Comments

**Good**: "BLOCKING: Missing initialization check at line 67. Add `if (!this.isInitialized) { return; }` before calling `window.gtag()`. Without this, events will be sent before Google Analytics is ready, causing errors."

**Good**: "HIGH: The script injection at line 45 doesn't check for duplicates. Add `if (document.querySelector('script[src*=\"googletagmanager\"]')) { return; }` before creating the script element to prevent loading Google Analytics multiple times."

**Good**: "MEDIUM: The `sendEvent()` method at line 89 doesn't log failures. Add a catch block: `catch (error) { log('warn', 'Failed to send event', { error }); }` for debugging integration issues."

**Good**: "The Google Analytics integration looks solid. Consider adding a test case for ad blocker scenarios where `window.gtag` is undefined to ensure graceful degradation."
