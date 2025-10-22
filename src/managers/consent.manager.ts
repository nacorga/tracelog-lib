import {
  ConsentState,
  ConsentIntegration,
  IndividualConsentIntegration,
  PersistedConsent,
} from '../types/consent.types';
import { CONSENT_KEY, CONSENT_EXPIRY_DAYS } from '../constants/storage.constants';
import { StorageManager } from './storage.manager';
import { Emitter } from '../utils/emitter.utils';
import { EmitterEvent } from '../types/emitter.types';
import { log } from '../utils';

/**
 * Manages GDPR/CCPA-compliant consent state with granular per-integration control.
 *
 * **Purpose**: Provides fine-grained consent management for TraceLog integrations,
 * allowing users to control data collection separately for each backend.
 *
 * **Core Functionality**:
 * - **Granular Consent**: Separate consent for each integration (`google`, `custom`, `tracelog`)
 * - **Persistent Storage**: Stores consent in localStorage with 365-day expiration
 * - **Cross-Tab Synchronization**: Syncs consent state across browser tabs via `storage` events
 * - **Event Buffering**: Events captured before consent granted are buffered
 * - **Retroactive Sending**: Buffered events sent when consent is granted
 * - **Event Emission**: Emits `consent-changed` event for external listeners
 *
 * **Key Features**:
 * - **'all' Integration**: Special value to grant/revoke/check consent for all integrations
 * - **Per-Integration Granularity**: `google`, `custom`, `tracelog` can be controlled independently
 * - **365-Day Expiration**: Consent expires after 365 days (configurable via CONSENT_EXPIRY_DAYS)
 * - **Debounced Persistence**: 50ms debounce prevents excessive localStorage writes
 * - **SSR Safety**: No-op in Node.js environments
 * - **Cross-Tab Sync**: `storage` event listener syncs state across tabs
 * - **Thread-Safe**: Debouncing prevents race conditions with rapid consent changes
 *
 * **Storage Format**:
 * ```json
 * {
 *   "google": true,
 *   "custom": false,
 *   "tracelog": true,
 *   "timestamp": 1704896400000
 * }
 * ```
 *
 * **Consent Flow**:
 * 1. User grants consent via `setConsent()`
 * 2. Consent persisted to localStorage (debounced 50ms)
 * 3. `consent-changed` event emitted via `EmitterEvent.CONSENT_CHANGED`
 * 4. EventManager listens to consent events and flushes buffered events for granted integration
 * 5. Other tabs sync consent via `storage` event
 *
 * **Event Buffering Integration**:
 * - ConsentManager emits consent state changes via events
 * - EventManager listens to `CONSENT_CHANGED` events and manages event buffering
 * - Events tracked before consent granted are buffered in `EventManager.consentEventsBuffer`
 * - Buffer flushed when consent granted via `EventManager.flushConsentBuffer()`
 * - Events tracked per-integration (tracelog, custom, google)
 * - See `EventManager` documentation for complete buffering implementation details
 *
 * @see API_REFERENCE.md (lines 437-646) for consent API details
 *
 * @example
 * ```typescript
 * const consentManager = new ConsentManager(storage, true, emitter);
 *
 * // Check consent
 * if (consentManager.hasConsent('google')) {
 *   // Send events to Google Analytics
 * }
 *
 * // Grant consent
 * consentManager.setConsent('google', true);
 * // → Persisted to localStorage
 * // → 'consent-changed' event emitted
 * // → Buffered events sent to Google Analytics
 *
 * // Revoke consent
 * consentManager.setConsent('tracelog', false);
 * // → Events no longer sent to TraceLog SaaS
 *
 * // Grant all consents
 * consentManager.setConsent('all', true);
 * // → All integrations granted
 * ```
 */
export class ConsentManager {
  private readonly storageManager: StorageManager;
  private readonly emitter: Emitter | null;
  private consentState: ConsentState;
  private storageListener: ((event: StorageEvent) => void) | null = null;
  private persistDebounceTimer: number | null = null;

