import { MetadataType } from './common.types';
import { SessionEndReason } from './session.types';

/**
 * Coordinate information from a click event
 * Includes absolute and relative positioning
 */
export type ClickCoordinates = Pick<ClickData, 'x' | 'y' | 'relativeX' | 'relativeY'>;

/**
 * Web performance metric types tracked by the library
 * - LCP: Largest Contentful Paint
 * - CLS: Cumulative Layout Shift
 * - INP: Interaction to Next Paint
 * - FCP: First Contentful Paint
 * - TTFB: Time to First Byte
 * - LONG_TASK: Tasks exceeding 50ms
 */
export type WebVitalType = 'LCP' | 'CLS' | 'INP' | 'FCP' | 'TTFB' | 'LONG_TASK';

/**
 * Core event types tracked by TraceLog
 */
export enum EventType {
  /** Page navigation and view tracking */
  PAGE_VIEW = 'page_view',
  /** User click interactions */
  CLICK = 'click',
  /** Scroll depth and behavior */
  SCROLL = 'scroll',
  /** Session initialization */
  SESSION_START = 'session_start',
  /** Session termination */
  SESSION_END = 'session_end',
  /** Custom business events */
  CUSTOM = 'custom',
  /** Performance metrics */
  WEB_VITALS = 'web_vitals',
  /** JavaScript errors and rejections */
  ERROR = 'error',
  /** Element visibility tracking */
  VIEWPORT_VISIBLE = 'viewport_visible',
}

/**
 * Scroll direction indicators
 */
export enum ScrollDirection {
  /** Scrolling upward */
  UP = 'up',
  /** Scrolling downward */
  DOWN = 'down',
}

/**
 * JavaScript error classification
 */
export enum ErrorType {
  /** Runtime JavaScript errors */
  JS_ERROR = 'js_error',
  /** Unhandled promise rejections */
  PROMISE_REJECTION = 'promise_rejection',
}

/**
 * Scroll event data captured during user scrolling
 */
export interface ScrollData {
  /** Current scroll depth as percentage (0-100) */
  depth: number;
  /** Direction of scroll movement */
  direction: ScrollDirection;
  /** CSS selector of the scrolled container */
  container_selector: string;
  /** Whether this is the primary viewport scroll */
  is_primary: boolean;
  /** Scroll velocity in pixels per second */
  velocity: number;
  /** Maximum scroll depth reached during session (0-100) */
  max_depth_reached: number;
}

/**
 * Click event data capturing user interaction details
 */
export interface ClickData {
  /** Absolute X coordinate in viewport (pixels) */
  x: number;
  /** Absolute Y coordinate in viewport (pixels) */
  y: number;
  /** Relative X position within element (0-1) */
  relativeX: number;
  /** Relative Y position within element (0-1) */
  relativeY: number;
  /** Element ID attribute */
  id?: string;
  /** Element class attribute */
  class?: string;
  /** HTML tag name */
  tag?: string;
  /** Element text content (truncated) */
  text?: string;
  /** Link href for anchor elements */
  href?: string;
  /** Element title attribute */
  title?: string;
  /** Image alt text for img elements */
  alt?: string;
  /** ARIA role attribute */
  role?: string;
  /** ARIA label attribute */
  ariaLabel?: string;
  /** Custom data attributes (data-*) */
  dataAttributes?: Record<string, string>;
}

/**
 * Element data for specialized click tracking
 * Used for form inputs and interactive elements
 */
export interface ClickTrackingElementData {
  /** DOM element being tracked */
  element: HTMLElement;
  /** Descriptive name for the element */
  name: string;
  /** Element value (for inputs) */
  value?: string;
}

/**
 * Custom event data for business-specific tracking
 */
export interface CustomEventData {
  /** Event name identifier */
  name: string;
  /** Additional event metadata */
  metadata?: Record<string, MetadataType> | Record<string, MetadataType>[];
}

/**
 * Web performance metrics data
 */
export interface WebVitalsData {
  /** Type of performance metric */
  type: WebVitalType;
  /** Metric value (varies by type) */
  value: number;
}

/**
 * JavaScript error details
 */
export interface ErrorData {
  /** Error classification */
  type: ErrorType;
  /** Error message text */
  message: string;
  /** Source file where error occurred */
  filename?: string;
  /** Line number in source file */
  line?: number;
  /** Column number in source file */
  column?: number;
}

/**
 * UTM campaign tracking parameters
 */
export interface UTM {
  /** Campaign source (e.g., google, newsletter) */
  source?: string;
  /** Campaign medium (e.g., cpc, email) */
  medium?: string;
  /** Campaign name identifier */
  campaign?: string;
  /** Campaign search term */
  term?: string;
  /** Campaign content variation */
  content?: string;
}

/**
 * Page view navigation data
 */
export interface PageViewData {
  /** Previous page URL */
  referrer?: string;
  /** Page title from document */
  title?: string;
  /** URL pathname */
  pathname?: string;
  /** URL query string */
  search?: string;
  /** URL hash fragment */
  hash?: string;
}

/**
 * Data captured when element becomes visible
 */
export interface ViewportEventData {
  /** CSS selector that matched the element */
  selector: string;
  /** Optional unique identifier for analytics (if configured) */
  id?: string;
  /** Optional human-readable name (if configured) */
  name?: string;
  /** Actual time (ms) element was visible before event fired */
  dwellTime: number;
  /** Actual visibility ratio when event fired (0-1) */
  visibilityRatio: number;
}

/**
 * Complete event data structure
 * All events share base properties with type-specific data
 */
export interface EventData {
  /** Unique event identifier */
  id: string;
  /** Event type classification */
  type: EventType;
  /** Current page URL where event occurred */
  page_url: string;
  /** Unix timestamp (milliseconds) */
  timestamp: number;
  /** HTTP referrer header */
  referrer?: string;
  /** Previous page URL for navigation events */
  from_page_url?: string;
  /** Scroll event details (when type is SCROLL) */
  scroll_data?: ScrollData;
  /** Click event details (when type is CLICK) */
  click_data?: ClickData;
  /** Custom event details (when type is CUSTOM) */
  custom_event?: CustomEventData;
  /** Performance metrics (when type is WEB_VITALS) */
  web_vitals?: WebVitalsData;
  /** Page view details (when type is PAGE_VIEW) */
  page_view?: PageViewData;
  /** Session termination reason (when type is SESSION_END) */
  session_end_reason?: SessionEndReason;
  /** Error details (when type is ERROR) */
  error_data?: ErrorData;
  /** Viewport visibility details (when type is VIEWPORT_VISIBLE) */
  viewport_data?: ViewportEventData;
  /** Campaign tracking parameters */
  utm?: UTM;
}
