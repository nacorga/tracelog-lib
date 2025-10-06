import { log } from '../utils';

/**
 * Manages localStorage and sessionStorage with automatic fallback to in-memory storage.
 * Provides a consistent interface for storing session data, configuration,
 * and analytics metadata across browser environments.
 */
export class StorageManager {
  private readonly storage: Storage | null;
  private readonly sessionStorageRef: Storage | null;
  private readonly fallbackStorage = new Map<string, string>();
  private readonly fallbackSessionStorage = new Map<string, string>();

  private hasQuotaExceededError = false;

  constructor() {
    this.storage = this.initializeStorage('localStorage');
    this.sessionStorageRef = this.initializeStorage('sessionStorage');

    if (!this.storage) {
      log('warn', 'localStorage not available, using memory fallback');
    }
    if (!this.sessionStorageRef) {
      log('warn', 'sessionStorage not available, using memory fallback');
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
    } catch {
      // Silent fallback - user already warned in constructor
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

        log('error', 'localStorage quota exceeded - data will not persist after reload', {
          error,
          data: { key, valueSize: value.length },
        });
      }
      // Else: Silent fallback - user already warned in constructor
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
    } catch {
      // Silent - not critical
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
    } catch (error) {
      log('error', 'Failed to clear storage', { error });
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
   * Initialize storage (localStorage or sessionStorage) with feature detection
   */
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

  /**
   * Retrieves an item from sessionStorage
   */
  getSessionItem(key: string): string | null {
    try {
      if (this.sessionStorageRef) {
        return this.sessionStorageRef.getItem(key);
      }
      return this.fallbackSessionStorage.get(key) ?? null;
    } catch {
      // Silent fallback - user already warned in constructor
      return this.fallbackSessionStorage.get(key) ?? null;
    }
  }

  /**
   * Stores an item in sessionStorage
   */
  setSessionItem(key: string, value: string): void {
    try {
      if (this.sessionStorageRef) {
        this.sessionStorageRef.setItem(key, value);
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        log('error', 'sessionStorage quota exceeded - data will not persist', {
          error,
          data: { key, valueSize: value.length },
        });
      }
      // Else: Silent fallback - user already warned in constructor
    }

    // Always update fallback for consistency
    this.fallbackSessionStorage.set(key, value);
  }

  /**
   * Removes an item from sessionStorage
   */
  removeSessionItem(key: string): void {
    try {
      if (this.sessionStorageRef) {
        this.sessionStorageRef.removeItem(key);
      }
    } catch {
      // Silent - not critical
    }

    // Always clean fallback
    this.fallbackSessionStorage.delete(key);
  }
}
