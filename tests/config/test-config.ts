/**
 * Centralized Test Configuration for TraceLog E2E Tests
 *
 * This file consolidates all test-related configuration in one place,
 * making it easier to maintain and modify test behavior across the suite.
 */

import { Config } from '../../src/types';
import { SpecialProjectId } from '../../src/types';

/**
 * Base URLs for different environments
 */
export const TEST_URLS = {
  LOCAL: 'http://localhost:3000',
  STAGING: 'https://staging-tracelog.example.com',
  PRODUCTION: 'https://tracelog.example.com',
} as const;

/**
 * Timeout configurations for different operations
 */
export const TIMEOUTS = {
  // Very short operations (element clicks, simple evaluations)
  VERY_SHORT: 1000,

  // Short operations (page loads, simple waits)
  SHORT: 3000,

  // Standard operations (initialization, basic interactions)
  STANDARD: 5000,

  // Long operations (complex scenarios, multiple interactions)
  LONG: 10000,

  // Very long operations (stress tests, heavy scenarios)
  VERY_LONG: 30000,

  // Specific operation timeouts
  PAGE_LOAD: 15000,
  INITIALIZATION: 10000,
  EVENT_CAPTURE: 5000,
  BRIDGE_AVAILABILITY: 5000,
  USER_INTERACTION: 3000,
  API_RESPONSE: 8000,

  // CI-specific timeouts (generally longer)
  CI: {
    PAGE_LOAD: 30000,
    INITIALIZATION: 20000,
    EVENT_CAPTURE: 10000,
    USER_INTERACTION: 10000,
    API_RESPONSE: 15000,
  },
} as const;

/**
 * Browser configuration interface
 */
export interface BrowserConfig {
  name: string;
  viewport: { width: number; height: number };
  userAgent?: string;
  isMobile?: boolean;
  hasTouch?: boolean;
}

/**
 * Browser-specific configurations
 */
