import { ApiConfig } from '../types';
import {
  MIN_SESSION_TIMEOUT_MS,
  MAX_SESSION_TIMEOUT_MS,
  MIN_SAMPLING_RATE,
  MAX_SAMPLING_RATE,
} from './limits.constants';

// Allowed API config keys for runtime validation
export const ALLOWED_API_CONFIG_KEYS = new Set<keyof ApiConfig>(['tags', 'samplingRate', 'qaMode', 'excludedUrlPaths']);

// Validation error messages
export const VALIDATION_MESSAGES = {
  MISSING_PROJECT_ID: 'Project ID is required',
  INVALID_SESSION_TIMEOUT: `Session timeout must be between ${MIN_SESSION_TIMEOUT_MS}ms (30 seconds) and ${MAX_SESSION_TIMEOUT_MS}ms (24 hours)`,
  INVALID_SAMPLING_RATE: `Sampling rate must be between ${MIN_SAMPLING_RATE} and ${MAX_SAMPLING_RATE}`,
  INVALID_GOOGLE_ANALYTICS_ID: 'Google Analytics measurement ID is required when integration is enabled',
  INVALID_SCROLL_CONTAINER_SELECTORS: 'Scroll container selectors must be valid CSS selectors',
} as const;
