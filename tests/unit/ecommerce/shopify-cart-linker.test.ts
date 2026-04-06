/**
 * ShopifyCartLinker Tests
 * Focus: Cart attribute sync lifecycle, dedup, session rotation, fetch failure
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';
import { resetGlobalState } from '../../../src/managers/state.manager';
import { ShopifyCartLinker } from '../../../src/ecommerce/shopify-cart-linker';

describe('ShopifyCartLinker - Activation', () => {
  let linker: ShopifyCartLinker;
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setupTestEnvironment();
    resetGlobalState();
    fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchSpy;
    linker = new ShopifyCartLinker();
  });

  afterEach(() => {
    linker.deactivate();
    cleanupTestEnvironment();
  });

  it('should POST sessionId to /cart/update.js on activate', () => {
    (linker as any).set('sessionId', 'sess-abc');
    linker.activate();

    expect(fetchSpy).toHaveBeenCalledWith('/cart/update.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attributes: { tracelog_session_id: 'sess-abc' } }),
      credentials: 'same-origin',
    });
  });

  it('should not fetch if sessionId is not set', () => {
    linker.activate();

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('should register visibilitychange listener on activate', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    linker.activate();

    expect(addSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
  });

  it('should be idempotent — calling activate twice does not leak listeners', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    const removeSpy = vi.spyOn(document, 'removeEventListener');

    (linker as any).set('sessionId', 'sess-1');
    linker.activate();
    linker.activate();

    // Second activate cleans up the first listener before registering a new one
    const addCalls = addSpy.mock.calls.filter(([e]) => e === 'visibilitychange');
    const removeCalls = removeSpy.mock.calls.filter(([e]) => e === 'visibilitychange');
    expect(addCalls).toHaveLength(2);
    expect(removeCalls).toHaveLength(1);

    // Deactivate cleans the remaining one
    linker.deactivate();
    const removeCallsAfter = removeSpy.mock.calls.filter(([e]) => e === 'visibilitychange');
    expect(removeCallsAfter).toHaveLength(2);
  });
});

describe('ShopifyCartLinker - Deactivation', () => {
  let linker: ShopifyCartLinker;

  beforeEach(() => {
    setupTestEnvironment();
    resetGlobalState();
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
    linker = new ShopifyCartLinker();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  it('should remove the exact visibilitychange handler on deactivate', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    linker.activate();

    const registered = addSpy.mock.calls.find(([event]) => event === 'visibilitychange');
    expect(registered).toBeDefined();
    const handler = registered![1];

    linker.deactivate();

    expect(removeSpy).toHaveBeenCalledWith('visibilitychange', handler);
  });

  it('should reset lastSyncedSessionId on deactivate', () => {
    (linker as any).set('sessionId', 'sess-1');
    linker.activate();
    linker.deactivate();

    // After deactivate + re-activate with same sessionId, should sync again
    linker.activate();
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});

describe('ShopifyCartLinker - Session Change', () => {
  let linker: ShopifyCartLinker;
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setupTestEnvironment();
    resetGlobalState();
    fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchSpy;
    linker = new ShopifyCartLinker();
  });

  afterEach(() => {
    linker.deactivate();
    cleanupTestEnvironment();
  });

  it('should re-sync when onSessionChange is called with new sessionId', () => {
    (linker as any).set('sessionId', 'sess-1');
    linker.activate();
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    (linker as any).set('sessionId', 'sess-2');
    linker.onSessionChange();

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy).toHaveBeenLastCalledWith(
      '/cart/update.js',
      expect.objectContaining({
        body: JSON.stringify({ attributes: { tracelog_session_id: 'sess-2' } }),
      }),
    );
  });

  it('should not re-sync if sessionId has not changed', () => {
    (linker as any).set('sessionId', 'sess-1');
    linker.activate();
    linker.onSessionChange();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});

describe('ShopifyCartLinker - Deduplication', () => {
  let linker: ShopifyCartLinker;
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setupTestEnvironment();
    resetGlobalState();
    fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchSpy;
    linker = new ShopifyCartLinker();
    (linker as any).set('sessionId', 'sess-1');
  });

  afterEach(() => {
    linker.deactivate();
    cleanupTestEnvironment();
  });

  it('should not POST twice for the same sessionId', () => {
    linker.activate();
    linker.onSessionChange();
    linker.onSessionChange();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('should POST again after session rotates to a different id', () => {
    linker.activate();
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    (linker as any).set('sessionId', 'sess-2');
    linker.onSessionChange();
    expect(fetchSpy).toHaveBeenCalledTimes(2);

    (linker as any).set('sessionId', 'sess-3');
    linker.onSessionChange();
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });
});

describe('ShopifyCartLinker - Visibility Change', () => {
  let linker: ShopifyCartLinker;
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setupTestEnvironment();
    resetGlobalState();
    fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchSpy;
    linker = new ShopifyCartLinker();
  });

  afterEach(() => {
    linker.deactivate();
    cleanupTestEnvironment();
  });

  it('should sync when visibility handler fires and tab is visible', () => {
    // jsdom defaults document.hidden = true, mock it as visible
    const hiddenSpy = vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);

    (linker as any).set('sessionId', 'sess-1');
    linker.activate();
    fetchSpy.mockClear();

    (linker as any).set('sessionId', 'sess-2');
    const handler = (linker as any).visibilityHandler as () => void;
    handler();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      '/cart/update.js',
      expect.objectContaining({
        body: JSON.stringify({ attributes: { tracelog_session_id: 'sess-2' } }),
      }),
    );

    hiddenSpy.mockRestore();
  });

  it('should not sync when visibility handler fires and tab is hidden', () => {
    const hiddenSpy = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);

    (linker as any).set('sessionId', 'sess-1');
    linker.activate();
    fetchSpy.mockClear();

    (linker as any).set('sessionId', 'sess-2');
    const handler = (linker as any).visibilityHandler as () => void;
    handler();

    expect(fetchSpy).not.toHaveBeenCalled();

    hiddenSpy.mockRestore();
  });

  it('should not fire after deactivate', () => {
    (linker as any).set('sessionId', 'sess-1');
    linker.activate();
    linker.deactivate();

    // Verify handler was nulled
    expect((linker as any).visibilityHandler).toBeNull();
  });
});

describe('ShopifyCartLinker - Fetch Failure Handling', () => {
  let linker: ShopifyCartLinker;

  beforeEach(() => {
    setupTestEnvironment();
    resetGlobalState();
    linker = new ShopifyCartLinker();
    (linker as any).set('sessionId', 'sess-1');
  });

  afterEach(() => {
    linker.deactivate();
    cleanupTestEnvironment();
  });

  it('should handle rejected fetch gracefully', () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    expect(() => {
      linker.activate();
    }).not.toThrow();
  });

  it('should handle fetch throwing synchronously', () => {
    global.fetch = vi.fn().mockImplementation(() => {
      throw new Error('Network unavailable');
    });

    expect(() => {
      linker.activate();
    }).not.toThrow();
  });

  it('should reset dedup on sync failure so next trigger retries', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    linker.activate();

    // Wait for the rejection to propagate
    await vi.waitFor(() => {
      expect((linker as any).lastSyncedSessionId).toBeNull();
    });

    // Now fix fetch and trigger again — should retry
    const successFetch = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = successFetch;
    linker.onSessionChange();

    expect(successFetch).toHaveBeenCalledTimes(1);
  });

  it('should reset dedup on synchronous throw so next trigger retries', () => {
    global.fetch = vi.fn().mockImplementation(() => {
      throw new Error('Network unavailable');
    });
    linker.activate();

    // Synchronous throw resets immediately
    expect((linker as any).lastSyncedSessionId).toBeNull();

    const successFetch = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = successFetch;
    linker.onSessionChange();

    expect(successFetch).toHaveBeenCalledTimes(1);
  });
});
