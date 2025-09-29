import { init, event, on, off, isInitialized, destroy } from './api';

// TraceLog namespace containing all API methods
export const tracelog = {
  init,
  event,
  on,
  off,
  isInitialized,
  destroy,
};

// Types
export type {
  EventType,
  EventData,
  DeviceType,
  MetadataType,
  ScrollData,
  ClickData,
  CustomEventData,
  WebVitalsData,
  ErrorData,
  PageViewData,
  UTM,
  ApiConfig,
  Mode,
  BaseEventsQueueDto,
  ExtendedEventsQueueDto,
  TagConfig,
  TagCondition,
  TagConditionType,
  TagConditionOperator,
  TagLogicalOperator,
} from './app.types';

// Additional types for configuration
export type { AppConfig } from './types/config.types';

// Constants
export { DEFAULT_SESSION_TIMEOUT } from './constants';
