/**
 * Shopify Web Pixel — event-mapper tests
 *
 * Spike-driven coverage:
 * - Array-shape attribute lookup (NOT object access)
 * - ISO 8601 timestamp parsing (NOT epoch number)
 * - `event.id` suffix preservation (slice -6, not 0..6)
 * - Stitching metadata (shopify_client_id, checkout_token)
 * - Drop-on-no-identity behavior
 *
 * Reference payloads mirror Shopify Web Pixel runtime events.
 */

import { describe, it, expect } from 'vitest';
import { mapEventToBody } from '../../../src/pixel/event-mapper';

const SESSION_ATTR = { key: 'tracelog_session_id', value: 'sess-1', __typename: 'NoteAttribute' };
const USER_ATTR = { key: 'tracelog_user_id', value: 'user-1', __typename: 'NoteAttribute' };

describe('mapEventToBody — identity resolution (array-lookup)', () => {
  it('extracts session_id + user_id from checkout.attributes Array<{key,value}>', () => {
    const body = mapEventToBody(
      {
        id: 'evt-1',
        timestamp: '2026-05-08T16:19:32.533Z',
        clientId: 'cid-1',
        data: {
          checkout: {
            attributes: [SESSION_ATTR, USER_ATTR],
          },
        },
      },
      'checkout_started',
    );

    expect(body).not.toBeNull();
    expect(body!.session_id).toBe('sess-1');
    expect(body!.user_id).toBe('user-1');
  });

  it('extracts identity from cart.attributes when checkout missing (cart_viewed)', () => {
    const body = mapEventToBody(
      {
        id: 'evt-1',
        timestamp: '2026-05-08T16:19:32.533Z',
        data: {
          cart: {
            attributes: [SESSION_ATTR, USER_ATTR],
          },
        },
      },
      'cart_viewed',
    );

    expect(body).not.toBeNull();
    expect(body!.session_id).toBe('sess-1');
    expect(body!.user_id).toBe('user-1');
  });

  it('handles attributes with __typename: NoteAttribute (checkout_completed shape)', () => {
    const body = mapEventToBody(
      {
        id: 'evt-1',
        timestamp: '2026-05-08T16:21:37.519Z',
        data: {
          checkout: {
            token: 'tok-1',
            attributes: [
              { key: 'tracelog_session_id', value: 'sess-2', __typename: 'NoteAttribute' },
              { key: 'tracelog_user_id', value: 'user-2', __typename: 'NoteAttribute' },
            ],
          },
        },
      },
      'checkout_completed',
    );

    expect(body!.session_id).toBe('sess-2');
    expect(body!.user_id).toBe('user-2');
  });

  it('returns null when identity attributes are missing', () => {
    const body = mapEventToBody(
      {
        id: 'evt-1',
        timestamp: '2026-05-08T16:19:32.533Z',
        data: {
          checkout: { attributes: [{ key: 'unrelated', value: 'x' }] },
        },
      },
      'checkout_started',
    );

    expect(body).toBeNull();
  });

  it('returns null when session_id is missing, user_id is missing, AND no clientId fallback', () => {
    const body = mapEventToBody(
      {
        id: 'evt-1',
        timestamp: '2026-05-08T16:19:32.533Z',
        data: { checkout: { attributes: [SESSION_ATTR] } },
      },
      'checkout_started',
    );

    expect(body).toBeNull();
  });

  it('falls back to shopifyEvent.clientId when tracelog_user_id is missing (legacy storefront)', () => {
    const body = mapEventToBody(
      {
        id: 'evt-1',
        timestamp: '2026-05-08T16:19:32.533Z',
        clientId: 'shopify-visitor-abc-123',
        data: { checkout: { attributes: [SESSION_ATTR] } },
      },
      'checkout_started',
    );

    expect(body).not.toBeNull();
    expect(body!.session_id).toBe('sess-1');
    expect(body!.user_id).toBe('shopify-visitor-abc-123');
  });

  it('prefers tracelog_user_id over clientId when both are set', () => {
    const body = mapEventToBody(
      {
        id: 'evt-1',
        timestamp: '2026-05-08T16:19:32.533Z',
        clientId: 'shopify-visitor-fallback',
        data: { checkout: { attributes: [SESSION_ATTR, USER_ATTR] } },
      },
      'checkout_started',
    );

    expect(body!.user_id).toBe('user-1');
  });

  it('returns null when tracelog_session_id is missing even if clientId is set (session is hard-required)', () => {
    const body = mapEventToBody(
      {
        id: 'evt-1',
        timestamp: '2026-05-08T16:19:32.533Z',
        clientId: 'shopify-visitor-abc-123',
        data: { checkout: { attributes: [{ key: 'unrelated', value: 'x' }] } },
      },
      'checkout_started',
    );

    expect(body).toBeNull();
  });

  it('falls back to clientId from cart.attributes path (cart_viewed legacy)', () => {
    const body = mapEventToBody(
      {
        id: 'evt-1',
        timestamp: '2026-05-08T16:19:32.533Z',
        clientId: 'shopify-cart-visitor',
        data: { cart: { attributes: [SESSION_ATTR] } },
      },
      'cart_viewed',
    );

    expect(body).not.toBeNull();
    expect(body!.user_id).toBe('shopify-cart-visitor');
  });

  it('returns null when attributes is mistakenly an object (no array-iteration)', () => {
    const body = mapEventToBody(
      {
        id: 'evt-1',
        timestamp: '2026-05-08T16:19:32.533Z',
        data: {
          checkout: {
            // Bug shape: object instead of array — must not match
            attributes: { tracelog_session_id: 'x', tracelog_user_id: 'y' } as any,
          },
        },
      },
      'checkout_started',
    );

    expect(body).toBeNull();
  });

  it('returns null on null/undefined event payload', () => {
    expect(mapEventToBody(null, 'cart_viewed')).toBeNull();
    expect(mapEventToBody(undefined, 'cart_viewed')).toBeNull();
  });
});

