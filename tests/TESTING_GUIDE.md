# Testing Guide

**Vitest** (unit/integration) + **Playwright** (E2E) + **TypeScript** strict mode

## Commands

```bash
# Tests
npm run test:unit                # Unit tests (Vitest)
npm run test:integration         # Integration tests (Vitest)
npm run test:e2e                 # E2E tests (Playwright)
npm run test                     # All tests
npm run test:coverage            # Coverage report

# Quality
npm run check                    # Types + lint + format
npm run fix                      # Auto-fix issues
```

## QA Mode for Testing

QA mode provides enhanced debugging for both manual and automated testing.

### Activation/Deactivation

**Via URL:**
```bash
# Activate
?tlog_mode=qa

# Deactivate
?tlog_mode=qa_off
```

**Programmatic API:**
```typescript
// Enable QA mode
tracelog.setQaMode(true);

// Disable QA mode
tracelog.setQaMode(false);
```

### How It Works
1. **URL Detection**: Library checks for `?tlog_mode=qa` or `?tlog_mode=qa_off` on page load
2. **Persistence**: Stores state in sessionStorage (`tlog:qa_mode`)
3. **URL Cleanup**: Removes query param using `history.replaceState()`
4. **Visual Feedback**: Console log with colored badge (orange=active, gray=disabled)

### Effects When Active
- **Custom events displayed in console** instead of being sent to server
- **Strict validation** - Throws errors on validation failures (instead of silently ignoring)
- **Events still emitted** to `on('event')` listeners for E2E testing
- **No server transmission** - Custom events are NOT added to send queue
- **No Google Analytics** - Custom events are NOT forwarded to GA integration
- Useful for both manual debugging and automated E2E testing

### E2E Testing Patterns

**Activate via URL:**
```typescript
// Method 1: URL parameter
await page.goto('http://localhost:3000?tlog_mode=qa');

// Method 2: Navigate after load
await page.goto('http://localhost:3000');
await page.evaluate(() => {
  const url = new URL(window.location.href);
  url.searchParams.set('tlog_mode', 'qa');
  window.location.href = url.toString();
});
```

**Activate programmatically:**
```typescript
await page.goto('http://localhost:3000');
await page.evaluate(() => {
  window.tracelog.setQaMode(true);
});
```

**Deactivate in tests:**
```typescript
// Via URL
await page.goto('http://localhost:3000?tlog_mode=qa_off');

// Via code
await page.evaluate(() => {
  window.tracelog.setQaMode(false);
});
```

## Test Failure Triage
- If tests fail to run or fail unexpectedly, determine whether the failure stems from the test configuration/setup or from a defect in the TraceLog library.
- If it is a test configuration/setup issue, fix the test environment or mocks first.
- If it is a library defect, the issue must be corrected in the library before continuing with the tests.

## Patterns

### Unit Tests
```typescript
import { EventManager } from '../src/managers/event.manager';

describe('EventManager', () => {
  it('should track events', () => {
    const eventManager = new EventManager();
    eventManager.track({ type: 'CLICK', data: { x: 100, y: 200 } });
    expect(eventManager.getQueueLength()).toBe(1);
  });
});
```

### Integration Tests
```typescript
import { App } from '../src/app';

describe('App Integration', () => {
  it('should send events to API', async () => {
    const app = new App();
    await app.init({
      integrations: { custom: { collectApiUrl: 'http://localhost:8080/collect' } }
    });
    app.sendCustomEvent('purchase', { amount: 99.99 });
    expect(fetch).toHaveBeenCalled();
  });

  it('should work without HTTP integration', async () => {
    const app = new App();
    await app.init(); // No integrations = no HTTP calls
    app.sendCustomEvent('test', { foo: 'bar' });
    expect(app.initialized).toBe(true);
    // Events tracked locally but not sent
  });
});
```

### E2E Tests

#### Bridge Initialization (CSP-Safe)
```typescript
const result = await page.evaluate(async () => {
  // Wait for bridge (avoid page.waitForFunction due to CSP)
  let retries = 0;
  while (!window.__traceLogBridge && retries < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    retries++;
  }

  await window.__traceLogBridge!.init({
    integrations: { custom: { collectApiUrl: 'http://localhost:8080/collect' } }
  });

  // OR for local-only mode (no HTTP):
  // await window.__traceLogBridge!.init();

  return { initialized: window.__traceLogBridge!.initialized };
});
```

