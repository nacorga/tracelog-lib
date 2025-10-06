import { MAX_NESTED_OBJECT_KEYS } from '../../constants';

/**
 * Validates if an item in an array is a valid nested object
 * @param item - The item to validate
 * @returns True if the item is a valid nested object
 */
const isValidArrayItem = (item: unknown): boolean => {
  if (typeof item === 'string') {
    return true;
  }

  // Allow objects with primitive fields only (one level deep)
  if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
    const entries = Object.entries(item);

    // Check key count limit
    if (entries.length > MAX_NESTED_OBJECT_KEYS) {
      return false;
    }

    // All values must be primitives (no nested objects or arrays)
    for (const [, value] of entries) {
      if (value === null || value === undefined) {
        continue;
      }

      const type = typeof value;
      if (type !== 'string' && type !== 'number' && type !== 'boolean') {
        return false;
      }
    }

    return true;
  }

  return false;
};

/**
 * Checks if an object contains only primitive fields, string arrays, or arrays of flat objects
 * @param object - The object to check
 * @returns True if the object contains only valid fields
 */
export const isOnlyPrimitiveFields = (object: Record<string, unknown>): boolean => {
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
      if (value.length === 0) {
        continue;
      }

      // Determine array type from first item
      const firstItem = value[0];
      const isStringArray = typeof firstItem === 'string';

      // All items must be of the same type (all strings OR all objects)
      if (isStringArray) {
        if (!value.every((item) => typeof item === 'string')) {
          return false;
        }
      } else {
        // Must be all objects
        if (!value.every((item) => isValidArrayItem(item))) {
          return false;
        }
      }

      continue;
    }

    return false;
  }

  return true;
};
