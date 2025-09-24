const W = {};
class v {
  get(e) {
    return W[e];
  }
  set(e, t) {
    const s = W[e];
    W[e] = t, (e === "sessionId" || e === "config" || e === "hasStartSession") && i.debug("StateManager", "Critical state updated", {
      key: e,
      oldValue: e === "config" ? !!s : s,
      newValue: e === "config" ? !!t : t
    });
  }
}
class De extends v {
  /**
   * Client-facing error - Configuration/usage errors by the client
   * Console: qa and debug modes | Events: NODE_ENV=dev
   */
  clientError(e, t, s) {
    this.logMessage("CLIENT_ERROR", e, t, s);
  }
  /**
   * Client-facing warning - Configuration/usage warnings by the client
   * Console: qa and debug modes | Events: NODE_ENV=dev
   */
  clientWarn(e, t, s) {
    this.logMessage("CLIENT_WARN", e, t, s);
  }
  /**
   * General operational information
   * Console: qa and debug modes | Events: NODE_ENV=dev
   */
  info(e, t, s) {
    this.logMessage("INFO", e, t, s);
  }
  /**
   * Internal library errors
   * Console: debug mode only | Events: NODE_ENV=dev
   */
  error(e, t, s) {
    this.logMessage("ERROR", e, t, s);
  }
  /**
   * Internal library warnings
   * Console: debug mode only | Events: NODE_ENV=dev
   */
  warn(e, t, s) {
    this.logMessage("WARN", e, t, s);
  }
  /**
   * Strategic debug information
   * Console: debug mode only | Events: NODE_ENV=dev
   */
  debug(e, t, s) {
    this.logMessage("DEBUG", e, t, s);
  }
  /**
   * Detailed trace information
   * Console: debug mode only | Events: NODE_ENV=dev
   */
  verbose(e, t, s) {
    this.logMessage("VERBOSE", e, t, s);
  }
  getCurrentMode() {
    try {
      return this.get("config")?.mode;
    } catch {
      return;
    }
  }
  shouldShowLog(e) {
    const t = this.getCurrentMode();
    if (["CLIENT_ERROR", "ERROR"].includes(e))
      return !0;
    if (!t)
      return ["CLIENT_ERROR", "CLIENT_WARN"].includes(e);
    switch (t) {
      case "qa":
        return ["INFO", "CLIENT_ERROR", "CLIENT_WARN"].includes(e);
      case "debug":
        return !0;
      default:
        return !1;
    }
  }
  formatMessage(e, t) {
    return `[TraceLog:${e}] ${t}`;
  }
  getConsoleMethod(e) {
    switch (e) {
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
  logMessage(e, t, s, n) {
    if (!this.shouldShowLog(e))
      return;
    const a = this.formatMessage(t, s), o = this.getConsoleMethod(e);
    n !== void 0 ? console[o](a, n) : console[o](a);
  }
  /**
   * Dispatches tracelog:log events for E2E testing and development debugging
   */
  dispatchEvent(e, t, s, n) {
    if (!(typeof window > "u" || typeof CustomEvent > "u"))
      try {
        const a = new CustomEvent("tracelog:log", {
          detail: {
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            level: e,
            namespace: t,
            message: s,
            data: n
          }
        });
        window.dispatchEvent(a);
      } catch {
        console.log(`[TraceLog:${t}] ${s}`, n);
      }
  }
}
const i = new De();
class we {
  currentDelay;
  initialDelay;
  maxDelay;
  multiplier;
  attemptCount = 0;
  name;
  constructor(e, t = "BackoffManager") {
    this.initialDelay = e.initialDelay, this.maxDelay = e.maxDelay, this.multiplier = e.multiplier, this.currentDelay = this.initialDelay, this.name = t, i.debug(this.name, "BackoffManager initialized", {
      initialDelay: this.initialDelay,
      maxDelay: this.maxDelay,
      multiplier: this.multiplier
    });
  }
  getNextDelay() {
    const e = this.currentDelay;
    return this.currentDelay = Math.min(this.currentDelay * this.multiplier, this.maxDelay), this.attemptCount++, i.debug(this.name, "Backoff delay calculated", {
      currentDelay: e,
      nextDelay: this.currentDelay,
      attemptCount: this.attemptCount
    }), e;
  }
  getCurrentDelay() {
    return this.currentDelay;
  }
  reset() {
    const e = this.currentDelay !== this.initialDelay || this.attemptCount > 0;
    this.currentDelay = this.initialDelay, this.attemptCount = 0, e && i.debug(this.name, "BackoffManager reset", {
      resetToDelay: this.initialDelay
    });
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
var E = /* @__PURE__ */ ((r) => (r.Mobile = "mobile", r.Tablet = "tablet", r.Desktop = "desktop", r.Unknown = "unknown", r))(E || {});
let Z, Ie;
const He = () => {
  typeof window < "u" && !Z && (Z = window.matchMedia("(pointer: coarse)"), Ie = window.matchMedia("(hover: none)"));
}, Te = () => {
  try {
    i.debug("DeviceDetector", "Starting device detection");
    const r = navigator;
    if (r.userAgentData && typeof r.userAgentData.mobile == "boolean") {
      if (i.debug("DeviceDetector", "Using modern User-Agent Client Hints API", {
        mobile: r.userAgentData.mobile,
        platform: r.userAgentData.platform
      }), r.userAgentData.platform && /ipad|tablet/i.test(r.userAgentData.platform))
        return i.debug("DeviceDetector", "Device detected as tablet via platform hint"), E.Tablet;
      const l = r.userAgentData.mobile ? E.Mobile : E.Desktop;
      return i.debug("DeviceDetector", "Device detected via User-Agent hints", { result: l }), l;
    }
    i.debug("DeviceDetector", "Using fallback detection methods"), He();
    const e = window.innerWidth, t = Z?.matches ?? !1, s = Ie?.matches ?? !1, n = "ontouchstart" in window || navigator.maxTouchPoints > 0, a = navigator.userAgent.toLowerCase(), o = /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/.test(a), d = /tablet|ipad|android(?!.*mobile)/.test(a), c = {
      width: e,
      hasCoarsePointer: t,
      hasNoHover: s,
      hasTouchSupport: n,
      isMobileUA: o,
      isTabletUA: d,
      maxTouchPoints: navigator.maxTouchPoints
    };
    return e <= 767 || o && n ? (i.debug("DeviceDetector", "Device detected as mobile", c), E.Mobile) : e >= 768 && e <= 1024 || d || t && s && n ? (i.debug("DeviceDetector", "Device detected as tablet", c), E.Tablet) : (i.debug("DeviceDetector", "Device detected as desktop", c), E.Desktop);
  } catch (r) {
    return i.warn("DeviceDetector", "Device detection failed, defaulting to desktop", {
      error: r instanceof Error ? r.message : r
    }), E.Desktop;
  }
}, Ue = 2, Oe = 10, Me = 1, re = 500, ee = 3e4, te = 864e5, ae = 120, oe = 8 * 1024, ce = 10, le = 10, A = 255, T = 1e3, q = 100, de = 3, k = 2, xe = 4, Fe = 0.75, ze = 0.2, Ve = 2e3, ue = 1e3, $e = 10, X = 2e3, Be = 6e4, F = 10, he = 5 * 60 * 1e3, je = 6e4, _ = 15 * 60 * 1e3, Ge = 3e4, Ae = 1e3, Ce = 250, Qe = 2e3, ge = 1e3, We = 1e4, qe = 1e3, fe = 10, Xe = 24, Ke = Ae, Ye = 5e3, Je = 2e3, Ze = 2, et = 3, K = 24 * 60 * 60 * 1e3, Y = 2 * 60 * 1e3, Re = {
  samplingRate: Me,
  tags: [],
  excludedUrlPaths: []
}, tt = (r) => ({
  ...Re,
  ...r,
  sessionTimeout: _,
  allowHttp: !1
}), _e = {
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
}, z = "data-tl", me = [
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
], st = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"], pe = {
  /** Maximum number of retries when waiting for concurrent initialization */
  MAX_CONCURRENT_RETRIES: 20,
  /** Delay between retries when waiting for concurrent initialization (ms) */
  CONCURRENT_RETRY_DELAY_MS: 50,
  /** Timeout for overall initialization process (ms) */
  INITIALIZATION_TIMEOUT_MS: 1e4
}, D = {
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
}, ve = {
  /** Timeout for session synchronization operations (ms) */
  SYNC_TIMEOUT_MS: 2e3,
  /** Maximum retry attempts for session operations */
  MAX_RETRY_ATTEMPTS: 3
}, it = {
  /** Multiplier for scroll debounce time when suppressing scroll events */
  SUPPRESS_MULTIPLIER: 2
}, Le = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<embed\b[^>]*>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi
], y = "tl", ye = (r) => r ? `${y}:${r}:uid` : `${y}:uid`, nt = (r) => r ? `${y}:${r}:queue` : `${y}:queue`, rt = (r) => r ? `${y}:${r}:session` : `${y}:session`, J = (r) => r ? `${y}:${r}:cross_tab_session` : `${y}:cross_tab_session`, Se = (r, e) => `${y}:${r}:tab:${e}:info`, V = (r) => r ? `${y}:${r}:recovery` : `${y}:recovery`, at = (r) => r ? `${y}:${r}:broadcast` : `${y}:broadcast`, ot = /* @__PURE__ */ new Set([
  "mode",
  "tags",
  "samplingRate",
  "excludedUrlPaths",
  "ipExcluded"
]), w = {
  // Project ID validation - consistent message across all layers
  MISSING_PROJECT_ID: "Project ID is required",
  PROJECT_ID_EMPTY_AFTER_TRIM: "Project ID is required",
  // Session timeout validation
  INVALID_SESSION_TIMEOUT: `Session timeout must be between ${ee}ms (30 seconds) and ${te}ms (24 hours)`,
  INVALID_ERROR_SAMPLING_RATE: "Error sampling must be between 0 and 1",
  // Integration validation
  INVALID_GOOGLE_ANALYTICS_ID: "Google Analytics measurement ID is required when integration is enabled",
  // UI validation
  INVALID_SCROLL_CONTAINER_SELECTORS: "Scroll container selectors must be valid CSS selectors",
  // Global metadata validation
  INVALID_GLOBAL_METADATA: "Global metadata must be an object",
  // Array validation
  INVALID_SENSITIVE_QUERY_PARAMS: "Sensitive query params must be an array of strings"
}, ct = () => {
  i.debug("UTMParams", "Extracting UTM parameters from URL", {
    url: window.location.href,
    search: window.location.search
  });
  const r = new URLSearchParams(window.location.search), e = {};
  st.forEach((s) => {
    const n = r.get(s);
    if (n) {
      const a = s.split("utm_")[1];
      e[a] = n, i.debug("UTMParams", "Found UTM parameter", { param: s, key: a, value: n });
    }
  });
  const t = Object.keys(e).length ? e : void 0;
  return t ? i.debug("UTMParams", "UTM parameters extracted successfully", {
    parameterCount: Object.keys(t).length,
    parameters: Object.keys(t)
  }) : i.debug("UTMParams", "No UTM parameters found in URL"), t;
}, $ = () => {
  const r = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (e) => {
    const t = Math.random() * 16 | 0;
    return (e === "x" ? t : t & 3 | 8).toString(16);
  });
  return i.verbose("UUIDUtils", "Generated new UUID", { uuid: r }), r;
};
var C = /* @__PURE__ */ ((r) => (r.HttpSkip = "http-skip", r.HttpLocal = "http-local", r))(C || {}), u = /* @__PURE__ */ ((r) => (r.PAGE_VIEW = "page_view", r.CLICK = "click", r.SCROLL = "scroll", r.SESSION_START = "session_start", r.SESSION_END = "session_end", r.CUSTOM = "custom", r.WEB_VITALS = "web_vitals", r.ERROR = "error", r))(u || {}), B = /* @__PURE__ */ ((r) => (r.UP = "up", r.DOWN = "down", r))(B || {}), U = /* @__PURE__ */ ((r) => (r.JS_ERROR = "js_error", r.PROMISE_REJECTION = "promise_rejection", r.NETWORK_ERROR = "network_error", r))(U || {}), R = /* @__PURE__ */ ((r) => (r.QA = "qa", r.DEBUG = "debug", r))(R || {}), j = /* @__PURE__ */ ((r) => (r.AND = "AND", r.OR = "OR", r))(j || {}), p = /* @__PURE__ */ ((r) => (r.URL_MATCHES = "url_matches", r.ELEMENT_MATCHES = "element_matches", r.DEVICE_TYPE = "device_type", r.ELEMENT_TEXT = "element_text", r.ELEMENT_ATTRIBUTE = "element_attribute", r.UTM_SOURCE = "utm_source", r.UTM_MEDIUM = "utm_medium", r.UTM_CAMPAIGN = "utm_campaign", r))(p || {}), f = /* @__PURE__ */ ((r) => (r.EQUALS = "equals", r.CONTAINS = "contains", r.STARTS_WITH = "starts_with", r.ENDS_WITH = "ends_with", r.REGEX = "regex", r.GREATER_THAN = "greater_than", r.LESS_THAN = "less_than", r.EXISTS = "exists", r.NOT_EXISTS = "not_exists", r))(f || {});
class O extends Error {
  constructor(e, t, s) {
    super(e), this.errorCode = t, this.layer = s, this.name = this.constructor.name, Error.captureStackTrace && Error.captureStackTrace(this, this.constructor);
  }
}
class G extends O {
  constructor(e = "Project ID is required", t = "config") {
    super(e, "PROJECT_ID_INVALID", t);
  }
}
class H extends O {
  constructor(e, t = "config") {
    super(e, "APP_CONFIG_INVALID", t);
  }
}
class lt extends O {
  constructor(e, t = "config") {
    super(e, "SESSION_TIMEOUT_INVALID", t);
  }
}
class dt extends O {
  constructor(e, t = "config") {
    super(e, "SAMPLING_RATE_INVALID", t);
  }
}
class be extends O {
  constructor(e, t = "config") {
    super(e, "INTEGRATION_INVALID", t);
  }
}
const ut = (r) => {
  if (!r || typeof r != "object")
    throw i.clientError("ConfigValidation", "Configuration must be an object", { config: r }), new H("Configuration must be an object", "config");
  if (!("id" in r))
    throw i.clientError("ConfigValidation", "Project ID is missing from configuration"), new G(w.MISSING_PROJECT_ID, "config");
  if (r.id === null || r.id === void 0 || typeof r.id != "string")
    throw i.clientError("ConfigValidation", "Project ID must be a non-empty string", {
      providedId: r.id,
      type: typeof r.id
    }), new G(w.MISSING_PROJECT_ID, "config");
  if (r.sessionTimeout !== void 0 && (typeof r.sessionTimeout != "number" || r.sessionTimeout < ee || r.sessionTimeout > te))
    throw i.clientError("ConfigValidation", "Invalid session timeout", {
      provided: r.sessionTimeout,
      min: ee,
      max: te
    }), new lt(w.INVALID_SESSION_TIMEOUT, "config");
  if (r.globalMetadata !== void 0 && (typeof r.globalMetadata != "object" || r.globalMetadata === null))
    throw i.clientError("ConfigValidation", "Global metadata must be an object", {
      provided: r.globalMetadata,
      type: typeof r.globalMetadata
    }), new H(w.INVALID_GLOBAL_METADATA, "config");
  if (r.scrollContainerSelectors !== void 0 && ht(r.scrollContainerSelectors), r.integrations && gt(r.integrations), r.sensitiveQueryParams !== void 0) {
    if (!Array.isArray(r.sensitiveQueryParams))
      throw i.clientError("ConfigValidation", "Sensitive query params must be an array", {
        provided: r.sensitiveQueryParams,
        type: typeof r.sensitiveQueryParams
      }), new H(w.INVALID_SENSITIVE_QUERY_PARAMS, "config");
    for (const e of r.sensitiveQueryParams)
      if (typeof e != "string")
        throw i.clientError("ConfigValidation", "All sensitive query params must be strings", {
          param: e,
          type: typeof e
        }), new H("All sensitive query params must be strings", "config");
  }
  if (r.errorSampling !== void 0 && (typeof r.errorSampling != "number" || r.errorSampling < 0 || r.errorSampling > 1))
    throw i.clientError("ConfigValidation", "Invalid error sampling rate", {
      provided: r.errorSampling,
      expected: "0-1"
    }), new dt(w.INVALID_ERROR_SAMPLING_RATE, "config");
}, ht = (r) => {
  const e = Array.isArray(r) ? r : [r];
  for (const t of e) {
    if (typeof t != "string" || t.trim() === "")
      throw i.clientError("ConfigValidation", "Invalid scroll container selector", {
        selector: t,
        type: typeof t,
        isEmpty: t === "" || typeof t == "string" && t.trim() === ""
      }), new H(w.INVALID_SCROLL_CONTAINER_SELECTORS, "config");
    if (typeof document < "u")
      try {
        document.querySelector(t);
      } catch {
        i.clientWarn("ConfigValidation", `Invalid CSS selector will be ignored: "${t}"`);
      }
  }
}, gt = (r) => {
  if (r && r.googleAnalytics) {
    if (!r.googleAnalytics.measurementId || typeof r.googleAnalytics.measurementId != "string" || r.googleAnalytics.measurementId.trim() === "")
      throw i.clientError("ConfigValidation", "Invalid Google Analytics measurement ID", {
        provided: r.googleAnalytics.measurementId,
        type: typeof r.googleAnalytics.measurementId
      }), new be(w.INVALID_GOOGLE_ANALYTICS_ID, "config");
    const e = r.googleAnalytics.measurementId.trim();
    if (!e.match(/^(G-|UA-)/))
      throw i.clientError("ConfigValidation", 'Google Analytics measurement ID must start with "G-" or "UA-"', {
        provided: e
      }), new be('Google Analytics measurement ID must start with "G-" or "UA-"', "config");
  }
}, ft = (r) => {
  ut(r);
  const e = {
    ...r,
    id: r.id.trim(),
    globalMetadata: r.globalMetadata ?? {},
    sensitiveQueryParams: r.sensitiveQueryParams ?? []
  };
  if (!e.id)
    throw i.clientError("ConfigValidation", "Project ID is empty after trimming whitespace", {
      originalId: r.id,
      normalizedId: e.id
    }), new G(w.PROJECT_ID_EMPTY_AFTER_TRIM, "config");
  return e;
}, Ee = (r) => {
  if (!r || typeof r != "string" || r.trim().length === 0)
    return i.debug("Sanitize", "String sanitization skipped - empty or invalid input", { value: r, type: typeof r }), "";
  const e = r.length;
  let t = r;
  r.length > T && (t = r.slice(0, Math.max(0, T)), i.warn("Sanitize", "String truncated due to length limit", {
    originalLength: e,
    maxLength: T,
    truncatedLength: t.length
  }));
  let s = 0;
  for (const a of Le) {
    const o = t;
    t = t.replace(a, ""), o !== t && s++;
  }
  s > 0 && i.warn("Sanitize", "XSS patterns detected and removed", {
    patternMatches: s,
    originalValue: r.slice(0, 100)
    // Log first 100 chars for debugging
  }), t = t.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#x27;").replaceAll("/", "&#x2F;");
  const n = t.trim();
  return (e > 50 || s > 0) && i.debug("Sanitize", "String sanitization completed", {
    originalLength: e,
    sanitizedLength: n.length,
    xssPatternMatches: s,
    wasTruncated: e > T
  }), n;
}, mt = (r) => {
  if (typeof r != "string")
    return "";
  r.length > T && (r = r.slice(0, Math.max(0, T)));
  let e = r;
  for (const t of Le)
    e = e.replace(t, "");
  return e = e.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#x27;"), e.trim();
}, Q = (r, e = 0) => {
  if (e > de)
    return i.warn("Sanitize", "Maximum object depth exceeded during sanitization", {
      depth: e,
      maxDepth: de
    }), null;
  if (r == null)
    return null;
  if (typeof r == "string")
    return Ee(r);
  if (typeof r == "number")
    return !Number.isFinite(r) || r < -Number.MAX_SAFE_INTEGER || r > Number.MAX_SAFE_INTEGER ? (i.warn("Sanitize", "Invalid number sanitized to 0", { value: r, isFinite: Number.isFinite(r) }), 0) : r;
  if (typeof r == "boolean")
    return r;
  if (Array.isArray(r)) {
    const t = r.length, s = r.slice(0, q);
    t > q && i.warn("Sanitize", "Array truncated due to length limit", {
      originalLength: t,
      maxLength: q,
      depth: e
    });
    const n = s.map((a) => Q(a, e + 1)).filter((a) => a !== null);
    return t > 0 && n.length === 0 && i.warn("Sanitize", "All array items were filtered out during sanitization", { originalLength: t, depth: e }), n;
  }
  if (typeof r == "object") {
    const t = {}, s = Object.entries(r), n = s.length, a = s.slice(0, 20);
    n > 20 && i.warn("Sanitize", "Object keys truncated due to limit", {
      originalKeys: n,
      maxKeys: 20,
      depth: e
    });
    let o = 0;
    for (const [d, c] of a) {
      const l = Ee(d);
      if (l) {
        const h = Q(c, e + 1);
        h !== null ? t[l] = h : o++;
      } else
        o++;
    }
    return o > 0 && i.debug("Sanitize", "Object properties filtered during sanitization", {
      filteredKeysCount: o,
      remainingKeys: Object.keys(t).length,
      depth: e
    }), t;
  }
  return i.debug("Sanitize", "Unknown value type sanitized to null", { type: typeof r, depth: e }), null;
}, pt = (r) => {
  i.debug("Sanitize", "Starting API config sanitization");
  const e = {};
  if (typeof r != "object" || r === null)
    return i.warn("Sanitize", "API config data is not an object", { data: r, type: typeof r }), e;
  try {
    const t = Object.keys(r);
    let s = 0, n = 0;
    for (const a of t)
      if (ot.has(a)) {
        const o = r[a];
        if (a === "excludedUrlPaths") {
          const d = Array.isArray(o) ? o : typeof o == "string" ? [o] : [], c = d.length;
          e.excludedUrlPaths = d.map((h) => mt(String(h))).filter(Boolean);
          const l = c - e.excludedUrlPaths.length;
          l > 0 && i.warn("Sanitize", "Some excluded URL paths were filtered during sanitization", {
            originalCount: c,
            filteredCount: l
          });
        } else if (a === "tags")
          Array.isArray(o) ? (e.tags = o, i.debug("Sanitize", "Tags processed", { count: o.length })) : i.warn("Sanitize", "Tags value is not an array", { value: o, type: typeof o });
        else {
          const d = Q(o);
          d !== null ? e[a] = d : i.warn("Sanitize", "API config value sanitized to null", { key: a, originalValue: o });
        }
        s++;
      } else
        n++, i.debug("Sanitize", "API config key not allowed", { key: a });
    i.info("Sanitize", "API config sanitization completed", {
      originalKeys: t.length,
      processedKeys: s,
      filteredKeys: n,
      finalKeys: Object.keys(e).length
    });
  } catch (t) {
    throw i.error("Sanitize", "API config sanitization failed", {
      error: t instanceof Error ? t.message : t
    }), new Error(`API config sanitization failed: ${t instanceof Error ? t.message : "Unknown error"}`);
  }
  return e;
}, vt = (r) => {
  if (i.debug("Sanitize", "Starting metadata sanitization", { hasMetadata: r != null }), typeof r != "object" || r === null)
    return i.debug("Sanitize", "Metadata is not an object, returning empty object", {
      metadata: r,
      type: typeof r
    }), {};
  try {
    const e = Object.keys(r).length, t = Q(r), s = typeof t == "object" && t !== null ? t : {}, n = Object.keys(s).length;
    return i.debug("Sanitize", "Metadata sanitization completed", {
      originalKeys: e,
      finalKeys: n,
      keysFiltered: e - n
    }), s;
  } catch (e) {
    throw i.error("Sanitize", "Metadata sanitization failed", {
      error: e instanceof Error ? e.message : e
    }), new Error(`Metadata sanitization failed: ${e instanceof Error ? e.message : "Unknown error"}`);
  }
}, yt = (r) => {
  if (typeof r != "object" || r === null)
    return !1;
  for (const e of Object.values(r)) {
    if (e == null)
      continue;
    const t = typeof e;
    if (!(t === "string" || t === "number" || t === "boolean")) {
      if (Array.isArray(e)) {
        if (!e.every((s) => typeof s == "string"))
          return !1;
        continue;
      }
      return !1;
    }
  }
  return !0;
}, St = (r) => typeof r != "string" ? {
  valid: !1,
  error: "Event name must be a string"
} : r.length === 0 ? {
  valid: !1,
  error: "Event name cannot be empty"
} : r.length > ae ? {
  valid: !1,
  error: `Event name is too long (max ${ae} characters)`
} : r.includes("<") || r.includes(">") || r.includes("&") ? {
  valid: !1,
  error: "Event name contains invalid characters"
} : ["constructor", "prototype", "__proto__", "eval", "function", "var", "let", "const"].includes(r.toLowerCase()) ? {
  valid: !1,
  error: "Event name cannot be a reserved word"
} : { valid: !0 }, bt = (r, e, t) => {
  const s = vt(e), n = `${t} "${r}" metadata error`;
  if (!yt(s))
    return {
      valid: !1,
      error: `${n}: object has invalid types. Valid types are string, number, boolean or string arrays.`
    };
  let a;
  try {
    a = JSON.stringify(s);
  } catch {
    return {
      valid: !1,
      error: `${n}: object contains circular references or cannot be serialized.`
    };
  }
  if (a.length > oe)
    return {
      valid: !1,
      error: `${n}: object is too large (max ${oe / 1024} KB).`
    };
  if (Object.keys(s).length > ce)
    return {
      valid: !1,
      error: `${n}: object has too many keys (max ${ce} keys).`
    };
  for (const [d, c] of Object.entries(s)) {
    if (Array.isArray(c)) {
      if (c.length > le)
        return {
          valid: !1,
          error: `${n}: array property "${d}" is too large (max ${le} items).`
        };
      for (const l of c)
        if (typeof l == "string" && l.length > 500)
          return {
            valid: !1,
            error: `${n}: array property "${d}" contains strings that are too long (max 500 characters).`
          };
    }
    if (typeof c == "string" && c.length > T)
      return {
        valid: !1,
        error: `${n}: property "${d}" is too long (max ${T} characters).`
      };
  }
  return {
    valid: !0,
    sanitizedMetadata: s
  };
}, Et = (r, e) => {
  const t = St(r);
  if (!t.valid)
    return i.clientError("EventValidation", "Event name validation failed", { eventName: r, error: t.error }), t;
  if (!e)
    return { valid: !0 };
  const s = bt(r, e, "customEvent");
  return s.valid || i.clientError("EventValidation", "Event metadata validation failed", {
    eventName: r,
    error: s.error
  }), s;
}, se = (r, e = !1) => {
  try {
    const t = new URL(r), s = t.protocol === "https:", n = t.protocol === "http:";
    return s || e && n;
  } catch {
    return !1;
  }
}, wt = (r, e = !1) => {
  i.debug("URLUtils", "Generating API URL", { projectId: r, allowHttp: e });
  const t = new URL(window.location.href), s = t.hostname, n = s.split(".");
  if (n.length === 0)
    throw i.clientError("URLUtils", "Invalid hostname - no domain parts found", { hostname: s }), new Error("Invalid URL");
  const a = n.slice(-2).join("."), o = e && t.protocol === "http:" ? "http" : "https", d = `${o}://${r}.${a}`;
  if (i.debug("URLUtils", "Generated API URL", {
    originalUrl: window.location.href,
    hostname: s,
    domainParts: n.length,
    cleanDomain: a,
    protocol: o,
    generatedUrl: d
  }), !se(d, e))
    throw i.clientError("URLUtils", "Generated API URL failed validation", {
      apiUrl: d,
      allowHttp: e
    }), new Error("Invalid URL");
  return i.debug("URLUtils", "API URL generation completed successfully", { apiUrl: d }), d;
}, ie = (r, e = []) => {
  i.debug("URLUtils", "Normalizing URL", {
    urlLength: r.length,
    sensitiveParamsCount: e.length
  });
  try {
    const t = new URL(r), s = t.searchParams, n = Array.from(s.keys()).length;
    let a = !1;
    const o = [];
    if (e.forEach((c) => {
      s.has(c) && (s.delete(c), a = !0, o.push(c));
    }), a && i.debug("URLUtils", "Sensitive parameters removed from URL", {
      removedParams: o,
      originalParamCount: n,
      finalParamCount: Array.from(s.keys()).length
    }), !a && r.includes("?"))
      return i.debug("URLUtils", "URL normalization - no changes needed"), r;
    t.search = s.toString();
    const d = t.toString();
    return i.debug("URLUtils", "URL normalization completed", {
      hasChanged: a,
      originalLength: r.length,
      normalizedLength: d.length
    }), d;
  } catch (t) {
    return i.warn("URLUtils", "URL normalization failed, returning original", {
      url: r.slice(0, 100),
      error: t instanceof Error ? t.message : t
    }), r;
  }
}, It = (r, e = []) => {
  if (i.debug("URLUtils", "Checking if URL path is excluded", {
    urlLength: r.length,
    excludedPathsCount: e.length
  }), e.length === 0)
    return i.debug("URLUtils", "No excluded paths configured"), !1;
  let t;
  try {
    t = new URL(r, window.location.origin).pathname, i.debug("URLUtils", "Extracted path from URL", { path: t });
  } catch (c) {
    return i.warn("URLUtils", "Failed to parse URL for path exclusion check", {
      url: r.slice(0, 100),
      error: c instanceof Error ? c.message : c
    }), !1;
  }
  const s = (c) => typeof c == "object" && c !== void 0 && typeof c.test == "function", n = (c) => c.replaceAll(/[$()*+.?[\\\]^{|}]/g, "\\$&"), a = (c) => new RegExp(
    "^" + c.split("*").map((l) => n(l)).join(".+") + "$"
  ), o = e.find((c) => {
    try {
      if (s(c)) {
        const h = c.test(t);
        return h && i.debug("URLUtils", "Path matched regex pattern", { path: t, pattern: c.toString() }), h;
      }
      if (c.includes("*")) {
        const h = a(c), g = h.test(t);
        return g && i.debug("URLUtils", "Path matched wildcard pattern", { path: t, pattern: c, regex: h.toString() }), g;
      }
      const l = c === t;
      return l && i.debug("URLUtils", "Path matched exact pattern", { path: t, pattern: c }), l;
    } catch (l) {
      return i.warn("URLUtils", "Error testing exclusion pattern", {
        pattern: c,
        path: t,
        error: l instanceof Error ? l.message : l
      }), !1;
    }
  }), d = !!o;
  return i.debug("URLUtils", "URL path exclusion check completed", {
    path: t,
    isExcluded: d,
    matchedPattern: o ?? null,
    totalPatternsChecked: e.length
  }), d;
};
async function ke(r, e = {}) {
  const { timeout: t = 1e4, ...s } = e, n = new AbortController(), a = setTimeout(() => {
    n.abort();
  }, t);
  try {
    const o = await fetch(r, {
      ...s,
      signal: n.signal
    });
    return clearTimeout(a), o;
  } catch (o) {
    throw clearTimeout(a), o instanceof Error && o.name === "AbortError" ? new Error(`Request timeout after ${t}ms`) : o;
  }
}
class Tt {
  getUrl(e, t = !1) {
    const s = wt(e, t);
    if (!se(s, t))
      throw new Error("Invalid URL");
    return s;
  }
}
class Mt {
  async get(e, t) {
    if (t.id === C.HttpSkip)
      return i.debug("ConfigManager", "Using special project id"), this.getDefaultConfig(t);
    i.debug("ConfigManager", "Loading config from API", { apiUrl: e, projectId: t.id });
    const s = await this.load(e, t, t.id === C.HttpLocal);
    return i.info("ConfigManager", "Config loaded successfully", {
      projectId: t.id,
      mode: s.mode,
      hasExcludedPaths: !!s.excludedUrlPaths?.length,
      hasGlobalMetadata: !!s.globalMetadata
    }), s;
  }
  async load(e, t, s) {
    try {
      const n = s ? `${window.location.origin}/config` : this.getUrl(e);
      if (!n)
        throw new Error("Config URL is not valid or not allowed");
      const a = await ke(n, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        timeout: 1e4
        // 10 segundos timeout
      });
      if (!a.ok) {
        const b = `HTTP ${a.status}: ${a.statusText}`;
        throw i.error("ConfigManager", "Config API request failed", {
          status: a.status,
          statusText: a.statusText,
          configUrl: n
        }), new Error(b);
      }
      const o = await a.json();
      if (o == null || typeof o != "object" || Array.isArray(o))
        throw i.error("ConfigManager", "Invalid config API response format", {
          responseType: typeof o,
          isArray: Array.isArray(o)
        }), new Error("Invalid config API response: expected object");
      const d = pt(o), l = { ...{ ...Re, ...d }, ...t };
      new URLSearchParams(window.location.search).get("qaMode") === "true" && !l.mode && (l.mode = R.QA, i.info("ConfigManager", "QA mode enabled via URL parameter"));
      const S = Object.values(R).includes(l.mode) ? 1 : l.errorSampling ?? 0.1;
      return { ...l, errorSampling: S };
    } catch (n) {
      const a = n instanceof Error ? n.message : "Unknown error";
      throw i.error("ConfigManager", "Failed to load config", { error: a, apiUrl: e }), new Error(`Failed to load config: ${a}`);
    }
  }
  getUrl(e) {
    const s = new URLSearchParams(window.location.search).get("qaMode") === "true";
    let n = `${e}/config`;
    if (s && (n += "?qaMode=true"), !se(n))
      throw i.clientError("ConfigManager", "Invalid config URL provided", { configUrl: n }), new Error("Config URL is not valid or not allowed");
    return n;
  }
  getDefaultConfig(e) {
    return tt({
      ...e,
      errorSampling: 1,
      ...Object.values(C).includes(e.id) && { mode: R.DEBUG }
    });
  }
}
class At extends v {
  storeManager;
  memoryFallbackStorage = /* @__PURE__ */ new Map();
  retryBackoffManager;
  retryTimeoutId = null;
  retryCount = 0;
  isRetrying = !1;
  constructor(e) {
    super(), this.storeManager = e, this.retryBackoffManager = new we(_e.RETRY, "SenderManager-Retry");
  }
  getQueueStorageKey() {
    return `${nt(this.get("config")?.id)}:${this.get("userId")}`;
  }
  async sendEventsQueueAsync(e) {
    if (this.shouldSkipSend())
      return this.logQueue(e), !0;
    if (!(await this.persistWithFallback(e)).success)
      return !!await this.sendImmediate(e);
    const s = await this.send(e);
    return s ? (this.clearPersistedEvents(), this.resetRetryState()) : this.scheduleRetry(e), s;
  }
  sendEventsQueueSync(e) {
    if (this.shouldSkipSend())
      return this.logQueue(e), !0;
    const t = this.sendQueueSyncInternal(e);
    return t && (this.clearPersistedEvents(), this.resetRetryState()), t;
  }
  async sendEventsQueue(e, t) {
    if (this.shouldSkipSend())
      return this.logQueue(e), !0;
    const s = await this.persistWithFallback(e);
    if (!s.success)
      return i.error("SenderManager", "All persistence methods failed", {
        primaryError: s.primaryError,
        fallbackError: s.fallbackError,
        eventCount: e.events.length
      }), await this.sendImmediate(e) ? (t?.onSuccess?.(), !0) : (t?.onFailure?.(), !1);
    const n = await this.send(e);
    return n ? (this.clearPersistedEvents(), this.resetRetryState(), t?.onSuccess?.()) : (this.scheduleRetry(e, t), t?.onFailure?.()), n;
  }
  async recoverPersistedEvents(e) {
    try {
      const t = this.getPersistedData();
      if (!t || !this.isDataRecent(t) || t.events.length === 0) {
        this.clearPersistedEvents();
        return;
      }
      i.info("SenderManager", "Persisted events recovered", {
        eventsCount: t.events.length,
        sessionId: t.sessionId
      });
      const s = this.createRecoveryBody(t);
      await this.send(s) ? (this.clearPersistedEvents(), this.resetRetryState(), e?.onSuccess?.()) : (this.scheduleRetry(s, e), e?.onFailure?.());
    } catch (t) {
      i.error("SenderManager", "Failed to recover persisted events", { error: t });
    }
  }
  async persistEventsForRecovery(e) {
    return (await this.persistWithFallback(e)).success;
  }
  stop() {
    this.clearRetryTimeout(), this.resetRetryState();
  }
  async send(e) {
    const { url: t, payload: s } = this.prepareRequest(e);
    try {
      return (await ke(t, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: s,
        keepalive: !0,
        credentials: "include",
        timeout: 15e3
        // 15 segundos timeout para events
      })).ok;
    } catch (n) {
      return i.error("SenderManager", "Send request failed", { error: n }), !1;
    }
  }
  sendQueueSyncInternal(e) {
    const { url: t, payload: s } = this.prepareRequest(e), n = new Blob([s], { type: "application/json" });
    return this.isSendBeaconAvailable() && navigator.sendBeacon(t, n) ? !0 : this.sendSyncXHR(t, s);
  }
  sendSyncXHR(e, t) {
    const s = new XMLHttpRequest();
    try {
      return s.open("POST", e, !1), s.setRequestHeader("Content-Type", "application/json"), s.setRequestHeader("Origin", window.location.origin), s.setRequestHeader("Referer", window.location.href), s.withCredentials = !0, s.timeout = Ve, s.send(t), s.status >= 200 && s.status < 300;
    } catch (n) {
      const a = n instanceof Error ? n.message : String(n), o = a.includes("CORS") || a.includes("NotSameOrigin") || a.includes("blocked");
      return i.warn("SenderManager", "Sync XHR failed", {
        error: a,
        isCorsError: o,
        status: s.status ?? "unknown",
        url: e.replace(/\/\/[^/]+/, "//[DOMAIN]")
      }), !1;
    }
  }
  prepareRequest(e) {
    return {
      url: `${this.get("config").id === C.HttpLocal ? window.location.origin : this.get("apiUrl")}/collect`,
      payload: JSON.stringify(e)
    };
  }
  getPersistedData() {
    try {
      const e = this.getQueueStorageKey(), t = this.storeManager.getItem(e);
      if (t)
        return JSON.parse(t);
    } catch (e) {
      i.warn("SenderManager", "Failed to get persisted data from localStorage", { error: e });
    }
    try {
      const e = this.getQueueStorageKey() + "_session_fallback", t = sessionStorage.getItem(e);
      if (t)
        return i.info("SenderManager", "Recovering data from sessionStorage fallback"), JSON.parse(t);
    } catch (e) {
      i.warn("SenderManager", "Failed to get persisted data from sessionStorage", { error: e });
    }
    try {
      const e = this.get("sessionId");
      if (e && this.memoryFallbackStorage.has(e)) {
        const t = this.memoryFallbackStorage.get(e);
        if (t)
          return i.info("SenderManager", "Recovering data from memory fallback"), {
            userId: t.data.user_id,
            sessionId: t.data.session_id,
            device: t.data.device,
            events: t.data.events,
            timestamp: t.timestamp,
            fallbackMode: !0,
            ...t.data.global_metadata && { global_metadata: t.data.global_metadata }
          };
      }
    } catch (e) {
      i.warn("SenderManager", "Failed to get persisted data from memory fallback", { error: e });
    }
    return null;
  }
  isDataRecent(e) {
    return (Date.now() - e.timestamp) / 36e5 < Xe;
  }
  createRecoveryBody(e) {
    return {
      user_id: e.userId,
      session_id: e.sessionId,
      device: e.device,
      events: e.events,
      ...e.global_metadata && { global_metadata: e.global_metadata }
    };
  }
  logQueue(e) {
    i.info("SenderManager", " ⏩ Queue snapshot", e);
  }
  async persistWithFallback(e) {
    try {
      if (this.persistFailedEvents(e))
        return { success: !0 };
    } catch (t) {
      i.warn("SenderManager", "Primary persistence failed", { primaryError: t });
    }
    try {
      if (this.persistToSessionStorage(e))
        return i.info("SenderManager", "Using sessionStorage fallback for persistence"), { success: !0 };
    } catch (t) {
      i.warn("SenderManager", "Fallback persistence failed", { fallbackError: t });
    }
    try {
      return this.memoryFallbackStorage.set(e.session_id, {
        data: e,
        timestamp: Date.now(),
        retryCount: 0
      }), i.warn("SenderManager", "Using memory fallback for persistence (data will be lost on page reload)"), { success: !0 };
    } catch {
      return {
        success: !1,
        primaryError: "localStorage failed",
        fallbackError: "All persistence methods failed"
      };
    }
  }
  persistToSessionStorage(e) {
    try {
      const t = this.getQueueStorageKey() + "_session_fallback", s = {
        userId: e.user_id,
        sessionId: e.session_id,
        device: e.device,
        events: e.events,
        timestamp: Date.now(),
        fallbackMode: !0,
        ...e.global_metadata && { global_metadata: e.global_metadata }
      };
      return sessionStorage.setItem(t, JSON.stringify(s)), !!sessionStorage.getItem(t);
    } catch (t) {
      return i.error("SenderManager", "SessionStorage persistence failed", { error: t }), !1;
    }
  }
  async sendImmediate(e) {
    i.warn("SenderManager", "Attempting immediate send as last resort");
    try {
      const t = await this.send(e);
      return t && i.info("SenderManager", "Immediate send successful, events saved"), t;
    } catch (t) {
      return i.error("SenderManager", "Immediate send failed", { error: t }), !1;
    }
  }
  persistFailedEvents(e) {
    try {
      const t = {
        userId: e.user_id,
        sessionId: e.session_id,
        device: e.device,
        events: e.events,
        timestamp: Date.now(),
        ...e.global_metadata && { global_metadata: e.global_metadata }
      }, s = this.getQueueStorageKey();
      return this.storeManager.setItem(s, JSON.stringify(t)), !!this.storeManager.getItem(s);
    } catch (t) {
      return i.error("SenderManager", "Failed to persist events", { error: t }), !1;
    }
  }
  clearPersistedEvents() {
    this.storeManager.removeItem(this.getQueueStorageKey());
    try {
      const t = this.getQueueStorageKey() + "_session_fallback";
      sessionStorage.removeItem(t);
    } catch (t) {
      i.warn("SenderManager", "Failed to clear sessionStorage fallback", { error: t });
    }
    const e = this.get("sessionId");
    e && this.memoryFallbackStorage.has(e) && (this.memoryFallbackStorage.delete(e), i.debug("SenderManager", "Cleared memory fallback storage", { sessionId: e }));
  }
  resetRetryState() {
    this.retryBackoffManager.reset(), this.retryCount = 0, this.isRetrying = !1, this.clearRetryTimeout();
  }
  scheduleRetry(e, t) {
    if (this.retryTimeoutId !== null || this.isRetrying)
      return;
    if (this.retryCount >= fe) {
      this.clearPersistedEvents(), this.resetRetryState(), t?.onFailure?.();
      return;
    }
    if (this.isCircuitBreakerOpen())
      return;
    this.retryTimeoutId = window.setTimeout(async () => {
      if (this.retryTimeoutId = null, this.isCircuitBreakerOpen() || this.isRetrying)
        return;
      this.retryCount++, this.isRetrying = !0;
      const n = await this.send(e);
      this.isRetrying = !1, n ? (this.clearPersistedEvents(), this.resetRetryState(), t?.onSuccess?.()) : this.retryCount >= fe ? (this.clearPersistedEvents(), this.resetRetryState(), t?.onFailure?.()) : this.scheduleRetry(e, t);
    }, this.retryBackoffManager.getCurrentDelay());
    const s = this.retryBackoffManager.getNextDelay();
    i.debug("SenderManager", "Retry scheduled", {
      retryCount: this.retryCount,
      retryDelay: s,
      eventsCount: e.events.length
    });
  }
  shouldSkipSend() {
    const e = this.get("config"), { id: t, mode: s } = e || {}, n = [R.QA, R.DEBUG];
    return t === C.HttpSkip ? !0 : !!s && n.includes(s) && t !== C.HttpLocal;
  }
  isSendBeaconAvailable() {
    return typeof navigator.sendBeacon == "function";
  }
  clearRetryTimeout() {
    this.retryTimeoutId !== null && (clearTimeout(this.retryTimeoutId), this.retryTimeoutId = null);
  }
  isCircuitBreakerOpen() {
    return this.get("circuitBreakerOpen") === !0;
  }
}
class Ct extends v {
  shouldSampleEvent(e, t) {
    return this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug" ? !0 : e === u.WEB_VITALS ? this.isWebVitalEventSampledIn(t?.type) : this.isSampledIn();
  }
  isSampledIn() {
    const e = this.get("config").samplingRate ?? Me;
    return e >= 1 ? !0 : e <= 0 ? !1 : this.getHash(this.get("userId")) % 100 / 100 < e;
  }
  isWebVitalEventSampledIn(e) {
    const t = e === "LONG_TASK", s = t ? ze : Fe;
    if (s >= 1) return !0;
    if (s <= 0) return !1;
    const n = `${this.get("userId")}|${t ? "long_task" : "web_vitals"}`;
    return this.getHash(n) % 100 / 100 < s;
  }
  getHash(e) {
    let t = 0;
    for (let s = 0; s < e.length; s++) {
      const n = e.charCodeAt(s);
      t = (t << 5) - t + n, t |= 0;
    }
    return Math.abs(t);
  }
}
class Rt extends v {
  getEventTagsIds(e, t) {
    switch (e.type) {
      case u.PAGE_VIEW:
        return this.checkEventTypePageView(e, t);
      case u.CLICK:
        return this.checkEventTypeClick(e, t);
      default:
        return [];
    }
  }
  checkEventTypePageView(e, t) {
    const s = this.get("config")?.tags?.filter((a) => a.triggerType === u.PAGE_VIEW) ?? [];
    if (s.length === 0)
      return [];
    const n = [];
    for (const a of s) {
      const { id: o, logicalOperator: d, conditions: c } = a, l = [];
      for (const g of c)
        switch (g.type) {
          case p.URL_MATCHES: {
            l.push(this.matchUrlMatches(g, e.page_url));
            break;
          }
          case p.DEVICE_TYPE: {
            l.push(this.matchDeviceType(g, t));
            break;
          }
          case p.UTM_SOURCE: {
            l.push(this.matchUtmCondition(g, e.utm?.source));
            break;
          }
          case p.UTM_MEDIUM: {
            l.push(this.matchUtmCondition(g, e.utm?.medium));
            break;
          }
          case p.UTM_CAMPAIGN: {
            l.push(this.matchUtmCondition(g, e.utm?.campaign));
            break;
          }
        }
      let h = !1;
      h = d === j.AND ? l.every(Boolean) : l.some(Boolean), h && n.push(o);
    }
    return n;
  }
  checkEventTypeClick(e, t) {
    const s = this.get("config")?.tags?.filter((a) => a.triggerType === u.CLICK) ?? [];
    if (s.length === 0)
      return [];
    const n = [];
    for (const a of s) {
      const { id: o, logicalOperator: d, conditions: c } = a, l = [];
      for (const g of c) {
        if (!e.click_data) {
          l.push(!1);
          continue;
        }
        const S = e.click_data;
        switch (g.type) {
          case p.ELEMENT_MATCHES: {
            l.push(this.matchElementSelector(g, S));
            break;
          }
          case p.DEVICE_TYPE: {
            l.push(this.matchDeviceType(g, t));
            break;
          }
          case p.URL_MATCHES: {
            l.push(this.matchUrlMatches(g, e.page_url));
            break;
          }
          case p.UTM_SOURCE: {
            l.push(this.matchUtmCondition(g, e.utm?.source));
            break;
          }
          case p.UTM_MEDIUM: {
            l.push(this.matchUtmCondition(g, e.utm?.medium));
            break;
          }
          case p.UTM_CAMPAIGN: {
            l.push(this.matchUtmCondition(g, e.utm?.campaign));
            break;
          }
        }
      }
      let h = !1;
      h = d === j.AND ? l.every(Boolean) : l.some(Boolean), h && n.push(o);
    }
    return n;
  }
  matchUrlMatches(e, t) {
    if (e.type !== p.URL_MATCHES)
      return !1;
    const s = e.value.toLowerCase(), n = t.toLowerCase();
    switch (e.operator) {
      case f.EQUALS:
        return n === s;
      case f.CONTAINS:
        return n.includes(s);
      case f.STARTS_WITH:
        return n.startsWith(s);
      case f.ENDS_WITH:
        return n.endsWith(s);
      case f.REGEX:
        try {
          return new RegExp(s, "gi").test(n);
        } catch {
          return !1;
        }
      default:
        return !1;
    }
  }
  matchDeviceType(e, t) {
    if (e.type !== p.DEVICE_TYPE)
      return !1;
    const s = e.value.toLowerCase(), n = t.toLowerCase();
    switch (e.operator) {
      case f.EQUALS:
        return n === s;
      case f.CONTAINS:
        return n.includes(s);
      case f.STARTS_WITH:
        return n.startsWith(s);
      case f.ENDS_WITH:
        return n.endsWith(s);
      case f.REGEX:
        try {
          return new RegExp(s, "gi").test(n);
        } catch {
          return !1;
        }
      default:
        return !1;
    }
  }
  matchElementSelector(e, t) {
    if (e.type !== p.ELEMENT_MATCHES)
      return !1;
    const s = [
      t.id ?? "",
      t.class ?? "",
      t.tag ?? "",
      t.text ?? "",
      t.href ?? "",
      t.title ?? "",
      t.alt ?? "",
      t.role ?? "",
      t.ariaLabel ?? "",
      ...Object.values(t.dataAttributes ?? {})
    ].join(" "), n = e.value.toLowerCase(), a = s.toLowerCase();
    switch (e.operator) {
      case f.EQUALS:
        return this.checkElementFieldEquals(t, n);
      case f.CONTAINS:
        return a.includes(n);
      case f.STARTS_WITH:
        return a.startsWith(n);
      case f.ENDS_WITH:
        return a.endsWith(n);
      case f.REGEX:
        try {
          return new RegExp(n, "gi").test(a);
        } catch {
          return !1;
        }
      default:
        return !1;
    }
  }
  matchUtmCondition(e, t) {
    if (![p.UTM_SOURCE, p.UTM_MEDIUM, p.UTM_CAMPAIGN].includes(
      e.type
    ))
      return !1;
    const s = t ?? "", n = e.value.toLowerCase(), a = s.toLowerCase();
    switch (e.operator) {
      case f.EQUALS:
        return a === n;
      case f.CONTAINS:
        return a.includes(n);
      case f.STARTS_WITH:
        return a.startsWith(n);
      case f.ENDS_WITH:
        return a.endsWith(n);
      case f.REGEX:
        try {
          return new RegExp(n, "gi").test(a);
        } catch {
          return !1;
        }
      default:
        return !1;
    }
  }
  checkElementFieldEquals(e, t) {
    const s = [
      e.id,
      e.class,
      e.tag,
      e.text,
      e.href,
      e.title,
      e.alt,
      e.role,
      e.ariaLabel
    ];
    for (const n of s)
      if (n) {
        const a = n.toLowerCase(), o = t.toLowerCase();
        if (a === o)
          return !0;
      }
    if (e.dataAttributes)
      for (const n of Object.values(e.dataAttributes)) {
        const a = n.toLowerCase(), o = t.toLowerCase();
        if (a === o)
          return !0;
      }
    return !1;
  }
}
class _t extends v {
  googleAnalytics;
  samplingManager;
  tagsManager;
  dataSender;
  storageManager;
  eventsQueue = [];
  lastEvent = null;
  eventsQueueIntervalId = null;
  intervalActive = !1;
  // Circuit breaker properties
  failureCount = 0;
  MAX_FAILURES = D.MAX_FAILURES;
  circuitOpen = !1;
  circuitOpenTime = 0;
  backoffManager;
  circuitResetTimeoutId = null;
  isSending = !1;
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
  constructor(e, t = null) {
    super(), this.storageManager = e, this.googleAnalytics = t, this.samplingManager = new Ct(), this.tagsManager = new Rt(), this.dataSender = new At(e), this.backoffManager = new we(_e.CIRCUIT_BREAKER, "EventManager-CircuitBreaker"), this.set("circuitBreakerOpen", !1), this.setupCircuitBreakerHealthCheck(), i.debug("EventManager", "EventManager initialized", {
      hasGoogleAnalytics: !!t
    });
  }
  /**
   * Recovers persisted events from localStorage with enhanced error tracking
   * Should be called after initialization to recover any events that failed to send
   */
  async recoverPersistedEvents() {
    await this.dataSender.recoverPersistedEvents({
      onSuccess: () => {
        this.failureCount = 0, this.backoffManager.reset(), i.info("EventManager", "Persisted events recovered successfully", {
          recoveryStats: this.errorRecoveryStats
        });
      },
      onFailure: async () => {
        this.failureCount++, this.errorRecoveryStats.persistenceFailures++, i.warn("EventManager", "Failed to recover persisted events", {
          failureCount: this.failureCount,
          persistenceFailures: this.errorRecoveryStats.persistenceFailures
        }), this.failureCount >= this.MAX_FAILURES && await this.openCircuitBreaker();
      }
    });
  }
  track({
    type: e,
    page_url: t,
    from_page_url: s,
    scroll_data: n,
    click_data: a,
    custom_event: o,
    web_vitals: d,
    session_end_reason: c,
    session_start_recovered: l
  }) {
    if (this.circuitOpen) {
      i.debug("EventManager", "Event dropped - circuit breaker is open", { type: e });
      return;
    }
    if (this.manageFingerprintMemory(), !this.samplingManager.shouldSampleEvent(e, d)) {
      i.debug("EventManager", "Event filtered by sampling", { type: e, samplingActive: !0 });
      return;
    }
    if (this.isDuplicatedEvent({
      type: e,
      page_url: t,
      scroll_data: n,
      click_data: a,
      custom_event: o,
      web_vitals: d,
      session_end_reason: c,
      session_start_recovered: l
    })) {
      const L = Date.now();
      if (this.eventsQueue && this.eventsQueue.length > 0) {
        const N = this.eventsQueue.at(-1);
        N && (N.timestamp = L);
      }
      this.lastEvent && (this.lastEvent.timestamp = L), i.debug("EventManager", "Duplicate event detected, timestamp updated", {
        type: e,
        queueLength: this.eventsQueue.length
      });
      return;
    }
    const g = t || this.get("pageUrl"), S = It(g, this.get("config").excludedUrlPaths), M = this.get("hasStartSession"), b = e == u.SESSION_END;
    if (S && (!b || b && !M)) {
      (this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug") && i.debug("EventManager", `Event ${e} on excluded route: ${t}`);
      return;
    }
    const P = e === u.SESSION_START;
    P && this.set("hasStartSession", !0);
    const ne = P ? ct() : void 0, x = {
      type: e,
      page_url: S ? "excluded" : g,
      timestamp: Date.now(),
      ...P && { referrer: document.referrer || "Direct" },
      ...s && !S ? { from_page_url: s } : {},
      ...n && { scroll_data: n },
      ...a && { click_data: a },
      ...o && { custom_event: o },
      ...ne && { utm: ne },
      ...d && { web_vitals: d },
      ...c && { session_end_reason: c },
      ...l && { session_start_recovered: l }
    };
    if (this.get("config")?.tags?.length) {
      const L = this.tagsManager.getEventTagsIds(x, this.get("device"));
      L?.length && (x.tags = this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug" ? L.map((N) => ({
        id: N,
        key: this.get("config")?.tags?.find((Ne) => Ne.id === N)?.key ?? ""
      })) : L);
    }
    this.lastEvent = x, this.processAndSend(x);
  }
  stop() {
    this.eventsQueueIntervalId && (clearInterval(this.eventsQueueIntervalId), this.eventsQueueIntervalId = null, this.intervalActive = !1), this.circuitResetTimeoutId && (clearTimeout(this.circuitResetTimeoutId), this.circuitResetTimeoutId = null), this.circuitBreakerHealthCheckInterval && (clearInterval(this.circuitBreakerHealthCheckInterval), this.circuitBreakerHealthCheckInterval = null), this.eventFingerprints.clear(), this.lastFingerprintCleanup = Date.now(), this.circuitOpen = !1, this.circuitOpenTime = 0, this.failureCount = 0, this.backoffManager.reset(), this.lastEvent = null, this.errorRecoveryStats.circuitBreakerResets = 0, this.errorRecoveryStats.persistenceFailures = 0, this.errorRecoveryStats.networkTimeouts = 0, this.errorRecoveryStats.lastRecoveryAttempt = 0, this.dataSender.stop(), i.debug("EventManager", "EventManager stopped and all intervals cleaned up");
  }
  processAndSend(e) {
    if (!this.get("config").ipExcluded) {
      if (this.eventsQueue.push(e), this.eventsQueue.length > re) {
        const t = this.eventsQueue.shift();
        i.warn("EventManager", "Event queue overflow, oldest event removed", {
          maxLength: re,
          currentLength: this.eventsQueue.length,
          removedEventType: t?.type
        });
      }
      if (i.info("EventManager", `📥 Event captured: ${e.type}`, e), this.eventsQueueIntervalId || this.initEventsQueueInterval(), this.googleAnalytics && e.type === u.CUSTOM) {
        const t = e.custom_event;
        this.trackGoogleAnalyticsEvent(t);
      }
    }
  }
  trackGoogleAnalyticsEvent(e) {
    this.get("config").mode === "qa" || this.get("config").mode === "debug" ? i.debug("EventManager", `Google Analytics event: ${JSON.stringify(e)}`) : this.googleAnalytics && this.googleAnalytics.trackEvent(e.name, e.metadata ?? {});
  }
  initEventsQueueInterval() {
    if (this.eventsQueueIntervalId || this.intervalActive)
      return;
    const t = this.get("config")?.id === "test" || this.get("config")?.mode === "debug" ? qe : We;
    this.eventsQueueIntervalId = window.setInterval(() => {
      (this.eventsQueue.length > 0 || this.circuitOpen) && this.sendEventsQueue();
    }, t), this.intervalActive = !0;
  }
  async flushImmediately() {
    if (this.eventsQueue.length === 0)
      return !0;
    const e = this.buildEventsPayload(), t = [...this.eventsQueue], s = t.map((a) => a.timestamp + "_" + a.type), n = await this.dataSender.sendEventsQueueAsync(e);
    return n ? (this.removeProcessedEvents(s), this.clearQueueInterval(), i.info("EventManager", "Flush immediately successful", {
      eventCount: t.length,
      remainingQueueLength: this.eventsQueue.length
    })) : i.warn("EventManager", "Flush immediately failed, keeping events in queue", {
      eventCount: t.length
    }), n;
  }
  flushImmediatelySync() {
    if (this.eventsQueue.length === 0)
      return !0;
    const e = this.buildEventsPayload(), t = [...this.eventsQueue], s = t.map((a) => a.timestamp + "_" + a.type), n = this.dataSender.sendEventsQueueSync(e);
    return n ? (this.removeProcessedEvents(s), this.clearQueueInterval(), i.info("EventManager", "Flush immediately sync successful", {
      eventCount: t.length,
      remainingQueueLength: this.eventsQueue.length
    })) : i.warn("EventManager", "Flush immediately sync failed, keeping events in queue", {
      eventCount: t.length
    }), n;
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
      i.debug("EventManager", "Send already in progress, skipping");
      return;
    }
    if (!this.get("sessionId")) {
      i.debug("EventManager", "No session ID available, skipping send");
      return;
    }
    if (this.eventsQueue.length === 0 && !this.circuitOpen)
      return;
    if (this.circuitOpen) {
      const n = Date.now() - this.circuitOpenTime;
      if (n >= D.RECOVERY_TIME_MS) {
        if (!await this.handleCircuitBreakerRecovery()) {
          this.scheduleCircuitBreakerRetry();
          return;
        }
      } else {
        i.debug("EventManager", "Circuit breaker is open - skipping event sending", {
          queueLength: this.eventsQueue.length,
          failureCount: this.failureCount,
          timeSinceOpen: n,
          recoveryTime: D.RECOVERY_TIME_MS
        });
        return;
      }
    }
    const e = this.buildEventsPayload();
    this.isSending = !0;
    const t = [...this.eventsQueue], s = t.map((n) => n.timestamp + "_" + n.type);
    await this.dataSender.sendEventsQueue(e, {
      onSuccess: () => {
        this.failureCount = 0, this.backoffManager.reset(), this.removeProcessedEvents(s), i.info("EventManager", "Events sent successfully", {
          eventCount: t.length,
          remainingQueueLength: this.eventsQueue.length
        });
      },
      onFailure: async () => {
        this.failureCount++, i.warn("EventManager", "Events send failed, keeping in queue", {
          eventCount: t.length,
          failureCount: this.failureCount,
          networkTimeouts: this.errorRecoveryStats.networkTimeouts
        }), this.failureCount >= Math.floor(this.MAX_FAILURES / 2) && await this.attemptSystemRecovery(), this.failureCount >= this.MAX_FAILURES && await this.openCircuitBreaker();
      }
    }), this.isSending = !1;
  }
  buildEventsPayload() {
    const e = /* @__PURE__ */ new Map();
    for (const s of this.eventsQueue) {
      let n = `${s.type}_${s.page_url}`;
      s.click_data && (n += `_${s.click_data.x}_${s.click_data.y}`), s.scroll_data && (n += `_${s.scroll_data.depth}_${s.scroll_data.direction}`), s.custom_event && (n += `_${s.custom_event.name}`), s.web_vitals && (n += `_${s.web_vitals.type}`), e.has(n) || e.set(n, s);
    }
    const t = [...e.values()];
    return t.sort((s, n) => s.timestamp - n.timestamp), {
      user_id: this.get("userId"),
      session_id: this.get("sessionId"),
      device: this.get("device"),
      events: t,
      ...this.get("config")?.globalMetadata && { global_metadata: this.get("config")?.globalMetadata }
    };
  }
  clearQueueInterval() {
    this.eventsQueueIntervalId && (clearInterval(this.eventsQueueIntervalId), this.eventsQueueIntervalId = null, this.intervalActive = !1);
  }
  getEventFingerprint(e) {
    const t = `${e.type}_${e.page_url}`;
    if (e.click_data) {
      const s = Math.round((e.click_data.x || 0) / F) * F, n = Math.round((e.click_data.y || 0) / F) * F;
      return `${t}_${s}_${n}_${e.click_data.tag}_${e.click_data.id}`;
    }
    return e.scroll_data ? `${t}_${e.scroll_data.depth}_${e.scroll_data.direction}` : e.custom_event ? `${t}_${e.custom_event.name}` : e.web_vitals ? `${t}_${e.web_vitals.type}` : e.session_end_reason ? `${t}_${e.session_end_reason}` : e.session_start_recovered !== void 0 ? `${t}_${e.session_start_recovered}` : t;
  }
  isDuplicatedEvent(e) {
    const t = this.getEventFingerprint(e), s = this.eventFingerprints.get(t) ?? 0, n = Date.now();
    return n - s < ge ? !0 : (this.eventFingerprints.set(t, n), this.cleanupOldFingerprints(), !1);
  }
  /**
   * Manages fingerprint memory with proactive and reactive cleanup strategies
   */
  manageFingerprintMemory() {
    const e = Date.now();
    (this.eventFingerprints.size > ue || e - this.lastFingerprintCleanup > Be || this.eventFingerprints.size > X) && (this.eventFingerprints.size > X ? this.aggressiveFingerprintCleanup() : this.cleanupOldFingerprints(), this.lastFingerprintCleanup = e);
  }
  /**
   * Performs aggressive cleanup when hard limit is exceeded
   * Enhanced with recovery statistics tracking
   */
  aggressiveFingerprintCleanup() {
    const e = Array.from(this.eventFingerprints.entries()), t = e.length;
    e.sort((n, a) => n[1] - a[1]);
    const s = Math.floor(e.length * 0.5);
    for (let n = 0; n < s; n++)
      this.eventFingerprints.delete(e[n][0]);
    i.warn("EventManager", "Aggressive fingerprint cleanup performed", {
      removed: s,
      remaining: this.eventFingerprints.size,
      initialSize: t,
      trigger: "recovery_system",
      hardLimit: X,
      recoveryStats: this.errorRecoveryStats
    });
  }
  /**
   * Cleans up old fingerprints to prevent memory leaks
   */
  cleanupOldFingerprints() {
    if (this.eventFingerprints.size <= ue)
      return;
    const e = Date.now(), t = ge * $e, s = [];
    for (const [n, a] of this.eventFingerprints)
      e - a > t && s.push(n);
    for (const n of s)
      this.eventFingerprints.delete(n);
    i.debug("EventManager", "Cleaned up old event fingerprints", {
      totalFingerprints: this.eventFingerprints.size + s.length,
      cleanedCount: s.length,
      remainingCount: this.eventFingerprints.size,
      cleanupThreshold: t
    });
  }
  /**
   * Sets up circuit breaker health monitoring to detect and recover from stuck states
   */
  setupCircuitBreakerHealthCheck() {
    this.circuitBreakerHealthCheckInterval = window.setInterval(async () => {
      if (this.circuitOpen) {
        const e = Date.now() - this.circuitOpenTime;
        e > he && (i.warn("EventManager", "Circuit breaker appears stuck, forcing reset", {
          stuckTime: e,
          maxStuckTime: he,
          failureCount: this.failureCount
        }), this.resetCircuitBreaker(), this.failureCount = 0, this.errorRecoveryStats.circuitBreakerResets++, await this.attemptSystemRecovery());
      }
    }, je);
  }
  /**
   * Opens the circuit breaker with time-based recovery and event persistence
   */
  async openCircuitBreaker() {
    this.circuitOpen = !0, this.circuitOpenTime = Date.now(), this.set("circuitBreakerOpen", !0);
    const e = this.eventsQueue.length;
    if (e > 0) {
      const t = this.buildEventsPayload();
      await this.dataSender.persistEventsForRecovery(t) ? i.info("EventManager", "Events persisted before circuit breaker opened", {
        eventsCount: e
      }) : i.error("EventManager", "Failed to persist events before circuit breaker opened");
    }
    this.eventsQueue = [], i.warn("EventManager", "Circuit breaker opened with time-based recovery", {
      maxFailures: this.MAX_FAILURES,
      eventsCount: e,
      failureCount: this.failureCount,
      recoveryTime: D.RECOVERY_TIME_MS,
      openTime: this.circuitOpenTime
    }), this.backoffManager.getNextDelay();
  }
  /**
   * Handles circuit breaker recovery attempt
   * Returns true if recovery was successful, false otherwise
   */
  async handleCircuitBreakerRecovery() {
    this.resetCircuitBreaker(), this.isSending = !0;
    let e = !1;
    try {
      await this.dataSender.recoverPersistedEvents({
        onSuccess: () => {
          e = !0, this.failureCount = 0, this.backoffManager.reset(), i.info("EventManager", "Circuit breaker recovery successful");
        },
        onFailure: () => {
          e = !1, i.warn("EventManager", "Circuit breaker recovery failed");
        }
      });
    } catch (t) {
      e = !1, i.error("EventManager", "Circuit breaker recovery error", { error: t });
    } finally {
      this.isSending = !1;
    }
    return e;
  }
  /**
   * Schedules circuit breaker retry with progressive backoff
   */
  scheduleCircuitBreakerRetry() {
    const e = this.backoffManager.getNextDelay();
    this.circuitOpen = !0, this.circuitOpenTime = Date.now(), i.warn("EventManager", "Circuit breaker retry scheduled", {
      nextRetryDelay: e,
      failureCount: this.failureCount
    });
  }
  /**
   * Resets the circuit breaker and attempts to restore persisted events
   */
  resetCircuitBreaker() {
    this.circuitOpen = !1, this.circuitOpenTime = 0, this.failureCount = 0, this.circuitResetTimeoutId = null, this.set("circuitBreakerOpen", !1), this.dataSender.stop(), i.info("EventManager", "Circuit breaker reset completed", {
      currentQueueLength: this.eventsQueue.length,
      backoffDelay: this.backoffManager.getCurrentDelay()
    });
  }
  removeProcessedEvents(e) {
    const t = new Set(e);
    this.eventsQueue = this.eventsQueue.filter((s) => {
      const n = s.timestamp + "_" + s.type;
      return !t.has(n);
    });
  }
  /**
   * Determines if system recovery should be attempted based on timing constraints
   */
  shouldAttemptRecovery() {
    return Date.now() - this.errorRecoveryStats.lastRecoveryAttempt > 6e4;
  }
  /**
   * Attempts comprehensive system recovery from various error states
   */
  async attemptSystemRecovery() {
    if (this.shouldAttemptRecovery()) {
      this.errorRecoveryStats.lastRecoveryAttempt = Date.now(), i.info("EventManager", "Attempting system recovery", {
        stats: this.errorRecoveryStats
      });
      try {
        this.circuitOpen && Date.now() - this.circuitOpenTime > 2 * D.RECOVERY_TIME_MS && (this.resetCircuitBreaker(), this.errorRecoveryStats.circuitBreakerResets++), await this.recoverPersistedEvents(), this.aggressiveFingerprintCleanup(), i.info("EventManager", "System recovery completed successfully");
      } catch (e) {
        i.error("EventManager", "System recovery failed", { error: e });
      }
    }
  }
}
class Lt extends v {
  storageManager;
  constructor(e) {
    super(), this.storageManager = e;
  }
  getId() {
    const e = this.storageManager.getItem(ye(this.get("config")?.id));
    if (e)
      return e;
    const t = $();
    return this.storageManager.setItem(ye(this.get("config")?.id), t), t;
  }
}
class kt {
  onActivity;
  options = { passive: !0 };
  constructor(e) {
    this.onActivity = e;
  }
  setup() {
    try {
      window.addEventListener("scroll", this.onActivity, this.options), window.addEventListener("resize", this.onActivity, this.options), window.addEventListener("focus", this.onActivity, this.options);
    } catch (e) {
      throw i.error("ActivityListenerManager", "Failed to setup activity listeners", { error: e }), e;
    }
  }
  cleanup() {
    try {
      window.removeEventListener("scroll", this.onActivity), window.removeEventListener("resize", this.onActivity), window.removeEventListener("focus", this.onActivity);
    } catch (e) {
      i.warn("ActivityListenerManager", "Error during activity listeners cleanup", { error: e });
    }
  }
}
class Pt {
  onActivity;
  options = { passive: !0 };
  motionThreshold;
  constructor(e, t) {
    this.onActivity = e, this.motionThreshold = t;
  }
  setup() {
    try {
      window.addEventListener("touchstart", this.onActivity, this.options), window.addEventListener("touchmove", this.onActivity, this.options), window.addEventListener("touchend", this.onActivity, this.options), window.addEventListener("orientationchange", this.onActivity, this.options), "DeviceMotionEvent" in window && window.addEventListener("devicemotion", this.handleDeviceMotion, this.options);
    } catch (e) {
      throw i.error("TouchListenerManager", "Failed to setup touch listeners", { error: e }), e;
    }
  }
  cleanup() {
    try {
      window.removeEventListener("touchstart", this.onActivity), window.removeEventListener("touchmove", this.onActivity), window.removeEventListener("touchend", this.onActivity), window.removeEventListener("orientationchange", this.onActivity), "DeviceMotionEvent" in window && window.removeEventListener("devicemotion", this.handleDeviceMotion);
    } catch (e) {
      i.warn("TouchListenerManager", "Error during touch listeners cleanup", { error: e });
    }
  }
  handleDeviceMotion = (e) => {
    try {
      const t = e.acceleration;
      t && Math.abs(t.x ?? 0) + Math.abs(t.y ?? 0) + Math.abs(t.z ?? 0) > this.motionThreshold && this.onActivity();
    } catch (t) {
      i.warn("TouchListenerManager", "Error handling device motion event", { error: t });
    }
  };
}
class Nt {
  onActivity;
  options = { passive: !0 };
  constructor(e) {
    this.onActivity = e;
  }
  setup() {
    try {
      window.addEventListener("mousemove", this.onActivity, this.options), window.addEventListener("mousedown", this.onActivity, this.options), window.addEventListener("wheel", this.onActivity, this.options);
    } catch (e) {
      throw i.error("MouseListenerManager", "Failed to setup mouse listeners", { error: e }), e;
    }
  }
  cleanup() {
    try {
      window.removeEventListener("mousemove", this.onActivity), window.removeEventListener("mousedown", this.onActivity), window.removeEventListener("wheel", this.onActivity);
    } catch (e) {
      i.warn("MouseListenerManager", "Error during mouse listeners cleanup", { error: e });
    }
  }
}
class Dt {
  onActivity;
  options = { passive: !0 };
  constructor(e) {
    this.onActivity = e;
  }
  setup() {
    try {
      window.addEventListener("keydown", this.onActivity, this.options), window.addEventListener("keypress", this.onActivity, this.options);
    } catch (e) {
      throw i.error("KeyboardListenerManager", "Failed to setup keyboard listeners", { error: e }), e;
    }
  }
  cleanup() {
    try {
      window.removeEventListener("keydown", this.onActivity), window.removeEventListener("keypress", this.onActivity);
    } catch (e) {
      i.warn("KeyboardListenerManager", "Error during keyboard listeners cleanup", { error: e });
    }
  }
}
class Ht {
  onActivity;
  onVisibilityChange;
  isMobile;
  options = { passive: !0 };
  constructor(e, t, s) {
    this.onActivity = e, this.onVisibilityChange = t, this.isMobile = s;
  }
  setup() {
    try {
      "visibilityState" in document && document.addEventListener("visibilitychange", this.onVisibilityChange, this.options), window.addEventListener("blur", this.onVisibilityChange, this.options), window.addEventListener("focus", this.onActivity, this.options), "onLine" in navigator && (window.addEventListener("online", this.onActivity, this.options), window.addEventListener("offline", this.onVisibilityChange, this.options)), this.isMobile && this.setupMobileEvents();
    } catch (e) {
      throw i.error("VisibilityListenerManager", "Failed to setup visibility listeners", { error: e }), e;
    }
  }
  cleanup() {
    try {
      "visibilityState" in document && document.removeEventListener("visibilitychange", this.onVisibilityChange), window.removeEventListener("blur", this.onVisibilityChange), window.removeEventListener("focus", this.onActivity), "onLine" in navigator && (window.removeEventListener("online", this.onActivity), window.removeEventListener("offline", this.onVisibilityChange)), this.isMobile && this.cleanupMobileEvents();
    } catch (e) {
      i.warn("VisibilityListenerManager", "Error during visibility listeners cleanup", { error: e });
    }
  }
  setupMobileEvents() {
    try {
      document.addEventListener("pause", this.onVisibilityChange, this.options), document.addEventListener("resume", this.onActivity, this.options), "orientation" in screen && screen.orientation.addEventListener("change", this.onActivity, this.options), window.addEventListener("pageshow", this.onActivity, this.options), window.addEventListener("pagehide", this.onActivity, this.options);
    } catch (e) {
      i.warn("VisibilityListenerManager", "Failed to setup mobile listeners", { error: e });
    }
  }
  cleanupMobileEvents() {
    try {
      document.removeEventListener("pause", this.onVisibilityChange), document.removeEventListener("resume", this.onActivity), "orientation" in screen && screen.orientation.removeEventListener("change", this.onActivity), window.removeEventListener("pageshow", this.onActivity), window.removeEventListener("pagehide", this.onActivity);
    } catch (e) {
      i.warn("VisibilityListenerManager", "Error during mobile listeners cleanup", { error: e });
    }
  }
}
class Ut {
  onInactivity;
  options = { passive: !0 };
  constructor(e) {
    this.onInactivity = e;
  }
  setup() {
    try {
      window.addEventListener("beforeunload", this.onInactivity, this.options), window.addEventListener("pagehide", this.onInactivity, this.options);
    } catch (e) {
      throw i.error("UnloadListenerManager", "Failed to setup unload listeners", { error: e }), e;
    }
  }
  cleanup() {
    try {
      window.removeEventListener("beforeunload", this.onInactivity), window.removeEventListener("pagehide", this.onInactivity);
    } catch (e) {
      i.warn("UnloadListenerManager", "Error during unload listeners cleanup", { error: e });
    }
  }
}
class Pe extends v {
  config;
  storageManager;
  eventManager;
  projectId;
  debugMode;
  constructor(e, t, s, n) {
    super(), this.storageManager = e, this.eventManager = s ?? null, this.projectId = t, this.debugMode = (this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug") ?? !1, this.config = {
      recoveryWindowMs: this.calculateRecoveryWindow(),
      maxRecoveryAttempts: et,
      contextPreservation: !0,
      ...n
    };
  }
  /**
   * Attempt to recover a session
   */
  attemptSessionRecovery(e) {
    this.debugMode && i.debug("SessionRecovery", "Attempting session recovery");
    const t = this.getStoredRecoveryAttempts(), s = this.getLastRecoveryAttempt();
    if (!this.canAttemptRecovery(s))
      return this.debugMode && i.debug(
        "SessionRecovery",
        "Session recovery not possible - outside recovery window or max attempts reached"
      ), {
        recovered: !1
      };
    const n = s?.context;
    if (!n)
      return this.debugMode && i.debug("SessionRecovery", "No session context available for recovery"), {
        recovered: !1
      };
    const a = Date.now();
    if (a - n.lastActivity > this.config.recoveryWindowMs)
      return this.debugMode && i.debug("SessionRecovery", "Session recovery failed - outside recovery window"), {
        recovered: !1
      };
    const d = n.sessionId, c = (s?.attempt ?? 0) + 1, l = {
      sessionId: e ?? d,
      timestamp: a,
      attempt: c,
      context: {
        ...n,
        recoveryAttempts: c,
        lastActivity: a
      }
    };
    return t.push(l), this.storeRecoveryAttempts(t), this.debugMode && i.debug("SessionRecovery", `Session recovery successful: recovery of session ${d}`), {
      recovered: !0,
      recoveredSessionId: d,
      context: l.context
    };
  }
  /**
   * Calculate the recovery window with bounds checking
   */
  calculateRecoveryWindow() {
    const t = (this.get("config")?.sessionTimeout ?? _) * Ze, s = Math.max(
      Math.min(t, K),
      Y
    );
    return this.debugMode && (t > K ? i.warn(
      "SessionRecovery",
      `Recovery window capped at ${K}ms (24h). Calculated: ${t}ms`
    ) : t < Y && i.warn(
      "SessionRecovery",
      `Recovery window increased to minimum ${Y}ms (2min). Calculated: ${t}ms`
    )), s;
  }
  /**
   * Check if session recovery can be attempted
   */
  canAttemptRecovery(e) {
    return e ? !(Date.now() - e.context.lastActivity > this.config.recoveryWindowMs || e.attempt >= this.config.maxRecoveryAttempts) : !0;
  }
  /**
   * Store session context for potential recovery
   */
  storeSessionContextForRecovery(e) {
    try {
      const t = this.getStoredRecoveryAttempts(), s = {
        sessionId: e.sessionId,
        timestamp: Date.now(),
        attempt: 0,
        context: e
      };
      t.push(s);
      const n = 5;
      t.length > n && t.splice(0, t.length - n), this.storeRecoveryAttempts(t), this.debugMode && i.debug("SessionRecovery", `Stored session context for recovery: ${e.sessionId}`);
    } catch (t) {
      this.debugMode && i.warn("SessionRecovery", "Failed to store session context for recovery", { error: t });
    }
  }
  /**
   * Get stored recovery attempts
   */
  getStoredRecoveryAttempts() {
    try {
      const e = this.storageManager.getItem(V(this.projectId));
      return e ? JSON.parse(e) : [];
    } catch (e) {
      if (this.debugMode) {
        const t = this.storageManager.getItem(V(this.projectId));
        i.warn(
          "SessionRecovery",
          `Failed to parse stored recovery attempts for projectId ${this.projectId}. Data: ${t}`,
          { error: e }
        );
      }
      return [];
    }
  }
  /**
   * Store recovery attempts
   */
  storeRecoveryAttempts(e) {
    try {
      this.storageManager.setItem(V(this.projectId), JSON.stringify(e));
    } catch (t) {
      this.debugMode && i.warn("SessionRecovery", "Failed to store recovery attempts", { error: t });
    }
  }
  /**
   * Get the last recovery attempt
   */
  getLastRecoveryAttempt() {
    const e = this.getStoredRecoveryAttempts();
    return e.length > 0 ? e[e.length - 1] : null;
  }
  /**
   * Clean up old recovery attempts
   */
  cleanupOldRecoveryAttempts() {
    const e = this.getStoredRecoveryAttempts(), t = Date.now(), s = e.filter((n) => t - n.timestamp <= this.config.recoveryWindowMs);
    s.length !== e.length && (this.storeRecoveryAttempts(s), this.debugMode && i.debug("SessionRecovery", `Cleaned up ${e.length - s.length} old recovery attempts`));
  }
  /**
   * Check if there's a recoverable session.
   * Returns false when no recovery attempts are stored.
   */
  hasRecoverableSession() {
    const e = this.getLastRecoveryAttempt();
    return e ? this.canAttemptRecovery(e) : !1;
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
    this.storageManager.removeItem(V(this.projectId)), this.debugMode && i.debug("SessionRecovery", "Cleared all recovery data");
  }
}
class Ot extends v {
  config;
  eventManager = null;
  storageManager = null;
  listenerManagers = [];
  deviceCapabilities;
  onActivity;
  onInactivity;
  // Recovery manager
  recoveryManager = null;
  isSessionActive = !1;
  lastActivityTime = 0;
  inactivityTimer = null;
  sessionStartTime = 0;
  throttleTimeout = null;
  // Track visibility change timeout for proper cleanup
  visibilityChangeTimeout = null;
  // Session End Management
  pendingSessionEnd = !1;
  sessionEndPromise = null;
  sessionEndLock = Promise.resolve({
    success: !0,
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
  constructor(e, t, s, n, a) {
    super(), this.config = {
      throttleDelay: Ae,
      visibilityTimeout: Qe,
      motionThreshold: Ue,
      timeout: this.get("config")?.sessionTimeout ?? _
    }, this.sessionEndConfig = {
      enablePageUnloadHandlers: !0,
      syncTimeoutMs: 1e3,
      maxRetries: 2,
      debugMode: !1,
      ...a
    }, this.onActivity = e, this.onInactivity = t, this.eventManager = s ?? null, this.storageManager = n ?? null, this.deviceCapabilities = this.detectDeviceCapabilities(), this.initializeRecoveryManager(), this.initializeListenerManagers(), this.setupAllListeners(), this.sessionEndConfig.enablePageUnloadHandlers && this.setupPageUnloadHandlers(), i.debug("SessionManager", "SessionManager initialized", {
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
    const e = this.get("config")?.id;
    if (e)
      try {
        this.recoveryManager = new Pe(this.storageManager, e, this.eventManager ?? void 0), i.debug("SessionManager", "Recovery manager initialized", { projectId: e });
      } catch (t) {
        i.error("SessionManager", "Failed to initialize recovery manager", { error: t, projectId: e });
      }
  }
  /**
   * Store session context for recovery
   */
  storeSessionContextForRecovery() {
    if (!this.recoveryManager) return;
    const e = this.get("sessionId");
    if (!e) return;
    const t = {
      sessionId: e,
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
    this.recoveryManager.storeSessionContextForRecovery(t);
  }
  startSession() {
    const e = Date.now();
    let t = "", s = !1;
    if (this.recoveryManager?.hasRecoverableSession()) {
      const n = this.recoveryManager.attemptSessionRecovery();
      n.recovered && n.recoveredSessionId && (t = n.recoveredSessionId, s = !0, this.trackSessionHealth("recovery"), n.context ? (this.sessionStartTime = n.context.startTime, this.lastActivityTime = e) : (this.sessionStartTime = e, this.lastActivityTime = e), i.info("SessionManager", "Session successfully recovered", {
        sessionId: t,
        recoveryAttempts: this.sessionHealth.recoveryAttempts
      }));
    }
    return s || (t = $(), this.sessionStartTime = e, this.lastActivityTime = e, i.info("SessionManager", "New session started", { sessionId: t })), this.isSessionActive = !0, this.resetInactivityTimer(), this.storeSessionContextForRecovery(), { sessionId: t, recovered: s };
  }
  endSession() {
    if (this.sessionStartTime === 0)
      return 0;
    const e = Date.now() - this.sessionStartTime;
    return this.sessionStartTime = 0, this.isSessionActive = !1, this.inactivityTimer && (clearTimeout(this.inactivityTimer), this.inactivityTimer = null), e;
  }
  destroy() {
    this.clearTimers(), this.cleanupAllListeners(), this.resetState(), this.cleanupHandlers.forEach((e) => e()), this.cleanupHandlers = [], this.pendingSessionEnd = !1, this.sessionEndPromise = null, this.sessionEndLock = Promise.resolve({
      success: !0,
      reason: "manual_stop",
      timestamp: Date.now(),
      eventsFlushed: 0,
      method: "async"
    }), this.recoveryManager && (this.recoveryManager.cleanupOldRecoveryAttempts(), this.recoveryManager = null);
  }
  detectDeviceCapabilities() {
    const e = "ontouchstart" in window || navigator.maxTouchPoints > 0, t = window.matchMedia("(pointer: fine)").matches, s = !window.matchMedia("(pointer: coarse)").matches, n = Te() === E.Mobile;
    return { hasTouch: e, hasMouse: t, hasKeyboard: s, isMobile: n };
  }
  initializeListenerManagers() {
    this.listenerManagers.push(new kt(this.handleActivity)), this.deviceCapabilities.hasTouch && this.listenerManagers.push(new Pt(this.handleActivity, this.config.motionThreshold)), this.deviceCapabilities.hasMouse && this.listenerManagers.push(new Nt(this.handleActivity)), this.deviceCapabilities.hasKeyboard && this.listenerManagers.push(new Dt(this.handleActivity)), this.listenerManagers.push(
      new Ht(this.handleActivity, this.handleVisibilityChange, this.deviceCapabilities.isMobile)
    ), this.listenerManagers.push(new Ut(this.handleInactivity));
  }
  setupAllListeners() {
    this.listenerManagers.forEach((e) => e.setup());
  }
  cleanupAllListeners() {
    this.listenerManagers.forEach((e) => e.cleanup());
  }
  clearTimers() {
    this.inactivityTimer && (clearTimeout(this.inactivityTimer), this.inactivityTimer = null), this.throttleTimeout && (clearTimeout(this.throttleTimeout), this.throttleTimeout = null);
  }
  resetState() {
    this.isSessionActive = !1, this.lastActivityTime = 0, this.sessionStartTime = 0;
  }
  handleActivity = () => {
    const e = Date.now();
    e - this.lastActivityTime < this.config.throttleDelay || (this.lastActivityTime = e, this.isSessionActive ? (this.onActivity(), this.resetInactivityTimer()) : (this.throttleTimeout && (clearTimeout(this.throttleTimeout), this.throttleTimeout = null), this.throttleTimeout = window.setTimeout(() => {
      this.onActivity(), this.throttleTimeout = null;
    }, 100)));
  };
  handleInactivity = () => {
    this.trackSessionHealth("timeout"), this.onInactivity();
  };
  handleVisibilityChange = () => {
    document.hidden ? this.isSessionActive && (this.inactivityTimer && (clearTimeout(this.inactivityTimer), this.inactivityTimer = null), this.inactivityTimer = window.setTimeout(this.handleInactivity, this.config.visibilityTimeout)) : this.handleActivity();
  };
  resetInactivityTimer = () => {
    this.inactivityTimer && (clearTimeout(this.inactivityTimer), this.inactivityTimer = null), this.isSessionActive && (this.inactivityTimer = window.setTimeout(() => {
      this.handleInactivity();
    }, this.config.timeout));
  };
  clearInactivityTimer() {
    this.inactivityTimer && (clearTimeout(this.inactivityTimer), this.inactivityTimer = null);
  }
  shouldProceedWithSessionEnd(e) {
    return !this.sessionEndReason || this.sessionEndPriority[e] > this.sessionEndPriority[this.sessionEndReason];
  }
  async waitForCompletion() {
    return this.sessionEndPromise ? await this.sessionEndPromise : {
      success: !1,
      reason: "inactivity",
      timestamp: Date.now(),
      eventsFlushed: 0,
      method: "async"
    };
  }
  createSessionEndTimeout() {
    return new Promise((e, t) => {
      setTimeout(() => {
        t(new Error("Session end timeout"));
      }, this.sessionEndConfig.syncTimeoutMs || 5e3);
    });
  }
  async endSessionManaged(e) {
    return this.sessionEndLock = this.sessionEndLock.then(async () => {
      if (this.sessionEndStats.totalSessionEnds++, this.sessionEndStats.reasonCounts[e]++, this.pendingSessionEnd)
        return this.sessionEndStats.duplicatePrevented++, i.debug("SessionManager", "Session end already pending, waiting for completion", { reason: e }), this.waitForCompletion();
      if (!this.shouldProceedWithSessionEnd(e))
        return this.sessionEndConfig.debugMode && i.debug(
          "SessionManager",
          `Session end skipped due to lower priority. Current: ${this.sessionEndReason}, Requested: ${e}`
        ), {
          success: !1,
          reason: e,
          timestamp: Date.now(),
          eventsFlushed: 0,
          method: "async"
        };
      this.sessionEndReason = e, this.pendingSessionEnd = !0, this.sessionEndPromise = Promise.race([
        this.performSessionEnd(e, "async"),
        this.createSessionEndTimeout()
      ]);
      try {
        return await this.sessionEndPromise;
      } finally {
        this.pendingSessionEnd = !1, this.sessionEndPromise = null, this.sessionEndReason = null;
      }
    }).catch((t) => (this.pendingSessionEnd = !1, this.sessionEndPromise = null, this.sessionEndReason = null, i.error("SessionManager", "Session end lock failed, recovering", { error: t, reason: e }), {
      success: !1,
      reason: e,
      timestamp: Date.now(),
      eventsFlushed: 0,
      method: "async"
    }));
  }
  endSessionSafely(e, t) {
    return t?.forceSync ?? (t?.allowSync && ["page_unload", "tab_closed"].includes(e)) ? this.endSessionManagedSync(e) : this.endSessionManaged(e);
  }
  isPendingSessionEnd() {
    return this.pendingSessionEnd;
  }
  /**
   * Track session health events for monitoring and diagnostics
   */
  trackSessionHealth(e) {
    const t = Date.now();
    switch (e) {
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
    this.sessionHealth.lastHealthCheck = t, this.sessionHealth.recoveryAttempts > 3 && this.eventManager && (this.eventManager.track({
      type: u.CUSTOM,
      custom_event: {
        name: "session_health_degraded",
        metadata: {
          ...this.sessionHealth,
          event_trigger: e
        }
      }
    }), this.sessionEndConfig.debugMode && i.warn(
      "SessionManager",
      `Session health degraded: ${this.sessionHealth.recoveryAttempts} recovery attempts`
    )), this.sessionEndConfig.debugMode && i.debug("SessionManager", `Session health event tracked: ${e}`);
  }
  async performSessionEnd(e, t) {
    const s = Date.now();
    let n = 0;
    try {
      if (i.info("SessionManager", "Starting session end", { method: t, reason: e, timestamp: s }), this.eventManager) {
        this.eventManager.track({
          type: u.SESSION_END,
          session_end_reason: e
        }), n = this.eventManager.getQueueLength();
        const o = await this.eventManager.flushImmediately();
        this.cleanupSession();
        const d = {
          success: o,
          reason: e,
          timestamp: s,
          eventsFlushed: n,
          method: t
        };
        return o ? this.sessionEndStats.successfulEnds++ : this.sessionEndStats.failedEnds++, d;
      }
      this.cleanupSession();
      const a = {
        success: !0,
        reason: e,
        timestamp: s,
        eventsFlushed: 0,
        method: t
      };
      return this.sessionEndStats.successfulEnds++, a;
    } catch (a) {
      return this.sessionEndStats.failedEnds++, i.error("SessionManager", "Session end failed", { error: a, reason: e, method: t }), this.cleanupSession(), {
        success: !1,
        reason: e,
        timestamp: s,
        eventsFlushed: n,
        method: t
      };
    }
  }
  cleanupSession() {
    this.endSession(), this.clearTimers(), this.set("sessionId", null), this.set("hasStartSession", !1);
  }
  endSessionManagedSync(e) {
    if (this.sessionEndStats.totalSessionEnds++, this.sessionEndStats.reasonCounts[e]++, this.pendingSessionEnd && (this.sessionEndStats.duplicatePrevented++, i.warn("SessionManager", "Sync session end called while async end pending", { reason: e })), !this.shouldProceedWithSessionEnd(e))
      return this.sessionEndConfig.debugMode && i.debug(
        "SessionManager",
        `Sync session end skipped due to lower priority. Current: ${this.sessionEndReason}, Requested: ${e}`
      ), {
        success: !1,
        reason: e,
        timestamp: Date.now(),
        eventsFlushed: 0,
        method: "sync"
      };
    this.sessionEndReason = e, this.pendingSessionEnd = !0;
    try {
      return this.performSessionEndSync(e);
    } finally {
      this.pendingSessionEnd = !1, this.sessionEndPromise = null, this.sessionEndReason = null;
    }
  }
  performSessionEndSync(e) {
    const t = Date.now();
    let s = 0;
    try {
      if (this.eventManager) {
        this.eventManager.track({
          type: u.SESSION_END,
          session_end_reason: e
        }), s = this.eventManager.getQueueLength();
        const a = this.eventManager.flushImmediatelySync();
        this.cleanupSession();
        const o = {
          success: a,
          reason: e,
          timestamp: t,
          eventsFlushed: s,
          method: "sync"
        };
        return a ? this.sessionEndStats.successfulEnds++ : this.sessionEndStats.failedEnds++, o;
      }
      this.cleanupSession();
      const n = {
        success: !0,
        reason: e,
        timestamp: t,
        eventsFlushed: 0,
        method: "sync"
      };
      return this.sessionEndStats.successfulEnds++, n;
    } catch (n) {
      return this.sessionEndStats.failedEnds++, this.cleanupSession(), i.error("SessionManager", "Sync session end failed", { error: n, reason: e }), {
        success: !1,
        reason: e,
        timestamp: t,
        eventsFlushed: s,
        method: "sync"
      };
    }
  }
  setupPageUnloadHandlers() {
    let e = !1;
    const t = () => {
      e || !this.get("sessionId") || (e = !0, this.clearInactivityTimer(), this.endSessionSafely("page_unload", { forceSync: !0 }));
    }, s = () => {
      t();
    }, n = (o) => {
      o.persisted || t();
    }, a = () => {
      document.visibilityState === "hidden" && this.get("sessionId") && !e && (this.visibilityChangeTimeout = window.setTimeout(() => {
        document.visibilityState === "hidden" && this.get("sessionId") && !e && t(), this.visibilityChangeTimeout = null;
      }, 1e3));
    };
    window.addEventListener("beforeunload", s), window.addEventListener("pagehide", n), document.addEventListener("visibilitychange", a), this.cleanupHandlers.push(
      () => window.removeEventListener("beforeunload", s),
      () => window.removeEventListener("pagehide", n),
      () => document.removeEventListener("visibilitychange", a),
      () => {
        this.visibilityChangeTimeout && (clearTimeout(this.visibilityChangeTimeout), this.visibilityChangeTimeout = null);
      }
    );
  }
}
class xt extends v {
  constructor(e, t, s, n) {
    super(), this.callbacks = n, this.storageManager = e, this.projectId = t, this.tabId = $(), this.config = {
      tabHeartbeatIntervalMs: Ye,
      tabElectionTimeoutMs: Je,
      debugMode: (this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug") ?? !1,
      ...s
    }, this.tabInfo = {
      id: this.tabId,
      lastHeartbeat: Date.now(),
      isLeader: !1,
      sessionId: "",
      startTime: Date.now()
    }, this.broadcastChannel = this.initializeBroadcastChannel(), this.initialize();
  }
  config;
  storageManager;
  broadcastChannel;
  tabId;
  tabInfo;
  projectId;
  leaderTabId = null;
  isTabLeader = !1;
  heartbeatInterval = null;
  electionTimeout = null;
  cleanupTimeout = null;
  sessionEnded = !1;
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
    if (!this.isBroadcastChannelSupported())
      return null;
    try {
      const e = new BroadcastChannel(at(this.projectId));
      return this.setupBroadcastListeners(e), e;
    } catch (e) {
      return this.config.debugMode && i.warn("CrossTabSession", "Failed to initialize BroadcastChannel", { error: e }), null;
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
    const e = this.getStoredSessionContext();
    e ? this.tryJoinExistingSession(e) : this.startLeaderElection(), this.startHeartbeat(), this.broadcastChannel && this.setupLeadershipFallback();
  }
  /**
   * Check if this tab should be the session leader
   */
  tryJoinExistingSession(e) {
    this.config.debugMode && i.debug("CrossTabSession", `Attempting to join existing session: ${e.sessionId}`), this.tabInfo.sessionId = e.sessionId, this.requestLeadershipStatus(), e.tabCount += 1, e.lastActivity = Date.now(), this.storeSessionContext(e), this.callbacks?.onTabActivity && this.callbacks.onTabActivity();
  }
  /**
   * Request leadership status from other tabs
   */
  requestLeadershipStatus() {
    if (!this.broadcastChannel) return;
    this.electionTimeout && (clearTimeout(this.electionTimeout), this.electionTimeout = null);
    const e = {
      type: "election_request",
      tabId: this.tabId,
      sessionId: this.tabInfo.sessionId,
      timestamp: Date.now()
    };
    this.broadcastChannel.postMessage(e);
    const t = Math.floor(Math.random() * 500);
    this.electionTimeout = window.setTimeout(() => {
      this.isTabLeader || this.becomeLeader();
    }, this.config.tabElectionTimeoutMs + t);
  }
  /**
   * Start leader election process with debouncing to prevent excessive elections
   */
  startLeaderElection() {
    if (this.electionTimeout) {
      this.config.debugMode && i.debug("CrossTabSession", "Leader election already in progress, skipping");
      return;
    }
    this.config.debugMode && i.debug("CrossTabSession", "Starting leader election");
    const e = Math.floor(Math.random() * 50) + 10;
    this.electionTimeout = window.setTimeout(() => {
      this.electionTimeout = null, this.requestLeadershipStatus();
    }, e);
  }
  /**
   * Become the session leader
   */
  becomeLeader() {
    if (!this.isTabLeader) {
      if (this.isTabLeader = !0, this.tabInfo.isLeader = !0, this.leaderTabId = this.tabId, this.config.debugMode && i.debug("CrossTabSession", `Tab ${this.tabId} became session leader`), this.electionTimeout && (clearTimeout(this.electionTimeout), this.electionTimeout = null), this.tabInfo.sessionId) {
        const e = this.getStoredSessionContext();
        e && (e.lastActivity = Date.now(), this.storeSessionContext(e));
      } else {
        const e = $();
        this.tabInfo.sessionId = e;
        const t = {
          sessionId: e,
          startTime: Date.now(),
          lastActivity: Date.now(),
          tabCount: 1,
          recoveryAttempts: 0
        };
        this.storeSessionContext(t), this.callbacks?.onSessionStart && this.callbacks.onSessionStart(e), this.announceSessionStart(e);
      }
      this.storeTabInfo(), this.announceLeadership();
    }
  }
  /**
   * Announce session start to other tabs
   */
  announceSessionStart(e) {
    if (!this.broadcastChannel) return;
    const t = {
      type: "session_start",
      tabId: this.tabId,
      sessionId: e,
      timestamp: Date.now()
    };
    this.broadcastChannel.postMessage(t);
  }
  /**
   * Announce leadership to other tabs
   */
  announceLeadership() {
    if (!this.broadcastChannel || !this.tabInfo.sessionId) return;
    const e = {
      type: "election_response",
      tabId: this.tabId,
      sessionId: this.tabInfo.sessionId,
      timestamp: Date.now(),
      data: { isLeader: !0 }
    };
    this.broadcastChannel.postMessage(e);
  }
  /**
   * Clean up health check interval to prevent memory leaks
   */
  cleanupHealthCheckInterval() {
    this.leaderHealthCheckInterval && (clearInterval(this.leaderHealthCheckInterval), this.leaderHealthCheckInterval = null, i.debug("CrossTabSession", "Health check interval cleaned up"));
  }
  /**
   * Setup fallback mechanism to ensure a leader is always elected
   */
  setupLeadershipFallback() {
    const e = this.config.tabElectionTimeoutMs + 1500;
    this.fallbackLeadershipTimeout = window.setTimeout(() => {
      !this.isTabLeader && !this.leaderTabId && (this.tabInfo.sessionId ? (this.config.debugMode && i.warn(
        "CrossTabSession",
        `No leader detected after ${e}ms, forcing leadership for tab ${this.tabId}`
      ), this.becomeLeader()) : (this.config.debugMode && i.warn(
        "CrossTabSession",
        `No session or leader detected after ${e}ms, starting new session for tab ${this.tabId}`
      ), this.becomeLeader())), this.fallbackLeadershipTimeout = null;
    }, e), this.leaderHealthCheckInterval = window.setInterval(() => {
      if (!this.sessionEnded && this.leaderTabId && !this.isTabLeader) {
        const s = this.getStoredSessionContext();
        if (s) {
          const n = Date.now() - s.lastActivity, a = this.config.tabHeartbeatIntervalMs * 3;
          n > a && (this.config.debugMode && i.warn(
            "CrossTabSession",
            `Leader tab appears inactive (${n}ms), attempting to become leader`
          ), this.leaderTabId = null, this.startLeaderElection());
        }
      }
    }, this.config.tabHeartbeatIntervalMs * 2);
    const t = this.endSession.bind(this);
    this.endSession = (s) => {
      this.cleanupHealthCheckInterval(), this.fallbackLeadershipTimeout && (clearTimeout(this.fallbackLeadershipTimeout), this.fallbackLeadershipTimeout = null), t(s);
    };
  }
  /**
   * Setup BroadcastChannel event listeners
   */
  setupBroadcastListeners(e) {
    e.addEventListener("message", (t) => {
      const s = t.data;
      s.tabId !== this.tabId && this.handleCrossTabMessage(s);
    });
  }
  /**
   * Handle cross-tab messages
   */
  handleCrossTabMessage(e) {
    switch (this.config.debugMode && i.debug("CrossTabSession", `Received cross-tab message: ${e.type} from ${e.tabId}`), e.type) {
      case "heartbeat":
        this.handleHeartbeatMessage(e);
        break;
      case "session_start":
        this.handleSessionStartMessage(e);
        break;
      case "session_end":
        this.handleSessionEndMessage(e);
        break;
      case "tab_closing":
        this.handleTabClosingMessage(e);
        break;
      case "election_request":
        this.handleElectionRequest(e);
        break;
      case "election_response":
        this.handleElectionResponse(e);
        break;
    }
  }
  /**
   * Handle heartbeat message from another tab
   */
  handleHeartbeatMessage(e) {
    if (e.sessionId === this.tabInfo.sessionId) {
      const t = this.getStoredSessionContext();
      t && (t.lastActivity = Date.now(), this.storeSessionContext(t), this.callbacks?.onTabActivity && this.callbacks.onTabActivity());
    }
  }
  /**
   * Handle session start message from another tab
   */
  handleSessionStartMessage(e) {
    if (e.sessionId && !this.tabInfo.sessionId) {
      this.tabInfo.sessionId = e.sessionId, this.storeTabInfo();
      const t = this.getStoredSessionContext();
      t && (t.tabCount += 1, this.storeSessionContext(t));
    }
  }
  /**
   * Handle session end message from another tab
   */
  handleSessionEndMessage(e) {
    if (this.isTabLeader) {
      this.config.debugMode && i.debug("CrossTabSession", `Ignoring session end message from ${e.tabId} (this tab is leader)`);
      return;
    }
    if (!this.leaderTabId || e.tabId !== this.leaderTabId) {
      if (this.config.debugMode) {
        const s = this.leaderTabId ? `; leader is ${this.leaderTabId}` : "";
        i.debug("CrossTabSession", `Ignoring session end message from ${e.tabId}${s}`);
      }
      return;
    }
    this.tabInfo.sessionId = "", this.storeTabInfo(), this.leaderTabId = null, this.getStoredSessionContext() || (this.broadcastChannel ? this.startLeaderElection() : this.becomeLeader());
  }
  /**
   * Handle tab closing message from another tab
   */
  handleTabClosingMessage(e) {
    const t = this.getStoredSessionContext();
    if (t && e.sessionId === t.sessionId) {
      const s = t.tabCount;
      t.tabCount = Math.max(1, t.tabCount - 1), t.lastActivity = Date.now(), this.storeSessionContext(t), this.config.debugMode && i.debug(
        "CrossTabSession",
        `Tab count updated from ${s} to ${t.tabCount} after tab ${e.tabId} closed`
      ), (e.data?.isLeader ?? e.tabId === this.leaderTabId) && !this.isTabLeader && (this.config.debugMode && i.debug("CrossTabSession", `Leader tab ${e.tabId} closed, starting leader election`), this.leaderTabId = null, this.electionDelayTimeout = window.setTimeout(() => {
        this.startLeaderElection(), this.electionDelayTimeout = null;
      }, 200));
    }
  }
  /**
   * Handle election request from another tab
   */
  handleElectionRequest(e) {
    if (this.isTabLeader) {
      const t = {
        type: "election_response",
        tabId: this.tabId,
        sessionId: this.tabInfo.sessionId,
        timestamp: Date.now(),
        data: { isLeader: !0 }
      };
      this.broadcastChannel && this.broadcastChannel.postMessage(t);
    }
  }
  /**
   * Handle election response from another tab
   */
  handleElectionResponse(e) {
    e.data?.isLeader && (this.isTabLeader ? this.config.debugMode && (i.warn(
      "CrossTabSession",
      `Received leadership claim from ${e.tabId} but this tab is already leader`
    ), this.callbacks?.onCrossTabConflict && this.callbacks.onCrossTabConflict()) : (this.isTabLeader = !1, this.tabInfo.isLeader = !1, this.leaderTabId = e.tabId, this.config.debugMode && i.debug("CrossTabSession", `Acknowledging tab ${e.tabId} as leader`), this.electionTimeout && (clearTimeout(this.electionTimeout), this.electionTimeout = null), e.sessionId && (this.tabInfo.sessionId = e.sessionId, this.storeTabInfo())));
  }
  /**
   * Start heartbeat to keep session active
   */
  startHeartbeat() {
    this.heartbeatInterval && clearInterval(this.heartbeatInterval), this.heartbeatInterval = window.setInterval(() => {
      this.sendHeartbeat(), this.updateTabInfo();
    }, this.config.tabHeartbeatIntervalMs);
  }
  /**
   * Send heartbeat to other tabs with rate limiting to prevent flooding
   */
  sendHeartbeat() {
    if (!this.broadcastChannel || !this.tabInfo.sessionId) return;
    const e = Date.now(), t = this.lastHeartbeatSent ?? 0, s = this.config.tabHeartbeatIntervalMs * 0.8;
    if (!this.isTabLeader && e - t < s)
      return;
    const n = {
      type: "heartbeat",
      tabId: this.tabId,
      sessionId: this.tabInfo.sessionId,
      timestamp: e
    };
    this.broadcastChannel.postMessage(n), this.lastHeartbeatSent = e;
  }
  /**
   * Update tab info with current timestamp
   */
  updateTabInfo() {
    this.tabInfo.lastHeartbeat = Date.now(), this.storeTabInfo();
  }
  /**
   * End session and notify other tabs
   */
  endSession(e) {
    this.sessionEnded || (this.sessionEnded = !0, this.config.debugMode && i.debug(
      "CrossTabSession",
      `Ending cross-tab session: ${e} (tab: ${this.tabId}, isLeader: ${this.isTabLeader})`
    ), this.announceTabClosing(), this.isTabLeader && e !== "manual_stop" && this.announceSessionEnd(e), this.tabInfoCleanupTimeout = window.setTimeout(() => {
      this.clearTabInfo(), this.tabInfoCleanupTimeout = null;
    }, 150));
  }
  /**
   * Announce tab is closing to other tabs
   */
  announceTabClosing() {
    if (!this.broadcastChannel || !this.tabInfo.sessionId) return;
    const e = {
      type: "tab_closing",
      tabId: this.tabId,
      sessionId: this.tabInfo.sessionId,
      timestamp: Date.now(),
      data: { isLeader: this.isTabLeader }
    };
    this.broadcastChannel.postMessage(e), this.closingAnnouncementTimeout = window.setTimeout(() => {
      this.config.debugMode && i.debug("CrossTabSession", `Tab ${this.tabId} closing announcement sent`), this.closingAnnouncementTimeout = null;
    }, 100);
  }
  /**
   * Announce session end to other tabs
   */
  announceSessionEnd(e) {
    if (!this.broadcastChannel) return;
    const t = {
      type: "session_end",
      tabId: this.tabId,
      sessionId: this.tabInfo.sessionId,
      timestamp: Date.now(),
      data: { reason: e }
    };
    this.broadcastChannel.postMessage(t);
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
      const e = this.storageManager.getItem(J(this.projectId));
      return e ? JSON.parse(e) : null;
    } catch (e) {
      return this.config.debugMode && i.warn("CrossTabSession", "Failed to parse stored session context", { error: e }), null;
    }
  }
  /**
   * Store session context to localStorage
   */
  storeSessionContext(e) {
    try {
      this.storageManager.setItem(J(this.projectId), JSON.stringify(e));
    } catch (t) {
      this.config.debugMode && i.warn("CrossTabSession", "Failed to store session context", { error: t });
    }
  }
  /**
   * Clear stored session context
   */
  clearStoredSessionContext() {
    this.storageManager.removeItem(J(this.projectId));
  }
  /**
   * Store tab info to localStorage
   */
  storeTabInfo() {
    try {
      this.storageManager.setItem(Se(this.projectId, this.tabId), JSON.stringify(this.tabInfo));
    } catch (e) {
      this.config.debugMode && i.warn("CrossTabSession", "Failed to store tab info", { error: e });
    }
  }
  /**
   * Clear tab info from localStorage
   */
  clearTabInfo() {
    this.storageManager.removeItem(Se(this.projectId, this.tabId));
  }
  /**
   * Check if BroadcastChannel is supported
   */
  isBroadcastChannelSupported() {
    return typeof window < "u" && "BroadcastChannel" in window;
  }
  /**
   * Get session timeout considering cross-tab activity
   */
  getEffectiveSessionTimeout() {
    const e = this.getStoredSessionContext();
    if (!e)
      return this.get("config")?.sessionTimeout ?? _;
    const s = Date.now() - e.lastActivity, n = this.get("config")?.sessionTimeout ?? _;
    return Math.max(0, n - s);
  }
  /**
   * Update session activity from any tab
   */
  updateSessionActivity() {
    const e = this.getStoredSessionContext();
    e && (e.lastActivity = Date.now(), this.storeSessionContext(e)), this.sendHeartbeat();
  }
  /**
   * Cleanup resources
   */
  destroy() {
    this.cleanupHealthCheckInterval(), this.heartbeatInterval && (clearInterval(this.heartbeatInterval), this.heartbeatInterval = null), this.electionTimeout && (clearTimeout(this.electionTimeout), this.electionTimeout = null), this.cleanupTimeout && (clearTimeout(this.cleanupTimeout), this.cleanupTimeout = null), this.fallbackLeadershipTimeout && (clearTimeout(this.fallbackLeadershipTimeout), this.fallbackLeadershipTimeout = null), this.electionDelayTimeout && (clearTimeout(this.electionDelayTimeout), this.electionDelayTimeout = null), this.tabInfoCleanupTimeout && (clearTimeout(this.tabInfoCleanupTimeout), this.tabInfoCleanupTimeout = null), this.closingAnnouncementTimeout && (clearTimeout(this.closingAnnouncementTimeout), this.closingAnnouncementTimeout = null), this.endSession("manual_stop"), this.broadcastChannel && (this.broadcastChannel.close(), this.broadcastChannel = null), i.debug("CrossTabSession", "CrossTabSessionManager destroyed");
  }
}
class Ft extends v {
  eventManager;
  storageManager;
  sessionStorageKey;
  sessionManager = null;
  recoveryManager = null;
  _crossTabSessionManager = null;
  heartbeatInterval = null;
  _isInitializingCrossTab = !1;
  get crossTabSessionManager() {
    if (!this._crossTabSessionManager && !this._isInitializingCrossTab && this.shouldUseCrossTabs()) {
      this._isInitializingCrossTab = !0;
      try {
        const e = this.get("config")?.id;
        e && this.initializeCrossTabSessionManager(e);
      } catch (e) {
        i.error("SessionHandler", "Failed to initialize cross-tab session manager", {
          error: e instanceof Error ? e.message : "Unknown error"
        });
      } finally {
        this._isInitializingCrossTab = !1;
      }
    }
    return this._crossTabSessionManager;
  }
  shouldUseCrossTabs() {
    return typeof BroadcastChannel < "u" && typeof navigator < "u" && "serviceWorker" in navigator;
  }
  constructor(e, t) {
    super(), this.eventManager = t, this.storageManager = e, this.sessionStorageKey = rt(this.get("config")?.id);
    const s = this.get("config")?.id;
    s && this.initializeSessionRecoveryManager(s);
  }
  startTracking() {
    if (this.sessionManager) {
      i.debug("SessionHandler", "Session tracking already active");
      return;
    }
    i.debug("SessionHandler", "Starting session tracking"), this.checkOrphanedSessions();
    const e = async () => {
      if (this.crossTabSessionManager && this.crossTabSessionManager.updateSessionActivity(), !this.get("sessionId"))
        try {
          const n = await this.createOrJoinSession();
          this.set("sessionId", n.sessionId), i.info("SessionHandler", "🏁 Session started", {
            sessionId: n.sessionId,
            recovered: n.recovered,
            crossTabActive: !!this.crossTabSessionManager
          }), this.trackSession(u.SESSION_START, n.recovered), this.persistSession(n.sessionId), this.startHeartbeat();
        } catch (n) {
          i.error(
            "SessionHandler",
            `Session creation failed: ${n instanceof Error ? n.message : "Unknown error"}`
          ), this.forceCleanupSession();
        }
    }, t = () => {
      if (this.get("sessionId")) {
        if (this.crossTabSessionManager && this.crossTabSessionManager.getEffectiveSessionTimeout() > 0) {
          (this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug") && i.debug("SessionHandler", "Session kept alive by cross-tab activity");
          return;
        }
        this.sessionManager.endSessionManaged("inactivity").then((n) => {
          i.info("SessionHandler", "🛑 Session ended by inactivity", {
            sessionId: this.get("sessionId"),
            reason: n.reason,
            success: n.success,
            eventsFlushed: n.eventsFlushed
          }), this.crossTabSessionManager && this.crossTabSessionManager.endSession("inactivity"), this.clearPersistedSession(), this.stopHeartbeat();
        }).catch((n) => {
          i.error(
            "SessionHandler",
            `Session end failed: ${n instanceof Error ? n.message : "Unknown error"}`
          ), this.forceCleanupSession();
        });
      }
    }, s = {
      enablePageUnloadHandlers: !0,
      debugMode: (this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug") ?? !1,
      syncTimeoutMs: ve.SYNC_TIMEOUT_MS,
      maxRetries: ve.MAX_RETRY_ATTEMPTS
    };
    this.sessionManager = new Ot(
      e,
      t,
      this.eventManager,
      this.storageManager,
      s
    ), i.debug("SessionHandler", "Session manager initialized"), this.startInitialSession();
  }
  stopTracking() {
    if (i.info("SessionHandler", "Stopping session tracking"), this.sessionManager) {
      if (this.get("sessionId"))
        try {
          this.sessionManager.endSessionSafely("manual_stop", { forceSync: !0 }), this.clearPersistedSession(), this.stopHeartbeat();
        } catch (e) {
          i.error(
            "SessionHandler",
            `Manual session stop failed: ${e instanceof Error ? e.message : "Unknown error"}`
          ), this.forceCleanupSession();
        }
      this.sessionManager.destroy(), this.sessionManager = null;
    }
    this._crossTabSessionManager && (this._crossTabSessionManager.destroy(), this._crossTabSessionManager = null), this._isInitializingCrossTab = !1, this.recoveryManager && (this.recoveryManager.cleanupOldRecoveryAttempts(), this.recoveryManager = null);
  }
  initializeSessionRecoveryManager(e) {
    this.recoveryManager = new Pe(this.storageManager, e, this.eventManager), i.debug("SessionHandler", "Session recovery manager initialized", { projectId: e });
  }
  initializeCrossTabSessionManager(e) {
    const t = {
      debugMode: (this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug") ?? !1
    }, d = {
      onSessionStart: (c) => {
        (this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug") && i.debug("SessionHandler", `Cross-tab session started: ${c}`), this.set("sessionId", c), this.trackSession(u.SESSION_START, !1), this.persistSession(c), this.startHeartbeat();
      },
      onSessionEnd: (c) => {
        (this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug") && i.debug("SessionHandler", `Cross-tab session ended: ${c}`), this.clearPersistedSession(), this.trackSession(u.SESSION_END, !1, c);
      },
      onTabActivity: () => {
        (this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug") && i.debug("SessionHandler", "Cross-tab activity detected");
      },
      onCrossTabConflict: () => {
        (this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug") && i.warn("SessionHandler", "Cross-tab conflict detected"), this.sessionManager && this.sessionManager.trackSessionHealth("conflict");
      }
    };
    this._crossTabSessionManager = new xt(this.storageManager, e, t, d), i.debug("SessionHandler", "Cross-tab session manager initialized", { projectId: e });
  }
  async createOrJoinSession() {
    if (this.crossTabSessionManager) {
      const t = this.crossTabSessionManager.getSessionId();
      if (t)
        return { sessionId: t, recovered: !1 };
      const s = this.sessionManager.startSession();
      return { sessionId: s.sessionId, recovered: s.recovered ?? !1 };
    }
    const e = this.sessionManager.startSession();
    return { sessionId: e.sessionId, recovered: e.recovered ?? !1 };
  }
  forceCleanupSession() {
    if (this.set("sessionId", null), this.clearPersistedSession(), this.stopHeartbeat(), this.crossTabSessionManager)
      try {
        this.crossTabSessionManager.endSession("orphaned_cleanup");
      } catch (e) {
        (this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug") && i.warn(
          "SessionHandler",
          `Cross-tab cleanup failed during force cleanup: ${e instanceof Error ? e.message : "Unknown error"}`
        );
      }
    try {
      this.trackSession(u.SESSION_END, !1, "orphaned_cleanup");
    } catch (e) {
      (this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug") && i.warn(
        "SessionHandler",
        `Session tracking failed during force cleanup: ${e instanceof Error ? e.message : "Unknown error"}`
      );
    }
    (this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug") && i.debug("SessionHandler", "Forced session cleanup completed");
  }
  trackSession(e, t = !1, s) {
    this.eventManager.track({
      type: e,
      ...e === u.SESSION_START && t && { session_start_recovered: t },
      ...e === u.SESSION_END && { session_end_reason: s ?? "orphaned_cleanup" }
    });
  }
  startInitialSession() {
    if (this.get("sessionId")) {
      i.debug("SessionHandler", "Session already exists, skipping initial session creation");
      return;
    }
    if (i.debug("SessionHandler", "Starting initial session"), this.crossTabSessionManager) {
      const t = this.crossTabSessionManager.getSessionId();
      if (t) {
        this.set("sessionId", t), this.persistSession(t), this.startHeartbeat();
        return;
      }
      return;
    }
    i.debug("SessionHandler", "Starting regular session (no cross-tab)");
    const e = this.sessionManager.startSession();
    this.set("sessionId", e.sessionId), this.trackSession(u.SESSION_START, e.recovered), this.persistSession(e.sessionId), this.startHeartbeat();
  }
  checkOrphanedSessions() {
    const e = this.storageManager.getItem(this.sessionStorageKey);
    if (e)
      try {
        const t = JSON.parse(e), n = Date.now() - t.lastHeartbeat, a = this.get("config")?.sessionTimeout ?? _;
        if (n > a) {
          const o = this.recoveryManager?.hasRecoverableSession();
          if (o && this.recoveryManager) {
            const d = {
              sessionId: t.sessionId,
              startTime: t.startTime,
              lastActivity: t.lastHeartbeat,
              tabCount: 1,
              recoveryAttempts: 0,
              metadata: {
                userAgent: navigator.userAgent,
                pageUrl: this.get("pageUrl")
              }
            };
            this.recoveryManager.storeSessionContextForRecovery(d), (this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug") && i.debug("SessionHandler", `Orphaned session stored for recovery: ${t.sessionId}`);
          }
          this.trackSession(u.SESSION_END), this.clearPersistedSession(), (this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug") && i.debug(
            "SessionHandler",
            `Orphaned session ended: ${t.sessionId}, recovery available: ${o}`
          );
        }
      } catch {
        this.clearPersistedSession();
      }
  }
  persistSession(e) {
    const t = {
      sessionId: e,
      startTime: Date.now(),
      lastHeartbeat: Date.now()
    };
    this.storageManager.setItem(this.sessionStorageKey, JSON.stringify(t));
  }
  clearPersistedSession() {
    this.storageManager.removeItem(this.sessionStorageKey);
  }
  startHeartbeat() {
    this.stopHeartbeat(), this.heartbeatInterval = setInterval(() => {
      const e = this.storageManager.getItem(this.sessionStorageKey);
      if (e)
        try {
          const t = JSON.parse(e);
          t.lastHeartbeat = Date.now(), this.storageManager.setItem(this.sessionStorageKey, JSON.stringify(t));
        } catch {
          this.clearPersistedSession();
        }
    }, Ge);
  }
  stopHeartbeat() {
    this.heartbeatInterval && (clearInterval(this.heartbeatInterval), this.heartbeatInterval = null);
  }
}
class zt extends v {
  eventManager;
  onTrack;
  originalPushState;
  originalReplaceState;
  constructor(e, t) {
    super(), this.eventManager = e, this.onTrack = t;
  }
  startTracking() {
    i.debug("PageViewHandler", "Starting page view tracking"), this.trackInitialPageView(), this.trackCurrentPage(), window.addEventListener("popstate", this.trackCurrentPage), window.addEventListener("hashchange", this.trackCurrentPage), this.patchHistory("pushState"), this.patchHistory("replaceState");
  }
  stopTracking() {
    i.debug("PageViewHandler", "Stopping page view tracking"), window.removeEventListener("popstate", this.trackCurrentPage), window.removeEventListener("hashchange", this.trackCurrentPage), this.originalPushState && (window.history.pushState = this.originalPushState), this.originalReplaceState && (window.history.replaceState = this.originalReplaceState);
  }
  patchHistory(e) {
    e === "pushState" && !this.originalPushState ? this.originalPushState = window.history.pushState : e === "replaceState" && !this.originalReplaceState && (this.originalReplaceState = window.history.replaceState);
    const t = window.history[e];
    window.history[e] = (...s) => {
      t.apply(window.history, s), this.trackCurrentPage();
    };
  }
  trackCurrentPage = () => {
    const e = window.location.href, t = ie(e, this.get("config").sensitiveQueryParams);
    if (this.get("pageUrl") !== t) {
      const s = this.get("pageUrl");
      i.debug("PageViewHandler", "Page navigation detected", { from: s, to: t }), this.set("pageUrl", t), this.eventManager.track({
        type: u.PAGE_VIEW,
        page_url: this.get("pageUrl"),
        from_page_url: s,
        ...this.extractPageViewData() && { page_view: this.extractPageViewData() }
      }), this.onTrack();
    }
  };
  trackInitialPageView() {
    this.eventManager.track({
      type: u.PAGE_VIEW,
      page_url: this.get("pageUrl"),
      ...this.extractPageViewData() && { page_view: this.extractPageViewData() }
    }), this.onTrack();
  }
  extractPageViewData() {
    const e = window.location, t = {
      ...document.referrer && { referrer: document.referrer },
      ...document.title && { title: document.title },
      ...e.pathname && { pathname: e.pathname },
      ...e.search && { search: e.search },
      ...e.hash && { hash: e.hash }
    };
    return Object.values(t).some((s) => !!s) ? t : void 0;
  }
}
class Vt extends v {
  eventManager;
  clickHandler;
  constructor(e) {
    super(), this.eventManager = e;
  }
  startTracking() {
    if (this.clickHandler) {
      i.debug("ClickHandler", "Click tracking already active");
      return;
    }
    i.debug("ClickHandler", "Starting click tracking"), this.clickHandler = (e) => {
      const t = e, s = t.target, n = s instanceof HTMLElement ? s : s instanceof Node && s.parentElement instanceof HTMLElement ? s.parentElement : null;
      if (!n) {
        i.warn("ClickHandler", "Click target not found or not an element");
        return;
      }
      i.info("ClickHandler", "🖱️ Click detected on element", {
        tagName: n.tagName,
        className: n.className || "none",
        textContent: n.textContent?.slice(0, 50) ?? "empty"
      });
      const a = this.findTrackingElement(n), o = this.getRelevantClickElement(n), d = this.calculateClickCoordinates(t, n);
      if (a) {
        const l = this.extractTrackingData(a);
        if (l) {
          const h = this.createCustomEventData(l);
          this.eventManager.track({
            type: u.CUSTOM,
            custom_event: {
              name: h.name,
              ...h.value && { metadata: { value: h.value } }
            }
          });
        }
      }
      const c = this.generateClickData(n, o, d);
      this.eventManager.track({
        type: u.CLICK,
        click_data: c
      });
    }, window.addEventListener("click", this.clickHandler, !0);
  }
  stopTracking() {
    this.clickHandler && (window.removeEventListener("click", this.clickHandler, !0), this.clickHandler = void 0);
  }
  findTrackingElement(e) {
    return e.hasAttribute(`${z}-name`) ? e : e.closest(`[${z}-name]`) || void 0;
  }
  getRelevantClickElement(e) {
    for (const t of me)
      try {
        if (e.matches(t))
          return e;
      } catch (s) {
        i.warn("ClickHandler", "Invalid selector in interactive elements check", {
          selector: t,
          error: s instanceof Error ? s.message : "Unknown error"
        });
        continue;
      }
    for (const t of me)
      try {
        const s = e.closest(t);
        if (s)
          return s;
      } catch (s) {
        i.warn("ClickHandler", "Invalid selector in parent element search", {
          selector: t,
          error: s instanceof Error ? s.message : "Unknown error"
        });
        continue;
      }
    return e;
  }
  calculateClickCoordinates(e, t) {
    const s = t.getBoundingClientRect(), n = e.clientX, a = e.clientY, o = s.width > 0 ? Math.max(0, Math.min(1, Number(((n - s.left) / s.width).toFixed(3)))) : 0, d = s.height > 0 ? Math.max(0, Math.min(1, Number(((a - s.top) / s.height).toFixed(3)))) : 0;
    return { x: n, y: a, relativeX: o, relativeY: d };
  }
  extractTrackingData(e) {
    const t = e.getAttribute(`${z}-name`), s = e.getAttribute(`${z}-value`);
    if (t)
      return {
        element: e,
        name: t,
        ...s && { value: s }
      };
  }
  generateClickData(e, t, s) {
    const { x: n, y: a, relativeX: o, relativeY: d } = s, c = this.getRelevantText(e, t), l = this.extractElementAttributes(t), h = t.getAttribute("href"), g = t.getAttribute("title"), S = t.getAttribute("alt"), M = t.getAttribute("role"), b = t.getAttribute("aria-label"), P = typeof t.className == "string" ? t.className : String(t.className);
    return {
      x: n,
      y: a,
      relativeX: o,
      relativeY: d,
      tag: t.tagName.toLowerCase(),
      ...t.id && { id: t.id },
      ...t.className && { class: P },
      ...c && { text: c },
      ...h && { href: h },
      ...g && { title: g },
      ...S && { alt: S },
      ...M && { role: M },
      ...b && { ariaLabel: b },
      ...Object.keys(l).length > 0 && { dataAttributes: l }
    };
  }
  getRelevantText(e, t) {
    const s = ["main", "section", "article", "body", "html", "header", "footer", "aside", "nav"], n = e.textContent?.trim() ?? "", a = t.textContent?.trim() ?? "";
    if (!n && !a)
      return "";
    if (n && n.length <= A)
      return n;
    const o = s.includes(t.tagName.toLowerCase()), d = a.length > A * 2;
    return o && d ? n && n.length <= A ? n : "" : a.length <= A ? a : n && n.length < a.length * 0.1 ? n.length <= A ? n : n.slice(0, A - 3) + "..." : a.slice(0, A - 3) + "...";
  }
  extractElementAttributes(e) {
    const t = ["id", "class", "data-testid", "aria-label", "title", "href", "type", "name"], s = {};
    for (const n of t) {
      const a = e.getAttribute(n);
      a && (s[n] = a);
    }
    return s;
  }
  createCustomEventData(e) {
    return {
      name: e.name,
      ...e.value && { value: e.value }
    };
  }
}
class $t extends v {
  eventManager;
  containers = [];
  constructor(e) {
    super(), this.eventManager = e;
  }
  startTracking() {
    const e = this.get("config").scrollContainerSelectors, t = Array.isArray(e) ? e : typeof e == "string" ? [e] : [];
    i.debug("ScrollHandler", "Starting scroll tracking", { selectorsCount: t.length });
    const s = t.map((n) => this.safeQuerySelector(n)).filter((n) => n instanceof HTMLElement);
    s.length === 0 && s.push(window);
    for (const n of s)
      this.setupScrollContainer(n);
  }
  stopTracking() {
    i.debug("ScrollHandler", "Stopping scroll tracking", { containersCount: this.containers.length });
    for (const e of this.containers)
      e.debounceTimer && clearTimeout(e.debounceTimer), e.element instanceof Window ? window.removeEventListener("scroll", e.listener) : e.element.removeEventListener("scroll", e.listener);
    this.containers.length = 0;
  }
  setupScrollContainer(e) {
    if (e !== window && !this.isElementScrollable(e))
      return;
    const t = {
      element: e,
      lastScrollPos: this.getScrollTop(e),
      debounceTimer: null,
      listener: () => {
      }
    }, s = () => {
      if (this.get("suppressNextScroll")) {
        this.set("suppressNextScroll", !1);
        return;
      }
      t.debounceTimer && clearTimeout(t.debounceTimer), t.debounceTimer = window.setTimeout(() => {
        const n = this.calculateScrollData(t);
        n && this.eventManager.track({
          type: u.SCROLL,
          scroll_data: n
        }), t.debounceTimer = null;
      }, Ce);
    };
    t.listener = s, this.containers.push(t), e instanceof Window ? window.addEventListener("scroll", s, { passive: !0 }) : e.addEventListener("scroll", s, { passive: !0 });
  }
  calculateScrollData(e) {
    const { element: t, lastScrollPos: s } = e, n = this.getScrollTop(t), a = this.getViewportHeight(t), o = this.getScrollHeight(t);
    if (t === window && o <= a)
      return null;
    const d = n > s ? B.DOWN : B.UP, c = o > a ? Math.min(100, Math.max(0, Math.floor(n / (o - a) * 100))) : 0;
    return Math.abs(n - s) < Oe ? null : (e.lastScrollPos = n, { depth: c, direction: d });
  }
  getScrollTop(e) {
    return e instanceof Window ? window.scrollY : e.scrollTop;
  }
  getViewportHeight(e) {
    return e instanceof Window ? window.innerHeight : e.clientHeight;
  }
  getScrollHeight(e) {
    return e instanceof Window ? document.documentElement.scrollHeight : e.scrollHeight;
  }
  isElementScrollable(e) {
    const t = getComputedStyle(e), s = t.overflowY === "auto" || t.overflowY === "scroll" || t.overflowX === "auto" || t.overflowX === "scroll" || t.overflow === "auto" || t.overflow === "scroll", n = e.scrollHeight > e.clientHeight || e.scrollWidth > e.clientWidth;
    return s && n;
  }
  safeQuerySelector(e) {
    try {
      return document.querySelector(e);
    } catch (t) {
      return i.clientWarn("ScrollHandler", "Invalid CSS selector", {
        selector: e,
        error: t instanceof Error ? t.message : "Unknown error"
      }), null;
    }
  }
}
class Bt extends v {
  isInitialized = !1;
  constructor() {
    super();
  }
  async initialize() {
    if (this.isInitialized)
      return;
    const e = this.get("config").integrations?.googleAnalytics?.measurementId;
    if (!e?.trim()) {
      i.clientWarn("GoogleAnalytics", "Google Analytics integration disabled - measurementId not configured", {
        hasIntegrations: !!this.get("config").integrations,
        hasGoogleAnalytics: !!this.get("config").integrations?.googleAnalytics
      });
      return;
    }
    const t = this.get("userId");
    if (!t?.trim()) {
      i.warn("GoogleAnalytics", "Google Analytics initialization delayed - userId not available", {
        measurementId: e.substring(0, 8) + "..."
      });
      return;
    }
    try {
      if (this.isScriptAlreadyLoaded()) {
        i.info("GoogleAnalytics", "Google Analytics script already loaded", { measurementId: e }), this.isInitialized = !0;
        return;
      }
      await this.loadScript(e), this.configureGtag(e, t), this.isInitialized = !0, i.info("GoogleAnalytics", "Google Analytics integration initialized successfully", {
        measurementId: e,
        userId: t
      });
    } catch (s) {
      i.error("GoogleAnalytics", "Google Analytics initialization failed", {
        error: s instanceof Error ? s.message : "Unknown error",
        measurementId: e,
        userId: t
      });
    }
  }
  trackEvent(e, t) {
    if (!e?.trim()) {
      i.clientWarn("GoogleAnalytics", "Event tracking skipped - invalid event name provided", {
        eventName: e,
        hasMetadata: !!t && Object.keys(t).length > 0
      });
      return;
    }
    if (this.isInitialized) {
      if (typeof window.gtag != "function") {
        i.warn("GoogleAnalytics", "Event tracking failed - gtag function not available", {
          eventName: e,
          hasGtag: typeof window.gtag,
          hasDataLayer: Array.isArray(window.dataLayer)
        });
        return;
      }
      try {
        window.gtag("event", e, t);
      } catch (s) {
        i.error("GoogleAnalytics", "Event tracking failed", {
          eventName: e,
          error: s instanceof Error ? s.message : "Unknown error",
          metadataKeys: Object.keys(t || {})
        });
      }
    }
  }
  cleanup() {
    this.isInitialized = !1;
    const e = document.getElementById("tracelog-ga-script");
    e && e.remove(), i.info("GoogleAnalytics", "Google Analytics integration cleanup completed");
  }
  isScriptAlreadyLoaded() {
    if (document.getElementById("tracelog-ga-script"))
      return !0;
    const t = document.querySelector('script[src*="googletagmanager.com/gtag/js"]');
    return t ? (i.clientWarn("GoogleAnalytics", "Google Analytics script already loaded from external source", {
      scriptSrc: t.getAttribute("src"),
      hasGtag: typeof window.gtag == "function"
    }), !0) : !1;
  }
  async loadScript(e) {
    return new Promise((t, s) => {
      try {
        const n = document.createElement("script");
        n.id = "tracelog-ga-script", n.async = !0, n.src = `https://www.googletagmanager.com/gtag/js?id=${e}`, n.onload = () => {
          t();
        }, n.onerror = () => {
          const a = new Error("Failed to load Google Analytics script");
          i.error("GoogleAnalytics", "Google Analytics script load failed", {
            measurementId: e,
            error: a.message,
            scriptSrc: n.src
          }), s(a);
        }, document.head.appendChild(n);
      } catch (n) {
        const a = n instanceof Error ? n : new Error(String(n));
        i.error("GoogleAnalytics", "Error creating Google Analytics script", {
          measurementId: e,
          error: a.message
        }), s(a);
      }
    });
  }
  configureGtag(e, t) {
    try {
      const s = document.createElement("script");
      s.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${e}', {
          'user_id': '${t}'
        });
      `, document.head.appendChild(s);
    } catch (s) {
      throw i.error("GoogleAnalytics", "Failed to configure Google Analytics", {
        measurementId: e,
        userId: t,
        error: s instanceof Error ? s.message : "Unknown error"
      }), s;
    }
  }
}
class jt {
  storage = null;
  fallbackStorage = /* @__PURE__ */ new Map();
  storageAvailable = !1;
  constructor() {
    this.storage = this.init(), this.storageAvailable = this.storage !== null, this.storageAvailable || i.warn("StorageManager", "localStorage not available, using memory fallback");
  }
  getItem(e) {
    if (!this.storageAvailable)
      return this.fallbackStorage.get(e) ?? null;
    try {
      return this.storage ? this.storage.getItem(e) : this.fallbackStorage.get(e) ?? null;
    } catch (t) {
      return i.warn("StorageManager", "Storage getItem failed, using memory fallback", { key: e, error: t }), this.storageAvailable = !1, this.fallbackStorage.get(e) ?? null;
    }
  }
  setItem(e, t) {
    if (!this.storageAvailable) {
      this.fallbackStorage.set(e, t);
      return;
    }
    try {
      this.storage ? this.storage.setItem(e, t) : this.fallbackStorage.set(e, t);
    } catch (s) {
      if (this.handleStorageError(s, e, "set"))
        try {
          this.storage?.setItem(e, t);
          return;
        } catch (a) {
          i.warn("StorageManager", "Storage retry failed, using memory fallback", { key: e, retryError: a });
        }
      i.warn("StorageManager", "Storage setItem failed, using memory fallback", { key: e, error: s }), this.storageAvailable = !1, this.fallbackStorage.set(e, t);
    }
  }
  removeItem(e) {
    if (!this.storageAvailable) {
      this.fallbackStorage.delete(e);
      return;
    }
    try {
      if (this.storage) {
        this.storage.removeItem(e);
        return;
      }
      this.fallbackStorage.delete(e);
    } catch (t) {
      i.warn("StorageManager", "Storage removeItem failed, using memory fallback", { key: e, error: t }), this.storageAvailable = !1, this.fallbackStorage.delete(e);
    }
  }
  performStorageCleanup() {
    try {
      const e = [];
      for (let t = 0; t < localStorage.length; t++) {
        const s = localStorage.key(t);
        if (s?.startsWith("tracelog_"))
          try {
            const n = JSON.parse(localStorage.getItem(s) ?? "{}");
            Date.now() - (n.timestamp ?? 0) > 24 * 60 * 60 * 1e3 && e.push(s);
          } catch {
            e.push(s);
          }
      }
      return e.forEach((t) => localStorage.removeItem(t)), i.info("StorageManager", "Storage cleanup completed", {
        keysRemoved: e.length
      }), e.length > 0;
    } catch (e) {
      return i.error("StorageManager", "Storage cleanup failed", { error: e }), !1;
    }
  }
  handleStorageError(e, t, s) {
    return e.name === "QuotaExceededError" && (i.warn("StorageManager", "Storage quota exceeded, attempting cleanup", { key: t, operation: s }), this.performStorageCleanup() && s === "set") ? (i.info("StorageManager", "Retrying storage operation after cleanup", { key: t }), !0) : !1;
  }
  init() {
    try {
      const e = "__storage_test__", t = window.localStorage;
      return t.setItem(e, e), t.removeItem(e), t;
    } catch {
      return null;
    }
  }
}
class Gt extends v {
  eventManager;
  reportedByNav = /* @__PURE__ */ new Map();
  observers = [];
  lastLongTaskSentAt = 0;
  constructor(e) {
    super(), this.eventManager = e;
  }
  async startTracking() {
    i.debug("PerformanceHandler", "Starting performance tracking"), await this.initWebVitals(), this.observeLongTasks(), this.reportTTFB();
  }
  stopTracking() {
    i.debug("PerformanceHandler", "Stopping performance tracking", { observersCount: this.observers.length }), this.observers.forEach((e, t) => {
      try {
        e.disconnect();
      } catch (s) {
        i.warn("PerformanceHandler", "Failed to disconnect performance observer", {
          error: s instanceof Error ? s.message : "Unknown error",
          observerIndex: t
        });
      }
    }), this.observers.length = 0, this.reportedByNav.clear(), i.debug("PerformanceHandler", "Performance tracking cleanup completed", {
      remainingObservers: this.observers.length,
      clearedNavReports: !0
    });
  }
  observeWebVitalsFallback() {
    this.reportTTFB(), this.safeObserve(
      "largest-contentful-paint",
      (t) => {
        const s = t.getEntries(), n = s[s.length - 1];
        n && this.sendVital({ type: "LCP", value: Number(n.startTime.toFixed(k)) });
      },
      { type: "largest-contentful-paint", buffered: !0 },
      !0
    );
    let e = 0;
    this.safeObserve(
      "layout-shift",
      (t) => {
        const s = t.getEntries();
        for (const n of s) {
          if (n.hadRecentInput === !0)
            continue;
          const a = typeof n.value == "number" ? n.value : 0;
          e += a;
        }
        this.sendVital({ type: "CLS", value: Number(e.toFixed(xe)) });
      },
      { type: "layout-shift", buffered: !0 }
    ), this.safeObserve(
      "paint",
      (t) => {
        for (const s of t.getEntries())
          s.name === "first-contentful-paint" && this.sendVital({ type: "FCP", value: Number(s.startTime.toFixed(k)) });
      },
      { type: "paint", buffered: !0 },
      !0
    ), this.safeObserve(
      "event",
      (t) => {
        let s = 0;
        const n = t.getEntries();
        for (const a of n) {
          const o = (a.processingEnd ?? 0) - (a.startTime ?? 0);
          s = Math.max(s, o);
        }
        s > 0 && this.sendVital({ type: "INP", value: Number(s.toFixed(k)) });
      },
      { type: "event", buffered: !0 }
    );
  }
  async initWebVitals() {
    try {
      const { onLCP: e, onCLS: t, onFCP: s, onTTFB: n, onINP: a } = await import("./web-vitals-CCnqwnC8.mjs"), o = (d) => (c) => {
        const l = Number(c.value.toFixed(k));
        this.sendVital({ type: d, value: l });
      };
      e(o("LCP")), t(o("CLS")), s(o("FCP")), n(o("TTFB")), a(o("INP"));
    } catch (e) {
      i.warn("PerformanceHandler", "Failed to load web-vitals library, using fallback", {
        error: e instanceof Error ? e.message : "Unknown error"
      }), this.observeWebVitalsFallback();
    }
  }
  reportTTFB() {
    try {
      const e = performance.getEntriesByType("navigation")[0];
      if (!e) {
        i.debug("PerformanceHandler", "Navigation timing not available for TTFB");
        return;
      }
      const t = e.responseStart;
      typeof t == "number" && Number.isFinite(t) ? this.sendVital({ type: "TTFB", value: Number(t.toFixed(k)) }) : i.debug("PerformanceHandler", "TTFB value is not a valid number", { ttfb: t });
    } catch (e) {
      i.warn("PerformanceHandler", "Failed to report TTFB", {
        error: e instanceof Error ? e.message : "Unknown error"
      });
    }
  }
  observeLongTasks() {
    this.safeObserve(
      "longtask",
      (e) => {
        const t = e.getEntries();
        for (const s of t) {
          const n = Number(s.duration.toFixed(k)), a = Date.now();
          a - this.lastLongTaskSentAt >= Ke && (this.trackWebVital("LONG_TASK", n), this.lastLongTaskSentAt = a);
        }
      },
      { type: "longtask", buffered: !0 }
    );
  }
  sendVital(e) {
    const t = this.getNavigationId(), s = `${e.type}`;
    if (t) {
      this.reportedByNav.has(t) || this.reportedByNav.set(t, /* @__PURE__ */ new Set());
      const n = this.reportedByNav.get(t);
      if (n.has(s))
        return;
      n.add(s);
    }
    this.trackWebVital(e.type, e.value);
  }
  trackWebVital(e, t) {
    if (typeof t != "number" || !Number.isFinite(t)) {
      i.warn("PerformanceHandler", "Invalid web vital value", { type: e, value: t });
      return;
    }
    this.eventManager.track({
      type: u.WEB_VITALS,
      web_vitals: {
        type: e,
        value: t
      }
    });
  }
  getNavigationId() {
    try {
      const e = performance.getEntriesByType("navigation")[0];
      return e ? `${Math.round(e.startTime)}_${window.location.pathname}` : null;
    } catch (e) {
      return i.warn("PerformanceHandler", "Failed to get navigation ID", {
        error: e instanceof Error ? e.message : "Unknown error"
      }), null;
    }
  }
  safeObserve(e, t, s, n = !1) {
    try {
      if (typeof PerformanceObserver > "u") return;
      const a = PerformanceObserver.supportedEntryTypes;
      if (a && !a.includes(e)) return;
      const o = new PerformanceObserver((d, c) => {
        if (t(d, c), n)
          try {
            c.disconnect();
          } catch {
          }
      });
      o.observe(s ?? { type: e, buffered: !0 }), n || this.observers.push(o);
    } catch (a) {
      i.warn("PerformanceHandler", "Failed to create performance observer", {
        type: e,
        error: a instanceof Error ? a.message : "Unknown error"
      });
    }
  }
}
class Qt extends v {
  eventManager;
  piiPatterns = [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    /\b[A-Z]{2}\d{2}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g
  ];
  constructor(e) {
    super(), this.eventManager = e;
  }
  startTracking() {
    i.debug("ErrorHandler", "Starting error tracking"), this.setupErrorListener(), this.setupUnhandledRejectionListener();
  }
  stopTracking() {
    i.debug("ErrorHandler", "Stopping error tracking"), window.removeEventListener("error", this.handleError), window.removeEventListener("unhandledrejection", this.handleUnhandledRejection);
  }
  setupErrorListener() {
    window.addEventListener("error", this.handleError);
  }
  setupUnhandledRejectionListener() {
    window.addEventListener("unhandledrejection", this.handleUnhandledRejection);
  }
  handleError = (e) => {
    const t = this.get("config");
    if (!this.shouldSample(t?.errorSampling ?? 0.1)) {
      i.debug("ErrorHandler", `Error not sampled, skipping (errorSampling: ${t?.errorSampling})`, {
        errorSampling: t?.errorSampling
      });
      return;
    }
    i.warn(
      "ErrorHandler",
      `JavaScript error captured: ${e.message} (filename: ${e.filename}, lineno: ${e.lineno})`,
      {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno
      }
    ), this.eventManager.track({
      type: u.ERROR,
      error_data: {
        type: U.JS_ERROR,
        message: this.sanitizeText(e.message || "Unknown error")
      }
    });
  };
  handleUnhandledRejection = (e) => {
    const t = this.get("config");
    if (!this.shouldSample(t?.errorSampling ?? 0.1)) {
      i.debug("ErrorHandler", "Promise rejection not sampled, skipping", {
        errorSampling: t?.errorSampling
      });
      return;
    }
    i.warn("ErrorHandler", `Unhandled promise rejection captured (reason: ${typeof e.reason})`, {
      reason: typeof e.reason
    });
    let s = "Unknown rejection";
    e.reason && (typeof e.reason == "string" ? s = e.reason : e.reason instanceof Error ? s = e.reason.message || e.reason.toString() : s = String(e.reason)), this.eventManager.track({
      type: u.ERROR,
      error_data: {
        type: U.PROMISE_REJECTION,
        message: this.sanitizeText(s)
      }
    });
  };
  sanitizeText(e) {
    let t = e;
    for (const s of this.piiPatterns)
      t = t.replace(s, "[REDACTED]");
    return t;
  }
  shouldSample(e) {
    return Math.random() < e;
  }
}
class Wt extends v {
  eventManager;
  originalXHROpen;
  originalXHRSend;
  constructor(e) {
    super(), this.eventManager = e, this.originalXHROpen = XMLHttpRequest.prototype.open, this.originalXHRSend = XMLHttpRequest.prototype.send;
  }
  startTracking() {
    i.debug("NetworkHandler", "Starting network error tracking"), this.interceptXHR();
  }
  stopTracking() {
    i.debug("NetworkHandler", "Stopping network error tracking"), XMLHttpRequest.prototype.open = this.originalXHROpen, XMLHttpRequest.prototype.send = this.originalXHRSend;
  }
  interceptXHR() {
    const e = this.trackNetworkError.bind(this), t = this.normalizeUrlForTracking.bind(this), s = this.originalXHROpen, n = this.originalXHRSend;
    XMLHttpRequest.prototype.open = function(a, o, d, c, l) {
      const h = d ?? !0, g = this;
      return g._tracelogStartTime = Date.now(), g._tracelogMethod = a.toUpperCase(), g._tracelogUrl = o.toString(), s.call(this, a, o, h, c, l);
    }, XMLHttpRequest.prototype.send = function(a) {
      const o = this, d = o._tracelogStartTime ?? Date.now(), c = o._tracelogMethod ?? "GET", l = o._tracelogUrl ?? "", h = o.onreadystatechange;
      return o.onreadystatechange = (g) => {
        if (o.readyState === XMLHttpRequest.DONE) {
          const S = Date.now() - d, M = l.includes("/collect") || l.includes("/config");
          if ((o.status === 0 || o.status >= 400) && !M) {
            const b = o.statusText || "Request Failed";
            i.debug("NetworkHandler", "XHR error detected", {
              method: c,
              url: t(l),
              status: o.status,
              statusText: b
            }), e(c, t(l), o.status, b, S);
          }
        }
        if (h)
          return h.call(o, g);
      }, n.call(this, a);
    };
  }
  trackNetworkError(e, t, s, n, a) {
    const o = this.get("config");
    if (!this.shouldSample(o?.errorSampling ?? 0.1)) {
      i.debug(
        "NetworkHandler",
        `Network error not sampled, skipping (errorSampling: ${o?.errorSampling}, method: ${e}, url: ${t})`,
        {
          errorSampling: o?.errorSampling,
          method: e,
          url: t
        }
      );
      return;
    }
    i.warn(
      "NetworkHandler",
      `Network error tracked: ${e} ${t} (status: ${s}, statusText: ${n}, duration: ${a}ms)`,
      { method: e, url: t, status: s, statusText: n, duration: a }
    ), this.eventManager.track({
      type: u.ERROR,
      error_data: {
        type: U.NETWORK_ERROR,
        message: n,
        method: e,
        url: t,
        status: s,
        statusText: n,
        duration: a
      }
    });
  }
  normalizeUrlForTracking(e) {
    try {
      const t = this.get("config");
      return ie(e, t?.sensitiveQueryParams);
    } catch {
      return e;
    }
  }
  shouldSample(e) {
    return Math.random() < e;
  }
}
class qt extends v {
  isInitialized = !1;
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
  async init(e) {
    if (this.isInitialized) {
      i.debug("App", "App already initialized, skipping re-initialization", { projectId: e.id });
      return;
    }
    i.info("App", "App initialization started", { projectId: e.id }), this.validateAppReadiness(e);
    try {
      this.initStorage(), await this.setState(e), await this.setIntegrations(), this.setEventManager(), await this.initHandlers(), await this.eventManager.recoverPersistedEvents(), this.isInitialized = !0, i.info("App", "App initialization completed successfully", {
        projectId: e.id
      });
    } catch (t) {
      throw this.isInitialized = !1, i.error("App", "App initialization failed", { projectId: e.id, error: t }), t;
    }
  }
  /**
   * Validates that the app is ready to initialize with the provided config
   * This is a lightweight runtime validation layer that ensures the app receives proper config
   * @param appConfig - The validated and normalized configuration
   * @throws {ProjectIdValidationError} If project ID is invalid at runtime
   */
  validateAppReadiness(e) {
    if (!e?.id)
      throw i.clientError("App", "Configuration integrity check failed - missing project ID", {
        hasConfig: !!e,
        hasId: !!e?.id
      }), new G("Configuration integrity check failed", "app");
  }
  sendCustomEvent(e, t) {
    if (!this.eventManager) {
      i.warn("App", "Custom event attempted before eventManager initialization", { eventName: e });
      return;
    }
    const { valid: s, error: n, sanitizedMetadata: a } = Et(e, t);
    if (s)
      i.debug("App", "Custom event validated and queued", { eventName: e, hasMetadata: !!a }), this.eventManager.track({
        type: u.CUSTOM,
        custom_event: {
          name: e,
          ...a && { metadata: a }
        }
      });
    else {
      const o = this.get("config")?.mode;
      if (i.clientError("App", `Custom event validation failed: ${n ?? "unknown error"}`, {
        eventName: e,
        validationError: n,
        hasMetadata: !!t,
        mode: o
      }), o === "qa" || o === "debug")
        throw new Error(
          `custom event "${e}" validation failed (${n ?? "unknown error"}). Please, review your event data and try again.`
        );
    }
  }
  /**
   * Gets current error recovery statistics for monitoring purposes
   * @returns Object with recovery statistics and system status
   */
  getRecoveryStats() {
    return this.eventManager ? this.eventManager.getRecoveryStats() : (i.warn("App", "Recovery stats requested before eventManager initialization"), null);
  }
  /**
   * Triggers manual system recovery to attempt fixing error states
   * @returns Promise that resolves when recovery attempt is complete
   */
  async attemptSystemRecovery() {
    if (!this.eventManager) {
      i.warn("App", "System recovery attempted before eventManager initialization");
      return;
    }
    i.info("App", "Manual system recovery triggered"), await this.eventManager.attemptSystemRecovery();
  }
  /**
   * Triggers aggressive fingerprint cleanup to free memory
   */
  aggressiveFingerprintCleanup() {
    if (!this.eventManager) {
      i.warn("App", "Fingerprint cleanup attempted before eventManager initialization");
      return;
    }
    i.info("App", "Manual fingerprint cleanup triggered"), this.eventManager.aggressiveFingerprintCleanup();
  }
  destroy() {
    if (!this.isInitialized) {
      i.warn("App", "Destroy called but app was not initialized");
      return;
    }
    i.info("App", "App cleanup started"), this.googleAnalytics && this.googleAnalytics.cleanup(), this.sessionHandler && this.sessionHandler.stopTracking(), this.pageViewHandler && this.pageViewHandler.stopTracking(), this.clickHandler && this.clickHandler.stopTracking(), this.scrollHandler && this.scrollHandler.stopTracking(), this.performanceHandler && this.performanceHandler.stopTracking(), this.errorHandler && this.errorHandler.stopTracking(), this.networkHandler && this.networkHandler.stopTracking(), this.suppressNextScrollTimer && (clearTimeout(this.suppressNextScrollTimer), this.suppressNextScrollTimer = null), this.eventManager && this.eventManager.stop(), this.set("hasStartSession", !1), this.set("suppressNextScroll", !1), this.set("sessionId", null), this.isInitialized = !1, i.info("App", "App cleanup completed successfully");
  }
  async setState(e) {
    this.setApiUrl(e.id, e.allowHttp), await this.setConfig(e), this.setUserId(), this.setDevice(), this.setPageUrl();
  }
  setApiUrl(e, t = !1) {
    const s = new Tt();
    this.set("apiUrl", s.getUrl(e, t));
  }
  async setConfig(e) {
    const t = new Mt();
    try {
      const s = await t.get(this.get("apiUrl"), e);
      this.set("config", s);
    } catch (s) {
      throw i.clientError("App", "CONFIG LOAD FAILED", { error: s }), s;
    }
  }
  setUserId() {
    const t = new Lt(this.storageManager).getId();
    this.set("userId", t);
  }
  setDevice() {
    const e = Te();
    this.set("device", e);
  }
  setPageUrl() {
    const e = ie(window.location.href, this.get("config").sensitiveQueryParams);
    this.set("pageUrl", e);
  }
  async setIntegrations() {
    const e = this.get("config").ipExcluded, t = this.get("config").integrations?.googleAnalytics?.measurementId;
    !e && t?.trim() && (this.googleAnalytics = new Bt(), await this.googleAnalytics.initialize());
  }
  async initHandlers() {
    if (!this.eventManager)
      throw new Error("EventManager must be initialized before handlers");
    if (!this.storageManager)
      throw new Error("StorageManager must be initialized before handlers");
    this.initSessionHandler(), this.initScrollHandler(), this.initPageViewHandler(), this.initClickHandler(), await this.initPerformanceHandler(), this.initErrorHandler(), this.initNetworkHandler();
  }
  initStorage() {
    this.storageManager = new jt();
  }
  setEventManager() {
    if (!this.storageManager)
      throw new Error("StorageManager must be initialized before EventManager");
    this.eventManager = new _t(this.storageManager, this.googleAnalytics);
  }
  initSessionHandler() {
    if (!this.storageManager || !this.eventManager)
      throw new Error("StorageManager and EventManager must be initialized before SessionHandler");
    this.sessionHandler = new Ft(this.storageManager, this.eventManager), this.sessionHandler.startTracking();
  }
  initScrollHandler() {
    if (!this.eventManager)
      throw new Error("EventManager must be initialized before ScrollHandler");
    this.scrollHandler = new $t(this.eventManager), this.scrollHandler.startTracking();
  }
  initPageViewHandler() {
    if (!this.eventManager)
      throw new Error("EventManager must be initialized before PageViewHandler");
    const e = () => this.onPageViewTrack();
    this.pageViewHandler = new zt(this.eventManager, e), this.pageViewHandler.startTracking();
  }
  onPageViewTrack() {
    this.set("suppressNextScroll", !0), this.suppressNextScrollTimer && (clearTimeout(this.suppressNextScrollTimer), this.suppressNextScrollTimer = null), this.suppressNextScrollTimer = window.setTimeout(() => {
      this.set("suppressNextScroll", !1);
    }, Ce * it.SUPPRESS_MULTIPLIER);
  }
  initClickHandler() {
    if (!this.eventManager)
      throw new Error("EventManager must be initialized before ClickHandler");
    this.clickHandler = new Vt(this.eventManager), this.clickHandler.startTracking();
  }
  async initPerformanceHandler() {
    if (!this.eventManager)
      throw new Error("EventManager must be initialized before PerformanceHandler");
    this.performanceHandler = new Gt(this.eventManager), await this.performanceHandler.startTracking();
  }
  initErrorHandler() {
    if (!this.eventManager)
      throw new Error("EventManager must be initialized before ErrorHandler");
    this.errorHandler = new Qt(this.eventManager), this.errorHandler.startTracking();
  }
  initNetworkHandler() {
    if (!this.eventManager)
      throw new Error("EventManager must be initialized before NetworkHandler");
    this.networkHandler = new Wt(this.eventManager), this.networkHandler.startTracking();
  }
}
const Xt = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  DeviceType: E,
  ErrorType: U,
  EventType: u,
  Mode: R,
  ScrollDirection: B,
  TagConditionOperator: f,
  TagConditionType: p,
  TagLogicalOperator: j
}, Symbol.toStringTag, { value: "Module" })), Kt = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  DEFAULT_SESSION_TIMEOUT_MS: _
}, Symbol.toStringTag, { value: "Module" }));
let m = null, I = !1;
const Yt = async (r) => {
  try {
    if (i.info("API", "Library initialization started", { id: r.id }), typeof window > "u" || typeof document > "u")
      throw i.clientError(
        "API",
        "Browser environment required - this library can only be used in a browser environment",
        {
          hasWindow: typeof window < "u",
          hasDocument: typeof document < "u"
        }
      ), new Error("This library can only be used in a browser environment");
    if (m) {
      i.debug("API", "Library already initialized, skipping duplicate initialization", {
        projectId: r.id
      });
      return;
    }
    if (I) {
      i.debug("API", "Concurrent initialization detected, waiting for completion", { projectId: r.id });
      let s = 0;
      const n = pe.MAX_CONCURRENT_RETRIES, a = pe.CONCURRENT_RETRY_DELAY_MS;
      for (; I && s < n; )
        await new Promise((o) => setTimeout(o, a)), s++;
      if (m) {
        i.debug("API", "Concurrent initialization completed successfully", {
          projectId: r.id,
          retriesUsed: s
        });
        return;
      }
      if (I)
        throw i.error("API", "Initialization timeout - concurrent initialization took too long", {
          projectId: r.id,
          retriesUsed: s,
          maxRetries: n
        }), new Error("App initialization timeout - concurrent initialization took too long");
    }
    I = !0, i.debug("API", "Validating and normalizing configuration", { projectId: r.id });
    const e = ft(r);
    i.debug("API", "Creating App instance", { projectId: e.id });
    const t = new qt();
    await t.init(e), m = t, i.info("API", "Library initialization completed successfully", {
      projectId: e.id
    });
  } catch (e) {
    if (m && !m.initialized)
      try {
        m.destroy();
      } catch (t) {
        i.warn("API", "Failed to cleanup partially initialized app", { cleanupError: t });
      }
    throw m = null, i.error("API", "Initialization failed", { error: e }), e;
  } finally {
    I = !1;
  }
}, Jt = (r, e) => {
  try {
    if (!m)
      throw i.clientError("API", "Custom event failed - Library not initialized. Please call TraceLog.init() first", {
        eventName: r,
        hasMetadata: !!e
      }), new Error("App not initialized");
    i.debug("API", "Sending custom event", {
      eventName: r,
      hasMetadata: !!e,
      metadataKeys: e ? Object.keys(e) : []
    }), m.sendCustomEvent(r, e);
  } catch (t) {
    if (i.error("API", "Event tracking failed", { eventName: r, error: t, hasMetadata: !!e }), t instanceof Error && (t.message === "App not initialized" || t.message.includes("validation failed")))
      throw t;
  }
}, Zt = () => m !== null, es = () => ({
  isInitialized: m !== null,
  isInitializing: I,
  hasInstance: m !== null
}), ts = () => {
  try {
    if (i.info("API", "Library cleanup initiated"), !m)
      throw i.warn("API", "Cleanup called but Library was not initialized"), new Error("App not initialized");
    m.destroy(), m = null, I = !1, i.info("API", "Library cleanup completed successfully");
  } catch (r) {
    i.error("API", "Cleanup failed", { error: r, hadApp: !!m, wasInitializing: I });
  }
}, ss = () => {
  try {
    return m ? m.getRecoveryStats() : (i.warn("API", "Recovery stats requested but Library was not initialized"), null);
  } catch (r) {
    return i.error("API", "Failed to get recovery stats", { error: r }), null;
  }
}, is = async () => {
  try {
    if (!m)
      throw i.warn("API", "System recovery attempted but Library was not initialized"), new Error("App not initialized");
    i.info("API", "Manual system recovery initiated"), await m.attemptSystemRecovery(), i.info("API", "Manual system recovery completed");
  } catch (r) {
    throw i.error("API", "System recovery failed", { error: r }), r;
  }
}, ns = () => {
  try {
    if (!m)
      throw i.warn("API", "Fingerprint cleanup attempted but Library was not initialized"), new Error("App not initialized");
    i.info("API", "Manual fingerprint cleanup initiated"), m.aggressiveFingerprintCleanup(), i.info("API", "Manual fingerprint cleanup completed");
  } catch (r) {
    throw i.error("API", "Fingerprint cleanup failed", { error: r }), r;
  }
}, rs = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Constants: Kt,
  Types: Xt,
  aggressiveFingerprintCleanup: ns,
  attemptSystemRecovery: is,
  destroy: ts,
  event: Jt,
  getInitializationStatus: es,
  getRecoveryStats: ss,
  init: Yt,
  isInitialized: Zt
}, Symbol.toStringTag, { value: "Module" }));
export {
  rs as TraceLog
};
