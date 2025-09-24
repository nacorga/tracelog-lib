import { debugLog } from '../logging';

/**
 * Generates a RFC4122 compliant UUID v4
 * @returns A UUID string
 */
export const generateUUID = (): string => {
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;

    return v.toString(16);
  });

  debugLog.verbose('UUIDUtils', 'Generated new UUID', { uuid });
  return uuid;
};
