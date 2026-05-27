/**
 * Click-ID attribution integration tests.
 *
 * Focus: ad-network click identifiers captured from the landing URL must flow
 * through to EVERY event payload as `click_ids` — the field the backend reads to
 * classify a session's traffic source as Paid. The unit test covers extraction
 * from the URL; this asserts the captured value actually reaches the queued events.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';
import { initTestBridge, destroyTestBridge, getQueueState } from '../../helpers/bridge.helper';
import type { TraceLogTestBridge } from '../../../src/types';

const originalLocation = window.location;

/** Mock the landing URL (standalone runs on localhost, so hostname stays localhost). */
const mockLanding = (search: string): void => {
  delete (window as any).location;
  (window as any).location = {
    href: `http://localhost:3000/${search}`,
    hostname: 'localhost',
    pathname: '/',
    search,
    hash: '',
    origin: 'http://localhost:3000',
    protocol: 'http:',
  };
};

describe('Integration: Click-ID attribution', () => {
  let bridge: TraceLogTestBridge;

  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    destroyTestBridge();
    (window as any).location = originalLocation;
    cleanupTestEnvironment();
  });

  it('attaches click_ids captured from the landing URL to every event', async () => {
    mockLanding('?gclid=abc123&fbclid=f1');
    bridge = await initTestBridge();

    bridge.event('checkout', { step: 1 });

    const events = getQueueState(bridge).events;
    expect(events.length).toBeGreaterThan(0);

    // SESSION_START, PAGE_VIEW and the custom event all carry the same
    // session-level click_ids (captured once at session start).
    for (const event of events) {
      expect(event.click_ids).toEqual({ gclid: 'abc123', fbclid: 'f1' });
    }
  });

  it('omits click_ids entirely when the landing URL has none', async () => {
    mockLanding('?utm_source=newsletter');
    bridge = await initTestBridge();

    bridge.event('checkout', { step: 1 });

    for (const event of getQueueState(bridge).events) {
      expect(event.click_ids).toBeUndefined();
    }
  });

  it('persists click_ids into the stored session and restores them on recovery', async () => {
    mockLanding('?gclid=abc123');
    bridge = await initTestBridge();

    const sessionKey = Object.keys(localStorage).find((key) => key.endsWith(':session'))!;
    const stored = JSON.parse(localStorage.getItem(sessionKey) ?? '{}');
    expect(stored.clickIds).toEqual({ gclid: 'abc123' });

    // Reload on a URL WITHOUT the gclid: recovery must restore click_ids from storage,
    // not re-read the (now empty) URL.
    bridge.destroy(false);
    localStorage.setItem(sessionKey, JSON.stringify(stored));
    mockLanding('');

    bridge = await initTestBridge();
    bridge.event('checkout', { step: 2 });

    const events = getQueueState(bridge).events;
    expect(events.length).toBeGreaterThan(0);
    for (const event of events) {
      expect(event.click_ids).toEqual({ gclid: 'abc123' });
    }
  });
});
