import { debugLog } from '../utils/logging';

export class StorageManager {
  private readonly storage: globalThis.Storage | null = null;
  private readonly fallbackStorage = new Map<string, string>();
  private storageAvailable = true;

  constructor() {
    this.storage = this.init();
    this.storageAvailable = this.storage !== null;
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
    } catch {
      debugLog.warn('StorageManager', 'Storage getItem failed, using memory fallback');
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
        return;
      }

      this.fallbackStorage.set(key, value);
    } catch {
      debugLog.warn('StorageManager', 'Storage setItem failed, using memory fallback');
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
    } catch {
      debugLog.warn('StorageManager', 'Storage removeItem failed, using memory fallback');
      this.storageAvailable = false;
      this.fallbackStorage.delete(key);
    }
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
