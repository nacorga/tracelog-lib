const memoryFallback = new Map<string, string>();

/**
 * Checks if localStorage is available and functional
 * @returns True if localStorage is available
 */
const isLocalStorageAvailable = (): boolean => {
  try {
    const test = '__localStorage_test__';

    localStorage.setItem(test, test);
    localStorage.removeItem(test);

    return true;
  } catch {
    return false;
  }
};

/**
 * Safely retrieves an item from localStorage with memory fallback
 * @param key - The storage key
 * @returns The stored value or null if not found
 */
export const safeLocalStorageGet = (key: string): string | null => {
  try {
    if (isLocalStorageAvailable()) {
      return localStorage.getItem(key);
    }

    return memoryFallback.get(key) ?? null;
  } catch {
    return memoryFallback.get(key) ?? null;
  }
};

/**
 * Safely stores an item in localStorage with memory fallback
 * @param key - The storage key
 * @param value - The value to store
 * @returns True if the operation was successful
 */
export const safeLocalStorageSet = (key: string, value: string): boolean => {
  try {
    if (isLocalStorageAvailable()) {
      localStorage.setItem(key, value);

      return true;
    }
    memoryFallback.set(key, value);

    return true;
  } catch {
    memoryFallback.set(key, value);

    return true;
  }
};

/**
 * Safely removes an item from localStorage with memory fallback
 * @param key - The storage key
 * @returns True if the operation was successful
 */
export const safeLocalStorageRemove = (key: string): boolean => {
  try {
    if (isLocalStorageAvailable()) {
      localStorage.removeItem(key);

      return true;
    }

    memoryFallback.delete(key);
    return true;
  } catch {
    memoryFallback.delete(key);

    return true;
  }
};
