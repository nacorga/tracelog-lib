import { ApiManager } from './managers/api.manager';
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
import { SCROLL_DEBOUNCE_TIME_MS } from './constants';
import { PerformanceHandler } from './handlers/performance.handler';
import { ErrorHandler } from './handlers/error.handler';
import { NetworkHandler } from './handlers/network.handler';
import { ProjectIdValidationError } from './types/validation-error.types';

export class App extends StateManager {
  private isInitialized = false;
  private googleAnalytics: GoogleAnalyticsIntegration | null = null;
  private storageManager!: StorageManager;
  private eventManager!: EventManager;
  private sessionHandler!: SessionHandler;
  private pageViewHandler!: PageViewHandler;
  private clickHandler!: ClickHandler;
  private scrollHandler!: ScrollHandler;
  private performanceHandler!: PerformanceHandler;
  private errorHandler!: ErrorHandler;
  private networkHandler!: NetworkHandler;
  private suppressNextScrollTimer: number | null = null;

  async init(appConfig: AppConfig): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // The app layer expects a fully validated and normalized config
    // This is a final safety check - config should already be validated by api.ts
    this.validateAppReadiness(appConfig);

    try {
      this.initStorage();
      await this.setState(appConfig);
      await this.setIntegrations();
      this.setEventManager();
      await this.initHandlers();
      this.isInitialized = true;
    } catch (error) {
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Validates that the app is ready to initialize with the provided config
   * This is a runtime validation layer that ensures the app receives proper config
   * @param appConfig - The validated and normalized configuration
   * @throws {ProjectIdValidationError} If project ID is invalid at runtime
   */
  private validateAppReadiness(appConfig: AppConfig): void {
    // At this point, config should be validated and normalized by api.ts
    // This is a safety check for runtime integrity
    if (!appConfig || typeof appConfig !== 'object') {
      throw new ProjectIdValidationError('Configuration object is required', 'app');
    }

    // Since config comes pre-normalized, an empty ID here indicates a system error
    if (!appConfig.id || typeof appConfig.id !== 'string' || !appConfig.id.trim()) {
      throw new ProjectIdValidationError('Project ID is required', 'app');
    }
  }

  sendCustomEvent(name: string, metadata?: Record<string, unknown>): void {
    const { valid, error, sanitizedMetadata } = isEventValid(name, metadata);

    if (valid) {
      this.eventManager.track({
        type: EventType.CUSTOM,
        custom_event: {
          name,
          ...(sanitizedMetadata && { metadata: sanitizedMetadata }),
        },
      });
    } else if (this.get('config')?.qaMode) {
      throw new Error(
        `custom event "${name}" validation failed (${error ?? 'unknown error'}). Please, review your event data and try again.`,
      );
    }
  }

  destroy(): void {
    if (!this.isInitialized) {
      return;
    }

    if (this.googleAnalytics) {
      this.googleAnalytics.cleanup();
    }

    if (this.sessionHandler) {
      this.sessionHandler.stopTracking();
    }

    if (this.pageViewHandler) {
      this.pageViewHandler.stopTracking();
    }

    if (this.clickHandler) {
      this.clickHandler.stopTracking();
    }

    if (this.scrollHandler) {
      this.scrollHandler.stopTracking();
    }

    if (this.performanceHandler) {
      this.performanceHandler.stopTracking();
    }

    if (this.errorHandler) {
      this.errorHandler.stopTracking();
    }

    if (this.networkHandler) {
      this.networkHandler.stopTracking();
    }

    if (this.suppressNextScrollTimer) {
      clearTimeout(this.suppressNextScrollTimer);
      this.suppressNextScrollTimer = null;
    }

    if (this.eventManager) {
      this.eventManager.stop();
    }

    this.set('hasStartSession', false);
    this.set('suppressNextScroll', false);
    this.set('sessionId', null);

    this.isInitialized = false;
  }

  private async setState(appConfig: AppConfig): Promise<void> {
    this.setApiUrl(appConfig.id, appConfig.allowHttp);
    await this.setConfig(appConfig);
    this.setUserId();
    this.setDevice();
    this.setPageUrl();
  }

  private setApiUrl(id: string, allowHttp = false): void {
    const apiManager = new ApiManager();
    this.set('apiUrl', apiManager.getUrl(id, allowHttp));
  }

  private async setConfig(appConfig: AppConfig): Promise<void> {
    const configManager = new ConfigManager();
    const config = await configManager.get(this.get('apiUrl'), appConfig);

    this.set('config', config);
  }

  private setUserId(): void {
    const userManager = new UserManager(this.storageManager);
    const userId = userManager.getId();

    this.set('userId', userId);
  }

  private setDevice(): void {
    const device = getDeviceType();
    this.set('device', device);
  }

  private setPageUrl(): void {
    const initialUrl = normalizeUrl(window.location.href, this.get('config').sensitiveQueryParams);
    this.set('pageUrl', initialUrl);
  }

  private async setIntegrations(): Promise<void> {
    const isIPExcluded = this.get('config').ipExcluded;
    const measurementId = this.get('config').integrations?.googleAnalytics?.measurementId;

    if (!isIPExcluded && measurementId?.trim()) {
      this.googleAnalytics = new GoogleAnalyticsIntegration();
      await this.googleAnalytics.initialize();
    }
  }

  private async initHandlers(): Promise<void> {
    this.initSessionHandler();
    this.initPageViewHandler();
    this.initClickHandler();
    this.initScrollHandler();
    await this.initPerformanceHandler();
    this.initErrorHandler();
    this.initNetworkHandler();
  }

  private initStorage(): void {
    this.storageManager = new StorageManager();
  }

  private setEventManager(): void {
    this.eventManager = new EventManager(this.storageManager, this.googleAnalytics);
  }

  private initSessionHandler(): void {
    this.sessionHandler = new SessionHandler(this.storageManager, this.eventManager);
    this.sessionHandler.startTracking();
  }

  private initPageViewHandler(): void {
    const onPageViewTrack = (): void => this.onPageViewTrack();

    this.pageViewHandler = new PageViewHandler(this.eventManager, onPageViewTrack);
    this.pageViewHandler.startTracking();
  }

  private onPageViewTrack(): void {
    this.set('suppressNextScroll', true);

    if (this.suppressNextScrollTimer) {
      clearTimeout(this.suppressNextScrollTimer);
      this.suppressNextScrollTimer = null;
    }

    this.suppressNextScrollTimer = window.setTimeout(() => {
      this.set('suppressNextScroll', false);
    }, SCROLL_DEBOUNCE_TIME_MS * 2);
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

  private initNetworkHandler(): void {
    this.networkHandler = new NetworkHandler(this.eventManager);
    this.networkHandler.startTracking();
  }
}
