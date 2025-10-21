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
 * ConsentManager handles consent state for GDPR/CCPA compliance
 *
 * Features:
 * - Granular consent per integration (google, custom, tracelog)
 * - Persistent storage with 365-day expiration
 * - Cross-tab synchronization via storage events
 * - Thread-safe operations with debouncing
 */
export class ConsentManager {
  private readonly storageManager: StorageManager;
  private readonly emitter: Emitter | null;
  private consentState: ConsentState;
  private storageListener: ((event: StorageEvent) => void) | null = null;
  private persistDebounceTimer: number | null = null;
  private readonly PERSIST_DEBOUNCE_MS = 50;

  constructor(storageManager: StorageManager, enableCrossTabSync = true, emitter: Emitter | null = null) {
    if (typeof window === 'undefined') {
      throw new Error('[TraceLog] ConsentManager can only be used in browser environment');
    }

    this.storageManager = storageManager;
    this.emitter = emitter;
    this.consentState = {
      google: false,
      custom: false,
      tracelog: false,
    };

    // Load persisted consent and setup cross-tab sync on initialization
    // Note: These side effects are intentional and necessary for proper initialization
    this.loadPersistedConsent();

    // Only enable cross-tab sync for persistent instances (not temporary ones)
    if (enableCrossTabSync) {
      this.setupCrossTabSync();
    }
  }

  /**
   * Check if consent has been granted for a specific integration
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
   * Grant or revoke consent for one or all integrations
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
   * Get the current consent state for all integrations
   */
  getConsentState(): ConsentState {
    return { ...this.consentState };
  }

  /**
   * Get list of integrations that have been granted consent
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
      // Only handle consent key changes from other tabs
      if (event.key !== CONSENT_KEY || event.storageArea !== window.localStorage) {
        return;
      }

      // Consent was cleared in another tab
      if (!event.newValue) {
        this.consentState = {
          google: false,
          custom: false,
          tracelog: false,
        };

        log('debug', 'Consent cleared in another tab, synced locally');
        return;
      }

      // Consent was updated in another tab
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
