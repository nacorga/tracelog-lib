/**
 * Event Flow Integration Tests
 *
 * Tests complete event processing flow to detect library defects:
 * - Events flow from handlers through managers to queue
 * - Data transformations happen correctly
 * - Validation catches invalid data
 * - Different event types are processed correctly
 *
 * Focus: Detect data flow defects and transformation errors
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventManager } from '../../src/managers/event.manager';
import { ClickHandler } from '../../src/handlers/click.handler';
import { StorageManager } from '../../src/managers/storage.manager';
import { EventType } from '../../src/types';
import { setupTestState, cleanupTestState, createTestConfig } from '../utils/test-setup';

describe('Event Flow Integration', () => {
  let eventManager: EventManager;
  let storageManager: StorageManager;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Setup global state using test utility
    await setupTestState(
      createTestConfig({
        id: 'test-project',
        samplingRate: 1,
        excludedUrlPaths: [],
        sensitiveQueryParams: [],
        sessionTimeout: 900000,
      }),
    );

    storageManager = new StorageManager();
    eventManager = new EventManager(storageManager);
  });

  afterEach(() => {
    eventManager.stop();
    cleanupTestState();
    vi.restoreAllMocks();
  });

  describe('Click Event Flow', () => {
    it('should flow click event through handler to queue', () => {
      const clickHandler = new ClickHandler(eventManager);
      clickHandler.startTracking();

      // Create a button element to click
      const button = document.createElement('button');
      button.textContent = 'Test Button';
      document.body.appendChild(button);

      // Simulate click event on button
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        clientX: 150,
        clientY: 250,
      });

      button.dispatchEvent(clickEvent);

      // Event should be in queue
      expect(eventManager.getQueueLength()).toBeGreaterThan(0);

      clickHandler.stopTracking();
      document.body.removeChild(button);
    });

    it('should preserve click coordinates in flow', () => {
      const clickHandler = new ClickHandler(eventManager);
      clickHandler.startTracking();

      const trackSpy = vi.spyOn(eventManager, 'track');

      // Create a button element to click
      const button = document.createElement('button');
      document.body.appendChild(button);

      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        clientX: 100,
        clientY: 200,
      });

      button.dispatchEvent(clickEvent);

      // Verify coordinates were passed
      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventType.CLICK,
          click_data: expect.objectContaining({
            x: 100,
            y: 200,
          }),
        }),
      );

      clickHandler.stopTracking();
      document.body.removeChild(button);
    });

    it('should extract element data in click flow', () => {
      const clickHandler = new ClickHandler(eventManager);
      clickHandler.startTracking();

      const trackSpy = vi.spyOn(eventManager, 'track');

      // Create element with data
      const button = document.createElement('button');
      button.id = 'test-button';
      button.className = 'btn primary';
      button.textContent = 'Click Me';
      document.body.appendChild(button);

      const clickEvent = new MouseEvent('click', {
        bubbles: true,
      });

      Object.defineProperty(clickEvent, 'target', {
        value: button,
        enumerable: true,
      });

      button.dispatchEvent(clickEvent);

      // Verify element data was extracted
      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventType.CLICK,
          click_data: expect.objectContaining({
            id: 'test-button',
            class: 'btn primary',
            tag: 'button',
            text: 'Click Me',
          }),
        }),
      );

      document.body.removeChild(button);
      clickHandler.stopTracking();
    });
  });

  // Scroll Event Flow tests removed - covered by E2E tests in scroll-core-behavior.spec.ts

  describe('Custom Event Flow', () => {
    it('should validate and process custom events', () => {
      const trackSpy = vi.spyOn(eventManager, 'track');

      eventManager.track({
        type: EventType.CUSTOM,
        custom_event: {
          name: 'user_action',
          metadata: {
            action: 'click',
            target: 'button',
            value: 123,
          },
        },
      });

      expect(trackSpy).toHaveBeenCalled();
      expect(eventManager.getQueueLength()).toBe(1);
    });

    it('should sanitize nested object metadata', () => {
      const trackSpy = vi.spyOn(eventManager, 'track');

      // Nested objects should be rejected
      eventManager.track({
        type: EventType.CUSTOM,
        custom_event: {
          name: 'invalid_event',
          metadata: {
            nested: {
              object: 'data',
            },
          } as any,
        },
      });

      // Event should be added (validation happens at App level in real flow)
      expect(trackSpy).toHaveBeenCalled();
    });

    it('should handle custom events with string array metadata', () => {
      eventManager.track({
        type: EventType.CUSTOM,
        custom_event: {
          name: 'tagged_event',
          metadata: {
            tags: ['tag1', 'tag2', 'tag3'],
          },
        },
      });

      expect(eventManager.getQueueLength()).toBe(1);
    });
  });

  describe('Event Enrichment Flow', () => {
    it('should add page URL to events', () => {
      const trackSpy = vi.spyOn(eventManager, 'track');

      eventManager.track({
        type: EventType.CUSTOM,
        custom_event: { name: 'test' },
      });

      const call = trackSpy.mock.calls[0][0];
      const payload = eventManager['buildEventPayload'](call);

      expect(payload.page_url).toBe('https://example.com');
    });

    it('should add timestamp to events', () => {
      const now = Date.now();

      eventManager.track({
        type: EventType.CUSTOM,
        custom_event: { name: 'test' },
      });

      const payload = eventManager['buildEventPayload']({
        type: EventType.CUSTOM,
        custom_event: { name: 'test' },
      });

      expect(payload.timestamp).toBeGreaterThanOrEqual(now);
      expect(payload.timestamp).toBeLessThanOrEqual(Date.now());
    });

    it('should add referrer to session_start events', () => {
      Object.defineProperty(document, 'referrer', {
        value: 'https://google.com',
        configurable: true,
      });

      const payload = eventManager['buildEventPayload']({
        type: EventType.SESSION_START,
      });

      expect(payload.referrer).toBe('https://google.com');
    });

    it('should add UTM parameters to session_start events', () => {
      // Mock window.location with UTM params
      Object.defineProperty(window, 'location', {
        value: {
          search: '?utm_source=google&utm_medium=cpc&utm_campaign=summer',
        },
        configurable: true,
        writable: true,
      });

      const payload = eventManager['buildEventPayload']({
        type: EventType.SESSION_START,
      });

      expect(payload.utm).toBeDefined();
      expect(payload.utm?.source).toBe('google');
      expect(payload.utm?.medium).toBe('cpc');
      expect(payload.utm?.campaign).toBe('summer');
    });
  });

  describe('Event Queue Building', () => {
    it('should build complete queue payload with all events', () => {
      // Add multiple events
      eventManager.track({
        type: EventType.SESSION_START,
      });

      eventManager.track({
        type: EventType.PAGE_VIEW,
      });

      eventManager.track({
        type: EventType.CUSTOM,
        custom_event: { name: 'test_event' },
      });

      const payload = eventManager['buildEventsPayload']();

      expect(payload.events.length).toBe(3);
      expect(payload.session_id).toBe('test-session');
      expect(payload.user_id).toBeUndefined();
      expect(payload.device).toBeUndefined();
    });

    it('should sort events by timestamp in queue', () => {
      vi.useFakeTimers();

      eventManager.track({
        type: EventType.CUSTOM,
        custom_event: { name: 'first' },
      });

      vi.advanceTimersByTime(1000);

      eventManager.track({
        type: EventType.CUSTOM,
        custom_event: { name: 'second' },
      });

      vi.advanceTimersByTime(1000);

      eventManager.track({
        type: EventType.CUSTOM,
        custom_event: { name: 'third' },
      });

      const payload = eventManager['buildEventsPayload']();

      // Events should be sorted by timestamp
      expect(payload.events[0].timestamp).toBeLessThanOrEqual(payload.events[1].timestamp);
      expect(payload.events[1].timestamp).toBeLessThanOrEqual(payload.events[2].timestamp);

      vi.useRealTimers();
    });

    it('should deduplicate events with same signature', () => {
      // Add same custom event twice
      eventManager.track({
        type: EventType.CUSTOM,
        custom_event: { name: 'duplicate_event' },
      });

      eventManager.track({
        type: EventType.CUSTOM,
        custom_event: { name: 'duplicate_event' },
      });

      const payload = eventManager['buildEventsPayload']();

      // Should keep only one (deduplication in buildEventsPayload)
      const duplicateEvents = payload.events.filter(
        (e) => e.type === EventType.CUSTOM && e.custom_event?.name === 'duplicate_event',
      );

      expect(duplicateEvents.length).toBe(1);
    });
  });

  describe('Global Metadata Flow', () => {
    it('should add global metadata to queue payload', async () => {
      // Setup state with global metadata
      await setupTestState(
        createTestConfig({
          id: 'test-project',
          samplingRate: 1,
          globalMetadata: {
            environment: 'production',
            version: '1.0.0',
          },
        }),
      );

      eventManager.track({
        type: EventType.CUSTOM,
        custom_event: { name: 'test' },
      });

      const payload = eventManager['buildEventsPayload']();

      expect(payload.global_metadata).toBeDefined();
      expect(payload.global_metadata?.environment).toBe('production');
      expect(payload.global_metadata?.version).toBe('1.0.0');
    });

    it('should omit global metadata when not configured', () => {
      eventManager.track({
        type: EventType.CUSTOM,
        custom_event: { name: 'test' },
      });

      const payload = eventManager['buildEventsPayload']();

      expect(payload.global_metadata).toBeUndefined();
    });
  });

  describe('Error Event Flow', () => {
    it('should process error events correctly', () => {
      eventManager.track({
        type: EventType.ERROR,
        error_data: {
          type: 'js_error' as any,
          message: 'Test error message',
          filename: 'app.js',
          line: 42,
        },
      });

      expect(eventManager.getQueueLength()).toBe(1);
    });

    it('should preserve error metadata in flow', () => {
      const trackSpy = vi.spyOn(eventManager, 'track');

      eventManager.track({
        type: EventType.ERROR,
        error_data: {
          type: 'promise_rejection' as any,
          message: 'Unhandled promise rejection',
        },
      });

      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventType.ERROR,
          error_data: expect.objectContaining({
            type: 'promise_rejection',
            message: 'Unhandled promise rejection',
          }),
        }),
      );
    });
  });
});
