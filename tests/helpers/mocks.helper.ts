/**
 * Mocks Helper
 *
 * Centralized mock creation for all external dependencies
 */

import { vi } from 'vitest';
import type { Mock } from 'vitest';

/**
 * Create mock fetch with configurable responses
 */
export function createMockFetch(
  options: {
    ok?: boolean;
    status?: number;
    json?: any;
    delay?: number;
  } = {},
): Mock {
  const { ok = true, status = 200, json = { success: true }, delay = 0 } = options;

  return vi.fn().mockImplementation(async () => {
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    return {
      ok,
      status,
      statusText: ok ? 'OK' : 'Error',
      json: async () => json,
      text: async () => JSON.stringify(json),
      headers: new Headers(),
      redirected: false,
      type: 'basic' as ResponseType,
      url: 'http://localhost:8080/collect',
      clone: () => ({}),
      body: null,
      bodyUsed: false,
      arrayBuffer: async () => new ArrayBuffer(0),
      blob: async () => new Blob(),
      formData: async () => new FormData(),
    };
  });
}

/**
 * Create mock fetch that fails with network error
 */
export function createMockFetchNetworkError(): Mock {
  return vi.fn().mockRejectedValue(new Error('Network request failed'));
}

/**
 * Create mock fetch that times out
 */
export function createMockFetchTimeout(timeout = 5000): Mock {
  return vi.fn().mockImplementation(async () => {
    await new Promise((_, reject) =>
      setTimeout(() => {
        reject(new Error('Timeout'));
      }, timeout),
    );
  });
}

/**
 * Create mock localStorage
 */
export function createMockStorage(): Storage {
  const storage = new Map<string, string>();

  return {
    length: storage.size,
    clear: vi.fn(() => {
      storage.clear();
    }),
    getItem: vi.fn((key: string) => storage.get(key) || null),
    setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
    removeItem: vi.fn((key: string) => storage.delete(key)),
    key: vi.fn((index: number) => Array.from(storage.keys())[index] || null),
  };
}

/**
 * Create mock BroadcastChannel
 */
export function createMockBroadcastChannel(name = 'test-channel'): any {
  return {
    name,
    postMessage: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onmessage: null,
    onmessageerror: null,
  };
}

/**
 * Setup mock BroadcastChannel constructor
 */
export function setupMockBroadcastChannel(): void {
  const channels = new Map<string, any>();

  (global as any).BroadcastChannel = vi.fn().mockImplementation((name: string) => {
    if (!channels.has(name)) {
      channels.set(name, createMockBroadcastChannel(name));
    }
    return channels.get(name);
  });
}

/**
 * Create mock sendBeacon
 */
export function createMockSendBeacon(returnValue = true): Mock {
  return vi.fn().mockReturnValue(returnValue);
}

/**
 * Setup mock navigator.sendBeacon
 */
export function setupMockSendBeacon(returnValue = true): void {
  (navigator as any).sendBeacon = createMockSendBeacon(returnValue);
}

/**
 * Create mock web-vitals functions
 */
export function createMockWebVitals(): {
  onCLS: Mock;
  onFID: Mock;
  onFCP: Mock;
  onINP: Mock;
  onLCP: Mock;
  onTTFB: Mock;
} {
  return {
    onCLS: vi.fn(),
    onFID: vi.fn(),
    onFCP: vi.fn(),
    onINP: vi.fn(),
    onLCP: vi.fn(),
    onTTFB: vi.fn(),
  };
}

/**
 * Create mock EventEmitter
 */
