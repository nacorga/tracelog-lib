---
name: implement-tests
description: Implement test logic for test file skeletons following TESTING_FUNDAMENTALS.md patterns
---

Use the **test-implementer** agent to implement tests for the TraceLog library.

## What This Command Does

Launches the test-implementer agent to:
1. Check if test file exists with declarations
2. **If no skeleton exists**: Analyze source code and generate test skeleton
3. Read test file declarations (skeletons)
4. Implement test logic following TESTING_FUNDAMENTALS.md
5. Use test helpers extensively
6. Run tests incrementally (one at a time)
7. Verify all tests pass before completion

## Usage

```bash
# Implement specific test file
/implement-tests tests/unit/core/app.test.ts

# Implement specific test type
/implement-tests unit
/implement-tests integration
/implement-tests e2e
```

## What to Expect

The agent will:

1. **Check test file status**:
   - If skeleton exists → Read test declarations
   - If no skeleton → Analyze source code and generate skeleton
2. **Create implementation plan** using TodoWrite
3. **Implement tests one by one**:
   - Read source code to understand behavior
   - Use appropriate helpers from `tests/helpers/`
   - Write test implementation
   - Run test to verify it passes
   - Mark todo as completed
4. **Run full test suite** for the file
5. **Provide summary** with statistics and next steps

### Skeleton Generation (When File Missing/Empty)

If the test file doesn't exist or has no test declarations:

1. **Analyze Source Code**: Read the file being tested to understand public API
2. **Generate Structure**: Create test file with proper imports, describe blocks, and test declarations
3. **Confirm**: Show skeleton to user for approval before implementation
4. **Implement**: Proceed with normal test implementation workflow

## Test Files Organization

Tests are organized by type:

- **Unit tests**: `tests/unit/` - Individual component testing
- **Integration tests**: `tests/integration/` - Component interaction testing
- **E2E tests**: `tests/e2e/` - Full browser testing with Playwright

## Examples

### Example 1: Implement Single File
```
/implement-tests tests/unit/core/app.test.ts
```

**Agent will**:
- Read app.test.ts declarations
- Implement all tests in the file
- Run each test after implementation
- Verify all pass
- Provide summary

### Example 2: Implement Unit Tests
```
/implement-tests unit
```

**Agent will**:
- Implement all unit test files
- Report progress throughout
- Provide final summary

## Requirements

Before running:
- ✅ Source code is implemented (test skeletons optional - agent can generate)
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
   git commit -m "test: implement unit tests for core components"
   ```

## Tips

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
