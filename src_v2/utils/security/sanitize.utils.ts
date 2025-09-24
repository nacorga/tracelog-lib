import {
  ALLOWED_API_CONFIG_KEYS,
  MAX_ARRAY_LENGTH,
  MAX_OBJECT_DEPTH,
  MAX_STRING_LENGTH,
  XSS_PATTERNS,
} from '../../constants';
import { MetadataType } from '../../types/common.types';
import { ApiConfig } from '../../types/config.types';
import { debugLog } from '../logging';

/**
 * Sanitizes a string value to prevent XSS attacks
 * @param value - The string to sanitize
 * @returns The sanitized string
 */
export const sanitizeString = (value: string): string => {
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    debugLog.debug('Sanitize', 'String sanitization skipped - empty or invalid input', { value, type: typeof value });
    return '';
  }

  const originalLength = value.length;
  let sanitized = value;

  // Limit string length
  if (value.length > MAX_STRING_LENGTH) {
    sanitized = value.slice(0, Math.max(0, MAX_STRING_LENGTH));
    debugLog.warn('Sanitize', 'String truncated due to length limit', {
      originalLength,
      maxLength: MAX_STRING_LENGTH,
      truncatedLength: sanitized.length,
    });
  }

  // Remove potential XSS patterns
  let xssPatternMatches = 0;
  for (const pattern of XSS_PATTERNS) {
    const beforeReplace = sanitized;
    sanitized = sanitized.replace(pattern, '');
    if (beforeReplace !== sanitized) {
      xssPatternMatches++;
    }
  }

  if (xssPatternMatches > 0) {
    debugLog.warn('Sanitize', 'XSS patterns detected and removed', {
      patternMatches: xssPatternMatches,
      originalValue: value.slice(0, 100), // Log first 100 chars for debugging
    });
  }

  // Basic HTML entity encoding for critical characters
  sanitized = sanitized
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#x27;')
    .replaceAll('/', '&#x2F;');

  const result = sanitized.trim();

  if (originalLength > 50 || xssPatternMatches > 0) {
    debugLog.debug('Sanitize', 'String sanitization completed', {
      originalLength,
      sanitizedLength: result.length,
      xssPatternMatches,
      wasTruncated: originalLength > MAX_STRING_LENGTH,
    });
  }

  return result;
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
    debugLog.warn('Sanitize', 'Maximum object depth exceeded during sanitization', {
      depth,
      maxDepth: MAX_OBJECT_DEPTH,
    });
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
      debugLog.warn('Sanitize', 'Invalid number sanitized to 0', { value, isFinite: Number.isFinite(value) });
      return 0;
    }

    return value;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    const originalLength = value.length;
    const limitedArray = value.slice(0, MAX_ARRAY_LENGTH);

    if (originalLength > MAX_ARRAY_LENGTH) {
      debugLog.warn('Sanitize', 'Array truncated due to length limit', {
        originalLength,
        maxLength: MAX_ARRAY_LENGTH,
        depth,
      });
    }

    const sanitizedArray = limitedArray.map((item) => sanitizeValue(item, depth + 1)).filter((item) => item !== null);

    if (originalLength > 0 && sanitizedArray.length === 0) {
      debugLog.warn('Sanitize', 'All array items were filtered out during sanitization', { originalLength, depth });
    }

    return sanitizedArray;
  }

  if (typeof value === 'object') {
    const sanitizedObject: Record<string, unknown> = {};
    const entries = Object.entries(value);
    const originalKeysCount = entries.length;
    const limitedEntries = entries.slice(0, 20);

    if (originalKeysCount > 20) {
      debugLog.warn('Sanitize', 'Object keys truncated due to limit', {
        originalKeys: originalKeysCount,
        maxKeys: 20,
        depth,
      });
    }

    let filteredKeysCount = 0;
    for (const [key, value_] of limitedEntries) {
      const sanitizedKey = sanitizeString(key);

      if (sanitizedKey) {
        const sanitizedValue = sanitizeValue(value_, depth + 1);

        if (sanitizedValue !== null) {
          sanitizedObject[sanitizedKey] = sanitizedValue;
        } else {
          filteredKeysCount++;
        }
      } else {
        filteredKeysCount++;
      }
    }

    if (filteredKeysCount > 0) {
      debugLog.debug('Sanitize', 'Object properties filtered during sanitization', {
        filteredKeysCount,
        remainingKeys: Object.keys(sanitizedObject).length,
        depth,
      });
    }

    return sanitizedObject;
  }

  debugLog.debug('Sanitize', 'Unknown value type sanitized to null', { type: typeof value, depth });
  return null;
};

/**
 * Sanitizes API configuration data with strict validation
 * @param data - The API config data to sanitize
 * @returns The sanitized API config
 */
