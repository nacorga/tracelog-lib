export type SessionEndTrigger = 'timeout' | 'manual' | 'page_unload' | 'unexpected_recovery';

export interface SessionData {
  sessionId: string;
  startTime: number;
  lastActivity: number;
  endTrigger?: string;
}

export interface InactivityConfig {
  timeout: number;
  events?: string[];
}

export interface InactivityData {
  isInactive: boolean;
  lastActivityTime: number;
  inactiveDuration?: number;
}
