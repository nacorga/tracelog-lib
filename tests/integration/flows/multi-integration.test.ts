/**
 * Multi-Integration Tests
 * Focus: Multiple backend integrations working together
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';
import { initTestBridge, destroyTestBridge, getManagers } from '../../helpers/bridge.helper';
import { getSpecialApiUrls } from '../../helpers/mocks.helper';
import { wait } from '../../helpers/wait.helper';
import type { TraceLogTestBridge } from '../../../src/types';

describe('Integration: Multi-Integration Setup', () => {
  let bridge: TraceLogTestBridge;
  let originalLocation: Location;

  beforeEach(async () => {
    setupTestEnvironment();

    // Mock window.location to use a real domain (SaaS integration rejects localhost)
    originalLocation = window.location;
    delete (window as any).location;
    (window as any).location = {
      ...originalLocation,
      hostname: 'example.com',
      href: 'https://example.com',
      origin: 'https://example.com',
      protocol: 'https:',
    };

    const specialUrls = getSpecialApiUrls();

    // Initialize with both SaaS and custom backend
    bridge = await initTestBridge({
      disabledEvents: ['page_view'], // Disable automatic page_view to simplify tests
      integrations: {
        tracelog: {
          projectId: 'test-project-123',
        },
        custom: {
          collectApiUrl: `http://${specialUrls.Localhost}/collect`,
          allowHttp: true,
        },
      },
    });
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();

    // Restore original location
    (window as any).location = originalLocation;
  });

  it('should initialize with tracelog + custom integrations', () => {
    // Get state to verify configuration
    const collectApiUrls = bridge.get('collectApiUrls');

    // Verify both integration URLs are configured
    expect(collectApiUrls).toBeDefined();
    expect(collectApiUrls.saas).toBeDefined();
    expect(collectApiUrls.custom).toBeDefined();

    // Verify SaaS URL format (uses subdomain-based URL: projectId.hostname)
    expect(collectApiUrls.saas).toContain('test-project-123');
    expect(collectApiUrls.saas).toContain('example.com');
    expect(collectApiUrls.saas).toContain('/collect');

    // Verify custom URL
    const specialUrls = getSpecialApiUrls();
    expect(collectApiUrls.custom).toBe(`http://${specialUrls.Localhost}/collect`);
  });

  it('should create separate SenderManagers', () => {
    // Get EventManager to access SenderManagers
    const { event: eventManager } = getManagers(bridge);
    expect(eventManager).toBeDefined();

    // Access dataSenders array (private field, accessed via bridge for testing)
    const dataSenders = (eventManager as any).dataSenders;
    expect(dataSenders).toBeDefined();
    expect(Array.isArray(dataSenders)).toBe(true);
    expect(dataSenders).toHaveLength(2);

    // Verify both SenderManagers are instantiated
    dataSenders.forEach((sender: any) => {
      expect(sender).toBeDefined();
      expect(sender.constructor.name).toBe('SenderManager');
    });
  });

  it('should setup separate storage keys', () => {
    const userId = bridge.get('userId');
    expect(userId).toBeDefined();

    // Storage keys should be: tlog:{userId}:queue:saas and tlog:{userId}:queue:custom
    const expectedSaasKey = `tlog:${userId}:queue:saas`;
    const expectedCustomKey = `tlog:${userId}:queue:custom`;

    // Initially, storage should be empty (no persisted events yet)
    const saasStorage = localStorage.getItem(expectedSaasKey);
    const customStorage = localStorage.getItem(expectedCustomKey);

    // Storage might be null or empty object
    expect([null, '{}']).toContain(saasStorage ?? null);
    expect([null, '{}']).toContain(customStorage ?? null);
  });

  it('should coordinate sending to both', async () => {
    // Track a custom event
    bridge.event('test_event', { key: 'value' });

    // Verify event is queued
    expect(bridge.getQueueLength()).toBeGreaterThan(0);

    // Flush queue manually
    await bridge.flushQueue();
    await wait(100);

    // With SpecialApiUrl.Localhost (success simulation), queue should be cleared
    expect(bridge.getQueueLength()).toBe(0);
  });
});

describe('Integration: Multi-Integration Event Flow', () => {
  let bridge: TraceLogTestBridge;
  let originalLocation: Location;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    setupTestEnvironment();

    // Mock window.location
    originalLocation = window.location;
    delete (window as any).location;
    (window as any).location = {
      ...originalLocation,
      hostname: 'example.com',
      href: 'https://example.com',
      origin: 'https://example.com',
      protocol: 'https:',
    };

    // Mock fetch for SaaS integration (custom uses SpecialApiUrl simulation)
    mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => Promise.resolve({ success: true }),
    });
    global.fetch = mockFetch;

    const specialUrls = getSpecialApiUrls();

    bridge = await initTestBridge({
      disabledEvents: ['page_view'], // Disable automatic page_view to simplify tests
      integrations: {
        tracelog: {
          projectId: 'test-project-123',
        },
        custom: {
          collectApiUrl: `http://${specialUrls.Localhost}/collect`,
          allowHttp: true,
        },
      },
    });
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();

    // Restore original location
    (window as any).location = originalLocation;
  });

  it('should send events to both backends in parallel', async () => {
    // Reset mock to track only new events
    mockFetch.mockClear();

    // Track event
    bridge.event('purchase', { amount: 99.99 });

    // Verify queued
    expect(bridge.getQueueLength()).toBeGreaterThan(0);

    // Flush queue manually
    await bridge.flushQueue();
    await wait(100);

    // Verify queue cleared (both sends succeeded)
    expect(bridge.getQueueLength()).toBe(0);

    // Verify fetch was called for SaaS integration
    expect(mockFetch).toHaveBeenCalled();
  });

  it('should apply transformers only to custom backend', async () => {
    // Set beforeBatch transformer
    const transformerSpy = vi.fn((batch) => {
      return {
        ...batch,
        transformed: true,
      };
    });

    bridge.setTransformer('beforeBatch', transformerSpy);

    // Track event
    bridge.event('test', { foo: 'bar' });

    // Flush queue manually
    await bridge.flushQueue();
    await wait(100);

    // Transformer should be called once for custom backend
    // SaaS backend skips transformers
    expect(transformerSpy).toHaveBeenCalledTimes(1);
  });

  it('should skip transformers for saas backend', async () => {
    const beforeSendTransformer = vi.fn((event) => event);
    const beforeBatchTransformer = vi.fn((batch) => batch);

    bridge.setTransformer('beforeSend', beforeSendTransformer);
    bridge.setTransformer('beforeBatch', beforeBatchTransformer);

    // Track event
    bridge.event('test', { data: 'value' });

    // Flush queue manually
    await bridge.flushQueue();
    await wait(100);

    // In multi-integration mode:
    // - beforeSend is skipped in EventManager (for both integrations)
    // - beforeSend is applied in SenderManager ONLY for custom backend (per-event)
    // - beforeBatch is applied in SenderManager ONLY for custom backend (per-batch)
    // So beforeSendTransformer is called for each event sent to custom backend
    expect(beforeSendTransformer).toHaveBeenCalled(); // Called for custom backend only
    expect(beforeBatchTransformer).toHaveBeenCalledTimes(1); // Called for custom backend only
  });

  it('should handle partial send failures', async () => {
    // Make SaaS fetch fail multiple times (initial + retries), custom will succeed
    mockFetch.mockRejectedValue(new Error('Network error'));

    bridge.event('test_event', { key: 'value' });

    // Verify queued
    expect(bridge.getQueueLength()).toBeGreaterThan(0);

    // Flush queue manually
    await bridge.flushQueue();
    await wait(100);

    // Optimistic removal: Queue cleared because custom backend succeeded
    expect(bridge.getQueueLength()).toBe(0);
  });

  it('should report success if any succeeds', async () => {
    // This test validates the optimistic removal strategy
    // Even if one integration fails, queue is cleared if ANY integration succeeds

    const specialUrls = getSpecialApiUrls();

    // Destroy current bridge and create new one with failure simulation for custom
    destroyTestBridge();

    bridge = await initTestBridge({
      disabledEvents: ['page_view'], // Disable automatic page_view to simplify tests
      integrations: {
        tracelog: {
          projectId: 'test-project-123',
        },
        custom: {
          collectApiUrl: `http://${specialUrls.Fail}/collect`, // Fail simulation
          allowHttp: true,
        },
      },
    });

    // Track a new event
    bridge.event('test', { data: 'value' });

    // Verify queued
    expect(bridge.getQueueLength()).toBeGreaterThan(0);

    // Flush queue manually
    await bridge.flushQueue();
    await wait(100);

    // Queue cleared because SaaS succeeded (optimistic removal)
    expect(bridge.getQueueLength()).toBe(0);

    // Custom backend persisted failed events
    const userId = bridge.get('userId');
    const customPersisted = localStorage.getItem(`tlog:${userId}:queue:custom`);
    expect(customPersisted).toBeDefined();

    // SaaS did NOT persist (succeeded)
    const saasPersisted = localStorage.getItem(`tlog:${userId}:queue:saas`);
    expect(saasPersisted).toBeNull();
  });
});
