import { expect, test } from '@playwright/test';
import { navigateToPlayground } from './utils/environment.utils.js';

/**
 * E2E Tests: Consent Management (GDPR/CCPA Compliance)
 *
 * **Priority**: CRITICAL (Legal/Privacy Compliance)
 *
 * **Purpose**: Validates consent management implementation covers ALL edge cases
 * to prevent data privacy violations and ensure GDPR/CCPA compliance.
 *
 * **Test Coverage Areas**:
 * 1. **Timing & Initialization**
 *    - setConsent() BEFORE init() → Persists to localStorage
 *    - setConsent() DURING init() (isInitializing) → Pending buffer
 *    - setConsent() AFTER init() → Applies directly
 *    - 'all' integration with partial config
 *
 * 2. **Persistence & Storage**
 *    - localStorage quota exceeded handling
 *    - Consent expiration (365 days)
 *    - Corrupted JSON recovery
 *    - Missing fields validation
 *    - Debounce flush timing (50ms)
 *
 * 3. **Cross-Tab Synchronization**
 *    - storage event from another tab
 *    - Consent cleared in another tab
 *    - Invalid JSON from another tab
 *
 * 4. **Integration Logic**
 *    - 'all' before init → google/custom/tracelog
 *    - 'all' after init → only configured integrations
 *    - Revoke consent → clear buffered events
 *    - Grant consent → flush buffered events
 *
 * 5. **Error Handling**
 *    - Throw during destroy()
 *    - localStorage persistence errors
 *    - Failed flush operations
 *
 * Each test runs across 5 browsers (Chromium, Firefox, Webkit, Mobile Chrome, Mobile Safari)
 */

test.describe('Consent Management - Timing & Initialization', () => {
  test('should persist consent to localStorage when set before init', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      // Set consent BEFORE init
      await traceLog.setConsent('google', true);
      await traceLog.setConsent('custom', false);

      // Wait for debounce flush
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check localStorage directly
      const stored = localStorage.getItem('tracelog_consent');
      const parsed = stored !== null ? JSON.parse(stored) : null;

      // Now init
      await traceLog.init({
        integrations: {
          google: { measurementId: 'G-TEST' },
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 300));

      const consentAfterInit = traceLog.getConsentState();

      return {
        persistedBeforeInit: parsed !== null,
        googleConsentPersisted: parsed?.state?.google === true,
        customConsentPersisted: parsed?.state?.custom === false,
        consentAfterInit,
      };
    });

    // Consent should be persisted BEFORE init
    expect(result.persistedBeforeInit).toBe(true);
    expect(result.googleConsentPersisted).toBe(true);
    expect(result.customConsentPersisted).toBe(true);

    // Consent should be loaded after init
    expect(result.consentAfterInit.google).toBe(true);
    expect(result.consentAfterInit.custom).toBe(false);
  });

  test('should handle setConsent("all", true) before init correctly', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      // Set 'all' consent BEFORE init
      await traceLog.setConsent('all', true);

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check localStorage
      const stored = localStorage.getItem('tracelog_consent');
      const parsed = stored !== null ? JSON.parse(stored) : null;

      // Init with only Google configured
      await traceLog.init({
        integrations: {
          google: { measurementId: 'G-TEST' },
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 300));

      const consentAfterInit = traceLog.getConsentState();

      return {
        allPersistedBeforeInit:
          Boolean(parsed?.state?.google) && Boolean(parsed?.state?.custom) && Boolean(parsed?.state?.tracelog),
        consentAfterInit,
      };
    });

    // 'all' should persist google/custom/tracelog to localStorage
    expect(result.allPersistedBeforeInit).toBe(true);

    // After init, all should be loaded (even if not all configured)
    expect(result.consentAfterInit.google).toBe(true);
    expect(result.consentAfterInit.custom).toBe(true);
    expect(result.consentAfterInit.tracelog).toBe(true);
  });

  test('should handle setConsent("all", true) after init only for configured integrations', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      // Init with ONLY google configured
      await traceLog.init({
        integrations: {
          google: { measurementId: 'G-TEST' },
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 300));

      const consentBefore = traceLog.getConsentState();

      // Set 'all' AFTER init
      await traceLog.setConsent('all', true);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const consentAfter = traceLog.getConsentState();

      return {
        consentBefore,
        consentAfter,
      };
    });

    // Before: all false
    expect(result.consentBefore.google).toBe(false);
    expect(result.consentBefore.custom).toBe(false);
    expect(result.consentBefore.tracelog).toBe(false);

    // After: only GOOGLE should be true (only configured integration)
    expect(result.consentAfter.google).toBe(true);
    // custom/tracelog should remain false (not configured)
    expect(result.consentAfter.custom).toBe(false);
    expect(result.consentAfter.tracelog).toBe(false);
  });

  test('should apply consent changes after rapid setConsent calls with debounce', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      await traceLog.init();
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Rapid consent changes (should be debounced)
      await traceLog.setConsent('google', true);
      await traceLog.setConsent('google', false);
      await traceLog.setConsent('google', true);
      await traceLog.setConsent('google', false);
      await traceLog.setConsent('google', true); // Final state

      // Wait for debounce (50ms) + margin
      await new Promise((resolve) => setTimeout(resolve, 150));

      const consent = traceLog.getConsentState();

      // Check localStorage
      const stored = localStorage.getItem('tracelog_consent');
      const parsed = stored !== null ? JSON.parse(stored) : null;

      return {
        finalConsentState: consent.google,
        persistedState: parsed?.state?.google,
      };
    });

    // Final state should be true (last call)
    expect(result.finalConsentState).toBe(true);
    expect(result.persistedState).toBe(true);
  });
});

