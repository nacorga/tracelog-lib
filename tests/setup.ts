import { beforeEach, vi, afterEach } from 'vitest';

// Setup DOM mocks for jsdom environment
beforeEach(() => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};

    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
      get length() {
        return Object.keys(store).length;
      },
      key: (index: number) => {
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

  // Mock URL constructor
  if (!global.URL) {
    global.URL = class MockURL {
      href: string;
      protocol: string;
      host: string;
      hostname: string;
      pathname: string;
      search: string;
      hash: string;

      constructor(url: string) {
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
      }
    } as any;
  }

  // Mock URLSearchParams
  if (!global.URLSearchParams) {
    global.URLSearchParams = class MockURLSearchParams {
      private readonly params: Map<string, string> = new Map();

      constructor(search?: string) {
        if (search) {
          const cleanSearch = search.startsWith('?') ? search.slice(1) : search;
          cleanSearch.split('&').forEach((param) => {
            const [key, value] = param.split('=');
            if (key) {
              this.params.set(decodeURIComponent(key), decodeURIComponent(value || ''));
            }
          });
        }
      }

      get(key: string): string | null {
        return this.params.get(key) || null;
      }

      set(key: string, value: string): void {
        this.params.set(key, value);
      }

      has(key: string): boolean {
        return this.params.has(key);
      }

      entries(): IterableIterator<[string, string]> {
        return this.params.entries();
      }
    } as any;
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
