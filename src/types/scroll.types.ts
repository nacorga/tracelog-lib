import { EventData, EventType, ScrollData } from './event.types';

/**
 * Primary scroll event type (main viewport scroll)
 *
 * **Purpose**: Type-safe representation of primary viewport scroll events
 *
 * Primary scroll events track the main page/viewport scrolling,
 * which is the most important scroll metric for engagement analysis.
 */
export type PrimaryScrollEvent = EventData & {
  type: EventType.SCROLL;
  scroll_data: ScrollData & { is_primary: true };
};

/**
 * Secondary scroll event type (scrollable container scroll)
 *
 * **Purpose**: Type-safe representation of container-specific scroll events
 *
 * Secondary scroll events track scrolling within specific elements
 * (e.g., modals, sidebars, embedded content) for granular engagement analysis.
 */
export type SecondaryScrollEvent = EventData & {
  type: EventType.SCROLL;
  scroll_data: ScrollData & { is_primary: false };
};

/**
 * Type guard to check if an event is a primary scroll event
 *
 * **Purpose**: Runtime type narrowing for primary viewport scrolls
 *
 * **Use Cases**:
 * - Filter events to process only main viewport scrolling
 * - Separate primary from secondary scroll analytics
 * - Type-safe event processing in transformers
 *
 * @param event - Event to check
 * @returns `true` if event is a primary scroll event
 *
 * @example
 * ```typescript
 * if (isPrimaryScrollEvent(event)) {
 *   // event.scroll_data.is_primary is guaranteed to be true
 *   console.log('Main viewport scrolled to', event.scroll_data.depth, '%');
 * }
 * ```
 */
export const isPrimaryScrollEvent = (event: EventData): event is PrimaryScrollEvent => {
  return (
    event.type === EventType.SCROLL && 'scroll_data' in event && (event.scroll_data as ScrollData).is_primary === true
  );
};

/**
 * Type guard to check if an event is a secondary scroll event
 *
 * **Purpose**: Runtime type narrowing for container-specific scrolls
 *
 * **Use Cases**:
 * - Filter events to process only container scrolling
 * - Analyze engagement with specific page sections
 * - Type-safe event processing in transformers
 *
 * @param event - Event to check
 * @returns `true` if event is a secondary scroll event
 *
 * @example
 * ```typescript
 * if (isSecondaryScrollEvent(event)) {
 *   // event.scroll_data.is_primary is guaranteed to be false
 *   console.log('Container scrolled:', event.scroll_data.container_selector);
 * }
 * ```
 */
export const isSecondaryScrollEvent = (event: EventData): event is SecondaryScrollEvent => {
  return (
    event.type === EventType.SCROLL && 'scroll_data' in event && (event.scroll_data as ScrollData).is_primary === false
  );
};
