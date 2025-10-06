/**
 * Generates a RFC4122 compliant UUID v4 using native crypto API with fallback
 * @returns A UUID string
 */
export const generateUUID = (): string => {
  // Use native crypto.randomUUID() if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Generates a unique event ID optimized for high-frequency event tracking
 *
 * Uses a simple hybrid approach:
 * - Timestamp for temporal ordering
 * - Random component for uniqueness across tabs/processes
 *
 * Format: {timestamp}-{random}
 * Example: "1704067200000-a3f9c2b1"
 *
 * @returns Unique event ID string
 */
export const generateEventId = (): string => {
  const timestamp = Date.now();

  // Generate 8 random hex chars (32 bits entropy)
  let random = '';
  try {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const bytes = crypto.getRandomValues(new Uint8Array(4));
      if (bytes) {
        random = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
      }
    }
  } catch {
    // crypto failed, use fallback
  }

  // Fallback to Math.random if crypto unavailable
  if (!random) {
    random = Math.floor(Math.random() * 0xffffffff)
      .toString(16)
      .padStart(8, '0');
  }

  return `${timestamp}-${random}`;
};
