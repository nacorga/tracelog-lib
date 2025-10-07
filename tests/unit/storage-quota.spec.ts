/**
 * StorageManager Quota Error Test
 *
 * Tests that QuotaExceededError is properly detected and flagged
 * Critical bug: Silent data loss when localStorage is full
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageManager } from '../../src/managers/storage.manager';

describe('StorageManager - Quota Error Detection', () => {
  let storageManager: StorageManager;
  let originalSetItem: typeof Storage.prototype.setItem;
  let originalGetItem: typeof Storage.prototype.getItem;

  beforeEach(() => {
    vi.clearAllMocks();
    // Save originals
    originalSetItem = Storage.prototype.setItem;
    originalGetItem = Storage.prototype.getItem;
  });

  afterEach(() => {
    // Always restore to avoid test interference
    Storage.prototype.setItem = originalSetItem;
    Storage.prototype.getItem = originalGetItem;
    vi.restoreAllMocks();
  });

  it('should detect QuotaExceededError and set flag', () => {
    // Create manager BEFORE mocking to allow initialization to pass
    storageManager = new StorageManager();

    expect(storageManager.hasQuotaError()).toBe(false);

    // NOW mock setItem to fail
    Storage.prototype.setItem = vi.fn(() => {
      const error = new DOMException('localStorage quota exceeded', 'QuotaExceededError');
      throw error;
    });

    // Attempt to store item (will trigger QuotaExceededError)
    storageManager.setItem('test-key', 'test-value');

    // Should detect the error
    expect(storageManager.hasQuotaError()).toBe(true);
  });

  it('should continue operation after quota error', () => {
    storageManager = new StorageManager();

    Storage.prototype.setItem = vi.fn(() => {
      const error = new DOMException('localStorage quota exceeded', 'QuotaExceededError');
      throw error;
    });

    // Should not throw when quota exceeded (uses fallback)
    expect(() => {
      storageManager.setItem('test-key', 'test-value');
    }).not.toThrow();

    // Quota error flag should be set
    expect(storageManager.hasQuotaError()).toBe(true);
  });

  it('should not flag quota error for other storage exceptions', () => {
    storageManager = new StorageManager();

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Some other error');
    });

    storageManager.setItem('test-key', 'test-value');

    // Should NOT flag quota error for non-quota exceptions
    expect(storageManager.hasQuotaError()).toBe(false);

    setItemSpy.mockRestore();
  });

  it('should maintain quota error flag across multiple operations', () => {
    storageManager = new StorageManager();

    Storage.prototype.setItem = vi.fn(() => {
      const error = new DOMException('localStorage quota exceeded', 'QuotaExceededError');
      throw error;
    });

    // First operation triggers quota error
    storageManager.setItem('key1', 'value1');
    expect(storageManager.hasQuotaError()).toBe(true);

    // Subsequent operations should maintain the flag
    storageManager.setItem('key2', 'value2');
    expect(storageManager.hasQuotaError()).toBe(true);

    storageManager.setItem('key3', 'value3');
    expect(storageManager.hasQuotaError()).toBe(true);
  });

  it('should work normally when localStorage has space', () => {
    // Use real localStorage (which should have space in tests)
    storageManager = new StorageManager();

    expect(storageManager.hasQuotaError()).toBe(false);

    storageManager.setItem('test-key', 'test-value');

    expect(storageManager.hasQuotaError()).toBe(false);
    expect(storageManager.getItem('test-key')).toBe('test-value');

    // Cleanup
    storageManager.removeItem('test-key');
  });
});
