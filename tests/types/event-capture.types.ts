import { LogLevel } from '../../src/types/log.types';

/**
 * Event log dispatch structure for TraceLog testing
 */
export interface EventLogDispatch {
  /** ISO timestamp of when the event was dispatched */
  timestamp: string;
  /** Log level of the event */
  level: LogLevel;
  /** Namespace/component that generated the event */
  namespace: string;
  /** Event message content */
  message: string;
  /** Optional additional data associated with the event */
  data?: unknown;
}

/**
 * Enhanced filter criteria for event capture
 */
export interface EventLogDispatchFilter {
  /** Filter by specific namespace */
  namespace?: string;
  /** Filter by message content (substring match) */
  messageContains?: string;
  /** Filter by log level */
  level?: LogLevel;
  /** Filter events since this timestamp */
  since?: Date;
  /** Filter events until this timestamp */
  until?: Date;
}

/**
 * Configuration options for EventCapture instances
 */
export interface EventCaptureOptions {
  /** Maximum number of events to store in memory */
  maxEvents?: number;
}

/**
 * Options for waiting for specific events
 */
export interface EventWaitOptions {
  /** Maximum time to wait for the event in milliseconds */
  timeout?: number;
  /** Polling interval in milliseconds */
  interval?: number;
  /** Description for error messages */
  description?: string;
  /** Whether to return the latest matching event (true) or first (false) */
  returnLatest?: boolean;
}

/**
 * Statistics about captured events
 */
export interface EventCaptureStats {
  /** Total number of captured events */
  total: number;
  /** Events grouped by namespace */
  byNamespace: Record<string, number>;
  /** Events grouped by log level */
  byLevel: Record<string, number>;
  /** Maximum number of events that can be stored */
  maxEvents: number;
  /** Whether event capture is currently active */
  isActive: boolean;
  /** Whether the capture instance has been disposed */
  isDisposed: boolean;
}

/**
 * Event filter builder interface for creating common filters
 */
export interface EventFilterBuilder {
  /** Creates a filter for events from a specific namespace */
  byNamespace: (namespace: string) => EventLogDispatchFilter;
  /** Creates a filter for events containing specific message text */
  byMessage: (messageContains: string) => EventLogDispatchFilter;
  /** Creates a filter for events of a specific level */
  byLevel: (level: LogLevel) => EventLogDispatchFilter;
  /** Creates a filter combining namespace and message criteria */
  byNamespaceAndMessage: (namespace: string, messageContains: string) => EventLogDispatchFilter;
  /** Creates a filter for events within a time range */
  byTimeRange: (since: Date, until?: Date) => EventLogDispatchFilter;
}

/**
 * Event capture state enumeration
 */
export enum EventCaptureState {
  /** Not started or stopped */
  INACTIVE = 'inactive',
  /** Currently capturing events */
  ACTIVE = 'active',
  /** Disposed and cannot be reused */
  DISPOSED = 'disposed',
}

/**
 * Event validation result
 */
export interface EventValidationResult {
  /** Whether the event is valid */
  isValid: boolean;
  /** Validation error message if invalid */
  error?: string;
  /** Missing required fields */
  missingFields?: string[];
}

/**
 * Common event filter presets for frequently used scenarios
 */
export interface CommonEventFilters {
  /** Filter for application initialization events */
  INITIALIZATION: EventLogDispatchFilter;
  /** Filter for session start events */
  SESSION_START: EventLogDispatchFilter;
  /** Filter for session end events */
  SESSION_END: EventLogDispatchFilter;
  /** Filter for session manager events */
  SESSION_MANAGER: EventLogDispatchFilter;
  /** Filter for session handler events */
  SESSION_HANDLER: EventLogDispatchFilter;
  /** Filter for custom event tracking */
  CUSTOM_EVENT: EventLogDispatchFilter;
  /** Filter for page view events */
  PAGE_VIEW: EventLogDispatchFilter;
  /** Filter for click events */
  CLICK: EventLogDispatchFilter;
  /** Filter for scroll events */
  SCROLL: EventLogDispatchFilter;
  /** Filter for performance events */
  PERFORMANCE: EventLogDispatchFilter;
  /** Filter for error events */
  ERROR: EventLogDispatchFilter;
  /** Filter for network events */
  NETWORK: EventLogDispatchFilter;
  /** Filter for event manager events */
  EVENT_MANAGER: EventLogDispatchFilter;
  /** Filter for state manager events */
  STATE_MANAGER: EventLogDispatchFilter;
}

/**
 * Event capture error types
 */
export type EventCaptureErrorType =
  | 'CAPTURE_NOT_ACTIVE'
  | 'CAPTURE_ALREADY_ACTIVE'
  | 'INSTANCE_DISPOSED'
  | 'INVALID_PAGE'
  | 'EVENT_TIMEOUT'
  | 'INVALID_EVENT'
  | 'CLEANUP_FAILED';

/**
 * Event capture error with detailed context
 */
export class EventCaptureError extends Error {
  constructor(
    message: string,
    public readonly type: EventCaptureErrorType,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'EventCaptureError';
  }

  /**
   * Creates an EventCaptureError with formatted context
   */
  static create(type: EventCaptureErrorType, message: string, context?: Record<string, unknown>): EventCaptureError {
    const formattedMessage = `[${type}] ${message}`;
    return new EventCaptureError(formattedMessage, type, context);
  }
}
