/**
 * Default hosted ingest host for the TraceLog SaaS integration.
 *
 * The zero-DNS default: events post to `${INGEST_HOST}/p/{projectId}/collect` (a CORS
 * endpoint) the moment the snippet is pasted — no merchant DNS setup required. The
 * first-party CNAME subdomain (`integrations.tracelog.firstParty: true`) is an opt-in
 * "Accuracy mode" upgrade, not the default. Mirrors the standalone Shopify Web Pixel
 * sender's host (`src/pixel/pixel-sender.ts`), kept as a separate copy there because
 * the pixel ships as its own standalone bundle.
 */
export const INGEST_HOST = 'https://ingest.tracelog.io';

/**
 * Console log style for active TraceLog operations
 * Used for visual highlighting in browser console during QA mode
 */
export const LOG_STYLE_ACTIVE =
  'background: #ff9800; color: white; font-weight: bold; padding: 2px 8px; border-radius: 3px;';

/**
 * Console log style for disabled TraceLog operations
 * Used for visual indication when features are disabled
 */
export const LOG_STYLE_DISABLED =
  'background: #9e9e9e; color: white; font-weight: bold; padding: 2px 8px; border-radius: 3px;';

/**
 * Console log style for critical errors (always visible)
 * Used for errors that must reach monitoring platforms like Sentry
 */
export const LOG_STYLE_CRITICAL =
  'background: #d32f2f; color: white; font-weight: bold; padding: 2px 8px; border-radius: 3px;';
