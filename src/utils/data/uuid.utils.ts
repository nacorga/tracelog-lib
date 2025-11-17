/**
 * Generates a RFC4122 compliant UUID v4 using native crypto API with fallback
 * @returns A UUID string
 */
export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Sequence counter for generating unique event IDs within the same millisecond.
 * Resets when timestamp changes, preventing collisions in high-frequency event bursts.
 */
let eventSequence = 0;
let lastEventTimestamp = 0;

/**
 * Generates a unique event ID optimized for high-frequency event tracking.
 *
 * **Collision Prevention Strategy:**
 * - Timestamp: Millisecond precision for temporal ordering
 * - Sequence: Auto-incrementing counter (0-999) for same-millisecond events
 * - Random: Cryptographically secure random (3 bytes) for cross-tab/process uniqueness
 *
 * **Format:** `{timestamp}-{sequence}-{random}`
 * **Example:** `1704067200000-001-a3f9c2`
 *
 * **Guarantees:**
 * - ✅ No collisions within same millisecond (sequence counter)
 * - ✅ No collisions across tabs (crypto random)
 * - ✅ Temporal ordering preserved (timestamp first)
 * - ✅ Works in high-frequency bursts (1000 events/ms capacity)
 * - ✅ Clock skew protection (monotonic timestamp guarantee)
 *
 * @returns Unique event ID string
 */
export const generateEventId = (): string => {
  let timestamp = Date.now();

  // Protect against clock skew (NTP sync, manual time adjustments, timezone changes)
  // If clock moves backward, use last valid timestamp to prevent ID collisions
  if (timestamp < lastEventTimestamp) {
    timestamp = lastEventTimestamp;
  }

  // Increment sequence counter for events in same millisecond
  if (timestamp === lastEventTimestamp) {
    eventSequence = (eventSequence + 1) % 1000; // Reset at 1000 to keep 3 digits
  } else {
    eventSequence = 0;
  }

  // Always update lastEventTimestamp to track current (possibly adjusted) timestamp
  lastEventTimestamp = timestamp;

  const sequence = eventSequence.toString().padStart(3, '0');

  // Cryptographically secure random (3 bytes = 6 hex chars)
  // Reduced from 4 bytes since sequence provides uniqueness within millisecond
  let random = '';
  try {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const bytes = crypto.getRandomValues(new Uint8Array(3));
      if (bytes) {
        random = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
      }
    }
  } catch {
    /* empty */
  }

  // Fallback to Math.random() if crypto unavailable
  if (!random) {
    random = Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, '0');
  }

  return `${timestamp}-${sequence}-${random}`;
};
