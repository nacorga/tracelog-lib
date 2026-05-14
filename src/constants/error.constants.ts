/**
 * Error handling and PII sanitization constants for TraceLog
 * Centralizes patterns and limits for error tracking and data protection
 */

// ============================================================================
// PII SANITIZATION PATTERNS
// ============================================================================

/**
 * Regular expressions for detecting and sanitizing Personally Identifiable Information (PII)
 * These patterns are used to replace sensitive information with [REDACTED] in error messages
 */
export const PII_PATTERNS = [
  // Email addresses
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,

  // US Phone numbers (various formats)
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,

  // Credit card numbers (16 digits with optional separators)
  /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,

  // IBAN (International Bank Account Number)
  /\b[A-Z]{2}\d{2}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/gi,

  // API keys/tokens (sk_test_, sk_live_, pk_test_, pk_live_, etc.)
  /\b[sp]k_(test|live)_[a-zA-Z0-9]{10,}\b/gi,

  // Bearer tokens (JWT-like patterns - matches complete and partial tokens)
  /Bearer\s+[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)?(?:\.[A-Za-z0-9_-]+)?/gi,

  // Passwords in connection strings (protocol://user:password@host)
  /:\/\/[^:/]+:([^@]+)@/gi,

  // Sensitive URL query parameters (token=, password=, auth=, secret=, api_key=, etc.)
  /[?&](token|password|passwd|auth|secret|secret_key|private_key|auth_key|api_key|apikey|access_token)=[^&\s]+/gi,
] as const;

// ============================================================================
// ERROR TRACKING LIMITS
// ============================================================================

/**
 * Maximum length for error messages before truncation
 * Prevents extremely long error messages from consuming excessive storage
 */
export const MAX_ERROR_MESSAGE_LENGTH = 500;

/**
 * Maximum length for error stack traces before truncation
 * Prevents oversized payloads while preserving useful debugging context
 */
export const MAX_STACK_TRACE_LENGTH = 2000;

/**
 * Time window for error suppression in milliseconds
 * Prevents duplicate errors from flooding the system within this timeframe
 */
export const ERROR_SUPPRESSION_WINDOW_MS = 5_000; // 5 seconds

/**
 * Maximum number of unique errors to track for suppression
 * Prevents memory usage from growing indefinitely
 */
export const MAX_TRACKED_ERRORS = 50;

/**
 * Hard limit for error tracking before aggressive cleanup
 * If this limit is exceeded, the entire error map is cleared
 */
export const MAX_TRACKED_ERRORS_HARD_LIMIT = MAX_TRACKED_ERRORS * 2;

// ============================================================================
// ERROR SAMPLING
// ============================================================================

/**
 * Default error sampling rate
 * Controls what percentage of errors are actually reported
 */
export const DEFAULT_ERROR_SAMPLING_RATE = 1; // 100% of errors

// ============================================================================
// ERROR BURST DETECTION (Phase 3)
// ============================================================================

/**
 * Time window for error burst detection in milliseconds
 * Tracks unique errors within this window
 */
export const ERROR_BURST_WINDOW_MS = 1000; // 1 second

/**
 * Maximum number of unique errors allowed in burst window
 * Exceeding this triggers a cooldown period
 */
export const ERROR_BURST_THRESHOLD = 10; // 10 unique errors

/**
 * Backoff period after burst detection in milliseconds
 * No errors will be tracked during this cooldown
 */
export const ERROR_BURST_BACKOFF_MS = 5000; // 5 seconds

// ============================================================================
// PER-PAGEVIEW SIGNATURE CAP
// ============================================================================

/**
 * Hard cap on how many error events with the same `(normalizedMessage, filename, line)`
 * signature may be tracked within a single pageview. After the cap, additional matches
 * are dropped at the handler before reaching `EventManager.track()` — both bandwidth
 * and the merchant's monthly event quota are protected at the source.
 *
 * Counter resets on:
 *   - `pagehide` (hard reload, navigation away)
 *   - `SESSION_START` (new session detected mid-pageview)
 *   - `PAGE_VIEW` (covers SPA navigation via patched History API + popstate/hashchange,
 *     which never fires `pagehide`)
 *
 * Orthogonal to:
 *   - the 5s identical-error dedup window (`ERROR_SUPPRESSION_WINDOW_MS`)
 *   - the burst detector (`ERROR_BURST_THRESHOLD` / `ERROR_BURST_BACKOFF_MS`)
 *   - the server-side per-day cap that runs on ingest (defensive second layer)
 *
 * Signature is built by `buildErrorSignatureKey`, which mirrors the regex set in
 * `tracelog-api/src/lib/error-classification/error-fingerprint.service.ts`. Single knob —
 * no public config surface. Symmetric with `ERROR_BURST_THRESHOLD`, also hardcoded.
 * Customers needing to disable throttling for QA can use `errorSampling: 0` or QA mode
 * (`?tlog_mode=qa`).
 */
export const MAX_ERRORS_PER_SIGNATURE_PER_PAGEVIEW = 3;

// ============================================================================
// PERMANENT ERROR LOGGING
// ============================================================================

/**
 * Time window for throttling permanent error logs in milliseconds.
 * Same (status, code) pairs are logged at most once per this window.
 * Prevents console spam when backend repeatedly returns 4xx errors.
 */
export const PERMANENT_ERROR_LOG_THROTTLE_MS = 60_000; // 1 minute

/**
 * Maximum length of the application `code` field accepted from a 4xx response body.
 * Application codes are short identifiers (e.g. `PLAN_LIMIT_EXCEEDED`); anything
 * longer is treated as untrusted noise and ignored to avoid log pollution.
 */
export const MAX_RESPONSE_CODE_LENGTH = 64;
