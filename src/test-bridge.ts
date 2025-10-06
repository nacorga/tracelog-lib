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
import { __setAppInstance } from './api';

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

  async init(config: any): Promise<void> {
    // Guard: TestBridge should only be used in development
    if (process.env.NODE_ENV !== 'dev') {
      throw new Error('[TraceLog] TestBridge is only available in development mode');
    }

    // First sync with window.tracelog BEFORE initializing
    // This ensures both APIs point to the same instance from the start
    if (!__setAppInstance) {
      throw new Error('[TraceLog] __setAppInstance is not available (production build?)');
    }

    try {
      __setAppInstance(this);
    } catch {
      // If __setAppInstance fails (e.g., already initialized), throw clear error
      throw new Error('[TraceLog] TestBridge cannot sync with existing tracelog instance. Call destroy() first.');
    }

    try {
      await super.init(config);
    } catch (error) {
      // If init fails, clear the sync
      if (__setAppInstance) {
        __setAppInstance(null);
      }
      throw error;
    }
  }

  isInitializing(): boolean {
    return this._isInitializing;
  }

  sendCustomEvent(name: string, data?: Record<string, unknown> | Record<string, unknown>[]): void {
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

  forceInitLock(enabled = true): void {
    this._isInitializing = enabled;
  }

  simulatePersistedEvents(events: any[]): void {
    const storageManager = this.managers?.storage;
    if (!storageManager) {
      throw new Error('Storage manager not available');
    }

    const config = this.get('config');
    const projectId = config?.integrations?.tracelog?.projectId ?? config?.integrations?.custom?.apiUrl ?? 'test';
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
    const storageKey = `tl:${projectId}:queue:${userId}`;
    storageManager.setItem(storageKey, JSON.stringify(persistedData));
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

  async destroy(force = false): Promise<void> {
    // If not initialized and not forcing, silently return (no-op)
    if (!this.initialized && !force) {
      return;
    }

    this.ensureNotDestroying();

    this._isDestroying = true;

    try {
      await super.destroy(force);
      // Clear window.tracelog API reference (only in dev mode)
      if (__setAppInstance) {
        __setAppInstance(null);
      }
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
