import { TagConfig } from './tag.types';
import { MetadataType } from './event.types';

export interface ApiConfig {
  qaMode: boolean;
  samplingRate: number;
  tags: TagConfig[];
  excludedUrlPaths: string[];
}

export interface AppConfig {
  sessionTimeout?: number;
  globalMetadata?: Record<string, MetadataType>;
  scrollContainerSelectors?: string | string[];
  /**
   * Custom URL to send tracking events. When set, TraceLog will bypass the
   * default domain generation and use this URL directly.
   */
  customApiUrl?: string;
  /**
   * When sending events to your own server, specify where to fetch
   * API-level configuration. This allows dynamic updates from your backend.
   * If omitted, no remote config will be fetched when using `customApiUrl`.
   */
  customApiConfigUrl?: string;
  /**
   * Provide API-level configuration when using a custom server. If set,
   * these values override the defaults and no remote config will be fetched.
   */
  apiConfig?: Partial<ApiConfig>;
}

export type Config = ApiConfig & Omit<AppConfig, 'apiConfig'>;
