/**
 * Constants for initialization and reliability patterns
 * These values control initialization behavior, retry logic, and circuit breaker patterns
 */

// Initialization retry constants
export const INITIALIZATION_CONSTANTS = {
  /** Maximum number of retries when waiting for concurrent initialization */
  MAX_CONCURRENT_RETRIES: 20,
  /** Delay between retries when waiting for concurrent initialization (ms) */
  CONCURRENT_RETRY_DELAY_MS: 50,
  /** Timeout for overall initialization process (ms) */
  INITIALIZATION_TIMEOUT_MS: 10000,
} as const;

// Circuit breaker constants
export const CIRCUIT_BREAKER_CONSTANTS = {
  /** Maximum number of consecutive failures before opening circuit */
  MAX_FAILURES: 3,
  /** Initial backoff delay when circuit opens (ms) */
  INITIAL_BACKOFF_DELAY_MS: 1000,
  /** Maximum backoff delay (ms) */
  MAX_BACKOFF_DELAY_MS: 30000,
  /** Backoff multiplier for exponential backoff */
  BACKOFF_MULTIPLIER: 2,
  /** Time-based recovery period for circuit breaker (ms) */
  RECOVERY_TIME_MS: 30000, // 30 seconds
} as const;

// Session management constants
export const SESSION_SYNC_CONSTANTS = {
  /** Timeout for session synchronization operations (ms) */
  SYNC_TIMEOUT_MS: 2000,
  /** Maximum retry attempts for session operations */
  MAX_RETRY_ATTEMPTS: 3,
  /** Delay before cleanup operations (ms) */
  CLEANUP_DELAY_MS: 100,
} as const;

// Cross-tab coordination constants
export const CROSS_TAB_CONSTANTS = {
  /** Flag to prevent concurrent cross-tab manager initialization */
  INITIALIZATION_LOCK_TIMEOUT_MS: 5000,
} as const;

// Scroll suppression constants
export const SCROLL_SUPPRESSION_CONSTANTS = {
  /** Multiplier for scroll debounce time when suppressing scroll events */
  SUPPRESS_MULTIPLIER: 2,
} as const;
