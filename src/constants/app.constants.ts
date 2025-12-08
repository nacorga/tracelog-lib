/**
 * Console log style for active TraceLog operations
 * Used for visual highlighting in browser console during QA mode
 */
export const LOG_STYLE_ACTIVE =
  'background: #ff9800; color: white; font-weight: bold; padding: 2px 8px; border-radius: 3px;';

/**
 * Console log style for disabled TraceLog operations
 * Used for visual indication when features are disabled
 */
export const LOG_STYLE_DISABLED =
  'background: #9e9e9e; color: white; font-weight: bold; padding: 2px 8px; border-radius: 3px;';

/**
 * Console log style for critical errors (always visible)
 * Used for errors that must reach monitoring platforms like Sentry
 */
export const LOG_STYLE_CRITICAL =
  'background: #d32f2f; color: white; font-weight: bold; padding: 2px 8px; border-radius: 3px;';
