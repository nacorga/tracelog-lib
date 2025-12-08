import { QA_MODE_KEY } from '../constants/storage.constants';
import { LOG_STYLE_CRITICAL } from '../constants/app.constants';

/**
 * Log visibility level determining when logs are shown
 *
 * - 'critical': Always visible (production included) - for Sentry/monitoring
 * - 'qa': Only visible when QA mode is active (equivalent to showToClient: true)
 * - undefined: Only visible in NODE_ENV=development
 */
export type LogVisibility = 'critical' | 'qa';

/**
 * Formats log messages with optional error information and environment-specific sanitization
 *
 * **Purpose**: Creates consistent log message format across the library with automatic
 * error handling and production-safe output.
 *
 * **Behavior**:
 * - **Production**: Sanitizes stack traces and file paths from error messages
 * - **Development**: Preserves full error messages for debugging
 * - **Fallback**: Handles non-Error objects gracefully
 *
 * **Format**: `[TraceLog] {message}: {error}` or `[TraceLog] {message}` if no error
 *
 * **Stack Trace Sanitization** (production only):
 * - Removes "at function (...)" stack lines
 * - Removes file paths with line/column numbers
 * - Prevents leaking internal file structure
 *
 * @param msg - Base log message
 * @param error - Optional error object (Error, string, object, or unknown type)
 * @returns Formatted log message string
 *
 * @example
 * ```typescript
 * // Basic message
 * formatLogMsg('Session started');
 * // → "[TraceLog] Session started"
 *
 * // With Error object (development)
 * formatLogMsg('Failed to init', new Error('Network timeout'));
 * // → "[TraceLog] Failed to init: Network timeout"
 *
 * // With Error object (production - sanitized)
 * formatLogMsg('Failed to init', new Error('Network timeout at handleRequest (app.ts:42:10)'));
 * // → "[TraceLog] Failed to init: Network timeout"
 *
 * // With string error
 * formatLogMsg('Config invalid', 'Missing API key');
 * // → "[TraceLog] Config invalid: Missing API key"
 * ```
 */
