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
// PERMANENT ERROR LOGGING
// ============================================================================

/**
 * Time window for throttling permanent error logs in milliseconds
 * Same error status codes are logged at most once per this window
 * Prevents console spam when backend repeatedly returns 4xx errors
 */
export const PERMANENT_ERROR_LOG_THROTTLE_MS = 60_000; // 1 minute
