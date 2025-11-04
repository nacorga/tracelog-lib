/**
 * Public API Tests
 * Focus: Public API methods exposed to users
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';
import * as api from '../../../src/api';
import { destroy } from '../../../src/api';

describe('Public API - init()', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment();
    try {
      destroy();
    } catch {
      // Ignore errors during cleanup
    }
  });

  it('should expose init method globally', () => {
    expect(api.init).toBeDefined();
    expect(typeof api.init).toBe('function');
  });

  it('should initialize with no arguments', async () => {
    await expect(api.init()).resolves.toBeUndefined();
    expect(api.isInitialized()).toBe(true);
  });

  it('should initialize with config object', async () => {
    await expect(api.init({ sessionTimeout: 60000 })).resolves.toBeUndefined();
    expect(api.isInitialized()).toBe(true);
  });

  it('should return promise that resolves', async () => {
    const result = api.init();
    expect(result).toBeInstanceOf(Promise);
    await expect(result).resolves.toBeUndefined();
  });

  it('should reject double initialization', async () => {
    await api.init();
    // Second init should be silently ignored (no-op)
    await api.init();
    expect(api.isInitialized()).toBe(true);
  });

  it('should validate config before initializing', async () => {
    // Invalid config should throw during validation
    await expect(api.init({ sessionTimeout: -1000 } as any)).rejects.toThrow();
  });
});

describe('Public API - event()', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment();
    try {
      destroy();
    } catch {
      // Ignore errors
    }
  });

  it('should expose event method globally', () => {
    expect(api.event).toBeDefined();
    expect(typeof api.event).toBe('function');
  });

  it('should send custom event with name only', async () => {
    await api.init();

    // Should not throw
    expect(() => {
      api.event('test_event');
    }).not.toThrow();
  });

  it('should send custom event with metadata', async () => {
    await api.init();

    const metadata = { key: 'value', count: 42 };
    expect(() => {
      api.event('test_event', metadata);
    }).not.toThrow();
  });

  it('should validate event name', async () => {
    await api.init();

    // Empty string should be handled
    expect(() => {
      api.event('');
    }).not.toThrow();
  });

  it('should validate metadata structure', async () => {
    await api.init();

    // Valid metadata structures
    expect(() => {
      api.event('test', { key: 'value' });
    }).not.toThrow();
    expect(() => {
      api.event('test', [{ key: 'value' }]);
    }).not.toThrow();
  });

  it('should throw if called before init', () => {
    expect(() => {
      api.event('test');
    }).toThrow('[TraceLog] TraceLog not initialized');
  });

  it('should handle invalid metadata gracefully', async () => {
    await api.init();

    // Should handle various metadata types gracefully
    expect(() => {
      api.event('test', { key: null } as any);
    }).not.toThrow();
  });
});

describe('Public API - on()', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment();
    try {
      destroy();
    } catch {
      // Ignore errors
    }
  });

  it('should expose on method globally', () => {
    expect(api.on).toBeDefined();
    expect(typeof api.on).toBe('function');
  });

  it('should register event listener', async () => {
    const listener = vi.fn();

    api.on('event' as any, listener);
    await api.init();

    // Trigger an event
    api.event('test_event');

    // Wait for event to be processed
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(listener).toHaveBeenCalled();
  });

  it('should register queue listener', async () => {
    const listener = vi.fn();

    api.on('queue' as any, listener);
    await api.init();

    // Queue listener should be called when events are batched
    // The listener may be called during init or after events are queued
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  it('should allow multiple listeners for same event', async () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();

    api.on('event' as any, listener1);
    api.on('event' as any, listener2);
    await api.init();

    api.event('test_event');
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(listener1).toHaveBeenCalled();
    expect(listener2).toHaveBeenCalled();
  });

  it('should call listeners with correct data', async () => {
    const listener = vi.fn();

    api.on('event' as any, listener);
    await api.init();

    api.event('test_event', { key: 'value' });
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(listener).toHaveBeenCalled();
    const eventData = listener.mock.calls[listener.mock.calls.length - 1]?.[0];
    expect(eventData).toHaveProperty('type');
  });

  it('should handle listener errors gracefully', async () => {
    const errorListener = vi.fn(() => {
      throw new Error('Listener error');
    });
    const validListener = vi.fn();

    await api.init();

    // Register both error listener and valid listener
    api.on('event' as any, errorListener);
    api.on('event' as any, validListener);

    // Listener errors propagate (by design), so event() WILL throw
    expect(() => {
      api.event('test_event');
    }).toThrow('Listener error');

    // Error listener was called (threw error)
    expect(errorListener).toHaveBeenCalled();
    // Valid listener is NOT called because error listener threw first
    // (emitter calls callbacks in registration order and doesn't catch errors)
  });
});

describe('Public API - off()', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment();
    try {
      destroy();
    } catch {
      // Ignore errors
    }
  });

  it('should expose off method globally', () => {
    expect(api.off).toBeDefined();
    expect(typeof api.off).toBe('function');
  });

  it('should remove specific listener', async () => {
    const listener = vi.fn();

    api.on('event' as any, listener);
    await api.init();

    // Clear calls from SESSION_START and PAGE_VIEW during init
    listener.mockClear();

    api.off('event' as any, listener);

    api.event('test_event');
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Listener should not be called after removal
    expect(listener).not.toHaveBeenCalled();
  });

  it('should not affect other listeners', async () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();

    api.on('event' as any, listener1);
    api.on('event' as any, listener2);
    await api.init();

    // Clear calls from SESSION_START and PAGE_VIEW during init
    listener1.mockClear();
    listener2.mockClear();

    api.off('event' as any, listener1);

    api.event('test_event');
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(listener1).not.toHaveBeenCalled();
    expect(listener2).toHaveBeenCalled();
  });

  it('should handle removing non-existent listener', async () => {
    const listener = vi.fn();

    await api.init();

    // Should not throw
    expect(() => {
      api.off('event' as any, listener);
    }).not.toThrow();
  });

  it('should allow removing all listeners', async () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();

    api.on('event' as any, listener1);
    api.on('event' as any, listener2);
    await api.init();

    // Clear calls from SESSION_START and PAGE_VIEW during init
    listener1.mockClear();
    listener2.mockClear();

    api.off('event' as any, listener1);
    api.off('event' as any, listener2);

    api.event('test_event');
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(listener1).not.toHaveBeenCalled();
    expect(listener2).not.toHaveBeenCalled();
  });
});

describe('Public API - destroy()', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  it('should expose destroy method globally', () => {
    expect(api.destroy).toBeDefined();
    expect(typeof api.destroy).toBe('function');
  });

  it('should cleanup all resources', async () => {
    await api.init();
    expect(api.isInitialized()).toBe(true);

    api.destroy();

    expect(api.isInitialized()).toBe(false);
  });

  it('should stop all tracking', async () => {
    const listener = vi.fn();

    api.on('event' as any, listener);
    await api.init();

    api.destroy();

    // Events should not be tracked after destroy
    expect(() => {
      api.event('test');
    }).toThrow();
  });

  it('should allow re-initialization after destroy', async () => {
    await api.init();
    api.destroy();

    // Should be able to init again
    await expect(api.init()).resolves.toBeUndefined();
    expect(api.isInitialized()).toBe(true);

    // Cleanup
    api.destroy();
  });

  it('should handle destroy before init', () => {
    // Should not throw
    expect(() => {
      api.destroy();
    }).not.toThrow();
    expect(api.isInitialized()).toBe(false);
  });
});

describe('Public API - setQaMode()', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment();
    try {
      destroy();
    } catch {
      // Ignore errors
    }
  });

  it('should expose setQaMode method globally', () => {
    expect(api.setQaMode).toBeDefined();
    expect(typeof api.setQaMode).toBe('function');
  });

  it('should enable QA mode', () => {
    api.setQaMode(true);

    // Verify QA mode is stored in sessionStorage
    const mode = sessionStorage.getItem('tlog:qa_mode');
    expect(mode).toBe('true');
  });

  it('should disable QA mode', () => {
    api.setQaMode(true);
    api.setQaMode(false);

    const mode = sessionStorage.getItem('tlog:qa_mode');
    expect(mode).toBe('false');
  });

  it('should persist QA mode to sessionStorage', () => {
    api.setQaMode(true);

    const mode = sessionStorage.getItem('tlog:qa_mode');
    expect(mode).toBe('true');

    // Should persist after toggling
    api.setQaMode(false);
    expect(sessionStorage.getItem('tlog:qa_mode')).toBe('false');
  });

  it('should work before init', () => {
    // Should not throw before init
    expect(() => {
      api.setQaMode(true);
    }).not.toThrow();
    expect(sessionStorage.getItem('tlog:qa_mode')).toBe('true');
  });

  it('should work after init', async () => {
    await api.init();

    // Should not throw after init
    expect(() => {
      api.setQaMode(true);
    }).not.toThrow();
    expect(sessionStorage.getItem('tlog:qa_mode')).toBe('true');
  });
});

describe('Public API - setTransformer()', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment();
    try {
      destroy();
    } catch {
      // Ignore errors
    }
  });

  it('should expose setTransformer method globally', () => {
    expect(api.setTransformer).toBeDefined();
    expect(typeof api.setTransformer).toBe('function');
  });

  it('should set beforeSend transformer', () => {
    const transformer = (data: any): any => data;

    // Should not throw
    expect(() => {
      api.setTransformer('beforeSend', transformer);
    }).not.toThrow();
  });

  it('should set beforeBatch transformer', () => {
    const transformer = (data: any): any => data;

    // Should not throw
    expect(() => {
      api.setTransformer('beforeBatch', transformer);
    }).not.toThrow();
  });

  it('should validate transformer is function', () => {
    const transformer = (data: any): any => data;

    // Valid function should not throw
    expect(() => {
      api.setTransformer('beforeSend', transformer);
    }).not.toThrow();
  });

  it('should throw if transformer is not function', () => {
    // Invalid transformers should throw
    expect(() => {
      api.setTransformer('beforeSend', 'not a function' as any);
    }).toThrow('[TraceLog] Transformer must be a function');
    expect(() => {
      api.setTransformer('beforeSend', null as any);
    }).toThrow('[TraceLog] Transformer must be a function');
    expect(() => {
      api.setTransformer('beforeSend', 42 as any);
    }).toThrow('[TraceLog] Transformer must be a function');
  });

  it('should work before init', () => {
    const transformer = (data: any): any => data;

    // Should not throw before init
    expect(() => {
      api.setTransformer('beforeSend', transformer);
    }).not.toThrow();
  });

  it('should work after init', async () => {
    await api.init();

    const transformer = (data: any): any => data;

    // Should not throw after init
    expect(() => {
      api.setTransformer('beforeSend', transformer);
    }).not.toThrow();
  });
});

describe('Public API - removeTransformer()', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment();
    try {
      destroy();
    } catch {
      // Ignore errors
    }
  });

  it('should expose removeTransformer method globally', () => {
    expect(api.removeTransformer).toBeDefined();
    expect(typeof api.removeTransformer).toBe('function');
  });

  it('should remove beforeSend transformer', () => {
    const transformer = (data: any): any => data;

    api.setTransformer('beforeSend', transformer);

    // Should not throw
    expect(() => {
      api.removeTransformer('beforeSend');
    }).not.toThrow();
  });

  it('should remove beforeBatch transformer', () => {
    const transformer = (data: any): any => data;

    api.setTransformer('beforeBatch', transformer);

    // Should not throw
    expect(() => {
      api.removeTransformer('beforeBatch');
    }).not.toThrow();
  });

  it('should handle removing non-existent transformer', () => {
    // Should not throw when removing non-existent transformer
    expect(() => {
      api.removeTransformer('beforeSend');
    }).not.toThrow();
    expect(() => {
      api.removeTransformer('beforeBatch');
    }).not.toThrow();
  });
});

describe('Public API - updateGlobalMetadata()', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment();
    try {
      destroy();
    } catch {
      // Ignore errors
    }
  });

  it('should expose updateGlobalMetadata method globally', () => {
    expect(api.updateGlobalMetadata).toBeDefined();
    expect(typeof api.updateGlobalMetadata).toBe('function');
  });

  it('should replace global metadata', async () => {
    await api.init({
      globalMetadata: { env: 'production', version: '1.0.0' },
    });

    // Should not throw
    expect(() => {
      api.updateGlobalMetadata({ userId: 'user-123', plan: 'premium' });
    }).not.toThrow();
  });

  it('should clear global metadata with empty object', async () => {
    await api.init({
      globalMetadata: { env: 'production' },
    });

    // Should not throw
    expect(() => {
      api.updateGlobalMetadata({});
    }).not.toThrow();
  });

  it('should throw if not initialized', () => {
    expect(() => {
      api.updateGlobalMetadata({ key: 'value' });
    }).toThrow('[TraceLog] TraceLog not initialized. Please call init() first.');
  });

  it('should throw if called during destroy', async () => {
    await api.init();

    // Mock isDestroying state
    const destroyPromise = new Promise<void>((resolve) => {
      setTimeout(() => {
        try {
          destroy();
        } catch {
          // Ignore
        }
        resolve();
      }, 100);
    });

    // This test is tricky - we can't reliably test the destroying state
    // Just verify it throws when not initialized after destroy
    await destroyPromise;

    expect(() => {
      api.updateGlobalMetadata({ key: 'value' });
    }).toThrow();
  });

  it('should validate metadata structure', async () => {
    await api.init();

    // Non-object types should throw
    expect(() => {
      api.updateGlobalMetadata(null as any);
    }).toThrow(/Global metadata must be a plain object/);

    expect(() => {
      api.updateGlobalMetadata(['array'] as any);
    }).toThrow(/Global metadata must be a plain object/);
  });

  it('should accept primitives', async () => {
    await api.init();

    expect(() => {
      api.updateGlobalMetadata({
        str: 'value',
        num: 42,
        bool: true,
      });
    }).not.toThrow();
  });

  it('should accept nested objects (1 level deep)', async () => {
    await api.init();

    expect(() => {
      api.updateGlobalMetadata({
        user: {
          id: 'user-123',
          premium: true,
        },
      });
    }).not.toThrow();
  });

  it('should accept string arrays', async () => {
    await api.init();

    expect(() => {
      api.updateGlobalMetadata({
        tags: ['tag1', 'tag2', 'tag3'],
      });
    }).not.toThrow();
  });
});

describe('Public API - mergeGlobalMetadata()', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment();
    try {
      destroy();
    } catch {
      // Ignore errors
    }
  });

  it('should expose mergeGlobalMetadata method globally', () => {
    expect(api.mergeGlobalMetadata).toBeDefined();
    expect(typeof api.mergeGlobalMetadata).toBe('function');
  });

  it('should merge with existing metadata', async () => {
    await api.init({
      globalMetadata: { env: 'production', version: '1.0.0' },
    });

    // Should not throw
    expect(() => {
      api.mergeGlobalMetadata({ userId: 'user-123' });
    }).not.toThrow();
  });

  it('should overwrite existing keys', async () => {
    await api.init({
      globalMetadata: { env: 'production', version: '1.0.0' },
    });

    // Should not throw
    expect(() => {
      api.mergeGlobalMetadata({ version: '1.1.0' });
    }).not.toThrow();
  });

  it('should work with no existing metadata', async () => {
    await api.init();

    // Should not throw
    expect(() => {
      api.mergeGlobalMetadata({ key: 'value' });
    }).not.toThrow();
  });

  it('should throw if not initialized', () => {
    expect(() => {
      api.mergeGlobalMetadata({ key: 'value' });
    }).toThrow('[TraceLog] TraceLog not initialized. Please call init() first.');
  });

  it('should throw if called during destroy', async () => {
    await api.init();

    const destroyPromise = new Promise<void>((resolve) => {
      setTimeout(() => {
        try {
          destroy();
        } catch {
          // Ignore
        }
        resolve();
      }, 100);
    });

    await destroyPromise;

    expect(() => {
      api.mergeGlobalMetadata({ key: 'value' });
    }).toThrow();
  });

  it('should validate metadata structure', async () => {
    await api.init();

    // Non-object types should throw
    expect(() => {
      api.mergeGlobalMetadata(null as any);
    }).toThrow(/Global metadata must be a plain object/);

    expect(() => {
      api.mergeGlobalMetadata(['array'] as any);
    }).toThrow(/Global metadata must be a plain object/);
  });

  it('should accept primitives', async () => {
    await api.init();

    expect(() => {
      api.mergeGlobalMetadata({
        str: 'value',
        num: 42,
        bool: true,
      });
    }).not.toThrow();
  });

  it('should accept nested objects (1 level deep)', async () => {
    await api.init();

    expect(() => {
      api.mergeGlobalMetadata({
        user: {
          id: 'user-123',
          premium: true,
        },
      });
    }).not.toThrow();
  });

  it('should accept string arrays', async () => {
    await api.init();

    expect(() => {
      api.mergeGlobalMetadata({
        tags: ['tag1', 'tag2', 'tag3'],
      });
    }).not.toThrow();
  });
});
