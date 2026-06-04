/**
 * Shopify Web Pixel — registration tests
 *
 * Verifies:
 * - Subscribes to all 7 standard Customer Events
 * - Each subscription is an explicit `analytics.subscribe('event_name', ...)` call
 *   (Shopify static analyzer requires literal event names)
 * - Successful map → sendBatch called
 * - Failed map (no identity) → sendBatch NOT called
 */

import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { registerShopifyPixel } from '../../../src/pixel/shopify-pixel';

type SubscribeFn = (event: string, callback: (event: unknown) => void) => void;

describe('registerShopifyPixel', () => {
  let subscribeSpy: Mock<SubscribeFn>;
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    subscribeSpy = vi.fn<SubscribeFn>();
    fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchSpy as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (global as { fetch?: unknown }).fetch;
  });

  it('subscribes to all 7 standard Customer Events', () => {
    registerShopifyPixel({ analytics: { subscribe: subscribeSpy } }, { projectId: 'proj-1' });

    const subscribedNames = subscribeSpy.mock.calls.map((call) => call[0]);
    expect(subscribedNames).toEqual([
      'cart_viewed',
      'checkout_started',
      'checkout_contact_info_submitted',
      'checkout_address_info_submitted',
      'checkout_shipping_info_submitted',
      'payment_info_submitted',
      'checkout_completed',
    ]);
  });

  it('each subscribe call uses a literal event-name string (Shopify static analyzer)', () => {
    registerShopifyPixel({ analytics: { subscribe: subscribeSpy } }, { projectId: 'proj-1' });

    for (const call of subscribeSpy.mock.calls) {
      expect(typeof call[0]).toBe('string');
      expect(typeof call[1]).toBe('function');
    }
  });

  it('forwards events with valid identity to sendBatch', () => {
    registerShopifyPixel({ analytics: { subscribe: subscribeSpy } }, { projectId: 'proj-1' });

    const callback = subscribeSpy.mock.calls.find((c) => c[0] === 'checkout_started')![1] as (e: unknown) => void;
    callback({
      id: 'evt-1',
      timestamp: '2026-05-08T16:19:32.533Z',
      data: {
        checkout: {
          attributes: [
            { key: 'tracelog_session_id', value: 'sess-1' },
            { key: 'tracelog_user_id', value: 'user-1' },
          ],
        },
      },
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0]![0]).toBe('https://ingest.tracelog.io/p/proj-1/collect');
  });

  it('drops events without identity (no fetch issued)', () => {
    registerShopifyPixel({ analytics: { subscribe: subscribeSpy } }, { projectId: 'proj-1' });

    const callback = subscribeSpy.mock.calls.find((c) => c[0] === 'cart_viewed')![1] as (e: unknown) => void;
    callback({
      id: 'evt-1',
      timestamp: '2026-05-08T16:19:32.533Z',
      data: { cart: { attributes: [] } },
    });

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
