import { ClickHandler } from '../handlers/click.handler';
import { ErrorHandler } from '../handlers/error.handler';
import { PageViewHandler } from '../handlers/page-view.handler';
import { PerformanceHandler } from '../handlers/performance.handler';
import { ScrollHandler } from '../handlers/scroll.handler';
import { SessionHandler } from '../handlers/session.handler';
import { GoogleAnalyticsIntegration } from '../integrations/google-analytics.integration';
import { EventManager } from '../managers/event.manager';
import { StorageManager as TraceLogStorageManager } from '../managers/storage.manager';
import { Config } from './config.types';
import { State } from './state.types';

/**
 * Testing bridge interface for E2E tests
 * Only available when NODE_ENV=development
 */
export interface TraceLogTestBridge {
  // Core App methods
  readonly initialized: boolean;
  init(config?: Config): Promise<void>;
  destroy(): void;

  // Core testing methods
  isInitializing(): boolean;
  sendCustomEvent(name: string, data?: Record<string, unknown> | Record<string, unknown>[]): void;

  // Event subscription methods
  on(event: string, callback: (data: any) => void): void;
  off(event: string, callback: (data: any) => void): void;

  // Session management
  getSessionData(): Record<string, unknown> | null;
  setSessionTimeout(timeout: number): void;

  // Queue management
  getQueueLength(): number;

  // Test simulation methods
  forceInitLock(enabled?: boolean): void;
  simulatePersistedEvents(events: any[]): void;

  // State access for testing
  get<T extends keyof State>(key: T): State[T];

  // Manager and handler getter methods for testing
  getStorageManager(): TraceLogStorageManager | null;
  getEventManager(): EventManager | undefined;
  getSessionHandler(): SessionHandler | null;
  getPageViewHandler(): PageViewHandler | null;
  getClickHandler(): ClickHandler | null;
  getScrollHandler(): ScrollHandler | null;
  getPerformanceHandler(): PerformanceHandler | null;
  getErrorHandler(): ErrorHandler | null;
  getGoogleAnalytics(): GoogleAnalyticsIntegration | null;
}