describe('mapEventToBody — timestamp parsing', () => {
  it('parses ISO 8601 string to epoch ms', () => {
    const body = mapEventToBody(
      {
        id: 'evt-1',
        timestamp: '2026-05-08T16:19:32.533Z',
        data: { checkout: { attributes: [SESSION_ATTR, USER_ATTR] } },
      },
      'checkout_started',
    )!;

    expect(body.events[0]!.timestamp).toBe(Date.parse('2026-05-08T16:19:32.533Z'));
    expect(Number.isNaN(body.events[0]!.timestamp)).toBe(false);
  });

  it('falls back to Date.now() when timestamp is missing', () => {
    const before = Date.now();
    const body = mapEventToBody(
      {
        id: 'evt-1',
        data: { checkout: { attributes: [SESSION_ATTR, USER_ATTR] } },
      },
      'checkout_started',
    )!;
    const after = Date.now();

    expect(body.events[0]!.timestamp).toBeGreaterThanOrEqual(before);
    expect(body.events[0]!.timestamp).toBeLessThanOrEqual(after);
  });

  it('falls back to Date.now() when timestamp is unparseable', () => {
    const before = Date.now();
    const body = mapEventToBody(
      {
        id: 'evt-1',
        timestamp: 'not-a-date',
        data: { checkout: { attributes: [SESSION_ATTR, USER_ATTR] } },
      },
      'checkout_started',
    )!;
    const after = Date.now();

    expect(body.events[0]!.timestamp).toBeGreaterThanOrEqual(before);
    expect(body.events[0]!.timestamp).toBeLessThanOrEqual(after);
  });
});

describe('mapEventToBody — event ID generation', () => {
  it('uses last 6 chars of event.id as suffix (handles `shu-` prefix)', () => {
    const body = mapEventToBody(
      {
        id: 'shu-abcdef-12345-tail99',
        timestamp: '2026-05-08T16:19:32.533Z',
        data: { checkout: { attributes: [SESSION_ATTR, USER_ATTR] } },
      },
      'checkout_started',
    )!;

    expect(body.events[0]!.id).toMatch(/-001-tail99$/);
  });

  it('uses last 6 chars of bare UUID (handles `checkout_completed` shape)', () => {
    const body = mapEventToBody(
      {
        id: '5143ddb0-706f-4227-b240-f62f25a31a7e',
        timestamp: '2026-05-08T16:21:37.519Z',
        data: { checkout: { attributes: [SESSION_ATTR, USER_ATTR] } },
      },
      'checkout_completed',
    )!;

    expect(body.events[0]!.id).toMatch(/-001-a31a7e$/);
  });

  it('falls back to random suffix when event.id is missing', () => {
    const body = mapEventToBody(
      {
        timestamp: '2026-05-08T16:19:32.533Z',
        data: { checkout: { attributes: [SESSION_ATTR, USER_ATTR] } },
      },
      'checkout_started',
    )!;

    expect(body.events[0]!.id).toMatch(/^\d+-001-[a-z0-9]+$/);
  });
});

