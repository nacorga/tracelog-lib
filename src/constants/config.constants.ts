/**
 * Consolidated configuration constants for TraceLog
 * This file centralizes all timing, limits, browser, and initialization constants
 */

// ============================================================================
// SESSION & TIMING
// ============================================================================

export const DEFAULT_SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes
export const DUPLICATE_EVENT_THRESHOLD_MS = 500; // 500ms
export const EVENT_SENT_INTERVAL_MS = 10000; // 10 seconds

// Throttling and debouncing
export const SCROLL_DEBOUNCE_TIME_MS = 250;
export const DEFAULT_VISIBILITY_TIMEOUT_MS = 2000;

// Event expiry
export const EVENT_EXPIRY_HOURS = 2;
export const EVENT_PERSISTENCE_MAX_AGE_MS = 2 * 60 * 60 * 1000; // 2 hours

// ============================================================================
// LIMITS & REQUESTS
// ============================================================================

export const MAX_EVENTS_QUEUE_LENGTH = 100;
export const REQUEST_TIMEOUT_MS = 10000;
export const MAX_METADATA_SIZE = 5000;

// Motion and interaction thresholds
export const DEFAULT_MOTION_THRESHOLD = 2;
export const SIGNIFICANT_SCROLL_DELTA = 10;
export const MIN_SCROLL_DEPTH_CHANGE = 5;
export const SCROLL_MIN_EVENT_INTERVAL_MS = 500;
export const MAX_SCROLL_EVENTS_PER_SESSION = 120;

// Sampling and rate limits
export const DEFAULT_SAMPLING_RATE = 1;
export const MIN_SAMPLING_RATE = 0;
export const MAX_SAMPLING_RATE = 1;
export const RATE_LIMIT_WINDOW_MS = 1000; // 1 second window
export const MAX_EVENTS_PER_SECOND = 200; // Maximum 200 events per second

// Queue and batch limits
export const BATCH_SIZE_THRESHOLD = 50;
export const MAX_PENDING_EVENTS_BUFFER = 100; // Maximum events to buffer before session init

// Session timeout validation limits
export const MIN_SESSION_TIMEOUT_MS = 30000; // 30 seconds minimum
export const MAX_SESSION_TIMEOUT_MS = 86400000; // 24 hours maximum

// Custom event validation limits
export const MAX_CUSTOM_EVENT_NAME_LENGTH = 120;
export const MAX_CUSTOM_EVENT_STRING_SIZE = 8 * 1024; // 8KB
export const MAX_CUSTOM_EVENT_KEYS = 10;
export const MAX_CUSTOM_EVENT_ARRAY_SIZE = 10;
export const MAX_NESTED_OBJECT_KEYS = 20; // Maximum keys in nested objects within arrays
export const MAX_METADATA_NESTING_DEPTH = 1; // Maximum nesting depth for metadata objects

// Text content limits
export const MAX_TEXT_LENGTH = 255; // For click tracking text content

// Data sanitization limits
export const MAX_STRING_LENGTH = 1000;
export const MAX_STRING_LENGTH_IN_ARRAY = 500; // Strings within arrays are more limited
export const MAX_ARRAY_LENGTH = 100;
export const MAX_OBJECT_DEPTH = 3;

// Precision for numeric metrics
export const PRECISION_TWO_DECIMALS = 2 as const;

// Sync XHR timeout
export const SYNC_XHR_TIMEOUT_MS = 2000; // 2 seconds

// Event fingerprint management
export const MAX_FINGERPRINTS = 1000; // Maximum fingerprints stored before cleanup
export const FINGERPRINT_CLEANUP_MULTIPLIER = 10; // Cleanup fingerprints older than 10x threshold
export const MAX_FINGERPRINTS_HARD_LIMIT = 2000; // Hard limit for aggressive cleanup

// ============================================================================
// BROWSER & HTML
// ============================================================================

export const HTML_DATA_ATTR_PREFIX = 'data-tlog';

// Interactive element selectors for click tracking
export const INTERACTIVE_SELECTORS = [
  'button',
  'a',
  'input[type="button"]',
  'input[type="submit"]',
  'input[type="reset"]',
  'input[type="checkbox"]',
  'input[type="radio"]',
  'select',
  'textarea',
  '[role="button"]',
  '[role="link"]',
  '[role="tab"]',
  '[role="menuitem"]',
  '[role="option"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="switch"]',
  '[routerLink]',
  '[ng-click]',
  '[data-action]',
  '[data-click]',
  '[data-navigate]',
  '[data-toggle]',
  '[onclick]',
  '.btn',
  '.button',
  '.clickable',
  '.nav-link',
  '.menu-item',
  '[data-testid]',
  '[tabindex="0"]',
] as const;