export const formatLogMsg = (msg: string, error?: unknown): string => {
  if (error) {
    if (process.env.NODE_ENV !== 'development' && error instanceof Error) {
      const sanitizedMessage = error.message.replace(/\s+at\s+.*$/gm, '').replace(/\s*\([^()]+:\d+:\d+\)/g, '');
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
 * Check if QA mode is active by reading sessionStorage directly
 *
 * NOTE: Intentional duplication of mode.utils.ts:isQaModeActive() to avoid
 * circular dependency (mode.utils.ts imports log() from this file).
 * Changes to QA mode detection logic must be synchronized in both files.
 *
 * @see src/utils/browser/mode.utils.ts - Canonical public implementation
 */
const isQaModeActive = (): boolean => {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
    return false;
  }
  try {
    return sessionStorage.getItem(QA_MODE_KEY) === 'true';
  } catch {
    return false;
  }
};

/**
 * Safe logging utility that enforces zero logs in production
 *
 * @param type - Log level (info, warn, error, debug)
 * @param msg - Message to log
 * @param extra - Optional extra data
 * @param extra.error - Error object to include in the log message
 * @param extra.data - Additional data object to log (will be sanitized in production)
 * @param extra.showToClient - If true, log will be shown in production (QA mode only) - DEPRECATED: use visibility: 'qa'
 * @param extra.style - CSS styles to apply to the console message (browser only, uses %c formatting)
 * @param extra.visibility - Controls when log is visible:
 *   - 'critical': Always visible (production included) - for monitoring/Sentry
 *   - 'qa': Only visible when QA mode is active
 *   - undefined: Only visible in NODE_ENV=development
 *
 * Visibility hierarchy (production):
 * - CRITICAL: Always shown - errors that must reach monitoring platforms
 * - QA: Shown with ?tlog_mode=qa - custom event verification
 * - Default: Never shown in production
 *
 * Development behavior (NODE_ENV=development):
 * - All logs visible regardless of visibility level
 * - Full error messages and stack traces preserved
 */
export const log = (
  type: 'info' | 'warn' | 'error' | 'debug',
  msg: string,
  extra?: {
    error?: unknown;
    data?: Record<string, unknown>;
    showToClient?: boolean;
    style?: string;
    visibility?: LogVisibility;
  },
): void => {
  const { error, data, showToClient = false, style, visibility } = extra ?? {};
  const formattedMsg = error ? formatLogMsg(msg, error) : `[TraceLog] ${msg}`;
  const method = type === 'error' ? 'error' : type === 'warn' ? 'warn' : 'log';
  const isProduction = process.env.NODE_ENV !== 'development';

  // Development: All logs visible
  if (!isProduction) {
    outputLog(method, formattedMsg, style, data);
    return;
  }

  // Production: Check visibility level
  const shouldShow = shouldShowLog(visibility, showToClient);

  if (!shouldShow) {
    return;
  }

  // Apply appropriate style for visibility level
  const effectiveStyle = getEffectiveStyle(visibility, style);
  const sanitizedData = data !== undefined ? sanitizeLogData(data) : undefined;

  outputLog(method, formattedMsg, effectiveStyle, sanitizedData);
};

/**
 * Determines if a log should be shown based on visibility level
 */
const shouldShowLog = (visibility: LogVisibility | undefined, showToClient: boolean): boolean => {
  // Critical logs are always shown
  if (visibility === 'critical') {
    return true;
  }

  // QA mode logs (including legacy showToClient)
  if (visibility === 'qa' || showToClient) {
    return isQaModeActive();
  }

  // Default: not shown in production
  return false;
};

/**
 * Gets the appropriate style for the visibility level
 */
const getEffectiveStyle = (visibility: LogVisibility | undefined, providedStyle: string | undefined): string => {
  if (providedStyle !== undefined && providedStyle !== '') {
    return providedStyle;
  }

  if (visibility === 'critical') {
    return LOG_STYLE_CRITICAL;
  }

  return '';
};

/**
 * Outputs the log message to console
 */
const outputLog = (
  method: 'log' | 'warn' | 'error',
  formattedMsg: string,
  style: string | undefined,
  data: Record<string, unknown> | undefined,
): void => {
  const hasStyle = style !== undefined && style !== '';
  const styledMsg = hasStyle ? `%c${formattedMsg}` : formattedMsg;

  if (data !== undefined) {
    if (hasStyle) {
      console[method](styledMsg, style, data);
    } else {
      console[method](styledMsg, data);
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
 *
 * **Purpose**: Recursively redacts sensitive keys while preserving object expandability
 * in browser console for debugging.
 *
 * **Sensitive Keys Detected** (case-insensitive substring matching):
 * - `token`, `password`, `secret`, `key`, `apikey`, `api_key`, `sessionid`, `session_id`
 *
 * **Behavior**:
 * - **Redaction**: Replaces values with `'[REDACTED]'` string
 * - **Deep Cloning**: Creates new objects to avoid mutating originals
 * - **Recursive**: Handles nested objects and arrays
 * - **Preserves Structure**: Maintains object hierarchy for console inspection
 *
 * **Use Cases**:
 * - Production logging where sensitive data might be present
 * - Debugging with potentially sensitive configuration objects
 * - Error logging with user or session data
 *
 * @param data - Object to sanitize
 * @returns New object with sensitive keys redacted
 *
 * @example
 * ```typescript
 * const data = {
 *   userId: '123',
 *   apiKey: 'secret-key-123',
 *   config: {
 *     endpoint: 'https://api.com',
 *     token: 'bearer-xyz'
 *   }
 * };
 *
 * const sanitized = sanitizeLogData(data);
 * // {
 * //   userId: '123',
 * //   apiKey: '[REDACTED]',
 * //   config: {
 * //     endpoint: 'https://api.com',
 * //     token: '[REDACTED]'
 * //   }
 * // }
 * ```
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
