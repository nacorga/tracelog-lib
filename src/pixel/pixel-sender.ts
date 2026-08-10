/**
 * Standalone HTTP sender for the Shopify Web Pixel Extension bundle.
 *
 * Posts to the path-based ingress (`ingest.tracelog.io/p/<id>/collect`) — NOT
 * `api.tracelog.io/events/collect` — because the middleware has the only CORS
 * handler that accepts `Origin: null` from sandboxed iframes.
 *
 * Best-effort: failures are silently swallowed. The authenticated server-side
 * webhook carries the revenue contract; pixel events are funnel-only and
 * accept ~5-30% loss.
 *
 * The returned receipt is opportunistic. `keepalive` guarantees the *request*
 * outlives the page, not that the response body can still be read — on the
 * checkout/unload path the awaited body may never arrive, yielding `null`.
 * Treat a `null` receipt as "no information", never as "nothing was ingested".
 */

import { type IngestionReceipt, parseCollectReceipt } from '../types/ingestion-receipt.types';

const INGEST_HOST = 'https://ingest.tracelog.io';

export interface PixelSenderSettings {
  /** TraceLog project identifier (e.g. `t756edc0pnn17ha7`). Provided by Shopify init payload. */
  projectId: string;
}

export interface PixelEventBody {
  user_id: string;
  session_id: string;
  device: { type: string; os: string; browser: string };
  events: Array<{
    id: string;
    type: 'custom';
    page_url: string;
    timestamp: number;
    custom_event: { name: string; metadata: Record<string, unknown> };
  }>;
  _metadata: { client_version: string; timestamp: number };
}

export async function sendBatch(settings: PixelSenderSettings, body: PixelEventBody): Promise<IngestionReceipt | null> {
  // Trust boundary is the Shopify extension settings form, but a misconfigured
  // (empty) projectId would yield `https://ingest.tracelog.io/p//collect` and
  // 404 every event. Drop silently so it can be diagnosed via Shopify pixel logs.
  if (!settings.projectId) return null;

  // One catch covers the whole body deliberately. Every failure here has the same answer —
  // resolve to `null` — and the function is `async`, so anything thrown outside this block would
  // reject a promise the caller intentionally discards (`void sendBatch(...)`) instead of
  // surfacing anywhere. That makes the boundary the contract: `encodeURIComponent` (throws
  // `URIError` on a lone surrogate), `JSON.stringify`, `fetch` (unavailable or throwing
  // synchronously inside Shopify's sandbox), and `response.json()` (absent on a non-Response, or
  // a non-JSON body) all land in the same place.
  try {
    // Encode in case the merchant pastes whitespace, slashes, or other unsafe
    // characters into the Shopify extension settings form.
    const url = `${INGEST_HOST}/p/${encodeURIComponent(settings.projectId)}/collect`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify(body),
    });

    // Exactly the rule the standard sender applies — provenance, structure, and consistency with
    // the response — because a receipt says how much of a merchant's traffic was refused, and that
    // must not be easier to fake on one transport than another.
    return parseCollectReceipt(await response.json(), response);
  } catch {
    return null;
  }
}
