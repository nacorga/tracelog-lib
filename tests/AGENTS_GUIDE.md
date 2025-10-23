# Test Implementation Agents Guide

Quick reference guide for using test implementation agents in Claude Code and Cursor.

---

## 🎯 For Claude Code Users

### Quick Start

```bash
# Implement specific test file
/implement-tests tests/unit/core/app.test.ts

# Implement P0 critical tests (recommended start)
/implement-tests P0

# Implement by test type
/implement-tests unit
/implement-tests integration
/implement-tests e2e
```

### What the Agent Does

1. ✅ Reads test file declarations (the `it('should...')` statements)
2. ✅ Creates implementation plan with TodoWrite
3. ✅ Implements tests one by one using helpers
4. ✅ Runs each test after implementation to verify
5. ✅ Provides comprehensive summary

### Example Session

```
You: /implement-tests tests/unit/core/app.test.ts

Agent:
  📝 Analyzing test declarations in app.test.ts...

  Found 14 tests to implement:
    1. should initialize successfully with no config
    2. should initialize with custom config
    ...

  Creating implementation plan...

  [Implements each test]

  ✅ Tests Implemented: 14/14
  🧪 Test Results: 14/14 passing
  ⏱️ Execution time: 245ms
  📊 Coverage: app.ts 96.3%

  🎯 Next: tests/unit/core/state-manager.test.ts
```

### Agent Configuration

- **Agent**: `.claude/agents/test-implementer.md`
- **Command**: `.claude/commands/implement-tests.md`
- **Model**: claude-sonnet-4-5
- **Tools**: Read, Write, Edit, Bash, Grep, Glob, TodoWrite

---

## 🎯 For Cursor Users

### Auto-Activation

The test-implementer rule **automatically activates** when you open:
- Any file matching `tests/**/*.test.ts`
- Any file matching `tests/**/*.spec.ts`

### Manual Invocation

```
@test-implementer implement tests for this file
```

### What You Get

When the rule is active, you have access to:

✅ **Complete Helper Reference**
- All 6 helper modules with function signatures
- Usage examples for each helper
- Import statements ready to copy

✅ **Test Patterns**
- Unit test template
- Integration test template
- E2E test template
- Ready to copy and customize

✅ **Quality Standards**
- Critical DO's and DON'Ts
- Best practices checklist
- Common pitfalls to avoid

✅ **E2E Specifics**
- Playground vs fixtures guidance
- Available test IDs
- CSP-safe patterns
- Network simulation examples

### Configuration

- **Rule**: `.cursor/rules/test-implementer.mdc`
- **Activation**: Automatic for test files
- **Globs**: `tests/**/*.test.ts`, `tests/**/*.spec.ts`

---

## 📋 Test Implementation Priority

### P0 - Critical (Implement First)

**Unit Tests** (6 files, ~120 tests):
- `tests/unit/core/app.test.ts`
- `tests/unit/core/state-manager.test.ts`
- `tests/unit/core/api.test.ts`
- `tests/unit/managers/event-manager.test.ts`
- `tests/unit/managers/session-manager.test.ts`
- `tests/unit/managers/sender-manager.test.ts`

**Integration Tests** (2 files, ~25 tests):
- `tests/integration/flows/initialization.test.ts`
- `tests/integration/flows/event-pipeline.test.ts`

**E2E Tests** (1 file, ~8 tests):
- `tests/e2e/critical-paths/initialization.spec.ts`

### P1 - Essential (Implement Second)

**Unit Tests** (9 files, ~140 tests):
- All managers (storage, consent, user)
- All handlers (click, scroll, pageview, performance, error, session)

**Integration Tests** (4 files, ~30 tests):
- Consent flow
- Multi-tab sync
- Recovery
- Multi-integration

**E2E Tests** (5 files, ~40 tests):
- All remaining critical paths

### P2 - Advanced (Implement Third)

- Edge cases
- Advanced features
- Performance tests

---

## 🛠️ Available Helpers

All helpers are located in `tests/helpers/`:

### 1. Setup Helper (`setup.helper.ts`)
```typescript
import {
  setupTestEnvironment,      // ✅ ALWAYS use in beforeEach
  cleanupTestEnvironment,     // ✅ ALWAYS use in afterEach
  advanceTimers,              // Safe timer advancement
  setupBrowserAPIs            // Mock browser APIs
} from '../helpers/setup.helper';
```

