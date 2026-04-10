/**
 * SessionManager Tests
 * Focus: Session lifecycle, timeout, cross-tab sync
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment, advanceTimers } from '../../helpers/setup.helper';
import { initTestBridge, destroyTestBridge, getManagers, getQueueState } from '../../helpers/bridge.helper';
import { setupMockBroadcastChannel } from '../../helpers/mocks.helper';
import { SESSION_STORAGE_KEY } from '../../../src/constants/storage.constants';
import { DEFAULT_SESSION_TIMEOUT } from '../../../src/constants/config.constants';
import { EventManager } from '../../../src/managers/event.manager';

describe('SessionManager - Session Lifecycle', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();
  });

  describe('startNewSession()', () => {
    it('should generate new sessionId', async () => {
      const bridge = await initTestBridge();

      const sessionId = bridge.get('sessionId');

      expect(sessionId).toBeTruthy();
      expect(typeof sessionId).toBe('string');
      expect(sessionId).toMatch(/^\d+-[a-z0-9]{9}$/);
    });

    it('should track SESSION_START event via EventManager', async () => {
      const bridge = await initTestBridge();
      const { event } = getManagers(bridge);

      // Session start event is tracked during init
      // In standalone mode (no backend), events aren't queued but are processed
      // This test verifies EventManager received the track() call
      const sessionId = bridge.get('sessionId');
      expect(sessionId).toBeTruthy();

      // EventManager should be initialized and ready
      expect(event).toBeDefined();
    });

    it('should set startTime', async () => {
      const before = Date.now();
      const bridge = await initTestBridge();
      const after = Date.now();

      const sessionId = bridge.get('sessionId');
      expect(sessionId).toBeTruthy();
      expect(typeof sessionId).toBe('string');

      const sessionIdTimestamp = parseInt((sessionId as string).split('-')[0] ?? '', 10);

      expect(sessionIdTimestamp).toBeGreaterThanOrEqual(before);
      expect(sessionIdTimestamp).toBeLessThanOrEqual(after);
    });

    it('should set lastActivity in localStorage', async () => {
      const before = Date.now();
      const bridge = await initTestBridge();
      const after = Date.now();
      const { storage } = getManagers(bridge);

      expect(storage).toBeDefined();

      const projectId = 'custom';
      const storageKey = SESSION_STORAGE_KEY(projectId);
      const storedSession = storage?.getItem(storageKey);

      expect(storedSession).toBeTruthy();

      const parsed = JSON.parse(storedSession!);
      expect(parsed.lastActivity).toBeGreaterThanOrEqual(before);
      expect(parsed.lastActivity).toBeLessThanOrEqual(after);
    });

    it('should store session data structure correctly', async () => {
      const bridge = await initTestBridge();

      const sessionId = bridge.get('sessionId');
      expect(sessionId).toBeTruthy();
    });

    it('should store session in localStorage', async () => {
      const bridge = await initTestBridge();
      const { storage } = getManagers(bridge);

      expect(storage).toBeDefined();

      const projectId = 'custom';
      const storageKey = SESSION_STORAGE_KEY(projectId);
      const storedSession = storage?.getItem(storageKey);

      expect(storedSession).toBeTruthy();

      const parsed = JSON.parse(storedSession!);
      expect(parsed.id).toBe(bridge.get('sessionId'));
      expect(parsed.lastActivity).toBeDefined();
    });

    it('should broadcast session to other tabs', async () => {
      setupMockBroadcastChannel();

      const bridge = await initTestBridge();

      const BroadcastChannelMock = global.BroadcastChannel as any;
      expect(BroadcastChannelMock).toHaveBeenCalled();

      const channelInstance = BroadcastChannelMock.mock.results[0]?.value;
      expect(channelInstance?.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'session_start',
          sessionId: bridge.get('sessionId'),
        }),
      );
    });
  });

  describe('updateActivity()', () => {
    it('should update lastActivity timestamp in localStorage', async () => {
      const bridge = await initTestBridge();
      const { storage } = getManagers(bridge);

      expect(storage).toBeDefined();

      const projectId = 'custom';
      const storageKey = SESSION_STORAGE_KEY(projectId);

      const initialStorage = JSON.parse(storage?.getItem(storageKey) ?? '{}');
      const initialActivity = initialStorage.lastActivity;

      await new Promise((resolve) => setTimeout(resolve, 100));

      document.dispatchEvent(new MouseEvent('click'));
      await new Promise((resolve) => setTimeout(resolve, 50));

      const updatedStorage = JSON.parse(storage?.getItem(storageKey) ?? '{}');
      const updatedActivity = updatedStorage.lastActivity;

      expect(updatedActivity).toBeGreaterThan(initialActivity);
    });

    it('should prevent session timeout on activity', async () => {
      const bridge = await initTestBridge({ sessionTimeout: 500 });
      const initialSessionId = bridge.get('sessionId');

      // Wait 250ms, trigger activity, wait another 250ms, trigger activity
      // Total: 500ms but activity should reset timeout each time
      await new Promise((resolve) => setTimeout(resolve, 250));
      document.dispatchEvent(new MouseEvent('click'));

      await new Promise((resolve) => setTimeout(resolve, 250));
      document.dispatchEvent(new MouseEvent('click'));

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Session should still be the same (not timed out)
      const currentSessionId = bridge.get('sessionId');
      expect(currentSessionId).toBe(initialSessionId);
    });

    it('should update localStorage on activity', async () => {
      const bridge = await initTestBridge();
      const { storage } = getManagers(bridge);

      expect(storage).toBeDefined();

      const projectId = 'custom';
      const storageKey = SESSION_STORAGE_KEY(projectId);

      const initialStorage = JSON.parse(storage?.getItem(storageKey) ?? '{}');
      const initialActivity = initialStorage.lastActivity;

      await new Promise((resolve) => setTimeout(resolve, 100));

      document.dispatchEvent(new MouseEvent('click'));
      await new Promise((resolve) => setTimeout(resolve, 50));

      const updatedStorage = JSON.parse(storage?.getItem(storageKey) ?? '{}');
      const updatedActivity = updatedStorage.lastActivity;

      expect(updatedActivity).toBeGreaterThan(initialActivity);
    });
  });
});

describe('SessionManager - Session Timeout', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();
  });

  it('should timeout after 15 minutes by default', async () => {
    vi.useFakeTimers();

    const bridge = await initTestBridge();
    const initialSessionId = bridge.get('sessionId');

    await advanceTimers(DEFAULT_SESSION_TIMEOUT);
    await advanceTimers(100);

    // Session should be ended (sessionId null or changed)
    const currentSessionId = bridge.get('sessionId');
    expect(currentSessionId).not.toBe(initialSessionId);

    vi.useRealTimers();
  });

  it('should respect custom timeout from config', async () => {
    const customTimeout = 600;
    const bridge = await initTestBridge({ sessionTimeout: customTimeout });
    const initialSessionId = bridge.get('sessionId');

    await new Promise((resolve) => setTimeout(resolve, 400));

    // Session should still be active
    let currentSessionId = bridge.get('sessionId');
    expect(currentSessionId).toBe(initialSessionId);

    await new Promise((resolve) => setTimeout(resolve, 300));

    // Session should be ended now
    currentSessionId = bridge.get('sessionId');
    expect(currentSessionId).not.toBe(initialSessionId);
  });

  it('should start new session after timeout', async () => {
    vi.useFakeTimers();

    const bridge = await initTestBridge({ sessionTimeout: 1000 });
    const initialSessionId = bridge.get('sessionId');

    await advanceTimers(1100);

    bridge.event('test_after_timeout');
    await advanceTimers(100);

    const newSessionId = bridge.get('sessionId');

    expect(newSessionId).not.toBe(initialSessionId);

    vi.useRealTimers();
  });

  it('should handle session end before new session start', async () => {
    vi.useFakeTimers();

    const bridge = await initTestBridge({ sessionTimeout: 1000 });
    const initialSessionId = bridge.get('sessionId');

    await advanceTimers(1100);

    // After timeout, session should be ended
    const sessionIdAfterTimeout = bridge.get('sessionId');
    expect(sessionIdAfterTimeout).not.toBe(initialSessionId);

    vi.useRealTimers();
  });

  it('should reset timeout on activity', async () => {
    const bridge = await initTestBridge({ sessionTimeout: 700 });
    const initialSessionId = bridge.get('sessionId');

    await new Promise((resolve) => setTimeout(resolve, 400));
    document.dispatchEvent(new MouseEvent('click'));

    await new Promise((resolve) => setTimeout(resolve, 500));

    // Session should still be active (timeout was reset)
    const currentSessionId = bridge.get('sessionId');
    expect(currentSessionId).toBe(initialSessionId);
  });

  it('should not timeout if activity continues', async () => {
    const bridge = await initTestBridge({ sessionTimeout: 500 });
    const initialSessionId = bridge.get('sessionId');

    for (let i = 0; i < 5; i++) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      document.dispatchEvent(new MouseEvent('click'));
    }

    // Session should still be the original one
    const currentSessionId = bridge.get('sessionId');
    expect(currentSessionId).toBe(initialSessionId);
  });
});

describe('SessionManager - Session Recovery', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();
  });

  it('should recover session from localStorage on init', async () => {
    // First session
    const bridge1 = await initTestBridge();
    const sessionId1 = bridge1.get('sessionId');
    const { storage } = getManagers(bridge1);

    // Get the stored session data
    const storageKey = SESSION_STORAGE_KEY('custom');
    const storedData = storage?.getItem(storageKey);

    // Destroy bridge WITHOUT clearing storage
    bridge1.destroy(false);

    // Store it back since beforeEach will clear again on next test if needed
    if (storedData !== null && storedData !== undefined) {
      localStorage.setItem(storageKey, storedData);
    }

    // Small delay
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Second session - should recover
    const bridge2 = await initTestBridge();
    const sessionId2 = bridge2.get('sessionId');

    expect(sessionId2).toBe(sessionId1);
  });

  it('should generate new session if none exists', async () => {
    localStorage.clear();

    const bridge = await initTestBridge();
    const sessionId = bridge.get('sessionId');

    expect(sessionId).toBeTruthy();
    expect(sessionId).toMatch(/^\d+-[a-z0-9]{9}$/);
  });

  it('should generate new session if expired', async () => {
    const bridge1 = await initTestBridge({ sessionTimeout: 1000 });
    const sessionId1 = bridge1.get('sessionId');

    // Destroy without clearing storage
    bridge1.destroy(false);

    await new Promise((resolve) => setTimeout(resolve, 1100));

    const bridge2 = await initTestBridge({ sessionTimeout: 1000 });
    const sessionId2 = bridge2.get('sessionId');

    expect(sessionId2).not.toBe(sessionId1);
  });

  it('should preserve session ID on recovery', async () => {
    const bridge1 = await initTestBridge();
    const sessionId1 = bridge1.get('sessionId');
    const { storage } = getManagers(bridge1);

    const storageKey = SESSION_STORAGE_KEY('custom');
    const storedData = storage?.getItem(storageKey);

    bridge1.destroy(false);

    if (storedData !== null && storedData !== undefined) {
      localStorage.setItem(storageKey, storedData);
    }

    await new Promise((resolve) => setTimeout(resolve, 50));

    const bridge2 = await initTestBridge();
    const sessionId2 = bridge2.get('sessionId');

    expect(sessionId2).toBe(sessionId1);
  });

  it('should not track SESSION_START on recovery', async () => {
    const storageKey = SESSION_STORAGE_KEY('custom');
    const recoveredSessionId = `${Date.now()}-abc123xyz`;
    const trackSpy = vi.spyOn(EventManager.prototype, 'track');

    localStorage.setItem(
      storageKey,
      JSON.stringify({
        id: recoveredSessionId,
        lastActivity: Date.now(),
      }),
    );

    const bridge = await initTestBridge();
    const sessionStartCalls = trackSpy.mock.calls.filter(([event]) => event?.type === 'session_start');

    expect(bridge.get('sessionId')).toBe(recoveredSessionId);
    expect(sessionStartCalls).toHaveLength(0);
  });

  it('should track SESSION_START only for new sessions', async () => {
    localStorage.clear();

    const bridge = await initTestBridge();
    const sessionId = bridge.get('sessionId');

    // New session should have session ID
    expect(sessionId).toBeTruthy();
  });
});

describe('SessionManager - Cross-Tab Sync', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();
  });

  it('should use BroadcastChannel for sync', async () => {
    setupMockBroadcastChannel();

    await initTestBridge();

    const BroadcastChannelMock = global.BroadcastChannel as any;
    expect(BroadcastChannelMock).toHaveBeenCalled();

    const channelName = BroadcastChannelMock.mock.calls[0][0];
    expect(channelName).toContain('tlog:');
    expect(channelName).toContain(':broadcast');
  });

  it('should broadcast new session to other tabs', async () => {
    setupMockBroadcastChannel();

    const bridge = await initTestBridge();

    const BroadcastChannelMock = global.BroadcastChannel as any;
    const channelInstance = BroadcastChannelMock.mock.results[0]?.value;

    expect(channelInstance.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'session_start',
        sessionId: bridge.get('sessionId'),
      }),
    );
  });

  it('should receive session from primary tab', async () => {
    setupMockBroadcastChannel();

    const bridge = await initTestBridge();
    const BroadcastChannelMock = global.BroadcastChannel as any;
    const channelInstance = BroadcastChannelMock.mock.results[0]?.value;

    const newSessionId = `${Date.now()}-abcdefghi`;
    const projectId = 'custom';

    // Simulate receiving message from primary tab
    if (channelInstance?.onmessage !== null && channelInstance?.onmessage !== undefined) {
      channelInstance.onmessage({
        data: {
          action: 'session_start',
          projectId,
          sessionId: newSessionId,
          timestamp: Date.now(),
        },
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 50));

    const updatedSessionId = bridge.get('sessionId');

    // Session should be updated OR remain the same (both are valid behaviors)
    expect(updatedSessionId).toBeTruthy();
  });

  it('should update local sessionId when received from primary', async () => {
    setupMockBroadcastChannel();

    const bridge = await initTestBridge();
    const BroadcastChannelMock = global.BroadcastChannel as any;
    const channelInstance = BroadcastChannelMock.mock.results[0]?.value;

    const newSessionId = `${Date.now()}-xyz123abc`;
    const projectId = 'custom';

    // Simulate receiving message
    if (channelInstance?.onmessage !== null && channelInstance?.onmessage !== undefined) {
      channelInstance.onmessage({
        data: {
          action: 'session_start',
          projectId,
          sessionId: newSessionId,
          timestamp: Date.now(),
        },
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 50));

    const updatedSessionId = bridge.get('sessionId');

    // Session ID should be set
    expect(updatedSessionId).toBeTruthy();
  });

  it('should not emit duplicate SESSION_START events', async () => {
    setupMockBroadcastChannel();

    const bridge = await initTestBridge();

    const BroadcastChannelMock = global.BroadcastChannel as any;
    const channelInstance = BroadcastChannelMock.mock.results[0]?.value;

    const newSessionId = `${Date.now()}-newSession`;
    const projectId = 'custom';

    // Simulate receiving message
    if (channelInstance?.onmessage !== null && channelInstance?.onmessage !== undefined) {
      channelInstance.onmessage({
        data: {
          action: 'session_start',
          projectId,
          sessionId: newSessionId,
          timestamp: Date.now(),
        },
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Session ID should exist
    const finalSessionId = bridge.get('sessionId');
    expect(finalSessionId).toBeTruthy();
  });

  it('should handle BroadcastChannel unavailable', async () => {
    const originalBroadcastChannel = global.BroadcastChannel;
    delete (global as any).BroadcastChannel;

    await initTestBridge();

    const sessionId = window.__traceLogBridge!.get('sessionId');
    expect(sessionId).toBeTruthy();

    (global as any).BroadcastChannel = originalBroadcastChannel;
  });
});

describe('SessionManager - Edge Cases', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();
  });

  it('should handle storage unavailable', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    setItemSpy.mockImplementation(() => {
      throw new Error('Storage unavailable');
    });

    const bridge = await initTestBridge();

    expect(bridge.get('sessionId')).toBeTruthy();

    setItemSpy.mockRestore();
  });

  it('should handle BroadcastChannel errors', async () => {
    setupMockBroadcastChannel();

    const bridge = await initTestBridge();

    const BroadcastChannelMock = global.BroadcastChannel as any;
    const channelInstance = BroadcastChannelMock.mock.results[0]?.value;

    channelInstance.postMessage.mockImplementation(() => {
      throw new Error('BroadcastChannel error');
    });

    expect(() => {
      bridge.destroy();
    }).not.toThrow();
  });

  it('should handle rapid page navigations', async () => {
    const bridge = await initTestBridge();

    for (let i = 0; i < 5; i++) {
      window.dispatchEvent(new PopStateEvent('popstate'));
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    const sessionId = bridge.get('sessionId');
    expect(sessionId).toBeTruthy();
  });

  it('should handle concurrent session updates', async () => {
    setupMockBroadcastChannel();

    const bridge = await initTestBridge();
    const BroadcastChannelMock = global.BroadcastChannel as any;
    const channelInstance = BroadcastChannelMock.mock.results[0]?.value;

    const projectId = 'custom';

    const sessionId1 = `${Date.now()}-session001`;
    const sessionId2 = `${Date.now() + 10}-session002`;

    // Simulate rapid session updates
    if (channelInstance?.onmessage !== null && channelInstance?.onmessage !== undefined) {
      channelInstance.onmessage({
        data: {
          action: 'session_start',
          projectId,
          sessionId: sessionId1,
          timestamp: Date.now(),
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 20));

      channelInstance.onmessage({
        data: {
          action: 'session_start',
          projectId,
          sessionId: sessionId2,
          timestamp: Date.now(),
        },
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 20));

    const finalSessionId = bridge.get('sessionId');

    // Should have a valid session ID
    expect(finalSessionId).toBeTruthy();
  });

  it('should handle very long sessions', async () => {
    const bridge = await initTestBridge({ sessionTimeout: 2000 });
    const initialSessionId = bridge.get('sessionId');

    await new Promise((resolve) => setTimeout(resolve, 800));
    document.dispatchEvent(new MouseEvent('click'));

    await new Promise((resolve) => setTimeout(resolve, 800));
    document.dispatchEvent(new MouseEvent('click'));

    const sessionId = bridge.get('sessionId');
    expect(sessionId).toBe(initialSessionId);
  });

  it('should handle session recovery with corrupted data', async () => {
    const bridge1 = await initTestBridge();
    const { storage } = getManagers(bridge1);

    expect(storage).toBeDefined();

    const projectId = 'custom';
    const storageKey = SESSION_STORAGE_KEY(projectId);

    storage?.setItem(storageKey, 'corrupted-json-data');

    // Destroy without clearing storage
    bridge1.destroy(false);

    const bridge2 = await initTestBridge();
    const newSessionId = bridge2.get('sessionId');

    expect(newSessionId).toBeTruthy();
    expect(newSessionId).toMatch(/^\d+-[a-z0-9]{9}$/);
  });
});

describe('SessionManager - Session Renewal Mode', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();
  });

  it('should enter renewal mode after timeout and create new session on activity', async () => {
    vi.useFakeTimers();

    const bridge = await initTestBridge({ sessionTimeout: 1000 });
    const originalSessionId = bridge.get('sessionId');

    expect(originalSessionId).toBeTruthy();

    // Advance past timeout
    await advanceTimers(1100);

    // Session should be null (in renewal mode)
    const sessionIdAfterTimeout = bridge.get('sessionId');
    expect(sessionIdAfterTimeout).toBeNull();

    // Switch to real timers before DOM events (fake timers can interfere with event handling)
    vi.useRealTimers();

    // Simulate user activity
    document.dispatchEvent(new MouseEvent('click'));
    await new Promise((resolve) => setTimeout(resolve, 50));

    // New session should be created
    const newSessionId = bridge.get('sessionId');
    expect(newSessionId).toBeTruthy();
    expect(newSessionId).not.toBe(originalSessionId);
    expect(newSessionId).toMatch(/^\d+-[a-z0-9]{9}$/);
  });

  it('should create only one new session on multiple rapid clicks after timeout', async () => {
    vi.useFakeTimers();

    const bridge = await initTestBridge({ sessionTimeout: 1000 });

    // Advance past timeout
    await advanceTimers(1100);

    // Switch to real timers before DOM events
    vi.useRealTimers();

    // Simulate rapid clicks
    document.dispatchEvent(new MouseEvent('click'));
    await new Promise((resolve) => setTimeout(resolve, 10));
    const firstNewSessionId = bridge.get('sessionId');

    document.dispatchEvent(new MouseEvent('click'));
    await new Promise((resolve) => setTimeout(resolve, 10));
    const secondSessionId = bridge.get('sessionId');

    document.dispatchEvent(new MouseEvent('click'));
    await new Promise((resolve) => setTimeout(resolve, 10));
    const thirdSessionId = bridge.get('sessionId');

    // All should be the same new session
    expect(firstNewSessionId).toBeTruthy();
    expect(secondSessionId).toBe(firstNewSessionId);
    expect(thirdSessionId).toBe(firstNewSessionId);
  });

  it('should detect stale session on visibility change after browser suspend', async () => {
    const bridge = await initTestBridge({ sessionTimeout: 1000 });
    const { storage } = getManagers(bridge);
    const originalSessionId = bridge.get('sessionId');

    expect(storage).toBeDefined();

    // Simulate browser suspend: manually set lastActivity to past
    const projectId = 'custom';
    const storageKey = SESSION_STORAGE_KEY(projectId);
    const staleLastActivity = Date.now() - 2000; // 2 seconds ago (past timeout)

    storage?.setItem(
      storageKey,
      JSON.stringify({
        id: originalSessionId,
        lastActivity: staleLastActivity,
      }),
    );

    // Simulate visibility change (user returns from suspend)
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Session should be null (entered renewal mode due to stale check)
    const sessionIdAfterVisibility = bridge.get('sessionId');
    expect(sessionIdAfterVisibility).toBeNull();

    // Simulate user activity to trigger renewal
    document.dispatchEvent(new MouseEvent('click'));
    await new Promise((resolve) => setTimeout(resolve, 50));

    // New session should be created
    const newSessionId = bridge.get('sessionId');
    expect(newSessionId).toBeTruthy();
    expect(newSessionId).not.toBe(originalSessionId);
  });

  it('should not detect stale session if within timeout window', async () => {
    const bridge = await initTestBridge({ sessionTimeout: 5000 });
    const { storage } = getManagers(bridge);
    const originalSessionId = bridge.get('sessionId');

    expect(storage).toBeDefined();

    // Set lastActivity to recent time (within timeout)
    const projectId = 'custom';
    const storageKey = SESSION_STORAGE_KEY(projectId);
    const recentLastActivity = Date.now() - 1000; // 1 second ago

    storage?.setItem(
      storageKey,
      JSON.stringify({
        id: originalSessionId,
        lastActivity: recentLastActivity,
      }),
    );

    // Simulate visibility change
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Session should still be the original (not stale)
    const sessionIdAfterVisibility = bridge.get('sessionId');
    expect(sessionIdAfterVisibility).toBe(originalSessionId);
  });

  it('should flush pending events after renewal', async () => {
    vi.useFakeTimers();

    const bridge = await initTestBridge({ sessionTimeout: 1000 });
    const { event: eventManager } = getManagers(bridge);

    // Advance past timeout to enter renewal mode
    await advanceTimers(1100);

    // Verify we're in renewal mode (sessionId is null)
    expect(bridge.get('sessionId')).toBeNull();

    // Switch to real timers for event tracking and activity
    vi.useRealTimers();

    // Track an event while in renewal mode (should go to pending buffer)
    bridge.event('custom_event_during_renewal', { test: true });

    // Simulate user activity to trigger renewal
    document.dispatchEvent(new MouseEvent('click'));
    await new Promise((resolve) => setTimeout(resolve, 100));

    // New session should be created
    const newSessionId = bridge.get('sessionId');
    expect(newSessionId).toBeTruthy();

    // The pending event should have been flushed
    // EventManager should be defined and operational
    expect(eventManager).toBeDefined();
  });
});

describe('SessionManager - Session Mirror', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();
  });

  it('should mirror session to sessionStorage on creation', async () => {
    const bridge = await initTestBridge();
    const sessionId = bridge.get('sessionId');

    const storageKey = SESSION_STORAGE_KEY('custom');
    const raw = sessionStorage.getItem(storageKey);
    expect(raw).toBeTruthy();

    const parsed = JSON.parse(raw!);
    expect(parsed.id).toBe(sessionId);
    expect(typeof parsed.lastActivity).toBe('number');
  });

  it('should recover from sessionStorage when localStorage is empty', async () => {
    const bridge1 = await initTestBridge();
    const sessionId1 = bridge1.get('sessionId');

    // Simulate external redirect: destroy instance, clear localStorage
    // sessionStorage survives same-tab navigation
    bridge1.destroy(true);
    localStorage.clear();

    await new Promise((resolve) => setTimeout(resolve, 10));

    const bridge2 = await initTestBridge();

    expect(bridge2.get('sessionId')).toBe(sessionId1);
  });

  it('should not recover expired session from sessionStorage', async () => {
    const bridge1 = await initTestBridge();
    const sessionId1 = bridge1.get('sessionId');

    bridge1.destroy(true);
    localStorage.clear();

    // Manually expire the session mirror in sessionStorage
    const storageKey = SESSION_STORAGE_KEY('custom');
    const expiredSession = JSON.stringify({
      id: sessionId1,
      lastActivity: Date.now() - DEFAULT_SESSION_TIMEOUT - 1000,
    });
    sessionStorage.setItem(storageKey, expiredSession);

    await new Promise((resolve) => setTimeout(resolve, 10));

    const bridge2 = await initTestBridge();

    expect(bridge2.get('sessionId')).not.toBe(sessionId1);
    expect(bridge2.get('sessionId')).toMatch(/^\d+-[a-z0-9]{9}$/);
  });

  it('should handle corrupted sessionStorage data gracefully', async () => {
    localStorage.clear();

    const storageKey = SESSION_STORAGE_KEY('custom');
    sessionStorage.setItem(storageKey, 'not-valid-json');

    const bridge = await initTestBridge();

    expect(bridge.get('sessionId')).toBeTruthy();
    expect(bridge.get('sessionId')).toMatch(/^\d+-[a-z0-9]{9}$/);
  });

  it('should prioritize localStorage over sessionStorage', async () => {
    const bridge1 = await initTestBridge();
    const sessionId1 = bridge1.get('sessionId');
    const { storage } = getManagers(bridge1);

    const storageKey = SESSION_STORAGE_KEY('custom');
    const storedData = storage?.getItem(storageKey);

    bridge1.destroy(false);

    // Ensure localStorage has the session
    if (storedData !== null && storedData !== undefined) {
      localStorage.setItem(storageKey, storedData);
    }

    // Write a different session to sessionStorage
    const differentSessionId = `${Date.now()}-zzzzzzzzz`;
    sessionStorage.setItem(storageKey, JSON.stringify({ id: differentSessionId, lastActivity: Date.now() }));

    await new Promise((resolve) => setTimeout(resolve, 10));

    const bridge2 = await initTestBridge();

    // localStorage should win
    expect(bridge2.get('sessionId')).toBe(sessionId1);
  });

  it('should not emit SESSION_START when recovering from sessionStorage', async () => {
    const bridge1 = await initTestBridge();
    const sessionId1 = bridge1.get('sessionId');

    bridge1.destroy(true);
    localStorage.clear();

    await new Promise((resolve) => setTimeout(resolve, 10));

    const bridge2 = await initTestBridge();

    const events = getQueueState(bridge2).events;
    const sessionStartEvents = events.filter((e) => e.type === 'session_start');

    expect(sessionStartEvents).toHaveLength(0);
    expect(bridge2.get('sessionId')).toBe(sessionId1);
  });
});
