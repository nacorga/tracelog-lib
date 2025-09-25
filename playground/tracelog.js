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
const PRECISION_FOUR_DECIMALS = 4;
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
const INITIALIZATION_MAX_CONCURRENT_RETRIES = 20;
const INITIALIZATION_CONCURRENT_RETRY_DELAY_MS = 50;
const INITIALIZATION_TIMEOUT_MS = 1e4;
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
class SimpleCircuitBreaker {
  failureCount = 0;
  isOpen = false;
  openTime = 0;
  MAX_FAILURES = 5;
  RECOVERY_DELAY_MS = 3e4;
  // 30 seconds
  /**
   * Records a failure and opens the circuit if max failures reached
   */
  recordFailure() {
    this.failureCount++;
    if (this.failureCount >= this.MAX_FAILURES) {
      this.open();
    }
  }
  /**
   * Records a success and closes the circuit, resetting failure count
   */
  recordSuccess() {
    this.failureCount = 0;
    this.close();
  }
  /**
   * Checks if an attempt can be made
   * Returns true if circuit is closed or recovery delay has elapsed
   */
  canAttempt() {
    if (!this.isOpen) return true;
    const timeSinceOpen = Date.now() - this.openTime;
    if (timeSinceOpen >= this.RECOVERY_DELAY_MS) {
      this.close();
      return true;
    }
    return false;
  }
  /**
   * Gets the current state of the circuit breaker
   */
  getState() {
    return {
      isOpen: this.isOpen,
      failureCount: this.failureCount
    };
  }
  open() {
    this.isOpen = true;
    this.openTime = Date.now();
    console.warn("Circuit breaker opened - too many failures");
  }
  close() {
    this.isOpen = false;
    this.openTime = 0;
    this.failureCount = 0;
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
  retryTimeoutId = null;
  retryCount = 0;
  isRetrying = false;
  // Fixed retry configuration
  RETRY_DELAY_MS = 5e3;
  // 5 seconds
  MAX_RETRIES = 3;
  REQUEST_TIMEOUT_MS = 1e4;
  // 10 seconds
  constructor(storeManager) {
    super();
    this.storeManager = storeManager;
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
      const response = await this.sendWithTimeout(url, payload);
      return response.ok;
    } catch (error) {
      debugLog.error("SenderManager", "Send request failed", { error });
      return false;
    }
  }
  async sendWithTimeout(url, payload) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT_MS);
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
        throw new Error(`HTTP ${response.status}`);
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
    this.retryCount = 0;
    this.isRetrying = false;
    this.clearRetryTimeout();
  }
  scheduleRetry(body, originalCallbacks) {
    if (this.retryTimeoutId !== null || this.isRetrying) {
      return;
    }
    if (this.retryCount >= this.MAX_RETRIES) {
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
      } else if (this.retryCount >= this.MAX_RETRIES) {
        this.clearPersistedEvents();
        this.resetRetryState();
        originalCallbacks?.onFailure?.();
      } else {
        this.scheduleRetry(body, originalCallbacks);
      }
    }, this.RETRY_DELAY_MS);
    debugLog.debug("SenderManager", "Retry scheduled", {
      retryCount: this.retryCount,
      retryDelay: this.RETRY_DELAY_MS,
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
class EventManager extends StateManager {
  googleAnalytics;
  dataSender;
  circuitBreaker = new SimpleCircuitBreaker();
  eventsQueue = [];
  lastEvent = null;
  eventsQueueIntervalId = null;
  intervalActive = false;
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
    if (!this.circuitBreaker.canAttempt()) {
      debugLog.warn("EventManager", "Event dropped - circuit breaker open");
      return;
    }
    if (!this.shouldSample()) {
      debugLog.debug("EventManager", "Event filtered by sampling");
      return;
    }
    const effectivePageUrl = page_url || this.get("pageUrl");
    const isRouteExcluded = isUrlPathExcluded(effectivePageUrl, this.get("config")?.excludedUrlPaths ?? []);
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
    if (this.isDuplicate(payload)) {
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
    const projectTags = this.get("config")?.tags;
    if (projectTags?.length) {
      payload.tags = projectTags;
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
    this.lastEvent = null;
    this.eventsQueue = [];
    this.dataSender.stop();
    debugLog.debug("EventManager", "EventManager stopped");
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
      if (this.eventsQueue.length > 0) {
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
    const eventIds = eventsToSend.map((e3) => e3.timestamp + "_" + e3.type);
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
    const eventIds = eventsToSend.map((e3) => e3.timestamp + "_" + e3.type);
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
  async sendEventsQueue() {
    if (!this.get("sessionId")) {
      debugLog.debug("EventManager", "No session ID, skipping send");
      return;
    }
    if (this.eventsQueue.length === 0) {
      return;
    }
    if (!this.circuitBreaker.canAttempt()) {
      debugLog.debug("EventManager", "Circuit breaker open, skipping send");
      return;
    }
    const body = this.buildEventsPayload();
    const eventsToSend = [...this.eventsQueue];
    const eventIds = eventsToSend.map((e3) => e3.timestamp + "_" + e3.type);
    await this.dataSender.sendEventsQueue(body, {
      onSuccess: () => {
        this.circuitBreaker.recordSuccess();
        this.removeProcessedEvents(eventIds);
        debugLog.info("EventManager", "Events sent successfully", {
          eventCount: eventsToSend.length,
          remainingQueueLength: this.eventsQueue.length
        });
      },
      onFailure: async () => {
        this.circuitBreaker.recordFailure();
        debugLog.warn("EventManager", "Events send failed, keeping in queue", {
          eventCount: eventsToSend.length,
          circuitState: this.circuitBreaker.getState()
        });
      }
    });
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
    deduplicatedEvents.sort((a2, b2) => a2.timestamp - b2.timestamp);
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
  /**
   * Simple sampling check using global sampling rate
   */
  shouldSample() {
    const samplingRate = this.get("config")?.samplingRate ?? 1;
    return Math.random() < samplingRate;
  }
  /**
   * Checks if event is duplicate of last event
   */
  isDuplicate(newEvent) {
    if (!this.lastEvent) return false;
    const timeDiff = Date.now() - this.lastEvent.timestamp;
    if (timeDiff > DUPLICATE_EVENT_THRESHOLD_MS) return false;
    if (this.lastEvent.type !== newEvent.type) return false;
    if (this.lastEvent.page_url !== newEvent.page_url) return false;
    if (newEvent.click_data && this.lastEvent.click_data) {
      return this.areClicksSimilar(newEvent.click_data, this.lastEvent.click_data);
    }
    if (newEvent.scroll_data && this.lastEvent.scroll_data) {
      return this.areScrollsSimilar(newEvent.scroll_data, this.lastEvent.scroll_data);
    }
    if (newEvent.custom_event && this.lastEvent.custom_event) {
      return newEvent.custom_event.name === this.lastEvent.custom_event.name;
    }
    if (newEvent.web_vitals && this.lastEvent.web_vitals) {
      return newEvent.web_vitals.type === this.lastEvent.web_vitals.type;
    }
    return true;
  }
  /**
   * Checks if two clicks are similar within tolerance
   */
  areClicksSimilar(click1, click2) {
    const TOLERANCE = 5;
    const xDiff = Math.abs((click1.x || 0) - (click2.x || 0));
    const yDiff = Math.abs((click1.y || 0) - (click2.y || 0));
    return xDiff < TOLERANCE && yDiff < TOLERANCE;
  }
  /**
   * Checks if two scrolls are similar
   */
  areScrollsSimilar(scroll1, scroll2) {
    return scroll1.depth === scroll2.depth && scroll1.direction === scroll2.direction;
  }
  removeProcessedEvents(eventIds) {
    const eventIdSet = new Set(eventIds);
    this.eventsQueue = this.eventsQueue.filter((event2) => {
      const eventId = event2.timestamp + "_" + event2.type;
      return !eventIdSet.has(eventId);
    });
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
class SessionManager extends StateManager {
  storageManager;
  eventManager;
  sessionTimeoutId = null;
  broadcastChannel = null;
  activityListeners = null;
  visibilityChangeTimeout = null;
  constructor(storageManager, eventManager) {
    super();
    this.storageManager = storageManager;
    this.eventManager = eventManager;
  }
  /**
   * Inicializa cross-tab sync simple
   */
  initCrossTabSync() {
    if (typeof BroadcastChannel === "undefined") {
      debugLog.warn("SessionManager", "BroadcastChannel not supported");
      return;
    }
    this.broadcastChannel = new BroadcastChannel("tracelog_session");
    this.broadcastChannel.onmessage = (event2) => {
      const { sessionId, timestamp } = event2.data;
      if (sessionId && timestamp) {
        const currentSessionId = this.get("sessionId");
        if (!currentSessionId || timestamp > Date.now() - 1e3) {
          this.set("sessionId", sessionId);
          this.storageManager.setItem("sessionId", sessionId);
          this.storageManager.setItem("lastActivity", timestamp.toString());
          debugLog.debug("SessionManager", "Session synced from another tab", {
            sessionId
          });
        }
      }
    };
  }
  /**
   * Comparte sesión actual con otras tabs
   */
  shareSession(sessionId) {
    if (!this.broadcastChannel) return;
    this.broadcastChannel.postMessage({
      sessionId,
      timestamp: Date.now()
    });
  }
  /**
   * Limpia cross-tab sync
   */
  cleanupCrossTabSync() {
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
  }
  /**
   * Recupera sesión desde localStorage si existe
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
    debugLog.info("SessionManager", "Session recovered from storage", {
      sessionId: storedSessionId,
      lastActivity: lastActivityTime
    });
    return storedSessionId;
  }
  /**
   * Persiste sesión en localStorage
   */
  persistSession(sessionId) {
    this.storageManager.setItem("sessionId", sessionId);
    this.storageManager.setItem("lastActivity", Date.now().toString());
  }
  /**
   * Inicia tracking de sesión
   */
  async startTracking() {
    const recoveredSessionId = this.recoverSession();
    let sessionId;
    let isRecovered = false;
    if (recoveredSessionId) {
      sessionId = recoveredSessionId;
      isRecovered = true;
    } else {
      sessionId = this.generateSessionId();
    }
    await this.set("sessionId", sessionId);
    this.persistSession(sessionId);
    this.eventManager.track({
      type: EventType.SESSION_START,
      ...isRecovered && { session_start_recovered: true }
    });
    this.initCrossTabSync();
    this.shareSession(sessionId);
    this.setupSessionTimeout();
    this.setupActivityListeners();
    this.setupVisibilityListener();
    this.setupUnloadListener();
    debugLog.info("SessionManager", "Session tracking started", {
      sessionId,
      recovered: isRecovered
    });
  }
  /**
   * Genera ID de sesión único
   */
  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  /**
   * Configura timeout de sesión
   */
  setupSessionTimeout() {
    this.clearSessionTimeout();
    const sessionTimeout = this.get("config")?.sessionTimeout ?? DEFAULT_SESSION_TIMEOUT;
    this.sessionTimeoutId = setTimeout(() => {
      this.endSession("inactivity");
    }, sessionTimeout);
  }
  /**
   * Reinicia timeout de sesión
   */
  resetSessionTimeout() {
    this.setupSessionTimeout();
    const sessionId = this.get("sessionId");
    if (sessionId) {
      this.persistSession(sessionId);
    }
  }
  /**
   * Limpia timeout de sesión
   */
  clearSessionTimeout() {
    if (this.sessionTimeoutId) {
      clearTimeout(this.sessionTimeoutId);
      this.sessionTimeoutId = null;
    }
  }
  /**
   * Configura listeners de actividad del usuario
   */
  setupActivityListeners() {
    const resetTimeout = () => this.resetSessionTimeout();
    document.addEventListener("click", resetTimeout);
    document.addEventListener("keydown", resetTimeout);
    document.addEventListener("scroll", resetTimeout);
    this.activityListeners = {
      click: resetTimeout,
      keydown: resetTimeout,
      scroll: resetTimeout
    };
  }
  /**
   * Limpia listeners de actividad
   */
  cleanupActivityListeners() {
    if (this.activityListeners) {
      document.removeEventListener("click", this.activityListeners.click);
      document.removeEventListener("keydown", this.activityListeners.keydown);
      document.removeEventListener("scroll", this.activityListeners.scroll);
      this.activityListeners = null;
    }
  }
  /**
   * Configura listener de visibilidad
   */
  setupVisibilityListener() {
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
  }
  /**
   * Configura listener de unload
   */
  setupUnloadListener() {
    window.addEventListener("beforeunload", () => {
      this.eventManager.flushImmediatelySync();
    });
  }
  /**
   * Finaliza sesión
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
   * Detiene tracking de sesión
   */
  async stopTracking() {
    this.endSession("manual_stop");
  }
  /**
   * Limpia recursos
   */
  destroy() {
    this.clearSessionTimeout();
    this.cleanupActivityListeners();
    this.cleanupCrossTabSync();
    if (this.visibilityChangeTimeout) {
      clearTimeout(this.visibilityChangeTimeout);
      this.visibilityChangeTimeout = null;
    }
  }
}
class SessionHandler extends StateManager {
  eventManager;
  storageManager;
  sessionManager = null;
  constructor(storageManager, eventManager) {
    super();
    this.eventManager = eventManager;
    this.storageManager = storageManager;
  }
  async startTracking() {
    if (this.sessionManager) {
      debugLog.debug("SessionHandler", "Session tracking already active");
      return;
    }
    debugLog.debug("SessionHandler", "Starting session tracking");
    this.sessionManager = new SessionManager(this.storageManager, this.eventManager);
    await this.sessionManager.startTracking();
    debugLog.debug("SessionHandler", "Session tracking started");
  }
  async stopTracking() {
    debugLog.info("SessionHandler", "Stopping session tracking");
    if (this.sessionManager) {
      await this.sessionManager.stopTracking();
      this.sessionManager.destroy();
      this.sessionManager = null;
    }
  }
  destroy() {
    if (this.sessionManager) {
      this.sessionManager.destroy();
      this.sessionManager = null;
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
    const x2 = event2.clientX;
    const y2 = event2.clientY;
    const relativeX = rect.width > 0 ? Math.max(0, Math.min(1, Number(((x2 - rect.left) / rect.width).toFixed(3)))) : 0;
    const relativeY = rect.height > 0 ? Math.max(0, Math.min(1, Number(((y2 - rect.top) / rect.height).toFixed(3)))) : 0;
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
    const href = relevantElement.getAttribute("href");
    const title = relevantElement.getAttribute("title");
    const alt = relevantElement.getAttribute("alt");
    const role = relevantElement.getAttribute("role");
    const ariaLabel = relevantElement.getAttribute("aria-label");
    const className = typeof relevantElement.className === "string" ? relevantElement.className : String(relevantElement.className);
    return {
      x: x2,
      y: y2,
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
    // Email
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    // Phone US
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    // Credit card
    /\b[A-Z]{2}\d{2}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g
    // IBAN
  ];
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
  handleError = (event2) => {
    const config = this.get("config");
    const samplingRate = config?.errorSampling ?? 0.1;
    if (Math.random() >= samplingRate) {
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
        message: this.sanitize(event2.message || "Unknown error")
      }
    });
  };
  handleRejection = (event2) => {
    const config = this.get("config");
    const samplingRate = config?.errorSampling ?? 0.1;
    if (Math.random() >= samplingRate) {
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
    if (reason instanceof Error) return reason.message || reason.toString();
    return String(reason);
  }
  sanitize(text) {
    let sanitized = text;
    for (const pattern of this.piiPatterns) {
      sanitized = sanitized.replace(pattern, "[REDACTED]");
    }
    return sanitized;
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
  suppressNextScrollTimer = null;
  get initialized() {
    return this.isInitialized;
  }
  async init(appConfig) {
    if (this.isInitialized) {
      debugLog.debug("App", "Already initialized", { projectId: appConfig.id });
      return;
    }
    debugLog.info("App", "Initialization started", { projectId: appConfig.id });
    if (!appConfig.id?.trim()) {
      throw new Error("Project ID is required");
    }
    this.storageManager = new StorageManager();
    try {
      await this.setState(appConfig);
    } catch (error) {
      debugLog.error("App", "State setup failed", { error });
      throw error;
    }
    try {
      await this.setupIntegrations();
    } catch (error) {
      debugLog.warn("App", "Integration setup failed, continuing without", { error });
      this.googleAnalytics = null;
    }
    this.eventManager = new EventManager(this.storageManager, this.googleAnalytics);
    try {
      await this.initHandlers();
    } catch (error) {
      debugLog.error("App", "Handlers initialization failed", { error });
      throw error;
    }
    try {
      await this.eventManager.recoverPersistedEvents();
    } catch (error) {
      debugLog.warn("App", "Event recovery failed, continuing", { error });
    }
    this.isInitialized = true;
    debugLog.info("App", "Initialization completed", { projectId: appConfig.id });
  }
  sendCustomEvent(name, metadata) {
    if (!this.eventManager) {
      debugLog.warn("App", "Custom event before initialization", { name });
      return;
    }
    const { valid, error, sanitizedMetadata } = isEventValid(name, metadata);
    if (valid) {
      debugLog.debug("App", "Custom event tracked", { name, hasMetadata: !!sanitizedMetadata });
      this.eventManager.track({
        type: EventType.CUSTOM,
        custom_event: {
          name,
          ...sanitizedMetadata && { metadata: sanitizedMetadata }
        }
      });
    } else {
      const mode = this.get("config")?.mode;
      debugLog.clientError("App", `Custom event validation failed: ${error}`, {
        name,
        error,
        mode
      });
      if (mode === "qa" || mode === "debug") {
        throw new Error(`Custom event "${name}" validation failed: ${error}`);
      }
    }
  }
  async destroy() {
    if (!this.isInitialized) {
      debugLog.warn("App", "Destroy called but not initialized");
      return;
    }
    debugLog.info("App", "Cleanup started");
    if (this.googleAnalytics) {
      try {
        this.googleAnalytics.cleanup();
      } catch (error) {
        debugLog.warn("App", "Analytics cleanup failed", { error });
      }
    }
    const handlers = [
      this.sessionHandler,
      this.pageViewHandler,
      this.clickHandler,
      this.scrollHandler,
      this.performanceHandler,
      this.errorHandler
    ];
    for (const handler of handlers) {
      if (handler) {
        try {
          await handler.stopTracking();
        } catch (error) {
          debugLog.warn("App", "Handler cleanup failed", { error });
        }
      }
    }
    if (this.suppressNextScrollTimer) {
      clearTimeout(this.suppressNextScrollTimer);
      this.suppressNextScrollTimer = null;
    }
    if (this.eventManager) {
      try {
        this.eventManager.stop();
      } catch (error) {
        debugLog.warn("App", "EventManager cleanup failed", { error });
      }
    }
    await this.set("hasStartSession", false);
    await this.set("suppressNextScroll", false);
    await this.set("sessionId", null);
    this.isInitialized = false;
    debugLog.info("App", "Cleanup completed");
  }
  // --- Private Setup Methods ---
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
    const config = await configManager.get(this.get("apiUrl"), appConfig);
    await this.set("config", config);
  }
  async setUserId() {
    const userManager = new UserManager(this.storageManager);
    await this.set("userId", userManager.getId());
  }
  async setDevice() {
    await this.set("device", getDeviceType());
  }
  async setPageUrl() {
    const url = normalizeUrl(window.location.href, this.get("config").sensitiveQueryParams);
    await this.set("pageUrl", url);
  }
  async setupIntegrations() {
    const config = this.get("config");
    const isIPExcluded = config.ipExcluded;
    const measurementId = config.integrations?.googleAnalytics?.measurementId;
    if (!isIPExcluded && measurementId?.trim()) {
      this.googleAnalytics = new GoogleAnalyticsIntegration();
      await this.googleAnalytics.initialize();
    }
  }
  // --- Private Handler Initialization ---
  async initHandlers() {
    if (!this.eventManager || !this.storageManager) {
      throw new Error("EventManager and StorageManager must be initialized first");
    }
    this.initSessionHandler();
    this.initPageViewHandler();
    this.initClickHandler();
    this.initScrollHandler();
    await this.initPerformanceHandler();
    this.initErrorHandler();
  }
  initSessionHandler() {
    this.sessionHandler = new SessionHandler(this.storageManager, this.eventManager);
    this.sessionHandler.startTracking();
  }
  initPageViewHandler() {
    const onPageView = async () => {
      await this.set("suppressNextScroll", true);
      if (this.suppressNextScrollTimer) {
        clearTimeout(this.suppressNextScrollTimer);
      }
      this.suppressNextScrollTimer = window.setTimeout(async () => {
        await this.set("suppressNextScroll", false);
      }, SCROLL_DEBOUNCE_TIME_MS * SCROLL_SUPPRESS_MULTIPLIER);
    };
    this.pageViewHandler = new PageViewHandler(this.eventManager, onPageView);
    this.pageViewHandler.startTracking();
  }
  initClickHandler() {
    this.clickHandler = new ClickHandler(this.eventManager);
    this.clickHandler.startTracking();
  }
  initScrollHandler() {
    this.scrollHandler = new ScrollHandler(this.eventManager);
    this.scrollHandler.startTracking();
  }
  async initPerformanceHandler() {
    this.performanceHandler = new PerformanceHandler(this.eventManager);
    await this.performanceHandler.startTracking();
  }
  initErrorHandler() {
    this.errorHandler = new ErrorHandler(this.eventManager);
    this.errorHandler.startTracking();
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
      const maxRetries = INITIALIZATION_MAX_CONCURRENT_RETRIES;
      const retryDelay = INITIALIZATION_CONCURRENT_RETRY_DELAY_MS;
      const globalTimeout = INITIALIZATION_TIMEOUT_MS;
      const retryPromise = (async () => {
        let retries = 0;
        while (isInitializing && retries < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          retries++;
        }
        return retries;
      })();
      const timeoutPromise = new Promise((_2, reject) => {
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
  debugLog.warn(
    "API",
    "getRecoveryStats() is deprecated in v2.0 and will be removed in v3.0 - the v2 refactor simplified error recovery"
  );
  return null;
};
const attemptSystemRecovery = async () => {
  debugLog.warn(
    "API",
    "attemptSystemRecovery() is deprecated in v2.0 and will be removed in v3.0 - v2 uses automatic degradation"
  );
  return Promise.resolve();
};
const aggressiveFingerprintCleanup = () => {
  debugLog.warn(
    "API",
    "aggressiveFingerprintCleanup() is deprecated in v2.0 and will be removed in v3.0 - v2 simplified deduplication"
  );
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
