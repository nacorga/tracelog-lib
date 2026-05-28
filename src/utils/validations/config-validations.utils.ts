import {
  MAX_SESSION_TIMEOUT_MS,
  MIN_SESSION_TIMEOUT_MS,
  DEFAULT_SESSION_TIMEOUT,
  DEFAULT_SAMPLING_RATE,
  VALIDATION_MESSAGES,
  DEFAULT_PAGE_VIEW_THROTTLE_MS,
  DEFAULT_CLICK_THROTTLE_MS,
  MAX_SAME_EVENT_PER_MINUTE,
  DEFAULT_ERROR_SAMPLING_RATE,
  MIN_SEND_INTERVAL_MS,
  MAX_SEND_INTERVAL_MS_CONFIG,
  EVENT_SENT_INTERVAL_MS,
} from '../../constants';
import {
  Config,
  AppConfigValidationError,
  SessionTimeoutValidationError,
  SamplingRateValidationError,
  IntegrationValidationError,
} from '../../types';

/**
 * Validates the app configuration object (before normalization)
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

  if (config.pageViewThrottleMs !== undefined) {
    if (typeof config.pageViewThrottleMs !== 'number' || config.pageViewThrottleMs < 0) {
      throw new AppConfigValidationError(VALIDATION_MESSAGES.INVALID_PAGE_VIEW_THROTTLE, 'config');
    }
  }

  if (config.clickThrottleMs !== undefined) {
    if (typeof config.clickThrottleMs !== 'number' || config.clickThrottleMs < 0) {
      throw new AppConfigValidationError(VALIDATION_MESSAGES.INVALID_CLICK_THROTTLE, 'config');
    }
  }

  if (config.maxSameEventPerMinute !== undefined) {
    if (typeof config.maxSameEventPerMinute !== 'number' || config.maxSameEventPerMinute <= 0) {
      throw new AppConfigValidationError(VALIDATION_MESSAGES.INVALID_MAX_SAME_EVENT_PER_MINUTE, 'config');
    }
  }

  if (config.sendIntervalMs !== undefined) {
    if (
      !Number.isFinite(config.sendIntervalMs) ||
      config.sendIntervalMs < MIN_SEND_INTERVAL_MS ||
      config.sendIntervalMs > MAX_SEND_INTERVAL_MS_CONFIG
    ) {
      throw new AppConfigValidationError(VALIDATION_MESSAGES.INVALID_SEND_INTERVAL, 'config');
    }
  }

  if (config.flushOnSpaNavigation !== undefined && typeof config.flushOnSpaNavigation !== 'boolean') {
    throw new AppConfigValidationError(
      `Invalid flushOnSpaNavigation type: ${typeof config.flushOnSpaNavigation}. Must be a boolean`,
      'config',
    );
  }

  if (config.flushOnPageHidden !== undefined && typeof config.flushOnPageHidden !== 'boolean') {
    throw new AppConfigValidationError(
      `Invalid flushOnPageHidden type: ${typeof config.flushOnPageHidden}. Must be a boolean`,
      'config',
    );
  }

  if (config.webVitalsMode !== undefined) {
    if (typeof config.webVitalsMode !== 'string') {
      throw new AppConfigValidationError(
        `Invalid webVitalsMode type: ${typeof config.webVitalsMode}. Must be a string`,
        'config',
      );
    }

    const validModes = ['all', 'needs-improvement', 'poor'];
    if (!validModes.includes(config.webVitalsMode)) {
      throw new AppConfigValidationError(
        `Invalid webVitalsMode: "${config.webVitalsMode}". Must be one of: ${validModes.join(', ')}`,
        'config',
      );
    }
  }

  if (config.webVitalsThresholds !== undefined) {
    if (
      typeof config.webVitalsThresholds !== 'object' ||
      config.webVitalsThresholds === null ||
      Array.isArray(config.webVitalsThresholds)
    ) {
      throw new AppConfigValidationError('webVitalsThresholds must be an object', 'config');
    }

    const validKeys = ['LCP', 'FCP', 'CLS', 'INP', 'TTFB'];
    for (const [key, value] of Object.entries(config.webVitalsThresholds)) {
      if (!validKeys.includes(key)) {
        throw new AppConfigValidationError(
          `Invalid Web Vitals threshold key: "${key}". Must be one of: ${validKeys.join(', ')}`,
          'config',
        );
      }

      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
        throw new AppConfigValidationError(
          `Invalid Web Vitals threshold value for ${key}: ${value}. Must be a non-negative finite number`,
          'config',
        );
      }
    }
  }
};

/**
 * Validates integrations configuration
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

    if (integrations.tracelog.shopify !== undefined && typeof integrations.tracelog.shopify !== 'boolean') {
      throw new IntegrationValidationError('tracelog.shopify must be a boolean', 'config');
    }

    if (integrations.tracelog.collectUrl !== undefined) {
      const collectUrlError = 'tracelog.collectUrl must be a non-empty HTTPS URL';
      const { collectUrl } = integrations.tracelog;

      if (typeof collectUrl !== 'string' || collectUrl.trim() === '') {
        throw new IntegrationValidationError(collectUrlError, 'config');
      }

      let parsed: URL;
      try {
        parsed = new URL(collectUrl);
      } catch {
        throw new IntegrationValidationError(collectUrlError, 'config');
      }

      if (parsed.protocol !== 'https:') {
        throw new IntegrationValidationError(collectUrlError, 'config');
      }
    }
  }
};

/**
 * Validates and normalizes the app configuration
 */
export const validateAndNormalizeConfig = (config?: Config): Config => {
  validateAppConfig(config);

  const normalizedConfig: Config = {
    ...(config ?? {}),
    sessionTimeout: config?.sessionTimeout ?? DEFAULT_SESSION_TIMEOUT,
    globalMetadata: config?.globalMetadata ?? {},
    sensitiveQueryParams: config?.sensitiveQueryParams ?? [],
    errorSampling: config?.errorSampling ?? DEFAULT_ERROR_SAMPLING_RATE,
    samplingRate: config?.samplingRate ?? DEFAULT_SAMPLING_RATE,
    pageViewThrottleMs: config?.pageViewThrottleMs ?? DEFAULT_PAGE_VIEW_THROTTLE_MS,
    clickThrottleMs: config?.clickThrottleMs ?? DEFAULT_CLICK_THROTTLE_MS,
    maxSameEventPerMinute: config?.maxSameEventPerMinute ?? MAX_SAME_EVENT_PER_MINUTE,
    sendIntervalMs: config?.sendIntervalMs ?? EVENT_SENT_INTERVAL_MS,
    flushOnSpaNavigation: config?.flushOnSpaNavigation ?? false,
    flushOnPageHidden: config?.flushOnPageHidden ?? true,
  };

  return normalizedConfig;
};
