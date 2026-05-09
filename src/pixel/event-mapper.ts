import type { PixelEventBody } from './pixel-sender';

const PIXEL_CLIENT_VERSION = 'shopify-web-pixel-1';

const MAX_LINE_ITEMS = 100;

export const SHOPIFY_EVENTS = [
  'cart_viewed',
  'checkout_started',
  'checkout_contact_info_submitted',
  'checkout_address_info_submitted',
  'checkout_shipping_info_submitted',
  'payment_info_submitted',
  'checkout_completed',
] as const;

export type ShopifyEventName = (typeof SHOPIFY_EVENTS)[number];

/**
 * Spike-confirmed shape ([04-spike-report.md](../../docs/tasks/shopify-hybrid-capture/04-spike-report.md)):
 * `event.data.{cart,checkout}.attributes` is `Array<{key, value, __typename?}>`,
 * NOT a plain object. `__typename: 'NoteAttribute'` is added on `checkout_completed`
 * only — harmless because we lookup by `key`.
 */
interface ShopifyAttribute {
  key?: string;
  value?: string;
  __typename?: string;
}

interface ShopifyMoney {
  amount?: number;
  currencyCode?: string;
}

interface ShopifyLineItemVariantProduct {
  id?: string | number;
  title?: string;
  vendor?: string;
}

interface ShopifyLineItemVariant {
  id?: string | number;
  sku?: string | null;
  price?: ShopifyMoney;
  product?: ShopifyLineItemVariantProduct;
}

interface ShopifyLineItem {
  id?: string | number;
  title?: string;
  quantity?: number;
  variant?: ShopifyLineItemVariant;
  finalLinePrice?: ShopifyMoney;
}

interface ShopifyCheckout {
  token?: string;
  currencyCode?: string;
  totalPrice?: ShopifyMoney;
  subtotalPrice?: ShopifyMoney;
  attributes?: ShopifyAttribute[];
  lineItems?: ShopifyLineItem[];
  order?: { id?: string | number };
}

interface ShopifyCart {
  attributes?: ShopifyAttribute[];
  totalAmount?: ShopifyMoney;
  cost?: { totalAmount?: ShopifyMoney };
  lines?: ShopifyLineItem[];
  lineItems?: ShopifyLineItem[];
}

interface ShopifyCheckoutLineItem {
  quantity?: number;
}

interface ShopifyEvent {
  id?: string;
  timestamp?: string;
  clientId?: string;
  data?: {
    checkout?: ShopifyCheckout;
    cart?: ShopifyCart;
    checkoutLineItems?: ShopifyCheckoutLineItem[];
  };
  context?: {
    window?: { location?: { href?: string } };
    document?: { location?: { href?: string } };
  };
}

function attrLookup(attrs: ShopifyAttribute[] | undefined, key: string): string | null {
  if (!Array.isArray(attrs)) return null;
  for (const a of attrs) {
    if (a && a.key === key && typeof a.value === 'string' && a.value.length > 0) return a.value;
  }
  return null;
}

function safeNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function safeString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function setIfDefined<T>(target: Record<string, unknown>, key: string, value: T | undefined): void {
  if (value !== undefined) target[key] = value;
}

function buildMetadata(event: ShopifyEvent, name: ShopifyEventName): Record<string, unknown> {
  const checkout = event.data?.checkout;
  const cart = event.data?.cart;
  const meta: Record<string, unknown> = {};

  setIfDefined(meta, 'shopify_client_id', safeString(event.clientId));

  const checkoutToken = safeString(checkout?.token);
  if (checkoutToken) meta['checkout_token'] = checkoutToken;

  if (name === 'checkout_completed') {
    const total = checkout?.totalPrice?.amount ?? checkout?.subtotalPrice?.amount;
    setIfDefined(meta, 'value', safeNumber(total));
    setIfDefined(meta, 'currency', safeString(checkout?.currencyCode ?? checkout?.totalPrice?.currencyCode));
    const orderId = checkout?.order?.id;
    if (orderId !== undefined && orderId !== null) meta['orderId'] = String(orderId);
    const rawItems = checkout?.lineItems ?? [];
    const items = mapLineItems(rawItems);
    if (items.length > 0) {
      meta['items'] = items;
      if (rawItems.length > MAX_LINE_ITEMS) meta['items_truncated'] = true;
    }
  } else if (name === 'cart_viewed') {
    const cartTotal = cart?.cost?.totalAmount?.amount ?? cart?.totalAmount?.amount;
    setIfDefined(meta, 'cart_total', safeNumber(cartTotal));
    const itemCount = countLineItems(cart?.lines ?? cart?.lineItems);
    setIfDefined(meta, 'item_count', itemCount);
  } else if (name === 'checkout_started') {
    const total = checkout?.totalPrice?.amount ?? checkout?.subtotalPrice?.amount;
    setIfDefined(meta, 'cart_total', safeNumber(total));
    setIfDefined(meta, 'currency', safeString(checkout?.currencyCode ?? checkout?.totalPrice?.currencyCode));
    const itemCount = countLineItems(checkout?.lineItems) ?? countLineItems(event.data?.checkoutLineItems);
    setIfDefined(meta, 'item_count', itemCount);
  } else {
    setIfDefined(meta, 'currency', safeString(checkout?.currencyCode ?? checkout?.totalPrice?.currencyCode));
    const total = checkout?.totalPrice?.amount;
    setIfDefined(meta, 'cart_total', safeNumber(total));
  }

  return meta;
}

