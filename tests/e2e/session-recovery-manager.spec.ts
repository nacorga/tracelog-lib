import { test, expect } from '@playwright/test';
import { SessionRecoveryManager } from '../../src/managers/session-recovery.manager';
import { StorageManager } from '../../src/managers/storage.manager';
import { SessionContext } from '../../src/types/session.types';

test.describe('SessionRecoveryManager', () => {
  test('returns false when no recovery attempt exists', () => {
    const recoveryManager = new SessionRecoveryManager(new StorageManager(), 'project');

    expect(recoveryManager.hasRecoverableSession()).toBe(false);
  });

  test('returns true when a recovery attempt exists', () => {
    const storageManager = new StorageManager();
    const recoveryManager = new SessionRecoveryManager(storageManager, 'project');

    const now = Date.now();
    const context: SessionContext = {
      sessionId: 'abc',
      startTime: now,
      lastActivity: now,
      tabCount: 1,
      recoveryAttempts: 0,
    };

    recoveryManager.storeSessionContextForRecovery(context);

    expect(recoveryManager.hasRecoverableSession()).toBe(true);
  });
});

