import * as CommonUtils from './common.utils';
import { EventCapture } from './event-capture.utils';
import { COMMON_FILTERS, DEFAULT_TIMEOUT } from '../constants/event-capture.constants';

export const TestUtils = {
  // Core shared utilities
  ...CommonUtils,

  // Event capture utilities
  EventCapture,
  COMMON_FILTERS,
  DEFAULT_TIMEOUT,
};

// Export individual items as well for convenience
export * from './common.utils';
export { EventCapture } from './event-capture.utils';
export { COMMON_FILTERS, DEFAULT_TIMEOUT } from '../constants/event-capture.constants';
