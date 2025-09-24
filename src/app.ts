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
import { SCROLL_DEBOUNCE_TIME_MS, SCROLL_SUPPRESSION_CONSTANTS } from './constants';
import { PerformanceHandler } from './handlers/performance.handler';
import { ErrorHandler } from './handlers/error.handler';
import { NetworkHandler } from './handlers/network.handler';
import { debugLog } from './utils/logging';

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
  protected networkHandler!: NetworkHandler;
  protected suppressNextScrollTimer: number | null = null;

  /**
   * Returns the initialization status of the app
   * @returns true if the app is fully initialized, false otherwise
   */
  get initialized(): boolean {
    return this.isInitialized;
  }

  async init(appConfig: AppConfig): Promise<void> {
    if (this.isInitialized) {
      debugLog.debug('App', 'App already initialized, skipping re-initialization', { projectId: appConfig.id });
      return;
    }

    debugLog.info('App', 'App initialization started', { projectId: appConfig.id });

    try {
      debugLog.debug('App', 'Initializing storage manager');
      this.initStorage();
      this.validateStorageManager();

      debugLog.debug('App', 'Setting application state');
      await this.setState(appConfig);
      this.validateState();

      debugLog.debug('App', 'Setting integrations');
      await this.setIntegrations();

      debugLog.debug('App', 'Initializing event manager');
      this.setEventManager();
      this.validateEventManager();

      debugLog.debug('App', 'Initializing handlers');
      await this.initHandlers();
      this.validateHandlersInitialized();

      debugLog.debug('App', 'Recovering persisted events');
      await this.eventManager.recoverPersistedEvents();

      this.isInitialized = true;

      debugLog.info('App', 'App initialization completed successfully', {
        projectId: appConfig.id,
      });
    } catch (error) {
      this.isInitialized = false;

      debugLog.error('App', 'App initialization failed, performing rollback', { projectId: appConfig.id, error });

      await this.rollbackInitialization();

      throw error;
    }
  }

  /**
   * Validates that StorageManager was properly initialized
   * @throws {Error} If StorageManager is not initialized
   */
  private validateStorageManager(): void {
    if (!this.storageManager) {
      debugLog.error('App', 'StorageManager validation failed - not initialized');
      throw new Error('StorageManager initialization failed');
    }
  }

  /**
   * Validates that required state properties are set
   * @throws {Error} If required state is missing
   */
  private validateState(): void {
    const missingState: string[] = [];

    if (!this.get('apiUrl')) {
      missingState.push('apiUrl');
    }

    if (!this.get('config')) {
      missingState.push('config');
    }

    if (!this.get('userId')) {
      missingState.push('userId');
    }

    if (!this.get('device')) {
      missingState.push('device');
    }

    if (!this.get('pageUrl')) {
      missingState.push('pageUrl');
    }

    if (missingState.length > 0) {
      debugLog.error('App', 'State validation failed - missing required properties', { missingState });
      throw new Error(`State initialization failed - missing: ${missingState.join(', ')}`);
    }
  }

  /**
   * Validates that EventManager was properly initialized
   * @throws {Error} If EventManager is not initialized
   */
  private validateEventManager(): void {
    if (!this.eventManager) {
      debugLog.error('App', 'EventManager validation failed - not initialized');
      throw new Error('EventManager initialization failed');
    }
  }

  /**
   * Validates that all required handlers are initialized
   * @throws {Error} If any required handler is missing
   */
  private validateHandlersInitialized(): void {
    const requiredHandlers = [
      { name: 'sessionHandler', handler: this.sessionHandler },
      { name: 'scrollHandler', handler: this.scrollHandler },
      { name: 'pageViewHandler', handler: this.pageViewHandler },
      { name: 'clickHandler', handler: this.clickHandler },
      { name: 'performanceHandler', handler: this.performanceHandler },
      { name: 'errorHandler', handler: this.errorHandler },
      { name: 'networkHandler', handler: this.networkHandler },
    ];

    const missingHandlers: string[] = [];

    for (const { name, handler } of requiredHandlers) {
      if (!handler) {
        missingHandlers.push(name);
      }
    }

    if (missingHandlers.length > 0) {
      debugLog.error('App', 'Handlers validation failed - missing required handlers', { missingHandlers });
      throw new Error(`Handlers initialization failed - missing: ${missingHandlers.join(', ')}`);
    }
  }

  /**
   * Performs cleanup rollback when initialization fails
   * Safely cleans up any partially initialized components
   */
  private async rollbackInitialization(): Promise<void> {
    debugLog.info('App', 'Rollback initialization started');

    try {
      if (this.googleAnalytics) {
        debugLog.debug('App', 'Cleaning up Google Analytics integration');
        try {
          this.googleAnalytics.cleanup();
        } catch (error) {
          debugLog.warn('App', 'Google Analytics cleanup failed during rollback', { error });
        }
        this.googleAnalytics = null;
      }

      if (this.sessionHandler) {
        debugLog.debug('App', 'Stopping session handler');
        try {
          await this.sessionHandler.stopTracking();
        } catch (error) {
          debugLog.warn('App', 'Session handler cleanup failed during rollback', { error });
        }
      }

      if (this.pageViewHandler) {
        debugLog.debug('App', 'Stopping page view handler');
        try {
          this.pageViewHandler.stopTracking();
        } catch (error) {
          debugLog.warn('App', 'Page view handler cleanup failed during rollback', { error });
        }
      }

      if (this.clickHandler) {
        debugLog.debug('App', 'Stopping click handler');
        try {
          this.clickHandler.stopTracking();
        } catch (error) {
          debugLog.warn('App', 'Click handler cleanup failed during rollback', { error });
        }
      }

      if (this.scrollHandler) {
        debugLog.debug('App', 'Stopping scroll handler');
        try {
          this.scrollHandler.stopTracking();
        } catch (error) {
          debugLog.warn('App', 'Scroll handler cleanup failed during rollback', { error });
        }
      }

      if (this.performanceHandler) {
        debugLog.debug('App', 'Stopping performance handler');
        try {
          this.performanceHandler.stopTracking();
        } catch (error) {
          debugLog.warn('App', 'Performance handler cleanup failed during rollback', { error });
        }
      }

      if (this.errorHandler) {
        debugLog.debug('App', 'Stopping error handler');
        try {
          this.errorHandler.stopTracking();
        } catch (error) {
          debugLog.warn('App', 'Error handler cleanup failed during rollback', { error });
        }
      }

      if (this.networkHandler) {
        debugLog.debug('App', 'Stopping network handler');
        try {
          this.networkHandler.stopTracking();
        } catch (error) {
          debugLog.warn('App', 'Network handler cleanup failed during rollback', { error });
        }
      }

      if (this.suppressNextScrollTimer) {
        debugLog.debug('App', 'Clearing scroll suppression timer');
        clearTimeout(this.suppressNextScrollTimer);
        this.suppressNextScrollTimer = null;
      }

      if (this.eventManager) {
        debugLog.debug('App', 'Stopping event manager');
        try {
          this.eventManager.stop();
        } catch (error) {
          debugLog.warn('App', 'Event manager cleanup failed during rollback', { error });
        }
      }

      debugLog.debug('App', 'Resetting state properties');
      await this.set('hasStartSession', false);
      await this.set('suppressNextScroll', false);
      await this.set('sessionId', null);

      debugLog.info('App', 'Rollback initialization completed');
    } catch (error) {
      debugLog.error('App', 'Rollback initialization failed', { error });
    }
  }

  sendCustomEvent(name: string, metadata?: Record<string, unknown>): void {
    if (!this.eventManager) {
      debugLog.warn('App', 'Custom event attempted before eventManager initialization', { eventName: name });
      return;
    }

    const { valid, error, sanitizedMetadata } = isEventValid(name, metadata);

    if (valid) {
      debugLog.debug('App', 'Custom event validated and queued', { eventName: name, hasMetadata: !!sanitizedMetadata });

      this.eventManager.track({
        type: EventType.CUSTOM,
        custom_event: {
          name,
          ...(sanitizedMetadata && { metadata: sanitizedMetadata }),
        },
      });
    } else {
      const currentMode = this.get('config')?.mode;

      debugLog.clientError('App', `Custom event validation failed: ${error ?? 'unknown error'}`, {
        eventName: name,
        validationError: error,
        hasMetadata: !!metadata,
        mode: currentMode,
      });

      if (currentMode === 'qa' || currentMode === 'debug') {
        throw new Error(
          `custom event "${name}" validation failed (${error ?? 'unknown error'}). Please, review your event data and try again.`,
        );
      }
    }
  }

  /**
   * Gets current error recovery statistics for monitoring purposes
   * @returns Object with recovery statistics and system status
   */
  getRecoveryStats(): ReturnType<EventManager['getRecoveryStats']> | null {
    if (!this.eventManager) {
      debugLog.warn('App', 'Recovery stats requested before eventManager initialization');
      return null;
    }

    return this.eventManager.getRecoveryStats();
  }

  /**
   * Triggers manual system recovery to attempt fixing error states
   * @returns Promise that resolves when recovery attempt is complete
   */
  async attemptSystemRecovery(): Promise<void> {
    if (!this.eventManager) {
      debugLog.warn('App', 'System recovery attempted before eventManager initialization');
      return;
    }

    debugLog.info('App', 'Manual system recovery triggered');
    await this.eventManager.attemptSystemRecovery();
  }

  /**
   * Triggers aggressive fingerprint cleanup to free memory
   */
  aggressiveFingerprintCleanup(): void {
    if (!this.eventManager) {
      debugLog.warn('App', 'Fingerprint cleanup attempted before eventManager initialization');
      return;
    }

    debugLog.info('App', 'Manual fingerprint cleanup triggered');
    this.eventManager.aggressiveFingerprintCleanup();
  }

  async destroy(): Promise<void> {
    if (!this.isInitialized) {
      debugLog.warn('App', 'Destroy called but app was not initialized');
      return;
    }

    debugLog.info('App', 'App cleanup started');

    if (this.googleAnalytics) {
      this.googleAnalytics.cleanup();
    }

    if (this.sessionHandler) {
      await this.sessionHandler.stopTracking();
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

    await this.set('hasStartSession', false);
    await this.set('suppressNextScroll', false);
    await this.set('sessionId', null);

    this.isInitialized = false;
    debugLog.info('App', 'App cleanup completed successfully');
  }

  private async setState(appConfig: AppConfig): Promise<void> {
    await this.setApiUrl(appConfig.id, appConfig.allowHttp);
    await this.setConfig(appConfig);
    await this.setUserId();
    await this.setDevice();
    await this.setPageUrl();
  }

  private async setApiUrl(id: string, allowHttp = false): Promise<void> {
    const apiManager = new ApiManager();
    await this.set('apiUrl', apiManager.getUrl(id, allowHttp));
  }

  private async setConfig(appConfig: AppConfig): Promise<void> {
    const configManager = new ConfigManager();

    try {
      const config = await configManager.get(this.get('apiUrl'), appConfig);
      await this.set('config', config);
    } catch (error) {
      debugLog.clientError('App', 'CONFIG LOAD FAILED', { error });
      throw error;
    }
  }

  private async setUserId(): Promise<void> {
    const userManager = new UserManager(this.storageManager);
    const userId = userManager.getId();

    await this.set('userId', userId);
  }

  private async setDevice(): Promise<void> {
    const device = getDeviceType();
    await this.set('device', device);
  }

  private async setPageUrl(): Promise<void> {
    const initialUrl = normalizeUrl(window.location.href, this.get('config').sensitiveQueryParams);
    await this.set('pageUrl', initialUrl);
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
    if (!this.eventManager) {
      throw new Error('EventManager must be initialized before handlers');
    }

    if (!this.storageManager) {
      throw new Error('StorageManager must be initialized before handlers');
    }

    this.initSessionHandler();
    this.initScrollHandler();
    this.initPageViewHandler();
    this.initClickHandler();
    await this.initPerformanceHandler();
    this.initErrorHandler();
    this.initNetworkHandler();
  }

  private initStorage(): void {
    this.storageManager = new StorageManager();
  }

  private setEventManager(): void {
    if (!this.storageManager) {
      throw new Error('StorageManager must be initialized before EventManager');
    }
    this.eventManager = new EventManager(this.storageManager, this.googleAnalytics);
  }

  private initSessionHandler(): void {
    if (!this.storageManager || !this.eventManager) {
      throw new Error('StorageManager and EventManager must be initialized before SessionHandler');
    }
    this.sessionHandler = new SessionHandler(this.storageManager, this.eventManager);
    this.sessionHandler.startTracking();
  }

  private initScrollHandler(): void {
    if (!this.eventManager) {
      throw new Error('EventManager must be initialized before ScrollHandler');
    }
    this.scrollHandler = new ScrollHandler(this.eventManager);
    this.scrollHandler.startTracking();
  }

  private initPageViewHandler(): void {
    if (!this.eventManager) {
      throw new Error('EventManager must be initialized before PageViewHandler');
    }
    const onPageViewTrack = async (): Promise<void> => await this.onPageViewTrack();

    this.pageViewHandler = new PageViewHandler(this.eventManager, onPageViewTrack);
    this.pageViewHandler.startTracking();
  }

  private async onPageViewTrack(): Promise<void> {
    await this.set('suppressNextScroll', true);

    if (this.suppressNextScrollTimer) {
      clearTimeout(this.suppressNextScrollTimer);
      this.suppressNextScrollTimer = null;
    }

    this.suppressNextScrollTimer = window.setTimeout(async () => {
      await this.set('suppressNextScroll', false);
    }, SCROLL_DEBOUNCE_TIME_MS * SCROLL_SUPPRESSION_CONSTANTS.SUPPRESS_MULTIPLIER);
  }

  private initClickHandler(): void {
    if (!this.eventManager) {
      throw new Error('EventManager must be initialized before ClickHandler');
    }
    this.clickHandler = new ClickHandler(this.eventManager);
    this.clickHandler.startTracking();
  }

  private async initPerformanceHandler(): Promise<void> {
    if (!this.eventManager) {
      throw new Error('EventManager must be initialized before PerformanceHandler');
    }
    this.performanceHandler = new PerformanceHandler(this.eventManager);
    await this.performanceHandler.startTracking();
  }

  private initErrorHandler(): void {
    if (!this.eventManager) {
      throw new Error('EventManager must be initialized before ErrorHandler');
    }
    this.errorHandler = new ErrorHandler(this.eventManager);
    this.errorHandler.startTracking();
  }

  private initNetworkHandler(): void {
    if (!this.eventManager) {
      throw new Error('EventManager must be initialized before NetworkHandler');
    }
    this.networkHandler = new NetworkHandler(this.eventManager);
    this.networkHandler.startTracking();
  }
}
