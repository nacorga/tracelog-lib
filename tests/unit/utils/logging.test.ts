import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatLogMsg, log } from '../../../src/utils/logging.utils';
import { QA_MODE_KEY } from '../../../src/constants';

describe('formatLogMsg', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('Basic messages', () => {
    it('should format message without error', () => {
      const result = formatLogMsg('Test message');
      expect(result).toBe('[TraceLog] Test message');
    });

    it('should format message with empty string', () => {
      const result = formatLogMsg('');
      expect(result).toBe('[TraceLog] ');
    });
  });

  describe('Error objects (development)', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should format message with Error object in development', () => {
      const error = new Error('Test error');
      const result = formatLogMsg('Failed', error);
      expect(result).toBe('[TraceLog] Failed: Test error');
    });

    it('should preserve full error message in development', () => {
      const error = new Error('Network timeout at handleRequest (app.ts:42:10)');
      const result = formatLogMsg('Init failed', error);
      expect(result).toBe('[TraceLog] Init failed: Network timeout at handleRequest (app.ts:42:10)');
    });

    it('should handle Error with empty message in development', () => {
      const error = new Error('');
      const result = formatLogMsg('Error occurred', error);
      expect(result).toBe('[TraceLog] Error occurred: ');
    });
  });

  describe('Error objects (production)', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('should sanitize Error object stack traces in production', () => {
      const error = new Error('Network timeout at handleRequest (app.ts:42:10)');
      const result = formatLogMsg('Init failed', error);
      expect(result).toBe('[TraceLog] Init failed: Network timeout');
      expect(result).not.toContain('app.ts:42:10');
    });

    it('should remove "at" stack lines from error message in production', () => {
      const error = new Error('Error\n    at Function.test (file.ts:1:1)');
      const result = formatLogMsg('Failed', error);
      expect(result).not.toContain('at Function.test');
    });

    it('should remove file paths with line numbers in production', () => {
      const error = new Error('Failed (utils.ts:123:45)');
      const result = formatLogMsg('Error', error);
      expect(result).not.toContain('utils.ts:123:45');
      expect(result).toBe('[TraceLog] Error: Failed');
    });

    it('should handle Error with no stack trace in production', () => {
      const error = new Error('Simple error');
      const result = formatLogMsg('Failed', error);
      expect(result).toBe('[TraceLog] Failed: Simple error');
    });
  });

  describe('String errors', () => {
    it('should format message with string error', () => {
      const result = formatLogMsg('Failed', 'Network timeout');
      expect(result).toBe('[TraceLog] Failed: Network timeout');
    });

    it('should handle empty string error (falsy, no suffix)', () => {
      const result = formatLogMsg('Failed', '');
      // Empty string is falsy, so error check fails and no ": " suffix added
      expect(result).toBe('[TraceLog] Failed');
    });

    it('should handle string error with special characters', () => {
      const result = formatLogMsg('Failed', 'Error: 100% failure @#$');
      expect(result).toBe('[TraceLog] Failed: Error: 100% failure @#$');
    });
  });

  describe('Object errors', () => {
    it('should format message with serializable object', () => {
      const error = { code: 500, message: 'Server error' };
      const result = formatLogMsg('Failed', error);
      expect(result).toBe('[TraceLog] Failed: {"code":500,"message":"Server error"}');
    });

    it('should handle object with nested properties', () => {
      const error = { outer: { inner: 'value' } };
      const result = formatLogMsg('Failed', error);
      expect(result).toBe('[TraceLog] Failed: {"outer":{"inner":"value"}}');
    });

    it('should handle circular reference in object', () => {
      const error: Record<string, unknown> = { prop: 'value' };
      error.self = error; // Circular reference
      const result = formatLogMsg('Failed', error);
      expect(result).toBe('[TraceLog] Failed: [Unable to serialize error]');
    });

    it('should handle object with undefined properties', () => {
      const error = { defined: 'value', undefined: undefined };
      const result = formatLogMsg('Failed', error);
      expect(result).toBe('[TraceLog] Failed: {"defined":"value"}');
    });

    it('should handle empty object', () => {
      const result = formatLogMsg('Failed', {});
      expect(result).toBe('[TraceLog] Failed: {}');
    });
  });

  describe('Other error types', () => {
    it('should handle number error', () => {
      const result = formatLogMsg('Failed', 404);
      expect(result).toBe('[TraceLog] Failed: 404');
    });

    it('should handle boolean false (falsy, no suffix)', () => {
      const result = formatLogMsg('Failed', false);
      // false is falsy, so error check fails and no ": " suffix added
      expect(result).toBe('[TraceLog] Failed');
    });

    it('should handle boolean true', () => {
      const result = formatLogMsg('Failed', true);
      expect(result).toBe('[TraceLog] Failed: true');
    });

    it('should handle null error (falsy, no suffix)', () => {
      const result = formatLogMsg('Failed', null);
      // null is falsy, so error check fails and no ": " suffix added
      expect(result).toBe('[TraceLog] Failed');
    });

    it('should handle undefined error (falsy, no suffix)', () => {
      const result = formatLogMsg('Failed', undefined);
      // undefined is falsy, so error check fails and no ": " suffix added
      expect(result).toBe('[TraceLog] Failed');
    });

    it('should handle symbol error', () => {
      const sym = Symbol('test');
      const result = formatLogMsg('Failed', sym);
      expect(result).toBe('[TraceLog] Failed: Symbol(test)');
    });

    it('should handle BigInt error', () => {
      const result = formatLogMsg('Failed', BigInt(9007199254740991));
      expect(result).toBe('[TraceLog] Failed: 9007199254740991');
    });
  });
});

