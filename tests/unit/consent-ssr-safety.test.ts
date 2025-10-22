/**
 * SSR Safety Tests for Consent API Methods
 *
 * Verifies that consent methods are safe to call in SSR/Node.js environments
 * without throwing errors or accessing browser-only APIs.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as TraceLog from '../../src/api';

describe('SSR Safety - Consent API Methods', () => {
  let originalWindow: typeof globalThis.window | undefined;
  let originalDocument: typeof globalThis.document | undefined;

  beforeEach(() => {
    // Save original globals
    originalWindow = globalThis.window;
    originalDocument = globalThis.document;
  });

  afterEach(() => {
    // Restore globals
    if (originalWindow) {
      globalThis.window = originalWindow;
    }
    if (originalDocument) {
      globalThis.document = originalDocument;
    }
  });

  describe('setConsent() - SSR Safety', () => {
    it('should be no-op when window is undefined (SSR)', async () => {
      // Simulate SSR environment
      // @ts-expect-error - Simulating SSR
      delete globalThis.window;
      // @ts-expect-error - Simulating SSR
      delete globalThis.document;

      // Should not throw
      await expect(TraceLog.setConsent('google', true)).resolves.toBeUndefined();
      await expect(TraceLog.setConsent('custom', false)).resolves.toBeUndefined();
      await expect(TraceLog.setConsent('all', true)).resolves.toBeUndefined();
    });

    it('should not attempt to access localStorage in SSR', async () => {
      // @ts-expect-error - Simulating SSR
      delete globalThis.window;
      // @ts-expect-error - Simulating SSR
      delete globalThis.document;

      const localStorageSpy = vi.fn();

      // Even if localStorage exists in test environment, it shouldn't be called
      if (typeof localStorage !== 'undefined') {
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(localStorageSpy);
      }

      await TraceLog.setConsent('google', true);

      // localStorage should NOT have been accessed
      expect(localStorageSpy).not.toHaveBeenCalled();

      if (typeof localStorage !== 'undefined') {
        vi.restoreAllMocks();
      }
    });
  });

  describe('getConsentState() - SSR Safety', () => {
    it('should return default state when window is undefined (SSR)', () => {
      // Simulate SSR environment
      // @ts-expect-error - Simulating SSR
      delete globalThis.window;
      // @ts-expect-error - Simulating SSR
      delete globalThis.document;

      const state = TraceLog.getConsentState();

      expect(state).toEqual({
        google: false,
        custom: false,
        tracelog: false,
      });
    });

    it('should not throw error in SSR', () => {
      // @ts-expect-error - Simulating SSR
      delete globalThis.window;
      // @ts-expect-error - Simulating SSR
      delete globalThis.document;

      expect(() => {
        TraceLog.getConsentState();
      }).not.toThrow();
    });
  });

  describe('hasConsent() - SSR Safety', () => {
    it('should return false when window is undefined (SSR)', () => {
      // Simulate SSR environment
      // @ts-expect-error - Simulating SSR
      delete globalThis.window;
      // @ts-expect-error - Simulating SSR
      delete globalThis.document;

      expect(TraceLog.hasConsent('google')).toBe(false);
      expect(TraceLog.hasConsent('custom')).toBe(false);
      expect(TraceLog.hasConsent('tracelog')).toBe(false);
      expect(TraceLog.hasConsent('all')).toBe(false);
    });

    it('should not attempt to access localStorage in SSR', () => {
      // @ts-expect-error - Simulating SSR
      delete globalThis.window;
      // @ts-expect-error - Simulating SSR
      delete globalThis.document;

      const localStorageGetSpy = vi.fn();

      if (typeof localStorage !== 'undefined') {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(localStorageGetSpy);
      }

      TraceLog.hasConsent('google');

      // localStorage should NOT have been accessed
      expect(localStorageGetSpy).not.toHaveBeenCalled();

      if (typeof localStorage !== 'undefined') {
        vi.restoreAllMocks();
      }
    });

    it('should not throw error in SSR', () => {
      // @ts-expect-error - Simulating SSR
      delete globalThis.window;
      // @ts-expect-error - Simulating SSR
      delete globalThis.document;

      expect(() => {
        TraceLog.hasConsent('google');
        TraceLog.hasConsent('custom');
        TraceLog.hasConsent('tracelog');
        TraceLog.hasConsent('all');
      }).not.toThrow();
    });
  });

  describe('All Consent Methods - SSR Consistency', () => {
    it('should all be safe to call in SSR without errors', () => {
      // @ts-expect-error - Simulating SSR
      delete globalThis.window;
      // @ts-expect-error - Simulating SSR
      delete globalThis.document;

      // All these should work without throwing
      expect(() => {
        void TraceLog.setConsent('google', true);
        void TraceLog.setConsent('custom', false);
        void TraceLog.setConsent('all', true);

        const state = TraceLog.getConsentState();
        expect(state).toBeDefined();

        const hasGoogle = TraceLog.hasConsent('google');
        const hasCustom = TraceLog.hasConsent('custom');
        const hasAll = TraceLog.hasConsent('all');

        expect(typeof hasGoogle).toBe('boolean');
        expect(typeof hasCustom).toBe('boolean');
        expect(typeof hasAll).toBe('boolean');
      }).not.toThrow();
    });
  });
});
