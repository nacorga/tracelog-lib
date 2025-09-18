import { ApiConfig } from '../types';
import {
  MIN_SESSION_TIMEOUT_MS,
  MAX_SESSION_TIMEOUT_MS,
  MIN_SAMPLING_RATE,
  MAX_SAMPLING_RATE,
} from './limits.constants';

// Allowed API config keys for runtime validation
export const ALLOWED_API_CONFIG_KEYS = new Set<keyof ApiConfig>([
  'tags',
  'samplingRate',
  'excludedUrlPaths',
  'ipExcluded',
]);

// Validation error messages - standardized across all layers
export const VALIDATION_MESSAGES = {
  // Project ID validation - consistent message across all layers
  MISSING_PROJECT_ID: 'Project ID is required',
  PROJECT_ID_EMPTY_AFTER_TRIM: 'Project ID is required',

  // Session timeout validation
  INVALID_SESSION_TIMEOUT: `Session timeout must be between ${MIN_SESSION_TIMEOUT_MS}ms (30 seconds) and ${MAX_SESSION_TIMEOUT_MS}ms (24 hours)`,

  // Sampling rate validation
  INVALID_SAMPLING_RATE: `Sampling rate must be between ${MIN_SAMPLING_RATE} and ${MAX_SAMPLING_RATE}`,
  INVALID_ERROR_SAMPLING_RATE: 'Error sampling must be between 0 and 1',

  // Integration validation
  INVALID_GOOGLE_ANALYTICS_ID: 'Google Analytics measurement ID is required when integration is enabled',

  // UI validation
  INVALID_SCROLL_CONTAINER_SELECTORS: 'Scroll container selectors must be valid CSS selectors',

  // Global metadata validation
  INVALID_GLOBAL_METADATA: 'Global metadata must be an object',

  // Array validation
  INVALID_SENSITIVE_QUERY_PARAMS: 'Sensitive query params must be an array of strings',
} as const;
