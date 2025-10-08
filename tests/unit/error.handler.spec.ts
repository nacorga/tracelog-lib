/**
 * ErrorHandler Unit Tests
 *
 * Tests error tracking functionality to detect library defects:
 * - PII patterns are correctly sanitized
 * - Error sampling respects configured rate
 * - Duplicate errors are suppressed within 5s window
 * - Long error messages are truncated
 * - Different error types are handled correctly
 *
 * Focus: Detect PII leaks and error handling defects
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ErrorHandler } from '../../src/handlers/error.handler';
import { EventManager } from '../../src/managers/event.manager';
import { StorageManager } from '../../src/managers/storage.manager';
import { EventType, ErrorType } from '../../src/types';
import { setupTestState, createTestConfig } from '../utils/test-setup';

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;
  let eventManager: EventManager;
  let storageManager: StorageManager;

  beforeEach(() => {
    vi.clearAllMocks();
    setupTestState(
      createTestConfig({
        samplingRate: 1,
        errorSampling: 1, // Capture all errors by default for testing
      }),
    );
    storageManager = new StorageManager();
    eventManager = new EventManager(storageManager);
    errorHandler = new ErrorHandler(eventManager);
  });

  afterEach(() => {
    errorHandler.stopTracking();
    eventManager.stop();
    vi.restoreAllMocks();
  });

  describe('PII Sanitization', () => {
    it('should sanitize email addresses', () => {
      const message = 'User test@example.com failed authentication';
      const sanitized = errorHandler['sanitize'](message);

      expect(sanitized).toContain('[REDACTED]');
      expect(sanitized).not.toContain('test@example.com');
    });

    it('should sanitize multiple emails in same message', () => {
      const message = 'Failed to send from admin@company.com to user@domain.org';
      const sanitized = errorHandler['sanitize'](message);

      expect(sanitized).toContain('[REDACTED]');
      expect(sanitized).not.toContain('admin@company.com');
      expect(sanitized).not.toContain('user@domain.org');
    });

    it('should sanitize API tokens', () => {
      const message = 'Invalid API token: sk_test_abc123xyz456def789';
      const sanitized = errorHandler['sanitize'](message);

      expect(sanitized).toContain('[REDACTED]');
      expect(sanitized).not.toContain('sk_test_abc123xyz456def789');
    });

    it('should sanitize credit card numbers', () => {
      const message = 'Payment failed for card 4532-1234-5678-9010';
      const sanitized = errorHandler['sanitize'](message);

      expect(sanitized).toContain('[REDACTED]');
      expect(sanitized).not.toContain('4532-1234-5678-9010');
    });

    it('should sanitize Bearer tokens', () => {
      const message = 'Auth failed: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const sanitized = errorHandler['sanitize'](message);

      expect(sanitized).toContain('[REDACTED]');
      expect(sanitized).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
    });

    it('should sanitize passwords in URLs', () => {
      const message = 'Connection failed: postgresql://user:password123@localhost:5432/db';
      const sanitized = errorHandler['sanitize'](message);

      expect(sanitized).toContain('[REDACTED]');
      expect(sanitized).not.toContain('password123');
    });

    it('should handle text without PII', () => {
      const message = 'Network request failed: timeout after 5000ms';
      const sanitized = errorHandler['sanitize'](message);

      expect(sanitized).toBe(message); // No changes
    });

    it('should preserve error context after sanitization', () => {
      const message = 'User test@example.com failed at line 42';
      const sanitized = errorHandler['sanitize'](message);

      expect(sanitized).toContain('User');
      expect(sanitized).toContain('failed at line 42');
      expect(sanitized).toContain('[REDACTED]');
    });
  });

  describe('Error Sampling', () => {
    it('should sample all errors with rate 1', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.99);

      const result = errorHandler['shouldSample']();

      expect(result).toBe(true);
    });

    it('should sample no errors with rate 0', () => {
      setupTestState(
        createTestConfig({
          errorSampling: 0,
        }),
      );

      vi.spyOn(Math, 'random').mockReturnValue(0.01);

      const result = errorHandler['shouldSample']();

      expect(result).toBe(false);
    });

    it('should respect sampling rate of 0.1 (10%)', () => {
      setupTestState(
        createTestConfig({
          errorSampling: 0.1,
        }),
      );

      // Mock random to alternate between sampled and not sampled
      let callCount = 0;
      vi.spyOn(Math, 'random').mockImplementation(() => {
        callCount++;
        return callCount % 10 === 1 ? 0.05 : 0.95; // 10% sampled
      });

      const results = Array.from({ length: 10 }, () => errorHandler['shouldSample']());
      const sampledCount = results.filter((r) => r).length;

      expect(sampledCount).toBe(1); // 10% of 10 = 1
    });

    it('should use default sampling rate when not configured', () => {
      setupTestState(
        createTestConfig({
          // errorSampling not set, default should be used
        }),
      );

      vi.spyOn(Math, 'random').mockReturnValue(0.05);

      // Default should be 0.1 (10%)
      const result = errorHandler['shouldSample']();

      expect(result).toBe(true);
    });
  });

  describe('Error Suppression', () => {
    it('should suppress duplicate errors within 5 second window', () => {
      vi.useFakeTimers();

      const errorMessage = 'Test error message';

      // First occurrence
      const first = errorHandler['shouldSuppressError'](ErrorType.JS_ERROR, errorMessage);
      expect(first).toBe(false); // Not suppressed

      // Advance 2 seconds
      vi.advanceTimersByTime(2000);

      // Second occurrence (within window)
      const second = errorHandler['shouldSuppressError'](ErrorType.JS_ERROR, errorMessage);
      expect(second).toBe(true); // Suppressed

      vi.useRealTimers();
    });

    it('should NOT suppress after 5 second window passes', () => {
      vi.useFakeTimers();

      const errorMessage = 'Test error message';

      // First occurrence
      errorHandler['shouldSuppressError'](ErrorType.JS_ERROR, errorMessage);

      // Advance past suppression window (5 seconds)
      vi.advanceTimersByTime(6000);

      // Should not be suppressed
      const result = errorHandler['shouldSuppressError'](ErrorType.JS_ERROR, errorMessage);
      expect(result).toBe(false);

      vi.useRealTimers();
    });

    it('should NOT suppress different error messages', () => {
      const error1 = 'First error';
      const error2 = 'Second error';

      errorHandler['shouldSuppressError'](ErrorType.JS_ERROR, error1);
      const result = errorHandler['shouldSuppressError'](ErrorType.JS_ERROR, error2);

      expect(result).toBe(false); // Different error, not suppressed
    });

    it('should NOT suppress same message with different error types', () => {
      const message = 'Same message';

      errorHandler['shouldSuppressError'](ErrorType.JS_ERROR, message);
      const result = errorHandler['shouldSuppressError'](ErrorType.PROMISE_REJECTION, message);

      expect(result).toBe(false); // Different type, not suppressed
    });

    it('should track multiple different errors concurrently', () => {
      const errors = ['Error 1', 'Error 2', 'Error 3'];

      errors.forEach((error) => {
        const result = errorHandler['shouldSuppressError'](ErrorType.JS_ERROR, error);
        expect(result).toBe(false); // All different, none suppressed
      });

      expect(errorHandler['recentErrors'].size).toBe(3);
    });

    it('should prune old errors when limit exceeded', () => {
      // Generate many different errors to exceed MAX_TRACKED_ERRORS (likely 100)
      for (let i = 0; i < 150; i++) {
        errorHandler['shouldSuppressError'](ErrorType.JS_ERROR, `Error ${i}`);
      }

      // Should not exceed max limit
      expect(errorHandler['recentErrors'].size).toBeLessThanOrEqual(100);
    });
  });

  describe('Error Message Truncation', () => {
    it('should truncate very long error messages', () => {
      const longMessage = 'Error: '.repeat(500); // Very long message
      const sanitized = errorHandler['sanitize'](longMessage);

      // Should be truncated (MAX_ERROR_MESSAGE_LENGTH likely 1000 or 2000)
      expect(sanitized.length).toBeLessThan(longMessage.length);
      expect(sanitized).toContain('...');
    });

    it('should NOT truncate short messages', () => {
      const shortMessage = 'Short error message';
      const sanitized = errorHandler['sanitize'](shortMessage);

      expect(sanitized).toBe(shortMessage);
      expect(sanitized).not.toContain('...');
    });
  });

  describe('JS Error Handling', () => {
    it('should track JS errors when sampling allows', () => {
      const trackSpy = vi.spyOn(eventManager, 'track');

      errorHandler.startTracking();

      // Trigger error event
      const errorEvent = new ErrorEvent('error', {
        message: 'Test JS error',
        filename: 'test.js',
        lineno: 42,
        colno: 10,
      });

      window.dispatchEvent(errorEvent);

      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventType.ERROR,
          error_data: expect.objectContaining({
            type: ErrorType.JS_ERROR,
            message: expect.stringContaining('Test JS error'),
            filename: 'test.js',
            line: 42,
            column: 10,
          }),
        }),
      );
    });

    it('should NOT track errors when sampling rate is 0', () => {
      setupTestState(
        createTestConfig({
          errorSampling: 0,
        }),
      );

      const trackSpy = vi.spyOn(eventManager, 'track');

      errorHandler.startTracking();

      window.dispatchEvent(
        new ErrorEvent('error', {
          message: 'Test error',
        }),
      );

      expect(trackSpy).not.toHaveBeenCalled();
    });

    it('should sanitize PII in tracked errors', () => {
      const trackSpy = vi.spyOn(eventManager, 'track');

      errorHandler.startTracking();

      window.dispatchEvent(
        new ErrorEvent('error', {
          message: 'Failed for user test@example.com',
        }),
      );

      const call = trackSpy.mock.calls[0][0];
      expect(call.error_data?.message).toContain('[REDACTED]');
      expect(call.error_data?.message).not.toContain('test@example.com');
    });
  });

  describe('Promise Rejection Handling', () => {
    it('should track unhandled promise rejections', () => {
      const trackSpy = vi.spyOn(eventManager, 'track');

      errorHandler.startTracking();

      const promise = Promise.reject('Test rejection');
      promise.catch(() => {}); // Suppress unhandled rejection in test
      const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
        promise,
        reason: 'Test rejection reason',
      });

      window.dispatchEvent(rejectionEvent);

      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventType.ERROR,
          error_data: expect.objectContaining({
            type: ErrorType.PROMISE_REJECTION,
            message: expect.stringContaining('Test rejection'),
          }),
        }),
      );
    });

    it('should extract message from Error object', () => {
      const trackSpy = vi.spyOn(eventManager, 'track');

      errorHandler.startTracking();

      const error = new Error('Promise error message');
      const promise = Promise.reject(error);
      promise.catch(() => {}); // Suppress unhandled rejection in test
      const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
        promise,
        reason: error,
      });

      window.dispatchEvent(rejectionEvent);

      const call = trackSpy.mock.calls[0][0];
      expect(call.error_data?.message).toContain('Promise error message');
    });

    it('should handle rejection with object reason', () => {
      const trackSpy = vi.spyOn(eventManager, 'track');

      errorHandler.startTracking();

      const promise = Promise.reject({ message: 'Object error' });
      promise.catch(() => {}); // Suppress unhandled rejection in test
      const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
        promise,
        reason: { message: 'Object error' },
      });

      window.dispatchEvent(rejectionEvent);

      expect(trackSpy).toHaveBeenCalled();
    });

    it('should handle rejection with null reason', () => {
      const trackSpy = vi.spyOn(eventManager, 'track');

      errorHandler.startTracking();

      const promise = Promise.reject(null);
      promise.catch(() => {}); // Suppress unhandled rejection in test
      const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
        promise,
        reason: null,
      });

      window.dispatchEvent(rejectionEvent);

      const call = trackSpy.mock.calls[0][0];
      expect(call.error_data?.message).toBe('Unknown rejection');
    });
  });

  describe('Cleanup', () => {
    it('should remove error listeners on stopTracking', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      errorHandler.startTracking();
      errorHandler.stopTracking();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
    });

    it('should clear recent errors on stopTracking', () => {
      errorHandler.startTracking();

      // Add some errors
      errorHandler['shouldSuppressError'](ErrorType.JS_ERROR, 'Error 1');
      errorHandler['shouldSuppressError'](ErrorType.JS_ERROR, 'Error 2');

      expect(errorHandler['recentErrors'].size).toBe(2);

      errorHandler.stopTracking();

      expect(errorHandler['recentErrors'].size).toBe(0);
    });

    it('should not throw when stopping without starting', () => {
      expect(() => errorHandler.stopTracking()).not.toThrow();
    });
  });
});
