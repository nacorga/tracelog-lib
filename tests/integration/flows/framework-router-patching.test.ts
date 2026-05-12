/**
 * Integration: framework router patching coexistence
 *
 * tracelog-lib patches `window.history.pushState` and `replaceState` inside
 * `PageViewHandler.startTracking()` to detect SPA route changes for any
 * client framework (Angular Router, React Router, Vue Router, vanilla). The
 * patch wraps the existing function, so multiple patches form a chain.
 *
 * These tests verify the chain mechanics: consumer-installed wrappers fire
 * in both directions (before/after tracelog init), and `destroy()` leaves
 * the consumer wrapper intact. Whether a `page_view` event is queued for a
 * given URL is covered by the dedicated page-view handler tests — here we
 * focus on the *wrapper chain*, which is framework-agnostic.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';
import { initTestBridge, destroyTestBridge } from '../../helpers/bridge.helper';
import { createMockFetch } from '../../helpers/mocks.helper';
import type { TraceLogTestBridge } from '../../../src/types';

describe('Integration: framework router patching coexistence', () => {
  let bridge: TraceLogTestBridge | null = null;
  let originalPushState: typeof window.history.pushState;
  let originalReplaceState: typeof window.history.replaceState;

  beforeEach(() => {
    setupTestEnvironment();
    global.fetch = createMockFetch({ ok: true, status: 200 });
    originalPushState = window.history.pushState.bind(window.history);
    originalReplaceState = window.history.replaceState.bind(window.history);
  });

  afterEach(() => {
    destroyTestBridge();
    bridge = null;
    window.history.pushState = originalPushState;
    window.history.replaceState = originalReplaceState;
    cleanupTestEnvironment();
  });

  it('consumer patch installed BEFORE tracelog init is still called when pushState fires', async () => {
    const consumerCalls: string[] = [];
    const native = window.history.pushState.bind(window.history);
    window.history.pushState = function (this: History, ...args: Parameters<typeof native>) {
      consumerCalls.push(String(args[2] ?? ''));
      native.apply(this, args);
    } as typeof native;

    bridge = await initTestBridge({
      integrations: { custom: { collectApiUrl: 'https://api.test.com/collect' } },
      pageViewThrottleMs: 0,
    });

    // After tracelog init, the public pushState is tracelog's wrapper. Calling
    // it must drill into the consumer wrapper (which holds the native call).
    window.history.pushState({}, '', '/consumer-then-tracelog');

    expect(consumerCalls).toContain('/consumer-then-tracelog');
  });

  it('consumer patch installed AFTER tracelog init still runs on every pushState', async () => {
    bridge = await initTestBridge({
      integrations: { custom: { collectApiUrl: 'https://api.test.com/collect' } },
      pageViewThrottleMs: 0,
    });

    // Consumer wraps the tracelog-installed wrapper. Both should fire.
    const consumerCalls: string[] = [];
    const tracelogPatched = window.history.pushState.bind(window.history);
    window.history.pushState = function (this: History, ...args: Parameters<typeof tracelogPatched>) {
      consumerCalls.push(String(args[2] ?? ''));
      tracelogPatched.apply(this, args);
    } as typeof tracelogPatched;

    window.history.pushState({}, '', '/tracelog-then-consumer');

    expect(consumerCalls).toContain('/tracelog-then-consumer');
  });

  it('replaceState patch chain works the same way as pushState', async () => {
    const consumerCalls: string[] = [];
    const native = window.history.replaceState.bind(window.history);
    window.history.replaceState = function (this: History, ...args: Parameters<typeof native>) {
      consumerCalls.push(String(args[2] ?? ''));
      native.apply(this, args);
    } as typeof native;

    bridge = await initTestBridge({
      integrations: { custom: { collectApiUrl: 'https://api.test.com/collect' } },
      pageViewThrottleMs: 0,
    });

    window.history.replaceState({}, '', '/replace-consumer-then-tracelog');

    expect(consumerCalls).toContain('/replace-consumer-then-tracelog');
  });

  it('destroy() leaves the consumer wrapper active — next pushState still fires consumer', async () => {
    const consumerCalls: string[] = [];
    const native = window.history.pushState.bind(window.history);
    const consumerWrapper = function (this: History, ...args: Parameters<typeof native>): void {
      consumerCalls.push(`consumer:${String(args[2] ?? '')}`);
      native.apply(this, args);
    };
    window.history.pushState = consumerWrapper as typeof native;

    bridge = await initTestBridge({
      integrations: { custom: { collectApiUrl: 'https://api.test.com/collect' } },
      pageViewThrottleMs: 0,
    });

    // Tracelog has wrapped the consumer wrapper. The public reference is no
    // longer the consumer wrapper directly. (Reading the method as a property
    // for identity comparison — not invoking it — so unbound-method lint
    // warning does not apply.)
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(window.history.pushState).not.toBe(consumerWrapper);

    bridge.destroy(true);
    bridge = null;

    // After destroy, the next pushState call must still drill into the
    // consumer's wrapper (tracelog must not have left a dangling wrapper that
    // bypasses or swallows the consumer's logic).
    window.history.pushState({}, '', '/after-destroy');
    expect(consumerCalls).toContain('consumer:/after-destroy');
  });
});
