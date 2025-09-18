export const PERFORMANCE_THRESHOLDS = {
  INITIALIZATION_TIME_MS: 100, // Library should initialize within 100ms
  MAIN_THREAD_BLOCKING_MS: 50, // Should not block main thread for more than 50ms (practical threshold)
  MEMORY_INCREASE_BYTES: 1024 * 1024, // Should not increase memory by more than 1MB
  USER_INTERACTION_DELAY_MS: 20, // User interactions should not be delayed by more than 20ms
  EVENT_PROCESSING_TIME_MS: 50, // Event processing should complete within 50ms
  ASYNC_OPERATION_DELAY_MS: 100, // Async operations should not delay interactions by more than 100ms
} as const;

export const PERFORMANCE_TEST_CONSTANTS = {
  MEASUREMENT_ITERATIONS: 10, // Number of times to repeat measurements for average
  MEMORY_MEASUREMENT_DELAY: 500, // Delay between memory measurements in ms
  USER_INTERACTION_COUNT: 20, // Number of user interactions to test
  PASSIVE_LISTENER_EVENTS: ['scroll', 'touchstart', 'touchmove', 'wheel', 'mousewheel'] as const,
  LONG_TASK_DURATION_MS: 60, // Duration for simulated long tasks
  HEAVY_COMPUTATION_ITERATIONS: 50000, // Iterations for heavy computation simulation
} as const;

export const PERFORMANCE_ERROR_MESSAGES = {
  INITIALIZATION_TOO_SLOW: 'Library initialization exceeded acceptable time threshold',
  MAIN_THREAD_BLOCKED: 'Main thread was blocked for too long during tracking operations',
  MEMORY_LEAK_DETECTED: 'Memory usage increased beyond acceptable threshold',
  USER_INTERACTION_DELAYED: 'User interactions were delayed by tracking functionality',
  EVENT_PROCESSING_SLOW: 'Event processing exceeded acceptable time threshold',
  ASYNC_OPERATION_BLOCKING: 'Async operations interfered with user interactions',
  PASSIVE_LISTENERS_NOT_USED: 'Passive event listeners are not being used where appropriate',
} as const;

export const PERFORMANCE_TEST_SELECTORS = {
  PERFORMANCE_TEST_BUTTON: '[data-testid="performance-test-btn"]',
  SCROLL_CONTAINER: '[data-testid="scroll-container"]',
  INTERACTION_TARGET: '[data-testid="interaction-target"]',
  HEAVY_CONTENT: '[data-testid="heavy-content"]',
} as const;
