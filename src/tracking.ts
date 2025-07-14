import { ConfigManager, SessionManager, EventManager, TrackingManager, DataSender, UrlManager } from './modules';
import { AppConfig, EventType, MetadataType, EventHandler, AdminError, DeviceType } from './types';

enum InitializationState {
  UNINITIALIZED = 'uninitialized',
  INITIALIZING = 'initializing',
  INITIALIZED = 'initialized',
  FAILED = 'failed',
}

const createCleanupHandler = (tracker: Tracking): (() => void) => {
  return () => {
    if (tracker.isInitialized) {
      tracker.cleanup();
    }
  };
};

export class Tracking {
  public isInitialized = false;
  public isExcludedUser = false;

  private readonly initializationPromise: Promise<void> | null = null;

  private cleanupListeners: (() => void)[] = [];
  private initializationState: InitializationState = InitializationState.UNINITIALIZED;
  private configManager!: ConfigManager;
  private sessionManager!: SessionManager;
  private eventManager!: EventManager;
  private trackingManager!: TrackingManager;
  private dataSender!: DataSender;
  private urlManager!: UrlManager;

  constructor(id: string, config?: AppConfig) {
    this.initializationPromise = this.initializeTracking(id, config);
  }

  private async initializeTracking(id: string, config?: AppConfig): Promise<void> {
    if (this.initializationState !== InitializationState.UNINITIALIZED) {
      return this.initializationPromise || Promise.resolve();
    }

    this.initializationState = InitializationState.INITIALIZING;

    try {
      this.configManager = new ConfigManager(this.catchError.bind(this));

      const mergedConfig = await this.configManager.loadConfig(id, config || {});
      const apiUrl = this.configManager.isDemoMode() ? 'demo' : this.configManager.getApiUrl();

      if (!apiUrl) {
        throw new Error('Failed to get API URL');
      }

      this.dataSender = new DataSender(
        apiUrl,
        () => mergedConfig.qaMode || false,
        () => this.sessionManager?.getUserId() || '',
        this.configManager.isDemoMode(),
      );

      this.sessionManager = new SessionManager(
        mergedConfig,
        this.handleSessionEvent.bind(this),
        () => mergedConfig.qaMode || false,
      );

      this.eventManager = new EventManager(
        mergedConfig,
        () => this.sessionManager.getUserId(),
        () => this.sessionManager.getSessionId(),
        () => this.sessionManager.getDevice(),
        () => this.sessionManager.getGlobalMetadata(),
        this.dataSender.sendEventsQueue.bind(this.dataSender),
        this.catchError.bind(this),
        () => mergedConfig.qaMode || false,
        () => !this.sessionManager.isSampledUser(),
        (url: string) => this.urlManager?.isRouteExcluded(url) || false,
      );

      this.urlManager = new UrlManager(mergedConfig, this.handlePageViewEvent.bind(this), () =>
        this.trackingManager?.suppressNextScrollEvent(),
      );

      this.trackingManager = new TrackingManager(
        mergedConfig,
        this.handleTrackingEvent.bind(this),
        this.handleInactivity.bind(this),
      );

      await this.startInitializationSequence();

      this.isExcludedUser = !this.sessionManager.isSampledUser();
      this.isInitialized = true;
      this.initializationState = InitializationState.INITIALIZED;

      if (this.isQaModeSync()) {
        console.log('[TraceLog] Initialization completed successfully');
      }
    } catch (error) {
      this.initializationState = InitializationState.FAILED;
      console.error('[TraceLog] Initialization error:', error);
      throw error;
    }
  }

  private async startInitializationSequence(): Promise<void> {
    try {
      await this.dataSender.recoverPersistedEvents();

      const hadUnexpectedEnd = this.sessionManager.checkForUnexpectedSessionEnd();

      if (hadUnexpectedEnd) {
        this.handleSessionEvent(EventType.SESSION_END, 'unexpected_recovery');
      }

      this.sessionManager.startSession();
      this.urlManager.initialize();
      this.trackingManager.initScrollTracking();
      this.trackingManager.initInactivityTracking();
      this.trackingManager.initClickTracking();
      this.setupCleanupListeners();
    } catch (error) {
      console.error('[TraceLog] Initialization sequence failed:', error);
      throw error;
    }
  }

