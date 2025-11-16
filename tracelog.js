const fr = 9e5;
const gr = 120, mr = 8192, Er = 10, pr = 10, Sr = 20, Tr = 1;
const _r = 1e3, vr = 500, Ir = 100;
const I = "data-tlog", Je = [
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
], Ze = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"], et = [
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
const g = {
  INVALID_SESSION_TIMEOUT: "Session timeout must be between 30000ms (30 seconds) and 86400000ms (24 hours)",
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
}, tt = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<embed\b[^>]*>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi
], M = "tlog", U = `${M}:qa_mode`, Ee = `${M}:uid`, pe = "tlog_mode", Se = "qa", Te = "qa_off", rt = (s) => s ? `${M}:${s}:queue` : `${M}:queue`, st = (s) => s ? `${M}:${s}:session` : `${M}:session`, nt = (s) => s ? `${M}:${s}:broadcast` : `${M}:broadcast`, ee = (s, e) => `${M}:${s}:session_counts:${e}`;
var V = /* @__PURE__ */ ((s) => (s.Localhost = "localhost:8080", s.Fail = "localhost:9999", s))(V || {}), L = /* @__PURE__ */ ((s) => (s.Mobile = "mobile", s.Tablet = "tablet", s.Desktop = "desktop", s.Unknown = "unknown", s))(L || {}), te = /* @__PURE__ */ ((s) => (s.EVENT = "event", s.QUEUE = "queue", s))(te || {});
class N extends Error {
  constructor(e, t) {
    super(e), this.statusCode = t, this.name = "PermanentError", Error.captureStackTrace && Error.captureStackTrace(this, N);
  }
}
var d = /* @__PURE__ */ ((s) => (s.PAGE_VIEW = "page_view", s.CLICK = "click", s.SCROLL = "scroll", s.SESSION_START = "session_start", s.SESSION_END = "session_end", s.CUSTOM = "custom", s.WEB_VITALS = "web_vitals", s.ERROR = "error", s.VIEWPORT_VISIBLE = "viewport_visible", s))(d || {}), B = /* @__PURE__ */ ((s) => (s.UP = "up", s.DOWN = "down", s))(B || {}), k = /* @__PURE__ */ ((s) => (s.JS_ERROR = "js_error", s.PROMISE_REJECTION = "promise_rejection", s))(k || {}), X = /* @__PURE__ */ ((s) => (s.QA = "qa", s))(X || {});
const wr = (s) => s.type === d.SCROLL && "scroll_data" in s && s.scroll_data.is_primary === !0, yr = (s) => s.type === d.SCROLL && "scroll_data" in s && s.scroll_data.is_primary === !1;
class H extends Error {
  constructor(e, t, r) {
    super(e), this.errorCode = t, this.layer = r, this.name = this.constructor.name, Error.captureStackTrace && Error.captureStackTrace(this, this.constructor);
  }
}
class h extends H {
  constructor(e, t = "config") {
    super(e, "APP_CONFIG_INVALID", t);
  }
}
class it extends H {
  constructor(e, t = "config") {
    super(e, "SESSION_TIMEOUT_INVALID", t);
  }
}
class _e extends H {
  constructor(e, t = "config") {
    super(e, "SAMPLING_RATE_INVALID", t);
  }
}
class D extends H {
  constructor(e, t = "config") {
    super(e, "INTEGRATION_INVALID", t);
  }
}
class Ar extends H {
  constructor(e, t, r = "runtime") {
    super(e, "INITIALIZATION_TIMEOUT", r), this.timeoutMs = t;
  }
}
const ot = (s, e) => {
  if (e) {
    if (e instanceof Error) {
      const t = e.message.replace(/\s+at\s+.*$/gm, "").replace(/\s*\([^()]+:\d+:\d+\)/g, "");
      return `[TraceLog] ${s}: ${t}`;
    }
    if (e instanceof Error)
      return `[TraceLog] ${s}: ${e.message}`;
    if (typeof e == "string")
      return `[TraceLog] ${s}: ${e}`;
    if (typeof e == "object")
      try {
        return `[TraceLog] ${s}: ${JSON.stringify(e)}`;
      } catch {
        return `[TraceLog] ${s}: [Unable to serialize error]`;
      }
    return `[TraceLog] ${s}: ${String(e)}`;
  }
  return `[TraceLog] ${s}`;
}, a = (s, e, t) => {
  const { error: r, data: n, showToClient: i = !1, style: o } = t ?? {}, l = r ? ot(e, r) : `[TraceLog] ${e}`, c = s === "error" ? "error" : s === "warn" ? "warn" : "log";
  if (s === "debug" || s === "info" && !i)
    return;
  const u = o !== void 0 && o !== "", m = u ? `%c${l}` : l;
  if (n !== void 0) {
    const E = re(n);
    u ? console[c](m, o, E) : console[c](m, E);
  } else
    u ? console[c](m, o) : console[c](m);
}, re = (s) => {
  const e = {}, t = ["token", "password", "secret", "key", "apikey", "api_key", "sessionid", "session_id"];
  for (const [r, n] of Object.entries(s)) {
    const i = r.toLowerCase();
    if (t.some((o) => i.includes(o))) {
      e[r] = "[REDACTED]";
      continue;
    }
    n !== null && typeof n == "object" && !Array.isArray(n) ? e[r] = re(n) : Array.isArray(n) ? e[r] = n.map(
      (o) => o !== null && typeof o == "object" && !Array.isArray(o) ? re(o) : o
    ) : e[r] = n;
  }
  return e;
};
let se, Pe;
const at = () => {
  typeof window < "u" && !se && (se = window.matchMedia("(pointer: coarse)"), Pe = window.matchMedia("(hover: none)"));
}, lt = () => {
  try {
    const s = navigator;
    if (s.userAgentData && typeof s.userAgentData.mobile == "boolean")
      return s.userAgentData.platform && /ipad|tablet/i.test(s.userAgentData.platform) ? L.Tablet : s.userAgentData.mobile ? L.Mobile : L.Desktop;
    at();
    const e = window.innerWidth, t = se?.matches ?? !1, r = Pe?.matches ?? !1, n = "ontouchstart" in window || navigator.maxTouchPoints > 0, i = navigator.userAgent.toLowerCase(), o = /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/.test(i), l = /tablet|ipad|android(?!.*mobile)/.test(i);
    return e <= 767 || o && n ? L.Mobile : e >= 768 && e <= 1024 || l || t && r && n ? L.Tablet : L.Desktop;
  } catch (s) {
    return a("warn", "Device detection failed, defaulting to desktop", { error: s }), L.Desktop;
  }
}, De = "background: #ff9800; color: white; font-weight: bold; padding: 2px 8px; border-radius: 3px;", Ve = "background: #9e9e9e; color: white; font-weight: bold; padding: 2px 8px; border-radius: 3px;", ve = ["scroll", "web_vitals", "error"], ke = [
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
], Ie = 500, we = 5e3, W = 50, ct = W * 2, Ue = 1, ut = 1e3, dt = 10, ye = 5e3, ht = 6e4, br = {
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
}, Ae = {
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
}, ft = {
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
}, ne = "needs-improvement", be = (s = ne) => {
  switch (s) {
    case "all":
      return { LCP: 0, FCP: 0, CLS: 0, INP: 0, TTFB: 0, LONG_TASK: 0 };
    // Track everything
    case "needs-improvement":
      return Ae;
    case "poor":
      return ft;
    default:
      return Ae;
  }
}, gt = 1e3, mt = 50, Et = () => {
  if (typeof window > "u" || typeof document > "u")
    return !1;
  try {
    const s = new URLSearchParams(window.location.search), e = s.get(pe), t = sessionStorage.getItem(U);
    let r = null;
    if (e === Se ? (r = !0, sessionStorage.setItem(U, "true"), a("info", "QA Mode ACTIVE", {
      showToClient: !0,
      style: De
    })) : e === Te && (r = !1, sessionStorage.setItem(U, "false"), a("info", "QA Mode DISABLED", {
      showToClient: !0,
      style: Ve
    })), e === Se || e === Te)
      try {
        s.delete(pe);
        const n = s.toString(), i = window.location.pathname + (n ? "?" + n : "") + window.location.hash;
        window.history.replaceState({}, "", i);
      } catch {
      }
    return r ?? t === "true";
  } catch {
    return !1;
  }
}, pt = (s) => {
  if (!(typeof window > "u" || typeof document > "u"))
    try {
      s ? (sessionStorage.setItem(U, "true"), a("info", "QA Mode ENABLED", {
        showToClient: !0,
        style: De
      })) : (sessionStorage.setItem(U, "false"), a("info", "QA Mode DISABLED", {
        showToClient: !0,
        style: Ve
      }));
    } catch {
      a("warn", "Cannot set QA mode: sessionStorage unavailable");
    }
}, Me = () => {
  const s = new URLSearchParams(window.location.search), e = {};
  return Ze.forEach((r) => {
    const n = s.get(r);
    if (n) {
      const i = r.split("utm_")[1];
      e[i] = n;
    }
  }), Object.keys(e).length ? e : void 0;
}, St = () => typeof crypto < "u" && crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (s) => {
  const e = Math.random() * 16 | 0;
  return (s === "x" ? e : e & 3 | 8).toString(16);
}), Tt = () => {
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
}, He = (s, e = !1) => {
  try {
    const t = new URL(s), r = t.protocol === "https:", n = t.protocol === "http:";
    return r || e && n;
  } catch {
    return !1;
  }
}, _t = (s) => {
  try {
    const t = new URL(window.location.href).hostname;
    if (!t || typeof t != "string")
      throw new Error("Invalid hostname");
    if (t === "localhost" || t === "127.0.0.1" || /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(t))
      throw new Error(
        "SaaS integration not supported on localhost or IP addresses. Use custom backend integration instead."
      );
    const r = t.split(".");
    if (!r || !Array.isArray(r) || r.length === 0 || r.length === 1 && r[0] === "")
      throw new Error("Invalid hostname structure");
    if (r.length === 1)
      throw new Error("Single-part domain not supported for SaaS integration");
    let n;
    if (r.length === 2 ? n = r.join(".") : n = r.slice(-2).join("."), !n || n.split(".").length < 2)
      throw new Error("Invalid domain structure for SaaS");
    const i = `https://${s}.${n}/collect`;
    if (!He(i))
      throw new Error("Generated URL failed validation");
    return i;
  } catch (e) {
    throw new Error(`Invalid SaaS URL configuration: ${e instanceof Error ? e.message : String(e)}`);
  }
}, vt = (s) => {
  const e = {};
  s.integrations?.tracelog?.projectId && (e.saas = _t(s.integrations.tracelog.projectId));
  const t = s.integrations?.custom?.collectApiUrl;
  if (t) {
    const r = s.integrations?.custom?.allowHttp ?? !1;
    if (!He(t, r))
      throw new Error("Invalid custom API URL");
    e.custom = t;
  }
  return e;
}, ie = (s, e = []) => {
  if (!s || typeof s != "string")
    return a("warn", "Invalid URL provided to normalizeUrl", { data: { url: String(s) } }), s || "";
  try {
    const t = new URL(s), r = t.searchParams, n = [.../* @__PURE__ */ new Set([...et, ...e])];
    let i = !1;
    const o = [];
    return n.forEach((c) => {
      r.has(c) && (r.delete(c), i = !0, o.push(c));
    }), !i && s.includes("?") ? s : (t.search = r.toString(), t.toString());
  } catch (t) {
    const r = s && typeof s == "string" ? s.slice(0, 100) : String(s);
    return a("warn", "URL normalization failed, returning original", { error: t, data: { url: r } }), s;
  }
}, Le = (s) => {
  if (!s || typeof s != "string" || s.trim().length === 0)
    return "";
  let e = s;
  s.length > 1e3 && (e = s.slice(0, Math.max(0, 1e3)));
  let t = 0;
  for (const n of tt) {
    const i = e;
    e = e.replace(n, ""), i !== e && t++;
  }
  return t > 0 && a("warn", "XSS patterns detected and removed", {
    data: {
      patternMatches: t,
      originalValue: s.slice(0, 100)
    }
  }), e = e.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#x27;").replaceAll("/", "&#x2F;"), e.trim();
}, oe = (s, e = 0) => {
  if (e > 3 || s == null)
    return null;
  if (typeof s == "string")
    return Le(s);
  if (typeof s == "number")
    return !Number.isFinite(s) || s < -Number.MAX_SAFE_INTEGER || s > Number.MAX_SAFE_INTEGER ? 0 : s;
  if (typeof s == "boolean")
    return s;
  if (Array.isArray(s))
    return s.slice(0, 100).map((n) => oe(n, e + 1)).filter((n) => n !== null);
  if (typeof s == "object") {
    const t = {}, n = Object.entries(s).slice(0, 20);
    for (const [i, o] of n) {
      const l = Le(i);
      if (l) {
        const c = oe(o, e + 1);
        c !== null && (t[l] = c);
      }
    }
    return t;
  }
  return null;
}, It = (s) => {
  if (typeof s != "object" || s === null)
    return {};
  try {
    const e = oe(s);
    return typeof e == "object" && e !== null ? e : {};
  } catch (e) {
    const t = e instanceof Error ? e.message : String(e);
    throw new Error(`[TraceLog] Metadata sanitization failed: ${t}`);
  }
}, wt = (s) => {
  if (s !== void 0 && (s === null || typeof s != "object"))
    throw new h("Configuration must be an object", "config");
  if (s) {
    if (s.sessionTimeout !== void 0 && (typeof s.sessionTimeout != "number" || s.sessionTimeout < 3e4 || s.sessionTimeout > 864e5))
      throw new it(g.INVALID_SESSION_TIMEOUT, "config");
    if (s.globalMetadata !== void 0 && (typeof s.globalMetadata != "object" || s.globalMetadata === null))
      throw new h(g.INVALID_GLOBAL_METADATA, "config");
    if (s.integrations && At(s.integrations), s.sensitiveQueryParams !== void 0) {
      if (!Array.isArray(s.sensitiveQueryParams))
        throw new h(g.INVALID_SENSITIVE_QUERY_PARAMS, "config");
      for (const e of s.sensitiveQueryParams)
        if (typeof e != "string")
          throw new h("All sensitive query params must be strings", "config");
    }
    if (s.errorSampling !== void 0 && (typeof s.errorSampling != "number" || s.errorSampling < 0 || s.errorSampling > 1))
      throw new _e(g.INVALID_ERROR_SAMPLING_RATE, "config");
    if (s.samplingRate !== void 0 && (typeof s.samplingRate != "number" || s.samplingRate < 0 || s.samplingRate > 1))
      throw new _e(g.INVALID_SAMPLING_RATE, "config");
    if (s.primaryScrollSelector !== void 0) {
      if (typeof s.primaryScrollSelector != "string" || !s.primaryScrollSelector.trim())
        throw new h(g.INVALID_PRIMARY_SCROLL_SELECTOR, "config");
      if (s.primaryScrollSelector !== "window")
        try {
          document.querySelector(s.primaryScrollSelector);
        } catch {
          throw new h(
            `${g.INVALID_PRIMARY_SCROLL_SELECTOR_SYNTAX}: "${s.primaryScrollSelector}"`,
            "config"
          );
        }
    }
    if (s.pageViewThrottleMs !== void 0 && (typeof s.pageViewThrottleMs != "number" || s.pageViewThrottleMs < 0))
      throw new h(g.INVALID_PAGE_VIEW_THROTTLE, "config");
    if (s.clickThrottleMs !== void 0 && (typeof s.clickThrottleMs != "number" || s.clickThrottleMs < 0))
      throw new h(g.INVALID_CLICK_THROTTLE, "config");
    if (s.maxSameEventPerMinute !== void 0 && (typeof s.maxSameEventPerMinute != "number" || s.maxSameEventPerMinute <= 0))
      throw new h(g.INVALID_MAX_SAME_EVENT_PER_MINUTE, "config");
    if (s.viewport !== void 0 && yt(s.viewport), s.disabledEvents !== void 0) {
      if (!Array.isArray(s.disabledEvents))
        throw new h("disabledEvents must be an array", "config");
      const e = /* @__PURE__ */ new Set();
      for (const t of s.disabledEvents) {
        if (typeof t != "string")
          throw new h("All disabled event types must be strings", "config");
        if (!ve.includes(t))
          throw new h(
            `Invalid disabled event type: "${t}". Must be one of: ${ve.join(", ")}`,
            "config"
          );
        if (e.has(t))
          throw new h(
            `Duplicate disabled event type found: "${t}". Each event type should appear only once.`,
            "config"
          );
        e.add(t);
      }
    }
    if (s.webVitalsMode !== void 0) {
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
}, yt = (s) => {
  if (typeof s != "object" || s === null)
    throw new h(g.INVALID_VIEWPORT_CONFIG, "config");
  if (!s.elements || !Array.isArray(s.elements))
    throw new h(g.INVALID_VIEWPORT_ELEMENTS, "config");
  if (s.elements.length === 0)
    throw new h(g.INVALID_VIEWPORT_ELEMENTS, "config");
  const e = /* @__PURE__ */ new Set();
  for (const t of s.elements) {
    if (!t.selector || typeof t.selector != "string" || !t.selector.trim())
      throw new h(g.INVALID_VIEWPORT_ELEMENT, "config");
    const r = t.selector.trim();
    if (e.has(r))
      throw new h(
        `Duplicate viewport selector found: "${r}". Each selector should appear only once.`,
        "config"
      );
    if (e.add(r), t.id !== void 0 && (typeof t.id != "string" || !t.id.trim()))
      throw new h(g.INVALID_VIEWPORT_ELEMENT_ID, "config");
    if (t.name !== void 0 && (typeof t.name != "string" || !t.name.trim()))
      throw new h(g.INVALID_VIEWPORT_ELEMENT_NAME, "config");
  }
  if (s.threshold !== void 0 && (typeof s.threshold != "number" || s.threshold < 0 || s.threshold > 1))
    throw new h(g.INVALID_VIEWPORT_THRESHOLD, "config");
  if (s.minDwellTime !== void 0 && (typeof s.minDwellTime != "number" || s.minDwellTime < 0))
    throw new h(g.INVALID_VIEWPORT_MIN_DWELL_TIME, "config");
  if (s.cooldownPeriod !== void 0 && (typeof s.cooldownPeriod != "number" || s.cooldownPeriod < 0))
    throw new h(g.INVALID_VIEWPORT_COOLDOWN_PERIOD, "config");
  if (s.maxTrackedElements !== void 0 && (typeof s.maxTrackedElements != "number" || s.maxTrackedElements <= 0))
    throw new h(g.INVALID_VIEWPORT_MAX_TRACKED_ELEMENTS, "config");
}, At = (s) => {
  if (s) {
    if (s.tracelog && (!s.tracelog.projectId || typeof s.tracelog.projectId != "string" || s.tracelog.projectId.trim() === ""))
      throw new D(g.INVALID_TRACELOG_PROJECT_ID, "config");
    if (s.custom) {
      if (!s.custom.collectApiUrl || typeof s.custom.collectApiUrl != "string" || s.custom.collectApiUrl.trim() === "")
        throw new D(g.INVALID_CUSTOM_API_URL, "config");
      if (s.custom.allowHttp !== void 0 && typeof s.custom.allowHttp != "boolean")
        throw new D("allowHttp must be a boolean", "config");
      const e = s.custom.collectApiUrl.trim();
      if (!e.startsWith("http://") && !e.startsWith("https://"))
        throw new D('Custom API URL must start with "http://" or "https://"', "config");
      if (!(s.custom.allowHttp ?? !1) && e.startsWith("http://"))
        throw new D(
          "Custom API URL must use HTTPS in production. Set allowHttp: true in integration config to allow HTTP (not recommended)",
          "config"
        );
    }
  }
}, bt = (s) => {
  wt(s);
  const e = {
    ...s ?? {},
    sessionTimeout: s?.sessionTimeout ?? 9e5,
    globalMetadata: s?.globalMetadata ?? {},
    sensitiveQueryParams: s?.sensitiveQueryParams ?? [],
    errorSampling: s?.errorSampling ?? Ue,
    samplingRate: s?.samplingRate ?? 1,
    pageViewThrottleMs: s?.pageViewThrottleMs ?? 1e3,
    clickThrottleMs: s?.clickThrottleMs ?? 300,
    maxSameEventPerMinute: s?.maxSameEventPerMinute ?? 60,
    disabledEvents: s?.disabledEvents ?? []
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
}, Mt = (s) => {
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
}, xe = (s, e = 0) => {
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
        } else if (!t.every((o) => Mt(o)))
          return !1;
        continue;
      }
      if (r === "object" && e === 0) {
        if (!xe(t, e + 1))
          return !1;
        continue;
      }
      return !1;
    }
  }
  return !0;
}, Lt = (s) => typeof s != "string" ? {
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
} : { valid: !0 }, Re = (s, e, t) => {
  const r = It(e), n = t && t === "customEvent" ? `${t} "${s}" metadata error` : `${s} metadata error`;
  if (!xe(r))
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
      for (const u of c)
        if (typeof u == "string" && u.length > 500)
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
}, Fe = (s, e, t) => {
  if (Array.isArray(e)) {
    const r = [], n = t && t === "customEvent" ? `${t} "${s}" metadata error` : `${s} metadata error`;
    for (let i = 0; i < e.length; i++) {
      const o = e[i];
      if (typeof o != "object" || o === null || Array.isArray(o))
        return {
          valid: !1,
          error: `${n}: array item at index ${i} must be an object.`
        };
      const l = Re(s, o, t);
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
  return Re(s, e, t);
}, Rt = (s, e) => {
  const t = Lt(s);
  if (!t.valid)
    return a("error", "Event name validation failed", {
      showToClient: !0,
      data: { eventName: s, error: t.error }
    }), t;
  if (!e)
    return { valid: !0 };
  const r = Fe(s, e, "customEvent");
  return r.valid || a("error", "Event metadata validation failed", {
    showToClient: !0,
    data: {
      eventName: s,
      error: r.error
    }
  }), r;
};
class Ct {
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
  on(e, t) {
    this.listeners.has(e) || this.listeners.set(e, []), this.listeners.get(e).push(t);
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
  off(e, t) {
    const r = this.listeners.get(e);
    if (r) {
      const n = r.indexOf(t);
      n > -1 && r.splice(n, 1);
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
  emit(e, t) {
    const r = this.listeners.get(e);
    r && r.forEach((n) => {
      n(t);
    });
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
function $e(s, e, t) {
  try {
    const r = e(s);
    return r === null ? null : typeof r == "object" && r !== null && "type" in r ? r : (a("warn", `beforeSend transformer returned invalid data, using original [${t}]`), s);
  } catch (r) {
    return a("error", `beforeSend transformer threw error, using original event [${t}]`, { error: r }), s;
  }
}
function Nt(s, e, t) {
  return s.map((r) => $e(r, e, t)).filter((r) => r !== null);
}
function Be(s, e, t) {
  try {
    const r = e(s);
    return r === null ? (a("debug", `Batch filtered by beforeBatch transformer [${t}]`, {
      data: { eventCount: s.events.length }
    }), null) : typeof r == "object" && r !== null && Array.isArray(r.events) ? r : (a("warn", `beforeBatch transformer returned invalid data, using original [${t}]`, {
      data: { eventCount: s.events.length }
    }), s);
  } catch (r) {
    return a("error", `beforeBatch transformer threw error, using original batch [${t}]`, {
      error: r,
      data: { eventCount: s.events.length }
    }), s;
  }
}
const q = {};
class v {
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
  get(e) {
    return q[e];
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
  set(e, t) {
    q[e] = t;
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
    return { ...q };
  }
}
class Ce extends v {
  storeManager;
  integrationId;
  apiUrl;
  transformers;
  lastPermanentErrorLog = null;
  recoveryInProgress = !1;
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
  constructor(e, t, r, n = {}) {
    if (super(), t && !r || !t && r)
      throw new Error("SenderManager: integrationId and apiUrl must either both be provided or both be undefined");
    this.storeManager = e, this.integrationId = t, this.apiUrl = r, this.transformers = n;
  }
  /**
   * Get the integration ID for this sender
   * @returns The integration ID ('saas' or 'custom') or undefined if not set
   */
  getIntegrationId() {
    return this.integrationId;
  }
  getQueueStorageKey() {
    const e = this.get("userId") || "anonymous", t = rt(e);
    return this.integrationId ? `${t}:${this.integrationId}` : t;
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
  sendEventsQueueSync(e) {
    return this.shouldSkipSend() ? !0 : this.apiUrl?.includes(V.Fail) ? (a(
      "warn",
      `Fail mode: simulating network failure (sync)${this.integrationId ? ` [${this.integrationId}]` : ""}`,
      {
        data: { events: e.events.length }
      }
    ), !1) : this.apiUrl?.includes(V.Localhost) ? (a(
      "debug",
      `Success mode: simulating successful send (sync)${this.integrationId ? ` [${this.integrationId}]` : ""}`,
      {
        data: { events: e.events.length }
      }
    ), !0) : this.sendQueueSyncInternal(e);
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
  async sendEventsQueue(e, t) {
    try {
      const r = await this.send(e);
      return r ? (this.clearPersistedEvents(), t?.onSuccess?.(e.events.length, e.events, e)) : (this.persistEvents(e), t?.onFailure?.()), r;
    } catch (r) {
      return r instanceof N ? (this.logPermanentError("Permanent error, not retrying", r), this.clearPersistedEvents(), t?.onFailure?.(), !1) : (this.persistEvents(e), t?.onFailure?.(), !1);
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
      if (t instanceof N) {
        this.logPermanentError("Permanent error during recovery, clearing persisted events", t), this.clearPersistedEvents(), e?.onFailure?.();
        return;
      }
      a("error", "Failed to recover persisted events", { error: t });
    } finally {
      this.recoveryInProgress = !1;
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
  applyBeforeSendTransformer(e) {
    if (this.integrationId === "saas")
      return e;
    const t = this.transformers.beforeSend;
    if (!t)
      return e;
    const r = Nt(
      e.events,
      t,
      this.integrationId || "SenderManager"
    );
    return r.length === 0 ? null : {
      ...e,
      events: r
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
  applyBeforeBatchTransformer(e) {
    if (this.integrationId === "saas")
      return e;
    const t = this.transformers.beforeBatch;
    return t ? Be(e, t, this.integrationId || "SenderManager") : e;
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
  async backoffDelay(e) {
    const t = 100 * Math.pow(2, e), r = Math.random() * 100, n = t + r;
    return new Promise((i) => setTimeout(i, n));
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
  async send(e) {
    if (this.shouldSkipSend())
      return this.simulateSuccessfulSend();
    const t = this.applyBeforeSendTransformer(e);
    if (!t)
      return !0;
    const r = this.applyBeforeBatchTransformer(t);
    if (!r)
      return !0;
    if (this.apiUrl?.includes(V.Fail))
      return a("warn", `Fail mode: simulating network failure${this.integrationId ? ` [${this.integrationId}]` : ""}`, {
        data: { events: r.events.length }
      }), !1;
    if (this.apiUrl?.includes(V.Localhost))
      return a("debug", `Success mode: simulating successful send${this.integrationId ? ` [${this.integrationId}]` : ""}`, {
        data: { events: r.events.length }
      }), !0;
    const { url: n, payload: i } = this.prepareRequest(r);
    for (let o = 1; o <= 3; o++)
      try {
        return (await this.sendWithTimeout(n, i)).ok ? (o > 1 && a(
          "info",
          `Send succeeded after ${o - 1} retry attempt(s)${this.integrationId ? ` [${this.integrationId}]` : ""}`,
          {
            data: { events: r.events.length, attempt: o }
          }
        ), !0) : !1;
      } catch (l) {
        const c = o === 3;
        if (l instanceof N)
          throw l;
        if (a(
          c ? "error" : "warn",
          `Send attempt ${o} failed${this.integrationId ? ` [${this.integrationId}]` : ""}${c ? " (all retries exhausted)" : ", will retry"}`,
          {
            error: l,
            data: {
              events: e.events.length,
              url: n.replace(/\/\/[^/]+/, "//[DOMAIN]"),
              attempt: o,
              maxAttempts: 3
            }
          }
        ), !c) {
          await this.backoffDelay(o);
          continue;
        }
        return !1;
      }
    return !1;
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
        throw i.status >= 400 && i.status < 500 && i.status !== 408 && i.status !== 429 ? new N(`HTTP ${i.status}: ${i.statusText}`, i.status) : new Error(`HTTP ${i.status}: ${i.statusText}`);
      return i;
    } finally {
      clearTimeout(n);
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
  sendQueueSyncInternal(e) {
    const t = this.applyBeforeSendTransformer(e);
    if (!t)
      return !0;
    const r = this.applyBeforeBatchTransformer(t);
    if (!r)
      return !0;
    const { url: n, payload: i } = this.prepareRequest(r);
    if (i.length > 65536)
      return a(
        "warn",
        `Payload exceeds sendBeacon limit, persisting for recovery${this.integrationId ? ` [${this.integrationId}]` : ""}`,
        {
          data: {
            size: i.length,
            limit: 65536,
            events: r.events.length
          }
        }
      ), this.persistEvents(r), !1;
    const o = new Blob([i], { type: "application/json" });
    if (!this.isSendBeaconAvailable())
      return a(
        "warn",
        `sendBeacon not available, persisting events for recovery${this.integrationId ? ` [${this.integrationId}]` : ""}`
      ), this.persistEvents(r), !1;
    const l = navigator.sendBeacon(n, o);
    return l || (a(
      "warn",
      `sendBeacon rejected request, persisting events for recovery${this.integrationId ? ` [${this.integrationId}]` : ""}`
    ), this.persistEvents(r)), l;
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
  prepareRequest(e) {
    const t = {
      ...e,
      _metadata: {
        referer: typeof window < "u" ? window.location.href : void 0,
        timestamp: Date.now()
      }
    };
    return {
      url: this.apiUrl || "",
      payload: JSON.stringify(t)
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
      const e = this.getQueueStorageKey(), t = this.storeManager.getItem(e);
      if (t)
        return JSON.parse(t);
    } catch (e) {
      a("warn", `Failed to parse persisted data${this.integrationId ? ` [${this.integrationId}]` : ""}`, { error: e }), this.clearPersistedEvents();
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
  isDataRecent(e) {
    return !e.timestamp || typeof e.timestamp != "number" ? !1 : (Date.now() - e.timestamp) / (1e3 * 60 * 60) < 2;
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
  createRecoveryBody(e) {
    const { timestamp: t, ...r } = e;
    return r;
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
  persistEvents(e) {
    try {
      const t = this.getPersistedData();
      if (t && t.timestamp) {
        const i = Date.now() - t.timestamp;
        if (i < 1e3)
          return a(
            "debug",
            `Skipping persistence, another tab recently persisted events${this.integrationId ? ` [${this.integrationId}]` : ""}`,
            {
              data: { timeSinceExisting: i }
            }
          ), !0;
      }
      const r = {
        ...e,
        timestamp: Date.now()
      }, n = this.getQueueStorageKey();
      return this.storeManager.setItem(n, JSON.stringify(r)), !!this.storeManager.getItem(n);
    } catch (t) {
      return a("warn", `Failed to persist events${this.integrationId ? ` [${this.integrationId}]` : ""}`, { error: t }), !1;
    }
  }
  clearPersistedEvents() {
    try {
      const e = this.getQueueStorageKey();
      this.storeManager.removeItem(e);
    } catch (e) {
      a("warn", `Failed to clear persisted events${this.integrationId ? ` [${this.integrationId}]` : ""}`, { error: e });
    }
  }
  shouldSkipSend() {
    return !this.apiUrl;
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
    (!this.lastPermanentErrorLog || this.lastPermanentErrorLog.statusCode !== t.statusCode || r - this.lastPermanentErrorLog.timestamp >= ht) && (a("error", `${e}${this.integrationId ? ` [${this.integrationId}]` : ""}`, {
      data: { status: t.statusCode, message: t.message }
    }), this.lastPermanentErrorLog = { statusCode: t.statusCode, timestamp: r });
  }
}
class Ot extends v {
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
    [d.CLICK]: 0,
    [d.PAGE_VIEW]: 0,
    [d.CUSTOM]: 0,
    [d.VIEWPORT_VISIBLE]: 0,
    [d.SCROLL]: 0
  };
  saveSessionCountsDebounced = null;
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
  constructor(e, t = null, r = {}) {
    super(), this.emitter = t, this.transformers = r, this.dataSenders = [];
    const n = this.get("collectApiUrls");
    n?.saas && this.dataSenders.push(new Ce(e, "saas", n.saas, r)), n?.custom && this.dataSenders.push(new Ce(e, "custom", n.custom, r)), this.saveSessionCountsDebounced = this.debounce((i) => {
      this.saveSessionCounts(i);
    }, 500);
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
    const e = this.dataSenders.map(
      async (t) => t.recoverPersistedEvents({
        onSuccess: (r, n, i) => {
          if (n && n.length > 0) {
            const o = n.map((l) => l.id);
            this.removeProcessedEvents(o), i && this.emitEventsQueue(i);
          }
        },
        onFailure: () => {
          a("warn", "Failed to recover persisted events");
        }
      })
    );
    await Promise.allSettled(e);
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
    type: e,
    page_url: t,
    from_page_url: r,
    scroll_data: n,
    click_data: i,
    custom_event: o,
    web_vitals: l,
    error_data: c,
    session_end_reason: u,
    viewport_data: m
  }) {
    if (!e) {
      a("error", "Event type is required - event will be ignored");
      return;
    }
    const E = this.get("sessionId");
    if (!E) {
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
        session_end_reason: u,
        viewport_data: m
      });
      return;
    }
    this.lastSessionId !== E && (this.lastSessionId = E, this.sessionEventCounts = this.loadSessionCounts(E));
    const p = e === d.SESSION_START || e === d.SESSION_END;
    if (!p && !this.checkRateLimit())
      return;
    const S = e;
    if (!p) {
      if (this.sessionEventCounts.total >= 1e3) {
        a("warn", "Session event limit reached", {
          data: {
            type: S,
            total: this.sessionEventCounts.total,
            limit: 1e3
          }
        });
        return;
      }
      const T = this.getTypeLimitForEvent(S);
      if (T) {
        const Y = this.sessionEventCounts[S];
        if (Y !== void 0 && Y >= T) {
          a("warn", "Session event type limit reached", {
            data: {
              type: S,
              count: Y,
              limit: T
            }
          });
          return;
        }
      }
    }
    if (S === d.CUSTOM && o?.name) {
      const T = this.get("config")?.maxSameEventPerMinute ?? 60;
      if (!this.checkPerEventRateLimit(o.name, T))
        return;
    }
    const Ye = S === d.SESSION_START, qe = t || this.get("pageUrl"), F = this.buildEventPayload({
      type: S,
      page_url: qe,
      from_page_url: r,
      scroll_data: n,
      click_data: i,
      custom_event: o,
      web_vitals: l,
      error_data: c,
      session_end_reason: u,
      viewport_data: m
    });
    if (F && !(!p && !this.shouldSample())) {
      if (Ye) {
        const T = this.get("sessionId");
        if (!T) {
          a("error", "Session start event requires sessionId - event will be ignored");
          return;
        }
        if (this.get("hasStartSession")) {
          a("warn", "Duplicate session_start detected", {
            data: { sessionId: T }
          });
          return;
        }
        this.set("hasStartSession", !0);
      }
      if (!this.isDuplicateEvent(F)) {
        if (this.get("mode") === X.QA && S === d.CUSTOM && o) {
          a("info", `Custom Event: ${o.name}`, {
            showToClient: !0,
            data: {
              name: o.name,
              ...o.metadata && { metadata: o.metadata }
            }
          }), this.emitEvent(F);
          return;
        }
        if (this.addToQueue(F), !p) {
          this.sessionEventCounts.total++, this.sessionEventCounts[S] !== void 0 && this.sessionEventCounts[S]++;
          const T = this.get("sessionId");
          T && this.saveSessionCountsDebounced && this.saveSessionCountsDebounced(T);
        }
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
    this.sendIntervalId && (clearInterval(this.sendIntervalId), this.sendIntervalId = null);
    const e = this.get("sessionId");
    e && this.saveSessionCounts(e), this.eventsQueue = [], this.pendingEventsBuffer = [], this.recentEventFingerprints.clear(), this.rateLimitCounter = 0, this.rateLimitWindowStart = 0, this.perEventRateLimits.clear(), this.sessionEventCounts = {
      total: 0,
      [d.CLICK]: 0,
      [d.PAGE_VIEW]: 0,
      [d.CUSTOM]: 0,
      [d.VIEWPORT_VISIBLE]: 0,
      [d.SCROLL]: 0
    }, this.lastSessionId = null, this.set("hasStartSession", !1), this.dataSenders.forEach((t) => {
      t.stop();
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
    return this.flushEvents(!1);
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
    return this.flushEvents(!0);
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
  isSuccessfulResult(e) {
    return e.status === "fulfilled" && e.value === !0;
  }
  flushEvents(e) {
    if (this.eventsQueue.length === 0)
      return e ? !0 : Promise.resolve(!0);
    const t = this.buildEventsPayload(), r = [...this.eventsQueue], n = r.map((i) => i.id);
    if (this.dataSenders.length === 0)
      return this.removeProcessedEvents(n), this.clearSendInterval(), this.emitEventsQueue(t), e ? !0 : Promise.resolve(!0);
    if (e) {
      const o = this.dataSenders.map((l) => l.sendEventsQueueSync(t)).some((l) => l);
      return o ? (this.removeProcessedEvents(n), this.clearSendInterval(), this.emitEventsQueue(t)) : (this.clearSendInterval(), a("warn", "Sync flush failed for all integrations, events remain in queue for next flush", {
        data: { eventCount: n.length }
      })), o;
    } else {
      const i = this.dataSenders.map(
        async (o) => o.sendEventsQueue(t, {
          onSuccess: () => {
          },
          onFailure: () => {
          }
        })
      );
      return Promise.allSettled(i).then((o) => {
        const l = o.some((c) => this.isSuccessfulResult(c));
        if (l) {
          this.removeProcessedEvents(n), this.clearSendInterval(), this.emitEventsQueue(t);
          const c = o.filter((u) => !this.isSuccessfulResult(u)).length;
          c > 0 && a(
            "warn",
            "Async flush completed with partial success, events removed from queue and persisted per failed integration",
            {
              data: { eventCount: r.length, succeededCount: o.length - c, failedCount: c }
            }
          );
        } else
          this.removeProcessedEvents(n), this.clearSendInterval(), a("error", "Async flush failed for all integrations, events persisted per-integration for recovery", {
            data: { eventCount: r.length, integrations: this.dataSenders.length }
          });
        return l;
      });
    }
  }
  async sendEventsQueue() {
    if (!this.get("sessionId") || this.eventsQueue.length === 0)
      return;
    const e = this.buildEventsPayload();
    if (this.dataSenders.length === 0) {
      this.emitEventsQueue(e);
      return;
    }
    const t = [...this.eventsQueue], r = t.map((c) => c.id), n = this.dataSenders.map(
      async (c) => c.sendEventsQueue(e, {
        onSuccess: () => {
        },
        onFailure: () => {
        }
      })
    ), i = await Promise.allSettled(n);
    this.removeProcessedEvents(r), i.some((c) => this.isSuccessfulResult(c)) && this.emitEventsQueue(e), this.eventsQueue.length === 0 && this.clearSendInterval();
    const l = i.filter((c) => !this.isSuccessfulResult(c)).length;
    l > 0 && a("warn", "Events send completed with some failures, removed from queue and persisted per-integration", {
      data: { eventCount: t.length, failedCount: l }
    });
  }
  buildEventsPayload() {
    const e = /* @__PURE__ */ new Map(), t = [];
    for (const c of this.eventsQueue) {
      const u = this.createEventSignature(c);
      e.has(u) || t.push(u), e.set(u, c);
    }
    const r = t.map((c) => e.get(c)).filter((c) => !!c).sort((c, u) => c.timestamp - u.timestamp);
    let n = {
      user_id: this.get("userId"),
      session_id: this.get("sessionId"),
      device: this.get("device"),
      events: r,
      ...this.get("config")?.globalMetadata && { global_metadata: this.get("config")?.globalMetadata }
    };
    const i = this.get("collectApiUrls"), o = !!(i?.custom || i?.saas), l = this.transformers.beforeBatch;
    if (!o && l) {
      const c = Be(n, l, "EventManager");
      c !== null && (n = c);
    }
    return n;
  }
  buildEventPayload(e) {
    const t = e.type === d.SESSION_START, r = e.page_url ?? this.get("pageUrl");
    let n = {
      id: Tt(),
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
      ...t && Me() && { utm: Me() }
    };
    const i = this.get("collectApiUrls"), o = !!i?.custom, l = !!i?.saas, c = o || l, u = o && l, m = this.transformers.beforeSend;
    if (m && (!c || o && !u)) {
      const p = $e(n, m, "EventManager");
      if (p === null)
        return null;
      n = p;
    }
    return n;
  }
  isDuplicateEvent(e) {
    const t = Date.now(), r = this.createEventFingerprint(e), n = this.recentEventFingerprints.get(r);
    return n && t - n < 500 ? (this.recentEventFingerprints.set(r, t), !0) : (this.recentEventFingerprints.set(r, t), this.recentEventFingerprints.size > 1e3 && this.pruneOldFingerprints(), this.recentEventFingerprints.size > 2e3 && (this.recentEventFingerprints.clear(), this.recentEventFingerprints.set(r, t), a("warn", "Event fingerprint cache exceeded hard limit, cleared", {
      data: { hardLimit: 2e3 }
    })), !1);
  }
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
    if (this.emitEvent(e), this.eventsQueue.push(e), this.eventsQueue.length > 100) {
      const t = this.eventsQueue.findIndex(
        (n) => n.type !== d.SESSION_START && n.type !== d.SESSION_END
      ), r = t >= 0 ? this.eventsQueue.splice(t, 1)[0] : this.eventsQueue.shift();
      a("warn", "Event queue overflow, oldest non-critical event removed", {
        data: {
          maxLength: 100,
          currentLength: this.eventsQueue.length,
          removedEventType: r?.type,
          wasCritical: r?.type === d.SESSION_START || r?.type === d.SESSION_END
        }
      });
    }
    this.sendIntervalId || this.startSendInterval(), this.eventsQueue.length >= 50 && this.sendEventsQueue();
  }
  startSendInterval() {
    this.sendIntervalId = window.setInterval(() => {
      this.eventsQueue.length > 0 && this.sendEventsQueue();
    }, 1e4);
  }
  shouldSample() {
    const e = this.get("config")?.samplingRate ?? 1;
    return Math.random() < e;
  }
  checkRateLimit() {
    const e = Date.now();
    return e - this.rateLimitWindowStart > 1e3 && (this.rateLimitCounter = 0, this.rateLimitWindowStart = e), this.rateLimitCounter >= 50 ? !1 : (this.rateLimitCounter++, !0);
  }
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
  getTypeLimitForEvent(e) {
    return {
      [d.CLICK]: 500,
      [d.PAGE_VIEW]: 100,
      [d.CUSTOM]: 500,
      [d.VIEWPORT_VISIBLE]: 200,
      [d.SCROLL]: 120
    }[e] ?? null;
  }
  removeProcessedEvents(e) {
    const t = new Set(e);
    this.eventsQueue = this.eventsQueue.filter((r) => !t.has(r.id));
  }
  emitEvent(e) {
    this.emitter && this.emitter.emit(te.EVENT, e);
  }
  emitEventsQueue(e) {
    this.emitter && this.emitter.emit(te.QUEUE, e);
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
  debounce(e, t) {
    let r = null;
    return ((...n) => {
      r !== null && clearTimeout(r), r = setTimeout(() => {
        e(...n), r = null;
      }, t);
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
      [d.CLICK]: 0,
      [d.PAGE_VIEW]: 0,
      [d.CUSTOM]: 0,
      [d.VIEWPORT_VISIBLE]: 0,
      [d.SCROLL]: 0
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
  loadSessionCounts(e) {
    if (typeof window > "u" || typeof localStorage > "u")
      return this.getInitialCounts();
    const t = this.get("userId") || "anonymous", r = ee(t, e);
    try {
      const n = localStorage.getItem(r);
      if (!n)
        return this.getInitialCounts();
      const i = JSON.parse(n);
      return typeof i.total == "number" && typeof i[d.CLICK] == "number" && typeof i[d.PAGE_VIEW] == "number" && typeof i[d.CUSTOM] == "number" && typeof i[d.VIEWPORT_VISIBLE] == "number" && typeof i[d.SCROLL] == "number" ? i : (a("warn", "Invalid session counts structure in localStorage, resetting", {
        data: { sessionId: e, parsed: i }
      }), this.getInitialCounts());
    } catch (n) {
      return a("warn", "Failed to load session counts from localStorage", {
        error: n,
        data: { sessionId: e }
      }), this.getInitialCounts();
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
   * **Cleanup**: Counts are automatically deleted when the session ends via
   * SessionManager.cleanupSessionCounts(). This prevents localStorage pollution
   * and maintains a clean storage footprint (~100 bytes per active session only).
   *
   * @param sessionId - Current session identifier
   *
   * @internal
   */
  saveSessionCounts(e) {
    const t = this.get("userId") || "anonymous", r = ee(t, e);
    try {
      localStorage.setItem(r, JSON.stringify(this.sessionEventCounts));
    } catch (n) {
      a("warn", "Failed to persist session counts to localStorage", {
        error: n,
        data: { sessionId: e }
      });
    }
  }
}
class Pt {
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
  static getId(e) {
    const t = e.getItem(Ee);
    if (t)
      return t;
    const r = St();
    return e.setItem(Ee, r), r;
  }
}
class Dt extends v {
  storageManager;
  eventManager;
  projectId;
  activityHandler = null;
  visibilityChangeHandler = null;
  pageHideHandler = null;
  sessionTimeoutId = null;
  broadcastChannel = null;
  isTracking = !1;
  isEnding = !1;
  hasEndedSession = !1;
  /**
   * Creates a SessionManager instance.
   *
   * @param storageManager - Storage manager for session persistence
   * @param eventManager - Event manager for SESSION_START/SESSION_END events
   * @param projectId - Project identifier for namespacing session storage
   */
  constructor(e, t, r) {
    super(), this.storageManager = e, this.eventManager = t, this.projectId = r;
  }
  initCrossTabSync() {
    if (typeof BroadcastChannel > "u") {
      a("warn", "BroadcastChannel not supported");
      return;
    }
    const e = this.getProjectId();
    this.broadcastChannel = new BroadcastChannel(nt(e)), this.broadcastChannel.onmessage = (t) => {
      const { action: r, sessionId: n, timestamp: i, projectId: o } = t.data ?? {};
      if (o === e) {
        if (r === "session_end") {
          this.resetSessionState();
          return;
        }
        n && typeof i == "number" && i > Date.now() - 5e3 && (this.set("sessionId", n), this.persistSession(n, i), this.isTracking && this.setupSessionTimeout());
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
    return st(this.getProjectId());
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
      a("warn", "Session tracking already active");
      return;
    }
    const t = this.recoverSession() ?? this.generateSessionId(), r = !1;
    this.isTracking = !0, this.hasEndedSession = !1;
    try {
      this.set("sessionId", t), this.persistSession(t), this.initCrossTabSync(), this.shareSession(t), r || this.eventManager.track({
        type: d.SESSION_START
      }), this.setupSessionTimeout(), this.setupActivityListeners(), this.setupLifecycleListeners();
    } catch (n) {
      throw this.isTracking = !1, this.hasEndedSession = !1, this.clearSessionTimeout(), this.cleanupActivityListeners(), this.cleanupLifecycleListeners(), this.cleanupCrossTabSync(), this.set("sessionId", null), n;
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
    this.visibilityChangeHandler || this.pageHideHandler || (this.visibilityChangeHandler = () => {
      document.hidden ? this.clearSessionTimeout() : this.get("sessionId") && this.setupSessionTimeout();
    }, this.pageHideHandler = (e) => {
      e.persisted || this.endSession("page_unload");
    }, document.addEventListener("visibilitychange", this.visibilityChangeHandler), window.addEventListener("pagehide", this.pageHideHandler));
  }
  cleanupLifecycleListeners() {
    this.visibilityChangeHandler && (document.removeEventListener("visibilitychange", this.visibilityChangeHandler), this.visibilityChangeHandler = null), this.pageHideHandler && (window.removeEventListener("pagehide", this.pageHideHandler), this.pageHideHandler = null);
  }
  endSession(e) {
    if (this.isEnding || this.hasEndedSession)
      return;
    const t = this.get("sessionId");
    if (!t) {
      a("warn", "endSession called without active session", { data: { reason: e } }), this.resetSessionState(e);
      return;
    }
    this.isEnding = !0, this.hasEndedSession = !0;
    try {
      this.eventManager.track({
        type: d.SESSION_END,
        session_end_reason: e
      }), this.eventManager.flushImmediatelySync() || a("warn", "Sync flush failed during session end, events persisted for recovery", {
        data: { reason: e, sessionId: t }
      }), this.broadcastSessionEnd(t, e), this.cleanupSessionCounts(t), this.resetSessionState(e);
    } finally {
      this.isEnding = !1;
    }
  }
  /**
   * Cleans up persisted session event counts from localStorage.
   *
   * **Purpose**: Removes session counts for the current session after it ends
   * to prevent localStorage pollution over time.
   *
   * **Behavior**:
   * - Removes counts for the provided session ID
   * - Fails silently if localStorage unavailable or key doesn't exist
   * - Called automatically from `endSession()` after SESSION_END event
   *
   * **Storage Key**: `tlog:{userId}:session_counts:{sessionId}`
   *
   * **Why Not More Aggressive Cleanup**:
   * - Only cleans current session (not old sessions from previous days/weeks)
   * - Browser localStorage quota management handles very old data (FIFO)
   * - Keeps implementation simple and avoids complex timestamp-based cleanup
   *
   * **Future Enhancement**: Could scan and delete counts older than N days,
   * but current approach is sufficient for most use cases (~100 bytes per session).
   *
   * @param sessionId - Session identifier to cleanup counts for
   *
   * @internal
   */
  cleanupSessionCounts(e) {
    if (!(typeof window > "u" || typeof localStorage > "u"))
      try {
        const t = this.get("userId");
        if (!t) {
          a("debug", "Cannot cleanup session counts without userId");
          return;
        }
        const r = ee(t, e);
        localStorage.removeItem(r), a("debug", "Session counts cleaned up", { data: { sessionId: e } });
      } catch (t) {
        a("warn", "Failed to cleanup session counts", {
          error: t,
          data: { sessionId: e }
        });
      }
  }
  resetSessionState(e) {
    this.clearSessionTimeout(), this.cleanupActivityListeners(), this.cleanupLifecycleListeners(), this.cleanupCrossTabSync(), e !== "page_unload" && this.clearStoredSession(), this.set("sessionId", null), this.set("hasStartSession", !1), this.isTracking = !1;
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
    this.clearSessionTimeout(), this.cleanupActivityListeners(), this.cleanupCrossTabSync(), this.cleanupLifecycleListeners(), this.isTracking = !1, this.set("hasStartSession", !1);
  }
}
class Vt extends v {
  eventManager;
  storageManager;
  sessionManager = null;
  destroyed = !1;
  constructor(e, t) {
    super(), this.eventManager = t, this.storageManager = e;
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
    if (this.isActive())
      return;
    if (this.destroyed) {
      a("warn", "Cannot start tracking on destroyed handler");
      return;
    }
    const t = this.get("config")?.integrations?.tracelog?.projectId ?? "custom";
    try {
      this.sessionManager = new Dt(this.storageManager, this.eventManager, t), this.sessionManager.startTracking(), this.eventManager.flushPendingEvents();
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
    this.destroyed || (this.sessionManager && (this.sessionManager.destroy(), this.sessionManager = null), this.destroyed = !0, this.set("hasStartSession", !1));
  }
}
class kt extends v {
  eventManager;
  onTrack;
  originalPushState;
  originalReplaceState;
  lastPageViewTime = 0;
  constructor(e, t) {
    super(), this.eventManager = e, this.onTrack = t;
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
    this.trackInitialPageView(), window.addEventListener("popstate", this.trackCurrentPage, !0), window.addEventListener("hashchange", this.trackCurrentPage, !0), this.patchHistory("pushState"), this.patchHistory("replaceState");
  }
  /**
   * Stops tracking page views and restores original History API methods.
   *
   * - Removes event listeners (popstate, hashchange)
   * - Restores original pushState and replaceState methods
   * - Resets throttling state
   */
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
    const e = window.location.href, t = ie(e, this.get("config").sensitiveQueryParams);
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
      type: d.PAGE_VIEW,
      page_url: this.get("pageUrl"),
      from_page_url: i,
      ...o && { page_view: o }
    });
  };
  trackInitialPageView() {
    const e = ie(window.location.href, this.get("config").sensitiveQueryParams), t = this.extractPageViewData();
    this.lastPageViewTime = Date.now(), this.eventManager.track({
      type: d.PAGE_VIEW,
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
class Ut extends v {
  eventManager;
  lastClickTimes = /* @__PURE__ */ new Map();
  clickHandler;
  lastPruneTime = 0;
  constructor(e) {
    super(), this.eventManager = e;
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
        const m = this.extractTrackingData(o);
        if (m) {
          const E = this.createCustomEventData(m);
          this.eventManager.track({
            type: d.CUSTOM,
            custom_event: {
              name: E.name,
              ...E.value && { metadata: { value: E.value } }
            }
          });
        }
      }
      const u = this.generateClickData(n, l, c);
      this.eventManager.track({
        type: d.CLICK,
        click_data: u
      });
    }, window.addEventListener("click", this.clickHandler, !0));
  }
  /**
   * Stops tracking click events and cleans up resources.
   *
   * Removes the click event listener, clears throttle cache, and resets prune timer.
   * Prevents memory leaks by properly cleaning up all state.
   */
  stopTracking() {
    this.clickHandler && (window.removeEventListener("click", this.clickHandler, !0), this.clickHandler = void 0), this.lastClickTimes.clear(), this.lastPruneTime = 0;
  }
  shouldIgnoreElement(e) {
    return e.hasAttribute(`${I}-ignore`) ? !0 : e.closest(`[${I}-ignore]`) !== null;
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
    const r = e.getAttribute(`${I}-name`);
    return r ? `[${I}-name="${r}"]` : this.getElementPath(e);
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
    return e.hasAttribute(`${I}-name`) ? e : e.closest(`[${I}-name]`);
  }
  getRelevantClickElement(e) {
    for (const t of Je)
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
  clamp(e) {
    return Math.max(0, Math.min(1, Number(e.toFixed(3))));
  }
  calculateClickCoordinates(e, t) {
    const r = t.getBoundingClientRect(), n = e.clientX, i = e.clientY, o = r.width > 0 ? this.clamp((n - r.left) / r.width) : 0, l = r.height > 0 ? this.clamp((i - r.top) / r.height) : 0;
    return { x: n, y: i, relativeX: o, relativeY: l };
  }
  extractTrackingData(e) {
    const t = e.getAttribute(`${I}-name`), r = e.getAttribute(`${I}-value`);
    if (t)
      return {
        element: e,
        name: t,
        ...r && { value: r }
      };
  }
  generateClickData(e, t, r) {
    const { x: n, y: i, relativeX: o, relativeY: l } = r, c = this.getRelevantText(e, t), u = this.extractElementAttributes(t);
    return {
      x: n,
      y: i,
      relativeX: o,
      relativeY: l,
      tag: t.tagName.toLowerCase(),
      ...t.id && { id: t.id },
      ...t.className && { class: t.className },
      ...c && { text: c },
      ...u.href && { href: u.href },
      ...u.title && { title: u.title },
      ...u.alt && { alt: u.alt },
      ...u.role && { role: u.role },
      ...u["aria-label"] && { ariaLabel: u["aria-label"] },
      ...Object.keys(u).length > 0 && { dataAttributes: u }
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
  sanitizeText(e) {
    let t = e;
    for (const r of ke) {
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
class Ht extends v {
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
    this.limitWarningLogged = !1, this.applyConfigOverrides(), this.set("scrollEventCount", 0), this.tryDetectScrollContainers(0);
  }
  /**
   * Stops tracking scroll events and cleans up resources.
   *
   * Removes all scroll event listeners, clears debounce timers, cancels retry attempts,
   * and resets session state (event counter, warning flags). Prevents memory leaks by
   * properly cleaning up all containers and timers.
   */
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
    if (this.containers.some((u) => u.element === e) || e !== window && !this.isElementScrollable(e))
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
      lastDirection: B.DOWN,
      lastEventTime: 0,
      firstScrollEventTime: null,
      maxDepthReached: i,
      debounceTimer: null,
      listener: null
    }, c = () => {
      this.get("suppressNextScroll") || (l.firstScrollEventTime === null && (l.firstScrollEventTime = Date.now()), this.clearContainerTimer(l), l.debounceTimer = window.setTimeout(() => {
        const u = this.calculateScrollData(l);
        if (u) {
          const m = Date.now();
          this.processScrollEvent(l, u, m);
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
      type: d.SCROLL,
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
    return e > t ? B.DOWN : B.UP;
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
    const c = this.getViewportHeight(t), u = this.getScrollHeight(t), m = this.getScrollDirection(i, r), E = this.calculateScrollDepth(i, u, c);
    let p;
    n > 0 ? p = o - n : e.firstScrollEventTime !== null ? p = o - e.firstScrollEventTime : p = 250;
    const S = Math.round(l / p * 1e3);
    return E > e.maxDepthReached && (e.maxDepthReached = E), e.lastScrollPos = i, {
      depth: E,
      direction: m,
      velocity: S,
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
class xt extends v {
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
          i.hasAttribute(`${I}-ignore`) || this.trackedElements.has(i) || (this.trackedElements.set(i, {
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
    if (e.element.hasAttribute(`${I}-ignore`))
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
      type: d.VIEWPORT_VISIBLE,
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
class Ft {
  storage;
  sessionStorageRef;
  fallbackStorage = /* @__PURE__ */ new Map();
  fallbackSessionStorage = /* @__PURE__ */ new Map();
  hasQuotaExceededError = !1;
  constructor() {
    this.storage = this.initializeStorage("localStorage"), this.sessionStorageRef = this.initializeStorage("sessionStorage"), this.storage || a("warn", "localStorage not available, using memory fallback"), this.sessionStorageRef || a("warn", "sessionStorage not available, using memory fallback");
  }
  /**
   * Retrieves an item from localStorage.
   *
   * Automatically falls back to in-memory storage if localStorage unavailable.
   *
   * @param key - Storage key
   * @returns Stored value or null if not found
   */
  getItem(e) {
    try {
      return this.storage ? this.storage.getItem(e) : this.fallbackStorage.get(e) ?? null;
    } catch {
      return this.fallbackStorage.get(e) ?? null;
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
  setItem(e, t) {
    this.fallbackStorage.set(e, t);
    try {
      if (this.storage) {
        this.storage.setItem(e, t);
        return;
      }
    } catch (r) {
      if (r instanceof DOMException && r.name === "QuotaExceededError" || r instanceof Error && r.name === "QuotaExceededError")
        if (this.hasQuotaExceededError = !0, a("warn", "localStorage quota exceeded, attempting cleanup", {
          data: { key: e, valueSize: t.length }
        }), this.cleanupOldData())
          try {
            if (this.storage) {
              this.storage.setItem(e, t);
              return;
            }
          } catch (o) {
            a("error", "localStorage quota exceeded even after cleanup - data will not persist", {
              error: o,
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
   * Removes an item from localStorage and fallback storage.
   *
   * Safe to call even if key doesn't exist (idempotent).
   *
   * @param key - Storage key to remove
   */
  removeItem(e) {
    try {
      this.storage && this.storage.removeItem(e);
    } catch {
    }
    this.fallbackStorage.delete(e);
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
   * Retrieves an item from sessionStorage.
   *
   * Automatically falls back to in-memory storage if sessionStorage unavailable.
   *
   * @param key - Storage key
   * @returns Stored value or null if not found
   */
  getSessionItem(e) {
    try {
      return this.sessionStorageRef ? this.sessionStorageRef.getItem(e) : this.fallbackSessionStorage.get(e) ?? null;
    } catch {
      return this.fallbackSessionStorage.get(e) ?? null;
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
  setSessionItem(e, t) {
    this.fallbackSessionStorage.set(e, t);
    try {
      if (this.sessionStorageRef) {
        this.sessionStorageRef.setItem(e, t);
        return;
      }
    } catch (r) {
      (r instanceof DOMException && r.name === "QuotaExceededError" || r instanceof Error && r.name === "QuotaExceededError") && a("error", "sessionStorage quota exceeded - data will not persist", {
        error: r,
        data: { key: e, valueSize: t.length }
      });
    }
  }
  /**
   * Removes an item from sessionStorage and fallback storage.
   *
   * Safe to call even if key doesn't exist (idempotent).
   *
   * @param key - Storage key to remove
   */
  removeSessionItem(e) {
    try {
      this.sessionStorageRef && this.sessionStorageRef.removeItem(e);
    } catch {
    }
    this.fallbackSessionStorage.delete(e);
  }
}
class $t extends v {
  eventManager;
  reportedByNav = /* @__PURE__ */ new Map();
  navigationHistory = [];
  // FIFO queue for tracking navigation order
  observers = [];
  vitalThresholds;
  lastLongTaskSentAt = 0;
  navigationCounter = 0;
  // Counter for handling simultaneous navigations edge case
  constructor(e) {
    super(), this.eventManager = e, this.vitalThresholds = be(ne);
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
    const e = this.get("config"), t = e?.webVitalsMode ?? ne;
    this.vitalThresholds = be(t), e?.webVitalsThresholds && (this.vitalThresholds = { ...this.vitalThresholds, ...e.webVitalsThresholds }), await this.initWebVitals(), this.observeLongTasks();
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
      const { onLCP: e, onCLS: t, onFCP: r, onTTFB: n, onINP: i } = await Promise.resolve().then(() => hr), o = (l) => (c) => {
        const u = Number(c.value.toFixed(2));
        this.sendVital({ type: l, value: u });
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
          i - this.lastLongTaskSentAt >= gt && (this.shouldSendVital("LONG_TASK", n) && this.trackWebVital("LONG_TASK", n), this.lastLongTaskSentAt = i);
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
      else if (this.reportedByNav.set(t, /* @__PURE__ */ new Set([e.type])), this.navigationHistory.push(t), this.navigationHistory.length > mt) {
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
      type: d.WEB_VITALS,
      web_vitals: {
        type: e,
        value: t
      }
    });
  }
  /**
   * Generates a unique navigation identifier for deduplication.
   *
   * **Purpose**: Creates deterministic IDs to prevent duplicate Web Vitals reporting
   * across multiple metrics for the same navigation event.
   *
   * **ID Format**: `{timestamp}_{pathname}` or `{timestamp}_{pathname}_{counter}`
   *
   * **Edge Case Handling**:
   * - If multiple navigations occur to the same pathname in the same millisecond,
   *   a counter suffix is appended (e.g., `1234.56_/home_2`)
   * - Counter only added when > 1 to minimize ID length for common case
   *
   * **Why Deterministic**:
   * - Previous implementation used random string → duplicate metrics on page reload
   * - Now: Same navigation = same ID = proper deduplication via reportedByNav Map
   *
   * @returns Navigation ID string or null if navigation timing unavailable
   *
   * @internal
   */
  getNavigationId() {
    try {
      const e = performance.getEntriesByType("navigation")[0];
      if (!e)
        return null;
      const t = e.startTime || performance.now(), r = ++this.navigationCounter, n = `${t.toFixed(2)}_${window.location.pathname}`;
      return r > 1 ? `${n}_${r}` : n;
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
class Bt extends v {
  eventManager;
  recentErrors = /* @__PURE__ */ new Map();
  errorBurstCounter = 0;
  burstWindowStart = 0;
  burstBackoffUntil = 0;
  constructor(e) {
    super(), this.eventManager = e;
  }
  /**
   * Starts tracking JavaScript errors and promise rejections.
   *
   * - Registers global error event listener
   * - Registers unhandledrejection event listener
   */
  startTracking() {
    window.addEventListener("error", this.handleError), window.addEventListener("unhandledrejection", this.handleRejection);
  }
  /**
   * Stops tracking errors and cleans up resources.
   *
   * - Removes error event listeners
   * - Clears recent errors map
   * - Resets burst detection counters
   */
  stopTracking() {
    window.removeEventListener("error", this.handleError), window.removeEventListener("unhandledrejection", this.handleRejection), this.recentErrors.clear(), this.errorBurstCounter = 0, this.burstWindowStart = 0, this.burstBackoffUntil = 0;
  }
  /**
   * Checks sampling rate and burst detection
   * Returns false if in cooldown period after burst detection
   */
  shouldSample() {
    const e = Date.now();
    if (e < this.burstBackoffUntil)
      return !1;
    if (e - this.burstWindowStart > ut && (this.errorBurstCounter = 0, this.burstWindowStart = e), this.errorBurstCounter++, this.errorBurstCounter > dt)
      return this.burstBackoffUntil = e + ye, a("warn", "Error burst detected - entering cooldown", {
        data: {
          errorsInWindow: this.errorBurstCounter,
          cooldownMs: ye
        }
      }), !1;
    const r = this.get("config")?.errorSampling ?? Ue;
    return Math.random() < r;
  }
  handleError = (e) => {
    if (!this.shouldSample())
      return;
    const t = this.sanitize(e.message || "Unknown error");
    this.shouldSuppressError(k.JS_ERROR, t) || this.eventManager.track({
      type: d.ERROR,
      error_data: {
        type: k.JS_ERROR,
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
    this.shouldSuppressError(k.PROMISE_REJECTION, r) || this.eventManager.track({
      type: d.ERROR,
      error_data: {
        type: k.PROMISE_REJECTION,
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
    let t = e.length > Ie ? e.slice(0, Ie) + "..." : e;
    for (const r of ke) {
      const n = new RegExp(r.source, r.flags);
      t = t.replace(n, "[REDACTED]");
    }
    return t;
  }
  shouldSuppressError(e, t) {
    const r = Date.now(), n = `${e}:${t}`, i = this.recentErrors.get(n);
    return i && r - i < we ? (this.recentErrors.set(n, r), !0) : (this.recentErrors.set(n, r), this.recentErrors.size > ct ? (this.recentErrors.clear(), this.recentErrors.set(n, r), !1) : (this.recentErrors.size > W && this.pruneOldErrors(), !1));
  }
  pruneOldErrors() {
    const e = Date.now();
    for (const [n, i] of this.recentErrors.entries())
      e - i > we && this.recentErrors.delete(n);
    if (this.recentErrors.size <= W)
      return;
    const t = Array.from(this.recentErrors.entries()).sort((n, i) => n[1] - i[1]), r = this.recentErrors.size - W;
    for (let n = 0; n < r; n += 1) {
      const i = t[n];
      i && this.recentErrors.delete(i[0]);
    }
  }
}
class Wt extends v {
  isInitialized = !1;
  suppressNextScrollTimer = null;
  emitter = new Ct();
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
  async init(e = {}) {
    if (!this.isInitialized) {
      this.managers.storage = new Ft();
      try {
        this.setupState(e), this.managers.event = new Ot(this.managers.storage, this.emitter, this.transformers), this.initializeHandlers(), await this.managers.event.recoverPersistedEvents().catch((t) => {
          a("warn", "Failed to recover persisted events", { error: t });
        }), this.isInitialized = !0;
      } catch (t) {
        this.destroy(!0);
        const r = t instanceof Error ? t.message : String(t);
        throw new Error(`[TraceLog] TraceLog initialization failed: ${r}`);
      }
    }
  }
  /**
   * Sends a custom event with optional metadata.
   *
   * @param name - Event name
   * @param metadata - Optional metadata
   * @internal Called from api.event()
   */
  sendCustomEvent(e, t) {
    if (!this.managers.event) {
      a("warn", "Cannot send custom event: TraceLog not initialized", { data: { name: e } });
      return;
    }
    let r = t;
    t && typeof t == "object" && !Array.isArray(t) && Object.getPrototypeOf(t) !== Object.prototype && (r = Object.assign({}, t));
    const { valid: n, error: i, sanitizedMetadata: o } = Rt(e, r);
    if (!n) {
      if (this.get("mode") === X.QA)
        throw new Error(`[TraceLog] Custom event "${e}" validation failed: ${i}`);
      return;
    }
    this.managers.event.track({
      type: d.CUSTOM,
      custom_event: {
        name: e,
        ...o && { metadata: o }
      }
    });
  }
  on(e, t) {
    this.emitter.on(e, t);
  }
  off(e, t) {
    this.emitter.off(e, t);
  }
  setTransformer(e, t) {
    if (typeof t != "function")
      throw new Error(`[TraceLog] Transformer must be a function, received: ${typeof t}`);
    this.transformers[e] = t;
  }
  removeTransformer(e) {
    delete this.transformers[e];
  }
  getTransformer(e) {
    return this.transformers[e];
  }
  /**
   * Destroys the TraceLog instance and cleans up all resources.
   *
   * @param force - If true, forces cleanup even if not initialized (used during init failure)
   * @internal Called from api.destroy()
   */
  destroy(e = !1) {
    !this.isInitialized && !e || (Object.values(this.handlers).filter(Boolean).forEach((t) => {
      try {
        t.stopTracking();
      } catch (r) {
        a("warn", "Failed to stop tracking", { error: r });
      }
    }), this.suppressNextScrollTimer && (clearTimeout(this.suppressNextScrollTimer), this.suppressNextScrollTimer = null), this.managers.event?.stop(), this.emitter.removeAllListeners(), this.transformers.beforeSend = void 0, this.transformers.beforeBatch = void 0, this.set("hasStartSession", !1), this.set("suppressNextScroll", !1), this.set("sessionId", null), this.isInitialized = !1, this.handlers = {}, this.managers = {});
  }
  setupState(e = {}) {
    this.set("config", e);
    const t = Pt.getId(this.managers.storage);
    this.set("userId", t);
    const r = vt(e);
    this.set("collectApiUrls", r);
    const n = lt();
    this.set("device", n);
    const i = ie(window.location.href, e.sensitiveQueryParams);
    this.set("pageUrl", i);
    const o = Et() ? X.QA : void 0;
    o && this.set("mode", o);
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
  validateGlobalMetadata(e) {
    if (typeof e != "object" || e === null || Array.isArray(e))
      return {
        valid: !1,
        error: "Global metadata must be a plain object"
      };
    const t = Fe("Global", e, "globalMetadata");
    return t.valid ? { valid: !0 } : {
      valid: !1,
      error: t.error
    };
  }
  /**
   * Replaces global metadata with new values.
   *
   * @param metadata - New global metadata object
   * @throws {Error} If metadata validation fails
   * @internal Called from api.updateGlobalMetadata()
   */
  updateGlobalMetadata(e) {
    const t = this.validateGlobalMetadata(e);
    if (!t.valid)
      throw new Error(`[TraceLog] Invalid global metadata: ${t.error}`);
    const n = {
      ...this.get("config"),
      globalMetadata: e
    };
    this.set("config", n), a("debug", "Global metadata updated (replaced)", { data: { keys: Object.keys(e) } });
  }
  /**
   * Merges new metadata with existing global metadata.
   *
   * @param metadata - Metadata to merge with existing values
   * @throws {Error} If metadata validation fails
   * @internal Called from api.mergeGlobalMetadata()
   */
  mergeGlobalMetadata(e) {
    const t = this.validateGlobalMetadata(e);
    if (!t.valid)
      throw new Error(`[TraceLog] Invalid global metadata: ${t.error}`);
    const r = this.get("config"), i = {
      ...r.globalMetadata ?? {},
      ...e
    }, o = {
      ...r,
      globalMetadata: i
    };
    this.set("config", o), a("debug", "Global metadata updated (merged)", { data: { keys: Object.keys(e) } });
  }
  initializeHandlers() {
    const e = this.get("config"), t = e.disabledEvents ?? [];
    this.handlers.session = new Vt(
      this.managers.storage,
      this.managers.event
    ), this.handlers.session.startTracking();
    const r = () => {
      this.set("suppressNextScroll", !0), this.suppressNextScrollTimer && clearTimeout(this.suppressNextScrollTimer), this.suppressNextScrollTimer = window.setTimeout(() => {
        this.set("suppressNextScroll", !1);
      }, 500);
    };
    this.handlers.pageView = new kt(this.managers.event, r), this.handlers.pageView.startTracking(), this.handlers.click = new Ut(this.managers.event), this.handlers.click.startTracking(), t.includes("scroll") || (this.handlers.scroll = new Ht(this.managers.event), this.handlers.scroll.startTracking()), t.includes("web_vitals") || (this.handlers.performance = new $t(this.managers.event), this.handlers.performance.startTracking().catch((n) => {
      a("warn", "Failed to start performance tracking", { error: n });
    })), t.includes("error") || (this.handlers.error = new Bt(this.managers.event), this.handlers.error.startTracking()), e.viewport && (this.handlers.viewport = new xt(this.managers.event), this.handlers.viewport.startTracking());
  }
}
const C = [], b = [];
let f = null, R = !1, _ = !1;
const Gt = async (s) => {
  if (!(typeof window > "u" || typeof document > "u") && (_ = !1, window.__traceLogDisabled !== !0 && !f && !R)) {
    R = !0;
    try {
      const e = bt(s ?? {}), t = new Wt();
      try {
        C.forEach(({ event: i, callback: o }) => {
          t.on(i, o);
        }), C.length = 0, b.forEach(({ hook: i, fn: o }) => {
          i === "beforeSend" ? t.setTransformer("beforeSend", o) : t.setTransformer("beforeBatch", o);
        }), b.length = 0;
        const r = t.init(e), n = new Promise((i, o) => {
          setTimeout(() => {
            o(new Error("[TraceLog] Initialization timeout after 10000ms"));
          }, 1e4);
        });
        await Promise.race([r, n]), f = t;
      } catch (r) {
        try {
          t.destroy(!0);
        } catch (n) {
          a("error", "Failed to cleanup partially initialized app", { error: n });
        }
        throw r;
      }
    } catch (e) {
      throw f = null, e;
    } finally {
      R = !1;
    }
  }
}, Xt = (s, e) => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!f)
      throw new Error("[TraceLog] TraceLog not initialized. Please call init() first.");
    if (_)
      throw new Error("[TraceLog] Cannot send events while TraceLog is being destroyed");
    f.sendCustomEvent(s, e);
  }
}, Qt = (s, e) => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!f || R) {
      C.push({ event: s, callback: e });
      return;
    }
    f.on(s, e);
  }
}, jt = (s, e) => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!f) {
      const t = C.findIndex((r) => r.event === s && r.callback === e);
      t !== -1 && C.splice(t, 1);
      return;
    }
    f.off(s, e);
  }
};
function zt(s, e) {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (typeof e != "function")
      throw new Error(`[TraceLog] Transformer must be a function, received: ${typeof e}`);
    if (!f || R) {
      const t = b.findIndex((r) => r.hook === s);
      t !== -1 && b.splice(t, 1), b.push({ hook: s, fn: e });
      return;
    }
    if (_)
      throw new Error("[TraceLog] Cannot set transformers while TraceLog is being destroyed");
    s === "beforeSend" ? f.setTransformer("beforeSend", e) : f.setTransformer("beforeBatch", e);
  }
}
const Kt = (s) => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!f) {
      const e = b.findIndex((t) => t.hook === s);
      e !== -1 && b.splice(e, 1);
      return;
    }
    if (_)
      throw new Error("[TraceLog] Cannot remove transformers while TraceLog is being destroyed");
    f.removeTransformer(s);
  }
}, Yt = () => typeof window > "u" || typeof document > "u" ? !1 : f !== null, qt = () => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (_)
      throw new Error("[TraceLog] Destroy operation already in progress");
    if (!f) {
      _ = !1;
      return;
    }
    _ = !0;
    try {
      f.destroy(), f = null, R = !1, C.length = 0, b.length = 0, _ = !1;
    } catch (s) {
      f = null, R = !1, C.length = 0, b.length = 0, _ = !1, a("warn", "Error during destroy, forced cleanup completed", { error: s });
    }
  }
}, Jt = (s) => {
  typeof window > "u" || typeof document > "u" || pt(s);
}, Zt = (s) => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!f)
      throw new Error("[TraceLog] TraceLog not initialized. Please call init() first.");
    if (_)
      throw new Error("[TraceLog] Cannot update metadata while TraceLog is being destroyed");
    f.updateGlobalMetadata(s);
  }
}, er = (s) => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!f)
      throw new Error("[TraceLog] TraceLog not initialized. Please call init() first.");
    if (_)
      throw new Error("[TraceLog] Cannot update metadata while TraceLog is being destroyed");
    f.mergeGlobalMetadata(s);
  }
}, Mr = {
  init: Gt,
  event: Xt,
  on: Qt,
  off: jt,
  setTransformer: zt,
  removeTransformer: Kt,
  isInitialized: Yt,
  destroy: qt,
  setQaMode: Jt,
  updateGlobalMetadata: Zt,
  mergeGlobalMetadata: er
};
var ae, We = -1, P = function(s) {
  addEventListener("pageshow", (function(e) {
    e.persisted && (We = e.timeStamp, s(e));
  }), !0);
}, fe = function() {
  var s = self.performance && performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
  if (s && s.responseStart > 0 && s.responseStart < performance.now()) return s;
}, j = function() {
  var s = fe();
  return s && s.activationStart || 0;
}, y = function(s, e) {
  var t = fe(), r = "navigate";
  return We >= 0 ? r = "back-forward-cache" : t && (document.prerendering || j() > 0 ? r = "prerender" : document.wasDiscarded ? r = "restore" : t.type && (r = t.type.replace(/_/g, "-"))), { name: s, value: e === void 0 ? -1 : e, rating: "good", delta: 0, entries: [], id: "v4-".concat(Date.now(), "-").concat(Math.floor(8999999999999 * Math.random()) + 1e12), navigationType: r };
}, x = function(s, e, t) {
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
}, A = function(s, e, t, r) {
  var n, i;
  return function(o) {
    e.value >= 0 && (o || r) && ((i = e.value - (n || 0)) || n === void 0) && (n = e.value, e.delta = i, e.rating = (function(l, c) {
      return l > c[1] ? "poor" : l > c[0] ? "needs-improvement" : "good";
    })(e.value, t), s(e));
  };
}, ge = function(s) {
  requestAnimationFrame((function() {
    return requestAnimationFrame((function() {
      return s();
    }));
  }));
}, z = function(s) {
  document.addEventListener("visibilitychange", (function() {
    document.visibilityState === "hidden" && s();
  }));
}, me = function(s) {
  var e = !1;
  return function() {
    e || (s(), e = !0);
  };
}, O = -1, Ne = function() {
  return document.visibilityState !== "hidden" || document.prerendering ? 1 / 0 : 0;
}, Q = function(s) {
  document.visibilityState === "hidden" && O > -1 && (O = s.type === "visibilitychange" ? s.timeStamp : 0, tr());
}, Oe = function() {
  addEventListener("visibilitychange", Q, !0), addEventListener("prerenderingchange", Q, !0);
}, tr = function() {
  removeEventListener("visibilitychange", Q, !0), removeEventListener("prerenderingchange", Q, !0);
}, Ge = function() {
  return O < 0 && (O = Ne(), Oe(), P((function() {
    setTimeout((function() {
      O = Ne(), Oe();
    }), 0);
  }))), { get firstHiddenTime() {
    return O;
  } };
}, K = function(s) {
  document.prerendering ? addEventListener("prerenderingchange", (function() {
    return s();
  }), !0) : s();
}, le = [1800, 3e3], Xe = function(s, e) {
  e = e || {}, K((function() {
    var t, r = Ge(), n = y("FCP"), i = x("paint", (function(o) {
      o.forEach((function(l) {
        l.name === "first-contentful-paint" && (i.disconnect(), l.startTime < r.firstHiddenTime && (n.value = Math.max(l.startTime - j(), 0), n.entries.push(l), t(!0)));
      }));
    }));
    i && (t = A(s, n, le, e.reportAllChanges), P((function(o) {
      n = y("FCP"), t = A(s, n, le, e.reportAllChanges), ge((function() {
        n.value = performance.now() - o.timeStamp, t(!0);
      }));
    })));
  }));
}, ce = [0.1, 0.25], rr = function(s, e) {
  e = e || {}, Xe(me((function() {
    var t, r = y("CLS", 0), n = 0, i = [], o = function(c) {
      c.forEach((function(u) {
        if (!u.hadRecentInput) {
          var m = i[0], E = i[i.length - 1];
          n && u.startTime - E.startTime < 1e3 && u.startTime - m.startTime < 5e3 ? (n += u.value, i.push(u)) : (n = u.value, i = [u]);
        }
      })), n > r.value && (r.value = n, r.entries = i, t());
    }, l = x("layout-shift", o);
    l && (t = A(s, r, ce, e.reportAllChanges), z((function() {
      o(l.takeRecords()), t(!0);
    })), P((function() {
      n = 0, r = y("CLS", 0), t = A(s, r, ce, e.reportAllChanges), ge((function() {
        return t();
      }));
    })), setTimeout(t, 0));
  })));
}, Qe = 0, J = 1 / 0, $ = 0, sr = function(s) {
  s.forEach((function(e) {
    e.interactionId && (J = Math.min(J, e.interactionId), $ = Math.max($, e.interactionId), Qe = $ ? ($ - J) / 7 + 1 : 0);
  }));
}, je = function() {
  return ae ? Qe : performance.interactionCount || 0;
}, nr = function() {
  "interactionCount" in performance || ae || (ae = x("event", sr, { type: "event", buffered: !0, durationThreshold: 0 }));
}, w = [], G = /* @__PURE__ */ new Map(), ze = 0, ir = function() {
  var s = Math.min(w.length - 1, Math.floor((je() - ze) / 50));
  return w[s];
}, or = [], ar = function(s) {
  if (or.forEach((function(n) {
    return n(s);
  })), s.interactionId || s.entryType === "first-input") {
    var e = w[w.length - 1], t = G.get(s.interactionId);
    if (t || w.length < 10 || s.duration > e.latency) {
      if (t) s.duration > t.latency ? (t.entries = [s], t.latency = s.duration) : s.duration === t.latency && s.startTime === t.entries[0].startTime && t.entries.push(s);
      else {
        var r = { id: s.interactionId, latency: s.duration, entries: [s] };
        G.set(r.id, r), w.push(r);
      }
      w.sort((function(n, i) {
        return i.latency - n.latency;
      })), w.length > 10 && w.splice(10).forEach((function(n) {
        return G.delete(n.id);
      }));
    }
  }
}, Ke = function(s) {
  var e = self.requestIdleCallback || self.setTimeout, t = -1;
  return s = me(s), document.visibilityState === "hidden" ? s() : (t = e(s), z(s)), t;
}, ue = [200, 500], lr = function(s, e) {
  "PerformanceEventTiming" in self && "interactionId" in PerformanceEventTiming.prototype && (e = e || {}, K((function() {
    var t;
    nr();
    var r, n = y("INP"), i = function(l) {
      Ke((function() {
        l.forEach(ar);
        var c = ir();
        c && c.latency !== n.value && (n.value = c.latency, n.entries = c.entries, r());
      }));
    }, o = x("event", i, { durationThreshold: (t = e.durationThreshold) !== null && t !== void 0 ? t : 40 });
    r = A(s, n, ue, e.reportAllChanges), o && (o.observe({ type: "first-input", buffered: !0 }), z((function() {
      i(o.takeRecords()), r(!0);
    })), P((function() {
      ze = je(), w.length = 0, G.clear(), n = y("INP"), r = A(s, n, ue, e.reportAllChanges);
    })));
  })));
}, de = [2500, 4e3], Z = {}, cr = function(s, e) {
  e = e || {}, K((function() {
    var t, r = Ge(), n = y("LCP"), i = function(c) {
      e.reportAllChanges || (c = c.slice(-1)), c.forEach((function(u) {
        u.startTime < r.firstHiddenTime && (n.value = Math.max(u.startTime - j(), 0), n.entries = [u], t());
      }));
    }, o = x("largest-contentful-paint", i);
    if (o) {
      t = A(s, n, de, e.reportAllChanges);
      var l = me((function() {
        Z[n.id] || (i(o.takeRecords()), o.disconnect(), Z[n.id] = !0, t(!0));
      }));
      ["keydown", "click"].forEach((function(c) {
        addEventListener(c, (function() {
          return Ke(l);
        }), { once: !0, capture: !0 });
      })), z(l), P((function(c) {
        n = y("LCP"), t = A(s, n, de, e.reportAllChanges), ge((function() {
          n.value = performance.now() - c.timeStamp, Z[n.id] = !0, t(!0);
        }));
      }));
    }
  }));
}, he = [800, 1800], ur = function s(e) {
  document.prerendering ? K((function() {
    return s(e);
  })) : document.readyState !== "complete" ? addEventListener("load", (function() {
    return s(e);
  }), !0) : setTimeout(e, 0);
}, dr = function(s, e) {
  e = e || {};
  var t = y("TTFB"), r = A(s, t, he, e.reportAllChanges);
  ur((function() {
    var n = fe();
    n && (t.value = Math.max(n.responseStart - j(), 0), t.entries = [n], r(!0), P((function() {
      t = y("TTFB", 0), (r = A(s, t, he, e.reportAllChanges))(!0);
    })));
  }));
};
const hr = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  CLSThresholds: ce,
  FCPThresholds: le,
  INPThresholds: ue,
  LCPThresholds: de,
  TTFBThresholds: he,
  onCLS: rr,
  onFCP: Xe,
  onINP: lr,
  onLCP: cr,
  onTTFB: dr
}, Symbol.toStringTag, { value: "Module" }));
export {
  h as AppConfigValidationError,
  fr as DEFAULT_SESSION_TIMEOUT,
  ne as DEFAULT_WEB_VITALS_MODE,
  L as DeviceType,
  te as EmitterEvent,
  k as ErrorType,
  d as EventType,
  Ar as InitializationTimeoutError,
  D as IntegrationValidationError,
  Ir as MAX_ARRAY_LENGTH,
  pr as MAX_CUSTOM_EVENT_ARRAY_SIZE,
  Er as MAX_CUSTOM_EVENT_KEYS,
  gr as MAX_CUSTOM_EVENT_NAME_LENGTH,
  mr as MAX_CUSTOM_EVENT_STRING_SIZE,
  Tr as MAX_METADATA_NESTING_DEPTH,
  Sr as MAX_NESTED_OBJECT_KEYS,
  _r as MAX_STRING_LENGTH,
  vr as MAX_STRING_LENGTH_IN_ARRAY,
  X as Mode,
  ke as PII_PATTERNS,
  N as PermanentError,
  _e as SamplingRateValidationError,
  B as ScrollDirection,
  it as SessionTimeoutValidationError,
  V as SpecialApiUrl,
  H as TraceLogValidationError,
  br as WEB_VITALS_GOOD_THRESHOLDS,
  Ae as WEB_VITALS_NEEDS_IMPROVEMENT_THRESHOLDS,
  ft as WEB_VITALS_POOR_THRESHOLDS,
  be as getWebVitalsThresholds,
  wr as isPrimaryScrollEvent,
  yr as isSecondaryScrollEvent,
  Mr as tracelog
};
