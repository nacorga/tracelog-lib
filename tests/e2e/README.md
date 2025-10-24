# E2E Test Guide

**TraceLog Library E2E Testing** - Comprehensive guide for writing and maintaining E2E tests with Playwright

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Test Structure](#test-structure)
4. [Helper Modules](#helper-modules)
5. [Writing Tests](#writing-tests)
6. [Running Tests](#running-tests)
7. [Best Practices](#best-practices)
8. [Common Patterns](#common-patterns)
9. [Troubleshooting](#troubleshooting)

---

## Overview

E2E tests validate TraceLog behavior in real browsers using Playwright. These tests ensure that:
- Events are captured correctly in real browser environments
- PII sanitization works as expected
- Event listeners receive emitted events
- TraceLog integrates properly with web pages

### Key Characteristics

- **Real Browser Testing**: Tests run in actual Chromium/Firefox/WebKit browsers
- **CSP-Safe**: All tests respect Content Security Policy (no `page.waitForFunction()`)
- **Isolated**: Each test runs independently with clean state
- **Type-Safe**: Uses TypeScript interfaces for event data
- **Reusable**: Shared helpers eliminate 85%+ code duplication

---

## Quick Start

### 1. Start Test Server

```bash
# Terminal 1: Start test server (localhost:3000)
npm run serve
```

### 2. Run Tests

```bash
# Terminal 2: Run all E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- click-tracking

# Run in headed mode (see browser)
npx playwright test --headed

# Run with trace for debugging
npx playwright test --trace on
```

### 3. Create New Test

```bash
# Copy template
cp tests/e2e/TEMPLATE.spec.ts tests/e2e/critical-paths/my-feature.spec.ts

# Edit and customize
# See TEMPLATE.spec.ts for examples
```

---

## Test Structure

All E2E tests follow this standard structure:

```typescript
import { test, expect } from '@playwright/test';
import { E2E_SETUP_CODE, E2E_WAIT_TIMES } from './helpers/bridge.helper';
import { CapturedEvent, findEventByType, assertEventStructure } from './helpers/assertions.helper';

test.describe('E2E: Feature Name', () => {
  // Prevent auto-initialization
  test.beforeEach(async ({ page }) => {
    await page.goto('/?auto-init=false');
  });

  test('should do something', async ({ page }) => {
    // 1. Execute test in browser context
    const result = await page.evaluate(async (): Promise<CapturedEvent[]> => {
      // 2. Setup (wait + init + listener)
      ${E2E_SETUP_CODE}

      // 3. Trigger action
      // ... your test code ...

      // 4. Wait for processing
      await new Promise((resolve) => setTimeout(resolve, ${E2E_WAIT_TIMES.EVENT_PROCESSING}));

      // 5. Return events
      return events;
    });

    // 6. Assert results (Node.js context)
    const event = findEventByType(result, 'click');
    assertEventStructure(event, 'click');
    expect(event!.click_data).toBeDefined();
  });
});
```

### Critical Pattern: Browser vs Node.js Context

```typescript
// ❌ WRONG: Trying to access Playwright expect in browser context
await page.evaluate(() => {
  ${E2E_SETUP_CODE}
  button.click();
  expect(events.length).toBeGreaterThan(0); // ERROR: expect not defined in browser!
});

// ✅ CORRECT: Return data from browser, assert in Node.js
const result = await page.evaluate((): Promise<CapturedEvent[]> => {
  ${E2E_SETUP_CODE}
  button.click();
  return events; // Return serializable data
});
expect(result.length).toBeGreaterThan(0); // Assert in Node.js context
```

---

## Helper Modules

### `bridge.helper.ts` - Setup & Constants

**Purpose**: Provides reusable code snippets for bridge initialization and documented wait times.

#### Code Snippets

```typescript
// Complete setup (recommended for most tests)
${E2E_SETUP_CODE}
// Includes: bridge wait + destroy + init + event listener

// Individual components
${E2E_BRIDGE_WAIT_CODE}  // Wait for bridge availability
${E2E_INIT_CODE}         // Destroy + init
${E2E_EVENT_LISTENER_CODE} // Setup listener
```

#### Wait Time Constants

```typescript
E2E_WAIT_TIMES.EVENT_PROCESSING  // 200ms - Standard events (click, custom)
E2E_WAIT_TIMES.INIT_COMPLETE     // 300ms - After init (SESSION_START, PAGE_VIEW)
E2E_WAIT_TIMES.DEBOUNCE          // 500ms - Debounced events (scroll)
E2E_WAIT_TIMES.RATE_LIMIT        // 800ms - Rate-limited events
E2E_WAIT_TIMES.THROTTLE          // 1100ms - Throttled events (page view)
E2E_WAIT_TIMES.ERROR_PROCESSING  // 500ms - Error events (with stack traces)
```

### `assertions.helper.ts` - Type-Safe Assertions

**Purpose**: Provides TypeScript interfaces and helper functions for event assertions.

#### Interfaces

```typescript
CapturedEvent      // Base event interface
ClickData          // Click event data
ScrollData         // Scroll event data
CustomEventData    // Custom event data
ErrorData          // Error event data
```

#### Helper Functions

```typescript
// Find events
findEventByType(events, 'click')         // Find first event by type
findEventsByType(events, 'scroll')       // Find all events by type
findCustomEventByName(events, 'purchase') // Find custom event by name

// Assert structure
assertEventStructure(event, 'click')     // Assert event exists and has correct type

// Validate data
assertPIISanitized(text, ['email@x.com']) // Assert PII is redacted
assertValidTimestamp(event)              // Assert timestamp is valid
assertValidClickCoordinates(clickData)   // Assert click coordinates valid
assertValidScrollDepth(scrollData)       // Assert scroll depth valid
```

---

## Writing Tests

### Basic Event Capture Test

```typescript
test('should capture click events', async ({ page }) => {
  const result = await page.evaluate(async (): Promise<CapturedEvent[]> => {
    ${E2E_SETUP_CODE}

    // Click button
    const button = document.querySelector('[data-testid="btn"]') as HTMLElement;
    if (button) button.click();

    await new Promise((resolve) => setTimeout(resolve, ${E2E_WAIT_TIMES.EVENT_PROCESSING}));
    return events;
  });

  const clickEvent = findEventByType(result, 'click');
  assertEventStructure(clickEvent, 'click');
  expect(clickEvent!.click_data!.tag).toBe('button');
});
```

### Custom Event Test

```typescript
test('should track custom events', async ({ page }) => {
  const result = await page.evaluate(async (): Promise<CapturedEvent[]> => {
    ${E2E_SETUP_CODE}

    window.__traceLogBridge.event('purchase', { amount: 99.99, currency: 'USD' });

    await new Promise((resolve) => setTimeout(resolve, ${E2E_WAIT_TIMES.EVENT_PROCESSING}));
    return events;
  });

  const purchaseEvent = findCustomEventByName(result, 'purchase');
  assertEventStructure(purchaseEvent, 'custom');
  expect(purchaseEvent!.custom_event!.metadata!.amount).toBe(99.99);
});
```

### PII Sanitization Test

```typescript
test('should sanitize PII', async ({ page }) => {
  const result = await page.evaluate(async (): Promise<CapturedEvent[]> => {
    ${E2E_SETUP_CODE}

    const btn = document.createElement('button');
    btn.textContent = 'Email: user@example.com';
    document.body.appendChild(btn);
    btn.click();

    await new Promise((resolve) => setTimeout(resolve, ${E2E_WAIT_TIMES.EVENT_PROCESSING}));
    document.body.removeChild(btn);
    return events;
  });

  const clickEvent = findEventByType(result, 'click');
  assertEventStructure(clickEvent, 'click');
  assertPIISanitized(clickEvent!.click_data!.text!, ['user@example.com']);
});
```

### Custom Config Test

```typescript
test('should work with custom config', async ({ page }) => {
  const result = await page.evaluate(async (): Promise<CapturedEvent[]> => {
    ${E2E_BRIDGE_WAIT_CODE}

    // Custom initialization
    window.__traceLogBridge.destroy(true);
    await window.__traceLogBridge.init({
      sessionTimeout: 5000,
      globalMetadata: { testMode: true },
    });

    ${E2E_EVENT_LISTENER_CODE}

    // Test code...
    await new Promise((resolve) => setTimeout(resolve, ${E2E_WAIT_TIMES.EVENT_PROCESSING}));
    return events;
  });

  // Assertions...
});
```

---

## Running Tests

### All Tests

```bash
npm run test:e2e
```

### Specific Test File

```bash
npm run test:e2e -- click-tracking
npm run test:e2e -- initialization
```

### Specific Test by Name

```bash
npx playwright test -g "should capture click events"
```

### Watch Mode (Re-run on Changes)

```bash
npx playwright test --watch
```

### Headed Mode (See Browser)

```bash
npx playwright test --headed
```

### Debug Mode

```bash
npx playwright test --debug
```

### With Trace (Best for Debugging)

```bash
npx playwright test --trace on

# View trace on failure
npx playwright show-trace tests-results/trace.zip
```

### Specific Browser

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

---

## Best Practices

### ✅ Do's

1. **Use Helpers**: Always use `E2E_SETUP_CODE` instead of copying boilerplate
2. **Type Return Values**: Always type the return value as `Promise<CapturedEvent[]>`
3. **Use Wait Constants**: Use `E2E_WAIT_TIMES` constants instead of magic numbers
4. **Return Serializable Data**: Only return JSON-serializable data from `page.evaluate()`
5. **Use Type-Safe Assertions**: Use `assertEventStructure()` instead of manual checks
6. **Isolate Tests**: Each test should be independent (beforeEach resets state)
7. **Clean Up DOM**: Remove created elements after tests
8. **Document Wait Times**: If you need custom wait time, document why

### ❌ Don'ts

1. **Don't use `page.waitForFunction()`**: Blocked by CSP, use polling in `page.evaluate()`
2. **Don't access Playwright APIs in browser context**: `expect()` only works in Node.js
3. **Don't skip `?auto-init=false`**: Prevents race conditions
4. **Don't share state between tests**: Each test should be independent
5. **Don't return non-serializable data**: No functions, DOM nodes, or circular refs
6. **Don't use hardcoded URLs**: Use `page.goto('/?auto-init=false')`
7. **Don't mix test concerns**: One test should validate one specific behavior

---

## Common Patterns

### Pattern 1: Test Multiple Events

```typescript
test('should capture multiple scroll events', async ({ page }) => {
  const result = await page.evaluate(async (): Promise<CapturedEvent[]> => {
    ${E2E_SETUP_CODE}

    window.scrollTo(0, 100);
    await new Promise((resolve) => setTimeout(resolve, ${E2E_WAIT_TIMES.DEBOUNCE}));

    window.scrollTo(0, 200);
    await new Promise((resolve) => setTimeout(resolve, ${E2E_WAIT_TIMES.RATE_LIMIT}));

    return events;
  });

  const scrollEvents = findEventsByType(result, 'scroll');
  expect(scrollEvents.length).toBeGreaterThanOrEqual(2);
});
```

### Pattern 2: Test Event Emission

```typescript
test('should emit events to listeners', async ({ page }) => {
  const result = await page.evaluate(async () => {
    ${E2E_SETUP_CODE}

    let emitted = false;
    window.__traceLogBridge.on('event', (evt) => {
      if (evt.type === 'click') emitted = true;
    });

    const btn = document.querySelector('[data-testid="btn"]') as HTMLElement;
    if (btn) btn.click();

    await new Promise((resolve) => setTimeout(resolve, ${E2E_WAIT_TIMES.EVENT_PROCESSING}));
    return { emitted, events };
  });

  expect(result.emitted).toBe(true);
  expect(result.events.length).toBeGreaterThan(0);
});
```

### Pattern 3: Organized Test Suites

```typescript
test.describe('E2E: Click Tracking', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?auto-init=false');
  });

  test.describe('Event Capture', () => {
    test('should capture clicks on buttons', async ({ page }) => { /* ... */ });
    test('should capture element attributes', async ({ page }) => { /* ... */ });
  });

  test.describe('Privacy & Security', () => {
    test('should sanitize PII', async ({ page }) => { /* ... */ });
    test('should respect data-tlog-ignore', async ({ page }) => { /* ... */ });
  });
});
```

---

## Troubleshooting

### Problem: Bridge Not Available

**Symptom**: Error "TraceLog bridge not available"

**Solution**:
```typescript
// Ensure test server is running
npm run serve

// Check that script is loaded in test HTML
// Increase wait retries if needed (default: 50 × 100ms = 5s)
```

### Problem: Events Not Captured

**Symptom**: `findEventByType()` returns `undefined`

**Solutions**:
1. Increase wait time: `E2E_WAIT_TIMES.EVENT_PROCESSING` → `E2E_WAIT_TIMES.DEBOUNCE`
2. Check event type is lowercase: `'click'` not `'CLICK'`
3. Verify event is actually triggered (check with `console.log(events)`)
4. Check if event is filtered by config (e.g., `disabledEvents`)

### Problem: Type Errors

**Symptom**: TypeScript errors in test code

**Solutions**:
```typescript
// ✅ Type the return value
const result = await page.evaluate(async (): Promise<CapturedEvent[]> => { ... });

// ✅ Import types
import { CapturedEvent } from './helpers/assertions.helper';

// ✅ Use type assertion after validation
assertEventStructure(event, 'click');
expect(event!.click_data).toBeDefined(); // Now TypeScript knows event is defined
```

### Problem: CSP Violations

**Symptom**: Tests fail with "Content Security Policy" errors

**Solutions**:
```typescript
// ❌ DON'T use page.waitForFunction()
await page.waitForFunction(() => window.__traceLogBridge);

// ✅ DO use polling inside page.evaluate()
await page.evaluate(async () => {
  let retries = 0;
  while (!window.__traceLogBridge && retries < 50) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    retries++;
  }
});
```

### Problem: Timing Issues

**Symptom**: Tests are flaky, sometimes pass, sometimes fail

**Solutions**:
1. Use appropriate wait time constant for the event type
2. Don't use arbitrary timeouts - use documented constants
3. For debounced/throttled events, use longer waits
4. Check if test needs multiple wait periods

### Problem: Can't Return Data

**Symptom**: Error returning data from `page.evaluate()`

**Solution**:
```typescript
// ❌ WRONG: Non-serializable
return window.__traceLogBridge; // Can't serialize functions/classes

// ✅ CORRECT: Serializable
return {
  events: window.__traceLogBridge.getQueueEvents(),
  sessionId: window.__traceLogBridge.getSessionData().sessionId,
};
```

---

## Additional Resources

- **Template**: See `TEMPLATE.spec.ts` for complete examples
- **Helpers**: See `helpers/bridge.helper.ts` and `helpers/assertions.helper.ts`
- **Playwright Docs**: https://playwright.dev/docs/intro
- **Project CLAUDE.md**: See root CLAUDE.md for full testing strategy

---

## Checklist for New Tests

- [ ] Copy from `TEMPLATE.spec.ts`
- [ ] Import helpers: `bridge.helper.ts`, `assertions.helper.ts`
- [ ] Use `E2E_SETUP_CODE` for standard setup
- [ ] Type return value as `Promise<CapturedEvent[]>`
- [ ] Use `E2E_WAIT_TIMES` constants (no magic numbers)
- [ ] Use type-safe assertion helpers
- [ ] Navigate to `/?auto-init=false` in `beforeEach`
- [ ] Clean up any created DOM elements
- [ ] Test passes in isolation: `npm run test:e2e -- my-test`
- [ ] Test passes with full suite: `npm run test:e2e`
- [ ] No lint/format errors: `npm run fix && npm run type-check`

---

**Last Updated**: October 2025
**Maintained By**: TraceLog Development Team
