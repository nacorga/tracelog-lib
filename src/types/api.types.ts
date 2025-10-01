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
   * Value: 'localhost:' (used as prefix)
   *
   * Makes HTTP calls to local development server
   * Must specify full address: 'localhost:PORT' (e.g., 'localhost:3000')
   * Converts to http://localhost:PORT/config for requests
   * Requires origin to be in ALLOWED_ORIGINS list, forces debug mode
   * Perfect for local development with running middleware
   *
   * @example
   * await TraceLog.init({ id: 'localhost:3000' });
   * // Makes requests to: http://localhost:3000/config
   */
  Localhost = 'localhost:',
  /**
   * Value: 'localhost:9999'
   *
   * Makes HTTP calls to non-existent server (port 9999)
   * All HTTP requests will fail naturally, triggering persistence
   * Forces debug mode, perfect for testing event persistence & recovery
   *
   * @example
   * await TraceLog.init({ id: SpecialProjectId.Fail });
   * // Makes requests to: http://localhost:9999 (will fail)
   */
  Fail = 'localhost:9999',
}
