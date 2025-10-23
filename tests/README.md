# TraceLog Test Suite

> **Rebuilt Test Suite** - Clean, maintainable, and focused on critical paths

## 📁 Structure Overview

```
tests/
├── TESTING_FUNDAMENTALS.md     # 📖 Master testing guide (READ THIS FIRST)
├── helpers/                     # 🛠️ Shared test utilities
│   ├── setup.helper.ts          # Test setup & cleanup
│   ├── mocks.helper.ts          # Centralized mocks
│   ├── fixtures.helper.ts       # Test data fixtures
│   ├── assertions.helper.ts     # Custom assertions
│   ├── wait.helper.ts           # Async wait utilities
│   └── state.helper.ts          # State management helpers
│
├── unit/                        # ⚡ Unit tests (isolated components)
│   ├── core/                    # P0 - Critical core (3 files)
│   │   ├── app.test.ts
│   │   ├── state-manager.test.ts
│   │   └── api.test.ts
│   ├── managers/                # P0 - Manager components (6 files)
│   │   ├── event-manager.test.ts
│   │   ├── session-manager.test.ts
│   │   ├── sender-manager.test.ts
│   │   ├── storage-manager.test.ts
│   │   ├── consent-manager.test.ts
│   │   └── user-manager.test.ts
│   └── handlers/                # P1 - Event handlers (6 files)
│       ├── click-handler.test.ts
│       ├── scroll-handler.test.ts
│       ├── pageview-handler.test.ts
│       ├── performance-handler.test.ts
│       ├── error-handler.test.ts
│       └── session-handler.test.ts
│
├── integration/                 # 🔗 Integration tests (component interactions)
│   └── flows/                   # Critical flows (6 files)
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
    └── critical-paths/          # Critical scenarios (6 files)
        ├── initialization.spec.ts
        ├── page-view-tracking.spec.ts
        ├── custom-events.spec.ts
        ├── click-tracking.spec.ts
        ├── scroll-tracking.spec.ts
        └── error-capture.spec.ts
```

## 🎯 Test Coverage Strategy

### Priority Levels

| Priority | Focus | Coverage Target | Files | Status |
|----------|-------|----------------|-------|--------|
| **P0** (Critical) | Core functionality | 95%+ | 9 files | 🔴 Not implemented |
| **P1** (Essential) | Features & flows | 90%+ | 18 files | 🔴 Not implemented |
| **P2** (Advanced) | Edge cases | 85%+ | TBD | ⚪ Future |

### What's Covered

#### ✅ Unit Tests (15 files)
- **Core** (P0): App, StateManager, Public API
- **Managers** (P0): Event, Session, Sender, Storage, Consent, User
- **Handlers** (P1): Click, Scroll, PageView, Performance, Error, Session

#### ✅ Integration Tests (6 files)
- **P0 Flows**: Initialization, Event pipeline
- **P1 Flows**: Consent, Multi-tab sync, Recovery, Multi-integration

#### ✅ E2E Tests (6 files)
- **P0 Critical Paths**: All essential user scenarios
- **Fixtures**: 3 HTML files for specific edge cases
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
| **TESTING_FUNDAMENTALS.md** | Complete testing guide | All developers |
| **tests/helpers/** | Helper function docs | Test writers |
| **Test files themselves** | Inline test declarations | Test implementers |

## 🏗️ Implementation Status

### ✅ Completed
- [x] Deleted all old tests (121 files → 0)
- [x] Created new directory structure
- [x] Wrote comprehensive TESTING_FUNDAMENTALS.md guide
- [x] Created 6 helper modules with utilities
- [x] Created 27 test file skeletons with declarations
- [x] Created 3 E2E HTML fixtures
- [x] Updated Playwright config

### 🔴 Pending Implementation
- [ ] Implement unit test logic (15 files, ~200 tests)
- [ ] Implement integration test logic (6 files, ~60 tests)
- [ ] Implement E2E test logic (6 files, ~50 tests)

**Total**: ~310 focused tests (vs 121+ scattered tests before)

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

## 📊 Test Metrics

### Current State
- **Total test files**: 27
- **Helper modules**: 6
- **E2E fixtures**: 3
- **Lines of documentation**: ~1,500
- **Implementation status**: 0% (all skeletons ready for implementation)

### Target Metrics (After Implementation)
- **Test count**: ~310 focused tests
- **Coverage**: 90%+ on critical paths
- **Execution time**: <30s total (unit + integration + e2e)
- **Flakiness**: 0% (with proper patterns)
- **Pass rate**: 100%

## 🎯 Next Steps

### Phase 1: Implement P0 Tests (Week 1)
1. **Unit Tests - Core** (3 files)
   - `app.test.ts` - App initialization
   - `state-manager.test.ts` - Global state
   - `api.test.ts` - Public API

2. **Unit Tests - Critical Managers** (3 files)
   - `event-manager.test.ts` - Event tracking & queuing
   - `session-manager.test.ts` - Session lifecycle
   - `sender-manager.test.ts` - Event transmission

3. **Integration Tests** (2 files)
   - `initialization.test.ts` - Full init flow
   - `event-pipeline.test.ts` - Capture → Queue → Send

4. **E2E Tests** (3 files)
   - `initialization.spec.ts` - Basic init
   - `page-view-tracking.spec.ts` - Navigation
   - `custom-events.spec.ts` - Custom event API

**Target**: 95%+ coverage on P0, 100% pass rate

### Phase 2: Implement P1 Tests (Week 2)
- Implement remaining handlers
- Implement remaining integration flows
- Implement remaining E2E scenarios

### Phase 3: Optimize & Polish (Week 3)
- Add P2 advanced tests
- Optimize execution time
- Improve error messages
- Add more fixtures if needed

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

---

**Status**: 🏗️ Structure complete, implementation pending
**Last Updated**: October 2024
**Version**: 2.0.0
