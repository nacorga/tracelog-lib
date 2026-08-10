/**
 * Custom error types for TraceLog
 */

import type { IngestionReceipt } from './ingestion-receipt.types';

/**
 * Represents a permanent HTTP error (4xx) that should not be retried
 * Examples: 400 Bad Request, 403 Forbidden, 404 Not Found
 */
export class PermanentError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly responseCode?: string,
    public readonly ingestionReceipt?: IngestionReceipt,
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
 * Represents a rate limit error (429) that should not be retried in the
 * inner send loop. Events are persisted for periodic retry via EventManager
 * backoff. Deduplication of retried events is integration-specific (e.g.
 * TraceLog SaaS handles it server-side; custom backends should implement
 * their own idempotency).
 */
export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RateLimitError);
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
