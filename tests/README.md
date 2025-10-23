# TraceLog Test Suite

> **Rebuilt Test Suite** - Clean, maintainable, and focused on critical paths

## 📁 Structure Overview

```
tests/
├── TESTING_FUNDAMENTALS.md     # 📖 Master testing guide (READ THIS FIRST)
├── helpers/                     # 🛠️ Shared test utilities
│   ├── bridge.helper.ts         # ⭐ TestBridge utilities (integration/E2E)
│   ├── setup.helper.ts          # Test setup & cleanup
│   ├── mocks.helper.ts          # Centralized mocks
│   ├── fixtures.helper.ts       # Test data fixtures
│   ├── assertions.helper.ts     # Custom assertions
│   ├── wait.helper.ts           # Async wait utilities
│   └── state.helper.ts          # State management helpers
│
├── unit/                        # ⚡ Unit tests (isolated components)
│   ├── core/                    # Critical core components
│   │   ├── app.test.ts
│   │   ├── state-manager.test.ts
│   │   └── api.test.ts
│   ├── managers/                # Manager components
│   │   ├── event-manager.test.ts
│   │   ├── session-manager.test.ts
│   │   ├── sender-manager.test.ts
│   │   ├── storage-manager.test.ts
│   │   ├── consent-manager.test.ts
│   │   └── user-manager.test.ts
│   └── handlers/                # Event handlers
│       ├── click-handler.test.ts
│       ├── scroll-handler.test.ts
│       ├── pageview-handler.test.ts
│       ├── performance-handler.test.ts
│       ├── error-handler.test.ts
│       └── session-handler.test.ts
│
├── integration/                 # 🔗 Integration tests (component interactions)
│   └── flows/                   # Critical flows
│       ├── initialization.test.ts
│       ├── event-pipeline.test.ts
│       ├── consent-flow.test.ts
│       ├── multi-tab-sync.test.ts
│       ├── recovery.test.ts
│       └── multi-integration.test.ts
│
└── e2e/                         # 🌐 E2E tests (real browser)
    ├── fixtures/                # Minimal HTML fixtures
    │   ├── minimal.html         # Bare minimum page
    │   ├── spa.html            # SPA navigation test
    │   └── forms.html          # Forms & PII testing
    └── critical-paths/          # Critical user scenarios
        ├── initialization.spec.ts
        ├── page-view-tracking.spec.ts
        ├── custom-events.spec.ts
        ├── click-tracking.spec.ts
        ├── scroll-tracking.spec.ts
        └── error-capture.spec.ts
```

## 🎯 Test Coverage Strategy

### Coverage Targets

| Test Type | Coverage Target |
|-----------|-----------------|
| **Unit Tests** | 90%+ for critical logic |
| **Integration Tests** | 85%+ for flows |
| **E2E Tests** | Critical user paths |

### What's Covered

#### ✅ Unit Tests
- **Core**: App, StateManager, Public API
- **Managers**: Event, Session, Sender, Storage, Consent, User
- **Handlers**: Click, Scroll, PageView, Performance, Error, Session

#### ✅ Integration Tests
- **Flows**: Initialization, Event pipeline, Consent, Multi-tab sync, Recovery, Multi-integration

#### ✅ E2E Tests
- **Critical Paths**: All essential user scenarios
- **Fixtures**: HTML files for specific edge cases
- **Main Playground**: `/docs/index.html` (shared by most tests)

## 🚀 Quick Start

### Run All Tests

```bash
# All tests (unit + integration + e2e)
npm test

# Specific test types
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
npm run test:e2e           # E2E tests only
```

### Run Single Test File

```bash
# Unit test
npm run test:unit -- app.test.ts

# Integration test
npm run test:integration -- initialization.test.ts

# E2E test
npx playwright test initialization.spec.ts
```

### Coverage

```bash
npm run test:coverage
open coverage/index.html
```

## 📖 Documentation

