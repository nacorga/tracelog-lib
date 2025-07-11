export const safeParseInt = (value: unknown, defaultValue = 0): number => {
  if (typeof value === 'number') {
    return Math.floor(value);
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? defaultValue : parsed;
  }

  return defaultValue;
};

export const safeParseFloat = (value: unknown, defaultValue = 0): number => {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? defaultValue : parsed;
  }

  return defaultValue;
};

export const safeParseBoolean = (value: unknown, defaultValue = false): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    return lower === 'true' || lower === '1' || lower === 'yes';
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  return defaultValue;
};

export const safeParseArray = <T>(value: unknown, defaultValue: T[] = []): T[] => {
  if (Array.isArray(value)) {
    return value;
  }

  return defaultValue;
};

export const safeParseObject = <T extends Record<string, unknown>>(value: unknown, defaultValue: T): T => {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as T;
  }

  return defaultValue;
};
