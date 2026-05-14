/**
 * StorageManager - Coverage Tests
 *
 * Exercises the simplified v3.0 storage wrapper: dual local + session storage,
 * automatic in-memory fallback when browser APIs are unavailable, and
 * single-pass quota-error cleanup that preserves critical keys.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';
import { StorageManager } from '../../../src/managers/storage.manager';

describe('StorageManager - basic operations', () => {
  let storage: StorageManager;

  beforeEach(() => {
    setupTestEnvironment();
    storage = new StorageManager();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  it('reads, writes and removes localStorage items', () => {
    storage.setItem('key1', 'value1');
    expect(storage.getItem('key1')).toBe('value1');

    storage.removeItem('key1');
    expect(storage.getItem('key1')).toBeNull();
  });

  it('returns null for missing keys', () => {
    expect(storage.getItem('does-not-exist')).toBeNull();
  });

  it('overwrites existing values', () => {
    storage.setItem('key', 'a');
    storage.setItem('key', 'b');
    expect(storage.getItem('key')).toBe('b');
  });

  it('reads, writes and removes sessionStorage items', () => {
    storage.setSessionItem('skey', 'sval');
    expect(storage.getSessionItem('skey')).toBe('sval');

    storage.removeSessionItem('skey');
    expect(storage.getSessionItem('skey')).toBeNull();
  });

  it('keeps localStorage and sessionStorage isolated from each other', () => {
    storage.setItem('shared', 'local');
    storage.setSessionItem('shared', 'session');

    expect(storage.getItem('shared')).toBe('local');
    expect(storage.getSessionItem('shared')).toBe('session');
  });

  it('handles repeated removeItem calls without throwing', () => {
    storage.setItem('k', 'v');
    storage.removeItem('k');
    expect(() => {
      storage.removeItem('k');
    }).not.toThrow();
    expect(storage.getItem('k')).toBeNull();
  });
});

describe('StorageManager - fallback to in-memory', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });
  afterEach(() => {
    cleanupTestEnvironment();
  });

  it('falls back to in-memory map when localStorage.getItem throws after initialization', () => {
    const storage = new StorageManager();
    storage.setItem('k', 'v');

    // Make Storage.prototype.getItem throw — manager must read from fallbackStorage.
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = vi.fn(() => {
      throw new Error('SecurityError: storage disabled');
    });

    try {
      expect(storage.getItem('k')).toBe('v');
    } finally {
      Storage.prototype.getItem = original;
    }
  });

  it('falls back to in-memory for sessionStorage when getItem throws', () => {
    const storage = new StorageManager();
    storage.setSessionItem('sk', 'sv');

    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = vi.fn(() => {
      throw new Error('SecurityError');
    });

    try {
      expect(storage.getSessionItem('sk')).toBe('sv');
    } finally {
      Storage.prototype.getItem = original;
    }
  });

  it('removeItem swallows real-storage exceptions without throwing', () => {
    const storage = new StorageManager();
    storage.setItem('k', 'v');

    const original = Storage.prototype.removeItem;
    Storage.prototype.removeItem = vi.fn(() => {
      throw new Error('SecurityError');
    });

    try {
      expect(() => {
        storage.removeItem('k');
      }).not.toThrow();
    } finally {
      Storage.prototype.removeItem = original;
    }
  });

  it('removeSessionItem swallows real-storage exceptions without throwing', () => {
    const storage = new StorageManager();
    storage.setSessionItem('sk', 'sv');

    const original = Storage.prototype.removeItem;
    Storage.prototype.removeItem = vi.fn(() => {
      throw new Error('SecurityError');
    });

    try {
      expect(() => {
        storage.removeSessionItem('sk');
      }).not.toThrow();
    } finally {
      Storage.prototype.removeItem = original;
    }
  });
});

describe('StorageManager - quota-exceeded cleanup', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });
  afterEach(() => {
    cleanupTestEnvironment();
  });

  it('cleans up tracelog_persisted_events_* on QuotaExceededError and retries setItem', () => {
    const storage = new StorageManager();

    // Pre-seed cleanup candidates and one critical key directly via originalSet.
    localStorage.setItem('tracelog_persisted_events_1', '{"x":1}');
    localStorage.setItem('tracelog_persisted_events_2', '{"x":2}');
    localStorage.setItem('tracelog_user_id', 'keep');

    const originalSet = Storage.prototype.setItem;
    let attempt = 0;
    Storage.prototype.setItem = vi.fn(function (this: Storage, key: string, value: string) {
      // Only throw on the user's setItem for 'fresh-key', not on initialization probes or cleanup retries.
      if (key === 'fresh-key') {
        attempt++;
        if (attempt === 1) {
          const err = new Error('Quota');
          err.name = 'QuotaExceededError';
          throw err;
        }
      }
      originalSet.call(this, key, value);
    });

    try {
      storage.setItem('fresh-key', 'v');
    } finally {
      Storage.prototype.setItem = originalSet;
    }

    // Retry succeeded.
    expect(localStorage.getItem('fresh-key')).toBe('v');
    // Persisted-events keys were purged.
    expect(localStorage.getItem('tracelog_persisted_events_1')).toBeNull();
    expect(localStorage.getItem('tracelog_persisted_events_2')).toBeNull();
    // Critical key preserved.
    expect(localStorage.getItem('tracelog_user_id')).toBe('keep');
  });

  it('gives up gracefully when QuotaExceededError fires and no cleanup candidates exist', () => {
    const storage = new StorageManager();

    const originalSet = Storage.prototype.setItem;
    Storage.prototype.setItem = vi.fn(() => {
      const err = new Error('Quota');
      err.name = 'QuotaExceededError';
      throw err;
    });

    let threw = false;
    try {
      storage.setItem('k', 'v');
    } catch {
      threw = true;
    } finally {
      Storage.prototype.setItem = originalSet;
    }

    // Public contract: setItem never throws. In-memory mirror still populated for getItem fallback.
    expect(threw).toBe(false);

    // Force getItem to take the catch path so we observe the fallback mirror.
    const originalGet = Storage.prototype.getItem;
    Storage.prototype.getItem = vi.fn(() => {
      throw new Error('SecurityError');
    });
    try {
      expect(storage.getItem('k')).toBe('v');
    } finally {
      Storage.prototype.getItem = originalGet;
    }
  });

  it('ignores non-quota setItem errors (no cleanup, no throw)', () => {
    const storage = new StorageManager();

    const originalSet = Storage.prototype.setItem;
    Storage.prototype.setItem = vi.fn(() => {
      throw new Error('SecurityError');
    });

    try {
      expect(() => {
        storage.setItem('k', 'v');
      }).not.toThrow();
    } finally {
      Storage.prototype.setItem = originalSet;
    }

    // Fallback mirror was populated even though real storage refused.
    const originalGet = Storage.prototype.getItem;
    Storage.prototype.getItem = vi.fn(() => {
      throw new Error('SecurityError');
    });
    try {
      expect(storage.getItem('k')).toBe('v');
    } finally {
      Storage.prototype.getItem = originalGet;
    }
  });

  it('still persists if setItem fails after cleanup but does not throw', () => {
    const storage = new StorageManager();

    const originalSet = Storage.prototype.setItem;
    Storage.prototype.setItem = vi.fn(() => {
      const err = new Error('Quota');
      err.name = 'QuotaExceededError';
      throw err;
    });

    try {
      expect(() => {
        storage.setItem('persisted-key', 'v');
      }).not.toThrow();
    } finally {
      Storage.prototype.setItem = originalSet;
    }
  });
});
