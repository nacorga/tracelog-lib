/**
 * Entry point for the browser IIFE bundle embedded in TraceLog's dashboard as a paste-able Shopify
 * Custom Web Pixel snippet (Settings → Customer events → Add custom pixel — no app install required).
 *
 * Exports ONLY the two low-level primitives the pasted snippet calls directly: `mapEventToBody`
 * (shapes one Shopify pixel event into the ingest payload) and `sendBatch` (posts it). Deliberately
 * excludes `registerShopifyPixel`, which subscribes to the full 7-event funnel — this snippet is
 * revenue-only, so the merchant's pasted code carries a single, literal, top-level
 * `analytics.subscribe('checkout_completed', ...)` call. Shopify's static pixel analyzer only
 * recognizes a literal, unindirected `analytics.subscribe(event, handler)` call in the pixel's own
 * script, not one buried inside a bundled helper function — so the subscribe call must live in the
 * merchant's pasted code, not in this bundle.
 *
 * Built via `vite.pixel.config.mjs` into `dist/browser/tracelog-shopify-pixel.iife.js`
 * (`npm run build:pixel`). Distinct from the `@tracelog/lib/pixel` subpath (`src/pixel/index.ts`),
 * which stays the full API (including `registerShopifyPixel`) consumed by the OAuth Shopify app's
 * own Web Pixel extension.
 */
export { mapEventToBody } from './event-mapper';
export { sendBatch } from './pixel-sender';
