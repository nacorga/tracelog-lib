import { MetadataType } from './common.types';
import { TagConfig } from './tag.types';
import { Mode } from './mode.types';

export type Config = ApiConfig & AppConfig;

export interface ApiConfig {
  /**
   * Sampling rate as a percentage (0-1) to control how many events are sent.
   * A value of 1 means all events are sent, while 0.5 means only half of events are sent.
   */
  samplingRate?: number;
  /**
   * Array of tag configurations for categorizing and filtering events.
   * Tags help organize and segment tracking data for analysis.
   */
  tags?: TagConfig[];
  /**
   * Array of URL path patterns to exclude from tracking.
   * Events will not be sent for pages matching these patterns.
   */
  excludedUrlPaths?: string[];
  /**
   * Flag to indicate if IP addresses should be excluded from tracking.
   * When true, IP addresses will not be collected or sent with events.
   * This is useful for privacy compliance and reducing data exposure.
   */
  ipExcluded?: boolean;
}

export interface AppConfig {
  /**
   * Unique project identifier.
   */
  id: string;
  /**
   * Session timeout in milliseconds. After this period of inactivity,
   * a new session will be started for subsequent events.
   *
   * **Timeout Guidelines:**
   * - **15 minutes (default)**: Recommended for most applications, aligns with security best practices
   * - **30 minutes**: Standard for content-heavy sites (matches Google Analytics default)
   * - **45-60 minutes**: Consider for sites with long-form content, videos, or documentation
   * - **5-10 minutes**: Use for security-sensitive applications requiring frequent re-authentication
   *
   * **Impact on Analytics:**
   * - Shorter timeouts = Higher session count, higher bounce rate, potentially lower conversion rates
   * - Longer timeouts = Lower session count, more accurate user journey tracking, better conversion attribution
   *
   * **When to Adjust:**
   * - Match your application's auto-logout timeout if applicable
   * - Increase for content where users frequently pause (tutorials, long articles, videos)
   * - Decrease for applications with sensitive data or frequent security requirements
   * - Monitor bounce rates and conversion funnels when changing this value
   *
   * @default 900000 (15 minutes)
   * @min 30000 (30 seconds)
   * @max 86400000 (24 hours)
   */
  sessionTimeout?: number;
  /**
   * Metadata that will be automatically attached to all tracking events.
   * These key-value pairs provide additional context for every event sent.
   */
  globalMetadata?: Record<string, MetadataType>;
  /**
   * CSS selectors for custom scroll containers. Can be a single selector string
   * or an array of selectors. Used to track scroll events within specific elements
   * instead of the default window scroll.
   */
  scrollContainerSelectors?: string | string[];
  /**
   * Allow HTTP requests to be made. This is useful for testing and development.
   */
  allowHttp?: boolean;
  /**
   * Array of query parameters to be removed from the URL.
   */
  sensitiveQueryParams?: string[];
  /**
   * Sampling rate for error events (0-1).
   * Controls how many error and network error events are captured.
   * @default 0.1 for production, 1.0 for qa/debug mode
   */
  errorSampling?: number;
  /**
   * Optional integrations configuration.
   */
  integrations?: {
    /**
     * Google Analytics integration configuration.
     */
    googleAnalytics?: {
      /**
       * Google Analytics measurement ID.
       * Required for initializing the Google Analytics integration.
       */
      measurementId: string;
    };
  };
  /**
   * Logging mode for the SDK.
   * - 'production': No debug output (default)
   * - 'qa': Shows client-facing logs only (INFO, CLIENT_WARN, CLIENT_ERROR)
   * - 'debug': Shows all logs including internal SDK errors
   *
   * @default 'production'
   */
  mode?: Mode;
}
