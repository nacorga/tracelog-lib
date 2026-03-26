import { EventManager } from './managers/event.manager';
import { UserManager } from './managers/user.manager';
import { StateManager } from './managers/state.manager';
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
  IdentifyData,
  Mode,
  TransformerHook,
  TransformerMap,
  BeforeSendTransformer,
  BeforeBatchTransformer,
  MetadataType,
  CustomHeadersProvider,
  InitResult,
} from './types';
import {
  isEventValid,
  getDeviceInfo,
  normalizeUrl,
  Emitter,
  getCollectApiUrls,
  detectQaMode,
  log,
  isValidMetadata,
  generateUUID,
  sanitizeTraits,
} from './utils';
import { StorageManager } from './managers/storage.manager';
import { SCROLL_DEBOUNCE_TIME_MS, SCROLL_SUPPRESS_MULTIPLIER } from './constants/config.constants';
import { IDENTITY_KEY, PENDING_IDENTITY_KEY, USER_ID_KEY } from './constants/storage.constants';
import { PerformanceHandler } from './handlers/performance.handler';
import { ErrorHandler } from './handlers/error.handler';

export class App extends StateManager {
  private isInitialized = false;
  private suppressNextScrollTimer: number | null = null;
  private pageUnloadHandler: (() => void) | null = null;

