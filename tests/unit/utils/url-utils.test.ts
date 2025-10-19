import { describe, test, expect, beforeEach } from 'vitest';
import { normalizeUrl, getCollectApiUrls } from '../../../src/utils/network/url.utils';
import type { Config } from '../../../src/types';

describe('URL Utils', () => {
  describe('getCollectApiUrls', () => {
    beforeEach(() => {
      // Mock window.location for SaaS URL generation
      delete (window as any).location;
      (window as any).location = {
        href: 'https://app.example.com/page',
        hostname: 'app.example.com',
      };
    });

    describe('SaaS URL generation (generateSaasApiUrl)', () => {
      test('should generate valid SaaS URL from project ID', () => {
        const config: Config = {
          integrations: {
            tracelog: {
              projectId: 'test-project',
            },
          },
        };

        const result = getCollectApiUrls(config);

        expect(result.saas).toBe('https://test-project.example.com/collect');
        expect(result.custom).toBeUndefined();
      });

      test('should handle subdomain and generate correct SaaS URL', () => {
        (window as any).location = {
          href: 'https://subdomain.app.example.com/page',
          hostname: 'subdomain.app.example.com',
        };

        const config: Config = {
          integrations: {
            tracelog: {
              projectId: 'my-project',
            },
          },
        };

        const result = getCollectApiUrls(config);

        // Should use last 2 parts of domain
        expect(result.saas).toBe('https://my-project.example.com/collect');
      });

      test('should throw error for invalid hostname (empty string)', () => {
        (window as any).location = {
          href: 'about:blank',
          hostname: '',
        };

        const config: Config = {
          integrations: {
            tracelog: {
              projectId: 'test-project',
            },
          },
        };

        expect(() => getCollectApiUrls(config)).toThrow('Invalid SaaS URL configuration');
      });

      test('should generate URL for localhost (single-part domain)', () => {
        // Note: localhost is technically valid, generates https://project-id.localhost/collect
        (window as any).location = {
          href: 'http://localhost:3000',
          hostname: 'localhost',
        };

        const config: Config = {
          integrations: {
            tracelog: {
              projectId: 'test-project',
            },
          },
        };

        const result = getCollectApiUrls(config);

        // Single-part domain still works (uses 'localhost' as domain)
        expect(result.saas).toBe('https://test-project.localhost/collect');
      });
    });

    describe('Custom backend URL validation', () => {
      test('should accept valid HTTPS custom URL', () => {
        const config: Config = {
          integrations: {
            custom: {
              collectApiUrl: 'https://api.custom.com/collect',
            },
          },
        };

        const result = getCollectApiUrls(config);

        expect(result.custom).toBe('https://api.custom.com/collect');
        expect(result.saas).toBeUndefined();
      });

      test('should reject HTTP custom URL by default', () => {
        const config: Config = {
          integrations: {
            custom: {
              collectApiUrl: 'http://api.custom.com/collect',
            },
          },
        };

        expect(() => getCollectApiUrls(config)).toThrow('Invalid custom API URL');
      });

      test('should accept HTTP custom URL when allowHttp is true', () => {
        const config: Config = {
          integrations: {
            custom: {
              collectApiUrl: 'http://localhost:3000/collect',
              allowHttp: true,
            },
          },
        };

        const result = getCollectApiUrls(config);

        expect(result.custom).toBe('http://localhost:3000/collect');
      });

      test('should reject invalid custom URL', () => {
        const config: Config = {
          integrations: {
            custom: {
              collectApiUrl: 'not-a-valid-url',
            },
          },
        };

        expect(() => getCollectApiUrls(config)).toThrow('Invalid custom API URL');
      });

      test('should skip empty custom URL (falsy check)', () => {
        const config: Config = {
          integrations: {
            custom: {
              collectApiUrl: '',
            },
          },
        };

        const result = getCollectApiUrls(config);

        // Empty string is falsy, so it's skipped
        expect(result.custom).toBeUndefined();
      });
    });

    describe('Multi-integration configuration', () => {
      test('should return both SaaS and custom URLs when configured', () => {
        const config: Config = {
          integrations: {
            tracelog: {
              projectId: 'my-project',
            },
            custom: {
              collectApiUrl: 'https://warehouse.example.com/events',
            },
          },
        };

        const result = getCollectApiUrls(config);

        expect(result.saas).toBe('https://my-project.example.com/collect');
        expect(result.custom).toBe('https://warehouse.example.com/events');
      });

      test('should handle SaaS-only configuration', () => {
        const config: Config = {
          integrations: {
            tracelog: {
              projectId: 'solo-project',
            },
          },
        };

        const result = getCollectApiUrls(config);

        expect(result.saas).toBe('https://solo-project.example.com/collect');
        expect(result.custom).toBeUndefined();
      });

      test('should handle custom-only configuration', () => {
        const config: Config = {
          integrations: {
            custom: {
              collectApiUrl: 'https://api.mybackend.com/analytics',
            },
          },
        };

        const result = getCollectApiUrls(config);

        expect(result.saas).toBeUndefined();
        expect(result.custom).toBe('https://api.mybackend.com/analytics');
      });
    });

    describe('Empty configuration', () => {
      test('should return empty object when no integrations configured', () => {
        const config: Config = {};

        const result = getCollectApiUrls(config);

        expect(result).toEqual({});
        expect(result.saas).toBeUndefined();
        expect(result.custom).toBeUndefined();
      });

      test('should return empty object when integrations object is empty', () => {
        const config: Config = {
          integrations: {},
        };

        const result = getCollectApiUrls(config);

        expect(result).toEqual({});
      });
    });
  });

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
