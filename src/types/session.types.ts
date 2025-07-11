export type SessionEndTrigger = 'timeout' | 'manual' | 'page_unload' | 'unexpected_recovery';

export interface SessionData {
  sessionId: string;
  startTime: number;
  lastActivity: number;
  endTrigger?: string;
}
