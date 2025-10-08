/**
 * Metadata Validations Unit Tests
 *
 * Tests for metadata validation utilities to ensure proper handling of:
 * - Single metadata objects: Record<string, MetadataType>
 * - Arrays of metadata objects: Record<string, MetadataType>[]
 */

import { describe, it, expect } from 'vitest';
import { isValidMetadata, isValidEventName } from '../../../src/utils/validations/metadata-validations.utils';
import { MetadataType } from '../../../src/types';

describe('Metadata Validations - Type Support', () => {
  describe('Single Object Metadata', () => {
    it('should accept valid single metadata object', () => {
      const metadata = {
        key1: 'value1',
        key2: 123,
        key3: true,
        key4: ['a', 'b', 'c'],
      };

      const result = isValidMetadata('test-event', metadata);

      expect(result.valid).toBe(true);
      expect(result.sanitizedMetadata).toBeDefined();
      expect(result.sanitizedMetadata).toMatchObject({
        key1: expect.any(String),
        key2: expect.any(Number),
        key3: expect.any(Boolean),
        key4: expect.any(Array),
      });
    });

    it('should accept empty metadata object', () => {
      const metadata = {};

      const result = isValidMetadata('test-event', metadata);

      expect(result.valid).toBe(true);
      expect(result.sanitizedMetadata).toEqual({});
    });

    it('should sanitize XSS attempts in single object', () => {
      const metadata = {
        name: '<script>alert("xss")</script>',
        description: 'Normal text',
      };

      const result = isValidMetadata('test-event', metadata);

      expect(result.valid).toBe(true);
      expect(result.sanitizedMetadata).toBeDefined();

      const sanitized = result.sanitizedMetadata as Record<string, MetadataType>;
      expect(sanitized.name).not.toContain('<script>');
      expect(sanitized.description).toContain('Normal text');
    });

    it('should accept one level of nested objects in single object', () => {
      const metadata = {
        nested: {
          value: 'test',
          count: 42,
        },
        currency: 'USD',
      };

      const result = isValidMetadata('test-event', metadata);

      expect(result.valid).toBe(true);
      expect(result.sanitizedMetadata).toBeDefined();
    });

    it('should reject two levels of nested objects in single object', () => {
      const metadata = {
        nested: {
          deeper: {
            value: 'test',
          },
        },
      };

      const result = isValidMetadata('test-event', metadata);

      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/invalid types/i);
    });

    it('should accept all valid MetadataType primitives', () => {
      const metadata = {
        stringField: 'text',
        numberField: 42,
        booleanField: true,
        stringArrayField: ['a', 'b', 'c'],
      };

      const result = isValidMetadata('test-event', metadata);

      expect(result.valid).toBe(true);
    });

    it('should accept e-commerce event with items array', () => {
      const metadata = {
        currency: 'EUR',
        items: [
          {
            item_id: 'AC2',
            item_name: 'AC2',
            product_code: 'AC2',
            price: 1170,
            quantity: 1,
          },
        ],
        value: 1170,
      };

      const result = isValidMetadata('add_to_cart', metadata, 'customEvent');

      expect(result.valid).toBe(true);
      expect(result.sanitizedMetadata).toBeDefined();
    });
  });

  describe('Array of Objects Metadata', () => {
    it('should accept valid array of metadata objects', () => {
      const metadata = [
        { key1: 'value1', key2: 123 },
        { key1: 'value2', key2: 456 },
        { key1: 'value3', key2: 789 },
      ];

      const result = isValidMetadata('test-event', metadata);

      expect(result.valid).toBe(true);
      expect(result.sanitizedMetadata).toBeDefined();
      expect(Array.isArray(result.sanitizedMetadata)).toBe(true);

      const sanitizedArray = result.sanitizedMetadata as Record<string, MetadataType>[];
      expect(sanitizedArray).toHaveLength(3);
      expect(sanitizedArray[0]).toHaveProperty('key1');
      expect(sanitizedArray[0]).toHaveProperty('key2');
    });

    it('should accept empty array of metadata', () => {
      const metadata: Record<string, unknown>[] = [];

      const result = isValidMetadata('test-event', metadata);

      expect(result.valid).toBe(true);
      expect(result.sanitizedMetadata).toEqual([]);
    });

    it('should sanitize each object in the array', () => {
      const metadata = [
        { name: '<script>alert("xss1")</script>', safe: 'text1' },
        { name: '<script>alert("xss2")</script>', safe: 'text2' },
      ];

      const result = isValidMetadata('test-event', metadata);

      expect(result.valid).toBe(true);
      expect(Array.isArray(result.sanitizedMetadata)).toBe(true);

      const sanitizedArray = result.sanitizedMetadata as Record<string, MetadataType>[];
      expect(sanitizedArray).toHaveLength(2);
      sanitizedArray.forEach((item) => {
        expect((item.name as string).includes('<script>')).toBe(false);
        expect(item.safe).toBeDefined();
      });
    });

    it('should accept array with one level of nested objects', () => {
      const metadata = [
        {
          nested: {
            value: 'test',
            price: 100,
          },
          currency: 'USD',
        },
      ];

      const result = isValidMetadata('test-event', metadata);

      expect(result.valid).toBe(true);
      expect(Array.isArray(result.sanitizedMetadata)).toBe(true);
    });

    it('should reject array with two levels of nested objects', () => {
      const metadata = [
        {
          nested: {
            deeper: {
              value: 'test',
            },
          },
        },
      ];

      const result = isValidMetadata('test-event', metadata);

      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/invalid types/i);
    });

    it('should reject array with non-object items', () => {
      const metadata = [{ key: 'value' }, 'not an object', { key2: 'value2' }];

      const result = isValidMetadata('test-event', metadata as any);

      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/must be an object/i);
    });

    it('should reject array with null items', () => {
      const metadata = [{ key: 'value' }, null, { key2: 'value2' }];

      const result = isValidMetadata('test-event', metadata as any);

      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/must be an object/i);
    });

    it('should reject array with array items', () => {
      const metadata = [{ key: 'value' }, ['not', 'an', 'object'], { key2: 'value2' }];

      const result = isValidMetadata('test-event', metadata as any);

      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/must be an object/i);
    });

    it('should handle mixed valid types in array items', () => {
      const metadata = [
        { str: 'text', num: 42, bool: true, arr: ['a', 'b'] },
        { str: 'text2', num: 100, bool: false, arr: ['c', 'd'] },
      ];

      const result = isValidMetadata('test-event', metadata);

      expect(result.valid).toBe(true);
      expect(Array.isArray(result.sanitizedMetadata)).toBe(true);

      const sanitizedArray = result.sanitizedMetadata as Record<string, MetadataType>[];
      expect(sanitizedArray).toHaveLength(2);
      sanitizedArray.forEach((item) => {
        expect(item.str).toBeDefined();
        expect(item.num).toBeDefined();
        expect(item.bool).toBeDefined();
        expect(Array.isArray(item.arr)).toBe(true);
      });
    });
  });

  describe('Type Differentiation', () => {
    it('should correctly identify and process single object', () => {
      const metadata = { single: 'object' };

      const result = isValidMetadata('test-event', metadata);

      expect(result.valid).toBe(true);
      expect(Array.isArray(result.sanitizedMetadata)).toBe(false);
      expect(result.sanitizedMetadata).toHaveProperty('single');
    });

    it('should correctly identify and process array of objects', () => {
      const metadata = [{ array: 'item1' }, { array: 'item2' }];

      const result = isValidMetadata('test-event', metadata);

      expect(result.valid).toBe(true);
      expect(Array.isArray(result.sanitizedMetadata)).toBe(true);
    });
  });

  describe('Size and Length Limits', () => {
    it('should accept array with reasonable number of items', () => {
      const metadata = Array.from({ length: 10 }, (_, i) => ({
        index: i,
        value: `item${i}`,
      }));

      const result = isValidMetadata('test-event', metadata);

      expect(result.valid).toBe(true);
      expect(Array.isArray(result.sanitizedMetadata)).toBe(true);
      expect((result.sanitizedMetadata as Record<string, MetadataType>[]).length).toBe(10);
    });

    it('should validate each item size in array', () => {
      const largeObject: Record<string, string> = {};
      for (let i = 0; i < 100; i++) {
        largeObject[`key${i}`] = `value${i}`;
      }

      const metadata = [largeObject];

      const result = isValidMetadata('test-event', metadata);

      // Should fail due to too many keys per object
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/too many keys/i);
    });

    it('should validate total serialized size for single object', () => {
      // Create an object that exceeds MAX_CUSTOM_EVENT_STRING_SIZE (8KB)
      // Each field will be truncated to MAX_STRING_LENGTH (1000), so we need many fields
      const metadata: Record<string, string> = {};
      for (let i = 0; i < 15; i++) {
        metadata[`key${i}`] = 'x'.repeat(1000); // Will be exactly 1000 after sanitization
      }

      const result = isValidMetadata('test-event', metadata);

      // Should fail due to object size exceeding MAX_CUSTOM_EVENT_STRING_SIZE (8KB)
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/too large/i);
    });

    it('should validate total serialized size for each array item', () => {
      // Create an array item that exceeds MAX_CUSTOM_EVENT_STRING_SIZE (8KB)
      const largeItem: Record<string, string> = {};
      for (let i = 0; i < 15; i++) {
        largeItem[`key${i}`] = 'x'.repeat(1000);
      }
      const metadata = [largeItem];

      const result = isValidMetadata('test-event', metadata);

      // Should fail due to item size exceeding MAX_CUSTOM_EVENT_STRING_SIZE (8KB)
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/too large/i);
    });
  });

  describe('Error Messages', () => {
    it('should include event name in error message for single object', () => {
      const metadata = {
        nested: {
          deeper: {
            invalid: 'structure',
          },
        },
      };

      const result = isValidMetadata('purchase-event', metadata, 'customEvent');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('purchase-event');
    });

    it('should include array index in error message', () => {
      const metadata = [
        { valid: 'item' },
        {
          nested: {
            deeper: {
              invalid: 'structure',
            },
          },
        },
      ];

      const result = isValidMetadata('cart-update', metadata, 'customEvent');

      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/index 1/i);
    });
  });

  describe('Special Cases', () => {
    it('should handle circular references in single object', () => {
      const circular: Record<string, unknown> = { name: 'test' };
      circular.self = circular;

      const result = isValidMetadata('test-event', circular);

      // Sanitization removes the circular reference, resulting in invalid types
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle array with single item', () => {
      const metadata = [{ single: 'item' }];

      const result = isValidMetadata('test-event', metadata);

      expect(result.valid).toBe(true);
      expect(Array.isArray(result.sanitizedMetadata)).toBe(true);
      expect((result.sanitizedMetadata as Record<string, MetadataType>[]).length).toBe(1);
    });

    it('should preserve order in array items', () => {
      const metadata = [{ id: 'first' }, { id: 'second' }, { id: 'third' }];

      const result = isValidMetadata('test-event', metadata);

      expect(result.valid).toBe(true);

      const sanitizedArray = result.sanitizedMetadata as Record<string, MetadataType>[];
      const item0 = sanitizedArray[0];
      const item1 = sanitizedArray[1];
      const item2 = sanitizedArray[2];
      expect(item0).toBeDefined();
      expect(item1).toBeDefined();
      expect(item2).toBeDefined();
      expect(item0!.id).toContain('first');
      expect(item1!.id).toContain('second');
      expect(item2!.id).toContain('third');
    });
  });
});

describe('Event Name Validation', () => {
  describe('Valid Event Names', () => {
    it('should accept alphanumeric names', () => {
      const result = isValidEventName('event123');
      expect(result.valid).toBe(true);
    });

    it('should accept names with hyphens', () => {
      const result = isValidEventName('event-name');
      expect(result.valid).toBe(true);
    });

    it('should accept names with underscores', () => {
      const result = isValidEventName('event_name');
      expect(result.valid).toBe(true);
    });

    it('should accept names with dots', () => {
      const result = isValidEventName('user.action.click');
      expect(result.valid).toBe(true);
    });
  });

  describe('Invalid Event Names', () => {
    it('should reject empty string', () => {
      const result = isValidEventName('');
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/cannot be empty/i);
    });

    it('should reject non-string values', () => {
      const result = isValidEventName(123 as any);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/must be a string/i);
    });

    it('should reject names with HTML tags', () => {
      const result = isValidEventName('<script>alert</script>');
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/invalid characters/i);
    });

    it('should reject very long names', () => {
      const longName = 'a'.repeat(300);
      const result = isValidEventName(longName);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/too long/i);
    });

    it('should reject reserved words', () => {
      const result = isValidEventName('constructor');
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/reserved word/i);
    });
  });
});
