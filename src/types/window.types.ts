import type { App } from '../app';

/**
 * Testing bridge interface for E2E tests
 * Only available when NODE_ENV=e2e
 */
export interface TraceLogTestBridge extends App {
  isInitializing(): boolean;
}

declare global {
  interface Window {
    /**
     * Testing bridge for E2E tests
     * Only available when NODE_ENV=e2e
     */
    __traceLogTestBridge?: TraceLogTestBridge;
  }
}
