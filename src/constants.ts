import { ApiConfig, AppConfig } from './types';

// Performance constants
export const EVENT_SENT_INTERVAL = 10_000;
export const MAX_EVENTS_QUEUE_LENGTH = 500;
export const SCROLL_DEBOUNCE_TIME = 250;
export const CLICK_DEBOUNCE_TIME = 100;
export const RETRY_BACKOFF_INITIAL = 1000;
export const RETRY_BACKOFF_MAX = 30_000;

// Security and validation constants
export const HTML_DATA_ATTR_PREFIX = 'data-tl';
export const MAX_CUSTOM_EVENT_NAME_LENGTH = 120;
export const MAX_CUSTOM_EVENT_STRING_SIZE = 8 * 1024;
export const MAX_CUSTOM_EVENT_KEYS = 10;
export const MAX_CUSTOM_EVENT_ARRAY_SIZE = 10;
export const DEFAULT_SAMPLING_RATE = 1;

// Performance thresholds
export const SIGNIFICANT_SCROLL_DELTA = 10;
export const DUPLICATE_EVENT_THRESHOLD = 1000;
export const BATCH_SIZE_THRESHOLD = 50;

export const DEFAULT_TRACKING_API_CONFIG: ApiConfig = {
  qaMode: false,
  samplingRate: DEFAULT_SAMPLING_RATE,
  tags: [],
  excludedUrlPaths: [],
};

export const DEFAULT_TRACKING_APP_CONFIG: AppConfig = {
  sessionTimeout: 60_000 * 10,
};

export const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
