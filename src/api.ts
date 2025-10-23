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
 * **Critical Timing Requirement:**
 * Register listeners **BEFORE calling `init()`** to capture initial events like
 * SESSION_START and PAGE_VIEW that fire during initialization.
 *
 * **What Happens:**
 * - ✅ Listeners registered **before `tracelog.init()`**: Buffered and attached during init,
 *   will receive SESSION_START and PAGE_VIEW events
 * - ❌ Listeners registered **during or after `init()` starts**: Attached after init completes,
 *   will MISS SESSION_START and PAGE_VIEW events
 *
 * **Timing Window:**
 * ```
 * tracelog.on('event', handler);  // ✅ Register FIRST
 * await tracelog.init();           // Then initialize
 * // SESSION_START and PAGE_VIEW fire here during init
 * ```
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
 * // CORRECT: Register listener before init
 * tracelog.on('event', (event) => {
 *   console.log('Event:', event.type, event);
 * });
 * await tracelog.init();  // Will receive SESSION_START and PAGE_VIEW
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
 * - **Standalone Mode (no integration)**: Only `beforeSend` transformer applied in EventManager
 *   - `beforeSend` applied per-event in `buildEventPayload()` before queueing
 *   - `beforeBatch` NOT supported (no SenderManager created in standalone mode)
 *   - Events visible in `on('event')` and `on('queue')` with `beforeSend` transformations
 * - **TraceLog SaaS (only)**: Transformers silently ignored (schema protection)
 * - **Custom Backend (only)**: Both transformers applied
 *   - `beforeSend` applied per-event in EventManager `buildEventPayload()` before queueing
 *   - `beforeBatch` applied in SenderManager before network transmission
 * - **Multi-Integration (SaaS + Custom)**: Transformers skipped in EventManager, applied per-integration in SenderManager
 *   - `beforeSend` NOT applied in EventManager (applied in SenderManager per-integration)
 *   - `beforeBatch` applied in SenderManager per-integration
 *   - SaaS receives original events (schema protection)
 *   - Custom backend receives transformed events
 *   - Events in `on('event')` listeners are UNTRANSFORMED (original)
 * - **Google Analytics**: Transformers NOT applied (forwards `tracelog.event()` as-is)
 *
 * **Available hooks:**
 * - `beforeSend`: Per-event transformation (before dedup/sampling/queueing)
 * - `beforeBatch`: Batch transformation (before network transmission or local emit)
 *
 * **Timing:**
 * - Transformers are passed to EventManager during App initialization
 * - Can be registered BEFORE or DURING `init()` - both work for initial events
 * - Recommended: Register BEFORE `init()` for clarity and consistency
 *
 * @param hook - Transformer hook type
 * @param fn - Transformer function (return null to filter out event/batch)
 * @throws {Error} If called during destroy()
 * @throws {Error} If fn is not a function
 *
 * @example
 * ```typescript
 * // Standalone mode - transformers applied locally
 * tracelog.setTransformer('beforeSend', (data) => {
 *   if ('type' in data) {
 *     return { ...data, customField: 'added' };
 *   }
 *   return data;
 * });
 *
 * await tracelog.init(); // No integration - standalone mode
 * tracelog.on('event', (event) => {
 *   console.log(event.customField); // 'added'
 * });
 *
 * // Custom backend - transformers applied before sending
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
 * await tracelog.init({
 *   integrations: {
 *     custom: { collectApiUrl: 'https://api.example.com' }
 *   }
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
 * **Features:**
 * - Persistent storage (localStorage, 365-day expiration)
 * - Cross-tab synchronization via storage events
 * - Can be called before init() - consent is persisted and auto-loaded
 * - When granted: buffered events sent retroactively (SESSION_START first)
 * - When revoked: stops future sends and **clears buffered events** for that integration
 *
 * **'all' Integration Behavior:**
 * - **Before init()**: Sets consent for google, custom, AND tracelog (all three)
 * - **After init()**: Sets consent only for CONFIGURED integrations
 * - **Rationale**: Before init, we don't know which integrations will be configured,
 *   so we persist consent for all possible integrations. After init, we only modify
 *   configured integrations to avoid touching unused integration consent state.
 *
 * **Consent Revocation Behavior:**
 * When consent is revoked (`granted: false`):
 * 1. Consent state updated in ConsentManager and persisted to localStorage
 * 2. **Buffered events cleared**: All events waiting for this integration are removed from memory
 *    - Events exclusively for this integration are discarded
 *    - Events needed by other integrations are preserved
 * 3. Future event sends to this integration are blocked
 * 4. Emits `'consent-changed'` event for reactive UI updates
 *
 * **Memory Management:**
 * Clearing buffered events on revoke prevents memory buildup and ensures privacy compliance
 * (user doesn't want data sent, so we don't keep it in memory)
 *
 * @param integration - Integration identifier ('google', 'custom', 'tracelog', or 'all')
 * @param granted - true to grant consent, false to revoke
 * @throws {Error} If called during destroy()
 * @throws {Error} If localStorage persistence fails (before init only)
 *
 * @example
 * ```typescript
 * // Grant consent for specific integrations
 * await tracelog.setConsent('google', true);
 * await tracelog.setConsent('custom', true);
 *
 * // Grant consent for ALL integrations (behavior depends on timing)
 * await tracelog.setConsent('all', true);
 * // Before init: sets google=true, custom=true, tracelog=true
 * // After init: sets consent only for configured integrations
 *
 * // Revoke consent (clears buffered events)
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
