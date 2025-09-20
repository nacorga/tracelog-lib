applyTo: "tests/e2e/**/*.spec.ts"
---

## Playwright tests for TraceLog Events Library

Follow these repo-specific requirements for reliable, maintainable E2E tests and to get the best results with GitHub Copilot coding agent.

### Required practices
1. Use TestHelpers and patterns
	- Always create a console monitor and clean up in a `finally` block:
	  - `const monitor = TestHelpers.createConsoleMonitor(page);` then `monitor.cleanup()`
	- Navigate with `TestHelpers.navigateAndWaitForReady(page, '/')`.
	- Initialize with `TestHelpers.initializeTraceLog(page, { id: 'test-project' })`.
2. Stable locators
	- Prefer `getByRole()`, `getByTestId()`, and `getByText()` over CSS/XPath.
3. Auto-waiting and timing
	- Don’t use `setTimeout()`. Rely on Playwright’s auto-wait and helper methods.
	- If a time-based wait is necessary, prefer `TestHelpers.waitForTimeout()`.
4. Cross-browser compatibility
	- Ensure tests pass on Chromium, Firefox, and WebKit (and configured mobile projects).
	- Avoid browser-specific features; handle loading/dynamic content explicitly.
5. Isolation and cleanup
	- Each test must be independent; do not rely on previous state.
	- Clear side effects and storage as needed (use helpers where available).
6. Assertions and validation
	- Use Playwright `expect` matchers (e.g., `toHaveText`, `toBeVisible`).
	- Verify there are no TraceLog errors in the console via `TestAssertions` when applicable.
7. Repository constraints
	- Do not add new dependencies.
	- Do not change `dist/` structure or public API.

### Recommended test skeleton
```ts
import { test, expect } from '@playwright/test';
import { TestHelpers, TestAssertions } from '../../../utils/test.helpers';

test.describe('Feature Name', () => {
  const TEST_CONFIG = { id: 'test-project' };

  test('should validate behavior', async ({ page }) => {
	 const monitor = TestHelpers.createConsoleMonitor(page);
	 try {
		await TestHelpers.navigateAndWaitForReady(page, '/');
		const init = await TestHelpers.initializeTraceLog(page, TEST_CONFIG);
		const ok = TestAssertions.verifyInitializationResult(init);
		expect(ok.success).toBe(true);

		// ...interactions using stable locators...

		expect(TestAssertions.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
	 } finally {
		monitor.cleanup();
	 }
  });
});
```

### Acceptance checklist for PRs touching E2E tests
- `npm run check` passes
- `npm run build:browser` and `npm run test:e2e` pass across Chromium/Firefox/WebKit
- No new dependencies added; no changes to `dist/` layout
- Tests include console monitoring and `finally` cleanup