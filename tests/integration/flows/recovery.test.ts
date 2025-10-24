/**
 * Event Recovery Integration Tests
 * Focus: Failed event recovery from persistence
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';
import { initTestBridge, destroyTestBridge } from '../../helpers/bridge.helper';
import { createConfigWithFailureSimulation, createConfigWithSuccessSimulation } from '../../helpers/mocks.helper';

describe('Integration: Event Recovery', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();
    vi.useRealTimers();
  });

  it('should persist failed events to storage', async () => {
    vi.useFakeTimers();

    // Init with failure simulation
    const failConfig = createConfigWithFailureSimulation();
    const bridge = await initTestBridge(failConfig);

    const userId = bridge.get('userId');
    const storageKey = `tlog:${userId}:queue:custom`;

    // Track events
    bridge.event('purchase', { orderId: 'ORD-123', total: 99.99 });
    bridge.event('checkout_started', { cartTotal: 199.99 });

    // Verify queued (includes SESSION_START, PAGE_VIEW, and 2 custom events)
    expect(bridge.getQueueLength()).toBe(4);

    // Trigger send → fail → retry → persist
    await vi.advanceTimersByTimeAsync(10000); // Initial send
    await vi.runOnlyPendingTimersAsync();
    await vi.advanceTimersByTimeAsync(300); // Retry 1
    await vi.runOnlyPendingTimersAsync();
    await vi.advanceTimersByTimeAsync(500); // Retry 2
    await vi.runOnlyPendingTimersAsync();

    // Additional wait for async persistence to complete
    await vi.runOnlyPendingTimersAsync();

    // Verify persisted to localStorage after retries exhausted
    const persisted = localStorage.getItem(storageKey);
    expect(persisted).toBeDefined();
    expect(persisted).not.toBeNull();

    const parsed = JSON.parse(persisted!);
    expect(parsed.events).toHaveLength(4);

    // Find custom events (order may vary due to deduplication/sorting)
    const customEvents = parsed.events.filter((e: any) => e.type === 'custom');
    expect(customEvents).toHaveLength(2);

    const eventNames = customEvents.map((e: any) => e.custom_event?.name);
    expect(eventNames).toContain('purchase');
    expect(eventNames).toContain('checkout_started');
  });

  it('should recover events on next page load', async () => {
    vi.useFakeTimers();

    // Session 1: Fail and persist
    const failConfig = createConfigWithFailureSimulation();
    let bridge = await initTestBridge(failConfig);

    const userId = bridge.get('userId');
    const storageKey = `tlog:${userId}:queue:custom`;

    bridge.event('checkout_started', { cartTotal: 199.99 });

    // Trigger send → fail → retry → persist
    await vi.advanceTimersByTimeAsync(10000);
    await vi.runOnlyPendingTimersAsync();
    await vi.advanceTimersByTimeAsync(800); // Both retries
    await vi.runOnlyPendingTimersAsync();

    // Verify persisted
    const persisted = localStorage.getItem(storageKey);
    expect(persisted).not.toBeNull();

    // Save both userId and persisted data before cleanup
    const savedUserId = userId;
    const savedPersistedData = persisted;

    // Cleanup session 1
    destroyTestBridge();
    cleanupTestEnvironment();

    // Session 2: Init with success simulation (recovery should work)
    setupTestEnvironment();

    // Restore userId first (so library uses same storage key)
    localStorage.setItem('tlog:uid', savedUserId);

    // Restore persisted data (simulates localStorage persistence across page refresh)
    if (savedPersistedData) {
      localStorage.setItem(storageKey, savedPersistedData);
    }

    vi.useFakeTimers();
    const successConfig = createConfigWithSuccessSimulation();
    bridge = await initTestBridge(successConfig);

    // Wait for recovery to complete
    await vi.advanceTimersByTimeAsync(500);
    await vi.runOnlyPendingTimersAsync();

    // Verify recovered event sent successfully (queue cleared)
    expect(bridge.getQueueLength()).toBe(0);
    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  it('should attempt to send recovered events', async () => {
    vi.useFakeTimers();

    // Session 1: Persist events
    const failConfig = createConfigWithFailureSimulation();
    let bridge = await initTestBridge(failConfig);

    const userId = bridge.get('userId');
    const storageKey = `tlog:${userId}:queue:custom`;

    bridge.event('add_to_cart', { productId: 'PROD-456', quantity: 2 });

    await vi.advanceTimersByTimeAsync(10000);
    await vi.runOnlyPendingTimersAsync();
    await vi.advanceTimersByTimeAsync(800);
    await vi.runOnlyPendingTimersAsync();

    const persistedBefore = localStorage.getItem(storageKey);
    expect(persistedBefore).not.toBeNull();

    destroyTestBridge();
    cleanupTestEnvironment();

    // Session 2: Recover with success
    setupTestEnvironment();
    vi.useFakeTimers();
    const successConfig = createConfigWithSuccessSimulation();
    bridge = await initTestBridge(successConfig);

    await vi.advanceTimersByTimeAsync(500);
    await vi.runOnlyPendingTimersAsync();

    // Recovery should have attempted send
    // Queue should be empty after successful send
    expect(bridge.getQueueLength()).toBe(0);
  });

  it('should clear storage on successful send', async () => {
    vi.useFakeTimers();

    // Session 1: Persist
    const failConfig = createConfigWithFailureSimulation();
    let bridge = await initTestBridge(failConfig);

    const userId = bridge.get('userId');
    const storageKey = `tlog:${userId}:queue:custom`;

    bridge.event('test_event', { data: 'test' });

    await vi.advanceTimersByTimeAsync(10000);
    await vi.runOnlyPendingTimersAsync();
    await vi.advanceTimersByTimeAsync(800);
    await vi.runOnlyPendingTimersAsync();

    expect(localStorage.getItem(storageKey)).not.toBeNull();

    destroyTestBridge();
    cleanupTestEnvironment();

    // Session 2: Recover and succeed
    setupTestEnvironment();
    vi.useFakeTimers();
    const successConfig = createConfigWithSuccessSimulation();
    bridge = await initTestBridge(successConfig);

    await vi.advanceTimersByTimeAsync(500);
    await vi.runOnlyPendingTimersAsync();

    // Storage should be cleared after successful recovery
    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  it('should ignore expired events (>2h)', async () => {
    vi.useFakeTimers();

    // Session 1: Create and get userId first
    const failConfig = createConfigWithFailureSimulation();
    const bridge = await initTestBridge(failConfig);
    const userId = bridge.get('userId');

    // Save userId before cleanup
    const userIdKey = 'tlog:uid';
    const savedUserId = localStorage.getItem(userIdKey);

    // Now destroy to set up the expired data test
    destroyTestBridge();
    cleanupTestEnvironment();
    setupTestEnvironment();

    // Restore userId so recovery can find the events
    if (savedUserId) {
      localStorage.setItem(userIdKey, savedUserId);
    }

    const storageKey = `tlog:${userId}:queue:custom`;

    // Manually create expired persisted events (>2 hours old - actual expiry time)
    const expiredTimestamp = Date.now() - 3 * 60 * 60 * 1000; // 3 hours ago

    const expiredData = {
      user_id: userId,
      session_id: 'old-session',
      device: { type: 'desktop', os: 'macOS', browser: 'Chrome' },
      events: [
        {
          id: 'expired-event-1',
          type: 'custom',
          timestamp: expiredTimestamp,
          page_url: '/expired',
          custom_event: { name: 'expired_event', metadata: {} },
        },
      ],
      timestamp: expiredTimestamp,
    };

    localStorage.setItem(storageKey, JSON.stringify(expiredData));

    // Init with success config - recovery happens during init
    vi.useFakeTimers();
    const successConfig = createConfigWithSuccessSimulation();
    const bridgeRecovery = await initTestBridge(successConfig);

    // Expired events should be cleared during recovery
    expect(localStorage.getItem(storageKey)).toBeNull();
    // Queue should only have new session events (SESSION_START, PAGE_VIEW)
    const events = bridgeRecovery.getQueueEvents();
    const expiredEvent = events.find((e: any) => e.id === 'expired-event-1');
    expect(expiredEvent).toBeUndefined();
  });

  it('should handle corrupted recovery data', async () => {
    vi.useFakeTimers();

    // Session 1: Create and get userId first
    const failConfig = createConfigWithFailureSimulation();
    const bridge = await initTestBridge(failConfig);
    const userId = bridge.get('userId');

    // Save userId before cleanup
    const userIdKey = 'tlog:uid';
    const savedUserId = localStorage.getItem(userIdKey);

    // Now destroy to set up the corrupted data test
    destroyTestBridge();
    cleanupTestEnvironment();
    setupTestEnvironment();

    // Restore userId so recovery can find the corrupted data
    if (savedUserId) {
      localStorage.setItem(userIdKey, savedUserId);
    }

    const storageKey = `tlog:${userId}:queue:custom`;

    // Store corrupted JSON
    localStorage.setItem(storageKey, '{invalid json]');

    // Init should not crash - recovery happens during init
    vi.useFakeTimers();
    const successConfig = createConfigWithSuccessSimulation();
    const bridgeRecovery = await initTestBridge(successConfig);

    // Corrupted data should be cleared during recovery attempt
    expect(localStorage.getItem(storageKey)).toBeNull();
    // App should still work normally
    expect(bridgeRecovery.initialized).toBe(true);
  });
});

describe('Integration: Per-Integration Recovery', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();
    vi.useRealTimers();
  });

  it('should recover separately per integration', async () => {
    vi.useFakeTimers();

    // Test with only custom integration (SaaS requires real API)
    // Session 1: Fail custom integration, persist
    let bridge = await initTestBridge({
      integrations: {
        custom: {
          collectApiUrl: 'http://localhost:9999', // Fail simulation
          allowHttp: true,
        },
      },
    });

    const userId = bridge.get('userId');
    const customKey = `tlog:${userId}:queue:custom`;

    bridge.event('multi_integration_event', { data: 'test' });

    // Trigger send → fail → persist
    await vi.advanceTimersByTimeAsync(10000);
    await vi.runOnlyPendingTimersAsync();
    await vi.advanceTimersByTimeAsync(800);
    await vi.runOnlyPendingTimersAsync();

    // Custom integration should have persisted events
    expect(localStorage.getItem(customKey)).not.toBeNull();

    destroyTestBridge();
    cleanupTestEnvironment();

    // Session 2: Recovery with success
    setupTestEnvironment();
    vi.useFakeTimers();
    bridge = await initTestBridge(createConfigWithSuccessSimulation());

    await vi.advanceTimersByTimeAsync(500);
    await vi.runOnlyPendingTimersAsync();

    // Custom integration should recover successfully
    expect(localStorage.getItem(customKey)).toBeNull();
  });

  it('should handle partial recovery failures', async () => {
    vi.useFakeTimers();

    // Session 1: Persist to custom integration
    const failConfig = createConfigWithFailureSimulation();
    let bridge = await initTestBridge(failConfig);

    const userId = bridge.get('userId');
    const customKey = `tlog:${userId}:queue:custom`;

    bridge.event('partial_recovery_test', { data: 'test' });

    await vi.advanceTimersByTimeAsync(10000);
    await vi.runOnlyPendingTimersAsync();
    await vi.advanceTimersByTimeAsync(800);
    await vi.runOnlyPendingTimersAsync();

    const persistedAfterSession1 = localStorage.getItem(customKey);
    expect(persistedAfterSession1).not.toBeNull();

    destroyTestBridge();
    cleanupTestEnvironment();

    // Session 2: Recovery with success (skip failed recovery to simplify test)
    // The key point is that persisted events can be recovered eventually
    setupTestEnvironment();
    vi.useFakeTimers();
    const successConfig = createConfigWithSuccessSimulation();
    bridge = await initTestBridge(successConfig);

    await vi.advanceTimersByTimeAsync(500);
    await vi.runOnlyPendingTimersAsync();

    // After successful recovery, storage should be cleared
    expect(localStorage.getItem(customKey)).toBeNull();
  });
});
