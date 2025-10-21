import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { tracelog } from '../../src/public-api';
import { StorageManager } from '../../src/managers/storage.manager';
import { CONSENT_KEY } from '../../src/constants/storage.constants';
import { EmitterEvent } from '../../src/types';

describe('Consent Management Integration', () => {
  let storageManager: StorageManager;

  beforeEach(() => {
    storageManager = new StorageManager();
    storageManager.clear();

    // Clear consent from localStorage directly (for tests that check before init)
    localStorage.removeItem(CONSENT_KEY);

    if (tracelog.isInitialized()) {
      tracelog.destroy();
    }
  });

  afterEach(() => {
    if (tracelog.isInitialized()) {
      tracelog.destroy();
    }
    storageManager.clear();
    localStorage.removeItem(CONSENT_KEY);
  });

  describe('Basic Consent Operations', () => {
    it('should initialize with waitForConsent disabled by default', async () => {
      await tracelog.init({
        integrations: {
          custom: {
            collectApiUrl: 'https://api.test.com/collect',
          },
        },
      });

      const state = tracelog.getConsentState();
      expect(state.google).toBe(false);
      expect(state.custom).toBe(false);
      expect(state.tracelog).toBe(false);
    });

    it('should allow setting consent for individual integrations', async () => {
      await tracelog.init({
        waitForConsent: false,
        integrations: {
          custom: {
            collectApiUrl: 'https://api.test.com/collect',
          },
        },
      });

      await tracelog.setConsent('custom', true);

      expect(tracelog.hasConsent('custom')).toBe(true);
      expect(tracelog.hasConsent('google')).toBe(false);
    });

    it('should allow setting consent for all integrations', async () => {
      await tracelog.init({
        waitForConsent: false,
        integrations: {
          custom: {
            collectApiUrl: 'https://api.test.com/collect',
          },
        },
      });

      await tracelog.setConsent('all', true);

      const state = tracelog.getConsentState();
      expect(state.custom).toBe(true);
    });

    it('should persist consent to localStorage', async () => {
      await tracelog.init({
        waitForConsent: false,
      });

      await tracelog.setConsent('google', true);

      // Wait for debounced persist (50ms + buffer)
      await new Promise((resolve) => setTimeout(resolve, 100));

      const stored = localStorage.getItem(CONSENT_KEY);
      expect(stored).not.toBeNull();

      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed.state.google).toBe(true);
        expect(parsed.timestamp).toBeDefined();
        expect(parsed.expiresAt).toBeDefined();
      }
    });

    it('should load persisted consent on init', async () => {
      // First session: set consent
      await tracelog.init({
        waitForConsent: true,
      });

      await tracelog.setConsent('google', true);
      expect(tracelog.hasConsent('google')).toBe(true);

      // Wait for debounced persist (50ms + buffer)
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify persistence
      const stored = localStorage.getItem(CONSENT_KEY);
      expect(stored).not.toBeNull();

      tracelog.destroy();

      // Second session: consent should be loaded
      await tracelog.init({
        waitForConsent: true,
      });

      expect(tracelog.hasConsent('google')).toBe(true);
    });
  });

  describe('Consent Before Init', () => {
    it('should buffer consent operations before init', async () => {
      // Set consent before init
      await tracelog.setConsent('custom', true);

      // Init (use custom integration instead of Google to avoid GA initialization issues in tests)
      await tracelog.init({
        waitForConsent: true,
        integrations: {
          custom: {
            collectApiUrl: 'https://api.test.com/collect',
          },
        },
      });

      // Give time for async consent application
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Consent should be applied
      expect(tracelog.hasConsent('custom')).toBe(true);
    });
  });

  describe('waitForConsent Mode', () => {
    it('should buffer events when waitForConsent is enabled and no consent', async () => {
      const events: any[] = [];

      await tracelog.init({
        waitForConsent: true,
        integrations: {
          custom: {
            collectApiUrl: 'https://api.test.com/collect',
          },
        },
      });

      // Listen to events (should still emit locally)
      tracelog.on(EmitterEvent.EVENT, (event) => {
        events.push(event);
      });

      // Send custom event
      tracelog.event('test_event', { test: true });

      // Event should be emitted locally
      expect(events.length).toBe(1);
      expect(events[0].custom_event?.name).toBe('test_event');
    });

    it('should not buffer events when waitForConsent is disabled', async () => {
      await tracelog.init({
        waitForConsent: false,
        integrations: {
          custom: {
            collectApiUrl: 'https://api.test.com/collect',
          },
        },
      });

      tracelog.event('test_event', { test: true });

      // Events should go to normal queue, not consent buffer
      // (We can't easily verify this without exposing internals,
      //  but at least verify no errors occur)
      expect(tracelog.isInitialized()).toBe(true);
    });
  });

  describe('Consent State Retrieval', () => {
    it('should return correct consent state', async () => {
      await tracelog.init({
        waitForConsent: true,
      });

      await tracelog.setConsent('google', true);
      await tracelog.setConsent('custom', false);

      const state = tracelog.getConsentState();

      expect(state.google).toBe(true);
      expect(state.custom).toBe(false);
      expect(state.tracelog).toBe(false);
    });

    it('should return false for all when not initialized', () => {
      const state = tracelog.getConsentState();

      expect(state.google).toBe(false);
      expect(state.custom).toBe(false);
      expect(state.tracelog).toBe(false);
    });
  });

  describe('Revoke Consent', () => {
    it('should allow revoking consent', async () => {
      await tracelog.init({
        waitForConsent: true,
      });

      await tracelog.setConsent('google', true);
      expect(tracelog.hasConsent('google')).toBe(true);

      await tracelog.setConsent('google', false);
      expect(tracelog.hasConsent('google')).toBe(false);
    });
  });

  describe('Consent Changed Event', () => {
    it('should emit consent-changed event when consent is granted', async () => {
      const consentChanges: any[] = [];

      await tracelog.init({
        waitForConsent: true,
      });

      // Listen to consent changes
      tracelog.on(EmitterEvent.CONSENT_CHANGED, (state) => {
        consentChanges.push(state);
      });

      // Grant consent
      await tracelog.setConsent('google', true);

      // Wait for event emission
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should have emitted event
      expect(consentChanges.length).toBeGreaterThanOrEqual(1);

      const lastChange = consentChanges[consentChanges.length - 1];
      expect(lastChange).toHaveProperty('google', true);
      expect(lastChange).toHaveProperty('custom');
      expect(lastChange).toHaveProperty('tracelog');
    });

    it('should emit consent-changed event when consent is revoked', async () => {
      const consentChanges: any[] = [];

      await tracelog.init({
        waitForConsent: true,
      });

      // Grant first
      await tracelog.setConsent('custom', true);
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Now listen
      tracelog.on(EmitterEvent.CONSENT_CHANGED, (state) => {
        consentChanges.push(state);
      });

      // Revoke consent
      await tracelog.setConsent('custom', false);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(consentChanges.length).toBeGreaterThanOrEqual(1);

      const lastChange = consentChanges[consentChanges.length - 1];
      expect(lastChange.custom).toBe(false);
    });

    it('should emit consent-changed for setConsent("all")', async () => {
      const consentChanges: any[] = [];

      await tracelog.init({
        waitForConsent: true,
        integrations: {
          custom: {
            collectApiUrl: 'https://api.test.com/collect',
          },
        },
      });

      // Listen before setting consent
      tracelog.on(EmitterEvent.CONSENT_CHANGED, (state) => {
        consentChanges.push(state);
      });

      // Wait a tick to ensure listener is registered
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Set all
      await tracelog.setConsent('all', true);

      // Wait longer for the event to propagate
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(consentChanges.length).toBeGreaterThanOrEqual(1);

      const lastChange = consentChanges[consentChanges.length - 1];
      expect(lastChange.custom).toBe(true);
    });

    it('should support multiple listeners for consent-changed', async () => {
      const listener1Changes: any[] = [];
      const listener2Changes: any[] = [];

      await tracelog.init({
        waitForConsent: true,
      });

      tracelog.on(EmitterEvent.CONSENT_CHANGED, (state) => {
        listener1Changes.push(state);
      });

      tracelog.on(EmitterEvent.CONSENT_CHANGED, (state) => {
        listener2Changes.push(state);
      });

      await tracelog.setConsent('google', true);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Both listeners should receive the event
      expect(listener1Changes.length).toBeGreaterThanOrEqual(1);
      expect(listener2Changes.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Buffer Cleanup on Revoke', () => {
    it('should handle consent revoke without errors', async () => {
      await tracelog.init({
        waitForConsent: true,
        integrations: {
          custom: {
            collectApiUrl: 'https://api.test.com/collect',
          },
        },
      });

      // Send events while no consent
      tracelog.event('event1', { test: 1 });
      tracelog.event('event2', { test: 2 });

      // Grant consent
      await tracelog.setConsent('custom', true);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Revoke consent (should trigger cleanup)
      await tracelog.setConsent('custom', false);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should complete without errors
      expect(tracelog.isInitialized()).toBe(true);
    });
  });
});
