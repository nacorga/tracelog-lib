import { EventData } from './event.types';
import { EventsQueue } from './queue.types';

/**
 * Transform individual events before sending to backend.
 * Applied per-event, can filter by returning null.
 *
 * @param event - The event to transform
 * @returns Transformed event or null to filter
 */
export type BeforeSendTransformer = (event: EventData) => EventData | null;

/**
 * Transform entire batch before sending to backend.
 * Applied per-batch (10s interval or 50 events), can filter by returning null.
 *
 * @param batch - The batch to transform
 * @returns Transformed batch or null to filter
 */
export type BeforeBatchTransformer = (batch: EventsQueue) => EventsQueue | null;

/**
 * Runtime transformer hooks that can be updated after initialization
 * - 'beforeSend': Transform per-event before sending to backend
 * - 'beforeBatch': Transform entire batch before sending to backend
 */
export type TransformerHook = 'beforeSend' | 'beforeBatch';

/**
 * Strongly-typed transformer map for internal storage
 */
export interface TransformerMap {
  beforeSend?: BeforeSendTransformer;
  beforeBatch?: BeforeBatchTransformer;
}

/**
 * Callback function for providing dynamic HTTP headers.
 *
 * Called synchronously before each fetch request to custom backends.
 * Return empty object {} to send no custom headers.
 *
 * **Note**: Only applies to `custom` integration (not TraceLog SaaS).
 * Headers are NOT applied to sendBeacon requests (page unload).
 *
 * @returns Record of header names to values
 *
 * @example
 * ```typescript
 * tracelog.setCustomHeaders(() => ({
 *   'Authorization': `Bearer ${getAuthToken()}`,
 *   'X-Request-ID': crypto.randomUUID()
 * }));
 * ```
 */
export type CustomHeadersProvider = () => Record<string, string>;
