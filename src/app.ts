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
  EmitterEvent,
  ConsentState,
  Mode,
  TransformerHook,
  TransformerMap,
  BeforeSendTransformer,
  BeforeBatchTransformer,
  MetadataType,
} from './types';
import { GoogleAnalyticsIntegration } from './integrations/google-analytics.integration';
import {
  isEventValid,
  getDeviceType,
  normalizeUrl,
  Emitter,
  getCollectApiUrls,
  detectQaMode,
  log,
  isValidMetadata,
} from './utils';
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

  /**
   * Initializes TraceLog with configuration.
   *
   * @param config - Configuration object
   * @throws {Error} If initialization fails
   * @internal Called from api.init()
   */
  async init(config: Config = {}): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.managers.storage = new StorageManager();

    try {
      this.setupState(config);

      this.managers.consent = new ConsentManager(this.managers.storage, true, this.emitter);

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

      this.emitter.on(EmitterEvent.CONSENT_CHANGED, (consentState: ConsentState) => {
        if (!this.managers.event || !this.managers.consent) {
          return;
        }

        const integrations: Array<'google' | 'custom' | 'tracelog'> = ['google', 'custom', 'tracelog'];

        void Promise.all(
          integrations
            .filter((integration) => consentState[integration] === true)
            .map(async (integration) => this.managers.event!.flushConsentBuffer(integration)),
        ).catch((error) => {
          log('error', 'Failed to flush consent buffer after consent granted', { error });
        });

        if (consentState.google && this.integrations.google) {
          this.integrations.google.syncConsentToGoogle('google', consentState.google);
        }
      });

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

  /**
   * Sends a custom event with optional metadata.
   *
   * @param name - Event name
   * @param metadata - Optional metadata
   * @internal Called from api.event()
   */
  sendCustomEvent(name: string, metadata?: Record<string, unknown> | Record<string, unknown>[]): void {
    if (!this.managers.event) {
      log('warn', 'Cannot send custom event: TraceLog not initialized', { data: { name } });
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

  /**
   * Destroys the TraceLog instance and cleans up all resources.
   *
   * @param force - If true, forces cleanup even if not initialized (used during init failure)
   * @internal Called from api.destroy()
   */
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
    this.managers = {};
    this.integrations = {};
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
    if (!this.hasValidGoogleConfig()) {
      return;
    }

    if (this.shouldInitializeIntegration('google')) {
      await this.initializeGoogleAnalytics();
    } else {
      log('info', 'Google Analytics initialization deferred, waiting for consent');
    }
  }

  /**
   * Returns the ConsentManager instance for consent state management.
   *
   * @returns The ConsentManager instance, or undefined if not initialized
   * @internal Used by api.ts for consent operations
   */
  public getConsentManager(): ConsentManager | undefined {
    return this.managers.consent;
  }

  /**
   * Returns the current configuration object.
   *
   * @returns The Config object passed to init()
   * @internal Used by api.ts for configuration access
   */
  public getConfig(): Config {
    return this.get('config');
  }

  /**
   * Returns the configured backend API URLs for event collection.
   *
   * @returns Object containing optional saas and custom API URLs
   * @internal Used by api.ts for backend URL access
   */
  public getCollectApiUrls(): { saas?: string; custom?: string } {
    return this.get('collectApiUrls');
  }

  /**
   * Returns the EventManager instance for event tracking operations.
   *
   * @returns The EventManager instance, or undefined if not initialized
   * @internal Used by api.ts for event operations
   */
  public getEventManager(): EventManager | undefined {
    return this.managers.event;
  }

  /**
   * Handles consent granted for a specific integration by initializing the integration (if needed)
   * and flushing buffered events.
   *
   * @param integration - The integration name ('google', 'custom', or 'tracelog')
   * @returns Promise that resolves when initialization and buffer flush complete
   * @internal Called from api.setConsent() when consent is granted
   */
  public async handleConsentGranted(integration: 'google' | 'custom' | 'tracelog'): Promise<void> {
    log('info', `Consent granted for ${integration}, initializing and flushing buffer`);

    if (integration === 'google' && !this.integrations.google && this.hasValidGoogleConfig()) {
      const initialized = await this.initializeGoogleAnalytics();

      if (initialized && this.managers.event && this.integrations.google) {
        this.managers.event.setGoogleAnalyticsIntegration(this.integrations.google);
      }
    }

    if (this.managers.event) {
      await this.managers.event.flushConsentBuffer(integration);
    }
  }

  /**
   * Validates metadata object structure and values.
   *
   * @param metadata - The metadata object to validate
   * @returns Validation result with error message if invalid
   * @internal Helper for updateGlobalMetadata and mergeGlobalMetadata
   */
  private validateGlobalMetadata(metadata: Record<string, unknown>): { valid: boolean; error?: string } {
    if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata)) {
      return {
        valid: false,
        error: 'Global metadata must be a plain object',
      };
    }

    const validation = isValidMetadata('Global', metadata, 'globalMetadata');

    if (!validation.valid) {
      return {
        valid: false,
        error: validation.error,
      };
    }

    return { valid: true };
  }

  /**
   * Replaces global metadata with new values.
   *
   * @param metadata - New global metadata object
   * @throws {Error} If metadata validation fails
   * @internal Called from api.updateGlobalMetadata()
   */
  public updateGlobalMetadata(metadata: Record<string, unknown>): void {
    const validation = this.validateGlobalMetadata(metadata);

    if (!validation.valid) {
      throw new Error(`[TraceLog] Invalid global metadata: ${validation.error}`);
    }

    const currentConfig = this.get('config');

    const updatedConfig: Config = {
      ...currentConfig,
      globalMetadata: metadata as Record<string, MetadataType>,
    };

    this.set('config', updatedConfig);

    log('debug', 'Global metadata updated (replaced)', { data: { keys: Object.keys(metadata) } });
  }

  /**
   * Merges new metadata with existing global metadata.
   *
   * @param metadata - Metadata to merge with existing values
   * @throws {Error} If metadata validation fails
   * @internal Called from api.mergeGlobalMetadata()
   */
  public mergeGlobalMetadata(metadata: Record<string, unknown>): void {
    const validation = this.validateGlobalMetadata(metadata);

    if (!validation.valid) {
      throw new Error(`[TraceLog] Invalid global metadata: ${validation.error}`);
    }

    const currentConfig = this.get('config');
    const existingMetadata = currentConfig.globalMetadata ?? {};

    const mergedMetadata: Record<string, MetadataType> = {
      ...existingMetadata,
      ...(metadata as Record<string, MetadataType>),
    };

    const updatedConfig: Config = {
      ...currentConfig,
      globalMetadata: mergedMetadata,
    };

    this.set('config', updatedConfig);

    log('debug', 'Global metadata updated (merged)', { data: { keys: Object.keys(metadata) } });
  }

  private hasValidGoogleConfig(): boolean {
    const googleConfig = this.get('config').integrations?.google;
    if (!googleConfig) {
      return false;
    }

    const hasMeasurementId = Boolean(googleConfig.measurementId?.trim());
    const hasContainerId = Boolean(googleConfig.containerId?.trim());

    return hasMeasurementId || hasContainerId;
  }

  private async initializeGoogleAnalytics(): Promise<boolean> {
    try {
      this.integrations.google = new GoogleAnalyticsIntegration();
      await this.integrations.google.initialize();
      log('debug', 'Google Analytics integration initialized');
      return true;
    } catch (error) {
      log('warn', 'Failed to initialize Google Analytics', { error });
      return false;
    }
  }

  private shouldInitializeIntegration(integration: 'google' | 'custom' | 'tracelog'): boolean {
    const config = this.get('config');

    if (!config.waitForConsent) {
      return true;
    }

    return this.managers.consent?.hasConsent(integration) ?? true;
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
