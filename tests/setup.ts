import { beforeEach, vi, afterEach } from 'vitest';

// Setup global environment for jsdom compatibility
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock globals that might be accessed by dependencies
if (typeof global.window === 'undefined') {
  Object.defineProperty(global, 'window', {
    value: {},
    writable: true,
  });
}

// Mock globals to prevent webidl-conversions errors
if (typeof global.DOMException === 'undefined') {
  global.DOMException = class MockDOMException extends Error {
    constructor(message?: string, name?: string) {
      super(message);
      this.name = name ?? 'DOMException';
    }
  } as unknown as typeof DOMException;
}

// Ensure Node.js globals are available
if (typeof global.process === 'undefined') {
  global.process = process;
}

// Setup DOM mocks for jsdom environment
beforeEach(() => {
  // Mock localStorage
  const localStorageMock = ((): Storage => {
    let store: Record<string, string> = {};

    return {
      getItem: (key: string): string | null => store[key] || null,
      setItem: (key: string, value: string): void => {
        store[key] = value.toString();
      },
      removeItem: (key: string): void => {
        delete store[key];
      },
      clear: (): void => {
        store = {};
      },
      get length(): number {
        return Object.keys(store).length;
      },
      key: (index: number): string | null => {
        const keys = Object.keys(store);
        return keys[index] || null;
      },
    };
  })();

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });

  // Mock navigator.sendBeacon
  Object.defineProperty(navigator, 'sendBeacon', {
    value: vi.fn(() => true),
    writable: true,
  });

  // Mock performance API
  if (!window.performance) {
    Object.defineProperty(window, 'performance', {
      value: {
        now: () => Date.now(),
        timing: {},
      },
      writable: true,
    });
  }

  // Mock BroadcastChannel
  if (!window.BroadcastChannel) {
    class BroadcastChannelMock {
      name: string;
      onmessage: ((event: MessageEvent) => void) | null = null;

      constructor(name: string) {
        this.name = name;
      }

      postMessage(_message: unknown): void {
        // Mock implementation
      }

      close(): void {
        // Mock implementation
      }
    }

    Object.defineProperty(window, 'BroadcastChannel', {
      value: BroadcastChannelMock,
      writable: true,
    });
  }

  // Mock Web APIs that might be accessed by dependencies
  if (!window.crypto) {
    Object.defineProperty(window, 'crypto', {
      value: {
        getRandomValues: (arr: Uint8Array) => {
          for (let i = 0; i < arr.length; i++) {
            arr[i] = Math.floor(Math.random() * 256);
          }
          return arr;
        },
        randomUUID: () => 'mock-uuid-' + Math.random().toString(36).substr(2, 9),
      },
      writable: true,
    });
  }

  // Mock URL constructor
  if (!global.URL) {
    global.URL = class MockURL implements Partial<URL> {
      href: string;
      protocol: string;
      host: string;
      hostname: string;
      pathname: string;
      search: string;
      hash: string;
      origin: string;
      port: string;
      username: string;
      password: string;
      searchParams: URLSearchParams;

      constructor(url: string, _base?: string | URL) {
        this.href = url;
        const match = url.match(/^(https?:)\/\/([^/#?]+)([^?#]*)(\?[^#]*)?(#.*)?$/);
        if (match) {
          this.protocol = match[1];
          this.host = match[2];
          this.hostname = match[2].split(':')[0];
          this.pathname = match[3] || '/';
          this.search = match[4] || '';
          this.hash = match[5] || '';
        } else {
          this.protocol = 'https:';
          this.host = 'localhost';
          this.hostname = 'localhost';
          this.pathname = '/';
          this.search = '';
          this.hash = '';
        }
        this.origin = `${this.protocol}//${this.host}`;
        this.port = '';
        this.username = '';
        this.password = '';
        this.searchParams = new URLSearchParams(this.search);
      }

      toString(): string {
        return this.href;
      }

      toJSON(): string {
        return this.href;
      }
    } as unknown as typeof URL;
  }

  // Mock URLSearchParams
  if (!global.URLSearchParams) {
    global.URLSearchParams = class MockURLSearchParams implements Partial<URLSearchParams> {
      private readonly params: Map<string, string> = new Map();

      constructor(init?: string | string[][] | Record<string, string> | URLSearchParams) {
        if (typeof init === 'string') {
          const cleanSearch = init.startsWith('?') ? init.slice(1) : init;
          if (cleanSearch) {
            cleanSearch.split('&').forEach((param) => {
              const [key, value] = param.split('=');
              if (key) {
                this.params.set(decodeURIComponent(key), decodeURIComponent(value || ''));
              }
            });
          }
        }
      }

      get(key: string): string | null {
        return this.params.get(key) ?? null;
      }

      set(key: string, value: string): void {
        this.params.set(key, value);
      }

      has(key: string): boolean {
        return this.params.has(key);
      }

      append(key: string, value: string): void {
        this.params.set(key, value);
      }

      delete(key: string): void {
        this.params.delete(key);
      }

      forEach(callback: (value: string, key: string, parent: URLSearchParams) => void): void {
        this.params.forEach((value, key) => callback(value, key, this as unknown as URLSearchParams));
      }

      entries(): any {
        return this.params.entries();
      }

      keys(): any {
        return this.params.keys();
      }

      values(): any {
        return this.params.values();
      }

      toString(): string {
        const pairs: string[] = [];
        this.params.forEach((value, key) => {
          pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
        });
        return pairs.join('&');
      }

      [Symbol.iterator](): any {
        return this.params.entries();
      }

      size = 0;

      getAll(key: string): string[] {
        return this.params.has(key) ? [this.params.get(key)!] : [];
      }

      sort(): void {
        // No-op for this mock
      }
    } as unknown as typeof URLSearchParams;
  }

  // Clear all mocks between tests
  vi.clearAllMocks();
});

// Clean up global state after each test
afterEach(async () => {
  // Reset global state to prevent test interference
  try {
    const { resetGlobalState } = await import('@/managers/state.manager');
    if (typeof resetGlobalState === 'function') {
      resetGlobalState();
    }
  } catch {
    // Silently ignore if the module doesn't exist or can't be imported
    // This can happen during some test scenarios but doesn't affect functionality
  }
});
