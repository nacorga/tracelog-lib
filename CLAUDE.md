# TraceLog Library

**JavaScript library for web analytics and real-time event tracking**

## 🎯 Purpose

Client-only event tracking library that automatically captures user interactions (clicks, scrolls, navigation, web performance) and supports custom events. Operates autonomously without backend dependencies. Features cross-tab session management, session recovery, optional integrations (TraceLog SaaS, custom API, Google Analytics), and client-side event sampling.

## 🏗️ Architecture

```
src/
├── api.ts                 # Public API (init, event, destroy)
├── app.ts                 # Main orchestrator class managing handlers and state
├── handlers/              # Event capture handlers
│   ├── click.handler.ts   # Click tracking
│   ├── scroll.handler.ts  # Scroll tracking
│   ├── session.handler.ts # Session management
│   └── performance.handler.ts # Web vitals capture
├── managers/              # Core business logic and state management
│   ├── event.manager.ts   # Event queue and dispatching
│   ├── session.manager.ts # Session lifecycle management
│   ├── storage.manager.ts # localStorage abstraction
│   └── state.manager.ts   # Global shared state management
├── integrations/          # Third-party integrations
├── utils/                 # Utility functions and validation helpers
└── types/                 # TypeScript type definitions
```

**Main flow**: `init()` → Validate config → Activate handlers → EventManager queues → Process locally OR send to optional backend

## 🛠️ Tech Stack

- **TypeScript 5.7** - Strong typing and latest features
- **Vite** - Fast build tool and bundler
- **web-vitals 4.2** - Only runtime dependency for performance metrics
- **Playwright** - End-to-end testing framework
- **ESLint + Prettier** - Code linting and formatting


## 📝 Code Conventions

### Lint \& Format

```bash
npm run check      # Lint and format verification
npm run fix        # Auto-fix linting and formatting issues
```


### Naming

- Classes: `PascalCase` (e.g., `EventManager`)
- Files: `kebab-case.type.ts` (e.g., `session.manager.ts`)
- Public methods: `camelCase`
- Private methods: `camelCase` prefixed with `private`
- Constants: `UPPER_SNAKE_CASE`


### Patterns

- Managers extend `StateManager` for global state access
- Handlers are classes capturing specific DOM events
- Types declared in separate `.types.ts` files
- Utils contain pure functions grouped by domain


## 🚀 Common Commands

```bash
# Build commands
npm run build           # TypeScript build (both ESM and CJS)
npm run build:browser   # Browser-specific build using Vite
npm run build:all       # Complete build (ESM + CJS)
npm run build-ugly      # Minified build using UglifyJS

# Development
npm run serve:test      # Start local test server (default port 3000)
npm run test:e2e        # Run Playwright end-to-end tests

# Quality assurance
npm run lint            # Run ESLint
npm run format          # Run Prettier formatting
npm run check           # Run lint and format verification
npm run fix             # Auto-fix lint and format issues
```


## 🔍 Critical Paths

### 1. Initialization

`api.init()` → `App.init()` → `setState()` → `initHandlers()` → event listeners active

### 2. Event Tracking

DOM event occurs → Handler captures → `EventManager.track()` queues event → `SenderManager` sends events

### 3. Session Management

User activity tracked → `SessionManager` syncs across tabs → recovers session on failure

### 4. Data Processing

Events batched → Client-side validation and sampling applied → **If `apiUrl` exists in state**: sent to backend via `sendEventsQueue()` → Retries on failure → **If no `apiUrl`**: events emitted locally only

**Note**: `apiUrl` is set when `integrations.tracelog.projectId` or `integrations.custom.apiUrl` is configured

## ⚠️ WHAT NOT TO DO

### 🚫 Dependencies \& Build

- DON’T add dependencies unless absolutely necessary; only `web-vitals` is allowed
- DON’T break ESM/CJS dual compatibility; keep `exports` consistent in `package.json`
- DON’T change `dist/` folder structure
- DON’T commit without passing `npm run check`


### 🚫 Security

- DON’T store sensitive information in `localStorage`
- DON’T send Personally Identifiable Information (PII) without proper sanitization (`sanitize.utils.ts`)
- DON’T execute dynamic or unvalidated code
- DON’T expose internal-only APIs in the browser build


### 🚫 Performance

- DON’T cause memory leaks; always call `cleanup()` in handlers
- DON’T block the main thread; use passive event listeners
- DON’T send high-frequency events without throttling
- DON’T allow the event queue to grow infinitely (use `MAX_EVENTS_QUEUE_LENGTH` limit)


### 🚫 State \& Sessions

