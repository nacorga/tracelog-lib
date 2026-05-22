import { EventManager } from './managers/event.manager';
import { UserManager } from './managers/user.manager';
import { StateManager } from './managers/state.manager';
import { SessionHandler } from './handlers/session.handler';
import { PageViewHandler } from './handlers/page-view.handler';
import { ClickHandler } from './handlers/click.handler';
import { ScrollHandler } from './handlers/scroll.handler';
import { ShopifyCartLinker } from './ecommerce';
import {
  Config,
  EventType,
  EmitterCallback,
  EmitterEvent,
  EmitterMap,
  EventOptions,
  IdentifyData,
  Mode,
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
  private pageShowHandler: ((event: PageTransitionEvent) => void) | null = null;
  private visibilityFlushHandler: (() => void) | null = null;

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

  private integrationInstances: {
    shopifyCartLinker?: ShopifyCartLinker;
  } = {};

  get initialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Initializes TraceLog with configuration.
   *
   * @internal Called from api.init()
   */
  async init(config: Config = {}): Promise<InitResult> {
    if (this.isInitialized) {
      return { sessionId: this.get('sessionId') ?? '' };
    }

    this.managers.storage = new StorageManager();

    try {
      this.setupState(config);

      this.managers.event = new EventManager(this.managers.storage, this.emitter);

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
   * Sends a custom event with optional metadata and options.
   *
   * @internal Called from api.event()
   */
  sendCustomEvent(
    name: string,
    metadata?: Record<string, unknown> | Record<string, unknown>[],
    options?: EventOptions,
  ): void {
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

    if (options?.critical === true) {
      const ok = this.managers.event.flushImmediatelySync();
      if (!ok) {
        log('debug', 'Critical event flush returned false (deferred to in-flight send or empty queue)', {
          data: { name },
        });
      }
    }
  }

  on<K extends keyof EmitterMap>(event: K, callback: EmitterCallback<EmitterMap[K]>): void {
    this.emitter.on(event, callback);
  }

  off<K extends keyof EmitterMap>(event: K, callback: EmitterCallback<EmitterMap[K]>): void {
    this.emitter.off(event, callback);
  }

  /**
   * Destroys the TraceLog instance and cleans up all resources.
   *
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

    if (this.pageShowHandler) {
      window.removeEventListener('pageshow', this.pageShowHandler);
      this.pageShowHandler = null;
    }

    if (this.visibilityFlushHandler) {
      document.removeEventListener('visibilitychange', this.visibilityFlushHandler);
      this.visibilityFlushHandler = null;
    }

    this.managers.event?.flushImmediatelySync();
    this.managers.event?.stop();

    this.emitter.removeAllListeners();

    this.set('suppressNextScroll', false);
    this.set('sessionId', null);
    this.set('identity', undefined);
    this.clearPersistedIdentity();

    this.integrationInstances.shopifyCartLinker?.deactivate();
    this.integrationInstances = {};

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
   * @internal Used by api.ts for configuration access
   */
  public getConfig(): Config {
    return this.get('config');
  }

  /**
   * @internal Used by api.ts for backend URL access
   */
  public getCollectApiUrls(): { saas?: string } {
    return this.get('collectApiUrls');
  }

  /**
   * @internal Used by api.ts for event operations
   */
  public getEventManager(): EventManager | undefined {
    return this.managers.event;
  }

  /**
   * @internal Used by api.getSessionId()
   */
  public getSessionId(): string | null {
    return this.get('sessionId');
  }

  /**
   * @internal Used by api.getUserId()
   */
  public getUserId(): string | null {
    return this.get('userId');
  }

  /**
   * Associates the current anonymous visitor with a known user identity.
   *
   * Identity is persisted to localStorage (project-scoped) and included in every
   * subsequent batch payload so the backend always has the latest identity.
   *
   * @param userId - External user identifier (email, customer_id, etc.). Trimmed; max 256 chars.
   * @param traits - Optional user attributes (name, email, plan, etc.). Only string values
   *   are kept; non-string fields, arrays, and null are dropped silently.
   *
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
   * Clears identity, regenerates UUID, and starts a fresh session.
   *
   * Use for logout flows: the previous visitor profile remains in the backend,
   * and the next user in the same browser gets a clean anonymous profile.
   *
   * Pending events are flushed under the OLD identity first via async fetch
   * (so any in-flight authentication headers are preserved). Then the identity
   * is cleared, the userId is regenerated, and the session handler is
   * restarted to emit a new `SESSION_START`.
   *
   * @internal Called from api.resetIdentity()
   */
  public async resetIdentity(): Promise<void> {
    await this.managers.event?.flushImmediately().catch((error) => {
      log('debug', 'Failed to flush before identity reset', { error });
      return false;
    });

    this.set('identity', undefined);
    this.clearPersistedIdentity();

    const newUserId = generateUUID();
    (this.managers.storage as StorageManager).setItem(USER_ID_KEY, newUserId);
    this.set('userId', newUserId);

    this.set('hasStartSession', false);
    this.set('sessionId', null);
    this.handlers.session?.stopTracking();
    this.handlers.session?.startTracking();

    log('debug', 'Identity reset, new UUID generated');
  }

  /**
   * Returns the project ID used for identity storage scoping.
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

    try {
      const pendingRaw = storage.getItem(PENDING_IDENTITY_KEY);
      if (pendingRaw) {
        const pending = JSON.parse(pendingRaw) as IdentifyData;
        storage.removeItem(PENDING_IDENTITY_KEY);

        if (!this.isValidIdentityData(pending)) {
          log('debug', 'Invalid pending identity in localStorage, discarded');
          return;
        }

        const normalizedPending = this.normalizePersistedIdentity(pending);
        storage.setItem(projectKey, JSON.stringify(normalizedPending));
        this.set('identity', normalizedPending);
        log('debug', 'Migrated pending identity to project-scoped key');
        return;
      }
    } catch {
      storage.removeItem(PENDING_IDENTITY_KEY);
    }

    try {
      const raw = storage.getItem(projectKey);
      if (raw) {
        const identity = JSON.parse(raw) as IdentifyData;

        if (!this.isValidIdentityData(identity)) {
          storage.removeItem(projectKey);
          log('debug', 'Invalid persisted identity in localStorage, discarded');
          return;
        }

        const normalizedIdentity = this.normalizePersistedIdentity(identity);
        this.set('identity', normalizedIdentity);
        log('debug', 'Loaded persisted identity');
      }
    } catch {
      log('debug', 'Failed to load persisted identity');
    }
  }

  /**
   * Validates identity data loaded from localStorage. `traits` is intentionally
   * accepted as `unknown` here: `normalizePersistedIdentity()` runs it through
   * `sanitizeTraits()` so tampered values are dropped silently instead of
   * rejecting an otherwise-valid identity.
   */
  private isValidIdentityData(data: unknown): data is IdentifyData {
    if (!data || typeof data !== 'object') return false;
    const { userId } = data as Record<string, unknown>;

    if (typeof userId !== 'string' || userId.trim().length === 0 || userId.trim().length > 256) return false;

    return true;
  }

  /**
   * Trims the `userId` and re-sanitizes `traits` through the same gate
   * `identify()` uses at call time, defending later batches against tampered
   * localStorage values.
   */
  private normalizePersistedIdentity(identity: IdentifyData): IdentifyData {
    const validTraits = sanitizeTraits(identity.traits);
    return {
      userId: identity.userId.trim(),
      ...(validTraits ? { traits: validTraits } : {}),
    };
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

    this.pageShowHandler = (event: PageTransitionEvent): void => {
      if (event.persisted) {
        void this.managers.event?.recoverPersistedEvents().catch((error) => {
          log('warn', 'Failed to recover persisted events on bfcache restore', { error });
        });
      }
    };

    this.visibilityFlushHandler = (): void => {
      if (typeof document === 'undefined' || !document.hidden) {
        return;
      }
      if (this.get('config').flushOnPageHidden === false) {
        return;
      }
      this.managers.event?.flushImmediatelySync();
    };

    window.addEventListener('pagehide', this.pageUnloadHandler);
    window.addEventListener('beforeunload', this.pageUnloadHandler);
    window.addEventListener('pageshow', this.pageShowHandler);
    document.addEventListener('visibilitychange', this.visibilityFlushHandler);
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

    this.handlers.error = new ErrorHandler(this.managers.event as EventManager, this.emitter);
    this.handlers.error.startTracking();

    if (config.integrations?.tracelog?.shopify) {
      const linker = new ShopifyCartLinker();
      linker.activate();
      this.integrationInstances.shopifyCartLinker = linker;

      this.emitter.on(EmitterEvent.EVENT, (event) => {
        if (event.type === EventType.SESSION_START) {
          linker.onSessionChange();
        }
      });
    }
  }
}
