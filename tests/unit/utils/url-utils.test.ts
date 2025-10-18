import { describe, test, expect } from 'vitest';
import { normalizeUrl } from '../../../src/utils/network/url.utils';

describe('URL Utils', () => {
  describe('normalizeUrl', () => {
    test('should apply default sensitive params even when no custom params provided', () => {
      const url = 'https://test.com/page?user=john&id=123&token=secret';
      const result = normalizeUrl(url);

      // Default params should be removed (e.g., 'token')
      expect(result).toBe('https://test.com/page?user=john&id=123');
      expect(result).not.toContain('token');
    });

    test('should remove sensitive query parameters', () => {
      const url = 'https://test.com/page?token=secret123&user=john&password=pass456';
      const result = normalizeUrl(url, ['token', 'password']);

      expect(result).toBe('https://test.com/page?user=john');
      expect(result).not.toContain('secret123');
      expect(result).not.toContain('pass456');
      expect(result).toContain('user=john');
    });

    test('should handle URLs with no query parameters', () => {
      const url = 'https://test.com/page';
      const result = normalizeUrl(url, ['token']);

      expect(result).toBe(url);
    });

    test('should handle URLs where all params are sensitive', () => {
      const url = 'https://test.com/page?token=abc&password=xyz';
      const result = normalizeUrl(url, ['token', 'password']);

      expect(result).toBe('https://test.com/page');
    });

    test('should handle case-sensitive parameter names', () => {
      const url = 'https://test.com/page?Token=abc&token=xyz';
      const result = normalizeUrl(url, ['token']);

      // Should only remove lowercase 'token'
      expect(result).toContain('Token=abc');
      expect(result).not.toContain('token=xyz');
    });

    test('should preserve URL hash', () => {
      const url = 'https://test.com/page?token=secret#section';
      const result = normalizeUrl(url, ['token']);

      expect(result).toBe('https://test.com/page#section');
    });

    test('should preserve URL pathname', () => {
      const url = 'https://test.com/path/to/page?custom_param=secret&user=john';
      const result = normalizeUrl(url, ['custom_param']);

      expect(result).toBe('https://test.com/path/to/page?user=john');
    });

    test('should handle invalid URL gracefully', () => {
      const url = 'not-a-valid-url';
      const result = normalizeUrl(url, ['token']);

      // Should return original URL if invalid
      expect(result).toBe(url);
    });

    test('should apply default params even with empty custom params array', () => {
      const url = 'https://test.com/page?token=secret&user=john';
      const result = normalizeUrl(url, []);

      // Default params (like 'token') should still be removed
      expect(result).toBe('https://test.com/page?user=john');
      expect(result).not.toContain('token');
    });

    test('should handle params that do not exist', () => {
      const url = 'https://test.com/page?user=john&custom_id=123';
      const result = normalizeUrl(url, ['nonexistent_param']);

      // No params should be removed (neither default nor custom match)
      expect(result).toBe(url);
    });

    test('should handle URLs with special characters in params', () => {
      const url = 'https://test.com/page?redirect=https%3A%2F%2Fexample.com&token=secret';
      const result = normalizeUrl(url, ['token']);

      expect(result).toContain('redirect=https%3A%2F%2Fexample.com');
      expect(result).not.toContain('token=secret');
    });

    test('should handle multiple params with same name', () => {
      const url = 'https://test.com/page?id=1&id=2&token=secret';
      const result = normalizeUrl(url, []); // token is in defaults

      expect(result).toContain('id=1');
      expect(result).toContain('id=2');
      expect(result).not.toContain('token');
    });

    test('should merge custom params with defaults', () => {
      const url = 'https://test.com/page?token=abc&custom_secret=xyz&user=john';
      const result = normalizeUrl(url, ['custom_secret']);

      // Both default ('token') and custom ('custom_secret') should be removed
      expect(result).toBe('https://test.com/page?user=john');
      expect(result).not.toContain('token');
      expect(result).not.toContain('custom_secret');
    });
  });
});