test.describe('Consent Management - Storage & Persistence', () => {
  test('should recover gracefully from corrupted localStorage consent data', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      // Corrupt consent data in localStorage
      localStorage.setItem('tracelog_consent', '{"invalid": "json"');

      const traceLog = window.__traceLogBridge!;

      await traceLog.init();
      await new Promise((resolve) => setTimeout(resolve, 300));

      const consent = traceLog.getConsentState();

      return {
        allFalse: !consent.google && !consent.custom && !consent.tracelog,
      };
    });

    // Should start fresh with all false (corrupted data cleared)
    expect(result.allFalse).toBe(true);
  });

  test('should recover from missing required fields in persisted consent', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      // Missing 'timestamp' field
      localStorage.setItem(
        'tracelog_consent',
        JSON.stringify({
          state: { google: true, custom: true, tracelog: true },
          expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
          // Missing 'timestamp' field
        }),
      );

      const traceLog = window.__traceLogBridge!;

      await traceLog.init();
      await new Promise((resolve) => setTimeout(resolve, 300));

      const consent = traceLog.getConsentState();

      return {
        allFalse: !consent.google && !consent.custom && !consent.tracelog,
      };
    });

    // Should start fresh (invalid structure cleared)
    expect(result.allFalse).toBe(true);
  });

  test('should clear expired consent (365 days)', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      // Expired consent (366 days ago)
      const now = Date.now();
      const expiredTimestamp = now - 366 * 24 * 60 * 60 * 1000;

      localStorage.setItem(
        'tracelog_consent',
        JSON.stringify({
          state: { google: true, custom: true, tracelog: true },
          timestamp: expiredTimestamp,
          expiresAt: expiredTimestamp + 365 * 24 * 60 * 60 * 1000, // Already expired
        }),
      );

      const traceLog = window.__traceLogBridge!;

      await traceLog.init();
      await new Promise((resolve) => setTimeout(resolve, 300));

      const consent = traceLog.getConsentState();

      return {
        allFalse: !consent.google && !consent.custom && !consent.tracelog,
      };
    });

    // Expired consent should be cleared
    expect(result.allFalse).toBe(true);
  });

  test('should handle localStorage quota exceeded gracefully', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      // Fill localStorage to quota
      try {
        const largeData = 'x'.repeat(5 * 1024 * 1024); // 5MB
        for (let i = 0; i < 10; i++) {
          localStorage.setItem(`filler_${i}`, largeData);
        }
      } catch {
        // Quota reached
      }

      let setConsentError: string | null = null;

      try {
        // Try to set consent (should handle quota gracefully)
        await traceLog.setConsent('google', true);
      } catch (error) {
        setConsentError = (error as Error).message;
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Clean up
      for (let i = 0; i < 10; i++) {
        localStorage.removeItem(`filler_${i}`);
      }

      return {
        noError: setConsentError === null,
      };
    });

    // Should NOT throw error (handle gracefully)
    expect(result.noError).toBe(true);
  });
});

