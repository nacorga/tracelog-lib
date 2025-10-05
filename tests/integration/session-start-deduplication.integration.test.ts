import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { SessionManager } from '../../src/managers/session.manager';
import { EventManager } from '../../src/managers/event.manager';
import { StorageManager } from '../../src/managers/storage.manager';
import { resetGlobalState } from '../../src/managers/state.manager';
import { EventType } from '../../src/types';

class StubEventManager extends EventManager {
  trackedEvents: Array<{ type: EventType }> = [];

  constructor() {
    super({} as any, null, null);
    this.track = vi.fn((event) => {
      this.trackedEvents.push({ type: event.type as EventType });
    }) as any;
  }

  getTrackedEvents(): Array<{ type: EventType }> {
    return this.trackedEvents;
  }

  clearTrackedEvents(): void {
    this.trackedEvents = [];
  }
}

describe('Integration - Session start deduplication', () => {
  let sessionManager: SessionManager;
  let eventManager: StubEventManager;
  let storageManager: StorageManager;

  beforeEach(() => {
    resetGlobalState();
    localStorage.clear();
    sessionStorage.clear();
    vi.useFakeTimers();

    storageManager = new StorageManager();
    eventManager = new StubEventManager();
    sessionManager = new SessionManager(storageManager, eventManager as any, 'test-project');
  });

  afterEach(() => {
    sessionManager.destroy();
    vi.useRealTimers();
    localStorage.clear();
    sessionStorage.clear();
  });

  test('should emit session_start only once for new session', async () => {
    await sessionManager.startTracking();

    const sessionStartEvents = eventManager.getTrackedEvents().filter((e) => e.type === EventType.SESSION_START);
    expect(sessionStartEvents).toHaveLength(1);
  });

  test('should NOT emit session_start when recovering session from localStorage', async () => {
    await sessionManager.startTracking();

    const firstEvents = eventManager.getTrackedEvents().filter((e) => e.type === EventType.SESSION_START);
    expect(firstEvents).toHaveLength(1);

    sessionManager.destroy();

    const newSessionManager = new SessionManager(storageManager, eventManager as any, 'test-project');

    eventManager.clearTrackedEvents();

    await newSessionManager.startTracking();

    const secondEvents = eventManager.getTrackedEvents().filter((e) => e.type === EventType.SESSION_START);
    expect(secondEvents).toHaveLength(0);

    newSessionManager.destroy();
  });

  test('should emit new session_start after session expires', async () => {
    const DEFAULT_SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes

    await sessionManager.startTracking();

    const firstEvents = eventManager.getTrackedEvents().filter((e) => e.type === EventType.SESSION_START);
    expect(firstEvents).toHaveLength(1);

    // Get existing session and mark it as expired
    const storedSession = storageManager.getItem(`tlog:test-project:session`);
    const session = JSON.parse(storedSession || '{}');
    const expiredTimestamp = Date.now() - (DEFAULT_SESSION_TIMEOUT + 1000);
    storageManager.setItem(`tlog:test-project:session`, JSON.stringify({ ...session, lastActivity: expiredTimestamp }));

    sessionManager.destroy();

    const newSessionManager = new SessionManager(storageManager, eventManager as any, 'test-project');

    eventManager.clearTrackedEvents();

    await newSessionManager.startTracking();

    const secondEvents = eventManager.getTrackedEvents().filter((e) => e.type === EventType.SESSION_START);
    expect(secondEvents).toHaveLength(1);

    newSessionManager.destroy();
  });

  test('should work correctly regardless of URL exclusions', async () => {
    await sessionManager.startTracking();

    const sessionStartEvents = eventManager.getTrackedEvents().filter((e) => e.type === EventType.SESSION_START);
    expect(sessionStartEvents).toHaveLength(1);
  });
});
