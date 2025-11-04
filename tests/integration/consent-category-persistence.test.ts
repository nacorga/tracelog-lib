/**
 * Google Consent Mode v2 Category Persistence Integration Tests
 * Focus: Verify categories persist between sessions and page reloads
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initTestBridge, destroyTestBridge } from '../helpers/bridge.helper';
import { CONSENT_KEY } from '../../src/constants/storage.constants';

describe('Integration - Consent Category Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

    // Mock gtag
    window.gtag = vi.fn();
    window.dataLayer = [];
  });

  afterEach(() => {
    destroyTestBridge();
    delete window.gtag;
    delete window.dataLayer;
  });

  describe('Category persistence to localStorage', () => {
    it('should persist categories when setting consent', async () => {
      const bridge = await initTestBridge({
        integrations: {
          google: {
            measurementId: 'G-TEST123',
          },
        },
      });

      // Set consent with categories
      await bridge.setConsent('google', true, {
        analytics_storage: true,
        ad_storage: false,
        ad_user_data: false,
        ad_personalization: false,
        personalization_storage: true,
      });

      // Wait for debounced persistence (50ms debounce + buffer)
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check localStorage contains categories
      const storedConsent = localStorage.getItem(CONSENT_KEY);
      expect(storedConsent).not.toBeNull();

      const parsed = JSON.parse(storedConsent!);
      expect(parsed.categories).toBeDefined();
      expect(parsed.categories.google).toEqual({
        analytics_storage: true,
        ad_storage: false,
        ad_user_data: false,
        ad_personalization: false,
        personalization_storage: true,
      });
    });

    it('should persist "all" shorthand', async () => {
      const bridge = await initTestBridge({
        integrations: {
          google: {
            measurementId: 'G-TEST123',
          },
        },
      });

      await bridge.setConsent('google', true, 'all');

      // Wait for debounced persistence
      await new Promise((resolve) => setTimeout(resolve, 100));

      const storedConsent = localStorage.getItem(CONSENT_KEY);
      expect(storedConsent).not.toBeNull();

      const parsed = JSON.parse(storedConsent!);
      expect(parsed.categories).toBeDefined();
      expect(parsed.categories.google).toBe('all');
    });

    it('should update persisted categories when called multiple times', async () => {
      const bridge = await initTestBridge({
        integrations: {
          google: {
            measurementId: 'G-TEST123',
          },
        },
      });

      // First call
      await bridge.setConsent('google', true, {
        analytics_storage: true,
        ad_storage: false,
      });

      // Second call with different categories
      await bridge.setConsent('google', true, {
        analytics_storage: false,
        ad_storage: true,
        ad_user_data: true,
      });

      // Wait for debounced persistence
      await new Promise((resolve) => setTimeout(resolve, 100));

      const storedConsent = localStorage.getItem(CONSENT_KEY);
      const parsed = JSON.parse(storedConsent!);

      expect(parsed.categories.google).toEqual({
        analytics_storage: false,
        ad_storage: true,
        ad_user_data: true,
      });
    });
  });

  describe('Category restoration on init', () => {
    it('should restore categories from localStorage on init', async () => {
      // Pre-populate localStorage with consent + categories
      const consentData = {
        state: {
          google: true,
          custom: false,
          tracelog: false,
        },
        categories: {
          google: {
            analytics_storage: true,
            ad_storage: false,
            ad_user_data: false,
            ad_personalization: true,
          },
        },
        timestamp: Date.now(),
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
      };

      localStorage.setItem(CONSENT_KEY, JSON.stringify(consentData));

      // Initialize library
      const bridge = await initTestBridge({
        integrations: {
          google: {
            measurementId: 'G-TEST123',
          },
        },
      });

      // Check config has restored categories
      const config = bridge.getState().config;
      expect(config.integrations?.google?.consentCategories).toEqual({
        analytics_storage: true,
        ad_storage: false,
        ad_user_data: false,
        ad_personalization: true,
      });
    });

    it('should work without persisted categories (backward compatibility)', async () => {
      // Pre-populate localStorage with consent but NO categories
      const consentData = {
        state: {
          google: true,
          custom: false,
          tracelog: false,
        },
        timestamp: Date.now(),
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
      };

      localStorage.setItem(CONSENT_KEY, JSON.stringify(consentData));

      // Initialize library
      const bridge = await initTestBridge({
        integrations: {
          google: {
            measurementId: 'G-TEST123',
          },
        },
      });

      // Should initialize successfully without categories
      expect(bridge.initialized).toBe(true);

      // Config should not have categories
      const config = bridge.getState().config;
      expect(config.integrations?.google?.consentCategories).toBeUndefined();
    });

    it('should not apply categories if Google integration not configured', async () => {
      // Pre-populate with categories
      const consentData = {
        state: {
          google: true,
          custom: false,
          tracelog: false,
        },
        categories: {
          google: {
            analytics_storage: true,
          },
        },
        timestamp: Date.now(),
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
      };

      localStorage.setItem(CONSENT_KEY, JSON.stringify(consentData));

      // Initialize WITHOUT Google integration
      const bridge = await initTestBridge({
        integrations: {
          custom: {
            collectApiUrl: 'https://api.example.com',
          },
        },
      });

      // Categories should not be applied to non-existent Google config
      const config = bridge.getState().config;
      expect(config.integrations?.google).toBeUndefined();
    });
  });

  describe('Full session lifecycle', () => {
    it('should persist and restore categories across sessions', async () => {
      // Session 1: Set consent with categories
      const bridge1 = await initTestBridge({
        integrations: {
          google: {
            measurementId: 'G-TEST123',
          },
        },
      });

      await bridge1.setConsent('google', true, {
        analytics_storage: true,
        ad_storage: false,
        ad_user_data: true,
        ad_personalization: false,
      });

      // Wait for debounced persistence
      await new Promise((resolve) => setTimeout(resolve, 100));

      destroyTestBridge();

      // Session 2: Init fresh instance (simulate page reload)
      const bridge2 = await initTestBridge({
        integrations: {
          google: {
            measurementId: 'G-TEST123',
          },
        },
      });

      // Categories should be restored
      const config = bridge2.getState().config;
      expect(config.integrations?.google?.consentCategories).toEqual({
        analytics_storage: true,
        ad_storage: false,
        ad_user_data: true,
        ad_personalization: false,
      });

      // Should still be able to update
      await bridge2.setConsent('google', true, {
        analytics_storage: false,
      });

      const updatedConfig = bridge2.getState().config;
      expect(updatedConfig.integrations?.google?.consentCategories).toEqual({
        analytics_storage: false,
      });
    });

    it('should preserve categories when revoking consent', async () => {
      const bridge = await initTestBridge({
        integrations: {
          google: {
            measurementId: 'G-TEST123',
          },
        },
      });

      // Set consent with categories
      await bridge.setConsent('google', true, {
        analytics_storage: true,
        ad_storage: false,
      });

      // Wait for persistence
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Revoke consent (without categories parameter)
      await bridge.setConsent('google', false);

      // Wait for persistence
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Categories should still be persisted
      const storedConsent = localStorage.getItem(CONSENT_KEY);
      const parsed = JSON.parse(storedConsent!);
      expect(parsed.categories.google).toEqual({
        analytics_storage: true,
        ad_storage: false,
      });

      // Re-grant consent (without categories parameter)
      await bridge.setConsent('google', true);

      // Categories should be reused from persistence
      const config = bridge.getState().config;
      expect(config.integrations?.google?.consentCategories).toEqual({
        analytics_storage: true,
        ad_storage: false,
      });
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle corrupted categories in localStorage gracefully', async () => {
      // Pre-populate with invalid categories structure
      const consentData = {
        state: {
          google: true,
          custom: false,
          tracelog: false,
        },
        categories: 'invalid-string',
        timestamp: Date.now(),
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
      };

      localStorage.setItem(CONSENT_KEY, JSON.stringify(consentData));

      // Should initialize without throwing
      const bridge = await initTestBridge({
        integrations: {
          google: {
            measurementId: 'G-TEST123',
          },
        },
      });

      expect(bridge.initialized).toBe(true);
    });

    it('should ignore invalid category keys from localStorage', async () => {
      // Pre-populate with invalid category keys
      const consentData = {
        state: {
          google: true,
          custom: false,
          tracelog: false,
        },
        categories: {
          google: {
            analytics_storage: true,
            fake_category: true, // ← Invalid key
            another_invalid: false, // ← Invalid key
          },
        },
        timestamp: Date.now(),
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
      };

      localStorage.setItem(CONSENT_KEY, JSON.stringify(consentData));

      const bridge = await initTestBridge({
        integrations: {
          google: {
            measurementId: 'G-TEST123',
          },
        },
      });

      // Should initialize successfully
      expect(bridge.initialized).toBe(true);

      // Categories should NOT be restored (invalid structure)
      const config = bridge.getState().config;
      expect(config.integrations?.google?.consentCategories).toBeUndefined();
    });

    it('should ignore invalid category values from localStorage', async () => {
      // Pre-populate with invalid category values (non-boolean)
      const consentData = {
        state: {
          google: true,
          custom: false,
          tracelog: false,
        },
        categories: {
          google: {
            analytics_storage: 'true', // ← String instead of boolean
            ad_storage: 1, // ← Number instead of boolean
          },
        },
        timestamp: Date.now(),
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
      };

      localStorage.setItem(CONSENT_KEY, JSON.stringify(consentData));

      const bridge = await initTestBridge({
        integrations: {
          google: {
            measurementId: 'G-TEST123',
          },
        },
      });

      expect(bridge.initialized).toBe(true);

      // Categories should NOT be restored (invalid values)
      const config = bridge.getState().config;
      expect(config.integrations?.google?.consentCategories).toBeUndefined();
    });

    it('should accept "all" shorthand from localStorage', async () => {
      // Pre-populate with "all" shorthand
      const consentData = {
        state: {
          google: true,
          custom: false,
          tracelog: false,
        },
        categories: {
          google: 'all',
        },
        timestamp: Date.now(),
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
      };

      localStorage.setItem(CONSENT_KEY, JSON.stringify(consentData));

      const bridge = await initTestBridge({
        integrations: {
          google: {
            measurementId: 'G-TEST123',
          },
        },
      });

      expect(bridge.initialized).toBe(true);

      // "all" should be restored as valid
      const config = bridge.getState().config;
      expect(config.integrations?.google?.consentCategories).toBe('all');
    });

    it('should ignore categories if google is array', async () => {
      // Pre-populate with array instead of object
      const consentData = {
        state: {
          google: true,
          custom: false,
          tracelog: false,
        },
        categories: {
          google: ['analytics_storage', 'ad_storage'], // ← Array instead of object
        },
        timestamp: Date.now(),
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
      };

      localStorage.setItem(CONSENT_KEY, JSON.stringify(consentData));

      const bridge = await initTestBridge({
        integrations: {
          google: {
            measurementId: 'G-TEST123',
          },
        },
      });

      expect(bridge.initialized).toBe(true);

      // Array should be rejected
      const config = bridge.getState().config;
      expect(config.integrations?.google?.consentCategories).toBeUndefined();
    });

    it('should only persist categories for google integration', async () => {
      const bridge = await initTestBridge({
        integrations: {
          custom: {
            collectApiUrl: 'https://api.example.com',
          },
        },
      });

      // Try to set categories for custom integration (should be ignored)
      await bridge.setConsent('custom', true, {
        analytics_storage: true,
      });

      // Wait for persistence
      await new Promise((resolve) => setTimeout(resolve, 100));

      const storedConsent = localStorage.getItem(CONSENT_KEY);
      const parsed = JSON.parse(storedConsent!);

      // Should not have categories for custom
      expect(parsed.categories).toBeUndefined();
    });

    it('should handle expired consent data with categories', async () => {
      // Pre-populate with EXPIRED consent
      const consentData = {
        state: {
          google: true,
          custom: false,
          tracelog: false,
        },
        categories: {
          google: {
            analytics_storage: true,
          },
        },
        timestamp: Date.now() - 400 * 24 * 60 * 60 * 1000, // 400 days ago
        expiresAt: Date.now() - 35 * 24 * 60 * 60 * 1000, // Expired 35 days ago
      };

      localStorage.setItem(CONSENT_KEY, JSON.stringify(consentData));

      const bridge = await initTestBridge({
        integrations: {
          google: {
            measurementId: 'G-TEST123',
          },
        },
      });

      // Expired consent should not be loaded
      const consentState = bridge.getConsentState();
      expect(consentState.google).toBe(false);

      // Categories should also not be loaded
      const config = bridge.getState().config;
      expect(config.integrations?.google?.consentCategories).toBeUndefined();
    });
  });
});