- DON’T mutate `globalState` directly; always use `StateManager.set()`
- DON’T instantiate multiple `App` instances concurrently
- DON’T call `init()` unless `typeof window !== 'undefined'`
- DON’T ignore session recovery failures to prevent data loss


## 🎯 Common Tasks

### Development

```bash
# Local development setup
npm run serve:test      # Terminal 1: start test server
npm run test:e2e        # Terminal 2: run e2e tests

# Pre-commit checks
npm run check           # Lint and format validation
npm run build:all       # Ensure build success
```


### Debug

```typescript
// Standalone mode (no backend)
await tracelog.init({});

// With TraceLog SaaS
await tracelog.init({
  integrations: {
    tracelog: { projectId: 'your-project-id' }
  }
});

// Enable QA mode: add ?tlog_mode=qa to URL
```


### Adding New Features

```typescript
// Steps to add new functionality

// 1. Create a new handler class under handlers/
// 2. Register the handler in App.initHandlers()
// 3. Add new types to the types/ directory
// 4. Add validation helpers if needed in utils/validations/
// 5. Write end-to-end tests under tests/
```

## Testing Guide

### Technology Stack
- **Unit/Integration**: **Vitest** + **TypeScript** with strict type safety
- **E2E**: **Playwright** + **TypeScript** with strict type safety
- **Testing Bridge**: `__traceLogBridge` for consistent access

### 🔧 Main Commands

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

### ❗ Test Failure Triage

If tests fail to run or fail unexpectedly, determine whether the failure stems from the test configuration/setup or from a defect in the TraceLog library.

- If it is a test configuration/setup issue, fix the test environment or mocks first.
- If it is a library defect, the issue must be corrected in the library before continuing with the tests.

### 🧪 Testing Patterns

#### Unit Tests

##### Basic Pattern
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventManager } from '@/managers/event.manager';

describe('EventManager', () => {
  let eventManager: EventManager;

  beforeEach(() => {
    eventManager = new EventManager();
  });

  it('should track events correctly', () => {
    const event = { type: 'CLICK', data: { x: 100, y: 200 } };
    eventManager.track(event);
    expect(eventManager.getQueue()).toHaveLength(1);
  });
});
```

##### Mock Pattern
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SessionManager } from '@/managers/session.manager';
import { StorageManager } from '@/managers/storage.manager';
import { EventManager } from '@/managers/event.manager';

describe('SessionManager', () => {
  let sessionManager: SessionManager;
  let storageManager: StorageManager;
  let eventManager: EventManager;

  beforeEach(() => {
    vi.clearAllMocks();
    storageManager = new StorageManager();
    eventManager = new EventManager();
    sessionManager = new SessionManager(storageManager, eventManager);
  });

  it('should manage sessions correctly', async () => {
    await sessionManager.startTracking();
    expect(sessionManager.getCurrentSessionId()).toBeDefined();
  });
});
```

#### Integration Tests

##### API Integration Pattern
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { App } from '@/app';

describe('App Integration', () => {
  let app: App;

  beforeEach(() => {
    vi.clearAllMocks();
    app = new App();
  });

  it('should initialize successfully', async () => {
    const config = {}; // Standalone mode
    await app.init(config);
    expect(app.initialized).toBe(true);
  });
});
```

##### Cross-Component Integration
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { App } from '@/app';
import { EventManager } from '@/managers/event.manager';

describe('Component Integration', () => {
  let app: App;

  beforeEach(() => {
    vi.clearAllMocks();
    app = new App();
  });

  it('should coordinate between managers', async () => {
    const eventSpy = vi.spyOn(EventManager.prototype, 'track');
    await app.init({});

    // Simulate user interaction
    const clickEvent = new MouseEvent('click', { clientX: 100, clientY: 200 });
    document.dispatchEvent(clickEvent);

    expect(eventSpy).toHaveBeenCalled();
  });
});
```

#### E2E Tests

##### Basic Pattern
```typescript
import { test, expect } from '@playwright/test';

test('basic event tracking', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Initialize TraceLog via test bridge (standalone mode)
  await page.evaluate(() => {
    return window.__traceLogBridge?.initialize({});
  });

  // Simulate user interaction
  await page.click('[data-testid="button"]');

  // Verify events tracked
  const events = await page.evaluate(() => {
    return window.__traceLogBridge?.getEvents();
  });

  expect(events).toBeDefined();
  expect(events?.length).toBeGreaterThan(0);
});
```

##### Session Flow Pattern
```typescript
import { test, expect } from '@playwright/test';

test('session management flow', async ({ page }) => {
  await page.goto('http://localhost:3000');

  await page.evaluate(() => {
    return window.__traceLogBridge?.initialize({});
  });

  const sessionId = await page.evaluate(() => {
    return window.__traceLogBridge?.getSessionId();
  });

  expect(sessionId).toBeDefined();
  expect(typeof sessionId).toBe('string');
});
```

