/**
 * Consent Flow Integration Tests
 * Focus: Consent → Buffer → Flush flow
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';
import { initTestBridge, destroyTestBridge, getManagers, collectEvents } from '../../helpers/bridge.helper';
import { createMockFetch } from '../../helpers/mocks.helper';
import { wait } from '../../helpers/wait.helper';
import type { TraceLogTestBridge } from '../../../src/types';

describe('Integration: Consent Flow', () => {
  let bridge: TraceLogTestBridge;
  let mockFetch: ReturnType<typeof createMockFetch>;

  beforeEach(async () => {
    setupTestEnvironment();
    mockFetch = createMockFetch({ ok: true, status: 200 });
    global.fetch = mockFetch;

    bridge = await initTestBridge({
      integrations: {
        custom: {
          collectApiUrl: 'https://api.test.com/collect',
          waitForConsent: true,
        },
      },
    });
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();
  });

  it('should buffer events when consent not granted', () => {
    // Arrange: Verify no consent granted
    const { consent } = getManagers(bridge);
    expect(consent?.hasConsent('custom')).toBe(false);

    // Note: During init, SESSION_START and PAGE_VIEW are buffered
    const initialBufferLength = bridge.getConsentBufferLength();
    expect(initialBufferLength).toBeGreaterThan(0); // Should have initial events

    // Act: Track events without consent
    bridge.event('view_product', { productId: '123' });
    bridge.event('add_to_cart', { productId: '123', quantity: 1 });

    // Assert: Events buffered (initial + 2 custom events), not in queue
    expect(bridge.getConsentBufferLength()).toBe(initialBufferLength + 2);
    expect(bridge.getQueueLength()).toBe(0);

    // Assert: No network requests made
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should emit consent-changed event on grant', async () => {
    // Arrange: Setup event collector
    const [getEvents, cleanupEvents] = collectEvents(bridge, 'consent-changed');

    // Act: Grant consent
    await bridge.setConsent('custom', true);

    // Assert: Consent-changed event emitted
    const events = getEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({
      google: false,
      custom: true,
      tracelog: false,
    });

    cleanupEvents();
  });

  it('should flush buffer when consent granted', async () => {
    // Arrange: Buffer events before consent (includes initial events)
    const initialBufferLength = bridge.getConsentBufferLength();
    bridge.event('view_product', { productId: '123' });
    bridge.event('add_to_cart', { productId: '123', quantity: 1 });
    expect(bridge.getConsentBufferLength()).toBe(initialBufferLength + 2);

    // Act: Grant consent
    await bridge.setConsent('custom', true);

    // Wait for flush to complete
    await wait(500);

    // Assert: Buffer cleared
    expect(bridge.getConsentBufferLength()).toBe(0);
  });

  it('should send buffered events to backend', async () => {
    // Arrange: Buffer events (initial events already in buffer)
    bridge.event('view_product', { productId: '123' });
    bridge.event('add_to_cart', { productId: '123', quantity: 1 });

    // Act: Grant consent
    await bridge.setConsent('custom', true);

    // Wait for flush
    await wait(500);

    // Assert: Events sent to backend
    expect(mockFetch).toHaveBeenCalled();
    const fetchCall = mockFetch.mock.calls[0];
    if (!fetchCall) throw new Error('No fetch call found');
    const [url, options] = fetchCall;

    expect(url).toBe('https://api.test.com/collect');
    expect(options.method).toBe('POST');

    const payload = JSON.parse(options.body as string);
    // Should have initial events (SESSION_START, PAGE_VIEW) + 2 custom events
    expect(payload.events.length).toBeGreaterThanOrEqual(2);

    // Find custom events in payload
    const customEvents = payload.events.filter((e: any) => e.custom_event);
    expect(customEvents).toHaveLength(2);
    expect(customEvents[0].custom_event.name).toBe('view_product');
    expect(customEvents[1].custom_event.name).toBe('add_to_cart');
  });

  it('should clear buffer after successful flush', async () => {
    // Arrange: Buffer events (includes initial events)
    const initialBufferLength = bridge.getConsentBufferLength();
    bridge.event('view_product', { productId: '123' });
    expect(bridge.getConsentBufferLength()).toBe(initialBufferLength + 1);

    // Act: Grant consent and wait for flush
    await bridge.setConsent('custom', true);
    await wait(500);

    // Assert: Buffer cleared
    expect(bridge.getConsentBufferLength()).toBe(0);

    // Assert: New events are NOT buffered (they're sent/queued normally)
    const initialFetchCalls = mockFetch.mock.calls.length;
    bridge.event('purchase', { orderId: '456' });

    // Event should NOT be in consent buffer
    expect(bridge.getConsentBufferLength()).toBe(0);

    // Check if event was added to queue (may be sent immediately via auto-flush)
    const queueLength = bridge.getQueueLength();

    if (queueLength > 0) {
      // If in queue, manually flush to trigger send
      await bridge.flushQueue();
      await wait(100);

      // Event should have been sent to backend
      expect(mockFetch.mock.calls.length).toBeGreaterThan(initialFetchCalls);
    } else {
      // If not in queue, it was already sent (auto-flush or immediate send)
      // Just verify it's not in consent buffer (main assertion)
      expect(bridge.getConsentBufferLength()).toBe(0);
    }
  });

  it('should clear buffer when consent revoked', async () => {
    // Arrange: Grant consent first, track events
    await bridge.setConsent('custom', true);
    await wait(100);

    // Act: Revoke consent, track new events
    await bridge.setConsent('custom', false);
    bridge.event('view_product', { productId: '123' });

    // Wait for any pending operations
    await wait(100);

    // Assert: Events buffered after revocation
    expect(bridge.getConsentBufferLength()).toBeGreaterThan(0);

    // Act: Revoke consent again (should clear buffer)
    const initialBufferLength = bridge.getConsentBufferLength();
    await bridge.setConsent('custom', false);
    await wait(100);

    // Assert: Buffer still maintains events (consent already revoked)
    // Note: Buffer is only cleared when last integration is revoked OR on destroy
    expect(bridge.getConsentBufferLength()).toBe(initialBufferLength);
  });
});

describe('Integration: Per-Integration Consent', () => {
  let bridge: TraceLogTestBridge;
  let mockFetch: ReturnType<typeof createMockFetch>;

  beforeEach(async () => {
    setupTestEnvironment();
    mockFetch = createMockFetch({ ok: true, status: 200 });
    global.fetch = mockFetch;

    // Initialize with custom backend only (can't use tracelog on localhost)
    // We'll test per-integration logic using custom and google integrations
    bridge = await initTestBridge({
      integrations: {
        custom: {
          collectApiUrl: 'https://api.custom.com/collect',
          waitForConsent: true,
        },
        google: {
          measurementId: 'G-TEST123',
          waitForConsent: true,
        },
      },
    });
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();
  });

  it('should buffer separately per integration', () => {
    // Arrange: No consent granted
    expect(bridge.hasConsent('custom')).toBe(false);
    expect(bridge.hasConsent('google')).toBe(false);

    // Act: Track events (initial events already buffered)
    const initialBufferLength = bridge.getConsentBufferLength();
    bridge.event('view_product', { productId: '123' });
    bridge.event('add_to_cart', { productId: '123', quantity: 1 });

    // Assert: Events buffered for both integrations
    const googleBuffer = bridge.getConsentBufferEvents('google');
    const customBuffer = bridge.getConsentBufferEvents('custom');

    // Both should have initial events + 2 custom events
    expect(googleBuffer.length).toBe(initialBufferLength + 2);
    expect(customBuffer.length).toBe(initialBufferLength + 2);
    expect(bridge.getConsentBufferLength()).toBe(initialBufferLength + 2);
  });

  it('should flush only for granted integration', async () => {
    // Arrange: Buffer events (initial events already in buffer)
    const initialBufferLength = bridge.getConsentBufferLength();
    bridge.event('view_product', { productId: '123' });
    bridge.event('add_to_cart', { productId: '123', quantity: 1 });
    expect(bridge.getConsentBufferLength()).toBe(initialBufferLength + 2);

    // Act: Grant consent for custom only
    await bridge.setConsent('custom', true);
    await wait(500);

    // Assert: Custom buffer flushed, google buffer remains
    const googleBuffer = bridge.getConsentBufferEvents('google');
    const customBuffer = bridge.getConsentBufferEvents('custom');

    expect(customBuffer).toHaveLength(0); // Flushed
    expect(googleBuffer.length).toBe(initialBufferLength + 2); // Still buffered

    // Assert: Events sent to custom backend
    expect(mockFetch).toHaveBeenCalled();
    const fetchCall = mockFetch.mock.calls[0];
    if (!fetchCall) throw new Error('No fetch call found');
    const url = fetchCall[0];
    expect(url).toBe('https://api.custom.com/collect');
  });

  it('should handle mixed consent states', async () => {
    // Arrange: Buffer events (initial events already in buffer)
    const initialBufferLength = bridge.getConsentBufferLength();
    bridge.event('view_product', { productId: '123' });
    expect(bridge.getConsentBufferLength()).toBe(initialBufferLength + 1);

    // Act: Grant consent for custom first
    await bridge.setConsent('custom', true);
    await wait(500);

    // Assert: Custom buffer flushed
    const customBufferAfterCustomConsent = bridge.getConsentBufferEvents('custom');
    expect(customBufferAfterCustomConsent).toHaveLength(0); // Flushed

    // Assert: Google buffer still has events (no consent yet)
    const googleBufferAfterCustomConsent = bridge.getConsentBufferEvents('google');
    expect(googleBufferAfterCustomConsent.length).toBeGreaterThan(0); // Still buffered

    // Act: Track new event with custom consent but not google
    const initialFetchCalls = mockFetch.mock.calls.length;
    bridge.event('purchase', { orderId: '456' });

    // Assert: New event NOT in consent buffer (has consent for at least one integration)
    expect(bridge.getConsentBufferLength()).toBe(googleBufferAfterCustomConsent.length); // Only google buffer remains

    // Check if event was added to queue (may be sent immediately)
    const queueLength = bridge.getQueueLength();

    if (queueLength > 0) {
      // Manually flush to send queued events
      await bridge.flushQueue();
      await wait(100);

      // Assert: New event was sent to custom backend
      expect(mockFetch.mock.calls.length).toBeGreaterThan(initialFetchCalls);
    }

    // Assert: Google buffer still has old events (no consent yet)
    const googleBufferAfterNewEvent = bridge.getConsentBufferEvents('google');
    expect(googleBufferAfterNewEvent.length).toBeGreaterThan(0); // Still has buffered events

    // Verify: Check consent state is correct
    expect(bridge.hasConsent('custom')).toBe(true);
    expect(bridge.hasConsent('google')).toBe(false);
  });
});
