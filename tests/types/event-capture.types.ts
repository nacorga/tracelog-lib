import { LogLevel } from '../../src/types/log.types';

// TraceLog event structure from tracelog:qa dispatched events
export interface TraceLogEvent {
  timestamp: string;
  level: LogLevel;
  namespace: string;
  message: string;
  data?: unknown;
}

// Simple filter for event matching
export interface EventFilter {
  namespace?: string;
  messageContains?: string;
}
