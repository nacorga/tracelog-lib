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
import { log } from '../logging.utils';

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

  if (config.scrollContainerSelectors !== undefined) {
    validateScrollContainerSelectors(config.scrollContainerSelectors);
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
};

/**
 * Validates CSS selector syntax without executing querySelector (XSS prevention)
 * @param selector - CSS selector to validate
 * @returns True if the selector syntax is valid
 */
const isValidCssSelectorSyntax = (selector: string): boolean => {
  // Prevent dangerous characters that could indicate XSS attempts
  if (selector.includes('<') || selector.includes('>') || /on\w+\s*=/i.test(selector)) {
    return false;
  }

  // Safe CSS selector pattern - allows common selector syntax
  const safePattern = /^[a-zA-Z0-9\-_#.[\]="':, >+~*()]+$/;
  if (!safePattern.test(selector)) {
    return false;
  }

  // Check for balanced parentheses
  let parenthesesCount = 0;
  for (const char of selector) {
    if (char === '(') parenthesesCount++;
    if (char === ')') parenthesesCount--;
    if (parenthesesCount < 0) return false;
  }
  if (parenthesesCount !== 0) return false;

  // Check for balanced square brackets
  let bracketsCount = 0;
  for (const char of selector) {
    if (char === '[') bracketsCount++;
    if (char === ']') bracketsCount--;
    if (bracketsCount < 0) return false;
  }
  if (bracketsCount !== 0) return false;

  return true;
};

/**
 * Validates scroll container selectors
 * @param selectors - CSS selectors to validate
 */
const validateScrollContainerSelectors = (selectors: string | string[]): void => {
  const selectorsArray = Array.isArray(selectors) ? selectors : [selectors];

  for (const selector of selectorsArray) {
    if (typeof selector !== 'string' || selector.trim() === '') {
      log('error', 'Invalid scroll container selector', {
        showToClient: true,
        data: {
          selector,
          type: typeof selector,
          isEmpty: selector === '' || (typeof selector === 'string' && selector.trim() === ''),
        },
      });

      throw new AppConfigValidationError(VALIDATION_MESSAGES.INVALID_SCROLL_CONTAINER_SELECTORS, 'config');
    }

    // Validate CSS selector syntax using regex-based validation (XSS prevention)
    // This validates syntax WITHOUT executing document.querySelector()
    if (!isValidCssSelectorSyntax(selector)) {
      log('error', 'Invalid or potentially unsafe CSS selector', {
        showToClient: true,
        data: {
          selector,
          reason: 'Failed security validation',
        },
      });

      throw new AppConfigValidationError('Invalid or potentially unsafe CSS selector', 'config');
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
      !integrations.custom.apiUrl ||
      typeof integrations.custom.apiUrl !== 'string' ||
      integrations.custom.apiUrl.trim() === ''
    ) {
      throw new IntegrationValidationError(VALIDATION_MESSAGES.INVALID_CUSTOM_API_URL, 'config');
    }

    if (integrations.custom.allowHttp !== undefined && typeof integrations.custom.allowHttp !== 'boolean') {
      throw new IntegrationValidationError('allowHttp must be a boolean', 'config');
    }

    const apiUrl = integrations.custom.apiUrl.trim();

    if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
      throw new IntegrationValidationError('Custom API URL must start with "http://" or "https://"', 'config');
    }

    const allowHttp = integrations.custom.allowHttp ?? false;

    if (!allowHttp && apiUrl.startsWith('http://')) {
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
