/**
 * Integration: stress concurrency for critical events
 *
 * Simulates rapid-fire bursts of critical events and verifies:
 *   1. Every critical event that survives validation reaches the dedicated
 *      single-event beacon (Concern #1B / Plan #2).
 *   2. `sendInProgress` correctly serializes — no overlapping async sends.
 *   3. The deferred re-flush mechanism (Concern #1 / Plan #1) actually fires
 *      when sync flushes hit the in-flight guard.
 *   4. The library's own rate limiting silently drops the dedicated beacon
 *      for events that don't reach the queue (cannot send the *previous*
 *      last event under a critical name — misattribution would be worse than
 *      drop).
 *
 * To keep the bursts realistic without fighting the library's 50 events/sec
 * global rate limit, we reset the rate-limit window between waves via the
 * private accessor. This is a test-only hatch; production code never touches
 * the counter directly.
 *
 * Backend idempotency by `event.id` is the documented contract.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';
import { initTestBridge, destroyTestBridge } from '../../helpers/bridge.helper';
import { createMockFetch } from '../../helpers/mocks.helper';
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

describe('Integration: stress concurrency for critical events', () => {
  let bridge: TraceLogTestBridge;

  beforeEach(async () => {
    setupTestEnvironment();
    global.fetch = createMockFetch({ ok: true, status: 200 });
    bridge = await initTestBridge({
      integrations: { custom: { collectApiUrl: 'https://api.test.com/collect' } },
    });
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();
  });

  it('every critical event that survives validation reaches the dedicated beacon', () => {
    const em = bridge.getEventManager()!;
    const dedicatedCalls: Array<{ name: string }> = [];

    const originalDedicated = em.flushLastEventSync.bind(em);
    em.flushLastEventSync = (): boolean => {
      const last = (em as unknown as { eventsQueue: Array<{ custom_event?: { name: string } }> }).eventsQueue.at(-1);
      const name = last?.custom_event?.name;
      if (name !== undefined && name.length > 0) {
        dedicatedCalls.push({ name });
      }
      return originalDedicated();
    };

    // Fire 5 waves of 10 events each (5 critical per wave), resetting the
    // rate-limit window between waves so all events pass validation.
    const WAVES = 5;
    const PER_WAVE = 10;
    const expectedCriticalNames: string[] = [];
    for (let wave = 0; wave < WAVES; wave++) {
      resetRateLimit(em);
      for (let i = 0; i < PER_WAVE; i++) {
        const isCritical = i % 2 === 1;
        const name = isCritical ? `critical_w${wave}_i${i}` : `regular_w${wave}_i${i}`;
        bridge.event(name, { wave, i }, isCritical ? { critical: true } : undefined);
        if (isCritical) {
          expectedCriticalNames.push(name);
        }
      }
    }

    expect(dedicatedCalls).toHaveLength(expectedCriticalNames.length);
    expect(dedicatedCalls.map((c) => c.name)).toEqual(expectedCriticalNames);
  });

  it('serializes concurrent flushes — critical events tracked mid-fetch defer correctly', async () => {
    const em = bridge.getEventManager()!;

    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    let sendCalls = 0;
    const sender = (em as unknown as { dataSenders: Array<{ sendEventsQueue: (..._: unknown[]) => Promise<boolean> }> })
      .dataSenders[0]!;
    sender.sendEventsQueue = vi.fn(async () => {
      sendCalls++;
      await gate;
      return true;
    }) as unknown as typeof sender.sendEventsQueue;

    // Small fill: a couple of events to have something to flush.
    bridge.event('fill_1');
    bridge.event('fill_2');

    const inFlight = em.flushImmediately();
    // Microtask boundary so sendInProgress is set before the next call inspects it.
    await Promise.resolve();
    expect(em['sendInProgress']).toBe(true);

    // Critical event tracked mid-flight. Its flushImmediatelySync sees
    // sendInProgress=true and defers (pendingSyncFlush=true). The dedicated
    // beacon (flushLastEventSync) runs synchronously regardless.
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

  it('drops critical=true silently when the event is filtered (per-event rate limit)', () => {
    const em = bridge.getEventManager()!;
    const dedicatedSpy = vi.spyOn(em, 'flushLastEventSync');

    // Burn the per-event rate limit (MAX_SAME_EVENT_PER_MINUTE = 60 for same name).
    // Resetting global rate-limit window so the per-event limiter is the only one in play.
    for (let i = 0; i < 60; i++) {
      resetRateLimit(em);
      bridge.event('same_name', { i });
    }
    dedicatedSpy.mockClear();

    resetRateLimit(em);
    bridge.event('same_name', { i: 61 }, { critical: true });

    // Filtered before queueing → no dedicated beacon. Critical correctness:
    // sending the *previously last* event under the critical name would
    // misattribute the conversion. Silent drop is the right behaviour.
    expect(dedicatedSpy).not.toHaveBeenCalled();
  });
});
