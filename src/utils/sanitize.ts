const ALLOWED_API_CONFIG_KEYS = ['tagsManager', 'samplingRate', 'qaMode', 'excludedUrlPaths'] as const;

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
 */
export const sanitizeString = (value: string): string => {
  if (typeof value !== 'string') {
    return '';
  }

  // Limit string length
  if (value.length > MAX_STRING_LENGTH) {
    value = value.substring(0, MAX_STRING_LENGTH);
  }

  // Remove potential XSS patterns
  let sanitized = value;
  XSS_PATTERNS.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Basic HTML entity encoding for critical characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  return sanitized.trim();
};

/**
 * Sanitizes any value recursively with depth protection
 */
const sanitizeValue = (value: unknown, depth: number = 0): unknown => {
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
    // Validate number ranges
    if (!isFinite(value) || value < -Number.MAX_SAFE_INTEGER || value > Number.MAX_SAFE_INTEGER) {
      return 0;
    }
    return value;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    // Limit array length
    const limitedArray = value.slice(0, MAX_ARRAY_LENGTH);
    return limitedArray.map((item) => sanitizeValue(item, depth + 1)).filter((item) => item !== null);
  }

  if (typeof value === 'object') {
    const sanitizedObj: Record<string, unknown> = {};
    const entries = Object.entries(value);

    // Limit object properties
    const limitedEntries = entries.slice(0, 20);

    for (const [key, val] of limitedEntries) {
      const sanitizedKey = sanitizeString(key);
      if (sanitizedKey) {
        const sanitizedVal = sanitizeValue(val, depth + 1);
        if (sanitizedVal !== null) {
          sanitizedObj[sanitizedKey] = sanitizedVal;
        }
      }
    }

    return sanitizedObj;
  }

  return null;
};

/**
 * Sanitizes API configuration data with strict validation
 */
export const sanitizeApiConfig = (
  data: unknown,
): Partial<{
  tagsManager: unknown;
  samplingRate: unknown;
  qaMode: unknown;
  excludedUrlPaths: unknown;
}> => {
  const safeData: Record<string, unknown> = {};

  if (typeof data !== 'object' || data === null) {
    return safeData;
  }

  try {
    for (const key of Object.keys(data)) {
      if (ALLOWED_API_CONFIG_KEYS.includes(key as any)) {
        const value = (data as Record<string, unknown>)[key];
        const sanitizedValue = sanitizeValue(value);

        if (sanitizedValue !== null) {
          safeData[key] = sanitizedValue;
        }
      }
    }
  } catch (error) {
    // Return empty object if sanitization fails
    console.warn('[TraceLog] API config sanitization failed:', error);
    return {};
  }

  return safeData;
};

/**
 * Sanitizes user metadata for custom events
 */
export const sanitizeMetadata = (metadata: unknown): Record<string, unknown> => {
  if (typeof metadata !== 'object' || metadata === null) {
    return {};
  }

  try {
    const sanitized = sanitizeValue(metadata);
    return typeof sanitized === 'object' && sanitized !== null ? (sanitized as Record<string, unknown>) : {};
  } catch (error) {
    console.warn('[TraceLog] Metadata sanitization failed:', error);
    return {};
  }
};

/**
 * Sanitizes URL strings for tracking
 */
export const sanitizeUrl = (url: string): string => {
  if (typeof url !== 'string') {
    return '';
  }

  try {
    // Basic URL validation
    const urlObj = new URL(url);

    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return '';
    }

    // Sanitize the URL string
    return sanitizeString(urlObj.href);
  } catch (error) {
    // If URL parsing fails, sanitize as string
    return sanitizeString(url);
  }
};
