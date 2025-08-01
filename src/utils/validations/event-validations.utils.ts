import { MetadataType } from '../../types/common.types';
import { isValidEventName, isValidMetadata } from './metadata-validations.utils';

/**
 * Event validation utilities
 */

/**
 * Validates a complete event with name and optional metadata
 * @param eventName - The event name to validate
 * @param metadata - Optional metadata to validate
 * @returns Validation result with sanitized metadata if valid
 */
export const isEventValid = (
  eventName: string,
  metadata?: Record<string, unknown>,
): { valid: boolean; error?: string; sanitizedMetadata?: Record<string, MetadataType> } => {
  const nameValidation = isValidEventName(eventName);

  if (!nameValidation.valid) {
    return nameValidation;
  }

  if (!metadata) {
    return { valid: true };
  }

  return isValidMetadata(eventName, metadata, 'customEvent');
};
