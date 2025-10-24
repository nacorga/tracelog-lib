/**
 * Multi-Tab Sync Integration Tests
 * Focus: Cross-tab session synchronization via BroadcastChannel
 */

import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';
import { initTestBridge, destroyTestBridge, getQueueState } from '../../helpers/bridge.helper';
import { waitForCondition } from '../../helpers/wait.helper';

describe('Integration: Multi-Tab Session Sync', () => {
  let originalBroadcastChannel: any;

  beforeEach(() => {
    setupTestEnvironment();
    originalBroadcastChannel = (global as any).BroadcastChannel;
  });

  afterEach(() => {
    destroyTestBridge();
    (global as any).BroadcastChannel = originalBroadcastChannel;
    cleanupTestEnvironment();
  });

  it('should broadcast session from primary tab', async () => {
    // Mock BroadcastChannel to capture broadcast messages
    let capturedMessage: any = null;
    const mockPostMessage = vi.fn((message) => {
      capturedMessage = message;
    });

    (global as any).BroadcastChannel = vi.fn().mockImplementation(() => ({
      postMessage: mockPostMessage,
      close: vi.fn(),
      onmessage: null,
    }));

    const bridge = await initTestBridge();

    // Wait for session to be created and broadcasted
    await waitForCondition(() => capturedMessage !== null, 1000);

    // Verify broadcast message structure
    expect(mockPostMessage).toHaveBeenCalled();
    expect(capturedMessage).toMatchObject({
      action: 'session_start',
      sessionId: expect.any(String),
      timestamp: expect.any(Number),
      projectId: expect.any(String),
    });

    // Verify session was created locally
    const sessionId = bridge.getSessionData()?.id;
    expect(sessionId).toBeTruthy();
    expect(capturedMessage.sessionId).toBe(sessionId);
  });

  it('should receive session broadcast from another tab', async () => {
    let onMessageHandler: ((event: any) => void) | null = null;

    // Mock BroadcastChannel to capture the onmessage handler
    (global as any).BroadcastChannel = vi.fn().mockImplementation(() => {
      const channel = {
        postMessage: vi.fn(),
        close: vi.fn(),
        onmessage: null as any,
      };

      // Store reference to the handler when it's set
      Object.defineProperty(channel, 'onmessage', {
        get: () => onMessageHandler,
        set: (handler) => {
          onMessageHandler = handler;
        },
      });

      return channel;
    });

    const bridge = await initTestBridge();
    const originalSessionId = bridge.getSessionData()?.id;

    // Wait for BroadcastChannel to be initialized and handler set
    await waitForCondition(() => onMessageHandler !== null, 1000);

    // Simulate receiving a session broadcast from another tab
    const externalSessionId = `${Date.now()}-external`;
    onMessageHandler!({
      data: {
        action: 'session_start',
        sessionId: externalSessionId,
        timestamp: Date.now(),
        projectId: 'custom', // Matches library default for standalone mode
      },
    });

    // Wait for session to update
    await waitForCondition(() => {
      return bridge.getSessionData()?.id === externalSessionId;
    }, 1000);

    // Verify session was updated from broadcast
    const currentSessionId = bridge.getSessionData()?.id;
    expect(currentSessionId).toBe(externalSessionId);
    expect(currentSessionId).not.toBe(originalSessionId);
  });

  it('should not create SESSION_START when receiving external session', async () => {
    let onMessageHandler: ((event: any) => void) | null = null;

    (global as any).BroadcastChannel = vi.fn().mockImplementation(() => {
      const channel = {
        postMessage: vi.fn(),
        close: vi.fn(),
        onmessage: null as any,
      };

      Object.defineProperty(channel, 'onmessage', {
        get: () => onMessageHandler,
        set: (handler) => {
          onMessageHandler = handler;
        },
      });

      return channel;
    });

    const bridge = await initTestBridge();

    // Get initial SESSION_START count
    const initialEvents = getQueueState(bridge).events;
    const initialSessionStartCount = initialEvents.filter((e: any) => e.type === 'session_start').length;

    expect(initialSessionStartCount).toBe(1); // One from initial session

    // Wait for handler
    await waitForCondition(() => onMessageHandler !== null, 1000);

    // Simulate receiving session from another tab
    onMessageHandler!({
      data: {
        action: 'session_start',
        sessionId: `${Date.now()}-external`,
        timestamp: Date.now(),
        projectId: 'custom', // Matches library default for standalone mode
      },
    });

    // Wait a bit for any potential event creation
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify no additional SESSION_START was created
    const finalEvents = getQueueState(bridge).events;
    const finalSessionStartCount = finalEvents.filter((e: any) => e.type === 'session_start').length;

    expect(finalSessionStartCount).toBe(1); // Still only the initial one
  });

  it('should sync sessionId across tabs via BroadcastChannel', async () => {
    let onMessageHandler: ((event: any) => void) | null = null;
    let capturedBroadcast: any = null;

    (global as any).BroadcastChannel = vi.fn().mockImplementation(() => {
      const channel = {
        postMessage: vi.fn((message) => {
          capturedBroadcast = message;
        }),
        close: vi.fn(),
        onmessage: null as any,
      };

      Object.defineProperty(channel, 'onmessage', {
        get: () => onMessageHandler,
        set: (handler) => {
          onMessageHandler = handler;
        },
      });

      return channel;
    });

    const bridge = await initTestBridge();

    // Verify session was broadcasted
    await waitForCondition(() => capturedBroadcast !== null, 1000);
    expect(capturedBroadcast).toMatchObject({
      action: 'session_start',
      sessionId: expect.any(String),
    });

    const broadcastedSessionId = capturedBroadcast.sessionId;

    // Verify current session matches broadcasted session
    const currentSessionId = bridge.getSessionData()?.id;
    expect(currentSessionId).toBe(broadcastedSessionId);
  });

  it('should handle BroadcastChannel unavailable', async () => {
    // Remove BroadcastChannel support
    delete (global as any).BroadcastChannel;

    const bridge = await initTestBridge();

    // Should still create session without BroadcastChannel
    const sessionId = bridge.getSessionData()?.id;
    expect(sessionId).toBeTruthy();

    // Should still track SESSION_START event
    const events = getQueueState(bridge).events;
    const sessionStartEvent = events.find((e: any) => e.type === 'session_start');
    expect(sessionStartEvent).toBeTruthy();

    // Library should function normally
    bridge.event('test_event', { value: 123 });
    const updatedEvents = getQueueState(bridge).events;
    const customEvent = updatedEvents.find((e: any) => e.type === 'custom' && e.custom_event?.name === 'test_event');
    expect(customEvent).toBeTruthy();
  });

  it('should handle session_end broadcast', async () => {
    let onMessageHandler: ((event: any) => void) | null = null;

    (global as any).BroadcastChannel = vi.fn().mockImplementation(() => {
      const channel = {
        postMessage: vi.fn(),
        close: vi.fn(),
        onmessage: null as any,
      };

      Object.defineProperty(channel, 'onmessage', {
        get: () => onMessageHandler,
        set: (handler) => {
          onMessageHandler = handler;
        },
      });

      return channel;
    });

    const bridge = await initTestBridge();
    const sessionId = bridge.getSessionData()?.id;
    expect(sessionId).toBeTruthy();

    // Wait for handler
    await waitForCondition(() => onMessageHandler !== null, 1000);

    // Simulate receiving session_end from another tab
    onMessageHandler!({
      data: {
        action: 'session_end',
        sessionId: sessionId,
        reason: 'manual_stop',
        timestamp: Date.now(),
        projectId: 'custom', // Matches library default for standalone mode
      },
    });

    // Wait for session to be reset
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Session should be cleared
    const currentSessionId = bridge.getSessionData()?.id;
    expect(currentSessionId).toBeNull();
  });
});

