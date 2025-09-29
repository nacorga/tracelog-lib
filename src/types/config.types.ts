import { MetadataType } from './common.types';
import { TagConfig } from './tag.types';
import { Mode } from './mode.types';

export type Config = AppConfig & ExclusiveApiConfig;
export type ApiConfig = SharedConfig & ExclusiveApiConfig;
export type SharedConfig = Pick<AppConfig, 'mode' | 'samplingRate' | 'excludedUrlPaths'>;

export interface ExclusiveApiConfig {
  /** Tag definitions used to categorize tracked events. */
  tags?: TagConfig[];
  /** Determines if IP address is excluded from tracking. */
  ipExcluded?: boolean;
}

export interface AppConfig {
  /** Project identifier used for tracing. */
  id: string;
  /** Session inactivity timeout in milliseconds. @default 900000 */
  sessionTimeout?: number;
  /** Metadata appended to every tracked event. */
  globalMetadata?: Record<string, MetadataType>;
  /** Selectors defining custom scroll containers to monitor. */
  scrollContainerSelectors?: string | string[];
  /** Enables HTTP requests for testing and development flows. */
  allowHttp?: boolean;
  /** Query parameters to remove before tracking URLs. */
  sensitiveQueryParams?: string[];
  /** Error event sampling rate between 0 and 1. */
  errorSampling?: number;
  /** Logging mode controlling verbosity of client logs. */
  mode?: Mode;
  /** Event sampling rate between 0 and 1. */
  samplingRate?: number;
  /** URL path patterns that should be ignored by tracking. */
  excludedUrlPaths?: string[];
  /** Optional configuration for third-party integrations. */
  integrations?: {
    /** Google Analytics integration options. */
    googleAnalytics?: {
      /** Required measurement ID for Google Analytics. */
      measurementId: string;
    };
  };
}
