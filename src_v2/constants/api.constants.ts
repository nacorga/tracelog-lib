import { ApiConfig, Config } from '../types';
import { DEFAULT_SAMPLING_RATE } from './limits.constants';
import { DEFAULT_SESSION_TIMEOUT_MS } from './timing.constants';

export const DEFAULT_API_CONFIG: ApiConfig = {
  samplingRate: DEFAULT_SAMPLING_RATE,
  tags: [],
  excludedUrlPaths: [],
};

export const DEFAULT_CONFIG = (config: Config): Config => ({
  ...DEFAULT_API_CONFIG,
  ...config,
  sessionTimeout: DEFAULT_SESSION_TIMEOUT_MS,
  allowHttp: false,
});
