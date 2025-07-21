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
}

export interface Config extends ApiConfig, AppConfig {}
