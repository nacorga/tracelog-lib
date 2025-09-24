/**
 * Log levels for the dual logging system
 */
export type LogLevel =
  // Client-facing logs (visible in QA mode)
  | 'CLIENT_ERROR'
  | 'CLIENT_WARN'
  | 'INFO'
  // Internal library logs (debug mode only)
  | 'ERROR'
  | 'WARN'
  | 'DEBUG'
  | 'VERBOSE';
