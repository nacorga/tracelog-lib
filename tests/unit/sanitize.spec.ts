import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { sanitizeString, sanitizeMetadata } from '@/utils/security/sanitize.utils';
import { MAX_STRING_LENGTH } from '@/constants';

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

  describe('Cross-Function Integration', () => {
    it('should consistently handle XSS across sanitization functions', () => {
      const xssPayload = '<script>alert(1)</script>';
      expect(sanitizeString(xssPayload)).not.toContain('<script>');

      const metadata = { field: xssPayload };
      const result = sanitizeMetadata(metadata);
      expect(JSON.stringify(result)).not.toContain('<script>');
    });

    it('should consistently handle length limits', () => {
      const longString = 'a'.repeat(MAX_STRING_LENGTH + 100);
      expect(sanitizeString(longString).length).toBeLessThanOrEqual(MAX_STRING_LENGTH);
    });

    it('should handle null/undefined consistently', () => {
      expect(sanitizeString(null as any)).toBe('');
      expect(sanitizeMetadata(null)).toEqual({});
    });
  });
});
