import { ALLOWED_API_CONFIG_KEYS } from '../../app.constants';
import { MetadataType } from '../../types/common.types';
import { ApiConfig } from '../../types/config.types';

// Security constants
const MAX_STRING_LENGTH = 1000;
const MAX_ARRAY_LENGTH = 100;
const MAX_OBJECT_DEPTH = 3;

// XSS prevention patterns
const XSS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /data:text\/html/gi,
  /vbscript:/gi,
];

/**
 * Sanitizes a string value to prevent XSS attacks
 * @param value - The string to sanitize
 * @returns The sanitized string
 */
export const sanitizeString = (value: string): string => {
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    return '';
  }

  // Limit string length
  if (value.length > MAX_STRING_LENGTH) {
    value = value.slice(0, Math.max(0, MAX_STRING_LENGTH));
  }

  // Remove potential XSS patterns
  let sanitized = value;
  for (const pattern of XSS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  // Basic HTML entity encoding for critical characters
  sanitized = sanitized
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#x27;')
    .replaceAll('/', '&#x2F;');

  return sanitized.trim();
};

/**
 * Sanitizes a path string for route exclusion checks
 * @param value - The path string to sanitize
 * @returns The sanitized path string
 */
export const sanitizePathString = (value: string): string => {
  if (typeof value !== 'string') {
    return '';
  }

  if (value.length > MAX_STRING_LENGTH) {
    value = value.slice(0, Math.max(0, MAX_STRING_LENGTH));
  }

  let sanitized = value;

  for (const pattern of XSS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  sanitized = sanitized
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#x27;');

  return sanitized.trim();
};

/**
 * Sanitizes any value recursively with depth protection
 * @param value - The value to sanitize
 * @param depth - Current recursion depth
 * @returns The sanitized value
 */
const sanitizeValue = (value: unknown, depth = 0): unknown => {
  // Prevent infinite recursion
  if (depth > MAX_OBJECT_DEPTH) {
    return null;
  }

  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    return sanitizeString(value);
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < -Number.MAX_SAFE_INTEGER || value > Number.MAX_SAFE_INTEGER) {
      return 0;
    }

    return value;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    const limitedArray = value.slice(0, MAX_ARRAY_LENGTH);

    return limitedArray.map((item) => sanitizeValue(item, depth + 1)).filter((item) => item !== null);
  }

  if (typeof value === 'object') {
    const sanitizedObject: Record<string, unknown> = {};
    const entries = Object.entries(value);
    const limitedEntries = entries.slice(0, 20);

    for (const [key, value_] of limitedEntries) {
      const sanitizedKey = sanitizeString(key);

      if (sanitizedKey) {
        const sanitizedValue = sanitizeValue(value_, depth + 1);

        if (sanitizedValue !== null) {
          sanitizedObject[sanitizedKey] = sanitizedValue;
        }
      }
    }

    return sanitizedObject;
  }

  return null;
};

/**
 * Sanitizes API configuration data with strict validation
 * @param data - The API config data to sanitize
 * @returns The sanitized API config
 */
export const sanitizeApiConfig = (data: unknown): ApiConfig => {
  const safeData: Record<string, unknown> = {};

  if (typeof data !== 'object' || data === null) {
    return safeData;
  }

  try {
    for (const key of Object.keys(data)) {
      if (ALLOWED_API_CONFIG_KEYS.has(key as keyof ApiConfig)) {
        const value = (data as Record<string, unknown>)[key];

        if (key === 'excludedUrlPaths') {
          const paths: string[] = Array.isArray(value) ? (value as string[]) : typeof value === 'string' ? [value] : [];

          safeData.excludedUrlPaths = paths.map((path) => sanitizePathString(String(path))).filter(Boolean);
        } else {
          const sanitizedValue = sanitizeValue(value);

          if (sanitizedValue !== null) {
            safeData[key] = sanitizedValue;
          }
        }
      }
    }
  } catch (error) {
    throw new Error(`API config sanitization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return safeData;
};

/**
 * Sanitizes user metadata for custom events
 * @param metadata - The metadata to sanitize
 * @returns The sanitized metadata
 */
export const sanitizeMetadata = (metadata: unknown): Record<string, MetadataType> => {
  if (typeof metadata !== 'object' || metadata === null) {
    return {};
  }

  try {
    const sanitized = sanitizeValue(metadata);

    return typeof sanitized === 'object' && sanitized !== null ? (sanitized as Record<string, MetadataType>) : {};
  } catch (error) {
    throw new Error(`Metadata sanitization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Sanitizes URL strings for tracking
 * @param url - The URL to sanitize
 * @returns The sanitized URL
 */
export const sanitizeUrl = (url: string): string => {
  if (typeof url !== 'string') {
    return '';
  }

  try {
    // Basic URL validation
    const urlObject = new URL(url);

    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(urlObject.protocol)) {
      return '';
    }

    // Sanitize the URL string
    return sanitizeString(urlObject.href);
  } catch {
    // If URL parsing fails, sanitize as string
    return sanitizeString(url);
  }
};