#### Queue Events (sessionId in queue, not events)
```typescript
const queues: any[] = [];
window.__traceLogBridge!.on('queue', (data: any) => {
  queues.push(data);
});

// sessionId is in queue.session_id, NOT in individual events
expect(queues[0].session_id).toBeDefined();
```

#### Error Handling
```typescript
// Filter expected validation errors
console.error = (...args: any[]) => {
  const message = args.join(' ');
  if (!message.includes('[TraceLog:EventValidation]')) {
    errors.push(message);
  }
};
```

## APIs

### E2E Bridge
```typescript
// Initialize with HTTP integration
await window.__traceLogBridge!.init({
  integrations: { custom: { collectApiUrl: 'http://localhost:8080/collect' } }
});

// Initialize without HTTP (local-only mode)
await window.__traceLogBridge!.init();

// Listen for events/queues
window.__traceLogBridge!.on('event', callback);
window.__traceLogBridge!.on('queue', callback);

// Send events
window.__traceLogBridge!.sendCustomEvent('name', metadata);

// Get session
window.__traceLogBridge!.getSessionData();
```

### Metadata Types
```typescript
// ✅ Valid
{ string: 'text', number: 123, boolean: true, tags: ['a', 'b'] }

// ❌ Invalid (will be rejected)
{ nested: { object: 'data' }, mixed: [1, 'text'], func: () => {} }
```

## ⚡ Best Practices

### ⚠️ Fake Timers (CRITICAL)

**Problem**: `vi.runAllTimersAsync()` causes infinite loops with `setInterval` in EventManager.

```typescript
// ❌ BAD - Infinite loop in CI
it('test', async () => {
  vi.useFakeTimers();
  await vi.runAllTimersAsync(); // ← Loops forever with setInterval
  vi.useRealTimers();
});

// ✅ GOOD - Use runOnlyPendingTimersAsync
it('test', async () => {
  vi.useFakeTimers();
  await vi.advanceTimersByTimeAsync(10000);
  await vi.runOnlyPendingTimersAsync(); // ← Only pending timers
  vi.useRealTimers();
});

// ✅ BETTER - Avoid fake timers when testing "no retry"
it('should NOT retry', async () => {
  await senderManager.send(body);
  await new Promise(resolve => setTimeout(resolve, 100));
  expect(mockFetch).toHaveBeenCalledTimes(1);
});
```

**When to Use:**
- ✅ `vi.runOnlyPendingTimersAsync()` - Testing periodic events
- ✅ Real timers - Testing "no retry" behavior
- ❌ `vi.runAllTimersAsync()` - NEVER (causes infinite loops)

### ✅ All Tests
- TypeScript strict mode, proper setup/teardown, descriptive names

### ✅ Unit
- Isolate components, mock dependencies, test edge cases, keep fast (< 100ms)

### ✅ Integration
- Test component interactions, mock external services, verify data flow

### ✅ E2E
- Use `page.evaluate()` + `window.__traceLogBridge!`
- Use `{ integrations: { custom: { collectApiUrl: 'http://localhost:8080/collect' } } }` for HTTP tests
- Use `{}` for local-only mode (no HTTP calls)
- **CSP-Safe**: Internal waiting pattern (avoid `page.waitForFunction()`)
- Queue events timeout: 10-12 seconds
- **Key**: `sessionId` in `queue.session_id`, NOT individual events
- QA mode: Use `?tlog_mode=qa` URL parameter
- **Event Type Casing**: Always use lowercase with underscores (`'click'`, `'page_view'`, `'session_start'`)
  - Source of truth: `src/types/event.types.ts` EventType enum
- **Scroll Suppression**: Wait 600ms after init before testing scroll (500ms suppression + 100ms buffer)
- **Event Timing**: Init-time events need listener registered BEFORE init, post-init events AFTER init

### ❌ Avoid
- `page.waitForFunction()` (CSP-blocked)
- Hardcoded timeouts, complex configs, implementation testing
- Ignoring `@src/types/` as source of truth
- Looking for `sessionId` in individual events
- Flaky tests, shared state, over-engineering

## 🔍 Debug

```bash
# Unit/Integration
npm run test:unit -- --verbose --watch
npm run test -- --testNamePattern="SessionManager"

# E2E
npm run test:e2e -- --headed --debug --trace on

# Coverage
npm run test:coverage
open coverage/lcov-report/index.html
```

## ⭐ Acceptance Criteria

- 100% pass rating
- NO type errors (use `npm run type-check` script to verify)
- NO lint errors (use `npm run lint` script to verify - warnings are acceptable, only errors block acceptance)
