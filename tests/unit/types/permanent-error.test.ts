import { describe, it, expect } from 'vitest';
import { PermanentError } from '../../../src/types/error.types';

describe('PermanentError', () => {
  describe('constructor', () => {
    it('should create error with message', () => {
      const error = new PermanentError('HTTP 403: Forbidden');

      expect(error.message).toBe('HTTP 403: Forbidden');
      expect(error.name).toBe('PermanentError');
      expect(error instanceof Error).toBe(true);
      expect(error instanceof PermanentError).toBe(true);
    });

    it('should create error with message and status code', () => {
      const error = new PermanentError('HTTP 403: Forbidden', 403);

      expect(error.message).toBe('HTTP 403: Forbidden');
      expect(error.statusCode).toBe(403);
      expect(error.name).toBe('PermanentError');
    });

    it('should preserve stack trace', () => {
      const error = new PermanentError('Test error');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('PermanentError');
    });
  });

  describe('instanceof checks', () => {
    it('should be identifiable as PermanentError', () => {
      const error = new PermanentError('Test');

      expect(error instanceof PermanentError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it('should be distinguishable from regular Error', () => {
      const permanentError = new PermanentError('Test');
      const regularError = new Error('Test');

      expect(permanentError instanceof PermanentError).toBe(true);
      expect(regularError instanceof PermanentError).toBe(false);
    });
  });

  describe('status codes', () => {
    it('should handle common 4xx status codes', () => {
      const codes = [400, 401, 403, 404, 422, 429];

      codes.forEach((code) => {
        const error = new PermanentError(`HTTP ${code}`, code);
        expect(error.statusCode).toBe(code);
      });
    });

    it('should handle undefined status code', () => {
      const error = new PermanentError('Generic permanent error');

      expect(error.statusCode).toBeUndefined();
    });
  });
});
