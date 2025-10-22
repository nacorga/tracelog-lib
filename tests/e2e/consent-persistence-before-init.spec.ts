/**
 * E2E Tests: Consent Persistence Before Init
 *
 * Verifies that consent is correctly persisted to localStorage when setConsent()
 * is called BEFORE tracelog.init().
 *
 * This is critical for GDPR/CCPA compliance where consent may be collected
 * before the analytics library is fully initialized.
 */

import { test, expect } from '@playwright/test';
import { navigateToPlayground } from './utils/environment.utils';

test.describe('Consent Persistence Before Init', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false });
  });

  test('should persist consent to localStorage when setConsent called before init', async ({ page }) => {
    const result = await page.evaluate(async () => {
      // Step 1: Call setConsent BEFORE init
      await window.__traceLogBridge.setConsent('google', true);

      // Step 2: Immediately check localStorage (before init)
      // NOTE: The correct key is 'tlog:consent' (STORAGE_BASE_KEY + ':consent')
      const storedAfterSet = window.localStorage.getItem('tlog:consent');

      // Step 3: Now initialize
      await window.__traceLogBridge.init({
        integrations: {
          google: { measurementId: 'G-TEST' },
        },
      });

      // Step 4: Check localStorage after init
      const storedAfterInit = window.localStorage.getItem('tlog:consent');

      return {
        storedAfterSet: storedAfterSet ? JSON.parse(storedAfterSet) : null,
        storedAfterInit: storedAfterInit ? JSON.parse(storedAfterInit) : null,
      };
    });

    // Verify consent was persisted BEFORE init
    expect(result.storedAfterSet).not.toBeNull();
    expect(result.storedAfterSet.state).toBeDefined();
    expect(result.storedAfterSet.state.google).toBe(true);
    expect(result.storedAfterSet.timestamp).toBeDefined();
    expect(result.storedAfterSet.expiresAt).toBeDefined();

    // Verify consent is still in localStorage after init
    expect(result.storedAfterInit).not.toBeNull();
    expect(result.storedAfterInit.state.google).toBe(true);
  });

  test('should persist consent for "all" integrations before init', async ({ page }) => {
    const result = await page.evaluate(async () => {
      // Call setConsent('all') before init
      await window.__traceLogBridge.setConsent('all', true);

      const stored = window.localStorage.getItem('tlog:consent');

      return {
        stored: stored ? JSON.parse(stored) : null,
      };
    });

    expect(result.stored).not.toBeNull();
    expect(result.stored.state.google).toBe(true);
    expect(result.stored.state.custom).toBe(true);
    expect(result.stored.state.tracelog).toBe(true);
  });

  test('should persist consent for specific integration before init', async ({ page }) => {
    const result = await page.evaluate(async () => {
      // Set consent for custom integration only
      await window.__traceLogBridge.setConsent('custom', true);

      const stored = window.localStorage.getItem('tlog:consent');

      return {
        stored: stored ? JSON.parse(stored) : null,
      };
    });

    expect(result.stored).not.toBeNull();
    expect(result.stored.state.custom).toBe(true);
    expect(result.stored.state.google).toBe(false);
    expect(result.stored.state.tracelog).toBe(false);
  });

  test('should handle multiple setConsent calls before init', async ({ page }) => {
    const result = await page.evaluate(async () => {
      // Multiple consent operations before init
      await window.__traceLogBridge.setConsent('google', true);

      const checkpoint1 = window.localStorage.getItem('tlog:consent');

      await window.__traceLogBridge.setConsent('custom', true);

      const checkpoint2 = window.localStorage.getItem('tlog:consent');

      await window.__traceLogBridge.setConsent('tracelog', false);

      const checkpoint3 = window.localStorage.getItem('tlog:consent');

      return {
        checkpoint1: checkpoint1 ? JSON.parse(checkpoint1) : null,
        checkpoint2: checkpoint2 ? JSON.parse(checkpoint2) : null,
        checkpoint3: checkpoint3 ? JSON.parse(checkpoint3) : null,
      };
    });

    // Checkpoint 1: google=true
    expect(result.checkpoint1).not.toBeNull();
    expect(result.checkpoint1.state.google).toBe(true);
    expect(result.checkpoint1.state.custom).toBe(false);

    // Checkpoint 2: google=true, custom=true
    expect(result.checkpoint2).not.toBeNull();
    expect(result.checkpoint2.state.google).toBe(true);
    expect(result.checkpoint2.state.custom).toBe(true);

    // Checkpoint 3: google=true, custom=true, tracelog=false
    expect(result.checkpoint3).not.toBeNull();
    expect(result.checkpoint3.state.google).toBe(true);
    expect(result.checkpoint3.state.custom).toBe(true);
    expect(result.checkpoint3.state.tracelog).toBe(false);
  });

  test('should apply persisted consent after init completes', async ({ page }) => {
    const result = await page.evaluate(async () => {
      // Set consent before init
      await window.__traceLogBridge.setConsent('google', true);
      await window.__traceLogBridge.setConsent('custom', false);

      // Now initialize
      await window.__traceLogBridge.init({
        waitForConsent: true,
        integrations: {
          google: { measurementId: 'G-TEST' },
          custom: { collectApiUrl: 'https://api.test.com/collect' },
        },
      });

      // Get consent state after init
      const consentState = window.__traceLogBridge.getConsentState();

      return {
        consentState,
      };
    });

    // Verify consent state is correctly loaded after init
    expect(result.consentState.google).toBe(true);
    expect(result.consentState.custom).toBe(false);
  });
});
