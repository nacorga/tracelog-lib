import { MetadataType } from './common.types';
import { ViewportConfig } from './viewport.types';

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
    /** Google Analytics integration options. */
    googleAnalytics?: {
      /** Required measurement ID for Google Analytics. */
      measurementId: string;
    };
  };
}

export enum SpecialApiUrl {
  Localhost = 'localhost:8080',
  Fail = 'localhost:9999',
}
