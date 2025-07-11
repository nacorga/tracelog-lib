import { TracelogApiConfig, TracelogAppConfig } from '@/types';

export enum LSKey {
  UserId = 'tracelog_uid',
}

export enum DeviceType {
  Mobile = 'mobile',
  Tablet = 'tablet',
  Desktop = 'desktop',
  Unknown = 'unknown',
}

export const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

// Performance optimized constants
export const EVENT_SENT_INTERVAL = 5000; // Reduced from 10s to 5s for better responsiveness
export const MAX_EVENTS_QUEUE_LENGTH = 500; // Reduced from 1000 to 500 for better memory usage
export const SCROLL_DEBOUNCE_TIME = 100; // Reduced from 250ms to 100ms for better responsiveness
export const CLICK_DEBOUNCE_TIME = 50; // Added for click events
export const RETRY_BACKOFF_INITIAL = 1000;
export const RETRY_BACKOFF_MAX = 30_000; // Reduced from 60s to 30s for faster recovery

// Security and validation constants
export const HTML_DATA_ATTR_PREFIX = 'data-tracelog';
export const MAX_CUSTOM_EVENT_NAME_LENGTH = 120;
export const MAX_CUSTOM_EVENT_STRING_SIZE = 8 * 1024; // Reduced from 10KB to 8KB
export const MAX_CUSTOM_EVENT_KEYS = 10; // Reduced from 12 to 10
export const MAX_CUSTOM_EVENT_ARRAY_SIZE = 10; // Reduced from 12 to 10
export const DEFAULT_SAMPLING_RATE = 1;

// Performance thresholds
export const SIGNIFICANT_SCROLL_DELTA = 10; // Minimum scroll distance to trigger event
export const DUPLICATE_EVENT_THRESHOLD = 1000; // 1 second for duplicate detection
export const BATCH_SIZE_THRESHOLD = 50; // Send immediately if queue reaches this size

export const DEFAULT_TRACKING_API_CONFIG: TracelogApiConfig = {
  qaMode: false,
  samplingRate: DEFAULT_SAMPLING_RATE,
  tags: [],
  excludedUrlPaths: [],
};

export const DEFAULT_TRACKING_APP_CONFIG: TracelogAppConfig = {
  sessionTimeout: 60_000 * 10, // Reduced from 15 minutes to 10 minutes
};
