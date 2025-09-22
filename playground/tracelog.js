var E = /* @__PURE__ */ ((n) => (n.Mobile = "mobile", n.Tablet = "tablet", n.Desktop = "desktop", n.Unknown = "unknown", n))(E || {});
const q = {};
class p {
  get(e) {
    return q[e];
  }
  set(e, t) {
    const s = q[e];
    q[e] = t, (e === "sessionId" || e === "config" || e === "hasStartSession") && i.debug("StateManager", "Critical state updated", {
      key: e,
      oldValue: e === "config" ? !!s : s,
      newValue: e === "config" ? !!t : t
    });
  }
}
class Re extends p {
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
    switch (this.getCurrentMode()) {
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
  logMessage(e, t, s, r) {
    if (!this.shouldShowLog(e))
      return;
    const a = this.formatMessage(t, s), o = this.getConsoleMethod(e);
    r !== void 0 ? console[o](a, r) : console[o](a);
  }
  /**
   * Dispatches tracelog:log events for E2E testing and development debugging
   */
  dispatchEvent(e, t, s, r) {
    if (!(typeof window > "u" || typeof CustomEvent > "u"))
      try {
        const a = new CustomEvent("tracelog:log", {
          detail: {
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            level: e,
            namespace: t,
            message: s,
            data: r
          }
        });
        window.dispatchEvent(a);
      } catch {
        console.log(`[TraceLog:${t}] ${s}`, r);
      }
  }
}
const i = new Re();
let J, Ee;
const ke = () => {
  typeof window < "u" && !J && (J = window.matchMedia("(pointer: coarse)"), Ee = window.matchMedia("(hover: none)"));
}, we = () => {
  try {
    i.debug("DeviceDetector", "Starting device detection");
    const n = navigator;
    if (n.userAgentData && typeof n.userAgentData.mobile == "boolean") {
      if (i.debug("DeviceDetector", "Using modern User-Agent Client Hints API", {
        mobile: n.userAgentData.mobile,
        platform: n.userAgentData.platform
      }), n.userAgentData.platform && /ipad|tablet/i.test(n.userAgentData.platform))
        return i.debug("DeviceDetector", "Device detected as tablet via platform hint"), E.Tablet;
      const d = n.userAgentData.mobile ? E.Mobile : E.Desktop;
      return i.debug("DeviceDetector", "Device detected via User-Agent hints", { result: d }), d;
    }
    i.debug("DeviceDetector", "Using fallback detection methods"), ke();
    const e = window.innerWidth, t = J?.matches ?? !1, s = Ee?.matches ?? !1, r = "ontouchstart" in window || navigator.maxTouchPoints > 0, a = navigator.userAgent.toLowerCase(), o = /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/.test(a), l = /tablet|ipad|android(?!.*mobile)/.test(a), c = {
      width: e,
      hasCoarsePointer: t,
      hasNoHover: s,
      hasTouchSupport: r,
      isMobileUA: o,
      isTabletUA: l,
      maxTouchPoints: navigator.maxTouchPoints
    };
    return e <= 767 || o && r ? (i.debug("DeviceDetector", "Device detected as mobile", c), E.Mobile) : e >= 768 && e <= 1024 || l || t && s && r ? (i.debug("DeviceDetector", "Device detected as tablet", c), E.Tablet) : (i.debug("DeviceDetector", "Device detected as desktop", c), E.Desktop);
  } catch (n) {
    return i.warn("DeviceDetector", "Device detection failed, defaulting to desktop", {
      error: n instanceof Error ? n.message : n
    }), E.Desktop;
  }
}, Ne = 2, Ue = 10, Ie = 1, ne = 500, Z = 3e4, ee = 864e5, re = 120, ae = 8 * 1024, oe = 10, ce = 10, _ = 255, M = 1e3, W = 100, le = 3, N = 2, Pe = 4, He = 0.75, De = 0.2, xe = 2e3, Oe = 1e3, Fe = 10, F = 10, R = 15 * 60 * 1e3, ze = 3e4, Te = 1e3, Me = 250, Ve = 2e3, de = 1e3, $e = 1e4, je = 2500, he = 1e3, ue = 3e4, ge = 1e3, Ge = 24, Qe = 24 * 60 * 60 * 1e3, Be = Te, qe = 5e3, We = 2e3, Xe = 2, Ke = 3, X = 24 * 60 * 60 * 1e3, K = 2 * 60 * 1e3, Ae = {
  samplingRate: Ie,
  tags: [],
  excludedUrlPaths: []
}, Ye = (n) => ({
  ...Ae,
  ...n,
  sessionTimeout: R,
  allowHttp: !1
}), z = "data-tl", fe = [
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
], Je = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"], me = {
  /** Maximum number of retries when waiting for concurrent initialization */
  MAX_CONCURRENT_RETRIES: 20,
  /** Delay between retries when waiting for concurrent initialization (ms) */
  CONCURRENT_RETRY_DELAY_MS: 50,
  /** Timeout for overall initialization process (ms) */
  INITIALIZATION_TIMEOUT_MS: 1e4
}, b = {
  /** Maximum number of consecutive failures before opening circuit */
  MAX_FAILURES: 10,
  /** Initial backoff delay when circuit opens (ms) */
  INITIAL_BACKOFF_DELAY_MS: 1e3,
  /** Maximum backoff delay (ms) */
  MAX_BACKOFF_DELAY_MS: 3e4,
  /** Backoff multiplier for exponential backoff */
  BACKOFF_MULTIPLIER: 2,
  /** Time-based recovery period for circuit breaker (ms) */
  RECOVERY_TIME_MS: 3e4
  // 30 seconds
}, pe = {
  /** Timeout for session synchronization operations (ms) */
  SYNC_TIMEOUT_MS: 2e3,
  /** Maximum retry attempts for session operations */
  MAX_RETRY_ATTEMPTS: 3
}, Ze = {
  /** Multiplier for scroll debounce time when suppressing scroll events */
  SUPPRESS_MULTIPLIER: 2
}, _e = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<embed\b[^>]*>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi
], S = "tl", ve = (n) => n ? `${S}:${n}:uid` : `${S}:uid`, et = (n) => n ? `${S}:${n}:queue` : `${S}:queue`, tt = (n) => n ? `${S}:${n}:session` : `${S}:session`, Y = (n) => n ? `${S}:${n}:cross_tab_session` : `${S}:cross_tab_session`, Se = (n, e) => `${S}:${n}:tab:${e}:info`, V = (n) => n ? `${S}:${n}:recovery` : `${S}:recovery`, st = (n) => n ? `${S}:${n}:broadcast` : `${S}:broadcast`, it = /* @__PURE__ */ new Set([
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
  INVALID_SESSION_TIMEOUT: `Session timeout must be between ${Z}ms (30 seconds) and ${ee}ms (24 hours)`,
  INVALID_ERROR_SAMPLING_RATE: "Error sampling must be between 0 and 1",
  // Integration validation
  INVALID_GOOGLE_ANALYTICS_ID: "Google Analytics measurement ID is required when integration is enabled",
  // UI validation
  INVALID_SCROLL_CONTAINER_SELECTORS: "Scroll container selectors must be valid CSS selectors",
  // Global metadata validation
  INVALID_GLOBAL_METADATA: "Global metadata must be an object",
  // Array validation
  INVALID_SENSITIVE_QUERY_PARAMS: "Sensitive query params must be an array of strings"
}, nt = () => {
  i.debug("UTMParams", "Extracting UTM parameters from URL", {
    url: window.location.href,
    search: window.location.search
  });
  const n = new URLSearchParams(window.location.search), e = {};
  Je.forEach((s) => {
    const r = n.get(s);
    if (r) {
      const a = s.split("utm_")[1];
      e[a] = r, i.debug("UTMParams", "Found UTM parameter", { param: s, key: a, value: r });
    }
  });
  const t = Object.keys(e).length ? e : void 0;
  return t ? i.debug("UTMParams", "UTM parameters extracted successfully", {
    parameterCount: Object.keys(t).length,
    parameters: Object.keys(t)
  }) : i.debug("UTMParams", "No UTM parameters found in URL"), t;
}, $ = () => {
  const n = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (e) => {
    const t = Math.random() * 16 | 0;
    return (e === "x" ? t : t & 3 | 8).toString(16);
  });
  return i.verbose("UUIDUtils", "Generated new UUID", { uuid: n }), n;
};
var C = /* @__PURE__ */ ((n) => (n.HttpSkip = "http-skip", n.HttpLocal = "http-local", n))(C || {}), h = /* @__PURE__ */ ((n) => (n.PAGE_VIEW = "page_view", n.CLICK = "click", n.SCROLL = "scroll", n.SESSION_START = "session_start", n.SESSION_END = "session_end", n.CUSTOM = "custom", n.WEB_VITALS = "web_vitals", n.ERROR = "error", n))(h || {}), j = /* @__PURE__ */ ((n) => (n.UP = "up", n.DOWN = "down", n))(j || {}), D = /* @__PURE__ */ ((n) => (n.JS_ERROR = "js_error", n.PROMISE_REJECTION = "promise_rejection", n.NETWORK_ERROR = "network_error", n))(D || {}), L = /* @__PURE__ */ ((n) => (n.QA = "qa", n.DEBUG = "debug", n))(L || {}), G = /* @__PURE__ */ ((n) => (n.AND = "AND", n.OR = "OR", n))(G || {}), m = /* @__PURE__ */ ((n) => (n.URL_MATCHES = "url_matches", n.ELEMENT_MATCHES = "element_matches", n.DEVICE_TYPE = "device_type", n.ELEMENT_TEXT = "element_text", n.ELEMENT_ATTRIBUTE = "element_attribute", n.UTM_SOURCE = "utm_source", n.UTM_MEDIUM = "utm_medium", n.UTM_CAMPAIGN = "utm_campaign", n))(m || {}), f = /* @__PURE__ */ ((n) => (n.EQUALS = "equals", n.CONTAINS = "contains", n.STARTS_WITH = "starts_with", n.ENDS_WITH = "ends_with", n.REGEX = "regex", n.GREATER_THAN = "greater_than", n.LESS_THAN = "less_than", n.EXISTS = "exists", n.NOT_EXISTS = "not_exists", n))(f || {});
class x extends Error {
  constructor(e, t, s) {
    super(e), this.errorCode = t, this.layer = s, this.name = this.constructor.name, Error.captureStackTrace && Error.captureStackTrace(this, this.constructor);
  }
}
class Q extends x {
  constructor(e = "Project ID is required", t = "config") {
    super(e, "PROJECT_ID_INVALID", t);
  }
}
class H extends x {
  constructor(e, t = "config") {
    super(e, "APP_CONFIG_INVALID", t);
  }
}
class rt extends x {
  constructor(e, t = "config") {
    super(e, "SESSION_TIMEOUT_INVALID", t);
  }
}
class at extends x {
  constructor(e, t = "config") {
    super(e, "SAMPLING_RATE_INVALID", t);
  }
}
class ye extends x {
  constructor(e, t = "config") {
    super(e, "INTEGRATION_INVALID", t);
  }
}
const ot = (n) => {
  if (!n || typeof n != "object")
    throw i.clientError("ConfigValidation", "Configuration must be an object", { config: n }), new H("Configuration must be an object", "config");
  if (!("id" in n))
    throw i.clientError("ConfigValidation", "Project ID is missing from configuration"), new Q(w.MISSING_PROJECT_ID, "config");
  if (n.id === null || n.id === void 0 || typeof n.id != "string")
    throw i.clientError("ConfigValidation", "Project ID must be a non-empty string", {
      providedId: n.id,
      type: typeof n.id
    }), new Q(w.MISSING_PROJECT_ID, "config");
  if (n.sessionTimeout !== void 0 && (typeof n.sessionTimeout != "number" || n.sessionTimeout < Z || n.sessionTimeout > ee))
    throw i.clientError("ConfigValidation", "Invalid session timeout", {
      provided: n.sessionTimeout,
      min: Z,
      max: ee
    }), new rt(w.INVALID_SESSION_TIMEOUT, "config");
  if (n.globalMetadata !== void 0 && (typeof n.globalMetadata != "object" || n.globalMetadata === null))
    throw i.clientError("ConfigValidation", "Global metadata must be an object", {
      provided: n.globalMetadata,
      type: typeof n.globalMetadata
    }), new H(w.INVALID_GLOBAL_METADATA, "config");
  if (n.scrollContainerSelectors !== void 0 && ct(n.scrollContainerSelectors), n.integrations && lt(n.integrations), n.sensitiveQueryParams !== void 0) {
    if (!Array.isArray(n.sensitiveQueryParams))
      throw i.clientError("ConfigValidation", "Sensitive query params must be an array", {
        provided: n.sensitiveQueryParams,
        type: typeof n.sensitiveQueryParams
      }), new H(w.INVALID_SENSITIVE_QUERY_PARAMS, "config");
    for (const e of n.sensitiveQueryParams)
      if (typeof e != "string")
        throw i.clientError("ConfigValidation", "All sensitive query params must be strings", {
          param: e,
          type: typeof e
        }), new H("All sensitive query params must be strings", "config");
  }
  if (n.errorSampling !== void 0 && (typeof n.errorSampling != "number" || n.errorSampling < 0 || n.errorSampling > 1))
    throw i.clientError("ConfigValidation", "Invalid error sampling rate", {
      provided: n.errorSampling,
      expected: "0-1"
    }), new at(w.INVALID_ERROR_SAMPLING_RATE, "config");
}, ct = (n) => {
  const e = Array.isArray(n) ? n : [n];
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
}, lt = (n) => {
  if (n && n.googleAnalytics) {
    if (!n.googleAnalytics.measurementId || typeof n.googleAnalytics.measurementId != "string" || n.googleAnalytics.measurementId.trim() === "")
      throw i.clientError("ConfigValidation", "Invalid Google Analytics measurement ID", {
        provided: n.googleAnalytics.measurementId,
        type: typeof n.googleAnalytics.measurementId
      }), new ye(w.INVALID_GOOGLE_ANALYTICS_ID, "config");
    const e = n.googleAnalytics.measurementId.trim();
    if (!e.match(/^(G-|UA-)/))
      throw i.clientError("ConfigValidation", 'Google Analytics measurement ID must start with "G-" or "UA-"', {
        provided: e
      }), new ye('Google Analytics measurement ID must start with "G-" or "UA-"', "config");
  }
}, dt = (n) => {
  ot(n);
  const e = {
    ...n,
    id: n.id.trim(),
    globalMetadata: n.globalMetadata ?? {},
    sensitiveQueryParams: n.sensitiveQueryParams ?? []
  };
  if (!e.id)
    throw i.clientError("ConfigValidation", "Project ID is empty after trimming whitespace", {
      originalId: n.id,
      normalizedId: e.id
    }), new Q(w.PROJECT_ID_EMPTY_AFTER_TRIM, "config");
  return e;
}, be = (n) => {
  if (!n || typeof n != "string" || n.trim().length === 0)
    return i.debug("Sanitize", "String sanitization skipped - empty or invalid input", { value: n, type: typeof n }), "";
  const e = n.length;
  let t = n;
  n.length > M && (t = n.slice(0, Math.max(0, M)), i.warn("Sanitize", "String truncated due to length limit", {
    originalLength: e,
    maxLength: M,
    truncatedLength: t.length
  }));
  let s = 0;
  for (const a of _e) {
    const o = t;
    t = t.replace(a, ""), o !== t && s++;
  }
  s > 0 && i.warn("Sanitize", "XSS patterns detected and removed", {
    patternMatches: s,
    originalValue: n.slice(0, 100)
    // Log first 100 chars for debugging
  }), t = t.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#x27;").replaceAll("/", "&#x2F;");
  const r = t.trim();
  return (e > 50 || s > 0) && i.debug("Sanitize", "String sanitization completed", {
    originalLength: e,
    sanitizedLength: r.length,
    xssPatternMatches: s,
    wasTruncated: e > M
  }), r;
}, ht = (n) => {
  if (typeof n != "string")
    return "";
  n.length > M && (n = n.slice(0, Math.max(0, M)));
  let e = n;
  for (const t of _e)
    e = e.replace(t, "");
  return e = e.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#x27;"), e.trim();
}, B = (n, e = 0) => {
  if (e > le)
    return i.warn("Sanitize", "Maximum object depth exceeded during sanitization", {
      depth: e,
      maxDepth: le
    }), null;
  if (n == null)
    return null;
  if (typeof n == "string")
    return be(n);
  if (typeof n == "number")
    return !Number.isFinite(n) || n < -Number.MAX_SAFE_INTEGER || n > Number.MAX_SAFE_INTEGER ? (i.warn("Sanitize", "Invalid number sanitized to 0", { value: n, isFinite: Number.isFinite(n) }), 0) : n;
  if (typeof n == "boolean")
    return n;
  if (Array.isArray(n)) {
    const t = n.length, s = n.slice(0, W);
    t > W && i.warn("Sanitize", "Array truncated due to length limit", {
      originalLength: t,
      maxLength: W,
      depth: e
    });
    const r = s.map((a) => B(a, e + 1)).filter((a) => a !== null);
    return t > 0 && r.length === 0 && i.warn("Sanitize", "All array items were filtered out during sanitization", { originalLength: t, depth: e }), r;
  }
  if (typeof n == "object") {
    const t = {}, s = Object.entries(n), r = s.length, a = s.slice(0, 20);
    r > 20 && i.warn("Sanitize", "Object keys truncated due to limit", {
      originalKeys: r,
      maxKeys: 20,
      depth: e
    });
    let o = 0;
    for (const [l, c] of a) {
      const d = be(l);
      if (d) {
        const u = B(c, e + 1);
        u !== null ? t[d] = u : o++;
      } else
        o++;
    }
    return o > 0 && i.debug("Sanitize", "Object properties filtered during sanitization", {
      filteredKeysCount: o,
      remainingKeys: Object.keys(t).length,
      depth: e
    }), t;
  }
  return i.debug("Sanitize", "Unknown value type sanitized to null", { type: typeof n, depth: e }), null;
}, ut = (n) => {
  i.debug("Sanitize", "Starting API config sanitization");
  const e = {};
  if (typeof n != "object" || n === null)
    return i.warn("Sanitize", "API config data is not an object", { data: n, type: typeof n }), e;
  try {
    const t = Object.keys(n);
    let s = 0, r = 0;
    for (const a of t)
      if (it.has(a)) {
        const o = n[a];
        if (a === "excludedUrlPaths") {
          const l = Array.isArray(o) ? o : typeof o == "string" ? [o] : [], c = l.length;
          e.excludedUrlPaths = l.map((u) => ht(String(u))).filter(Boolean);
          const d = c - e.excludedUrlPaths.length;
          d > 0 && i.warn("Sanitize", "Some excluded URL paths were filtered during sanitization", {
            originalCount: c,
            filteredCount: d
          });
        } else if (a === "tags")
          Array.isArray(o) ? (e.tags = o, i.debug("Sanitize", "Tags processed", { count: o.length })) : i.warn("Sanitize", "Tags value is not an array", { value: o, type: typeof o });
        else {
          const l = B(o);
          l !== null ? e[a] = l : i.warn("Sanitize", "API config value sanitized to null", { key: a, originalValue: o });
        }
        s++;
      } else
        r++, i.debug("Sanitize", "API config key not allowed", { key: a });
    i.info("Sanitize", "API config sanitization completed", {
      originalKeys: t.length,
      processedKeys: s,
      filteredKeys: r,
      finalKeys: Object.keys(e).length
    });
  } catch (t) {
    throw i.error("Sanitize", "API config sanitization failed", {
      error: t instanceof Error ? t.message : t
    }), new Error(`API config sanitization failed: ${t instanceof Error ? t.message : "Unknown error"}`);
  }
  return e;
}, gt = (n) => {
  if (i.debug("Sanitize", "Starting metadata sanitization", { hasMetadata: n != null }), typeof n != "object" || n === null)
    return i.debug("Sanitize", "Metadata is not an object, returning empty object", {
      metadata: n,
      type: typeof n
    }), {};
  try {
    const e = Object.keys(n).length, t = B(n), s = typeof t == "object" && t !== null ? t : {}, r = Object.keys(s).length;
    return i.debug("Sanitize", "Metadata sanitization completed", {
      originalKeys: e,
      finalKeys: r,
      keysFiltered: e - r
    }), s;
  } catch (e) {
    throw i.error("Sanitize", "Metadata sanitization failed", {
      error: e instanceof Error ? e.message : e
    }), new Error(`Metadata sanitization failed: ${e instanceof Error ? e.message : "Unknown error"}`);
  }
}, ft = (n) => {
  if (typeof n != "object" || n === null)
    return !1;
  for (const e of Object.values(n)) {
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
}, mt = (n) => typeof n != "string" ? {
  valid: !1,
  error: "Event name must be a string"
} : n.length === 0 ? {
  valid: !1,
  error: "Event name cannot be empty"
} : n.length > re ? {
  valid: !1,
  error: `Event name is too long (max ${re} characters)`
} : n.includes("<") || n.includes(">") || n.includes("&") ? {
  valid: !1,
  error: "Event name contains invalid characters"
} : ["constructor", "prototype", "__proto__", "eval", "function", "var", "let", "const"].includes(n.toLowerCase()) ? {
  valid: !1,
  error: "Event name cannot be a reserved word"
} : { valid: !0 }, pt = (n, e, t) => {
  const s = gt(e), r = `${t} "${n}" metadata error`;
  if (!ft(s))
    return {
      valid: !1,
      error: `${r}: object has invalid types. Valid types are string, number, boolean or string arrays.`
    };
  let a;
  try {
    a = JSON.stringify(s);
  } catch {
    return {
      valid: !1,
      error: `${r}: object contains circular references or cannot be serialized.`
    };
  }
  if (a.length > ae)
    return {
      valid: !1,
      error: `${r}: object is too large (max ${ae / 1024} KB).`
    };
  if (Object.keys(s).length > oe)
    return {
      valid: !1,
      error: `${r}: object has too many keys (max ${oe} keys).`
    };
  for (const [l, c] of Object.entries(s)) {
    if (Array.isArray(c)) {
      if (c.length > ce)
        return {
          valid: !1,
          error: `${r}: array property "${l}" is too large (max ${ce} items).`
        };
      for (const d of c)
        if (typeof d == "string" && d.length > 500)
          return {
            valid: !1,
            error: `${r}: array property "${l}" contains strings that are too long (max 500 characters).`
          };
    }
    if (typeof c == "string" && c.length > M)
      return {
        valid: !1,
        error: `${r}: property "${l}" is too long (max ${M} characters).`
      };
  }
  return {
    valid: !0,
    sanitizedMetadata: s
  };
}, vt = (n, e) => {
  const t = mt(n);
  if (!t.valid)
    return i.clientError("EventValidation", "Event name validation failed", { eventName: n, error: t.error }), t;
  if (!e)
    return { valid: !0 };
  const s = pt(n, e, "customEvent");
  return s.valid || i.clientError("EventValidation", "Event metadata validation failed", {
    eventName: n,
    error: s.error
  }), s;
}, te = (n, e = !1) => {
  try {
    const t = new URL(n), s = t.protocol === "https:", r = t.protocol === "http:";
    return s || e && r;
  } catch {
    return !1;
  }
}, St = (n, e = !1) => {
  i.debug("URLUtils", "Generating API URL", { projectId: n, allowHttp: e });
  const t = new URL(window.location.href), s = t.hostname, r = s.split(".");
  if (r.length === 0)
    throw i.clientError("URLUtils", "Invalid hostname - no domain parts found", { hostname: s }), new Error("Invalid URL");
  const a = r.slice(-2).join("."), o = e && t.protocol === "http:" ? "http" : "https", l = `${o}://${n}.${a}`;
  if (i.debug("URLUtils", "Generated API URL", {
    originalUrl: window.location.href,
    hostname: s,
    domainParts: r.length,
    cleanDomain: a,
    protocol: o,
    generatedUrl: l
  }), !te(l, e))
    throw i.clientError("URLUtils", "Generated API URL failed validation", {
      apiUrl: l,
      allowHttp: e
    }), new Error("Invalid URL");
  return i.debug("URLUtils", "API URL generation completed successfully", { apiUrl: l }), l;
}, se = (n, e = []) => {
  i.debug("URLUtils", "Normalizing URL", {
    urlLength: n.length,
    sensitiveParamsCount: e.length
  });
  try {
    const t = new URL(n), s = t.searchParams, r = Array.from(s.keys()).length;
    let a = !1;
    const o = [];
    if (e.forEach((c) => {
      s.has(c) && (s.delete(c), a = !0, o.push(c));
    }), a && i.debug("URLUtils", "Sensitive parameters removed from URL", {
      removedParams: o,
      originalParamCount: r,
      finalParamCount: Array.from(s.keys()).length
    }), !a && n.includes("?"))
      return i.debug("URLUtils", "URL normalization - no changes needed"), n;
    t.search = s.toString();
    const l = t.toString();
    return i.debug("URLUtils", "URL normalization completed", {
      hasChanged: a,
      originalLength: n.length,
      normalizedLength: l.length
    }), l;
  } catch (t) {
    return i.warn("URLUtils", "URL normalization failed, returning original", {
      url: n.slice(0, 100),
      error: t instanceof Error ? t.message : t
    }), n;
  }
}, yt = (n, e = []) => {
  if (i.debug("URLUtils", "Checking if URL path is excluded", {
    urlLength: n.length,
    excludedPathsCount: e.length
  }), e.length === 0)
    return i.debug("URLUtils", "No excluded paths configured"), !1;
  let t;
  try {
    t = new URL(n, window.location.origin).pathname, i.debug("URLUtils", "Extracted path from URL", { path: t });
  } catch (c) {
    return i.warn("URLUtils", "Failed to parse URL for path exclusion check", {
      url: n.slice(0, 100),
      error: c instanceof Error ? c.message : c
    }), !1;
  }
  const s = (c) => typeof c == "object" && c !== void 0 && typeof c.test == "function", r = (c) => c.replaceAll(/[$()*+.?[\\\]^{|}]/g, "\\$&"), a = (c) => new RegExp(
    "^" + c.split("*").map((d) => r(d)).join(".+") + "$"
  ), o = e.find((c) => {
    try {
      if (s(c)) {
        const u = c.test(t);
        return u && i.debug("URLUtils", "Path matched regex pattern", { path: t, pattern: c.toString() }), u;
      }
      if (c.includes("*")) {
        const u = a(c), g = u.test(t);
        return g && i.debug("URLUtils", "Path matched wildcard pattern", { path: t, pattern: c, regex: u.toString() }), g;
      }
      const d = c === t;
      return d && i.debug("URLUtils", "Path matched exact pattern", { path: t, pattern: c }), d;
    } catch (d) {
      return i.warn("URLUtils", "Error testing exclusion pattern", {
        pattern: c,
        path: t,
        error: d instanceof Error ? d.message : d
      }), !1;
    }
  }), l = !!o;
  return i.debug("URLUtils", "URL path exclusion check completed", {
    path: t,
    isExcluded: l,
    matchedPattern: o ?? null,
    totalPatternsChecked: e.length
  }), l;
};
class bt {
  getUrl(e, t = !1) {
    const s = St(e, t);
    if (!te(s, t))
      throw new Error("Invalid URL");
    return s;
  }
}
class Et {
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
      const r = s ? `${window.location.origin}/config` : this.getUrl(e);
      if (!r)
        throw new Error("Config URL is not valid or not allowed");
      const a = await fetch(r, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });
      if (!a.ok) {
        const A = `HTTP ${a.status}: ${a.statusText}`;
        throw i.error("ConfigManager", "Config API request failed", {
          status: a.status,
          statusText: a.statusText,
          configUrl: r
        }), new Error(A);
      }
      const o = await a.json();
      if (o == null || typeof o != "object" || Array.isArray(o))
        throw i.error("ConfigManager", "Invalid config API response format", {
          responseType: typeof o,
          isArray: Array.isArray(o)
        }), new Error("Invalid config API response: expected object");
      const l = ut(o), d = { ...{ ...Ae, ...l }, ...t };
      new URLSearchParams(window.location.search).get("qaMode") === "true" && !d.mode && (d.mode = L.QA, i.info("ConfigManager", "QA mode enabled via URL parameter"));
      const y = Object.values(L).includes(d.mode) ? 1 : d.errorSampling ?? 0.1;
      return { ...d, errorSampling: y };
    } catch (r) {
      const a = r instanceof Error ? r.message : "Unknown error";
      throw i.error("ConfigManager", "Failed to load config", { error: a, apiUrl: e }), new Error(`Failed to load config: ${a}`);
    }
  }
  getUrl(e) {
    const s = new URLSearchParams(window.location.search).get("qaMode") === "true";
    let r = `${e}/config`;
    if (s && (r += "?qaMode=true"), !te(r))
      throw i.clientError("ConfigManager", "Invalid config URL provided", { configUrl: r }), new Error("Config URL is not valid or not allowed");
    return r;
  }
  getDefaultConfig(e) {
    return Ye({
      ...e,
      errorSampling: 1,
      ...Object.values(C).includes(e.id) && { mode: L.DEBUG }
    });
  }
}
class wt extends p {
  storeManager;
  queueStorageKey;
  retryDelay = he;
  retryTimeoutId = null;
  lastAsyncSend = 0;
  lastSyncSend = 0;
  constructor(e) {
    super(), this.storeManager = e, this.queueStorageKey = `${et(this.get("config")?.id)}:${this.get("userId")}`, this.recoverPersistedEvents();
  }
  async sendEventsQueueAsync(e) {
    return this.executeSend(e, () => this.sendQueueAsync(e));
  }
  sendEventsQueueSync(e) {
    return this.executeSendSync(e, () => this.sendQueueSync(e));
  }
  sendEventsQueue(e) {
    return this.executeSendSync(e, () => this.sendQueue(e));
  }
  recoverPersistedEvents() {
    try {
      const e = this.getPersistedData();
      if (!e || !this.isDataRecent(e) || e.events.length === 0) {
        this.clearPersistedEvents();
        return;
      }
      const t = this.createRecoveryBody(e);
      this.sendRecoveredEvents(t) ? (i.info("SenderManager", "Persisted events recovered successfully", {
        eventsCount: e.events.length,
        sessionId: e.sessionId
      }), this.clearPersistedEvents()) : (i.warn("SenderManager", "Failed to recover persisted events, scheduling retry", {
        eventsCount: e.events.length
      }), this.scheduleRetryForRecoveredEvents(t));
    } catch (e) {
      i.error("SenderManager", "Failed to recover persisted events", { error: e });
    }
  }
  stop() {
    this.clearRetryTimeout(), this.resetRetryState();
  }
  /**
   * Sends recovered events without re-deduplication since they were already processed
   */
  sendRecoveredEvents(e) {
    return this.executeSendSync(e, () => this.sendQueue(e));
  }
  /**
   * Schedules retry for recovered events using the specific recovery method
   */
  scheduleRetryForRecoveredEvents(e) {
    this.retryTimeoutId === null && (this.retryTimeoutId = window.setTimeout(() => {
      this.retryTimeoutId = null, this.sendRecoveredEvents(e);
    }, this.retryDelay), this.retryDelay = Math.min(this.retryDelay * 2, ue));
  }
  canSendAsync() {
    return Date.now() - this.lastAsyncSend >= ge;
  }
  canSendSync() {
    return Date.now() - this.lastSyncSend >= ge;
  }
  async sendQueueAsync(e) {
    const { url: t, payload: s } = this.prepareRequest(e);
    try {
      return (await fetch(t, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: s
      })).ok;
    } catch (r) {
      return i.error("SenderManager", "Failed to send events async", { error: r }), !1;
    }
  }
  sendQueueSync(e) {
    const { url: t, payload: s } = this.prepareRequest(e);
    return this.isSendBeaconAvailable() && navigator.sendBeacon(t, s) ? !0 : this.sendSyncXHR(t, s);
  }
  sendQueue(e) {
    if (!this.isSendBeaconAvailable())
      return !1;
    const { url: t, payload: s } = this.prepareRequest(e);
    return navigator.sendBeacon(t, s);
  }
  sendSyncXHR(e, t) {
    try {
      const s = new XMLHttpRequest();
      return s.open("POST", e, !1), s.setRequestHeader("Content-Type", "application/json"), s.timeout = xe, s.send(t), s.status >= 200 && s.status < 300;
    } catch (s) {
      return i.error("SenderManager", "Sync XHR failed", { error: s }), !1;
    }
  }
  prepareRequest(e) {
    return {
      url: `${this.get("config").id === C.HttpLocal ? window.location.origin : this.get("apiUrl")}/collect`,
      payload: JSON.stringify(e)
    };
  }
  getPersistedData() {
    const e = this.storeManager.getItem(this.queueStorageKey);
    return e ? JSON.parse(e) : null;
  }
  isDataRecent(e) {
    return (Date.now() - e.timestamp) / 36e5 < Ge;
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
  handleSendFailure(e) {
    this.persistFailedEvents(e), this.scheduleRetry(e);
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
      };
      this.storeManager.setItem(this.queueStorageKey, JSON.stringify(t));
    } catch (t) {
      i.error("SenderManager", "Failed to persist events", { error: t });
    }
  }
  clearPersistedEvents() {
    this.storeManager.removeItem(this.queueStorageKey);
  }
  resetRetryState() {
    this.retryDelay = he, this.clearRetryTimeout();
  }
  scheduleRetry(e) {
    this.retryTimeoutId === null && (this.retryTimeoutId = window.setTimeout(() => {
      this.retryTimeoutId = null, this.sendEventsQueue(e);
    }, this.retryDelay), this.retryDelay = Math.min(this.retryDelay * 2, ue));
  }
  async executeSend(e, t) {
    if (this.shouldSkipSend())
      return this.logQueue(e), !0;
    if (!this.canSendAsync())
      return i.info("SenderManager", "⏱️ Rate limited - skipping async send", {
        eventsCount: e.events.length,
        timeSinceLastSend: Date.now() - this.lastAsyncSend
      }), !1;
    i.info("SenderManager", "🌐 Sending events to server (async)", {
      eventsCount: e.events.length,
      sessionId: e.session_id,
      userId: e.user_id
    }), this.lastAsyncSend = Date.now();
    try {
      const s = await t();
      return s ? (i.info("SenderManager", "✅ Successfully sent events to server", {
        eventsCount: e.events.length,
        method: "async"
      }), this.resetRetryState(), this.clearPersistedEvents()) : (i.warn("SenderManager", "Failed to send events", {
        eventsCount: e.events.length,
        method: "async"
      }), this.handleSendFailure(e)), s;
    } catch {
      return this.handleSendFailure(e), !1;
    }
  }
  executeSendSync(e, t) {
    if (this.shouldSkipSend())
      return this.logQueue(e), !0;
    if (!this.canSendSync())
      return i.info("SenderManager", "⏱️ Rate limited - skipping sync send", {
        eventsCount: e.events.length,
        timeSinceLastSend: Date.now() - this.lastSyncSend
      }), !1;
    i.info("SenderManager", "🌐 Sending events to server (sync)", {
      eventsCount: e.events.length,
      sessionId: e.session_id,
      userId: e.user_id,
      method: "sendBeacon/XHR"
    }), this.lastSyncSend = Date.now();
    try {
      const s = t();
      return s ? (i.info("SenderManager", "✅ Successfully sent events to server", {
        eventsCount: e.events.length,
        method: "sync"
      }), this.resetRetryState(), this.clearPersistedEvents()) : (i.warn("SenderManager", "Failed to send events", {
        eventsCount: e.events.length,
        method: "sync"
      }), this.handleSendFailure(e)), s;
    } catch {
      return i.info("SenderManager", "💥 Exception during event sending", {
        eventsCount: e.events.length,
        method: "sync"
      }), this.handleSendFailure(e), !1;
    }
  }
  shouldSkipSend() {
    const { id: e, mode: t } = this.get("config"), s = [L.QA, L.DEBUG];
    return e === C.HttpSkip ? !0 : !!t && s.includes(t) && e !== C.HttpLocal;
  }
  isSendBeaconAvailable() {
    return typeof navigator.sendBeacon == "function";
  }
  clearRetryTimeout() {
    this.retryTimeoutId !== null && (clearTimeout(this.retryTimeoutId), this.retryTimeoutId = null);
  }
}
class It extends p {
  shouldSampleEvent(e, t) {
    return this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug" ? !0 : e === h.WEB_VITALS ? this.isWebVitalEventSampledIn(t?.type) : this.isSampledIn();
  }
  isSampledIn() {
    const e = this.get("config").samplingRate ?? Ie;
    return e >= 1 ? !0 : e <= 0 ? !1 : this.getHash(this.get("userId")) % 100 / 100 < e;
  }
  isWebVitalEventSampledIn(e) {
    const t = e === "LONG_TASK", s = t ? De : He;
    if (s >= 1) return !0;
    if (s <= 0) return !1;
    const r = `${this.get("userId")}|${t ? "long_task" : "web_vitals"}`;
    return this.getHash(r) % 100 / 100 < s;
  }
  getHash(e) {
    let t = 0;
    for (let s = 0; s < e.length; s++) {
      const r = e.charCodeAt(s);
      t = (t << 5) - t + r, t |= 0;
    }
    return Math.abs(t);
  }
}
class Tt extends p {
  getEventTagsIds(e, t) {
    switch (e.type) {
      case h.PAGE_VIEW:
        return this.checkEventTypePageView(e, t);
      case h.CLICK:
        return this.checkEventTypeClick(e, t);
      default:
        return [];
    }
  }
  checkEventTypePageView(e, t) {
    const s = this.get("config")?.tags?.filter((a) => a.triggerType === h.PAGE_VIEW) ?? [];
    if (s.length === 0)
      return [];
    const r = [];
    for (const a of s) {
      const { id: o, logicalOperator: l, conditions: c } = a, d = [];
      for (const g of c)
        switch (g.type) {
          case m.URL_MATCHES: {
            d.push(this.matchUrlMatches(g, e.page_url));
            break;
          }
          case m.DEVICE_TYPE: {
            d.push(this.matchDeviceType(g, t));
            break;
          }
          case m.UTM_SOURCE: {
            d.push(this.matchUtmCondition(g, e.utm?.source));
            break;
          }
          case m.UTM_MEDIUM: {
            d.push(this.matchUtmCondition(g, e.utm?.medium));
            break;
          }
          case m.UTM_CAMPAIGN: {
            d.push(this.matchUtmCondition(g, e.utm?.campaign));
            break;
          }
        }
      let u = !1;
      u = l === G.AND ? d.every(Boolean) : d.some(Boolean), u && r.push(o);
    }
    return r;
  }
  checkEventTypeClick(e, t) {
    const s = this.get("config")?.tags?.filter((a) => a.triggerType === h.CLICK) ?? [];
    if (s.length === 0)
      return [];
    const r = [];
    for (const a of s) {
      const { id: o, logicalOperator: l, conditions: c } = a, d = [];
      for (const g of c) {
        if (!e.click_data) {
          d.push(!1);
          continue;
        }
        const y = e.click_data;
        switch (g.type) {
          case m.ELEMENT_MATCHES: {
            d.push(this.matchElementSelector(g, y));
            break;
          }
          case m.DEVICE_TYPE: {
            d.push(this.matchDeviceType(g, t));
            break;
          }
          case m.URL_MATCHES: {
            d.push(this.matchUrlMatches(g, e.page_url));
            break;
          }
          case m.UTM_SOURCE: {
            d.push(this.matchUtmCondition(g, e.utm?.source));
            break;
          }
          case m.UTM_MEDIUM: {
            d.push(this.matchUtmCondition(g, e.utm?.medium));
            break;
          }
          case m.UTM_CAMPAIGN: {
            d.push(this.matchUtmCondition(g, e.utm?.campaign));
            break;
          }
        }
      }
      let u = !1;
      u = l === G.AND ? d.every(Boolean) : d.some(Boolean), u && r.push(o);
    }
    return r;
  }
  matchUrlMatches(e, t) {
    if (e.type !== m.URL_MATCHES)
      return !1;
    const s = e.value.toLowerCase(), r = t.toLowerCase();
    switch (e.operator) {
      case f.EQUALS:
        return r === s;
      case f.CONTAINS:
        return r.includes(s);
      case f.STARTS_WITH:
        return r.startsWith(s);
      case f.ENDS_WITH:
        return r.endsWith(s);
      case f.REGEX:
        try {
          return new RegExp(s, "gi").test(r);
        } catch {
          return !1;
        }
      default:
        return !1;
    }
  }
  matchDeviceType(e, t) {
    if (e.type !== m.DEVICE_TYPE)
      return !1;
    const s = e.value.toLowerCase(), r = t.toLowerCase();
    switch (e.operator) {
      case f.EQUALS:
        return r === s;
      case f.CONTAINS:
        return r.includes(s);
      case f.STARTS_WITH:
        return r.startsWith(s);
      case f.ENDS_WITH:
        return r.endsWith(s);
      case f.REGEX:
        try {
          return new RegExp(s, "gi").test(r);
        } catch {
          return !1;
        }
      default:
        return !1;
    }
  }
  matchElementSelector(e, t) {
    if (e.type !== m.ELEMENT_MATCHES)
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
    ].join(" "), r = e.value.toLowerCase(), a = s.toLowerCase();
    switch (e.operator) {
      case f.EQUALS:
        return this.checkElementFieldEquals(t, r);
      case f.CONTAINS:
        return a.includes(r);
      case f.STARTS_WITH:
        return a.startsWith(r);
      case f.ENDS_WITH:
        return a.endsWith(r);
      case f.REGEX:
        try {
          return new RegExp(r, "gi").test(a);
        } catch {
          return !1;
        }
      default:
        return !1;
    }
  }
  matchUtmCondition(e, t) {
    if (![m.UTM_SOURCE, m.UTM_MEDIUM, m.UTM_CAMPAIGN].includes(
      e.type
    ))
      return !1;
    const s = t ?? "", r = e.value.toLowerCase(), a = s.toLowerCase();
    switch (e.operator) {
      case f.EQUALS:
        return a === r;
      case f.CONTAINS:
        return a.includes(r);
      case f.STARTS_WITH:
        return a.startsWith(r);
      case f.ENDS_WITH:
        return a.endsWith(r);
      case f.REGEX:
        try {
          return new RegExp(r, "gi").test(a);
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
    for (const r of s)
      if (r) {
        const a = r.toLowerCase(), o = t.toLowerCase();
        if (a === o)
          return !0;
      }
    if (e.dataAttributes)
      for (const r of Object.values(e.dataAttributes)) {
        const a = r.toLowerCase(), o = t.toLowerCase();
        if (a === o)
          return !0;
      }
    return !1;
  }
}
class Mt extends p {
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
  MAX_FAILURES = b.MAX_FAILURES;
  circuitOpen = !1;
  circuitOpenTime = 0;
  backoffDelay = b.INITIAL_BACKOFF_DELAY_MS;
  circuitResetTimeoutId = null;
  // Event deduplication properties
  eventFingerprints = /* @__PURE__ */ new Map();
  // Persistence storage key
  PERSISTENCE_KEY = "tl:circuit_breaker_events";
  constructor(e, t = null) {
    super(), this.storageManager = e, this.googleAnalytics = t, this.samplingManager = new It(), this.tagsManager = new Tt(), this.dataSender = new wt(e), this.restoreEventsFromStorage(), i.debug("EventManager", "EventManager initialized", {
      hasGoogleAnalytics: !!t,
      restoredEventsCount: this.eventsQueue.length
    });
  }
  track({
    type: e,
    page_url: t,
    from_page_url: s,
    scroll_data: r,
    click_data: a,
    custom_event: o,
    web_vitals: l,
    session_end_reason: c,
    session_start_recovered: d
  }) {
    if (i.info("EventManager", `📥 Event captured: ${e}`, {
      type: e,
      page_url: t,
      hasCustomEvent: !!o,
      hasClickData: !!a,
      hasScrollData: !!r,
      hasWebVitals: !!l
    }), !this.samplingManager.shouldSampleEvent(e, l)) {
      i.debug("EventManager", "Event filtered by sampling", { type: e, samplingActive: !0 });
      return;
    }
    if (this.isDuplicatedEvent({
      type: e,
      page_url: t,
      scroll_data: r,
      click_data: a,
      custom_event: o,
      web_vitals: l,
      session_end_reason: c,
      session_start_recovered: d
    })) {
      const k = Date.now();
      if (this.eventsQueue && this.eventsQueue.length > 0) {
        const P = this.eventsQueue.at(-1);
        P && (P.timestamp = k);
      }
      this.lastEvent && (this.lastEvent.timestamp = k), i.debug("EventManager", "Duplicate event detected, timestamp updated", {
        type: e,
        queueLength: this.eventsQueue.length
      });
      return;
    }
    const g = t || this.get("pageUrl"), y = yt(g, this.get("config").excludedUrlPaths), I = this.get("hasStartSession"), A = e == h.SESSION_END;
    if (y && (!A || A && !I)) {
      (this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug") && i.debug("EventManager", `Event ${e} on excluded route: ${t}`);
      return;
    }
    const U = e === h.SESSION_START;
    U && this.set("hasStartSession", !0);
    const ie = U ? nt() : void 0, O = {
      type: e,
      page_url: y ? "excluded" : g,
      timestamp: Date.now(),
      ...U && { referrer: document.referrer || "Direct" },
      ...s && !y ? { from_page_url: s } : {},
      ...r && { scroll_data: r },
      ...a && { click_data: a },
      ...o && { custom_event: o },
      ...ie && { utm: ie },
      ...l && { web_vitals: l },
      ...c && { session_end_reason: c },
      ...d && { session_start_recovered: d }
    };
    if (this.get("config")?.tags?.length) {
      const k = this.tagsManager.getEventTagsIds(O, this.get("device"));
      k?.length && (O.tags = this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug" ? k.map((P) => ({
        id: P,
        key: this.get("config")?.tags?.find((Le) => Le.id === P)?.key ?? ""
      })) : k);
    }
    this.lastEvent = O, this.processAndSend(O);
  }
  stop() {
    this.eventsQueueIntervalId && (clearInterval(this.eventsQueueIntervalId), this.eventsQueueIntervalId = null, this.intervalActive = !1), this.circuitResetTimeoutId && (clearTimeout(this.circuitResetTimeoutId), this.circuitResetTimeoutId = null), this.eventsQueue.length > 0 && this.persistEventsToStorage(), this.eventFingerprints.clear(), this.circuitOpen = !1, this.circuitOpenTime = 0, this.failureCount = 0, this.backoffDelay = b.INITIAL_BACKOFF_DELAY_MS, this.lastEvent = null, this.dataSender.stop();
  }
  processAndSend(e) {
    if (i.info("EventManager", `🔄 Event processed and queued: ${e.type}`, {
      type: e.type,
      timestamp: e.timestamp,
      page_url: e.page_url,
      queueLengthBefore: this.eventsQueue.length
    }), this.get("config").ipExcluded) {
      i.info("EventManager", "❌ Event blocked: IP excluded");
      return;
    }
    if (this.eventsQueue.push(e), this.eventsQueue.length > ne) {
      const t = this.eventsQueue.shift();
      i.warn("EventManager", "Event queue overflow, oldest event removed", {
        maxLength: ne,
        currentLength: this.eventsQueue.length,
        removedEventType: t?.type
      });
    }
    if (this.eventsQueueIntervalId || (this.initEventsQueueInterval(), i.info("EventManager", "⏰ Event sender initialized - queue will be sent periodically", {
      queueLength: this.eventsQueue.length
    })), this.googleAnalytics && e.type === h.CUSTOM) {
      const t = e.custom_event;
      this.trackGoogleAnalyticsEvent(t);
    }
  }
  trackGoogleAnalyticsEvent(e) {
    this.get("config").mode === "qa" || this.get("config").mode === "debug" ? i.debug("EventManager", `Google Analytics event: ${JSON.stringify(e)}`) : this.googleAnalytics && this.googleAnalytics.trackEvent(e.name, e.metadata ?? {});
  }
  initEventsQueueInterval() {
    if (this.eventsQueueIntervalId || this.intervalActive)
      return;
    const e = this.get("config")?.id === "test" ? je : $e;
    this.eventsQueueIntervalId = window.setInterval(() => {
      this.eventsQueue.length > 0 && this.sendEventsQueue();
    }, e), this.intervalActive = !0;
  }
  async flushImmediately() {
    if (this.eventsQueue.length === 0)
      return !0;
    const e = this.buildEventsPayload(), t = await this.dataSender.sendEventsQueueAsync(e);
    return t && (this.eventsQueue = [], this.clearQueueInterval()), t;
  }
  flushImmediatelySync() {
    if (this.eventsQueue.length === 0)
      return !0;
    const e = this.buildEventsPayload(), t = this.dataSender.sendEventsQueueSync(e);
    return t && (this.eventsQueue = [], this.clearQueueInterval()), t;
  }
  getQueueLength() {
    return this.eventsQueue.length;
  }
  sendEventsQueue() {
    if (this.eventsQueue.length === 0)
      return;
    if (i.info("EventManager", "📤 Preparing to send event queue", {
      queueLength: this.eventsQueue.length,
      hasSessionId: !!this.get("sessionId"),
      circuitOpen: this.circuitOpen
    }), this.circuitOpen) {
      const s = Date.now() - this.circuitOpenTime;
      if (s >= b.RECOVERY_TIME_MS)
        this.resetCircuitBreaker(), i.info("EventManager", "Circuit breaker reset after timeout", {
          timeSinceOpen: s,
          recoveryTime: b.RECOVERY_TIME_MS
        });
      else {
        i.debug("EventManager", "Circuit breaker is open - skipping event sending", {
          queueLength: this.eventsQueue.length,
          failureCount: this.failureCount,
          timeSinceOpen: s,
          recoveryTime: b.RECOVERY_TIME_MS
        });
        return;
      }
    }
    if (!this.get("sessionId")) {
      i.info("EventManager", `⏳ Queue waiting: ${this.eventsQueue.length} events waiting for active session`);
      return;
    }
    const e = this.buildEventsPayload();
    this.dataSender.sendEventsQueue(e) ? (i.info("EventManager", "✅ Event queue sent successfully", {
      eventsCount: e.events.length,
      sessionId: e.session_id,
      uniqueEventsAfterDedup: e.events.length
    }), this.eventsQueue = [], this.failureCount = 0, this.backoffDelay = b.INITIAL_BACKOFF_DELAY_MS, this.clearPersistedEvents()) : (i.info("EventManager", "❌ Failed to send event queue", {
      eventsCount: e.events.length,
      failureCount: this.failureCount + 1,
      willOpenCircuit: this.failureCount + 1 >= this.MAX_FAILURES
    }), this.persistEventsToStorage(), this.eventsQueue = [], this.failureCount++, this.failureCount >= this.MAX_FAILURES && this.openCircuitBreaker());
  }
  buildEventsPayload() {
    const e = /* @__PURE__ */ new Map();
    for (const s of this.eventsQueue) {
      let r = `${s.type}_${s.page_url}`;
      s.click_data && (r += `_${s.click_data.x}_${s.click_data.y}`), s.scroll_data && (r += `_${s.scroll_data.depth}_${s.scroll_data.direction}`), s.custom_event && (r += `_${s.custom_event.name}`), s.web_vitals && (r += `_${s.web_vitals.type}`), e.has(r) || e.set(r, s);
    }
    const t = [...e.values()];
    return t.sort((s, r) => s.timestamp - r.timestamp), {
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
      const s = Math.round((e.click_data.x || 0) / F) * F, r = Math.round((e.click_data.y || 0) / F) * F;
      return `${t}_${s}_${r}_${e.click_data.tag}_${e.click_data.id}`;
    }
    return e.scroll_data ? `${t}_${e.scroll_data.depth}_${e.scroll_data.direction}` : e.custom_event ? `${t}_${e.custom_event.name}` : e.web_vitals ? `${t}_${e.web_vitals.type}` : e.session_end_reason ? `${t}_${e.session_end_reason}` : e.session_start_recovered !== void 0 ? `${t}_${e.session_start_recovered}` : t;
  }
  isDuplicatedEvent(e) {
    const t = this.getEventFingerprint(e), s = this.eventFingerprints.get(t) ?? 0, r = Date.now();
    return r - s < de ? !0 : (this.eventFingerprints.set(t, r), this.cleanupOldFingerprints(), !1);
  }
  /**
   * Cleans up old fingerprints to prevent memory leaks
   */
  cleanupOldFingerprints() {
    if (this.eventFingerprints.size <= Oe)
      return;
    const e = Date.now(), t = de * Fe, s = [];
    for (const [r, a] of this.eventFingerprints)
      e - a > t && s.push(r);
    for (const r of s)
      this.eventFingerprints.delete(r);
    i.debug("EventManager", "Cleaned up old event fingerprints", {
      totalFingerprints: this.eventFingerprints.size + s.length,
      cleanedCount: s.length,
      remainingCount: this.eventFingerprints.size,
      cleanupThreshold: t
    });
  }
  /**
   * Opens the circuit breaker with time-based recovery and event persistence
   */
  openCircuitBreaker() {
    this.circuitOpen = !0, this.circuitOpenTime = Date.now(), this.persistEventsToStorage();
    const e = this.eventsQueue.length;
    this.eventsQueue = [], i.warn("EventManager", "Circuit breaker opened with time-based recovery", {
      maxFailures: this.MAX_FAILURES,
      persistedEvents: e,
      failureCount: this.failureCount,
      recoveryTime: b.RECOVERY_TIME_MS,
      openTime: this.circuitOpenTime
    }), this.backoffDelay = Math.min(
      this.backoffDelay * b.BACKOFF_MULTIPLIER,
      b.MAX_BACKOFF_DELAY_MS
    );
  }
  /**
   * Resets the circuit breaker and attempts to restore persisted events
   */
  resetCircuitBreaker() {
    this.circuitOpen = !1, this.circuitOpenTime = 0, this.failureCount = 0, this.circuitResetTimeoutId = null, i.info("EventManager", "Circuit breaker reset - attempting to restore events", {
      currentQueueLength: this.eventsQueue.length
    }), this.restoreEventsFromStorage(), i.info("EventManager", "Circuit breaker reset completed", {
      restoredQueueLength: this.eventsQueue.length,
      backoffDelay: this.backoffDelay
    });
  }
  /**
   * Persists current events queue to localStorage for recovery
   */
  persistEventsToStorage() {
    try {
      if (this.eventsQueue.length === 0)
        return;
      const e = {
        events: this.eventsQueue,
        timestamp: Date.now(),
        failureCount: this.failureCount
      };
      this.storageManager.setItem(this.PERSISTENCE_KEY, JSON.stringify(e)), i.debug("EventManager", "Events persisted to storage for recovery", {
        eventsCount: this.eventsQueue.length,
        failureCount: this.failureCount
      });
    } catch (e) {
      i.warn("EventManager", "Failed to persist events to storage", {
        error: e instanceof Error ? e.message : "Unknown error",
        eventsCount: this.eventsQueue.length
      });
    }
  }
  /**
   * Restores events from localStorage if available and not expired
   */
  restoreEventsFromStorage() {
    try {
      const e = this.storageManager.getItem(this.PERSISTENCE_KEY);
      if (!e)
        return;
      const t = JSON.parse(e), s = Date.now(), r = Qe;
      if (s - t.timestamp > r) {
        this.clearPersistedEvents(), i.debug("EventManager", "Cleared expired persisted events", {
          age: s - t.timestamp,
          maxAge: r
        });
        return;
      }
      Array.isArray(t.events) && t.events.length > 0 && this.eventsQueue.length === 0 && (this.eventsQueue = t.events, i.info("EventManager", "Restored events from storage", {
        restoredCount: t.events.length,
        originalFailureCount: t.failureCount ?? 0
      }));
    } catch (e) {
      i.warn("EventManager", "Failed to restore events from storage", {
        error: e instanceof Error ? e.message : "Unknown error"
      }), this.clearPersistedEvents();
    }
  }
  /**
   * Clears persisted events from localStorage
   */
  clearPersistedEvents() {
    try {
      this.storageManager.removeItem(this.PERSISTENCE_KEY), i.debug("EventManager", "Cleared persisted events from storage");
    } catch (e) {
      i.warn("EventManager", "Failed to clear persisted events", {
        error: e instanceof Error ? e.message : "Unknown error"
      });
    }
  }
}
class At extends p {
  storageManager;
  constructor(e) {
    super(), this.storageManager = e;
  }
  getId() {
    const e = this.storageManager.getItem(ve(this.get("config")?.id));
    if (e)
      return e;
    const t = $();
    return this.storageManager.setItem(ve(this.get("config")?.id), t), t;
  }
}
class _t {
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
class Ct {
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
class Lt {
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
class Rt {
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
class kt {
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
class Nt {
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
class Ce extends p {
  config;
  storageManager;
  eventManager;
  projectId;
  debugMode;
  constructor(e, t, s, r) {
    super(), this.storageManager = e, this.eventManager = s ?? null, this.projectId = t, this.debugMode = (this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug") ?? !1, this.config = {
      recoveryWindowMs: this.calculateRecoveryWindow(),
      maxRecoveryAttempts: Ke,
      contextPreservation: !0,
      ...r
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
    const r = s?.context;
    if (!r)
      return this.debugMode && i.debug("SessionRecovery", "No session context available for recovery"), {
        recovered: !1
      };
    const a = Date.now();
    if (a - r.lastActivity > this.config.recoveryWindowMs)
      return this.debugMode && i.debug("SessionRecovery", "Session recovery failed - outside recovery window"), {
        recovered: !1
      };
    const l = r.sessionId, c = (s?.attempt ?? 0) + 1, d = {
      sessionId: e ?? l,
      timestamp: a,
      attempt: c,
      context: {
        ...r,
        recoveryAttempts: c,
        lastActivity: a
      }
    };
    return t.push(d), this.storeRecoveryAttempts(t), this.debugMode && i.debug("SessionRecovery", `Session recovery successful: recovery of session ${l}`), {
      recovered: !0,
      recoveredSessionId: l,
      context: d.context
    };
  }
  /**
   * Calculate the recovery window with bounds checking
   */
  calculateRecoveryWindow() {
    const t = (this.get("config")?.sessionTimeout ?? R) * Xe, s = Math.max(
      Math.min(t, X),
      K
    );
    return this.debugMode && (t > X ? i.warn(
      "SessionRecovery",
      `Recovery window capped at ${X}ms (24h). Calculated: ${t}ms`
    ) : t < K && i.warn(
      "SessionRecovery",
      `Recovery window increased to minimum ${K}ms (2min). Calculated: ${t}ms`
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
      const r = 5;
      t.length > r && t.splice(0, t.length - r), this.storeRecoveryAttempts(t), this.debugMode && i.debug("SessionRecovery", `Stored session context for recovery: ${e.sessionId}`);
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
    const e = this.getStoredRecoveryAttempts(), t = Date.now(), s = e.filter((r) => t - r.timestamp <= this.config.recoveryWindowMs);
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
class Ut extends p {
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
  constructor(e, t, s, r, a) {
    super(), this.config = {
      throttleDelay: Te,
      visibilityTimeout: Ve,
      motionThreshold: Ne,
      timeout: this.get("config")?.sessionTimeout ?? R
    }, this.sessionEndConfig = {
      enablePageUnloadHandlers: !0,
      syncTimeoutMs: 1e3,
      maxRetries: 2,
      debugMode: !1,
      ...a
    }, this.onActivity = e, this.onInactivity = t, this.eventManager = s ?? null, this.storageManager = r ?? null, this.deviceCapabilities = this.detectDeviceCapabilities(), this.initializeRecoveryManager(), this.initializeListenerManagers(), this.setupAllListeners(), this.sessionEndConfig.enablePageUnloadHandlers && this.setupPageUnloadHandlers(), i.debug("SessionManager", "SessionManager initialized", {
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
        this.recoveryManager = new Ce(this.storageManager, e, this.eventManager ?? void 0), i.debug("SessionManager", "Recovery manager initialized", { projectId: e });
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
      const r = this.recoveryManager.attemptSessionRecovery();
      r.recovered && r.recoveredSessionId && (t = r.recoveredSessionId, s = !0, this.trackSessionHealth("recovery"), r.context ? (this.sessionStartTime = r.context.startTime, this.lastActivityTime = e) : (this.sessionStartTime = e, this.lastActivityTime = e), i.info("SessionManager", "Session successfully recovered", {
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
    const e = "ontouchstart" in window || navigator.maxTouchPoints > 0, t = window.matchMedia("(pointer: fine)").matches, s = !window.matchMedia("(pointer: coarse)").matches, r = we() === E.Mobile;
    return { hasTouch: e, hasMouse: t, hasKeyboard: s, isMobile: r };
  }
  initializeListenerManagers() {
    this.listenerManagers.push(new _t(this.handleActivity)), this.deviceCapabilities.hasTouch && this.listenerManagers.push(new Ct(this.handleActivity, this.config.motionThreshold)), this.deviceCapabilities.hasMouse && this.listenerManagers.push(new Lt(this.handleActivity)), this.deviceCapabilities.hasKeyboard && this.listenerManagers.push(new Rt(this.handleActivity)), this.listenerManagers.push(
      new kt(this.handleActivity, this.handleVisibilityChange, this.deviceCapabilities.isMobile)
    ), this.listenerManagers.push(new Nt(this.handleInactivity));
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
      this.sessionEndReason = e, this.pendingSessionEnd = !0, this.sessionEndPromise = this.performSessionEnd(e, "async");
      try {
        return await this.sessionEndPromise;
      } finally {
        this.pendingSessionEnd = !1, this.sessionEndPromise = null, this.sessionEndReason = null;
      }
    });
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
      type: h.CUSTOM,
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
    let r = 0;
    try {
      if (i.info("SessionManager", "Starting session end", { method: t, reason: e, timestamp: s }), this.eventManager) {
        this.eventManager.track({
          type: h.SESSION_END,
          session_end_reason: e
        }), r = this.eventManager.getQueueLength();
        const o = await this.eventManager.flushImmediately();
        this.cleanupSession();
        const l = {
          success: o,
          reason: e,
          timestamp: s,
          eventsFlushed: r,
          method: t
        };
        return o ? this.sessionEndStats.successfulEnds++ : this.sessionEndStats.failedEnds++, l;
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
        eventsFlushed: r,
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
          type: h.SESSION_END,
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
      const r = {
        success: !0,
        reason: e,
        timestamp: t,
        eventsFlushed: 0,
        method: "sync"
      };
      return this.sessionEndStats.successfulEnds++, r;
    } catch (r) {
      return this.sessionEndStats.failedEnds++, this.cleanupSession(), i.error("SessionManager", "Sync session end failed", { error: r, reason: e }), {
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
    }, r = (o) => {
      o.persisted || t();
    }, a = () => {
      document.visibilityState === "hidden" && this.get("sessionId") && !e && (this.visibilityChangeTimeout = window.setTimeout(() => {
        document.visibilityState === "hidden" && this.get("sessionId") && !e && t(), this.visibilityChangeTimeout = null;
      }, 1e3));
    };
    window.addEventListener("beforeunload", s), window.addEventListener("pagehide", r), document.addEventListener("visibilitychange", a), this.cleanupHandlers.push(
      () => window.removeEventListener("beforeunload", s),
      () => window.removeEventListener("pagehide", r),
      () => document.removeEventListener("visibilitychange", a),
      () => {
        this.visibilityChangeTimeout && (clearTimeout(this.visibilityChangeTimeout), this.visibilityChangeTimeout = null);
      }
    );
  }
}
class Pt extends p {
  constructor(e, t, s, r) {
    super(), this.callbacks = r, this.storageManager = e, this.projectId = t, this.tabId = $(), this.config = {
      tabHeartbeatIntervalMs: qe,
      tabElectionTimeoutMs: We,
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
      const e = new BroadcastChannel(st(this.projectId));
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
          const r = Date.now() - s.lastActivity, a = this.config.tabHeartbeatIntervalMs * 3;
          r > a && (this.config.debugMode && i.warn(
            "CrossTabSession",
            `Leader tab appears inactive (${r}ms), attempting to become leader`
          ), this.leaderTabId = null, this.startLeaderElection());
        }
      }
    }, this.config.tabHeartbeatIntervalMs * 2);
    const t = this.endSession.bind(this);
    this.endSession = (s) => {
      this.leaderHealthCheckInterval && (clearInterval(this.leaderHealthCheckInterval), this.leaderHealthCheckInterval = null), t(s);
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
    const r = {
      type: "heartbeat",
      tabId: this.tabId,
      sessionId: this.tabInfo.sessionId,
      timestamp: e
    };
    this.broadcastChannel.postMessage(r), this.lastHeartbeatSent = e;
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
      const e = this.storageManager.getItem(Y(this.projectId));
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
      this.storageManager.setItem(Y(this.projectId), JSON.stringify(e));
    } catch (t) {
      this.config.debugMode && i.warn("CrossTabSession", "Failed to store session context", { error: t });
    }
  }
  /**
   * Clear stored session context
   */
  clearStoredSessionContext() {
    this.storageManager.removeItem(Y(this.projectId));
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
      return this.get("config")?.sessionTimeout ?? R;
    const s = Date.now() - e.lastActivity, r = this.get("config")?.sessionTimeout ?? R;
    return Math.max(0, r - s);
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
    this.heartbeatInterval && (clearInterval(this.heartbeatInterval), this.heartbeatInterval = null), this.electionTimeout && (clearTimeout(this.electionTimeout), this.electionTimeout = null), this.cleanupTimeout && (clearTimeout(this.cleanupTimeout), this.cleanupTimeout = null), this.fallbackLeadershipTimeout && (clearTimeout(this.fallbackLeadershipTimeout), this.fallbackLeadershipTimeout = null), this.electionDelayTimeout && (clearTimeout(this.electionDelayTimeout), this.electionDelayTimeout = null), this.tabInfoCleanupTimeout && (clearTimeout(this.tabInfoCleanupTimeout), this.tabInfoCleanupTimeout = null), this.closingAnnouncementTimeout && (clearTimeout(this.closingAnnouncementTimeout), this.closingAnnouncementTimeout = null), this.leaderHealthCheckInterval && (clearInterval(this.leaderHealthCheckInterval), this.leaderHealthCheckInterval = null), this.endSession("manual_stop"), this.broadcastChannel && this.broadcastChannel.close();
  }
}
class Ht extends p {
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
    super(), this.eventManager = t, this.storageManager = e, this.sessionStorageKey = tt(this.get("config")?.id);
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
          const r = await this.createOrJoinSession();
          this.set("sessionId", r.sessionId), i.info("SessionHandler", "🏁 Session started", {
            sessionId: r.sessionId,
            recovered: r.recovered,
            crossTabActive: !!this.crossTabSessionManager
          }), this.trackSession(h.SESSION_START, r.recovered), this.persistSession(r.sessionId), this.startHeartbeat();
        } catch (r) {
          i.error(
            "SessionHandler",
            `Session creation failed: ${r instanceof Error ? r.message : "Unknown error"}`
          ), this.forceCleanupSession();
        }
    }, t = () => {
      if (this.get("sessionId")) {
        if (this.crossTabSessionManager && this.crossTabSessionManager.getEffectiveSessionTimeout() > 0) {
          (this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug") && i.debug("SessionHandler", "Session kept alive by cross-tab activity");
          return;
        }
        this.sessionManager.endSessionManaged("inactivity").then((r) => {
          i.info("SessionHandler", "🛑 Session ended by inactivity", {
            sessionId: this.get("sessionId"),
            reason: r.reason,
            success: r.success,
            eventsFlushed: r.eventsFlushed
          }), this.crossTabSessionManager && this.crossTabSessionManager.endSession("inactivity"), this.clearPersistedSession(), this.stopHeartbeat();
        }).catch((r) => {
          i.error(
            "SessionHandler",
            `Session end failed: ${r instanceof Error ? r.message : "Unknown error"}`
          ), this.forceCleanupSession();
        });
      }
    }, s = {
      enablePageUnloadHandlers: !0,
      debugMode: (this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug") ?? !1,
      syncTimeoutMs: pe.SYNC_TIMEOUT_MS,
      maxRetries: pe.MAX_RETRY_ATTEMPTS
    };
    this.sessionManager = new Ut(
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
    this.recoveryManager = new Ce(this.storageManager, e, this.eventManager), i.debug("SessionHandler", "Session recovery manager initialized", { projectId: e });
  }
  initializeCrossTabSessionManager(e) {
    const t = {
      debugMode: (this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug") ?? !1
    }, l = {
      onSessionStart: (c) => {
        (this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug") && i.debug("SessionHandler", `Cross-tab session started: ${c}`), this.set("sessionId", c), this.trackSession(h.SESSION_START, !1), this.persistSession(c), this.startHeartbeat();
      },
      onSessionEnd: (c) => {
        (this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug") && i.debug("SessionHandler", `Cross-tab session ended: ${c}`), this.clearPersistedSession(), this.trackSession(h.SESSION_END, !1, c);
      },
      onTabActivity: () => {
        (this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug") && i.debug("SessionHandler", "Cross-tab activity detected");
      },
      onCrossTabConflict: () => {
        (this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug") && i.warn("SessionHandler", "Cross-tab conflict detected"), this.sessionManager && this.sessionManager.trackSessionHealth("conflict");
      }
    };
    this._crossTabSessionManager = new Pt(this.storageManager, e, t, l), i.debug("SessionHandler", "Cross-tab session manager initialized", { projectId: e });
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
      this.trackSession(h.SESSION_END, !1, "orphaned_cleanup");
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
      ...e === h.SESSION_START && t && { session_start_recovered: t },
      ...e === h.SESSION_END && { session_end_reason: s ?? "orphaned_cleanup" }
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
    this.set("sessionId", e.sessionId), this.trackSession(h.SESSION_START, e.recovered), this.persistSession(e.sessionId), this.startHeartbeat();
  }
  checkOrphanedSessions() {
    const e = this.storageManager.getItem(this.sessionStorageKey);
    if (e)
      try {
        const t = JSON.parse(e), r = Date.now() - t.lastHeartbeat, a = this.get("config")?.sessionTimeout ?? R;
        if (r > a) {
          const o = this.recoveryManager?.hasRecoverableSession();
          if (o && this.recoveryManager) {
            const l = {
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
            this.recoveryManager.storeSessionContextForRecovery(l), (this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug") && i.debug("SessionHandler", `Orphaned session stored for recovery: ${t.sessionId}`);
          }
          this.trackSession(h.SESSION_END), this.clearPersistedSession(), (this.get("config")?.mode === "qa" || this.get("config")?.mode === "debug") && i.debug(
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
    }, ze);
  }
  stopHeartbeat() {
    this.heartbeatInterval && (clearInterval(this.heartbeatInterval), this.heartbeatInterval = null);
  }
}
class Dt extends p {
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
    const e = window.location.href, t = se(e, this.get("config").sensitiveQueryParams);
    if (this.get("pageUrl") !== t) {
      const s = this.get("pageUrl");
      i.debug("PageViewHandler", "Page navigation detected", { from: s, to: t }), this.set("pageUrl", t), this.eventManager.track({
        type: h.PAGE_VIEW,
        page_url: this.get("pageUrl"),
        from_page_url: s,
        ...this.extractPageViewData() && { page_view: this.extractPageViewData() }
      }), this.onTrack();
    }
  };
  trackInitialPageView() {
    this.eventManager.track({
      type: h.PAGE_VIEW,
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
class xt extends p {
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
      const t = e, s = t.target, r = s instanceof HTMLElement ? s : s instanceof Node && s.parentElement instanceof HTMLElement ? s.parentElement : null;
      if (!r) {
        i.warn("ClickHandler", "Click target not found or not an element");
        return;
      }
      i.info("ClickHandler", "🖱️ Click detected on element", {
        tagName: r.tagName,
        className: r.className || "none",
        textContent: r.textContent?.slice(0, 50) ?? "empty"
      });
      const a = this.findTrackingElement(r), o = this.getRelevantClickElement(r), l = this.calculateClickCoordinates(t, r);
      if (a) {
        const d = this.extractTrackingData(a);
        if (d) {
          const u = this.createCustomEventData(d);
          this.eventManager.track({
            type: h.CUSTOM,
            custom_event: {
              name: u.name,
              ...u.value && { metadata: { value: u.value } }
            }
          });
        }
      }
      const c = this.generateClickData(r, o, l);
      this.eventManager.track({
        type: h.CLICK,
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
    for (const t of fe)
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
    for (const t of fe)
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
    const s = t.getBoundingClientRect(), r = e.clientX, a = e.clientY, o = s.width > 0 ? Math.max(0, Math.min(1, Number(((r - s.left) / s.width).toFixed(3)))) : 0, l = s.height > 0 ? Math.max(0, Math.min(1, Number(((a - s.top) / s.height).toFixed(3)))) : 0;
    return { x: r, y: a, relativeX: o, relativeY: l };
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
    const { x: r, y: a, relativeX: o, relativeY: l } = s, c = this.getRelevantText(e, t), d = this.extractElementAttributes(t), u = t.getAttribute("href"), g = t.getAttribute("title"), y = t.getAttribute("alt"), I = t.getAttribute("role"), A = t.getAttribute("aria-label"), U = typeof t.className == "string" ? t.className : String(t.className);
    return {
      x: r,
      y: a,
      relativeX: o,
      relativeY: l,
      tag: t.tagName.toLowerCase(),
      ...t.id && { id: t.id },
      ...t.className && { class: U },
      ...c && { text: c },
      ...u && { href: u },
      ...g && { title: g },
      ...y && { alt: y },
      ...I && { role: I },
      ...A && { ariaLabel: A },
      ...Object.keys(d).length > 0 && { dataAttributes: d }
    };
  }
  getRelevantText(e, t) {
    const s = ["main", "section", "article", "body", "html", "header", "footer", "aside", "nav"], r = e.textContent?.trim() ?? "", a = t.textContent?.trim() ?? "";
    if (!r && !a)
      return "";
    if (r && r.length <= _)
      return r;
    const o = s.includes(t.tagName.toLowerCase()), l = a.length > _ * 2;
    return o && l ? r && r.length <= _ ? r : "" : a.length <= _ ? a : r && r.length < a.length * 0.1 ? r.length <= _ ? r : r.slice(0, _ - 3) + "..." : a.slice(0, _ - 3) + "...";
  }
  extractElementAttributes(e) {
    const t = ["id", "class", "data-testid", "aria-label", "title", "href", "type", "name"], s = {};
    for (const r of t) {
      const a = e.getAttribute(r);
      a && (s[r] = a);
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
class Ot extends p {
  eventManager;
  containers = [];
  constructor(e) {
    super(), this.eventManager = e;
  }
  startTracking() {
    const e = this.get("config").scrollContainerSelectors, t = Array.isArray(e) ? e : typeof e == "string" ? [e] : [];
    i.debug("ScrollHandler", "Starting scroll tracking", { selectorsCount: t.length });
    const s = t.map((r) => this.safeQuerySelector(r)).filter((r) => r instanceof HTMLElement);
    s.length === 0 && s.push(window);
    for (const r of s)
      this.setupScrollContainer(r);
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
        const r = this.calculateScrollData(t);
        r && this.eventManager.track({
          type: h.SCROLL,
          scroll_data: r
        }), t.debounceTimer = null;
      }, Me);
    };
    t.listener = s, this.containers.push(t), e instanceof Window ? window.addEventListener("scroll", s, { passive: !0 }) : e.addEventListener("scroll", s, { passive: !0 });
  }
  calculateScrollData(e) {
    const { element: t, lastScrollPos: s } = e, r = this.getScrollTop(t), a = this.getViewportHeight(t), o = this.getScrollHeight(t);
    if (t === window && o <= a)
      return null;
    const l = r > s ? j.DOWN : j.UP, c = o > a ? Math.min(100, Math.max(0, Math.floor(r / (o - a) * 100))) : 0;
    return Math.abs(r - s) < Ue ? null : (e.lastScrollPos = r, { depth: c, direction: l });
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
    const t = getComputedStyle(e), s = t.overflowY === "auto" || t.overflowY === "scroll" || t.overflowX === "auto" || t.overflowX === "scroll" || t.overflow === "auto" || t.overflow === "scroll", r = e.scrollHeight > e.clientHeight || e.scrollWidth > e.clientWidth;
    return s && r;
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
class Ft extends p {
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
        const r = document.createElement("script");
        r.id = "tracelog-ga-script", r.async = !0, r.src = `https://www.googletagmanager.com/gtag/js?id=${e}`, r.onload = () => {
          t();
        }, r.onerror = () => {
          const a = new Error("Failed to load Google Analytics script");
          i.error("GoogleAnalytics", "Google Analytics script load failed", {
            measurementId: e,
            error: a.message,
            scriptSrc: r.src
          }), s(a);
        }, document.head.appendChild(r);
      } catch (r) {
        const a = r instanceof Error ? r : new Error(String(r));
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
class zt {
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
      if (this.storage) {
        this.storage.setItem(e, t);
        return;
      }
      this.fallbackStorage.set(e, t);
    } catch (s) {
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
  init() {
    try {
      const e = "__storage_test__", t = window.localStorage;
      return t.setItem(e, e), t.removeItem(e), t;
    } catch {
      return null;
    }
  }
}
class Vt extends p {
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
        const s = t.getEntries(), r = s[s.length - 1];
        r && this.sendVital({ type: "LCP", value: Number(r.startTime.toFixed(N)) });
      },
      { type: "largest-contentful-paint", buffered: !0 },
      !0
    );
    let e = 0;
    this.safeObserve(
      "layout-shift",
      (t) => {
        const s = t.getEntries();
        for (const r of s) {
          if (r.hadRecentInput === !0)
            continue;
          const a = typeof r.value == "number" ? r.value : 0;
          e += a;
        }
        this.sendVital({ type: "CLS", value: Number(e.toFixed(Pe)) });
      },
      { type: "layout-shift", buffered: !0 }
    ), this.safeObserve(
      "paint",
      (t) => {
        for (const s of t.getEntries())
          s.name === "first-contentful-paint" && this.sendVital({ type: "FCP", value: Number(s.startTime.toFixed(N)) });
      },
      { type: "paint", buffered: !0 },
      !0
    ), this.safeObserve(
      "event",
      (t) => {
        let s = 0;
        const r = t.getEntries();
        for (const a of r) {
          const o = (a.processingEnd ?? 0) - (a.startTime ?? 0);
          s = Math.max(s, o);
        }
        s > 0 && this.sendVital({ type: "INP", value: Number(s.toFixed(N)) });
      },
      { type: "event", buffered: !0 }
    );
  }
  async initWebVitals() {
    try {
      const { onLCP: e, onCLS: t, onFCP: s, onTTFB: r, onINP: a } = await import("./web-vitals-CCnqwnC8.mjs"), o = (l) => (c) => {
        const d = Number(c.value.toFixed(N));
        this.sendVital({ type: l, value: d });
      };
      e(o("LCP")), t(o("CLS")), s(o("FCP")), r(o("TTFB")), a(o("INP"));
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
      typeof t == "number" && Number.isFinite(t) ? this.sendVital({ type: "TTFB", value: Number(t.toFixed(N)) }) : i.debug("PerformanceHandler", "TTFB value is not a valid number", { ttfb: t });
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
          const r = Number(s.duration.toFixed(N)), a = Date.now();
          a - this.lastLongTaskSentAt >= Be && (this.trackWebVital("LONG_TASK", r), this.lastLongTaskSentAt = a);
        }
      },
      { type: "longtask", buffered: !0 }
    );
  }
  sendVital(e) {
    const t = this.getNavigationId(), s = `${e.type}`;
    if (t) {
      this.reportedByNav.has(t) || this.reportedByNav.set(t, /* @__PURE__ */ new Set());
      const r = this.reportedByNav.get(t);
      if (r.has(s))
        return;
      r.add(s);
    }
    this.trackWebVital(e.type, e.value);
  }
  trackWebVital(e, t) {
    if (typeof t != "number" || !Number.isFinite(t)) {
      i.warn("PerformanceHandler", "Invalid web vital value", { type: e, value: t });
      return;
    }
    this.eventManager.track({
      type: h.WEB_VITALS,
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
  safeObserve(e, t, s, r = !1) {
    try {
      if (typeof PerformanceObserver > "u") return;
      const a = PerformanceObserver.supportedEntryTypes;
      if (a && !a.includes(e)) return;
      const o = new PerformanceObserver((l, c) => {
        if (t(l, c), r)
          try {
            c.disconnect();
          } catch {
          }
      });
      o.observe(s ?? { type: e, buffered: !0 }), r || this.observers.push(o);
    } catch (a) {
      i.warn("PerformanceHandler", "Failed to create performance observer", {
        type: e,
        error: a instanceof Error ? a.message : "Unknown error"
      });
    }
  }
}
class $t extends p {
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
      type: h.ERROR,
      error_data: {
        type: D.JS_ERROR,
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
      type: h.ERROR,
      error_data: {
        type: D.PROMISE_REJECTION,
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
class jt extends p {
  eventManager;
  originalFetch;
  originalXHROpen;
  originalXHRSend;
  constructor(e) {
    super(), this.eventManager = e, this.originalFetch = window.fetch, this.originalXHROpen = XMLHttpRequest.prototype.open, this.originalXHRSend = XMLHttpRequest.prototype.send;
  }
  startTracking() {
    i.debug("NetworkHandler", "Starting network error tracking"), this.interceptFetch(), this.interceptXHR();
  }
  stopTracking() {
    i.debug("NetworkHandler", "Stopping network error tracking"), window.fetch = this.originalFetch, XMLHttpRequest.prototype.open = this.originalXHROpen, XMLHttpRequest.prototype.send = this.originalXHRSend;
  }
  interceptFetch() {
    window.fetch = async (e, t) => {
      const s = Date.now(), r = typeof e == "string" ? e : e.toString(), a = t?.method ?? "GET";
      try {
        const o = await this.originalFetch(e, t), l = Date.now() - s;
        return o.ok || (i.debug("NetworkHandler", "Fetch error detected", {
          method: a,
          url: this.normalizeUrlForTracking(r),
          status: o.status,
          statusText: o.statusText
        }), this.trackNetworkError(
          a.toUpperCase(),
          this.normalizeUrlForTracking(r),
          o.status,
          o.statusText,
          l
        )), o;
      } catch (o) {
        const l = Date.now() - s, c = o instanceof Error ? o.message : "Network Error";
        throw i.debug("NetworkHandler", "Fetch exception caught", {
          method: a,
          url: this.normalizeUrlForTracking(r),
          error: c
        }), this.trackNetworkError(
          a.toUpperCase(),
          this.normalizeUrlForTracking(r),
          void 0,
          c,
          l
        ), o;
      }
    };
  }
  interceptXHR() {
    const e = this.trackNetworkError.bind(this), t = this.normalizeUrlForTracking.bind(this), s = this.originalXHROpen, r = this.originalXHRSend;
    XMLHttpRequest.prototype.open = function(a, o, l, c, d) {
      const u = l ?? !0, g = this;
      return g._tracelogStartTime = Date.now(), g._tracelogMethod = a.toUpperCase(), g._tracelogUrl = o.toString(), s.call(this, a, o, u, c, d);
    }, XMLHttpRequest.prototype.send = function(a) {
      const o = this, l = o._tracelogStartTime ?? Date.now(), c = o._tracelogMethod ?? "GET", d = o._tracelogUrl ?? "", u = o.onreadystatechange;
      return o.onreadystatechange = (g) => {
        if (o.readyState === XMLHttpRequest.DONE) {
          const y = Date.now() - l;
          if (o.status === 0 || o.status >= 400) {
            const I = o.statusText || "Request Failed";
            i.debug("NetworkHandler", "XHR error detected", {
              method: c,
              url: t(d),
              status: o.status,
              statusText: I
            }), e(c, t(d), o.status, I, y);
          }
        }
        if (u)
          return u.call(o, g);
      }, r.call(this, a);
    };
  }
  trackNetworkError(e, t, s, r, a) {
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
      `Network error tracked: ${e} ${t} (status: ${s}, statusText: ${r}, duration: ${a}ms)`,
      { method: e, url: t, status: s, statusText: r, duration: a }
    ), this.eventManager.track({
      type: h.ERROR,
      error_data: {
        type: D.NETWORK_ERROR,
        message: r,
        method: e,
        url: t,
        status: s,
        statusText: r,
        duration: a
      }
    });
  }
  normalizeUrlForTracking(e) {
    try {
      const t = this.get("config");
      return se(e, t?.sensitiveQueryParams);
    } catch {
      return e;
    }
  }
  shouldSample(e) {
    return Math.random() < e;
  }
}
class Gt extends p {
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
      this.initStorage(), await this.setState(e), await this.setIntegrations(), this.setEventManager(), await this.initHandlers(), this.isInitialized = !0, i.info("App", "App initialization completed successfully", {
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
      }), new Q("Configuration integrity check failed", "app");
  }
  sendCustomEvent(e, t) {
    if (!this.eventManager) {
      i.warn("App", "Custom event attempted before eventManager initialization", { eventName: e });
      return;
    }
    const { valid: s, error: r, sanitizedMetadata: a } = vt(e, t);
    if (s)
      i.debug("App", "Custom event validated and queued", { eventName: e, hasMetadata: !!a }), this.eventManager.track({
        type: h.CUSTOM,
        custom_event: {
          name: e,
          ...a && { metadata: a }
        }
      });
    else {
      const o = this.get("config")?.mode;
      if (i.clientError("App", `Custom event validation failed: ${r ?? "unknown error"}`, {
        eventName: e,
        validationError: r,
        hasMetadata: !!t,
        mode: o
      }), o === "qa" || o === "debug")
        throw new Error(
          `custom event "${e}" validation failed (${r ?? "unknown error"}). Please, review your event data and try again.`
        );
    }
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
    const s = new bt();
    this.set("apiUrl", s.getUrl(e, t));
  }
  async setConfig(e) {
    const s = await new Et().get(this.get("apiUrl"), e);
    this.set("config", s);
  }
  setUserId() {
    const t = new At(this.storageManager).getId();
    this.set("userId", t);
  }
  setDevice() {
    const e = we();
    this.set("device", e);
  }
  setPageUrl() {
    const e = se(window.location.href, this.get("config").sensitiveQueryParams);
    this.set("pageUrl", e);
  }
  async setIntegrations() {
    const e = this.get("config").ipExcluded, t = this.get("config").integrations?.googleAnalytics?.measurementId;
    !e && t?.trim() && (this.googleAnalytics = new Ft(), await this.googleAnalytics.initialize());
  }
  async initHandlers() {
    if (!this.eventManager)
      throw new Error("EventManager must be initialized before handlers");
    if (!this.storageManager)
      throw new Error("StorageManager must be initialized before handlers");
    this.initSessionHandler(), this.initPageViewHandler(), this.initClickHandler(), this.initScrollHandler(), await this.initPerformanceHandler(), this.initErrorHandler(), this.initNetworkHandler();
  }
  initStorage() {
    this.storageManager = new zt();
  }
  setEventManager() {
    if (!this.storageManager)
      throw new Error("StorageManager must be initialized before EventManager");
    this.eventManager = new Mt(this.storageManager, this.googleAnalytics);
  }
  initSessionHandler() {
    if (!this.storageManager || !this.eventManager)
      throw new Error("StorageManager and EventManager must be initialized before SessionHandler");
    this.sessionHandler = new Ht(this.storageManager, this.eventManager), this.sessionHandler.startTracking();
  }
  initPageViewHandler() {
    if (!this.eventManager)
      throw new Error("EventManager must be initialized before PageViewHandler");
    const e = () => this.onPageViewTrack();
    this.pageViewHandler = new Dt(this.eventManager, e), this.pageViewHandler.startTracking();
  }
  onPageViewTrack() {
    this.set("suppressNextScroll", !0), this.suppressNextScrollTimer && (clearTimeout(this.suppressNextScrollTimer), this.suppressNextScrollTimer = null), this.suppressNextScrollTimer = window.setTimeout(() => {
      this.set("suppressNextScroll", !1);
    }, Me * Ze.SUPPRESS_MULTIPLIER);
  }
  initClickHandler() {
    if (!this.eventManager)
      throw new Error("EventManager must be initialized before ClickHandler");
    this.clickHandler = new xt(this.eventManager), this.clickHandler.startTracking();
  }
  initScrollHandler() {
    if (!this.eventManager)
      throw new Error("EventManager must be initialized before ScrollHandler");
    this.scrollHandler = new Ot(this.eventManager), this.scrollHandler.startTracking();
  }
  async initPerformanceHandler() {
    if (!this.eventManager)
      throw new Error("EventManager must be initialized before PerformanceHandler");
    this.performanceHandler = new Vt(this.eventManager), await this.performanceHandler.startTracking();
  }
  initErrorHandler() {
    if (!this.eventManager)
      throw new Error("EventManager must be initialized before ErrorHandler");
    this.errorHandler = new $t(this.eventManager), this.errorHandler.startTracking();
  }
  initNetworkHandler() {
    if (!this.eventManager)
      throw new Error("EventManager must be initialized before NetworkHandler");
    this.networkHandler = new jt(this.eventManager), this.networkHandler.startTracking();
  }
}
const Qt = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  DeviceType: E,
  ErrorType: D,
  EventType: h,
  Mode: L,
  ScrollDirection: j,
  TagConditionOperator: f,
  TagConditionType: m,
  TagLogicalOperator: G
}, Symbol.toStringTag, { value: "Module" })), Bt = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  DEFAULT_SESSION_TIMEOUT_MS: R
}, Symbol.toStringTag, { value: "Module" }));
let v = null, T = !1;
const qt = async (n) => {
  try {
    if (i.info("API", "Library initialization started", { id: n.id }), typeof window > "u" || typeof document > "u")
      throw i.clientError(
        "API",
        "Browser environment required - this library can only be used in a browser environment",
        {
          hasWindow: typeof window < "u",
          hasDocument: typeof document < "u"
        }
      ), new Error("This library can only be used in a browser environment");
    if (v) {
      i.debug("API", "Library already initialized, skipping duplicate initialization", {
        projectId: n.id
      });
      return;
    }
    if (T) {
      i.debug("API", "Concurrent initialization detected, waiting for completion", { projectId: n.id });
      let s = 0;
      const r = me.MAX_CONCURRENT_RETRIES, a = me.CONCURRENT_RETRY_DELAY_MS;
      for (; T && s < r; )
        await new Promise((o) => setTimeout(o, a)), s++;
      if (v) {
        i.debug("API", "Concurrent initialization completed successfully", {
          projectId: n.id,
          retriesUsed: s
        });
        return;
      }
      if (T)
        throw i.error("API", "Initialization timeout - concurrent initialization took too long", {
          projectId: n.id,
          retriesUsed: s,
          maxRetries: r
        }), new Error("App initialization timeout - concurrent initialization took too long");
    }
    T = !0, i.debug("API", "Validating and normalizing configuration", { projectId: n.id });
    const e = dt(n);
    i.debug("API", "Creating App instance", { projectId: e.id });
    const t = new Gt();
    await t.init(e), v = t, i.info("API", "Library initialization completed successfully", {
      projectId: e.id
    });
  } catch (e) {
    if (v && !v.initialized)
      try {
        v.destroy();
      } catch (t) {
        i.warn("API", "Failed to cleanup partially initialized app", { cleanupError: t });
      }
    throw v = null, i.error("API", "Initialization failed", { error: e }), e;
  } finally {
    T = !1;
  }
}, Wt = (n, e) => {
  try {
    if (!v)
      throw i.clientError("API", "Custom event failed - Library not initialized. Please call TraceLog.init() first", {
        eventName: n,
        hasMetadata: !!e
      }), new Error("App not initialized");
    i.debug("API", "Sending custom event", {
      eventName: n,
      hasMetadata: !!e,
      metadataKeys: e ? Object.keys(e) : []
    }), v.sendCustomEvent(n, e);
  } catch (t) {
    if (i.error("API", "Event tracking failed", { eventName: n, error: t, hasMetadata: !!e }), t instanceof Error && (t.message === "App not initialized" || t.message.includes("validation failed")))
      throw t;
  }
}, Xt = () => v !== null, Kt = () => ({
  isInitialized: v !== null,
  isInitializing: T,
  hasInstance: v !== null
}), Yt = () => {
  try {
    if (i.info("API", "Library cleanup initiated"), !v)
      throw i.warn("API", "Cleanup called but Library was not initialized"), new Error("App not initialized");
    v.destroy(), v = null, T = !1, i.info("API", "Library cleanup completed successfully");
  } catch (n) {
    i.error("API", "Cleanup failed", { error: n, hadApp: !!v, wasInitializing: T });
  }
}, Jt = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Constants: Bt,
  Types: Qt,
  destroy: Yt,
  event: Wt,
  getInitializationStatus: Kt,
  init: qt,
  isInitialized: Xt
}, Symbol.toStringTag, { value: "Module" }));
export {
  Jt as TraceLog
};
