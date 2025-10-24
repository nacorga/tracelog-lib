import { describe, it, expect } from 'vitest';
import { isValidEventName, isValidMetadata } from '../../../../src/utils/validations/metadata-validations.utils';
import {
  MAX_CUSTOM_EVENT_NAME_LENGTH,
  MAX_CUSTOM_EVENT_KEYS,
  MAX_CUSTOM_EVENT_ARRAY_SIZE,
  MAX_STRING_LENGTH,
  MAX_STRING_LENGTH_IN_ARRAY,
} from '../../../../src/constants/config.constants';

describe('metadata-validations.utils', () => {
  describe('isValidEventName', () => {
    describe('valid event names', () => {
      it('should return valid for simple event name', () => {
        const result = isValidEventName('purchase');
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should return valid for event name with underscores', () => {
        const result = isValidEventName('user_signup');
        expect(result.valid).toBe(true);
      });

      it('should return valid for event name with dashes', () => {
        const result = isValidEventName('user-login');
        expect(result.valid).toBe(true);
      });

      it('should return valid for event name with numbers', () => {
        const result = isValidEventName('event123');
        expect(result.valid).toBe(true);
      });

      it('should return valid for event name with spaces', () => {
        const result = isValidEventName('Product Purchase');
        expect(result.valid).toBe(true);
      });

      it('should return valid for maximum length event name', () => {
        const maxLengthName = 'a'.repeat(MAX_CUSTOM_EVENT_NAME_LENGTH);
        const result = isValidEventName(maxLengthName);
        expect(result.valid).toBe(true);
      });
    });

    describe('invalid event names', () => {
      it('should return invalid for non-string input', () => {
        const result = isValidEventName(123 as unknown as string);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Event name must be a string');
      });

      it('should return invalid for empty string', () => {
        const result = isValidEventName('');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Event name cannot be empty');
      });

      it('should return invalid for event name exceeding max length', () => {
        const tooLongName = 'a'.repeat(MAX_CUSTOM_EVENT_NAME_LENGTH + 1);
        const result = isValidEventName(tooLongName);
        expect(result.valid).toBe(false);
        expect(result.error).toBe(`Event name is too long (max ${MAX_CUSTOM_EVENT_NAME_LENGTH} characters)`);
      });

      it('should return invalid for event name with < character', () => {
        const result = isValidEventName('event<script>');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Event name contains invalid characters');
      });

      it('should return invalid for event name with > character', () => {
        const result = isValidEventName('event>tag');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Event name contains invalid characters');
      });

      it('should return invalid for event name with & character', () => {
        const result = isValidEventName('event&param');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Event name contains invalid characters');
      });

      it('should return invalid for reserved word "constructor"', () => {
        const result = isValidEventName('constructor');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Event name cannot be a reserved word');
      });

      it('should return invalid for reserved word "prototype"', () => {
        const result = isValidEventName('prototype');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Event name cannot be a reserved word');
      });

      it('should return invalid for reserved word "__proto__"', () => {
        const result = isValidEventName('__proto__');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Event name cannot be a reserved word');
      });

      it('should return invalid for reserved word "eval"', () => {
        const result = isValidEventName('eval');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Event name cannot be a reserved word');
      });

      it('should return invalid for reserved word "function"', () => {
        const result = isValidEventName('function');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Event name cannot be a reserved word');
      });

      it('should be case-insensitive for reserved words', () => {
        const result = isValidEventName('CONSTRUCTOR');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Event name cannot be a reserved word');
      });
    });
  });

  describe('isValidMetadata', () => {
    describe('single object metadata', () => {
      it('should return valid for simple metadata object', () => {
        const metadata = { userId: '123', amount: 99.99, active: true };
        const result = isValidMetadata('purchase', metadata);

        expect(result.valid).toBe(true);
        expect(result.sanitizedMetadata).toBeDefined();
      });

      it('should return valid for metadata with string array', () => {
        const metadata = { tags: ['electronics', 'gadgets'] };
        const result = isValidMetadata('purchase', metadata);

        expect(result.valid).toBe(true);
        expect(result.sanitizedMetadata).toEqual({ tags: ['electronics', 'gadgets'] });
      });

      it('should return valid for empty metadata object', () => {
        const metadata = {};
        const result = isValidMetadata('event', metadata);

        expect(result.valid).toBe(true);
        expect(result.sanitizedMetadata).toEqual({});
      });

      it('should sanitize PII from metadata', () => {
        const metadata = { email: 'user@example.com', name: 'John' };
        const result = isValidMetadata('signup', metadata);

        expect(result.valid).toBe(true);
        expect(result.sanitizedMetadata).toBeDefined();
      });

      it('should return valid for nested object (one level)', () => {
        const metadata = {
          user: {
            id: '123',
            age: 25,
          },
        };
        const result = isValidMetadata('event', metadata);

        expect(result.valid).toBe(true);
      });
    });

    describe('metadata validation errors', () => {
      it('should sanitize functions and accept empty object', () => {
        const metadata = { fn: () => {} };
        const result = isValidMetadata('event', metadata);

        // Functions are filtered out by sanitizeMetadata, resulting in empty object which is valid
        expect(result.valid).toBe(true);
        expect(result.sanitizedMetadata).toEqual({});
      });

      it('should return invalid for metadata with too many keys', () => {
        const metadata = Object.fromEntries(
          Array.from({ length: MAX_CUSTOM_EVENT_KEYS + 1 }, (_, i) => [`key${i}`, 'value']),
        );
        const result = isValidMetadata('event', metadata);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('too many keys');
      });

      it('should return invalid for array exceeding max size', () => {
        const largeArray = Array.from({ length: MAX_CUSTOM_EVENT_ARRAY_SIZE + 1 }, (_, i) => `item${i}`);
        const metadata = { items: largeArray };
        const result = isValidMetadata('event', metadata);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('is too large');
      });

      it('should return invalid for string in array exceeding max length', () => {
        const longString = 'a'.repeat(MAX_STRING_LENGTH_IN_ARRAY + 1);
        const metadata = { items: [longString] };
        const result = isValidMetadata('event', metadata);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('contains strings that are too long');
      });

      it('should sanitize and truncate string property exceeding max length', () => {
        const longString = 'a'.repeat(MAX_STRING_LENGTH + 1);
        const metadata = { description: longString };
        const result = isValidMetadata('event', metadata);

        // Sanitization truncates strings, so it becomes valid
        expect(result.valid).toBe(true);
      });
    });

    describe('array metadata', () => {
      it('should return valid for array of metadata objects', () => {
        const metadata = [
          { id: '1', name: 'First' },
          { id: '2', name: 'Second' },
        ];
        const result = isValidMetadata('batch_event', metadata);

        expect(result.valid).toBe(true);
        expect(result.sanitizedMetadata).toHaveLength(2);
      });

      it('should return valid for empty array', () => {
        const metadata: Record<string, unknown>[] = [];
        const result = isValidMetadata('event', metadata);

        expect(result.valid).toBe(true);
        expect(result.sanitizedMetadata).toEqual([]);
      });

      it('should return invalid for array with non-object item', () => {
        const metadata = [{ id: '1' }, 'invalid', { id: '2' }];
        const result = isValidMetadata('event', metadata as unknown as Record<string, unknown>[]);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('must be an object');
      });

      it('should return invalid for array with null item', () => {
        const metadata = [{ id: '1' }, null, { id: '2' }];
        const result = isValidMetadata('event', metadata as unknown as Record<string, unknown>[]);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('must be an object');
      });

      it('should return invalid for array with array item', () => {
        const metadata = [{ id: '1' }, ['nested']];
        const result = isValidMetadata('event', metadata as unknown as Record<string, unknown>[]);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('must be an object');
      });

      it('should sanitize array items with long strings', () => {
        const largeString = 'a'.repeat(MAX_STRING_LENGTH + 1);
        const metadata = [{ id: '1' }, { description: largeString }];
        const result = isValidMetadata('event', metadata);

        // Sanitization truncates strings, so array becomes valid
        expect(result.valid).toBe(true);
        expect(result.sanitizedMetadata).toHaveLength(2);
      });

      it('should include index in error message', () => {
        const metadata = [{ id: '1' }, { id: '2' }, 'invalid'];
        const result = isValidMetadata('event', metadata as unknown as Record<string, unknown>[]);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('index 2');
      });
    });

    describe('metadata type parameter', () => {
      it('should include "customEvent" in error message for custom events', () => {
        const metadata = Object.fromEntries(
          Array.from({ length: MAX_CUSTOM_EVENT_KEYS + 1 }, (_, i) => [`key${i}`, 'value']),
        );
        const result = isValidMetadata('purchase', metadata, 'customEvent');

        expect(result.valid).toBe(false);
        expect(result.error).toContain('customEvent "purchase" metadata error');
      });

      it('should include "globalMetadata" in error message for global metadata', () => {
        const metadata = Object.fromEntries(
          Array.from({ length: MAX_CUSTOM_EVENT_KEYS + 1 }, (_, i) => [`key${i}`, 'value']),
        );
        const result = isValidMetadata('config', metadata, 'globalMetadata');

        expect(result.valid).toBe(false);
        expect(result.error).toContain('config metadata error');
      });

      it('should use event name in error for undefined type', () => {
        const metadata = Object.fromEntries(
          Array.from({ length: MAX_CUSTOM_EVENT_KEYS + 1 }, (_, i) => [`key${i}`, 'value']),
        );
        const result = isValidMetadata('event', metadata);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('event metadata error');
      });
    });

    describe('edge cases', () => {
      it('should accept metadata at exact max keys limit', () => {
        const metadata = Object.fromEntries(
          Array.from({ length: MAX_CUSTOM_EVENT_KEYS }, (_, i) => [`key${i}`, 'value']),
        );
        const result = isValidMetadata('event', metadata);

        expect(result.valid).toBe(true);
      });

      it('should accept string at exact max length', () => {
        const maxLengthString = 'a'.repeat(MAX_STRING_LENGTH);
        const metadata = { description: maxLengthString };
        const result = isValidMetadata('event', metadata);

        expect(result.valid).toBe(true);
      });

      it('should accept array at exact max size', () => {
        const maxSizeArray = Array.from({ length: MAX_CUSTOM_EVENT_ARRAY_SIZE }, (_, i) => `item${i}`);
        const metadata = { items: maxSizeArray };
        const result = isValidMetadata('event', metadata);

        expect(result.valid).toBe(true);
      });

      it('should accept array item string at exact max length', () => {
        const maxLengthString = 'a'.repeat(MAX_STRING_LENGTH_IN_ARRAY);
        const metadata = { items: [maxLengthString] };
        const result = isValidMetadata('event', metadata);

        expect(result.valid).toBe(true);
      });

      it('should handle metadata with null values', () => {
        const metadata = { name: 'test', optional: null };
        const result = isValidMetadata('event', metadata);

        expect(result.valid).toBe(true);
      });

      it('should handle metadata with undefined values', () => {
        const metadata = { name: 'test', optional: undefined };
        const result = isValidMetadata('event', metadata);

        expect(result.valid).toBe(true);
      });

      it('should handle metadata with boolean values', () => {
        const metadata = { active: true, verified: false };
        const result = isValidMetadata('event', metadata);

        expect(result.valid).toBe(true);
      });

      it('should handle metadata with number values', () => {
        const metadata = { count: 0, price: 99.99, negative: -10 };
        const result = isValidMetadata('event', metadata);

        expect(result.valid).toBe(true);
      });

      it('should handle complex valid metadata structure', () => {
        const metadata = {
          userId: '123',
          amount: 99.99,
          active: true,
          tags: ['electronics', 'gadgets'],
          specs: {
            weight: 1.5,
            color: 'black',
          },
        };
        const result = isValidMetadata('purchase', metadata);

        expect(result.valid).toBe(true);
      });
    });
  });
});
