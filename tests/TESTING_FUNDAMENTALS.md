# Testing Fundamentals Guide

**TraceLog Library Testing Strategy** - Comprehensive guide for writing reliable, maintainable tests

---

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Test Types & Strategy](#test-types--strategy)
3. [Project Structure](#project-structure)
4. [Best Practices](#best-practices)
5. [Common Patterns](#common-patterns)
6. [Anti-Patterns](#anti-patterns)
7. [Test Templates](#test-templates)
8. [Debugging & Troubleshooting](#debugging--troubleshooting)

---

## Testing Philosophy

### Core Principles

1. **Test Behavior, Not Implementation**
   - Focus on what the code does, not how it does it
   - Tests should survive refactoring
   - Avoid testing private methods or internal state

2. **Test Critical Paths First**
   - Prioritize tests that cover core functionality
   - Start with P0 (critical), then P1 (essential), finally P2 (advanced)
   - 80/20 rule: 80% of bugs come from 20% of code

3. **Maintain Test Independence**
   - Each test must run in isolation
   - No shared state between tests
   - Tests should pass regardless of execution order

4. **Keep Tests Simple**
   - One logical assertion per test when possible
   - Clear, descriptive test names
   - Minimal setup required

5. **Fast Feedback Loop**
   - Unit tests should be fast (<100ms each)
   - Integration tests moderate (<1s each)
   - E2E tests acceptable to be slower (<10s each)

---

## Test Types & Strategy

### Unit Tests (Vitest)

**Purpose**: Test individual components in isolation

**Characteristics**:
- Mock all dependencies
- Fast execution (<100ms per test)
- High coverage (90%+ for critical code)
- Focus on edge cases and error handling

**When to use**:
- Testing managers (EventManager, SessionManager, etc.)
- Testing handlers (ClickHandler, ScrollHandler, etc.)
- Testing utilities (sanitizers, validators, etc.)
- Testing pure functions

**Coverage targets**:
- Critical core: 95%+
- Managers: 90%+
- Handlers: 85%+
- Utilities: 80%+

---

### Integration Tests (Vitest)

**Purpose**: Test component interactions and data flow

**Characteristics**:
- Test 2-3 components working together
- Mock only external dependencies (fetch, localStorage)
- Moderate execution time (<1s per test)
- Focus on data flow and state changes

**When to use**:
- Testing initialization flow (App → Managers → Handlers)
- Testing event pipeline (Handler → EventManager → SenderManager)
- Testing cross-component features (Consent → Buffering → Flush)
- Testing state synchronization (Multi-tab sync)

**Coverage targets**:
- Critical flows: 90%+
- Integration points: 85%+

---

### E2E Tests (Playwright)

**Purpose**: Test real user scenarios in actual browser

**Characteristics**:
- No mocking (real browser environment)
- Slower execution (<10s per test)
- Tests complete user journeys
- Focus on critical paths and regressions

**When to use**:
- Testing browser APIs (IntersectionObserver, BroadcastChannel)
- Testing real user interactions (clicks, scrolls, navigation)
- Testing cross-browser compatibility
- Testing CSP compliance and security

**Coverage targets**:
- Critical user paths: 100%
- Browser compatibility: Chrome + Mobile Chrome (CI)

---

## Project Structure

```
tests/
├── TESTING_FUNDAMENTALS.md      # This guide
├── setup.ts                      # Vitest global setup
├── vitest-setup.ts              # Vitest config
│
├── helpers/                     # Shared test utilities
│   ├── setup.helper.ts          # Common test setup functions
│   ├── mocks.helper.ts          # Centralized mocks (fetch, localStorage, etc.)
│   ├── fixtures.helper.ts       # Test data fixtures
│   ├── assertions.helper.ts     # Custom assertions
│   ├── wait.helper.ts           # Async wait utilities
│   └── state.helper.ts          # State management helpers
│
├── unit/                        # Unit tests (isolated components)
│   ├── core/                    # P0 - Critical core logic
│   │   ├── app.test.ts          # App initialization & lifecycle
│   │   ├── state-manager.test.ts # Global state management
│   │   └── api.test.ts          # Public API methods
│   │
│   ├── managers/                # P0 - Manager components
│   │   ├── event-manager.test.ts        # Event tracking & queuing
│   │   ├── session-manager.test.ts      # Session lifecycle
│   │   ├── sender-manager.test.ts       # Event transmission
│   │   ├── storage-manager.test.ts      # Storage with fallbacks
│   │   ├── consent-manager.test.ts      # Consent & buffering
│   │   └── user-manager.test.ts         # User UUID management
│   │
│   └── handlers/                # P1 - Event handlers
│       ├── click-handler.test.ts        # Click tracking
│       ├── scroll-handler.test.ts       # Scroll depth tracking
│       ├── pageview-handler.test.ts     # Navigation tracking
│       ├── performance-handler.test.ts  # Web Vitals
│       ├── error-handler.test.ts        # Error tracking
│       └── session-handler.test.ts      # Session wrapper
│
├── integration/                 # Integration tests (component interactions)
│   └── flows/                   # End-to-end flows
│       ├── initialization.test.ts       # Full init flow
│       ├── event-pipeline.test.ts       # Capture → Queue → Send
│       ├── consent-flow.test.ts         # Consent → Buffer → Flush
│       ├── multi-tab-sync.test.ts       # Cross-tab session sync
│       ├── recovery.test.ts             # Failed event recovery
│       └── multi-integration.test.ts    # Multiple backends
│
└── e2e/                         # E2E tests (real browser)
    ├── fixtures/                # HTML fixtures for isolated tests
    │   ├── minimal.html         # Minimal page (just TraceLog)
    │   ├── spa.html            # SPA simulation
    │   └── forms.html          # Forms & inputs (PII testing)
    │
    └── critical-paths/          # Critical user scenarios
        ├── initialization.spec.ts       # Basic init & config
        ├── page-view-tracking.spec.ts   # Navigation tracking
        ├── custom-events.spec.ts        # Custom event API
        ├── click-tracking.spec.ts       # Click interactions
        ├── scroll-tracking.spec.ts      # Scroll depth
        └── error-capture.spec.ts        # Error handling
```

---

## Best Practices

### General Testing Rules

#### ✅ DO

1. **Clean State Between Tests**
   ```typescript
   beforeEach(() => {
     vi.clearAllMocks();
     localStorage.clear();
     sessionStorage.clear();
   });
   ```

2. **Use Descriptive Test Names**
   ```typescript
   // ✅ GOOD
   it('should emit SESSION_START event when starting new session')

   // ❌ BAD
   it('works')
   it('test session')
   ```

3. **One Logical Assertion Per Test**
   ```typescript
   // ✅ GOOD
   it('should set sessionId in state', () => {
     const sessionId = 'test-session';
     sessionManager.startSession(sessionId);
     expect(sessionManager.get('sessionId')).toBe(sessionId);
   });

   // ❌ BAD - Testing multiple unrelated things
   it('should handle session correctly', () => {
     // ... 50 lines of assertions
   });
   ```

4. **Test Edge Cases**
   ```typescript
   it('should handle null config gracefully')
   it('should handle empty event queue')
   it('should handle network timeout')
   ```

5. **Use Test Helpers**
   ```typescript
   import { createMockConfig, createMockEvent } from '../helpers/fixtures.helper';

   const config = createMockConfig({ sessionTimeout: 5000 });
   const event = createMockEvent('CLICK');
   ```

#### ❌ DON'T

1. **Don't Test Implementation Details**
   ```typescript
   // ❌ BAD - Testing private methods
   it('should call _internalMethod', () => {
     expect(instance._internalMethod).toHaveBeenCalled();
   });

   // ✅ GOOD - Testing public behavior
   it('should emit event when tracking', () => {
     instance.track(event);
     expect(emitter.emit).toHaveBeenCalledWith('event', event);
   });
   ```

2. **Don't Share State Between Tests**
   ```typescript
   // ❌ BAD
   let sharedState: any;

   it('test 1', () => {
     sharedState = { foo: 'bar' };
   });

   it('test 2', () => {
     expect(sharedState.foo).toBe('bar'); // Depends on test 1!
   });
   ```

3. **Don't Use Hardcoded Timeouts**
   ```typescript
   // ❌ BAD
   await new Promise(resolve => setTimeout(resolve, 5000));

   // ✅ GOOD - Use helpers or fake timers
   await waitForCondition(() => eventManager.getQueueLength() > 0);
   ```

4. **Don't Use vi.runAllTimersAsync()**
   ```typescript
   // ❌ BAD - Causes infinite loops with setInterval
   await vi.runAllTimersAsync();

   // ✅ GOOD
   await vi.advanceTimersByTimeAsync(10000);
   await vi.runOnlyPendingTimersAsync();
   ```

---

### Unit Test Patterns

#### Pattern 1: Basic Component Test

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventManager } from '@/managers/event.manager';

describe('EventManager', () => {
  let eventManager: EventManager;

  beforeEach(() => {
    vi.clearAllMocks();
    eventManager = new EventManager();
  });

  it('should initialize with empty queue', () => {
    expect(eventManager.getQueueLength()).toBe(0);
  });

  it('should track events', () => {
    eventManager.track({ type: 'CLICK', data: {} });
    expect(eventManager.getQueueLength()).toBe(1);
  });
});
```

#### Pattern 2: Mock External Dependencies

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('SenderManager', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true })
    });
    global.fetch = mockFetch;
  });

  it('should send events via fetch', async () => {
    await senderManager.send(eventsQueue);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/collect',
      expect.objectContaining({
        method: 'POST',
        body: expect.any(String)
      })
    );
  });
});
```

#### Pattern 3: Test Async Operations

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { waitForCondition } from '../helpers/wait.helper';

describe('EventManager - Async', () => {
  it('should flush queue after interval', async () => {
    vi.useFakeTimers();

    eventManager.track({ type: 'CLICK', data: {} });

    await vi.advanceTimersByTimeAsync(10000);
    await vi.runOnlyPendingTimersAsync();

    expect(eventManager.getQueueLength()).toBe(0);

    vi.useRealTimers();
  });
});
```

---

### Integration Test Patterns

#### Pattern 1: Test Component Interaction

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { App } from '@/app';

describe('Initialization Flow', () => {
  let app: App;

  beforeEach(() => {
    app = new App();
  });

  it('should initialize all managers in correct order', async () => {
    await app.init({});

    expect(app.managers.storage).toBeDefined();
    expect(app.managers.event).toBeDefined();
    expect(app.managers.session).toBeDefined();
  });

  it('should emit SESSION_START after initialization', async () => {
    const events: any[] = [];
    app.on('event', (event) => events.push(event));

    await app.init({});

    const sessionStart = events.find(e => e.type === 'SESSION_START');
    expect(sessionStart).toBeDefined();
  });
});
```

#### Pattern 2: Test Data Flow

```typescript
describe('Event Pipeline', () => {
  it('should flow events from handler to sender', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = mockFetch;

    await app.init({
      integrations: {
        custom: { collectApiUrl: 'http://localhost:8080/collect' }
      }
    });

    // Trigger event
    app.event('purchase', { amount: 99.99 });

    // Wait for queue flush
    await vi.advanceTimersByTimeAsync(10000);
    await vi.runOnlyPendingTimersAsync();

    // Verify sent
    expect(mockFetch).toHaveBeenCalled();
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.events[0].custom_event.name).toBe('purchase');
  });
});
```

---

### E2E Test Patterns

#### Pattern 1: Use Shared Playground (docs/)

The `/docs` directory contains a full-featured e-commerce playground used by ALL E2E tests:

**Advantages**:
- Rich, realistic DOM for testing
- Multiple pages (inicio, productos, nosotros, contacto)
- Interactive elements (buttons, forms, navigation)
- Real-world scenarios (cart, products, CTA buttons)
- Maintained once, used everywhere

**Usage**:
```typescript
import { test, expect } from '@playwright/test';

test('should capture click on CTA button', async ({ page }) => {
  await page.goto('/'); // Uses docs/index.html

  const result = await page.evaluate(async () => {
    const events: any[] = [];

    // Wait for bridge
    while (!window.__traceLogBridge) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    await window.__traceLogBridge.init();

    window.__traceLogBridge.on('event', (event) => {
      events.push(event);
    });

    // Click real CTA button from playground
    document.querySelector('[data-testid="cta-ver-productos"]')?.click();

    await new Promise(resolve => setTimeout(resolve, 100));

    return events;
  });

  const clickEvent = result.find((e: any) => e.type === 'CLICK');
  expect(clickEvent).toBeDefined();
});
```

**Available Test IDs in Playground**:
- `nav-inicio`, `nav-productos`, `nav-nosotros`, `nav-contacto`
- `cart-button`, `cart-count`
- `cta-ver-productos`, `cta-contacto`
- `page-inicio`, `page-productos`, `page-nosotros`, `page-contacto`

#### Pattern 2: Use Minimal Fixtures (When Needed)

For tests requiring specific DOM structures (e.g., form testing, PII sanitization):

```typescript
test('should sanitize input values', async ({ page }) => {
  await page.goto('/fixtures/forms.html');

  await page.evaluate(async () => {
    await window.__traceLogBridge.init();

    const input = document.querySelector('input[type="email"]');
    input.value = 'user@example.com';
    input.click(); // Trigger click event

    // Verify value NOT captured
  });
});
```

**When to use fixtures**:
- Testing edge cases not in playground
- Testing specific HTML structures (forms, iframes)
- Testing PII sanitization
- Testing CSP compliance

#### Pattern 3: CSP-Safe Waiting

```typescript
// ❌ BAD - page.waitForFunction() is CSP-blocked
await page.waitForFunction(() => window.__traceLogBridge);

// ✅ GOOD - Internal waiting in page.evaluate()
await page.evaluate(async () => {
  let retries = 0;
  while (!window.__traceLogBridge && retries < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    retries++;
  }

  if (!window.__traceLogBridge) {
    throw new Error('TraceLog bridge not available');
  }

  await window.__traceLogBridge.init();
});
```

#### Pattern 4: Queue Event Verification

```typescript
test('should include sessionId in queue', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const queues: any[] = [];

    await window.__traceLogBridge.init();

    window.__traceLogBridge.on('queue', (queue) => {
      queues.push(queue);
    });

    // Trigger events
    window.__traceLogBridge.event('test', { foo: 'bar' });

    // Wait for queue flush (10s + buffer)
    await new Promise(resolve => setTimeout(resolve, 12000));

    return queues;
  });

  expect(result[0].session_id).toBeDefined(); // sessionId in QUEUE, not events
  expect(result[0].events).toHaveLength(1);
});
```

---

## Anti-Patterns

### ❌ Things to NEVER Do

1. **NEVER use `vi.runAllTimersAsync()`**
   - Causes infinite loops with `setInterval`
   - Use `vi.runOnlyPendingTimersAsync()` instead

2. **NEVER share state between tests**
   - Each test must be independent
   - Always reset state in `beforeEach`

3. **NEVER test private methods**
   - Test public API only
   - Private methods are implementation details

4. **NEVER use hardcoded timeouts**
   - Use helpers or fake timers
   - Make tests deterministic

5. **NEVER ignore flaky tests**
   - Fix the root cause
   - Flaky tests erode trust

6. **NEVER use `page.waitForFunction()` in E2E**
   - CSP-blocked
   - Use internal waiting in `page.evaluate()`

7. **NEVER test implementation details**
   - Focus on behavior
   - Tests should survive refactoring

8. **NEVER commit commented-out tests**
   - Delete or fix them
   - Clean codebase

---

## Test Templates

### Unit Test Template

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ComponentName } from '@/path/to/component';
import { createMockDependency } from '../helpers/mocks.helper';

describe('ComponentName', () => {
  let component: ComponentName;
  let mockDependency: ReturnType<typeof createMockDependency>;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    mockDependency = createMockDependency();
    component = new ComponentName(mockDependency);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('methodName', () => {
    it('should do X when Y', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = component.methodName(input);

      // Assert
      expect(result).toBe('expected');
    });

    it('should handle edge case Z', () => {
      expect(() => component.methodName(null)).toThrow();
    });
  });
});
```

### Integration Test Template

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { App } from '@/app';
import { setupTestEnvironment } from '../helpers/setup.helper';

describe('Integration: Feature Name', () => {
  let app: App;

  beforeEach(() => {
    setupTestEnvironment();
    app = new App();
  });

  it('should complete flow from A to B', async () => {
    // Arrange
    await app.init({ /* config */ });

    // Act
    app.doSomething();

    // Assert
    expect(app.getState()).toMatchObject({
      /* expected state */
    });
  });
});
```

### E2E Test Template

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/'); // Uses docs/index.html playground
  });

  test('should do X when user does Y', async ({ page }) => {
    const result = await page.evaluate(async () => {
      // Wait for bridge
      let retries = 0;
      while (!window.__traceLogBridge && retries < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }

      // Initialize
      await window.__traceLogBridge!.init();

      // Setup listeners
      const events: any[] = [];
      window.__traceLogBridge!.on('event', (event) => {
        events.push(event);
      });

      // Perform action
      document.querySelector('[data-testid="button"]')?.click();

      // Wait for event
      await new Promise(resolve => setTimeout(resolve, 100));

      return events;
    });

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('CLICK');
  });
});
```

---

## Debugging & Troubleshooting

### Unit/Integration Tests

```bash
# Run single test file
npm run test:unit -- app.test.ts

