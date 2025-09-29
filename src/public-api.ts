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
export { EventType, DeviceType, Mode, TagConditionType, TagConditionOperator, TagLogicalOperator } from './app.types';
export type {
  EventData,
  MetadataType,
  ScrollData,
  ClickData,
  CustomEventData,
  WebVitalsData,
  ErrorData,
  PageViewData,
  UTM,
  ApiConfig,
  BaseEventsQueueDto,
  ExtendedEventsQueueDto,
  TagConfig,
  TagCondition,
} from './app.types';

// Additional types for configuration
export type { AppConfig } from './types/config.types';

// Constants
export { DEFAULT_SESSION_TIMEOUT } from './constants';
