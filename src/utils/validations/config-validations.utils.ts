import {
  MAX_SESSION_TIMEOUT_MS,
  MIN_SESSION_TIMEOUT_MS,
  DEFAULT_SESSION_TIMEOUT,
  DEFAULT_SAMPLING_RATE,
  VALIDATION_MESSAGES,
  DEFAULT_PAGE_VIEW_THROTTLE_MS,
  DEFAULT_CLICK_THROTTLE_MS,
  MAX_SAME_EVENT_PER_MINUTE,
  DEFAULT_VIEWPORT_COOLDOWN_PERIOD,
  DEFAULT_VIEWPORT_MAX_TRACKED_ELEMENTS,
  DEFAULT_VISIBILITY_TIMEOUT_MS,
  DEFAULT_ERROR_SAMPLING_RATE,
  DISABLEABLE_EVENT_TYPES,
  MAX_CONSENT_BUFFER_LENGTH,
} from '../../constants';
import {
  Config,
  AppConfigValidationError,
  SessionTimeoutValidationError,
  SamplingRateValidationError,
  IntegrationValidationError,
  EventType,
} from '../../types';

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

  if (config.viewport !== undefined) {
    validateViewportConfig(config.viewport);
  }

  if (config.disabledEvents !== undefined) {
    if (!Array.isArray(config.disabledEvents)) {
      throw new AppConfigValidationError('disabledEvents must be an array', 'config');
    }

    const uniqueEvents = new Set<string>();

    for (const eventType of config.disabledEvents) {
      if (typeof eventType !== 'string') {
        throw new AppConfigValidationError('All disabled event types must be strings', 'config');
      }

      if (!DISABLEABLE_EVENT_TYPES.includes(eventType as any)) {
        throw new AppConfigValidationError(
          `Invalid disabled event type: "${eventType}". Must be one of: ${DISABLEABLE_EVENT_TYPES.join(', ')}`,
          'config',
        );
      }

      if (uniqueEvents.has(eventType)) {
        throw new AppConfigValidationError(
          `Duplicate disabled event type found: "${eventType}". Each event type should appear only once.`,
          'config',
        );
      }

      uniqueEvents.add(eventType);
    }
  }

  if (config.webVitalsMode !== undefined) {
    // Type check first
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
    // Type check: must be object and not null or array
    if (
      typeof config.webVitalsThresholds !== 'object' ||
      config.webVitalsThresholds === null ||
      Array.isArray(config.webVitalsThresholds)
    ) {
      throw new AppConfigValidationError('webVitalsThresholds must be an object', 'config');
    }

    const validKeys = ['LCP', 'FCP', 'CLS', 'INP', 'TTFB', 'LONG_TASK'];
    for (const [key, value] of Object.entries(config.webVitalsThresholds)) {
      if (!validKeys.includes(key)) {
        throw new AppConfigValidationError(
          `Invalid Web Vitals threshold key: "${key}". Must be one of: ${validKeys.join(', ')}`,
          'config',
        );
      }

      // Validate value is a valid number (not NaN, Infinity, negative, or non-number)
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
        throw new AppConfigValidationError(
          `Invalid Web Vitals threshold value for ${key}: ${value}. Must be a non-negative finite number`,
          'config',
        );
      }
    }
  }

  if (config.waitForConsent !== undefined) {
    if (typeof config.waitForConsent !== 'boolean') {
      throw new AppConfigValidationError('waitForConsent must be a boolean', 'config');
    }
  }

  if (config.maxConsentBufferSize !== undefined) {
    if (
      typeof config.maxConsentBufferSize !== 'number' ||
      !Number.isFinite(config.maxConsentBufferSize) ||
      config.maxConsentBufferSize <= 0 ||
      !Number.isInteger(config.maxConsentBufferSize)
    ) {
      throw new AppConfigValidationError('maxConsentBufferSize must be a positive integer', 'config');
    }
  }
};

/**
 * Validates viewport configuration
 * @param viewport - Viewport configuration to validate
 */
