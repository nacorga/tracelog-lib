import { EventData } from './event.types';
import { BaseEventsQueueDto } from './queue.types';

export type EmitterCallback<T = any> = (data: T) => void;

export enum EmitterEvent {
  EVENT = 'event',
  QUEUE = 'queue',
}

export interface EmitterMap {
  [EmitterEvent.EVENT]: EventData;
  [EmitterEvent.QUEUE]: BaseEventsQueueDto;
}
