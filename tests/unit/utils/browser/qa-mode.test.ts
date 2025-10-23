import { describe, it, expect, beforeEach, vi } from 'vitest';
import { detectQaMode, setQaMode } from '../../../../src/utils/browser/qa-mode.utils';
import { QA_MODE_KEY } from '../../../../src/constants';

describe('QA Mode Detection', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  describe('detectQaMode', () => {
    it('should return true if QA mode is already stored in sessionStorage', () => {
      sessionStorage.setItem(QA_MODE_KEY, 'true');

      const isQaMode = detectQaMode();

      expect(isQaMode).toBe(true);
    });

    it('should return false if QA mode is not stored and no query param', () => {
      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          search: '',
        },
        writable: true,
        configurable: true,
      });

      const isQaMode = detectQaMode();

      expect(isQaMode).toBe(false);
    });

    it('should detect QA mode from ?tlog_mode=qa query parameter', () => {
      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          search: '?tlog_mode=qa',
          pathname: '/',
          hash: '',
        },
        writable: true,
        configurable: true,
      });

      const isQaMode = detectQaMode();

      expect(isQaMode).toBe(true);
      expect(sessionStorage.getItem(QA_MODE_KEY)).toBe('true');
    });

    it('should persist QA mode to sessionStorage when detected via URL', () => {
      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          search: '?tlog_mode=qa',
          pathname: '/test',
          hash: '#section',
        },
        writable: true,
        configurable: true,
      });

      detectQaMode();

      expect(sessionStorage.getItem(QA_MODE_KEY)).toBe('true');
    });

    it('should return false for incorrect query parameter value', () => {
      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          search: '?tlog_mode=dev',
        },
        writable: true,
        configurable: true,
      });

      const isQaMode = detectQaMode();

      expect(isQaMode).toBe(false);
      expect(sessionStorage.getItem(QA_MODE_KEY)).toBeNull();
    });

    it('should return false for missing tlog_mode parameter', () => {
      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          search: '?other_param=value',
        },
        writable: true,
        configurable: true,
      });

      const isQaMode = detectQaMode();

      expect(isQaMode).toBe(false);
    });

    it('should handle History API errors gracefully', () => {
      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          search: '?tlog_mode=qa',
          pathname: '/test',
          hash: '',
        },
        writable: true,
        configurable: true,
      });

      vi.spyOn(window.history, 'replaceState').mockImplementation(() => {
        throw new Error('History API not available');
      });

      // Should still detect QA mode even if URL cleanup fails
      const isQaMode = detectQaMode();

      expect(isQaMode).toBe(true);
      expect(sessionStorage.getItem(QA_MODE_KEY)).toBe('true');
    });

    it('should preserve other query parameters when cleaning tlog_mode', () => {
      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          search: '?tlog_mode=qa&foo=bar&baz=qux',
          pathname: '/page',
          hash: '#anchor',
        },
        writable: true,
        configurable: true,
      });

      const replaceStateSpy = vi.spyOn(window.history, 'replaceState');

      detectQaMode();

      expect(replaceStateSpy).toHaveBeenCalledWith({}, '', '/page?foo=bar&baz=qux#anchor');
    });

    it('should remove query string entirely if tlog_mode was the only param', () => {
      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          search: '?tlog_mode=qa',
          pathname: '/page',
          hash: '',
        },
        writable: true,
        configurable: true,
      });

      const replaceStateSpy = vi.spyOn(window.history, 'replaceState');

      detectQaMode();

      expect(replaceStateSpy).toHaveBeenCalledWith({}, '', '/page');
    });

    it('should preserve hash fragment when cleaning URL', () => {
      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          search: '?tlog_mode=qa',
          pathname: '/test',
          hash: '#section-2',
        },
        writable: true,
        configurable: true,
      });

      const replaceStateSpy = vi.spyOn(window.history, 'replaceState');

      detectQaMode();

      expect(replaceStateSpy).toHaveBeenCalledWith({}, '', '/test#section-2');
    });

    it('should log console message when QA mode is activated', () => {
      const consoleLogSpy = vi.spyOn(console, 'log');

      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          search: '?tlog_mode=qa',
          pathname: '/',
          hash: '',
        },
        writable: true,
        configurable: true,
      });

      detectQaMode();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TraceLog] QA Mode ACTIVE'),
        expect.any(String),
      );
    });

    it('should detect qa_off value and disable QA mode', () => {
      // First activate QA mode
      sessionStorage.setItem(QA_MODE_KEY, 'true');

      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          search: '?tlog_mode=qa_off',
          pathname: '/',
          hash: '',
        },
        writable: true,
        configurable: true,
      });

      const isQaMode = detectQaMode();

      expect(isQaMode).toBe(false);
      expect(sessionStorage.getItem(QA_MODE_KEY)).toBe('false');
    });

    it('should remove from sessionStorage when ?tlog_mode=qa_off', () => {
      sessionStorage.setItem(QA_MODE_KEY, 'true');

      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          search: '?tlog_mode=qa_off',
          pathname: '/page',
          hash: '',
        },
        writable: true,
        configurable: true,
      });

      detectQaMode();

      expect(sessionStorage.getItem(QA_MODE_KEY)).toBe('false');
    });

    it('should log DISABLED message when deactivating', () => {
      const consoleLogSpy = vi.spyOn(console, 'log');
      sessionStorage.setItem(QA_MODE_KEY, 'true');

      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          search: '?tlog_mode=qa_off',
          pathname: '/',
          hash: '',
        },
        writable: true,
        configurable: true,
      });

      detectQaMode();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TraceLog] QA Mode DISABLED'),
        expect.any(String),
      );
    });

    it('should clean URL param after detecting qa_off value', () => {
      const replaceStateSpy = vi.spyOn(window.history, 'replaceState');

      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          search: '?tlog_mode=qa_off',
          pathname: '/test',
          hash: '',
        },
        writable: true,
        configurable: true,
      });

      detectQaMode();

      expect(replaceStateSpy).toHaveBeenCalledWith({}, '', '/test');
    });

    it('should handle activation → deactivation → activation cycle', () => {
      // Activate
      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          search: '?tlog_mode=qa',
          pathname: '/',
          hash: '',
        },
        writable: true,
        configurable: true,
      });

      expect(detectQaMode()).toBe(true);
      expect(sessionStorage.getItem(QA_MODE_KEY)).toBe('true');

      // Deactivate
      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          search: '?tlog_mode=qa_off',
          pathname: '/',
          hash: '',
        },
        writable: true,
        configurable: true,
      });

      expect(detectQaMode()).toBe(false);
      expect(sessionStorage.getItem(QA_MODE_KEY)).toBe('false');

      // Activate again
      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          search: '?tlog_mode=qa',
          pathname: '/',
          hash: '',
        },
        writable: true,
        configurable: true,
      });

      expect(detectQaMode()).toBe(true);
      expect(sessionStorage.getItem(QA_MODE_KEY)).toBe('true');
    });

    it('should preserve state across multiple detectQaMode() calls without URL params', () => {
      // Activate via URL
      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          search: '?tlog_mode=qa',
          pathname: '/',
          hash: '',
        },
        writable: true,
        configurable: true,
      });

      expect(detectQaMode()).toBe(true);

      // Subsequent calls without URL param should preserve state
      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          search: '',
          pathname: '/',
          hash: '',
        },
        writable: true,
        configurable: true,
      });

      expect(detectQaMode()).toBe(true);
      expect(detectQaMode()).toBe(true);
    });
  });

  describe('setQaMode', () => {
    it('should activate QA mode when passed true', () => {
      setQaMode(true);

      expect(sessionStorage.getItem(QA_MODE_KEY)).toBe('true');
    });

    it('should deactivate QA mode when passed false', () => {
      sessionStorage.setItem(QA_MODE_KEY, 'true');

      setQaMode(false);

      expect(sessionStorage.getItem(QA_MODE_KEY)).toBe('false');
    });

    it('should log ENABLED message when activating', () => {
      const consoleLogSpy = vi.spyOn(console, 'log');

      setQaMode(true);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TraceLog] QA Mode ENABLED'),
        expect.any(String),
      );
    });

    it('should log DISABLED message when deactivating', () => {
      const consoleLogSpy = vi.spyOn(console, 'log');

      setQaMode(false);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TraceLog] QA Mode DISABLED'),
        expect.any(String),
      );
    });
  });
});
