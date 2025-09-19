/**
 * TypeScript type definitions for error tracking tests
 * Contains interfaces and types used across error tracking test files
 */

/**
 * JavaScript error test configuration
 */
export interface ErrorTestConfig {
  type: string;
  code: string;
}

/**
 * Error event initialization result
 */
export interface ErrorEventResult {
  errorTriggered: boolean;
  errorMessage?: string;
  status?: number;
  statusText?: string;
  duration?: number;
  error?: string;
}

/**
 * Network error event detail
 */
export interface NetworkErrorDetail {
  type: 'network';
  url: string;
  method: string;
  status: number;
  statusText: string;
  duration: number;
  message?: string;
  timestamp?: number;
}

/**
 * Network error test result
 */
export interface NetworkErrorTestResult {
  status?: number;
  statusText?: string;
  duration: number;
  errorTriggered: boolean;
  error?: string;
}

/**
 * Duration test result
 */
export interface DurationTestResult {
  type: string;
  duration: number;
}

/**
 * Performance test result for error sanitization
 */
export interface PerformanceTestResult {
  totalTime: number;
  averageTime: number;
  iterations: number;
}

/**
 * Sampling test result
 */
export interface SamplingTestResult {
  expectedRate: number;
  actualRate: number;
  captures: number;
  iterations: number;
}

/**
 * PII test case definition
 */
export interface PiiTestCase {
  message: string;
  piiItems: string[];
}

/**
 * Legitimate data preservation test case
 */
export interface LegitimateDataTestCase {
  message: string;
  shouldPreserve: readonly string[];
}

/**
 * Error event metadata
 */
export interface ErrorEventMetadata {
  message: string;
  filename: string;
  lineno: number;
  colno: number;
  error: Error | unknown;
}

/**
 * Custom error event detail
 */
export interface CustomErrorEventDetail {
  [key: string]: unknown;
}

/**
 * XHR error test result
 */
export interface XhrErrorResult {
  status?: number;
  statusText?: string;
  duration: number;
  errorTriggered: boolean;
  error?: string;
}

/**
 * Error validation result
 */
export interface ErrorValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Stack trace test function definitions
 */
export interface StackTraceTestFunctions {
  processUserData: (email: string, phone: string) => void;
  validateEmail: (userEmail: string) => void;
  validatePhone: (userPhone: string) => void;
}

/**
 * Error tracking configuration
 */
export interface ErrorTrackingConfig {
  errorSampling?: number;
  qaMode?: boolean;
  debugMode?: boolean;
}

/**
 * Error event type enumeration
 */
export type ErrorEventType = 'error' | 'unhandledrejection' | 'network-error' | 'custom';

/**
 * HTTP method types
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'PATCH';

/**
 * Error severity levels
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * PII data types
 */
export type PiiDataType = 'email' | 'phone' | 'creditCard' | 'url' | 'token' | 'password';

/**
 * Error sanitization result
 */
export interface SanitizationResult {
  originalMessage: string;
  sanitizedMessage: string;
  piiFound: PiiDataType[];
  sanitizationApplied: boolean;
}

/**
 * Network error event payload structure
 */
export interface NetworkErrorPayload {
  type: 'network';
  url: string;
  method: HttpMethod;
  status: number;
  statusText: string;
  duration: number;
  message?: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/**
 * JavaScript error event payload structure
 */
export interface JavaScriptErrorPayload {
  type: 'error';
  message: string;
  filename: string;
  lineno: number;
  colno: number;
  stack?: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/**
 * Error handler test configuration
 */
export interface ErrorHandlerTestConfig {
  sampling: {
    rate: number;
    iterations: number;
    tolerance: number;
  };
  timeout: {
    short: number;
    medium: number;
    long: number;
  };
  validation: {
    expectSanitization: boolean;
    expectSampling: boolean;
    expectMetadata: boolean;
  };
}

/**
 * Test execution context
 */
export interface ErrorTestContext {
  testName: string;
  config: ErrorTrackingConfig;
  expectedErrors: number;
  timeoutMs: number;
  retryCount: number;
}

/**
 * Error test assertion helpers
 */
export interface ErrorTestAssertions {
  hasErrorActivity: boolean;
  hasSanitizationActivity: boolean;
  hasNetworkActivity: boolean;
  hasStackTraceActivity: boolean;
  hasPerformanceActivity: boolean;
  leakedPiiCount: number;
  errorCount: number;
  warningCount: number;
}
