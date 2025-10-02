/**
 * API Event Metadata Types Integration Tests
 *
 * Integration tests specifically for metadata type handling:
 * - Single metadata objects: Record<string, MetadataType>
 * - Arrays of metadata objects: Record<string, MetadataType>[]
 *
 * These tests verify end-to-end behavior from API call through validation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as TraceLog from '@/api';
import { SpecialProjectId } from '@/types';

describe('API Integration - Event Metadata Type Support', () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    try {
      if (TraceLog.isInitialized()) {
        await TraceLog.destroy();
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    } catch {
      // Ignore cleanup errors
    }

    await TraceLog.init({ id: SpecialProjectId.Skip });
  });

  afterEach(async () => {
    try {
      if (TraceLog.isInitialized()) {
        await TraceLog.destroy();
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Single Object Metadata', () => {
    it('should accept simple single object metadata', () => {
      expect(() =>
        TraceLog.event('user-action', {
          action: 'click',
          target: 'button',
        }),
      ).not.toThrow();
    });

    it('should accept single object with string values', () => {
      expect(() =>
        TraceLog.event('page-view', {
          page: '/dashboard',
          referrer: '/home',
          title: 'Dashboard Page',
        }),
      ).not.toThrow();
    });

    it('should accept single object with number values', () => {
      expect(() =>
        TraceLog.event('purchase', {
          amount: 99.99,
          quantity: 3,
          discount: 10,
        }),
      ).not.toThrow();
    });

    it('should accept single object with boolean values', () => {
      expect(() =>
        TraceLog.event('feature-flag', {
          enabled: true,
          visible: false,
          premium: true,
        }),
      ).not.toThrow();
    });

    it('should accept single object with string array values', () => {
      expect(() =>
        TraceLog.event('cart-update', {
          items: ['item1', 'item2', 'item3'],
          tags: ['electronics', 'sale'],
        }),
      ).not.toThrow();
    });

    it('should accept single object with mixed types', () => {
      expect(() =>
        TraceLog.event('checkout', {
          productId: 'abc123',
          price: 49.99,
          inStock: true,
          categories: ['clothing', 'sale'],
        }),
      ).not.toThrow();
    });

    it('should reject single object with nested objects', () => {
      expect(() =>
        TraceLog.event('invalid-nested', {
          user: {
            id: '123',
            name: 'John',
          },
        } as any),
      ).toThrow(/invalid types/i);
    });
  });

  describe('Array of Objects Metadata', () => {
    it('should accept array with single item', () => {
      expect(() =>
        TraceLog.event('batch-action', [
          {
            action: 'delete',
            itemId: 'item1',
          },
        ]),
      ).not.toThrow();
    });

    it('should accept array with multiple items', () => {
      expect(() =>
        TraceLog.event('bulk-update', [
          { id: 'item1', status: 'active', priority: 1 },
          { id: 'item2', status: 'inactive', priority: 2 },
          { id: 'item3', status: 'pending', priority: 3 },
        ]),
      ).not.toThrow();
    });

    it('should accept empty array', () => {
      expect(() => TraceLog.event('empty-batch', [])).not.toThrow();
    });

    it('should accept array with string values in items', () => {
      expect(() =>
        TraceLog.event('user-list', [
          { username: 'user1', email: 'user1@example.com' },
          { username: 'user2', email: 'user2@example.com' },
        ]),
      ).not.toThrow();
    });

    it('should accept array with number values in items', () => {
      expect(() =>
        TraceLog.event('metrics-batch', [
          { value: 100, timestamp: 1234567890 },
          { value: 200, timestamp: 1234567891 },
        ]),
      ).not.toThrow();
    });

    it('should accept array with boolean values in items', () => {
      expect(() =>
        TraceLog.event('flags-update', [
          { feature: 'dark-mode', enabled: true },
          { feature: 'beta-features', enabled: false },
        ]),
      ).not.toThrow();
    });

    it('should accept array with string arrays in items', () => {
      expect(() =>
        TraceLog.event('categories-batch', [
          { productId: 'p1', categories: ['electronics', 'sale'] },
          { productId: 'p2', categories: ['clothing', 'new'] },
        ]),
      ).not.toThrow();
    });

    it('should accept array with mixed types in items', () => {
      expect(() =>
        TraceLog.event('product-batch', [
          {
            id: 'p1',
            name: 'Product 1',
            price: 29.99,
            available: true,
            tags: ['new', 'featured'],
          },
          {
            id: 'p2',
            name: 'Product 2',
            price: 49.99,
            available: false,
            tags: ['sale'],
          },
        ]),
      ).not.toThrow();
    });

    it('should reject array with nested objects in items', () => {
      expect(() =>
        TraceLog.event('invalid-array', [
          {
            user: {
              id: '123',
              name: 'John',
            },
          },
        ] as any),
      ).toThrow(/invalid types/i);
    });

    it('should reject array with non-object items', () => {
      expect(() => TraceLog.event('invalid-items', ['string', 'items'] as any)).toThrow(/must be an object/i);
    });

    it('should reject array with null items', () => {
      expect(() => TraceLog.event('null-items', [{ valid: 'item' }, null] as any)).toThrow(/must be an object/i);
    });

    it('should reject array containing arrays', () => {
      expect(() => TraceLog.event('array-items', [{ valid: 'item' }, ['invalid', 'array']] as any)).toThrow(
        /must be an object/i,
      );
    });
  });

  describe('Type Differentiation in API', () => {
    it('should handle single object differently from array', () => {
      // Both should work but be processed differently
      expect(() => TraceLog.event('single', { type: 'object' })).not.toThrow();
      expect(() => TraceLog.event('array', [{ type: 'array' }])).not.toThrow();
    });

    it('should preserve single object structure', () => {
      const metadata = {
        key1: 'value1',
        key2: 42,
        key3: true,
      };

      expect(() => TraceLog.event('preserve-object', metadata)).not.toThrow();
    });

    it('should preserve array structure', () => {
      const metadata = [
        { id: 1, name: 'first' },
        { id: 2, name: 'second' },
      ];

      expect(() => TraceLog.event('preserve-array', metadata)).not.toThrow();
    });
  });

  describe('Real-World Use Cases', () => {
    it('should handle e-commerce cart items (array)', () => {
      expect(() =>
        TraceLog.event('cart-items', [
          { productId: 'p1', quantity: 2, price: 29.99, name: 'Product 1' },
          { productId: 'p2', quantity: 1, price: 49.99, name: 'Product 2' },
          { productId: 'p3', quantity: 3, price: 9.99, name: 'Product 3' },
        ]),
      ).not.toThrow();
    });

    it('should handle form submission (single object)', () => {
      expect(() =>
        TraceLog.event('form-submit', {
          formId: 'contact-form',
          fields: 5,
          valid: true,
          submittedAt: '2024-01-01T12:00:00Z',
        }),
      ).not.toThrow();
    });

    it('should handle batch operations (array)', () => {
      expect(() =>
        TraceLog.event('batch-delete', [
          { itemId: 'i1', type: 'product', confirmed: true },
          { itemId: 'i2', type: 'product', confirmed: true },
          { itemId: 'i3', type: 'category', confirmed: false },
        ]),
      ).not.toThrow();
    });

    it('should handle user preferences (single object)', () => {
      expect(() =>
        TraceLog.event('preferences-update', {
          theme: 'dark',
          notifications: true,
          language: 'en',
          fontSize: 16,
        }),
      ).not.toThrow();
    });

    it('should handle multi-step form progress (array)', () => {
      expect(() =>
        TraceLog.event('form-progress', [
          { step: 1, completed: true, time: 30 },
          { step: 2, completed: true, time: 45 },
          { step: 3, completed: false, time: 0 },
        ]),
      ).not.toThrow();
    });

    it('should handle search filters (single object with arrays)', () => {
      expect(() =>
        TraceLog.event('search-filters', {
          query: 'laptop',
          categories: ['electronics', 'computers'],
          priceMin: 500,
          priceMax: 2000,
          inStock: true,
        }),
      ).not.toThrow();
    });
  });

  describe('Edge Cases and Limits', () => {
    it('should reject array with too many keys per item', () => {
      const largeItem: Record<string, string> = {};
      for (let i = 0; i < 100; i++) {
        largeItem[`key${i}`] = `value${i}`;
      }

      expect(() => TraceLog.event('large-array-item', [largeItem])).toThrow(/too many keys/i);
    });

    it('should reject single object with too many keys', () => {
      const largeObject: Record<string, string> = {};
      for (let i = 0; i < 100; i++) {
        largeObject[`key${i}`] = `value${i}`;
      }

      expect(() => TraceLog.event('large-object', largeObject)).toThrow();
    });

    it('should handle array with maximum allowed items', () => {
      const items = Array.from({ length: 10 }, (_, i) => ({
        index: i,
        value: `item${i}`,
      }));

      expect(() => TraceLog.event('max-items', items)).not.toThrow();
    });

    it('should sanitize XSS in single object', () => {
      expect(() =>
        TraceLog.event('xss-single', {
          userInput: '<script>alert("xss")</script>',
          safe: 'normal text',
        }),
      ).not.toThrow();
    });

    it('should sanitize XSS in array items', () => {
      expect(() =>
        TraceLog.event('xss-array', [
          { userInput: '<script>alert("xss1")</script>' },
          { userInput: '<script>alert("xss2")</script>' },
        ]),
      ).not.toThrow();
    });
  });

  describe('Integration with Global Metadata', () => {
    it('should work with single object metadata and global metadata', async () => {
      await TraceLog.destroy();
      await new Promise((resolve) => setTimeout(resolve, 50));

      await TraceLog.init({
        id: SpecialProjectId.Skip,
        globalMetadata: {
          appVersion: '1.0.0',
          environment: 'test',
        },
      });

      expect(() =>
        TraceLog.event('with-global', {
          eventSpecific: 'value',
          action: 'click',
        }),
      ).not.toThrow();
    });

    it('should work with array metadata and global metadata', async () => {
      await TraceLog.destroy();
      await new Promise((resolve) => setTimeout(resolve, 50));

      await TraceLog.init({
        id: SpecialProjectId.Skip,
        globalMetadata: {
          appVersion: '1.0.0',
          userId: 'user123',
        },
      });

      expect(() =>
        TraceLog.event('batch-with-global', [
          { itemId: 'i1', action: 'update' },
          { itemId: 'i2', action: 'delete' },
        ]),
      ).not.toThrow();
    });
  });

  describe('Validation Consistency', () => {
    it('should apply same validation rules to single object', () => {
      // Should fail - nested object
      expect(() =>
        TraceLog.event('nested-single', {
          nested: { invalid: 'structure' },
        } as any),
      ).toThrow(/invalid types/i);
    });

    it('should apply same validation rules to each array item', () => {
      // Should fail - nested object in array item
      expect(() =>
        TraceLog.event('nested-array', [{ valid: 'item' }, { nested: { invalid: 'structure' } }] as any),
      ).toThrow(/invalid types/i);
    });

    it('should enforce size limits on single object', () => {
      // Create an object that exceeds MAX_CUSTOM_EVENT_STRING_SIZE (8KB)
      const largeObject: Record<string, string> = {};
      for (let i = 0; i < 15; i++) {
        largeObject[`key${i}`] = 'x'.repeat(1000);
      }

      expect(() => TraceLog.event('large-value-single', largeObject)).toThrow(/too large/i);
    });

    it('should enforce size limits on each array item', () => {
      // Create an array item that exceeds MAX_CUSTOM_EVENT_STRING_SIZE (8KB)
      const largeItem: Record<string, string> = {};
      for (let i = 0; i < 15; i++) {
        largeItem[`key${i}`] = 'x'.repeat(1000);
      }

      expect(() => TraceLog.event('large-value-array', [largeItem])).toThrow(/too large/i);
    });
  });
});
