import { isValidUrl } from '../validations';
import { debugLog } from '../logging';
import { Config } from '@/types';

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

/**
 * Checks if a URL path should be excluded from tracking
 * @param url - The URL to check
 * @param excludedPaths - Array of patterns to match against
 * @returns True if the URL should be excluded
 */
export const isUrlPathExcluded = (url: string, excludedPaths: string[] = []): boolean => {
  if (excludedPaths.length === 0) {
    return false;
  }

  let path: string;

  try {
    const parsedUrl = new URL(url, window.location.origin);
    path = parsedUrl.pathname + (parsedUrl.hash ?? '');
  } catch (error) {
    debugLog.warn('URLUtils', 'Failed to parse URL for path exclusion check', {
      url: url.slice(0, 100),
      error: error instanceof Error ? error.message : error,
    });

    return false;
  }

  const isRegularExpression = (value: unknown): value is RegExp =>
    typeof value === 'object' && value !== undefined && typeof (value as RegExp).test === 'function';

  const escapeRegexString = (string_: string): string => string_.replaceAll(/[$()*+.?[\\\]^{|}]/g, '\\$&');

  const wildcardToRegex = (string_: string): RegExp =>
    new RegExp(
      '^' +
        string_
          .split('*')
          .map((element) => escapeRegexString(element))
          .join('.+') +
        '$',
    );

  const matchedPattern = excludedPaths.find((pattern) => {
    try {
      if (isRegularExpression(pattern)) {
        const matches = pattern.test(path);

        return matches;
      }

      if (pattern.includes('*')) {
        const regex = wildcardToRegex(pattern);
        const matches = regex.test(path);

        return matches;
      }

      const matches = pattern === path;

      return matches;
    } catch (error) {
      debugLog.warn('URLUtils', 'Error testing exclusion pattern', {
        pattern,
        path,
        error: error instanceof Error ? error.message : error,
      });
      return false;
    }
  });

  const isExcluded = !!matchedPattern;

  return isExcluded;
};
