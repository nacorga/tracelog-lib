import { expect, test } from '@playwright/test';
import { navigateToPlayground } from './utils/environment.utils.js';

/**
 * E2E Tests: getConsentState() API Method
 *
 * **Priority**: HIGH (Consent Management)
 *
 * Tests getConsentState() behavior in different scenarios:
 * - Before init (reads from localStorage)
 * - After init (reads from ConsentManager)
 * - With corrupted data
 * - With no ConsentManager
 */
test.describe('getConsentState() API', () => {
  test('should return default state (all false) when called before init with no localStorage', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const state = await page.evaluate(() => {
      const traceLog = window.__traceLogBridge!;
      return traceLog.getConsentState();
    });

    expect(state).toEqual({
      google: false,
      custom: false,
      tracelog: false,
    });
  });

  test('should read consent from localStorage when called before init', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    await page.evaluate(() => {
      const consentData = {
        state: {
          google: true,
          custom: false,
          tracelog: true,
        },
        timestamp: Date.now(),
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
      };
      localStorage.setItem('tracelog_consent', JSON.stringify(consentData));
    });

    const state = await page.evaluate(() => {
      const traceLog = window.__traceLogBridge!;
      return traceLog.getConsentState();
    });

    expect(state).toEqual({
      google: true,
      custom: false,
      tracelog: true,
    });
  });

  test('should return ConsentManager state after init', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const state = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      // Set consent before init
      await traceLog.setConsent('google', true);
      await traceLog.setConsent('custom', false);

      // Initialize
      await traceLog.init({
        integrations: {
          google: { measurementId: 'G-TEST123' },
          custom: { collectApiUrl: 'http://localhost:8080/collect' },
        },
      });

      // Get state after init
      return traceLog.getConsentState();
    });

    expect(state.google).toBe(true);
    expect(state.custom).toBe(false);
  });

  test('should update state after setConsent() is called post-init', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      // Initialize
      await traceLog.init({
        integrations: {
          google: { measurementId: 'G-TEST123' },
        },
      });

      const before = traceLog.getConsentState();

      // Change consent
      await traceLog.setConsent('google', true);

      const after = traceLog.getConsentState();

      return { before, after };
    });

    expect(result.before.google).toBe(false);
    expect(result.after.google).toBe(true);
  });

  test('should return default state when ConsentManager not available', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const state = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      // Initialize without integrations (no ConsentManager needed)
      await traceLog.init();

      return traceLog.getConsentState();
    });

    // Should return default false values
    expect(state).toEqual({
      google: false,
      custom: false,
      tracelog: false,
    });
  });

  test('should handle corrupted localStorage data gracefully', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    await page.evaluate(() => {
      localStorage.setItem('tracelog_consent', 'corrupted-json-data');
    });

    const state = await page.evaluate(() => {
      const traceLog = window.__traceLogBridge!;
      return traceLog.getConsentState();
    });

    expect(state).toEqual({
      google: false,
      custom: false,
      tracelog: false,
    });
  });
});
