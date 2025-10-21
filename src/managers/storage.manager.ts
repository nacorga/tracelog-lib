import { log } from '../utils';

/**
 * Robust localStorage and sessionStorage wrapper with automatic fallback to in-memory storage.
 *
 * **Purpose**: Provides consistent storage APIs across all browser environments,
 * handling quota limits, privacy modes, and SSR scenarios gracefully.
 *
 * **Core Functionality**:
 * - **Dual Storage**: localStorage (persistent) and sessionStorage (tab-scoped)
 * - **Automatic Fallback**: In-memory Maps when browser storage unavailable
 * - **Quota Handling**: Intelligent cleanup on QuotaExceededError
 * - **SSR-Safe**: No-op in Node.js environments
 *
 * **Key Features**:
 * - Separate fallback Maps for each storage type
 * - Storage quota error handling with automatic cleanup and retry
 * - Intelligent cleanup: Prioritizes removing persisted events over critical data
 * - Preserves: session, user, device, and config keys during cleanup
 * - Test key validation during initialization (`__tracelog_test__`)
 * - Public `isAvailable()` and `hasQuotaError()` for conditional logic
 * - Explicit `clear()` method for TraceLog-namespaced data only (`tracelog_*` prefix)
 *
 * **Cleanup Strategy** (on QuotaExceededError):
 * 1. Remove persisted events (`tracelog_persisted_events_*`) - usually largest data
 * 2. If no persisted events, remove up to 5 non-critical keys
 * 3. Preserve critical keys: `tracelog_session_*`, `tracelog_user_id`, `tracelog_device_id`, `tracelog_config`
 *
 * @see src/managers/README.md (lines 203-226) for detailed documentation
 *
 * @example
 * ```typescript
 * const storage = new StorageManager();
 *
 * // localStorage operations
 * storage.setItem('key', 'value');
 * const value = storage.getItem('key');
 * storage.removeItem('key');
 *
 * // sessionStorage operations
 * storage.setSessionItem('session_key', 'data');
 * const sessionValue = storage.getSessionItem('session_key');
 *
 * // Check availability
 * if (storage.isAvailable()) {
 *   // localStorage is working
 * }
 *
 * // Check for quota issues
 * if (storage.hasQuotaError()) {
 *   // Data may not persist
 * }
 * ```
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
   * Retrieves an item from localStorage.
   *
   * Automatically falls back to in-memory storage if localStorage unavailable.
   *
   * @param key - Storage key
   * @returns Stored value or null if not found
   */
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

  /**
   * Stores an item in localStorage with automatic quota handling.
   *
   * **Behavior**:
   * 1. Updates fallback storage first (ensures consistency)
   * 2. Attempts to store in localStorage
   * 3. On QuotaExceededError: Triggers cleanup and retries once
   * 4. Falls back to in-memory storage if retry fails
   *
   * **Cleanup on Quota Error**:
   * - Removes persisted events (largest data)
   * - Removes up to 5 non-critical keys
   * - Preserves session, user, device, and config keys
   *
   * @param key - Storage key
   * @param value - String value to store
   */
  setItem(key: string, value: string): void {
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

        const cleanedUp = this.cleanupOldData();

        if (cleanedUp) {
          try {
            if (this.storage) {
              this.storage.setItem(key, value);
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
    }
  }

  /**
   * Removes an item from localStorage and fallback storage.
   *
   * Safe to call even if key doesn't exist (idempotent).
   *
   * @param key - Storage key to remove
   */
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
   * Clears all TraceLog-related items from storage.
   *
   * Only removes keys with `tracelog_` prefix (safe for shared storage).
   * Clears both localStorage and fallback storage.
   *
   * **Use Cases**:
   * - User logout/privacy actions
   * - Development/testing cleanup
   * - Reset analytics state
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

      keysToRemove.forEach((key) => {
        this.storage!.removeItem(key);
      });
      this.fallbackStorage.clear();
    } catch (error) {
      log('error', 'Failed to clear storage', { error });
      this.fallbackStorage.clear();
    }
  }

  /**
   * Checks if localStorage is available.
   *
   * @returns true if localStorage is working, false if using fallback
   */
  isAvailable(): boolean {
    return this.storage !== null;
  }

  /**
   * Checks if a QuotaExceededError has occurred during this session.
   *
   * **Purpose**: Detect when localStorage is full and data may not persist.
   * Allows application to show warnings or adjust behavior.
   *
   * **Note**: Flag is set on first QuotaExceededError and never reset.
   *
   * @returns true if quota exceeded at any point during this session
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

      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key?.startsWith('tracelog_')) {
          tracelogKeys.push(key);

          if (key.startsWith('tracelog_persisted_events_')) {
            persistedEventsKeys.push(key);
          }
        }
      }

      if (persistedEventsKeys.length > 0) {
        persistedEventsKeys.forEach((key) => {
          try {
            this.storage!.removeItem(key);
          } catch {
            /* empty */
          }
        });

        return true;
      }

      const criticalPrefixes = ['tracelog_session_', 'tracelog_user_id', 'tracelog_device_id', 'tracelog_config'];

      const nonCriticalKeys = tracelogKeys.filter((key) => {
        return !criticalPrefixes.some((prefix) => key.startsWith(prefix));
      });

      if (nonCriticalKeys.length > 0) {
        const keysToRemove = nonCriticalKeys.slice(0, 5);
        keysToRemove.forEach((key) => {
          try {
            this.storage!.removeItem(key);
          } catch {
            /* empty */
          }
        });

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
   * Retrieves an item from sessionStorage.
   *
   * Automatically falls back to in-memory storage if sessionStorage unavailable.
   *
   * @param key - Storage key
   * @returns Stored value or null if not found
   */
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

  /**
   * Stores an item in sessionStorage with quota error detection.
   *
   * **Behavior**:
   * 1. Updates fallback storage first (ensures consistency)
   * 2. Attempts to store in sessionStorage
   * 3. On QuotaExceededError: Logs error and uses fallback (no retry/cleanup)
   *
   * **Note**: sessionStorage quota errors are rare (typically 5-10MB per tab).
   * No automatic cleanup unlike localStorage.
   *
   * @param key - Storage key
   * @param value - String value to store
   */
  setSessionItem(key: string, value: string): void {
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
    }
  }

  /**
   * Removes an item from sessionStorage and fallback storage.
   *
   * Safe to call even if key doesn't exist (idempotent).
   *
   * @param key - Storage key to remove
   */
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
