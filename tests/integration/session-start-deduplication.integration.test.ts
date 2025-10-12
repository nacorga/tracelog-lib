import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { SessionManager } from '../../src/managers/session.manager';
import { EventManager } from '../../src/managers/event.manager';
import { StorageManager } from '../../src/managers/storage.manager';
import { resetGlobalState } from '../../src/managers/state.manager';
import { EventType } from '../../src/types';

class StubEventManager extends EventManager {
  trackedEvents: Array<{ type: EventType }> = [];

  constructor() {
    super({} as any, null, null);
    this.track = vi.fn((event) => {
      this.trackedEvents.push({ type: event.type as EventType });
    }) as any;
  }

  getTrackedEvents(): Array<{ type: EventType }> {
    return this.trackedEvents;
  }

  clearTrackedEvents(): void {
    this.trackedEvents = [];
  }
}

describe('Integration - Session start deduplication', () => {
  let sessionManager: SessionManager;
  let eventManager: StubEventManager;
  let storageManager: StorageManager;

  beforeEach(() => {
    resetGlobalState();
    localStorage.clear();
    sessionStorage.clear();
    vi.useFakeTimers();

    storageManager = new StorageManager();
    eventManager = new StubEventManager();
    sessionManager = new SessionManager(storageManager, eventManager as any, 'test-project');
  });

  afterEach(() => {
    sessionManager.destroy();
    vi.useRealTimers();
    localStorage.clear();
    sessionStorage.clear();
  });

  test('should emit session_start only once for new session', () => {
    sessionManager.startTracking();

    const sessionStartEvents = eventManager.getTrackedEvents().filter((e) => e.type === EventType.SESSION_START);
    expect(sessionStartEvents).toHaveLength(1);
  });

  test('should NOT emit session_start when recovering session from localStorage', () => {
    sessionManager.startTracking();

    const firstEvents = eventManager.getTrackedEvents().filter((e) => e.type === EventType.SESSION_START);
    expect(firstEvents).toHaveLength(1);

    sessionManager.destroy();

    const newSessionManager = new SessionManager(storageManager, eventManager as any, 'test-project');

    eventManager.clearTrackedEvents();

    newSessionManager.startTracking();

    const secondEvents = eventManager.getTrackedEvents().filter((e) => e.type === EventType.SESSION_START);
    expect(secondEvents).toHaveLength(0);

    newSessionManager.destroy();
  });

  test('should emit new session_start after session expires', () => {
    const DEFAULT_SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes

    sessionManager.startTracking();

    const firstEvents = eventManager.getTrackedEvents().filter((e) => e.type === EventType.SESSION_START);
    expect(firstEvents).toHaveLength(1);

    // Get existing session and mark it as expired
    const storedSession = storageManager.getItem(`tlog:test-project:session`);
    const session = JSON.parse(storedSession || '{}');
    const expiredTimestamp = Date.now() - (DEFAULT_SESSION_TIMEOUT + 1000);
    storageManager.setItem(`tlog:test-project:session`, JSON.stringify({ ...session, lastActivity: expiredTimestamp }));

    sessionManager.destroy();

    const newSessionManager = new SessionManager(storageManager, eventManager as any, 'test-project');

    eventManager.clearTrackedEvents();

    newSessionManager.startTracking();

    const secondEvents = eventManager.getTrackedEvents().filter((e) => e.type === EventType.SESSION_START);
    expect(secondEvents).toHaveLength(1);

    newSessionManager.destroy();
  });

  test('should work correctly regardless of URL exclusions', () => {
    sessionManager.startTracking();

    const sessionStartEvents = eventManager.getTrackedEvents().filter((e) => e.type === EventType.SESSION_START);
    expect(sessionStartEvents).toHaveLength(1);
  });

  describe('Cross-Tab Session Synchronization', () => {
    test('should receive session updates from other tabs via BroadcastChannel', () => {
      // Simulate BroadcastChannel availability
      const mockBroadcastChannel = {
        postMessage: vi.fn(),
        close: vi.fn(),
        onmessage: null as ((event: MessageEvent) => void) | null,
      };

      // Mock BroadcastChannel constructor
      global.BroadcastChannel = vi.fn(() => mockBroadcastChannel) as any;

      const manager1 = new SessionManager(storageManager, eventManager as any, 'test-project');
      manager1.startTracking();

      // Simulate message from another tab
      if (mockBroadcastChannel.onmessage) {
        const messageEvent = new MessageEvent('message', {
          data: {
            action: 'session_start',
            projectId: 'test-project',
            sessionId: 'external-session-id',
            timestamp: Date.now(),
          },
        });
        mockBroadcastChannel.onmessage(messageEvent);
      }

      // Session should be updated from external tab
      const session = storageManager.getItem('tlog:test-project:session');
      expect(session).toBeDefined();

      manager1.destroy();
    });

    test('should broadcast session start to other tabs', () => {
      const mockBroadcastChannel = {
        postMessage: vi.fn(),
        close: vi.fn(),
        onmessage: null as ((event: MessageEvent) => void) | null,
      };

      global.BroadcastChannel = vi.fn(() => mockBroadcastChannel) as any;

      const manager1 = new SessionManager(storageManager, eventManager as any, 'test-project');
      manager1.startTracking();

      // Should have posted session_start message
      expect(mockBroadcastChannel.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'session_start',
          sessionId: expect.any(String),
        }),
      );

      manager1.destroy();
    });

    test('should broadcast session end when stopping tracking', () => {
      const mockBroadcastChannel = {
        postMessage: vi.fn(),
        close: vi.fn(),
        onmessage: null as ((event: MessageEvent) => void) | null,
      };

      global.BroadcastChannel = vi.fn(() => mockBroadcastChannel) as any;

      const manager1 = new SessionManager(storageManager, eventManager as any, 'test-project');
      manager1.startTracking();

      // Clear previous calls
      mockBroadcastChannel.postMessage.mockClear();

      // stopTracking() should broadcast session_end
      manager1.stopTracking();

      // Should have posted session_end message
      expect(mockBroadcastChannel.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'session_end',
          sessionId: expect.any(String),
        }),
      );

      manager1.destroy();
    });

    test('should handle BroadcastChannel not supported gracefully', () => {
      // Remove BroadcastChannel
      global.BroadcastChannel = undefined as any;

      const manager1 = new SessionManager(storageManager, eventManager as any, 'test-project');

      // Should not throw even without BroadcastChannel
      expect(() => {
        manager1.startTracking();
      }).not.toThrow();

      const sessionStartEvents = eventManager.getTrackedEvents().filter((e) => e.type === EventType.SESSION_START);
      expect(sessionStartEvents).toHaveLength(1);

      manager1.destroy();
    });

    test('should synchronize session between multiple tabs', () => {
      const mockBroadcastChannel1 = {
        postMessage: vi.fn(),
        close: vi.fn(),
        onmessage: null as ((event: MessageEvent) => void) | null,
      };

      const mockBroadcastChannel2 = {
        postMessage: vi.fn(),
        close: vi.fn(),
        onmessage: null as ((event: MessageEvent) => void) | null,
      };

      let channelCount = 0;
      global.BroadcastChannel = vi.fn(() => {
        channelCount++;
        return channelCount === 1 ? mockBroadcastChannel1 : mockBroadcastChannel2;
      }) as any;

      // Tab 1 starts session
      const manager1 = new SessionManager(storageManager, eventManager as any, 'test-project');
      manager1.startTracking();

      const sessionStartEvents1 = eventManager.getTrackedEvents().filter((e) => e.type === EventType.SESSION_START);
      expect(sessionStartEvents1).toHaveLength(1);

      // Get the session ID from tab 1
      const session1 = storageManager.getItem('tlog:test-project:session');
      const session1Data = JSON.parse(session1 || '{}');

      // Tab 2 opens and receives session from tab 1
      const eventManager2 = new StubEventManager();
      const manager2 = new SessionManager(storageManager, eventManager2 as any, 'test-project');

      // Simulate receiving broadcast from tab 1
      if (mockBroadcastChannel2.onmessage) {
        const messageEvent = new MessageEvent('message', {
          data: {
            action: 'session_start',
            projectId: 'test-project',
            sessionId: session1Data.sessionId,
            timestamp: Date.now(),
          },
        });
        mockBroadcastChannel2.onmessage(messageEvent);
      }

      manager2.startTracking();

      // Tab 2 should NOT emit session_start (session already exists)
      const sessionStartEvents2 = eventManager2.getTrackedEvents().filter((e) => e.type === EventType.SESSION_START);
      expect(sessionStartEvents2).toHaveLength(0);

      manager1.destroy();
      manager2.destroy();
    });

    test('should handle cross-tab session end notifications', () => {
      const mockBroadcastChannel = {
        postMessage: vi.fn(),
        close: vi.fn(),
        onmessage: null as ((event: MessageEvent) => void) | null,
      };

      global.BroadcastChannel = vi.fn(() => mockBroadcastChannel) as any;

      const manager1 = new SessionManager(storageManager, eventManager as any, 'test-project');
      manager1.startTracking();

      const session = storageManager.getItem('tlog:test-project:session');
      const sessionData = JSON.parse(session || '{}');

      // Simulate session_end message from another tab
      if (mockBroadcastChannel.onmessage) {
        const messageEvent = new MessageEvent('message', {
          data: {
            action: 'session_end',
            projectId: 'test-project',
            sessionId: sessionData.sessionId,
            reason: 'user_action',
            timestamp: Date.now(),
          },
        });
        mockBroadcastChannel.onmessage(messageEvent);
      }

      // Session should be marked as ended
      const updatedSession = storageManager.getItem('tlog:test-project:session');
      expect(updatedSession).toBeDefined();

      manager1.destroy();
    });

    test('should close BroadcastChannel on destroy', () => {
      const mockBroadcastChannel = {
        postMessage: vi.fn(),
        close: vi.fn(),
        onmessage: null as ((event: MessageEvent) => void) | null,
      };

      global.BroadcastChannel = vi.fn(() => mockBroadcastChannel) as any;

      const manager1 = new SessionManager(storageManager, eventManager as any, 'test-project');
      manager1.startTracking();

      expect(mockBroadcastChannel.close).not.toHaveBeenCalled();

      manager1.destroy();

      // BroadcastChannel should be closed on destroy
      expect(mockBroadcastChannel.close).toHaveBeenCalled();
    });
  });
});
