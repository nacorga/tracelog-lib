export const MIN_SESSION_TIMEOUT_MS = 30000; // 30 seconds
export const MAX_SESSION_TIMEOUT_MS = 86400000; // 24 hours
export const DEFAULT_SESSION_TIMEOUT_MS = 900000; // 15 minutes

export const SESSION_START_WAIT_MS = 2500; // Wait for session to start
export const CROSS_TAB_COORDINATION_WAIT_MS = 3000; // Wait for cross-tab coordination
export const UNLOAD_DETECTION_TIMEOUT_MS = 2000; // Page unload detection
export const SESSION_RECOVERY_WAIT_MS = 5000; // Session recovery wait

export const SESSION_VALIDATION_REQUIREMENTS = {
  hasSessionId: true,
  hasStartTime: true,
  hasTimingField: true,
  minSessionIdLength: 36, // UUID length
};
