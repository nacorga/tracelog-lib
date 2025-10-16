const nr = 9e5;
const ir = 120, or = 8192, ar = 10, lr = 10, cr = 20, ur = 1;
const dr = 1e3, hr = 500, fr = 100;
const w = "data-tlog", Xe = [
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
], ze = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"], je = [
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
}, Qe = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<embed\b[^>]*>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi
];
var Z = /* @__PURE__ */ ((s) => (s.Localhost = "localhost:8080", s.Fail = "localhost:9999", s))(Z || {}), A = /* @__PURE__ */ ((s) => (s.Mobile = "mobile", s.Tablet = "tablet", s.Desktop = "desktop", s.Unknown = "unknown", s))(A || {}), J = /* @__PURE__ */ ((s) => (s.EVENT = "event", s.QUEUE = "queue", s))(J || {});
class b extends Error {
  constructor(e, t) {
    super(e), this.statusCode = t, this.name = "PermanentError", Error.captureStackTrace && Error.captureStackTrace(this, b);
  }
}
var u = /* @__PURE__ */ ((s) => (s.PAGE_VIEW = "page_view", s.CLICK = "click", s.SCROLL = "scroll", s.SESSION_START = "session_start", s.SESSION_END = "session_end", s.CUSTOM = "custom", s.WEB_VITALS = "web_vitals", s.ERROR = "error", s.VIEWPORT_VISIBLE = "viewport_visible", s))(u || {}), x = /* @__PURE__ */ ((s) => (s.UP = "up", s.DOWN = "down", s))(x || {}), P = /* @__PURE__ */ ((s) => (s.JS_ERROR = "js_error", s.PROMISE_REJECTION = "promise_rejection", s))(P || {}), V = /* @__PURE__ */ ((s) => (s.QA = "qa", s))(V || {});
const Er = (s) => s.type === u.SCROLL && "scroll_data" in s && s.scroll_data.is_primary === !0, gr = (s) => s.type === u.SCROLL && "scroll_data" in s && s.scroll_data.is_primary === !1;
class k extends Error {
  constructor(e, t, r) {
    super(e), this.errorCode = t, this.layer = r, this.name = this.constructor.name, Error.captureStackTrace && Error.captureStackTrace(this, this.constructor);
  }
}
class h extends k {
  constructor(e, t = "config") {
    super(e, "APP_CONFIG_INVALID", t);
  }
}
class Ke extends k {
  constructor(e, t = "config") {
    super(e, "SESSION_TIMEOUT_INVALID", t);
  }
}
class Ee extends k {
  constructor(e, t = "config") {
    super(e, "SAMPLING_RATE_INVALID", t);
  }
}
class M extends k {
  constructor(e, t = "config") {
    super(e, "INTEGRATION_INVALID", t);
  }
}
class mr extends k {
  constructor(e, t, r = "runtime") {
    super(e, "INITIALIZATION_TIMEOUT", r), this.timeoutMs = t;
  }
}
const Ye = (s, e) => {
  if (e) {
    if (e instanceof Error) {
      const t = e.message.replace(/\s+at\s+.*$/gm, "").replace(/\(.*?:\d+:\d+\)/g, "");
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
  const { error: r, data: n, showToClient: i = !1, style: o } = t ?? {}, l = r ? Ye(e, r) : `[TraceLog] ${e}`, c = s === "error" ? "error" : s === "warn" ? "warn" : "log";
  if (s === "debug" || s === "info" && !i)
    return;
  const d = o !== void 0 && o !== "", E = d ? `%c${l}` : l;
  if (n !== void 0) {
    const g = ee(n);
    d ? console[c](E, o, g) : console[c](E, g);
  } else
    d ? console[c](E, o) : console[c](E);
}, ee = (s) => {
  const e = {}, t = ["token", "password", "secret", "key", "apikey", "api_key", "sessionid", "session_id"];
  for (const [r, n] of Object.entries(s)) {
    const i = r.toLowerCase();
    if (t.some((o) => i.includes(o))) {
      e[r] = "[REDACTED]";
      continue;
    }
    n !== null && typeof n == "object" && !Array.isArray(n) ? e[r] = ee(n) : Array.isArray(n) ? e[r] = n.map(
      (o) => o !== null && typeof o == "object" && !Array.isArray(o) ? ee(o) : o
    ) : e[r] = n;
  }
  return e;
};
let te, Re;
const qe = () => {
  typeof window < "u" && !te && (te = window.matchMedia("(pointer: coarse)"), Re = window.matchMedia("(hover: none)"));
}, Ze = () => {
  try {
    const s = navigator;
    if (s.userAgentData && typeof s.userAgentData.mobile == "boolean")
      return s.userAgentData.platform && /ipad|tablet/i.test(s.userAgentData.platform) ? A.Tablet : s.userAgentData.mobile ? A.Mobile : A.Desktop;
    qe();
    const e = window.innerWidth, t = te?.matches ?? !1, r = Re?.matches ?? !1, n = "ontouchstart" in window || navigator.maxTouchPoints > 0, i = navigator.userAgent.toLowerCase(), o = /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/.test(i), l = /tablet|ipad|android(?!.*mobile)/.test(i);
    return e <= 767 || o && n ? A.Mobile : e >= 768 && e <= 1024 || l || t && r && n ? A.Tablet : A.Desktop;
  } catch (s) {
    return a("warn", "Device detection failed, defaulting to desktop", { error: s }), A.Desktop;
  }
}, Ce = "background: #ff9800; color: white; font-weight: bold; padding: 2px 8px; border-radius: 3px;", Oe = "background: #9e9e9e; color: white; font-weight: bold; padding: 2px 8px; border-radius: 3px;", ge = ["scroll", "web_vitals", "error"], Pe = [
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
], me = 500, Se = 5e3, F = 50, Je = F * 2, De = 1, et = 1e3, tt = 10, Te = 5e3, rt = 6e4, L = "tlog", D = `${L}:qa_mode`, st = `${L}:uid`, pe = "tlog_mode", _e = "qa", Ie = "qa_off", nt = (s) => s ? `${L}:${s}:queue` : `${L}:queue`, it = (s) => s ? `${L}:${s}:session` : `${L}:session`, ot = (s) => s ? `${L}:${s}:broadcast` : `${L}:broadcast`, Sr = {
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
}, ve = {
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
}, at = {
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
}, re = "needs-improvement", we = (s = re) => {
  switch (s) {
    case "all":
      return { LCP: 0, FCP: 0, CLS: 0, INP: 0, TTFB: 0, LONG_TASK: 0 };
    // Track everything
    case "needs-improvement":
      return ve;
    case "poor":
      return at;
    default:
      return ve;
  }
}, lt = 1e3, ct = 50, ut = () => {
  if (typeof window > "u" || typeof document > "u")
    return !1;
  try {
    const s = new URLSearchParams(window.location.search), e = s.get(pe), t = sessionStorage.getItem(D);
    let r = null;
    if (e === _e ? (r = !0, sessionStorage.setItem(D, "true"), a("info", "QA Mode ACTIVE", {
      showToClient: !0,
      style: Ce
    })) : e === Ie && (r = !1, sessionStorage.removeItem(D), a("info", "QA Mode DISABLED", {
      showToClient: !0,
      style: Oe
    })), e === _e || e === Ie)
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
}, dt = (s) => {
  if (!(typeof window > "u" || typeof document > "u"))
    try {
      s ? (sessionStorage.setItem(D, "true"), a("info", "QA Mode ENABLED", {
        showToClient: !0,
        style: Ce
      })) : (sessionStorage.removeItem(D), a("info", "QA Mode DISABLED", {
        showToClient: !0,
        style: Oe
      }));
    } catch {
      a("warn", "Cannot set QA mode: sessionStorage unavailable");
    }
}, ye = () => {
  const s = new URLSearchParams(window.location.search), e = {};
  return ze.forEach((r) => {
    const n = s.get(r);
    if (n) {
      const i = r.split("utm_")[1];
      e[i] = n;
    }
  }), Object.keys(e).length ? e : void 0;
}, ht = () => typeof crypto < "u" && crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (s) => {
  const e = Math.random() * 16 | 0;
  return (s === "x" ? e : e & 3 | 8).toString(16);
}), ft = () => {
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
}, Ae = (s, e = !1) => {
  try {
    const t = new URL(s), r = t.protocol === "https:", n = t.protocol === "http:";
    return r || e && n;
  } catch {
    return !1;
  }
}, Et = (s) => {
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
      if (!Ae(l))
        throw new Error("Invalid URL");
      return l;
    } catch (t) {
      throw new Error(`Invalid URL configuration: ${t instanceof Error ? t.message : String(t)}`);
    }
  const e = s.integrations?.custom?.collectApiUrl;
  if (e) {
    const t = s.integrations?.custom?.allowHttp ?? !1;
    if (!Ae(e, t))
      throw new Error("Invalid URL");
    return e;
  }
  return "";
}, se = (s, e = []) => {
  if (!s || typeof s != "string")
    return a("warn", "Invalid URL provided to normalizeUrl", { data: { url: String(s) } }), s || "";
  try {
    const t = new URL(s), r = t.searchParams, n = [.../* @__PURE__ */ new Set([...je, ...e])];
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
  for (const n of Qe) {
    const i = e;
    e = e.replace(n, ""), i !== e && t++;
  }
  return t > 0 && a("warn", "XSS patterns detected and removed", {
    data: {
      patternMatches: t,
      originalValue: s.slice(0, 100)
    }
  }), e = e.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#x27;").replaceAll("/", "&#x2F;"), e.trim();
}, ne = (s, e = 0) => {
  if (e > 3 || s == null)
    return null;
  if (typeof s == "string")
    return Le(s);
  if (typeof s == "number")
    return !Number.isFinite(s) || s < -Number.MAX_SAFE_INTEGER || s > Number.MAX_SAFE_INTEGER ? 0 : s;
  if (typeof s == "boolean")
    return s;
  if (Array.isArray(s))
    return s.slice(0, 100).map((n) => ne(n, e + 1)).filter((n) => n !== null);
  if (typeof s == "object") {
    const t = {}, n = Object.entries(s).slice(0, 20);
    for (const [i, o] of n) {
      const l = Le(i);
      if (l) {
        const c = ne(o, e + 1);
        c !== null && (t[l] = c);
      }
    }
    return t;
  }
  return null;
}, gt = (s) => {
  if (typeof s != "object" || s === null)
    return {};
  try {
    const e = ne(s);
    return typeof e == "object" && e !== null ? e : {};
  } catch (e) {
    const t = e instanceof Error ? e.message : String(e);
    throw new Error(`[TraceLog] Metadata sanitization failed: ${t}`);
  }
}, mt = (s) => {
  if (s !== void 0 && (s === null || typeof s != "object"))
    throw new h("Configuration must be an object", "config");
  if (s) {
    if (s.sessionTimeout !== void 0 && (typeof s.sessionTimeout != "number" || s.sessionTimeout < 3e4 || s.sessionTimeout > 864e5))
      throw new Ke(f.INVALID_SESSION_TIMEOUT, "config");
    if (s.globalMetadata !== void 0 && (typeof s.globalMetadata != "object" || s.globalMetadata === null))
      throw new h(f.INVALID_GLOBAL_METADATA, "config");
    if (s.integrations && Tt(s.integrations), s.sensitiveQueryParams !== void 0) {
      if (!Array.isArray(s.sensitiveQueryParams))
        throw new h(f.INVALID_SENSITIVE_QUERY_PARAMS, "config");
      for (const e of s.sensitiveQueryParams)
        if (typeof e != "string")
          throw new h("All sensitive query params must be strings", "config");
    }
    if (s.errorSampling !== void 0 && (typeof s.errorSampling != "number" || s.errorSampling < 0 || s.errorSampling > 1))
      throw new Ee(f.INVALID_ERROR_SAMPLING_RATE, "config");
    if (s.samplingRate !== void 0 && (typeof s.samplingRate != "number" || s.samplingRate < 0 || s.samplingRate > 1))
      throw new Ee(f.INVALID_SAMPLING_RATE, "config");
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
    if (s.viewport !== void 0 && St(s.viewport), s.disabledEvents !== void 0) {
      if (!Array.isArray(s.disabledEvents))
        throw new h("disabledEvents must be an array", "config");
      const e = /* @__PURE__ */ new Set();
      for (const t of s.disabledEvents) {
        if (typeof t != "string")
          throw new h("All disabled event types must be strings", "config");
        if (!ge.includes(t))
          throw new h(
            `Invalid disabled event type: "${t}". Must be one of: ${ge.join(", ")}`,
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
}, St = (s) => {
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
}, Tt = (s) => {
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
}, pt = (s) => {
  mt(s);
  const e = {
    ...s ?? {},
    sessionTimeout: s?.sessionTimeout ?? 9e5,
    globalMetadata: s?.globalMetadata ?? {},
    sensitiveQueryParams: s?.sensitiveQueryParams ?? [],
    errorSampling: s?.errorSampling ?? De,
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
}, _t = (s) => {
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
}, Ve = (s, e = 0) => {
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
        } else if (!t.every((o) => _t(o)))
          return !1;
        continue;
      }
      if (r === "object" && e === 0) {
        if (!Ve(t, e + 1))
          return !1;
        continue;
      }
      return !1;
    }
  }
  return !0;
}, It = (s) => typeof s != "string" ? {
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
} : { valid: !0 }, Me = (s, e, t) => {
  const r = gt(e), n = `${t} "${s}" metadata error`;
  if (!Ve(r))
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
}, vt = (s, e, t) => {
  if (Array.isArray(e)) {
    const r = [], n = `${t} "${s}" metadata error`;
    for (let i = 0; i < e.length; i++) {
      const o = e[i];
      if (typeof o != "object" || o === null || Array.isArray(o))
        return {
          valid: !1,
          error: `${n}: array item at index ${i} must be an object.`
        };
      const l = Me(s, o, t);
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
  return Me(s, e, t);
}, wt = (s, e) => {
  const t = It(s);
  if (!t.valid)
    return a("error", "Event name validation failed", {
      showToClient: !0,
      data: { eventName: s, error: t.error }
    }), t;
  if (!e)
    return { valid: !0 };
  const r = vt(s, e, "customEvent");
  return r.valid || a("error", "Event metadata validation failed", {
    showToClient: !0,
    data: {
      eventName: s,
      error: r.error
    }
  }), r;
};
class yt {
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
const K = {};
class T {
  get(e) {
    return K[e];
  }
  set(e, t) {
    K[e] = t;
  }
  getState() {
    return { ...K };
  }
}
class At extends T {
  storeManager;
  lastPermanentErrorLog = null;
  recoveryInProgress = !1;
  constructor(e) {
    super(), this.storeManager = e;
  }
  getQueueStorageKey() {
    const e = this.get("userId") || "anonymous";
    return nt(e);
  }
  sendEventsQueueSync(e) {
    return this.shouldSkipSend() ? !0 : this.get("config")?.integrations?.custom?.collectApiUrl === Z.Fail ? (a("warn", "Fail mode: simulating network failure (sync)", {
      data: { events: e.events.length }
    }), !1) : this.sendQueueSyncInternal(e);
  }
  async sendEventsQueue(e, t) {
    try {
      const r = await this.send(e);
      return r ? (this.clearPersistedEvents(), t?.onSuccess?.(e.events.length, e.events, e)) : (this.persistEvents(e), t?.onFailure?.()), r;
    } catch (r) {
      return r instanceof b ? (this.logPermanentError("Permanent error, not retrying", r), this.clearPersistedEvents(), t?.onFailure?.(), !1) : (this.persistEvents(e), t?.onFailure?.(), !1);
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
      if (t instanceof b) {
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
    if (this.get("config")?.integrations?.custom?.collectApiUrl === Z.Fail)
      return a("warn", "Fail mode: simulating network failure", {
        data: { events: e.events.length }
      }), !1;
    const { url: r, payload: n } = this.prepareRequest(e);
    try {
      return (await this.sendWithTimeout(r, n)).ok;
    } catch (i) {
      if (i instanceof b)
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
        throw i.status >= 400 && i.status < 500 ? new b(`HTTP ${i.status}: ${i.statusText}`, i.status) : new Error(`HTTP ${i.status}: ${i.statusText}`);
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
    (!this.lastPermanentErrorLog || this.lastPermanentErrorLog.statusCode !== t.statusCode || r - this.lastPermanentErrorLog.timestamp >= rt) && (a("error", e, {
      data: { status: t.statusCode, message: t.message }
    }), this.lastPermanentErrorLog = { statusCode: t.statusCode, timestamp: r });
  }
}
class Lt extends T {
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
    super(), this.googleAnalytics = t, this.dataSender = new At(e), this.emitter = r;
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
    viewport_data: E
  }) {
    if (!e) {
      a("error", "Event type is required - event will be ignored");
      return;
    }
    const g = this.get("sessionId");
    if (!g) {
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
        viewport_data: E
      });
      return;
    }
    this.lastSessionId !== g && (this.lastSessionId = g, this.sessionEventCounts = {
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
    const S = e;
    if (!v) {
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
      const y = this.getTypeLimitForEvent(S);
      if (y) {
        const Q = this.sessionEventCounts[S];
        if (Q !== void 0 && Q >= y) {
          a("warn", "Session event type limit reached", {
            data: {
              type: S,
              count: Q,
              limit: y
            }
          });
          return;
        }
      }
    }
    if (S === u.CUSTOM && o?.name) {
      const y = this.get("config")?.maxSameEventPerMinute ?? 60;
      if (!this.checkPerEventRateLimit(o.name, y))
        return;
    }
    const $e = S === u.SESSION_START, Be = t || this.get("pageUrl"), j = this.buildEventPayload({
      type: S,
      page_url: Be,
      from_page_url: r,
      scroll_data: n,
      click_data: i,
      custom_event: o,
      web_vitals: l,
      error_data: c,
      session_end_reason: d,
      viewport_data: E
    });
    if (!(!v && !this.shouldSample())) {
      if ($e) {
        const y = this.get("sessionId");
        if (!y) {
          a("error", "Session start event requires sessionId - event will be ignored");
          return;
        }
        if (this.get("hasStartSession")) {
          a("warn", "Duplicate session_start detected", {
            data: { sessionId: y }
          });
          return;
        }
        this.set("hasStartSession", !0);
      }
      if (!this.isDuplicateEvent(j)) {
        if (this.get("mode") === V.QA && S === u.CUSTOM && o) {
          a("info", "Event", {
            showToClient: !0,
            data: {
              name: o.name,
              ...o.metadata && { metadata: o.metadata }
            }
          }), this.emitEvent(j);
          return;
        }
        this.addToQueue(j), v || (this.sessionEventCounts.total++, this.sessionEventCounts[S] !== void 0 && this.sessionEventCounts[S]++);
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
      id: ft(),
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
      ...t && ye() && { utm: ye() }
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
      if (this.get("mode") === V.QA)
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
    this.emitter && this.emitter.emit(J.EVENT, e);
  }
  emitEventsQueue(e) {
    this.emitter && this.emitter.emit(J.QUEUE, e);
  }
}
class Mt {
  /**
   * Gets or creates a unique user ID for the given project.
   * The user ID is persisted in localStorage and reused across sessions.
   *
   * @param storageManager - Storage manager instance
   * @param projectId - Project identifier for namespacing
   * @returns Persistent unique user ID
   */
  static getId(e) {
    const t = st, r = e.getItem(t);
    if (r)
      return r;
    const n = ht();
    return e.setItem(t, n), n;
  }
}
class Nt extends T {
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
    this.broadcastChannel = new BroadcastChannel(ot(e)), this.broadcastChannel.onmessage = (t) => {
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
    return it(this.getProjectId());
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
class bt extends T {
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
      this.sessionManager = new Nt(this.storageManager, this.eventManager, t), this.sessionManager.startTracking(), this.eventManager.flushPendingEvents();
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
class Rt extends T {
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
    const e = window.location.href, t = se(e, this.get("config").sensitiveQueryParams);
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
    const e = se(window.location.href, this.get("config").sensitiveQueryParams), t = this.extractPageViewData();
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
class Ct extends T {
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
        const E = this.extractTrackingData(o);
        if (E) {
          const g = this.createCustomEventData(E);
          this.eventManager.track({
            type: u.CUSTOM,
            custom_event: {
              name: g.name,
              ...g.value && { metadata: { value: g.value } }
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
    for (const t of Xe)
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
    for (const r of Pe) {
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
class Ot extends T {
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
      lastDirection: x.DOWN,
      lastEventTime: 0,
      firstScrollEventTime: null,
      maxDepthReached: i,
      debounceTimer: null,
      listener: null
    }, c = () => {
      this.get("suppressNextScroll") || (l.firstScrollEventTime === null && (l.firstScrollEventTime = Date.now()), this.clearContainerTimer(l), l.debounceTimer = window.setTimeout(() => {
        const d = this.calculateScrollData(l);
        if (d) {
          const E = Date.now();
          this.processScrollEvent(l, d, E);
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
    return e > t ? x.DOWN : x.UP;
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
    const c = this.getViewportHeight(t), d = this.getScrollHeight(t), E = this.getScrollDirection(i, r), g = this.calculateScrollDepth(i, d, c);
    let v;
    n > 0 ? v = o - n : e.firstScrollEventTime !== null ? v = o - e.firstScrollEventTime : v = 250;
    const S = Math.round(l / v * 1e3);
    return g > e.maxDepthReached && (e.maxDepthReached = g), e.lastScrollPos = i, {
      depth: g,
      direction: E,
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
class Pt extends T {
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
class Dt extends T {
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
class Vt {
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
class kt extends T {
  eventManager;
  reportedByNav = /* @__PURE__ */ new Map();
  navigationHistory = [];
  // FIFO queue for tracking navigation order
  observers = [];
  vitalThresholds;
  lastLongTaskSentAt = 0;
  constructor(e) {
    super(), this.eventManager = e, this.vitalThresholds = we(re);
  }
  async startTracking() {
    const e = this.get("config"), t = e?.webVitalsMode ?? re;
    this.vitalThresholds = we(t), e?.webVitalsThresholds && (this.vitalThresholds = { ...this.vitalThresholds, ...e.webVitalsThresholds }), await this.initWebVitals(), this.observeLongTasks();
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
      const { onLCP: e, onCLS: t, onFCP: r, onTTFB: n, onINP: i } = await Promise.resolve().then(() => sr), o = (l) => (c) => {
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
          i - this.lastLongTaskSentAt >= lt && (this.shouldSendVital("LONG_TASK", n) && this.trackWebVital("LONG_TASK", n), this.lastLongTaskSentAt = i);
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
      else if (this.reportedByNav.set(t, /* @__PURE__ */ new Set([e.type])), this.navigationHistory.push(t), this.navigationHistory.length > ct) {
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
class Ut extends T {
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
    if (e - this.burstWindowStart > et && (this.errorBurstCounter = 0, this.burstWindowStart = e), this.errorBurstCounter++, this.errorBurstCounter > tt)
      return this.burstBackoffUntil = e + Te, a("warn", "Error burst detected - entering cooldown", {
        data: {
          errorsInWindow: this.errorBurstCounter,
          cooldownMs: Te
        }
      }), !1;
    const r = this.get("config")?.errorSampling ?? De;
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
    let t = e.length > me ? e.slice(0, me) + "..." : e;
    for (const r of Pe) {
      const n = new RegExp(r.source, r.flags);
      t = t.replace(n, "[REDACTED]");
    }
    return t;
  }
  shouldSuppressError(e, t) {
    const r = Date.now(), n = `${e}:${t}`, i = this.recentErrors.get(n);
    return i && r - i < Se ? (this.recentErrors.set(n, r), !0) : (this.recentErrors.set(n, r), this.recentErrors.size > Je ? (this.recentErrors.clear(), this.recentErrors.set(n, r), !1) : (this.recentErrors.size > F && this.pruneOldErrors(), !1));
  }
  pruneOldErrors() {
    const e = Date.now();
    for (const [n, i] of this.recentErrors.entries())
      e - i > Se && this.recentErrors.delete(n);
    if (this.recentErrors.size <= F)
      return;
    const t = Array.from(this.recentErrors.entries()).sort((n, i) => n[1] - i[1]), r = this.recentErrors.size - F;
    for (let n = 0; n < r; n += 1) {
      const i = t[n];
      i && this.recentErrors.delete(i[0]);
    }
  }
}
class Ht extends T {
  isInitialized = !1;
  suppressNextScrollTimer = null;
  emitter = new yt();
  managers = {};
  handlers = {};
  integrations = {};
  get initialized() {
    return this.isInitialized;
  }
  async init(e = {}) {
    if (!this.isInitialized) {
      this.managers.storage = new Vt();
      try {
        this.setupState(e), await this.setupIntegrations(), this.managers.event = new Lt(this.managers.storage, this.integrations.googleAnalytics, this.emitter), this.initializeHandlers(), await this.managers.event.recoverPersistedEvents().catch((t) => {
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
    let r = t;
    t && typeof t == "object" && !Array.isArray(t) && Object.getPrototypeOf(t) !== Object.prototype && (r = Object.assign({}, t));
    const { valid: n, error: i, sanitizedMetadata: o } = wt(e, r);
    if (!n) {
      if (this.get("mode") === V.QA)
        throw new Error(`[TraceLog] Custom event "${e}" validation failed: ${i}`);
      return;
    }
    this.managers.event.track({
      type: u.CUSTOM,
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
    const t = Mt.getId(this.managers.storage);
    this.set("userId", t);
    const r = Et(e);
    this.set("collectApiUrl", r);
    const n = Ze();
    this.set("device", n);
    const i = se(window.location.href, e.sensitiveQueryParams);
    this.set("pageUrl", i);
    const o = ut() ? V.QA : void 0;
    o && this.set("mode", o);
  }
  async setupIntegrations() {
    if (this.get("config").integrations?.googleAnalytics?.measurementId?.trim())
      try {
        this.integrations.googleAnalytics = new Dt(), await this.integrations.googleAnalytics.initialize();
      } catch {
        this.integrations.googleAnalytics = void 0;
      }
  }
  initializeHandlers() {
    const e = this.get("config"), t = e.disabledEvents ?? [];
    this.handlers.session = new bt(
      this.managers.storage,
      this.managers.event
    ), this.handlers.session.startTracking();
    const r = () => {
      this.set("suppressNextScroll", !0), this.suppressNextScrollTimer && clearTimeout(this.suppressNextScrollTimer), this.suppressNextScrollTimer = window.setTimeout(() => {
        this.set("suppressNextScroll", !1);
      }, 500);
    };
    this.handlers.pageView = new Rt(this.managers.event, r), this.handlers.pageView.startTracking(), this.handlers.click = new Ct(this.managers.event), this.handlers.click.startTracking(), t.includes("scroll") || (this.handlers.scroll = new Ot(this.managers.event), this.handlers.scroll.startTracking()), t.includes("web_vitals") || (this.handlers.performance = new kt(this.managers.event), this.handlers.performance.startTracking().catch((n) => {
      a("warn", "Failed to start performance tracking", { error: n });
    })), t.includes("error") || (this.handlers.error = new Ut(this.managers.event), this.handlers.error.startTracking()), e.viewport && (this.handlers.viewport = new Pt(this.managers.event), this.handlers.viewport.startTracking());
  }
}
const N = [];
let m = null, C = !1, G = !1;
const xt = async (s) => {
  if (!(typeof window > "u" || typeof document > "u") && !window.__traceLogDisabled && !m && !C) {
    C = !0;
    try {
      const e = pt(s ?? {}), t = new Ht();
      try {
        N.forEach(({ event: i, callback: o }) => {
          t.on(i, o);
        }), N.length = 0;
        const r = t.init(e), n = new Promise((i, o) => {
          setTimeout(() => {
            o(new Error("[TraceLog] Initialization timeout after 10000ms"));
          }, 1e4);
        });
        await Promise.race([r, n]), m = t;
      } catch (r) {
        try {
          t.destroy(!0);
        } catch (n) {
          a("error", "Failed to cleanup partially initialized app", { error: n });
        }
        throw r;
      }
    } catch (e) {
      throw m = null, e;
    } finally {
      C = !1;
    }
  }
}, Ft = (s, e) => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!m)
      throw new Error("[TraceLog] TraceLog not initialized. Please call init() first.");
    if (G)
      throw new Error("[TraceLog] Cannot send events while TraceLog is being destroyed");
    m.sendCustomEvent(s, e);
  }
}, Gt = (s, e) => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!m || C) {
      N.push({ event: s, callback: e });
      return;
    }
    m.on(s, e);
  }
}, Wt = (s, e) => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!m) {
      const t = N.findIndex((r) => r.event === s && r.callback === e);
      t !== -1 && N.splice(t, 1);
      return;
    }
    m.off(s, e);
  }
}, $t = () => typeof window > "u" || typeof document > "u" ? !1 : m !== null, Bt = () => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (G)
      throw new Error("[TraceLog] Destroy operation already in progress");
    if (!m)
      throw new Error("[TraceLog] App not initialized");
    G = !0;
    try {
      m.destroy(), m = null, C = !1, N.length = 0;
    } catch (s) {
      m = null, C = !1, N.length = 0, a("warn", "Error during destroy, forced cleanup completed", { error: s });
    } finally {
      G = !1;
    }
  }
}, Xt = (s) => {
  typeof window > "u" || typeof document > "u" || dt(s);
}, Tr = {
  LOW_ACTIVITY_EVENT_COUNT: 50,
  HIGH_ACTIVITY_EVENT_COUNT: 1e3,
  MIN_EVENTS_FOR_DYNAMIC_CALCULATION: 100,
  MIN_EVENTS_FOR_TREND_ANALYSIS: 30,
  BOUNCE_RATE_SESSION_THRESHOLD: 1,
  // Sessions with 1 page view = bounce
  MIN_ENGAGED_SESSION_DURATION_MS: 30 * 1e3,
  MIN_SCROLL_DEPTH_ENGAGEMENT: 25
  // 25% scroll depth for engagement
}, pr = {
  INACTIVITY_TIMEOUT_MS: 1800 * 1e3,
  // 30min for analytics (vs 15min client)
  SHORT_SESSION_THRESHOLD_MS: 30 * 1e3,
  MEDIUM_SESSION_THRESHOLD_MS: 300 * 1e3,
  LONG_SESSION_THRESHOLD_MS: 1800 * 1e3,
  MAX_REALISTIC_SESSION_DURATION_MS: 480 * 60 * 1e3,
  // Filter outliers
  MIN_EVENTS_FOR_DURATION: 2
  // Minimum events required to calculate session duration
}, _r = {
  SIGNIFICANT_CHANGE_PERCENT: 20,
  MAJOR_CHANGE_PERCENT: 50,
  MIN_EVENTS_FOR_INSIGHT: 100,
  MIN_SESSIONS_FOR_INSIGHT: 10,
  MIN_CORRELATION_STRENGTH: 0.7,
  // Strong correlation threshold
  LOW_ERROR_RATE_PERCENT: 1,
  HIGH_ERROR_RATE_PERCENT: 5,
  CRITICAL_ERROR_RATE_PERCENT: 10
}, Ir = {
  DEFAULT_EVENTS_LIMIT: 5,
  DEFAULT_SESSIONS_LIMIT: 5,
  DEFAULT_PAGES_LIMIT: 5,
  MAX_EVENTS_FOR_DEEP_ANALYSIS: 1e4,
  MAX_TIME_RANGE_DAYS: 365,
  ANALYTICS_BATCH_SIZE: 1e3
  // For historical analysis
}, vr = {
  PAGE_URL_EXCLUDED: "excluded",
  PAGE_URL_UNKNOWN: "unknown"
}, wr = {
  init: xt,
  event: Ft,
  on: Gt,
  off: Wt,
  isInitialized: $t,
  destroy: Bt,
  setQaMode: Xt
};
var ie, ke = -1, O = function(s) {
  addEventListener("pageshow", (function(e) {
    e.persisted && (ke = e.timeStamp, s(e));
  }), !0);
}, de = function() {
  var s = self.performance && performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
  if (s && s.responseStart > 0 && s.responseStart < performance.now()) return s;
}, B = function() {
  var s = de();
  return s && s.activationStart || 0;
}, _ = function(s, e) {
  var t = de(), r = "navigate";
  return ke >= 0 ? r = "back-forward-cache" : t && (document.prerendering || B() > 0 ? r = "prerender" : document.wasDiscarded ? r = "restore" : t.type && (r = t.type.replace(/_/g, "-"))), { name: s, value: e === void 0 ? -1 : e, rating: "good", delta: 0, entries: [], id: "v4-".concat(Date.now(), "-").concat(Math.floor(8999999999999 * Math.random()) + 1e12), navigationType: r };
}, U = function(s, e, t) {
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
}, he = function(s) {
  requestAnimationFrame((function() {
    return requestAnimationFrame((function() {
      return s();
    }));
  }));
}, X = function(s) {
  document.addEventListener("visibilitychange", (function() {
    document.visibilityState === "hidden" && s();
  }));
}, fe = function(s) {
  var e = !1;
  return function() {
    e || (s(), e = !0);
  };
}, R = -1, Ne = function() {
  return document.visibilityState !== "hidden" || document.prerendering ? 1 / 0 : 0;
}, $ = function(s) {
  document.visibilityState === "hidden" && R > -1 && (R = s.type === "visibilitychange" ? s.timeStamp : 0, zt());
}, be = function() {
  addEventListener("visibilitychange", $, !0), addEventListener("prerenderingchange", $, !0);
}, zt = function() {
  removeEventListener("visibilitychange", $, !0), removeEventListener("prerenderingchange", $, !0);
}, Ue = function() {
  return R < 0 && (R = Ne(), be(), O((function() {
    setTimeout((function() {
      R = Ne(), be();
    }), 0);
  }))), { get firstHiddenTime() {
    return R;
  } };
}, z = function(s) {
  document.prerendering ? addEventListener("prerenderingchange", (function() {
    return s();
  }), !0) : s();
}, oe = [1800, 3e3], He = function(s, e) {
  e = e || {}, z((function() {
    var t, r = Ue(), n = _("FCP"), i = U("paint", (function(o) {
      o.forEach((function(l) {
        l.name === "first-contentful-paint" && (i.disconnect(), l.startTime < r.firstHiddenTime && (n.value = Math.max(l.startTime - B(), 0), n.entries.push(l), t(!0)));
      }));
    }));
    i && (t = I(s, n, oe, e.reportAllChanges), O((function(o) {
      n = _("FCP"), t = I(s, n, oe, e.reportAllChanges), he((function() {
        n.value = performance.now() - o.timeStamp, t(!0);
      }));
    })));
  }));
}, ae = [0.1, 0.25], jt = function(s, e) {
  e = e || {}, He(fe((function() {
    var t, r = _("CLS", 0), n = 0, i = [], o = function(c) {
      c.forEach((function(d) {
        if (!d.hadRecentInput) {
          var E = i[0], g = i[i.length - 1];
          n && d.startTime - g.startTime < 1e3 && d.startTime - E.startTime < 5e3 ? (n += d.value, i.push(d)) : (n = d.value, i = [d]);
        }
      })), n > r.value && (r.value = n, r.entries = i, t());
    }, l = U("layout-shift", o);
    l && (t = I(s, r, ae, e.reportAllChanges), X((function() {
      o(l.takeRecords()), t(!0);
    })), O((function() {
      n = 0, r = _("CLS", 0), t = I(s, r, ae, e.reportAllChanges), he((function() {
        return t();
      }));
    })), setTimeout(t, 0));
  })));
}, xe = 0, Y = 1 / 0, H = 0, Qt = function(s) {
  s.forEach((function(e) {
    e.interactionId && (Y = Math.min(Y, e.interactionId), H = Math.max(H, e.interactionId), xe = H ? (H - Y) / 7 + 1 : 0);
  }));
}, Fe = function() {
  return ie ? xe : performance.interactionCount || 0;
}, Kt = function() {
  "interactionCount" in performance || ie || (ie = U("event", Qt, { type: "event", buffered: !0, durationThreshold: 0 }));
}, p = [], W = /* @__PURE__ */ new Map(), Ge = 0, Yt = function() {
  var s = Math.min(p.length - 1, Math.floor((Fe() - Ge) / 50));
  return p[s];
}, qt = [], Zt = function(s) {
  if (qt.forEach((function(n) {
    return n(s);
  })), s.interactionId || s.entryType === "first-input") {
    var e = p[p.length - 1], t = W.get(s.interactionId);
    if (t || p.length < 10 || s.duration > e.latency) {
      if (t) s.duration > t.latency ? (t.entries = [s], t.latency = s.duration) : s.duration === t.latency && s.startTime === t.entries[0].startTime && t.entries.push(s);
      else {
        var r = { id: s.interactionId, latency: s.duration, entries: [s] };
        W.set(r.id, r), p.push(r);
      }
      p.sort((function(n, i) {
        return i.latency - n.latency;
      })), p.length > 10 && p.splice(10).forEach((function(n) {
        return W.delete(n.id);
      }));
    }
  }
}, We = function(s) {
  var e = self.requestIdleCallback || self.setTimeout, t = -1;
  return s = fe(s), document.visibilityState === "hidden" ? s() : (t = e(s), X(s)), t;
}, le = [200, 500], Jt = function(s, e) {
  "PerformanceEventTiming" in self && "interactionId" in PerformanceEventTiming.prototype && (e = e || {}, z((function() {
    var t;
    Kt();
    var r, n = _("INP"), i = function(l) {
      We((function() {
        l.forEach(Zt);
        var c = Yt();
        c && c.latency !== n.value && (n.value = c.latency, n.entries = c.entries, r());
      }));
    }, o = U("event", i, { durationThreshold: (t = e.durationThreshold) !== null && t !== void 0 ? t : 40 });
    r = I(s, n, le, e.reportAllChanges), o && (o.observe({ type: "first-input", buffered: !0 }), X((function() {
      i(o.takeRecords()), r(!0);
    })), O((function() {
      Ge = Fe(), p.length = 0, W.clear(), n = _("INP"), r = I(s, n, le, e.reportAllChanges);
    })));
  })));
}, ce = [2500, 4e3], q = {}, er = function(s, e) {
  e = e || {}, z((function() {
    var t, r = Ue(), n = _("LCP"), i = function(c) {
      e.reportAllChanges || (c = c.slice(-1)), c.forEach((function(d) {
        d.startTime < r.firstHiddenTime && (n.value = Math.max(d.startTime - B(), 0), n.entries = [d], t());
      }));
    }, o = U("largest-contentful-paint", i);
    if (o) {
      t = I(s, n, ce, e.reportAllChanges);
      var l = fe((function() {
        q[n.id] || (i(o.takeRecords()), o.disconnect(), q[n.id] = !0, t(!0));
      }));
      ["keydown", "click"].forEach((function(c) {
        addEventListener(c, (function() {
          return We(l);
        }), { once: !0, capture: !0 });
      })), X(l), O((function(c) {
        n = _("LCP"), t = I(s, n, ce, e.reportAllChanges), he((function() {
          n.value = performance.now() - c.timeStamp, q[n.id] = !0, t(!0);
        }));
      }));
    }
  }));
}, ue = [800, 1800], tr = function s(e) {
  document.prerendering ? z((function() {
    return s(e);
  })) : document.readyState !== "complete" ? addEventListener("load", (function() {
    return s(e);
  }), !0) : setTimeout(e, 0);
}, rr = function(s, e) {
  e = e || {};
  var t = _("TTFB"), r = I(s, t, ue, e.reportAllChanges);
  tr((function() {
    var n = de();
    n && (t.value = Math.max(n.responseStart - B(), 0), t.entries = [n], r(!0), O((function() {
      t = _("TTFB", 0), (r = I(s, t, ue, e.reportAllChanges))(!0);
    })));
  }));
};
const sr = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  CLSThresholds: ae,
  FCPThresholds: oe,
  INPThresholds: le,
  LCPThresholds: ce,
  TTFBThresholds: ue,
  onCLS: jt,
  onFCP: He,
  onINP: Jt,
  onLCP: er,
  onTTFB: rr
}, Symbol.toStringTag, { value: "Module" }));
export {
  Ir as ANALYTICS_QUERY_LIMITS,
  h as AppConfigValidationError,
  nr as DEFAULT_SESSION_TIMEOUT,
  re as DEFAULT_WEB_VITALS_MODE,
  A as DeviceType,
  Tr as ENGAGEMENT_THRESHOLDS,
  J as EmitterEvent,
  P as ErrorType,
  u as EventType,
  _r as INSIGHT_THRESHOLDS,
  mr as InitializationTimeoutError,
  M as IntegrationValidationError,
  fr as MAX_ARRAY_LENGTH,
  lr as MAX_CUSTOM_EVENT_ARRAY_SIZE,
  ar as MAX_CUSTOM_EVENT_KEYS,
  ir as MAX_CUSTOM_EVENT_NAME_LENGTH,
  or as MAX_CUSTOM_EVENT_STRING_SIZE,
  ur as MAX_METADATA_NESTING_DEPTH,
  cr as MAX_NESTED_OBJECT_KEYS,
  dr as MAX_STRING_LENGTH,
  hr as MAX_STRING_LENGTH_IN_ARRAY,
  V as Mode,
  Pe as PII_PATTERNS,
  b as PermanentError,
  pr as SESSION_ANALYTICS,
  vr as SPECIAL_PAGE_URLS,
  Ee as SamplingRateValidationError,
  x as ScrollDirection,
  Ke as SessionTimeoutValidationError,
  Z as SpecialApiUrl,
  k as TraceLogValidationError,
  Sr as WEB_VITALS_GOOD_THRESHOLDS,
  ve as WEB_VITALS_NEEDS_IMPROVEMENT_THRESHOLDS,
  at as WEB_VITALS_POOR_THRESHOLDS,
  we as getWebVitalsThresholds,
  Er as isPrimaryScrollEvent,
  gr as isSecondaryScrollEvent,
  wr as tracelog
};
