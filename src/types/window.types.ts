/**
 * Testing bridge interface for E2E tests
 * Only available when NODE_ENV=dev
 */
export interface TraceLogTestBridge {
  // Core App methods
  readonly initialized: boolean;
  init(config: import('./config.types').AppConfig): Promise<void>;
  destroy(): Promise<void>;

  // Core testing methods
  isInitializing(): boolean;
  sendCustomEvent(name: string, data?: Record<string, unknown>): void;

  // Session management
  getSessionData(): Record<string, unknown> | null;
  setSessionTimeout(timeout: number): void;
  isTabLeader?(): boolean;

  // Queue management
  getQueueLength(): number;

  // Test simulation methods
  forceInitLock(enabled?: boolean): void;
  forceInitFailure(enabled?: boolean): void;

  // State access for testing
  get<T extends keyof import('./state.types').State>(key: T): import('./state.types').State[T];

  // Manager and handler getter methods for testing
  getStorageManager(): import('../managers/storage.manager').StorageManager | null;
  getEventManager(): import('../managers/event.manager').EventManager | null;
  getSessionHandler(): import('../handlers/session.handler').SessionHandler | null;
  getPageViewHandler(): import('../handlers/page-view.handler').PageViewHandler | null;
  getClickHandler(): import('../handlers/click.handler').ClickHandler | null;
  getScrollHandler(): import('../handlers/scroll.handler').ScrollHandler | null;
  getPerformanceHandler(): import('../handlers/performance.handler').PerformanceHandler | null;
  getErrorHandler(): import('../handlers/error.handler').ErrorHandler | null;
  getGoogleAnalytics(): import('../integrations/google-analytics.integration').GoogleAnalyticsIntegration | null;
}

declare global {
  interface Window {
    /**
     * Testing bridge for E2E tests
     * Only available when NODE_ENV=dev
     */
    __traceLogBridge?: TraceLogTestBridge;

    /**
     * Creates a fresh TraceLog bridge instance for testing
     * Only available when NODE_ENV=dev
     */
    __createFreshTraceLogBridge?: () => void;
  }
}
