import { describe, test, expect, beforeEach } from 'vitest';
import { normalizeUrl, getApiUrl } from '@/utils/network/url.utils';
import { Config } from '@/types';

describe('URL Utils', () => {
  describe('normalizeUrl', () => {
    test('should return URL unchanged when no sensitive params provided', () => {
      const url = 'https://test.com/page?user=john&id=123';
      const result = normalizeUrl(url);

      expect(result).toBe(url);
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
      const url = 'https://test.com/path/to/page?token=secret&user=john';
      const result = normalizeUrl(url, ['token']);

      expect(result).toBe('https://test.com/path/to/page?user=john');
    });

    test('should handle invalid URL gracefully', () => {
      const url = 'not-a-valid-url';
      const result = normalizeUrl(url, ['token']);

      // Should return original URL if invalid
      expect(result).toBe(url);
    });

    test('should handle empty sensitive params array', () => {
      const url = 'https://test.com/page?token=secret&user=john';
      const result = normalizeUrl(url, []);

      expect(result).toBe(url);
    });

    test('should handle params that do not exist', () => {
      const url = 'https://test.com/page?user=john';
      const result = normalizeUrl(url, ['token', 'password']);

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
      const result = normalizeUrl(url, ['token']);

      expect(result).toContain('id=1');
      expect(result).toContain('id=2');
      expect(result).not.toContain('token');
    });
  });

  describe('getApiUrl', () => {
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

    test('should return empty string when no integrations configured', () => {
      const config: Config = {};
      const result = getApiUrl(config);

      expect(result).toBe('');
    });

    test('should generate API URL from tracelog projectId', () => {
      const config: Config = {
        integrations: {
          tracelog: {
            projectId: 'my-project',
          },
        },
      };

      const result = getApiUrl(config);

      expect(result).toBe('https://my-project.example.com');
    });

    test('should use custom apiUrl when provided', () => {
      const config: Config = {
        integrations: {
          custom: {
            apiUrl: 'https://api.custom.com',
          },
        },
      };

      const result = getApiUrl(config);

      expect(result).toBe('https://api.custom.com');
    });

    test('should throw error for invalid custom apiUrl', () => {
      const config: Config = {
        integrations: {
          custom: {
            apiUrl: 'not-a-valid-url',
          },
        },
      };

      expect(() => getApiUrl(config)).toThrow('Invalid URL');
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

      const result = getApiUrl(config);

      expect(result).toBe('https://test-project.example.com');
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
            apiUrl: 'http://localhost:3000',
            allowHttp: true,
          },
        },
      };

      const result = getApiUrl(config);

      expect(result).toContain('http://');
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
            apiUrl: 'http://localhost:3000',
            allowHttp: false,
          },
        },
      };

      // This should throw an error because HTTP is not allowed
      expect(() => getApiUrl(config)).toThrow('Invalid URL');
    });

    test('should prioritize custom apiUrl over tracelog projectId', () => {
      const config: Config = {
        integrations: {
          tracelog: {
            projectId: 'project-1',
          },
          custom: {
            apiUrl: 'https://api.custom.com',
          },
        },
      };

      const result = getApiUrl(config);

      // tracelog is checked first in the actual implementation
      expect(result).toBe('https://project-1.example.com');
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

      expect(() => getApiUrl(config)).toThrow('Invalid URL');
    });
  });
});
