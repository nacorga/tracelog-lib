import { App } from './app';
import { setConsent as apiSetConsent, destroy as apiDestroy } from './api';
import { PerformanceHandler } from './handlers/performance.handler';
import { ErrorHandler } from './handlers/error.handler';
import { SessionHandler } from './handlers/session.handler';
import { PageViewHandler } from './handlers/page-view.handler';
import { ClickHandler } from './handlers/click.handler';
import { ScrollHandler } from './handlers/scroll.handler';
import { ViewportHandler } from './handlers/viewport.handler';
import { EventManager } from './managers/event.manager';
import { StorageManager } from './managers/storage.manager';
import { ConsentManager } from './managers/consent.manager';
import { State, TraceLogTestBridge, EventData, GoogleConsentCategories } from './types';
import { setQaMode as setQaModeUtil } from './utils/browser/qa-mode.utils';

/**
 * Test bridge for E2E and integration testing (development only)
 *
 * Provides comprehensive test-specific helpers while inheriting core App functionality.
 * Exposes internal managers and handlers for inspection and validation.
 * Auto-injects into window.__traceLogBridge for Playwright tests.
 *
 * **Key Principle**: Library code should NOT adapt to tests. TestBridge adapts tests to library.
 */
export class TestBridge extends App implements TraceLogTestBridge {
  constructor() {
    super();
  }

