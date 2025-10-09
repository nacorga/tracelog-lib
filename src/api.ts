import { App } from './app';
import { MetadataType, Config, EmitterCallback, EmitterMap } from './types';
import { log, validateAndNormalizeConfig } from './utils';
import { TestBridge } from './test-bridge';
import { INITIALIZATION_TIMEOUT_MS } from './constants';
import './types/window.types';

interface PendingListener {
  event: keyof EmitterMap;
  callback: EmitterCallback<EmitterMap[keyof EmitterMap]>;
}

// Buffer for listeners registered before init()
const pendingListeners: PendingListener[] = [];

let app: App | null = null;
let isInitializing = false;
let isDestroying = false;

export const init = async (config?: Config): Promise<void> => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('[TraceLog] This library can only be used in a browser environment');
  }

  if (window.__traceLogDisabled) {
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

      const initPromise = instance.init(validatedConfig);

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`[TraceLog] Initialization timeout after ${INITIALIZATION_TIMEOUT_MS}ms`));
        }, INITIALIZATION_TIMEOUT_MS);
      });

      await Promise.race([initPromise, timeoutPromise]);

      app = instance;
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
  if (!app) {
    throw new Error('[TraceLog] TraceLog not initialized. Please call init() first.');
  }

  if (isDestroying) {
    throw new Error('[TraceLog] Cannot send events while TraceLog is being destroyed');
  }

  app.sendCustomEvent(name, metadata);
};

export const on = <K extends keyof EmitterMap>(event: K, callback: EmitterCallback<EmitterMap[K]>): void => {
  if (!app || isInitializing) {
    // Buffer listeners registered before or during init()
    pendingListeners.push({ event, callback } as PendingListener);
    return;
  }

  app.on(event, callback);
};

export const off = <K extends keyof EmitterMap>(event: K, callback: EmitterCallback<EmitterMap[K]>): void => {
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

export const isInitialized = (): boolean => {
  return app !== null;
};

export const destroy = (): void => {
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

    // Clear TestBridge reference in dev mode to prevent stale references
    if (process.env.NODE_ENV === 'dev' && typeof window !== 'undefined' && window.__traceLogBridge) {
      // Don't call destroy on bridge (would cause recursion), just clear reference
      window.__traceLogBridge = undefined as any;
    }
  } catch (error) {
    app = null;
    isInitializing = false;
    pendingListeners.length = 0;

    // Log error but don't re-throw - destroy should always complete successfully
    // Applications should be able to tear down TraceLog even if internal cleanup fails
    log('warn', 'Error during destroy, forced cleanup completed', { error });
  } finally {
    isDestroying = false;
  }
};

if (process.env.NODE_ENV === 'dev' && typeof window !== 'undefined') {
  const injectTestingBridge = (): void => {
    window.__traceLogBridge = new TestBridge(isInitializing, isDestroying);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectTestingBridge);
  } else {
    injectTestingBridge();
  }
}

/**
 * Internal sync function - ONLY for TestBridge in development
 *
 * WARNING: This function is internal and should NEVER be called directly.
 * It's only exported for TestBridge synchronization in dev mode.
 *
 * @internal
 */
export const __setAppInstance = (instance: App | null): void => {
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

  // Prevent overwriting an already initialized app (except when clearing)
  if (app !== null && instance !== null && app !== instance) {
    throw new Error('[TraceLog] Cannot overwrite existing app instance. Call destroy() first.');
  }

  app = instance;
};