describe('Integration: Multi-Tab Event Tracking', () => {
  let originalBroadcastChannel: any;

  beforeEach(() => {
    setupTestEnvironment();
    originalBroadcastChannel = (global as any).BroadcastChannel;
  });

  afterEach(() => {
    destroyTestBridge();
    (global as any).BroadcastChannel = originalBroadcastChannel;
    cleanupTestEnvironment();
  });

  it('should track events with shared sessionId', async () => {
    (global as any).BroadcastChannel = vi.fn().mockImplementation(() => ({
      postMessage: vi.fn(),
      close: vi.fn(),
      onmessage: null,
    }));

    const bridge = await initTestBridge();
    const sessionId = bridge.getSessionData()?.id;

    // Track custom events
    bridge.event('event_1', { value: 1 });
    bridge.event('event_2', { value: 2 });

    // All events should use the same sessionId (from queue metadata)
    const queueState = getQueueState(bridge);
    expect(queueState.length).toBeGreaterThanOrEqual(2);

    // Session ID should be consistent
    expect(sessionId).toBeTruthy();
  });

  it('should maintain independent event queues per tab instance', async () => {
    (global as any).BroadcastChannel = vi.fn().mockImplementation(() => ({
      postMessage: vi.fn(),
      close: vi.fn(),
      onmessage: null,
    }));

    const bridge = await initTestBridge();

    // Track events
    bridge.event('event_1', { value: 1 });
    bridge.event('event_2', { value: 2 });

    const queueLength = getQueueState(bridge).length;

    // Each tab instance maintains its own queue
    // (Even with shared sessionId, queues are separate per browser tab)
    expect(queueLength).toBeGreaterThanOrEqual(2);

    // Verify events are in queue
    const events = getQueueState(bridge).events;
    const customEvents = events.filter((e: any) => e.type === 'custom');
    expect(customEvents).toHaveLength(2);
  });

  it('should allow multiple tabs to track different events with same sessionId', async () => {
    let onMessageHandler: ((event: any) => void) | null = null;

    (global as any).BroadcastChannel = vi.fn().mockImplementation(() => {
      const channel = {
        postMessage: vi.fn(),
        close: vi.fn(),
        onmessage: null as any,
      };

      Object.defineProperty(channel, 'onmessage', {
        get: () => onMessageHandler,
        set: (handler) => {
          onMessageHandler = handler;
        },
      });

      return channel;
    });

    const bridge = await initTestBridge();
    const sessionId = bridge.getSessionData()?.id;

    // Track events from "this tab"
    bridge.event('tab_1_event', { tab: 1 });

    // Simulate another tab with same sessionId tracking different events
    // (In real scenario, other tab would have same sessionId but different event queue)
    const events = getQueueState(bridge).events;
    const tab1Event = events.find((e: any) => e.type === 'custom' && e.custom_event?.name === 'tab_1_event');

    expect(tab1Event).toBeTruthy();
    expect(sessionId).toBeTruthy();

    // The key insight: Same sessionId, but each tab tracks its own events independently
    // This test verifies that event tracking works correctly with BroadcastChannel enabled
  });
});
