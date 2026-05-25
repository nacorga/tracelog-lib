/**
 * Public API Tests
 *
 * Covers the 9-method public surface of src/api.ts:
 *   init, event, on, off, identify, resetIdentity, destroy, getSessionId, getUserId, isInitialized
 *
 * App.prototype methods are stubbed with vi.spyOn so the real api.ts wiring
 * (singleton lifecycle, pre-init queueing, SSR no-ops) is exercised end-to-end
 * without booting real handlers/managers.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';
import { PENDING_IDENTITY_KEY } from '../../../src/constants/storage.constants';
import { EmitterEvent } from '../../../src/types/emitter.types';
import * as api from '../../../src/api';
import { App } from '../../../src/app';

const sessionIdValue = 'session-mock-123';
const userIdValue = 'user-mock-abc';

let spyInit: any;
let spyDestroy: any;
let spyOn: any;
let spyOff: any;
let spySendCustomEvent: any;
let spyIdentify: any;
let spyResetIdentity: any;

function freshApi(): typeof api {
  try {
    api.destroy();
  } catch {
    /* ignore */
  }
  return api;
}

beforeEach(() => {
  setupTestEnvironment();
  delete (window as any).__traceLogDisabled;

  spyInit = vi.spyOn(App.prototype, 'init').mockResolvedValue({ sessionId: sessionIdValue });
  spyDestroy = vi.spyOn(App.prototype, 'destroy').mockImplementation(() => {});
  spyOn = vi.spyOn(App.prototype, 'on').mockImplementation(() => {});
  spyOff = vi.spyOn(App.prototype, 'off').mockImplementation(() => {});
  spySendCustomEvent = vi.spyOn(App.prototype, 'sendCustomEvent').mockImplementation(() => {});
  vi.spyOn(App.prototype, 'getSessionId').mockReturnValue(sessionIdValue);
  vi.spyOn(App.prototype, 'getUserId').mockReturnValue(userIdValue);
  spyIdentify = vi.spyOn(App.prototype, 'identify').mockImplementation(() => {});
  spyResetIdentity = vi.spyOn(App.prototype, 'resetIdentity').mockResolvedValue();
});

afterEach(() => {
  freshApi();
  vi.restoreAllMocks();
  cleanupTestEnvironment();
});

describe('api.init()', () => {
  it('returns sessionId from App.init() and marks isInitialized', async () => {
    const { init, isInitialized } = freshApi();

    expect(isInitialized()).toBe(false);

    const { sessionId } = await init();

    expect(sessionId).toBe(sessionIdValue);
    expect(spyInit).toHaveBeenCalledTimes(1);
    expect(isInitialized()).toBe(true);
  });

  it('returns the current sessionId without recreating App when called twice', async () => {
    const { init } = freshApi();
    await init();
    const second = await init();

    expect(second.sessionId).toBe(sessionIdValue);
    expect(spyInit).toHaveBeenCalledTimes(1);
  });

  it('returns the same promise for concurrent init() calls (de-dupes inflight)', async () => {
    const { init } = freshApi();

    const a = init();
    const b = init();

    const [ra, rb] = await Promise.all([a, b]);
    expect(ra.sessionId).toBe(sessionIdValue);
    expect(rb.sessionId).toBe(sessionIdValue);
    expect(spyInit).toHaveBeenCalledTimes(1);
  });

  it('returns empty sessionId when window.__traceLogDisabled is true', async () => {
    (window as any).__traceLogDisabled = true;
    const { init, isInitialized } = freshApi();

    const { sessionId } = await init();
    expect(sessionId).toBe('');
    expect(spyInit).not.toHaveBeenCalled();
    expect(isInitialized()).toBe(false);
  });

  it('forwards pre-init listeners to App.on() after init', async () => {
    const { init, on } = freshApi();
    const cb = vi.fn();
    on(EmitterEvent.EVENT, cb);

    expect(spyOn).not.toHaveBeenCalled();

    await init();

    expect(spyOn).toHaveBeenCalledWith(EmitterEvent.EVENT, cb);
  });

  it('clears app singleton when App.init() rejects', async () => {
    spyInit.mockRejectedValueOnce(new Error('boom'));

    const { init, isInitialized } = freshApi();

    await expect(init()).rejects.toThrow('boom');
    expect(isInitialized()).toBe(false);

    spyInit.mockResolvedValueOnce({ sessionId: sessionIdValue });
    const result = await init();
    expect(result.sessionId).toBe(sessionIdValue);
  });
});

