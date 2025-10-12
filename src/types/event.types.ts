import { MetadataType } from './common.types';
import { SessionEndReason } from './session.types';
import { ViewportEventData } from './viewport.types';

export type WebVitalType = 'LCP' | 'CLS' | 'INP' | 'FCP' | 'TTFB' | 'LONG_TASK';

export enum EventType {
  PAGE_VIEW = 'page_view',
  CLICK = 'click',
  SCROLL = 'scroll',
  SESSION_START = 'session_start',
  SESSION_END = 'session_end',
  CUSTOM = 'custom',
  WEB_VITALS = 'web_vitals',
  ERROR = 'error',
  VIEWPORT_VISIBLE = 'viewport_visible',
}

export enum ScrollDirection {
  UP = 'up',
  DOWN = 'down',
}

export enum ErrorType {
  JS_ERROR = 'js_error',
  PROMISE_REJECTION = 'promise_rejection',
}

export interface ScrollData {
  depth: number;
  direction: ScrollDirection;
  container_selector: string;
  is_primary: boolean;
  velocity: number;
  max_depth_reached: number;
}

// Type helpers for primary/secondary scroll events
export type PrimaryScrollEvent = EventData & {
  type: EventType.SCROLL;
  scroll_data: ScrollData & { is_primary: true };
};

export type SecondaryScrollEvent = EventData & {
  type: EventType.SCROLL;
  scroll_data: ScrollData & { is_primary: false };
};

// Type guard functions
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

export interface ClickData {
  x: number;
  y: number;
  relativeX: number;
  relativeY: number;
  id?: string;
  class?: string;
  tag?: string;
  text?: string;
  href?: string;
  title?: string;
  alt?: string;
  role?: string;
  ariaLabel?: string;
  dataAttributes?: Record<string, string>;
}

export type ClickCoordinates = Pick<ClickData, 'x' | 'y' | 'relativeX' | 'relativeY'>;

export interface ClickTrackingElementData {
  element: HTMLElement;
  name: string;
  value?: string;
}

export interface CustomEventData {
  name: string;
  metadata?: Record<string, MetadataType> | Record<string, MetadataType>[];
}

export interface WebVitalsData {
  type: WebVitalType;
  value: number;
}

export interface ErrorData {
  type: ErrorType;
  message: string;
  filename?: string;
  line?: number;
  column?: number;
}

export interface UTM {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

export interface PageViewData {
  referrer?: string;
  title?: string;
  pathname?: string;
  search?: string;
  hash?: string;
}

export interface EventData {
  id: string;
  type: EventType;
  page_url: string;
  timestamp: number;
  referrer?: string;
  from_page_url?: string;
  scroll_data?: ScrollData;
  click_data?: ClickData;
  custom_event?: CustomEventData;
  web_vitals?: WebVitalsData;
  page_view?: PageViewData;
  session_end_reason?: SessionEndReason;
  error_data?: ErrorData;
  viewport_data?: ViewportEventData;
  utm?: UTM;
}
