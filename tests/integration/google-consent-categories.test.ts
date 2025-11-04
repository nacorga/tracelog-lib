/**
 * Google Consent Mode v2 Categories Integration Tests
 * Focus: Verify dynamic consent categories configuration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initTestBridge, destroyTestBridge } from '../helpers/bridge.helper';

describe('Integration - Google Consent Categories', () => {
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

  describe('setConsent() with categories parameter', () => {
    it('should update consent categories in config state', async () => {
      const bridge = await initTestBridge({
        integrations: {
          google: {
            measurementId: 'G-TEST123',
          },
        },
      });

      // Set consent with granular categories
      await bridge.setConsent('google', true, {
        analytics_storage: true,
        ad_storage: false,
        ad_user_data: false,
        ad_personalization: false,
      });

      // Check config state
      const config = bridge.getState().config;
      expect(config.integrations?.google?.consentCategories).toEqual({
        analytics_storage: true,
        ad_storage: false,
        ad_user_data: false,
        ad_personalization: false,
      });
    });

    it('should accept "all" as categories value', async () => {
      const bridge = await initTestBridge({
        integrations: {
          google: {
            measurementId: 'G-TEST123',
          },
        },
      });

      await bridge.setConsent('google', true, 'all');

      const config = bridge.getState().config;
      expect(config.integrations?.google?.consentCategories).toBe('all');
    });

    it('should validate categories parameter', async () => {
      const bridge = await initTestBridge({
        integrations: {
          google: {
            measurementId: 'G-TEST123',
          },
        },
      });

      // Invalid categories should throw
      await expect(bridge.setConsent('google', true, { invalid_key: true } as any)).rejects.toThrow(
        /Invalid googleConsentCategories/,
      );

      await expect(bridge.setConsent('google', true, { analytics_storage: 'yes' } as any)).rejects.toThrow(
        /Invalid googleConsentCategories/,
      );

      await expect(bridge.setConsent('google', true, null as any)).rejects.toThrow(/Invalid googleConsentCategories/);
    });

    it('should ignore categories provided for non-google integration', async () => {
      const bridge = await initTestBridge({
        integrations: {
          custom: {
            collectApiUrl: 'https://api.example.com',
          },
        },
      });

      // Should not throw, just ignore the parameter
      await expect(bridge.setConsent('custom', true, { analytics_storage: true } as any)).resolves.not.toThrow();

      // Consent should still be granted
      expect(bridge.hasConsent('custom')).toBe(true);
    });

    it('should persist categories across consent revoke/re-grant', async () => {
      const bridge = await initTestBridge({
        integrations: {
          google: {
            measurementId: 'G-TEST123',
          },
        },
      });

      // Grant with categories
      await bridge.setConsent('google', true, {
        analytics_storage: true,
        ad_storage: false,
      });

      // Revoke
      await bridge.setConsent('google', false);

      // Check categories still in config
      let config = bridge.getState().config;
      expect(config.integrations?.google?.consentCategories).toEqual({
        analytics_storage: true,
        ad_storage: false,
      });

      // Re-grant without providing categories
      await bridge.setConsent('google', true);

      // Categories should still be there
      config = bridge.getState().config;
      expect(config.integrations?.google?.consentCategories).toEqual({
        analytics_storage: true,
        ad_storage: false,
      });
    });

    it('should update categories on subsequent calls', async () => {
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
        analytics_storage: true,
        ad_storage: true,
        ad_personalization: true,
      });

      const config = bridge.getState().config;
      expect(config.integrations?.google?.consentCategories).toEqual({
        analytics_storage: true,
        ad_storage: true,
        ad_personalization: true,
      });
    });

    it('should handle categories set before first consent grant', async () => {
      const bridge = await initTestBridge({
        waitForConsent: true,
        integrations: {
          google: {
            measurementId: 'G-TEST123',
          },
        },
      });

      // Categories provided on first consent grant
      await bridge.setConsent('google', true, {
        analytics_storage: true,
        ad_storage: false,
      });

      const config = bridge.getState().config;
      expect(config.integrations?.google?.consentCategories).toEqual({
        analytics_storage: true,
        ad_storage: false,
      });

      // Consent should be granted
      expect(bridge.hasConsent('google')).toBe(true);
    });
  });

  describe('Integration with waitForConsent', () => {
    it('should set default consent to denied when waitForConsent enabled', async () => {
      await initTestBridge({
        waitForConsent: true,
        integrations: {
          google: {
            measurementId: 'G-TEST123',
          },
        },
      });

      // Check if gtag was called with default consent
      expect(window.gtag).toHaveBeenCalledWith('consent', 'default', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        personalization_storage: 'denied',
      });
    });

    it('should store categories in config when consent granted', async () => {
      const bridge = await initTestBridge({
        waitForConsent: true,
        integrations: {
          google: {
            measurementId: 'G-TEST123',
          },
        },
      });

      // Grant consent with granular categories
      await bridge.setConsent('google', true, {
        analytics_storage: true,
        ad_storage: false,
        ad_user_data: false,
        ad_personalization: false,
      });

      // Verify categories are stored in config
      const config = bridge.getState().config;
      expect(config.integrations?.google?.consentCategories).toEqual({
        analytics_storage: true,
        ad_storage: false,
        ad_user_data: false,
        ad_personalization: false,
      });

      // Verify consent is granted
      expect(bridge.hasConsent('google')).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle categories when Google integration not configured', async () => {
      const bridge = await initTestBridge();

      // Should not throw but log warning
      await expect(bridge.setConsent('google', true, { analytics_storage: true })).resolves.not.toThrow();
    });

    it('should handle empty categories object', async () => {
      const bridge = await initTestBridge({
        integrations: {
          google: {
            measurementId: 'G-TEST123',
          },
        },
      });

      await bridge.setConsent('google', true, {});

      const config = bridge.getState().config;
      expect(config.integrations?.google?.consentCategories).toEqual({});
    });

    it('should handle partial categories (not all 5 specified)', async () => {
      const bridge = await initTestBridge({
        integrations: {
          google: {
            measurementId: 'G-TEST123',
          },
        },
      });

      await bridge.setConsent('google', true, {
        analytics_storage: true,
      });

      const config = bridge.getState().config;
      expect(config.integrations?.google?.consentCategories).toEqual({
        analytics_storage: true,
      });
    });
  });
});
