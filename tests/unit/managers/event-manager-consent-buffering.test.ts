import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EventManager } from '../../../src/managers/event.manager';
import { StorageManager } from '../../../src/managers/storage.manager';
import { ConsentManager } from '../../../src/managers/consent.manager';
import { EventType } from '../../../src/types';
import { setupTestState, cleanupTestState, createTestConfig } from '../../utils/test-setup';

describe('EventManager - Consent Buffering', () => {
  let eventManager: EventManager;
  let storageManager: StorageManager;
  let consentManager: ConsentManager;

  beforeEach(() => {
    storageManager = new StorageManager();
    storageManager.clear();
    consentManager = new ConsentManager(storageManager, false, null);

    // Setup test state with waitForConsent enabled
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

  it('should buffer events in consentEventsBuffer when waitForConsent and no consent', () => {
    eventManager = new EventManager(storageManager, null, consentManager, null);

    const initialBufferLength = eventManager.getConsentBufferLength();
    expect(initialBufferLength).toBe(0);

    // Track an event
    eventManager.track({
      type: EventType.CUSTOM,
      custom_event: { name: 'test_event', metadata: { test: true } },
    });

    // Should be in consent buffer
    const bufferLength = eventManager.getConsentBufferLength();
    expect(bufferLength).toBe(1);
  });

  it('should NOT buffer events when consent is granted', () => {
    // Grant consent before creating event manager
    consentManager.setConsent('google', true);

    eventManager = new EventManager(storageManager, null, consentManager, null);

    eventManager.track({
      type: EventType.CUSTOM,
      custom_event: { name: 'test_event', metadata: { test: true } },
    });

    // Should NOT be in consent buffer (should go to normal queue)
    const bufferLength = eventManager.getConsentBufferLength();
    expect(bufferLength).toBe(0);
  });

  it('should send to normal queue when waitForConsent is disabled', () => {
    cleanupTestState();
    setupTestState(
      createTestConfig({
        waitForConsent: false, // Disabled
        integrations: {
          google: { measurementId: 'G-TEST' },
        },
      }),
    );

    eventManager = new EventManager(storageManager, null, consentManager, null);

    eventManager.track({
      type: EventType.CUSTOM,
      custom_event: { name: 'test_event', metadata: { test: true } },
    });

    // Should NOT be in consent buffer
    const bufferLength = eventManager.getConsentBufferLength();
    expect(bufferLength).toBe(0);
  });

  it('should emit events locally even when buffered for consent', () => {
    const emittedEvents: any[] = [];

    const emitter = {
      emit: (event: string, data: any) => {
        if (event === 'event') {
          emittedEvents.push(data);
        }
      },
      on: () => {},
      off: () => {},
    };

    eventManager = new EventManager(storageManager, null, consentManager, emitter as any, {});

    eventManager.track({
      type: EventType.CUSTOM,
      custom_event: { name: 'test_event', metadata: { test: true } },
    });

    // Should be buffered
    expect(eventManager.getConsentBufferLength()).toBe(1);

    // Should also be emitted locally
    expect(emittedEvents.length).toBe(1);
    expect(emittedEvents[0].type).toBe(EventType.CUSTOM);
  });

  it('should NOT buffer when at least ONE integration has consent', () => {
    // Grant consent for one integration first
    consentManager.setConsent('google', true);

    eventManager = new EventManager(storageManager, null, consentManager, null);

    eventManager.track({
      type: EventType.CUSTOM,
      custom_event: { name: 'test_event' },
    });

    // Should NOT buffer
    expect(eventManager.getConsentBufferLength()).toBe(0);
  });
});
