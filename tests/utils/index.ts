import * as CommonHelpers from './common.helpers';
import * as EventTrackingHelpers from './event-tracking.helpers';
import * as SessionManagementHelpers from './session-management.helpers';
import * as InitializationHelpers from './initialization.helpers';
import * as PerformanceTrackingHelpers from './performance-tracking.helpers';

export const TestUtils = {
  // Core shared utilities
  ...CommonHelpers,

  // Event tracking helpers
  ...EventTrackingHelpers,

  // Session management helpers
  ...SessionManagementHelpers,

  // Initialization helpers
  ...InitializationHelpers,

  // Performance tracking helpers
  ...PerformanceTrackingHelpers,
};
