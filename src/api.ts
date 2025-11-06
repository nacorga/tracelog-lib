import { App } from './app';
import {
  MetadataType,
  Config,
  EmitterCallback,
  EmitterMap,
  TransformerHook,
  BeforeSendTransformer,
  BeforeBatchTransformer,
} from './types';
import { log, validateAndNormalizeConfig, setQaMode as setQaModeUtil } from './utils';
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

let app: App | null = null;
let isInitializing = false;
let isDestroying = false;

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
 * @param event - Event type ('event' or 'queue')
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

    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && window.__traceLogBridge) {
      window.__traceLogBridge = undefined;
    }

    isDestroying = false;
  } catch (error) {
    app = null;
    isInitializing = false;

    pendingListeners.length = 0;
    pendingTransformers.length = 0;

    isDestroying = false;

    log('warn', 'Error during destroy, forced cleanup completed', { error });
  }
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
