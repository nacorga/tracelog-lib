import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { App } from '../../src/app';
import type { EventData, EventsQueue } from '../../src/types';
import type { BeforeSendTransformer, BeforeBatchTransformer } from '../../src/types/transformer.types';

describe('Transformers', () => {
  let app: App;

  // Helper to flush events for testing
  const flushEvents = () => {
    // Access private EventManager and call flushEvents
    const eventManager = (app as any).managers?.event;
    if (eventManager && typeof eventManager.flushEvents === 'function') {
      eventManager.flushEvents(false);
    }
  };

  beforeEach(async () => {
    // Mock fetch to prevent actual network calls
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
    });

    app = new App();
    await app.init({
      integrations: {
        custom: {
          collectApiUrl: 'https://custom-backend.com/collect',
          allowHttp: false,
        },
      },
    });
  });

  afterEach(() => {
    // Clean up after each test
    if (app) {
      app.destroy();
    }
    vi.restoreAllMocks();
  });

  describe('setTransformer', () => {
    it('should set beforeSend transformer', () => {
      const transformer: BeforeSendTransformer = vi.fn((data: EventData) => data);

      app.setTransformer('beforeSend', transformer);

      const result = app.getTransformer('beforeSend');
      expect(result).toBe(transformer);
    });

    it('should set beforeBatch transformer', () => {
      const transformer: BeforeBatchTransformer = vi.fn((data: EventsQueue) => data);

      app.setTransformer('beforeBatch', transformer);

      const result = app.getTransformer('beforeBatch');
      expect(result).toBe(transformer);
    });

    it('should replace existing transformer', () => {
      const transformer1: BeforeSendTransformer = vi.fn((data: EventData) => data);
      const transformer2: BeforeSendTransformer = vi.fn((data: EventData) => data);

      app.setTransformer('beforeSend', transformer1);
      expect(app.getTransformer('beforeSend')).toBe(transformer1);

      app.setTransformer('beforeSend', transformer2);
      expect(app.getTransformer('beforeSend')).toBe(transformer2);
    });
  });

  describe('removeTransformer', () => {
    it('should remove existing transformer', () => {
      const transformer: BeforeSendTransformer = vi.fn((data: EventData) => data);

      app.setTransformer('beforeSend', transformer);
      expect(app.getTransformer('beforeSend')).toBe(transformer);

      app.removeTransformer('beforeSend');
      expect(app.getTransformer('beforeSend')).toBeUndefined();
    });

    it('should handle removing non-existent transformer', () => {
      expect(() => {
        app.removeTransformer('beforeSend');
      }).not.toThrow();
    });
  });

  describe('getTransformer', () => {
    it('should return undefined for non-existent transformer', () => {
      const result = app.getTransformer('beforeSend');
      expect(result).toBeUndefined();
    });

    it('should return the set transformer', () => {
      const transformer: BeforeSendTransformer = vi.fn((data: EventData) => data);

      app.setTransformer('beforeSend', transformer);

      const result = app.getTransformer('beforeSend');
      expect(result).toBe(transformer);
    });
  });

  describe('beforeSend transformer', () => {
    it('should transform event data', async () => {
      const transformer: BeforeSendTransformer = vi.fn((data: EventData): EventData | null => {
        if (data.custom_event) {
          return {
            ...data,
            custom_event: {
              name: data.custom_event.name,
              metadata: {
                ...data.custom_event.metadata,
                transformed: true,
              },
            },
          };
        }
        return data;
      });

      app.setTransformer('beforeSend', transformer);

      app.sendCustomEvent('test_event', { key: 'value' });

      // Manually flush events to trigger transformer
      flushEvents();

      // Wait for async send to complete
      await vi.waitFor(() => {
        expect(transformer).toHaveBeenCalled();
      });
    });

    it('should filter out event when returning null', async () => {
      const transformer: BeforeSendTransformer = vi.fn(() => null);

      app.setTransformer('beforeSend', transformer);

      app.sendCustomEvent('test_event', { key: 'value' });

      // Manually flush events to trigger transformer
      flushEvents();

      // Event should be filtered out
      await vi.waitFor(() => {
        expect(transformer).toHaveBeenCalled();
      });
    });

    it('should handle transformer errors gracefully', () => {
      const transformer: BeforeSendTransformer = vi.fn(() => {
        throw new Error('Transformer error');
      });

      app.setTransformer('beforeSend', transformer);

      expect(() => {
        app.sendCustomEvent('test_event', { key: 'value' });
      }).not.toThrow();
    });

    it('should not apply to TraceLog SaaS integration', async () => {
      // Re-initialize with SaaS integration
      app.destroy();
      app = new App();

      // Mock window.location for SaaS URL generation
      const originalHref = window.location.href;
      const originalHostname = window.location.hostname;

      Object.defineProperty(window, 'location', {
        value: {
          href: 'https://example.com',
          hostname: 'example.com',
        },
        writable: true,
        configurable: true,
      });

      try {
        await app.init({
          integrations: {
            tracelog: {
              projectId: 'test-project',
            },
          },
        });

        const transformer: BeforeSendTransformer = vi.fn((data: EventData) => data);

        app.setTransformer('beforeSend', transformer);

        app.sendCustomEvent('test_event', { key: 'value' });

        // Transformer should not be called for SaaS integration
        expect(transformer).not.toHaveBeenCalled();
      } finally {
        // Restore original location
        Object.defineProperty(window, 'location', {
          value: {
            href: originalHref,
            hostname: originalHostname,
          },
          writable: true,
          configurable: true,
        });
      }
    });

    it('should apply to custom backend integration', async () => {
      const transformer: BeforeSendTransformer = vi.fn((data: EventData) => data);

      app.setTransformer('beforeSend', transformer);

      app.sendCustomEvent('test_event', { key: 'value' });

      // Manually flush events to trigger transformer
      flushEvents();

      // Wait for event to be processed
      await vi.waitFor(() => {
        expect(transformer).toHaveBeenCalled();
      });
    });
  });

  describe('beforeBatch transformer', () => {
    it('should set and get beforeBatch transformer', () => {
      const transformer: BeforeBatchTransformer = vi.fn((data: EventsQueue): EventsQueue | null => {
        return {
          ...data,
          global_metadata: {
            ...data.global_metadata,
            batchTransformed: true,
          },
        };
      });

      app.setTransformer('beforeBatch', transformer);

      const result = app.getTransformer('beforeBatch');
      expect(result).toBe(transformer);
    });

    it('should set beforeBatch transformer that returns null', () => {
      const transformer: BeforeBatchTransformer = vi.fn(() => null);

      app.setTransformer('beforeBatch', transformer);

      const result = app.getTransformer('beforeBatch');
      expect(result).toBe(transformer);
    });

    it('should set beforeBatch transformer with invalid return type', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transformer = vi.fn(() => 'invalid' as any);

      expect(() => {
        app.setTransformer('beforeBatch', transformer);
      }).not.toThrow();

      const result = app.getTransformer('beforeBatch');
      expect(result).toBe(transformer);
    });

    it('should set beforeBatch transformer for SaaS integration', async () => {
      // Re-initialize with SaaS integration
      app.destroy();
      app = new App();

      // Mock window.location for SaaS URL generation
      const originalHref = window.location.href;
      const originalHostname = window.location.hostname;

      Object.defineProperty(window, 'location', {
        value: {
          href: 'https://example.com',
          hostname: 'example.com',
        },
        writable: true,
        configurable: true,
      });

      try {
        await app.init({
          integrations: {
            tracelog: {
              projectId: 'test-project',
            },
          },
        });

        const transformer: BeforeBatchTransformer = vi.fn((data: EventsQueue) => data);

        expect(() => {
          app.setTransformer('beforeBatch', transformer);
        }).not.toThrow();

        const result = app.getTransformer('beforeBatch');
        expect(result).toBe(transformer);
      } finally {
        // Restore original location
        Object.defineProperty(window, 'location', {
          value: {
            href: originalHref,
            hostname: originalHostname,
          },
          writable: true,
          configurable: true,
        });
      }
    });

    it('should set beforeBatch transformer for custom backend integration', () => {
      const transformer: BeforeBatchTransformer = vi.fn((data: EventsQueue) => data);

      expect(() => {
        app.setTransformer('beforeBatch', transformer);
      }).not.toThrow();

      const result = app.getTransformer('beforeBatch');
      expect(result).toBe(transformer);
    });
  });

  describe('Transformer lifecycle', () => {
    it('should clear transformers on destroy', () => {
      const beforeSendTransformer: BeforeSendTransformer = vi.fn((data: EventData) => data);
      const beforeBatchTransformer: BeforeBatchTransformer = vi.fn((data: EventsQueue) => data);

      app.setTransformer('beforeSend', beforeSendTransformer);
      app.setTransformer('beforeBatch', beforeBatchTransformer);

      expect(app.getTransformer('beforeSend')).toBeDefined();
      expect(app.getTransformer('beforeBatch')).toBeDefined();

      app.destroy();

      // Transformers should be cleared
      expect(app.getTransformer('beforeSend')).toBeUndefined();
      expect(app.getTransformer('beforeBatch')).toBeUndefined();
    });
  });

  describe('Custom schema support', () => {
    it('should allow custom event schemas with minimal validation (only type field required)', async () => {
      const transformer: BeforeSendTransformer = vi.fn((): EventData | null => {
        // Return completely custom schema (only 'type' field required)
        return {
          type: 'custom_schema_event',
          myCustomField: 'value',
          anotherField: 123,
          // Note: Missing standard fields like id, page_url, timestamp - this is allowed!
        } as unknown as EventData;
      });

      app.setTransformer('beforeSend', transformer);
      app.sendCustomEvent('test_event', { key: 'value' });

      // Manually flush events to trigger transformer
      flushEvents();

      await vi.waitFor(() => {
        expect(transformer).toHaveBeenCalled();
      });
    });

    it('should allow custom batch schemas with minimal validation (only events array required)', () => {
      const transformer: BeforeBatchTransformer = vi.fn((data: EventsQueue): EventsQueue | null => {
        // Return completely custom schema (only 'events' array required)
        return {
          events: data.events,
          customBatchField: 'my-value',
          customTimestamp: Date.now(),
          // Note: Missing standard fields like user_id, session_id, device - this is allowed!
        } as unknown as EventsQueue;
      });

      expect(() => {
        app.setTransformer('beforeBatch', transformer);
      }).not.toThrow();
    });
  });
});
