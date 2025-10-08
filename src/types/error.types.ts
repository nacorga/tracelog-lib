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
