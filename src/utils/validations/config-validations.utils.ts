import { MAX_SESSION_TIMEOUT_MS, MIN_SESSION_TIMEOUT_MS, VALIDATION_MESSAGES } from '../../constants';
import { AppConfig, Config, ApiConfig, Mode } from '../../types';
import {
  ProjectIdValidationError,
  AppConfigValidationError,
  SessionTimeoutValidationError,
  SamplingRateValidationError,
  IntegrationValidationError,
} from '../../types/validation-error.types';
import { debugLog } from '../logging';

/**
 * Validates the app configuration object (before normalization)
 * This validates the structure and basic types but allows for normalization afterward
 * @param config - The app configuration to validate
 * @throws {ProjectIdValidationError} If project ID validation fails
 * @throws {AppConfigValidationError} If other configuration validation fails
 */
export const validateAppConfig = (config: AppConfig): void => {
  // Validate config exists and has id property
  if (!config || typeof config !== 'object') {
    debugLog.clientError('ConfigValidation', 'Configuration must be an object', { config });
    throw new AppConfigValidationError('Configuration must be an object', 'config');
  }

  // Check if id property exists (allow falsy values to be handled by normalization)
  if (!('id' in config)) {
    debugLog.clientError('ConfigValidation', 'Project ID is missing from configuration');
    throw new ProjectIdValidationError(VALIDATION_MESSAGES.MISSING_PROJECT_ID, 'config');
  }

  // Check basic type - null, undefined, or non-string values should fail here
  if (config.id === null || config.id === undefined || typeof config.id !== 'string') {
    debugLog.clientError('ConfigValidation', 'Project ID must be a non-empty string', {
      providedId: config.id,
      type: typeof config.id,
    });
    throw new ProjectIdValidationError(VALIDATION_MESSAGES.MISSING_PROJECT_ID, 'config');
  }

  if (config.sessionTimeout !== undefined) {
    if (
      typeof config.sessionTimeout !== 'number' ||
      config.sessionTimeout < MIN_SESSION_TIMEOUT_MS ||
      config.sessionTimeout > MAX_SESSION_TIMEOUT_MS
    ) {
      debugLog.clientError('ConfigValidation', 'Invalid session timeout', {
        provided: config.sessionTimeout,
        min: MIN_SESSION_TIMEOUT_MS,
        max: MAX_SESSION_TIMEOUT_MS,
      });
      throw new SessionTimeoutValidationError(VALIDATION_MESSAGES.INVALID_SESSION_TIMEOUT, 'config');
    }
  }

  if (config.globalMetadata !== undefined) {
    if (typeof config.globalMetadata !== 'object' || config.globalMetadata === null) {
      debugLog.clientError('ConfigValidation', 'Global metadata must be an object', {
        provided: config.globalMetadata,
        type: typeof config.globalMetadata,
      });
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
      debugLog.clientError('ConfigValidation', 'Sensitive query params must be an array', {
        provided: config.sensitiveQueryParams,
        type: typeof config.sensitiveQueryParams,
      });
      throw new AppConfigValidationError(VALIDATION_MESSAGES.INVALID_SENSITIVE_QUERY_PARAMS, 'config');
    }

    for (const param of config.sensitiveQueryParams) {
      if (typeof param !== 'string') {
        debugLog.clientError('ConfigValidation', 'All sensitive query params must be strings', {
          param,
          type: typeof param,
        });
        throw new AppConfigValidationError('All sensitive query params must be strings', 'config');
      }
    }
  }

  if (config.errorSampling !== undefined) {
    if (typeof config.errorSampling !== 'number' || config.errorSampling < 0 || config.errorSampling > 1) {
      debugLog.clientError('ConfigValidation', 'Invalid error sampling rate', {
        provided: config.errorSampling,
        expected: '0-1',
      });
      throw new SamplingRateValidationError(VALIDATION_MESSAGES.INVALID_ERROR_SAMPLING_RATE, 'config');
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
      debugLog.clientError('ConfigValidation', 'Invalid scroll container selector', {
        selector,
        type: typeof selector,
        isEmpty: selector === '' || (typeof selector === 'string' && selector.trim() === ''),
      });
      throw new AppConfigValidationError(VALIDATION_MESSAGES.INVALID_SCROLL_CONTAINER_SELECTORS, 'config');
    }

    // Validate CSS selector syntax using regex-based validation (XSS prevention)
    // This validates syntax WITHOUT executing document.querySelector()
    if (!isValidCssSelectorSyntax(selector)) {
      debugLog.clientError('ConfigValidation', 'Invalid or potentially unsafe CSS selector', {
        selector,
        reason: 'Failed security validation',
      });
      throw new AppConfigValidationError('Invalid or potentially unsafe CSS selector', 'config');
    }
  }
};

/**
 * Validates integrations configuration
 * @param integrations - Integrations configuration to validate
 */
