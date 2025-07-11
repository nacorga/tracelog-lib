import { MetadataType, TracelogEvent } from './event.types';

export interface TracelogQueue {
  user_id: string;
  session_id: string;
  device: string;
  events: TracelogEvent[];
  global_metadata?: Record<string, MetadataType>;
}