describe('api.event()', () => {
  it('throws if called before init()', () => {
    const { event } = freshApi();
    expect(() => {
      event('foo');
    }).toThrow(/not initialized/i);
  });

  it('forwards to App.sendCustomEvent() after init', async () => {
    const { init, event } = freshApi();
    await init();

    event('purchase', { orderId: 'ord-1' }, { critical: true });

    expect(spySendCustomEvent).toHaveBeenCalledWith('purchase', { orderId: 'ord-1' }, { critical: true });
  });

  it('passes undefined metadata and options when omitted', async () => {
    const { init, event } = freshApi();
    await init();

    event('simple');

    expect(spySendCustomEvent).toHaveBeenCalledWith('simple', undefined, undefined);
  });
});

describe('api.on() / api.off()', () => {
  it('queues listeners pre-init and forwards them on init', async () => {
    const { init, on } = freshApi();
    const a = vi.fn();
    const b = vi.fn();

    on(EmitterEvent.EVENT, a);
    on(EmitterEvent.QUEUE, b);

    await init();

    expect(spyOn).toHaveBeenCalledTimes(2);
    expect(spyOn).toHaveBeenCalledWith(EmitterEvent.EVENT, a);
    expect(spyOn).toHaveBeenCalledWith(EmitterEvent.QUEUE, b);
  });

  it('forwards directly to App.on() when called post-init', async () => {
    const { init, on } = freshApi();
    await init();

    const cb = vi.fn();
    on(EmitterEvent.EVENT, cb);

    expect(spyOn).toHaveBeenCalledWith(EmitterEvent.EVENT, cb);
  });

  it('off() removes a queued pre-init listener so it never reaches App', async () => {
    const { init, on, off } = freshApi();
    const a = vi.fn();
    const b = vi.fn();

    on(EmitterEvent.EVENT, a);
    on(EmitterEvent.EVENT, b);
    off(EmitterEvent.EVENT, a);

    await init();

    expect(spyOn).toHaveBeenCalledTimes(1);
    expect(spyOn).toHaveBeenCalledWith(EmitterEvent.EVENT, b);
  });

  it('off() forwards to App.off() post-init', async () => {
    const { init, off } = freshApi();
    await init();

    const cb = vi.fn();
    off(EmitterEvent.EVENT, cb);

    expect(spyOff).toHaveBeenCalledWith(EmitterEvent.EVENT, cb);
  });
});

