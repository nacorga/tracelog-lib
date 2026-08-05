/**
 * Standalone HTTP sender for the Shopify Web Pixel Extension bundle.
 *
 * Posts to the path-based ingress (`ingest.tracelog.io/p/<id>/collect`) — NOT
 * `api.tracelog.io/events/collect` — because the middleware has the only CORS
 * handler that accepts `Origin: null` from sandboxed iframes.
 *
 * Best-effort: failures are silently swallowed. The authenticated server-side
 * webhook carries the revenue contract; pixel events are funnel-only.
 */

import { type IngestionReceipt, parseIngestionReceipt } from '../types/ingestion-receipt.types';

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

  // Encode in case the merchant pastes whitespace, slashes, or other unsafe
  // characters into the Shopify extension settings form.
  const url = `${INGEST_HOST}/p/${encodeURIComponent(settings.projectId)}/collect`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify(body),
    });

    if (typeof response.json !== 'function') return null;
    try {
      return parseIngestionReceipt(await response.json());
    } catch {
      return null;
    }
  } catch {
    // Pixel runs inside Shopify's strict sandbox; fetch() may be unavailable
    // or throw synchronously. Funnel events are best-effort — drop silently.
    return null;
  }
}
