/**
 * Consolidated configuration constants for TraceLog
 * This file centralizes all timing, limits, browser, and initialization constants
 */

// ============================================================================
// SESSION & TIMING
// ============================================================================

export const DEFAULT_SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes
export const DUPLICATE_EVENT_THRESHOLD_MS = 1000; // 1 second (increased from 500ms to reduce duplicate events)
export const EVENT_SENT_INTERVAL_MS = 10000; // 10 seconds
export const MIN_SEND_INTERVAL_MS = 1000; // 1 second
export const MAX_SEND_INTERVAL_MS_CONFIG = 60000; // 60 seconds

// Throttling and debouncing
export const SCROLL_DEBOUNCE_TIME_MS = 250;
export const DEFAULT_VISIBILITY_TIMEOUT_MS = 2000;
export const DEFAULT_PAGE_VIEW_THROTTLE_MS = 1000; // 1 second throttle for page views
export const DEFAULT_CLICK_THROTTLE_MS = 300; // 300ms throttle for clicks per element
export const DEFAULT_VIEWPORT_COOLDOWN_PERIOD = 60000; // 60 seconds cooldown for viewport events
export const DEFAULT_VIEWPORT_MAX_TRACKED_ELEMENTS = 100; // Maximum elements to track (Phase 3)
export const VIEWPORT_MUTATION_DEBOUNCE_MS = 100; // Debounce for mutation observer re-scanning

// Click throttle cache limits
export const MAX_THROTTLE_CACHE_ENTRIES = 1000; // Maximum element signatures to track
export const THROTTLE_ENTRY_TTL_MS = 300000; // 5 minutes TTL for throttle entries
export const THROTTLE_PRUNE_INTERVAL_MS = 30000; // 30 seconds interval for cache pruning

// Event expiry
export const EVENT_EXPIRY_HOURS = 2;
export const EVENT_PERSISTENCE_MAX_AGE_MS = 2 * 60 * 60 * 1000; // 2 hours
export const PERSISTENCE_THROTTLE_MS = 1000; // 1 second throttle for cross-tab persistence coordination

// ============================================================================
// LIMITS & REQUESTS
// ============================================================================

export const MAX_EVENTS_QUEUE_LENGTH = 100;
export const REQUEST_TIMEOUT_MS = 15000; // 15 seconds (to ensure requests complete before tab close/navigation)
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
export const MAX_EVENTS_PER_SECOND = 50; // Maximum 50 events per second (Phase 3: reduced from 200)
export const MAX_SAME_EVENT_PER_MINUTE = 60; // Maximum same custom event name per minute (prevents infinite loops)
export const PER_EVENT_RATE_LIMIT_WINDOW_MS = 60000; // 60 second window for per-event-name rate limiting

// Per-session event caps (Phase 3)
export const MAX_EVENTS_PER_SESSION = 1000;
export const MAX_CLICKS_PER_SESSION = 500;
export const MAX_PAGE_VIEWS_PER_SESSION = 100;
export const MAX_CUSTOM_EVENTS_PER_SESSION = 500;
export const MAX_VIEWPORT_EVENTS_PER_SESSION = 200;

// Queue and batch limits
export const BATCH_SIZE_THRESHOLD = 50;
export const MAX_PENDING_EVENTS_BUFFER = 100; // Maximum events to buffer before session init

// Session timeout validation limits
export const MIN_SESSION_TIMEOUT_MS = 30000; // 30 seconds minimum
export const MAX_SESSION_TIMEOUT_MS = 86400000; // 24 hours maximum

// Custom event validation limits
export const MAX_CUSTOM_EVENT_NAME_LENGTH = 120;
export const MAX_CUSTOM_EVENT_STRING_SIZE = 48 * 1024; // 48KB (leaves headroom below 64KB sendBeacon limit)
export const MAX_CUSTOM_EVENT_KEYS = 100;
export const MAX_CUSTOM_EVENT_ARRAY_SIZE = 500;
export const MAX_NESTED_OBJECT_KEYS = 200; // Safety bound for sanitizer (must be > MAX_CUSTOM_EVENT_KEYS)

// Text content limits
export const MAX_TEXT_LENGTH = 255; // For click tracking text content

// Data sanitization limits
export const MAX_STRING_LENGTH = 1000;
export const MAX_STRING_LENGTH_IN_ARRAY = 500; // Strings within arrays are more limited
export const MAX_ARRAY_LENGTH = 1000; // Safety bound for sanitizer (must be > MAX_CUSTOM_EVENT_ARRAY_SIZE)
export const MAX_OBJECT_DEPTH = 10; // Sufficient for any real use case, protects against circular/malicious structures

// Precision for numeric metrics
export const PRECISION_TWO_DECIMALS = 2 as const;

