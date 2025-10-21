import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConsentManager } from '../../../src/managers/consent.manager';
import { StorageManager } from '../../../src/managers/storage.manager';
import { Emitter } from '../../../src/utils/emitter.utils';
import { EmitterEvent } from '../../../src/types/emitter.types';
import { CONSENT_KEY } from '../../../src/constants/storage.constants';

describe('ConsentManager', () => {
  let storageManager: StorageManager;
  let consentManager: ConsentManager;

  beforeEach(() => {
    storageManager = new StorageManager();
    storageManager.clear();
  });

  afterEach(() => {
    consentManager?.cleanup();
    storageManager?.clear();
  });

  describe('Core Functionality', () => {
    beforeEach(() => {
      consentManager = new ConsentManager(storageManager, false);
    });

    it('should initialize with all consents false', () => {
      expect(consentManager.hasConsent('google')).toBe(false);
      expect(consentManager.hasConsent('custom')).toBe(false);
      expect(consentManager.hasConsent('tracelog')).toBe(false);
    });

    it('should set individual consent', () => {
      consentManager.setConsent('google', true);

      expect(consentManager.hasConsent('google')).toBe(true);
      expect(consentManager.hasConsent('custom')).toBe(false);
    });

    it('should set all consents', () => {
      consentManager.setConsent('all', true);

      const state = consentManager.getConsentState();
      expect(state.google).toBe(true);
      expect(state.custom).toBe(true);
      expect(state.tracelog).toBe(true);
    });

    it('should revoke consent', () => {
      consentManager.setConsent('google', true);
      expect(consentManager.hasConsent('google')).toBe(true);

      consentManager.setConsent('google', false);
      expect(consentManager.hasConsent('google')).toBe(false);
    });

    it('should get consent state', () => {
      consentManager.setConsent('google', true);
      consentManager.setConsent('custom', false);

      const state = consentManager.getConsentState();

      expect(state.google).toBe(true);
      expect(state.custom).toBe(false);
      expect(state.tracelog).toBe(false);
    });

    it('should check hasConsent for "all"', () => {
      consentManager.setConsent('google', true);
      consentManager.setConsent('custom', true);
      consentManager.setConsent('tracelog', true);

      expect(consentManager.hasConsent('all')).toBe(true);

      consentManager.setConsent('google', false);
      expect(consentManager.hasConsent('all')).toBe(false);
    });

    it('should return granted integrations list', () => {
      consentManager.setConsent('google', true);
      consentManager.setConsent('tracelog', true);

      const granted = consentManager.getGrantedIntegrations();

      expect(granted).toContain('google');
      expect(granted).toContain('tracelog');
      expect(granted).not.toContain('custom');
      expect(granted.length).toBe(2);
    });
  });

  describe('Emitter Integration', () => {
    it('should emit CONSENT_CHANGED when consent is set', () => {
      const emitter = new Emitter();
      const emitSpy = vi.fn();

      emitter.on(EmitterEvent.CONSENT_CHANGED, emitSpy);

      consentManager = new ConsentManager(storageManager, false, emitter);

      consentManager.setConsent('google', true);

      expect(emitSpy).toHaveBeenCalledTimes(1);
      expect(emitSpy).toHaveBeenCalledWith({
        google: true,
        custom: false,
        tracelog: false,
      });
    });

    it('should emit event for each consent change', () => {
      const emitter = new Emitter();
      const emitSpy = vi.fn();

      emitter.on(EmitterEvent.CONSENT_CHANGED, emitSpy);

      consentManager = new ConsentManager(storageManager, false, emitter);

      consentManager.setConsent('google', true);
      consentManager.setConsent('custom', true);
      consentManager.setConsent('tracelog', false);

      expect(emitSpy).toHaveBeenCalledTimes(3);
    });

    it('should not throw if no emitter provided', () => {
      consentManager = new ConsentManager(storageManager, false, null);

      expect(() => {
        consentManager.setConsent('google', true);
      }).not.toThrow();
    });

    it('should emit for setConsent("all")', () => {
      const emitter = new Emitter();
      const emitSpy = vi.fn();

      emitter.on(EmitterEvent.CONSENT_CHANGED, emitSpy);

      consentManager = new ConsentManager(storageManager, false, emitter);

      consentManager.setConsent('all', true);

      expect(emitSpy).toHaveBeenCalledTimes(1);
      expect(emitSpy).toHaveBeenCalledWith({
        google: true,
        custom: true,
        tracelog: true,
      });
    });
  });

  describe('Persistence', () => {
    it('should persist consent to localStorage with debounce', async () => {
      consentManager = new ConsentManager(storageManager, false, null);

      consentManager.setConsent('google', true);

      // Wait for debounce (50ms + buffer)
      await new Promise((resolve) => setTimeout(resolve, 100));

      const stored = storageManager.getItem(CONSENT_KEY);
      expect(stored).toBeDefined();

      const parsed = JSON.parse(stored!);
      expect(parsed.state.google).toBe(true);
      expect(parsed.timestamp).toBeDefined();
      expect(parsed.expiresAt).toBeDefined();
    });

    it('should load persisted consent on construction', async () => {
      // First instance: set and persist consent
      const firstManager = new ConsentManager(storageManager, false, null);
      firstManager.setConsent('google', true);

      // Wait for persistence
      await new Promise((resolve) => setTimeout(resolve, 100));

      firstManager.cleanup();

      // Second instance: should load persisted consent
      const secondManager = new ConsentManager(storageManager, false, null);

      expect(secondManager.hasConsent('google')).toBe(true);

      secondManager.cleanup();
    });

    it('should handle expired consent (365 days)', () => {
      // Manually set expired consent
      const expiredConsent = {
        state: { google: true, custom: true, tracelog: true },
        timestamp: Date.now() - 366 * 24 * 60 * 60 * 1000, // 366 days ago
        expiresAt: Date.now() - 1000, // Expired
      };

      storageManager.setItem(CONSENT_KEY, JSON.stringify(expiredConsent));

      consentManager = new ConsentManager(storageManager, false, null);

      // Should not load expired consent
      expect(consentManager.hasConsent('google')).toBe(false);
    });

    it('should handle corrupted localStorage data', () => {
      storageManager.setItem(CONSENT_KEY, 'invalid-json{{{');

      expect(() => {
        consentManager = new ConsentManager(storageManager, false, null);
      }).not.toThrow();

      expect(consentManager.hasConsent('google')).toBe(false);
    });
  });

  describe('Cross-Tab Sync', () => {
    it('should NOT setup storage listener when enableCrossTabSync=false', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      consentManager = new ConsentManager(storageManager, false, null);

      expect(addEventListenerSpy).not.toHaveBeenCalledWith('storage', expect.any(Function));

      addEventListenerSpy.mockRestore();
    });

    it('should setup storage listener when enableCrossTabSync=true', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      consentManager = new ConsentManager(storageManager, true, null);

      expect(addEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function));

      addEventListenerSpy.mockRestore();
    });

    it('should cleanup storage listener on destroy', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      consentManager = new ConsentManager(storageManager, true, null);
      consentManager.cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });
  });
});
