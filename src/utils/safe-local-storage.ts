import { Base } from '../base';

export interface StorageManager {
  set(key: string, value: unknown): boolean;
  get(key: string): unknown;
  remove(key: string): boolean;
  isAvailable(): boolean;
  clear(): void;
  getSize(): number;
}

export class SafeLocalStorage extends Base implements StorageManager {
  private readonly available: boolean;
  private readonly memoryFallback: Map<string, string> = new Map();

  constructor() {
    super();
    this.available = this.checkAvailability();
  }

  private checkAvailability(): boolean {
    try {
      const testKey = '__tracelog_test__';

      window.localStorage.setItem(testKey, 'test');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      this.log('warning', 'localStorage not available, using memory fallback');

      return false;
    }
  }

  set(key: string, value: unknown): boolean {
    let serialized: string;

    try {
      serialized = JSON.stringify(value);
      serialized ??= 'null';
    } catch {
      this.log('error', 'localStorage write failed');
      this.memoryFallback.set(key, '{}');

      return true;
    }

    try {
      if (this.available) {
        const estimatedSize = serialized.length + key.length;

        if (estimatedSize > 1024 * 1024) {
          this.log('warning', 'Data too large for localStorage, using memory fallback');
          this.memoryFallback.set(key, serialized);

          return true;
        }

        window.localStorage.setItem(key, serialized);
        return true;
      }

      this.memoryFallback.set(key, serialized);
      return true;
    } catch {
      this.log('error', 'localStorage write failed');

      if (this.available) {
        this.cleanup();

        try {
          window.localStorage.setItem(key, serialized);
        } catch {
          this.memoryFallback.set(key, serialized);
        }
      } else {
        this.memoryFallback.set(key, serialized);
      }

      return true;
    }
  }

  get(key: string): unknown {
    try {
      let serialized: string | undefined = undefined;

      if (this.available) {
        serialized = window.localStorage.getItem(key) ?? undefined;
      }

      if (!serialized) {
        serialized = this.memoryFallback.get(key) ?? undefined;
      }

      return serialized ? JSON.parse(serialized) : undefined;
    } catch {
      this.log('error', 'localStorage read failed');

      return undefined;
    }
  }

  remove(key: string): boolean {
    try {
      if (this.available) {
        window.localStorage.removeItem(key);
      }
      this.memoryFallback.delete(key);
      return true;
    } catch {
      this.log('error', 'localStorage remove failed');

      return false;
    }
  }

  isAvailable(): boolean {
    return this.available;
  }

  clear(): void {
    try {
      if (this.available) {
        const keys = Object.keys(window.localStorage);

        for (const key of keys) {
          if (key.startsWith('tracelog_') || key.includes('_critical_events') || key.includes('_heartbeat')) {
            window.localStorage.removeItem(key);
          }
        }
      }

      this.memoryFallback.clear();
    } catch {
      this.log('error', 'localStorage clear failed');
    }
  }

  getSize(): number {
    try {
      if (this.available) {
        let size = 0;

        for (const key in window.localStorage) {
          if (key.startsWith('tracelog_') || key.includes('_critical_events') || key.includes('_heartbeat')) {
            size += window.localStorage.getItem(key)?.length || 0;
          }
        }

        return size;
      }

      let size = 0;

      for (const value of this.memoryFallback.values()) {
        size += value.length;
      }

      return size;
    } catch {
      return 0;
    }
  }

  private cleanup(): void {
    try {
      if (!this.available) return;

      const cutoffTime = Date.now() - 24 * 60 * 60 * 1000;
      const keys = Object.keys(window.localStorage);

      for (const key of keys) {
        if (key.includes('_heartbeat') || key.includes('_critical_events')) {
          try {
            const data = JSON.parse(window.localStorage.getItem(key) || '{}');

            if (data.timestamp && data.timestamp < cutoffTime) {
              window.localStorage.removeItem(key);
            }
          } catch {
            window.localStorage.removeItem(key);
          }
        }
      }
    } catch {
      this.log('error', 'localStorage cleanup failed');
    }
  }
}
