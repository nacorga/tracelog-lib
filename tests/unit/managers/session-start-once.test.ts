import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { SessionManager } from '../../../src/managers/session.manager';
import { EventManager } from '../../../src/managers/event.manager';
import { EventType } from '../../../src/types';
import { setupTestEnvironment, cleanupTestState } from '../../utils/test-setup';
import { DEFAULT_SESSION_TIMEOUT } from '../../../src/constants';

vi.mock('../../../src/utils/logging', () => ({
  debugLog: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('SessionManager - Single session_start per session', () => {
  let sessionManager: SessionManager;
  let mockEventManager: EventManager;
  let mockStorage: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    const testEnv = await setupTestEnvironment({ sessionTimeout: DEFAULT_SESSION_TIMEOUT });
    sessionManager = testEnv.sessionManager;
    mockEventManager = testEnv.eventManager;
    mockStorage = testEnv.storageManager;

    vi.spyOn(mockEventManager, 'track');
    vi.spyOn(mockEventManager, 'flushImmediatelySync').mockReturnValue(true);
  });

  afterEach(() => {
    sessionManager.destroy();
    vi.useRealTimers();
    cleanupTestState();
  });

  test('should emit session_start only once for new session', async () => {
    mockStorage.getSessionItem = vi.fn(() => null);

    await sessionManager.startTracking();

    expect(mockEventManager.track).toHaveBeenCalledTimes(1);
    expect(mockEventManager.track).toHaveBeenCalledWith({
      type: EventType.SESSION_START,
    });
  });

  test('should NOT emit session_start when recovering existing session', async () => {
    const storedSessionData = JSON.stringify({
      id: 'recovered-session-123',
      lastActivity: Date.now() - 5000,
    });

    mockStorage.getSessionItem = vi.fn().mockReturnValueOnce(storedSessionData);

    await sessionManager.startTracking();

    expect(mockEventManager.track).not.toHaveBeenCalled();
  });

  test('should emit session_start for expired session', async () => {
    const expiredSessionData = JSON.stringify({
      id: 'expired-session',
      lastActivity: Date.now() - DEFAULT_SESSION_TIMEOUT - 1000,
    });

    mockStorage.getSessionItem = vi.fn().mockReturnValueOnce(expiredSessionData);

    await sessionManager.startTracking();

    expect(mockEventManager.track).toHaveBeenCalledTimes(1);
    expect(mockEventManager.track).toHaveBeenCalledWith({
      type: EventType.SESSION_START,
    });
  });
});