describe('mapEventToBody — stitching metadata', () => {
  it('captures shopify_client_id (clientId) on every event', () => {
    const body = mapEventToBody(
      {
        id: 'evt-1',
        timestamp: '2026-05-08T16:19:32.533Z',
        clientId: 'f710986a-479a-4bf2-999e-9ca3e4e1026c',
        data: { cart: { attributes: [SESSION_ATTR, USER_ATTR] } },
      },
      'cart_viewed',
    )!;

    expect(body.events[0]!.custom_event.metadata.shopify_client_id).toBe('f710986a-479a-4bf2-999e-9ca3e4e1026c');
  });

  it('captures checkout_token on checkout_* events', () => {
    const body = mapEventToBody(
      {
        id: 'evt-1',
        timestamp: '2026-05-08T16:19:32.533Z',
        data: {
          checkout: {
            token: '890690d206263a8f8a170cdc6f50caa2',
            attributes: [SESSION_ATTR, USER_ATTR],
          },
        },
      },
      'checkout_started',
    )!;

    expect(body.events[0]!.custom_event.metadata.checkout_token).toBe('890690d206263a8f8a170cdc6f50caa2');
  });

  it('omits checkout_token on cart_viewed (no checkout context yet)', () => {
    const body = mapEventToBody(
      {
        id: 'evt-1',
        timestamp: '2026-05-08T16:19:32.533Z',
        data: { cart: { attributes: [SESSION_ATTR, USER_ATTR] } },
      },
      'cart_viewed',
    )!;

    expect(body.events[0]!.custom_event.metadata).not.toHaveProperty('checkout_token');
  });
});

