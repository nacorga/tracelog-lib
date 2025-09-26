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

#### Simple Pattern (Fixture)
```typescript
import { traceLogTest } from '../fixtures/tracelog-fixtures';
import { TRACELOG_CONFIGS } from '../config/test-config';

traceLogTest('basic test', async ({ traceLogPage }) => {
  await traceLogPage.initializeTraceLog(TRACELOG_CONFIGS.MINIMAL);
  await traceLogPage.clickElement('[data-testid="button"]');

  await expect(traceLogPage).toHaveNoTraceLogErrors();
});
```

#### Advanced Pattern (Builder DSL)
```typescript
import { TraceLogTestBuilder } from '../builders/test-scenario-builder';

traceLogTest('complex flow', async ({ traceLogPage }) => {
  await TraceLogTestBuilder
    .create(traceLogPage)
    .withConfig(TRACELOG_CONFIGS.STANDARD)
    .expectInitialization()
    .startEventCapture()
    .simulateUserJourney('purchase_intent')
    .expectEvents(['CLICK', 'SCROLL'])
    .expectNoErrors()
    .run();
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
// TraceLogTestPage (automatic fixture)
await traceLogPage.initializeTraceLog(config);
await traceLogPage.clickElement(selector);
await traceLogPage.sendCustomEvent(name, data);
const events = await traceLogPage.getTrackedEvents();

// Custom matchers
await expect(traceLogPage).toHaveNoTraceLogErrors();
await expect(events).toHaveEvent('CLICK');
await expect(events).toHaveCustomEvent('user_action');

// Predefined configurations
TRACELOG_CONFIGS.MINIMAL        // Basic tests
TRACELOG_CONFIGS.STANDARD       // General tests
TRACELOG_CONFIGS.FULL_FEATURED  // Complete tests
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
- Use `traceLogTest` fixture (automatic setup/cleanup)
- Use predefined configurations (`TRACELOG_CONFIGS.*`)
- Use custom matchers (`toHaveNoTraceLogErrors`, `toHaveEvent`)
- Builder DSL for complex scenarios
- Adapt `__traceLogBridge` as needed

### ❌ Avoid
- Hardcoded timeouts: `await page.waitForTimeout(2000)` (E2E only)
- Inline configurations: `{ id: 'hardcoded', sessionTimeout: 900000 }`
- Direct Bridge access: `window.__traceLogBridge.getSessionData()` (E2E only)
- Testing implementation details instead of behavior
- Flaky tests that pass/fail inconsistently
- Shared mutable state between tests

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
- NO lint errors (use `npm run lint` script to verify)

### Coverage Requirements
- **Unit Tests**: 90%+ line coverage for core logic
- **Integration Tests**: Critical paths covered
- **E2E Tests**: User journeys and error scenarios

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
// Automatic console monitoring
await expect(traceLogPage).toHaveNoTraceLogErrors();
await expect(consoleMonitor).not.toHaveMessage(/\[TraceLog:ERROR\]/);
```

#### Memory Leaks (E2E)
```typescript
// Performance monitoring
await expect(performanceMonitor).toHaveNoMemoryLeaks();
await expect(performanceMonitor).toHaveNoExcessiveEventQueuing();
```

#### Security Issues (All Types)
```typescript
// Data sanitization validation
expect(sanitizeMetadata(userInput)).not.toContainScript();
await expect(events).toHaveSanitizedData();
await expect(events).not.toContainScript();
```

### Reports Generated

- `coverage/` - Code coverage reports (unit/integration)
- `test-reports/anomaly-report.json` - Performance and behavior anomalies (E2E)
- `test-results/failed-tests.json` - Test failures with library issues (E2E)
- `playwright-report/` - Detailed execution reports with screenshots (E2E)