### 2. Mocks Helper (`mocks.helper.ts`)
```typescript
import {
  createMockFetch,            // Mock fetch with options
  createMockStorage,          // Mock storage
  setupAllMocks               // Setup all at once
} from '../helpers/mocks.helper';
```

### 3. Fixtures Helper (`fixtures.helper.ts`)
```typescript
import {
  createMockConfig,           // Create test config
  createMockEvent,            // Create test event
  createMockQueue             // Create test queue
} from '../helpers/fixtures.helper';
```

### 4. Assertions Helper (`assertions.helper.ts`)
```typescript
import {
  expectEventStructure,       // Validate event
  expectQueueStructure,        // Validate queue
  expectSessionId             // Validate sessionId
} from '../helpers/assertions.helper';
```

### 5. Wait Helper (`wait.helper.ts`)
```typescript
import {
  waitForCondition,           // Wait for condition
  waitForEvent,               // Wait for event
  waitForQueueFlush           // Wait 10s + buffer
} from '../helpers/wait.helper';
```

### 6. State Helper (`state.helper.ts`)
```typescript
import {
  getGlobalState,             // Get full state
  isStateInitialized,         // Check initialized
  getSessionId                // Get sessionId
} from '../helpers/state.helper';
```

---

## ✅ Quality Standards

### Every Test Must Have

- [ ] Descriptive name starting with "should"
- [ ] `setupTestEnvironment()` in `beforeEach`
- [ ] `cleanupTestEnvironment()` in `afterEach`
- [ ] At least one assertion
- [ ] Edge cases covered
- [ ] Error paths tested

### Code Quality

- [ ] Use helpers extensively
- [ ] No hardcoded values (use fixtures)
- [ ] Clear arrange-act-assert structure
- [ ] Test behavior, not implementation

---

## ❌ Critical DON'Ts

**NEVER do these** (will cause test failures):

1. ❌ Use `vi.runAllTimersAsync()` - causes infinite loops
2. ❌ Share state between tests - breaks isolation
3. ❌ Test private methods - implementation detail
4. ❌ Use hardcoded timeouts - flaky tests
5. ❌ Use `page.waitForFunction()` - CSP-blocked in E2E
6. ❌ Skip setup/teardown - state leaks

---

## 🚀 Quick Examples

### Claude Code

```bash
# Start with P0 critical tests
/implement-tests P0

# Implement specific file
/implement-tests tests/unit/core/app.test.ts

# Implement all unit tests
/implement-tests unit
```

### Cursor

```
# Open test file (rule auto-activates)
code tests/unit/core/app.test.ts

# Or invoke manually
@test-implementer implement tests for app.test.ts
```

---

## 📚 Documentation Reference

| Document | Purpose |
|----------|---------|
| `tests/TESTING_FUNDAMENTALS.md` | Complete testing guide (1,500 lines) |
| `tests/README.md` | Quick reference |
| `tests/AGENTS_GUIDE.md` | This file |
| `.claude/agents/test-implementer.md` | Claude agent details |
| `.claude/commands/implement-tests.md` | Claude command details |
| `.cursor/rules/test-implementer.mdc` | Cursor rule details |

---

## 🎯 Commands Reference

```bash
# Run tests
npm run test:unit              # Unit tests
npm run test:integration       # Integration tests
npm run test:e2e              # E2E tests
npm test                      # All tests

# Coverage & quality
npm run test:coverage         # Coverage report
npm run type-check            # TypeScript validation
npm run check                 # Lint + format
npm run fix                   # Auto-fix issues
```

---

## ✨ Tips for Success

1. **Read TESTING_FUNDAMENTALS.md first** - It has everything
2. **Start with P0 tests** - Most critical functionality
3. **Use helpers extensively** - They're battle-tested
4. **Run tests frequently** - Catch issues early
5. **One test at a time** - Ensure each passes
6. **Review agent output** - Learn from implementations

---

## 💡 Getting Help

If you're stuck:

1. Check `tests/TESTING_FUNDAMENTALS.md` for patterns
2. Review existing test implementations
3. Look at helper function signatures
4. Check agent documentation
5. Run tests to see specific error messages

---

**Happy Testing!** 🧪

For questions or issues, refer to the comprehensive guides above or review existing test implementations.
