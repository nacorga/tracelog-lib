import { describe, it, expect } from 'vitest';
import { isOnlyPrimitiveFields } from '../../../../src/utils/validations/type-guards.utils';

describe('type-guards.utils', () => {
  describe('isOnlyPrimitiveFields', () => {
    describe('primitive values', () => {
      it('should return true for object with string fields', () => {
        const obj = { name: 'John', city: 'NYC' };
        expect(isOnlyPrimitiveFields(obj)).toBe(true);
      });

      it('should return true for object with number fields', () => {
        const obj = { age: 25, score: 99.5 };
        expect(isOnlyPrimitiveFields(obj)).toBe(true);
      });

      it('should return true for object with boolean fields', () => {
        const obj = { active: true, verified: false };
        expect(isOnlyPrimitiveFields(obj)).toBe(true);
      });

      it('should return true for object with mixed primitive types', () => {
        const obj = { name: 'John', age: 25, active: true };
        expect(isOnlyPrimitiveFields(obj)).toBe(true);
      });

      it('should return true for object with null values', () => {
        const obj = { name: 'John', middleName: null };
        expect(isOnlyPrimitiveFields(obj)).toBe(true);
      });

      it('should return true for object with undefined values', () => {
        const obj = { name: 'John', middleName: undefined };
        expect(isOnlyPrimitiveFields(obj)).toBe(true);
      });
    });

    describe('array handling', () => {
      it('should return true for empty array', () => {
        const obj = { tags: [] };
        expect(isOnlyPrimitiveFields(obj)).toBe(true);
      });

      it('should return true for string array', () => {
        const obj = { tags: ['tag1', 'tag2', 'tag3'] };
        expect(isOnlyPrimitiveFields(obj)).toBe(true);
      });

      it('should return true for mixed primitive array', () => {
        const obj = { mixed: ['string', 123, true, null] };
        expect(isOnlyPrimitiveFields(obj)).toBe(true);
      });

      it('should return true for array of objects with primitives', () => {
        const obj = {
          items: [
            { id: '1', name: 'Item 1', active: true },
            { id: '2', name: 'Item 2', active: false },
          ],
        };
        expect(isOnlyPrimitiveFields(obj)).toBe(true);
      });

      it('should return true for array of objects with nested objects', () => {
        const obj = {
          items: [{ id: '1', meta: { nested: 'value' } }],
        };
        expect(isOnlyPrimitiveFields(obj)).toBe(true);
      });

      it('should return true for array of objects with nested arrays', () => {
        const obj = {
          items: [{ id: '1', tags: ['tag1', 'tag2'] }],
        };
        expect(isOnlyPrimitiveFields(obj)).toBe(true);
      });

      it('should return true for array items with null values', () => {
        const obj = {
          items: [
            { id: '1', name: 'Test', optional: null },
            { id: '2', name: 'Test2', optional: undefined },
          ],
        };
        expect(isOnlyPrimitiveFields(obj)).toBe(true);
      });

      it('should return true for array with many keys in object', () => {
        const obj = {
          items: [Object.fromEntries(Array.from({ length: 50 }, (_, i) => [`key${i}`, `value${i}`]))],
        };
        expect(isOnlyPrimitiveFields(obj)).toBe(true);
      });
    });

    describe('nested objects', () => {
      it('should return true for single-level nested object with primitives', () => {
        const obj = {
          user: {
            name: 'John',
            age: 25,
            active: true,
          },
        };
        expect(isOnlyPrimitiveFields(obj)).toBe(true);
      });

      it('should return true for nested object with null values', () => {
        const obj = {
          user: {
            name: 'John',
            middleName: null,
            suffix: undefined,
          },
        };
        expect(isOnlyPrimitiveFields(obj)).toBe(true);
      });

      it('should return true for double-nested object', () => {
        const obj = {
          user: {
            profile: {
              name: 'John',
            },
          },
        };
        expect(isOnlyPrimitiveFields(obj)).toBe(true);
      });

      it('should return true for deeply nested objects', () => {
        const obj = {
          level1: {
            level2: {
              level3: {
                level4: {
                  value: 'deep',
                },
              },
            },
          },
        };
        expect(isOnlyPrimitiveFields(obj)).toBe(true);
      });
    });

    describe('invalid inputs', () => {
      it('should return false for null', () => {
        expect(isOnlyPrimitiveFields(null as unknown as Record<string, unknown>)).toBe(false);
      });

      it('should return false for undefined', () => {
        expect(isOnlyPrimitiveFields(undefined as unknown as Record<string, unknown>)).toBe(false);
      });

      it('should return false for non-object', () => {
        expect(isOnlyPrimitiveFields('string' as unknown as Record<string, unknown>)).toBe(false);
      });

      it('should return false for function value', () => {
        const obj = { name: 'test', fn: () => {} };
        expect(isOnlyPrimitiveFields(obj)).toBe(false);
      });

      it('should return false for symbol value', () => {
        const obj = { name: 'test', sym: Symbol('test') };
        expect(isOnlyPrimitiveFields(obj)).toBe(false);
      });

      it('should return false for bigint value', () => {
        const obj = { name: 'test', big: BigInt(123) };
        expect(isOnlyPrimitiveFields(obj)).toBe(false);
      });

      it('should return false for function in nested object', () => {
        const obj = { nested: { fn: () => {} } };
        expect(isOnlyPrimitiveFields(obj)).toBe(false);
      });

      it('should return false for function in array', () => {
        const obj = { items: [() => {}] };
        expect(isOnlyPrimitiveFields(obj)).toBe(false);
      });

      it('should return false for symbol in array', () => {
        const obj = { items: [Symbol('test')] };
        expect(isOnlyPrimitiveFields(obj)).toBe(false);
      });

      it('should return false for circular reference', () => {
        const obj: Record<string, unknown> = { name: 'test' };
        obj.self = obj;
        expect(isOnlyPrimitiveFields(obj)).toBe(false);
      });

      it('should return false for nested circular reference', () => {
        const obj: Record<string, unknown> = {
          data: {
            nested: {},
          },
        };
        (obj.data as Record<string, unknown>).nested = obj;
        expect(isOnlyPrimitiveFields(obj)).toBe(false);
      });

      it('should return false for circular reference in array', () => {
        const obj: Record<string, unknown> = { items: [] };
        (obj.items as unknown[]).push(obj);
        expect(isOnlyPrimitiveFields(obj)).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should return true for empty object', () => {
        const obj = {};
        expect(isOnlyPrimitiveFields(obj)).toBe(true);
      });

      it('should return true for Date objects', () => {
        const obj = { createdAt: new Date() };
        expect(isOnlyPrimitiveFields(obj)).toBe(true);
      });

      it('should return true for RegExp objects', () => {
        const obj = { pattern: /test/ };
        expect(isOnlyPrimitiveFields(obj)).toBe(true);
      });

      it('should handle complex nested structures', () => {
        const obj = {
          name: 'Product',
          price: 99.99,
          active: true,
          tags: ['electronics', 'gadgets'],
          specs: {
            weight: 1.5,
            color: 'black',
          },
          items: [
            { id: '1', name: 'Item 1' },
            { id: '2', name: 'Item 2' },
          ],
        };
        expect(isOnlyPrimitiveFields(obj)).toBe(true);
      });

      it('should handle objects with numeric keys', () => {
        const obj = { 0: 'first', 1: 'second', name: 'test' };
        expect(isOnlyPrimitiveFields(obj)).toBe(true);
      });

      it('should handle objects with special characters in keys', () => {
        const obj = { 'special-key': 'value', 'key.with.dots': 123, key_with_underscore: true };
        expect(isOnlyPrimitiveFields(obj)).toBe(true);
      });
    });

    describe('complex nested structures', () => {
      it('should handle nested object with array of objects', () => {
        const obj = {
          source: 'test_page',
          data: {
            records: [
              {
                position: 1,
                brand: 'Test Brand',
                currency: 'EUR',
                value: 66.88,
                variant: 'a',
                count: 1,
                id: 'record-123',
                category: 'type_a',
                subcategory: 'subtype_1',
                label: 'Test Label',
              },
            ],
          },
          context: 'unit_test',
        };
        expect(isOnlyPrimitiveFields(obj)).toBe(true);
      });

      it('should handle multiple objects in nested array', () => {
        const obj = {
          data: {
            records: [
              { id: '1', name: 'Record 1', value: 10.0 },
              { id: '2', name: 'Record 2', value: 20.0 },
              { id: '3', name: 'Record 3', value: 30.0 },
            ],
          },
        };
        expect(isOnlyPrimitiveFields(obj)).toBe(true);
      });

      it('should handle nested product attributes', () => {
        const obj = {
          product: {
            id: '123',
            attributes: {
              color: 'red',
              size: 'large',
              dimensions: {
                width: 10,
                height: 20,
                depth: 5,
              },
            },
            tags: ['sale', 'featured'],
          },
        };
        expect(isOnlyPrimitiveFields(obj)).toBe(true);
      });
    });
  });
});
