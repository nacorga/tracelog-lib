import { SESSION_TIMEOUT_MS } from '../app.constants';
import { AppConfig } from '../types/config.types';

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
