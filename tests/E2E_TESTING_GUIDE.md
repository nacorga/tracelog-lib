# E2E Testing Guide for TraceLog SDK

**Playwright-based E2E testing guide for browser interaction testing**

## Using GitHub Copilot coding agent effectively

This guide incorporates GitHub’s “Get the best results” best practices for Copilot coding agent. Use the checklists and templates below when assigning E2E-related tasks to Copilot or collaborating with it on pull requests.

### Well‑scoped tasks (required for good outcomes)
- Problem: clear, small scope (e.g., “stabilize flaky click test on Firefox”).
- Acceptance criteria: concrete pass signals (build, lint, E2E, cross‑browser) and artifacts (tests, docs).
- Pointers: exact files/paths to touch and any constraints (no new deps, preserve API).

Issue template for Copilot
```
Title: [E2E] <short objective>

Context
- Repo: tracelog-client
- Area: tests/e2e/<category>/
- Related files: tests/utils/test-helpers.ts, tests/fixtures/index.html

Task
- <what to change or add>

Acceptance criteria
- npm run check passes
- npm run build:browser and npm run test:e2e pass on Chromium, Firefox, WebKit
- No new dependencies added
- Console shows no TraceLog errors during tests

Change boundaries
- Only modify tests and, if essential, minimal source to fix clear bugs
- Keep existing patterns (helpers, console monitor, cleanup)
```

### Pick the right tasks for Copilot
Good candidates
- Add or refactor Playwright tests for: initialization, session lifecycle, event capture.
- Fix flaky tests (stabilize waits, selectors, cleanup).
- Improve test coverage for handlers/managers without changing public API.
- Update test docs and fixtures to reflect current flows.

Avoid assigning
- Broad refactors across multiple subsystems or design‑heavy changes.
- Security‑sensitive or production‑critical logic changes.
- Ambiguous tasks lacking clear acceptance criteria.

### Iterate via pull request comments
- Mention @copilot with specific, batched review feedback. Prefer “Start a review” and submit once.
- Example comments to Copilot:
  - “@copilot please replace CSS selectors with getByRole()/getByTestId() in all modified tests.”
  - “@copilot ensure tests run on Chromium/Firefox/WebKit and address timeouts by using helpers.”
- Copilot can push updates to the PR; you can also commit directly to the branch.

### Repository custom instructions
- This repo includes `.github/copilot-instructions.md` with build/test rules and conventions. Keep it updated.
- Optional path-specific instructions for Playwright tests can further guide Copilot. Example file:

```
.github/instructions/playwright-tests.instructions.md
---
applyTo: "tests/e2e/**/*.spec.ts"
---
## Playwright test requirements for TraceLog
- Use TestHelpers for navigation, waits, and cleanup.
- Prefer getByRole/getByTestId selectors.
- Validate no TraceLog errors in console.
- Ensure cross‑browser (Chromium/Firefox/WebKit) compatibility.
```

### MCP and environment readiness
- Copilot’s environment can use the Playwright MCP server; ensure tasks include how to build and test:
  - Install: npm ci
  - Build: npm run build:browser
  - Serve test fixtures (when needed locally): npm run serve:test
  - Run tests: npm run test:e2e
- Pre‑install dependencies to speed up Copilot with an optional setup file:

```
# .github/copilot-setup-steps.yml (optional)
steps:
  - uses: actions/setup-node@v4
    with:
      node-version: 20
      cache: npm
  - run: npm ci
  - run: npx playwright install --with-deps
```

Notes
- Respect project constraints: no new dependencies; don’t change dist/ structure.
- Don’t cancel long‑running tasks noted as critical in this repo.

## 🎯 Objectives

- **Browser Validation**: Test TraceLog SDK functionality across different browsers and devices
- **User Journey Testing**: Validate complete user flows and interactions
- **Integration Verification**: Ensure SDK integrates properly with web applications
- **Error Handling**: Verify graceful degradation and error scenarios

## 🏗️ Architecture

```
tests/
├── e2e/                          # Playwright test files
│   ├── initialization/           # SDK initialization tests
│   ├── session-management/       # Session lifecycle tests
│   ├── event-tracking/          # Event capture tests
│   └── [other-categories]/      # Organized by functionality
├── fixtures/                    # Test HTML pages and assets
│   ├── index.html              # Main test page
│   ├── tracelog.js             # Built SDK for testing
│   └── pages/                  # Additional test pages
└── utils/                      # Test utilities and helpers
    └── test-helpers.ts         # Common testing functions
```

**Test Flow**: Page Load → SDK Init → User Interactions → Event Capture → Validation

## 🛠️ Tech Stack

- **Playwright** - Cross-browser E2E testing
- **TypeScript** - Test implementation
- **http-server** - Local test server
- **Multiple browsers** - Chromium, Firefox, WebKit, Mobile

## 📝 Conventions

### File Naming
- **Test files**: `test.spec.ts` in category directories
- **Categories**: `kebab-case` (e.g., `session-management/`)
- **Constants**: `UPPER_SNAKE_CASE` for test values

### Code Style
```typescript
// Follow existing patterns from test-helpers.ts
test.describe('Feature Name', () => {
  test('should validate specific behavior', async ({ page }) => {
    // Setup console monitoring
    const monitor = TestHelpers.createConsoleMonitor(page);
    
    try {
      // Test implementation
      await TestHelpers.navigateAndWaitForReady(page, '/');
      // ... test logic
    } finally {
      monitor.cleanup();
    }
  });
});
```

