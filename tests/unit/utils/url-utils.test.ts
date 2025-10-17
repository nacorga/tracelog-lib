import { describe, test, expect, beforeEach } from 'vitest';
import { normalizeUrl, getCollectApiUrls } from '../../../src/utils/network/url.utils';
import { Config } from '../../../src/types';

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

  describe('getCollectApiUrls', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        value: {
          href: 'https://example.com/page',
          hostname: 'example.com',
          protocol: 'https:',
        },
        writable: true,
        configurable: true,
      });
    });

    test('should return empty strings when no integrations configured', () => {
      const config: Config = {};
      const result = getCollectApiUrls(config);

      expect(result).toEqual({ saas: '', custom: '' });
    });

    test('should generate SaaS API URL from tracelog projectId', () => {
      const config: Config = {
        integrations: {
          tracelog: {
            projectId: 'my-project',
          },
        },
      };

      const result = getCollectApiUrls(config);

      expect(result.saas).toBe('https://my-project.example.com/collect');
      expect(result.custom).toBe('');
    });

    test('should use custom collectApiUrl when provided', () => {
      const config: Config = {
        integrations: {
          custom: {
            collectApiUrl: 'https://api.custom.com/collect',
          },
        },
      };

      const result = getCollectApiUrls(config);

      expect(result.saas).toBe('');
      expect(result.custom).toBe('https://api.custom.com/collect');
    });

    test('should return both URLs when both integrations configured', () => {
      const config: Config = {
        integrations: {
          tracelog: {
            projectId: 'my-project',
          },
          custom: {
            collectApiUrl: 'https://api.custom.com/collect',
          },
        },
      };

      const result = getCollectApiUrls(config);

      expect(result.saas).toBe('https://my-project.example.com/collect');
      expect(result.custom).toBe('https://api.custom.com/collect');
    });

    test('should return empty custom URL for invalid collectApiUrl', () => {
      const config: Config = {
        integrations: {
          custom: {
            collectApiUrl: 'not-a-valid-url',
          },
        },
      };

      const result = getCollectApiUrls(config);

      expect(result.saas).toBe('');
      expect(result.custom).toBe('');
    });

    test('should handle subdomain extraction correctly', () => {
      Object.defineProperty(window, 'location', {
        value: {
          href: 'https://app.example.com/page',
          hostname: 'app.example.com',
          protocol: 'https:',
        },
        writable: true,
        configurable: true,
      });

      const config: Config = {
        integrations: {
          tracelog: {
            projectId: 'test-project',
          },
        },
      };

      const result = getCollectApiUrls(config);

      expect(result.saas).toBe('https://test-project.example.com/collect');
      expect(result.custom).toBe('');
    });

    test('should allow HTTP when allowHttp is true in custom integration', () => {
      Object.defineProperty(window, 'location', {
        value: {
          href: 'http://localhost:3000/page',
          hostname: 'localhost',
          protocol: 'http:',
        },
        writable: true,
        configurable: true,
      });

      const config: Config = {
        integrations: {
          custom: {
            collectApiUrl: 'http://localhost:3000/collect',
            allowHttp: true,
          },
        },
      };

      const result = getCollectApiUrls(config);

      expect(result.custom).toContain('http://');
    });

    test('should reject HTTP URL when allowHttp is false in custom integration', () => {
      Object.defineProperty(window, 'location', {
        value: {
          href: 'http://localhost:3000/page',
          hostname: 'localhost',
          protocol: 'http:',
        },
        writable: true,
        configurable: true,
      });

      const config: Config = {
        integrations: {
          custom: {
            collectApiUrl: 'http://localhost:3000/collect',
            allowHttp: false,
          },
        },
      };

      // This should return empty string because HTTP is not allowed
      const result = getCollectApiUrls(config);
      expect(result.custom).toBe('');
    });

    test('should prioritize tracelog projectId over custom collectApiUrl', () => {
      const config: Config = {
        integrations: {
          tracelog: {
            projectId: 'project-1',
          },
          custom: {
            collectApiUrl: 'https://api.custom.com/collect',
          },
        },
      };

      const result = getCollectApiUrls(config);

      // Both URLs should be returned when both integrations configured
      expect(result.saas).toBe('https://project-1.example.com/collect');
      expect(result.custom).toBe('https://api.custom.com/collect');
    });

    test('should throw error when domain parts are invalid', () => {
      Object.defineProperty(window, 'location', {
        value: {
          href: 'https://',
          hostname: '',
          protocol: 'https:',
        },
        writable: true,
        configurable: true,
      });

      const config: Config = {
        integrations: {
          tracelog: {
            projectId: 'test',
          },
        },
      };

      const result = getCollectApiUrls(config);
      expect(result.saas).toBe('');
    });
  });
});
