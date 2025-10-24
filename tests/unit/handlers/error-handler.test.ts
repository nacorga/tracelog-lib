/**
 * ErrorHandler Tests
 * Focus: JavaScript error tracking
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';
import { ErrorHandler } from '../../../src/handlers/error.handler';
import { EventManager } from '../../../src/managers/event.manager';
import { EventType, ErrorType } from '../../../src/types';
import { StorageManager } from '../../../src/managers/storage.manager';
import { getGlobalState } from '../../../src/managers/state.manager';

describe('ErrorHandler - Error Tracking', () => {
  let errorHandler: ErrorHandler;
  let eventManager: EventManager;
  let trackSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    setupTestEnvironment();

    const storageManager = new StorageManager();
    eventManager = new EventManager(storageManager);
    trackSpy = vi.spyOn(eventManager, 'track');

    errorHandler = new ErrorHandler(eventManager);
    errorHandler.startTracking();
  });

  afterEach(() => {
    errorHandler.stopTracking();
    cleanupTestEnvironment();
  });

  it('should track error events', () => {
    const errorEvent = new ErrorEvent('error', {
      message: 'Test error message',
      filename: 'app.js',
      lineno: 42,
      colno: 10,
    });

    window.dispatchEvent(errorEvent);

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: EventType.ERROR,
        error_data: expect.objectContaining({
          type: ErrorType.JS_ERROR,
          message: 'Test error message',
          filename: 'app.js',
          line: 42,
          column: 10,
        }),
      }),
    );
  });

  it('should track unhandledrejection events', () => {
    const promise = Promise.reject('Test rejection');
    promise.catch(() => {});

    const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
      promise,
      reason: 'Test rejection',
    });

    window.dispatchEvent(rejectionEvent);

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: EventType.ERROR,
        error_data: expect.objectContaining({
          type: ErrorType.PROMISE_REJECTION,
          message: 'Test rejection',
        }),
      }),
    );
  });

  it('should capture error message', () => {
    const errorEvent = new ErrorEvent('error', {
      message: 'Custom error message',
    });

    window.dispatchEvent(errorEvent);

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        error_data: expect.objectContaining({
          message: 'Custom error message',
        }),
      }),
    );
  });

  it('should capture error stack trace', () => {
    const error = new Error('Stack trace test');
    const promise = Promise.reject(error);
    promise.catch(() => {});

    const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
      promise,
      reason: error,
    });

    window.dispatchEvent(rejectionEvent);

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        error_data: expect.objectContaining({
          message: expect.stringContaining('Stack trace test'),
        }),
      }),
    );
  });

  it('should capture error type', () => {
    const errorEvent = new ErrorEvent('error', {
      message: 'Type test',
    });

    window.dispatchEvent(errorEvent);

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        error_data: expect.objectContaining({
          type: ErrorType.JS_ERROR,
        }),
      }),
    );
  });

  it('should capture filename', () => {
    const errorEvent = new ErrorEvent('error', {
      message: 'File test',
      filename: 'main.js',
    });

    window.dispatchEvent(errorEvent);

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        error_data: expect.objectContaining({
          filename: 'main.js',
        }),
      }),
    );
  });

  it('should capture line number', () => {
    const errorEvent = new ErrorEvent('error', {
      message: 'Line test',
      lineno: 123,
    });

    window.dispatchEvent(errorEvent);

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        error_data: expect.objectContaining({
          line: 123,
        }),
      }),
    );
  });

  it('should capture column number', () => {
    const errorEvent = new ErrorEvent('error', {
      message: 'Column test',
      colno: 45,
    });

    window.dispatchEvent(errorEvent);

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        error_data: expect.objectContaining({
          column: 45,
        }),
      }),
    );
  });
});

describe('ErrorHandler - PII Sanitization', () => {
  let errorHandler: ErrorHandler;
  let eventManager: EventManager;
  let trackSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    setupTestEnvironment();

    const storageManager = new StorageManager();
    eventManager = new EventManager(storageManager);
    trackSpy = vi.spyOn(eventManager, 'track');

    errorHandler = new ErrorHandler(eventManager);
    errorHandler.startTracking();
  });

  afterEach(() => {
    errorHandler.stopTracking();
    cleanupTestEnvironment();
  });

  it('should sanitize emails from error messages', () => {
    const errorEvent = new ErrorEvent('error', {
      message: 'User email: user@example.com failed to authenticate',
    });

    window.dispatchEvent(errorEvent);

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        error_data: expect.objectContaining({
          message: 'User email: [REDACTED] failed to authenticate',
        }),
      }),
    );
  });

  it('should sanitize phone numbers from error messages', () => {
    const errorEvent = new ErrorEvent('error', {
      message: 'Contact at 555-123-4567 for support',
    });

    window.dispatchEvent(errorEvent);

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        error_data: expect.objectContaining({
          message: 'Contact at [REDACTED] for support',
        }),
      }),
    );
  });

  it('should sanitize API keys from stack traces', () => {
    const errorEvent = new ErrorEvent('error', {
      message: 'API key sk_test_1234567890abcdefgh is invalid',
    });

    window.dispatchEvent(errorEvent);

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        error_data: expect.objectContaining({
          message: 'API key [REDACTED] is invalid',
        }),
      }),
    );
  });

  it('should sanitize tokens from error messages', () => {
    const errorEvent = new ErrorEvent('error', {
      message: 'Authorization failed: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0',
    });

    window.dispatchEvent(errorEvent);

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        error_data: expect.objectContaining({
          message: 'Authorization failed: [REDACTED]',
        }),
      }),
    );
  });
});

describe('ErrorHandler - Sampling', () => {
  let errorHandler: ErrorHandler;
  let eventManager: EventManager;
  let trackSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    errorHandler?.stopTracking();
    cleanupTestEnvironment();
  });

  it('should sample errors at configured rate', () => {
    const storageManager = new StorageManager();
    eventManager = new EventManager(storageManager);
    trackSpy = vi.spyOn(eventManager, 'track');

    errorHandler = new ErrorHandler(eventManager);

    (getGlobalState() as any).config = { errorSampling: 0 };

    errorHandler.startTracking();

    const errorEvent = new ErrorEvent('error', {
      message: 'Test error',
    });

    window.dispatchEvent(errorEvent);

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('should default to 100% sampling', () => {
    const storageManager = new StorageManager();
    eventManager = new EventManager(storageManager);
    trackSpy = vi.spyOn(eventManager, 'track');

    errorHandler = new ErrorHandler(eventManager);
    errorHandler.startTracking();

    const errorEvent = new ErrorEvent('error', {
      message: 'Test error',
    });

    window.dispatchEvent(errorEvent);

    expect(trackSpy).toHaveBeenCalled();
  });

  it('should apply errorSampling from config', () => {
    const storageManager = new StorageManager();
    eventManager = new EventManager(storageManager);
    trackSpy = vi.spyOn(eventManager, 'track');

    errorHandler = new ErrorHandler(eventManager);

    (getGlobalState() as any).config = { errorSampling: 0.5 };

    errorHandler.startTracking();

    vi.spyOn(Math, 'random').mockReturnValue(0.3);

    const errorEvent1 = new ErrorEvent('error', {
      message: 'Test error 1',
    });
    window.dispatchEvent(errorEvent1);
    expect(trackSpy).toHaveBeenCalled();

    trackSpy.mockClear();
    vi.spyOn(Math, 'random').mockReturnValue(0.7);

    const errorEvent2 = new ErrorEvent('error', {
      message: 'Test error 2',
    });
    window.dispatchEvent(errorEvent2);
    expect(trackSpy).not.toHaveBeenCalled();
  });
});
