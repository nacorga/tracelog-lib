import {
  QA_MODE_KEY,
  QA_MODE_URL_PARAM,
  QA_MODE_ENABLE_VALUE,
  QA_MODE_DISABLE_VALUE,
  LOG_STYLE_ACTIVE,
  LOG_STYLE_DISABLED,
} from '../../constants';
import { log } from '../logging.utils';

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Check if browser environment is available
 */
const isBrowserEnvironment = (): boolean => {
  return typeof window !== 'undefined' && typeof sessionStorage !== 'undefined';
};

/**
 * Clean URL parameter from the current URL
 */
const cleanUrlParameter = (): void => {
  try {
    const params = new URLSearchParams(window.location.search);
    params.delete(QA_MODE_URL_PARAM);

    const search = params.toString();
    const url = window.location.pathname + (search ? '?' + search : '') + window.location.hash;

    window.history.replaceState({}, '', url);
  } catch {
    // Continue without cleaning URL
  }
};

// ============================================================================
// QA Mode Public API
// ============================================================================

/**
 * Detects QA mode from URL parameter or sessionStorage
 *
 * QA mode shows custom event logs to help verify tracking implementation.
 *
 * Activation:
 * - URL: `?tlog_mode=qa` to enable, `?tlog_mode=qa_off` to disable
 * - Programmatic: `tracelog.setQaMode(true/false)`
 *
 * @returns True if QA mode is active, false otherwise
 */
export const detectQaMode = (): boolean => {
  if (!isBrowserEnvironment()) {
    return false;
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get(QA_MODE_URL_PARAM);
    const storedState = sessionStorage.getItem(QA_MODE_KEY);

    let newState: boolean | null = null;

    if (urlParam === QA_MODE_ENABLE_VALUE) {
      newState = true;
      sessionStorage.setItem(QA_MODE_KEY, 'true');

      log('info', 'QA Mode ACTIVE', {
        showToClient: true,
        style: LOG_STYLE_ACTIVE,
      });
    } else if (urlParam === QA_MODE_DISABLE_VALUE) {
      newState = false;
      sessionStorage.setItem(QA_MODE_KEY, 'false');

      log('info', 'QA Mode DISABLED', {
        showToClient: true,
        style: LOG_STYLE_DISABLED,
      });
    }

    if (urlParam === QA_MODE_ENABLE_VALUE || urlParam === QA_MODE_DISABLE_VALUE) {
      cleanUrlParameter();
    }

    return newState ?? storedState === 'true';
  } catch {
    return false;
  }
};

/**
 * Set QA mode state programmatically
 *
 * @param enabled - True to enable, false to disable
 */
export const setQaMode = (enabled: boolean): void => {
  if (!isBrowserEnvironment()) {
    return;
  }

  try {
    sessionStorage.setItem(QA_MODE_KEY, enabled ? 'true' : 'false');

    log('info', enabled ? 'QA Mode ACTIVE' : 'QA Mode DISABLED', {
      showToClient: true,
      style: enabled ? LOG_STYLE_ACTIVE : LOG_STYLE_DISABLED,
    });
  } catch {
    log('debug', 'Cannot set QA mode: sessionStorage unavailable');
  }
};

/**
 * Check if QA mode is currently active
 *
 * @returns True if QA mode is active, false otherwise
 */
export const isQaModeActive = (): boolean => {
  if (!isBrowserEnvironment()) {
    return false;
  }

  try {
    return sessionStorage.getItem(QA_MODE_KEY) === 'true';
  } catch {
    return false;
  }
};
