/**
 * Shopify Cart Linker Integration Tests
 * Focus: Session rotation triggers cart attribute re-sync via emitter wiring in App
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';
import { initTestBridge, destroyTestBridge } from '../../helpers/bridge.helper';

/**
 * SaaS integration requires a non-localhost hostname.
 * Mock window.location so generateSaasApiUrl() works in jsdom.
 */
function mockProductionHostname(): void {
  delete (window as any).location;
  (window as any).location = {
    href: 'https://shop.example.com/',
    hostname: 'shop.example.com',
    pathname: '/',
    search: '',
    hash: '',
    origin: 'https://shop.example.com',
    protocol: 'https:',
  };
}

function getCartCalls(spy: ReturnType<typeof vi.fn>): Array<[string, { body: string }]> {
  return spy.mock.calls.filter((call: unknown[]) => call[0] === '/cart/update.js') as Array<[string, { body: string }]>;
}

function parseAttributes(call: [string, { body: string }]): Record<string, string> {
  return (JSON.parse(call[1].body) as { attributes: Record<string, string> }).attributes;
}

function parseSessionId(call: [string, { body: string }]): string {
  return parseAttributes(call).tracelog_session_id!;
}

describe('Integration: Shopify Cart Linker', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setupTestEnvironment();
    mockProductionHostname();
    fetchSpy = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    global.fetch = fetchSpy;
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();
  });

  it('should sync cart attributes on init with shopify enabled (sessionId + userId)', async () => {
    await initTestBridge({
      integrations: {
        tracelog: { projectId: 'test-proj', shopify: true },
      },
    });

    const cartCalls = getCartCalls(fetchSpy);
    expect(cartCalls).toHaveLength(1);

    const attributes = parseAttributes(cartCalls[0]!);
    expect(attributes.tracelog_session_id).toBeDefined();
    expect(typeof attributes.tracelog_session_id).toBe('string');
    expect(attributes.tracelog_user_id).toBeDefined();
    expect(typeof attributes.tracelog_user_id).toBe('string');
  });

  it('should not call /cart/update.js when shopify is not enabled', async () => {
    await initTestBridge({
      integrations: {
        tracelog: { projectId: 'test-proj' },
      },
    });

    const cartCalls = getCartCalls(fetchSpy);
    expect(cartCalls).toHaveLength(0);
  });

  it('should re-sync cart attribute when session rotates', async () => {
    vi.useFakeTimers();

    await initTestBridge({
      sessionTimeout: 500,
      integrations: {
        tracelog: { projectId: 'test-proj', shopify: true },
      },
    });

    const initialCartCalls = getCartCalls(fetchSpy);
    expect(initialCartCalls).toHaveLength(1);
    const firstSessionId = parseSessionId(initialCartCalls[0]!);

    // Expire session timeout
    await vi.advanceTimersByTimeAsync(600);
    await vi.runOnlyPendingTimersAsync();

    // Trigger activity to cause session renewal
    document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await vi.advanceTimersByTimeAsync(200);
    await vi.runOnlyPendingTimersAsync();

    const allCartCalls = getCartCalls(fetchSpy);
    expect(allCartCalls.length).toBeGreaterThanOrEqual(2);

    const lastCall = allCartCalls[allCartCalls.length - 1]!;
    const secondSessionId = parseSessionId(lastCall);
    expect(secondSessionId).not.toBe(firstSessionId);

    vi.useRealTimers();
  });
});
