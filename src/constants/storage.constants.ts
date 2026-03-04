/**
 * Storage key management constants for TraceLog
 * All keys are namespaced with 'tlog' prefix to avoid conflicts
 */

/**
 * Base key prefix for all TraceLog localStorage items
 * Used as namespace to prevent conflicts with other libraries
 */
export const STORAGE_BASE_KEY = 'tlog';

/**
 * Storage key for QA mode flag in sessionStorage
 * Format: 'tlog:qa_mode'
 */
export const QA_MODE_KEY = `${STORAGE_BASE_KEY}:qa_mode`;

/**
 * Storage key for user ID in localStorage
 * Format: 'tlog:uid'
 */
export const USER_ID_KEY = `${STORAGE_BASE_KEY}:uid`;

/**
 * URL parameter name for activating/deactivating QA mode
 * Example: ?tlog_mode=qa or ?tlog_mode=qa_off
 */
export const QA_MODE_URL_PARAM = 'tlog_mode';

/**
 * URL parameter value to enable QA mode
 */
export const QA_MODE_ENABLE_VALUE = 'qa';

/**
 * URL parameter value to disable QA mode
 */
export const QA_MODE_DISABLE_VALUE = 'qa_off';

/**
 * Generates storage key for event queue
 *
 * @param id - User ID or project identifier
 * @returns localStorage key for event queue (e.g., 'tlog:user123:queue')
 */
export const QUEUE_KEY = (id: string): string => (id ? `${STORAGE_BASE_KEY}:${id}:queue` : `${STORAGE_BASE_KEY}:queue`);

/**
 * Generates storage key for session data
 *
 * @param id - Project identifier
 * @returns localStorage key for session (e.g., 'tlog:project123:session')
 */
export const SESSION_STORAGE_KEY = (id: string): string =>
  id ? `${STORAGE_BASE_KEY}:${id}:session` : `${STORAGE_BASE_KEY}:session`;

/**
 * Generates storage key for cross-tab session synchronization
 *
 * @param id - Project identifier
 * @returns localStorage key for cross-tab session (e.g., 'tlog:project123:cross_tab_session')
 */
export const CROSS_TAB_SESSION_KEY = (id: string): string =>
  id ? `${STORAGE_BASE_KEY}:${id}:cross_tab_session` : `${STORAGE_BASE_KEY}:cross_tab_session`;

/**
 * Generates storage key for tab information registry
 *
 * @param id - Project identifier
 * @returns localStorage key for tab info (e.g., 'tlog:project123:tab_info')
 */
export const TAB_INFO_KEY = (id: string): string =>
  id ? `${STORAGE_BASE_KEY}:${id}:tab_info` : `${STORAGE_BASE_KEY}:tab_info`;

/**
 * Generates storage key for specific tab information
 *
 * @param projectId - Project identifier
 * @param tabId - Unique tab identifier
 * @returns localStorage key for tab-specific info (e.g., 'tlog:project123:tab:abc456:info')
 */
export const TAB_SPECIFIC_INFO_KEY = (projectId: string, tabId: string): string =>
  `${STORAGE_BASE_KEY}:${projectId}:tab:${tabId}:info`;

/**
 * Generates storage key for session recovery data
 *
 * @param id - Project identifier
 * @returns localStorage key for session recovery (e.g., 'tlog:project123:recovery')
 */
export const SESSION_RECOVERY_KEY = (id: string): string =>
  id ? `${STORAGE_BASE_KEY}:${id}:recovery` : `${STORAGE_BASE_KEY}:recovery`;

/**
 * Generates BroadcastChannel name for cross-tab communication
 *
 * @param id - Project identifier
 * @returns BroadcastChannel name (e.g., 'tlog:project123:broadcast')
 */
export const BROADCAST_CHANNEL_NAME = (id: string): string =>
  id ? `${STORAGE_BASE_KEY}:${id}:broadcast` : `${STORAGE_BASE_KEY}:broadcast`;

/**
 * Generates storage key for per-session event counts
 *
 * Used to persist rate limiting counters across page reloads within the same session.
 * This prevents users from bypassing per-session event limits by refreshing the page.
 *
 * @param userId - User identifier
 * @param sessionId - Session identifier
 * @returns localStorage key for session counts (e.g., 'tlog:user123:session_counts:session456')
 */
export const SESSION_COUNTS_KEY = (userId: string, sessionId: string): string =>
  `${STORAGE_BASE_KEY}:${userId}:session_counts:${sessionId}`;

/**
 * Session counts expiry duration (7 days in milliseconds).
 *
 * Session counts are automatically cleaned up after this duration to prevent
 * localStorage pollution. Counts older than 7 days are considered stale and
 * are removed on next page load.
 *
 * **Rationale**: 7 days provides sufficient buffer for:
 * - Long-running sessions (rare but possible)
 * - Users returning after extended inactivity
 * - While preventing indefinite accumulation (~100 bytes per session)
 */
export const SESSION_COUNTS_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Storage key for tracking last session counts cleanup timestamp.
 *
 * Used to throttle cleanup operations and prevent performance impact
 * from scanning localStorage on every EventManager initialization.
 *
 * Format: 'tlog:session_counts_last_cleanup'
 */
export const SESSION_COUNTS_LAST_CLEANUP_KEY = `${STORAGE_BASE_KEY}:session_counts_last_cleanup`;

/**
 * Minimum interval between session counts cleanup runs (1 hour in milliseconds).
 *
 * Cleanup will only run if at least this much time has elapsed since the
 * last cleanup. This prevents performance degradation from frequent localStorage
 * scans while still ensuring regular cleanup of stale data.
 *
 * **Rationale**: 1 hour provides a good balance between:
 * - Preventing frequent scans on rapid page reloads
 * - Ensuring cleanup runs at least once per typical browsing session
 * - Minimal localStorage overhead (~100 entries typical, <1ms scan time)
 */
export const SESSION_COUNTS_CLEANUP_THROTTLE_MS = 60 * 60 * 1000; // 1 hour
