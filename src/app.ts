import { EventManager } from './managers/event.manager';
import { UserManager } from './managers/user.manager';
import { StateManager } from './managers/state.manager';
import { SessionHandler } from './handlers/session.handler';
import { PageViewHandler } from './handlers/page-view.handler';
import { ClickHandler } from './handlers/click.handler';
import { ScrollHandler } from './handlers/scroll.handler';
import { ViewportHandler } from './handlers/viewport.handler';
import { Config, EventType, EmitterCallback, EmitterMap, Mode, EventData, EventsQueue } from './types';
import { GoogleAnalyticsIntegration } from './integrations/google-analytics.integration';
import { isEventValid, getDeviceType, normalizeUrl, Emitter, getCollectApiUrls, detectQaMode, log } from './utils';
import { StorageManager } from './managers/storage.manager';
import { SCROLL_DEBOUNCE_TIME_MS, SCROLL_SUPPRESS_MULTIPLIER } from './constants/config.constants';
import { PerformanceHandler } from './handlers/performance.handler';
import { ErrorHandler } from './handlers/error.handler';
import { TransformerHook } from './types/transformer.types';

export class App extends StateManager {
  private isInitialized = false;
  private suppressNextScrollTimer: number | null = null;

  private readonly emitter = new Emitter();
  private readonly transformers: Map<
    TransformerHook,
    (data: EventData | EventsQueue) => EventData | EventsQueue | null
  > = new Map();

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
    viewport?: ViewportHandler;
  } = {};

  protected integrations: {
    googleAnalytics?: GoogleAnalyticsIntegration;
  } = {};

  get initialized(): boolean {
    return this.isInitialized;
  }

  async init(config: Config = {}): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.managers.storage = new StorageManager();

    try {
      this.setupState(config);
      await this.setupIntegrations();

      this.managers.event = new EventManager(
        this.managers.storage,
        this.integrations.googleAnalytics,
        this.emitter,
        this.transformers,
      );

      this.initializeHandlers();

      await this.managers.event.recoverPersistedEvents().catch((error) => {
        log('warn', 'Failed to recover persisted events', { error });
      });

      this.isInitialized = true;
    } catch (error) {
      this.destroy(true);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`[TraceLog] TraceLog initialization failed: ${errorMessage}`);
    }
  }

  sendCustomEvent(name: string, metadata?: Record<string, unknown> | Record<string, unknown>[]): void {
    if (!this.managers.event) {
      return;
    }

    let normalizedMetadata = metadata;

    if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
      if (Object.getPrototypeOf(metadata) !== Object.prototype) {
        normalizedMetadata = Object.assign({}, metadata);
      }
    }

    const { valid, error, sanitizedMetadata } = isEventValid(name, normalizedMetadata);

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

  setTransformer(hook: TransformerHook, fn: (data: EventData | EventsQueue) => EventData | EventsQueue | null): void {
    this.transformers.set(hook, fn);
    log('debug', 'Transformer registered', { data: { hook } });
  }

  removeTransformer(hook: TransformerHook): void {
    const existed = this.transformers.has(hook);
    this.transformers.delete(hook);

    if (existed) {
      log('debug', 'Transformer removed', { data: { hook } });
    }
  }

  getTransformer(
    hook: TransformerHook,
  ): ((data: EventData | EventsQueue) => EventData | EventsQueue | null) | undefined {
    return this.transformers.get(hook);
  }

  destroy(force = false): void {
    if (!this.isInitialized && !force) {
      return;
    }

    this.integrations.googleAnalytics?.cleanup();

    Object.values(this.handlers)
      .filter(Boolean)
      .forEach((handler) => {
        try {
          handler.stopTracking();
        } catch (error) {
          log('warn', 'Failed to stop tracking', { error });
        }
      });

    if (this.suppressNextScrollTimer) {
      clearTimeout(this.suppressNextScrollTimer);
      this.suppressNextScrollTimer = null;
    }

    this.managers.event?.flushImmediatelySync();

    this.managers.event?.stop();

    this.emitter.removeAllListeners();
    this.transformers.clear();

    this.set('hasStartSession', false);
    this.set('suppressNextScroll', false);
    this.set('sessionId', null);

    this.isInitialized = false;
    this.handlers = {};
  }

  private setupState(config: Config = {}): void {
    this.set('config', config);

    const userId = UserManager.getId(this.managers.storage as StorageManager);
    this.set('userId', userId);

    const collectApiUrls = getCollectApiUrls(config);
    this.set('collectApiUrls', collectApiUrls);

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

  private initializeHandlers(): void {
    const config = this.get('config');
    const disabledEvents = config.disabledEvents ?? [];

    this.handlers.session = new SessionHandler(
      this.managers.storage as StorageManager,
      this.managers.event as EventManager,
    );

    this.handlers.session.startTracking();

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

    if (!disabledEvents.includes('scroll')) {
      this.handlers.scroll = new ScrollHandler(this.managers.event as EventManager);
      this.handlers.scroll.startTracking();
    }

    if (!disabledEvents.includes('web_vitals')) {
      this.handlers.performance = new PerformanceHandler(this.managers.event as EventManager);
      this.handlers.performance.startTracking().catch((error) => {
        log('warn', 'Failed to start performance tracking', { error });
      });
    }

    if (!disabledEvents.includes('error')) {
      this.handlers.error = new ErrorHandler(this.managers.event as EventManager);
      this.handlers.error.startTracking();
    }

    if (config.viewport) {
      this.handlers.viewport = new ViewportHandler(this.managers.event as EventManager);
      this.handlers.viewport.startTracking();
    }
  }
}
