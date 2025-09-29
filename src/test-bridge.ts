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
import { normalizeConfig } from './utils';

/**
 * Test bridge for E2E testing
 */
export class TestBridge extends App implements TraceLogTestBridge {
  private _isInitializing: boolean;
  private _isDestroying = false;

  constructor(isInitializing: boolean, isDestroying: boolean) {
    super();
    this._isInitializing = isInitializing;
    this._isDestroying = isDestroying;
  }

  isInitializing(): boolean {
    return this._isInitializing;
  }

  sendCustomEvent(name: string, data?: Record<string, unknown>): void {
    this.ensureInitialized();
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
      const { config: normalizedConfig } = normalizeConfig({ ...config, sessionTimeout: timeout });
      this.set('config', normalizedConfig);
    }
  }

  getQueueLength(): number {
    return this.managers.event?.getQueueLength() ?? 0;
  }

  forceInitLock(enabled = true): void {
    this._isInitializing = enabled;
  }

  get<T extends keyof State>(key: T): State[T] {
    return super.get(key);
  }

  // Manager accessors
  getStorageManager(): StorageManager | null {
    return this.safeAccess(this.managers?.storage);
  }

  getEventManager(): EventManager | null {
    return this.safeAccess(this.managers?.event);
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
    return this.safeAccess(this.integrations?.googleAnalytics);
  }

  async destroy(): Promise<void> {
    this.ensureInitialized();
    this.ensureNotDestroying();

    this._isDestroying = true;

    try {
      await super.destroy();
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
   * Ensures the app is initialized, throws if not
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('App not initialized');
    }
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
