import { ApiConfig, Config } from '../types';
import {
  DEFAULT_SAMPLING_RATE,
  DEFAULT_SESSION_TIMEOUT,
  MAX_SAMPLING_RATE,
  MIN_SAMPLING_RATE,
} from './config.constants';

export const DEFAULT_API_CONFIG: ApiConfig = {
  samplingRate: DEFAULT_SAMPLING_RATE,
  excludedUrlPaths: [],
  tags: [],
  ipExcluded: false,
};

export const DEFAULT_CONFIG = (config: Config): Config => ({
  ...DEFAULT_API_CONFIG,
  ...config,
  allowHttp: false,
  sessionTimeout: DEFAULT_SESSION_TIMEOUT,
  samplingRate:
    config.samplingRate && config.samplingRate > MIN_SAMPLING_RATE && config.samplingRate <= MAX_SAMPLING_RATE
      ? config.samplingRate
      : DEFAULT_SAMPLING_RATE,
  excludedUrlPaths: config.excludedUrlPaths ?? [],
  tags: config.tags ?? [],
  ipExcluded: config.ipExcluded ?? false,
});
