/**
 * Checks if an object contains only primitive fields (string, number, boolean, or string arrays)
 * @param object - The object to check
 * @returns True if the object contains only primitive fields
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
      if (!value.every((item) => typeof item === 'string')) {
        return false;
      }

      continue;
    }

    return false;
  }

  return true;
};
