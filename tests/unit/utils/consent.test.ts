import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadConsentFromStorage } from '../../../src/utils/consent.utils';
import { CONSENT_KEY } from '../../../src/constants/storage.constants';
import * as loggingUtils from '../../../src/utils/logging.utils';

describe('consent.utils', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('loadConsentFromStorage', () => {
    describe('valid consent data', () => {
      it('should return consent state when valid data exists', () => {
        const validConsent = {
          state: {
            google: true,
            custom: false,
            tracelog: true,
          },
          expiresAt: Date.now() + 86400000,
        };

        localStorage.setItem(CONSENT_KEY, JSON.stringify(validConsent));

        const result = loadConsentFromStorage();

        expect(result).toEqual({
          google: true,
          custom: false,
          tracelog: true,
        });
      });

      it('should convert all values to boolean', () => {
        const consent = {
          state: {
            google: 1,
            custom: 0,
            tracelog: 'yes',
          },
          expiresAt: Date.now() + 86400000,
        };

        localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));

        const result = loadConsentFromStorage();

        expect(result).toEqual({
          google: true,
          custom: false,
          tracelog: true,
        });
      });

      it('should handle all false consent values', () => {
        const consent = {
          state: {
            google: false,
            custom: false,
            tracelog: false,
          },
          expiresAt: Date.now() + 86400000,
        };

        localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));

        const result = loadConsentFromStorage();

        expect(result).toEqual({
          google: false,
          custom: false,
          tracelog: false,
        });
      });

      it('should handle all true consent values', () => {
        const consent = {
          state: {
            google: true,
            custom: true,
            tracelog: true,
          },
          expiresAt: Date.now() + 86400000,
        };

        localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));

        const result = loadConsentFromStorage();

        expect(result).toEqual({
          google: true,
          custom: true,
          tracelog: true,
        });
      });
    });

    describe('no stored data', () => {
      it('should return null when no data exists in localStorage', () => {
        const result = loadConsentFromStorage();

        expect(result).toBeNull();
      });

      it('should return null when localStorage is empty', () => {
        localStorage.clear();

        const result = loadConsentFromStorage();

        expect(result).toBeNull();
      });
    });

    describe('expired consent', () => {
      it('should return null when consent has expired', () => {
        const expiredConsent = {
          state: {
            google: true,
            custom: true,
            tracelog: true,
          },
          expiresAt: Date.now() - 1000,
        };

        localStorage.setItem(CONSENT_KEY, JSON.stringify(expiredConsent));

        const result = loadConsentFromStorage();

        expect(result).toBeNull();
      });

      it('should return null when expiration time is exactly now', () => {
        const now = Date.now();
        const expiredConsent = {
          state: {
            google: true,
            custom: true,
            tracelog: true,
          },
          expiresAt: now,
        };

        localStorage.setItem(CONSENT_KEY, JSON.stringify(expiredConsent));

        vi.spyOn(Date, 'now').mockReturnValue(now + 1);

        const result = loadConsentFromStorage();

        expect(result).toBeNull();
      });

      it('should return data when expiration is in future', () => {
        const futureConsent = {
          state: {
            google: true,
            custom: true,
            tracelog: true,
          },
          expiresAt: Date.now() + 86400000,
        };

        localStorage.setItem(CONSENT_KEY, JSON.stringify(futureConsent));

        const result = loadConsentFromStorage();

        expect(result).not.toBeNull();
      });
    });

    describe('invalid JSON', () => {
      it('should return null and log error for invalid JSON', () => {
        const logSpy = vi.spyOn(loggingUtils, 'log').mockImplementation(() => {});

        localStorage.setItem(CONSENT_KEY, 'invalid-json{');

        const result = loadConsentFromStorage();

        expect(result).toBeNull();
        expect(logSpy).toHaveBeenCalledWith('error', 'Failed to load consent from storage', {
          error: expect.any(Error),
        });
      });

      it('should return null for malformed JSON string', () => {
        localStorage.setItem(CONSENT_KEY, '{broken');

        const result = loadConsentFromStorage();

        expect(result).toBeNull();
      });

      it('should return null for empty string', () => {
        localStorage.setItem(CONSENT_KEY, '');

        const result = loadConsentFromStorage();

        expect(result).toBeNull();
      });
    });

    describe('missing required fields', () => {
      it('should return null when state field is missing', () => {
        const invalidConsent = {
          expiresAt: Date.now() + 86400000,
        };

        localStorage.setItem(CONSENT_KEY, JSON.stringify(invalidConsent));

        const result = loadConsentFromStorage();

        expect(result).toBeNull();
      });

      it('should return null when expiresAt field is missing', () => {
        const invalidConsent = {
          state: {
            google: true,
            custom: true,
            tracelog: true,
          },
        };

        localStorage.setItem(CONSENT_KEY, JSON.stringify(invalidConsent));

        const result = loadConsentFromStorage();

        expect(result).toBeNull();
      });

      it('should return null when both fields are missing', () => {
        const invalidConsent = {};

        localStorage.setItem(CONSENT_KEY, JSON.stringify(invalidConsent));

        const result = loadConsentFromStorage();

        expect(result).toBeNull();
      });

      it('should return null when state is null', () => {
        const invalidConsent = {
          state: null,
          expiresAt: Date.now() + 86400000,
        };

        localStorage.setItem(CONSENT_KEY, JSON.stringify(invalidConsent));

        const result = loadConsentFromStorage();

        expect(result).toBeNull();
      });

      it('should return null when expiresAt is null', () => {
        const invalidConsent = {
          state: {
            google: true,
            custom: true,
            tracelog: true,
          },
          expiresAt: null,
        };

        localStorage.setItem(CONSENT_KEY, JSON.stringify(invalidConsent));

        const result = loadConsentFromStorage();

        expect(result).toBeNull();
      });
    });

    describe('SSR environment', () => {
      it('should return null when window is undefined', () => {
        const originalWindow = global.window;

        Object.defineProperty(global, 'window', {
          value: undefined,
          writable: true,
          configurable: true,
        });

        const result = loadConsentFromStorage();

        expect(result).toBeNull();

        Object.defineProperty(global, 'window', {
          value: originalWindow,
          writable: true,
          configurable: true,
        });
      });

      it('should return null when localStorage is undefined', () => {
        const originalLocalStorage = global.localStorage;

        Object.defineProperty(global, 'localStorage', {
          value: undefined,
          writable: true,
          configurable: true,
        });

        const result = loadConsentFromStorage();

        expect(result).toBeNull();

        Object.defineProperty(global, 'localStorage', {
          value: originalLocalStorage,
          writable: true,
          configurable: true,
        });
      });
    });

    describe('error logging', () => {
      it('should log error when JSON parsing fails', () => {
        const logSpy = vi.spyOn(loggingUtils, 'log').mockImplementation(() => {});

        localStorage.setItem(CONSENT_KEY, 'not-valid-json');

        loadConsentFromStorage();

        expect(logSpy).toHaveBeenCalledWith('error', 'Failed to load consent from storage', {
          error: expect.any(SyntaxError),
        });
      });

      it('should include error object in log', () => {
        const logSpy = vi.spyOn(loggingUtils, 'log').mockImplementation(() => {});

        localStorage.setItem(CONSENT_KEY, '{invalid}');

        loadConsentFromStorage();

        expect(logSpy).toHaveBeenCalledTimes(1);
        const callArgs = logSpy.mock.calls[0];
        expect(callArgs).toBeDefined();
        expect(callArgs![0]).toBe('error');
        expect(callArgs![1]).toBe('Failed to load consent from storage');
        expect(callArgs![2]).toHaveProperty('error');
      });

      it('should not log error for valid data', () => {
        const logSpy = vi.spyOn(loggingUtils, 'log').mockImplementation(() => {});

        const validConsent = {
          state: {
            google: true,
            custom: true,
            tracelog: true,
          },
          expiresAt: Date.now() + 86400000,
        };

        localStorage.setItem(CONSENT_KEY, JSON.stringify(validConsent));

        loadConsentFromStorage();

        expect(logSpy).not.toHaveBeenCalled();
      });

      it('should not log error when no data exists', () => {
        const logSpy = vi.spyOn(loggingUtils, 'log').mockImplementation(() => {});

        loadConsentFromStorage();

        expect(logSpy).not.toHaveBeenCalled();
      });
    });

    describe('edge cases', () => {
      it('should handle missing consent integration fields gracefully', () => {
        const partialConsent = {
          state: {
            google: true,
          },
          expiresAt: Date.now() + 86400000,
        };

        localStorage.setItem(CONSENT_KEY, JSON.stringify(partialConsent));

        const result = loadConsentFromStorage();

        expect(result).toEqual({
          google: true,
          custom: false,
          tracelog: false,
        });
      });

      it('should handle extra fields in state gracefully', () => {
        const consentWithExtras = {
          state: {
            google: true,
            custom: true,
            tracelog: true,
            extra: true,
            another: false,
          },
          expiresAt: Date.now() + 86400000,
        };

        localStorage.setItem(CONSENT_KEY, JSON.stringify(consentWithExtras));

        const result = loadConsentFromStorage();

        expect(result).toEqual({
          google: true,
          custom: true,
          tracelog: true,
        });
      });

      it('should handle zero as false for consent values', () => {
        const consent = {
          state: {
            google: 0,
            custom: 0,
            tracelog: 0,
          },
          expiresAt: Date.now() + 86400000,
        };

        localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));

        const result = loadConsentFromStorage();

        expect(result).toEqual({
          google: false,
          custom: false,
          tracelog: false,
        });
      });

      it('should handle empty string as false for consent values', () => {
        const consent = {
          state: {
            google: '',
            custom: '',
            tracelog: '',
          },
          expiresAt: Date.now() + 86400000,
        };

        localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));

        const result = loadConsentFromStorage();

        expect(result).toEqual({
          google: false,
          custom: false,
          tracelog: false,
        });
      });
    });
  });
});
