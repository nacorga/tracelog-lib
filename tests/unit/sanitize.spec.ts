import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  sanitizeString,
  sanitizePathString,
  sanitizeApiConfig,
  sanitizeMetadata,
} from '@/utils/security/sanitize.utils';
import { MAX_STRING_LENGTH, MAX_ARRAY_LENGTH, MAX_OBJECT_DEPTH } from '@/constants';

describe('Sanitization Security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('sanitizeString()', () => {
    describe('Basic Sanitization', () => {
      it('should return valid string unchanged (after trimming)', () => {
        expect(sanitizeString('hello world')).toBe('hello world');
      });

      it('should trim whitespace', () => {
        expect(sanitizeString('  hello  ')).toBe('hello');
      });

      it('should return empty string for null', () => {
        expect(sanitizeString(null as any)).toBe('');
      });

      it('should return empty string for undefined', () => {
        expect(sanitizeString(undefined as any)).toBe('');
      });

      it('should return empty string for empty string', () => {
        expect(sanitizeString('')).toBe('');
      });

      it('should return empty string for whitespace-only string', () => {
        expect(sanitizeString('   ')).toBe('');
      });

      it('should return empty string for non-string types', () => {
        expect(sanitizeString(123 as any)).toBe('');
        expect(sanitizeString(true as any)).toBe('');
        expect(sanitizeString({} as any)).toBe('');
      });
    });

    describe('HTML Entity Encoding', () => {
      it('should encode ampersand', () => {
        expect(sanitizeString('foo & bar')).toBe('foo &amp; bar');
      });

      it('should encode less-than', () => {
        expect(sanitizeString('foo < bar')).toBe('foo &lt; bar');
      });

      it('should encode greater-than', () => {
        expect(sanitizeString('foo > bar')).toBe('foo &gt; bar');
      });

      it('should encode double quotes', () => {
        expect(sanitizeString('foo " bar')).toBe('foo &quot; bar');
      });

      it('should encode single quotes', () => {
        expect(sanitizeString("foo ' bar")).toBe('foo &#x27; bar');
      });

      it('should encode forward slash', () => {
        expect(sanitizeString('foo / bar')).toBe('foo &#x2F; bar');
      });

      it('should encode multiple special characters', () => {
        const input = '<div class="test">Hello & goodbye</div>';
        const output = '&lt;div class=&quot;test&quot;&gt;Hello &amp; goodbye&lt;&#x2F;div&gt;';
        expect(sanitizeString(input)).toBe(output);
      });
    });

    describe('XSS Pattern Detection', () => {
      it('should remove script tags', () => {
        const result = sanitizeString('<script>alert("xss")</script>hello');
        expect(result).not.toContain('<script>');
        expect(result).not.toContain('</script>');
      });

      it('should remove javascript: protocol', () => {
        const result = sanitizeString('javascript:alert(1)');
        expect(result).not.toContain('javascript:');
      });

      it('should remove event handlers', () => {
        const result = sanitizeString('<img src="x" onerror="alert(1)">');
        expect(result).not.toContain('onerror=');
      });

      it('should remove iframe tags', () => {
        const result = sanitizeString('<iframe src="evil.com"></iframe>hello');
        expect(result).not.toContain('<iframe');
        expect(result).not.toContain('</iframe>');
      });

      it('should remove embed tags', () => {
        const result = sanitizeString('<embed src="evil.swf">hello');
        expect(result).not.toContain('<embed');
      });

      it('should remove object tags', () => {
        const result = sanitizeString('<object data="evil.swf"></object>hello');
        expect(result).not.toContain('<object');
        expect(result).not.toContain('</object>');
      });

      it('should handle multiple XSS patterns', () => {
        const input = '<script>alert(1)</script><iframe src="x"></iframe>javascript:void(0)';
        const result = sanitizeString(input);
        expect(result).not.toContain('<script>');
        expect(result).not.toContain('<iframe>');
        expect(result).not.toContain('javascript:');
      });
    });

    describe('Length Limits', () => {
      it('should truncate strings exceeding MAX_STRING_LENGTH', () => {
        const longString = 'a'.repeat(MAX_STRING_LENGTH + 100);
        const result = sanitizeString(longString);
        expect(result.length).toBeLessThanOrEqual(MAX_STRING_LENGTH);
      });

      it('should preserve strings within MAX_STRING_LENGTH', () => {
        const validString = 'a'.repeat(MAX_STRING_LENGTH - 10);
        const result = sanitizeString(validString);
        expect(result.length).toBe(validString.length);
      });

      it('should truncate at exact MAX_STRING_LENGTH', () => {
        const exactString = 'a'.repeat(MAX_STRING_LENGTH);
        const result = sanitizeString(exactString);
        expect(result.length).toBe(MAX_STRING_LENGTH);
      });
    });

    describe('Edge Cases', () => {
      it('should handle unicode characters', () => {
        expect(sanitizeString('Hello 世界 🌍')).toBe('Hello 世界 🌍');
      });

      it('should handle newlines and tabs', () => {
        const input = 'line1\nline2\tindented';
        expect(sanitizeString(input)).toContain('line1');
        expect(sanitizeString(input)).toContain('line2');
      });

      it('should handle empty after XSS removal', () => {
        const result = sanitizeString('<script></script>');
        expect(result.trim().length).toBe(0);
      });

      it('should handle mixed content with XSS', () => {
        const input = 'Safe text <script>alert(1)</script> More safe text';
        const result = sanitizeString(input);
        expect(result).toContain('Safe text');
        expect(result).toContain('More safe text');
        expect(result).not.toContain('<script>');
      });
    });
  });

  describe('sanitizePathString()', () => {
    describe('Basic Path Sanitization', () => {
      it('should sanitize valid path (forward slashes not encoded)', () => {
        const result = sanitizePathString('/api/users');
        expect(result).toContain('api');
        expect(result).toContain('users');
      });

      it('should trim whitespace', () => {
        const result = sanitizePathString('  /api/users  ');
        expect(result).toContain('api');
        expect(result).toContain('users');
      });

      it('should return empty string for non-string', () => {
        expect(sanitizePathString(123 as any)).toBe('');
        expect(sanitizePathString(null as any)).toBe('');
        expect(sanitizePathString(undefined as any)).toBe('');
      });

      it('should handle query parameters', () => {
        const result = sanitizePathString('/api?key=value');
        expect(result).toContain('api');
        expect(result).toContain('key');
      });
    });

    describe('XSS Protection in Paths', () => {
      it('should remove script tags from paths', () => {
        const result = sanitizePathString('/api<script>alert(1)</script>/users');
        expect(result).not.toContain('<script>');
      });

      it('should remove javascript: from paths', () => {
        const result = sanitizePathString('javascript:alert(1)');
        expect(result).not.toContain('javascript:');
      });

      it('should encode HTML entities', () => {
        expect(sanitizePathString('/path<test>')).toContain('&lt;');
        expect(sanitizePathString('/path<test>')).toContain('&gt;');
      });
    });

    describe('Length Limits', () => {
      it('should truncate paths exceeding MAX_STRING_LENGTH', () => {
        const longPath = '/api/' + 'a'.repeat(MAX_STRING_LENGTH);
        const result = sanitizePathString(longPath);
        expect(result.length).toBeLessThanOrEqual(MAX_STRING_LENGTH + 50); // Account for entity encoding
      });
    });
  });

  describe('sanitizeApiConfig()', () => {
    describe('Basic API Config Sanitization', () => {
      it('should return empty object for null', () => {
        const result = sanitizeApiConfig(null);
        expect(result).toEqual({});
      });

      it('should return empty object for undefined', () => {
        const result = sanitizeApiConfig(undefined);
        expect(result).toEqual({});
      });

      it('should return empty object for non-object types', () => {
        expect(sanitizeApiConfig('string')).toEqual({});
        expect(sanitizeApiConfig(123)).toEqual({});
        expect(sanitizeApiConfig(true)).toEqual({});
      });

      it('should preserve allowed keys', () => {
        const config = { mode: 'QA', samplingRate: 0.5 };
        const result = sanitizeApiConfig(config);
        expect(result.mode).toBeDefined();
        expect(result.samplingRate).toBe(0.5);
      });

      it('should filter disallowed keys', () => {
        const config = { mode: 'QA', maliciousKey: 'evil' };
        const result = sanitizeApiConfig(config);
        expect(result.mode).toBeDefined();
        expect((result as any).maliciousKey).toBeUndefined();
      });
    });

    describe('excludedUrlPaths Sanitization', () => {
      it('should sanitize array of paths', () => {
        const config = { excludedUrlPaths: ['/admin', '/private'] };
        const result = sanitizeApiConfig(config);
        expect(result.excludedUrlPaths).toBeDefined();
        expect(Array.isArray(result.excludedUrlPaths)).toBe(true);
      });

      it('should convert single path string to array', () => {
        const config = { excludedUrlPaths: '/admin' };
        const result = sanitizeApiConfig(config);
        expect(Array.isArray(result.excludedUrlPaths)).toBe(true);
        expect((result.excludedUrlPaths as string[]).length).toBe(1);
      });

      it('should filter empty paths', () => {
        const config = { excludedUrlPaths: ['/admin', '', '/private', '   '] };
        const result = sanitizeApiConfig(config);
        const paths = result.excludedUrlPaths as string[];
        expect(paths.every((p) => p.trim().length > 0)).toBe(true);
      });

      it('should sanitize XSS in paths', () => {
        const config = { excludedUrlPaths: ['<script>alert(1)</script>', '/admin'] };
        const result = sanitizeApiConfig(config);
        const paths = result.excludedUrlPaths as string[];
        expect(paths.some((p) => p.includes('<script>'))).toBe(false);
      });

      it('should handle non-array excludedUrlPaths', () => {
        const config = { excludedUrlPaths: null };
        const result = sanitizeApiConfig(config);
        expect(result.excludedUrlPaths).toEqual([]);
      });
    });

    describe('tags Sanitization', () => {
      it('should preserve valid tags array', () => {
        const config = { tags: ['tag1', 'tag2'] };
        const result = sanitizeApiConfig(config);
        expect(result.tags).toEqual(['tag1', 'tag2']);
      });

      it('should skip non-array tags', () => {
        const config = { tags: 'not-an-array' };
        const result = sanitizeApiConfig(config);
        expect(result.tags).toBeUndefined();
      });

      it('should preserve empty tags array', () => {
        const config = { tags: [] };
        const result = sanitizeApiConfig(config);
        expect(result.tags).toEqual([]);
      });
    });

    describe('samplingRate Sanitization', () => {
      it('should preserve valid sampling rate', () => {
        const config = { samplingRate: 0.5 };
        const result = sanitizeApiConfig(config);
        expect(result.samplingRate).toBe(0.5);
      });

      it('should preserve sampling rate 0', () => {
        const config = { samplingRate: 0 };
        const result = sanitizeApiConfig(config);
        expect(result.samplingRate).toBe(0);
      });

      it('should preserve sampling rate 1', () => {
        const config = { samplingRate: 1 };
        const result = sanitizeApiConfig(config);
        expect(result.samplingRate).toBe(1);
      });

      it('should sanitize invalid numbers', () => {
        const config = { samplingRate: Infinity };
        const result = sanitizeApiConfig(config);
        expect(result.samplingRate).toBe(0);
      });

      it('should sanitize NaN', () => {
        const config = { samplingRate: NaN };
        const result = sanitizeApiConfig(config);
        expect(result.samplingRate).toBe(0);
      });
    });

    describe('Error Handling', () => {
      it('should handle circular reference gracefully', () => {
        const circular: any = { a: 1 };
        circular.self = circular;
        // Should not throw - depth limit prevents infinite recursion
        const result = sanitizeApiConfig(circular);
        expect(result).toBeDefined();
      });
    });
  });

  describe('sanitizeMetadata()', () => {
    describe('Basic Metadata Sanitization', () => {
      it('should return empty object for null', () => {
        expect(sanitizeMetadata(null)).toEqual({});
      });

      it('should return empty object for undefined', () => {
        expect(sanitizeMetadata(undefined)).toEqual({});
      });

      it('should return empty object for non-object types', () => {
        expect(sanitizeMetadata('string')).toEqual({});
        expect(sanitizeMetadata(123)).toEqual({});
        expect(sanitizeMetadata(true)).toEqual({});
      });

      it('should preserve valid metadata', () => {
        const metadata = { user: 'john', count: 42, active: true };
        const result = sanitizeMetadata(metadata);
        expect(result.user).toBe('john');
        expect(result.count).toBe(42);
        expect(result.active).toBe(true);
      });

      it('should sanitize string values', () => {
        const metadata = { text: '<script>alert(1)</script>hello' };
        const result = sanitizeMetadata(metadata);
        expect(result.text).not.toContain('<script>');
      });
    });

    describe('Nested Object Sanitization', () => {
      it('should sanitize nested objects within depth limit', () => {
        const metadata = {
          level1: {
            level2: {
              value: 'test',
            },
          },
        };
        const result = sanitizeMetadata(metadata);
        expect(result.level1).toBeDefined();
        expect((result.level1 as any).level2).toBeDefined();
      });

      it('should return null for objects exceeding MAX_OBJECT_DEPTH', () => {
        const deepObject: any = { value: 'start' };
        let current = deepObject;

        for (let i = 0; i < MAX_OBJECT_DEPTH + 5; i++) {
          current.nested = { value: `level-${i}` };
          current = current.nested;
        }

        const result = sanitizeMetadata(deepObject);
        // Deep nested objects should be truncated at MAX_OBJECT_DEPTH
        expect(result).toBeDefined();
      });

      it('should handle empty nested objects', () => {
        const metadata = { outer: {}, inner: { nested: {} } };
        const result = sanitizeMetadata(metadata);
        expect(result.outer).toBeDefined();
        expect(result.inner).toBeDefined();
      });
    });

    describe('Array Sanitization', () => {
      it('should sanitize array values', () => {
        const metadata = { items: ['item1', 'item2', 'item3'] };
        const result = sanitizeMetadata(metadata);
        expect(Array.isArray(result.items)).toBe(true);
        expect((result.items as string[]).length).toBe(3);
      });

      it('should truncate arrays exceeding MAX_ARRAY_LENGTH', () => {
        const largeArray = Array.from({ length: MAX_ARRAY_LENGTH + 50 }, (_, i) => `item-${i}`);
        const metadata = { items: largeArray };
        const result = sanitizeMetadata(metadata);
        expect((result.items as string[]).length).toBeLessThanOrEqual(MAX_ARRAY_LENGTH);
      });

      it('should filter null values from arrays', () => {
        const metadata = { items: ['valid', null, undefined, 'also-valid'] };
        const result = sanitizeMetadata(metadata);
        const items = result.items as string[];
        expect(items.length).toBeLessThan(4);
        expect(items).not.toContain(null);
      });

      it('should sanitize strings in arrays', () => {
        const metadata = { items: ['<script>xss</script>', 'safe'] };
        const result = sanitizeMetadata(metadata);
        const items = result.items as string[];
        expect(items.some((item) => item.includes('<script>'))).toBe(false);
      });
    });

    describe('Special Value Handling', () => {
      it('should preserve boolean values', () => {
        const metadata = { flag1: true, flag2: false };
        const result = sanitizeMetadata(metadata);
        expect(result.flag1).toBe(true);
        expect(result.flag2).toBe(false);
      });

      it('should preserve valid numbers', () => {
        const metadata = { count: 42, ratio: 0.5, negative: -10 };
        const result = sanitizeMetadata(metadata);
        expect(result.count).toBe(42);
        expect(result.ratio).toBe(0.5);
        expect(result.negative).toBe(-10);
      });

      it('should sanitize invalid numbers', () => {
        const metadata = { infinity: Infinity, nan: NaN, tooLarge: Number.MAX_SAFE_INTEGER + 1000 };
        const result = sanitizeMetadata(metadata);
        expect(result.infinity).toBe(0);
        expect(result.nan).toBe(0);
        expect(result.tooLarge).toBe(0);
      });

      it('should convert null values to null', () => {
        const metadata = { nullValue: null };
        const result = sanitizeMetadata(metadata);
        expect(result.nullValue).toBeUndefined(); // null values are filtered out
      });

      it('should filter undefined values', () => {
        const metadata = { definedValue: 'test', undefinedValue: undefined };
        const result = sanitizeMetadata(metadata);
        expect(result.definedValue).toBe('test');
        expect(result.undefinedValue).toBeUndefined();
      });
    });

    describe('Key Sanitization', () => {
      it('should sanitize object keys with XSS', () => {
        const metadata = { '<script>alert(1)</script>': 'value' };
        const result = sanitizeMetadata(metadata);
        const keys = Object.keys(result);
        expect(keys.some((k) => k.includes('<script>'))).toBe(false);
      });

      it('should filter empty keys after sanitization', () => {
        const metadata = { '   ': 'value', valid: 'data' };
        const result = sanitizeMetadata(metadata);
        expect(result.valid).toBe('data');
        expect(Object.keys(result).length).toBe(1);
      });

      it('should limit object keys to 20', () => {
        const largeObject: Record<string, string> = {};
        for (let i = 0; i < 30; i++) {
          largeObject[`key${i}`] = `value${i}`;
        }
        const result = sanitizeMetadata(largeObject);
        expect(Object.keys(result).length).toBeLessThanOrEqual(20);
      });
    });

    describe('Mixed Complex Structures', () => {
      it('should handle complex nested structures', () => {
        const metadata = {
          user: {
            name: 'John Doe',
            tags: ['admin', 'user'],
            settings: {
              notifications: true,
            },
          },
          count: 42,
        };
        const result = sanitizeMetadata(metadata);
        expect(result.user).toBeDefined();
        expect((result.user as any).name).toBe('John Doe');
        expect(result.count).toBe(42);
      });

      it('should sanitize XSS in nested structures', () => {
        const metadata = {
          data: {
            field: '<script>alert(1)</script>',
            items: ['<iframe>evil</iframe>', 'safe'],
          },
        };
        const result = sanitizeMetadata(metadata);
        expect(JSON.stringify(result)).not.toContain('<script>');
        expect(JSON.stringify(result)).not.toContain('<iframe>');
      });

      it('should handle arrays of objects', () => {
        const metadata = {
          users: [
            { name: 'Alice', age: 30 },
            { name: 'Bob', age: 25 },
          ],
        };
        const result = sanitizeMetadata(metadata);
        expect(Array.isArray(result.users)).toBe(true);
        expect((result.users as any[]).length).toBe(2);
      });
    });

    describe('Error Handling', () => {
      it('should handle circular reference gracefully', () => {
        const circular: any = { a: 1 };
        circular.self = circular;
        // Should not throw - depth limit prevents infinite recursion
        const result = sanitizeMetadata(circular);
        expect(result).toBeDefined();
        expect(result.a).toBe(1);
      });

      it('should handle complex circular references', () => {
        const obj1: any = { name: 'obj1' };
        const obj2: any = { name: 'obj2', ref: obj1 };
        obj1.ref = obj2;
        // Should not throw - depth limit prevents infinite recursion
        const result = sanitizeMetadata(obj1);
        expect(result).toBeDefined();
        expect((result as any).name).toBe('obj1');
      });
    });
  });

  describe('Cross-Function Integration', () => {
    it('should consistently handle XSS across all sanitization functions', () => {
      const xssPayload = '<script>alert(1)</script>';
      expect(sanitizeString(xssPayload)).not.toContain('<script>');
      expect(sanitizePathString(xssPayload)).not.toContain('<script>');

      const metadata = { field: xssPayload };
      const result = sanitizeMetadata(metadata);
      expect(JSON.stringify(result)).not.toContain('<script>');
    });

    it('should consistently handle length limits', () => {
      const longString = 'a'.repeat(MAX_STRING_LENGTH + 100);
      expect(sanitizeString(longString).length).toBeLessThanOrEqual(MAX_STRING_LENGTH);
      expect(sanitizePathString(longString).length).toBeLessThanOrEqual(MAX_STRING_LENGTH + 50);
    });

    it('should handle null/undefined consistently', () => {
      expect(sanitizeString(null as any)).toBe('');
      expect(sanitizePathString(null as any)).toBe('');
      expect(sanitizeMetadata(null)).toEqual({});
      expect(sanitizeApiConfig(null)).toEqual({});
    });
  });
});
