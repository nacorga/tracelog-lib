/**
 * Shopify Custom Web Pixel snippet entry — export surface tests
 *
 * `custom-pixel-snippet.ts` is the Vite entry (`vite.pixel.config.mjs`) for the dashboard's
 * paste-able revenue-only snippet. It MUST expose exactly `mapEventToBody` + `sendBatch` and
 * MUST NOT expose `registerShopifyPixel` — that helper subscribes to the full 7-event funnel,
 * which would let the merchant accidentally double-subscribe or bypass the literal top-level
 * `analytics.subscribe('checkout_completed', ...)` call Shopify's static analyzer requires.
 * The dashboard hand-copies the compiled bundle as a string (`SHOPIFY_PIXEL_BUNDLE_JS` in
 * tracelog-app), so an accidental export change here would silently drift undetected otherwise.
 */

import { describe, it, expect } from 'vitest';
import * as customPixelSnippet from '../../../src/pixel/custom-pixel-snippet';

describe('custom-pixel-snippet entry exports', () => {
  it('exposes exactly mapEventToBody and sendBatch', () => {
    expect(Object.keys(customPixelSnippet).sort()).toEqual(['mapEventToBody', 'sendBatch']);
  });

  it('does not expose registerShopifyPixel', () => {
    expect('registerShopifyPixel' in customPixelSnippet).toBe(false);
  });

  it('re-exports the same function references as the full pixel API', async () => {
    const fullApi = await import('../../../src/pixel/index');
    expect(customPixelSnippet.mapEventToBody).toBe(fullApi.mapEventToBody);
    expect(customPixelSnippet.sendBatch).toBe(fullApi.sendBatch);
  });
});