describe('mapEventToBody — per-event metadata', () => {
  it('checkout_completed: emits value, currency, orderId, items', () => {
    const body = mapEventToBody(
      {
        id: '5143ddb0-706f-4227-b240-f62f25a31a7e',
        timestamp: '2026-05-08T16:21:37.519Z',
        data: {
          checkout: {
            token: 'tok-1',
            currencyCode: 'USD',
            attributes: [SESSION_ATTR, USER_ATTR],
            totalPrice: { amount: 1229.95, currencyCode: 'USD' },
            order: { id: '6692100538456' },
            lineItems: [
              {
                title: 'The Collection Snowboard: Hydrogen',
                quantity: 1,
                variant: {
                  id: '44071976927320',
                  price: { amount: 600, currencyCode: 'USD' },
                  product: { vendor: 'Hydrogen Vendor' },
                },
              },
              {
                title: 'The Multi-managed Snowboard',
                quantity: 1,
                variant: {
                  id: '44071977713752',
                  sku: 'sku-managed-1',
                  price: { amount: 629.95, currencyCode: 'USD' },
                  product: { vendor: 'Multi-managed Vendor' },
                },
              },
            ],
          },
        },
      },
      'checkout_completed',
    )!;

    const metadata = body.events[0]!.custom_event.metadata;
    expect(metadata.value).toBe(1229.95);
    expect(metadata.currency).toBe('USD');
    expect(metadata.orderId).toBe('6692100538456');
    expect(Array.isArray(metadata.items)).toBe(true);
    const items = metadata.items as Array<Record<string, unknown>>;
    expect(items).toHaveLength(2);
    expect(items[0]!.title).toBe('The Collection Snowboard: Hydrogen');
    expect(items[0]!.quantity).toBe(1);
    expect(items[0]!.price).toBe(600);
  });

  it('checkout_completed: caps lineItems at 100', () => {
    const lineItems = Array.from({ length: 250 }, (_, i) => ({
      title: `Item ${i}`,
      quantity: 1,
      variant: { id: `v-${i}`, price: { amount: 10, currencyCode: 'USD' } },
    }));

    const body = mapEventToBody(
      {
        id: 'evt-completed',
        timestamp: '2026-05-08T16:21:37.519Z',
        data: {
          checkout: {
            attributes: [SESSION_ATTR, USER_ATTR],
            totalPrice: { amount: 2500, currencyCode: 'USD' },
            currencyCode: 'USD',
            order: { id: 'ord-1' },
            lineItems,
          },
        },
      },
      'checkout_completed',
    )!;

    const items = body.events[0]!.custom_event.metadata.items as unknown[];
    expect(items.length).toBe(100);
    expect(body.events[0]!.custom_event.metadata.items_truncated).toBe(true);
  });

  it('checkout_completed: omits items_truncated when under cap', () => {
    const lineItems = [
      { title: 'Solo', quantity: 1, variant: { id: 'v-1', price: { amount: 10, currencyCode: 'USD' } } },
    ];

    const body = mapEventToBody(
      {
        id: 'evt-completed',
        timestamp: '2026-05-08T16:21:37.519Z',
        data: {
          checkout: {
            attributes: [SESSION_ATTR, USER_ATTR],
            totalPrice: { amount: 10, currencyCode: 'USD' },
            currencyCode: 'USD',
            order: { id: 'ord-1' },
            lineItems,
          },
        },
      },
      'checkout_completed',
    )!;

    expect(body.events[0]!.custom_event.metadata).not.toHaveProperty('items_truncated');
  });

  it('cart_viewed: emits cart_total + item_count', () => {
    const body = mapEventToBody(
      {
        id: 'evt-cart',
        timestamp: '2026-05-08T16:19:32.533Z',
        data: {
          cart: {
            attributes: [SESSION_ATTR, USER_ATTR],
            cost: { totalAmount: { amount: 49.99, currencyCode: 'USD' } },
            lines: [{ quantity: 2 }, { quantity: 1 }],
          },
        },
      },
      'cart_viewed',
    )!;

    expect(body.events[0]!.custom_event.metadata.cart_total).toBe(49.99);
    expect(body.events[0]!.custom_event.metadata.item_count).toBe(3);
  });

  it('cart_viewed: preserves explicit quantity:0 instead of falling back to row count', () => {
    const body = mapEventToBody(
      {
        id: 'evt-cart',
        timestamp: '2026-05-08T16:19:32.533Z',
        data: {
          cart: {
            attributes: [SESSION_ATTR, USER_ATTR],
            lines: [{ quantity: 0 }, { quantity: 0 }],
          },
        },
      },
      'cart_viewed',
    )!;

    // The original `count > 0 ? count : items.length` would have over-reported 2.
    expect(body.events[0]!.custom_event.metadata.item_count).toBe(0);
  });

  it('cart_viewed: falls back to row count only when no line had a numeric quantity', () => {
    const body = mapEventToBody(
      {
        id: 'evt-cart',
        timestamp: '2026-05-08T16:19:32.533Z',
        data: {
          cart: {
            attributes: [SESSION_ATTR, USER_ATTR],
            lines: [{}, {}, {}],
          },
        },
      },
      'cart_viewed',
    )!;

    expect(body.events[0]!.custom_event.metadata.item_count).toBe(3);
  });

  it('cart_viewed: falls back to cart.lineItems when cart.lines is empty', () => {
    const body = mapEventToBody(
      {
        id: 'evt-cart',
        timestamp: '2026-05-08T16:19:32.533Z',
        data: {
          cart: {
            attributes: [SESSION_ATTR, USER_ATTR],
            totalAmount: { amount: 19.99, currencyCode: 'USD' },
            lines: [],
            lineItems: [{ quantity: 4 }],
          },
        },
      },
      'cart_viewed',
    )!;

    expect(body.events[0]!.custom_event.metadata.item_count).toBe(4);
  });

  it('checkout_started: emits cart_total, currency, item_count', () => {
    const body = mapEventToBody(
      {
        id: 'evt-started',
        timestamp: '2026-05-08T16:19:32.533Z',
        data: {
          checkout: {
            attributes: [SESSION_ATTR, USER_ATTR],
            totalPrice: { amount: 99.99, currencyCode: 'EUR' },
            currencyCode: 'EUR',
            lineItems: [{ quantity: 1 }, { quantity: 1 }],
          },
        },
      },
      'checkout_started',
    )!;

    const metadata = body.events[0]!.custom_event.metadata;
    expect(metadata.cart_total).toBe(99.99);
    expect(metadata.currency).toBe('EUR');
    expect(metadata.item_count).toBe(2);
  });
});

