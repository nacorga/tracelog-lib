import { describe, it, expect } from 'vitest';
import { isOnlyPrimitiveFields } from '../../../../src/utils/validations/type-guards.utils';
import { MAX_NESTED_OBJECT_KEYS, MAX_METADATA_NESTING_DEPTH } from '../../../../src/constants/config.constants';

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

      it('should return false for mixed string and number array', () => {
        const obj = { mixed: ['string', 123] };
        expect(isOnlyPrimitiveFields(obj)).toBe(false);
      });

      it('should return true for array of flat objects with primitives', () => {
        const obj = {
          items: [
            { id: '1', name: 'Item 1', active: true },
            { id: '2', name: 'Item 2', active: false },
          ],
        };
        expect(isOnlyPrimitiveFields(obj)).toBe(true);
      });

      it('should return false for array of objects with nested objects', () => {
        const obj = {
          items: [{ id: '1', meta: { nested: 'value' } }],
        };
        expect(isOnlyPrimitiveFields(obj)).toBe(false);
      });

      it('should return false for array of objects with nested arrays', () => {
        const obj = {
          items: [{ id: '1', tags: ['tag1', 'tag2'] }],
        };
        expect(isOnlyPrimitiveFields(obj)).toBe(false);
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

      it('should return false if array has too many keys in object', () => {
        const obj = {
          items: [
            Object.fromEntries(Array.from({ length: MAX_NESTED_OBJECT_KEYS + 1 }, (_, i) => [`key${i}`, `value${i}`])),
          ],
        };
        expect(isOnlyPrimitiveFields(obj)).toBe(false);
      });

      it('should return true if array has exactly max keys in object', () => {
        const obj = {
          items: [
            Object.fromEntries(Array.from({ length: MAX_NESTED_OBJECT_KEYS }, (_, i) => [`key${i}`, `value${i}`])),
          ],
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

      it('should return false for double-nested object', () => {
        const obj = {
          user: {
            profile: {
              name: 'John',
            },
          },
        };
        expect(isOnlyPrimitiveFields(obj)).toBe(false);
      });

      it('should return false for nested object at depth > max', () => {
        const obj = {
          level1: {
            level2: {
              value: 'too deep',
            },
          },
        };
        expect(isOnlyPrimitiveFields(obj)).toBe(false);
      });

      it('should respect MAX_METADATA_NESTING_DEPTH constant', () => {
        if (MAX_METADATA_NESTING_DEPTH === 1) {
          const obj = {
            level1: { value: 'ok' },
          };
          expect(isOnlyPrimitiveFields(obj)).toBe(true);

          const tooDeep = {
            level1: { level2: { value: 'too deep' } },
          };
          expect(isOnlyPrimitiveFields(tooDeep)).toBe(false);
        }
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
    });

    describe('edge cases', () => {
      it('should return true for empty object', () => {
        const obj = {};
        expect(isOnlyPrimitiveFields(obj)).toBe(true);
      });

      it('should handle Date objects as nested objects (allowed at depth 0)', () => {
        const obj = { createdAt: new Date() };
        expect(isOnlyPrimitiveFields(obj)).toBe(true);
      });

      it('should handle RegExp objects as nested objects (allowed at depth 0)', () => {
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

    describe('depth parameter', () => {
      it('should handle explicit depth parameter', () => {
        const obj = { value: 'test' };
        expect(isOnlyPrimitiveFields(obj, 0)).toBe(true);
      });

      it('should reject at depth > MAX_METADATA_NESTING_DEPTH', () => {
        const obj = { value: 'test' };
        expect(isOnlyPrimitiveFields(obj, MAX_METADATA_NESTING_DEPTH + 1)).toBe(false);
      });

      it('should allow nested object at depth 0', () => {
        const obj = { nested: { value: 'test' } };
        expect(isOnlyPrimitiveFields(obj, 0)).toBe(true);
      });

      it('should reject nested object at depth 1', () => {
        const obj = { nested: { value: 'test' } };
        expect(isOnlyPrimitiveFields(obj, 1)).toBe(false);
      });
    });

    describe('array item validation', () => {
      it('should validate string items in arrays', () => {
        const obj = { items: ['a', 'b', 'c'] };
        expect(isOnlyPrimitiveFields(obj)).toBe(true);
      });

      it('should reject number items in string arrays', () => {
        const obj = { items: ['a', 123, 'c'] };
        expect(isOnlyPrimitiveFields(obj)).toBe(false);
      });

      it('should reject boolean items in string arrays', () => {
        const obj = { items: ['a', true, 'c'] };
        expect(isOnlyPrimitiveFields(obj)).toBe(false);
      });

      it('should reject null items in object arrays', () => {
        const obj = { items: [{ id: '1' }, null, { id: '2' }] };
        expect(isOnlyPrimitiveFields(obj)).toBe(false);
      });

      it('should reject array items in object arrays', () => {
        const obj = { items: [{ id: '1' }, ['nested']] };
        expect(isOnlyPrimitiveFields(obj)).toBe(false);
      });

      it('should accept all string items consistently', () => {
        const obj = { items: ['one', 'two', 'three', 'four'] };
        expect(isOnlyPrimitiveFields(obj)).toBe(true);
      });

      it('should accept all object items with same structure', () => {
        const obj = {
          items: [
            { id: '1', name: 'First' },
            { id: '2', name: 'Second' },
            { id: '3', name: 'Third' },
          ],
        };
        expect(isOnlyPrimitiveFields(obj)).toBe(true);
      });
    });
  });
});
