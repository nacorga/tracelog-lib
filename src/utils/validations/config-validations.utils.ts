import {
  MAX_SESSION_TIMEOUT_MS,
  MIN_SESSION_TIMEOUT_MS,
  DEFAULT_SESSION_TIMEOUT,
  VALIDATION_MESSAGES,
} from '../../constants';
import { Config } from '../../types';
import {
  AppConfigValidationError,
  SessionTimeoutValidationError,
  SamplingRateValidationError,
  IntegrationValidationError,
} from '../../types/validation-error.types';

/**
 * Validates the app configuration object (before normalization)
 * This validates the structure and basic types but allows for normalization afterward
 * @param config - The app configuration to validate
 * @throws {ProjectIdValidationError} If project ID validation fails
 * @throws {AppConfigValidationError} If other configuration validation fails
 */
export const validateAppConfig = (config?: Config): void => {
  if (config !== undefined && (config === null || typeof config !== 'object')) {
    throw new AppConfigValidationError('Configuration must be an object', 'config');
  }

  if (!config) {
    return;
  }

  if (config.sessionTimeout !== undefined) {
    if (
      typeof config.sessionTimeout !== 'number' ||
      config.sessionTimeout < MIN_SESSION_TIMEOUT_MS ||
      config.sessionTimeout > MAX_SESSION_TIMEOUT_MS
    ) {
      throw new SessionTimeoutValidationError(VALIDATION_MESSAGES.INVALID_SESSION_TIMEOUT, 'config');
    }
  }

  if (config.globalMetadata !== undefined) {
    if (typeof config.globalMetadata !== 'object' || config.globalMetadata === null) {
      throw new AppConfigValidationError(VALIDATION_MESSAGES.INVALID_GLOBAL_METADATA, 'config');
    }
  }

  if (config.integrations) {
    validateIntegrations(config.integrations);
  }

  if (config.sensitiveQueryParams !== undefined) {
    if (!Array.isArray(config.sensitiveQueryParams)) {
      throw new AppConfigValidationError(VALIDATION_MESSAGES.INVALID_SENSITIVE_QUERY_PARAMS, 'config');
    }

    for (const param of config.sensitiveQueryParams) {
      if (typeof param !== 'string') {
        throw new AppConfigValidationError('All sensitive query params must be strings', 'config');
      }
    }
  }

  if (config.errorSampling !== undefined) {
    if (typeof config.errorSampling !== 'number' || config.errorSampling < 0 || config.errorSampling > 1) {
      throw new SamplingRateValidationError(VALIDATION_MESSAGES.INVALID_ERROR_SAMPLING_RATE, 'config');
    }
  }

  if (config.samplingRate !== undefined) {
    if (typeof config.samplingRate !== 'number' || config.samplingRate < 0 || config.samplingRate > 1) {
      throw new SamplingRateValidationError(VALIDATION_MESSAGES.INVALID_SAMPLING_RATE, 'config');
    }
  }

  if (config.primaryScrollSelector !== undefined) {
    if (typeof config.primaryScrollSelector !== 'string' || !config.primaryScrollSelector.trim()) {
      throw new AppConfigValidationError(VALIDATION_MESSAGES.INVALID_PRIMARY_SCROLL_SELECTOR, 'config');
    }

    // Validate CSS selector syntax (skip for 'window' special value)
    if (config.primaryScrollSelector !== 'window') {
      try {
        document.querySelector(config.primaryScrollSelector);
      } catch {
        throw new AppConfigValidationError(
          `${VALIDATION_MESSAGES.INVALID_PRIMARY_SCROLL_SELECTOR_SYNTAX}: "${config.primaryScrollSelector}"`,
          'config',
        );
      }
    }
  }
};

/**
 * Validates integrations configuration
 * @param integrations - Integrations configuration to validate
 */
const validateIntegrations = (integrations: Config['integrations']): void => {
  if (!integrations) {
    return;
  }

  if (integrations.tracelog) {
    if (
      !integrations.tracelog.projectId ||
      typeof integrations.tracelog.projectId !== 'string' ||
      integrations.tracelog.projectId.trim() === ''
    ) {
      throw new IntegrationValidationError(VALIDATION_MESSAGES.INVALID_TRACELOG_PROJECT_ID, 'config');
    }
  }

  if (integrations.custom) {
    if (
      !integrations.custom.collectApiUrl ||
      typeof integrations.custom.collectApiUrl !== 'string' ||
      integrations.custom.collectApiUrl.trim() === ''
    ) {
      throw new IntegrationValidationError(VALIDATION_MESSAGES.INVALID_CUSTOM_API_URL, 'config');
    }

    if (integrations.custom.allowHttp !== undefined && typeof integrations.custom.allowHttp !== 'boolean') {
      throw new IntegrationValidationError('allowHttp must be a boolean', 'config');
    }

    const collectApiUrl = integrations.custom.collectApiUrl.trim();

    if (!collectApiUrl.startsWith('http://') && !collectApiUrl.startsWith('https://')) {
      throw new IntegrationValidationError('Custom API URL must start with "http://" or "https://"', 'config');
    }

    const allowHttp = integrations.custom.allowHttp ?? false;

    if (!allowHttp && collectApiUrl.startsWith('http://')) {
      throw new IntegrationValidationError(
        'Custom API URL must use HTTPS in production. Set allowHttp: true in integration config to allow HTTP (not recommended)',
        'config',
      );
    }
  }

  if (integrations.googleAnalytics) {
    if (
      !integrations.googleAnalytics.measurementId ||
      typeof integrations.googleAnalytics.measurementId !== 'string' ||
      integrations.googleAnalytics.measurementId.trim() === ''
    ) {
      throw new IntegrationValidationError(VALIDATION_MESSAGES.INVALID_GOOGLE_ANALYTICS_ID, 'config');
    }

    const measurementId = integrations.googleAnalytics.measurementId.trim();

    if (!measurementId.match(/^(G-|UA-)/)) {
      throw new IntegrationValidationError('Google Analytics measurement ID must start with "G-" or "UA-"', 'config');
    }
  }
};

/**
 * Validates and normalizes the app configuration
 * This is the primary validation entry point that ensures consistent behavior
 * @param config - The app configuration to validate and normalize
 * @returns The normalized configuration
 * @throws {ProjectIdValidationError} If project ID validation fails after normalization
 * @throws {AppConfigValidationError} If other configuration validation fails
 */
export const validateAndNormalizeConfig = (config?: Config): Config => {
  validateAppConfig(config);

  const normalizedConfig: Config = {
    ...(config ?? {}),
    sessionTimeout: config?.sessionTimeout ?? DEFAULT_SESSION_TIMEOUT,
    globalMetadata: config?.globalMetadata ?? {},
    sensitiveQueryParams: config?.sensitiveQueryParams ?? [],
    errorSampling: config?.errorSampling ?? 1,
    samplingRate: config?.samplingRate ?? 1,
  };

  // Normalize integrations
  if (normalizedConfig.integrations?.custom) {
    normalizedConfig.integrations.custom = {
      ...normalizedConfig.integrations.custom,
      allowHttp: normalizedConfig.integrations.custom.allowHttp ?? false,
    };
  }

  return normalizedConfig;
};