// UTM parameters for tracking
export const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

// Default sensitive query parameters to remove from URLs (privacy protection)
export const DEFAULT_SENSITIVE_QUERY_PARAMS = [
  'token',
  'auth',
  'key',
  'session',
  'reset',
  'email',
  'password',
  'api_key',
  'apikey',
  'secret',
  'access_token',
  'refresh_token',
  'verification',
  'code',
  'otp',
] as const;

// ============================================================================
// ============================================================================
// INITIALIZATION
// ============================================================================

export const INITIALIZATION_MAX_CONCURRENT_RETRIES = 20;
export const INITIALIZATION_CONCURRENT_RETRY_DELAY_MS = 50;
export const INITIALIZATION_TIMEOUT_MS = 10000;

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

export const SESSION_SYNC_TIMEOUT_MS = 2000;
export const SESSION_MAX_RETRY_ATTEMPTS = 3;
export const SESSION_CLEANUP_DELAY_MS = 100;

// Cross-tab coordination
export const CROSS_TAB_INITIALIZATION_LOCK_TIMEOUT_MS = 5000;
export const TAB_HEARTBEAT_INTERVAL_MS = 5000; // 5 seconds
export const TAB_ELECTION_TIMEOUT_MS = 2000; // 2 seconds
export const TAB_CLEANUP_DELAY_MS = 1000; // 1 second

// Session recovery
export const SESSION_RECOVERY_WINDOW_MULTIPLIER = 2; // 2x session timeout
export const MAX_SESSION_RECOVERY_ATTEMPTS = 3;
export const MAX_SESSION_RECOVERY_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours max
export const MIN_SESSION_RECOVERY_WINDOW_MS = 2 * 60 * 1000; // 2 minutes minimum

// ============================================================================
// SCROLL SUPPRESSION
// ============================================================================

export const SCROLL_SUPPRESS_MULTIPLIER = 2;

// ============================================================================
// NETWORK TIMING
// ============================================================================

export const RETRY_BACKOFF_INITIAL = 1000; // 1 second
export const RETRY_BACKOFF_MAX = 30_000; // 30 seconds
export const RATE_LIMIT_INTERVAL = 1000; // 1 second
export const MAX_RETRY_ATTEMPTS = 10;

// ============================================================================
// VALIDATION
// ============================================================================

// Validation error messages - standardized across all layers
export const VALIDATION_MESSAGES = {
  MISSING_PROJECT_ID: 'Project ID is required',
  PROJECT_ID_EMPTY_AFTER_TRIM: 'Project ID is required',
  INVALID_SESSION_TIMEOUT: `Session timeout must be between ${MIN_SESSION_TIMEOUT_MS}ms (30 seconds) and ${MAX_SESSION_TIMEOUT_MS}ms (24 hours)`,
  INVALID_SAMPLING_RATE: 'Sampling rate must be between 0 and 1',
  INVALID_ERROR_SAMPLING_RATE: 'Error sampling must be between 0 and 1',
  INVALID_TRACELOG_PROJECT_ID: 'TraceLog project ID is required when integration is enabled',
  INVALID_CUSTOM_API_URL: 'Custom API URL is required when integration is enabled',
  INVALID_GOOGLE_ANALYTICS_ID: 'Google Analytics measurement ID is required when integration is enabled',
  INVALID_SCROLL_CONTAINER_SELECTORS: 'Scroll container selectors must be valid CSS selectors',
  INVALID_GLOBAL_METADATA: 'Global metadata must be an object',
  INVALID_SENSITIVE_QUERY_PARAMS: 'Sensitive query params must be an array of strings',
  INVALID_PRIMARY_SCROLL_SELECTOR: 'Primary scroll selector must be a non-empty string',
  INVALID_PRIMARY_SCROLL_SELECTOR_SYNTAX: 'Invalid CSS selector syntax for primaryScrollSelector',
} as const;

// ============================================================================
// SECURITY
// ============================================================================

// XSS protection patterns
export const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<embed\b[^>]*>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
] as const;