// Sync XHR timeout
export const SYNC_XHR_TIMEOUT_MS = 2000; // 2 seconds

// sendBeacon payload size limit (Phase 3)
export const MAX_BEACON_PAYLOAD_SIZE = 64 * 1024; // 64KB browser limit

// Event fingerprint management (moderately increased for high-frequency sessions)
export const MAX_FINGERPRINTS = 1500; // Maximum fingerprints stored before cleanup (increased from 1000)
export const FINGERPRINT_CLEANUP_MULTIPLIER = 10; // Cleanup fingerprints older than 10x threshold (10 seconds)
export const MAX_FINGERPRINTS_HARD_LIMIT = 3000; // Hard limit for aggressive cleanup (increased from 2000)

// ============================================================================
// BROWSER & HTML
// ============================================================================

/**
 * Prefix for all HTML data attributes used by TraceLog
 * Used for features like data-tlog-ignore, data-tlog-event, etc.
 */
export const HTML_DATA_ATTR_PREFIX = 'data-tlog';

/**
 * CSS selectors for interactive elements to track in click events
 *
 * Covers:
 * - Standard HTML interactive elements (button, a, input, select, textarea)
 * - ARIA roles (button, link, tab, menuitem, option, checkbox, radio, switch)
 * - Framework-specific attributes (routerLink, ng-click)
 * - Data attributes for actions (data-action, data-click, data-navigate, data-toggle)
 * - Common CSS classes (.btn, .button, .clickable, .nav-link, .menu-item)
 * - Testing attributes (data-testid)
 * - Accessibility (tabindex="0")
 */
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

/**
 * Standard UTM (Urchin Tracking Module) parameters for marketing attribution
 * These parameters are preserved in URLs for campaign tracking
 */
export const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

/**
 * Default list of sensitive URL query parameters to filter out for privacy protection
 *
 * Includes:
 * - Authentication tokens (token, auth, key, session, access_token, refresh_token)
 * - Password reset links (reset, password, verification, code, otp)
 * - API keys (api_key, apikey, secret)
 *
 * These parameters are removed from tracked URLs to prevent PII leakage
 */
