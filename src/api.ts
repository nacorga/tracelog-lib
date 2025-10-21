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

/**
 * Wait time for ConsentManager's debounced persistence to complete
 * Value: 60ms = PERSIST_DEBOUNCE_MS (50ms) + safety margin (10ms)
 * Used in setConsent() before init to ensure localStorage write completes
 */
const CONSENT_PERSIST_WAIT_MS = 60;

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

/**
 * Initializes TraceLog and begins tracking user interactions.
 *
 * Safe to call in SSR environments (no-ops in Node.js).
 * Idempotent - subsequent calls are ignored if already initialized.
 *
 * **Initialization Order Best Practice:**
 * 1. Register event listeners with `on()` FIRST (before init)
 * 2. Configure transformers with `setTransformer()` SECOND (if using custom backend)
 * 3. Call `init()` LAST (starts tracking immediately)
 * 4. Send custom events with `event()` AFTER initialization
 *
 * This order ensures no events are missed (SESSION_START and PAGE_VIEW fire during init).
 *
 * @param config - Optional configuration object
 * @throws {Error} If initialization fails or times out (5 seconds)
 *
 * @example
 * ```typescript
 * // Standalone mode (no backend)
 * await tracelog.init();
 *
 * // With TraceLog SaaS
 * await tracelog.init({
 *   integrations: {
 *     tracelog: { projectId: 'your-project-id' }
 *   }
 * });
 *
 * // With custom backend
 * await tracelog.init({
 *   integrations: {
 *     custom: {
 *       collectApiUrl: 'https://api.example.com/collect'
 *     }
 *   }
 * });
 * ```
 */
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

/**
 * Tracks a custom analytics event with optional metadata.
 *
 * Events are subject to rate limiting (60 events/minute per event name by default).
 * In QA mode, events are logged to console instead of being sent to backend.
 *
 * @param name - Unique event identifier (e.g., 'checkout_completed', 'product_viewed')
 * @param metadata - Optional event data (flat key-value pairs or array of objects)
 * @throws {Error} If called before init() or during destroy()
 *
 * @example
 * ```typescript
 * // Simple event
 * tracelog.event('button_clicked');
 *
 * // With metadata
 * tracelog.event('product_viewed', {
 *   productId: 'abc-123',
 *   price: 299.99,
 *   category: 'electronics'
 * });
 *
 * // With array metadata
 * tracelog.event('cart_updated', [
 *   { productId: 'abc-123', quantity: 2 },
 *   { productId: 'def-456', quantity: 1 }
 * ]);
 * ```
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
 * Subscribes to TraceLog events for real-time event consumption.
 *
 * **Important:** Register listeners BEFORE calling init() to capture initial events
 * like SESSION_START and PAGE_VIEW that fire during initialization.
 *
 * Available event types:
 * - `'event'`: Individual events as they're captured (real-time)
 * - `'queue'`: Batched events ready to send (every 10s or 50 events)
 * - `'consent-changed'`: Consent state changes for any integration
 *
 * @param event - Event type to subscribe to
 * @param callback - Function called when event fires
 *
 * @example
 * ```typescript
 * // Listen to individual events
 * tracelog.on('event', (event) => {
 *   console.log('Event:', event.type, event);
 * });
 *
 * // Listen to batches
 * tracelog.on('queue', (batch) => {
 *   console.log('Batch:', batch.events.length, 'events');
 * });
 *
 * // Listen to consent changes
 * tracelog.on('consent-changed', (state) => {
 *   console.log('Consent:', state);
 * });
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
 * Must pass the **exact same function reference** used in `on()`.
 *
 * @param event - Event type to unsubscribe from
 * @param callback - Exact callback function reference
 *
 * @example
 * ```typescript
 * const handler = (event) => console.log(event.type);
 *
 * tracelog.on('event', handler);
 * // Later...
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
 * Sets a transformer function to modify events at runtime before sending.
 *
 * **Integration-specific behavior:**
 * - TraceLog SaaS: Transformers silently ignored (schema protection)
 * - Custom Backend: Transformers applied as configured
 * - Multi-Integration: SaaS gets original, custom gets transformed
 *
 * **Available hooks:**
 * - `beforeSend`: Per-event transformation (before dedup/sampling/queueing)
 * - `beforeBatch`: Batch transformation (before network transmission)
 *
 * **Register BEFORE init()** to transform initial events (SESSION_START, PAGE_VIEW).
 *
 * @param hook - Transformer hook type
 * @param fn - Transformer function (return null to filter out event/batch)
 * @throws {Error} If called during destroy() or after init with invalid timing
 *
 * @example
 * ```typescript
 * // Add custom metadata to all events
 * tracelog.setTransformer('beforeSend', (data) => {
 *   if ('type' in data) {
 *     return {
 *       ...data,
 *       custom_event: {
 *         ...data.custom_event,
 *         metadata: {
 *           ...data.custom_event?.metadata,
 *           appVersion: '1.0.0'
 *         }
 *       }
 *     };
 *   }
 *   return data;
 * });
 *
 * // Filter batch
 * tracelog.setTransformer('beforeBatch', (data) => {
 *   if ('events' in data && data.events.length < 5) {
 *     return null; // Don't send small batches
 *   }
 *   return data;
 * });
 * ```
 */
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

