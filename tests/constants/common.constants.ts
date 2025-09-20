import { Config } from '../../src/types';

export const TEST_ID = 'test';

export const DEFAULT_CONFIG: Config = { id: TEST_ID };

export const TEST_URLS = {
  INITIALIZATION_PAGE: '/',
} as const;

export const STATUS_TEXTS = {
  READY: 'Status: Ready for testing',
  INITIALIZED: 'Status: Initialized successfully',
  VALIDATION_PASS: 'PASS: Valid project ID accepted',
} as const;

export const ERROR_MESSAGES = {
  ID_REQUIRED: 'Project ID is required',
  INVALID_APP_CONFIG: 'Project ID is required',
  UNDEFINED_CONFIG: 'Configuration must be an object',
  APP_NOT_INITIALIZED: 'App not initialized',
} as const;
