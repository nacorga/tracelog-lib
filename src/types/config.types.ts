import { MetadataType } from './common.types';
import { ViewportConfig } from './viewport.types';
import { WebVitalType } from './event.types';

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
  /** Interval in milliseconds between event batch sends. @default 10000 (10 seconds) */
  sendIntervalMs?: number;
  /**
   * If true, the event queue is flushed automatically after every SPA navigation
   * (`pushState`, `replaceState`, `popstate`, `hashchange`). Prevents batch loss when the
   * user closes the tab mid-buffer between SPA route changes. No-op for MPAs (no SPA nav).
   * @default true
   */
  flushOnSpaNavigation?: boolean;
  /**
   * If true, the event queue is flushed when `document.hidden` becomes `true`
   * (tab switch, lock screen, app backgrounding). Especially relevant on mobile Safari
   * where `pagehide`/`beforeunload` may not fire reliably.
   * @default true
   */
  flushOnPageHidden?: boolean;
  /** Optional configuration for third-party integrations. */
  integrations?: {
    /** TraceLog integration options. */
    tracelog?: {
      /** Required project ID TraceLog SaaS integration. */
      projectId: string;
      /** Enable Shopify cart attribute linking for webhook revenue attribution. */
      shopify?: boolean;
    };
    /** Custom integration options. */
    custom?: {
      /** Endpoint for collecting events. */
      collectApiUrl: string;
      /** Allow HTTP URLs (not recommended for production). @default false */
      allowHttp?: boolean;
      /**
       * Static HTTP headers to include in every request.
       * For dynamic headers, use `setCustomHeaders()` instead.
       * @example { 'X-Brand': 'my-brand', 'X-Tenant-Id': 'tenant-123' }
       */
      headers?: Record<string, string>;
      /**
       * Controls whether cookies and credentials are sent with fetch requests.
       * - `'include'`: Always send cookies (even cross-origin) — required for cookie-based auth
       * - `'same-origin'`: Only send cookies for same-origin requests
       * - `'omit'`: Never send cookies
       * @default 'include'
       */
      fetchCredentials?: RequestCredentials;
    };
  };
}

export enum SpecialApiUrl {
  Localhost = 'localhost:8080',
  Fail = 'localhost:9999',
}
