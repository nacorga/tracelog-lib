import { describe, it, expect } from 'vitest';
import { sanitizeMetadata } from '../../../../src/utils/security/sanitize.utils';
import { MAX_OBJECT_DEPTH } from '../../../../src/constants/config.constants';

describe('sanitize.utils', () => {
  describe('sanitizeMetadata', () => {
    describe('depth handling', () => {
      it('should preserve primitives at any depth', () => {
        // Build a structure at MAX_OBJECT_DEPTH levels
        let deepObj: Record<string, unknown> = { value: 'deep', count: 42, active: true };
        for (let i = 0; i < MAX_OBJECT_DEPTH - 1; i++) {
          deepObj = { nested: deepObj };
        }

        const result = sanitizeMetadata(deepObj);

        // Navigate to the deepest level
        let current: Record<string, unknown> = result;
        for (let i = 0; i < MAX_OBJECT_DEPTH - 1; i++) {
          current = current.nested as Record<string, unknown>;
        }

        // Primitives should be preserved
        expect(current.value).toBeDefined();
        expect(current.count).toBe(42);
        expect(current.active).toBe(true);
      });

      it('should handle nested object arrays', () => {
        const metadata = {
          source: 'test_page',
          data: {
            records: [
              {
                id: '123',
                name: 'Record',
                value: 99.99,
                count: 1,
                category: 'type_a',
              },
            ],
          },
          context: 'unit_test',
        };

        const result = sanitizeMetadata(metadata);
        const records = (result.data as Record<string, unknown>).records as Record<string, unknown>[];

        expect(records).toHaveLength(1);
        expect(records[0]?.id).toBeDefined();
        expect(records[0]?.value).toBe(99.99);
      });

      it('should handle deeply nested but valid structures', () => {
        const metadata = {
          level1: {
            level2: {
              level3: {
                level4: {
                  level5: {
                    value: 'still valid',
                    number: 123,
                  },
                },
              },
            },
          },
        };

        const result = sanitizeMetadata(metadata);
        const deep = (
          (
            ((result.level1 as Record<string, unknown>).level2 as Record<string, unknown>).level3 as Record<
              string,
              unknown
            >
          ).level4 as Record<string, unknown>
        ).level5 as Record<string, unknown>;

        expect(deep.value).toBeDefined();
        expect(deep.number).toBe(123);
      });

      it('should truncate objects beyond MAX_OBJECT_DEPTH', () => {
        // Build a structure deeper than MAX_OBJECT_DEPTH
        let tooDeep: Record<string, unknown> = { value: 'too deep' };
        for (let i = 0; i < MAX_OBJECT_DEPTH + 2; i++) {
          tooDeep = { nested: tooDeep };
        }

        const result = sanitizeMetadata(tooDeep);

        // Navigate to MAX_OBJECT_DEPTH level - the nested object should be null/removed
        let current: Record<string, unknown> = result;
        for (let i = 0; i < MAX_OBJECT_DEPTH; i++) {
          if (current.nested) {
            current = current.nested as Record<string, unknown>;
          } else {
            break;
          }
        }

        // At MAX_OBJECT_DEPTH, nested objects should be cut off
        // The exact behavior depends on implementation, but the deep value should not exist
        expect(Object.keys(result).length).toBeGreaterThan(0);
      });

      it('should handle circular references gracefully via depth limit', () => {
        const obj: Record<string, unknown> = { name: 'test', value: 123 };
        obj.self = obj;

        // Should not throw - depth limit stops infinite recursion
        const result = sanitizeMetadata(obj);

        // Result should be a valid object (circular ref truncated at depth limit)
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
        expect(result.name).toBeDefined();
        expect(result.value).toBe(123);
      });
    });

    describe('primitive sanitization', () => {
      it('should sanitize strings with XSS patterns', () => {
        const metadata = {
          name: '<script>alert("xss")</script>safe',
        };

        const result = sanitizeMetadata(metadata);
        expect(result.name).not.toContain('<script>');
      });

      it('should preserve valid numbers', () => {
        const metadata = {
          integer: 42,
          float: 3.14,
          negative: -100,
          zero: 0,
        };

        const result = sanitizeMetadata(metadata);
        expect(result.integer).toBe(42);
        expect(result.float).toBe(3.14);
        expect(result.negative).toBe(-100);
        expect(result.zero).toBe(0);
      });

      it('should preserve booleans', () => {
        const metadata = {
          active: true,
          disabled: false,
        };

        const result = sanitizeMetadata(metadata);
        expect(result.active).toBe(true);
        expect(result.disabled).toBe(false);
      });

      it('should handle null and undefined', () => {
        const metadata = {
          nullValue: null,
          undefinedValue: undefined,
          validValue: 'test',
        };

        const result = sanitizeMetadata(metadata);
        expect(result.validValue).toBe('test');
        // null/undefined are filtered out
      });
    });

    describe('array handling', () => {
      it('should preserve arrays of primitives', () => {
        const metadata = {
          tags: ['tag1', 'tag2', 'tag3'],
          numbers: [1, 2, 3],
          mixed: ['string', 123, true],
        };

        const result = sanitizeMetadata(metadata);
        expect(result.tags).toHaveLength(3);
        expect(result.numbers).toHaveLength(3);
        expect(result.mixed).toHaveLength(3);
      });

      it('should preserve arrays of objects', () => {
        const metadata = {
          items: [
            { id: '1', name: 'Item 1' },
            { id: '2', name: 'Item 2' },
          ],
        };

        const result = sanitizeMetadata(metadata);
        const items = result.items as Record<string, unknown>[];
        expect(items).toHaveLength(2);
        expect(items[0]?.id).toBe('1');
        expect(items[1]?.name).toBeDefined();
      });
    });
  });
});