### 🔑 Essential APIs

#### Unit/Integration Test Utilities
```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Setup and teardown
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Common assertions
expect(result).toBeDefined();
expect(array).toHaveLength(3);
expect(object).toMatchObject({ key: 'value' });
expect(fn).toHaveBeenCalledWith(expectedArg);
```

#### E2E Test Bridge APIs
```typescript
// Access TraceLog via test bridge
window.__traceLogBridge?.initialize(config);
window.__traceLogBridge?.getEvents();
window.__traceLogBridge?.getSessionId();
window.__traceLogBridge?.sendCustomEvent(name, data);
window.__traceLogBridge?.destroy();

// Test configuration
const testConfig = {
  sessionTimeout: 900000,
  globalMetadata: { environment: 'test' },
  samplingRate: 1.0
};
```

### ⚡ Best Practices

#### ✅ Common Practices
- Use TypeScript strict mode across all test types
- Implement proper setup/teardown in `beforeEach`/`afterEach`
- Use descriptive test names that explain behavior
- Group related tests using `describe` blocks
- Mock external dependencies consistently

#### ✅ Unit Tests
- Test single units in isolation
- Mock all external dependencies
- Use data builders for complex test objects
- Test edge cases and error conditions
- Keep tests fast (< 100ms per test)

#### ✅ Integration Tests
- Test component interactions
- Use real implementations where practical
- Mock external services (APIs, localStorage)
- Verify data flow between components
- Test configuration variations

#### ✅ E2E Tests
- Use Playwright's `test` and `expect` from `@playwright/test`
- Access TraceLog via `window.__traceLogBridge` test bridge
- Use `page.evaluate()` to interact with browser context
- Wait for specific conditions, not arbitrary timeouts
- Clean up state between tests

#### ❌ Avoid
- Hardcoded timeouts: `await page.waitForTimeout(2000)`
- Inline magic values: use constants for config
- Testing implementation details instead of behavior
- Flaky tests that pass/fail inconsistently
- Shared mutable state between tests

### 🔍 Debug

#### Unit/Integration Tests
```bash
npm run test:unit -- --verbose     # Detailed output
npm run test:unit -- --watch       # Watch mode
npm run test -- --testNamePattern="SessionManager"  # Specific tests
```

#### E2E Tests
```bash
npm run test:e2e -- --headed    # Visual mode
npm run test:e2e -- --debug     # DevTools
npm run test:e2e -- --trace on  # Generate traces
```

#### Coverage Reports
```bash
npm run test:coverage           # Complete coverage report
open coverage/lcov-report/index.html  # View coverage in browser
```

### ⭐ Acceptance Criteria

#### All Test Types
- 100% pass rating
- NO type errors (use `npm run type-check` script to verify)
- NO lint errors (use `npm run lint` script to verify)

#### Coverage Requirements
- **Unit Tests**: 90%+ line coverage for core logic
- **Integration Tests**: Critical paths covered
- **E2E Tests**: User journeys and error scenarios

### 🛡️ Library Error Detection

#### Automated Monitoring

Tests automatically detect issues in TraceLog library:

```bash
npm run test:unit                 # Logic and state validation
npm run test:integration          # Component interaction validation
npm run test:e2e                 # Runtime error detection
```

#### Error Categories

##### Logic Errors (Unit)
```typescript
// State management validation
expect(sessionManager.getState()).toBeValidState();
expect(eventManager.validateEvent(event)).toBe(true);
```

##### Integration Errors
```typescript
// Component communication validation
expect(eventManager.queue).toHaveLength(2);
expect(sessionManager.isActive()).toBe(true);
```

##### Runtime Errors (E2E)
```typescript
// Automatic console monitoring
await expect(traceLogPage).toHaveNoTraceLogErrors();
await expect(consoleMonitor).not.toHaveMessage(/\[TraceLog:ERROR\]/);
```

##### Memory Leaks (E2E)
```typescript
// Performance monitoring
await expect(performanceMonitor).toHaveNoMemoryLeaks();
await expect(performanceMonitor).toHaveNoExcessiveEventQueuing();
```

##### Security Issues (All Types)
```typescript
// Data sanitization validation
expect(sanitizeMetadata(userInput)).not.toContainScript();
await expect(events).toHaveSanitizedData();
await expect(events).not.toContainScript();
```

#### Reports Generated

- `coverage/` - Code coverage reports (unit/integration)
- `test-results/failed-tests.json` - Test failures with library issues (E2E)
- `playwright-report/` - Detailed execution reports with screenshots (E2E)