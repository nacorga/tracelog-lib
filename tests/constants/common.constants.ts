import { Config, SpecialProjectId } from '../../src/types';
import { ConsoleMonitoringConfig } from '../types';

/**
 * Default configuration for TraceLog initialization in tests
 */
export const DEFAULT_CONFIG: Config = {
  id: SpecialProjectId.Skip,
};

/**
 * Test URLs and routing constants
 */
export const TEST_URLS = {
  /** Default initialization test page */
  INITIALIZATION_PAGE: '/',
  /** Page for testing validation scenarios */
  VALIDATION_PAGE: '/validation',
  /** Page for testing error scenarios */
  ERROR_PAGE: '/error',
} as const;

/**
 * Expected status text values for test verification
 */
export const STATUS_TEXTS = {
  /** Status when ready for testing */
  READY: 'Status: Ready for testing',
  /** Status after successful initialization */
  INITIALIZED: 'Status: Initialized successfully',
  /** Status for valid project ID validation */
  VALIDATION_PASS: 'PASS: Valid project ID accepted',
  /** Status for invalid project ID validation */
  VALIDATION_FAIL: 'FAIL: Invalid project ID rejected',
} as const;

/**
 * Common error messages expected in tests
 */
export const ERROR_MESSAGES = {
  /** Error when project ID is missing */
  ID_REQUIRED: 'Project ID is required',
  /** Error for invalid app configuration */
  INVALID_APP_CONFIG: 'Project ID is required',
  /** Error when configuration is not an object */
  UNDEFINED_CONFIG: 'Configuration must be an object',
  /** Error when app is not initialized */
  APP_NOT_INITIALIZED: 'App not initialized',
  /** Error when trying to initialize twice */
  ALREADY_INITIALIZED: 'TraceLog is already initialized',
  /** Error for invalid project ID format */
  INVALID_PROJECT_ID: 'Invalid project ID format',
} as const;

/**
 * Console monitoring configuration and behavior settings
 */
export const CONSOLE_MONITORING: ConsoleMonitoringConfig = {
  /** Prefix used to identify TraceLog-specific console messages */
  TRACELOG_PREFIX: '[TraceLog:',
  /** Threshold for warning count before flagging as potential issue */
  WARNING_THRESHOLD: 10,
  /** Maximum number of recent errors to include in anomaly reports */
  MAX_SAMPLE_SIZE: 3,
  /** Pattern definitions for detecting common issues in logs */
  PROBLEM_PATTERNS: [
    {
      pattern: 'failed',
      threshold: 3,
      name: 'failures',
    },
    {
      pattern: 'error',
      threshold: 5,
      name: 'error mentions',
    },
    {
      pattern: 'timeout',
      threshold: 2,
      name: 'timeouts',
    },
    {
      pattern: 'retry',
      threshold: 5,
      name: 'retries',
    },
    {
      pattern: 'rejected',
      threshold: 3,
      name: 'rejections',
    },
    {
      pattern: 'abort',
      threshold: 2,
      name: 'aborts',
    },
  ],
} as const;

/**
 * Test selectors used across different test scenarios
 */
export const TEST_SELECTORS = {
  /** Main status indicator elements */
  STATUS: {
    INIT: '[data-testid="init-status"]',
    VALIDATION: '[data-testid="validation-status"]',
    ERROR: '[data-testid="error-status"]',
    READY: '[data-testid="ready-status"]',
  },
  /** Button elements for interactions */
  BUTTONS: {
    INITIALIZE: '[data-testid="initialize-btn"]',
    VALIDATE: '[data-testid="validate-btn"]',
    RESET: '[data-testid="reset-btn"]',
    TRIGGER_ERROR: '[data-testid="trigger-error-btn"]',
  },
  /** Input elements for forms */
  INPUTS: {
    PROJECT_ID: '[data-testid="project-id-input"]',
    CONFIG: '[data-testid="config-input"]',
  },
  /** Container elements */
  CONTAINERS: {
    MAIN: '[data-testid="main-container"]',
    CONFIG: '[data-testid="config-container"]',
    STATUS: '[data-testid="status-container"]',
  },
} as const;

/**
 * Timeout values for different test operations
 */
export const TIMEOUTS = {
  /** Very short timeout for quick operations */
  VERY_SHORT: 1000,
  /** Short timeout for standard operations */
  SHORT: 3000,
  /** Medium timeout for normal operations */
  MEDIUM: 5000,
  /** Long timeout for complex operations */
  LONG: 10000,
  /** Very long timeout for heavy operations */
  VERY_LONG: 30000,
  /** Navigation timeout */
  NAVIGATION: 30000,
  /** Initialization timeout */
  INITIALIZATION: 10000,
  /** Event wait timeout */
  EVENT_WAIT: 5000,
} as const;

/**
 * Test data and sample configurations
 */
export const TEST_DATA = {
  /** Valid project IDs for testing */
  VALID_PROJECT_IDS: [SpecialProjectId.Skip, 'test-project-123', 'valid-id-456'],
  /** Invalid project IDs for negative testing */
  INVALID_PROJECT_IDS: [
    '',
    null,
    undefined,
    123,
    {},
    [],
    'too-short',
    'a'.repeat(256), // Too long
  ],
  /** Sample configurations for testing */
  CONFIGS: {
    MINIMAL: { id: SpecialProjectId.Skip },
    WITH_SESSION_TIMEOUT: {
      id: SpecialProjectId.Skip,
      sessionTimeout: 900000, // 15 minutes
    },
    WITH_METADATA: {
      id: SpecialProjectId.Skip,
      globalMetadata: {
        testEnvironment: 'e2e',
        version: '1.0.0',
      },
    },
    WITH_INTEGRATIONS: {
      id: SpecialProjectId.Skip,
      integrations: {
        googleAnalytics: {
          measurementId: 'G-TEST123456',
        },
      },
    },
  },
} as const;

/**
 * Regular expressions for validation and parsing
 */
export const REGEX_PATTERNS = {
  /** Pattern for valid project ID format */
  PROJECT_ID: /^[a-zA-Z0-9-_]{8,64}$/,
  /** Pattern for ISO timestamp format */
  ISO_TIMESTAMP: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
  /** Pattern for TraceLog error messages */
  TRACELOG_ERROR: /\[TraceLog:[^\]]+\]/,
  /** Pattern for session ID format */
  SESSION_ID: /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,
} as const;

/**
 * Environment-specific configurations
 */
export const ENVIRONMENT = {
  /** Default test environment settings */
  TEST: {
    NODE_ENV: 'development',
    LOG_LEVEL: 'debug',
    QA_MODE: true,
  },
  /** Production-like test settings */
  PRODUCTION_LIKE: {
    NODE_ENV: 'production',
    LOG_LEVEL: 'error',
    QA_MODE: false,
  },
} as const;
