import { App } from './app';
import {
  MetadataType,
  Config,
  EmitterCallback,
  EmitterMap,
  TransformerHook,
  BeforeSendTransformer,
  BeforeBatchTransformer,
  ConsentIntegration,
  ConsentState,
  PendingConsent,
} from './types';
import { log, validateAndNormalizeConfig, setQaMode as setQaModeUtil, loadConsentFromStorage } from './utils';
import { INITIALIZATION_TIMEOUT_MS } from './constants';
import './types/window.types';

interface PendingListener {
  event: keyof EmitterMap;
  callback: EmitterCallback<EmitterMap[keyof EmitterMap]>;
}

interface PendingTransformer {
  hook: TransformerHook;
  fn: BeforeSendTransformer | BeforeBatchTransformer;
}

const pendingListeners: PendingListener[] = [];
const pendingTransformers: PendingTransformer[] = [];
const pendingConsents: PendingConsent[] = [];

let app: App | null = null;
let isInitializing = false;
let isDestroying = false;
let isDestroyed = false;

/**
 * Initializes TraceLog and begins tracking user interactions.
 *
 * Important: Register listeners with on() before calling init() to capture initial events.
 *
 * @param config - Optional configuration object
 * @returns Promise that resolves when initialization completes (5s timeout)
 * @throws {Error} If initialization fails or times out
 *
 * @example
 * ```typescript
 * await tracelog.init({
 *   integrations: {
 *     tracelog: { projectId: 'your-project-id' }
 *   }
 * });
 * ```
 *
 * @see {@link https://github.com/tracelog/tracelog-lib/blob/main/API_REFERENCE.md#init} for configuration options
 */
export const init = async (config?: Config): Promise<void> => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  isDestroyed = false;
  isDestroying = false;

  if (window.__traceLogDisabled === true) {
    return;
  }

  if (app) {
    return;
  }

  if (isInitializing) {
    return;
  }

  isInitializing = true;

  try {
    const validatedConfig = validateAndNormalizeConfig(config ?? {});
    const instance = new App();

    try {
      pendingListeners.forEach(({ event, callback }) => {
        instance.on(event, callback);
      });

      pendingListeners.length = 0;

      pendingTransformers.forEach(({ hook, fn }) => {
        if (hook === 'beforeSend') {
          instance.setTransformer('beforeSend', fn as BeforeSendTransformer);
        } else {
          instance.setTransformer('beforeBatch', fn as BeforeBatchTransformer);
        }
      });

      pendingTransformers.length = 0;

      const initPromise = instance.init(validatedConfig);

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`[TraceLog] Initialization timeout after ${INITIALIZATION_TIMEOUT_MS}ms`));
        }, INITIALIZATION_TIMEOUT_MS);
      });

      await Promise.race([initPromise, timeoutPromise]);

      app = instance;

      if (pendingConsents.length > 0) {
        const consents = [...pendingConsents];

        pendingConsents.length = 0;

        for (const { integration, granted } of consents) {
          try {
            await setConsent(integration, granted);
          } catch (error) {
            log('warn', `Failed to apply pending consent for ${integration}`, { error });
          }
        }
      }
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
  }
};

/**
 * Tracks a custom analytics event with optional metadata.
 *
 * @param name - Event identifier (e.g., 'checkout_completed')
 * @param metadata - Optional event data (object or array of objects)
 * @throws {Error} If called before init() or during destroy()
 *
 * @example
 * ```typescript
 * tracelog.event('product_viewed', {
 *   productId: 'abc-123',
 *   price: 299.99
 * });
 * ```
 *
 * @see {@link https://github.com/tracelog/tracelog-lib/blob/main/API_REFERENCE.md#event} for rate limiting details
 */
export const event = (name: string, metadata?: Record<string, MetadataType> | Record<string, MetadataType>[]): void => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  if (!app) {
    throw new Error('[TraceLog] TraceLog not initialized. Please call init() first.');
  }

  if (isDestroying) {
    throw new Error('[TraceLog] Cannot send events while TraceLog is being destroyed');
  }

  app.sendCustomEvent(name, metadata);
};

