import { EventManager } from './managers/event.manager';
import { UserManager } from './managers/user.manager';
import { StateManager } from './managers/state.manager';
import { ConsentManager } from './managers/consent.manager';
import { SessionHandler } from './handlers/session.handler';
import { PageViewHandler } from './handlers/page-view.handler';
import { ClickHandler } from './handlers/click.handler';
import { ScrollHandler } from './handlers/scroll.handler';
import { ViewportHandler } from './handlers/viewport.handler';
import {
  Config,
  EventType,
  EmitterCallback,
  EmitterMap,
  Mode,
  TransformerHook,
  TransformerMap,
  BeforeSendTransformer,
  BeforeBatchTransformer,
} from './types';
import { GoogleAnalyticsIntegration } from './integrations/google-analytics.integration';
import { isEventValid, getDeviceType, normalizeUrl, Emitter, getCollectApiUrls, detectQaMode, log } from './utils';
import { StorageManager } from './managers/storage.manager';
import { SCROLL_DEBOUNCE_TIME_MS, SCROLL_SUPPRESS_MULTIPLIER } from './constants/config.constants';
import { PerformanceHandler } from './handlers/performance.handler';
import { ErrorHandler } from './handlers/error.handler';

export class App extends StateManager {
  private isInitialized = false;
  private suppressNextScrollTimer: number | null = null;

  private readonly emitter = new Emitter();
  private readonly transformers: TransformerMap = {};

  protected managers: {
    storage?: StorageManager;
    event?: EventManager;
    consent?: ConsentManager;
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
    google?: GoogleAnalyticsIntegration;
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

      // Initialize consent manager first (before integrations)
      this.managers.consent = new ConsentManager(this.managers.storage, true, this.emitter);

      // Log consent mode
      if (config.waitForConsent) {
        const consentState = this.managers.consent.getConsentState();
        log('info', 'Consent mode enabled', {
          data: {
            google: consentState.google,
            custom: consentState.custom,
            tracelog: consentState.tracelog,
          },
        });
      }

      await this.setupIntegrations();

      this.managers.event = new EventManager(
        this.managers.storage,
        this.integrations.google,
        this.managers.consent,
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

  setTransformer(hook: 'beforeSend', fn: BeforeSendTransformer): void;
  setTransformer(hook: 'beforeBatch', fn: BeforeBatchTransformer): void;
  setTransformer(hook: TransformerHook, fn: BeforeSendTransformer | BeforeBatchTransformer): void {
    if (typeof fn !== 'function') {
      throw new Error(`[TraceLog] Transformer must be a function, received: ${typeof fn}`);
    }

    this.transformers[hook] = fn as BeforeSendTransformer & BeforeBatchTransformer;
  }

  removeTransformer(hook: TransformerHook): void {
    delete this.transformers[hook];
  }

  getTransformer(hook: 'beforeSend'): BeforeSendTransformer | undefined;
  getTransformer(hook: 'beforeBatch'): BeforeBatchTransformer | undefined;
  getTransformer(hook: TransformerHook): BeforeSendTransformer | BeforeBatchTransformer | undefined {
    return this.transformers[hook];
  }

  destroy(force = false): void {
    if (!this.isInitialized && !force) {
      return;
    }

    this.integrations.google?.cleanup();

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

    this.managers.event?.stop();
    this.managers.consent?.cleanup();

    this.emitter.removeAllListeners();
    this.transformers.beforeSend = undefined;
    this.transformers.beforeBatch = undefined;

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
    const googleConfig = config.integrations?.google;

    if (googleConfig) {
      const hasMeasurementId = Boolean(googleConfig.measurementId?.trim());
      const hasContainerId = Boolean(googleConfig.containerId?.trim());

      if (hasMeasurementId || hasContainerId) {
        // Check consent before initializing Google Analytics
        const shouldInitializeGoogle = this.shouldInitializeIntegration('google');

        if (shouldInitializeGoogle) {
          try {
            this.integrations.google = new GoogleAnalyticsIntegration();
            await this.integrations.google.initialize();
            log('debug', 'Google Analytics integration initialized');
          } catch (error) {
            this.integrations.google = undefined;
            log('warn', 'Failed to initialize Google Analytics', { error });
          }
        } else {
          log('info', 'Google Analytics initialization deferred, waiting for consent');
        }
      }
    }
  }

  /**
   * Get consent manager instance (for api.ts)
   */
  public getConsentManager(): ConsentManager | undefined {
    return this.managers.consent;
  }

  /**
   * Get config (for api.ts)
   */
  public getConfig(): Config {
    return this.get('config');
  }

  /**
   * Get collect API URLs (for api.ts)
   */
  public getCollectApiUrls() {
    return this.get('collectApiUrls');
  }

  /**
   * Get event manager (for api.ts)
   */
  public getEventManager(): EventManager | undefined {
    return this.managers.event;
  }

  /**
   * Handle consent granted for an integration (orchestrates initialization and buffer flush)
   * This is the public method called from api.ts when consent is granted
   */
  public async handleConsentGranted(integration: 'google' | 'custom' | 'tracelog'): Promise<void> {
    log('info', `Consent granted for ${integration}, initializing and flushing buffer`);

    // Initialize the integration if not already initialized
    await this.initializeIntegration(integration);

    // Flush consent buffer for this integration
    if (this.managers.event) {
      await this.managers.event.flushConsentBuffer(integration);
    }
  }

  /**
   * Initialize a specific integration (called when consent is granted)
   */
  private async initializeIntegration(integration: 'google' | 'custom' | 'tracelog'): Promise<void> {
    if (integration === 'google') {
      const config = this.get('config');
      const googleConfig = config.integrations?.google;

      if (googleConfig && !this.integrations.google) {
        const hasMeasurementId = Boolean(googleConfig.measurementId?.trim());
        const hasContainerId = Boolean(googleConfig.containerId?.trim());

        if (hasMeasurementId || hasContainerId) {
          try {
            this.integrations.google = new GoogleAnalyticsIntegration();
            await this.integrations.google.initialize();

            // Update reference in EventManager so it can send events to Google
            if (this.managers.event) {
              this.managers.event.setGoogleAnalyticsIntegration(this.integrations.google);
            }

            log('info', 'Google Analytics integration initialized after consent');
          } catch (error) {
            this.integrations.google = undefined;
            log('warn', 'Failed to initialize Google Analytics after consent', { error });
          }
        }
      }
    }

    // Custom and TraceLog integrations are handled by EventManager/SenderManager
    // They don't need explicit initialization here
  }

  /**
   * Check if an integration should be initialized based on consent
   */
  private shouldInitializeIntegration(integration: 'google' | 'custom' | 'tracelog'): boolean {
    const config = this.get('config');

    // If waitForConsent is not enabled, always initialize
    if (!config?.waitForConsent) {
      return true;
    }

    // Check if we have consent
    const consentManager = this.managers.consent;
    if (!consentManager) {
      return true; // Fail open if consent manager not available
    }

    return consentManager.hasConsent(integration);
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