describe('mapEventToBody — body shape (EventsQueueDto contract)', () => {
  it('emits a valid PixelEventBody with all required fields', () => {
    const body = mapEventToBody(
      {
        id: 'evt-1',
        timestamp: '2026-05-08T16:19:32.533Z',
        clientId: 'cid-1',
        data: {
          checkout: {
            token: 'tok-1',
            attributes: [SESSION_ATTR, USER_ATTR],
            currencyCode: 'USD',
            totalPrice: { amount: 100, currencyCode: 'USD' },
          },
        },
        context: {
          window: { location: { href: 'https://shop.example.com/checkouts/cn/abc' } },
        },
      },
      'checkout_started',
    )!;

    expect(body.user_id).toBe('user-1');
    expect(body.session_id).toBe('sess-1');
    expect(body.device).toEqual({ type: 'unknown', os: 'unknown', browser: 'unknown' });
    expect(body.events).toHaveLength(1);

    const event = body.events[0]!;
    expect(typeof event.id).toBe('string');
    expect(event.id.length).toBeGreaterThan(0);
    expect(event.type).toBe('custom');
    expect(event.page_url).toBe('https://shop.example.com/checkouts/cn/abc');
    expect(typeof event.timestamp).toBe('number');
    expect(event.custom_event.name).toBe('shopify_checkout_started');
    expect(typeof event.custom_event.metadata).toBe('object');

    expect(body._metadata.client_version).toBe('shopify-web-pixel-1');
    expect(typeof body._metadata.timestamp).toBe('number');
  });

  it('falls back to "unknown" page_url when context is missing', () => {
    const body = mapEventToBody(
      {
        id: 'evt-1',
        timestamp: '2026-05-08T16:19:32.533Z',
        data: { checkout: { attributes: [SESSION_ATTR, USER_ATTR] } },
      },
      'checkout_started',
    )!;

    expect(body.events[0]!.page_url).toBe('unknown');
  });

  it('strips query string from page_url (recovery tokens stay out of telemetry)', () => {
    const body = mapEventToBody(
      {
        id: 'evt-1',
        timestamp: '2026-05-08T16:19:32.533Z',
        data: { checkout: { attributes: [SESSION_ATTR, USER_ATTR] } },
        context: {
          window: { location: { href: 'https://shop.example.com/checkouts/cn/abc?recovery=secret123&key=tok' } },
        },
      },
      'checkout_started',
    )!;

    expect(body.events[0]!.page_url).toBe('https://shop.example.com/checkouts/cn/abc');
  });

  it('strips hash fragment from page_url', () => {
    const body = mapEventToBody(
      {
        id: 'evt-1',
        timestamp: '2026-05-08T16:19:32.533Z',
        data: { checkout: { attributes: [SESSION_ATTR, USER_ATTR] } },
        context: {
          window: { location: { href: 'https://shop.example.com/checkouts/cn/abc#step=payment' } },
        },
      },
      'checkout_started',
    )!;

    expect(body.events[0]!.page_url).toBe('https://shop.example.com/checkouts/cn/abc');
  });

  it('strips XSS patterns from merchant-controlled title/vendor/sku before forwarding', () => {
    const body = mapEventToBody(
      {
        id: 'evt-1',
        timestamp: '2026-05-08T16:19:32.533Z',
        data: {
          checkout: {
            attributes: [SESSION_ATTR, USER_ATTR],
            totalPrice: { amount: 10, currencyCode: 'USD' },
            currencyCode: 'USD',
            order: { id: 'ord-1' },
            lineItems: [
              {
                title: 'Snowboard<script>alert(1)</script>',
                quantity: 1,
                variant: {
                  id: 'v-1',
                  sku: 'sku-1<iframe src=evil></iframe>',
                  price: { amount: 10, currencyCode: 'USD' },
                  product: { vendor: 'Vendor onerror=alert(1)' },
                },
              },
            ],
          },
        },
      },
      'checkout_completed',
    )!;

    const item = (body.events[0]!.custom_event.metadata.items as Array<Record<string, unknown>>)[0]!;
    expect(item.title).toBe('Snowboard');
    expect(item.sku).toBe('sku-1');
    // `on\w+\s*=` strips event-handler attributes; the trailing payload remains
    // but is harmless without the handler binding.
    expect(item.vendor).toBe('Vendor alert(1)');
    const serialized = JSON.stringify(item);
    expect(serialized).not.toContain('<script');
    expect(serialized).not.toContain('<iframe');
    expect(serialized).not.toContain('onerror=');
  });

  it('caps merchant-controlled item title/vendor/sku to keep payloads under DTO limits', () => {
    const longTitle = 'T'.repeat(500);
    const longVendor = 'V'.repeat(500);
    const longSku = 'S'.repeat(300);

    const body = mapEventToBody(
      {
        id: 'evt-1',
        timestamp: '2026-05-08T16:19:32.533Z',
        data: {
          checkout: {
            attributes: [SESSION_ATTR, USER_ATTR],
            totalPrice: { amount: 10, currencyCode: 'USD' },
            currencyCode: 'USD',
            order: { id: 'ord-1' },
            lineItems: [
              {
                title: longTitle,
                quantity: 1,
                variant: {
                  id: 'v-1',
                  sku: longSku,
                  price: { amount: 10, currencyCode: 'USD' },
                  product: { vendor: longVendor },
                },
              },
            ],
          },
        },
      },
      'checkout_completed',
    )!;

    const item = (body.events[0]!.custom_event.metadata.items as Array<Record<string, unknown>>)[0]!;
    expect((item.title as string).length).toBe(255);
    expect((item.vendor as string).length).toBe(255);
    expect((item.sku as string).length).toBe(128);
  });

  it('falls back to finalLinePrice.amount when variant.price.amount is missing', () => {
    const body = mapEventToBody(
      {
        id: 'evt-1',
        timestamp: '2026-05-08T16:21:37.519Z',
        data: {
          checkout: {
            attributes: [SESSION_ATTR, USER_ATTR],
            totalPrice: { amount: 25, currencyCode: 'USD' },
            currencyCode: 'USD',
            order: { id: 'ord-1' },
            lineItems: [
              {
                title: 'Bundled item',
                quantity: 1,
                variant: { id: 'v-bundle' },
                finalLinePrice: { amount: 25, currencyCode: 'USD' },
              },
            ],
          },
        },
      },
      'checkout_completed',
    )!;

    const item = (body.events[0]!.custom_event.metadata.items as Array<Record<string, unknown>>)[0]!;
    expect(item.price).toBe(25);
  });

  it('omits item.id when variant.id is null (defensive null-handling)', () => {
    const body = mapEventToBody(
      {
        id: 'evt-1',
        timestamp: '2026-05-08T16:21:37.519Z',
        data: {
          checkout: {
            attributes: [SESSION_ATTR, USER_ATTR],
            totalPrice: { amount: 10, currencyCode: 'USD' },
            currencyCode: 'USD',
            order: { id: 'ord-1' },
            lineItems: [
              {
                title: 'Item without variant id',
                quantity: 1,
                variant: { id: null as unknown as string, price: { amount: 10, currencyCode: 'USD' } },
              },
            ],
          },
        },
      },
      'checkout_completed',
    )!;

    const item = (body.events[0]!.custom_event.metadata.items as Array<Record<string, unknown>>)[0]!;
    expect(item).not.toHaveProperty('id');
    expect(item.title).toBe('Item without variant id');
  });

  it('uses event_name prefix `shopify_` for all 7 standard events', () => {
    const events = [
      'cart_viewed',
      'checkout_started',
      'checkout_contact_info_submitted',
      'checkout_address_info_submitted',
      'checkout_shipping_info_submitted',
      'payment_info_submitted',
      'checkout_completed',
    ] as const;

    for (const eventName of events) {
      const body = mapEventToBody(
        {
          id: 'evt-1',
          timestamp: '2026-05-08T16:19:32.533Z',
          data: {
            checkout: { attributes: [SESSION_ATTR, USER_ATTR] },
            cart: { attributes: [SESSION_ATTR, USER_ATTR] },
          },
        },
        eventName,
      )!;

      expect(body.events[0]!.custom_event.name).toBe(`shopify_${eventName}`);
    }
  });
});
