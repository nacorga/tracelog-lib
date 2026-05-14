/**
 * Regular expressions used to detect and redact common PII patterns from
 * free-form text (click text, error messages, stack traces, etc.).
 *
 * Mirrors the patterns relied on by `ClickHandler` and `ErrorHandler`. Adding
 * a pattern here automatically widens coverage for both handlers.
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

  // API keys / tokens (sk_test_, sk_live_, pk_test_, pk_live_, …)
  /\b[sp]k_(test|live)_[a-zA-Z0-9]{10,}\b/gi,

  // Bearer tokens (JWT-like patterns — matches complete and partial tokens)
  /Bearer\s+[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)?(?:\.[A-Za-z0-9_-]+)?/gi,

  // Passwords in connection strings (protocol://user:password@host)
  /:\/\/[^:/]+:([^@]+)@/gi,

  // Sensitive URL query parameters (token=, password=, auth=, secret=, api_key=, …)
  /[?&](token|password|passwd|auth|secret|secret_key|private_key|auth_key|api_key|apikey|access_token)=[^&\s]+/gi,
] as const;

/**
 * Replaces every match of {@link PII_PATTERNS} with `[REDACTED]`.
 *
 * The function does not mutate the input. Inputs that don't contain PII are
 * returned untouched (after going through `String.prototype.replace`, which is
 * a no-op when no match exists).
 */
export const sanitizePii = (text: string): string => {
  let sanitized = text;

  for (const pattern of PII_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }

  return sanitized;
};
