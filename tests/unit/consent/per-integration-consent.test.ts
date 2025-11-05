/**
 * Per-Integration Consent Tests
 * Focus: Testing per-integration waitForConsent configuration and fallback logic
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';
import { createMockConfig } from '../../helpers/fixtures.helper';
import { initTestBridge, destroyTestBridge, getConsentBufferState } from '../../helpers/bridge.helper';

describe('Per-Integration Consent', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();
  });

  describe('Config Resolution - Per-Integration waitForConsent', () => {
    it('should not buffer when custom integration does not require consent', async () => {
      const config = createMockConfig({
        integrations: {
          custom: {
            collectApiUrl: 'https://api.custom.com/collect',
            waitForConsent: false, // Custom doesn't need consent
          },
        },
      });

      const bridge = await initTestBridge(config);

      expect(bridge.initialized).toBe(true);

      // Since custom doesn't require consent and it's the only integration,
      // events should NOT be buffered
      bridge.event('test_event', { data: 'test' });

      const bufferState = getConsentBufferState(bridge, 'custom');

      // Events should NOT be buffered because custom integration doesn't require consent
      expect(bufferState.length).toBe(0);
    });

    it('should respect per-integration waitForConsent for Google (with custom backend)', async () => {
      const config = createMockConfig({
        integrations: {
          custom: {
            collectApiUrl: 'https://api.custom.com/collect',
            waitForConsent: false, // Custom doesn't need consent
          },
          google: {
            measurementId: 'G-TEST123',
            waitForConsent: true, // Google requires consent (but handled by GA integration, not buffer)
          },
        },
      });

      const bridge = await initTestBridge(config);

      expect(bridge.initialized).toBe(true);

      bridge.event('test_event', { data: 'test' });

      const bufferState = getConsentBufferState(bridge, 'custom');

      // Note: Google Analytics consent is handled by GoogleAnalyticsIntegration, not the consent buffer
      // Events should NOT be buffered because custom backend doesn't require consent
      // Google Analytics integration handles its own consent separately
      expect(bufferState.length).toBe(0);
    });
  });

  describe('Mixed Consent Requirements', () => {
    it('should NOT buffer when only Google requires consent (custom immediate)', async () => {
      const config = createMockConfig({
        integrations: {
          custom: {
            collectApiUrl: 'https://api.custom.com/collect',
            waitForConsent: false, // Custom doesn't need consent
          },
          google: {
            measurementId: 'G-TEST123',
            waitForConsent: true, // Google requires consent (but handled by GA integration)
          },
        },
      });

      const bridge = await initTestBridge(config);

      expect(bridge.initialized).toBe(true);

      bridge.event('test_event', { data: 'test' });

      const bufferState = getConsentBufferState(bridge, 'custom');

      // Events should NOT be buffered - custom backend doesn't require consent
      // Google Analytics consent is handled separately by GoogleAnalyticsIntegration
      expect(bufferState.length).toBe(0);
    });

    it('should not buffer when no integration requires consent', async () => {
      const config = createMockConfig({
        integrations: {
          custom: {
            collectApiUrl: 'https://api.custom.com/collect',
            waitForConsent: false,
          },
          google: {
            measurementId: 'G-TEST123',
            waitForConsent: false,
          },
        },
      });

      const bridge = await initTestBridge(config);

      expect(bridge.initialized).toBe(true);

      bridge.event('test_event', { data: 'test' });

      const bufferState = getConsentBufferState(bridge, 'custom');

      // Events should NOT be buffered because no integration requires consent
      expect(bufferState.length).toBe(0);
    });

    it('should send to custom immediately regardless of Google consent', async () => {
      const config = createMockConfig({
        integrations: {
          custom: {
            collectApiUrl: 'https://api.custom.com/collect',
            waitForConsent: false, // Custom doesn't need consent
          },
          google: {
            measurementId: 'G-TEST123',
            waitForConsent: true, // Google requires consent
          },
        },
      });

      const bridge = await initTestBridge(config);

      expect(bridge.initialized).toBe(true);

      // Track event before Google consent
      bridge.event('test_event', { data: 'before_consent' });

      const bufferState = getConsentBufferState(bridge, 'custom');

      // Events should NOT be buffered for custom backend
      // Custom backend doesn't require consent, so events go directly to queue
      expect(bufferState.length).toBe(0);

      // Grant consent to Google
      await bridge.setConsent('google', true);

      // Verify consent state changed
      const consentState = bridge.getConsentState();
      expect(consentState.google).toBe(true);
    });
  });

  describe('Default Behavior', () => {
    it('should not buffer when no waitForConsent config specified (defaults to false)', async () => {
      const config = createMockConfig({
        integrations: {
          custom: {
            collectApiUrl: 'https://api.custom.com/collect',
          },
        },
      });

      const bridge = await initTestBridge(config);

      expect(bridge.initialized).toBe(true);

      bridge.event('test_event', { data: 'test' });

      const bufferState = getConsentBufferState(bridge, 'custom');

      // Events should NOT be buffered (default is false)
      expect(bufferState.length).toBe(0);
    });
  });
});
