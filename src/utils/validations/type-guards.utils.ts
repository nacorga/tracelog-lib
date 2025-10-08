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
 * Checks if an object contains only primitive fields, string arrays, arrays of flat objects,
 * or nested objects with primitive fields
 * @param object - The object to check
 * @param depth - Current nesting depth (default: 0, max: 1)
 * @returns True if the object contains only valid fields
 */
export const isOnlyPrimitiveFields = (object: Record<string, unknown>, depth = 0): boolean => {
  if (typeof object !== 'object' || object === null) {
    return false;
  }

  // Allow only one level of nesting (depth 0 -> depth 1)
  if (depth > 1) {
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

    // Allow nested objects at depth 0 only (one level deep)
    if (type === 'object' && depth === 0) {
      if (!isOnlyPrimitiveFields(value as Record<string, unknown>, depth + 1)) {
        return false;
      }
      continue;
    }

    return false;
  }

  return true;
};