  /**
   * Debounce delay for localStorage persistence (50ms).
   *
   * **Rationale**: Balances responsiveness with localStorage write performance.
   * - Long enough to batch rapid UI interactions (e.g., programmatic consent setup)
   * - Short enough to feel instant to users (< 100ms threshold)
   * - Prevents localStorage thrashing during rapid consent changes
   *
   * **Performance Impact**: 10 rapid changes = 1 write instead of 10 writes
   */
  private readonly PERSIST_DEBOUNCE_MS = 50;

  /**
   * Creates a ConsentManager instance.
   *
   * **Side Effects**:
   * - Loads persisted consent from localStorage
   * - Sets up cross-tab synchronization (if `enableCrossTabSync` is true)
   *
   * **SSR Safety**: No-op in Node.js environments
   *
   * @param storageManager - Storage manager for consent persistence
   * @param enableCrossTabSync - Enable cross-tab synchronization (default: true)
   * @param emitter - Optional event emitter for consent-changed events
   */
  constructor(storageManager: StorageManager, enableCrossTabSync = true, emitter: Emitter | null = null) {
    this.storageManager = storageManager;
    this.emitter = emitter;
    this.consentState = {
      google: false,
      custom: false,
      tracelog: false,
    };

    if (typeof window === 'undefined') {
      return;
    }

    this.loadPersistedConsent();

    if (enableCrossTabSync) {
      this.setupCrossTabSync();
    }
  }

  /**
   * Checks if consent has been granted for a specific integration.
   *
   * **Purpose**: Query consent state before sending events to integrations.
   *
   * **Behavior**:
   * - `'all'`: Returns `true` only if ALL integrations have consent
   * - Specific integration: Returns consent state for that integration
   * - SSR: Always returns `false` in Node.js environments
   *
   * **Use Cases**:
   * - EventManager: Checks before sending events to backends
   * - SenderManager: Validates consent before network requests
   * - External code: Conditional rendering based on consent
   *
   * @param integration - Integration to check ('all', 'google', 'custom', 'tracelog')
   * @returns `true` if consent granted, `false` otherwise
   *
   * @example
   * ```typescript
   * if (consentManager.hasConsent('google')) {
   *   // Send events to Google Analytics
   * }
   *
   * if (consentManager.hasConsent('all')) {
   *   // All integrations have consent
   * }
   * ```
   */
  hasConsent(integration: ConsentIntegration): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    if (integration === 'all') {
      return this.consentState.google && this.consentState.custom && this.consentState.tracelog;
    }

