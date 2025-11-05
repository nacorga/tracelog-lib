const Cn = 9e5;
const An = 120, bn = 8192, Mn = 10, Ln = 10, Rn = 20, Nn = 1;
const On = 1e3, Pn = 500, Dn = 100;
const I = "data-tlog", ct = [
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
], ut = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"], dt = [
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
const p = {
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
}, ft = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<embed\b[^>]*>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi
];
var F = /* @__PURE__ */ ((s) => (s.Localhost = "localhost:8080", s.Fail = "localhost:9999", s))(F || {}), L = /* @__PURE__ */ ((s) => (s.Mobile = "mobile", s.Tablet = "tablet", s.Desktop = "desktop", s.Unknown = "unknown", s))(L || {}), O = /* @__PURE__ */ ((s) => (s.EVENT = "event", s.QUEUE = "queue", s.CONSENT_CHANGED = "consent-changed", s))(O || {});
class D extends Error {
  constructor(e, t) {
    super(e), this.statusCode = t, this.name = "PermanentError", Error.captureStackTrace && Error.captureStackTrace(this, D);
  }
}
var d = /* @__PURE__ */ ((s) => (s.PAGE_VIEW = "page_view", s.CLICK = "click", s.SCROLL = "scroll", s.SESSION_START = "session_start", s.SESSION_END = "session_end", s.CUSTOM = "custom", s.WEB_VITALS = "web_vitals", s.ERROR = "error", s.VIEWPORT_VISIBLE = "viewport_visible", s))(d || {}), j = /* @__PURE__ */ ((s) => (s.UP = "up", s.DOWN = "down", s))(j || {}), H = /* @__PURE__ */ ((s) => (s.JS_ERROR = "js_error", s.PROMISE_REJECTION = "promise_rejection", s))(H || {}), x = /* @__PURE__ */ ((s) => (s.QA = "qa", s))(x || {});
const Vn = (s) => s.type === d.SCROLL && "scroll_data" in s && s.scroll_data.is_primary === !0, kn = (s) => s.type === d.SCROLL && "scroll_data" in s && s.scroll_data.is_primary === !1;
class G extends Error {
  constructor(e, t, n) {
    super(e), this.errorCode = t, this.layer = n, this.name = this.constructor.name, Error.captureStackTrace && Error.captureStackTrace(this, this.constructor);
  }
}
class g extends G {
  constructor(e, t = "config") {
    super(e, "APP_CONFIG_INVALID", t);
  }
}
class ht extends G {
  constructor(e, t = "config") {
    super(e, "SESSION_TIMEOUT_INVALID", t);
  }
}
class ye extends G {
  constructor(e, t = "config") {
    super(e, "SAMPLING_RATE_INVALID", t);
  }
}
class S extends G {
  constructor(e, t = "config") {
    super(e, "INTEGRATION_INVALID", t);
  }
}
class xn extends G {
  constructor(e, t, n = "runtime") {
    super(e, "INITIALIZATION_TIMEOUT", n), this.timeoutMs = t;
  }
}
const gt = (s, e) => {
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
  const { error: n, data: r, showToClient: i = !1, style: o } = t ?? {}, l = n ? gt(e, n) : `[TraceLog] ${e}`, c = s === "error" ? "error" : s === "warn" ? "warn" : "log";
  if (s === "debug" || s === "info" && !i)
    return;
  const u = o !== void 0 && o !== "", f = u ? `%c${l}` : l;
  if (r !== void 0) {
    const m = re(r);
    u ? console[c](f, o, m) : console[c](f, m);
  } else
    u ? console[c](f, o) : console[c](f);
}, re = (s) => {
  const e = {}, t = ["token", "password", "secret", "key", "apikey", "api_key", "sessionid", "session_id"];
  for (const [n, r] of Object.entries(s)) {
    const i = n.toLowerCase();
    if (t.some((o) => i.includes(o))) {
      e[n] = "[REDACTED]";
      continue;
    }
    r !== null && typeof r == "object" && !Array.isArray(r) ? e[n] = re(r) : Array.isArray(r) ? e[n] = r.map(
      (o) => o !== null && typeof o == "object" && !Array.isArray(o) ? re(o) : o
    ) : e[n] = r;
  }
  return e;
};
let ie, Be;
const mt = () => {
  typeof window < "u" && !ie && (ie = window.matchMedia("(pointer: coarse)"), Be = window.matchMedia("(hover: none)"));
}, Et = () => {
  try {
    const s = navigator;
    if (s.userAgentData && typeof s.userAgentData.mobile == "boolean")
      return s.userAgentData.platform && /ipad|tablet/i.test(s.userAgentData.platform) ? L.Tablet : s.userAgentData.mobile ? L.Mobile : L.Desktop;
    mt();
    const e = window.innerWidth, t = ie?.matches ?? !1, n = Be?.matches ?? !1, r = "ontouchstart" in window || navigator.maxTouchPoints > 0, i = navigator.userAgent.toLowerCase(), o = /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/.test(i), l = /tablet|ipad|android(?!.*mobile)/.test(i);
    return e <= 767 || o && r ? L.Mobile : e >= 768 && e <= 1024 || l || t && n && r ? L.Tablet : L.Desktop;
  } catch (s) {
    return a("warn", "Device detection failed, defaulting to desktop", { error: s }), L.Desktop;
  }
}, Fe = "background: #ff9800; color: white; font-weight: bold; padding: 2px 8px; border-radius: 3px;", He = "background: #9e9e9e; color: white; font-weight: bold; padding: 2px 8px; border-radius: 3px;", Ce = ["scroll", "web_vitals", "error"], $e = [
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
], Ae = 500, be = 5e3, Q = 50, pt = Q * 2, Ge = 1, St = 1e3, Tt = 10, Me = 5e3, _t = 6e4, y = "tlog", U = `${y}:qa_mode`, oe = `${y}:uid`, ae = "tlog_mode", le = "qa", ce = "qa_off", Xe = (s) => s ? `${y}:${s}:queue` : `${y}:queue`, We = (s) => s ? `${y}:${s}:session` : `${y}:session`, ze = (s) => s ? `${y}:${s}:broadcast` : `${y}:broadcast`, V = `${y}:consent`, je = 365, Le = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  BROADCAST_CHANNEL_NAME: ze,
  CONSENT_EXPIRY_DAYS: je,
  CONSENT_KEY: V,
  QA_MODE_DISABLE_VALUE: ce,
  QA_MODE_ENABLE_VALUE: le,
  QA_MODE_KEY: U,
  QA_MODE_URL_PARAM: ae,
  QUEUE_KEY: Xe,
  SESSION_STORAGE_KEY: We,
  STORAGE_BASE_KEY: y,
  USER_ID_KEY: oe
}, Symbol.toStringTag, { value: "Module" })), Un = {
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
}, Re = {
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
}, vt = {
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
}, ue = "needs-improvement", Ne = (s = ue) => {
  switch (s) {
    case "all":
      return { LCP: 0, FCP: 0, CLS: 0, INP: 0, TTFB: 0, LONG_TASK: 0 };
    // Track everything
    case "needs-improvement":
      return Re;
    case "poor":
      return vt;
    default:
      return Re;
  }
}, It = 1e3, wt = 50, yt = () => {
  if (typeof window > "u" || typeof document > "u")
    return !1;
  try {
    const s = new URLSearchParams(window.location.search), e = s.get(ae), t = sessionStorage.getItem(U);
    let n = null;
    if (e === le ? (n = !0, sessionStorage.setItem(U, "true"), a("info", "QA Mode ACTIVE", {
      showToClient: !0,
      style: Fe
    })) : e === ce && (n = !1, sessionStorage.setItem(U, "false"), a("info", "QA Mode DISABLED", {
      showToClient: !0,
      style: He
    })), e === le || e === ce)
      try {
        s.delete(ae);
        const r = s.toString(), i = window.location.pathname + (r ? "?" + r : "") + window.location.hash;
        window.history.replaceState({}, "", i);
      } catch {
      }
    return n ?? t === "true";
  } catch {
    return !1;
  }
}, Ct = (s) => {
  if (!(typeof window > "u" || typeof document > "u"))
    try {
      s ? (sessionStorage.setItem(U, "true"), a("info", "QA Mode ENABLED", {
        showToClient: !0,
        style: Fe
      })) : (sessionStorage.setItem(U, "false"), a("info", "QA Mode DISABLED", {
        showToClient: !0,
        style: He
      }));
    } catch {
      a("warn", "Cannot set QA mode: sessionStorage unavailable");
    }
}, Oe = () => {
  const s = new URLSearchParams(window.location.search), e = {};
  return ut.forEach((n) => {
    const r = s.get(n);
    if (r) {
      const i = n.split("utm_")[1];
      e[i] = r;
    }
  }), Object.keys(e).length ? e : void 0;
}, de = () => {
  if (typeof window > "u" || typeof localStorage > "u")
    return null;
  try {
    const s = localStorage.getItem(V);
    if (!s)
      return null;
    const e = JSON.parse(s);
    return !e.state || !e.expiresAt || Date.now() > e.expiresAt ? null : {
      google: !!e.state.google,
      custom: !!e.state.custom,
      tracelog: !!e.state.tracelog
    };
  } catch (s) {
    return a("error", "Failed to load consent from storage", { error: s }), null;
  }
}, At = () => typeof crypto < "u" && crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (s) => {
  const e = Math.random() * 16 | 0;
  return (s === "x" ? e : e & 3 | 8).toString(16);
}), bt = () => {
  const s = Date.now();
  let e = "";
  try {
    if (typeof crypto < "u" && crypto.getRandomValues) {
      const t = crypto.getRandomValues(new Uint8Array(4));
      t && (e = Array.from(t, (n) => n.toString(16).padStart(2, "0")).join(""));
    }
  } catch {
  }
  return e || (e = Math.floor(Math.random() * 4294967295).toString(16).padStart(8, "0")), `${s}-${e}`;
}, Qe = (s, e = !1) => {
  try {
    const t = new URL(s), n = t.protocol === "https:", r = t.protocol === "http:";
    return n || e && r;
  } catch {
    return !1;
  }
}, Mt = (s) => {
  try {
    const t = new URL(window.location.href).hostname;
    if (!t || typeof t != "string")
      throw new Error("Invalid hostname");
    if (t === "localhost" || t === "127.0.0.1" || /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(t))
      throw new Error(
        "SaaS integration not supported on localhost or IP addresses. Use custom backend integration instead."
      );
    const n = t.split(".");
    if (!n || !Array.isArray(n) || n.length === 0 || n.length === 1 && n[0] === "")
      throw new Error("Invalid hostname structure");
    if (n.length === 1)
      throw new Error("Single-part domain not supported for SaaS integration");
    let r;
    if (n.length === 2 ? r = n.join(".") : r = n.slice(-2).join("."), !r || r.split(".").length < 2)
      throw new Error("Invalid domain structure for SaaS");
    const i = `https://${s}.${r}/collect`;
    if (!Qe(i))
      throw new Error("Generated URL failed validation");
    return i;
  } catch (e) {
    throw new Error(`Invalid SaaS URL configuration: ${e instanceof Error ? e.message : String(e)}`);
  }
}, Lt = (s) => {
  const e = {};
  s.integrations?.tracelog?.projectId && (e.saas = Mt(s.integrations.tracelog.projectId));
  const t = s.integrations?.custom?.collectApiUrl;
  if (t) {
    const n = s.integrations?.custom?.allowHttp ?? !1;
    if (!Qe(t, n))
      throw new Error("Invalid custom API URL");
    e.custom = t;
  }
  return e;
}, fe = (s, e = []) => {
  if (!s || typeof s != "string")
    return a("warn", "Invalid URL provided to normalizeUrl", { data: { url: String(s) } }), s || "";
  try {
    const t = new URL(s), n = t.searchParams, r = [.../* @__PURE__ */ new Set([...dt, ...e])];
    let i = !1;
    const o = [];
    return r.forEach((c) => {
      n.has(c) && (n.delete(c), i = !0, o.push(c));
    }), !i && s.includes("?") ? s : (t.search = n.toString(), t.toString());
  } catch (t) {
    const n = s && typeof s == "string" ? s.slice(0, 100) : String(s);
    return a("warn", "URL normalization failed, returning original", { error: t, data: { url: n } }), s;
  }
}, Pe = (s) => {
  if (!s || typeof s != "string" || s.trim().length === 0)
    return "";
  let e = s;
  s.length > 1e3 && (e = s.slice(0, Math.max(0, 1e3)));
  let t = 0;
  for (const r of ft) {
    const i = e;
    e = e.replace(r, ""), i !== e && t++;
  }
  return t > 0 && a("warn", "XSS patterns detected and removed", {
    data: {
      patternMatches: t,
      originalValue: s.slice(0, 100)
    }
  }), e = e.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#x27;").replaceAll("/", "&#x2F;"), e.trim();
}, he = (s, e = 0) => {
  if (e > 3 || s == null)
    return null;
  if (typeof s == "string")
    return Pe(s);
  if (typeof s == "number")
    return !Number.isFinite(s) || s < -Number.MAX_SAFE_INTEGER || s > Number.MAX_SAFE_INTEGER ? 0 : s;
  if (typeof s == "boolean")
    return s;
  if (Array.isArray(s))
    return s.slice(0, 100).map((r) => he(r, e + 1)).filter((r) => r !== null);
  if (typeof s == "object") {
    const t = {}, r = Object.entries(s).slice(0, 20);
    for (const [i, o] of r) {
      const l = Pe(i);
      if (l) {
        const c = he(o, e + 1);
        c !== null && (t[l] = c);
      }
    }
    return t;
  }
  return null;
}, Rt = (s) => {
  if (typeof s != "object" || s === null)
    return {};
  try {
    const e = he(s);
    return typeof e == "object" && e !== null ? e : {};
  } catch (e) {
    const t = e instanceof Error ? e.message : String(e);
    throw new Error(`[TraceLog] Metadata sanitization failed: ${t}`);
  }
}, Nt = (s) => {
  if (s !== void 0 && (s === null || typeof s != "object"))
    throw new g("Configuration must be an object", "config");
  if (s) {
    if (s.sessionTimeout !== void 0 && (typeof s.sessionTimeout != "number" || s.sessionTimeout < 3e4 || s.sessionTimeout > 864e5))
      throw new ht(p.INVALID_SESSION_TIMEOUT, "config");
    if (s.globalMetadata !== void 0 && (typeof s.globalMetadata != "object" || s.globalMetadata === null))
      throw new g(p.INVALID_GLOBAL_METADATA, "config");
    if (s.integrations && Pt(s.integrations), s.sensitiveQueryParams !== void 0) {
      if (!Array.isArray(s.sensitiveQueryParams))
        throw new g(p.INVALID_SENSITIVE_QUERY_PARAMS, "config");
      for (const e of s.sensitiveQueryParams)
        if (typeof e != "string")
          throw new g("All sensitive query params must be strings", "config");
    }
    if (s.errorSampling !== void 0 && (typeof s.errorSampling != "number" || s.errorSampling < 0 || s.errorSampling > 1))
      throw new ye(p.INVALID_ERROR_SAMPLING_RATE, "config");
    if (s.samplingRate !== void 0 && (typeof s.samplingRate != "number" || s.samplingRate < 0 || s.samplingRate > 1))
      throw new ye(p.INVALID_SAMPLING_RATE, "config");
    if (s.primaryScrollSelector !== void 0) {
      if (typeof s.primaryScrollSelector != "string" || !s.primaryScrollSelector.trim())
        throw new g(p.INVALID_PRIMARY_SCROLL_SELECTOR, "config");
      if (s.primaryScrollSelector !== "window")
        try {
          document.querySelector(s.primaryScrollSelector);
        } catch {
          throw new g(
            `${p.INVALID_PRIMARY_SCROLL_SELECTOR_SYNTAX}: "${s.primaryScrollSelector}"`,
            "config"
          );
        }
    }
    if (s.pageViewThrottleMs !== void 0 && (typeof s.pageViewThrottleMs != "number" || s.pageViewThrottleMs < 0))
      throw new g(p.INVALID_PAGE_VIEW_THROTTLE, "config");
    if (s.clickThrottleMs !== void 0 && (typeof s.clickThrottleMs != "number" || s.clickThrottleMs < 0))
      throw new g(p.INVALID_CLICK_THROTTLE, "config");
    if (s.maxSameEventPerMinute !== void 0 && (typeof s.maxSameEventPerMinute != "number" || s.maxSameEventPerMinute <= 0))
      throw new g(p.INVALID_MAX_SAME_EVENT_PER_MINUTE, "config");
    if (s.viewport !== void 0 && Ot(s.viewport), s.disabledEvents !== void 0) {
      if (!Array.isArray(s.disabledEvents))
        throw new g("disabledEvents must be an array", "config");
      const e = /* @__PURE__ */ new Set();
      for (const t of s.disabledEvents) {
        if (typeof t != "string")
          throw new g("All disabled event types must be strings", "config");
        if (!Ce.includes(t))
          throw new g(
            `Invalid disabled event type: "${t}". Must be one of: ${Ce.join(", ")}`,
            "config"
          );
        if (e.has(t))
          throw new g(
            `Duplicate disabled event type found: "${t}". Each event type should appear only once.`,
            "config"
          );
        e.add(t);
      }
    }
    if (s.webVitalsMode !== void 0) {
      if (typeof s.webVitalsMode != "string")
        throw new g(
          `Invalid webVitalsMode type: ${typeof s.webVitalsMode}. Must be a string`,
          "config"
        );
      const e = ["all", "needs-improvement", "poor"];
      if (!e.includes(s.webVitalsMode))
        throw new g(
          `Invalid webVitalsMode: "${s.webVitalsMode}". Must be one of: ${e.join(", ")}`,
          "config"
        );
    }
    if (s.webVitalsThresholds !== void 0) {
      if (typeof s.webVitalsThresholds != "object" || s.webVitalsThresholds === null || Array.isArray(s.webVitalsThresholds))
        throw new g("webVitalsThresholds must be an object", "config");
      const e = ["LCP", "FCP", "CLS", "INP", "TTFB", "LONG_TASK"];
      for (const [t, n] of Object.entries(s.webVitalsThresholds)) {
        if (!e.includes(t))
          throw new g(
            `Invalid Web Vitals threshold key: "${t}". Must be one of: ${e.join(", ")}`,
            "config"
          );
        if (typeof n != "number" || !Number.isFinite(n) || n < 0)
          throw new g(
            `Invalid Web Vitals threshold value for ${t}: ${n}. Must be a non-negative finite number`,
            "config"
          );
      }
    }
    if (s.maxConsentBufferSize !== void 0 && (typeof s.maxConsentBufferSize != "number" || !Number.isFinite(s.maxConsentBufferSize) || s.maxConsentBufferSize <= 0 || !Number.isInteger(s.maxConsentBufferSize)))
      throw new g("maxConsentBufferSize must be a positive integer", "config");
  }
}, Ot = (s) => {
  if (typeof s != "object" || s === null)
    throw new g(p.INVALID_VIEWPORT_CONFIG, "config");
  if (!s.elements || !Array.isArray(s.elements))
    throw new g(p.INVALID_VIEWPORT_ELEMENTS, "config");
  if (s.elements.length === 0)
    throw new g(p.INVALID_VIEWPORT_ELEMENTS, "config");
  const e = /* @__PURE__ */ new Set();
  for (const t of s.elements) {
    if (!t.selector || typeof t.selector != "string" || !t.selector.trim())
      throw new g(p.INVALID_VIEWPORT_ELEMENT, "config");
    const n = t.selector.trim();
    if (e.has(n))
      throw new g(
        `Duplicate viewport selector found: "${n}". Each selector should appear only once.`,
        "config"
      );
    if (e.add(n), t.id !== void 0 && (typeof t.id != "string" || !t.id.trim()))
      throw new g(p.INVALID_VIEWPORT_ELEMENT_ID, "config");
    if (t.name !== void 0 && (typeof t.name != "string" || !t.name.trim()))
      throw new g(p.INVALID_VIEWPORT_ELEMENT_NAME, "config");
  }
  if (s.threshold !== void 0 && (typeof s.threshold != "number" || s.threshold < 0 || s.threshold > 1))
    throw new g(p.INVALID_VIEWPORT_THRESHOLD, "config");
  if (s.minDwellTime !== void 0 && (typeof s.minDwellTime != "number" || s.minDwellTime < 0))
    throw new g(p.INVALID_VIEWPORT_MIN_DWELL_TIME, "config");
  if (s.cooldownPeriod !== void 0 && (typeof s.cooldownPeriod != "number" || s.cooldownPeriod < 0))
    throw new g(p.INVALID_VIEWPORT_COOLDOWN_PERIOD, "config");
  if (s.maxTrackedElements !== void 0 && (typeof s.maxTrackedElements != "number" || s.maxTrackedElements <= 0))
    throw new g(p.INVALID_VIEWPORT_MAX_TRACKED_ELEMENTS, "config");
}, Pt = (s) => {
  if (s) {
    if (s.tracelog && (!s.tracelog.projectId || typeof s.tracelog.projectId != "string" || s.tracelog.projectId.trim() === ""))
      throw new S(p.INVALID_TRACELOG_PROJECT_ID, "config");
    if (s.custom) {
      if (!s.custom.collectApiUrl || typeof s.custom.collectApiUrl != "string" || s.custom.collectApiUrl.trim() === "")
        throw new S(p.INVALID_CUSTOM_API_URL, "config");
      if (s.custom.allowHttp !== void 0 && typeof s.custom.allowHttp != "boolean")
        throw new S("allowHttp must be a boolean", "config");
      const e = s.custom.collectApiUrl.trim();
      if (!e.startsWith("http://") && !e.startsWith("https://"))
        throw new S('Custom API URL must start with "http://" or "https://"', "config");
      if (!(s.custom.allowHttp ?? !1) && e.startsWith("http://"))
        throw new S(
          "Custom API URL must use HTTPS in production. Set allowHttp: true in integration config to allow HTTP (not recommended)",
          "config"
        );
    }
    if (s.google) {
      const { measurementId: e, containerId: t, forwardEvents: n } = s.google, r = typeof e == "string" && e.trim() !== "", i = typeof t == "string" && t.trim() !== "";
      if (!r && !i)
        throw new S(
          "Google integration requires at least one of: measurementId (GA4) or containerId (GTM)",
          "config"
        );
      if (r) {
        const o = e.trim(), l = /^G-[A-Z0-9]{10}$/.test(o), c = /^UA-[0-9]{6,9}-[0-9]{1}$/.test(o), u = /^AW-[0-9]{10}$/.test(o);
        if (!l && !c && !u)
          throw new S(
            'Google Analytics measurement ID must match one of: "G-XXXXXXXXXX" (GA4), "UA-XXXXXXXXX-X" (Universal Analytics), or "AW-XXXXXXXXXX" (Google Ads)',
            "config"
          );
      }
      if (i && !t.trim().match(/^GTM-[A-Z0-9]+$/))
        throw new S(
          'Google Tag Manager container ID must match the format "GTM-XXXXXX" (uppercase letters and digits only)',
          "config"
        );
      if (n !== void 0 && n !== "all")
        if (Array.isArray(n)) {
          if (n.length === 0)
            throw new S(
              "Google integration forwardEvents cannot be an empty array. Use undefined to use default or specify event types.",
              "config"
            );
          const o = Object.values(d), l = /* @__PURE__ */ new Set();
          for (const c of n) {
            if (typeof c != "string")
              throw new S("All forwarded event types must be strings", "config");
            if (!o.includes(c))
              throw new S(
                `Invalid forwarded event type: "${c}". Must be one of: ${o.join(", ")}`,
                "config"
              );
            if (l.has(c))
              throw new S(
                `Duplicate forwarded event type found: "${c}". Each event type should appear only once.`,
                "config"
              );
            l.add(c);
          }
        } else
          throw new S(
            'Google integration forwardEvents must be an array of event types or the string "all"',
            "config"
          );
    }
  }
}, Dt = (s) => {
  Nt(s);
  const e = {
    ...s ?? {},
    sessionTimeout: s?.sessionTimeout ?? 9e5,
    globalMetadata: s?.globalMetadata ?? {},
    sensitiveQueryParams: s?.sensitiveQueryParams ?? [],
    errorSampling: s?.errorSampling ?? Ge,
    samplingRate: s?.samplingRate ?? 1,
    pageViewThrottleMs: s?.pageViewThrottleMs ?? 1e3,
    clickThrottleMs: s?.clickThrottleMs ?? 300,
    maxSameEventPerMinute: s?.maxSameEventPerMinute ?? 60,
    disabledEvents: s?.disabledEvents ?? [],
    maxConsentBufferSize: s?.maxConsentBufferSize ?? 500
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
}, Vt = (s) => {
  if (typeof s == "string")
    return !0;
  if (typeof s == "object" && s !== null && !Array.isArray(s)) {
    const e = Object.entries(s);
    if (e.length > 20)
      return !1;
    for (const [, t] of e) {
      if (t == null)
        continue;
      const n = typeof t;
      if (n !== "string" && n !== "number" && n !== "boolean")
        return !1;
    }
    return !0;
  }
  return !1;
}, Ke = (s, e = 0) => {
  if (typeof s != "object" || s === null || e > 1)
    return !1;
  for (const t of Object.values(s)) {
    if (t == null)
      continue;
    const n = typeof t;
    if (!(n === "string" || n === "number" || n === "boolean")) {
      if (Array.isArray(t)) {
        if (t.length === 0)
          continue;
        if (typeof t[0] == "string") {
          if (!t.every((o) => typeof o == "string"))
            return !1;
        } else if (!t.every((o) => Vt(o)))
          return !1;
        continue;
      }
      if (n === "object" && e === 0) {
        if (!Ke(t, e + 1))
          return !1;
        continue;
      }
      return !1;
    }
  }
  return !0;
}, kt = (s) => typeof s != "string" ? {
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
} : { valid: !0 }, De = (s, e, t) => {
  const n = Rt(e), r = t && t === "customEvent" ? `${t} "${s}" metadata error` : `${s} metadata error`;
  if (!Ke(n))
    return {
      valid: !1,
      error: `${r}: object has invalid types. Valid types are string, number, boolean or string arrays.`
    };
  let i;
  try {
    i = JSON.stringify(n);
  } catch {
    return {
      valid: !1,
      error: `${r}: object contains circular references or cannot be serialized.`
    };
  }
  if (i.length > 8192)
    return {
      valid: !1,
      error: `${r}: object is too large (max ${8192 / 1024} KB).`
    };
  if (Object.keys(n).length > 10)
    return {
      valid: !1,
      error: `${r}: object has too many keys (max 10 keys).`
    };
  for (const [l, c] of Object.entries(n)) {
    if (Array.isArray(c)) {
      if (c.length > 10)
        return {
          valid: !1,
          error: `${r}: array property "${l}" is too large (max 10 items).`
        };
      for (const u of c)
        if (typeof u == "string" && u.length > 500)
          return {
            valid: !1,
            error: `${r}: array property "${l}" contains strings that are too long (max 500 characters).`
          };
    }
    if (typeof c == "string" && c.length > 1e3)
      return {
        valid: !1,
        error: `${r}: property "${l}" is too long (max 1000 characters).`
      };
  }
  return {
    valid: !0,
    sanitizedMetadata: n
  };
}, Ye = (s, e, t) => {
  if (Array.isArray(e)) {
    const n = [], r = t && t === "customEvent" ? `${t} "${s}" metadata error` : `${s} metadata error`;
    for (let i = 0; i < e.length; i++) {
      const o = e[i];
      if (typeof o != "object" || o === null || Array.isArray(o))
        return {
          valid: !1,
          error: `${r}: array item at index ${i} must be an object.`
        };
      const l = De(s, o, t);
      if (!l.valid)
        return {
          valid: !1,
          error: `${r}: array item at index ${i} is invalid: ${l.error}`
        };
      l.sanitizedMetadata && n.push(l.sanitizedMetadata);
    }
    return {
      valid: !0,
      sanitizedMetadata: n
    };
  }
  return De(s, e, t);
}, xt = (s, e) => {
  const t = kt(s);
  if (!t.valid)
    return a("error", "Event name validation failed", {
      showToClient: !0,
      data: { eventName: s, error: t.error }
    }), t;
  if (!e)
    return { valid: !0 };
  const n = Ye(s, e, "customEvent");
  return n.valid || a("error", "Event metadata validation failed", {
    showToClient: !0,
    data: {
      eventName: s,
      error: n.error
    }
  }), n;
};
function qe(s) {
  if (s === "all")
    return !0;
  if (typeof s != "object" || s === null || Array.isArray(s))
    return !1;
  const e = [
    "analytics_storage",
    "ad_storage",
    "ad_user_data",
    "ad_personalization",
    "personalization_storage"
  ], t = s;
  for (const n of Object.keys(t))
    if (!e.includes(n) || typeof t[n] != "boolean")
      return !1;
  return !0;
}
class Ut {
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
    const n = this.listeners.get(e);
    if (n) {
      const r = n.indexOf(t);
      r > -1 && n.splice(r, 1);
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
    const n = this.listeners.get(e);
    n && n.forEach((r) => {
      r(t);
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
function Je(s, e, t) {
  try {
    const n = e(s);
    return n === null ? null : typeof n == "object" && n !== null && "type" in n ? n : (a("warn", `beforeSend transformer returned invalid data, using original [${t}]`), s);
  } catch (n) {
    return a("error", `beforeSend transformer threw error, using original event [${t}]`, { error: n }), s;
  }
}
function Bt(s, e, t) {
  return s.map((n) => Je(n, e, t)).filter((n) => n !== null);
}
function Ze(s, e, t) {
  try {
    const n = e(s);
    return n === null ? (a("debug", `Batch filtered by beforeBatch transformer [${t}]`, {
      data: { eventCount: s.events.length }
    }), null) : typeof n == "object" && n !== null && Array.isArray(n.events) ? n : (a("warn", `beforeBatch transformer returned invalid data, using original [${t}]`, {
      data: { eventCount: s.events.length }
    }), s);
  } catch (n) {
    return a("error", `beforeBatch transformer threw error, using original batch [${t}]`, {
      error: n,
      data: { eventCount: s.events.length }
    }), s;
  }
}
const te = {};
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
    return te[e];
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
    te[e] = t;
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
    return { ...te };
  }
}
class Ve extends v {
  storeManager;
  integrationId;
  apiUrl;
  consentManager;
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
   * @param consentManager - Optional consent manager for GDPR compliance
   * @param transformers - Optional event transformation hooks
   * @throws Error if integrationId and apiUrl are not both provided or both undefined
   */
  constructor(e, t, n, r = null, i = {}) {
    if (super(), t && !n || !t && n)
      throw new Error("SenderManager: integrationId and apiUrl must either both be provided or both be undefined");
    this.storeManager = e, this.integrationId = t, this.apiUrl = n, this.consentManager = r, this.transformers = i;
  }
  /**
   * Get the integration ID for this sender
   * @returns The integration ID ('saas' or 'custom') or undefined if not set
   */
  getIntegrationId() {
    return this.integrationId;
  }
  getQueueStorageKey() {
    const e = this.get("userId") || "anonymous", t = Xe(e);
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
   * **Consent Check**: Skips send if consent not granted for this integration
   *
   * **Return Values**:
   * - `true`: Send succeeded OR skipped (standalone mode, no consent)
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
    return this.shouldSkipSend() ? !0 : this.hasConsentForIntegration() ? this.apiUrl?.includes(F.Fail) ? (a(
      "warn",
      `Fail mode: simulating network failure (sync)${this.integrationId ? ` [${this.integrationId}]` : ""}`,
      {
        data: { events: e.events.length }
      }
    ), !1) : this.apiUrl?.includes(F.Localhost) ? (a(
      "debug",
      `Success mode: simulating successful send (sync)${this.integrationId ? ` [${this.integrationId}]` : ""}`,
      {
        data: { events: e.events.length }
      }
    ), !0) : this.sendQueueSyncInternal(e) : (a(
      "debug",
      `Skipping sync send, no consent for integration${this.integrationId ? ` [${this.integrationId}]` : ""}`
    ), !0);
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
   * **Consent Check**: Skips send if consent not granted for this integration
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
      const n = await this.send(e);
      return n ? (this.clearPersistedEvents(), t?.onSuccess?.(e.events.length, e.events, e)) : (this.persistEvents(e), t?.onFailure?.()), n;
    } catch (n) {
      return n instanceof D ? (this.logPermanentError("Permanent error, not retrying", n), this.clearPersistedEvents(), t?.onFailure?.(), !1) : (this.persistEvents(e), t?.onFailure?.(), !1);
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
   * 2. Checks consent for this integration (skips if no consent)
   * 3. Loads persisted events from localStorage
   * 4. Validates freshness (discards events older than 2 hours)
   * 5. Applies multi-tab protection (skips events persisted within 1 second)
   * 6. Attempts to resend via `send()` method
   * 7. On success: Clears persisted events, invokes `onSuccess` callback
   * 8. On failure: Keeps events in localStorage, invokes `onFailure` callback
   * 9. On permanent error (4xx): Clears persisted events (no further retry)
   *
   * **Multi-Tab Protection**:
   * - Events persisted within last 1 second are skipped (active tab may retry)
   * - Prevents duplicate sends when multiple tabs recover simultaneously
   *
   * **Event Expiry**:
   * - Events older than 2 hours are discarded (prevents stale data accumulation)
   * - Expiry check uses event timestamps, not persistence time
   *
   * **Consent Integration**:
   * - Skips recovery if consent not granted for this integration
   * - Events remain persisted for future recovery when consent obtained
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
    if (!this.hasConsentForIntegration()) {
      a(
        "debug",
        `Skipping recovery, no consent for integration${this.integrationId ? ` [${this.integrationId}]` : ""}`
      );
      return;
    }
    this.recoveryInProgress = !0;
    try {
      const t = this.getPersistedData();
      if (!t || !this.isDataRecent(t) || t.events.length === 0) {
        this.clearPersistedEvents();
        return;
      }
      const n = this.createRecoveryBody(t);
      await this.send(n) ? (this.clearPersistedEvents(), e?.onSuccess?.(t.events.length, t.events, n)) : e?.onFailure?.();
    } catch (t) {
      if (t instanceof D) {
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
    const n = Bt(
      e.events,
      t,
      this.integrationId || "SenderManager"
    );
    return n.length === 0 ? null : {
      ...e,
      events: n
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
    return t ? Ze(e, t, this.integrationId || "SenderManager") : e;
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
    const t = 100 * Math.pow(2, e), n = Math.random() * 100, r = t + n;
    return new Promise((i) => setTimeout(i, r));
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
   * - Consent checked once before retry loop
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
    if (!this.hasConsentForIntegration())
      return a("debug", `Skipping send, no consent for integration${this.integrationId ? ` [${this.integrationId}]` : ""}`), !0;
    const t = this.applyBeforeSendTransformer(e);
    if (!t)
      return !0;
    const n = this.applyBeforeBatchTransformer(t);
    if (!n)
      return !0;
    if (this.apiUrl?.includes(F.Fail))
      return a("warn", `Fail mode: simulating network failure${this.integrationId ? ` [${this.integrationId}]` : ""}`, {
        data: { events: n.events.length }
      }), !1;
    if (this.apiUrl?.includes(F.Localhost))
      return a("debug", `Success mode: simulating successful send${this.integrationId ? ` [${this.integrationId}]` : ""}`, {
        data: { events: n.events.length }
      }), !0;
    const { url: r, payload: i } = this.prepareRequest(n);
    for (let o = 1; o <= 3; o++)
      try {
        return (await this.sendWithTimeout(r, i)).ok ? (o > 1 && a(
          "info",
          `Send succeeded after ${o - 1} retry attempt(s)${this.integrationId ? ` [${this.integrationId}]` : ""}`,
          {
            data: { events: n.events.length, attempt: o }
          }
        ), !0) : !1;
      } catch (l) {
        const c = o === 3;
        if (l instanceof D)
          throw l;
        if (a(
          c ? "error" : "warn",
          `Send attempt ${o} failed${this.integrationId ? ` [${this.integrationId}]` : ""}${c ? " (all retries exhausted)" : ", will retry"}`,
          {
            error: l,
            data: {
              events: e.events.length,
              url: r.replace(/\/\/[^/]+/, "//[DOMAIN]"),
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
    const n = new AbortController(), r = setTimeout(() => {
      n.abort();
    }, 1e4);
    try {
      const i = await fetch(e, {
        method: "POST",
        body: t,
        keepalive: !0,
        credentials: "include",
        signal: n.signal,
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (!i.ok)
        throw i.status >= 400 && i.status < 500 && i.status !== 408 && i.status !== 429 ? new D(`HTTP ${i.status}: ${i.statusText}`, i.status) : new Error(`HTTP ${i.status}: ${i.statusText}`);
      return i;
    } finally {
      clearTimeout(r);
    }
  }
  /**
   * Internal synchronous send logic using navigator.sendBeacon() for page unload scenarios.
   *
   * **Purpose**: Sends events synchronously during page unload when async fetch() is unreliable.
   * Uses sendBeacon() browser API which queues request even after page closes.
   *
   * **Flow**:
   * 1. Check consent (returns true if denied to prevent retry loops)
   * 2. Apply beforeSend transformer (per-event transformation)
   * 3. Apply beforeBatch transformer (batch-level transformation)
   * 4. Validate payload size (64KB browser limit for sendBeacon)
   * 5. Send via sendBeacon() or fallback to persistence if unavailable
   * 6. Persist events on failure for next-page-load recovery
   *
   * **Payload Size Limit**: 64KB enforced by browser for sendBeacon()
   * - Oversized payloads persisted instead of silently failing
   *
   * @param body - EventsQueue to send
   * @returns `true` on success or when events persisted for recovery, `false` on failure
   * @private
   */
  sendQueueSyncInternal(e) {
    if (!this.hasConsentForIntegration())
      return !0;
    const t = this.applyBeforeSendTransformer(e);
    if (!t)
      return !0;
    const n = this.applyBeforeBatchTransformer(t);
    if (!n)
      return !0;
    const { url: r, payload: i } = this.prepareRequest(n);
    if (i.length > 65536)
      return a(
        "warn",
        `Payload exceeds sendBeacon limit, persisting for recovery${this.integrationId ? ` [${this.integrationId}]` : ""}`,
        {
          data: {
            size: i.length,
            limit: 65536,
            events: n.events.length
          }
        }
      ), this.persistEvents(n), !1;
    const o = new Blob([i], { type: "application/json" });
    if (!this.isSendBeaconAvailable())
      return a(
        "warn",
        `sendBeacon not available, persisting events for recovery${this.integrationId ? ` [${this.integrationId}]` : ""}`
      ), this.persistEvents(n), !1;
    const l = navigator.sendBeacon(r, o);
    return l || (a(
      "warn",
      `sendBeacon rejected request, persisting events for recovery${this.integrationId ? ` [${this.integrationId}]` : ""}`
    ), this.persistEvents(n)), l;
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
    const { timestamp: t, ...n } = e;
    return n;
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
      const n = {
        ...e,
        timestamp: Date.now()
      }, r = this.getQueueStorageKey();
      return this.storeManager.setItem(r, JSON.stringify(n)), !!this.storeManager.getItem(r);
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
    const n = Date.now();
    (!this.lastPermanentErrorLog || this.lastPermanentErrorLog.statusCode !== t.statusCode || n - this.lastPermanentErrorLog.timestamp >= _t) && (a("error", `${e}${this.integrationId ? ` [${this.integrationId}]` : ""}`, {
      data: { status: t.statusCode, message: t.message }
    }), this.lastPermanentErrorLog = { statusCode: t.statusCode, timestamp: n });
  }
  /**
   * Resolves waitForConsent requirement for this integration.
   * Checks waitForConsent flag in integration-specific config.
   * @returns true if consent is required, false otherwise
   * @private
   */
  getIntegrationConsentRequirement() {
    const e = this.get("config");
    return e ? this.integrationId === "saas" ? e.integrations?.tracelog?.waitForConsent ?? !1 : this.integrationId === "custom" ? e.integrations?.custom?.waitForConsent ?? !1 : !1 : !1;
  }
  /**
   * Checks if consent has been granted for this integration's data collection.
   *
   * **Purpose**: GDPR/CCPA compliance check before sending events to backend.
   * Prevents data transmission when user has not granted consent.
   *
   * **Fail-Open Strategy** (Always returns true when):
   * - `waitForConsent` not required for this integration (per-integration or root config)
   * - ConsentManager instance not provided (consent not required)
   * - Unknown integration ID (defensive programming)
   *
   * **Integration ID Mapping**:
   * - `'saas'` → Checks consent for `'tracelog'` (TraceLog SaaS)
   * - `'custom'` → Checks consent for `'custom'` (Custom backend)
   * - No integration ID → Allows by default (legacy support)
   *
   * **Consent Flow**:
   * 1. Check if consent required for this integration (per-integration or root config)
   * 2. Verify ConsentManager available
   * 3. Map integration ID to consent type
   * 4. Query ConsentManager for consent status
   * 5. Return true if consent granted, false otherwise
   *
   * **Called by**:
   * - `send()` method before async transmission (line 542)
   * - `sendQueueSyncInternal()` method before sync transmission (line 668)
   *
   * **Behavior when false**:
   * - Events NOT sent to backend
   * - Returns true to caller (prevents retry loops)
   * - Events may be buffered in ConsentManager for later flush
   *
   * @returns true if consent granted or not required, false if consent denied
   */
  hasConsentForIntegration() {
    return !this.getIntegrationConsentRequirement() || !this.consentManager ? !0 : this.integrationId === "saas" ? this.consentManager.hasConsent("tracelog") : this.integrationId === "custom" ? this.consentManager.hasConsent("custom") : !0;
  }
}
class Ft extends v {
  google;
  consentManager;
  dataSenders;
  emitter;
  transformers;
  recentEventFingerprints = /* @__PURE__ */ new Map();
  perEventRateLimits = /* @__PURE__ */ new Map();
  eventsQueue = [];
  pendingEventsBuffer = [];
  consentEventsBuffer = [];
  consentEventsSentTo = /* @__PURE__ */ new Map();
  // eventId -> Set<integration>
  isFlushingConsentBuffer = !1;
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
  /**
   * Creates an EventManager instance.
   *
   * **Initialization**:
   * - Creates SenderManager instances for configured integrations (SaaS/Custom)
   * - Sets up Google Analytics forwarding if configured
   * - Configures consent management if enabled
   * - Initializes event emitter for local consumption
   *
   * @param storeManager - Storage manager for persistence
   * @param google - Optional Google Analytics integration
   * @param consentManager - Optional consent manager for GDPR compliance
   * @param emitter - Optional event emitter for local event consumption
   * @param transformers - Optional event transformation hooks
   */
  constructor(e, t = null, n = null, r = null, i = {}) {
    super(), this.google = t, this.consentManager = n, this.emitter = r, this.transformers = i, this.dataSenders = [];
    const o = this.get("collectApiUrls");
    o?.saas && this.dataSenders.push(new Ve(e, "saas", o.saas, n, i)), o?.custom && this.dataSenders.push(
      new Ve(e, "custom", o.custom, n, i)
    );
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
        onSuccess: (n, r, i) => {
          if (r && r.length > 0) {
            const o = r.map((l) => l.id);
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
   * - If consent pending: Buffers in `consentEventsBuffer` (flushed when consent granted)
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
   * - Google Analytics: Forwards custom events to GA/GTM
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
    from_page_url: n,
    scroll_data: r,
    click_data: i,
    custom_event: o,
    web_vitals: l,
    error_data: c,
    session_end_reason: u,
    viewport_data: f
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
        from_page_url: n,
        scroll_data: r,
        click_data: i,
        custom_event: o,
        web_vitals: l,
        error_data: c,
        session_end_reason: u,
        viewport_data: f
      });
      return;
    }
    this.lastSessionId !== m && (this.lastSessionId = m, this.sessionEventCounts = {
      total: 0,
      [d.CLICK]: 0,
      [d.PAGE_VIEW]: 0,
      [d.CUSTOM]: 0,
      [d.VIEWPORT_VISIBLE]: 0,
      [d.SCROLL]: 0
    });
    const E = e === d.SESSION_START || e === d.SESSION_END;
    if (!E && !this.checkRateLimit())
      return;
    const T = e;
    if (!E) {
      if (this.sessionEventCounts.total >= 1e3) {
        a("warn", "Session event limit reached", {
          data: {
            type: T,
            total: this.sessionEventCounts.total,
            limit: 1e3
          }
        });
        return;
      }
      const M = this.getTypeLimitForEvent(T);
      if (M) {
        const ee = this.sessionEventCounts[T];
        if (ee !== void 0 && ee >= M) {
          a("warn", "Session event type limit reached", {
            data: {
              type: T,
              count: ee,
              limit: M
            }
          });
          return;
        }
      }
    }
    if (T === d.CUSTOM && o?.name) {
      const M = this.get("config")?.maxSameEventPerMinute ?? 60;
      if (!this.checkPerEventRateLimit(o.name, M))
        return;
    }
    const at = T === d.SESSION_START, lt = t || this.get("pageUrl"), W = this.buildEventPayload({
      type: T,
      page_url: lt,
      from_page_url: n,
      scroll_data: r,
      click_data: i,
      custom_event: o,
      web_vitals: l,
      error_data: c,
      session_end_reason: u,
      viewport_data: f
    });
    if (W && !(!E && !this.shouldSample())) {
      if (at) {
        const M = this.get("sessionId");
        if (!M) {
          a("error", "Session start event requires sessionId - event will be ignored");
          return;
        }
        if (this.get("hasStartSession")) {
          a("warn", "Duplicate session_start detected", {
            data: { sessionId: M }
          });
          return;
        }
        this.set("hasStartSession", !0);
      }
      if (!this.isDuplicateEvent(W)) {
        if (this.get("mode") === x.QA && T === d.CUSTOM && o) {
          a("info", `Custom Event: ${o.name}`, {
            showToClient: !0,
            data: {
              name: o.name,
              ...o.metadata && { metadata: o.metadata }
            }
          }), this.emitEvent(W);
          return;
        }
        this.addToQueue(W), E || (this.sessionEventCounts.total++, this.sessionEventCounts[T] !== void 0 && this.sessionEventCounts[T]++);
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
   *    - `consentEventsBuffer`: Discarded with warning (events awaiting consent)
   * 3. **Reset rate limiting state**: Clears rate limit counters and per-event limits
   * 4. **Reset session counters**: Clears per-session event counts
   * 5. **Reset `hasStartSession` flag**: Allows SESSION_START in next init cycle
   * 6. **Stop SenderManagers**: Calls `stop()` on all SenderManager instances
   *
   * **Important Behavior**:
   * - **No final flush**: Events in queue are NOT sent before stopping
   * - For flush before destroy, call `flushImmediatelySync()` first
   * - Consent buffer discarded: Events awaiting consent are lost (logged as warning)
   *
   * **Multi-Integration**:
   * - Stops all SenderManager instances (SaaS + Custom)
   * - Clears per-integration consent tracking
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
    this.sendIntervalId && (clearInterval(this.sendIntervalId), this.sendIntervalId = null), this.consentEventsBuffer.length > 0 && a("warn", "Discarding consent buffer on destroy", {
      data: { bufferedEvents: this.consentEventsBuffer.length }
    }), this.eventsQueue = [], this.pendingEventsBuffer = [], this.consentEventsBuffer = [], this.consentEventsSentTo.clear(), this.isFlushingConsentBuffer = !1, this.recentEventFingerprints.clear(), this.rateLimitCounter = 0, this.rateLimitWindowStart = 0, this.perEventRateLimits.clear(), this.sessionEventCounts = {
      total: 0,
      [d.CLICK]: 0,
      [d.PAGE_VIEW]: 0,
      [d.CUSTOM]: 0,
      [d.VIEWPORT_VISIBLE]: 0,
      [d.SCROLL]: 0
    }, this.lastSessionId = null, this.set("hasStartSession", !1), this.dataSenders.forEach((e) => {
      e.stop();
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
   * Returns the current number of events in the consent buffer.
   *
   * **Purpose**: Debugging and monitoring utility to check consent buffer length.
   *
   * **Use Cases**:
   * - Verify events are being buffered when consent is pending
   * - Monitor consent buffer growth before consent decision
   * - Testing consent workflows
   *
   * @returns Number of events currently awaiting consent
   *
   * @example
   * ```typescript
   * const consentBufferSize = eventManager.getConsentBufferLength();
   * console.log(`${consentBufferSize} events awaiting consent`);
   * ```
   */
  getConsentBufferLength() {
    return this.consentEventsBuffer.length;
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
   * Returns a copy of consent buffer events for a specific integration.
   *
   * **Purpose**: Test utility to inspect consent-buffered events for validation.
   *
   * **Note**: Only available in development mode via TestBridge.
   *
   * @param integration - Integration to get buffered events for
   * @returns Filtered array of buffered events for the integration
   * @internal Used by test-bridge.ts for test inspection
   */
  getConsentBufferEvents(e) {
    return this.consentEventsBuffer.filter((t) => {
      const n = t.id || `${t.type}-${t.timestamp}`;
      return !(this.consentEventsSentTo.get(n) || /* @__PURE__ */ new Set()).has(e);
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
   * Flushes buffered events to a specific integration when consent is granted.
   *
   * **Purpose**: Sends events that were tracked before consent was granted to the
   * specified integration. Events are batched and sent with delays to prevent
   * overwhelming the backend.
   *
   * **Behavior**:
   * - Filters events that haven't been sent to this integration yet
   * - Sorts events: SESSION_START first, then chronological by timestamp
   * - Sends in batches of 10 events (CONSENT_FLUSH_BATCH_SIZE)
   * - 100ms delay between batches (CONSENT_FLUSH_DELAY_MS)
   * - Tracks sent events per-integration to support multi-integration scenarios
   * - Removes events from buffer when sent to all configured integrations
   *
   * **Concurrency Protection**:
   * - Guard flag `isFlushingConsentBuffer` prevents concurrent flushes
   * - Returns early if flush already in progress
   *
   * **Multi-Integration Support**:
   * - Tracks which integrations each event has been sent to
   * - Allows partial sending (e.g., sent to TraceLog but not Custom yet)
   * - Events only removed from buffer when sent to ALL configured integrations
   *
   * **Called by**: ConsentManager when consent is granted for an integration
   *
   * @param integration - Integration to flush events to ('google' | 'custom' | 'tracelog')
   * @returns Promise<void> - Resolves when all batches sent or error occurs
   *
   * @example
   * ```typescript
   * // User grants consent for TraceLog SaaS
   * await eventManager.flushConsentBuffer('tracelog');
   * // → Sends buffered events to TraceLog in batches of 10
   * // → 100ms delay between batches
   * ```
   */
  async flushConsentBuffer(e) {
    if (this.consentEventsBuffer.length !== 0) {
      if (this.isFlushingConsentBuffer) {
        a("debug", "Consent buffer flush already in progress, skipping");
        return;
      }
      this.isFlushingConsentBuffer = !0;
      try {
        const t = this.get("config"), n = this.get("collectApiUrls"), r = /* @__PURE__ */ new Set();
        t?.integrations?.google && r.add("google"), n?.custom && r.add("custom"), n?.saas && r.add("tracelog");
        const i = this.consentEventsBuffer.filter((c) => {
          const u = c.id || `${c.type}-${c.timestamp}`;
          return !(this.consentEventsSentTo.get(u) || /* @__PURE__ */ new Set()).has(e);
        });
        if (i.length === 0) {
          a("debug", `No new events to flush for ${e}`), this.isFlushingConsentBuffer = !1;
          return;
        }
        a("info", "Flushing consent buffer", {
          data: {
            totalEvents: i.length,
            integration: e,
            bufferedTotal: this.consentEventsBuffer.length
          }
        }), i.sort((c, u) => c.type === d.SESSION_START && u.type !== d.SESSION_START ? -1 : u.type === d.SESSION_START && c.type !== d.SESSION_START ? 1 : c.timestamp - u.timestamp);
        const o = 50;
        let l = 0;
        for (let c = 0; c < i.length; c += o) {
          const u = i.slice(c, c + o);
          if (e === "google" && this.google && u.forEach((f) => {
            this.handleGoogleAnalyticsIntegration(f);
          }), e === "custom" || e === "tracelog") {
            const f = this.dataSenders.find((m) => {
              const E = m.getIntegrationId();
              return e === "custom" ? E === "custom" : E === "saas";
            });
            if (f) {
              const m = {
                user_id: this.get("userId"),
                session_id: this.get("sessionId"),
                device: this.get("device"),
                events: u,
                ...this.get("config")?.globalMetadata && { global_metadata: this.get("config")?.globalMetadata }
              };
              await f.sendEventsQueue(m) || a(
                "warn",
                `Failed to send consent buffer batch for ${e} after retries, events persisted for recovery`,
                {
                  data: { batchSize: u.length, integration: e }
                }
              );
            }
          }
          u.forEach((f) => {
            const m = f.id || `${f.type}-${f.timestamp}`;
            this.consentEventsSentTo.has(m) || this.consentEventsSentTo.set(m, /* @__PURE__ */ new Set()), this.consentEventsSentTo.get(m).add(e);
          }), l += u.length, c + o < i.length && await new Promise((f) => setTimeout(f, 100));
        }
        this.consentEventsBuffer = this.consentEventsBuffer.filter((c) => {
          const u = c.id || `${c.type}-${c.timestamp}`, f = this.consentEventsSentTo.get(u) || /* @__PURE__ */ new Set();
          return Array.from(r).every((E) => f.has(E)) ? (this.consentEventsSentTo.delete(u), !1) : !0;
        }), a("info", "Consent buffer flushed successfully", {
          data: {
            flushedEvents: l,
            integration: e,
            remainingInBuffer: this.consentEventsBuffer.length
          }
        });
      } catch (t) {
        a("error", "Failed to flush consent buffer", { error: t });
      } finally {
        this.isFlushingConsentBuffer = !1;
      }
    }
  }
  /**
   * Clears consent buffer entries for a specific integration when consent is revoked.
   *
   * **Purpose**: Removes tracking data for events that were waiting to be sent to
   * an integration when the user revokes consent. Events remain in buffer if they're
   * waiting for other integrations.
   *
   * **Behavior**:
   * - Removes the integration from each event's "sent to" tracking map
   * - Events removed from buffer if they've been sent to all OTHER configured integrations
   * - Events kept in buffer if still waiting for other integrations
   * - Logs removed count for debugging
   *
   * **Multi-Integration Support**:
   * - In multi-integration mode, events may wait for multiple integrations
   * - Revoking consent for one integration doesn't affect others
   * - Example: Event sent to TraceLog but waiting for Custom → kept in buffer when TraceLog consent revoked
   *
   * **Called by**: ConsentManager when consent is revoked for an integration
   *
   * @param integration - Integration to clear tracking for ('google' | 'custom' | 'tracelog')
   * @returns void
   *
   * @example
   * ```typescript
   * // User revokes consent for Google Analytics
   * eventManager.clearConsentBufferForIntegration('google');
   * // → Removes Google from event tracking
   * // → Events still waiting for TraceLog/Custom remain in buffer
   * ```
   */
  clearConsentBufferForIntegration(e) {
    const t = this.consentEventsBuffer.length;
    if (t === 0)
      return;
    this.consentEventsSentTo.forEach((o, l) => {
      o.delete(e), o.size === 0 && this.consentEventsSentTo.delete(l);
    });
    const n = this.get("config"), r = this.get("collectApiUrls"), i = /* @__PURE__ */ new Set();
    if (n?.integrations?.google && e !== "google" && i.add("google"), r?.custom && e !== "custom" && i.add("custom"), r?.saas && e !== "tracelog" && i.add("tracelog"), i.size === 0)
      this.consentEventsBuffer = [], this.consentEventsSentTo.clear(), a("info", `Cleared entire consent buffer (${t} events) - no remaining integrations`);
    else {
      this.consentEventsBuffer = this.consentEventsBuffer.filter((l) => {
        const c = l.id || `${l.type}-${l.timestamp}`, u = this.consentEventsSentTo.get(c) || /* @__PURE__ */ new Set();
        return Array.from(i).some((f) => !u.has(f));
      });
      const o = t - this.consentEventsBuffer.length;
      o > 0 && a("info", `Cleared ${o} buffered events for revoked ${e} consent`, {
        data: {
          removed: o,
          remaining: this.consentEventsBuffer.length,
          otherIntegrations: Array.from(i)
        }
      });
    }
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
    this.pendingEventsBuffer = [], t.forEach((n) => {
      this.track(n);
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
    const t = this.buildEventsPayload(), n = [...this.eventsQueue], r = n.map((i) => i.id);
    if (this.dataSenders.length === 0)
      return this.removeProcessedEvents(r), this.clearSendInterval(), this.emitEventsQueue(t), e ? !0 : Promise.resolve(!0);
    if (e) {
      const o = this.dataSenders.map((l) => l.sendEventsQueueSync(t)).some((l) => l);
      return o ? (this.removeProcessedEvents(r), this.clearSendInterval(), this.emitEventsQueue(t)) : (this.clearSendInterval(), a("warn", "Sync flush failed for all integrations, events remain in queue for next flush", {
        data: { eventCount: r.length }
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
          this.removeProcessedEvents(r), this.clearSendInterval(), this.emitEventsQueue(t);
          const c = o.filter((u) => !this.isSuccessfulResult(u)).length;
          c > 0 && a(
            "warn",
            "Async flush completed with partial success, events removed from queue and persisted per failed integration",
            {
              data: { eventCount: n.length, succeededCount: o.length - c, failedCount: c }
            }
          );
        } else
          this.removeProcessedEvents(r), this.clearSendInterval(), a("error", "Async flush failed for all integrations, events persisted per-integration for recovery", {
            data: { eventCount: n.length, integrations: this.dataSenders.length }
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
    const t = [...this.eventsQueue], n = t.map((c) => c.id), r = this.dataSenders.map(
      async (c) => c.sendEventsQueue(e, {
        onSuccess: () => {
        },
        onFailure: () => {
        }
      })
    ), i = await Promise.allSettled(r);
    this.removeProcessedEvents(n), i.some((c) => this.isSuccessfulResult(c)) && this.emitEventsQueue(e), this.eventsQueue.length === 0 && this.clearSendInterval();
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
    const n = t.map((c) => e.get(c)).filter((c) => !!c).sort((c, u) => c.timestamp - u.timestamp);
    let r = {
      user_id: this.get("userId"),
      session_id: this.get("sessionId"),
      device: this.get("device"),
      events: n,
      ...this.get("config")?.globalMetadata && { global_metadata: this.get("config")?.globalMetadata }
    };
    const i = this.get("collectApiUrls"), o = !!(i?.custom || i?.saas), l = this.transformers.beforeBatch;
    if (!o && l) {
      const c = Ze(r, l, "EventManager");
      c !== null && (r = c);
    }
    return r;
  }
  buildEventPayload(e) {
    const t = e.type === d.SESSION_START, n = e.page_url ?? this.get("pageUrl");
    let r = {
      id: bt(),
      type: e.type,
      page_url: n,
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
      ...t && Oe() && { utm: Oe() }
    };
    const i = this.get("collectApiUrls"), o = !!i?.custom, l = !!i?.saas, c = o || l, u = o && l, f = this.transformers.beforeSend;
    if (f && (!c || o && !u)) {
      const E = Je(r, f, "EventManager");
      if (E === null)
        return null;
      r = E;
    }
    return r;
  }
  isDuplicateEvent(e) {
    const t = Date.now(), n = this.createEventFingerprint(e), r = this.recentEventFingerprints.get(n);
    return r && t - r < 500 ? (this.recentEventFingerprints.set(n, t), !0) : (this.recentEventFingerprints.set(n, t), this.recentEventFingerprints.size > 1e3 && this.pruneOldFingerprints(), this.recentEventFingerprints.size > 2e3 && (this.recentEventFingerprints.clear(), this.recentEventFingerprints.set(n, t), a("warn", "Event fingerprint cache exceeded hard limit, cleared", {
      data: { hardLimit: 2e3 }
    })), !1);
  }
  pruneOldFingerprints() {
    const e = Date.now(), t = 500 * 10;
    for (const [n, r] of this.recentEventFingerprints.entries())
      e - r > t && this.recentEventFingerprints.delete(n);
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
      const n = Math.round((e.click_data.x || 0) / 10) * 10, r = Math.round((e.click_data.y || 0) / 10) * 10;
      t += `_click_${n}_${r}`;
    }
    return e.scroll_data && (t += `_scroll_${e.scroll_data.depth}_${e.scroll_data.direction}`), e.custom_event && (t += `_custom_${e.custom_event.name}`), e.web_vitals && (t += `_vitals_${e.web_vitals.type}`), e.error_data && (t += `_error_${e.error_data.type}_${e.error_data.message}`), t;
  }
  createEventSignature(e) {
    return this.createEventFingerprint(e);
  }
  addToQueue(e) {
    if (this.emitEvent(e), this.shouldBufferForConsent()) {
      this.addToConsentBuffer(e);
      return;
    }
    if (this.eventsQueue.push(e), this.eventsQueue.length > 100) {
      const t = this.eventsQueue.findIndex(
        (r) => r.type !== d.SESSION_START && r.type !== d.SESSION_END
      ), n = t >= 0 ? this.eventsQueue.splice(t, 1)[0] : this.eventsQueue.shift();
      a("warn", "Event queue overflow, oldest non-critical event removed", {
        data: {
          maxLength: 100,
          currentLength: this.eventsQueue.length,
          removedEventType: n?.type,
          wasCritical: n?.type === d.SESSION_START || n?.type === d.SESSION_END
        }
      });
    }
    this.sendIntervalId || this.startSendInterval(), this.eventsQueue.length >= 50 && this.sendEventsQueue(), this.handleGoogleAnalyticsIntegration(e);
  }
  /**
   * Updates the Google Analytics integration instance.
   *
   * **Purpose**: Sets or removes the Google Analytics integration instance used
   * for forwarding custom events to GA4/GTM. Called when consent is granted or revoked.
   *
   * **Behavior**:
   * - Sets `this.google` to the provided instance or null
   * - Enables/disables Google Analytics event forwarding
   * - Logs integration status change for debugging
   *
   * **Consent Integration**:
   * - Called by ConsentManager when Google consent is granted → passes GoogleAnalyticsIntegration
   * - Called by ConsentManager when Google consent is revoked → passes null
   *
   * **Use Cases**:
   * - Consent granted: Start forwarding custom events to Google Analytics
   * - Consent revoked: Stop forwarding events to Google Analytics
   * - Runtime control: Enable/disable Google Analytics without reinitialization
   *
   * @param google - GoogleAnalyticsIntegration instance or null to disable
   * @returns void
   *
   * @example
   * ```typescript
   * // Consent granted - enable Google Analytics
   * const gaIntegration = new GoogleAnalyticsIntegration(config);
   * eventManager.setGoogleAnalyticsIntegration(gaIntegration);
   * // → Custom events now forwarded to GA4
   *
   * // Consent revoked - disable Google Analytics
   * eventManager.setGoogleAnalyticsIntegration(null);
   * // → Custom events no longer forwarded to GA4
   * ```
   */
  setGoogleAnalyticsIntegration(e) {
    this.google = e, e ? a("debug", "Google Analytics integration updated in EventManager") : a("debug", "Google Analytics integration removed from EventManager");
  }
  /**
   * Resolves waitForConsent requirement for a specific integration.
   * Per-integration config takes precedence over root-level config.
   * @param integration - The integration to check
   * @returns true if consent is required, false otherwise
   * @private
   */
  getIntegrationConsentRequirement(e) {
    const t = this.get("config");
    return e === "google" ? t.integrations?.google?.waitForConsent ?? !1 : e === "custom" ? t.integrations?.custom?.waitForConsent ?? !1 : e === "tracelog" ? t.integrations?.tracelog?.waitForConsent ?? !1 : !1;
  }
  /**
   * Determines if events should be buffered for consent instead of being sent immediately.
   *
   * **Purpose**: Implements GDPR/CCPA compliance by preventing event transmission before
   * user grants consent. Events are buffered and sent later via `flushConsentBuffer()`.
   *
   * **Logic**:
   * 1. QA mode bypasses consent checks (always returns false)
   * 2. If no consent manager, returns false (can't check consent)
   * 3. If no backend integrations configured, returns false (standalone mode)
   * 4. Check BACKEND integrations (custom, tracelog) consent requirements
   * 5. Google Analytics handled separately (not buffered, uses GoogleAnalyticsIntegration)
   * 6. Buffer ONLY if ALL backend integrations require consent AND none have it yet
   *
   * **Key Behavior**:
   * - Mixed requirements (custom no consent, tracelog needs consent):
   *   → NO buffering, events go to queue
   *   → SenderManager for tracelog skips send (no consent)
   *   → SenderManager for custom sends normally
   *
   * @returns `true` if events should be buffered, `false` if they can be sent to queue
   * @private
   */
  shouldBufferForConsent() {
    if (this.get("mode") === x.QA || !this.consentManager)
      return !1;
    const e = this.get("collectApiUrls"), t = !!e?.custom, n = !!e?.saas;
    if (!t && !n)
      return !1;
    const r = t && this.getIntegrationConsentRequirement("custom"), i = n && this.getIntegrationConsentRequirement("tracelog");
    if (!r && !i)
      return !1;
    const o = r && !this.consentManager.hasConsent("custom"), l = i && !this.consentManager.hasConsent("tracelog");
    return o || l;
  }
  /**
   * Adds event to consent buffer with overflow protection and SESSION_START preservation.
   *
   * **Purpose**: Buffers events that were tracked before consent was granted. Events are
   * later flushed per-integration when consent is granted via `flushConsentBuffer()`.
   *
   * **Overflow Strategy**:
   * - Max buffer size: Configurable via `config.maxConsentBufferSize` (default 500)
   * - FIFO eviction: Oldest non-critical events removed first when buffer full
   * - SESSION_START preservation: Critical events always kept, non-critical removed instead
   *
   * @param event - Event to buffer (with id, type, timestamp, and event-specific data)
   * @private
   */
  addToConsentBuffer(e) {
    const n = this.get("config")?.maxConsentBufferSize ?? 500;
    if (this.consentEventsBuffer.push(e), this.consentEventsBuffer.length > n) {
      const r = this.consentEventsBuffer.findIndex((o) => o.type !== d.SESSION_START), i = r >= 0 ? this.consentEventsBuffer.splice(r, 1)[0] : this.consentEventsBuffer.shift();
      a("warn", "Consent buffer overflow, oldest non-critical event discarded", {
        data: {
          maxBufferSize: n,
          currentSize: this.consentEventsBuffer.length,
          removedEventType: i?.type
        }
      });
    }
  }
  startSendInterval() {
    this.sendIntervalId = window.setInterval(() => {
      this.eventsQueue.length > 0 && this.sendEventsQueue();
    }, 1e4);
  }
  handleGoogleAnalyticsIntegration(e) {
    if (!this.google || this.get("config")?.integrations?.google?.waitForConsent && this.consentManager && !this.consentManager.hasConsent("google") || this.get("mode") === x.QA)
      return;
    const r = this.get("config").integrations?.google?.forwardEvents;
    if (r == null || Array.isArray(r) && r.length === 0)
      return;
    if (!(r === "all" || Array.isArray(r) && r.includes(e.type))) {
      a("debug", `Skipping GA event forward: ${e.type} not in forwardEvents config`, {
        data: { eventType: e.type, forwardEvents: r }
      });
      return;
    }
    if (e.type === d.CUSTOM && e.custom_event)
      this.google.trackEvent(e.custom_event.name, e.custom_event.metadata ?? {});
    else if (e.type === d.PAGE_VIEW)
      this.google.trackEvent("page_view", {
        page_location: e.page_url,
        page_title: document.title,
        ...e.from_page_url && { page_referrer: e.from_page_url }
      });
    else if (e.type === d.SESSION_START)
      this.google.trackEvent("session_start", {
        engagement_time_msec: 0,
        ...e.referrer && { referrer: e.referrer },
        ...e.utm && e.utm
      });
    else if (e.type === d.WEB_VITALS && e.web_vitals) {
      const o = e.web_vitals.type.toLowerCase();
      this.google.trackEvent(o, {
        value: e.web_vitals.value
      });
    } else e.type === d.ERROR && e.error_data ? this.google.trackEvent("exception", {
      description: e.error_data.message,
      fatal: !1
    }) : e.type === d.SCROLL && e.scroll_data ? this.google.trackEvent("scroll", {
      depth: e.scroll_data.depth,
      direction: e.scroll_data.direction
    }) : e.type === d.CLICK && e.click_data ? this.google.trackEvent("click", {
      ...e.click_data.id && { element_id: e.click_data.id },
      ...e.click_data.text && { text: e.click_data.text },
      ...e.click_data.tag && { tag: e.click_data.tag }
    }) : e.type === d.VIEWPORT_VISIBLE && e.viewport_data ? this.google.trackEvent("viewport_visible", {
      selector: e.viewport_data.selector,
      ...e.viewport_data.id && { element_id: e.viewport_data.id },
      ...e.viewport_data.name && { element_name: e.viewport_data.name },
      dwell_time: e.viewport_data.dwellTime,
      visibility_ratio: e.viewport_data.visibilityRatio
    }) : e.type === d.SESSION_END && this.google.trackEvent("session_end", {
      ...e.session_end_reason && { session_end_reason: e.session_end_reason },
      ...e.page_url && { page_location: e.page_url }
    });
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
    const n = Date.now(), i = (this.perEventRateLimits.get(e) ?? []).filter((o) => n - o < 6e4);
    return i.length >= t ? (a("warn", "Per-event rate limit exceeded for custom event", {
      data: {
        eventName: e,
        limit: t,
        window: `${6e4 / 1e3}s`
      }
    }), !1) : (i.push(n), this.perEventRateLimits.set(e, i), !0);
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
    this.eventsQueue = this.eventsQueue.filter((n) => !t.has(n.id));
  }
  emitEvent(e) {
    this.emitter && this.emitter.emit(O.EVENT, e);
  }
  emitEventsQueue(e) {
    this.emitter && this.emitter.emit(O.QUEUE, e);
  }
}
class Ht {
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
    const t = e.getItem(oe);
    if (t)
      return t;
    const n = At();
    return e.setItem(oe, n), n;
  }
}
class $t {
  storageManager;
  emitter;
  consentState;
  persistedCategories = {};
  storageListener = null;
  persistDebounceTimer = null;
  /**
   * Debounce delay for localStorage persistence (50ms).
   *
   * **Rationale**: Balances responsiveness with localStorage write performance.
   * - Long enough to batch rapid UI interactions (e.g., programmatic consent setup)
   * - Short enough to feel instant to users (< 100ms threshold)
   * - Prevents localStorage thrashing during rapid consent changes
   *
   * **Performance Impact**: 10 rapid changes = 1 write instead of 10 writes
   */
  PERSIST_DEBOUNCE_MS = 50;
  /**
   * Creates a ConsentManager instance.
   *
   * **Side Effects**:
   * - Loads persisted consent from localStorage
   * - Sets up cross-tab synchronization (if `enableCrossTabSync` is true)
   *
   * **SSR Safety**: No-op in Node.js environments
   *
   * @param storageManager - Storage manager for consent persistence
   * @param enableCrossTabSync - Enable cross-tab synchronization (default: true)
   * @param emitter - Optional event emitter for consent-changed events
   */
  constructor(e, t = !0, n = null) {
    this.storageManager = e, this.emitter = n, this.consentState = {
      google: !1,
      custom: !1,
      tracelog: !1
    }, !(typeof window > "u") && (this.loadPersistedConsent(), t && this.setupCrossTabSync());
  }
  /**
   * Checks if consent has been granted for a specific integration.
   *
   * **Purpose**: Query consent state before sending events to integrations.
   *
   * **Behavior**:
   * - `'all'`: Returns `true` only if ALL integrations have consent
   * - Specific integration: Returns consent state for that integration
   * - SSR: Always returns `false` in Node.js environments
   *
   * **Use Cases**:
   * - EventManager: Checks before sending events to backends
   * - SenderManager: Validates consent before network requests
   * - External code: Conditional rendering based on consent
   *
   * @param integration - Integration to check ('all', 'google', 'custom', 'tracelog')
   * @returns `true` if consent granted, `false` otherwise
   *
   * @example
   * ```typescript
   * if (consentManager.hasConsent('google')) {
   *   // Send events to Google Analytics
   * }
   *
   * if (consentManager.hasConsent('all')) {
   *   // All integrations have consent
   * }
   * ```
   */
  hasConsent(e) {
    return typeof window > "u" ? !1 : e === "all" ? this.consentState.google && this.consentState.custom && this.consentState.tracelog : this.consentState[e];
  }
  /**
   * Grants or revokes consent for one or all integrations.
   *
   * **Purpose**: Update consent state and trigger buffered event flush.
   *
   * **Behavior**:
   * - `'all'`: Grants/revokes consent for ALL integrations
   * - Specific integration: Updates consent for that integration only
   * - Persists to localStorage with 50ms debounce
   * - Emits `consent-changed` event
   * - Triggers flush of buffered events (if consent granted)
   * - SSR: No-op in Node.js environments
   *
   * **Persistence**:
   * - Stored in localStorage with 365-day expiration
   * - Debounced 50ms to prevent excessive writes
   * - Cross-tab synchronized via `storage` events
   *
   * **Event Emission**:
   * - Emits `consent-changed` event with current consent state
   * - EventManager listens and flushes buffered events for granted integration
   *
   * **Important**: Revoking consent does NOT delete already-sent events.
   * It only prevents future events from being sent.
   *
   * @param integration - Integration to update ('all', 'google', 'custom', 'tracelog')
   * @param granted - `true` to grant consent, `false` to revoke
   *
   * @example
   * ```typescript
   * // Grant consent for Google Analytics
   * consentManager.setConsent('google', true);
   * // → Buffered Google Analytics events sent
   *
   * // Revoke consent for custom backend
   * consentManager.setConsent('custom', false);
   * // → Future events NOT sent to custom backend
   *
   * // Grant consent for all integrations
   * consentManager.setConsent('all', true);
   * // → All buffered events sent
   * ```
   */
  setConsent(e, t) {
    typeof window > "u" || (e === "all" ? (this.consentState.google = t, this.consentState.custom = t, this.consentState.tracelog = t, a("info", `Consent ${t ? "granted" : "revoked"} for all integrations`)) : (this.consentState[e] = t, a("info", `Consent ${t ? "granted" : "revoked"} for ${e} integration`)), this.persistConsentDebounced(), this.emitter && this.emitter.emit(O.CONSENT_CHANGED, this.getConsentState()));
  }
  /**
   * Returns a snapshot of the current consent state for all integrations.
   *
   * **Purpose**: Retrieve consent state for display in UI or for external logic.
   *
   * **Behavior**:
   * - Returns shallow copy (prevents external mutations)
   * - Always includes all integrations (`google`, `custom`, `tracelog`)
   * - Each integration is `true` (granted) or `false` (not granted)
   *
   * **Use Cases**:
   * - Display consent status in UI
   * - Sync consent to external systems
   * - Conditional logic based on multiple integrations
   *
   * @returns Snapshot of current consent state
   *
   * @example
   * ```typescript
   * const state = consentManager.getConsentState();
   * // → { google: true, custom: false, tracelog: true }
   *
   * // Display in UI
   * console.log(`Google: ${state.google ? 'Granted' : 'Not granted'}`);
   * console.log(`Custom: ${state.custom ? 'Granted' : 'Not granted'}`);
   * console.log(`TraceLog: ${state.tracelog ? 'Granted' : 'Not granted'}`);
   * ```
   */
  getConsentState() {
    return { ...this.consentState };
  }
  /**
   * Returns a list of integrations that have been granted consent.
   *
   * **Purpose**: Get only granted integrations for conditional logic.
   *
   * **Behavior**:
   * - Returns array of integration names with `true` consent
   * - Empty array if no consent granted
   * - Excludes `'all'` (not a real integration)
   *
   * **Use Cases**:
   * - Iterate over granted integrations
   * - Display granted integrations in UI
   * - Conditional initialization of integrations
   *
   * @returns Array of granted integration names
   *
   * @example
   * ```typescript
   * const granted = consentManager.getGrantedIntegrations();
   * // → ['google', 'tracelog']
   *
   * // Iterate over granted integrations
   * granted.forEach(integration => {
   *   console.log(`${integration} has consent`);
   * });
   * ```
   */
  getGrantedIntegrations() {
    const e = [];
    return this.consentState.google && e.push("google"), this.consentState.custom && e.push("custom"), this.consentState.tracelog && e.push("tracelog"), e;
  }
  /**
   * Sets Google Consent Mode categories to be persisted with consent state.
   *
   * **Purpose**: Allow dynamic configuration of Google Consent Mode categories
   * that persist across browser sessions (365 days).
   *
   * **Behavior**:
   * - Stores categories in memory and triggers debounced persistence
   * - Categories saved to localStorage with consent state
   * - Persists across page reloads and browser sessions
   * - Same 365-day expiration as consent state
   *
   * **Use Cases**:
   * - User selects cookie preferences in banner
   * - Dynamic consent configuration after init
   * - Updating categories when user changes preferences
   *
   * @param categories - Google Consent Mode categories to persist
   *
   * @example
   * ```typescript
   * consentManager.setGoogleConsentCategories({
   *   analytics_storage: true,
   *   ad_storage: false
   * });
   * // → Saved to localStorage with consent state
   * // → Reloaded automatically on next page load
   * ```
   */
  setGoogleConsentCategories(e) {
    this.persistedCategories.google = e, this.persistConsentDebounced(), a("debug", "Google consent categories set for persistence", {
      data: { categories: e }
    });
  }
  /**
   * Retrieves persisted Google Consent Mode categories from memory.
   *
   * **Purpose**: Access categories loaded from localStorage during initialization.
   *
   * **Behavior**:
   * - Returns categories loaded from localStorage
   * - Returns undefined if no categories persisted
   * - Categories automatically loaded during ConsentManager initialization
   *
   * **Use Cases**:
   * - Apply persisted categories to config during App.init()
   * - Display saved preferences in UI
   * - Restore user's consent selections
   *
   * @returns Persisted Google Consent Mode categories or undefined
   *
   * @example
   * ```typescript
   * const categories = consentManager.getGoogleConsentCategories();
   * if (categories) {
   *   // Apply to config
   *   config.integrations.google.consentCategories = categories;
   * }
   * ```
   */
  getGoogleConsentCategories() {
    return this.persistedCategories.google;
  }
  /**
   * Cleans up ConsentManager resources and event listeners.
   *
   * **Purpose**: Releases memory and detaches event listeners to prevent memory leaks
   * when ConsentManager is no longer needed.
   *
   * **Cleanup Operations**:
   * 1. Clears pending debounce timer (prevents delayed persistence after cleanup)
   * 2. Removes cross-tab storage event listener
   * 3. Sets references to null for garbage collection
   *
   * **Important Notes**:
   * - Does NOT clear persisted consent from localStorage
   * - Consent state remains accessible in future sessions
   * - SSR-safe: Browser environment check before removing storage listener
   *
   * **Use Cases**:
   * - Called during `App.destroy()` lifecycle
   * - Test cleanup between test cases
   * - Manual cleanup when consent management no longer needed
   *
   * **After Cleanup**:
   * - ConsentManager instance should not be reused
   * - Consent state persists in localStorage
   * - Cross-tab sync stops (other tabs unaffected)
   *
   * @returns void
   *
   * @example
   * ```typescript
   * consentManager.cleanup();
   * // → Debounce timer cleared
   * // → Storage listener removed
   * // → Consent data remains in localStorage
   * ```
   */
  cleanup() {
    this.persistDebounceTimer && (clearTimeout(this.persistDebounceTimer), this.persistDebounceTimer = null), this.storageListener && typeof window < "u" && (window.removeEventListener("storage", this.storageListener), this.storageListener = null);
  }
  /**
   * Loads and validates persisted consent state from localStorage with expiration check.
   *
   * **Purpose**: Restores consent preferences from previous sessions, ensuring they haven't
   * expired (365 days default).
   *
   * **Validation Flow**:
   * 1. SSR safety check (returns early in Node.js)
   * 2. Retrieves consent data from localStorage
   * 3. Parses JSON and validates structure (state, timestamp, expiresAt fields required)
   * 4. Checks expiration against current time
   * 5. Loads consent state into memory if valid
   *
   * **Error Recovery**:
   * - Invalid JSON → Clears storage, starts fresh
   * - Missing required fields → Clears storage, logs warning
   * - Expired consent → Clears storage, logs info
   * - Parse errors → Clears storage, logs warning, starts with default (no consent)
   *
   * **Expiration Calculation**:
   * - Consent expires after CONSENT_EXPIRY_DAYS (365 days)
   * - Logs days until expiry for debugging
   *
   * **Called by**: Constructor during ConsentManager initialization
   *
   * @private
   */
  loadPersistedConsent() {
    if (!(typeof window > "u"))
      try {
        const e = this.storageManager.getItem(V);
        if (!e)
          return;
        const t = JSON.parse(e);
        if (!t.state || !t.timestamp || !t.expiresAt) {
          a("warn", "Invalid consent data structure, ignoring"), this.clearPersistedConsent();
          return;
        }
        const n = Date.now();
        if (n > t.expiresAt) {
          a("info", "Persisted consent has expired, clearing"), this.clearPersistedConsent();
          return;
        }
        this.consentState = {
          google: !!t.state.google,
          custom: !!t.state.custom,
          tracelog: !!t.state.tracelog
        }, t.categories?.google && (qe(t.categories.google) ? (this.persistedCategories = { ...t.categories }, a("debug", "Restored valid persisted Google consent categories")) : a("warn", "Invalid persisted Google consent categories detected, ignoring", {
          data: { categories: t.categories.google }
        })), a("debug", "Loaded persisted consent state", {
          data: {
            google: this.consentState.google,
            custom: this.consentState.custom,
            tracelog: this.consentState.tracelog,
            hasGoogleCategories: !!this.persistedCategories.google,
            daysUntilExpiry: Math.floor((t.expiresAt - n) / (1e3 * 60 * 60 * 24))
          }
        });
      } catch (e) {
        a("warn", "Failed to load persisted consent, starting fresh", { error: e }), this.clearPersistedConsent();
      }
  }
  /**
   * Debounces consent persistence to prevent excessive localStorage writes during rapid consent changes.
   *
   * **Purpose**: Optimizes localStorage write performance by batching multiple consent changes
   * into a single write operation after 50ms of inactivity.
   *
   * **Debouncing Strategy**:
   * - Clears existing timer if called while timer pending
   * - Sets new 50ms timer to delay persistence
   * - Only persists once after rapid sequence of consent changes completes
   *
   * **Performance Impact**:
   * - Without debouncing: N consent changes = N localStorage writes
   * - With debouncing: N consent changes = 1 localStorage write
   * - Example: 10 rapid grants/revokes = 1 write instead of 10
   *
   * **Delay Rationale** (50ms):
   * - Long enough to batch rapid UI interactions
   * - Short enough to feel instant to users
   * - Prevents localStorage thrashing during programmatic consent setup
   *
   * **SSR Safety**: Returns early in Node.js environments
   *
   * **Called by**: `setConsent()` after each consent state change
   *
   * @private
   */
  persistConsentDebounced() {
    typeof window > "u" || (this.persistDebounceTimer && clearTimeout(this.persistDebounceTimer), this.persistDebounceTimer = window.setTimeout(() => {
      this.persistConsent(), this.persistDebounceTimer = null;
    }, this.PERSIST_DEBOUNCE_MS));
  }
  /**
   * Immediately flush any pending consent persistence to localStorage.
   * Clears debounce timer and persists immediately.
   *
   * **Use Cases:**
   * - Before navigation/page unload
   * - When consent must be persisted synchronously (e.g., before init)
   *
   * **Error Handling:**
   * - If `throwOnError` is true, storage errors are rethrown (useful for before-init scenarios)
   * - If `throwOnError` is false (default), storage errors are logged but not thrown
   *
   * @param throwOnError - Whether to throw storage errors (default: false)
   * @public
   */
  flush(e = !1) {
    this.persistDebounceTimer !== null && (clearTimeout(this.persistDebounceTimer), this.persistDebounceTimer = null), this.persistConsent(e);
  }
  /**
   * Immediately persist consent state to localStorage
   *
   * @param throwOnError - Whether to throw storage errors (default: false)
   */
  persistConsent(e = !1) {
    if (!(typeof window > "u"))
      try {
        const t = Date.now(), n = t + je * 24 * 60 * 60 * 1e3, r = {
          state: { ...this.consentState },
          timestamp: t,
          expiresAt: n
        };
        Object.keys(this.persistedCategories).length > 0 && (r.categories = { ...this.persistedCategories }), this.storageManager.setItem(V, JSON.stringify(r));
      } catch (t) {
        if (a("error", "Failed to persist consent state", { error: t }), t instanceof Error && t.name === "QuotaExceededError" && a("warn", "localStorage quota exceeded, consent will be volatile for this session"), e)
          throw t;
      }
  }
  /**
   * Clear persisted consent from localStorage
   */
  clearPersistedConsent() {
    if (!(typeof window > "u"))
      try {
        this.storageManager.removeItem(V);
      } catch (e) {
        a("warn", "Failed to clear persisted consent", { error: e });
      }
  }
  /**
   * Establishes cross-tab consent synchronization using storage events.
   *
   * **Purpose**: Keeps consent state synchronized across all browser tabs/windows
   * by listening to localStorage changes made by other tabs.
   *
   * **How It Works**:
   * 1. Listens to `storage` event (fires when localStorage changes in other tab)
   * 2. Filters events to CONSENT_KEY only
   * 3. Validates new consent data structure
   * 4. Updates in-memory consent state
   * 5. Emits CONSENT_CHANGED event to notify EventManager
   *
   * **Cross-Tab Scenarios**:
   * - Tab A grants consent → Tab B/C/D receive update via storage event
   * - Tab A revokes consent → Tab B/C/D stop sending events immediately
   * - New tab opened → Loads existing consent from localStorage
   *
   * **Event Filtering**:
   * - Only processes events for CONSENT_KEY ('tracelog_consent')
   * - Ignores other localStorage changes
   * - Validates data structure before applying
   *
   * **Error Handling**:
   * - Invalid JSON → Ignored (keeps current state)
   * - Missing required fields → Ignored (logs warning)
   * - Parse errors → Ignored (logs warning, maintains stability)
   *
   * **SSR Safety**: Returns early in Node.js environments
   *
   * **Called by**: Constructor during ConsentManager initialization
   *
   * @private
   */
  setupCrossTabSync() {
    typeof window > "u" || (this.storageListener = (e) => {
      if (!(e.key !== V || e.storageArea !== window.localStorage)) {
        if (!e.newValue) {
          this.consentState = {
            google: !1,
            custom: !1,
            tracelog: !1
          }, a("debug", "Consent cleared in another tab, synced locally"), this.emitter && this.emitter.emit(O.CONSENT_CHANGED, this.getConsentState());
          return;
        }
        try {
          const t = JSON.parse(e.newValue);
          t.state && (this.consentState = {
            google: !!t.state.google,
            custom: !!t.state.custom,
            tracelog: !!t.state.tracelog
          }, a("debug", "Consent updated in another tab, synced locally", {
            data: {
              google: this.consentState.google,
              custom: this.consentState.custom,
              tracelog: this.consentState.tracelog
            }
          }), this.emitter && this.emitter.emit(O.CONSENT_CHANGED, this.getConsentState()));
        } catch (t) {
          a("warn", "Failed to parse consent update from another tab", { error: t });
        }
      }
    }, window.addEventListener("storage", this.storageListener));
  }
}
class Gt extends v {
  storageManager;
  eventManager;
  projectId;
  activityHandler = null;
  visibilityChangeHandler = null;
  beforeUnloadHandler = null;
  sessionTimeoutId = null;
  broadcastChannel = null;
  isTracking = !1;
  isEnding = !1;
  /**
   * Creates a SessionManager instance.
   *
   * @param storageManager - Storage manager for session persistence
   * @param eventManager - Event manager for SESSION_START/SESSION_END events
   * @param projectId - Project identifier for namespacing session storage
   */
  constructor(e, t, n) {
    super(), this.storageManager = e, this.eventManager = t, this.projectId = n;
  }
  initCrossTabSync() {
    if (typeof BroadcastChannel > "u") {
      a("warn", "BroadcastChannel not supported");
      return;
    }
    const e = this.getProjectId();
    this.broadcastChannel = new BroadcastChannel(ze(e)), this.broadcastChannel.onmessage = (t) => {
      const { action: n, sessionId: r, timestamp: i, projectId: o } = t.data ?? {};
      if (o === e) {
        if (n === "session_end") {
          this.resetSessionState();
          return;
        }
        r && typeof i == "number" && i > Date.now() - 5e3 && (this.set("sessionId", r), this.persistSession(r, i), this.isTracking && this.setupSessionTimeout());
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
      } catch (n) {
        a("warn", "Failed to broadcast session end", { error: n, data: { sessionId: e, reason: t } });
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
      const n = JSON.parse(t);
      return !n.id || typeof n.lastActivity != "number" ? null : n;
    } catch {
      return this.storageManager.removeItem(e), null;
    }
  }
  saveStoredSession(e) {
    const t = this.getSessionStorageKey();
    this.storageManager.setItem(t, JSON.stringify(e));
  }
  getSessionStorageKey() {
    return We(this.getProjectId());
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
    const e = this.recoverSession(), t = e ?? this.generateSessionId(), n = !!e;
    this.isTracking = !0;
    try {
      this.set("sessionId", t), this.persistSession(t), this.initCrossTabSync(), this.shareSession(t), n || this.eventManager.track({
        type: d.SESSION_START
      }), this.setupSessionTimeout(), this.setupActivityListeners(), this.setupLifecycleListeners();
    } catch (r) {
      throw this.isTracking = !1, this.clearSessionTimeout(), this.cleanupActivityListeners(), this.cleanupLifecycleListeners(), this.cleanupCrossTabSync(), this.set("sessionId", null), r;
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
    if (this.isEnding)
      return;
    const t = this.get("sessionId");
    if (!t) {
      a("warn", "endSession called without active session", { data: { reason: e } }), this.resetSessionState(e);
      return;
    }
    this.isEnding = !0;
    try {
      this.eventManager.track({
        type: d.SESSION_END,
        session_end_reason: e
      }), this.eventManager.flushImmediatelySync() || a("warn", "Sync flush failed during session end, events persisted for recovery", {
        data: { reason: e, sessionId: t }
      }), this.broadcastSessionEnd(t, e), this.resetSessionState(e);
    } finally {
      this.isEnding = !1;
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
class Xt extends v {
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
      this.sessionManager = new Gt(this.storageManager, this.eventManager, t), this.sessionManager.startTracking(), this.eventManager.flushPendingEvents();
    } catch (n) {
      if (this.sessionManager) {
        try {
          this.sessionManager.destroy();
        } catch {
        }
        this.sessionManager = null;
      }
      throw a("error", "Failed to start session tracking", { error: n }), n;
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
class Wt extends v {
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
    e === "pushState" && !this.originalPushState ? this.originalPushState = t : e === "replaceState" && !this.originalReplaceState && (this.originalReplaceState = t), window.history[e] = (...n) => {
      t.apply(window.history, n), this.trackCurrentPage();
    };
  }
  trackCurrentPage = () => {
    const e = window.location.href, t = fe(e, this.get("config").sensitiveQueryParams);
    if (this.get("pageUrl") === t)
      return;
    const n = Date.now(), r = this.get("config").pageViewThrottleMs ?? 1e3;
    if (n - this.lastPageViewTime < r)
      return;
    this.lastPageViewTime = n, this.onTrack();
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
    const e = fe(window.location.href, this.get("config").sensitiveQueryParams), t = this.extractPageViewData();
    this.lastPageViewTime = Date.now(), this.eventManager.track({
      type: d.PAGE_VIEW,
      page_url: e,
      ...t && { page_view: t }
    }), this.onTrack();
  }
  extractPageViewData() {
    const { pathname: e, search: t, hash: n } = window.location, { referrer: r } = document, { title: i } = document;
    return !r && !i && !e && !t && !n ? void 0 : {
      ...r && { referrer: r },
      ...i && { title: i },
      ...e && { pathname: e },
      ...t && { search: t },
      ...n && { hash: n }
    };
  }
}
class zt extends v {
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
      const t = e, n = t.target, r = typeof HTMLElement < "u" && n instanceof HTMLElement ? n : typeof HTMLElement < "u" && n instanceof Node && n.parentElement instanceof HTMLElement ? n.parentElement : null;
      if (!r) {
        a("warn", "Click target not found or not an element");
        return;
      }
      if (this.shouldIgnoreElement(r))
        return;
      const i = this.get("config")?.clickThrottleMs ?? 300;
      if (i > 0 && !this.checkClickThrottle(r, i))
        return;
      const o = this.findTrackingElement(r), l = this.getRelevantClickElement(r), c = this.calculateClickCoordinates(t, r);
      if (o) {
        const f = this.extractTrackingData(o);
        if (f) {
          const m = this.createCustomEventData(f);
          this.eventManager.track({
            type: d.CUSTOM,
            custom_event: {
              name: m.name,
              ...m.value && { metadata: { value: m.value } }
            }
          });
        }
      }
      const u = this.generateClickData(r, l, c);
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
    const n = this.getElementSignature(e), r = Date.now();
    this.pruneThrottleCache(r);
    const i = this.lastClickTimes.get(n);
    return i !== void 0 && r - i < t ? (a("debug", "ClickHandler: Click suppressed by throttle", {
      data: {
        signature: n,
        throttleRemaining: t - (r - i)
      }
    }), !1) : (this.lastClickTimes.set(n, r), !0);
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
    for (const [n, r] of this.lastClickTimes.entries())
      r < t && this.lastClickTimes.delete(n);
    if (this.lastClickTimes.size > 1e3) {
      const n = Array.from(this.lastClickTimes.entries()).sort((o, l) => o[1] - l[1]), r = this.lastClickTimes.size - 1e3, i = n.slice(0, r);
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
    const n = e.getAttribute(`${I}-name`);
    return n ? `[${I}-name="${n}"]` : this.getElementPath(e);
  }
  /**
   * Generates a DOM path for an element (e.g., "body>div>button")
   */
  getElementPath(e) {
    const t = [];
    let n = e;
    for (; n && n !== document.body; ) {
      let r = n.tagName.toLowerCase();
      if (n.className) {
        const i = n.className.split(" ")[0];
        i && (r += `.${i}`);
      }
      t.unshift(r), n = n.parentElement;
    }
    return t.join(">") || "unknown";
  }
  findTrackingElement(e) {
    return e.hasAttribute(`${I}-name`) ? e : e.closest(`[${I}-name]`);
  }
  getRelevantClickElement(e) {
    for (const t of ct)
      try {
        if (e.matches(t))
          return e;
        const n = e.closest(t);
        if (n)
          return n;
      } catch (n) {
        a("warn", "Invalid selector in element search", { error: n, data: { selector: t } });
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
    const n = t.getBoundingClientRect(), r = e.clientX, i = e.clientY, o = n.width > 0 ? this.clamp((r - n.left) / n.width) : 0, l = n.height > 0 ? this.clamp((i - n.top) / n.height) : 0;
    return { x: r, y: i, relativeX: o, relativeY: l };
  }
  extractTrackingData(e) {
    const t = e.getAttribute(`${I}-name`), n = e.getAttribute(`${I}-value`);
    if (t)
      return {
        element: e,
        name: t,
        ...n && { value: n }
      };
  }
  generateClickData(e, t, n) {
    const { x: r, y: i, relativeX: o, relativeY: l } = n, c = this.getRelevantText(e, t), u = this.extractElementAttributes(t);
    return {
      x: r,
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
    for (const n of $e) {
      const r = new RegExp(n.source, n.flags);
      t = t.replace(r, "[REDACTED]");
    }
    return t;
  }
  getRelevantText(e, t) {
    const n = e.textContent?.trim() ?? "", r = t.textContent?.trim() ?? "";
    if (!n && !r)
      return "";
    let i = "";
    return n && n.length <= 255 ? i = n : r.length <= 255 ? i = r : i = r.slice(0, 252) + "...", this.sanitizeText(i);
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
    ], n = {};
    for (const r of t) {
      const i = e.getAttribute(r);
      i && (n[r] = i);
    }
    return n;
  }
  createCustomEventData(e) {
    return {
      name: e.name,
      ...e.value && { value: e.value }
    };
  }
}
class jt extends v {
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
      for (const n of t) {
        const r = this.getElementSelector(n);
        this.setupScrollContainer(n, r);
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
      acceptNode: (r) => {
        const i = r;
        if (!i.isConnected || !i.offsetParent)
          return NodeFilter.FILTER_SKIP;
        const o = getComputedStyle(i);
        return o.overflowY === "auto" || o.overflowY === "scroll" || o.overflow === "auto" || o.overflow === "scroll" ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      }
    });
    let n;
    for (; (n = t.nextNode()) && e.length < 10; ) {
      const r = n;
      this.isElementScrollable(r) && e.push(r);
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
      const n = t.className.split(" ").filter((r) => r.trim())[0];
      if (n)
        return `.${n}`;
    }
    return t.tagName.toLowerCase();
  }
  determineIfPrimary(e) {
    return this.isWindowScrollable() ? e === window : this.containers.length === 0;
  }
  setupScrollContainer(e, t) {
    if (this.containers.some((u) => u.element === e) || e !== window && !this.isElementScrollable(e))
      return;
    const r = this.getScrollTop(e), i = this.calculateScrollDepth(
      r,
      this.getScrollHeight(e),
      this.getViewportHeight(e)
    ), o = this.determineIfPrimary(e), l = {
      element: e,
      selector: t,
      isPrimary: o,
      lastScrollPos: r,
      lastDepth: i,
      lastDirection: j.DOWN,
      lastEventTime: 0,
      firstScrollEventTime: null,
      maxDepthReached: i,
      debounceTimer: null,
      listener: null
    }, c = () => {
      this.get("suppressNextScroll") || (l.firstScrollEventTime === null && (l.firstScrollEventTime = Date.now()), this.clearContainerTimer(l), l.debounceTimer = window.setTimeout(() => {
        const u = this.calculateScrollData(l);
        if (u) {
          const f = Date.now();
          this.processScrollEvent(l, u, f);
        }
        l.debounceTimer = null;
      }, 250));
    };
    l.listener = c, this.containers.push(l), e === window ? window.addEventListener("scroll", c, { passive: !0 }) : e.addEventListener("scroll", c, { passive: !0 });
  }
  processScrollEvent(e, t, n) {
    if (!this.shouldEmitScrollEvent(e, t, n))
      return;
    e.lastEventTime = n, e.lastDepth = t.depth, e.lastDirection = t.direction;
    const r = this.get("scrollEventCount") ?? 0;
    this.set("scrollEventCount", r + 1), this.eventManager.track({
      type: d.SCROLL,
      scroll_data: {
        ...t,
        container_selector: e.selector,
        is_primary: e.isPrimary
      }
    });
  }
  shouldEmitScrollEvent(e, t, n) {
    return this.hasReachedSessionLimit() ? (this.logLimitOnce(), !1) : !(!this.hasElapsedMinimumInterval(e, n) || !this.hasSignificantDepthChange(e, t.depth));
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
    return e > t ? j.DOWN : j.UP;
  }
  calculateScrollDepth(e, t, n) {
    if (t <= n)
      return 0;
    const r = t - n;
    return Math.min(100, Math.max(0, Math.floor(e / r * 100)));
  }
  calculateScrollData(e) {
    const { element: t, lastScrollPos: n, lastEventTime: r } = e, i = this.getScrollTop(t), o = Date.now(), l = Math.abs(i - n);
    if (l < 10 || t === window && !this.isWindowScrollable())
      return null;
    const c = this.getViewportHeight(t), u = this.getScrollHeight(t), f = this.getScrollDirection(i, n), m = this.calculateScrollDepth(i, u, c);
    let E;
    r > 0 ? E = o - r : e.firstScrollEventTime !== null ? E = o - e.firstScrollEventTime : E = 250;
    const T = Math.round(l / E * 1e3);
    return m > e.maxDepthReached && (e.maxDepthReached = m), e.lastScrollPos = i, {
      depth: m,
      direction: f,
      velocity: T,
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
    const t = getComputedStyle(e), n = t.overflowY === "auto" || t.overflowY === "scroll" || t.overflow === "auto" || t.overflow === "scroll", r = e.scrollHeight > e.clientHeight;
    return n && r;
  }
  applyPrimaryScrollSelector(e) {
    let t;
    if (e === "window")
      t = window;
    else {
      const r = document.querySelector(e);
      if (!(r instanceof HTMLElement)) {
        a("warn", `Selector "${e}" did not match an HTMLElement`);
        return;
      }
      t = r;
    }
    this.containers.forEach((r) => {
      this.updateContainerPrimary(r, r.element === t);
    }), !this.containers.some((r) => r.element === t) && t instanceof HTMLElement && this.isElementScrollable(t) && this.setupScrollContainer(t, e);
  }
  updateContainerPrimary(e, t) {
    e.isPrimary = t;
  }
}
class Qt extends v {
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
    const t = this.config.threshold ?? 0.5, n = this.config.minDwellTime ?? 1e3;
    if (t < 0 || t > 1) {
      a("warn", "ViewportHandler: Invalid threshold, must be between 0 and 1");
      return;
    }
    if (n < 0) {
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
    for (const n of this.config.elements)
      try {
        const r = document.querySelectorAll(n.selector);
        for (const i of Array.from(r)) {
          if (t >= e) {
            a("warn", "ViewportHandler: Maximum tracked elements reached", {
              data: {
                limit: e,
                selector: n.selector,
                message: "Some elements will not be tracked. Consider more specific selectors."
              }
            });
            return;
          }
          i.hasAttribute(`${I}-ignore`) || this.trackedElements.has(i) || (this.trackedElements.set(i, {
            element: i,
            selector: n.selector,
            id: n.id,
            name: n.name,
            startTime: null,
            timeoutId: null,
            lastFiredTime: null
          }), this.observer?.observe(i), t++);
        }
      } catch (r) {
        a("warn", `ViewportHandler: Invalid selector "${n.selector}"`, { error: r });
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
    for (const n of e) {
      const r = this.trackedElements.get(n.target);
      r && (n.isIntersecting ? r.startTime === null && (r.startTime = performance.now(), r.timeoutId = window.setTimeout(() => {
        const i = Math.round(n.intersectionRatio * 100) / 100;
        this.fireViewportEvent(r, i);
      }, t)) : r.startTime !== null && (r.timeoutId !== null && (window.clearTimeout(r.timeoutId), r.timeoutId = null), r.startTime = null));
    }
  };
  /**
   * Fires a viewport visible event
   */
  fireViewportEvent(e, t) {
    if (e.startTime === null) return;
    const n = Math.round(performance.now() - e.startTime);
    if (e.element.hasAttribute(`${I}-ignore`))
      return;
    const r = this.config?.cooldownPeriod ?? 6e4, i = Date.now();
    if (e.lastFiredTime !== null && i - e.lastFiredTime < r) {
      a("debug", "ViewportHandler: Event suppressed by cooldown period", {
        data: {
          selector: e.selector,
          cooldownRemaining: r - (i - e.lastFiredTime)
        }
      }), e.startTime = null, e.timeoutId = null;
      return;
    }
    const o = {
      selector: e.selector,
      dwellTime: n,
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
        for (const n of e)
          n.type === "childList" && (n.addedNodes.length > 0 && (t = !0), n.removedNodes.length > 0 && this.cleanupRemovedNodes(n.removedNodes));
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
      const n = t, r = this.trackedElements.get(n);
      r && (r.timeoutId !== null && window.clearTimeout(r.timeoutId), this.observer?.unobserve(n), this.trackedElements.delete(n)), Array.from(this.trackedElements.keys()).filter((o) => n.contains(o)).forEach((o) => {
        const l = this.trackedElements.get(o);
        l && l.timeoutId !== null && window.clearTimeout(l.timeoutId), this.observer?.unobserve(o), this.trackedElements.delete(o);
      });
    });
  }
}
class ke extends v {
  scriptId = "tracelog-ga-script";
  configScriptId = "tracelog-ga-config-script";
  isInitialized = !1;
  /**
   * Initializes Google Analytics/GTM integration.
   *
   * **Initialization Flow**:
   * 1. Validates configuration (measurementId or containerId required)
   * 2. Checks for existing gtag instance (auto-detection)
   * 3. Checks if script already loaded (avoids duplicate loading)
   * 4. Loads appropriate script (GTM or gtag.js)
   * 5. Configures gtag with user_id
   *
   * **Script Priority**:
   * - If `containerId` provided: Loads GTM script (`gtm.js`)
   * - Otherwise: Loads GA4 script (`gtag/js`)
   *
   * **Auto-detection**:
   * - Reuses existing gtag/dataLayer if found
   * - Logs info message when reusing external scripts
   *
   * **Error Handling**:
   * - Initialization failures are logged but don't throw
   * - Safe to call multiple times (idempotent)
   *
   * @returns Promise that resolves when initialization completes
   */
  async initialize() {
    if (this.isInitialized)
      return;
    const e = this.get("config").integrations?.google, t = this.get("userId");
    if (!e || !t?.trim())
      return;
    const { measurementId: n, containerId: r } = e;
    if (!(!n?.trim() && !r?.trim()))
      try {
        if (this.hasExistingConsentMode()) {
          a("info", "Google Consent Mode detected, respecting existing configuration", {
            showToClient: !0
          }), this.isInitialized = !0;
          return;
        }
        if (this.hasExistingGtagInstance()) {
          a("info", "Google Analytics/GTM already loaded by external service, reusing existing script", {
            showToClient: !0
          }), this.isInitialized = !0;
          return;
        }
        if (this.isScriptAlreadyLoaded()) {
          this.isInitialized = !0;
          return;
        }
        const i = r?.trim() || n?.trim();
        i && (await this.loadScript(i), this.configureGtag(i, t)), this.isInitialized = !0;
      } catch (i) {
        a("error", "Google Analytics/GTM initialization failed", { error: i });
      }
  }
  /**
   * Sends a custom event to Google Analytics/GTM via gtag.
   *
   * **Event Flow**:
   * - Called by EventManager when custom event (`tracelog.event()`) is tracked
   * - Only custom events are forwarded (automatic events like clicks are NOT sent)
   * - Events pushed to dataLayer via `gtag('event', eventName, metadata)`
   *
   * **Metadata Handling**:
   * - Arrays are wrapped in `{ items: [...] }` for GA4 compatibility
   * - Objects passed directly to gtag
   *
   * **Requirements**:
   * - Integration must be initialized (`initialize()` called successfully)
   * - `window.gtag` function must exist
   * - Event name must be non-empty string
   *
   * **Error Handling**:
   * - Silent failures (logs error but doesn't throw)
   * - Safe to call before initialization (no-op)
   *
   * @param eventName - Event name (e.g., 'button_click', 'purchase_completed')
   * @param metadata - Event metadata (flat key-value object or array of objects)
   *
   * @example
   * ```typescript
   * // Object metadata
   * trackEvent('button_click', { button_id: 'cta', page: 'home' });
   * // → gtag('event', 'button_click', { button_id: 'cta', page: 'home' })
   *
   * // Array metadata (wrapped for GA4 e-commerce)
   * trackEvent('purchase', [{ id: '123', name: 'Product', price: 99 }]);
   * // → gtag('event', 'purchase', { items: [{ id: '123', name: 'Product', price: 99 }] })
   * ```
   */
  trackEvent(e, t) {
    if (!(!e?.trim() || !this.isInitialized || typeof window.gtag != "function"))
      try {
        const n = Array.isArray(t) ? { items: t } : t;
        window.gtag("event", e, n);
      } catch (n) {
        a("error", "Google Analytics event tracking failed", { error: n });
      }
  }
  /**
   * Synchronizes TraceLog consent state to Google Consent Mode.
   * Called when `tracelog.setConsent('google', granted)` is invoked.
   *
   * **Behavior**:
   * - 'all': Grants/denies all 5 Google Consent Mode categories
   * - Object: Granular control per category
   *   - true: Grant this category when consent=true
   *   - false: Deny this category even when consent=true
   *   - undefined: Skip this category (respects external CMP)
   * - Calls `gtag('consent', 'update')` to sync state with Google
   *
   * @param integration - Integration name (must be 'google')
   * @param granted - true to grant consent, false to revoke
   *
   * @example
   * ```typescript
   * // Config: consentCategories: 'all'
   * googleAnalytics.syncConsentToGoogle('google', true);
   * // → Updates all 5 categories to 'granted'
   *
   * // Config: consentCategories: { analytics_storage: true, ad_storage: false }
   * googleAnalytics.syncConsentToGoogle('google', true);
   * // → analytics_storage: 'granted', ad_storage: 'denied'
   *
   * // Config: consentCategories: { analytics_storage: true, ad_storage: false }
   * googleAnalytics.syncConsentToGoogle('google', false);
   * // → Both 'denied' (consent revoked overrides category config)
   * ```
   */
  syncConsentToGoogle(e, t) {
    if (typeof window > "u" || !window.gtag || e !== "google")
      return;
    const r = this.get("config").integrations?.google?.consentCategories || "all", i = {};
    r === "all" ? [
      "analytics_storage",
      "ad_storage",
      "ad_user_data",
      "ad_personalization",
      "personalization_storage"
    ].forEach((l) => {
      i[l] = t ? "granted" : "denied";
    }) : Object.entries(r).forEach(([o, l]) => {
      const c = o;
      t ? i[c] = l ? "granted" : "denied" : i[c] = "denied";
    });
    try {
      window.gtag("consent", "update", i), a("debug", `Google Consent Mode updated: ${t ? "consent granted" : "consent denied"}`, {
        data: { granted: t, categories: Object.keys(i), updates: i }
      });
    } catch (o) {
      a("error", "Failed to sync consent to Google Consent Mode", { error: o });
    }
  }
  /**
   * Sets default consent state to 'denied' for all Google Consent Mode categories.
   * Called during initialization when `waitForConsent: true` is configured.
   *
   * **Purpose**: GDPR/privacy-first approach - explicitly deny all categories
   * until user grants consent. Prevents any Google tags from firing before consent.
   *
   * **Behavior**:
   * - Sets all 5 Google Consent Mode categories to 'denied'
   * - Uses `gtag('consent', 'default', ...)` command
   * - Only called if `waitForConsent: true` and no existing Consent Mode detected
   * - Safe to call before gtag script loads (queued in dataLayer)
   *
   * **Categories Set to 'denied'**:
   * - analytics_storage
   * - ad_storage
   * - ad_user_data
   * - ad_personalization
   * - personalization_storage
   *
   * @example
   * ```typescript
   * // During App initialization with waitForConsent
   * googleAnalytics.setDefaultConsent();
   * // → gtag('consent', 'default', { all: 'denied' })
   * ```
   */
  setDefaultConsent() {
    if (!(typeof window > "u")) {
      if (this.hasExistingConsentMode()) {
        a("info", "Google Consent Mode already configured, skipping default consent setup", {
          showToClient: !0
        });
        return;
      }
      window.dataLayer || (window.dataLayer = []), typeof window.gtag != "function" && (window.gtag = function(...t) {
        window.dataLayer.push(t);
      });
      try {
        window.gtag("consent", "default", {
          analytics_storage: "denied",
          ad_storage: "denied",
          ad_user_data: "denied",
          ad_personalization: "denied",
          personalization_storage: "denied"
        }), a("debug", "Google Consent Mode default state set to denied (waitForConsent enabled)", {
          data: { allCategories: "denied" }
        });
      } catch (e) {
        a("error", "Failed to set default consent state", { error: e });
      }
    }
  }
  /**
   * Cleans up Google Analytics integration resources.
   *
   * **Cleanup Actions**:
   * - Resets initialization flag
   * - Removes TraceLog-injected script elements (main + config)
   * - Does NOT remove externally loaded gtag/GTM scripts
   *
   * **Note**: gtag function and dataLayer remain in window even after cleanup.
   * This is intentional to avoid breaking external scripts that may depend on them.
   *
   * Called by:
   * - `App.destroy()` - When destroying entire TraceLog instance
   * - Error scenarios during initialization
   */
  cleanup() {
    this.isInitialized = !1;
    const e = document.getElementById(this.scriptId);
    e && e.remove();
    const t = document.getElementById(this.configScriptId);
    t && t.remove();
  }
  /**
   * Checks if Google Consent Mode is already configured on the page.
   * Detects existing Consent Mode configuration from external CMPs or manual setup.
   *
   * **Detection Strategy**:
   * - Searches `window.dataLayer` for any `['consent', ...]` commands
   * - Returns true if found (external CMP or manual Consent Mode setup detected)
   * - Returns false otherwise (safe to configure Consent Mode)
   *
   * **Purpose**: Prevents overwriting existing Consent Mode configuration
   * from CMPs (CookieYes, OneTrust, Cookiebot, etc.) or manual implementations.
   *
   * @returns true if Consent Mode detected, false otherwise
   *
   * @private
   */
  hasExistingConsentMode() {
    return typeof window > "u" || !Array.isArray(window.dataLayer) ? !1 : window.dataLayer.some((e) => Array.isArray(e) && e[0] === "consent");
  }
  /**
   * Checks if gtag is already loaded by external service.
   *
   * Auto-detection prevents duplicate script loading when GA/GTM
   * is already present (e.g., loaded by Consent Management Platform).
   */
  hasExistingGtagInstance() {
    return typeof window.gtag == "function" && Array.isArray(window.dataLayer);
  }
  getScriptType(e) {
    return e.startsWith("GTM-") && e.length > 4 ? "GTM" : "GA4";
  }
  /**
   * Checks if Google Analytics/GTM script is already loaded.
   *
   * Three-tier detection strategy prevents duplicate script injection:
   * 1. Checks for existing gtag instance + dataLayer (runtime detection)
   * 2. Checks for TraceLog-injected script (#tracelog-ga-script)
   * 3. Checks for external GA/GTM scripts by src pattern
   *
   * @returns True if any GA/GTM script detected, false otherwise
   */
  isScriptAlreadyLoaded() {
    return this.hasExistingGtagInstance() || document.getElementById(this.scriptId) ? !0 : !!document.querySelector(
      'script[src*="googletagmanager.com/gtag/js"], script[src*="googletagmanager.com/gtm.js"]'
    );
  }
  /**
   * Dynamically loads Google Analytics/GTM script into page.
   *
   * Script URLs:
   * - GTM: https://www.googletagmanager.com/gtm.js?id=GTM-XXXXXXX
   * - GA4/Ads/UA: https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX
   *
   * @param measurementId - GA4/GTM/Ads/UA ID
   * @returns Promise that resolves when script loads successfully
   * @throws Error if script fails to load
   */
  async loadScript(e) {
    return new Promise((t, n) => {
      const r = document.createElement("script");
      r.id = "tracelog-ga-script", r.async = !0;
      const i = this.getScriptType(e);
      i === "GTM" ? r.src = `https://www.googletagmanager.com/gtm.js?id=${e}` : r.src = `https://www.googletagmanager.com/gtag/js?id=${e}`, r.onload = () => {
        t();
      }, r.onerror = () => {
        const o = i === "GTM" ? "GTM" : "Google Analytics";
        n(new Error(`Failed to load ${o} script`));
      }, document.head.appendChild(r);
    });
  }
  /**
   * Configures gtag function and dataLayer.
   *
   * **GTM Configuration**:
   * - Only initializes gtag function and dataLayer
   * - No config call (tags configured in GTM UI)
   * - User tracking: Configure user_id in GTM using dataLayer variables
   * - Allows GTM container to manage all tag configuration
   *
   * **GA4/Ads/UA Configuration**:
   * - Initializes gtag function and dataLayer
   * - Calls `gtag('config')` with measurement ID
   * - Sets `user_id` for cross-device tracking
   *
   * @param measurementId - GA4/GTM/Ads/UA ID
   * @param userId - TraceLog user ID for user tracking
   */
  configureGtag(e, t) {
    const n = document.createElement("script");
    n.id = this.configScriptId, n.type = "text/javascript", e.startsWith("GTM-") ? n.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
      ` : n.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${e}', {
          'user_id': '${t}'
        });
      `, document.head.appendChild(n);
  }
}
class Kt {
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
    } catch (n) {
      if (n instanceof DOMException && n.name === "QuotaExceededError" || n instanceof Error && n.name === "QuotaExceededError")
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
            error: n,
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
        const n = this.storage.key(t);
        n?.startsWith("tracelog_") && e.push(n);
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
      const n = ["tracelog_session_", "tracelog_user_id", "tracelog_device_id", "tracelog_config"], r = e.filter((i) => !n.some((o) => i.startsWith(o)));
      return r.length > 0 ? (r.slice(0, 5).forEach((o) => {
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
      const t = e === "localStorage" ? window.localStorage : window.sessionStorage, n = "__tracelog_test__";
      return t.setItem(n, "test"), t.removeItem(n), t;
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
    } catch (n) {
      (n instanceof DOMException && n.name === "QuotaExceededError" || n instanceof Error && n.name === "QuotaExceededError") && a("error", "sessionStorage quota exceeded - data will not persist", {
        error: n,
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
class Yt extends v {
  eventManager;
  reportedByNav = /* @__PURE__ */ new Map();
  navigationHistory = [];
  // FIFO queue for tracking navigation order
  observers = [];
  vitalThresholds;
  lastLongTaskSentAt = 0;
  constructor(e) {
    super(), this.eventManager = e, this.vitalThresholds = Ne(ue);
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
    const e = this.get("config"), t = e?.webVitalsMode ?? ue;
    this.vitalThresholds = Ne(t), e?.webVitalsThresholds && (this.vitalThresholds = { ...this.vitalThresholds, ...e.webVitalsThresholds }), await this.initWebVitals(), this.observeLongTasks();
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
      } catch (n) {
        a("warn", "Failed to disconnect performance observer", { error: n, data: { observerIndex: t } });
      }
    }), this.observers.length = 0, this.reportedByNav.clear(), this.navigationHistory.length = 0;
  }
  observeWebVitalsFallback() {
    this.reportTTFB(), this.safeObserve(
      "largest-contentful-paint",
      (n) => {
        const r = n.getEntries(), i = r[r.length - 1];
        i && this.sendVital({ type: "LCP", value: Number(i.startTime.toFixed(2)) });
      },
      { type: "largest-contentful-paint", buffered: !0 },
      !0
    );
    let e = 0, t = this.getNavigationId();
    this.safeObserve(
      "layout-shift",
      (n) => {
        const r = this.getNavigationId();
        r !== t && (e = 0, t = r);
        const i = n.getEntries();
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
      (n) => {
        for (const r of n.getEntries())
          r.name === "first-contentful-paint" && this.sendVital({ type: "FCP", value: Number(r.startTime.toFixed(2)) });
      },
      { type: "paint", buffered: !0 },
      !0
    ), this.safeObserve(
      "event",
      (n) => {
        let r = 0;
        const i = n.getEntries();
        for (const o of i) {
          const l = (o.processingEnd ?? 0) - (o.startTime ?? 0);
          r = Math.max(r, l);
        }
        r > 0 && this.sendVital({ type: "INP", value: Number(r.toFixed(2)) });
      },
      { type: "event", buffered: !0 }
    );
  }
  async initWebVitals() {
    try {
      const { onLCP: e, onCLS: t, onFCP: n, onTTFB: r, onINP: i } = await Promise.resolve().then(() => yn), o = (l) => (c) => {
        const u = Number(c.value.toFixed(2));
        this.sendVital({ type: l, value: u });
      };
      e(o("LCP"), { reportAllChanges: !1 }), t(o("CLS"), { reportAllChanges: !1 }), n(o("FCP"), { reportAllChanges: !1 }), r(o("TTFB"), { reportAllChanges: !1 }), i(o("INP"), { reportAllChanges: !1 });
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
        for (const n of t) {
          const r = Number(n.duration.toFixed(2)), i = Date.now();
          i - this.lastLongTaskSentAt >= It && (this.shouldSendVital("LONG_TASK", r) && this.trackWebVital("LONG_TASK", r), this.lastLongTaskSentAt = i);
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
      const n = this.reportedByNav.get(t);
      if (n?.has(e.type))
        return;
      if (n)
        n.add(e.type);
      else if (this.reportedByNav.set(t, /* @__PURE__ */ new Set([e.type])), this.navigationHistory.push(t), this.navigationHistory.length > wt) {
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
  getNavigationId() {
    try {
      const e = performance.getEntriesByType("navigation")[0];
      if (!e)
        return null;
      const t = e.startTime || performance.now(), n = Math.random().toString(36).substr(2, 5);
      return `${t.toFixed(2)}_${window.location.pathname}_${n}`;
    } catch (e) {
      return a("warn", "Failed to get navigation ID", { error: e }), null;
    }
  }
  isObserverSupported(e) {
    if (typeof PerformanceObserver > "u") return !1;
    const t = PerformanceObserver.supportedEntryTypes;
    return !t || t.includes(e);
  }
  safeObserve(e, t, n, r = !1) {
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
        if (r)
          try {
            l.disconnect();
          } catch {
          }
      });
      return i.observe(n ?? { type: e, buffered: !0 }), r || this.observers.push(i), !0;
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
    const n = this.vitalThresholds[e];
    return !(typeof n == "number" && t <= n);
  }
}
class qt extends v {
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
    if (e - this.burstWindowStart > St && (this.errorBurstCounter = 0, this.burstWindowStart = e), this.errorBurstCounter++, this.errorBurstCounter > Tt)
      return this.burstBackoffUntil = e + Me, a("warn", "Error burst detected - entering cooldown", {
        data: {
          errorsInWindow: this.errorBurstCounter,
          cooldownMs: Me
        }
      }), !1;
    const n = this.get("config")?.errorSampling ?? Ge;
    return Math.random() < n;
  }
  handleError = (e) => {
    if (!this.shouldSample())
      return;
    const t = this.sanitize(e.message || "Unknown error");
    this.shouldSuppressError(H.JS_ERROR, t) || this.eventManager.track({
      type: d.ERROR,
      error_data: {
        type: H.JS_ERROR,
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
    const t = this.extractRejectionMessage(e.reason), n = this.sanitize(t);
    this.shouldSuppressError(H.PROMISE_REJECTION, n) || this.eventManager.track({
      type: d.ERROR,
      error_data: {
        type: H.PROMISE_REJECTION,
        message: n
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
    let t = e.length > Ae ? e.slice(0, Ae) + "..." : e;
    for (const n of $e) {
      const r = new RegExp(n.source, n.flags);
      t = t.replace(r, "[REDACTED]");
    }
    return t;
  }
  shouldSuppressError(e, t) {
    const n = Date.now(), r = `${e}:${t}`, i = this.recentErrors.get(r);
    return i && n - i < be ? (this.recentErrors.set(r, n), !0) : (this.recentErrors.set(r, n), this.recentErrors.size > pt ? (this.recentErrors.clear(), this.recentErrors.set(r, n), !1) : (this.recentErrors.size > Q && this.pruneOldErrors(), !1));
  }
  pruneOldErrors() {
    const e = Date.now();
    for (const [r, i] of this.recentErrors.entries())
      e - i > be && this.recentErrors.delete(r);
    if (this.recentErrors.size <= Q)
      return;
    const t = Array.from(this.recentErrors.entries()).sort((r, i) => r[1] - i[1]), n = this.recentErrors.size - Q;
    for (let r = 0; r < n; r += 1) {
      const i = t[r];
      i && this.recentErrors.delete(i[0]);
    }
  }
}
class Jt extends v {
  isInitialized = !1;
  suppressNextScrollTimer = null;
  emitter = new Ut();
  transformers = {};
  managers = {};
  handlers = {};
  integrations = {};
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
      this.managers.storage = new Kt();
      try {
        this.setupState(e), this.managers.consent = new $t(this.managers.storage, !0, this.emitter);
        const t = this.managers.consent.getGoogleConsentCategories();
        if (t && e.integrations?.google) {
          const r = this.get("config");
          if (r.integrations?.google) {
            const i = {
              ...r,
              integrations: {
                ...r.integrations,
                google: {
                  ...r.integrations.google,
                  consentCategories: t
                }
              }
            };
            this.set("config", i), a("debug", "Restored persisted Google Consent Mode categories", {
              data: { categories: t }
            });
          }
        }
        if (this.getIntegrationConsentRequirement("google") || this.getIntegrationConsentRequirement("custom") || this.getIntegrationConsentRequirement("tracelog")) {
          const r = this.managers.consent.getConsentState();
          a("info", "Consent mode enabled", {
            data: {
              google: r.google,
              custom: r.custom,
              tracelog: r.tracelog
            }
          }), this.hasValidGoogleConfig() && this.getIntegrationConsentRequirement("google") && new ke().setDefaultConsent();
        }
        await this.setupIntegrations(), this.managers.event = new Ft(
          this.managers.storage,
          this.integrations.google,
          this.managers.consent,
          this.emitter,
          this.transformers
        ), this.emitter.on(O.CONSENT_CHANGED, (r) => {
          if (!this.managers.event || !this.managers.consent)
            return;
          const i = ["google", "custom", "tracelog"];
          Promise.all(
            i.filter((o) => r[o] === !0).map(async (o) => this.managers.event.flushConsentBuffer(o))
          ).catch((o) => {
            a("error", "Failed to flush consent buffer after consent granted", { error: o });
          }), r.google && this.integrations.google && this.integrations.google.syncConsentToGoogle("google", r.google);
        }), this.initializeHandlers(), await this.managers.event.recoverPersistedEvents().catch((r) => {
          a("warn", "Failed to recover persisted events", { error: r });
        }), this.isInitialized = !0;
      } catch (t) {
        this.destroy(!0);
        const n = t instanceof Error ? t.message : String(t);
        throw new Error(`[TraceLog] TraceLog initialization failed: ${n}`);
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
    let n = t;
    t && typeof t == "object" && !Array.isArray(t) && Object.getPrototypeOf(t) !== Object.prototype && (n = Object.assign({}, t));
    const { valid: r, error: i, sanitizedMetadata: o } = xt(e, n);
    if (!r) {
      if (this.get("mode") === x.QA)
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
    !this.isInitialized && !e || (this.integrations.google?.cleanup(), Object.values(this.handlers).filter(Boolean).forEach((t) => {
      try {
        t.stopTracking();
      } catch (n) {
        a("warn", "Failed to stop tracking", { error: n });
      }
    }), this.suppressNextScrollTimer && (clearTimeout(this.suppressNextScrollTimer), this.suppressNextScrollTimer = null), this.managers.event?.stop(), this.managers.consent?.cleanup(), this.emitter.removeAllListeners(), this.transformers.beforeSend = void 0, this.transformers.beforeBatch = void 0, this.set("hasStartSession", !1), this.set("suppressNextScroll", !1), this.set("sessionId", null), this.isInitialized = !1, this.handlers = {}, this.managers = {}, this.integrations = {});
  }
  setupState(e = {}) {
    this.set("config", e);
    const t = Ht.getId(this.managers.storage);
    this.set("userId", t);
    const n = Lt(e);
    this.set("collectApiUrls", n);
    const r = Et();
    this.set("device", r);
    const i = fe(window.location.href, e.sensitiveQueryParams);
    this.set("pageUrl", i);
    const o = yt() ? x.QA : void 0;
    o && this.set("mode", o);
  }
  async setupIntegrations() {
    this.hasValidGoogleConfig() && (this.shouldInitializeIntegration("google") ? await this.initializeGoogleAnalytics() : a("info", "Google Analytics initialization deferred, waiting for consent"));
  }
  /**
   * Returns the ConsentManager instance for consent state management.
   *
   * @returns The ConsentManager instance, or undefined if not initialized
   * @internal Used by api.ts for consent operations
   */
  getConsentManager() {
    return this.managers.consent;
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
   * Handles consent granted for a specific integration by initializing the integration (if needed)
   * and flushing buffered events.
   *
   * @param integration - The integration name ('google', 'custom', or 'tracelog')
   * @returns Promise that resolves when initialization and buffer flush complete
   * @internal Called from api.setConsent() when consent is granted
   */
  async handleConsentGranted(e) {
    a("info", `Consent granted for ${e}, initializing and flushing buffer`), e === "google" && !this.integrations.google && this.hasValidGoogleConfig() && await this.initializeGoogleAnalytics() && this.managers.event && this.integrations.google && this.managers.event.setGoogleAnalyticsIntegration(this.integrations.google), this.managers.event && await this.managers.event.flushConsentBuffer(e);
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
    const t = Ye("Global", e, "globalMetadata");
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
    const r = {
      ...this.get("config"),
      globalMetadata: e
    };
    this.set("config", r), a("debug", "Global metadata updated (replaced)", { data: { keys: Object.keys(e) } });
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
    const n = this.get("config"), i = {
      ...n.globalMetadata ?? {},
      ...e
    }, o = {
      ...n,
      globalMetadata: i
    };
    this.set("config", o), a("debug", "Global metadata updated (merged)", { data: { keys: Object.keys(e) } });
  }
  /**
   * Updates Google Consent Mode v2 categories configuration.
   *
   * Categories persist in config state for future consent operations.
   * If consent is already granted, automatically re-syncs with Google.
   *
   * @param categories - Consent categories ('all' or granular object)
   * @throws {Error} If Google integration not configured
   * @internal Called from api.setConsent()
   */
  updateGoogleConsentCategories(e) {
    const t = this.get("config");
    if (!t.integrations?.google)
      throw new Error("[TraceLog] Google integration not configured");
    const n = {
      ...t,
      integrations: {
        ...t.integrations,
        google: {
          ...t.integrations.google,
          consentCategories: e
        }
      }
    };
    this.set("config", n), a("debug", "Google Consent Mode categories updated", {
      data: { categories: e }
    }), this.managers.consent?.hasConsent("google") && this.integrations.google && (this.integrations.google.syncConsentToGoogle("google", !0), a("debug", "Re-synced Google Consent Mode with updated categories"));
  }
  /**
   * Returns the Google Analytics integration instance.
   *
   * @returns GoogleAnalyticsIntegration instance or undefined if not initialized
   * @internal Called from api.setConsent()
   */
  getGoogleAnalyticsIntegration() {
    return this.integrations.google;
  }
  hasValidGoogleConfig() {
    const e = this.get("config").integrations?.google;
    if (!e)
      return !1;
    const t = !!e.measurementId?.trim(), n = !!e.containerId?.trim();
    return t || n;
  }
  async initializeGoogleAnalytics() {
    try {
      return this.integrations.google = new ke(), await this.integrations.google.initialize(), a("debug", "Google Analytics integration initialized"), !0;
    } catch (e) {
      return a("warn", "Failed to initialize Google Analytics", { error: e }), !1;
    }
  }
  /**
   * Resolves waitForConsent requirement for a specific integration.
   * Checks waitForConsent flag in integration-specific config.
   * @param integration - The integration to check
   * @returns true if consent is required, false otherwise
   */
  getIntegrationConsentRequirement(e) {
    const t = this.get("config");
    return e === "google" ? t.integrations?.google?.waitForConsent ?? !1 : e === "custom" ? t.integrations?.custom?.waitForConsent ?? !1 : e === "tracelog" ? t.integrations?.tracelog?.waitForConsent ?? !1 : !1;
  }
  shouldInitializeIntegration(e) {
    return this.getIntegrationConsentRequirement(e) ? this.managers.consent?.hasConsent(e) ?? !0 : !0;
  }
  initializeHandlers() {
    const e = this.get("config"), t = e.disabledEvents ?? [];
    this.handlers.session = new Xt(
      this.managers.storage,
      this.managers.event
    ), this.handlers.session.startTracking();
    const n = () => {
      this.set("suppressNextScroll", !0), this.suppressNextScrollTimer && clearTimeout(this.suppressNextScrollTimer), this.suppressNextScrollTimer = window.setTimeout(() => {
        this.set("suppressNextScroll", !1);
      }, 500);
    };
    this.handlers.pageView = new Wt(this.managers.event, n), this.handlers.pageView.startTracking(), this.handlers.click = new zt(this.managers.event), this.handlers.click.startTracking(), t.includes("scroll") || (this.handlers.scroll = new jt(this.managers.event), this.handlers.scroll.startTracking()), t.includes("web_vitals") || (this.handlers.performance = new Yt(this.managers.event), this.handlers.performance.startTracking().catch((r) => {
      a("warn", "Failed to start performance tracking", { error: r });
    })), t.includes("error") || (this.handlers.error = new qt(this.managers.event), this.handlers.error.startTracking()), e.viewport && (this.handlers.viewport = new Qt(this.managers.event), this.handlers.viewport.startTracking());
  }
}
const P = [], b = [], R = [];
let h = null, N = !1, _ = !1, $ = !1;
const Zt = async (s) => {
  if (!(typeof window > "u" || typeof document > "u") && ($ = !1, _ = !1, window.__traceLogDisabled !== !0 && !h && !N)) {
    N = !0;
    try {
      const e = Dt(s ?? {}), t = new Jt();
      try {
        P.forEach(({ event: i, callback: o }) => {
          t.on(i, o);
        }), P.length = 0, b.forEach(({ hook: i, fn: o }) => {
          i === "beforeSend" ? t.setTransformer("beforeSend", o) : t.setTransformer("beforeBatch", o);
        }), b.length = 0;
        const n = t.init(e), r = new Promise((i, o) => {
          setTimeout(() => {
            o(new Error("[TraceLog] Initialization timeout after 10000ms"));
          }, 1e4);
        });
        if (await Promise.race([n, r]), h = t, R.length > 0) {
          const i = [...R];
          R.length = 0;
          for (const { integration: o, granted: l } of i)
            try {
              await _e(o, l);
            } catch (c) {
              a("warn", `Failed to apply pending consent for ${o}`, { error: c });
            }
        }
      } catch (n) {
        try {
          t.destroy(!0);
        } catch (r) {
          a("error", "Failed to cleanup partially initialized app", { error: r });
        }
        throw n;
      }
    } catch (e) {
      throw h = null, e;
    } finally {
      N = !1;
    }
  }
}, en = (s, e) => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!h)
      throw new Error("[TraceLog] TraceLog not initialized. Please call init() first.");
    if (_)
      throw new Error("[TraceLog] Cannot send events while TraceLog is being destroyed");
    h.sendCustomEvent(s, e);
  }
}, tn = (s, e) => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!h || N) {
      P.push({ event: s, callback: e });
      return;
    }
    h.on(s, e);
  }
}, nn = (s, e) => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!h) {
      const t = P.findIndex((n) => n.event === s && n.callback === e);
      t !== -1 && P.splice(t, 1);
      return;
    }
    h.off(s, e);
  }
};
function sn(s, e) {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (typeof e != "function")
      throw new Error(`[TraceLog] Transformer must be a function, received: ${typeof e}`);
    if (!h || N) {
      const t = b.findIndex((n) => n.hook === s);
      t !== -1 && b.splice(t, 1), b.push({ hook: s, fn: e });
      return;
    }
    if (_)
      throw new Error("[TraceLog] Cannot set transformers while TraceLog is being destroyed");
    s === "beforeSend" ? h.setTransformer("beforeSend", e) : h.setTransformer("beforeBatch", e);
  }
}
const rn = (s) => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!h) {
      const e = b.findIndex((t) => t.hook === s);
      e !== -1 && b.splice(e, 1);
      return;
    }
    if (_)
      throw new Error("[TraceLog] Cannot remove transformers while TraceLog is being destroyed");
    h.removeTransformer(s);
  }
}, on = () => typeof window > "u" || typeof document > "u" ? !1 : h !== null, an = () => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (_)
      throw new Error("[TraceLog] Destroy operation already in progress");
    if (!h) {
      $ = !1, _ = !1;
      return;
    }
    _ = !0;
    try {
      h.destroy(), h = null, N = !1, P.length = 0, b.length = 0, R.length = 0, $ = !1, _ = !1;
    } catch (s) {
      h = null, N = !1, P.length = 0, b.length = 0, R.length = 0, $ = !1, _ = !1, a("warn", "Error during destroy, forced cleanup completed", { error: s });
    }
  }
}, _e = async (s, e, t) => {
  if (typeof window > "u" || typeof document > "u")
    return;
  if ($ || _)
    throw new Error("[TraceLog] Cannot set consent while TraceLog is destroyed or being destroyed");
  if (t !== void 0) {
    if (s !== "google")
      a("warn", "googleConsentCategories parameter only applicable to google integration, ignoring");
    else if (!qe(t))
      throw new Error(
        '[TraceLog] Invalid googleConsentCategories. Must be "all" or an object with valid GoogleConsentType keys and boolean values'
      );
  }
  if (!h || N) {
    if (s === "all") {
      const i = R.findIndex((o) => o.integration === s);
      i !== -1 && R.splice(i, 1), R.push({ integration: s, granted: e });
      try {
        const { CONSENT_KEY: o, CONSENT_EXPIRY_DAYS: l } = await Promise.resolve().then(() => Le), c = Date.now(), u = c + l * 24 * 60 * 60 * 1e3, f = {
          state: {
            google: e,
            custom: e,
            tracelog: e
          },
          timestamp: c,
          expiresAt: u
        };
        localStorage.setItem(o, JSON.stringify(f));
      } catch (o) {
        if (o instanceof DOMException && o.name === "QuotaExceededError") {
          a("warn", "localStorage quota exceeded, consent not persisted", { error: o });
          return;
        }
        throw a("error", "Failed to persist consent for all integrations before init", { error: o }), new Error(
          `[TraceLog] Failed to persist consent to localStorage: ${o instanceof Error ? o.message : String(o)}`
        );
      }
      return;
    }
    try {
      const { CONSENT_KEY: i, CONSENT_EXPIRY_DAYS: o } = await Promise.resolve().then(() => Le), l = Date.now(), c = l + o * 24 * 60 * 60 * 1e3, u = localStorage.getItem(i);
      let f = {
        google: !1,
        custom: !1,
        tracelog: !1
      };
      if (u !== null && u.trim() !== "")
        try {
          const E = JSON.parse(u);
          E.state && (f = {
            google: !!E.state.google,
            custom: !!E.state.custom,
            tracelog: !!E.state.tracelog
          });
        } catch {
        }
      const m = {
        state: {
          ...f,
          [s]: e
        },
        timestamp: l,
        expiresAt: c
      };
      localStorage.setItem(i, JSON.stringify(m));
    } catch (i) {
      if (i instanceof DOMException && i.name === "QuotaExceededError") {
        a("warn", "localStorage quota exceeded, consent not persisted", { error: i });
        return;
      }
      throw a("error", "Failed to persist consent before init", { error: i }), new Error(
        `[TraceLog] Failed to persist consent to localStorage: ${i instanceof Error ? i.message : String(i)}`
      );
    }
    return;
  }
  const n = h.getConsentManager();
  if (!n) {
    a("warn", "Consent manager not available");
    return;
  }
  if (s === "all") {
    const i = h.getConfig(), o = h.getCollectApiUrls(), l = [];
    i.integrations?.google && l.push("google"), o?.custom && l.push("custom"), o?.saas && l.push("tracelog");
    for (const c of l)
      await _e(c, e);
    return;
  }
  if (s === "google" && t !== void 0)
    try {
      h.updateGoogleConsentCategories(t), n.setGoogleConsentCategories(t);
    } catch (i) {
      a("warn", "Failed to update Google consent categories", { error: i });
    }
  const r = n.hasConsent(s);
  if (n.setConsent(s, e), e && !r && await h.handleConsentGranted(s), !e && r) {
    a("info", `Consent revoked for ${s}`);
    const i = h.getEventManager();
    i && i.clearConsentBufferForIntegration(s);
  }
}, ln = (s) => {
  if (typeof window > "u" || typeof document > "u")
    return !1;
  if (!h) {
    if (s === "all") {
      const n = de();
      return n === null ? !1 : n.google === !0 && n.custom === !0 && n.tracelog === !0;
    }
    const t = de();
    return t === null ? !1 : t[s] === !0;
  }
  const e = h.getConsentManager();
  return e === void 0 ? !1 : e.hasConsent(s);
}, cn = () => {
  if (typeof window > "u" || typeof document > "u")
    return { google: !1, custom: !1, tracelog: !1 };
  if (!h)
    return de() ?? { google: !1, custom: !1, tracelog: !1 };
  const s = h.getConsentManager();
  return s ? s.getConsentState() : { google: !1, custom: !1, tracelog: !1 };
}, un = (s) => {
  typeof window > "u" || typeof document > "u" || Ct(s);
}, dn = (s) => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!h)
      throw new Error("[TraceLog] TraceLog not initialized. Please call init() first.");
    if (_)
      throw new Error("[TraceLog] Cannot update metadata while TraceLog is being destroyed");
    h.updateGlobalMetadata(s);
  }
}, fn = (s) => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!h)
      throw new Error("[TraceLog] TraceLog not initialized. Please call init() first.");
    if (_)
      throw new Error("[TraceLog] Cannot update metadata while TraceLog is being destroyed");
    h.mergeGlobalMetadata(s);
  }
}, Bn = {
  init: Zt,
  event: en,
  on: tn,
  off: nn,
  setTransformer: sn,
  removeTransformer: rn,
  isInitialized: on,
  destroy: an,
  setQaMode: un,
  setConsent: _e,
  hasConsent: ln,
  getConsentState: cn,
  updateGlobalMetadata: dn,
  mergeGlobalMetadata: fn
};
var ge, et = -1, B = function(s) {
  addEventListener("pageshow", (function(e) {
    e.persisted && (et = e.timeStamp, s(e));
  }), !0);
}, ve = function() {
  var s = self.performance && performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
  if (s && s.responseStart > 0 && s.responseStart < performance.now()) return s;
}, q = function() {
  var s = ve();
  return s && s.activationStart || 0;
}, C = function(s, e) {
  var t = ve(), n = "navigate";
  return et >= 0 ? n = "back-forward-cache" : t && (document.prerendering || q() > 0 ? n = "prerender" : document.wasDiscarded ? n = "restore" : t.type && (n = t.type.replace(/_/g, "-"))), { name: s, value: e === void 0 ? -1 : e, rating: "good", delta: 0, entries: [], id: "v4-".concat(Date.now(), "-").concat(Math.floor(8999999999999 * Math.random()) + 1e12), navigationType: n };
}, X = function(s, e, t) {
  try {
    if (PerformanceObserver.supportedEntryTypes.includes(s)) {
      var n = new PerformanceObserver((function(r) {
        Promise.resolve().then((function() {
          e(r.getEntries());
        }));
      }));
      return n.observe(Object.assign({ type: s, buffered: !0 }, t || {})), n;
    }
  } catch {
  }
}, A = function(s, e, t, n) {
  var r, i;
  return function(o) {
    e.value >= 0 && (o || n) && ((i = e.value - (r || 0)) || r === void 0) && (r = e.value, e.delta = i, e.rating = (function(l, c) {
      return l > c[1] ? "poor" : l > c[0] ? "needs-improvement" : "good";
    })(e.value, t), s(e));
  };
}, Ie = function(s) {
  requestAnimationFrame((function() {
    return requestAnimationFrame((function() {
      return s();
    }));
  }));
}, J = function(s) {
  document.addEventListener("visibilitychange", (function() {
    document.visibilityState === "hidden" && s();
  }));
}, we = function(s) {
  var e = !1;
  return function() {
    e || (s(), e = !0);
  };
}, k = -1, xe = function() {
  return document.visibilityState !== "hidden" || document.prerendering ? 1 / 0 : 0;
}, Y = function(s) {
  document.visibilityState === "hidden" && k > -1 && (k = s.type === "visibilitychange" ? s.timeStamp : 0, hn());
}, Ue = function() {
  addEventListener("visibilitychange", Y, !0), addEventListener("prerenderingchange", Y, !0);
}, hn = function() {
  removeEventListener("visibilitychange", Y, !0), removeEventListener("prerenderingchange", Y, !0);
}, tt = function() {
  return k < 0 && (k = xe(), Ue(), B((function() {
    setTimeout((function() {
      k = xe(), Ue();
    }), 0);
  }))), { get firstHiddenTime() {
    return k;
  } };
}, Z = function(s) {
  document.prerendering ? addEventListener("prerenderingchange", (function() {
    return s();
  }), !0) : s();
}, me = [1800, 3e3], nt = function(s, e) {
  e = e || {}, Z((function() {
    var t, n = tt(), r = C("FCP"), i = X("paint", (function(o) {
      o.forEach((function(l) {
        l.name === "first-contentful-paint" && (i.disconnect(), l.startTime < n.firstHiddenTime && (r.value = Math.max(l.startTime - q(), 0), r.entries.push(l), t(!0)));
      }));
    }));
    i && (t = A(s, r, me, e.reportAllChanges), B((function(o) {
      r = C("FCP"), t = A(s, r, me, e.reportAllChanges), Ie((function() {
        r.value = performance.now() - o.timeStamp, t(!0);
      }));
    })));
  }));
}, Ee = [0.1, 0.25], gn = function(s, e) {
  e = e || {}, nt(we((function() {
    var t, n = C("CLS", 0), r = 0, i = [], o = function(c) {
      c.forEach((function(u) {
        if (!u.hadRecentInput) {
          var f = i[0], m = i[i.length - 1];
          r && u.startTime - m.startTime < 1e3 && u.startTime - f.startTime < 5e3 ? (r += u.value, i.push(u)) : (r = u.value, i = [u]);
        }
      })), r > n.value && (n.value = r, n.entries = i, t());
    }, l = X("layout-shift", o);
    l && (t = A(s, n, Ee, e.reportAllChanges), J((function() {
      o(l.takeRecords()), t(!0);
    })), B((function() {
      r = 0, n = C("CLS", 0), t = A(s, n, Ee, e.reportAllChanges), Ie((function() {
        return t();
      }));
    })), setTimeout(t, 0));
  })));
}, st = 0, ne = 1 / 0, z = 0, mn = function(s) {
  s.forEach((function(e) {
    e.interactionId && (ne = Math.min(ne, e.interactionId), z = Math.max(z, e.interactionId), st = z ? (z - ne) / 7 + 1 : 0);
  }));
}, rt = function() {
  return ge ? st : performance.interactionCount || 0;
}, En = function() {
  "interactionCount" in performance || ge || (ge = X("event", mn, { type: "event", buffered: !0, durationThreshold: 0 }));
}, w = [], K = /* @__PURE__ */ new Map(), it = 0, pn = function() {
  var s = Math.min(w.length - 1, Math.floor((rt() - it) / 50));
  return w[s];
}, Sn = [], Tn = function(s) {
  if (Sn.forEach((function(r) {
    return r(s);
  })), s.interactionId || s.entryType === "first-input") {
    var e = w[w.length - 1], t = K.get(s.interactionId);
    if (t || w.length < 10 || s.duration > e.latency) {
      if (t) s.duration > t.latency ? (t.entries = [s], t.latency = s.duration) : s.duration === t.latency && s.startTime === t.entries[0].startTime && t.entries.push(s);
      else {
        var n = { id: s.interactionId, latency: s.duration, entries: [s] };
        K.set(n.id, n), w.push(n);
      }
      w.sort((function(r, i) {
        return i.latency - r.latency;
      })), w.length > 10 && w.splice(10).forEach((function(r) {
        return K.delete(r.id);
      }));
    }
  }
}, ot = function(s) {
  var e = self.requestIdleCallback || self.setTimeout, t = -1;
  return s = we(s), document.visibilityState === "hidden" ? s() : (t = e(s), J(s)), t;
}, pe = [200, 500], _n = function(s, e) {
  "PerformanceEventTiming" in self && "interactionId" in PerformanceEventTiming.prototype && (e = e || {}, Z((function() {
    var t;
    En();
    var n, r = C("INP"), i = function(l) {
      ot((function() {
        l.forEach(Tn);
        var c = pn();
        c && c.latency !== r.value && (r.value = c.latency, r.entries = c.entries, n());
      }));
    }, o = X("event", i, { durationThreshold: (t = e.durationThreshold) !== null && t !== void 0 ? t : 40 });
    n = A(s, r, pe, e.reportAllChanges), o && (o.observe({ type: "first-input", buffered: !0 }), J((function() {
      i(o.takeRecords()), n(!0);
    })), B((function() {
      it = rt(), w.length = 0, K.clear(), r = C("INP"), n = A(s, r, pe, e.reportAllChanges);
    })));
  })));
}, Se = [2500, 4e3], se = {}, vn = function(s, e) {
  e = e || {}, Z((function() {
    var t, n = tt(), r = C("LCP"), i = function(c) {
      e.reportAllChanges || (c = c.slice(-1)), c.forEach((function(u) {
        u.startTime < n.firstHiddenTime && (r.value = Math.max(u.startTime - q(), 0), r.entries = [u], t());
      }));
    }, o = X("largest-contentful-paint", i);
    if (o) {
      t = A(s, r, Se, e.reportAllChanges);
      var l = we((function() {
        se[r.id] || (i(o.takeRecords()), o.disconnect(), se[r.id] = !0, t(!0));
      }));
      ["keydown", "click"].forEach((function(c) {
        addEventListener(c, (function() {
          return ot(l);
        }), { once: !0, capture: !0 });
      })), J(l), B((function(c) {
        r = C("LCP"), t = A(s, r, Se, e.reportAllChanges), Ie((function() {
          r.value = performance.now() - c.timeStamp, se[r.id] = !0, t(!0);
        }));
      }));
    }
  }));
}, Te = [800, 1800], In = function s(e) {
  document.prerendering ? Z((function() {
    return s(e);
  })) : document.readyState !== "complete" ? addEventListener("load", (function() {
    return s(e);
  }), !0) : setTimeout(e, 0);
}, wn = function(s, e) {
  e = e || {};
  var t = C("TTFB"), n = A(s, t, Te, e.reportAllChanges);
  In((function() {
    var r = ve();
    r && (t.value = Math.max(r.responseStart - q(), 0), t.entries = [r], n(!0), B((function() {
      t = C("TTFB", 0), (n = A(s, t, Te, e.reportAllChanges))(!0);
    })));
  }));
};
const yn = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  CLSThresholds: Ee,
  FCPThresholds: me,
  INPThresholds: pe,
  LCPThresholds: Se,
  TTFBThresholds: Te,
  onCLS: gn,
  onFCP: nt,
  onINP: _n,
  onLCP: vn,
  onTTFB: wn
}, Symbol.toStringTag, { value: "Module" }));
export {
  g as AppConfigValidationError,
  Cn as DEFAULT_SESSION_TIMEOUT,
  ue as DEFAULT_WEB_VITALS_MODE,
  L as DeviceType,
  O as EmitterEvent,
  H as ErrorType,
  d as EventType,
  xn as InitializationTimeoutError,
  S as IntegrationValidationError,
  Dn as MAX_ARRAY_LENGTH,
  Ln as MAX_CUSTOM_EVENT_ARRAY_SIZE,
  Mn as MAX_CUSTOM_EVENT_KEYS,
  An as MAX_CUSTOM_EVENT_NAME_LENGTH,
  bn as MAX_CUSTOM_EVENT_STRING_SIZE,
  Nn as MAX_METADATA_NESTING_DEPTH,
  Rn as MAX_NESTED_OBJECT_KEYS,
  On as MAX_STRING_LENGTH,
  Pn as MAX_STRING_LENGTH_IN_ARRAY,
  x as Mode,
  $e as PII_PATTERNS,
  D as PermanentError,
  ye as SamplingRateValidationError,
  j as ScrollDirection,
  ht as SessionTimeoutValidationError,
  F as SpecialApiUrl,
  G as TraceLogValidationError,
  Un as WEB_VITALS_GOOD_THRESHOLDS,
  Re as WEB_VITALS_NEEDS_IMPROVEMENT_THRESHOLDS,
  vt as WEB_VITALS_POOR_THRESHOLDS,
  Ne as getWebVitalsThresholds,
  Vn as isPrimaryScrollEvent,
  kn as isSecondaryScrollEvent,
  Bn as tracelog
};
