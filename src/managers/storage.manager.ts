export class StorageManager {
  private readonly storage: globalThis.Storage | null = null;
  private readonly fallbackStorage = new Map<string, string>();

  constructor() {
    this.storage = this.init();
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
    try {
      if (this.storage) {
        this.storage.setItem(key, value);

        return;
      }

      this.fallbackStorage.set(key, value);
    } catch {
      this.fallbackStorage.set(key, value);
    }
  }

  removeItem(key: string): void {
    try {
      if (this.storage) {
        this.storage.removeItem(key);

        return;
      }

      this.fallbackStorage.delete(key);
    } catch {
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
