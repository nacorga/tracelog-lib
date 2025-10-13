export const formatLogMsg = (msg: string, error?: unknown): string => {
  if (error) {
    // In production, sanitize error messages to avoid exposing sensitive paths
    if (process.env.NODE_ENV !== 'development' && error instanceof Error) {
      // Remove file paths and line numbers from error messages
      const sanitizedMessage = error.message.replace(/\s+at\s+.*$/gm, '').replace(/\(.*?:\d+:\d+\)/g, '');
      return `[TraceLog] ${msg}: ${sanitizedMessage}`;
    }
    return `[TraceLog] ${msg}: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }

  return `[TraceLog] ${msg}`;
};

/**
 * Safe logging utility that respects production environment
 *
 * @param type - Log level (info, warn, error, debug)
 * @param msg - Message to log
 * @param extra - Optional extra data
 *
 * Production behavior:
 * - debug: Never logged in production
 * - info: Only logged if showToClient=true
 * - warn: Always logged (important for debugging production issues)
 * - error: Always logged
 * - Stack traces are sanitized
 * - Data objects are sanitized
 */
export const log = (
  type: 'info' | 'warn' | 'error' | 'debug',
  msg: string,
  extra?: { error?: unknown; data?: Record<string, unknown>; showToClient?: boolean },
): void => {
  const { error, data, showToClient = false } = extra ?? {};
  const formattedMsg = error ? formatLogMsg(msg, error) : `[TraceLog] ${msg}`;
  const method = type === 'error' ? 'error' : type === 'warn' ? 'warn' : 'log';

  // Production logging strategy:
  // - Development: Log everything
  // - Production:
  //   - debug: never logged
  //   - info: only if showToClient=true
  //   - warn: always logged (critical for debugging)
  //   - error: always logged
  const isProduction = process.env.NODE_ENV !== 'development';

  if (isProduction) {
    // Never log debug in production
    if (type === 'debug') {
      return;
    }

    // Log info only if explicitly flagged
    if (type === 'info' && !showToClient) {
      return;
    }

    // warn and error always logged in production
  }

  // In production, sanitize data to avoid exposing sensitive information
  if (isProduction && data !== undefined) {
    const sanitizedData = sanitizeLogData(data);
    console[method](formattedMsg, sanitizedData);
  } else if (data !== undefined) {
    console[method](formattedMsg, data);
  } else {
    console[method](formattedMsg);
  }
};

/**
 * Sanitizes log data in production to prevent sensitive information leakage
 * Simple approach: redact sensitive keys only
 */
const sanitizeLogData = (data: Record<string, unknown>): Record<string, unknown> => {
  const sanitized: Record<string, unknown> = {};
  const sensitiveKeys = ['token', 'password', 'secret', 'key', 'apikey', 'api_key', 'sessionid', 'session_id'];

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();

    // Redact sensitive keys
    if (sensitiveKeys.some((sensitiveKey) => lowerKey.includes(sensitiveKey))) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};
