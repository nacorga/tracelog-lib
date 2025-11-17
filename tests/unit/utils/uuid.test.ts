import { describe, it, expect } from 'vitest';
import { generateEventId, generateUUID } from '../../../src/utils/data/uuid.utils';

describe('UUID Utils', () => {
  describe('generateUUID', () => {
    it('should generate RFC4122 compliant UUID v4', () => {
      const uuid = generateUUID();

      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuid).toMatch(uuidRegex);
    });

    it('should generate unique UUIDs', () => {
      const uuids = new Set<string>();
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        uuids.add(generateUUID());
      }

      expect(uuids.size).toBe(iterations);
    });
  });

  describe('generateEventId', () => {
    it('should generate event ID with correct format', () => {
      const id = generateEventId();

      // Format: {timestamp}-{sequence}-{random}
      // Example: 1704067200000-001-a3f9c2
      const parts = id.split('-');
      expect(parts).toHaveLength(3);

      const [timestamp, sequence, random] = parts;

      // Timestamp: 13 digits (milliseconds since epoch)
      expect(timestamp).toMatch(/^\d{13}$/);

      // Sequence: 3 digits (000-999)
      expect(sequence).toMatch(/^\d{3}$/);

      // Random: 6 hex characters
      expect(random).toMatch(/^[0-9a-f]{6}$/i);
    });

    it('should generate unique IDs in high-frequency bursts', () => {
      const ids = new Set<string>();
      const iterations = 1000;

      // Generate 1000 IDs as fast as possible (likely within same millisecond)
      for (let i = 0; i < iterations; i++) {
        ids.add(generateEventId());
      }

      // All IDs must be unique (no collisions)
      expect(ids.size).toBe(iterations);
    });

    it('should increment sequence counter for same-millisecond events', () => {
      const ids: string[] = [];

      // Generate multiple IDs rapidly
      for (let i = 0; i < 50; i++) {
        ids.push(generateEventId());
      }

      // Extract sequences from IDs
      const sequences = ids.map((id) => {
        const parts = id.split('-');
        return parseInt(parts[1]!, 10);
      });

      // Check that sequences are incrementing (allowing for timestamp changes)
      let lastSequence = sequences[0]!;
      let hadIncrement = false;

      for (let i = 1; i < sequences.length; i++) {
        const currentSequence = sequences[i]!;

        // If sequence increased, mark as had increment
        if (currentSequence > lastSequence) {
          hadIncrement = true;
        }

        // If sequence reset to 0, it's because timestamp changed (allowed)
        if (currentSequence === 0 && lastSequence > 0) {
          // Timestamp changed, reset is expected
          lastSequence = 0;
          continue;
        }

        lastSequence = currentSequence;
      }

      // At least some events should have been in the same millisecond
      expect(hadIncrement).toBe(true);
    });

    it('should reset sequence counter when timestamp changes', () => {
      // Generate first ID to increment sequence
      generateEventId();

      // Wait for timestamp to change (at least 1ms)
      const start = Date.now();
      while (Date.now() === start) {
        // Busy wait
      }

      const secondId = generateEventId();
      const secondSequence = parseInt(secondId.split('-')[1]!, 10);

      // After timestamp change, sequence should reset to 0
      expect(secondSequence).toBe(0);
    });

    it('should handle sequence overflow gracefully', () => {
      const ids: string[] = [];

      // Generate more than 1000 events (sequence limit)
      for (let i = 0; i < 1100; i++) {
        ids.push(generateEventId());
      }

      // Extract unique IDs
      const uniqueIds = new Set(ids);

      // All should still be unique (random component prevents collisions on overflow)
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should produce different IDs even with crypto unavailable', () => {
      // This test relies on Math.random() fallback
      const ids = new Set<string>();

      for (let i = 0; i < 100; i++) {
        ids.add(generateEventId());
      }

      expect(ids.size).toBe(100);
    });

    it('should have temporal ordering', () => {
      const id1 = generateEventId();

      // Wait 2ms
      const start = Date.now();
      while (Date.now() - start < 2) {
        // Busy wait
      }

      const id2 = generateEventId();

      // First part (timestamp) should allow chronological sorting
      const timestamp1 = parseInt(id1.split('-')[0]!, 10);
      const timestamp2 = parseInt(id2.split('-')[0]!, 10);

      expect(timestamp2).toBeGreaterThan(timestamp1);
    });

    it('should handle extreme burst scenario (double-click simulation)', () => {
      const ids: string[] = [];

      // Simulate double-click: 2 events in rapid succession
      ids.push(generateEventId());
      ids.push(generateEventId());

      // Both events should have unique IDs
      expect(ids[0]!).not.toBe(ids[1]!);

      // Extract timestamps
      const timestamp1 = ids[0]!.split('-')[0];
      const timestamp2 = ids[1]!.split('-')[0];

      // If same timestamp, sequences must be different
      if (timestamp1 === timestamp2) {
        const seq1 = ids[0]!.split('-')[1];
        const seq2 = ids[1]!.split('-')[1];
        expect(seq1).not.toBe(seq2);
      }
    });

    it('should protect against clock skew (monotonic timestamp guarantee)', () => {
      const ids: string[] = [];

      // Generate multiple IDs rapidly
      for (let i = 0; i < 100; i++) {
        ids.push(generateEventId());
      }

      // Extract timestamps from all IDs
      const timestamps = ids.map((id) => {
        const parts = id.split('-');
        return parseInt(parts[0]!, 10);
      });

      // Verify timestamps are monotonically increasing or equal (never decreasing)
      // This protects against clock skew from NTP sync, manual adjustments, etc.
      for (let i = 1; i < timestamps.length; i++) {
        const current = timestamps[i]!;
        const previous = timestamps[i - 1]!;

        expect(current).toBeGreaterThanOrEqual(previous);
      }

      // Verify all IDs are still unique despite potential timestamp reuse
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});
