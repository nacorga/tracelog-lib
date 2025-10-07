import { describe, test, expect } from 'vitest';
import { isOnlyPrimitiveFields } from '../../../src/utils/validations/type-guards.utils';

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

    test('should return true for object with arrays of flat objects (e-commerce case)', () => {
      const obj = {
        currency: 'EUR',
        items: [
          {
            item_id: 'AC5',
            item_name: 'AC5',
            product_code: 'AC5',
            price: 10.5,
            quantity: 2,
          },
          {
            item_id: 'AC2',
            item_name: 'AC2',
            product_code: 'AC2',
            price: 45,
            quantity: 1,
          },
        ],
        value: 786,
      };
      expect(isOnlyPrimitiveFields(obj)).toBe(true);
    });

    test('should return true for object with array of objects with null/undefined values', () => {
      const obj = {
        items: [
          {
            id: 'item1',
            optional: null,
            other: undefined,
            active: true,
          },
        ],
      };
      expect(isOnlyPrimitiveFields(obj)).toBe(true);
    });

    test('should return false for object with arrays containing nested objects', () => {
      const obj = {
        items: [
          {
            id: 'item1',
            nested: { key: 'value' },
          },
        ],
      };
      expect(isOnlyPrimitiveFields(obj)).toBe(false);
    });

    test('should return false for object with arrays containing arrays', () => {
      const obj = {
        items: [
          {
            id: 'item1',
            tags: ['tag1', 'tag2'],
          },
        ],
      };
      expect(isOnlyPrimitiveFields(obj)).toBe(false);
    });

    test('should return false for object with array of objects exceeding key limit', () => {
      const obj = {
        items: [
          {
            key1: 'value1',
            key2: 'value2',
            key3: 'value3',
            key4: 'value4',
            key5: 'value5',
            key6: 'value6',
            key7: 'value7',
            key8: 'value8',
            key9: 'value9',
            key10: 'value10',
            key11: 'value11',
            key12: 'value12',
            key13: 'value13',
            key14: 'value14',
            key15: 'value15',
            key16: 'value16',
            key17: 'value17',
            key18: 'value18',
            key19: 'value19',
            key20: 'value20',
            key21: 'value21', // Exceeds MAX_NESTED_OBJECT_KEYS (20)
          },
        ],
      };
      expect(isOnlyPrimitiveFields(obj)).toBe(false);
    });

    test('should return false for mixed array with strings and objects', () => {
      const obj = {
        mixed: ['string', { key: 'value' }],
      };
      expect(isOnlyPrimitiveFields(obj)).toBe(false);
    });

    test('should return true for object with null/undefined values', () => {
      const obj = {
        name: 'John',
        optional: null,
        other: undefined,
      };
      expect(isOnlyPrimitiveFields(obj)).toBe(true);
    });

    test('should return false for object with directly nested objects (not in arrays)', () => {
      const obj = {
        name: 'John',
        address: { city: 'NYC' },
      };
      expect(isOnlyPrimitiveFields(obj)).toBe(false);
    });

    test('should return false for object with number arrays (only string arrays allowed)', () => {
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
        fn: (): void => {},
      };
      expect(isOnlyPrimitiveFields(obj)).toBe(false);
    });

    test('should return false for null', () => {
      expect(isOnlyPrimitiveFields(null as unknown as Record<string, unknown>)).toBe(false);
    });

    test('should return false for non-object types', () => {
      expect(isOnlyPrimitiveFields('string' as unknown as Record<string, unknown>)).toBe(false);
      expect(isOnlyPrimitiveFields(123 as unknown as Record<string, unknown>)).toBe(false);
      expect(isOnlyPrimitiveFields(true as unknown as Record<string, unknown>)).toBe(false);
    });

    test('should return true for empty object', () => {
      expect(isOnlyPrimitiveFields({})).toBe(true);
    });
  });
});
