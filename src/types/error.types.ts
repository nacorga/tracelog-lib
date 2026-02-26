/**
 * Custom error types for TraceLog
 */

/**
 * Represents a permanent HTTP error (4xx) that should not be retried
 * Examples: 400 Bad Request, 403 Forbidden, 404 Not Found
 */
export class PermanentError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'PermanentError';

    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PermanentError);
    }
  }
}

/**
 * Represents a timeout error where the server likely received the request
 * but the response took too long. Events should NOT be persisted for retry
 * since the server most likely already processed them.
 */
export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TimeoutError);
    }
  }
}
