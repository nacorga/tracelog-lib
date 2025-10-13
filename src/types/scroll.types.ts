import { EventData, EventType, ScrollData } from './event.types';

export type PrimaryScrollEvent = EventData & {
  type: EventType.SCROLL;
  scroll_data: ScrollData & { is_primary: true };
};

export type SecondaryScrollEvent = EventData & {
  type: EventType.SCROLL;
  scroll_data: ScrollData & { is_primary: false };
};

export function isPrimaryScrollEvent(event: EventData): event is PrimaryScrollEvent {
  return (
    event.type === EventType.SCROLL && 'scroll_data' in event && (event.scroll_data as ScrollData).is_primary === true
  );
}

export function isSecondaryScrollEvent(event: EventData): event is SecondaryScrollEvent {
  return (
    event.type === EventType.SCROLL && 'scroll_data' in event && (event.scroll_data as ScrollData).is_primary === false
  );
}