export const DEFAULT_SENSITIVE_QUERY_PARAMS = [
  'token',
  'auth',
  'key',
  'session',
  'reset',
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

export const RATE_LIMIT_INTERVAL = 1000; // 1 second

// ============================================================================
// RETRY CONFIGURATION
// ============================================================================

/**
 * Maximum number of retry attempts for failed event transmissions
 * Applied to 5xx errors and network timeouts (transient failures)
 * 4xx errors (permanent) are not retried
 */
export const MAX_SEND_RETRIES = 2;

/**
 * Base delay for exponential backoff retry strategy (in milliseconds)
 * Formula: RETRY_BACKOFF_BASE_MS * (2 ^ attempt) + jitter
 * Example: attempt 1 = 100ms + jitter, attempt 2 = 200ms + jitter
 */
export const RETRY_BACKOFF_BASE_MS = 100;

/**
 * Maximum random jitter added to retry backoff delay (in milliseconds)
 * Prevents thundering herd problem when multiple clients retry simultaneously
 * Jitter range: 0 to RETRY_BACKOFF_JITTER_MS
 */
export const RETRY_BACKOFF_JITTER_MS = 100;

/**
 * Maximum delay between send attempts when using exponential backoff (in milliseconds)
 * Caps the backoff at 2 minutes to prevent excessively long delays
 * Formula: min(EVENT_SENT_INTERVAL_MS * 2^failures, MAX_SEND_INTERVAL_MS)
 */
export const MAX_SEND_INTERVAL_MS = 120000;

/**
 * Maximum consecutive network-level failures (DNS, connection refused) before the
 * circuit opens and further send attempts are skipped for the current session.
 *
 * Network failures are fetch() rejections where no HTTP response was received —
 * distinct from timeout errors and HTTP status errors. Three consecutive failures
 * strongly indicate a permanently misconfigured URL rather than a transient outage.
 *
 * After CIRCUIT_BREAKER_COOLDOWN_MS elapses, the circuit transitions to half-open
 * and allows a single probe batch through. A successful probe closes the circuit;
 * a failed probe re-opens it for another cooldown period.
 */
export const MAX_CONSECUTIVE_NETWORK_FAILURES = 3;

/**
 * Cooldown period before the network circuit breaker transitions to half-open
 * and allows a single probe request through. Aligned with MAX_SEND_INTERVAL_MS
 * so the EventManager's backoff scheduler naturally triggers the probe.
 */
export const CIRCUIT_BREAKER_COOLDOWN_MS = 120_000; // 2 minutes

/**
 * Maximum number of cross-session recovery attempts for a persisted event batch.
 *
 * Each page load that attempts to recover a persisted batch and fails increments
 * this counter inside the stored data. When the counter reaches this limit the
 * batch is discarded instead of being kept for another attempt, breaking the
 * infinite persistence loop caused by permanently unreachable backend URLs.
 */
export const MAX_RECOVERY_FAILURES = 3;

/**
 * Maximum consecutive send failures before entering cooldown mode.
 *
 * After this many failures:
 * - **Batch-threshold sends** (50+ events) are suppressed to prevent rapid retries
 * - **Periodic scheduler** continues at MAX_SEND_INTERVAL_MS (2 min) for auto-recovery
 * - Counter resets on successful send, stop(), or page reload
 *
 * This implements a circuit breaker pattern:
 * - Closed (0 failures): normal 10s send interval
 * - Half-open (1-4 failures): exponential backoff (20s, 40s, 80s, 120s)
 * - Open (5 failures): cooldown retries every 2 min, batch threshold blocked
 *
 * Each failure includes up to 2 per-request retries in SenderManager.
 */
export const MAX_CONSECUTIVE_SEND_FAILURES = 5;

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Standardized validation error messages for TraceLog configuration
 *
 * Centralizes all validation messages to ensure consistency across:
 * - API layer validation
 * - Configuration validation
 * - Runtime validation
 *
 * Messages include contextual information (e.g., min/max values) to help developers
 * quickly identify and fix configuration issues.
 */
export const VALIDATION_MESSAGES = {
  MISSING_PROJECT_ID: 'Project ID is required',
  PROJECT_ID_EMPTY_AFTER_TRIM: 'Project ID is required',
  INVALID_SESSION_TIMEOUT: `Session timeout must be between ${MIN_SESSION_TIMEOUT_MS}ms (30 seconds) and ${MAX_SESSION_TIMEOUT_MS}ms (24 hours)`,
  INVALID_SAMPLING_RATE: 'Sampling rate must be between 0 and 1',
  INVALID_ERROR_SAMPLING_RATE: 'Error sampling must be between 0 and 1',
  INVALID_TRACELOG_PROJECT_ID: 'TraceLog project ID is required when integration is enabled',
  INVALID_CUSTOM_API_URL: 'Custom API URL is required when integration is enabled',
  INVALID_SCROLL_CONTAINER_SELECTORS: 'Scroll container selectors must be valid CSS selectors',
  INVALID_GLOBAL_METADATA: 'Global metadata must be an object',
  INVALID_SENSITIVE_QUERY_PARAMS: 'Sensitive query params must be an array of strings',
  INVALID_PRIMARY_SCROLL_SELECTOR: 'Primary scroll selector must be a non-empty string',
  INVALID_PRIMARY_SCROLL_SELECTOR_SYNTAX: 'Invalid CSS selector syntax for primaryScrollSelector',
  INVALID_PAGE_VIEW_THROTTLE: 'Page view throttle must be a non-negative number',
  INVALID_CLICK_THROTTLE: 'Click throttle must be a non-negative number',
  INVALID_MAX_SAME_EVENT_PER_MINUTE: 'Max same event per minute must be a positive number',
  INVALID_VIEWPORT_CONFIG: 'Viewport config must be an object',
  INVALID_VIEWPORT_ELEMENTS: 'Viewport elements must be a non-empty array',
  INVALID_VIEWPORT_ELEMENT: 'Each viewport element must have a valid selector string',
  INVALID_VIEWPORT_ELEMENT_ID: 'Viewport element id must be a non-empty string',
  INVALID_VIEWPORT_ELEMENT_NAME: 'Viewport element name must be a non-empty string',
  INVALID_VIEWPORT_THRESHOLD: 'Viewport threshold must be a number between 0 and 1',
  INVALID_VIEWPORT_MIN_DWELL_TIME: 'Viewport minDwellTime must be a non-negative number',
  INVALID_VIEWPORT_COOLDOWN_PERIOD: 'Viewport cooldownPeriod must be a non-negative number',
  INVALID_VIEWPORT_MAX_TRACKED_ELEMENTS: 'Viewport maxTrackedElements must be a positive number',
  INVALID_SEND_INTERVAL: `Send interval must be between ${MIN_SEND_INTERVAL_MS}ms (1 second) and ${MAX_SEND_INTERVAL_MS_CONFIG}ms (60 seconds)`,
} as const;

// ============================================================================
// SECURITY
// ============================================================================

/**
 * Regular expressions for detecting and sanitizing XSS (Cross-Site Scripting) attacks
 *
 * Patterns detect:
 * - Script tags (<script>)
 * - JavaScript protocol URLs (javascript:)
 * - Inline event handlers (onclick=, onload=, etc.)
 * - Embedded content (<iframe>, <embed>, <object>)
 *
 * Used to sanitize user-provided data before storage or transmission
 */
export const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<embed\b[^>]*>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
] as const;
