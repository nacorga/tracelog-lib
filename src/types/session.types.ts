/**
 * Reasons why a user session ended
 *
 * **Purpose**: Provides context for session termination in analytics dashboards
 *
 * **Session End Reasons**:
 * - `inactivity`: User idle for configured timeout period (default 15 minutes)
 * - `page_unload`: User closed tab/window or navigated away
 * - `manual_stop`: Explicit session termination via `destroy()` or `stopTracking()`
 * - `orphaned_cleanup`: Session cleanup in secondary tab after primary tab closed
 * - `tab_closed`: Tab close detected (specific to tab close scenarios)
 *
 * **Use Cases**:
 * - Understanding user engagement patterns
 * - Identifying forced vs natural session ends
 * - Session quality metrics (short vs long sessions)
 * - Debugging session management issues
 *
 * **Analytics Interpretation**:
 * - `inactivity`: Low engagement, user left page open but inactive
 * - `page_unload`: Natural navigation, intentional page close
 * - `manual_stop`: Developer-triggered cleanup (e.g., logout)
 * - `orphaned_cleanup`: Multi-tab cleanup, secondary effect
 * - `tab_closed`: User closed specific tab
 *
 * @see src/managers/session.manager.ts for session lifecycle management
 * @see SESSION_END event in EventType enum
 */
export type SessionEndReason = 'inactivity' | 'page_unload' | 'manual_stop' | 'orphaned_cleanup' | 'tab_closed';
