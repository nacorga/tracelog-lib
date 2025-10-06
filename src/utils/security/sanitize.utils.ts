import { MAX_ARRAY_LENGTH, MAX_OBJECT_DEPTH, MAX_STRING_LENGTH, XSS_PATTERNS } from '../../constants';
import { MetadataType } from '../../types';
import { log } from '../logging.utils';

/**
 * Sanitizes a string value to prevent XSS attacks
 * @param value - The string to sanitize
 * @returns The sanitized string
 */
export const sanitizeString = (value: string): string => {
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    return '';
  }

  let sanitized = value;

  // Limit string length
  if (value.length > MAX_STRING_LENGTH) {
    sanitized = value.slice(0, Math.max(0, MAX_STRING_LENGTH));
    // Silent truncation - this is expected behavior for long strings
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
    log('warn', 'XSS patterns detected and removed', {
      data: {
        patternMatches: xssPatternMatches,
        originalValue: value.slice(0, 100),
      },
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

  return result;
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
    // Silent depth limit - prevents stack overflow
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
      // Silent normalization - invalid numbers become 0
      return 0;
    }

    return value;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    const limitedArray = value.slice(0, MAX_ARRAY_LENGTH);

    // Silent array length limit
    const sanitizedArray = limitedArray.map((item) => sanitizeValue(item, depth + 1)).filter((item) => item !== null);

    // Silent filter - empty arrays are valid results
    return sanitizedArray;
  }

  if (typeof value === 'object') {
    const sanitizedObject: Record<string, unknown> = {};
    const entries = Object.entries(value);
    const limitedEntries = entries.slice(0, 20);

    // Silent object keys limit
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
    const result =
      typeof sanitized === 'object' && sanitized !== null ? (sanitized as Record<string, MetadataType>) : {};

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`[TraceLog] Metadata sanitization failed: ${errorMessage}`);
  }
};
