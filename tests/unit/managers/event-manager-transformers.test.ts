/**
 * EventManager - Transformer Unit Tests
 *
 * Tests transformer functionality for event processing:
 * - beforeSend transformer filters events per-integration
 * - beforeBatch transformer filters entire queue
 * - Error handling with fallback to original data
 * - Integration-specific transformer isolation (SaaS vs Custom)
 *
 * Focus: Verify transformer filtering and error handling in multi-destination context
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventManager } from '../../../src/managers/event.manager';
import { StorageManager } from '../../../src/managers/storage.manager';
import { StateManager, resetGlobalState } from '../../../src/managers/state.manager';
import { EventType, EventData, DeviceType } from '../../../src/types';

describe('EventManager - Transformers', () => {
  let eventManager: EventManager;
  let storageManager: StorageManager;

  beforeEach(() => {
    vi.clearAllMocks();
    resetGlobalState();

    // Setup global state with both SaaS and Custom integrations
    const mockGet = vi.fn((key: string) => {
      if (key === 'sessionId') return 'test-session-123';
      if (key === 'userId') return 'test-user-456';
      if (key === 'collectApiUrls')
        return {
          saas: 'https://project-id.example.com/collect',
          custom: 'http://localhost:3000/collect',
        };
      if (key === 'device') return DeviceType.Desktop;
      if (key === 'pageUrl') return 'http://localhost:3000/test';
      if (key === 'config')
        return {
          integrations: {
            tracelog: { projectId: 'project-id' },
            custom: { collectApiUrl: 'http://localhost:3000/collect', allowHttp: true },
          },
        };
      if (key === 'transformers') return {};
      return undefined;
    });
    (StateManager.prototype as any).get = mockGet;

    storageManager = new StorageManager();
    eventManager = new EventManager(storageManager);
  });

  afterEach(() => {
    eventManager.stop();
    resetGlobalState();
    vi.restoreAllMocks();
  });

  describe('Integration-Specific Filtering', () => {
    it('should filter event from Custom but still include in SaaS when beforeSend returns null', () => {
      // Setup transformer that filters events for Custom only
      const mockGet = vi.fn((key: string) => {
        if (key === 'sessionId') return 'test-session-123';
        if (key === 'userId') return 'test-user-456';
        if (key === 'collectApiUrls')
          return {
            saas: 'https://project-id.example.com/collect',
            custom: 'http://localhost:3000/collect',
          };
        if (key === 'device') return DeviceType.Desktop;
        if (key === 'pageUrl') return 'http://localhost:3000/test';
        if (key === 'config')
          return {
            integrations: {
              tracelog: { projectId: 'project-id' },
              custom: { collectApiUrl: 'http://localhost:3000/collect', allowHttp: true },
            },
          };
        if (key === 'transformers')
          return {
            custom: {
              beforeSend: (event: EventData) => {
                // Filter out CLICK events from Custom backend
                if (event.type === EventType.CLICK) return null;
                return event;
              },
            },
          };
        return undefined;
      });
      (StateManager.prototype as any).get = mockGet;

      // Track a CLICK event
      eventManager.track({
        type: EventType.CLICK,
        click: { x: 100, y: 200, target: 'button' },
      } as any);

      // Build payloads
      const payloads = eventManager['buildEventsPayloads']();

      // SaaS should have the event (no transformer applied to SaaS)
      expect(payloads.saas).toBeDefined();
      expect(payloads.saas!.events.length).toBe(1);
      expect(payloads.saas!.events[0]?.type).toBe(EventType.CLICK);

      // Custom should have empty events array (all filtered by beforeSend)
      expect(payloads.custom).toBeDefined();
      expect(payloads.custom!.events.length).toBe(0);
    });

    it('should apply beforeBatch transformer only to Custom backend', () => {
      // Setup beforeBatch transformer
      const mockGet = vi.fn((key: string) => {
        if (key === 'sessionId') return 'test-session-123';
        if (key === 'userId') return 'test-user-456';
        if (key === 'collectApiUrls')
          return {
            saas: 'https://project-id.example.com/collect',
            custom: 'http://localhost:3000/collect',
          };
        if (key === 'device') return DeviceType.Desktop;
        if (key === 'pageUrl') return 'http://localhost:3000/test';
        if (key === 'config')
          return {
            integrations: {
              tracelog: { projectId: 'project-id' },
              custom: { collectApiUrl: 'http://localhost:3000/collect', allowHttp: true },
            },
          };
        if (key === 'transformers')
          return {
            custom: {
              beforeBatch: () => null, // Cancel entire batch for Custom
            },
          };
        return undefined;
      });
      (StateManager.prototype as any).get = mockGet;

      // Track an event
      eventManager.track({
        type: EventType.CUSTOM,
        custom_event: { name: 'test_event' },
      });

      // Build payloads
      const payloads = eventManager['buildEventsPayloads']();

      // SaaS should have the event (beforeBatch doesn't apply to SaaS)
      expect(payloads.saas).toBeDefined();
      expect(payloads.saas!.events.length).toBe(1);

      // Custom should be null or undefined (beforeBatch filtered entire queue)
      expect(payloads.custom).toBeFalsy();
    });
  });

  describe('Error Handling', () => {
    it('should handle transformer errors gracefully with fallback to original data', () => {
      // Setup transformer that throws error
      const mockGet = vi.fn((key: string) => {
        if (key === 'sessionId') return 'test-session-123';
        if (key === 'userId') return 'test-user-456';
        if (key === 'collectApiUrls')
          return {
            saas: '',
            custom: 'http://localhost:3000/collect',
          };
        if (key === 'device') return DeviceType.Desktop;
        if (key === 'pageUrl') return 'http://localhost:3000/test';
        if (key === 'config')
          return {
            integrations: {
              custom: { collectApiUrl: 'http://localhost:3000/collect', allowHttp: true },
            },
          };
        if (key === 'transformers')
          return {
            custom: {
              beforeSend: () => {
                throw new Error('Transformer error!');
              },
            },
          };
        return undefined;
      });
      (StateManager.prototype as any).get = mockGet;

      // Track an event
      eventManager.track({
        type: EventType.CUSTOM,
        custom_event: { name: 'test_event', metadata: { key: 'value' } },
      });

      // Build payloads - should not throw
      const payloads = eventManager['buildEventsPayloads']();

      // Custom should still have the event (fallback to original)
      expect(payloads.custom).toBeDefined();
      expect(payloads.custom!.events.length).toBe(1);
      expect(payloads.custom!.events[0]?.type).toBe(EventType.CUSTOM);
      expect(payloads.custom!.events[0]?.custom_event?.name).toBe('test_event');
    });

    it('should handle beforeBatch errors gracefully with fallback to original queue', () => {
      // Setup beforeBatch transformer that throws error
      const mockGet = vi.fn((key: string) => {
        if (key === 'sessionId') return 'test-session-123';
        if (key === 'userId') return 'test-user-456';
        if (key === 'collectApiUrls')
          return {
            saas: '',
            custom: 'http://localhost:3000/collect',
          };
        if (key === 'device') return DeviceType.Desktop;
        if (key === 'pageUrl') return 'http://localhost:3000/test';
        if (key === 'config')
          return {
            integrations: {
              custom: { collectApiUrl: 'http://localhost:3000/collect', allowHttp: true },
            },
          };
        if (key === 'transformers')
          return {
            custom: {
              beforeBatch: () => {
                throw new Error('Batch transformer error!');
              },
            },
          };
        return undefined;
      });
      (StateManager.prototype as any).get = mockGet;

      // Track multiple events
      eventManager.track({
        type: EventType.CUSTOM,
        custom_event: { name: 'event1' },
      });
      eventManager.track({
        type: EventType.CUSTOM,
        custom_event: { name: 'event2' },
      });

      // Build payloads - should not throw
      const payloads = eventManager['buildEventsPayloads']();

      // Custom should still have all events (fallback to original queue)
      expect(payloads.custom).toBeDefined();
      expect(payloads.custom!.events.length).toBe(2);
    });
  });

  describe('Transformer Isolation', () => {
    it('should not apply Custom transformers to SaaS destination', () => {
      // Setup Custom transformer that modifies events
      const mockGet = vi.fn((key: string) => {
        if (key === 'sessionId') return 'test-session-123';
        if (key === 'userId') return 'test-user-456';
        if (key === 'collectApiUrls')
          return {
            saas: 'https://project-id.example.com/collect',
            custom: 'http://localhost:3000/collect',
          };
        if (key === 'device') return DeviceType.Desktop;
        if (key === 'pageUrl') return 'http://localhost:3000/test';
        if (key === 'config')
          return {
            integrations: {
              tracelog: { projectId: 'project-id' },
              custom: { collectApiUrl: 'http://localhost:3000/collect', allowHttp: true },
            },
          };
        if (key === 'transformers')
          return {
            custom: {
              beforeSend: (event: EventData) => {
                // Add custom field to event
                return { ...event, custom_field: 'transformed' };
              },
            },
          };
        return undefined;
      });
      (StateManager.prototype as any).get = mockGet;

      // Track an event
      eventManager.track({
        type: EventType.CUSTOM,
        custom_event: { name: 'test_event' },
      });

      // Build payloads
      const payloads = eventManager['buildEventsPayloads']();

      // SaaS should have original event (no custom_field)
      expect(payloads.saas).toBeDefined();
      expect(payloads.saas!.events[0]).not.toHaveProperty('custom_field');

      // Custom should have transformed event (with custom_field)
      expect(payloads.custom).toBeDefined();
      expect(payloads.custom!.events[0]).toHaveProperty('custom_field', 'transformed');
    });
  });
});
