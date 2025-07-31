import { EventData, EventType, ScrollDirection } from '../../types/event.types';
import { MetadataType } from '../../types/common.types';
import { Queue } from '../../types/queue.types';

/**
 * Type guard utilities for runtime type checking
 */

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

/**
 * Type guard to check if a value is a valid MetadataType
 * @param value - Value to check
 * @returns True if the value is a valid MetadataType
 */
export const isMetadataType = (value: unknown): value is MetadataType => {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every((item) => typeof item === 'string');
  }

  return false;
};

/**
 * Type guard to check if a value is a valid metadata record
 * @param value - Value to check
 * @returns True if the value is a valid metadata record
 */
export const isValidMetadataRecord = (value: unknown): value is Record<string, MetadataType> => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const object = value as Record<string, unknown>;
  return Object.values(object).every((value_) => isMetadataType(value_));
};

/**
 * Type guard to check if a value is a valid EventType
 * @param value - Value to check
 * @returns True if the value is a valid EventType
 */
export const isEventType = (value: unknown): value is EventType => {
  return typeof value === 'string' && Object.values(EventType).includes(value as EventType);
};

/**
 * Type guard to check if a value is a valid ScrollDirection
 * @param value - Value to check
 * @returns True if the value is a valid ScrollDirection
 */
export const isScrollDirection = (value: unknown): value is ScrollDirection => {
  return typeof value === 'string' && Object.values(ScrollDirection).includes(value as ScrollDirection);
};

/**
 * Type guard to check if a value is a valid TraceLog event
 * @param value - Value to check
 * @returns True if the value is a valid TraceLog event
 */
export const isTracelogEvent = (value: unknown): value is EventData => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const event = value as Record<string, unknown>;

  if (!isEventType(event.type)) {
    return false;
  }

  if (typeof event.page_url !== 'string') {
    return false;
  }

  if (typeof event.timestamp !== 'number') {
    return false;
  }

  if (event.referrer !== undefined && typeof event.referrer !== 'string') {
    return false;
  }

  if (event.from_page_url !== undefined && typeof event.from_page_url !== 'string') {
    return false;
  }

  if (event.scroll_data !== undefined) {
    const scrollData = event.scroll_data as Record<string, unknown>;

    if (typeof scrollData.depth !== 'number' || !isScrollDirection(scrollData.direction)) {
      return false;
    }
  }

  if (event.click_data !== undefined) {
    const clickData = event.click_data as Record<string, unknown>;

    if (
      typeof clickData.x !== 'number' ||
      typeof clickData.y !== 'number' ||
      typeof clickData.relativeX !== 'number' ||
      typeof clickData.relativeY !== 'number'
    ) {
      return false;
    }
  }

  if (event.custom_event !== undefined) {
    const customEvent = event.custom_event as Record<string, unknown>;

    if (typeof customEvent.name !== 'string') {
      return false;
    }

    if (customEvent.metadata !== undefined && !isValidMetadataRecord(customEvent.metadata)) {
      return false;
    }
  }

  return true;
};

/**
 * Type guard to check if a value is a valid TraceLog queue
 * @param value - Value to check
 * @returns True if the value is a valid TraceLog queue
 */
export const isTracelogQueue = (value: unknown): value is Queue => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const queue = value as Record<string, unknown>;

  if (typeof queue.user_id !== 'string' || typeof queue.session_id !== 'string' || typeof queue.device !== 'string') {
    return false;
  }

  if (!Array.isArray(queue.events)) {
    return false;
  }

  if (!queue.events.every((event) => isTracelogEvent(event))) {
    return false;
  }

  if (queue.global_metadata !== undefined && typeof queue.global_metadata !== 'object') {
    return false;
  }

  return true;
};
