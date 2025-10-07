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
    // Always update fallback FIRST for consistency
    // This ensures fallback is in sync and can serve as backup if storage fails
    this.fallbackStorage.set(key, value);

    try {
      if (this.storage) {
        this.storage.setItem(key, value);
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.hasQuotaExceededError = true;

        log('warn', 'localStorage quota exceeded, attempting cleanup', {
          data: { key, valueSize: value.length },
        });

        // Attempt to free up space by removing old TraceLog data
        const cleanedUp = this.cleanupOldData();

        if (cleanedUp) {
          // Retry after cleanup
          try {
            if (this.storage) {
              this.storage.setItem(key, value);
              // Successfully stored after cleanup
              return;
            }
          } catch (retryError) {
            log('error', 'localStorage quota exceeded even after cleanup - data will not persist', {
              error: retryError,
              data: { key, valueSize: value.length },
            });
          }
        } else {
          log('error', 'localStorage quota exceeded and no data to cleanup - data will not persist', {
            error,
            data: { key, valueSize: value.length },
          });
        }
      }
      // Else: Silent fallback - user already warned in constructor
      // Data is already in fallbackStorage (set at beginning)
    }
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
   * Attempts to cleanup old TraceLog data from storage to free up space
   * Returns true if any data was removed, false otherwise
   */
  private cleanupOldData(): boolean {
    if (!this.storage) {
      return false;
    }

    try {
      const tracelogKeys: string[] = [];
      const persistedEventsKeys: string[] = [];

      // Collect all TraceLog keys
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key?.startsWith('tracelog_')) {
          tracelogKeys.push(key);

          // Prioritize removing old persisted events
          if (key.startsWith('tracelog_persisted_events_')) {
            persistedEventsKeys.push(key);
          }
        }
      }

      // First, try to remove old persisted events (usually the largest data)
      if (persistedEventsKeys.length > 0) {
        persistedEventsKeys.forEach((key) => {
          try {
            this.storage!.removeItem(key);
          } catch {
            // Ignore errors during cleanup
          }
        });

        // Successfully cleaned up - no need to log in production
        return true;
      }

      // If no persisted events, remove non-critical keys
      // Define critical key prefixes that should be preserved
      const criticalPrefixes = ['tracelog_session_', 'tracelog_user_id', 'tracelog_device_id', 'tracelog_config'];

      const nonCriticalKeys = tracelogKeys.filter((key) => {
        // Keep keys that start with any critical prefix
        return !criticalPrefixes.some((prefix) => key.startsWith(prefix));
      });

      if (nonCriticalKeys.length > 0) {
        // Remove up to 5 non-critical keys
        const keysToRemove = nonCriticalKeys.slice(0, 5);
        keysToRemove.forEach((key) => {
          try {
            this.storage!.removeItem(key);
          } catch {
            // Ignore errors during cleanup
          }
        });

        // Successfully cleaned up - no need to log in production
        return true;
      }

      return false;
    } catch (error) {
      log('error', 'Failed to cleanup old data', { error });
      return false;
    }
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
    // Always update fallback FIRST for consistency
    this.fallbackSessionStorage.set(key, value);

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
      // Data is already in fallbackSessionStorage (set at beginning)
    }
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
