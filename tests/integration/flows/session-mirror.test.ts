/**
 * Session Mirror Integration Tests
 * Focus: Automatic sessionStorage mirroring for session recovery after external redirects
 * - Session data automatically mirrored to sessionStorage on every write
 * - init() recovers from sessionStorage when localStorage is empty (e.g., after external redirect)
 * - Recovered session continues tracking events correctly
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';
import { initTestBridge, destroyTestBridge, getQueueState } from '../../helpers/bridge.helper';
import { SESSION_STORAGE_KEY } from '../../../src/constants/storage.constants';
import type { TraceLogTestBridge } from '../../../src/types';

describe('Integration: Session Mirror', () => {
  let bridge: TraceLogTestBridge;

  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();
  });

  it('should automatically recover session after external redirect', async () => {
    // Phase 1: User is on checkout page, session active
    bridge = await initTestBridge();
    const originalSessionId = bridge.get('sessionId');
    expect(originalSessionId).toBeTruthy();

    // Session should be mirrored to sessionStorage automatically
    const storageKey = SESSION_STORAGE_KEY('custom');
    expect(sessionStorage.getItem(storageKey)).toBeTruthy();

    // Phase 2: Simulate external redirect (destroys instance + clears localStorage)
    bridge.destroy(true);
    localStorage.clear();

    // sessionStorage survives same-tab navigation (browser behavior)
    expect(sessionStorage.getItem(storageKey)).toBeTruthy();

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Phase 3: User returns from payment processor, page re-inits
    bridge = await initTestBridge();
    const recoveredSessionId = bridge.get('sessionId');

    // Same session as before the redirect — no developer action needed
    expect(recoveredSessionId).toBe(originalSessionId);
  });

  it('should track events with recovered session ID', async () => {
    // Setup: Create session
    bridge = await initTestBridge();
    const originalSessionId = bridge.get('sessionId');

    // Simulate external redirect
    bridge.destroy(true);
    localStorage.clear();

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Recover from sessionStorage mirror
    bridge = await initTestBridge();
    expect(bridge.get('sessionId')).toBe(originalSessionId);

    // Track post-redirect events (e.g., purchase confirmation)
    bridge.event('purchase', { orderId: '12345', amount: 99.99 });
    bridge.event('thank_you_page', { source: 'payment_redirect' });

    const events = getQueueState(bridge).events;
    const customEvents = events.filter((e) => e.type === 'custom');

    expect(customEvents.length).toBeGreaterThanOrEqual(2);
  });

  it('should not emit SESSION_START after sessionStorage recovery', async () => {
    bridge = await initTestBridge();
    const originalSessionId = bridge.get('sessionId');

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

  it('should create new session when no recovery source available', async () => {
    bridge = await initTestBridge();
    const originalSessionId = bridge.get('sessionId');

    // Destroy everything — no localStorage, no sessionStorage
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
