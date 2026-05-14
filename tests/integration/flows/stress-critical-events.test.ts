/**
 * Integration: stress concurrency for critical events
 *
 * Simulates rapid-fire bursts of critical events and verifies:
 *   1. `sendInProgress` correctly serializes — no overlapping async sends.
 *   2. The deferred re-flush mechanism actually fires when sync flushes hit
 *      the in-flight guard (so critical events tracked mid-fetch are not
 *      stranded in the queue).
 *
 * To keep the bursts realistic without fighting the library's 50 events/sec
 * global rate limit, we reset the rate-limit window between waves via the
 * private accessor. This is a test-only hatch; production code never touches
 * the counter directly.
 *
 * v3.0 note: backend integration only initialises a SenderManager when
 * `integrations.tracelog.projectId` is set on a non-localhost host. Since
 * jsdom runs on localhost, we instead inject a fake sender into the
 * `dataSenders` array after init to exercise the coordination between
 * EventManager and SenderManager without depending on a real backend URL.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';
import { initTestBridge, destroyTestBridge } from '../../helpers/bridge.helper';
import type { TraceLogTestBridge } from '../../../src/types';

/**
 * Reset the global per-second rate-limit window so tests can simulate bursts
 * without colliding with the production safety cap (50 events/sec).
 */
function resetRateLimit(em: ReturnType<TraceLogTestBridge['getEventManager']>): void {
  if (!em) return;
  (em as unknown as { rateLimitCounter: number; rateLimitWindowStart: number }).rateLimitCounter = 0;
  (em as unknown as { rateLimitCounter: number; rateLimitWindowStart: number }).rateLimitWindowStart = Date.now();
}

interface FakeSender {
  sendEventsQueue: ReturnType<typeof vi.fn>;
  sendEventsQueueSync: ReturnType<typeof vi.fn>;
  recoverPersistedEvents: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
}

function attachFakeSender(em: ReturnType<TraceLogTestBridge['getEventManager']>, sender: FakeSender): void {
  if (!em) return;
  const senders = (em as unknown as { dataSenders: FakeSender[] }).dataSenders;
  senders.length = 0;
  senders.push(sender);
}

describe('Integration: stress concurrency for critical events', () => {
  let bridge: TraceLogTestBridge;

  beforeEach(async () => {
    setupTestEnvironment();
    bridge = await initTestBridge();
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();
  });

  it('serializes concurrent flushes — critical events tracked mid-fetch defer correctly', async () => {
    const em = bridge.getEventManager()!;

    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    let sendCalls = 0;
    const fakeSender: FakeSender = {
      sendEventsQueue: vi.fn(async () => {
        sendCalls++;
        await gate;
        return true;
      }),
      sendEventsQueueSync: vi.fn(() => true),
      recoverPersistedEvents: vi.fn(async () => {}),
      stop: vi.fn(),
    };
    attachFakeSender(em, fakeSender);

    // Small fill: a couple of events to have something to flush.
    bridge.event('fill_1');
    bridge.event('fill_2');

    const inFlight = em.flushImmediately();
    // Microtask boundary so sendInProgress is set before the next call inspects it.
    await Promise.resolve();
    expect(em['sendInProgress']).toBe(true);

    // Critical event tracked mid-flight. Its flushImmediatelySync sees
    // sendInProgress=true and defers (pendingSyncFlush=true).
    resetRateLimit(em);
    bridge.event('critical_now', { i: 1 }, { critical: true });

    expect(sendCalls).toBe(1);
    expect(em['pendingSyncFlush']).toBe(true);

    release();
    await inFlight;

    // No duplicate fetch: sendEventsQueue (fetch) was only called once. The
    // deferred sync flush in the finally block used sendBeacon, not fetch.
    expect(sendCalls).toBe(1);
    expect(em['pendingSyncFlush']).toBe(false);
  });

  it('does nothing extra when critical=true is dropped before queueing (per-event rate limit)', () => {
    const em = bridge.getEventManager()!;
    const flushSpy = vi.spyOn(em, 'flushImmediatelySync');

    // Burn the per-event rate limit (MAX_SAME_EVENT_PER_MINUTE = 60 for same name).
    for (let i = 0; i < 60; i++) {
      resetRateLimit(em);
      bridge.event('same_name', { i });
    }
    flushSpy.mockClear();

    resetRateLimit(em);
    bridge.event('same_name', { i: 61 }, { critical: true });

    // The event is filtered before queueing. flushImmediatelySync is still
    // called (sendCustomEvent unconditionally calls it for critical=true) but
    // it just drains whatever else is in the queue — there is nothing extra
    // to do, and no risk of misattribution because the dropped event simply
    // never made it onto the queue.
    expect(flushSpy).toHaveBeenCalledTimes(1);
  });
});
