var DeviceType = /* @__PURE__ */ ((DeviceType2) => {
  DeviceType2["Mobile"] = "mobile";
  DeviceType2["Tablet"] = "tablet";
  DeviceType2["Desktop"] = "desktop";
  DeviceType2["Unknown"] = "unknown";
  return DeviceType2;
})(DeviceType || {});
const globalState = {};
class StateManager {
  /**
   * Gets a value from the global state
   */
  get(key) {
    return globalState[key];
  }
  /**
   * Sets a value in the global state
   */
  set(key, value) {
    const oldValue = globalState[key];
    globalState[key] = value;
    if (this.isCriticalStateKey(key) && this.shouldLog(oldValue, value)) {
      debugLog.debug("StateManager", "State updated", {
        key,
        oldValue: this.formatLogValue(key, oldValue),
        newValue: this.formatLogValue(key, value)
      });
    }
  }
  /**
   * Gets the entire state object (for debugging purposes)
   */
  getState() {
    return { ...globalState };
  }
  /**
   * Checks if a state key is considered critical for logging
   */
  isCriticalStateKey(key) {
    return key === "sessionId" || key === "config" || key === "hasStartSession";
  }
  /**
   * Determines if a state change should be logged
   */
  shouldLog(oldValue, newValue) {
    return oldValue !== newValue;
  }
  /**
   * Formats values for logging (avoiding large object dumps)
   */
  formatLogValue(key, value) {
    if (key === "config") {
      return value ? "(configured)" : "(not configured)";
    }
    return value;
  }
}
class DebugLogger extends StateManager {
  clientError = (ns, msg, data) => this.log("CLIENT_ERROR", ns, msg, data);
  clientWarn = (ns, msg, data) => this.log("CLIENT_WARN", ns, msg, data);
  info = (ns, msg, data) => this.log("INFO", ns, msg, data);
  error = (ns, msg, data) => this.log("ERROR", ns, msg, data);
  warn = (ns, msg, data) => this.log("WARN", ns, msg, data);
  debug = (ns, msg, data) => this.log("DEBUG", ns, msg, data);
  verbose = (ns, msg, data) => this.log("VERBOSE", ns, msg, data);
  log(level, ns, msg, data) {
    const mode = this.get("config")?.mode;
    if (!this.shouldShow(level, mode)) return;
    const formattedMsg = `[TraceLog:${ns}] ${msg}`;
    const method = this.getMethod(level);
    if (data !== void 0) {
      console[method](formattedMsg, data);
    } else {
      console[method](formattedMsg);
    }
    if (typeof window !== "undefined" && true) {
      const event2 = new CustomEvent("tracelog:log", {
        detail: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          level,
          namespace: ns,
          message: msg,
          data
        }
      });
      window.dispatchEvent(event2);
    }
  }
  shouldShow(level, mode) {
    if (["CLIENT_ERROR", "ERROR"].includes(level)) return true;
    if (!mode) return level === "CLIENT_WARN";
    if (mode === "qa") return ["INFO", "CLIENT_ERROR", "CLIENT_WARN"].includes(level);
    if (mode === "debug") return true;
    return false;
  }
  getMethod(level) {
    if (["CLIENT_ERROR", "ERROR"].includes(level)) return "error";
    if (["CLIENT_WARN", "WARN"].includes(level)) return "warn";
    return "log";
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
const DEFAULT_SESSION_TIMEOUT = 15 * 60 * 1e3;
const DUPLICATE_EVENT_THRESHOLD_MS = 1e3;
const EVENT_SENT_INTERVAL_MS = 1e4;
const EVENT_SENT_INTERVAL_TEST_MS = 1e3;
const DEFAULT_THROTTLE_DELAY_MS = 1e3;
const SCROLL_DEBOUNCE_TIME_MS = 250;
const EVENT_EXPIRY_HOURS = 24;
const MAX_EVENTS_QUEUE_LENGTH = 500;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5e3;
const REQUEST_TIMEOUT_MS = 1e4;
const SIGNIFICANT_SCROLL_DELTA = 10;
const DEFAULT_SAMPLING_RATE = 1;
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
const SYNC_XHR_TIMEOUT_MS = 2e3;
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
const SCROLL_SUPPRESS_MULTIPLIER = 2;
const LONG_TASK_THROTTLE_MS = DEFAULT_THROTTLE_DELAY_MS;
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
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<embed\b[^>]*>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi
];
const DEFAULT_API_CONFIG = {
  samplingRate: DEFAULT_SAMPLING_RATE,
  tags: [],
  excludedUrlPaths: []
};
const DEFAULT_CONFIG = (config) => ({
  ...DEFAULT_API_CONFIG,
  ...config,
  sessionTimeout: DEFAULT_SESSION_TIMEOUT,
  allowHttp: false
});
const STORAGE_BASE_KEY = "tl";
const USER_ID_KEY = (id) => id ? `${STORAGE_BASE_KEY}:${id}:uid` : `${STORAGE_BASE_KEY}:uid`;
const QUEUE_KEY = (id) => id ? `${STORAGE_BASE_KEY}:${id}:queue` : `${STORAGE_BASE_KEY}:queue`;
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
  const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c2) => {
    const r = Math.random() * 16 | 0;
    const v2 = c2 === "x" ? r : r & 3 | 8;
    return v2.toString(16);
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
function getApiUrlForProject(id, allowHttp = false) {
  debugLog.debug("ApiManager", "Generating API URL", { projectId: id, allowHttp });
  try {
    if (id.startsWith(SpecialProjectId.Localhost)) {
      const url2 = `http://${id}`;
      if (!isValidUrl(url2, true)) {
        throw new Error(`Invalid localhost URL format: ${id}`);
      }
      debugLog.debug("ApiManager", "Generated localhost URL", { url: url2 });
      return url2;
    }
    const url = getApiUrl(id, allowHttp);
    if (!isValidUrl(url, allowHttp)) {
      throw new Error(`Generated API URL failed validation: ${url}`);
    }
    debugLog.debug("ApiManager", "Generated API URL", { url });
    return url;
  } catch (error) {
    debugLog.error("ApiManager", "API URL generation failed", {
      projectId: id,
      allowHttp,
      error: error instanceof Error ? error.message : error
    });
    throw error;
  }
}
class ConfigManager {
  static LOCALHOST_PATTERN = /^localhost:\d{1,5}$/;
  static PRODUCTION_DOMAINS = [/^https:\/\/.*\.tracelog\.app$/, /^https:\/\/.*\.tracelog\.dev$/];
  /**
   * Gets complete configuration by merging default, API, and app configurations.
   *
   * @param apiUrl - Base URL for the configuration API
   * @param appConfig - Client-side configuration from init()
   * @returns Promise<Config> - Merged configuration object
   */
  async get(apiUrl, appConfig) {
    if (appConfig.id === SpecialProjectId.Skip) {
      debugLog.debug("ConfigManager", "Using skip mode - no network calls");
      return this.createDefaultConfig(appConfig);
    }
    debugLog.debug("ConfigManager", "Loading configuration", {
      apiUrl,
      projectId: appConfig.id
    });
    const config = await this.loadFromApi(apiUrl, appConfig);
    debugLog.info("ConfigManager", "Configuration loaded", {
      projectId: appConfig.id,
      mode: config.mode,
      hasTags: !!config.tags?.length,
      hasExclusions: !!config.excludedUrlPaths?.length
    });
    return config;
  }
  /**
   * Loads configuration from API and merges with app config.
   */
  async loadFromApi(apiUrl, appConfig) {
    try {
      const configUrl = this.buildConfigUrl(apiUrl, appConfig);
      const headers = this.buildHeaders(appConfig);
      const response = await fetchWithTimeout(configUrl, {
        method: "GET",
        headers,
        timeout: REQUEST_TIMEOUT_MS
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const rawData = await this.parseJsonResponse(response);
      return this.mergeConfigurations(rawData, appConfig);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      debugLog.error("ConfigManager", "Failed to load configuration", {
        error: errorMessage,
        apiUrl,
        projectId: appConfig.id
      });
      throw new Error(`Configuration load failed: ${errorMessage}`);
    }
  }
  /**
   * Builds the configuration URL based on project type and QA mode.
   */
  buildConfigUrl(apiUrl, appConfig) {
    const isLocalhost = appConfig.id.startsWith(SpecialProjectId.Localhost);
    if (isLocalhost) {
      this.validateLocalhostProjectId(appConfig.id);
      return `http://${appConfig.id}/config`;
    }
    const baseUrl = `${apiUrl}/config`;
    const isQaMode = this.isQaModeEnabled();
    return isQaMode ? `${baseUrl}?qaMode=true` : baseUrl;
  }
  /**
   * Builds request headers based on project configuration.
   */
  buildHeaders(appConfig) {
    const headers = {
      "Content-Type": "application/json"
    };
    if (appConfig.id.startsWith(SpecialProjectId.Localhost)) {
      headers["X-TraceLog-Project"] = appConfig.id;
    }
    return headers;
  }
  /**
   * Parses and validates JSON response from config API.
   */
  async parseJsonResponse(response) {
    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      throw new Error("Invalid response content-type, expected JSON");
    }
    const rawData = await response.json();
    if (!rawData || typeof rawData !== "object" || Array.isArray(rawData)) {
      throw new Error("Invalid response format, expected object");
    }
    return rawData;
  }
  /**
   * Validates localhost project ID format and port range.
   */
  validateLocalhostProjectId(projectId) {
    if (!ConfigManager.LOCALHOST_PATTERN.test(projectId)) {
      throw new Error(`Invalid localhost format. Expected 'localhost:PORT', got '${projectId}'`);
    }
    const port = parseInt(projectId.split(":")[1], 10);
    if (port < 1 || port > 65535) {
      throw new Error(`Port must be between 1 and 65535, got ${port}`);
    }
  }
  /**
   * Checks if QA mode is enabled via URL parameter.
   */
  isQaModeEnabled() {
    const params = new URLSearchParams(window.location.search);
    return params.get("qaMode") === "true";
  }
  /**
   * Merges API configuration with app configuration and applies mode-specific settings.
   */
  mergeConfigurations(rawApiConfig, appConfig) {
    const safeApiConfig = sanitizeApiConfig(rawApiConfig);
    const apiConfig = { ...DEFAULT_API_CONFIG, ...safeApiConfig };
    const mergedConfig = { ...apiConfig, ...appConfig };
    if (this.isQaModeEnabled() && !mergedConfig.mode) {
      mergedConfig.mode = Mode.QA;
      debugLog.info("ConfigManager", "QA mode enabled via URL parameter");
    }
    const errorSampling = Object.values(Mode).includes(mergedConfig.mode) ? 1 : mergedConfig.errorSampling ?? 0.1;
    return { ...mergedConfig, errorSampling };
  }
  /**
   * Creates default configuration for skip mode and fallback scenarios.
   */
  createDefaultConfig(appConfig) {
    return DEFAULT_CONFIG({
      ...appConfig,
      errorSampling: 1,
      ...appConfig.id === SpecialProjectId.Skip && { mode: Mode.DEBUG }
    });
  }
}
class SenderManager extends StateManager {
  storeManager;
  retryTimeoutId = null;
  retryCount = 0;
  isRetrying = false;
  constructor(storeManager) {
    super();
    this.storeManager = storeManager;
  }
  getQueueStorageKey() {
    const projectId = this.get("config")?.id || "default";
    const userId = this.get("userId") || "anonymous";
    return `${QUEUE_KEY(projectId)}:${userId}`;
  }
  /**
   * Send events synchronously using sendBeacon or XHR fallback
   * Used primarily for page unload scenarios
   */
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
  /**
   * Send events asynchronously with persistence and retry logic
   * Main method for sending events during normal operation
   */
  async sendEventsQueue(body, callbacks) {
    if (this.shouldSkipSend()) {
      this.logQueue(body);
      callbacks?.onSuccess?.(0);
      return true;
    }
    const persisted = this.persistEvents(body);
    if (!persisted) {
      debugLog.warn("SenderManager", "Failed to persist events, attempting immediate send");
    }
    const success = await this.send(body);
    if (success) {
      this.clearPersistedEvents();
      this.resetRetryState();
      callbacks?.onSuccess?.(body.events.length);
    } else {
      this.scheduleRetry(body, callbacks);
      callbacks?.onFailure?.();
    }
    return success;
  }
  /**
   * Recover and send previously persisted events
   * Called during initialization to handle events from previous session
   */
  async recoverPersistedEvents(callbacks) {
    try {
      const persistedData = this.getPersistedData();
      if (!persistedData || !this.isDataRecent(persistedData) || persistedData.events.length === 0) {
        this.clearPersistedEvents();
        return;
      }
      debugLog.info("SenderManager", "Recovering persisted events", {
        count: persistedData.events.length,
        sessionId: persistedData.sessionId
      });
      const body = this.createRecoveryBody(persistedData);
      const success = await this.send(body);
      if (success) {
        this.clearPersistedEvents();
        this.resetRetryState();
        callbacks?.onSuccess?.(persistedData.events.length);
      } else {
        this.scheduleRetry(body, callbacks);
        callbacks?.onFailure?.();
      }
    } catch (error) {
      debugLog.error("SenderManager", "Failed to recover persisted events", { error });
      this.clearPersistedEvents();
    }
  }
  /**
   * Persist events for recovery in case of failure
   */
  persistEventsForRecovery(body) {
    return this.persistEvents(body);
  }
  /**
   * Legacy method for backward compatibility
   * @deprecated Use sendEventsQueue instead
   */
  async sendEventsQueueAsync(body) {
    return this.sendEventsQueue(body);
  }
  /**
   * Stop the sender manager and clean up resources
   */
  stop() {
    this.clearRetryTimeout();
    this.resetRetryState();
    this.clearPersistedEvents();
  }
  async send(body) {
    const { url, payload } = this.prepareRequest(body);
    try {
      const response = await this.sendWithTimeout(url, payload);
      debugLog.debug("SenderManager", "Send completed", { status: response.status, events: body.events.length });
      return response.ok;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      debugLog.error("SenderManager", "Send request failed", {
        error: errorMessage,
        events: body.events.length,
        url: url.replace(/\/\/[^/]+/, "//[DOMAIN]")
        // Hide domain for privacy
      });
      return false;
    }
  }
  async sendWithTimeout(url, payload) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: payload,
        keepalive: true,
        credentials: "include",
        signal: controller.signal
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response;
    } finally {
      clearTimeout(timeoutId);
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
      xhr.withCredentials = true;
      xhr.timeout = SYNC_XHR_TIMEOUT_MS;
      xhr.send(payload);
      const success = xhr.status >= 200 && xhr.status < 300;
      if (!success) {
        debugLog.warn("SenderManager", "Sync XHR failed", {
          status: xhr.status,
          statusText: xhr.statusText || "Unknown error"
        });
      }
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      debugLog.warn("SenderManager", "Sync XHR error", {
        error: errorMessage,
        status: xhr.status || "unknown"
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
      debugLog.warn("SenderManager", "Failed to parse persisted data", { error });
      this.clearPersistedEvents();
    }
    return null;
  }
  isDataRecent(data) {
    if (!data.timestamp || typeof data.timestamp !== "number") {
      return false;
    }
    const ageInHours = (Date.now() - data.timestamp) / (1e3 * 60 * 60);
    const isRecent = ageInHours < EVENT_EXPIRY_HOURS;
    if (!isRecent) {
      debugLog.debug("SenderManager", "Persisted data expired", { ageInHours });
    }
    return isRecent;
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
    debugLog.info("SenderManager", "Skipping send (debug mode)", {
      events: queue.events.length,
      sessionId: queue.session_id
    });
  }
  persistEvents(body) {
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
      debugLog.warn("SenderManager", "Failed to persist events", { error });
      return false;
    }
  }
  clearPersistedEvents() {
    try {
      this.storeManager.removeItem(this.getQueueStorageKey());
    } catch (error) {
      debugLog.warn("SenderManager", "Failed to clear persisted events", { error });
    }
  }
  resetRetryState() {
    this.retryCount = 0;
    this.isRetrying = false;
    this.clearRetryTimeout();
  }
  scheduleRetry(body, originalCallbacks) {
    if (this.retryTimeoutId !== null || this.isRetrying) {
      return;
    }
    if (this.retryCount >= MAX_RETRIES) {
      debugLog.warn("SenderManager", "Max retries reached, giving up", { retryCount: this.retryCount });
      this.clearPersistedEvents();
      this.resetRetryState();
      originalCallbacks?.onFailure?.();
      return;
    }
    if (this.isCircuitBreakerOpen()) {
      debugLog.info("SenderManager", "Circuit breaker open, skipping retry");
      return;
    }
    const retryDelay = RETRY_DELAY_MS * Math.pow(2, this.retryCount);
    this.retryTimeoutId = window.setTimeout(async () => {
      this.retryTimeoutId = null;
      if (this.isCircuitBreakerOpen() || this.isRetrying) {
        return;
      }
      this.retryCount++;
      this.isRetrying = true;
      debugLog.debug("SenderManager", "Retrying send", { attempt: this.retryCount });
      try {
        const success = await this.send(body);
        if (success) {
          this.clearPersistedEvents();
          this.resetRetryState();
          originalCallbacks?.onSuccess?.(body.events.length);
        } else if (this.retryCount >= MAX_RETRIES) {
          this.clearPersistedEvents();
          this.resetRetryState();
          originalCallbacks?.onFailure?.();
        } else {
          this.scheduleRetry(body, originalCallbacks);
        }
      } finally {
        this.isRetrying = false;
      }
    }, retryDelay);
    debugLog.debug("SenderManager", "Retry scheduled", {
      attempt: this.retryCount + 1,
      delay: retryDelay,
      events: body.events.length
    });
  }
  shouldSkipSend() {
    const config = this.get("config");
    const { id } = config || {};
    return id === SpecialProjectId.Skip;
  }
  isSendBeaconAvailable() {
    return typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function";
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
class EventManager extends StateManager {
  googleAnalytics;
  dataSender;
  eventsQueue = [];
  lastEventFingerprint = null;
  lastEventTime = 0;
  sendIntervalId = null;
  constructor(storeManager, googleAnalytics = null) {
    super();
    this.googleAnalytics = googleAnalytics;
    this.dataSender = new SenderManager(storeManager);
    debugLog.debug("EventManager", "EventManager initialized", {
      hasGoogleAnalytics: !!googleAnalytics
    });
  }
  /**
   * Recovers persisted events from localStorage
   * Should be called after initialization to recover any events that failed to send
   */
  async recoverPersistedEvents() {
    await this.dataSender.recoverPersistedEvents({
      onSuccess: (eventCount, recoveredEvents) => {
        if (recoveredEvents && recoveredEvents.length > 0) {
          const eventIds = recoveredEvents.map((e3) => e3.timestamp + "_" + e3.type);
          this.removeProcessedEvents(eventIds);
          debugLog.debug("EventManager", "Removed recovered events from queue", {
            removedCount: recoveredEvents.length,
            remainingQueueLength: this.eventsQueue.length
          });
        }
        debugLog.info("EventManager", "Events recovered successfully", {
          eventCount: eventCount ?? 0
        });
      },
      onFailure: async () => {
        debugLog.warn("EventManager", "Failed to recover persisted events");
      }
    });
  }
  /**
   * Track user events with automatic deduplication and queueing
   */
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
    if (!type) {
      debugLog.warn("EventManager", "Event type is required");
      return;
    }
    if (!this.shouldSample()) {
      debugLog.debug("EventManager", "Event filtered by sampling");
      return;
    }
    const currentPageUrl = page_url || this.get("pageUrl");
    const payload = this.buildEventPayload({
      type,
      page_url: currentPageUrl,
      from_page_url,
      scroll_data,
      click_data,
      custom_event,
      web_vitals,
      session_end_reason,
      session_start_recovered
    });
    if (this.isEventExcluded(payload)) {
      return;
    }
    if (this.isDuplicateEvent(payload)) {
      debugLog.debug("EventManager", "Duplicate event filtered", { type });
      return;
    }
    this.addToQueue(payload);
  }
  stop() {
    if (this.sendIntervalId) {
      clearInterval(this.sendIntervalId);
      this.sendIntervalId = null;
    }
    this.eventsQueue = [];
    this.lastEventFingerprint = null;
    this.lastEventTime = 0;
    this.dataSender.stop();
    debugLog.debug("EventManager", "EventManager stopped");
  }
  /**
   * Flush all queued events immediately (async)
   */
  async flushImmediately() {
    return this.flushEvents(false);
  }
  /**
   * Flush all queued events immediately (sync)
   */
  flushImmediatelySync() {
    return this.flushEvents(true);
  }
  /**
   * Queue management and sending intervals
   */
  getQueueLength() {
    return this.eventsQueue.length;
  }
  clearSendInterval() {
    if (this.sendIntervalId) {
      clearInterval(this.sendIntervalId);
      this.sendIntervalId = null;
    }
  }
  /**
   * Shared flush implementation for both sync and async modes
   */
  flushEvents(isSync) {
    if (this.eventsQueue.length === 0) {
      return isSync ? true : Promise.resolve(true);
    }
    const body = this.buildEventsPayload();
    const eventsToSend = [...this.eventsQueue];
    const eventIds = eventsToSend.map((e3) => `${e3.timestamp}_${e3.type}`);
    if (isSync) {
      const success = this.dataSender.sendEventsQueueSync(body);
      if (success) {
        this.removeProcessedEvents(eventIds);
        this.clearSendInterval();
        debugLog.info("EventManager", "Sync flush successful", {
          eventCount: eventsToSend.length
        });
      }
      return success;
    } else {
      return this.dataSender.sendEventsQueue(body, {
        onSuccess: () => {
          this.removeProcessedEvents(eventIds);
          this.clearSendInterval();
          debugLog.info("EventManager", "Async flush successful", {
            eventCount: eventsToSend.length
          });
        },
        onFailure: () => {
          debugLog.warn("EventManager", "Async flush failed", {
            eventCount: eventsToSend.length
          });
        }
      });
    }
  }
  /**
   * Send queued events to the API
   */
  async sendEventsQueue() {
    if (!this.get("sessionId") || this.eventsQueue.length === 0) {
      return;
    }
    const body = this.buildEventsPayload();
    const eventsToSend = [...this.eventsQueue];
    const eventIds = eventsToSend.map((e3) => `${e3.timestamp}_${e3.type}`);
    await this.dataSender.sendEventsQueue(body, {
      onSuccess: () => {
        this.removeProcessedEvents(eventIds);
        debugLog.info("EventManager", "Events sent successfully", {
          eventCount: eventsToSend.length,
          remainingQueueLength: this.eventsQueue.length
        });
      },
      onFailure: async () => {
        debugLog.warn("EventManager", "Events send failed, keeping in queue", {
          eventCount: eventsToSend.length
        });
      }
    });
  }
  /**
   * Build the payload for sending events to the API
   * Includes basic deduplication and sorting
   */
  buildEventsPayload() {
    const eventMap = /* @__PURE__ */ new Map();
    for (const event2 of this.eventsQueue) {
      const signature = this.createEventSignature(event2);
      eventMap.set(signature, event2);
    }
    const events = Array.from(eventMap.values()).sort((a2, b2) => a2.timestamp - b2.timestamp);
    return {
      user_id: this.get("userId"),
      session_id: this.get("sessionId"),
      device: this.get("device"),
      events,
      ...this.get("config")?.globalMetadata && { global_metadata: this.get("config")?.globalMetadata }
    };
  }
  /**
   * Helper methods for event processing
   */
  buildEventPayload(data) {
    const isSessionStart = data.type === EventType.SESSION_START;
    const currentPageUrl = data.page_url ?? this.get("pageUrl");
    if (isSessionStart) {
      this.set("hasStartSession", true);
    }
    const payload = {
      type: data.type,
      page_url: currentPageUrl,
      timestamp: Date.now(),
      ...isSessionStart && { referrer: document.referrer || "Direct" },
      ...data.from_page_url && { from_page_url: data.from_page_url },
      ...data.scroll_data && { scroll_data: data.scroll_data },
      ...data.click_data && { click_data: data.click_data },
      ...data.custom_event && { custom_event: data.custom_event },
      ...data.web_vitals && { web_vitals: data.web_vitals },
      ...data.session_end_reason && { session_end_reason: data.session_end_reason },
      ...data.session_start_recovered && { session_start_recovered: data.session_start_recovered },
      ...isSessionStart && getUTMParameters() && { utm: getUTMParameters() }
    };
    const projectTags = this.get("config")?.tags;
    if (projectTags?.length) {
      payload.tags = projectTags;
    }
    return payload;
  }
  isEventExcluded(event2) {
    const isRouteExcluded = isUrlPathExcluded(event2.page_url, this.get("config")?.excludedUrlPaths ?? []);
    const hasStartSession = this.get("hasStartSession");
    const isSessionEndEvent = event2.type === EventType.SESSION_END;
    if (isRouteExcluded && (!isSessionEndEvent || isSessionEndEvent && !hasStartSession)) {
      if (this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug") {
        debugLog.debug("EventManager", `Event ${event2.type} excluded for route: ${event2.page_url}`);
      }
      return true;
    }
    return this.get("config")?.ipExcluded === true;
  }
  isDuplicateEvent(event2) {
    const now = Date.now();
    const fingerprint = this.createEventFingerprint(event2);
    if (this.lastEventFingerprint === fingerprint && now - this.lastEventTime < DUPLICATE_EVENT_THRESHOLD_MS) {
      return true;
    }
    this.lastEventFingerprint = fingerprint;
    this.lastEventTime = now;
    return false;
  }
  createEventFingerprint(event2) {
    let fingerprint = `${event2.type}_${event2.page_url}`;
    if (event2.click_data) {
      const x2 = Math.round((event2.click_data.x || 0) / 10) * 10;
      const y2 = Math.round((event2.click_data.y || 0) / 10) * 10;
      fingerprint += `_click_${x2}_${y2}`;
    }
    if (event2.scroll_data) {
      fingerprint += `_scroll_${event2.scroll_data.depth}_${event2.scroll_data.direction}`;
    }
    if (event2.custom_event) {
      fingerprint += `_custom_${event2.custom_event.name}`;
    }
    if (event2.web_vitals) {
      fingerprint += `_vitals_${event2.web_vitals.type}`;
    }
    return fingerprint;
  }
  createEventSignature(event2) {
    return this.createEventFingerprint(event2) + `_${event2.timestamp}`;
  }
  addToQueue(event2) {
    this.eventsQueue.push(event2);
    if (this.eventsQueue.length > MAX_EVENTS_QUEUE_LENGTH) {
      const removedEvent = this.eventsQueue.shift();
      debugLog.warn("EventManager", "Event queue overflow, oldest event removed", {
        maxLength: MAX_EVENTS_QUEUE_LENGTH,
        currentLength: this.eventsQueue.length,
        removedEventType: removedEvent?.type
      });
    }
    debugLog.info("EventManager", `📥 Event captured: ${event2.type}`, event2);
    if (!this.sendIntervalId) {
      this.startSendInterval();
    }
    this.handleGoogleAnalyticsIntegration(event2);
  }
  startSendInterval() {
    const isTestEnv = this.get("config")?.id === "test" || this.get("config")?.mode === "debug";
    const interval = isTestEnv ? EVENT_SENT_INTERVAL_TEST_MS : EVENT_SENT_INTERVAL_MS;
    this.sendIntervalId = window.setInterval(() => {
      if (this.eventsQueue.length > 0) {
        this.sendEventsQueue();
      }
    }, interval);
  }
  handleGoogleAnalyticsIntegration(event2) {
    if (this.googleAnalytics && event2.type === EventType.CUSTOM && event2.custom_event) {
      if (this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug") {
        debugLog.debug("EventManager", `Google Analytics event: ${JSON.stringify(event2.custom_event)}`);
      } else {
        this.googleAnalytics.trackEvent(event2.custom_event.name, event2.custom_event.metadata ?? {});
      }
    }
  }
  shouldSample() {
    const samplingRate = this.get("config")?.samplingRate ?? 1;
    return Math.random() < samplingRate;
  }
  removeProcessedEvents(eventIds) {
    const eventIdSet = new Set(eventIds);
    this.eventsQueue = this.eventsQueue.filter((event2) => {
      const eventId = `${event2.timestamp}_${event2.type}`;
      return !eventIdSet.has(eventId);
    });
  }
}
class UserManager {
  /**
   * Gets or creates a unique user ID for the given project.
   * The user ID is persisted in localStorage and reused across sessions.
   *
   * @param storageManager - Storage manager instance
   * @param projectId - Project identifier for namespacing
   * @returns Persistent unique user ID
   */
  static getId(storageManager, projectId) {
    const storageKey = USER_ID_KEY(projectId ?? "");
    const storedUserId = storageManager.getItem(storageKey);
    if (storedUserId) {
      return storedUserId;
    }
    const newUserId = generateUUID();
    storageManager.setItem(storageKey, newUserId);
    return newUserId;
  }
}
class SessionManager extends StateManager {
  storageManager;
  eventManager;
  sessionTimeoutId = null;
  broadcastChannel = null;
  activityHandler = null;
  constructor(storageManager, eventManager) {
    super();
    this.storageManager = storageManager;
    this.eventManager = eventManager;
  }
  /**
   * Initialize cross-tab synchronization
   */
  initCrossTabSync() {
    if (typeof BroadcastChannel === "undefined") {
      debugLog.warn("SessionManager", "BroadcastChannel not supported");
      return;
    }
    this.broadcastChannel = new BroadcastChannel("tracelog_session");
    this.broadcastChannel.onmessage = (event2) => {
      const { sessionId, timestamp } = event2.data;
      if (sessionId && timestamp && timestamp > Date.now() - 5e3) {
        this.set("sessionId", sessionId);
        this.storageManager.setItem("sessionId", sessionId);
        this.storageManager.setItem("lastActivity", timestamp.toString());
        debugLog.debug("SessionManager", "Session synced from another tab", { sessionId });
      }
    };
  }
  /**
   * Share session with other tabs
   */
  shareSession(sessionId) {
    this.broadcastChannel?.postMessage({
      sessionId,
      timestamp: Date.now()
    });
  }
  /**
   * Cleanup cross-tab sync
   */
  cleanupCrossTabSync() {
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
  }
  /**
   * Recover session from localStorage if it exists and hasn't expired
   */
  recoverSession() {
    const storedSessionId = this.storageManager.getItem("sessionId");
    const lastActivity = this.storageManager.getItem("lastActivity");
    if (!storedSessionId || !lastActivity) {
      return null;
    }
    const lastActivityTime = parseInt(lastActivity, 10);
    const sessionTimeout = this.get("config")?.sessionTimeout ?? DEFAULT_SESSION_TIMEOUT;
    if (Date.now() - lastActivityTime > sessionTimeout) {
      debugLog.debug("SessionManager", "Stored session expired");
      return null;
    }
    debugLog.info("SessionManager", "Session recovered from storage", { sessionId: storedSessionId });
    return storedSessionId;
  }
  /**
   * Persist session data to localStorage
   */
  persistSession(sessionId) {
    this.storageManager.setItem("sessionId", sessionId);
    this.storageManager.setItem("lastActivity", Date.now().toString());
  }
  /**
   * Start session tracking
   */
  async startTracking() {
    const recoveredSessionId = this.recoverSession();
    const sessionId = recoveredSessionId ?? this.generateSessionId();
    const isRecovered = Boolean(recoveredSessionId);
    this.set("sessionId", sessionId);
    this.persistSession(sessionId);
    this.eventManager.track({
      type: EventType.SESSION_START,
      ...isRecovered && { session_start_recovered: true }
    });
    this.initCrossTabSync();
    this.shareSession(sessionId);
    this.setupSessionTimeout();
    this.setupActivityListeners();
    this.setupLifecycleListeners();
    debugLog.info("SessionManager", "Session tracking started", { sessionId, recovered: isRecovered });
  }
  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
  /**
   * Setup session timeout
   */
  setupSessionTimeout() {
    this.clearSessionTimeout();
    const sessionTimeout = this.get("config")?.sessionTimeout ?? DEFAULT_SESSION_TIMEOUT;
    this.sessionTimeoutId = setTimeout(() => {
      this.endSession("inactivity");
    }, sessionTimeout);
  }
  /**
   * Reset session timeout and update activity
   */
  resetSessionTimeout() {
    this.setupSessionTimeout();
    const sessionId = this.get("sessionId");
    if (sessionId) {
      this.persistSession(sessionId);
    }
  }
  /**
   * Clear session timeout
   */
  clearSessionTimeout() {
    if (this.sessionTimeoutId) {
      clearTimeout(this.sessionTimeoutId);
      this.sessionTimeoutId = null;
    }
  }
  /**
   * Setup activity listeners to track user engagement
   */
  setupActivityListeners() {
    this.activityHandler = () => this.resetSessionTimeout();
    document.addEventListener("click", this.activityHandler, { passive: true });
    document.addEventListener("keydown", this.activityHandler, { passive: true });
    document.addEventListener("scroll", this.activityHandler, { passive: true });
  }
  /**
   * Clean up activity listeners
   */
  cleanupActivityListeners() {
    if (this.activityHandler) {
      document.removeEventListener("click", this.activityHandler);
      document.removeEventListener("keydown", this.activityHandler);
      document.removeEventListener("scroll", this.activityHandler);
      this.activityHandler = null;
    }
  }
  /**
   * Setup page lifecycle listeners (visibility and unload)
   */
  setupLifecycleListeners() {
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.clearSessionTimeout();
      } else {
        const sessionId = this.get("sessionId");
        if (sessionId) {
          this.setupSessionTimeout();
        }
      }
    });
    window.addEventListener("beforeunload", () => {
      this.eventManager.flushImmediatelySync();
    });
  }
  /**
   * End current session
   */
  endSession(reason) {
    const sessionId = this.get("sessionId");
    if (!sessionId) return;
    debugLog.info("SessionManager", "Ending session", { sessionId, reason });
    this.eventManager.track({
      type: EventType.SESSION_END,
      session_end_reason: reason
    });
    this.clearSessionTimeout();
    this.cleanupActivityListeners();
    this.cleanupCrossTabSync();
    this.storageManager.removeItem("sessionId");
    this.storageManager.removeItem("lastActivity");
    this.set("sessionId", null);
  }
  /**
   * Stop session tracking
   */
  async stopTracking() {
    this.endSession("manual_stop");
  }
  /**
   * Clean up all resources
   */
  destroy() {
    this.clearSessionTimeout();
    this.cleanupActivityListeners();
    this.cleanupCrossTabSync();
  }
}
class SessionHandler extends StateManager {
  eventManager;
  storageManager;
  sessionManager = null;
  destroyed = false;
  constructor(storageManager, eventManager) {
    super();
    this.eventManager = eventManager;
    this.storageManager = storageManager;
  }
  async startTracking() {
    if (this.isActive()) {
      debugLog.debug("SessionHandler", "Session tracking already active");
      return;
    }
    if (this.destroyed) {
      debugLog.warn("SessionHandler", "Cannot start tracking on destroyed handler");
      return;
    }
    debugLog.debug("SessionHandler", "Starting session tracking");
    try {
      this.sessionManager = new SessionManager(this.storageManager, this.eventManager);
      await this.sessionManager.startTracking();
      debugLog.debug("SessionHandler", "Session tracking started successfully");
    } catch (error) {
      if (this.sessionManager) {
        try {
          this.sessionManager.destroy();
        } catch {
        }
        this.sessionManager = null;
      }
      debugLog.error("SessionHandler", "Failed to start session tracking", {
        error: error instanceof Error ? error.message : "Unknown error"
      });
      throw error;
    }
  }
  isActive() {
    return this.sessionManager !== null && !this.destroyed;
  }
  async cleanupSessionManager() {
    if (this.sessionManager) {
      await this.sessionManager.stopTracking();
      this.sessionManager.destroy();
      this.sessionManager = null;
    }
  }
  async stopTracking() {
    debugLog.debug("SessionHandler", "Stopping session tracking");
    await this.cleanupSessionManager();
  }
  destroy() {
    if (this.destroyed) {
      debugLog.debug("SessionHandler", "Already destroyed, skipping");
      return;
    }
    if (this.sessionManager) {
      this.sessionManager.destroy();
      this.sessionManager = null;
    }
    this.destroyed = true;
    debugLog.debug("SessionHandler", "Session handler destroyed");
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
    const original = window.history[method];
    if (method === "pushState" && !this.originalPushState) {
      this.originalPushState = original;
    } else if (method === "replaceState" && !this.originalReplaceState) {
      this.originalReplaceState = original;
    }
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
      this.set("pageUrl", normalizedUrl);
      const pageViewData = this.extractPageViewData();
      this.eventManager.track({
        type: EventType.PAGE_VIEW,
        page_url: this.get("pageUrl"),
        from_page_url: fromUrl,
        ...pageViewData && { page_view: pageViewData }
      });
      this.onTrack();
    }
  };
  trackInitialPageView() {
    const normalizedUrl = normalizeUrl(window.location.href, this.get("config").sensitiveQueryParams);
    const pageViewData = this.extractPageViewData();
    this.eventManager.track({
      type: EventType.PAGE_VIEW,
      page_url: normalizedUrl,
      ...pageViewData && { page_view: pageViewData }
    });
    this.onTrack();
  }
  extractPageViewData() {
    const { pathname, search, hash } = window.location;
    const { referrer } = document;
    const { title } = document;
    if (!referrer && !title && !pathname && !search && !hash) {
      return void 0;
    }
    const data = {
      ...referrer && { referrer },
      ...title && { title },
      ...pathname && { pathname },
      ...search && { search },
      ...hash && { hash }
    };
    return data;
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
        const parent = element.closest(selector);
        if (parent) {
          return parent;
        }
      } catch (error) {
        debugLog.warn("ClickHandler", "Invalid selector in element search", {
          selector,
          error: error instanceof Error ? error.message : "Unknown error"
        });
        continue;
      }
    }
    return element;
  }
  clamp(value) {
    return Math.max(0, Math.min(1, Number(value.toFixed(3))));
  }
  calculateClickCoordinates(event2, element) {
    const rect = element.getBoundingClientRect();
    const x2 = event2.clientX;
    const y2 = event2.clientY;
    const relativeX = rect.width > 0 ? this.clamp((x2 - rect.left) / rect.width) : 0;
    const relativeY = rect.height > 0 ? this.clamp((y2 - rect.top) / rect.height) : 0;
    return { x: x2, y: y2, relativeX, relativeY };
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
    const { x: x2, y: y2, relativeX, relativeY } = coordinates;
    const text = this.getRelevantText(clickedElement, relevantElement);
    const attributes = this.extractElementAttributes(relevantElement);
    return {
      x: x2,
      y: y2,
      relativeX,
      relativeY,
      tag: relevantElement.tagName.toLowerCase(),
      ...relevantElement.id && { id: relevantElement.id },
      ...relevantElement.className && { class: relevantElement.className },
      ...text && { text },
      ...attributes.href && { href: attributes.href },
      ...attributes.title && { title: attributes.title },
      ...attributes.alt && { alt: attributes.alt },
      ...attributes.role && { role: attributes.role },
      ...attributes["aria-label"] && { ariaLabel: attributes["aria-label"] },
      ...Object.keys(attributes).length > 0 && { dataAttributes: attributes }
    };
  }
  getRelevantText(clickedElement, relevantElement) {
    const clickedText = clickedElement.textContent?.trim() ?? "";
    const relevantText = relevantElement.textContent?.trim() ?? "";
    if (!clickedText && !relevantText) {
      return "";
    }
    if (clickedText && clickedText.length <= MAX_TEXT_LENGTH) {
      return clickedText;
    }
    if (relevantText.length <= MAX_TEXT_LENGTH) {
      return relevantText;
    }
    return relevantText.slice(0, MAX_TEXT_LENGTH - 3) + "...";
  }
  extractElementAttributes(element) {
    const commonAttributes = [
      "id",
      "class",
      "data-testid",
      "aria-label",
      "title",
      "href",
      "type",
      "name",
      "alt",
      "role"
    ];
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
      this.clearContainerTimer(container);
      if (container.element instanceof Window) {
        window.removeEventListener("scroll", container.listener);
      } else {
        container.element.removeEventListener("scroll", container.listener);
      }
    }
    this.containers.length = 0;
  }
  setupScrollContainer(element) {
    const elementType = element === window ? "window" : element.tagName?.toLowerCase();
    if (element !== window && !this.isElementScrollable(element)) {
      debugLog.debug("ScrollHandler", "Skipping non-scrollable element", { elementType });
      return;
    }
    debugLog.debug("ScrollHandler", "Setting up scroll container", { elementType });
    const handleScroll = () => {
      if (this.get("suppressNextScroll")) {
        this.set("suppressNextScroll", false);
        return;
      }
      this.clearContainerTimer(container);
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
    const container = {
      element,
      lastScrollPos: this.getScrollTop(element),
      debounceTimer: null,
      listener: handleScroll
    };
    this.containers.push(container);
    if (element instanceof Window) {
      window.addEventListener("scroll", handleScroll, { passive: true });
    } else {
      element.addEventListener("scroll", handleScroll, { passive: true });
    }
  }
  isWindowScrollable() {
    return document.documentElement.scrollHeight > window.innerHeight;
  }
  clearContainerTimer(container) {
    if (container.debounceTimer !== null) {
      clearTimeout(container.debounceTimer);
      container.debounceTimer = null;
    }
  }
  getScrollDirection(current, previous) {
    return current > previous ? ScrollDirection.DOWN : ScrollDirection.UP;
  }
  calculateScrollDepth(scrollTop, scrollHeight, viewportHeight) {
    if (scrollHeight <= viewportHeight) {
      return 0;
    }
    const maxScrollTop = scrollHeight - viewportHeight;
    return Math.min(100, Math.max(0, Math.floor(scrollTop / maxScrollTop * 100)));
  }
  calculateScrollData(container) {
    const { element, lastScrollPos } = container;
    const scrollTop = this.getScrollTop(element);
    const positionDelta = Math.abs(scrollTop - lastScrollPos);
    if (positionDelta < SIGNIFICANT_SCROLL_DELTA) {
      return null;
    }
    if (element === window && !this.isWindowScrollable()) {
      return null;
    }
    const viewportHeight = this.getViewportHeight(element);
    const scrollHeight = this.getScrollHeight(element);
    const direction = this.getScrollDirection(scrollTop, lastScrollPos);
    const depth = this.calculateScrollDepth(scrollTop, scrollHeight, viewportHeight);
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
  async initialize() {
    if (this.isInitialized) {
      return;
    }
    const measurementId = this.get("config").integrations?.googleAnalytics?.measurementId;
    const userId = this.get("userId");
    if (!measurementId?.trim() || !userId?.trim()) {
      return;
    }
    try {
      if (this.isScriptAlreadyLoaded()) {
        this.isInitialized = true;
        return;
      }
      await this.loadScript(measurementId);
      this.configureGtag(measurementId, userId);
      this.isInitialized = true;
    } catch (error) {
      console.error("[TraceLog:GoogleAnalytics] Initialization failed:", error);
    }
  }
  trackEvent(eventName, metadata) {
    if (!eventName?.trim() || !this.isInitialized || typeof window.gtag !== "function") {
      return;
    }
    try {
      window.gtag("event", eventName, metadata);
    } catch (error) {
      console.error("[TraceLog:GoogleAnalytics] Event tracking failed:", error);
    }
  }
  cleanup() {
    this.isInitialized = false;
    const script = document.getElementById("tracelog-ga-script");
    if (script) {
      script.remove();
    }
  }
  isScriptAlreadyLoaded() {
    if (document.getElementById("tracelog-ga-script")) {
      return true;
    }
    const existingGAScript = document.querySelector('script[src*="googletagmanager.com/gtag/js"]');
    return !!existingGAScript;
  }
  async loadScript(measurementId) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.id = "tracelog-ga-script";
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Google Analytics script"));
      document.head.appendChild(script);
    });
  }
  configureGtag(measurementId, userId) {
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
  }
}
class StorageManager {
  storage;
  fallbackStorage = /* @__PURE__ */ new Map();
  constructor() {
    this.storage = this.initializeStorage();
    if (!this.storage) {
      debugLog.warn("StorageManager", "localStorage not available, using memory fallback");
    }
  }
  /**
   * Retrieves an item from storage
   */
  getItem(key) {
    try {
      if (this.storage) {
        return this.storage.getItem(key);
      }
      return this.fallbackStorage.get(key) ?? null;
    } catch (error) {
      debugLog.warn("StorageManager", "Failed to get item, using fallback", { key, error });
      return this.fallbackStorage.get(key) ?? null;
    }
  }
  /**
   * Stores an item in storage
   */
  setItem(key, value) {
    try {
      if (this.storage) {
        this.storage.setItem(key, value);
        return;
      }
    } catch (error) {
      debugLog.warn("StorageManager", "Failed to set item, using fallback", { key, error });
    }
    this.fallbackStorage.set(key, value);
  }
  /**
   * Removes an item from storage
   */
  removeItem(key) {
    try {
      if (this.storage) {
        this.storage.removeItem(key);
      }
    } catch (error) {
      debugLog.warn("StorageManager", "Failed to remove item", { key, error });
    }
    this.fallbackStorage.delete(key);
  }
  /**
   * Clears all TracLog-related items from storage
   */
  clear() {
    if (!this.storage) {
      this.fallbackStorage.clear();
      return;
    }
    try {
      const keysToRemove = [];
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key?.startsWith("tracelog_")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => this.storage.removeItem(key));
      this.fallbackStorage.clear();
      debugLog.debug("StorageManager", "Cleared storage", { itemsRemoved: keysToRemove.length });
    } catch (error) {
      debugLog.error("StorageManager", "Failed to clear storage", { error });
      this.fallbackStorage.clear();
    }
  }
  /**
   * Checks if storage is available
   */
  isAvailable() {
    return this.storage !== null;
  }
  /**
   * Initialize localStorage with feature detection
   */
  initializeStorage() {
    if (typeof window === "undefined") {
      return null;
    }
    try {
      const storage = window.localStorage;
      const testKey = "__tracelog_test__";
      storage.setItem(testKey, "test");
      storage.removeItem(testKey);
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
    let currentNavId = this.getNavigationId();
    this.safeObserve(
      "layout-shift",
      (list) => {
        const navId = this.getNavigationId();
        if (navId !== currentNavId) {
          clsValue = 0;
          currentNavId = navId;
        }
        const entries = list.getEntries();
        for (const entry of entries) {
          if (entry.hadRecentInput === true) {
            continue;
          }
          const value = typeof entry.value === "number" ? entry.value : 0;
          clsValue += value;
        }
        this.sendVital({ type: "CLS", value: Number(clsValue.toFixed(PRECISION_TWO_DECIMALS)) });
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
      const { onLCP, onCLS, onFCP, onTTFB, onINP } = await Promise.resolve().then(() => webVitals);
      const report = (type) => (metric) => {
        const value = Number(metric.value.toFixed(PRECISION_TWO_DECIMALS));
        this.sendVital({ type, value });
      };
      onLCP(report("LCP"));
      onCLS(report("CLS"));
      onFCP(report("FCP"));
      onTTFB(report("TTFB"));
      onINP(report("INP"));
      debugLog.debug("PerformanceHandler", "Web-vitals library loaded successfully");
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
    if (navId) {
      const reportedForNav = this.reportedByNav.get(navId);
      const isDuplicate = reportedForNav?.has(sample.type);
      if (isDuplicate) {
        return;
      }
      if (!reportedForNav) {
        this.reportedByNav.set(navId, /* @__PURE__ */ new Set([sample.type]));
      } else {
        reportedForNav.add(sample.type);
      }
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
      const timestamp = nav.startTime || performance.now();
      const random = Math.random().toString(36).substr(2, 5);
      return `${timestamp.toFixed(2)}_${window.location.pathname}_${random}`;
    } catch (error) {
      debugLog.warn("PerformanceHandler", "Failed to get navigation ID", {
        error: error instanceof Error ? error.message : "Unknown error"
      });
      return null;
    }
  }
  isObserverSupported(type) {
    if (typeof PerformanceObserver === "undefined") return false;
    const supported = PerformanceObserver.supportedEntryTypes;
    return !supported || supported.includes(type);
  }
  safeObserve(type, cb, options, once = false) {
    try {
      if (!this.isObserverSupported(type)) {
        debugLog.debug("PerformanceHandler", "Observer type not supported", { type });
        return false;
      }
      const obs = new PerformanceObserver((list, observer) => {
        try {
          cb(list, observer);
        } catch (callbackError) {
          debugLog.warn("PerformanceHandler", "Observer callback failed", {
            type,
            error: callbackError instanceof Error ? callbackError.message : "Unknown error"
          });
        }
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
      return true;
    } catch (error) {
      debugLog.warn("PerformanceHandler", "Failed to create performance observer", {
        type,
        error: error instanceof Error ? error.message : "Unknown error"
      });
      return false;
    }
  }
}
class ErrorHandler extends StateManager {
  eventManager;
  static PII_PATTERNS = [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
    // Email
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    // Phone US
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    // Credit card
    /\b[A-Z]{2}\d{2}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/gi
    // IBAN
  ];
  static MAX_ERROR_MESSAGE_LENGTH = 500;
  constructor(eventManager) {
    super();
    this.eventManager = eventManager;
  }
  startTracking() {
    window.addEventListener("error", this.handleError);
    window.addEventListener("unhandledrejection", this.handleRejection);
    debugLog.debug("ErrorHandler", "Error tracking started");
  }
  stopTracking() {
    window.removeEventListener("error", this.handleError);
    window.removeEventListener("unhandledrejection", this.handleRejection);
    debugLog.debug("ErrorHandler", "Error tracking stopped");
  }
  shouldSample() {
    const config = this.get("config");
    const samplingRate = config?.errorSampling ?? 0.1;
    return Math.random() < samplingRate;
  }
  handleError = (event2) => {
    if (!this.shouldSample()) {
      return;
    }
    debugLog.warn("ErrorHandler", "JS error captured", {
      message: event2.message,
      filename: event2.filename,
      line: event2.lineno
    });
    this.eventManager.track({
      type: EventType.ERROR,
      error_data: {
        type: ErrorType.JS_ERROR,
        message: this.sanitize(event2.message || "Unknown error"),
        ...event2.filename && { url: event2.filename },
        ...event2.lineno && { line: event2.lineno },
        ...event2.colno && { column: event2.colno }
      }
    });
  };
  handleRejection = (event2) => {
    if (!this.shouldSample()) {
      return;
    }
    const message = this.extractRejectionMessage(event2.reason);
    debugLog.warn("ErrorHandler", "Promise rejection captured", { message });
    this.eventManager.track({
      type: EventType.ERROR,
      error_data: {
        type: ErrorType.PROMISE_REJECTION,
        message: this.sanitize(message)
      }
    });
  };
  extractRejectionMessage(reason) {
    if (!reason) return "Unknown rejection";
    if (typeof reason === "string") return reason;
    if (reason instanceof Error) {
      return reason.stack ?? reason.message ?? reason.toString();
    }
    if (typeof reason === "object" && "message" in reason) {
      return String(reason.message);
    }
    try {
      return JSON.stringify(reason);
    } catch {
      return String(reason);
    }
  }
  sanitize(text) {
    let sanitized = text.length > ErrorHandler.MAX_ERROR_MESSAGE_LENGTH ? text.slice(0, ErrorHandler.MAX_ERROR_MESSAGE_LENGTH) + "..." : text;
    for (const pattern of ErrorHandler.PII_PATTERNS) {
      const regex = new RegExp(pattern.source, pattern.flags);
      sanitized = sanitized.replace(regex, "[REDACTED]");
    }
    return sanitized;
  }
}
class App extends StateManager {
  isInitialized = false;
  suppressNextScrollTimer = null;
  managers = {};
  handlers = {};
  integrations = {};
  get initialized() {
    return this.isInitialized;
  }
  async init(appConfig) {
    if (this.isInitialized) {
      return;
    }
    if (!appConfig.id?.trim()) {
      throw new Error("Project ID is required");
    }
    try {
      this.managers.storage = new StorageManager();
      await this.setupState(appConfig);
      await this.setupIntegrations();
      this.managers.event = new EventManager(this.managers.storage, this.integrations.googleAnalytics);
      this.initializeHandlers();
      await this.managers.event.recoverPersistedEvents().catch(() => {
      });
      this.isInitialized = true;
      debugLog.info("App", "Initialization completed");
    } catch (error) {
      throw new Error(`TraceLog initialization failed: ${error}`);
    }
  }
  sendCustomEvent(name, metadata) {
    if (!this.managers.event) {
      return;
    }
    const { valid, error, sanitizedMetadata } = isEventValid(name, metadata);
    if (!valid) {
      const config = this.get("config");
      if (config?.mode === "qa" || config?.mode === "debug") {
        throw new Error(`Custom event "${name}" validation failed: ${error}`);
      }
      return;
    }
    this.managers.event.track({
      type: EventType.CUSTOM,
      custom_event: {
        name,
        ...sanitizedMetadata && { metadata: sanitizedMetadata }
      }
    });
  }
  async destroy() {
    if (!this.isInitialized) {
      return;
    }
    this.integrations.googleAnalytics?.cleanup();
    const handlerCleanups = Object.values(this.handlers).filter(Boolean).map(async (handler) => {
      try {
        await handler.stopTracking();
      } catch {
      }
    });
    await Promise.allSettled(handlerCleanups);
    if (this.suppressNextScrollTimer) {
      clearTimeout(this.suppressNextScrollTimer);
      this.suppressNextScrollTimer = null;
    }
    this.managers.event?.stop();
    this.set("hasStartSession", false);
    this.set("suppressNextScroll", false);
    this.set("sessionId", null);
    this.isInitialized = false;
    this.handlers = {};
  }
  // --- Private Setup Methods ---
  async setupState(appConfig) {
    const apiUrl = getApiUrlForProject(appConfig.id, appConfig.allowHttp);
    this.set("apiUrl", apiUrl);
    const configManager = new ConfigManager();
    const config = await configManager.get(apiUrl, appConfig);
    this.set("config", config);
    const userId = UserManager.getId(this.managers.storage, config.id);
    this.set("userId", userId);
    this.set("device", getDeviceType());
    const pageUrl = normalizeUrl(window.location.href, config.sensitiveQueryParams);
    this.set("pageUrl", pageUrl);
  }
  async setupIntegrations() {
    const config = this.get("config");
    const measurementId = config.integrations?.googleAnalytics?.measurementId;
    if (!config.ipExcluded && measurementId?.trim()) {
      try {
        this.integrations.googleAnalytics = new GoogleAnalyticsIntegration();
        await this.integrations.googleAnalytics.initialize();
      } catch {
        this.integrations.googleAnalytics = void 0;
      }
    }
  }
  // --- Private Handler Initialization ---
  initializeHandlers() {
    this.handlers.session = new SessionHandler(
      this.managers.storage,
      this.managers.event
    );
    this.handlers.session.startTracking();
    const onPageView = () => {
      this.set("suppressNextScroll", true);
      if (this.suppressNextScrollTimer) {
        clearTimeout(this.suppressNextScrollTimer);
      }
      this.suppressNextScrollTimer = window.setTimeout(() => {
        this.set("suppressNextScroll", false);
      }, SCROLL_DEBOUNCE_TIME_MS * SCROLL_SUPPRESS_MULTIPLIER);
    };
    this.handlers.pageView = new PageViewHandler(this.managers.event, onPageView);
    this.handlers.pageView.startTracking();
    this.handlers.click = new ClickHandler(this.managers.event);
    this.handlers.click.startTracking();
    this.handlers.scroll = new ScrollHandler(this.managers.event);
    this.handlers.scroll.startTracking();
    this.handlers.performance = new PerformanceHandler(this.managers.event);
    this.handlers.performance.startTracking().catch(() => {
    });
    this.handlers.error = new ErrorHandler(this.managers.event);
    this.handlers.error.startTracking();
  }
}
class TestBridge extends App {
  _isInitializing;
  _isDestroying = false;
  constructor(isInitializing2, isDestroying2) {
    super();
    this._isInitializing = isInitializing2;
    this._isDestroying = isDestroying2;
  }
  isInitializing() {
    return this._isInitializing;
  }
  sendCustomEvent(name, data) {
    this.ensureInitialized();
    super.sendCustomEvent(name, data);
  }
  getSessionData() {
    return {
      id: this.get("sessionId"),
      isActive: !!this.get("sessionId"),
      timeout: this.get("config")?.sessionTimeout ?? 15 * 60 * 1e3
    };
  }
  setSessionTimeout(timeout) {
    const config = this.get("config");
    if (config) {
      config.sessionTimeout = timeout;
      this.set("config", config);
    }
  }
  getQueueLength() {
    return this.managers.event?.getQueueLength() ?? 0;
  }
  forceInitLock(enabled = true) {
    this._isInitializing = enabled;
  }
  get(key) {
    return super.get(key);
  }
  // Manager accessors
  getStorageManager() {
    return this.safeAccess(this.managers?.storage);
  }
  getEventManager() {
    return this.safeAccess(this.managers?.event);
  }
  // Handler accessors
  getSessionHandler() {
    return this.safeAccess(this.handlers?.session);
  }
  getPageViewHandler() {
    return this.safeAccess(this.handlers?.pageView);
  }
  getClickHandler() {
    return this.safeAccess(this.handlers?.click);
  }
  getScrollHandler() {
    return this.safeAccess(this.handlers?.scroll);
  }
  getPerformanceHandler() {
    return this.safeAccess(this.handlers?.performance);
  }
  getErrorHandler() {
    return this.safeAccess(this.handlers?.error);
  }
  // Integration accessors
  getGoogleAnalytics() {
    return this.safeAccess(this.integrations?.googleAnalytics);
  }
  async destroy() {
    this.ensureInitialized();
    this.ensureNotDestroying();
    this._isDestroying = true;
    try {
      await super.destroy();
    } finally {
      this._isDestroying = false;
    }
  }
  /**
   * Helper to safely access managers/handlers and convert undefined to null
   */
  safeAccess(value) {
    return value ?? null;
  }
  /**
   * Ensures the app is initialized, throws if not
   */
  ensureInitialized() {
    if (!this.initialized) {
      throw new Error("App not initialized");
    }
  }
  /**
   * Ensures destroy operation is not in progress, throws if it is
   */
  ensureNotDestroying() {
    if (this._isDestroying) {
      throw new Error("Destroy operation already in progress");
    }
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
  DEFAULT_SESSION_TIMEOUT
}, Symbol.toStringTag, { value: "Module" }));
let app = null;
let isInitializing = false;
let isDestroying = false;
const init = async (appConfig) => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("This library can only be used in a browser environment");
  }
  if (app) {
    debugLog.debug("API", "Library already initialized, skipping duplicate initialization");
    return;
  }
  if (isInitializing) {
    debugLog.warn("API", "Initialization already in progress");
    throw new Error("Initialization already in progress");
  }
  isInitializing = true;
  try {
    debugLog.info("API", "Initializing TraceLog", { projectId: appConfig.id });
    const validatedConfig = validateAndNormalizeConfig(appConfig);
    const instance = new App();
    await instance.init(validatedConfig);
    app = instance;
    debugLog.info("API", "TraceLog initialized successfully", { projectId: validatedConfig.id });
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
  if (!app) {
    throw new Error("TraceLog not initialized. Please call init() first.");
  }
  try {
    app.sendCustomEvent(name, metadata);
  } catch (error) {
    debugLog.error("API", "Failed to send custom event", { eventName: name, error });
    throw error;
  }
};
const isInitialized = () => {
  return app !== null;
};
const destroy = async () => {
  if (!app) {
    throw new Error("App not initialized");
  }
  if (isDestroying) {
    throw new Error("Destroy operation already in progress");
  }
  isDestroying = true;
  try {
    debugLog.info("API", "Destroying TraceLog instance");
    await app.destroy();
    app = null;
    isInitializing = false;
    debugLog.info("API", "TraceLog destroyed successfully");
  } catch (error) {
    app = null;
    isInitializing = false;
    debugLog.error("API", "Error during destroy, forced cleanup", { error });
    throw error;
  } finally {
    isDestroying = false;
  }
};
if (typeof window !== "undefined") {
  const injectTestingBridge = () => {
    window.__traceLogBridge = new TestBridge(isInitializing, isDestroying);
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectTestingBridge);
  } else {
    injectTestingBridge();
  }
}
const api = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Constants: app_constants,
  Types: app_types,
  destroy,
  event,
  init,
  isInitialized
}, Symbol.toStringTag, { value: "Module" }));
var e, o = -1, a = function(e3) {
  addEventListener("pageshow", function(n) {
    n.persisted && (o = n.timeStamp, e3(n));
  }, true);
}, c = function() {
  var e3 = self.performance && performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
  if (e3 && e3.responseStart > 0 && e3.responseStart < performance.now()) return e3;
}, u = function() {
  var e3 = c();
  return e3 && e3.activationStart || 0;
}, f = function(e3, n) {
  var t = c(), r = "navigate";
  o >= 0 ? r = "back-forward-cache" : t && (document.prerendering || u() > 0 ? r = "prerender" : document.wasDiscarded ? r = "restore" : t.type && (r = t.type.replace(/_/g, "-")));
  return { name: e3, value: void 0 === n ? -1 : n, rating: "good", delta: 0, entries: [], id: "v4-".concat(Date.now(), "-").concat(Math.floor(8999999999999 * Math.random()) + 1e12), navigationType: r };
}, s = function(e3, n, t) {
  try {
    if (PerformanceObserver.supportedEntryTypes.includes(e3)) {
      var r = new PerformanceObserver(function(e4) {
        Promise.resolve().then(function() {
          n(e4.getEntries());
        });
      });
      return r.observe(Object.assign({ type: e3, buffered: true }, t || {})), r;
    }
  } catch (e4) {
  }
}, d = function(e3, n, t, r) {
  var i, o2;
  return function(a2) {
    n.value >= 0 && (a2 || r) && ((o2 = n.value - (i || 0)) || void 0 === i) && (i = n.value, n.delta = o2, n.rating = function(e4, n2) {
      return e4 > n2[1] ? "poor" : e4 > n2[0] ? "needs-improvement" : "good";
    }(n.value, t), e3(n));
  };
}, l = function(e3) {
  requestAnimationFrame(function() {
    return requestAnimationFrame(function() {
      return e3();
    });
  });
}, p = function(e3) {
  document.addEventListener("visibilitychange", function() {
    "hidden" === document.visibilityState && e3();
  });
}, v = function(e3) {
  var n = false;
  return function() {
    n || (e3(), n = true);
  };
}, m = -1, h = function() {
  return "hidden" !== document.visibilityState || document.prerendering ? 1 / 0 : 0;
}, g = function(e3) {
  "hidden" === document.visibilityState && m > -1 && (m = "visibilitychange" === e3.type ? e3.timeStamp : 0, T());
}, y = function() {
  addEventListener("visibilitychange", g, true), addEventListener("prerenderingchange", g, true);
}, T = function() {
  removeEventListener("visibilitychange", g, true), removeEventListener("prerenderingchange", g, true);
}, E = function() {
  return m < 0 && (m = h(), y(), a(function() {
    setTimeout(function() {
      m = h(), y();
    }, 0);
  })), { get firstHiddenTime() {
    return m;
  } };
}, C = function(e3) {
  document.prerendering ? addEventListener("prerenderingchange", function() {
    return e3();
  }, true) : e3();
}, b = [1800, 3e3], S = function(e3, n) {
  n = n || {}, C(function() {
    var t, r = E(), i = f("FCP"), o2 = s("paint", function(e4) {
      e4.forEach(function(e5) {
        "first-contentful-paint" === e5.name && (o2.disconnect(), e5.startTime < r.firstHiddenTime && (i.value = Math.max(e5.startTime - u(), 0), i.entries.push(e5), t(true)));
      });
    });
    o2 && (t = d(e3, i, b, n.reportAllChanges), a(function(r2) {
      i = f("FCP"), t = d(e3, i, b, n.reportAllChanges), l(function() {
        i.value = performance.now() - r2.timeStamp, t(true);
      });
    }));
  });
}, L = [0.1, 0.25], w = function(e3, n) {
  n = n || {}, S(v(function() {
    var t, r = f("CLS", 0), i = 0, o2 = [], c2 = function(e4) {
      e4.forEach(function(e5) {
        if (!e5.hadRecentInput) {
          var n2 = o2[0], t2 = o2[o2.length - 1];
          i && e5.startTime - t2.startTime < 1e3 && e5.startTime - n2.startTime < 5e3 ? (i += e5.value, o2.push(e5)) : (i = e5.value, o2 = [e5]);
        }
      }), i > r.value && (r.value = i, r.entries = o2, t());
    }, u2 = s("layout-shift", c2);
    u2 && (t = d(e3, r, L, n.reportAllChanges), p(function() {
      c2(u2.takeRecords()), t(true);
    }), a(function() {
      i = 0, r = f("CLS", 0), t = d(e3, r, L, n.reportAllChanges), l(function() {
        return t();
      });
    }), setTimeout(t, 0));
  }));
}, A = 0, I = 1 / 0, P = 0, M = function(e3) {
  e3.forEach(function(e4) {
    e4.interactionId && (I = Math.min(I, e4.interactionId), P = Math.max(P, e4.interactionId), A = P ? (P - I) / 7 + 1 : 0);
  });
}, k = function() {
  return e ? A : performance.interactionCount || 0;
}, F = function() {
  "interactionCount" in performance || e || (e = s("event", M, { type: "event", buffered: true, durationThreshold: 0 }));
}, D = [], x = /* @__PURE__ */ new Map(), R = 0, B = function() {
  var e3 = Math.min(D.length - 1, Math.floor((k() - R) / 50));
  return D[e3];
}, H = [], q = function(e3) {
  if (H.forEach(function(n2) {
    return n2(e3);
  }), e3.interactionId || "first-input" === e3.entryType) {
    var n = D[D.length - 1], t = x.get(e3.interactionId);
    if (t || D.length < 10 || e3.duration > n.latency) {
      if (t) e3.duration > t.latency ? (t.entries = [e3], t.latency = e3.duration) : e3.duration === t.latency && e3.startTime === t.entries[0].startTime && t.entries.push(e3);
      else {
        var r = { id: e3.interactionId, latency: e3.duration, entries: [e3] };
        x.set(r.id, r), D.push(r);
      }
      D.sort(function(e4, n2) {
        return n2.latency - e4.latency;
      }), D.length > 10 && D.splice(10).forEach(function(e4) {
        return x.delete(e4.id);
      });
    }
  }
}, O = function(e3) {
  var n = self.requestIdleCallback || self.setTimeout, t = -1;
  return e3 = v(e3), "hidden" === document.visibilityState ? e3() : (t = n(e3), p(e3)), t;
}, N = [200, 500], j = function(e3, n) {
  "PerformanceEventTiming" in self && "interactionId" in PerformanceEventTiming.prototype && (n = n || {}, C(function() {
    var t;
    F();
    var r, i = f("INP"), o2 = function(e4) {
      O(function() {
        e4.forEach(q);
        var n2 = B();
        n2 && n2.latency !== i.value && (i.value = n2.latency, i.entries = n2.entries, r());
      });
    }, c2 = s("event", o2, { durationThreshold: null !== (t = n.durationThreshold) && void 0 !== t ? t : 40 });
    r = d(e3, i, N, n.reportAllChanges), c2 && (c2.observe({ type: "first-input", buffered: true }), p(function() {
      o2(c2.takeRecords()), r(true);
    }), a(function() {
      R = k(), D.length = 0, x.clear(), i = f("INP"), r = d(e3, i, N, n.reportAllChanges);
    }));
  }));
}, _ = [2500, 4e3], z = {}, G = function(e3, n) {
  n = n || {}, C(function() {
    var t, r = E(), i = f("LCP"), o2 = function(e4) {
      n.reportAllChanges || (e4 = e4.slice(-1)), e4.forEach(function(e5) {
        e5.startTime < r.firstHiddenTime && (i.value = Math.max(e5.startTime - u(), 0), i.entries = [e5], t());
      });
    }, c2 = s("largest-contentful-paint", o2);
    if (c2) {
      t = d(e3, i, _, n.reportAllChanges);
      var m2 = v(function() {
        z[i.id] || (o2(c2.takeRecords()), c2.disconnect(), z[i.id] = true, t(true));
      });
      ["keydown", "click"].forEach(function(e4) {
        addEventListener(e4, function() {
          return O(m2);
        }, { once: true, capture: true });
      }), p(m2), a(function(r2) {
        i = f("LCP"), t = d(e3, i, _, n.reportAllChanges), l(function() {
          i.value = performance.now() - r2.timeStamp, z[i.id] = true, t(true);
        });
      });
    }
  });
}, J = [800, 1800], K = function e2(n) {
  document.prerendering ? C(function() {
    return e2(n);
  }) : "complete" !== document.readyState ? addEventListener("load", function() {
    return e2(n);
  }, true) : setTimeout(n, 0);
}, Q = function(e3, n) {
  n = n || {};
  var t = f("TTFB"), r = d(e3, t, J, n.reportAllChanges);
  K(function() {
    var i = c();
    i && (t.value = Math.max(i.responseStart - u(), 0), t.entries = [i], r(true), a(function() {
      t = f("TTFB", 0), (r = d(e3, t, J, n.reportAllChanges))(true);
    }));
  });
};
const webVitals = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  CLSThresholds: L,
  FCPThresholds: b,
  INPThresholds: N,
  LCPThresholds: _,
  TTFBThresholds: J,
  onCLS: w,
  onFCP: S,
  onINP: j,
  onLCP: G,
  onTTFB: Q
}, Symbol.toStringTag, { value: "Module" }));
export {
  api as TraceLog
};
//# sourceMappingURL=tracelog.js.map
