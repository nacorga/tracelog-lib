import { MetadataType } from './common.types';
import { DeviceType } from './device.types';
import { EventData } from './event.types';

/**
 * Event queue structure sent to backend.
 *
 * **Purpose**: Batches multiple events for efficient transmission to analytics backend.
 *
 * **Idempotency Token**:
 * - Format: `{timestamp}-{random8hex}` (e.g., "1731783421234-a3f8e2c1")
 * - Generated once per batch in SenderManager.prepareRequest()
 * - Persists across all retry attempts of the same batch (same payload string)
 * - Placed in `_metadata.idempotency_token` field (not in EventsQueue root)
 * - Allows backend to distinguish retries (same token) from duplicates (different token)
 *
 * @see SenderManager.prepareRequest() - Token generation and _metadata wrapping (sender.manager.ts:771)
 */
export interface EventsQueue {
  /** Unique user identifier (UUID) */
  user_id: string;
  /** Current session identifier (UUID) */
  session_id: string;
  /** Device information (type, OS, browser) */
  device: DeviceType;
  /** Array of events to send */
  events: EventData[];
  /** Optional metadata attached to all events in this batch */
  global_metadata?: Record<string, MetadataType>;
}

/**
 * Extended queue structure for localStorage persistence with expiration tracking.
 */
export interface PersistedEventsQueue extends EventsQueue {
  timestamp: number;
}
