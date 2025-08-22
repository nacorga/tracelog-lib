import { MetadataType } from './common.types';
import { DeviceType } from './device.types';
import { EventData } from './event.types';

export interface BaseEventsQueueDto {
  user_id: string;
  session_id: string;
  device: DeviceType;
  events: EventData[];
  global_metadata?: Record<string, MetadataType>;
}

export interface ExtendedEventsQueueDto extends BaseEventsQueueDto {
  project: string;
  source: string;
  ip: string;
}

export interface PersistedQueueData {
  userId: string;
  sessionId: string;
  device: BaseEventsQueueDto['device'];
  events: BaseEventsQueueDto['events'];
  timestamp: number;
  global_metadata?: BaseEventsQueueDto['global_metadata'];
}
