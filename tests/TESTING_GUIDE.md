# Testing Guide

## 🎯 TraceLog Testing Framework

Comprehensive testing strategy using unit tests, integration tests, and end-to-end testing with Playwright. Custom fixtures, fluent builders, and specific matchers for TraceLog library validation.

### Technology Stack
- **Unit/Integration**: **Jest** + **TypeScript** with strict type safety
- **E2E**: **Playwright** + **TypeScript** with strict type safety
- **Testing Bridge**: `__traceLogBridge` for consistent access
- **Enhanced Framework**: Fixtures, Page Objects, Builders, Matchers

## 🔧 Main Commands

```bash
# Unit Tests
npm run test:unit                # Unit tests only
npm run test:unit -- --watch     # Watch mode
npm run test:unit -- --coverage  # Coverage report

# Integration Tests
npm run test:integration         # Integration tests only
npm run test:integration -- --verbose # Detailed output

# E2E Tests
npm run test:e2e                 # All E2E tests
npm run test:e2e -- --headed     # Visual mode
npm run test:e2e -- --grep "X"   # Specific tests

# All Tests
npm run test                     # Run all test types
npm run test:coverage            # Complete coverage report

# Quality
npm run check                    # Check everything (types + lint + format)
npm run fix                      # Auto-fix
npm run type-check:watch         # Continuous checking
```

## ❗ Test Failure Triage

If tests fail to run or fail unexpectedly, determine whether the failure stems from the test configuration/setup or from a defect in the TraceLog library.

- If it is a test configuration/setup issue, fix the test environment or mocks first.
- If it is a library defect, the issue must be corrected in the library before continuing with the tests.

## 🧪 Testing Patterns

### Unit Tests

#### Simple Pattern
```typescript
import { EventManager } from '../src/managers/event.manager';
import { MOCK_CONFIGS } from './mocks/config.mock';

describe('EventManager', () => {
  let eventManager: EventManager;

  beforeEach(() => {
    eventManager = new EventManager();
    eventManager.setState(MOCK_CONFIGS.MINIMAL);
  });

  it('should track events correctly', () => {
    const event = { type: 'CLICK', data: { x: 100, y: 200 } };

    eventManager.track(event);

    expect(eventManager.getQueueLength()).toBe(1);
    expect(eventManager.getLastEvent()).toMatchObject(event);
  });
});
```

#### Mock Pattern
```typescript
import { SessionManager } from '../src/managers/session.manager';
import { mockLocalStorage, mockTimestamp } from './mocks/browser.mock';

describe('SessionManager', () => {
  beforeEach(() => {
    mockLocalStorage();
    mockTimestamp('2024-01-01T10:00:00Z');
  });

  it('should manage sessions across tabs', () => {
    const sessionManager = new SessionManager();

    sessionManager.createSession();

    expect(sessionManager.getCurrentSession()).toBeDefined();
    expect(localStorage.setItem).toHaveBeenCalledWith(
      expect.stringContaining('session'),
      expect.any(String)
    );
  });
});
```

### Integration Tests

#### API Integration Pattern
```typescript
import { App } from '../src/app';
import { mockFetch, mockBridge } from './mocks/integration.mock';
import { TRACELOG_CONFIGS } from './config/test-config';

describe('App Integration', () => {
  beforeEach(() => {
    mockFetch();
    mockBridge();
  });

  it('should initialize and send events to API', async () => {
    const app = new App();

    await app.init(TRACELOG_CONFIGS.STANDARD);
    app.trackCustomEvent('purchase', { amount: 99.99 });

    // Verify API calls
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/events'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('purchase')
      })
    );
  });
});
```

#### Cross-Component Integration
```typescript
import { App } from '../src/app';
import { EventManager } from '../src/managers/event.manager';
import { SessionManager } from '../src/managers/session.manager';

describe('Component Integration', () => {
  it('should coordinate between managers', async () => {
    const app = new App();
    const eventSpy = jest.spyOn(EventManager.prototype, 'track');
    const sessionSpy = jest.spyOn(SessionManager.prototype, 'updateActivity');

    await app.init(TRACELOG_CONFIGS.FULL_FEATURED);

    // Simulate user interaction
    const clickEvent = new MouseEvent('click', { clientX: 100, clientY: 200 });
    document.dispatchEvent(clickEvent);

    expect(eventSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'CLICK' })
    );
    expect(sessionSpy).toHaveBeenCalled();
  });
});
```

### E2E Tests

