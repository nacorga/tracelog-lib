/**
 * Error Throttling Integration Tests
 *
 * Verifies the per-pageview signature cap is enforced end-to-end through the
 * App -> ErrorHandler -> EventManager pipeline. Asserts at the queue boundary
 * so any future change that lets throttled errors slip past `track()` will fail
 * here.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';
import { destroyTestBridge, initTestBridge } from '../../helpers/bridge.helper';
import { MAX_ERRORS_PER_SIGNATURE_PER_PAGEVIEW } from '../../../src/constants/error.constants';
import type { TraceLogTestBridge } from '../../../src/types';

describe('Integration: Error Throttling (per-pageview signature cap)', () => {
  let bridge: TraceLogTestBridge;

  beforeEach(async () => {
    setupTestEnvironment();
    bridge = await initTestBridge();
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();
  });

  function fireSameSignatureError(idx: number): void {
    // Distinct numeric content so the 5s identical-message suppression window does
    // not absorb the bursts, but the normalized signature still collapses to one.
    window.dispatchEvent(
      new ErrorEvent('error', {
        message: `Failed to load resource 1${String(idx).padStart(4, '0')}`,
        filename: 'app.js',
        lineno: 42,
      }),
    );
  }

  function getErrorEventCount(): number {
    return bridge.getQueueEvents().filter((event) => event.type === 'error').length;
  }

  it('keeps exactly MAX_ERRORS_PER_SIGNATURE_PER_PAGEVIEW events in the queue when many share a signature', () => {
    for (let i = 1; i <= 20; i += 1) {
      fireSameSignatureError(i);
    }

    expect(getErrorEventCount()).toBe(MAX_ERRORS_PER_SIGNATURE_PER_PAGEVIEW);
  });

  it('does not affect events with distinct signatures', () => {
    const distinct = [
      { message: 'Boom A', filename: 'a.js', lineno: 1 },
      { message: 'Boom B', filename: 'b.js', lineno: 1 },
      { message: 'Boom C', filename: 'c.js', lineno: 1 },
      { message: 'Boom D', filename: 'd.js', lineno: 1 },
      { message: 'Boom E', filename: 'e.js', lineno: 1 },
    ];

    distinct.forEach((spec) => {
      window.dispatchEvent(new ErrorEvent('error', spec));
    });

    expect(getErrorEventCount()).toBe(distinct.length);
  });

  it('resets the cap on pagehide so a navigated-to page can capture errors again', () => {
    // App also flushes the queue on pagehide, so we use a live listener to count
    // tracked error events instead of relying on the queue snapshot.
    const emittedErrors: unknown[] = [];
    bridge.on('event', (event) => {
      if (event.type === 'error') emittedErrors.push(event);
    });

    for (let i = 1; i <= 5; i += 1) {
      fireSameSignatureError(i);
    }
    expect(emittedErrors).toHaveLength(MAX_ERRORS_PER_SIGNATURE_PER_PAGEVIEW);

    window.dispatchEvent(new Event('pagehide'));

    for (let i = 6; i <= 10; i += 1) {
      fireSameSignatureError(i);
    }

    expect(emittedErrors).toHaveLength(MAX_ERRORS_PER_SIGNATURE_PER_PAGEVIEW * 2);
  });
});
