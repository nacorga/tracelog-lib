/**
 * Error signature utilities.
 *
 * SOURCE: tracelog-api/src/lib/error-classification/error-fingerprint.service.ts
 *
 * The regex set AND `normalizeFilename` below MUST stay byte-identical to the API's
 * `normalizeErrorMessage` / `normalizeFilename` so that client-side throttling and
 * server-side cap/dedup agree on what counts as the "same" error. The lib's variant
 * skips the SHA-256 step the API performs after normalization: the throttle map key is
 * the composite string itself, avoiding a `crypto` import and shaving bytes from the
 * browser bundle.
 *
 * If either side changes the regex set, `normalizeFilename`, or the `ErrorSignatureInput`
 * shape, update both AND adjust the unit tests that codify the expected outputs against
 * fixed inputs (`error-signature.utils.test.ts` here, `error-fingerprint.service.spec.ts`
 * in the API).
 */

const URL_PATTERN = /https?:\/\/\S+/g;
const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const HEX_ADDR_PATTERN = /0x[0-9a-fA-F]{4,}/g;
const LONG_NUMBER_PATTERN = /(?<!\d)\d{4,}(?!\d)/g;
const LONG_QUOTED_PATTERN = /(['"])[^'"]{20,}\1/g;

export interface ErrorSignatureInput {
  message: string;
  filename?: string;
  line?: number | string;
  /**
   * Full page URL where the error fired. Inline-script errors report the page URL as
   * `filename`; when they match, the signature collapses to the URL origin (see
   * `normalizeFilename`). Optional — omit when no page context is available.
   */
  page_url?: string;
}

export function normalizeErrorMessage(message: string): string {
  return message
    .replace(URL_PATTERN, '[URL]')
    .replace(UUID_PATTERN, '[ID]')
    .replace(HEX_ADDR_PATTERN, '[ADDR]')
    .replace(LONG_NUMBER_PATTERN, '[N]')
    .replace(LONG_QUOTED_PATTERN, '$1[VAR]$1')
    .toLowerCase()
    .trim();
}

/** Cut a string at the first `?` or `#`. Shared by filename + page-URL normalization. */
function stripQueryHash(value: string): string {
  const cut = value.search(/[?#]/);
  return cut === -1 ? value : value.slice(0, cut);
}

/**
 * MIRROR of `ErrorFingerprintService.normalizeFilename` in the API — MUST produce
 * byte-identical output.
 *
 * Browsers report the PAGE URL as `filename` for inline-script errors. When
 * `filename === page_url` (query/hash stripped from both) collapse to the URL `origin`
 * so one theme bug = one signature across pages. Real asset URLs on another path keep
 * their full URL (the path discriminates distinct assets); `data:` / `blob:` and other
 * non-http(s) schemes have no stable identity → `''`; relative / bare names (`bundle.js`)
 * and malformed input fall back to the query/hash-stripped raw string.
 */
function normalizeFilename(filename: string | undefined, pageUrl?: string): string {
  const raw = stripQueryHash((filename ?? '').trim());
  if (!raw) return '';
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return raw;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
  const page = stripQueryHash((pageUrl ?? '').trim());
  if (page && raw === page) return parsed.origin;
  return raw;
}

export function buildErrorSignatureKey(input: ErrorSignatureInput): string {
  const message = normalizeErrorMessage(input.message);
  const filename = normalizeFilename(input.filename, input.page_url);
  const line = input.line == null ? '' : String(input.line);
  return `${message}|${filename}|${line}`;
}