#### Basic Pattern (Direct page.evaluate)
```typescript
import { test, expect } from '@playwright/test';

test.describe('Basic TraceLog Tests', () => {
  test('should initialize and capture events', async ({ page }) => {
    // Navigate to playground
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for TraceLog bridge to be available
    await page.waitForFunction(() => !!window.__traceLogBridge!, { timeout: 5000 });

    // Initialize TraceLog and capture events
    const result = await page.evaluate(async () => {
      const events: any[] = [];

      // Listen for events
      window.__traceLogBridge!.on('event', (data: any) => {
        events.push(data);
      });

      // Initialize TraceLog
      await window.__traceLogBridge!.init({ id: 'skip' });

      // Trigger some activity
      document.querySelector('[data-testid="button"]')?.dispatchEvent(
        new MouseEvent('click', { bubbles: true })
      );

      // Wait for events
      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        initialized: window.__traceLogBridge!.initialized,
        events
      };
    });

    expect(result.initialized).toBe(true);
    expect(result.events.length).toBeGreaterThan(0);
  });
});
```

#### Queue Events Pattern
```typescript
test('should capture queue events', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForFunction(() => !!window.__traceLogBridge!, { timeout: 5000 });

  const queueEvents = await page.evaluate(async () => {
    const queues: any[] = [];

    // Listen for queue events
    window.__traceLogBridge!.on('queue', (data: any) => {
      queues.push(data);
    });

    await window.__traceLogBridge!.init({ id: 'skip' });
    window.__traceLogBridge!.sendCustomEvent('test_event');

    // Wait for queue (10-second intervals in realistic mode)
    const startTime = Date.now();
    while (queues.length === 0 && Date.now() - startTime < 12000) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return queues;
  });

  expect(queueEvents.length).toBeGreaterThan(0);
  expect(queueEvents[0].events).toBeDefined();
  expect(queueEvents[0].session_id).toBeDefined();
});
```

## 🔑 Essential APIs

### Unit Test Utilities
```typescript
// Mock helpers
import { mockBrowserAPIs, restoreBrowserAPIs } from './mocks/browser.mock';
import { createMockEvent, createMockSession } from './mocks/data.mock';

// Assertions
expect(result).toBeValidEvent();
expect(session).toBeValidSession();
expect(eventQueue).toHaveLength(3);
```

### Integration Test Utilities
```typescript
// Test app setup
import { createTestApp, cleanupTestApp } from './helpers/app.helper';
import { mockNetworkRequests } from './mocks/network.mock';

// API verification
expect(fetch).toHaveBeenCalledTimes(2);
expect(mockAPI.getLastRequest()).toMatchSnapshot();
```

### E2E Test APIs
```typescript
// Real E2E APIs using page.evaluate()
// Initialize TraceLog
await page.evaluate(async () => {
  await window.__traceLogBridge!.init({ id: 'skip' });
});

// Listen for events
const events = await page.evaluate(async () => {
  const events: any[] = [];
  window.__traceLogBridge!.on('event', (data: any) => {
    events.push(data);
  });
  // ... trigger events ...
  return events;
});

// Send custom events
await page.evaluate(async () => {
  window.__traceLogBridge!.sendCustomEvent('event_name', { data: 'value' });
});

// Get session data
const sessionInfo = await page.evaluate(() => {
  return window.__traceLogBridge!.getSessionData();
});

// Standard configuration
const config = { id: 'skip' }; // Uses SpecialProjectId.Skip for realistic behavior
```

## ⚡ Best Practices

### ✅ Common Practices
- Use TypeScript strict mode across all test types
- Implement proper setup/teardown in `beforeEach`/`afterEach`
- Use descriptive test names that explain behavior
- Group related tests using `describe` blocks
- Mock external dependencies consistently

### ✅ Unit Tests
- Test single units in isolation
- Mock all external dependencies
- Use data builders for complex test objects
- Test edge cases and error conditions
- Keep tests fast (< 100ms per test)

### ✅ Integration Tests
- Test component interactions
- Use real implementations where practical
- Mock external services (APIs, localStorage)
- Verify data flow between components
- Test configuration variations

### ✅ E2E Tests
- Use `page.evaluate()` for TraceLog interactions
- Use `window.__traceLogBridge!` for library access
- Use `{ id: 'skip' }` configuration for realistic behavior
- Wait for bridge availability: `await page.waitForFunction(() => !!window.__traceLogBridge!)`
- Use proper timeouts for queue events (10-12 seconds)
- Capture events using `on('event')` and `on('queue')` listeners

### ❌ Avoid
- Hardcoded timeouts: `await page.waitForTimeout(2000)`
- Complex configurations: `{ id: 'hardcoded', sessionTimeout: 900000 }`
- Accessing window properties directly outside page.evaluate()
- Testing implementation details instead of behavior
- Flaky tests that pass/fail inconsistently
- Shared mutable state between tests
- Over-engineering with complex abstractions and builders

## 🔍 Debug

### Unit/Integration Tests
```bash
npm run test:unit -- --verbose     # Detailed output
npm run test:unit -- --watch       # Watch mode
npm run test -- --testNamePattern="SessionManager"  # Specific tests
```

