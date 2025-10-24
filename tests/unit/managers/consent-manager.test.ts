/**
 * ConsentManager Tests
 * Focus: Consent tracking and event buffering
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment, advanceTimers } from '../../helpers/setup.helper';
import { ConsentManager } from '../../../src/managers/consent.manager';
import { StorageManager } from '../../../src/managers/storage.manager';
import { Emitter } from '../../../src/utils/emitter.utils';
import { EmitterEvent } from '../../../src/types/emitter.types';
import { CONSENT_KEY, CONSENT_EXPIRY_DAYS } from '../../../src/constants/storage.constants';

describe('ConsentManager', () => {
  let consentManager: ConsentManager;
  let storageManager: StorageManager;
  let emitter: Emitter;

  beforeEach(() => {
    setupTestEnvironment();
    storageManager = new StorageManager();
    emitter = new Emitter();
    // Create fresh instance without cross-tab sync for most tests
    consentManager = new ConsentManager(storageManager, false, emitter);
  });

  afterEach(() => {
    consentManager.cleanup();
    cleanupTestEnvironment();
  });

  describe('hasConsent()', () => {
    it('should return false for all integrations by default', () => {
      expect(consentManager.hasConsent('google')).toBe(false);
      expect(consentManager.hasConsent('custom')).toBe(false);
      expect(consentManager.hasConsent('tracelog')).toBe(false);
      expect(consentManager.hasConsent('all')).toBe(false);
    });

    it('should return true for granted integration', () => {
      consentManager.setConsent('google', true);
      expect(consentManager.hasConsent('google')).toBe(true);
      expect(consentManager.hasConsent('custom')).toBe(false);
      expect(consentManager.hasConsent('tracelog')).toBe(false);
    });

    it('should return true for "all" only when all integrations have consent', () => {
      consentManager.setConsent('google', true);
      consentManager.setConsent('custom', true);
      expect(consentManager.hasConsent('all')).toBe(false);

      consentManager.setConsent('tracelog', true);
      expect(consentManager.hasConsent('all')).toBe(true);
    });

    it('should return false for "all" when any integration lacks consent', () => {
      consentManager.setConsent('all', true);
      expect(consentManager.hasConsent('all')).toBe(true);

      consentManager.setConsent('google', false);
      expect(consentManager.hasConsent('all')).toBe(false);
    });

    it('should return false in SSR environment', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      const ssrConsentManager = new ConsentManager(storageManager, false, emitter);
      expect(ssrConsentManager.hasConsent('google')).toBe(false);

      global.window = originalWindow;
    });
  });

  describe('setConsent()', () => {
    it('should grant consent for specific integration', () => {
      consentManager.setConsent('google', true);
      expect(consentManager.hasConsent('google')).toBe(true);
      expect(consentManager.hasConsent('custom')).toBe(false);
      expect(consentManager.hasConsent('tracelog')).toBe(false);
    });

    it('should revoke consent for specific integration', () => {
      consentManager.setConsent('google', true);
      expect(consentManager.hasConsent('google')).toBe(true);

      consentManager.setConsent('google', false);
      expect(consentManager.hasConsent('google')).toBe(false);
    });

    it('should grant consent for all integrations when "all" is used', () => {
      consentManager.setConsent('all', true);
      expect(consentManager.hasConsent('google')).toBe(true);
      expect(consentManager.hasConsent('custom')).toBe(true);
      expect(consentManager.hasConsent('tracelog')).toBe(true);
      expect(consentManager.hasConsent('all')).toBe(true);
    });

    it('should revoke consent for all integrations when "all" is used', () => {
      consentManager.setConsent('all', true);
      consentManager.setConsent('all', false);
      expect(consentManager.hasConsent('google')).toBe(false);
      expect(consentManager.hasConsent('custom')).toBe(false);
      expect(consentManager.hasConsent('tracelog')).toBe(false);
      expect(consentManager.hasConsent('all')).toBe(false);
    });

    it('should emit consent-changed event when consent is granted', () => {
      const consentChangedCallback = vi.fn();
      emitter.on(EmitterEvent.CONSENT_CHANGED, consentChangedCallback);

      consentManager.setConsent('google', true);

      expect(consentChangedCallback).toHaveBeenCalledTimes(1);
      expect(consentChangedCallback).toHaveBeenCalledWith({
        google: true,
        custom: false,
        tracelog: false,
      });
    });

    it('should emit consent-changed event when consent is revoked', () => {
      consentManager.setConsent('google', true);

      const consentChangedCallback = vi.fn();
      emitter.on(EmitterEvent.CONSENT_CHANGED, consentChangedCallback);

      consentManager.setConsent('google', false);

      expect(consentChangedCallback).toHaveBeenCalledTimes(1);
      expect(consentChangedCallback).toHaveBeenCalledWith({
        google: false,
        custom: false,
        tracelog: false,
      });
    });

    it('should emit consent-changed event for "all" consent', () => {
      const consentChangedCallback = vi.fn();
      emitter.on(EmitterEvent.CONSENT_CHANGED, consentChangedCallback);

      consentManager.setConsent('all', true);

      expect(consentChangedCallback).toHaveBeenCalledTimes(1);
      expect(consentChangedCallback).toHaveBeenCalledWith({
        google: true,
        custom: true,
        tracelog: true,
      });
    });

    it('should not emit event if emitter is null', () => {
      const managerWithoutEmitter = new ConsentManager(storageManager, false, null);
      managerWithoutEmitter.setConsent('google', true);
      // No assertion needed - just ensuring no error thrown
      expect(managerWithoutEmitter.hasConsent('google')).toBe(true);
      managerWithoutEmitter.cleanup();
    });

    it('should no-op in SSR environment', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      const ssrConsentManager = new ConsentManager(storageManager, false, emitter);
      ssrConsentManager.setConsent('google', true);
      expect(ssrConsentManager.hasConsent('google')).toBe(false);

      global.window = originalWindow;
    });
  });

  describe('getConsentState()', () => {
    it('should return default state (all false) initially', () => {
      const state = consentManager.getConsentState();
      expect(state).toEqual({
        google: false,
        custom: false,
        tracelog: false,
      });
    });

    it('should return current consent state', () => {
      consentManager.setConsent('google', true);
      consentManager.setConsent('tracelog', true);

      const state = consentManager.getConsentState();
      expect(state).toEqual({
        google: true,
        custom: false,
        tracelog: true,
      });
    });

    it('should return shallow copy to prevent external mutations', () => {
      consentManager.setConsent('google', true);

      const state1 = consentManager.getConsentState();
      state1.google = false;

      const state2 = consentManager.getConsentState();
      expect(state2.google).toBe(true);
    });
  });

  describe('getGrantedIntegrations()', () => {
    it('should return empty array when no consent granted', () => {
      const granted = consentManager.getGrantedIntegrations();
      expect(granted).toEqual([]);
    });

    it('should return single granted integration', () => {
      consentManager.setConsent('google', true);
      const granted = consentManager.getGrantedIntegrations();
      expect(granted).toEqual(['google']);
    });

    it('should return multiple granted integrations', () => {
      consentManager.setConsent('google', true);
      consentManager.setConsent('tracelog', true);
      const granted = consentManager.getGrantedIntegrations();
      expect(granted).toContain('google');
      expect(granted).toContain('tracelog');
      expect(granted).toHaveLength(2);
    });

    it('should return all integrations when all granted', () => {
      consentManager.setConsent('all', true);
      const granted = consentManager.getGrantedIntegrations();
      expect(granted).toContain('google');
      expect(granted).toContain('custom');
      expect(granted).toContain('tracelog');
      expect(granted).toHaveLength(3);
    });

    it('should not include revoked integrations', () => {
      consentManager.setConsent('all', true);
      consentManager.setConsent('google', false);
      const granted = consentManager.getGrantedIntegrations();
      expect(granted).not.toContain('google');
      expect(granted).toContain('custom');
      expect(granted).toContain('tracelog');
      expect(granted).toHaveLength(2);
    });
  });

  describe('Persistence', () => {
    it('should persist consent to localStorage', async () => {
      vi.useFakeTimers();

      consentManager.setConsent('google', true);

      // Wait for debounce (50ms)
      await advanceTimers(50);

      const stored = storageManager.getItem(CONSENT_KEY);
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.state).toEqual({
        google: true,
        custom: false,
        tracelog: false,
      });
      expect(parsed.timestamp).toBeTypeOf('number');
      expect(parsed.expiresAt).toBeTypeOf('number');

      vi.useRealTimers();
    });

    it('should debounce multiple rapid consent changes', async () => {
      vi.useFakeTimers();
      const setItemSpy = vi.spyOn(storageManager, 'setItem');

      consentManager.setConsent('google', true);
      consentManager.setConsent('custom', true);
      consentManager.setConsent('tracelog', true);

      // Wait for debounce
      await advanceTimers(50);

      // Should only persist once
      expect(setItemSpy).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });

    it('should load persisted consent on initialization', () => {
      const persistedData = {
        state: {
          google: true,
          custom: false,
          tracelog: true,
        },
        timestamp: Date.now(),
        expiresAt: Date.now() + CONSENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
      };

      storageManager.setItem(CONSENT_KEY, JSON.stringify(persistedData));

      const newConsentManager = new ConsentManager(storageManager, false, emitter);

      expect(newConsentManager.hasConsent('google')).toBe(true);
      expect(newConsentManager.hasConsent('custom')).toBe(false);
      expect(newConsentManager.hasConsent('tracelog')).toBe(true);

      newConsentManager.cleanup();
    });

    it('should ignore expired consent', () => {
      const expiredData = {
        state: {
          google: true,
          custom: true,
          tracelog: true,
        },
        timestamp: Date.now() - (CONSENT_EXPIRY_DAYS + 1) * 24 * 60 * 60 * 1000,
        expiresAt: Date.now() - 24 * 60 * 60 * 1000, // Expired yesterday
      };

      storageManager.setItem(CONSENT_KEY, JSON.stringify(expiredData));

      const newConsentManager = new ConsentManager(storageManager, false, emitter);

      expect(newConsentManager.hasConsent('google')).toBe(false);
      expect(newConsentManager.hasConsent('custom')).toBe(false);
      expect(newConsentManager.hasConsent('tracelog')).toBe(false);

      // Should clear expired consent
      expect(storageManager.getItem(CONSENT_KEY)).toBeNull();

      newConsentManager.cleanup();
    });

    it('should handle invalid persisted data gracefully', () => {
      storageManager.setItem(CONSENT_KEY, 'invalid-json');

      const newConsentManager = new ConsentManager(storageManager, false, emitter);

      expect(newConsentManager.hasConsent('google')).toBe(false);
      expect(storageManager.getItem(CONSENT_KEY)).toBeNull();

      newConsentManager.cleanup();
    });

    it('should handle missing required fields in persisted data', () => {
      const incompleteData = {
        state: {
          google: true,
        },
        // Missing timestamp and expiresAt
      };

      storageManager.setItem(CONSENT_KEY, JSON.stringify(incompleteData));

      const newConsentManager = new ConsentManager(storageManager, false, emitter);

      expect(newConsentManager.hasConsent('google')).toBe(false);
      expect(storageManager.getItem(CONSENT_KEY)).toBeNull();

      newConsentManager.cleanup();
    });

    it('should calculate correct expiration date', async () => {
      vi.useFakeTimers();
      const now = Date.now();
      vi.setSystemTime(now);

      consentManager.setConsent('google', true);
      await advanceTimers(50);

      const stored = storageManager.getItem(CONSENT_KEY);
      const parsed = JSON.parse(stored!);

      const expectedExpiry = now + CONSENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      expect(parsed.expiresAt).toBeGreaterThanOrEqual(expectedExpiry);
      expect(parsed.expiresAt).toBeLessThan(expectedExpiry + 1000); // Within 1 second

      vi.useRealTimers();
    });
  });

  describe('Cross-Tab Sync', () => {
    it('should setup storage listener when cross-tab sync enabled', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      const syncedManager = new ConsentManager(storageManager, true, emitter);

      expect(addEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function));

      syncedManager.cleanup();
    });

    it('should not setup storage listener when cross-tab sync disabled', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      const unsyncedManager = new ConsentManager(storageManager, false, emitter);

      expect(addEventListenerSpy).not.toHaveBeenCalledWith('storage', expect.any(Function));

      unsyncedManager.cleanup();
    });

    it('should sync consent changes from other tab', () => {
      const syncedManager = new ConsentManager(storageManager, true, emitter);

      const newData = {
        state: {
          google: true,
          custom: false,
          tracelog: true,
        },
        timestamp: Date.now(),
        expiresAt: Date.now() + CONSENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
      };

      // Simulate storage event from another tab
      const storageEvent = new StorageEvent('storage', {
        key: CONSENT_KEY,
        newValue: JSON.stringify(newData),
        storageArea: window.localStorage,
      });

      window.dispatchEvent(storageEvent);

      expect(syncedManager.hasConsent('google')).toBe(true);
      expect(syncedManager.hasConsent('custom')).toBe(false);
      expect(syncedManager.hasConsent('tracelog')).toBe(true);

      syncedManager.cleanup();
    });

    it('should emit consent-changed event on cross-tab sync', () => {
      const syncedManager = new ConsentManager(storageManager, true, emitter);
      const consentChangedCallback = vi.fn();
      emitter.on(EmitterEvent.CONSENT_CHANGED, consentChangedCallback);

      const newData = {
        state: {
          google: true,
          custom: false,
          tracelog: false,
        },
        timestamp: Date.now(),
        expiresAt: Date.now() + CONSENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
      };

      const storageEvent = new StorageEvent('storage', {
        key: CONSENT_KEY,
        newValue: JSON.stringify(newData),
        storageArea: window.localStorage,
      });

      window.dispatchEvent(storageEvent);

      expect(consentChangedCallback).toHaveBeenCalledWith({
        google: true,
        custom: false,
        tracelog: false,
      });

      syncedManager.cleanup();
    });

    it('should clear consent when storage cleared in another tab', () => {
      const syncedManager = new ConsentManager(storageManager, true, emitter);
      syncedManager.setConsent('all', true);

      const storageEvent = new StorageEvent('storage', {
        key: CONSENT_KEY,
        newValue: null,
        storageArea: window.localStorage,
      });

      window.dispatchEvent(storageEvent);

      expect(syncedManager.hasConsent('google')).toBe(false);
      expect(syncedManager.hasConsent('custom')).toBe(false);
      expect(syncedManager.hasConsent('tracelog')).toBe(false);

      syncedManager.cleanup();
    });

    it('should ignore storage events for other keys', () => {
      const syncedManager = new ConsentManager(storageManager, true, emitter);
      syncedManager.setConsent('google', true);

      const storageEvent = new StorageEvent('storage', {
        key: 'other-key',
        newValue: JSON.stringify({ foo: 'bar' }),
        storageArea: window.localStorage,
      });

      window.dispatchEvent(storageEvent);

      // Should remain unchanged
      expect(syncedManager.hasConsent('google')).toBe(true);
      expect(syncedManager.hasConsent('custom')).toBe(false);

      syncedManager.cleanup();
    });

    it('should ignore storage events from sessionStorage', () => {
      const syncedManager = new ConsentManager(storageManager, true, emitter);

      const storageEvent = new StorageEvent('storage', {
        key: CONSENT_KEY,
        newValue: JSON.stringify({
          state: { google: true, custom: true, tracelog: true },
          timestamp: Date.now(),
          expiresAt: Date.now() + 1000,
        }),
        storageArea: window.sessionStorage,
      });

      window.dispatchEvent(storageEvent);

      // Should remain unchanged
      expect(syncedManager.hasConsent('google')).toBe(false);

      syncedManager.cleanup();
    });

    it('should handle invalid JSON in cross-tab sync gracefully', () => {
      const syncedManager = new ConsentManager(storageManager, true, emitter);

      const storageEvent = new StorageEvent('storage', {
        key: CONSENT_KEY,
        newValue: 'invalid-json',
        storageArea: window.localStorage,
      });

      window.dispatchEvent(storageEvent);

      // Should remain unchanged
      expect(syncedManager.hasConsent('google')).toBe(false);

      syncedManager.cleanup();
    });
  });

  describe('cleanup()', () => {
    it('should clear pending debounce timer', async () => {
      vi.useFakeTimers();
      const setItemSpy = vi.spyOn(storageManager, 'setItem');

      consentManager.setConsent('google', true);

      // Cleanup before debounce completes
      consentManager.cleanup();

      await advanceTimers(50);

      // Should not persist after cleanup
      expect(setItemSpy).not.toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should remove storage listener', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const syncedManager = new ConsentManager(storageManager, true, emitter);
      syncedManager.cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function));
    });

    it('should not throw error when cleaning up without storage listener', () => {
      const unsyncedManager = new ConsentManager(storageManager, false, emitter);

      expect(() => {
        unsyncedManager.cleanup();
      }).not.toThrow();
    });

    it('should not throw error in SSR environment', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      const ssrManager = new ConsentManager(storageManager, false, emitter);

      expect(() => {
        ssrManager.cleanup();
      }).not.toThrow();

      global.window = originalWindow;
    });

    it('should not clear persisted consent from localStorage', async () => {
      vi.useFakeTimers();

      consentManager.setConsent('google', true);
      await advanceTimers(50);

      const storedBefore = storageManager.getItem(CONSENT_KEY);
      expect(storedBefore).toBeTruthy();

      consentManager.cleanup();

      const storedAfter = storageManager.getItem(CONSENT_KEY);
      expect(storedAfter).toBeTruthy();
      expect(storedAfter).toBe(storedBefore);

      vi.useRealTimers();
    });
  });

  describe('flush()', () => {
    it('should immediately persist pending consent changes', () => {
      vi.useFakeTimers();
      const setItemSpy = vi.spyOn(storageManager, 'setItem');

      consentManager.setConsent('google', true);

      // Flush immediately (before debounce)
      consentManager.flush();

      expect(setItemSpy).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });

    it('should clear debounce timer after flush', async () => {
      vi.useFakeTimers();
      const setItemSpy = vi.spyOn(storageManager, 'setItem');

      consentManager.setConsent('google', true);
      consentManager.flush();

      // Advance timers - should not persist again
      await advanceTimers(50);

      expect(setItemSpy).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });

    it('should not throw error when flushing without pending changes', () => {
      expect(() => {
        consentManager.flush();
      }).not.toThrow();
    });

    it('should handle storage errors with throwOnError=false', () => {
      vi.spyOn(storageManager, 'setItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => {
        consentManager.setConsent('google', true);
        consentManager.flush(false);
      }).not.toThrow();
    });

    it('should throw storage errors with throwOnError=true', () => {
      vi.spyOn(storageManager, 'setItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => {
        consentManager.setConsent('google', true);
        consentManager.flush(true);
      }).toThrow('Storage error');
    });

    it('should handle QuotaExceededError', () => {
      const quotaError = new Error('QuotaExceededError');
      quotaError.name = 'QuotaExceededError';

      vi.spyOn(storageManager, 'setItem').mockImplementation(() => {
        throw quotaError;
      });

      expect(() => {
        consentManager.setConsent('google', true);
        consentManager.flush(false);
      }).not.toThrow();
    });
  });
});
