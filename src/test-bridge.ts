import { App } from './app';
import { setConsent as apiSetConsent, destroy as apiDestroy } from './api';
import { PerformanceHandler } from './handlers/performance.handler';
import { EventManager } from './managers/event.manager';
import { State, TraceLogTestBridge } from './types';
import { setQaMode as setQaModeUtil } from './utils/browser/qa-mode.utils';

/**
 * Test bridge for E2E testing (development only)
 *
 * Provides minimal test-specific helpers while inheriting core App functionality.
 * Most methods delegate to parent App class to avoid code duplication.
 * Auto-injects into window.__traceLogBridge for Playwright tests.
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
   * Performance handler accessor for E2E tests
   */
  getPerformanceHandler(): PerformanceHandler | null {
    return this.handlers.performance ?? null;
  }

  /**
   * Consent buffer inspection for E2E tests
   */
  getConsentBufferLength(): number {
    return this.managers.event?.getConsentBufferLength() ?? 0;
  }

  /**
   * Consent management (always delegates to api.ts for consistency)
   */
  async setConsent(integration: 'google' | 'custom' | 'tracelog' | 'all', granted: boolean): Promise<void> {
    await apiSetConsent(integration, granted);
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
   * State accessor (make public for E2E tests)
   */
  public override get<T extends keyof State>(key: T): State[T] {
    return super.get(key);
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
