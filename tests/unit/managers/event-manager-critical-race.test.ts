/**
 * EventManager - Critical event race tests
 *
 * Regression coverage for the case where a synchronous flush is requested
 * while an asynchronous send is in flight (e.g. user clicks "Pay" right as
 * the periodic send fires for the 50-event batch threshold). Without the
 * deferred re-flush mechanism the critical event would sit in the queue
 * until the next periodic tick — and if the user navigated before that, the
 * event would be lost. With the fix, the `finally` block of the in-flight
 * send re-runs `flushImmediatelySync()` so the event leaves via `sendBeacon`.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';
import { MOCK_DEVICE_INFO } from '../../helpers/fixtures.helper';
import { EventManager } from '../../../src/managers/event.manager';
import { SenderManager } from '../../../src/managers/sender.manager';
import { StorageManager } from '../../../src/managers/storage.manager';
import { EventType } from '../../../src/types';
import type { EventsQueue } from '../../../src/types';
import { Emitter } from '../../../src/utils';

describe('EventManager - critical event race with in-flight async send', () => {
  let eventManager: EventManager;
  let storageManager: StorageManager;
  let emitter: Emitter;
  let customSender: {
    sendEventsQueue: ReturnType<typeof vi.fn>;
    sendEventsQueueSync: ReturnType<typeof vi.fn>;
    getIntegrationId: () => 'custom';
    stop: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    setupTestEnvironment();
    storageManager = new StorageManager();
    emitter = new Emitter();
    eventManager = new EventManager(storageManager, emitter, {});

    eventManager['set']('userId', 'user-race');
    eventManager['set']('device', MOCK_DEVICE_INFO);
    eventManager['set']('pageUrl', 'https://example.com/race');
    eventManager['set']('sessionId', 'session-race');
    eventManager['set']('collectApiUrls', { custom: 'https://custom.example.com' });

    customSender = {
      sendEventsQueue: vi.fn(),
      sendEventsQueueSync: vi.fn().mockReturnValue(true),
      getIntegrationId: (): 'custom' => 'custom',
      stop: vi.fn(),
    };

    // Replace dataSenders with our controllable double.
    const senders = eventManager['dataSenders'];
    senders.length = 0;
    senders.push(customSender as unknown as SenderManager);
  });

  afterEach(() => {
    eventManager.stop();
    cleanupTestEnvironment();
  });

  it('defers sync flush while async send is in flight and re-runs it on settle', async () => {
    // Pre-queue some events and start an async flush that we keep paused.
    eventManager.track({ type: EventType.CUSTOM, custom_event: { name: 'pre_1' } });
    eventManager.track({ type: EventType.CUSTOM, custom_event: { name: 'pre_2' } });

    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    customSender.sendEventsQueue.mockImplementation(async () => {
      await gate;
      return true;
    });

    const inFlight = eventManager.flushImmediately();
    // Microtask boundary so the async IIFE has a chance to claim sendInProgress.
    await Promise.resolve();
    expect(eventManager['sendInProgress']).toBe(true);

    // Simulate a critical event landing while the async send is paused: track
    // adds it to the queue, then the consumer requests a sync flush which must
    // not race with the in-flight fetch (would otherwise build the same batch
    // and duplicate the network request).
    eventManager.track({ type: EventType.CUSTOM, custom_event: { name: 'critical_now' } });
    const syncResult = eventManager.flushImmediatelySync();

    // The sync path returns `false` because nothing has actually been delivered
    // yet — the call was deferred until the in-flight async send settles. This
    // mirrors `flushImmediately()`'s contract: `true` ⇒ at least one
    // integration received the batch *now*.
    expect(syncResult).toBe(false);
    expect(customSender.sendEventsQueueSync).not.toHaveBeenCalled();
    expect(eventManager['pendingSyncFlush']).toBe(true);

    // Release the async send. The finally block must drain the deferred sync
    // flush — sendEventsQueueSync should now fire for the leftover critical
    // event (the original two were removed by the async send's optimistic
    // path).
    release();
    await inFlight;

    expect(customSender.sendEventsQueueSync).toHaveBeenCalledTimes(1);
    expect(eventManager['pendingSyncFlush']).toBe(false);
  });

  it('drains pendingSyncFlush from the periodic send path as well', async () => {
    eventManager.track({ type: EventType.CUSTOM, custom_event: { name: 'p1' } });

    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    customSender.sendEventsQueue.mockImplementation(async () => {
      await gate;
      return true;
    });

    // Trigger the periodic-style send path via the private method (mimics what
    // the internal timer would call).
    const periodic = eventManager['sendEventsQueue']();
    await Promise.resolve();
    expect(eventManager['sendInProgress']).toBe(true);

    // Sync flush requested while periodic is in flight → must defer.
    eventManager.track({ type: EventType.CUSTOM, custom_event: { name: 'mid_critical' } });
    eventManager.flushImmediatelySync();
    expect(customSender.sendEventsQueueSync).not.toHaveBeenCalled();
    expect(eventManager['pendingSyncFlush']).toBe(true);

    release();
    await periodic;

    expect(customSender.sendEventsQueueSync).toHaveBeenCalledTimes(1);
    expect(eventManager['pendingSyncFlush']).toBe(false);
  });

  it('clears pendingSyncFlush on stop() so it does not leak across init/destroy cycles', () => {
    // Force the flag without going through a real flush.
    (eventManager as unknown as { pendingSyncFlush: boolean }).pendingSyncFlush = true;
    eventManager.stop();
    expect(eventManager['pendingSyncFlush']).toBe(false);
  });

  it('emits one sendBeacon batch per session when a critical event lands after session renewal', () => {
    // Production scenario: user is idle past the session timeout while events
    // from the previous session are still queued, then taps "Pay" — which
    // tracks a critical event under the new session. The synchronous flush
    // must emit two batches (one per session_id), not one merged batch with
    // the wrong attribution.
    eventManager['set']('sessionId', 'session-old');
    eventManager.track({ type: EventType.CUSTOM, custom_event: { name: 'old_a' } });
    eventManager.track({ type: EventType.CUSTOM, custom_event: { name: 'old_b' } });

    // Simulate enterRenewalMode → renewSession: state sessionId switches.
    eventManager['set']('sessionId', 'session-new');
    eventManager.track({ type: EventType.CUSTOM, custom_event: { name: 'critical_purchase' } });

    // No async send in flight — the critical flush runs immediately.
    const syncResult = eventManager.flushImmediatelySync();

    expect(syncResult).toBe(true);
    expect(customSender.sendEventsQueueSync).toHaveBeenCalledTimes(2);

    const batches = customSender.sendEventsQueueSync.mock.calls.map((call) => call[0] as EventsQueue);
    const oldBatch = batches.find((b) => b.session_id === 'session-old');
    const newBatch = batches.find((b) => b.session_id === 'session-new');

    expect(oldBatch).toBeDefined();
    expect(oldBatch!.events).toHaveLength(2);
    expect(newBatch).toBeDefined();
    expect(newBatch!.events).toHaveLength(1);
    expect(newBatch!.events[0]!.custom_event?.name).toBe('critical_purchase');

    // Optimistic removal cleared the entire queue across both batches.
    expect(eventManager.getQueueLength()).toBe(0);
  });

  it('keeps the periodic timer scheduled after a sync flush where all integrations fail', () => {
    // Regression: `flushImmediatelySync()` used to unconditionally clear the
    // periodic timer. When all senders failed, events stayed in the queue but
    // the timer was killed — no retry would fire until the next `track()`
    // call resurrected the timer in `addToQueue`. The fix mirrors the
    // periodic-send pattern (clear only when queue is empty, otherwise
    // reschedule), so the backend can recover without depending on user
    // activity.
    eventManager['set']('sessionId', 'session-retry');
    customSender.sendEventsQueueSync.mockReturnValue(false);
    eventManager.track({ type: EventType.CUSTOM, custom_event: { name: 'will_fail' } });

    // Pre-condition: addToQueue already scheduled the timer.
    expect(eventManager['sendTimeoutId']).not.toBeNull();
    const initialTimerId = eventManager['sendTimeoutId'];

    const result = eventManager.flushImmediatelySync();

    expect(result).toBe(false);
    expect(customSender.sendEventsQueueSync).toHaveBeenCalledTimes(1);
    // Event stayed in the queue for retry.
    expect(eventManager.getQueueLength()).toBe(1);
    // Timer is still active so the periodic safety-net can retry — same ID
    // because `scheduleSendTimeout()` is a no-op if a timer already exists.
    expect(eventManager['sendTimeoutId']).not.toBeNull();
    expect(eventManager['sendTimeoutId']).toBe(initialTimerId);
  });

  it('keeps the periodic timer scheduled after an async flush where all integrations fail', async () => {
    // Same regression for the async fetch path.
    eventManager['set']('sessionId', 'session-retry-async');
    customSender.sendEventsQueue.mockResolvedValue(false);
    eventManager.track({ type: EventType.CUSTOM, custom_event: { name: 'will_fail' } });
    expect(eventManager['sendTimeoutId']).not.toBeNull();

    const result = await eventManager.flushImmediately();

    expect(result).toBe(false);
    expect(eventManager.getQueueLength()).toBe(1);
    expect(eventManager['sendTimeoutId']).not.toBeNull();
  });

  it('clears the periodic timer when a flush empties the queue', async () => {
    // Complementary case: when the queue *is* drained, the timer should be
    // cleared. Verifies we did not regress the happy path.
    eventManager['set']('sessionId', 'session-drained');
    customSender.sendEventsQueue.mockResolvedValue(true);
    eventManager.track({ type: EventType.CUSTOM, custom_event: { name: 'will_succeed' } });
    expect(eventManager['sendTimeoutId']).not.toBeNull();

    const result = await eventManager.flushImmediately();

    expect(result).toBe(true);
    expect(eventManager.getQueueLength()).toBe(0);
    expect(eventManager['sendTimeoutId']).toBeNull();
  });

  it('defers a multi-session critical flush behind an in-flight async send and drains both batches on settle', async () => {
    // Same multi-session scenario, but a periodic async send is mid-flight
    // when the critical event arrives. The sync call must defer; on settle,
    // the deferred re-flush emits one sendBeacon batch per remaining session.
    eventManager['set']('sessionId', 'session-old');
    eventManager.track({ type: EventType.CUSTOM, custom_event: { name: 'old_a' } });

    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    customSender.sendEventsQueue.mockImplementation(async () => {
      await gate;
      return true;
    });

    // Periodic-style send claims sendInProgress while session-old is queued.
    const periodic = eventManager['sendEventsQueue']();
    await Promise.resolve();
    expect(eventManager['sendInProgress']).toBe(true);

    // Session renewal mid-fetch, then a critical event in the new session.
    eventManager['set']('sessionId', 'session-new');
    eventManager.track({ type: EventType.CUSTOM, custom_event: { name: 'critical_purchase' } });
    const syncResult = eventManager.flushImmediatelySync();

    expect(syncResult).toBe(false);
    expect(customSender.sendEventsQueueSync).not.toHaveBeenCalled();
    expect(eventManager['pendingSyncFlush']).toBe(true);

    release();
    await periodic;

    // Deferred re-flush runs in the async finally. The periodic send already
    // removed session-old's event optimistically, so only session-new remains
    // and sendBeacon fires exactly once for it.
    expect(customSender.sendEventsQueueSync).toHaveBeenCalledTimes(1);
    const [batchArg] = customSender.sendEventsQueueSync.mock.calls[0]!;
    expect((batchArg as EventsQueue).session_id).toBe('session-new');
    expect(eventManager['pendingSyncFlush']).toBe(false);
    expect(eventManager.getQueueLength()).toBe(0);
  });
});
