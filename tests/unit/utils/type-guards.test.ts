import { describe, test, expect } from 'vitest';
import { isOnlyPrimitiveFields } from '@/utils/validations/type-guards.utils';

describe('Type Guards Utils', () => {
  describe('isOnlyPrimitiveFields', () => {
    test('should return true for object with string fields', () => {
      const obj = { name: 'John', city: 'NYC' };
      expect(isOnlyPrimitiveFields(obj)).toBe(true);
    });

    test('should return true for object with number fields', () => {
      const obj = { age: 30, count: 100 };
      expect(isOnlyPrimitiveFields(obj)).toBe(true);
    });

    test('should return true for object with boolean fields', () => {
      const obj = { active: true, verified: false };
      expect(isOnlyPrimitiveFields(obj)).toBe(true);
    });

    test('should return true for object with mixed primitive fields', () => {
      const obj = {
        name: 'John',
        age: 30,
        active: true,
      };
      expect(isOnlyPrimitiveFields(obj)).toBe(true);
    });

    test('should return true for object with string arrays', () => {
      const obj = {
        tags: ['tag1', 'tag2'],
        categories: ['cat1'],
      };
      expect(isOnlyPrimitiveFields(obj)).toBe(true);
    });

    test('should return true for object with null/undefined values', () => {
      const obj = {
        name: 'John',
        optional: null,
        other: undefined,
      };
      expect(isOnlyPrimitiveFields(obj)).toBe(true);
    });

    test('should return false for object with nested objects', () => {
      const obj = {
        name: 'John',
        address: { city: 'NYC' },
      };
      expect(isOnlyPrimitiveFields(obj)).toBe(false);
    });

    test('should return false for object with number arrays', () => {
      const obj = {
        numbers: [1, 2, 3],
      };
      expect(isOnlyPrimitiveFields(obj)).toBe(false);
    });

    test('should return false for object with mixed type arrays', () => {
      const obj = {
        mixed: ['string', 123],
      };
      expect(isOnlyPrimitiveFields(obj)).toBe(false);
    });

    test('should return false for object with functions', () => {
      const obj = {
        name: 'John',
        fn: () => {},
      };
      expect(isOnlyPrimitiveFields(obj)).toBe(false);
    });

    test('should return false for null', () => {
      expect(isOnlyPrimitiveFields(null as any)).toBe(false);
    });

    test('should return false for non-object types', () => {
      expect(isOnlyPrimitiveFields('string' as any)).toBe(false);
      expect(isOnlyPrimitiveFields(123 as any)).toBe(false);
      expect(isOnlyPrimitiveFields(true as any)).toBe(false);
    });

    test('should return true for empty object', () => {
      expect(isOnlyPrimitiveFields({})).toBe(true);
    });
  });
});
