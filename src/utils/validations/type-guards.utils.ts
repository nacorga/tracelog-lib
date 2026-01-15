/**
 * Checks if a value is JSON-serializable (primitives, arrays, or plain objects).
 * Rejects functions, symbols, and other non-serializable types.
 * @param value - The value to check
 * @returns True if the value is JSON-serializable
 */
const isSerializable = (value: unknown): boolean => {
  if (value === null || value === undefined) {
    return true;
  }

  const type = typeof value;

  if (type === 'string' || type === 'number' || type === 'boolean') {
    return true;
  }

  if (type === 'function' || type === 'symbol' || type === 'bigint') {
    return false;
  }

  if (Array.isArray(value)) {
    return value.every((item) => isSerializable(item));
  }

  if (type === 'object') {
    return Object.values(value as Record<string, unknown>).every((v) => isSerializable(v));
  }

  return false;
};

/**
 * Checks if an object contains only JSON-serializable fields.
 * Accepts any depth of nesting as long as all values are serializable.
 * @param object - The object to check
 * @returns True if the object contains only serializable fields
 */
export const isOnlyPrimitiveFields = (object: Record<string, unknown>): boolean => {
  if (typeof object !== 'object' || object === null) {
    return false;
  }

  return isSerializable(object);
};
