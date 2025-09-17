import type { EventManager } from '../managers/event.manager';
import type { App } from '../app';
import { ScrollHandler } from '../handlers/scroll.handler';

/**
 * Testing bridge interface for E2E tests
 * Only available when NODE_ENV=e2e
 */
export interface TraceLogTestBridge {
  /**
   * Get the event manager instance for testing
   * @returns EventManager instance or null if not initialized
   */
  getEventManager(): EventManager | null;

  /**
   * Check if TraceLog is properly initialized
   * @returns true if initialized, false otherwise
   */
  isInitialized(): boolean;

  /**
   * Get the current app instance for advanced testing
   * @returns App instance or null if not initialized
   */
  getAppInstance(): App | null;

  /**
   * Get the scroll handler instance for testing
   * @returns ScrollHandler instance or null if not initialized
   */
  getScrollHandler(): ScrollHandler | null;

  /**
   * Check if initialization is in progress
   * @returns true if initializing, false otherwise
   */
  isInitializing(): boolean;

  /**
   * Environment detection for debugging
   * @returns object with environment flags
   */
  getEnvironmentInfo(): {
    hostname: string;
    hasTestIds: boolean;
    hasPlaywright: boolean;
    userAgent: string;
    nodeEnv: string | undefined;
  };
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
