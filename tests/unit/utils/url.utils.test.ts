import { describe, it, expect, afterEach } from 'vitest';
import { getCollectApiUrls, normalizeUrl } from '../../../src/utils/network/url.utils';
import { INGEST_HOST } from '../../../src/constants';
import type { Config } from '../../../src/types';

describe('url.utils - normalizeUrl()', () => {
  describe('absolute URLs', () => {
    it('should strip default sensitive query params', () => {
      const result = normalizeUrl('https://example.com/reset?token=abc123&foo=1');
      expect(result).toBe('https://example.com/reset?foo=1');
    });

    it('should strip multiple default sensitive params', () => {
      const result = normalizeUrl('https://example.com/cb?code=xyz&otp=123&access_token=t1');
      expect(result).toBe('https://example.com/cb');
    });

    it('should merge custom sensitive params with defaults', () => {
      const result = normalizeUrl('https://example.com/?promo_code=SAVE20&token=abc&q=1', ['promo_code']);
      expect(result).toBe('https://example.com/?q=1');
    });

    it('should preserve non-sensitive params', () => {
      const result = normalizeUrl('https://example.com/search?q=test&page=2');
      expect(result).toBe('https://example.com/search?q=test&page=2');
    });

    it('should return URL without query untouched in value', () => {
      const result = normalizeUrl('https://example.com/page');
      expect(result).toBe('https://example.com/page');
    });
  });

  describe('relative URLs (click hrefs)', () => {
    it('should strip sensitive params from a root-relative href', () => {
      const result = normalizeUrl('/reset-password?token=secret123');
      expect(result).toBe('/reset-password');
    });

    it('should preserve non-sensitive params in a relative href', () => {
      const result = normalizeUrl('/products?category=shoes&token=abc');
      expect(result).toBe('/products?category=shoes');
    });

    it('should return unchanged relative hrefs verbatim', () => {
      expect(normalizeUrl('/checkout')).toBe('/checkout');
      expect(normalizeUrl('#section-2')).toBe('#section-2');
      expect(normalizeUrl('/list?page=3')).toBe('/list?page=3');
    });

    it('should preserve the hash when stripping params from a relative href', () => {
      const result = normalizeUrl('/account?auth=xyz#settings');
      expect(result).toBe('/account#settings');
    });

    it('should keep the host for a cross-origin protocol-relative href', () => {
      // jsdom base is http://localhost:3000 — a protocol-relative href to a different
      // host must NOT be collapsed to a path-only form (that would drop the host).
      const result = normalizeUrl('//cdn.other.com/x?token=secret123&v=1');
      expect(result).toBe('http://cdn.other.com/x?v=1');
      expect(result).not.toContain('secret123');
    });

    it('should preserve a cross-origin protocol-relative href with no sensitive params', () => {
      const result = normalizeUrl('//cdn.other.com/asset.js?v=1');
      expect(result).toBe('//cdn.other.com/asset.js?v=1');
    });
  });

  it('should return empty string for empty input', () => {
    expect(normalizeUrl('')).toBe('');
  });
});

describe('url.utils - getCollectApiUrls()', () => {
  const originalLocation = window.location;

  const setLocation = (href: string): void => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: new URL(href),
    });
  };

  afterEach(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  });

  it('returns no saas url when no projectId is configured (standalone)', () => {
    expect(getCollectApiUrls({})).toEqual({});
    expect(getCollectApiUrls({ integrations: { tracelog: { projectId: '' } } })).toEqual({});
  });

  it('defaults to the hosted zero-DNS endpoint (no firstParty flag)', () => {
    const config: Config = { integrations: { tracelog: { projectId: 'proj-123' } } };
    expect(getCollectApiUrls(config)).toEqual({ saas: `${INGEST_HOST}/p/proj-123/collect` });
  });

  it('uses the hosted endpoint even on localhost — no domain dependency', () => {
    // jsdom default url is http://localhost:3000; the hosted default must NOT reject it.
    const config: Config = { integrations: { tracelog: { projectId: 'proj-123' } } };
    expect(getCollectApiUrls(config).saas).toBe(`${INGEST_HOST}/p/proj-123/collect`);
  });

  it('encodes unsafe characters in the hosted url', () => {
    const config: Config = { integrations: { tracelog: { projectId: 'a b/c' } } };
    expect(getCollectApiUrls(config)).toEqual({ saas: `${INGEST_HOST}/p/a%20b%2Fc/collect` });
  });

  it('derives the first-party subdomain url when firstParty is true', () => {
    setLocation('https://shop.example.com/products');
    const config: Config = { integrations: { tracelog: { projectId: 'proj-123', firstParty: true } } };
    expect(getCollectApiUrls(config)).toEqual({ saas: 'https://proj-123.example.com/collect' });
  });

  it('throws for first-party mode on localhost (requires a real domain)', () => {
    setLocation('http://localhost:3000/');
    const config: Config = { integrations: { tracelog: { projectId: 'proj-123', firstParty: true } } };
    expect(() => getCollectApiUrls(config)).toThrow(/SaaS/);
  });
});
