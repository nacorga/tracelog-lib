import { CommonEventFilters } from '../types';

/**
 * Common event filters for TraceLog testing
 *
 * Pre-configured filters for frequently used event scenarios.
 * These filters help standardize event matching across different tests.
 */
export const COMMON_FILTERS: CommonEventFilters = {
  /** Filter for application initialization events */
  INITIALIZATION: {
    namespace: 'App',
    messageContains: 'initialization',
  },

  /** Filter for session start events */
  SESSION_START: {
    namespace: 'SessionHandler',
    messageContains: 'Session started',
  },

  /** Filter for session end events */
  SESSION_END: {
    namespace: 'SessionHandler',
    messageContains: 'Session ended',
  },

  /** Filter for session manager events */
  SESSION_MANAGER: {
    namespace: 'SessionManager',
    messageContains: 'Session',
  },

  /** Filter for session handler events */
  SESSION_HANDLER: {
    namespace: 'SessionHandler',
    messageContains: 'Session',
  },

  /** Filter for custom event tracking */
  CUSTOM_EVENT: {
    namespace: 'EventManager',
    messageContains: 'Custom event tracked',
  },

  /** Filter for page view events */
  PAGE_VIEW: {
    namespace: 'PageViewHandler',
    messageContains: 'Page view tracked',
  },

  /** Filter for click events */
  CLICK: {
    namespace: 'ClickHandler',
    messageContains: 'Click event tracked',
  },

  /** Filter for scroll events */
  SCROLL: {
    namespace: 'ScrollHandler',
    messageContains: 'Scroll',
  },

  /** Filter for performance events */
  PERFORMANCE: {
    namespace: 'PerformanceHandler',
    messageContains: 'Performance',
  },

  /** Filter for error events */
  ERROR: {
    namespace: 'ErrorHandler',
    messageContains: 'error',
  },

  /** Filter for network events */
  NETWORK: {
    namespace: 'NetworkHandler',
    messageContains: 'Network',
  },

  /** Filter for event manager events */
  EVENT_MANAGER: {
    namespace: 'EventManager',
    messageContains: 'Event',
  },

  /** Filter for state manager events */
  STATE_MANAGER: {
    namespace: 'StateManager',
    messageContains: 'State',
  },
} as const;

/**
 * Default timeout for waiting for events (in milliseconds)
 */
export const DEFAULT_TIMEOUT = 5000;

/**
 * Event capture configuration defaults
 */
export const EVENT_CAPTURE_DEFAULTS = {
  /** Default maximum number of events to store */
  MAX_EVENTS: 1000,
  /** Default polling interval for event waiting */
  POLL_INTERVAL: 100,
  /** Default timeout for event operations */
  TIMEOUT: DEFAULT_TIMEOUT,
  /** Default event capture instance cleanup timeout */
  CLEANUP_TIMEOUT: 2000,
} as const;

/**
 * Namespaces commonly used in TraceLog events
 *
 * These constants help ensure consistency when filtering
 * events by namespace across different test scenarios.
 */
export const EVENT_NAMESPACES = {
  /** Main application namespace */
  APP: 'App',
  /** Event management namespace */
  EVENT_MANAGER: 'EventManager',
  /** Session management namespace */
  SESSION_MANAGER: 'SessionManager',
  /** Session handling namespace */
  SESSION_HANDLER: 'SessionHandler',
  /** Click event handling */
  CLICK_HANDLER: 'ClickHandler',
  /** Scroll event handling */
  SCROLL_HANDLER: 'ScrollHandler',
  /** Page view handling */
  PAGE_VIEW_HANDLER: 'PageViewHandler',
  /** Performance monitoring */
  PERFORMANCE_HANDLER: 'PerformanceHandler',
  /** Error handling */
  ERROR_HANDLER: 'ErrorHandler',
  /** Network monitoring */
  NETWORK_HANDLER: 'NetworkHandler',
  /** State management */
  STATE_MANAGER: 'StateManager',
  /** Storage management */
  STORAGE_MANAGER: 'StorageManager',
  /** Sender management */
  SENDER_MANAGER: 'SenderManager',
  /** Debug utilities */
  DEBUG_LOGGER: 'DebugLogger',
} as const;

/**
 * Common event message patterns for filtering
 *
 * Frequently used message patterns that can be used
 * for filtering events by content.
 */
export const EVENT_MESSAGES = {
  /** Initialization-related messages */
  INIT: {
    STARTED: 'initialization started',
    COMPLETED: 'initialization completed',
    FAILED: 'initialization failed',
    CONFIG_LOADED: 'configuration loaded',
    BRIDGE_READY: 'bridge ready',
  },
  /** Session-related messages */
  SESSION: {
    STARTED: 'Session started',
    ENDED: 'Session ended',
    RECOVERED: 'Session recovered',
    EXPIRED: 'Session expired',
    SYNCED: 'Session synced',
  },
  /** Event tracking messages */
  TRACKING: {
    EVENT_TRACKED: 'event tracked',
    CUSTOM_EVENT: 'Custom event tracked',
    PAGE_VIEW: 'Page view tracked',
    CLICK: 'Click event tracked',
    SCROLL: 'Scroll event tracked',
    PERFORMANCE: 'Performance metric captured',
  },
  /** Error and warning messages */
  ERRORS: {
    ERROR_OCCURRED: 'error occurred',
    WARNING_ISSUED: 'warning issued',
    VALIDATION_FAILED: 'validation failed',
    NETWORK_ERROR: 'network error',
    TIMEOUT_ERROR: 'timeout error',
  },
  /** State management messages */
  STATE: {
    UPDATED: 'state updated',
    RESET: 'state reset',
    LOADED: 'state loaded',
    SAVED: 'state saved',
    CLEARED: 'state cleared',
  },
} as const;

/**
 * Event priority levels for filtering and sorting
 */
export const EVENT_PRIORITIES = {
  /** Critical events that indicate system failures */
  CRITICAL: ['CLIENT_ERROR', 'ERROR'],
  /** Important events that need attention */
  HIGH: ['CLIENT_WARN', 'WARN'],
  /** Normal operational events */
  NORMAL: ['INFO'],
  /** Debug and trace events */
  LOW: ['DEBUG', 'VERBOSE'],
} as const;

/**
 * Event batch processing configuration
 */
export const EVENT_BATCH_CONFIG = {
  /** Maximum number of events to process in a single batch */
  MAX_BATCH_SIZE: 100,
  /** Time interval for batch processing (milliseconds) */
  BATCH_INTERVAL: 500,
  /** Maximum time to wait for batch completion */
  BATCH_TIMEOUT: 5000,
} as const;

/**
 * Event validation rules and patterns
 */
export const EVENT_VALIDATION = {
  /** Required fields for a valid event */
  REQUIRED_FIELDS: ['timestamp', 'level', 'namespace', 'message'],
  /** Maximum length for event messages */
  MAX_MESSAGE_LENGTH: 1000,
  /** Maximum size for event data */
  MAX_DATA_SIZE: 10000,
  /** Valid timestamp format pattern */
  TIMESTAMP_PATTERN: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
} as const;
