import { MAX_ARRAY_LENGTH, MAX_OBJECT_DEPTH, MAX_STRING_LENGTH, XSS_PATTERNS } from '../../constants';
import { MetadataType } from '../../types';
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
 * Sanitizes user metadata for custom events
 * @param metadata - The metadata to sanitize
 * @returns The sanitized metadata
 */
export const sanitizeMetadata = (metadata: unknown): Record<string, MetadataType> => {
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