export const sanitizeApiConfig = (data: unknown): ApiConfig => {
  debugLog.debug('Sanitize', 'Starting API config sanitization');
  const safeData: Record<string, unknown> = {};

  if (typeof data !== 'object' || data === null) {
    debugLog.warn('Sanitize', 'API config data is not an object', { data, type: typeof data });
    return safeData;
  }

  try {
    const originalKeys = Object.keys(data);
    let processedKeys = 0;
    let filteredKeys = 0;

    for (const key of originalKeys) {
      if (ALLOWED_API_CONFIG_KEYS.has(key as keyof ApiConfig)) {
        const value = (data as Record<string, unknown>)[key];

        if (key === 'excludedUrlPaths') {
          const paths: string[] = Array.isArray(value) ? (value as string[]) : typeof value === 'string' ? [value] : [];
          const originalPathsCount = paths.length;

          safeData.excludedUrlPaths = paths.map((path) => sanitizePathString(String(path))).filter(Boolean);

          const filteredPathsCount = originalPathsCount - (safeData.excludedUrlPaths as string[]).length;
          if (filteredPathsCount > 0) {
            debugLog.warn('Sanitize', 'Some excluded URL paths were filtered during sanitization', {
              originalCount: originalPathsCount,
              filteredCount: filteredPathsCount,
            });
          }
        } else if (key === 'tags') {
          if (Array.isArray(value)) {
            safeData.tags = value;
            debugLog.debug('Sanitize', 'Tags processed', { count: value.length });
          } else {
            debugLog.warn('Sanitize', 'Tags value is not an array', { value, type: typeof value });
          }
        } else {
          const sanitizedValue = sanitizeValue(value);

          if (sanitizedValue !== null) {
            safeData[key] = sanitizedValue;
          } else {
            debugLog.warn('Sanitize', 'API config value sanitized to null', { key, originalValue: value });
          }
        }
        processedKeys++;
      } else {
        filteredKeys++;
        debugLog.debug('Sanitize', 'API config key not allowed', { key });
      }
    }

    debugLog.info('Sanitize', 'API config sanitization completed', {
      originalKeys: originalKeys.length,
      processedKeys,
      filteredKeys,
      finalKeys: Object.keys(safeData).length,
    });
  } catch (error) {
    debugLog.error('Sanitize', 'API config sanitization failed', {
      error: error instanceof Error ? error.message : error,
    });
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
  debugLog.debug('Sanitize', 'Starting metadata sanitization', { hasMetadata: metadata != null });

  if (typeof metadata !== 'object' || metadata === null) {
    debugLog.debug('Sanitize', 'Metadata is not an object, returning empty object', {
      metadata,
      type: typeof metadata,
    });
    return {};
  }

  try {
    const originalKeys = Object.keys(metadata).length;
    const sanitized = sanitizeValue(metadata);
    const result =
      typeof sanitized === 'object' && sanitized !== null ? (sanitized as Record<string, MetadataType>) : {};
    const finalKeys = Object.keys(result).length;

    debugLog.debug('Sanitize', 'Metadata sanitization completed', {
      originalKeys,
      finalKeys,
      keysFiltered: originalKeys - finalKeys,
    });

    return result;
  } catch (error) {
    debugLog.error('Sanitize', 'Metadata sanitization failed', {
      error: error instanceof Error ? error.message : error,
    });
    throw new Error(`Metadata sanitization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Sanitizes URL strings for tracking
 * @param url - The URL to sanitize
 * @returns The sanitized URL
 */
export const sanitizeUrl = (url: string): string => {
  debugLog.debug('Sanitize', 'Starting URL sanitization', { urlLength: typeof url === 'string' ? url.length : 0 });

  if (typeof url !== 'string') {
    debugLog.warn('Sanitize', 'URL is not a string', { url, type: typeof url });
    return '';
  }

  try {
    // Basic URL validation
    const urlObject = new URL(url);

    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(urlObject.protocol)) {
      debugLog.warn('Sanitize', 'URL protocol not allowed', {
        protocol: urlObject.protocol,
        allowedProtocols: ['http:', 'https:'],
      });
      return '';
    }

    // Sanitize the URL string
    const result = sanitizeString(urlObject.href);
    debugLog.debug('Sanitize', 'URL sanitization completed via URL object', {
      originalLength: url.length,
      sanitizedLength: result.length,
      protocol: urlObject.protocol,
    });

    return result;
  } catch {
    // If URL parsing fails, sanitize as string
    debugLog.warn('Sanitize', 'URL parsing failed, falling back to string sanitization', {
      urlPreview: url.slice(0, 100),
    });
    return sanitizeString(url);
  }
};
