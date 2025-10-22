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

  /**
   * Initializes TraceLog application with configuration.
   *
   * **Initialization flow:**
   * 1. Create StorageManager (localStorage/sessionStorage wrapper with fallback)
   * 2. Setup state (config, userId, device, pageUrl, mode detection)
   * 3. Initialize ConsentManager (loads persisted consent from localStorage, enables emitter)
   * 4. Log consent state if waitForConsent enabled
   * 5. Setup integrations (Google Analytics if configured and consented, or deferred)
   * 6. Initialize EventManager (receives transformers, creates SenderManager instances)
   * 7. Initialize handlers (Session, PageView, Click, Scroll, Performance, Error, Viewport)
   * 8. Recover persisted events from localStorage (non-fatal errors logged)
   * 9. Set isInitialized flag
   *
   * **Deferred Integration Initialization:**
   * - If `waitForConsent: true` and consent not granted, integrations are not initialized
   * - When consent is later granted via `setConsent()`, integrations initialize via `handleConsentGranted()`
   *
   * **Transformers:**
   * - Transformers stored in `App.transformers` are passed to EventManager constructor
   * - EventManager applies transformers during event processing
   *
   * **Error Handling:**
   * - If initialization fails, calls `destroy(true)` for cleanup (force=true bypasses isInitialized check)
   * - Event recovery errors are non-fatal (logged but don't prevent initialization)
   *
   * @param config - Configuration object
   * @throws {Error} If initialization fails
   * @internal This method is called from api.init() - users should use the API wrapper
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
   * **Features:**
   * - Validates event name and metadata structure
   * - Sanitizes metadata (PII protection)
   * - Normalizes DOMStringMap and similar objects to plain objects
   * - In QA mode: throws validation errors, logs to console (not sent to backend)
   * - In normal mode: silently drops invalid events
   *
   * @param name - Event name identifier
   * @param metadata - Optional metadata (flat key-value pairs or array of objects)
   * @internal This method is called from api.event() - users should use the API wrapper
   */
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

  /**
   * Destroys the TraceLog instance and cleans up all resources.
   *
   * **Cleanup sequence:**
   * 1. Stop all handlers (sends SESSION_END event)
   * 2. Flush remaining events via EventManager.stop()
   * 3. Clear timers and intervals
   * 4. Remove all event listeners (emitter, consent, integrations)
   * 5. Reset global state flags
   *
   * **Force Parameter:**
   * @param force - If true, forces cleanup even if not initialized
   *
   * **Use Cases for `force=true`:**
   * - **Init Failure**: When `init()` fails partway through, some managers may be initialized
   *   but `isInitialized` flag is still false. Force cleanup ensures proper resource cleanup.
   * - **Example**: `init()` → creates StorageManager → error occurs → `destroy(true)` called
   *   in catch block to cleanup partially initialized state
   *
   * **Normal Usage:**
   * - Users call `api.destroy()` which calls `app.destroy()` (force=false by default)
   * - Only triggers cleanup if `isInitialized === true`
   *
   * @internal This method is called from api.destroy() - users should use the API wrapper
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

  /**
   * Sets up configured integrations (Google Analytics, etc.)
   *
   * **Consent-Aware Initialization:**
   * - If `waitForConsent: true`, checks consent before initializing integrations
   * - If consent not granted, initialization is **deferred**
   * - Deferred integrations initialize later when consent is granted via `handleConsentGranted()`
   *
   * **Google Analytics Integration:**
   * - Requires either `measurementId` or `containerId` configuration
   * - Checks `shouldInitializeIntegration('google')` before initialization
   * - If deferred, logs "Google Analytics initialization deferred, waiting for consent"
   * - Later initialization happens when user calls `setConsent('google', true)` or `setConsent('all', true)`
   *
   * @private
   */
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
   * Get consent manager instance.
   *
   * @returns ConsentManager instance or undefined if not initialized
   * @internal Used by api.ts for consent operations
   */
  public getConsentManager(): ConsentManager | undefined {
    return this.managers.consent;
  }

  /**
   * Get current configuration.
   *
   * @returns Configuration object
   * @internal Used by api.ts for config access
   */
  public getConfig(): Config {
    return this.get('config');
  }

  /**
   * Get configured API URLs for integrations.
   *
   * @returns Object with saas and/or custom API URLs
   * @internal Used by api.ts for integration checks
   */
  public getCollectApiUrls() {
    return this.get('collectApiUrls');
  }

  /**
   * Get event manager instance.
   *
   * @returns EventManager instance or undefined if not initialized
   * @internal Used by api.ts for consent buffer operations
   */
  public getEventManager(): EventManager | undefined {
    return this.managers.event;
  }

  /**
   * Handles consent granted for an integration.
   *
   * **Orchestration:**
   * 1. Initialize the integration if not already initialized (deferred initialization)
   * 2. Flush consent buffer for this integration (sends buffered events)
   *
   * **Deferred Initialization Flow:**
   * - If integration was deferred during `init()` due to missing consent
   * - This method initializes it when user grants consent via `setConsent()`
   * - For Google Analytics: Creates integration, initializes, and updates EventManager reference
   * - For Custom/TraceLog: Handled by EventManager/SenderManager (no explicit initialization needed)
   *
   * @param integration - Integration identifier
   * @internal Called from api.setConsent() when consent is granted
   */
  public async handleConsentGranted(integration: 'google' | 'custom' | 'tracelog'): Promise<void> {
    log('info', `Consent granted for ${integration}, initializing and flushing buffer`);

    await this.initializeIntegration(integration);

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
            // Note: Buffered events are flushed by caller (handleConsentGranted)
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
