import { TraceLogTestBridge } from '../src/types/test-bridge.types';

declare global {
  interface Window {
    /**
     * Testing bridge for E2E tests
     * Only available when NODE_ENV=dev
     */
    __traceLogBridge?: TraceLogTestBridge;
  }
}
