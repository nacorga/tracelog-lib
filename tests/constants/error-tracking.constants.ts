/**
 * Constants for error tracking tests
 * Contains all hardcoded values, test data, and configuration used across error tracking test files
 */

export const ERROR_TRACKING_CONSTANTS = {
  // Error sampling rates
  SAMPLING: {
    HIGH_SAMPLING_RATE: 1.0,
    DEFAULT_SAMPLING_RATE: 0.1,
    TEST_SAMPLING_RATES: [0.01, 0.1, 0.5, 0.9],
    SAMPLING_TOLERANCE: 0.2, // 20% tolerance for randomness
    SAMPLING_ITERATIONS: 100,
  },

  // JavaScript error test data
  JAVASCRIPT_ERRORS: {
    ERROR_TYPES: [
      { type: 'ReferenceError', code: 'nonExistentVariable.toString()' },
      { type: 'TypeError', code: 'null.property' },
      { type: 'SyntaxError', code: 'eval("invalid js syntax {")' },
      { type: 'RangeError', code: 'new Array(-1)' },
    ],
    ERROR_MESSAGES: {
      SYNC_ERROR: 'Test synchronous error',
      PROMISE_REJECTION: 'Test promise rejection error',
      SETTIMEOUT_CALLBACK: 'setTimeout callback error',
      SAMPLING_TEST: 'Sampling test error',
      QA_MODE_PREFIX: 'QA mode test error',
      METADATA_TEST: 'Metadata test error',
      NONEXISTENT_FUNCTION: 'nonExistentFunction is not defined',
    },
    FILENAMES: {
      TEST_SCRIPT: 'test-script.js',
      CALLBACK: 'callback.js',
      SAMPLING_TEST: 'sampling-test.js',
      QA_TEST: 'qa-test.js',
      METADATA_TEST: 'metadata-test.js',
      ERROR_TYPE_TEST: (type: string) => `${type.toLowerCase()}-test.js`,
    },
    LINE_NUMBERS: {
      DEFAULT: 42,
      CALLBACK: 10,
      METADATA_TEST: 25,
    },
    COLUMN_NUMBERS: {
      DEFAULT: 5,
      CALLBACK: 8,
      METADATA_TEST: 10,
    },
    PROMISE_REJECTION_TYPES: [
      'String error message',
      'Error object rejection',
      { code: 'CUSTOM_ERROR', message: 'Custom error object' },
    ],
  },

  // Network error test data
  NETWORK_ERRORS: {
    ENDPOINTS: {
      NOT_FOUND: '/nonexistent-endpoint',
      SLOW_ENDPOINT: '/slow-endpoint',
      XHR_ERROR_TEST: '/xhr-error-test',
      FAST_TEST: '/fast-test',
      SLOW_TEST: '/slow-test',
      PAYLOAD_TEST: '/payload-test',
      STATUS_TEST: (code: number) => `/status/${code}`,
    },
    HTTP_STATUS_CODES: [400, 401, 403, 404, 500, 502, 503],
    STATUS_TEXTS: {
      NOT_FOUND: 'Not Found',
      NETWORK_ERROR: 'Network Error',
      TIMEOUT: 'Timeout',
      CORS_ERROR: 'CORS Error',
    },
    TIMEOUTS: {
      ABORT_TIMEOUT: 100,
      XHR_TIMEOUT: 1000,
      REQUEST_TIMEOUT: 1500,
      ARTIFICIAL_DELAY: 200,
    },
    CORS_TEST_URL: 'https://httpbin.org/status/404',
    CORS_HEADERS: {
      'X-Custom-Header': 'test',
    },
    DURATION_THRESHOLDS: {
      FAST_REQUEST_MAX: 5000, // Should be under 5 seconds
      SLOW_REQUEST_MIN: 150, // Should be over 150ms due to artificial delay
    },
  },

  // PII sanitization test data
  PII_PATTERNS: {
    EMAILS: [
      'user@example.com',
      'test.email+tag@domain.co.uk',
      'complex.email-address@subdomain.example.org',
      'simple@test.io',
    ],
    PHONE_NUMBERS: ['(555) 123-4567', '555-123-4567', '555.123.4567', '5551234567', '+1-555-123-4567'],
    CREDIT_CARDS: [
      '4111-1111-1111-1111',
      '4111 1111 1111 1111',
      '4111111111111111',
      '5555-5555-5555-4444',
      '378282246310005',
    ],
    URL_PARAMETERS: [
      'https://api.example.com/user?token=abc123secret',
      'https://app.test.com/data?api_key=supersecretkey&user=john',
      'https://service.com/endpoint?access_token=bearer_token_here',
      'https://site.com/path?password=mysecretpass&id=123',
    ],
    SENSITIVE_PARAMS: ['abc123secret', 'supersecretkey', 'bearer_token_here', 'mysecretpass'],
  },

  // Error message templates
  ERROR_MESSAGE_TEMPLATES: {
    EMAIL_ERROR: (email: string) => `Failed to process user: ${email}`,
    PHONE_ERROR: (phone: string) => `Invalid phone number: ${phone}`,
    CARD_ERROR: (card: string) => `Payment failed for card: ${card}`,
    URL_ERROR: (url: string) => `Request failed to: ${url}`,
    VALIDATION_ERROR: (userEmail: string) => `Invalid email format for: ${userEmail}`,
    PHONE_VALIDATION_ERROR: (userPhone: string) => `Phone validation failed for: ${userPhone}`,
  },

  // Legitimate data preservation test cases
  LEGITIMATE_DATA: [
    {
      message: 'Error in function calculateTotal() at line 42',
      shouldPreserve: ['calculateTotal', 'line 42', 'function'],
    },
    {
      message: 'Network timeout after 5000ms for endpoint /api/users',
      shouldPreserve: ['Network timeout', '5000ms', '/api/users'],
    },
    {
      message: 'Invalid response format from server: expected JSON',
      shouldPreserve: ['Invalid response format', 'server', 'JSON'],
    },
  ],

  // Complex PII error test cases
  COMPLEX_PII_CASES: [
    {
      message: 'User john.doe@company.com (phone: 555-123-4567) payment with card 4111-1111-1111-1111 failed',
      piiItems: ['john.doe@company.com', '555-123-4567', '4111-1111-1111-1111'],
    },
    {
      message: 'API call to https://api.service.com/users?token=secret123&email=test@user.com returned 401',
      piiItems: ['secret123', 'test@user.com'],
    },
    {
      message:
        'Database connection failed for user admin@system.local with credentials in env var DATABASE_PASSWORD=superSecret',
      piiItems: ['admin@system.local', 'superSecret'],
    },
  ],

  // Performance test configuration
  PERFORMANCE: {
    SANITIZATION_ITERATIONS: 50,
    MAX_AVERAGE_TIME_MS: 10, // Should be under 10ms per error on average
    MAX_TOTAL_TIME_MS: 500, // Total should be under 500ms for 50 errors
    PII_TEST_MESSAGE: 'Error processing user@example.com with phone (555) 123-4567 and card 4111-1111-1111-1111',
  },

  // Test file names
  FILENAMES: {
    EMAIL_TEST: 'email-test.js',
    PHONE_TEST: 'phone-test.js',
    CARD_TEST: 'card-test.js',
    URL_TEST: 'url-test.js',
    LEGITIMATE_TEST: 'legitimate-test.js',
    STACK_TRACE_TEST: 'stack-trace-test.js',
    PERFORMANCE_TEST: 'performance-test.js',
    COMPLEX_TEST: 'complex-test.js',
  },

  // Timeouts and intervals
  TIMEOUTS: {
    SHORT_WAIT: 100,
    DEFAULT_WAIT: 200,
    MEDIUM_WAIT: 500,
    LONG_WAIT: 1000,
    PERFORMANCE_TEST_WAIT: 1000,
  },

  // Log message patterns
  LOG_PATTERNS: {
    TRACELOG_PREFIX: '[TraceLog:',
    ERROR_HANDLER: 'ErrorHandler',
    NETWORK_KEYWORDS: ['network'],
    SANITIZATION_KEYWORDS: [
      'Failed to process user',
      'Invalid phone number',
      'Payment failed for card',
      'Request failed to',
    ],
    SAMPLING_SKIP_KEYWORDS: ['not sampled', 'skipping'],
    STACK_TRACE_KEYWORDS: ['validateEmail', 'validatePhone', 'processUserData'],
  },

  // Stack trace test data
  STACK_TRACE: {
    TEST_EMAIL: 'sensitive@email.com',
    TEST_PHONE: '555-123-4567',
    FUNCTION_NAMES: {
      PROCESS_USER_DATA: 'processUserData',
      VALIDATE_EMAIL: 'validateEmail',
      VALIDATE_PHONE: 'validatePhone',
    },
    LINE_NUMBERS: {
      STACK_TRACE_TEST: 5,
    },
    COLUMN_NUMBERS: {
      STACK_TRACE_TEST: 12,
    },
  },
} as const;