| Document | Purpose | Audience |
|----------|---------|----------|
| **TESTING_FUNDAMENTALS.md** | Complete testing guide + TestBridge architecture | All developers |
| **tests/helpers/** | Helper function docs (including bridge.helper.ts) | Test writers |
| **Test files themselves** | Inline test declarations | Test implementers |

## 🚨 Key Principle: TestBridge Architecture

**Library code should NOT adapt to tests. TestBridge adapts tests to library.**

- ✅ Use `TestBridge` (`src/test-bridge.ts`) to access library internals
- ✅ Use `tests/helpers/bridge.helper.ts` utilities for integration/E2E tests
- ❌ Never modify production code for test purposes (except TestBridge itself)

## 🎓 Testing Principles

### DO ✅
1. **Read TESTING_FUNDAMENTALS.md first** - It has everything you need
2. **Use helpers** - Don't reinvent the wheel
3. **One assertion per test** - Keep tests simple
4. **Clean state between tests** - Use `setupTestEnvironment()`
5. **Test behavior, not implementation** - Focus on what, not how

### DON'T ❌
1. **Never use `vi.runAllTimersAsync()`** - Causes infinite loops
2. **Never share state between tests** - Each test must be independent
3. **Never test private methods** - Test public API only
4. **Never use `page.waitForFunction()`** - CSP-blocked in E2E
5. **Never hardcode timeouts** - Use helpers or fake timers

## 🔧 Helper Functions Quick Reference

### 🎯 CRITICAL: Always Use `bridge.helper.ts` for Integration/E2E Tests

**DO NOT write custom bridge initialization code. ALWAYS use these helpers:**

```typescript
// ⭐ TestBridge Helpers (MUST USE for integration/E2E)
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
} from './helpers/bridge.helper';

// ✅ CORRECT pattern
const bridge = await initTestBridge({ sessionTimeout: 5000 });
const { event, storage } = getManagers(bridge);
const { length, events } = getQueueState(bridge);
destroyTestBridge();

// ❌ WRONG pattern (don't do this!)
const bridge = window.__traceLogBridge;  // Use initTestBridge()
await bridge.init();                      // Use initTestBridge()
const queueLength = bridge.getQueueLength(); // Use getQueueState()
```

### Other Helpers

```typescript
// Setup & Cleanup
import { setupTestEnvironment, cleanupTestEnvironment } from './helpers/setup.helper';
import { advanceTimers } from './helpers/setup.helper';

// Mocks
import { createMockFetch, createMockStorage } from './helpers/mocks.helper';
import { setupAllMocks } from './helpers/mocks.helper';

// Fixtures
import { createMockConfig, createMockEvent, createMockQueue } from './helpers/fixtures.helper';

// Wait Utilities
import { waitForCondition, waitForEvent, waitForQueueFlush } from './helpers/wait.helper';

// Assertions
import { expectEventStructure, expectQueueStructure } from './helpers/assertions.helper';

// State Management
import { getGlobalState, isStateInitialized } from './helpers/state.helper';
```

## 📊 Test Metrics Targets

- **Coverage**: 90%+ on critical paths
- **Execution time**: <30s total (unit + integration + e2e)
- **Flakiness**: 0% (with proper patterns)
- **Pass rate**: 100%

## ✅ Acceptance Criteria

**ALL tests must meet these criteria before marking a file as complete:**

### 1. Tests Must Pass (100% Pass Rate)
```bash
npm run test:unit -- <filename>         # Unit tests
npm run test:integration -- <filename>  # Integration tests
npm run test:e2e -- <filename>          # E2E tests
```

### 2. No Format/Lint Errors (MUST RUN)
```bash
npm run fix  # Auto-fix all format and lint issues
```

**IMPORTANT**: Run `npm run fix` BEFORE marking tests as complete.

### 3. No Type Errors
```bash
npm run type-check  # Must show: "0 errors"
```

### 4. Final Verification Sequence

**Before marking ANY test file as complete, run this sequence:**

```bash
npm run fix          # Fix format/lint
npm run type-check   # Check types (0 errors)
npm test             # Run all tests (100% pass)
```

### Acceptance Checklist

For each test file, verify:
- [ ] All tests pass (100% pass rate)
- [ ] `npm run fix` executed successfully
- [ ] `npm run type-check` shows 0 errors
- [ ] No unused imports or variables
- [ ] No ESLint warnings
- [ ] Tests follow TESTING_FUNDAMENTALS.md patterns
- [ ] Helpers used correctly (especially `bridge.helper.ts`)
- [ ] Coverage targets met (90%+ for critical logic)

**DO NOT mark a test file as complete until ALL criteria are met.**

---

## 🤝 Contributing

When adding new tests:

1. **Check TESTING_FUNDAMENTALS.md** for patterns
2. **Use existing helpers** - Don't duplicate code
3. **Follow naming conventions** - See existing tests
4. **Write descriptive test names** - `should do X when Y`
5. **Add documentation** - If introducing new patterns

## 📞 Support

- **Guide**: Read `TESTING_FUNDAMENTALS.md`
- **Helpers**: Check `tests/helpers/*.ts`
- **Examples**: Look at existing test skeletons
- **Issues**: Open GitHub issue with `test` label