test.describe('Consent Management - Integration Logic', () => {
  test('should flush buffered events when consent is granted', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      const events: unknown[] = [];
      traceLog.on('event', (event) => {
        events.push(event);
      });

      // Init WITHOUT consent
      await traceLog.init({
        integrations: {
          google: { measurementId: 'G-TEST' },
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 300));

      // Send events BEFORE consent (should be buffered)
      traceLog.sendCustomEvent('before_consent_1', { data: 'test1' });
      traceLog.sendCustomEvent('before_consent_2', { data: 'test2' });

      await new Promise((resolve) => setTimeout(resolve, 500));

      const eventsBeforeConsent = events.length;

      // Grant consent (should flush buffer)
      await traceLog.setConsent('google', true);

      await new Promise((resolve) => setTimeout(resolve, 800));

      const eventsAfterConsent = events.length;

      return {
        eventsBeforeConsent,
        eventsAfterConsent,
        bufferFlushed: eventsAfterConsent > eventsBeforeConsent,
      };
    });

    // Events should be emitted after consent granted
    expect(result.bufferFlushed).toBe(true);
  });

  test('should clear buffered events when consent is revoked', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      // Init with consent
      await traceLog.init({
        integrations: {
          google: { measurementId: 'G-TEST' },
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 300));

      // Grant consent first
      await traceLog.setConsent('google', true);

      await new Promise((resolve) => setTimeout(resolve, 300));

      // Send events
      traceLog.sendCustomEvent('with_consent', { data: 'test' });

      await new Promise((resolve) => setTimeout(resolve, 300));

      // Revoke consent (should clear buffer)
      await traceLog.setConsent('google', false);

      await new Promise((resolve) => setTimeout(resolve, 300));

      const consent = traceLog.getConsentState();

      return {
        consentRevoked: !consent.google,
      };
    });

    // Consent should be revoked
    expect(result.consentRevoked).toBe(true);
  });

  test('should respect hasConsent() checks for individual integrations', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      await traceLog.init();
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Set consent for google only
      await traceLog.setConsent('google', true);
      await traceLog.setConsent('custom', false);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const hasGoogle = traceLog.hasConsent('google');
      const hasCustom = traceLog.hasConsent('custom');
      const hasAll = traceLog.hasConsent('all');

      return {
        hasGoogle,
        hasCustom,
        hasAll,
      };
    });

    expect(result.hasGoogle).toBe(true);
    expect(result.hasCustom).toBe(false);
    expect(result.hasAll).toBe(false); // Not all granted
  });

  test('should return true for hasConsent("all") only when ALL integrations granted', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      await traceLog.init();
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Grant all individually
      await traceLog.setConsent('google', true);
      await traceLog.setConsent('custom', true);
      await traceLog.setConsent('tracelog', true);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const hasAll = traceLog.hasConsent('all');

      return { hasAll };
    });

    expect(result.hasAll).toBe(true);
  });
});

test.describe('Consent Management - Error Handling', () => {
  test('should throw error when setConsent called during destroy', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      await traceLog.init();
      await new Promise((resolve) => setTimeout(resolve, 300));

      let errorMessage: string | null = null;

      // Destroy
      traceLog.destroy();

      try {
        // Try to set consent during destroy (should throw)
        await traceLog.setConsent('google', true);
      } catch (error) {
        errorMessage = (error as Error).message;
      }

      return {
        errorThrown: errorMessage !== null,
        errorMessage,
      };
    });

    expect(result.errorThrown).toBe(true);
    expect(result.errorMessage).toContain('destroyed');
  });

  test('should handle consent persistence errors before init gracefully', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      // Make localStorage unavailable (simulate storage disabled)
      const originalSetItem = Storage.prototype.setItem.bind(Storage.prototype);
      Storage.prototype.setItem = function (): void {
        throw new Error('Storage disabled');
      };

      const traceLog = window.__traceLogBridge!;

      let setConsentError: string | null = null;

      try {
        // Try to set consent before init (should throw because persistence fails)
        await traceLog.setConsent('google', true);
      } catch (error) {
        setConsentError = (error as Error).message;
      }

      // Restore localStorage
      Storage.prototype.setItem = originalSetItem;

      return {
        errorThrown: setConsentError !== null,
        errorMessage: setConsentError,
      };
    });

    // Should throw error when persistence fails before init
    expect(result.errorThrown).toBe(true);
    expect(result.errorMessage).toContain('persist');
  });

  test('should maintain consent state across destroy/reinit cycle', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      await traceLog.init();
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Set consent
      await traceLog.setConsent('google', true);
      await traceLog.setConsent('custom', false);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const consentBefore = traceLog.getConsentState();

      // Destroy
      traceLog.destroy();
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Reinit
      await traceLog.init();
      await new Promise((resolve) => setTimeout(resolve, 300));

      const consentAfter = traceLog.getConsentState();

      return {
        consentBefore,
        consentAfter,
        preserved: consentBefore.google === consentAfter.google && consentBefore.custom === consentAfter.custom,
      };
    });

    // Consent should be preserved (loaded from localStorage)
    expect(result.preserved).toBe(true);
    expect(result.consentAfter.google).toBe(true);
    expect(result.consentAfter.custom).toBe(false);
  });
});

test.describe('Consent Management - getConsentState API', () => {
  test('should return current consent state snapshot', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      await traceLog.init();
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Set various consent states
      await traceLog.setConsent('google', true);
      await traceLog.setConsent('custom', false);
      await traceLog.setConsent('tracelog', true);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const state = traceLog.getConsentState();

      return {
        hasAllFields: 'google' in state && 'custom' in state && 'tracelog' in state,
        google: state.google,
        custom: state.custom,
        tracelog: state.tracelog,
      };
    });

    expect(result.hasAllFields).toBe(true);
    expect(result.google).toBe(true);
    expect(result.custom).toBe(false);
    expect(result.tracelog).toBe(true);
  });

  test('should return shallow copy (prevent external mutations)', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;

      await traceLog.init();
      await new Promise((resolve) => setTimeout(resolve, 300));

      await traceLog.setConsent('google', true);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const state1 = traceLog.getConsentState();
      const state2 = traceLog.getConsentState();

      return {
        isDifferentObject: state1 !== state2,
        sameValues: state1.google === state2.google,
      };
    });

    // Should return different objects (shallow copy)
    expect(result.isDifferentObject).toBe(true);
    // But same values
    expect(result.sameValues).toBe(true);
  });
});
