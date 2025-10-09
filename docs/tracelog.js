const DEFAULT_SESSION_TIMEOUT = 15 * 60 * 1e3;
const DUPLICATE_EVENT_THRESHOLD_MS = 500;
const EVENT_SENT_INTERVAL_MS = 1e4;
const SCROLL_DEBOUNCE_TIME_MS = 250;
const EVENT_EXPIRY_HOURS = 2;
const MAX_EVENTS_QUEUE_LENGTH = 100;
const REQUEST_TIMEOUT_MS = 1e4;
const SIGNIFICANT_SCROLL_DELTA = 10;
const MIN_SCROLL_DEPTH_CHANGE = 5;
const SCROLL_MIN_EVENT_INTERVAL_MS = 500;
const MAX_SCROLL_EVENTS_PER_SESSION = 120;
const RATE_LIMIT_WINDOW_MS = 1e3;
const MAX_EVENTS_PER_SECOND = 200;
const MAX_PENDING_EVENTS_BUFFER = 100;
const MIN_SESSION_TIMEOUT_MS = 3e4;
const MAX_SESSION_TIMEOUT_MS = 864e5;
const MAX_CUSTOM_EVENT_NAME_LENGTH = 120;
const MAX_CUSTOM_EVENT_STRING_SIZE = 8 * 1024;
const MAX_CUSTOM_EVENT_KEYS = 10;
const MAX_CUSTOM_EVENT_ARRAY_SIZE = 10;
const MAX_NESTED_OBJECT_KEYS = 20;
const MAX_METADATA_NESTING_DEPTH = 1;
const MAX_TEXT_LENGTH = 255;
const MAX_STRING_LENGTH = 1e3;
const MAX_STRING_LENGTH_IN_ARRAY = 500;
const MAX_ARRAY_LENGTH = 100;
const MAX_OBJECT_DEPTH = 3;
const PRECISION_TWO_DECIMALS = 2;
const HTML_DATA_ATTR_PREFIX = "data-tlog";
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
const INITIALIZATION_TIMEOUT_MS = 1e4;
const SCROLL_SUPPRESS_MULTIPLIER = 2;
const VALIDATION_MESSAGES = {
  INVALID_SESSION_TIMEOUT: `Session timeout must be between ${MIN_SESSION_TIMEOUT_MS}ms (30 seconds) and ${MAX_SESSION_TIMEOUT_MS}ms (24 hours)`,
  INVALID_SAMPLING_RATE: "Sampling rate must be between 0 and 1",
  INVALID_ERROR_SAMPLING_RATE: "Error sampling must be between 0 and 1",
  INVALID_TRACELOG_PROJECT_ID: "TraceLog project ID is required when integration is enabled",
  INVALID_CUSTOM_API_URL: "Custom API URL is required when integration is enabled",
  INVALID_GOOGLE_ANALYTICS_ID: "Google Analytics measurement ID is required when integration is enabled",
  INVALID_GLOBAL_METADATA: "Global metadata must be an object",
  INVALID_SENSITIVE_QUERY_PARAMS: "Sensitive query params must be an array of strings",
  INVALID_PRIMARY_SCROLL_SELECTOR: "Primary scroll selector must be a non-empty string",
  INVALID_PRIMARY_SCROLL_SELECTOR_SYNTAX: "Invalid CSS selector syntax for primaryScrollSelector"
};
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<embed\b[^>]*>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi
];
var SpecialApiUrl = /* @__PURE__ */ ((SpecialApiUrl2) => {
  SpecialApiUrl2["Localhost"] = "localhost:8080";
  SpecialApiUrl2["Fail"] = "localhost:9999";
  return SpecialApiUrl2;
})(SpecialApiUrl || {});
var DeviceType = /* @__PURE__ */ ((DeviceType2) => {
  DeviceType2["Mobile"] = "mobile";
  DeviceType2["Tablet"] = "tablet";
  DeviceType2["Desktop"] = "desktop";
  DeviceType2["Unknown"] = "unknown";
  return DeviceType2;
})(DeviceType || {});
var EmitterEvent = /* @__PURE__ */ ((EmitterEvent2) => {
  EmitterEvent2["EVENT"] = "event";
  EmitterEvent2["QUEUE"] = "queue";
  return EmitterEvent2;
})(EmitterEvent || {});
class PermanentError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = "PermanentError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PermanentError);
    }
  }
}
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
  return ErrorType2;
})(ErrorType || {});
function isPrimaryScrollEvent(event2) {
  return event2.type === "scroll" && "scroll_data" in event2 && event2.scroll_data.is_primary === true;
}
function isSecondaryScrollEvent(event2) {
  return event2.type === "scroll" && "scroll_data" in event2 && event2.scroll_data.is_primary === false;
}
var Mode = /* @__PURE__ */ ((Mode2) => {
  Mode2["QA"] = "qa";
  return Mode2;
})(Mode || {});
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
const formatLogMsg = (msg, error) => {
  if (error) {
    return `[TraceLog] ${msg}: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
  return `[TraceLog] ${msg}`;
};
const log = (type, msg, extra) => {
  const { error, data, showToClient = false } = extra ?? {};
  const formattedMsg = error ? formatLogMsg(msg, error) : `[TraceLog] ${msg}`;
  const method = type === "error" ? "error" : type === "warn" ? "warn" : "log";
  if (data !== void 0) {
    console[method](formattedMsg, data);
  } else {
    console[method](formattedMsg);
  }
};
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
    const nav = navigator;
    if (nav.userAgentData && typeof nav.userAgentData.mobile === "boolean") {
      if (nav.userAgentData.platform && /ipad|tablet/i.test(nav.userAgentData.platform)) {
        return DeviceType.Tablet;
      }
      const result = nav.userAgentData.mobile ? DeviceType.Mobile : DeviceType.Desktop;
      return result;
    }
    initMediaQueries();
    const width = window.innerWidth;
    const hasCoarsePointer = coarsePointerQuery?.matches ?? false;
    const hasNoHover = noHoverQuery?.matches ?? false;
    const hasTouchSupport = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const ua = navigator.userAgent.toLowerCase();
    const isMobileUA = /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/.test(ua);
    const isTabletUA = /tablet|ipad|android(?!.*mobile)/.test(ua);
    if (width <= 767 || isMobileUA && hasTouchSupport) {
      return DeviceType.Mobile;
    }
    if (width >= 768 && width <= 1024 || isTabletUA || hasCoarsePointer && hasNoHover && hasTouchSupport) {
      return DeviceType.Tablet;
    }
    return DeviceType.Desktop;
  } catch (error) {
    log("warn", "Device detection failed, defaulting to desktop", { error });
    return DeviceType.Desktop;
  }
};
const STORAGE_BASE_KEY = "tlog";
const QA_MODE_KEY = `${STORAGE_BASE_KEY}:qa_mode`;
const USER_ID_KEY = `${STORAGE_BASE_KEY}:uid`;
const QUEUE_KEY = (id) => id ? `${STORAGE_BASE_KEY}:${id}:queue` : `${STORAGE_BASE_KEY}:queue`;
const SESSION_STORAGE_KEY = (id) => id ? `${STORAGE_BASE_KEY}:${id}:session` : `${STORAGE_BASE_KEY}:session`;
const BROADCAST_CHANNEL_NAME = (id) => id ? `${STORAGE_BASE_KEY}:${id}:broadcast` : `${STORAGE_BASE_KEY}:broadcast`;
const WEB_VITALS_THRESHOLDS = {
  LCP: 4e3,
  FCP: 1800,
  CLS: 0.25,
  INP: 200,
  TTFB: 800,
  LONG_TASK: 50
};
const LONG_TASK_THROTTLE_MS = 1e3;
const PII_PATTERNS = [
  // Email addresses
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
  // US Phone numbers (various formats)
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
  // Credit card numbers (16 digits with optional separators)
  /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  // IBAN (International Bank Account Number)
  /\b[A-Z]{2}\d{2}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/gi,
  // API keys/tokens (sk_test_, sk_live_, pk_test_, pk_live_, etc.)
  /\b[sp]k_(test|live)_[a-zA-Z0-9]{10,}\b/gi,
  // Bearer tokens (JWT-like patterns - matches complete and partial tokens)
  /Bearer\s+[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)?(?:\.[A-Za-z0-9_-]+)?/gi,
  // Passwords in connection strings (protocol://user:password@host)
  /:\/\/[^:/]+:([^@]+)@/gi
];
const MAX_ERROR_MESSAGE_LENGTH = 500;
const ERROR_SUPPRESSION_WINDOW_MS = 5e3;
const MAX_TRACKED_ERRORS = 50;
const MAX_TRACKED_ERRORS_HARD_LIMIT = MAX_TRACKED_ERRORS * 2;
const PERMANENT_ERROR_LOG_THROTTLE_MS = 6e4;
const QA_MODE_PARAM = "tlog_mode";
const QA_MODE_VALUE = "qa";
const detectQaMode = () => {
  const stored = sessionStorage.getItem(QA_MODE_KEY);
  if (stored === "true") {
    return true;
  }
  const params = new URLSearchParams(window.location.search);
  const modeParam = params.get(QA_MODE_PARAM);
  const isQaMode = modeParam === QA_MODE_VALUE;
  if (isQaMode) {
    sessionStorage.setItem(QA_MODE_KEY, "true");
    params.delete(QA_MODE_PARAM);
    const newSearch = params.toString();
    const newUrl = `${window.location.pathname}${newSearch ? "?" + newSearch : ""}${window.location.hash}`;
    try {
      window.history.replaceState({}, "", newUrl);
    } catch (error) {
      log("warn", "History API not available, cannot replace URL", { error });
    }
    console.log(
      "%c[TraceLog] QA Mode ACTIVE",
      "background: #ff9800; color: white; font-weight: bold; padding: 2px 8px; border-radius: 3px;"
    );
  }
  return isQaMode;
};
const getUTMParameters = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const utmParams = {};
  UTM_PARAMS.forEach((param) => {
    const value = urlParams.get(param);
    if (value) {
      const key = param.split("utm_")[1];
      utmParams[key] = value;
    }
  });
  const result = Object.keys(utmParams).length ? utmParams : void 0;
  return result;
};
const generateUUID = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c2) => {
    const r = Math.random() * 16 | 0;
    const v2 = c2 === "x" ? r : r & 3 | 8;
    return v2.toString(16);
  });
};
const generateEventId = () => {
  const timestamp = Date.now();
  let random = "";
  try {
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      const bytes = crypto.getRandomValues(new Uint8Array(4));
      if (bytes) {
        random = Array.from(bytes, (b2) => b2.toString(16).padStart(2, "0")).join("");
      }
    }
  } catch {
  }
  if (!random) {
    random = Math.floor(Math.random() * 4294967295).toString(16).padStart(8, "0");
  }
  return `${timestamp}-${random}`;
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
const getCollectApiUrl = (config) => {
  if (config.integrations?.tracelog?.projectId) {
    const url = new URL(window.location.href);
    const host = url.hostname;
    const parts = host.split(".");
    if (parts.length === 0) {
      throw new Error("Invalid URL");
    }
    const projectId = config.integrations.tracelog.projectId;
    const cleanDomain = parts.slice(-2).join(".");
    const collectApiUrl2 = `https://${projectId}.${cleanDomain}/collect`;
    const isValid = isValidUrl(collectApiUrl2);
    if (!isValid) {
      throw new Error("Invalid URL");
    }
    return collectApiUrl2;
  }
  const collectApiUrl = config.integrations?.custom?.collectApiUrl;
  if (collectApiUrl) {
    const allowHttp = config.integrations?.custom?.allowHttp ?? false;
    const isValid = isValidUrl(collectApiUrl, allowHttp);
    if (!isValid) {
      throw new Error("Invalid URL");
    }
    return collectApiUrl;
  }
  return "";
};
const normalizeUrl = (url, sensitiveQueryParams = []) => {
  try {
    const urlObject = new URL(url);
    const searchParams = urlObject.searchParams;
    let hasChanged = false;
    const removedParams = [];
    sensitiveQueryParams.forEach((param) => {
      if (searchParams.has(param)) {
        searchParams.delete(param);
        hasChanged = true;
        removedParams.push(param);
      }
    });
    if (!hasChanged && url.includes("?")) {
      return url;
    }
    urlObject.search = searchParams.toString();
    const result = urlObject.toString();
    return result;
  } catch (error) {
    log("warn", "URL normalization failed, returning original", { error, data: { url: url.slice(0, 100) } });
    return url;
  }
};
const sanitizeString = (value) => {
  if (!value || typeof value !== "string" || value.trim().length === 0) {
    return "";
  }
  let sanitized = value;
  if (value.length > MAX_STRING_LENGTH) {
    sanitized = value.slice(0, Math.max(0, MAX_STRING_LENGTH));
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
    log("warn", "XSS patterns detected and removed", {
      data: {
        patternMatches: xssPatternMatches,
        originalValue: value.slice(0, 100)
      }
    });
  }
  sanitized = sanitized.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#x27;").replaceAll("/", "&#x2F;");
  const result = sanitized.trim();
  return result;
};
const sanitizeValue = (value, depth = 0) => {
  if (depth > MAX_OBJECT_DEPTH) {
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
      return 0;
    }
    return value;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) {
    const limitedArray = value.slice(0, MAX_ARRAY_LENGTH);
    const sanitizedArray = limitedArray.map((item) => sanitizeValue(item, depth + 1)).filter((item) => item !== null);
    return sanitizedArray;
  }
  if (typeof value === "object") {
    const sanitizedObject = {};
    const entries = Object.entries(value);
    const limitedEntries = entries.slice(0, MAX_NESTED_OBJECT_KEYS);
    for (const [key, value_] of limitedEntries) {
      const sanitizedKey = sanitizeString(key);
      if (sanitizedKey) {
        const sanitizedValue = sanitizeValue(value_, depth + 1);
        if (sanitizedValue !== null) {
          sanitizedObject[sanitizedKey] = sanitizedValue;
        }
      }
    }
    return sanitizedObject;
  }
  return null;
};
const sanitizeMetadata = (metadata) => {
  if (typeof metadata !== "object" || metadata === null) {
    return {};
  }
  try {
    const sanitized = sanitizeValue(metadata);
    const result = typeof sanitized === "object" && sanitized !== null ? sanitized : {};
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`[TraceLog] Metadata sanitization failed: ${errorMessage}`);
  }
};
const validateAppConfig = (config) => {
  if (config !== void 0 && (config === null || typeof config !== "object")) {
    throw new AppConfigValidationError("Configuration must be an object", "config");
  }
  if (!config) {
    return;
  }
  if (config.sessionTimeout !== void 0) {
    if (typeof config.sessionTimeout !== "number" || config.sessionTimeout < MIN_SESSION_TIMEOUT_MS || config.sessionTimeout > MAX_SESSION_TIMEOUT_MS) {
      throw new SessionTimeoutValidationError(VALIDATION_MESSAGES.INVALID_SESSION_TIMEOUT, "config");
    }
  }
  if (config.globalMetadata !== void 0) {
    if (typeof config.globalMetadata !== "object" || config.globalMetadata === null) {
      throw new AppConfigValidationError(VALIDATION_MESSAGES.INVALID_GLOBAL_METADATA, "config");
    }
  }
  if (config.integrations) {
    validateIntegrations(config.integrations);
  }
  if (config.sensitiveQueryParams !== void 0) {
    if (!Array.isArray(config.sensitiveQueryParams)) {
      throw new AppConfigValidationError(VALIDATION_MESSAGES.INVALID_SENSITIVE_QUERY_PARAMS, "config");
    }
    for (const param of config.sensitiveQueryParams) {
      if (typeof param !== "string") {
        throw new AppConfigValidationError("All sensitive query params must be strings", "config");
      }
    }
  }
  if (config.errorSampling !== void 0) {
    if (typeof config.errorSampling !== "number" || config.errorSampling < 0 || config.errorSampling > 1) {
      throw new SamplingRateValidationError(VALIDATION_MESSAGES.INVALID_ERROR_SAMPLING_RATE, "config");
    }
  }
  if (config.samplingRate !== void 0) {
    if (typeof config.samplingRate !== "number" || config.samplingRate < 0 || config.samplingRate > 1) {
      throw new SamplingRateValidationError(VALIDATION_MESSAGES.INVALID_SAMPLING_RATE, "config");
    }
  }
  if (config.primaryScrollSelector !== void 0) {
    if (typeof config.primaryScrollSelector !== "string" || !config.primaryScrollSelector.trim()) {
      throw new AppConfigValidationError(VALIDATION_MESSAGES.INVALID_PRIMARY_SCROLL_SELECTOR, "config");
    }
    if (config.primaryScrollSelector !== "window") {
      try {
        document.querySelector(config.primaryScrollSelector);
      } catch {
        throw new AppConfigValidationError(
          `${VALIDATION_MESSAGES.INVALID_PRIMARY_SCROLL_SELECTOR_SYNTAX}: "${config.primaryScrollSelector}"`,
          "config"
        );
      }
    }
  }
};
const validateIntegrations = (integrations) => {
  if (!integrations) {
    return;
  }
  if (integrations.tracelog) {
    if (!integrations.tracelog.projectId || typeof integrations.tracelog.projectId !== "string" || integrations.tracelog.projectId.trim() === "") {
      throw new IntegrationValidationError(VALIDATION_MESSAGES.INVALID_TRACELOG_PROJECT_ID, "config");
    }
  }
  if (integrations.custom) {
    if (!integrations.custom.collectApiUrl || typeof integrations.custom.collectApiUrl !== "string" || integrations.custom.collectApiUrl.trim() === "") {
      throw new IntegrationValidationError(VALIDATION_MESSAGES.INVALID_CUSTOM_API_URL, "config");
    }
    if (integrations.custom.allowHttp !== void 0 && typeof integrations.custom.allowHttp !== "boolean") {
      throw new IntegrationValidationError("allowHttp must be a boolean", "config");
    }
    const collectApiUrl = integrations.custom.collectApiUrl.trim();
    if (!collectApiUrl.startsWith("http://") && !collectApiUrl.startsWith("https://")) {
      throw new IntegrationValidationError('Custom API URL must start with "http://" or "https://"', "config");
    }
    const allowHttp = integrations.custom.allowHttp ?? false;
    if (!allowHttp && collectApiUrl.startsWith("http://")) {
      throw new IntegrationValidationError(
        "Custom API URL must use HTTPS in production. Set allowHttp: true in integration config to allow HTTP (not recommended)",
        "config"
      );
    }
  }
  if (integrations.googleAnalytics) {
    if (!integrations.googleAnalytics.measurementId || typeof integrations.googleAnalytics.measurementId !== "string" || integrations.googleAnalytics.measurementId.trim() === "") {
      throw new IntegrationValidationError(VALIDATION_MESSAGES.INVALID_GOOGLE_ANALYTICS_ID, "config");
    }
    const measurementId = integrations.googleAnalytics.measurementId.trim();
    if (!measurementId.match(/^(G-|UA-)/)) {
      throw new IntegrationValidationError('Google Analytics measurement ID must start with "G-" or "UA-"', "config");
    }
  }
};
const validateAndNormalizeConfig = (config) => {
  validateAppConfig(config);
  const normalizedConfig = {
    ...config ?? {},
    sessionTimeout: config?.sessionTimeout ?? DEFAULT_SESSION_TIMEOUT,
    globalMetadata: config?.globalMetadata ?? {},
    sensitiveQueryParams: config?.sensitiveQueryParams ?? [],
    errorSampling: config?.errorSampling ?? 1,
    samplingRate: config?.samplingRate ?? 1
  };
  if (normalizedConfig.integrations?.custom) {
    normalizedConfig.integrations.custom = {
      ...normalizedConfig.integrations.custom,
      allowHttp: normalizedConfig.integrations.custom.allowHttp ?? false
    };
  }
  return normalizedConfig;
};
const isValidArrayItem = (item) => {
  if (typeof item === "string") {
    return true;
  }
  if (typeof item === "object" && item !== null && !Array.isArray(item)) {
    const entries = Object.entries(item);
    if (entries.length > MAX_NESTED_OBJECT_KEYS) {
      return false;
    }
    for (const [, value] of entries) {
      if (value === null || value === void 0) {
        continue;
      }
      const type = typeof value;
      if (type !== "string" && type !== "number" && type !== "boolean") {
        return false;
      }
    }
    return true;
  }
  return false;
};
const isOnlyPrimitiveFields = (object, depth = 0) => {
  if (typeof object !== "object" || object === null) {
    return false;
  }
  if (depth > MAX_METADATA_NESTING_DEPTH) {
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
      if (value.length === 0) {
        continue;
      }
      const firstItem = value[0];
      const isStringArray = typeof firstItem === "string";
      if (isStringArray) {
        if (!value.every((item) => typeof item === "string")) {
          return false;
        }
      } else {
        if (!value.every((item) => isValidArrayItem(item))) {
          return false;
        }
      }
      continue;
    }
    if (type === "object" && depth === 0) {
      if (!isOnlyPrimitiveFields(value, depth + 1)) {
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
const validateSingleMetadata = (eventName, metadata, type) => {
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
        if (typeof item === "string" && item.length > MAX_STRING_LENGTH_IN_ARRAY) {
          return {
            valid: false,
            error: `${intro}: array property "${key}" contains strings that are too long (max ${MAX_STRING_LENGTH_IN_ARRAY} characters).`
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
const isValidMetadata = (eventName, metadata, type) => {
  if (Array.isArray(metadata)) {
    const sanitizedArray = [];
    const intro = `${type} "${eventName}" metadata error`;
    for (let i = 0; i < metadata.length; i++) {
      const item = metadata[i];
      if (typeof item !== "object" || item === null || Array.isArray(item)) {
        return {
          valid: false,
          error: `${intro}: array item at index ${i} must be an object.`
        };
      }
      const itemValidation = validateSingleMetadata(eventName, item, type);
      if (!itemValidation.valid) {
        return {
          valid: false,
          error: `${intro}: array item at index ${i} is invalid: ${itemValidation.error}`
        };
      }
      if (itemValidation.sanitizedMetadata) {
        sanitizedArray.push(itemValidation.sanitizedMetadata);
      }
    }
    return {
      valid: true,
      sanitizedMetadata: sanitizedArray
    };
  }
  return validateSingleMetadata(eventName, metadata, type);
};
const isEventValid = (eventName, metadata) => {
  const nameValidation = isValidEventName(eventName);
  if (!nameValidation.valid) {
    log("error", "Event name validation failed", {
      showToClient: true,
      data: { eventName, error: nameValidation.error }
    });
    return nameValidation;
  }
  if (!metadata) {
    return { valid: true };
  }
  const metadataValidation = isValidMetadata(eventName, metadata, "customEvent");
  if (!metadataValidation.valid) {
    log("error", "Event metadata validation failed", {
      showToClient: true,
      data: {
        eventName,
        error: metadataValidation.error
      }
    });
  }
  return metadataValidation;
};
class Emitter {
  listeners = /* @__PURE__ */ new Map();
  on(event2, callback) {
    if (!this.listeners.has(event2)) {
      this.listeners.set(event2, []);
    }
    this.listeners.get(event2).push(callback);
  }
  off(event2, callback) {
    const callbacks = this.listeners.get(event2);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }
  emit(event2, data) {
    const callbacks = this.listeners.get(event2);
    if (callbacks) {
      callbacks.forEach((callback) => {
        callback(data);
      });
    }
  }
  removeAllListeners() {
    this.listeners.clear();
  }
}
const globalState = {};
class StateManager {
  get(key) {
    return globalState[key];
  }
  set(key, value) {
    globalState[key] = value;
  }
  getState() {
    return { ...globalState };
  }
}
class SenderManager extends StateManager {
  storeManager;
  lastPermanentErrorLog = null;
  constructor(storeManager) {
    super();
    this.storeManager = storeManager;
  }
  getQueueStorageKey() {
    const userId = this.get("userId") || "anonymous";
    return QUEUE_KEY(userId);
  }
  sendEventsQueueSync(body) {
    if (this.shouldSkipSend()) {
      return true;
    }
    const config = this.get("config");
    if (config?.integrations?.custom?.collectApiUrl === SpecialApiUrl.Fail) {
      log("warn", "Fail mode: simulating network failure (sync)", {
        data: { events: body.events.length }
      });
      return false;
    }
    return this.sendQueueSyncInternal(body);
  }
  async sendEventsQueue(body, callbacks) {
    try {
      const success = await this.send(body);
      if (success) {
        this.clearPersistedEvents();
        callbacks?.onSuccess?.(body.events.length, body.events, body);
      } else {
        this.persistEvents(body);
        callbacks?.onFailure?.();
      }
      return success;
    } catch (error) {
      if (error instanceof PermanentError) {
        this.logPermanentError("Permanent error, not retrying", error);
        this.clearPersistedEvents();
        callbacks?.onFailure?.();
        return false;
      }
      this.persistEvents(body);
      callbacks?.onFailure?.();
      return false;
    }
  }
  async recoverPersistedEvents(callbacks) {
    try {
      const persistedData = this.getPersistedData();
      if (!persistedData || !this.isDataRecent(persistedData) || persistedData.events.length === 0) {
        this.clearPersistedEvents();
        return;
      }
      const body = this.createRecoveryBody(persistedData);
      const success = await this.send(body);
      if (success) {
        this.clearPersistedEvents();
        callbacks?.onSuccess?.(persistedData.events.length, persistedData.events, body);
      } else {
        callbacks?.onFailure?.();
      }
    } catch (error) {
      if (error instanceof PermanentError) {
        this.logPermanentError("Permanent error during recovery, clearing persisted events", error);
        this.clearPersistedEvents();
        callbacks?.onFailure?.();
        return;
      }
      log("error", "Failed to recover persisted events", { error });
    }
  }
  stop() {
  }
  async send(body) {
    if (this.shouldSkipSend()) {
      return this.simulateSuccessfulSend();
    }
    const config = this.get("config");
    if (config?.integrations?.custom?.collectApiUrl === SpecialApiUrl.Fail) {
      log("warn", "Fail mode: simulating network failure", {
        data: { events: body.events.length }
      });
      return false;
    }
    const { url, payload } = this.prepareRequest(body);
    try {
      const response = await this.sendWithTimeout(url, payload);
      return response.ok;
    } catch (error) {
      if (error instanceof PermanentError) {
        throw error;
      }
      log("error", "Send request failed", {
        error,
        data: {
          events: body.events.length,
          url: url.replace(/\/\/[^/]+/, "//[DOMAIN]")
        }
      });
      return false;
    }
  }
  async sendWithTimeout(url, payload) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        method: "POST",
        body: payload,
        keepalive: true,
        credentials: "include",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        const isPermanentError = response.status >= 400 && response.status < 500;
        if (isPermanentError) {
          throw new PermanentError(`HTTP ${response.status}: ${response.statusText}`, response.status);
        }
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
    if (!this.isSendBeaconAvailable()) {
      log("warn", "sendBeacon not available, persisting events for recovery");
      this.persistEvents(body);
      return false;
    }
    const accepted = navigator.sendBeacon(url, blob);
    if (!accepted) {
      log("warn", "sendBeacon rejected request, persisting events for recovery");
      this.persistEvents(body);
    }
    return accepted;
  }
  prepareRequest(body) {
    const enrichedBody = {
      ...body,
      _metadata: {
        referer: typeof window !== "undefined" ? window.location.href : void 0,
        timestamp: Date.now()
      }
    };
    return {
      url: this.get("collectApiUrl"),
      payload: JSON.stringify(enrichedBody)
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
      log("warn", "Failed to parse persisted data", { error });
      this.clearPersistedEvents();
    }
    return null;
  }
  isDataRecent(data) {
    if (!data.timestamp || typeof data.timestamp !== "number") {
      return false;
    }
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
      log("warn", "Failed to persist events", { error });
      return false;
    }
  }
  clearPersistedEvents() {
    try {
      const key = this.getQueueStorageKey();
      this.storeManager.removeItem(key);
    } catch (error) {
      log("warn", "Failed to clear persisted events", { error });
    }
  }
  shouldSkipSend() {
    return !this.get("collectApiUrl");
  }
  async simulateSuccessfulSend() {
    const delay = Math.random() * 400 + 100;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return true;
  }
  isSendBeaconAvailable() {
    return typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function";
  }
  logPermanentError(context, error) {
    const now = Date.now();
    const shouldLog = !this.lastPermanentErrorLog || this.lastPermanentErrorLog.statusCode !== error.statusCode || now - this.lastPermanentErrorLog.timestamp >= PERMANENT_ERROR_LOG_THROTTLE_MS;
    if (shouldLog) {
      log("error", context, {
        data: { status: error.statusCode, message: error.message }
      });
      this.lastPermanentErrorLog = { statusCode: error.statusCode, timestamp: now };
    }
  }
}
class EventManager extends StateManager {
  googleAnalytics;
  dataSender;
  emitter;
  eventsQueue = [];
  pendingEventsBuffer = [];
  lastEventFingerprint = null;
  lastEventTime = 0;
  sendIntervalId = null;
  rateLimitCounter = 0;
  rateLimitWindowStart = 0;
  constructor(storeManager, googleAnalytics = null, emitter = null) {
    super();
    this.googleAnalytics = googleAnalytics;
    this.dataSender = new SenderManager(storeManager);
    this.emitter = emitter;
  }
  async recoverPersistedEvents() {
    await this.dataSender.recoverPersistedEvents({
      onSuccess: (_eventCount, recoveredEvents, body) => {
        if (recoveredEvents && recoveredEvents.length > 0) {
          const eventIds = recoveredEvents.map((e3) => e3.id);
          this.removeProcessedEvents(eventIds);
          if (body) {
            this.emitEventsQueue(body);
          }
        }
      },
      onFailure: () => {
        log("warn", "Failed to recover persisted events");
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
    error_data,
    session_end_reason
  }) {
    if (!type) {
      log("error", "Event type is required - event will be ignored");
      return;
    }
    if (!this.get("sessionId")) {
      if (this.pendingEventsBuffer.length >= MAX_PENDING_EVENTS_BUFFER) {
        this.pendingEventsBuffer.shift();
        log("warn", "Pending events buffer full - dropping oldest event", {
          data: { maxBufferSize: MAX_PENDING_EVENTS_BUFFER }
        });
      }
      this.pendingEventsBuffer.push({
        type,
        page_url,
        from_page_url,
        scroll_data,
        click_data,
        custom_event,
        web_vitals,
        error_data,
        session_end_reason
      });
      return;
    }
    const isCriticalEvent = type === EventType.SESSION_START || type === EventType.SESSION_END;
    if (!isCriticalEvent && !this.checkRateLimit()) {
      return;
    }
    const eventType = type;
    const isSessionStart = eventType === EventType.SESSION_START;
    const currentPageUrl = page_url || this.get("pageUrl");
    const payload = this.buildEventPayload({
      type: eventType,
      page_url: currentPageUrl,
      from_page_url,
      scroll_data,
      click_data,
      custom_event,
      web_vitals,
      error_data,
      session_end_reason
    });
    if (!isCriticalEvent && !this.shouldSample()) {
      return;
    }
    if (isSessionStart) {
      const currentSessionId = this.get("sessionId");
      if (!currentSessionId) {
        log("error", "Session start event requires sessionId - event will be ignored");
        return;
      }
      if (this.get("hasStartSession")) {
        log("warn", "Duplicate session_start detected", {
          data: { sessionId: currentSessionId }
        });
        return;
      }
      this.set("hasStartSession", true);
    }
    if (this.isDuplicateEvent(payload)) {
      return;
    }
    if (this.get("mode") === Mode.QA && eventType === EventType.CUSTOM && custom_event) {
      console.log("[TraceLog] Event", {
        name: custom_event.name,
        ...custom_event.metadata && { metadata: custom_event.metadata }
      });
      this.emitEvent(payload);
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
    this.pendingEventsBuffer = [];
    this.lastEventFingerprint = null;
    this.lastEventTime = 0;
    this.rateLimitCounter = 0;
    this.rateLimitWindowStart = 0;
    this.dataSender.stop();
  }
  async flushImmediately() {
    return this.flushEvents(false);
  }
  flushImmediatelySync() {
    return this.flushEvents(true);
  }
  getQueueLength() {
    return this.eventsQueue.length;
  }
  flushPendingEvents() {
    if (this.pendingEventsBuffer.length === 0) {
      return;
    }
    const currentSessionId = this.get("sessionId");
    if (!currentSessionId) {
      log("warn", "Cannot flush pending events: session not initialized - keeping in buffer", {
        data: { bufferedEventCount: this.pendingEventsBuffer.length }
      });
      return;
    }
    const bufferedEvents = [...this.pendingEventsBuffer];
    this.pendingEventsBuffer = [];
    bufferedEvents.forEach((event2) => {
      this.track(event2);
    });
  }
  clearSendInterval() {
    if (this.sendIntervalId) {
      clearInterval(this.sendIntervalId);
      this.sendIntervalId = null;
    }
  }
  flushEvents(isSync) {
    if (this.eventsQueue.length === 0) {
      return isSync ? true : Promise.resolve(true);
    }
    const body = this.buildEventsPayload();
    const eventsToSend = [...this.eventsQueue];
    const eventIds = eventsToSend.map((e3) => e3.id);
    if (isSync) {
      const success = this.dataSender.sendEventsQueueSync(body);
      if (success) {
        this.removeProcessedEvents(eventIds);
        this.clearSendInterval();
        this.emitEventsQueue(body);
      }
      return success;
    } else {
      return this.dataSender.sendEventsQueue(body, {
        onSuccess: () => {
          this.removeProcessedEvents(eventIds);
          this.clearSendInterval();
          this.emitEventsQueue(body);
        },
        onFailure: () => {
          log("warn", "Async flush failed", {
            data: { eventCount: eventsToSend.length }
          });
        }
      });
    }
  }
  async sendEventsQueue() {
    if (!this.get("sessionId") || this.eventsQueue.length === 0) {
      return;
    }
    const body = this.buildEventsPayload();
    const eventsToSend = [...this.eventsQueue];
    const eventIds = eventsToSend.map((e3) => e3.id);
    await this.dataSender.sendEventsQueue(body, {
      onSuccess: () => {
        this.removeProcessedEvents(eventIds);
        this.emitEventsQueue(body);
      },
      onFailure: () => {
        log("warn", "Events send failed, keeping in queue", {
          data: { eventCount: eventsToSend.length }
        });
      }
    });
  }
  buildEventsPayload() {
    const eventMap = /* @__PURE__ */ new Map();
    const order = [];
    for (const event2 of this.eventsQueue) {
      const signature = this.createEventSignature(event2);
      if (!eventMap.has(signature)) {
        order.push(signature);
      }
      eventMap.set(signature, event2);
    }
    const events = order.map((signature) => eventMap.get(signature)).filter((event2) => Boolean(event2)).sort((a2, b2) => a2.timestamp - b2.timestamp);
    return {
      user_id: this.get("userId"),
      session_id: this.get("sessionId"),
      device: this.get("device"),
      events,
      ...this.get("config")?.globalMetadata && { global_metadata: this.get("config")?.globalMetadata }
    };
  }
  buildEventPayload(data) {
    const isSessionStart = data.type === EventType.SESSION_START;
    const currentPageUrl = data.page_url ?? this.get("pageUrl");
    const payload = {
      id: generateEventId(),
      type: data.type,
      page_url: currentPageUrl,
      timestamp: Date.now(),
      ...isSessionStart && { referrer: document.referrer || "Direct" },
      ...data.from_page_url && { from_page_url: data.from_page_url },
      ...data.scroll_data && { scroll_data: data.scroll_data },
      ...data.click_data && { click_data: data.click_data },
      ...data.custom_event && { custom_event: data.custom_event },
      ...data.web_vitals && { web_vitals: data.web_vitals },
      ...data.error_data && { error_data: data.error_data },
      ...data.session_end_reason && { session_end_reason: data.session_end_reason },
      ...isSessionStart && getUTMParameters() && { utm: getUTMParameters() }
    };
    return payload;
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
    if (event2.error_data) {
      fingerprint += `_error_${event2.error_data.type}_${event2.error_data.message}`;
    }
    return fingerprint;
  }
  createEventSignature(event2) {
    return this.createEventFingerprint(event2);
  }
  addToQueue(event2) {
    this.eventsQueue.push(event2);
    this.emitEvent(event2);
    if (this.eventsQueue.length > MAX_EVENTS_QUEUE_LENGTH) {
      const nonCriticalIndex = this.eventsQueue.findIndex(
        (e3) => e3.type !== EventType.SESSION_START && e3.type !== EventType.SESSION_END
      );
      const removedEvent = nonCriticalIndex >= 0 ? this.eventsQueue.splice(nonCriticalIndex, 1)[0] : this.eventsQueue.shift();
      log("warn", "Event queue overflow, oldest non-critical event removed", {
        data: {
          maxLength: MAX_EVENTS_QUEUE_LENGTH,
          currentLength: this.eventsQueue.length,
          removedEventType: removedEvent?.type,
          wasCritical: removedEvent?.type === EventType.SESSION_START || removedEvent?.type === EventType.SESSION_END
        }
      });
    }
    if (!this.sendIntervalId) {
      this.startSendInterval();
    }
    this.handleGoogleAnalyticsIntegration(event2);
  }
  startSendInterval() {
    this.sendIntervalId = window.setInterval(() => {
      if (this.eventsQueue.length > 0) {
        void this.sendEventsQueue();
      }
    }, EVENT_SENT_INTERVAL_MS);
  }
  handleGoogleAnalyticsIntegration(event2) {
    if (this.googleAnalytics && event2.type === EventType.CUSTOM && event2.custom_event) {
      if (this.get("mode") === Mode.QA) {
        return;
      }
      this.googleAnalytics.trackEvent(event2.custom_event.name, event2.custom_event.metadata ?? {});
    }
  }
  shouldSample() {
    const samplingRate = this.get("config")?.samplingRate ?? 1;
    return Math.random() < samplingRate;
  }
  checkRateLimit() {
    const now = Date.now();
    if (now - this.rateLimitWindowStart > RATE_LIMIT_WINDOW_MS) {
      this.rateLimitCounter = 0;
      this.rateLimitWindowStart = now;
    }
    if (this.rateLimitCounter >= MAX_EVENTS_PER_SECOND) {
      return false;
    }
    this.rateLimitCounter++;
    return true;
  }
  removeProcessedEvents(eventIds) {
    const eventIdSet = new Set(eventIds);
    this.eventsQueue = this.eventsQueue.filter((event2) => {
      return !eventIdSet.has(event2.id);
    });
  }
  emitEvent(eventData) {
    if (this.emitter) {
      this.emitter.emit(EmitterEvent.EVENT, eventData);
    }
  }
  emitEventsQueue(queue) {
    if (this.emitter) {
      this.emitter.emit(EmitterEvent.QUEUE, queue);
    }
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
  static getId(storageManager) {
    const storageKey = USER_ID_KEY;
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
  projectId;
  sessionTimeoutId = null;
  broadcastChannel = null;
  activityHandler = null;
  visibilityChangeHandler = null;
  beforeUnloadHandler = null;
  isTracking = false;
  constructor(storageManager, eventManager, projectId) {
    super();
    this.storageManager = storageManager;
    this.eventManager = eventManager;
    this.projectId = projectId;
  }
  initCrossTabSync() {
    if (typeof BroadcastChannel === "undefined") {
      log("warn", "BroadcastChannel not supported");
      return;
    }
    const projectId = this.getProjectId();
    this.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME(projectId));
    this.broadcastChannel.onmessage = (event2) => {
      const { action, sessionId, timestamp, projectId: messageProjectId } = event2.data ?? {};
      if (messageProjectId !== projectId) {
        return;
      }
      if (action === "session_end") {
        this.resetSessionState();
        return;
      }
      if (sessionId && typeof timestamp === "number" && timestamp > Date.now() - 5e3) {
        this.set("sessionId", sessionId);
        this.set("hasStartSession", true);
        this.persistSession(sessionId, timestamp);
        if (this.isTracking) {
          this.setupSessionTimeout();
        }
      }
    };
  }
  shareSession(sessionId) {
    if (this.broadcastChannel && typeof this.broadcastChannel.postMessage === "function") {
      this.broadcastChannel.postMessage({
        action: "session_start",
        projectId: this.getProjectId(),
        sessionId,
        timestamp: Date.now()
      });
    }
  }
  broadcastSessionEnd(sessionId, reason) {
    if (!sessionId) {
      return;
    }
    if (this.broadcastChannel && typeof this.broadcastChannel.postMessage === "function") {
      try {
        this.broadcastChannel.postMessage({
          action: "session_end",
          projectId: this.getProjectId(),
          sessionId,
          reason,
          timestamp: Date.now()
        });
      } catch (error) {
        log("warn", "Failed to broadcast session end", { error, data: { sessionId, reason } });
      }
    }
  }
  cleanupCrossTabSync() {
    if (this.broadcastChannel) {
      if (typeof this.broadcastChannel.close === "function") {
        this.broadcastChannel.close();
      }
      this.broadcastChannel = null;
    }
  }
  recoverSession() {
    const storedSession = this.loadStoredSession();
    if (!storedSession) {
      return null;
    }
    const sessionTimeout = this.get("config")?.sessionTimeout ?? DEFAULT_SESSION_TIMEOUT;
    if (Date.now() - storedSession.lastActivity > sessionTimeout) {
      this.clearStoredSession();
      return null;
    }
    return storedSession.id;
  }
  persistSession(sessionId, lastActivity = Date.now()) {
    this.saveStoredSession({
      id: sessionId,
      lastActivity
    });
  }
  clearStoredSession() {
    const storageKey = this.getSessionStorageKey();
    this.storageManager.removeItem(storageKey);
  }
  loadStoredSession() {
    const storageKey = this.getSessionStorageKey();
    const storedData = this.storageManager.getItem(storageKey);
    if (!storedData) {
      return null;
    }
    try {
      const parsed = JSON.parse(storedData);
      if (!parsed.id || typeof parsed.lastActivity !== "number") {
        return null;
      }
      return parsed;
    } catch {
      this.storageManager.removeItem(storageKey);
      return null;
    }
  }
  saveStoredSession(session) {
    const storageKey = this.getSessionStorageKey();
    this.storageManager.setItem(storageKey, JSON.stringify(session));
  }
  getSessionStorageKey() {
    return SESSION_STORAGE_KEY(this.getProjectId());
  }
  getProjectId() {
    return this.projectId;
  }
  startTracking() {
    if (this.isTracking) {
      log("warn", "Session tracking already active");
      return;
    }
    const recoveredSessionId = this.recoverSession();
    const sessionId = recoveredSessionId ?? this.generateSessionId();
    const isRecovered = Boolean(recoveredSessionId);
    this.isTracking = true;
    try {
      this.set("sessionId", sessionId);
      this.persistSession(sessionId);
      if (!isRecovered) {
        this.eventManager.track({
          type: EventType.SESSION_START
        });
      }
      this.initCrossTabSync();
      this.shareSession(sessionId);
      this.setupSessionTimeout();
      this.setupActivityListeners();
      this.setupLifecycleListeners();
    } catch (error) {
      this.isTracking = false;
      this.clearSessionTimeout();
      this.cleanupActivityListeners();
      this.cleanupLifecycleListeners();
      this.cleanupCrossTabSync();
      this.set("sessionId", null);
      throw error;
    }
  }
  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
  setupSessionTimeout() {
    this.clearSessionTimeout();
    const sessionTimeout = this.get("config")?.sessionTimeout ?? DEFAULT_SESSION_TIMEOUT;
    this.sessionTimeoutId = setTimeout(() => {
      this.endSession("inactivity");
    }, sessionTimeout);
  }
  resetSessionTimeout() {
    this.setupSessionTimeout();
    const sessionId = this.get("sessionId");
    if (sessionId) {
      this.persistSession(sessionId);
    }
  }
  clearSessionTimeout() {
    if (this.sessionTimeoutId) {
      clearTimeout(this.sessionTimeoutId);
      this.sessionTimeoutId = null;
    }
  }
  setupActivityListeners() {
    this.activityHandler = () => {
      this.resetSessionTimeout();
    };
    document.addEventListener("click", this.activityHandler, { passive: true });
    document.addEventListener("keydown", this.activityHandler, { passive: true });
    document.addEventListener("scroll", this.activityHandler, { passive: true });
  }
  cleanupActivityListeners() {
    if (this.activityHandler) {
      document.removeEventListener("click", this.activityHandler);
      document.removeEventListener("keydown", this.activityHandler);
      document.removeEventListener("scroll", this.activityHandler);
      this.activityHandler = null;
    }
  }
  setupLifecycleListeners() {
    if (this.visibilityChangeHandler || this.beforeUnloadHandler) {
      return;
    }
    this.visibilityChangeHandler = () => {
      if (document.hidden) {
        this.clearSessionTimeout();
      } else {
        const sessionId = this.get("sessionId");
        if (sessionId) {
          this.setupSessionTimeout();
        }
      }
    };
    this.beforeUnloadHandler = () => {
      this.endSession("page_unload");
    };
    document.addEventListener("visibilitychange", this.visibilityChangeHandler);
    window.addEventListener("beforeunload", this.beforeUnloadHandler);
  }
  cleanupLifecycleListeners() {
    if (this.visibilityChangeHandler) {
      document.removeEventListener("visibilitychange", this.visibilityChangeHandler);
      this.visibilityChangeHandler = null;
    }
    if (this.beforeUnloadHandler) {
      window.removeEventListener("beforeunload", this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
    }
  }
  endSession(reason) {
    const sessionId = this.get("sessionId");
    if (!sessionId) {
      log("warn", "endSession called without active session", { data: { reason } });
      this.resetSessionState(reason);
      return;
    }
    this.eventManager.track({
      type: EventType.SESSION_END,
      session_end_reason: reason
    });
    const flushResult = this.eventManager.flushImmediatelySync();
    if (!flushResult) {
      log("warn", "Sync flush failed during session end, events persisted for recovery", {
        data: { reason, sessionId }
      });
    }
    this.broadcastSessionEnd(sessionId, reason);
    this.resetSessionState(reason);
  }
  resetSessionState(reason) {
    this.clearSessionTimeout();
    this.cleanupActivityListeners();
    this.cleanupLifecycleListeners();
    this.cleanupCrossTabSync();
    if (reason !== "page_unload") {
      this.clearStoredSession();
    }
    this.set("sessionId", null);
    this.set("hasStartSession", false);
    this.isTracking = false;
  }
  stopTracking() {
    this.endSession("manual_stop");
  }
  destroy() {
    this.clearSessionTimeout();
    this.cleanupActivityListeners();
    this.cleanupCrossTabSync();
    this.cleanupLifecycleListeners();
    this.isTracking = false;
    this.set("hasStartSession", false);
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
  startTracking() {
    if (this.isActive()) {
      return;
    }
    if (this.destroyed) {
      log("warn", "Cannot start tracking on destroyed handler");
      return;
    }
    const config = this.get("config");
    const projectId = config?.integrations?.tracelog?.projectId ?? config?.integrations?.custom?.collectApiUrl ?? "default";
    if (!projectId) {
      throw new Error("Cannot start session tracking: config not available");
    }
    try {
      this.sessionManager = new SessionManager(this.storageManager, this.eventManager, projectId);
      this.sessionManager.startTracking();
      this.eventManager.flushPendingEvents();
    } catch (error) {
      if (this.sessionManager) {
        try {
          this.sessionManager.destroy();
        } catch {
        }
        this.sessionManager = null;
      }
      log("error", "Failed to start session tracking", { error });
      throw error;
    }
  }
  isActive() {
    return this.sessionManager !== null && !this.destroyed;
  }
  cleanupSessionManager() {
    if (this.sessionManager) {
      this.sessionManager.stopTracking();
      this.sessionManager.destroy();
      this.sessionManager = null;
    }
  }
  stopTracking() {
    this.cleanupSessionManager();
  }
  destroy() {
    if (this.destroyed) {
      return;
    }
    if (this.sessionManager) {
      this.sessionManager.destroy();
      this.sessionManager = null;
    }
    this.destroyed = true;
    this.set("hasStartSession", false);
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
    this.trackInitialPageView();
    window.addEventListener("popstate", this.trackCurrentPage, true);
    window.addEventListener("hashchange", this.trackCurrentPage, true);
    this.patchHistory("pushState");
    this.patchHistory("replaceState");
  }
  stopTracking() {
    window.removeEventListener("popstate", this.trackCurrentPage, true);
    window.removeEventListener("hashchange", this.trackCurrentPage, true);
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
  trackCurrentPage = () => {
    const rawUrl = window.location.href;
    const normalizedUrl = normalizeUrl(rawUrl, this.get("config").sensitiveQueryParams);
    if (this.get("pageUrl") === normalizedUrl) {
      return;
    }
    this.onTrack();
    const fromUrl = this.get("pageUrl");
    this.set("pageUrl", normalizedUrl);
    const pageViewData = this.extractPageViewData();
    this.eventManager.track({
      type: EventType.PAGE_VIEW,
      page_url: this.get("pageUrl"),
      from_page_url: fromUrl,
      ...pageViewData && { page_view: pageViewData }
    });
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
      return;
    }
    this.clickHandler = (event2) => {
      const mouseEvent = event2;
      const target = mouseEvent.target;
      const clickedElement = typeof HTMLElement !== "undefined" && target instanceof HTMLElement ? target : typeof HTMLElement !== "undefined" && target instanceof Node && target.parentElement instanceof HTMLElement ? target.parentElement : null;
      if (!clickedElement) {
        log("warn", "Click target not found or not an element");
        return;
      }
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
        log("warn", "Invalid selector in element search", { error, data: { selector } });
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
  limitWarningLogged = false;
  minDepthChange = MIN_SCROLL_DEPTH_CHANGE;
  minIntervalMs = SCROLL_MIN_EVENT_INTERVAL_MS;
  maxEventsPerSession = MAX_SCROLL_EVENTS_PER_SESSION;
  windowScrollableCache = null;
  constructor(eventManager) {
    super();
    this.eventManager = eventManager;
  }
  startTracking() {
    this.limitWarningLogged = false;
    this.applyConfigOverrides();
    this.set("scrollEventCount", 0);
    this.tryDetectScrollContainers(0);
  }
  stopTracking() {
    for (const container of this.containers) {
      this.clearContainerTimer(container);
      if (container.element instanceof Window) {
        window.removeEventListener("scroll", container.listener);
      } else {
        container.element.removeEventListener("scroll", container.listener);
      }
    }
    this.containers.length = 0;
    this.set("scrollEventCount", 0);
    this.limitWarningLogged = false;
    this.windowScrollableCache = null;
  }
  tryDetectScrollContainers(attempt) {
    const elements = this.findScrollableElements();
    if (elements.length > 0) {
      for (const element of elements) {
        const selector = this.getElementSelector(element);
        this.setupScrollContainer(element, selector);
      }
      this.applyPrimaryScrollSelectorIfConfigured();
      return;
    }
    if (attempt < 5) {
      setTimeout(() => {
        this.tryDetectScrollContainers(attempt + 1);
      }, 200);
      return;
    }
    if (this.containers.length === 0) {
      this.setupScrollContainer(window, "window");
    }
    this.applyPrimaryScrollSelectorIfConfigured();
  }
  applyPrimaryScrollSelectorIfConfigured() {
    const config = this.get("config");
    if (config.primaryScrollSelector) {
      this.applyPrimaryScrollSelector(config.primaryScrollSelector);
    }
  }
  findScrollableElements() {
    if (!document.body) {
      return [];
    }
    const elements = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, {
      acceptNode: (node2) => {
        const element = node2;
        if (!element.isConnected || !element.offsetParent) {
          return NodeFilter.FILTER_SKIP;
        }
        const style = getComputedStyle(element);
        const hasScrollableStyle = style.overflowY === "auto" || style.overflowY === "scroll" || style.overflow === "auto" || style.overflow === "scroll";
        return hasScrollableStyle ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      }
    });
    let node;
    while ((node = walker.nextNode()) && elements.length < 10) {
      const element = node;
      if (this.isElementScrollable(element)) {
        elements.push(element);
      }
    }
    return elements;
  }
  getElementSelector(element) {
    if (element === window) {
      return "window";
    }
    const htmlElement = element;
    if (htmlElement.id) {
      return `#${htmlElement.id}`;
    }
    if (htmlElement.className && typeof htmlElement.className === "string") {
      const firstClass = htmlElement.className.split(" ").filter((c2) => c2.trim())[0];
      if (firstClass) {
        return `.${firstClass}`;
      }
    }
    return htmlElement.tagName.toLowerCase();
  }
  determineIfPrimary(element) {
    if (this.isWindowScrollable()) {
      return element === window;
    }
    return this.containers.length === 0;
  }
  setupScrollContainer(element, selector) {
    const alreadyTracking = this.containers.some((c2) => c2.element === element);
    if (alreadyTracking) {
      return;
    }
    if (element !== window && !this.isElementScrollable(element)) {
      return;
    }
    const handleScroll = () => {
      if (this.get("suppressNextScroll")) {
        return;
      }
      this.clearContainerTimer(container);
      container.debounceTimer = window.setTimeout(() => {
        const scrollData = this.calculateScrollData(container);
        if (scrollData) {
          const now = Date.now();
          this.processScrollEvent(container, scrollData, now);
        }
        container.debounceTimer = null;
      }, SCROLL_DEBOUNCE_TIME_MS);
    };
    const initialScrollTop = this.getScrollTop(element);
    const initialDepth = this.calculateScrollDepth(
      initialScrollTop,
      this.getScrollHeight(element),
      this.getViewportHeight(element)
    );
    const isPrimary = this.determineIfPrimary(element);
    const container = {
      element,
      selector,
      isPrimary,
      lastScrollPos: initialScrollTop,
      lastDepth: initialDepth,
      lastDirection: ScrollDirection.DOWN,
      lastEventTime: 0,
      maxDepthReached: initialDepth,
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
  processScrollEvent(container, scrollData, timestamp) {
    if (!this.shouldEmitScrollEvent(container, scrollData, timestamp)) {
      return;
    }
    container.lastEventTime = timestamp;
    container.lastDepth = scrollData.depth;
    container.lastDirection = scrollData.direction;
    const currentCount = this.get("scrollEventCount") ?? 0;
    this.set("scrollEventCount", currentCount + 1);
    this.eventManager.track({
      type: EventType.SCROLL,
      scroll_data: {
        ...scrollData,
        container_selector: container.selector,
        is_primary: container.isPrimary
      }
    });
  }
  shouldEmitScrollEvent(container, scrollData, timestamp) {
    if (this.hasReachedSessionLimit()) {
      this.logLimitOnce();
      return false;
    }
    if (!this.hasElapsedMinimumInterval(container, timestamp)) {
      return false;
    }
    if (!this.hasSignificantDepthChange(container, scrollData.depth)) {
      return false;
    }
    return true;
  }
  hasReachedSessionLimit() {
    const currentCount = this.get("scrollEventCount") ?? 0;
    return currentCount >= this.maxEventsPerSession;
  }
  hasElapsedMinimumInterval(container, timestamp) {
    if (container.lastEventTime === 0) {
      return true;
    }
    return timestamp - container.lastEventTime >= this.minIntervalMs;
  }
  hasSignificantDepthChange(container, newDepth) {
    return Math.abs(newDepth - container.lastDepth) >= this.minDepthChange;
  }
  logLimitOnce() {
    if (this.limitWarningLogged) {
      return;
    }
    this.limitWarningLogged = true;
    log("warn", "Max scroll events per session reached", {
      data: { limit: this.maxEventsPerSession }
    });
  }
  applyConfigOverrides() {
    this.minDepthChange = MIN_SCROLL_DEPTH_CHANGE;
    this.minIntervalMs = SCROLL_MIN_EVENT_INTERVAL_MS;
    this.maxEventsPerSession = MAX_SCROLL_EVENTS_PER_SESSION;
  }
  isWindowScrollable() {
    if (this.windowScrollableCache !== null) {
      return this.windowScrollableCache;
    }
    this.windowScrollableCache = document.documentElement.scrollHeight > window.innerHeight;
    return this.windowScrollableCache;
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
    const { element, lastScrollPos, lastEventTime } = container;
    const scrollTop = this.getScrollTop(element);
    const now = Date.now();
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
    const timeDelta = lastEventTime > 0 ? now - lastEventTime : 0;
    const velocity = timeDelta > 0 ? Math.round(positionDelta / timeDelta * 1e3) : 0;
    if (depth > container.maxDepthReached) {
      container.maxDepthReached = depth;
    }
    container.lastScrollPos = scrollTop;
    return {
      depth,
      direction,
      velocity,
      max_depth_reached: container.maxDepthReached
    };
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
  applyPrimaryScrollSelector(selector) {
    let targetElement;
    if (selector === "window") {
      targetElement = window;
    } else {
      const element = document.querySelector(selector);
      if (!(element instanceof HTMLElement)) {
        log("warn", `Selector "${selector}" did not match an HTMLElement`);
        return;
      }
      targetElement = element;
    }
    this.containers.forEach((container) => {
      this.updateContainerPrimary(container, container.element === targetElement);
    });
    const targetAlreadyTracked = this.containers.some((c2) => c2.element === targetElement);
    if (!targetAlreadyTracked && targetElement instanceof HTMLElement) {
      if (this.isElementScrollable(targetElement)) {
        const elementSelector = this.getElementSelector(targetElement);
        this.setupScrollContainer(targetElement, elementSelector);
      }
    }
  }
  updateContainerPrimary(container, isPrimary) {
    container.isPrimary = isPrimary;
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
      log("error", "Google Analytics initialization failed", { error });
    }
  }
  trackEvent(eventName, metadata) {
    if (!eventName?.trim() || !this.isInitialized || typeof window.gtag !== "function") {
      return;
    }
    try {
      const normalizedMetadata = Array.isArray(metadata) ? { items: metadata } : metadata;
      window.gtag("event", eventName, normalizedMetadata);
    } catch (error) {
      log("error", "Google Analytics event tracking failed", { error });
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
      script.onload = () => {
        resolve();
      };
      script.onerror = () => {
        reject(new Error("Failed to load Google Analytics script"));
      };
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
  sessionStorageRef;
  fallbackStorage = /* @__PURE__ */ new Map();
  fallbackSessionStorage = /* @__PURE__ */ new Map();
  hasQuotaExceededError = false;
  constructor() {
    this.storage = this.initializeStorage("localStorage");
    this.sessionStorageRef = this.initializeStorage("sessionStorage");
    if (!this.storage) {
      log("warn", "localStorage not available, using memory fallback");
    }
    if (!this.sessionStorageRef) {
      log("warn", "sessionStorage not available, using memory fallback");
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
    } catch {
      return this.fallbackStorage.get(key) ?? null;
    }
  }
  /**
   * Stores an item in storage
   */
  setItem(key, value) {
    this.fallbackStorage.set(key, value);
    try {
      if (this.storage) {
        this.storage.setItem(key, value);
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "QuotaExceededError") {
        this.hasQuotaExceededError = true;
        log("warn", "localStorage quota exceeded, attempting cleanup", {
          data: { key, valueSize: value.length }
        });
        const cleanedUp = this.cleanupOldData();
        if (cleanedUp) {
          try {
            if (this.storage) {
              this.storage.setItem(key, value);
              return;
            }
          } catch (retryError) {
            log("error", "localStorage quota exceeded even after cleanup - data will not persist", {
              error: retryError,
              data: { key, valueSize: value.length }
            });
          }
        } else {
          log("error", "localStorage quota exceeded and no data to cleanup - data will not persist", {
            error,
            data: { key, valueSize: value.length }
          });
        }
      }
    }
  }
  /**
   * Removes an item from storage
   */
  removeItem(key) {
    try {
      if (this.storage) {
        this.storage.removeItem(key);
      }
    } catch {
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
      keysToRemove.forEach((key) => {
        this.storage.removeItem(key);
      });
      this.fallbackStorage.clear();
    } catch (error) {
      log("error", "Failed to clear storage", { error });
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
   * Checks if a QuotaExceededError has occurred
   * This indicates localStorage is full and data may not persist
   */
  hasQuotaError() {
    return this.hasQuotaExceededError;
  }
  /**
   * Attempts to cleanup old TraceLog data from storage to free up space
   * Returns true if any data was removed, false otherwise
   */
  cleanupOldData() {
    if (!this.storage) {
      return false;
    }
    try {
      const tracelogKeys = [];
      const persistedEventsKeys = [];
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key?.startsWith("tracelog_")) {
          tracelogKeys.push(key);
          if (key.startsWith("tracelog_persisted_events_")) {
            persistedEventsKeys.push(key);
          }
        }
      }
      if (persistedEventsKeys.length > 0) {
        persistedEventsKeys.forEach((key) => {
          try {
            this.storage.removeItem(key);
          } catch {
          }
        });
        return true;
      }
      const criticalPrefixes = ["tracelog_session_", "tracelog_user_id", "tracelog_device_id", "tracelog_config"];
      const nonCriticalKeys = tracelogKeys.filter((key) => {
        return !criticalPrefixes.some((prefix) => key.startsWith(prefix));
      });
      if (nonCriticalKeys.length > 0) {
        const keysToRemove = nonCriticalKeys.slice(0, 5);
        keysToRemove.forEach((key) => {
          try {
            this.storage.removeItem(key);
          } catch {
          }
        });
        return true;
      }
      return false;
    } catch (error) {
      log("error", "Failed to cleanup old data", { error });
      return false;
    }
  }
  /**
   * Initialize storage (localStorage or sessionStorage) with feature detection
   */
  initializeStorage(type) {
    if (typeof window === "undefined") {
      return null;
    }
    try {
      const storage = type === "localStorage" ? window.localStorage : window.sessionStorage;
      const testKey = "__tracelog_test__";
      storage.setItem(testKey, "test");
      storage.removeItem(testKey);
      return storage;
    } catch {
      return null;
    }
  }
  /**
   * Retrieves an item from sessionStorage
   */
  getSessionItem(key) {
    try {
      if (this.sessionStorageRef) {
        return this.sessionStorageRef.getItem(key);
      }
      return this.fallbackSessionStorage.get(key) ?? null;
    } catch {
      return this.fallbackSessionStorage.get(key) ?? null;
    }
  }
  /**
   * Stores an item in sessionStorage
   */
  setSessionItem(key, value) {
    this.fallbackSessionStorage.set(key, value);
    try {
      if (this.sessionStorageRef) {
        this.sessionStorageRef.setItem(key, value);
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "QuotaExceededError") {
        log("error", "sessionStorage quota exceeded - data will not persist", {
          error,
          data: { key, valueSize: value.length }
        });
      }
    }
  }
  /**
   * Removes an item from sessionStorage
   */
  removeSessionItem(key) {
    try {
      if (this.sessionStorageRef) {
        this.sessionStorageRef.removeItem(key);
      }
    } catch {
    }
    this.fallbackSessionStorage.delete(key);
  }
}
class PerformanceHandler extends StateManager {
  eventManager;
  reportedByNav = /* @__PURE__ */ new Map();
  observers = [];
  lastLongTaskSentAt = 0;
  vitalThresholds = WEB_VITALS_THRESHOLDS;
  constructor(eventManager) {
    super();
    this.eventManager = eventManager;
  }
  async startTracking() {
    await this.initWebVitals();
    this.observeLongTasks();
  }
  stopTracking() {
    this.observers.forEach((obs, index) => {
      try {
        obs.disconnect();
      } catch (error) {
        log("warn", "Failed to disconnect performance observer", { error, data: { observerIndex: index } });
      }
    });
    this.observers.length = 0;
    this.reportedByNav.clear();
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
    } catch (error) {
      log("warn", "Failed to load web-vitals library, using fallback", { error });
      this.observeWebVitalsFallback();
    }
  }
  reportTTFB() {
    try {
      const nav = performance.getEntriesByType("navigation")[0];
      if (!nav) {
        return;
      }
      const ttfb = nav.responseStart;
      if (typeof ttfb === "number" && Number.isFinite(ttfb)) {
        this.sendVital({ type: "TTFB", value: Number(ttfb.toFixed(PRECISION_TWO_DECIMALS)) });
      }
    } catch (error) {
      log("warn", "Failed to report TTFB", { error });
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
            if (this.shouldSendVital("LONG_TASK", duration)) {
              this.trackWebVital("LONG_TASK", duration);
            }
            this.lastLongTaskSentAt = now;
          }
        }
      },
      { type: "longtask", buffered: true }
    );
  }
  sendVital(sample) {
    if (!this.shouldSendVital(sample.type, sample.value)) {
      return;
    }
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
    if (!Number.isFinite(value)) {
      log("warn", "Invalid web vital value", { data: { type, value } });
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
      log("warn", "Failed to get navigation ID", { error });
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
        return false;
      }
      const obs = new PerformanceObserver((list, observer) => {
        try {
          cb(list, observer);
        } catch (callbackError) {
          log("warn", "Observer callback failed", {
            error: callbackError,
            data: { type }
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
      log("warn", "Failed to create performance observer", {
        error,
        data: { type }
      });
      return false;
    }
  }
  shouldSendVital(type, value) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      log("warn", "Invalid web vital value", { data: { type, value } });
      return false;
    }
    const threshold = this.vitalThresholds[type];
    if (typeof threshold === "number" && value <= threshold) {
      return false;
    }
    return true;
  }
}
class ErrorHandler extends StateManager {
  eventManager;
  recentErrors = /* @__PURE__ */ new Map();
  constructor(eventManager) {
    super();
    this.eventManager = eventManager;
  }
  startTracking() {
    window.addEventListener("error", this.handleError);
    window.addEventListener("unhandledrejection", this.handleRejection);
  }
  stopTracking() {
    window.removeEventListener("error", this.handleError);
    window.removeEventListener("unhandledrejection", this.handleRejection);
    this.recentErrors.clear();
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
    const sanitizedMessage = this.sanitize(event2.message || "Unknown error");
    if (this.shouldSuppressError(ErrorType.JS_ERROR, sanitizedMessage)) {
      return;
    }
    this.eventManager.track({
      type: EventType.ERROR,
      error_data: {
        type: ErrorType.JS_ERROR,
        message: sanitizedMessage,
        ...event2.filename && { filename: event2.filename },
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
    const sanitizedMessage = this.sanitize(message);
    if (this.shouldSuppressError(ErrorType.PROMISE_REJECTION, sanitizedMessage)) {
      return;
    }
    this.eventManager.track({
      type: EventType.ERROR,
      error_data: {
        type: ErrorType.PROMISE_REJECTION,
        message: sanitizedMessage
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
    let sanitized = text.length > MAX_ERROR_MESSAGE_LENGTH ? text.slice(0, MAX_ERROR_MESSAGE_LENGTH) + "..." : text;
    for (const pattern of PII_PATTERNS) {
      const regex = new RegExp(pattern.source, pattern.flags);
      sanitized = sanitized.replace(regex, "[REDACTED]");
    }
    return sanitized;
  }
  shouldSuppressError(type, message) {
    const now = Date.now();
    const key = `${type}:${message}`;
    const lastSeenAt = this.recentErrors.get(key);
    if (lastSeenAt && now - lastSeenAt < ERROR_SUPPRESSION_WINDOW_MS) {
      this.recentErrors.set(key, now);
      return true;
    }
    this.recentErrors.set(key, now);
    if (this.recentErrors.size > MAX_TRACKED_ERRORS_HARD_LIMIT) {
      this.recentErrors.clear();
      this.recentErrors.set(key, now);
      return false;
    }
    if (this.recentErrors.size > MAX_TRACKED_ERRORS) {
      this.pruneOldErrors();
    }
    return false;
  }
  pruneOldErrors() {
    const now = Date.now();
    for (const [key, timestamp] of this.recentErrors.entries()) {
      if (now - timestamp > ERROR_SUPPRESSION_WINDOW_MS) {
        this.recentErrors.delete(key);
      }
    }
    if (this.recentErrors.size <= MAX_TRACKED_ERRORS) {
      return;
    }
    const entries = Array.from(this.recentErrors.entries()).sort((a2, b2) => a2[1] - b2[1]);
    const excess = this.recentErrors.size - MAX_TRACKED_ERRORS;
    for (let index = 0; index < excess; index += 1) {
      const entry = entries[index];
      if (entry) {
        this.recentErrors.delete(entry[0]);
      }
    }
  }
}
class App extends StateManager {
  isInitialized = false;
  suppressNextScrollTimer = null;
  emitter = new Emitter();
  managers = {};
  handlers = {};
  integrations = {};
  get initialized() {
    return this.isInitialized;
  }
  async init(config = {}) {
    if (this.isInitialized) {
      return;
    }
    this.managers.storage = new StorageManager();
    try {
      this.setupState(config);
      await this.setupIntegrations();
      this.managers.event = new EventManager(this.managers.storage, this.integrations.googleAnalytics, this.emitter);
      this.initializeHandlers();
      await this.managers.event.recoverPersistedEvents().catch((error) => {
        log("warn", "Failed to recover persisted events", { error });
      });
      this.isInitialized = true;
    } catch (error) {
      this.destroy(true);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`[TraceLog] TraceLog initialization failed: ${errorMessage}`);
    }
  }
  sendCustomEvent(name, metadata) {
    if (!this.managers.event) {
      return;
    }
    const { valid, error, sanitizedMetadata } = isEventValid(name, metadata);
    if (!valid) {
      if (this.get("mode") === Mode.QA) {
        throw new Error(`[TraceLog] Custom event "${name}" validation failed: ${error}`);
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
  on(event2, callback) {
    this.emitter.on(event2, callback);
  }
  off(event2, callback) {
    this.emitter.off(event2, callback);
  }
  destroy(force = false) {
    if (!this.isInitialized && !force) {
      return;
    }
    this.integrations.googleAnalytics?.cleanup();
    Object.values(this.handlers).filter(Boolean).forEach((handler) => {
      try {
        handler.stopTracking();
      } catch (error) {
        log("warn", "Failed to stop tracking", { error });
      }
    });
    if (this.suppressNextScrollTimer) {
      clearTimeout(this.suppressNextScrollTimer);
      this.suppressNextScrollTimer = null;
    }
    this.managers.event?.flushImmediatelySync();
    this.managers.event?.stop();
    this.emitter.removeAllListeners();
    this.set("hasStartSession", false);
    this.set("suppressNextScroll", false);
    this.set("sessionId", null);
    this.isInitialized = false;
    this.handlers = {};
  }
  setupState(config = {}) {
    this.set("config", config);
    const userId = UserManager.getId(this.managers.storage);
    this.set("userId", userId);
    const collectApiUrl = getCollectApiUrl(config);
    this.set("collectApiUrl", collectApiUrl);
    const device = getDeviceType();
    this.set("device", device);
    const pageUrl = normalizeUrl(window.location.href, config.sensitiveQueryParams);
    this.set("pageUrl", pageUrl);
    const mode = detectQaMode() ? Mode.QA : void 0;
    if (mode) {
      this.set("mode", mode);
    }
  }
  async setupIntegrations() {
    const config = this.get("config");
    const measurementId = config.integrations?.googleAnalytics?.measurementId;
    if (measurementId?.trim()) {
      try {
        this.integrations.googleAnalytics = new GoogleAnalyticsIntegration();
        await this.integrations.googleAnalytics.initialize();
      } catch {
        this.integrations.googleAnalytics = void 0;
      }
    }
  }
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
    this.handlers.performance.startTracking().catch((error) => {
      log("warn", "Failed to start performance tracking", { error });
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
  async init(config) {
    if (!__setAppInstance) {
      throw new Error("[TraceLog] __setAppInstance is not available (production build?)");
    }
    try {
      __setAppInstance(this);
    } catch {
      throw new Error("[TraceLog] TestBridge cannot sync with existing tracelog instance. Call destroy() first.");
    }
    try {
      await super.init(config);
    } catch (error) {
      if (__setAppInstance) {
        __setAppInstance(null);
      }
      throw error;
    }
  }
  isInitializing() {
    return this._isInitializing;
  }
  sendCustomEvent(name, data) {
    if (!this.initialized) {
      return;
    }
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
      this.set("config", { ...config, sessionTimeout: timeout });
    }
  }
  getQueueLength() {
    return this.managers.event?.getQueueLength() ?? 0;
  }
  forceInitLock(enabled = true) {
    this._isInitializing = enabled;
  }
  simulatePersistedEvents(events) {
    const storageManager = this.managers?.storage;
    if (!storageManager) {
      throw new Error("Storage manager not available");
    }
    const config = this.get("config");
    const projectId = config?.integrations?.tracelog?.projectId ?? config?.integrations?.custom?.collectApiUrl ?? "test";
    const userId = this.get("userId");
    const sessionId = this.get("sessionId");
    if (!projectId || !userId) {
      throw new Error("Project ID or User ID not available. Initialize TraceLog first.");
    }
    const persistedData = {
      userId,
      sessionId: sessionId || `test-session-${Date.now()}`,
      device: "desktop",
      events,
      timestamp: Date.now()
    };
    const storageKey = `${STORAGE_BASE_KEY}:${projectId}:queue:${userId}`;
    storageManager.setItem(storageKey, JSON.stringify(persistedData));
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
  destroy(force = false) {
    if (!this.initialized && !force) {
      return;
    }
    this.ensureNotDestroying();
    this._isDestroying = true;
    try {
      super.destroy(force);
      if (__setAppInstance) {
        __setAppInstance(null);
      }
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
   * Ensures destroy operation is not in progress, throws if it is
   */
  ensureNotDestroying() {
    if (this._isDestroying) {
      throw new Error("Destroy operation already in progress");
    }
  }
}
const pendingListeners = [];
let app = null;
let isInitializing = false;
let isDestroying = false;
const init = async (config) => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("[TraceLog] This library can only be used in a browser environment");
  }
  if (window.__traceLogDisabled) {
    return;
  }
  if (app) {
    return;
  }
  if (isInitializing) {
    return;
  }
  isInitializing = true;
  try {
    const validatedConfig = validateAndNormalizeConfig(config ?? {});
    const instance = new App();
    try {
      pendingListeners.forEach(({ event: event2, callback }) => {
        instance.on(event2, callback);
      });
      pendingListeners.length = 0;
      const initPromise = instance.init(validatedConfig);
      const timeoutPromise = new Promise((_2, reject) => {
        setTimeout(() => {
          reject(new Error(`[TraceLog] Initialization timeout after ${INITIALIZATION_TIMEOUT_MS}ms`));
        }, INITIALIZATION_TIMEOUT_MS);
      });
      await Promise.race([initPromise, timeoutPromise]);
      app = instance;
    } catch (error) {
      try {
        instance.destroy(true);
      } catch (cleanupError) {
        log("error", "Failed to cleanup partially initialized app", { error: cleanupError });
      }
      throw error;
    }
  } catch (error) {
    app = null;
    throw error;
  } finally {
    isInitializing = false;
  }
};
const event = (name, metadata) => {
  if (!app) {
    throw new Error("[TraceLog] TraceLog not initialized. Please call init() first.");
  }
  if (isDestroying) {
    throw new Error("[TraceLog] Cannot send events while TraceLog is being destroyed");
  }
  app.sendCustomEvent(name, metadata);
};
const on = (event2, callback) => {
  if (!app || isInitializing) {
    pendingListeners.push({ event: event2, callback });
    return;
  }
  app.on(event2, callback);
};
const off = (event2, callback) => {
  if (!app) {
    const index = pendingListeners.findIndex((l2) => l2.event === event2 && l2.callback === callback);
    if (index !== -1) {
      pendingListeners.splice(index, 1);
    }
    return;
  }
  app.off(event2, callback);
};
const isInitialized = () => {
  return app !== null;
};
const destroy = () => {
  if (isDestroying) {
    throw new Error("[TraceLog] Destroy operation already in progress");
  }
  if (!app) {
    throw new Error("[TraceLog] App not initialized");
  }
  isDestroying = true;
  try {
    app.destroy();
    app = null;
    isInitializing = false;
    pendingListeners.length = 0;
    if (typeof window !== "undefined" && window.__traceLogBridge) {
      window.__traceLogBridge = void 0;
    }
  } catch (error) {
    app = null;
    isInitializing = false;
    pendingListeners.length = 0;
    log("warn", "Error during destroy, forced cleanup completed", { error });
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
const __setAppInstance = (instance) => {
  if (instance !== null) {
    const hasRequiredMethods = typeof instance === "object" && "init" in instance && "destroy" in instance && "on" in instance && "off" in instance;
    if (!hasRequiredMethods) {
      throw new Error("[TraceLog] Invalid app instance type");
    }
  }
  if (app !== null && instance !== null && app !== instance) {
    throw new Error("[TraceLog] Cannot overwrite existing app instance. Call destroy() first.");
  }
  app = instance;
};
const PERFORMANCE_CONFIG = {
  WEB_VITALS_THRESHOLDS
  // Business thresholds for performance analysis
};
const DATA_PROTECTION = {
  PII_PATTERNS
  // Patterns for sensitive data protection
};
const ENGAGEMENT_THRESHOLDS = {
  LOW_ACTIVITY_EVENT_COUNT: 50,
  HIGH_ACTIVITY_EVENT_COUNT: 1e3,
  MIN_EVENTS_FOR_DYNAMIC_CALCULATION: 100,
  MIN_EVENTS_FOR_TREND_ANALYSIS: 30,
  BOUNCE_RATE_SESSION_THRESHOLD: 1,
  // Sessions with 1 page view = bounce
  MIN_ENGAGED_SESSION_DURATION_MS: 30 * 1e3,
  MIN_SCROLL_DEPTH_ENGAGEMENT: 25
  // 25% scroll depth for engagement
};
const SESSION_ANALYTICS = {
  INACTIVITY_TIMEOUT_MS: 30 * 60 * 1e3,
  // 30min for analytics (vs 15min client)
  SHORT_SESSION_THRESHOLD_MS: 30 * 1e3,
  MEDIUM_SESSION_THRESHOLD_MS: 5 * 60 * 1e3,
  LONG_SESSION_THRESHOLD_MS: 30 * 60 * 1e3,
  MAX_REALISTIC_SESSION_DURATION_MS: 8 * 60 * 60 * 1e3
  // Filter outliers
};
const DEVICE_ANALYTICS = {
  MOBILE_MAX_WIDTH: 768,
  TABLET_MAX_WIDTH: 1024,
  MOBILE_PERFORMANCE_FACTOR: 1.5,
  // Mobile typically 1.5x slower
  TABLET_PERFORMANCE_FACTOR: 1.2
};
const CONTENT_ANALYTICS = {
  MIN_TEXT_LENGTH_FOR_ANALYSIS: 10,
  MIN_CLICKS_FOR_HOT_ELEMENT: 10,
  // Popular element threshold
  MIN_SCROLL_COMPLETION_PERCENT: 80,
  // Page consumption threshold
  MIN_TIME_ON_PAGE_FOR_READ_MS: 15 * 1e3
};
const INSIGHT_THRESHOLDS = {
  SIGNIFICANT_CHANGE_PERCENT: 20,
  MAJOR_CHANGE_PERCENT: 50,
  MIN_EVENTS_FOR_INSIGHT: 100,
  MIN_SESSIONS_FOR_INSIGHT: 10,
  MIN_CORRELATION_STRENGTH: 0.7,
  // Strong correlation threshold
  LOW_ERROR_RATE_PERCENT: 1,
  HIGH_ERROR_RATE_PERCENT: 5,
  CRITICAL_ERROR_RATE_PERCENT: 10
};
const TEMPORAL_ANALYSIS = {
  SHORT_TERM_TREND_HOURS: 24,
  MEDIUM_TERM_TREND_DAYS: 7,
  LONG_TERM_TREND_DAYS: 30,
  MIN_DATA_POINTS_FOR_TREND: 5,
  WEEKLY_PATTERN_MIN_WEEKS: 4,
  DAILY_PATTERN_MIN_DAYS: 14
};
const SEGMENTATION_ANALYTICS = {
  MIN_SEGMENT_SIZE: 10,
  MIN_COHORT_SIZE: 5,
  COHORT_ANALYSIS_DAYS: [1, 3, 7, 14, 30],
  MIN_FUNNEL_EVENTS: 20
};
const ANALYTICS_QUERY_LIMITS = {
  DEFAULT_EVENTS_LIMIT: 5,
  DEFAULT_SESSIONS_LIMIT: 5,
  DEFAULT_PAGES_LIMIT: 5,
  MAX_EVENTS_FOR_DEEP_ANALYSIS: 1e4,
  MAX_TIME_RANGE_DAYS: 365,
  ANALYTICS_BATCH_SIZE: 1e3
  // For historical analysis
};
const ANOMALY_DETECTION = {
  ANOMALY_THRESHOLD_SIGMA: 2.5,
  STRONG_ANOMALY_THRESHOLD_SIGMA: 3,
  TRAFFIC_DROP_ALERT_PERCENT: -30,
  TRAFFIC_SPIKE_ALERT_PERCENT: 200,
  MIN_BASELINE_DAYS: 7,
  MIN_EVENTS_FOR_ANOMALY_DETECTION: 50
};
const SPECIAL_PAGE_URLS = {
  PAGE_URL_EXCLUDED: "excluded",
  PAGE_URL_UNKNOWN: "unknown"
};
const tracelog = {
  init,
  event,
  on,
  off,
  isInitialized,
  destroy
};
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
  ANALYTICS_QUERY_LIMITS,
  ANOMALY_DETECTION,
  AppConfigValidationError,
  CONTENT_ANALYTICS,
  DATA_PROTECTION,
  DEVICE_ANALYTICS,
  DeviceType,
  ENGAGEMENT_THRESHOLDS,
  EmitterEvent,
  ErrorType,
  EventType,
  INSIGHT_THRESHOLDS,
  InitializationTimeoutError,
  IntegrationValidationError,
  MAX_ARRAY_LENGTH,
  MAX_CUSTOM_EVENT_ARRAY_SIZE,
  MAX_CUSTOM_EVENT_KEYS,
  MAX_CUSTOM_EVENT_NAME_LENGTH,
  MAX_CUSTOM_EVENT_STRING_SIZE,
  MAX_METADATA_NESTING_DEPTH,
  MAX_NESTED_OBJECT_KEYS,
  MAX_STRING_LENGTH,
  MAX_STRING_LENGTH_IN_ARRAY,
  Mode,
  PERFORMANCE_CONFIG,
  PermanentError,
  SEGMENTATION_ANALYTICS,
  SESSION_ANALYTICS,
  SPECIAL_PAGE_URLS,
  SamplingRateValidationError,
  ScrollDirection,
  SessionTimeoutValidationError,
  SpecialApiUrl,
  TEMPORAL_ANALYSIS,
  TraceLogValidationError,
  isPrimaryScrollEvent,
  isSecondaryScrollEvent,
  tracelog
};
//# sourceMappingURL=tracelog.esm.js.map
