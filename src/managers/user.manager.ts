import { USER_ID_KEY } from '../constants';
import { generateUUID } from '../utils';
import { StorageManager } from './storage.manager';

/**
 * Simple utility for managing user identification.
 * Generates and persists unique user IDs per project.
 */
export class UserManager {
  /**
   * Gets or creates a unique user ID for the given project.
   * The user ID is persisted in localStorage and reused across sessions.
   *
   * @param storageManager - Storage manager instance
   * @param projectId - Project identifier for namespacing
   * @returns Persistent unique user ID
   */
  static getId(storageManager: StorageManager, projectId?: string): string {
    const storageKey = USER_ID_KEY(projectId ?? '');
    const storedUserId = storageManager.getItem(storageKey);

    if (storedUserId) {
      return storedUserId;
    }

    const newUserId = generateUUID();
    storageManager.setItem(storageKey, newUserId);

    return newUserId;
  }
}