# Run with watch mode
npm run test:unit -- --watch

# Run with verbose output
npm run test:unit -- --verbose

# Run specific test by name
npm run test:unit -- -t "should initialize"

# View coverage
npm run test:coverage
open coverage/index.html
```

### E2E Tests

```bash
# Run in headed mode (see browser)
npx playwright test --headed

# Run with debug mode
npx playwright test --debug

# Run with trace (best for debugging)
npx playwright test --trace on

# View trace after failure
npx playwright show-trace tests-results/trace.zip

# Run specific test file
npx playwright test initialization.spec.ts

# Run single test
npx playwright test -g "should initialize"
```

### Common Issues

#### Issue: Tests timeout

**Cause**: Async operations not completing

**Solution**:
```typescript
// Use fake timers and advance manually
vi.useFakeTimers();
await vi.advanceTimersByTimeAsync(10000);
await vi.runOnlyPendingTimersAsync();
vi.useRealTimers();
```

#### Issue: Flaky E2E tests

**Cause**: Race conditions, timing issues

**Solution**:
```typescript
// Add internal waits in page.evaluate()
await page.evaluate(async () => {
  // Wait for condition
  let attempts = 0;
  while (condition && attempts < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
});
```

#### Issue: Mock not working

**Cause**: Mock defined too late or cleared

**Solution**:
```typescript
beforeEach(() => {
  // Define mocks BEFORE creating instances
  mockFetch = vi.fn().mockResolvedValue({ ok: true });
  global.fetch = mockFetch;

  // Now create instance
  component = new Component();
});
```

#### Issue: State leaking between tests

**Cause**: Not cleaning up properly

**Solution**:
```typescript
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  document.body.innerHTML = '';
});
```

---

## Test Priority Matrix

### P0 - Critical (Must Have)

**Week 1 Focus** - These tests MUST pass for the library to function

**Unit Tests**:
- App.init() - Initialization flow
- EventManager.track() - Event queuing
- SessionManager - Session lifecycle
- StateManager - Global state
- SenderManager - Event transmission

**Integration Tests**:
- Full initialization flow
- Event pipeline (capture → queue → send)

**E2E Tests**:
- Basic initialization
- Page view tracking
- Custom event tracking

**Target**: 100% pass rate, 95%+ coverage

---

### P1 - Essential (Should Have)

**Week 2 Focus** - Important features for production use

**Unit Tests**:
- All handlers (Click, Scroll, Performance, Error)
- ConsentManager - Consent & buffering
- StorageManager - Storage with fallbacks
- Deduplication logic
- Error handling

**Integration Tests**:
- Consent → buffering → flush
- Multi-tab session sync
- Failed event recovery

**E2E Tests**:
- Click tracking with sanitization
- Scroll depth tracking
- Error capture

**Target**: 100% pass rate, 90%+ coverage

---

### P2 - Advanced (Nice to Have)

**Week 3 Focus** - Advanced features and edge cases

**Unit Tests**:
- Transformers
- Rate limiting
- Sampling
- Google Analytics integration

**E2E Tests**:
- QA mode
- Complex user journeys
- Performance impact tests

**Target**: 100% pass rate, 85%+ coverage

---

## Quick Reference

### Commands

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run with coverage
npm run test:coverage

# Type check
npm run type-check

# Lint & format
npm run check
npm run fix
```

