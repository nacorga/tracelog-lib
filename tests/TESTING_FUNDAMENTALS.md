# Testing Fundamentals Guide

**TraceLog Library Testing Strategy** - Comprehensive guide for writing reliable, maintainable tests

---

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [TestBridge Architecture](#testbridge-architecture)
3. [Test Types & Strategy](#test-types--strategy)
4. [Project Structure](#project-structure)
5. [Best Practices](#best-practices)
6. [Common Patterns](#common-patterns)
7. [Anti-Patterns](#anti-patterns)
8. [Test Templates](#test-templates)
9. [Debugging & Troubleshooting](#debugging--troubleshooting)

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

6. **Library Code Should NOT Adapt to Tests**
   - Tests adapt to library, not vice versa
   - Use TestBridge as adapter layer
   - Never modify production code for test purposes (except TestBridge itself)

---

## TestBridge Architecture

### Key Principle

**Library code should NOT adapt to tests. TestBridge adapts tests to library.**

The `TestBridge` class (`src/test-bridge.ts`) acts as the **adapter layer** between tests and the library's internal implementation. This maintains a clean separation:

- ✅ **TestBridge** exposes internal managers, handlers, and state for test inspection
- ✅ **Tests** use TestBridge to access and validate library behavior
- ❌ **Library code** (App, managers, handlers) never modified for test purposes

---

### 🎯 CRITICAL RULE: Always Use `bridge.helper.ts`

**DO NOT write custom bridge initialization or direct access code. ALWAYS use the provided helper functions from `tests/helpers/bridge.helper.ts`.**

#### ✅ CORRECT Usage Pattern

```typescript
import {
  initTestBridge,          // Initialize bridge + wait for ready
  destroyTestBridge,       // Cleanup bridge
  getManagers,             // Get managers (event, storage, consent)
  getHandlers,             // Get handlers (session, click, scroll, etc.)
  getQueueState,           // Get queue state (length + events)
  getStateSnapshot,        // Get full state snapshot
  collectEvents,           // Collect events emitted during test
  waitForEvents,           // Wait for N events to be emitted
  triggerAndWaitForEvent,  // Trigger custom event + wait for queueing
  onEvent,                 // Setup listener with auto-cleanup
} from '../helpers/bridge.helper';

// ✅ Initialize bridge
const bridge = await initTestBridge({ sessionTimeout: 5000 });

// ✅ Get managers
const { event, storage, consent } = getManagers(bridge);

// ✅ Get handlers
const { session, click, scroll } = getHandlers(bridge);

// ✅ Get queue state
const { length, events } = getQueueState(bridge);

// ✅ Cleanup
destroyTestBridge();
```

#### ❌ WRONG Usage Patterns

```typescript
// ❌ DON'T: Manual bridge access
const bridge = window.__traceLogBridge;
await bridge.init();

// ❌ DON'T: Direct manager access
const eventManager = bridge.getEventManager();
const queueLength = eventManager.getQueueLength();

// ❌ DON'T: Custom initialization logic
if (window.__traceLogBridge) {
  await window.__traceLogBridge.init();
  // Wait logic...
}

// Instead use: initTestBridge(), getManagers(), getQueueState()
```

#### Why Use bridge.helper.ts?

- ✅ **Type Safety**: All functions properly typed
- ✅ **Error Handling**: Handles edge cases (bridge not available, timeout, etc.)
- ✅ **Async Safety**: Properly waits for initialization
- ✅ **Consistency**: Standardized patterns across all tests
- ✅ **Maintainability**: Single source of truth for bridge operations
- ✅ **Prevents Bugs**: Avoids common mistakes (race conditions, missing cleanup, etc.)

---

### TestBridge Features

**Available in development mode only** (`NODE_ENV=development`)

**Core API (inherited from App)**:
```typescript
await bridge.init(config);           // Initialize with config
bridge.destroy();                     // Cleanup
bridge.event('name', metadata);       // Send custom event
bridge.on('event', callback);         // Subscribe to events
bridge.off('event', callback);        // Unsubscribe
```

**Manager Access** (for validation):
```typescript
const eventManager = bridge.getEventManager();
const storageManager = bridge.getStorageManager();
const consentManager = bridge.getConsentManager();
```

**Handler Access** (for validation):
```typescript
const sessionHandler = bridge.getSessionHandler();
const pageViewHandler = bridge.getPageViewHandler();
const clickHandler = bridge.getClickHandler();
const scrollHandler = bridge.getScrollHandler();
const performanceHandler = bridge.getPerformanceHandler();
const errorHandler = bridge.getErrorHandler();
const viewportHandler = bridge.getViewportHandler();
```

**State Inspection**:
```typescript
const sessionId = bridge.get('sessionId');
const config = bridge.get('config');
const fullState = bridge.getFullState();
const sessionData = bridge.getSessionData();
```

**Queue Inspection**:
```typescript
const queueLength = bridge.getQueueLength();
const queueEvents = bridge.getQueueEvents();
await bridge.flushQueue();
bridge.clearQueue(); // Use with caution
```

**Consent Management**:
```typescript
await bridge.setConsent('tracelog', true);
const hasConsent = bridge.hasConsent('tracelog');
const consentState = bridge.getConsentState();
const bufferLength = bridge.getConsentBufferLength();
const bufferEvents = bridge.getConsentBufferEvents('tracelog');
```

**Test Utilities**:
```typescript
await bridge.waitForInitialization(5000);
bridge.setQaMode(true);
```

### Using TestBridge in Tests

#### Complete Integration Test Example

**Full example showing setup, validation, and cleanup**:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  initTestBridge,
  destroyTestBridge,
  getManagers,
  getHandlers,
  collectEvents,
  waitForEvents
} from '../helpers/bridge.helper';
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
  setupBrowserAPIs
} from '../helpers/setup.helper';
import { createMockFetch } from '../helpers/mocks.helper';
import { expectEventStructure, expectSessionId } from '../helpers/assertions.helper';
import type { TraceLogTestBridge } from '../../src/types';

describe('Integration: Event Pipeline with Consent', () => {
  let bridge: TraceLogTestBridge;
  let mockFetch: ReturnType<typeof createMockFetch>;

  beforeEach(async () => {
    // 1. Setup test environment
    setupTestEnvironment();
    setupBrowserAPIs();

    // 2. Mock external dependencies
    mockFetch = createMockFetch({ ok: true, status: 200 });
    global.fetch = mockFetch;

    // 3. Initialize TestBridge
    bridge = await initTestBridge({
      waitForConsent: true,
      integrations: {
        custom: {
          collectApiUrl: 'https://api.test.com/collect'
        }
      }
    });
  });

  afterEach(() => {
    // 4. Complete cleanup
    destroyTestBridge();
    cleanupTestEnvironment();
  });

  it('should buffer events until consent granted, then flush', async () => {
    // Arrange: Get managers for inspection
    const { event: eventManager, consent: consentManager } = getManagers(bridge);
    expect(eventManager).toBeDefined();
    expect(consentManager).toBeDefined();

    // Arrange: Setup event collector
    const [getEvents, cleanupEvents] = collectEvents(bridge, 'event');

    // Act: Track events before consent
    bridge.event('view_product', { productId: '123' });
    bridge.event('add_to_cart', { productId: '123', quantity: 1 });

    // Assert: Events buffered, not sent
    expect(bridge.getConsentBufferLength()).toBe(2);
    expect(bridge.getQueueLength()).toBe(0);
    expect(mockFetch).not.toHaveBeenCalled();

    // Act: Grant consent
    await bridge.setConsent('custom', true);

    // Wait for consent buffer flush
    await new Promise(resolve => setTimeout(resolve, 500));

    // Assert: Events flushed to queue and sent
    expect(bridge.getConsentBufferLength()).toBe(0);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Assert: Verify sent payload structure
    const fetchCall = mockFetch.mock.calls[0];
    const [url, options] = fetchCall;
    expect(url).toBe('https://api.test.com/collect');
    expect(options.method).toBe('POST');

    const payload = JSON.parse(options.body as string);
    expect(payload.events).toHaveLength(2);
    expectSessionId(payload.session_id);

    // Assert: Verify events structure
    const events = getEvents();
    expect(events.length).toBeGreaterThanOrEqual(2);
    events.forEach(event => expectEventStructure(event));

    // Cleanup event collector
    cleanupEvents();
  });

  it('should track new events normally after consent granted', async () => {
    // Arrange: Grant consent first
    await bridge.setConsent('custom', true);

    // Act: Track event after consent
    bridge.event('purchase', { orderId: 'ORD-456', total: 99.99 });

    // Wait for queue flush (10s default)
    await new Promise(resolve => setTimeout(resolve, 10500));

    // Assert: Event sent directly (not buffered)
    expect(bridge.getConsentBufferLength()).toBe(0);
    expect(mockFetch).toHaveBeenCalled();

    const payload = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(payload.events).toHaveLength(1);
    expect(payload.events[0].custom_event.name).toBe('purchase');
  });
});
```

#### Simple Unit/Integration Test

**Minimal example for quick tests**:

```typescript
import { getTestBridge, initTestBridge, destroyTestBridge } from '../helpers/bridge.helper';

describe('EventManager', () => {
  let bridge: TraceLogTestBridge;

  beforeEach(async () => {
    bridge = await initTestBridge();
  });

  afterEach(() => {
    destroyTestBridge();
  });

  it('should track events', () => {
    bridge.event('test_event', { key: 'value' });
    const events = bridge.getQueueEvents();
    expect(events).toHaveLength(1);
    expect(events[0].custom_event?.name).toBe('test_event');
  });
});
```

**E2E Tests** (Playwright with CSP):
```typescript
test('should track clicks', async ({ page }) => {
  await page.goto('/');

  const result = await page.evaluate(async () => {
    // Wait for bridge (CSP-safe internal polling)
    let retries = 0;
    while (!window.__traceLogBridge && retries < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      retries++;
    }

    const bridge = window.__traceLogBridge!;
    await bridge.init();

    // Trigger action
    document.querySelector('#test-button')?.click();

    // Wait for event
    await new Promise(resolve => setTimeout(resolve, 100));

    // Return validation data
    return {
      queueLength: bridge.getQueueLength(),
      events: bridge.getQueueEvents()
    };
  });

  expect(result.queueLength).toBeGreaterThan(0);
  expect(result.events[0].type).toBe('CLICK');
});
```

### Bridge Helper Functions

The `tests/helpers/bridge.helper.ts` module provides utilities:

```typescript
import {
  getTestBridge,
  initTestBridge,
  destroyTestBridge,
  getManagers,
  getHandlers,
  getQueueState,
  collectEvents,
  waitForEvents,
  triggerAndWaitForEvent
} from '../helpers/bridge.helper';

// Initialize and wait
const bridge = await initTestBridge({ sessionTimeout: 5000 });

// Get managers
const { event, storage, consent } = getManagers(bridge);

// Get handlers
const { click, scroll, performance } = getHandlers(bridge);

// Collect events during test
const [getEvents, cleanup] = collectEvents(bridge, 'event');
// ... trigger events
const events = getEvents();
cleanup();

// Wait for specific events
const events = await waitForEvents(bridge, 'event', 3, 5000);

// Trigger and wait
await triggerAndWaitForEvent(bridge, 'test', { key: 'value' });
```

### When to Use TestBridge

| Test Type | Use TestBridge? | Why |
|-----------|----------------|-----|
| Unit (isolated managers/handlers) | ❌ No | Test components directly with mocks |
| Unit (App initialization flow) | ✅ Yes | Need full initialization sequence |
| Integration (multi-component) | ✅ Yes | Need real manager interactions |
| E2E (Playwright browser tests) | ✅ Yes | Only way to access library internals |

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

## Network Simulation with SpecialApiUrl

### Overview

TraceLog includes **built-in network simulation** for testing without real servers. The `SpecialApiUrl` enum provides special URLs that trigger simulated network behavior in `SenderManager`.

**Location**: `src/types/config.types.ts` (lines 118-121)

```typescript
export enum SpecialApiUrl {
  Localhost = 'localhost:8080',  // Simulates successful network requests
  Fail = 'localhost:9999',        // Simulates network failures
}
```

### How It Works

When `SenderManager` detects a `SpecialApiUrl` value, it **short-circuits** normal network logic:

**Implementation** (`src/managers/sender.manager.ts`):
```typescript
// Line 184 - In sendQueueSync() [sendBeacon flow]
if (this.apiUrl === SpecialApiUrl.Fail) {
  log('warn', `Fail mode: simulating network failure (sync)...`);
  return false; // Triggers retry/persistence logic
}

// Line 559 - In send() [fetch flow]
if (this.apiUrl === SpecialApiUrl.Fail) {
  log('warn', `Fail mode: simulating network failure...`);
  return false; // Triggers retry/persistence logic
}
```

**Key behaviors**:
- ✅ No actual HTTP request made (no real server needed)
- ✅ Works in both `send()` (async/fetch) and `sendQueueSync()` (sync/sendBeacon)
- ✅ Requires `allowHttp: true` in config to pass URL validation
- ✅ `localhost:8080` → Returns `true` (simulates success)
- ✅ `localhost:9999` → Returns `false` (simulates failure, triggers retry + persistence)

### When to Use

| Scenario | Use SpecialApiUrl | Why |
|----------|-------------------|-----|
| **Testing event transmission** | `SpecialApiUrl.Localhost` | Verify events reach SenderManager without real server |
| **Testing retry logic** | `SpecialApiUrl.Fail` | Trigger in-session retry attempts (up to 2 retries) |
| **Testing persistence** | `SpecialApiUrl.Fail` | Verify failed events persist to localStorage |
| **Testing recovery** | `SpecialApiUrl.Fail` | Verify next-page recovery loads persisted events |
| **Testing multi-integration** | Both URLs | Test parallel sends with mixed success/failure |
| **Unit tests (SenderManager)** | Both URLs | Isolate SenderManager logic without network dependency |

### Helper Functions

The `tests/helpers/mocks.helper.ts` module provides utilities for SpecialApiUrl:

```typescript
import {
  createConfigWithSuccessSimulation,
  createConfigWithFailureSimulation,
  getSpecialApiUrls
} from '../helpers/mocks.helper';

// 1. Success simulation (no real server)
const successConfig = createConfigWithSuccessSimulation();
await tracelog.init(successConfig);
// Events will "succeed" without HTTP requests

// 2. Failure simulation (triggers retry/persistence)
const failureConfig = createConfigWithFailureSimulation();
await tracelog.init(failureConfig);
// Events will fail → retry 2 times → persist to localStorage

// 3. Get enum values for assertions
const specialUrls = getSpecialApiUrls();
expect(config.integrations.custom.collectApiUrl).toBe(specialUrls.Localhost);
```

### Testing Patterns

#### Pattern 1: Test Successful Event Transmission

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { initTestBridge, destroyTestBridge } from '../helpers/bridge.helper';
import { createConfigWithSuccessSimulation } from '../helpers/mocks.helper';
import { setupTestEnvironment, cleanupTestEnvironment } from '../helpers/setup.helper';

describe('Event Transmission - Success', () => {
  let bridge: TraceLogTestBridge;

  beforeEach(async () => {
    setupTestEnvironment();

    const config = createConfigWithSuccessSimulation();
    bridge = await initTestBridge(config);
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();
  });

  it('should successfully send events without real server', async () => {
    vi.useFakeTimers();

    // Track event
    bridge.event('purchase', { orderId: 'ORD-123', total: 99.99 });

    // Verify queued
    expect(bridge.getQueueLength()).toBe(1);

    // Advance to trigger flush (10s interval)
    await vi.advanceTimersByTimeAsync(10000);
    await vi.runOnlyPendingTimersAsync();

    // Verify sent successfully (queue cleared)
    expect(bridge.getQueueLength()).toBe(0);

    vi.useRealTimers();
  });
});
```

#### Pattern 2: Test Network Failure and Retry

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { initTestBridge, destroyTestBridge } from '../helpers/bridge.helper';
import { createConfigWithFailureSimulation } from '../helpers/mocks.helper';
import { setupTestEnvironment, cleanupTestEnvironment } from '../helpers/setup.helper';

describe('Event Transmission - Failure', () => {
  let bridge: TraceLogTestBridge;

  beforeEach(async () => {
    setupTestEnvironment();

    const config = createConfigWithFailureSimulation();
    bridge = await initTestBridge(config);
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();
  });

  it('should retry failed events up to 2 times, then persist', async () => {
    vi.useFakeTimers();

    // Track event
    bridge.event('add_to_cart', { productId: 'PROD-456', quantity: 2 });

    // Verify queued
    expect(bridge.getQueueLength()).toBe(1);

    // Advance to trigger initial send attempt
    await vi.advanceTimersByTimeAsync(10000);
    await vi.runOnlyPendingTimersAsync();

    // First retry after 200-300ms
    await vi.advanceTimersByTimeAsync(300);
    await vi.runOnlyPendingTimersAsync();

    // Second retry after 400-500ms
    await vi.advanceTimersByTimeAsync(500);
    await vi.runOnlyPendingTimersAsync();

    // After exhausting retries, events persist to localStorage
    const persistedQueue = localStorage.getItem('tlog:queue:test-user-id:custom');
    expect(persistedQueue).toBeDefined();

    const parsed = JSON.parse(persistedQueue!);
    expect(parsed.events).toHaveLength(1);
    expect(parsed.events[0].custom_event.name).toBe('add_to_cart');

    vi.useRealTimers();
  });
});
```

#### Pattern 3: Test Event Recovery After Failure

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { initTestBridge, destroyTestBridge } from '../helpers/bridge.helper';
import { createConfigWithFailureSimulation } from '../helpers/mocks.helper';
import { setupTestEnvironment, cleanupTestEnvironment } from '../helpers/setup.helper';

describe('Event Recovery', () => {
  it('should recover persisted events on next init', async () => {
    setupTestEnvironment();
    vi.useFakeTimers();

    // Session 1: Track event with failure simulation
    const failConfig = createConfigWithFailureSimulation();
    let bridge = await initTestBridge(failConfig);

    bridge.event('checkout_started', { cartTotal: 199.99 });

    // Trigger send → fail → retry → persist
    await vi.advanceTimersByTimeAsync(10000);
    await vi.runOnlyPendingTimersAsync();
    await vi.advanceTimersByTimeAsync(800); // Both retries

    // Verify persisted
    const persisted = localStorage.getItem('tlog:queue:test-user-id:custom');
    expect(persisted).toBeDefined();

    // Cleanup session 1
    destroyTestBridge();
    cleanupTestEnvironment();

    // Session 2: Init with success simulation (recovery should work)
    setupTestEnvironment();
    const successConfig = createConfigWithSuccessSimulation();
    bridge = await initTestBridge(successConfig);

    // Wait for recovery to complete
    await vi.advanceTimersByTimeAsync(500);
    await vi.runOnlyPendingTimersAsync();

    // Verify recovered event sent successfully
    expect(bridge.getQueueLength()).toBe(0); // Queue cleared after successful send
    expect(localStorage.getItem('tlog:queue:test-user-id:custom')).toBeNull();

    destroyTestBridge();
    cleanupTestEnvironment();
    vi.useRealTimers();
  });
});
```

#### Pattern 4: Test Multi-Integration with Mixed Results

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { initTestBridge, destroyTestBridge } from '../helpers/bridge.helper';
import { getSpecialApiUrls } from '../helpers/mocks.helper';
import { setupTestEnvironment, cleanupTestEnvironment } from '../helpers/setup.helper';

describe('Multi-Integration - Mixed Success/Failure', () => {
  let bridge: TraceLogTestBridge;

  beforeEach(async () => {
    setupTestEnvironment();

    const specialUrls = getSpecialApiUrls();

    // Configure: SaaS succeeds, custom fails
    bridge = await initTestBridge({
      integrations: {
        tracelog: {
          projectId: 'test-project'
          // Uses real API (can mock fetch for success)
        },
        custom: {
          collectApiUrl: specialUrls.Fail, // Simulates failure
          allowHttp: true
        }
      }
    });
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();
  });

  it('should handle mixed integration results (optimistic removal)', async () => {
    vi.useFakeTimers();

    // Track event
    bridge.event('page_view', { path: '/products' });

    // Advance to trigger send
    await vi.advanceTimersByTimeAsync(10000);
    await vi.runOnlyPendingTimersAsync();

    // OPTIMISTIC REMOVAL: Queue cleared because SaaS succeeded
    // (even though custom failed)
    expect(bridge.getQueueLength()).toBe(0);

    // Only custom integration persisted failed events
    const customPersisted = localStorage.getItem('tlog:queue:test-user-id:custom');
    expect(customPersisted).toBeDefined();

    // SaaS did NOT persist (succeeded)
    const saasPersisted = localStorage.getItem('tlog:queue:test-user-id:saas');
    expect(saasPersisted).toBeNull();

    vi.useRealTimers();
  });
});
```

### Important Notes

1. **URL Validation**: Both SpecialApiUrl values require `allowHttp: true` in config
   ```typescript
   {
     integrations: {
       custom: {
         collectApiUrl: 'localhost:8080', // or 'localhost:9999'
         allowHttp: true // REQUIRED
       }
     }
   }
   ```

2. **No Real Network**: No actual HTTP requests made when using SpecialApiUrl values

3. **Retry Strategy**: `SpecialApiUrl.Fail` triggers full retry sequence:
   - Initial attempt (fails immediately)
   - Retry 1 after 200-300ms (fails)
   - Retry 2 after 400-500ms (fails)
   - Persist to localStorage after exhausting retries

4. **Works in Both Send Modes**:
   - `send()` - Async mode using `fetch()` API
   - `sendQueueSync()` - Sync mode using `navigator.sendBeacon()` (page unload)

5. **Multi-Integration**: Can mix SpecialApiUrl with real URLs for testing complex scenarios

### Complete Example: Testing Full Lifecycle

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { initTestBridge, destroyTestBridge } from '../helpers/bridge.helper';
import { createConfigWithFailureSimulation, createConfigWithSuccessSimulation } from '../helpers/mocks.helper';
import { setupTestEnvironment, cleanupTestEnvironment } from '../helpers/setup.helper';

describe('Complete Network Simulation Lifecycle', () => {
  it('should simulate failure → retry → persist → recover → succeed', async () => {
    vi.useFakeTimers();

    // ========== SESSION 1: Failure + Retry + Persist ==========
    setupTestEnvironment();
    const failConfig = createConfigWithFailureSimulation();
    let bridge = await initTestBridge(failConfig);

    // Track events
    bridge.event('view_product', { productId: 'PROD-1' });
    bridge.event('add_to_cart', { productId: 'PROD-1', quantity: 1 });

    // Verify queued
    expect(bridge.getQueueLength()).toBe(2);

    // Trigger send → fail → retry → persist
    await vi.advanceTimersByTimeAsync(10000);  // Initial send
    await vi.runOnlyPendingTimersAsync();
    await vi.advanceTimersByTimeAsync(300);    // Retry 1
    await vi.runOnlyPendingTimersAsync();
    await vi.advanceTimersByTimeAsync(500);    // Retry 2
    await vi.runOnlyPendingTimersAsync();

    // Verify persisted after retries exhausted
    const persisted = localStorage.getItem('tlog:queue:test-user-id:custom');
    expect(persisted).toBeDefined();
    const parsed = JSON.parse(persisted!);
    expect(parsed.events).toHaveLength(2);

    destroyTestBridge();
    cleanupTestEnvironment();

    // ========== SESSION 2: Recovery + Success ==========
    setupTestEnvironment();
    const successConfig = createConfigWithSuccessSimulation();
    bridge = await initTestBridge(successConfig);

    // Wait for recovery + send
    await vi.advanceTimersByTimeAsync(500);
    await vi.runOnlyPendingTimersAsync();

    // Verify recovered events sent successfully
    expect(bridge.getQueueLength()).toBe(0);
    expect(localStorage.getItem('tlog:queue:test-user-id:custom')).toBeNull();

    destroyTestBridge();
    cleanupTestEnvironment();
    vi.useRealTimers();
  });
});
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

### ❌ TestBridge Anti-Patterns

**Critical mistakes to avoid when using TestBridge**:

1. **NEVER access `window.__traceLogBridge` directly in tests**
   ```typescript
   // ❌ BAD - Direct access bypasses helpers
   const bridge = window.__traceLogBridge;
   await bridge.init();

   // ✅ GOOD - Use helpers
   import { initTestBridge, destroyTestBridge } from '../helpers/bridge.helper';
   const bridge = await initTestBridge();
   ```

2. **NEVER use TestBridge in production code**
   ```typescript
   // ❌ BAD - TestBridge is development-only
   if (window.__traceLogBridge) {
     window.__traceLogBridge.clearQueue();
   }

   // ✅ GOOD - Use public API
   import tracelog from '@tracelog/lib';
   // Production code uses public API only
   ```

3. **NEVER create multiple TestBridge instances**
   ```typescript
   // ❌ BAD - Multiple instances cause conflicts
   const bridge1 = new TestBridge();
   const bridge2 = new TestBridge();

   // ✅ GOOD - One instance via helper
   const bridge = await initTestBridge();
   // Use same instance throughout test
   destroyTestBridge(); // Cleanup
   ```

4. **NEVER forget to cleanup TestBridge**
   ```typescript
   // ❌ BAD - Memory leaks and state pollution
   it('test', async () => {
     const bridge = await initTestBridge();
     // ... test logic
     // Missing cleanup!
   });

   // ✅ GOOD - Always cleanup in afterEach
   afterEach(() => {
     destroyTestBridge();
   });
   ```

5. **NEVER modify TestBridge methods from tests**
   ```typescript
   // ❌ BAD - Breaks TestBridge contract
   const bridge = await initTestBridge();
   bridge.getQueueEvents = vi.fn(() => []);

   // ✅ GOOD - Mock dependencies, not TestBridge
   const mockFetch = vi.fn();
   global.fetch = mockFetch;
   ```

6. **NEVER use TestBridge for isolated unit tests**
   ```typescript
   // ❌ BAD - TestBridge is overkill for isolated tests
   it('should add two numbers', async () => {
     const bridge = await initTestBridge();
     const result = 2 + 2;
     expect(result).toBe(4);
   });

   // ✅ GOOD - Test directly for isolated logic
   it('should add two numbers', () => {
     const result = 2 + 2;
     expect(result).toBe(4);
   });
   ```

7. **NEVER skip state cleanup between tests**
   ```typescript
   // ❌ BAD - State leaks between tests
   describe('Tests', () => {
     let bridge: TraceLogTestBridge;

     beforeEach(async () => {
       bridge = await initTestBridge();
     });

     // Missing afterEach cleanup!
   });

   // ✅ GOOD - Complete cleanup
   describe('Tests', () => {
     let bridge: TraceLogTestBridge;

     beforeEach(async () => {
       setupTestEnvironment(); // Clear state
       bridge = await initTestBridge();
     });

     afterEach(() => {
       destroyTestBridge();
       cleanupTestEnvironment();
     });
   });
   ```

8. **NEVER modify production code for TestBridge**
   ```typescript
   // ❌ BAD - Production code should NOT check for TestBridge
   export class EventManager {
     track(event: EventData) {
       if (window.__traceLogBridge) {
         // Special test behavior - WRONG!
       }
     }
   }

   // ✅ GOOD - TestBridge extends App, no special code needed
   export class EventManager {
     track(event: EventData) {
       // Normal behavior works with TestBridge
     }
   }
   ```

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

#### Basic Integration Test

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initTestBridge, destroyTestBridge } from '../helpers/bridge.helper';
import { setupTestEnvironment, cleanupTestEnvironment } from '../helpers/setup.helper';
import type { TraceLogTestBridge } from '../../src/types';

describe('Integration: Feature Name', () => {
  let bridge: TraceLogTestBridge;

  beforeEach(async () => {
    setupTestEnvironment();
    bridge = await initTestBridge({ /* config */ });
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();
  });

  it('should complete flow from A to B', async () => {
    // Arrange
    const { event: eventManager } = getManagers(bridge);

    // Act
    bridge.event('test', { key: 'value' });

    // Assert
    expect(bridge.getQueueLength()).toBe(1);
  });
});
```

#### Integration Test with Network Simulation

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initTestBridge, destroyTestBridge } from '../helpers/bridge.helper';
import { createConfigWithSuccessSimulation } from '../helpers/mocks.helper';
import { setupTestEnvironment, cleanupTestEnvironment } from '../helpers/setup.helper';
import type { TraceLogTestBridge } from '../../src/types';

describe('Integration: Event Transmission', () => {
  let bridge: TraceLogTestBridge;

  beforeEach(async () => {
    setupTestEnvironment();

    // Use SpecialApiUrl for network simulation (no real server needed)
    const config = createConfigWithSuccessSimulation();
    bridge = await initTestBridge(config);
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();
  });

  it('should send events successfully without real server', async () => {
    vi.useFakeTimers();

    // Arrange: Track event
    bridge.event('purchase', { amount: 99.99 });
    expect(bridge.getQueueLength()).toBe(1);

    // Act: Trigger queue flush
    await vi.advanceTimersByTimeAsync(10000);
    await vi.runOnlyPendingTimersAsync();

    // Assert: Queue cleared (sent successfully)
    expect(bridge.getQueueLength()).toBe(0);

    vi.useRealTimers();
  });
});
```

#### Integration Test with Failure and Recovery

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initTestBridge, destroyTestBridge } from '../helpers/bridge.helper';
import { createConfigWithFailureSimulation, createConfigWithSuccessSimulation } from '../helpers/mocks.helper';
import { setupTestEnvironment, cleanupTestEnvironment } from '../helpers/setup.helper';
import type { TraceLogTestBridge } from '../../src/types';

describe('Integration: Event Recovery', () => {
  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();
    vi.useRealTimers();
  });

  it('should persist failed events and recover on next init', async () => {
    vi.useFakeTimers();

    // Session 1: Fail and persist
    setupTestEnvironment();
    const failConfig = createConfigWithFailureSimulation();
    let bridge = await initTestBridge(failConfig);

    bridge.event('checkout_started', { cartTotal: 199.99 });

    // Trigger send → fail → retry → persist
    await vi.advanceTimersByTimeAsync(10000);  // Initial send
    await vi.runOnlyPendingTimersAsync();
    await vi.advanceTimersByTimeAsync(800);    // Retries

    // Verify persisted
    const persisted = localStorage.getItem('tlog:queue:test-user-id:custom');
    expect(persisted).toBeDefined();

    destroyTestBridge();
    cleanupTestEnvironment();

    // Session 2: Recover and succeed
    setupTestEnvironment();
    const successConfig = createConfigWithSuccessSimulation();
    bridge = await initTestBridge(successConfig);

    await vi.advanceTimersByTimeAsync(500);
    await vi.runOnlyPendingTimersAsync();

    // Verify recovered and cleared
    expect(bridge.getQueueLength()).toBe(0);
    expect(localStorage.getItem('tlog:queue:test-user-id:custom')).toBeNull();
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
// From helpers/bridge.helper.ts (TestBridge utilities)
getTestBridge()              // Get bridge instance
initTestBridge()             // Initialize and wait
destroyTestBridge()          // Cleanup bridge
getManagers()                // Get all managers
getHandlers()                // Get all handlers
collectEvents()              // Collect events during test
waitForEvents()              // Wait for N events
triggerAndWaitForEvent()     // Trigger event and wait

// From helpers/setup.helper.ts
setupTestEnvironment()        // Complete test setup
cleanupTestEnvironment()      // Complete cleanup
advanceTimers()               // Safe timer advancement (NOT vi.runAllTimersAsync!)

// From helpers/mocks.helper.ts
createMockFetch()            // Mock fetch API
createMockStorage()          // Mock localStorage/sessionStorage
createMockBroadcastChannel() // Mock BroadcastChannel
createConfigWithSuccessSimulation() // SpecialApiUrl: Success simulation (localhost:8080)
createConfigWithFailureSimulation() // SpecialApiUrl: Failure simulation (localhost:9999)
getSpecialApiUrls()          // Get SpecialApiUrl enum values for assertions

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

**ALL tests must meet these criteria before marking a file as complete:**

### 1. Tests Must Pass (100% Pass Rate)
```bash
# Run specific test file
npm run test:unit -- <filename>
npm run test:integration -- <filename>
npm run test:e2e -- <filename>

# ALL tests must pass - no failures, no skipped tests
```

### 2. No Format/Lint Errors
```bash
# Auto-fix all format and lint issues (MUST RUN)
npm run fix

# This command runs:
# - prettier --write (format)
# - eslint --fix (lint)
```

**IMPORTANT**: Run `npm run fix` BEFORE marking tests as complete.

### 3. No Type Errors
```bash
# Check for TypeScript errors
npm run type-check

# This runs: npx tsc --noEmit
# Must show: "0 errors"
```

### 4. Final Verification Sequence

**Before marking ANY test file as complete, run:**

```bash
npm run fix          # Fix format/lint
npm run type-check   # Check types (0 errors)
npm test             # Run all tests (100% pass)
```

### Complete Acceptance Checklist

Before merging test changes:

- [ ] **100% pass rate** - All tests passing
- [ ] **No format/lint errors** - `npm run fix` executed successfully
- [ ] **No type errors** - `npm run type-check` shows 0 errors
- [ ] **No unused imports** - Cleaned by `npm run fix`
- [ ] **Coverage targets met** - Per priority (P0: 95%, P1: 90%, P2: 85%)
- [ ] **No flaky tests** - Tests pass consistently (3+ runs)
- [ ] **Fast execution** - Unit <100ms, Integration <1s, E2E <10s
- [ ] **Clean code** - No TODOs, no commented code, clear names
- [ ] **Helpers used** - Especially `bridge.helper.ts` for integration/E2E
- [ ] **Documentation updated** - If adding new patterns

---

**Last Updated**: October 2024
**Version**: 1.0.0
**Maintained By**: TraceLog Team
