// Session and timeout constants
export const DEFAULT_SESSION_TIMEOUT_MS = 15 * 60 * 1000;
export const SESSION_HEARTBEAT_INTERVAL_MS = 30000;

// Throttling and debouncing constants
export const DEFAULT_THROTTLE_DELAY_MS = 1000;
export const SCROLL_DEBOUNCE_TIME_MS = 250;
export const DEFAULT_VISIBILITY_TIMEOUT_MS = 2000;
export const DUPLICATE_EVENT_THRESHOLD_MS = 1000;

// Event processing intervals
export const EVENT_SENT_INTERVAL_MS = 10000;
export const EVENT_SENT_INTERVAL_TEST_MS = 2500;

// Network timing
export const RETRY_BACKOFF_INITIAL = 1000; // 1 second
export const RETRY_BACKOFF_MAX = 30_000; // 30 seconds
export const RATE_LIMIT_INTERVAL = 1000; // 1 second

// Event expiry
export const EVENT_EXPIRY_HOURS = 24;
