import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { log } from '../../../src/utils/logging.utils';

describe('logging.utils', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('log()', () => {
    it('should log a simple message', () => {
      log('info', 'Test message');
      expect(consoleLogSpy).toHaveBeenCalledWith('[TraceLog] Test message');
    });

    it('should apply CSS styles when style parameter is provided', () => {
      const cssStyle = 'color: blue; font-weight: bold;';
      log('info', 'Styled message', { style: cssStyle });

      expect(consoleLogSpy).toHaveBeenCalledWith('%c[TraceLog] Styled message', cssStyle);
    });

    it('should apply CSS styles with data object', () => {
      const cssStyle = 'color: red;';
      const data = { key: 'value' };
      log('warn', 'Styled warning', { style: cssStyle, data });

      expect(consoleWarnSpy).toHaveBeenCalledWith('%c[TraceLog] Styled warning', cssStyle, data);
    });

    it('should not apply styles when style is empty string', () => {
      log('info', 'No style', { style: '' });
      expect(consoleLogSpy).toHaveBeenCalledWith('[TraceLog] No style');
    });

    it('should not apply styles when style is undefined', () => {
      log('info', 'No style', { style: undefined });
      expect(consoleLogSpy).toHaveBeenCalledWith('[TraceLog] No style');
    });

    it('should handle error messages with styles', () => {
      const cssStyle = 'color: red; font-size: 14px;';
      const error = new Error('Test error');
      log('error', 'Error occurred', { error, style: cssStyle });

      expect(consoleErrorSpy).toHaveBeenCalledWith('%c[TraceLog] Error occurred: Test error', cssStyle);
    });

    it('should combine styles, data, and error', () => {
      const cssStyle = 'background: yellow;';
      const error = new Error('Test error');
      const data = { context: 'test' };

      log('error', 'Complex log', { error, data, style: cssStyle });

      expect(consoleErrorSpy).toHaveBeenCalledWith('%c[TraceLog] Complex log: Test error', cssStyle, data);
    });
  });
});
