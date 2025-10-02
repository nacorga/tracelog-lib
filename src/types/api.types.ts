/**
 * Special project IDs for testing and development
 *
 * All automatically force mode: 'debug' but differ in HTTP behavior:
 * - Skip: NO network calls (pure offline testing)
 * - Localhost: Makes network calls to local server (integration testing)
 * - Fail: Makes network calls that intentionally fail (persistence testing)
 */
export enum SpecialProjectId {
  /**
   * Value: 'skip'
   *
   * Skips ALL HTTP calls - no config fetch, no event sending
   * Uses default local config, forces debug mode
   * Perfect for pure offline E2E testing
   *
   * @example
   * await TraceLog.init({ id: SpecialProjectId.Skip });
   * // or
   * await TraceLog.init({ id: 'skip' });
   */
  Skip = 'skip',
  /**
   * Value: 'localhost:8080'
   *
   * Makes HTTP calls to local development server on port 8080
   * Converts to http://localhost:8080/config for requests
   * Requires origin to be in ALLOWED_ORIGINS list, forces debug mode
   * Perfect for local development with running middleware
   *
   * @example
   * await TraceLog.init({ id: SpecialProjectId.Localhost });
   * // or
   * await TraceLog.init({ id: 'localhost:8080' });
   * // Makes requests to: http://localhost:8080/config
   */
  Localhost = 'localhost:8080',
  /**
   * Value: 'localhost:9999'
   *
   * Makes HTTP calls to non-existent server (port 9999)
   * All HTTP requests will fail naturally, triggering persistence
   * Forces debug mode, perfect for testing event persistence & recovery
   *
   * @example
   * await TraceLog.init({ id: SpecialProjectId.Fail });
   * // or
   * await TraceLog.init({ id: 'localhost:9999' });
   * // Makes requests to: http://localhost:9999 (will fail)
   */
  Fail = 'localhost:9999',
}
