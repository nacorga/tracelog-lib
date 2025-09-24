// Session and timeout constants
export const DEFAULT_SESSION_TIMEOUT_MS = 15 * 60 * 1000;
export const SESSION_HEARTBEAT_INTERVAL_MS = 30000;

// Throttling and debouncing constants
export const DEFAULT_THROTTLE_DELAY_MS = 1000;
export const SCROLL_DEBOUNCE_TIME_MS = 250;
export const DEFAULT_VISIBILITY_TIMEOUT_MS = 2000;
export const DUPLICATE_EVENT_THRESHOLD_MS = 1000;

// Event processing intervals
export const EVENT_SENT_INTERVAL_MS = 10000; // 10 seconds - production
export const EVENT_SENT_INTERVAL_TEST_MS = 1000; // 1 second - testing (faster)

// Network timing
export const RETRY_BACKOFF_INITIAL = 1000; // 1 second
export const RETRY_BACKOFF_MAX = 30_000; // 30 seconds
export const RATE_LIMIT_INTERVAL = 1000; // 1 second
export const MAX_RETRY_ATTEMPTS = 10;

// Event expiry
export const EVENT_EXPIRY_HOURS = 24;
export const EVENT_PERSISTENCE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

// Performance metrics
export const LONG_TASK_THROTTLE_MS = DEFAULT_THROTTLE_DELAY_MS;

// Session end coordination
export const SESSION_END_PRIORITY_DELAY_MS = 100;

// Cross-tab session management
export const TAB_HEARTBEAT_INTERVAL_MS = 5000; // 5 seconds
export const TAB_ELECTION_TIMEOUT_MS = 2000; // 2 seconds
export const TAB_CLEANUP_DELAY_MS = 1000; // 1 second

// Session recovery
export const SESSION_RECOVERY_WINDOW_MULTIPLIER = 2; // 2x session timeout
export const MAX_SESSION_RECOVERY_ATTEMPTS = 3;
export const MAX_SESSION_RECOVERY_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours max
export const MIN_SESSION_RECOVERY_WINDOW_MS = 2 * 60 * 1000; // 2 minutes minimum
