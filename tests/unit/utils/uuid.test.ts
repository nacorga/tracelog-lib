import { describe, test, expect } from 'vitest';
import { generateUUID, generateEventId } from '@/utils/data/uuid.utils';

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

  describe('generateEventId', () => {
    test('should generate a valid event ID with timestamp-random format', () => {
      const eventId = generateEventId();

      // Format: {timestamp}-{random}
      // Example: 1704067200000-a3f9c2b1
      const eventIdRegex = /^\d{13}-[0-9a-f]{8}$/;

      expect(eventId).toMatch(eventIdRegex);
    });

    test('should generate unique event IDs', () => {
      const id1 = generateEventId();
      const id2 = generateEventId();
      const id3 = generateEventId();

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });

    test('should generate 10000 unique event IDs without collisions', () => {
      const ids = new Set<string>();
      const count = 10000;

      for (let i = 0; i < count; i++) {
        ids.add(generateEventId());
      }

      // All IDs should be unique
      expect(ids.size).toBe(count);
    });

    test('should have timestamp as first component', () => {
      const beforeTime = Date.now();
      const eventId = generateEventId();
      const afterTime = Date.now();

      const timestamp = parseInt(eventId.split('-')[0]);

      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    });

    test('should be sortable by timestamp', () => {
      const id1 = generateEventId();
      // Wait 10ms to ensure different timestamp
      const waitPromise = new Promise((resolve) => setTimeout(resolve, 10));

      return waitPromise.then(() => {
        const id2 = generateEventId();

        // String comparison should work for chronological ordering
        expect(id2 > id1).toBe(true);
      });
    });

    test('should be a string', () => {
      const eventId = generateEventId();

      expect(typeof eventId).toBe('string');
    });

    test('should have 8-character hex random component', () => {
      const eventId = generateEventId();
      const randomPart = eventId.split('-')[1];

      expect(randomPart).toMatch(/^[0-9a-f]{8}$/);
      expect(randomPart.length).toBe(8);
    });

    test('should work when crypto.getRandomValues is unavailable', () => {
      // Mock to return undefined (simulating unavailable crypto)
      const spy = vi.spyOn(global.crypto, 'getRandomValues').mockImplementation(() => {
        return undefined as any;
      });

      const eventId = generateEventId();

      // Should still be valid format
      const eventIdRegex = /^\d{13}-[0-9a-f]{8}$/;
      expect(eventId).toMatch(eventIdRegex);

      const id2 = generateEventId();
      expect(eventId).not.toBe(id2);

      spy.mockRestore();
    });

    test('should maintain uniqueness with Math.random fallback', () => {
      const spy = vi.spyOn(global.crypto, 'getRandomValues').mockImplementation(() => {
        return undefined as any;
      });

      const ids = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        ids.add(generateEventId());
      }

      expect(ids.size).toBe(1000);
      spy.mockRestore();
    });
  });
});
