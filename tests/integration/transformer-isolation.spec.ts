/**
 * Transformer Isolation Integration Tests
 *
 * Validates that transformers are properly isolated between destinations:
 * - TraceLog SaaS: Transformers silently ignored
 * - Custom Backend: Transformers apply correctly
 * - Google Analytics: beforeSend applies, beforeBatch N/A
 *
 * Focus: Ensure transformer application follows documented behavior
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { EventManager } from '../../src/managers/event.manager';
import { StorageManager } from '../../src/managers/storage.manager';
import { StateManager } from '../../src/managers/state.manager';
import { EventType, DeviceType } from '../../src/types';
import { Emitter } from '../../src/utils';

describe('Transformer Isolation Between Destinations', () => {
  let eventManager: EventManager;
  let storageManager: StorageManager;
  let emitter: Emitter;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    storageManager = new StorageManager();
    emitter = new Emitter();
    eventManager = new EventManager(storageManager, null, emitter);

    // Mock fetch
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    eventManager.stop();
    vi.restoreAllMocks();
  });

  describe('Custom Backend - Transformer Application', () => {
    it('should apply beforeSend transformer to custom backend events', async () => {
      const beforeSendTransformer = vi.fn((event: any) => ({
        ...event,
        custom_field: 'transformed_value',
      }));

      // Setup state with custom integration and transformer
      const mockGet = vi.fn((key: string) => {
        if (key === 'collectApiUrls') return { saas: '', custom: 'http://localhost:3000/collect' };
        if (key === 'userId') return 'test-user';
        if (key === 'sessionId') return 'test-session';
        if (key === 'device') return DeviceType.Desktop;
        if (key === 'pageUrl') return 'http://localhost:3000';
        if (key === 'config') return { integrations: { custom: { collectApiUrl: 'http://localhost:3000/collect' } } };
        if (key === 'transformers') return { custom: { beforeSend: beforeSendTransformer, beforeBatch: undefined } };
        return undefined;
      });
      (StateManager.prototype as any).get = mockGet;

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      });

      // Track an event
      eventManager.track({
        type: EventType.CUSTOM,
        custom_event: { name: 'test_event', metadata: { key: 'value' } },
      });

      // Flush the queue
      await eventManager.flushImmediately();

      // Verify transformer was called once for each event
      expect(beforeSendTransformer).toHaveBeenCalledTimes(1);

      // Verify the transformed event was in the batch
      const sentPayload = JSON.parse(mockFetch.mock.calls[0]?.[1]?.body || '{}');
      expect(sentPayload.events[0]).toHaveProperty('custom_field', 'transformed_value');
    });

    it('should apply beforeBatch transformer to custom backend queue', async () => {
      const beforeBatchTransformer = vi.fn((queue: any) => ({
        ...queue,
        batch_metadata: { app_version: '1.0.0' },
      }));

      // Setup state with custom integration and transformer
      const mockGet = vi.fn((key: string) => {
        if (key === 'collectApiUrls') return { saas: '', custom: 'http://localhost:3000/collect' };
        if (key === 'userId') return 'test-user';
        if (key === 'sessionId') return 'test-session';
        if (key === 'device') return DeviceType.Desktop;
        if (key === 'pageUrl') return 'http://localhost:3000';
        if (key === 'config') return { integrations: { custom: { collectApiUrl: 'http://localhost:3000/collect' } } };
        if (key === 'transformers') return { custom: { beforeSend: undefined, beforeBatch: beforeBatchTransformer } };
        return undefined;
      });
      (StateManager.prototype as any).get = mockGet;

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      });

      // Track an event
      eventManager.track({
        type: EventType.CUSTOM,
        custom_event: { name: 'test_event' },
      });

      // Flush the queue
      await eventManager.flushImmediately();

      // Verify transformer was called once for the queue
      expect(beforeBatchTransformer).toHaveBeenCalledTimes(1);

      // Verify the transformed batch was sent
      const sentPayload = JSON.parse(mockFetch.mock.calls[0]?.[1]?.body || '{}');
      expect(sentPayload).toHaveProperty('batch_metadata');
      expect(sentPayload.batch_metadata).toEqual({ app_version: '1.0.0' });
    });

    it('should apply both transformers in correct order (beforeSend → beforeBatch)', async () => {
      const beforeSendTransformer = vi.fn((event: any) => ({
        ...event,
        event_transformed: true,
      }));

      const beforeBatchTransformer = vi.fn((queue: any) => ({
        ...queue,
        batch_transformed: true,
      }));

      // Setup state with both transformers
      const mockGet = vi.fn((key: string) => {
        if (key === 'collectApiUrls') return { saas: '', custom: 'http://localhost:3000/collect' };
        if (key === 'userId') return 'test-user';
        if (key === 'sessionId') return 'test-session';
        if (key === 'device') return DeviceType.Desktop;
        if (key === 'pageUrl') return 'http://localhost:3000';
        if (key === 'config') return { integrations: { custom: { collectApiUrl: 'http://localhost:3000/collect' } } };
        if (key === 'transformers')
          return { custom: { beforeSend: beforeSendTransformer, beforeBatch: beforeBatchTransformer } };
        return undefined;
      });
      (StateManager.prototype as any).get = mockGet;

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      });

      // Track an event
      eventManager.track({
        type: EventType.CUSTOM,
        custom_event: { name: 'test_event' },
      });

      // Flush the queue
      await eventManager.flushImmediately();

      // Verify both transformers were called
      expect(beforeSendTransformer).toHaveBeenCalledTimes(1);
      expect(beforeBatchTransformer).toHaveBeenCalledTimes(1);

      // Verify beforeSend was called before beforeBatch
      const beforeSendCallOrder = beforeSendTransformer.mock.invocationCallOrder[0];
      const beforeBatchCallOrder = beforeBatchTransformer.mock.invocationCallOrder[0];
      expect(beforeSendCallOrder).toBeLessThan(beforeBatchCallOrder!);

      // Verify both transformations are in final payload
      const sentPayload = JSON.parse(mockFetch.mock.calls[0]?.[1]?.body || '{}');
      expect(sentPayload.events[0]).toHaveProperty('event_transformed', true);
      expect(sentPayload).toHaveProperty('batch_transformed', true);
    });

    it('should handle beforeSend returning null (filter event)', async () => {
      const beforeSendTransformer = vi.fn(() => null);

      const mockGet = vi.fn((key: string) => {
        if (key === 'collectApiUrls') return { saas: '', custom: 'http://localhost:3000/collect' };
        if (key === 'userId') return 'test-user';
        if (key === 'sessionId') return 'test-session';
        if (key === 'device') return DeviceType.Desktop;
        if (key === 'pageUrl') return 'http://localhost:3000';
        if (key === 'config') return { integrations: { custom: { collectApiUrl: 'http://localhost:3000/collect' } } };
        if (key === 'transformers') return { custom: { beforeSend: beforeSendTransformer, beforeBatch: undefined } };
        return undefined;
      });
      (StateManager.prototype as any).get = mockGet;

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      });

      // Track an event
      eventManager.track({
        type: EventType.CUSTOM,
        custom_event: { name: 'test_event' },
      });

      // Flush the queue
      await eventManager.flushImmediately();

      // Transformer should have been called
      expect(beforeSendTransformer).toHaveBeenCalledTimes(1);

      // Event should be filtered out (empty events array)
      const sentPayload = JSON.parse(mockFetch.mock.calls[0]?.[1]?.body || '{}');
      expect(sentPayload.events).toEqual([]);
    });

    it('should handle beforeBatch returning null (cancel send)', async () => {
      const beforeBatchTransformer = vi.fn(() => null);

      const mockGet = vi.fn((key: string) => {
        if (key === 'collectApiUrls') return { saas: '', custom: 'http://localhost:3000/collect' };
        if (key === 'userId') return 'test-user';
        if (key === 'sessionId') return 'test-session';
        if (key === 'device') return DeviceType.Desktop;
        if (key === 'pageUrl') return 'http://localhost:3000';
        if (key === 'config') return { integrations: { custom: { collectApiUrl: 'http://localhost:3000/collect' } } };
        if (key === 'transformers') return { custom: { beforeSend: undefined, beforeBatch: beforeBatchTransformer } };
        return undefined;
      });
      (StateManager.prototype as any).get = mockGet;

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      });

      // Track an event
      eventManager.track({
        type: EventType.CUSTOM,
        custom_event: { name: 'test_event' },
      });

      // Flush the queue
      await eventManager.flushImmediately();

      // Transformer should have been called
      expect(beforeBatchTransformer).toHaveBeenCalledTimes(1);

      // Send should be canceled (no fetch call)
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('TraceLog SaaS - Transformer Isolation', () => {
    it('should NOT apply beforeSend transformer to SaaS destination', async () => {
      const beforeSendTransformer = vi.fn((event: any) => ({
        ...event,
        custom_field: 'should_not_appear',
      }));

      // Setup state with SaaS only and transformer
      const mockGet = vi.fn((key: string) => {
        if (key === 'collectApiUrls') return { saas: 'https://project-id.tracelog.io/collect', custom: '' };
        if (key === 'userId') return 'test-user';
        if (key === 'sessionId') return 'test-session';
        if (key === 'device') return DeviceType.Desktop;
        if (key === 'pageUrl') return 'http://localhost:3000';
        if (key === 'config') return { integrations: { tracelog: { projectId: 'project-id' } } };
        if (key === 'transformers') return { custom: { beforeSend: beforeSendTransformer, beforeBatch: undefined } };
        return undefined;
      });
      (StateManager.prototype as any).get = mockGet;

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      });

      // Track an event
      eventManager.track({
        type: EventType.CUSTOM,
        custom_event: { name: 'test_event' },
      });

      // Flush the queue
      await eventManager.flushImmediately();

      // Transformer should NOT be called for SaaS
      expect(beforeSendTransformer).not.toHaveBeenCalled();

      // Original event should be sent unmodified
      const sentPayload = JSON.parse(mockFetch.mock.calls[0]?.[1]?.body || '{}');
      expect(sentPayload.events[0]).not.toHaveProperty('custom_field');
    });

    it('should NOT apply beforeBatch transformer to SaaS destination', async () => {
      const beforeBatchTransformer = vi.fn((queue: any) => ({
        ...queue,
        batch_metadata: { should_not_appear: true },
      }));

      const mockGet = vi.fn((key: string) => {
        if (key === 'collectApiUrls') return { saas: 'https://project-id.tracelog.io/collect', custom: '' };
        if (key === 'userId') return 'test-user';
        if (key === 'sessionId') return 'test-session';
        if (key === 'device') return DeviceType.Desktop;
        if (key === 'pageUrl') return 'http://localhost:3000';
        if (key === 'config') return { integrations: { tracelog: { projectId: 'project-id' } } };
        if (key === 'transformers') return { custom: { beforeSend: undefined, beforeBatch: beforeBatchTransformer } };
        return undefined;
      });
      (StateManager.prototype as any).get = mockGet;

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      });

      // Track an event
      eventManager.track({
        type: EventType.CUSTOM,
        custom_event: { name: 'test_event' },
      });

      // Flush the queue
      await eventManager.flushImmediately();

      // Transformer should NOT be called for SaaS
      expect(beforeBatchTransformer).not.toHaveBeenCalled();

      // Original batch should be sent unmodified
      const sentPayload = JSON.parse(mockFetch.mock.calls[0]?.[1]?.body || '{}');
      expect(sentPayload).not.toHaveProperty('batch_metadata');
    });
  });

  describe('Dual-Destination - Independent Transformer Application', () => {
    it('should apply transformers only to custom backend when both destinations configured', async () => {
      const beforeSendTransformer = vi.fn((event: any) => ({
        ...event,
        custom_only_field: 'custom_value',
      }));

      const beforeBatchTransformer = vi.fn((queue: any) => ({
        ...queue,
        custom_batch_field: true,
      }));

      // Setup both destinations
      const mockGet = vi.fn((key: string) => {
        if (key === 'collectApiUrls') {
          return {
            saas: 'https://project-id.tracelog.io/collect',
            custom: 'http://localhost:3000/collect',
          };
        }
        if (key === 'userId') return 'test-user';
        if (key === 'sessionId') return 'test-session';
        if (key === 'device') return DeviceType.Desktop;
        if (key === 'pageUrl') return 'http://localhost:3000';
        if (key === 'config') {
          return {
            integrations: {
              tracelog: { projectId: 'project-id' },
              custom: { collectApiUrl: 'http://localhost:3000/collect' },
            },
          };
        }
        if (key === 'transformers') {
          return { custom: { beforeSend: beforeSendTransformer, beforeBatch: beforeBatchTransformer } };
        }
        return undefined;
      });
      (StateManager.prototype as any).get = mockGet;

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      });

      // Track an event
      eventManager.track({
        type: EventType.CUSTOM,
        custom_event: { name: 'test_event' },
      });

      // Flush the queue
      await eventManager.flushImmediately();

      // Transformers should be called ONLY for custom destination (1 event)
      expect(beforeSendTransformer).toHaveBeenCalledTimes(1);
      expect(beforeBatchTransformer).toHaveBeenCalledTimes(1);

      // Verify both destinations were called
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Find SaaS and Custom calls
      const saasCall = mockFetch.mock.calls.find((call) => call[0]?.includes('tracelog.io'));
      const customCall = mockFetch.mock.calls.find((call) => call[0]?.includes('localhost:3000'));

      expect(saasCall).toBeDefined();
      expect(customCall).toBeDefined();

      // Verify SaaS payload is unmodified
      const saasPayload = JSON.parse(saasCall?.[1]?.body || '{}');
      expect(saasPayload.events[0]).not.toHaveProperty('custom_only_field');
      expect(saasPayload).not.toHaveProperty('custom_batch_field');

      // Verify custom payload has transformations
      const customPayload = JSON.parse(customCall?.[1]?.body || '{}');
      expect(customPayload.events[0]).toHaveProperty('custom_only_field', 'custom_value');
      expect(customPayload).toHaveProperty('custom_batch_field', true);
    });

    it('should handle transformer errors gracefully per destination', async () => {
      const beforeSendTransformer = vi.fn(() => {
        throw new Error('Transformer error');
      });

      const mockGet = vi.fn((key: string) => {
        if (key === 'collectApiUrls') {
          return {
            saas: 'https://project-id.tracelog.io/collect',
            custom: 'http://localhost:3000/collect',
          };
        }
        if (key === 'userId') return 'test-user';
        if (key === 'sessionId') return 'test-session';
        if (key === 'device') return DeviceType.Desktop;
        if (key === 'pageUrl') return 'http://localhost:3000';
        if (key === 'config') {
          return {
            integrations: {
              tracelog: { projectId: 'project-id' },
              custom: { collectApiUrl: 'http://localhost:3000/collect' },
            },
          };
        }
        if (key === 'transformers') return { custom: { beforeSend: beforeSendTransformer, beforeBatch: undefined } };
        return undefined;
      });
      (StateManager.prototype as any).get = mockGet;

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      });

      // Track an event
      eventManager.track({
        type: EventType.CUSTOM,
        custom_event: { name: 'test_event' },
      });

      // Flush the queue
      await eventManager.flushImmediately();

      // Both destinations should still receive data
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Custom destination should receive original event (fallback on error)
      const customCall = mockFetch.mock.calls.find((call) => call[0]?.includes('localhost:3000'));
      const customPayload = JSON.parse(customCall?.[1]?.body || '{}');
      expect(customPayload.events).toHaveLength(1);

      // SaaS destination should be unaffected
      const saasCall = mockFetch.mock.calls.find((call) => call[0]?.includes('tracelog.io'));
      const saasPayload = JSON.parse(saasCall?.[1]?.body || '{}');
      expect(saasPayload.events).toHaveLength(1);
    });
  });
});
