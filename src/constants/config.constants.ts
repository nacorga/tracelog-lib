/**
 * Consolidated configuration constants for TraceLog
 * This file centralizes all timing, limits, browser, and initialization constants
 */

import { ApiConfig } from '../types';

// ============================================================================
// SESSION & TIMING
// ============================================================================

export const DEFAULT_SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes
export const SESSION_HEARTBEAT_INTERVAL_MS = 30000; // 30 seconds
export const DUPLICATE_EVENT_THRESHOLD_MS = 1000; // 1 second
export const EVENT_SENT_INTERVAL_MS = 10000; // 10 seconds (production)
export const EVENT_SENT_INTERVAL_TEST_MS = 1000; // 1 second (testing)

// Throttling and debouncing
export const DEFAULT_THROTTLE_DELAY_MS = 1000;
export const SCROLL_DEBOUNCE_TIME_MS = 250;
export const DEFAULT_VISIBILITY_TIMEOUT_MS = 2000;

// Event expiry
export const EVENT_EXPIRY_HOURS = 24;
export const EVENT_PERSISTENCE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

// Session end coordination
export const SESSION_END_PRIORITY_DELAY_MS = 100;

// ============================================================================
// LIMITS & RETRIES
// ============================================================================

export const MAX_EVENTS_QUEUE_LENGTH = 500;
export const MAX_RETRIES = 3;
export const RETRY_DELAY_MS = 5000;
export const REQUEST_TIMEOUT_MS = 10000;
export const MAX_METADATA_SIZE = 5000;

// Motion and interaction thresholds
export const DEFAULT_MOTION_THRESHOLD = 2;
export const SIGNIFICANT_SCROLL_DELTA = 10;

// Sampling and rate limits
export const DEFAULT_SAMPLING_RATE = 1;
export const MIN_SAMPLING_RATE = 0;
export const MAX_SAMPLING_RATE = 1;

// Queue and batch limits
export const BATCH_SIZE_THRESHOLD = 50;

// Session timeout validation limits
export const MIN_SESSION_TIMEOUT_MS = 30000; // 30 seconds minimum
export const MAX_SESSION_TIMEOUT_MS = 86400000; // 24 hours maximum

// Custom event validation limits
export const MAX_CUSTOM_EVENT_NAME_LENGTH = 120;
export const MAX_CUSTOM_EVENT_STRING_SIZE = 8 * 1024; // 8KB
export const MAX_CUSTOM_EVENT_KEYS = 10;
export const MAX_CUSTOM_EVENT_ARRAY_SIZE = 10;

// Text content limits
export const MAX_TEXT_LENGTH = 255; // For click tracking text content

// Data sanitization limits
export const MAX_STRING_LENGTH = 1000;
export const MAX_ARRAY_LENGTH = 100;
export const MAX_OBJECT_DEPTH = 3;

// Precision for numeric metrics
export const PRECISION_TWO_DECIMALS = 2 as const;

// Web vitals sampling
export const WEB_VITALS_SAMPLING = 0.75 as const;
export const WEB_VITALS_LONG_TASK_SAMPLING = 0.2 as const;

// Sync XHR timeout
export const SYNC_XHR_TIMEOUT_MS = 2000; // 2 seconds

// Event fingerprint management
export const MAX_FINGERPRINTS = 1000; // Maximum fingerprints stored before cleanup
export const FINGERPRINT_CLEANUP_MULTIPLIER = 10; // Cleanup fingerprints older than 10x threshold
export const MAX_FINGERPRINTS_HARD_LIMIT = 2000; // Hard limit for aggressive cleanup
export const FINGERPRINT_CLEANUP_INTERVAL_MS = 60000; // Cleanup interval (1 minute)

// Click coordinate precision
export const CLICK_COORDINATE_PRECISION = 10; // Round click coordinates to nearest 10px

// ============================================================================
// BROWSER & HTML
// ============================================================================

export const HTML_DATA_ATTR_PREFIX = 'data-tl';

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

// ============================================================================
// CIRCUIT BREAKER
// ============================================================================

export const CIRCUIT_BREAKER_MAX_FAILURES = 3;
export const CIRCUIT_BREAKER_RECOVERY_TIME = 30000; // 30 seconds
export const CIRCUIT_BREAKER_MAX_STUCK_TIME_MS = 5 * 60 * 1000; // 5 minutes
export const CIRCUIT_BREAKER_HEALTH_CHECK_INTERVAL_MS = 60000; // Check every minute

// Backoff configuration
export const CIRCUIT_BREAKER_INITIAL_BACKOFF_DELAY_MS = 1000; // 1 second
export const CIRCUIT_BREAKER_MAX_BACKOFF_DELAY_MS = 30000; // 30 seconds
export const CIRCUIT_BREAKER_BACKOFF_MULTIPLIER = 2;

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
// PERFORMANCE METRICS
// ============================================================================

export const LONG_TASK_THROTTLE_MS = DEFAULT_THROTTLE_DELAY_MS;

// ============================================================================
// VALIDATION
// ============================================================================

// Allowed API config keys for runtime validation
export const ALLOWED_API_CONFIG_KEYS = new Set<keyof ApiConfig>([
  'mode',
  'tags',
  'samplingRate',
  'excludedUrlPaths',
  'ipExcluded',
]);

// Validation error messages - standardized across all layers
export const VALIDATION_MESSAGES = {
  // Project ID validation - consistent message across all layers
  MISSING_PROJECT_ID: 'Project ID is required',
  PROJECT_ID_EMPTY_AFTER_TRIM: 'Project ID is required',

  // Session timeout validation
  INVALID_SESSION_TIMEOUT: `Session timeout must be between ${MIN_SESSION_TIMEOUT_MS}ms (30 seconds) and ${MAX_SESSION_TIMEOUT_MS}ms (24 hours)`,

  // Sampling rate validation
  INVALID_SAMPLING_RATE: `Sampling rate must be between ${MIN_SAMPLING_RATE} and ${MAX_SAMPLING_RATE}`,
  INVALID_ERROR_SAMPLING_RATE: 'Error sampling must be between 0 and 1',

  // Integration validation
  INVALID_GOOGLE_ANALYTICS_ID: 'Google Analytics measurement ID is required when integration is enabled',

  // UI validation
  INVALID_SCROLL_CONTAINER_SELECTORS: 'Scroll container selectors must be valid CSS selectors',

  // Global metadata validation
  INVALID_GLOBAL_METADATA: 'Global metadata must be an object',

  // Array validation
  INVALID_SENSITIVE_QUERY_PARAMS: 'Sensitive query params must be an array of strings',
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
