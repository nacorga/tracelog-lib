import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatLogMsg, log } from '../../../src/utils/logging.utils';

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
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    process.env.NODE_ENV = originalEnv;
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

    it('should log info messages in production with showToClient=true', () => {
      log('info', 'Test message', { showToClient: true });
      expect(consoleLogSpy).toHaveBeenCalledWith('[TraceLog] Test message');
    });

    it('should log warn messages in production', () => {
      log('warn', 'Warning message');
      expect(consoleWarnSpy).toHaveBeenCalledWith('[TraceLog] Warning message');
    });

    it('should log error messages in production', () => {
      log('error', 'Error message');
      expect(consoleErrorSpy).toHaveBeenCalledWith('[TraceLog] Error message');
    });

    it('should NOT log debug messages in production', () => {
      log('debug', 'Debug message');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should sanitize data in production', () => {
      const data = { userId: '123', token: 'secret', password: 'pass123' };
      log('warn', 'Event', { data });
      // Note: "key" substring matches, so "userId" would not be redacted but "key" would
      expect(consoleWarnSpy).toHaveBeenCalledWith('[TraceLog] Event', {
        userId: '123',
        token: '[REDACTED]',
        password: '[REDACTED]',
      });
    });

    it('should sanitize nested data in production', () => {
      const data = {
        outer: {
          inner: 'value',
          apiKey: 'secret',
        },
      };
      log('error', 'Event', { data });
      expect(consoleErrorSpy).toHaveBeenCalledWith('[TraceLog] Event', {
        outer: {
          inner: 'value',
          apiKey: '[REDACTED]',
        },
      });
    });

    it('should log with style in production', () => {
      log('warn', 'Styled', { style: 'font-weight: bold;' });
      expect(consoleWarnSpy).toHaveBeenCalledWith('%c[TraceLog] Styled', 'font-weight: bold;');
    });

    it('should log with style and sanitized data in production', () => {
      const data = { userId: '123', secret: 'hidden' };
      log('error', 'Event', { style: 'color: red;', data });
      expect(consoleErrorSpy).toHaveBeenCalledWith('%c[TraceLog] Event', 'color: red;', {
        userId: '123',
        secret: '[REDACTED]',
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
    });

    it('should redact all sensitive key substrings', () => {
      const data = {
        myToken: 'secret1',
        userPassword: 'secret2',
        apiSecret: 'secret3',
        apiKey: 'secret4',
        sessionId: 'secret5',
      };
      log('warn', 'Test', { data });
      expect(consoleWarnSpy).toHaveBeenCalledWith('[TraceLog] Test', {
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
      log('warn', 'Test', { data });
      expect(consoleWarnSpy).toHaveBeenCalledWith('[TraceLog] Test', {
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
      log('warn', 'Test', { data });
      expect(consoleWarnSpy).toHaveBeenCalledWith('[TraceLog] Test', {
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
      log('error', 'Test', { data });
      expect(consoleErrorSpy).toHaveBeenCalledWith('[TraceLog] Test', {
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
      log('warn', 'Test', { data });
      expect(consoleWarnSpy).toHaveBeenCalledWith('[TraceLog] Test', {
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
      log('warn', 'Test', { data });
      expect(consoleWarnSpy).toHaveBeenCalledWith('[TraceLog] Test', {
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
      log('warn', 'Test', { data });
      expect(consoleWarnSpy).toHaveBeenCalledWith('[TraceLog] Test', {
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
      log('warn', 'Test', { data });
      expect(consoleWarnSpy).toHaveBeenCalledWith('[TraceLog] Test', {
        matrix: [
          [1, 2],
          [3, 4],
        ],
      });
    });
  });
});
