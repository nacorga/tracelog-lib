import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isEventValid } from '../../../../src/utils/validations/event-validations.utils';
import * as metadataValidations from '../../../../src/utils/validations/metadata-validations.utils';
import * as loggingUtils from '../../../../src/utils/logging.utils';

describe('event-validations.utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isEventValid', () => {
    describe('event name validation', () => {
      it('should return valid for valid event name with no metadata', () => {
        vi.spyOn(metadataValidations, 'isValidEventName').mockReturnValue({ valid: true });

        const result = isEventValid('purchase');

        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
        expect(result.sanitizedMetadata).toBeUndefined();
      });

      it('should return invalid for invalid event name', () => {
        const logSpy = vi.spyOn(loggingUtils, 'log').mockImplementation(() => {});
        vi.spyOn(metadataValidations, 'isValidEventName').mockReturnValue({
          valid: false,
          error: 'Event name must be a string',
        });

        const result = isEventValid('');

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Event name must be a string');
        expect(logSpy).toHaveBeenCalledWith('error', 'Event name validation failed', {
          showToClient: true,
          data: { eventName: '', error: 'Event name must be a string' },
        });
      });

      it('should log error for invalid event name', () => {
        const logSpy = vi.spyOn(loggingUtils, 'log').mockImplementation(() => {});
        vi.spyOn(metadataValidations, 'isValidEventName').mockReturnValue({
          valid: false,
          error: 'Invalid name format',
        });

        isEventValid('invalid-name');

        expect(logSpy).toHaveBeenCalledTimes(1);
        expect(logSpy).toHaveBeenCalledWith('error', 'Event name validation failed', {
          showToClient: true,
          data: { eventName: 'invalid-name', error: 'Invalid name format' },
        });
      });
    });

    describe('metadata validation', () => {
      it('should return valid for valid event name and valid metadata', () => {
        vi.spyOn(metadataValidations, 'isValidEventName').mockReturnValue({ valid: true });
        vi.spyOn(metadataValidations, 'isValidMetadata').mockReturnValue({
          valid: true,
          sanitizedMetadata: { amount: 99.99 },
        });

        const result = isEventValid('purchase', { amount: 99.99 });

        expect(result.valid).toBe(true);
        expect(result.sanitizedMetadata).toEqual({ amount: 99.99 });
      });

      it('should return invalid for valid event name but invalid metadata', () => {
        const logSpy = vi.spyOn(loggingUtils, 'log').mockImplementation(() => {});
        vi.spyOn(metadataValidations, 'isValidEventName').mockReturnValue({ valid: true });
        vi.spyOn(metadataValidations, 'isValidMetadata').mockReturnValue({
          valid: false,
          error: 'Metadata is too large',
        });

        const result = isEventValid('purchase', { data: 'invalid' });

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Metadata is too large');
        expect(logSpy).toHaveBeenCalledWith('error', 'Event metadata validation failed', {
          showToClient: true,
          data: {
            eventName: 'purchase',
            error: 'Metadata is too large',
          },
        });
      });

      it('should log error for invalid metadata', () => {
        const logSpy = vi.spyOn(loggingUtils, 'log').mockImplementation(() => {});
        vi.spyOn(metadataValidations, 'isValidEventName').mockReturnValue({ valid: true });
        vi.spyOn(metadataValidations, 'isValidMetadata').mockReturnValue({
          valid: false,
          error: 'Invalid metadata structure',
        });

        isEventValid('purchase', { invalid: 'data' });

        expect(logSpy).toHaveBeenCalledWith('error', 'Event metadata validation failed', {
          showToClient: true,
          data: {
            eventName: 'purchase',
            error: 'Invalid metadata structure',
          },
        });
      });

      it('should handle array metadata', () => {
        vi.spyOn(metadataValidations, 'isValidEventName').mockReturnValue({ valid: true });
        vi.spyOn(metadataValidations, 'isValidMetadata').mockReturnValue({
          valid: true,
          sanitizedMetadata: [{ id: '1' }, { id: '2' }],
        });

        const result = isEventValid('batch_event', [{ id: '1' }, { id: '2' }]);

        expect(result.valid).toBe(true);
        expect(result.sanitizedMetadata).toEqual([{ id: '1' }, { id: '2' }]);
      });

      it('should not validate metadata if not provided', () => {
        const isValidMetadataSpy = vi.spyOn(metadataValidations, 'isValidMetadata');
        vi.spyOn(metadataValidations, 'isValidEventName').mockReturnValue({ valid: true });

        const result = isEventValid('simple_event');

        expect(result.valid).toBe(true);
        expect(isValidMetadataSpy).not.toHaveBeenCalled();
      });

      it('should pass correct parameters to isValidMetadata', () => {
        const isValidMetadataSpy = vi.spyOn(metadataValidations, 'isValidMetadata').mockReturnValue({
          valid: true,
          sanitizedMetadata: { test: true },
        });
        vi.spyOn(metadataValidations, 'isValidEventName').mockReturnValue({ valid: true });

        const metadata = { test: true };
        isEventValid('custom_event', metadata);

        expect(isValidMetadataSpy).toHaveBeenCalledWith('custom_event', metadata, 'customEvent');
      });
    });

    describe('error scenarios', () => {
      it('should return early if event name is invalid without checking metadata', () => {
        const isValidMetadataSpy = vi.spyOn(metadataValidations, 'isValidMetadata');
        vi.spyOn(metadataValidations, 'isValidEventName').mockReturnValue({
          valid: false,
          error: 'Invalid name',
        });

        const result = isEventValid('', { data: 'test' });

        expect(result.valid).toBe(false);
        expect(isValidMetadataSpy).not.toHaveBeenCalled();
      });

      it('should preserve error from event name validation', () => {
        vi.spyOn(metadataValidations, 'isValidEventName').mockReturnValue({
          valid: false,
          error: 'Event name must be a string',
        });

        const result = isEventValid('');

        expect(result.error).toBe('Event name must be a string');
      });

      it('should preserve error from metadata validation', () => {
        vi.spyOn(metadataValidations, 'isValidEventName').mockReturnValue({ valid: true });
        vi.spyOn(metadataValidations, 'isValidMetadata').mockReturnValue({
          valid: false,
          error: 'Metadata contains invalid field',
        });

        const result = isEventValid('event', { bad: 'data' });

        expect(result.error).toBe('Metadata contains invalid field');
      });
    });
  });
});
