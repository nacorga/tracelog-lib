/**
 * Session Lifecycle Integration Tests
 *
 * Tests complete session management flow to detect library defects:
 * - Session start triggers session_start event
 * - Session recovery doesn't trigger duplicate session_start
 * - Session end triggers session_end with correct reason
 * - Storage is properly managed during lifecycle
 * - Session data flows correctly to events
 *
 * Focus: Detect session coordination defects between components
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SessionManager } from '../../src/managers/session.manager';
import { EventManager } from '../../src/managers/event.manager';
import { StorageManager } from '../../src/managers/storage.manager';
import { EventType } from '../../src/types';
import { setupTestState, createTestConfig } from '../utils/test-setup';

describe('Session Lifecycle Integration', () => {
  let sessionManager: SessionManager;
  let eventManager: EventManager;
  let storageManager: StorageManager;

  beforeEach(async () => {
    vi.clearAllMocks();
    await setupTestState(
      createTestConfig({
        id: 'test-project',
        sessionTimeout: 15 * 60 * 1000,
        samplingRate: 1,
      }),
    );
    storageManager = new StorageManager();
    eventManager = new EventManager(storageManager);
    sessionManager = new SessionManager(storageManager, eventManager, 'test-project');
  });

  afterEach(() => {
    sessionManager.destroy();
    eventManager.stop();
    vi.restoreAllMocks();
  });

  describe('New Session Flow', () => {
    it('should track session_start for new session', async () => {
      const trackSpy = vi.spyOn(eventManager, 'track');

      await sessionManager.startTracking();

      // Verify session_start was tracked
      expect(trackSpy).toHaveBeenCalledWith({
        type: EventType.SESSION_START,
      });
    });

    it('should generate and set session ID before tracking start', async () => {
      await sessionManager.startTracking();

      const sessionId = sessionManager['get']('sessionId');

      // Session ID should be set
      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(sessionId).not.toBe('');
    });

    it('should persist session immediately on start', async () => {
      await sessionManager.startTracking();

      const sessionId = sessionManager['get']('sessionId');
      const storageKey = sessionManager['getSessionStorageKey']();
      const stored = storageManager.getItem(storageKey);

      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed.id).toBe(sessionId);
      expect(parsed.lastActivity).toBeDefined();
    });

    it('should set up session timeout on start', async () => {
      vi.useFakeTimers();

      await sessionManager.startTracking();

      // Timeout should be set
      expect(sessionManager['sessionTimeoutId']).not.toBeNull();

      vi.useRealTimers();
    });
  });

  describe('Recovered Session Flow', () => {
    it('should NOT track session_start for recovered session', async () => {
      // Persist valid session
      const validSessionId = 'recovered-session-123';
      sessionManager['saveStoredSession']({
        id: validSessionId,
        lastActivity: Date.now(),
      });

      const trackSpy = vi.spyOn(eventManager, 'track');

      await sessionManager.startTracking();

      // Should NOT track session_start
      expect(trackSpy).not.toHaveBeenCalledWith({
        type: EventType.SESSION_START,
      });
    });

    it('should use recovered session ID', async () => {
      const validSessionId = 'recovered-session-456';
      sessionManager['saveStoredSession']({
        id: validSessionId,
        lastActivity: Date.now(),
      });

      await sessionManager.startTracking();

      const sessionId = sessionManager['get']('sessionId');
      expect(sessionId).toBe(validSessionId);
    });

    it('should update lastActivity for recovered session', async () => {
      const initialTime = Date.now() - 5 * 60 * 1000; // 5 minutes ago
      const validSessionId = 'recovered-session-789';

      sessionManager['saveStoredSession']({
        id: validSessionId,
        lastActivity: initialTime,
      });

      await sessionManager.startTracking();

      const storageKey = sessionManager['getSessionStorageKey']();
      const stored = storageManager.getItem(storageKey);
      const parsed = JSON.parse(stored!);

      // lastActivity should be updated to now
      expect(parsed.lastActivity).toBeGreaterThan(initialTime);
    });
  });

  describe('Session End Flow', () => {
    it('should track session_end with manual_stop reason', async () => {
      await sessionManager.startTracking();

      const trackSpy = vi.spyOn(eventManager, 'track');

      await sessionManager.stopTracking();

      // Verify session_end was tracked
      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventType.SESSION_END,
          session_end_reason: 'manual_stop',
        }),
      );
    });

    it('should track session_end with inactivity reason on timeout', async () => {
      vi.useFakeTimers();

      await sessionManager.startTracking();

      const trackSpy = vi.spyOn(eventManager, 'track');

      // Advance past timeout (15 minutes)
      vi.advanceTimersByTime(15 * 60 * 1000 + 1000);

      // Verify session_end was tracked
      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventType.SESSION_END,
          session_end_reason: 'inactivity',
        }),
      );

      vi.useRealTimers();
    });

    it('should track session_end with page_unload reason', async () => {
      await sessionManager.startTracking();

      const trackSpy = vi.spyOn(eventManager, 'track');

      // Simulate page unload
      window.dispatchEvent(new Event('beforeunload'));

      // Verify session_end was tracked
      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventType.SESSION_END,
          session_end_reason: 'page_unload',
        }),
      );
    });

    it('should clear session ID after end', async () => {
      await sessionManager.startTracking();
      await sessionManager.stopTracking();

      const sessionId = sessionManager['get']('sessionId');
      expect(sessionId).toBeNull();
    });

    it('should clear session storage after end', async () => {
      await sessionManager.startTracking();

      const storageKey = sessionManager['getSessionStorageKey']();

      await sessionManager.stopTracking();

      const stored = storageManager.getItem(storageKey);
      expect(stored).toBeNull();
    });

    it('should flush events before ending session', async () => {
      vi.useFakeTimers();

      await sessionManager.startTracking();

      // Add some events
      eventManager.track({
        type: EventType.CUSTOM,
        custom_event: { name: 'before_end' },
      });

      const flushSpy = vi.spyOn(eventManager, 'flushImmediatelySync');

      await sessionManager.stopTracking();

      // Verify flush was called
      expect(flushSpy).toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe('Session State Coordination', () => {
    it('should set hasStartSession flag after tracking start', async () => {
      await sessionManager.startTracking();

      const hasStartSession = sessionManager['get']('hasStartSession');
      expect(hasStartSession).toBe(true);
    });

    it('should clear hasStartSession flag after session end', async () => {
      await sessionManager.startTracking();
      await sessionManager.stopTracking();

      const hasStartSession = sessionManager['get']('hasStartSession');
      expect(hasStartSession).toBe(false);
    });

    it('should coordinate session ID between managers', async () => {
      await sessionManager.startTracking();

      const sessionIdInSessionManager = sessionManager['get']('sessionId');
      const sessionIdInEventManager = eventManager['get']('sessionId');

      // Both should have the same session ID
      expect(sessionIdInSessionManager).toBe(sessionIdInEventManager);
    });
  });

  describe('Session Activity Updates', () => {
    it('should update lastActivity on user interaction', async () => {
      vi.useFakeTimers();

      await sessionManager.startTracking();

      const storageKey = sessionManager['getSessionStorageKey']();

      // Get initial lastActivity
      const initial = JSON.parse(storageManager.getItem(storageKey)!);
      const initialActivity = initial.lastActivity;

      // Advance time
      vi.advanceTimersByTime(3000);

      // Trigger user activity (click)
      document.dispatchEvent(new MouseEvent('click'));

      // Give time for activity handler to execute
      vi.advanceTimersByTime(100);

      // Get updated lastActivity
      const updated = JSON.parse(storageManager.getItem(storageKey)!);
      const updatedActivity = updated.lastActivity;

      expect(updatedActivity).toBeGreaterThan(initialActivity);

      vi.useRealTimers();
    });

    it('should reset timeout on user activity', async () => {
      vi.useFakeTimers();

      await sessionManager.startTracking();

      const trackSpy = vi.spyOn(eventManager, 'track');

      // Advance 10 minutes
      vi.advanceTimersByTime(10 * 60 * 1000);

      // User activity
      document.dispatchEvent(new MouseEvent('click'));

      // Advance another 10 minutes (total 20, but reset at 10)
      vi.advanceTimersByTime(10 * 60 * 1000);

      // Session should still be active (no session_end yet)
      const sessionEndCalls = trackSpy.mock.calls.filter((call) => call[0].type === EventType.SESSION_END);

      expect(sessionEndCalls.length).toBe(0);

      vi.useRealTimers();
    });
  });

  describe('Cross-Tab Coordination', () => {
    it('should share session via BroadcastChannel on start', async () => {
      if (typeof BroadcastChannel === 'undefined') {
        // Skip if BroadcastChannel not supported
        return;
      }

      const postMessageSpy = vi.fn();

      // Mock BroadcastChannel
      global.BroadcastChannel = vi.fn().mockImplementation(() => ({
        postMessage: postMessageSpy,
        close: vi.fn(),
        onmessage: null,
      })) as any;

      await sessionManager.startTracking();

      // Verify session was shared
      expect(postMessageSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'session_start',
          sessionId: expect.any(String),
          projectId: 'test-project',
        }),
      );
    });

    it('should broadcast session_end on stop', async () => {
      if (typeof BroadcastChannel === 'undefined') {
        return;
      }

      const postMessageSpy = vi.fn();

      global.BroadcastChannel = vi.fn().mockImplementation(() => ({
        postMessage: postMessageSpy,
        close: vi.fn(),
        onmessage: null,
      })) as any;

      await sessionManager.startTracking();
      await sessionManager.stopTracking();

      // Verify session_end was broadcast
      expect(postMessageSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'session_end',
          reason: 'manual_stop',
        }),
      );
    });
  });

  describe('Session Data in Events', () => {
    it('should include session ID in tracked events', async () => {
      await sessionManager.startTracking();

      const sessionId = sessionManager['get']('sessionId');

      // SessionManager updates global state, so eventManager can access it
      eventManager.track({
        type: EventType.CUSTOM,
        custom_event: { name: 'test_with_session' },
      });

      const payload = eventManager['buildEventsPayload']();

      expect(payload.session_id).toBe(sessionId);
    });

    it('should prevent event sending without session ID', async () => {
      // Don't start session

      eventManager.track({
        type: EventType.CUSTOM,
        custom_event: { name: 'test_without_session' },
      });

      // Events should be queued but not sent (no sessionId)
      const queueLength = eventManager.getQueueLength();
      expect(queueLength).toBeGreaterThan(0);
    });
  });

  describe('Multiple Session Cycles', () => {
    it('should handle stop -> start cycle correctly', async () => {
      // First session
      await sessionManager.startTracking();
      const firstSessionId = sessionManager['get']('sessionId');
      await sessionManager.stopTracking();

      // Second session
      await sessionManager.startTracking();
      const secondSessionId = sessionManager['get']('sessionId');

      // Should be different sessions
      expect(secondSessionId).not.toBe(firstSessionId);
    });

    it('should track session_start for each new session', async () => {
      const trackSpy = vi.spyOn(eventManager, 'track');

      // First session
      await sessionManager.startTracking();
      await sessionManager.stopTracking();

      // Clear previous calls
      trackSpy.mockClear();

      // Second session
      await sessionManager.startTracking();

      // Should track session_start again
      expect(trackSpy).toHaveBeenCalledWith({
        type: EventType.SESSION_START,
      });
    });
  });
});
