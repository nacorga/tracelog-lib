import { ApiConfig } from '../types';
import { DEFAULT_SAMPLING_RATE } from './config.constants';

/**
 * Default API configuration values
 * Used as fallback when API config is not available or incomplete
 */
export const DEFAULT_API_CONFIG: ApiConfig = {
  samplingRate: DEFAULT_SAMPLING_RATE,
  excludedUrlPaths: [],
  tags: [],
  ipExcluded: false,
};
