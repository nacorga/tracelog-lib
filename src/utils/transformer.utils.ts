import { EventData, EventsQueue, BeforeSendTransformer, BeforeBatchTransformer } from '../types';
import { log } from './logging.utils';

/**
 * Applies beforeSend transformer to a single event with error handling
 *
 * @param event - Event to transform
 * @param transformer - Transformer function
 * @param context - Context string for logging (e.g., 'EventManager', 'custom')
 * @returns Transformed event or null if filtered
 */
export function transformEvent(
  event: EventData,
  transformer: BeforeSendTransformer,
  context: string,
): EventData | null {
  try {
    const result = transformer(event);

    if (result === null) {
      return null; // Event filtered
    }

    // Validate return type (simplified - no redundant checks)
    if (typeof result === 'object' && result !== null && 'type' in result) {
      return result;
    }

    log('warn', `beforeSend transformer returned invalid data, using original [${context}]`);
    return event;
  } catch (error) {
    log('error', `beforeSend transformer threw error, using original event [${context}]`, { error });
    return event;
  }
}

/**
 * Applies beforeSend transformer to an array of events (optimized functional approach)
 *
 * @param events - Array of events to transform
 * @param transformer - Transformer function
 * @param context - Context string for logging
 * @returns Array of transformed events (filtered events removed)
 */
export function transformEvents(events: EventData[], transformer: BeforeSendTransformer, context: string): EventData[] {
  return events
    .map((event) => transformEvent(event, transformer, context))
    .filter((event): event is EventData => event !== null);
}

/**
 * Applies beforeBatch transformer to entire batch with error handling
 *
 * @param batch - Batch to transform
 * @param transformer - Transformer function
 * @param context - Context string for logging
 * @returns Transformed batch or null if filtered
 */
export function transformBatch(
  batch: EventsQueue,
  transformer: BeforeBatchTransformer,
  context: string,
): EventsQueue | null {
  try {
    const result = transformer(batch);

    if (result === null) {
      log('debug', `Batch filtered by beforeBatch transformer [${context}]`, {
        data: { eventCount: batch.events.length },
      });
      return null; // Batch filtered
    }

    // Validate return type
    if (typeof result === 'object' && result !== null && Array.isArray(result.events)) {
      return result;
    }

    log('warn', `beforeBatch transformer returned invalid data, using original [${context}]`, {
      data: { eventCount: batch.events.length },
    });
    return batch;
  } catch (error) {
    log('error', `beforeBatch transformer threw error, using original batch [${context}]`, {
      error,
      data: { eventCount: batch.events.length },
    });
    return batch;
  }
}
