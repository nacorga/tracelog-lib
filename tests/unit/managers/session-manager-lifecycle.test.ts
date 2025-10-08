import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { SessionManager } from '../../../src/managers/session.manager';
import { EventManager } from '../../../src/managers/event.manager';
import { EventType } from '../../../src/types';
import { DEFAULT_SESSION_TIMEOUT } from '../../../src/constants';
import { setupTestEnvironment, cleanupTestState } from '../../utils/test-setup';

// Mock dependencies
vi.mock('../../../src/utils/logging', () => ({
  debugLog: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('SessionManager - Lifecycle', () => {
  let sessionManager: SessionManager;
  let mockEventManager: EventManager;
  let mockStorage: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    const testEnv = setupTestEnvironment({ sessionTimeout: DEFAULT_SESSION_TIMEOUT });
    sessionManager = testEnv.sessionManager;
    mockEventManager = testEnv.eventManager;
    mockStorage = testEnv.storageManager;

    // Mock the track and flushImmediatelySync methods
    vi.spyOn(mockEventManager, 'track');
    vi.spyOn(mockEventManager, 'flushImmediatelySync').mockReturnValue(true);
  });

  afterEach(() => {
    sessionManager.destroy();
    vi.useRealTimers();
    cleanupTestState();
  });

  test('should create new session when no stored session exists', () => {
    mockStorage.getItem = vi.fn(() => null);

    sessionManager.startTracking();

    expect(mockStorage.setItem).toHaveBeenCalledWith('tlog:default:session', expect.any(String));
    expect(mockEventManager.track).toHaveBeenCalledWith({
      type: EventType.SESSION_START,
    });
  });

  test('should recover valid stored session', () => {
    const storedSessionData = JSON.stringify({
      id: 'stored-session-123',
      lastActivity: Date.now() - 5000, // 5 seconds ago
    });

    mockStorage.getItem = vi.fn().mockReturnValueOnce(storedSessionData); // session data

    sessionManager.startTracking();

    expect(mockEventManager.track).not.toHaveBeenCalled();
  });

  test('should not recover expired session', () => {
    const storedSessionData = JSON.stringify({
      id: 'expired-session-123',
      lastActivity: Date.now() - DEFAULT_SESSION_TIMEOUT - 1000, // Expired
    });

    mockStorage.getItem = vi.fn().mockReturnValueOnce(storedSessionData);

    sessionManager.startTracking();

    // Should create new session, not recover
    expect(mockEventManager.track).toHaveBeenCalledWith({
      type: EventType.SESSION_START,
    });
  });

  test('should end session on timeout', () => {
    mockStorage.getItem = vi.fn(() => null);

    sessionManager.startTracking();
    vi.clearAllMocks(); // Clear startTracking events

    // Fast forward past session timeout
    vi.advanceTimersByTime(DEFAULT_SESSION_TIMEOUT + 1000);

    expect(mockEventManager.track).toHaveBeenCalledWith({
      type: EventType.SESSION_END,
      session_end_reason: 'inactivity',
    });
    expect(mockStorage.removeItem).toHaveBeenCalledWith('tlog:default:session');
  });

  test('should end session manually', () => {
    mockStorage.getItem = vi.fn(() => null);

    sessionManager.startTracking();
    vi.clearAllMocks(); // Clear startTracking events

    sessionManager.stopTracking();

    expect(mockEventManager.track).toHaveBeenCalledWith({
      type: EventType.SESSION_END,
      session_end_reason: 'manual_stop',
    });
  });

  test('should handle visibility change events', () => {
    mockStorage.getItem = vi.fn(() => null);

    sessionManager.startTracking();

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

  test('should flush events on page unload', () => {
    mockStorage.getItem = vi.fn(() => null);

    sessionManager.startTracking();

    // Trigger beforeunload
    const beforeUnloadEvent = new Event('beforeunload');
    window.dispatchEvent(beforeUnloadEvent);

    expect(mockEventManager.flushImmediatelySync).toHaveBeenCalled();
  });

  test('should generate unique session IDs', () => {
    const sessionIds = new Set<string>();

    mockStorage.getItem = vi.fn(() => null);

    // Create multiple sessions and check uniqueness
    for (let i = 0; i < 10; i++) {
      const tempSessionManager = new SessionManager(mockStorage, mockEventManager, 'test-project');
      tempSessionManager.startTracking();

      const setItemCalls = mockStorage.setItem;
      const sessionIdCall = setItemCalls.mock.calls.find((call: any) => call[0] === 'tlog:test-project:session');

      if (sessionIdCall) {
        const sessionData = JSON.parse(sessionIdCall[1]);
        sessionIds.add(sessionData.id);
      }

      tempSessionManager.destroy();
      mockStorage.setItem.mockClear(); // Clear only setItem, not the history
    }

    expect(sessionIds.size).toBe(10); // All should be unique
  });

  test('should clean up resources on destroy', () => {
    mockStorage.getItem = vi.fn(() => null);

    sessionManager.startTracking();

    sessionManager.destroy();

    // Advance time, session should not end because it was destroyed
    vi.advanceTimersByTime(DEFAULT_SESSION_TIMEOUT + 1000);

    expect(mockEventManager.track).not.toHaveBeenCalledWith({
      type: EventType.SESSION_END,
      session_end_reason: 'inactivity',
    });
  });
});
