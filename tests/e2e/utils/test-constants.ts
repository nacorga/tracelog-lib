/**
 * Test Constants
 *
 * Centralized constants for E2E tests to replace magic numbers
 * and improve test maintainability.
 */

/**
 * Wait times (in milliseconds)
 */
export const WAIT_TIMES = {
  /** Time to wait for bridge to be available */
  BRIDGE_AVAILABILITY: 5000,

  /** Time to wait after initialization for handlers to activate */
  AFTER_INIT: 500,

  /** Time to wait for events to be processed and emitted */
  EVENT_PROCESSING: 300,

  /** Time to wait for click events to be captured */
  CLICK_CAPTURE: 500,

  /** Queue send interval (10 seconds) */
  QUEUE_SEND_INTERVAL: 10000,

  /** Queue send interval + buffer for waiting */
  QUEUE_SEND_WITH_BUFFER: 12000,

  /** Scroll debounce time (250ms) */
  SCROLL_DEBOUNCE: 250,

  /** Scroll event processing time (debounce + buffer) */
  SCROLL_PROCESSING: 600,

  /** Dynamic scroll container retry window (5 attempts × 200ms + buffer) */
  SCROLL_CONTAINER_RETRY: 1200,

  /** Session timeout fallback test wait */
  SESSION_TIMEOUT_TEST: 1200,

  /** Error suppression window */
  ERROR_SUPPRESSION: 5000,

  /** Error suppression window + buffer */
  ERROR_SUPPRESSION_WITH_BUFFER: 5500,

  /** Standard wait between user actions in realistic flows */
  BETWEEN_ACTIONS: 300,

  /** Wait for page navigation to settle */
  NAVIGATION_SETTLE: 1000,

  /** Wait for hash navigation to process */
  HASH_NAVIGATION: 800,
} as const;

/**
 * Test-specific constants
 */
export const TEST_CONSTANTS = {
  /** Maximum bridge availability retries */
  MAX_BRIDGE_RETRIES: 50,

  /** Interval between bridge availability checks */
  BRIDGE_RETRY_INTERVAL: 100,

  /** Maximum events in queue before overflow */
  MAX_EVENTS_QUEUE_LENGTH: 100,

  /** Maximum events per second (rate limit) */
  MAX_EVENTS_PER_SECOND: 50,

  /** Event sent interval for queue tests */
  EVENT_SENT_INTERVAL_MS: 10000,

  /** Batch size threshold for dynamic flush */
  BATCH_SIZE_THRESHOLD: 50,

  /** Default error suppression window */
  ERROR_SUPPRESSION_WINDOW_MS: 5000,

  /** Scroll debounce time */
  SCROLL_DEBOUNCE_TIME_MS: 250,

  /** Scroll minimum event interval */
  SCROLL_MIN_EVENT_INTERVAL_MS: 500,

  /** Default session timeout */
  DEFAULT_SESSION_TIMEOUT: 900000, // 15 minutes

  /** Default viewport visibility timeout */
  DEFAULT_VISIBILITY_TIMEOUT_MS: 2000,

  /** Default viewport cooldown period */
  DEFAULT_VIEWPORT_COOLDOWN_PERIOD: 60000, // 1 minute
} as const;

/**
 * BroadcastChannel naming
 */
export const CHANNEL_NAMES = {
  /** Base broadcast channel name pattern */
  BROADCAST_BASE: 'tlog',

  /** Get broadcast channel name for project ID */
  getBroadcastChannel: (projectId = 'default') => `tlog:${projectId}:broadcast`,
} as const;

/**
 * Storage keys
 */
export const STORAGE_KEYS = {
  /** Base storage key */
  BASE: 'tlog',

  /** Get session storage key for project ID */
  getSessionKey: (projectId = 'default') => `tlog:${projectId}:session`,

  /** Get queue storage key for project ID */
  getQueueKey: (projectId = 'default') => `tlog:${projectId}:queue`,

  /** User ID key */
  USER_ID: 'tlog:uid',

  /** QA mode key */
  QA_MODE: 'tlog:qa_mode',
} as const;

/**
 * Event types for filtering
 */
export const EVENT_TYPES = {
  CLICK: 'click',
  SCROLL: 'scroll',
  PAGE_VIEW: 'page_view',
  CUSTOM: 'custom',
  SESSION_START: 'session_start',
  SESSION_END: 'session_end',
  WEB_VITALS: 'web_vitals',
  ERROR: 'error',
  VIEWPORT: 'viewport',
} as const;
