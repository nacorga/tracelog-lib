import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserManager } from '@/managers/user.manager';
import { StorageManager } from '@/managers/storage.manager';
import { USER_ID_KEY } from '@/constants';

describe('UserManager', () => {
  let storageManager: StorageManager;

  beforeEach(() => {
    localStorage.clear();
    storageManager = new StorageManager();
    vi.clearAllMocks();
  });

  describe('getId', () => {
    it('should generate new UUID when no stored userId exists', () => {
      const userId = UserManager.getId(storageManager);

      expect(userId).toBeDefined();
      expect(typeof userId).toBe('string');
      expect(userId.length).toBeGreaterThan(0);
    });

    it('should return existing userId from storage', () => {
      const existingUserId = 'existing-user-123';
      storageManager.setItem(USER_ID_KEY, existingUserId);

      const userId = UserManager.getId(storageManager);

      expect(userId).toBe(existingUserId);
    });

    it('should persist generated userId to storage', () => {
      const userId = UserManager.getId(storageManager);

      const storedUserId = storageManager.getItem(USER_ID_KEY);
      expect(storedUserId).toBe(userId);
    });

    it('should return same userId on multiple calls', () => {
      const userId1 = UserManager.getId(storageManager);
      const userId2 = UserManager.getId(storageManager);
      const userId3 = UserManager.getId(storageManager);

      expect(userId1).toBe(userId2);
      expect(userId2).toBe(userId3);
    });

    it('should generate UUID in valid format', () => {
      const userId = UserManager.getId(storageManager);

      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(userId).toMatch(uuidRegex);
    });

    it('should handle empty string in storage by generating new UUID', () => {
      storageManager.setItem(USER_ID_KEY, '');

      const userId = UserManager.getId(storageManager);

      // Empty string is falsy, should generate new UUID
      expect(userId).toBeDefined();
      expect(userId.length).toBeGreaterThan(0);
    });
  });
});
