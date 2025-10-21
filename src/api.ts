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
import { TestBridge } from './test-bridge';
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

// Buffer for listeners registered before init()
const pendingListeners: PendingListener[] = [];

// Buffer for transformers registered before init()
const pendingTransformers: PendingTransformer[] = [];

// Buffer for consent operations registered before init()
const pendingConsents: PendingConsent[] = [];

let app: App | null = null;
let isInitializing = false;
let isDestroying = false;

export const init = async (config?: Config): Promise<void> => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

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

      // Apply pending 'all' consent operations (specific integrations already persisted)
      if (pendingConsents.length > 0) {
        const consents = [...pendingConsents];
        pendingConsents.length = 0;

        // Apply 'all' consents now that we know which integrations are configured
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

export const on = <K extends keyof EmitterMap>(event: K, callback: EmitterCallback<EmitterMap[K]>): void => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  if (!app || isInitializing) {
    // Buffer listeners registered before or during init()
    pendingListeners.push({ event, callback } as PendingListener);
    return;
  }

  app.on(event, callback);
};

export const off = <K extends keyof EmitterMap>(event: K, callback: EmitterCallback<EmitterMap[K]>): void => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  if (!app) {
    // Remove from pending listeners if not yet initialized
    const index = pendingListeners.findIndex((l) => l.event === event && l.callback === callback);
    if (index !== -1) {
      pendingListeners.splice(index, 1);
    }
    return;
  }

  app.off(event, callback);
};

export function setTransformer(hook: 'beforeSend', fn: BeforeSendTransformer): void;
export function setTransformer(hook: 'beforeBatch', fn: BeforeBatchTransformer): void;
export function setTransformer(hook: TransformerHook, fn: BeforeSendTransformer | BeforeBatchTransformer): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
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

export const isInitialized = (): boolean => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  return app !== null;
};

export const destroy = (): void => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  if (isDestroying) {
    throw new Error('[TraceLog] Destroy operation already in progress');
  }

  if (!app) {
    throw new Error('[TraceLog] App not initialized');
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
  } catch (error) {
    app = null;
    isInitializing = false;
    pendingListeners.length = 0;
    pendingTransformers.length = 0;
    pendingConsents.length = 0;

    log('warn', 'Error during destroy, forced cleanup completed', { error });
  } finally {
    isDestroying = false;
  }
};

export const setConsent = async (integration: ConsentIntegration, granted: boolean): Promise<void> => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  // If not initialized, handle consent operations before init
  if (!app || isInitializing) {
    // For 'all', we need to buffer since we don't know which integrations are configured yet
    if (integration === 'all') {
      const existingIndex = pendingConsents.findIndex((c) => c.integration === integration);
      if (existingIndex !== -1) {
        pendingConsents.splice(existingIndex, 1);
      }
      pendingConsents.push({ integration, granted });
      return;
    }

    // For specific integrations, persist directly to localStorage
    // ConsentManager will auto-load this on init
    try {
      const { StorageManager } = await import('./managers/storage.manager');
      const { ConsentManager } = await import('./managers/consent.manager');

      const tempStorage = new StorageManager();
      const tempConsent = new ConsentManager(tempStorage, false, null); // Disable cross-tab sync, no emitter for temporary instance

      tempConsent.setConsent(integration, granted);

      // Wait for debounced persist to complete (PERSIST_DEBOUNCE_MS = 50ms + margin)
      await new Promise((resolve) => setTimeout(resolve, 60));

      // Cleanup to prevent memory leak
      tempConsent.cleanup();

      log('debug', `Consent for ${integration} persisted before init`);
    } catch (error) {
      log('warn', 'Failed to persist consent before init', { error });
    }

    return;
  }

  if (isDestroying) {
    throw new Error('[TraceLog] Cannot set consent while TraceLog is being destroyed');
  }

  const consentManager = app.getConsentManager();

  if (!consentManager) {
    log('warn', 'Consent manager not available');
    return;
  }

  const config = app.getConfig();

  // Handle 'all' integration
  if (integration === 'all') {
    const integrations: ('google' | 'custom' | 'tracelog')[] = [];

    if (config.integrations?.google) {
      integrations.push('google');
    }

    const collectApiUrls = app.getCollectApiUrls();
    if (collectApiUrls?.custom) {
      integrations.push('custom');
    }

    if (collectApiUrls?.saas) {
      integrations.push('tracelog');
    }

    // Apply to all configured integrations
    for (const int of integrations) {
      await setConsent(int, granted);
    }

    return;
  }

  // Get previous consent state
  const hadConsent = consentManager.hasConsent(integration);

  // Update consent state
  consentManager.setConsent(integration, granted);

  // Handle consent granted - delegate to App for orchestration
  if (granted && !hadConsent) {
    await app.handleConsentGranted(integration);
  }

  // Handle consent revoked
  if (!granted && hadConsent) {
    log('info', `Consent revoked for ${integration}`);

    // Clean up buffered events for this integration
    const eventManager = app.getEventManager();
    if (eventManager) {
      eventManager.clearConsentBufferForIntegration(integration);
    }

    // EventManager/SenderManager will automatically stop sending to this integration
  }
};

export const hasConsent = (integration: ConsentIntegration): boolean => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  if (!app) {
    // Check pending 'all' consents
    if (integration === 'all') {
      const pending = pendingConsents.find((c) => c.integration === integration);
      return pending ? pending.granted : false;
    }

    // For specific integrations, check localStorage directly
    const state = loadConsentFromStorage();
    if (!state) {
      return false;
    }

    return Boolean(state[integration]);
  }

  const consentManager = app.getConsentManager();

  if (!consentManager) {
    return false;
  }

  return consentManager.hasConsent(integration);
};

export const getConsentState = (): ConsentState => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { google: false, custom: false, tracelog: false };
  }

  if (!app) {
    // Read directly from localStorage
    const state = loadConsentFromStorage();
    return state ?? { google: false, custom: false, tracelog: false };
  }

  const consentManager = app.getConsentManager();

  if (!consentManager) {
    return { google: false, custom: false, tracelog: false };
  }

  return consentManager.getConsentState();
};

export const setQaMode = (enabled: boolean): void => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  setQaModeUtil(enabled);
};

/**
 * Internal sync function - ONLY for TestBridge in development
 *
 * WARNING: This function is internal and should NEVER be called directly.
 * It's only exported for TestBridge synchronization in dev mode.
 *
 * @internal
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

if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && typeof document !== 'undefined') {
  const injectTestingBridge = (): void => {
    window.__traceLogBridge = new TestBridge(isInitializing, isDestroying);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectTestingBridge);
  } else {
    injectTestingBridge();
  }
}
