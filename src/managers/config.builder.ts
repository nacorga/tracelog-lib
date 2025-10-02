import {
  DEFAULT_SESSION_TIMEOUT,
  DEFAULT_SAMPLING_RATE,
  MIN_SAMPLING_RATE,
  MAX_SAMPLING_RATE,
  MIN_SESSION_TIMEOUT_MS,
  MAX_SESSION_TIMEOUT_MS,
} from '../constants/config.constants';
import { AppConfig, ApiConfig, Config, Mode, SpecialProjectId } from '../types';
import { debugLog } from '../utils/logging';

/**
 * Centralized configuration builder
 * Single source of truth for merging and building final configuration
 */
export class ConfigBuilder {
  /**
   * Builds final configuration from app config and API config
   * Applies clear precedence: API overrides client, with defaults as fallback
   */
  static build(appConfig: AppConfig, apiConfig: ApiConfig = {}): Config {
    // Resolve mode first as it affects other settings (like errorSampling)
    const finalMode = this.resolveMode(appConfig, apiConfig.mode);

    const config: Config = {
      // Core identifiers
      id: appConfig.id,

      // Session configuration
      sessionTimeout: this.resolveSessionTimeout(appConfig.sessionTimeout),

      // Mode configuration (resolved first)
      mode: finalMode,

      // Sampling configuration (depends on mode)
      samplingRate: this.resolveSamplingRate(apiConfig.samplingRate, appConfig.samplingRate),
      errorSampling: this.resolveErrorSampling(appConfig.errorSampling, finalMode),

      // Filtering configuration
      excludedUrlPaths: apiConfig.excludedUrlPaths ?? appConfig.excludedUrlPaths ?? [],
      tags: apiConfig.tags ?? [],
      ipExcluded: apiConfig.ipExcluded ?? false,

      // Client-only configuration
      globalMetadata: appConfig.globalMetadata ?? {},
      scrollContainerSelectors: appConfig.scrollContainerSelectors,
      sensitiveQueryParams: appConfig.sensitiveQueryParams ?? [],
      integrations: appConfig.integrations,

      // Security configuration
      allowHttp: appConfig.allowHttp ?? false,
    };

    debugLog.debug('ConfigBuilder', 'Configuration built', {
      projectId: config.id,
      mode: config.mode,
      samplingRate: config.samplingRate,
      errorSampling: config.errorSampling,
      hasTags: !!config.tags?.length,
      hasExclusions: !!config.excludedUrlPaths?.length,
    });

    return config;
  }

  /**
   * Resolves session timeout with validation
   * Returns default if undefined or out of valid range
   */
  private static resolveSessionTimeout(timeout: number | undefined): number {
    if (timeout === undefined) {
      return DEFAULT_SESSION_TIMEOUT;
    }

    if (timeout < MIN_SESSION_TIMEOUT_MS || timeout > MAX_SESSION_TIMEOUT_MS) {
      debugLog.warn('ConfigBuilder', 'Invalid session timeout, using default', {
        provided: timeout,
        min: MIN_SESSION_TIMEOUT_MS,
        max: MAX_SESSION_TIMEOUT_MS,
        default: DEFAULT_SESSION_TIMEOUT,
      });
      return DEFAULT_SESSION_TIMEOUT;
    }

    return timeout;
  }

  /**
   * Resolves sampling rate with validation
   * Priority: API config > app config > default
   */
  private static resolveSamplingRate(apiRate: number | undefined, appRate: number | undefined): number {
    const rate = apiRate ?? appRate;

    if (rate === undefined) {
      return DEFAULT_SAMPLING_RATE;
    }

    if (rate < MIN_SAMPLING_RATE || rate > MAX_SAMPLING_RATE) {
      debugLog.warn('ConfigBuilder', 'Invalid sampling rate, using default', {
        provided: rate,
        default: DEFAULT_SAMPLING_RATE,
      });
      return DEFAULT_SAMPLING_RATE;
    }

    return rate;
  }

  /**
   * Resolves error sampling rate based on mode
   * In debug/qa modes: uses provided value or defaults to full sampling (1.0)
   * In production: uses provided value or defaults to 10% sampling (0.1)
   */
  private static resolveErrorSampling(appErrorSampling: number | undefined, apiMode: Mode | undefined): number {
    const isDebugMode = apiMode === Mode.DEBUG || apiMode === Mode.QA;

    if (isDebugMode) {
      // In debug mode, respect explicit value or default to full sampling
      return appErrorSampling ?? 1;
    }

    return appErrorSampling ?? 0.1; // Default to 10% sampling in production
  }

  /**
   * Resolves mode with special project ID handling
   * Priority: Special project ID > API mode > app mode
   */
  private static resolveMode(appConfig: AppConfig, apiMode: Mode | undefined): Mode | undefined {
    // Force DEBUG mode for special project IDs
    if (
      appConfig.id === SpecialProjectId.Skip ||
      appConfig.id === SpecialProjectId.Fail ||
      appConfig.id.toLowerCase().startsWith('skip-')
    ) {
      return Mode.DEBUG;
    }

    // API mode takes precedence over app mode
    return apiMode ?? appConfig.mode;
  }
}
