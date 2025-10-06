import { QA_MODE_KEY } from '@/constants';
import { log } from '../logging.utils';

const QA_MODE_PARAM = 'tlog_mode';
const QA_MODE_VALUE = 'qa';

/**
 * Detects if QA mode should be active based on URL query parameter or sessionStorage
 *
 * Detection flow:
 * 1. Check if already active in sessionStorage
 * 2. Check for ?tlog_mode=qa query parameter
 * 3. If found in URL:
 *    - Persist to sessionStorage
 *    - Clean param from URL
 *
 * @returns True if QA mode is active, false otherwise
 */
export const detectQaMode = (): boolean => {
  const stored = sessionStorage.getItem(QA_MODE_KEY);

  if (stored === 'true') {
    return true;
  }

  const params = new URLSearchParams(window.location.search);
  const modeParam = params.get(QA_MODE_PARAM);
  const isQaMode = modeParam === QA_MODE_VALUE;

  if (isQaMode) {
    sessionStorage.setItem(QA_MODE_KEY, 'true');

    params.delete(QA_MODE_PARAM);

    const newSearch = params.toString();
    const newUrl = `${window.location.pathname}${newSearch ? '?' + newSearch : ''}${window.location.hash}`;

    try {
      window.history.replaceState({}, '', newUrl);
    } catch (error) {
      log('warn', 'History API not available, cannot replace URL', { error });
    }

    console.log(
      '%c[TraceLog] QA Mode ACTIVE',
      'background: #ff9800; color: white; font-weight: bold; padding: 2px 8px; border-radius: 3px;',
    );
  }

  return isQaMode;
};