const validateIntegrations = (integrations: AppConfig['integrations']): void => {
  if (!integrations) return;

  if (integrations.googleAnalytics) {
    if (
      !integrations.googleAnalytics.measurementId ||
      typeof integrations.googleAnalytics.measurementId !== 'string' ||
      integrations.googleAnalytics.measurementId.trim() === ''
    ) {
      debugLog.clientError('ConfigValidation', 'Invalid Google Analytics measurement ID', {
        provided: integrations.googleAnalytics.measurementId,
        type: typeof integrations.googleAnalytics.measurementId,
      });
      throw new IntegrationValidationError(VALIDATION_MESSAGES.INVALID_GOOGLE_ANALYTICS_ID, 'config');
    }

    const measurementId = integrations.googleAnalytics.measurementId.trim();

    if (!measurementId.match(/^(G-|UA-)/)) {
      debugLog.clientError('ConfigValidation', 'Google Analytics measurement ID must start with "G-" or "UA-"', {
        provided: measurementId,
      });
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
export const validateAndNormalizeConfig = (config: AppConfig): AppConfig => {
  // First validate the structure and basic types
  validateAppConfig(config);

  // Normalize string values
  const normalizedConfig = {
    ...config,
    id: config.id.trim(),
    globalMetadata: config.globalMetadata ?? {},
    sensitiveQueryParams: config.sensitiveQueryParams ?? [],
  };

  // Validate normalized values - this catches whitespace-only IDs
  if (!normalizedConfig.id) {
    debugLog.clientError('ConfigValidation', 'Project ID is empty after trimming whitespace', {
      originalId: config.id,
      normalizedId: normalizedConfig.id,
    });
    throw new ProjectIdValidationError(VALIDATION_MESSAGES.PROJECT_ID_EMPTY_AFTER_TRIM, 'config');
  }

  return normalizedConfig;
};

/**
 * Validates sampling rate
 * @param samplingRate - The sampling rate to validate
 * @param errors - Array to push errors to
 */
const validateSamplingRate = (samplingRate: unknown, errors: string[]): void => {
  if (samplingRate !== undefined) {
    if (typeof samplingRate !== 'number') {
      errors.push('samplingRate must be a number');
    } else if (samplingRate < 0 || samplingRate > 1) {
      errors.push('samplingRate must be between 0 and 1');
    }
  }
};

/**
 * Validates excluded URL paths
 * @param excludedUrlPaths - The excluded URL paths to validate
 * @param errors - Array to push errors to
 * @param prefix - Optional prefix for error messages
 */
const validateExcludedUrlPaths = (excludedUrlPaths: unknown, errors: string[], prefix = ''): void => {
  if (excludedUrlPaths !== undefined) {
    if (Array.isArray(excludedUrlPaths)) {
      for (const [index, path] of excludedUrlPaths.entries()) {
        if (typeof path === 'string') {
          try {
            new RegExp(path);
          } catch {
            errors.push(`${prefix}excludedUrlPaths[${index}] is not a valid regex pattern`);
          }
        } else {
          errors.push(`${prefix}excludedUrlPaths[${index}] must be a string`);
        }
      }
    } else {
      errors.push(`${prefix}excludedUrlPaths must be an array`);
    }
  }
};

/**
 * Validates a complete configuration object
 * @param config - The configuration to validate
 * @returns Validation result with errors and warnings
 */
export const validateConfig = (config: Config): { errors: string[]; warnings: string[] } => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (config.sessionTimeout !== undefined) {
    if (typeof config.sessionTimeout !== 'number') {
      errors.push('sessionTimeout must be a number');
    } else if (config.sessionTimeout < MIN_SESSION_TIMEOUT_MS) {
      errors.push('sessionTimeout must be at least 30 seconds (30000ms)');
    } else if (config.sessionTimeout > MAX_SESSION_TIMEOUT_MS) {
      warnings.push('sessionTimeout is very long (>24 hours), consider reducing it');
    }
  }

  if (config.globalMetadata !== undefined) {
    if (typeof config.globalMetadata !== 'object' || config.globalMetadata === null) {
      errors.push('globalMetadata must be an object');
    } else {
      const metadataSize = JSON.stringify(config.globalMetadata).length;

      if (metadataSize > 10_240) {
        errors.push('globalMetadata is too large (max 10KB)');
      }

      if (Object.keys(config.globalMetadata).length > 12) {
        errors.push('globalMetadata has too many keys (max 12)');
      }
    }
  }

  // No custom API endpoints supported

  validateSamplingRate(config.samplingRate, errors);

  if (config.tags !== undefined && !Array.isArray(config.tags)) {
    errors.push('tags must be an array');
  }

  validateExcludedUrlPaths(config.excludedUrlPaths, errors);

  return { errors, warnings };
};

/**
 * Validates the final configuration
 * @param config - The configuration to validate
 * @returns Validation result with errors and warnings
 */
export const validateFinalConfig = (config: Config): { errors: string[]; warnings: string[] } => {
  const errors: string[] = [];
  const warnings: string[] = [];

  validateSamplingRate(config.samplingRate, errors);
  validateExcludedUrlPaths(config.excludedUrlPaths, errors);
  // No custom API endpoints supported

  return { errors, warnings };
};

/**
 * Type guard to check if a JSON response is a valid API config
 * @param json - The JSON to validate
 * @returns True if the JSON is a valid API config
 */
export const isValidConfigApiResponse = (json: unknown): json is ApiConfig => {
  try {
    if (typeof json !== 'object' || !json) {
      return false;
    }

    const response = json as Record<string, unknown>;

    const result: Record<keyof ApiConfig, boolean> = {
      mode: response['mode'] === undefined || [Mode.QA, Mode.DEBUG].includes(response['mode'] as Mode),
      samplingRate:
        response['samplingRate'] === undefined ||
        (typeof response['samplingRate'] === 'number' && response['samplingRate'] > 0 && response['samplingRate'] <= 1),
      tags: response['tags'] === undefined || Array.isArray(response['tags']),
      excludedUrlPaths: response['excludedUrlPaths'] === undefined || Array.isArray(response['excludedUrlPaths']),
      ipExcluded: response['ipExcluded'] === undefined || typeof response['ipExcluded'] === 'boolean',
    };

    return Object.values(result).every(Boolean);
  } catch {
    return false;
  }
};
