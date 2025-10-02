import { debugLog } from '../utils/logging/debug-logger.utils';

/**
 * Manages localStorage with automatic fallback to in-memory storage.
 * Provides a consistent interface for storing session data, configuration,
 * and analytics metadata across browser environments.
 */
export class StorageManager {
  private readonly storage: Storage | null;
  private readonly fallbackStorage = new Map<string, string>();

  private hasQuotaExceededError = false;

  constructor() {
    this.storage = this.initializeStorage();

    if (!this.storage) {
      debugLog.warn('StorageManager', 'localStorage not available, using memory fallback');
    }
  }

  /**
   * Retrieves an item from storage
   */
  getItem(key: string): string | null {
    try {
      if (this.storage) {
        return this.storage.getItem(key);
      }
      return this.fallbackStorage.get(key) ?? null;
    } catch (error) {
      debugLog.warn('StorageManager', 'Failed to get item, using fallback', { key, error });
      return this.fallbackStorage.get(key) ?? null;
    }
  }

  /**
   * Stores an item in storage
   */
  setItem(key: string, value: string): void {
    try {
      if (this.storage) {
        this.storage.setItem(key, value);
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.hasQuotaExceededError = true;

        debugLog.error('StorageManager', 'localStorage quota exceeded - data will not persist after reload', {
          key,
          valueSize: value.length,
        });
      } else {
        debugLog.warn('StorageManager', 'Failed to set item, using fallback', { key, error });
      }
    }

    // Always update fallback for consistency
    this.fallbackStorage.set(key, value);
  }

  /**
   * Removes an item from storage
   */
  removeItem(key: string): void {
    try {
      if (this.storage) {
        this.storage.removeItem(key);
      }
    } catch (error) {
      debugLog.warn('StorageManager', 'Failed to remove item', { key, error });
    }

    // Always clean fallback
    this.fallbackStorage.delete(key);
  }

  /**
   * Clears all TracLog-related items from storage
   */
  clear(): void {
    if (!this.storage) {
      this.fallbackStorage.clear();
      return;
    }

    try {
      const keysToRemove: string[] = [];

      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key?.startsWith('tracelog_')) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => this.storage!.removeItem(key));
      this.fallbackStorage.clear();

      debugLog.debug('StorageManager', 'Cleared storage', { itemsRemoved: keysToRemove.length });
    } catch (error) {
      debugLog.error('StorageManager', 'Failed to clear storage', { error });
      this.fallbackStorage.clear();
    }
  }

  /**
   * Checks if storage is available
   */
  isAvailable(): boolean {
    return this.storage !== null;
  }

  /**
   * Checks if a QuotaExceededError has occurred
   * This indicates localStorage is full and data may not persist
   */
  hasQuotaError(): boolean {
    return this.hasQuotaExceededError;
  }

  /**
   * Initialize localStorage with feature detection
   */
  private initializeStorage(): Storage | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const storage = window.localStorage;
      const testKey = '__tracelog_test__';

      storage.setItem(testKey, 'test');
      storage.removeItem(testKey);

      return storage;
    } catch {
      return null;
    }
  }
}
