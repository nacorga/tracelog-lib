/**
 * Error Signature Utils Tests
 *
 * Codifies the byte-for-byte parity between the lib's `normalizeErrorMessage` /
 * `buildErrorSignatureKey` (which embeds `normalizeFilename`) and the API's
 * `ErrorFingerprintService`. If the API regex set, `normalizeFilename`, or the
 * `ErrorSignatureInput` shape changes in
 * `tracelog-api/src/lib/error-classification/error-fingerprint.service.ts`, this file
 * MUST be updated in lockstep or the lib build will surface the drift. The fixtures
 * here mirror those in `error-fingerprint.service.spec.ts`.
 */

import { describe, it, expect } from 'vitest';
import { buildErrorSignatureKey, normalizeErrorMessage } from '../../../src/utils/error-signature.utils';

describe('normalizeErrorMessage', () => {
  it('redacts http and https URLs', () => {
    expect(normalizeErrorMessage('failed at https://api.example.com/v1/items')).toBe('failed at [url]');
  });

  it('redacts UUIDs (case-insensitive)', () => {
    expect(normalizeErrorMessage('user 550e8400-e29b-41d4-a716-446655440000 missing')).toBe('user [id] missing');
    expect(normalizeErrorMessage('user 550E8400-E29B-41D4-A716-446655440000 missing')).toBe('user [id] missing');
  });

  it('redacts hex addresses', () => {
    expect(normalizeErrorMessage('crash at 0xDEADBEEF in module')).toBe('crash at [addr] in module');
  });

  it('redacts long numbers (>=4 digits, not part of longer numbers)', () => {
    expect(normalizeErrorMessage('order 12345 failed')).toBe('order [n] failed');
  });

  it('does NOT redact short numbers (<4 digits)', () => {
    expect(normalizeErrorMessage('attempt 42 of 99')).toBe('attempt 42 of 99');
  });

  it('redacts long quoted strings (>=20 chars between quotes)', () => {
    expect(normalizeErrorMessage("expected 'aaaaaaaaaaaaaaaaaaaaaaaa' but got 'short'")).toBe(
      "expected '[var]' but got 'short'",
    );
  });

  it('lowercases and trims', () => {
    expect(normalizeErrorMessage('   TYPEERROR: Cannot read   ')).toBe('typeerror: cannot read');
  });

  it('returns identical signatures for messages differing only by numeric IDs', () => {
    expect(normalizeErrorMessage('Failed to load order 12345')).toBe(
      normalizeErrorMessage('Failed to load order 67890'),
    );
  });
});

describe('buildErrorSignatureKey', () => {
  it('combines normalized message, filename, and line', () => {
    expect(buildErrorSignatureKey({ message: 'Boom 12345', filename: 'app.js', line: 42 })).toBe('boom [n]|app.js|42');
  });

  it('strips query string from filename so UTM/campaign params do not split signatures', () => {
    const a = buildErrorSignatureKey({ message: 'Boom', filename: 'app.js?utm=spring', line: 1 });
    const b = buildErrorSignatureKey({ message: 'Boom', filename: 'app.js?utm=summer', line: 1 });
    expect(a).toBe(b);
    expect(a).toBe('boom|app.js|1');
  });

  it('strips hash fragment from filename', () => {
    expect(buildErrorSignatureKey({ message: 'Boom', filename: 'app.js#section', line: 1 })).toBe('boom|app.js|1');
  });

  it('handles missing filename and line gracefully', () => {
    expect(buildErrorSignatureKey({ message: 'Boom' })).toBe('boom||');
  });

  it('coerces line numbers to strings consistently', () => {
    expect(buildErrorSignatureKey({ message: 'Boom', filename: 'a.js', line: 1 })).toBe(
      buildErrorSignatureKey({ message: 'Boom', filename: 'a.js', line: '1' }),
    );
  });

  it('collapses inline-script errors (filename === page_url) to the origin across pages', () => {
    const a = buildErrorSignatureKey({
      message: 'Boom',
      filename: 'https://koopsbrand.com/collections/kids',
      line: 42,
      page_url: 'https://koopsbrand.com/collections/kids',
    });
    const b = buildErrorSignatureKey({
      message: 'Boom',
      filename: 'https://koopsbrand.com/collections/barefoot-for-adults',
      line: 42,
      page_url: 'https://koopsbrand.com/collections/barefoot-for-adults',
    });
    expect(a).toBe(b);
    expect(a).toBe('boom|https://koopsbrand.com|42');
  });

  it('collapses inline-script errors even when query/hash differ between filename and page_url', () => {
    expect(
      buildErrorSignatureKey({
        message: 'Boom',
        filename: 'https://koopsbrand.com/products/foo?utm_source=facebook',
        line: 42,
        page_url: 'https://koopsbrand.com/products/foo?fbclid=abc',
      }),
    ).toBe('boom|https://koopsbrand.com|42');
  });

  it('does NOT collapse a real asset URL served from a path other than the page', () => {
    expect(
      buildErrorSignatureKey({
        message: 'Boom',
        filename: 'https://cdn.shopify.com/s/files/1/app.js',
        line: 10,
        page_url: 'https://koopsbrand.com/collections/kids',
      }),
    ).toBe('boom|https://cdn.shopify.com/s/files/1/app.js|10');
  });

  it('drops data: and blob: filenames (no stable identity)', () => {
    expect(buildErrorSignatureKey({ message: 'Boom', filename: 'data:text/javascript,console.log(1)', line: 1 })).toBe(
      'boom||1',
    );
    expect(
      buildErrorSignatureKey({ message: 'Boom', filename: 'blob:https://koopsbrand.com/9f3c-uuid', line: 1 }),
    ).toBe('boom||1');
  });

  it('returns an empty filename segment for whitespace-only filename', () => {
    expect(buildErrorSignatureKey({ message: 'Boom', filename: '   ', line: 1 })).toBe('boom||1');
  });
});
