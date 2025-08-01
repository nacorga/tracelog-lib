import { isValidUrl } from '../validations';

/**
 * Generates an API URL based on project ID and current domain
 * @param id - The project ID
 * @returns The generated API URL
 */
export const getApiUrl = (id: string): string => {
  const url = new URL(window.location.href);
  const host = url.hostname;
  const parts = host.split('.');

  if (parts.length === 0) {
    throw new Error('Invalid URL');
  }

  const cleanDomain = parts.slice(-2).join('.');
  const apiUrl = `https://${id}.${cleanDomain}`;
  const isValid = isValidUrl(apiUrl);

  if (!isValid) {
    throw new Error('Invalid URL');
  }

  return apiUrl;
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

    sensitiveQueryParams.forEach((param) => {
      if (searchParams.has(param)) {
        searchParams.delete(param);
        hasChanged = true;
      }
    });

    if (!hasChanged && url.includes('?')) {
      return url;
    }

    urlObject.search = searchParams.toString();

    return urlObject.toString();
  } catch {
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

  const path = new URL(url, window.location.origin).pathname;

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

  return excludedPaths.some((pattern) => {
    if (isRegularExpression(pattern)) {
      return pattern.test(path);
    }

    if (pattern.includes('*')) {
      return wildcardToRegex(pattern).test(path);
    }

    return pattern === path;
  });
};
