import { MetadataType } from './common.types';
import { SessionEndReason } from './session.types';

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
}

export enum ScrollDirection {
  UP = 'up',
  DOWN = 'down',
}

export enum ErrorType {
  JS_ERROR = 'js_error',
  PROMISE_REJECTION = 'promise_rejection',
  NETWORK_ERROR = 'network_error',
}

export interface ScrollData {
  depth: number;
  direction: ScrollDirection;
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
  metadata?: Record<string, MetadataType>;
}

export interface WebVitalsData {
  type: WebVitalType;
  value: number;
}

export interface ErrorData {
  type: ErrorType;
  message: string;
  method?: string;
  url?: string;
  status?: number;
  statusText?: string;
  duration?: number;
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

export interface VitalSample {
  type: WebVitalType;
  value: number;
}

export interface EventData {
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
  session_start_recovered?: boolean;
  session_end_reason?: SessionEndReason;
  error_data?: ErrorData;
  utm?: UTM;
  tags?: string[] | { id: string; key: string }[];
}