const validateViewportConfig = (viewport: Config['viewport']): void => {
  if (typeof viewport !== 'object' || viewport === null) {
    throw new AppConfigValidationError(VALIDATION_MESSAGES.INVALID_VIEWPORT_CONFIG, 'config');
  }

  // Validate elements array
  if (!viewport.elements || !Array.isArray(viewport.elements)) {
    throw new AppConfigValidationError(VALIDATION_MESSAGES.INVALID_VIEWPORT_ELEMENTS, 'config');
  }

  if (viewport.elements.length === 0) {
    throw new AppConfigValidationError(VALIDATION_MESSAGES.INVALID_VIEWPORT_ELEMENTS, 'config');
  }

  // Track unique selectors to detect duplicates
  const uniqueSelectors = new Set<string>();

  // Validate each element
  for (const element of viewport.elements) {
    if (!element.selector || typeof element.selector !== 'string' || !element.selector.trim()) {
      throw new AppConfigValidationError(VALIDATION_MESSAGES.INVALID_VIEWPORT_ELEMENT, 'config');
    }

    // Check for duplicate selectors
    const normalizedSelector = element.selector.trim();
    if (uniqueSelectors.has(normalizedSelector)) {
      throw new AppConfigValidationError(
        `Duplicate viewport selector found: "${normalizedSelector}". Each selector should appear only once.`,
        'config',
      );
    }
    uniqueSelectors.add(normalizedSelector);

    if (element.id !== undefined && (typeof element.id !== 'string' || !element.id.trim())) {
      throw new AppConfigValidationError(VALIDATION_MESSAGES.INVALID_VIEWPORT_ELEMENT_ID, 'config');
    }

    if (element.name !== undefined && (typeof element.name !== 'string' || !element.name.trim())) {
      throw new AppConfigValidationError(VALIDATION_MESSAGES.INVALID_VIEWPORT_ELEMENT_NAME, 'config');
    }
  }

  // Validate threshold
  if (viewport.threshold !== undefined) {
    if (typeof viewport.threshold !== 'number' || viewport.threshold < 0 || viewport.threshold > 1) {
      throw new AppConfigValidationError(VALIDATION_MESSAGES.INVALID_VIEWPORT_THRESHOLD, 'config');
    }
  }

  // Validate minDwellTime
  if (viewport.minDwellTime !== undefined) {
    if (typeof viewport.minDwellTime !== 'number' || viewport.minDwellTime < 0) {
      throw new AppConfigValidationError(VALIDATION_MESSAGES.INVALID_VIEWPORT_MIN_DWELL_TIME, 'config');
    }
  }

  // Validate cooldownPeriod
  if (viewport.cooldownPeriod !== undefined) {
    if (typeof viewport.cooldownPeriod !== 'number' || viewport.cooldownPeriod < 0) {
      throw new AppConfigValidationError(VALIDATION_MESSAGES.INVALID_VIEWPORT_COOLDOWN_PERIOD, 'config');
    }
  }

  // Validate maxTrackedElements
  if (viewport.maxTrackedElements !== undefined) {
    if (typeof viewport.maxTrackedElements !== 'number' || viewport.maxTrackedElements <= 0) {
      throw new AppConfigValidationError(VALIDATION_MESSAGES.INVALID_VIEWPORT_MAX_TRACKED_ELEMENTS, 'config');
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

  if (integrations.google) {
    const { measurementId, containerId, forwardEvents } = integrations.google;
    const isValidMeasurementId = typeof measurementId === 'string' && measurementId.trim() !== '';
    const isValidContainerId = typeof containerId === 'string' && containerId.trim() !== '';

    if (!isValidMeasurementId && !isValidContainerId) {
      throw new IntegrationValidationError(
        'Google integration requires at least one of: measurementId (GA4) or containerId (GTM)',
        'config',
      );
    }

    if (isValidMeasurementId) {
      const trimmedMeasurementId = measurementId.trim();
      const isGA4 = /^G-[A-Z0-9]{10}$/.test(trimmedMeasurementId);
      const isUA = /^UA-[0-9]{6,9}-[0-9]{1}$/.test(trimmedMeasurementId);
      const isAW = /^AW-[0-9]{10}$/.test(trimmedMeasurementId);

      if (!isGA4 && !isUA && !isAW) {
        throw new IntegrationValidationError(
          'Google Analytics measurement ID must match one of: "G-XXXXXXXXXX" (GA4), "UA-XXXXXXXXX-X" (Universal Analytics), or "AW-XXXXXXXXXX" (Google Ads)',
          'config',
        );
      }
    }

    if (isValidContainerId) {
      const trimmedContainerId = containerId.trim();

      if (!trimmedContainerId.match(/^GTM-[A-Z0-9]+$/)) {
        throw new IntegrationValidationError(
          'Google Tag Manager container ID must match the format "GTM-XXXXXX" (uppercase letters and digits only)',
          'config',
        );
      }
    }

    if (forwardEvents !== undefined) {
      if (forwardEvents === 'all') {
        // 'all' is valid
      } else if (Array.isArray(forwardEvents)) {
        if (forwardEvents.length === 0) {
          throw new IntegrationValidationError(
            'Google integration forwardEvents cannot be an empty array. Use undefined to use default or specify event types.',
            'config',
          );
        }

        const validEventTypes = Object.values(EventType);
        const uniqueEvents = new Set<string>();

        for (const eventType of forwardEvents) {
          if (typeof eventType !== 'string') {
            throw new IntegrationValidationError('All forwarded event types must be strings', 'config');
          }

          if (!validEventTypes.includes(eventType as EventType)) {
            throw new IntegrationValidationError(
              `Invalid forwarded event type: "${eventType}". Must be one of: ${validEventTypes.join(', ')}`,
              'config',
            );
          }

          if (uniqueEvents.has(eventType)) {
            throw new IntegrationValidationError(
              `Duplicate forwarded event type found: "${eventType}". Each event type should appear only once.`,
              'config',
            );
          }

          uniqueEvents.add(eventType);
        }
      } else {
        throw new IntegrationValidationError(
          'Google integration forwardEvents must be an array of event types or the string "all"',
          'config',
        );
      }
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
    errorSampling: config?.errorSampling ?? DEFAULT_ERROR_SAMPLING_RATE,
    samplingRate: config?.samplingRate ?? DEFAULT_SAMPLING_RATE,
    pageViewThrottleMs: config?.pageViewThrottleMs ?? DEFAULT_PAGE_VIEW_THROTTLE_MS,
    clickThrottleMs: config?.clickThrottleMs ?? DEFAULT_CLICK_THROTTLE_MS,
    maxSameEventPerMinute: config?.maxSameEventPerMinute ?? MAX_SAME_EVENT_PER_MINUTE,
    disabledEvents: config?.disabledEvents ?? [],
    waitForConsent: config?.waitForConsent ?? false,
    maxConsentBufferSize: config?.maxConsentBufferSize ?? MAX_CONSENT_BUFFER_LENGTH,
  };

  if (normalizedConfig.integrations?.custom) {
    normalizedConfig.integrations.custom = {
      ...normalizedConfig.integrations.custom,
      allowHttp: normalizedConfig.integrations.custom.allowHttp ?? false,
    };
  }

  if (normalizedConfig.viewport) {
    normalizedConfig.viewport = {
      ...normalizedConfig.viewport,
      threshold: normalizedConfig.viewport.threshold ?? 0.5,
      minDwellTime: normalizedConfig.viewport.minDwellTime ?? DEFAULT_VISIBILITY_TIMEOUT_MS,
      cooldownPeriod: normalizedConfig.viewport.cooldownPeriod ?? DEFAULT_VIEWPORT_COOLDOWN_PERIOD,
      maxTrackedElements: normalizedConfig.viewport.maxTrackedElements ?? DEFAULT_VIEWPORT_MAX_TRACKED_ELEMENTS,
    };
  }

  return normalizedConfig;
};
