import * as CommonUtils from './common.utils';
import * as EventTrackingUtils from './event-tracking.utils';
import * as SessionManagementUtils from './session-management.utils';
import * as InitializationUtils from './initialization.utils';
import * as PerformanceTrackingUtils from './performance-tracking.utils';

export const TestUtils = {
  // Core shared utilities
  ...CommonUtils,

  // Event tracking utils
  ...EventTrackingUtils,

  // Session management utils
  ...SessionManagementUtils,

  // Initialization utils
  ...InitializationUtils,

  // Performance tracking utils
  ...PerformanceTrackingUtils,
};
