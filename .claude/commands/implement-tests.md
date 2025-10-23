---
name: implement-tests
description: Implement test logic for test file skeletons following TESTING_FUNDAMENTALS.md patterns
---

Use the **test-implementer** agent to implement tests for the TraceLog library.

## What This Command Does

Launches the test-implementer agent to:
1. Read test file declarations (skeletons)
2. Implement test logic following TESTING_FUNDAMENTALS.md
3. Use test helpers extensively
4. Run tests incrementally (one at a time)
5. Verify all tests pass before completion

## Usage

```bash
# Implement specific test file
/implement-tests tests/unit/core/app.test.ts

# Implement multiple files (priority order)
/implement-tests P0

# Implement specific test type
/implement-tests unit
/implement-tests integration
/implement-tests e2e
```

## What to Expect

The agent will:

1. **Analyze test declarations** in the specified file(s)
2. **Create implementation plan** using TodoWrite
3. **Implement tests one by one**:
   - Read source code to understand behavior
   - Use appropriate helpers from `tests/helpers/`
   - Write test implementation
   - Run test to verify it passes
   - Mark todo as completed
4. **Run full test suite** for the file
5. **Provide summary** with statistics and next steps

## Test Files Available

### P0 - Critical (Implement First)
- `tests/unit/core/app.test.ts` (~14 tests)
- `tests/unit/core/state-manager.test.ts` (~13 tests)
- `tests/unit/core/api.test.ts` (~20 tests)
- `tests/unit/managers/event-manager.test.ts` (~40 tests)
- `tests/unit/managers/session-manager.test.ts` (~25 tests)
- `tests/unit/managers/sender-manager.test.ts` (~25 tests)
- `tests/integration/flows/initialization.test.ts` (~10 tests)
- `tests/integration/flows/event-pipeline.test.ts` (~15 tests)
- `tests/e2e/critical-paths/initialization.spec.ts` (~8 tests)

### P1 - Essential (Implement Second)
- All remaining unit tests (handlers, managers)
- All remaining integration tests (flows)
- All remaining E2E tests (critical paths)

## Examples

### Example 1: Implement Single File
```
/implement-tests tests/unit/core/app.test.ts
```

**Agent will**:
- Read app.test.ts declarations
- Implement ~14 tests
- Run each test after implementation
- Verify all pass
- Provide summary

### Example 2: Implement P0 Tests
```
/implement-tests P0
```

**Agent will**:
- Implement all 9 P0 test files
- ~120 tests total
- Report progress throughout
- Provide final summary

### Example 3: Implement Unit Tests
```
/implement-tests unit
```

**Agent will**:
- Implement all unit test files
- ~200+ tests total
- Group by priority (P0 first, then P1)

## Requirements

Before running:
- ✅ Test skeletons exist with declarations
- ✅ Source code is implemented
- ✅ TESTING_FUNDAMENTALS.md is up to date
- ✅ Test helpers are complete

## Quality Gates

All implemented tests must:
- ✅ Pass (100% pass rate)
- ✅ Use test helpers (not custom implementations)
- ✅ Follow TESTING_FUNDAMENTALS.md patterns
- ✅ Have proper setup/teardown
- ✅ Test behavior (not implementation)
- ✅ Have descriptive names

## After Implementation

Once tests are implemented:

1. **Run full test suite**:
   ```bash
   npm test
   ```

2. **Check coverage**:
   ```bash
   npm run test:coverage
   ```

3. **Verify quality**:
   ```bash
   npm run check
   npm run type-check
   ```

4. **Commit**:
   ```bash
   git add tests/
   git commit -m "test: implement P0 unit tests for core components"
   ```

## Tips

- Start with P0 tests (most critical)
- Implement one file at a time
- Run tests frequently to catch issues early
- Review TESTING_FUNDAMENTALS.md if unsure about patterns
- Use helpers extensively - don't reinvent the wheel

## Related Commands

- `/coverage` - Check test coverage
- `/precommit` - Run full validation before commit
- `/fix` - Auto-fix lint/format issues

## References

- `tests/TESTING_FUNDAMENTALS.md` - Complete testing guide
- `tests/README.md` - Quick reference
- `tests/helpers/` - Test helper modules
- `.claude/agents/test-implementer.md` - Agent documentation
