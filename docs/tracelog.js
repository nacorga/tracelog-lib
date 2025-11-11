const DEFAULT_SESSION_TIMEOUT = 15 * 60 * 1e3;
const DUPLICATE_EVENT_THRESHOLD_MS = 500;
const EVENT_SENT_INTERVAL_MS = 1e4;
const SCROLL_DEBOUNCE_TIME_MS = 250;
const DEFAULT_VISIBILITY_TIMEOUT_MS = 2e3;
const DEFAULT_PAGE_VIEW_THROTTLE_MS = 1e3;
const DEFAULT_CLICK_THROTTLE_MS = 300;
const DEFAULT_VIEWPORT_COOLDOWN_PERIOD = 6e4;
const DEFAULT_VIEWPORT_MAX_TRACKED_ELEMENTS = 100;
const VIEWPORT_MUTATION_DEBOUNCE_MS = 100;
const MAX_THROTTLE_CACHE_ENTRIES = 1e3;
const THROTTLE_ENTRY_TTL_MS = 3e5;
const THROTTLE_PRUNE_INTERVAL_MS = 3e4;
const EVENT_EXPIRY_HOURS = 2;
const PERSISTENCE_THROTTLE_MS = 1e3;
const MAX_EVENTS_QUEUE_LENGTH = 100;
const REQUEST_TIMEOUT_MS = 1e4;
const SIGNIFICANT_SCROLL_DELTA = 10;
const MIN_SCROLL_DEPTH_CHANGE = 5;
const SCROLL_MIN_EVENT_INTERVAL_MS = 500;
const MAX_SCROLL_EVENTS_PER_SESSION = 120;
const DEFAULT_SAMPLING_RATE = 1;
const RATE_LIMIT_WINDOW_MS = 1e3;
const MAX_EVENTS_PER_SECOND = 50;
const MAX_SAME_EVENT_PER_MINUTE = 60;
const PER_EVENT_RATE_LIMIT_WINDOW_MS = 6e4;
const MAX_EVENTS_PER_SESSION = 1e3;
const MAX_CLICKS_PER_SESSION = 500;
const MAX_PAGE_VIEWS_PER_SESSION = 100;
const MAX_CUSTOM_EVENTS_PER_SESSION = 500;
const MAX_VIEWPORT_EVENTS_PER_SESSION = 200;
const BATCH_SIZE_THRESHOLD = 50;
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
const MAX_BEACON_PAYLOAD_SIZE = 64 * 1024;
const MAX_FINGERPRINTS = 1e3;
const FINGERPRINT_CLEANUP_MULTIPLIER = 10;
const MAX_FINGERPRINTS_HARD_LIMIT = 2e3;
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
const DEFAULT_SENSITIVE_QUERY_PARAMS = [
  "token",
  "auth",
  "key",
  "session",
  "reset",
  "password",
  "api_key",
  "apikey",
  "secret",
  "access_token",
  "refresh_token",
  "verification",
  "code",
  "otp"
];
const INITIALIZATION_TIMEOUT_MS = 1e4;
const SCROLL_SUPPRESS_MULTIPLIER = 2;
const MAX_SEND_RETRIES = 2;
const RETRY_BACKOFF_BASE_MS = 100;
const RETRY_BACKOFF_JITTER_MS = 100;
const VALIDATION_MESSAGES = {
  INVALID_SESSION_TIMEOUT: `Session timeout must be between ${MIN_SESSION_TIMEOUT_MS}ms (30 seconds) and ${MAX_SESSION_TIMEOUT_MS}ms (24 hours)`,
  INVALID_SAMPLING_RATE: "Sampling rate must be between 0 and 1",
  INVALID_ERROR_SAMPLING_RATE: "Error sampling must be between 0 and 1",
  INVALID_TRACELOG_PROJECT_ID: "TraceLog project ID is required when integration is enabled",
  INVALID_CUSTOM_API_URL: "Custom API URL is required when integration is enabled",
  INVALID_GLOBAL_METADATA: "Global metadata must be an object",
  INVALID_SENSITIVE_QUERY_PARAMS: "Sensitive query params must be an array of strings",
  INVALID_PRIMARY_SCROLL_SELECTOR: "Primary scroll selector must be a non-empty string",
  INVALID_PRIMARY_SCROLL_SELECTOR_SYNTAX: "Invalid CSS selector syntax for primaryScrollSelector",
  INVALID_PAGE_VIEW_THROTTLE: "Page view throttle must be a non-negative number",
  INVALID_CLICK_THROTTLE: "Click throttle must be a non-negative number",
  INVALID_MAX_SAME_EVENT_PER_MINUTE: "Max same event per minute must be a positive number",
  INVALID_VIEWPORT_CONFIG: "Viewport config must be an object",
  INVALID_VIEWPORT_ELEMENTS: "Viewport elements must be a non-empty array",
  INVALID_VIEWPORT_ELEMENT: "Each viewport element must have a valid selector string",
  INVALID_VIEWPORT_ELEMENT_ID: "Viewport element id must be a non-empty string",
  INVALID_VIEWPORT_ELEMENT_NAME: "Viewport element name must be a non-empty string",
  INVALID_VIEWPORT_THRESHOLD: "Viewport threshold must be a number between 0 and 1",
  INVALID_VIEWPORT_MIN_DWELL_TIME: "Viewport minDwellTime must be a non-negative number",
  INVALID_VIEWPORT_COOLDOWN_PERIOD: "Viewport cooldownPeriod must be a non-negative number",
  INVALID_VIEWPORT_MAX_TRACKED_ELEMENTS: "Viewport maxTrackedElements must be a positive number"
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
  EventType2["VIEWPORT_VISIBLE"] = "viewport_visible";
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
var Mode = /* @__PURE__ */ ((Mode2) => {
  Mode2["QA"] = "qa";
  return Mode2;
})(Mode || {});
const isPrimaryScrollEvent = (event2) => {
  return event2.type === EventType.SCROLL && "scroll_data" in event2 && event2.scroll_data.is_primary === true;
};
const isSecondaryScrollEvent = (event2) => {
  return event2.type === EventType.SCROLL && "scroll_data" in event2 && event2.scroll_data.is_primary === false;
};
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
    if (error instanceof Error) {
      return `[TraceLog] ${msg}: ${error.message}`;
    }
    if (typeof error === "string") {
      return `[TraceLog] ${msg}: ${error}`;
    }
    if (typeof error === "object") {
      try {
        return `[TraceLog] ${msg}: ${JSON.stringify(error)}`;
      } catch {
        return `[TraceLog] ${msg}: [Unable to serialize error]`;
      }
    }
    return `[TraceLog] ${msg}: ${String(error)}`;
  }
  return `[TraceLog] ${msg}`;
};
const log = (type, msg, extra) => {
  const { error, data, showToClient = false, style } = extra ?? {};
  const formattedMsg = error ? formatLogMsg(msg, error) : `[TraceLog] ${msg}`;
  const method = type === "error" ? "error" : type === "warn" ? "warn" : "log";
  const hasStyle = style !== void 0 && style !== "";
  const styledMsg = hasStyle ? `%c${formattedMsg}` : formattedMsg;
  if (data !== void 0) {
    const sanitizedData = data;
    if (hasStyle) {
      console[method](styledMsg, style, sanitizedData);
    } else {
      console[method](styledMsg, sanitizedData);
    }
  } else {
    if (hasStyle) {
      console[method](styledMsg, style);
    } else {
      console[method](styledMsg);
    }
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
const LOG_STYLE_ACTIVE = "background: #ff9800; color: white; font-weight: bold; padding: 2px 8px; border-radius: 3px;";
const LOG_STYLE_DISABLED = "background: #9e9e9e; color: white; font-weight: bold; padding: 2px 8px; border-radius: 3px;";
const DISABLEABLE_EVENT_TYPES = ["scroll", "web_vitals", "error"];
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
const DEFAULT_ERROR_SAMPLING_RATE = 1;
const ERROR_BURST_WINDOW_MS = 1e3;
const ERROR_BURST_THRESHOLD = 10;
const ERROR_BURST_BACKOFF_MS = 5e3;
const PERMANENT_ERROR_LOG_THROTTLE_MS = 6e4;
const STORAGE_BASE_KEY = "tlog";
const QA_MODE_KEY = `${STORAGE_BASE_KEY}:qa_mode`;
const USER_ID_KEY = `${STORAGE_BASE_KEY}:uid`;
const QA_MODE_URL_PARAM = "tlog_mode";
const QA_MODE_ENABLE_VALUE = "qa";
const QA_MODE_DISABLE_VALUE = "qa_off";
const QUEUE_KEY = (id) => id ? `${STORAGE_BASE_KEY}:${id}:queue` : `${STORAGE_BASE_KEY}:queue`;
const SESSION_STORAGE_KEY = (id) => id ? `${STORAGE_BASE_KEY}:${id}:session` : `${STORAGE_BASE_KEY}:session`;
const BROADCAST_CHANNEL_NAME = (id) => id ? `${STORAGE_BASE_KEY}:${id}:broadcast` : `${STORAGE_BASE_KEY}:broadcast`;
const WEB_VITALS_GOOD_THRESHOLDS = {
  LCP: 2500,
  // Good: ≤ 2.5s
  FCP: 1800,
  // Good: ≤ 1.8s
  CLS: 0.1,
  // Good: ≤ 0.1
  INP: 200,
  // Good: ≤ 200ms
  TTFB: 800,
  // Good: ≤ 800ms
  LONG_TASK: 50
};
const WEB_VITALS_NEEDS_IMPROVEMENT_THRESHOLDS = {
  LCP: 2500,
  // Needs improvement: > 2.5s (same as good boundary)
  FCP: 1800,
  // Needs improvement: > 1.8s
  CLS: 0.1,
  // Needs improvement: > 0.1
  INP: 200,
  // Needs improvement: > 200ms
  TTFB: 800,
  // Needs improvement: > 800ms
  LONG_TASK: 50
};
const WEB_VITALS_POOR_THRESHOLDS = {
  LCP: 4e3,
  // Poor: > 4s
  FCP: 3e3,
  // Poor: > 3s
  CLS: 0.25,
  // Poor: > 0.25
  INP: 500,
  // Poor: > 500ms
  TTFB: 1800,
  // Poor: > 1800ms
  LONG_TASK: 50
};
const DEFAULT_WEB_VITALS_MODE = "needs-improvement";
const getWebVitalsThresholds = (mode = DEFAULT_WEB_VITALS_MODE) => {
  switch (mode) {
    case "all":
      return { LCP: 0, FCP: 0, CLS: 0, INP: 0, TTFB: 0, LONG_TASK: 0 };
    // Track everything
    case "needs-improvement":
      return WEB_VITALS_NEEDS_IMPROVEMENT_THRESHOLDS;
    case "poor":
      return WEB_VITALS_POOR_THRESHOLDS;
    default:
      return WEB_VITALS_NEEDS_IMPROVEMENT_THRESHOLDS;
  }
};
const LONG_TASK_THROTTLE_MS = 1e3;
const MAX_NAVIGATION_HISTORY = 50;
const detectQaMode = () => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }
  try {
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get(QA_MODE_URL_PARAM);
    const storedState = sessionStorage.getItem(QA_MODE_KEY);
    let newState = null;
    if (urlParam === QA_MODE_ENABLE_VALUE) {
      newState = true;
      sessionStorage.setItem(QA_MODE_KEY, "true");
      log("info", "QA Mode ACTIVE", {
        showToClient: true,
        style: LOG_STYLE_ACTIVE
      });
    } else if (urlParam === QA_MODE_DISABLE_VALUE) {
      newState = false;
      sessionStorage.setItem(QA_MODE_KEY, "false");
      log("info", "QA Mode DISABLED", {
        showToClient: true,
        style: LOG_STYLE_DISABLED
      });
    }
    if (urlParam === QA_MODE_ENABLE_VALUE || urlParam === QA_MODE_DISABLE_VALUE) {
      try {
        params.delete(QA_MODE_URL_PARAM);
        const search = params.toString();
        const url = window.location.pathname + (search ? "?" + search : "") + window.location.hash;
        window.history.replaceState({}, "", url);
      } catch {
      }
    }
    return newState ?? storedState === "true";
  } catch {
    return false;
  }
};
const setQaMode$1 = (enabled) => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  try {
    if (enabled) {
      sessionStorage.setItem(QA_MODE_KEY, "true");
      log("info", "QA Mode ENABLED", {
        showToClient: true,
        style: LOG_STYLE_ACTIVE
      });
    } else {
      sessionStorage.setItem(QA_MODE_KEY, "false");
      log("info", "QA Mode DISABLED", {
        showToClient: true,
        style: LOG_STYLE_DISABLED
      });
    }
  } catch {
    log("warn", "Cannot set QA mode: sessionStorage unavailable");
  }
};
const qaMode_utils = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  detectQaMode,
  setQaMode: setQaMode$1
}, Symbol.toStringTag, { value: "Module" }));
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
const generateSaasApiUrl = (projectId) => {
  try {
    const url = new URL(window.location.href);
    const host = url.hostname;
    if (!host || typeof host !== "string") {
      throw new Error("Invalid hostname");
    }
    if (host === "localhost" || host === "127.0.0.1" || /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) {
      throw new Error(
        "SaaS integration not supported on localhost or IP addresses. Use custom backend integration instead."
      );
    }
    const parts = host.split(".");
    if (!parts || !Array.isArray(parts) || parts.length === 0 || parts.length === 1 && parts[0] === "") {
      throw new Error("Invalid hostname structure");
    }
    if (parts.length === 1) {
      throw new Error("Single-part domain not supported for SaaS integration");
    }
    let cleanDomain;
    if (parts.length === 2) {
      cleanDomain = parts.join(".");
    } else {
      cleanDomain = parts.slice(-2).join(".");
    }
    if (!cleanDomain || cleanDomain.split(".").length < 2) {
      throw new Error("Invalid domain structure for SaaS");
    }
    const collectApiUrl = `https://${projectId}.${cleanDomain}/collect`;
    const isValid = isValidUrl(collectApiUrl);
    if (!isValid) {
      throw new Error("Generated URL failed validation");
    }
    return collectApiUrl;
  } catch (error) {
    throw new Error(`Invalid SaaS URL configuration: ${error instanceof Error ? error.message : String(error)}`);
  }
};
const getCollectApiUrls = (config) => {
  const urls = {};
  if (config.integrations?.tracelog?.projectId) {
    urls.saas = generateSaasApiUrl(config.integrations.tracelog.projectId);
  }
  const customApiUrl = config.integrations?.custom?.collectApiUrl;
  if (customApiUrl) {
    const allowHttp = config.integrations?.custom?.allowHttp ?? false;
    const isValid = isValidUrl(customApiUrl, allowHttp);
    if (!isValid) {
      throw new Error("Invalid custom API URL");
    }
    urls.custom = customApiUrl;
  }
  return urls;
};
const normalizeUrl = (url, sensitiveQueryParams = []) => {
  if (!url || typeof url !== "string") {
    log("warn", "Invalid URL provided to normalizeUrl", { data: { url: String(url) } });
    return url || "";
  }
  try {
    const urlObject = new URL(url);
    const searchParams = urlObject.searchParams;
    const allSensitiveParams = [.../* @__PURE__ */ new Set([...DEFAULT_SENSITIVE_QUERY_PARAMS, ...sensitiveQueryParams])];
    let hasChanged = false;
    const removedParams = [];
    allSensitiveParams.forEach((param) => {
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
    const urlPreview = url && typeof url === "string" ? url.slice(0, 100) : String(url);
    log("warn", "URL normalization failed, returning original", { error, data: { url: urlPreview } });
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
  if (config.pageViewThrottleMs !== void 0) {
    if (typeof config.pageViewThrottleMs !== "number" || config.pageViewThrottleMs < 0) {
      throw new AppConfigValidationError(VALIDATION_MESSAGES.INVALID_PAGE_VIEW_THROTTLE, "config");
    }
  }
  if (config.clickThrottleMs !== void 0) {
    if (typeof config.clickThrottleMs !== "number" || config.clickThrottleMs < 0) {
      throw new AppConfigValidationError(VALIDATION_MESSAGES.INVALID_CLICK_THROTTLE, "config");
    }
  }
  if (config.maxSameEventPerMinute !== void 0) {
    if (typeof config.maxSameEventPerMinute !== "number" || config.maxSameEventPerMinute <= 0) {
      throw new AppConfigValidationError(VALIDATION_MESSAGES.INVALID_MAX_SAME_EVENT_PER_MINUTE, "config");
    }
  }
  if (config.viewport !== void 0) {
    validateViewportConfig(config.viewport);
  }
  if (config.disabledEvents !== void 0) {
    if (!Array.isArray(config.disabledEvents)) {
      throw new AppConfigValidationError("disabledEvents must be an array", "config");
    }
    const uniqueEvents = /* @__PURE__ */ new Set();
    for (const eventType of config.disabledEvents) {
      if (typeof eventType !== "string") {
        throw new AppConfigValidationError("All disabled event types must be strings", "config");
      }
      if (!DISABLEABLE_EVENT_TYPES.includes(eventType)) {
        throw new AppConfigValidationError(
          `Invalid disabled event type: "${eventType}". Must be one of: ${DISABLEABLE_EVENT_TYPES.join(", ")}`,
          "config"
        );
      }
      if (uniqueEvents.has(eventType)) {
        throw new AppConfigValidationError(
          `Duplicate disabled event type found: "${eventType}". Each event type should appear only once.`,
          "config"
        );
      }
      uniqueEvents.add(eventType);
    }
  }
  if (config.webVitalsMode !== void 0) {
    if (typeof config.webVitalsMode !== "string") {
      throw new AppConfigValidationError(
        `Invalid webVitalsMode type: ${typeof config.webVitalsMode}. Must be a string`,
        "config"
      );
    }
    const validModes = ["all", "needs-improvement", "poor"];
    if (!validModes.includes(config.webVitalsMode)) {
      throw new AppConfigValidationError(
        `Invalid webVitalsMode: "${config.webVitalsMode}". Must be one of: ${validModes.join(", ")}`,
        "config"
      );
    }
  }
  if (config.webVitalsThresholds !== void 0) {
    if (typeof config.webVitalsThresholds !== "object" || config.webVitalsThresholds === null || Array.isArray(config.webVitalsThresholds)) {
      throw new AppConfigValidationError("webVitalsThresholds must be an object", "config");
    }
    const validKeys = ["LCP", "FCP", "CLS", "INP", "TTFB", "LONG_TASK"];
    for (const [key, value] of Object.entries(config.webVitalsThresholds)) {
      if (!validKeys.includes(key)) {
        throw new AppConfigValidationError(
          `Invalid Web Vitals threshold key: "${key}". Must be one of: ${validKeys.join(", ")}`,
          "config"
        );
      }
      if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
        throw new AppConfigValidationError(
          `Invalid Web Vitals threshold value for ${key}: ${value}. Must be a non-negative finite number`,
          "config"
        );
      }
    }
  }
};
const validateViewportConfig = (viewport) => {
  if (typeof viewport !== "object" || viewport === null) {
    throw new AppConfigValidationError(VALIDATION_MESSAGES.INVALID_VIEWPORT_CONFIG, "config");
  }
  if (!viewport.elements || !Array.isArray(viewport.elements)) {
    throw new AppConfigValidationError(VALIDATION_MESSAGES.INVALID_VIEWPORT_ELEMENTS, "config");
  }
  if (viewport.elements.length === 0) {
    throw new AppConfigValidationError(VALIDATION_MESSAGES.INVALID_VIEWPORT_ELEMENTS, "config");
  }
  const uniqueSelectors = /* @__PURE__ */ new Set();
  for (const element of viewport.elements) {
    if (!element.selector || typeof element.selector !== "string" || !element.selector.trim()) {
      throw new AppConfigValidationError(VALIDATION_MESSAGES.INVALID_VIEWPORT_ELEMENT, "config");
    }
    const normalizedSelector = element.selector.trim();
    if (uniqueSelectors.has(normalizedSelector)) {
      throw new AppConfigValidationError(
        `Duplicate viewport selector found: "${normalizedSelector}". Each selector should appear only once.`,
        "config"
      );
    }
    uniqueSelectors.add(normalizedSelector);
    if (element.id !== void 0 && (typeof element.id !== "string" || !element.id.trim())) {
      throw new AppConfigValidationError(VALIDATION_MESSAGES.INVALID_VIEWPORT_ELEMENT_ID, "config");
    }
    if (element.name !== void 0 && (typeof element.name !== "string" || !element.name.trim())) {
      throw new AppConfigValidationError(VALIDATION_MESSAGES.INVALID_VIEWPORT_ELEMENT_NAME, "config");
    }
  }
  if (viewport.threshold !== void 0) {
    if (typeof viewport.threshold !== "number" || viewport.threshold < 0 || viewport.threshold > 1) {
      throw new AppConfigValidationError(VALIDATION_MESSAGES.INVALID_VIEWPORT_THRESHOLD, "config");
    }
  }
  if (viewport.minDwellTime !== void 0) {
    if (typeof viewport.minDwellTime !== "number" || viewport.minDwellTime < 0) {
      throw new AppConfigValidationError(VALIDATION_MESSAGES.INVALID_VIEWPORT_MIN_DWELL_TIME, "config");
    }
  }
  if (viewport.cooldownPeriod !== void 0) {
    if (typeof viewport.cooldownPeriod !== "number" || viewport.cooldownPeriod < 0) {
      throw new AppConfigValidationError(VALIDATION_MESSAGES.INVALID_VIEWPORT_COOLDOWN_PERIOD, "config");
    }
  }
  if (viewport.maxTrackedElements !== void 0) {
    if (typeof viewport.maxTrackedElements !== "number" || viewport.maxTrackedElements <= 0) {
      throw new AppConfigValidationError(VALIDATION_MESSAGES.INVALID_VIEWPORT_MAX_TRACKED_ELEMENTS, "config");
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
};
const validateAndNormalizeConfig = (config) => {
  validateAppConfig(config);
  const normalizedConfig = {
    ...config ?? {},
    sessionTimeout: config?.sessionTimeout ?? DEFAULT_SESSION_TIMEOUT,
    globalMetadata: config?.globalMetadata ?? {},
    sensitiveQueryParams: config?.sensitiveQueryParams ?? [],
    errorSampling: config?.errorSampling ?? DEFAULT_ERROR_SAMPLING_RATE,
    samplingRate: config?.samplingRate ?? DEFAULT_SAMPLING_RATE,
    pageViewThrottleMs: config?.pageViewThrottleMs ?? DEFAULT_PAGE_VIEW_THROTTLE_MS,
    clickThrottleMs: config?.clickThrottleMs ?? DEFAULT_CLICK_THROTTLE_MS,
    maxSameEventPerMinute: config?.maxSameEventPerMinute ?? MAX_SAME_EVENT_PER_MINUTE,
    disabledEvents: config?.disabledEvents ?? []
  };
  if (normalizedConfig.integrations?.custom) {
    normalizedConfig.integrations.custom = {
      ...normalizedConfig.integrations.custom,
      allowHttp: normalizedConfig.integrations.custom.allowHttp ?? false
    };
  }
  if (normalizedConfig.viewport) {
    normalizedConfig.viewport = {
      ...normalizedConfig.viewport,
      threshold: normalizedConfig.viewport.threshold ?? 0.5,
      minDwellTime: normalizedConfig.viewport.minDwellTime ?? DEFAULT_VISIBILITY_TIMEOUT_MS,
      cooldownPeriod: normalizedConfig.viewport.cooldownPeriod ?? DEFAULT_VIEWPORT_COOLDOWN_PERIOD,
      maxTrackedElements: normalizedConfig.viewport.maxTrackedElements ?? DEFAULT_VIEWPORT_MAX_TRACKED_ELEMENTS
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
  const intro = type && type === "customEvent" ? `${type} "${eventName}" metadata error` : `${eventName} metadata error`;
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
    const intro = type && type === "customEvent" ? `${type} "${eventName}" metadata error` : `${eventName} metadata error`;
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
  /**
   * Subscribes to an event channel
   *
   * **Behavior**:
   * - Creates event channel if it doesn't exist
   * - Appends callback to list of listeners for this event
   * - Same callback can be registered multiple times (will fire multiple times)
   *
   * **Type Safety**: Callback receives data type matching the event name
   *
   * @param event - Event name to subscribe to
   * @param callback - Function to call when event is emitted
   *
   * @example
   * ```typescript
   * emitter.on('event', (eventData) => {
   *   // eventData is typed as EventData
   *   console.log(eventData.type);
   * });
   * ```
   */
  on(event2, callback) {
    if (!this.listeners.has(event2)) {
      this.listeners.set(event2, []);
    }
    this.listeners.get(event2).push(callback);
  }
  /**
   * Unsubscribes from an event channel
   *
   * **Behavior**:
   * - Removes first occurrence of callback from listener list
   * - If callback not found, no error is thrown
   * - If callback was registered multiple times, only one instance is removed
   *
   * **Important**: Must use same function reference passed to `on()`
   *
   * @param event - Event name to unsubscribe from
   * @param callback - Function reference to remove (must match `on()` reference)
   *
   * @example
   * ```typescript
   * const callback = (data) => console.log(data);
   * emitter.on('event', callback);
   * emitter.off('event', callback); // Unsubscribes successfully
   *
   * // BAD: Won't work (different function reference)
   * emitter.on('event', (data) => console.log(data));
   * emitter.off('event', (data) => console.log(data)); // No effect
   * ```
   */
  off(event2, callback) {
    const callbacks = this.listeners.get(event2);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }
  /**
   * Emits an event with data to all subscribed listeners
   *
   * **Behavior**:
   * - Calls all registered callbacks for this event synchronously
   * - Callbacks execute in registration order
   * - If no listeners, no-op (no error thrown)
   * - Errors in callbacks are NOT caught (propagate to caller)
   *
   * **Type Safety**: Data type must match event name's expected type
   *
   * @param event - Event name to emit
   * @param data - Event data (type must match EmitterMap[event])
   *
   * @example
   * ```typescript
   * // Emit event data
   * emitter.emit('event', eventData);
   *
   * // Emit queue data
   * emitter.emit('queue', {
   *   user_id: 'user-123',
   *   session_id: 'session-456',
   *   device: DeviceType.Desktop,
   *   events: [event1, event2]
   * });
   * ```
   */
  emit(event2, data) {
    const callbacks = this.listeners.get(event2);
    if (callbacks) {
      callbacks.forEach((callback) => {
        callback(data);
      });
    }
  }
  /**
   * Removes all listeners for all events
   *
   * **Purpose**: Cleanup method called during `App.destroy()` to prevent memory leaks
   *
   * **Behavior**:
   * - Clears all event channels
   * - Listeners cannot be restored (new subscriptions required)
   * - Called automatically during library teardown
   *
   * **Use Cases**:
   * - Application teardown
   * - Component unmounting in SPA frameworks
   * - Test cleanup
   *
   * @example
   * ```typescript
   * // During destroy
   * emitter.removeAllListeners();
   * // All subscriptions cleared
   * ```
   */
  removeAllListeners() {
    this.listeners.clear();
  }
}
function transformEvent(event2, transformer, context) {
  try {
    const result = transformer(event2);
    if (result === null) {
      return null;
    }
    if (typeof result === "object" && result !== null && "type" in result) {
      return result;
    }
    log("warn", `beforeSend transformer returned invalid data, using original [${context}]`);
    return event2;
  } catch (error) {
    log("error", `beforeSend transformer threw error, using original event [${context}]`, { error });
    return event2;
  }
}
function transformEvents(events, transformer, context) {
  return events.map((event2) => transformEvent(event2, transformer, context)).filter((event2) => event2 !== null);
}
function transformBatch(batch, transformer, context) {
  try {
    const result = transformer(batch);
    if (result === null) {
      log("debug", `Batch filtered by beforeBatch transformer [${context}]`, {
        data: { eventCount: batch.events.length }
      });
      return null;
    }
    if (typeof result === "object" && result !== null && Array.isArray(result.events)) {
      return result;
    }
    log("warn", `beforeBatch transformer returned invalid data, using original [${context}]`, {
      data: { eventCount: batch.events.length }
    });
    return batch;
  } catch (error) {
    log("error", `beforeBatch transformer threw error, using original batch [${context}]`, {
      error,
      data: { eventCount: batch.events.length }
    });
    return batch;
  }
}
const globalState = {};
class StateManager {
  /**
   * Retrieves a value from global state.
   *
   * Type-safe getter with compile-time key validation.
   *
   * @template T - State key type (compile-time validated)
   * @param key - State property key
   * @returns Current value for the given key (may be undefined)
   *
   * @example
   * ```typescript
   * const userId = this.get('userId');
   * const config = this.get('config');
   * const sessionId = this.get('sessionId');
   * ```
   */
  get(key) {
    return globalState[key];
  }
  /**
   * Sets a value in global state.
   *
   * Type-safe setter with compile-time type checking.
   * Changes are immediately visible to all StateManager subclasses.
   *
   * @template T - State key type (compile-time validated)
   * @param key - State property key
   * @param value - New value (type must match State[T])
   *
   * @example
   * ```typescript
   * this.set('sessionId', 'session-123');
   * this.set('mode', Mode.QA);
   * this.set('hasStartSession', true);
   * ```
   */
  set(key, value) {
    globalState[key] = value;
  }
  /**
   * Returns an immutable snapshot of the entire global state.
   *
   * Creates a shallow copy to prevent accidental mutations.
   * Use for debugging or when multiple state properties are needed.
   *
   * @returns Readonly shallow copy of global state
   *
   * @example
   * ```typescript
   * const snapshot = this.getState();
   * console.log(snapshot.userId, snapshot.sessionId);
   * ```
   */
  getState() {
    return { ...globalState };
  }
}
class SenderManager extends StateManager {
  storeManager;
  integrationId;
  apiUrl;
  transformers;
  lastPermanentErrorLog = null;
  recoveryInProgress = false;
  /**
   * Creates a SenderManager instance.
   *
   * **Validation**: `integrationId` and `apiUrl` must both be provided or both be undefined.
   * Throws error if only one is provided.
   *
   * @param storeManager - Storage manager for event persistence
   * @param integrationId - Optional integration identifier ('saas' or 'custom')
   * @param apiUrl - Optional API endpoint URL
   * @param transformers - Optional event transformation hooks
   * @throws Error if integrationId and apiUrl are not both provided or both undefined
   */
  constructor(storeManager, integrationId, apiUrl, transformers = {}) {
    super();
    if (integrationId && !apiUrl || !integrationId && apiUrl) {
      throw new Error("SenderManager: integrationId and apiUrl must either both be provided or both be undefined");
    }
    this.storeManager = storeManager;
    this.integrationId = integrationId;
    this.apiUrl = apiUrl;
    this.transformers = transformers;
  }
  /**
   * Get the integration ID for this sender
   * @returns The integration ID ('saas' or 'custom') or undefined if not set
   */
  getIntegrationId() {
    return this.integrationId;
  }
  getQueueStorageKey() {
    const userId = this.get("userId") || "anonymous";
    const baseKey = QUEUE_KEY(userId);
    return this.integrationId ? `${baseKey}:${this.integrationId}` : baseKey;
  }
  /**
   * Sends events synchronously using `navigator.sendBeacon()`.
   *
   * **Purpose**: Guarantees event delivery before page unload even if network is slow.
   *
   * **Use Cases**:
   * - Page unload (`beforeunload`, `pagehide` events)
   * - Tab close scenarios
   * - Any case where async send might be interrupted
   *
   * **Behavior**:
   * - Uses `navigator.sendBeacon()` (browser-queued, synchronous API)
   * - Payload size limited to 64KB (enforced by browser)
   * - Browser guarantees delivery attempt (survives page close)
   * - NO persistence on failure (fire-and-forget)
   *
   * **Return Values**:
   * - `true`: Send succeeded OR skipped (standalone mode)
   * - `false`: Send failed (network error, browser rejected beacon)
   *
   * **Important**: No retry mechanism for failures. Events are NOT persisted.
   *
   * @param body - Event queue to send
   * @returns `true` if send succeeded or was skipped, `false` if failed
   *
   * @see sendEventsQueue for async send with persistence
   * @see src/managers/README.md (lines 82-139) for send details
   */
  sendEventsQueueSync(body) {
    if (this.shouldSkipSend()) {
      return true;
    }
    if (this.apiUrl?.includes(SpecialApiUrl.Fail)) {
      log(
        "warn",
        `Fail mode: simulating network failure (sync)${this.integrationId ? ` [${this.integrationId}]` : ""}`,
        {
          data: { events: body.events.length }
        }
      );
      return false;
    }
    if (this.apiUrl?.includes(SpecialApiUrl.Localhost)) {
      log(
        "debug",
        `Success mode: simulating successful send (sync)${this.integrationId ? ` [${this.integrationId}]` : ""}`,
        {
          data: { events: body.events.length }
        }
      );
      return true;
    }
    return this.sendQueueSyncInternal(body);
  }
  /**
   * Sends events asynchronously using `fetch()` API with automatic persistence on failure.
   *
   * **Purpose**: Reliable event transmission with localStorage fallback for failed sends.
   *
   * **Flow**:
   * 1. Calls internal `send()` method (applies transformers, consent checks)
   * 2. On success: Clears persisted events, invokes `onSuccess` callback
   * 3. On failure: Persists events to localStorage, invokes `onFailure` callback
   * 4. On permanent error (4xx): Clears persisted events (no retry)
   *
   * **Callbacks**:
   * - `onSuccess(eventCount, events, body)`: Called after successful transmission
   * - `onFailure()`: Called after failed transmission or permanent error
   *
   * **Error Handling**:
   * - **Permanent errors** (4xx except 408, 429): Events discarded, not persisted
   * - **Transient errors** (5xx, network, timeout): Events persisted for recovery
   *
   * **Important**: Events are NOT retried in-session. Persistence is for
   * recovery on next page load via `recoverPersistedEvents()`.
   *
   * @param body - Event queue to send
   * @param callbacks - Optional success/failure callbacks
   * @returns Promise resolving to `true` if send succeeded, `false` if failed
   *
   * @see recoverPersistedEvents for recovery flow
   * @see src/managers/README.md (lines 82-139) for send details
   */
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
  /**
   * Recovers and attempts to resend events persisted from previous session.
   *
   * **Purpose**: Zero data loss guarantee - recovers events that failed to send
   * in previous session due to network errors or crashes.
   *
   * **Flow**:
   * 1. Checks if recovery already in progress (prevents duplicate attempts)
   * 2. Loads persisted events from localStorage
   * 3. Validates freshness (discards events older than 2 hours)
   * 4. Applies multi-tab protection (skips events persisted within 1 second)
   * 5. Attempts to resend via `send()` method
   * 6. On success: Clears persisted events, invokes `onSuccess` callback
   * 7. On failure: Keeps events in localStorage, invokes `onFailure` callback
   * 8. On permanent error (4xx): Clears persisted events (no further retry)
   *
   * **Multi-Tab Protection**:
   * - Events persisted within last 1 second are skipped (active tab may retry)
   * - Prevents duplicate sends when multiple tabs recover simultaneously
   *
   * **Event Expiry**:
   * - Events older than 2 hours are discarded (prevents stale data accumulation)
   * - Expiry check uses event timestamps, not persistence time
   *
   * **Callbacks**:
   * - `onSuccess(eventCount, events, body)`: Called after successful transmission
   * - `onFailure()`: Called on send failure or permanent error
   *
   * **Called by**: `EventManager.recoverPersistedEvents()` during `App.init()`
   *
   * **Important**: This method is idempotent and safe to call multiple times.
   * Recovery flag prevents concurrent attempts.
   *
   * @param callbacks - Optional success/failure callbacks
   *
   * @example
   * ```typescript
   * await senderManager.recoverPersistedEvents({
   *   onSuccess: (count, events, body) => {
   *     console.log(`Recovered ${count} events`);
   *   },
   *   onFailure: () => {
   *     console.warn('Recovery failed, will retry on next init');
   *   }
   * });
   * ```
   *
   * @see src/managers/README.md (lines 82-139) for recovery details
   */
  async recoverPersistedEvents(callbacks) {
    if (this.recoveryInProgress) {
      log("debug", "Recovery already in progress, skipping duplicate attempt");
      return;
    }
    this.recoveryInProgress = true;
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
    } finally {
      this.recoveryInProgress = false;
    }
  }
  /**
   * Cleanup method called during `App.destroy()`.
   *
   * **Purpose**: Reserved for future cleanup logic (currently no-op).
   *
   * **Note**: This method is intentionally empty. SenderManager has no
   * cleanup requirements (no timers, no event listeners, no active connections).
   * Persisted events are intentionally kept in localStorage for recovery.
   *
   * **Called by**: `EventManager.stop()` during application teardown
   */
  stop() {
  }
  /**
   * Applies beforeSend transformer to event array for custom backend integrations.
   *
   * **Purpose**: Per-event transformation in multi-integration mode for custom backends only.
   * Bypassed for TraceLog SaaS to maintain schema integrity.
   *
   * **Application Context**:
   * - Only applied in multi-integration mode (SaaS + Custom)
   * - EventManager applies beforeSend for standalone/custom-only modes
   * - This method handles the multi-integration scenario
   *
   * **Transformation Flow**:
   * 1. Skip for TraceLog SaaS integration (returns untransformed body)
   * 2. Check if beforeSend transformer exists
   * 3. Apply transformer to each event via transformEvents() utility
   * 4. Filter out events (empty array = filter entire batch)
   * 5. Return transformed queue or null
   *
   * **Error Handling**:
   * - transformEvents() utility catches and logs transformer errors
   * - Failed transformations fall back to original event
   * - Empty result array treated as filter signal (returns null)
   *
   * @param body - Event queue to transform
   * @returns Transformed queue with modified events, or null to filter entire batch
   */
  applyBeforeSendTransformer(body) {
    if (this.integrationId === "saas") {
      return body;
    }
    const beforeSendTransformer = this.transformers.beforeSend;
    if (!beforeSendTransformer) {
      return body;
    }
    const transformedEvents = transformEvents(
      body.events,
      beforeSendTransformer,
      this.integrationId || "SenderManager"
    );
    if (transformedEvents.length === 0) {
      return null;
    }
    return {
      ...body,
      events: transformedEvents
    };
  }
  /**
   * Applies beforeBatch transformer to entire event queue for custom backend integrations.
   *
   * **Purpose**: Batch-level transformation before network transmission for custom backends only.
   * Bypassed for TraceLog SaaS to maintain schema integrity.
   *
   * **Application Context**:
   * - Applied in both sync (`sendQueueSyncInternal`) and async (`send`) methods
   * - Operates on entire queue after beforeSend transformations
   * - Final transformation step before network transmission
   *
   * **Transformation Flow**:
   * 1. Skip for TraceLog SaaS integration (returns untransformed body)
   * 2. Check if beforeBatch transformer exists
   * 3. Apply transformer to entire queue via transformBatch() utility
   * 4. Return transformed queue or null to filter
   *
   * **Use Cases**:
   * - Add batch-level metadata (timestamps, signatures)
   * - Compress or encrypt entire payload
   * - Apply custom formatting to queue structure
   * - Filter entire batch based on conditions
   *
   * **Error Handling**:
   * - transformBatch() utility catches and logs transformer errors
   * - Failed transformations fall back to original batch
   * - Returning null filters entire batch (prevents send)
   *
   * @param body - Event queue to transform
   * @returns Transformed queue, or null to filter entire batch
   */
  applyBeforeBatchTransformer(body) {
    if (this.integrationId === "saas") {
      return body;
    }
    const beforeBatchTransformer = this.transformers.beforeBatch;
    if (!beforeBatchTransformer) {
      return body;
    }
    const transformed = transformBatch(body, beforeBatchTransformer, this.integrationId || "SenderManager");
    return transformed;
  }
  /**
   * Calculates exponential backoff delay with jitter for retry attempts.
   *
   * **Purpose**: Prevents thundering herd problem when multiple clients retry simultaneously.
   *
   * **Formula**: `RETRY_BACKOFF_BASE_MS * (2 ^ attempt) + random(0, RETRY_BACKOFF_JITTER_MS)`
   *
   * **Examples**:
   * - Attempt 1: 100ms * 2^1 + jitter = 200ms + 0-100ms = 200-300ms
   * - Attempt 2: 100ms * 2^2 + jitter = 400ms + 0-100ms = 400-500ms
   *
   * **Why Jitter?**
   * - Distributes retry timing across clients
   * - Reduces server load spikes from synchronized retries
   * - Industry standard pattern (AWS, Google, Netflix use similar approaches)
   *
   * @param attempt - Current retry attempt number (1-based)
   * @returns Promise that resolves after calculated delay
   */
  async backoffDelay(attempt) {
    const exponentialDelay = RETRY_BACKOFF_BASE_MS * Math.pow(2, attempt);
    const jitter = Math.random() * RETRY_BACKOFF_JITTER_MS;
    const totalDelay = exponentialDelay + jitter;
    return new Promise((resolve) => setTimeout(resolve, totalDelay));
  }
  /**
   * Sends event queue with automatic retry logic for transient failures.
   *
   * **Purpose**: Reliable event transmission with intelligent retry mechanism
   * for transient network/server errors while avoiding unnecessary retries for
   * permanent client errors.
   *
   * **Retry Strategy**:
   * - **Maximum Attempts**: Up to `MAX_SEND_RETRIES` (2) retry attempts
   * - **Backoff**: Exponential backoff with jitter (200-300ms, 400-500ms)
   * - **Transient Errors**: 5xx status codes, network failures, timeouts
   * - **Permanent Errors**: 4xx status codes (except 408, 429) - no retries
   *
   * **Retry Flow**:
   * 1. Attempt send with `sendWithTimeout()`
   * 2. If success (2xx) → return true immediately
   * 3. If permanent error (4xx) → throw PermanentError immediately
   * 4. If transient error (5xx/timeout/network):
   *    - If attempts remaining → wait backoff delay → retry
   *    - If no attempts remaining → return false (caller persists)
   *
   * **Important Behaviors**:
   * - Transformers applied once before retry loop (not re-applied per attempt)
   * - Each retry uses same transformed payload
   * - Permanent errors bypass retries immediately
   *
   * **Error Classification**:
   * - **Permanent** (4xx except 408, 429): Schema errors, auth failures, invalid data
   * - **Transient** (5xx, timeout, network): Server overload, network hiccups, DNS issues
   *
   * @param body - Event queue to send
   * @returns Promise resolving to true if send succeeded, false if all retries exhausted
   * @throws PermanentError for 4xx errors (caller should not retry)
   */
  async send(body) {
    if (this.shouldSkipSend()) {
      return this.simulateSuccessfulSend();
    }
    const afterBeforeSend = this.applyBeforeSendTransformer(body);
    if (!afterBeforeSend) {
      return true;
    }
    const transformedBody = this.applyBeforeBatchTransformer(afterBeforeSend);
    if (!transformedBody) {
      return true;
    }
    if (this.apiUrl?.includes(SpecialApiUrl.Fail)) {
      log("warn", `Fail mode: simulating network failure${this.integrationId ? ` [${this.integrationId}]` : ""}`, {
        data: { events: transformedBody.events.length }
      });
      return false;
    }
    if (this.apiUrl?.includes(SpecialApiUrl.Localhost)) {
      log("debug", `Success mode: simulating successful send${this.integrationId ? ` [${this.integrationId}]` : ""}`, {
        data: { events: transformedBody.events.length }
      });
      return true;
    }
    const { url, payload } = this.prepareRequest(transformedBody);
    for (let attempt = 1; attempt <= MAX_SEND_RETRIES + 1; attempt++) {
      try {
        const response = await this.sendWithTimeout(url, payload);
        if (response.ok) {
          if (attempt > 1) {
            log(
              "info",
              `Send succeeded after ${attempt - 1} retry attempt(s)${this.integrationId ? ` [${this.integrationId}]` : ""}`,
              {
                data: { events: transformedBody.events.length, attempt }
              }
            );
          }
          return true;
        }
        return false;
      } catch (error) {
        const isLastAttempt = attempt === MAX_SEND_RETRIES + 1;
        if (error instanceof PermanentError) {
          throw error;
        }
        log(
          isLastAttempt ? "error" : "warn",
          `Send attempt ${attempt} failed${this.integrationId ? ` [${this.integrationId}]` : ""}${isLastAttempt ? " (all retries exhausted)" : ", will retry"}`,
          {
            error,
            data: {
              events: body.events.length,
              url: url.replace(/\/\/[^/]+/, "//[DOMAIN]"),
              attempt,
              maxAttempts: MAX_SEND_RETRIES + 1
            }
          }
        );
        if (!isLastAttempt) {
          await this.backoffDelay(attempt);
          continue;
        }
        return false;
      }
    }
    return false;
  }
  /**
   * Sends HTTP POST request with 10-second timeout and AbortController.
   *
   * **Purpose**: Wraps fetch() with timeout protection to prevent hanging requests.
   * Throws PermanentError for 4xx status codes (except 408, 429) to bypass retries.
   *
   * **Timeout Behavior**:
   * - 10-second timeout via AbortController (REQUEST_TIMEOUT_MS constant)
   * - Aborted requests throw network error (triggers retry in caller)
   *
   * **Error Classification**:
   * - 4xx (except 408, 429): PermanentError thrown → no retries
   * - 408, 429, 5xx, network: Standard Error thrown → triggers retry
   *
   * @param url - API endpoint URL
   * @param payload - JSON-stringified EventsQueue body
   * @returns Response object if successful
   * @throws PermanentError for unrecoverable 4xx errors
   * @throws Error for transient errors (5xx, timeout, network)
   * @private
   */
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
        const isPermanentError = response.status >= 400 && response.status < 500 && response.status !== 408 && response.status !== 429;
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
  /**
   * Internal synchronous send logic using navigator.sendBeacon() for page unload scenarios.
   *
   * **Purpose**: Sends events synchronously during page unload when async fetch() is unreliable.
   * Uses sendBeacon() browser API which queues request even after page closes.
   *
   * **Flow**:
   * 1. Apply beforeSend transformer (per-event transformation)
   * 2. Apply beforeBatch transformer (batch-level transformation)
   * 3. Validate payload size (64KB browser limit for sendBeacon)
   * 4. Send via sendBeacon() or fallback to persistence if unavailable
   * 5. Persist events on failure for next-page-load recovery
   *
   * **Payload Size Limit**: 64KB enforced by browser for sendBeacon()
   * - Oversized payloads persisted instead of silently failing
   *
   * @param body - EventsQueue to send
   * @returns `true` on success or when events persisted for recovery, `false` on failure
   * @private
   */
  sendQueueSyncInternal(body) {
    const afterBeforeSend = this.applyBeforeSendTransformer(body);
    if (!afterBeforeSend) {
      return true;
    }
    const transformedBody = this.applyBeforeBatchTransformer(afterBeforeSend);
    if (!transformedBody) {
      return true;
    }
    const { url, payload } = this.prepareRequest(transformedBody);
    if (payload.length > MAX_BEACON_PAYLOAD_SIZE) {
      log(
        "warn",
        `Payload exceeds sendBeacon limit, persisting for recovery${this.integrationId ? ` [${this.integrationId}]` : ""}`,
        {
          data: {
            size: payload.length,
            limit: MAX_BEACON_PAYLOAD_SIZE,
            events: transformedBody.events.length
          }
        }
      );
      this.persistEvents(transformedBody);
      return false;
    }
    const blob = new Blob([payload], { type: "application/json" });
    if (!this.isSendBeaconAvailable()) {
      log(
        "warn",
        `sendBeacon not available, persisting events for recovery${this.integrationId ? ` [${this.integrationId}]` : ""}`
      );
      this.persistEvents(transformedBody);
      return false;
    }
    const accepted = navigator.sendBeacon(url, blob);
    if (!accepted) {
      log(
        "warn",
        `sendBeacon rejected request, persisting events for recovery${this.integrationId ? ` [${this.integrationId}]` : ""}`
      );
      this.persistEvents(transformedBody);
    }
    return accepted;
  }
  /**
   * Prepares request by enriching payload with metadata and serializing to JSON.
   *
   * **Purpose**: Adds request metadata (referer, timestamp) before transmission.
   *
   * **Metadata Enrichment**:
   * - `referer`: Current page URL (browser only, undefined in Node.js)
   * - `timestamp`: Request generation time in milliseconds
   *
   * @param body - EventsQueue to send
   * @returns Object with `url` (API endpoint) and `payload` (JSON string)
   * @private
   */
  prepareRequest(body) {
    const enrichedBody = {
      ...body,
      _metadata: {
        referer: typeof window !== "undefined" ? window.location.href : void 0,
        timestamp: Date.now()
      }
    };
    return {
      url: this.apiUrl || "",
      payload: JSON.stringify(enrichedBody)
    };
  }
  /**
   * Retrieves persisted events from localStorage with error recovery.
   *
   * **Purpose**: Loads previously failed events from storage for recovery attempt.
   *
   * **Error Handling**:
   * - JSON parse failures logged and storage cleared (corrupted data)
   * - Missing data returns null (no recovery needed)
   *
   * @returns Persisted events object or null if none exist/invalid
   * @private
   */
  getPersistedData() {
    try {
      const storageKey = this.getQueueStorageKey();
      const persistedDataString = this.storeManager.getItem(storageKey);
      if (persistedDataString) {
        return JSON.parse(persistedDataString);
      }
    } catch (error) {
      log("warn", `Failed to parse persisted data${this.integrationId ? ` [${this.integrationId}]` : ""}`, { error });
      this.clearPersistedEvents();
    }
    return null;
  }
  /**
   * Checks if persisted events are within the 2-hour expiry window.
   *
   * **Purpose**: Prevents recovery of stale events that are too old to be relevant.
   *
   * **Expiry Logic**:
   * - Events older than 2 hours (EVENT_EXPIRY_HOURS) are considered expired
   * - Invalid/missing timestamps treated as expired
   *
   * @param data - Persisted events object with timestamp
   * @returns `true` if events are recent (< 2 hours old), `false` otherwise
   * @private
   */
  isDataRecent(data) {
    if (!data.timestamp || typeof data.timestamp !== "number") {
      return false;
    }
    const ageInHours = (Date.now() - data.timestamp) / (1e3 * 60 * 60);
    return ageInHours < EVENT_EXPIRY_HOURS;
  }
  /**
   * Creates EventsQueue from persisted data by removing storage-specific timestamp field.
   *
   * **Purpose**: Converts PersistedEventsQueue (with timestamp) to EventsQueue for sending.
   *
   * @param data - Persisted events with timestamp
   * @returns EventsQueue ready for transmission (timestamp removed)
   * @private
   */
  createRecoveryBody(data) {
    const { timestamp, ...queue } = data;
    return queue;
  }
  /**
   * Persists failed events to localStorage for next-page-load recovery.
   *
   * **Purpose**: Saves events that couldn't be sent due to network/server errors.
   * Implements multi-tab protection to prevent data loss during simultaneous failures.
   *
   * **Multi-Tab Protection**:
   * - Throttles persistence (1-second window via PERSISTENCE_THROTTLE_MS)
   * - If another tab persisted within 1 second, skips write (last-write-wins)
   * - Prevents redundant storage writes when multiple tabs fail together
   *
   * **Storage Format**: PersistedEventsQueue (EventsQueue + timestamp)
   *
   * @param body - EventsQueue to persist
   * @returns `true` on successful persistence or throttled write, `false` on error
   * @private
   */
  persistEvents(body) {
    try {
      const existing = this.getPersistedData();
      if (existing && existing.timestamp) {
        const timeSinceExisting = Date.now() - existing.timestamp;
        if (timeSinceExisting < PERSISTENCE_THROTTLE_MS) {
          log(
            "debug",
            `Skipping persistence, another tab recently persisted events${this.integrationId ? ` [${this.integrationId}]` : ""}`,
            {
              data: { timeSinceExisting }
            }
          );
          return true;
        }
      }
      const persistedData = {
        ...body,
        timestamp: Date.now()
      };
      const storageKey = this.getQueueStorageKey();
      this.storeManager.setItem(storageKey, JSON.stringify(persistedData));
      return !!this.storeManager.getItem(storageKey);
    } catch (error) {
      log("warn", `Failed to persist events${this.integrationId ? ` [${this.integrationId}]` : ""}`, { error });
      return false;
    }
  }
  clearPersistedEvents() {
    try {
      const key = this.getQueueStorageKey();
      this.storeManager.removeItem(key);
    } catch (error) {
      log("warn", `Failed to clear persisted events${this.integrationId ? ` [${this.integrationId}]` : ""}`, { error });
    }
  }
  shouldSkipSend() {
    return !this.apiUrl;
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
      log("error", `${context}${this.integrationId ? ` [${this.integrationId}]` : ""}`, {
        data: { status: error.statusCode, message: error.message }
      });
      this.lastPermanentErrorLog = { statusCode: error.statusCode, timestamp: now };
    }
  }
}
class EventManager extends StateManager {
  dataSenders;
  emitter;
  transformers;
  recentEventFingerprints = /* @__PURE__ */ new Map();
  perEventRateLimits = /* @__PURE__ */ new Map();
  eventsQueue = [];
  pendingEventsBuffer = [];
  sendIntervalId = null;
  rateLimitCounter = 0;
  rateLimitWindowStart = 0;
  lastSessionId = null;
  sessionEventCounts = {
    total: 0,
    [EventType.CLICK]: 0,
    [EventType.PAGE_VIEW]: 0,
    [EventType.CUSTOM]: 0,
    [EventType.VIEWPORT_VISIBLE]: 0,
    [EventType.SCROLL]: 0
  };
  /**
   * Creates an EventManager instance.
   *
   * **Initialization**:
   * - Creates SenderManager instances for configured integrations (SaaS/Custom)
   * - Initializes event emitter for local consumption
   *
   * @param storeManager - Storage manager for persistence
   * @param emitter - Optional event emitter for local event consumption
   * @param transformers - Optional event transformation hooks
   */
  constructor(storeManager, emitter = null, transformers = {}) {
    super();
    this.emitter = emitter;
    this.transformers = transformers;
    this.dataSenders = [];
    const collectApiUrls = this.get("collectApiUrls");
    if (collectApiUrls?.saas) {
      this.dataSenders.push(new SenderManager(storeManager, "saas", collectApiUrls.saas, transformers));
    }
    if (collectApiUrls?.custom) {
      this.dataSenders.push(new SenderManager(storeManager, "custom", collectApiUrls.custom, transformers));
    }
  }
  /**
   * Recovers persisted events from localStorage after a crash or page reload.
   *
   * **Purpose**: Ensures zero data loss by recovering events that failed to send
   * in the previous session due to network errors or crashes.
   *
   * **Flow**:
   * 1. Calls `recoverPersistedEvents()` on all SenderManager instances in parallel
   * 2. Each SenderManager attempts to resend its persisted events to backend
   * 3. On success: Removes recovered events from consent/pending buffers
   * 4. On failure: Logs warning (events remain in localStorage for next attempt)
   *
   * **Multi-Integration**:
   * - Independent recovery per integration (SaaS + Custom backends)
   * - Parallel recovery via `Promise.allSettled()` (one failure doesn't block others)
   * - No cross-contamination (SaaS events don't go to Custom API)
   *
   * **Called by**: `App.init()` after initialization
   *
   * **Important**: Events are NOT removed from pending/consent buffers until
   * successful network transmission.
   *
   * @see src/managers/README.md (lines 5-75) for recovery details
   */
  async recoverPersistedEvents() {
    const recoveryPromises = this.dataSenders.map(
      async (sender) => sender.recoverPersistedEvents({
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
      })
    );
    await Promise.allSettled(recoveryPromises);
  }
  /**
   * Tracks a user interaction event and adds it to the event queue.
   *
   * **Purpose**: Central tracking method for all analytics events (clicks, page views,
   * custom events, web vitals, errors, scroll, viewport visibility, session start/end).
   *
   * **Validation & Buffering**:
   * - Validates `type` is provided (required)
   * - If session not initialized: Buffers in `pendingEventsBuffer` (max 100 events, FIFO)
   *
   * **Rate Limiting** (non-critical events only):
   * - Global: 50 events/second sliding window (critical events exempted)
   * - Per-event-name: 60/minute for custom events (configurable via `maxSameEventPerMinute`)
   * - Per-session total: 1000 events max
   * - Per-session by type: Clicks 500, Page views 100, Custom 500, Viewport 200, Scroll 120
   *
   * **Deduplication**:
   * - LRU cache with 1000 fingerprints (10px coordinate precision for clicks, 500ms time threshold)
   * - Prevents duplicate events within 500ms window
   * - SESSION_START protected by `hasStartSession` flag
   *
   * **Sampling**:
   * - Applied after validation and rate limiting
   * - Critical events (SESSION_START/END) always included
   * - Configurable via `samplingRate` (0-1)
   *
   * **Transformation**:
   * - `beforeSend` applied (if custom-only mode) before dedup/sampling/queueing
   * - Returning `null` from `beforeSend` filters out the event
   *
   * **Queue Management**:
   * - Events added to `eventsQueue` (max 100 events, FIFO with priority for session events)
   * - Dynamic flush: Immediate send when 50-event batch threshold reached
   * - Periodic flush: Every 10 seconds
   *
   * **Multi-Integration**:
   * - Backend integrations: Handled by SenderManager instances
   *
   * **QA Mode**:
   * - Custom events logged to console with styling
   * - Events NOT sent to backend (emitted locally only)
   *
   * @param eventData - Event data to track
   *
   * @example
   * ```typescript
   * eventManager.track({
   *   type: EventType.CLICK,
   *   click_data: { x: 0.5, y: 0.3, tag: 'button', text: 'Submit' }
   * });
   *
   * eventManager.track({
   *   type: EventType.CUSTOM,
   *   custom_event: { name: 'checkout_completed', metadata: { total: 99.99 } }
   * });
   * ```
   *
   * @see src/managers/README.md (lines 5-75) for detailed tracking logic
   */
  track({
    type,
    page_url,
    from_page_url,
    scroll_data,
    click_data,
    custom_event,
    web_vitals,
    error_data,
    session_end_reason,
    viewport_data
  }) {
    if (!type) {
      log("error", "Event type is required - event will be ignored");
      return;
    }
    const currentSessionId = this.get("sessionId");
    if (!currentSessionId) {
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
        session_end_reason,
        viewport_data
      });
      return;
    }
    if (this.lastSessionId !== currentSessionId) {
      this.lastSessionId = currentSessionId;
      this.sessionEventCounts = {
        total: 0,
        [EventType.CLICK]: 0,
        [EventType.PAGE_VIEW]: 0,
        [EventType.CUSTOM]: 0,
        [EventType.VIEWPORT_VISIBLE]: 0,
        [EventType.SCROLL]: 0
      };
    }
    const isCriticalEvent = type === EventType.SESSION_START || type === EventType.SESSION_END;
    if (!isCriticalEvent && !this.checkRateLimit()) {
      return;
    }
    const eventType = type;
    if (!isCriticalEvent) {
      if (this.sessionEventCounts.total >= MAX_EVENTS_PER_SESSION) {
        log("warn", "Session event limit reached", {
          data: {
            type: eventType,
            total: this.sessionEventCounts.total,
            limit: MAX_EVENTS_PER_SESSION
          }
        });
        return;
      }
      const typeLimit = this.getTypeLimitForEvent(eventType);
      if (typeLimit) {
        const currentCount = this.sessionEventCounts[eventType];
        if (currentCount !== void 0 && currentCount >= typeLimit) {
          log("warn", "Session event type limit reached", {
            data: {
              type: eventType,
              count: currentCount,
              limit: typeLimit
            }
          });
          return;
        }
      }
    }
    if (eventType === EventType.CUSTOM && custom_event?.name) {
      const maxSameEventPerMinute = this.get("config")?.maxSameEventPerMinute ?? MAX_SAME_EVENT_PER_MINUTE;
      if (!this.checkPerEventRateLimit(custom_event.name, maxSameEventPerMinute)) {
        return;
      }
    }
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
      session_end_reason,
      viewport_data
    });
    if (!payload) {
      return;
    }
    if (!isCriticalEvent && !this.shouldSample()) {
      return;
    }
    if (isSessionStart) {
      const currentSessionId2 = this.get("sessionId");
      if (!currentSessionId2) {
        log("error", "Session start event requires sessionId - event will be ignored");
        return;
      }
      if (this.get("hasStartSession")) {
        log("warn", "Duplicate session_start detected", {
          data: { sessionId: currentSessionId2 }
        });
        return;
      }
      this.set("hasStartSession", true);
    }
    if (this.isDuplicateEvent(payload)) {
      return;
    }
    if (this.get("mode") === Mode.QA && eventType === EventType.CUSTOM && custom_event) {
      log("info", `Custom Event: ${custom_event.name}`, {
        showToClient: true,
        data: {
          name: custom_event.name,
          ...custom_event.metadata && { metadata: custom_event.metadata }
        }
      });
      this.emitEvent(payload);
      return;
    }
    this.addToQueue(payload);
    if (!isCriticalEvent) {
      this.sessionEventCounts.total++;
      if (this.sessionEventCounts[eventType] !== void 0) {
        this.sessionEventCounts[eventType]++;
      }
    }
  }
  /**
   * Stops event tracking and clears all queues and buffers.
   *
   * **Purpose**: Cleanup method called during `App.destroy()` to reset EventManager state
   * and allow subsequent init() → destroy() → init() cycles.
   *
   * **Cleanup Actions**:
   * 1. **Clear send interval**: Stops periodic 10-second queue flush timer
   * 2. **Clear all queues and buffers**:
   *    - `eventsQueue`: Discarded (not sent)
   *    - `pendingEventsBuffer`: Discarded (events before session init)
   * 3. **Reset rate limiting state**: Clears rate limit counters and per-event limits
   * 4. **Reset session counters**: Clears per-session event counts
   * 5. **Reset `hasStartSession` flag**: Allows SESSION_START in next init cycle
   * 6. **Stop SenderManagers**: Calls `stop()` on all SenderManager instances
   *
   * **Important Behavior**:
   * - **No final flush**: Events in queue are NOT sent before stopping
   * - For flush before destroy, call `flushImmediatelySync()` first
   *
   * **Multi-Integration**:
   * - Stops all SenderManager instances (SaaS + Custom)
   *
   * **Called by**: `App.destroy()` during application teardown
   *
   * @example
   * ```typescript
   * // Proper cleanup with final flush
   * eventManager.flushImmediatelySync(); // Send pending events
   * eventManager.stop();                  // Stop and clear
   * ```
   *
   * @see src/managers/README.md (lines 5-75) for cleanup details
   */
  stop() {
    if (this.sendIntervalId) {
      clearInterval(this.sendIntervalId);
      this.sendIntervalId = null;
    }
    this.eventsQueue = [];
    this.pendingEventsBuffer = [];
    this.recentEventFingerprints.clear();
    this.rateLimitCounter = 0;
    this.rateLimitWindowStart = 0;
    this.perEventRateLimits.clear();
    this.sessionEventCounts = {
      total: 0,
      [EventType.CLICK]: 0,
      [EventType.PAGE_VIEW]: 0,
      [EventType.CUSTOM]: 0,
      [EventType.VIEWPORT_VISIBLE]: 0,
      [EventType.SCROLL]: 0
    };
    this.lastSessionId = null;
    this.set("hasStartSession", false);
    this.dataSenders.forEach((sender) => {
      sender.stop();
    });
  }
  /**
   * Flushes all events in the queue asynchronously.
   *
   * **Purpose**: Force immediate sending of queued events without waiting for
   * the 10-second periodic flush timer.
   *
   * **Use Cases**:
   * - Manual flush triggered by user action
   * - Before page unload (prefer `flushImmediatelySync()` for unload scenarios)
   * - Testing/debugging
   *
   * **Behavior**:
   * - Sends events via `fetch()` API (async, reliable, allows retries)
   * - Multi-integration: Sends to all configured backends in parallel
   * - Does NOT block (returns Promise that resolves when all sends complete)
   * - Clears queue only after successful transmission
   *
   * **Note**: For page unload, use `flushImmediatelySync()` instead,
   * which uses `sendBeacon()` for guaranteed delivery.
   *
   * @returns Promise resolving to `true` if all sends succeeded, `false` if any failed
   *
   * @example
   * ```typescript
   * // Before critical user action
   * await eventManager.flushImmediately();
   * ```
   *
   * @see flushImmediatelySync for synchronous page unload flush
   * @see src/managers/README.md (lines 5-75) for flush details
   */
  async flushImmediately() {
    return this.flushEvents(false);
  }
  /**
   * Flushes all events in the queue synchronously using `sendBeacon()`.
   *
   * **Purpose**: Ensure events are sent before page unload, even if network is slow.
   *
   * **Use Cases**:
   * - Page unload (`beforeunload`, `pagehide` events)
   * - Tab close detection
   * - Any scenario where async flush might be interrupted
   *
   * **Behavior**:
   * - Uses `navigator.sendBeacon()` API (synchronous, queued by browser)
   * - Payload size limited to 64KB per beacon
   * - Browser guarantees delivery attempt (queued even if page closes)
   * - Clears queue immediately (no retry mechanism)
   *
   * **Multi-Integration**:
   * - Sends to all configured backends (SaaS + Custom) in parallel
   * - Independent success tracking per integration
   *
   * **Limitations**:
   * - No retry on failure (sendBeacon is fire-and-forget)
   * - 64KB payload limit (large batches may be truncated)
   *
   * @returns `true` if all sends succeeded, `false` if any failed
   *
   * @example
   * ```typescript
   * // Page unload handler
   * window.addEventListener('beforeunload', () => {
   *   eventManager.flushImmediatelySync();
   * });
   * ```
   *
   * @see flushImmediately for async flush with retries
   * @see src/managers/README.md (lines 5-75) for flush details
   */
  flushImmediatelySync() {
    return this.flushEvents(true);
  }
  /**
   * Returns the current number of events in the main queue.
   *
   * **Purpose**: Debugging and monitoring utility to check queue length.
   *
   * **Note**: This does NOT include:
   * - Pending events buffer (events before session init)
   * - Consent events buffer (events awaiting consent)
   * - Persisted events (events in localStorage from previous sessions)
   *
   * @returns Number of events currently in the main queue
   *
   * @example
   * ```typescript
   * const queueSize = eventManager.getQueueLength();
   * console.log(`Queue has ${queueSize} events`);
   * ```
   */
  getQueueLength() {
    return this.eventsQueue.length;
  }
  /**
   * Returns a copy of current events in the queue.
   *
   * **Purpose**: Test utility to inspect queued events for validation.
   *
   * **Note**: Only available in development mode via TestBridge.
   *
   * @returns Shallow copy of events queue
   * @internal Used by test-bridge.ts for test inspection
   */
  getQueueEvents() {
    return [...this.eventsQueue];
  }
  /**
   * Triggers immediate queue flush (test utility).
   *
   * **Purpose**: Test utility to manually flush event queue for validation.
   *
   * **Note**: Only available in development mode via TestBridge.
   *
   * @returns Promise that resolves when flush completes
   * @internal Used by test-bridge.ts for test control
   */
  async flushQueue() {
    await this.flushImmediately();
  }
  /**
   * Clears the event queue (test utility - use with caution).
   *
   * **Purpose**: Test utility to reset queue state between tests.
   *
   * **Warning**: This will discard all queued events without sending them.
   * Only use in test cleanup or when explicitly required.
   *
   * **Note**: Only available in development mode via TestBridge.
   *
   * @internal Used by test-bridge.ts for test cleanup
   */
  clearQueue() {
    this.eventsQueue = [];
  }
  /**
   * Flushes buffered events to the main queue after session initialization.
   *
   * **Purpose**: Re-tracks events that were captured before session initialization
   * (e.g., events fired during `App.init()` before SessionManager completes).
   *
   * **Pending Events Buffer**:
   * - Holds up to 100 events captured before `sessionId` is available
   * - FIFO eviction when buffer full (oldest events dropped with warning)
   * - Cleared and re-tracked when session becomes available
   *
   * **Flow**:
   * 1. Check if session is initialized (`sessionId` exists in global state)
   * 2. If not initialized: Log warning and keep events in buffer
   * 3. If initialized: Copy buffer, clear it, and re-track each event via `track()`
   * 4. Each event goes through full validation/dedup/rate limiting pipeline
   *
   * **Called by**:
   * - `SessionManager.startTracking()` after session initialization
   * - Ensures no events are lost during initialization phase
   *
   * **Important**: Events are re-tracked through `track()` method, so they go
   * through all validation, deduplication, rate limiting, and consent checks again.
   *
   * @example
   * ```typescript
   * // In SessionManager after session creation
   * this.set('sessionId', newSessionId);
   * eventManager.flushPendingEvents(); // Re-track buffered events
   * ```
   *
   * @see src/managers/README.md (lines 5-75) for pending buffer details
   */
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
  isSuccessfulResult(result) {
    return result.status === "fulfilled" && result.value === true;
  }
  flushEvents(isSync) {
    if (this.eventsQueue.length === 0) {
      return isSync ? true : Promise.resolve(true);
    }
    const body = this.buildEventsPayload();
    const eventsToSend = [...this.eventsQueue];
    const eventIds = eventsToSend.map((e3) => e3.id);
    if (this.dataSenders.length === 0) {
      this.removeProcessedEvents(eventIds);
      this.clearSendInterval();
      this.emitEventsQueue(body);
      return isSync ? true : Promise.resolve(true);
    }
    if (isSync) {
      const results = this.dataSenders.map((sender) => sender.sendEventsQueueSync(body));
      const anySucceeded = results.some((success) => success);
      if (anySucceeded) {
        this.removeProcessedEvents(eventIds);
        this.clearSendInterval();
        this.emitEventsQueue(body);
      } else {
        this.clearSendInterval();
        log("warn", "Sync flush failed for all integrations, events remain in queue for next flush", {
          data: { eventCount: eventIds.length }
        });
      }
      return anySucceeded;
    } else {
      const sendPromises = this.dataSenders.map(
        async (sender) => sender.sendEventsQueue(body, {
          onSuccess: () => {
          },
          onFailure: () => {
          }
        })
      );
      return Promise.allSettled(sendPromises).then((results) => {
        const anySucceeded = results.some((result) => this.isSuccessfulResult(result));
        if (anySucceeded) {
          this.removeProcessedEvents(eventIds);
          this.clearSendInterval();
          this.emitEventsQueue(body);
          const failedCount = results.filter((result) => !this.isSuccessfulResult(result)).length;
          if (failedCount > 0) {
            log(
              "warn",
              "Async flush completed with partial success, events removed from queue and persisted per failed integration",
              {
                data: { eventCount: eventsToSend.length, succeededCount: results.length - failedCount, failedCount }
              }
            );
          }
        } else {
          this.removeProcessedEvents(eventIds);
          this.clearSendInterval();
          log("error", "Async flush failed for all integrations, events persisted per-integration for recovery", {
            data: { eventCount: eventsToSend.length, integrations: this.dataSenders.length }
          });
        }
        return anySucceeded;
      });
    }
  }
  async sendEventsQueue() {
    if (!this.get("sessionId") || this.eventsQueue.length === 0) {
      return;
    }
    const body = this.buildEventsPayload();
    if (this.dataSenders.length === 0) {
      this.emitEventsQueue(body);
      return;
    }
    const eventsToSend = [...this.eventsQueue];
    const eventIds = eventsToSend.map((e3) => e3.id);
    const sendPromises = this.dataSenders.map(
      async (sender) => sender.sendEventsQueue(body, {
        onSuccess: () => {
        },
        onFailure: () => {
        }
      })
    );
    const results = await Promise.allSettled(sendPromises);
    this.removeProcessedEvents(eventIds);
    const anySucceeded = results.some((result) => this.isSuccessfulResult(result));
    if (anySucceeded) {
      this.emitEventsQueue(body);
    }
    if (this.eventsQueue.length === 0) {
      this.clearSendInterval();
    }
    const failedCount = results.filter((result) => !this.isSuccessfulResult(result)).length;
    if (failedCount > 0) {
      log("warn", "Events send completed with some failures, removed from queue and persisted per-integration", {
        data: { eventCount: eventsToSend.length, failedCount }
      });
    }
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
    let queue = {
      user_id: this.get("userId"),
      session_id: this.get("sessionId"),
      device: this.get("device"),
      events,
      ...this.get("config")?.globalMetadata && { global_metadata: this.get("config")?.globalMetadata }
    };
    const collectApiUrls = this.get("collectApiUrls");
    const hasAnyBackend = Boolean(collectApiUrls?.custom || collectApiUrls?.saas);
    const beforeBatchTransformer = this.transformers.beforeBatch;
    if (!hasAnyBackend && beforeBatchTransformer) {
      const transformed = transformBatch(queue, beforeBatchTransformer, "EventManager");
      if (transformed !== null) {
        queue = transformed;
      }
    }
    return queue;
  }
  buildEventPayload(data) {
    const isSessionStart = data.type === EventType.SESSION_START;
    const currentPageUrl = data.page_url ?? this.get("pageUrl");
    let payload = {
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
      ...data.viewport_data && { viewport_data: data.viewport_data },
      ...isSessionStart && getUTMParameters() && { utm: getUTMParameters() }
    };
    const collectApiUrls = this.get("collectApiUrls");
    const hasCustomBackend = Boolean(collectApiUrls?.custom);
    const hasSaasBackend = Boolean(collectApiUrls?.saas);
    const hasAnyBackend = hasCustomBackend || hasSaasBackend;
    const isMultiIntegration = hasCustomBackend && hasSaasBackend;
    const beforeSendTransformer = this.transformers.beforeSend;
    const shouldApplyBeforeSend = beforeSendTransformer && (!hasAnyBackend || hasCustomBackend && !isMultiIntegration);
    if (shouldApplyBeforeSend) {
      const transformed = transformEvent(payload, beforeSendTransformer, "EventManager");
      if (transformed === null) {
        return null;
      }
      payload = transformed;
    }
    return payload;
  }
  isDuplicateEvent(event2) {
    const now = Date.now();
    const fingerprint = this.createEventFingerprint(event2);
    const lastSeen = this.recentEventFingerprints.get(fingerprint);
    if (lastSeen && now - lastSeen < DUPLICATE_EVENT_THRESHOLD_MS) {
      this.recentEventFingerprints.set(fingerprint, now);
      return true;
    }
    this.recentEventFingerprints.set(fingerprint, now);
    if (this.recentEventFingerprints.size > MAX_FINGERPRINTS) {
      this.pruneOldFingerprints();
    }
    if (this.recentEventFingerprints.size > MAX_FINGERPRINTS_HARD_LIMIT) {
      this.recentEventFingerprints.clear();
      this.recentEventFingerprints.set(fingerprint, now);
      log("warn", "Event fingerprint cache exceeded hard limit, cleared", {
        data: { hardLimit: MAX_FINGERPRINTS_HARD_LIMIT }
      });
    }
    return false;
  }
  pruneOldFingerprints() {
    const now = Date.now();
    const cutoff = DUPLICATE_EVENT_THRESHOLD_MS * FINGERPRINT_CLEANUP_MULTIPLIER;
    for (const [fingerprint, timestamp] of this.recentEventFingerprints.entries()) {
      if (now - timestamp > cutoff) {
        this.recentEventFingerprints.delete(fingerprint);
      }
    }
    log("debug", "Pruned old event fingerprints", {
      data: {
        remaining: this.recentEventFingerprints.size,
        cutoffMs: cutoff
      }
    });
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
    this.emitEvent(event2);
    this.eventsQueue.push(event2);
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
    if (this.eventsQueue.length >= BATCH_SIZE_THRESHOLD) {
      void this.sendEventsQueue();
    }
  }
  startSendInterval() {
    this.sendIntervalId = window.setInterval(() => {
      if (this.eventsQueue.length > 0) {
        void this.sendEventsQueue();
      }
    }, EVENT_SENT_INTERVAL_MS);
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
  checkPerEventRateLimit(eventName, maxSameEventPerMinute) {
    const now = Date.now();
    const timestamps = this.perEventRateLimits.get(eventName) ?? [];
    const validTimestamps = timestamps.filter((ts) => now - ts < PER_EVENT_RATE_LIMIT_WINDOW_MS);
    if (validTimestamps.length >= maxSameEventPerMinute) {
      log("warn", "Per-event rate limit exceeded for custom event", {
        data: {
          eventName,
          limit: maxSameEventPerMinute,
          window: `${PER_EVENT_RATE_LIMIT_WINDOW_MS / 1e3}s`
        }
      });
      return false;
    }
    validTimestamps.push(now);
    this.perEventRateLimits.set(eventName, validTimestamps);
    return true;
  }
  getTypeLimitForEvent(type) {
    const limits = {
      [EventType.CLICK]: MAX_CLICKS_PER_SESSION,
      [EventType.PAGE_VIEW]: MAX_PAGE_VIEWS_PER_SESSION,
      [EventType.CUSTOM]: MAX_CUSTOM_EVENTS_PER_SESSION,
      [EventType.VIEWPORT_VISIBLE]: MAX_VIEWPORT_EVENTS_PER_SESSION,
      [EventType.SCROLL]: MAX_SCROLL_EVENTS_PER_SESSION
    };
    return limits[type] ?? null;
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
   * Gets or creates a unique user ID.
   *
   * **Behavior**:
   * 1. Checks localStorage for existing user ID
   * 2. Returns existing ID if found
   * 3. Generates new RFC4122-compliant UUID v4 if not found
   * 4. Persists new ID to localStorage
   *
   * **Storage Key**: `tlog:uid` (fixed, shared across all TraceLog projects)
   *
   * **ID Format**: UUID v4 (e.g., `550e8400-e29b-41d4-a716-446655440000`)
   *
   * @param storageManager - Storage manager instance for persistence
   * @returns Persistent unique user ID (UUID v4 format)
   */
  static getId(storageManager) {
    const storedUserId = storageManager.getItem(USER_ID_KEY);
    if (storedUserId) {
      return storedUserId;
    }
    const newUserId = generateUUID();
    storageManager.setItem(USER_ID_KEY, newUserId);
    return newUserId;
  }
}
class SessionManager extends StateManager {
  storageManager;
  eventManager;
  projectId;
  activityHandler = null;
  visibilityChangeHandler = null;
  pageHideHandler = null;
  sessionTimeoutId = null;
  broadcastChannel = null;
  isTracking = false;
  isEnding = false;
  hasEndedSession = false;
  /**
   * Creates a SessionManager instance.
   *
   * @param storageManager - Storage manager for session persistence
   * @param eventManager - Event manager for SESSION_START/SESSION_END events
   * @param projectId - Project identifier for namespacing session storage
   */
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
  /**
   * Starts session tracking with lifecycle management and cross-tab synchronization.
   *
   * **Purpose**: Initializes session tracking, creating or recovering a session ID,
   * setting up activity listeners, and enabling cross-tab synchronization.
   *
   * **Flow**:
   * 1. Checks if tracking already active (idempotent)
   * 2. Attempts to recover session from localStorage
   * 3. If no recovery: Generates new session ID (`{timestamp}-{9-char-base36}`)
   * 4. Sets `sessionId` in global state
   * 5. Persists session to localStorage
   * 6. Initializes BroadcastChannel for cross-tab sync (BEFORE SESSION_START)
   * 7. Shares session via BroadcastChannel (notifies other tabs)
   * 8. If NOT recovered: Tracks SESSION_START event
   * 9. Sets up inactivity timeout (default 15 minutes)
   * 10. Sets up activity listeners (click, keydown, scroll)
   * 11. Sets up lifecycle listeners (visibilitychange, beforeunload)
   *
   * **Session Recovery**:
   * - Checks localStorage for existing session
   * - Recovers if session exists and is recent (within timeout window)
   * - NO SESSION_START event if session recovered
   *
   * **Error Handling**:
   * - On error: Rolls back all setup (cleanup listeners, timers, state)
   * - Re-throws error to caller (App.init() handles failure)
   *
   * **BroadcastChannel Initialization Order**:
   * - CRITICAL: BroadcastChannel initialized BEFORE SESSION_START event
   * - Prevents race condition with secondary tabs
   * - Ensures secondary tabs can receive session_start message
   *
   * **Called by**: `SessionHandler.startTracking()` during `App.init()`
   *
   * **Important**: After successful call, `sessionId` is available in global state
   * and EventManager can flush pending events via `flushPendingEvents()`.
   *
   * @throws Error if initialization fails (rolled back automatically)
   *
   * @example
   * ```typescript
   * sessionManager.startTracking();
   * // → Session created: '1704896400000-a3b4c5d6e'
   * // → SESSION_START event tracked
   * // → Activity listeners active
   * // → Cross-tab sync enabled
   * ```
   *
   * @see src/managers/README.md (lines 140-169) for session management details
   */
  startTracking() {
    if (this.isTracking) {
      log("warn", "Session tracking already active");
      return;
    }
    const recoveredSessionId = this.recoverSession();
    const sessionId = recoveredSessionId ?? this.generateSessionId();
    const isRecovered = Boolean(recoveredSessionId);
    this.isTracking = true;
    this.hasEndedSession = false;
    try {
      this.set("sessionId", sessionId);
      this.persistSession(sessionId);
      this.initCrossTabSync();
      this.shareSession(sessionId);
      if (!isRecovered) {
        this.eventManager.track({
          type: EventType.SESSION_START
        });
      }
      this.setupSessionTimeout();
      this.setupActivityListeners();
      this.setupLifecycleListeners();
    } catch (error) {
      this.isTracking = false;
      this.hasEndedSession = false;
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
    if (this.visibilityChangeHandler || this.pageHideHandler) {
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
    this.pageHideHandler = (event2) => {
      if (!event2.persisted) {
        this.endSession("page_unload");
      }
    };
    document.addEventListener("visibilitychange", this.visibilityChangeHandler);
    window.addEventListener("pagehide", this.pageHideHandler);
  }
  cleanupLifecycleListeners() {
    if (this.visibilityChangeHandler) {
      document.removeEventListener("visibilitychange", this.visibilityChangeHandler);
      this.visibilityChangeHandler = null;
    }
    if (this.pageHideHandler) {
      window.removeEventListener("pagehide", this.pageHideHandler);
      this.pageHideHandler = null;
    }
  }
  endSession(reason) {
    if (this.isEnding || this.hasEndedSession) {
      return;
    }
    const sessionId = this.get("sessionId");
    if (!sessionId) {
      log("warn", "endSession called without active session", { data: { reason } });
      this.resetSessionState(reason);
      return;
    }
    this.isEnding = true;
    this.hasEndedSession = true;
    try {
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
    } finally {
      this.isEnding = false;
    }
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
  /**
   * Stops session tracking and ends the current session.
   *
   * **Purpose**: Manually ends the current session, tracking SESSION_END event
   * and cleaning up all listeners and timers.
   *
   * **Flow**:
   * 1. Calls `endSession('manual_stop')` internally
   * 2. Tracks SESSION_END event (reason: 'manual_stop')
   * 3. Broadcasts session_end via BroadcastChannel (notifies other tabs)
   * 4. Clears inactivity timeout
   * 5. Cleans up activity listeners
   * 6. Cleans up lifecycle listeners
   * 7. Cleans up BroadcastChannel
   * 8. Clears session from localStorage
   * 9. Resets `sessionId` and `hasStartSession` in global state
   * 10. Sets `isTracking` to false
   *
   * **State Guard**:
   * - `isEnding` flag prevents duplicate SESSION_END events
   * - Try-finally ensures cleanup even if error occurs
   *
   * **Called by**: `App.destroy()` during application teardown
   *
   * **Important**: After calling, session is terminated and cannot be resumed.
   * New session will be created on next `startTracking()` call.
   *
   * @example
   * ```typescript
   * // Manual session end
   * sessionManager.stopTracking();
   * // → SESSION_END event tracked (reason: 'manual_stop')
   * // → All listeners cleaned up
   * // → Session cleared from localStorage
   * // → Other tabs notified via BroadcastChannel
   * ```
   *
   * @see src/managers/README.md (lines 140-169) for session management details
   */
  stopTracking() {
    this.endSession("manual_stop");
  }
  /**
   * Destroys the session manager and cleans up all resources.
   *
   * **Purpose**: Performs deep cleanup of session manager resources without
   * tracking SESSION_END event. Used during application teardown.
   *
   * **Differences from stopTracking()**:
   * - Does NOT track SESSION_END event
   * - Does NOT broadcast session end to other tabs
   * - Does NOT clear localStorage (preserves session for recovery)
   * - Used for internal cleanup, not user-initiated session end
   *
   * **Cleanup Flow**:
   * 1. Clears inactivity timeout
   * 2. Removes activity listeners (click, keydown, scroll)
   * 3. Closes BroadcastChannel
   * 4. Removes lifecycle listeners (visibilitychange, beforeunload)
   * 5. Resets tracking flags (`isTracking`, `hasStartSession`)
   *
   * **Called by**: `App.destroy()` during application teardown
   *
   * @returns void
   *
   * @example
   * ```typescript
   * sessionManager.destroy();
   * // → All resources cleaned up
   * // → NO SESSION_END event tracked
   * // → Session preserved in localStorage for recovery
   * ```
   */
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
  /**
   * Starts session tracking by creating SessionManager and initializing session.
   *
   * **Behavior**:
   * - Extracts projectId from config (tracelog projectId or custom collectApiUrl or 'default')
   * - Creates SessionManager instance with storage, event manager, and projectId
   * - Calls SessionManager.startTracking() to begin session lifecycle
   * - Flushes pending events buffered during initialization
   * - Idempotent: Early return if session already active
   * - Validates state: Warns and returns if handler destroyed
   *
   * **Error Handling**:
   * - On failure: Automatically cleans up SessionManager via nested try-catch
   * - Leaves handler in clean, reusable state after error
   * - Re-throws error after logging
   *
   * @throws {Error} If SessionManager initialization fails
   */
  startTracking() {
    if (this.isActive()) {
      return;
    }
    if (this.destroyed) {
      log("warn", "Cannot start tracking on destroyed handler");
      return;
    }
    const config = this.get("config");
    const projectId = config?.integrations?.tracelog?.projectId ?? "custom";
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
  /**
   * Stops session tracking by ending current session and cleaning up resources.
   *
   * Calls SessionManager.stopTracking() to end session (sends SESSION_END event),
   * then calls SessionManager.destroy() to clean up listeners and state.
   *
   * **Difference from destroy()**: This method ends the session gracefully with
   * a SESSION_END event before cleanup. Use destroy() for cleanup without session end.
   */
  stopTracking() {
    this.cleanupSessionManager();
  }
  /**
   * Destroys handler and cleans up SessionManager without ending session.
   *
   * **Behavior**:
   * - Idempotent: Early return if already destroyed
   * - Calls SessionManager.destroy() only (NOT stopTracking)
   * - Sets sessionManager to null and destroyed flag to true
   * - Updates hasStartSession global state to false
   *
   * **Difference from stopTracking()**: This method does cleanup only without
   * sending a SESSION_END event. Use stopTracking() for graceful session end.
   */
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
  lastPageViewTime = 0;
  constructor(eventManager, onTrack) {
    super();
    this.eventManager = eventManager;
    this.onTrack = onTrack;
  }
  /**
   * Starts tracking page views.
   *
   * - Tracks initial page load first (via trackInitialPageView)
   * - Attaches popstate and hashchange event listeners
   * - Patches History API methods (pushState, replaceState) for SPA navigation
   * - All setup happens synchronously
   *
   * **Note**: onTrack() callback is invoked AFTER initial page view but BEFORE
   * subsequent navigation events for session management coordination.
   */
  startTracking() {
    this.trackInitialPageView();
    window.addEventListener("popstate", this.trackCurrentPage, true);
    window.addEventListener("hashchange", this.trackCurrentPage, true);
    this.patchHistory("pushState");
    this.patchHistory("replaceState");
  }
  /**
   * Stops tracking page views and restores original History API methods.
   *
   * - Removes event listeners (popstate, hashchange)
   * - Restores original pushState and replaceState methods
   * - Resets throttling state
   */
  stopTracking() {
    window.removeEventListener("popstate", this.trackCurrentPage, true);
    window.removeEventListener("hashchange", this.trackCurrentPage, true);
    if (this.originalPushState) {
      window.history.pushState = this.originalPushState;
    }
    if (this.originalReplaceState) {
      window.history.replaceState = this.originalReplaceState;
    }
    this.lastPageViewTime = 0;
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
    const now = Date.now();
    const throttleMs = this.get("config").pageViewThrottleMs ?? DEFAULT_PAGE_VIEW_THROTTLE_MS;
    if (now - this.lastPageViewTime < throttleMs) {
      return;
    }
    this.lastPageViewTime = now;
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
    this.lastPageViewTime = Date.now();
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
  lastClickTimes = /* @__PURE__ */ new Map();
  clickHandler;
  lastPruneTime = 0;
  constructor(eventManager) {
    super();
    this.eventManager = eventManager;
  }
  /**
   * Starts tracking click events on the document.
   *
   * Attaches a single capture-phase click listener to window that:
   * - Detects interactive elements or falls back to clicked element
   * - Applies click throttling per element (configurable, default 300ms)
   * - Extracts custom tracking data from data-tlog-name attributes
   * - Generates both custom events (for tracked elements) and click events
   * - Respects data-tlog-ignore privacy controls
   * - Sanitizes text content for PII protection
   *
   * Idempotent: Safe to call multiple times (early return if already tracking).
   */
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
      if (this.shouldIgnoreElement(clickedElement)) {
        return;
      }
      const clickThrottleMs = this.get("config")?.clickThrottleMs ?? DEFAULT_CLICK_THROTTLE_MS;
      if (clickThrottleMs > 0 && !this.checkClickThrottle(clickedElement, clickThrottleMs)) {
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
  /**
   * Stops tracking click events and cleans up resources.
   *
   * Removes the click event listener, clears throttle cache, and resets prune timer.
   * Prevents memory leaks by properly cleaning up all state.
   */
  stopTracking() {
    if (this.clickHandler) {
      window.removeEventListener("click", this.clickHandler, true);
      this.clickHandler = void 0;
    }
    this.lastClickTimes.clear();
    this.lastPruneTime = 0;
  }
  shouldIgnoreElement(element) {
    if (element.hasAttribute(`${HTML_DATA_ATTR_PREFIX}-ignore`)) {
      return true;
    }
    const parent = element.closest(`[${HTML_DATA_ATTR_PREFIX}-ignore]`);
    return parent !== null;
  }
  /**
   * Checks per-element click throttling to prevent double-clicks and rapid spam
   * Returns true if the click should be tracked, false if throttled
   */
  checkClickThrottle(element, throttleMs) {
    const signature = this.getElementSignature(element);
    const now = Date.now();
    this.pruneThrottleCache(now);
    const lastClickTime = this.lastClickTimes.get(signature);
    if (lastClickTime !== void 0 && now - lastClickTime < throttleMs) {
      log("debug", "ClickHandler: Click suppressed by throttle", {
        data: {
          signature,
          throttleRemaining: throttleMs - (now - lastClickTime)
        }
      });
      return false;
    }
    this.lastClickTimes.set(signature, now);
    return true;
  }
  /**
   * Prunes stale entries from the throttle cache to prevent memory leaks
   * Uses TTL-based eviction (5 minutes) and enforces max size limit
   * Called during checkClickThrottle with built-in rate limiting (every 30 seconds)
   */
  pruneThrottleCache(now) {
    if (now - this.lastPruneTime < THROTTLE_PRUNE_INTERVAL_MS) {
      return;
    }
    this.lastPruneTime = now;
    const cutoff = now - THROTTLE_ENTRY_TTL_MS;
    for (const [key, timestamp] of this.lastClickTimes.entries()) {
      if (timestamp < cutoff) {
        this.lastClickTimes.delete(key);
      }
    }
    if (this.lastClickTimes.size > MAX_THROTTLE_CACHE_ENTRIES) {
      const entries = Array.from(this.lastClickTimes.entries()).sort((a2, b2) => a2[1] - b2[1]);
      const excessCount = this.lastClickTimes.size - MAX_THROTTLE_CACHE_ENTRIES;
      const toDelete = entries.slice(0, excessCount);
      for (const [key] of toDelete) {
        this.lastClickTimes.delete(key);
      }
      log("debug", "ClickHandler: Pruned throttle cache", {
        data: {
          removed: toDelete.length,
          remaining: this.lastClickTimes.size
        }
      });
    }
  }
  /**
   * Creates a stable signature for an element to track throttling
   * Priority: id > data-testid > data-tlog-name > DOM path
   */
  getElementSignature(element) {
    if (element.id) {
      return `#${element.id}`;
    }
    const testId = element.getAttribute("data-testid");
    if (testId) {
      return `[data-testid="${testId}"]`;
    }
    const tlogName = element.getAttribute(`${HTML_DATA_ATTR_PREFIX}-name`);
    if (tlogName) {
      return `[${HTML_DATA_ATTR_PREFIX}-name="${tlogName}"]`;
    }
    return this.getElementPath(element);
  }
  /**
   * Generates a DOM path for an element (e.g., "body>div>button")
   */
  getElementPath(element) {
    const path = [];
    let current = element;
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      if (current.className) {
        const firstClass = current.className.split(" ")[0];
        if (firstClass) {
          selector += `.${firstClass}`;
        }
      }
      path.unshift(selector);
      current = current.parentElement;
    }
    return path.join(">") || "unknown";
  }
  findTrackingElement(element) {
    if (element.hasAttribute(`${HTML_DATA_ATTR_PREFIX}-name`)) {
      return element;
    }
    const closest = element.closest(`[${HTML_DATA_ATTR_PREFIX}-name]`);
    return closest;
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
  /**
   * Clamps relative coordinate values to [0, 1] range with 3 decimal precision.
   *
   * @param value - Raw relative coordinate value
   * @returns Clamped value between 0 and 1 with 3 decimal places (e.g., 0.123)
   *
   * @example
   * clamp(1.234)   // returns 1.000
   * clamp(0.12345) // returns 0.123
   * clamp(-0.5)    // returns 0.000
   */
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
  /**
   * Sanitizes text by replacing PII patterns with [REDACTED].
   *
   * Protects against:
   * - Email addresses
   * - Phone numbers (US format)
   * - Credit card numbers
   * - IBAN numbers
   * - API keys/tokens
   * - Bearer tokens
   *
   * @param text - Raw text content from element
   * @returns Sanitized text with PII replaced by [REDACTED]
   *
   * @example
   * sanitizeText('Email: user@example.com')      // returns 'Email: [REDACTED]'
   * sanitizeText('Card: 1234-5678-9012-3456')    // returns 'Card: [REDACTED]'
   * sanitizeText('Bearer token123')              // returns '[REDACTED]'
   */
  sanitizeText(text) {
    let sanitized = text;
    for (const pattern of PII_PATTERNS) {
      const regex = new RegExp(pattern.source, pattern.flags);
      sanitized = sanitized.replace(regex, "[REDACTED]");
    }
    return sanitized;
  }
  getRelevantText(clickedElement, relevantElement) {
    const clickedText = clickedElement.textContent?.trim() ?? "";
    const relevantText = relevantElement.textContent?.trim() ?? "";
    if (!clickedText && !relevantText) {
      return "";
    }
    let finalText = "";
    if (clickedText && clickedText.length <= MAX_TEXT_LENGTH) {
      finalText = clickedText;
    } else if (relevantText.length <= MAX_TEXT_LENGTH) {
      finalText = relevantText;
    } else {
      finalText = relevantText.slice(0, MAX_TEXT_LENGTH - 3) + "...";
    }
    return this.sanitizeText(finalText);
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
  containerDiscoveryTimeoutId = null;
  constructor(eventManager) {
    super();
    this.eventManager = eventManager;
  }
  /**
   * Starts tracking scroll events across all detected scrollable containers.
   *
   * Automatically detects scrollable containers using TreeWalker with retry logic:
   * - Searches DOM for elements with overflow: auto/scroll
   * - Validates visibility and scrollability
   * - Retries up to 5 times with 200ms intervals for dynamic content
   * - Falls back to window-only tracking if no containers found
   * - Applies primaryScrollSelector config override if provided
   *
   * Attaches debounced scroll listeners (250ms per container) with smart filtering:
   * - Significant movement (10px minimum)
   * - Depth change (5% minimum)
   * - Rate limiting (500ms minimum interval)
   * - Session cap (120 events maximum)
   */
  startTracking() {
    this.limitWarningLogged = false;
    this.applyConfigOverrides();
    this.set("scrollEventCount", 0);
    this.tryDetectScrollContainers(0);
  }
  /**
   * Stops tracking scroll events and cleans up resources.
   *
   * Removes all scroll event listeners, clears debounce timers, cancels retry attempts,
   * and resets session state (event counter, warning flags). Prevents memory leaks by
   * properly cleaning up all containers and timers.
   */
  stopTracking() {
    if (this.containerDiscoveryTimeoutId !== null) {
      clearTimeout(this.containerDiscoveryTimeoutId);
      this.containerDiscoveryTimeoutId = null;
    }
    for (const container of this.containers) {
      this.clearContainerTimer(container);
      if (container.element === window) {
        window.removeEventListener("scroll", container.listener);
      } else {
        container.element.removeEventListener("scroll", container.listener);
      }
    }
    this.containers.length = 0;
    this.set("scrollEventCount", 0);
    this.limitWarningLogged = false;
  }
  tryDetectScrollContainers(attempt) {
    const elements = this.findScrollableElements();
    if (this.isWindowScrollable()) {
      this.setupScrollContainer(window, "window");
    }
    if (elements.length > 0) {
      for (const element of elements) {
        const selector = this.getElementSelector(element);
        this.setupScrollContainer(element, selector);
      }
      this.applyPrimaryScrollSelectorIfConfigured();
      return;
    }
    if (attempt < 5) {
      this.containerDiscoveryTimeoutId = window.setTimeout(() => {
        this.containerDiscoveryTimeoutId = null;
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
    if (config?.primaryScrollSelector) {
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
        const hasVerticalScrollableStyle = style.overflowY === "auto" || style.overflowY === "scroll" || style.overflow === "auto" || style.overflow === "scroll";
        return hasVerticalScrollableStyle ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
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
      firstScrollEventTime: null,
      maxDepthReached: initialDepth,
      debounceTimer: null,
      listener: null
    };
    const handleScroll = () => {
      if (this.get("suppressNextScroll")) {
        return;
      }
      if (container.firstScrollEventTime === null) {
        container.firstScrollEventTime = Date.now();
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
    container.listener = handleScroll;
    this.containers.push(container);
    if (element === window) {
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
    let timeDelta;
    if (lastEventTime > 0) {
      timeDelta = now - lastEventTime;
    } else if (container.firstScrollEventTime !== null) {
      timeDelta = now - container.firstScrollEventTime;
    } else {
      timeDelta = SCROLL_DEBOUNCE_TIME_MS;
    }
    const velocity = Math.round(positionDelta / timeDelta * 1e3);
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
    return element === window ? window.scrollY : element.scrollTop;
  }
  getViewportHeight(element) {
    return element === window ? window.innerHeight : element.clientHeight;
  }
  getScrollHeight(element) {
    return element === window ? document.documentElement.scrollHeight : element.scrollHeight;
  }
  isElementScrollable(element) {
    const style = getComputedStyle(element);
    const hasVerticalScrollableOverflow = style.overflowY === "auto" || style.overflowY === "scroll" || style.overflow === "auto" || style.overflow === "scroll";
    const hasVerticalOverflowContent = element.scrollHeight > element.clientHeight;
    return hasVerticalScrollableOverflow && hasVerticalOverflowContent;
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
        this.setupScrollContainer(targetElement, selector);
      }
    }
  }
  updateContainerPrimary(container, isPrimary) {
    container.isPrimary = isPrimary;
  }
}
class ViewportHandler extends StateManager {
  eventManager;
  trackedElements = /* @__PURE__ */ new Map();
  observer = null;
  mutationObserver = null;
  mutationDebounceTimer = null;
  config = null;
  constructor(eventManager) {
    super();
    this.eventManager = eventManager;
  }
  /**
   * Starts tracking viewport visibility for configured elements
   */
  startTracking() {
    const config = this.get("config");
    this.config = config.viewport ?? null;
    if (!this.config?.elements || this.config.elements.length === 0) {
      return;
    }
    const threshold = this.config.threshold ?? 0.5;
    const minDwellTime = this.config.minDwellTime ?? 1e3;
    if (threshold < 0 || threshold > 1) {
      log("warn", "ViewportHandler: Invalid threshold, must be between 0 and 1");
      return;
    }
    if (minDwellTime < 0) {
      log("warn", "ViewportHandler: Invalid minDwellTime, must be non-negative");
      return;
    }
    if (typeof IntersectionObserver === "undefined") {
      log("warn", "ViewportHandler: IntersectionObserver not supported in this browser");
      return;
    }
    this.observer = new IntersectionObserver(this.handleIntersection, {
      threshold
    });
    this.observeElements();
    this.setupMutationObserver();
  }
  /**
   * Stops tracking and cleans up resources
   */
  stopTracking() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
    if (this.mutationDebounceTimer !== null) {
      window.clearTimeout(this.mutationDebounceTimer);
      this.mutationDebounceTimer = null;
    }
    for (const tracked of this.trackedElements.values()) {
      if (tracked.timeoutId !== null) {
        window.clearTimeout(tracked.timeoutId);
      }
    }
    this.trackedElements.clear();
  }
  /**
   * Query and observe all elements matching configured elements
   */
  observeElements() {
    if (!this.config || !this.observer) return;
    const maxTrackedElements = this.config.maxTrackedElements ?? DEFAULT_VIEWPORT_MAX_TRACKED_ELEMENTS;
    let totalTracked = this.trackedElements.size;
    for (const elementConfig of this.config.elements) {
      try {
        const elements = document.querySelectorAll(elementConfig.selector);
        for (const element of Array.from(elements)) {
          if (totalTracked >= maxTrackedElements) {
            log("warn", "ViewportHandler: Maximum tracked elements reached", {
              data: {
                limit: maxTrackedElements,
                selector: elementConfig.selector,
                message: "Some elements will not be tracked. Consider more specific selectors."
              }
            });
            return;
          }
          if (element.hasAttribute(`${HTML_DATA_ATTR_PREFIX}-ignore`)) {
            continue;
          }
          if (this.trackedElements.has(element)) {
            continue;
          }
          this.trackedElements.set(element, {
            element,
            selector: elementConfig.selector,
            id: elementConfig.id,
            name: elementConfig.name,
            startTime: null,
            timeoutId: null,
            lastFiredTime: null
          });
          this.observer?.observe(element);
          totalTracked++;
        }
      } catch (error) {
        log("warn", `ViewportHandler: Invalid selector "${elementConfig.selector}"`, { error });
      }
    }
    log("debug", "ViewportHandler: Elements tracked", {
      data: { count: totalTracked, limit: maxTrackedElements }
    });
  }
  /**
   * Handles intersection events from IntersectionObserver
   */
  handleIntersection = (entries) => {
    if (!this.config) return;
    const minDwellTime = this.config.minDwellTime ?? 1e3;
    for (const entry of entries) {
      const tracked = this.trackedElements.get(entry.target);
      if (!tracked) continue;
      if (entry.isIntersecting) {
        if (tracked.startTime === null) {
          tracked.startTime = performance.now();
          tracked.timeoutId = window.setTimeout(() => {
            const visibilityRatio = Math.round(entry.intersectionRatio * 100) / 100;
            this.fireViewportEvent(tracked, visibilityRatio);
          }, minDwellTime);
        }
      } else {
        if (tracked.startTime !== null) {
          if (tracked.timeoutId !== null) {
            window.clearTimeout(tracked.timeoutId);
            tracked.timeoutId = null;
          }
          tracked.startTime = null;
        }
      }
    }
  };
  /**
   * Fires a viewport visible event
   */
  fireViewportEvent(tracked, visibilityRatio) {
    if (tracked.startTime === null) return;
    const dwellTime = Math.round(performance.now() - tracked.startTime);
    if (tracked.element.hasAttribute(`${HTML_DATA_ATTR_PREFIX}-ignore`)) {
      return;
    }
    const cooldownPeriod = this.config?.cooldownPeriod ?? DEFAULT_VIEWPORT_COOLDOWN_PERIOD;
    const now = Date.now();
    if (tracked.lastFiredTime !== null && now - tracked.lastFiredTime < cooldownPeriod) {
      log("debug", "ViewportHandler: Event suppressed by cooldown period", {
        data: {
          selector: tracked.selector,
          cooldownRemaining: cooldownPeriod - (now - tracked.lastFiredTime)
        }
      });
      tracked.startTime = null;
      tracked.timeoutId = null;
      return;
    }
    const eventData = {
      selector: tracked.selector,
      dwellTime,
      visibilityRatio,
      ...tracked.id !== void 0 && { id: tracked.id },
      ...tracked.name !== void 0 && { name: tracked.name }
    };
    this.eventManager.track({
      type: EventType.VIEWPORT_VISIBLE,
      viewport_data: eventData
    });
    tracked.startTime = null;
    tracked.timeoutId = null;
    tracked.lastFiredTime = now;
  }
  /**
   * Sets up MutationObserver to detect dynamically added elements
   */
  setupMutationObserver() {
    if (!this.config || typeof MutationObserver === "undefined") {
      return;
    }
    if (!document.body) {
      log("warn", "ViewportHandler: document.body not available, skipping MutationObserver setup");
      return;
    }
    this.mutationObserver = new MutationObserver((mutations) => {
      let hasAddedNodes = false;
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          if (mutation.addedNodes.length > 0) {
            hasAddedNodes = true;
          }
          if (mutation.removedNodes.length > 0) {
            this.cleanupRemovedNodes(mutation.removedNodes);
          }
        }
      }
      if (hasAddedNodes) {
        if (this.mutationDebounceTimer !== null) {
          window.clearTimeout(this.mutationDebounceTimer);
        }
        this.mutationDebounceTimer = window.setTimeout(() => {
          this.observeElements();
          this.mutationDebounceTimer = null;
        }, VIEWPORT_MUTATION_DEBOUNCE_MS);
      }
    });
    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  /**
   * Cleans up tracking for removed DOM nodes
   */
  cleanupRemovedNodes(removedNodes) {
    removedNodes.forEach((node) => {
      if (node.nodeType !== 1) return;
      const element = node;
      const tracked = this.trackedElements.get(element);
      if (tracked) {
        if (tracked.timeoutId !== null) {
          window.clearTimeout(tracked.timeoutId);
        }
        this.observer?.unobserve(element);
        this.trackedElements.delete(element);
      }
      const descendants = Array.from(this.trackedElements.keys()).filter((el) => element.contains(el));
      descendants.forEach((el) => {
        const descendantTracked = this.trackedElements.get(el);
        if (descendantTracked && descendantTracked.timeoutId !== null) {
          window.clearTimeout(descendantTracked.timeoutId);
        }
        this.observer?.unobserve(el);
        this.trackedElements.delete(el);
      });
    });
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
   * Retrieves an item from localStorage.
   *
   * Automatically falls back to in-memory storage if localStorage unavailable.
   *
   * @param key - Storage key
   * @returns Stored value or null if not found
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
   * Stores an item in localStorage with automatic quota handling.
   *
   * **Behavior**:
   * 1. Updates fallback storage first (ensures consistency)
   * 2. Attempts to store in localStorage
   * 3. On QuotaExceededError: Triggers cleanup and retries once
   * 4. Falls back to in-memory storage if retry fails
   *
   * **Cleanup on Quota Error**:
   * - Removes persisted events (largest data)
   * - Removes up to 5 non-critical keys
   * - Preserves session, user, device, and config keys
   *
   * @param key - Storage key
   * @param value - String value to store
   */
  setItem(key, value) {
    this.fallbackStorage.set(key, value);
    try {
      if (this.storage) {
        this.storage.setItem(key, value);
        return;
      }
    } catch (error) {
      const isQuotaError = error instanceof DOMException && error.name === "QuotaExceededError" || error instanceof Error && error.name === "QuotaExceededError";
      if (isQuotaError) {
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
   * Removes an item from localStorage and fallback storage.
   *
   * Safe to call even if key doesn't exist (idempotent).
   *
   * @param key - Storage key to remove
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
   * Clears all TraceLog-related items from storage.
   *
   * Only removes keys with `tracelog_` prefix (safe for shared storage).
   * Clears both localStorage and fallback storage.
   *
   * **Use Cases**:
   * - User logout/privacy actions
   * - Development/testing cleanup
   * - Reset analytics state
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
   * Checks if localStorage is available.
   *
   * @returns true if localStorage is working, false if using fallback
   */
  isAvailable() {
    return this.storage !== null;
  }
  /**
   * Checks if a QuotaExceededError has occurred during this session.
   *
   * **Purpose**: Detect when localStorage is full and data may not persist.
   * Allows application to show warnings or adjust behavior.
   *
   * **Note**: Flag is set on first QuotaExceededError and never reset.
   *
   * @returns true if quota exceeded at any point during this session
   */
  hasQuotaError() {
    return this.hasQuotaExceededError;
  }
  /**
   * Implements two-phase cleanup strategy to free storage space when quota exceeded.
   *
   * **Purpose**: Removes TraceLog data intelligently to make room for new writes
   * while preserving critical user state (session, user ID, device ID, config).
   *
   * **Two-Phase Cleanup Strategy**:
   * 1. **Phase 1 (Priority)**: Remove all persisted events (`tracelog_persisted_events_*`)
   *    - These are typically the largest data items (batches of events)
   *    - Safe to remove as they represent recoverable failed sends
   *    - Returns immediately if any persisted events found and removed
   *
   * 2. **Phase 2 (Fallback)**: Remove up to 5 non-critical keys
   *    - Only executed if no persisted events found
   *    - Preserves critical keys: session data, user ID, device ID, config
   *    - Limits to 5 keys to avoid excessive cleanup time
   *
   * **Critical Keys (Never Removed)**:
   * - `tracelog_session_*` - Active session data
   * - `tracelog_user_id` - User identification
   * - `tracelog_device_id` - Device fingerprint
   * - `tracelog_config` - Configuration cache
   *
   * **Error Handling**:
   * - Individual key removal failures silently ignored (continue cleanup)
   * - Overall cleanup errors logged and return false
   *
   * @returns true if any data was successfully removed, false if nothing cleaned up
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
   * Initializes storage with feature detection and write-test validation.
   *
   * **Purpose**: Validates storage availability by performing actual write/remove test,
   * preventing false positives in privacy modes where storage API exists but throws on write.
   *
   * **Validation Strategy**:
   * 1. SSR Safety: Returns null in Node.js environments (`typeof window === 'undefined'`)
   * 2. API Check: Verifies storage object exists on window
   * 3. Write Test: Attempts to write test key (`__tracelog_test__`)
   * 4. Cleanup: Removes test key immediately after validation
   *
   * **Why Write Test is Critical**:
   * - Safari private browsing: storage API exists but throws QuotaExceededError on write
   * - iOS private mode: storage appears available but operations fail
   * - Incognito modes: API exists but writes are silently ignored or throw
   *
   * **Fallback Behavior**:
   * - Returns null if storage unavailable or test fails
   * - Caller automatically falls back to in-memory Map storage
   *
   * @param type - Storage type to initialize ('localStorage' | 'sessionStorage')
   * @returns Storage instance if available and writable, null otherwise
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
   * Retrieves an item from sessionStorage.
   *
   * Automatically falls back to in-memory storage if sessionStorage unavailable.
   *
   * @param key - Storage key
   * @returns Stored value or null if not found
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
   * Stores an item in sessionStorage with quota error detection.
   *
   * **Behavior**:
   * 1. Updates fallback storage first (ensures consistency)
   * 2. Attempts to store in sessionStorage
   * 3. On QuotaExceededError: Logs error and uses fallback (no retry/cleanup)
   *
   * **Note**: sessionStorage quota errors are rare (typically 5-10MB per tab).
   * No automatic cleanup unlike localStorage.
   *
   * @param key - Storage key
   * @param value - String value to store
   */
  setSessionItem(key, value) {
    this.fallbackSessionStorage.set(key, value);
    try {
      if (this.sessionStorageRef) {
        this.sessionStorageRef.setItem(key, value);
        return;
      }
    } catch (error) {
      const isQuotaError = error instanceof DOMException && error.name === "QuotaExceededError" || error instanceof Error && error.name === "QuotaExceededError";
      if (isQuotaError) {
        log("error", "sessionStorage quota exceeded - data will not persist", {
          error,
          data: { key, valueSize: value.length }
        });
      }
    }
  }
  /**
   * Removes an item from sessionStorage and fallback storage.
   *
   * Safe to call even if key doesn't exist (idempotent).
   *
   * @param key - Storage key to remove
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
  navigationHistory = [];
  // FIFO queue for tracking navigation order
  observers = [];
  vitalThresholds;
  lastLongTaskSentAt = 0;
  constructor(eventManager) {
    super();
    this.eventManager = eventManager;
    this.vitalThresholds = getWebVitalsThresholds(DEFAULT_WEB_VITALS_MODE);
  }
  /**
   * Starts tracking Web Vitals and performance metrics.
   *
   * Asynchronously loads the web-vitals library and initializes performance tracking.
   * Falls back to native Performance Observer API if web-vitals fails to load.
   *
   * **Configuration**:
   * - Reads webVitalsMode from config ('all', 'needs-improvement', 'poor')
   * - Merges webVitalsThresholds with mode defaults for custom thresholds
   * - Initializes web-vitals library observers (LCP, CLS, FCP, TTFB, INP)
   * - Starts long task observation with 1/second throttling
   *
   * @returns Promise that resolves when tracking is initialized
   */
  async startTracking() {
    const config = this.get("config");
    const mode = config?.webVitalsMode ?? DEFAULT_WEB_VITALS_MODE;
    this.vitalThresholds = getWebVitalsThresholds(mode);
    if (config?.webVitalsThresholds) {
      this.vitalThresholds = { ...this.vitalThresholds, ...config.webVitalsThresholds };
    }
    await this.initWebVitals();
    this.observeLongTasks();
  }
  /**
   * Stops tracking Web Vitals and cleans up resources.
   *
   * Disconnects all Performance Observers and clears internal state:
   * - Disconnects all active observers (web-vitals and long task)
   * - Clears navigation-based deduplication map
   * - Clears navigation history array
   * - Prevents memory leaks in long-running applications
   */
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
    this.navigationHistory.length = 0;
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
      onLCP(report("LCP"), { reportAllChanges: false });
      onCLS(report("CLS"), { reportAllChanges: false });
      onFCP(report("FCP"), { reportAllChanges: false });
      onTTFB(report("TTFB"), { reportAllChanges: false });
      onINP(report("INP"), { reportAllChanges: false });
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
        this.navigationHistory.push(navId);
        if (this.navigationHistory.length > MAX_NAVIGATION_HISTORY) {
          const oldestNav = this.navigationHistory.shift();
          if (oldestNav) {
            this.reportedByNav.delete(oldestNav);
          }
        }
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
  errorBurstCounter = 0;
  burstWindowStart = 0;
  burstBackoffUntil = 0;
  constructor(eventManager) {
    super();
    this.eventManager = eventManager;
  }
  /**
   * Starts tracking JavaScript errors and promise rejections.
   *
   * - Registers global error event listener
   * - Registers unhandledrejection event listener
   */
  startTracking() {
    window.addEventListener("error", this.handleError);
    window.addEventListener("unhandledrejection", this.handleRejection);
  }
  /**
   * Stops tracking errors and cleans up resources.
   *
   * - Removes error event listeners
   * - Clears recent errors map
   * - Resets burst detection counters
   */
  stopTracking() {
    window.removeEventListener("error", this.handleError);
    window.removeEventListener("unhandledrejection", this.handleRejection);
    this.recentErrors.clear();
    this.errorBurstCounter = 0;
    this.burstWindowStart = 0;
    this.burstBackoffUntil = 0;
  }
  /**
   * Checks sampling rate and burst detection
   * Returns false if in cooldown period after burst detection
   */
  shouldSample() {
    const now = Date.now();
    if (now < this.burstBackoffUntil) {
      return false;
    }
    if (now - this.burstWindowStart > ERROR_BURST_WINDOW_MS) {
      this.errorBurstCounter = 0;
      this.burstWindowStart = now;
    }
    this.errorBurstCounter++;
    if (this.errorBurstCounter > ERROR_BURST_THRESHOLD) {
      this.burstBackoffUntil = now + ERROR_BURST_BACKOFF_MS;
      log("warn", "Error burst detected - entering cooldown", {
        data: {
          errorsInWindow: this.errorBurstCounter,
          cooldownMs: ERROR_BURST_BACKOFF_MS
        }
      });
      return false;
    }
    const config = this.get("config");
    const samplingRate = config?.errorSampling ?? DEFAULT_ERROR_SAMPLING_RATE;
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
  transformers = {};
  managers = {};
  handlers = {};
  get initialized() {
    return this.isInitialized;
  }
  /**
   * Initializes TraceLog with configuration.
   *
   * @param config - Configuration object
   * @throws {Error} If initialization fails
   * @internal Called from api.init()
   */
  async init(config = {}) {
    if (this.isInitialized) {
      return;
    }
    this.managers.storage = new StorageManager();
    try {
      this.setupState(config);
      this.managers.event = new EventManager(this.managers.storage, this.emitter, this.transformers);
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
  /**
   * Sends a custom event with optional metadata.
   *
   * @param name - Event name
   * @param metadata - Optional metadata
   * @internal Called from api.event()
   */
  sendCustomEvent(name, metadata) {
    if (!this.managers.event) {
      log("warn", "Cannot send custom event: TraceLog not initialized", { data: { name } });
      return;
    }
    let normalizedMetadata = metadata;
    if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
      if (Object.getPrototypeOf(metadata) !== Object.prototype) {
        normalizedMetadata = Object.assign({}, metadata);
      }
    }
    const { valid, error, sanitizedMetadata } = isEventValid(name, normalizedMetadata);
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
  setTransformer(hook, fn) {
    if (typeof fn !== "function") {
      throw new Error(`[TraceLog] Transformer must be a function, received: ${typeof fn}`);
    }
    this.transformers[hook] = fn;
  }
  removeTransformer(hook) {
    delete this.transformers[hook];
  }
  getTransformer(hook) {
    return this.transformers[hook];
  }
  /**
   * Destroys the TraceLog instance and cleans up all resources.
   *
   * @param force - If true, forces cleanup even if not initialized (used during init failure)
   * @internal Called from api.destroy()
   */
  destroy(force = false) {
    if (!this.isInitialized && !force) {
      return;
    }
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
    this.managers.event?.stop();
    this.emitter.removeAllListeners();
    this.transformers.beforeSend = void 0;
    this.transformers.beforeBatch = void 0;
    this.set("hasStartSession", false);
    this.set("suppressNextScroll", false);
    this.set("sessionId", null);
    this.isInitialized = false;
    this.handlers = {};
    this.managers = {};
  }
  setupState(config = {}) {
    this.set("config", config);
    const userId = UserManager.getId(this.managers.storage);
    this.set("userId", userId);
    const collectApiUrls = getCollectApiUrls(config);
    this.set("collectApiUrls", collectApiUrls);
    const device = getDeviceType();
    this.set("device", device);
    const pageUrl = normalizeUrl(window.location.href, config.sensitiveQueryParams);
    this.set("pageUrl", pageUrl);
    const mode = detectQaMode() ? Mode.QA : void 0;
    if (mode) {
      this.set("mode", mode);
    }
  }
  /**
   * Returns the current configuration object.
   *
   * @returns The Config object passed to init()
   * @internal Used by api.ts for configuration access
   */
  getConfig() {
    return this.get("config");
  }
  /**
   * Returns the configured backend API URLs for event collection.
   *
   * @returns Object containing optional saas and custom API URLs
   * @internal Used by api.ts for backend URL access
   */
  getCollectApiUrls() {
    return this.get("collectApiUrls");
  }
  /**
   * Returns the EventManager instance for event tracking operations.
   *
   * @returns The EventManager instance, or undefined if not initialized
   * @internal Used by api.ts for event operations
   */
  getEventManager() {
    return this.managers.event;
  }
  /**
   * Validates metadata object structure and values.
   *
   * @param metadata - The metadata object to validate
   * @returns Validation result with error message if invalid
   * @internal Helper for updateGlobalMetadata and mergeGlobalMetadata
   */
  validateGlobalMetadata(metadata) {
    if (typeof metadata !== "object" || metadata === null || Array.isArray(metadata)) {
      return {
        valid: false,
        error: "Global metadata must be a plain object"
      };
    }
    const validation = isValidMetadata("Global", metadata, "globalMetadata");
    if (!validation.valid) {
      return {
        valid: false,
        error: validation.error
      };
    }
    return { valid: true };
  }
  /**
   * Replaces global metadata with new values.
   *
   * @param metadata - New global metadata object
   * @throws {Error} If metadata validation fails
   * @internal Called from api.updateGlobalMetadata()
   */
  updateGlobalMetadata(metadata) {
    const validation = this.validateGlobalMetadata(metadata);
    if (!validation.valid) {
      throw new Error(`[TraceLog] Invalid global metadata: ${validation.error}`);
    }
    const currentConfig = this.get("config");
    const updatedConfig = {
      ...currentConfig,
      globalMetadata: metadata
    };
    this.set("config", updatedConfig);
    log("debug", "Global metadata updated (replaced)", { data: { keys: Object.keys(metadata) } });
  }
  /**
   * Merges new metadata with existing global metadata.
   *
   * @param metadata - Metadata to merge with existing values
   * @throws {Error} If metadata validation fails
   * @internal Called from api.mergeGlobalMetadata()
   */
  mergeGlobalMetadata(metadata) {
    const validation = this.validateGlobalMetadata(metadata);
    if (!validation.valid) {
      throw new Error(`[TraceLog] Invalid global metadata: ${validation.error}`);
    }
    const currentConfig = this.get("config");
    const existingMetadata = currentConfig.globalMetadata ?? {};
    const mergedMetadata = {
      ...existingMetadata,
      ...metadata
    };
    const updatedConfig = {
      ...currentConfig,
      globalMetadata: mergedMetadata
    };
    this.set("config", updatedConfig);
    log("debug", "Global metadata updated (merged)", { data: { keys: Object.keys(metadata) } });
  }
  initializeHandlers() {
    const config = this.get("config");
    const disabledEvents = config.disabledEvents ?? [];
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
    if (!disabledEvents.includes("scroll")) {
      this.handlers.scroll = new ScrollHandler(this.managers.event);
      this.handlers.scroll.startTracking();
    }
    if (!disabledEvents.includes("web_vitals")) {
      this.handlers.performance = new PerformanceHandler(this.managers.event);
      this.handlers.performance.startTracking().catch((error) => {
        log("warn", "Failed to start performance tracking", { error });
      });
    }
    if (!disabledEvents.includes("error")) {
      this.handlers.error = new ErrorHandler(this.managers.event);
      this.handlers.error.startTracking();
    }
    if (config.viewport) {
      this.handlers.viewport = new ViewportHandler(this.managers.event);
      this.handlers.viewport.startTracking();
    }
  }
}
const pendingListeners = [];
const pendingTransformers = [];
let app = null;
let isInitializing = false;
let isDestroying = false;
const init = async (config) => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  isDestroying = false;
  if (window.__traceLogDisabled === true) {
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
      pendingTransformers.forEach(({ hook, fn }) => {
        if (hook === "beforeSend") {
          instance.setTransformer("beforeSend", fn);
        } else {
          instance.setTransformer("beforeBatch", fn);
        }
      });
      pendingTransformers.length = 0;
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
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  if (!app) {
    throw new Error("[TraceLog] TraceLog not initialized. Please call init() first.");
  }
  if (isDestroying) {
    throw new Error("[TraceLog] Cannot send events while TraceLog is being destroyed");
  }
  app.sendCustomEvent(name, metadata);
};
const on = (event2, callback) => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  if (!app || isInitializing) {
    pendingListeners.push({ event: event2, callback });
    return;
  }
  app.on(event2, callback);
};
const off = (event2, callback) => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  if (!app) {
    const index = pendingListeners.findIndex((l2) => l2.event === event2 && l2.callback === callback);
    if (index !== -1) {
      pendingListeners.splice(index, 1);
    }
    return;
  }
  app.off(event2, callback);
};
function setTransformer(hook, fn) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  if (typeof fn !== "function") {
    throw new Error(`[TraceLog] Transformer must be a function, received: ${typeof fn}`);
  }
  if (!app || isInitializing) {
    const existingIndex = pendingTransformers.findIndex((t) => t.hook === hook);
    if (existingIndex !== -1) {
      pendingTransformers.splice(existingIndex, 1);
    }
    pendingTransformers.push({ hook, fn });
    return;
  }
  if (isDestroying) {
    throw new Error("[TraceLog] Cannot set transformers while TraceLog is being destroyed");
  }
  if (hook === "beforeSend") {
    app.setTransformer("beforeSend", fn);
  } else {
    app.setTransformer("beforeBatch", fn);
  }
}
const removeTransformer = (hook) => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  if (!app) {
    const index = pendingTransformers.findIndex((t) => t.hook === hook);
    if (index !== -1) {
      pendingTransformers.splice(index, 1);
    }
    return;
  }
  if (isDestroying) {
    throw new Error("[TraceLog] Cannot remove transformers while TraceLog is being destroyed");
  }
  app.removeTransformer(hook);
};
const isInitialized = () => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }
  return app !== null;
};
const destroy = () => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  if (isDestroying) {
    throw new Error("[TraceLog] Destroy operation already in progress");
  }
  if (!app) {
    isDestroying = false;
    return;
  }
  isDestroying = true;
  try {
    app.destroy();
    app = null;
    isInitializing = false;
    pendingListeners.length = 0;
    pendingTransformers.length = 0;
    if (typeof window !== "undefined" && window.__traceLogBridge) {
      window.__traceLogBridge = void 0;
    }
    isDestroying = false;
  } catch (error) {
    app = null;
    isInitializing = false;
    pendingListeners.length = 0;
    pendingTransformers.length = 0;
    isDestroying = false;
    log("warn", "Error during destroy, forced cleanup completed", { error });
  }
};
const setQaMode = (enabled) => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  setQaMode$1(enabled);
};
const updateGlobalMetadata = (metadata) => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  if (!app) {
    throw new Error("[TraceLog] TraceLog not initialized. Please call init() first.");
  }
  if (isDestroying) {
    throw new Error("[TraceLog] Cannot update metadata while TraceLog is being destroyed");
  }
  app.updateGlobalMetadata(metadata);
};
const mergeGlobalMetadata = (metadata) => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  if (!app) {
    throw new Error("[TraceLog] TraceLog not initialized. Please call init() first.");
  }
  if (isDestroying) {
    throw new Error("[TraceLog] Cannot update metadata while TraceLog is being destroyed");
  }
  app.mergeGlobalMetadata(metadata);
};
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
if (typeof window !== "undefined" && typeof document !== "undefined") {
  void Promise.resolve().then(() => testBridge).then((module) => {
    if (typeof module.injectTestBridge === "function") {
      module.injectTestBridge();
    }
  }).catch(() => {
  });
  void Promise.resolve().then(() => qaMode_utils).then((module) => {
    if (typeof module.detectQaMode === "function") {
      module.detectQaMode();
    }
  }).catch(() => {
  });
}
const api = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  __setAppInstance,
  destroy,
  event,
  init,
  isInitialized,
  mergeGlobalMetadata,
  off,
  on,
  removeTransformer,
  setQaMode,
  setTransformer,
  updateGlobalMetadata
}, Symbol.toStringTag, { value: "Module" }));
const tracelog = {
  init,
  event,
  on,
  off,
  setTransformer,
  removeTransformer,
  isInitialized,
  destroy,
  setQaMode,
  updateGlobalMetadata,
  mergeGlobalMetadata
};
var e, o = -1, a = function(e3) {
  addEventListener("pageshow", (function(n) {
    n.persisted && (o = n.timeStamp, e3(n));
  }), true);
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
      var r = new PerformanceObserver((function(e4) {
        Promise.resolve().then((function() {
          n(e4.getEntries());
        }));
      }));
      return r.observe(Object.assign({ type: e3, buffered: true }, t || {})), r;
    }
  } catch (e4) {
  }
}, d = function(e3, n, t, r) {
  var i, o2;
  return function(a2) {
    n.value >= 0 && (a2 || r) && ((o2 = n.value - (i || 0)) || void 0 === i) && (i = n.value, n.delta = o2, n.rating = (function(e4, n2) {
      return e4 > n2[1] ? "poor" : e4 > n2[0] ? "needs-improvement" : "good";
    })(n.value, t), e3(n));
  };
}, l = function(e3) {
  requestAnimationFrame((function() {
    return requestAnimationFrame((function() {
      return e3();
    }));
  }));
}, p = function(e3) {
  document.addEventListener("visibilitychange", (function() {
    "hidden" === document.visibilityState && e3();
  }));
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
  return m < 0 && (m = h(), y(), a((function() {
    setTimeout((function() {
      m = h(), y();
    }), 0);
  }))), { get firstHiddenTime() {
    return m;
  } };
}, C = function(e3) {
  document.prerendering ? addEventListener("prerenderingchange", (function() {
    return e3();
  }), true) : e3();
}, b = [1800, 3e3], S = function(e3, n) {
  n = n || {}, C((function() {
    var t, r = E(), i = f("FCP"), o2 = s("paint", (function(e4) {
      e4.forEach((function(e5) {
        "first-contentful-paint" === e5.name && (o2.disconnect(), e5.startTime < r.firstHiddenTime && (i.value = Math.max(e5.startTime - u(), 0), i.entries.push(e5), t(true)));
      }));
    }));
    o2 && (t = d(e3, i, b, n.reportAllChanges), a((function(r2) {
      i = f("FCP"), t = d(e3, i, b, n.reportAllChanges), l((function() {
        i.value = performance.now() - r2.timeStamp, t(true);
      }));
    })));
  }));
}, L = [0.1, 0.25], w = function(e3, n) {
  n = n || {}, S(v((function() {
    var t, r = f("CLS", 0), i = 0, o2 = [], c2 = function(e4) {
      e4.forEach((function(e5) {
        if (!e5.hadRecentInput) {
          var n2 = o2[0], t2 = o2[o2.length - 1];
          i && e5.startTime - t2.startTime < 1e3 && e5.startTime - n2.startTime < 5e3 ? (i += e5.value, o2.push(e5)) : (i = e5.value, o2 = [e5]);
        }
      })), i > r.value && (r.value = i, r.entries = o2, t());
    }, u2 = s("layout-shift", c2);
    u2 && (t = d(e3, r, L, n.reportAllChanges), p((function() {
      c2(u2.takeRecords()), t(true);
    })), a((function() {
      i = 0, r = f("CLS", 0), t = d(e3, r, L, n.reportAllChanges), l((function() {
        return t();
      }));
    })), setTimeout(t, 0));
  })));
}, A = 0, I = 1 / 0, P = 0, M = function(e3) {
  e3.forEach((function(e4) {
    e4.interactionId && (I = Math.min(I, e4.interactionId), P = Math.max(P, e4.interactionId), A = P ? (P - I) / 7 + 1 : 0);
  }));
}, k = function() {
  return e ? A : performance.interactionCount || 0;
}, F = function() {
  "interactionCount" in performance || e || (e = s("event", M, { type: "event", buffered: true, durationThreshold: 0 }));
}, D = [], x = /* @__PURE__ */ new Map(), R = 0, B = function() {
  var e3 = Math.min(D.length - 1, Math.floor((k() - R) / 50));
  return D[e3];
}, H = [], q = function(e3) {
  if (H.forEach((function(n2) {
    return n2(e3);
  })), e3.interactionId || "first-input" === e3.entryType) {
    var n = D[D.length - 1], t = x.get(e3.interactionId);
    if (t || D.length < 10 || e3.duration > n.latency) {
      if (t) e3.duration > t.latency ? (t.entries = [e3], t.latency = e3.duration) : e3.duration === t.latency && e3.startTime === t.entries[0].startTime && t.entries.push(e3);
      else {
        var r = { id: e3.interactionId, latency: e3.duration, entries: [e3] };
        x.set(r.id, r), D.push(r);
      }
      D.sort((function(e4, n2) {
        return n2.latency - e4.latency;
      })), D.length > 10 && D.splice(10).forEach((function(e4) {
        return x.delete(e4.id);
      }));
    }
  }
}, O = function(e3) {
  var n = self.requestIdleCallback || self.setTimeout, t = -1;
  return e3 = v(e3), "hidden" === document.visibilityState ? e3() : (t = n(e3), p(e3)), t;
}, N = [200, 500], j = function(e3, n) {
  "PerformanceEventTiming" in self && "interactionId" in PerformanceEventTiming.prototype && (n = n || {}, C((function() {
    var t;
    F();
    var r, i = f("INP"), o2 = function(e4) {
      O((function() {
        e4.forEach(q);
        var n2 = B();
        n2 && n2.latency !== i.value && (i.value = n2.latency, i.entries = n2.entries, r());
      }));
    }, c2 = s("event", o2, { durationThreshold: null !== (t = n.durationThreshold) && void 0 !== t ? t : 40 });
    r = d(e3, i, N, n.reportAllChanges), c2 && (c2.observe({ type: "first-input", buffered: true }), p((function() {
      o2(c2.takeRecords()), r(true);
    })), a((function() {
      R = k(), D.length = 0, x.clear(), i = f("INP"), r = d(e3, i, N, n.reportAllChanges);
    })));
  })));
}, _ = [2500, 4e3], z = {}, G = function(e3, n) {
  n = n || {}, C((function() {
    var t, r = E(), i = f("LCP"), o2 = function(e4) {
      n.reportAllChanges || (e4 = e4.slice(-1)), e4.forEach((function(e5) {
        e5.startTime < r.firstHiddenTime && (i.value = Math.max(e5.startTime - u(), 0), i.entries = [e5], t());
      }));
    }, c2 = s("largest-contentful-paint", o2);
    if (c2) {
      t = d(e3, i, _, n.reportAllChanges);
      var m2 = v((function() {
        z[i.id] || (o2(c2.takeRecords()), c2.disconnect(), z[i.id] = true, t(true));
      }));
      ["keydown", "click"].forEach((function(e4) {
        addEventListener(e4, (function() {
          return O(m2);
        }), { once: true, capture: true });
      })), p(m2), a((function(r2) {
        i = f("LCP"), t = d(e3, i, _, n.reportAllChanges), l((function() {
          i.value = performance.now() - r2.timeStamp, z[i.id] = true, t(true);
        }));
      }));
    }
  }));
}, J = [800, 1800], K = function e2(n) {
  document.prerendering ? C((function() {
    return e2(n);
  })) : "complete" !== document.readyState ? addEventListener("load", (function() {
    return e2(n);
  }), true) : setTimeout(n, 0);
}, Q = function(e3, n) {
  n = n || {};
  var t = f("TTFB"), r = d(e3, t, J, n.reportAllChanges);
  K((function() {
    var i = c();
    i && (t.value = Math.max(i.responseStart - u(), 0), t.entries = [i], r(true), a((function() {
      t = f("TTFB", 0), (r = d(e3, t, J, n.reportAllChanges))(true);
    })));
  }));
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
class TestBridge extends App {
  constructor() {
    super();
  }
  async init(config) {
    try {
      const { __setAppInstance: __setAppInstance2 } = await Promise.resolve().then(() => api);
      __setAppInstance2(this);
    } catch {
      throw new Error("[TraceLog] TestBridge cannot sync with existing tracelog instance. Call destroy() first.");
    }
    try {
      await super.init(config);
    } catch (error) {
      const { __setAppInstance: __setAppInstance2 } = await Promise.resolve().then(() => api);
      __setAppInstance2(null);
      throw error;
    }
  }
  sendCustomEvent(name, data) {
    if (!this.initialized) {
      return;
    }
    super.sendCustomEvent(name, data);
  }
  /**
   * Alias for sendCustomEvent (E2E test convenience)
   */
  event(name, metadata) {
    this.sendCustomEvent(name, metadata);
  }
  /**
   * QA mode control for debugging tests
   */
  setQaMode(enabled) {
    setQaMode$1(enabled);
  }
  /**
   * Session data inspection for E2E tests
   */
  getSessionData() {
    const sessionId = this.get("sessionId");
    const config = this.get("config");
    return {
      id: sessionId ?? null,
      isActive: sessionId !== null && sessionId !== "",
      timeout: config.sessionTimeout ?? 15 * 60 * 1e3
    };
  }
  /**
   * Queue length inspection for E2E tests
   */
  getQueueLength() {
    return this.managers.event?.getQueueLength() ?? 0;
  }
  /**
   * Event manager accessor for E2E tests
   */
  getEventManager() {
    return this.managers.event;
  }
  /**
   * Performance handler accessor for tests
   */
  getPerformanceHandler() {
    return this.handlers.performance ?? null;
  }
  /**
   * Error handler accessor for tests
   */
  getErrorHandler() {
    return this.handlers.error ?? null;
  }
  /**
   * Session handler accessor for tests
   */
  getSessionHandler() {
    return this.handlers.session ?? null;
  }
  /**
   * PageView handler accessor for tests
   */
  getPageViewHandler() {
    return this.handlers.pageView ?? null;
  }
  /**
   * Click handler accessor for tests
   */
  getClickHandler() {
    return this.handlers.click ?? null;
  }
  /**
   * Scroll handler accessor for tests
   */
  getScrollHandler() {
    return this.handlers.scroll ?? null;
  }
  /**
   * Viewport handler accessor for tests
   */
  getViewportHandler() {
    return this.handlers.viewport ?? null;
  }
  /**
   * Get all handlers at once (convenience method)
   */
  getHandlers() {
    return {
      performance: this.getPerformanceHandler(),
      error: this.getErrorHandler(),
      session: this.getSessionHandler(),
      pageView: this.getPageViewHandler(),
      click: this.getClickHandler(),
      scroll: this.getScrollHandler(),
      viewport: this.getViewportHandler()
    };
  }
  /**
   * Storage manager accessor for tests
   */
  getStorageManager() {
    return this.managers.storage ?? null;
  }
  /**
   * Get events from queue (for validation in tests)
   */
  getQueueEvents() {
    return this.managers.event?.getQueueEvents() ?? [];
  }
  /**
   * State accessor (make public for tests)
   */
  get(key) {
    return super.get(key);
  }
  /**
   * Full state snapshot (for test inspection)
   */
  getFullState() {
    return this.getState();
  }
  /**
   * Update global metadata (delegates to App method)
   */
  updateGlobalMetadata(metadata) {
    super.updateGlobalMetadata(metadata);
  }
  /**
   * Merge global metadata (delegates to App method)
   */
  mergeGlobalMetadata(metadata) {
    super.mergeGlobalMetadata(metadata);
  }
  /**
   * Get state object (public override for test access)
   *
   * Exposes protected StateManager.getState() as public for integration tests.
   * Equivalent to getFullState() but maintains consistency with test patterns
   * that use bridge.getState().config pattern.
   */
  getState() {
    return super.getState();
  }
  /**
   * Wait for initialization to complete (test utility)
   */
  async waitForInitialization(timeout = 5e3) {
    const startTime = Date.now();
    while (!this.initialized && Date.now() - startTime < timeout) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (!this.initialized) {
      throw new Error("[TraceLog] Initialization timeout");
    }
  }
  /**
   * Trigger manual queue flush (test utility)
   */
  async flushQueue() {
    await this.managers.event?.flushQueue();
  }
  /**
   * Clear event queue (test utility - use with caution)
   */
  clearQueue() {
    this.managers.event?.clearQueue();
  }
  /**
   * Cleanup (syncs with api.ts)
   */
  destroy(force = false) {
    if (!this.initialized && !force) {
      return;
    }
    destroy();
    try {
      super.destroy(force);
      void Promise.resolve().then(() => api).then(({ __setAppInstance: __setAppInstance2 }) => {
        __setAppInstance2(null);
      });
    } catch (error) {
      void Promise.resolve().then(() => api).then(({ __setAppInstance: __setAppInstance2 }) => {
        __setAppInstance2(null);
      });
      throw error;
    }
  }
}
const injectTestBridge = () => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  try {
    window.__traceLogBridge = new TestBridge();
  } catch (error) {
    console.error("[TraceLog] Failed to inject TestBridge", error);
  }
};
const testBridge = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  TestBridge,
  injectTestBridge
}, Symbol.toStringTag, { value: "Module" }));
export {
  AppConfigValidationError,
  DEFAULT_SESSION_TIMEOUT,
  DEFAULT_WEB_VITALS_MODE,
  DeviceType,
  EmitterEvent,
  ErrorType,
  EventType,
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
  PII_PATTERNS,
  PermanentError,
  SamplingRateValidationError,
  ScrollDirection,
  SessionTimeoutValidationError,
  SpecialApiUrl,
  TraceLogValidationError,
  WEB_VITALS_GOOD_THRESHOLDS,
  WEB_VITALS_NEEDS_IMPROVEMENT_THRESHOLDS,
  WEB_VITALS_POOR_THRESHOLDS,
  getWebVitalsThresholds,
  isPrimaryScrollEvent,
  isSecondaryScrollEvent,
  tracelog
};
//# sourceMappingURL=tracelog.esm.js.map
