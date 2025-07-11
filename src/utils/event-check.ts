import {
  MAX_CUSTOM_EVENT_NAME_LENGTH,
  MAX_CUSTOM_EVENT_STRING_SIZE,
  MAX_CUSTOM_EVENT_KEYS,
  MAX_CUSTOM_EVENT_ARRAY_SIZE,
} from '../constants';
import { sanitizeMetadata } from './sanitize';

/**
 * Validates if an object contains only primitive fields
 */
export const isOnlyPrimitiveFields = (object: Record<string, any>): boolean => {
  if (typeof object !== 'object' || object === null) {
    return false;
  }

  for (const value of Object.values(object)) {
    if (value === null || value === undefined) {
      continue;
    }

    const type = typeof value;
    if (type === 'string' || type === 'number' || type === 'boolean') {
      continue;
    }

    if (Array.isArray(value)) {
      // Check if array contains only strings
      if (!value.every((item) => typeof item === 'string')) {
        return false;
      }
      continue;
    }

    // Any other type is not allowed
    return false;
  }

  return true;
};

/**
 * Validates event name with security checks
 */
export const isValidEventName = (eventName: string): { valid: boolean; error?: string } => {
  if (typeof eventName !== 'string') {
    return {
      valid: false,
      error: 'Event name must be a string',
    };
  }

  if (eventName.length === 0) {
    return {
      valid: false,
      error: 'Event name cannot be empty',
    };
  }

  if (eventName.length > MAX_CUSTOM_EVENT_NAME_LENGTH) {
    return {
      valid: false,
      error: `Event name is too long (max ${MAX_CUSTOM_EVENT_NAME_LENGTH} characters)`,
    };
  }

  // Check for potentially dangerous characters
  if (eventName.includes('<') || eventName.includes('>') || eventName.includes('&')) {
    return {
      valid: false,
      error: 'Event name contains invalid characters',
    };
  }

  // Check for JavaScript keywords and reserved words
  const reservedWords = ['constructor', 'prototype', '__proto__', 'eval', 'function', 'var', 'let', 'const'];
  if (reservedWords.includes(eventName.toLowerCase())) {
    return {
      valid: false,
      error: 'Event name cannot be a reserved word',
    };
  }

  return { valid: true };
};

/**
 * Validates metadata with enhanced security
 */
export const isValidMetadata = (
  eventName: string,
  metadata: Record<string, any>,
  type?: string,
): { valid: boolean; error?: string; sanitizedMetadata?: Record<string, any> } => {
  const intro =
    type && type === 'sendCustomEvent' ? `${type} "${eventName}" metadata error` : `${eventName} metadata error`;

  // Sanitize metadata first
  const sanitizedMetadata = sanitizeMetadata(metadata);

  if (!isOnlyPrimitiveFields(sanitizedMetadata)) {
    return {
      valid: false,
      error: `${intro}: object has invalid types. Valid types are string, number, boolean or string arrays.`,
    };
  }

  // Check for circular references and get size
  let jsonString: string;
  try {
    jsonString = JSON.stringify(sanitizedMetadata);
  } catch {
    return {
      valid: false,
      error: `${intro}: object contains circular references or cannot be serialized.`,
    };
  }

  // Use JSON string length for accurate size validation
  if (jsonString.length > MAX_CUSTOM_EVENT_STRING_SIZE) {
    return {
      valid: false,
      error: `${intro}: object is too large (max ${MAX_CUSTOM_EVENT_STRING_SIZE / 1024} KB).`,
    };
  }

  // Check key count limit
  const keyCount = Object.keys(sanitizedMetadata).length;
  if (keyCount > MAX_CUSTOM_EVENT_KEYS) {
    return {
      valid: false,
      error: `${intro}: object has too many keys (max ${MAX_CUSTOM_EVENT_KEYS} keys).`,
    };
  }

  // Check array size limits and validate array contents
  for (const [key, value] of Object.entries(sanitizedMetadata)) {
    if (Array.isArray(value)) {
      if (value.length > MAX_CUSTOM_EVENT_ARRAY_SIZE) {
        return {
          valid: false,
          error: `${intro}: array property "${key}" is too large (max ${MAX_CUSTOM_EVENT_ARRAY_SIZE} items).`,
        };
      }

      // Validate each array item
      for (const item of value) {
        if (typeof item === 'string' && item.length > 500) {
          return {
            valid: false,
            error: `${intro}: array property "${key}" contains strings that are too long (max 500 characters).`,
          };
        }
      }
    }

    // Validate individual string values
    if (typeof value === 'string' && value.length > 1000) {
      return {
        valid: false,
        error: `${intro}: property "${key}" is too long (max 1000 characters).`,
      };
    }
  }

  return {
    valid: true,
    sanitizedMetadata,
  };
};

/**
 * Enhanced event validation with security checks
 */
export const isEventValid = (
  eventName: string,
  metadata?: Record<string, any>,
): { valid: boolean; error?: string; sanitizedMetadata?: Record<string, any> } => {
  // Validate event name first
  const nameValidation = isValidEventName(eventName);
  if (!nameValidation.valid) {
    return nameValidation;
  }

  // If no metadata, validation passes
  if (!metadata) {
    return { valid: true };
  }

  // Validate metadata
  return isValidMetadata(eventName, metadata, 'sendCustomEvent');
};
