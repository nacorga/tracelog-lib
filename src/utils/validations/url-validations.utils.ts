/**
 * URL validation utilities
 */

/**
 * Validates if a URL is valid and optionally allows HTTP URLs
 * @param url - The URL to validate
 * @param allowHttp - Whether to allow HTTP URLs (default: false)
 * @returns True if the URL is valid, false otherwise
 */
export const isValidUrl = (url: string, allowHttp = false): boolean => {
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
 * Validates a URL field in configuration
 * @param url - The URL to validate
 * @param allowHttp - Whether to allow HTTP URLs
 * @param fieldName - The name of the field being validated
 * @param errors - Array to push errors to
 */
export const validateUrl = (
  url: unknown,
  allowHttp: boolean | undefined,
  fieldName: string,
  errors: string[],
): void => {
  if (url !== undefined) {
    if (typeof url === 'string') {
      try {
        const parsed = new URL(url);

        if (parsed.protocol === 'http:' && !allowHttp) {
          errors.push(`${fieldName} using http requires allowHttp=true`);
        }
      } catch {
        errors.push(`${fieldName} must be a valid URL`);
      }
    } else {
      errors.push(`${fieldName} must be a string`);
    }
  }
};
