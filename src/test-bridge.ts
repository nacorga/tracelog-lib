import { App } from './app';
import { destroy as apiDestroy } from './api';
import { PerformanceHandler } from './handlers/performance.handler';
import { ErrorHandler } from './handlers/error.handler';
import { SessionHandler } from './handlers/session.handler';
import { PageViewHandler } from './handlers/page-view.handler';
import { ClickHandler } from './handlers/click.handler';
import { ScrollHandler } from './handlers/scroll.handler';
import { EventManager } from './managers/event.manager';
import { StorageManager } from './managers/storage.manager';
import { State, TraceLogTestBridge, EventData, EventOptions, InitResult } from './types';

/**
 * Test bridge for E2E and integration testing (development only)
 *
 * Provides comprehensive test-specific helpers while inheriting core App functionality.
 * Exposes internal managers and handlers for inspection and validation.
 * Auto-injects into window.__traceLogBridge for Playwright tests.
 */
export class TestBridge extends App implements TraceLogTestBridge {
  constructor() {
    super();
  }

  override async init(config?: any): Promise<InitResult> {
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('[TraceLog] TestBridge is only available in development mode');
    }

    try {
      const { __setAppInstance } = await import('./api');
      __setAppInstance(this);
    } catch {
      throw new Error('[TraceLog] TestBridge cannot sync with existing tracelog instance. Call destroy() first.');
    }

    try {
      return await super.init(config);
    } catch (error) {
      const { __setAppInstance } = await import('./api');
      __setAppInstance(null);
      throw error;
    }
  }

  override sendCustomEvent(
    name: string,
    data?: Record<string, unknown> | Record<string, unknown>[],
    options?: EventOptions,
  ): void {
    if (!this.initialized) {
      return;
    }

    super.sendCustomEvent(name, data, options);
  }

  event(name: string, metadata?: Record<string, unknown> | Record<string, unknown>[], options?: EventOptions): void {
    this.sendCustomEvent(name, metadata, options);
  }

  getSessionData(): Record<string, unknown> | null {
    const sessionId = this.get('sessionId');
    const config = this.get('config');

    return {
      id: sessionId ?? null,
      isActive: sessionId !== null && sessionId !== '',
      timeout: config.sessionTimeout ?? 15 * 60 * 1000,
    };
  }

  getQueueLength(): number {
    return this.managers.event?.getQueueLength() ?? 0;
  }

  override getEventManager(): EventManager | undefined {
    return this.managers.event;
  }

  getPerformanceHandler(): PerformanceHandler | null {
    return this.handlers.performance ?? null;
  }

  getErrorHandler(): ErrorHandler | null {
    return this.handlers.error ?? null;
  }

  getSessionHandler(): SessionHandler | null {
    return this.handlers.session ?? null;
  }

  getPageViewHandler(): PageViewHandler | null {
    return this.handlers.pageView ?? null;
  }

  getClickHandler(): ClickHandler | null {
    return this.handlers.click ?? null;
  }

  getScrollHandler(): ScrollHandler | null {
    return this.handlers.scroll ?? null;
  }

  getHandlers(): {
    performance: PerformanceHandler | null;
    error: ErrorHandler | null;
    session: SessionHandler | null;
    pageView: PageViewHandler | null;
    click: ClickHandler | null;
    scroll: ScrollHandler | null;
  } {
    return {
      performance: this.getPerformanceHandler(),
      error: this.getErrorHandler(),
      session: this.getSessionHandler(),
      pageView: this.getPageViewHandler(),
      click: this.getClickHandler(),
      scroll: this.getScrollHandler(),
    };
  }

  getStorageManager(): StorageManager | null {
    return this.managers.storage ?? null;
  }

  getQueueEvents(): EventData[] {
    return this.managers.event?.getQueueEvents() ?? [];
  }

  public override get<T extends keyof State>(key: T): State[T] {
    return super.get(key);
  }

  public getFullState(): Readonly<State> {
    return this.getState();
  }

  override getState(): Readonly<State> {
    return super.getState();
  }

  async waitForInitialization(timeout = 5000): Promise<void> {
    const startTime = Date.now();
    while (!this.initialized && Date.now() - startTime < timeout) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (!this.initialized) {
      throw new Error('[TraceLog] Initialization timeout');
    }
  }

  async flushQueue(): Promise<void> {
    await this.managers.event?.flushQueue();
  }

  clearQueue(): void {
    this.managers.event?.clearQueue();
  }

  override destroy(force = false): void {
    if (!this.initialized && !force) {
      return;
    }

    apiDestroy();

    try {
      super.destroy(force);
      void import('./api').then(({ __setAppInstance }) => {
        __setAppInstance(null);
      });
    } catch (error) {
      void import('./api').then(({ __setAppInstance }) => {
        __setAppInstance(null);
      });
      throw error;
    }
  }
}

/**
 * Injects TestBridge into window.__traceLogBridge for E2E tests
 * @internal Called by api.ts in development mode
 */
export const injectTestBridge = (): void => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  try {
    window.__traceLogBridge = new TestBridge();
  } catch (error) {
    console.error('[TraceLog] Failed to inject TestBridge', error);
  }
};
