export type SessionEndReason = 'inactivity' | 'page_unload' | 'manual_stop' | 'orphaned_cleanup' | 'tab_closed';

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

// Cross-tab session management types
export interface CrossTabSessionConfig {
  tabHeartbeatIntervalMs: number;
  tabElectionTimeoutMs: number;
  debugMode: boolean;
}

export interface TabInfo {
  id: string;
  lastHeartbeat: number;
  isLeader: boolean;
  sessionId: string;
  startTime: number;
}

export interface CrossTabMessage {
  type: 'heartbeat' | 'session_start' | 'session_end' | 'tab_closing' | 'election_request' | 'election_response';
  tabId: string;
  sessionId?: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

// Session recovery types
export interface SessionRecoveryConfig {
  recoveryWindowMs: number;
  maxRecoveryAttempts: number;
  contextPreservation: boolean;
}

export interface SessionContext {
  sessionId: string;
  startTime: number;
  lastActivity: number;
  tabCount: number;
  recoveryAttempts: number;
  metadata?: Record<string, unknown>;
}

export interface RecoveryAttempt {
  sessionId: string;
  timestamp: number;
  attempt: number;
  context: SessionContext;
}

// Session health monitoring types
export interface SessionHealth {
  recoveryAttempts: number;
  sessionTimeouts: number;
  crossTabConflicts: number;
  lastHealthCheck: number;
}
