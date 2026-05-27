/**
 * ErrorHandler Tests
 * Focus: JavaScript error tracking
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';
import { ErrorHandler } from '../../../src/handlers/error.handler';
import { EventManager } from '../../../src/managers/event.manager';
import { EmitterEvent, EventType, ErrorType } from '../../../src/types';
import { StorageManager } from '../../../src/managers/storage.manager';
import { getGlobalState } from '../../../src/managers/state.manager';
import { MAX_STACK_TRACE_LENGTH, MAX_ERRORS_PER_SIGNATURE_PER_PAGEVIEW } from '../../../src/constants/error.constants';
import { Emitter } from '../../../src/utils/emitter.utils';

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

  it('should use error message (not stack) for rejection message field', () => {
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
          message: 'Stack trace test',
          stack: expect.stringContaining('Stack trace test'),
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

describe('ErrorHandler - Stack Traces', () => {
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

  it('should include stack trace from JS errors', () => {
    const error = new Error('Test error');
    const errorEvent = new ErrorEvent('error', {
      message: 'Test error',
      error,
    });

    window.dispatchEvent(errorEvent);

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        error_data: expect.objectContaining({
          type: ErrorType.JS_ERROR,
          stack: expect.stringContaining('Error: Test error'),
        }),
      }),
    );
  });

  it('should include stack trace from promise rejections', () => {
    const error = new Error('Rejection with stack');
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
          type: ErrorType.PROMISE_REJECTION,
          stack: expect.stringContaining('Error: Rejection with stack'),
        }),
      }),
    );
  });

  it('should not include stack when error has no stack', () => {
    const errorEvent = new ErrorEvent('error', {
      message: 'No stack error',
    });

    window.dispatchEvent(errorEvent);

    const call = trackSpy.mock.calls[0]?.[0] as Record<string, Record<string, unknown>> | undefined;
    expect(call?.error_data?.stack).toBeUndefined();
  });

  it('should not include stack for non-Error promise rejections', () => {
    const promise = Promise.reject('string rejection');
    promise.catch(() => {});

    const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
      promise,
      reason: 'string rejection',
    });

    window.dispatchEvent(rejectionEvent);

    const call = trackSpy.mock.calls[0]?.[0] as Record<string, Record<string, unknown>> | undefined;
    expect(call?.error_data?.stack).toBeUndefined();
  });

  it('should truncate stack traces exceeding max length', () => {
    const longStack = 'Error: test\n' + '    at someFunction (file.js:1:1)\n'.repeat(200);
    expect(longStack.length).toBeGreaterThan(MAX_STACK_TRACE_LENGTH);

    const error = new Error('Long stack');
    Object.defineProperty(error, 'stack', { value: longStack });

    const errorEvent = new ErrorEvent('error', {
      message: 'Long stack',
      error,
    });

    window.dispatchEvent(errorEvent);

    const call = trackSpy.mock.calls[0]?.[0] as Record<string, Record<string, unknown>> | undefined;
    const stack = call?.error_data?.stack as string;
    expect(stack).toBeDefined();
    expect(stack.length).toBeLessThanOrEqual(MAX_STACK_TRACE_LENGTH);
    expect(stack).toContain('...truncated');
  });

  it('should sanitize PII from stack traces', () => {
    const stackWithPii =
      'Error: auth failed\n' +
      '    at login (https://api.example.com?email=user@example.com:1:1)\n' +
      '    at fetch (Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0:2:2)';

    const error = new Error('auth failed');
    Object.defineProperty(error, 'stack', { value: stackWithPii });

    const errorEvent = new ErrorEvent('error', {
      message: 'auth failed',
      error,
    });

    window.dispatchEvent(errorEvent);

    const call = trackSpy.mock.calls[0]?.[0] as Record<string, Record<string, unknown>> | undefined;
    const stack = call?.error_data?.stack as string;
    expect(stack).toBeDefined();
    expect(stack).not.toContain('user@example.com');
    expect(stack).not.toContain('Bearer eyJ');
    expect(stack).toContain('[REDACTED]');
  });

  it('should sanitize sensitive URL query parameters from stack traces', () => {
    const stackWithParams =
      'Error: request failed\n' +
      '    at fetch (https://api.example.com/auth?token=secret123&user=bob:1:1)\n' +
      '    at init (https://api.example.com/v2?api_key=abcdef789&format=json:2:2)';

    const error = new Error('request failed');
    Object.defineProperty(error, 'stack', { value: stackWithParams });

    const errorEvent = new ErrorEvent('error', {
      message: 'request failed',
      error,
    });

    window.dispatchEvent(errorEvent);

    const call = trackSpy.mock.calls[0]?.[0] as Record<string, Record<string, unknown>> | undefined;
    const stack = call?.error_data?.stack as string;
    expect(stack).toBeDefined();
    expect(stack).not.toContain('token=secret123');
    expect(stack).not.toContain('api_key=abcdef789');
    expect(stack).toContain('[REDACTED]');
  });
});

describe('ErrorHandler - Rejection Message Extraction', () => {
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

  it('should handle unserializable rejection reasons', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    const promise = Promise.reject(circular);
    promise.catch(() => {});

    const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
      promise,
      reason: circular,
    });

    window.dispatchEvent(rejectionEvent);

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        error_data: expect.objectContaining({
          message: 'Unserializable rejection',
        }),
      }),
    );
  });

  it('should handle null rejection reason', () => {
    const promise = Promise.reject(null);
    promise.catch(() => {});

    const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
      promise,
      reason: null,
    });

    window.dispatchEvent(rejectionEvent);

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        error_data: expect.objectContaining({
          message: 'Unknown rejection',
        }),
      }),
    );
  });
});

describe('ErrorHandler - Per-Pageview Signature Throttle', () => {
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

  function fireErrorWithVariation(idx: number): void {
    // Distinct numeric content bypasses the 5s identical-message suppression window,
    // but the normalized signature collapses both to `failed to load [n]` so the cap applies.
    window.dispatchEvent(
      new ErrorEvent('error', {
        message: `Failed to load 1${String(idx).padStart(4, '0')}`,
        filename: 'app.js',
        lineno: 42,
      }),
    );
  }

  it('drops events that share a signature after the per-pageview cap', () => {
    for (let i = 1; i <= 6; i += 1) {
      fireErrorWithVariation(i);
    }

    const calls = trackSpy.mock.calls.filter((call) => {
      const event = call[0] as { type?: EventType };
      return event.type === EventType.ERROR;
    });
    expect(calls).toHaveLength(MAX_ERRORS_PER_SIGNATURE_PER_PAGEVIEW);
  });

  it('lets the 3rd error pass and drops the 4th (boundary)', () => {
    fireErrorWithVariation(1);
    fireErrorWithVariation(2);
    fireErrorWithVariation(3);
    expect(trackSpy).toHaveBeenCalledTimes(3);

    trackSpy.mockClear();
    fireErrorWithVariation(4);
    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('does not throttle errors with distinct signatures', () => {
    window.dispatchEvent(new ErrorEvent('error', { message: 'Boom A', filename: 'a.js', lineno: 1 }));
    window.dispatchEvent(new ErrorEvent('error', { message: 'Boom B', filename: 'b.js', lineno: 1 }));
    window.dispatchEvent(new ErrorEvent('error', { message: 'Boom C', filename: 'c.js', lineno: 1 }));
    window.dispatchEvent(new ErrorEvent('error', { message: 'Boom D', filename: 'd.js', lineno: 1 }));
    window.dispatchEvent(new ErrorEvent('error', { message: 'Boom E', filename: 'e.js', lineno: 1 }));

    expect(trackSpy).toHaveBeenCalledTimes(5);
  });

  it('resets the counter on pagehide', () => {
    fireErrorWithVariation(1);
    fireErrorWithVariation(2);
    fireErrorWithVariation(3);
    fireErrorWithVariation(4);
    expect(trackSpy).toHaveBeenCalledTimes(3);

    window.dispatchEvent(new Event('pagehide'));

    trackSpy.mockClear();
    fireErrorWithVariation(5);
    fireErrorWithVariation(6);
    fireErrorWithVariation(7);
    expect(trackSpy).toHaveBeenCalledTimes(3);
  });

  it('resets the counter when resetPageviewCounter() is called directly', () => {
    fireErrorWithVariation(1);
    fireErrorWithVariation(2);
    fireErrorWithVariation(3);
    fireErrorWithVariation(4);
    expect(trackSpy).toHaveBeenCalledTimes(3);

    errorHandler.resetPageviewCounter();
    trackSpy.mockClear();

    fireErrorWithVariation(5);
    expect(trackSpy).toHaveBeenCalledTimes(1);
  });

  it('clears the counter on stopTracking so a restart starts from zero', () => {
    fireErrorWithVariation(1);
    fireErrorWithVariation(2);
    fireErrorWithVariation(3);
    fireErrorWithVariation(4);
    expect(trackSpy).toHaveBeenCalledTimes(3);

    errorHandler.stopTracking();
    errorHandler.startTracking();
    trackSpy.mockClear();

    fireErrorWithVariation(5);
    fireErrorWithVariation(6);
    fireErrorWithVariation(7);
    expect(trackSpy).toHaveBeenCalledTimes(3);
  });

  it('resets the counter when SESSION_START is observed via the emitter', () => {
    const emitter = new Emitter();
    const storageManager = new StorageManager();
    const localEventManager = new EventManager(storageManager);
    const localTrackSpy = vi.spyOn(localEventManager, 'track');

    const localHandler = new ErrorHandler(localEventManager, emitter);
    localHandler.startTracking();

    try {
      window.dispatchEvent(new ErrorEvent('error', { message: 'Boom 11111', filename: 'app.js', lineno: 1 }));
      window.dispatchEvent(new ErrorEvent('error', { message: 'Boom 22222', filename: 'app.js', lineno: 1 }));
      window.dispatchEvent(new ErrorEvent('error', { message: 'Boom 33333', filename: 'app.js', lineno: 1 }));
      window.dispatchEvent(new ErrorEvent('error', { message: 'Boom 44444', filename: 'app.js', lineno: 1 }));
      expect(localTrackSpy).toHaveBeenCalledTimes(3);

      // Simulate a new session being broadcast through the emitter (mirrors SessionManager.track flow).
      emitter.emit(EmitterEvent.EVENT, {
        id: 'evt-1',
        type: EventType.SESSION_START,
        page_url: 'https://example.com',
        timestamp: Date.now(),
      } as never);

      localTrackSpy.mockClear();
      window.dispatchEvent(new ErrorEvent('error', { message: 'Boom 55555', filename: 'app.js', lineno: 1 }));
      window.dispatchEvent(new ErrorEvent('error', { message: 'Boom 66666', filename: 'app.js', lineno: 1 }));
      window.dispatchEvent(new ErrorEvent('error', { message: 'Boom 77777', filename: 'app.js', lineno: 1 }));
      expect(localTrackSpy).toHaveBeenCalledTimes(3);
    } finally {
      localHandler.stopTracking();
    }
  });

  it('does not subscribe to the emitter when none is provided (no SESSION_START reset)', () => {
    // Reusing the suite-level `errorHandler` (no emitter): firing 4 errors with the same
    // signature should still cap at 3 even though SESSION_START events would normally reset.
    fireErrorWithVariation(1);
    fireErrorWithVariation(2);
    fireErrorWithVariation(3);
    fireErrorWithVariation(4);
    expect(trackSpy).toHaveBeenCalledTimes(3);
  });

  it('resets the counter when PAGE_VIEW is observed via the emitter (SPA navigation)', () => {
    const emitter = new Emitter();
    const storageManager = new StorageManager();
    const localEventManager = new EventManager(storageManager);
    const localTrackSpy = vi.spyOn(localEventManager, 'track');

    const localHandler = new ErrorHandler(localEventManager, emitter);
    localHandler.startTracking();

    try {
      window.dispatchEvent(new ErrorEvent('error', { message: 'Boom 11111', filename: 'app.js', lineno: 1 }));
      window.dispatchEvent(new ErrorEvent('error', { message: 'Boom 22222', filename: 'app.js', lineno: 1 }));
      window.dispatchEvent(new ErrorEvent('error', { message: 'Boom 33333', filename: 'app.js', lineno: 1 }));
      window.dispatchEvent(new ErrorEvent('error', { message: 'Boom 44444', filename: 'app.js', lineno: 1 }));
      expect(localTrackSpy).toHaveBeenCalledTimes(3);

      // Simulate an SPA route change being broadcast through the emitter
      // (mirrors PageViewHandler.trackCurrentPage → EventManager.track flow).
      emitter.emit(EmitterEvent.EVENT, {
        id: 'evt-pv-1',
        type: EventType.PAGE_VIEW,
        page_url: 'https://example.com/route-2',
        timestamp: Date.now(),
      } as never);

      localTrackSpy.mockClear();
      window.dispatchEvent(new ErrorEvent('error', { message: 'Boom 55555', filename: 'app.js', lineno: 1 }));
      window.dispatchEvent(new ErrorEvent('error', { message: 'Boom 66666', filename: 'app.js', lineno: 1 }));
      window.dispatchEvent(new ErrorEvent('error', { message: 'Boom 77777', filename: 'app.js', lineno: 1 }));
      expect(localTrackSpy).toHaveBeenCalledTimes(3);
    } finally {
      localHandler.stopTracking();
    }
  });

  it('ignores non-reset event types observed via the emitter', () => {
    const emitter = new Emitter();
    const storageManager = new StorageManager();
    const localEventManager = new EventManager(storageManager);
    const localTrackSpy = vi.spyOn(localEventManager, 'track');

    const localHandler = new ErrorHandler(localEventManager, emitter);
    localHandler.startTracking();

    try {
      window.dispatchEvent(new ErrorEvent('error', { message: 'Boom 11111', filename: 'app.js', lineno: 1 }));
      window.dispatchEvent(new ErrorEvent('error', { message: 'Boom 22222', filename: 'app.js', lineno: 1 }));
      window.dispatchEvent(new ErrorEvent('error', { message: 'Boom 33333', filename: 'app.js', lineno: 1 }));
      expect(localTrackSpy).toHaveBeenCalledTimes(3);

      // A CUSTOM event flowing through the emitter must NOT reset the counter —
      // only SESSION_START and PAGE_VIEW are reset triggers.
      emitter.emit(EmitterEvent.EVENT, {
        id: 'evt-custom-1',
        type: EventType.CUSTOM,
        custom_event: { name: 'noop' },
        timestamp: Date.now(),
      } as never);

      localTrackSpy.mockClear();
      window.dispatchEvent(new ErrorEvent('error', { message: 'Boom 44444', filename: 'app.js', lineno: 1 }));
      expect(localTrackSpy).not.toHaveBeenCalled();
    } finally {
      localHandler.stopTracking();
    }
  });

  it('collapses inline-script errors across SPA paths to one origin signature', () => {
    // The real-world case the `page_url` wiring exists for: an inline-script (theme) error
    // reports the browser's page URL as `filename`. handleError passes window.location.href
    // as page_url, so buildErrorSignatureKey collapses each path to the shared origin —
    // four such errors across two paths within one pageview hit the SAME per-pageview cap
    // instead of fragmenting into one signature per path. Distinct numeric content bypasses
    // the 5s identical-message window while normalizing to the same `failed to load [n]`.
    const originalPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    try {
      history.pushState({}, '', '/collections/kids');
      window.dispatchEvent(
        new ErrorEvent('error', { message: 'Failed to load 10001', filename: window.location.href, lineno: 7 }),
      );
      window.dispatchEvent(
        new ErrorEvent('error', { message: 'Failed to load 10002', filename: window.location.href, lineno: 7 }),
      );

      history.pushState({}, '', '/collections/adults');
      window.dispatchEvent(
        new ErrorEvent('error', { message: 'Failed to load 10003', filename: window.location.href, lineno: 7 }),
      );
      window.dispatchEvent(
        new ErrorEvent('error', { message: 'Failed to load 10004', filename: window.location.href, lineno: 7 }),
      );

      const errorCalls = trackSpy.mock.calls.filter(
        (call) => (call[0] as { type?: EventType }).type === EventType.ERROR,
      );
      expect(errorCalls).toHaveLength(MAX_ERRORS_PER_SIGNATURE_PER_PAGEVIEW);
    } finally {
      history.pushState({}, '', originalPath || '/');
    }
  });
});
