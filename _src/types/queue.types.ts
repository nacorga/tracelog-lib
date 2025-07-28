import { MetadataType, EventData } from './event.types';

export interface Queue {
  user_id: string;
  session_id: string;
  device: string;
  events: EventData[];
  global_metadata?: Record<string, MetadataType>;
}