/**
 * Removes a previously set transformer function.
 *
 * Safe to call even if no transformer is set for the hook.
 *
 * @param hook - Transformer hook type to remove
 * @throws {Error} If called during destroy()
 *
 * @example
 * ```typescript
 * tracelog.removeTransformer('beforeSend');
 * tracelog.removeTransformer('beforeBatch');
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
 * if (!tracelog.isInitialized()) {
 *   await tracelog.init();
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
 * Sends remaining events synchronously with sendBeacon before cleanup.
 * Safe to call multiple times (idempotent after first call).
 *
 * **When to call:**
 * - User revokes consent
 * - User logs out
 * - Component/app unmount in SPAs
 *
 * @throws {Error} If destroy operation is already in progress
 * @throws {Error} If app not initialized
 *
 * @example
 * ```typescript
 * // On consent revoke
 * tracelog.destroy();
 *
 * // In framework cleanup hooks
 * onDestroy(() => {
 *   tracelog.destroy();
 * });
 * ```
 */
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

/**
 * Grants or revokes consent for a specific integration or all integrations.
 *
 * **Features:**
 * - Persistent storage (localStorage, 365-day expiration)
 * - Cross-tab synchronization via storage events
 * - Can be called before init() - consent is persisted and auto-loaded
 * - When granted: buffered events sent retroactively (SESSION_START first)
 * - When revoked: stops future sends and clears buffered events for that integration
 *
 * @param integration - Integration identifier ('google', 'custom', 'tracelog', or 'all')
 * @param granted - true to grant consent, false to revoke
 * @throws {Error} If called during destroy()
 *
 * @example
 * ```typescript
 * // Grant consent for specific integrations
 * await tracelog.setConsent('google', true);
 * await tracelog.setConsent('custom', true);
 *
 * // Grant consent for ALL integrations
 * await tracelog.setConsent('all', true);
 *
 * // Revoke consent
 * await tracelog.setConsent('google', false);
 *
 * // Set before init (persisted to localStorage)
 * await tracelog.setConsent('all', true);
 * await tracelog.init({ waitForConsent: true });
 * ```
 */
export const setConsent = async (integration: ConsentIntegration, granted: boolean): Promise<void> => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  if (!app || isInitializing) {
    if (integration === 'all') {
      const existingIndex = pendingConsents.findIndex((c) => c.integration === integration);
      if (existingIndex !== -1) {
        pendingConsents.splice(existingIndex, 1);
      }
      pendingConsents.push({ integration, granted });
      return;
    }

    try {
      const { StorageManager } = await import('./managers/storage.manager');
      const { ConsentManager } = await import('./managers/consent.manager');

      const tempStorage = new StorageManager();
      const tempConsent = new ConsentManager(tempStorage, false, null);

      tempConsent.setConsent(integration, granted);
      await new Promise((resolve) => setTimeout(resolve, CONSENT_PERSIST_WAIT_MS));
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
 * // Check specific integration
 * if (tracelog.hasConsent('google')) {
 *   console.log('Google Analytics enabled');
 * }
 *
 * // Check if ALL integrations have consent
 * if (tracelog.hasConsent('all')) {
 *   console.log('Full tracking enabled');
 * }
 *
 * // Conditional tracking
 * if (tracelog.hasConsent('custom')) {
 *   tracelog.event('premium_feature_used');
 * }
 * ```
 */
export const hasConsent = (integration: ConsentIntegration): boolean => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  if (!app) {
    if (integration === 'all') {
      const pending = pendingConsents.find((c) => c.integration === integration);
      return pending ? pending.granted : false;
    }

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

/**
 * Retrieves the current consent state for all integrations.
 *
 * Can be called before init() - reads directly from localStorage.
 *
 * @returns Object with consent status for each integration
 *
 * @example
 * ```typescript
 * const state = tracelog.getConsentState();
 * // {
 * //   google: true,
 * //   custom: false,
 * //   tracelog: true
 * // }
 *
 * // Build privacy dashboard
 * function PrivacySettings() {
 *   const consent = tracelog.getConsentState();
 *   return (
 *     <div>
 *       <Toggle checked={consent.google} onChange={(v) => tracelog.setConsent('google', v)}>
 *         Google Analytics
 *       </Toggle>
 *       <Toggle checked={consent.custom} onChange={(v) => tracelog.setConsent('custom', v)}>
 *         Custom Analytics
 *       </Toggle>
 *     </div>
 *   );
 * }
 * ```
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
 * **QA Mode Features:**
 * - Custom events logged to browser console (not sent to backend)
 * - Strict validation (throws errors instead of warnings)
 * - Session state visible in console
 * - Persistent across page reloads (sessionStorage)
 *
 * **Alternative activation via URL:** `?tlog_mode=qa` or `?tlog_mode=qa_off`
 *
 * @param enabled - true to enable, false to disable
 *
 * @example
 * ```typescript
 * // Enable QA mode
 * tracelog.setQaMode(true);
 *
 * // Send test event (will be logged to console)
 * tracelog.event('test_event', { key: 'value' });
 *
 * // Disable QA mode
 * tracelog.setQaMode(false);
 * ```
 */
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
