import { MetadataType } from './common.types';
import { ViewportConfig } from './viewport.types';
import { EventTypeName, WebVitalType } from './event.types';
import { DisabledEventType } from '../constants';
import { GoogleConsentCategories } from './google.types';

/**
 * Web Vitals filtering mode
 * - 'all': Track all Web Vitals metrics (full analytics)
 * - 'needs-improvement': Track metrics that need improvement or are poor (default, balanced)
 * - 'poor': Track only poor metrics (minimal data)
 */
export type WebVitalsMode = 'all' | 'needs-improvement' | 'poor';

/**
 * Google Analytics / Google Tag Manager integration configuration.
 */
export interface GoogleIntegrationConfig {
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
  /**
   * Google Consent Mode v2 categories to synchronize.
   * Enables synchronization between TraceLog consent and Google Consent Mode.
   *
   * @default 'all' - Grant all 5 categories when consent is given
   * @see https://developers.google.com/tag-platform/security/guides/consent
   */
  consentCategories?: GoogleConsentCategories;
  /**
   * Wait for explicit consent before initializing Google Analytics/GTM and sending events.
   * When enabled, events are buffered until consent is granted via setConsent('google', true).
   * Falls back to root-level waitForConsent if not specified.
   * @default undefined (inherits from root config)
   */
  waitForConsent?: boolean;
}

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
   * Maximum number of events to buffer while waiting for consent.
   * Older events are discarded (FIFO) when limit is reached.
   * @default 500
   */
  maxConsentBufferSize?: number;
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
      /**
       * Wait for explicit consent before initializing TraceLog SaaS and sending events.
       * When enabled, events are buffered until consent is granted via setConsent('tracelog', true).
       * Falls back to root-level waitForConsent if not specified.
       * @default undefined (inherits from root config)
       */
      waitForConsent?: boolean;
    };
    /** Custom integration options. */
    custom?: {
      /** Endpoint for collecting events. */
      collectApiUrl: string;
      /** Allow HTTP URLs (not recommended for production). @default false */
      allowHttp?: boolean;
      /**
       * Wait for explicit consent before sending events to custom backend.
       * When enabled, events are buffered until consent is granted via setConsent('custom', true).
       * Falls back to root-level waitForConsent if not specified.
       * @default undefined (inherits from root config)
       */
      waitForConsent?: boolean;
    };
    /**
     * GA4 / GTM integration.
     * At least one of measurementId or containerId must be provided.
     */
    google?: GoogleIntegrationConfig;
  };
}

export enum SpecialApiUrl {
  Localhost = 'localhost:8080',
  Fail = 'localhost:9999',
}
