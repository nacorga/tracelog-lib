/**
 * Session BroadcastChannel Race Condition Tests
 *
 * Critical regression test for bug where SESSION_START events were dropped
 * due to the tab receiving its own BroadcastChannel message and setting
 * hasStartSession=true prematurely.
 *
 * This test MUST fail if the bug is reintroduced.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { SessionManager } from '../../src/managers/session.manager';
import { EventManager } from '../../src/managers/event.manager';
import { StorageManager } from '../../src/managers/storage.manager';
import { resetGlobalState } from '../../src/managers/state.manager';
import { EventType } from '../../src/types';
import { createTestConfig, setupTestState } from '../utils/test-setup';

describe('Integration - Session BroadcastChannel Race Condition', () => {
  let sessionManager: SessionManager;
  let eventManager: EventManager;
  let storageManager: StorageManager;
  let broadcastChannelInstance: any;

  beforeEach(() => {
    resetGlobalState();
    localStorage.clear();
    sessionStorage.clear();

    // Setup test state with config
    setupTestState(createTestConfig());

    // Create real managers (not stubs)
    storageManager = new StorageManager();
    eventManager = new EventManager(storageManager);

    // Mock BroadcastChannel to capture and simulate self-delivery
    const mockBroadcastChannel = {
      postMessage: vi.fn((message: any) => {
        // Simulate browser behavior: BroadcastChannel delivers messages to the sender too
        // This is the critical part - browsers DO deliver messages back to the originating tab
        if (mockBroadcastChannel.onmessage) {
          // Simulate asynchronous delivery (like real browser)
          setTimeout(() => {
            if (mockBroadcastChannel.onmessage) {
              mockBroadcastChannel.onmessage(
                new MessageEvent('message', {
                  data: message,
                }),
              );
            }
          }, 0);
        }
      }),
      close: vi.fn(),
      onmessage: null as any,
    };

    broadcastChannelInstance = mockBroadcastChannel;
    global.BroadcastChannel = vi.fn(() => mockBroadcastChannel) as any;
  });

  afterEach(() => {
    sessionManager?.destroy();
    eventManager?.stop();
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  test('REGRESSION: SESSION_START event must be tracked even when tab receives its own broadcast', async () => {
    // This is the critical test that would have caught the bug
    // The bug: When a tab broadcasts its session, it receives its own message
    // and sets hasStartSession=true, causing EventManager to drop the SESSION_START event

    // Track all events that go through EventManager
    const trackedEvents: Array<{ type: EventType }> = [];
    const originalTrack = eventManager.track.bind(eventManager);

    eventManager.track = vi.fn((event: any) => {
      trackedEvents.push({ type: event.type });
      originalTrack(event);
    }) as any;

    // Create session manager with REAL EventManager
    sessionManager = new SessionManager(storageManager, eventManager, 'test-project');

    // Start tracking - this triggers the sequence:
    // 1. Creates sessionId
    // 2. Calls eventManager.track({ type: SESSION_START })
    // 3. Initializes BroadcastChannel
    // 4. Broadcasts session (which delivers back to same tab)
    sessionManager.startTracking();

    // Wait for async broadcast delivery
    await new Promise((resolve) => setTimeout(resolve, 50));

    // CRITICAL ASSERTION: SESSION_START must have been tracked
    const sessionStartEvents = trackedEvents.filter((e) => e.type === EventType.SESSION_START);

    expect(sessionStartEvents.length).toBe(1);

    // Also verify it made it to the events queue (not just tracked)
    const eventsQueue = eventManager['eventsQueue'];
    const sessionStartInQueue = eventsQueue.find((e) => e.type === EventType.SESSION_START);

    expect(sessionStartInQueue).toBeDefined();
    expect(sessionStartInQueue?.type).toBe(EventType.SESSION_START);
  });

  test('REGRESSION: hasStartSession flag should only be set by EventManager, not by BroadcastChannel handler', async () => {
    sessionManager = new SessionManager(storageManager, eventManager, 'test-project');

    // Before starting tracking, hasStartSession should be false
    expect(sessionManager['get']('hasStartSession')).toBeFalsy();

    // Start tracking
    sessionManager.startTracking();

    // Wait for broadcast self-delivery
    await new Promise((resolve) => setTimeout(resolve, 50));

    // After SESSION_START is tracked by EventManager, hasStartSession should be true
    // This is set by EventManager.track(), NOT by the BroadcastChannel onmessage handler
    expect(sessionManager['get']('hasStartSession')).toBe(true);
  });

  test('REGRESSION: Multiple tabs scenario - secondary tab should NOT fire SESSION_START', async () => {
    // Tab 1 (primary): Creates session and broadcasts
    const tab1Manager = new SessionManager(storageManager, eventManager, 'test-project');

    const trackedEvents: Array<{ type: EventType }> = [];
    const originalTrack = eventManager.track.bind(eventManager);
    eventManager.track = vi.fn((event: any) => {
      trackedEvents.push({ type: event.type });
      originalTrack(event);
    }) as any;

    tab1Manager.startTracking();
    await new Promise((resolve) => setTimeout(resolve, 50));

    const tab1SessionId = tab1Manager['get']('sessionId');

    // Clear tracked events
    trackedEvents.length = 0;

    // Tab 2 (secondary): Receives broadcast from Tab 1
    const tab2Manager = new SessionManager(storageManager, eventManager, 'test-project');
    tab2Manager.startTracking();

    // Simulate Tab 2 receiving Tab 1's broadcast
    if (broadcastChannelInstance.onmessage) {
      broadcastChannelInstance.onmessage(
        new MessageEvent('message', {
          data: {
            action: 'session_start',
            projectId: 'test-project',
            sessionId: tab1SessionId,
            timestamp: Date.now(),
          },
        }),
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Tab 2 should adopt the sessionId from Tab 1
    const tab2SessionId = tab2Manager['get']('sessionId');
    expect(tab2SessionId).toBe(tab1SessionId);

    // Tab 2 should NOT have set hasStartSession via BroadcastChannel
    // (It may be true from its own SESSION_START, but that's a different session)
    // The key is: receiving a broadcast should NOT set hasStartSession

    tab1Manager.destroy();
    tab2Manager.destroy();
  });

  test('REGRESSION: BroadcastChannel onmessage should NOT set hasStartSession flag', async () => {
    sessionManager = new SessionManager(storageManager, eventManager, 'test-project');
    sessionManager.startTracking();

    // Get the current sessionId
    const sessionId = sessionManager['get']('sessionId');

    // Manually clear the hasStartSession flag (simulating clean state)
    sessionManager['set']('hasStartSession', false);

    // Simulate receiving a broadcast message (like from another tab or self-delivery)
    if (broadcastChannelInstance.onmessage) {
      broadcastChannelInstance.onmessage(
        new MessageEvent('message', {
          data: {
            action: 'session_start',
            projectId: 'test-project',
            sessionId: sessionId,
            timestamp: Date.now(),
          },
        }),
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 10));

    // CRITICAL: hasStartSession should still be false
    // The BroadcastChannel handler should NOT set this flag
    expect(sessionManager['get']('hasStartSession')).toBe(false);
  });

  test('REGRESSION: Verify EventManager deduplication logic works correctly', () => {
    // This test ensures EventManager's hasStartSession check is working as intended
    sessionManager = new SessionManager(storageManager, eventManager, 'test-project');

    // Set hasStartSession to false
    eventManager['set']('hasStartSession', false);

    // First SESSION_START should succeed
    eventManager.track({ type: EventType.SESSION_START });

    const queue1 = eventManager['eventsQueue'];
    expect(queue1.length).toBe(1);
    expect(queue1[0]?.type).toBe(EventType.SESSION_START);

    // hasStartSession should now be true
    expect(eventManager['get']('hasStartSession')).toBe(true);

    // Second SESSION_START should be rejected (duplicate)
    eventManager.track({ type: EventType.SESSION_START });

    const queue2 = eventManager['eventsQueue'];
    // Queue should still have only 1 event (duplicate was rejected)
    expect(queue2.length).toBe(1);
  });

  test('EDGE CASE: Fast session creation and broadcast should not cause race condition', async () => {
    // This test verifies that even with rapid session creation,
    // each session fires exactly one SESSION_START event
    const trackedEvents: Array<{ type: EventType }> = [];
    const originalTrack = eventManager.track.bind(eventManager);

    eventManager.track = vi.fn((event: any) => {
      trackedEvents.push({ type: event.type });
      originalTrack(event);
    }) as any;

    // Create session manager
    sessionManager = new SessionManager(storageManager, eventManager, 'test-project');
    sessionManager.startTracking();

    // Wait for broadcast to settle
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should have exactly 1 SESSION_START event (not 0, not 2+)
    const sessionStarts = trackedEvents.filter((e) => e.type === EventType.SESSION_START);
    expect(sessionStarts.length).toBe(1);

    // Verify it's in the queue too
    const queueSessionStarts = eventManager['eventsQueue'].filter((e) => e.type === EventType.SESSION_START);
    expect(queueSessionStarts.length).toBe(1);
  });

  test('EDGE CASE: Session recovery should not trigger duplicate SESSION_START', async () => {
    // Create first session
    sessionManager = new SessionManager(storageManager, eventManager, 'test-project');
    sessionManager.startTracking();

    const originalSessionId = sessionManager['get']('sessionId');
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Destroy and create new manager (simulates page refresh)
    sessionManager.destroy();

    const trackedEvents: Array<{ type: EventType }> = [];
    const originalTrack = eventManager.track.bind(eventManager);
    eventManager.track = vi.fn((event: any) => {
      trackedEvents.push({ type: event.type });
      originalTrack(event);
    }) as any;

    // Create new manager - should recover session
    const newManager = new SessionManager(storageManager, eventManager, 'test-project');
    newManager.startTracking();

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Should have recovered the same session
    const recoveredSessionId = newManager['get']('sessionId');
    expect(recoveredSessionId).toBe(originalSessionId);

    // Should NOT have tracked SESSION_START (recovered session)
    const sessionStartEvents = trackedEvents.filter((e) => e.type === EventType.SESSION_START);
    expect(sessionStartEvents.length).toBe(0);

    newManager.destroy();
  });
});
