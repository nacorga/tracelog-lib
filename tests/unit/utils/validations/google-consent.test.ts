import { describe, it, expect } from 'vitest';
import { isValidGoogleConsentCategories } from '../../../../src/utils/validations/google-consent.utils';
import type { GoogleConsentCategories } from '../../../../src/types';

describe('isValidGoogleConsentCategories', () => {
  describe('Valid cases', () => {
    it('should return true for "all" string', () => {
      expect(isValidGoogleConsentCategories('all')).toBe(true);
    });

    it('should return true for valid object with analytics_storage', () => {
      const categories: GoogleConsentCategories = {
        analytics_storage: true,
      };
      expect(isValidGoogleConsentCategories(categories)).toBe(true);
    });

    it('should return true for valid object with ad_storage', () => {
      const categories: GoogleConsentCategories = {
        ad_storage: false,
      };
      expect(isValidGoogleConsentCategories(categories)).toBe(true);
    });

    it('should return true for valid object with ad_user_data', () => {
      const categories: GoogleConsentCategories = {
        ad_user_data: true,
      };
      expect(isValidGoogleConsentCategories(categories)).toBe(true);
    });

    it('should return true for valid object with ad_personalization', () => {
      const categories: GoogleConsentCategories = {
        ad_personalization: false,
      };
      expect(isValidGoogleConsentCategories(categories)).toBe(true);
    });

    it('should return true for valid object with personalization_storage', () => {
      const categories: GoogleConsentCategories = {
        personalization_storage: true,
      };
      expect(isValidGoogleConsentCategories(categories)).toBe(true);
    });

    it('should return true for valid object with multiple valid keys', () => {
      const categories: GoogleConsentCategories = {
        analytics_storage: true,
        ad_storage: false,
        ad_user_data: true,
        ad_personalization: false,
        personalization_storage: true,
      };
      expect(isValidGoogleConsentCategories(categories)).toBe(true);
    });

    it('should return true for empty object', () => {
      const categories: GoogleConsentCategories = {};
      expect(isValidGoogleConsentCategories(categories)).toBe(true);
    });
  });

  describe('Invalid cases - wrong type', () => {
    it('should return false for null', () => {
      expect(isValidGoogleConsentCategories(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isValidGoogleConsentCategories(undefined)).toBe(false);
    });

    it('should return false for number', () => {
      expect(isValidGoogleConsentCategories(123)).toBe(false);
    });

    it('should return false for boolean', () => {
      expect(isValidGoogleConsentCategories(true)).toBe(false);
    });

    it('should return false for array', () => {
      expect(isValidGoogleConsentCategories([])).toBe(false);
    });

    it('should return false for array with valid keys', () => {
      expect(isValidGoogleConsentCategories(['analytics_storage', 'ad_storage'])).toBe(false);
    });

    it('should return false for function', () => {
      expect(isValidGoogleConsentCategories(() => {})).toBe(false);
    });

    it('should return false for string other than "all"', () => {
      expect(isValidGoogleConsentCategories('invalid')).toBe(false);
    });
  });

  describe('Invalid cases - invalid keys', () => {
    it('should return false for object with invalid key', () => {
      const categories = {
        invalid_key: true,
      };
      expect(isValidGoogleConsentCategories(categories)).toBe(false);
    });

    it('should return false for object with mix of valid and invalid keys', () => {
      const categories = {
        analytics_storage: true,
        invalid_key: false,
      };
      expect(isValidGoogleConsentCategories(categories)).toBe(false);
    });

    it('should return false for object with empty string key', () => {
      const categories = {
        '': true,
      };
      expect(isValidGoogleConsentCategories(categories)).toBe(false);
    });

    it('should return false for object with numeric key', () => {
      const categories = {
        '123': true,
      };
      expect(isValidGoogleConsentCategories(categories)).toBe(false);
    });
  });

  describe('Invalid cases - invalid values', () => {
    it('should return false for object with string value', () => {
      const categories = {
        analytics_storage: 'true' as unknown as boolean,
      };
      expect(isValidGoogleConsentCategories(categories)).toBe(false);
    });

    it('should return false for object with number value', () => {
      const categories = {
        analytics_storage: 1 as unknown as boolean,
      };
      expect(isValidGoogleConsentCategories(categories)).toBe(false);
    });

    it('should return false for object with null value', () => {
      const categories = {
        analytics_storage: null as unknown as boolean,
      };
      expect(isValidGoogleConsentCategories(categories)).toBe(false);
    });

    it('should return false for object with undefined value', () => {
      const categories = {
        analytics_storage: undefined as unknown as boolean,
      };
      expect(isValidGoogleConsentCategories(categories)).toBe(false);
    });

    it('should return false for object with object value', () => {
      const categories = {
        analytics_storage: {} as unknown as boolean,
      };
      expect(isValidGoogleConsentCategories(categories)).toBe(false);
    });

    it('should return false for object with array value', () => {
      const categories = {
        analytics_storage: [] as unknown as boolean,
      };
      expect(isValidGoogleConsentCategories(categories)).toBe(false);
    });

    it('should return false for object with function value', () => {
      const categories = {
        analytics_storage: (() => {}) as unknown as boolean,
      };
      expect(isValidGoogleConsentCategories(categories)).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should return false for object with valid key but non-boolean value in mix', () => {
      const categories = {
        analytics_storage: true,
        ad_storage: 'false' as unknown as boolean,
      };
      expect(isValidGoogleConsentCategories(categories)).toBe(false);
    });

    it('should ignore Symbol keys (Object.keys does not enumerate them)', () => {
      const symbolKey = Symbol('test');
      const categories = {
        [symbolKey]: true,
        analytics_storage: true,
      };
      // Symbol keys are not enumerated by Object.keys(), so they're ignored
      expect(isValidGoogleConsentCategories(categories)).toBe(true);
    });

    it('should ignore __proto__ (Object.keys does not enumerate it)', () => {
      const categories = {
        __proto__: true as unknown as boolean,
        analytics_storage: false,
      };
      // __proto__ is not enumerated by Object.keys(), so it's ignored
      expect(isValidGoogleConsentCategories(categories)).toBe(true);
    });

    it('should return true for empty object with Symbol keys only', () => {
      const symbolKey = Symbol('test');
      const categories = {
        [symbolKey]: true,
      };
      // Symbol keys are not enumerated by Object.keys(), so empty validation passes
      expect(isValidGoogleConsentCategories(categories)).toBe(true);
    });
  });
});
