class BackoffManager {
  currentDelay;
  initialDelay;
  maxDelay;
  multiplier;
  attemptCount = 0;
  name;
  constructor(config, name = "BackoffManager") {
    this.initialDelay = config.initialDelay;
    this.maxDelay = config.maxDelay;
    this.multiplier = config.multiplier;
    this.currentDelay = this.initialDelay;
    this.name = name;
  }
  getNextDelay() {
    const delay = this.currentDelay;
    this.currentDelay = Math.min(this.currentDelay * this.multiplier, this.maxDelay);
    this.attemptCount++;
    return delay;
  }
  getCurrentDelay() {
    return this.currentDelay;
  }
  reset() {
    this.currentDelay = this.initialDelay;
    this.attemptCount = 0;
  }
  getAttemptCount() {
    return this.attemptCount;
  }
  getConfig() {
    return {
      initialDelay: this.initialDelay,
      maxDelay: this.maxDelay,
      multiplier: this.multiplier
    };
  }
  isAtMaxDelay() {
    return this.currentDelay >= this.maxDelay;
  }
}
var DeviceType = /* @__PURE__ */ ((DeviceType2) => {
  DeviceType2["Mobile"] = "mobile";
  DeviceType2["Tablet"] = "tablet";
  DeviceType2["Desktop"] = "desktop";
  DeviceType2["Unknown"] = "unknown";
  return DeviceType2;
})(DeviceType || {});
const globalState = {};
let stateVersion = 0;
const updateQueue = [];
let isUpdating = false;
class StateManager {
  get(key) {
    return globalState[key];
  }
  async set(key, value) {
    return new Promise((resolve) => {
      const update = () => {
        const oldValue = globalState[key];
        const oldVersion = stateVersion;
        globalState[key] = value;
        stateVersion++;
        if (key === "sessionId" || key === "config" || key === "hasStartSession") {
          debugLog.debug("StateManager", "Critical state updated", {
            key,
            oldValue: key === "config" ? !!oldValue : oldValue,
            newValue: key === "config" ? !!value : value,
            version: stateVersion,
            previousVersion: oldVersion
          });
        }
        resolve();
        this.processNextUpdate();
      };
      updateQueue.push(update);
      this.processNextUpdate();
    });
  }
  processNextUpdate() {
    if (isUpdating || updateQueue.length === 0) {
      return;
    }
    isUpdating = true;
    const update = updateQueue.shift();
    if (update) {
      update();
    }
    isUpdating = false;
    if (updateQueue.length > 0) {
      this.processNextUpdate();
    }
  }
  getStateVersion() {
    return stateVersion;
  }
}
class DebugLogger extends StateManager {
  /**
   * Client-facing error - Configuration/usage errors by the client
   * Console: qa and debug modes | Events: NODE_ENV=dev
   */
  clientError(namespace, message, data) {
    this.logMessage("CLIENT_ERROR", namespace, message, data);
  }
  /**
   * Client-facing warning - Configuration/usage warnings by the client
   * Console: qa and debug modes | Events: NODE_ENV=dev
   */
  clientWarn(namespace, message, data) {
    this.logMessage("CLIENT_WARN", namespace, message, data);
  }
  /**
   * General operational information
   * Console: qa and debug modes | Events: NODE_ENV=dev
   */
  info(namespace, message, data) {
    this.logMessage("INFO", namespace, message, data);
  }
  /**
   * Internal library errors
   * Console: debug mode only | Events: NODE_ENV=dev
   */
  error(namespace, message, data) {
    this.logMessage("ERROR", namespace, message, data);
  }
  /**
   * Internal library warnings
   * Console: debug mode only | Events: NODE_ENV=dev
   */
  warn(namespace, message, data) {
    this.logMessage("WARN", namespace, message, data);
  }
  /**
   * Strategic debug information
   * Console: debug mode only | Events: NODE_ENV=dev
   */
  debug(namespace, message, data) {
    this.logMessage("DEBUG", namespace, message, data);
  }
  /**
   * Detailed trace information
   * Console: debug mode only | Events: NODE_ENV=dev
   */
  verbose(namespace, message, data) {
    this.logMessage("VERBOSE", namespace, message, data);
  }
  getCurrentMode() {
    try {
      return this.get("config")?.mode;
    } catch {
      return void 0;
    }
  }
  shouldShowLog(level) {
    const mode = this.getCurrentMode();
    if (["CLIENT_ERROR", "ERROR"].includes(level)) {
      return true;
    }
    if (!mode) {
      return ["CLIENT_ERROR", "CLIENT_WARN"].includes(level);
    }
    switch (mode) {
      case "qa":
        return ["INFO", "CLIENT_ERROR", "CLIENT_WARN"].includes(level);
      case "debug":
        return true;
      default:
        return false;
    }
  }
  formatMessage(namespace, message) {
    return `[TraceLog:${namespace}] ${message}`;
  }
  getConsoleMethod(level) {
    switch (level) {
      case "CLIENT_ERROR":
      case "ERROR":
        return "error";
      case "CLIENT_WARN":
      case "WARN":
        return "warn";
      case "INFO":
      case "DEBUG":
      case "VERBOSE":
      default:
        return "log";
    }
  }
  logMessage(level, namespace, message, data) {
    if (!this.shouldShowLog(level)) {
      return;
    }
    const formattedMessage = this.formatMessage(namespace, message);
    const consoleMethod = this.getConsoleMethod(level);
    if (data !== void 0) {
      console[consoleMethod](formattedMessage, data);
    } else {
      console[consoleMethod](formattedMessage);
    }
    {
      this.dispatchEvent(level, namespace, message, data);
    }
  }
  /**
   * Dispatches tracelog:log events for E2E testing and development debugging
   */
  dispatchEvent(level, namespace, message, data) {
    if (typeof window === "undefined" || typeof CustomEvent === "undefined") {
      return;
    }
    try {
      const event2 = new CustomEvent("tracelog:log", {
        detail: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          level,
          namespace,
          message,
          data
        }
      });
      window.dispatchEvent(event2);
    } catch {
      console.log(`[TraceLog:${namespace}] ${message}`, data);
    }
  }
}
const debugLog = new DebugLogger();
let coarsePointerQuery;
let noHoverQuery;
const initMediaQueries = () => {
  if (typeof window !== "undefined" && !coarsePointerQuery) {
    coarsePointerQuery = window.matchMedia("(pointer: coarse)");
    noHoverQuery = window.matchMedia("(hover: none)");
  }
};
const getDeviceType = () => {
  try {
    debugLog.debug("DeviceDetector", "Starting device detection");
    const nav = navigator;
    if (nav.userAgentData && typeof nav.userAgentData.mobile === "boolean") {
      debugLog.debug("DeviceDetector", "Using modern User-Agent Client Hints API", {
        mobile: nav.userAgentData.mobile,
        platform: nav.userAgentData.platform
      });
      if (nav.userAgentData.platform && /ipad|tablet/i.test(nav.userAgentData.platform)) {
        debugLog.debug("DeviceDetector", "Device detected as tablet via platform hint");
        return DeviceType.Tablet;
      }
      const result = nav.userAgentData.mobile ? DeviceType.Mobile : DeviceType.Desktop;
      debugLog.debug("DeviceDetector", "Device detected via User-Agent hints", { result });
      return result;
    }
    debugLog.debug("DeviceDetector", "Using fallback detection methods");
    initMediaQueries();
    const width = window.innerWidth;
    const hasCoarsePointer = coarsePointerQuery?.matches ?? false;
    const hasNoHover = noHoverQuery?.matches ?? false;
    const hasTouchSupport = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const ua = navigator.userAgent.toLowerCase();
    const isMobileUA = /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/.test(ua);
    const isTabletUA = /tablet|ipad|android(?!.*mobile)/.test(ua);
    const detectionData = {
      width,
      hasCoarsePointer,
      hasNoHover,
      hasTouchSupport,
      isMobileUA,
      isTabletUA,
      maxTouchPoints: navigator.maxTouchPoints
    };
    if (width <= 767 || isMobileUA && hasTouchSupport) {
      debugLog.debug("DeviceDetector", "Device detected as mobile", detectionData);
      return DeviceType.Mobile;
    }
    if (width >= 768 && width <= 1024 || isTabletUA || hasCoarsePointer && hasNoHover && hasTouchSupport) {
      debugLog.debug("DeviceDetector", "Device detected as tablet", detectionData);
      return DeviceType.Tablet;
    }
    debugLog.debug("DeviceDetector", "Device detected as desktop", detectionData);
    return DeviceType.Desktop;
  } catch (error) {
    debugLog.warn("DeviceDetector", "Device detection failed, defaulting to desktop", {
      error: error instanceof Error ? error.message : error
    });
    return DeviceType.Desktop;
  }
};
const DEFAULT_MOTION_THRESHOLD = 2;
const SIGNIFICANT_SCROLL_DELTA = 10;
const DEFAULT_SAMPLING_RATE = 1;
const MAX_EVENTS_QUEUE_LENGTH = 500;
const MIN_SESSION_TIMEOUT_MS = 3e4;
const MAX_SESSION_TIMEOUT_MS = 864e5;
const MAX_CUSTOM_EVENT_NAME_LENGTH = 120;
const MAX_CUSTOM_EVENT_STRING_SIZE = 8 * 1024;
const MAX_CUSTOM_EVENT_KEYS = 10;
const MAX_CUSTOM_EVENT_ARRAY_SIZE = 10;
const MAX_TEXT_LENGTH = 255;
const MAX_STRING_LENGTH = 1e3;
const MAX_ARRAY_LENGTH = 100;
const MAX_OBJECT_DEPTH = 3;
const PRECISION_TWO_DECIMALS = 2;
const PRECISION_FOUR_DECIMALS = 4;
const WEB_VITALS_SAMPLING = 0.75;
const WEB_VITALS_LONG_TASK_SAMPLING = 0.2;
const SYNC_XHR_TIMEOUT_MS = 2e3;
const MAX_FINGERPRINTS = 1e3;
const FINGERPRINT_CLEANUP_MULTIPLIER = 10;
const MAX_FINGERPRINTS_HARD_LIMIT = 2e3;
const FINGERPRINT_CLEANUP_INTERVAL_MS = 6e4;
const CLICK_COORDINATE_PRECISION = 10;
const CIRCUIT_BREAKER_MAX_STUCK_TIME_MS = 5 * 60 * 1e3;
const CIRCUIT_BREAKER_HEALTH_CHECK_INTERVAL_MS = 6e4;
const DEFAULT_SESSION_TIMEOUT_MS = 15 * 60 * 1e3;
const SESSION_HEARTBEAT_INTERVAL_MS = 3e4;
const DEFAULT_THROTTLE_DELAY_MS = 1e3;
const SCROLL_DEBOUNCE_TIME_MS = 250;
const DEFAULT_VISIBILITY_TIMEOUT_MS = 2e3;
const DUPLICATE_EVENT_THRESHOLD_MS = 1e3;
const EVENT_SENT_INTERVAL_MS = 1e4;
const EVENT_SENT_INTERVAL_TEST_MS = 1e3;
const MAX_RETRY_ATTEMPTS = 10;
const EVENT_EXPIRY_HOURS = 24;
const LONG_TASK_THROTTLE_MS = DEFAULT_THROTTLE_DELAY_MS;
const TAB_HEARTBEAT_INTERVAL_MS = 5e3;
const TAB_ELECTION_TIMEOUT_MS = 2e3;
const SESSION_RECOVERY_WINDOW_MULTIPLIER = 2;
const MAX_SESSION_RECOVERY_ATTEMPTS = 3;
const MAX_SESSION_RECOVERY_WINDOW_MS = 24 * 60 * 60 * 1e3;
const MIN_SESSION_RECOVERY_WINDOW_MS = 2 * 60 * 1e3;
const DEFAULT_API_CONFIG = {
  samplingRate: DEFAULT_SAMPLING_RATE,
  tags: [],
  excludedUrlPaths: []
};
const DEFAULT_CONFIG = (config) => ({
  ...DEFAULT_API_CONFIG,
  ...config,
  sessionTimeout: DEFAULT_SESSION_TIMEOUT_MS,
  allowHttp: false
});
const BACKOFF_CONFIGS = {
  /** Circuit breaker backoff configuration for EventManager */
  CIRCUIT_BREAKER: {
    initialDelay: 1e3,
    // 1 second
    maxDelay: 3e4,
    // 30 seconds
    multiplier: 2
  },
  /** Retry backoff configuration for SenderManager */
  RETRY: {
    initialDelay: 1e3,
    // 1 second
    maxDelay: 3e4,
    // 30 seconds
    multiplier: 2
  }
};
const validateBackoffSync = () => {
  const { CIRCUIT_BREAKER, RETRY } = BACKOFF_CONFIGS;
  if (CIRCUIT_BREAKER.initialDelay !== RETRY.initialDelay || CIRCUIT_BREAKER.maxDelay !== RETRY.maxDelay || CIRCUIT_BREAKER.multiplier !== RETRY.multiplier) {
    console.warn("TraceLog: Backoff configurations are not synchronized between components");
  }
};
{
  validateBackoffSync();
}
const HTML_DATA_ATTR_PREFIX = "data-tl";
const INTERACTIVE_SELECTORS = [
  "button",
  "a",
  'input[type="button"]',
  'input[type="submit"]',
  'input[type="reset"]',
  'input[type="checkbox"]',
  'input[type="radio"]',
  "select",
  "textarea",
  '[role="button"]',
  '[role="link"]',
  '[role="tab"]',
  '[role="menuitem"]',
  '[role="option"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="switch"]',
  "[routerLink]",
  "[ng-click]",
  "[data-action]",
  "[data-click]",
  "[data-navigate]",
  "[data-toggle]",
  "[onclick]",
  ".btn",
  ".button",
  ".clickable",
  ".nav-link",
  ".menu-item",
  "[data-testid]",
  '[tabindex="0"]'
];
const UTM_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
const INITIALIZATION_CONSTANTS = {
  /** Maximum number of retries when waiting for concurrent initialization */
  MAX_CONCURRENT_RETRIES: 20,
  /** Delay between retries when waiting for concurrent initialization (ms) */
  CONCURRENT_RETRY_DELAY_MS: 50,
  /** Timeout for overall initialization process (ms) */
  INITIALIZATION_TIMEOUT_MS: 1e4
};
const CIRCUIT_BREAKER_CONSTANTS = {
  /** Maximum number of consecutive failures before opening circuit */
  MAX_FAILURES: 3,
  /** Initial backoff delay when circuit opens (ms) */
  INITIAL_BACKOFF_DELAY_MS: 1e3,
  /** Maximum backoff delay (ms) */
  MAX_BACKOFF_DELAY_MS: 3e4,
  /** Backoff multiplier for exponential backoff */
  BACKOFF_MULTIPLIER: 2,
  /** Time-based recovery period for circuit breaker (ms) */
  RECOVERY_TIME_MS: 3e4
  // 30 seconds
};
const SESSION_SYNC_CONSTANTS = {
  /** Timeout for session synchronization operations (ms) */
  SYNC_TIMEOUT_MS: 2e3,
  /** Maximum retry attempts for session operations */
  MAX_RETRY_ATTEMPTS: 3
};
const SCROLL_SUPPRESSION_CONSTANTS = {
  /** Multiplier for scroll debounce time when suppressing scroll events */
  SUPPRESS_MULTIPLIER: 2
};
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<embed\b[^>]*>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi
];
const STORAGE_BASE_KEY = "tl";
const USER_ID_KEY = (id) => id ? `${STORAGE_BASE_KEY}:${id}:uid` : `${STORAGE_BASE_KEY}:uid`;
const QUEUE_KEY = (id) => id ? `${STORAGE_BASE_KEY}:${id}:queue` : `${STORAGE_BASE_KEY}:queue`;
const SESSION_STORAGE_KEY = (id) => id ? `${STORAGE_BASE_KEY}:${id}:session` : `${STORAGE_BASE_KEY}:session`;
const CROSS_TAB_SESSION_KEY = (id) => id ? `${STORAGE_BASE_KEY}:${id}:cross_tab_session` : `${STORAGE_BASE_KEY}:cross_tab_session`;
const TAB_SPECIFIC_INFO_KEY = (projectId, tabId) => `${STORAGE_BASE_KEY}:${projectId}:tab:${tabId}:info`;
const SESSION_RECOVERY_KEY = (id) => id ? `${STORAGE_BASE_KEY}:${id}:recovery` : `${STORAGE_BASE_KEY}:recovery`;
const BROADCAST_CHANNEL_NAME = (id) => id ? `${STORAGE_BASE_KEY}:${id}:broadcast` : `${STORAGE_BASE_KEY}:broadcast`;
const ALLOWED_API_CONFIG_KEYS = /* @__PURE__ */ new Set([
  "mode",
  "tags",
  "samplingRate",
  "excludedUrlPaths",
  "ipExcluded"
]);
const VALIDATION_MESSAGES = {
  // Project ID validation - consistent message across all layers
  MISSING_PROJECT_ID: "Project ID is required",
  PROJECT_ID_EMPTY_AFTER_TRIM: "Project ID is required",
  // Session timeout validation
  INVALID_SESSION_TIMEOUT: `Session timeout must be between ${MIN_SESSION_TIMEOUT_MS}ms (30 seconds) and ${MAX_SESSION_TIMEOUT_MS}ms (24 hours)`,
  INVALID_ERROR_SAMPLING_RATE: "Error sampling must be between 0 and 1",
  // Integration validation
  INVALID_GOOGLE_ANALYTICS_ID: "Google Analytics measurement ID is required when integration is enabled",
  // UI validation
  INVALID_SCROLL_CONTAINER_SELECTORS: "Scroll container selectors must be valid CSS selectors",
  // Global metadata validation
  INVALID_GLOBAL_METADATA: "Global metadata must be an object",
  // Array validation
  INVALID_SENSITIVE_QUERY_PARAMS: "Sensitive query params must be an array of strings"
};
const getUTMParameters = () => {
  debugLog.debug("UTMParams", "Extracting UTM parameters from URL", {
    url: window.location.href,
    search: window.location.search
  });
  const urlParams = new URLSearchParams(window.location.search);
  const utmParams = {};
  UTM_PARAMS.forEach((param) => {
    const value = urlParams.get(param);
    if (value) {
      const key = param.split("utm_")[1];
      utmParams[key] = value;
      debugLog.debug("UTMParams", "Found UTM parameter", { param, key, value });
    }
  });
  const result = Object.keys(utmParams).length ? utmParams : void 0;
  if (result) {
    debugLog.debug("UTMParams", "UTM parameters extracted successfully", {
      parameterCount: Object.keys(result).length,
      parameters: Object.keys(result)
    });
  } else {
    debugLog.debug("UTMParams", "No UTM parameters found in URL");
  }
  return result;
};
const generateUUID = () => {
  const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : r & 3 | 8;
    return v.toString(16);
  });
  debugLog.verbose("UUIDUtils", "Generated new UUID", { uuid });
  return uuid;
};
var SpecialProjectId = /* @__PURE__ */ ((SpecialProjectId2) => {
  SpecialProjectId2["Skip"] = "skip";
  SpecialProjectId2["Localhost"] = "localhost:";
  return SpecialProjectId2;
})(SpecialProjectId || {});
var EventType = /* @__PURE__ */ ((EventType2) => {
  EventType2["PAGE_VIEW"] = "page_view";
  EventType2["CLICK"] = "click";
  EventType2["SCROLL"] = "scroll";
  EventType2["SESSION_START"] = "session_start";
  EventType2["SESSION_END"] = "session_end";
  EventType2["CUSTOM"] = "custom";
  EventType2["WEB_VITALS"] = "web_vitals";
  EventType2["ERROR"] = "error";
  return EventType2;
})(EventType || {});
var ScrollDirection = /* @__PURE__ */ ((ScrollDirection2) => {
  ScrollDirection2["UP"] = "up";
  ScrollDirection2["DOWN"] = "down";
  return ScrollDirection2;
})(ScrollDirection || {});
var ErrorType = /* @__PURE__ */ ((ErrorType2) => {
  ErrorType2["JS_ERROR"] = "js_error";
  ErrorType2["PROMISE_REJECTION"] = "promise_rejection";
  ErrorType2["NETWORK_ERROR"] = "network_error";
  return ErrorType2;
})(ErrorType || {});
var Mode = /* @__PURE__ */ ((Mode2) => {
  Mode2["QA"] = "qa";
  Mode2["DEBUG"] = "debug";
  return Mode2;
})(Mode || {});
var TagLogicalOperator = /* @__PURE__ */ ((TagLogicalOperator2) => {
  TagLogicalOperator2["AND"] = "AND";
  TagLogicalOperator2["OR"] = "OR";
  return TagLogicalOperator2;
})(TagLogicalOperator || {});
var TagConditionType = /* @__PURE__ */ ((TagConditionType2) => {
  TagConditionType2["URL_MATCHES"] = "url_matches";
  TagConditionType2["ELEMENT_MATCHES"] = "element_matches";
  TagConditionType2["DEVICE_TYPE"] = "device_type";
  TagConditionType2["ELEMENT_TEXT"] = "element_text";
  TagConditionType2["ELEMENT_ATTRIBUTE"] = "element_attribute";
  TagConditionType2["UTM_SOURCE"] = "utm_source";
  TagConditionType2["UTM_MEDIUM"] = "utm_medium";
  TagConditionType2["UTM_CAMPAIGN"] = "utm_campaign";
  return TagConditionType2;
})(TagConditionType || {});
var TagConditionOperator = /* @__PURE__ */ ((TagConditionOperator2) => {
  TagConditionOperator2["EQUALS"] = "equals";
  TagConditionOperator2["CONTAINS"] = "contains";
  TagConditionOperator2["STARTS_WITH"] = "starts_with";
  TagConditionOperator2["ENDS_WITH"] = "ends_with";
  TagConditionOperator2["REGEX"] = "regex";
  TagConditionOperator2["GREATER_THAN"] = "greater_than";
  TagConditionOperator2["LESS_THAN"] = "less_than";
  TagConditionOperator2["EXISTS"] = "exists";
  TagConditionOperator2["NOT_EXISTS"] = "not_exists";
  return TagConditionOperator2;
})(TagConditionOperator || {});
class TraceLogValidationError extends Error {
  constructor(message, errorCode, layer) {
    super(message);
    this.errorCode = errorCode;
    this.layer = layer;
    this.name = this.constructor.name;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
class ProjectIdValidationError extends TraceLogValidationError {
  constructor(message = "Project ID is required", layer = "config") {
    super(message, "PROJECT_ID_INVALID", layer);
  }
}
class AppConfigValidationError extends TraceLogValidationError {
  constructor(message, layer = "config") {
    super(message, "APP_CONFIG_INVALID", layer);
  }
}
class SessionTimeoutValidationError extends TraceLogValidationError {
  constructor(message, layer = "config") {
    super(message, "SESSION_TIMEOUT_INVALID", layer);
  }
}
class SamplingRateValidationError extends TraceLogValidationError {
  constructor(message, layer = "config") {
    super(message, "SAMPLING_RATE_INVALID", layer);
  }
}
class IntegrationValidationError extends TraceLogValidationError {
  constructor(message, layer = "config") {
    super(message, "INTEGRATION_INVALID", layer);
  }
}
class InitializationTimeoutError extends TraceLogValidationError {
  constructor(message, timeoutMs, layer = "runtime") {
    super(message, "INITIALIZATION_TIMEOUT", layer);
    this.timeoutMs = timeoutMs;
  }
}
const validateAppConfig = (config) => {
  if (!config || typeof config !== "object") {
    debugLog.clientError("ConfigValidation", "Configuration must be an object", { config });
    throw new AppConfigValidationError("Configuration must be an object", "config");
  }
  if (!("id" in config)) {
    debugLog.clientError("ConfigValidation", "Project ID is missing from configuration");
    throw new ProjectIdValidationError(VALIDATION_MESSAGES.MISSING_PROJECT_ID, "config");
  }
  if (config.id === null || config.id === void 0 || typeof config.id !== "string") {
    debugLog.clientError("ConfigValidation", "Project ID must be a non-empty string", {
      providedId: config.id,
      type: typeof config.id
    });
    throw new ProjectIdValidationError(VALIDATION_MESSAGES.MISSING_PROJECT_ID, "config");
  }
  if (config.sessionTimeout !== void 0) {
    if (typeof config.sessionTimeout !== "number" || config.sessionTimeout < MIN_SESSION_TIMEOUT_MS || config.sessionTimeout > MAX_SESSION_TIMEOUT_MS) {
      debugLog.clientError("ConfigValidation", "Invalid session timeout", {
        provided: config.sessionTimeout,
        min: MIN_SESSION_TIMEOUT_MS,
        max: MAX_SESSION_TIMEOUT_MS
      });
      throw new SessionTimeoutValidationError(VALIDATION_MESSAGES.INVALID_SESSION_TIMEOUT, "config");
    }
  }
  if (config.globalMetadata !== void 0) {
    if (typeof config.globalMetadata !== "object" || config.globalMetadata === null) {
      debugLog.clientError("ConfigValidation", "Global metadata must be an object", {
        provided: config.globalMetadata,
        type: typeof config.globalMetadata
      });
      throw new AppConfigValidationError(VALIDATION_MESSAGES.INVALID_GLOBAL_METADATA, "config");
    }
  }
  if (config.scrollContainerSelectors !== void 0) {
    validateScrollContainerSelectors(config.scrollContainerSelectors);
  }
  if (config.integrations) {
    validateIntegrations(config.integrations);
  }
  if (config.sensitiveQueryParams !== void 0) {
    if (!Array.isArray(config.sensitiveQueryParams)) {
      debugLog.clientError("ConfigValidation", "Sensitive query params must be an array", {
        provided: config.sensitiveQueryParams,
        type: typeof config.sensitiveQueryParams
      });
      throw new AppConfigValidationError(VALIDATION_MESSAGES.INVALID_SENSITIVE_QUERY_PARAMS, "config");
    }
    for (const param of config.sensitiveQueryParams) {
      if (typeof param !== "string") {
        debugLog.clientError("ConfigValidation", "All sensitive query params must be strings", {
          param,
          type: typeof param
        });
        throw new AppConfigValidationError("All sensitive query params must be strings", "config");
      }
    }
  }
  if (config.errorSampling !== void 0) {
    if (typeof config.errorSampling !== "number" || config.errorSampling < 0 || config.errorSampling > 1) {
      debugLog.clientError("ConfigValidation", "Invalid error sampling rate", {
        provided: config.errorSampling,
        expected: "0-1"
      });
      throw new SamplingRateValidationError(VALIDATION_MESSAGES.INVALID_ERROR_SAMPLING_RATE, "config");
    }
  }
};
const isValidCssSelectorSyntax = (selector) => {
  if (selector.includes("<") || selector.includes(">") || /on\w+\s*=/i.test(selector)) {
    return false;
  }
  const safePattern = /^[a-zA-Z0-9\-_#.[\]="':, >+~*()]+$/;
  if (!safePattern.test(selector)) {
    return false;
  }
  let parenthesesCount = 0;
  for (const char of selector) {
    if (char === "(") parenthesesCount++;
    if (char === ")") parenthesesCount--;
    if (parenthesesCount < 0) return false;
  }
  if (parenthesesCount !== 0) return false;
  let bracketsCount = 0;
  for (const char of selector) {
    if (char === "[") bracketsCount++;
    if (char === "]") bracketsCount--;
    if (bracketsCount < 0) return false;
  }
  if (bracketsCount !== 0) return false;
  return true;
};
const validateScrollContainerSelectors = (selectors) => {
  const selectorsArray = Array.isArray(selectors) ? selectors : [selectors];
  for (const selector of selectorsArray) {
    if (typeof selector !== "string" || selector.trim() === "") {
      debugLog.clientError("ConfigValidation", "Invalid scroll container selector", {
        selector,
        type: typeof selector,
        isEmpty: selector === "" || typeof selector === "string" && selector.trim() === ""
      });
      throw new AppConfigValidationError(VALIDATION_MESSAGES.INVALID_SCROLL_CONTAINER_SELECTORS, "config");
    }
    if (!isValidCssSelectorSyntax(selector)) {
      debugLog.clientError("ConfigValidation", "Invalid or potentially unsafe CSS selector", {
        selector,
        reason: "Failed security validation"
      });
      throw new AppConfigValidationError("Invalid or potentially unsafe CSS selector", "config");
    }
  }
};
const validateIntegrations = (integrations) => {
  if (!integrations) return;
  if (integrations.googleAnalytics) {
    if (!integrations.googleAnalytics.measurementId || typeof integrations.googleAnalytics.measurementId !== "string" || integrations.googleAnalytics.measurementId.trim() === "") {
      debugLog.clientError("ConfigValidation", "Invalid Google Analytics measurement ID", {
        provided: integrations.googleAnalytics.measurementId,
        type: typeof integrations.googleAnalytics.measurementId
      });
      throw new IntegrationValidationError(VALIDATION_MESSAGES.INVALID_GOOGLE_ANALYTICS_ID, "config");
    }
    const measurementId = integrations.googleAnalytics.measurementId.trim();
    if (!measurementId.match(/^(G-|UA-)/)) {
      debugLog.clientError("ConfigValidation", 'Google Analytics measurement ID must start with "G-" or "UA-"', {
        provided: measurementId
      });
      throw new IntegrationValidationError('Google Analytics measurement ID must start with "G-" or "UA-"', "config");
    }
  }
};
const validateAndNormalizeConfig = (config) => {
  validateAppConfig(config);
  const normalizedConfig = {
    ...config,
    id: config.id.trim(),
    globalMetadata: config.globalMetadata ?? {},
    sensitiveQueryParams: config.sensitiveQueryParams ?? []
  };
  if (!normalizedConfig.id) {
    debugLog.clientError("ConfigValidation", "Project ID is empty after trimming whitespace", {
      originalId: config.id,
      normalizedId: normalizedConfig.id
    });
    throw new ProjectIdValidationError(VALIDATION_MESSAGES.PROJECT_ID_EMPTY_AFTER_TRIM, "config");
  }
  return normalizedConfig;
};
const sanitizeString = (value) => {
  if (!value || typeof value !== "string" || value.trim().length === 0) {
    debugLog.debug("Sanitize", "String sanitization skipped - empty or invalid input", { value, type: typeof value });
    return "";
  }
  const originalLength = value.length;
  let sanitized = value;
  if (value.length > MAX_STRING_LENGTH) {
    sanitized = value.slice(0, Math.max(0, MAX_STRING_LENGTH));
    debugLog.warn("Sanitize", "String truncated due to length limit", {
      originalLength,
      maxLength: MAX_STRING_LENGTH,
      truncatedLength: sanitized.length
    });
  }
  let xssPatternMatches = 0;
  for (const pattern of XSS_PATTERNS) {
    const beforeReplace = sanitized;
    sanitized = sanitized.replace(pattern, "");
    if (beforeReplace !== sanitized) {
      xssPatternMatches++;
    }
  }
  if (xssPatternMatches > 0) {
    debugLog.warn("Sanitize", "XSS patterns detected and removed", {
      patternMatches: xssPatternMatches,
      originalValue: value.slice(0, 100)
      // Log first 100 chars for debugging
    });
  }
  sanitized = sanitized.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#x27;").replaceAll("/", "&#x2F;");
  const result = sanitized.trim();
  if (originalLength > 50 || xssPatternMatches > 0) {
    debugLog.debug("Sanitize", "String sanitization completed", {
      originalLength,
      sanitizedLength: result.length,
      xssPatternMatches,
      wasTruncated: originalLength > MAX_STRING_LENGTH
    });
  }
  return result;
};
const sanitizePathString = (value) => {
  if (typeof value !== "string") {
    return "";
  }
  if (value.length > MAX_STRING_LENGTH) {
    value = value.slice(0, Math.max(0, MAX_STRING_LENGTH));
  }
  let sanitized = value;
  for (const pattern of XSS_PATTERNS) {
    sanitized = sanitized.replace(pattern, "");
  }
  sanitized = sanitized.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#x27;");
  return sanitized.trim();
};
const sanitizeValue = (value, depth = 0) => {
  if (depth > MAX_OBJECT_DEPTH) {
    debugLog.warn("Sanitize", "Maximum object depth exceeded during sanitization", {
      depth,
      maxDepth: MAX_OBJECT_DEPTH
    });
    return null;
  }
  if (value === null || value === void 0) {
    return null;
  }
  if (typeof value === "string") {
    return sanitizeString(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < -Number.MAX_SAFE_INTEGER || value > Number.MAX_SAFE_INTEGER) {
      debugLog.warn("Sanitize", "Invalid number sanitized to 0", { value, isFinite: Number.isFinite(value) });
      return 0;
    }
    return value;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) {
    const originalLength = value.length;
    const limitedArray = value.slice(0, MAX_ARRAY_LENGTH);
    if (originalLength > MAX_ARRAY_LENGTH) {
      debugLog.warn("Sanitize", "Array truncated due to length limit", {
        originalLength,
        maxLength: MAX_ARRAY_LENGTH,
        depth
      });
    }
    const sanitizedArray = limitedArray.map((item) => sanitizeValue(item, depth + 1)).filter((item) => item !== null);
    if (originalLength > 0 && sanitizedArray.length === 0) {
      debugLog.warn("Sanitize", "All array items were filtered out during sanitization", { originalLength, depth });
    }
    return sanitizedArray;
  }
  if (typeof value === "object") {
    const sanitizedObject = {};
    const entries = Object.entries(value);
    const originalKeysCount = entries.length;
    const limitedEntries = entries.slice(0, 20);
    if (originalKeysCount > 20) {
      debugLog.warn("Sanitize", "Object keys truncated due to limit", {
        originalKeys: originalKeysCount,
        maxKeys: 20,
        depth
      });
    }
    let filteredKeysCount = 0;
    for (const [key, value_] of limitedEntries) {
      const sanitizedKey = sanitizeString(key);
      if (sanitizedKey) {
        const sanitizedValue = sanitizeValue(value_, depth + 1);
        if (sanitizedValue !== null) {
          sanitizedObject[sanitizedKey] = sanitizedValue;
        } else {
          filteredKeysCount++;
        }
      } else {
        filteredKeysCount++;
      }
    }
    if (filteredKeysCount > 0) {
      debugLog.debug("Sanitize", "Object properties filtered during sanitization", {
        filteredKeysCount,
        remainingKeys: Object.keys(sanitizedObject).length,
        depth
      });
    }
    return sanitizedObject;
  }
  debugLog.debug("Sanitize", "Unknown value type sanitized to null", { type: typeof value, depth });
  return null;
};
const sanitizeApiConfig = (data) => {
  debugLog.debug("Sanitize", "Starting API config sanitization");
  const safeData = {};
  if (typeof data !== "object" || data === null) {
    debugLog.warn("Sanitize", "API config data is not an object", { data, type: typeof data });
    return safeData;
  }
  try {
    const originalKeys = Object.keys(data);
    let processedKeys = 0;
    let filteredKeys = 0;
    for (const key of originalKeys) {
      if (ALLOWED_API_CONFIG_KEYS.has(key)) {
        const value = data[key];
        if (key === "excludedUrlPaths") {
          const paths = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
          const originalPathsCount = paths.length;
          safeData.excludedUrlPaths = paths.map((path) => sanitizePathString(String(path))).filter(Boolean);
          const filteredPathsCount = originalPathsCount - safeData.excludedUrlPaths.length;
          if (filteredPathsCount > 0) {
            debugLog.warn("Sanitize", "Some excluded URL paths were filtered during sanitization", {
              originalCount: originalPathsCount,
              filteredCount: filteredPathsCount
            });
          }
        } else if (key === "tags") {
          if (Array.isArray(value)) {
            safeData.tags = value;
            debugLog.debug("Sanitize", "Tags processed", { count: value.length });
          } else {
            debugLog.warn("Sanitize", "Tags value is not an array", { value, type: typeof value });
          }
        } else {
          const sanitizedValue = sanitizeValue(value);
          if (sanitizedValue !== null) {
            safeData[key] = sanitizedValue;
          } else {
            debugLog.warn("Sanitize", "API config value sanitized to null", { key, originalValue: value });
          }
        }
        processedKeys++;
      } else {
        filteredKeys++;
        debugLog.debug("Sanitize", "API config key not allowed", { key });
      }
    }
    debugLog.info("Sanitize", "API config sanitization completed", {
      originalKeys: originalKeys.length,
      processedKeys,
      filteredKeys,
      finalKeys: Object.keys(safeData).length
    });
  } catch (error) {
    debugLog.error("Sanitize", "API config sanitization failed", {
      error: error instanceof Error ? error.message : error
    });
    throw new Error(`API config sanitization failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
  return safeData;
};
const sanitizeMetadata = (metadata) => {
  debugLog.debug("Sanitize", "Starting metadata sanitization", { hasMetadata: metadata != null });
  if (typeof metadata !== "object" || metadata === null) {
    debugLog.debug("Sanitize", "Metadata is not an object, returning empty object", {
      metadata,
      type: typeof metadata
    });
    return {};
  }
  try {
    const originalKeys = Object.keys(metadata).length;
    const sanitized = sanitizeValue(metadata);
    const result = typeof sanitized === "object" && sanitized !== null ? sanitized : {};
    const finalKeys = Object.keys(result).length;
    debugLog.debug("Sanitize", "Metadata sanitization completed", {
      originalKeys,
      finalKeys,
      keysFiltered: originalKeys - finalKeys
    });
    return result;
  } catch (error) {
    debugLog.error("Sanitize", "Metadata sanitization failed", {
      error: error instanceof Error ? error.message : error
    });
    throw new Error(`Metadata sanitization failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};
const isOnlyPrimitiveFields = (object) => {
  if (typeof object !== "object" || object === null) {
    return false;
  }
  for (const value of Object.values(object)) {
    if (value === null || value === void 0) {
      continue;
    }
    const type = typeof value;
    if (type === "string" || type === "number" || type === "boolean") {
      continue;
    }
    if (Array.isArray(value)) {
      if (!value.every((item) => typeof item === "string")) {
        return false;
      }
      continue;
    }
    return false;
  }
  return true;
};
const isValidEventName = (eventName) => {
  if (typeof eventName !== "string") {
    return {
      valid: false,
      error: "Event name must be a string"
    };
  }
  if (eventName.length === 0) {
    return {
      valid: false,
      error: "Event name cannot be empty"
    };
  }
  if (eventName.length > MAX_CUSTOM_EVENT_NAME_LENGTH) {
    return {
      valid: false,
      error: `Event name is too long (max ${MAX_CUSTOM_EVENT_NAME_LENGTH} characters)`
    };
  }
  if (eventName.includes("<") || eventName.includes(">") || eventName.includes("&")) {
    return {
      valid: false,
      error: "Event name contains invalid characters"
    };
  }
  const reservedWords = ["constructor", "prototype", "__proto__", "eval", "function", "var", "let", "const"];
  if (reservedWords.includes(eventName.toLowerCase())) {
    return {
      valid: false,
      error: "Event name cannot be a reserved word"
    };
  }
  return { valid: true };
};
const isValidMetadata = (eventName, metadata, type) => {
  const sanitizedMetadata = sanitizeMetadata(metadata);
  const intro = `${type} "${eventName}" metadata error`;
  if (!isOnlyPrimitiveFields(sanitizedMetadata)) {
    return {
      valid: false,
      error: `${intro}: object has invalid types. Valid types are string, number, boolean or string arrays.`
    };
  }
  let jsonString;
  try {
    jsonString = JSON.stringify(sanitizedMetadata);
  } catch {
    return {
      valid: false,
      error: `${intro}: object contains circular references or cannot be serialized.`
    };
  }
  if (jsonString.length > MAX_CUSTOM_EVENT_STRING_SIZE) {
    return {
      valid: false,
      error: `${intro}: object is too large (max ${MAX_CUSTOM_EVENT_STRING_SIZE / 1024} KB).`
    };
  }
  const keyCount = Object.keys(sanitizedMetadata).length;
  if (keyCount > MAX_CUSTOM_EVENT_KEYS) {
    return {
      valid: false,
      error: `${intro}: object has too many keys (max ${MAX_CUSTOM_EVENT_KEYS} keys).`
    };
  }
  for (const [key, value] of Object.entries(sanitizedMetadata)) {
    if (Array.isArray(value)) {
      if (value.length > MAX_CUSTOM_EVENT_ARRAY_SIZE) {
        return {
          valid: false,
          error: `${intro}: array property "${key}" is too large (max ${MAX_CUSTOM_EVENT_ARRAY_SIZE} items).`
        };
      }
      for (const item of value) {
        if (typeof item === "string" && item.length > 500) {
          return {
            valid: false,
            error: `${intro}: array property "${key}" contains strings that are too long (max 500 characters).`
          };
        }
      }
    }
    if (typeof value === "string" && value.length > MAX_STRING_LENGTH) {
      return {
        valid: false,
        error: `${intro}: property "${key}" is too long (max ${MAX_STRING_LENGTH} characters).`
      };
    }
  }
  return {
    valid: true,
    sanitizedMetadata
  };
};
const isEventValid = (eventName, metadata) => {
  const nameValidation = isValidEventName(eventName);
  if (!nameValidation.valid) {
    debugLog.clientError("EventValidation", "Event name validation failed", { eventName, error: nameValidation.error });
    return nameValidation;
  }
  if (!metadata) {
    return { valid: true };
  }
  const metadataValidation = isValidMetadata(eventName, metadata, "customEvent");
  if (!metadataValidation.valid) {
    debugLog.clientError("EventValidation", "Event metadata validation failed", {
      eventName,
      error: metadataValidation.error
    });
  }
  return metadataValidation;
};
const isValidUrl = (url, allowHttp = false) => {
  try {
    const parsed = new URL(url);
    const isHttps = parsed.protocol === "https:";
    const isHttp = parsed.protocol === "http:";
    return isHttps || allowHttp && isHttp;
  } catch {
    return false;
  }
};
const getApiUrl = (id, allowHttp = false) => {
  debugLog.debug("URLUtils", "Generating API URL", { projectId: id, allowHttp });
  const url = new URL(window.location.href);
  const host = url.hostname;
  const parts = host.split(".");
  if (parts.length === 0) {
    debugLog.clientError("URLUtils", "Invalid hostname - no domain parts found", { hostname: host });
    throw new Error("Invalid URL");
  }
  const cleanDomain = parts.slice(-2).join(".");
  const protocol = allowHttp && url.protocol === "http:" ? "http" : "https";
  const apiUrl = `${protocol}://${id}.${cleanDomain}`;
  debugLog.debug("URLUtils", "Generated API URL", {
    originalUrl: window.location.href,
    hostname: host,
    domainParts: parts.length,
    cleanDomain,
    protocol,
    generatedUrl: apiUrl
  });
  const isValid = isValidUrl(apiUrl, allowHttp);
  if (!isValid) {
    debugLog.clientError("URLUtils", "Generated API URL failed validation", {
      apiUrl,
      allowHttp
    });
    throw new Error("Invalid URL");
  }
  debugLog.debug("URLUtils", "API URL generation completed successfully", { apiUrl });
  return apiUrl;
};
const normalizeUrl = (url, sensitiveQueryParams = []) => {
  debugLog.debug("URLUtils", "Normalizing URL", {
    urlLength: url.length,
    sensitiveParamsCount: sensitiveQueryParams.length
  });
  try {
    const urlObject = new URL(url);
    const searchParams = urlObject.searchParams;
    const originalParamCount = Array.from(searchParams.keys()).length;
    let hasChanged = false;
    const removedParams = [];
    sensitiveQueryParams.forEach((param) => {
      if (searchParams.has(param)) {
        searchParams.delete(param);
        hasChanged = true;
        removedParams.push(param);
      }
    });
    if (hasChanged) {
      debugLog.debug("URLUtils", "Sensitive parameters removed from URL", {
        removedParams,
        originalParamCount,
        finalParamCount: Array.from(searchParams.keys()).length
      });
    }
    if (!hasChanged && url.includes("?")) {
      debugLog.debug("URLUtils", "URL normalization - no changes needed");
      return url;
    }
    urlObject.search = searchParams.toString();
    const result = urlObject.toString();
    debugLog.debug("URLUtils", "URL normalization completed", {
      hasChanged,
      originalLength: url.length,
      normalizedLength: result.length
    });
    return result;
  } catch (error) {
    debugLog.warn("URLUtils", "URL normalization failed, returning original", {
      url: url.slice(0, 100),
      error: error instanceof Error ? error.message : error
    });
    return url;
  }
};
const isUrlPathExcluded = (url, excludedPaths = []) => {
  debugLog.debug("URLUtils", "Checking if URL path is excluded", {
    urlLength: url.length,
    excludedPathsCount: excludedPaths.length
  });
  if (excludedPaths.length === 0) {
    debugLog.debug("URLUtils", "No excluded paths configured");
    return false;
  }
  let path;
  try {
    path = new URL(url, window.location.origin).pathname;
    debugLog.debug("URLUtils", "Extracted path from URL", { path });
  } catch (error) {
    debugLog.warn("URLUtils", "Failed to parse URL for path exclusion check", {
      url: url.slice(0, 100),
      error: error instanceof Error ? error.message : error
    });
    return false;
  }
  const isRegularExpression = (value) => typeof value === "object" && value !== void 0 && typeof value.test === "function";
  const escapeRegexString = (string_) => string_.replaceAll(/[$()*+.?[\\\]^{|}]/g, "\\$&");
  const wildcardToRegex = (string_) => new RegExp(
    "^" + string_.split("*").map((element) => escapeRegexString(element)).join(".+") + "$"
  );
  const matchedPattern = excludedPaths.find((pattern) => {
    try {
      if (isRegularExpression(pattern)) {
        const matches2 = pattern.test(path);
        if (matches2) {
          debugLog.debug("URLUtils", "Path matched regex pattern", { path, pattern: pattern.toString() });
        }
        return matches2;
      }
      if (pattern.includes("*")) {
        const regex = wildcardToRegex(pattern);
        const matches2 = regex.test(path);
        if (matches2) {
          debugLog.debug("URLUtils", "Path matched wildcard pattern", { path, pattern, regex: regex.toString() });
        }
        return matches2;
      }
      const matches = pattern === path;
      if (matches) {
        debugLog.debug("URLUtils", "Path matched exact pattern", { path, pattern });
      }
      return matches;
    } catch (error) {
      debugLog.warn("URLUtils", "Error testing exclusion pattern", {
        pattern,
        path,
        error: error instanceof Error ? error.message : error
      });
      return false;
    }
  });
  const isExcluded = !!matchedPattern;
  debugLog.debug("URLUtils", "URL path exclusion check completed", {
    path,
    isExcluded,
    matchedPattern: matchedPattern ?? null,
    totalPatternsChecked: excludedPaths.length
  });
  return isExcluded;
};
async function fetchWithTimeout(url, options = {}) {
  const { timeout = 1e4, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}
class ApiManager {
  getUrl(id, allowHttp = false) {
    if (id.startsWith(SpecialProjectId.Localhost)) {
      const url2 = `http://${id}`;
      if (!isValidUrl(url2, true)) {
        throw new Error("Invalid URL");
      }
      return url2;
    }
    const url = getApiUrl(id, allowHttp);
    if (!isValidUrl(url, allowHttp)) {
      throw new Error("Invalid URL");
    }
    return url;
  }
}
class ConfigManager {
  // Allowed origins for local development and production
  ALLOWED_ORIGINS = [
    // Development origins
    "http://localhost:3000",
    "http://localhost:3002",
    "http://localhost:5173",
    "http://localhost:8080",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3002",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8080"
  ];
  ALLOWED_ORIGIN_PATTERNS = [/^https:\/\/.*\.tracelog\.app$/, /^https:\/\/.*\.tracelog\.dev$/];
  async get(apiUrl, appConfig) {
    if (appConfig.id === SpecialProjectId.Skip) {
      debugLog.debug("ConfigManager", "Using special project id: skip");
      return this.getDefaultConfig(appConfig);
    }
    debugLog.debug("ConfigManager", "Loading config from API", { apiUrl, projectId: appConfig.id });
    const isLocalhostMode = appConfig.id.startsWith(SpecialProjectId.Localhost);
    const config = await this.load(apiUrl, appConfig, isLocalhostMode);
    debugLog.info("ConfigManager", "Config loaded successfully", {
      projectId: appConfig.id,
      mode: config.mode,
      hasExcludedPaths: !!config.excludedUrlPaths?.length,
      hasGlobalMetadata: !!config.globalMetadata
    });
    return config;
  }
  async load(apiUrl, appConfig, useLocalhost) {
    try {
      let configUrl;
      const headers = { "Content-Type": "application/json" };
      if (useLocalhost) {
        this.validateLocalhostId(appConfig.id);
        const origin = this.extractOriginFromProjectId(appConfig.id);
        configUrl = `${origin}/config`;
        if (!isValidUrl(configUrl, true)) {
          debugLog.clientError("ConfigManager", "Invalid config URL constructed", { configUrl });
          throw new Error("Config URL is not valid or not allowed");
        }
        if (!this.isAllowedOrigin(origin, appConfig.id)) {
          debugLog.clientError("ConfigManager", "Untrusted origin detected", {
            origin,
            projectId: appConfig.id
          });
          throw new Error(
            `Security: Origin '${origin}' is not allowed to load configuration. Please use an authorized domain.`
          );
        }
        headers["X-TraceLog-Project"] = appConfig.id;
        debugLog.debug("ConfigManager", "Using local server with validated origin", {
          origin,
          projectId: appConfig.id
        });
      } else {
        configUrl = this.getUrl(apiUrl);
      }
      if (!configUrl) {
        throw new Error("Config URL is not valid or not allowed");
      }
      const response = await fetchWithTimeout(configUrl, {
        method: "GET",
        headers,
        timeout: 1e4
        // 10 segundos timeout
      });
      if (!response.ok) {
        const error = `HTTP ${response.status}: ${response.statusText}`;
        debugLog.error("ConfigManager", "Config API request failed", {
          status: response.status,
          statusText: response.statusText,
          configUrl
        });
        throw new Error(error);
      }
      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        debugLog.clientError("ConfigManager", "Invalid response content-type", {
          contentType,
          configUrl
        });
        throw new Error(`Security: Invalid response content-type. Expected application/json, got ${contentType}`);
      }
      const rawData = await response.json();
      if (rawData === void 0 || rawData === null || typeof rawData !== "object" || Array.isArray(rawData)) {
        debugLog.error("ConfigManager", "Invalid config API response format", {
          responseType: typeof rawData,
          isArray: Array.isArray(rawData)
        });
        throw new Error("Invalid config API response: expected object");
      }
      const safeApiConfig = sanitizeApiConfig(rawData);
      const apiConfig = { ...DEFAULT_API_CONFIG, ...safeApiConfig };
      const mergedConfig = { ...apiConfig, ...appConfig };
      const urlParameters = new URLSearchParams(window.location.search);
      const isQaMode = urlParameters.get("qaMode") === "true";
      if (isQaMode && !mergedConfig.mode) {
        mergedConfig.mode = Mode.QA;
        debugLog.info("ConfigManager", "QA mode enabled via URL parameter");
      }
      const errorSampling = Object.values(Mode).includes(mergedConfig.mode) ? 1 : mergedConfig.errorSampling ?? 0.1;
      const finalConfig = { ...mergedConfig, errorSampling };
      return finalConfig;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      debugLog.error("ConfigManager", "Failed to load config", { error: errorMessage, apiUrl });
      throw new Error(`Failed to load config: ${errorMessage}`);
    }
  }
  getUrl(apiUrl) {
    const urlParameters = new URLSearchParams(window.location.search);
    const isQaMode = urlParameters.get("qaMode") === "true";
    let configUrl = `${apiUrl}/config`;
    if (isQaMode) {
      configUrl += "?qaMode=true";
    }
    if (!isValidUrl(configUrl)) {
      debugLog.clientError("ConfigManager", "Invalid config URL provided", { configUrl });
      throw new Error("Config URL is not valid or not allowed");
    }
    return configUrl;
  }
  /**
   * Validates if an origin is allowed to load configuration
   * @param origin - The origin to validate (e.g., 'http://localhost:3000')
   * @param projectId - The project ID for logging purposes
   * @returns True if the origin is allowed, false otherwise
   */
  isAllowedOrigin(origin, projectId) {
    if (this.ALLOWED_ORIGINS.includes(origin)) {
      debugLog.debug("ConfigManager", "Origin validated via exact match", { origin, projectId });
      return true;
    }
    const matchesPattern = this.ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin));
    if (matchesPattern) {
      debugLog.debug("ConfigManager", "Origin validated via pattern match", { origin, projectId });
      return true;
    }
    debugLog.clientError("ConfigManager", "Origin validation failed", {
      origin,
      projectId,
      allowedOrigins: this.ALLOWED_ORIGINS
    });
    return false;
  }
  extractOriginFromProjectId(id) {
    return `http://${id}`;
  }
  validateLocalhostId(id) {
    const pattern = /^localhost:\d{1,5}$/;
    if (!pattern.test(id)) {
      debugLog.clientError("ConfigManager", "Invalid localhost project ID format", {
        projectId: id,
        expectedFormat: "localhost:PORT"
      });
      throw new Error(`Invalid localhost format. Expected 'localhost:PORT', got '${id}'`);
    }
    const portString = id.split(":")[1];
    if (!portString) {
      throw new Error(`Invalid localhost format. Port is required, got '${id}'`);
    }
    const port = parseInt(portString, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      throw new Error(`Invalid port number. Port must be between 1 and 65535, got ${portString}`);
    }
  }
  getDefaultConfig(appConfig) {
    return DEFAULT_CONFIG({
      ...appConfig,
      errorSampling: 1,
      ...appConfig.id === SpecialProjectId.Skip && { mode: Mode.DEBUG }
    });
  }
}
class SenderManager extends StateManager {
  storeManager;
  memoryFallbackStorage = /* @__PURE__ */ new Map();
  retryBackoffManager;
  retryTimeoutId = null;
  retryCount = 0;
  isRetrying = false;
  constructor(storeManager) {
    super();
    this.storeManager = storeManager;
    this.retryBackoffManager = new BackoffManager(BACKOFF_CONFIGS.RETRY, "SenderManager-Retry");
  }
  getQueueStorageKey() {
    const key = `${QUEUE_KEY(this.get("config")?.id)}:${this.get("userId")}`;
    return key;
  }
  async sendEventsQueueAsync(body) {
    if (this.shouldSkipSend()) {
      this.logQueue(body);
      return true;
    }
    const persistResult = await this.persistWithFallback(body);
    if (!persistResult.success) {
      const immediateSuccess = await this.sendImmediate(body);
      if (!immediateSuccess) {
        return false;
      }
      return true;
    }
    const success = await this.send(body);
    if (success) {
      this.clearPersistedEvents();
      this.resetRetryState();
    } else {
      this.scheduleRetry(body);
    }
    return success;
  }
  sendEventsQueueSync(body) {
    if (this.shouldSkipSend()) {
      this.logQueue(body);
      return true;
    }
    const success = this.sendQueueSyncInternal(body);
    if (success) {
      this.clearPersistedEvents();
      this.resetRetryState();
    }
    return success;
  }
  async sendEventsQueue(body, callbacks) {
    if (this.shouldSkipSend()) {
      this.logQueue(body);
      return true;
    }
    const persistResult = await this.persistWithFallback(body);
    if (!persistResult.success) {
      debugLog.error("SenderManager", "All persistence methods failed", {
        primaryError: persistResult.primaryError,
        fallbackError: persistResult.fallbackError,
        eventCount: body.events.length
      });
      const immediateSuccess = await this.sendImmediate(body);
      if (!immediateSuccess) {
        callbacks?.onFailure?.();
        return false;
      }
      callbacks?.onSuccess?.();
      return true;
    }
    const success = await this.send(body);
    if (success) {
      this.clearPersistedEvents();
      this.resetRetryState();
      callbacks?.onSuccess?.();
    } else {
      this.scheduleRetry(body, callbacks);
      callbacks?.onFailure?.();
    }
    return success;
  }
  async recoverPersistedEvents(callbacks) {
    try {
      const persistedData = this.getPersistedData();
      if (!persistedData || !this.isDataRecent(persistedData) || persistedData.events.length === 0) {
        this.clearPersistedEvents();
        return;
      }
      debugLog.info("SenderManager", "Persisted events recovered", {
        eventsCount: persistedData.events.length,
        sessionId: persistedData.sessionId,
        events: persistedData.events
      });
      const body = this.createRecoveryBody(persistedData);
      const success = await this.send(body);
      if (success) {
        this.clearPersistedEvents();
        this.resetRetryState();
        callbacks?.onSuccess?.(persistedData.events.length, persistedData.events);
      } else {
        this.scheduleRetry(body, callbacks);
        callbacks?.onFailure?.();
      }
    } catch (error) {
      debugLog.error("SenderManager", "Failed to recover persisted events", { error });
    }
  }
  async persistEventsForRecovery(body) {
    const result = await this.persistWithFallback(body);
    return result.success;
  }
  stop() {
    this.clearRetryTimeout();
    this.resetRetryState();
  }
  async send(body) {
    const { url, payload } = this.prepareRequest(body);
    try {
      const response = await fetchWithTimeout(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: payload,
        keepalive: true,
        credentials: "include",
        timeout: 15e3
        // 15 segundos timeout para events
      });
      return response.ok;
    } catch (error) {
      debugLog.error("SenderManager", "Send request failed", { error });
      return false;
    }
  }
  sendQueueSyncInternal(body) {
    const { url, payload } = this.prepareRequest(body);
    const blob = new Blob([payload], { type: "application/json" });
    if (this.isSendBeaconAvailable() && navigator.sendBeacon(url, blob)) {
      return true;
    }
    return this.sendSyncXHR(url, payload);
  }
  sendSyncXHR(url, payload) {
    const xhr = new XMLHttpRequest();
    try {
      xhr.open("POST", url, false);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.setRequestHeader("Origin", window.location.origin);
      xhr.setRequestHeader("Referer", window.location.href);
      xhr.withCredentials = true;
      xhr.timeout = SYNC_XHR_TIMEOUT_MS;
      xhr.send(payload);
      return xhr.status >= 200 && xhr.status < 300;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isCorsError = errorMessage.includes("CORS") || errorMessage.includes("NotSameOrigin") || errorMessage.includes("blocked");
      debugLog.warn("SenderManager", "Sync XHR failed", {
        error: errorMessage,
        isCorsError,
        status: xhr.status ?? "unknown",
        url: url.replace(/\/\/[^/]+/, "//[DOMAIN]")
      });
      return false;
    }
  }
  prepareRequest(body) {
    const url = `${this.get("apiUrl")}/collect`;
    return {
      url,
      payload: JSON.stringify(body)
    };
  }
  getPersistedData() {
    try {
      const storageKey = this.getQueueStorageKey();
      const persistedDataString = this.storeManager.getItem(storageKey);
      if (persistedDataString) {
        return JSON.parse(persistedDataString);
      }
    } catch (error) {
      debugLog.warn("SenderManager", "Failed to get persisted data from localStorage", { error });
    }
    try {
      const sessionKey = this.getQueueStorageKey() + "_session_fallback";
      const sessionDataString = sessionStorage.getItem(sessionKey);
      if (sessionDataString) {
        debugLog.info("SenderManager", "Recovering data from sessionStorage fallback");
        return JSON.parse(sessionDataString);
      }
    } catch (error) {
      debugLog.warn("SenderManager", "Failed to get persisted data from sessionStorage", { error });
    }
    try {
      const sessionId = this.get("sessionId");
      if (sessionId && this.memoryFallbackStorage.has(sessionId)) {
        const memoryData = this.memoryFallbackStorage.get(sessionId);
        if (memoryData) {
          debugLog.info("SenderManager", "Recovering data from memory fallback");
          return {
            userId: memoryData.data.user_id,
            sessionId: memoryData.data.session_id,
            device: memoryData.data.device,
            events: memoryData.data.events,
            timestamp: memoryData.timestamp,
            fallbackMode: true,
            ...memoryData.data.global_metadata && { global_metadata: memoryData.data.global_metadata }
          };
        }
      }
    } catch (error) {
      debugLog.warn("SenderManager", "Failed to get persisted data from memory fallback", { error });
    }
    return null;
  }
  isDataRecent(data) {
    const ageInHours = (Date.now() - data.timestamp) / (1e3 * 60 * 60);
    return ageInHours < EVENT_EXPIRY_HOURS;
  }
  createRecoveryBody(data) {
    return {
      user_id: data.userId,
      session_id: data.sessionId,
      device: data.device,
      events: data.events,
      ...data.global_metadata && { global_metadata: data.global_metadata }
    };
  }
  logQueue(queue) {
    debugLog.info("SenderManager", ` ⏩ Queue snapshot`, queue);
  }
  async persistWithFallback(body) {
    try {
      const primarySuccess = this.persistFailedEvents(body);
      if (primarySuccess) {
        return { success: true };
      }
    } catch (primaryError) {
      debugLog.warn("SenderManager", "Primary persistence failed", { primaryError });
    }
    try {
      const fallbackSuccess = this.persistToSessionStorage(body);
      if (fallbackSuccess) {
        debugLog.info("SenderManager", "Using sessionStorage fallback for persistence");
        return { success: true };
      }
    } catch (fallbackError) {
      debugLog.warn("SenderManager", "Fallback persistence failed", { fallbackError });
    }
    try {
      this.memoryFallbackStorage.set(body.session_id, {
        data: body,
        timestamp: Date.now(),
        retryCount: 0
      });
      debugLog.warn("SenderManager", "Using memory fallback for persistence (data will be lost on page reload)");
      return { success: true };
    } catch {
      return {
        success: false,
        primaryError: "localStorage failed",
        fallbackError: "All persistence methods failed"
      };
    }
  }
  persistToSessionStorage(body) {
    try {
      const storageKey = this.getQueueStorageKey() + "_session_fallback";
      const persistedData = {
        userId: body.user_id,
        sessionId: body.session_id,
        device: body.device,
        events: body.events,
        timestamp: Date.now(),
        fallbackMode: true,
        ...body.global_metadata && { global_metadata: body.global_metadata }
      };
      sessionStorage.setItem(storageKey, JSON.stringify(persistedData));
      return !!sessionStorage.getItem(storageKey);
    } catch (error) {
      debugLog.error("SenderManager", "SessionStorage persistence failed", { error });
      return false;
    }
  }
  async sendImmediate(body) {
    debugLog.warn("SenderManager", "Attempting immediate send as last resort");
    try {
      const success = await this.send(body);
      if (success) {
        debugLog.info("SenderManager", "Immediate send successful, events saved");
      }
      return success;
    } catch (error) {
      debugLog.error("SenderManager", "Immediate send failed", { error });
      return false;
    }
  }
  persistFailedEvents(body) {
    try {
      const persistedData = {
        userId: body.user_id,
        sessionId: body.session_id,
        device: body.device,
        events: body.events,
        timestamp: Date.now(),
        ...body.global_metadata && { global_metadata: body.global_metadata }
      };
      const storageKey = this.getQueueStorageKey();
      this.storeManager.setItem(storageKey, JSON.stringify(persistedData));
      return !!this.storeManager.getItem(storageKey);
    } catch (error) {
      debugLog.error("SenderManager", "Failed to persist events", { error });
      return false;
    }
  }
  clearPersistedEvents() {
    this.storeManager.removeItem(this.getQueueStorageKey());
    try {
      const sessionKey = this.getQueueStorageKey() + "_session_fallback";
      sessionStorage.removeItem(sessionKey);
    } catch (error) {
      debugLog.warn("SenderManager", "Failed to clear sessionStorage fallback", { error });
    }
    const sessionId = this.get("sessionId");
    if (sessionId && this.memoryFallbackStorage.has(sessionId)) {
      this.memoryFallbackStorage.delete(sessionId);
      debugLog.debug("SenderManager", "Cleared memory fallback storage", { sessionId });
    }
  }
  resetRetryState() {
    this.retryBackoffManager.reset();
    this.retryCount = 0;
    this.isRetrying = false;
    this.clearRetryTimeout();
  }
  scheduleRetry(body, originalCallbacks) {
    if (this.retryTimeoutId !== null || this.isRetrying) {
      return;
    }
    if (this.retryCount >= MAX_RETRY_ATTEMPTS) {
      this.clearPersistedEvents();
      this.resetRetryState();
      originalCallbacks?.onFailure?.();
      return;
    }
    if (this.isCircuitBreakerOpen()) {
      return;
    }
    this.retryTimeoutId = window.setTimeout(async () => {
      this.retryTimeoutId = null;
      if (this.isCircuitBreakerOpen() || this.isRetrying) {
        return;
      }
      this.retryCount++;
      this.isRetrying = true;
      const success = await this.send(body);
      this.isRetrying = false;
      if (success) {
        this.clearPersistedEvents();
        this.resetRetryState();
        originalCallbacks?.onSuccess?.();
      } else if (this.retryCount >= MAX_RETRY_ATTEMPTS) {
        this.clearPersistedEvents();
        this.resetRetryState();
        originalCallbacks?.onFailure?.();
      } else {
        this.scheduleRetry(body, originalCallbacks);
      }
    }, this.retryBackoffManager.getCurrentDelay());
    const nextRetryDelay = this.retryBackoffManager.getNextDelay();
    debugLog.debug("SenderManager", "Retry scheduled", {
      retryCount: this.retryCount,
      retryDelay: nextRetryDelay,
      eventsCount: body.events.length
    });
  }
  shouldSkipSend() {
    const config = this.get("config");
    const { id } = config || {};
    return id === SpecialProjectId.Skip;
  }
  isSendBeaconAvailable() {
    if (typeof navigator.sendBeacon !== "function") {
      return false;
    }
    return true;
  }
  clearRetryTimeout() {
    if (this.retryTimeoutId !== null) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }
  }
  isCircuitBreakerOpen() {
    return this.get("circuitBreakerOpen") === true;
  }
}
class SamplingManager extends StateManager {
  shouldSampleEvent(type, webVitals) {
    const isQaMode = this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug";
    if (isQaMode) {
      return true;
    }
    if (type === EventType.WEB_VITALS) {
      return this.isWebVitalEventSampledIn(webVitals?.type);
    }
    return this.isSampledIn();
  }
  isSampledIn() {
    const samplingRate = this.get("config").samplingRate ?? DEFAULT_SAMPLING_RATE;
    if (samplingRate >= 1) {
      return true;
    }
    if (samplingRate <= 0) {
      return false;
    }
    const userHash = this.getHash(this.get("userId"));
    const userValue = userHash % 100 / 100;
    const isSampled = userValue < samplingRate;
    return isSampled;
  }
  isWebVitalEventSampledIn(type) {
    const isLongTask = type === "LONG_TASK";
    const rate = isLongTask ? WEB_VITALS_LONG_TASK_SAMPLING : WEB_VITALS_SAMPLING;
    if (rate >= 1) return true;
    if (rate <= 0) return false;
    const seed = `${this.get("userId")}|${isLongTask ? "long_task" : "web_vitals"}`;
    const hash = this.getHash(seed);
    const value = hash % 100 / 100;
    return value < rate;
  }
  getHash(input) {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash);
  }
}
class TagsManager extends StateManager {
  getEventTagsIds(event2, deviceType) {
    switch (event2.type) {
      case EventType.PAGE_VIEW: {
        return this.checkEventTypePageView(event2, deviceType);
      }
      case EventType.CLICK: {
        return this.checkEventTypeClick(event2, deviceType);
      }
      default: {
        return [];
      }
    }
  }
  checkEventTypePageView(event2, deviceType) {
    const tags = this.get("config")?.tags?.filter((tag) => tag.triggerType === EventType.PAGE_VIEW) ?? [];
    if (tags.length === 0) {
      return [];
    }
    const matchedTagIds = [];
    for (const tag of tags) {
      const { id, logicalOperator, conditions } = tag;
      const results = [];
      for (const condition of conditions) {
        switch (condition.type) {
          case TagConditionType.URL_MATCHES: {
            results.push(this.matchUrlMatches(condition, event2.page_url));
            break;
          }
          case TagConditionType.DEVICE_TYPE: {
            results.push(this.matchDeviceType(condition, deviceType));
            break;
          }
          case TagConditionType.UTM_SOURCE: {
            results.push(this.matchUtmCondition(condition, event2.utm?.source));
            break;
          }
          case TagConditionType.UTM_MEDIUM: {
            results.push(this.matchUtmCondition(condition, event2.utm?.medium));
            break;
          }
          case TagConditionType.UTM_CAMPAIGN: {
            results.push(this.matchUtmCondition(condition, event2.utm?.campaign));
            break;
          }
        }
      }
      let isMatch = false;
      isMatch = logicalOperator === TagLogicalOperator.AND ? results.every(Boolean) : results.some(Boolean);
      if (isMatch) {
        matchedTagIds.push(id);
      }
    }
    return matchedTagIds;
  }
  checkEventTypeClick(event2, deviceType) {
    const tags = this.get("config")?.tags?.filter((tag) => tag.triggerType === EventType.CLICK) ?? [];
    if (tags.length === 0) {
      return [];
    }
    const matchedTagIds = [];
    for (const tag of tags) {
      const { id, logicalOperator, conditions } = tag;
      const results = [];
      for (const condition of conditions) {
        if (!event2.click_data) {
          results.push(false);
          continue;
        }
        const clickData = event2.click_data;
        switch (condition.type) {
          case TagConditionType.ELEMENT_MATCHES: {
            results.push(this.matchElementSelector(condition, clickData));
            break;
          }
          case TagConditionType.DEVICE_TYPE: {
            results.push(this.matchDeviceType(condition, deviceType));
            break;
          }
          case TagConditionType.URL_MATCHES: {
            results.push(this.matchUrlMatches(condition, event2.page_url));
            break;
          }
          case TagConditionType.UTM_SOURCE: {
            results.push(this.matchUtmCondition(condition, event2.utm?.source));
            break;
          }
          case TagConditionType.UTM_MEDIUM: {
            results.push(this.matchUtmCondition(condition, event2.utm?.medium));
            break;
          }
          case TagConditionType.UTM_CAMPAIGN: {
            results.push(this.matchUtmCondition(condition, event2.utm?.campaign));
            break;
          }
        }
      }
      let isMatch = false;
      isMatch = logicalOperator === TagLogicalOperator.AND ? results.every(Boolean) : results.some(Boolean);
      if (isMatch) {
        matchedTagIds.push(id);
      }
    }
    return matchedTagIds;
  }
  matchUrlMatches(condition, url) {
    if (condition.type !== TagConditionType.URL_MATCHES) {
      return false;
    }
    const targetValue = condition.value.toLowerCase();
    const targetUrl = url.toLowerCase();
    switch (condition.operator) {
      case TagConditionOperator.EQUALS: {
        return targetUrl === targetValue;
      }
      case TagConditionOperator.CONTAINS: {
        return targetUrl.includes(targetValue);
      }
      case TagConditionOperator.STARTS_WITH: {
        return targetUrl.startsWith(targetValue);
      }
      case TagConditionOperator.ENDS_WITH: {
        return targetUrl.endsWith(targetValue);
      }
      case TagConditionOperator.REGEX: {
        try {
          const regex = new RegExp(targetValue, "gi");
          return regex.test(targetUrl);
        } catch {
          return false;
        }
      }
      default: {
        return false;
      }
    }
  }
  matchDeviceType(condition, deviceType) {
    if (condition.type !== TagConditionType.DEVICE_TYPE) {
      return false;
    }
    const targetValue = condition.value.toLowerCase();
    const targetDevice = deviceType.toLowerCase();
    switch (condition.operator) {
      case TagConditionOperator.EQUALS: {
        return targetDevice === targetValue;
      }
      case TagConditionOperator.CONTAINS: {
        return targetDevice.includes(targetValue);
      }
      case TagConditionOperator.STARTS_WITH: {
        return targetDevice.startsWith(targetValue);
      }
      case TagConditionOperator.ENDS_WITH: {
        return targetDevice.endsWith(targetValue);
      }
      case TagConditionOperator.REGEX: {
        try {
          const regex = new RegExp(targetValue, "gi");
          return regex.test(targetDevice);
        } catch {
          return false;
        }
      }
      default: {
        return false;
      }
    }
  }
  matchElementSelector(condition, clickData) {
    if (condition.type !== TagConditionType.ELEMENT_MATCHES) {
      return false;
    }
    const elementData = [
      clickData.id ?? "",
      clickData.class ?? "",
      clickData.tag ?? "",
      clickData.text ?? "",
      clickData.href ?? "",
      clickData.title ?? "",
      clickData.alt ?? "",
      clickData.role ?? "",
      clickData.ariaLabel ?? "",
      ...Object.values(clickData.dataAttributes ?? {})
    ].join(" ");
    const targetValue = condition.value.toLowerCase();
    const targetElementData = elementData.toLowerCase();
    switch (condition.operator) {
      case TagConditionOperator.EQUALS: {
        return this.checkElementFieldEquals(clickData, targetValue);
      }
      case TagConditionOperator.CONTAINS: {
        return targetElementData.includes(targetValue);
      }
      case TagConditionOperator.STARTS_WITH: {
        return targetElementData.startsWith(targetValue);
      }
      case TagConditionOperator.ENDS_WITH: {
        return targetElementData.endsWith(targetValue);
      }
      case TagConditionOperator.REGEX: {
        try {
          const regex = new RegExp(targetValue, "gi");
          return regex.test(targetElementData);
        } catch {
          return false;
        }
      }
      default: {
        return false;
      }
    }
  }
  matchUtmCondition(condition, utmValue) {
    if (![TagConditionType.UTM_SOURCE, TagConditionType.UTM_MEDIUM, TagConditionType.UTM_CAMPAIGN].includes(
      condition.type
    )) {
      return false;
    }
    const value = utmValue ?? "";
    const targetValue = condition.value.toLowerCase();
    const targetUtmValue = value.toLowerCase();
    switch (condition.operator) {
      case TagConditionOperator.EQUALS: {
        return targetUtmValue === targetValue;
      }
      case TagConditionOperator.CONTAINS: {
        return targetUtmValue.includes(targetValue);
      }
      case TagConditionOperator.STARTS_WITH: {
        return targetUtmValue.startsWith(targetValue);
      }
      case TagConditionOperator.ENDS_WITH: {
        return targetUtmValue.endsWith(targetValue);
      }
      case TagConditionOperator.REGEX: {
        try {
          const regex = new RegExp(targetValue, "gi");
          return regex.test(targetUtmValue);
        } catch {
          return false;
        }
      }
      default: {
        return false;
      }
    }
  }
  checkElementFieldEquals(clickData, targetValue) {
    const fields = [
      clickData.id,
      clickData.class,
      clickData.tag,
      clickData.text,
      clickData.href,
      clickData.title,
      clickData.alt,
      clickData.role,
      clickData.ariaLabel
    ];
    for (const field of fields) {
      if (field) {
        const fieldValue = field.toLowerCase();
        const target = targetValue.toLowerCase();
        if (fieldValue === target) {
          return true;
        }
      }
    }
    if (clickData.dataAttributes) {
      for (const dataValue of Object.values(clickData.dataAttributes)) {
        const fieldValue = dataValue.toLowerCase();
        const target = targetValue.toLowerCase();
        if (fieldValue === target) {
          return true;
        }
      }
    }
    return false;
  }
}
class EventManager extends StateManager {
  googleAnalytics;
  samplingManager;
  tagsManager;
  dataSender;
  eventsQueue = [];
  lastEvent = null;
  eventsQueueIntervalId = null;
  intervalActive = false;
  // Circuit breaker properties
  failureCount = 0;
  MAX_FAILURES = CIRCUIT_BREAKER_CONSTANTS.MAX_FAILURES;
  circuitOpen = false;
  circuitOpenTime = 0;
  backoffManager;
  circuitResetTimeoutId = null;
  isSending = false;
  circuitRecoveryAttempts = 0;
  MAX_RECOVERY_ATTEMPTS = 5;
  // Event deduplication properties
  eventFingerprints = /* @__PURE__ */ new Map();
  lastFingerprintCleanup = Date.now();
  // Circuit breaker health monitoring
  circuitBreakerHealthCheckInterval = null;
  // Enhanced error recovery statistics
  errorRecoveryStats = {
    circuitBreakerResets: 0,
    persistenceFailures: 0,
    networkTimeouts: 0,
    lastRecoveryAttempt: 0
  };
  constructor(storeManager, googleAnalytics = null) {
    super();
    this.googleAnalytics = googleAnalytics;
    this.samplingManager = new SamplingManager();
    this.tagsManager = new TagsManager();
    this.dataSender = new SenderManager(storeManager);
    this.backoffManager = new BackoffManager(BACKOFF_CONFIGS.CIRCUIT_BREAKER, "EventManager-CircuitBreaker");
    this.set("circuitBreakerOpen", false);
    this.setupCircuitBreakerHealthCheck();
    debugLog.debug("EventManager", "EventManager initialized", {
      hasGoogleAnalytics: !!googleAnalytics
    });
  }
  /**
   * Recovers persisted events from localStorage with enhanced error tracking
   * Should be called after initialization to recover any events that failed to send
   */
  async recoverPersistedEvents() {
    await this.dataSender.recoverPersistedEvents({
      onSuccess: (eventCount, recoveredEvents) => {
        this.failureCount = 0;
        this.backoffManager.reset();
        if (recoveredEvents && recoveredEvents.length > 0) {
          const eventIds = recoveredEvents.map((e) => e.timestamp + "_" + e.type);
          this.removeProcessedEvents(eventIds);
          debugLog.debug("EventManager", "Removed recovered events from in-memory queue", {
            removedCount: recoveredEvents.length,
            remainingQueueLength: this.eventsQueue.length
          });
        }
        debugLog.info("EventManager", "Persisted events recovered successfully", {
          eventCount: eventCount || 0,
          recoveryStats: this.errorRecoveryStats
        });
      },
      onFailure: async () => {
        this.errorRecoveryStats.persistenceFailures++;
        debugLog.warn("EventManager", "Failed to recover persisted events", {
          persistenceFailures: this.errorRecoveryStats.persistenceFailures
        });
      }
    });
  }
  track({
    type,
    page_url,
    from_page_url,
    scroll_data,
    click_data,
    custom_event,
    web_vitals,
    session_end_reason,
    session_start_recovered
  }) {
    if (this.circuitOpen) {
      debugLog.debug("EventManager", "Event dropped - circuit breaker is open", { type });
      return;
    }
    this.manageFingerprintMemory();
    if (!this.samplingManager.shouldSampleEvent(type, web_vitals)) {
      debugLog.debug("EventManager", "Event filtered by sampling", { type, samplingActive: true });
      return;
    }
    const isDuplicatedEvent = this.isDuplicatedEvent({
      type,
      page_url,
      scroll_data,
      click_data,
      custom_event,
      web_vitals,
      session_end_reason,
      session_start_recovered
    });
    if (isDuplicatedEvent) {
      const now = Date.now();
      if (this.eventsQueue && this.eventsQueue.length > 0) {
        const lastEvent = this.eventsQueue.at(-1);
        if (lastEvent) {
          lastEvent.timestamp = now;
        }
      }
      if (this.lastEvent) {
        this.lastEvent.timestamp = now;
      }
      debugLog.debug("EventManager", "Duplicate event detected, timestamp updated", {
        type,
        queueLength: this.eventsQueue.length
      });
      return;
    }
    const effectivePageUrl = page_url || this.get("pageUrl");
    const isRouteExcluded = isUrlPathExcluded(effectivePageUrl, this.get("config").excludedUrlPaths);
    const hasStartSession = this.get("hasStartSession");
    const isSessionEndEvent = type == EventType.SESSION_END;
    if (isRouteExcluded && (!isSessionEndEvent || isSessionEndEvent && !hasStartSession)) {
      if (this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug") {
        debugLog.debug("EventManager", `Event ${type} on excluded route: ${page_url}`);
      }
      return;
    }
    const isSessionStartEvent = type === EventType.SESSION_START;
    if (isSessionStartEvent) {
      this.set("hasStartSession", true);
    }
    const utmParams = isSessionStartEvent ? getUTMParameters() : void 0;
    const payload = {
      type,
      page_url: isRouteExcluded ? "excluded" : effectivePageUrl,
      timestamp: Date.now(),
      ...isSessionStartEvent && { referrer: document.referrer || "Direct" },
      ...from_page_url && !isRouteExcluded ? { from_page_url } : {},
      ...scroll_data && { scroll_data },
      ...click_data && { click_data },
      ...custom_event && { custom_event },
      ...utmParams && { utm: utmParams },
      ...web_vitals && { web_vitals },
      ...session_end_reason && { session_end_reason },
      ...session_start_recovered && { session_start_recovered }
    };
    if (this.get("config")?.tags?.length) {
      const matchedTags = this.tagsManager.getEventTagsIds(payload, this.get("device"));
      if (matchedTags?.length) {
        payload.tags = this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug" ? matchedTags.map((id) => ({
          id,
          key: this.get("config")?.tags?.find((t) => t.id === id)?.key ?? ""
        })) : matchedTags;
      }
    }
    this.lastEvent = payload;
    this.processAndSend(payload);
  }
  stop() {
    if (this.eventsQueueIntervalId) {
      clearInterval(this.eventsQueueIntervalId);
      this.eventsQueueIntervalId = null;
      this.intervalActive = false;
    }
    if (this.circuitResetTimeoutId) {
      clearTimeout(this.circuitResetTimeoutId);
      this.circuitResetTimeoutId = null;
    }
    if (this.circuitBreakerHealthCheckInterval) {
      clearInterval(this.circuitBreakerHealthCheckInterval);
      this.circuitBreakerHealthCheckInterval = null;
    }
    this.eventFingerprints.clear();
    this.lastFingerprintCleanup = Date.now();
    this.circuitOpen = false;
    this.circuitOpenTime = 0;
    this.failureCount = 0;
    this.backoffManager.reset();
    this.lastEvent = null;
    this.errorRecoveryStats.circuitBreakerResets = 0;
    this.errorRecoveryStats.persistenceFailures = 0;
    this.errorRecoveryStats.networkTimeouts = 0;
    this.errorRecoveryStats.lastRecoveryAttempt = 0;
    this.circuitRecoveryAttempts = 0;
    this.dataSender.stop();
    debugLog.debug("EventManager", "EventManager stopped and all intervals cleaned up");
  }
  processAndSend(payload) {
    if (this.get("config").ipExcluded) {
      return;
    }
    this.eventsQueue.push(payload);
    if (this.eventsQueue.length > MAX_EVENTS_QUEUE_LENGTH) {
      const removedEvent = this.eventsQueue.shift();
      debugLog.warn("EventManager", "Event queue overflow, oldest event removed", {
        maxLength: MAX_EVENTS_QUEUE_LENGTH,
        currentLength: this.eventsQueue.length,
        removedEventType: removedEvent?.type
      });
    }
    debugLog.info("EventManager", `📥 Event captured: ${payload.type}`, payload);
    if (!this.eventsQueueIntervalId) {
      this.initEventsQueueInterval();
    }
    if (this.googleAnalytics && payload.type === EventType.CUSTOM) {
      const customEvent = payload.custom_event;
      this.trackGoogleAnalyticsEvent(customEvent);
    }
  }
  trackGoogleAnalyticsEvent(customEvent) {
    if (this.get("config").mode === "qa" || this.get("config").mode === "debug") {
      debugLog.debug("EventManager", `Google Analytics event: ${JSON.stringify(customEvent)}`);
    } else if (this.googleAnalytics) {
      this.googleAnalytics.trackEvent(customEvent.name, customEvent.metadata ?? {});
    }
  }
  initEventsQueueInterval() {
    if (this.eventsQueueIntervalId || this.intervalActive) {
      return;
    }
    const isTestEnv = this.get("config")?.id === "test" || this.get("config")?.mode === "debug";
    const interval = isTestEnv ? EVENT_SENT_INTERVAL_TEST_MS : EVENT_SENT_INTERVAL_MS;
    this.eventsQueueIntervalId = window.setInterval(() => {
      if (this.eventsQueue.length > 0 || this.circuitOpen) {
        this.sendEventsQueue();
      }
    }, interval);
    this.intervalActive = true;
  }
  async flushImmediately() {
    if (this.eventsQueue.length === 0) {
      return true;
    }
    const body = this.buildEventsPayload();
    const eventsToSend = [...this.eventsQueue];
    const eventIds = eventsToSend.map((e) => e.timestamp + "_" + e.type);
    const success = await this.dataSender.sendEventsQueueAsync(body);
    if (success) {
      this.removeProcessedEvents(eventIds);
      this.clearQueueInterval();
      debugLog.info("EventManager", "Flush immediately successful", {
        eventCount: eventsToSend.length,
        remainingQueueLength: this.eventsQueue.length
      });
    } else {
      debugLog.warn("EventManager", "Flush immediately failed, keeping events in queue", {
        eventCount: eventsToSend.length
      });
    }
    return success;
  }
  flushImmediatelySync() {
    if (this.eventsQueue.length === 0) {
      return true;
    }
    const body = this.buildEventsPayload();
    const eventsToSend = [...this.eventsQueue];
    const eventIds = eventsToSend.map((e) => e.timestamp + "_" + e.type);
    const success = this.dataSender.sendEventsQueueSync(body);
    if (success) {
      this.removeProcessedEvents(eventIds);
      this.clearQueueInterval();
      debugLog.info("EventManager", "Flush immediately sync successful", {
        eventCount: eventsToSend.length,
        remainingQueueLength: this.eventsQueue.length
      });
    } else {
      debugLog.warn("EventManager", "Flush immediately sync failed, keeping events in queue", {
        eventCount: eventsToSend.length
      });
    }
    return success;
  }
  getQueueLength() {
    return this.eventsQueue.length;
  }
  /**
   * Gets current error recovery statistics for monitoring purposes
   */
  getRecoveryStats() {
    return {
      ...this.errorRecoveryStats,
      currentFailureCount: this.failureCount,
      circuitBreakerOpen: this.circuitOpen,
      fingerprintMapSize: this.eventFingerprints.size
    };
  }
  async sendEventsQueue() {
    if (this.isSending) {
      debugLog.debug("EventManager", "Send already in progress, skipping");
      return;
    }
    if (!this.get("sessionId")) {
      debugLog.debug("EventManager", "No session ID available, skipping send");
      return;
    }
    if (this.eventsQueue.length === 0 && !this.circuitOpen) {
      return;
    }
    if (this.circuitOpen) {
      const timeSinceOpen = Date.now() - this.circuitOpenTime;
      if (timeSinceOpen >= CIRCUIT_BREAKER_CONSTANTS.RECOVERY_TIME_MS) {
        if (this.circuitRecoveryAttempts >= this.MAX_RECOVERY_ATTEMPTS) {
          debugLog.error("EventManager", "Circuit breaker permanently opened after max recovery attempts", {
            attempts: this.circuitRecoveryAttempts,
            maxAttempts: this.MAX_RECOVERY_ATTEMPTS
          });
          this.notifyCircuitBreakerPermanentFailure();
          return;
        }
        this.circuitRecoveryAttempts++;
        const recoverySuccess = await this.handleCircuitBreakerRecovery();
        if (!recoverySuccess) {
          this.scheduleCircuitBreakerRetry();
          return;
        }
        this.circuitRecoveryAttempts = 0;
      } else {
        debugLog.debug("EventManager", "Circuit breaker is open - skipping event sending", {
          queueLength: this.eventsQueue.length,
          failureCount: this.failureCount,
          timeSinceOpen,
          recoveryTime: CIRCUIT_BREAKER_CONSTANTS.RECOVERY_TIME_MS
        });
        return;
      }
    }
    const body = this.buildEventsPayload();
    this.isSending = true;
    const eventsToSend = [...this.eventsQueue];
    const eventIds = eventsToSend.map((e) => e.timestamp + "_" + e.type);
    await this.dataSender.sendEventsQueue(body, {
      onSuccess: () => {
        this.failureCount = 0;
        this.backoffManager.reset();
        this.removeProcessedEvents(eventIds);
        debugLog.info("EventManager", "Events sent successfully", {
          eventCount: eventsToSend.length,
          remainingQueueLength: this.eventsQueue.length
        });
      },
      onFailure: async () => {
        this.failureCount++;
        debugLog.warn("EventManager", "Events send failed, keeping in queue", {
          eventCount: eventsToSend.length,
          failureCount: this.failureCount,
          networkTimeouts: this.errorRecoveryStats.networkTimeouts
        });
        if (this.failureCount >= Math.floor(this.MAX_FAILURES / 2)) {
          await this.attemptSystemRecovery();
        }
        if (this.failureCount >= this.MAX_FAILURES) {
          await this.openCircuitBreaker();
        }
      }
    });
    this.isSending = false;
  }
  buildEventsPayload() {
    const uniqueEvents = /* @__PURE__ */ new Map();
    for (const event2 of this.eventsQueue) {
      let key = `${event2.type}_${event2.page_url}`;
      if (event2.click_data) {
        key += `_${event2.click_data.x}_${event2.click_data.y}`;
      }
      if (event2.scroll_data) {
        key += `_${event2.scroll_data.depth}_${event2.scroll_data.direction}`;
      }
      if (event2.custom_event) {
        key += `_${event2.custom_event.name}`;
      }
      if (event2.web_vitals) {
        key += `_${event2.web_vitals.type}`;
      }
      if (!uniqueEvents.has(key)) {
        uniqueEvents.set(key, event2);
      }
    }
    const deduplicatedEvents = [...uniqueEvents.values()];
    deduplicatedEvents.sort((a, b) => a.timestamp - b.timestamp);
    return {
      user_id: this.get("userId"),
      session_id: this.get("sessionId"),
      device: this.get("device"),
      events: deduplicatedEvents,
      ...this.get("config")?.globalMetadata && { global_metadata: this.get("config")?.globalMetadata }
    };
  }
  clearQueueInterval() {
    if (this.eventsQueueIntervalId) {
      clearInterval(this.eventsQueueIntervalId);
      this.eventsQueueIntervalId = null;
      this.intervalActive = false;
    }
  }
  getEventFingerprint(event2) {
    const key = `${event2.type}_${event2.page_url}`;
    if (event2.click_data) {
      const x = Math.round((event2.click_data.x || 0) / CLICK_COORDINATE_PRECISION) * CLICK_COORDINATE_PRECISION;
      const y = Math.round((event2.click_data.y || 0) / CLICK_COORDINATE_PRECISION) * CLICK_COORDINATE_PRECISION;
      return `${key}_${x}_${y}_${event2.click_data.tag}_${event2.click_data.id}`;
    }
    if (event2.scroll_data) {
      return `${key}_${event2.scroll_data.depth}_${event2.scroll_data.direction}`;
    }
    if (event2.custom_event) {
      return `${key}_${event2.custom_event.name}`;
    }
    if (event2.web_vitals) {
      return `${key}_${event2.web_vitals.type}`;
    }
    if (event2.session_end_reason) {
      return `${key}_${event2.session_end_reason}`;
    }
    if (event2.session_start_recovered !== void 0) {
      return `${key}_${event2.session_start_recovered}`;
    }
    return key;
  }
  isDuplicatedEvent(event2) {
    const fingerprint = this.getEventFingerprint(event2);
    const lastTime = this.eventFingerprints.get(fingerprint) ?? 0;
    const now = Date.now();
    if (now - lastTime < DUPLICATE_EVENT_THRESHOLD_MS) {
      return true;
    }
    this.eventFingerprints.set(fingerprint, now);
    this.cleanupOldFingerprints();
    return false;
  }
  /**
   * Manages fingerprint memory with proactive and reactive cleanup strategies
   */
  manageFingerprintMemory() {
    const now = Date.now();
    const shouldCleanup = this.eventFingerprints.size > MAX_FINGERPRINTS || now - this.lastFingerprintCleanup > FINGERPRINT_CLEANUP_INTERVAL_MS || this.eventFingerprints.size > MAX_FINGERPRINTS_HARD_LIMIT;
    if (!shouldCleanup) {
      return;
    }
    if (this.eventFingerprints.size > MAX_FINGERPRINTS_HARD_LIMIT) {
      this.aggressiveFingerprintCleanup();
    } else {
      this.cleanupOldFingerprints();
    }
    this.lastFingerprintCleanup = now;
  }
  /**
   * Performs aggressive cleanup when hard limit is exceeded
   * Enhanced with recovery statistics tracking
   */
  aggressiveFingerprintCleanup() {
    const entries = Array.from(this.eventFingerprints.entries());
    const initialSize = entries.length;
    entries.sort((a, b) => a[1] - b[1]);
    const toRemove = Math.floor(entries.length * 0.5);
    for (let i = 0; i < toRemove; i++) {
      this.eventFingerprints.delete(entries[i][0]);
    }
    debugLog.warn("EventManager", "Aggressive fingerprint cleanup performed", {
      removed: toRemove,
      remaining: this.eventFingerprints.size,
      initialSize,
      trigger: "recovery_system",
      hardLimit: MAX_FINGERPRINTS_HARD_LIMIT,
      recoveryStats: this.errorRecoveryStats
    });
  }
  /**
   * Cleans up old fingerprints to prevent memory leaks
   */
  cleanupOldFingerprints() {
    if (this.eventFingerprints.size <= MAX_FINGERPRINTS) {
      return;
    }
    const now = Date.now();
    const cleanupThreshold = DUPLICATE_EVENT_THRESHOLD_MS * FINGERPRINT_CLEANUP_MULTIPLIER;
    const keysToDelete = [];
    for (const [key, timestamp] of this.eventFingerprints) {
      if (now - timestamp > cleanupThreshold) {
        keysToDelete.push(key);
      }
    }
    for (const key of keysToDelete) {
      this.eventFingerprints.delete(key);
    }
    debugLog.debug("EventManager", "Cleaned up old event fingerprints", {
      totalFingerprints: this.eventFingerprints.size + keysToDelete.length,
      cleanedCount: keysToDelete.length,
      remainingCount: this.eventFingerprints.size,
      cleanupThreshold
    });
  }
  /**
   * Sets up circuit breaker health monitoring to detect and recover from stuck states
   */
  setupCircuitBreakerHealthCheck() {
    this.circuitBreakerHealthCheckInterval = window.setInterval(async () => {
      if (this.circuitOpen) {
        const stuckTime = Date.now() - this.circuitOpenTime;
        if (stuckTime > CIRCUIT_BREAKER_MAX_STUCK_TIME_MS) {
          debugLog.warn("EventManager", "Circuit breaker appears stuck, forcing reset", {
            stuckTime,
            maxStuckTime: CIRCUIT_BREAKER_MAX_STUCK_TIME_MS,
            failureCount: this.failureCount
          });
          await this.resetCircuitBreaker();
          this.failureCount = 0;
          this.errorRecoveryStats.circuitBreakerResets++;
          await this.attemptSystemRecovery();
        }
      }
    }, CIRCUIT_BREAKER_HEALTH_CHECK_INTERVAL_MS);
  }
  /**
   * Opens the circuit breaker with time-based recovery and event persistence
   */
  async openCircuitBreaker() {
    this.circuitOpen = true;
    this.circuitOpenTime = Date.now();
    await this.set("circuitBreakerOpen", true);
    const eventsCount = this.eventsQueue.length;
    if (eventsCount > 0) {
      const body = this.buildEventsPayload();
      const persistSuccess = await this.dataSender.persistEventsForRecovery(body);
      if (persistSuccess) {
        debugLog.info("EventManager", "Events persisted before circuit breaker opened", {
          eventsCount
        });
      } else {
        debugLog.error("EventManager", "Failed to persist events before circuit breaker opened");
      }
    }
    this.eventsQueue = [];
    debugLog.warn("EventManager", "Circuit breaker opened with time-based recovery", {
      maxFailures: this.MAX_FAILURES,
      eventsCount,
      failureCount: this.failureCount,
      recoveryTime: CIRCUIT_BREAKER_CONSTANTS.RECOVERY_TIME_MS,
      openTime: this.circuitOpenTime
    });
    this.backoffManager.getNextDelay();
  }
  /**
   * Handles circuit breaker recovery attempt
   * Returns true if recovery was successful, false otherwise
   */
  async handleCircuitBreakerRecovery() {
    await this.resetCircuitBreaker();
    this.isSending = true;
    let recoverySuccess = false;
    try {
      await this.dataSender.recoverPersistedEvents({
        onSuccess: () => {
          recoverySuccess = true;
          this.failureCount = 0;
          this.backoffManager.reset();
          debugLog.info("EventManager", "Circuit breaker recovery successful");
        },
        onFailure: () => {
          recoverySuccess = false;
          debugLog.warn("EventManager", "Circuit breaker recovery failed");
        }
      });
    } catch (error) {
      recoverySuccess = false;
      debugLog.error("EventManager", "Circuit breaker recovery error", { error });
    } finally {
      this.isSending = false;
    }
    return recoverySuccess;
  }
  /**
   * Schedules circuit breaker retry with progressive backoff
   */
  scheduleCircuitBreakerRetry() {
    const nextRetryDelay = this.backoffManager.getNextDelay();
    this.circuitOpen = true;
    this.circuitOpenTime = Date.now();
    debugLog.warn("EventManager", "Circuit breaker retry scheduled", {
      nextRetryDelay,
      failureCount: this.failureCount
    });
  }
  /**
   * Resets the circuit breaker and attempts to restore persisted events
   */
  async resetCircuitBreaker() {
    this.circuitOpen = false;
    this.circuitOpenTime = 0;
    this.failureCount = 0;
    this.circuitResetTimeoutId = null;
    await this.set("circuitBreakerOpen", false);
    this.dataSender.stop();
    debugLog.info("EventManager", "Circuit breaker reset completed", {
      currentQueueLength: this.eventsQueue.length,
      backoffDelay: this.backoffManager.getCurrentDelay()
    });
  }
  /**
   * Notifies system and users that circuit breaker has permanently failed
   */
  notifyCircuitBreakerPermanentFailure() {
    debugLog.error("EventManager", "CIRCUIT BREAKER PERMANENTLY OPEN - MANUAL INTERVENTION REQUIRED", {
      attempts: this.circuitRecoveryAttempts,
      timestamp: Date.now(),
      failureCount: this.failureCount
    });
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("tracelog:circuit-breaker-failure", {
          detail: {
            attempts: this.circuitRecoveryAttempts,
            timestamp: Date.now(),
            failureCount: this.failureCount
          }
        })
      );
    }
  }
  removeProcessedEvents(eventIds) {
    const eventIdSet = new Set(eventIds);
    this.eventsQueue = this.eventsQueue.filter((event2) => {
      const eventId = event2.timestamp + "_" + event2.type;
      return !eventIdSet.has(eventId);
    });
  }
  /**
   * Determines if system recovery should be attempted based on timing constraints
   */
  shouldAttemptRecovery() {
    const now = Date.now();
    const timeSinceLastRecovery = now - this.errorRecoveryStats.lastRecoveryAttempt;
    return timeSinceLastRecovery > 6e4;
  }
  /**
   * Attempts comprehensive system recovery from various error states
   */
  async attemptSystemRecovery() {
    if (!this.shouldAttemptRecovery()) {
      return;
    }
    this.errorRecoveryStats.lastRecoveryAttempt = Date.now();
    debugLog.info("EventManager", "Attempting system recovery", {
      stats: this.errorRecoveryStats
    });
    try {
      if (this.circuitOpen) {
        const stuckTime = Date.now() - this.circuitOpenTime;
        if (stuckTime > 2 * CIRCUIT_BREAKER_CONSTANTS.RECOVERY_TIME_MS) {
          await this.resetCircuitBreaker();
          this.errorRecoveryStats.circuitBreakerResets++;
        }
      }
      await this.recoverPersistedEvents();
      this.aggressiveFingerprintCleanup();
      debugLog.info("EventManager", "System recovery completed successfully");
    } catch (error) {
      debugLog.error("EventManager", "System recovery failed", { error });
    }
  }
}
class UserManager extends StateManager {
  storageManager;
  constructor(storageManager) {
    super();
    this.storageManager = storageManager;
  }
  getId() {
    const storedUserId = this.storageManager.getItem(USER_ID_KEY(this.get("config")?.id));
    if (storedUserId) {
      return storedUserId;
    }
    const newUserId = generateUUID();
    this.storageManager.setItem(USER_ID_KEY(this.get("config")?.id), newUserId);
    return newUserId;
  }
}
class ActivityListenerManager {
  onActivity;
  options = { passive: true };
  constructor(onActivity) {
    this.onActivity = onActivity;
  }
  setup() {
    try {
      window.addEventListener("scroll", this.onActivity, this.options);
      window.addEventListener("resize", this.onActivity, this.options);
      window.addEventListener("focus", this.onActivity, this.options);
    } catch (error) {
      debugLog.error("ActivityListenerManager", "Failed to setup activity listeners", { error });
      throw error;
    }
  }
  cleanup() {
    try {
      window.removeEventListener("scroll", this.onActivity);
      window.removeEventListener("resize", this.onActivity);
      window.removeEventListener("focus", this.onActivity);
    } catch (error) {
      debugLog.warn("ActivityListenerManager", "Error during activity listeners cleanup", { error });
    }
  }
}
class TouchListenerManager {
  onActivity;
  options = { passive: true };
  motionThreshold;
  constructor(onActivity, motionThreshold) {
    this.onActivity = onActivity;
    this.motionThreshold = motionThreshold;
  }
  setup() {
    try {
      window.addEventListener("touchstart", this.onActivity, this.options);
      window.addEventListener("touchmove", this.onActivity, this.options);
      window.addEventListener("touchend", this.onActivity, this.options);
      window.addEventListener("orientationchange", this.onActivity, this.options);
      const hasDeviceMotion = "DeviceMotionEvent" in window;
      if (hasDeviceMotion) {
        window.addEventListener("devicemotion", this.handleDeviceMotion, this.options);
      }
    } catch (error) {
      debugLog.error("TouchListenerManager", "Failed to setup touch listeners", { error });
      throw error;
    }
  }
  cleanup() {
    try {
      window.removeEventListener("touchstart", this.onActivity);
      window.removeEventListener("touchmove", this.onActivity);
      window.removeEventListener("touchend", this.onActivity);
      window.removeEventListener("orientationchange", this.onActivity);
      if ("DeviceMotionEvent" in window) {
        window.removeEventListener("devicemotion", this.handleDeviceMotion);
      }
    } catch (error) {
      debugLog.warn("TouchListenerManager", "Error during touch listeners cleanup", { error });
    }
  }
  handleDeviceMotion = (event2) => {
    try {
      const acceleration = event2.acceleration;
      if (acceleration) {
        const totalAcceleration = Math.abs(acceleration.x ?? 0) + Math.abs(acceleration.y ?? 0) + Math.abs(acceleration.z ?? 0);
        if (totalAcceleration > this.motionThreshold) {
          this.onActivity();
        }
      }
    } catch (error) {
      debugLog.warn("TouchListenerManager", "Error handling device motion event", { error });
    }
  };
}
class MouseListenerManager {
  onActivity;
  options = { passive: true };
  constructor(onActivity) {
    this.onActivity = onActivity;
  }
  setup() {
    try {
      window.addEventListener("mousemove", this.onActivity, this.options);
      window.addEventListener("mousedown", this.onActivity, this.options);
      window.addEventListener("wheel", this.onActivity, this.options);
    } catch (error) {
      debugLog.error("MouseListenerManager", "Failed to setup mouse listeners", { error });
      throw error;
    }
  }
  cleanup() {
    try {
      window.removeEventListener("mousemove", this.onActivity);
      window.removeEventListener("mousedown", this.onActivity);
      window.removeEventListener("wheel", this.onActivity);
    } catch (error) {
      debugLog.warn("MouseListenerManager", "Error during mouse listeners cleanup", { error });
    }
  }
}
class KeyboardListenerManager {
  onActivity;
  options = { passive: true };
  constructor(onActivity) {
    this.onActivity = onActivity;
  }
  setup() {
    try {
      window.addEventListener("keydown", this.onActivity, this.options);
      window.addEventListener("keypress", this.onActivity, this.options);
    } catch (error) {
      debugLog.error("KeyboardListenerManager", "Failed to setup keyboard listeners", { error });
      throw error;
    }
  }
  cleanup() {
    try {
      window.removeEventListener("keydown", this.onActivity);
      window.removeEventListener("keypress", this.onActivity);
    } catch (error) {
      debugLog.warn("KeyboardListenerManager", "Error during keyboard listeners cleanup", { error });
    }
  }
}
class VisibilityListenerManager {
  onActivity;
  onVisibilityChange;
  onNetworkRestored;
  isMobile;
  options = { passive: true };
  constructor(onActivity, onVisibilityChange, isMobile, onNetworkRestored) {
    this.onActivity = onActivity;
    this.onVisibilityChange = onVisibilityChange;
    this.onNetworkRestored = onNetworkRestored;
    this.isMobile = isMobile;
  }
  setup() {
    try {
      const hasVisibilityAPI = "visibilityState" in document;
      if (hasVisibilityAPI) {
        document.addEventListener("visibilitychange", this.onVisibilityChange, this.options);
      }
      window.addEventListener("blur", this.onVisibilityChange, this.options);
      window.addEventListener("focus", this.onActivity, this.options);
      const hasNetworkAPI = "onLine" in navigator;
      if (hasNetworkAPI) {
        window.addEventListener("online", this.handleOnline, this.options);
        window.addEventListener("offline", this.onVisibilityChange, this.options);
      }
      if (this.isMobile) {
        this.setupMobileEvents();
      }
    } catch (error) {
      debugLog.error("VisibilityListenerManager", "Failed to setup visibility listeners", { error });
      throw error;
    }
  }
  cleanup() {
    try {
      if ("visibilityState" in document) {
        document.removeEventListener("visibilitychange", this.onVisibilityChange);
      }
      window.removeEventListener("blur", this.onVisibilityChange);
      window.removeEventListener("focus", this.onActivity);
      if ("onLine" in navigator) {
        window.removeEventListener("online", this.handleOnline);
        window.removeEventListener("offline", this.onVisibilityChange);
      }
      if (this.isMobile) {
        this.cleanupMobileEvents();
      }
    } catch (error) {
      debugLog.warn("VisibilityListenerManager", "Error during visibility listeners cleanup", { error });
    }
  }
  setupMobileEvents() {
    try {
      document.addEventListener("pause", this.onVisibilityChange, this.options);
      document.addEventListener("resume", this.onActivity, this.options);
      const hasOrientationAPI = "orientation" in screen;
      if (hasOrientationAPI) {
        screen.orientation.addEventListener("change", this.onActivity, this.options);
      }
      window.addEventListener("pageshow", this.onActivity, this.options);
      window.addEventListener("pagehide", this.onActivity, this.options);
    } catch (error) {
      debugLog.warn("VisibilityListenerManager", "Failed to setup mobile listeners", { error });
    }
  }
  cleanupMobileEvents() {
    try {
      document.removeEventListener("pause", this.onVisibilityChange);
      document.removeEventListener("resume", this.onActivity);
      if ("orientation" in screen) {
        screen.orientation.removeEventListener("change", this.onActivity);
      }
      window.removeEventListener("pageshow", this.onActivity);
      window.removeEventListener("pagehide", this.onActivity);
    } catch (error) {
      debugLog.warn("VisibilityListenerManager", "Error during mobile listeners cleanup", { error });
    }
  }
  handleOnline = () => {
    this.onActivity();
    this.onNetworkRestored?.();
  };
}
class UnloadListenerManager {
  onInactivity;
  options = { passive: true };
  constructor(onInactivity) {
    this.onInactivity = onInactivity;
  }
  setup() {
    try {
      window.addEventListener("beforeunload", this.onInactivity, this.options);
      window.addEventListener("pagehide", this.onInactivity, this.options);
    } catch (error) {
      debugLog.error("UnloadListenerManager", "Failed to setup unload listeners", { error });
      throw error;
    }
  }
  cleanup() {
    try {
      window.removeEventListener("beforeunload", this.onInactivity);
      window.removeEventListener("pagehide", this.onInactivity);
    } catch (error) {
      debugLog.warn("UnloadListenerManager", "Error during unload listeners cleanup", { error });
    }
  }
}
class SessionRecoveryManager extends StateManager {
  config;
  storageManager;
  eventManager;
  projectId;
  debugMode;
  constructor(storageManager, projectId, eventManager, config) {
    super();
    this.storageManager = storageManager;
    this.eventManager = eventManager ?? null;
    this.projectId = projectId;
    this.debugMode = (this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug") ?? false;
    this.config = {
      recoveryWindowMs: this.calculateRecoveryWindow(),
      maxRecoveryAttempts: MAX_SESSION_RECOVERY_ATTEMPTS,
      contextPreservation: true,
      ...config
    };
  }
  /**
   * Attempt to recover a session
   */
  attemptSessionRecovery(currentSessionId) {
    if (this.debugMode) {
      debugLog.debug("SessionRecovery", "Attempting session recovery");
    }
    const recoveryAttempts = this.getStoredRecoveryAttempts();
    const lastAttempt = this.getLastRecoveryAttempt();
    if (!this.canAttemptRecovery(lastAttempt)) {
      if (this.debugMode) {
        debugLog.debug(
          "SessionRecovery",
          "Session recovery not possible - outside recovery window or max attempts reached"
        );
      }
      return {
        recovered: false
      };
    }
    const lastSessionContext = lastAttempt?.context;
    if (!lastSessionContext) {
      if (this.debugMode) {
        debugLog.debug("SessionRecovery", "No session context available for recovery");
      }
      return {
        recovered: false
      };
    }
    const now = Date.now();
    const timeSinceLastActivity = now - lastSessionContext.lastActivity;
    if (timeSinceLastActivity > this.config.recoveryWindowMs) {
      if (this.debugMode) {
        debugLog.debug("SessionRecovery", "Session recovery failed - outside recovery window");
      }
      return {
        recovered: false
      };
    }
    const recoveredSessionId = lastSessionContext.sessionId;
    const attemptNumber = (lastAttempt?.attempt ?? 0) + 1;
    const recoveryAttempt = {
      sessionId: currentSessionId ?? recoveredSessionId,
      timestamp: now,
      attempt: attemptNumber,
      context: {
        ...lastSessionContext,
        recoveryAttempts: attemptNumber,
        lastActivity: now
      }
    };
    recoveryAttempts.push(recoveryAttempt);
    this.storeRecoveryAttempts(recoveryAttempts);
    if (this.debugMode) {
      debugLog.debug("SessionRecovery", `Session recovery successful: recovery of session ${recoveredSessionId}`);
    }
    return {
      recovered: true,
      recoveredSessionId,
      context: recoveryAttempt.context
    };
  }
  /**
   * Calculate the recovery window with bounds checking
   */
  calculateRecoveryWindow() {
    const sessionTimeout = this.get("config")?.sessionTimeout ?? DEFAULT_SESSION_TIMEOUT_MS;
    const calculatedRecoveryWindow = sessionTimeout * SESSION_RECOVERY_WINDOW_MULTIPLIER;
    const boundedRecoveryWindow = Math.max(
      Math.min(calculatedRecoveryWindow, MAX_SESSION_RECOVERY_WINDOW_MS),
      MIN_SESSION_RECOVERY_WINDOW_MS
    );
    if (this.debugMode) {
      if (calculatedRecoveryWindow > MAX_SESSION_RECOVERY_WINDOW_MS) {
        debugLog.warn(
          "SessionRecovery",
          `Recovery window capped at ${MAX_SESSION_RECOVERY_WINDOW_MS}ms (24h). Calculated: ${calculatedRecoveryWindow}ms`
        );
      } else if (calculatedRecoveryWindow < MIN_SESSION_RECOVERY_WINDOW_MS) {
        debugLog.warn(
          "SessionRecovery",
          `Recovery window increased to minimum ${MIN_SESSION_RECOVERY_WINDOW_MS}ms (2min). Calculated: ${calculatedRecoveryWindow}ms`
        );
      }
    }
    return boundedRecoveryWindow;
  }
  /**
   * Check if session recovery can be attempted
   */
  canAttemptRecovery(lastAttempt) {
    if (!lastAttempt) {
      return true;
    }
    const now = Date.now();
    const timeSinceLastActivity = now - lastAttempt.context.lastActivity;
    if (timeSinceLastActivity > this.config.recoveryWindowMs) {
      return false;
    }
    if (lastAttempt.attempt >= this.config.maxRecoveryAttempts) {
      return false;
    }
    return true;
  }
  /**
   * Store session context for potential recovery
   */
  storeSessionContextForRecovery(sessionContext) {
    try {
      const recoveryAttempts = this.getStoredRecoveryAttempts();
      const recoveryAttempt = {
        sessionId: sessionContext.sessionId,
        timestamp: Date.now(),
        attempt: 0,
        context: sessionContext
      };
      recoveryAttempts.push(recoveryAttempt);
      const maxStoredRecoveryAttempts = 5;
      if (recoveryAttempts.length > maxStoredRecoveryAttempts) {
        recoveryAttempts.splice(0, recoveryAttempts.length - maxStoredRecoveryAttempts);
      }
      this.storeRecoveryAttempts(recoveryAttempts);
      if (this.debugMode) {
        debugLog.debug("SessionRecovery", `Stored session context for recovery: ${sessionContext.sessionId}`);
      }
    } catch (error) {
      if (this.debugMode) {
        debugLog.warn("SessionRecovery", "Failed to store session context for recovery", { error });
      }
    }
  }
  /**
   * Get stored recovery attempts
   */
  getStoredRecoveryAttempts() {
    try {
      const stored = this.storageManager.getItem(SESSION_RECOVERY_KEY(this.projectId));
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      if (this.debugMode) {
        const stored = this.storageManager.getItem(SESSION_RECOVERY_KEY(this.projectId));
        debugLog.warn(
          "SessionRecovery",
          `Failed to parse stored recovery attempts for projectId ${this.projectId}. Data: ${stored}`,
          { error }
        );
      }
      return [];
    }
  }
  /**
   * Store recovery attempts
   */
  storeRecoveryAttempts(attempts) {
    try {
      this.storageManager.setItem(SESSION_RECOVERY_KEY(this.projectId), JSON.stringify(attempts));
    } catch (error) {
      if (this.debugMode) {
        debugLog.warn("SessionRecovery", "Failed to store recovery attempts", { error });
      }
    }
  }
  /**
   * Get the last recovery attempt
   */
  getLastRecoveryAttempt() {
    const attempts = this.getStoredRecoveryAttempts();
    return attempts.length > 0 ? attempts[attempts.length - 1] : null;
  }
  /**
   * Clean up old recovery attempts
   */
  cleanupOldRecoveryAttempts() {
    const attempts = this.getStoredRecoveryAttempts();
    const now = Date.now();
    const validAttempts = attempts.filter((attempt) => now - attempt.timestamp <= this.config.recoveryWindowMs);
    if (validAttempts.length !== attempts.length) {
      this.storeRecoveryAttempts(validAttempts);
      if (this.debugMode) {
        debugLog.debug("SessionRecovery", `Cleaned up ${attempts.length - validAttempts.length} old recovery attempts`);
      }
    }
  }
  /**
   * Check if there's a recoverable session.
   * Returns false when no recovery attempts are stored.
   */
  hasRecoverableSession() {
    const lastAttempt = this.getLastRecoveryAttempt();
    if (!lastAttempt) {
      return false;
    }
    return this.canAttemptRecovery(lastAttempt);
  }
  /**
   * Get recovery window in milliseconds
   */
  getRecoveryWindowMs() {
    return this.config.recoveryWindowMs;
  }
  /**
   * Get max recovery attempts
   */
  getMaxRecoveryAttempts() {
    return this.config.maxRecoveryAttempts;
  }
  /**
   * Clear all stored recovery data
   */
  clearRecoveryData() {
    this.storageManager.removeItem(SESSION_RECOVERY_KEY(this.projectId));
    if (this.debugMode) {
      debugLog.debug("SessionRecovery", "Cleared all recovery data");
    }
  }
}
class SessionManager extends StateManager {
  config;
  eventManager = null;
  storageManager = null;
  listenerManagers = [];
  deviceCapabilities;
  onActivity;
  onInactivity;
  // Recovery manager
  recoveryManager = null;
  isSessionActive = false;
  lastActivityTime = 0;
  inactivityTimer = null;
  sessionStartTime = 0;
  throttleTimeout = null;
  // Track visibility change timeout for proper cleanup
  visibilityChangeTimeout = null;
  // Session End Management
  pendingSessionEnd = false;
  sessionEndPromise = null;
  sessionEndLock = Promise.resolve({
    success: true,
    reason: "manual_stop",
    timestamp: Date.now(),
    eventsFlushed: 0,
    method: "async"
  });
  cleanupHandlers = [];
  sessionEndConfig;
  sessionEndReason = null;
  sessionEndPriority = {
    page_unload: 4,
    manual_stop: 3,
    orphaned_cleanup: 2,
    inactivity: 1,
    tab_closed: 0
  };
  sessionEndStats = {
    totalSessionEnds: 0,
    successfulEnds: 0,
    failedEnds: 0,
    duplicatePrevented: 0,
    reasonCounts: {
      inactivity: 0,
      page_unload: 0,
      manual_stop: 0,
      orphaned_cleanup: 0,
      tab_closed: 0
    }
  };
  // Session health monitoring
  sessionHealth = {
    recoveryAttempts: 0,
    sessionTimeouts: 0,
    crossTabConflicts: 0,
    lastHealthCheck: Date.now()
  };
  constructor(onActivity, onInactivity, eventManager, storageManager, sessionEndConfig) {
    super();
    this.config = {
      throttleDelay: DEFAULT_THROTTLE_DELAY_MS,
      visibilityTimeout: DEFAULT_VISIBILITY_TIMEOUT_MS,
      motionThreshold: DEFAULT_MOTION_THRESHOLD,
      timeout: this.get("config")?.sessionTimeout ?? DEFAULT_SESSION_TIMEOUT_MS
    };
    this.sessionEndConfig = {
      enablePageUnloadHandlers: true,
      syncTimeoutMs: 1e3,
      maxRetries: 2,
      debugMode: false,
      ...sessionEndConfig
    };
    this.onActivity = onActivity;
    this.onInactivity = onInactivity;
    this.eventManager = eventManager ?? null;
    this.storageManager = storageManager ?? null;
    this.deviceCapabilities = this.detectDeviceCapabilities();
    this.initializeRecoveryManager();
    this.initializeListenerManagers();
    this.setupAllListeners();
    if (this.sessionEndConfig.enablePageUnloadHandlers) {
      this.setupPageUnloadHandlers();
    }
    debugLog.debug("SessionManager", "SessionManager initialized", {
      sessionTimeout: this.config.timeout,
      deviceCapabilities: this.deviceCapabilities,
      unloadHandlersEnabled: this.sessionEndConfig.enablePageUnloadHandlers
    });
  }
  /**
   * Initialize recovery manager
   */
  initializeRecoveryManager() {
    if (!this.storageManager) return;
    const projectId = this.get("config")?.id;
    if (!projectId) return;
    try {
      this.recoveryManager = new SessionRecoveryManager(this.storageManager, projectId, this.eventManager ?? void 0);
      debugLog.debug("SessionManager", "Recovery manager initialized", { projectId });
    } catch (error) {
      debugLog.error("SessionManager", "Failed to initialize recovery manager", { error, projectId });
    }
  }
  /**
   * Store session context for recovery
   */
  storeSessionContextForRecovery() {
    if (!this.recoveryManager) return;
    const sessionId = this.get("sessionId");
    if (!sessionId) return;
    const sessionContext = {
      sessionId,
      startTime: this.sessionStartTime,
      lastActivity: this.lastActivityTime,
      tabCount: 1,
      // This will be updated by cross-tab manager
      recoveryAttempts: 0,
      metadata: {
        userAgent: navigator.userAgent,
        pageUrl: this.get("pageUrl")
      }
    };
    this.recoveryManager.storeSessionContextForRecovery(sessionContext);
  }
  startSession() {
    const now = Date.now();
    let sessionId = "";
    let wasRecovered = false;
    if (this.recoveryManager?.hasRecoverableSession()) {
      const recoveryResult = this.recoveryManager.attemptSessionRecovery();
      if (recoveryResult.recovered && recoveryResult.recoveredSessionId) {
        sessionId = recoveryResult.recoveredSessionId;
        wasRecovered = true;
        this.trackSessionHealth("recovery");
        if (recoveryResult.context) {
          this.sessionStartTime = recoveryResult.context.startTime;
          this.lastActivityTime = now;
        } else {
          this.sessionStartTime = now;
          this.lastActivityTime = now;
        }
        debugLog.info("SessionManager", "Session successfully recovered", {
          sessionId,
          recoveryAttempts: this.sessionHealth.recoveryAttempts
        });
      }
    }
    if (!wasRecovered) {
      sessionId = generateUUID();
      this.sessionStartTime = now;
      this.lastActivityTime = now;
      debugLog.info("SessionManager", "New session started", { sessionId });
    }
    this.isSessionActive = true;
    this.resetInactivityTimer();
    this.storeSessionContextForRecovery();
    return { sessionId, recovered: wasRecovered };
  }
  endSession() {
    if (this.sessionStartTime === 0) {
      return 0;
    }
    const durationMs = Date.now() - this.sessionStartTime;
    this.sessionStartTime = 0;
    this.isSessionActive = false;
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
    return durationMs;
  }
  destroy() {
    this.clearTimers();
    this.cleanupAllListeners();
    this.resetState();
    this.cleanupHandlers.forEach((cleanup) => cleanup());
    this.cleanupHandlers = [];
    this.pendingSessionEnd = false;
    this.sessionEndPromise = null;
    this.sessionEndLock = Promise.resolve({
      success: true,
      reason: "manual_stop",
      timestamp: Date.now(),
      eventsFlushed: 0,
      method: "async"
    });
    if (this.recoveryManager) {
      this.recoveryManager.cleanupOldRecoveryAttempts();
      this.recoveryManager = null;
    }
  }
  detectDeviceCapabilities() {
    const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const hasMouse = window.matchMedia("(pointer: fine)").matches;
    const hasKeyboard = !window.matchMedia("(pointer: coarse)").matches;
    const isMobile = getDeviceType() === DeviceType.Mobile;
    return { hasTouch, hasMouse, hasKeyboard, isMobile };
  }
  initializeListenerManagers() {
    this.listenerManagers.push(new ActivityListenerManager(this.handleActivity));
    if (this.deviceCapabilities.hasTouch) {
      this.listenerManagers.push(new TouchListenerManager(this.handleActivity, this.config.motionThreshold));
    }
    if (this.deviceCapabilities.hasMouse) {
      this.listenerManagers.push(new MouseListenerManager(this.handleActivity));
    }
    if (this.deviceCapabilities.hasKeyboard) {
      this.listenerManagers.push(new KeyboardListenerManager(this.handleActivity));
    }
    this.listenerManagers.push(
      new VisibilityListenerManager(
        this.handleActivity,
        this.handleVisibilityChange,
        this.deviceCapabilities.isMobile,
        this.handleNetworkRestored
      )
    );
    this.listenerManagers.push(new UnloadListenerManager(this.handleInactivity));
  }
  setupAllListeners() {
    this.listenerManagers.forEach((manager) => manager.setup());
  }
  cleanupAllListeners() {
    this.listenerManagers.forEach((manager) => manager.cleanup());
  }
  clearTimers() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
    if (this.throttleTimeout) {
      clearTimeout(this.throttleTimeout);
      this.throttleTimeout = null;
    }
  }
  resetState() {
    this.isSessionActive = false;
    this.lastActivityTime = 0;
    this.sessionStartTime = 0;
  }
  handleActivity = () => {
    const now = Date.now();
    if (now - this.lastActivityTime < this.config.throttleDelay) {
      return;
    }
    this.lastActivityTime = now;
    if (this.isSessionActive) {
      this.onActivity();
      this.resetInactivityTimer();
    } else {
      if (this.throttleTimeout) {
        clearTimeout(this.throttleTimeout);
        this.throttleTimeout = null;
      }
      this.throttleTimeout = window.setTimeout(() => {
        this.onActivity();
        this.throttleTimeout = null;
      }, 100);
    }
  };
  handleInactivity = () => {
    this.trackSessionHealth("timeout");
    this.onInactivity();
  };
  handleNetworkRestored = async () => {
    debugLog.info("SessionManager", "Network connection restored, attempting to recover persisted events");
    if (this.eventManager) {
      try {
        await this.eventManager.recoverPersistedEvents();
      } catch (error) {
        debugLog.error("SessionManager", "Failed to recover events after network restoration", { error });
      }
    }
  };
  handleVisibilityChange = () => {
    if (document.hidden) {
      if (this.isSessionActive) {
        if (this.inactivityTimer) {
          clearTimeout(this.inactivityTimer);
          this.inactivityTimer = null;
        }
        this.inactivityTimer = window.setTimeout(this.handleInactivity, this.config.visibilityTimeout);
      }
    } else {
      this.handleActivity();
    }
  };
  resetInactivityTimer = () => {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
    if (this.isSessionActive) {
      this.inactivityTimer = window.setTimeout(() => {
        this.handleInactivity();
      }, this.config.timeout);
    }
  };
  clearInactivityTimer() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }
  shouldProceedWithSessionEnd(reason) {
    return !this.sessionEndReason || this.sessionEndPriority[reason] > this.sessionEndPriority[this.sessionEndReason];
  }
  async waitForCompletion() {
    if (this.sessionEndPromise) {
      return await this.sessionEndPromise;
    }
    return {
      success: false,
      reason: "inactivity",
      timestamp: Date.now(),
      eventsFlushed: 0,
      method: "async"
    };
  }
  createSessionEndTimeout() {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("Session end timeout"));
      }, this.sessionEndConfig.syncTimeoutMs || 5e3);
    });
  }
  async endSessionManaged(reason) {
    return this.sessionEndLock = this.sessionEndLock.then(async () => {
      this.sessionEndStats.totalSessionEnds++;
      this.sessionEndStats.reasonCounts[reason]++;
      if (this.pendingSessionEnd) {
        this.sessionEndStats.duplicatePrevented++;
        debugLog.debug("SessionManager", "Session end already pending, waiting for completion", { reason });
        return this.waitForCompletion();
      }
      if (!this.shouldProceedWithSessionEnd(reason)) {
        if (this.sessionEndConfig.debugMode) {
          debugLog.debug(
            "SessionManager",
            `Session end skipped due to lower priority. Current: ${this.sessionEndReason}, Requested: ${reason}`
          );
        }
        return {
          success: false,
          reason,
          timestamp: Date.now(),
          eventsFlushed: 0,
          method: "async"
        };
      }
      this.sessionEndReason = reason;
      this.pendingSessionEnd = true;
      this.sessionEndPromise = Promise.race([
        this.performSessionEnd(reason, "async"),
        this.createSessionEndTimeout()
      ]);
      try {
        const result = await this.sessionEndPromise;
        return result;
      } finally {
        this.pendingSessionEnd = false;
        this.sessionEndPromise = null;
        this.sessionEndReason = null;
      }
    }).catch((error) => {
      this.pendingSessionEnd = false;
      this.sessionEndPromise = null;
      this.sessionEndReason = null;
      debugLog.error("SessionManager", "Session end lock failed, recovering", { error, reason });
      return {
        success: false,
        reason,
        timestamp: Date.now(),
        eventsFlushed: 0,
        method: "async"
      };
    });
  }
  endSessionSafely(reason, options) {
    const shouldUseSync = options?.forceSync ?? (options?.allowSync && ["page_unload", "tab_closed"].includes(reason));
    if (shouldUseSync) {
      return this.endSessionManagedSync(reason);
    }
    return this.endSessionManaged(reason);
  }
  isPendingSessionEnd() {
    return this.pendingSessionEnd;
  }
  /**
   * Track session health events for monitoring and diagnostics
   */
  trackSessionHealth(event2) {
    const now = Date.now();
    switch (event2) {
      case "recovery":
        this.sessionHealth.recoveryAttempts++;
        break;
      case "timeout":
        this.sessionHealth.sessionTimeouts++;
        break;
      case "conflict":
        this.sessionHealth.crossTabConflicts++;
        break;
    }
    this.sessionHealth.lastHealthCheck = now;
    if (this.sessionHealth.recoveryAttempts > 3 && this.eventManager) {
      this.eventManager.track({
        type: EventType.CUSTOM,
        custom_event: {
          name: "session_health_degraded",
          metadata: {
            ...this.sessionHealth,
            event_trigger: event2
          }
        }
      });
      if (this.sessionEndConfig.debugMode) {
        debugLog.warn(
          "SessionManager",
          `Session health degraded: ${this.sessionHealth.recoveryAttempts} recovery attempts`
        );
      }
    }
    if (this.sessionEndConfig.debugMode) {
      debugLog.debug("SessionManager", `Session health event tracked: ${event2}`);
    }
  }
  async performSessionEnd(reason, method) {
    const timestamp = Date.now();
    let eventsFlushed = 0;
    try {
      debugLog.info("SessionManager", "Starting session end", { method, reason, timestamp });
      if (this.eventManager) {
        this.eventManager.track({
          type: EventType.SESSION_END,
          session_end_reason: reason
        });
        eventsFlushed = this.eventManager.getQueueLength();
        const flushResult = await this.eventManager.flushImmediately();
        await this.cleanupSessionAsync();
        const result2 = {
          success: flushResult,
          reason,
          timestamp,
          eventsFlushed,
          method
        };
        if (flushResult) {
          this.sessionEndStats.successfulEnds++;
        } else {
          this.sessionEndStats.failedEnds++;
        }
        return result2;
      }
      await this.cleanupSessionAsync();
      const result = {
        success: true,
        reason,
        timestamp,
        eventsFlushed: 0,
        method
      };
      this.sessionEndStats.successfulEnds++;
      return result;
    } catch (error) {
      this.sessionEndStats.failedEnds++;
      debugLog.error("SessionManager", "Session end failed", { error, reason, method });
      await this.cleanupSessionAsync();
      return {
        success: false,
        reason,
        timestamp,
        eventsFlushed,
        method
      };
    }
  }
  cleanupSession() {
    this.endSession();
    this.clearTimers();
    this.set("sessionId", null).catch((error) => {
      debugLog.error("SessionManager", "Failed to clear sessionId", { error });
    });
    this.set("hasStartSession", false).catch((error) => {
      debugLog.error("SessionManager", "Failed to clear hasStartSession", { error });
    });
  }
  async cleanupSessionAsync() {
    this.endSession();
    this.clearTimers();
    await this.set("sessionId", null);
    await this.set("hasStartSession", false);
  }
  endSessionManagedSync(reason) {
    this.sessionEndStats.totalSessionEnds++;
    this.sessionEndStats.reasonCounts[reason]++;
    if (this.pendingSessionEnd) {
      this.sessionEndStats.duplicatePrevented++;
      debugLog.warn("SessionManager", "Sync session end called while async end pending", { reason });
    }
    if (!this.shouldProceedWithSessionEnd(reason)) {
      if (this.sessionEndConfig.debugMode) {
        debugLog.debug(
          "SessionManager",
          `Sync session end skipped due to lower priority. Current: ${this.sessionEndReason}, Requested: ${reason}`
        );
      }
      return {
        success: false,
        reason,
        timestamp: Date.now(),
        eventsFlushed: 0,
        method: "sync"
      };
    }
    this.sessionEndReason = reason;
    this.pendingSessionEnd = true;
    try {
      return this.performSessionEndSync(reason);
    } finally {
      this.pendingSessionEnd = false;
      this.sessionEndPromise = null;
      this.sessionEndReason = null;
    }
  }
  performSessionEndSync(reason) {
    const timestamp = Date.now();
    let eventsFlushed = 0;
    try {
      if (this.eventManager) {
        this.eventManager.track({
          type: EventType.SESSION_END,
          session_end_reason: reason
        });
        eventsFlushed = this.eventManager.getQueueLength();
        const success = this.eventManager.flushImmediatelySync();
        this.cleanupSession();
        const result2 = {
          success,
          reason,
          timestamp,
          eventsFlushed,
          method: "sync"
        };
        if (success) {
          this.sessionEndStats.successfulEnds++;
        } else {
          this.sessionEndStats.failedEnds++;
        }
        return result2;
      }
      this.cleanupSession();
      const result = {
        success: true,
        reason,
        timestamp,
        eventsFlushed: 0,
        method: "sync"
      };
      this.sessionEndStats.successfulEnds++;
      return result;
    } catch (error) {
      this.sessionEndStats.failedEnds++;
      this.cleanupSession();
      debugLog.error("SessionManager", "Sync session end failed", { error, reason });
      return {
        success: false,
        reason,
        timestamp,
        eventsFlushed,
        method: "sync"
      };
    }
  }
  setupPageUnloadHandlers() {
    let unloadHandled = false;
    const handlePageUnload = () => {
      if (unloadHandled || !this.get("sessionId")) {
        return;
      }
      unloadHandled = true;
      this.clearInactivityTimer();
      this.endSessionSafely("page_unload", { forceSync: true });
    };
    const beforeUnloadHandler = () => {
      handlePageUnload();
    };
    const pageHideHandler = (event2) => {
      if (!event2.persisted) {
        handlePageUnload();
      }
    };
    const visibilityChangeHandler = () => {
      if (document.visibilityState === "hidden" && this.get("sessionId") && !unloadHandled) {
        this.visibilityChangeTimeout = window.setTimeout(() => {
          if (document.visibilityState === "hidden" && this.get("sessionId") && !unloadHandled) {
            handlePageUnload();
          }
          this.visibilityChangeTimeout = null;
        }, 1e3);
      }
    };
    window.addEventListener("beforeunload", beforeUnloadHandler);
    window.addEventListener("pagehide", pageHideHandler);
    document.addEventListener("visibilitychange", visibilityChangeHandler);
    this.cleanupHandlers.push(
      () => window.removeEventListener("beforeunload", beforeUnloadHandler),
      () => window.removeEventListener("pagehide", pageHideHandler),
      () => document.removeEventListener("visibilitychange", visibilityChangeHandler),
      () => {
        if (this.visibilityChangeTimeout) {
          clearTimeout(this.visibilityChangeTimeout);
          this.visibilityChangeTimeout = null;
        }
      }
    );
  }
}
class CrossTabSessionManager extends StateManager {
  constructor(storageManager, projectId, config, callbacks) {
    super();
    this.callbacks = callbacks;
    this.storageManager = storageManager;
    this.projectId = projectId;
    this.tabId = generateUUID();
    this.config = {
      tabHeartbeatIntervalMs: TAB_HEARTBEAT_INTERVAL_MS,
      tabElectionTimeoutMs: TAB_ELECTION_TIMEOUT_MS,
      debugMode: (this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug") ?? false,
      ...config
    };
    this.tabInfo = {
      id: this.tabId,
      lastHeartbeat: Date.now(),
      isLeader: false,
      sessionId: "",
      startTime: Date.now()
    };
    this.broadcastChannel = this.initializeBroadcastChannel();
    this.initialize();
  }
  config;
  storageManager;
  broadcastChannel;
  tabId;
  tabInfo;
  projectId;
  leaderTabId = null;
  isTabLeader = false;
  heartbeatInterval = null;
  electionTimeout = null;
  cleanupTimeout = null;
  sessionEnded = false;
  // Additional timeout tracking for proper cleanup
  fallbackLeadershipTimeout = null;
  electionDelayTimeout = null;
  tabInfoCleanupTimeout = null;
  closingAnnouncementTimeout = null;
  leaderHealthCheckInterval = null;
  lastHeartbeatSent = 0;
  /**
   * Initialize BroadcastChannel if supported
   */
  initializeBroadcastChannel() {
    if (!this.isBroadcastChannelSupported()) {
      return null;
    }
    try {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME(this.projectId));
      this.setupBroadcastListeners(channel);
      return channel;
    } catch (error) {
      if (this.config.debugMode) {
        debugLog.warn("CrossTabSession", "Failed to initialize BroadcastChannel", { error });
      }
      return null;
    }
  }
  /**
   * Initialize the cross-tab session manager
   */
  initialize() {
    if (!this.broadcastChannel) {
      this.becomeLeader();
      return;
    }
    const existingSession = this.getStoredSessionContext();
    if (existingSession) {
      this.tryJoinExistingSession(existingSession);
    } else {
      this.startLeaderElection();
    }
    this.startHeartbeat();
    if (this.broadcastChannel) {
      this.setupLeadershipFallback();
    }
  }
  /**
   * Check if this tab should be the session leader
   */
  tryJoinExistingSession(sessionContext) {
    if (this.config.debugMode) {
      debugLog.debug("CrossTabSession", `Attempting to join existing session: ${sessionContext.sessionId}`);
    }
    this.tabInfo.sessionId = sessionContext.sessionId;
    this.requestLeadershipStatus();
    sessionContext.tabCount += 1;
    sessionContext.lastActivity = Date.now();
    this.storeSessionContext(sessionContext);
    if (this.callbacks?.onTabActivity) {
      this.callbacks.onTabActivity();
    }
  }
  /**
   * Request leadership status from other tabs
   */
  requestLeadershipStatus() {
    if (!this.broadcastChannel) return;
    if (this.electionTimeout) {
      clearTimeout(this.electionTimeout);
      this.electionTimeout = null;
    }
    const message = {
      type: "election_request",
      tabId: this.tabId,
      sessionId: this.tabInfo.sessionId,
      timestamp: Date.now()
    };
    this.broadcastChannel.postMessage(message);
    const randomDelay = Math.floor(Math.random() * 500);
    this.electionTimeout = window.setTimeout(() => {
      if (!this.isTabLeader) {
        this.becomeLeader();
      }
    }, this.config.tabElectionTimeoutMs + randomDelay);
  }
  /**
   * Start leader election process with debouncing to prevent excessive elections
   */
  startLeaderElection() {
    if (this.electionTimeout) {
      if (this.config.debugMode) {
        debugLog.debug("CrossTabSession", "Leader election already in progress, skipping");
      }
      return;
    }
    if (this.config.debugMode) {
      debugLog.debug("CrossTabSession", "Starting leader election");
    }
    const randomDelay = Math.floor(Math.random() * 50) + 10;
    this.electionTimeout = window.setTimeout(() => {
      this.electionTimeout = null;
      this.requestLeadershipStatus();
    }, randomDelay);
  }
  /**
   * Become the session leader
   */
  becomeLeader() {
    if (this.isTabLeader) {
      return;
    }
    this.isTabLeader = true;
    this.tabInfo.isLeader = true;
    this.leaderTabId = this.tabId;
    if (this.config.debugMode) {
      debugLog.debug("CrossTabSession", `Tab ${this.tabId} became session leader`);
    }
    if (this.electionTimeout) {
      clearTimeout(this.electionTimeout);
      this.electionTimeout = null;
    }
    if (!this.tabInfo.sessionId) {
      const sessionId = generateUUID();
      this.tabInfo.sessionId = sessionId;
      const sessionContext = {
        sessionId,
        startTime: Date.now(),
        lastActivity: Date.now(),
        tabCount: 1,
        recoveryAttempts: 0
      };
      this.storeSessionContext(sessionContext);
      if (this.callbacks?.onSessionStart) {
        this.callbacks.onSessionStart(sessionId);
      }
      this.announceSessionStart(sessionId);
    } else {
      const sessionContext = this.getStoredSessionContext();
      if (sessionContext) {
        sessionContext.lastActivity = Date.now();
        this.storeSessionContext(sessionContext);
      }
    }
    this.storeTabInfo();
    this.announceLeadership();
  }
  /**
   * Announce session start to other tabs
   */
  announceSessionStart(sessionId) {
    if (!this.broadcastChannel) return;
    const message = {
      type: "session_start",
      tabId: this.tabId,
      sessionId,
      timestamp: Date.now()
    };
    this.broadcastChannel.postMessage(message);
  }
  /**
   * Announce leadership to other tabs
   */
  announceLeadership() {
    if (!this.broadcastChannel || !this.tabInfo.sessionId) return;
    const message = {
      type: "election_response",
      tabId: this.tabId,
      sessionId: this.tabInfo.sessionId,
      timestamp: Date.now(),
      data: { isLeader: true }
    };
    this.broadcastChannel.postMessage(message);
  }
  /**
   * Clean up health check interval to prevent memory leaks
   */
  cleanupHealthCheckInterval() {
    if (this.leaderHealthCheckInterval) {
      clearInterval(this.leaderHealthCheckInterval);
      this.leaderHealthCheckInterval = null;
      debugLog.debug("CrossTabSession", "Health check interval cleaned up");
    }
  }
  /**
   * Setup fallback mechanism to ensure a leader is always elected
   */
  setupLeadershipFallback() {
    const fallbackDelay = this.config.tabElectionTimeoutMs + 1500;
    this.fallbackLeadershipTimeout = window.setTimeout(() => {
      if (!this.isTabLeader && !this.leaderTabId) {
        if (this.tabInfo.sessionId) {
          if (this.config.debugMode) {
            debugLog.warn(
              "CrossTabSession",
              `No leader detected after ${fallbackDelay}ms, forcing leadership for tab ${this.tabId}`
            );
          }
          this.becomeLeader();
        } else {
          if (this.config.debugMode) {
            debugLog.warn(
              "CrossTabSession",
              `No session or leader detected after ${fallbackDelay}ms, starting new session for tab ${this.tabId}`
            );
          }
          this.becomeLeader();
        }
      }
      this.fallbackLeadershipTimeout = null;
    }, fallbackDelay);
    this.leaderHealthCheckInterval = window.setInterval(() => {
      if (!this.sessionEnded && this.leaderTabId && !this.isTabLeader) {
        const sessionContext = this.getStoredSessionContext();
        if (sessionContext) {
          const timeSinceLastActivity = Date.now() - sessionContext.lastActivity;
          const maxInactiveTime = this.config.tabHeartbeatIntervalMs * 3;
          if (timeSinceLastActivity > maxInactiveTime) {
            if (this.config.debugMode) {
              debugLog.warn(
                "CrossTabSession",
                `Leader tab appears inactive (${timeSinceLastActivity}ms), attempting to become leader`
              );
            }
            this.leaderTabId = null;
            this.startLeaderElection();
          }
        }
      }
    }, this.config.tabHeartbeatIntervalMs * 2);
    const originalEndSession = this.endSession.bind(this);
    this.endSession = (reason) => {
      this.cleanupHealthCheckInterval();
      if (this.fallbackLeadershipTimeout) {
        clearTimeout(this.fallbackLeadershipTimeout);
        this.fallbackLeadershipTimeout = null;
      }
      originalEndSession(reason);
    };
  }
  /**
   * Setup BroadcastChannel event listeners
   */
  setupBroadcastListeners(channel) {
    channel.addEventListener("message", (event2) => {
      const message = event2.data;
      if (message.tabId === this.tabId) {
        return;
      }
      this.handleCrossTabMessage(message);
    });
  }
  /**
   * Handle cross-tab messages
   */
  handleCrossTabMessage(message) {
    if (this.config.debugMode) {
      debugLog.debug("CrossTabSession", `Received cross-tab message: ${message.type} from ${message.tabId}`);
    }
    switch (message.type) {
      case "heartbeat":
        this.handleHeartbeatMessage(message);
        break;
      case "session_start":
        this.handleSessionStartMessage(message);
        break;
      case "session_end":
        this.handleSessionEndMessage(message);
        break;
      case "tab_closing":
        this.handleTabClosingMessage(message);
        break;
      case "election_request":
        this.handleElectionRequest(message);
        break;
      case "election_response":
        this.handleElectionResponse(message);
        break;
    }
  }
  /**
   * Handle heartbeat message from another tab
   */
  handleHeartbeatMessage(message) {
    if (message.sessionId === this.tabInfo.sessionId) {
      const sessionContext = this.getStoredSessionContext();
      if (sessionContext) {
        sessionContext.lastActivity = Date.now();
        this.storeSessionContext(sessionContext);
        if (this.callbacks?.onTabActivity) {
          this.callbacks.onTabActivity();
        }
      }
    }
  }
  /**
   * Handle session start message from another tab
   */
  handleSessionStartMessage(message) {
    if (!message.sessionId) return;
    if (!this.tabInfo.sessionId) {
      this.tabInfo.sessionId = message.sessionId;
      this.storeTabInfo();
      const sessionContext = this.getStoredSessionContext();
      if (sessionContext) {
        sessionContext.tabCount += 1;
        this.storeSessionContext(sessionContext);
      }
    }
  }
  /**
   * Handle session end message from another tab
   */
  handleSessionEndMessage(message) {
    if (this.isTabLeader) {
      if (this.config.debugMode) {
        debugLog.debug("CrossTabSession", `Ignoring session end message from ${message.tabId} (this tab is leader)`);
      }
      return;
    }
    if (!this.leaderTabId || message.tabId !== this.leaderTabId) {
      if (this.config.debugMode) {
        const extra = this.leaderTabId ? `; leader is ${this.leaderTabId}` : "";
        debugLog.debug("CrossTabSession", `Ignoring session end message from ${message.tabId}${extra}`);
      }
      return;
    }
    this.tabInfo.sessionId = "";
    this.storeTabInfo();
    this.leaderTabId = null;
    const sessionContext = this.getStoredSessionContext();
    if (!sessionContext) {
      if (this.broadcastChannel) {
        this.startLeaderElection();
      } else {
        this.becomeLeader();
      }
    }
  }
  /**
   * Handle tab closing message from another tab
   */
  handleTabClosingMessage(message) {
    const sessionContext = this.getStoredSessionContext();
    if (sessionContext && message.sessionId === sessionContext.sessionId) {
      const oldCount = sessionContext.tabCount;
      sessionContext.tabCount = Math.max(1, sessionContext.tabCount - 1);
      sessionContext.lastActivity = Date.now();
      this.storeSessionContext(sessionContext);
      if (this.config.debugMode) {
        debugLog.debug(
          "CrossTabSession",
          `Tab count updated from ${oldCount} to ${sessionContext.tabCount} after tab ${message.tabId} closed`
        );
      }
      const wasLeader = message.data?.isLeader ?? message.tabId === this.leaderTabId;
      if (wasLeader && !this.isTabLeader) {
        if (this.config.debugMode) {
          debugLog.debug("CrossTabSession", `Leader tab ${message.tabId} closed, starting leader election`);
        }
        this.leaderTabId = null;
        this.electionDelayTimeout = window.setTimeout(() => {
          this.startLeaderElection();
          this.electionDelayTimeout = null;
        }, 200);
      }
    }
  }
  /**
   * Handle election request from another tab
   */
  handleElectionRequest(_message) {
    if (this.isTabLeader) {
      const response = {
        type: "election_response",
        tabId: this.tabId,
        sessionId: this.tabInfo.sessionId,
        timestamp: Date.now(),
        data: { isLeader: true }
      };
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage(response);
      }
    }
  }
  /**
   * Handle election response from another tab
   */
  handleElectionResponse(message) {
    if (message.data?.isLeader) {
      if (!this.isTabLeader) {
        this.isTabLeader = false;
        this.tabInfo.isLeader = false;
        this.leaderTabId = message.tabId;
        if (this.config.debugMode) {
          debugLog.debug("CrossTabSession", `Acknowledging tab ${message.tabId} as leader`);
        }
        if (this.electionTimeout) {
          clearTimeout(this.electionTimeout);
          this.electionTimeout = null;
        }
        if (message.sessionId) {
          this.tabInfo.sessionId = message.sessionId;
          this.storeTabInfo();
        }
      } else if (this.config.debugMode) {
        debugLog.warn(
          "CrossTabSession",
          `Received leadership claim from ${message.tabId} but this tab is already leader`
        );
        if (this.callbacks?.onCrossTabConflict) {
          this.callbacks.onCrossTabConflict();
        }
      }
    }
  }
  /**
   * Start heartbeat to keep session active
   */
  startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.heartbeatInterval = window.setInterval(() => {
      this.sendHeartbeat();
      this.updateTabInfo();
    }, this.config.tabHeartbeatIntervalMs);
  }
  /**
   * Send heartbeat to other tabs with rate limiting to prevent flooding
   */
  sendHeartbeat() {
    if (!this.broadcastChannel || !this.tabInfo.sessionId) return;
    const now = Date.now();
    const lastHeartbeat = this.lastHeartbeatSent ?? 0;
    const minHeartbeatInterval = this.config.tabHeartbeatIntervalMs * 0.8;
    if (!this.isTabLeader && now - lastHeartbeat < minHeartbeatInterval) {
      return;
    }
    const message = {
      type: "heartbeat",
      tabId: this.tabId,
      sessionId: this.tabInfo.sessionId,
      timestamp: now
    };
    this.broadcastChannel.postMessage(message);
    this.lastHeartbeatSent = now;
  }
  /**
   * Update tab info with current timestamp
   */
  updateTabInfo() {
    this.tabInfo.lastHeartbeat = Date.now();
    this.storeTabInfo();
  }
  /**
   * End session and notify other tabs
   */
  endSession(reason) {
    if (this.sessionEnded) {
      return;
    }
    this.sessionEnded = true;
    if (this.config.debugMode) {
      debugLog.debug(
        "CrossTabSession",
        `Ending cross-tab session: ${reason} (tab: ${this.tabId}, isLeader: ${this.isTabLeader})`
      );
    }
    this.announceTabClosing();
    if (this.isTabLeader && reason !== "manual_stop") {
      this.announceSessionEnd(reason);
    }
    this.tabInfoCleanupTimeout = window.setTimeout(() => {
      this.clearTabInfo();
      this.tabInfoCleanupTimeout = null;
    }, 150);
  }
  /**
   * Announce tab is closing to other tabs
   */
  announceTabClosing() {
    if (!this.broadcastChannel || !this.tabInfo.sessionId) return;
    const message = {
      type: "tab_closing",
      tabId: this.tabId,
      sessionId: this.tabInfo.sessionId,
      timestamp: Date.now(),
      data: { isLeader: this.isTabLeader }
    };
    this.broadcastChannel.postMessage(message);
    this.closingAnnouncementTimeout = window.setTimeout(() => {
      if (this.config.debugMode) {
        debugLog.debug("CrossTabSession", `Tab ${this.tabId} closing announcement sent`);
      }
      this.closingAnnouncementTimeout = null;
    }, 100);
  }
  /**
   * Announce session end to other tabs
   */
  announceSessionEnd(reason) {
    if (!this.broadcastChannel) return;
    const message = {
      type: "session_end",
      tabId: this.tabId,
      sessionId: this.tabInfo.sessionId,
      timestamp: Date.now(),
      data: { reason }
    };
    this.broadcastChannel.postMessage(message);
  }
  /**
   * Get current session ID
   */
  getSessionId() {
    return this.tabInfo.sessionId;
  }
  /**
   * Get current tab ID
   */
  getTabId() {
    return this.tabId;
  }
  /**
   * Check if this tab is the session leader
   */
  isLeader() {
    return this.isTabLeader;
  }
  /**
   * Get current session context from storage
   */
  getStoredSessionContext() {
    try {
      const stored = this.storageManager.getItem(CROSS_TAB_SESSION_KEY(this.projectId));
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      if (this.config.debugMode) {
        debugLog.warn("CrossTabSession", "Failed to parse stored session context", { error });
      }
      return null;
    }
  }
  /**
   * Store session context to localStorage
   */
  storeSessionContext(context) {
    try {
      this.storageManager.setItem(CROSS_TAB_SESSION_KEY(this.projectId), JSON.stringify(context));
    } catch (error) {
      if (this.config.debugMode) {
        debugLog.warn("CrossTabSession", "Failed to store session context", { error });
      }
    }
  }
  /**
   * Clear stored session context
   */
  clearStoredSessionContext() {
    this.storageManager.removeItem(CROSS_TAB_SESSION_KEY(this.projectId));
  }
  /**
   * Store tab info to localStorage
   */
  storeTabInfo() {
    try {
      this.storageManager.setItem(TAB_SPECIFIC_INFO_KEY(this.projectId, this.tabId), JSON.stringify(this.tabInfo));
    } catch (error) {
      if (this.config.debugMode) {
        debugLog.warn("CrossTabSession", "Failed to store tab info", { error });
      }
    }
  }
  /**
   * Clear tab info from localStorage
   */
  clearTabInfo() {
    this.storageManager.removeItem(TAB_SPECIFIC_INFO_KEY(this.projectId, this.tabId));
  }
  /**
   * Check if BroadcastChannel is supported
   */
  isBroadcastChannelSupported() {
    return typeof window !== "undefined" && "BroadcastChannel" in window;
  }
  /**
   * Get session timeout considering cross-tab activity
   */
  getEffectiveSessionTimeout() {
    const sessionContext = this.getStoredSessionContext();
    if (!sessionContext) {
      return this.get("config")?.sessionTimeout ?? DEFAULT_SESSION_TIMEOUT_MS;
    }
    const now = Date.now();
    const timeSinceLastActivity = now - sessionContext.lastActivity;
    const sessionTimeout = this.get("config")?.sessionTimeout ?? DEFAULT_SESSION_TIMEOUT_MS;
    return Math.max(0, sessionTimeout - timeSinceLastActivity);
  }
  /**
   * Update session activity from any tab
   */
  updateSessionActivity() {
    const sessionContext = this.getStoredSessionContext();
    if (sessionContext) {
      sessionContext.lastActivity = Date.now();
      this.storeSessionContext(sessionContext);
    }
    this.sendHeartbeat();
  }
  /**
   * Cleanup resources
   */
  destroy() {
    this.cleanupHealthCheckInterval();
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.electionTimeout) {
      clearTimeout(this.electionTimeout);
      this.electionTimeout = null;
    }
    if (this.cleanupTimeout) {
      clearTimeout(this.cleanupTimeout);
      this.cleanupTimeout = null;
    }
    if (this.fallbackLeadershipTimeout) {
      clearTimeout(this.fallbackLeadershipTimeout);
      this.fallbackLeadershipTimeout = null;
    }
    if (this.electionDelayTimeout) {
      clearTimeout(this.electionDelayTimeout);
      this.electionDelayTimeout = null;
    }
    if (this.tabInfoCleanupTimeout) {
      clearTimeout(this.tabInfoCleanupTimeout);
      this.tabInfoCleanupTimeout = null;
    }
    if (this.closingAnnouncementTimeout) {
      clearTimeout(this.closingAnnouncementTimeout);
      this.closingAnnouncementTimeout = null;
    }
    this.endSession("manual_stop");
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
    debugLog.debug("CrossTabSession", "CrossTabSessionManager destroyed");
  }
}
class SessionHandler extends StateManager {
  eventManager;
  storageManager;
  sessionStorageKey;
  sessionManager = null;
  recoveryManager = null;
  _crossTabSessionManager = null;
  heartbeatInterval = null;
  _isInitializingCrossTab = false;
  _crossTabInitLock = null;
  get crossTabSessionManager() {
    if (this._crossTabSessionManager) {
      return Promise.resolve(this._crossTabSessionManager);
    }
    if (this._crossTabInitLock) {
      return this._crossTabInitLock;
    }
    if (!this.shouldUseCrossTabs()) {
      return Promise.resolve(null);
    }
    this._crossTabInitLock = this.initializeCrossTabWithLock();
    return this._crossTabInitLock;
  }
  async initializeCrossTabWithLock() {
    if (this._crossTabSessionManager) {
      this._crossTabInitLock = null;
      return this._crossTabSessionManager;
    }
    if (this._isInitializingCrossTab) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      this._crossTabInitLock = null;
      return this._crossTabSessionManager;
    }
    this._isInitializingCrossTab = true;
    try {
      const projectId = this.get("config")?.id;
      if (!projectId) {
        throw new Error("ProjectId not available for cross-tab initialization");
      }
      this.initializeCrossTabSessionManager(projectId);
      return this._crossTabSessionManager;
    } catch (error) {
      debugLog.error("SessionHandler", "Failed to initialize cross-tab session manager", {
        error: error instanceof Error ? error.message : "Unknown error"
      });
      return null;
    } finally {
      this._isInitializingCrossTab = false;
      this._crossTabInitLock = null;
    }
  }
  shouldUseCrossTabs() {
    return typeof BroadcastChannel !== "undefined" && typeof navigator !== "undefined" && "serviceWorker" in navigator;
  }
  constructor(storageManager, eventManager) {
    super();
    this.eventManager = eventManager;
    this.storageManager = storageManager;
    this.sessionStorageKey = SESSION_STORAGE_KEY(this.get("config")?.id);
    const projectId = this.get("config")?.id;
    if (projectId) {
      this.initializeSessionRecoveryManager(projectId);
    } else {
      debugLog.warn("SessionHandler", "ProjectId not available, recovery manager will be initialized later");
    }
  }
  startTracking() {
    if (this.sessionManager) {
      debugLog.debug("SessionHandler", "Session tracking already active");
      return;
    }
    debugLog.debug("SessionHandler", "Starting session tracking");
    this.ensureRecoveryManagerInitialized();
    this.checkOrphanedSessions();
    const onActivity = async () => {
      const crossTab = await this.crossTabSessionManager;
      if (crossTab) {
        crossTab.updateSessionActivity();
      }
      if (this.get("sessionId")) {
        return;
      }
      try {
        const sessionResult = await this.createOrJoinSession();
        await this.set("sessionId", sessionResult.sessionId);
        const crossTabActive = !!await this.crossTabSessionManager;
        debugLog.info("SessionHandler", "🏁 Session started", {
          sessionId: sessionResult.sessionId,
          recovered: sessionResult.recovered,
          crossTabActive
        });
        this.trackSession(EventType.SESSION_START, sessionResult.recovered);
        this.persistSession(sessionResult.sessionId);
        this.startHeartbeat();
      } catch (error) {
        debugLog.error(
          "SessionHandler",
          `Session creation failed: ${error instanceof Error ? error.message : "Unknown error"}`
        );
        await this.forceCleanupSession();
      }
    };
    const onInactivity = async () => {
      if (!this.get("sessionId")) {
        return;
      }
      const crossTab = await this.crossTabSessionManager;
      if (crossTab && crossTab.getEffectiveSessionTimeout() > 0) {
        if (this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug") {
          debugLog.debug("SessionHandler", "Session kept alive by cross-tab activity");
        }
        return;
      }
      this.sessionManager.endSessionManaged("inactivity").then(async (result) => {
        debugLog.info("SessionHandler", "🛑 Session ended by inactivity", {
          sessionId: this.get("sessionId"),
          reason: result.reason,
          success: result.success,
          eventsFlushed: result.eventsFlushed
        });
        const crossTabManager = await this.crossTabSessionManager;
        if (crossTabManager) {
          crossTabManager.endSession("inactivity");
        }
        this.clearPersistedSession();
        this.stopHeartbeat();
      }).catch(async (error) => {
        debugLog.error(
          "SessionHandler",
          `Session end failed: ${error instanceof Error ? error.message : "Unknown error"}`
        );
        await this.forceCleanupSession();
      });
    };
    const sessionEndConfig = {
      enablePageUnloadHandlers: true,
      debugMode: (this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug") ?? false,
      syncTimeoutMs: SESSION_SYNC_CONSTANTS.SYNC_TIMEOUT_MS,
      maxRetries: SESSION_SYNC_CONSTANTS.MAX_RETRY_ATTEMPTS
    };
    this.sessionManager = new SessionManager(
      onActivity,
      onInactivity,
      this.eventManager,
      this.storageManager,
      sessionEndConfig
    );
    debugLog.debug("SessionHandler", "Session manager initialized");
    this.startInitialSession();
  }
  async stopTracking() {
    debugLog.info("SessionHandler", "Stopping session tracking");
    if (this.sessionManager) {
      if (this.get("sessionId")) {
        try {
          this.sessionManager.endSessionSafely("manual_stop", { forceSync: true });
          this.clearPersistedSession();
          this.stopHeartbeat();
        } catch (error) {
          debugLog.error(
            "SessionHandler",
            `Manual session stop failed: ${error instanceof Error ? error.message : "Unknown error"}`
          );
          await this.forceCleanupSession();
        }
      }
      this.sessionManager.destroy();
      this.sessionManager = null;
    }
    if (this._crossTabSessionManager) {
      this._crossTabSessionManager.destroy();
      this._crossTabSessionManager = null;
    }
    this._isInitializingCrossTab = false;
    this._crossTabInitLock = null;
    if (this.recoveryManager) {
      this.recoveryManager.cleanupOldRecoveryAttempts();
      this.recoveryManager = null;
    }
  }
  initializeSessionRecoveryManager(projectId) {
    this.recoveryManager = new SessionRecoveryManager(this.storageManager, projectId, this.eventManager);
    debugLog.debug("SessionHandler", "Session recovery manager initialized", { projectId });
  }
  initializeCrossTabSessionManager(projectId) {
    const config = {
      debugMode: (this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug") ?? false
    };
    const onSessionStart = async (sessionId) => {
      if (this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug") {
        debugLog.debug("SessionHandler", `Cross-tab session started: ${sessionId}`);
      }
      await this.set("sessionId", sessionId);
      this.trackSession(EventType.SESSION_START, false);
      this.persistSession(sessionId);
      this.startHeartbeat();
    };
    const onSessionEnd = (reason) => {
      if (this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug") {
        debugLog.debug("SessionHandler", `Cross-tab session ended: ${reason}`);
      }
      this.clearPersistedSession();
      this.trackSession(EventType.SESSION_END, false, reason);
    };
    const onTabActivity = () => {
      if (this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug") {
        debugLog.debug("SessionHandler", "Cross-tab activity detected");
      }
    };
    const onCrossTabConflict = () => {
      if (this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug") {
        debugLog.warn("SessionHandler", "Cross-tab conflict detected");
      }
      if (this.sessionManager) {
        this.sessionManager.trackSessionHealth("conflict");
      }
    };
    const callbacks = {
      onSessionStart,
      onSessionEnd,
      onTabActivity,
      onCrossTabConflict
    };
    this._crossTabSessionManager = new CrossTabSessionManager(this.storageManager, projectId, config, callbacks);
    debugLog.debug("SessionHandler", "Cross-tab session manager initialized", { projectId });
  }
  ensureRecoveryManagerInitialized() {
    if (!this.recoveryManager) {
      const projectId = this.get("config")?.id;
      if (projectId) {
        this.initializeSessionRecoveryManager(projectId);
      } else {
        debugLog.error("SessionHandler", "Cannot initialize recovery manager without projectId");
      }
    }
  }
  async createOrJoinSession() {
    const crossTab = await this.crossTabSessionManager;
    if (crossTab) {
      const existingSessionId = crossTab.getSessionId();
      if (existingSessionId) {
        return { sessionId: existingSessionId, recovered: false };
      }
      const sessionResult2 = this.sessionManager.startSession();
      return { sessionId: sessionResult2.sessionId, recovered: sessionResult2.recovered ?? false };
    }
    const sessionResult = this.sessionManager.startSession();
    return { sessionId: sessionResult.sessionId, recovered: sessionResult.recovered ?? false };
  }
  async forceCleanupSession() {
    await this.set("sessionId", null);
    this.clearPersistedSession();
    this.stopHeartbeat();
    const crossTab = await this.crossTabSessionManager;
    if (crossTab) {
      try {
        crossTab.endSession("orphaned_cleanup");
      } catch (error) {
        if (this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug") {
          debugLog.warn(
            "SessionHandler",
            `Cross-tab cleanup failed during force cleanup: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }
    }
    try {
      this.trackSession(EventType.SESSION_END, false, "orphaned_cleanup");
    } catch (error) {
      if (this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug") {
        debugLog.warn(
          "SessionHandler",
          `Session tracking failed during force cleanup: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }
    if (this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug") {
      debugLog.debug("SessionHandler", "Forced session cleanup completed");
    }
  }
  trackSession(eventType, sessionStartRecovered = false, sessionEndReason) {
    this.eventManager.track({
      type: eventType,
      ...eventType === EventType.SESSION_START && sessionStartRecovered && { session_start_recovered: sessionStartRecovered },
      ...eventType === EventType.SESSION_END && { session_end_reason: sessionEndReason ?? "orphaned_cleanup" }
    });
  }
  async startInitialSession() {
    if (this.get("sessionId")) {
      debugLog.debug("SessionHandler", "Session already exists, skipping initial session creation");
      return;
    }
    debugLog.debug("SessionHandler", "Starting initial session");
    const crossTab = await this.crossTabSessionManager;
    if (crossTab) {
      const existingSessionId = crossTab.getSessionId();
      if (existingSessionId) {
        await this.set("sessionId", existingSessionId);
        this.trackSession(EventType.SESSION_START, false);
        this.persistSession(existingSessionId);
        this.startHeartbeat();
        debugLog.info("SessionHandler", "🏁 Session started (joined cross-tab session)", {
          sessionId: existingSessionId
        });
        return;
      }
      debugLog.debug("SessionHandler", "No existing cross-tab session, waiting for activity");
      return;
    }
    debugLog.debug("SessionHandler", "Starting regular session (no cross-tab)");
    const sessionResult = this.sessionManager.startSession();
    await this.set("sessionId", sessionResult.sessionId);
    this.trackSession(EventType.SESSION_START, sessionResult.recovered);
    this.persistSession(sessionResult.sessionId);
    this.startHeartbeat();
  }
  checkOrphanedSessions() {
    const storedSessionData = this.storageManager.getItem(this.sessionStorageKey);
    if (storedSessionData) {
      try {
        const session = JSON.parse(storedSessionData);
        const now = Date.now();
        const timeSinceLastHeartbeat = now - session.lastHeartbeat;
        const sessionTimeout = this.get("config")?.sessionTimeout ?? DEFAULT_SESSION_TIMEOUT_MS;
        if (timeSinceLastHeartbeat > sessionTimeout) {
          const canRecover = this.recoveryManager?.hasRecoverableSession() ?? false;
          if (canRecover && this.recoveryManager) {
            const sessionContext = {
              sessionId: session.sessionId,
              startTime: session.startTime,
              lastActivity: session.lastHeartbeat,
              tabCount: 1,
              recoveryAttempts: 0,
              metadata: {
                userAgent: navigator.userAgent,
                pageUrl: this.get("pageUrl")
              }
            };
            this.recoveryManager.storeSessionContextForRecovery(sessionContext);
            if (this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug") {
              debugLog.debug("SessionHandler", `Orphaned session stored for recovery: ${session.sessionId}`);
            }
          }
          this.trackSession(EventType.SESSION_END);
          this.clearPersistedSession();
          if (this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug") {
            debugLog.debug(
              "SessionHandler",
              `Orphaned session ended: ${session.sessionId}, recovery available: ${canRecover}`
            );
          }
        }
      } catch {
        this.clearPersistedSession();
      }
    }
  }
  persistSession(sessionId) {
    const sessionData = {
      sessionId,
      startTime: Date.now(),
      lastHeartbeat: Date.now()
    };
    this.storageManager.setItem(this.sessionStorageKey, JSON.stringify(sessionData));
  }
  clearPersistedSession() {
    this.storageManager.removeItem(this.sessionStorageKey);
  }
  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      const storedSessionData = this.storageManager.getItem(this.sessionStorageKey);
      if (storedSessionData) {
        try {
          const session = JSON.parse(storedSessionData);
          session.lastHeartbeat = Date.now();
          this.storageManager.setItem(this.sessionStorageKey, JSON.stringify(session));
        } catch {
          this.clearPersistedSession();
        }
      }
    }, SESSION_HEARTBEAT_INTERVAL_MS);
  }
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}
class PageViewHandler extends StateManager {
  eventManager;
  onTrack;
  originalPushState;
  originalReplaceState;
  constructor(eventManager, onTrack) {
    super();
    this.eventManager = eventManager;
    this.onTrack = onTrack;
  }
  startTracking() {
    debugLog.debug("PageViewHandler", "Starting page view tracking");
    this.trackInitialPageView();
    this.trackCurrentPage();
    window.addEventListener("popstate", this.trackCurrentPage);
    window.addEventListener("hashchange", this.trackCurrentPage);
    this.patchHistory("pushState");
    this.patchHistory("replaceState");
  }
  stopTracking() {
    debugLog.debug("PageViewHandler", "Stopping page view tracking");
    window.removeEventListener("popstate", this.trackCurrentPage);
    window.removeEventListener("hashchange", this.trackCurrentPage);
    if (this.originalPushState) {
      window.history.pushState = this.originalPushState;
    }
    if (this.originalReplaceState) {
      window.history.replaceState = this.originalReplaceState;
    }
  }
  patchHistory(method) {
    if (method === "pushState" && !this.originalPushState) {
      this.originalPushState = window.history.pushState;
    } else if (method === "replaceState" && !this.originalReplaceState) {
      this.originalReplaceState = window.history.replaceState;
    }
    const original = window.history[method];
    window.history[method] = (...args) => {
      original.apply(window.history, args);
      this.trackCurrentPage();
    };
  }
  trackCurrentPage = async () => {
    const rawUrl = window.location.href;
    const normalizedUrl = normalizeUrl(rawUrl, this.get("config").sensitiveQueryParams);
    if (this.get("pageUrl") !== normalizedUrl) {
      const fromUrl = this.get("pageUrl");
      debugLog.debug("PageViewHandler", "Page navigation detected", { from: fromUrl, to: normalizedUrl });
      await this.set("pageUrl", normalizedUrl);
      this.eventManager.track({
        type: EventType.PAGE_VIEW,
        page_url: this.get("pageUrl"),
        from_page_url: fromUrl,
        ...this.extractPageViewData() && { page_view: this.extractPageViewData() }
      });
      this.onTrack();
    }
  };
  trackInitialPageView() {
    this.eventManager.track({
      type: EventType.PAGE_VIEW,
      page_url: this.get("pageUrl"),
      ...this.extractPageViewData() && { page_view: this.extractPageViewData() }
    });
    this.onTrack();
  }
  extractPageViewData() {
    const location = window.location;
    const data = {
      ...document.referrer && { referrer: document.referrer },
      ...document.title && { title: document.title },
      ...location.pathname && { pathname: location.pathname },
      ...location.search && { search: location.search },
      ...location.hash && { hash: location.hash }
    };
    return Object.values(data).some((value) => !!value) ? data : void 0;
  }
}
class ClickHandler extends StateManager {
  eventManager;
  clickHandler;
  constructor(eventManager) {
    super();
    this.eventManager = eventManager;
  }
  startTracking() {
    if (this.clickHandler) {
      debugLog.debug("ClickHandler", "Click tracking already active");
      return;
    }
    debugLog.debug("ClickHandler", "Starting click tracking");
    this.clickHandler = (event2) => {
      const mouseEvent = event2;
      const target = mouseEvent.target;
      const clickedElement = target instanceof HTMLElement ? target : target instanceof Node && target.parentElement instanceof HTMLElement ? target.parentElement : null;
      if (!clickedElement) {
        debugLog.warn("ClickHandler", "Click target not found or not an element");
        return;
      }
      debugLog.info("ClickHandler", "🖱️ Click detected on element", {
        tagName: clickedElement.tagName,
        className: clickedElement.className || "none",
        textContent: clickedElement.textContent?.slice(0, 50) ?? "empty"
      });
      const trackingElement = this.findTrackingElement(clickedElement);
      const relevantClickElement = this.getRelevantClickElement(clickedElement);
      const coordinates = this.calculateClickCoordinates(mouseEvent, clickedElement);
      if (trackingElement) {
        const trackingData = this.extractTrackingData(trackingElement);
        if (trackingData) {
          const attributeData = this.createCustomEventData(trackingData);
          this.eventManager.track({
            type: EventType.CUSTOM,
            custom_event: {
              name: attributeData.name,
              ...attributeData.value && { metadata: { value: attributeData.value } }
            }
          });
        }
      }
      const clickData = this.generateClickData(clickedElement, relevantClickElement, coordinates);
      this.eventManager.track({
        type: EventType.CLICK,
        click_data: clickData
      });
    };
    window.addEventListener("click", this.clickHandler, true);
  }
  stopTracking() {
    if (this.clickHandler) {
      window.removeEventListener("click", this.clickHandler, true);
      this.clickHandler = void 0;
    }
  }
  findTrackingElement(element) {
    if (element.hasAttribute(`${HTML_DATA_ATTR_PREFIX}-name`)) {
      return element;
    }
    const closest = element.closest(`[${HTML_DATA_ATTR_PREFIX}-name]`);
    return closest || void 0;
  }
  getRelevantClickElement(element) {
    for (const selector of INTERACTIVE_SELECTORS) {
      try {
        if (element.matches(selector)) {
          return element;
        }
      } catch (error) {
        debugLog.warn("ClickHandler", "Invalid selector in interactive elements check", {
          selector,
          error: error instanceof Error ? error.message : "Unknown error"
        });
        continue;
      }
    }
    for (const selector of INTERACTIVE_SELECTORS) {
      try {
        const parent = element.closest(selector);
        if (parent) {
          return parent;
        }
      } catch (error) {
        debugLog.warn("ClickHandler", "Invalid selector in parent element search", {
          selector,
          error: error instanceof Error ? error.message : "Unknown error"
        });
        continue;
      }
    }
    return element;
  }
  calculateClickCoordinates(event2, element) {
    const rect = element.getBoundingClientRect();
    const x = event2.clientX;
    const y = event2.clientY;
    const relativeX = rect.width > 0 ? Math.max(0, Math.min(1, Number(((x - rect.left) / rect.width).toFixed(3)))) : 0;
    const relativeY = rect.height > 0 ? Math.max(0, Math.min(1, Number(((y - rect.top) / rect.height).toFixed(3)))) : 0;
    return { x, y, relativeX, relativeY };
  }
  extractTrackingData(trackingElement) {
    const name = trackingElement.getAttribute(`${HTML_DATA_ATTR_PREFIX}-name`);
    const value = trackingElement.getAttribute(`${HTML_DATA_ATTR_PREFIX}-value`);
    if (!name) {
      return void 0;
    }
    return {
      element: trackingElement,
      name,
      ...value && { value }
    };
  }
  generateClickData(clickedElement, relevantElement, coordinates) {
    const { x, y, relativeX, relativeY } = coordinates;
    const text = this.getRelevantText(clickedElement, relevantElement);
    const attributes = this.extractElementAttributes(relevantElement);
    const href = relevantElement.getAttribute("href");
    const title = relevantElement.getAttribute("title");
    const alt = relevantElement.getAttribute("alt");
    const role = relevantElement.getAttribute("role");
    const ariaLabel = relevantElement.getAttribute("aria-label");
    const className = typeof relevantElement.className === "string" ? relevantElement.className : String(relevantElement.className);
    return {
      x,
      y,
      relativeX,
      relativeY,
      tag: relevantElement.tagName.toLowerCase(),
      ...relevantElement.id && { id: relevantElement.id },
      ...relevantElement.className && { class: className },
      ...text && { text },
      ...href && { href },
      ...title && { title },
      ...alt && { alt },
      ...role && { role },
      ...ariaLabel && { ariaLabel },
      ...Object.keys(attributes).length > 0 && { dataAttributes: attributes }
    };
  }
  getRelevantText(clickedElement, relevantElement) {
    const LARGE_CONTAINER_TAGS = ["main", "section", "article", "body", "html", "header", "footer", "aside", "nav"];
    const clickedText = clickedElement.textContent?.trim() ?? "";
    const relevantText = relevantElement.textContent?.trim() ?? "";
    if (!clickedText && !relevantText) {
      return "";
    }
    if (clickedText && clickedText.length <= MAX_TEXT_LENGTH) {
      return clickedText;
    }
    const isLargeContainer = LARGE_CONTAINER_TAGS.includes(relevantElement.tagName.toLowerCase());
    const hasExcessiveText = relevantText.length > MAX_TEXT_LENGTH * 2;
    if (isLargeContainer && hasExcessiveText) {
      return clickedText && clickedText.length <= MAX_TEXT_LENGTH ? clickedText : "";
    }
    if (relevantText.length <= MAX_TEXT_LENGTH) {
      return relevantText;
    }
    if (clickedText && clickedText.length < relevantText.length * 0.1) {
      return clickedText.length <= MAX_TEXT_LENGTH ? clickedText : clickedText.slice(0, MAX_TEXT_LENGTH - 3) + "...";
    }
    return relevantText.slice(0, MAX_TEXT_LENGTH - 3) + "...";
  }
  extractElementAttributes(element) {
    const commonAttributes = ["id", "class", "data-testid", "aria-label", "title", "href", "type", "name"];
    const result = {};
    for (const attributeName of commonAttributes) {
      const value = element.getAttribute(attributeName);
      if (value) {
        result[attributeName] = value;
      }
    }
    return result;
  }
  createCustomEventData(trackingData) {
    return {
      name: trackingData.name,
      ...trackingData.value && { value: trackingData.value }
    };
  }
}
class ScrollHandler extends StateManager {
  eventManager;
  containers = [];
  constructor(eventManager) {
    super();
    this.eventManager = eventManager;
  }
  startTracking() {
    const raw = this.get("config").scrollContainerSelectors;
    const selectors = Array.isArray(raw) ? raw : typeof raw === "string" ? [raw] : [];
    debugLog.debug("ScrollHandler", "Starting scroll tracking", { selectorsCount: selectors.length });
    const elements = selectors.map((sel) => this.safeQuerySelector(sel)).filter((element) => element instanceof HTMLElement);
    if (elements.length === 0) {
      elements.push(window);
    }
    for (const element of elements) {
      this.setupScrollContainer(element);
    }
  }
  stopTracking() {
    debugLog.debug("ScrollHandler", "Stopping scroll tracking", { containersCount: this.containers.length });
    for (const container of this.containers) {
      if (container.debounceTimer) {
        clearTimeout(container.debounceTimer);
      }
      if (container.element instanceof Window) {
        window.removeEventListener("scroll", container.listener);
      } else {
        container.element.removeEventListener("scroll", container.listener);
      }
    }
    this.containers.length = 0;
  }
  setupScrollContainer(element) {
    if (element !== window && !this.isElementScrollable(element)) {
      return;
    }
    const container = {
      element,
      lastScrollPos: this.getScrollTop(element),
      debounceTimer: null,
      listener: () => {
      }
    };
    const handleScroll = async () => {
      if (this.get("suppressNextScroll")) {
        await this.set("suppressNextScroll", false);
        return;
      }
      if (container.debounceTimer) {
        clearTimeout(container.debounceTimer);
      }
      container.debounceTimer = window.setTimeout(() => {
        const scrollData = this.calculateScrollData(container);
        if (scrollData) {
          this.eventManager.track({
            type: EventType.SCROLL,
            scroll_data: scrollData
          });
        }
        container.debounceTimer = null;
      }, SCROLL_DEBOUNCE_TIME_MS);
    };
    container.listener = handleScroll;
    this.containers.push(container);
    if (element instanceof Window) {
      window.addEventListener("scroll", handleScroll, { passive: true });
    } else {
      element.addEventListener("scroll", handleScroll, { passive: true });
    }
  }
  calculateScrollData(container) {
    const { element, lastScrollPos } = container;
    const scrollTop = this.getScrollTop(element);
    const viewportHeight = this.getViewportHeight(element);
    const scrollHeight = this.getScrollHeight(element);
    if (element === window && scrollHeight <= viewportHeight) {
      return null;
    }
    const direction = scrollTop > lastScrollPos ? ScrollDirection.DOWN : ScrollDirection.UP;
    const depth = scrollHeight > viewportHeight ? Math.min(100, Math.max(0, Math.floor(scrollTop / (scrollHeight - viewportHeight) * 100))) : 0;
    const positionDelta = Math.abs(scrollTop - lastScrollPos);
    if (positionDelta < SIGNIFICANT_SCROLL_DELTA) {
      return null;
    }
    container.lastScrollPos = scrollTop;
    return { depth, direction };
  }
  getScrollTop(element) {
    return element instanceof Window ? window.scrollY : element.scrollTop;
  }
  getViewportHeight(element) {
    return element instanceof Window ? window.innerHeight : element.clientHeight;
  }
  getScrollHeight(element) {
    return element instanceof Window ? document.documentElement.scrollHeight : element.scrollHeight;
  }
  isElementScrollable(element) {
    const style = getComputedStyle(element);
    const hasScrollableOverflow = style.overflowY === "auto" || style.overflowY === "scroll" || style.overflowX === "auto" || style.overflowX === "scroll" || style.overflow === "auto" || style.overflow === "scroll";
    const hasOverflowContent = element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth;
    return hasScrollableOverflow && hasOverflowContent;
  }
  safeQuerySelector(selector) {
    try {
      return document.querySelector(selector);
    } catch (error) {
      debugLog.clientWarn("ScrollHandler", "Invalid CSS selector", {
        selector,
        error: error instanceof Error ? error.message : "Unknown error"
      });
      return null;
    }
  }
}
class GoogleAnalyticsIntegration extends StateManager {
  isInitialized = false;
  constructor() {
    super();
  }
  async initialize() {
    if (this.isInitialized) {
      return;
    }
    const measurementId = this.get("config").integrations?.googleAnalytics?.measurementId;
    if (!measurementId?.trim()) {
      debugLog.clientWarn("GoogleAnalytics", "Google Analytics integration disabled - measurementId not configured", {
        hasIntegrations: !!this.get("config").integrations,
        hasGoogleAnalytics: !!this.get("config").integrations?.googleAnalytics
      });
      return;
    }
    const userId = this.get("userId");
    if (!userId?.trim()) {
      debugLog.warn("GoogleAnalytics", "Google Analytics initialization delayed - userId not available", {
        measurementId: measurementId.substring(0, 8) + "..."
      });
      return;
    }
    try {
      if (this.isScriptAlreadyLoaded()) {
        debugLog.info("GoogleAnalytics", "Google Analytics script already loaded", { measurementId });
        this.isInitialized = true;
        return;
      }
      await this.loadScript(measurementId);
      this.configureGtag(measurementId, userId);
      this.isInitialized = true;
      debugLog.info("GoogleAnalytics", "Google Analytics integration initialized successfully", {
        measurementId,
        userId
      });
    } catch (error) {
      debugLog.error("GoogleAnalytics", "Google Analytics initialization failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        measurementId,
        userId
      });
    }
  }
  trackEvent(eventName, metadata) {
    if (!eventName?.trim()) {
      debugLog.clientWarn("GoogleAnalytics", "Event tracking skipped - invalid event name provided", {
        eventName,
        hasMetadata: !!metadata && Object.keys(metadata).length > 0
      });
      return;
    }
    if (!this.isInitialized) {
      return;
    }
    if (typeof window.gtag !== "function") {
      debugLog.warn("GoogleAnalytics", "Event tracking failed - gtag function not available", {
        eventName,
        hasGtag: typeof window.gtag,
        hasDataLayer: Array.isArray(window.dataLayer)
      });
      return;
    }
    try {
      window.gtag("event", eventName, metadata);
    } catch (error) {
      debugLog.error("GoogleAnalytics", "Event tracking failed", {
        eventName,
        error: error instanceof Error ? error.message : "Unknown error",
        metadataKeys: Object.keys(metadata || {})
      });
    }
  }
  cleanup() {
    this.isInitialized = false;
    const script = document.getElementById("tracelog-ga-script");
    if (script) {
      script.remove();
    }
    debugLog.info("GoogleAnalytics", "Google Analytics integration cleanup completed");
  }
  isScriptAlreadyLoaded() {
    const tracelogScript = document.getElementById("tracelog-ga-script");
    if (tracelogScript) {
      return true;
    }
    const existingGAScript = document.querySelector('script[src*="googletagmanager.com/gtag/js"]');
    if (existingGAScript) {
      debugLog.clientWarn("GoogleAnalytics", "Google Analytics script already loaded from external source", {
        scriptSrc: existingGAScript.getAttribute("src"),
        hasGtag: typeof window.gtag === "function"
      });
      return true;
    }
    return false;
  }
  async loadScript(measurementId) {
    return new Promise((resolve, reject) => {
      try {
        const script = document.createElement("script");
        script.id = "tracelog-ga-script";
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
        script.onload = () => {
          resolve();
        };
        script.onerror = () => {
          const error = new Error("Failed to load Google Analytics script");
          debugLog.error("GoogleAnalytics", "Google Analytics script load failed", {
            measurementId,
            error: error.message,
            scriptSrc: script.src
          });
          reject(error);
        };
        document.head.appendChild(script);
      } catch (error) {
        const errorMsg = error instanceof Error ? error : new Error(String(error));
        debugLog.error("GoogleAnalytics", "Error creating Google Analytics script", {
          measurementId,
          error: errorMsg.message
        });
        reject(errorMsg);
      }
    });
  }
  configureGtag(measurementId, userId) {
    try {
      const gaScriptConfig = document.createElement("script");
      gaScriptConfig.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${measurementId}', {
          'user_id': '${userId}'
        });
      `;
      document.head.appendChild(gaScriptConfig);
    } catch (error) {
      debugLog.error("GoogleAnalytics", "Failed to configure Google Analytics", {
        measurementId,
        userId,
        error: error instanceof Error ? error.message : "Unknown error"
      });
      throw error;
    }
  }
}
class StorageManager {
  storage = null;
  fallbackStorage = /* @__PURE__ */ new Map();
  storageAvailable = false;
  constructor() {
    this.storage = this.init();
    this.storageAvailable = this.storage !== null;
    if (!this.storageAvailable) {
      debugLog.warn("StorageManager", "localStorage not available, using memory fallback");
    }
  }
  getItem(key) {
    if (!this.storageAvailable) {
      return this.fallbackStorage.get(key) ?? null;
    }
    try {
      if (this.storage) {
        return this.storage.getItem(key);
      }
      return this.fallbackStorage.get(key) ?? null;
    } catch (error) {
      debugLog.warn("StorageManager", "Storage getItem failed, using memory fallback", { key, error });
      this.storageAvailable = false;
      return this.fallbackStorage.get(key) ?? null;
    }
  }
  setItem(key, value) {
    if (!this.storageAvailable) {
      this.fallbackStorage.set(key, value);
      return;
    }
    try {
      if (this.storage) {
        this.storage.setItem(key, value);
      } else {
        this.fallbackStorage.set(key, value);
      }
    } catch (error) {
      const shouldRetry = this.handleStorageError(error, key, "set");
      if (shouldRetry) {
        try {
          this.storage?.setItem(key, value);
          return;
        } catch (retryError) {
          debugLog.warn("StorageManager", "Storage retry failed, using memory fallback", { key, retryError });
        }
      }
      debugLog.warn("StorageManager", "Storage setItem failed, using memory fallback", { key, error });
      this.storageAvailable = false;
      this.fallbackStorage.set(key, value);
    }
  }
  removeItem(key) {
    if (!this.storageAvailable) {
      this.fallbackStorage.delete(key);
      return;
    }
    try {
      if (this.storage) {
        this.storage.removeItem(key);
        return;
      }
      this.fallbackStorage.delete(key);
    } catch (error) {
      debugLog.warn("StorageManager", "Storage removeItem failed, using memory fallback", { key, error });
      this.storageAvailable = false;
      this.fallbackStorage.delete(key);
    }
  }
  performStorageCleanup() {
    try {
      const keysToClean = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("tracelog_")) {
          try {
            const data = JSON.parse(localStorage.getItem(key) ?? "{}");
            const age = Date.now() - (data.timestamp ?? 0);
            if (age > 24 * 60 * 60 * 1e3) {
              keysToClean.push(key);
            }
          } catch {
            keysToClean.push(key);
          }
        }
      }
      keysToClean.forEach((key) => localStorage.removeItem(key));
      debugLog.info("StorageManager", "Storage cleanup completed", {
        keysRemoved: keysToClean.length
      });
      return keysToClean.length > 0;
    } catch (error) {
      debugLog.error("StorageManager", "Storage cleanup failed", { error });
      return false;
    }
  }
  handleStorageError(error, key, operation) {
    if (error.name === "QuotaExceededError") {
      debugLog.warn("StorageManager", "Storage quota exceeded, attempting cleanup", { key, operation });
      const cleanupSuccess = this.performStorageCleanup();
      if (cleanupSuccess && operation === "set") {
        debugLog.info("StorageManager", "Retrying storage operation after cleanup", { key });
        return true;
      }
    }
    return false;
  }
  init() {
    try {
      const test = "__storage_test__";
      const storage = window["localStorage"];
      storage.setItem(test, test);
      storage.removeItem(test);
      return storage;
    } catch {
      return null;
    }
  }
}
class PerformanceHandler extends StateManager {
  eventManager;
  reportedByNav = /* @__PURE__ */ new Map();
  observers = [];
  lastLongTaskSentAt = 0;
  constructor(eventManager) {
    super();
    this.eventManager = eventManager;
  }
  async startTracking() {
    debugLog.debug("PerformanceHandler", "Starting performance tracking");
    await this.initWebVitals();
    this.observeLongTasks();
    this.reportTTFB();
  }
  stopTracking() {
    debugLog.debug("PerformanceHandler", "Stopping performance tracking", { observersCount: this.observers.length });
    this.observers.forEach((obs, index) => {
      try {
        obs.disconnect();
      } catch (error) {
        debugLog.warn("PerformanceHandler", "Failed to disconnect performance observer", {
          error: error instanceof Error ? error.message : "Unknown error",
          observerIndex: index
        });
      }
    });
    this.observers.length = 0;
    this.reportedByNav.clear();
    debugLog.debug("PerformanceHandler", "Performance tracking cleanup completed", {
      remainingObservers: this.observers.length,
      clearedNavReports: true
    });
  }
  observeWebVitalsFallback() {
    this.reportTTFB();
    this.safeObserve(
      "largest-contentful-paint",
      (list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (!last) {
          return;
        }
        this.sendVital({ type: "LCP", value: Number(last.startTime.toFixed(PRECISION_TWO_DECIMALS)) });
      },
      { type: "largest-contentful-paint", buffered: true },
      true
    );
    let clsValue = 0;
    this.safeObserve(
      "layout-shift",
      (list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          if (entry.hadRecentInput === true) {
            continue;
          }
          const value = typeof entry.value === "number" ? entry.value : 0;
          clsValue += value;
        }
        this.sendVital({ type: "CLS", value: Number(clsValue.toFixed(PRECISION_FOUR_DECIMALS)) });
      },
      { type: "layout-shift", buffered: true }
    );
    this.safeObserve(
      "paint",
      (list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === "first-contentful-paint") {
            this.sendVital({ type: "FCP", value: Number(entry.startTime.toFixed(PRECISION_TWO_DECIMALS)) });
          }
        }
      },
      { type: "paint", buffered: true },
      true
    );
    this.safeObserve(
      "event",
      (list) => {
        let worst = 0;
        const entries = list.getEntries();
        for (const entry of entries) {
          const dur = (entry.processingEnd ?? 0) - (entry.startTime ?? 0);
          worst = Math.max(worst, dur);
        }
        if (worst > 0) {
          this.sendVital({ type: "INP", value: Number(worst.toFixed(PRECISION_TWO_DECIMALS)) });
        }
      },
      { type: "event", buffered: true }
    );
  }
  async initWebVitals() {
    try {
      const { onLCP, onCLS, onFCP, onTTFB, onINP } = await import("./web-vitals-Dz7_abrn.mjs");
      const report = (type) => (metric) => {
        const value = Number(metric.value.toFixed(PRECISION_TWO_DECIMALS));
        this.sendVital({ type, value });
      };
      onLCP(report("LCP"));
      onCLS(report("CLS"));
      onFCP(report("FCP"));
      onTTFB(report("TTFB"));
      onINP(report("INP"));
    } catch (error) {
      debugLog.warn("PerformanceHandler", "Failed to load web-vitals library, using fallback", {
        error: error instanceof Error ? error.message : "Unknown error"
      });
      this.observeWebVitalsFallback();
    }
  }
  reportTTFB() {
    try {
      const nav = performance.getEntriesByType("navigation")[0];
      if (!nav) {
        debugLog.debug("PerformanceHandler", "Navigation timing not available for TTFB");
        return;
      }
      const ttfb = nav.responseStart;
      if (typeof ttfb === "number" && Number.isFinite(ttfb)) {
        this.sendVital({ type: "TTFB", value: Number(ttfb.toFixed(PRECISION_TWO_DECIMALS)) });
      } else {
        debugLog.debug("PerformanceHandler", "TTFB value is not a valid number", { ttfb });
      }
    } catch (error) {
      debugLog.warn("PerformanceHandler", "Failed to report TTFB", {
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
  observeLongTasks() {
    this.safeObserve(
      "longtask",
      (list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          const duration = Number(entry.duration.toFixed(PRECISION_TWO_DECIMALS));
          const now = Date.now();
          if (now - this.lastLongTaskSentAt >= LONG_TASK_THROTTLE_MS) {
            this.trackWebVital("LONG_TASK", duration);
            this.lastLongTaskSentAt = now;
          }
        }
      },
      { type: "longtask", buffered: true }
    );
  }
  sendVital(sample) {
    const navId = this.getNavigationId();
    const key = `${sample.type}`;
    if (navId) {
      if (!this.reportedByNav.has(navId)) {
        this.reportedByNav.set(navId, /* @__PURE__ */ new Set());
      }
      const sent = this.reportedByNav.get(navId);
      if (sent.has(key)) {
        return;
      }
      sent.add(key);
    }
    this.trackWebVital(sample.type, sample.value);
  }
  trackWebVital(type, value) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      debugLog.warn("PerformanceHandler", "Invalid web vital value", { type, value });
      return;
    }
    this.eventManager.track({
      type: EventType.WEB_VITALS,
      web_vitals: {
        type,
        value
      }
    });
  }
  getNavigationId() {
    try {
      const nav = performance.getEntriesByType("navigation")[0];
      if (!nav) {
        return null;
      }
      return `${Math.round(nav.startTime)}_${window.location.pathname}`;
    } catch (error) {
      debugLog.warn("PerformanceHandler", "Failed to get navigation ID", {
        error: error instanceof Error ? error.message : "Unknown error"
      });
      return null;
    }
  }
  safeObserve(type, cb, options, once = false) {
    try {
      if (typeof PerformanceObserver === "undefined") return;
      const supported = PerformanceObserver.supportedEntryTypes;
      if (supported && !supported.includes(type)) return;
      const obs = new PerformanceObserver((list, observer) => {
        cb(list, observer);
        if (once) {
          try {
            observer.disconnect();
          } catch {
          }
        }
      });
      obs.observe(options ?? { type, buffered: true });
      if (!once) {
        this.observers.push(obs);
      }
    } catch (error) {
      debugLog.warn("PerformanceHandler", "Failed to create performance observer", {
        type,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
}
class ErrorHandler extends StateManager {
  eventManager;
  piiPatterns = [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    /\b[A-Z]{2}\d{2}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g
  ];
  constructor(eventManager) {
    super();
    this.eventManager = eventManager;
  }
  startTracking() {
    debugLog.debug("ErrorHandler", "Starting error tracking");
    this.setupErrorListener();
    this.setupUnhandledRejectionListener();
  }
  stopTracking() {
    debugLog.debug("ErrorHandler", "Stopping error tracking");
    window.removeEventListener("error", this.handleError);
    window.removeEventListener("unhandledrejection", this.handleUnhandledRejection);
  }
  setupErrorListener() {
    window.addEventListener("error", this.handleError);
  }
  setupUnhandledRejectionListener() {
    window.addEventListener("unhandledrejection", this.handleUnhandledRejection);
  }
  handleError = (event2) => {
    const config = this.get("config");
    if (!this.shouldSample(config?.errorSampling ?? 0.1)) {
      debugLog.debug("ErrorHandler", `Error not sampled, skipping (errorSampling: ${config?.errorSampling})`, {
        errorSampling: config?.errorSampling
      });
      return;
    }
    debugLog.warn(
      "ErrorHandler",
      `JavaScript error captured: ${event2.message} (filename: ${event2.filename}, lineno: ${event2.lineno})`,
      {
        message: event2.message,
        filename: event2.filename,
        lineno: event2.lineno
      }
    );
    this.eventManager.track({
      type: EventType.ERROR,
      error_data: {
        type: ErrorType.JS_ERROR,
        message: this.sanitizeText(event2.message || "Unknown error")
      }
    });
  };
  handleUnhandledRejection = (event2) => {
    const config = this.get("config");
    if (!this.shouldSample(config?.errorSampling ?? 0.1)) {
      debugLog.debug("ErrorHandler", "Promise rejection not sampled, skipping", {
        errorSampling: config?.errorSampling
      });
      return;
    }
    debugLog.warn("ErrorHandler", `Unhandled promise rejection captured (reason: ${typeof event2.reason})`, {
      reason: typeof event2.reason
    });
    let reason = "Unknown rejection";
    if (event2.reason) {
      if (typeof event2.reason === "string") {
        reason = event2.reason;
      } else if (event2.reason instanceof Error) {
        reason = event2.reason.message || event2.reason.toString();
      } else {
        reason = String(event2.reason);
      }
    }
    this.eventManager.track({
      type: EventType.ERROR,
      error_data: {
        type: ErrorType.PROMISE_REJECTION,
        message: this.sanitizeText(reason)
      }
    });
  };
  sanitizeText(text) {
    let sanitized = text;
    for (const pattern of this.piiPatterns) {
      sanitized = sanitized.replace(pattern, "[REDACTED]");
    }
    return sanitized;
  }
  shouldSample(rate) {
    return Math.random() < rate;
  }
}
class NetworkHandler extends StateManager {
  eventManager;
  originalXHROpen;
  originalXHRSend;
  constructor(eventManager) {
    super();
    this.eventManager = eventManager;
    this.originalXHROpen = XMLHttpRequest.prototype.open;
    this.originalXHRSend = XMLHttpRequest.prototype.send;
  }
  startTracking() {
    debugLog.debug("NetworkHandler", "Starting network error tracking");
    this.interceptXHR();
  }
  stopTracking() {
    debugLog.debug("NetworkHandler", "Stopping network error tracking");
    XMLHttpRequest.prototype.open = this.originalXHROpen;
    XMLHttpRequest.prototype.send = this.originalXHRSend;
  }
  interceptXHR() {
    const trackNetworkError = this.trackNetworkError.bind(this);
    const normalizeUrlForTracking = this.normalizeUrlForTracking.bind(this);
    const originalXHROpen = this.originalXHROpen;
    const originalXHRSend = this.originalXHRSend;
    XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
      const asyncMode = async ?? true;
      const extendedThis = this;
      extendedThis._tracelogStartTime = Date.now();
      extendedThis._tracelogMethod = method.toUpperCase();
      extendedThis._tracelogUrl = url.toString();
      return originalXHROpen.call(this, method, url, asyncMode, user, password);
    };
    XMLHttpRequest.prototype.send = function(body) {
      const xhr = this;
      const startTime = xhr._tracelogStartTime ?? Date.now();
      const method = xhr._tracelogMethod ?? "GET";
      const url = xhr._tracelogUrl ?? "";
      const originalOnReadyStateChange = xhr.onreadystatechange;
      xhr.onreadystatechange = (ev) => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          const duration = Date.now() - startTime;
          const isCollectEndpoint = url.includes("/collect") || url.includes("/config");
          if ((xhr.status === 0 || xhr.status >= 400) && !isCollectEndpoint) {
            const statusText = xhr.statusText || "Request Failed";
            debugLog.debug("NetworkHandler", "XHR error detected", {
              method,
              url: normalizeUrlForTracking(url),
              status: xhr.status,
              statusText
            });
            trackNetworkError(method, normalizeUrlForTracking(url), xhr.status, statusText, duration);
          }
        }
        if (originalOnReadyStateChange) {
          return originalOnReadyStateChange.call(xhr, ev);
        }
      };
      return originalXHRSend.call(this, body);
    };
  }
  trackNetworkError(method, url, status, statusText, duration) {
    const config = this.get("config");
    if (!this.shouldSample(config?.errorSampling ?? 0.1)) {
      debugLog.debug(
        "NetworkHandler",
        `Network error not sampled, skipping (errorSampling: ${config?.errorSampling}, method: ${method}, url: ${url})`,
        {
          errorSampling: config?.errorSampling,
          method,
          url
        }
      );
      return;
    }
    debugLog.warn(
      "NetworkHandler",
      `Network error tracked: ${method} ${url} (status: ${status}, statusText: ${statusText}, duration: ${duration}ms)`,
      { method, url, status, statusText, duration }
    );
    this.eventManager.track({
      type: EventType.ERROR,
      error_data: {
        type: ErrorType.NETWORK_ERROR,
        message: statusText,
        method,
        url,
        status,
        statusText,
        duration
      }
    });
  }
  normalizeUrlForTracking(url) {
    try {
      const config = this.get("config");
      return normalizeUrl(url, config?.sensitiveQueryParams);
    } catch {
      return url;
    }
  }
  shouldSample(rate) {
    return Math.random() < rate;
  }
}
class App extends StateManager {
  isInitialized = false;
  googleAnalytics = null;
  storageManager;
  eventManager;
  sessionHandler;
  pageViewHandler;
  clickHandler;
  scrollHandler;
  performanceHandler;
  errorHandler;
  networkHandler;
  suppressNextScrollTimer = null;
  /**
   * Returns the initialization status of the app
   * @returns true if the app is fully initialized, false otherwise
   */
  get initialized() {
    return this.isInitialized;
  }
  async init(appConfig) {
    if (this.isInitialized) {
      debugLog.debug("App", "App already initialized, skipping re-initialization", { projectId: appConfig.id });
      return;
    }
    debugLog.info("App", "App initialization started", { projectId: appConfig.id });
    try {
      debugLog.debug("App", "Initializing storage manager");
      this.initStorage();
      this.validateStorageManager();
      debugLog.debug("App", "Setting application state");
      await this.setState(appConfig);
      this.validateState();
      debugLog.debug("App", "Setting integrations");
      await this.setIntegrations();
      debugLog.debug("App", "Initializing event manager");
      this.setEventManager();
      this.validateEventManager();
      debugLog.debug("App", "Initializing handlers");
      await this.initHandlers();
      this.validateHandlersInitialized();
      debugLog.debug("App", "Recovering persisted events");
      await this.eventManager.recoverPersistedEvents();
      this.isInitialized = true;
      debugLog.info("App", "App initialization completed successfully", {
        projectId: appConfig.id
      });
    } catch (error) {
      this.isInitialized = false;
      debugLog.error("App", "App initialization failed, performing rollback", { projectId: appConfig.id, error });
      await this.rollbackInitialization();
      throw error;
    }
  }
  /**
   * Validates that StorageManager was properly initialized
   * @throws {Error} If StorageManager is not initialized
   */
  validateStorageManager() {
    if (!this.storageManager) {
      debugLog.error("App", "StorageManager validation failed - not initialized");
      throw new Error("StorageManager initialization failed");
    }
  }
  /**
   * Validates that required state properties are set
   * @throws {Error} If required state is missing
   */
  validateState() {
    const missingState = [];
    if (!this.get("apiUrl")) {
      missingState.push("apiUrl");
    }
    if (!this.get("config")) {
      missingState.push("config");
    }
    if (!this.get("userId")) {
      missingState.push("userId");
    }
    if (!this.get("device")) {
      missingState.push("device");
    }
    if (!this.get("pageUrl")) {
      missingState.push("pageUrl");
    }
    if (missingState.length > 0) {
      debugLog.error("App", "State validation failed - missing required properties", { missingState });
      throw new Error(`State initialization failed - missing: ${missingState.join(", ")}`);
    }
  }
  /**
   * Validates that EventManager was properly initialized
   * @throws {Error} If EventManager is not initialized
   */
  validateEventManager() {
    if (!this.eventManager) {
      debugLog.error("App", "EventManager validation failed - not initialized");
      throw new Error("EventManager initialization failed");
    }
  }
  /**
   * Validates that all required handlers are initialized
   * @throws {Error} If any required handler is missing
   */
  validateHandlersInitialized() {
    const requiredHandlers = [
      { name: "sessionHandler", handler: this.sessionHandler },
      { name: "scrollHandler", handler: this.scrollHandler },
      { name: "pageViewHandler", handler: this.pageViewHandler },
      { name: "clickHandler", handler: this.clickHandler },
      { name: "performanceHandler", handler: this.performanceHandler },
      { name: "errorHandler", handler: this.errorHandler },
      { name: "networkHandler", handler: this.networkHandler }
    ];
    const missingHandlers = [];
    for (const { name, handler } of requiredHandlers) {
      if (!handler) {
        missingHandlers.push(name);
      }
    }
    if (missingHandlers.length > 0) {
      debugLog.error("App", "Handlers validation failed - missing required handlers", { missingHandlers });
      throw new Error(`Handlers initialization failed - missing: ${missingHandlers.join(", ")}`);
    }
  }
  /**
   * Performs cleanup rollback when initialization fails
   * Safely cleans up any partially initialized components
   */
  async rollbackInitialization() {
    debugLog.info("App", "Rollback initialization started");
    try {
      if (this.googleAnalytics) {
        debugLog.debug("App", "Cleaning up Google Analytics integration");
        try {
          this.googleAnalytics.cleanup();
        } catch (error) {
          debugLog.warn("App", "Google Analytics cleanup failed during rollback", { error });
        }
        this.googleAnalytics = null;
      }
      if (this.sessionHandler) {
        debugLog.debug("App", "Stopping session handler");
        try {
          await this.sessionHandler.stopTracking();
        } catch (error) {
          debugLog.warn("App", "Session handler cleanup failed during rollback", { error });
        }
      }
      if (this.pageViewHandler) {
        debugLog.debug("App", "Stopping page view handler");
        try {
          this.pageViewHandler.stopTracking();
        } catch (error) {
          debugLog.warn("App", "Page view handler cleanup failed during rollback", { error });
        }
      }
      if (this.clickHandler) {
        debugLog.debug("App", "Stopping click handler");
        try {
          this.clickHandler.stopTracking();
        } catch (error) {
          debugLog.warn("App", "Click handler cleanup failed during rollback", { error });
        }
      }
      if (this.scrollHandler) {
        debugLog.debug("App", "Stopping scroll handler");
        try {
          this.scrollHandler.stopTracking();
        } catch (error) {
          debugLog.warn("App", "Scroll handler cleanup failed during rollback", { error });
        }
      }
      if (this.performanceHandler) {
        debugLog.debug("App", "Stopping performance handler");
        try {
          this.performanceHandler.stopTracking();
        } catch (error) {
          debugLog.warn("App", "Performance handler cleanup failed during rollback", { error });
        }
      }
      if (this.errorHandler) {
        debugLog.debug("App", "Stopping error handler");
        try {
          this.errorHandler.stopTracking();
        } catch (error) {
          debugLog.warn("App", "Error handler cleanup failed during rollback", { error });
        }
      }
      if (this.networkHandler) {
        debugLog.debug("App", "Stopping network handler");
        try {
          this.networkHandler.stopTracking();
        } catch (error) {
          debugLog.warn("App", "Network handler cleanup failed during rollback", { error });
        }
      }
      if (this.suppressNextScrollTimer) {
        debugLog.debug("App", "Clearing scroll suppression timer");
        clearTimeout(this.suppressNextScrollTimer);
        this.suppressNextScrollTimer = null;
      }
      if (this.eventManager) {
        debugLog.debug("App", "Stopping event manager");
        try {
          this.eventManager.stop();
        } catch (error) {
          debugLog.warn("App", "Event manager cleanup failed during rollback", { error });
        }
      }
      debugLog.debug("App", "Resetting state properties");
      await this.set("hasStartSession", false);
      await this.set("suppressNextScroll", false);
      await this.set("sessionId", null);
      debugLog.info("App", "Rollback initialization completed");
    } catch (error) {
      debugLog.error("App", "Rollback initialization failed", { error });
    }
  }
  sendCustomEvent(name, metadata) {
    if (!this.eventManager) {
      debugLog.warn("App", "Custom event attempted before eventManager initialization", { eventName: name });
      return;
    }
    const { valid, error, sanitizedMetadata } = isEventValid(name, metadata);
    if (valid) {
      debugLog.debug("App", "Custom event validated and queued", { eventName: name, hasMetadata: !!sanitizedMetadata });
      this.eventManager.track({
        type: EventType.CUSTOM,
        custom_event: {
          name,
          ...sanitizedMetadata && { metadata: sanitizedMetadata }
        }
      });
    } else {
      const currentMode = this.get("config")?.mode;
      debugLog.clientError("App", `Custom event validation failed: ${error ?? "unknown error"}`, {
        eventName: name,
        validationError: error,
        hasMetadata: !!metadata,
        mode: currentMode
      });
      if (currentMode === "qa" || currentMode === "debug") {
        throw new Error(
          `custom event "${name}" validation failed (${error ?? "unknown error"}). Please, review your event data and try again.`
        );
      }
    }
  }
  /**
   * Gets current error recovery statistics for monitoring purposes
   * @returns Object with recovery statistics and system status
   */
  getRecoveryStats() {
    if (!this.eventManager) {
      debugLog.warn("App", "Recovery stats requested before eventManager initialization");
      return null;
    }
    return this.eventManager.getRecoveryStats();
  }
  /**
   * Triggers manual system recovery to attempt fixing error states
   * @returns Promise that resolves when recovery attempt is complete
   */
  async attemptSystemRecovery() {
    if (!this.eventManager) {
      debugLog.warn("App", "System recovery attempted before eventManager initialization");
      return;
    }
    debugLog.info("App", "Manual system recovery triggered");
    await this.eventManager.attemptSystemRecovery();
  }
  /**
   * Triggers aggressive fingerprint cleanup to free memory
   */
  aggressiveFingerprintCleanup() {
    if (!this.eventManager) {
      debugLog.warn("App", "Fingerprint cleanup attempted before eventManager initialization");
      return;
    }
    debugLog.info("App", "Manual fingerprint cleanup triggered");
    this.eventManager.aggressiveFingerprintCleanup();
  }
  async destroy() {
    if (!this.isInitialized) {
      debugLog.warn("App", "Destroy called but app was not initialized");
      return;
    }
    debugLog.info("App", "App cleanup started");
    if (this.googleAnalytics) {
      this.googleAnalytics.cleanup();
    }
    if (this.sessionHandler) {
      await this.sessionHandler.stopTracking();
    }
    if (this.pageViewHandler) {
      this.pageViewHandler.stopTracking();
    }
    if (this.clickHandler) {
      this.clickHandler.stopTracking();
    }
    if (this.scrollHandler) {
      this.scrollHandler.stopTracking();
    }
    if (this.performanceHandler) {
      this.performanceHandler.stopTracking();
    }
    if (this.errorHandler) {
      this.errorHandler.stopTracking();
    }
    if (this.networkHandler) {
      this.networkHandler.stopTracking();
    }
    if (this.suppressNextScrollTimer) {
      clearTimeout(this.suppressNextScrollTimer);
      this.suppressNextScrollTimer = null;
    }
    if (this.eventManager) {
      this.eventManager.stop();
    }
    await this.set("hasStartSession", false);
    await this.set("suppressNextScroll", false);
    await this.set("sessionId", null);
    this.isInitialized = false;
    debugLog.info("App", "App cleanup completed successfully");
  }
  async setState(appConfig) {
    await this.setApiUrl(appConfig.id, appConfig.allowHttp);
    await this.setConfig(appConfig);
    await this.setUserId();
    await this.setDevice();
    await this.setPageUrl();
  }
  async setApiUrl(id, allowHttp = false) {
    const apiManager = new ApiManager();
    await this.set("apiUrl", apiManager.getUrl(id, allowHttp));
  }
  async setConfig(appConfig) {
    const configManager = new ConfigManager();
    try {
      const config = await configManager.get(this.get("apiUrl"), appConfig);
      await this.set("config", config);
    } catch (error) {
      debugLog.clientError("App", "CONFIG LOAD FAILED", { error });
      throw error;
    }
  }
  async setUserId() {
    const userManager = new UserManager(this.storageManager);
    const userId = userManager.getId();
    await this.set("userId", userId);
  }
  async setDevice() {
    const device = getDeviceType();
    await this.set("device", device);
  }
  async setPageUrl() {
    const initialUrl = normalizeUrl(window.location.href, this.get("config").sensitiveQueryParams);
    await this.set("pageUrl", initialUrl);
  }
  async setIntegrations() {
    const isIPExcluded = this.get("config").ipExcluded;
    const measurementId = this.get("config").integrations?.googleAnalytics?.measurementId;
    if (!isIPExcluded && measurementId?.trim()) {
      this.googleAnalytics = new GoogleAnalyticsIntegration();
      await this.googleAnalytics.initialize();
    }
  }
  async initHandlers() {
    if (!this.eventManager) {
      throw new Error("EventManager must be initialized before handlers");
    }
    if (!this.storageManager) {
      throw new Error("StorageManager must be initialized before handlers");
    }
    this.initSessionHandler();
    this.initScrollHandler();
    this.initPageViewHandler();
    this.initClickHandler();
    await this.initPerformanceHandler();
    this.initErrorHandler();
    this.initNetworkHandler();
  }
  initStorage() {
    this.storageManager = new StorageManager();
  }
  setEventManager() {
    if (!this.storageManager) {
      throw new Error("StorageManager must be initialized before EventManager");
    }
    this.eventManager = new EventManager(this.storageManager, this.googleAnalytics);
  }
  initSessionHandler() {
    if (!this.storageManager || !this.eventManager) {
      throw new Error("StorageManager and EventManager must be initialized before SessionHandler");
    }
    this.sessionHandler = new SessionHandler(this.storageManager, this.eventManager);
    this.sessionHandler.startTracking();
  }
  initScrollHandler() {
    if (!this.eventManager) {
      throw new Error("EventManager must be initialized before ScrollHandler");
    }
    this.scrollHandler = new ScrollHandler(this.eventManager);
    this.scrollHandler.startTracking();
  }
  initPageViewHandler() {
    if (!this.eventManager) {
      throw new Error("EventManager must be initialized before PageViewHandler");
    }
    const onPageViewTrack = async () => await this.onPageViewTrack();
    this.pageViewHandler = new PageViewHandler(this.eventManager, onPageViewTrack);
    this.pageViewHandler.startTracking();
  }
  async onPageViewTrack() {
    await this.set("suppressNextScroll", true);
    if (this.suppressNextScrollTimer) {
      clearTimeout(this.suppressNextScrollTimer);
      this.suppressNextScrollTimer = null;
    }
    this.suppressNextScrollTimer = window.setTimeout(async () => {
      await this.set("suppressNextScroll", false);
    }, SCROLL_DEBOUNCE_TIME_MS * SCROLL_SUPPRESSION_CONSTANTS.SUPPRESS_MULTIPLIER);
  }
  initClickHandler() {
    if (!this.eventManager) {
      throw new Error("EventManager must be initialized before ClickHandler");
    }
    this.clickHandler = new ClickHandler(this.eventManager);
    this.clickHandler.startTracking();
  }
  async initPerformanceHandler() {
    if (!this.eventManager) {
      throw new Error("EventManager must be initialized before PerformanceHandler");
    }
    this.performanceHandler = new PerformanceHandler(this.eventManager);
    await this.performanceHandler.startTracking();
  }
  initErrorHandler() {
    if (!this.eventManager) {
      throw new Error("EventManager must be initialized before ErrorHandler");
    }
    this.errorHandler = new ErrorHandler(this.eventManager);
    this.errorHandler.startTracking();
  }
  initNetworkHandler() {
    if (!this.eventManager) {
      throw new Error("EventManager must be initialized before NetworkHandler");
    }
    this.networkHandler = new NetworkHandler(this.eventManager);
    this.networkHandler.startTracking();
  }
}
const app_types = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  DeviceType,
  ErrorType,
  EventType,
  Mode,
  ScrollDirection,
  TagConditionOperator,
  TagConditionType,
  TagLogicalOperator
}, Symbol.toStringTag, { value: "Module" }));
const app_constants = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  DEFAULT_SESSION_TIMEOUT_MS
}, Symbol.toStringTag, { value: "Module" }));
let app = null;
let isInitializing = false;
let isDestroying = false;
const init = async (appConfig) => {
  try {
    debugLog.info("API", "Library initialization started", { id: appConfig.id });
    if (typeof window === "undefined" || typeof document === "undefined") {
      debugLog.clientError(
        "API",
        "Browser environment required - this library can only be used in a browser environment",
        {
          hasWindow: typeof window !== "undefined",
          hasDocument: typeof document !== "undefined"
        }
      );
      throw new Error("This library can only be used in a browser environment");
    }
    if (app) {
      debugLog.debug("API", "Library already initialized, skipping duplicate initialization", {
        projectId: appConfig.id
      });
      return;
    }
    if (isInitializing) {
      debugLog.debug("API", "Concurrent initialization detected, waiting for completion", { projectId: appConfig.id });
      const maxRetries = INITIALIZATION_CONSTANTS.MAX_CONCURRENT_RETRIES;
      const retryDelay = INITIALIZATION_CONSTANTS.CONCURRENT_RETRY_DELAY_MS;
      const globalTimeout = INITIALIZATION_CONSTANTS.INITIALIZATION_TIMEOUT_MS;
      const retryPromise = (async () => {
        let retries = 0;
        while (isInitializing && retries < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          retries++;
        }
        return retries;
      })();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(
            new InitializationTimeoutError(
              `Initialization exceeded ${globalTimeout}ms timeout - concurrent initialization took too long`,
              globalTimeout
            )
          );
        }, globalTimeout);
      });
      try {
        const retries = await Promise.race([retryPromise, timeoutPromise]);
        if (app) {
          debugLog.debug("API", "Concurrent initialization completed successfully", {
            projectId: appConfig.id,
            retriesUsed: retries
          });
          return;
        }
        if (isInitializing) {
          debugLog.error("API", "Initialization timeout - concurrent initialization took too long", {
            projectId: appConfig.id,
            retriesUsed: retries,
            maxRetries
          });
          throw new Error("App initialization timeout - concurrent initialization took too long");
        }
      } catch (error) {
        if (error instanceof InitializationTimeoutError) {
          debugLog.error("API", "Initialization global timeout exceeded", {
            projectId: appConfig.id,
            timeoutMs: globalTimeout
          });
        }
        throw error;
      }
    }
    isInitializing = true;
    debugLog.debug("API", "Validating and normalizing configuration", { projectId: appConfig.id });
    const validatedConfig = validateAndNormalizeConfig(appConfig);
    debugLog.debug("API", "Creating App instance", { projectId: validatedConfig.id });
    const instance = new App();
    await instance.init(validatedConfig);
    app = instance;
    debugLog.info("API", "Library initialization completed successfully", {
      projectId: validatedConfig.id
    });
  } catch (error) {
    if (app && !app.initialized) {
      try {
        await app.destroy();
      } catch (cleanupError) {
        debugLog.warn("API", "Failed to cleanup partially initialized app", { cleanupError });
      }
    }
    app = null;
    debugLog.error("API", "Initialization failed", { error });
    throw error;
  } finally {
    isInitializing = false;
  }
};
const event = (name, metadata) => {
  try {
    if (!app) {
      debugLog.clientError("API", "Custom event failed - Library not initialized. Please call TraceLog.init() first", {
        eventName: name,
        hasMetadata: !!metadata
      });
      throw new Error("App not initialized");
    }
    debugLog.debug("API", "Sending custom event", {
      eventName: name,
      hasMetadata: !!metadata,
      metadataKeys: metadata ? Object.keys(metadata) : []
    });
    app.sendCustomEvent(name, metadata);
  } catch (error) {
    debugLog.error("API", "Event tracking failed", { eventName: name, error, hasMetadata: !!metadata });
    if (error instanceof Error && (error.message === "App not initialized" || error.message.includes("validation failed"))) {
      throw error;
    }
  }
};
const isInitialized = () => {
  return app !== null;
};
const getInitializationStatus = () => {
  return {
    isInitialized: app !== null,
    isInitializing,
    hasInstance: app !== null
  };
};
const destroy = async () => {
  try {
    debugLog.info("API", "Library cleanup initiated");
    if (isDestroying) {
      debugLog.warn("API", "Cleanup already in progress, skipping duplicate cleanup");
      return;
    }
    if (!app) {
      debugLog.warn("API", "Cleanup called but Library was not initialized");
      throw new Error("App not initialized");
    }
    isDestroying = true;
    try {
      debugLog.debug("API", "Calling app.destroy()");
      await app.destroy();
      debugLog.debug("API", "app.destroy() completed successfully");
    } catch (destroyError) {
      debugLog.error("API", "app.destroy() failed, performing forced cleanup", { destroyError });
      try {
        debugLog.debug("API", "Forcing app cleanup");
        if (app) {
          app = null;
        }
        debugLog.debug("API", "Forced cleanup completed");
      } catch (cleanupError) {
        debugLog.error("API", "Forced cleanup failed", { cleanupError });
      }
      throw destroyError;
    }
    debugLog.debug("API", "Nullifying app instance");
    app = null;
    debugLog.debug("API", "Resetting initialization flags");
    isInitializing = false;
    debugLog.info("API", "Library cleanup completed successfully");
  } catch (error) {
    debugLog.error("API", "Cleanup failed", { error, hadApp: !!app, wasInitializing: isInitializing });
    throw error;
  } finally {
    isDestroying = false;
  }
};
const getRecoveryStats = () => {
  try {
    if (!app) {
      debugLog.warn("API", "Recovery stats requested but Library was not initialized");
      return null;
    }
    return app.getRecoveryStats();
  } catch (error) {
    debugLog.error("API", "Failed to get recovery stats", { error });
    return null;
  }
};
const attemptSystemRecovery = async () => {
  try {
    if (!app) {
      debugLog.warn("API", "System recovery attempted but Library was not initialized");
      throw new Error("App not initialized");
    }
    debugLog.info("API", "Manual system recovery initiated");
    await app.attemptSystemRecovery();
    debugLog.info("API", "Manual system recovery completed");
  } catch (error) {
    debugLog.error("API", "System recovery failed", { error });
    throw error;
  }
};
const aggressiveFingerprintCleanup = () => {
  try {
    if (!app) {
      debugLog.warn("API", "Fingerprint cleanup attempted but Library was not initialized");
      throw new Error("App not initialized");
    }
    debugLog.info("API", "Manual fingerprint cleanup initiated");
    app.aggressiveFingerprintCleanup();
    debugLog.info("API", "Manual fingerprint cleanup completed");
  } catch (error) {
    debugLog.error("API", "Fingerprint cleanup failed", { error });
    throw error;
  }
};
class TestBridge extends App {
  isInitializing() {
    return isInitializing;
  }
}
{
  if (typeof window !== "undefined") {
    const injectTestingBridge = () => {
      window.__traceLogBridge = new TestBridge();
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", injectTestingBridge);
    } else {
      injectTestingBridge();
    }
  }
}
const api = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Constants: app_constants,
  Types: app_types,
  aggressiveFingerprintCleanup,
  attemptSystemRecovery,
  destroy,
  event,
  getInitializationStatus,
  getRecoveryStats,
  init,
  isInitialized
}, Symbol.toStringTag, { value: "Module" }));
export {
  api as TraceLog
};
//# sourceMappingURL=tracelog.js.map