### Test Structure
- **Setup**: Console monitoring, page navigation
- **Action**: User interactions, SDK operations  
- **Validation**: Assertions, error checking
- **Cleanup**: Resource cleanup in `finally` blocks

## 🚀 Common Commands

```bash
# Run all E2E tests
npm run test:e2e

# Start test server (separate terminal)
npm run serve:test

# Build SDK for testing
npm run build:browser

# Fix code format using prettier and eslint
npm run fix

# Full test pipeline (build + test)
npm run test:e2e  # Includes build step

# Test specific browser
npx playwright test --project=chromium
npx playwright test --project="Mobile Chrome"

# Debug mode
npx playwright test --debug
npx playwright test --headed

# Generate test report
npx playwright show-report
```

## 🔍 Test Patterns

### Basic Test Structure
```typescript
import { test, expect } from '@playwright/test';
import { TestHelpers, TestAssertions } from '../../../utils/test-helpers';

test.describe('Feature Category', () => {
  const TEST_CONFIG = { id: 'test-project' };

  test('should validate expected behavior', async ({ page }) => {
    const monitor = TestHelpers.createConsoleMonitor(page);

    try {
      // Navigate and initialize
      await TestHelpers.navigateAndWaitForReady(page, '/');
      const initResult = await TestHelpers.initializeTraceLog(page, TEST_CONFIG);
      
      // Validate initialization
      const validated = TestAssertions.verifyInitializationResult(initResult);
      expect(validated.success).toBe(true);
      
      // Test specific functionality
      await TestHelpers.triggerClickEvent(page);
      
      // Verify results
      expect(TestAssertions.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });
});
```

### Helper Usage
```typescript
// Navigation
await TestHelpers.navigateAndWaitForReady(page, '/custom-page');

// SDK Operations
await TestHelpers.initializeTraceLog(page, { id: 'test' });
await TestHelpers.testCustomEvent(page, 'event_name', { data: 'value' });

// Interactions
await TestHelpers.triggerClickEvent(page, 'button[data-testid="cta"]');
await TestHelpers.triggerScrollEvent(page);

// Validations
const isInitialized = await TestHelpers.isTraceLogInitialized(page);
const storageKeys = await TestHelpers.getTraceLogStorageKeys(page);
```

## ⚠️ What NOT to Do

### 🚫 Test Structure
- **DON'T** write tests without console monitoring and cleanup
- **DON'T** skip error validation - always check for unexpected errors
- **DON'T** hardcode timeouts - use `TestHelpers.waitForTimeout()`
- **DON'T** test without proper page ready states

### 🚫 Browser Compatibility
- **DON'T** assume all browsers support the same APIs
- **DON'T** use browser-specific features without fallback testing
- **DON'T** ignore mobile browser differences (touch vs mouse events)
- **DON'T** test only in one browser during development

### 🚫 Async Operations
- **DON'T** forget `await` for all async operations
- **DON'T** use `setTimeout()` - use `page.waitForTimeout()`
- **DON'T** skip waiting for page load states
- **DON'T** chain promises without proper error handling

### 🚫 Test Data
- **DON'T** rely on external services - tests should be isolated
- **DON'T** leave test data in localStorage between tests
- **DON'T** use production API endpoints in tests
- **DON'T** commit sensitive test data or credentials

### 🚫 Performance
- **DON'T** run tests with missing cleanup - causes memory leaks
- **DON'T** use excessive waits - impacts test execution time
- **DON'T** skip parallel execution optimization
- **DON'T** ignore flaky tests - fix root causes

## 🎯 Quick Start

```bash
# 1. Build SDK for testing
npm run build:browser

# 2. Start test server (separate terminal)
npm run serve:test

# 3. Run tests
npm run test:e2e

# 4. View results
npx playwright show-report
```

### Debug Test Issues
```bash
# Run specific test with debugging
npx playwright test tests/e2e/initialization --debug

# Run with browser UI visible
npx playwright test --headed

# Generate trace for failed tests
npx playwright test --trace=on
```

**Key Success Metrics**: All browsers pass, no console errors, proper cleanup, realistic user interactions

## 🛡️ Test Success Requirements

### Mandatory Test Passing
- **All tests must pass successfully** - No failing tests should be accepted
- **Cross-browser compatibility** - Tests must pass on all configured browsers (Chromium, Firefox, WebKit, Mobile)
- **Zero test regression** - New tests or changes cannot break existing tests
- **Clean test execution** - No console errors, memory leaks, or resource cleanup issues

### Implementation Standards
- **Apply necessary changes only** - Modify code strictly as needed for test success, avoiding over-engineering. Address any logic anomalies, errors, or clear opportunities for improvement in the source code, but ensure changes do not compromise existing functionality.  
- **Maintain test isolation** - Each test must be independent and not interfere with others.  
- **Preserve existing patterns** - Follow the established test structure, conventions, and helper utilities.  
- **Validate thoroughly** - Include comprehensive assertions and error checks to ensure reliability.

### Continuous Improvement
- **Identify improvement opportunities** during test implementation or maintenance
- **Implement enhancements** that improve test reliability, performance, or maintainability
- **Balance improvements vs. risk** - Only apply improvements that don't compromise existing test success
- **Document significant changes** in test structure or helper functions

### Quality Gates
```bash
# Before committing changes, verify:
npm run test:e2e                    # All tests pass
npm run check                       # Code style compliance
npm run build:all                   # Build succeeds
npm run fix                         # Format code style and detect eslint errors

# Verify cross-browser compatibility
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

**Success Criteria**: 100% test pass rate across all browsers with zero regressions and measurable improvements where applicable