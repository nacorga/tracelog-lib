import {
  MAX_CUSTOM_EVENT_ARRAY_SIZE,
  MAX_CUSTOM_EVENT_KEYS,
  MAX_CUSTOM_EVENT_NAME_LENGTH,
  MAX_CUSTOM_EVENT_STRING_SIZE,
  MAX_STRING_LENGTH,
} from '../../constants';
import { MetadataType } from '../../types';
import { sanitizeMetadata } from '../security/sanitize.utils';
import { isOnlyPrimitiveFields } from './type-guards.utils';

/**
 * Validates an event name
 * @param eventName - The event name to validate
 * @returns Validation result with error message if invalid
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

  if (eventName.includes('<') || eventName.includes('>') || eventName.includes('&')) {
    return {
      valid: false,
      error: 'Event name contains invalid characters',
    };
  }

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
 * Validates a single metadata object
 * @param eventName - The event name (for error messages)
 * @param metadata - The metadata object to validate
 * @param type - Type of metadata (globalMetadata or customEvent)
 * @returns Validation result with sanitized metadata if valid
 */
const validateSingleMetadata = (
  eventName: string,
  metadata: Record<string, unknown>,
  type?: 'globalMetadata' | 'customEvent',
): { valid: boolean; error?: string; sanitizedMetadata?: Record<string, MetadataType> } => {
  const sanitizedMetadata = sanitizeMetadata(metadata);
  const intro =
    type && type === 'customEvent' ? `${type} "${eventName}" metadata error` : `${eventName} metadata error`;

  if (!isOnlyPrimitiveFields(sanitizedMetadata)) {
    return {
      valid: false,
      error: `${intro}: object has invalid types. Valid types are string, number, boolean or string arrays.`,
    };
  }

  let jsonString: string;

  try {
    jsonString = JSON.stringify(sanitizedMetadata);
  } catch {
    return {
      valid: false,
      error: `${intro}: object contains circular references or cannot be serialized.`,
    };
  }

  if (jsonString.length > MAX_CUSTOM_EVENT_STRING_SIZE) {
    return {
      valid: false,
      error: `${intro}: object is too large (max ${MAX_CUSTOM_EVENT_STRING_SIZE / 1024} KB).`,
    };
  }

  const keyCount = Object.keys(sanitizedMetadata).length;

  if (keyCount > MAX_CUSTOM_EVENT_KEYS) {
    return {
      valid: false,
      error: `${intro}: object has too many keys (max ${MAX_CUSTOM_EVENT_KEYS} keys).`,
    };
  }

  for (const [key, value] of Object.entries(sanitizedMetadata)) {
    if (Array.isArray(value)) {
      if (value.length > MAX_CUSTOM_EVENT_ARRAY_SIZE) {
        return {
          valid: false,
          error: `${intro}: array property "${key}" is too large (max ${MAX_CUSTOM_EVENT_ARRAY_SIZE} items).`,
        };
      }

      for (const item of value) {
        if (typeof item === 'string' && item.length > 500) {
          return {
            valid: false,
            error: `${intro}: array property "${key}" contains strings that are too long (max 500 characters).`,
          };
        }
      }
    }

    if (typeof value === 'string' && value.length > MAX_STRING_LENGTH) {
      return {
        valid: false,
        error: `${intro}: property "${key}" is too long (max ${MAX_STRING_LENGTH} characters).`,
      };
    }
  }

  return {
    valid: true,
    sanitizedMetadata,
  };
};

/**
 * Validates metadata for events (supports both objects and arrays of objects)
 * @param eventName - The event name (for error messages)
 * @param metadata - The metadata to validate
 * @param type - Type of metadata (globalMetadata or customEvent)
 * @returns Validation result with sanitized metadata if valid
 */
export const isValidMetadata = (
  eventName: string,
  metadata: Record<string, unknown> | Record<string, unknown>[],
  type?: 'globalMetadata' | 'customEvent',
): {
  valid: boolean;
  error?: string;
  sanitizedMetadata?: Record<string, MetadataType> | Record<string, MetadataType>[];
} => {
  if (Array.isArray(metadata)) {
    const sanitizedArray: Record<string, MetadataType>[] = [];
    const intro =
      type && type === 'customEvent' ? `${type} "${eventName}" metadata error` : `${eventName} metadata error`;
    for (let i = 0; i < metadata.length; i++) {
      const item = metadata[i];
      if (typeof item !== 'object' || item === null || Array.isArray(item)) {
        return {
          valid: false,
          error: `${intro}: array item at index ${i} must be an object.`,
        };
      }
      const itemValidation = validateSingleMetadata(eventName, item, type);
      if (!itemValidation.valid) {
        return {
          valid: false,
          error: `${intro}: array item at index ${i} is invalid: ${itemValidation.error}`,
        };
      }
      if (itemValidation.sanitizedMetadata) {
        sanitizedArray.push(itemValidation.sanitizedMetadata);
      }
    }
    // Allow empty arrays after sanitization
    return {
      valid: true,
      sanitizedMetadata: sanitizedArray,
    };
  }
  return validateSingleMetadata(eventName, metadata, type);
};
