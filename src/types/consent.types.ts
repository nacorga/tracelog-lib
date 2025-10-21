/**
 * Consent integration identifiers
 * - 'google': Google Analytics / Google Tag Manager
 * - 'custom': Custom backend integration
 * - 'tracelog': TraceLog SaaS integration
 * - 'all': Apply to all configured integrations
 */
export type ConsentIntegration = 'google' | 'custom' | 'tracelog' | 'all';

/**
 * Individual integration consent identifiers (excludes 'all')
 */
export type IndividualConsentIntegration = Exclude<ConsentIntegration, 'all'>;

/**
 * Current consent state for all integrations
 */
export interface ConsentState {
  google: boolean;
  custom: boolean;
  tracelog: boolean;
}

/**
 * Persisted consent data structure in localStorage
 */
export interface PersistedConsent {
  /** Consent state by integration */
  state: ConsentState;
  /** Timestamp when consent was last updated */
  timestamp: number;
  /** Expiration timestamp (timestamp + CONSENT_EXPIRY_DAYS) */
  expiresAt: number;
}

/**
 * Pending consent operations (before init)
 */
export interface PendingConsent {
  integration: ConsentIntegration;
  granted: boolean;
}
