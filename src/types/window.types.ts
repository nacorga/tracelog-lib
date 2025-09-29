import { TraceLogTestBridge } from './test-bridge.types';

declare global {
  interface Window {
    /**
     * Flag to disable TraceLog initialization
     * Set to true to prevent the library from running
     */
    __traceLogDisabled?: boolean;
    /**
     * Testing bridge for E2E tests
     * Only available when NODE_ENV=dev
     */
    __traceLogBridge?: TraceLogTestBridge;
  }
}
