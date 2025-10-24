import { PerformanceHandler } from '../handlers/performance.handler';
import { ErrorHandler } from '../handlers/error.handler';
import { SessionHandler } from '../handlers/session.handler';
import { PageViewHandler } from '../handlers/page-view.handler';
import { ClickHandler } from '../handlers/click.handler';
import { ScrollHandler } from '../handlers/scroll.handler';
import { ViewportHandler } from '../handlers/viewport.handler';
import { EventManager } from '../managers/event.manager';
import { StorageManager } from '../managers/storage.manager';
import { ConsentManager } from '../managers/consent.manager';
import { Config } from './config.types';
import { State } from './state.types';
import { EventData } from './event.types';
import { BeforeSendTransformer, BeforeBatchTransformer, TransformerHook } from './transformer.types';

/**
 * Testing bridge interface for E2E and integration tests
 * Only available when NODE_ENV=development
 *
 * Provides comprehensive test-specific helpers while inheriting core App functionality.
 * Exposes internal managers and handlers for inspection and validation.
 *
 * **Key Principle**: Library code should NOT adapt to tests. TestBridge adapts tests to library.
 */
export interface TraceLogTestBridge {
  // Core App methods
  readonly initialized: boolean;
  init(config?: Config): Promise<void>;
  destroy(force?: boolean): void;

  // Core event methods (inherited from App)
  sendCustomEvent(name: string, data?: Record<string, unknown> | Record<string, unknown>[]): void;

  // Convenience alias for sendCustomEvent (used in tests)
  event(name: string, metadata?: Record<string, unknown> | Record<string, unknown>[]): void;

  // Event subscription methods (inherited from App)
  on(event: string, callback: (data: any) => void): void;
  off(event: string, callback: (data: any) => void): void;

  // State access for testing
  get<T extends keyof State>(key: T): State[T];
  getFullState(): Readonly<State>;

  // Test inspection methods
  getSessionData(): Record<string, unknown> | null;
  getQueueLength(): number;
  getConsentBufferLength(): number;
  getQueueEvents(): EventData[];
  getConsentBufferEvents(integration: 'google' | 'custom' | 'tracelog'): EventData[];

  // Consent management (for testing)
  setConsent(integration: 'google' | 'custom' | 'tracelog' | 'all', granted: boolean): Promise<void>;
  hasConsent(integration: 'google' | 'custom' | 'tracelog' | 'all'): boolean;
  getConsentState(): { google: boolean; custom: boolean; tracelog: boolean };

  // QA mode for testing
  setQaMode(enabled: boolean): void;

  // Transformer methods (for testing event transformation)
  setTransformer(hook: 'beforeSend', fn: BeforeSendTransformer): void;
  setTransformer(hook: 'beforeBatch', fn: BeforeBatchTransformer): void;
  setTransformer(hook: TransformerHook, fn: BeforeSendTransformer | BeforeBatchTransformer): void;
  removeTransformer(hook: TransformerHook): void;

  // Manager accessors (for unit/integration tests)
  getEventManager(): EventManager | undefined;
  getStorageManager(): StorageManager | null;
  getConsentManager(): ConsentManager | undefined;

  // Handler accessors (for unit/integration tests)
  getPerformanceHandler(): PerformanceHandler | null;
  getErrorHandler(): ErrorHandler | null;
  getSessionHandler(): SessionHandler | null;
  getPageViewHandler(): PageViewHandler | null;
  getClickHandler(): ClickHandler | null;
  getScrollHandler(): ScrollHandler | null;
  getViewportHandler(): ViewportHandler | null;

  // Convenience method to get all handlers at once
  getHandlers(): {
    performance: PerformanceHandler | null;
    error: ErrorHandler | null;
    session: SessionHandler | null;
    pageView: PageViewHandler | null;
    click: ClickHandler | null;
    scroll: ScrollHandler | null;
    viewport: ViewportHandler | null;
  };

  // Test utilities
  waitForInitialization(timeout?: number): Promise<void>;
  flushQueue(): Promise<void>;
  clearQueue(): void;
}
