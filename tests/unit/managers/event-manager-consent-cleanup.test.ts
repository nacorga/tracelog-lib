import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EventManager } from '../../../src/managers/event.manager';
import { StorageManager } from '../../../src/managers/storage.manager';
import { ConsentManager } from '../../../src/managers/consent.manager';
import { setupTestState, cleanupTestState, createTestConfig } from '../../utils/test-setup';

describe('EventManager - clearConsentBufferForIntegration', () => {
  let eventManager: EventManager;
  let storageManager: StorageManager;
  let consentManager: ConsentManager;

  beforeEach(() => {
    storageManager = new StorageManager();
    storageManager.clear();
    consentManager = new ConsentManager(storageManager, false, null);

    setupTestState(
      createTestConfig({
        waitForConsent: true,
        integrations: {
          google: { measurementId: 'G-TEST' },
        },
      }),
    );
  });

  afterEach(() => {
    eventManager?.stop();
    consentManager?.cleanup();
    storageManager?.clear();
    cleanupTestState();
  });

  it('should not throw when buffer is empty', () => {
    eventManager = new EventManager(storageManager, null, consentManager, null);

    expect(() => {
      eventManager.clearConsentBufferForIntegration('google');
    }).not.toThrow();
  });

  it('should handle gracefully when called on empty buffer', () => {
    eventManager = new EventManager(storageManager, null, consentManager, null);

    const initialLength = eventManager.getConsentBufferLength();
    expect(initialLength).toBe(0);

    eventManager.clearConsentBufferForIntegration('google');

    const finalLength = eventManager.getConsentBufferLength();
    expect(finalLength).toBe(0);
  });

  it('should work for all integration types', () => {
    eventManager = new EventManager(storageManager, null, consentManager, null);

    // Should not throw for any integration type
    expect(() => {
      eventManager.clearConsentBufferForIntegration('google');
      eventManager.clearConsentBufferForIntegration('custom');
      eventManager.clearConsentBufferForIntegration('tracelog');
    }).not.toThrow();
  });
});
