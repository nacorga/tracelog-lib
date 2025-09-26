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
import { SCROLL_DEBOUNCE_TIME_MS, SCROLL_SUPPRESS_MULTIPLIER } from './constants/config.constants';
import { PerformanceHandler } from './handlers/performance.handler';
import { ErrorHandler } from './handlers/error.handler';
import { debugLog } from './utils/logging';

/**
 * Main application class for TraceLog analytics
 * Orchestrates event tracking, session management, and integrations
 */
export class App extends StateManager {
  private isInitialized = false;
  private suppressNextScrollTimer: number | null = null;

  protected managers: {
    storage?: StorageManager;
    event?: EventManager;
  } = {};

  protected handlers: {
    session?: SessionHandler;
    pageView?: PageViewHandler;
    click?: ClickHandler;
    scroll?: ScrollHandler;
    performance?: PerformanceHandler;
    error?: ErrorHandler;
  } = {};

  protected integrations: {
    googleAnalytics?: GoogleAnalyticsIntegration;
  } = {};

  get initialized(): boolean {
    return this.isInitialized;
  }

  async init(appConfig: AppConfig): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (!appConfig.id?.trim()) {
      throw new Error('Project ID is required');
    }

    try {
      // Initialize core components
      this.managers.storage = new StorageManager();
      await this.setupState(appConfig);

      // Setup optional integrations
      await this.setupIntegrations();

      // Initialize event system
      this.managers.event = new EventManager(this.managers.storage, this.integrations.googleAnalytics);

      // Start handlers
      this.initializeHandlers();

      // Recover any persisted events
      await this.managers.event.recoverPersistedEvents().catch(() => {
        // Silent recovery failure - not critical for v1
      });

      this.isInitialized = true;
      debugLog.info('App', 'Initialization completed');
    } catch (error) {
      throw new Error(`TraceLog initialization failed: ${error}`);
    }
  }

  sendCustomEvent(name: string, metadata?: Record<string, unknown>): void {
    if (!this.managers.event) {
      return;
    }

    const { valid, error, sanitizedMetadata } = isEventValid(name, metadata);

    if (!valid) {
      const config = this.get('config');
      if (config?.mode === 'qa' || config?.mode === 'debug') {
        throw new Error(`Custom event "${name}" validation failed: ${error}`);
      }
      return;
    }

    this.managers.event.track({
      type: EventType.CUSTOM,
      custom_event: {
        name,
        ...(sanitizedMetadata && { metadata: sanitizedMetadata }),
      },
    });
  }

  async destroy(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    // Cleanup integrations
    this.integrations.googleAnalytics?.cleanup();

    // Stop all handlers
    const handlerCleanups = Object.values(this.handlers)
      .filter(Boolean)
      .map(async (handler) => {
        try {
          await handler.stopTracking();
        } catch {
          // Silent failures
        }
      });

    await Promise.allSettled(handlerCleanups);

    // Clear timers
    if (this.suppressNextScrollTimer) {
      clearTimeout(this.suppressNextScrollTimer);
      this.suppressNextScrollTimer = null;
    }

    // Stop event manager
    this.managers.event?.stop();

    // Reset critical state
    this.set('hasStartSession', false);
    this.set('suppressNextScroll', false);
    this.set('sessionId', null);

    this.isInitialized = false;
    this.handlers = {};
  }

  // --- Private Setup Methods ---

  private async setupState(appConfig: AppConfig): Promise<void> {
    // Set API URL
    const apiUrl = getApiUrlForProject(appConfig.id, appConfig.allowHttp);
    this.set('apiUrl', apiUrl);

    // Get remote configuration
    const configManager = new ConfigManager();
    const config = await configManager.get(apiUrl, appConfig);
    this.set('config', config);

    // Set user ID
    const userId = UserManager.getId(this.managers.storage as StorageManager, config.id);
    this.set('userId', userId);

    // Set device and page info
    this.set('device', getDeviceType());
    const pageUrl = normalizeUrl(window.location.href, config.sensitiveQueryParams);
    this.set('pageUrl', pageUrl);
  }

  private async setupIntegrations(): Promise<void> {
    const config = this.get('config');
    const measurementId = config.integrations?.googleAnalytics?.measurementId;

    if (!config.ipExcluded && measurementId?.trim()) {
      try {
        this.integrations.googleAnalytics = new GoogleAnalyticsIntegration();
        await this.integrations.googleAnalytics.initialize();
      } catch {
        this.integrations.googleAnalytics = undefined; // Silent failure for v1
      }
    }
  }

  // --- Private Handler Initialization ---

  private initializeHandlers(): void {
    // Session tracking
    this.handlers.session = new SessionHandler(
      this.managers.storage as StorageManager,
      this.managers.event as EventManager,
    );

    this.handlers.session.startTracking();

    // Page view tracking with scroll suppression
    const onPageView = (): void => {
      this.set('suppressNextScroll', true);

      if (this.suppressNextScrollTimer) {
        clearTimeout(this.suppressNextScrollTimer);
      }

      this.suppressNextScrollTimer = window.setTimeout(() => {
        this.set('suppressNextScroll', false);
      }, SCROLL_DEBOUNCE_TIME_MS * SCROLL_SUPPRESS_MULTIPLIER);
    };

    this.handlers.pageView = new PageViewHandler(this.managers.event as EventManager, onPageView);
    this.handlers.pageView.startTracking();

    // User interaction tracking
    this.handlers.click = new ClickHandler(this.managers.event as EventManager);
    this.handlers.click.startTracking();

    this.handlers.scroll = new ScrollHandler(this.managers.event as EventManager);
    this.handlers.scroll.startTracking();

    // Performance and error tracking
    this.handlers.performance = new PerformanceHandler(this.managers.event as EventManager);
    this.handlers.performance.startTracking().catch(() => {}); // Silent failure

    this.handlers.error = new ErrorHandler(this.managers.event as EventManager);
    this.handlers.error.startTracking();
  }
}
