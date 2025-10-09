import { describe, test, expect } from 'vitest';
import {
  EventType,
  isPrimaryScrollEvent,
  isSecondaryScrollEvent,
  EventData,
  ScrollDirection,
} from '../../../src/types';

// Helper to create test event data with required fields
function createTestEvent(partial: Partial<EventData>): EventData {
  return {
    id: 'test-id',
    page_url: 'https://example.com',
    timestamp: Date.now(),
    ...partial,
  } as EventData;
}

describe('Event Type Guards', () => {
  describe('isPrimaryScrollEvent', () => {
    test('should return true for scroll event with is_primary true', () => {
      const event = createTestEvent({
        type: EventType.SCROLL,
        scroll_data: {
          depth: 50,
          direction: ScrollDirection.DOWN,
          container_selector: 'window',
          is_primary: true,
          velocity: 1000,
          max_depth_reached: 50,
        },
      });

      expect(isPrimaryScrollEvent(event)).toBe(true);
    });

    test('should return false for scroll event with is_primary false', () => {
      const event = createTestEvent({
        type: EventType.SCROLL,
        scroll_data: {
          depth: 30,
          direction: ScrollDirection.UP,
          container_selector: '.sidebar',
          is_primary: false,
          velocity: 500,
          max_depth_reached: 40,
        },
      });

      expect(isPrimaryScrollEvent(event)).toBe(false);
    });

    test('should return false for non-scroll events', () => {
      const event = createTestEvent({
        type: EventType.CLICK,
        click_data: {
          x: 100,
          y: 200,
          relativeX: 50,
          relativeY: 100,
          tag: 'button',
        },
      });

      expect(isPrimaryScrollEvent(event)).toBe(false);
    });

    test('should narrow type correctly', () => {
      const event = createTestEvent({
        type: EventType.SCROLL,
        scroll_data: {
          depth: 75,
          direction: ScrollDirection.DOWN,
          container_selector: '#main-content',
          is_primary: true,
          velocity: 1200,
          max_depth_reached: 75,
        },
      });

      if (isPrimaryScrollEvent(event)) {
        // TypeScript should know is_primary === true
        const isPrimary: true = event.scroll_data.is_primary;
        expect(isPrimary).toBe(true);
      }
    });
  });

  describe('isSecondaryScrollEvent', () => {
    test('should return true for scroll event with is_primary false', () => {
      const event = createTestEvent({
        type: EventType.SCROLL,
        scroll_data: {
          depth: 20,
          direction: ScrollDirection.DOWN,
          container_selector: '.modal',
          is_primary: false,
          velocity: 300,
          max_depth_reached: 25,
        },
      });

      expect(isSecondaryScrollEvent(event)).toBe(true);
    });

    test('should return false for scroll event with is_primary true', () => {
      const event = createTestEvent({
        type: EventType.SCROLL,
        scroll_data: {
          depth: 60,
          direction: ScrollDirection.DOWN,
          container_selector: 'window',
          is_primary: true,
          velocity: 1500,
          max_depth_reached: 70,
        },
      });

      expect(isSecondaryScrollEvent(event)).toBe(false);
    });

    test('should return false for non-scroll events', () => {
      const event = createTestEvent({
        type: EventType.PAGE_VIEW,
        page_view: {
          pathname: '/home',
          search: '',
          hash: '',
        },
      });

      expect(isSecondaryScrollEvent(event)).toBe(false);
    });

    test('should narrow type correctly', () => {
      const event = createTestEvent({
        type: EventType.SCROLL,
        scroll_data: {
          depth: 15,
          direction: ScrollDirection.UP,
          container_selector: '.chat-panel',
          is_primary: false,
          velocity: 200,
          max_depth_reached: 30,
        },
      });

      if (isSecondaryScrollEvent(event)) {
        // TypeScript should know is_primary === false
        const isPrimary: false = event.scroll_data.is_primary;
        expect(isPrimary).toBe(false);
      }
    });
  });

  describe('Type guard usage in filtering', () => {
    test('should filter primary scroll events correctly', () => {
      const events: EventData[] = [
        createTestEvent({
          type: EventType.SCROLL,
          scroll_data: {
            depth: 50,
            direction: ScrollDirection.DOWN,
            container_selector: 'window',
            is_primary: true,
            velocity: 1000,
            max_depth_reached: 50,
          },
        }),
        createTestEvent({
          type: EventType.SCROLL,
          scroll_data: {
            depth: 30,
            direction: ScrollDirection.DOWN,
            container_selector: '.sidebar',
            is_primary: false,
            velocity: 500,
            max_depth_reached: 40,
          },
        }),
        createTestEvent({
          type: EventType.CLICK,
          click_data: {
            x: 100,
            y: 200,
            relativeX: 50,
            relativeY: 100,
            tag: 'button',
          },
        }),
      ];

      const primaryScrolls = events.filter(isPrimaryScrollEvent);

      expect(primaryScrolls).toHaveLength(1);
      expect(primaryScrolls[0]?.scroll_data.container_selector).toBe('window');
      expect(primaryScrolls[0]?.scroll_data.is_primary).toBe(true);
    });

    test('should filter secondary scroll events correctly', () => {
      const events: EventData[] = [
        createTestEvent({
          type: EventType.SCROLL,
          scroll_data: {
            depth: 50,
            direction: ScrollDirection.DOWN,
            container_selector: 'window',
            is_primary: true,
            velocity: 1000,
            max_depth_reached: 50,
          },
        }),
        createTestEvent({
          type: EventType.SCROLL,
          scroll_data: {
            depth: 30,
            direction: ScrollDirection.DOWN,
            container_selector: '.sidebar',
            is_primary: false,
            velocity: 500,
            max_depth_reached: 40,
          },
        }),
        createTestEvent({
          type: EventType.SCROLL,
          scroll_data: {
            depth: 15,
            direction: ScrollDirection.UP,
            container_selector: '#chat',
            is_primary: false,
            velocity: 300,
            max_depth_reached: 20,
          },
        }),
      ];

      const secondaryScrolls = events.filter(isSecondaryScrollEvent);

      expect(secondaryScrolls).toHaveLength(2);
      expect(secondaryScrolls[0]?.scroll_data.container_selector).toBe('.sidebar');
      expect(secondaryScrolls[1]?.scroll_data.container_selector).toBe('#chat');
    });
  });
});
