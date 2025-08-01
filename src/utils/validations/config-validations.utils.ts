import { SESSION_TIMEOUT_MS } from '../../app.constants';
import { AppConfig, Config, ApiConfig } from '../../types/config.types';

/**
 * Configuration validation utilities
 */

const VALIDATION_CONSTANTS = {
  MIN_SESSION_TIMEOUT: 60000, // 1 minute minimum
  MAX_SESSION_TIMEOUT: 86400000, // 24 hours maximum
  MIN_SAMPLING_RATE: 0,
  MAX_SAMPLING_RATE: 1,
  MIN_PROJECT_ID_LENGTH: 3,
  MAX_PROJECT_ID_LENGTH: 100,
} as const;

const VALIDATION_MESSAGES = {
  MISSING_PROJECT_ID: 'Project ID is required',
  INVALID_PROJECT_ID: `Project ID must be between ${VALIDATION_CONSTANTS.MIN_PROJECT_ID_LENGTH} and ${VALIDATION_CONSTANTS.MAX_PROJECT_ID_LENGTH} characters`,
  INVALID_SESSION_TIMEOUT: `Session timeout must be between ${VALIDATION_CONSTANTS.MIN_SESSION_TIMEOUT}ms (1 minute) and ${VALIDATION_CONSTANTS.MAX_SESSION_TIMEOUT}ms (24 hours)`,
  INVALID_SAMPLING_RATE: `Sampling rate must be between ${VALIDATION_CONSTANTS.MIN_SAMPLING_RATE} and ${VALIDATION_CONSTANTS.MAX_SAMPLING_RATE}`,
  INVALID_GOOGLE_ANALYTICS_ID: 'Google Analytics measurement ID is required when integration is enabled',
  INVALID_SCROLL_CONTAINER_SELECTORS: 'Scroll container selectors must be valid CSS selectors',
} as const;

/**
 * Validates the app configuration object
 * @param config - The app configuration to validate
 * @throws {Error} If validation fails
 */
export const validateAppConfig = (config: AppConfig): void => {
  if (!config.id) {
    throw new Error(VALIDATION_MESSAGES.MISSING_PROJECT_ID);
  }

  if (
    typeof config.id !== 'string' ||
    config.id.length < VALIDATION_CONSTANTS.MIN_PROJECT_ID_LENGTH ||
    config.id.length > VALIDATION_CONSTANTS.MAX_PROJECT_ID_LENGTH
  ) {
    throw new Error(VALIDATION_MESSAGES.INVALID_PROJECT_ID);
  }

  if (config.sessionTimeout !== undefined) {
    if (
      typeof config.sessionTimeout !== 'number' ||
      config.sessionTimeout < VALIDATION_CONSTANTS.MIN_SESSION_TIMEOUT ||
      config.sessionTimeout > VALIDATION_CONSTANTS.MAX_SESSION_TIMEOUT
    ) {
      throw new Error(VALIDATION_MESSAGES.INVALID_SESSION_TIMEOUT);
    }
  }

  if (config.globalMetadata !== undefined) {
    if (typeof config.globalMetadata !== 'object' || config.globalMetadata === null) {
      throw new Error('Global metadata must be an object');
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
      throw new Error('Sensitive query params must be an array of strings');
    }

    for (const param of config.sensitiveQueryParams) {
      if (typeof param !== 'string') {
        throw new Error('All sensitive query params must be strings');
      }
    }
  }
};

/**
 * Validates scroll container selectors
 * @param selectors - CSS selectors to validate
 */
const validateScrollContainerSelectors = (selectors: string | string[]): void => {
  const selectorsArray = Array.isArray(selectors) ? selectors : [selectors];

  for (const selector of selectorsArray) {
    if (typeof selector !== 'string' || selector.trim() === '') {
      throw new Error(VALIDATION_MESSAGES.INVALID_SCROLL_CONTAINER_SELECTORS);
    }

    if (typeof document !== 'undefined') {
      try {
        document.querySelector(selector);
      } catch {
        throw new Error(`Invalid CSS selector: "${selector}"`);
      }
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
      throw new Error(VALIDATION_MESSAGES.INVALID_GOOGLE_ANALYTICS_ID);
    }

    const measurementId = integrations.googleAnalytics.measurementId.trim();

    if (!measurementId.match(/^(G-|UA-)/)) {
      throw new Error('Google Analytics measurement ID must start with "G-" or "UA-"');
    }
  }
};

/**
 * Validates and normalizes the app configuration
 * @param config - The app configuration to validate and normalize
 * @returns The normalized configuration
 */
export const validateAndNormalizeConfig = (config: AppConfig): AppConfig => {
  validateAppConfig(config);

  return {
    ...config,
    id: config.id.trim(),
    sessionTimeout: config.sessionTimeout ?? SESSION_TIMEOUT_MS,
    globalMetadata: config.globalMetadata ?? {},
    sensitiveQueryParams: config.sensitiveQueryParams ?? [],
  };
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
    } else if (config.sessionTimeout < 30_000) {
      errors.push('sessionTimeout must be at least 30 seconds (30000ms)');
    } else if (config.sessionTimeout > 24 * 60 * 60 * 1000) {
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

  if (config.qaMode !== undefined && typeof config.qaMode !== 'boolean') {
    errors.push('qaMode must be a boolean');
  }

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
      qaMode: response['qaMode'] === undefined || typeof response['qaMode'] === 'boolean',
      samplingRate:
        response['samplingRate'] === undefined ||
        (typeof response['samplingRate'] === 'number' && response['samplingRate'] > 0 && response['samplingRate'] <= 1),
      tags: response['tags'] === undefined || Array.isArray(response['tags']),
      excludedUrlPaths: response['excludedUrlPaths'] === undefined || Array.isArray(response['excludedUrlPaths']),
    };

    return Object.values(result).every(Boolean);
  } catch {
    return false;
  }
};
