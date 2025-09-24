/**
 * Special project IDs for testing and development
 *
 * Both automatically force mode: 'debug' but differ in HTTP behavior:
 * - Skip: NO network calls (pure offline testing)
 * - Localhost: Makes network calls to local server (integration testing)
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
}
