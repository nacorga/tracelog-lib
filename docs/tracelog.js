const DEFAULT_SESSION_TIMEOUT = 15 * 60 * 1e3;
const DUPLICATE_EVENT_THRESHOLD_MS = 1e3;
const EVENT_SENT_INTERVAL_MS = 1e4;
const MIN_SEND_INTERVAL_MS = 1e3;
const MAX_SEND_INTERVAL_MS_CONFIG = 6e4;
const SCROLL_DEBOUNCE_TIME_MS = 250;
const DEFAULT_PAGE_VIEW_THROTTLE_MS = 1e3;
const DEFAULT_CLICK_THROTTLE_MS = 300;
const MAX_THROTTLE_CACHE_ENTRIES = 1e3;
const THROTTLE_ENTRY_TTL_MS = 3e5;
const THROTTLE_PRUNE_INTERVAL_MS = 3e4;
const EVENT_EXPIRY_HOURS = 2;
const PERSISTENCE_THROTTLE_MS = 1e3;
const MAX_EVENT_AGE_MS_ON_RECOVERY = 6 * 24 * 60 * 60 * 1e3;
const MAX_EVENTS_QUEUE_LENGTH = 100;
const REQUEST_TIMEOUT_MS = 15e3;
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
const BATCH_SIZE_THRESHOLD = 50;
const MAX_PENDING_EVENTS_BUFFER = 100;
const MIN_SESSION_TIMEOUT_MS = 3e4;
const MAX_SESSION_TIMEOUT_MS = 864e5;
const MAX_CUSTOM_EVENT_NAME_LENGTH = 120;
const MAX_CUSTOM_EVENT_STRING_SIZE = 48 * 1024;
const MAX_CUSTOM_EVENT_KEYS = 100;
const MAX_CUSTOM_EVENT_ARRAY_SIZE = 500;
const MAX_NESTED_OBJECT_KEYS = 200;
const MAX_TEXT_LENGTH = 255;
const MAX_STRING_LENGTH = 1e3;
const MAX_STRING_LENGTH_IN_ARRAY = 500;
const MAX_ARRAY_LENGTH = 1e3;
const MAX_OBJECT_DEPTH = 10;
const PRECISION_TWO_DECIMALS = 2;
const MAX_BEACON_PAYLOAD_SIZE = 64 * 1024;
const MAX_FINGERPRINTS = 1500;
const FINGERPRINT_CLEANUP_MULTIPLIER = 10;
const MAX_FINGERPRINTS_HARD_LIMIT = 3e3;
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
  "sessionid",
  "session_id",
  "jwt",
  "bearer",
  "oauth",
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
const MAX_SEND_INTERVAL_MS = 12e4;
const MAX_CONSECUTIVE_NETWORK_FAILURES = 3;
const CIRCUIT_BREAKER_COOLDOWN_MS = 12e4;
const RATE_LIMIT_COOLDOWN_MS = 6e4;
const MAX_RECOVERY_FAILURES = 3;
const MAX_CONSECUTIVE_SEND_FAILURES = 5;
const VALIDATION_MESSAGES = {
  INVALID_SESSION_TIMEOUT: `Session timeout must be between ${MIN_SESSION_TIMEOUT_MS}ms (30 seconds) and ${MAX_SESSION_TIMEOUT_MS}ms (24 hours)`,
  INVALID_SAMPLING_RATE: "Sampling rate must be between 0 and 1",
  INVALID_ERROR_SAMPLING_RATE: "Error sampling must be between 0 and 1",
  INVALID_TRACELOG_PROJECT_ID: "TraceLog project ID is required when integration is enabled",
  INVALID_GLOBAL_METADATA: "Global metadata must be an object",
  INVALID_SENSITIVE_QUERY_PARAMS: "Sensitive query params must be an array of strings",
  INVALID_PAGE_VIEW_THROTTLE: "Page view throttle must be a non-negative number",
  INVALID_CLICK_THROTTLE: "Click throttle must be a non-negative number",
  INVALID_MAX_SAME_EVENT_PER_MINUTE: "Max same event per minute must be a positive number",
  INVALID_SEND_INTERVAL: `Send interval must be between ${MIN_SEND_INTERVAL_MS}ms (1 second) and ${MAX_SEND_INTERVAL_MS_CONFIG}ms (60 seconds)`
};
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<embed\b[^>]*>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi
];
const STORAGE_BASE_KEY = "tlog";
const QA_MODE_KEY = `${STORAGE_BASE_KEY}:qa_mode`;
const USER_ID_KEY = `${STORAGE_BASE_KEY}:uid`;
const QA_MODE_URL_PARAM = "tlog_mode";
const QA_MODE_ENABLE_VALUE = "qa";
const QA_MODE_DISABLE_VALUE = "qa_off";
const QUEUE_KEY = (id) => id ? `${STORAGE_BASE_KEY}:${id}:queue` : `${STORAGE_BASE_KEY}:queue`;
const RATE_LIMIT_KEY = (id) => id ? `${STORAGE_BASE_KEY}:${id}:rate_limit` : `${STORAGE_BASE_KEY}:rate_limit`;
const HEALTH_BEACON_KEY = (projectId, reason) => `${STORAGE_BASE_KEY}:beacon:${projectId}:${reason}`;
const SESSION_STORAGE_KEY = (id) => id ? `${STORAGE_BASE_KEY}:${id}:session` : `${STORAGE_BASE_KEY}:session`;
const BROADCAST_CHANNEL_NAME = (id) => id ? `${STORAGE_BASE_KEY}:${id}:broadcast` : `${STORAGE_BASE_KEY}:broadcast`;
const SESSION_COUNTS_KEY = (userId, sessionId) => `${STORAGE_BASE_KEY}:${userId}:session_counts:${sessionId}`;
const SESSION_COUNTS_EXPIRY_MS = 7 * 24 * 60 * 60 * 1e3;
const SESSION_COUNTS_LAST_CLEANUP_KEY = `${STORAGE_BASE_KEY}:session_counts_last_cleanup`;
const SESSION_COUNTS_CLEANUP_THROTTLE_MS = 60 * 60 * 1e3;
const IDENTITY_KEY = (projectId) => projectId ? `${STORAGE_BASE_KEY}:${projectId}:identity` : `${STORAGE_BASE_KEY}:identity`;
const PENDING_IDENTITY_KEY = `${STORAGE_BASE_KEY}:pending_identity`;
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
  constructor(message, statusCode, responseCode) {
    super(message);
    this.statusCode = statusCode;
    this.responseCode = responseCode;
    this.name = "PermanentError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PermanentError);
    }
  }
  statusCode;
  responseCode;
}
class RateLimitError extends Error {
  constructor(message) {
    super(message);
    this.name = "RateLimitError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RateLimitError);
    }
  }
}
class TimeoutError extends Error {
  constructor(message) {
    super(message);
    this.name = "TimeoutError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TimeoutError);
    }
  }
}
var EventType = /* @__PURE__ */ ((EventType2) => {
  EventType2["PAGE_VIEW"] = "page_view";
  EventType2["CLICK"] = "click";
  EventType2["SCROLL"] = "scroll";
  EventType2["SESSION_START"] = "session_start";
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
  errorCode;
  layer;
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
  timeoutMs;
}
const CLICK_ID_PARAMS = ["gclid", "gbraid", "wbraid", "fbclid", "ttclid"];
const getClickIds = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const clickIds = {};
  CLICK_ID_PARAMS.forEach((param) => {
    const value = urlParams.get(param);
    if (value) {
      clickIds[param] = value;
    }
  });
  const result = Object.keys(clickIds).length ? clickIds : void 0;
  return result;
};
const INGEST_HOST = "https://ingest.tracelog.io";
const LOG_STYLE_ACTIVE = "background: #ff9800; color: white; font-weight: bold; padding: 2px 8px; border-radius: 3px;";
const LOG_STYLE_DISABLED = "background: #9e9e9e; color: white; font-weight: bold; padding: 2px 8px; border-radius: 3px;";
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
  const { error, data, showToClient = false, style, visibility } = extra ?? {};
  const formattedMsg = error ? formatLogMsg(msg, error) : `[TraceLog] ${msg}`;
  const method = type === "error" ? "error" : type === "warn" ? "warn" : "log";
  {
    outputLog(method, formattedMsg, style, data);
    return;
  }
};
const outputLog = (method, formattedMsg, style, data) => {
  const hasStyle = style !== void 0 && style !== "";
  const styledMsg = hasStyle ? `%c${formattedMsg}` : formattedMsg;
  if (data !== void 0) {
    if (hasStyle) {
      console[method](styledMsg, style, data);
    } else {
      console[method](styledMsg, data);
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
const UNKNOWN = "Unknown";
const detectOS = (nav) => {
  const platform = nav.userAgentData?.platform;
  if (platform != null && platform !== "") {
    if (/windows/i.test(platform)) return "Windows";
    if (/macos/i.test(platform)) return "macOS";
    if (/android/i.test(platform)) return "Android";
    if (/linux/i.test(platform)) return "Linux";
    if (/chromeos/i.test(platform)) return "ChromeOS";
    if (/ios/i.test(platform)) return "iOS";
  }
  const ua = navigator.userAgent;
  if (/Windows/i.test(ua)) return "Windows";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Mac OS X|Macintosh/i.test(ua)) return "macOS";
  if (/Android/i.test(ua)) return "Android";
  if (/CrOS/i.test(ua)) return "ChromeOS";
  if (/Linux/i.test(ua)) return "Linux";
  return UNKNOWN;
};
const detectBrowser = (nav) => {
  const brands = nav.userAgentData?.brands;
  if (brands != null && brands.length > 0) {
    const validBrands = brands.filter((b2) => !/not.?a.?brand|chromium/i.test(b2.brand));
    const firstBrand = validBrands[0];
    if (firstBrand != null) {
      const brand = firstBrand.brand;
      if (/google chrome/i.test(brand)) return "Chrome";
      if (/microsoft edge/i.test(brand)) return "Edge";
      if (/opera/i.test(brand)) return "Opera";
      return brand;
    }
  }
  const ua = navigator.userAgent;
  if (/Edg\//i.test(ua)) return "Edge";
  if (/OPR\//i.test(ua)) return "Opera";
  if (/Chrome/i.test(ua)) return "Chrome";
  if (/Firefox/i.test(ua)) return "Firefox";
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return "Safari";
  return UNKNOWN;
};
const getDeviceType = () => {
  try {
    const nav = navigator;
    if (nav.userAgentData != null && typeof nav.userAgentData.mobile === "boolean") {
      const uaPlatform = nav.userAgentData.platform;
      if (uaPlatform != null && uaPlatform !== "" && /ipad|tablet/i.test(uaPlatform)) {
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
    log("debug", "Device detection failed, defaulting to desktop", { error });
    return DeviceType.Desktop;
  }
};
const getDeviceInfo = () => {
  try {
    const nav = navigator;
    return {
      type: getDeviceType(),
      os: detectOS(nav),
      browser: detectBrowser(nav)
    };
  } catch (error) {
    log("debug", "Device info detection failed, using defaults", { error });
    return {
      type: DeviceType.Desktop,
      os: UNKNOWN,
      browser: UNKNOWN
    };
  }
};
const MAX_ERROR_MESSAGE_LENGTH = 500;
const MAX_STACK_TRACE_LENGTH = 2e3;
const ERROR_SUPPRESSION_WINDOW_MS = 5e3;
const MAX_TRACKED_ERRORS = 50;
const MAX_TRACKED_ERRORS_HARD_LIMIT = MAX_TRACKED_ERRORS * 2;
const DEFAULT_ERROR_SAMPLING_RATE = 1;
const ERROR_BURST_WINDOW_MS = 1e3;
const ERROR_BURST_THRESHOLD = 10;
const ERROR_BURST_BACKOFF_MS = 5e3;
const MAX_ERRORS_PER_SIGNATURE_PER_PAGEVIEW = 3;
const MAX_PAGEVIEW_SIGNATURE_KEYS = 200;
const PERMANENT_ERROR_LOG_THROTTLE_MS = 6e4;
const MAX_RESPONSE_CODE_LENGTH = 64;
const HEALTH_BEACON_THROTTLE_MS = 10 * 6e4;
const MAX_BEACON_ERROR_LENGTH = 200;
const WEB_VITALS_GOOD_THRESHOLDS = {
  LCP: 2500,
  FCP: 1800,
  CLS: 0.1,
  INP: 200,
  TTFB: 800
};
const WEB_VITALS_NEEDS_IMPROVEMENT_THRESHOLDS = {
  LCP: 2500,
  FCP: 1800,
  CLS: 0.1,
  INP: 200,
  TTFB: 800
};
const WEB_VITALS_POOR_THRESHOLDS = {
  LCP: 4e3,
  FCP: 3e3,
  CLS: 0.25,
  INP: 500,
  TTFB: 1800
};
const DEFAULT_WEB_VITALS_MODE = "needs-improvement";
const getWebVitalsThresholds = (mode = DEFAULT_WEB_VITALS_MODE) => {
  switch (mode) {
    case "all":
      return { LCP: 0, FCP: 0, CLS: 0, INP: 0, TTFB: 0 };
    case "needs-improvement":
      return WEB_VITALS_NEEDS_IMPROVEMENT_THRESHOLDS;
    case "poor":
      return WEB_VITALS_POOR_THRESHOLDS;
    default:
      return WEB_VITALS_NEEDS_IMPROVEMENT_THRESHOLDS;
  }
};
const MAX_NAVIGATION_HISTORY = 50;
const version = "3.2.0";
const LIB_VERSION = version;
const isBrowserEnvironment = () => {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
};
const cleanUrlParameter = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    params.delete(QA_MODE_URL_PARAM);
    const search = params.toString();
    const url = window.location.pathname + (search ? "?" + search : "") + window.location.hash;
    window.history.replaceState({}, "", url);
  } catch {
  }
};
const detectQaMode = () => {
  if (!isBrowserEnvironment()) {
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
        visibility: "qa",
        style: LOG_STYLE_ACTIVE
      });
    } else if (urlParam === QA_MODE_DISABLE_VALUE) {
      newState = false;
      sessionStorage.setItem(QA_MODE_KEY, "false");
      log("info", "QA Mode DISABLED", {
        visibility: "qa",
        style: LOG_STYLE_DISABLED
      });
    }
    if (urlParam === QA_MODE_ENABLE_VALUE || urlParam === QA_MODE_DISABLE_VALUE) {
      cleanUrlParameter();
    }
    return newState ?? storedState === "true";
  } catch {
    return false;
  }
};
const mode_utils = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  detectQaMode
}, Symbol.toStringTag, { value: "Module" }));
const isPrerendering = () => typeof document !== "undefined" && document.prerendering === true;
const isValidUrl = (url) => {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
};
const generateHostedApiUrl = (projectId) => {
  return `${INGEST_HOST}/p/${encodeURIComponent(projectId)}/collect`;
};
const generateFirstPartyApiUrl = (projectId) => {
  try {
    const url = new URL(window.location.href);
    const host = url.hostname;
    if (!host || typeof host !== "string") {
      throw new Error("Invalid hostname");
    }
    if (host === "localhost" || host === "127.0.0.1" || /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) {
      throw new Error(
        "SaaS integration requires a domain hostname; localhost and IP addresses are not supported. For local development, omit `integrations.tracelog` to run in standalone mode (events emitted locally, no network requests), or test against a staging domain that resolves to your dev machine via /etc/hosts."
      );
    }
    const parts = host.split(".");
    if (!parts || !Array.isArray(parts) || parts.length === 0 || parts.length === 1 && parts[0] === "") {
      throw new Error("Invalid hostname structure");
    }
    if (parts.length === 1) {
      throw new Error("Single-part domain not supported for SaaS integration");
    }
    const cleanDomain = parts.length === 2 ? parts.join(".") : parts.slice(-2).join(".");
    if (!cleanDomain || cleanDomain.split(".").length < 2) {
      throw new Error("Invalid domain structure for SaaS");
    }
    const collectApiUrl = `https://${projectId}.${cleanDomain}/collect`;
    if (!isValidUrl(collectApiUrl)) {
      throw new Error("Generated URL failed validation");
    }
    return collectApiUrl;
  } catch (error) {
    throw new Error(`Invalid SaaS URL configuration: ${error instanceof Error ? error.message : String(error)}`);
  }
};
const getCollectApiUrls = (config) => {
  const urls = {};
  const tracelog2 = config.integrations?.tracelog;
  if (tracelog2?.projectId) {
    urls.saas = tracelog2.firstParty ? generateFirstPartyApiUrl(tracelog2.projectId) : generateHostedApiUrl(tracelog2.projectId);
  }
  return urls;
};
const normalizeUrl = (url, sensitiveQueryParams = []) => {
  if (!url || typeof url !== "string") {
    log("warn", "Invalid URL provided to normalizeUrl", { data: { type: typeof url } });
    return url || "";
  }
  try {
    let urlObject;
    let isRelative = false;
    try {
      urlObject = new URL(url);
    } catch {
      const base = window.location.href;
      urlObject = new URL(url, base);
      isRelative = urlObject.origin === new URL(base).origin;
    }
    const searchParams = urlObject.searchParams;
    const allSensitiveParams = [.../* @__PURE__ */ new Set([...DEFAULT_SENSITIVE_QUERY_PARAMS, ...sensitiveQueryParams])];
    let hasChanged = false;
    for (const param of allSensitiveParams) {
      if (searchParams.has(param)) {
        searchParams.delete(param);
        hasChanged = true;
      }
    }
    if (!hasChanged && (isRelative || url.includes("?"))) {
      return url;
    }
    urlObject.search = searchParams.toString();
    return isRelative ? `${urlObject.pathname}${urlObject.search}${urlObject.hash}` : urlObject.toString();
  } catch (error) {
    log("warn", "URL normalization failed, returning original", { error, data: { urlLength: url?.length } });
    return url;
  }
};
const COMPOUND_TLDS = [
  "co.uk",
  "org.uk",
  "com.au",
  "net.au",
  "com.br",
  "co.nz",
  "co.jp",
  "com.mx",
  "co.in",
  "com.cn",
  "co.za"
];
const getRootDomain = (hostname) => {
  const parts = hostname.toLowerCase().split(".");
  if (parts.length <= 2) {
    return hostname.toLowerCase();
  }
  const lastTwo = parts.slice(-2).join(".");
  if (COMPOUND_TLDS.includes(lastTwo)) {
    return parts.slice(-3).join(".");
  }
  return parts.slice(-2).join(".");
};
const isSameDomain = (hostname1, hostname2) => {
  if (hostname1 === hostname2) {
    return true;
  }
  return getRootDomain(hostname1) === getRootDomain(hostname2);
};
const getExternalReferrer = (sensitiveQueryParams = []) => {
  const referrer = document.referrer;
  if (!referrer) {
    return "Direct";
  }
  try {
    const referrerHostname = new URL(referrer).hostname.toLowerCase();
    const currentHostname = window.location.hostname.toLowerCase();
    if (isSameDomain(referrerHostname, currentHostname)) {
      return "Direct";
    }
    return normalizeUrl(referrer, sensitiveQueryParams);
  } catch (error) {
    log("debug", "Failed to parse referrer URL, using raw value", { error, data: { referrer } });
    return referrer;
  }
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
    const r2 = Math.random() * 16 | 0;
    const v2 = c2 === "x" ? r2 : r2 & 3 | 8;
    return v2.toString(16);
  });
};
let eventSequence = 0;
let lastEventTimestamp = 0;
const generateEventId = () => {
  let timestamp = Date.now();
  if (timestamp < lastEventTimestamp) {
    timestamp = lastEventTimestamp;
  }
  if (timestamp === lastEventTimestamp) {
    eventSequence = (eventSequence + 1) % 1e3;
  } else {
    eventSequence = 0;
  }
  lastEventTimestamp = timestamp;
  const sequence = eventSequence.toString().padStart(3, "0");
  let random = "";
  try {
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      const bytes = crypto.getRandomValues(new Uint8Array(3));
      if (bytes) {
        random = Array.from(bytes, (b2) => b2.toString(16).padStart(2, "0")).join("");
      }
    }
  } catch {
  }
  if (!random) {
    random = Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
  }
  return `${timestamp}-${sequence}-${random}`;
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
        valueLength: value.length
      }
    });
  }
  const result = sanitized.trim();
  return result;
};
const sanitizeValue = (value, depth = 0) => {
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
  if (depth > MAX_OBJECT_DEPTH) {
    return null;
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
const PII_PATTERNS = [
  // Email addresses.
  // Quantifiers are bounded (local part ≤64, each label ≤63, TLD ≤63 per RFC/DNS limits)
  // and the domain is matched as discrete dot-separated labels so the local-part and
  // domain classes never overlap. This keeps matching linear and prevents catastrophic
  // backtracking (ReDoS) on long, dot-heavy inputs that contain no real email.
  /\b[A-Za-z0-9._%+-]{1,64}@(?:[A-Za-z0-9-]{1,63}\.)+[A-Za-z]{2,63}\b/gi,
  // US Phone numbers (various formats)
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
  // Credit card numbers (16 digits with optional separators)
  /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  // IBAN (International Bank Account Number)
  /\b[A-Z]{2}\d{2}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/gi,
  // API keys / tokens (sk_test_, sk_live_, pk_test_, pk_live_, …)
  /\b[sp]k_(test|live)_[a-zA-Z0-9]{10,}\b/gi,
  // Bearer tokens (JWT-like patterns — matches complete and partial tokens)
  /Bearer\s+[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)?(?:\.[A-Za-z0-9_-]+)?/gi,
  // Passwords in connection strings (protocol://user:password@host)
  /:\/\/[^:/]+:([^@]+)@/gi,
  // Sensitive URL query parameters (token=, password=, auth=, secret=, api_key=, …)
  /[?&](token|password|passwd|auth|secret|secret_key|private_key|auth_key|api_key|apikey|access_token)=[^&\s]+/gi
];
const sanitizePii = (text) => {
  let sanitized = text;
  for (const pattern of PII_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[REDACTED]");
  }
  return sanitized;
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
  if (config.sendIntervalMs !== void 0) {
    if (!Number.isFinite(config.sendIntervalMs) || config.sendIntervalMs < MIN_SEND_INTERVAL_MS || config.sendIntervalMs > MAX_SEND_INTERVAL_MS_CONFIG) {
      throw new AppConfigValidationError(VALIDATION_MESSAGES.INVALID_SEND_INTERVAL, "config");
    }
  }
  if (config.flushOnSpaNavigation !== void 0 && typeof config.flushOnSpaNavigation !== "boolean") {
    throw new AppConfigValidationError(
      `Invalid flushOnSpaNavigation type: ${typeof config.flushOnSpaNavigation}. Must be a boolean`,
      "config"
    );
  }
  if (config.flushOnPageHidden !== void 0 && typeof config.flushOnPageHidden !== "boolean") {
    throw new AppConfigValidationError(
      `Invalid flushOnPageHidden type: ${typeof config.flushOnPageHidden}. Must be a boolean`,
      "config"
    );
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
    const validKeys = ["LCP", "FCP", "CLS", "INP", "TTFB"];
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
const validateIntegrations = (integrations) => {
  if (!integrations) {
    return;
  }
  if (integrations.tracelog) {
    if (!integrations.tracelog.projectId || typeof integrations.tracelog.projectId !== "string" || integrations.tracelog.projectId.trim() === "") {
      throw new IntegrationValidationError(VALIDATION_MESSAGES.INVALID_TRACELOG_PROJECT_ID, "config");
    }
    if (integrations.tracelog.shopify !== void 0 && typeof integrations.tracelog.shopify !== "boolean") {
      throw new IntegrationValidationError("tracelog.shopify must be a boolean", "config");
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
    sendIntervalMs: config?.sendIntervalMs ?? EVENT_SENT_INTERVAL_MS,
    flushOnSpaNavigation: config?.flushOnSpaNavigation ?? false,
    flushOnPageHidden: config?.flushOnPageHidden ?? true
  };
  return normalizedConfig;
};
const isSerializable = (value, seen = /* @__PURE__ */ new Set()) => {
  if (value === null || value === void 0) {
    return true;
  }
  const type = typeof value;
  if (type === "string" || type === "number" || type === "boolean") {
    return true;
  }
  if (type === "function" || type === "symbol" || type === "bigint") {
    return false;
  }
  if (seen.has(value)) {
    return false;
  }
  seen.add(value);
  if (Array.isArray(value)) {
    return value.every((item) => isSerializable(item, seen));
  }
  if (type === "object") {
    return Object.values(value).every((v2) => isSerializable(v2, seen));
  }
  return false;
};
const isOnlyPrimitiveFields = (object) => {
  if (typeof object !== "object" || object === null) {
    return false;
  }
  return isSerializable(object);
};
const sanitizeTraits = (traits) => {
  if (typeof traits !== "object" || traits === null || Array.isArray(traits)) return void 0;
  const filtered = {};
  for (const [key, value] of Object.entries(traits)) {
    if (typeof value === "string") filtered[key] = value;
  }
  return Object.keys(filtered).length > 0 ? filtered : void 0;
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
  const byteSize = new TextEncoder().encode(jsonString).byteLength;
  if (byteSize > MAX_CUSTOM_EVENT_STRING_SIZE) {
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
    for (let i2 = 0; i2 < metadata.length; i2++) {
      const item = metadata[i2];
      if (typeof item !== "object" || item === null || Array.isArray(item)) {
        return {
          valid: false,
          error: `${intro}: array item at index ${i2} must be an object.`
        };
      }
      const itemValidation = validateSingleMetadata(eventName, item, type);
      if (!itemValidation.valid) {
        return {
          valid: false,
          error: `${intro}: array item at index ${i2} is invalid: ${itemValidation.error}`
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
const URL_PATTERN = /https?:\/\/\S+/g;
const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const HEX_ADDR_PATTERN = /0x[0-9a-fA-F]{4,}/g;
const LONG_NUMBER_PATTERN = /(?<!\d)\d{4,}(?!\d)/g;
const LONG_QUOTED_PATTERN = /(['"])[^'"]{20,}\1/g;
function normalizeErrorMessage(message) {
  return message.replace(URL_PATTERN, "[URL]").replace(UUID_PATTERN, "[ID]").replace(HEX_ADDR_PATTERN, "[ADDR]").replace(LONG_NUMBER_PATTERN, "[N]").replace(LONG_QUOTED_PATTERN, "$1[VAR]$1").toLowerCase().trim();
}
function stripQueryHash(value) {
  const cut = value.search(/[?#]/);
  return cut === -1 ? value : value.slice(0, cut);
}
function normalizeFilename(filename, pageUrl) {
  const raw = stripQueryHash((filename ?? "").trim());
  if (!raw) return "";
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return raw;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
  const page = stripQueryHash((pageUrl ?? "").trim());
  if (page && raw === page) return parsed.origin;
  return raw;
}
function buildErrorSignatureKey(input) {
  const message = normalizeErrorMessage(input.message);
  const filename = normalizeFilename(input.filename, input.page_url);
  const line = input.line == null ? "" : String(input.line);
  return `${message}|${filename}|${line}`;
}
const globalState = { config: {} };
class StateManager {
  /**
   * Retrieves a value from global state.
   */
  get(key) {
    return globalState[key];
  }
  /**
   * Sets a value in global state.
   */
  set(key, value) {
    globalState[key] = value;
  }
  /**
   * Returns an immutable snapshot of the entire global state.
   */
  getState() {
    return { ...globalState };
  }
}
class SenderManager extends StateManager {
  storeManager;
  apiUrl;
  lastPermanentErrorLog = null;
  /**
   * In-memory fallback for the beacon throttle when localStorage is
   * unavailable. The primary throttle state lives in localStorage (see
   * {@link HEALTH_BEACON_KEY}) so it survives MPA navigations and is shared
   * across tabs.
   */
  lastBeaconAt = {};
  recoveryInProgress = false;
  lastMetadataTimestamp = 0;
  pendingControllers = /* @__PURE__ */ new Set();
  /**
   * Counts consecutive fetch() rejections where no HTTP response was received
   * (DNS failure, connection refused). Resets on success. When this reaches
   * MAX_CONSECUTIVE_NETWORK_FAILURES the circuit opens and further send attempts
   * are skipped until CIRCUIT_BREAKER_COOLDOWN_MS elapses.
   */
  consecutiveNetworkFailures = 0;
  circuitOpenedAt = 0;
  /**
   * Timestamp (epoch ms) before which `send()` must skip fetch() calls due to a
   * prior 429 response. Mirrored to `localStorage` (keyed by userId) so the
   * cooldown survives page navigations on traditional server-rendered sites and
   * is discoverable by other tabs on the same origin.
   */
  rateLimitedUntil = 0;
  /**
   * Storage key used when the current in-memory cooldown was armed. Captured at
   * arm time so identity changes mid-cooldown can't make persist/clear
   * operations target the wrong key.
   */
  rateLimitStorageKeyAtArm = null;
  constructor(storeManager, apiUrl) {
    super();
    this.storeManager = storeManager;
    this.apiUrl = apiUrl;
    this.migrateLegacyV2Keys();
    this.rateLimitedUntil = this.loadRateLimitCooldown();
  }
  /**
   * Migrates v2 multi-integration localStorage keys to the v3 single-integration layout.
   *
   * V2 stored per-integration suffixes (`tlog:{userId}:queue:saas`,
   * `tlog:{userId}:queue:custom`, plus matching `:rate_limit:saas` / `:rate_limit:custom`).
   * V3 is SaaS-only, so the `:saas` queue is merged into the new unscoped key
   * `tlog:{userId}:queue` while preserving the original `timestamp` (so the
   * expiry check still applies) and bumping `recoveryFailures` if both keys
   * carry one. The `:custom` queue is intentionally discarded — its events were
   * destined for a different backend that no longer exists in v3; forwarding
   * them to SaaS would be data leakage. The legacy keys are removed in all
   * cases so the migration is one-shot per browser.
   */
  migrateLegacyV2Keys() {
    const userId = this.get("userId") || "anonymous";
    const legacySaasQueueKey = `${QUEUE_KEY(userId)}:saas`;
    const legacyCustomQueueKey = `${QUEUE_KEY(userId)}:custom`;
    const legacySaasRateLimitKey = `${RATE_LIMIT_KEY(userId)}:saas`;
    const legacyCustomRateLimitKey = `${RATE_LIMIT_KEY(userId)}:custom`;
    try {
      const legacyRaw = this.storeManager.getItem(legacySaasQueueKey);
      if (legacyRaw) {
        const targetKey = this.getQueueStorageKey();
        const currentRaw = this.storeManager.getItem(targetKey);
        if (!currentRaw) {
          this.storeManager.setItem(targetKey, legacyRaw);
          log("debug", "Migrated v2 SaaS queue to v3 unscoped key");
        } else {
          this.mergeLegacyIntoCurrent(targetKey, legacyRaw, currentRaw);
        }
        this.storeManager.removeItem(legacySaasQueueKey);
      }
    } catch (error) {
      log("debug", "Failed to migrate v2 SaaS queue, discarding legacy key", { error });
      try {
        this.storeManager.removeItem(legacySaasQueueKey);
      } catch {
      }
    }
    [legacyCustomQueueKey, legacySaasRateLimitKey, legacyCustomRateLimitKey].forEach((key) => {
      try {
        if (this.storeManager.getItem(key) !== null) {
          this.storeManager.removeItem(key);
        }
      } catch {
      }
    });
  }
  mergeLegacyIntoCurrent(targetKey, legacyRaw, currentRaw) {
    try {
      const legacy = JSON.parse(legacyRaw);
      const current = JSON.parse(currentRaw);
      if (!Array.isArray(legacy?.events) || !Array.isArray(current?.events)) {
        log("debug", "Legacy or current queue malformed, keeping current only");
        return;
      }
      const seen = new Set(current.events.map((e3) => e3.id));
      const mergedEvents = [
        ...current.events,
        ...legacy.events.filter((e3) => typeof e3.id === "string" && !seen.has(e3.id))
      ];
      const merged = {
        ...current,
        events: mergedEvents,
        timestamp: typeof current.timestamp === "number" && typeof legacy.timestamp === "number" ? Math.min(current.timestamp, legacy.timestamp) : current.timestamp ?? legacy.timestamp ?? Date.now(),
        recoveryFailures: Math.max(current.recoveryFailures ?? 0, legacy.recoveryFailures ?? 0) || void 0
      };
      this.storeManager.setItem(targetKey, JSON.stringify(merged));
      log("debug", "Merged v2 SaaS queue into existing v3 queue", {
        data: { added: mergedEvents.length - current.events.length, total: mergedEvents.length }
      });
    } catch (error) {
      log("debug", "Failed to merge legacy queue, keeping current", { error });
    }
  }
  getQueueStorageKey() {
    const userId = this.get("userId") || "anonymous";
    return QUEUE_KEY(userId);
  }
  getRateLimitStorageKey() {
    const userId = this.get("userId") || "anonymous";
    return RATE_LIMIT_KEY(userId);
  }
  getActiveRateLimitKey() {
    return this.rateLimitStorageKeyAtArm ?? this.getRateLimitStorageKey();
  }
  armRateLimitCooldown(until) {
    this.rateLimitedUntil = until;
    this.rateLimitStorageKeyAtArm = this.getRateLimitStorageKey();
    this.persistRateLimitCooldown(until);
  }
  loadRateLimitCooldown() {
    const key = this.getRateLimitStorageKey();
    try {
      const raw = this.storeManager.getItem(key);
      if (!raw) return 0;
      const value = Number(raw);
      if (!Number.isFinite(value) || value <= Date.now()) {
        this.storeManager.removeItem(key);
        return 0;
      }
      this.rateLimitStorageKeyAtArm = key;
      return value;
    } catch {
      return 0;
    }
  }
  persistRateLimitCooldown(until) {
    const key = this.getActiveRateLimitKey();
    try {
      const raw = this.storeManager.getItem(key);
      if (raw) {
        const existing = Number(raw);
        if (Number.isFinite(existing) && existing >= until) {
          return;
        }
      }
      this.storeManager.setItem(key, String(until));
    } catch {
    }
  }
  clearRateLimitCooldown() {
    const key = this.getActiveRateLimitKey();
    try {
      const raw = this.storeManager.getItem(key);
      if (raw) {
        const stored = Number(raw);
        if (Number.isFinite(stored) && stored > Date.now()) {
          this.rateLimitedUntil = stored;
          return;
        }
      }
      this.storeManager.removeItem(key);
    } catch {
    }
    this.rateLimitedUntil = 0;
    this.rateLimitStorageKeyAtArm = null;
  }
  isRateLimited() {
    if (this.rateLimitedUntil === 0) {
      this.rateLimitedUntil = this.loadRateLimitCooldown();
    }
    if (this.rateLimitedUntil === 0) return false;
    if (Date.now() >= this.rateLimitedUntil) {
      this.clearRateLimitCooldown();
      if (this.rateLimitedUntil === 0) return false;
    }
    return true;
  }
  /**
   * Sends events synchronously using `navigator.sendBeacon()`.
   *
   * Falls back to localStorage persistence on rate-limit cooldown, beacon
   * rejection, or oversized payloads.
   */
  sendEventsQueueSync(body) {
    if (this.isRateLimited()) {
      log("debug", "Rate-limit cooldown active, skipping sync send", {
        data: {
          cooldownRemainingMs: this.rateLimitedUntil - Date.now(),
          events: body.events.length
        }
      });
      const stableBody = this.ensureBatchMetadata(body);
      const existing = this.getPersistedData();
      const existingFailures = typeof existing?.recoveryFailures === "number" && Number.isFinite(existing.recoveryFailures) ? existing.recoveryFailures : 0;
      this.persistEventsWithFailureCount(stableBody, existingFailures, true);
      return false;
    }
    if (this.apiUrl.includes(SpecialApiUrl.Fail)) {
      log("warn", "Fail mode: simulating network failure (sync)", { data: { events: body.events.length } });
      return false;
    }
    if (this.apiUrl.includes(SpecialApiUrl.Localhost)) {
      log("debug", "Success mode: simulating successful send (sync)", { data: { events: body.events.length } });
      return true;
    }
    return this.sendQueueSyncInternal(body);
  }
  /**
   * Sends events asynchronously using `fetch()` with retry, circuit breaker, and 429 cooldown.
   * Persists on failure for recovery on next page load.
   */
  async sendEventsQueue(body, callbacks) {
    const stableBody = this.ensureBatchMetadata(body);
    try {
      const success = await this.send(stableBody);
      if (success) {
        this.clearPersistedEvents();
        callbacks?.onSuccess?.(stableBody.events.length, stableBody.events, stableBody);
      } else {
        this.persistEvents(stableBody);
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
      this.persistEvents(stableBody);
      callbacks?.onFailure?.();
      return false;
    }
  }
  /**
   * Recovers and attempts to resend events persisted from a previous session.
   *
   * Idempotent: safe to call multiple times (recovery flag prevents concurrent attempts).
   */
  async recoverPersistedEvents(callbacks) {
    if (this.recoveryInProgress) {
      log("debug", "Recovery already in progress, skipping duplicate attempt");
      return;
    }
    this.recoveryInProgress = true;
    let recoveryBody = null;
    let recoveryFailures = 0;
    try {
      const persistedData = this.getPersistedData();
      if (!persistedData || !this.isDataRecent(persistedData) || persistedData.events.length === 0) {
        this.clearPersistedEvents();
        return;
      }
      const rawFailures = persistedData.recoveryFailures;
      recoveryFailures = typeof rawFailures === "number" && Number.isFinite(rawFailures) && rawFailures >= 0 ? rawFailures : 0;
      if (recoveryFailures >= MAX_RECOVERY_FAILURES) {
        log("debug", `Discarding persisted events after ${recoveryFailures} failed recovery attempts`);
        this.clearPersistedEvents();
        callbacks?.onFailure?.();
        return;
      }
      if (this.isRateLimited()) {
        log("debug", "Rate-limit cooldown active, deferring recovery", {
          data: { cooldownRemainingMs: this.rateLimitedUntil - Date.now() }
        });
        callbacks?.onFailure?.();
        return;
      }
      recoveryBody = this.ensureBatchMetadata(this.createRecoveryBody(persistedData));
      if (recoveryBody.events.length === 0) {
        log("debug", "All persisted events exceeded the recovery age cutoff; discarding batch");
        this.clearPersistedEvents();
        return;
      }
      const success = await this.send(recoveryBody);
      if (success) {
        this.clearPersistedEvents();
        callbacks?.onSuccess?.(persistedData.events.length, persistedData.events, recoveryBody);
      } else {
        this.persistEventsWithFailureCount(recoveryBody, recoveryFailures + 1, true);
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
      if (recoveryBody) {
        this.persistEventsWithFailureCount(recoveryBody, recoveryFailures + 1, true);
      }
      callbacks?.onFailure?.();
    } finally {
      this.recoveryInProgress = false;
    }
  }
  /**
   * Cleanup method called during `App.destroy()`. No-op — persisted events
   * intentionally kept in localStorage for recovery.
   */
  stop() {
  }
  async backoffDelay(attempt) {
    const exponentialDelay = RETRY_BACKOFF_BASE_MS * Math.pow(2, attempt);
    const jitter = Math.random() * RETRY_BACKOFF_JITTER_MS;
    return new Promise((resolve) => setTimeout(resolve, exponentialDelay + jitter));
  }
  async send(body) {
    const requestBody = this.ensureBatchMetadata(body, body._metadata?.idempotency_token);
    if (this.apiUrl.includes(SpecialApiUrl.Fail)) {
      log("debug", "Fail mode: simulating network failure", { data: { events: requestBody.events.length } });
      return false;
    }
    if (this.apiUrl.includes(SpecialApiUrl.Localhost)) {
      log("debug", "Success mode: simulating successful send", { data: { events: requestBody.events.length } });
      return true;
    }
    if (this.isRateLimited()) {
      log("debug", "Rate-limit cooldown active, skipping send", {
        data: {
          cooldownRemainingMs: this.rateLimitedUntil - Date.now(),
          events: requestBody.events.length
        }
      });
      return false;
    }
    if (this.consecutiveNetworkFailures >= MAX_CONSECUTIVE_NETWORK_FAILURES) {
      const elapsed = Date.now() - this.circuitOpenedAt;
      if (elapsed < CIRCUIT_BREAKER_COOLDOWN_MS) {
        log("debug", "Network circuit open, skipping send", {
          data: {
            consecutiveNetworkFailures: this.consecutiveNetworkFailures,
            cooldownRemainingMs: CIRCUIT_BREAKER_COOLDOWN_MS - elapsed
          }
        });
        return false;
      }
    }
    const { url, payload } = this.prepareRequest(requestBody);
    let allTimeouts = true;
    let hadHttpResponse = false;
    for (let attempt = 1; attempt <= MAX_SEND_RETRIES + 1; attempt++) {
      try {
        const response = await this.sendWithTimeout(url, payload);
        if (response.ok) {
          if (attempt > 1) {
            log("info", `Send succeeded after ${attempt - 1} retry attempt(s)`, {
              data: { events: requestBody.events.length, attempt }
            });
          }
          this.consecutiveNetworkFailures = 0;
          this.circuitOpenedAt = 0;
          return true;
        }
        return false;
      } catch (error) {
        const isLastAttempt = attempt === MAX_SEND_RETRIES + 1;
        if (error instanceof PermanentError) {
          this.consecutiveNetworkFailures = 0;
          this.circuitOpenedAt = 0;
          if (error.statusCode === 403) {
            this.emitHealthBeacon("events_blocked", error.message);
          }
          throw error;
        }
        if (error instanceof RateLimitError) {
          this.consecutiveNetworkFailures = 0;
          this.circuitOpenedAt = 0;
          allTimeouts = false;
          hadHttpResponse = true;
          this.armRateLimitCooldown(Date.now() + RATE_LIMIT_COOLDOWN_MS);
          log("warn", "Rate limited, skipping retries", {
            data: { events: body.events.length, attempt, cooldownMs: RATE_LIMIT_COOLDOWN_MS }
          });
          break;
        }
        if (!(error instanceof TimeoutError)) {
          allTimeouts = false;
        }
        if (!(error instanceof TypeError)) {
          hadHttpResponse = true;
        }
        log(
          isLastAttempt ? "error" : "warn",
          `Send attempt ${attempt} failed${isLastAttempt ? " (all retries exhausted)" : ", will retry"}`,
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
        if (allTimeouts) {
          log("debug", "All retry attempts timed out, preserving batch for retry", {
            data: { events: requestBody.events.length }
          });
          return false;
        }
        if (!hadHttpResponse) {
          this.consecutiveNetworkFailures = Math.min(
            this.consecutiveNetworkFailures + 1,
            MAX_CONSECUTIVE_NETWORK_FAILURES
          );
          if (this.consecutiveNetworkFailures >= MAX_CONSECUTIVE_NETWORK_FAILURES) {
            this.circuitOpenedAt = Date.now();
          }
        } else {
          this.consecutiveNetworkFailures = 0;
          this.circuitOpenedAt = 0;
        }
        return false;
      }
    }
    return false;
  }
  async sendWithTimeout(url, payload) {
    const controller = new AbortController();
    this.pendingControllers.add(controller);
    let didTimeout = false;
    const timeoutId = setTimeout(() => {
      didTimeout = true;
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
          const responseCode = await this.readTraceLogErrorCode(response);
          const message = responseCode ? `HTTP ${response.status}: ${response.statusText} (${responseCode})` : `HTTP ${response.status}: ${response.statusText}`;
          throw new PermanentError(message, response.status, responseCode);
        }
        if (response.status === 429) {
          throw new RateLimitError(`HTTP 429: ${response.statusText}`);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response;
    } catch (error) {
      if (error instanceof PermanentError) {
        throw error;
      }
      if (didTimeout) {
        throw new TimeoutError("Request timed out");
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
      this.pendingControllers.delete(controller);
    }
  }
  async readTraceLogErrorCode(response) {
    try {
      const body = await response.clone().json();
      if (typeof body.code === "string" && body.code.length > 0 && body.code.length <= MAX_RESPONSE_CODE_LENGTH) {
        return body.code;
      }
    } catch {
    }
    return void 0;
  }
  sendQueueSyncInternal(body) {
    const stableBody = this.ensureBatchMetadata(body);
    const requestBody = this.ensureBatchMetadata(stableBody, stableBody._metadata?.idempotency_token);
    const { url, payload } = this.prepareRequest(requestBody);
    if (payload.length > MAX_BEACON_PAYLOAD_SIZE) {
      log("warn", "Payload exceeds sendBeacon limit, persisting for recovery", {
        data: { size: payload.length, limit: MAX_BEACON_PAYLOAD_SIZE, events: requestBody.events.length }
      });
      this.persistEvents(stableBody);
      return false;
    }
    const blob = new Blob([payload], { type: "application/json" });
    if (!this.isSendBeaconAvailable()) {
      log("warn", "sendBeacon not available, persisting events for recovery");
      this.persistEvents(stableBody);
      return false;
    }
    const accepted = navigator.sendBeacon(url, blob);
    if (!accepted) {
      log("warn", "sendBeacon rejected request, persisting events for recovery");
      this.persistEvents(stableBody);
    }
    return accepted;
  }
  prepareRequest(body) {
    let timestamp = Date.now();
    if (timestamp < this.lastMetadataTimestamp) {
      timestamp = this.lastMetadataTimestamp;
    }
    this.lastMetadataTimestamp = timestamp;
    const enrichedBody = {
      ...body,
      _metadata: {
        ...body._metadata,
        idempotency_token: body._metadata?.idempotency_token ?? this.computeContentToken(body),
        referer: typeof window !== "undefined" ? window.location.href : void 0,
        timestamp,
        client_version: LIB_VERSION
      }
    };
    return {
      url: this.apiUrl,
      payload: JSON.stringify(enrichedBody)
    };
  }
  ensureBatchMetadata(body, preferredToken) {
    const idempotencyToken = body._metadata?.idempotency_token ?? preferredToken ?? this.computeContentToken(body);
    if (body._metadata?.idempotency_token === idempotencyToken) {
      return body;
    }
    return {
      ...body,
      _metadata: {
        ...body._metadata,
        idempotency_token: idempotencyToken
      }
    };
  }
  /**
   * Deterministic 32-bit FNV-1a hash of sorted event IDs, salted with
   * `user_id` and `session_id`. Produces the same idempotency token for the
   * same set of events across retries.
   */
  computeContentToken(body) {
    const ids = body.events.map((e3) => e3.id).sort().join(",");
    const input = `${body.user_id}|${body.session_id}|${ids}`;
    let hash = 2166136261;
    for (let i2 = 0; i2 < input.length; i2++) {
      hash ^= input.charCodeAt(i2);
      hash = Math.imul(hash, 16777619) >>> 0;
    }
    return hash.toString(16).padStart(8, "0");
  }
  getPersistedData() {
    try {
      const storageKey = this.getQueueStorageKey();
      const persistedDataString = this.storeManager.getItem(storageKey);
      if (persistedDataString) {
        return JSON.parse(persistedDataString);
      }
    } catch (error) {
      log("debug", "Failed to parse persisted data", { error });
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
    const { timestamp, recoveryFailures, ...queue } = data;
    const originalEvents = queue.events ?? [];
    const cutoff = Date.now() - MAX_EVENT_AGE_MS_ON_RECOVERY;
    const filteredEvents = originalEvents.filter((event2) => {
      const eventTimestamp = typeof event2.timestamp === "number" ? event2.timestamp : new Date(event2.timestamp).getTime();
      return Number.isFinite(eventTimestamp) && eventTimestamp >= cutoff;
    });
    if (filteredEvents.length < originalEvents.length) {
      log("debug", "Recovery dropped stale events", {
        data: {
          dropped: originalEvents.length - filteredEvents.length,
          kept: filteredEvents.length
        }
      });
    }
    return { ...queue, events: filteredEvents };
  }
  persistEvents(body) {
    const existing = this.getPersistedData();
    const existingFailures = typeof existing?.recoveryFailures === "number" && Number.isFinite(existing.recoveryFailures) ? existing.recoveryFailures : 0;
    return this.persistEventsWithFailureCount(body, existingFailures);
  }
  persistEventsWithFailureCount(body, recoveryFailures, skipThrottle = false) {
    try {
      const existing = this.getPersistedData();
      if (!skipThrottle && existing && existing.timestamp) {
        const timeSinceExisting = Date.now() - existing.timestamp;
        if (timeSinceExisting < PERSISTENCE_THROTTLE_MS) {
          log("debug", "Skipping persistence, another tab recently persisted events", {
            data: { timeSinceExisting }
          });
          return true;
        }
      }
      const persistedData = {
        ...body,
        timestamp: Date.now(),
        ...recoveryFailures > 0 && { recoveryFailures }
      };
      const storageKey = this.getQueueStorageKey();
      this.storeManager.setItem(storageKey, JSON.stringify(persistedData));
      return !!this.storeManager.getItem(storageKey);
    } catch (error) {
      log("debug", "Failed to persist events", { error });
      return false;
    }
  }
  clearPersistedEvents() {
    try {
      const key = this.getQueueStorageKey();
      this.storeManager.removeItem(key);
    } catch (error) {
      log("debug", "Failed to clear persisted events", { error });
    }
  }
  isSendBeaconAvailable() {
    return typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function";
  }
  logPermanentError(context, error) {
    const now = Date.now();
    const key = `${error.statusCode ?? "unknown"}:${error.responseCode ?? ""}`;
    const shouldLog = !this.lastPermanentErrorLog || this.lastPermanentErrorLog.key !== key || now - this.lastPermanentErrorLog.timestamp >= PERMANENT_ERROR_LOG_THROTTLE_MS;
    if (shouldLog) {
      log("error", context, {
        data: { status: error.statusCode, code: error.responseCode, message: error.message }
      });
      this.lastPermanentErrorLog = { key, timestamp: now };
    }
  }
  /**
   * Emits a low-frequency, deduplicated diagnostic "health beacon" to the gate-bypassing
   * `/client-error` endpoint. Best-effort and silent: never blocks, never throws, never logs to the
   * host page. Opt out via `integrations.tracelog.healthBeacon: false`.
   */
  emitHealthBeacon(reason, lastError) {
    try {
      const tracelog2 = this.get("config")?.integrations?.tracelog;
      if (!tracelog2?.projectId || tracelog2.healthBeacon === false) return;
      const url = this.resolveBeaconUrl();
      if (!url) return;
      const origin = typeof window !== "undefined" && window.location ? window.location.origin : "";
      if (!origin) return;
      if (!this.markBeaconEmitted(tracelog2.projectId, reason)) return;
      const payload = JSON.stringify({
        projectId: tracelog2.projectId,
        reason,
        origin,
        ...lastError ? { lastError: lastError.slice(0, MAX_BEACON_ERROR_LENGTH) } : {}
      });
      this.postBeacon(url, payload);
    } catch {
    }
  }
  /**
   * Throttle gate: returns `true` and records the emit timestamp when the
   * beacon may fire, `false` when still inside {@link HEALTH_BEACON_THROTTLE_MS}.
   *
   * State lives in localStorage so the window survives MPA navigations and is
   * shared across tabs; the in-memory map covers storage-disabled browsers.
   * The timestamp is deliberately recorded BEFORE the send attempt: if both
   * transports fail, waiting out the window is fine for a diagnostic signal
   * and avoids turning transport failures into retry bursts.
   */
  markBeaconEmitted(projectId, reason) {
    const now = Date.now();
    const key = HEALTH_BEACON_KEY(projectId, reason);
    let lastEmit = this.lastBeaconAt[reason] ?? 0;
    try {
      const stored = Number(this.storeManager.getItem(key));
      if (Number.isFinite(stored) && stored > lastEmit) {
        lastEmit = stored;
      }
    } catch {
    }
    if (now - lastEmit < HEALTH_BEACON_THROTTLE_MS) return false;
    this.lastBeaconAt[reason] = now;
    try {
      this.storeManager.setItem(key, String(now));
    } catch {
    }
    return true;
  }
  /** The collect URL the lib already derived, with the path swapped to the diagnostics route. */
  resolveBeaconUrl() {
    if (this.apiUrl.includes(SpecialApiUrl.Localhost) || this.apiUrl.includes(SpecialApiUrl.Fail)) return null;
    if (!/\/collect$/.test(this.apiUrl)) return null;
    return this.apiUrl.replace(/\/collect$/, "/client-error");
  }
  postBeacon(url, payload) {
    if (this.isSendBeaconAvailable()) {
      const blob = new Blob([payload], { type: "application/json" });
      if (navigator.sendBeacon(url, blob)) return;
    }
    if (typeof fetch === "function") {
      void fetch(url, {
        method: "POST",
        body: payload,
        keepalive: true,
        headers: { "Content-Type": "application/json" }
      }).catch(() => void 0);
    }
  }
}
class TimeManager extends StateManager {
  bootTime;
  bootTimestamp;
  hasPerformanceNow;
  constructor() {
    super();
    if (typeof window === "undefined") {
      this.hasPerformanceNow = false;
      this.bootTime = 0;
      this.bootTimestamp = 0;
      return;
    }
    this.hasPerformanceNow = typeof performance !== "undefined" && typeof performance.now === "function";
    if (this.hasPerformanceNow) {
      this.bootTime = performance.now();
      this.bootTimestamp = Date.now();
    } else {
      this.bootTime = 0;
      this.bootTimestamp = Date.now();
      log("debug", "performance.now() not available, falling back to Date.now()");
    }
  }
  /**
   * Returns current timestamp in milliseconds since epoch, immune to clock
   * changes during the session.
   */
  now() {
    if (!this.hasPerformanceNow) {
      return Date.now();
    }
    const elapsed = performance.now() - this.bootTime;
    return Math.round(this.bootTimestamp + elapsed);
  }
  /**
   * Validates a timestamp is not more than 2 minutes in the future relative
   * to the monotonic clock. Backend allows 3 minutes — keep client tighter
   * so obvious clock-skew events are flagged before they hit the wire.
   */
  validateTimestamp(timestamp) {
    const maxFutureOffset = 2 * 60 * 1e3;
    const offset = timestamp - this.now();
    if (offset > maxFutureOffset) {
      return {
        valid: false,
        error: `Timestamp is ${(offset / 1e3 / 60).toFixed(2)} minutes in the future (max allowed: 2 minutes)`
      };
    }
    return { valid: true };
  }
}
const VALID_EVENT_TYPES = new Set(Object.values(EventType));
class EventManager extends StateManager {
  dataSenders;
  emitter;
  timeManager;
  recentEventFingerprints = /* @__PURE__ */ new Map();
  perEventRateLimits = /* @__PURE__ */ new Map();
  eventsQueue = [];
  pendingEventsBuffer = [];
  sendTimeoutId = null;
  sendInProgress = false;
  consecutiveSendFailures = 0;
  rateLimitCounter = 0;
  rateLimitWindowStart = 0;
  lastSessionId = null;
  // Set when a sync flush is requested mid-async-send; drained by the async
  // finally block. See `drainPendingSyncFlush` for the full rationale.
  pendingSyncFlush = false;
  sessionEventCounts = {
    total: 0,
    [EventType.CLICK]: 0,
    [EventType.PAGE_VIEW]: 0,
    [EventType.CUSTOM]: 0,
    [EventType.SCROLL]: 0
  };
  saveSessionCountsDebounced = null;
  /**
   * Creates an EventManager instance.
   *
   * @param storeManager - Storage manager for persistence
   * @param emitter - Optional event emitter for local event consumption
   */
  constructor(storeManager, emitter = null) {
    super();
    this.emitter = emitter;
    this.timeManager = new TimeManager();
    this.dataSenders = [];
    const collectApiUrls = this.get("collectApiUrls");
    if (collectApiUrls?.saas) {
      this.dataSenders.push(new SenderManager(storeManager, collectApiUrls.saas));
    }
    this.saveSessionCountsDebounced = this.debounce((sessionId) => {
      this.saveSessionCounts(sessionId);
    }, 500);
    this.cleanupExpiredSessionCounts();
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
          log("debug", "Failed to recover persisted events");
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
    page_view
  }) {
    if (!type) {
      log("error", "Event type is required - event will be ignored");
      return;
    }
    if (!VALID_EVENT_TYPES.has(type)) {
      log("error", "Invalid event type - event will be ignored", {
        data: { type }
      });
      return;
    }
    const currentSessionId = this.get("sessionId");
    if (!currentSessionId) {
      if (this.pendingEventsBuffer.length >= MAX_PENDING_EVENTS_BUFFER) {
        this.pendingEventsBuffer.shift();
        log("debug", "Pending events buffer full - dropping oldest event", {
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
        page_view
      });
      return;
    }
    if (this.lastSessionId !== currentSessionId) {
      this.lastSessionId = currentSessionId;
      this.sessionEventCounts = this.loadSessionCounts(currentSessionId);
    }
    const isCriticalEvent = type === EventType.SESSION_START;
    if (isCriticalEvent) {
      log("debug", "Processing SESSION_START event", {
        data: { sessionId: currentSessionId }
      });
    }
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
      page_view
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
        log("debug", "Duplicate session_start detected", {
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
        visibility: "qa",
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
      const currentSessionId2 = this.get("sessionId");
      if (currentSessionId2 && this.saveSessionCountsDebounced) {
        this.saveSessionCountsDebounced(currentSessionId2);
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
   * 1. **Clear send timeout**: Cancels pending queue flush timeout and resets backoff state
   * 2. **Clear all queues and buffers**:
   *    - `eventsQueue`: Discarded (not sent)
   *    - `pendingEventsBuffer`: Discarded (events before session init)
   * 3. **Reset rate limiting state**: Clears rate limit counters and per-event limits
   * 4. **Reset session counters**: Clears per-session event counts
   * 5. **Reset `hasStartSession` flag**: Allows SESSION_START in next init cycle
   * 6. **Stop SenderManagers**: Calls `stop()` on all SenderManager instances
   *
   * **Important Behavior**:
   * - **No final flush**: `stop()` itself does NOT send queued events
   * - `App.destroy()` calls `flushImmediatelySync()` before `stop()` automatically
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
    this.clearSendTimeout();
    this.sendInProgress = false;
    this.pendingSyncFlush = false;
    this.consecutiveSendFailures = 0;
    const currentSessionId = this.get("sessionId");
    if (currentSessionId) {
      this.saveSessionCounts(currentSessionId);
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
   * the scheduled queue flush timeout.
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
   * @returns Promise resolving to `true` if at least one integration accepted
   *          the batch during this call (optimistic removal — failures
   *          persist per-integration for retry). `false` if no events, all
   *          senders failed, or a flush is already in flight.
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
   * **In-flight contract**: if an async send is already running this call is
   * deferred (queued for replay in the async send's `finally` block) and
   * returns `false` — nothing has been delivered yet at the point of return.
   * Mirrors `flushImmediately()`'s behaviour for the same condition.
   *
   * @returns `true` if at least one integration accepted the beacon batch
   *          *during this call*, `false` otherwise (no events, all senders
   *          failed, or the call was deferred behind an in-flight async send)
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
    return this.eventsQueue.map(({ _session_id, ...rest }) => {
      return rest;
    });
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
      log("debug", "Cannot flush pending events: session not initialized - keeping in buffer", {
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
  clearSendTimeout() {
    if (this.sendTimeoutId !== null) {
      clearTimeout(this.sendTimeoutId);
      this.sendTimeoutId = null;
    }
  }
  isSuccessfulResult(result) {
    return result.status === "fulfilled" && result.value === true;
  }
  /**
   * Groups the queue by frozen `_session_id`, preserving insertion order.
   * Single pass — `buildBatchesWithIds()` builds one batch + one eventIds list
   * per group, so the grouping cost is O(N) per flush regardless of session
   * count.
   *
   * **Self-heal**: any entry missing `_session_id` (an internal invariant
   * violation — `buildEventPayload` always stamps it) is removed from the
   * queue rather than left behind, otherwise a single corrupted entry would
   * keep `eventsQueue.length > 0` forever and re-trigger periodic sends.
   */
  groupQueuedEventsBySession() {
    const groups = /* @__PURE__ */ new Map();
    const corruptedIds = [];
    for (const event2 of this.eventsQueue) {
      if (!event2._session_id) {
        log("debug", "Queued event missing _session_id, dropping", {
          data: { eventId: event2.id, type: event2.type }
        });
        corruptedIds.push(event2.id);
        continue;
      }
      const group = groups.get(event2._session_id);
      if (group) {
        group.push(event2);
      } else {
        groups.set(event2._session_id, [event2]);
      }
    }
    if (corruptedIds.length > 0) {
      this.removeProcessedEvents(corruptedIds);
    }
    return groups;
  }
  /**
   * Builds a parallel list of `(batch, eventIds)` for sending. The eventIds are
   * the original `_session_id`-tagged event IDs in the queue that map to this
   * batch — used for optimistic removal. We can't read them off the wrapper's
   * `events[]` because dedup may have removed some signatures.
   */
  buildBatchesWithIds() {
    const groups = this.groupQueuedEventsBySession();
    if (groups.size === 0) return [];
    const result = [];
    for (const [sessionId, groupEvents] of groups) {
      result.push({
        batch: this.buildBatchFromGroup(sessionId, groupEvents),
        eventIds: groupEvents.map((e3) => e3.id)
      });
    }
    return result;
  }
  flushEvents(isSync) {
    if (this.eventsQueue.length === 0) {
      return isSync ? true : Promise.resolve(true);
    }
    if (!isSync && this.sendInProgress) {
      log("debug", "Async flush skipped: send already in progress");
      return Promise.resolve(false);
    }
    const planned = this.buildBatchesWithIds();
    if (planned.length === 0) {
      return isSync ? true : Promise.resolve(true);
    }
    if (this.dataSenders.length === 0) {
      for (const { batch, eventIds } of planned) {
        this.removeProcessedEvents(eventIds);
        this.emitEventsQueue(batch);
      }
      this.clearSendTimeout();
      return isSync ? true : Promise.resolve(true);
    }
    if (isSync && this.sendInProgress) {
      const totalEvents = planned.reduce((acc, p2) => acc + p2.eventIds.length, 0);
      this.pendingSyncFlush = true;
      log("debug", "Sync flush deferred: async send in-flight, will retry on settle", {
        data: { eventCount: totalEvents }
      });
      return false;
    }
    if (isSync) {
      const results = planned.map(({ batch, eventIds }) => this.sendBatchSync(batch, eventIds));
      this.settleSendTimeout();
      return results.some(Boolean);
    }
    this.sendInProgress = true;
    return (async () => {
      try {
        const results = await Promise.all(
          planned.map(async ({ batch, eventIds }) => this.sendBatchAsync(batch, eventIds))
        );
        this.settleSendTimeout();
        return results.some(Boolean);
      } finally {
        this.sendInProgress = false;
        this.drainPendingSyncFlush();
      }
    })();
  }
  /**
   * Reconciles the periodic send timer after a flush attempt. Clears the
   * timer when the queue is empty, otherwise (re)schedules a retry tick.
   *
   * **Why**: a `flushImmediately()` / `flushImmediatelySync()` call where all
   * integrations fail leaves events in `eventsQueue` for retry. The periodic
   * timer is the safety net that drains them when the backend recovers — if
   * we cleared it unconditionally here, the queue would sit untouched until
   * the next tracked event resurrects the timer in `addToQueue`. Mirrors the
   * pattern in `sendEventsQueue()` (the periodic path).
   */
  settleSendTimeout() {
    if (this.eventsQueue.length === 0) {
      this.clearSendTimeout();
    } else {
      this.scheduleSendTimeout();
    }
  }
  /**
   * Re-runs a sync flush that was deferred while an async send was in flight.
   *
   * Called from the `finally` blocks of `flushEvents(false)` and
   * `sendEventsQueue()`. If `pendingSyncFlush` is set, clears the flag and
   * invokes `flushImmediatelySync()` synchronously so any events that arrived
   * after the deferred sync call are delivered before the next event loop
   * tick. Critical for high-stakes events tracked mid-async-send.
   */
  drainPendingSyncFlush() {
    if (!this.pendingSyncFlush) return;
    this.pendingSyncFlush = false;
    this.flushImmediatelySync();
  }
  /**
   * Sends one batch synchronously across all integrations (sendBeacon path).
   * Optimistic removal: if any integration succeeds, we remove the batch's
   * events from the queue and emit it locally. Failures persist per-integration.
   */
  sendBatchSync(batch, eventIds) {
    const results = this.dataSenders.map((sender) => sender.sendEventsQueueSync(batch));
    const anySucceeded = results.some((success) => success);
    if (anySucceeded) {
      this.removeProcessedEvents(eventIds);
      this.emitEventsQueue(batch);
    } else {
      log("debug", "Sync send complete failure, events kept in queue for retry", {
        data: { eventCount: eventIds.length, sessionId: batch.session_id }
      });
    }
    return anySucceeded;
  }
  /**
   * Sends one batch asynchronously across all integrations (fetch path).
   */
  async sendBatchAsync(batch, eventIds) {
    const sendPromises = this.dataSenders.map(
      async (sender) => sender.sendEventsQueue(batch, {
        onSuccess: () => {
        },
        onFailure: () => {
        }
      })
    );
    const results = await Promise.allSettled(sendPromises);
    const anySucceeded = results.some((result) => this.isSuccessfulResult(result));
    if (anySucceeded) {
      this.removeProcessedEvents(eventIds);
      this.emitEventsQueue(batch);
      const failedCount = results.filter((result) => !this.isSuccessfulResult(result)).length;
      if (failedCount > 0) {
        log("debug", "Async send completed with some failures, removed from queue and persisted per-integration", {
          data: { eventCount: eventIds.length, failedCount, sessionId: batch.session_id }
        });
      }
    } else {
      log("debug", "Async send complete failure, events kept in queue for retry", {
        data: { eventCount: eventIds.length, sessionId: batch.session_id }
      });
    }
    return anySucceeded;
  }
  async sendEventsQueue() {
    if (this.eventsQueue.length === 0 || this.sendInProgress) {
      return;
    }
    this.sendInProgress = true;
    try {
      const planned = this.buildBatchesWithIds();
      if (planned.length === 0) return;
      if (this.dataSenders.length === 0) {
        for (const { batch } of planned) {
          this.emitEventsQueue(batch);
        }
        return;
      }
      const results = await Promise.all(
        planned.map(async ({ batch, eventIds }) => this.sendBatchAsync(batch, eventIds))
      );
      const anySucceededOverall = results.some(Boolean);
      if (anySucceededOverall) {
        this.consecutiveSendFailures = 0;
      } else {
        this.consecutiveSendFailures = Math.min(this.consecutiveSendFailures + 1, MAX_CONSECUTIVE_SEND_FAILURES);
      }
      if (this.eventsQueue.length === 0) {
        this.clearSendTimeout();
      } else {
        this.scheduleSendTimeout();
      }
    } finally {
      this.sendInProgress = false;
      this.drainPendingSyncFlush();
    }
  }
  /**
   * Builds a single batch from a per-session group: dedup by signature,
   * SESSION_START first, then timestamp order, strip `_session_id`, apply
   * `beforeBatch` transformer when running standalone.
   *
   * **Why N batches per flush**: events freeze their `_session_id` at `track()`
   * time. If the session was renewed (idle timeout) between two `track()`
   * calls, the queue contains events from multiple sessions. `buildBatchesWithIds()`
   * emits one batch per session so the backend's `EventsQueueDto.session_id`
   * remains the single source of truth and stays consistent with the events it
   * carries.
   *
   * **Strip**: `_session_id` is removed from each event in the wrapper's
   * `events[]` because the backend uses `forbidNonWhitelisted: true` and would
   * reject the batch if the field leaked through.
   *
   * **Transformer note**: `beforeBatch` is invoked **once per session-batch**,
   * not once per flush. A queue spanning N sessions triggers N invocations.
   */
  buildBatchFromGroup(sessionId, groupEvents) {
    const eventMap = /* @__PURE__ */ new Map();
    const order = [];
    for (const event2 of groupEvents) {
      const signature = this.createEventSignature(event2);
      if (!eventMap.has(signature)) {
        order.push(signature);
      }
      eventMap.set(signature, event2);
    }
    const events = order.map((signature) => eventMap.get(signature)).filter((event2) => Boolean(event2)).sort((a2, b2) => {
      if (a2.type === EventType.SESSION_START && b2.type !== EventType.SESSION_START) return -1;
      if (b2.type === EventType.SESSION_START && a2.type !== EventType.SESSION_START) return 1;
      return a2.timestamp - b2.timestamp;
    }).map(({ _session_id, ...rest }) => {
      return rest;
    });
    const globalMetadata = this.get("config")?.globalMetadata;
    const identity = this.get("identity");
    const queue = {
      user_id: this.get("userId"),
      session_id: sessionId,
      device: this.get("device"),
      events,
      ...globalMetadata && { global_metadata: globalMetadata },
      ...identity && { identify: identity }
    };
    return queue;
  }
  buildEventPayload(data) {
    const currentSessionId = this.get("sessionId");
    if (!currentSessionId) {
      log("error", "buildEventPayload reached without sessionId — event dropped", {
        data: { type: data.type },
        visibility: "critical"
      });
      return null;
    }
    const rawPageUrl = data.page_url ?? this.get("pageUrl");
    const currentPageUrl = typeof rawPageUrl === "string" && rawPageUrl.length > 0 ? rawPageUrl : "unknown";
    const timestamp = this.timeManager.now();
    const validation = this.timeManager.validateTimestamp(timestamp);
    if (!validation.valid) {
      log("warn", "Event timestamp validation failed", {
        data: { type: data.type, error: validation.error }
      });
    }
    const sessionReferrer = this.get("sessionReferrer");
    const sessionUtm = this.get("sessionUtm");
    const sessionClickIds = this.get("sessionClickIds");
    const payload = {
      id: generateEventId(),
      type: data.type,
      page_url: currentPageUrl,
      timestamp,
      ...sessionReferrer && { referrer: sessionReferrer },
      ...data.from_page_url && { from_page_url: data.from_page_url },
      ...data.scroll_data && { scroll_data: data.scroll_data },
      ...data.click_data && { click_data: data.click_data },
      ...data.custom_event && { custom_event: data.custom_event },
      ...data.web_vitals && { web_vitals: data.web_vitals },
      ...data.error_data && { error_data: data.error_data },
      ...data.page_view && { page_view: data.page_view },
      ...sessionUtm && { utm: sessionUtm },
      ...sessionClickIds && { click_ids: sessionClickIds }
    };
    return { ...payload, _session_id: currentSessionId };
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
      log("debug", "Event fingerprint cache exceeded hard limit, cleared", {
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
      if (event2.custom_event.metadata) {
        fingerprint += `_${this.stableStringify(event2.custom_event.metadata)}`;
      }
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
  /** Deterministic JSON string with sorted keys to ensure consistent fingerprints regardless of property insertion order */
  stableStringify(value) {
    return JSON.stringify(value, (_2, v2) => {
      if (v2 && typeof v2 === "object" && !Array.isArray(v2)) {
        return Object.keys(v2).sort().reduce((sorted, key) => {
          sorted[key] = v2[key];
          return sorted;
        }, {});
      }
      return v2;
    });
  }
  addToQueue(event2) {
    this.emitEvent(event2);
    this.eventsQueue.push(event2);
    if (this.eventsQueue.length > MAX_EVENTS_QUEUE_LENGTH) {
      const nonCriticalIndex = this.eventsQueue.findIndex((e3) => e3.type !== EventType.SESSION_START);
      const removedEvent = nonCriticalIndex >= 0 ? this.eventsQueue.splice(nonCriticalIndex, 1)[0] : this.eventsQueue.shift();
      log("warn", "Event queue overflow, oldest non-critical event removed", {
        data: {
          maxLength: MAX_EVENTS_QUEUE_LENGTH,
          currentLength: this.eventsQueue.length,
          removedEventType: removedEvent?.type,
          wasCritical: removedEvent?.type === EventType.SESSION_START
        }
      });
    }
    this.scheduleSendTimeout();
    if (this.eventsQueue.length >= BATCH_SIZE_THRESHOLD && this.consecutiveSendFailures < MAX_CONSECUTIVE_SEND_FAILURES) {
      void this.sendEventsQueue();
    }
  }
  scheduleSendTimeout() {
    if (this.sendTimeoutId !== null) return;
    const delay = this.calculateSendDelay();
    this.sendTimeoutId = window.setTimeout(() => {
      this.sendTimeoutId = null;
      if (this.eventsQueue.length > 0) {
        void this.sendEventsQueue();
      }
    }, delay);
  }
  calculateSendDelay() {
    const baseInterval = this.get("config")?.sendIntervalMs ?? EVENT_SENT_INTERVAL_MS;
    if (this.consecutiveSendFailures === 0) return baseInterval;
    const backoff = baseInterval * Math.pow(2, this.consecutiveSendFailures);
    return Math.min(backoff, MAX_SEND_INTERVAL_MS);
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
      const { _session_id, ...publicEvent } = eventData;
      this.emitter.emit(EmitterEvent.EVENT, publicEvent);
    }
  }
  emitEventsQueue(queue) {
    if (this.emitter) {
      this.emitter.emit(EmitterEvent.QUEUE, queue);
    }
  }
  /**
   * Creates a debounced version of a function that delays execution until after
   * a specified wait time has elapsed since the last invocation.
   *
   * **Purpose**: Reduces frequency of expensive operations (localStorage writes)
   * while ensuring no data is lost (trailing edge execution).
   *
   * **Behavior**:
   * - Each call resets the timer
   * - Function executes only after `delay` ms of silence
   * - Last invocation always executes (trailing edge)
   *
   * **Use Case**: Batches rapid successive calls into a single execution
   *
   * @param fn - Function to debounce
   * @param delay - Delay in milliseconds
   * @returns Debounced version of the function
   *
   * @internal
   */
  debounce(fn, delay) {
    let timeoutId = null;
    return ((...args) => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        fn(...args);
        timeoutId = null;
      }, delay);
    });
  }
  /**
   * Returns initial zero counts for session event tracking.
   *
   * **Purpose**: DRY helper to avoid duplicating initial counts structure
   * across multiple methods (loadSessionCounts, validation fallbacks).
   *
   * @returns Fresh SessionEventCounts object with all counters at zero
   *
   * @internal
   */
  getInitialCounts() {
    return {
      total: 0,
      [EventType.CLICK]: 0,
      [EventType.PAGE_VIEW]: 0,
      [EventType.CUSTOM]: 0,
      [EventType.SCROLL]: 0
    };
  }
  /**
   * Loads persisted session event counts from localStorage.
   *
   * **Purpose**: Restore per-session event counts after page reload to maintain
   * accurate rate limiting across page navigations within the same session.
   *
   * **Behavior**:
   * - Attempts to load counts from localStorage using session ID as key
   * - If no persisted data found: Returns initial zero counts
   * - If corrupted data found: Returns initial zero counts with warning
   *
   * **Storage Key**: `tlog:{userId}:session_counts:{sessionId}`
   *
   * **Why This Matters**:
   * - Without persistence, counts reset on every page reload
   * - This allows users to bypass per-session limits by refreshing the page
   * - Example: 100 PAGE_VIEW limit could be bypassed by reloading after 99 events
   *
   * @param sessionId - Current session identifier
   * @returns Session event counts object (either persisted or initial state)
   *
   * @internal
   */
  loadSessionCounts(sessionId) {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return this.getInitialCounts();
    }
    const userId = this.get("userId") || "anonymous";
    const storageKey = SESSION_COUNTS_KEY(userId, sessionId);
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) {
        return this.getInitialCounts();
      }
      const parsed = JSON.parse(stored);
      if (parsed._timestamp && Date.now() - parsed._timestamp > SESSION_COUNTS_EXPIRY_MS) {
        log("debug", "Session counts expired, clearing", {
          data: { sessionId, age: Date.now() - parsed._timestamp }
        });
        localStorage.removeItem(storageKey);
        return this.getInitialCounts();
      }
      if (typeof parsed.total === "number" && typeof parsed[EventType.CLICK] === "number" && typeof parsed[EventType.PAGE_VIEW] === "number" && typeof parsed[EventType.CUSTOM] === "number" && typeof parsed[EventType.SCROLL] === "number") {
        return {
          total: parsed.total,
          [EventType.CLICK]: parsed[EventType.CLICK],
          [EventType.PAGE_VIEW]: parsed[EventType.PAGE_VIEW],
          [EventType.CUSTOM]: parsed[EventType.CUSTOM],
          [EventType.SCROLL]: parsed[EventType.SCROLL]
        };
      }
      log("warn", "Invalid session counts structure in localStorage, resetting", {
        data: { sessionId, parsed }
      });
      localStorage.removeItem(storageKey);
      log("debug", "Session counts removed due to invalid/corrupted data", {
        data: { sessionId, parsed }
      });
      return this.getInitialCounts();
    } catch (error) {
      log("warn", "Failed to load session counts from localStorage", {
        error,
        data: { sessionId }
      });
      return this.getInitialCounts();
    }
  }
  /**
   * Cleans up expired session counts from localStorage.
   *
   * **Purpose**: Prevents localStorage pollution from abandoned sessions by removing
   * counts older than 7 days.
   *
   * **Behavior**:
   * - Checks if cleanup was run recently (within last hour) and skips if so
   * - Iterates all localStorage keys matching the session counts prefix pattern
   * - Parses each entry and checks `_timestamp` field
   * - Removes entries where age exceeds SESSION_COUNTS_EXPIRY_MS (7 days)
   * - Silently ignores parse errors (corrupted entries cleaned on next load)
   * - Updates last cleanup timestamp after successful run
   *
   * **When Called**: Automatically on EventManager constructor initialization
   *
   * **Performance**: O(n) scan where n = localStorage keys (typically <100), but throttled
   * to run at most once per hour to prevent impact on rapid page reloads
   *
   * @internal
   */
  cleanupExpiredSessionCounts() {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return;
    }
    try {
      const lastCleanup = localStorage.getItem(SESSION_COUNTS_LAST_CLEANUP_KEY);
      if (lastCleanup) {
        const timeSinceLastCleanup = Date.now() - parseInt(lastCleanup, 10);
        if (timeSinceLastCleanup < SESSION_COUNTS_CLEANUP_THROTTLE_MS) {
          log("debug", "Skipping session counts cleanup (throttled)", {
            data: { timeSinceLastCleanup, throttleMs: SESSION_COUNTS_CLEANUP_THROTTLE_MS }
          });
          return;
        }
      }
      const userId = this.get("userId") || "anonymous";
      const prefix = `${STORAGE_BASE_KEY}:${userId}:session_counts:`;
      const keysToRemove = [];
      for (let i2 = 0; i2 < localStorage.length; i2++) {
        const key = localStorage.key(i2);
        if (key?.startsWith(prefix)) {
          try {
            const stored = localStorage.getItem(key);
            if (stored) {
              const parsed = JSON.parse(stored);
              if (parsed._timestamp && Date.now() - parsed._timestamp > SESSION_COUNTS_EXPIRY_MS) {
                keysToRemove.push(key);
              }
            }
          } catch {
          }
        }
      }
      keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
        log("debug", "Cleaned up expired session counts", { data: { key } });
      });
      if (keysToRemove.length > 0) {
        log("info", `Cleaned up ${keysToRemove.length} expired session counts entries`);
      }
      localStorage.setItem(SESSION_COUNTS_LAST_CLEANUP_KEY, Date.now().toString());
    } catch (error) {
      log("warn", "Failed to cleanup expired session counts", { error });
    }
  }
  /**
   * Persists current session event counts to localStorage (debounced).
   *
   * **Purpose**: Save event counts to ensure they survive page reloads and
   * maintain accurate per-session rate limiting across navigations.
   *
   * **Behavior**:
   * - Saves current `sessionEventCounts` to localStorage using session ID as key
   * - Overwrites previous counts (always reflects latest state)
   * - Fails silently if localStorage quota exceeded or unavailable
   *
   * **Storage Key**: `tlog:{userId}:session_counts:{sessionId}`
   *
   * **Debouncing**: This method is called via `saveSessionCountsDebounced()`
   * with 500ms debounce delay. Direct calls are for immediate saves (e.g., stop()).
   *
   * **Performance**: Debouncing reduces localStorage writes from ~1000 per session
   * to ~20-30 (96-97% reduction) while maintaining data integrity.
   *
   * **Cleanup**: Counts persist across page reloads for rate limiting enforcement.
   * Automatic cleanup on page reload removes expired counts (older than 7 days).
   * Note: SESSION_COUNTS_KEY entries are intentionally persistent to maintain
   * rate limits across sessions (~100 bytes per session).
   *
   * @param sessionId - Current session identifier
   *
   * @internal
   */
  saveSessionCounts(sessionId) {
    const userId = this.get("userId") || "anonymous";
    const storageKey = SESSION_COUNTS_KEY(userId, sessionId);
    try {
      const dataToStore = {
        ...this.sessionEventCounts,
        _timestamp: Date.now(),
        _version: 1
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToStore));
    } catch (error) {
      log("warn", "Failed to persist session counts to localStorage", {
        error,
        data: { sessionId }
      });
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
const SESSION_ID_PATTERN = /^\d{13}-[a-z0-9]{9}$/;
class SessionManager extends StateManager {
  storageManager;
  eventManager;
  projectId;
  activityHandler = null;
  visibilityChangeHandler = null;
  sessionTimeoutId = null;
  broadcastChannel = null;
  isTracking = false;
  needsRenewal = false;
  prerenderActivationHandler = null;
  /**
   * Creates a SessionManager instance.
   *
   * @param storageManager - Storage manager for session persistence
   * @param eventManager - Event manager for SESSION_START events
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
      log("debug", "BroadcastChannel not supported");
      return;
    }
    const projectId = this.getProjectId();
    this.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME(projectId));
    this.broadcastChannel.onmessage = (event2) => {
      const { action, sessionId, timestamp, projectId: messageProjectId } = event2.data ?? {};
      if (messageProjectId !== projectId) {
        return;
      }
      if (action === "session_start" && sessionId && typeof timestamp === "number" && timestamp > Date.now() - 5e3) {
        this.set("sessionId", sessionId);
        const stored = this.loadStoredSession();
        this.set("sessionReferrer", stored?.referrer);
        this.set("sessionUtm", stored?.utm);
        this.set("sessionClickIds", stored?.clickIds);
        this.persistSession(sessionId, timestamp, stored?.referrer, stored?.utm, stored?.clickIds);
        if (this.isTracking) {
          this.setupSessionTimeout();
        }
      } else if (action && action !== "session_start") {
        log("debug", "Ignored BroadcastChannel message with unknown action", { data: { action } });
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
    if (!SESSION_ID_PATTERN.test(storedSession.id)) {
      log("warn", "Invalid session ID format recovered from storage, clearing", {
        data: { sessionId: storedSession.id }
      });
      this.clearStoredSession();
      return null;
    }
    const sessionTimeout = this.get("config")?.sessionTimeout ?? DEFAULT_SESSION_TIMEOUT;
    if (Date.now() - storedSession.lastActivity > sessionTimeout) {
      this.clearStoredSession();
      return null;
    }
    return storedSession.id;
  }
  persistSession(sessionId, lastActivity = Date.now(), referrer, utm, clickIds) {
    this.saveStoredSession({
      id: sessionId,
      lastActivity,
      ...referrer && { referrer },
      ...utm && { utm },
      ...clickIds && { clickIds }
    });
  }
  clearStoredSession() {
    const storageKey = this.getSessionStorageKey();
    this.storageManager.removeItem(storageKey);
  }
  loadStoredSession() {
    const storageKey = this.getSessionStorageKey();
    const localData = this.storageManager.getItem(storageKey);
    if (localData !== null) {
      try {
        const parsed = JSON.parse(localData);
        if (parsed.id && typeof parsed.lastActivity === "number") {
          return parsed;
        }
      } catch {
        this.storageManager.removeItem(storageKey);
      }
    }
    const sessionData = this.storageManager.getSessionItem(storageKey);
    if (sessionData !== null) {
      try {
        const parsed = JSON.parse(sessionData);
        if (parsed.id && typeof parsed.lastActivity === "number") {
          return parsed;
        }
      } catch {
        this.storageManager.removeSessionItem(storageKey);
      }
    }
    return null;
  }
  saveStoredSession(session) {
    const storageKey = this.getSessionStorageKey();
    const data = JSON.stringify(session);
    this.storageManager.setItem(storageKey, data);
    this.storageManager.setSessionItem(storageKey, data);
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
   * - Checks localStorage for existing session (primary)
   * - Falls back to sessionStorage mirror (survives external redirects)
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
   * **Pre-rendering**:
   * - On a pre-rendered page (`document.prerendering === true`), every observable side
   *   effect (persistence, cross-tab sync, SESSION_START, listeners) is deferred to the
   *   `prerenderingchange` activation event via `activateSession()`. `sessionId` is still
   *   set in state synchronously so `init()` returns a real id. A prerender that is never
   *   activated persists and emits nothing.
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
      log("debug", "Session tracking already active");
      return;
    }
    const recoveredSessionId = this.recoverSession();
    const sessionId = recoveredSessionId ?? this.generateSessionId();
    let sessionReferrer;
    let sessionUtm;
    let sessionClickIds;
    if (recoveredSessionId) {
      const storedSession = this.loadStoredSession();
      sessionReferrer = storedSession?.referrer ?? getExternalReferrer(this.get("config").sensitiveQueryParams);
      sessionUtm = storedSession?.utm ?? getUTMParameters();
      sessionClickIds = storedSession?.clickIds ?? getClickIds();
    } else {
      sessionReferrer = getExternalReferrer(this.get("config").sensitiveQueryParams);
      sessionUtm = getUTMParameters();
      sessionClickIds = getClickIds();
    }
    log("debug", "Session tracking initialized", {
      data: {
        sessionId,
        wasRecovered: !!recoveredSessionId,
        willEmitSessionStart: !recoveredSessionId,
        sessionReferrer,
        hasUtm: !!sessionUtm,
        hasClickIds: !!sessionClickIds
      }
    });
    this.isTracking = true;
    try {
      this.set("sessionId", sessionId);
      this.set("sessionReferrer", sessionReferrer);
      this.set("sessionUtm", sessionUtm);
      this.set("sessionClickIds", sessionClickIds);
      if (isPrerendering()) {
        this.prerenderActivationHandler = () => {
          this.prerenderActivationHandler = null;
          this.activateSession(sessionId, recoveredSessionId, sessionReferrer, sessionUtm, sessionClickIds);
        };
        document.addEventListener("prerenderingchange", this.prerenderActivationHandler, { once: true });
        return;
      }
      this.activateSession(sessionId, recoveredSessionId, sessionReferrer, sessionUtm, sessionClickIds);
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
  /**
   * Commits all observable session side effects: persistence, cross-tab sync, the
   * SESSION_START emit (new sessions only) and the activity/lifecycle/timeout listeners.
   *
   * Runs synchronously on a normal page load. On a pre-rendered page it is deferred to
   * the `prerenderingchange` (activation) event, so a prerender that is never activated
   * persists nothing and emits nothing.
   *
   * BroadcastChannel is initialized before SESSION_START so secondary tabs can receive
   * the `session_start` message (avoids a cross-tab race).
   */
  activateSession(sessionId, recoveredSessionId, referrer, utm, clickIds) {
    this.persistSession(sessionId, Date.now(), referrer, utm, clickIds);
    this.initCrossTabSync();
    this.shareSession(sessionId);
    if (!recoveredSessionId) {
      log("debug", "Emitting SESSION_START event", { data: { sessionId } });
      this.eventManager.track({ type: EventType.SESSION_START });
    } else {
      log("debug", "Session recovered, skipping SESSION_START", { data: { sessionId } });
    }
    this.setupSessionTimeout();
    this.setupActivityListeners();
    this.setupLifecycleListeners();
  }
  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
  setupSessionTimeout() {
    this.clearSessionTimeout();
    const sessionTimeout = this.get("config")?.sessionTimeout ?? DEFAULT_SESSION_TIMEOUT;
    this.sessionTimeoutId = setTimeout(() => {
      this.enterRenewalMode();
    }, sessionTimeout);
  }
  resetSessionTimeout() {
    this.setupSessionTimeout();
    const sessionId = this.get("sessionId");
    if (sessionId) {
      this.persistSession(
        sessionId,
        Date.now(),
        this.get("sessionReferrer"),
        this.get("sessionUtm"),
        this.get("sessionClickIds")
      );
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
      if (this.needsRenewal) {
        this.renewSession();
      } else {
        this.resetSessionTimeout();
      }
    };
    document.addEventListener("click", this.activityHandler, { passive: true });
    document.addEventListener("keydown", this.activityHandler, { passive: true });
    document.addEventListener("scroll", this.activityHandler, { passive: true });
  }
  /**
   * Renews the session after timeout when user returns.
   * Creates a new session ID and emits SESSION_START.
   */
  renewSession() {
    this.needsRenewal = false;
    const newSessionId = this.generateSessionId();
    const sessionReferrer = getExternalReferrer(this.get("config").sensitiveQueryParams);
    const sessionUtm = getUTMParameters();
    const sessionClickIds = getClickIds();
    log("debug", "Renewing session after timeout", {
      data: { newSessionId }
    });
    this.set("sessionId", newSessionId);
    this.set("sessionReferrer", sessionReferrer);
    this.set("sessionUtm", sessionUtm);
    this.set("sessionClickIds", sessionClickIds);
    this.persistSession(newSessionId, Date.now(), sessionReferrer, sessionUtm, sessionClickIds);
    this.cleanupCrossTabSync();
    this.initCrossTabSync();
    this.shareSession(newSessionId);
    this.eventManager.track({
      type: EventType.SESSION_START
    });
    this.eventManager.flushPendingEvents();
    this.setupSessionTimeout();
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
    if (this.visibilityChangeHandler) {
      return;
    }
    this.visibilityChangeHandler = () => {
      if (document.hidden) {
        this.clearSessionTimeout();
      } else {
        if (this.isSessionStale()) {
          log("debug", "Session expired during suspend, entering renewal mode");
          this.enterRenewalMode();
          return;
        }
        const sessionId = this.get("sessionId");
        if (sessionId) {
          this.setupSessionTimeout();
        }
      }
    };
    document.addEventListener("visibilitychange", this.visibilityChangeHandler);
  }
  /**
   * Checks if the current session has become stale (expired during browser suspend).
   * This handles the case where JavaScript timers are paused during suspend/hibernate.
   */
  isSessionStale() {
    if (this.needsRenewal) {
      return false;
    }
    const sessionId = this.get("sessionId");
    if (!sessionId) {
      return false;
    }
    const storedSession = this.loadStoredSession();
    if (!storedSession) {
      return false;
    }
    const sessionTimeout = this.get("config")?.sessionTimeout ?? DEFAULT_SESSION_TIMEOUT;
    return Date.now() - storedSession.lastActivity > sessionTimeout;
  }
  cleanupLifecycleListeners() {
    if (this.visibilityChangeHandler) {
      document.removeEventListener("visibilitychange", this.visibilityChangeHandler);
      this.visibilityChangeHandler = null;
    }
  }
  /**
   * Enters renewal mode after session timeout.
   * Keeps activity listeners active to detect when user returns.
   * Called by session timeout timer.
   */
  enterRenewalMode() {
    this.clearSessionTimeout();
    this.cleanupCrossTabSync();
    this.clearStoredSession();
    this.set("sessionId", null);
    this.set("hasStartSession", false);
    this.set("sessionReferrer", void 0);
    this.set("sessionUtm", void 0);
    this.set("sessionClickIds", void 0);
    this.needsRenewal = true;
    log("debug", "Session timed out, entering renewal mode");
  }
  /**
   * Fully resets session state and cleans up all resources.
   * Called by stopTracking() for explicit session termination.
   */
  resetSessionState() {
    this.clearSessionTimeout();
    this.cleanupActivityListeners();
    this.cleanupLifecycleListeners();
    this.cleanupCrossTabSync();
    this.cleanupPrerenderActivation();
    this.clearStoredSession();
    this.set("sessionId", null);
    this.set("hasStartSession", false);
    this.set("sessionReferrer", void 0);
    this.set("sessionUtm", void 0);
    this.set("sessionClickIds", void 0);
    this.needsRenewal = false;
    this.isTracking = false;
  }
  /**
   * Stops session tracking and cleans up all resources.
   *
   * **Purpose**: Manually stops the current session tracking and cleans up
   * all listeners and timers. Does not emit SESSION_END event (removed in v2.0.0).
   *
   * **Flow**:
   * 1. Clears inactivity timeout
   * 2. Removes activity listeners (click, keydown, scroll)
   * 3. Removes lifecycle listeners (visibilitychange)
   * 4. Closes BroadcastChannel
   * 5. Clears session from localStorage
   * 6. Resets `sessionId` and `hasStartSession` in global state
   * 7. Sets `isTracking` to false
   *
   * **Called by**: `App.destroy()` during application teardown or when session times out
   *
   * **Important**: After calling, session tracking is terminated and cannot be resumed.
   * A new session will be created on next `startTracking()` call.
   *
   * @example
   * ```typescript
   * // Stop session tracking
   * sessionManager.stopTracking();
   * // → All listeners cleaned up
   * // → Session cleared from localStorage
   * // → BroadcastChannel closed
   * // → No SESSION_END event emitted
   * ```
   *
   * @see src/managers/README.md (lines 140-169) for session management details
   */
  stopTracking() {
    this.resetSessionState();
  }
  /**
   * Destroys the session manager and cleans up all resources.
   *
   * **Purpose**: Performs deep cleanup of session manager resources during
   * application teardown. Preserves session in localStorage for recovery.
   *
   * **Differences from stopTracking()**:
   * - Does NOT clear localStorage (preserves session for recovery)
   * - Used for internal cleanup during teardown
   *
   * **Cleanup Flow**:
   * 1. Clears inactivity timeout
   * 2. Removes activity listeners (click, keydown, scroll)
   * 3. Closes BroadcastChannel
   * 4. Removes lifecycle listeners (visibilitychange)
   * 5. Resets tracking flag (`isTracking`)
   *
   * **Called by**: `App.destroy()` during application teardown
   *
   * @returns void
   *
   * @example
   * ```typescript
   * sessionManager.destroy();
   * // → All resources cleaned up
   * // → Session preserved in localStorage for recovery
   * ```
   */
  destroy() {
    this.clearSessionTimeout();
    this.cleanupActivityListeners();
    this.cleanupCrossTabSync();
    this.cleanupLifecycleListeners();
    this.cleanupPrerenderActivation();
    this.isTracking = false;
    this.needsRenewal = false;
    this.set("hasStartSession", false);
  }
  /**
   * Removes the pending `prerenderingchange` listener when the manager is torn
   * down before activation (the discarded-prerender case). On the activation path
   * `{ once: true }` removes the listener and the handler nulls its own reference,
   * so this is a no-op then.
   */
  cleanupPrerenderActivation() {
    if (this.prerenderActivationHandler) {
      document.removeEventListener("prerenderingchange", this.prerenderActivationHandler);
      this.prerenderActivationHandler = null;
    }
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
      log("debug", "Cannot start tracking on destroyed handler");
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
   * Stops session tracking by cleaning up resources.
   *
   * **Purpose**: Terminates session tracking and removes all listeners and timers.
   * No events are emitted (SESSION_END removed in v2.0.0).
   *
   * **Behavior**:
   * - Calls SessionManager.stopTracking() to clean up listeners
   * - Calls SessionManager.destroy() to finalize cleanup
   * - Safe to call multiple times (idempotent via cleanupSessionManager)
   *
   * **Note**: In v2.0.0+, this method only performs cleanup without emitting events.
   * Session end time is inferred server-side from last event timestamp.
   */
  stopTracking() {
    this.cleanupSessionManager();
  }
  /**
   * Destroys handler and cleans up SessionManager.
   *
   * **Purpose**: Same as stopTracking() in v2.0.0+. Both methods perform cleanup
   * without emitting events.
   *
   * **Behavior**:
   * - Idempotent: Early return if already destroyed
   * - Calls SessionManager.destroy() to clean up listeners and timers
   * - Sets sessionManager to null and destroyed flag to true
   *
   * **Note**: In v2.0.0+, there is no functional difference between stopTracking()
   * and destroy(). Both perform cleanup without emitting SESSION_END events.
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
    if (this.get("config").flushOnSpaNavigation === true) {
      void this.eventManager.flushImmediately();
    }
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
    const referrer = document.referrer ? normalizeUrl(document.referrer, this.get("config").sensitiveQueryParams) : "";
    const { title } = document;
    if (!referrer && !title) {
      return void 0;
    }
    return {
      ...referrer && { referrer },
      ...title && { title }
    };
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
        log("debug", "Click target not found or not an element");
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
      const coordinates = this.calculateClickCoordinates(mouseEvent);
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
      if (!coordinates) {
        log("debug", "Click skipped: invalid coordinates (likely synthetic)");
        return;
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
        log("debug", "Invalid selector in element search", { error, data: { selector } });
        continue;
      }
    }
    return element;
  }
  calculateClickCoordinates(event2) {
    const x2 = event2.clientX;
    const y2 = event2.clientY;
    if (typeof x2 !== "number" || typeof y2 !== "number" || !Number.isFinite(x2) || !Number.isFinite(y2)) {
      return null;
    }
    if (x2 === 0 && y2 === 0 && !event2.isTrusted) {
      return null;
    }
    return { x: x2, y: y2 };
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
    const { x: x2, y: y2 } = coordinates;
    const text = this.getRelevantText(clickedElement, relevantElement);
    const rawHref = relevantElement.getAttribute("href");
    const href = rawHref ? normalizeUrl(rawHref, this.get("config").sensitiveQueryParams) : void 0;
    return {
      x: x2,
      y: y2,
      tag: relevantElement.tagName.toLowerCase(),
      ...relevantElement.id && { id: sanitizePii(relevantElement.id) },
      ...relevantElement.className && { class: sanitizePii(relevantElement.className) },
      ...text && { text },
      ...href && { href }
    };
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
    return sanitizePii(finalText);
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
  containerDiscoveryTimeoutId = null;
  constructor(eventManager) {
    super();
    this.eventManager = eventManager;
  }
  startTracking() {
    this.limitWarningLogged = false;
    this.set("scrollEventCount", 0);
    this.tryDetectScrollContainers(0);
  }
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
    const container = {
      element,
      selector,
      lastScrollPos: initialScrollTop,
      lastDepth: initialDepth,
      lastEventTime: 0,
      debounceTimer: null,
      listener: null
    };
    const handleScroll = () => {
      if (this.get("suppressNextScroll")) {
        return;
      }
      this.clearContainerTimer(container);
      container.debounceTimer = window.setTimeout(() => {
        const scrollData = this.calculateScrollData(container);
        if (scrollData) {
          this.processScrollEvent(container, scrollData, Date.now());
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
    const currentCount = this.get("scrollEventCount") ?? 0;
    this.set("scrollEventCount", currentCount + 1);
    this.eventManager.track({
      type: EventType.SCROLL,
      scroll_data: {
        ...scrollData,
        container_selector: container.selector
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
    return currentCount >= MAX_SCROLL_EVENTS_PER_SESSION;
  }
  hasElapsedMinimumInterval(container, timestamp) {
    if (container.lastEventTime === 0) {
      return true;
    }
    return timestamp - container.lastEventTime >= SCROLL_MIN_EVENT_INTERVAL_MS;
  }
  hasSignificantDepthChange(container, newDepth) {
    return Math.abs(newDepth - container.lastDepth) >= MIN_SCROLL_DEPTH_CHANGE;
  }
  logLimitOnce() {
    if (this.limitWarningLogged) {
      return;
    }
    this.limitWarningLogged = true;
    log("debug", "Max scroll events per session reached", {
      data: { limit: MAX_SCROLL_EVENTS_PER_SESSION }
    });
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
}
const SHOPIFY_SESSION_ATTR = "tracelog_session_id";
const SHOPIFY_USER_ATTR = "tracelog_user_id";
class ShopifyCartLinker extends StateManager {
  visibilityHandler = null;
  pageshowHandler = null;
  lastSyncedKey = null;
  activate() {
    this.cleanupListeners();
    this.syncCartAttribute();
    this.setupListeners();
  }
  deactivate() {
    this.cleanupListeners();
    this.lastSyncedKey = null;
  }
  /** Re-syncs cart attributes when session rotates (called by App on SESSION_START). */
  onSessionChange() {
    this.syncCartAttribute();
  }
  syncCartAttribute() {
    const sessionId = this.get("sessionId");
    if (!sessionId) return;
    const rawUserId = this.get("userId");
    const userId = typeof rawUserId === "string" && rawUserId.length > 0 ? rawUserId : "";
    const dedupKey = `${sessionId}|${userId}`;
    if (dedupKey === this.lastSyncedKey) return;
    this.lastSyncedKey = dedupKey;
    this.postCartUpdate(sessionId, userId);
  }
  postCartUpdate(sessionId, userId) {
    const attributes = { [SHOPIFY_SESSION_ATTR]: sessionId };
    if (userId.length > 0) attributes[SHOPIFY_USER_ATTR] = userId;
    try {
      fetch("/cart/update.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attributes }),
        credentials: "same-origin"
      }).then((response) => {
        if (!response.ok) {
          this.lastSyncedKey = null;
          log("debug", "Shopify cart attribute update failed", { data: { status: response.status } });
        }
      }).catch(() => {
        this.lastSyncedKey = null;
        log("debug", "Shopify cart attribute update failed");
      });
    } catch {
      this.lastSyncedKey = null;
      log("debug", "Shopify cart attribute update failed");
    }
  }
  /**
   * Sync triggers (theme-agnostic):
   *  - `visibilitychange`: catches tab refocus (long sessions, OAuth round-trips).
   *  - `pageshow` with `event.persisted === true`: catches bfcache restore so a
   *    user returning from an external checkout / Shop Pay window picks up the
   *    current sessionId before any further interaction.
   *
   * Both triggers go through `syncCartAttribute()` which dedupes by
   * `sessionId|userId`, so spurious calls cost nothing.
   */
  setupListeners() {
    this.visibilityHandler = () => {
      if (!document.hidden) {
        this.syncCartAttribute();
      }
    };
    document.addEventListener("visibilitychange", this.visibilityHandler);
    this.pageshowHandler = (event2) => {
      if (event2.persisted) this.syncCartAttribute();
    };
    window.addEventListener("pageshow", this.pageshowHandler);
  }
  cleanupListeners() {
    if (this.visibilityHandler) {
      document.removeEventListener("visibilitychange", this.visibilityHandler);
      this.visibilityHandler = null;
    }
    if (this.pageshowHandler) {
      window.removeEventListener("pageshow", this.pageshowHandler);
      this.pageshowHandler = null;
    }
  }
}
class StorageManager {
  storage;
  sessionStorageRef;
  fallbackStorage = /* @__PURE__ */ new Map();
  fallbackSessionStorage = /* @__PURE__ */ new Map();
  constructor() {
    this.storage = this.initializeStorage("localStorage");
    this.sessionStorageRef = this.initializeStorage("sessionStorage");
    if (!this.storage) {
      log("debug", "localStorage not available, using memory fallback");
    }
    if (!this.sessionStorageRef) {
      log("debug", "sessionStorage not available, using memory fallback");
    }
  }
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
  setItem(key, value) {
    this.fallbackStorage.set(key, value);
    if (!this.storage) {
      return;
    }
    try {
      this.storage.setItem(key, value);
      return;
    } catch (error) {
      const isQuotaError = error instanceof DOMException && error.name === "QuotaExceededError" || error instanceof Error && error.name === "QuotaExceededError";
      if (!isQuotaError) {
        return;
      }
      log("warn", "localStorage quota exceeded, attempting cleanup", {
        data: { key, valueSize: value.length }
      });
      if (!this.cleanupOldData()) {
        log("error", "localStorage quota exceeded and no data to cleanup - data will not persist", {
          error,
          data: { key, valueSize: value.length }
        });
        return;
      }
      try {
        this.storage.setItem(key, value);
      } catch (retryError) {
        log("error", "localStorage quota exceeded even after cleanup - data will not persist", {
          error: retryError,
          data: { key, valueSize: value.length }
        });
      }
    }
  }
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
   * Single-pass cleanup for QuotaExceededError. Purges persisted-events keys
   * (largest, safe to discard — recoverable) and up to 5 other non-critical
   * tracelog_* keys in one pass. Preserves session/user/device/config keys.
   */
  cleanupOldData() {
    if (!this.storage) {
      return false;
    }
    try {
      const criticalPrefixes = ["tracelog_session_", "tracelog_user_id", "tracelog_device_id", "tracelog_config"];
      const persistedKeys = [];
      const nonCriticalKeys = [];
      for (let i2 = 0; i2 < this.storage.length; i2++) {
        const key = this.storage.key(i2);
        if (!key?.startsWith("tracelog_")) continue;
        if (key.startsWith("tracelog_persisted_events_")) {
          persistedKeys.push(key);
        } else if (!criticalPrefixes.some((prefix) => key.startsWith(prefix))) {
          nonCriticalKeys.push(key);
        }
      }
      const keysToRemove = [...persistedKeys, ...nonCriticalKeys.slice(0, 5)];
      if (keysToRemove.length === 0) {
        return false;
      }
      keysToRemove.forEach((key) => {
        try {
          this.storage.removeItem(key);
        } catch {
        }
      });
      return true;
    } catch (error) {
      log("error", "Failed to cleanup old data", { error });
      return false;
    }
  }
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
  navigationCounter = 0;
  // Suffix counter for repeat navigations to the same path (SPA A→B→A)
  currentNavBase = null;
  currentNavId = null;
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
        log("debug", "Failed to disconnect performance observer", { error, data: { observerIndex: index } });
      }
    });
    this.observers.length = 0;
    this.reportedByNav.clear();
    this.navigationHistory.length = 0;
    this.navigationCounter = 0;
    this.currentNavBase = null;
    this.currentNavId = null;
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
      log("debug", "Failed to load web-vitals library, using fallback", { error });
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
      log("debug", "Failed to report TTFB", { error });
    }
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
      log("debug", "Invalid web vital value", { data: { type, value } });
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
  /**
   * Generates a deterministic navigation identifier for deduplication.
   *
   * **Purpose**: Every call within the same navigation must return the SAME id,
   * so `reportedByNav` can collapse duplicate Web Vitals (one emission per
   * metric type per navigation — critical for the fallback observers, which
   * fire per entry batch).
   *
   * **ID Format**: `{startTime}_{pathname}` or `{startTime}_{pathname}_{counter}`
   *
   * **Determinism**:
   * - Base id is derived only from the navigation entry's `startTime` (0 by spec
   *   for the document navigation — no `performance.now()` fallback, which made
   *   every call unique) and the current pathname.
   * - The id is cached per navigation; the counter suffix is appended ONLY on a
   *   real collision: a new navigation whose base id was already reported
   *   (SPA revisit to the same path, e.g. A→B→A), so the revisit's vitals are
   *   not suppressed by the first visit's dedup entries.
   *
   * @returns Navigation ID string or null if navigation timing unavailable
   *
   * @internal
   */
  getNavigationId() {
    try {
      const nav = performance.getEntriesByType("navigation")[0];
      if (!nav) {
        return null;
      }
      const baseId = `${nav.startTime.toFixed(2)}_${window.location.pathname}`;
      if (baseId === this.currentNavBase && this.currentNavId !== null) {
        return this.currentNavId;
      }
      this.currentNavBase = baseId;
      this.currentNavId = this.reportedByNav.has(baseId) ? `${baseId}_${++this.navigationCounter}` : baseId;
      return this.currentNavId;
    } catch (error) {
      log("debug", "Failed to get navigation ID", { error });
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
          log("debug", "Observer callback failed", {
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
      log("debug", "Failed to create performance observer", {
        error,
        data: { type }
      });
      return false;
    }
  }
  shouldSendVital(type, value) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      log("debug", "Invalid web vital value", { data: { type, value } });
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
  emitter;
  recentErrors = /* @__PURE__ */ new Map();
  pageviewSignatureCounts = /* @__PURE__ */ new Map();
  errorBurstCounter = 0;
  burstWindowStart = 0;
  burstBackoffUntil = 0;
  pagehideHandler = null;
  pageviewResetListener = null;
  constructor(eventManager, emitter) {
    super();
    this.eventManager = eventManager;
    this.emitter = emitter;
  }
  /**
   * Starts tracking JavaScript errors and promise rejections.
   *
   * - Registers global error event listener
   * - Registers unhandledrejection event listener
   * - Registers pagehide listener to reset the per-pageview signature counter
   * - Subscribes to emitter SESSION_START + PAGE_VIEW to reset the counter on new
   *   sessions and SPA route changes (the only signal `pagehide` does not cover)
   */
  startTracking() {
    window.addEventListener("error", this.handleError);
    window.addEventListener("unhandledrejection", this.handleRejection);
    this.pagehideHandler = () => {
      this.resetPageviewCounter();
    };
    window.addEventListener("pagehide", this.pagehideHandler, { passive: true });
    if (this.emitter) {
      this.pageviewResetListener = (event2) => {
        if (event2.type === EventType.SESSION_START || event2.type === EventType.PAGE_VIEW) {
          this.resetPageviewCounter();
        }
      };
      this.emitter.on(EmitterEvent.EVENT, this.pageviewResetListener);
    }
  }
  /**
   * Stops tracking errors and cleans up resources.
   *
   * - Removes error event listeners
   * - Removes pagehide listener and unsubscribes from emitter
   * - Clears recent errors and pageview signature counters
   * - Resets burst detection counters
   */
  stopTracking() {
    window.removeEventListener("error", this.handleError);
    window.removeEventListener("unhandledrejection", this.handleRejection);
    if (this.pagehideHandler) {
      window.removeEventListener("pagehide", this.pagehideHandler);
      this.pagehideHandler = null;
    }
    if (this.emitter && this.pageviewResetListener) {
      this.emitter.off(EmitterEvent.EVENT, this.pageviewResetListener);
      this.pageviewResetListener = null;
    }
    this.recentErrors.clear();
    this.pageviewSignatureCounts.clear();
    this.errorBurstCounter = 0;
    this.burstWindowStart = 0;
    this.burstBackoffUntil = 0;
  }
  /**
   * Clears the per-pageview signature counter.
   *
   * Public so `App` or tests can drive a reset explicitly; the handler itself wires
   * `pagehide` and emitter `SESSION_START` / `PAGE_VIEW` in `startTracking()`.
   */
  resetPageviewCounter() {
    this.pageviewSignatureCounts.clear();
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
      log("debug", "Error burst detected - entering cooldown", {
        data: {
          errorsInWindow: this.errorBurstCounter,
          cooldownMs: ERROR_BURST_BACKOFF_MS
        }
      });
      return false;
    }
    const config = this.get("config");
    const samplingRate = config.errorSampling ?? DEFAULT_ERROR_SAMPLING_RATE;
    return Math.random() < samplingRate;
  }
  /**
   * Returns true when the per-pageview signature cap has been hit for this error.
   * Dropped errors do not increment the counter — the 5s suppression window already
   * silences identical repeats, and double-counting here would skew the cap for any
   * later signature that recycles the same map key after a counter reset.
   */
  shouldThrottleBySignature(input) {
    const key = buildErrorSignatureKey(input);
    const current = this.pageviewSignatureCounts.get(key) ?? 0;
    if (current >= MAX_ERRORS_PER_SIGNATURE_PER_PAGEVIEW) {
      log("debug", "Error throttled (pageview cap)", {
        data: { signature: key, count: current }
      });
      return true;
    }
    const nextCount = current + 1;
    this.pageviewSignatureCounts.set(key, nextCount);
    if (this.pageviewSignatureCounts.size > MAX_PAGEVIEW_SIGNATURE_KEYS) {
      this.pageviewSignatureCounts.clear();
      this.pageviewSignatureCounts.set(key, nextCount);
    }
    return false;
  }
  handleError = (event2) => {
    if (!this.shouldSample()) {
      return;
    }
    const sanitizedMessage = this.sanitize(event2.message || "Unknown error");
    if (this.shouldSuppressError(ErrorType.JS_ERROR, sanitizedMessage)) {
      return;
    }
    if (this.shouldThrottleBySignature({
      message: sanitizedMessage,
      filename: event2.filename,
      line: event2.lineno,
      // Inline-script errors report the page URL as `filename`; passing the current
      // page URL lets buildErrorSignatureKey collapse them to origin, matching the
      // normalized input the server hashes for cap/dedup. normalizeFilename strips
      // query/hash internally.
      page_url: window.location.href
    })) {
      return;
    }
    const stack = typeof event2.error?.stack === "string" ? this.truncateStack(event2.error.stack) : void 0;
    const errorName = typeof event2.error?.name === "string" && event2.error.name !== "Error" ? event2.error.name : void 0;
    this.eventManager.track({
      type: EventType.ERROR,
      error_data: {
        type: ErrorType.JS_ERROR,
        message: sanitizedMessage,
        ...errorName !== void 0 && { name: errorName },
        ...event2.filename !== "" && { filename: event2.filename },
        ...event2.lineno !== 0 && { line: event2.lineno },
        ...event2.colno !== 0 && { column: event2.colno },
        ...stack !== void 0 && { stack }
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
    if (this.shouldThrottleBySignature({ message: sanitizedMessage })) {
      return;
    }
    const stack = event2.reason instanceof Error && typeof event2.reason.stack === "string" ? this.truncateStack(event2.reason.stack) : void 0;
    const errorName = event2.reason instanceof Error && event2.reason.name !== "Error" ? event2.reason.name : void 0;
    this.eventManager.track({
      type: EventType.ERROR,
      error_data: {
        type: ErrorType.PROMISE_REJECTION,
        message: sanitizedMessage,
        ...errorName !== void 0 && { name: errorName },
        ...stack !== void 0 && { stack }
      }
    });
  };
  extractRejectionMessage(reason) {
    if (reason == null) return "Unknown rejection";
    if (typeof reason === "string") return reason;
    if (reason instanceof Error) {
      return reason.message;
    }
    if (typeof reason === "object" && "message" in reason) {
      return String(reason.message);
    }
    try {
      return JSON.stringify(reason);
    } catch {
      return "Unserializable rejection";
    }
  }
  sanitize(text) {
    const truncated = text.length > MAX_ERROR_MESSAGE_LENGTH ? text.slice(0, MAX_ERROR_MESSAGE_LENGTH) + "..." : text;
    return sanitizePii(truncated);
  }
  shouldSuppressError(type, message) {
    const now = Date.now();
    const key = `${type}:${message}`;
    const lastSeenAt = this.recentErrors.get(key);
    if (lastSeenAt !== void 0 && now - lastSeenAt < ERROR_SUPPRESSION_WINDOW_MS) {
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
  static TRUNCATION_SUFFIX = "\n...truncated";
  truncateStack(stack) {
    if (stack.length <= MAX_STACK_TRACE_LENGTH) return sanitizePii(stack);
    const limit = MAX_STACK_TRACE_LENGTH - ErrorHandler.TRUNCATION_SUFFIX.length;
    const truncated = stack.slice(0, limit) + ErrorHandler.TRUNCATION_SUFFIX;
    return sanitizePii(truncated);
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
  pageUnloadHandler = null;
  pageShowHandler = null;
  visibilityFlushHandler = null;
  prerenderActivationHandler = null;
  emitter = new Emitter();
  managers = {};
  handlers = {};
  integrationInstances = {};
  get initialized() {
    return this.isInitialized;
  }
  /**
   * Initializes TraceLog with configuration.
   *
   * @internal Called from api.init()
   */
  async init(config = {}) {
    if (this.isInitialized) {
      return { sessionId: this.get("sessionId") ?? "" };
    }
    this.managers.storage = new StorageManager();
    try {
      this.setupState(config);
      this.managers.event = new EventManager(this.managers.storage, this.emitter);
      this.loadPersistedIdentity();
      this.initializeHandlers();
      this.setupPageLifecycleListeners();
      await this.managers.event.recoverPersistedEvents().catch((error) => {
        log("warn", "Failed to recover persisted events", { error });
      });
      this.isInitialized = true;
      return { sessionId: this.get("sessionId") ?? "" };
    } catch (error) {
      this.destroy(true);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`[TraceLog] TraceLog initialization failed: ${errorMessage}`);
    }
  }
  /**
   * Sends a custom event with optional metadata and options.
   *
   * @internal Called from api.event()
   */
  sendCustomEvent(name, metadata, options) {
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
      log("warn", `Custom event "${name}" dropped: ${error}`);
      return;
    }
    this.managers.event.track({
      type: EventType.CUSTOM,
      custom_event: {
        name,
        ...sanitizedMetadata && { metadata: sanitizedMetadata }
      }
    });
    if (options?.critical === true) {
      const ok = this.managers.event.flushImmediatelySync();
      if (!ok) {
        log("debug", "Critical event flush returned false (deferred to in-flight send or empty queue)", {
          data: { name }
        });
      }
    }
  }
  on(event2, callback) {
    this.emitter.on(event2, callback);
  }
  off(event2, callback) {
    this.emitter.off(event2, callback);
  }
  /**
   * Destroys the TraceLog instance and cleans up all resources.
   *
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
    if (this.pageUnloadHandler) {
      window.removeEventListener("pagehide", this.pageUnloadHandler);
      window.removeEventListener("beforeunload", this.pageUnloadHandler);
      this.pageUnloadHandler = null;
    }
    if (this.pageShowHandler) {
      window.removeEventListener("pageshow", this.pageShowHandler);
      this.pageShowHandler = null;
    }
    if (this.visibilityFlushHandler) {
      document.removeEventListener("visibilitychange", this.visibilityFlushHandler);
      this.visibilityFlushHandler = null;
    }
    if (this.prerenderActivationHandler) {
      document.removeEventListener("prerenderingchange", this.prerenderActivationHandler);
      this.prerenderActivationHandler = null;
    }
    this.managers.event?.flushImmediatelySync();
    this.managers.event?.stop();
    this.emitter.removeAllListeners();
    this.set("suppressNextScroll", false);
    this.set("sessionId", null);
    this.set("identity", void 0);
    this.clearPersistedIdentity();
    this.integrationInstances.shopifyCartLinker?.deactivate();
    this.integrationInstances = {};
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
    const device = getDeviceInfo();
    this.set("device", device);
    const pageUrl = normalizeUrl(window.location.href, config.sensitiveQueryParams);
    this.set("pageUrl", pageUrl);
    const isQaMode = detectQaMode();
    if (isQaMode) {
      this.set("mode", Mode.QA);
    }
  }
  /**
   * @internal Used by api.ts for configuration access
   */
  getConfig() {
    return this.get("config");
  }
  /**
   * @internal Used by api.ts for backend URL access
   */
  getCollectApiUrls() {
    return this.get("collectApiUrls");
  }
  /**
   * @internal Used by api.ts for event operations
   */
  getEventManager() {
    return this.managers.event;
  }
  /**
   * @internal Used by api.getSessionId()
   */
  getSessionId() {
    return this.get("sessionId");
  }
  /**
   * @internal Used by api.getUserId()
   */
  getUserId() {
    return this.get("userId");
  }
  /**
   * Associates the current anonymous visitor with a known user identity.
   *
   * Identity is persisted to localStorage (project-scoped) and included in every
   * subsequent batch payload so the backend always has the latest identity.
   *
   * @param userId - External user identifier (email, customer_id, etc.). Trimmed; max 256 chars.
   * @param traits - Optional user attributes (name, email, plan, etc.). Only string values
   *   are kept; non-string fields, arrays, and null are dropped silently.
   *
   * @internal Called from api.identify()
   */
  identify(userId, traits) {
    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      log("warn", "identify() called with invalid userId", {
        data: { type: typeof userId, length: typeof userId === "string" ? userId.trim().length : 0 }
      });
      return;
    }
    if (userId.trim().length > 256) {
      log("warn", "identify() userId exceeds 256 characters", { data: { length: userId.trim().length } });
      return;
    }
    const trimmedUserId = userId.trim();
    const validTraits = sanitizeTraits(traits);
    const identity = {
      userId: trimmedUserId,
      ...validTraits ? { traits: validTraits } : {}
    };
    this.set("identity", identity);
    this.persistIdentity(identity);
    log("debug", "Visitor identified", {
      data: { userIdLength: trimmedUserId.length, traitKeys: validTraits ? Object.keys(validTraits) : [] }
    });
  }
  /**
   * Clears identity, regenerates UUID, and starts a fresh session.
   *
   * Use for logout flows: the previous visitor profile remains in the backend,
   * and the next user in the same browser gets a clean anonymous profile.
   *
   * Pending events are flushed under the OLD identity first via async fetch
   * (so any in-flight authentication headers are preserved). Then the identity
   * is cleared, the userId is regenerated, and the session handler is
   * restarted to emit a new `SESSION_START`.
   *
   * @internal Called from api.resetIdentity()
   */
  async resetIdentity() {
    await this.managers.event?.flushImmediately().catch((error) => {
      log("debug", "Failed to flush before identity reset", { error });
      return false;
    });
    this.set("identity", void 0);
    this.clearPersistedIdentity();
    const newUserId = generateUUID();
    this.managers.storage.setItem(USER_ID_KEY, newUserId);
    this.set("userId", newUserId);
    this.set("hasStartSession", false);
    this.set("sessionId", null);
    this.handlers.session?.stopTracking();
    this.handlers.session?.startTracking();
    log("debug", "Identity reset, new UUID generated");
  }
  /**
   * Returns the project ID used for identity storage scoping.
   */
  getProjectId() {
    const config = this.get("config");
    return config?.integrations?.tracelog?.projectId ?? "custom";
  }
  /**
   * Persists identity to localStorage under the project-scoped key.
   */
  persistIdentity(identity) {
    try {
      const projectId = this.getProjectId();
      const key = IDENTITY_KEY(projectId);
      this.managers.storage.setItem(key, JSON.stringify(identity));
    } catch {
      log("debug", "Failed to persist identity to localStorage");
    }
  }
  /**
   * Loads identity from localStorage on init.
   * Also migrates pending identity (set before init) to the project-scoped key.
   */
  loadPersistedIdentity() {
    const storage = this.managers.storage;
    const projectId = this.getProjectId();
    const projectKey = IDENTITY_KEY(projectId);
    try {
      const pendingRaw = storage.getItem(PENDING_IDENTITY_KEY);
      if (pendingRaw) {
        const pending = JSON.parse(pendingRaw);
        storage.removeItem(PENDING_IDENTITY_KEY);
        if (!this.isValidIdentityData(pending)) {
          log("debug", "Invalid pending identity in localStorage, discarded");
          return;
        }
        const normalizedPending = this.normalizePersistedIdentity(pending);
        storage.setItem(projectKey, JSON.stringify(normalizedPending));
        this.set("identity", normalizedPending);
        log("debug", "Migrated pending identity to project-scoped key");
        return;
      }
    } catch {
      storage.removeItem(PENDING_IDENTITY_KEY);
    }
    try {
      const raw = storage.getItem(projectKey);
      if (raw) {
        const identity = JSON.parse(raw);
        if (!this.isValidIdentityData(identity)) {
          storage.removeItem(projectKey);
          log("debug", "Invalid persisted identity in localStorage, discarded");
          return;
        }
        const normalizedIdentity = this.normalizePersistedIdentity(identity);
        this.set("identity", normalizedIdentity);
        log("debug", "Loaded persisted identity");
      }
    } catch {
      log("debug", "Failed to load persisted identity");
    }
  }
  /**
   * Validates identity data loaded from localStorage. `traits` is intentionally
   * accepted as `unknown` here: `normalizePersistedIdentity()` runs it through
   * `sanitizeTraits()` so tampered values are dropped silently instead of
   * rejecting an otherwise-valid identity.
   */
  isValidIdentityData(data) {
    if (!data || typeof data !== "object") return false;
    const { userId } = data;
    if (typeof userId !== "string" || userId.trim().length === 0 || userId.trim().length > 256) return false;
    return true;
  }
  /**
   * Trims the `userId` and re-sanitizes `traits` through the same gate
   * `identify()` uses at call time, defending later batches against tampered
   * localStorage values.
   */
  normalizePersistedIdentity(identity) {
    const validTraits = sanitizeTraits(identity.traits);
    return {
      userId: identity.userId.trim(),
      ...validTraits ? { traits: validTraits } : {}
    };
  }
  /**
   * Clears persisted identity from localStorage.
   */
  clearPersistedIdentity() {
    try {
      const storage = this.managers.storage;
      const projectId = this.getProjectId();
      storage.removeItem(IDENTITY_KEY(projectId));
      storage.removeItem(PENDING_IDENTITY_KEY);
    } catch {
      log("debug", "Failed to clear persisted identity");
    }
  }
  setupPageLifecycleListeners() {
    this.pageUnloadHandler = () => {
      this.managers.event?.flushImmediatelySync();
    };
    this.pageShowHandler = (event2) => {
      if (event2.persisted) {
        void this.managers.event?.recoverPersistedEvents().catch((error) => {
          log("warn", "Failed to recover persisted events on bfcache restore", { error });
        });
      }
    };
    this.visibilityFlushHandler = () => {
      if (typeof document === "undefined" || !document.hidden) {
        return;
      }
      if (this.get("config").flushOnPageHidden === false) {
        return;
      }
      this.managers.event?.flushImmediatelySync();
    };
    window.addEventListener("pagehide", this.pageUnloadHandler);
    window.addEventListener("beforeunload", this.pageUnloadHandler);
    window.addEventListener("pageshow", this.pageShowHandler);
    document.addEventListener("visibilitychange", this.visibilityFlushHandler);
  }
  initializeHandlers() {
    const config = this.get("config");
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
    this.handlers.click = new ClickHandler(this.managers.event);
    this.handlers.scroll = new ScrollHandler(this.managers.event);
    this.handlers.performance = new PerformanceHandler(this.managers.event);
    this.handlers.error = new ErrorHandler(this.managers.event, this.emitter);
    const startInteractionTracking = () => {
      this.handlers.pageView?.startTracking();
      this.handlers.click?.startTracking();
      this.handlers.scroll?.startTracking();
      this.handlers.performance?.startTracking().catch((error) => {
        log("warn", "Failed to start performance tracking", { error });
      });
      this.handlers.error?.startTracking();
      if (config.integrations?.tracelog?.shopify) {
        const linker = new ShopifyCartLinker();
        linker.activate();
        this.integrationInstances.shopifyCartLinker = linker;
        this.emitter.on(EmitterEvent.EVENT, (event2) => {
          if (event2.type === EventType.SESSION_START) {
            linker.onSessionChange();
          }
        });
      }
    };
    if (isPrerendering()) {
      this.prerenderActivationHandler = () => {
        this.prerenderActivationHandler = null;
        startInteractionTracking();
      };
      document.addEventListener("prerenderingchange", this.prerenderActivationHandler, { once: true });
    } else {
      startInteractionTracking();
    }
  }
}
const pendingListeners = [];
let app = null;
let isInitializing = false;
let isDestroying = false;
let initPromise = null;
const init = async (config) => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return { sessionId: "" };
  }
  isDestroying = false;
  if (window.__traceLogDisabled === true) {
    return { sessionId: "" };
  }
  if (app) {
    return { sessionId: app.getSessionId() ?? "" };
  }
  if (isInitializing && initPromise) {
    return initPromise;
  }
  isInitializing = true;
  initPromise = (async () => {
    try {
      const validatedConfig = validateAndNormalizeConfig(config ?? {});
      const instance = new App();
      try {
        pendingListeners.forEach(({ event: event2, callback }) => {
          instance.on(event2, callback);
        });
        pendingListeners.length = 0;
        const appInitPromise = instance.init(validatedConfig);
        const timeoutPromise = new Promise((_2, reject) => {
          setTimeout(() => {
            reject(new Error(`[TraceLog] Initialization timeout after ${INITIALIZATION_TIMEOUT_MS}ms`));
          }, INITIALIZATION_TIMEOUT_MS);
        });
        const result = await Promise.race([appInitPromise, timeoutPromise]);
        app = instance;
        return result;
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
      initPromise = null;
    }
  })();
  return initPromise;
};
const event = (name, metadata, options) => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  if (!app) {
    throw new Error("[TraceLog] TraceLog not initialized. Please call init() first.");
  }
  if (isDestroying) {
    throw new Error("[TraceLog] Cannot send events while TraceLog is being destroyed");
  }
  app.sendCustomEvent(name, metadata, options);
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
const isInitialized = () => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }
  return app !== null;
};
const getSessionId = () => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return null;
  }
  if (!app) {
    return null;
  }
  return app.getSessionId();
};
const getUserId = () => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return null;
  }
  if (!app) {
    return null;
  }
  return app.getUserId();
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
    initPromise = null;
    pendingListeners.length = 0;
    if (typeof window !== "undefined" && window.__traceLogBridge) {
      window.__traceLogBridge = void 0;
    }
    isDestroying = false;
  } catch (error) {
    app = null;
    isInitializing = false;
    initPromise = null;
    pendingListeners.length = 0;
    isDestroying = false;
    log("warn", "Error during destroy, forced cleanup completed", { error });
  }
};
const identify = (userId, traits) => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
    log("warn", "identify() called with invalid userId");
    return;
  }
  if (userId.trim().length > 256) {
    log("warn", "identify() userId exceeds 256 characters");
    return;
  }
  if (isDestroying) {
    log("warn", "Cannot identify while TraceLog is being destroyed");
    return;
  }
  if (app) {
    app.identify(userId, traits);
    return;
  }
  try {
    const validTraits = sanitizeTraits(traits);
    const identity = {
      userId: userId.trim(),
      ...validTraits ? { traits: validTraits } : {}
    };
    localStorage.setItem(PENDING_IDENTITY_KEY, JSON.stringify(identity));
    log("debug", "Identity persisted pre-init (will be applied on init)");
  } catch {
    log("debug", "Failed to persist pre-init identity");
  }
};
const resetIdentity = async () => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  if (!app) {
    try {
      localStorage.removeItem(PENDING_IDENTITY_KEY);
    } catch {
    }
    return;
  }
  if (isDestroying) {
    throw new Error("[TraceLog] Cannot reset identity while TraceLog is being destroyed");
  }
  await app.resetIdentity();
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
const __getInitState = () => {
  return { isInitializing, isDestroying };
};
if (typeof window !== "undefined" && typeof document !== "undefined") {
  void Promise.resolve().then(() => testBridge).then((module) => {
    if (typeof module.injectTestBridge === "function") {
      module.injectTestBridge();
    }
  }).catch(() => {
  });
  void Promise.resolve().then(() => mode_utils).then((module) => {
    if (typeof module.detectQaMode === "function") {
      module.detectQaMode();
    }
  }).catch(() => {
  });
}
const api = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  __getInitState,
  __setAppInstance,
  destroy,
  event,
  getSessionId,
  getUserId,
  identify,
  init,
  isInitialized,
  off,
  on,
  resetIdentity
}, Symbol.toStringTag, { value: "Module" }));
const tracelog = {
  init,
  event,
  on,
  off,
  isInitialized,
  getSessionId,
  getUserId,
  destroy,
  identify,
  resetIdentity
};
var e, n, t, r, i, o = -1, a = function(e3) {
  addEventListener("pageshow", (function(n2) {
    n2.persisted && (o = n2.timeStamp, e3(n2));
  }), true);
}, c = function() {
  var e3 = self.performance && performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
  if (e3 && e3.responseStart > 0 && e3.responseStart < performance.now()) return e3;
}, u = function() {
  var e3 = c();
  return e3 && e3.activationStart || 0;
}, f = function(e3, n2) {
  var t2 = c(), r2 = "navigate";
  o >= 0 ? r2 = "back-forward-cache" : t2 && (document.prerendering || u() > 0 ? r2 = "prerender" : document.wasDiscarded ? r2 = "restore" : t2.type && (r2 = t2.type.replace(/_/g, "-")));
  return { name: e3, value: void 0 === n2 ? -1 : n2, rating: "good", delta: 0, entries: [], id: "v4-".concat(Date.now(), "-").concat(Math.floor(8999999999999 * Math.random()) + 1e12), navigationType: r2 };
}, s = function(e3, n2, t2) {
  try {
    if (PerformanceObserver.supportedEntryTypes.includes(e3)) {
      var r2 = new PerformanceObserver((function(e4) {
        Promise.resolve().then((function() {
          n2(e4.getEntries());
        }));
      }));
      return r2.observe(Object.assign({ type: e3, buffered: true }, t2 || {})), r2;
    }
  } catch (e4) {
  }
}, d = function(e3, n2, t2, r2) {
  var i2, o2;
  return function(a2) {
    n2.value >= 0 && (a2 || r2) && ((o2 = n2.value - (i2 || 0)) || void 0 === i2) && (i2 = n2.value, n2.delta = o2, n2.rating = (function(e4, n3) {
      return e4 > n3[1] ? "poor" : e4 > n3[0] ? "needs-improvement" : "good";
    })(n2.value, t2), e3(n2));
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
  var n2 = false;
  return function() {
    n2 || (e3(), n2 = true);
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
}, b = [1800, 3e3], S = function(e3, n2) {
  n2 = n2 || {}, C((function() {
    var t2, r2 = E(), i2 = f("FCP"), o2 = s("paint", (function(e4) {
      e4.forEach((function(e5) {
        "first-contentful-paint" === e5.name && (o2.disconnect(), e5.startTime < r2.firstHiddenTime && (i2.value = Math.max(e5.startTime - u(), 0), i2.entries.push(e5), t2(true)));
      }));
    }));
    o2 && (t2 = d(e3, i2, b, n2.reportAllChanges), a((function(r3) {
      i2 = f("FCP"), t2 = d(e3, i2, b, n2.reportAllChanges), l((function() {
        i2.value = performance.now() - r3.timeStamp, t2(true);
      }));
    })));
  }));
}, L = [0.1, 0.25], w = function(e3, n2) {
  n2 = n2 || {}, S(v((function() {
    var t2, r2 = f("CLS", 0), i2 = 0, o2 = [], c2 = function(e4) {
      e4.forEach((function(e5) {
        if (!e5.hadRecentInput) {
          var n3 = o2[0], t3 = o2[o2.length - 1];
          i2 && e5.startTime - t3.startTime < 1e3 && e5.startTime - n3.startTime < 5e3 ? (i2 += e5.value, o2.push(e5)) : (i2 = e5.value, o2 = [e5]);
        }
      })), i2 > r2.value && (r2.value = i2, r2.entries = o2, t2());
    }, u2 = s("layout-shift", c2);
    u2 && (t2 = d(e3, r2, L, n2.reportAllChanges), p((function() {
      c2(u2.takeRecords()), t2(true);
    })), a((function() {
      i2 = 0, r2 = f("CLS", 0), t2 = d(e3, r2, L, n2.reportAllChanges), l((function() {
        return t2();
      }));
    })), setTimeout(t2, 0));
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
  if (H.forEach((function(n3) {
    return n3(e3);
  })), e3.interactionId || "first-input" === e3.entryType) {
    var n2 = D[D.length - 1], t2 = x.get(e3.interactionId);
    if (t2 || D.length < 10 || e3.duration > n2.latency) {
      if (t2) e3.duration > t2.latency ? (t2.entries = [e3], t2.latency = e3.duration) : e3.duration === t2.latency && e3.startTime === t2.entries[0].startTime && t2.entries.push(e3);
      else {
        var r2 = { id: e3.interactionId, latency: e3.duration, entries: [e3] };
        x.set(r2.id, r2), D.push(r2);
      }
      D.sort((function(e4, n3) {
        return n3.latency - e4.latency;
      })), D.length > 10 && D.splice(10).forEach((function(e4) {
        return x.delete(e4.id);
      }));
    }
  }
}, O = function(e3) {
  var n2 = self.requestIdleCallback || self.setTimeout, t2 = -1;
  return e3 = v(e3), "hidden" === document.visibilityState ? e3() : (t2 = n2(e3), p(e3)), t2;
}, N = [200, 500], j = function(e3, n2) {
  "PerformanceEventTiming" in self && "interactionId" in PerformanceEventTiming.prototype && (n2 = n2 || {}, C((function() {
    var t2;
    F();
    var r2, i2 = f("INP"), o2 = function(e4) {
      O((function() {
        e4.forEach(q);
        var n3 = B();
        n3 && n3.latency !== i2.value && (i2.value = n3.latency, i2.entries = n3.entries, r2());
      }));
    }, c2 = s("event", o2, { durationThreshold: null !== (t2 = n2.durationThreshold) && void 0 !== t2 ? t2 : 40 });
    r2 = d(e3, i2, N, n2.reportAllChanges), c2 && (c2.observe({ type: "first-input", buffered: true }), p((function() {
      o2(c2.takeRecords()), r2(true);
    })), a((function() {
      R = k(), D.length = 0, x.clear(), i2 = f("INP"), r2 = d(e3, i2, N, n2.reportAllChanges);
    })));
  })));
}, _ = [2500, 4e3], z = {}, G = function(e3, n2) {
  n2 = n2 || {}, C((function() {
    var t2, r2 = E(), i2 = f("LCP"), o2 = function(e4) {
      n2.reportAllChanges || (e4 = e4.slice(-1)), e4.forEach((function(e5) {
        e5.startTime < r2.firstHiddenTime && (i2.value = Math.max(e5.startTime - u(), 0), i2.entries = [e5], t2());
      }));
    }, c2 = s("largest-contentful-paint", o2);
    if (c2) {
      t2 = d(e3, i2, _, n2.reportAllChanges);
      var m2 = v((function() {
        z[i2.id] || (o2(c2.takeRecords()), c2.disconnect(), z[i2.id] = true, t2(true));
      }));
      ["keydown", "click"].forEach((function(e4) {
        addEventListener(e4, (function() {
          return O(m2);
        }), { once: true, capture: true });
      })), p(m2), a((function(r3) {
        i2 = f("LCP"), t2 = d(e3, i2, _, n2.reportAllChanges), l((function() {
          i2.value = performance.now() - r3.timeStamp, z[i2.id] = true, t2(true);
        }));
      }));
    }
  }));
}, J = [800, 1800], K = function e2(n2) {
  document.prerendering ? C((function() {
    return e2(n2);
  })) : "complete" !== document.readyState ? addEventListener("load", (function() {
    return e2(n2);
  }), true) : setTimeout(n2, 0);
}, Q = function(e3, n2) {
  n2 = n2 || {};
  var t2 = f("TTFB"), r2 = d(e3, t2, J, n2.reportAllChanges);
  K((function() {
    var i2 = c();
    i2 && (t2.value = Math.max(i2.responseStart - u(), 0), t2.entries = [i2], r2(true), a((function() {
      t2 = f("TTFB", 0), (r2 = d(e3, t2, J, n2.reportAllChanges))(true);
    })));
  }));
}, U = { passive: true, capture: true }, V = /* @__PURE__ */ new Date(), W = function(e3, i2) {
  n || (n = i2, t = e3, r = /* @__PURE__ */ new Date(), Z(removeEventListener), X());
}, X = function() {
  if (t >= 0 && t < r - V) {
    var e3 = { entryType: "first-input", name: n.type, target: n.target, cancelable: n.cancelable, startTime: n.timeStamp, processingStart: n.timeStamp + t };
    i.forEach((function(n2) {
      n2(e3);
    })), i = [];
  }
}, Y = function(e3) {
  if (e3.cancelable) {
    var n2 = (e3.timeStamp > 1e12 ? /* @__PURE__ */ new Date() : performance.now()) - e3.timeStamp;
    "pointerdown" == e3.type ? (function(e4, n3) {
      var t2 = function() {
        W(e4, n3), i2();
      }, r2 = function() {
        i2();
      }, i2 = function() {
        removeEventListener("pointerup", t2, U), removeEventListener("pointercancel", r2, U);
      };
      addEventListener("pointerup", t2, U), addEventListener("pointercancel", r2, U);
    })(n2, e3) : W(n2, e3);
  }
}, Z = function(e3) {
  ["mousedown", "keydown", "touchstart", "pointerdown"].forEach((function(n2) {
    return e3(n2, Y, U);
  }));
}, $ = [100, 300], ee = function(e3, r2) {
  r2 = r2 || {}, C((function() {
    var o2, c2 = E(), u2 = f("FID"), l2 = function(e4) {
      e4.startTime < c2.firstHiddenTime && (u2.value = e4.processingStart - e4.startTime, u2.entries.push(e4), o2(true));
    }, m2 = function(e4) {
      e4.forEach(l2);
    }, h2 = s("first-input", m2);
    o2 = d(e3, u2, $, r2.reportAllChanges), h2 && (p(v((function() {
      m2(h2.takeRecords()), h2.disconnect();
    }))), a((function() {
      var a2;
      u2 = f("FID"), o2 = d(e3, u2, $, r2.reportAllChanges), i = [], t = -1, n = null, Z(addEventListener), a2 = l2, i.push(a2), X();
    })));
  }));
};
const webVitals = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  CLSThresholds: L,
  FCPThresholds: b,
  FIDThresholds: $,
  INPThresholds: N,
  LCPThresholds: _,
  TTFBThresholds: J,
  onCLS: w,
  onFCP: S,
  onFID: ee,
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
      return await super.init(config);
    } catch (error) {
      const { __setAppInstance: __setAppInstance2 } = await Promise.resolve().then(() => api);
      __setAppInstance2(null);
      throw error;
    }
  }
  sendCustomEvent(name, data, options) {
    if (!this.initialized) {
      return;
    }
    super.sendCustomEvent(name, data, options);
  }
  event(name, metadata, options) {
    this.sendCustomEvent(name, metadata, options);
  }
  getSessionData() {
    const sessionId = this.get("sessionId");
    const config = this.get("config");
    return {
      id: sessionId ?? null,
      isActive: sessionId !== null && sessionId !== "",
      timeout: config.sessionTimeout ?? 15 * 60 * 1e3
    };
  }
  getQueueLength() {
    return this.managers.event?.getQueueLength() ?? 0;
  }
  getEventManager() {
    return this.managers.event;
  }
  getPerformanceHandler() {
    return this.handlers.performance ?? null;
  }
  getErrorHandler() {
    return this.handlers.error ?? null;
  }
  getSessionHandler() {
    return this.handlers.session ?? null;
  }
  getPageViewHandler() {
    return this.handlers.pageView ?? null;
  }
  getClickHandler() {
    return this.handlers.click ?? null;
  }
  getScrollHandler() {
    return this.handlers.scroll ?? null;
  }
  getHandlers() {
    return {
      performance: this.getPerformanceHandler(),
      error: this.getErrorHandler(),
      session: this.getSessionHandler(),
      pageView: this.getPageViewHandler(),
      click: this.getClickHandler(),
      scroll: this.getScrollHandler()
    };
  }
  getStorageManager() {
    return this.managers.storage ?? null;
  }
  getQueueEvents() {
    return this.managers.event?.getQueueEvents() ?? [];
  }
  get(key) {
    return super.get(key);
  }
  getFullState() {
    return this.getState();
  }
  getState() {
    return super.getState();
  }
  async waitForInitialization(timeout = 5e3) {
    const startTime = Date.now();
    while (!this.initialized && Date.now() - startTime < timeout) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (!this.initialized) {
      throw new Error("[TraceLog] Initialization timeout");
    }
  }
  async flushQueue() {
    await this.managers.event?.flushQueue();
  }
  clearQueue() {
    this.managers.event?.clearQueue();
  }
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
  MAX_NESTED_OBJECT_KEYS,
  MAX_STRING_LENGTH,
  MAX_STRING_LENGTH_IN_ARRAY,
  Mode,
  PII_PATTERNS,
  PermanentError,
  RateLimitError,
  SamplingRateValidationError,
  ScrollDirection,
  SessionTimeoutValidationError,
  SpecialApiUrl,
  TimeoutError,
  TraceLogValidationError,
  WEB_VITALS_GOOD_THRESHOLDS,
  WEB_VITALS_NEEDS_IMPROVEMENT_THRESHOLDS,
  WEB_VITALS_POOR_THRESHOLDS,
  getWebVitalsThresholds,
  tracelog
};
//# sourceMappingURL=tracelog.esm.js.map
