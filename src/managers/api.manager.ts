import { getApiUrl, isValidUrl } from '../utils';
import { SpecialProjectId } from '../types';
import { debugLog } from '../utils/logging';

/**
 * Generates API URL for TraceLog service based on project ID
 *
 * Handles two special cases:
 * - 'localhost:8080' or 'localhost:9999' - for local development (generates http://localhost:PORT)
 * - Regular project IDs - generates subdomain URLs via getApiUrl utility
 *
 * @param id Project ID or localhost address
 * @param allowHttp Whether to allow HTTP protocol (default: false)
 * @returns Generated API URL
 * @throws Error if URL generation or validation fails
 */
export function getApiUrlForProject(id: string, allowHttp = false): string {
  try {
    // Handle localhost development case (localhost:8080 or localhost:9999)
    if (id === SpecialProjectId.Localhost || id === SpecialProjectId.Fail) {
      const url = `http://${id}`;

      if (!isValidUrl(url, true)) {
        throw new Error(`Invalid localhost URL format: ${id}`);
      }

      return url;
    }

    // Handle regular project ID case
    const url = getApiUrl(id, allowHttp);

    if (!isValidUrl(url, allowHttp)) {
      throw new Error(`Generated API URL failed validation: ${url}`);
    }

    return url;
  } catch (error) {
    debugLog.error('ApiManager', 'API URL generation failed', {
      projectId: id,
      allowHttp,
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  }
}
