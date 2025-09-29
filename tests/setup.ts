import { beforeEach, vi, afterEach } from 'vitest';

// Prevent webidl-conversions errors by ensuring globals are available
if (typeof global !== 'undefined') {
  // Ensure critical Node.js globals are available for CI
  if (typeof global.process === 'undefined') {
    global.process = process;
  }

  // Mock globals that webidl-conversions might try to access
  if (typeof (global as any).get === 'undefined') {
    (global as any).get = function () {
      return undefined;
    };
  }

  // Ensure standard globals are available
  global.TextEncoder = global.TextEncoder || TextEncoder;
  global.TextDecoder = global.TextDecoder || TextDecoder;

  // Mock DOMException for CI environments
  if (typeof global.DOMException === 'undefined') {
    global.DOMException = class MockDOMException extends Error {
      constructor(message?: string, name?: string) {
        super(message);
        this.name = name ?? 'DOMException';
      }
    } as any;
  }
}

beforeEach(() => {
  // Mock navigator.sendBeacon if not available
  if (typeof window !== 'undefined' && window.navigator && !window.navigator.sendBeacon) {
    window.navigator.sendBeacon = vi.fn(() => true);
  }

  // Mock BroadcastChannel if not available
  if (typeof window !== 'undefined' && !window.BroadcastChannel) {
    window.BroadcastChannel = class MockBroadcastChannel {
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
    } as any;
  }

  // Clear all mocks
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
