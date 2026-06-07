import { describe, it, expect } from 'vitest';
import { normalizeUrl } from '../../../src/utils/network/url.utils';

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
  });

  it('should return empty string for empty input', () => {
    expect(normalizeUrl('')).toBe('');
  });
});
