import { MetadataType } from './common.types';

/**
 * Coordinate information from a click event
 */
export type ClickCoordinates = Pick<ClickData, 'x' | 'y'>;

/**
 * Web performance metric types tracked by the library
 * - LCP: Largest Contentful Paint
 * - CLS: Cumulative Layout Shift
 * - INP: Interaction to Next Paint
 * - FCP: First Contentful Paint
 * - TTFB: Time to First Byte
 */
export type WebVitalType = 'LCP' | 'CLS' | 'INP' | 'FCP' | 'TTFB';

/**
 * Event type name
 */
export type EventTypeName = (typeof EventType)[keyof typeof EventType];

/**
 * Event type enum
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
  /** Custom business events */
  CUSTOM = 'custom',
  /** Performance metrics */
  WEB_VITALS = 'web_vitals',
  /** JavaScript errors and rejections */
  ERROR = 'error',
}

/**
 * Per-session event counts structure for rate limiting.
 *
 * Persisted to localStorage: `tlog:{userId}:session_counts:{sessionId}`
 * Restored on page reload to maintain limits across navigations.
 */
export interface SessionEventCounts {
  /** Total events across all types */
  total: number;
  /** Click events count */
  [EventType.CLICK]: number;
  /** Page view events count */
  [EventType.PAGE_VIEW]: number;
  /** Custom events count */
  [EventType.CUSTOM]: number;
  /** Scroll events count */
  [EventType.SCROLL]: number;
  /** Index signature for dynamic event type access */
  [key: string]: number;
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
}

/**
 * Click event data capturing user interaction details
 */
export interface ClickData {
  /** Absolute X coordinate in viewport (pixels) */
  x: number;
  /** Absolute Y coordinate in viewport (pixels) */
  y: number;
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
 * Optional flags for `tracelog.event()`.
 */
export interface EventOptions {
  /**
   * If `true`, the event queue is flushed via `navigator.sendBeacon()`
   * immediately after this event is tracked. The browser guarantees the
   * request is queued for delivery even if the page is about to unload.
   *
   * Use for high-value events where loss is unacceptable (Purchase, Signup,
   * AddPaymentInfo).
   *
   * @default false
   */
  critical?: boolean;
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
  /** Error constructor name (TypeError, ReferenceError, etc.) when available */
  name?: string;
  /** Source file where error occurred */
  filename?: string;
  /** Line number in source file */
  line?: number;
  /** Column number in source file */
  column?: number;
  /** Error stack trace (truncated to 2000 chars) */
  stack?: string;
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
 * Ad-network click identifiers auto-appended to landing URLs by ad platforms.
 * Used by the backend to classify a session's traffic source as Paid when no
 * manual UTM source/medium is present. Captured but never logged.
 */
export interface ClickIds {
  /** Google Ads click id */
  gclid?: string;
  /** Google Ads iOS-privacy click id (app campaigns) */
  gbraid?: string;
  /** Google Ads iOS-privacy click id (web-to-app) */
  wbraid?: string;
  /** Meta (Facebook/Instagram) Ads click id */
  fbclid?: string;
  /** TikTok Ads click id */
  ttclid?: string;
}

/**
 * Page view navigation data
 */
export interface PageViewData {
  /** Previous page URL */
  referrer?: string;
  /** Page title from document */
  title?: string;
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
  /** Error details (when type is ERROR) */
  error_data?: ErrorData;
  /** Campaign tracking parameters */
  utm?: UTM;
  /** Ad-network click identifiers (gclid, fbclid, ttclid, ...) captured at session start */
  click_ids?: ClickIds;
}

/**
 * Internal queue entry: an `EventData` enriched with the session ID frozen at
 * `track()` time. Survives session renewal — when the user is idle past the
 * timeout, `state.sessionId` is nulled but events already in the queue keep
 * their original `_session_id`, so `EventManager.buildBatchesWithIds()` can
 * still attribute them correctly instead of emitting `session_id: null` to the
 * wire.
 */
export interface QueuedEvent extends EventData {
  _session_id: string;
}
