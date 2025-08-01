import { ApiConfig, Config } from './types/config.types';

// Storage keys
export const STORAGE_BASE_KEY = 'tl';
export const USER_ID_KEY = `${STORAGE_BASE_KEY}:uid`;
export const QUEUE_KEY = `${STORAGE_BASE_KEY}:queue`;
export const SESSION_STORAGE_KEY = `${STORAGE_BASE_KEY}:session`;

// Performance constants
export const EVENT_SENT_INTERVAL = 10000;
export const EVENT_SENT_INTERVAL_TEST = 2500;
export const MAX_EVENTS_QUEUE_LENGTH = 500;
export const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
export const SESSION_HEARTBEAT_INTERVAL_MS = 30000; // 30 seconds
export const SIGNIFICANT_SCROLL_DELTA = 10;
export const DUPLICATE_EVENT_THRESHOLD = 1000;
export const BATCH_SIZE_THRESHOLD = 50;
export const SCROLL_DEBOUNCE_TIME = 250;

// Security and validation constants
export const MAX_CUSTOM_EVENT_NAME_LENGTH = 120;
export const MAX_CUSTOM_EVENT_STRING_SIZE = 8 * 1024;
export const MAX_CUSTOM_EVENT_KEYS = 10;
export const MAX_CUSTOM_EVENT_ARRAY_SIZE = 10;
export const DEFAULT_SAMPLING_RATE = 1;

// UTM parameters
export const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

// Allowed API config keys for runtime validation
export const ALLOWED_API_CONFIG_KEYS = new Set<keyof ApiConfig>(['tags', 'samplingRate', 'qaMode', 'excludedUrlPaths']);

// Default API config
export const DEFAULT_API_CONFIG: ApiConfig = {
  qaMode: false,
  samplingRate: DEFAULT_SAMPLING_RATE,
  tags: [],
  excludedUrlPaths: [],
};

// Default config
export const DEFAULT_CONFIG: Config = {
  ...DEFAULT_API_CONFIG,
  id: 'default',
  sessionTimeout: SESSION_TIMEOUT_MS,
  allowHttp: false,
};

// Demo config
export const DEFAULT_DEMO_CONFIG: Config = {
  ...DEFAULT_CONFIG,
  id: 'demo',
  qaMode: true,
};

// Test config
export const DEFAULT_TEST_CONFIG: Config = {
  ...DEFAULT_CONFIG,
  id: 'test',
  qaMode: true,
};
