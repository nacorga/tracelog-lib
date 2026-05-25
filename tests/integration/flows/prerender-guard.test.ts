/**
 * Pre-render guard integration tests.
 *
 * A page being pre-rendered/prefetched (Speculation Rules API) must emit ZERO
 * events until activation, so a never-activated prerender never creates a
 * server-side session. The server upserts a session from ANY event with a
 * session_id (not only SESSION_START), so the guard must suppress the initial
 * PAGE_VIEW too — not just SESSION_START.
 *
 * Covers both halves of the guard working together:
 * - SessionManager defers its SESSION_START emit + session listeners.
 * - App defers the interaction handlers (page view, click, ...).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';
import { initTestBridge, destroyTestBridge, getQueueState } from '../../helpers/bridge.helper';
import type { TraceLogTestBridge } from '../../../src/types';

const setPrerendering = (value: boolean): void => {
  Object.defineProperty(document, 'prerendering', { configurable: true, writable: true, value });
};

const clearPrerendering = (): void => {
  delete (document as { prerendering?: boolean }).prerendering;
};

const activate = (): void => {
  setPrerendering(false);
  document.dispatchEvent(new Event('prerenderingchange'));
};

const countType = (bridge: TraceLogTestBridge, type: string): number =>
  getQueueState(bridge).events.filter((e) => e.type === type).length;

describe('Integration: Pre-render guard', () => {
  let bridge: TraceLogTestBridge;

  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    destroyTestBridge();
    clearPrerendering();
    cleanupTestEnvironment();
  });

  it('allocates a sessionId but emits zero events while pre-rendering', async () => {
    setPrerendering(true);
    bridge = await initTestBridge();

    // init() must still return a real sessionId (read by consumers).
    expect(bridge.get('sessionId')).toBeTruthy();

    // But nothing may be emitted yet — neither SESSION_START nor the initial PAGE_VIEW.
    expect(getQueueState(bridge).events).toHaveLength(0);
  });

  it('emits exactly one SESSION_START and the PAGE_VIEW on activation', async () => {
    setPrerendering(true);
    bridge = await initTestBridge();

    expect(countType(bridge, 'session_start')).toBe(0);
    expect(countType(bridge, 'page_view')).toBe(0);

    activate();

    expect(countType(bridge, 'session_start')).toBe(1);
    expect(countType(bridge, 'page_view')).toBeGreaterThanOrEqual(1);
  });

  it('emits SESSION_START only once even if prerenderingchange fires repeatedly', async () => {
    setPrerendering(true);
    bridge = await initTestBridge();

    activate();
    document.dispatchEvent(new Event('prerenderingchange'));
    document.dispatchEvent(new Event('prerenderingchange'));

    expect(countType(bridge, 'session_start')).toBe(1);
  });

  it('does not emit after a discarded prerender is destroyed before activation', async () => {
    setPrerendering(true);
    bridge = await initTestBridge();
    expect(getQueueState(bridge).events).toHaveLength(0);

    // Discard: tear down before the prerender is ever activated.
    bridge.destroy(true);

    // A late activation event must not resurrect tracking or throw.
    expect(() => {
      activate();
    }).not.toThrow();
  });

  it('behaves exactly as today when not pre-rendering (control)', async () => {
    // document.prerendering is undefined → normal path.
    bridge = await initTestBridge();

    expect(bridge.get('sessionId')).toBeTruthy();
    expect(countType(bridge, 'session_start')).toBe(1);
    expect(countType(bridge, 'page_view')).toBeGreaterThanOrEqual(1);
  });
});