/**
 * Subscribes to TraceLog events for real-time consumption.
 *
 * Important: Register listeners BEFORE calling init() to capture SESSION_START and PAGE_VIEW.
 *
 * @param event - Event type ('event', 'queue', or 'consent-changed')
 * @param callback - Handler function called when event fires
 *
 * @example
 * ```typescript
 * tracelog.on('event', (event) => console.log(event.type));
 * await tracelog.init();
 * ```
 *
 * @see {@link https://github.com/tracelog/tracelog-lib#event-listeners} for timing details
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
 *
 * @example
 * ```typescript
 * const handler = (event) => console.log(event.type);
 * tracelog.on('event', handler);
 * tracelog.off('event', handler);
 * ```
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
 * Transforms events at runtime before sending to custom backend.
 *
 * Note: Only applies to custom backend integration. TraceLog SaaS ignores transformers.
 *
 * @param hook - 'beforeSend' (per-event) or 'beforeBatch' (batch-level)
 * @param fn - Transformer function. Return null to filter event/batch.
 * @throws {Error} If called during destroy()
 * @throws {Error} If fn is not a function
 *
 * @example
 * ```typescript
 * tracelog.setTransformer('beforeSend', (data) => {
 *   if ('type' in data) {
 *     return { ...data, appVersion: '1.0.0' };
 *   }
 *   return data;
 * });
 * ```
 *
 * @see {@link https://github.com/tracelog/tracelog-lib/blob/main/API_REFERENCE.md#settransformer} for integration behavior
 */
export function setTransformer(hook: 'beforeSend', fn: BeforeSendTransformer): void;
export function setTransformer(hook: 'beforeBatch', fn: BeforeBatchTransformer): void;
export function setTransformer(hook: TransformerHook, fn: BeforeSendTransformer | BeforeBatchTransformer): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  if (typeof fn !== 'function') {
    throw new Error(`[TraceLog] Transformer must be a function, received: ${typeof fn}`);
  }

  if (!app || isInitializing) {
    const existingIndex = pendingTransformers.findIndex((t) => t.hook === hook);

    if (existingIndex !== -1) {
      pendingTransformers.splice(existingIndex, 1);
    }

    pendingTransformers.push({ hook, fn });

    return;
  }

  if (isDestroying) {
    throw new Error('[TraceLog] Cannot set transformers while TraceLog is being destroyed');
  }

  if (hook === 'beforeSend') {
    app.setTransformer('beforeSend', fn as BeforeSendTransformer);
  } else {
    app.setTransformer('beforeBatch', fn as BeforeBatchTransformer);
  }
}

/**
 * Removes a previously set transformer function.
 *
 * @param hook - Transformer hook type to remove ('beforeSend' or 'beforeBatch')
 * @throws {Error} If called during destroy()
 *
 * @example
 * ```typescript
 * tracelog.removeTransformer('beforeSend');
 * ```
 */
export const removeTransformer = (hook: TransformerHook): void => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  if (!app) {
    const index = pendingTransformers.findIndex((t) => t.hook === hook);

    if (index !== -1) {
      pendingTransformers.splice(index, 1);
    }

    return;
  }

  if (isDestroying) {
    throw new Error('[TraceLog] Cannot remove transformers while TraceLog is being destroyed');
  }

  app.removeTransformer(hook);
};

/**
 * Checks if TraceLog is currently initialized.
 *
 * @returns true if initialized, false otherwise
 *
 * @example
 * ```typescript
 * if (tracelog.isInitialized()) {
 *   tracelog.event('app_ready');
 * }
 * ```
 */
export const isInitialized = (): boolean => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  return app !== null;
};

/**
 * Stops all tracking, cleans up listeners, and flushes pending events.
 *
 * Sends remaining events with sendBeacon before cleanup.
 *
 * @throws {Error} If destroy operation is already in progress
 *
 * @example
 * ```typescript
 * tracelog.destroy();
 * ```
 *
 * @see {@link https://github.com/tracelog/tracelog-lib/blob/main/API_REFERENCE.md#destroy} for usage patterns
 */
export const destroy = (): void => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  if (isDestroying) {
    throw new Error('[TraceLog] Destroy operation already in progress');
  }

  if (!app) {
    isDestroyed = false;
    isDestroying = false;

    return;
  }

  isDestroying = true;

  try {
    app.destroy();
    app = null;
    isInitializing = false;
    pendingListeners.length = 0;
    pendingTransformers.length = 0;
    pendingConsents.length = 0;

    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && window.__traceLogBridge) {
      window.__traceLogBridge = undefined;
    }

    isDestroyed = false;
    isDestroying = false;
  } catch (error) {
    app = null;
    isInitializing = false;

    pendingListeners.length = 0;
    pendingTransformers.length = 0;
    pendingConsents.length = 0;

    isDestroyed = false;
    isDestroying = false;

    log('warn', 'Error during destroy, forced cleanup completed', { error });
  }
};