export function createMockEventEmitter(): any {
  const listeners = new Map<string, Function[]>();

  return {
    on: vi.fn((event: string, callback: Function) => {
      if (!listeners.has(event)) {
        listeners.set(event, []);
      }
      listeners.get(event)!.push(callback);
    }),
    off: vi.fn((event: string, callback: Function) => {
      if (listeners.has(event)) {
        const callbacks = listeners.get(event)!;
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    }),
    emit: vi.fn((event: string, ...args: any[]) => {
      if (listeners.has(event)) {
        listeners.get(event)!.forEach((callback) => callback(...args));
      }
    }),
    removeAllListeners: vi.fn(() => {
      listeners.clear();
    }),
    listeners,
  };
}

/**
 * Create mock console methods that don't output
 */
export function createMockConsole(): {
  log: Mock;
  warn: Mock;
  error: Mock;
  info: Mock;
  debug: Mock;
} {
  return {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  };
}

/**
 * Setup mock console (silent console)
 */
export function setupMockConsole(): void {
  const mockConsole = createMockConsole();
  global.console.log = mockConsole.log;
  global.console.warn = mockConsole.warn;
  global.console.error = mockConsole.error;
  global.console.info = mockConsole.info;
  global.console.debug = mockConsole.debug;
}

/**
 * Create mock window.matchMedia
 */
export function createMockMatchMedia(matches = false): any {
  return vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

/**
 * Setup mock window.matchMedia
 */
export function setupMockMatchMedia(matches = false): void {
  window.matchMedia = createMockMatchMedia(matches);
}

/**
 * Create mock requestIdleCallback
 */
export function createMockRequestIdleCallback(): Mock {
  return vi.fn((callback: IdleRequestCallback) => {
    const deadline = {
      didTimeout: false,
      timeRemaining: () => 50,
    };
    callback(deadline);
    return 1;
  });
}

/**
 * Setup mock requestIdleCallback
 */
export function setupMockRequestIdleCallback(): void {
  (window as any).requestIdleCallback = createMockRequestIdleCallback();
  (window as any).cancelIdleCallback = vi.fn();
}

/**
 * Create mock requestAnimationFrame
 */
export function createMockRequestAnimationFrame(): Mock {
  return vi.fn((callback: FrameRequestCallback) => {
    callback(performance.now());
    return 1;
  });
}

/**
 * Setup mock requestAnimationFrame
 */
export function setupMockRequestAnimationFrame(): void {
  window.requestAnimationFrame = createMockRequestAnimationFrame();
  window.cancelAnimationFrame = vi.fn();
}

/**
 * Setup all common mocks for comprehensive testing
 */
export function setupAllMocks(): void {
  setupMockConsole();
  setupMockBroadcastChannel();
  setupMockSendBeacon();
  setupMockMatchMedia();
  setupMockRequestIdleCallback();
  setupMockRequestAnimationFrame();
}

/**
 * SpecialApiUrl Helpers for Network Simulation
 *
 * TraceLog includes built-in network simulation URLs for testing:
 * - SpecialApiUrl.Localhost ('localhost:8080') - Simulates success without real network
 * - SpecialApiUrl.Fail ('localhost:9999') - Simulates network failure
 *
 * These URLs trigger special behavior in SenderManager:
 * - Localhost: Logs success message, returns true, no actual HTTP request
 * - Fail: Logs warning, returns false, triggers retry/persistence logic
 *
 * @see src/types/config.types.ts (lines 118-121)
 * @see src/managers/sender.manager.ts (lines 184, 559)
 */

/**
 * Create config for testing network success (no real server needed)
 *
 * @example
 * const config = createConfigWithSuccessSimulation();
 * await tracelog.init(config);
 * // Events will "succeed" without actual HTTP requests
 */
export function createConfigWithSuccessSimulation(): {
  integrations: {
    custom: {
      collectApiUrl: string;
      allowHttp: boolean;
    };
  };
} {
  return {
    integrations: {
      custom: {
        collectApiUrl: 'http://localhost:8080', // SpecialApiUrl.Localhost with protocol
        allowHttp: true, // Required for localhost URLs
      },
    },
  };
}

/**
 * Create config for testing network failure (triggers retry/persistence)
 *
 * @example
 * const config = createConfigWithFailureSimulation();
 * await tracelog.init(config);
 * // Events will fail, trigger retries, then persist to localStorage
 */
export function createConfigWithFailureSimulation(): {
  integrations: {
    custom: {
      collectApiUrl: string;
      allowHttp: boolean;
    };
  };
} {
  return {
    integrations: {
      custom: {
        collectApiUrl: 'http://localhost:9999', // SpecialApiUrl.Fail with protocol
        allowHttp: true, // Required for localhost URLs
      },
    },
  };
}

/**
 * Get SpecialApiUrl enum values for test assertions
 *
 * @example
 * const specialUrls = getSpecialApiUrls();
 * expect(config.integrations.custom.collectApiUrl).toBe(specialUrls.Localhost);
 */
export function getSpecialApiUrls(): {
  Localhost: string;
  Fail: string;
} {
  return {
    Localhost: 'localhost:8080',
    Fail: 'localhost:9999',
  };
}
