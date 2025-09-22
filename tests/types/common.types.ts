/**
 * Enhanced ConsoleMonitor interface with improved functionality
 */
export interface ConsoleMonitor {
  /** All captured console messages */
  consoleMessages: string[];
  /** TraceLog-specific error messages */
  traceLogErrors: string[];
  /** TraceLog-specific warning messages */
  traceLogWarnings: string[];
  /** TraceLog-specific info/log messages */
  traceLogInfo: string[];
  /** All debug logs with timestamps and formatting */
  debugLogs: string[];
  /** Non-TraceLog error messages */
  contextErrors: string[];
  /** Cleanup function to remove event listeners */
  cleanup: () => void;
  /** Function to analyze captured messages for anomalies */
  getAnomalies: () => string[];
  /** Function to get summary statistics */
  getSummary: () => ConsoleMonitorSummary;
  /** Function to check if monitor has been disposed */
  isDisposed: () => boolean;
}

/**
 * Summary statistics for console monitor
 */
export interface ConsoleMonitorSummary {
  /** Total number of console messages */
  total: number;
  /** Number of TraceLog error messages */
  traceLogErrors: number;
  /** Number of TraceLog warning messages */
  traceLogWarnings: number;
  /** Number of TraceLog info messages */
  traceLogInfo: number;
  /** Number of context error messages */
  contextErrors: number;
  /** Number of debug log entries */
  debugLogs: number;
}

/**
 * Enhanced initialization result with detailed error information
 */
export interface InitializationResult {
  /** Whether initialization was successful */
  success: boolean;
  /** Error message if initialization failed */
  error: string | null;
  /** Type of error that occurred */
  errorType: 'BRIDGE_NOT_FOUND' | 'INITIALIZATION_ERROR' | null;
  /** Whether an error occurred (derived field) */
  hasError: boolean;
}

/**
 * Navigation options for navigateAndWaitForReady function
 */
export interface NavigationOptions {
  /** URL to navigate to */
  url?: string;
  /** CSS selector to wait for after navigation */
  statusSelector?: string;
  /** Maximum time to wait for navigation and selectors */
  timeout?: number;
  /** Load state to wait for */
  waitForLoadState?: 'domcontentloaded' | 'load' | 'networkidle';
}

/**
 * Configuration for console monitoring behavior
 */
export interface ConsoleMonitoringConfig {
  /** Prefix used to identify TraceLog messages */
  TRACELOG_PREFIX: string;
  /** Threshold for warning count before flagging as anomaly */
  WARNING_THRESHOLD: number;
  /** Maximum number of error samples to include in anomaly reports */
  MAX_SAMPLE_SIZE: number;
  /** Pattern definitions for anomaly detection */
  PROBLEM_PATTERNS: Array<{
    /** Pattern to search for in log messages */
    pattern: string;
    /** Threshold count before flagging as anomaly */
    threshold: number;
    /** Human-readable name for the pattern */
    name: string;
  }>;
}

/**
 * Error types that can occur during test operations
 */
export type TestErrorType =
  | 'NAVIGATION_FAILED'
  | 'INITIALIZATION_FAILED'
  | 'BRIDGE_NOT_FOUND'
  | 'CONDITION_TIMEOUT'
  | 'VALIDATION_ERROR'
  | 'CLEANUP_ERROR';

/**
 * Result of a test operation with detailed error information
 */
export interface TestOperationResult<T = unknown> {
  /** Whether the operation was successful */
  success: boolean;
  /** Result data if successful */
  data?: T;
  /** Error information if failed */
  error?: {
    /** Type of error */
    type: TestErrorType;
    /** Error message */
    message: string;
    /** Original error object */
    cause?: unknown;
  };
}

/**
 * Options for waiting for conditions
 */
export interface WaitConditionOptions {
  /** Maximum time to wait in milliseconds */
  timeout?: number;
  /** Polling interval in milliseconds */
  interval?: number;
  /** Description for error messages */
  description?: string;
}

/**
 * Generic disposable resource interface
 */
export interface Disposable {
  /** Cleanup function that can be sync or async */
  cleanup: () => void | Promise<void>;
}

/**
 * Enhanced error class for test utilities
 */
export class TestUtilityError extends Error {
  constructor(
    message: string,
    public readonly type: TestErrorType,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'TestUtilityError';
  }

  /**
   * Creates a TestUtilityError with formatted context
   */
  static create(type: TestErrorType, message: string, cause?: unknown): TestUtilityError {
    const formattedMessage = `[${type}] ${message}`;
    return new TestUtilityError(formattedMessage, type, cause);
  }
}