/**
 * Grants or revokes consent for a specific integration or all integrations.
 *
 * Consent is persisted to localStorage and synced across tabs. Can be called before init().
 *
 * @param integration - Integration identifier ('google', 'custom', 'tracelog', or 'all')
 * @param granted - true to grant consent, false to revoke
 * @returns Promise that resolves when consent is applied
 * @throws {Error} If called during destroy()
 * @throws {Error} If localStorage persistence fails (before init only)
 *
 * @example
 * ```typescript
 * await tracelog.setConsent('google', true);
 * await tracelog.setConsent('all', false); // Revoke all
 * ```
 *
 * @see {@link https://github.com/tracelog/tracelog-lib/blob/main/API_REFERENCE.md#setconsent} for consent workflow
 */
export const setConsent = async (integration: ConsentIntegration, granted: boolean): Promise<void> => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  if (isDestroyed || isDestroying) {
    throw new Error('[TraceLog] Cannot set consent while TraceLog is destroyed or being destroyed');
  }

  if (!app || isInitializing) {
    if (integration === 'all') {
      const existingIndex = pendingConsents.findIndex((c) => c.integration === integration);

      if (existingIndex !== -1) {
        pendingConsents.splice(existingIndex, 1);
      }

      pendingConsents.push({ integration, granted });

      try {
        const { CONSENT_KEY, CONSENT_EXPIRY_DAYS } = await import('./constants/storage.constants');

        const now = Date.now();
        const expiresAt = now + CONSENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

        const consentData = {
          state: {
            google: granted,
            custom: granted,
            tracelog: granted,
          },
          timestamp: now,
          expiresAt,
        };

        localStorage.setItem(CONSENT_KEY, JSON.stringify(consentData));
      } catch (error) {
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          log('warn', 'localStorage quota exceeded, consent not persisted', { error });
          return;
        }

        log('error', 'Failed to persist consent for all integrations before init', { error });

        throw new Error(
          `[TraceLog] Failed to persist consent to localStorage: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      return;
    }

    try {
      const { CONSENT_KEY, CONSENT_EXPIRY_DAYS } = await import('./constants/storage.constants');

      const now = Date.now();
      const expiresAt = now + CONSENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      const existingRaw = localStorage.getItem(CONSENT_KEY);

      let existingState: Record<string, boolean> = {
        google: false,
        custom: false,
        tracelog: false,
      };

      if (existingRaw !== null && existingRaw.trim() !== '') {
        try {
          const existingData = JSON.parse(existingRaw) as { state?: Record<string, boolean> };
          if (existingData.state) {
            existingState = {
              google: Boolean(existingData.state.google),
              custom: Boolean(existingData.state.custom),
              tracelog: Boolean(existingData.state.tracelog),
            };
          }
        } catch {
          // Corrupted JSON, start fresh with defaults
        }
      }

      const consentData = {
        state: {
          ...existingState,
          [integration]: granted,
        },
        timestamp: now,
        expiresAt,
      };

      localStorage.setItem(CONSENT_KEY, JSON.stringify(consentData));
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        log('warn', 'localStorage quota exceeded, consent not persisted', { error });
        return;
      }

      log('error', 'Failed to persist consent before init', { error });

      throw new Error(
        `[TraceLog] Failed to persist consent to localStorage: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return;
  }

  const consentManager = app.getConsentManager();

  if (!consentManager) {
    log('warn', 'Consent manager not available');
    return;
  }

  if (integration === 'all') {
    const config = app.getConfig();
    const collectApiUrls = app.getCollectApiUrls();
    const integrations: ('google' | 'custom' | 'tracelog')[] = [];

    if (config.integrations?.google) {
      integrations.push('google');
    }

    if (collectApiUrls?.custom) {
      integrations.push('custom');
    }

    if (collectApiUrls?.saas) {
      integrations.push('tracelog');
    }

    for (const int of integrations) {
      await setConsent(int, granted);
    }

    return;
  }

  const hadConsent = consentManager.hasConsent(integration);

  consentManager.setConsent(integration, granted);

  if (granted && !hadConsent) {
    await app.handleConsentGranted(integration);
  }

  if (!granted && hadConsent) {
    log('info', `Consent revoked for ${integration}`);

    const eventManager = app.getEventManager();

    if (eventManager) {
      eventManager.clearConsentBufferForIntegration(integration);
    }
  }
};

/**
 * Checks if consent has been granted for a specific integration.
 *
 * Can be called before init() - reads directly from localStorage.
 *
 * @param integration - Integration identifier ('google', 'custom', 'tracelog', or 'all')
 * @returns true if consent granted, false otherwise
 *
 * @example
 * ```typescript
 * if (tracelog.hasConsent('google')) {
 *   tracelog.event('premium_feature');
 * }
 * ```
 */
export const hasConsent = (integration: ConsentIntegration): boolean => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  if (!app) {
    if (integration === 'all') {
      const state = loadConsentFromStorage();

      if (state === null) {
        return false;
      }

      return Boolean(state.google === true && state.custom === true && state.tracelog === true);
    }

    const state = loadConsentFromStorage();
    if (state === null) {
      return false;
    }

    return Boolean(state[integration] === true);
  }

  const consentManager = app.getConsentManager();

  if (consentManager === undefined) {
    return false;
  }

  return consentManager.hasConsent(integration);
};

