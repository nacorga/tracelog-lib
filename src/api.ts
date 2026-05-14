import { App } from './app';
import { MetadataType, IdentifyData, Config, EmitterCallback, EmitterMap, InitResult, EventOptions } from './types';
import { log, validateAndNormalizeConfig, sanitizeTraits } from './utils';
import { INITIALIZATION_TIMEOUT_MS } from './constants';
import { PENDING_IDENTITY_KEY } from './constants/storage.constants';
import './types/window.types';

interface PendingListener {
  event: keyof EmitterMap;
  callback: EmitterCallback<EmitterMap[keyof EmitterMap]>;
}

const pendingListeners: PendingListener[] = [];

let app: App | null = null;
let isInitializing = false;
let isDestroying = false;
let initPromise: Promise<InitResult> | null = null;

/**
 * Initializes TraceLog and begins tracking user interactions.
 *
 * Important: Register listeners with on() before calling init() to capture initial events.
 *
 * @param config - Optional configuration object
 * @returns Promise with sessionId (empty string in SSR/disabled environments)
 * @throws {Error} If initialization fails or times out
 *
 * @example
 * ```typescript
 * const { sessionId } = await tracelog.init({
 *   integrations: {
 *     tracelog: { projectId: 'your-project-id' }
 *   }
 * });
 * console.log('Session:', sessionId);
 * ```
 */
export const init = async (config?: Config): Promise<InitResult> => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { sessionId: '' };
  }

  isDestroying = false;

  if (window.__traceLogDisabled === true) {
    return { sessionId: '' };
  }

  if (app) {
    return { sessionId: app.getSessionId() ?? '' };
  }

  if (isInitializing && initPromise) {
    return initPromise;
  }

  isInitializing = true;

  initPromise = (async (): Promise<InitResult> => {
    try {
      const validatedConfig = validateAndNormalizeConfig(config ?? {});
      const instance = new App();

      try {
        pendingListeners.forEach(({ event, callback }) => {
          instance.on(event, callback);
        });

        pendingListeners.length = 0;

        const appInitPromise = instance.init(validatedConfig);

        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`[TraceLog] Initialization timeout after ${INITIALIZATION_TIMEOUT_MS}ms`));
          }, INITIALIZATION_TIMEOUT_MS);
        });

        const result = await Promise.race([appInitPromise, timeoutPromise]);

        app = instance;

        return result;
      } catch (error) {
        try {
          instance.destroy(true);
        } catch (cleanupError) {
          log('error', 'Failed to cleanup partially initialized app', { error: cleanupError });
        }

        throw error;
      }
    } catch (error) {
      app = null;
      throw error;
    } finally {
      isInitializing = false;
      initPromise = null;
    }
  })();

  return initPromise;
};

/**
 * Tracks a custom analytics event with optional metadata.
 *
 * @param name - Event identifier (e.g., 'checkout_completed')
 * @param metadata - Optional event data (object or array of objects)
 * @param options - Optional event options. Pass `{ critical: true }` for
 *   high-value events that must survive an imminent page unload (e.g., a
 *   purchase tracked right before `window.location.href = '/thanks'`).
 *   Critical events flush via `sendBeacon`, which the browser guarantees
 *   to queue for delivery even if the page closes immediately after.
 * @throws {Error} If called before init() or during destroy()
 *
 * @example
 * ```typescript
 * tracelog.event('product_viewed', { productId: 'abc-123', price: 299.99 });
 *
 * // Critical event (e.g., right before redirecting to a thank-you page)
 * tracelog.event('purchase_completed', { orderId: 'ord-789' }, { critical: true });
 * window.location.href = '/thanks';
 * ```
 */
export const event = (
  name: string,
  metadata?: Record<string, MetadataType> | Record<string, MetadataType>[],
  options?: EventOptions,
): void => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  if (!app) {
    throw new Error('[TraceLog] TraceLog not initialized. Please call init() first.');
  }

  if (isDestroying) {
    throw new Error('[TraceLog] Cannot send events while TraceLog is being destroyed');
  }

  app.sendCustomEvent(name, metadata, options);
};

/**
 * Subscribes to TraceLog events for real-time consumption.
 *
 * Important: Register listeners BEFORE calling init() to capture SESSION_START and PAGE_VIEW.
 *
 * @param event - Event type ('event' or 'queue')
 * @param callback - Handler function called when event fires
 *
 * @example
 * ```typescript
 * tracelog.on('event', (event) => console.log(event.type));
 * await tracelog.init();
 * ```
 */
export const on = <K extends keyof EmitterMap>(event: K, callback: EmitterCallback<EmitterMap[K]>): void => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  if (!app || isInitializing) {
    pendingListeners.push({ event, callback } as PendingListener);
    return;
  }

  app.on(event, callback);
};

/**
 * Unsubscribes from TraceLog events.
 *
 * @param event - Event type to unsubscribe from
 * @param callback - Exact callback function reference used in on()
 */
export const off = <K extends keyof EmitterMap>(event: K, callback: EmitterCallback<EmitterMap[K]>): void => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  if (!app) {
    const index = pendingListeners.findIndex((l) => l.event === event && l.callback === callback);
    if (index !== -1) {
      pendingListeners.splice(index, 1);
    }
    return;
  }

  app.off(event, callback);
};

/**
 * Checks if TraceLog is currently initialized.
 */
export const isInitialized = (): boolean => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  return app !== null;
};

/**
 * Returns the current session ID.
 *
 * Session ID is generated during init() and persists across page refreshes
 * within the session timeout window (default 15 minutes).
 *
 * @returns Session ID string, or null if not initialized
 */