### E2E Tests
```bash
npm run test:e2e -- --headed    # Visual mode
npm run test:e2e -- --debug     # DevTools
npm run test:e2e -- --trace on  # Generate traces
```

### Coverage Reports
```bash
npm run test:coverage           # Complete coverage report
open coverage/lcov-report/index.html  # View coverage in browser
```

## ⭐ Acceptance Criteria

### All Test Types
- 100% pass rating
- NO type errors (use `npm run type-check` script to verify)
- NO lint errors (use `npm run lint` script to verify - warnings are acceptable, only errors block acceptance)

### Coverage Requirements
- **Unit Tests**: 90%+ line coverage for core logic
- **Integration Tests**: Critical paths covered
- **E2E Tests**: User journeys and error scenarios

## 🧪 Basic E2E Tests Implementation

The current E2E test suite consists of 5 basic tests that guarantee correct TraceLog library functionality:

### Test 1: Basic Initialization (12 tests)
- ✅ Successful TraceLog initialization
- ✅ Duplicate initialization handling
- ✅ Error handling for missing project ID

### Test 2: Basic Click Events (12 tests)
- ✅ Click event capture
- ✅ Multiple click events
- ✅ Click position data

### Test 3: Basic Custom Events (20 tests)
- ✅ Custom events without metadata
- ✅ Custom events with metadata
- ✅ Multiple custom events
- ✅ Invalid event name handling

### Test 4: Basic Queue Events (20 tests)
- ✅ Automatic queue sending
- ✅ Multiple events in queue
- ✅ Session information in queue
- ✅ Queue timing intervals

### Test 5: Basic Session Management (30 tests)
- ✅ Session initialization
- ✅ Session persistence across interactions
- ✅ Session start/end events
- ✅ Session data structure validation
- ✅ Session recovery
- ✅ Unique session ID generation

**Total: 100 tests across 5 browsers (Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari)**

### Implementation Approach
- **Simple & Direct**: No over-engineering or complex abstractions
- **Real Data**: Uses actual library events (EventData, BaseEventsQueueDto)
- **Incremental**: Each test must pass acceptance criteria before proceeding to next
- **Realistic**: Uses `{ id: 'skip' }` configuration for realistic behavior

## 🛡️ Library Error Detection

### Automated Monitoring

Tests automatically detect issues in TraceLog library:

```bash
npm run test:unit                 # Logic and state validation
npm run test:integration          # Component interaction validation
npm run test:e2e                 # Runtime error detection
npm run ci:health-check          # System health validation
node scripts/test-anomaly-report.js  # Anomaly analysis
```

### Error Categories

#### Logic Errors (Unit)
```typescript
// State management validation
expect(sessionManager.getState()).toBeValidState();
expect(eventManager.validateEvent(event)).toBe(true);
```

#### Integration Errors
```typescript
// Component communication validation
expect(eventManager.queue).toHaveLength(2);
expect(sessionManager.isActive()).toBe(true);
```

#### Runtime Errors (E2E)
```typescript
// Basic error detection in real E2E tests
test('should not have console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  await page.goto('/');
  await page.evaluate(async () => {
    await window.__traceLogBridge!.init({ id: 'skip' });
  });

  expect(errors).toHaveLength(0);
});
```

#### Memory Leaks (E2E)
```typescript
// Performance monitoring through event counts
test('should not accumulate excessive events', async ({ page }) => {
  const eventCounts = await page.evaluate(async () => {
    await window.__traceLogBridge!.init({ id: 'skip' });

    // Generate many events
    for (let i = 0; i < 100; i++) {
      window.__traceLogBridge!.sendCustomEvent(`test_${i}`);
    }

    // Check internal queue doesn't grow indefinitely
    return {
      queueLength: window.__traceLogBridge!.getQueueLength?.() || 0
    };
  });

  expect(eventCounts.queueLength).toBeLessThan(50); // Reasonable limit
});
```

#### Security Issues (All Types)
```typescript
// Data sanitization validation in real events
test('should sanitize event data', async ({ page }) => {
  const events = await page.evaluate(async () => {
    const events: any[] = [];
    window.__traceLogBridge!.on('event', (data: any) => {
      events.push(data);
    });

    await window.__traceLogBridge!.init({ id: 'skip' });
    window.__traceLogBridge!.sendCustomEvent('test', {
      script: '<script>alert("xss")</script>',
      safe: 'normal data'
    });

    await new Promise(resolve => setTimeout(resolve, 500));
    return events;
  });

  const customEvent = events.find(e => e.type === 'custom');
  expect(customEvent.custom_event.metadata.script).not.toContain('<script>');
});
```

### Reports Generated

- `coverage/` - Code coverage reports (unit/integration)
- `test-reports/anomaly-report.json` - Performance and behavior anomalies (E2E)
- `test-results/failed-tests.json` - Test failures with library issues (E2E)
- `playwright-report/` - Detailed execution reports with screenshots (E2E)