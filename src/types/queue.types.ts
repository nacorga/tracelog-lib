import { MetadataType } from './common.types';
import { DeviceInfo } from './device.types';
import { EventData } from './event.types';

/**
 * Event queue structure sent to backend.
 *
 * **Purpose**: Batches multiple events for efficient transmission to analytics backend.
 */
export interface EventsQueue {
  /** Unique user identifier (UUID) */
  user_id: string;
  /** Current session identifier (UUID) */
  session_id: string;
  /** Device information (type, OS, browser) */
  device: DeviceInfo;
  /** Array of events to send */
  events: EventData[];
  /** Optional metadata attached to all events in this batch */
  global_metadata?: Record<string, MetadataType>;
}

/**
 * Extended queue structure for localStorage persistence with expiration tracking.
 *
 * `recoveryFailures` tracks how many consecutive page-load recovery attempts have
 * failed for this persisted batch. When it reaches MAX_RECOVERY_FAILURES the batch
 * is discarded, breaking the cross-session retry loop caused by permanently
 * unreachable URLs (e.g. DNS resolution failures).
 */
export interface PersistedEventsQueue extends EventsQueue {
  timestamp: number;
  recoveryFailures?: number;
}
