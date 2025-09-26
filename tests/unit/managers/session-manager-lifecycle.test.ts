import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { SessionManager } from '@/managers/session.manager';
import { EventManager } from '@/managers/event.manager';
import { StorageManager } from '@/managers/storage.manager';
import { StateManager } from '@/managers/state.manager';
import { EventType, Config, Mode } from '@/types';
import { DEFAULT_SESSION_TIMEOUT } from '@/constants';

// Mock dependencies
vi.mock('@/utils/logging', () => ({
  debugLog: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock EventManager
const mockEventManager = {
  track: vi.fn(),
  flushImmediatelySync: vi.fn(() => true),
} as unknown as EventManager;

describe('SessionManager - Lifecycle', () => {
  let sessionManager: SessionManager;
  let mockStorage: StorageManager;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    mockStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    } as unknown as StorageManager;

    // Create a temporary StateManager to set up global state
    const tempStateManager = new (class extends StateManager {
      async setConfig(config: Config): Promise<void> {
        await this.set('config', config);
      }
    })();

    await tempStateManager.setConfig({
      excludedUrlPaths: [],
      mode: Mode.QA,
      ipExcluded: false,
      id: 'test-project',
      sessionTimeout: DEFAULT_SESSION_TIMEOUT,
    });

    sessionManager = new SessionManager(mockStorage, mockEventManager);
  });

  afterEach(() => {
    sessionManager.destroy();
    vi.useRealTimers();
  });

  test('should create new session when no stored session exists', async () => {
    mockStorage.getItem = vi.fn(() => null);

    await sessionManager.startTracking();

    expect(mockStorage.setItem).toHaveBeenCalledWith('sessionId', expect.any(String));
    expect(mockStorage.setItem).toHaveBeenCalledWith('lastActivity', expect.any(String));
    expect(mockEventManager.track).toHaveBeenCalledWith({
      type: EventType.SESSION_START,
    });
  });

  test('should recover valid stored session', async () => {
    const storedSessionId = 'stored-session-123';
    const recentTimestamp = (Date.now() - 5000).toString(); // 5 seconds ago

    mockStorage.getItem = vi
      .fn()
      .mockReturnValueOnce(storedSessionId) // sessionId
      .mockReturnValueOnce(recentTimestamp); // lastActivity

    await sessionManager.startTracking();

    expect(mockEventManager.track).toHaveBeenCalledWith({
      type: EventType.SESSION_START,
      session_start_recovered: true,
    });
  });

  test('should not recover expired session', async () => {
    const storedSessionId = 'expired-session-123';
    const expiredTimestamp = (Date.now() - DEFAULT_SESSION_TIMEOUT - 1000).toString(); // Expired

    mockStorage.getItem = vi.fn().mockReturnValueOnce(storedSessionId).mockReturnValueOnce(expiredTimestamp);

    await sessionManager.startTracking();

    // Should create new session, not recover
    expect(mockEventManager.track).toHaveBeenCalledWith({
      type: EventType.SESSION_START,
    });
  });

  test('should end session on timeout', async () => {
    mockStorage.getItem = vi.fn(() => null);

    await sessionManager.startTracking();
    vi.clearAllMocks(); // Clear startTracking events

    // Fast forward past session timeout
    vi.advanceTimersByTime(DEFAULT_SESSION_TIMEOUT + 1000);

    expect(mockEventManager.track).toHaveBeenCalledWith({
      type: EventType.SESSION_END,
      session_end_reason: 'inactivity',
    });
    expect(mockStorage.removeItem).toHaveBeenCalledWith('sessionId');
    expect(mockStorage.removeItem).toHaveBeenCalledWith('lastActivity');
  });

  test('should end session manually', async () => {
    mockStorage.getItem = vi.fn(() => null);

    await sessionManager.startTracking();
    vi.clearAllMocks(); // Clear startTracking events

    await sessionManager.stopTracking();

    expect(mockEventManager.track).toHaveBeenCalledWith({
      type: EventType.SESSION_END,
      session_end_reason: 'manual_stop',
    });
  });

  test('should reset timeout on user activity', async () => {
    mockStorage.getItem = vi.fn(() => null);

    await sessionManager.startTracking();
    vi.clearAllMocks(); // Clear startTracking events

    // Simulate user activity
    const clickEvent = new Event('click');
    document.dispatchEvent(clickEvent);

    // Fast forward but not past the reset timeout
    vi.advanceTimersByTime(DEFAULT_SESSION_TIMEOUT - 1000);

    // Session should not have ended
    expect(mockEventManager.track).not.toHaveBeenCalled();

    // Now advance past the new timeout
    vi.advanceTimersByTime(2000);

    expect(mockEventManager.track).toHaveBeenCalledWith({
      type: EventType.SESSION_END,
      session_end_reason: 'inactivity',
    });
  });

  test('should handle visibility change events', async () => {
    mockStorage.getItem = vi.fn(() => null);

    await sessionManager.startTracking();

    // Mock document.hidden
    Object.defineProperty(document, 'hidden', {
      writable: true,
      value: true,
    });

    // Trigger visibility change
    const visibilityEvent = new Event('visibilitychange');
    document.dispatchEvent(visibilityEvent);

    // Session timeout should be paused when hidden
    vi.advanceTimersByTime(DEFAULT_SESSION_TIMEOUT + 1000);

    // Session should not end while hidden
    expect(mockEventManager.track).not.toHaveBeenCalledWith({
      type: EventType.SESSION_END,
      session_end_reason: 'inactivity',
    });
  });

  test('should flush events on page unload', async () => {
    mockStorage.getItem = vi.fn(() => null);

    await sessionManager.startTracking();

    // Trigger beforeunload
    const beforeUnloadEvent = new Event('beforeunload');
    window.dispatchEvent(beforeUnloadEvent);

    expect(mockEventManager.flushImmediatelySync).toHaveBeenCalled();
  });

  test('should generate unique session IDs', async () => {
    const sessionIds = new Set<string>();

    mockStorage.getItem = vi.fn(() => null);

    // Create multiple sessions and check uniqueness
    for (let i = 0; i < 10; i++) {
      const tempSessionManager = new SessionManager(mockStorage, mockEventManager);
      await tempSessionManager.startTracking();

      const setItemCalls = mockStorage.setItem as any;
      const sessionIdCall = setItemCalls.mock.calls.find((call: any) => call[0] === 'sessionId');

      if (sessionIdCall) {
        sessionIds.add(sessionIdCall[1]);
      }

      tempSessionManager.destroy();
      vi.clearAllMocks();
    }

    expect(sessionIds.size).toBe(10); // All should be unique
  });

  test('should clean up resources on destroy', async () => {
    mockStorage.getItem = vi.fn(() => null);

    await sessionManager.startTracking();

    sessionManager.destroy();

    // Advance time, session should not end because it was destroyed
    vi.advanceTimersByTime(DEFAULT_SESSION_TIMEOUT + 1000);

    expect(mockEventManager.track).not.toHaveBeenCalledWith({
      type: EventType.SESSION_END,
      session_end_reason: 'inactivity',
    });
  });
});
