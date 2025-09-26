import { getApiUrlForProject } from './managers/api.manager';
import { ConfigManager } from './managers/config.manager';
import { EventManager } from './managers/event.manager';
import { AppConfig } from './types/config.types';
import { UserManager } from './managers/user.manager';
import { StateManager } from './managers/state.manager';
import { SessionHandler } from './handlers/session.handler';
import { PageViewHandler } from './handlers/page-view.handler';
import { ClickHandler } from './handlers/click.handler';
import { ScrollHandler } from './handlers/scroll.handler';
import { isEventValid } from './utils/validations';
import { EventType } from './types/event.types';
import { GoogleAnalyticsIntegration } from './integrations/google-analytics.integration';
import { getDeviceType, normalizeUrl } from './utils';
import { StorageManager } from './managers/storage.manager';
import { SCROLL_DEBOUNCE_TIME_MS, SCROLL_SUPPRESS_MULTIPLIER } from './constants';
import { PerformanceHandler } from './handlers/performance.handler';
import { ErrorHandler } from './handlers/error.handler';
import { debugLog } from './utils/logging';

/**
 * Main application class for TraceLog analytics
 * Orchestrates event tracking, session management, and integrations
 */
export class App extends StateManager {
  protected isInitialized = false;
  protected googleAnalytics: GoogleAnalyticsIntegration | null = null;
  protected storageManager!: StorageManager;
  protected eventManager!: EventManager;
  protected sessionHandler!: SessionHandler;
  protected pageViewHandler!: PageViewHandler;
  protected clickHandler!: ClickHandler;
  protected scrollHandler!: ScrollHandler;
  protected performanceHandler!: PerformanceHandler;
  protected errorHandler!: ErrorHandler;
  protected suppressNextScrollTimer: number | null = null;

  get initialized(): boolean {
    return this.isInitialized;
  }

  async init(appConfig: AppConfig): Promise<void> {
    if (this.isInitialized) {
      debugLog.debug('App', 'Already initialized', { projectId: appConfig.id });
      return;
    }

    debugLog.info('App', 'Initialization started', { projectId: appConfig.id });

    // Validate critical requirement
    if (!appConfig.id?.trim()) {
      throw new Error('Project ID is required');
    }

    // Setup storage
    this.storageManager = new StorageManager();

    // Setup state with graceful degradation
    try {
      await this.setState(appConfig);
    } catch (error) {
      debugLog.error('App', 'State setup failed', { error });
      throw error;
    }

    // Setup integrations (optional - failures don't block init)
    try {
      await this.setupIntegrations();
    } catch (error) {
      debugLog.warn('App', 'Integration setup failed, continuing without', { error });
      this.googleAnalytics = null;
    }

    // Setup event system
    this.eventManager = new EventManager(this.storageManager, this.googleAnalytics);

    // Initialize handlers
    await this.initHandlers();

    // Recover persisted events
    try {
      await this.eventManager.recoverPersistedEvents();
    } catch (error) {
      debugLog.warn('App', 'Event recovery failed, continuing', { error });
    }

    this.isInitialized = true;
    debugLog.info('App', 'Initialization completed', { projectId: appConfig.id });
  }

  sendCustomEvent(name: string, metadata?: Record<string, unknown>): void {
    if (!this.eventManager) {
      debugLog.warn('App', 'Custom event before initialization', { name });
      return;
    }

    const { valid, error, sanitizedMetadata } = isEventValid(name, metadata);

    if (valid) {
      debugLog.debug('App', 'Custom event tracked', { name, hasMetadata: !!sanitizedMetadata });

      this.eventManager.track({
        type: EventType.CUSTOM,
        custom_event: {
          name,
          ...(sanitizedMetadata && { metadata: sanitizedMetadata }),
        },
      });
    } else {
      const mode = this.get('config')?.mode;

      debugLog.clientError('App', `Custom event validation failed: ${error}`, {
        name,
        error,
        mode,
      });

      if (mode === 'qa' || mode === 'debug') {
        throw new Error(`Custom event "${name}" validation failed: ${error}`);
      }
    }
  }