  override async init(config?: any): Promise<void> {
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
      await super.init(config);
    } catch (error) {
      const { __setAppInstance } = await import('./api');
      __setAppInstance(null);
      throw error;
    }
  }

  override sendCustomEvent(name: string, data?: Record<string, unknown> | Record<string, unknown>[]): void {
    if (!this.initialized) {
      return;
    }

    super.sendCustomEvent(name, data);
  }

  /**
   * Alias for sendCustomEvent (E2E test convenience)
   */
  event(name: string, metadata?: Record<string, unknown> | Record<string, unknown>[]): void {
    this.sendCustomEvent(name, metadata);
  }

  /**
   * QA mode control for debugging tests
   */
  setQaMode(enabled: boolean): void {
    setQaModeUtil(enabled);
  }

  /**
   * Session data inspection for E2E tests
   */
  getSessionData(): Record<string, unknown> | null {
    const sessionId = this.get('sessionId');
    const config = this.get('config');

    return {
      id: sessionId ?? null,
      isActive: sessionId !== null && sessionId !== '',
      timeout: config.sessionTimeout ?? 15 * 60 * 1000,
    };
  }

  /**
   * Queue length inspection for E2E tests
   */
  getQueueLength(): number {
    return this.managers.event?.getQueueLength() ?? 0;
  }

  /**
   * Event manager accessor for E2E tests
   */
  override getEventManager(): EventManager | undefined {
    return this.managers.event;
  }

  /**
   * Performance handler accessor for tests
   */
  getPerformanceHandler(): PerformanceHandler | null {
    return this.handlers.performance ?? null;
  }

  /**
   * Error handler accessor for tests
   */
  getErrorHandler(): ErrorHandler | null {
    return this.handlers.error ?? null;
  }

  /**
   * Session handler accessor for tests
   */
  getSessionHandler(): SessionHandler | null {
    return this.handlers.session ?? null;
  }

  /**
   * PageView handler accessor for tests
   */
  getPageViewHandler(): PageViewHandler | null {
    return this.handlers.pageView ?? null;
  }

  /**
   * Click handler accessor for tests
   */
  getClickHandler(): ClickHandler | null {
    return this.handlers.click ?? null;
  }

  /**
   * Scroll handler accessor for tests
   */
  getScrollHandler(): ScrollHandler | null {
    return this.handlers.scroll ?? null;
  }

  /**
   * Viewport handler accessor for tests
   */
  getViewportHandler(): ViewportHandler | null {
    return this.handlers.viewport ?? null;
  }

  /**
   * Get all handlers at once (convenience method)
   */
  getHandlers(): {
    performance: PerformanceHandler | null;
    error: ErrorHandler | null;
    session: SessionHandler | null;
    pageView: PageViewHandler | null;
    click: ClickHandler | null;
    scroll: ScrollHandler | null;
    viewport: ViewportHandler | null;
  } {
    return {
      performance: this.getPerformanceHandler(),
      error: this.getErrorHandler(),
      session: this.getSessionHandler(),
      pageView: this.getPageViewHandler(),
      click: this.getClickHandler(),
      scroll: this.getScrollHandler(),
      viewport: this.getViewportHandler(),
    };
  }

  /**
   * Storage manager accessor for tests
   */
  getStorageManager(): StorageManager | null {
    return this.managers.storage ?? null;
  }

  /**
   * Consent manager accessor for tests
   */
  override getConsentManager(): ConsentManager | undefined {
    return this.managers.consent;
  }

  /**
   * Consent buffer inspection for tests
   */
  getConsentBufferLength(): number {
    return this.managers.event?.getConsentBufferLength() ?? 0;
  }

  /**
   * Get events from queue (for validation in tests)
   */
  getQueueEvents(): EventData[] {
    return this.managers.event?.getQueueEvents() ?? [];
  }

  /**
   * Get consent buffer events (for validation in tests)
   */
  getConsentBufferEvents(integration: 'google' | 'custom' | 'tracelog'): EventData[] {
    return this.managers.event?.getConsentBufferEvents(integration) ?? [];
  }

  /**
   * Consent management (always delegates to api.ts for consistency)
   */
  async setConsent(
    integration: 'google' | 'custom' | 'tracelog' | 'all',
    granted: boolean,
    googleConsentCategories?: GoogleConsentCategories,
  ): Promise<void> {
    await apiSetConsent(integration, granted, googleConsentCategories);
  }

  /**
   * Consent state check (delegates to ConsentManager)
   */
  hasConsent(integration: 'google' | 'custom' | 'tracelog' | 'all'): boolean {
    const consentManager = this.getConsentManager();
    return consentManager?.hasConsent(integration) ?? false;
  }

  /**
   * Consent state retrieval (delegates to ConsentManager)
   */
  getConsentState(): { google: boolean; custom: boolean; tracelog: boolean } {
    const consentManager = this.getConsentManager();
    return consentManager?.getConsentState() ?? { google: false, custom: false, tracelog: false };
  }

  /**
   * State accessor (make public for tests)
   */
  public override get<T extends keyof State>(key: T): State[T] {
    return super.get(key);
  }

  /**
   * Full state snapshot (for test inspection)
   */
  public getFullState(): Readonly<State> {
    return this.getState();
  }

  /**
   * Update global metadata (delegates to App method)
   */
  override updateGlobalMetadata(metadata: Record<string, unknown>): void {
    super.updateGlobalMetadata(metadata);
  }

  /**
   * Merge global metadata (delegates to App method)
   */
  override mergeGlobalMetadata(metadata: Record<string, unknown>): void {
    super.mergeGlobalMetadata(metadata);
  }

  /**
   * Get state object (public override for test access)
   *
   * Exposes protected StateManager.getState() as public for integration tests.
   * Equivalent to getFullState() but maintains consistency with test patterns
   * that use bridge.getState().config pattern.
   */
  override getState(): Readonly<State> {
    return super.getState();
  }

  /**
   * Wait for initialization to complete (test utility)
   */
  async waitForInitialization(timeout = 5000): Promise<void> {
    const startTime = Date.now();
    while (!this.initialized && Date.now() - startTime < timeout) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (!this.initialized) {
      throw new Error('[TraceLog] Initialization timeout');
    }
  }

  /**
   * Trigger manual queue flush (test utility)
   */
  async flushQueue(): Promise<void> {
    await this.managers.event?.flushQueue();
  }

  /**
   * Clear event queue (test utility - use with caution)
   */
  clearQueue(): void {
    this.managers.event?.clearQueue();
  }

  /**
   * Cleanup (syncs with api.ts)
   */
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
