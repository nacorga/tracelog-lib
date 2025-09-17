import { Config } from '../../src/types';
import { DEFAULT_CONFIG } from './common.constants';

export const PERFORMANCE_REQUIREMENTS = {
  TOTAL_INITIALIZATION_TIME: 500, // <500ms
  CONFIG_LOADING_TIME: 200, // <200ms
  STORAGE_OPERATIONS_TIME: 150, // <150ms (increased to account for concurrency handling)
  HANDLER_REGISTRATION_TIME: 100, // <100ms
  USER_ID_GENERATION_TIME: 50, // <50ms
  SESSION_SETUP_TIME: 50, // <50ms
  ERROR_HANDLING_TIME: 100, // <100ms for validation errors
  SUBSEQUENT_INIT_TIME: 150, // <150ms for subsequent initialization attempts (increased for concurrency handling)
} as const;

/**
 * Common test configurations
 */
export const TEST_CONFIGS: Record<string, Config> = {
  DEFAULT: DEFAULT_CONFIG,
  ALTERNATE_1: { id: 'test', sessionTimeout: 30000 },
  ALTERNATE_2: {
    id: 'test',
    sessionTimeout: 45000,
    globalMetadata: { source: 'e2e-test' },
    errorSampling: 0.5,
  },
  ALTERNATE_3: {
    id: 'test',
    sessionTimeout: 30000,
    globalMetadata: { source: 'qa-test', environment: 'test' },
    errorSampling: 1.0,
    scrollContainerSelectors: ['body', '.content'],
  },
  QA_MODE: { id: 'test' }, // Add QA_MODE config referenced in the code
} as const;
