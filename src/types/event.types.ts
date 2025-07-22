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

export interface CustomEventData {
  name: string;
  metadata?: Record<string, MetadataType>;
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

export interface EventHandler {
  evType: EventType;
  url?: string;
  fromUrl?: string;
  referrer?: string;
  utm?: UTM;
  scrollData?: ScrollData;
  clickData?: ClickData;
  customEvent?: CustomEventData;
  pageView?: PageViewData;
  trigger?: string;
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
  page_view?: PageViewData;
  utm?: UTM;
  tags?: string[] | { id: string; name: string }[];
  excluded_route?: boolean;
}
