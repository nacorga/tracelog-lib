import { Config } from '@/types';
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
 * Generates an API URL based on project ID and current domain
 * @param id - The project ID
 * @returns The generated API URL
 */
export const getCollectApiUrl = (config: Config): string => {
  if (config.integrations?.tracelog?.projectId) {
    const url = new URL(window.location.href);
    const host = url.hostname;
    const parts = host.split('.');

    if (parts.length === 0) {
      throw new Error('Invalid URL');
    }

    const projectId = config.integrations.tracelog.projectId;
    const cleanDomain = parts.slice(-2).join('.');
    const collectApiUrl = `https://${projectId}.${cleanDomain}/collect`;
    const isValid = isValidUrl(collectApiUrl);

    if (!isValid) {
      throw new Error('Invalid URL');
    }

    return collectApiUrl;
  }

  const collectApiUrl = config.integrations?.custom?.collectApiUrl;

  if (collectApiUrl) {
    const allowHttp = config.integrations?.custom?.allowHttp ?? false;
    const isValid = isValidUrl(collectApiUrl, allowHttp);

    if (!isValid) {
      throw new Error('Invalid URL');
    }

    return collectApiUrl;
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

    let hasChanged = false;
    const removedParams: string[] = [];

    sensitiveQueryParams.forEach((param) => {
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
    log('warn', 'URL normalization failed, returning original', { error, data: { url: url.slice(0, 100) } });

    return url;
  }
};
