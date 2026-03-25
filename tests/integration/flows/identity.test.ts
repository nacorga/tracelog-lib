/**
 * Identity Integration Tests
 * Focus: End-to-end identity flow from identify() to backend payload
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';
import { initTestBridge, destroyTestBridge } from '../../helpers/bridge.helper';
import { createMockFetch } from '../../helpers/mocks.helper';
import { wait } from '../../helpers/wait.helper';
import { PENDING_IDENTITY_KEY, IDENTITY_KEY } from '../../../src/constants/storage.constants';
import type { TraceLogTestBridge } from '../../../src/types';

describe('Integration: Identity Flow', () => {
  let bridge: TraceLogTestBridge;
  let mockFetch: ReturnType<typeof createMockFetch>;

  beforeEach(async () => {
    setupTestEnvironment();
    mockFetch = createMockFetch({ ok: true, status: 200 });
    global.fetch = mockFetch;

    bridge = await initTestBridge({
      integrations: {
        custom: {
          collectApiUrl: 'https://api.test.com/collect',
        },
      },
    });
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();
  });

  it('should include identity in batch payload sent to backend', async () => {
    bridge.identify('cust_123', { name: 'Maria', plan: 'pro' });

    bridge.event('purchase', { amount: 99.99 });

    await bridge.flushQueue();
    await wait(100);

    expect(mockFetch).toHaveBeenCalled();
    const fetchCall = mockFetch.mock.calls[0];
    if (!fetchCall) throw new Error('No fetch call found');

    const payload = JSON.parse(fetchCall[1].body as string);
    expect(payload.identify).toBeDefined();
    expect(payload.identify.userId).toBe('cust_123');
    expect(payload.identify.traits).toEqual({ name: 'Maria', plan: 'pro' });
  });

  it('should not include identity when not identified', async () => {
    bridge.event('anonymous_event', { page: 'home' });

    await bridge.flushQueue();
    await wait(100);

    expect(mockFetch).toHaveBeenCalled();
    const fetchCall = mockFetch.mock.calls[0];
    if (!fetchCall) throw new Error('No fetch call found');

    const payload = JSON.parse(fetchCall[1].body as string);
    expect(payload.identify).toBeUndefined();
  });

  it('should use latest identity (last-write-wins)', async () => {
    bridge.identify('user_1');
    bridge.identify('user_2', { role: 'admin' });

    bridge.event('test', {});

    await bridge.flushQueue();
    await wait(100);

    const fetchCall = mockFetch.mock.calls[0];
    if (!fetchCall) throw new Error('No fetch call found');

    const payload = JSON.parse(fetchCall[1].body as string);
    expect(payload.identify?.userId).toBe('user_2');
  });

  it('should not include identity after resetIdentity()', async () => {
    bridge.identify('cust_123');
    await bridge.resetIdentity();

    bridge.event('post_reset_event', {});

    await bridge.flushQueue();
    await wait(100);

    // Find the fetch call that has the post_reset_event
    const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
    if (!lastCall) throw new Error('No fetch call found');

    const payload = JSON.parse(lastCall[1].body as string);
    const postResetEvent = payload.events.find((e: any) => e.custom_event?.name === 'post_reset_event');
    expect(postResetEvent).toBeDefined();
    expect(payload.identify).toBeUndefined();
  });
});

describe('Integration: Pre-Init Identity Flow', () => {
  let mockFetch: ReturnType<typeof createMockFetch>;

  beforeEach(() => {
    setupTestEnvironment();
    mockFetch = createMockFetch({ ok: true, status: 200 });
    global.fetch = mockFetch;
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();
  });

  it('should apply pre-init identity after init', async () => {
    // Set identity before init via localStorage (simulates api.identify pre-init)
    const identity = { userId: 'pre_init_user', traits: { source: 'signup' } };
    localStorage.setItem(PENDING_IDENTITY_KEY, JSON.stringify(identity));

    const bridge = await initTestBridge({
      integrations: {
        custom: {
          collectApiUrl: 'https://api.test.com/collect',
        },
      },
    });

    // Identity should be loaded
    const loaded = bridge.get('identity');
    expect(loaded?.userId).toBe('pre_init_user');
    expect(loaded?.traits).toEqual({ source: 'signup' });

    // Pending key should be cleared
    expect(localStorage.getItem(PENDING_IDENTITY_KEY)).toBeNull();

    // Project-scoped key should be set
    const projectKey = IDENTITY_KEY('custom');
    expect(localStorage.getItem(projectKey)).not.toBeNull();
  });

  it('should clear identity on destroy (fresh start)', async () => {
    const bridge1 = await initTestBridge({
      integrations: {
        custom: {
          collectApiUrl: 'https://api.test.com/collect',
        },
      },
    });

    bridge1.identify('persistent_user', { tier: 'enterprise' });
    bridge1.destroy();

    const bridge2 = await initTestBridge({
      integrations: {
        custom: {
          collectApiUrl: 'https://api.test.com/collect',
        },
      },
    });

    // destroy() clears identity — next init starts anonymous
    const identity = bridge2.get('identity');
    expect(identity).toBeUndefined();
  });
});