  private setupCleanupListeners(): void {
    const cleanup = createCleanupHandler(this);

    const beforeUnloadCleanup = (): void => {
      this.sessionManager?.setPageUnloading(true);
      cleanup();
    };

    const pageHideCleanup = (): void => {
      this.sessionManager?.setPageUnloading(true);
      cleanup();
    };

    const unloadCleanup = (): void => {
      this.sessionManager?.setPageUnloading(true);
      cleanup();
    };

    const visibilityChangeCleanup = (): void => {
      if (document.visibilityState === 'hidden') {
        this.handleInactivity(true);
        this.forceImmediateSend();
      } else {
        this.handleInactivity(false);
      }
    };

    window.addEventListener('beforeunload', beforeUnloadCleanup);
    window.addEventListener('pagehide', pageHideCleanup);
    window.addEventListener('unload', unloadCleanup);
    document.addEventListener('visibilitychange', visibilityChangeCleanup);

    this.cleanupListeners.push(
      () => window.removeEventListener('beforeunload', beforeUnloadCleanup),
      () => window.removeEventListener('pagehide', pageHideCleanup),
      () => window.removeEventListener('unload', unloadCleanup),
      () => document.removeEventListener('visibilitychange', visibilityChangeCleanup),
    );
  }

  private handleSessionEvent(eventType: EventType, trigger?: string): void {
    this.eventManager.handleEvent({
      evType: eventType,
      url: this.urlManager?.getCurrentUrl(),
      ...(trigger && { trigger }),
    });
  }

  private handlePageViewEvent(fromUrl: string, toUrl: string, referrer?: string, utm?: any): void {
    this.eventManager.handleEvent({
      evType: EventType.PAGE_VIEW,
      url: toUrl,
      fromUrl,
      ...(referrer && { referrer }),
      ...(utm && { utm }),
    });
  }

  private handleTrackingEvent(event: EventHandler): void {
    this.eventManager.handleEvent(event);
  }

  private isQaModeSync(): boolean {
    return this.configManager?.getConfig()?.qaMode || false;
  }

  private async handleInactivity(isInactive: boolean): Promise<void> {
    if (isInactive) {
      this.sessionManager.handleInactivity(true);
    } else {
      this.sessionManager.handleInactivity(false);
    }
  }

  private async catchError(error: { message: string; api_key?: string }): Promise<void> {
    const adminError: AdminError = {
      message: error.message,
      timestamp: Date.now(),
      userAgent: typeof navigator === 'undefined' ? 'unknown' : navigator.userAgent,
      url: typeof window === 'undefined' ? 'unknown' : window.location.href,
      api_key: error.api_key,
      severity: 'medium',
      context: 'tracking',
    };

    if (this.dataSender) {
      await this.dataSender.sendError(adminError);
    } else if (this.isQaModeSync()) {
      console.error('[TraceLog] Error before DataSender init:', adminError);
    }
  }

  async sendCustomEvent(name: string, metadata?: Record<string, MetadataType>): Promise<void> {
    await this.waitForInitialization();

    if (!this.isInitialized || this.isExcludedUser) {
      return;
    }

    this.eventManager.sendCustomEvent(name, metadata);
  }

  async startSession(): Promise<void> {
    await this.waitForInitialization();

    if (!this.isInitialized) {
      return;
    }

    this.sessionManager.startSession();
  }

  async endSession(): Promise<void> {
    await this.waitForInitialization();

    if (!this.isInitialized) {
      return;
    }

    this.sessionManager.endSession('manual');
  }

