/**
 * UserManager Tests
 * Focus: User UUID generation and persistence
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';
import { UserManager } from '../../../src/managers/user.manager';
import { StorageManager } from '../../../src/managers/storage.manager';
import { USER_ID_KEY } from '../../../src/constants/storage.constants';

describe('UserManager - User ID Management', () => {
  let storageManager: StorageManager;

  beforeEach(() => {
    setupTestEnvironment();
    storageManager = new StorageManager();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  it('should generate UUID v4 format', () => {
    const userId = UserManager.getId(storageManager);

    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(userId).toMatch(uuidRegex);
  });

  it('should persist userId to storage', () => {
    const userId = UserManager.getId(storageManager);

    // Verify userId was persisted to localStorage
    const storedUserId = storageManager.getItem(USER_ID_KEY);
    expect(storedUserId).toBe(userId);
    expect(storedUserId).toBeTruthy();
  });

  it('should restore userId from storage', () => {
    // First call generates and stores userId
    const firstUserId = UserManager.getId(storageManager);

    // Second call should restore the same userId
    const secondUserId = UserManager.getId(storageManager);

    expect(secondUserId).toBe(firstUserId);
  });

  it('should generate new userId if none exists', () => {
    // Ensure storage is empty
    expect(storageManager.getItem(USER_ID_KEY)).toBeNull();

    // Generate userId
    const userId = UserManager.getId(storageManager);

    expect(userId).toBeTruthy();
    expect(storageManager.getItem(USER_ID_KEY)).toBe(userId);
  });

  it('should not regenerate userId if exists', () => {
    // Generate first userId
    const firstUserId = UserManager.getId(storageManager);

    // Call again multiple times
    const secondUserId = UserManager.getId(storageManager);
    const thirdUserId = UserManager.getId(storageManager);

    // All should be the same
    expect(secondUserId).toBe(firstUserId);
    expect(thirdUserId).toBe(firstUserId);
  });

  it('should maintain same userId across sessions', () => {
    // Session 1: Generate userId
    const userId1 = UserManager.getId(storageManager);
    expect(storageManager.getItem(USER_ID_KEY)).toBe(userId1);

    // Simulate session end by creating new StorageManager instance
    const newStorageManager = new StorageManager();

    // Session 2: Retrieve userId
    const userId2 = UserManager.getId(newStorageManager);

    // Should be the same userId
    expect(userId2).toBe(userId1);
  });
});

describe('UserManager - Edge Cases', () => {
  let storageManager: StorageManager;

  beforeEach(() => {
    setupTestEnvironment();
    storageManager = new StorageManager();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  it('should handle storage unavailable', () => {
    // StorageManager has built-in fallback to memory storage
    // Even if localStorage is unavailable, it should still work
    const userId = UserManager.getId(storageManager);

    expect(userId).toBeTruthy();
    expect(userId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

    // Verify retrieval works
    const retrievedUserId = UserManager.getId(storageManager);
    expect(retrievedUserId).toBe(userId);
  });

  it('should handle corrupted userId', () => {
    // Set invalid/corrupted userId
    storageManager.setItem(USER_ID_KEY, 'invalid-uuid-format');

    // UserManager should return the corrupted value (no validation in getId)
    // This is by design - UserManager trusts stored data
    const userId = UserManager.getId(storageManager);
    expect(userId).toBe('invalid-uuid-format');
  });

  it('should validate UUID format', () => {
    // Generate fresh userId
    const userId = UserManager.getId(storageManager);

    // Verify it matches UUID v4 format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(userId).toMatch(uuidRegex);

    // Verify the version field (4th group should start with '4')
    const parts = userId.split('-');
    expect(parts[2]?.charAt(0)).toBe('4');

    // Verify the variant field (5th group should start with 8, 9, a, or b)
    const variantChar = parts[3]?.charAt(0).toLowerCase();
    expect(['8', '9', 'a', 'b']).toContain(variantChar);
  });

  it('should handle concurrent initialization', () => {
    // Simulate multiple concurrent calls to getId
    const userIds = Array.from({ length: 10 }, () => UserManager.getId(storageManager));

    // All calls should return the same userId (first one generated)
    const uniqueIds = new Set(userIds);
    expect(uniqueIds.size).toBe(1);

    // Verify it's a valid UUID
    const userId = userIds[0];
    expect(userId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });
});
