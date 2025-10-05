import { debugLog } from '../logging';
import { Config } from '@/types';

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
 * Generates an API URL based on project ID and current domain
 * @param id - The project ID
 * @returns The generated API URL
 */
export const getApiUrl = (config: Config): string => {
  if (config.integrations?.custom?.apiUrl) {
    return config.integrations.custom.apiUrl;
  }

  if (config.integrations?.tracelog?.projectId) {
    const url = new URL(window.location.href);
    const host = url.hostname;
    const parts = host.split('.');

    if (parts.length === 0) {
      throw new Error('Invalid URL');
    }

    const allowHttp = config.allowHttp ?? false;
    const projectId = config.integrations.tracelog.projectId;
    const cleanDomain = parts.slice(-2).join('.');
    const protocol = allowHttp && url.protocol === 'http:' ? 'http' : 'https';
    const apiUrl = `${protocol}://${projectId}.${cleanDomain}`;
    const isValid = isValidUrl(apiUrl, allowHttp);

    if (!isValid) {
      throw new Error('Invalid URL');
    }

    return apiUrl;
  }

  return '';
};

/**
 * Normalizes a URL by removing sensitive query parameters
 * @param url - The URL to normalize
 * @param sensitiveQueryParams - Array of parameter names to remove
 * @returns The normalized URL
 */
export const normalizeUrl = (url: string, sensitiveQueryParams: string[] = []): string => {
  try {
    const urlObject = new URL(url);
    const searchParams = urlObject.searchParams;
    const originalParamCount = Array.from(searchParams.keys()).length;

    let hasChanged = false;
    const removedParams: string[] = [];

    sensitiveQueryParams.forEach((param) => {
      if (searchParams.has(param)) {
        searchParams.delete(param);
        hasChanged = true;
        removedParams.push(param);
      }
    });

    if (hasChanged) {
      debugLog.debug('URLUtils', 'Sensitive parameters removed from URL', {
        removedParams,
        originalParamCount,
        finalParamCount: Array.from(searchParams.keys()).length,
      });
    }

    if (!hasChanged && url.includes('?')) {
      return url;
    }

    urlObject.search = searchParams.toString();
    const result = urlObject.toString();

    return result;
  } catch (error) {
    debugLog.warn('URLUtils', 'URL normalization failed, returning original', {
      url: url.slice(0, 100),
      error: error instanceof Error ? error.message : error,
    });

    return url;
  }
};
