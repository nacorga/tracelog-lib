# Testing Guide

**Jest** (unit/integration) + **Playwright** (E2E) + **TypeScript** strict mode

## Commands

```bash
# Tests
npm run test:unit                # Unit tests
npm run test:integration         # Integration tests
npm run test:e2e                 # E2E tests
npm run test                     # All tests

# Quality
npm run check                    # Types + lint + format
npm run fix                      # Auto-fix issues
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
    await app.init({ id: 'test' });
    app.trackCustomEvent('purchase', { amount: 99.99 });
    expect(fetch).toHaveBeenCalled();
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

  await window.__traceLogBridge!.init({ id: 'skip' });
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
// Initialize
await window.__traceLogBridge!.init({ id: 'skip' });

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

### ✅ All Tests
- TypeScript strict mode, proper setup/teardown, descriptive names

### ✅ Unit
- Isolate components, mock dependencies, test edge cases, keep fast (< 100ms)

### ✅ Integration
- Test component interactions, mock external services, verify data flow

### ✅ E2E
- Use `page.evaluate()` + `window.__traceLogBridge!`
- Use `{ id: 'skip' }` configuration
- **CSP-Safe**: Internal waiting pattern (avoid `page.waitForFunction()`)
- Queue events timeout: 10-12 seconds
- **Key**: `sessionId` in `queue.session_id`, NOT individual events

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
