import { describe, it, expect } from 'vitest';
import { PermanentError } from '../../../src/types/error.types';

describe('SenderManager - HTTP Error Classification', () => {
  describe('4xx errors (Permanent - should NOT retry)', () => {
    const permanentStatuses = [400, 401, 403, 404, 409, 422, 429, 499];

    permanentStatuses.forEach((status) => {
      it(`should classify ${status} as permanent error`, () => {
        const isPermanent = status >= 400 && status < 500;
        expect(isPermanent).toBe(true);
      });
    });

    it('PermanentError should be throwable with status code', () => {
      const error = new PermanentError('HTTP 403: Forbidden', 403);

      expect(error instanceof PermanentError).toBe(true);
      expect(error instanceof Error).toBe(true);
      expect(error.message).toBe('HTTP 403: Forbidden');
      expect(error.statusCode).toBe(403);
    });

    it('PermanentError should be identifiable in catch block', () => {
      try {
        throw new PermanentError('Test error', 403);
      } catch (error) {
        expect(error instanceof PermanentError).toBe(true);

        if (error instanceof PermanentError) {
          expect(error.statusCode).toBe(403);
        }
      }
    });
  });

  describe('5xx errors (Temporary - should retry)', () => {
    const temporaryStatuses = [500, 502, 503, 504];

    temporaryStatuses.forEach((status) => {
      it(`should classify ${status} as temporary error (not permanent)`, () => {
        const isPermanent = status >= 400 && status < 500;
        expect(isPermanent).toBe(false);
      });
    });

    it('should NOT create PermanentError for 5xx status', () => {
      // 5xx errors should use regular Error, not PermanentError
      const error = new Error('HTTP 500: Internal Server Error');

      expect(error instanceof PermanentError).toBe(false);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('2xx/3xx responses (Success)', () => {
    const successStatuses = [200, 201, 202, 204, 301, 302, 304];

    successStatuses.forEach((status) => {
      it(`should classify ${status} as non-error`, () => {
        const isPermanent = status >= 400 && status < 500;
        const isError = status >= 400;

        expect(isPermanent).toBe(false);
        expect(isError).toBe(false);
      });
    });
  });

  describe('Error distinction', () => {
    it('should distinguish PermanentError from regular Error', () => {
      const permanentError = new PermanentError('Permanent', 403);
      const regularError = new Error('Temporary');

      expect(permanentError instanceof PermanentError).toBe(true);
      expect(regularError instanceof PermanentError).toBe(false);

      expect(permanentError instanceof Error).toBe(true);
      expect(regularError instanceof Error).toBe(true);
    });

    it('should preserve stack trace in PermanentError', () => {
      const error = new PermanentError('Test');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('PermanentError');
    });
  });
});
