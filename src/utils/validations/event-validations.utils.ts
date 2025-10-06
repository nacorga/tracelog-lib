import { MetadataType } from '../../types';
import { log } from '../logging.utils';
import { isValidEventName, isValidMetadata } from './metadata-validations.utils';

/**
 * Validates a complete event with name and optional metadata
 * @param eventName - The event name to validate
 * @param metadata - Optional metadata to validate
 * @returns Validation result with sanitized metadata if valid
 */
export const isEventValid = (
  eventName: string,
  metadata?: Record<string, unknown> | Record<string, unknown>[],
): {
  valid: boolean;
  error?: string;
  sanitizedMetadata?: Record<string, MetadataType> | Record<string, MetadataType>[];
} => {
  const nameValidation = isValidEventName(eventName);

  if (!nameValidation.valid) {
    log('error', 'Event name validation failed', {
      showToClient: true,
      data: { eventName, error: nameValidation.error },
    });

    return nameValidation;
  }

  if (!metadata) {
    return { valid: true };
  }

  const metadataValidation = isValidMetadata(eventName, metadata, 'customEvent');

  if (!metadataValidation.valid) {
    log('error', 'Event metadata validation failed', {
      showToClient: true,
      data: {
        eventName,
        error: metadataValidation.error,
      },
    });
  }

  return metadataValidation;
};