    return this.consentState[integration];
  }

  /**
   * Grants or revokes consent for one or all integrations.
   *
   * **Purpose**: Update consent state and trigger buffered event flush.
   *
   * **Behavior**:
   * - `'all'`: Grants/revokes consent for ALL integrations
   * - Specific integration: Updates consent for that integration only
   * - Persists to localStorage with 50ms debounce
   * - Emits `consent-changed` event
   * - Triggers flush of buffered events (if consent granted)
   * - SSR: No-op in Node.js environments
   *
   * **Persistence**:
   * - Stored in localStorage with 365-day expiration
   * - Debounced 50ms to prevent excessive writes
   * - Cross-tab synchronized via `storage` events
   *
   * **Event Emission**:
   * - Emits `consent-changed` event with current consent state
   * - EventManager listens and flushes buffered events for granted integration
   *
   * **Important**: Revoking consent does NOT delete already-sent events.
   * It only prevents future events from being sent.
   *
   * @param integration - Integration to update ('all', 'google', 'custom', 'tracelog')
   * @param granted - `true` to grant consent, `false` to revoke
   *
   * @example
   * ```typescript
   * // Grant consent for Google Analytics
   * consentManager.setConsent('google', true);
   * // → Buffered Google Analytics events sent
   *
   * // Revoke consent for custom backend
   * consentManager.setConsent('custom', false);
   * // → Future events NOT sent to custom backend
   *
   * // Grant consent for all integrations
   * consentManager.setConsent('all', true);
   * // → All buffered events sent
   * ```
   */
  setConsent(integration: ConsentIntegration, granted: boolean): void {
    if (typeof window === 'undefined') {
      return;
    }

    if (integration === 'all') {
      this.consentState.google = granted;
      this.consentState.custom = granted;
      this.consentState.tracelog = granted;

      log('info', `Consent ${granted ? 'granted' : 'revoked'} for all integrations`);
    } else {
      this.consentState[integration] = granted;

      log('info', `Consent ${granted ? 'granted' : 'revoked'} for ${integration} integration`);
    }

    this.persistConsentDebounced();

    if (this.emitter) {
      this.emitter.emit(EmitterEvent.CONSENT_CHANGED, this.getConsentState());
    }
  }

  /**
   * Returns a snapshot of the current consent state for all integrations.
   *
   * **Purpose**: Retrieve consent state for display in UI or for external logic.
   *
   * **Behavior**:
   * - Returns shallow copy (prevents external mutations)
   * - Always includes all integrations (`google`, `custom`, `tracelog`)
   * - Each integration is `true` (granted) or `false` (not granted)
   *
   * **Use Cases**:
   * - Display consent status in UI
   * - Sync consent to external systems
   * - Conditional logic based on multiple integrations
   *
   * @returns Snapshot of current consent state
   *
   * @example
   * ```typescript
   * const state = consentManager.getConsentState();
   * // → { google: true, custom: false, tracelog: true }
   *
   * // Display in UI
   * console.log(`Google: ${state.google ? 'Granted' : 'Not granted'}`);
   * console.log(`Custom: ${state.custom ? 'Granted' : 'Not granted'}`);
   * console.log(`TraceLog: ${state.tracelog ? 'Granted' : 'Not granted'}`);
   * ```
   */
  getConsentState(): ConsentState {
    return { ...this.consentState };
  }

  /**
   * Returns a list of integrations that have been granted consent.
   *
   * **Purpose**: Get only granted integrations for conditional logic.
   *
   * **Behavior**:
   * - Returns array of integration names with `true` consent
   * - Empty array if no consent granted
   * - Excludes `'all'` (not a real integration)
   *
   * **Use Cases**:
   * - Iterate over granted integrations
   * - Display granted integrations in UI
   * - Conditional initialization of integrations
   *
   * @returns Array of granted integration names
   *
   * @example
   * ```typescript
   * const granted = consentManager.getGrantedIntegrations();
   * // → ['google', 'tracelog']
   *
   * // Iterate over granted integrations
   * granted.forEach(integration => {
   *   console.log(`${integration} has consent`);
   * });
   * ```
   */
  getGrantedIntegrations(): IndividualConsentIntegration[] {
    const granted: IndividualConsentIntegration[] = [];

    if (this.consentState.google) {
      granted.push('google');
    }

    if (this.consentState.custom) {
      granted.push('custom');
    }

    if (this.consentState.tracelog) {
      granted.push('tracelog');
    }

    return granted;
  }

  /**
   * Cleans up ConsentManager resources and event listeners.
   *
   * **Purpose**: Releases memory and detaches event listeners to prevent memory leaks
   * when ConsentManager is no longer needed.
   *
   * **Cleanup Operations**:
   * 1. Clears pending debounce timer (prevents delayed persistence after cleanup)
   * 2. Removes cross-tab storage event listener
   * 3. Sets references to null for garbage collection
   *
   * **Important Notes**:
   * - Does NOT clear persisted consent from localStorage
   * - Consent state remains accessible in future sessions
   * - SSR-safe: Browser environment check before removing storage listener
   *
   * **Use Cases**:
   * - Called during `App.destroy()` lifecycle
   * - Test cleanup between test cases
   * - Manual cleanup when consent management no longer needed
   *
   * **After Cleanup**:
   * - ConsentManager instance should not be reused
   * - Consent state persists in localStorage
   * - Cross-tab sync stops (other tabs unaffected)
   *
   * @returns void
   *
   * @example
   * ```typescript
   * consentManager.cleanup();
   * // → Debounce timer cleared
   * // → Storage listener removed
   * // → Consent data remains in localStorage
   * ```
   */
  cleanup(): void {
    if (this.persistDebounceTimer) {
      clearTimeout(this.persistDebounceTimer);
      this.persistDebounceTimer = null;
    }

    if (this.storageListener && typeof window !== 'undefined') {
      window.removeEventListener('storage', this.storageListener);
      this.storageListener = null;
    }
  }

  /**
   * Loads and validates persisted consent state from localStorage with expiration check.
   *
   * **Purpose**: Restores consent preferences from previous sessions, ensuring they haven't
   * expired (365 days default).
   *
   * **Validation Flow**:
   * 1. SSR safety check (returns early in Node.js)
   * 2. Retrieves consent data from localStorage
   * 3. Parses JSON and validates structure (state, timestamp, expiresAt fields required)
   * 4. Checks expiration against current time
   * 5. Loads consent state into memory if valid
   *
   * **Error Recovery**:
   * - Invalid JSON → Clears storage, starts fresh
   * - Missing required fields → Clears storage, logs warning
   * - Expired consent → Clears storage, logs info
   * - Parse errors → Clears storage, logs warning, starts with default (no consent)
   *
   * **Expiration Calculation**:
   * - Consent expires after CONSENT_EXPIRY_DAYS (365 days)
   * - Logs days until expiry for debugging
   *
   * **Called by**: Constructor during ConsentManager initialization
   *
   * @private
   */
  private loadPersistedConsent(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const persistedData = this.storageManager.getItem(CONSENT_KEY);

      if (!persistedData) {
        return;
      }

      const parsed: PersistedConsent = JSON.parse(persistedData);

      if (!parsed.state || !parsed.timestamp || !parsed.expiresAt) {
        log('warn', 'Invalid consent data structure, ignoring');
        this.clearPersistedConsent();
        return;
      }

      const now = Date.now();
      if (now > parsed.expiresAt) {
        log('info', 'Persisted consent has expired, clearing');
        this.clearPersistedConsent();
        return;
      }

      this.consentState = {
        google: Boolean(parsed.state.google),
        custom: Boolean(parsed.state.custom),
        tracelog: Boolean(parsed.state.tracelog),
      };

      log('debug', 'Loaded persisted consent state', {
        data: {
          google: this.consentState.google,
          custom: this.consentState.custom,
          tracelog: this.consentState.tracelog,
          daysUntilExpiry: Math.floor((parsed.expiresAt - now) / (1000 * 60 * 60 * 24)),
        },
      });
    } catch (error) {
      log('warn', 'Failed to load persisted consent, starting fresh', { error });
      this.clearPersistedConsent();
    }
  }

  /**
   * Debounces consent persistence to prevent excessive localStorage writes during rapid consent changes.
   *
   * **Purpose**: Optimizes localStorage write performance by batching multiple consent changes
   * into a single write operation after 50ms of inactivity.
   *
   * **Debouncing Strategy**:
   * - Clears existing timer if called while timer pending
   * - Sets new 50ms timer to delay persistence
   * - Only persists once after rapid sequence of consent changes completes
   *
   * **Performance Impact**:
   * - Without debouncing: N consent changes = N localStorage writes
   * - With debouncing: N consent changes = 1 localStorage write
   * - Example: 10 rapid grants/revokes = 1 write instead of 10
   *
   * **Delay Rationale** (50ms):
   * - Long enough to batch rapid UI interactions
   * - Short enough to feel instant to users
   * - Prevents localStorage thrashing during programmatic consent setup
   *
   * **SSR Safety**: Returns early in Node.js environments
   *
   * **Called by**: `setConsent()` after each consent state change
   *
   * @private
   */
  private persistConsentDebounced(): void {
    if (typeof window === 'undefined') {
      return;
    }

    if (this.persistDebounceTimer) {
      clearTimeout(this.persistDebounceTimer);
    }

    this.persistDebounceTimer = window.setTimeout(() => {
      this.persistConsent();
      this.persistDebounceTimer = null;
    }, this.PERSIST_DEBOUNCE_MS);
  }

  /**
   * Immediately flush any pending consent persistence to localStorage.
   * Clears debounce timer and persists immediately.
   *
   * **Use Cases:**
   * - Before navigation/page unload
   * - When consent must be persisted synchronously (e.g., before init)
   *
   * **Error Handling:**
   * - If `throwOnError` is true, storage errors are rethrown (useful for before-init scenarios)
   * - If `throwOnError` is false (default), storage errors are logged but not thrown
   *
   * @param throwOnError - Whether to throw storage errors (default: false)
   * @public
   */
  flush(throwOnError = false): void {
    if (this.persistDebounceTimer !== null) {
      clearTimeout(this.persistDebounceTimer);
      this.persistDebounceTimer = null;
    }

    this.persistConsent(throwOnError);
  }

  /**
   * Immediately persist consent state to localStorage
   *
   * @param throwOnError - Whether to throw storage errors (default: false)
   */
  private persistConsent(throwOnError = false): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const now = Date.now();
      const expiresAt = now + CONSENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

      const data: PersistedConsent = {
        state: { ...this.consentState },
        timestamp: now,
        expiresAt,
      };

      this.storageManager.setItem(CONSENT_KEY, JSON.stringify(data));
    } catch (error) {
      log('error', 'Failed to persist consent state', { error });

      if (error instanceof Error && error.name === 'QuotaExceededError') {
        log('warn', 'localStorage quota exceeded, consent will be volatile for this session');
      }

      if (throwOnError) {
        throw error;
      }
    }
  }

  /**
   * Clear persisted consent from localStorage
   */
  private clearPersistedConsent(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      this.storageManager.removeItem(CONSENT_KEY);
    } catch (error) {
      log('warn', 'Failed to clear persisted consent', { error });
    }
  }

  /**
   * Establishes cross-tab consent synchronization using storage events.
   *
   * **Purpose**: Keeps consent state synchronized across all browser tabs/windows
   * by listening to localStorage changes made by other tabs.
   *
   * **How It Works**:
   * 1. Listens to `storage` event (fires when localStorage changes in other tab)
   * 2. Filters events to CONSENT_KEY only
   * 3. Validates new consent data structure
   * 4. Updates in-memory consent state
   * 5. Emits CONSENT_CHANGED event to notify EventManager
   *
   * **Cross-Tab Scenarios**:
   * - Tab A grants consent → Tab B/C/D receive update via storage event
   * - Tab A revokes consent → Tab B/C/D stop sending events immediately
   * - New tab opened → Loads existing consent from localStorage
   *
   * **Event Filtering**:
   * - Only processes events for CONSENT_KEY ('tracelog_consent')
   * - Ignores other localStorage changes
   * - Validates data structure before applying
   *
   * **Error Handling**:
   * - Invalid JSON → Ignored (keeps current state)
   * - Missing required fields → Ignored (logs warning)
   * - Parse errors → Ignored (logs warning, maintains stability)
   *
   * **SSR Safety**: Returns early in Node.js environments
   *
   * **Called by**: Constructor during ConsentManager initialization
   *
   * @private
   */
  private setupCrossTabSync(): void {
    if (typeof window === 'undefined') {
      return;
    }

    this.storageListener = (event: StorageEvent) => {
      if (event.key !== CONSENT_KEY || event.storageArea !== window.localStorage) {
        return;
      }

      if (!event.newValue) {
        this.consentState = {
          google: false,
          custom: false,
          tracelog: false,
        };

        log('debug', 'Consent cleared in another tab, synced locally');

        if (this.emitter) {
          this.emitter.emit(EmitterEvent.CONSENT_CHANGED, this.getConsentState());
        }

        return;
      }

      try {
        const parsed: PersistedConsent = JSON.parse(event.newValue);

        if (parsed.state) {
          this.consentState = {
            google: Boolean(parsed.state.google),
            custom: Boolean(parsed.state.custom),
            tracelog: Boolean(parsed.state.tracelog),
          };

          log('debug', 'Consent updated in another tab, synced locally', {
            data: {
              google: this.consentState.google,
              custom: this.consentState.custom,
              tracelog: this.consentState.tracelog,
            },
          });

          if (this.emitter) {
            this.emitter.emit(EmitterEvent.CONSENT_CHANGED, this.getConsentState());
          }
        }
      } catch (error) {
        log('warn', 'Failed to parse consent update from another tab', { error });
      }
    };

    window.addEventListener('storage', this.storageListener);
  }
}
