/**
 * Special project IDs for testing and development
 *
 * Both automatically force mode: 'debug' but differ in HTTP behavior:
 * - HttpSkip: NO network calls (pure offline testing)
 * - HttpLocal: Makes network calls to local server (integration testing)
 */
export enum SpecialProjectId {
  /**
   * Skips ALL HTTP calls - no config fetch, no event sending
   * Uses default local config, forces debug mode
   * Perfect for pure offline E2E testing
   */
  HttpSkip = 'http-skip',
  /**
   * Makes HTTP calls to window.location.origin instead of production API
   * Fetches config and sends events to local server, forces debug mode
   * Perfect for local development with running middleware
   */
  HttpLocal = 'http-local',
}