  async destroy(): Promise<void> {
    if (!this.isInitialized) {
      debugLog.warn('App', 'Destroy called but not initialized');
      return;
    }

    debugLog.info('App', 'Cleanup started');

    // Cleanup integrations
    if (this.googleAnalytics) {
      try {
        this.googleAnalytics.cleanup();
      } catch (error) {
        debugLog.warn('App', 'Analytics cleanup failed', { error });
      }
    }

    // Stop handlers in parallel
    const handlers = [
      this.sessionHandler,
      this.pageViewHandler,
      this.clickHandler,
      this.scrollHandler,
      this.performanceHandler,
      this.errorHandler,
    ].filter(Boolean);

    const cleanupResults = await Promise.allSettled(handlers.map((handler) => handler.stopTracking()));

    // Log any failed cleanups
    cleanupResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        debugLog.warn('App', 'Handler cleanup failed', {
          handlerIndex: index,
          error: result.reason,
        });
      }
    });

    // Clear timers
    if (this.suppressNextScrollTimer) {
      clearTimeout(this.suppressNextScrollTimer);
      this.suppressNextScrollTimer = null;
    }

    // Stop event manager
    if (this.eventManager) {
      try {
        this.eventManager.stop();
      } catch (error) {
        debugLog.warn('App', 'EventManager cleanup failed', { error });
      }
    }

    // Reset state
    this.set('hasStartSession', false);
    this.set('suppressNextScroll', false);
    this.set('sessionId', null);

    this.isInitialized = false;
    debugLog.info('App', 'Cleanup completed');
  }

  // --- Private Setup Methods ---

  private async setState(appConfig: AppConfig): Promise<void> {
    this.setApiUrl(appConfig.id, appConfig.allowHttp);
    await this.setConfig(appConfig);
    this.setUserId();
    this.setDevice();
    this.setPageUrl();
  }

  private setApiUrl(id: string, allowHttp = false): void {
    const apiUrl = getApiUrlForProject(id, allowHttp);
    this.set('apiUrl', apiUrl);
  }

  private async setConfig(appConfig: AppConfig): Promise<void> {
    const configManager = new ConfigManager();
    const config = await configManager.get(this.get('apiUrl'), appConfig);
    this.set('config', config);
  }

  private setUserId(): void {
    const userId = UserManager.getId(this.storageManager, this.get('config')?.id);
    this.set('userId', userId);
  }

  private setDevice(): void {
    this.set('device', getDeviceType());
  }

  private setPageUrl(): void {
    const url = normalizeUrl(window.location.href, this.get('config').sensitiveQueryParams);
    this.set('pageUrl', url);
  }

  private async setupIntegrations(): Promise<void> {
    const config = this.get('config');

    // Only proceed if integrations are configured and IP is not excluded
    if (config.ipExcluded || !config.integrations) {
      return;
    }

    const measurementId = config.integrations.googleAnalytics?.measurementId;
    if (measurementId?.trim()) {
      this.googleAnalytics = new GoogleAnalyticsIntegration();
      await this.googleAnalytics.initialize();
    }
  }

  // --- Private Handler Initialization ---

  private async initHandlers(): Promise<void> {
    if (!this.eventManager || !this.storageManager) {
      throw new Error('EventManager and StorageManager must be initialized first');
    }

    this.initSessionHandler();
    this.initPageViewHandler();
    this.initClickHandler();
    this.initScrollHandler();
    await this.initPerformanceHandler();
    this.initErrorHandler();
  }

  private initSessionHandler(): void {
    this.sessionHandler = new SessionHandler(this.storageManager, this.eventManager);
    this.sessionHandler.startTracking();
  }

  private initPageViewHandler(): void {
    const onPageView = async (): Promise<void> => {
      this.set('suppressNextScroll', true);

      if (this.suppressNextScrollTimer) {
        clearTimeout(this.suppressNextScrollTimer);
      }

      this.suppressNextScrollTimer = window.setTimeout(async () => {
        this.set('suppressNextScroll', false);
      }, SCROLL_DEBOUNCE_TIME_MS * SCROLL_SUPPRESS_MULTIPLIER);
    };

    this.pageViewHandler = new PageViewHandler(this.eventManager, onPageView);
    this.pageViewHandler.startTracking();
  }

  private initClickHandler(): void {
    this.clickHandler = new ClickHandler(this.eventManager);
    this.clickHandler.startTracking();
  }

  private initScrollHandler(): void {
    this.scrollHandler = new ScrollHandler(this.eventManager);
    this.scrollHandler.startTracking();
  }

  private async initPerformanceHandler(): Promise<void> {
    this.performanceHandler = new PerformanceHandler(this.eventManager);
    await this.performanceHandler.startTracking();
  }

  private initErrorHandler(): void {
    this.errorHandler = new ErrorHandler(this.eventManager);
    this.errorHandler.startTracking();
  }
}
