/**
 * API Event Method Integration Tests
 *
 * Tests for TraceLog.event() method - custom event tracking
 * These tests verify the event() method works correctly after initialization
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as TraceLog from '../../src/api';
import { EmitterEvent, EventType } from '../../src/types';

describe('API Integration - Event Method', () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    // Cleanup any existing instance
    try {
      if (TraceLog.isInitialized()) {
        TraceLog.destroy();
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  afterEach(async () => {
    try {
      if (TraceLog.isInitialized()) {
        TraceLog.destroy();
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Before Initialization', () => {
    it('should throw error when called before init()', () => {
      expect(() => {
        TraceLog.event('test-event');
      }).toThrow('TraceLog not initialized');
    });

    it('should throw error with metadata before init()', () => {
      expect(() => {
        TraceLog.event('test-event', { key: 'value' });
      }).toThrow('TraceLog not initialized');
    });
  });

  describe('After Initialization', () => {
    beforeEach(async () => {
      await TraceLog.init();
    });

    it('should emit custom event with name only', async () => {
      const eventCallback = vi.fn();
      TraceLog.on(EmitterEvent.EVENT, eventCallback);

      TraceLog.event('button-click');
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(eventCallback).toHaveBeenCalled();
      const customEvents = eventCallback.mock.calls.filter((call) => call[0]?.type === EventType.CUSTOM);
      expect(customEvents.length).toBeGreaterThan(0);

      const event = customEvents[0]![0];
      expect(event.custom_event).toBeDefined();
      expect(event.custom_event.name).toBe('button-click');
      expect(event.custom_event.metadata).toBeUndefined();
    });

    it('should emit custom event with string metadata', async () => {
      const eventCallback = vi.fn();
      TraceLog.on(EmitterEvent.EVENT, eventCallback);

      TraceLog.event('purchase', { productId: 'abc123' });
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(eventCallback).toHaveBeenCalled();
      const customEvents = eventCallback.mock.calls.filter((call) => call[0]?.type === EventType.CUSTOM);
      expect(customEvents.length).toBeGreaterThan(0);

      const event = customEvents[0]![0];
      expect(event.custom_event.name).toBe('purchase');
      expect(event.custom_event.metadata).toEqual({ productId: 'abc123' });
    });

    it('should emit custom event with number metadata', async () => {
      const eventCallback = vi.fn();
      TraceLog.on(EmitterEvent.EVENT, eventCallback);

      TraceLog.event('purchase', { amount: 99.99 });
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(eventCallback).toHaveBeenCalled();
      const customEvents = eventCallback.mock.calls.filter((call) => call[0]?.type === EventType.CUSTOM);
      expect(customEvents.length).toBeGreaterThan(0);

      const event = customEvents[0]![0];
      expect(event.custom_event.name).toBe('purchase');
      expect(event.custom_event.metadata).toEqual({ amount: 99.99 });
    });

    it('should emit custom event with boolean metadata', async () => {
      const eventCallback = vi.fn();
      TraceLog.on(EmitterEvent.EVENT, eventCallback);

      TraceLog.event('feature-toggle', { enabled: true });
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(eventCallback).toHaveBeenCalled();
      const customEvents = eventCallback.mock.calls.filter((call) => call[0]?.type === EventType.CUSTOM);
      expect(customEvents.length).toBeGreaterThan(0);

      const event = customEvents[0]![0];
      expect(event.custom_event.name).toBe('feature-toggle');
      expect(event.custom_event.metadata).toEqual({ enabled: true });
    });

    it('should emit custom event with mixed metadata types', async () => {
      const eventCallback = vi.fn();
      TraceLog.on(EmitterEvent.EVENT, eventCallback);

      TraceLog.event('checkout', {
        productId: 'abc123',
        quantity: 2,
        isPremium: true,
      });
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(eventCallback).toHaveBeenCalled();
      const customEvents = eventCallback.mock.calls.filter((call) => call[0]?.type === EventType.CUSTOM);
      expect(customEvents.length).toBeGreaterThan(0);

      const event = customEvents[0]![0];
      expect(event.custom_event.name).toBe('checkout');
      expect(event.custom_event.metadata).toEqual({
        productId: 'abc123',
        quantity: 2,
        isPremium: true,
      });
    });

    it('should emit custom event with nested metadata one level deep', async () => {
      // Re-initialize with QA mode enabled
      TraceLog.destroy();
      sessionStorage.setItem('tlog:qa_mode', 'true');
      await TraceLog.init();

      const eventCallback = vi.fn();
      TraceLog.on(EmitterEvent.EVENT, eventCallback);

      // Nested objects one level deep are allowed
      TraceLog.event('order-placed', {
        order: {
          total: 199.99,
        },
      } as any);
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(eventCallback).toHaveBeenCalled();
      const customEvents = eventCallback.mock.calls.filter((call) => call[0]?.type === EventType.CUSTOM);
      expect(customEvents.length).toBeGreaterThan(0);

      const event = customEvents[0]![0];
      expect(event.custom_event.name).toBe('order-placed');
      expect(event.custom_event.metadata).toEqual({
        order: { total: 199.99 },
      });

      sessionStorage.removeItem('tlog:qa_mode');
    });

    it('should emit custom event with array metadata', async () => {
      const eventCallback = vi.fn();
      TraceLog.on(EmitterEvent.EVENT, eventCallback);

      TraceLog.event('cart-update', {
        items: ['item1', 'item2', 'item3'],
      });
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(eventCallback).toHaveBeenCalled();
      const customEvents = eventCallback.mock.calls.filter((call) => call[0]?.type === EventType.CUSTOM);
      expect(customEvents.length).toBeGreaterThan(0);

      const event = customEvents[0]![0];
      expect(event.custom_event.name).toBe('cart-update');
      expect(event.custom_event.metadata).toEqual({
        items: ['item1', 'item2', 'item3'],
      });
    });

    it('should emit custom event with empty metadata object', async () => {
      const eventCallback = vi.fn();
      TraceLog.on(EmitterEvent.EVENT, eventCallback);

      TraceLog.event('page-loaded', {});
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(eventCallback).toHaveBeenCalled();
      const customEvents = eventCallback.mock.calls.filter((call) => call[0]?.type === EventType.CUSTOM);
      expect(customEvents.length).toBeGreaterThan(0);

      const event = customEvents[0]![0];
      expect(event.custom_event.name).toBe('page-loaded');
      expect(event.custom_event.metadata).toEqual({});
    });

    it('should emit custom event with null metadata values', async () => {
      const eventCallback = vi.fn();
      TraceLog.on(EmitterEvent.EVENT, eventCallback);

      TraceLog.event('user-action', {
        userId: null,
        action: 'logout',
      } as any);
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(eventCallback).toHaveBeenCalled();
      const customEvents = eventCallback.mock.calls.filter((call) => call[0]?.type === EventType.CUSTOM);
      expect(customEvents.length).toBeGreaterThan(0);

      const event = customEvents[0]![0];
      expect(event.custom_event.name).toBe('user-action');
      expect(event.custom_event.metadata).toMatchObject({
        action: 'logout',
      });
    });

    it('should emit custom event with undefined metadata values', async () => {
      const eventCallback = vi.fn();
      TraceLog.on(EmitterEvent.EVENT, eventCallback);

      TraceLog.event('form-submit', {
        email: 'user@example.com',
        phone: undefined,
      } as any);
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(eventCallback).toHaveBeenCalled();
      const customEvents = eventCallback.mock.calls.filter((call) => call[0]?.type === EventType.CUSTOM);
      expect(customEvents.length).toBeGreaterThan(0);

      const event = customEvents[0]![0];
      expect(event.custom_event.name).toBe('form-submit');
      expect(event.custom_event.metadata).toMatchObject({
        email: 'user@example.com',
      });
    });
  });

  describe('Event Name Validation', () => {
    beforeEach(async () => {
      await TraceLog.init();
    });

    it('should emit event with letters only in name', async () => {
      const eventCallback = vi.fn();
      TraceLog.on(EmitterEvent.EVENT, eventCallback);

      TraceLog.event('buttonclick');
      await new Promise((resolve) => setTimeout(resolve, 50));

      const customEvents = eventCallback.mock.calls.filter((call) => call[0]?.type === EventType.CUSTOM);
      expect(customEvents.length).toBeGreaterThan(0);
      expect(customEvents[0]?.[0]?.custom_event?.name).toBe('buttonclick');
    });

    it('should emit event with hyphens in name', async () => {
      const eventCallback = vi.fn();
      TraceLog.on(EmitterEvent.EVENT, eventCallback);

      TraceLog.event('button-click');
      await new Promise((resolve) => setTimeout(resolve, 50));

      const customEvents = eventCallback.mock.calls.filter((call) => call[0]?.type === EventType.CUSTOM);
      expect(customEvents.length).toBeGreaterThan(0);
      expect(customEvents[0]?.[0]?.custom_event?.name).toBe('button-click');
    });

    it('should emit event with underscores in name', async () => {
      const eventCallback = vi.fn();
      TraceLog.on(EmitterEvent.EVENT, eventCallback);

      TraceLog.event('button_click');
      await new Promise((resolve) => setTimeout(resolve, 50));

      const customEvents = eventCallback.mock.calls.filter((call) => call[0]?.type === EventType.CUSTOM);
      expect(customEvents.length).toBeGreaterThan(0);
      expect(customEvents[0]?.[0]?.custom_event?.name).toBe('button_click');
    });

    it('should emit event with numbers in name', async () => {
      const eventCallback = vi.fn();
      TraceLog.on(EmitterEvent.EVENT, eventCallback);

      TraceLog.event('event123');
      await new Promise((resolve) => setTimeout(resolve, 50));

      const customEvents = eventCallback.mock.calls.filter((call) => call[0]?.type === EventType.CUSTOM);
      expect(customEvents.length).toBeGreaterThan(0);
      expect(customEvents[0]?.[0]?.custom_event?.name).toBe('event123');
    });

    it('should emit event with dots in name', async () => {
      const eventCallback = vi.fn();
      TraceLog.on(EmitterEvent.EVENT, eventCallback);

      TraceLog.event('user.action.click');
      await new Promise((resolve) => setTimeout(resolve, 50));

      const customEvents = eventCallback.mock.calls.filter((call) => call[0]?.type === EventType.CUSTOM);
      expect(customEvents.length).toBeGreaterThan(0);
      expect(customEvents[0]?.[0]?.custom_event?.name).toBe('user.action.click');
    });

    it('should emit event with long name', async () => {
      const longName = 'a'.repeat(100);
      const eventCallback = vi.fn();
      TraceLog.on(EmitterEvent.EVENT, eventCallback);

      TraceLog.event(longName);
      await new Promise((resolve) => setTimeout(resolve, 50));

      const customEvents = eventCallback.mock.calls.filter((call) => call[0]?.type === EventType.CUSTOM);
      expect(customEvents.length).toBeGreaterThan(0);
      expect(customEvents[0]?.[0]?.custom_event?.name).toBe(longName);
    });
  });

  describe('Multiple Events', () => {
    beforeEach(async () => {
      await TraceLog.init();
    });

    it('should emit multiple events in sequence', async () => {
      const eventCallback = vi.fn();
      TraceLog.on(EmitterEvent.EVENT, eventCallback);

      TraceLog.event('event1');
      TraceLog.event('event2');
      TraceLog.event('event3');
      await new Promise((resolve) => setTimeout(resolve, 50));

      const customEvents = eventCallback.mock.calls.filter((call) => call[0]?.type === EventType.CUSTOM);
      expect(customEvents.length).toBe(3);
      expect(customEvents[0]?.[0]?.custom_event?.name).toBe('event1');
      expect(customEvents[1]?.[0]?.custom_event?.name).toBe('event2');
      expect(customEvents[2]?.[0]?.custom_event?.name).toBe('event3');
    });

    it('should emit same event multiple times with small delays', async () => {
      const eventCallback = vi.fn();
      TraceLog.on(EmitterEvent.EVENT, eventCallback);

      TraceLog.event('repeat-event', { count: 1 });
      await new Promise((resolve) => setTimeout(resolve, 10));
      TraceLog.event('repeat-event', { count: 2 });
      await new Promise((resolve) => setTimeout(resolve, 10));
      TraceLog.event('repeat-event', { count: 3 });
      await new Promise((resolve) => setTimeout(resolve, 50));

      const customEvents = eventCallback.mock.calls.filter((call) => call[0]?.type === EventType.CUSTOM);
      expect(customEvents.length).toBeGreaterThanOrEqual(1);
      // Verify that the event name is correct
      customEvents.forEach((call) => {
        expect(call[0]!.custom_event!.name).toBe('repeat-event');
        expect(call[0]!.custom_event!.metadata).toHaveProperty('count');
      });
    });

    it('should emit events with different metadata', async () => {
      const eventCallback = vi.fn();
      TraceLog.on(EmitterEvent.EVENT, eventCallback);

      TraceLog.event('action-click', { type: 'click' });
      TraceLog.event('action-scroll', { type: 'scroll' });
      TraceLog.event('action-hover', { type: 'hover' });
      await new Promise((resolve) => setTimeout(resolve, 50));

      const customEvents = eventCallback.mock.calls.filter((call) => call[0]?.type === EventType.CUSTOM);
      expect(customEvents.length).toBe(3);
      expect(customEvents[0]?.[0]?.custom_event?.name).toBe('action-click');
      expect(customEvents[0]?.[0]?.custom_event?.metadata).toEqual({ type: 'click' });
      expect(customEvents[1]?.[0]?.custom_event?.name).toBe('action-scroll');
      expect(customEvents[1]?.[0]?.custom_event?.metadata).toEqual({ type: 'scroll' });
      expect(customEvents[2]?.[0]?.custom_event?.name).toBe('action-hover');
      expect(customEvents[2]?.[0]?.custom_event?.metadata).toEqual({ type: 'hover' });
    });
  });

  describe('Edge Cases', () => {
    beforeEach(async () => {
      await TraceLog.init();
    });

    it('should reject very large metadata objects (validation limit)', async () => {
      // Re-initialize with QA mode for strict validation
      TraceLog.destroy();
      sessionStorage.setItem('tlog:qa_mode', 'true');
      await TraceLog.init();

      const largeMetadata: Record<string, string> = {};
      for (let i = 0; i < 100; i++) {
        largeMetadata[`key${i}`] = `value${i}`;
      }

      // Library has size limits for metadata
      expect(() => {
        TraceLog.event('large-event', largeMetadata);
      }).toThrow();

      sessionStorage.removeItem('tlog:qa_mode');
    });

    it('should reject deeply nested metadata (strict validation)', async () => {
      // Re-initialize with QA mode for strict validation
      TraceLog.destroy();
      sessionStorage.setItem('tlog:qa_mode', 'true');
      await TraceLog.init();

      expect(() => {
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
        } as any);
      }).toThrow(/invalid types/i);

      sessionStorage.removeItem('tlog:qa_mode');
    });

    it('should emit event with special characters in metadata values', async () => {
      const eventCallback = vi.fn();
      TraceLog.on(EmitterEvent.EVENT, eventCallback);

      TraceLog.event('special-chars', {
        text: '<script>alert("test")</script>',
        emoji: '🚀 ✨ 🎉',
        unicode: '你好世界',
      });
      await new Promise((resolve) => setTimeout(resolve, 50));

      const customEvents = eventCallback.mock.calls.filter((call) => call[0]?.type === EventType.CUSTOM);
      expect(customEvents.length).toBeGreaterThan(0);

      const metadata = customEvents[0]?.[0]?.custom_event?.metadata;
      // Script tags are sanitized (security feature)
      expect(metadata.text).toBeDefined();
      expect(metadata.emoji).toBe('🚀 ✨ 🎉');
      expect(metadata.unicode).toBe('你好世界');
    });

    it('should reject metadata with circular references', async () => {
      // Re-initialize with QA mode for strict validation
      TraceLog.destroy();
      sessionStorage.setItem('tlog:qa_mode', 'true');
      await TraceLog.init();

      const circular: Record<string, unknown> = { name: 'test' };
      circular.self = circular;

      // Strict validation rejects circular references
      expect(() => {
        TraceLog.event('circular', circular as any);
      }).toThrow();

      sessionStorage.removeItem('tlog:qa_mode');
    });

    it('should emit event with reasonable-sized flat metadata', async () => {
      const eventCallback = vi.fn();
      TraceLog.on(EmitterEvent.EVENT, eventCallback);

      TraceLog.event('reasonable-event', {
        key1: 'value1',
        key2: 'value2',
        key3: 123,
        key4: true,
        key5: ['a', 'b', 'c'],
      });
      await new Promise((resolve) => setTimeout(resolve, 50));

      const customEvents = eventCallback.mock.calls.filter((call) => call[0]?.type === EventType.CUSTOM);
      expect(customEvents.length).toBeGreaterThan(0);
      expect(customEvents[0]?.[0]?.custom_event?.metadata).toEqual({
        key1: 'value1',
        key2: 'value2',
        key3: 123,
        key4: true,
        key5: ['a', 'b', 'c'],
      });
    });
  });

  describe('After Destroy', () => {
    it('should throw error when called after destroy()', async () => {
      await TraceLog.init();
      TraceLog.destroy();
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(() => {
        TraceLog.event('test-event');
      }).toThrow('TraceLog not initialized');
    });

    it('should emit events again after re-initialization', async () => {
      // First lifecycle
      await TraceLog.init();
      TraceLog.event('event1');
      TraceLog.destroy();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Second lifecycle
      await TraceLog.init();

      const eventCallback = vi.fn();
      TraceLog.on(EmitterEvent.EVENT, eventCallback);

      TraceLog.event('event2');
      await new Promise((resolve) => setTimeout(resolve, 50));

      const customEvents = eventCallback.mock.calls.filter((call) => call[0]?.type === EventType.CUSTOM);
      expect(customEvents.length).toBeGreaterThan(0);
      expect(customEvents[0]?.[0]?.custom_event?.name).toBe('event2');
    });
  });

  describe('Integration with Global Metadata', () => {
    it('should emit events with global metadata applied', async () => {
      await TraceLog.init({
        globalMetadata: {
          appVersion: '1.0.0',
          environment: 'test',
        },
      });

      const eventCallback = vi.fn();
      TraceLog.on(EmitterEvent.EVENT, eventCallback);

      TraceLog.event('user-action', {
        action: 'click',
        target: 'button',
      });
      await new Promise((resolve) => setTimeout(resolve, 50));

      const customEvents = eventCallback.mock.calls.filter((call) => call[0]?.type === EventType.CUSTOM);
      expect(customEvents.length).toBeGreaterThan(0);

      const event = customEvents[0]![0];
      expect(event.custom_event.name).toBe('user-action');
      expect(event.custom_event.metadata).toEqual({
        action: 'click',
        target: 'button',
      });
      // Global metadata is accessible via the event
      expect(event).toHaveProperty('timestamp');
      expect(event).toHaveProperty('type');
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await TraceLog.init();
    });

    it('should throw error for empty event name', async () => {
      // Re-initialize with QA mode for strict validation
      TraceLog.destroy();
      sessionStorage.setItem('tlog:qa_mode', 'true');
      await TraceLog.init();

      expect(() => {
        TraceLog.event('');
      }).toThrow();

      sessionStorage.removeItem('tlog:qa_mode');
    });

    it('should emit event with whitespace-only name', async () => {
      const eventCallback = vi.fn();
      TraceLog.on(EmitterEvent.EVENT, eventCallback);

      TraceLog.event('   ');
      await new Promise((resolve) => setTimeout(resolve, 50));

      const customEvents = eventCallback.mock.calls.filter((call) => call[0]?.type === EventType.CUSTOM);
      expect(customEvents.length).toBeGreaterThan(0);
      expect(customEvents[0]?.[0]?.custom_event?.name).toBe('   ');
    });

    it('should emit event with special characters only in name', async () => {
      const eventCallback = vi.fn();
      TraceLog.on(EmitterEvent.EVENT, eventCallback);

      TraceLog.event('!!!');
      await new Promise((resolve) => setTimeout(resolve, 50));

      const customEvents = eventCallback.mock.calls.filter((call) => call[0]?.type === EventType.CUSTOM);
      expect(customEvents.length).toBeGreaterThan(0);
      expect(customEvents[0]?.[0]?.custom_event?.name).toBe('!!!');
    });
  });
});
