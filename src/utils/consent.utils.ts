import { ConsentState, PersistedConsent } from '../types/consent.types';
import { CONSENT_KEY } from '../constants/storage.constants';
import { log } from './logging.utils';

/**
 * Load consent state from localStorage
 *
 * @returns ConsentState if valid consent exists, null otherwise
 *
 * This helper centralizes the logic for:
 * - Reading from localStorage
 * - Parsing JSON
 * - Validating structure
 * - Checking expiration
 */
export const loadConsentFromStorage = (): ConsentState | null => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return null;
  }

  try {
    const storedData = localStorage.getItem(CONSENT_KEY);
    if (!storedData) {
      return null;
    }

    const parsed: PersistedConsent = JSON.parse(storedData);

    if (!parsed.state || !parsed.expiresAt) {
      return null;
    }

    // Check expiration
    if (Date.now() > parsed.expiresAt) {
      return null;
    }

    return {
      google: Boolean(parsed.state.google),
      custom: Boolean(parsed.state.custom),
      tracelog: Boolean(parsed.state.tracelog),
    };
  } catch (err) {
    log('error', 'Failed to load consent from storage', { error: err });
    return null;
  }
};