/**
 * Retrieves the current consent state for all integrations.
 *
 * Can be called before init() - reads directly from localStorage.
 *
 * @returns Object with consent status (google, custom, tracelog)
 *
 * @example
 * ```typescript
 * const state = tracelog.getConsentState();
 * // { google: true, custom: false, tracelog: true }
 * ```
 *
 * @see {@link https://github.com/tracelog/tracelog-lib/blob/main/API_REFERENCE.md#getconsentstate} for examples
 */
export const getConsentState = (): ConsentState => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { google: false, custom: false, tracelog: false };
  }

  if (!app) {
    const state = loadConsentFromStorage();
    return state ?? { google: false, custom: false, tracelog: false };
  }

  const consentManager = app.getConsentManager();

  if (!consentManager) {
    return { google: false, custom: false, tracelog: false };
  }

  return consentManager.getConsentState();
};

/**
 * Enables or disables QA (Quality Assurance) mode for debugging.
 *
 * QA mode logs custom events to console instead of sending to backend.
 *
 * @param enabled - true to enable, false to disable
 *
 * @example
 * ```typescript
 * tracelog.setQaMode(true);
 * tracelog.event('test', { key: 'value' }); // Logged to console
 * ```
 *
 * @see {@link https://github.com/tracelog/tracelog-lib/blob/main/API_REFERENCE.md#setqamode} for URL activation
 */
export const setQaMode = (enabled: boolean): void => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  setQaModeUtil(enabled);
};

/**
 * Replaces all global metadata with new values.
 *
 * Global metadata is automatically appended to every event.
 *
 * @param metadata - New metadata object (replaces existing)
 * @throws {Error} If TraceLog not initialized
 * @throws {Error} If called during destroy()
 * @throws {Error} If validation fails (max 100 keys, 10KB limit)
 *
 * @example
 * ```typescript
 * tracelog.updateGlobalMetadata({ userId: 'user-123', plan: 'pro' });
 * // Replaces all existing metadata
 * ```
 *
 * @see {@link https://github.com/tracelog/tracelog-lib/blob/main/API_REFERENCE.md#updateglobalmetadata} for validation rules
 */
export const updateGlobalMetadata = (metadata: Record<string, MetadataType>): void => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  if (!app) {
    throw new Error('[TraceLog] TraceLog not initialized. Please call init() first.');
  }

  if (isDestroying) {
    throw new Error('[TraceLog] Cannot update metadata while TraceLog is being destroyed');
  }

  app.updateGlobalMetadata(metadata);
};

/**
 * Merges new metadata with existing global metadata (shallow merge).
 *
 * Global metadata is automatically appended to every event.
 *
 * @param metadata - Metadata to merge with existing values
 * @throws {Error} If TraceLog not initialized
 * @throws {Error} If called during destroy()
 * @throws {Error} If validation fails (max 100 keys, 10KB limit)
 *
 * @example
 * ```typescript
 * tracelog.mergeGlobalMetadata({ userId: 'user-123' });
 * // Preserves existing keys, adds/overwrites specified keys
 * ```
 *
 * @see {@link https://github.com/tracelog/tracelog-lib/blob/main/API_REFERENCE.md#mergeglobalmetadata} for validation rules
 */
export const mergeGlobalMetadata = (metadata: Record<string, MetadataType>): void => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  if (!app) {
    throw new Error('[TraceLog] TraceLog not initialized. Please call init() first.');
  }

  if (isDestroying) {
    throw new Error('[TraceLog] Cannot update metadata while TraceLog is being destroyed');
  }

  app.mergeGlobalMetadata(metadata);
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

  void import('./utils/browser/qa-mode.utils')
    .then((module) => {
      if (typeof module.detectQaMode === 'function') {
        module.detectQaMode();
      }
    })
    .catch(() => {
      // Silent fail - QA mode detection is optional
    });
}
