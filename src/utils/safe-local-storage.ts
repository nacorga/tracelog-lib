const memoryFallback = new Map<string, string>();

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
