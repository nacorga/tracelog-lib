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
export const ERROR_SUPPRESSION_WINDOW_MS = 60_000; // 1 minute

/**
 * Maximum number of unique errors to track for suppression
 * Prevents memory usage from growing indefinitely
 */
export const MAX_TRACKED_ERRORS = 50;

// ============================================================================
// ERROR SAMPLING
// ============================================================================

/**
 * Default error sampling rate
 * Controls what percentage of errors are actually reported
 */
export const DEFAULT_ERROR_SAMPLING_RATE = 0.1; // 10% of errors
