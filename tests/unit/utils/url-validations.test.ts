import { describe, test, expect } from 'vitest';
import { isValidUrl, validateUrl } from '@/utils/validations/url-validations.utils';

describe('URL Validations Utils', () => {
  describe('isValidUrl', () => {
    test('should accept valid HTTPS URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('https://example.com/path')).toBe(true);
      expect(isValidUrl('https://subdomain.example.com')).toBe(true);
      expect(isValidUrl('https://example.com:8080')).toBe(true);
    });

    test('should reject HTTP URLs by default', () => {
      expect(isValidUrl('http://example.com')).toBe(false);
      expect(isValidUrl('http://example.com/path')).toBe(false);
    });

    test('should accept HTTP URLs when allowHttp is true', () => {
      expect(isValidUrl('http://example.com', true)).toBe(true);
      expect(isValidUrl('http://example.com/path', true)).toBe(true);
    });

    test('should reject invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('ftp://example.com')).toBe(false);
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('javascript:alert(1)')).toBe(false);
    });

    test('should reject relative URLs', () => {
      expect(isValidUrl('/path')).toBe(false);
      expect(isValidUrl('./path')).toBe(false);
      expect(isValidUrl('../path')).toBe(false);
    });
  });

  describe('validateUrl', () => {
    test('should not add errors for valid HTTPS URLs', () => {
      const errors: string[] = [];
      validateUrl('https://example.com', false, 'testUrl', errors);

      expect(errors).toHaveLength(0);
    });

    test('should add error for HTTP URL when allowHttp is false', () => {
      const errors: string[] = [];
      validateUrl('http://example.com', false, 'testUrl', errors);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('testUrl using http requires allowHttp=true');
    });

    test('should not add error for HTTP URL when allowHttp is true', () => {
      const errors: string[] = [];
      validateUrl('http://example.com', true, 'testUrl', errors);

      expect(errors).toHaveLength(0);
    });

    test('should add error for invalid URL', () => {
      const errors: string[] = [];
      validateUrl('not-a-url', false, 'testUrl', errors);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('testUrl must be a valid URL');
    });

    test('should add error for non-string URL', () => {
      const errors: string[] = [];
      validateUrl(123, false, 'testUrl', errors);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('testUrl must be a string');
    });

    test('should not validate undefined URLs', () => {
      const errors: string[] = [];
      validateUrl(undefined, false, 'testUrl', errors);

      expect(errors).toHaveLength(0);
    });

    test('should add error for null URLs', () => {
      const errors: string[] = [];
      validateUrl(null, false, 'testUrl', errors);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('testUrl must be a string');
    });
  });
});