export const getSessionId = (): string | null => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  if (!app) {
    return null;
  }

  return app.getSessionId();
};

/**
 * Returns the current user ID, or null if `init()` has not been called yet.
 */
export const getUserId = (): string | null => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  if (!app) {
    return null;
  }

  return app.getUserId();
};

/**
 * Stops all tracking, cleans up listeners, and flushes pending events.
 *
 * Sends remaining events with sendBeacon before cleanup.
 *
 * @throws {Error} If destroy operation is already in progress
 */
export const destroy = (): void => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  if (isDestroying) {
    throw new Error('[TraceLog] Destroy operation already in progress');
  }

  if (!app) {
    isDestroying = false;

    return;
  }

  isDestroying = true;

  try {
    app.destroy();
    app = null;
    isInitializing = false;
    initPromise = null;
    pendingListeners.length = 0;

    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && window.__traceLogBridge) {
      window.__traceLogBridge = undefined;
    }

    isDestroying = false;
  } catch (error) {
    app = null;
    isInitializing = false;
    initPromise = null;

    pendingListeners.length = 0;

    isDestroying = false;

    log('warn', 'Error during destroy, forced cleanup completed', { error });
  }
};

/**
 * Associates the current anonymous visitor with a known user identity.
 *
 * Can be called before or after init(). If called before init(), the identity is
 * persisted to localStorage and applied automatically when init() runs.
 *
 * Identity is included in every event batch (piggyback), so the backend always
 * receives the latest identity. Calling identify() multiple times overwrites
 * (last-write-wins).
 *
 * @param userId - External user identifier (email, customer_id, etc.). Max 256 chars.
 * @param traits - Optional user attributes (name, email, plan, etc.). Only string
 *   values are kept; non-string fields, arrays, and null are dropped silently.
 *
 * @example
 * ```typescript
 * // After login, with traits
 * tracelog.identify('cust_123', { name: 'Maria Garcia', plan: 'pro' });
 *
 * // Before init (identity queued, applied on init)
 * tracelog.identify('cust_123');
 * await tracelog.init({ integrations: { tracelog: { projectId: '...' } } });
 * ```
 */
export const identify = (userId: string, traits?: Record<string, string>): void => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    log('warn', 'identify() called with invalid userId');
    return;
  }

  if (userId.trim().length > 256) {
    log('warn', 'identify() userId exceeds 256 characters');
    return;
  }

  if (isDestroying) {
    log('warn', 'Cannot identify while TraceLog is being destroyed');
    return;
  }

  if (app) {
    app.identify(userId, traits);
    return;
  }

  try {
    const validTraits = sanitizeTraits(traits);
    const identity: IdentifyData = {
      userId: userId.trim(),
      ...(validTraits ? { traits: validTraits } : {}),
    };
    localStorage.setItem(PENDING_IDENTITY_KEY, JSON.stringify(identity));
    log('debug', 'Identity persisted pre-init (will be applied on init)');
  } catch {
    log('debug', 'Failed to persist pre-init identity');
  }
};

/**
 * Clears identity, regenerates the visitor UUID, and starts a new session.
 *
 * Use for logout flows. The previous visitor profile remains intact in the
 * backend; the next user in the same browser gets a clean anonymous profile.
 *
 * Pending events are flushed under the OLD identity first via async fetch
 * (so any in-flight authentication headers are preserved), then the identity
 * is cleared, a fresh `user_id` is generated, and a new `SESSION_START` is
 * emitted.
 *
 * Safe to call before init(): clears any pending pre-init identity silently.
 *
 * @throws {Error} If called during destroy()
 *
 * @example
 * ```typescript
 * // On logout
 * await tracelog.resetIdentity();
 * ```
 */
export const resetIdentity = async (): Promise<void> => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  if (!app) {
    try {
      localStorage.removeItem(PENDING_IDENTITY_KEY);
    } catch {
      // Silent — storage may be disabled or full
    }
    return;
  }

  if (isDestroying) {
    throw new Error('[TraceLog] Cannot reset identity while TraceLog is being destroyed');
  }

  await app.resetIdentity();
};

/**
 * @internal TestBridge API - development only
 */
export const __setAppInstance = (instance: App | null): void => {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  if (instance !== null) {
    const hasRequiredMethods =
      typeof instance === 'object' &&
      'init' in instance &&
      'destroy' in instance &&
      'on' in instance &&
      'off' in instance;

    if (!hasRequiredMethods) {
      throw new Error('[TraceLog] Invalid app instance type');
    }
  }

  if (app !== null && instance !== null && app !== instance) {
    throw new Error('[TraceLog] Cannot overwrite existing app instance. Call destroy() first.');
  }

  app = instance;
};

/**
 * @internal TestBridge state accessors - development only
 */
export const __getInitState = (): { isInitializing: boolean; isDestroying: boolean } => {
  if (process.env.NODE_ENV !== 'development') {
    return { isInitializing: false, isDestroying: false };
  }
  return { isInitializing, isDestroying };
};

if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && typeof document !== 'undefined') {
  void import('./test-bridge')
    .then((module) => {
      if (typeof module.injectTestBridge === 'function') {
        module.injectTestBridge();
      }
    })
    .catch(() => {
      // Silent fail - TestBridge is optional in test environments
    });

  void import('./utils/browser/mode.utils')
    .then((module) => {
      if (typeof module.detectQaMode === 'function') {
        module.detectQaMode();
      }
    })
    .catch(() => {
      // Silent fail - mode detection is optional
    });
}
