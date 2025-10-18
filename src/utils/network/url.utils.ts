import { Config } from '../../types';
import { DEFAULT_SENSITIVE_QUERY_PARAMS } from '../../constants';
import { log } from '../logging.utils';

/**
 * Validates if a URL is valid and optionally allows HTTP URLs
 * @param url - The URL to validate
 * @param allowHttp - Whether to allow HTTP URLs (default: false)
 * @returns True if the URL is valid, false otherwise
 */
const isValidUrl = (url: string, allowHttp = false): boolean => {
  try {
    const parsed = new URL(url);
    const isHttps = parsed.protocol === 'https:';
    const isHttp = parsed.protocol === 'http:';

    return isHttps || (allowHttp && isHttp);
  } catch {
    return false;
  }
};

/**
 * Generates a SaaS API URL based on the given project ID and the current browser domain.
 *
 * Hostname parsing strategy:
 * - Extracts the hostname from the current window location (e.g., "app.example.com").
 * - Splits the hostname by '.' and takes the last two segments to reconstruct the base domain (e.g., "example.com").
 * - Constructs the API URL in the format: "https://{projectId}.{baseDomain}/collect".
 *
 * Error handling:
 * - Throws an error if the hostname is missing, not a string, or has an invalid structure.
 * - Throws an error if the reconstructed domain is invalid or if the final URL is not a valid HTTPS URL.
 * - All errors are wrapped with a descriptive message for easier debugging.
 *
 * @param projectId - The project ID to use as a subdomain.
 * @returns The generated SaaS API URL.
 * @throws {Error} If the hostname or generated URL is invalid.
 */
const generateSaasApiUrl = (projectId: string): string => {
  try {
    const url = new URL(window.location.href);
    const host = url.hostname;

    if (!host || typeof host !== 'string') {
      throw new Error('Invalid hostname');
    }

    const parts = host.split('.');

    if (!parts || !Array.isArray(parts) || parts.length === 0 || (parts.length === 1 && parts[0] === '')) {
      throw new Error('Invalid hostname structure');
    }

    const cleanDomain = parts.slice(-2).join('.');

    if (!cleanDomain) {
      throw new Error('Invalid domain');
    }

    const collectApiUrl = `https://${projectId}.${cleanDomain}/collect`;
    const isValid = isValidUrl(collectApiUrl);

    if (!isValid) {
      throw new Error('Invalid URL');
    }

    return collectApiUrl;
  } catch (error) {
    throw new Error(`Invalid SaaS URL configuration: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Generates collection API URLs for all configured integrations
 * @param config - The TraceLog configuration
 * @returns Object containing API URLs for each configured integration
 */
export const getCollectApiUrls = (config: Config): { saas?: string; custom?: string } => {
  const urls: { saas?: string; custom?: string } = {};

  // TraceLog SaaS integration
  if (config.integrations?.tracelog?.projectId) {
    urls.saas = generateSaasApiUrl(config.integrations.tracelog.projectId);
  }

  // Custom backend integration
  const customApiUrl = config.integrations?.custom?.collectApiUrl;
  if (customApiUrl) {
    const allowHttp = config.integrations?.custom?.allowHttp ?? false;
    const isValid = isValidUrl(customApiUrl, allowHttp);

    if (!isValid) {
      throw new Error('Invalid custom API URL');
    }

    urls.custom = customApiUrl;
  }

  return urls;
};

/**
 * Normalizes a URL by removing sensitive query parameters
 * Combines default sensitive parameters with custom ones provided by user
 * @param url - The URL to normalize
 * @param sensitiveQueryParams - Array of parameter names to remove (merged with defaults)
 * @returns The normalized URL
 */
export const normalizeUrl = (url: string, sensitiveQueryParams: string[] = []): string => {
  if (!url || typeof url !== 'string') {
    log('warn', 'Invalid URL provided to normalizeUrl', { data: { url: String(url) } });
    return url || '';
  }

  try {
    const urlObject = new URL(url);
    const searchParams = urlObject.searchParams;

    // Merge default sensitive params with user-provided ones (deduped via Set)
    const allSensitiveParams = [...new Set([...DEFAULT_SENSITIVE_QUERY_PARAMS, ...sensitiveQueryParams])];

    let hasChanged = false;
    const removedParams: string[] = [];

    allSensitiveParams.forEach((param) => {
      if (searchParams.has(param)) {
        searchParams.delete(param);
        hasChanged = true;
        removedParams.push(param);
      }
    });

    if (!hasChanged && url.includes('?')) {
      return url;
    }

    urlObject.search = searchParams.toString();
    const result = urlObject.toString();

    return result;
  } catch (error) {
    const urlPreview = url && typeof url === 'string' ? url.slice(0, 100) : String(url);
    log('warn', 'URL normalization failed, returning original', { error, data: { url: urlPreview } });

    return url;
  }
};
