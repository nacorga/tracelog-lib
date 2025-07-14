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

export interface EventScrollData {
  depth: number;
  direction: ScrollDirection;
}

export interface EventClickData {
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

export interface ClickCoordinates {
  x: number;
  y: number;
  relativeX: number;
  relativeY: number;
}

export interface ClickTrackingElementData {
  element: HTMLElement;
  name: string;
  value?: string;
}

export interface EventCustomData {
  name: string;
  metadata?: Record<string, MetadataType>;
}

export interface EventUtm {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

export interface EventPageView {
  referrer?: string;
  title?: string;
  pathname?: string;
  search?: string;
  hash?: string;
}

export interface EventHandler {
  evType: EventType;
  url?: string;
  fromUrl?: string;
  referrer?: string;
  utm?: EventUtm;
  scrollData?: EventScrollData;
  clickData?: EventClickData;
  customEvent?: EventCustomData;
  pageView?: EventPageView;
  trigger?: string;
}

export interface EventData {
  type: EventType;
  page_url: string;
  timestamp: number;
  referrer?: string;
  from_page_url?: string;
  scroll_data?: EventScrollData;
  click_data?: EventClickData;
  custom_event?: EventCustomData;
  page_view?: EventPageView;
  utm?: EventUtm;
  tags?: string[];
  excluded_route?: boolean;
}
