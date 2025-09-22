import { LogLevel } from '../../src/types/log.types';

export interface EventLogDispatch {
  timestamp: string;
  level: LogLevel;
  namespace: string;
  message: string;
  data?: unknown;
}

export interface EventLogDispatchFilter {
  namespace?: string;
  messageContains?: string;
}
