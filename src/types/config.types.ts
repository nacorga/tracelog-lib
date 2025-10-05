import { MetadataType } from './common.types';
import { Mode } from './mode.types';

export interface Config {
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
    /** TraceLog integration options. */
    tracelog?: {
      /** Required project ID for Google Analytics. */
      projectId: string;
    };
    /** Custom integration options. */
    custom?: {
      /** Required API URL for custom integration. */
      apiUrl: string;
    };
    /** Google Analytics integration options. */
    googleAnalytics?: {
      /** Required measurement ID for Google Analytics. */
      measurementId: string;
    };
  };
}

export enum SpecialApiUrl {
  /**
   * Value: 'skip'
   *
   * Skips ALL HTTP calls - no config fetch, no event sending
   * Uses default local config, forces debug mode
   * Perfect for pure offline E2E testing
   *
   * @example
   * await TraceLog.init({ id: SpecialApiUrl.Skip });
   * // or
   * await TraceLog.init({ id: 'skip' });
   */
  Skip = 'skip',
  /**
   * Value: 'localhost:8080'
   *
   * Makes HTTP calls to local development server on port 8080
   * Converts to http://localhost:8080/config for requests
   * Requires origin to be in ALLOWED_ORIGINS list, forces debug mode
   * Perfect for local development with running middleware
   *
   * @example
   * await TraceLog.init({ id: SpecialApiUrl.Localhost });
   * // or
   * await TraceLog.init({ id: 'localhost:8080' });
   * // Makes requests to: http://localhost:8080/config
   */
  Localhost = 'localhost:8080',
  /**
   * Value: 'localhost:9999'
   *
   * Makes HTTP calls to non-existent server (port 9999)
   * All HTTP requests will fail naturally, triggering persistence
   * Forces debug mode, perfect for testing event persistence & recovery
   *
   * @example
   * await TraceLog.init({ id: SpecialApiUrl.Fail });
   * // or
   * await TraceLog.init({ id: 'localhost:9999' });
   * // Makes requests to: http://localhost:9999 (will fail)
   */
  Fail = 'localhost:9999',
}
