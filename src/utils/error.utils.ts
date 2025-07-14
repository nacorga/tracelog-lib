import { ValidationError } from '../types';

export const validateRequired = <T>(value: T, fieldName: string): NonNullable<T> => {
  if (value === null || value === undefined) {
    throw new ValidationError(`${fieldName} is required`, fieldName, value);
  }

  return value as NonNullable<T>;
};

export const validateString = (value: unknown, fieldName: string): string => {
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`, fieldName, value);
  }

  return value;
};

export const validateNumber = (value: unknown, fieldName: string): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new ValidationError(`${fieldName} must be a valid number`, fieldName, value);
  }

  return value;
};

export const validateBoolean = (value: unknown, fieldName: string): boolean => {
  if (typeof value !== 'boolean') {
    throw new ValidationError(`${fieldName} must be a boolean`, fieldName, value);
  }

  return value;
};

export const validateArray = <T>(value: unknown, fieldName: string, itemValidator?: (item: unknown) => T): T[] => {
  if (!Array.isArray(value)) {
    throw new ValidationError(`${fieldName} must be an array`, fieldName, value);
  }

  if (itemValidator) {
    return value.map((item, index) => {
      try {
        return itemValidator(item);
      } catch {
        throw new ValidationError(`${fieldName}[${index}] is invalid`, `${fieldName}[${index}]`, item);
      }
    });
  }

  return value as T[];
};

export const validateObject = <T>(value: unknown, fieldName: string, validator: (object: unknown) => T): T => {
  if (typeof value !== 'object' || value === null) {
    throw new ValidationError(`${fieldName} must be an object`, fieldName, value);
  }

  return validator(value);
};