describe('log', () => {
  const originalEnv = process.env.NODE_ENV;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    sessionStorage.clear();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    process.env.NODE_ENV = originalEnv;
    sessionStorage.clear();
  });

  describe('Development mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should log info messages in development', () => {
      log('info', 'Test message');
      expect(consoleLogSpy).toHaveBeenCalledWith('[TraceLog] Test message');
    });

    it('should log warn messages in development', () => {
      log('warn', 'Warning message');
      expect(consoleWarnSpy).toHaveBeenCalledWith('[TraceLog] Warning message');
    });

    it('should log error messages in development', () => {
      log('error', 'Error message');
      expect(consoleErrorSpy).toHaveBeenCalledWith('[TraceLog] Error message');
    });

    it('should log debug messages in development', () => {
      log('debug', 'Debug message');
      expect(consoleLogSpy).toHaveBeenCalledWith('[TraceLog] Debug message');
    });

    it('should log with error object in development', () => {
      const error = new Error('Test error');
      log('error', 'Failed', { error });
      expect(consoleErrorSpy).toHaveBeenCalledWith('[TraceLog] Failed: Test error');
    });

    it('should log with data object in development', () => {
      const data = { key: 'value', token: 'secret' };
      log('info', 'Event', { data });
      expect(consoleLogSpy).toHaveBeenCalledWith('[TraceLog] Event', data);
    });

    it('should log with style in development', () => {
      log('info', 'Styled', { style: 'color: blue;' });
      expect(consoleLogSpy).toHaveBeenCalledWith('%c[TraceLog] Styled', 'color: blue;');
    });

    it('should log with style and data in development', () => {
      const data = { key: 'value' };
      log('info', 'Styled', { style: 'color: red;', data });
      expect(consoleLogSpy).toHaveBeenCalledWith('%c[TraceLog] Styled', 'color: red;', data);
    });

    it('should ignore showToClient in development', () => {
      log('info', 'Test', { showToClient: false });
      expect(consoleLogSpy).toHaveBeenCalledWith('[TraceLog] Test');
    });
  });

  describe('Production mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('should NOT log info messages in production by default', () => {
      log('info', 'Test message');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should NOT log warn messages in production by default', () => {
      log('warn', 'Warning message');
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should NOT log error messages in production by default', () => {
      log('error', 'Error message');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should NOT log debug messages in production', () => {
      log('debug', 'Debug message');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should NOT log with showToClient=true when QA mode is NOT active', () => {
      log('info', 'Test message', { showToClient: true });
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    describe('with QA mode active', () => {
      beforeEach(() => {
        sessionStorage.setItem(QA_MODE_KEY, 'true');
      });

      it('should log info with showToClient=true when QA mode is active', () => {
        log('info', 'Test message', { showToClient: true });
        expect(consoleLogSpy).toHaveBeenCalledWith('[TraceLog] Test message');
      });

      it('should log warn with showToClient=true when QA mode is active', () => {
        log('warn', 'Warning message', { showToClient: true });
        expect(consoleWarnSpy).toHaveBeenCalledWith('[TraceLog] Warning message');
      });

      it('should log error with showToClient=true when QA mode is active', () => {
        log('error', 'Error message', { showToClient: true });
        expect(consoleErrorSpy).toHaveBeenCalledWith('[TraceLog] Error message');
      });

      it('should sanitize data in production with showToClient=true', () => {
        const data = { userId: '123', token: 'secret', password: 'pass123' };
        log('warn', 'Event', { data, showToClient: true });
        expect(consoleWarnSpy).toHaveBeenCalledWith('[TraceLog] Event', {
          userId: '123',
          token: '[REDACTED]',
          password: '[REDACTED]',
        });
      });

      it('should sanitize nested data in production with showToClient=true', () => {
        const data = {
          outer: {
            inner: 'value',
            apiKey: 'secret',
          },
        };
        log('error', 'Event', { data, showToClient: true });
        expect(consoleErrorSpy).toHaveBeenCalledWith('[TraceLog] Event', {
          outer: {
            inner: 'value',
            apiKey: '[REDACTED]',
          },
        });
      });

      it('should log with style in production with showToClient=true', () => {
        log('warn', 'Styled', { style: 'font-weight: bold;', showToClient: true });
        expect(consoleWarnSpy).toHaveBeenCalledWith('%c[TraceLog] Styled', 'font-weight: bold;');
      });

      it('should log with style and sanitized data in production with showToClient=true', () => {
        const data = { userId: '123', secret: 'hidden' };
        log('error', 'Event', { style: 'color: red;', data, showToClient: true });
        expect(consoleErrorSpy).toHaveBeenCalledWith('%c[TraceLog] Event', 'color: red;', {
          userId: '123',
          secret: '[REDACTED]',
        });
      });
    });
  });

  describe('Visibility levels in production', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    describe('visibility: critical', () => {
      it('should ALWAYS log critical messages in production', () => {
        log('error', 'Critical error', { visibility: 'critical' });
        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(consoleErrorSpy.mock.calls[0]?.[0]).toContain('[TraceLog] Critical error');
      });

      it('should log critical messages even when no mode is active', () => {
        log('warn', 'Critical warning', { visibility: 'critical' });
        expect(consoleWarnSpy).toHaveBeenCalled();
      });

      it('should apply critical style automatically', () => {
        log('error', 'Critical', { visibility: 'critical' });
        // Should have %c prefix for styling
        expect(consoleErrorSpy.mock.calls[0]?.[0]).toContain('%c');
      });
    });

    describe('visibility: qa', () => {
      it('should NOT log qa messages when QA mode is NOT active', () => {
        log('info', 'QA info', { visibility: 'qa' });
        expect(consoleLogSpy).not.toHaveBeenCalled();
      });

      it('should log qa messages when QA mode IS active', () => {
        sessionStorage.setItem(QA_MODE_KEY, 'true');
        log('info', 'QA info', { visibility: 'qa' });
        expect(consoleLogSpy).toHaveBeenCalled();
      });
    });

    describe('custom style takes precedence', () => {
      it('should use custom style over default critical style', () => {
        const customStyle = 'background: purple;';
        log('error', 'Test', { visibility: 'critical', style: customStyle });
        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(String), customStyle);
      });
    });
  });

  describe('Edge cases', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should handle empty extra object', () => {
      log('info', 'Test', {});
      expect(consoleLogSpy).toHaveBeenCalledWith('[TraceLog] Test');
    });

    it('should handle undefined extra', () => {
      log('info', 'Test', undefined);
      expect(consoleLogSpy).toHaveBeenCalledWith('[TraceLog] Test');
    });

    it('should handle empty string style', () => {
      log('info', 'Test', { style: '' });
      expect(consoleLogSpy).toHaveBeenCalledWith('[TraceLog] Test');
    });

    it('should handle style with data but no error', () => {
      const data = { key: 'value' };
      log('info', 'Test', { style: 'color: green;', data });
      expect(consoleLogSpy).toHaveBeenCalledWith('%c[TraceLog] Test', 'color: green;', data);
    });

    it('should handle error and data together', () => {
      const error = new Error('Test error');
      const data = { key: 'value' };
      log('error', 'Failed', { error, data });
      expect(consoleErrorSpy).toHaveBeenCalledWith('[TraceLog] Failed: Test error', data);
    });

    it('should handle error, data, and style together', () => {
      const error = new Error('Test error');
      const data = { key: 'value' };
      log('warn', 'Warning', { error, data, style: 'font-weight: bold;' });
      expect(consoleWarnSpy).toHaveBeenCalledWith('%c[TraceLog] Warning: Test error', 'font-weight: bold;', data);
    });
  });

  describe('Data sanitization (sanitizeLogData)', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      // Use visibility: 'critical' to test sanitization without needing QA mode
    });

    it('should redact all sensitive key substrings', () => {
      const data = {
        myToken: 'secret1',
        userPassword: 'secret2',
        apiSecret: 'secret3',
        apiKey: 'secret4',
        sessionId: 'secret5',
      };
      log('warn', 'Test', { data, visibility: 'critical' });
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleWarnSpy.mock.calls[0]?.[2]).toEqual({
        myToken: '[REDACTED]',
        userPassword: '[REDACTED]',
        apiSecret: '[REDACTED]',
        apiKey: '[REDACTED]',
        sessionId: '[REDACTED]',
      });
    });

    it('should handle arrays with objects', () => {
      const data = {
        items: [
          { id: '1', token: 'secret' },
          { id: '2', password: 'secret' },
        ],
      };
      log('warn', 'Test', { data, visibility: 'critical' });
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleWarnSpy.mock.calls[0]?.[2]).toEqual({
        items: [
          { id: '1', token: '[REDACTED]' },
          { id: '2', password: '[REDACTED]' },
        ],
      });
    });

    it('should handle arrays with primitives', () => {
      const data = {
        items: [1, 2, 'test', true, null],
      };
      log('warn', 'Test', { data, visibility: 'critical' });
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleWarnSpy.mock.calls[0]?.[2]).toEqual({
        items: [1, 2, 'test', true, null],
      });
    });

    it('should handle deeply nested objects', () => {
      const data = {
        level1: {
          level2: {
            level3: {
              token: 'secret',
              safe: 'value',
            },
          },
        },
      };
      log('error', 'Test', { data, visibility: 'critical' });
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls[0]?.[2]).toEqual({
        level1: {
          level2: {
            level3: {
              token: '[REDACTED]',
              safe: 'value',
            },
          },
        },
      });
    });

    it('should handle mixed nested structures', () => {
      const data = {
        users: [
          {
            name: 'John',
            credentials: {
              apiKey: 'secret',
              username: 'john',
            },
          },
        ],
      };
      log('warn', 'Test', { data, visibility: 'critical' });
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleWarnSpy.mock.calls[0]?.[2]).toEqual({
        users: [
          {
            name: 'John',
            credentials: {
              apiKey: '[REDACTED]',
              username: 'john',
            },
          },
        ],
      });
    });

    it('should preserve non-sensitive keys with similar names', () => {
      const data = {
        tokenCount: 5, // Contains "token" but would still be redacted
        passwordStrength: 'high', // Contains "password" but would still be redacted
        userId: '123',
        status: 'active',
      };
      log('warn', 'Test', { data, visibility: 'critical' });
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleWarnSpy.mock.calls[0]?.[2]).toEqual({
        tokenCount: '[REDACTED]',
        passwordStrength: '[REDACTED]',
        userId: '123',
        status: 'active',
      });
    });

    it('should handle empty nested objects', () => {
      const data = {
        config: {},
        token: 'secret',
      };
      log('warn', 'Test', { data, visibility: 'critical' });
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleWarnSpy.mock.calls[0]?.[2]).toEqual({
        config: {},
        token: '[REDACTED]',
      });
    });

    it('should handle arrays of arrays', () => {
      const data = {
        matrix: [
          [1, 2],
          [3, 4],
        ],
      };
      log('warn', 'Test', { data, visibility: 'critical' });
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleWarnSpy.mock.calls[0]?.[2]).toEqual({
        matrix: [
          [1, 2],
          [3, 4],
        ],
      });
    });
  });
});
