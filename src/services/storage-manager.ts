import { Storage } from '../types/storage.types';
import { log } from '../utils/log.utils';

class BrowserStorage implements Storage {
  private readonly storage: Storage;

  constructor(storage: Storage) {
    this.storage = storage;
  }

  public getItem(key: string): string | null {
    try {
      return this.storage.getItem(key);
    } catch (error) {
      log(
        'error',
        `Error getting item from ${this.storage}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );

      return null;
    }
  }

  public setItem(key: string, value: string): void {
    try {
      this.storage.setItem(key, value);
    } catch (error) {
      log(
        'error',
        `Error setting item in ${this.storage}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  public removeItem(key: string): void {
    try {
      this.storage.removeItem(key);
    } catch (error) {
      log(
        'error',
        `Error removing item from ${this.storage}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}

class MemoryStorage implements Storage {
  private state: Record<string, string> = {};

  public getItem(key: string): string | null {
    return this.state[key] || null;
  }

  public setItem(key: string, value: string): void {
    this.state[key] = value;
  }

  public removeItem(key: string): void {
    delete this.state[key];
  }
}

const createStorage = (type: 'localStorage' | 'sessionStorage'): Storage => {
  try {
    const storage = window[type];

    return new BrowserStorage(storage);
  } catch (error) {
    log(
      'error',
      `${type} is not available. Falling back to memory storage. ${error instanceof Error ? error.message : 'Unknown error'}`,
    );

    return new MemoryStorage();
  }
};

export const persistentStorage = createStorage('localStorage');
export const sessionSorage = createStorage('sessionStorage');
