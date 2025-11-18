/**
 * Session Inference Flow Integration Tests (Basic)
 * Focus: Core session lifecycle validation
 * - SESSION_START sent on init
 * - NO SESSION_END ever sent
 * - Session timeout behavior
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';
import { initTestBridge, destroyTestBridge, getQueueState } from '../../helpers/bridge.helper';
import type { TraceLogTestBridge } from '../../../src/types';

describe('Integration: Session Inference (Basic)', () => {
  let bridge: TraceLogTestBridge;

  beforeEach(() => {
    setupTestEnvironment();
    vi.useFakeTimers();
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();
    vi.restoreAllMocks();
  });

  it('should send SESSION_START event on initialization', async () => {
    bridge = await initTestBridge();

    // SESSION_START is in the queue after initialization
    const events = getQueueState(bridge).events;
    const sessionStartEvents = events.filter((e) => e.type === 'session_start');

    expect(sessionStartEvents.length).toBeGreaterThanOrEqual(1);
    expect(sessionStartEvents[0]?.type).toBe('session_start');
    expect(sessionStartEvents[0]?.timestamp).toBeDefined();
  });

  it('should never send SESSION_END event (even after timeout)', async () => {
    const sessionTimeout = 5000; // 5 seconds

    bridge = await initTestBridge({ sessionTimeout });

    // Verify SESSION_START exists
    const initialEvents = getQueueState(bridge).events;
    const sessionStartCount = initialEvents.filter((e) => e.type === 'session_start').length;
    expect(sessionStartCount).toBeGreaterThanOrEqual(1);

    // Advance time past session timeout
    await vi.advanceTimersByTimeAsync(sessionTimeout + 1000);
    await vi.runOnlyPendingTimersAsync();

    // Verify NO SESSION_END event was sent (session_end removed in v2.0.0)
    const finalEvents = getQueueState(bridge).events;
    const sessionEndEvents = finalEvents.filter((e) => (e.type as any) === 'session_end');
    expect(sessionEndEvents).toHaveLength(0);
  });

  it('should have valid session ID and be active after init', async () => {
    bridge = await initTestBridge();

    const sessionData = bridge.getSessionData();
    expect(sessionData).not.toBeNull();
    expect(sessionData?.id).toBeDefined();
    expect(typeof sessionData?.id).toBe('string');
    expect((sessionData?.id as string).length).toBeGreaterThan(0);
    expect(sessionData?.isActive).toBe(true);
  });

  it('should timeout and change isActive to false after inactivity', async () => {
    const sessionTimeout = 5000; // 5 seconds

    bridge = await initTestBridge({ sessionTimeout });

    // Initial session is active
    const initialSession = bridge.getSessionData();
    expect(initialSession?.isActive).toBe(true);

    // Advance time past timeout
    await vi.advanceTimersByTimeAsync(sessionTimeout + 1000);
    await vi.runOnlyPendingTimersAsync();

    // Session should no longer be active
    const finalSession = bridge.getSessionData();
    expect(finalSession?.isActive).toBe(false);
  });

  it('should maintain same session ID across multiple events', async () => {
    bridge = await initTestBridge();

    const initialSessionId = bridge.getSessionData()?.id;
    expect(initialSessionId).toBeDefined();

    // Track multiple events
    bridge.event('event1', { data: 1 });
    bridge.event('event2', { data: 2 });
    bridge.event('event3', { data: 3 });

    // Verify session ID hasn't changed after tracking events
    const finalSessionId = bridge.getSessionData()?.id;
    expect(finalSessionId).toBe(initialSessionId);

    // Verify events were queued
    const queuedEvents = getQueueState(bridge).events;
    const customEvents = queuedEvents.filter((e) => e.type === 'custom');
    expect(customEvents.length).toBeGreaterThanOrEqual(3);
  });

  it('should not send SESSION_END when destroy is called', async () => {
    bridge = await initTestBridge();

    // Verify SESSION_START exists
    const initialEvents = getQueueState(bridge).events;
    const sessionStartCount = initialEvents.filter((e) => e.type === 'session_start').length;
    expect(sessionStartCount).toBeGreaterThanOrEqual(1);

    // Explicitly destroy the session
    bridge.destroy(true);

    // Verify NO SESSION_END event was sent (session_end removed in v2.0.0)
    const finalEvents = getQueueState(bridge).events;
    const sessionEndEvents = finalEvents.filter((e) => (e.type as any) === 'session_end');
    expect(sessionEndEvents).toHaveLength(0);
  });
});
