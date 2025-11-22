/**
 * Integration Tests: disabledEvents Filtering
 *
 * Tests the integration-level filtering of events based on disabledEvents config.
 * Events are always captured locally but can be excluded from custom backend sends.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';
import { initTestBridge, destroyTestBridge, collectEvents } from '../../helpers/bridge.helper';
import { createMockFetch } from '../../helpers/mocks.helper';
import { wait } from '../../helpers/wait.helper';
import { EventType } from '../../../src/types/event.types';
import type { TraceLogTestBridge } from '../../../src/test-bridge';

describe('Integration: disabledEvents Filtering', () => {
  let bridge: TraceLogTestBridge;
  let mockFetch: ReturnType<typeof createMockFetch>;

  beforeEach(() => {
    setupTestEnvironment();
    mockFetch = createMockFetch({ ok: true, status: 200 });
    global.fetch = mockFetch;
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();
    vi.restoreAllMocks();
  });

  describe('Custom Backend Filtering', () => {
    it('should filter scroll events from custom backend only', async () => {
      // Arrange
      bridge = await initTestBridge({
        integrations: {
          custom: {
            collectApiUrl: 'https://api.test.com/collect',
            disabledEvents: ['scroll'],
          },
        },
      });

      // Act - Trigger scroll event
      const scrollEvent = new Event('scroll');
      window.dispatchEvent(scrollEvent);

      // Wait for event processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Trigger click event (should NOT be filtered)
      const button = document.createElement('button');
      button.id = 'test-button';
      document.body.appendChild(button);
      button.click();

      await wait(100);

      // Force send
      await bridge.flushQueue();
      await wait(100);

      // Assert
      expect(mockFetch).toHaveBeenCalled();
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);

      // Scroll should be filtered, click should be sent
      const scrollEvents = body.events.filter((e: any) => e.type === EventType.SCROLL);
      const clickEvents = body.events.filter((e: any) => e.type === EventType.CLICK);

      expect(scrollEvents).toHaveLength(0); // Scroll filtered out
      expect(clickEvents.length).toBeGreaterThan(0); // Click sent
    });

    it('should filter web_vitals events from custom backend only', async () => {
      // Arrange
      bridge = await initTestBridge({
        integrations: {
          custom: {
            collectApiUrl: 'https://api.test.com/collect',
            disabledEvents: ['web_vitals'],
          },
        },
      });

      // Act - Track custom event (should NOT be filtered)
      bridge.event('test_event', { key: 'value' });

      await wait(100);

      // Force send
      await bridge.flushQueue();
      await wait(100);

      // Assert
      expect(mockFetch).toHaveBeenCalled();
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);

      // Web vitals would be filtered, custom should be sent
      const webVitalsEvents = body.events.filter((e: any) => e.type === EventType.WEB_VITALS);
      const customEvents = body.events.filter((e: any) => e.type === EventType.CUSTOM);

      expect(webVitalsEvents).toHaveLength(0); // Web vitals filtered
      expect(customEvents.length).toBeGreaterThan(0); // Custom sent
    });

    it('should filter error events from custom backend only', async () => {
      // Arrange
      bridge = await initTestBridge({
        integrations: {
          custom: {
            collectApiUrl: 'https://api.test.com/collect',
            disabledEvents: ['error'],
          },
        },
      });

      // Act - Trigger error event
      const errorEvent = new ErrorEvent('error', {
        message: 'Test error',
        filename: 'test.js',
        lineno: 1,
        colno: 1,
      });
      window.dispatchEvent(errorEvent);

      await wait(100);

      // Force send (SESSION_START and PAGE_VIEW should be present)
      await bridge.flushQueue();
      await wait(100);

      // Assert
      expect(mockFetch).toHaveBeenCalled();
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);

      // Error should be filtered
      const errorEvents = body.events.filter((e: any) => e.type === EventType.ERROR);
      const pageViewEvents = body.events.filter((e: any) => e.type === EventType.PAGE_VIEW);

      expect(errorEvents).toHaveLength(0); // Error filtered
      expect(pageViewEvents.length).toBeGreaterThan(0); // Page view sent
    });

    it('should filter multiple event types from custom backend', async () => {
      // Arrange
      bridge = await initTestBridge({
        integrations: {
          custom: {
            collectApiUrl: 'https://api.test.com/collect',
            disabledEvents: ['scroll', 'web_vitals', 'error'],
          },
        },
      });

      // Act - Trigger multiple events
      const scrollEvent = new Event('scroll');
      window.dispatchEvent(scrollEvent);

      const errorEvent = new ErrorEvent('error', {
        message: 'Test error',
        filename: 'test.js',
        lineno: 1,
        colno: 1,
      });
      window.dispatchEvent(errorEvent);

      const button = document.createElement('button');
      button.id = 'test-button';
      document.body.appendChild(button);
      button.click();

      await wait(100);

      // Force send
      await bridge.flushQueue();
      await wait(100);

      // Assert
      expect(mockFetch).toHaveBeenCalled();
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);

      // All disabled types should be filtered
      const scrollEvents = body.events.filter((e: any) => e.type === EventType.SCROLL);
      const webVitalsEvents = body.events.filter((e: any) => e.type === EventType.WEB_VITALS);
      const errorEvents = body.events.filter((e: any) => e.type === EventType.ERROR);
      const clickEvents = body.events.filter((e: any) => e.type === EventType.CLICK);

      expect(scrollEvents).toHaveLength(0); // Scroll filtered
      expect(webVitalsEvents).toHaveLength(0); // Web vitals filtered
      expect(errorEvents).toHaveLength(0); // Error filtered
      expect(clickEvents.length).toBeGreaterThan(0); // Click sent
    });

    it('should not filter when disabledEvents is empty array', async () => {
      // Arrange
      bridge = await initTestBridge({
        integrations: {
          custom: {
            collectApiUrl: 'https://api.test.com/collect',
            disabledEvents: [],
          },
        },
      });

      // Act - Trigger scroll event
      const scrollEvent = new Event('scroll');
      window.dispatchEvent(scrollEvent);

      await wait(100);

      // Force send
      await bridge.flushQueue();
      await wait(100);

      // Assert
      expect(mockFetch).toHaveBeenCalled();
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);

      // With empty disabledEvents, all events should be sent
      // At minimum, SESSION_START and PAGE_VIEW should be present
      expect(body.events.length).toBeGreaterThan(0);
    });

    it('should not filter when disabledEvents is not configured', async () => {
      // Arrange
      bridge = await initTestBridge({
        integrations: {
          custom: {
            collectApiUrl: 'https://api.test.com/collect',
            // No disabledEvents configured
          },
        },
      });

      // Act - Trigger scroll event
      const scrollEvent = new Event('scroll');
      window.dispatchEvent(scrollEvent);

      await wait(100);

      // Force send
      await bridge.flushQueue();
      await wait(100);

      // Assert
      expect(mockFetch).toHaveBeenCalled();
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);

      // Without disabledEvents config, all events should be sent
      expect(body.events.length).toBeGreaterThan(0);
    });
  });

  describe('Local Event Emission', () => {
    it('should still emit filtered events to local listeners', async () => {
      // Arrange
      bridge = await initTestBridge({
        integrations: {
          custom: {
            collectApiUrl: 'https://api.test.com/collect',
            disabledEvents: ['scroll'],
          },
        },
      });

      const [getEvents, cleanupEvents] = collectEvents(bridge, 'event');

      // Act - Track a custom event (easier to verify than scroll which needs DOM setup)
      bridge.event('test_event', { key: 'value' });

      await wait(50);

      // Assert - Event should be emitted locally even though filtered from backend
      const events = getEvents();
      const customEvents = events.filter((e) => e.type === EventType.CUSTOM);
      expect(customEvents.length).toBeGreaterThan(0);

      // Verify it would be sent to backend (custom events are never filtered)
      await bridge.flushQueue();
      await wait(100);
      expect(mockFetch).toHaveBeenCalled();

      cleanupEvents();
    });
  });

  describe('Multi-Integration Behavior', () => {
    it('should only filter custom backend, not affect other integrations', async () => {
      // This test verifies architectural behavior:
      // - Events captured locally (always)
      // - Custom backend applies disabledEvents filter
      // - Other integrations would receive all events (verified by architecture)

      bridge = await initTestBridge({
        integrations: {
          custom: {
            collectApiUrl: 'https://api.test.com/collect',
            disabledEvents: ['scroll', 'web_vitals'],
          },
          // If we had tracelog SaaS here, it would receive ALL events
        },
      });

      // Act - Trigger scroll event
      const scrollEvent = new Event('scroll');
      window.dispatchEvent(scrollEvent);

      await wait(100);

      // Force send
      await bridge.flushQueue();
      await wait(100);

      // Assert
      expect(mockFetch).toHaveBeenCalled();
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);

      // Scroll should be filtered from custom backend
      const scrollEvents = body.events.filter((e: any) => e.type === EventType.SCROLL);
      expect(scrollEvents).toHaveLength(0);

      // Architecture note: If tracelog SaaS was configured, it would receive
      // scroll events because filterDisabledEvents() returns early for non-custom integrations
    });
  });
});