describe('api.identify()', () => {
  it('forwards userId and traits to App.identify() when initialized', async () => {
    const { init, identify } = freshApi();
    await init();

    identify('cust_42', { plan: 'pro', name: 'Maria' });

    expect(spyIdentify).toHaveBeenCalledWith('cust_42', { plan: 'pro', name: 'Maria' });
  });

  it('forwards undefined traits when none provided', async () => {
    const { init, identify } = freshApi();
    await init();

    identify('cust_42');

    expect(spyIdentify).toHaveBeenCalledWith('cust_42', undefined);
  });

  it('persists identity (without traits) to localStorage when called pre-init', () => {
    const { identify } = freshApi();
    identify('cust_42');

    const raw = localStorage.getItem(PENDING_IDENTITY_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!)).toEqual({ userId: 'cust_42' });
    expect(spyIdentify).not.toHaveBeenCalled();
  });

  it('persists sanitized traits to localStorage when called pre-init', () => {
    const { identify } = freshApi();
    identify('cust_42', { plan: 'pro', age: 30 as unknown as string });

    const stored = JSON.parse(localStorage.getItem(PENDING_IDENTITY_KEY)!);
    // Only string-valued fields survive sanitizeTraits.
    expect(stored).toEqual({ userId: 'cust_42', traits: { plan: 'pro' } });
  });

  it('trims whitespace from userId before persisting', () => {
    const { identify } = freshApi();
    identify('  cust_42  ');
    const stored = JSON.parse(localStorage.getItem(PENDING_IDENTITY_KEY)!);
    expect(stored).toEqual({ userId: 'cust_42' });
  });

  it('ignores empty / whitespace-only userId', async () => {
    const { init, identify } = freshApi();
    await init();

    identify('');
    identify('   ');
    identify(undefined as unknown as string);

    expect(spyIdentify).not.toHaveBeenCalled();
  });

  it('ignores userId longer than 256 characters', async () => {
    const { init, identify } = freshApi();
    await init();

    identify('a'.repeat(257));

    expect(spyIdentify).not.toHaveBeenCalled();
  });
});

describe('api.resetIdentity()', () => {
  it('forwards to App.resetIdentity() when initialized', async () => {
    const { init, resetIdentity } = freshApi();
    await init();

    await resetIdentity();

    expect(spyResetIdentity).toHaveBeenCalledTimes(1);
  });

  it('clears any pending pre-init identity silently when not initialized', async () => {
    const { identify, resetIdentity } = freshApi();
    identify('cust_42');
    expect(localStorage.getItem(PENDING_IDENTITY_KEY)).not.toBeNull();

    await resetIdentity();

    expect(localStorage.getItem(PENDING_IDENTITY_KEY)).toBeNull();
    expect(spyResetIdentity).not.toHaveBeenCalled();
  });
});

describe('api.destroy()', () => {
  it('clears the app singleton and resets isInitialized', async () => {
    const { init, destroy, isInitialized } = freshApi();
    await init();
    expect(isInitialized()).toBe(true);

    destroy();

    expect(spyDestroy).toHaveBeenCalledTimes(1);
    expect(isInitialized()).toBe(false);
  });

  it('is a no-op when called before init() — no throw, no app calls', () => {
    const { destroy, isInitialized } = freshApi();
    expect(() => {
      destroy();
    }).not.toThrow();
    expect(spyDestroy).not.toHaveBeenCalled();
    expect(isInitialized()).toBe(false);
  });

  it('clears the singleton even if App.destroy() throws', async () => {
    spyDestroy.mockImplementationOnce(() => {
      throw new Error('destroy failure');
    });

    const { init, destroy, isInitialized } = freshApi();
    await init();
    expect(() => {
      destroy();
    }).not.toThrow();
    expect(isInitialized()).toBe(false);
  });

  it('clears pre-init pending listeners on destroy', async () => {
    const { init, on, destroy } = freshApi();
    const cb = vi.fn();
    on(EmitterEvent.EVENT, cb);

    await init();
    destroy();

    spyOn.mockClear();
    await init();
    expect(spyOn).not.toHaveBeenCalled();
  });
});

describe('api.getSessionId() / api.getUserId() / api.isInitialized()', () => {
  it('return null / false before init()', () => {
    const { getSessionId, getUserId, isInitialized } = freshApi();
    expect(getSessionId()).toBeNull();
    expect(getUserId()).toBeNull();
    expect(isInitialized()).toBe(false);
  });

  it('return delegated values after init()', async () => {
    const { init, getSessionId, getUserId, isInitialized } = freshApi();
    await init();

    expect(getSessionId()).toBe(sessionIdValue);
    expect(getUserId()).toBe(userIdValue);
    expect(isInitialized()).toBe(true);
  });
});
