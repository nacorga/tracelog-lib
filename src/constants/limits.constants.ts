// Motion and interaction thresholds
export const DEFAULT_MOTION_THRESHOLD = 2;
export const SIGNIFICANT_SCROLL_DELTA = 10;

// Sampling and rate limits
export const DEFAULT_SAMPLING_RATE = 1;
export const MIN_SAMPLING_RATE = 0;
export const MAX_SAMPLING_RATE = 1;

// Queue and batch limits
export const BATCH_SIZE_THRESHOLD = 50;
export const MAX_EVENTS_QUEUE_LENGTH = 500;

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
export const PRECISION_FOUR_DECIMALS = 4 as const;

// Web vitals sampling
export const WEB_VITALS_SAMPLING = 0.75 as const;
export const WEB_VITALS_LONG_TASK_SAMPLING = 0.2 as const;

// Sync XHR timeout
export const SYNC_XHR_TIMEOUT_MS = 2000; // 2 seconds
