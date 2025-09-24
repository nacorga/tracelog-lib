import type { App } from '../app';

/**
 * Testing bridge interface for E2E tests
 * Only available when NODE_ENV=dev
 */
export interface TraceLogTestBridge extends App {
  isInitializing(): boolean;
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
