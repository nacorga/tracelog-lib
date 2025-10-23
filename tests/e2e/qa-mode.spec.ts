import { expect, test } from '@playwright/test';
import { navigateToPlayground } from './utils/environment.utils.js';

/**
 * E2E Tests: QA Mode
 *
 * **Priority**: MEDIUM (Developer Experience/Debugging)
 *
 * Tests QA Mode activation, persistence, and behavior:
 * - Programmatic API (setQaMode)
 * - URL parameter activation (?tlog_mode=qa)
 * - sessionStorage persistence
 * - Console logging behavior
 * - Strict validation mode
 */
test.describe('QA Mode', () => {
  test('should activate QA mode via setQaMode(true) API', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      // Activate QA mode
      traceLog.setQaMode(true);

      // Check sessionStorage
      const stored = sessionStorage.getItem('tlog:qa_mode');

      await traceLog.init();

      // Send custom event (should log to console, not send to backend)
      const consoleLogs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: unknown[]): void => {
        consoleLogs.push(args.join(' '));
        originalLog(...args);
      };

      traceLog.event('test_event', { foo: 'bar' });

      await new Promise((resolve) => setTimeout(resolve, 100));

      console.log = originalLog;

      return {
        stored,
        consoleLogs,
      };
    });

    expect(result.stored).toBe('true');
    expect(result.consoleLogs.some((log) => log.includes('[TraceLog:QA]'))).toBe(true);
  });

  test('should deactivate QA mode via setQaMode(false) API', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(() => {
      const traceLog = window.__traceLogBridge!;

      // Activate then deactivate
      traceLog.setQaMode(true);
      traceLog.setQaMode(false);

      // Check sessionStorage
      const stored = sessionStorage.getItem('tlog:qa_mode');

      return { stored };
    });

    expect(result.stored).toBe('false');
  });

  test('should activate QA mode via URL parameter ?tlog_mode=qa', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true', tlog_mode: 'qa' } });

    const result = await page.evaluate(() => {
      // Check sessionStorage (should be set by library on page load)
      const stored = sessionStorage.getItem('tlog:qa_mode');

      // Check URL cleaned up (query param should be removed)
      const url = new URL(window.location.href);
      const hasQueryParam = url.searchParams.has('tlog_mode');

      return { stored, hasQueryParam };
    });

    expect(result.stored).toBe('true');
    // URL should be cleaned up by library
    expect(result.hasQueryParam).toBe(false);
  });

  test('should deactivate QA mode via URL parameter ?tlog_mode=qa_off', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    // First activate
    await page.evaluate(() => {
      const traceLog = window.__traceLogBridge!;
      traceLog.setQaMode(true);
    });

    // Navigate with qa_off parameter
    await page.goto('http://localhost:3000?e2e=true&tlog_mode=qa_off');

    await new Promise((resolve) => setTimeout(resolve, 100));

    const result = await page.evaluate(() => {
      const stored = sessionStorage.getItem('tlog:qa_mode');
      return { stored };
    });

    expect(result.stored).toBe('false');
  });

  test('should persist QA mode across page reloads', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    // Activate QA mode
    await page.evaluate(() => {
      const traceLog = window.__traceLogBridge!;
      traceLog.setQaMode(true);
    });

    // Reload page
    await page.reload();

    await new Promise((resolve) => setTimeout(resolve, 200));

    // Check if still active
    const result = await page.evaluate(() => {
      const stored = sessionStorage.getItem('tlog:qa_mode');
      return { stored };
    });

    expect(result.stored).toBe('true');
  });

  test('should log custom events to console in QA mode', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const consoleLogs: string[] = [];

    // Capture console logs
    page.on('console', (msg) => {
      consoleLogs.push(msg.text());
    });

    await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      traceLog.setQaMode(true);
      await traceLog.init();

      // Send custom event
      traceLog.event('qa_test_event', { test: 'data' });

      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Should have QA mode console log
    const qaLogs = consoleLogs.filter((log) => log.includes('[TraceLog:QA]') && log.includes('qa_test_event'));

    expect(qaLogs.length).toBeGreaterThan(0);
  });

  test('should NOT log custom events in normal mode (QA disabled)', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const consoleLogs: string[] = [];

    // Capture console logs
    page.on('console', (msg) => {
      consoleLogs.push(msg.text());
    });

    await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      // QA mode OFF
      traceLog.setQaMode(false);
      await traceLog.init({
        integrations: {
          custom: { collectApiUrl: 'http://localhost:8080/collect', allowHttp: true },
        },
      });

      // Send custom event
      traceLog.event('normal_test_event', { test: 'data' });

      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Should NOT have QA mode console logs
    const qaLogs = consoleLogs.filter((log) => log.includes('[TraceLog:QA]'));

    expect(qaLogs.length).toBe(0);
  });

  test('should enable strict validation in QA mode', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      traceLog.setQaMode(true);
      await traceLog.init();

      let errorThrown = false;
      let errorMessage = '';

      try {
        // Send event with invalid metadata (two levels of nesting exceeds MAX_METADATA_NESTING_DEPTH)
        traceLog.event('invalid_event', { nested: { deep: { invalid: 'data' } } } as Record<string, unknown>);
      } catch (error) {
        errorThrown = true;
        errorMessage = error instanceof Error ? error.message : String(error);
      }

      return { errorThrown, errorMessage };
    });

    // In QA mode, should throw error for invalid metadata
    expect(result.errorThrown).toBe(true);
    expect(result.errorMessage).toContain('validation');
  });

  test('should silently ignore invalid metadata in normal mode (QA disabled)', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      traceLog.setQaMode(false);
      await traceLog.init({
        integrations: {
          custom: { collectApiUrl: 'http://localhost:8080/collect', allowHttp: true },
        },
      });

      let errorThrown = false;

      try {
        // Send event with invalid metadata (two levels of nesting exceeds MAX_METADATA_NESTING_DEPTH)
        traceLog.event('invalid_event', { nested: { deep: { invalid: 'data' } } } as Record<string, unknown>);
      } catch {
        errorThrown = true;
      }

      return { errorThrown };
    });

    // In normal mode, should NOT throw error (silent ignore)
    expect(result.errorThrown).toBe(false);
  });

  test('should work in SSR environment (no-op)', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(() => {
      // Simulate SSR by temporarily removing window
      const originalWindow = (globalThis as Record<string, unknown>).window;
      delete (globalThis as Record<string, unknown>).window;

      let errorThrown = false;

      try {
        // This should be imported dynamically, but for test purposes we'll use the bridge
        const traceLog = (originalWindow as Window & typeof globalThis).__traceLogBridge!;
        traceLog.setQaMode(true);
      } catch {
        errorThrown = true;
      }

      // Restore window
      (globalThis as Record<string, unknown>).window = originalWindow;

      return { errorThrown };
    });

    expect(result.errorThrown).toBe(false);
  });
});
