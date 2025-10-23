import { beforeEach, vi, afterEach } from 'vitest';
import { injectTestBridge } from '../src/test-bridge';

// Minimal setup for jsdom environment

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

      postMessage(_message: unknown): void {}

      close(): void {}
    } as unknown as typeof BroadcastChannel;
  }

  // Inject TestBridge for unit/integration tests
  if (typeof window !== 'undefined') {
    try {
      injectTestBridge();
    } catch (error) {
      // Silently ignore if TestBridge injection fails
    }
  }

  vi.clearAllMocks();
});

// Clean up global state after each test
afterEach(async () => {
  // Reset global state to prevent test interference
  try {
    const { resetGlobalState } = await import('../src/managers/state.manager');
    if (typeof resetGlobalState === 'function') {
      resetGlobalState();
    }
  } catch {
    // Silently ignore if the module doesn't exist or can't be imported
    // This can happen during some test scenarios but doesn't affect functionality
  }
});