  private readonly emitter = new Emitter();
  private readonly transformers: TransformerMap = {};
  private customHeadersProvider?: CustomHeadersProvider;

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
  async init(config: Config = {}): Promise<InitResult> {
    if (this.isInitialized) {
      return { sessionId: this.get('sessionId') ?? '' };
    }

    this.managers.storage = new StorageManager();

    try {
      this.setupState(config);

      // Extract static headers and fetchCredentials from custom integration config
      const staticHeaders = config.integrations?.custom?.headers ?? {};
      const fetchCredentials = config.integrations?.custom?.fetchCredentials ?? 'include';

      this.managers.event = new EventManager(
        this.managers.storage,
        this.emitter,
        this.transformers,
        staticHeaders,
        this.customHeadersProvider,
        fetchCredentials,
      );

      this.loadPersistedIdentity();

      this.initializeHandlers();
      this.setupPageLifecycleListeners();

      await this.managers.event.recoverPersistedEvents().catch((error) => {
        log('warn', 'Failed to recover persisted events', { error });
      });

      this.isInitialized = true;

      return { sessionId: this.get('sessionId') ?? '' };
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

      log('warn', `Custom event "${name}" dropped: ${error}`);
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
   * Sets a callback to provide custom HTTP headers for requests to custom backends.
   * Only applies to custom backend integration (not TraceLog SaaS).
   *
   * @param provider - Callback function that returns custom headers
   * @throws {Error} If provider is not a function
   * @internal Called from api.setCustomHeaders()
   */
  setCustomHeaders(provider: CustomHeadersProvider): void {
    if (typeof provider !== 'function') {
      throw new Error(`[TraceLog] Custom headers provider must be a function, received: ${typeof provider}`);
    }

    this.customHeadersProvider = provider;

    // Update EventManager if already initialized
    if (this.managers.event) {
      this.managers.event.setCustomHeadersProvider(provider);
    }
  }

  /**
   * Removes the custom headers provider callback.
   *
   * @internal Called from api.removeCustomHeaders()
   */
  removeCustomHeaders(): void {
    this.customHeadersProvider = undefined;

    // Update EventManager if already initialized
    if (this.managers.event) {
      this.managers.event.removeCustomHeadersProvider();
    }
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

    if (this.pageUnloadHandler) {
      window.removeEventListener('pagehide', this.pageUnloadHandler);
      window.removeEventListener('beforeunload', this.pageUnloadHandler);
      this.pageUnloadHandler = null;
    }

    this.managers.event?.flushImmediatelySync();
    this.managers.event?.stop();

    this.emitter.removeAllListeners();
    this.transformers.beforeSend = undefined;
    this.transformers.beforeBatch = undefined;
    this.customHeadersProvider = undefined;

    this.set('suppressNextScroll', false);
    this.set('sessionId', null);
    this.set('identity', undefined);
    this.clearPersistedIdentity();

    this.isInitialized = false;
    this.handlers = {};
    this.managers = {};
  }

  private setupState(config: Config = {}): void {
    this.set('config', config);

    const userId = UserManager.getId(this.managers.storage as StorageManager);
    this.set('userId', userId);

    const collectApiUrls = getCollectApiUrls(config);
    this.set('collectApiUrls', collectApiUrls);

    const device = getDeviceInfo();
    this.set('device', device);

    const pageUrl = normalizeUrl(window.location.href, config.sensitiveQueryParams);
    this.set('pageUrl', pageUrl);

    const isQaMode = detectQaMode();

    if (isQaMode) {
      this.set('mode', Mode.QA);
    }
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
   * Returns the current session ID.
   *
   * @returns The session ID string, or null if not yet initialized
   * @internal Used by api.getSessionId()
   */
  public getSessionId(): string | null {
    return this.get('sessionId');
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

  /**
   * Associates the current anonymous visitor with a known user identity.
   *
   * Identity is persisted to localStorage (project-scoped) and included in every
   * subsequent batch payload so the backend always has the latest identity.
   *
   * Validation is duplicated here (also in api.ts) as defense-in-depth since
   * TestBridge and internal callers bypass the API layer.
   *
   * @param userId - External user identifier (email, customer_id, etc.)
   * @param traits - Optional user attributes (name, email, plan, etc.)
   * @internal Called from api.identify()
   */
  public identify(userId: string, traits?: Record<string, string>): void {
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      log('warn', 'identify() called with invalid userId', {
        data: { type: typeof userId, length: typeof userId === 'string' ? userId.trim().length : 0 },
      });
      return;
    }

    if (userId.trim().length > 256) {
      log('warn', 'identify() userId exceeds 256 characters', { data: { length: userId.trim().length } });
      return;
    }

    const trimmedUserId = userId.trim();
    const validTraits = sanitizeTraits(traits);
    const identity: IdentifyData = {
      userId: trimmedUserId,
      ...(validTraits ? { traits: validTraits } : {}),
    };

    this.set('identity', identity);
    this.persistIdentity(identity);

    log('debug', 'Visitor identified', {
      data: { userIdLength: trimmedUserId.length, traitKeys: validTraits ? Object.keys(validTraits) : [] },
    });
  }

  /**
   * Clears identity, regenerates UUID, and starts a new session.
   *
   * Used for logout flows. The previous visitor profile with its identity
   * remains in MongoDB — this method ensures the next user in the same browser
   * gets a fresh anonymous profile.
   *
   * @internal Called from api.resetIdentity()
   */
  public async resetIdentity(): Promise<void> {
    // 1. Flush pending events with the OLD identity before clearing anything
    // Uses async flush (fetch) instead of sync (sendBeacon) to preserve custom headers
    await this.managers.event?.flushImmediately();

    // 2. Clear identity from state and storage
    this.set('identity', undefined);
    this.clearPersistedIdentity();

    // 3. Regenerate UUID — closes the old visitor profile
    const newUserId = generateUUID();
    (this.managers.storage as StorageManager).setItem(USER_ID_KEY, newUserId);
    this.set('userId', newUserId);

    // 4. Trigger new session with the new UUID
    this.set('hasStartSession', false);
    this.set('sessionId', null);
    this.handlers.session?.stopTracking();
    this.handlers.session?.startTracking();

    log('debug', 'Identity reset, new UUID generated');
  }

  /**
   * Returns the project ID used for identity storage scoping.
   * Matches the same logic used by SessionHandler.
   */
  private getProjectId(): string {
    const config = this.get('config');
    return config?.integrations?.tracelog?.projectId ?? 'custom';
  }

  /**
   * Persists identity to localStorage under the project-scoped key.
   */
  private persistIdentity(identity: IdentifyData): void {
    try {
      const projectId = this.getProjectId();
      const key = IDENTITY_KEY(projectId);
      (this.managers.storage as StorageManager).setItem(key, JSON.stringify(identity));
    } catch {
      log('debug', 'Failed to persist identity to localStorage');
    }
  }

  /**
   * Loads identity from localStorage on init.
   * Also migrates pending identity (set before init) to the project-scoped key.
   */
  private loadPersistedIdentity(): void {
    const storage = this.managers.storage as StorageManager;
    const projectId = this.getProjectId();
    const projectKey = IDENTITY_KEY(projectId);

    // Check for pending identity (set before init)
    try {
      const pendingRaw = storage.getItem(PENDING_IDENTITY_KEY);
      if (pendingRaw) {
        const pending = JSON.parse(pendingRaw) as IdentifyData;
        storage.removeItem(PENDING_IDENTITY_KEY);

        if (!this.isValidIdentityData(pending)) {
          log('debug', 'Invalid pending identity in localStorage, discarded');
          return;
        }

        const normalizedPending: IdentifyData = { ...pending, userId: pending.userId.trim() };
        storage.setItem(projectKey, JSON.stringify(normalizedPending));
        this.set('identity', normalizedPending);
        log('debug', 'Migrated pending identity to project-scoped key');
        return;
      }
    } catch {
      storage.removeItem(PENDING_IDENTITY_KEY);
    }

    // Load from project-scoped key
    try {
      const raw = storage.getItem(projectKey);
      if (raw) {
        const identity = JSON.parse(raw) as IdentifyData;

        if (!this.isValidIdentityData(identity)) {
          storage.removeItem(projectKey);
          log('debug', 'Invalid persisted identity in localStorage, discarded');
          return;
        }

        const normalizedIdentity: IdentifyData = { ...identity, userId: identity.userId.trim() };
        this.set('identity', normalizedIdentity);
        log('debug', 'Loaded persisted identity');
      }
    } catch {
      log('debug', 'Failed to load persisted identity');
    }
  }

  /**
   * Validates identity data loaded from localStorage.
   * Guards against tampered or corrupted localStorage values.
   */
  private isValidIdentityData(data: unknown): data is IdentifyData {
    if (!data || typeof data !== 'object') return false;
    const { userId, traits } = data as Record<string, unknown>;

    if (typeof userId !== 'string' || userId.trim().length === 0 || userId.trim().length > 256) return false;

    if (traits !== undefined) {
      if (typeof traits !== 'object' || traits === null || Array.isArray(traits)) return false;
      for (const value of Object.values(traits as Record<string, unknown>)) {
        if (typeof value !== 'string') return false;
      }
    }

    return true;
  }

  /**
   * Clears persisted identity from localStorage.
   */
  private clearPersistedIdentity(): void {
    try {
      const storage = this.managers.storage as StorageManager;
      const projectId = this.getProjectId();
      storage.removeItem(IDENTITY_KEY(projectId));
      storage.removeItem(PENDING_IDENTITY_KEY);
    } catch {
      log('debug', 'Failed to clear persisted identity');
    }
  }

  private setupPageLifecycleListeners(): void {
    this.pageUnloadHandler = (): void => {
      this.managers.event?.flushImmediatelySync();
    };
    window.addEventListener('pagehide', this.pageUnloadHandler);
    window.addEventListener('beforeunload', this.pageUnloadHandler);
  }

  private initializeHandlers(): void {
    const config = this.get('config');

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

    this.handlers.scroll = new ScrollHandler(this.managers.event as EventManager);
    this.handlers.scroll.startTracking();

    this.handlers.performance = new PerformanceHandler(this.managers.event as EventManager);
    this.handlers.performance.startTracking().catch((error) => {
      log('warn', 'Failed to start performance tracking', { error });
    });

    this.handlers.error = new ErrorHandler(this.managers.event as EventManager);
    this.handlers.error.startTracking();

    if (config.viewport) {
      this.handlers.viewport = new ViewportHandler(this.managers.event as EventManager);
      this.handlers.viewport.startTracking();
    }
  }
}
