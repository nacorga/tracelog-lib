import { mapEventToBody, type ShopifyEventName } from './event-mapper';
import { sendBatch, type PixelSenderSettings } from './pixel-sender';

interface ShopifyAnalyticsApi {
  subscribe: (event: ShopifyEventName, callback: (event: unknown) => void) => void;
}

interface ShopifyPixelApi {
  analytics: ShopifyAnalyticsApi;
}

/**
 * Registers the TraceLog Shopify Web Pixel: subscribes to the 7 standard
 * Customer Events and forwards each one to `ingest.tracelog.io/p/<id>/collect`.
 *
 * Each subscription is declared explicitly because Shopify's static analyzer
 * inspects the bundle for `analytics.subscribe('event_name', ...)` calls;
 * loop-based subscriptions are flagged and the pixel is treated as inactive.
 */
export function registerShopifyPixel(api: ShopifyPixelApi, settings: PixelSenderSettings): void {
  const handle = (eventName: ShopifyEventName, payload: unknown): void => {
    const body = mapEventToBody(payload as Parameters<typeof mapEventToBody>[0], eventName);
    if (!body) return;
    sendBatch(settings, body);
  };

  api.analytics.subscribe('cart_viewed', (event) => {
    handle('cart_viewed', event);
  });
  api.analytics.subscribe('checkout_started', (event) => {
    handle('checkout_started', event);
  });
  api.analytics.subscribe('checkout_contact_info_submitted', (event) => {
    handle('checkout_contact_info_submitted', event);
  });
  api.analytics.subscribe('checkout_address_info_submitted', (event) => {
    handle('checkout_address_info_submitted', event);
  });
  api.analytics.subscribe('checkout_shipping_info_submitted', (event) => {
    handle('checkout_shipping_info_submitted', event);
  });
  api.analytics.subscribe('payment_info_submitted', (event) => {
    handle('payment_info_submitted', event);
  });
  api.analytics.subscribe('checkout_completed', (event) => {
    handle('checkout_completed', event);
  });
}
