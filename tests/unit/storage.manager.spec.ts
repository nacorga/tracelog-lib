/**
 * StorageManager Unit Tests
 *
 * Tests storage abstraction layer to detect library defects:
 * - Falls back to memory when localStorage unavailable
 * - Handles QuotaExceededError gracefully
 * - Handles SecurityError in restricted contexts
 * - Clears only TraceLog-specific data
 *
 * Focus: Detect storage failures that could cause data loss
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StorageManager } from '../../src/managers/storage.manager';

describe('StorageManager', () => {
  let storageManager: StorageManager;
  let originalLocalStorage: Storage;

  beforeEach(() => {
    // Save original localStorage
    originalLocalStorage = global.localStorage;
    storageManager = new StorageManager();
  });

  afterEach(() => {
    // Restore original localStorage
    global.localStorage = originalLocalStorage;
    vi.restoreAllMocks();
  });

  describe('Basic Operations', () => {
    it('should set and get items from localStorage', () => {
      storageManager.setItem('test_key', 'test_value');
      const value = storageManager.getItem('test_key');

      expect(value).toBe('test_value');
    });

    it('should return null for non-existent keys', () => {
      const value = storageManager.getItem('non_existent_key');

      expect(value).toBeNull();
    });

    it('should remove items from localStorage', () => {
      storageManager.setItem('test_key', 'test_value');
      storageManager.removeItem('test_key');
      const value = storageManager.getItem('test_key');

      expect(value).toBeNull();
    });

    it('should report localStorage as available when working', () => {
      expect(storageManager.isAvailable()).toBe(true);
    });
  });

  describe('Fallback to Memory Storage', () => {
    it('should fallback to memory when localStorage throws on setItem', () => {
      // Mock localStorage to throw QuotaExceededError
      const mockSetItem = vi.fn(() => {
        throw new DOMException('QuotaExceededError');
      });

      global.localStorage = {
        ...originalLocalStorage,
        setItem: mockSetItem,
      };

      const fallbackStorage = new StorageManager();
      fallbackStorage.setItem('test_key', 'test_value');

      // Should use memory fallback
      const value = fallbackStorage.getItem('test_key');
      expect(value).toBe('test_value');
    });

    it('should fallback to memory when localStorage throws on getItem', () => {
      const mockGetItem = vi.fn(() => {
        throw new Error('SecurityError');
      });

      global.localStorage = {
        ...originalLocalStorage,
        getItem: mockGetItem,
        setItem: () => {},
      } as unknown as Storage;

      const fallbackStorage = new StorageManager();

      // Set in fallback (since getItem throws)
      fallbackStorage.setItem('test_key', 'test_value');
      const value = fallbackStorage.getItem('test_key');

      expect(value).toBe('test_value');
    });

    it('should handle completely unavailable localStorage', () => {
      // Simulate browser without localStorage
      const descriptor = Object.getOwnPropertyDescriptor(global, 'localStorage');

      Object.defineProperty(global, 'localStorage', {
        configurable: true,
        get: () => {
          throw new Error('localStorage not available');
        },
      });

      const fallbackStorage = new StorageManager();

      // Should still work with memory fallback
      fallbackStorage.setItem('test_key', 'test_value');
      const value = fallbackStorage.getItem('test_key');

      expect(value).toBe('test_value');
      expect(fallbackStorage.isAvailable()).toBe(false);

      // Restore descriptor
      if (descriptor) {
        Object.defineProperty(global, 'localStorage', descriptor);
      }
    });
  });

  describe('Clear Functionality', () => {
    it('should clear only tracelog_ prefixed items', () => {
      storageManager.setItem('tracelog_session', 'session_data');
      storageManager.setItem('tracelog_queue', 'queue_data');
      storageManager.setItem('other_app_data', 'other_data');

      storageManager.clear();

      expect(storageManager.getItem('tracelog_session')).toBeNull();
      expect(storageManager.getItem('tracelog_queue')).toBeNull();
      expect(storageManager.getItem('other_app_data')).toBe('other_data');
    });

    it('should handle clear when localStorage throws', () => {
      const mockClear = vi.fn(() => {
        throw new Error('Clear failed');
      });

      global.localStorage = {
        ...originalLocalStorage,
        length: 0,
        key: () => null,
        clear: mockClear,
      } as unknown as Storage;

      const fallbackStorage = new StorageManager();
      fallbackStorage.setItem('test_key', 'test_value');

      // Should not throw
      expect(() => fallbackStorage.clear()).not.toThrow();
    });

    it('should clear memory fallback storage', () => {
      // Force fallback by making localStorage unavailable
      global.localStorage = {
        ...originalLocalStorage,
        setItem: () => {
          throw new Error('QuotaExceededError');
        },
      } as unknown as Storage;

      const fallbackStorage = new StorageManager();
      fallbackStorage.setItem('test_key', 'test_value');

      fallbackStorage.clear();

      const value = fallbackStorage.getItem('test_key');
      expect(value).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle removeItem errors gracefully', () => {
      const mockRemoveItem = vi.fn(() => {
        throw new Error('RemoveItem failed');
      });

      global.localStorage = {
        ...originalLocalStorage,
        removeItem: mockRemoveItem,
      } as unknown as Storage;

      const fallbackStorage = new StorageManager();

      // Should not throw
      expect(() => fallbackStorage.removeItem('test_key')).not.toThrow();
    });

    it('should handle corrupted localStorage data', () => {
      const mockGetItem = vi.fn(() => {
        throw new Error('Corrupted data');
      });

      global.localStorage = {
        ...originalLocalStorage,
        getItem: mockGetItem,
        setItem: () => {},
      } as unknown as Storage;

      const fallbackStorage = new StorageManager();

      // Should return null for corrupted data
      const value = fallbackStorage.getItem('test_key');
      expect(value).toBeNull();
    });

    it('should handle setItem with large data (QuotaExceededError)', () => {
      let callCount = 0;
      const mockSetItem = vi.fn(() => {
        callCount++;
        if (callCount === 1) {
          throw new DOMException('QuotaExceededError');
        }
      });

      global.localStorage = {
        ...originalLocalStorage,
        setItem: mockSetItem,
      } as unknown as Storage;

      const fallbackStorage = new StorageManager();

      // First call throws, should fallback
      fallbackStorage.setItem('large_key', 'x'.repeat(10000000));

      // Second call should work with fallback
      fallbackStorage.setItem('test_key', 'test_value');
      const value = fallbackStorage.getItem('test_key');

      expect(value).toBe('test_value');
    });
  });

  describe('Consistency Between Storage and Fallback', () => {
    it('should always update fallback on setItem failure', () => {
      const mockSetItem = vi.fn(() => {
        throw new Error('Storage full');
      });

      global.localStorage = {
        ...originalLocalStorage,
        setItem: mockSetItem,
      } as unknown as Storage;

      const fallbackStorage = new StorageManager();

      fallbackStorage.setItem('test_key', 'test_value');

      // Should be available in fallback
      const value = fallbackStorage.getItem('test_key');
      expect(value).toBe('test_value');
    });

    it('should handle mixed storage states', () => {
      // Scenario: localStorage works initially, then fails
      let shouldFail = false;
      const mockSetItem = vi.fn((key: string, value: string) => {
        if (shouldFail) {
          throw new Error('Storage failed');
        }
        originalLocalStorage.setItem(key, value);
      });

      global.localStorage = {
        ...originalLocalStorage,
        setItem: mockSetItem,
      } as unknown as Storage;

      const fallbackStorage = new StorageManager();

      // First write succeeds
      fallbackStorage.setItem('key1', 'value1');
      expect(fallbackStorage.getItem('key1')).toBe('value1');

      // Make storage fail
      shouldFail = true;

      // Second write fails but fallback works
      fallbackStorage.setItem('key2', 'value2');
      expect(fallbackStorage.getItem('key2')).toBe('value2');
    });
  });
});
