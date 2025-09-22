/**
 * TraceLog E2E Test Utilities
 *
 * Centralized exports for all test utilities, providing a clean and organized
 * interface for E2E testing of the TraceLog client library.
 *
 * This module exports utilities organized by functionality:
 * - Common utilities for page navigation, console monitoring, and initialization
 * - Event capture utilities for testing TraceLog event dispatching
 * - Type definitions and interfaces
 * - Constants and configuration values
 *
 * @example
 * ```typescript
 * import { TestUtils } from './tests/utils';
 *
 * // Use common utilities
 * const monitor = TestUtils.createConsoleMonitor(page);
 * await TestUtils.navigateAndWaitForReady(page);
 *
 * // Use event capture
 * const capture = new TestUtils.EventCapture();
 * await capture.startCapture(page);
 * ```
 */

// Re-export all common utilities with comprehensive JSDoc
import * as CommonUtils from './common.utils';
import { EventCapture, createEventCapture, createFilter } from './event-capture.utils';
import { InteractionUtils } from './interaction-simulation.utils';
import { EventAssertions } from './event-assertions.utils';
import { NetworkUtils } from './network-simulation.utils';
import { SessionUtils } from './session-testing.utils';

// Re-export types for external usage
export type {
  // Common types
  ConsoleMonitor,
  ConsoleMonitorSummary,
  InitializationResult,
  NavigationOptions,
  ConsoleMonitoringConfig,
  TestErrorType,
  TestOperationResult,
  WaitConditionOptions,
  Disposable,

  // Event capture types
  EventLogDispatch,
  EventLogDispatchFilter,
  EventCaptureOptions,
  EventWaitOptions,
  EventCaptureStats,
  EventFilterBuilder,
  EventCaptureState,
  EventValidationResult,
  CommonEventFilters,
  EventCaptureErrorType,
} from '../types';

// Re-export error classes
export { TestUtilityError, EventCaptureError } from '../types';

// Re-export constants with organized grouping
export {
  // Common constants
  DEFAULT_CONFIG,
  TEST_URLS,
  STATUS_TEXTS,
  ERROR_MESSAGES,
  CONSOLE_MONITORING,
  TEST_SELECTORS,
  TIMEOUTS,
  TEST_DATA,
  REGEX_PATTERNS,
  ENVIRONMENT,
} from '../constants/common.constants';

export {
  // Event capture constants
  COMMON_FILTERS,
  DEFAULT_TIMEOUT,
  EVENT_CAPTURE_DEFAULTS,
  EVENT_NAMESPACES,
  EVENT_MESSAGES,
  EVENT_PRIORITIES,
  EVENT_BATCH_CONFIG,
  EVENT_VALIDATION,
} from '../constants/event-capture.constants';

/**
 * Main TestUtils namespace providing organized access to all utilities
 *
 * This is the primary export that consolidates all test utilities
 * under a single namespace for easy access and discovery.
 */
export const TestUtils = {
  // Common utilities - Core functionality for page navigation and monitoring

  /**
   * Retrieves the TraceLog test bridge instance from the browser window
   * @see {@link CommonUtils.getAppInstance}
   */
  getAppInstance: CommonUtils.getAppInstance,

  /**
   * Creates a console monitor for capturing and analyzing console messages
   * @see {@link CommonUtils.createConsoleMonitor}
   */
  createConsoleMonitor: CommonUtils.createConsoleMonitor,

  /**
   * Navigates to a URL and waits for the page to be ready for testing
   * @see {@link CommonUtils.navigateAndWaitForReady}
   */
  navigateAndWaitForReady: CommonUtils.navigateAndWaitForReady,

  /**
   * Initializes TraceLog in the browser context with comprehensive error handling
   * @see {@link CommonUtils.initializeTraceLog}
   */
  initializeTraceLog: CommonUtils.initializeTraceLog,

  /**
   * Validates and type-guards an initialization result object
   * @see {@link CommonUtils.verifyInitializationResult}
   */
  verifyInitializationResult: CommonUtils.verifyInitializationResult,

  /**
   * Verifies that no TraceLog-specific errors were captured
   * @see {@link CommonUtils.verifyNoTraceLogErrors}
   */
  verifyNoTraceLogErrors: CommonUtils.verifyNoTraceLogErrors,

  /**
   * Waits for a specific condition to be met with configurable polling
   * @see {@link CommonUtils.waitForCondition}
   */
  waitForCondition: CommonUtils.waitForCondition,

  /**
   * Creates a disposable resource that ensures cleanup is called
   * @see {@link CommonUtils.withCleanup}
   */
  withCleanup: CommonUtils.withCleanup,

  // Event capture utilities - For testing TraceLog event dispatching

  /**
   * Enhanced EventCapture class for capturing TraceLog events
   * @see {@link EventCapture}
   */
  EventCapture,

  /**
   * Factory function to create new EventCapture instances
   * @see {@link createEventCapture}
   */
  createEventCapture,

  /**
   * Utility functions for creating common event filters
   * @see {@link createFilter}
   */
  createFilter,

  // Interaction simulation utilities - For simulating user interactions

  /**
   * User interaction simulation utilities for realistic test scenarios
   * @see {@link InteractionUtils}
   */
  InteractionUtils,

  // Event assertion utilities - For validating TraceLog events and behaviors

  /**
   * Specialized assertion utilities for TraceLog event validation
   * @see {@link EventAssertions}
   */
  EventAssertions,

  // Network simulation utilities - For testing network conditions and failures

  /**
   * Network and error simulation utilities for resilience testing
   * @see {@link NetworkUtils}
   */
  NetworkUtils,

  // Session testing utilities - For testing session management features

  /**
   * Session management testing utilities for lifecycle and coordination
   * @see {@link SessionUtils}
   */
  SessionUtils,
} as const;

/**
 * Legacy export for backward compatibility
 * @deprecated Use named exports or TestUtils namespace instead
 */
export default TestUtils;

/**
 * Organized utility collections for specific use cases
 */

/**
 * Page and navigation utilities
 */
export const PageUtils = {
  navigateAndWaitForReady: CommonUtils.navigateAndWaitForReady,
  getAppInstance: CommonUtils.getAppInstance,
  waitForCondition: CommonUtils.waitForCondition,
} as const;

/**
 * Console monitoring utilities
 */
export const ConsoleUtils = {
  createConsoleMonitor: CommonUtils.createConsoleMonitor,
  verifyNoTraceLogErrors: CommonUtils.verifyNoTraceLogErrors,
} as const;

/**
 * Initialization and configuration utilities
 */
export const InitUtils = {
  initializeTraceLog: CommonUtils.initializeTraceLog,
  verifyInitializationResult: CommonUtils.verifyInitializationResult,
} as const;

/**
 * Event capture and monitoring utilities
 */
export const EventUtils = {
  EventCapture,
  createEventCapture,
  createFilter,
  EventAssertions,
} as const;

/**
 * User interaction simulation utilities
 */
export const InteractionSimulationUtils = {
  ...InteractionUtils,
} as const;

/**
 * Network and error simulation utilities
 */
export const NetworkSimulationUtils = {
  ...NetworkUtils,
} as const;

/**
 * Session management testing utilities
 */
export const SessionTestingUtils = {
  ...SessionUtils,
} as const;

/**
 * Resource management utilities
 */
export const ResourceUtils = {
  withCleanup: CommonUtils.withCleanup,
} as const;
