/**
 * Session Handoff Integration Tests
 * Focus: Full preserve → redirect simulation → recover flow
 * - preserveSession() stores handoff in sessionStorage
 * - init() recovers from handoff when localStorage is empty
 * - Recovered session continues tracking events correctly
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';
import { initTestBridge, destroyTestBridge, getHandlers, getQueueState } from '../../helpers/bridge.helper';
import { SESSION_HANDOFF_KEY } from '../../../src/constants/storage.constants';
import type { TraceLogTestBridge } from '../../../src/types';

describe('Integration: Session Handoff', () => {
  let bridge: TraceLogTestBridge;

  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();
  });

  it('should preserve and recover session across init cycles', async () => {
    // Phase 1: User is on checkout page, session active
    bridge = await initTestBridge();
    const originalSessionId = bridge.get('sessionId');
    expect(originalSessionId).toBeTruthy();

    // Phase 2: Developer calls preserveSession() before payment redirect
    const { session } = getHandlers(bridge);
    const preserved = session!.preserveSession();
    expect(preserved).toBe(true);

    // Phase 3: Simulate page unload + redirect (destroys everything)
    bridge.destroy(true);
    localStorage.clear();

    // At this point: localStorage cleared (browser behavior varies),
    // but sessionStorage survives (same-tab navigation)
    const handoffKey = SESSION_HANDOFF_KEY('custom');
    expect(sessionStorage.getItem(handoffKey)).toBeTruthy();

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Phase 4: User returns from payment processor, page re-inits
    bridge = await initTestBridge();
    const recoveredSessionId = bridge.get('sessionId');

    // Same session as before the redirect
    expect(recoveredSessionId).toBe(originalSessionId);
  });

  it('should track events with recovered session ID after handoff', async () => {
    // Setup: Create session and preserve it
    bridge = await initTestBridge();
    const originalSessionId = bridge.get('sessionId');

    const { session } = getHandlers(bridge);
    session!.preserveSession();

    bridge.destroy(true);
    localStorage.clear();

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Recover from handoff
    bridge = await initTestBridge();
    expect(bridge.get('sessionId')).toBe(originalSessionId);

    // Track post-redirect events (e.g., purchase confirmation)
    bridge.event('purchase', { orderId: '12345', amount: 99.99 });
    bridge.event('thank_you_page', { source: 'payment_redirect' });

    const events = getQueueState(bridge).events;
    const customEvents = events.filter((e) => e.type === 'custom');

    expect(customEvents.length).toBeGreaterThanOrEqual(2);
  });

  it('should not emit SESSION_START after handoff recovery', async () => {
    bridge = await initTestBridge();
    const originalSessionId = bridge.get('sessionId');

    const { session } = getHandlers(bridge);
    session!.preserveSession();

    bridge.destroy(true);
    localStorage.clear();

    await new Promise((resolve) => setTimeout(resolve, 10));

    bridge = await initTestBridge();

    const events = getQueueState(bridge).events;
    const sessionStartEvents = events.filter((e) => e.type === 'session_start');

    // No SESSION_START: the recovered session already had one
    expect(sessionStartEvents).toHaveLength(0);
    expect(bridge.get('sessionId')).toBe(originalSessionId);
  });

  it('should fall back to new session when handoff is not available', async () => {
    bridge = await initTestBridge();
    const originalSessionId = bridge.get('sessionId');

    // Destroy without preserving (user navigated away without calling preserveSession)
    bridge.destroy(true);
    localStorage.clear();
    sessionStorage.clear();

    await new Promise((resolve) => setTimeout(resolve, 10));

    bridge = await initTestBridge();
    const newSessionId = bridge.get('sessionId');

    // New session created (no recovery possible)
    expect(newSessionId).toBeTruthy();
    expect(newSessionId).not.toBe(originalSessionId);
    expect(newSessionId).toMatch(/^\d+-[a-z0-9]{9}$/);

    // New session should have SESSION_START
    const events = getQueueState(bridge).events;
    const sessionStartEvents = events.filter((e) => e.type === 'session_start');
    expect(sessionStartEvents.length).toBeGreaterThanOrEqual(1);
  });
});
