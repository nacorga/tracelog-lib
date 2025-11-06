import { EventData } from './event.types';
import { EventsQueue } from './queue.types';

/**
 * Generic callback function for event emitter subscriptions
 *
 * @template T - Type of data passed to the callback
 * @param data - Event data passed to the callback
 */
export type EmitterCallback<T = any> = (data: T) => void;

/**
 * Available event emitter channels for TraceLog
 *
 * **Purpose**: Type-safe event subscription system for external integrations
 *
 * **Event Channels**:
 * - `event`: Individual events as they are tracked (real-time)
 * - `queue`: Complete event batches before network transmission (every 10s or 50 events)
 *
 * **Use Cases**:
 * - Real-time event processing
 * - Custom analytics integrations
 * - Debugging and monitoring
 *
 * @example
 * ```typescript
 * // Subscribe to individual events
 * tracelog.on('event', (event) => {
 *   console.log('Event tracked:', event.type, event);
 * });
 *
 * // Subscribe to event batches
 * tracelog.on('queue', (batch) => {
 *   console.log('Sending batch:', batch.events.length, 'events');
 * });
 * ```
 */
export enum EmitterEvent {
  /** Individual events as they are tracked */
  EVENT = 'event',
  /** Complete event batches before transmission */
  QUEUE = 'queue',
}

/**
 * Type mapping for event emitter channels
 *
 * **Purpose**: Ensures type safety when subscribing to events
 *
 * Maps each EmitterEvent to its corresponding payload type:
 * - `event` → `EventData`: Single event data
 * - `queue` → `EventsQueue`: Batch of events with metadata
 */
export interface EmitterMap {
  [EmitterEvent.EVENT]: EventData;
  [EmitterEvent.QUEUE]: EventsQueue;
}
