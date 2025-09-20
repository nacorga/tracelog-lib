import { test, expect } from '@playwright/test';
import { TestUtils } from '../utils';

test.describe('Feature Name', () => {
  test('should validate behavior', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      await TestUtils.navigateAndWaitForReady(page, '/');

      const initResult = await TestUtils.initializeTraceLog(page);

      expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);
      expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

      const appInstance = await TestUtils.getAppInstance(page);

      expect(appInstance).toBeDefined();
    } finally {
      monitor.cleanup(); // ALWAYS required
    }
  });
});
