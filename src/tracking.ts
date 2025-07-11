import { ConfigManager } from './modules/config-manager';
import { SessionManager } from './modules/session-manager';
import { EventManager } from './modules/event-manager';
import { TrackingManager } from './modules/tracking-manager';
import { DataSender } from './modules/data-sender';
import { UrlManager } from './modules/url-manager';
import { TracelogAppConfig, TracelogEventHandler, MetadataType, EventType, TracelogAdminError } from './types';
import { DeviceType } from './constants';

// Helper function moved to module scope for consistent scoping
const createCleanupHandler = (tracker: Tracking): (() => void) => {
  return () => {
    if (tracker.isInitialized) {
      tracker.cleanup();
    }
  };
};

enum InitializationState {
  UNINITIALIZED = 'uninitialized',
  INITIALIZING = 'initializing',
  INITIALIZED = 'initialized',
  FAILED = 'failed',
}

export class Tracking {
  public isInitialized = false;
  public isExcludedUser = false;

  private cleanupListeners: (() => void)[] = [];
  private initializationState: InitializationState = InitializationState.UNINITIALIZED;
  private readonly initializationPromise: Promise<void> | null = null;
  private configManager!: ConfigManager;
  private sessionManager!: SessionManager;
  private eventManager!: EventManager;
  private trackingManager!: TrackingManager;
  private dataSender!: DataSender;
  private urlManager!: UrlManager;

  constructor(id: string, config?: TracelogAppConfig) {
    this.initializationPromise = this.initializeTracking(id, config);
  }

  private async initializeTracking(id: string, config?: TracelogAppConfig): Promise<void> {
    // Prevent multiple initialization attempts
    if (this.initializationState !== InitializationState.UNINITIALIZED) {
      return this.initializationPromise || Promise.resolve();
    }

    this.initializationState = InitializationState.INITIALIZING;

    try {
      // 1. Initialize ConfigManager
      this.configManager = new ConfigManager(this.catchError.bind(this));

      // 2. Load configuration (local + remote) - await to prevent race conditions
      const mergedConfig = await this.configManager.loadConfig(id, config || {});

      // 3. Initialize DataSender
      const apiUrl = this.configManager.getApiUrl();
      if (!apiUrl) {
        throw new Error('Failed to get API URL');
      }

      this.dataSender = new DataSender(
        apiUrl,
        () => mergedConfig.qaMode || false,
        () => this.sessionManager?.getUserId() || '',
      );

      // 4. Initialize SessionManager
      this.sessionManager = new SessionManager(
        mergedConfig,
        this.handleSessionEvent.bind(this),
        () => mergedConfig.qaMode || false,
      );

      // 5. Initialize EventManager
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

      // 6. Initialize UrlManager
      this.urlManager = new UrlManager(mergedConfig, this.handlePageViewEvent.bind(this));

      // 7. Initialize TrackingManager
      this.trackingManager = new TrackingManager(
        mergedConfig,
        this.handleTrackingEvent.bind(this),
        this.handleInactivity.bind(this),
      );

      // 8. Start initialization sequence - await to prevent race conditions
      await this.startInitializationSequence();

      // 9. Set flags atomically
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
    // Execute in sequence to prevent race conditions
    try {
      // 1. Recover any persisted events from previous sessions
      await this.dataSender.recoverPersistedEvents();

      // 2. Check for unexpected session end from previous session
      const hadUnexpectedEnd = this.sessionManager.checkForUnexpectedSessionEnd();
      if (hadUnexpectedEnd) {
        // Send the missed SESSION_END event
        this.handleSessionEvent(EventType.SESSION_END, 'unexpected_recovery');
      }

      // 3. Start new session
      this.sessionManager.startSession();

      // 4. Initialize URL tracking (will send initial PAGE_VIEW)
      this.urlManager.initialize();

      // 5. Initialize tracking systems
      this.trackingManager.initScrollTracking();
      this.trackingManager.initInactivityTracking();
      this.trackingManager.initClickTracking();

      // 6. Setup cleanup on page unload
      this.setupCleanupListeners();
    } catch (error) {
      console.error('[TraceLog] Initialization sequence failed:', error);
      throw error;
    }
  }

  private setupCleanupListeners(): void {
    const cleanup = createCleanupHandler(this);

    // Create cleanup function for beforeunload
    const beforeUnloadCleanup = (): void => {
      cleanup();
    };

    // Create cleanup function for pagehide
    const pageHideCleanup = (): void => {
      cleanup();
    };

    // Create cleanup function for unload
    const unloadCleanup = (): void => {
      cleanup();
    };

    // Create cleanup function for visibility change
    const visibilityChangeCleanup = (): void => {
      if (document.visibilityState === 'hidden') {
        this.forceImmediateSend();
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', beforeUnloadCleanup);
    window.addEventListener('pagehide', pageHideCleanup);
    window.addEventListener('unload', unloadCleanup);
    document.addEventListener('visibilitychange', visibilityChangeCleanup);

    // Store cleanup functions
    this.cleanupListeners.push(
      () => window.removeEventListener('beforeunload', beforeUnloadCleanup),
      () => window.removeEventListener('pagehide', pageHideCleanup),
      () => window.removeEventListener('unload', unloadCleanup),
      () => document.removeEventListener('visibilitychange', visibilityChangeCleanup),
    );
  }

  // Event handlers
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

  private handleTrackingEvent(event: TracelogEventHandler): void {
    this.eventManager.handleEvent(event);
  }

  // Private sync methods for internal use
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
    const adminError: TracelogAdminError = {
      message: error.message,
      timestamp: Date.now(),
      userAgent: typeof navigator === 'undefined' ? 'unknown' : navigator.userAgent,
      url: typeof window === 'undefined' ? 'unknown' : window.location.href,
      api_key: error.api_key,
      severity: 'medium',
      context: 'tracking',
    };
    await this.dataSender.sendError(adminError);
  }

  // Public API methods with race condition protection
  async sendCustomEvent(name: string, metadata?: Record<string, MetadataType>): Promise<void> {
    await this.waitForInitialization();

    if (!this.isInitialized || this.isExcludedUser) {
      return;
    }

    this.eventManager.sendCustomEvent(name, metadata);
  }

  // Session management methods with race condition protection
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

  // Utility methods with race condition protection
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

  // Data sending methods with race condition protection
  async forceImmediateSend(): Promise<void> {
    await this.waitForInitialization();

    if (!this.isInitialized) {
      return;
    }

    // Create final batch with any remaining events
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

  // Advanced methods with race condition protection
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

  // Configuration access with race condition protection
  async getConfig() {
    await this.waitForInitialization();
    return this.configManager?.getConfig();
  }

  async isQaMode(): Promise<boolean> {
    await this.waitForInitialization();
    return this.configManager?.getConfig()?.qaMode || false;
  }

  // Cleanup
  cleanup(): void {
    if (!this.isInitialized) {
      return;
    }

    try {
      // 1. End current session
      this.sessionManager?.endSession('page_unload');

      // 2. Send any remaining events synchronously
      this.forceImmediateSendSync();

      // 3. Cleanup tracking systems
      this.trackingManager?.cleanup();

      // 4. Cleanup session system
      this.sessionManager?.cleanup();

      // 5. Clear any timers
      this.eventManager?.cleanup();

      // 6. Clear data sender
      this.dataSender?.cleanup();

      // 7. Remove all event listeners
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

      // 8. Reset state
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

  // Sync version for cleanup
  private forceImmediateSendSync(): void {
    if (!this.isInitialized) {
      return;
    }

    // Create final batch with any remaining events
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

  // Helper method to wait for initialization
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
