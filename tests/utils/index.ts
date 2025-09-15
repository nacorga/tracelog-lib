import * as CommonHelpers from './common.helpers';
import * as EventTrackingHelpers from './event-tracking.helpers';
import * as SessionManagementHelpers from './session-management.helpers';
import * as InitializationHelpers from './initialization.helpers';

export const TestUtils = {
  // Core shared utilities
  ...CommonHelpers,

  // Event tracking helpers
  ...EventTrackingHelpers,

  // Session management helpers
  ...SessionManagementHelpers,

  // Initialization helpers
  ...InitializationHelpers,
};
