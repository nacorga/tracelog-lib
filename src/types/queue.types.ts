import { MetadataType } from './common.types';
import { DeviceInfo } from './device.types';
import { EventData } from './event.types';

/**
 * Visitor identity data from identify() call.
 *
 * Sent piggyback in every batch so the backend always has the latest identity,
 * even if earlier batches were lost.
 */
export interface IdentifyData {
  /** External user identifier assigned by the site owner */
  userId: string;
  /** Optional user attributes (name, email, plan, etc.) */
  traits?: Record<string, string>;
}

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
  /** Visitor identity from identify() call — included in every batch */
  identity?: IdentifyData;
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
