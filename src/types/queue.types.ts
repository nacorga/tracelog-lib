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
