import { log } from '../utils';

/**
 * Robust localStorage and sessionStorage wrapper with automatic fallback to in-memory storage.
 *
 * - Dual storage: localStorage (persistent) + sessionStorage (tab-scoped).
 * - Automatic in-memory fallback when browser storage unavailable (privacy modes, SSR).
 * - On `QuotaExceededError`: single-pass cleanup — purges `tracelog_persisted_events_*`
 *   first (largest, recoverable), retries once. Preserves session/user/device/config keys.
 */
export class StorageManager {
  private readonly storage: Storage | null;
  private readonly sessionStorageRef: Storage | null;
  private readonly fallbackStorage = new Map<string, string>();
  private readonly fallbackSessionStorage = new Map<string, string>();

  constructor() {
    this.storage = this.initializeStorage('localStorage');
    this.sessionStorageRef = this.initializeStorage('sessionStorage');

    if (!this.storage) {
      log('debug', 'localStorage not available, using memory fallback');
    }
    if (!this.sessionStorageRef) {
      log('debug', 'sessionStorage not available, using memory fallback');
    }
  }

  getItem(key: string): string | null {
    try {
      if (this.storage) {
        return this.storage.getItem(key);
      }
      return this.fallbackStorage.get(key) ?? null;
    } catch {
      return this.fallbackStorage.get(key) ?? null;
    }
  }

  setItem(key: string, value: string): void {
    this.fallbackStorage.set(key, value);

    if (!this.storage) {
      return;
    }

    try {
      this.storage.setItem(key, value);
      return;
    } catch (error) {
      const isQuotaError =
        (error instanceof DOMException && error.name === 'QuotaExceededError') ||
        (error instanceof Error && error.name === 'QuotaExceededError');

      if (!isQuotaError) {
        return;
      }

      log('warn', 'localStorage quota exceeded, attempting cleanup', {
        data: { key, valueSize: value.length },
      });

      if (!this.cleanupOldData()) {
        log('error', 'localStorage quota exceeded and no data to cleanup - data will not persist', {
          error,
          data: { key, valueSize: value.length },
        });
        return;
      }

      try {
        this.storage.setItem(key, value);
      } catch (retryError) {
        log('error', 'localStorage quota exceeded even after cleanup - data will not persist', {
          error: retryError,
          data: { key, valueSize: value.length },
        });
      }
    }
  }

  removeItem(key: string): void {
    try {
      if (this.storage) {
        this.storage.removeItem(key);
      }
    } catch {
      /* empty */
    }

    this.fallbackStorage.delete(key);
  }

  /**
   * Single-pass cleanup for QuotaExceededError. Purges persisted-events keys
   * (largest, safe to discard — recoverable) and up to 5 other non-critical
   * tracelog_* keys in one pass. Preserves session/user/device/config keys.
   */
  private cleanupOldData(): boolean {
    if (!this.storage) {
      return false;
    }

    try {
      const criticalPrefixes = ['tracelog_session_', 'tracelog_user_id', 'tracelog_device_id', 'tracelog_config'];
      const persistedKeys: string[] = [];
      const nonCriticalKeys: string[] = [];

      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (!key?.startsWith('tracelog_')) continue;

        if (key.startsWith('tracelog_persisted_events_')) {
          persistedKeys.push(key);
        } else if (!criticalPrefixes.some((prefix) => key.startsWith(prefix))) {
          nonCriticalKeys.push(key);
        }
      }

      const keysToRemove = [...persistedKeys, ...nonCriticalKeys.slice(0, 5)];

      if (keysToRemove.length === 0) {
        return false;
      }

      keysToRemove.forEach((key) => {
        try {
          this.storage!.removeItem(key);
        } catch {
          /* empty */
        }
      });

      return true;
    } catch (error) {
      log('error', 'Failed to cleanup old data', { error });
      return false;
    }
  }

  private initializeStorage(type: 'localStorage' | 'sessionStorage'): Storage | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const storage = type === 'localStorage' ? window.localStorage : window.sessionStorage;
      const testKey = '__tracelog_test__';

      storage.setItem(testKey, 'test');
      storage.removeItem(testKey);

      return storage;
    } catch {
      return null;
    }
  }

  getSessionItem(key: string): string | null {
    try {
      if (this.sessionStorageRef) {
        return this.sessionStorageRef.getItem(key);
      }
      return this.fallbackSessionStorage.get(key) ?? null;
    } catch {
      return this.fallbackSessionStorage.get(key) ?? null;
    }
  }

  setSessionItem(key: string, value: string): void {
    this.fallbackSessionStorage.set(key, value);

    try {
      if (this.sessionStorageRef) {
        this.sessionStorageRef.setItem(key, value);
        return;
      }
    } catch (error) {
      const isQuotaError =
        (error instanceof DOMException && error.name === 'QuotaExceededError') ||
        (error instanceof Error && error.name === 'QuotaExceededError');

      if (isQuotaError) {
        log('error', 'sessionStorage quota exceeded - data will not persist', {
          error,
          data: { key, valueSize: value.length },
        });
      }
    }
  }

  removeSessionItem(key: string): void {
    try {
      if (this.sessionStorageRef) {
        this.sessionStorageRef.removeItem(key);
      }
    } catch {
      /* empty */
    }

    this.fallbackSessionStorage.delete(key);
  }
}