### Helper Functions

```typescript
// From helpers/setup.helper.ts
setupTestEnvironment()        // Complete test setup
cleanupTestEnvironment()      // Complete cleanup

// From helpers/mocks.helper.ts
createMockFetch()            // Mock fetch API
createMockStorage()          // Mock localStorage/sessionStorage
createMockBroadcastChannel() // Mock BroadcastChannel

// From helpers/fixtures.helper.ts
createMockConfig()           // Create test config
createMockEvent()            // Create test event
createMockQueue()            // Create test queue

// From helpers/wait.helper.ts
waitForCondition()           // Wait for condition with timeout
waitForEvent()               // Wait for specific event
waitForQueueFlush()          // Wait for queue to flush

// From helpers/assertions.helper.ts
expectEventStructure()       // Validate event structure
expectQueueStructure()       // Validate queue structure
expectSessionId()            // Validate sessionId format
```

### Event Types

Always use lowercase with underscores (source: `src/types/event.types.ts`):

```typescript
'page_view'      // Navigation
'click'          // Click interactions
'scroll'         // Scroll depth
'session_start'  // Session begins
'session_end'    // Session ends
'custom'         // Custom events
'web_vitals'     // Performance metrics
'error'          // Error tracking
```

---

## Acceptance Criteria

Before merging any test changes, ensure:

- ✅ **100% pass rate** - All tests passing
- ✅ **No type errors** - `npm run type-check` passes
- ✅ **No lint errors** - `npm run check` passes (warnings OK)
- ✅ **Coverage targets met** - Per priority level (P0: 95%, P1: 90%, P2: 85%)
- ✅ **No flaky tests** - Tests pass consistently (3+ runs)
- ✅ **Fast execution** - Unit <100ms, Integration <1s, E2E <10s
- ✅ **Clean code** - No TODOs, no commented code, clear names
- ✅ **Documentation updated** - If adding new patterns

---

**Last Updated**: October 2024
**Version**: 1.0.0
**Maintained By**: TraceLog Team
