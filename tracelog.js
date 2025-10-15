const Zt = 120, Jt = 8192, er = 10, tr = 10, rr = 20, sr = 1;
const nr = 1e3, ir = 500, or = 100;
const w = "data-tlog", xe = [
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
], Fe = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"], Ge = [
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
const f = {
  INVALID_SESSION_TIMEOUT: "Session timeout must be between 30000ms (30 seconds) and 86400000ms (24 hours)",
  INVALID_SAMPLING_RATE: "Sampling rate must be between 0 and 1",
  INVALID_ERROR_SAMPLING_RATE: "Error sampling must be between 0 and 1",
  INVALID_TRACELOG_PROJECT_ID: "TraceLog project ID is required when integration is enabled",
  INVALID_CUSTOM_API_URL: "Custom API URL is required when integration is enabled",
  INVALID_GOOGLE_ANALYTICS_ID: "Google Analytics measurement ID is required when integration is enabled",
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
}, We = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<embed\b[^>]*>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi
];
var q = /* @__PURE__ */ ((s) => (s.Localhost = "localhost:8080", s.Fail = "localhost:9999", s))(q || {}), y = /* @__PURE__ */ ((s) => (s.Mobile = "mobile", s.Tablet = "tablet", s.Desktop = "desktop", s.Unknown = "unknown", s))(y || {}), Z = /* @__PURE__ */ ((s) => (s.EVENT = "event", s.QUEUE = "queue", s))(Z || {});
class R extends Error {
  constructor(e, t) {
    super(e), this.statusCode = t, this.name = "PermanentError", Error.captureStackTrace && Error.captureStackTrace(this, R);
  }
}
var u = /* @__PURE__ */ ((s) => (s.PAGE_VIEW = "page_view", s.CLICK = "click", s.SCROLL = "scroll", s.SESSION_START = "session_start", s.SESSION_END = "session_end", s.CUSTOM = "custom", s.WEB_VITALS = "web_vitals", s.ERROR = "error", s.VIEWPORT_VISIBLE = "viewport_visible", s))(u || {}), U = /* @__PURE__ */ ((s) => (s.UP = "up", s.DOWN = "down", s))(U || {}), P = /* @__PURE__ */ ((s) => (s.JS_ERROR = "js_error", s.PROMISE_REJECTION = "promise_rejection", s))(P || {}), D = /* @__PURE__ */ ((s) => (s.QA = "qa", s))(D || {});
const ar = (s) => s.type === u.SCROLL && "scroll_data" in s && s.scroll_data.is_primary === !0, lr = (s) => s.type === u.SCROLL && "scroll_data" in s && s.scroll_data.is_primary === !1;
class V extends Error {
  constructor(e, t, r) {
    super(e), this.errorCode = t, this.layer = r, this.name = this.constructor.name, Error.captureStackTrace && Error.captureStackTrace(this, this.constructor);
  }
}
class h extends V {
  constructor(e, t = "config") {
    super(e, "APP_CONFIG_INVALID", t);
  }
}
class Be extends V {
  constructor(e, t = "config") {
    super(e, "SESSION_TIMEOUT_INVALID", t);
  }
}
class he extends V {
  constructor(e, t = "config") {
    super(e, "SAMPLING_RATE_INVALID", t);
  }
}
class M extends V {
  constructor(e, t = "config") {
    super(e, "INTEGRATION_INVALID", t);
  }
}
class cr extends V {
  constructor(e, t, r = "runtime") {
    super(e, "INITIALIZATION_TIMEOUT", r), this.timeoutMs = t;
  }
}
const $e = (s, e) => {
  if (e) {
    if (e instanceof Error) {
      const t = e.message.replace(/\s+at\s+.*$/gm, "").replace(/\(.*?:\d+:\d+\)/g, "");
      return `[TraceLog] ${s}: ${t}`;
    }
    return `[TraceLog] ${s}: ${e instanceof Error ? e.message : "Unknown error"}`;
  }
  return `[TraceLog] ${s}`;
}, a = (s, e, t) => {
  const { error: r, data: n, showToClient: i = !1 } = t ?? {}, o = r ? $e(e, r) : `[TraceLog] ${e}`, l = s === "error" ? "error" : s === "warn" ? "warn" : "log";
  if (!(s === "debug" || s === "info" && !i))
    if (n !== void 0) {
      const c = Xe(n);
      console[l](o, c);
    } else n !== void 0 ? console[l](o, n) : console[l](o);
}, Xe = (s) => {
  const e = {}, t = ["token", "password", "secret", "key", "apikey", "api_key", "sessionid", "session_id"];
  for (const [r, n] of Object.entries(s)) {
    const i = r.toLowerCase();
    t.some((o) => i.includes(o)) ? e[r] = "[REDACTED]" : e[r] = n;
  }
  return e;
};
let J, Le;
const ze = () => {
  typeof window < "u" && !J && (J = window.matchMedia("(pointer: coarse)"), Le = window.matchMedia("(hover: none)"));
}, je = () => {
  try {
    const s = navigator;
    if (s.userAgentData && typeof s.userAgentData.mobile == "boolean")
      return s.userAgentData.platform && /ipad|tablet/i.test(s.userAgentData.platform) ? y.Tablet : s.userAgentData.mobile ? y.Mobile : y.Desktop;
    ze();
    const e = window.innerWidth, t = J?.matches ?? !1, r = Le?.matches ?? !1, n = "ontouchstart" in window || navigator.maxTouchPoints > 0, i = navigator.userAgent.toLowerCase(), o = /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/.test(i), l = /tablet|ipad|android(?!.*mobile)/.test(i);
    return e <= 767 || o && n ? y.Mobile : e >= 768 && e <= 1024 || l || t && r && n ? y.Tablet : y.Desktop;
  } catch (s) {
    return a("warn", "Device detection failed, defaulting to desktop", { error: s }), y.Desktop;
  }
}, L = "tlog", fe = `${L}:qa_mode`, Qe = `${L}:uid`, Ye = (s) => s ? `${L}:${s}:queue` : `${L}:queue`, Ke = (s) => s ? `${L}:${s}:session` : `${L}:session`, qe = (s) => s ? `${L}:${s}:broadcast` : `${L}:broadcast`, ur = {
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
}, Ee = {
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
}, Ze = {
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
}, ee = "needs-improvement", me = (s = ee) => {
  switch (s) {
    case "all":
      return { LCP: 0, FCP: 0, CLS: 0, INP: 0, TTFB: 0, LONG_TASK: 0 };
    // Track everything
    case "needs-improvement":
      return Ee;
    case "poor":
      return Ze;
    default:
      return Ee;
  }
}, Je = 1e3, et = 50, Me = [
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
], ge = 500, Se = 5e3, x = 50, tt = x * 2, Ne = 1, rt = 1e3, st = 10, Te = 5e3, nt = 6e4, _e = "tlog_mode", it = "qa", ot = () => {
  if (sessionStorage.getItem(fe) === "true")
    return !0;
  const e = new URLSearchParams(window.location.search), r = e.get(_e) === it;
  if (r) {
    sessionStorage.setItem(fe, "true"), e.delete(_e);
    const n = e.toString(), i = `${window.location.pathname}${n ? "?" + n : ""}${window.location.hash}`;
    try {
      window.history.replaceState({}, "", i);
    } catch (o) {
      a("warn", "History API not available, cannot replace URL", { error: o });
    }
    console.log(
      "%c[TraceLog] QA Mode ACTIVE",
      "background: #ff9800; color: white; font-weight: bold; padding: 2px 8px; border-radius: 3px;"
    );
  }
  return r;
}, pe = () => {
  const s = new URLSearchParams(window.location.search), e = {};
  return Fe.forEach((r) => {
    const n = s.get(r);
    if (n) {
      const i = r.split("utm_")[1];
      e[i] = n;
    }
  }), Object.keys(e).length ? e : void 0;
}, at = () => typeof crypto < "u" && crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (s) => {
  const e = Math.random() * 16 | 0;
  return (s === "x" ? e : e & 3 | 8).toString(16);
}), lt = () => {
  const s = Date.now();
  let e = "";
  try {
    if (typeof crypto < "u" && crypto.getRandomValues) {
      const t = crypto.getRandomValues(new Uint8Array(4));
      t && (e = Array.from(t, (r) => r.toString(16).padStart(2, "0")).join(""));
    }
  } catch {
  }
  return e || (e = Math.floor(Math.random() * 4294967295).toString(16).padStart(8, "0")), `${s}-${e}`;
}, Ie = (s, e = !1) => {
  try {
    const t = new URL(s), r = t.protocol === "https:", n = t.protocol === "http:";
    return r || e && n;
  } catch {
    return !1;
  }
}, ct = (s) => {
  if (s.integrations?.tracelog?.projectId)
    try {
      const r = new URL(window.location.href).hostname;
      if (!r || typeof r != "string")
        throw new Error("Invalid hostname");
      const n = r.split(".");
      if (!n || !Array.isArray(n) || n.length === 0 || n.length === 1 && n[0] === "")
        throw new Error("Invalid hostname structure");
      const i = s.integrations.tracelog.projectId, o = n.slice(-2).join(".");
      if (!o)
        throw new Error("Invalid domain");
      const l = `https://${i}.${o}/collect`;
      if (!Ie(l))
        throw new Error("Invalid URL");
      return l;
    } catch (t) {
      throw new Error(`Invalid URL configuration: ${t instanceof Error ? t.message : String(t)}`);
    }
  const e = s.integrations?.custom?.collectApiUrl;
  if (e) {
    const t = s.integrations?.custom?.allowHttp ?? !1;
    if (!Ie(e, t))
      throw new Error("Invalid URL");
    return e;
  }
  return "";
}, te = (s, e = []) => {
  if (!s || typeof s != "string")
    return a("warn", "Invalid URL provided to normalizeUrl", { data: { url: String(s) } }), s || "";
  try {
    const t = new URL(s), r = t.searchParams, n = [.../* @__PURE__ */ new Set([...Ge, ...e])];
    let i = !1;
    const o = [];
    return n.forEach((c) => {
      r.has(c) && (r.delete(c), i = !0, o.push(c));
    }), !i && s.includes("?") ? s : (t.search = r.toString(), t.toString());
  } catch (t) {
    const r = s && typeof s == "string" ? s.slice(0, 100) : String(s);
    return a("warn", "URL normalization failed, returning original", { error: t, data: { url: r } }), s;
  }
}, ve = (s) => {
  if (!s || typeof s != "string" || s.trim().length === 0)
    return "";
  let e = s;
  s.length > 1e3 && (e = s.slice(0, Math.max(0, 1e3)));
  let t = 0;
  for (const n of We) {
    const i = e;
    e = e.replace(n, ""), i !== e && t++;
  }
  return t > 0 && a("warn", "XSS patterns detected and removed", {
    data: {
      patternMatches: t,
      originalValue: s.slice(0, 100)
    }
  }), e = e.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#x27;").replaceAll("/", "&#x2F;"), e.trim();
}, re = (s, e = 0) => {
  if (e > 3 || s == null)
    return null;
  if (typeof s == "string")
    return ve(s);
  if (typeof s == "number")
    return !Number.isFinite(s) || s < -Number.MAX_SAFE_INTEGER || s > Number.MAX_SAFE_INTEGER ? 0 : s;
  if (typeof s == "boolean")
    return s;
  if (Array.isArray(s))
    return s.slice(0, 100).map((n) => re(n, e + 1)).filter((n) => n !== null);
  if (typeof s == "object") {
    const t = {}, n = Object.entries(s).slice(0, 20);
    for (const [i, o] of n) {
      const l = ve(i);
      if (l) {
        const c = re(o, e + 1);
        c !== null && (t[l] = c);
      }
    }
    return t;
  }
  return null;
}, ut = (s) => {
  if (typeof s != "object" || s === null)
    return {};
  try {
    const e = re(s);
    return typeof e == "object" && e !== null ? e : {};
  } catch (e) {
    const t = e instanceof Error ? e.message : String(e);
    throw new Error(`[TraceLog] Metadata sanitization failed: ${t}`);
  }
}, dt = (s) => {
  if (s !== void 0 && (s === null || typeof s != "object"))
    throw new h("Configuration must be an object", "config");
  if (s) {
    if (s.sessionTimeout !== void 0 && (typeof s.sessionTimeout != "number" || s.sessionTimeout < 3e4 || s.sessionTimeout > 864e5))
      throw new Be(f.INVALID_SESSION_TIMEOUT, "config");
    if (s.globalMetadata !== void 0 && (typeof s.globalMetadata != "object" || s.globalMetadata === null))
      throw new h(f.INVALID_GLOBAL_METADATA, "config");
    if (s.integrations && ft(s.integrations), s.sensitiveQueryParams !== void 0) {
      if (!Array.isArray(s.sensitiveQueryParams))
        throw new h(f.INVALID_SENSITIVE_QUERY_PARAMS, "config");
      for (const e of s.sensitiveQueryParams)
        if (typeof e != "string")
          throw new h("All sensitive query params must be strings", "config");
    }
    if (s.errorSampling !== void 0 && (typeof s.errorSampling != "number" || s.errorSampling < 0 || s.errorSampling > 1))
      throw new he(f.INVALID_ERROR_SAMPLING_RATE, "config");
    if (s.samplingRate !== void 0 && (typeof s.samplingRate != "number" || s.samplingRate < 0 || s.samplingRate > 1))
      throw new he(f.INVALID_SAMPLING_RATE, "config");
    if (s.primaryScrollSelector !== void 0) {
      if (typeof s.primaryScrollSelector != "string" || !s.primaryScrollSelector.trim())
        throw new h(f.INVALID_PRIMARY_SCROLL_SELECTOR, "config");
      if (s.primaryScrollSelector !== "window")
        try {
          document.querySelector(s.primaryScrollSelector);
        } catch {
          throw new h(
            `${f.INVALID_PRIMARY_SCROLL_SELECTOR_SYNTAX}: "${s.primaryScrollSelector}"`,
            "config"
          );
        }
    }
    if (s.pageViewThrottleMs !== void 0 && (typeof s.pageViewThrottleMs != "number" || s.pageViewThrottleMs < 0))
      throw new h(f.INVALID_PAGE_VIEW_THROTTLE, "config");
    if (s.clickThrottleMs !== void 0 && (typeof s.clickThrottleMs != "number" || s.clickThrottleMs < 0))
      throw new h(f.INVALID_CLICK_THROTTLE, "config");
    if (s.maxSameEventPerMinute !== void 0 && (typeof s.maxSameEventPerMinute != "number" || s.maxSameEventPerMinute <= 0))
      throw new h(f.INVALID_MAX_SAME_EVENT_PER_MINUTE, "config");
    if (s.viewport !== void 0 && ht(s.viewport), s.webVitalsMode !== void 0) {
      if (typeof s.webVitalsMode != "string")
        throw new h(
          `Invalid webVitalsMode type: ${typeof s.webVitalsMode}. Must be a string`,
          "config"
        );
      const e = ["all", "needs-improvement", "poor"];
      if (!e.includes(s.webVitalsMode))
        throw new h(
          `Invalid webVitalsMode: "${s.webVitalsMode}". Must be one of: ${e.join(", ")}`,
          "config"
        );
    }
    if (s.webVitalsThresholds !== void 0) {
      if (typeof s.webVitalsThresholds != "object" || s.webVitalsThresholds === null || Array.isArray(s.webVitalsThresholds))
        throw new h("webVitalsThresholds must be an object", "config");
      const e = ["LCP", "FCP", "CLS", "INP", "TTFB", "LONG_TASK"];
      for (const [t, r] of Object.entries(s.webVitalsThresholds)) {
        if (!e.includes(t))
          throw new h(
            `Invalid Web Vitals threshold key: "${t}". Must be one of: ${e.join(", ")}`,
            "config"
          );
        if (typeof r != "number" || !Number.isFinite(r) || r < 0)
          throw new h(
            `Invalid Web Vitals threshold value for ${t}: ${r}. Must be a non-negative finite number`,
            "config"
          );
      }
    }
  }
}, ht = (s) => {
  if (typeof s != "object" || s === null)
    throw new h(f.INVALID_VIEWPORT_CONFIG, "config");
  if (!s.elements || !Array.isArray(s.elements))
    throw new h(f.INVALID_VIEWPORT_ELEMENTS, "config");
  if (s.elements.length === 0)
    throw new h(f.INVALID_VIEWPORT_ELEMENTS, "config");
  const e = /* @__PURE__ */ new Set();
  for (const t of s.elements) {
    if (!t.selector || typeof t.selector != "string" || !t.selector.trim())
      throw new h(f.INVALID_VIEWPORT_ELEMENT, "config");
    const r = t.selector.trim();
    if (e.has(r))
      throw new h(
        `Duplicate viewport selector found: "${r}". Each selector should appear only once.`,
        "config"
      );
    if (e.add(r), t.id !== void 0 && (typeof t.id != "string" || !t.id.trim()))
      throw new h(f.INVALID_VIEWPORT_ELEMENT_ID, "config");
    if (t.name !== void 0 && (typeof t.name != "string" || !t.name.trim()))
      throw new h(f.INVALID_VIEWPORT_ELEMENT_NAME, "config");
  }
  if (s.threshold !== void 0 && (typeof s.threshold != "number" || s.threshold < 0 || s.threshold > 1))
    throw new h(f.INVALID_VIEWPORT_THRESHOLD, "config");
  if (s.minDwellTime !== void 0 && (typeof s.minDwellTime != "number" || s.minDwellTime < 0))
    throw new h(f.INVALID_VIEWPORT_MIN_DWELL_TIME, "config");
  if (s.cooldownPeriod !== void 0 && (typeof s.cooldownPeriod != "number" || s.cooldownPeriod < 0))
    throw new h(f.INVALID_VIEWPORT_COOLDOWN_PERIOD, "config");
  if (s.maxTrackedElements !== void 0 && (typeof s.maxTrackedElements != "number" || s.maxTrackedElements <= 0))
    throw new h(f.INVALID_VIEWPORT_MAX_TRACKED_ELEMENTS, "config");
}, ft = (s) => {
  if (s) {
    if (s.tracelog && (!s.tracelog.projectId || typeof s.tracelog.projectId != "string" || s.tracelog.projectId.trim() === ""))
      throw new M(f.INVALID_TRACELOG_PROJECT_ID, "config");
    if (s.custom) {
      if (!s.custom.collectApiUrl || typeof s.custom.collectApiUrl != "string" || s.custom.collectApiUrl.trim() === "")
        throw new M(f.INVALID_CUSTOM_API_URL, "config");
      if (s.custom.allowHttp !== void 0 && typeof s.custom.allowHttp != "boolean")
        throw new M("allowHttp must be a boolean", "config");
      const e = s.custom.collectApiUrl.trim();
      if (!e.startsWith("http://") && !e.startsWith("https://"))
        throw new M('Custom API URL must start with "http://" or "https://"', "config");
      if (!(s.custom.allowHttp ?? !1) && e.startsWith("http://"))
        throw new M(
          "Custom API URL must use HTTPS in production. Set allowHttp: true in integration config to allow HTTP (not recommended)",
          "config"
        );
    }
    if (s.googleAnalytics) {
      if (!s.googleAnalytics.measurementId || typeof s.googleAnalytics.measurementId != "string" || s.googleAnalytics.measurementId.trim() === "")
        throw new M(f.INVALID_GOOGLE_ANALYTICS_ID, "config");
      if (!s.googleAnalytics.measurementId.trim().match(/^(G-|UA-)/))
        throw new M('Google Analytics measurement ID must start with "G-" or "UA-"', "config");
    }
  }
}, Et = (s) => {
  dt(s);
  const e = {
    ...s ?? {},
    sessionTimeout: s?.sessionTimeout ?? 9e5,
    globalMetadata: s?.globalMetadata ?? {},
    sensitiveQueryParams: s?.sensitiveQueryParams ?? [],
    errorSampling: s?.errorSampling ?? Ne,
    samplingRate: s?.samplingRate ?? 1,
    pageViewThrottleMs: s?.pageViewThrottleMs ?? 1e3,
    clickThrottleMs: s?.clickThrottleMs ?? 300,
    maxSameEventPerMinute: s?.maxSameEventPerMinute ?? 60
  };
  return e.integrations?.custom && (e.integrations.custom = {
    ...e.integrations.custom,
    allowHttp: e.integrations.custom.allowHttp ?? !1
  }), e.viewport && (e.viewport = {
    ...e.viewport,
    threshold: e.viewport.threshold ?? 0.5,
    minDwellTime: e.viewport.minDwellTime ?? 2e3,
    cooldownPeriod: e.viewport.cooldownPeriod ?? 6e4,
    maxTrackedElements: e.viewport.maxTrackedElements ?? 100
  }), e;
}, mt = (s) => {
  if (typeof s == "string")
    return !0;
  if (typeof s == "object" && s !== null && !Array.isArray(s)) {
    const e = Object.entries(s);
    if (e.length > 20)
      return !1;
    for (const [, t] of e) {
      if (t == null)
        continue;
      const r = typeof t;
      if (r !== "string" && r !== "number" && r !== "boolean")
        return !1;
    }
    return !0;
  }
  return !1;
}, Re = (s, e = 0) => {
  if (typeof s != "object" || s === null || e > 1)
    return !1;
  for (const t of Object.values(s)) {
    if (t == null)
      continue;
    const r = typeof t;
    if (!(r === "string" || r === "number" || r === "boolean")) {
      if (Array.isArray(t)) {
        if (t.length === 0)
          continue;
        if (typeof t[0] == "string") {
          if (!t.every((o) => typeof o == "string"))
            return !1;
        } else if (!t.every((o) => mt(o)))
          return !1;
        continue;
      }
      if (r === "object" && e === 0) {
        if (!Re(t, e + 1))
          return !1;
        continue;
      }
      return !1;
    }
  }
  return !0;
}, gt = (s) => typeof s != "string" ? {
  valid: !1,
  error: "Event name must be a string"
} : s.length === 0 ? {
  valid: !1,
  error: "Event name cannot be empty"
} : s.length > 120 ? {
  valid: !1,
  error: "Event name is too long (max 120 characters)"
} : s.includes("<") || s.includes(">") || s.includes("&") ? {
  valid: !1,
  error: "Event name contains invalid characters"
} : ["constructor", "prototype", "__proto__", "eval", "function", "var", "let", "const"].includes(s.toLowerCase()) ? {
  valid: !1,
  error: "Event name cannot be a reserved word"
} : { valid: !0 }, we = (s, e, t) => {
  const r = ut(e), n = `${t} "${s}" metadata error`;
  if (!Re(r))
    return {
      valid: !1,
      error: `${n}: object has invalid types. Valid types are string, number, boolean or string arrays.`
    };
  let i;
  try {
    i = JSON.stringify(r);
  } catch {
    return {
      valid: !1,
      error: `${n}: object contains circular references or cannot be serialized.`
    };
  }
  if (i.length > 8192)
    return {
      valid: !1,
      error: `${n}: object is too large (max ${8192 / 1024} KB).`
    };
  if (Object.keys(r).length > 10)
    return {
      valid: !1,
      error: `${n}: object has too many keys (max 10 keys).`
    };
  for (const [l, c] of Object.entries(r)) {
    if (Array.isArray(c)) {
      if (c.length > 10)
        return {
          valid: !1,
          error: `${n}: array property "${l}" is too large (max 10 items).`
        };
      for (const d of c)
        if (typeof d == "string" && d.length > 500)
          return {
            valid: !1,
            error: `${n}: array property "${l}" contains strings that are too long (max 500 characters).`
          };
    }
    if (typeof c == "string" && c.length > 1e3)
      return {
        valid: !1,
        error: `${n}: property "${l}" is too long (max 1000 characters).`
      };
  }
  return {
    valid: !0,
    sanitizedMetadata: r
  };
}, St = (s, e, t) => {
  if (Array.isArray(e)) {
    const r = [], n = `${t} "${s}" metadata error`;
    for (let i = 0; i < e.length; i++) {
      const o = e[i];
      if (typeof o != "object" || o === null || Array.isArray(o))
        return {
          valid: !1,
          error: `${n}: array item at index ${i} must be an object.`
        };
      const l = we(s, o, t);
      if (!l.valid)
        return {
          valid: !1,
          error: `${n}: array item at index ${i} is invalid: ${l.error}`
        };
      l.sanitizedMetadata && r.push(l.sanitizedMetadata);
    }
    return {
      valid: !0,
      sanitizedMetadata: r
    };
  }
  return we(s, e, t);
}, Tt = (s, e) => {
  const t = gt(s);
  if (!t.valid)
    return a("error", "Event name validation failed", {
      showToClient: !0,
      data: { eventName: s, error: t.error }
    }), t;
  if (!e)
    return { valid: !0 };
  const r = St(s, e, "customEvent");
  return r.valid || a("error", "Event metadata validation failed", {
    showToClient: !0,
    data: {
      eventName: s,
      error: r.error
    }
  }), r;
};
class _t {
  listeners = /* @__PURE__ */ new Map();
  on(e, t) {
    this.listeners.has(e) || this.listeners.set(e, []), this.listeners.get(e).push(t);
  }
  off(e, t) {
    const r = this.listeners.get(e);
    if (r) {
      const n = r.indexOf(t);
      n > -1 && r.splice(n, 1);
    }
  }
  emit(e, t) {
    const r = this.listeners.get(e);
    r && r.forEach((n) => {
      n(t);
    });
  }
  removeAllListeners() {
    this.listeners.clear();
  }
}
const Q = {};
class S {
  get(e) {
    return Q[e];
  }
  set(e, t) {
    Q[e] = t;
  }
  getState() {
    return { ...Q };
  }
}
class pt extends S {
  storeManager;
  lastPermanentErrorLog = null;
  recoveryInProgress = !1;
  constructor(e) {
    super(), this.storeManager = e;
  }
  getQueueStorageKey() {
    const e = this.get("userId") || "anonymous";
    return Ye(e);
  }
  sendEventsQueueSync(e) {
    return this.shouldSkipSend() ? !0 : this.get("config")?.integrations?.custom?.collectApiUrl === q.Fail ? (a("warn", "Fail mode: simulating network failure (sync)", {
      data: { events: e.events.length }
    }), !1) : this.sendQueueSyncInternal(e);
  }
  async sendEventsQueue(e, t) {
    try {
      const r = await this.send(e);
      return r ? (this.clearPersistedEvents(), t?.onSuccess?.(e.events.length, e.events, e)) : (this.persistEvents(e), t?.onFailure?.()), r;
    } catch (r) {
      return r instanceof R ? (this.logPermanentError("Permanent error, not retrying", r), this.clearPersistedEvents(), t?.onFailure?.(), !1) : (this.persistEvents(e), t?.onFailure?.(), !1);
    }
  }
  async recoverPersistedEvents(e) {
    if (this.recoveryInProgress) {
      a("debug", "Recovery already in progress, skipping duplicate attempt");
      return;
    }
    this.recoveryInProgress = !0;
    try {
      const t = this.getPersistedData();
      if (!t || !this.isDataRecent(t) || t.events.length === 0) {
        this.clearPersistedEvents();
        return;
      }
      const r = this.createRecoveryBody(t);
      await this.send(r) ? (this.clearPersistedEvents(), e?.onSuccess?.(t.events.length, t.events, r)) : e?.onFailure?.();
    } catch (t) {
      if (t instanceof R) {
        this.logPermanentError("Permanent error during recovery, clearing persisted events", t), this.clearPersistedEvents(), e?.onFailure?.();
        return;
      }
      a("error", "Failed to recover persisted events", { error: t });
    } finally {
      this.recoveryInProgress = !1;
    }
  }
  stop() {
  }
  async send(e) {
    if (this.shouldSkipSend())
      return this.simulateSuccessfulSend();
    if (this.get("config")?.integrations?.custom?.collectApiUrl === q.Fail)
      return a("warn", "Fail mode: simulating network failure", {
        data: { events: e.events.length }
      }), !1;
    const { url: r, payload: n } = this.prepareRequest(e);
    try {
      return (await this.sendWithTimeout(r, n)).ok;
    } catch (i) {
      if (i instanceof R)
        throw i;
      return a("error", "Send request failed", {
        error: i,
        data: {
          events: e.events.length,
          url: r.replace(/\/\/[^/]+/, "//[DOMAIN]")
        }
      }), !1;
    }
  }
  async sendWithTimeout(e, t) {
    const r = new AbortController(), n = setTimeout(() => {
      r.abort();
    }, 1e4);
    try {
      const i = await fetch(e, {
        method: "POST",
        body: t,
        keepalive: !0,
        credentials: "include",
        signal: r.signal,
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (!i.ok)
        throw i.status >= 400 && i.status < 500 ? new R(`HTTP ${i.status}: ${i.statusText}`, i.status) : new Error(`HTTP ${i.status}: ${i.statusText}`);
      return i;
    } finally {
      clearTimeout(n);
    }
  }
  sendQueueSyncInternal(e) {
    const { url: t, payload: r } = this.prepareRequest(e);
    if (r.length > 65536)
      return a("warn", "Payload exceeds sendBeacon limit, persisting for recovery", {
        data: {
          size: r.length,
          limit: 65536,
          events: e.events.length
        }
      }), this.persistEvents(e), !1;
    const n = new Blob([r], { type: "application/json" });
    if (!this.isSendBeaconAvailable())
      return a("warn", "sendBeacon not available, persisting events for recovery"), this.persistEvents(e), !1;
    const i = navigator.sendBeacon(t, n);
    return i || (a("warn", "sendBeacon rejected request, persisting events for recovery"), this.persistEvents(e)), i;
  }
  prepareRequest(e) {
    const t = {
      ...e,
      _metadata: {
        referer: typeof window < "u" ? window.location.href : void 0,
        timestamp: Date.now()
      }
    };
    return {
      url: this.get("collectApiUrl"),
      payload: JSON.stringify(t)
    };
  }
  getPersistedData() {
    try {
      const e = this.getQueueStorageKey(), t = this.storeManager.getItem(e);
      if (t)
        return JSON.parse(t);
    } catch (e) {
      a("warn", "Failed to parse persisted data", { error: e }), this.clearPersistedEvents();
    }
    return null;
  }
  isDataRecent(e) {
    return !e.timestamp || typeof e.timestamp != "number" ? !1 : (Date.now() - e.timestamp) / (1e3 * 60 * 60) < 2;
  }
  createRecoveryBody(e) {
    const { timestamp: t, ...r } = e;
    return r;
  }
  persistEvents(e) {
    try {
      const t = this.getPersistedData();
      if (t && t.timestamp) {
        const i = Date.now() - t.timestamp;
        if (i < 1e3)
          return a("debug", "Skipping persistence, another tab recently persisted events", {
            data: { timeSinceExisting: i }
          }), !0;
      }
      const r = {
        ...e,
        timestamp: Date.now()
      }, n = this.getQueueStorageKey();
      return this.storeManager.setItem(n, JSON.stringify(r)), !!this.storeManager.getItem(n);
    } catch (t) {
      return a("warn", "Failed to persist events", { error: t }), !1;
    }
  }
  clearPersistedEvents() {
    try {
      const e = this.getQueueStorageKey();
      this.storeManager.removeItem(e);
    } catch (e) {
      a("warn", "Failed to clear persisted events", { error: e });
    }
  }
  shouldSkipSend() {
    return !this.get("collectApiUrl");
  }
  async simulateSuccessfulSend() {
    const e = Math.random() * 400 + 100;
    return await new Promise((t) => setTimeout(t, e)), !0;
  }
  isSendBeaconAvailable() {
    return typeof navigator < "u" && typeof navigator.sendBeacon == "function";
  }
  logPermanentError(e, t) {
    const r = Date.now();
    (!this.lastPermanentErrorLog || this.lastPermanentErrorLog.statusCode !== t.statusCode || r - this.lastPermanentErrorLog.timestamp >= nt) && (a("error", e, {
      data: { status: t.statusCode, message: t.message }
    }), this.lastPermanentErrorLog = { statusCode: t.statusCode, timestamp: r });
  }
}
class It extends S {
  googleAnalytics;
  dataSender;
  emitter;
  eventsQueue = [];
  pendingEventsBuffer = [];
  recentEventFingerprints = /* @__PURE__ */ new Map();
  // Time-based deduplication cache
  sendIntervalId = null;
  rateLimitCounter = 0;
  rateLimitWindowStart = 0;
  perEventRateLimits = /* @__PURE__ */ new Map();
  sessionEventCounts = {
    total: 0,
    [u.CLICK]: 0,
    [u.PAGE_VIEW]: 0,
    [u.CUSTOM]: 0,
    [u.VIEWPORT_VISIBLE]: 0,
    [u.SCROLL]: 0
  };
  lastSessionId = null;
  constructor(e, t = null, r = null) {
    super(), this.googleAnalytics = t, this.dataSender = new pt(e), this.emitter = r;
  }
  async recoverPersistedEvents() {
    await this.dataSender.recoverPersistedEvents({
      onSuccess: (e, t, r) => {
        if (t && t.length > 0) {
          const n = t.map((i) => i.id);
          this.removeProcessedEvents(n), r && this.emitEventsQueue(r);
        }
      },
      onFailure: () => {
        a("warn", "Failed to recover persisted events");
      }
    });
  }
  track({
    type: e,
    page_url: t,
    from_page_url: r,
    scroll_data: n,
    click_data: i,
    custom_event: o,
    web_vitals: l,
    error_data: c,
    session_end_reason: d,
    viewport_data: T
  }) {
    if (!e) {
      a("error", "Event type is required - event will be ignored");
      return;
    }
    const m = this.get("sessionId");
    if (!m) {
      this.pendingEventsBuffer.length >= 100 && (this.pendingEventsBuffer.shift(), a("warn", "Pending events buffer full - dropping oldest event", {
        data: { maxBufferSize: 100 }
      })), this.pendingEventsBuffer.push({
        type: e,
        page_url: t,
        from_page_url: r,
        scroll_data: n,
        click_data: i,
        custom_event: o,
        web_vitals: l,
        error_data: c,
        session_end_reason: d,
        viewport_data: T
      });
      return;
    }
    this.lastSessionId !== m && (this.lastSessionId = m, this.sessionEventCounts = {
      total: 0,
      [u.CLICK]: 0,
      [u.PAGE_VIEW]: 0,
      [u.CUSTOM]: 0,
      [u.VIEWPORT_VISIBLE]: 0,
      [u.SCROLL]: 0
    });
    const v = e === u.SESSION_START || e === u.SESSION_END;
    if (!v && !this.checkRateLimit())
      return;
    const g = e;
    if (!v) {
      if (this.sessionEventCounts.total >= 1e3) {
        a("warn", "Session event limit reached", {
          data: {
            type: g,
            total: this.sessionEventCounts.total,
            limit: 1e3
          }
        });
        return;
      }
      const A = this.getTypeLimitForEvent(g);
      if (A) {
        const j = this.sessionEventCounts[g];
        if (j !== void 0 && j >= A) {
          a("warn", "Session event type limit reached", {
            data: {
              type: g,
              count: j,
              limit: A
            }
          });
          return;
        }
      }
    }
    if (g === u.CUSTOM && o?.name) {
      const A = this.get("config")?.maxSameEventPerMinute ?? 60;
      if (!this.checkPerEventRateLimit(o.name, A))
        return;
    }
    const He = g === u.SESSION_START, Ue = t || this.get("pageUrl"), z = this.buildEventPayload({
      type: g,
      page_url: Ue,
      from_page_url: r,
      scroll_data: n,
      click_data: i,
      custom_event: o,
      web_vitals: l,
      error_data: c,
      session_end_reason: d,
      viewport_data: T
    });
    if (!(!v && !this.shouldSample())) {
      if (He) {
        const A = this.get("sessionId");
        if (!A) {
          a("error", "Session start event requires sessionId - event will be ignored");
          return;
        }
        if (this.get("hasStartSession")) {
          a("warn", "Duplicate session_start detected", {
            data: { sessionId: A }
          });
          return;
        }
        this.set("hasStartSession", !0);
      }
      if (!this.isDuplicateEvent(z)) {
        if (this.get("mode") === D.QA && g === u.CUSTOM && o) {
          console.log("[TraceLog] Event", {
            name: o.name,
            ...o.metadata && { metadata: o.metadata }
          }), this.emitEvent(z);
          return;
        }
        this.addToQueue(z), v || (this.sessionEventCounts.total++, this.sessionEventCounts[g] !== void 0 && this.sessionEventCounts[g]++);
      }
    }
  }
  stop() {
    this.sendIntervalId && (clearInterval(this.sendIntervalId), this.sendIntervalId = null), this.eventsQueue = [], this.pendingEventsBuffer = [], this.recentEventFingerprints.clear(), this.rateLimitCounter = 0, this.rateLimitWindowStart = 0, this.perEventRateLimits.clear(), this.sessionEventCounts = {
      total: 0,
      [u.CLICK]: 0,
      [u.PAGE_VIEW]: 0,
      [u.CUSTOM]: 0,
      [u.VIEWPORT_VISIBLE]: 0,
      [u.SCROLL]: 0
    }, this.lastSessionId = null, this.dataSender.stop();
  }
  async flushImmediately() {
    return this.flushEvents(!1);
  }
  flushImmediatelySync() {
    return this.flushEvents(!0);
  }
  getQueueLength() {
    return this.eventsQueue.length;
  }
  flushPendingEvents() {
    if (this.pendingEventsBuffer.length === 0)
      return;
    if (!this.get("sessionId")) {
      a("warn", "Cannot flush pending events: session not initialized - keeping in buffer", {
        data: { bufferedEventCount: this.pendingEventsBuffer.length }
      });
      return;
    }
    const t = [...this.pendingEventsBuffer];
    this.pendingEventsBuffer = [], t.forEach((r) => {
      this.track(r);
    });
  }
  clearSendInterval() {
    this.sendIntervalId && (clearInterval(this.sendIntervalId), this.sendIntervalId = null);
  }
  flushEvents(e) {
    if (this.eventsQueue.length === 0)
      return e ? !0 : Promise.resolve(!0);
    const t = this.buildEventsPayload(), r = [...this.eventsQueue], n = r.map((i) => i.id);
    if (e) {
      const i = this.dataSender.sendEventsQueueSync(t);
      return i ? (this.removeProcessedEvents(n), this.clearSendInterval(), this.emitEventsQueue(t)) : (this.removeProcessedEvents(n), this.clearSendInterval()), i;
    } else
      return this.dataSender.sendEventsQueue(t, {
        onSuccess: () => {
          this.removeProcessedEvents(n), this.clearSendInterval(), this.emitEventsQueue(t);
        },
        onFailure: () => {
          this.removeProcessedEvents(n), this.eventsQueue.length === 0 && this.clearSendInterval(), a("warn", "Async flush failed, removed from queue and persisted for recovery on next page load", {
            data: { eventCount: r.length }
          });
        }
      });
  }
  async sendEventsQueue() {
    if (!this.get("sessionId") || this.eventsQueue.length === 0)
      return;
    const e = this.buildEventsPayload(), t = [...this.eventsQueue], r = t.map((n) => n.id);
    await this.dataSender.sendEventsQueue(e, {
      onSuccess: () => {
        this.removeProcessedEvents(r), this.emitEventsQueue(e);
      },
      onFailure: () => {
        this.removeProcessedEvents(r), this.eventsQueue.length === 0 && this.clearSendInterval(), a("warn", "Events send failed, removed from queue and persisted for recovery on next page load", {
          data: { eventCount: t.length }
        });
      }
    });
  }
  buildEventsPayload() {
    const e = /* @__PURE__ */ new Map(), t = [];
    for (const n of this.eventsQueue) {
      const i = this.createEventSignature(n);
      e.has(i) || t.push(i), e.set(i, n);
    }
    const r = t.map((n) => e.get(n)).filter((n) => !!n).sort((n, i) => n.timestamp - i.timestamp);
    return {
      user_id: this.get("userId"),
      session_id: this.get("sessionId"),
      device: this.get("device"),
      events: r,
      ...this.get("config")?.globalMetadata && { global_metadata: this.get("config")?.globalMetadata }
    };
  }
  buildEventPayload(e) {
    const t = e.type === u.SESSION_START, r = e.page_url ?? this.get("pageUrl");
    return {
      id: lt(),
      type: e.type,
      page_url: r,
      timestamp: Date.now(),
      ...t && { referrer: document.referrer || "Direct" },
      ...e.from_page_url && { from_page_url: e.from_page_url },
      ...e.scroll_data && { scroll_data: e.scroll_data },
      ...e.click_data && { click_data: e.click_data },
      ...e.custom_event && { custom_event: e.custom_event },
      ...e.web_vitals && { web_vitals: e.web_vitals },
      ...e.error_data && { error_data: e.error_data },
      ...e.session_end_reason && { session_end_reason: e.session_end_reason },
      ...e.viewport_data && { viewport_data: e.viewport_data },
      ...t && pe() && { utm: pe() }
    };
  }
  /**
   * Checks if event is a duplicate using time-based cache
   * Tracks recent event fingerprints with timestamp-based cleanup
   */
  isDuplicateEvent(e) {
    const t = Date.now(), r = this.createEventFingerprint(e), n = this.recentEventFingerprints.get(r);
    return n && t - n < 500 ? (this.recentEventFingerprints.set(r, t), !0) : (this.recentEventFingerprints.set(r, t), this.recentEventFingerprints.size > 1e3 && this.pruneOldFingerprints(), this.recentEventFingerprints.size > 2e3 && (this.recentEventFingerprints.clear(), this.recentEventFingerprints.set(r, t), a("warn", "Event fingerprint cache exceeded hard limit, cleared", {
      data: { hardLimit: 2e3 }
    })), !1);
  }
  /**
   * Prunes old fingerprints from cache based on timestamp
   * Removes entries older than 10x the duplicate threshold (5 seconds)
   */
  pruneOldFingerprints() {
    const e = Date.now(), t = 500 * 10;
    for (const [r, n] of this.recentEventFingerprints.entries())
      e - n > t && this.recentEventFingerprints.delete(r);
    a("debug", "Pruned old event fingerprints", {
      data: {
        remaining: this.recentEventFingerprints.size,
        cutoffMs: t
      }
    });
  }
  createEventFingerprint(e) {
    let t = `${e.type}_${e.page_url}`;
    if (e.click_data) {
      const r = Math.round((e.click_data.x || 0) / 10) * 10, n = Math.round((e.click_data.y || 0) / 10) * 10;
      t += `_click_${r}_${n}`;
    }
    return e.scroll_data && (t += `_scroll_${e.scroll_data.depth}_${e.scroll_data.direction}`), e.custom_event && (t += `_custom_${e.custom_event.name}`), e.web_vitals && (t += `_vitals_${e.web_vitals.type}`), e.error_data && (t += `_error_${e.error_data.type}_${e.error_data.message}`), t;
  }
  createEventSignature(e) {
    return this.createEventFingerprint(e);
  }
  addToQueue(e) {
    if (this.eventsQueue.push(e), this.emitEvent(e), this.eventsQueue.length > 100) {
      const t = this.eventsQueue.findIndex(
        (n) => n.type !== u.SESSION_START && n.type !== u.SESSION_END
      ), r = t >= 0 ? this.eventsQueue.splice(t, 1)[0] : this.eventsQueue.shift();
      a("warn", "Event queue overflow, oldest non-critical event removed", {
        data: {
          maxLength: 100,
          currentLength: this.eventsQueue.length,
          removedEventType: r?.type,
          wasCritical: r?.type === u.SESSION_START || r?.type === u.SESSION_END
        }
      });
    }
    this.sendIntervalId || this.startSendInterval(), this.eventsQueue.length >= 50 && this.sendEventsQueue(), this.handleGoogleAnalyticsIntegration(e);
  }
  startSendInterval() {
    this.sendIntervalId = window.setInterval(() => {
      this.eventsQueue.length > 0 && this.sendEventsQueue();
    }, 1e4);
  }
  handleGoogleAnalyticsIntegration(e) {
    if (this.googleAnalytics && e.type === u.CUSTOM && e.custom_event) {
      if (this.get("mode") === D.QA)
        return;
      this.googleAnalytics.trackEvent(e.custom_event.name, e.custom_event.metadata ?? {});
    }
  }
  shouldSample() {
    const e = this.get("config")?.samplingRate ?? 1;
    return Math.random() < e;
  }
  checkRateLimit() {
    const e = Date.now();
    return e - this.rateLimitWindowStart > 1e3 && (this.rateLimitCounter = 0, this.rateLimitWindowStart = e), this.rateLimitCounter >= 50 ? !1 : (this.rateLimitCounter++, !0);
  }
  /**
   * Checks per-event-name rate limiting to prevent infinite loops in user code
   * Tracks timestamps per event name and limits to maxSameEventPerMinute per minute
   */
  checkPerEventRateLimit(e, t) {
    const r = Date.now(), i = (this.perEventRateLimits.get(e) ?? []).filter((o) => r - o < 6e4);
    return i.length >= t ? (a("warn", "Per-event rate limit exceeded for custom event", {
      data: {
        eventName: e,
        limit: t,
        window: `${6e4 / 1e3}s`
      }
    }), !1) : (i.push(r), this.perEventRateLimits.set(e, i), !0);
  }
  /**
   * Gets the per-session limit for a specific event type (Phase 3)
   */
  getTypeLimitForEvent(e) {
    return {
      [u.CLICK]: 500,
      [u.PAGE_VIEW]: 100,
      [u.CUSTOM]: 500,
      [u.VIEWPORT_VISIBLE]: 200,
      [u.SCROLL]: 120
    }[e] ?? null;
  }
  removeProcessedEvents(e) {
    const t = new Set(e);
    this.eventsQueue = this.eventsQueue.filter((r) => !t.has(r.id));
  }
  emitEvent(e) {
    this.emitter && this.emitter.emit(Z.EVENT, e);
  }
  emitEventsQueue(e) {
    this.emitter && this.emitter.emit(Z.QUEUE, e);
  }
}
class vt {
  /**
   * Gets or creates a unique user ID for the given project.
   * The user ID is persisted in localStorage and reused across sessions.
   *
   * @param storageManager - Storage manager instance
   * @param projectId - Project identifier for namespacing
   * @returns Persistent unique user ID
   */
  static getId(e) {
    const t = Qe, r = e.getItem(t);
    if (r)
      return r;
    const n = at();
    return e.setItem(t, n), n;
  }
}
class wt extends S {
  storageManager;
  eventManager;
  projectId;
  sessionTimeoutId = null;
  broadcastChannel = null;
  activityHandler = null;
  visibilityChangeHandler = null;
  beforeUnloadHandler = null;
  isTracking = !1;
  constructor(e, t, r) {
    super(), this.storageManager = e, this.eventManager = t, this.projectId = r;
  }
  initCrossTabSync() {
    if (typeof BroadcastChannel > "u") {
      a("warn", "BroadcastChannel not supported");
      return;
    }
    const e = this.getProjectId();
    this.broadcastChannel = new BroadcastChannel(qe(e)), this.broadcastChannel.onmessage = (t) => {
      const { action: r, sessionId: n, timestamp: i, projectId: o } = t.data ?? {};
      if (o === e) {
        if (r === "session_end") {
          this.resetSessionState();
          return;
        }
        n && typeof i == "number" && i > Date.now() - 5e3 && (this.set("sessionId", n), this.set("hasStartSession", !0), this.persistSession(n, i), this.isTracking && this.setupSessionTimeout());
      }
    };
  }
  shareSession(e) {
    this.broadcastChannel && typeof this.broadcastChannel.postMessage == "function" && this.broadcastChannel.postMessage({
      action: "session_start",
      projectId: this.getProjectId(),
      sessionId: e,
      timestamp: Date.now()
    });
  }
  broadcastSessionEnd(e, t) {
    if (e && this.broadcastChannel && typeof this.broadcastChannel.postMessage == "function")
      try {
        this.broadcastChannel.postMessage({
          action: "session_end",
          projectId: this.getProjectId(),
          sessionId: e,
          reason: t,
          timestamp: Date.now()
        });
      } catch (r) {
        a("warn", "Failed to broadcast session end", { error: r, data: { sessionId: e, reason: t } });
      }
  }
  cleanupCrossTabSync() {
    this.broadcastChannel && (typeof this.broadcastChannel.close == "function" && this.broadcastChannel.close(), this.broadcastChannel = null);
  }
  recoverSession() {
    const e = this.loadStoredSession();
    if (!e)
      return null;
    const t = this.get("config")?.sessionTimeout ?? 9e5;
    return Date.now() - e.lastActivity > t ? (this.clearStoredSession(), null) : e.id;
  }
  persistSession(e, t = Date.now()) {
    this.saveStoredSession({
      id: e,
      lastActivity: t
    });
  }
  clearStoredSession() {
    const e = this.getSessionStorageKey();
    this.storageManager.removeItem(e);
  }
  loadStoredSession() {
    const e = this.getSessionStorageKey(), t = this.storageManager.getItem(e);
    if (!t)
      return null;
    try {
      const r = JSON.parse(t);
      return !r.id || typeof r.lastActivity != "number" ? null : r;
    } catch {
      return this.storageManager.removeItem(e), null;
    }
  }
  saveStoredSession(e) {
    const t = this.getSessionStorageKey();
    this.storageManager.setItem(t, JSON.stringify(e));
  }
  getSessionStorageKey() {
    return Ke(this.getProjectId());
  }
  getProjectId() {
    return this.projectId;
  }
  startTracking() {
    if (this.isTracking) {
      a("warn", "Session tracking already active");
      return;
    }
    const e = this.recoverSession(), t = e ?? this.generateSessionId(), r = !!e;
    this.isTracking = !0;
    try {
      this.set("sessionId", t), this.persistSession(t), r || this.eventManager.track({
        type: u.SESSION_START
      }), this.initCrossTabSync(), this.shareSession(t), this.setupSessionTimeout(), this.setupActivityListeners(), this.setupLifecycleListeners();
    } catch (n) {
      throw this.isTracking = !1, this.clearSessionTimeout(), this.cleanupActivityListeners(), this.cleanupLifecycleListeners(), this.cleanupCrossTabSync(), this.set("sessionId", null), n;
    }
  }
  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
  setupSessionTimeout() {
    this.clearSessionTimeout();
    const e = this.get("config")?.sessionTimeout ?? 9e5;
    this.sessionTimeoutId = setTimeout(() => {
      this.endSession("inactivity");
    }, e);
  }
  resetSessionTimeout() {
    this.setupSessionTimeout();
    const e = this.get("sessionId");
    e && this.persistSession(e);
  }
  clearSessionTimeout() {
    this.sessionTimeoutId && (clearTimeout(this.sessionTimeoutId), this.sessionTimeoutId = null);
  }
  setupActivityListeners() {
    this.activityHandler = () => {
      this.resetSessionTimeout();
    }, document.addEventListener("click", this.activityHandler, { passive: !0 }), document.addEventListener("keydown", this.activityHandler, { passive: !0 }), document.addEventListener("scroll", this.activityHandler, { passive: !0 });
  }
  cleanupActivityListeners() {
    this.activityHandler && (document.removeEventListener("click", this.activityHandler), document.removeEventListener("keydown", this.activityHandler), document.removeEventListener("scroll", this.activityHandler), this.activityHandler = null);
  }
  setupLifecycleListeners() {
    this.visibilityChangeHandler || this.beforeUnloadHandler || (this.visibilityChangeHandler = () => {
      document.hidden ? this.clearSessionTimeout() : this.get("sessionId") && this.setupSessionTimeout();
    }, this.beforeUnloadHandler = () => {
      this.endSession("page_unload");
    }, document.addEventListener("visibilitychange", this.visibilityChangeHandler), window.addEventListener("beforeunload", this.beforeUnloadHandler));
  }
  cleanupLifecycleListeners() {
    this.visibilityChangeHandler && (document.removeEventListener("visibilitychange", this.visibilityChangeHandler), this.visibilityChangeHandler = null), this.beforeUnloadHandler && (window.removeEventListener("beforeunload", this.beforeUnloadHandler), this.beforeUnloadHandler = null);
  }
  endSession(e) {
    const t = this.get("sessionId");
    if (!t) {
      a("warn", "endSession called without active session", { data: { reason: e } }), this.resetSessionState(e);
      return;
    }
    this.eventManager.track({
      type: u.SESSION_END,
      session_end_reason: e
    }), this.eventManager.flushImmediatelySync() || a("warn", "Sync flush failed during session end, events persisted for recovery", {
      data: { reason: e, sessionId: t }
    }), this.broadcastSessionEnd(t, e), this.resetSessionState(e);
  }
  resetSessionState(e) {
    this.clearSessionTimeout(), this.cleanupActivityListeners(), this.cleanupLifecycleListeners(), this.cleanupCrossTabSync(), e !== "page_unload" && this.clearStoredSession(), this.set("sessionId", null), this.set("hasStartSession", !1), this.isTracking = !1;
  }
  stopTracking() {
    this.endSession("manual_stop");
  }
  destroy() {
    this.clearSessionTimeout(), this.cleanupActivityListeners(), this.cleanupCrossTabSync(), this.cleanupLifecycleListeners(), this.isTracking = !1, this.set("hasStartSession", !1);
  }
}
class At extends S {
  eventManager;
  storageManager;
  sessionManager = null;
  destroyed = !1;
  constructor(e, t) {
    super(), this.eventManager = t, this.storageManager = e;
  }
  startTracking() {
    if (this.isActive())
      return;
    if (this.destroyed) {
      a("warn", "Cannot start tracking on destroyed handler");
      return;
    }
    const e = this.get("config"), t = e?.integrations?.tracelog?.projectId ?? e?.integrations?.custom?.collectApiUrl ?? "default";
    if (!t)
      throw new Error("Cannot start session tracking: config not available");
    try {
      this.sessionManager = new wt(this.storageManager, this.eventManager, t), this.sessionManager.startTracking(), this.eventManager.flushPendingEvents();
    } catch (r) {
      if (this.sessionManager) {
        try {
          this.sessionManager.destroy();
        } catch {
        }
        this.sessionManager = null;
      }
      throw a("error", "Failed to start session tracking", { error: r }), r;
    }
  }
  isActive() {
    return this.sessionManager !== null && !this.destroyed;
  }
  cleanupSessionManager() {
    this.sessionManager && (this.sessionManager.stopTracking(), this.sessionManager.destroy(), this.sessionManager = null);
  }
  stopTracking() {
    this.cleanupSessionManager();
  }
  destroy() {
    this.destroyed || (this.sessionManager && (this.sessionManager.destroy(), this.sessionManager = null), this.destroyed = !0, this.set("hasStartSession", !1));
  }
}
class yt extends S {
  eventManager;
  onTrack;
  originalPushState;
  originalReplaceState;
  lastPageViewTime = 0;
  constructor(e, t) {
    super(), this.eventManager = e, this.onTrack = t;
  }
  startTracking() {
    this.trackInitialPageView(), window.addEventListener("popstate", this.trackCurrentPage, !0), window.addEventListener("hashchange", this.trackCurrentPage, !0), this.patchHistory("pushState"), this.patchHistory("replaceState");
  }
  stopTracking() {
    window.removeEventListener("popstate", this.trackCurrentPage, !0), window.removeEventListener("hashchange", this.trackCurrentPage, !0), this.originalPushState && (window.history.pushState = this.originalPushState), this.originalReplaceState && (window.history.replaceState = this.originalReplaceState), this.lastPageViewTime = 0;
  }
  patchHistory(e) {
    const t = window.history[e];
    e === "pushState" && !this.originalPushState ? this.originalPushState = t : e === "replaceState" && !this.originalReplaceState && (this.originalReplaceState = t), window.history[e] = (...r) => {
      t.apply(window.history, r), this.trackCurrentPage();
    };
  }
  trackCurrentPage = () => {
    const e = window.location.href, t = te(e, this.get("config").sensitiveQueryParams);
    if (this.get("pageUrl") === t)
      return;
    const r = Date.now(), n = this.get("config").pageViewThrottleMs ?? 1e3;
    if (r - this.lastPageViewTime < n)
      return;
    this.lastPageViewTime = r, this.onTrack();
    const i = this.get("pageUrl");
    this.set("pageUrl", t);
    const o = this.extractPageViewData();
    this.eventManager.track({
      type: u.PAGE_VIEW,
      page_url: this.get("pageUrl"),
      from_page_url: i,
      ...o && { page_view: o }
    });
  };
  trackInitialPageView() {
    const e = te(window.location.href, this.get("config").sensitiveQueryParams), t = this.extractPageViewData();
    this.lastPageViewTime = Date.now(), this.eventManager.track({
      type: u.PAGE_VIEW,
      page_url: e,
      ...t && { page_view: t }
    }), this.onTrack();
  }
  extractPageViewData() {
    const { pathname: e, search: t, hash: r } = window.location, { referrer: n } = document, { title: i } = document;
    return !n && !i && !e && !t && !r ? void 0 : {
      ...n && { referrer: n },
      ...i && { title: i },
      ...e && { pathname: e },
      ...t && { search: t },
      ...r && { hash: r }
    };
  }
}
class Lt extends S {
  eventManager;
  lastClickTimes = /* @__PURE__ */ new Map();
  clickHandler;
  lastPruneTime = 0;
  constructor(e) {
    super(), this.eventManager = e;
  }
  startTracking() {
    this.clickHandler || (this.clickHandler = (e) => {
      const t = e, r = t.target, n = typeof HTMLElement < "u" && r instanceof HTMLElement ? r : typeof HTMLElement < "u" && r instanceof Node && r.parentElement instanceof HTMLElement ? r.parentElement : null;
      if (!n) {
        a("warn", "Click target not found or not an element");
        return;
      }
      if (this.shouldIgnoreElement(n))
        return;
      const i = this.get("config")?.clickThrottleMs ?? 300;
      if (i > 0 && !this.checkClickThrottle(n, i))
        return;
      const o = this.findTrackingElement(n), l = this.getRelevantClickElement(n), c = this.calculateClickCoordinates(t, n);
      if (o) {
        const T = this.extractTrackingData(o);
        if (T) {
          const m = this.createCustomEventData(T);
          this.eventManager.track({
            type: u.CUSTOM,
            custom_event: {
              name: m.name,
              ...m.value && { metadata: { value: m.value } }
            }
          });
        }
      }
      const d = this.generateClickData(n, l, c);
      this.eventManager.track({
        type: u.CLICK,
        click_data: d
      });
    }, window.addEventListener("click", this.clickHandler, !0));
  }
  stopTracking() {
    this.clickHandler && (window.removeEventListener("click", this.clickHandler, !0), this.clickHandler = void 0), this.lastClickTimes.clear(), this.lastPruneTime = 0;
  }
  shouldIgnoreElement(e) {
    return e.hasAttribute(`${w}-ignore`) ? !0 : e.closest(`[${w}-ignore]`) !== null;
  }
  /**
   * Checks per-element click throttling to prevent double-clicks and rapid spam
   * Returns true if the click should be tracked, false if throttled
   */
  checkClickThrottle(e, t) {
    const r = this.getElementSignature(e), n = Date.now();
    this.pruneThrottleCache(n);
    const i = this.lastClickTimes.get(r);
    return i !== void 0 && n - i < t ? (a("debug", "ClickHandler: Click suppressed by throttle", {
      data: {
        signature: r,
        throttleRemaining: t - (n - i)
      }
    }), !1) : (this.lastClickTimes.set(r, n), !0);
  }
  /**
   * Prunes stale entries from the throttle cache to prevent memory leaks
   * Uses TTL-based eviction (5 minutes) and enforces max size limit
   * Called during checkClickThrottle with built-in rate limiting (every 30 seconds)
   */
  pruneThrottleCache(e) {
    if (e - this.lastPruneTime < 3e4)
      return;
    this.lastPruneTime = e;
    const t = e - 3e5;
    for (const [r, n] of this.lastClickTimes.entries())
      n < t && this.lastClickTimes.delete(r);
    if (this.lastClickTimes.size > 1e3) {
      const r = Array.from(this.lastClickTimes.entries()).sort((o, l) => o[1] - l[1]), n = this.lastClickTimes.size - 1e3, i = r.slice(0, n);
      for (const [o] of i)
        this.lastClickTimes.delete(o);
      a("debug", "ClickHandler: Pruned throttle cache", {
        data: {
          removed: i.length,
          remaining: this.lastClickTimes.size
        }
      });
    }
  }
  /**
   * Creates a stable signature for an element to track throttling
   * Priority: id > data-testid > data-tlog-name > DOM path
   */
  getElementSignature(e) {
    if (e.id)
      return `#${e.id}`;
    const t = e.getAttribute("data-testid");
    if (t)
      return `[data-testid="${t}"]`;
    const r = e.getAttribute(`${w}-name`);
    return r ? `[${w}-name="${r}"]` : this.getElementPath(e);
  }
  /**
   * Generates a DOM path for an element (e.g., "body>div>button")
   */
  getElementPath(e) {
    const t = [];
    let r = e;
    for (; r && r !== document.body; ) {
      let n = r.tagName.toLowerCase();
      if (r.className) {
        const i = r.className.split(" ")[0];
        i && (n += `.${i}`);
      }
      t.unshift(n), r = r.parentElement;
    }
    return t.join(">") || "unknown";
  }
  findTrackingElement(e) {
    return e.hasAttribute(`${w}-name`) ? e : e.closest(`[${w}-name]`);
  }
  getRelevantClickElement(e) {
    for (const t of xe)
      try {
        if (e.matches(t))
          return e;
        const r = e.closest(t);
        if (r)
          return r;
      } catch (r) {
        a("warn", "Invalid selector in element search", { error: r, data: { selector: t } });
        continue;
      }
    return e;
  }
  clamp(e) {
    return Math.max(0, Math.min(1, Number(e.toFixed(3))));
  }
  calculateClickCoordinates(e, t) {
    const r = t.getBoundingClientRect(), n = e.clientX, i = e.clientY, o = r.width > 0 ? this.clamp((n - r.left) / r.width) : 0, l = r.height > 0 ? this.clamp((i - r.top) / r.height) : 0;
    return { x: n, y: i, relativeX: o, relativeY: l };
  }
  extractTrackingData(e) {
    const t = e.getAttribute(`${w}-name`), r = e.getAttribute(`${w}-value`);
    if (t)
      return {
        element: e,
        name: t,
        ...r && { value: r }
      };
  }
  generateClickData(e, t, r) {
    const { x: n, y: i, relativeX: o, relativeY: l } = r, c = this.getRelevantText(e, t), d = this.extractElementAttributes(t);
    return {
      x: n,
      y: i,
      relativeX: o,
      relativeY: l,
      tag: t.tagName.toLowerCase(),
      ...t.id && { id: t.id },
      ...t.className && { class: t.className },
      ...c && { text: c },
      ...d.href && { href: d.href },
      ...d.title && { title: d.title },
      ...d.alt && { alt: d.alt },
      ...d.role && { role: d.role },
      ...d["aria-label"] && { ariaLabel: d["aria-label"] },
      ...Object.keys(d).length > 0 && { dataAttributes: d }
    };
  }
  sanitizeText(e) {
    let t = e;
    for (const r of Me) {
      const n = new RegExp(r.source, r.flags);
      t = t.replace(n, "[REDACTED]");
    }
    return t;
  }
  getRelevantText(e, t) {
    const r = e.textContent?.trim() ?? "", n = t.textContent?.trim() ?? "";
    if (!r && !n)
      return "";
    let i = "";
    return r && r.length <= 255 ? i = r : n.length <= 255 ? i = n : i = n.slice(0, 252) + "...", this.sanitizeText(i);
  }
  extractElementAttributes(e) {
    const t = [
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
    ], r = {};
    for (const n of t) {
      const i = e.getAttribute(n);
      i && (r[n] = i);
    }
    return r;
  }
  createCustomEventData(e) {
    return {
      name: e.name,
      ...e.value && { value: e.value }
    };
  }
}
class Mt extends S {
  eventManager;
  containers = [];
  limitWarningLogged = !1;
  minDepthChange = 5;
  minIntervalMs = 500;
  maxEventsPerSession = 120;
  containerDiscoveryTimeoutId = null;
  constructor(e) {
    super(), this.eventManager = e;
  }
  startTracking() {
    this.limitWarningLogged = !1, this.applyConfigOverrides(), this.set("scrollEventCount", 0), this.tryDetectScrollContainers(0);
  }
  stopTracking() {
    this.containerDiscoveryTimeoutId !== null && (clearTimeout(this.containerDiscoveryTimeoutId), this.containerDiscoveryTimeoutId = null);
    for (const e of this.containers)
      this.clearContainerTimer(e), e.element === window ? window.removeEventListener("scroll", e.listener) : e.element.removeEventListener("scroll", e.listener);
    this.containers.length = 0, this.set("scrollEventCount", 0), this.limitWarningLogged = !1;
  }
  tryDetectScrollContainers(e) {
    const t = this.findScrollableElements();
    if (this.isWindowScrollable() && this.setupScrollContainer(window, "window"), t.length > 0) {
      for (const r of t) {
        const n = this.getElementSelector(r);
        this.setupScrollContainer(r, n);
      }
      this.applyPrimaryScrollSelectorIfConfigured();
      return;
    }
    if (e < 5) {
      this.containerDiscoveryTimeoutId = window.setTimeout(() => {
        this.containerDiscoveryTimeoutId = null, this.tryDetectScrollContainers(e + 1);
      }, 200);
      return;
    }
    this.containers.length === 0 && this.setupScrollContainer(window, "window"), this.applyPrimaryScrollSelectorIfConfigured();
  }
  applyPrimaryScrollSelectorIfConfigured() {
    const e = this.get("config");
    e?.primaryScrollSelector && this.applyPrimaryScrollSelector(e.primaryScrollSelector);
  }
  findScrollableElements() {
    if (!document.body)
      return [];
    const e = [], t = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, {
      acceptNode: (n) => {
        const i = n;
        if (!i.isConnected || !i.offsetParent)
          return NodeFilter.FILTER_SKIP;
        const o = getComputedStyle(i);
        return o.overflowY === "auto" || o.overflowY === "scroll" || o.overflow === "auto" || o.overflow === "scroll" ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      }
    });
    let r;
    for (; (r = t.nextNode()) && e.length < 10; ) {
      const n = r;
      this.isElementScrollable(n) && e.push(n);
    }
    return e;
  }
  getElementSelector(e) {
    if (e === window)
      return "window";
    const t = e;
    if (t.id)
      return `#${t.id}`;
    if (t.className && typeof t.className == "string") {
      const r = t.className.split(" ").filter((n) => n.trim())[0];
      if (r)
        return `.${r}`;
    }
    return t.tagName.toLowerCase();
  }
  determineIfPrimary(e) {
    return this.isWindowScrollable() ? e === window : this.containers.length === 0;
  }
  setupScrollContainer(e, t) {
    if (this.containers.some((d) => d.element === e) || e !== window && !this.isElementScrollable(e))
      return;
    const n = this.getScrollTop(e), i = this.calculateScrollDepth(
      n,
      this.getScrollHeight(e),
      this.getViewportHeight(e)
    ), o = this.determineIfPrimary(e), l = {
      element: e,
      selector: t,
      isPrimary: o,
      lastScrollPos: n,
      lastDepth: i,
      lastDirection: U.DOWN,
      lastEventTime: 0,
      firstScrollEventTime: null,
      maxDepthReached: i,
      debounceTimer: null,
      listener: null
    }, c = () => {
      this.get("suppressNextScroll") || (l.firstScrollEventTime === null && (l.firstScrollEventTime = Date.now()), this.clearContainerTimer(l), l.debounceTimer = window.setTimeout(() => {
        const d = this.calculateScrollData(l);
        if (d) {
          const T = Date.now();
          this.processScrollEvent(l, d, T);
        }
        l.debounceTimer = null;
      }, 250));
    };
    l.listener = c, this.containers.push(l), e === window ? window.addEventListener("scroll", c, { passive: !0 }) : e.addEventListener("scroll", c, { passive: !0 });
  }
  processScrollEvent(e, t, r) {
    if (!this.shouldEmitScrollEvent(e, t, r))
      return;
    e.lastEventTime = r, e.lastDepth = t.depth, e.lastDirection = t.direction;
    const n = this.get("scrollEventCount") ?? 0;
    this.set("scrollEventCount", n + 1), this.eventManager.track({
      type: u.SCROLL,
      scroll_data: {
        ...t,
        container_selector: e.selector,
        is_primary: e.isPrimary
      }
    });
  }
  shouldEmitScrollEvent(e, t, r) {
    return this.hasReachedSessionLimit() ? (this.logLimitOnce(), !1) : !(!this.hasElapsedMinimumInterval(e, r) || !this.hasSignificantDepthChange(e, t.depth));
  }
  hasReachedSessionLimit() {
    return (this.get("scrollEventCount") ?? 0) >= this.maxEventsPerSession;
  }
  hasElapsedMinimumInterval(e, t) {
    return e.lastEventTime === 0 ? !0 : t - e.lastEventTime >= this.minIntervalMs;
  }
  hasSignificantDepthChange(e, t) {
    return Math.abs(t - e.lastDepth) >= this.minDepthChange;
  }
  logLimitOnce() {
    this.limitWarningLogged || (this.limitWarningLogged = !0, a("warn", "Max scroll events per session reached", {
      data: { limit: this.maxEventsPerSession }
    }));
  }
  applyConfigOverrides() {
    this.minDepthChange = 5, this.minIntervalMs = 500, this.maxEventsPerSession = 120;
  }
  isWindowScrollable() {
    return document.documentElement.scrollHeight > window.innerHeight;
  }
  clearContainerTimer(e) {
    e.debounceTimer !== null && (clearTimeout(e.debounceTimer), e.debounceTimer = null);
  }
  getScrollDirection(e, t) {
    return e > t ? U.DOWN : U.UP;
  }
  calculateScrollDepth(e, t, r) {
    if (t <= r)
      return 0;
    const n = t - r;
    return Math.min(100, Math.max(0, Math.floor(e / n * 100)));
  }
  calculateScrollData(e) {
    const { element: t, lastScrollPos: r, lastEventTime: n } = e, i = this.getScrollTop(t), o = Date.now(), l = Math.abs(i - r);
    if (l < 10 || t === window && !this.isWindowScrollable())
      return null;
    const c = this.getViewportHeight(t), d = this.getScrollHeight(t), T = this.getScrollDirection(i, r), m = this.calculateScrollDepth(i, d, c);
    let v;
    n > 0 ? v = o - n : e.firstScrollEventTime !== null ? v = o - e.firstScrollEventTime : v = 250;
    const g = Math.round(l / v * 1e3);
    return m > e.maxDepthReached && (e.maxDepthReached = m), e.lastScrollPos = i, {
      depth: m,
      direction: T,
      velocity: g,
      max_depth_reached: e.maxDepthReached
    };
  }
  getScrollTop(e) {
    return e === window ? window.scrollY : e.scrollTop;
  }
  getViewportHeight(e) {
    return e === window ? window.innerHeight : e.clientHeight;
  }
  getScrollHeight(e) {
    return e === window ? document.documentElement.scrollHeight : e.scrollHeight;
  }
  isElementScrollable(e) {
    const t = getComputedStyle(e), r = t.overflowY === "auto" || t.overflowY === "scroll" || t.overflow === "auto" || t.overflow === "scroll", n = e.scrollHeight > e.clientHeight;
    return r && n;
  }
  applyPrimaryScrollSelector(e) {
    let t;
    if (e === "window")
      t = window;
    else {
      const n = document.querySelector(e);
      if (!(n instanceof HTMLElement)) {
        a("warn", `Selector "${e}" did not match an HTMLElement`);
        return;
      }
      t = n;
    }
    this.containers.forEach((n) => {
      this.updateContainerPrimary(n, n.element === t);
    }), !this.containers.some((n) => n.element === t) && t instanceof HTMLElement && this.isElementScrollable(t) && this.setupScrollContainer(t, e);
  }
  updateContainerPrimary(e, t) {
    e.isPrimary = t;
  }
}
class Nt extends S {
  eventManager;
  trackedElements = /* @__PURE__ */ new Map();
  observer = null;
  mutationObserver = null;
  mutationDebounceTimer = null;
  config = null;
  constructor(e) {
    super(), this.eventManager = e;
  }
  /**
   * Starts tracking viewport visibility for configured elements
   */
  startTracking() {
    const e = this.get("config");
    if (this.config = e.viewport ?? null, !this.config?.elements || this.config.elements.length === 0)
      return;
    const t = this.config.threshold ?? 0.5, r = this.config.minDwellTime ?? 1e3;
    if (t < 0 || t > 1) {
      a("warn", "ViewportHandler: Invalid threshold, must be between 0 and 1");
      return;
    }
    if (r < 0) {
      a("warn", "ViewportHandler: Invalid minDwellTime, must be non-negative");
      return;
    }
    if (typeof IntersectionObserver > "u") {
      a("warn", "ViewportHandler: IntersectionObserver not supported in this browser");
      return;
    }
    this.observer = new IntersectionObserver(this.handleIntersection, {
      threshold: t
    }), this.observeElements(), this.setupMutationObserver();
  }
  /**
   * Stops tracking and cleans up resources
   */
  stopTracking() {
    this.observer && (this.observer.disconnect(), this.observer = null), this.mutationObserver && (this.mutationObserver.disconnect(), this.mutationObserver = null), this.mutationDebounceTimer !== null && (window.clearTimeout(this.mutationDebounceTimer), this.mutationDebounceTimer = null);
    for (const e of this.trackedElements.values())
      e.timeoutId !== null && window.clearTimeout(e.timeoutId);
    this.trackedElements.clear();
  }
  /**
   * Query and observe all elements matching configured elements
   */
  observeElements() {
    if (!this.config || !this.observer) return;
    const e = this.config.maxTrackedElements ?? 100;
    let t = this.trackedElements.size;
    for (const r of this.config.elements)
      try {
        const n = document.querySelectorAll(r.selector);
        for (const i of Array.from(n)) {
          if (t >= e) {
            a("warn", "ViewportHandler: Maximum tracked elements reached", {
              data: {
                limit: e,
                selector: r.selector,
                message: "Some elements will not be tracked. Consider more specific selectors."
              }
            });
            return;
          }
          i.hasAttribute(`${w}-ignore`) || this.trackedElements.has(i) || (this.trackedElements.set(i, {
            element: i,
            selector: r.selector,
            id: r.id,
            name: r.name,
            startTime: null,
            timeoutId: null,
            lastFiredTime: null
          }), this.observer?.observe(i), t++);
        }
      } catch (n) {
        a("warn", `ViewportHandler: Invalid selector "${r.selector}"`, { error: n });
      }
    a("debug", "ViewportHandler: Elements tracked", {
      data: { count: t, limit: e }
    });
  }
  /**
   * Handles intersection events from IntersectionObserver
   */
  handleIntersection = (e) => {
    if (!this.config) return;
    const t = this.config.minDwellTime ?? 1e3;
    for (const r of e) {
      const n = this.trackedElements.get(r.target);
      n && (r.isIntersecting ? n.startTime === null && (n.startTime = performance.now(), n.timeoutId = window.setTimeout(() => {
        const i = Math.round(r.intersectionRatio * 100) / 100;
        this.fireViewportEvent(n, i);
      }, t)) : n.startTime !== null && (n.timeoutId !== null && (window.clearTimeout(n.timeoutId), n.timeoutId = null), n.startTime = null));
    }
  };
  /**
   * Fires a viewport visible event
   */
  fireViewportEvent(e, t) {
    if (e.startTime === null) return;
    const r = Math.round(performance.now() - e.startTime);
    if (e.element.hasAttribute("data-tlog-ignore"))
      return;
    const n = this.config?.cooldownPeriod ?? 6e4, i = Date.now();
    if (e.lastFiredTime !== null && i - e.lastFiredTime < n) {
      a("debug", "ViewportHandler: Event suppressed by cooldown period", {
        data: {
          selector: e.selector,
          cooldownRemaining: n - (i - e.lastFiredTime)
        }
      }), e.startTime = null, e.timeoutId = null;
      return;
    }
    const o = {
      selector: e.selector,
      dwellTime: r,
      visibilityRatio: t,
      ...e.id !== void 0 && { id: e.id },
      ...e.name !== void 0 && { name: e.name }
    };
    this.eventManager.track({
      type: u.VIEWPORT_VISIBLE,
      viewport_data: o
    }), e.startTime = null, e.timeoutId = null, e.lastFiredTime = i;
  }
  /**
   * Sets up MutationObserver to detect dynamically added elements
   */
  setupMutationObserver() {
    if (!(!this.config || typeof MutationObserver > "u")) {
      if (!document.body) {
        a("warn", "ViewportHandler: document.body not available, skipping MutationObserver setup");
        return;
      }
      this.mutationObserver = new MutationObserver((e) => {
        let t = !1;
        for (const r of e)
          r.type === "childList" && (r.addedNodes.length > 0 && (t = !0), r.removedNodes.length > 0 && this.cleanupRemovedNodes(r.removedNodes));
        t && (this.mutationDebounceTimer !== null && window.clearTimeout(this.mutationDebounceTimer), this.mutationDebounceTimer = window.setTimeout(() => {
          this.observeElements(), this.mutationDebounceTimer = null;
        }, 100));
      }), this.mutationObserver.observe(document.body, {
        childList: !0,
        subtree: !0
      });
    }
  }
  /**
   * Cleans up tracking for removed DOM nodes
   */
  cleanupRemovedNodes(e) {
    e.forEach((t) => {
      if (t.nodeType !== 1) return;
      const r = t, n = this.trackedElements.get(r);
      n && (n.timeoutId !== null && window.clearTimeout(n.timeoutId), this.observer?.unobserve(r), this.trackedElements.delete(r)), Array.from(this.trackedElements.keys()).filter((o) => r.contains(o)).forEach((o) => {
        const l = this.trackedElements.get(o);
        l && l.timeoutId !== null && window.clearTimeout(l.timeoutId), this.observer?.unobserve(o), this.trackedElements.delete(o);
      });
    });
  }
}
class Rt extends S {
  isInitialized = !1;
  async initialize() {
    if (this.isInitialized)
      return;
    const e = this.get("config").integrations?.googleAnalytics?.measurementId, t = this.get("userId");
    if (!(!e?.trim() || !t?.trim()))
      try {
        if (this.isScriptAlreadyLoaded()) {
          this.isInitialized = !0;
          return;
        }
        await this.loadScript(e), this.configureGtag(e, t), this.isInitialized = !0;
      } catch (r) {
        a("error", "Google Analytics initialization failed", { error: r });
      }
  }
  trackEvent(e, t) {
    if (!(!e?.trim() || !this.isInitialized || typeof window.gtag != "function"))
      try {
        const r = Array.isArray(t) ? { items: t } : t;
        window.gtag("event", e, r);
      } catch (r) {
        a("error", "Google Analytics event tracking failed", { error: r });
      }
  }
  cleanup() {
    this.isInitialized = !1;
    const e = document.getElementById("tracelog-ga-script");
    e && e.remove();
  }
  isScriptAlreadyLoaded() {
    return document.getElementById("tracelog-ga-script") ? !0 : !!document.querySelector('script[src*="googletagmanager.com/gtag/js"]');
  }
  async loadScript(e) {
    return new Promise((t, r) => {
      const n = document.createElement("script");
      n.id = "tracelog-ga-script", n.async = !0, n.src = `https://www.googletagmanager.com/gtag/js?id=${e}`, n.onload = () => {
        t();
      }, n.onerror = () => {
        r(new Error("Failed to load Google Analytics script"));
      }, document.head.appendChild(n);
    });
  }
  configureGtag(e, t) {
    const r = document.createElement("script");
    r.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${e}', {
        'user_id': '${t}'
      });
    `, document.head.appendChild(r);
  }
}
class Ot {
  storage;
  sessionStorageRef;
  fallbackStorage = /* @__PURE__ */ new Map();
  fallbackSessionStorage = /* @__PURE__ */ new Map();
  hasQuotaExceededError = !1;
  constructor() {
    this.storage = this.initializeStorage("localStorage"), this.sessionStorageRef = this.initializeStorage("sessionStorage"), this.storage || a("warn", "localStorage not available, using memory fallback"), this.sessionStorageRef || a("warn", "sessionStorage not available, using memory fallback");
  }
  /**
   * Retrieves an item from storage
   */
  getItem(e) {
    try {
      return this.storage ? this.storage.getItem(e) : this.fallbackStorage.get(e) ?? null;
    } catch {
      return this.fallbackStorage.get(e) ?? null;
    }
  }
  /**
   * Stores an item in storage
   */
  setItem(e, t) {
    this.fallbackStorage.set(e, t);
    try {
      if (this.storage) {
        this.storage.setItem(e, t);
        return;
      }
    } catch (r) {
      if (r instanceof DOMException && r.name === "QuotaExceededError")
        if (this.hasQuotaExceededError = !0, a("warn", "localStorage quota exceeded, attempting cleanup", {
          data: { key: e, valueSize: t.length }
        }), this.cleanupOldData())
          try {
            if (this.storage) {
              this.storage.setItem(e, t);
              return;
            }
          } catch (i) {
            a("error", "localStorage quota exceeded even after cleanup - data will not persist", {
              error: i,
              data: { key: e, valueSize: t.length }
            });
          }
        else
          a("error", "localStorage quota exceeded and no data to cleanup - data will not persist", {
            error: r,
            data: { key: e, valueSize: t.length }
          });
    }
  }
  /**
   * Removes an item from storage
   */
  removeItem(e) {
    try {
      this.storage && this.storage.removeItem(e);
    } catch {
    }
    this.fallbackStorage.delete(e);
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
      const e = [];
      for (let t = 0; t < this.storage.length; t++) {
        const r = this.storage.key(t);
        r?.startsWith("tracelog_") && e.push(r);
      }
      e.forEach((t) => {
        this.storage.removeItem(t);
      }), this.fallbackStorage.clear();
    } catch (e) {
      a("error", "Failed to clear storage", { error: e }), this.fallbackStorage.clear();
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
    if (!this.storage)
      return !1;
    try {
      const e = [], t = [];
      for (let i = 0; i < this.storage.length; i++) {
        const o = this.storage.key(i);
        o?.startsWith("tracelog_") && (e.push(o), o.startsWith("tracelog_persisted_events_") && t.push(o));
      }
      if (t.length > 0)
        return t.forEach((i) => {
          try {
            this.storage.removeItem(i);
          } catch {
          }
        }), !0;
      const r = ["tracelog_session_", "tracelog_user_id", "tracelog_device_id", "tracelog_config"], n = e.filter((i) => !r.some((o) => i.startsWith(o)));
      return n.length > 0 ? (n.slice(0, 5).forEach((o) => {
        try {
          this.storage.removeItem(o);
        } catch {
        }
      }), !0) : !1;
    } catch (e) {
      return a("error", "Failed to cleanup old data", { error: e }), !1;
    }
  }
  /**
   * Initialize storage (localStorage or sessionStorage) with feature detection
   */
  initializeStorage(e) {
    if (typeof window > "u")
      return null;
    try {
      const t = e === "localStorage" ? window.localStorage : window.sessionStorage, r = "__tracelog_test__";
      return t.setItem(r, "test"), t.removeItem(r), t;
    } catch {
      return null;
    }
  }
  /**
   * Retrieves an item from sessionStorage
   */
  getSessionItem(e) {
    try {
      return this.sessionStorageRef ? this.sessionStorageRef.getItem(e) : this.fallbackSessionStorage.get(e) ?? null;
    } catch {
      return this.fallbackSessionStorage.get(e) ?? null;
    }
  }
  /**
   * Stores an item in sessionStorage
   */
  setSessionItem(e, t) {
    this.fallbackSessionStorage.set(e, t);
    try {
      if (this.sessionStorageRef) {
        this.sessionStorageRef.setItem(e, t);
        return;
      }
    } catch (r) {
      r instanceof DOMException && r.name === "QuotaExceededError" && a("error", "sessionStorage quota exceeded - data will not persist", {
        error: r,
        data: { key: e, valueSize: t.length }
      });
    }
  }
  /**
   * Removes an item from sessionStorage
   */
  removeSessionItem(e) {
    try {
      this.sessionStorageRef && this.sessionStorageRef.removeItem(e);
    } catch {
    }
    this.fallbackSessionStorage.delete(e);
  }
}
class bt extends S {
  eventManager;
  reportedByNav = /* @__PURE__ */ new Map();
  navigationHistory = [];
  // FIFO queue for tracking navigation order
  observers = [];
  vitalThresholds;
  lastLongTaskSentAt = 0;
  constructor(e) {
    super(), this.eventManager = e, this.vitalThresholds = me(ee);
  }
  async startTracking() {
    const e = this.get("config"), t = e?.webVitalsMode ?? ee;
    this.vitalThresholds = me(t), e?.webVitalsThresholds && (this.vitalThresholds = { ...this.vitalThresholds, ...e.webVitalsThresholds }), await this.initWebVitals(), this.observeLongTasks();
  }
  stopTracking() {
    this.observers.forEach((e, t) => {
      try {
        e.disconnect();
      } catch (r) {
        a("warn", "Failed to disconnect performance observer", { error: r, data: { observerIndex: t } });
      }
    }), this.observers.length = 0, this.reportedByNav.clear(), this.navigationHistory.length = 0;
  }
  observeWebVitalsFallback() {
    this.reportTTFB(), this.safeObserve(
      "largest-contentful-paint",
      (r) => {
        const n = r.getEntries(), i = n[n.length - 1];
        i && this.sendVital({ type: "LCP", value: Number(i.startTime.toFixed(2)) });
      },
      { type: "largest-contentful-paint", buffered: !0 },
      !0
    );
    let e = 0, t = this.getNavigationId();
    this.safeObserve(
      "layout-shift",
      (r) => {
        const n = this.getNavigationId();
        n !== t && (e = 0, t = n);
        const i = r.getEntries();
        for (const o of i) {
          if (o.hadRecentInput === !0)
            continue;
          const l = typeof o.value == "number" ? o.value : 0;
          e += l;
        }
        this.sendVital({ type: "CLS", value: Number(e.toFixed(2)) });
      },
      { type: "layout-shift", buffered: !0 }
    ), this.safeObserve(
      "paint",
      (r) => {
        for (const n of r.getEntries())
          n.name === "first-contentful-paint" && this.sendVital({ type: "FCP", value: Number(n.startTime.toFixed(2)) });
      },
      { type: "paint", buffered: !0 },
      !0
    ), this.safeObserve(
      "event",
      (r) => {
        let n = 0;
        const i = r.getEntries();
        for (const o of i) {
          const l = (o.processingEnd ?? 0) - (o.startTime ?? 0);
          n = Math.max(n, l);
        }
        n > 0 && this.sendVital({ type: "INP", value: Number(n.toFixed(2)) });
      },
      { type: "event", buffered: !0 }
    );
  }
  async initWebVitals() {
    try {
      const { onLCP: e, onCLS: t, onFCP: r, onTTFB: n, onINP: i } = await Promise.resolve().then(() => qt), o = (l) => (c) => {
        const d = Number(c.value.toFixed(2));
        this.sendVital({ type: l, value: d });
      };
      e(o("LCP"), { reportAllChanges: !1 }), t(o("CLS"), { reportAllChanges: !1 }), r(o("FCP"), { reportAllChanges: !1 }), n(o("TTFB"), { reportAllChanges: !1 }), i(o("INP"), { reportAllChanges: !1 });
    } catch (e) {
      a("warn", "Failed to load web-vitals library, using fallback", { error: e }), this.observeWebVitalsFallback();
    }
  }
  reportTTFB() {
    try {
      const e = performance.getEntriesByType("navigation")[0];
      if (!e)
        return;
      const t = e.responseStart;
      typeof t == "number" && Number.isFinite(t) && this.sendVital({ type: "TTFB", value: Number(t.toFixed(2)) });
    } catch (e) {
      a("warn", "Failed to report TTFB", { error: e });
    }
  }
  observeLongTasks() {
    this.safeObserve(
      "longtask",
      (e) => {
        const t = e.getEntries();
        for (const r of t) {
          const n = Number(r.duration.toFixed(2)), i = Date.now();
          i - this.lastLongTaskSentAt >= Je && (this.shouldSendVital("LONG_TASK", n) && this.trackWebVital("LONG_TASK", n), this.lastLongTaskSentAt = i);
        }
      },
      { type: "longtask", buffered: !0 }
    );
  }
  sendVital(e) {
    if (!this.shouldSendVital(e.type, e.value))
      return;
    const t = this.getNavigationId();
    if (t) {
      const r = this.reportedByNav.get(t);
      if (r?.has(e.type))
        return;
      if (r)
        r.add(e.type);
      else if (this.reportedByNav.set(t, /* @__PURE__ */ new Set([e.type])), this.navigationHistory.push(t), this.navigationHistory.length > et) {
        const i = this.navigationHistory.shift();
        i && this.reportedByNav.delete(i);
      }
    }
    this.trackWebVital(e.type, e.value);
  }
  trackWebVital(e, t) {
    if (!Number.isFinite(t)) {
      a("warn", "Invalid web vital value", { data: { type: e, value: t } });
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
      if (!e)
        return null;
      const t = e.startTime || performance.now(), r = Math.random().toString(36).substr(2, 5);
      return `${t.toFixed(2)}_${window.location.pathname}_${r}`;
    } catch (e) {
      return a("warn", "Failed to get navigation ID", { error: e }), null;
    }
  }
  isObserverSupported(e) {
    if (typeof PerformanceObserver > "u") return !1;
    const t = PerformanceObserver.supportedEntryTypes;
    return !t || t.includes(e);
  }
  safeObserve(e, t, r, n = !1) {
    try {
      if (!this.isObserverSupported(e))
        return !1;
      const i = new PerformanceObserver((o, l) => {
        try {
          t(o, l);
        } catch (c) {
          a("warn", "Observer callback failed", {
            error: c,
            data: { type: e }
          });
        }
        if (n)
          try {
            l.disconnect();
          } catch {
          }
      });
      return i.observe(r ?? { type: e, buffered: !0 }), n || this.observers.push(i), !0;
    } catch (i) {
      return a("warn", "Failed to create performance observer", {
        error: i,
        data: { type: e }
      }), !1;
    }
  }
  shouldSendVital(e, t) {
    if (typeof t != "number" || !Number.isFinite(t))
      return a("warn", "Invalid web vital value", { data: { type: e, value: t } }), !1;
    const r = this.vitalThresholds[e];
    return !(typeof r == "number" && t <= r);
  }
}
class Ct extends S {
  eventManager;
  recentErrors = /* @__PURE__ */ new Map();
  errorBurstCounter = 0;
  burstWindowStart = 0;
  burstBackoffUntil = 0;
  constructor(e) {
    super(), this.eventManager = e;
  }
  startTracking() {
    window.addEventListener("error", this.handleError), window.addEventListener("unhandledrejection", this.handleRejection);
  }
  stopTracking() {
    window.removeEventListener("error", this.handleError), window.removeEventListener("unhandledrejection", this.handleRejection), this.recentErrors.clear(), this.errorBurstCounter = 0, this.burstWindowStart = 0, this.burstBackoffUntil = 0;
  }
  /**
   * Checks sampling rate and burst detection (Phase 3)
   * Returns false if in cooldown period after burst detection
   */
  shouldSample() {
    const e = Date.now();
    if (e < this.burstBackoffUntil)
      return !1;
    if (e - this.burstWindowStart > rt && (this.errorBurstCounter = 0, this.burstWindowStart = e), this.errorBurstCounter++, this.errorBurstCounter > st)
      return this.burstBackoffUntil = e + Te, a("warn", "Error burst detected - entering cooldown", {
        data: {
          errorsInWindow: this.errorBurstCounter,
          cooldownMs: Te
        }
      }), !1;
    const r = this.get("config")?.errorSampling ?? Ne;
    return Math.random() < r;
  }
  handleError = (e) => {
    if (!this.shouldSample())
      return;
    const t = this.sanitize(e.message || "Unknown error");
    this.shouldSuppressError(P.JS_ERROR, t) || this.eventManager.track({
      type: u.ERROR,
      error_data: {
        type: P.JS_ERROR,
        message: t,
        ...e.filename && { filename: e.filename },
        ...e.lineno && { line: e.lineno },
        ...e.colno && { column: e.colno }
      }
    });
  };
  handleRejection = (e) => {
    if (!this.shouldSample())
      return;
    const t = this.extractRejectionMessage(e.reason), r = this.sanitize(t);
    this.shouldSuppressError(P.PROMISE_REJECTION, r) || this.eventManager.track({
      type: u.ERROR,
      error_data: {
        type: P.PROMISE_REJECTION,
        message: r
      }
    });
  };
  extractRejectionMessage(e) {
    if (!e) return "Unknown rejection";
    if (typeof e == "string") return e;
    if (e instanceof Error)
      return e.stack ?? e.message ?? e.toString();
    if (typeof e == "object" && "message" in e)
      return String(e.message);
    try {
      return JSON.stringify(e);
    } catch {
      return String(e);
    }
  }
  sanitize(e) {
    let t = e.length > ge ? e.slice(0, ge) + "..." : e;
    for (const r of Me) {
      const n = new RegExp(r.source, r.flags);
      t = t.replace(n, "[REDACTED]");
    }
    return t;
  }
  shouldSuppressError(e, t) {
    const r = Date.now(), n = `${e}:${t}`, i = this.recentErrors.get(n);
    return i && r - i < Se ? (this.recentErrors.set(n, r), !0) : (this.recentErrors.set(n, r), this.recentErrors.size > tt ? (this.recentErrors.clear(), this.recentErrors.set(n, r), !1) : (this.recentErrors.size > x && this.pruneOldErrors(), !1));
  }
  pruneOldErrors() {
    const e = Date.now();
    for (const [n, i] of this.recentErrors.entries())
      e - i > Se && this.recentErrors.delete(n);
    if (this.recentErrors.size <= x)
      return;
    const t = Array.from(this.recentErrors.entries()).sort((n, i) => n[1] - i[1]), r = this.recentErrors.size - x;
    for (let n = 0; n < r; n += 1) {
      const i = t[n];
      i && this.recentErrors.delete(i[0]);
    }
  }
}
class Pt extends S {
  isInitialized = !1;
  suppressNextScrollTimer = null;
  emitter = new _t();
  managers = {};
  handlers = {};
  integrations = {};
  get initialized() {
    return this.isInitialized;
  }
  async init(e = {}) {
    if (!this.isInitialized) {
      this.managers.storage = new Ot();
      try {
        this.setupState(e), await this.setupIntegrations(), this.managers.event = new It(this.managers.storage, this.integrations.googleAnalytics, this.emitter), this.initializeHandlers(), await this.managers.event.recoverPersistedEvents().catch((t) => {
          a("warn", "Failed to recover persisted events", { error: t });
        }), this.isInitialized = !0;
      } catch (t) {
        this.destroy(!0);
        const r = t instanceof Error ? t.message : String(t);
        throw new Error(`[TraceLog] TraceLog initialization failed: ${r}`);
      }
    }
  }
  sendCustomEvent(e, t) {
    if (!this.managers.event)
      return;
    const { valid: r, error: n, sanitizedMetadata: i } = Tt(e, t);
    if (!r) {
      if (this.get("mode") === D.QA)
        throw new Error(`[TraceLog] Custom event "${e}" validation failed: ${n}`);
      return;
    }
    this.managers.event.track({
      type: u.CUSTOM,
      custom_event: {
        name: e,
        ...i && { metadata: i }
      }
    });
  }
  on(e, t) {
    this.emitter.on(e, t);
  }
  off(e, t) {
    this.emitter.off(e, t);
  }
  destroy(e = !1) {
    !this.isInitialized && !e || (this.integrations.googleAnalytics?.cleanup(), Object.values(this.handlers).filter(Boolean).forEach((t) => {
      try {
        t.stopTracking();
      } catch (r) {
        a("warn", "Failed to stop tracking", { error: r });
      }
    }), this.suppressNextScrollTimer && (clearTimeout(this.suppressNextScrollTimer), this.suppressNextScrollTimer = null), this.managers.event?.flushImmediatelySync(), this.managers.event?.stop(), this.emitter.removeAllListeners(), this.set("hasStartSession", !1), this.set("suppressNextScroll", !1), this.set("sessionId", null), this.isInitialized = !1, this.handlers = {});
  }
  setupState(e = {}) {
    this.set("config", e);
    const t = vt.getId(this.managers.storage);
    this.set("userId", t);
    const r = ct(e);
    this.set("collectApiUrl", r);
    const n = je();
    this.set("device", n);
    const i = te(window.location.href, e.sensitiveQueryParams);
    this.set("pageUrl", i);
    const o = ot() ? D.QA : void 0;
    o && this.set("mode", o);
  }
  async setupIntegrations() {
    if (this.get("config").integrations?.googleAnalytics?.measurementId?.trim())
      try {
        this.integrations.googleAnalytics = new Rt(), await this.integrations.googleAnalytics.initialize();
      } catch {
        this.integrations.googleAnalytics = void 0;
      }
  }
  initializeHandlers() {
    this.handlers.session = new At(
      this.managers.storage,
      this.managers.event
    ), this.handlers.session.startTracking();
    const e = () => {
      this.set("suppressNextScroll", !0), this.suppressNextScrollTimer && clearTimeout(this.suppressNextScrollTimer), this.suppressNextScrollTimer = window.setTimeout(() => {
        this.set("suppressNextScroll", !1);
      }, 500);
    };
    this.handlers.pageView = new yt(this.managers.event, e), this.handlers.pageView.startTracking(), this.handlers.click = new Lt(this.managers.event), this.handlers.click.startTracking(), this.handlers.scroll = new Mt(this.managers.event), this.handlers.scroll.startTracking(), this.handlers.performance = new bt(this.managers.event), this.handlers.performance.startTracking().catch((t) => {
      a("warn", "Failed to start performance tracking", { error: t });
    }), this.handlers.error = new Ct(this.managers.event), this.handlers.error.startTracking(), this.get("config").viewport && (this.handlers.viewport = new Nt(this.managers.event), this.handlers.viewport.startTracking());
  }
}
const N = [];
let E = null, b = !1, F = !1;
const Dt = async (s) => {
  if (!(typeof window > "u" || typeof document > "u") && !window.__traceLogDisabled && !E && !b) {
    b = !0;
    try {
      const e = Et(s ?? {}), t = new Pt();
      try {
        N.forEach(({ event: i, callback: o }) => {
          t.on(i, o);
        }), N.length = 0;
        const r = t.init(e), n = new Promise((i, o) => {
          setTimeout(() => {
            o(new Error("[TraceLog] Initialization timeout after 10000ms"));
          }, 1e4);
        });
        await Promise.race([r, n]), E = t;
      } catch (r) {
        try {
          t.destroy(!0);
        } catch (n) {
          a("error", "Failed to cleanup partially initialized app", { error: n });
        }
        throw r;
      }
    } catch (e) {
      throw E = null, e;
    } finally {
      b = !1;
    }
  }
}, Vt = (s, e) => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!E)
      throw new Error("[TraceLog] TraceLog not initialized. Please call init() first.");
    if (F)
      throw new Error("[TraceLog] Cannot send events while TraceLog is being destroyed");
    E.sendCustomEvent(s, e);
  }
}, kt = (s, e) => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!E || b) {
      N.push({ event: s, callback: e });
      return;
    }
    E.on(s, e);
  }
}, Ht = (s, e) => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!E) {
      const t = N.findIndex((r) => r.event === s && r.callback === e);
      t !== -1 && N.splice(t, 1);
      return;
    }
    E.off(s, e);
  }
}, Ut = () => typeof window > "u" || typeof document > "u" ? !1 : E !== null, xt = () => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (F)
      throw new Error("[TraceLog] Destroy operation already in progress");
    if (!E)
      throw new Error("[TraceLog] App not initialized");
    F = !0;
    try {
      E.destroy(), E = null, b = !1, N.length = 0;
    } catch (s) {
      E = null, b = !1, N.length = 0, a("warn", "Error during destroy, forced cleanup completed", { error: s });
    } finally {
      F = !1;
    }
  }
}, dr = {
  LOW_ACTIVITY_EVENT_COUNT: 50,
  HIGH_ACTIVITY_EVENT_COUNT: 1e3,
  MIN_EVENTS_FOR_DYNAMIC_CALCULATION: 100,
  MIN_EVENTS_FOR_TREND_ANALYSIS: 30,
  BOUNCE_RATE_SESSION_THRESHOLD: 1,
  // Sessions with 1 page view = bounce
  MIN_ENGAGED_SESSION_DURATION_MS: 30 * 1e3,
  MIN_SCROLL_DEPTH_ENGAGEMENT: 25
  // 25% scroll depth for engagement
}, hr = {
  INACTIVITY_TIMEOUT_MS: 1800 * 1e3,
  // 30min for analytics (vs 15min client)
  SHORT_SESSION_THRESHOLD_MS: 30 * 1e3,
  MEDIUM_SESSION_THRESHOLD_MS: 300 * 1e3,
  LONG_SESSION_THRESHOLD_MS: 1800 * 1e3,
  MAX_REALISTIC_SESSION_DURATION_MS: 480 * 60 * 1e3
  // Filter outliers
}, fr = {
  MOBILE_MAX_WIDTH: 768,
  TABLET_MAX_WIDTH: 1024,
  MOBILE_PERFORMANCE_FACTOR: 1.5,
  // Mobile typically 1.5x slower
  TABLET_PERFORMANCE_FACTOR: 1.2
}, Er = {
  MIN_TEXT_LENGTH_FOR_ANALYSIS: 10,
  MIN_CLICKS_FOR_HOT_ELEMENT: 10,
  // Popular element threshold
  MIN_SCROLL_COMPLETION_PERCENT: 80,
  // Page consumption threshold
  MIN_TIME_ON_PAGE_FOR_READ_MS: 15 * 1e3
}, mr = {
  SIGNIFICANT_CHANGE_PERCENT: 20,
  MAJOR_CHANGE_PERCENT: 50,
  MIN_EVENTS_FOR_INSIGHT: 100,
  MIN_SESSIONS_FOR_INSIGHT: 10,
  MIN_CORRELATION_STRENGTH: 0.7,
  // Strong correlation threshold
  LOW_ERROR_RATE_PERCENT: 1,
  HIGH_ERROR_RATE_PERCENT: 5,
  CRITICAL_ERROR_RATE_PERCENT: 10
}, gr = {
  SHORT_TERM_TREND_HOURS: 24,
  MEDIUM_TERM_TREND_DAYS: 7,
  LONG_TERM_TREND_DAYS: 30,
  MIN_DATA_POINTS_FOR_TREND: 5,
  WEEKLY_PATTERN_MIN_WEEKS: 4,
  DAILY_PATTERN_MIN_DAYS: 14
}, Sr = {
  MIN_SEGMENT_SIZE: 10,
  MIN_COHORT_SIZE: 5,
  COHORT_ANALYSIS_DAYS: [1, 3, 7, 14, 30],
  MIN_FUNNEL_EVENTS: 20
}, Tr = {
  DEFAULT_EVENTS_LIMIT: 5,
  DEFAULT_SESSIONS_LIMIT: 5,
  DEFAULT_PAGES_LIMIT: 5,
  MAX_EVENTS_FOR_DEEP_ANALYSIS: 1e4,
  MAX_TIME_RANGE_DAYS: 365,
  ANALYTICS_BATCH_SIZE: 1e3
  // For historical analysis
}, _r = {
  ANOMALY_THRESHOLD_SIGMA: 2.5,
  STRONG_ANOMALY_THRESHOLD_SIGMA: 3,
  TRAFFIC_DROP_ALERT_PERCENT: -30,
  TRAFFIC_SPIKE_ALERT_PERCENT: 200,
  MIN_BASELINE_DAYS: 7,
  MIN_EVENTS_FOR_ANOMALY_DETECTION: 50
}, pr = {
  PAGE_URL_EXCLUDED: "excluded",
  PAGE_URL_UNKNOWN: "unknown"
}, Ir = {
  init: Dt,
  event: Vt,
  on: kt,
  off: Ht,
  isInitialized: Ut,
  destroy: xt
};
var se, Oe = -1, C = function(s) {
  addEventListener("pageshow", (function(e) {
    e.persisted && (Oe = e.timeStamp, s(e));
  }), !0);
}, ce = function() {
  var s = self.performance && performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
  if (s && s.responseStart > 0 && s.responseStart < performance.now()) return s;
}, B = function() {
  var s = ce();
  return s && s.activationStart || 0;
}, p = function(s, e) {
  var t = ce(), r = "navigate";
  return Oe >= 0 ? r = "back-forward-cache" : t && (document.prerendering || B() > 0 ? r = "prerender" : document.wasDiscarded ? r = "restore" : t.type && (r = t.type.replace(/_/g, "-"))), { name: s, value: e === void 0 ? -1 : e, rating: "good", delta: 0, entries: [], id: "v4-".concat(Date.now(), "-").concat(Math.floor(8999999999999 * Math.random()) + 1e12), navigationType: r };
}, k = function(s, e, t) {
  try {
    if (PerformanceObserver.supportedEntryTypes.includes(s)) {
      var r = new PerformanceObserver((function(n) {
        Promise.resolve().then((function() {
          e(n.getEntries());
        }));
      }));
      return r.observe(Object.assign({ type: s, buffered: !0 }, t || {})), r;
    }
  } catch {
  }
}, I = function(s, e, t, r) {
  var n, i;
  return function(o) {
    e.value >= 0 && (o || r) && ((i = e.value - (n || 0)) || n === void 0) && (n = e.value, e.delta = i, e.rating = (function(l, c) {
      return l > c[1] ? "poor" : l > c[0] ? "needs-improvement" : "good";
    })(e.value, t), s(e));
  };
}, ue = function(s) {
  requestAnimationFrame((function() {
    return requestAnimationFrame((function() {
      return s();
    }));
  }));
}, $ = function(s) {
  document.addEventListener("visibilitychange", (function() {
    document.visibilityState === "hidden" && s();
  }));
}, de = function(s) {
  var e = !1;
  return function() {
    e || (s(), e = !0);
  };
}, O = -1, Ae = function() {
  return document.visibilityState !== "hidden" || document.prerendering ? 1 / 0 : 0;
}, W = function(s) {
  document.visibilityState === "hidden" && O > -1 && (O = s.type === "visibilitychange" ? s.timeStamp : 0, Ft());
}, ye = function() {
  addEventListener("visibilitychange", W, !0), addEventListener("prerenderingchange", W, !0);
}, Ft = function() {
  removeEventListener("visibilitychange", W, !0), removeEventListener("prerenderingchange", W, !0);
}, be = function() {
  return O < 0 && (O = Ae(), ye(), C((function() {
    setTimeout((function() {
      O = Ae(), ye();
    }), 0);
  }))), { get firstHiddenTime() {
    return O;
  } };
}, X = function(s) {
  document.prerendering ? addEventListener("prerenderingchange", (function() {
    return s();
  }), !0) : s();
}, ne = [1800, 3e3], Ce = function(s, e) {
  e = e || {}, X((function() {
    var t, r = be(), n = p("FCP"), i = k("paint", (function(o) {
      o.forEach((function(l) {
        l.name === "first-contentful-paint" && (i.disconnect(), l.startTime < r.firstHiddenTime && (n.value = Math.max(l.startTime - B(), 0), n.entries.push(l), t(!0)));
      }));
    }));
    i && (t = I(s, n, ne, e.reportAllChanges), C((function(o) {
      n = p("FCP"), t = I(s, n, ne, e.reportAllChanges), ue((function() {
        n.value = performance.now() - o.timeStamp, t(!0);
      }));
    })));
  }));
}, ie = [0.1, 0.25], Gt = function(s, e) {
  e = e || {}, Ce(de((function() {
    var t, r = p("CLS", 0), n = 0, i = [], o = function(c) {
      c.forEach((function(d) {
        if (!d.hadRecentInput) {
          var T = i[0], m = i[i.length - 1];
          n && d.startTime - m.startTime < 1e3 && d.startTime - T.startTime < 5e3 ? (n += d.value, i.push(d)) : (n = d.value, i = [d]);
        }
      })), n > r.value && (r.value = n, r.entries = i, t());
    }, l = k("layout-shift", o);
    l && (t = I(s, r, ie, e.reportAllChanges), $((function() {
      o(l.takeRecords()), t(!0);
    })), C((function() {
      n = 0, r = p("CLS", 0), t = I(s, r, ie, e.reportAllChanges), ue((function() {
        return t();
      }));
    })), setTimeout(t, 0));
  })));
}, Pe = 0, Y = 1 / 0, H = 0, Wt = function(s) {
  s.forEach((function(e) {
    e.interactionId && (Y = Math.min(Y, e.interactionId), H = Math.max(H, e.interactionId), Pe = H ? (H - Y) / 7 + 1 : 0);
  }));
}, De = function() {
  return se ? Pe : performance.interactionCount || 0;
}, Bt = function() {
  "interactionCount" in performance || se || (se = k("event", Wt, { type: "event", buffered: !0, durationThreshold: 0 }));
}, _ = [], G = /* @__PURE__ */ new Map(), Ve = 0, $t = function() {
  var s = Math.min(_.length - 1, Math.floor((De() - Ve) / 50));
  return _[s];
}, Xt = [], zt = function(s) {
  if (Xt.forEach((function(n) {
    return n(s);
  })), s.interactionId || s.entryType === "first-input") {
    var e = _[_.length - 1], t = G.get(s.interactionId);
    if (t || _.length < 10 || s.duration > e.latency) {
      if (t) s.duration > t.latency ? (t.entries = [s], t.latency = s.duration) : s.duration === t.latency && s.startTime === t.entries[0].startTime && t.entries.push(s);
      else {
        var r = { id: s.interactionId, latency: s.duration, entries: [s] };
        G.set(r.id, r), _.push(r);
      }
      _.sort((function(n, i) {
        return i.latency - n.latency;
      })), _.length > 10 && _.splice(10).forEach((function(n) {
        return G.delete(n.id);
      }));
    }
  }
}, ke = function(s) {
  var e = self.requestIdleCallback || self.setTimeout, t = -1;
  return s = de(s), document.visibilityState === "hidden" ? s() : (t = e(s), $(s)), t;
}, oe = [200, 500], jt = function(s, e) {
  "PerformanceEventTiming" in self && "interactionId" in PerformanceEventTiming.prototype && (e = e || {}, X((function() {
    var t;
    Bt();
    var r, n = p("INP"), i = function(l) {
      ke((function() {
        l.forEach(zt);
        var c = $t();
        c && c.latency !== n.value && (n.value = c.latency, n.entries = c.entries, r());
      }));
    }, o = k("event", i, { durationThreshold: (t = e.durationThreshold) !== null && t !== void 0 ? t : 40 });
    r = I(s, n, oe, e.reportAllChanges), o && (o.observe({ type: "first-input", buffered: !0 }), $((function() {
      i(o.takeRecords()), r(!0);
    })), C((function() {
      Ve = De(), _.length = 0, G.clear(), n = p("INP"), r = I(s, n, oe, e.reportAllChanges);
    })));
  })));
}, ae = [2500, 4e3], K = {}, Qt = function(s, e) {
  e = e || {}, X((function() {
    var t, r = be(), n = p("LCP"), i = function(c) {
      e.reportAllChanges || (c = c.slice(-1)), c.forEach((function(d) {
        d.startTime < r.firstHiddenTime && (n.value = Math.max(d.startTime - B(), 0), n.entries = [d], t());
      }));
    }, o = k("largest-contentful-paint", i);
    if (o) {
      t = I(s, n, ae, e.reportAllChanges);
      var l = de((function() {
        K[n.id] || (i(o.takeRecords()), o.disconnect(), K[n.id] = !0, t(!0));
      }));
      ["keydown", "click"].forEach((function(c) {
        addEventListener(c, (function() {
          return ke(l);
        }), { once: !0, capture: !0 });
      })), $(l), C((function(c) {
        n = p("LCP"), t = I(s, n, ae, e.reportAllChanges), ue((function() {
          n.value = performance.now() - c.timeStamp, K[n.id] = !0, t(!0);
        }));
      }));
    }
  }));
}, le = [800, 1800], Yt = function s(e) {
  document.prerendering ? X((function() {
    return s(e);
  })) : document.readyState !== "complete" ? addEventListener("load", (function() {
    return s(e);
  }), !0) : setTimeout(e, 0);
}, Kt = function(s, e) {
  e = e || {};
  var t = p("TTFB"), r = I(s, t, le, e.reportAllChanges);
  Yt((function() {
    var n = ce();
    n && (t.value = Math.max(n.responseStart - B(), 0), t.entries = [n], r(!0), C((function() {
      t = p("TTFB", 0), (r = I(s, t, le, e.reportAllChanges))(!0);
    })));
  }));
};
const qt = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  CLSThresholds: ie,
  FCPThresholds: ne,
  INPThresholds: oe,
  LCPThresholds: ae,
  TTFBThresholds: le,
  onCLS: Gt,
  onFCP: Ce,
  onINP: jt,
  onLCP: Qt,
  onTTFB: Kt
}, Symbol.toStringTag, { value: "Module" }));
export {
  Tr as ANALYTICS_QUERY_LIMITS,
  _r as ANOMALY_DETECTION,
  h as AppConfigValidationError,
  Er as CONTENT_ANALYTICS,
  ee as DEFAULT_WEB_VITALS_MODE,
  fr as DEVICE_ANALYTICS,
  y as DeviceType,
  dr as ENGAGEMENT_THRESHOLDS,
  Z as EmitterEvent,
  P as ErrorType,
  u as EventType,
  mr as INSIGHT_THRESHOLDS,
  cr as InitializationTimeoutError,
  M as IntegrationValidationError,
  or as MAX_ARRAY_LENGTH,
  tr as MAX_CUSTOM_EVENT_ARRAY_SIZE,
  er as MAX_CUSTOM_EVENT_KEYS,
  Zt as MAX_CUSTOM_EVENT_NAME_LENGTH,
  Jt as MAX_CUSTOM_EVENT_STRING_SIZE,
  sr as MAX_METADATA_NESTING_DEPTH,
  rr as MAX_NESTED_OBJECT_KEYS,
  nr as MAX_STRING_LENGTH,
  ir as MAX_STRING_LENGTH_IN_ARRAY,
  D as Mode,
  Me as PII_PATTERNS,
  R as PermanentError,
  Sr as SEGMENTATION_ANALYTICS,
  hr as SESSION_ANALYTICS,
  pr as SPECIAL_PAGE_URLS,
  he as SamplingRateValidationError,
  U as ScrollDirection,
  Be as SessionTimeoutValidationError,
  q as SpecialApiUrl,
  gr as TEMPORAL_ANALYSIS,
  V as TraceLogValidationError,
  ur as WEB_VITALS_GOOD_THRESHOLDS,
  Ee as WEB_VITALS_NEEDS_IMPROVEMENT_THRESHOLDS,
  Ze as WEB_VITALS_POOR_THRESHOLDS,
  me as getWebVitalsThresholds,
  ar as isPrimaryScrollEvent,
  lr as isSecondaryScrollEvent,
  Ir as tracelog
};
