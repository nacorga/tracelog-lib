/**
 * Error signature utilities.
 *
 * SOURCE: tracelog-api/src/lib/error-classification/error-fingerprint.service.ts
 *
 * The regex set below MUST stay byte-identical to the API's `normalizeErrorMessage`
 * so that client-side throttling and server-side dedup agree on what counts as the
 * "same" error. The lib's variant skips the SHA-256 step the API performs after
 * normalization: the throttle map key is the composite string itself, avoiding a
 * `crypto` import and shaving bytes from the browser bundle.
 *
 * If either side changes the regex set, update both AND adjust the unit test that
 * codifies the expected outputs against fixed inputs (`error-signature.utils.test.ts`).
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

export function buildErrorSignatureKey(input: ErrorSignatureInput): string {
  const message = normalizeErrorMessage(input.message);
  const rawFilename = (input.filename ?? '').trim();
  // Strip query string and hash fragment so UTM / campaign params don't split signatures.
  const cut = rawFilename.search(/[?#]/);
  const filename = cut === -1 ? rawFilename : rawFilename.slice(0, cut);
  const line = input.line == null ? '' : String(input.line);
  return `${message}|${filename}|${line}`;
}
