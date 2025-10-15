export const formatLogMsg = (msg: string, error?: unknown): string => {
  if (error) {
    if (process.env.NODE_ENV !== 'development' && error instanceof Error) {
      const sanitizedMessage = error.message.replace(/\s+at\s+.*$/gm, '').replace(/\(.*?:\d+:\d+\)/g, '');
      return `[TraceLog] ${msg}: ${sanitizedMessage}`;
    }

    if (error instanceof Error) {
      return `[TraceLog] ${msg}: ${error.message}`;
    }

    if (typeof error === 'string') {
      return `[TraceLog] ${msg}: ${error}`;
    }

    if (typeof error === 'object') {
      try {
        return `[TraceLog] ${msg}: ${JSON.stringify(error)}`;
      } catch {
        return `[TraceLog] ${msg}: [Unable to serialize error]`;
      }
    }

    return `[TraceLog] ${msg}: ${String(error)}`;
  }

  return `[TraceLog] ${msg}`;
};

/**
 * Safe logging utility that respects production environment
 *
 * @param type - Log level (info, warn, error, debug)
 * @param msg - Message to log
 * @param extra - Optional extra data
 * @param extra.error - Error object to include in the log message
 * @param extra.data - Additional data object to log (will be sanitized in production)
 * @param extra.showToClient - If true, info logs will be shown in production
 * @param extra.style - CSS styles to apply to the console message (browser only, uses %c formatting)
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
  extra?: { error?: unknown; data?: Record<string, unknown>; showToClient?: boolean; style?: string },
): void => {
  const { error, data, showToClient = false, style } = extra ?? {};
  const formattedMsg = error ? formatLogMsg(msg, error) : `[TraceLog] ${msg}`;
  const method = type === 'error' ? 'error' : type === 'warn' ? 'warn' : 'log';
  const isProduction = process.env.NODE_ENV !== 'development';

  if (isProduction) {
    if (type === 'debug') {
      return;
    }

    if (type === 'info' && !showToClient) {
      return;
    }
  }

  const hasStyle = style !== undefined && style !== '';
  const styledMsg = hasStyle ? `%c${formattedMsg}` : formattedMsg;

  if (data !== undefined) {
    const sanitizedData = isProduction ? sanitizeLogData(data) : data;

    if (hasStyle) {
      console[method](styledMsg, style, sanitizedData);
    } else {
      console[method](styledMsg, sanitizedData);
    }
  } else {
    if (hasStyle) {
      console[method](styledMsg, style);
    } else {
      console[method](styledMsg);
    }
  }
};

/**
 * Sanitizes log data in production to prevent sensitive information leakage
 * Recursively redacts sensitive keys and deep clones objects to preserve expandability
 */
const sanitizeLogData = (data: Record<string, unknown>): Record<string, unknown> => {
  const sanitized: Record<string, unknown> = {};
  const sensitiveKeys = ['token', 'password', 'secret', 'key', 'apikey', 'api_key', 'sessionid', 'session_id'];

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();

    if (sensitiveKeys.some((sensitiveKey) => lowerKey.includes(sensitiveKey))) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeLogData(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        item !== null && typeof item === 'object' && !Array.isArray(item)
          ? sanitizeLogData(item as Record<string, unknown>)
          : item,
      );
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};
