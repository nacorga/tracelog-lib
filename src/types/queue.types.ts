import { MetadataType } from './common.types';
import { DeviceType } from './device.types';
import { EventData } from './event.types';

export interface EventsQueue {
  user_id: string;
  session_id: string;
  device: DeviceType;
  events: EventData[];
  global_metadata?: Record<string, MetadataType>;
}

/**
 * Extended queue structure for localStorage persistence with expiration tracking.
 */
export interface PersistedEventsQueue extends EventsQueue {
  timestamp: number;
}
