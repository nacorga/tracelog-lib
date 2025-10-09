import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventManager } from '../../../src/managers/event.manager';
import { EventType, ScrollDirection } from '../../../src/types';
import { setupTestEnvironment, cleanupTestState } from '../../utils/test-setup';

vi.mock('../../../src/utils/logging', () => ({
  debugLog: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('EventManager - Deduplication', () => {
  let eventManager: EventManager;

  beforeEach(() => {
    const testEnv = setupTestEnvironment();
    eventManager = testEnv.eventManager;
  });

  afterEach(() => {
    cleanupTestState();
  });

  test('should not deduplicate different event types', () => {
    eventManager.track({
      type: EventType.CLICK,
      page_url: 'https://example.com',
      click_data: { x: 100, y: 200, relativeX: 50, relativeY: 50 },
    });

    eventManager.track({
      type: EventType.SCROLL,
      page_url: 'https://example.com',
      scroll_data: {
        depth: 50,
        direction: ScrollDirection.DOWN,
        container_selector: 'window',
        is_primary: true,
        velocity: 0,
        max_depth_reached: 50,
      },
    });

    expect(eventManager.getQueueLength()).toBe(2);
  });

  test('should not deduplicate events on different URLs', () => {
    eventManager.track({
      type: EventType.CLICK,
      page_url: 'https://example.com/page1',
      click_data: { x: 100, y: 200, relativeX: 50, relativeY: 50 },
    });

    eventManager.track({
      type: EventType.CLICK,
      page_url: 'https://example.com/page2',
      click_data: { x: 100, y: 200, relativeX: 50, relativeY: 50 },
    });

    expect(eventManager.getQueueLength()).toBe(2);
  });

  test('should deduplicate identical click events', () => {
    const clickEvent = {
      type: EventType.CLICK,
      page_url: 'https://example.com',
      click_data: { x: 100, y: 200, relativeX: 50, relativeY: 50 },
    };

    eventManager.track(clickEvent);
    eventManager.track(clickEvent);

    expect(eventManager.getQueueLength()).toBe(1);
  });

  test('should deduplicate similar clicks within tolerance', () => {
    eventManager.track({
      type: EventType.CLICK,
      page_url: 'https://example.com',
      click_data: { x: 100, y: 200, relativeX: 50, relativeY: 50 },
    });

    // Within 5px tolerance
    eventManager.track({
      type: EventType.CLICK,
      page_url: 'https://example.com',
      click_data: { x: 102, y: 203, relativeX: 51, relativeY: 51 },
    });

    expect(eventManager.getQueueLength()).toBe(1);
  });

  test('should NOT deduplicate clicks outside tolerance', () => {
    eventManager.track({
      type: EventType.CLICK,
      page_url: 'https://example.com',
      click_data: { x: 100, y: 200, relativeX: 50, relativeY: 50 },
    });

    // > 5px tolerance
    eventManager.track({
      type: EventType.CLICK,
      page_url: 'https://example.com',
      click_data: { x: 110, y: 210, relativeX: 55, relativeY: 55 },
    });

    expect(eventManager.getQueueLength()).toBe(2);
  });

  test('should deduplicate identical scroll events', () => {
    eventManager.track({
      type: EventType.SCROLL,
      page_url: 'https://example.com',
      scroll_data: {
        depth: 50,
        direction: ScrollDirection.DOWN,
        container_selector: 'window',
        is_primary: true,
        velocity: 0,
        max_depth_reached: 50,
      },
    });

    eventManager.track({
      type: EventType.SCROLL,
      page_url: 'https://example.com',
      scroll_data: {
        depth: 50,
        direction: ScrollDirection.DOWN,
        container_selector: 'window',
        is_primary: true,
        velocity: 0,
        max_depth_reached: 50,
      },
    });

    expect(eventManager.getQueueLength()).toBe(1);
  });

  test('should NOT deduplicate scrolls with different depth', () => {
    eventManager.track({
      type: EventType.SCROLL,
      page_url: 'https://example.com',
      scroll_data: {
        depth: 50,
        direction: ScrollDirection.DOWN,
        container_selector: 'window',
        is_primary: true,
        velocity: 0,
        max_depth_reached: 50,
      },
    });

    eventManager.track({
      type: EventType.SCROLL,
      page_url: 'https://example.com',
      scroll_data: {
        depth: 75,
        direction: ScrollDirection.DOWN,
        container_selector: 'window',
        is_primary: true,
        velocity: 0,
        max_depth_reached: 75,
      },
    });

    expect(eventManager.getQueueLength()).toBe(2);
  });

  test('should deduplicate custom events with same name', () => {
    eventManager.track({
      type: EventType.CUSTOM,
      page_url: 'https://example.com',
      custom_event: { name: 'button_click' },
    });

    eventManager.track({
      type: EventType.CUSTOM,
      page_url: 'https://example.com',
      custom_event: { name: 'button_click' },
    });

    expect(eventManager.getQueueLength()).toBe(1);
  });

  test('should NOT deduplicate after threshold time', () => {
    vi.useFakeTimers();

    const clickEvent = {
      type: EventType.CLICK,
      page_url: 'https://example.com',
      click_data: { x: 100, y: 200, relativeX: 50, relativeY: 50 },
    };

    eventManager.track(clickEvent);

    // Advance time beyond threshold (1000ms)
    vi.advanceTimersByTime(1500);

    eventManager.track(clickEvent);

    expect(eventManager.getQueueLength()).toBe(2);

    vi.useRealTimers();
  });
});
