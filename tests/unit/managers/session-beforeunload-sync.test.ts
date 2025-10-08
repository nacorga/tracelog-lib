import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SessionManager } from '../../../src/managers/session.manager';
import { EventManager } from '../../../src/managers/event.manager';
import { setupTestEnvironment, cleanupTestState } from '../../utils/test-setup';
import { EventType, ScrollDirection } from '../../../src/types/event.types';

/**
 * Tests for async/await bug fix in beforeunload handler
 *
 * Bug: endSession() was async and called without await in beforeunload handler.
 * This caused promises to be cancelled during page reload, leading to:
 * - Lost events (especially last click before reload)
 * - Inconsistent session state
 * - Failed cross-tab sync
 *
 * Fix: Made endSession() synchronous to ensure completion before unload
 */
describe('SessionManager - beforeunload async bug fix', () => {
  let eventManager: EventManager;
  let sessionManager: SessionManager;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();

    const testEnv = setupTestEnvironment({});
    sessionManager = testEnv.sessionManager;
    eventManager = testEnv.eventManager;
  });

  afterEach(() => {
    if (sessionManager) {
      sessionManager.destroy();
    }
    cleanupTestState();
  });

  describe('endSession() synchronous behavior', () => {
    it('should complete synchronously without returning a promise', () => {
      sessionManager.startTracking();

      // Get sessionId from state before calling endSession
      const sessionIdBefore = (sessionManager as any).get('sessionId');
      expect(sessionIdBefore).toBeTruthy();

      // Call private endSession method
      const result = (sessionManager as any).endSession('page_unload');

      // Should return void (undefined), not a Promise
      expect(result).toBeUndefined();
      expect(result).not.toBeInstanceOf(Promise);

      // Session should be cleaned up immediately (set to null in state)
      const sessionIdAfter = (sessionManager as any).get('sessionId');
      expect(sessionIdAfter).toBeNull();
    });

    it('should always finalize session state even if flush fails', () => {
      sessionManager.startTracking();

      // Mock flush to fail
      vi.spyOn(eventManager, 'flushImmediatelySync').mockReturnValue(false);

      // Call endSession
      (sessionManager as any).endSession('page_unload');

      // Session should still be cleaned up despite flush failure
      const sessionIdAfter = (sessionManager as any).get('sessionId');
      expect(sessionIdAfter).toBeNull();
      expect(eventManager.flushImmediatelySync).toHaveBeenCalled();
    });

    it('should broadcast session end even if flush fails', () => {
      sessionManager.startTracking();
      const sessionIdBefore = (sessionManager as any).get('sessionId');

      // Mock flush to fail
      vi.spyOn(eventManager, 'flushImmediatelySync').mockReturnValue(false);

      // Spy on broadcast
      const broadcastSpy = vi.spyOn(sessionManager as any, 'broadcastSessionEnd');

      // Call endSession
      (sessionManager as any).endSession('page_unload');

      // Broadcast should still happen
      expect(broadcastSpy).toHaveBeenCalledWith(sessionIdBefore, 'page_unload');
    });

    it('should not await async operations in beforeunload handler', () => {
      sessionManager.startTracking();

      // This test ensures the beforeunload handler doesn't use await
      const handler = (sessionManager as any).beforeUnloadHandler;

      // Handler should exist after startTracking
      expect(handler).toBeDefined();

      // Handler should be a regular function, not async
      // Async functions have a specific constructor name
      expect(handler.constructor.name).toBe('Function');
      // Not AsyncFunction
      expect(handler.constructor.name).not.toBe('AsyncFunction');
    });
  });

  describe('beforeunload simulation', () => {
    it('should handle fast page reload without losing events', () => {
      sessionManager.startTracking();

      // Track some events
      eventManager.track({
        type: EventType.CLICK,
        click_data: { x: 100, y: 200, relativeX: 0.5, relativeY: 0.5, tag: 'button' },
      });
      eventManager.track({ type: EventType.PAGE_VIEW });

      // Mock flushImmediatelySync to fail (simulating sendBeacon failure)
      vi.spyOn(eventManager, 'flushImmediatelySync').mockReturnValue(false);

      // Simulate beforeunload event
      const beforeUnloadEvent = new Event('beforeunload') as BeforeUnloadEvent;
      window.dispatchEvent(beforeUnloadEvent);

      // endSession should have been called (test passes if no error)
      // Event persistence is handled by EventManager/SenderManager
      expect(eventManager.flushImmediatelySync).toHaveBeenCalled();
    });

    it('should complete session cleanup before unload', () => {
      sessionManager.startTracking();
      const sessionIdBefore = (sessionManager as any).get('sessionId');
      expect(sessionIdBefore).toBeTruthy();

      // Track an event
      eventManager.track({
        type: EventType.CLICK,
        click_data: { x: 100, y: 200, relativeX: 0.5, relativeY: 0.5, tag: 'button' },
      });

      // Simulate beforeunload
      const beforeUnloadEvent = new Event('beforeunload') as BeforeUnloadEvent;
      window.dispatchEvent(beforeUnloadEvent);

      // Session should be immediately null (not waiting for async)
      const sessionIdAfter = (sessionManager as any).get('sessionId');
      expect(sessionIdAfter).toBeNull();
    });

    it('should handle rapid reload without promise cancellation', () => {
      sessionManager.startTracking();
      const sessionIdBefore = (sessionManager as any).get('sessionId');
      expect(sessionIdBefore).toBeTruthy();

      // Track multiple events
      eventManager.track({
        type: EventType.CLICK,
        click_data: { x: 100, y: 200, relativeX: 0.5, relativeY: 0.5, tag: 'button' },
      });
      eventManager.track({
        type: EventType.SCROLL,
        scroll_data: { depth: 50, direction: ScrollDirection.DOWN },
      });
      eventManager.track({ type: EventType.PAGE_VIEW });

      // Simulate fast reload (beforeunload immediately followed by unload)
      const beforeUnloadEvent = new Event('beforeunload') as BeforeUnloadEvent;
      const unloadEvent = new Event('pagehide');

      // These should complete without throwing or leaving promises pending
      expect(() => {
        window.dispatchEvent(beforeUnloadEvent);
        window.dispatchEvent(unloadEvent);
      }).not.toThrow();

      // No async operations should be pending
      // Session should be completely cleaned up
      const sessionIdAfter = (sessionManager as any).get('sessionId');
      expect(sessionIdAfter).toBeNull();
    });
  });

  describe('stopTracking() synchronous behavior', () => {
    it('should be synchronous after fix', () => {
      sessionManager.startTracking();

      // stopTracking should now be synchronous (return void, not Promise)
      const result = sessionManager.stopTracking();

      expect(result).toBeUndefined();
      expect(result).not.toBeInstanceOf(Promise);
    });

    it('should not throw when called synchronously', () => {
      sessionManager.startTracking();

      // Should complete without error
      expect(() => {
        sessionManager.stopTracking();
      }).not.toThrow();

      // Should be idempotent
      expect(() => {
        sessionManager.stopTracking();
      }).not.toThrow();
    });
  });

  describe('cross-tab sync with synchronous endSession', () => {
    it('should broadcast session end synchronously', () => {
      sessionManager.startTracking();
      const sessionIdBefore = (sessionManager as any).get('sessionId');

      // Mock BroadcastChannel
      const postMessageSpy = vi.fn();
      (sessionManager as any).broadcastChannel = {
        postMessage: postMessageSpy,
        close: vi.fn(),
      };

      // Call endSession
      (sessionManager as any).endSession('page_unload');

      // Should have broadcasted immediately (synchronously)
      expect(postMessageSpy).toHaveBeenCalledWith({
        action: 'session_end',
        projectId: expect.any(String),
        sessionId: sessionIdBefore,
        reason: 'page_unload',
        timestamp: expect.any(Number),
      });
    });

    it('should handle broadcast channel errors gracefully', () => {
      sessionManager.startTracking();

      // Mock BroadcastChannel to throw
      (sessionManager as any).broadcastChannel = {
        postMessage: vi.fn().mockImplementation(() => {
          throw new Error('Broadcast failed');
        }),
        close: vi.fn(),
      };

      // Should not throw even if broadcast fails
      expect(() => {
        (sessionManager as any).endSession('page_unload');
      }).not.toThrow();

      // Session should still be cleaned up
      const sessionIdAfter = (sessionManager as any).get('sessionId');
      expect(sessionIdAfter).toBeNull();
    });
  });

  describe('regression prevention', () => {
    it('should not reintroduce async endSession', () => {
      // This test will fail if someone accidentally makes endSession async again
      const endSession = (sessionManager as any).endSession;

      // Should be a regular function
      expect(endSession.constructor.name).toBe('Function');
      // Not async
      expect(endSession.constructor.name).not.toBe('AsyncFunction');
    });

    it('should not use await in endSession body', () => {
      // Get the function source code
      const endSessionSource = (sessionManager as any).endSession.toString();

      // Should not contain 'await' keyword
      // (This is a simple check, not foolproof, but catches obvious regressions)
      expect(endSessionSource).not.toContain('await ');
    });
  });
});
