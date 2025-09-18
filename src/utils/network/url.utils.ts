import { isValidUrl } from '../validations';
import { debugLog } from '../logging';

/**
 * Generates an API URL based on project ID and current domain
 * @param id - The project ID
 * @returns The generated API URL
 */
export const getApiUrl = (id: string, allowHttp = false): string => {
  debugLog.debug('URLUtils', 'Generating API URL', { projectId: id, allowHttp });

  const url = new URL(window.location.href);
  const host = url.hostname;
  const parts = host.split('.');

  if (parts.length === 0) {
    debugLog.clientError('URLUtils', 'Invalid hostname - no domain parts found', { hostname: host });
    throw new Error('Invalid URL');
  }

  const cleanDomain = parts.slice(-2).join('.');
  const protocol = allowHttp && url.protocol === 'http:' ? 'http' : 'https';
  const apiUrl = `${protocol}://${id}.${cleanDomain}`;

  debugLog.debug('URLUtils', 'Generated API URL', {
    originalUrl: window.location.href,
    hostname: host,
    domainParts: parts.length,
    cleanDomain,
    protocol,
    generatedUrl: apiUrl,
  });

  const isValid = isValidUrl(apiUrl, allowHttp);

  if (!isValid) {
    debugLog.clientError('URLUtils', 'Generated API URL failed validation', {
      apiUrl,
      allowHttp,
    });
    throw new Error('Invalid URL');
  }

  debugLog.debug('URLUtils', 'API URL generation completed successfully', { apiUrl });
  return apiUrl;
};

/**
 * Normalizes a URL by removing sensitive query parameters
 * @param url - The URL to normalize
 * @param sensitiveQueryParams - Array of parameter names to remove
 * @returns The normalized URL
 */
export const normalizeUrl = (url: string, sensitiveQueryParams: string[] = []): string => {
  debugLog.debug('URLUtils', 'Normalizing URL', {
    urlLength: url.length,
    sensitiveParamsCount: sensitiveQueryParams.length,
  });

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
      debugLog.debug('URLUtils', 'URL normalization - no changes needed');
      return url;
    }

    urlObject.search = searchParams.toString();
    const result = urlObject.toString();

    debugLog.debug('URLUtils', 'URL normalization completed', {
      hasChanged,
      originalLength: url.length,
      normalizedLength: result.length,
    });

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
  debugLog.debug('URLUtils', 'Checking if URL path is excluded', {
    urlLength: url.length,
    excludedPathsCount: excludedPaths.length,
  });

  if (excludedPaths.length === 0) {
    debugLog.debug('URLUtils', 'No excluded paths configured');
    return false;
  }

  let path: string;

  try {
    path = new URL(url, window.location.origin).pathname;
    debugLog.debug('URLUtils', 'Extracted path from URL', { path });
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
        if (matches) {
          debugLog.debug('URLUtils', 'Path matched regex pattern', { path, pattern: pattern.toString() });
        }
        return matches;
      }

      if (pattern.includes('*')) {
        const regex = wildcardToRegex(pattern);
        const matches = regex.test(path);
        if (matches) {
          debugLog.debug('URLUtils', 'Path matched wildcard pattern', { path, pattern, regex: regex.toString() });
        }
        return matches;
      }

      const matches = pattern === path;
      if (matches) {
        debugLog.debug('URLUtils', 'Path matched exact pattern', { path, pattern });
      }
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

  debugLog.debug('URLUtils', 'URL path exclusion check completed', {
    path,
    isExcluded,
    matchedPattern: matchedPattern || null,
    totalPatternsChecked: excludedPaths.length,
  });

  return isExcluded;
};
