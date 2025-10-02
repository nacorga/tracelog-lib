/**
 * SessionManager Unit Tests
 *
 * Tests session lifecycle management to detect library defects:
 * - Session ID generation is unique
 * - Session timeout works correctly (15min default)
 * - Session recovery from storage works
 * - Expired sessions are not recovered
 * - Event listeners are properly cleaned up
 *
 * Focus: Detect session management defects and memory leaks
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SessionManager } from '../../src/managers/session.manager';
import { StorageManager } from '../../src/managers/storage.manager';
import { EventManager } from '../../src/managers/event.manager';
import { EventType } from '../../src/types';
import { setupTestState, createTestConfig } from '../utils/test-setup';

describe('SessionManager', () => {
  let sessionManager: SessionManager;
  let storageManager: StorageManager;
  let eventManager: EventManager;

  beforeEach(async () => {
    vi.clearAllMocks();
    await setupTestState(
      createTestConfig({
        id: 'test-project',
        sessionTimeout: 15 * 60 * 1000, // 15 minutes
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

  describe('Session ID Generation', () => {
    it('should generate unique session IDs', () => {
      const id1 = sessionManager['generateSessionId']();
      const id2 = sessionManager['generateSessionId']();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^\d+-[a-z0-9]+$/);
      expect(id2).toMatch(/^\d+-[a-z0-9]+$/);
    });

    it('should include timestamp in session ID', () => {
      const now = Date.now();
      const sessionId = sessionManager['generateSessionId']();

      const timestamp = parseInt(sessionId.split('-')[0], 10);
      expect(timestamp).toBeGreaterThanOrEqual(now);
      expect(timestamp).toBeLessThanOrEqual(now + 100);
    });
  });

  describe('Session Start', () => {
    it('should start new session and track session_start', async () => {
      const trackSpy = vi.spyOn(eventManager, 'track');

      await sessionManager.startTracking();

      // Verify session ID was set
      const sessionId = sessionManager['get']('sessionId');
      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');

      // Verify session_start was tracked
      expect(trackSpy).toHaveBeenCalledWith({
        type: EventType.SESSION_START,
      });
    });

    it('should NOT track session_start for recovered session', async () => {
      // Persist a valid session
      const validSessionId = 'recovered-session-123';
      sessionManager['saveStoredSession']({
        id: validSessionId,
        lastActivity: Date.now(),
      });

      const trackSpy = vi.spyOn(eventManager, 'track');

      await sessionManager.startTracking();

      // Verify recovered session ID
      const sessionId = sessionManager['get']('sessionId');
      expect(sessionId).toBe(validSessionId);

      // Verify session_start was NOT tracked (recovered session)
      expect(trackSpy).not.toHaveBeenCalledWith({
        type: EventType.SESSION_START,
      });
    });

    it('should not start tracking twice', async () => {
      await sessionManager.startTracking();

      const firstSessionId = sessionManager['get']('sessionId');

      // Try to start again
      await sessionManager.startTracking();

      const secondSessionId = sessionManager['get']('sessionId');

      // Session ID should remain the same
      expect(secondSessionId).toBe(firstSessionId);
    });
  });

  describe('Session Recovery', () => {
    it('should recover valid session from storage', () => {
      const validSessionId = 'valid-session-456';
      sessionManager['saveStoredSession']({
        id: validSessionId,
        lastActivity: Date.now() - 5 * 60 * 1000, // 5 minutes ago
      });

      const recoveredId = sessionManager['recoverSession']();

      expect(recoveredId).toBe(validSessionId);
    });

    it('should NOT recover expired session', () => {
      const expiredSessionId = 'expired-session-789';
      sessionManager['saveStoredSession']({
        id: expiredSessionId,
        lastActivity: Date.now() - 20 * 60 * 1000, // 20 minutes ago (expired)
      });

      const recoveredId = sessionManager['recoverSession']();

      expect(recoveredId).toBeNull();
    });

    it('should clean up expired session from storage', () => {
      const expiredSessionId = 'expired-session-cleanup';
      const storageKey = sessionManager['getSessionStorageKey']();

      sessionManager['saveStoredSession']({
        id: expiredSessionId,
        lastActivity: Date.now() - 20 * 60 * 1000,
      });

      sessionManager['recoverSession']();

      // Storage should be cleaned
      const stored = storageManager.getItem(storageKey);
      expect(stored).toBeNull();
    });

    it('should handle corrupted session data', () => {
      const storageKey = sessionManager['getSessionStorageKey']();
      storageManager.setItem(storageKey, 'invalid-json{corrupted}');

      const recoveredId = sessionManager['recoverSession']();

      expect(recoveredId).toBeNull();
    });

    it('should handle missing session fields', () => {
      const storageKey = sessionManager['getSessionStorageKey']();
      storageManager.setItem(storageKey, JSON.stringify({ id: 'test' })); // Missing lastActivity

      const recoveredId = sessionManager['recoverSession']();

      expect(recoveredId).toBeNull();
    });
  });

  describe('Session Timeout', () => {
    it('should end session after inactivity timeout', async () => {
      vi.useFakeTimers();

      await sessionManager.startTracking();

      const trackSpy = vi.spyOn(eventManager, 'track');

      // Advance time past session timeout (15 minutes)
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

    it('should reset timeout on user activity', async () => {
      vi.useFakeTimers();

      await sessionManager.startTracking();

      const initialSessionId = sessionManager['get']('sessionId');

      // Advance time to 10 minutes
      vi.advanceTimersByTime(10 * 60 * 1000);

      // Simulate user activity (click)
      document.dispatchEvent(new MouseEvent('click'));

      // Advance another 10 minutes (total 20 minutes, but activity reset at 10)
      vi.advanceTimersByTime(10 * 60 * 1000);

      // Session should still be active
      const currentSessionId = sessionManager['get']('sessionId');
      expect(currentSessionId).toBe(initialSessionId);

      vi.useRealTimers();
    });

    it('should pause timeout when page is hidden', async () => {
      vi.useFakeTimers();

      await sessionManager.startTracking();

      // Save original descriptor
      const originalDescriptor = Object.getOwnPropertyDescriptor(document, 'hidden');

      // Hide page (tab backgrounded)
      delete (document as any).hidden;
      Object.defineProperty(document, 'hidden', { value: true, configurable: true, writable: true });
      document.dispatchEvent(new Event('visibilitychange'));

      // Advance time (should not trigger timeout while hidden)
      vi.advanceTimersByTime(20 * 60 * 1000);

      // Session should still be active
      const sessionId = sessionManager['get']('sessionId');
      expect(sessionId).toBeDefined();

      // Restore original descriptor
      if (originalDescriptor) {
        delete (document as any).hidden;
        Object.defineProperty(document, 'hidden', originalDescriptor);
      }

      vi.useRealTimers();
    });

    it('should resume timeout when page becomes visible', async () => {
      vi.useFakeTimers();

      await sessionManager.startTracking();

      // Save original descriptor
      const originalDescriptor = Object.getOwnPropertyDescriptor(document, 'hidden');

      // Hide page
      delete (document as any).hidden;
      Object.defineProperty(document, 'hidden', { value: true, configurable: true, writable: true });
      document.dispatchEvent(new Event('visibilitychange'));

      // Show page again
      delete (document as any).hidden;
      Object.defineProperty(document, 'hidden', { value: false, configurable: true, writable: true });
      document.dispatchEvent(new Event('visibilitychange'));

      // Timeout should be restarted
      expect(sessionManager['sessionTimeoutId']).not.toBeNull();

      // Restore original descriptor
      if (originalDescriptor) {
        delete (document as any).hidden;
        Object.defineProperty(document, 'hidden', originalDescriptor);
      }

      vi.useRealTimers();
    });
  });

  describe('Session Persistence', () => {
    it('should persist session to storage', () => {
      const sessionId = 'persist-test-session';
      const lastActivity = Date.now();

      sessionManager['persistSession'](sessionId, lastActivity);

      const storageKey = sessionManager['getSessionStorageKey']();
      const stored = storageManager.getItem(storageKey);

      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed.id).toBe(sessionId);
      expect(parsed.lastActivity).toBe(lastActivity);
    });

    it('should update lastActivity on activity reset', async () => {
      vi.useFakeTimers();

      await sessionManager.startTracking();

      const storageKey = sessionManager['getSessionStorageKey']();

      // Get initial lastActivity
      const initial = JSON.parse(storageManager.getItem(storageKey)!);
      const initialActivity = initial.lastActivity;

      // Advance time and trigger activity
      vi.advanceTimersByTime(5000);
      document.dispatchEvent(new MouseEvent('click'));

      // Get updated lastActivity
      const updated = JSON.parse(storageManager.getItem(storageKey)!);
      const updatedActivity = updated.lastActivity;

      expect(updatedActivity).toBeGreaterThan(initialActivity);

      vi.useRealTimers();
    });
  });

  describe('Session End', () => {
    it('should end session on manual stop', async () => {
      await sessionManager.startTracking();

      const trackSpy = vi.spyOn(eventManager, 'track');

      await sessionManager.stopTracking();

      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventType.SESSION_END,
          session_end_reason: 'manual_stop',
        }),
      );
    });

    it('should end session on page unload', async () => {
      await sessionManager.startTracking();

      const trackSpy = vi.spyOn(eventManager, 'track');

      // Simulate page unload
      window.dispatchEvent(new Event('beforeunload'));

      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventType.SESSION_END,
          session_end_reason: 'page_unload',
        }),
      );
    });

    it('should clear session state after end', async () => {
      await sessionManager.startTracking();

      await sessionManager.stopTracking();

      const sessionId = sessionManager['get']('sessionId');
      expect(sessionId).toBeNull();
    });

    it('should clear storage after session end', async () => {
      await sessionManager.startTracking();

      const storageKey = sessionManager['getSessionStorageKey']();

      await sessionManager.stopTracking();

      const stored = storageManager.getItem(storageKey);
      expect(stored).toBeNull();
    });
  });

  describe('Cleanup and Memory Management', () => {
    it('should remove activity listeners on destroy', async () => {
      await sessionManager.startTracking();

      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      sessionManager.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    });

    it('should remove lifecycle listeners on destroy', async () => {
      await sessionManager.startTracking();

      const removeDocListenerSpy = vi.spyOn(document, 'removeEventListener');
      const removeWinListenerSpy = vi.spyOn(window, 'removeEventListener');

      sessionManager.destroy();

      expect(removeDocListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
      expect(removeWinListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    });

    it('should clear session timeout on destroy', async () => {
      vi.useFakeTimers();

      await sessionManager.startTracking();

      expect(sessionManager['sessionTimeoutId']).not.toBeNull();

      sessionManager.destroy();

      expect(sessionManager['sessionTimeoutId']).toBeNull();

      vi.useRealTimers();
    });

    it('should handle destroy when not tracking', () => {
      expect(() => sessionManager.destroy()).not.toThrow();
    });
  });

  describe('Storage Key Generation', () => {
    it('should generate consistent storage key', () => {
      const key1 = sessionManager['getSessionStorageKey']();
      const key2 = sessionManager['getSessionStorageKey']();

      expect(key1).toBe(key2);
      expect(key1).toContain('test-project');
    });

    it('should use project ID in storage key', () => {
      const key = sessionManager['getSessionStorageKey']();

      expect(key).toContain('test-project');
    });
  });
});
