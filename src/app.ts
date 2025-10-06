import { EventManager } from './managers/event.manager';
import { UserManager } from './managers/user.manager';
import { StateManager } from './managers/state.manager';
import { SessionHandler } from './handlers/session.handler';
import { PageViewHandler } from './handlers/page-view.handler';
import { ClickHandler } from './handlers/click.handler';
import { ScrollHandler } from './handlers/scroll.handler';
import { Config, EventType, EmitterCallback, EmitterMap, Mode } from './types';
import { GoogleAnalyticsIntegration } from './integrations/google-analytics.integration';
import { isEventValid, getDeviceType, normalizeUrl, Emitter, getApiUrl, detectQaMode, log } from './utils';
import { StorageManager } from './managers/storage.manager';
import { SCROLL_DEBOUNCE_TIME_MS, SCROLL_SUPPRESS_MULTIPLIER } from './constants/config.constants';
import { PerformanceHandler } from './handlers/performance.handler';
import { ErrorHandler } from './handlers/error.handler';

export class App extends StateManager {
  private isInitialized = false;
  private suppressNextScrollTimer: number | null = null;

  private readonly emitter = new Emitter();

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

  async init(config: Config): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.managers.storage = new StorageManager();

    try {
      this.setupState(config);
      await this.setupIntegrations();

      this.managers.event = new EventManager(this.managers.storage, this.integrations.googleAnalytics, this.emitter);

      await this.initializeHandlers();

      await this.managers.event.recoverPersistedEvents().catch((error) => {
        log('warn', 'Failed to recover persisted events', { error });
      });

      this.isInitialized = true;
    } catch (error) {
      await this.destroy(true);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`[TraceLog] TraceLog initialization failed: ${errorMessage}`);
    }
  }

  sendCustomEvent(name: string, metadata?: Record<string, unknown> | Record<string, unknown>[]): void {
    if (!this.managers.event) {
      return;
    }

    const { valid, error, sanitizedMetadata } = isEventValid(name, metadata);

    if (!valid) {
      if (this.get('mode') === Mode.QA) {
        throw new Error(`[TraceLog] Custom event "${name}" validation failed: ${error}`);
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

  on<K extends keyof EmitterMap>(event: K, callback: EmitterCallback<EmitterMap[K]>): void {
    this.emitter.on(event, callback);
  }

  off<K extends keyof EmitterMap>(event: K, callback: EmitterCallback<EmitterMap[K]>): void {
    this.emitter.off(event, callback);
  }

  async destroy(force = false): Promise<void> {
    if (!this.isInitialized && !force) {
      return;
    }

    this.integrations.googleAnalytics?.cleanup();

    const handlerCleanups = Object.values(this.handlers)
      .filter(Boolean)
      .map(async (handler) => {
        try {
          await handler.stopTracking();
        } catch (error) {
          log('warn', 'Failed to stop tracking', { error });
        }
      });

    await Promise.allSettled(handlerCleanups);

    if (this.suppressNextScrollTimer) {
      clearTimeout(this.suppressNextScrollTimer);
      this.suppressNextScrollTimer = null;
    }

    this.managers.event?.flushImmediatelySync();

    this.managers.event?.stop();

    this.emitter.removeAllListeners();

    this.set('hasStartSession', false);
    this.set('suppressNextScroll', false);
    this.set('sessionId', null);

    this.isInitialized = false;
    this.handlers = {};
  }

  private setupState(config: Config): void {
    this.set('config', config);

    const userId = UserManager.getId(this.managers.storage as StorageManager);
    this.set('userId', userId);

    const apiUrl = getApiUrl(config);
    this.set('apiUrl', apiUrl);

    const device = getDeviceType();
    this.set('device', device);

    const pageUrl = normalizeUrl(window.location.href, config.sensitiveQueryParams);
    this.set('pageUrl', pageUrl);

    const mode = detectQaMode() ? Mode.QA : undefined;

    if (mode) {
      this.set('mode', mode);
    }
  }

  private async setupIntegrations(): Promise<void> {
    const config = this.get('config');
    const measurementId = config.integrations?.googleAnalytics?.measurementId;

    if (measurementId?.trim()) {
      try {
        this.integrations.googleAnalytics = new GoogleAnalyticsIntegration();
        await this.integrations.googleAnalytics.initialize();
      } catch {
        this.integrations.googleAnalytics = undefined;
      }
    }
  }

  private async initializeHandlers(): Promise<void> {
    this.handlers.session = new SessionHandler(
      this.managers.storage as StorageManager,
      this.managers.event as EventManager,
    );

    await this.handlers.session.startTracking();

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

    this.handlers.click = new ClickHandler(this.managers.event as EventManager);
    this.handlers.click.startTracking();

    this.handlers.scroll = new ScrollHandler(this.managers.event as EventManager);
    this.handlers.scroll.startTracking();

    this.handlers.performance = new PerformanceHandler(this.managers.event as EventManager);
    this.handlers.performance.startTracking().catch((error) => {
      log('warn', 'Failed to start performance tracking', { error });
    });

    this.handlers.error = new ErrorHandler(this.managers.event as EventManager);
    this.handlers.error.startTracking();
  }
}
