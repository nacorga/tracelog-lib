/**
 * Checks if a value is JSON-serializable (primitives, arrays, or plain objects).
 * Rejects functions, symbols, circular references, and other non-serializable types.
 * @param value - The value to check
 * @param seen - Set of visited objects to detect circular references
 * @returns True if the value is JSON-serializable
 */
const isSerializable = (value: unknown, seen: Set<unknown> = new Set()): boolean => {
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

  // Circular reference check for complex types
  if (seen.has(value)) {
    return false;
  }
  seen.add(value);

  if (Array.isArray(value)) {
    return value.every((item) => isSerializable(item, seen));
  }

  if (type === 'object') {
    return Object.values(value as Record<string, unknown>).every((v) => isSerializable(v, seen));
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

/**
 * Extracts a plain Record<string, string> from an untrusted traits value.
 * Rejects arrays and non-string values (TS types erased at runtime).
 * @returns Sanitized traits or undefined if empty/invalid
 */
export const sanitizeTraits = (traits: unknown): Record<string, string> | undefined => {
  if (typeof traits !== 'object' || traits === null || Array.isArray(traits)) return undefined;

  const filtered: Record<string, string> = {};
  for (const [key, value] of Object.entries(traits as Record<string, unknown>)) {
    if (typeof value === 'string') filtered[key] = value;
  }

  return Object.keys(filtered).length > 0 ? filtered : undefined;
};
