export enum EventType {
  PAGE_VIEW = 'page_view',
  CLICK = 'click',
  SCROLL = 'scroll',
  SESSION_START = 'session_start',
  SESSION_END = 'session_end',
  CUSTOM = 'custom',
}

export enum ScrollDirection {
  UP = 'up',
  DOWN = 'down',
}

export type MetadataType = string | number | boolean | string[];

export interface TracelogEventScrollData {
  depth: number;
  direction: ScrollDirection;
}

export interface TracelogEventClickData {
  x: number;
  y: number;
  relativeX: number;
  relativeY: number;
  elementId?: string;
  elementClass?: string;
  elementTag?: string;
  elementText?: string;
  elementHref?: string;
  elementTitle?: string;
  elementAlt?: string;
  elementRole?: string;
  elementAriaLabel?: string;
  elementDataAttributes?: Record<string, string>;
}

export interface TracelogEventCustomData {
  name: string;
  metadata?: Record<string, MetadataType>;
}

export interface TracelogEventUtm {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

export interface TracelogEventPageView {
  referrer?: string;
  title?: string;
  pathname?: string;
  search?: string;
  hash?: string;
}

export interface TracelogEventHandler {
  evType: EventType;
  url?: string;
  fromUrl?: string;
  referrer?: string;
  utm?: TracelogEventUtm;
  scrollData?: TracelogEventScrollData;
  clickData?: TracelogEventClickData;
  customEvent?: TracelogEventCustomData;
  pageView?: TracelogEventPageView;
  trigger?: string;
}

export interface TracelogEvent {
  type: EventType;
  page_url: string;
  timestamp: number;
  referrer?: string;
  from_page_url?: string;
  scroll_data?: TracelogEventScrollData;
  click_data?: TracelogEventClickData;
  custom_event?: TracelogEventCustomData;
  page_view?: TracelogEventPageView;
  utm?: TracelogEventUtm;
  tags?: string[];
  excluded_route?: boolean;
}
