/**
 * Custom Headers Integration Tests
 * Focus: Static headers from config + dynamic headers from provider
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';
import { initTestBridge, destroyTestBridge } from '../../helpers/bridge.helper';
import { createMockFetch } from '../../helpers/mocks.helper';
import type { TraceLogTestBridge } from '../../../src/types';

describe('Integration: Custom Headers', () => {
  let bridge: TraceLogTestBridge;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setupTestEnvironment();
    mockFetch = createMockFetch({ ok: true, status: 200 });
    global.fetch = mockFetch;
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();
  });

  it('should include static headers from config in requests', async () => {
    // Initialize with static headers in config
    bridge = await initTestBridge({
      integrations: {
        custom: {
          collectApiUrl: 'https://api.test.com/collect',
          headers: {
            'X-Brand': 'test-brand',
            'X-Tenant-Id': 'tenant-123',
          },
        },
      },
    });

    // Track an event and flush
    bridge.event('test_event', { key: 'value' });
    await bridge.flushQueue();

    // Verify headers in fetch call
    expect(mockFetch).toHaveBeenCalled();
    const fetchCall = mockFetch.mock.calls[0];
    const [, options] = fetchCall ?? [];
    expect(options?.headers).toEqual({
      'Content-Type': 'application/json',
      'X-Brand': 'test-brand',
      'X-Tenant-Id': 'tenant-123',
    });
  });

  it('should work with dynamic headers provider returning empty object', async () => {
    // Initialize
    bridge = await initTestBridge({
      integrations: {
        custom: {
          collectApiUrl: 'https://api.test.com/collect',
          headers: {
            'X-Brand': 'test-brand',
          },
        },
      },
    });

    // Set provider that returns empty object
    const dynamicProvider = vi.fn(() => ({}));
    bridge.setCustomHeaders(dynamicProvider);

    // Track event and flush
    bridge.event('test_event', {});
    await bridge.flushQueue();

    // Verify provider was called
    expect(dynamicProvider).toHaveBeenCalled();
    const fetchCall = mockFetch.mock.calls[0];
    const [, options] = fetchCall ?? [];
    // Only static headers present
    expect(options?.headers).toEqual({
      'Content-Type': 'application/json',
      'X-Brand': 'test-brand',
    });
  });

  it('should include dynamic headers from provider set after init', async () => {
    // Initialize first
    bridge = await initTestBridge({
      integrations: {
        custom: {
          collectApiUrl: 'https://api.test.com/collect',
        },
      },
    });

    // Set provider AFTER init
    const dynamicProvider = vi.fn(() => ({
      Authorization: 'Bearer post-init-token',
    }));
    bridge.setCustomHeaders(dynamicProvider);

    // Track event and flush
    bridge.event('test_event', {});
    await bridge.flushQueue();

    // Verify headers
    expect(dynamicProvider).toHaveBeenCalled();
    const fetchCall = mockFetch.mock.calls[0];
    const [, options] = fetchCall ?? [];
    expect(options?.headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer post-init-token',
    });
  });

  it('should merge static and dynamic headers (dynamic overrides static)', async () => {
    // Initialize with static headers
    bridge = await initTestBridge({
      integrations: {
        custom: {
          collectApiUrl: 'https://api.test.com/collect',
          headers: {
            'X-Brand': 'static-brand',
            'X-Shared': 'from-static',
          },
        },
      },
    });

    // Set dynamic provider that overrides one header
    bridge.setCustomHeaders(() => ({
      'X-Shared': 'from-dynamic', // Override
      Authorization: 'Bearer token', // New
    }));

    // Track event and flush
    bridge.event('test_event', {});
    await bridge.flushQueue();

    // Verify merge behavior
    const fetchCall = mockFetch.mock.calls[0];
    const [, options] = fetchCall ?? [];
    expect(options?.headers).toEqual({
      'Content-Type': 'application/json',
      'X-Brand': 'static-brand', // Static preserved
      'X-Shared': 'from-dynamic', // Dynamic wins
      Authorization: 'Bearer token', // Dynamic added
    });
  });

  it('should remove dynamic provider when removeCustomHeaders is called', async () => {
    // Initialize with static headers
    bridge = await initTestBridge({
      integrations: {
        custom: {
          collectApiUrl: 'https://api.test.com/collect',
          headers: {
            'X-Brand': 'static-brand',
          },
        },
      },
    });

    // Set then remove provider
    const dynamicProvider = vi.fn(() => ({
      Authorization: 'Bearer token',
    }));
    bridge.setCustomHeaders(dynamicProvider);
    bridge.removeCustomHeaders();

    // Track event and flush
    bridge.event('test_event', {});
    await bridge.flushQueue();

    // Provider should NOT be called
    expect(dynamicProvider).not.toHaveBeenCalled();

    // Only static headers should be present
    const fetchCall = mockFetch.mock.calls[0];
    const [, options] = fetchCall ?? [];
    expect(options?.headers).toEqual({
      'Content-Type': 'application/json',
      'X-Brand': 'static-brand',
    });
  });

  it('should handle provider errors gracefully', async () => {
    // Initialize with static headers
    bridge = await initTestBridge({
      integrations: {
        custom: {
          collectApiUrl: 'https://api.test.com/collect',
          headers: {
            'X-Brand': 'static-brand',
          },
        },
      },
    });

    // Set provider that throws
    bridge.setCustomHeaders(() => {
      throw new Error('Provider error');
    });

    // Track event and flush - should not throw
    bridge.event('test_event', {});
    await bridge.flushQueue();

    // Request should still succeed with static headers only
    expect(mockFetch).toHaveBeenCalled();
    const fetchCall = mockFetch.mock.calls[0];
    const [, options] = fetchCall ?? [];
    expect(options?.headers).toEqual({
      'Content-Type': 'application/json',
      'X-Brand': 'static-brand',
    });
  });
});
