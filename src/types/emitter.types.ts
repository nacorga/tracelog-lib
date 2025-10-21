import { EventData } from './event.types';
import { EventsQueue } from './queue.types';
import { ConsentState } from './consent.types';

export type EmitterCallback<T = any> = (data: T) => void;

export enum EmitterEvent {
  EVENT = 'event',
  QUEUE = 'queue',
  CONSENT_CHANGED = 'consent-changed',
}

export interface EmitterMap {
  [EmitterEvent.EVENT]: EventData;
  [EmitterEvent.QUEUE]: EventsQueue;
  [EmitterEvent.CONSENT_CHANGED]: ConsentState;
}