export const BROWSER_CONFIGS: Record<string, BrowserConfig> = {
  CHROMIUM: {
    name: 'chromium',
    viewport: { width: 1280, height: 720 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 TraceLogTest/1.0',
  },
  FIREFOX: {
    name: 'firefox',
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0 TraceLogTest/1.0',
  },
  WEBKIT: {
    name: 'webkit',
    viewport: { width: 1280, height: 720 },
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15 TraceLogTest/1.0',
  },
  MOBILE_CHROME: {
    name: 'Mobile Chrome',
    viewport: { width: 375, height: 667 },
    isMobile: true,
    hasTouch: true,
  },
  MOBILE_SAFARI: {
    name: 'Mobile Safari',
    viewport: { width: 375, height: 667 },
    isMobile: true,
    hasTouch: true,
  },
} as const;

/**
 * TraceLog-specific test configurations
 */
export const TRACELOG_CONFIGS: Record<string, Partial<Config>> = {
  // Minimal configuration for basic tests
  MINIMAL: {
    id: SpecialProjectId.Skip,
  },

  // Standard configuration for most tests
  STANDARD: {
    id: SpecialProjectId.Skip,
    sessionTimeout: 900000, // 15 minutes
    errorSampling: 1, // Capture all errors in tests
  },

  // Full configuration with all features enabled
  FULL_FEATURED: {
    id: SpecialProjectId.Skip,
    sessionTimeout: 900000,
    globalMetadata: {
      testEnvironment: 'e2e',
      testSuite: 'full_featured',
      version: '1.0.0',
    },
    scrollContainerSelectors: ['.hero', '.products-grid', '.features'],
    sensitiveQueryParams: ['token', 'apiKey', 'sessionId'],
    errorSampling: 1,
  },

  // Configuration for performance testing
  PERFORMANCE: {
    id: SpecialProjectId.Skip,
    sessionTimeout: 1800000, // 30 minutes
    globalMetadata: {
      testType: 'performance',
      collectWebVitals: true,
    },
    errorSampling: 1,
  },

  // Configuration for error and resilience testing
  ERROR_TESTING: {
    id: SpecialProjectId.Skip,
    sessionTimeout: 300000, // 5 minutes
    globalMetadata: {
      testType: 'error_resilience',
      expectErrors: true,
    },
    errorSampling: 1,
  },

  // Configuration for mobile testing
  MOBILE: {
    id: SpecialProjectId.Skip,
    sessionTimeout: 600000, // 10 minutes
    globalMetadata: {
      testType: 'mobile',
      isMobile: true,
    },
    errorSampling: 1,
  },

  // Configuration with Google Analytics integration
  WITH_GA: {
    id: SpecialProjectId.Skip,
    sessionTimeout: 900000, // 15 minutes
    integrations: {
      googleAnalytics: {
        measurementId: 'GA-TEST-123456',
      },
    },
    errorSampling: 1,
  },

  // Configuration for integration testing
  INTEGRATION: {
    id: SpecialProjectId.Skip,
    sessionTimeout: 1200000, // 20 minutes
    globalMetadata: {
      testType: 'integration',
      includeIntegrations: true,
    },
    integrations: {
      googleAnalytics: {
        measurementId: 'G-TEST123456',
      },
    },
    errorSampling: 1,
  },
} as const;

/**
 * Test data generators and factories
 */
export const TEST_DATA = {
  // Valid project IDs for testing
  VALID_PROJECT_IDS: [SpecialProjectId.Skip, 'test-project-123', 'valid-id-456', 'e2e-test-project'],

  // Invalid project IDs for negative testing
  INVALID_PROJECT_IDS: [
    '', // Empty string
    null, // Null value
    undefined, // Undefined value
    123, // Number instead of string
    {}, // Object instead of string
    [], // Array instead of string
    'short', // Too short
    'a'.repeat(256), // Too long
    'invalid@chars!', // Invalid characters
  ],

  // Sample custom events for testing
  SAMPLE_CUSTOM_EVENTS: [
    { name: 'user_action', data: { type: 'click', element: 'button' } },
    { name: 'page_interaction', data: { section: 'hero', action: 'scroll' } },
    { name: 'conversion_event', data: { step: 'signup', value: 100 } },
    { name: 'error_event', data: { type: 'validation', field: 'email' } },
  ],

  // Sample metadata for testing
  SAMPLE_METADATA: {
    user: { id: 'test-user-123', type: 'test' },
    session: { type: 'e2e-test', duration: 1800 },
    page: { category: 'product', section: 'listing' },
    feature: { name: 'checkout', version: 'v2' },
  },
} as const;

/**
 * Environment-specific configurations
 */
export const ENVIRONMENT_CONFIG = {
  LOCAL: {
    baseURL: TEST_URLS.LOCAL,
    timeout: TIMEOUTS.STANDARD,
    retries: 0,
    workers: undefined, // Use all available cores
    reporter: ['list', 'html'],
  },

  CI: {
    baseURL: TEST_URLS.LOCAL,
    timeout: TIMEOUTS.CI.PAGE_LOAD,
    retries: 1, // Retry once on CI for flaky tests
    workers: 4, // Limit workers on CI
    reporter: ['list', 'github', 'html'],
    globalTimeout: 15 * 60 * 1000, // 15 minutes total
  },

  STAGING: {
    baseURL: TEST_URLS.STAGING,
    timeout: TIMEOUTS.LONG,
    retries: 2,
    workers: 2,
    reporter: ['list', 'html'],
  },
} as const;

/**
 * Test selectors organized by component/feature
 */
export const TEST_SELECTORS = {
  // Playground elements
  PLAYGROUND: {
    CTA_BUTTON: '[data-testid="cta-ver-productos"]',
    ADD_TO_CART: (productId: number) => `[data-testid="add-cart-${productId}"]`,
    PRODUCT_CARD: (index: number) => `.product-card:nth-child(${index})`,
    HERO_SECTION: '.hero',
    PRODUCTS_GRID: '.products-grid',
    FEATURES_SECTION: '.features',
    NEWSLETTER_FORM: '#newsletter-form',
    NEWSLETTER_EMAIL: '#newsletter-email',
    NEWSLETTER_SUBMIT: '#newsletter-submit',
  },

  // Status indicators (for future test pages)
  STATUS: {
    INIT: '[data-testid="init-status"]',
    VALIDATION: '[data-testid="validation-status"]',
    ERROR: '[data-testid="error-status"]',
    READY: '[data-testid="ready-status"]',
  },

  // Control buttons (for future test pages)
  BUTTONS: {
    INITIALIZE: '[data-testid="initialize-btn"]',
    VALIDATE: '[data-testid="validate-btn"]',
    RESET: '[data-testid="reset-btn"]',
    TRIGGER_ERROR: '[data-testid="trigger-error-btn"]',
  },
} as const;

/**
 * Regular expressions for validation and matching
 */
export const PATTERNS = {
  SESSION_ID: /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,
  ISO_TIMESTAMP: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
  TRACELOG_ERROR: /\[TraceLog:[^\]]+\]/,
  PROJECT_ID: /^[a-zA-Z0-9-_]{8,64}$/,
  URL: /^https?:\/\/.+/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

/**
 * Error messages and expected text patterns
 */
export const EXPECTED_MESSAGES = {
  SUCCESS: {
    INITIALIZATION: 'Initialization completed',
    EVENT_SENT: 'Event sent successfully',
    SESSION_STARTED: 'Session started',
  },
  ERRORS: {
    INVALID_CONFIG: 'Invalid configuration',
    MISSING_ID: 'Project ID is required',
    ALREADY_INITIALIZED: 'Already initialized',
    BRIDGE_UNAVAILABLE: 'TraceLog bridge not available',
  },
  WARNINGS: {
    DEPRECATED_METHOD: 'deprecated',
    PERFORMANCE_WARNING: 'Performance warning',
  },
} as const;

/**
 * Feature flags for enabling/disabling test features
 */
export const FEATURE_FLAGS = {
  // Enable screenshot capture on failures
  SCREENSHOTS_ON_FAILURE: true,

  // Enable video recording for debugging
  VIDEO_RECORDING: process.env.CI ? false : true,

  // Enable trace files for detailed debugging
  TRACE_ON_FAILURE: true,

  // Enable console log capture and analysis
  CONSOLE_MONITORING: true,

  // Enable performance monitoring
  PERFORMANCE_MONITORING: true,

  // Enable mobile device testing
  MOBILE_TESTING: true,

  // Enable cross-browser testing (may be disabled in CI for speed)
  CROSS_BROWSER_TESTING: process.env.CI ? false : true,

  // Enable experimental features
  EXPERIMENTAL_FEATURES: false,
} as const;

/**
 * Get current environment configuration
 */
export function getCurrentEnvironmentConfig():
  | typeof ENVIRONMENT_CONFIG.LOCAL
  | typeof ENVIRONMENT_CONFIG.CI
  | typeof ENVIRONMENT_CONFIG.STAGING {
  if (process.env.CI) {
    return ENVIRONMENT_CONFIG.CI;
  }
  if (process.env.STAGING) {
    return ENVIRONMENT_CONFIG.STAGING;
  }
  return ENVIRONMENT_CONFIG.LOCAL;
}

/**
 * Get appropriate timeout for current environment
 */
export function getTimeout(operation: keyof typeof TIMEOUTS): number {
  const baseTimeout = TIMEOUTS[operation] as number;

  if (process.env.CI) {
    // Use CI timeouts if available, otherwise multiply by 2
    const ciTimeout = TIMEOUTS.CI[operation as keyof typeof TIMEOUTS.CI] as number | undefined;
    return ciTimeout ?? baseTimeout * 2;
  }

  return baseTimeout;
}

/**
 * Get browser configurations for current environment
 */
export function getBrowserConfigs(): BrowserConfig[] {
  if (!FEATURE_FLAGS.CROSS_BROWSER_TESTING) {
    // Only use Chromium for faster testing
    return [BROWSER_CONFIGS.CHROMIUM];
  }

  const configs: BrowserConfig[] = [BROWSER_CONFIGS.CHROMIUM, BROWSER_CONFIGS.FIREFOX, BROWSER_CONFIGS.WEBKIT];

  if (FEATURE_FLAGS.MOBILE_TESTING) {
    configs.push(BROWSER_CONFIGS.MOBILE_CHROME, BROWSER_CONFIGS.MOBILE_SAFARI);
  }

  return configs;
}

export default {
  TEST_URLS,
  TIMEOUTS,
  BROWSER_CONFIGS,
  TRACELOG_CONFIGS,
  TEST_DATA,
  ENVIRONMENT_CONFIG,
  TEST_SELECTORS,
  PATTERNS,
  EXPECTED_MESSAGES,
  FEATURE_FLAGS,
  getCurrentEnvironmentConfig,
  getTimeout,
  getBrowserConfigs,
};
