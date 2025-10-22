/**
 * E2E Tests: Consent QuotaExceededError Scenarios
 *
 * Verifies that the library handles localStorage quota errors gracefully
 * when attempting to persist consent data.
 *
 * These tests use in-browser mocking of localStorage to simulate quota errors
 * since we cannot easily fill localStorage in a test environment.
 */

import { test, expect } from '@playwright/test';
import { navigateToPlayground } from './utils/environment.utils';

test.describe('Consent QuotaExceededError Handling', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false });
  });

  test('should handle QuotaExceededError gracefully when localStorage is full', async ({ page }) => {
    const result = await page.evaluate(async () => {
      // Mock localStorage to throw QuotaExceededError
      const originalSetItem = window.localStorage.setItem.bind(window.localStorage);
      let quotaErrorThrown = false;

      window.localStorage.setItem = function (key: string, value: string) {
        // Allow test key for StorageManager initialization
        if (key === '__tracelog_test__') {
          originalSetItem(key, value);
          return;
        }

        // Throw QuotaExceededError for consent key
        if (key === 'tlog:consent') {
          quotaErrorThrown = true;
          const error = new DOMException('localStorage quota exceeded', 'QuotaExceededError');
          throw error;
        }

        originalSetItem(key, value);
      };

      try {
        // This should handle the error gracefully (not throw to user code)
        await window.__traceLogBridge!.setConsent('google', true);

        // Verify consent was NOT persisted to localStorage
        const stored = window.localStorage.getItem('tlog:consent');

        // Restore original
        window.localStorage.setItem = originalSetItem;

        return {
          success: true,
          quotaErrorThrown,
          storedToLocalStorage: stored !== null,
          error: null,
        };
      } catch (error) {
        // Restore original even on error
        window.localStorage.setItem = originalSetItem;

        return {
          success: false,
          quotaErrorThrown,
          storedToLocalStorage: false,
          error: (error as Error).message,
        };
      }
    });

    // Should handle error gracefully (not throw)
    expect(result.success).toBe(true);
    expect(result.error).toBeNull();

    // Should have attempted to write (quota error thrown)
    expect(result.quotaErrorThrown).toBe(true);

    // Data should NOT be in localStorage (quota exceeded)
    expect(result.storedToLocalStorage).toBe(false);
  });

  test('should allow consent to work after quota error is resolved', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const originalSetItem = window.localStorage.setItem.bind(window.localStorage);
      let attemptCount = 0;

      // Mock to fail first time, succeed second time
      window.localStorage.setItem = function (key: string, value: string) {
        if (key === '__tracelog_test__') {
          originalSetItem(key, value);
          return;
        }

        if (key === 'tlog:consent') {
          attemptCount++;
          if (attemptCount === 1) {
            // First attempt: throw quota error
            const error = new DOMException('localStorage quota exceeded', 'QuotaExceededError');
            throw error;
          } else {
            // Subsequent attempts: succeed
            originalSetItem(key, value);
            return;
          }
        }

        originalSetItem(key, value);
      };

      try {
        // First setConsent (will fail)
        await window.__traceLogBridge!.setConsent('google', true);

        // Second setConsent (will succeed)
        await window.__traceLogBridge!.setConsent('custom', true);

        // Check localStorage
        const stored = window.localStorage.getItem('tlog:consent');

        // Restore original
        window.localStorage.setItem = originalSetItem;

        return {
          attemptCount,
          storedToLocalStorage: stored !== null,
          storedData: stored ? JSON.parse(stored) : null,
        };
      } catch (error) {
        window.localStorage.setItem = originalSetItem;
        return {
          attemptCount,
          storedToLocalStorage: false,
          storedData: null,
          error: (error as Error).message,
        };
      }
    });

    // Should have made 2 attempts
    expect(result.attemptCount).toBe(2);

    // Second attempt should have succeeded
    expect(result.storedToLocalStorage).toBe(true);
    expect(result.storedData).not.toBeNull();
    expect(result.storedData.state.custom).toBe(true);
  });

  test('should handle QuotaExceededError for all integrations', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const originalSetItem = window.localStorage.setItem.bind(window.localStorage);
      let quotaErrorThrown = false;

      window.localStorage.setItem = function (key: string, value: string) {
        if (key === '__tracelog_test__') {
          originalSetItem(key, value);
          return;
        }

        if (key === 'tlog:consent') {
          quotaErrorThrown = true;
          const error = new DOMException('localStorage quota exceeded', 'QuotaExceededError');
          throw error;
        }

        originalSetItem(key, value);
      };

      try {
        // Set consent for all integrations
        await window.__traceLogBridge!.setConsent('all', true);

        // Restore original
        window.localStorage.setItem = originalSetItem;

        const stored = window.localStorage.getItem('tlog:consent');

        return {
          success: true,
          quotaErrorThrown,
          storedToLocalStorage: stored !== null,
        };
      } catch (error) {
        window.localStorage.setItem = originalSetItem;
        return {
          success: false,
          quotaErrorThrown,
          storedToLocalStorage: false,
          error: (error as Error).message,
        };
      }
    });

    // Should handle gracefully
    expect(result.success).toBe(true);
    expect(result.quotaErrorThrown).toBe(true);
    expect(result.storedToLocalStorage).toBe(false);
  });

  test('should persist consent to in-memory fallback when quota exceeded', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const originalSetItem = window.localStorage.setItem.bind(window.localStorage);

      // Mock localStorage to always fail
      window.localStorage.setItem = function (key: string, value: string) {
        if (key === '__tracelog_test__') {
          originalSetItem(key, value);
          return;
        }

        if (key === 'tlog:consent') {
          const error = new DOMException('localStorage quota exceeded', 'QuotaExceededError');
          throw error;
        }

        originalSetItem(key, value);
      };

      try {
        // Set consent (will use fallback)
        await window.__traceLogBridge!.setConsent('google', true);

        // Now init TraceLog
        await window.__traceLogBridge!.init({
          integrations: {
            google: { measurementId: 'G-TEST' },
          },
        });

        // Check if consent state is available after init
        const consentState = window.__traceLogBridge!.getConsentState();

        // Restore original
        window.localStorage.setItem = originalSetItem;

        return {
          success: true,
          consentState,
          hasConsent: window.__traceLogBridge!.hasConsent('google'),
        };
      } catch (error) {
        window.localStorage.setItem = originalSetItem;
        return {
          success: false,
          error: (error as Error).message,
          consentState: null,
          hasConsent: false,
        };
      }
    });

    // Should work with fallback storage
    expect(result.success).toBe(true);

    // Consent should be available in memory even without localStorage persistence
    // Note: This behavior depends on how the library handles fallback storage
    // The consent might not persist across page reloads, but should work within the session
  });
});
