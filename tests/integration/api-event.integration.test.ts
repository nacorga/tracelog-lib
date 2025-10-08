/**
 * API Event Method Integration Tests
 *
 * Tests for TraceLog.event() method - custom event tracking
 * These tests verify the event() method works correctly after initialization
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as TraceLog from '../../src/api';

describe('API Integration - Event Method', () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    // Cleanup any existing instance
    try {
      if (TraceLog.isInitialized()) {
        await TraceLog.destroy();
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    } catch {
      // Ignore cleanup errors
    }
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

  describe('Before Initialization', () => {
    it('should throw error when called before init()', () => {
      expect(() => TraceLog.event('test-event')).toThrow('TraceLog not initialized');
    });

    it('should throw error with metadata before init()', () => {
      expect(() => TraceLog.event('test-event', { key: 'value' })).toThrow('TraceLog not initialized');
    });
  });

  describe('After Initialization', () => {
    beforeEach(async () => {
      await TraceLog.init();
    });

    it('should send custom event with name only', () => {
      expect(() => TraceLog.event('button-click')).not.toThrow();
    });

    it('should send custom event with string metadata', () => {
      expect(() => TraceLog.event('purchase', { productId: 'abc123' })).not.toThrow();
    });

    it('should send custom event with number metadata', () => {
      expect(() => TraceLog.event('purchase', { amount: 99.99 })).not.toThrow();
    });

    it('should send custom event with boolean metadata', () => {
      expect(() => TraceLog.event('feature-toggle', { enabled: true })).not.toThrow();
    });

    it('should send custom event with mixed metadata types', () => {
      expect(() =>
        TraceLog.event('checkout', {
          productId: 'abc123',
          quantity: 2,
          isPremium: true,
        }),
      ).not.toThrow();
    });

    it('should accept custom event with nested metadata one level deep', async () => {
      // Re-initialize with QA mode enabled
      await TraceLog.destroy();
      sessionStorage.setItem('tlog:qa_mode', 'true');
      await TraceLog.init();

      // Nested objects one level deep are allowed
      expect(() =>
        TraceLog.event('order-placed', {
          order: {
            total: 199.99,
          },
        } as any),
      ).not.toThrow();

      sessionStorage.removeItem('tlog:qa_mode');
    });

    it('should send custom event with array metadata', () => {
      expect(() =>
        TraceLog.event('cart-update', {
          items: ['item1', 'item2', 'item3'],
        }),
      ).not.toThrow();
    });

    it('should send custom event with empty metadata object', () => {
      expect(() => TraceLog.event('page-loaded', {})).not.toThrow();
    });

    it('should send custom event with null metadata values', () => {
      expect(() =>
        TraceLog.event('user-action', {
          userId: null,
          action: 'logout',
        } as any),
      ).not.toThrow();
    });

    it('should send custom event with undefined metadata values', () => {
      expect(() =>
        TraceLog.event('form-submit', {
          email: 'user@example.com',
          phone: undefined,
        } as any),
      ).not.toThrow();
    });
  });

  describe('Event Name Validation', () => {
    beforeEach(async () => {
      await TraceLog.init();
    });

    it('should accept event name with letters only', () => {
      expect(() => TraceLog.event('buttonclick')).not.toThrow();
    });

    it('should accept event name with hyphens', () => {
      expect(() => TraceLog.event('button-click')).not.toThrow();
    });

    it('should accept event name with underscores', () => {
      expect(() => TraceLog.event('button_click')).not.toThrow();
    });

    it('should accept event name with numbers', () => {
      expect(() => TraceLog.event('event123')).not.toThrow();
    });

    it('should accept event name with dots', () => {
      expect(() => TraceLog.event('user.action.click')).not.toThrow();
    });

    it('should accept long event names', () => {
      const longName = 'a'.repeat(100);
      expect(() => TraceLog.event(longName)).not.toThrow();
    });
  });

  describe('Multiple Events', () => {
    beforeEach(async () => {
      await TraceLog.init();
    });

    it('should send multiple events in sequence', () => {
      expect(() => {
        TraceLog.event('event1');
        TraceLog.event('event2');
        TraceLog.event('event3');
      }).not.toThrow();
    });

    it('should send same event multiple times', () => {
      expect(() => {
        TraceLog.event('repeat-event');
        TraceLog.event('repeat-event');
        TraceLog.event('repeat-event');
      }).not.toThrow();
    });

    it('should send events with different metadata', () => {
      expect(() => {
        TraceLog.event('action', { type: 'click' });
        TraceLog.event('action', { type: 'scroll' });
        TraceLog.event('action', { type: 'hover' });
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    beforeEach(async () => {
      await TraceLog.init();
    });

    it('should reject very large metadata objects (validation limit)', async () => {
      // Re-initialize with QA mode for strict validation
      await TraceLog.destroy();
      sessionStorage.setItem('tlog:qa_mode', 'true');
      await TraceLog.init();

      const largeMetadata: Record<string, string> = {};
      for (let i = 0; i < 100; i++) {
        largeMetadata[`key${i}`] = `value${i}`;
      }

      // Library has size limits for metadata
      expect(() => TraceLog.event('large-event', largeMetadata)).toThrow();

      sessionStorage.removeItem('tlog:qa_mode');
    });

    it('should reject deeply nested metadata (strict validation)', async () => {
      // Re-initialize with QA mode for strict validation
      await TraceLog.destroy();
      sessionStorage.setItem('tlog:qa_mode', 'true');
      await TraceLog.init();

      expect(() =>
        TraceLog.event('nested-event', {
          level1: {
            level2: {
              level3: {
                level4: {
                  value: 'deep',
                },
              },
            },
          },
        } as any),
      ).toThrow(/invalid types/i);

      sessionStorage.removeItem('tlog:qa_mode');
    });

    it('should handle special characters in metadata values', () => {
      expect(() =>
        TraceLog.event('special-chars', {
          text: '<script>alert("test")</script>',
          emoji: '🚀 ✨ 🎉',
          unicode: '你好世界',
        }),
      ).not.toThrow();
    });

    it('should reject metadata with circular references', async () => {
      // Re-initialize with QA mode for strict validation
      await TraceLog.destroy();
      sessionStorage.setItem('tlog:qa_mode', 'true');
      await TraceLog.init();

      const circular: Record<string, unknown> = { name: 'test' };
      circular.self = circular;

      // Strict validation rejects circular references
      expect(() => TraceLog.event('circular', circular as any)).toThrow();

      sessionStorage.removeItem('tlog:qa_mode');
    });

    it('should handle reasonable-sized flat metadata', () => {
      expect(() =>
        TraceLog.event('reasonable-event', {
          key1: 'value1',
          key2: 'value2',
          key3: 123,
          key4: true,
          key5: ['a', 'b', 'c'],
        }),
      ).not.toThrow();
    });
  });

  describe('After Destroy', () => {
    it('should throw error when called after destroy()', async () => {
      await TraceLog.init();
      await TraceLog.destroy();
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(() => TraceLog.event('test-event')).toThrow('TraceLog not initialized');
    });

    it('should work again after re-initialization', async () => {
      // First lifecycle
      await TraceLog.init();
      TraceLog.event('event1');
      await TraceLog.destroy();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Second lifecycle
      await TraceLog.init();
      expect(() => TraceLog.event('event2')).not.toThrow();
    });
  });

  describe('Integration with Global Metadata', () => {
    it('should send events with global metadata applied', async () => {
      await TraceLog.init({
        globalMetadata: {
          appVersion: '1.0.0',
          environment: 'test',
        },
      });

      // Event should include both event metadata and global metadata
      expect(() =>
        TraceLog.event('user-action', {
          action: 'click',
          target: 'button',
        }),
      ).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await TraceLog.init();
    });

    it('should throw error for empty event name', async () => {
      // Re-initialize with QA mode for strict validation
      await TraceLog.destroy();
      sessionStorage.setItem('tlog:qa_mode', 'true');
      await TraceLog.init();

      expect(() => TraceLog.event('')).toThrow();

      sessionStorage.removeItem('tlog:qa_mode');
    });

    it('should accept whitespace-only event name (current behavior)', () => {
      // Library currently accepts whitespace-only names
      expect(() => TraceLog.event('   ')).not.toThrow();
    });

    it('should accept event name with only special characters (current behavior)', () => {
      // Library currently accepts special character-only names
      expect(() => TraceLog.event('!!!')).not.toThrow();
    });
  });
});
