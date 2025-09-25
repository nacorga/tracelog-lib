import type { App } from '../app';

/**
 * Testing bridge interface for E2E tests
 * Only available when NODE_ENV=dev
 */
export interface TraceLogTestBridge extends App {
  // Core testing methods
  isInitializing(): boolean;
  sendCustomEvent(name: string, data?: Record<string, unknown>): void;

  // Session management
  getSessionData(): Record<string, unknown> | null;
  setSessionTimeout(timeout: number): void;
  isTabLeader?(): boolean;

  // Recovery and maintenance methods used in playground
  getRecoveryStats?(): Record<string, unknown>;
  attemptSystemRecovery?(): void;
  aggressiveFingerprintCleanup?(): void;

  // Queue management
  getQueueLength(): number;

  // Test simulation methods
  forceInitLock(enabled?: boolean): void;
  forceInitFailure(enabled?: boolean): void;
}

declare global {
  interface Window {
    /**
     * Testing bridge for E2E tests
     * Only available when NODE_ENV=dev
     */
    __traceLogBridge?: TraceLogTestBridge;
  }
}
