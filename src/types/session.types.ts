export type SessionEndReason = 'inactivity' | 'page_unload' | 'manual_stop' | 'orphaned_cleanup';

export interface SessionEndConfig {
  enablePageUnloadHandlers: boolean;
  syncTimeoutMs: number;
  maxRetries: number;
  debugMode: boolean;
}

export interface SessionEndResult {
  success: boolean;
  reason: SessionEndReason;
  timestamp: number;
  eventsFlushed: number;
  method: 'async' | 'sync';
}

export interface SessionEndStats {
  totalSessionEnds: number;
  successfulEnds: number;
  failedEnds: number;
  duplicatePrevented: number;
  reasonCounts: Record<SessionEndReason, number>;
}
