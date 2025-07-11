import { TracelogTag } from './tag.types';
import { MetadataType } from './event.types';

export interface TracelogApiConfig {
  qaMode: boolean;
  samplingRate: number;
  tags: TracelogTag[];
  excludedUrlPaths: string[];
}

export interface TracelogAppConfig {
  sessionTimeout?: number;
  globalMetadata?: Record<string, MetadataType>;
  scrollContainerSelectors?: string | string[];
}

export interface TracelogConfig extends TracelogApiConfig, TracelogAppConfig {}
