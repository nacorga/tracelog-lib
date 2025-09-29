// API functions
export { init, event, on, off, isInitialized, destroy } from './api';

//  Types
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

// Constants
export { DEFAULT_SESSION_TIMEOUT } from './constants';
