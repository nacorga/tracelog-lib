import { beforeEach, vi } from 'vitest';

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

      postMessage(message: unknown) {
        // Mock implementation
      }

      close() {
        // Mock implementation
      }
    }

    Object.defineProperty(window, 'BroadcastChannel', {
      value: BroadcastChannelMock,
      writable: true,
    });
  }

  // Clear all mocks between tests
  vi.clearAllMocks();
});