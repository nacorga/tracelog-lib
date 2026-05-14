/**
 * TimeManager - Coverage Tests
 *
 * Verifies monotonic-clock-based timestamps (immune to wall-clock changes
 * during the session) and the validateTimestamp() future-skew guard.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';
import { TimeManager } from '../../../src/managers/time.manager';

describe('TimeManager - now()', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });
  afterEach(() => {
    cleanupTestEnvironment();
  });

  it('returns a timestamp close to Date.now() at boot', () => {
    const tm = new TimeManager();
    const t = tm.now();
    expect(Math.abs(t - Date.now())).toBeLessThan(100);
  });

  it('advances monotonically across calls', () => {
    const tm = new TimeManager();
    const a = tm.now();
    // Busy-wait a tiny bit to force performance.now() to advance.
    const start = performance.now();
    while (performance.now() - start < 2) {
      /* spin */
    }
    const b = tm.now();
    expect(b).toBeGreaterThanOrEqual(a);
  });

  it('uses performance.now() delta, ignoring later Date.now() changes', () => {
    const realPerf = performance.now.bind(performance);
    const realDate = Date.now;

    // Capture boot at known refs.
    const bootPerf = 1000;
    const bootDate = 1_700_000_000_000;
    let perfCounter = bootPerf;
    performance.now = vi.fn(() => perfCounter);
    Date.now = vi.fn(() => bootDate);

    const tm = new TimeManager();

    // Advance performance by 250ms while dragging Date.now() backwards.
    perfCounter = bootPerf + 250;
    Date.now = vi.fn(() => bootDate - 10_000); // wall clock jumped back

    expect(tm.now()).toBe(bootDate + 250);

    performance.now = realPerf;
    Date.now = realDate;
  });
});

describe('TimeManager - validateTimestamp()', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });
  afterEach(() => {
    cleanupTestEnvironment();
  });

  it('accepts timestamps at or before now()', () => {
    const tm = new TimeManager();
    const now = tm.now();
    expect(tm.validateTimestamp(now).valid).toBe(true);
    expect(tm.validateTimestamp(now - 60_000).valid).toBe(true);
  });

  it('accepts timestamps within the 2-minute future window', () => {
    const tm = new TimeManager();
    const future = tm.now() + 90_000; // 1.5 min
    expect(tm.validateTimestamp(future).valid).toBe(true);
  });

  it('rejects timestamps more than 2 minutes in the future', () => {
    const tm = new TimeManager();
    const farFuture = tm.now() + 3 * 60_000; // 3 min
    const result = tm.validateTimestamp(farFuture);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/in the future/);
  });
});
