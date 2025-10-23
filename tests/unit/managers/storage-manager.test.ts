/**
 * StorageManager Tests
 *
 * Priority: P0 (Critical)
 * Focus: Storage abstraction with fallbacks
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StorageManager } from '../../../src/managers/storage.manager';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';

describe('StorageManager', () => {
  let storage: StorageManager;

  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  describe('Initialization', () => {
    it('should initialize with localStorage and sessionStorage when available', () => {
      storage = new StorageManager();

      expect(storage.isAvailable()).toBe(true);
    });

    it('should validate storage with write-test during initialization', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');

      storage = new StorageManager();

      expect(setItemSpy).toHaveBeenCalledWith('__tracelog_test__', 'test');
      expect(removeItemSpy).toHaveBeenCalledWith('__tracelog_test__');
    });

    it('should handle SSR environment gracefully (no window)', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      storage = new StorageManager();

      expect(storage.isAvailable()).toBe(false);

      (global as any).window = originalWindow;
    });

    it('should fall back to in-memory storage when localStorage unavailable', () => {
      const originalLocalStorage = global.localStorage;
      delete (global as any).localStorage;

      storage = new StorageManager();

      expect(storage.isAvailable()).toBe(false);

      storage.setItem('test-key', 'test-value');
      expect(storage.getItem('test-key')).toBe('test-value');

      (global as any).localStorage = originalLocalStorage;
    });

    it('should fall back when localStorage write fails', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
        throw new Error('Storage unavailable');
      });

      storage = new StorageManager();

      expect(storage.isAvailable()).toBe(false);
    });
  });

  describe('localStorage operations', () => {
    beforeEach(() => {
      storage = new StorageManager();
    });

    describe('setItem', () => {
      it('should store item in localStorage', () => {
        storage.setItem('test-key', 'test-value');

        expect(localStorage.getItem('test-key')).toBe('test-value');
      });

      it('should update fallback storage first for consistency', () => {
        storage.setItem('test-key', 'test-value');

        expect(storage.getItem('test-key')).toBe('test-value');
      });

      it('should overwrite existing values', () => {
        storage.setItem('test-key', 'old-value');
        storage.setItem('test-key', 'new-value');

        expect(storage.getItem('test-key')).toBe('new-value');
      });
    });

    describe('getItem', () => {
      it('should retrieve item from localStorage', () => {
        localStorage.setItem('test-key', 'test-value');

        expect(storage.getItem('test-key')).toBe('test-value');
      });

      it('should return null for non-existent keys', () => {
        expect(storage.getItem('non-existent')).toBeNull();
      });

      it('should fall back to in-memory storage on read errors', () => {
        storage.setItem('test-key', 'test-value');

        vi.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
          throw new Error('Read error');
        });

        expect(storage.getItem('test-key')).toBe('test-value');
      });
    });

    describe('removeItem', () => {
      it('should remove item from localStorage', () => {
        storage.setItem('test-key', 'test-value');
        storage.removeItem('test-key');

        expect(localStorage.getItem('test-key')).toBeNull();
      });

      it('should remove item from fallback storage', () => {
        storage.setItem('test-key', 'test-value');
        storage.removeItem('test-key');

        expect(storage.getItem('test-key')).toBeNull();
      });

      it('should be idempotent (safe to call multiple times)', () => {
        storage.setItem('test-key', 'test-value');
        storage.removeItem('test-key');
        storage.removeItem('test-key');

        expect(storage.getItem('test-key')).toBeNull();
      });

      it('should handle removal errors gracefully', () => {
        vi.spyOn(Storage.prototype, 'removeItem').mockImplementationOnce(() => {
          throw new Error('Remove error');
        });

        expect(() => {
          storage.removeItem('test-key');
        }).not.toThrow();
      });
    });
  });

  describe('sessionStorage operations', () => {
    beforeEach(() => {
      storage = new StorageManager();
    });

    describe('setSessionItem', () => {
      it('should store item in sessionStorage', () => {
        storage.setSessionItem('session-key', 'session-value');

        expect(sessionStorage.getItem('session-key')).toBe('session-value');
      });

      it('should update fallback session storage first', () => {
        storage.setSessionItem('session-key', 'session-value');

        expect(storage.getSessionItem('session-key')).toBe('session-value');
      });
    });

    describe('getSessionItem', () => {
      it('should retrieve item from sessionStorage', () => {
        sessionStorage.setItem('session-key', 'session-value');

        expect(storage.getSessionItem('session-key')).toBe('session-value');
      });

      it('should return null for non-existent keys', () => {
        expect(storage.getSessionItem('non-existent')).toBeNull();
      });

      it('should fall back to in-memory storage on read errors', () => {
        storage.setSessionItem('session-key', 'session-value');

        vi.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
          throw new Error('Read error');
        });

        expect(storage.getSessionItem('session-key')).toBe('session-value');
      });
    });

    describe('removeSessionItem', () => {
      it('should remove item from sessionStorage', () => {
        storage.setSessionItem('session-key', 'session-value');
        storage.removeSessionItem('session-key');

        expect(sessionStorage.getItem('session-key')).toBeNull();
      });

      it('should remove item from fallback session storage', () => {
        storage.setSessionItem('session-key', 'session-value');
        storage.removeSessionItem('session-key');

        expect(storage.getSessionItem('session-key')).toBeNull();
      });
    });
  });

  describe('Quota error handling', () => {
    beforeEach(() => {
      storage = new StorageManager();
    });

    it('should detect QuotaExceededError and set flag', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
        const error = new DOMException('Quota exceeded', 'QuotaExceededError');
        throw error;
      });

      storage.setItem('large-key', 'large-value');

      expect(storage.hasQuotaError()).toBe(true);
    });

    it('should attempt cleanup on QuotaExceededError', () => {
      localStorage.setItem('tracelog_persisted_events_user1', JSON.stringify({ events: [] }));
      localStorage.setItem('tracelog_persisted_events_user2', JSON.stringify({ events: [] }));

      let attemptCount = 0;
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
        attemptCount++;
        if (attemptCount === 1) {
          throw new DOMException('Quota exceeded', 'QuotaExceededError');
        }
        localStorage.setItem(key, value);
      });

      storage.setItem('new-key', 'new-value');

      expect(localStorage.getItem('tracelog_persisted_events_user1')).toBeNull();
      expect(localStorage.getItem('tracelog_persisted_events_user2')).toBeNull();
    });

    it('should retry after cleanup succeeds', () => {
      localStorage.setItem('tracelog_persisted_events_user1', 'large-data');

      let attemptCount = 0;
      const originalSetItem = localStorage.setItem.bind(localStorage);
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key: string, value: string) {
        attemptCount++;
        if (attemptCount === 1) {
          throw new DOMException('Quota exceeded', 'QuotaExceededError');
        }
        originalSetItem(key, value);
      });

      storage.setItem('new-key', 'new-value');

      expect(localStorage.getItem('new-key')).toBe('new-value');
    });

    it('should fall back to memory if retry fails', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, _key: string, _value: string) {
        throw new DOMException('Quota exceeded', 'QuotaExceededError');
      });

      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(function (this: Storage, _key: string) {
        throw new Error('Storage access error');
      });

      storage.setItem('test-key', 'test-value');

      expect(storage.getItem('test-key')).toBe('test-value');
    });

    it('should prioritize removing persisted events during cleanup', () => {
      localStorage.setItem('tracelog_persisted_events_user1', 'data1');
      localStorage.setItem('tracelog_persisted_events_user2', 'data2');
      localStorage.setItem('tracelog_other_data', 'data3');

      let attemptCount = 0;
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
        attemptCount++;
        if (attemptCount === 1) {
          throw new DOMException('Quota exceeded', 'QuotaExceededError');
        }
        localStorage.setItem(key, value);
      });

      storage.setItem('new-key', 'new-value');

      expect(localStorage.getItem('tracelog_persisted_events_user1')).toBeNull();
      expect(localStorage.getItem('tracelog_persisted_events_user2')).toBeNull();
      expect(localStorage.getItem('tracelog_other_data')).toBe('data3');
    });

    it('should remove non-critical keys if no persisted events found', () => {
      localStorage.setItem('tracelog_session_active', 'session-data');
      localStorage.setItem('tracelog_user_id', 'user-123');
      localStorage.setItem('tracelog_non_critical_1', 'data1');
      localStorage.setItem('tracelog_non_critical_2', 'data2');

      let attemptCount = 0;
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
        attemptCount++;
        if (attemptCount === 1) {
          throw new DOMException('Quota exceeded', 'QuotaExceededError');
        }
        localStorage.setItem(key, value);
      });

      storage.setItem('new-key', 'new-value');

      expect(localStorage.getItem('tracelog_session_active')).toBe('session-data');
      expect(localStorage.getItem('tracelog_user_id')).toBe('user-123');
    });

    it('should preserve critical keys during cleanup', () => {
      localStorage.setItem('tracelog_session_active', 'session');
      localStorage.setItem('tracelog_user_id', 'user-123');
      localStorage.setItem('tracelog_device_id', 'device-456');
      localStorage.setItem('tracelog_config', '{}');
      localStorage.setItem('tracelog_non_critical', 'data');

      let attemptCount = 0;
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
        attemptCount++;
        if (attemptCount === 1) {
          throw new DOMException('Quota exceeded', 'QuotaExceededError');
        }
        localStorage.setItem(key, value);
      });

      storage.setItem('new-key', 'new-value');

      expect(localStorage.getItem('tracelog_session_active')).toBe('session');
      expect(localStorage.getItem('tracelog_user_id')).toBe('user-123');
      expect(localStorage.getItem('tracelog_device_id')).toBe('device-456');
      expect(localStorage.getItem('tracelog_config')).toBe('{}');
    });

    it('should limit non-critical key removal to 5 items', () => {
      for (let i = 0; i < 10; i++) {
        localStorage.setItem(`tracelog_non_critical_${i}`, `data${i}`);
      }

      let attemptCount = 0;
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
        attemptCount++;
        if (attemptCount === 1) {
          throw new DOMException('Quota exceeded', 'QuotaExceededError');
        }
        localStorage.setItem(key, value);
      });

      storage.setItem('new-key', 'new-value');

      let remainingCount = 0;
      for (let i = 0; i < 10; i++) {
        const item = localStorage.getItem(`tracelog_non_critical_${i}`);
        if (item !== null) {
          remainingCount++;
        }
      }

      expect(remainingCount).toBeGreaterThanOrEqual(5);
    });

    it('should handle sessionStorage quota errors without cleanup', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key: string, value: string) {
        if (this === sessionStorage) {
          throw new DOMException('Quota exceeded', 'QuotaExceededError');
        }
        const originalSetItem = localStorage.setItem.bind(localStorage);
        originalSetItem(key, value);
      });

      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(function (this: Storage, key: string) {
        if (this === sessionStorage) {
          throw new Error('Session storage access error');
        }
        const originalGetItem = localStorage.getItem.bind(localStorage);
        return originalGetItem(key);
      });

      storage.setSessionItem('large-session-key', 'large-value');

      expect(storage.getSessionItem('large-session-key')).toBe('large-value');
    });

    it('should recognize Error with QuotaExceededError name', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
        const error = new Error('Quota exceeded');
        error.name = 'QuotaExceededError';
        throw error;
      });

      storage.setItem('test-key', 'test-value');

      expect(storage.hasQuotaError()).toBe(true);
    });
  });

  describe('Fallback storage', () => {
    it('should use in-memory Map when localStorage unavailable', () => {
      const originalLocalStorage = global.localStorage;
      delete (global as any).localStorage;

      storage = new StorageManager();

      storage.setItem('memory-key', 'memory-value');
      expect(storage.getItem('memory-key')).toBe('memory-value');

      storage.removeItem('memory-key');
      expect(storage.getItem('memory-key')).toBeNull();

      (global as any).localStorage = originalLocalStorage;
    });

    it('should use separate Maps for localStorage and sessionStorage', () => {
      const originalLocalStorage = global.localStorage;
      const originalSessionStorage = global.sessionStorage;
      delete (global as any).localStorage;
      delete (global as any).sessionStorage;

      storage = new StorageManager();

      storage.setItem('local-key', 'local-value');
      storage.setSessionItem('session-key', 'session-value');

      expect(storage.getItem('local-key')).toBe('local-value');
      expect(storage.getSessionItem('session-key')).toBe('session-value');
      expect(storage.getItem('session-key')).toBeNull();
      expect(storage.getSessionItem('local-key')).toBeNull();

      (global as any).localStorage = originalLocalStorage;
      (global as any).sessionStorage = originalSessionStorage;
    });

    it('should sync fallback storage with localStorage operations', () => {
      storage = new StorageManager();

      storage.setItem('sync-key', 'sync-value');

      vi.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      expect(storage.getItem('sync-key')).toBe('sync-value');
    });
  });

  describe('clear()', () => {
    beforeEach(() => {
      storage = new StorageManager();
    });

    it('should remove only tracelog_ prefixed keys', () => {
      localStorage.setItem('tracelog_key1', 'value1');
      localStorage.setItem('tracelog_key2', 'value2');
      localStorage.setItem('other_key', 'other-value');

      storage.clear();

      expect(localStorage.getItem('tracelog_key1')).toBeNull();
      expect(localStorage.getItem('tracelog_key2')).toBeNull();
      expect(localStorage.getItem('other_key')).toBe('other-value');
    });

    it('should clear fallback storage', () => {
      const originalLocalStorage = global.localStorage;
      delete (global as any).localStorage;

      storage = new StorageManager();

      storage.setItem('tracelog_key1', 'value1');
      storage.setItem('tracelog_key2', 'value2');

      storage.clear();

      expect(storage.getItem('tracelog_key1')).toBeNull();
      expect(storage.getItem('tracelog_key2')).toBeNull();

      (global as any).localStorage = originalLocalStorage;
    });

    it('should handle clear errors gracefully', () => {
      localStorage.setItem('tracelog_key', 'value');

      vi.spyOn(Storage.prototype, 'removeItem').mockImplementationOnce(() => {
        throw new Error('Remove error');
      });

      expect(() => {
        storage.clear();
      }).not.toThrow();
    });

    it('should preserve non-tracelog keys', () => {
      localStorage.setItem('user_preferences', 'preferences');
      localStorage.setItem('app_state', 'state');
      localStorage.setItem('tracelog_session', 'session');

      storage.clear();

      expect(localStorage.getItem('user_preferences')).toBe('preferences');
      expect(localStorage.getItem('app_state')).toBe('state');
      expect(localStorage.getItem('tracelog_session')).toBeNull();
    });
  });

  describe('Utility methods', () => {
    describe('isAvailable()', () => {
      it('should return true when localStorage is available', () => {
        storage = new StorageManager();

        expect(storage.isAvailable()).toBe(true);
      });

      it('should return false when localStorage is unavailable', () => {
        const originalLocalStorage = global.localStorage;
        delete (global as any).localStorage;

        storage = new StorageManager();

        expect(storage.isAvailable()).toBe(false);

        (global as any).localStorage = originalLocalStorage;
      });

      it('should return false when storage write-test fails', () => {
        vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
          throw new Error('Storage unavailable');
        });

        storage = new StorageManager();

        expect(storage.isAvailable()).toBe(false);
      });
    });

    describe('hasQuotaError()', () => {
      beforeEach(() => {
        storage = new StorageManager();
      });

      it('should return false initially', () => {
        expect(storage.hasQuotaError()).toBe(false);
      });

      it('should return true after QuotaExceededError occurs', () => {
        vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
          throw new DOMException('Quota exceeded', 'QuotaExceededError');
        });

        storage.setItem('test-key', 'test-value');

        expect(storage.hasQuotaError()).toBe(true);
      });

      it('should remain true for entire session after quota error', () => {
        vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
          throw new DOMException('Quota exceeded', 'QuotaExceededError');
        });

        storage.setItem('key1', 'value1');
        expect(storage.hasQuotaError()).toBe(true);

        storage.setItem('key2', 'value2');
        expect(storage.hasQuotaError()).toBe(true);
      });

      it('should not be set by sessionStorage quota errors', () => {
        vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
          throw new DOMException('Quota exceeded', 'QuotaExceededError');
        });

        storage.setSessionItem('session-key', 'session-value');

        expect(storage.hasQuotaError()).toBe(false);
      });
    });
  });

  describe('Edge cases', () => {
    beforeEach(() => {
      storage = new StorageManager();
    });

    it('should handle empty string values', () => {
      storage.setItem('empty-key', '');

      expect(storage.getItem('empty-key')).toBe('');
    });

    it('should handle special characters in keys', () => {
      const specialKey = 'key-with-special_chars.@#$%';
      storage.setItem(specialKey, 'value');

      expect(storage.getItem(specialKey)).toBe('value');
    });

    it('should handle large values', () => {
      const largeValue = 'x'.repeat(10000);
      storage.setItem('large-key', largeValue);

      expect(storage.getItem('large-key')).toBe(largeValue);
    });

    it('should handle rapid sequential operations', () => {
      for (let i = 0; i < 100; i++) {
        storage.setItem(`key-${i}`, `value-${i}`);
      }

      for (let i = 0; i < 100; i++) {
        expect(storage.getItem(`key-${i}`)).toBe(`value-${i}`);
      }
    });

    it('should handle mixed storage operations', () => {
      storage.setItem('local-key', 'local-value');
      storage.setSessionItem('session-key', 'session-value');

      expect(storage.getItem('local-key')).toBe('local-value');
      expect(storage.getSessionItem('session-key')).toBe('session-value');

      storage.removeItem('local-key');
      storage.removeSessionItem('session-key');

      expect(storage.getItem('local-key')).toBeNull();
      expect(storage.getSessionItem('session-key')).toBeNull();
    });
  });
});
