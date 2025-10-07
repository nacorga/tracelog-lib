import { MetadataType } from './common.types';

export interface Config {
  /** Session inactivity timeout in milliseconds. @default 900000 */
  sessionTimeout?: number;
  /** Metadata appended to every tracked event. */
  globalMetadata?: Record<string, MetadataType>;
  /** Selectors defining custom scroll containers to monitor. */
  scrollContainerSelectors?: string | string[];
  /** Query parameters to remove before tracking URLs. */
  sensitiveQueryParams?: string[];
  /** Error event sampling rate between 0 and 1. */
  errorSampling?: number;
  /** Event sampling rate between 0 and 1. */
  samplingRate?: number;
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