function countLineItems(items: { quantity?: number }[] | undefined): number | undefined {
  if (!items || items.length === 0) return undefined;
  let count = 0;
  for (const item of items) {
    const q = safeNumber(item?.quantity);
    count += q ?? 0;
  }
  // Fallback to row count when every line is missing a numeric quantity.
  return count > 0 ? count : items.length;
}

// Caps merchant-controlled free-text to keep payloads under the API's per-string DTO limit.
// IDs, tokens, and currency codes are naturally bounded by Shopify and skip capping.
const MAX_TEXT_LEN = 255;
const MAX_SKU_LEN = 128;

function cap(value: string | undefined, max: number): string | undefined {
  if (value === undefined) return undefined;
  return value.length > max ? value.slice(0, max) : value;
}

function mapLineItems(items: ShopifyLineItem[] | undefined): Record<string, unknown>[] {
  if (!items || items.length === 0) return [];
  const capped = items.slice(0, MAX_LINE_ITEMS);
  return capped.map((item) => {
    const out: Record<string, unknown> = {};
    setIfDefined(out, 'id', safeString(item.variant?.id !== undefined ? String(item.variant.id) : undefined));
    setIfDefined(out, 'title', cap(safeString(item.title ?? item.variant?.product?.title), MAX_TEXT_LEN));
    setIfDefined(out, 'quantity', safeNumber(item.quantity));
    setIfDefined(out, 'price', safeNumber(item.variant?.price?.amount ?? item.finalLinePrice?.amount));
    setIfDefined(out, 'sku', cap(safeString(item.variant?.sku ?? undefined), MAX_SKU_LEN));
    setIfDefined(out, 'vendor', cap(safeString(item.variant?.product?.vendor), MAX_TEXT_LEN));
    return out;
  });
}

function generateEventId(event: ShopifyEvent, ts: number): string {
  const suffix = safeString(event.id)?.slice(-6) ?? Math.random().toString(36).slice(2, 8);
  return `${ts}-001-${suffix}`;
}

function resolveTimestamp(value: string | undefined): number {
  if (typeof value !== 'string' || value.length === 0) return Date.now();
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function stripUrlParams(href: string): string {
  // Pixel runs in the checkout sandbox where href can carry recovery tokens
  // (`?recovery=...`, `?key=...`). Path alone identifies the funnel stage; drop
  // query and hash to keep tokens out of telemetry. Mirrors the policy in
  // `src/utils/network/url.utils.ts` (which is too heavy to import into the
  // sub-5KB pixel bundle).
  const queryIdx = href.indexOf('?');
  const hashIdx = href.indexOf('#');
  let cutoff = href.length;
  if (queryIdx !== -1) cutoff = queryIdx;
  if (hashIdx !== -1 && hashIdx < cutoff) cutoff = hashIdx;
  return href.slice(0, cutoff);
}

function resolvePageUrl(event: ShopifyEvent): string {
  const href = safeString(event.context?.window?.location?.href) ?? safeString(event.context?.document?.location?.href);
  return href ? stripUrlParams(href) : 'unknown';
}

export function mapEventToBody(
  shopifyEvent: ShopifyEvent | null | undefined,
  shopifyEventName: ShopifyEventName,
): PixelEventBody | null {
  if (!shopifyEvent) return null;

  const checkoutAttrs = shopifyEvent.data?.checkout?.attributes;
  const cartAttrs = shopifyEvent.data?.cart?.attributes;

  const sessionId = attrLookup(checkoutAttrs, 'tracelog_session_id') ?? attrLookup(cartAttrs, 'tracelog_session_id');
  const userId = attrLookup(checkoutAttrs, 'tracelog_user_id') ?? attrLookup(cartAttrs, 'tracelog_user_id');

  if (!sessionId || !userId) return null;

  const ts = resolveTimestamp(shopifyEvent.timestamp);
  const eventId = generateEventId(shopifyEvent, ts);
  const metadata = buildMetadata(shopifyEvent, shopifyEventName);

  return {
    user_id: userId,
    session_id: sessionId,
    device: { type: 'unknown', os: 'unknown', browser: 'unknown' },
    events: [
      {
        id: eventId,
        type: 'custom',
        page_url: resolvePageUrl(shopifyEvent),
        timestamp: ts,
        custom_event: {
          name: `shopify_${shopifyEventName}`,
          metadata,
        },
      },
    ],
    _metadata: {
      client_version: PIXEL_CLIENT_VERSION,
      timestamp: ts,
    },
  };
}
