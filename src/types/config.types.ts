import { MetadataType } from './common.types';
import { ViewportConfig } from './viewport.types';
import { EventTypeName, WebVitalType } from './event.types';
import { DisabledEventType } from '../constants';

/**
 * Web Vitals filtering mode
 * - 'all': Track all Web Vitals metrics (full analytics)
 * - 'needs-improvement': Track metrics that need improvement or are poor (default, balanced)
 * - 'poor': Track only poor metrics (minimal data)
 */
export type WebVitalsMode = 'all' | 'needs-improvement' | 'poor';

export interface Config {
  /** Session inactivity timeout in milliseconds. @default 900000 */
  sessionTimeout?: number;
  /** Metadata appended to every tracked event. */
  globalMetadata?: Record<string, MetadataType>;
  /** Query parameters to remove before tracking URLs. */
  sensitiveQueryParams?: string[];
  /** Error event sampling rate between 0 and 1. @default 1 */
  errorSampling?: number;
  /** Event sampling rate between 0 and 1. @default 1 */
  samplingRate?: number;
  /** CSS selector to manually override primary scroll container detection. */
  primaryScrollSelector?: string;
  /** Viewport visibility tracking configuration. */
  viewport?: ViewportConfig;
  /** Page view throttle duration in milliseconds to prevent rapid navigation spam. @default 1000 */
  pageViewThrottleMs?: number;
  /** Click throttle duration in milliseconds to prevent double-clicks and rapid spam. @default 300 */
  clickThrottleMs?: number;
  /** Maximum number of same custom event name allowed per minute to prevent infinite loops. @default 60 */
  maxSameEventPerMinute?: number;
  /**
   * Web Vitals filtering mode. @default 'needs-improvement'
   * - 'all': Track all metrics (good, needs-improvement, poor) - full trend analysis
   * - 'needs-improvement': Track metrics that need improvement or are poor - balanced approach
   * - 'poor': Track only poor metrics - minimal data, focus on problems
   */
  webVitalsMode?: WebVitalsMode;
  /**
   * Custom Web Vitals thresholds in milliseconds (except CLS which is unitless).
   * Only applies when webVitalsMode is set. Overrides default thresholds for the selected mode.
   */
  webVitalsThresholds?: Partial<Record<WebVitalType, number>>;
  /**
   * Event types to disable from auto-tracking.
   * Core events (PAGE_VIEW, CLICK, SESSION_*) cannot be disabled as they are essential for analytics.
   * @default []
   * @example
   * // Disable scroll tracking only
   * disabledEvents: ['scroll']
   * @example
   * // Disable performance and error tracking
   * disabledEvents: ['web_vitals', 'error']
   */
  disabledEvents?: DisabledEventType[];
  /** Optional configuration for third-party integrations. */
  integrations?: {
    /** TraceLog integration options. */
    tracelog?: {
      /** Required project ID TraceLog SaaS integration. */
      projectId: string;
    };
    /** Custom integration options. */
    custom?: {
      /** Endpoint for collecting events. */
      collectApiUrl: string;
      /** Allow HTTP URLs (not recommended for production). @default false */
      allowHttp?: boolean;
    };
    /** GA4 / GTM integration. */
    google?: {
      /** GA4 measurement ID. @example 'G-XXXXXXXXXX' */
      measurementId?: string;
      /** GTM container ID. @example 'GTM-XXXXXXX' */
      containerId?: string;
      /**
       * Event types to forward to GA4/GTM.
       * @example ['page_view', 'custom', 'web_vitals']
       * Supported values: 'page_view', 'click', 'scroll', 'session_start', 'session_end', 'custom', 'web_vitals', 'error', 'viewport_visible', or 'all'
       */
      forwardEvents?: EventTypeName[] | 'all';
    };
  };
}

export enum SpecialApiUrl {
  Localhost = 'localhost:8080',
  Fail = 'localhost:9999',
}
