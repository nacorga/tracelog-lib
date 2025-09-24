import { debugLog } from '../utils/logging';

export class StorageManager {
  private readonly storage: globalThis.Storage | null = null;
  private readonly fallbackStorage = new Map<string, string>();
  private storageAvailable = false;

  constructor() {
    this.storage = this.init();
    this.storageAvailable = this.storage !== null;

    if (!this.storageAvailable) {
      debugLog.warn('StorageManager', 'localStorage not available, using memory fallback');
    }
  }

  getItem(key: string): string | null {
    if (!this.storageAvailable) {
      return this.fallbackStorage.get(key) ?? null;
    }

    try {
      if (this.storage) {
        return this.storage.getItem(key);
      }

      return this.fallbackStorage.get(key) ?? null;
    } catch (error) {
      debugLog.warn('StorageManager', 'Storage getItem failed, using memory fallback', { key, error });
      this.storageAvailable = false;
      return this.fallbackStorage.get(key) ?? null;
    }
  }

  setItem(key: string, value: string): void {
    if (!this.storageAvailable) {
      this.fallbackStorage.set(key, value);
      return;
    }

    try {
      if (this.storage) {
        this.storage.setItem(key, value);
      } else {
        this.fallbackStorage.set(key, value);
      }
    } catch (error) {
      const shouldRetry = this.handleStorageError(error as Error, key, 'set');

      if (shouldRetry) {
        try {
          this.storage?.setItem(key, value);
          return;
        } catch (retryError) {
          debugLog.warn('StorageManager', 'Storage retry failed, using memory fallback', { key, retryError });
        }
      }

      debugLog.warn('StorageManager', 'Storage setItem failed, using memory fallback', { key, error });
      this.storageAvailable = false;
      this.fallbackStorage.set(key, value);
    }
  }

  removeItem(key: string): void {
    if (!this.storageAvailable) {
      this.fallbackStorage.delete(key);
      return;
    }

    try {
      if (this.storage) {
        this.storage.removeItem(key);
        return;
      }

      this.fallbackStorage.delete(key);
    } catch (error) {
      debugLog.warn('StorageManager', 'Storage removeItem failed, using memory fallback', { key, error });
      this.storageAvailable = false;
      this.fallbackStorage.delete(key);
    }
  }

  private performStorageCleanup(): boolean {
    try {
      const keysToClean: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('tracelog_')) {
          try {
            const data = JSON.parse(localStorage.getItem(key) ?? '{}');
            const age = Date.now() - (data.timestamp ?? 0);

            if (age > 24 * 60 * 60 * 1000) {
              keysToClean.push(key);
            }
          } catch {
            keysToClean.push(key);
          }
        }
      }

      keysToClean.forEach((key) => localStorage.removeItem(key));

      debugLog.info('StorageManager', 'Storage cleanup completed', {
        keysRemoved: keysToClean.length,
      });

      return keysToClean.length > 0;
    } catch (error) {
      debugLog.error('StorageManager', 'Storage cleanup failed', { error });
      return false;
    }
  }

  private handleStorageError(error: Error, key: string, operation: 'get' | 'set'): boolean {
    if (error.name === 'QuotaExceededError') {
      debugLog.warn('StorageManager', 'Storage quota exceeded, attempting cleanup', { key, operation });

      const cleanupSuccess = this.performStorageCleanup();

      if (cleanupSuccess && operation === 'set') {
        debugLog.info('StorageManager', 'Retrying storage operation after cleanup', { key });
        return true;
      }
    }

    return false;
  }

  private init(): globalThis.Storage | null {
    try {
      const test = '__storage_test__';
      const storage = window['localStorage'];

      storage.setItem(test, test);
      storage.removeItem(test);

      return storage;
    } catch {
      return null;
    }
  }
}
