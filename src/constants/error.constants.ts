/**
 * Error handling constants for TraceLog
 * Centralizes limits for error tracking and burst detection
 */

// ============================================================================
// ERROR TRACKING LIMITS
// ============================================================================

/**
 * Maximum length for error messages before truncation
 * Prevents extremely long error messages from consuming excessive storage
 */
export const MAX_ERROR_MESSAGE_LENGTH = 500;

/**
 * Maximum length for error stack traces before truncation
 * Prevents oversized payloads while preserving useful debugging context
 */
export const MAX_STACK_TRACE_LENGTH = 2000;

/**
 * Time window for error suppression in milliseconds
 * Prevents duplicate errors from flooding the system within this timeframe
 */
export const ERROR_SUPPRESSION_WINDOW_MS = 5_000; // 5 seconds

/**
 * Maximum number of unique errors to track for suppression
 * Prevents memory usage from growing indefinitely
 */
export const MAX_TRACKED_ERRORS = 50;

/**
 * Hard limit for error tracking before aggressive cleanup
 * If this limit is exceeded, the entire error map is cleared
 */
export const MAX_TRACKED_ERRORS_HARD_LIMIT = MAX_TRACKED_ERRORS * 2;

// ============================================================================
// ERROR SAMPLING
// ============================================================================

/**
 * Default error sampling rate
 * Controls what percentage of errors are actually reported
 */
export const DEFAULT_ERROR_SAMPLING_RATE = 1; // 100% of errors

// ============================================================================
// ERROR BURST DETECTION (Phase 3)
// ============================================================================

/**
 * Time window for error burst detection in milliseconds
 * Tracks unique errors within this window
 */
export const ERROR_BURST_WINDOW_MS = 1000; // 1 second

/**
 * Maximum number of unique errors allowed in burst window
 * Exceeding this triggers a cooldown period
 */
export const ERROR_BURST_THRESHOLD = 10; // 10 unique errors

/**
 * Backoff period after burst detection in milliseconds
 * No errors will be tracked during this cooldown
 */
export const ERROR_BURST_BACKOFF_MS = 5000; // 5 seconds

// ============================================================================
// PER-PAGEVIEW SIGNATURE CAP
// ============================================================================

/**
 * Hard cap on how many error events with the same `(normalizedMessage, filename, line)`
 * signature may be tracked within a single pageview. After the cap, additional matches
 * are dropped at the handler before reaching `EventManager.track()` — both bandwidth
 * and the merchant's monthly event quota are protected at the source.
 *
 * Counter resets on:
 *   - `pagehide` (hard reload, navigation away)
 *   - `SESSION_START` (new session detected mid-pageview)
 *   - `PAGE_VIEW` (covers SPA navigation via patched History API + popstate/hashchange,
 *     which never fires `pagehide`)
 *
 * Orthogonal to:
 *   - the 5s identical-error dedup window (`ERROR_SUPPRESSION_WINDOW_MS`)
 *   - the burst detector (`ERROR_BURST_THRESHOLD` / `ERROR_BURST_BACKOFF_MS`)
 *   - the server-side per-day cap that runs on ingest (defensive second layer)
 *
 * Signature is built by `buildErrorSignatureKey`, which mirrors the regex set in
 * `tracelog-api/src/lib/error-classification/error-fingerprint.service.ts`. Single knob —
 * no public config surface. Symmetric with `ERROR_BURST_THRESHOLD`, also hardcoded.
 * Customers needing to disable throttling for QA can use `errorSampling: 0` or QA mode
 * (`?tlog_mode=qa`).
 */
export const MAX_ERRORS_PER_SIGNATURE_PER_PAGEVIEW = 3;

/**
 * Memory safety cap on distinct signatures tracked between counter resets. The
 * PAGE_VIEW / SESSION_START / pagehide reset triggers already bound the map in
 * normal use, but a long-running SPA route that produces hundreds of unique
 * error shapes (e.g. a misbehaving page firing one-off errors with different
 * dynamic content) could otherwise grow the map without a ceiling. Once the
 * size exceeds this constant, the entire map is cleared as a memory safety
 * valve. Mirrors the `MAX_TRACKED_ERRORS_HARD_LIMIT` pattern on `recentErrors`.
 */
export const MAX_PAGEVIEW_SIGNATURE_KEYS = 200;

// ============================================================================
// PERMANENT ERROR LOGGING
// ============================================================================

/**
 * Time window for throttling permanent error logs in milliseconds.
 * Same (status, code) pairs are logged at most once per this window.
 * Prevents console spam when backend repeatedly returns 4xx errors.
 */
export const PERMANENT_ERROR_LOG_THROTTLE_MS = 60_000; // 1 minute

/**
 * Maximum length of the application `code` field accepted from a 4xx response body.
 * Application codes are short identifiers (e.g. `PLAN_LIMIT_EXCEEDED`); anything
 * longer is treated as untrusted noise and ignored to avoid log pollution.
 */
export const MAX_RESPONSE_CODE_LENGTH = 64;

/**
 * Throttle window for the diagnostic health beacon, per reason. A blocked project keeps 403ing on
 * every batch; the beacon only needs to reach the backend occasionally to flip the dashboard state,
 * so it is emitted at most once per this window to stay low-frequency and non-abusive.
 */
export const HEALTH_BEACON_THROTTLE_MS = 10 * 60_000; // 10 minutes

/** Maximum length of the `lastError` detail string forwarded with a health beacon. */
export const MAX_BEACON_ERROR_LENGTH = 200;
