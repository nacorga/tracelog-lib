/**
 * E2E Tests: Global Metadata Propagation
 *
 * Validates that globalMetadata configuration is correctly added to all events.
 * Tests various scenarios including different event types and metadata merging.
 */

import { test, expect } from '@playwright/test';
import { navigateToPlayground } from './utils/environment.utils';

test.describe('Global Metadata Propagation', () => {
  test('should add globalMetadata to queue payload', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const queues: unknown[] = [];
      const traceLog = window.__traceLogBridge!;

      traceLog.on('queue', (payload: unknown) => {
        queues.push(payload);
      });

      await traceLog.init({
        globalMetadata: {
          app_version: '1.2.3',
          environment: 'test',
          tenant_id: 'tenant-123',
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 300));

      // Generate events to trigger queue
      traceLog.sendCustomEvent('test_event_1', { field: 'value1' });
      traceLog.sendCustomEvent('test_event_2', { field: 'value2' });

      // Trigger queue flush
      await new Promise((resolve) => setTimeout(resolve, 12000));

      return {
        queues: queues.map((q) => {
          const queue = q as Record<string, unknown>;
          return {
            hasGlobalMetadata: 'global_metadata' in queue,
            globalMetadata: queue.global_metadata,
            eventCount: Array.isArray(queue.events) ? (queue.events as unknown[]).length : 0,
          };
        }),
      };
    });

    // Should have at least one queue
    expect(result.queues.length).toBeGreaterThan(0);

    // Verify first queue has globalMetadata
    const firstQueue = result.queues[0];
    expect(firstQueue).toBeDefined();
    expect(firstQueue?.hasGlobalMetadata).toBe(true);
    expect(firstQueue?.globalMetadata).toEqual({
      app_version: '1.2.3',
      environment: 'test',
      tenant_id: 'tenant-123',
    });

    // Verify different event types are in the queue
    expect(firstQueue?.eventCount).toBeGreaterThan(0);
  });

  test('should preserve globalMetadata across multiple queues', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const queues: unknown[] = [];
      const traceLog = window.__traceLogBridge!;

      traceLog.on('queue', (payload: unknown) => {
        queues.push(payload);
      });

      await traceLog.init({
        globalMetadata: {
          global_field: 'global_value',
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      // Send events
      traceLog.sendCustomEvent('event_1', { field: 'value1' });

      // Wait for first queue
      await new Promise((resolve) => setTimeout(resolve, 12000));

      traceLog.sendCustomEvent('event_2', { field: 'value2' });

      // Wait for second queue
      await new Promise((resolve) => setTimeout(resolve, 12000));

      return {
        queues: queues.map((q) => {
          const queue = q as Record<string, unknown>;
          return {
            globalMetadata: queue.global_metadata,
          };
        }),
      };
    });

    // Should have at least 2 queues
    expect(result.queues.length).toBeGreaterThanOrEqual(2);

    // All queues should have the same globalMetadata
    result.queues.forEach((queue) => {
      expect(queue.globalMetadata).toEqual({
        global_field: 'global_value',
      });
    });
  });

  test('should handle empty globalMetadata', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const queues: unknown[] = [];
      const traceLog = window.__traceLogBridge!;

      traceLog.on('queue', (payload: unknown) => {
        queues.push(payload);
      });

      await traceLog.init({
        globalMetadata: {},
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      traceLog.sendCustomEvent('test_event', { field: 'value' });

      await new Promise((resolve) => setTimeout(resolve, 12000));

      return {
        queues: queues.map((q) => {
          const queue = q as Record<string, unknown>;
          return {
            hasGlobalMetadata: 'global_metadata' in queue,
            globalMetadata: queue.global_metadata,
          };
        }),
      };
    });

    // Empty object {} is truthy in JavaScript, so it IS added to the payload
    const firstQueue = result.queues[0];
    expect(firstQueue?.hasGlobalMetadata).toBe(true);
    expect(firstQueue?.globalMetadata).toEqual({});
  });

  test('should handle undefined globalMetadata', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const queues: unknown[] = [];
      const traceLog = window.__traceLogBridge!;

      traceLog.on('queue', (payload: unknown) => {
        queues.push(payload);
      });

      // No globalMetadata provided
      await traceLog.init({
        samplingRate: 1,
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      traceLog.sendCustomEvent('test_event', { field: 'value' });

      await new Promise((resolve) => setTimeout(resolve, 12000));

      return {
        queues: queues.map((q) => {
          const queue = q as Record<string, unknown>;
          return {
            hasGlobalMetadata: 'global_metadata' in queue,
          };
        }),
      };
    });

    // Queues should NOT have global_metadata field when not configured
    const firstQueue = result.queues[0];
    expect(firstQueue?.hasGlobalMetadata).toBe(false);
  });

  test('should support nested objects in globalMetadata', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const queues: unknown[] = [];
      const traceLog = window.__traceLogBridge!;

      traceLog.on('queue', (payload: unknown) => {
        queues.push(payload);
      });

      await traceLog.init({
        globalMetadata: {
          user: {
            id: 'user-123',
            tier: 'premium',
          },
          app: {
            name: 'TestApp',
            version: '2.0.0',
          },
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      traceLog.sendCustomEvent('nested_test', { action: 'click' });

      await new Promise((resolve) => setTimeout(resolve, 12000));

      return {
        globalMetadata: (queues[0] as Record<string, unknown>).global_metadata,
      };
    });

    expect(result.globalMetadata).toEqual({
      user: {
        id: 'user-123',
        tier: 'premium',
      },
      app: {
        name: 'TestApp',
        version: '2.0.0',
      },
    });
  });
});
