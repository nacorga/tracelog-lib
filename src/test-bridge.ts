import { App } from './app';
import { ClickHandler } from './handlers/click.handler';
import { ErrorHandler } from './handlers/error.handler';
import { PageViewHandler } from './handlers/page-view.handler';
import { PerformanceHandler } from './handlers/performance.handler';
import { ScrollHandler } from './handlers/scroll.handler';
import { SessionHandler } from './handlers/session.handler';
import { GoogleAnalyticsIntegration } from './integrations/google-analytics.integration';
import { EventManager } from './managers/event.manager';
import { StorageManager } from './managers/storage.manager';
import { State, TraceLogTestBridge } from './types';
import { STORAGE_BASE_KEY } from './constants';

/**
 * Test bridge for E2E testing (development only)
 *
 * Auto-injects into window.__traceLogBridge for Playwright tests
 */
export class TestBridge extends App implements TraceLogTestBridge {
  private _isDestroying = false;

  constructor() {
    super();
  }

  override async init(config?: any): Promise<void> {
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('[TraceLog] TestBridge is only available in development mode');
    }

    // Sync with public API before initializing
    try {
      const { __setAppInstance } = await import('./api');
      __setAppInstance(this);
    } catch {
      throw new Error('[TraceLog] TestBridge cannot sync with existing tracelog instance. Call destroy() first.');
    }

    try {
      await super.init(config);
    } catch (error) {
      // Clear sync on init failure
      const { __setAppInstance } = await import('./api');
      __setAppInstance(null);
      throw error;
    }
  }

  override sendCustomEvent(name: string, data?: Record<string, unknown> | Record<string, unknown>[]): void {
    // Silently ignore events after destroy instead of throwing error
    if (!this.initialized) {
      return;
    }
    super.sendCustomEvent(name, data);
  }

  getSessionData(): Record<string, unknown> | null {
    return {
      id: this.get('sessionId') as string,
      isActive: !!this.get('sessionId'),
      timeout: this.get('config')?.sessionTimeout ?? 15 * 60 * 1000,
    };
  }

  setSessionTimeout(timeout: number): void {
    const config = this.get('config');
    if (config) {
      this.set('config', { ...config, sessionTimeout: timeout });
    }
  }

  getQueueLength(): number {
    return this.managers.event?.getQueueLength() ?? 0;
  }

  simulatePersistedEvents(events: any[]): void {
    const storageManager = this.managers?.storage;
    if (!storageManager) {
      throw new Error('Storage manager not available');
    }

    const config = this.get('config');
    const projectId =
      config?.integrations?.tracelog?.projectId ?? config?.integrations?.custom?.collectApiUrl ?? 'test';
    const userId = this.get('userId');
    const sessionId = this.get('sessionId');

    if (!projectId || !userId) {
      throw new Error('Project ID or User ID not available. Initialize TraceLog first.');
    }

    // Build the persisted data structure matching what SenderManager expects
    const persistedData = {
      userId,
      sessionId: sessionId || `test-session-${Date.now()}`,
      device: 'desktop',
      events,
      timestamp: Date.now(),
    };

    // Store in the same format as SenderManager.persistEvents()
    const storageKey = `${STORAGE_BASE_KEY}:${projectId}:queue:${userId}`;
    storageManager.setItem(storageKey, JSON.stringify(persistedData));
  }

  override get<T extends keyof State>(key: T): State[T] {
    return super.get(key);
  }

  // Manager accessors
  getStorageManager(): StorageManager | null {
    return this.safeAccess(this.managers?.storage);
  }

  override getEventManager(): EventManager | undefined {
    return this.managers.event;
  }

  // Handler accessors
  getSessionHandler(): SessionHandler | null {
    return this.safeAccess(this.handlers?.session);
  }

  getPageViewHandler(): PageViewHandler | null {
    return this.safeAccess(this.handlers?.pageView);
  }

  getClickHandler(): ClickHandler | null {
    return this.safeAccess(this.handlers?.click);
  }

  getScrollHandler(): ScrollHandler | null {
    return this.safeAccess(this.handlers?.scroll);
  }

  getPerformanceHandler(): PerformanceHandler | null {
    return this.safeAccess(this.handlers?.performance);
  }

  getErrorHandler(): ErrorHandler | null {
    return this.safeAccess(this.handlers?.error);
  }

  // Integration accessors
  getGoogleAnalytics(): GoogleAnalyticsIntegration | null {
    return this.safeAccess(this.integrations?.google);
  }

  // Consent methods for E2E testing
  async setConsent(integration: 'google' | 'custom' | 'tracelog' | 'all', granted: boolean): Promise<void> {
    // If not initialized, delegate to public API which handles pre-init consent
    if (!this.initialized) {
      const { setConsent } = await import('./api');
      await setConsent(integration, granted);
      return;
    }

    const consentManager = this.managers?.consent;
    if (!consentManager) {
      throw new Error('Consent manager not available');
    }

    const config = this.get('config');

    // Handle 'all' integration
    if (integration === 'all') {
      const integrations: ('google' | 'custom' | 'tracelog')[] = [];

      if (config?.integrations?.google) {
        integrations.push('google');
      }

      const collectApiUrls = this.get('collectApiUrls');
      if (collectApiUrls?.custom) {
        integrations.push('custom');
      }

      if (collectApiUrls?.saas) {
        integrations.push('tracelog');
      }

      // Apply to all configured integrations
      for (const int of integrations) {
        await this.setConsent(int, granted);
      }

      return;
    }

    // Get previous consent state
    const hadConsent = consentManager.hasConsent(integration);

    // Update consent state
    consentManager.setConsent(integration, granted);

    // Handle consent granted - delegate to parent class method
    if (granted && !hadConsent) {
      await this.handleConsentGranted(integration);
    }
  }

  hasConsent(integration: 'google' | 'custom' | 'tracelog' | 'all'): boolean {
    const consentManager = this.managers?.consent;
    if (!consentManager) {
      return false;
    }

    return consentManager.hasConsent(integration);
  }

  getConsentState(): { google: boolean; custom: boolean; tracelog: boolean } {
    const consentManager = this.managers?.consent;
    if (!consentManager) {
      return { google: false, custom: false, tracelog: false };
    }

    return consentManager.getConsentState();
  }

  getConsentBufferLength(): number {
    return this.managers.event?.getConsentBufferLength() ?? 0;
  }

  override destroy(force = false): void {
    if (!this.initialized && !force) {
      return;
    }

    this.ensureNotDestroying();
    this._isDestroying = true;

    try {
      super.destroy(force);
      // Clear public API reference
      void import('./api').then(({ __setAppInstance }) => {
        __setAppInstance(null);
      });
    } finally {
      this._isDestroying = false;
    }
  }

  /**
   * Helper to safely access managers/handlers and convert undefined to null
   */
  private safeAccess<T>(value: T | undefined): T | null {
    return value ?? null;
  }

  /**
   * Ensures destroy operation is not in progress, throws if it is
   */
  private ensureNotDestroying(): void {
    if (this._isDestroying) {
      throw new Error('Destroy operation already in progress');
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
