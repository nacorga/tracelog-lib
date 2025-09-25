import { describe, test, expect } from 'vitest';
import { generateUUID } from '@/utils/data/uuid.utils';

describe('UUID Utils', () => {
  describe('generateUUID', () => {
    test('should generate a valid UUID v4', () => {
      const uuid = generateUUID();

      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      expect(uuid).toMatch(uuidRegex);
    });

    test('should generate unique UUIDs', () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      const uuid3 = generateUUID();

      expect(uuid1).not.toBe(uuid2);
      expect(uuid2).not.toBe(uuid3);
      expect(uuid1).not.toBe(uuid3);
    });

    test('should have correct length', () => {
      const uuid = generateUUID();

      expect(uuid.length).toBe(36); // 32 characters + 4 dashes
    });

    test('should have version 4 identifier', () => {
      const uuid = generateUUID();

      // The 15th character should be '4'
      expect(uuid.charAt(14)).toBe('4');
    });

    test('should have correct variant bits', () => {
      const uuid = generateUUID();

      // The 20th character should be one of 8, 9, a, or b
      const variantChar = uuid.charAt(19).toLowerCase();
      expect(['8', '9', 'a', 'b']).toContain(variantChar);
    });
  });
});
