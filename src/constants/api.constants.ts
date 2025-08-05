import { ApiConfig, Config } from '../types';
import { DEFAULT_SAMPLING_RATE } from './limits.constants';
import { DEFAULT_SESSION_TIMEOUT_MS } from './timing.constants';

export const DEFAULT_API_CONFIG: ApiConfig = {
  qaMode: false,
  samplingRate: DEFAULT_SAMPLING_RATE,
  tags: [],
  excludedUrlPaths: [],
};

export const DEFAULT_CONFIG: Config = {
  ...DEFAULT_API_CONFIG,
  id: 'default',
  sessionTimeout: DEFAULT_SESSION_TIMEOUT_MS,
  allowHttp: false,
};

export const DEFAULT_DEMO_CONFIG: Config = {
  ...DEFAULT_CONFIG,
  id: 'demo',
  qaMode: true,
};

export const DEFAULT_TEST_CONFIG: Config = {
  ...DEFAULT_CONFIG,
  id: 'test',
  qaMode: true,
};
