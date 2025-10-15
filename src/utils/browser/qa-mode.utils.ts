import {
  QA_MODE_KEY,
  QA_MODE_URL_PARAM,
  QA_MODE_ENABLE_VALUE,
  QA_MODE_DISABLE_VALUE,
  LOG_STYLE_ACTIVE,
} from '../../constants';
import { log } from '../logging.utils';

/**
 * Detects QA mode from URL parameter or sessionStorage
 *
 * @returns True if QA mode is active, false otherwise
 */
export const detectQaMode = (): boolean => {
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
      sessionStorage.removeItem(QA_MODE_KEY);
    }

    if (urlParam === QA_MODE_ENABLE_VALUE || urlParam === QA_MODE_DISABLE_VALUE) {
      try {
        params.delete(QA_MODE_URL_PARAM);

        const search = params.toString();
        const url = window.location.pathname + (search ? '?' + search : '') + window.location.hash;

        window.history.replaceState({}, '', url);
      } catch {
        // Continue without cleaning URL
      }
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
  try {
    if (enabled) {
      sessionStorage.setItem(QA_MODE_KEY, 'true');

      log('info', 'QA Mode ENABLED', {
        showToClient: true,
        style: LOG_STYLE_ACTIVE,
      });
    } else {
      sessionStorage.removeItem(QA_MODE_KEY);
    }
  } catch {
    log('warn', 'Cannot set QA mode: sessionStorage unavailable');
  }
};
