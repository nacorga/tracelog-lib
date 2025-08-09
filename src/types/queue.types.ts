import { MetadataType } from './common.types';
import { DeviceType } from './device.types';
import { EventData } from './event.types';

export interface Queue {
  user_id: string;
  session_id: string;
  device: DeviceType;
  events: EventData[];
  global_metadata?: Record<string, MetadataType>;
}

export interface PersistedQueueData {
  userId: string;
  sessionId: string;
  device: Queue['device'];
  events: Queue['events'];
  timestamp: number;
  global_metadata?: Queue['global_metadata'];
}
