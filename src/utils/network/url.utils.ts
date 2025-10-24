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
 * @param projectId - The project ID to use as a subdomain.
 * @returns The generated SaaS API URL.
 */
const generateSaasApiUrl = (projectId: string): string => {
  try {
    const url = new URL(window.location.href);
    const host = url.hostname;

    if (!host || typeof host !== 'string') {
      throw new Error('Invalid hostname');
    }

    if (host === 'localhost' || host === '127.0.0.1' || /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) {
      throw new Error(
        'SaaS integration not supported on localhost or IP addresses. Use custom backend integration instead.',
      );
    }

    const parts = host.split('.');

    if (!parts || !Array.isArray(parts) || parts.length === 0 || (parts.length === 1 && parts[0] === '')) {
      throw new Error('Invalid hostname structure');
    }

    if (parts.length === 1) {
      throw new Error('Single-part domain not supported for SaaS integration');
    }

    let cleanDomain: string;

    if (parts.length === 2) {
      cleanDomain = parts.join('.');
    } else {
      cleanDomain = parts.slice(-2).join('.');
    }

    if (!cleanDomain || cleanDomain.split('.').length < 2) {
      throw new Error('Invalid domain structure for SaaS');
    }

    const collectApiUrl = `https://${projectId}.${cleanDomain}/collect`;
    const isValid = isValidUrl(collectApiUrl);

    if (!isValid) {
      throw new Error('Generated URL failed validation');
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
