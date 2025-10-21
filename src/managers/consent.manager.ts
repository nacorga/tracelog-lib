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
 * 3. `consent-changed` event emitted
 * 4. EventManager flushes buffered events for granted integration
 * 5. Other tabs sync consent via `storage` event
 *
 * **Event Buffering**:
 * - Events tracked before consent granted are buffered in `consentEventsBuffer`
 * - Buffer flushed when consent granted via `EventManager.flushConsentBuffer()`
 * - Events tracked per-integration (SaaS vs Custom)
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
   * Clean up resources
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
   * Load persisted consent from localStorage
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
   * Persist consent state to localStorage with debouncing
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
   * Immediately persist consent state to localStorage
   */
  private persistConsent(): void {
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

      // Check if it's a quota error
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        log('warn', 'localStorage quota exceeded, consent will be volatile for this session');
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
   * Setup cross-tab synchronization via storage events
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
        }
      } catch (error) {
        log('warn', 'Failed to parse consent update from another tab', { error });
      }
    };

    window.addEventListener('storage', this.storageListener);
  }
}
