/**
 * EventManager - Session-Aware Queue Tests
 *
 * Verifies that each event freezes its `_session_id` at `track()` time, that
 * `buildBatchesWithIds()` groups events by session_id and emits N batches when
 * the queue spans multiple sessions, and that the `_session_id` field never
 * leaks to the wire (backend uses `forbidNonWhitelisted: true`).
 *
 * Regression coverage for the production bug where session-timeout +
 * page-unload produced batches with `session_id: null` rejected by the backend.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';
import { MOCK_DEVICE_INFO } from '../../helpers/fixtures.helper';
import { EventManager } from '../../../src/managers/event.manager';
import { StorageManager } from '../../../src/managers/storage.manager';
import { EventType } from '../../../src/types';
import type { EventsQueue, QueuedEvent } from '../../../src/types';
import { Emitter } from '../../../src/utils';

type Planned = Array<{ batch: EventsQueue; eventIds: string[] }>;

const plannedBatches = (planned: Planned): EventsQueue[] => planned.map((p) => p.batch);

describe('EventManager - Session-Aware Queue', () => {
  let eventManager: EventManager;
  let storageManager: StorageManager;
  let emitter: Emitter;

  beforeEach(() => {
    setupTestEnvironment();
    storageManager = new StorageManager();
    emitter = new Emitter();
    eventManager = new EventManager(storageManager, emitter, {});

    eventManager['set']('userId', 'user-test');
    eventManager['set']('device', MOCK_DEVICE_INFO);
    eventManager['set']('pageUrl', 'https://example.com/test');
  });

  afterEach(() => {
    eventManager.stop();
    cleanupTestEnvironment();
  });

  it('freezes _session_id on each event at track() time', () => {
    eventManager['set']('sessionId', 'session-A');

    eventManager.track({
      type: EventType.CUSTOM,
      custom_event: { name: 'event_A' },
    });

    const queue = eventManager['eventsQueue'];
    expect(queue).toHaveLength(1);
    expect((queue[0] as QueuedEvent)?._session_id).toBe('session-A');
  });

  it('returns 1 batch when all events share one session_id', () => {
    eventManager['set']('sessionId', 'session-only');

    eventManager.track({ type: EventType.CUSTOM, custom_event: { name: 'a' } });
    eventManager.track({ type: EventType.CUSTOM, custom_event: { name: 'b' } });
    eventManager.track({ type: EventType.CUSTOM, custom_event: { name: 'c' } });

    const batches = plannedBatches(eventManager['buildBatchesWithIds']());

    expect(batches).toHaveLength(1);
    expect(batches[0]?.session_id).toBe('session-only');
    expect(batches[0]?.events).toHaveLength(3);
  });

  it('returns N batches in queued order when sessions span renewal', () => {
    eventManager['set']('sessionId', 'session-old');
    eventManager.track({ type: EventType.CUSTOM, custom_event: { name: 'old_a' } });
    eventManager.track({ type: EventType.CUSTOM, custom_event: { name: 'old_b' } });
    eventManager.track({ type: EventType.CUSTOM, custom_event: { name: 'old_c' } });

    // Simulate enterRenewalMode → renewSession: state sessionId switches.
    eventManager['set']('sessionId', 'session-new');
    eventManager.track({ type: EventType.CUSTOM, custom_event: { name: 'new_a' } });
    eventManager.track({ type: EventType.CUSTOM, custom_event: { name: 'new_b' } });

    const planned = eventManager['buildBatchesWithIds']();
    const batches = plannedBatches(planned);

    expect(batches).toHaveLength(2);
    expect(batches[0]?.session_id).toBe('session-old');
    expect(batches[0]?.events).toHaveLength(3);
    expect(planned[0]!.eventIds).toHaveLength(3);
    expect(batches[1]?.session_id).toBe('session-new');
    expect(batches[1]?.events).toHaveLength(2);
    expect(planned[1]!.eventIds).toHaveLength(2);
  });

  it('emits batch with the original session_id when state.sessionId is null after renewal', () => {
    eventManager['set']('sessionId', 'session-old');
    eventManager.track({ type: EventType.CUSTOM, custom_event: { name: 'pre_idle_a' } });
    eventManager.track({ type: EventType.CUSTOM, custom_event: { name: 'pre_idle_b' } });

    // Simulate enterRenewalMode after 15min idle: state sessionId nulled, queue
    // intact. This is the exact production scenario that used to emit
    // session_id: null to the wire.
    eventManager['set']('sessionId', null);

    const batches = plannedBatches(eventManager['buildBatchesWithIds']());

    expect(batches).toHaveLength(1);
    expect(batches[0]?.session_id).toBe('session-old');
    expect(batches[0]?.events).toHaveLength(2);
  });

  it('strips _session_id from events[] in the wrapper', () => {
    eventManager['set']('sessionId', 'session-strip');
    eventManager.track({ type: EventType.CUSTOM, custom_event: { name: 'strip_test' } });

    const batches = plannedBatches(eventManager['buildBatchesWithIds']());
    expect(batches).toHaveLength(1);
    for (const event of batches[0]!.events) {
      expect(Object.keys(event)).not.toContain('_session_id');
    }
  });

  it('getQueueEvents() does not expose _session_id to public consumers', () => {
    eventManager['set']('sessionId', 'session-public-api');
    eventManager.track({ type: EventType.CUSTOM, custom_event: { name: 'public' } });

    const events = eventManager.getQueueEvents();
    expect(events).toHaveLength(1);
    expect(Object.keys(events[0]!)).not.toContain('_session_id');
  });

  it('persisted batch JSON does not contain _session_id in events[]', () => {
    // The serialized form is what reaches localStorage / sendBeacon / fetch
    // body. Round-trip through JSON to mirror exactly what would hit the wire
    // and the backend's `forbidNonWhitelisted: true` validator.
    eventManager['set']('sessionId', 'session-serialize');
    eventManager.track({ type: EventType.CUSTOM, custom_event: { name: 'a' } });
    eventManager.track({ type: EventType.CUSTOM, custom_event: { name: 'b' } });

    const batches = plannedBatches(eventManager['buildBatchesWithIds']());
    const serialized = JSON.stringify(batches[0]);

    expect(serialized).not.toContain('_session_id');
    expect(serialized).toContain('"session_id":"session-serialize"');
  });

  it('self-heals by removing queue entries that lost their _session_id', () => {
    // Defense-in-depth: an internal invariant violation (raw EventData pushed
    // into the queue) should not block flush completion forever. The grouping
    // pass drops corrupted entries from `eventsQueue` so the system stays
    // flushable.
    eventManager['set']('sessionId', 'session-heal');
    eventManager.track({ type: EventType.CUSTOM, custom_event: { name: 'valid' } });

    // Push a corrupted entry directly into the private queue.
    eventManager['eventsQueue'].push({
      id: 'corrupted-1',
      type: EventType.CUSTOM,
      timestamp: Date.now(),
      page_url: 'https://example.com/test',
      custom_event: { name: 'corrupted' },
    } as QueuedEvent);

    expect(eventManager['eventsQueue']).toHaveLength(2);

    const planned = eventManager['buildBatchesWithIds']();

    // Only the valid event survives; the corrupted entry was dropped.
    expect(planned).toHaveLength(1);
    expect(planned[0]!.batch.events).toHaveLength(1);
    expect(eventManager['eventsQueue']).toHaveLength(1);
    expect(eventManager['eventsQueue'][0]?.id).not.toBe('corrupted-1');
  });
});