  async getSessionId(): Promise<string> {
    await this.waitForInitialization();

    if (!this.isInitialized) {
      return '';
    }

    return this.sessionManager?.getSessionId() || '';
  }

  async getUserId(): Promise<string> {
    await this.waitForInitialization();

    if (!this.isInitialized) {
      return '';
    }

    return this.sessionManager?.getUserId() || '';
  }

  async forceImmediateSend(): Promise<void> {
    await this.waitForInitialization();

    if (!this.isInitialized) {
      return;
    }

    const events = this.eventManager.getEventsQueue();

    if (events.length > 0) {
      const finalBatch = {
        user_id: this.sessionManager.getUserId(),
        session_id: this.sessionManager.getSessionId() || '',
        device: this.sessionManager.getDevice() || DeviceType.Desktop,
        events: events,
        ...(this.sessionManager.getGlobalMetadata() && { global_metadata: this.sessionManager.getGlobalMetadata() }),
      };

      await this.dataSender.sendEventsSynchronously(finalBatch);
      this.eventManager.clearEventsQueue();
    }
  }

  async suppressNextScrollEvent(): Promise<void> {
    await this.waitForInitialization();

    if (!this.isInitialized) {
      return;
    }

    this.trackingManager.suppressNextScrollEvent();
  }

  async updateUrl(url: string): Promise<void> {
    await this.waitForInitialization();

    if (!this.isInitialized) {
      return;
    }

    this.urlManager.updateUrl(url);
  }

  async getConfig(): Promise<AppConfig | undefined> {
    await this.waitForInitialization();
    return this.configManager?.getConfig();
  }

  async isQaMode(): Promise<boolean> {
    await this.waitForInitialization();
    return this.configManager?.getConfig()?.qaMode || false;
  }

  cleanup(): void {
    if (!this.isInitialized) {
      return;
    }

    try {
      this.sessionManager?.endSession('page_unload');
      this.forceImmediateSendSync();
      this.trackingManager?.cleanup();
      this.sessionManager?.cleanup();
      this.eventManager?.cleanup();
      this.dataSender?.cleanup();

      for (const cleanup of this.cleanupListeners) {
        try {
          cleanup();
        } catch (error) {
          if (this.isQaModeSync()) {
            console.error('[TraceLog] Error removing event listener:', error);
          }
        }
      }

      this.cleanupListeners = [];
      this.isInitialized = false;
      this.isExcludedUser = false;

      if (this.isQaModeSync()) {
        console.log('[TraceLog] Cleanup completed');
      }
    } catch (error) {
      if (this.isQaModeSync()) {
        console.error('[TraceLog] Cleanup error:', error);
      }
    }
  }

  private forceImmediateSendSync(): void {
    if (!this.isInitialized) {
      return;
    }

    const events = this.eventManager.getEventsQueue();

    if (events.length > 0) {
      const finalBatch = {
        user_id: this.sessionManager.getUserId(),
        session_id: this.sessionManager.getSessionId() || '',
        device: this.sessionManager.getDevice() || DeviceType.Desktop,
        events: events,
        ...(this.sessionManager.getGlobalMetadata() && { global_metadata: this.sessionManager.getGlobalMetadata() }),
      };

      this.dataSender.sendEventsSynchronously(finalBatch);
      this.eventManager.clearEventsQueue();
    }
  }

  private async waitForInitialization(): Promise<void> {
    if (this.initializationState === InitializationState.INITIALIZED) {
      return;
    }

    if (this.initializationState === InitializationState.FAILED) {
      throw new Error('[TraceLog] Initialization failed, cannot perform operation');
    }

    if (this.initializationState === InitializationState.INITIALIZING && this.initializationPromise) {
      try {
        await this.initializationPromise;
      } catch {
        throw new Error('[TraceLog] Initialization failed during wait');
      }
    }

    if (this.initializationState === InitializationState.UNINITIALIZED) {
      throw new Error('[TraceLog] Not initialized');
    }
  }
}
