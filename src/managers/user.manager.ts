import { USER_ID_KEY } from '../constants';
import { generateUUID } from '../utils';
import { StorageManager } from './storage.manager';

/**
 * Simple utility for managing unique user identification for analytics tracking.
 *
 * **Purpose**: Creates and persists RFC4122-compliant UUID v4 identifiers
 * for tracking users across browser sessions.
 *
 * **Core Functionality**:
 * - **User ID Generation**: Creates UUID v4 identifiers
 * - **Persistence**: Stores user IDs in localStorage with automatic fallback
 * - **Session Continuity**: Reuses existing user IDs across browser sessions
 * - **Global User Identity**: Single user ID shared across all TraceLog projects in the same browser
 *
 * **Key Features**:
 * - Static utility method pattern (no object instantiation required)
 * - UUID v4 generation for globally unique identifiers
 * - Fixed storage key (`tlog:uid`) for consistent identification across projects
 * - Automatic fallback to memory storage when localStorage unavailable
 * - Minimal dependencies and zero allocation approach
 *
 * **Storage**: `tlog:uid` (fixed, not project-scoped)
 *
 * @see src/managers/README.md (lines 227-252) for detailed documentation
 *
 * @example
 * ```typescript
 * const userId = UserManager.getId(storageManager);
 * // Returns: '550e8400-e29b-41d4-a716-446655440000' (UUID v4)
 *
 * // Subsequent calls return the same ID
 * const sameUserId = UserManager.getId(storageManager);
 * // Returns: '550e8400-e29b-41d4-a716-446655440000' (persisted)
 * ```
 */
export class UserManager {
  /**
   * Gets or creates a unique user ID.
   *
   * **Behavior**:
   * 1. Checks localStorage for existing user ID
   * 2. Returns existing ID if found
   * 3. Generates new RFC4122-compliant UUID v4 if not found
   * 4. Persists new ID to localStorage
   *
   * **Storage Key**: `tlog:uid` (fixed, shared across all TraceLog projects)
   *
   * **ID Format**: UUID v4 (e.g., `550e8400-e29b-41d4-a716-446655440000`)
   *
   * @param storageManager - Storage manager instance for persistence
   * @returns Persistent unique user ID (UUID v4 format)
   */
  static getId(storageManager: StorageManager): string {
    const storageKey = USER_ID_KEY;
    const storedUserId = storageManager.getItem(storageKey);

    if (storedUserId) {
      return storedUserId;
    }

    const newUserId = generateUUID();
    storageManager.setItem(storageKey, newUserId);

    return newUserId;
  }
}
