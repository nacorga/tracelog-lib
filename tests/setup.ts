import { beforeEach, vi, afterEach } from 'vitest';

// Minimal setup for jsdom environment

beforeEach(() => {
  // Mock navigator.sendBeacon if not available
  if (!window.navigator.sendBeacon) {
    window.navigator.sendBeacon = vi.fn(() => true);
  }

  // Mock BroadcastChannel if not available
  if (!window.BroadcastChannel) {
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
