const dr = 9e5;
const hr = 120, fr = 8192, mr = 10, gr = 10, Er = 20, pr = 1;
const Sr = 1e3, Tr = 500, _r = 100;
const w = "data-tlog", Ke = [
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
], Ye = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"], qe = [
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
}, Ze = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<embed\b[^>]*>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi
];
var J = /* @__PURE__ */ ((n) => (n.Localhost = "localhost:8080", n.Fail = "localhost:9999", n))(J || {}), L = /* @__PURE__ */ ((n) => (n.Mobile = "mobile", n.Tablet = "tablet", n.Desktop = "desktop", n.Unknown = "unknown", n))(L || {}), ee = /* @__PURE__ */ ((n) => (n.EVENT = "event", n.QUEUE = "queue", n))(ee || {});
class C extends Error {
  constructor(e, t) {
    super(e), this.statusCode = t, this.name = "PermanentError", Error.captureStackTrace && Error.captureStackTrace(this, C);
  }
}
var d = /* @__PURE__ */ ((n) => (n.PAGE_VIEW = "page_view", n.CLICK = "click", n.SCROLL = "scroll", n.SESSION_START = "session_start", n.SESSION_END = "session_end", n.CUSTOM = "custom", n.WEB_VITALS = "web_vitals", n.ERROR = "error", n.VIEWPORT_VISIBLE = "viewport_visible", n))(d || {}), B = /* @__PURE__ */ ((n) => (n.UP = "up", n.DOWN = "down", n))(B || {}), V = /* @__PURE__ */ ((n) => (n.JS_ERROR = "js_error", n.PROMISE_REJECTION = "promise_rejection", n))(V || {}), U = /* @__PURE__ */ ((n) => (n.QA = "qa", n))(U || {});
const vr = (n) => n.type === d.SCROLL && "scroll_data" in n && n.scroll_data.is_primary === !0, Ir = (n) => n.type === d.SCROLL && "scroll_data" in n && n.scroll_data.is_primary === !1;
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
class Je extends H {
  constructor(e, t = "config") {
    super(e, "SESSION_TIMEOUT_INVALID", t);
  }
}
class ge extends H {
  constructor(e, t = "config") {
    super(e, "SAMPLING_RATE_INVALID", t);
  }
}
class M extends H {
  constructor(e, t = "config") {
    super(e, "INTEGRATION_INVALID", t);
  }
}
class wr extends H {
  constructor(e, t, r = "runtime") {
    super(e, "INITIALIZATION_TIMEOUT", r), this.timeoutMs = t;
  }
}
const et = (n, e) => {
  if (e) {
    if (e instanceof Error) {
      const t = e.message.replace(/\s+at\s+.*$/gm, "").replace(/\(.*?:\d+:\d+\)/g, "");
      return `[TraceLog] ${n}: ${t}`;
    }
    if (e instanceof Error)
      return `[TraceLog] ${n}: ${e.message}`;
    if (typeof e == "string")
      return `[TraceLog] ${n}: ${e}`;
    if (typeof e == "object")
      try {
        return `[TraceLog] ${n}: ${JSON.stringify(e)}`;
      } catch {
        return `[TraceLog] ${n}: [Unable to serialize error]`;
      }
    return `[TraceLog] ${n}: ${String(e)}`;
  }
  return `[TraceLog] ${n}`;
}, l = (n, e, t) => {
  const { error: r, data: s, showToClient: i = !1, style: o } = t ?? {}, a = r ? et(e, r) : `[TraceLog] ${e}`, c = n === "error" ? "error" : n === "warn" ? "warn" : "log";
  if (n === "debug" || n === "info" && !i)
    return;
  const u = o !== void 0 && o !== "", m = u ? `%c${a}` : a;
  if (s !== void 0) {
    const E = te(s);
    u ? console[c](m, o, E) : console[c](m, E);
  } else
    u ? console[c](m, o) : console[c](m);
}, te = (n) => {
  const e = {}, t = ["token", "password", "secret", "key", "apikey", "api_key", "sessionid", "session_id"];
  for (const [r, s] of Object.entries(n)) {
    const i = r.toLowerCase();
    if (t.some((o) => i.includes(o))) {
      e[r] = "[REDACTED]";
      continue;
    }
    s !== null && typeof s == "object" && !Array.isArray(s) ? e[r] = te(s) : Array.isArray(s) ? e[r] = s.map(
      (o) => o !== null && typeof o == "object" && !Array.isArray(o) ? te(o) : o
    ) : e[r] = s;
  }
  return e;
};
let re, Ce;
const tt = () => {
  typeof window < "u" && !re && (re = window.matchMedia("(pointer: coarse)"), Ce = window.matchMedia("(hover: none)"));
}, rt = () => {
  try {
    const n = navigator;
    if (n.userAgentData && typeof n.userAgentData.mobile == "boolean")
      return n.userAgentData.platform && /ipad|tablet/i.test(n.userAgentData.platform) ? L.Tablet : n.userAgentData.mobile ? L.Mobile : L.Desktop;
    tt();
    const e = window.innerWidth, t = re?.matches ?? !1, r = Ce?.matches ?? !1, s = "ontouchstart" in window || navigator.maxTouchPoints > 0, i = navigator.userAgent.toLowerCase(), o = /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/.test(i), a = /tablet|ipad|android(?!.*mobile)/.test(i);
    return e <= 767 || o && s ? L.Mobile : e >= 768 && e <= 1024 || a || t && r && s ? L.Tablet : L.Desktop;
  } catch (n) {
    return l("warn", "Device detection failed, defaulting to desktop", { error: n }), L.Desktop;
  }
}, Oe = "background: #ff9800; color: white; font-weight: bold; padding: 2px 8px; border-radius: 3px;", Pe = "background: #9e9e9e; color: white; font-weight: bold; padding: 2px 8px; border-radius: 3px;", Ee = ["scroll", "web_vitals", "error"], De = [
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
], pe = 500, Se = 5e3, W = 50, nt = W * 2, Ve = 1, st = 1e3, it = 10, Te = 5e3, ot = 6e4, b = "tlog", k = `${b}:qa_mode`, at = `${b}:uid`, _e = "tlog_mode", ve = "qa", Ie = "qa_off", lt = (n) => n ? `${b}:${n}:queue` : `${b}:queue`, ct = (n) => n ? `${b}:${n}:session` : `${b}:session`, ut = (n) => n ? `${b}:${n}:broadcast` : `${b}:broadcast`, yr = {
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
}, we = {
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
}, dt = {
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
}, ne = "needs-improvement", ye = (n = ne) => {
  switch (n) {
    case "all":
      return { LCP: 0, FCP: 0, CLS: 0, INP: 0, TTFB: 0, LONG_TASK: 0 };
    // Track everything
    case "needs-improvement":
      return we;
    case "poor":
      return dt;
    default:
      return we;
  }
}, ht = 1e3, ft = 50, mt = () => {
  if (typeof window > "u" || typeof document > "u")
    return !1;
  try {
    const n = new URLSearchParams(window.location.search), e = n.get(_e), t = sessionStorage.getItem(k);
    let r = null;
    if (e === ve ? (r = !0, sessionStorage.setItem(k, "true"), l("info", "QA Mode ACTIVE", {
      showToClient: !0,
      style: Oe
    })) : e === Ie && (r = !1, sessionStorage.removeItem(k), l("info", "QA Mode DISABLED", {
      showToClient: !0,
      style: Pe
    })), e === ve || e === Ie)
      try {
        n.delete(_e);
        const s = n.toString(), i = window.location.pathname + (s ? "?" + s : "") + window.location.hash;
        window.history.replaceState({}, "", i);
      } catch {
      }
    return r ?? t === "true";
  } catch {
    return !1;
  }
}, gt = (n) => {
  if (!(typeof window > "u" || typeof document > "u"))
    try {
      n ? (sessionStorage.setItem(k, "true"), l("info", "QA Mode ENABLED", {
        showToClient: !0,
        style: Oe
      })) : (sessionStorage.removeItem(k), l("info", "QA Mode DISABLED", {
        showToClient: !0,
        style: Pe
      }));
    } catch {
      l("warn", "Cannot set QA mode: sessionStorage unavailable");
    }
}, Ae = () => {
  const n = new URLSearchParams(window.location.search), e = {};
  return Ye.forEach((r) => {
    const s = n.get(r);
    if (s) {
      const i = r.split("utm_")[1];
      e[i] = s;
    }
  }), Object.keys(e).length ? e : void 0;
}, Et = () => typeof crypto < "u" && crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (n) => {
  const e = Math.random() * 16 | 0;
  return (n === "x" ? e : e & 3 | 8).toString(16);
}), pt = () => {
  const n = Date.now();
  let e = "";
  try {
    if (typeof crypto < "u" && crypto.getRandomValues) {
      const t = crypto.getRandomValues(new Uint8Array(4));
      t && (e = Array.from(t, (r) => r.toString(16).padStart(2, "0")).join(""));
    }
  } catch {
  }
  return e || (e = Math.floor(Math.random() * 4294967295).toString(16).padStart(8, "0")), `${n}-${e}`;
}, ke = (n, e = !1) => {
  try {
    const t = new URL(n), r = t.protocol === "https:", s = t.protocol === "http:";
    return r || e && s;
  } catch {
    return !1;
  }
}, St = (n) => {
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
    let s;
    if (r.length === 2 ? s = r.join(".") : s = r.slice(-2).join("."), !s || s.split(".").length < 2)
      throw new Error("Invalid domain structure for SaaS");
    const i = `https://${n}.${s}/collect`;
    if (!ke(i))
      throw new Error("Generated URL failed validation");
    return i;
  } catch (e) {
    throw new Error(`Invalid SaaS URL configuration: ${e instanceof Error ? e.message : String(e)}`);
  }
}, Tt = (n) => {
  const e = {};
  n.integrations?.tracelog?.projectId && (e.saas = St(n.integrations.tracelog.projectId));
  const t = n.integrations?.custom?.collectApiUrl;
  if (t) {
    const r = n.integrations?.custom?.allowHttp ?? !1;
    if (!ke(t, r))
      throw new Error("Invalid custom API URL");
    e.custom = t;
  }
  return e;
}, se = (n, e = []) => {
  if (!n || typeof n != "string")
    return l("warn", "Invalid URL provided to normalizeUrl", { data: { url: String(n) } }), n || "";
  try {
    const t = new URL(n), r = t.searchParams, s = [.../* @__PURE__ */ new Set([...qe, ...e])];
    let i = !1;
    const o = [];
    return s.forEach((c) => {
      r.has(c) && (r.delete(c), i = !0, o.push(c));
    }), !i && n.includes("?") ? n : (t.search = r.toString(), t.toString());
  } catch (t) {
    const r = n && typeof n == "string" ? n.slice(0, 100) : String(n);
    return l("warn", "URL normalization failed, returning original", { error: t, data: { url: r } }), n;
  }
}, Le = (n) => {
  if (!n || typeof n != "string" || n.trim().length === 0)
    return "";
  let e = n;
  n.length > 1e3 && (e = n.slice(0, Math.max(0, 1e3)));
  let t = 0;
  for (const s of Ze) {
    const i = e;
    e = e.replace(s, ""), i !== e && t++;
  }
  return t > 0 && l("warn", "XSS patterns detected and removed", {
    data: {
      patternMatches: t,
      originalValue: n.slice(0, 100)
    }
  }), e = e.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#x27;").replaceAll("/", "&#x2F;"), e.trim();
}, ie = (n, e = 0) => {
  if (e > 3 || n == null)
    return null;
  if (typeof n == "string")
    return Le(n);
  if (typeof n == "number")
    return !Number.isFinite(n) || n < -Number.MAX_SAFE_INTEGER || n > Number.MAX_SAFE_INTEGER ? 0 : n;
  if (typeof n == "boolean")
    return n;
  if (Array.isArray(n))
    return n.slice(0, 100).map((s) => ie(s, e + 1)).filter((s) => s !== null);
  if (typeof n == "object") {
    const t = {}, s = Object.entries(n).slice(0, 20);
    for (const [i, o] of s) {
      const a = Le(i);
      if (a) {
        const c = ie(o, e + 1);
        c !== null && (t[a] = c);
      }
    }
    return t;
  }
  return null;
}, _t = (n) => {
  if (typeof n != "object" || n === null)
    return {};
  try {
    const e = ie(n);
    return typeof e == "object" && e !== null ? e : {};
  } catch (e) {
    const t = e instanceof Error ? e.message : String(e);
    throw new Error(`[TraceLog] Metadata sanitization failed: ${t}`);
  }
}, vt = (n) => {
  if (n !== void 0 && (n === null || typeof n != "object"))
    throw new h("Configuration must be an object", "config");
  if (n) {
    if (n.sessionTimeout !== void 0 && (typeof n.sessionTimeout != "number" || n.sessionTimeout < 3e4 || n.sessionTimeout > 864e5))
      throw new Je(f.INVALID_SESSION_TIMEOUT, "config");
    if (n.globalMetadata !== void 0 && (typeof n.globalMetadata != "object" || n.globalMetadata === null))
      throw new h(f.INVALID_GLOBAL_METADATA, "config");
    if (n.integrations && wt(n.integrations), n.sensitiveQueryParams !== void 0) {
      if (!Array.isArray(n.sensitiveQueryParams))
        throw new h(f.INVALID_SENSITIVE_QUERY_PARAMS, "config");
      for (const e of n.sensitiveQueryParams)
        if (typeof e != "string")
          throw new h("All sensitive query params must be strings", "config");
    }
    if (n.errorSampling !== void 0 && (typeof n.errorSampling != "number" || n.errorSampling < 0 || n.errorSampling > 1))
      throw new ge(f.INVALID_ERROR_SAMPLING_RATE, "config");
    if (n.samplingRate !== void 0 && (typeof n.samplingRate != "number" || n.samplingRate < 0 || n.samplingRate > 1))
      throw new ge(f.INVALID_SAMPLING_RATE, "config");
    if (n.primaryScrollSelector !== void 0) {
      if (typeof n.primaryScrollSelector != "string" || !n.primaryScrollSelector.trim())
        throw new h(f.INVALID_PRIMARY_SCROLL_SELECTOR, "config");
      if (n.primaryScrollSelector !== "window")
        try {
          document.querySelector(n.primaryScrollSelector);
        } catch {
          throw new h(
            `${f.INVALID_PRIMARY_SCROLL_SELECTOR_SYNTAX}: "${n.primaryScrollSelector}"`,
            "config"
          );
        }
    }
    if (n.pageViewThrottleMs !== void 0 && (typeof n.pageViewThrottleMs != "number" || n.pageViewThrottleMs < 0))
      throw new h(f.INVALID_PAGE_VIEW_THROTTLE, "config");
    if (n.clickThrottleMs !== void 0 && (typeof n.clickThrottleMs != "number" || n.clickThrottleMs < 0))
      throw new h(f.INVALID_CLICK_THROTTLE, "config");
    if (n.maxSameEventPerMinute !== void 0 && (typeof n.maxSameEventPerMinute != "number" || n.maxSameEventPerMinute <= 0))
      throw new h(f.INVALID_MAX_SAME_EVENT_PER_MINUTE, "config");
    if (n.viewport !== void 0 && It(n.viewport), n.disabledEvents !== void 0) {
      if (!Array.isArray(n.disabledEvents))
        throw new h("disabledEvents must be an array", "config");
      const e = /* @__PURE__ */ new Set();
      for (const t of n.disabledEvents) {
        if (typeof t != "string")
          throw new h("All disabled event types must be strings", "config");
        if (!Ee.includes(t))
          throw new h(
            `Invalid disabled event type: "${t}". Must be one of: ${Ee.join(", ")}`,
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
    if (n.webVitalsMode !== void 0) {
      if (typeof n.webVitalsMode != "string")
        throw new h(
          `Invalid webVitalsMode type: ${typeof n.webVitalsMode}. Must be a string`,
          "config"
        );
      const e = ["all", "needs-improvement", "poor"];
      if (!e.includes(n.webVitalsMode))
        throw new h(
          `Invalid webVitalsMode: "${n.webVitalsMode}". Must be one of: ${e.join(", ")}`,
          "config"
        );
    }
    if (n.webVitalsThresholds !== void 0) {
      if (typeof n.webVitalsThresholds != "object" || n.webVitalsThresholds === null || Array.isArray(n.webVitalsThresholds))
        throw new h("webVitalsThresholds must be an object", "config");
      const e = ["LCP", "FCP", "CLS", "INP", "TTFB", "LONG_TASK"];
      for (const [t, r] of Object.entries(n.webVitalsThresholds)) {
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
}, It = (n) => {
  if (typeof n != "object" || n === null)
    throw new h(f.INVALID_VIEWPORT_CONFIG, "config");
  if (!n.elements || !Array.isArray(n.elements))
    throw new h(f.INVALID_VIEWPORT_ELEMENTS, "config");
  if (n.elements.length === 0)
    throw new h(f.INVALID_VIEWPORT_ELEMENTS, "config");
  const e = /* @__PURE__ */ new Set();
  for (const t of n.elements) {
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
  if (n.threshold !== void 0 && (typeof n.threshold != "number" || n.threshold < 0 || n.threshold > 1))
    throw new h(f.INVALID_VIEWPORT_THRESHOLD, "config");
  if (n.minDwellTime !== void 0 && (typeof n.minDwellTime != "number" || n.minDwellTime < 0))
    throw new h(f.INVALID_VIEWPORT_MIN_DWELL_TIME, "config");
  if (n.cooldownPeriod !== void 0 && (typeof n.cooldownPeriod != "number" || n.cooldownPeriod < 0))
    throw new h(f.INVALID_VIEWPORT_COOLDOWN_PERIOD, "config");
  if (n.maxTrackedElements !== void 0 && (typeof n.maxTrackedElements != "number" || n.maxTrackedElements <= 0))
    throw new h(f.INVALID_VIEWPORT_MAX_TRACKED_ELEMENTS, "config");
}, wt = (n) => {
  if (n) {
    if (n.tracelog && (!n.tracelog.projectId || typeof n.tracelog.projectId != "string" || n.tracelog.projectId.trim() === ""))
      throw new M(f.INVALID_TRACELOG_PROJECT_ID, "config");
    if (n.custom) {
      if (!n.custom.collectApiUrl || typeof n.custom.collectApiUrl != "string" || n.custom.collectApiUrl.trim() === "")
        throw new M(f.INVALID_CUSTOM_API_URL, "config");
      if (n.custom.allowHttp !== void 0 && typeof n.custom.allowHttp != "boolean")
        throw new M("allowHttp must be a boolean", "config");
      const e = n.custom.collectApiUrl.trim();
      if (!e.startsWith("http://") && !e.startsWith("https://"))
        throw new M('Custom API URL must start with "http://" or "https://"', "config");
      if (!(n.custom.allowHttp ?? !1) && e.startsWith("http://"))
        throw new M(
          "Custom API URL must use HTTPS in production. Set allowHttp: true in integration config to allow HTTP (not recommended)",
          "config"
        );
    }
    if (n.googleAnalytics) {
      if (!n.googleAnalytics.measurementId || typeof n.googleAnalytics.measurementId != "string" || n.googleAnalytics.measurementId.trim() === "")
        throw new M(f.INVALID_GOOGLE_ANALYTICS_ID, "config");
      if (!n.googleAnalytics.measurementId.trim().match(/^(G-|UA-)/))
        throw new M('Google Analytics measurement ID must start with "G-" or "UA-"', "config");
    }
  }
}, yt = (n) => {
  vt(n);
  const e = {
    ...n ?? {},
    sessionTimeout: n?.sessionTimeout ?? 9e5,
    globalMetadata: n?.globalMetadata ?? {},
    sensitiveQueryParams: n?.sensitiveQueryParams ?? [],
    errorSampling: n?.errorSampling ?? Ve,
    samplingRate: n?.samplingRate ?? 1,
    pageViewThrottleMs: n?.pageViewThrottleMs ?? 1e3,
    clickThrottleMs: n?.clickThrottleMs ?? 300,
    maxSameEventPerMinute: n?.maxSameEventPerMinute ?? 60,
    disabledEvents: n?.disabledEvents ?? []
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
}, At = (n) => {
  if (typeof n == "string")
    return !0;
  if (typeof n == "object" && n !== null && !Array.isArray(n)) {
    const e = Object.entries(n);
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
}, Ue = (n, e = 0) => {
  if (typeof n != "object" || n === null || e > 1)
    return !1;
  for (const t of Object.values(n)) {
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
        } else if (!t.every((o) => At(o)))
          return !1;
        continue;
      }
      if (r === "object" && e === 0) {
        if (!Ue(t, e + 1))
          return !1;
        continue;
      }
      return !1;
    }
  }
  return !0;
}, Lt = (n) => typeof n != "string" ? {
  valid: !1,
  error: "Event name must be a string"
} : n.length === 0 ? {
  valid: !1,
  error: "Event name cannot be empty"
} : n.length > 120 ? {
  valid: !1,
  error: "Event name is too long (max 120 characters)"
} : n.includes("<") || n.includes(">") || n.includes("&") ? {
  valid: !1,
  error: "Event name contains invalid characters"
} : ["constructor", "prototype", "__proto__", "eval", "function", "var", "let", "const"].includes(n.toLowerCase()) ? {
  valid: !1,
  error: "Event name cannot be a reserved word"
} : { valid: !0 }, be = (n, e, t) => {
  const r = _t(e), s = `${t} "${n}" metadata error`;
  if (!Ue(r))
    return {
      valid: !1,
      error: `${s}: object has invalid types. Valid types are string, number, boolean or string arrays.`
    };
  let i;
  try {
    i = JSON.stringify(r);
  } catch {
    return {
      valid: !1,
      error: `${s}: object contains circular references or cannot be serialized.`
    };
  }
  if (i.length > 8192)
    return {
      valid: !1,
      error: `${s}: object is too large (max ${8192 / 1024} KB).`
    };
  if (Object.keys(r).length > 10)
    return {
      valid: !1,
      error: `${s}: object has too many keys (max 10 keys).`
    };
  for (const [a, c] of Object.entries(r)) {
    if (Array.isArray(c)) {
      if (c.length > 10)
        return {
          valid: !1,
          error: `${s}: array property "${a}" is too large (max 10 items).`
        };
      for (const u of c)
        if (typeof u == "string" && u.length > 500)
          return {
            valid: !1,
            error: `${s}: array property "${a}" contains strings that are too long (max 500 characters).`
          };
    }
    if (typeof c == "string" && c.length > 1e3)
      return {
        valid: !1,
        error: `${s}: property "${a}" is too long (max 1000 characters).`
      };
  }
  return {
    valid: !0,
    sanitizedMetadata: r
  };
}, bt = (n, e, t) => {
  if (Array.isArray(e)) {
    const r = [], s = `${t} "${n}" metadata error`;
    for (let i = 0; i < e.length; i++) {
      const o = e[i];
      if (typeof o != "object" || o === null || Array.isArray(o))
        return {
          valid: !1,
          error: `${s}: array item at index ${i} must be an object.`
        };
      const a = be(n, o, t);
      if (!a.valid)
        return {
          valid: !1,
          error: `${s}: array item at index ${i} is invalid: ${a.error}`
        };
      a.sanitizedMetadata && r.push(a.sanitizedMetadata);
    }
    return {
      valid: !0,
      sanitizedMetadata: r
    };
  }
  return be(n, e, t);
}, Mt = (n, e) => {
  const t = Lt(n);
  if (!t.valid)
    return l("error", "Event name validation failed", {
      showToClient: !0,
      data: { eventName: n, error: t.error }
    }), t;
  if (!e)
    return { valid: !0 };
  const r = bt(n, e, "customEvent");
  return r.valid || l("error", "Event metadata validation failed", {
    showToClient: !0,
    data: {
      eventName: n,
      error: r.error
    }
  }), r;
};
class Rt {
  listeners = /* @__PURE__ */ new Map();
  on(e, t) {
    this.listeners.has(e) || this.listeners.set(e, []), this.listeners.get(e).push(t);
  }
  off(e, t) {
    const r = this.listeners.get(e);
    if (r) {
      const s = r.indexOf(t);
      s > -1 && r.splice(s, 1);
    }
  }
  emit(e, t) {
    const r = this.listeners.get(e);
    r && r.forEach((s) => {
      s(t);
    });
  }
  removeAllListeners() {
    this.listeners.clear();
  }
}
function He(n, e, t) {
  try {
    const r = e(n);
    return r === null ? null : typeof r == "object" && r !== null && "type" in r ? r : (l("warn", `beforeSend transformer returned invalid data, using original [${t}]`), n);
  } catch (r) {
    return l("error", `beforeSend transformer threw error, using original event [${t}]`, { error: r }), n;
  }
}
function Nt(n, e, t) {
  return n.map((r) => He(r, e, t)).filter((r) => r !== null);
}
function xe(n, e, t) {
  try {
    const r = e(n);
    return r === null ? (l("debug", `Batch filtered by beforeBatch transformer [${t}]`, {
      data: { eventCount: n.events.length }
    }), null) : typeof r == "object" && r !== null && Array.isArray(r.events) ? r : (l("warn", `beforeBatch transformer returned invalid data, using original [${t}]`, {
      data: { eventCount: n.events.length }
    }), n);
  } catch (r) {
    return l("error", `beforeBatch transformer threw error, using original batch [${t}]`, {
      error: r,
      data: { eventCount: n.events.length }
    }), n;
  }
}
const Y = {};
class T {
  get(e) {
    return Y[e];
  }
  set(e, t) {
    Y[e] = t;
  }
  getState() {
    return { ...Y };
  }
}
class Me extends T {
  storeManager;
  integrationId;
  apiUrl;
  transformers;
  lastPermanentErrorLog = null;
  recoveryInProgress = !1;
  constructor(e, t, r, s = {}) {
    if (super(), t && !r || !t && r)
      throw new Error("SenderManager: integrationId and apiUrl must either both be provided or both be undefined");
    this.storeManager = e, this.integrationId = t, this.apiUrl = r, this.transformers = s;
  }
  getQueueStorageKey() {
    const e = this.get("userId") || "anonymous", t = lt(e);
    return this.integrationId ? `${t}:${this.integrationId}` : t;
  }
  sendEventsQueueSync(e) {
    return this.shouldSkipSend() ? !0 : this.apiUrl === J.Fail ? (l(
      "warn",
      `Fail mode: simulating network failure (sync)${this.integrationId ? ` [${this.integrationId}]` : ""}`,
      {
        data: { events: e.events.length }
      }
    ), !1) : this.sendQueueSyncInternal(e);
  }
  async sendEventsQueue(e, t) {
    try {
      const r = await this.send(e);
      return r ? (this.clearPersistedEvents(), t?.onSuccess?.(e.events.length, e.events, e)) : (this.persistEvents(e), t?.onFailure?.()), r;
    } catch (r) {
      return r instanceof C ? (this.logPermanentError("Permanent error, not retrying", r), this.clearPersistedEvents(), t?.onFailure?.(), !1) : (this.persistEvents(e), t?.onFailure?.(), !1);
    }
  }
  async recoverPersistedEvents(e) {
    if (this.recoveryInProgress) {
      l("debug", "Recovery already in progress, skipping duplicate attempt");
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
      if (t instanceof C) {
        this.logPermanentError("Permanent error during recovery, clearing persisted events", t), this.clearPersistedEvents(), e?.onFailure?.();
        return;
      }
      l("error", "Failed to recover persisted events", { error: t });
    } finally {
      this.recoveryInProgress = !1;
    }
  }
  stop() {
  }
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
  applyBeforeBatchTransformer(e) {
    if (this.integrationId === "saas")
      return e;
    const t = this.transformers.beforeBatch;
    return t ? xe(e, t, this.integrationId || "SenderManager") : e;
  }
  async send(e) {
    if (this.shouldSkipSend())
      return this.simulateSuccessfulSend();
    const t = this.applyBeforeSendTransformer(e);
    if (!t)
      return !0;
    const r = this.applyBeforeBatchTransformer(t);
    if (!r)
      return !0;
    if (this.apiUrl === J.Fail)
      return l("warn", `Fail mode: simulating network failure${this.integrationId ? ` [${this.integrationId}]` : ""}`, {
        data: { events: r.events.length }
      }), !1;
    const { url: s, payload: i } = this.prepareRequest(r);
    try {
      return (await this.sendWithTimeout(s, i)).ok;
    } catch (o) {
      if (o instanceof C)
        throw o;
      return l("error", `Send request failed${this.integrationId ? ` [${this.integrationId}]` : ""}`, {
        error: o,
        data: {
          events: e.events.length,
          url: s.replace(/\/\/[^/]+/, "//[DOMAIN]")
        }
      }), !1;
    }
  }
  async sendWithTimeout(e, t) {
    const r = new AbortController(), s = setTimeout(() => {
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
        throw i.status >= 400 && i.status < 500 ? new C(`HTTP ${i.status}: ${i.statusText}`, i.status) : new Error(`HTTP ${i.status}: ${i.statusText}`);
      return i;
    } finally {
      clearTimeout(s);
    }
  }
  sendQueueSyncInternal(e) {
    const t = this.applyBeforeSendTransformer(e);
    if (!t)
      return !0;
    const r = this.applyBeforeBatchTransformer(t);
    if (!r)
      return !0;
    const { url: s, payload: i } = this.prepareRequest(r);
    if (i.length > 65536)
      return l(
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
      return l(
        "warn",
        `sendBeacon not available, persisting events for recovery${this.integrationId ? ` [${this.integrationId}]` : ""}`
      ), this.persistEvents(r), !1;
    const a = navigator.sendBeacon(s, o);
    return a || (l(
      "warn",
      `sendBeacon rejected request, persisting events for recovery${this.integrationId ? ` [${this.integrationId}]` : ""}`
    ), this.persistEvents(r)), a;
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
      url: this.apiUrl || "",
      payload: JSON.stringify(t)
    };
  }
  getPersistedData() {
    try {
      const e = this.getQueueStorageKey(), t = this.storeManager.getItem(e);
      if (t)
        return JSON.parse(t);
    } catch (e) {
      l("warn", `Failed to parse persisted data${this.integrationId ? ` [${this.integrationId}]` : ""}`, { error: e }), this.clearPersistedEvents();
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
          return l(
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
      }, s = this.getQueueStorageKey();
      return this.storeManager.setItem(s, JSON.stringify(r)), !!this.storeManager.getItem(s);
    } catch (t) {
      return l("warn", `Failed to persist events${this.integrationId ? ` [${this.integrationId}]` : ""}`, { error: t }), !1;
    }
  }
  clearPersistedEvents() {
    try {
      const e = this.getQueueStorageKey();
      this.storeManager.removeItem(e);
    } catch (e) {
      l("warn", `Failed to clear persisted events${this.integrationId ? ` [${this.integrationId}]` : ""}`, { error: e });
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
    (!this.lastPermanentErrorLog || this.lastPermanentErrorLog.statusCode !== t.statusCode || r - this.lastPermanentErrorLog.timestamp >= ot) && (l("error", `${e}${this.integrationId ? ` [${this.integrationId}]` : ""}`, {
      data: { status: t.statusCode, message: t.message }
    }), this.lastPermanentErrorLog = { statusCode: t.statusCode, timestamp: r });
  }
}
class Ct extends T {
  googleAnalytics;
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
  constructor(e, t = null, r = null, s = {}) {
    super(), this.googleAnalytics = t, this.emitter = r, this.transformers = s, this.dataSenders = [];
    const i = this.get("collectApiUrls");
    i?.saas && this.dataSenders.push(new Me(e, "saas", i.saas, s)), i?.custom && this.dataSenders.push(new Me(e, "custom", i.custom, s));
  }
  async recoverPersistedEvents() {
    const e = this.dataSenders.map(
      async (t) => t.recoverPersistedEvents({
        onSuccess: (r, s, i) => {
          if (s && s.length > 0) {
            const o = s.map((a) => a.id);
            this.removeProcessedEvents(o), i && this.emitEventsQueue(i);
          }
        },
        onFailure: () => {
          l("warn", "Failed to recover persisted events");
        }
      })
    );
    await Promise.allSettled(e);
  }
  track({
    type: e,
    page_url: t,
    from_page_url: r,
    scroll_data: s,
    click_data: i,
    custom_event: o,
    web_vitals: a,
    error_data: c,
    session_end_reason: u,
    viewport_data: m
  }) {
    if (!e) {
      l("error", "Event type is required - event will be ignored");
      return;
    }
    const E = this.get("sessionId");
    if (!E) {
      this.pendingEventsBuffer.length >= 100 && (this.pendingEventsBuffer.shift(), l("warn", "Pending events buffer full - dropping oldest event", {
        data: { maxBufferSize: 100 }
      })), this.pendingEventsBuffer.push({
        type: e,
        page_url: t,
        from_page_url: r,
        scroll_data: s,
        click_data: i,
        custom_event: o,
        web_vitals: a,
        error_data: c,
        session_end_reason: u,
        viewport_data: m
      });
      return;
    }
    this.lastSessionId !== E && (this.lastSessionId = E, this.sessionEventCounts = {
      total: 0,
      [d.CLICK]: 0,
      [d.PAGE_VIEW]: 0,
      [d.CUSTOM]: 0,
      [d.VIEWPORT_VISIBLE]: 0,
      [d.SCROLL]: 0
    });
    const p = e === d.SESSION_START || e === d.SESSION_END;
    if (!p && !this.checkRateLimit())
      return;
    const S = e;
    if (!p) {
      if (this.sessionEventCounts.total >= 1e3) {
        l("warn", "Session event limit reached", {
          data: {
            type: S,
            total: this.sessionEventCounts.total,
            limit: 1e3
          }
        });
        return;
      }
      const A = this.getTypeLimitForEvent(S);
      if (A) {
        const K = this.sessionEventCounts[S];
        if (K !== void 0 && K >= A) {
          l("warn", "Session event type limit reached", {
            data: {
              type: S,
              count: K,
              limit: A
            }
          });
          return;
        }
      }
    }
    if (S === d.CUSTOM && o?.name) {
      const A = this.get("config")?.maxSameEventPerMinute ?? 60;
      if (!this.checkPerEventRateLimit(o.name, A))
        return;
    }
    const je = S === d.SESSION_START, Qe = t || this.get("pageUrl"), F = this.buildEventPayload({
      type: S,
      page_url: Qe,
      from_page_url: r,
      scroll_data: s,
      click_data: i,
      custom_event: o,
      web_vitals: a,
      error_data: c,
      session_end_reason: u,
      viewport_data: m
    });
    if (F && !(!p && !this.shouldSample())) {
      if (je) {
        const A = this.get("sessionId");
        if (!A) {
          l("error", "Session start event requires sessionId - event will be ignored");
          return;
        }
        if (this.get("hasStartSession")) {
          l("warn", "Duplicate session_start detected", {
            data: { sessionId: A }
          });
          return;
        }
        this.set("hasStartSession", !0);
      }
      if (!this.isDuplicateEvent(F)) {
        if (this.get("mode") === U.QA && S === d.CUSTOM && o) {
          l("info", "Event", {
            showToClient: !0,
            data: {
              name: o.name,
              ...o.metadata && { metadata: o.metadata }
            }
          }), this.emitEvent(F);
          return;
        }
        this.addToQueue(F), p || (this.sessionEventCounts.total++, this.sessionEventCounts[S] !== void 0 && this.sessionEventCounts[S]++);
      }
    }
  }
  stop() {
    this.sendIntervalId && (clearInterval(this.sendIntervalId), this.sendIntervalId = null), this.eventsQueue = [], this.pendingEventsBuffer = [], this.recentEventFingerprints.clear(), this.rateLimitCounter = 0, this.rateLimitWindowStart = 0, this.perEventRateLimits.clear(), this.sessionEventCounts = {
      total: 0,
      [d.CLICK]: 0,
      [d.PAGE_VIEW]: 0,
      [d.CUSTOM]: 0,
      [d.VIEWPORT_VISIBLE]: 0,
      [d.SCROLL]: 0
    }, this.lastSessionId = null, this.dataSenders.forEach((e) => {
      e.stop();
    });
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
      l("warn", "Cannot flush pending events: session not initialized - keeping in buffer", {
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
    const t = this.buildEventsPayload(), r = [...this.eventsQueue], s = r.map((i) => i.id);
    if (this.dataSenders.length === 0)
      return this.removeProcessedEvents(s), this.clearSendInterval(), this.emitEventsQueue(t), e ? !0 : Promise.resolve(!0);
    if (e) {
      const o = this.dataSenders.map((a) => a.sendEventsQueueSync(t)).every((a) => a);
      return o ? (this.removeProcessedEvents(s), this.clearSendInterval(), this.emitEventsQueue(t)) : (this.removeProcessedEvents(s), this.clearSendInterval()), o;
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
        this.removeProcessedEvents(s), this.clearSendInterval();
        const a = o.some((u) => this.isSuccessfulResult(u));
        a && this.emitEventsQueue(t);
        const c = o.filter((u) => !this.isSuccessfulResult(u)).length;
        return c > 0 && l(
          "warn",
          "Async flush completed with some failures, events removed from queue and persisted per-integration",
          {
            data: { eventCount: r.length, failedCount: c }
          }
        ), a;
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
    const t = [...this.eventsQueue], r = t.map((c) => c.id), s = this.dataSenders.map(
      async (c) => c.sendEventsQueue(e, {
        onSuccess: () => {
        },
        onFailure: () => {
        }
      })
    ), i = await Promise.allSettled(s);
    this.removeProcessedEvents(r), i.some((c) => this.isSuccessfulResult(c)) && this.emitEventsQueue(e), this.eventsQueue.length === 0 && this.clearSendInterval();
    const a = i.filter((c) => !this.isSuccessfulResult(c)).length;
    a > 0 && l("warn", "Events send completed with some failures, removed from queue and persisted per-integration", {
      data: { eventCount: t.length, failedCount: a }
    });
  }
  buildEventsPayload() {
    const e = /* @__PURE__ */ new Map(), t = [];
    for (const c of this.eventsQueue) {
      const u = this.createEventSignature(c);
      e.has(u) || t.push(u), e.set(u, c);
    }
    const r = t.map((c) => e.get(c)).filter((c) => !!c).sort((c, u) => c.timestamp - u.timestamp);
    let s = {
      user_id: this.get("userId"),
      session_id: this.get("sessionId"),
      device: this.get("device"),
      events: r,
      ...this.get("config")?.globalMetadata && { global_metadata: this.get("config")?.globalMetadata }
    };
    const i = this.get("collectApiUrls"), o = !!(i?.custom || i?.saas), a = this.transformers.beforeBatch;
    if (!o && a) {
      const c = xe(s, a, "EventManager");
      c !== null && (s = c);
    }
    return s;
  }
  buildEventPayload(e) {
    const t = e.type === d.SESSION_START, r = e.page_url ?? this.get("pageUrl");
    let s = {
      id: pt(),
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
      ...t && Ae() && { utm: Ae() }
    };
    const i = this.get("collectApiUrls"), o = !!i?.custom, a = !!i?.saas, c = o || a, u = o && a, m = this.transformers.beforeSend;
    if (m && (!c || o && !u)) {
      const p = He(s, m, "EventManager");
      if (p === null)
        return null;
      s = p;
    }
    return s;
  }
  isDuplicateEvent(e) {
    const t = Date.now(), r = this.createEventFingerprint(e), s = this.recentEventFingerprints.get(r);
    return s && t - s < 500 ? (this.recentEventFingerprints.set(r, t), !0) : (this.recentEventFingerprints.set(r, t), this.recentEventFingerprints.size > 1e3 && this.pruneOldFingerprints(), this.recentEventFingerprints.size > 2e3 && (this.recentEventFingerprints.clear(), this.recentEventFingerprints.set(r, t), l("warn", "Event fingerprint cache exceeded hard limit, cleared", {
      data: { hardLimit: 2e3 }
    })), !1);
  }
  pruneOldFingerprints() {
    const e = Date.now(), t = 500 * 10;
    for (const [r, s] of this.recentEventFingerprints.entries())
      e - s > t && this.recentEventFingerprints.delete(r);
    l("debug", "Pruned old event fingerprints", {
      data: {
        remaining: this.recentEventFingerprints.size,
        cutoffMs: t
      }
    });
  }
  createEventFingerprint(e) {
    let t = `${e.type}_${e.page_url}`;
    if (e.click_data) {
      const r = Math.round((e.click_data.x || 0) / 10) * 10, s = Math.round((e.click_data.y || 0) / 10) * 10;
      t += `_click_${r}_${s}`;
    }
    return e.scroll_data && (t += `_scroll_${e.scroll_data.depth}_${e.scroll_data.direction}`), e.custom_event && (t += `_custom_${e.custom_event.name}`), e.web_vitals && (t += `_vitals_${e.web_vitals.type}`), e.error_data && (t += `_error_${e.error_data.type}_${e.error_data.message}`), t;
  }
  createEventSignature(e) {
    return this.createEventFingerprint(e);
  }
  addToQueue(e) {
    if (this.eventsQueue.push(e), this.emitEvent(e), this.eventsQueue.length > 100) {
      const t = this.eventsQueue.findIndex(
        (s) => s.type !== d.SESSION_START && s.type !== d.SESSION_END
      ), r = t >= 0 ? this.eventsQueue.splice(t, 1)[0] : this.eventsQueue.shift();
      l("warn", "Event queue overflow, oldest non-critical event removed", {
        data: {
          maxLength: 100,
          currentLength: this.eventsQueue.length,
          removedEventType: r?.type,
          wasCritical: r?.type === d.SESSION_START || r?.type === d.SESSION_END
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
    if (this.googleAnalytics && e.type === d.CUSTOM && e.custom_event) {
      if (this.get("mode") === U.QA)
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
  checkPerEventRateLimit(e, t) {
    const r = Date.now(), i = (this.perEventRateLimits.get(e) ?? []).filter((o) => r - o < 6e4);
    return i.length >= t ? (l("warn", "Per-event rate limit exceeded for custom event", {
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
    this.emitter && this.emitter.emit(ee.EVENT, e);
  }
  emitEventsQueue(e) {
    this.emitter && this.emitter.emit(ee.QUEUE, e);
  }
}
class Ot {
  /**
   * Gets or creates a unique user ID for the given project.
   * The user ID is persisted in localStorage and reused across sessions.
   *
   * @param storageManager - Storage manager instance
   * @param projectId - Project identifier for namespacing
   * @returns Persistent unique user ID
   */
  static getId(e) {
    const t = at, r = e.getItem(t);
    if (r)
      return r;
    const s = Et();
    return e.setItem(t, s), s;
  }
}
class Pt extends T {
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
      l("warn", "BroadcastChannel not supported");
      return;
    }
    const e = this.getProjectId();
    this.broadcastChannel = new BroadcastChannel(ut(e)), this.broadcastChannel.onmessage = (t) => {
      const { action: r, sessionId: s, timestamp: i, projectId: o } = t.data ?? {};
      if (o === e) {
        if (r === "session_end") {
          this.resetSessionState();
          return;
        }
        s && typeof i == "number" && i > Date.now() - 5e3 && (this.set("sessionId", s), this.set("hasStartSession", !0), this.persistSession(s, i), this.isTracking && this.setupSessionTimeout());
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
        l("warn", "Failed to broadcast session end", { error: r, data: { sessionId: e, reason: t } });
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
    return ct(this.getProjectId());
  }
  getProjectId() {
    return this.projectId;
  }
  startTracking() {
    if (this.isTracking) {
      l("warn", "Session tracking already active");
      return;
    }
    const e = this.recoverSession(), t = e ?? this.generateSessionId(), r = !!e;
    this.isTracking = !0;
    try {
      this.set("sessionId", t), this.persistSession(t), r || this.eventManager.track({
        type: d.SESSION_START
      }), this.initCrossTabSync(), this.shareSession(t), this.setupSessionTimeout(), this.setupActivityListeners(), this.setupLifecycleListeners();
    } catch (s) {
      throw this.isTracking = !1, this.clearSessionTimeout(), this.cleanupActivityListeners(), this.cleanupLifecycleListeners(), this.cleanupCrossTabSync(), this.set("sessionId", null), s;
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
      l("warn", "endSession called without active session", { data: { reason: e } }), this.resetSessionState(e);
      return;
    }
    this.eventManager.track({
      type: d.SESSION_END,
      session_end_reason: e
    }), this.eventManager.flushImmediatelySync() || l("warn", "Sync flush failed during session end, events persisted for recovery", {
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
class Dt extends T {
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
      l("warn", "Cannot start tracking on destroyed handler");
      return;
    }
    const e = this.get("config"), t = e?.integrations?.tracelog?.projectId ?? e?.integrations?.custom?.collectApiUrl ?? "default";
    if (!t)
      throw new Error("Cannot start session tracking: config not available");
    try {
      this.sessionManager = new Pt(this.storageManager, this.eventManager, t), this.sessionManager.startTracking(), this.eventManager.flushPendingEvents();
    } catch (r) {
      if (this.sessionManager) {
        try {
          this.sessionManager.destroy();
        } catch {
        }
        this.sessionManager = null;
      }
      throw l("error", "Failed to start session tracking", { error: r }), r;
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
class Vt extends T {
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
    const r = Date.now(), s = this.get("config").pageViewThrottleMs ?? 1e3;
    if (r - this.lastPageViewTime < s)
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
    const e = se(window.location.href, this.get("config").sensitiveQueryParams), t = this.extractPageViewData();
    this.lastPageViewTime = Date.now(), this.eventManager.track({
      type: d.PAGE_VIEW,
      page_url: e,
      ...t && { page_view: t }
    }), this.onTrack();
  }
  extractPageViewData() {
    const { pathname: e, search: t, hash: r } = window.location, { referrer: s } = document, { title: i } = document;
    return !s && !i && !e && !t && !r ? void 0 : {
      ...s && { referrer: s },
      ...i && { title: i },
      ...e && { pathname: e },
      ...t && { search: t },
      ...r && { hash: r }
    };
  }
}
class kt extends T {
  eventManager;
  lastClickTimes = /* @__PURE__ */ new Map();
  clickHandler;
  lastPruneTime = 0;
  constructor(e) {
    super(), this.eventManager = e;
  }
  startTracking() {
    this.clickHandler || (this.clickHandler = (e) => {
      const t = e, r = t.target, s = typeof HTMLElement < "u" && r instanceof HTMLElement ? r : typeof HTMLElement < "u" && r instanceof Node && r.parentElement instanceof HTMLElement ? r.parentElement : null;
      if (!s) {
        l("warn", "Click target not found or not an element");
        return;
      }
      if (this.shouldIgnoreElement(s))
        return;
      const i = this.get("config")?.clickThrottleMs ?? 300;
      if (i > 0 && !this.checkClickThrottle(s, i))
        return;
      const o = this.findTrackingElement(s), a = this.getRelevantClickElement(s), c = this.calculateClickCoordinates(t, s);
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
      const u = this.generateClickData(s, a, c);
      this.eventManager.track({
        type: d.CLICK,
        click_data: u
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
    const r = this.getElementSignature(e), s = Date.now();
    this.pruneThrottleCache(s);
    const i = this.lastClickTimes.get(r);
    return i !== void 0 && s - i < t ? (l("debug", "ClickHandler: Click suppressed by throttle", {
      data: {
        signature: r,
        throttleRemaining: t - (s - i)
      }
    }), !1) : (this.lastClickTimes.set(r, s), !0);
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
    for (const [r, s] of this.lastClickTimes.entries())
      s < t && this.lastClickTimes.delete(r);
    if (this.lastClickTimes.size > 1e3) {
      const r = Array.from(this.lastClickTimes.entries()).sort((o, a) => o[1] - a[1]), s = this.lastClickTimes.size - 1e3, i = r.slice(0, s);
      for (const [o] of i)
        this.lastClickTimes.delete(o);
      l("debug", "ClickHandler: Pruned throttle cache", {
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
      let s = r.tagName.toLowerCase();
      if (r.className) {
        const i = r.className.split(" ")[0];
        i && (s += `.${i}`);
      }
      t.unshift(s), r = r.parentElement;
    }
    return t.join(">") || "unknown";
  }
  findTrackingElement(e) {
    return e.hasAttribute(`${w}-name`) ? e : e.closest(`[${w}-name]`);
  }
  getRelevantClickElement(e) {
    for (const t of Ke)
      try {
        if (e.matches(t))
          return e;
        const r = e.closest(t);
        if (r)
          return r;
      } catch (r) {
        l("warn", "Invalid selector in element search", { error: r, data: { selector: t } });
        continue;
      }
    return e;
  }
  clamp(e) {
    return Math.max(0, Math.min(1, Number(e.toFixed(3))));
  }
  calculateClickCoordinates(e, t) {
    const r = t.getBoundingClientRect(), s = e.clientX, i = e.clientY, o = r.width > 0 ? this.clamp((s - r.left) / r.width) : 0, a = r.height > 0 ? this.clamp((i - r.top) / r.height) : 0;
    return { x: s, y: i, relativeX: o, relativeY: a };
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
    const { x: s, y: i, relativeX: o, relativeY: a } = r, c = this.getRelevantText(e, t), u = this.extractElementAttributes(t);
    return {
      x: s,
      y: i,
      relativeX: o,
      relativeY: a,
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
  sanitizeText(e) {
    let t = e;
    for (const r of De) {
      const s = new RegExp(r.source, r.flags);
      t = t.replace(s, "[REDACTED]");
    }
    return t;
  }
  getRelevantText(e, t) {
    const r = e.textContent?.trim() ?? "", s = t.textContent?.trim() ?? "";
    if (!r && !s)
      return "";
    let i = "";
    return r && r.length <= 255 ? i = r : s.length <= 255 ? i = s : i = s.slice(0, 252) + "...", this.sanitizeText(i);
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
    for (const s of t) {
      const i = e.getAttribute(s);
      i && (r[s] = i);
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
class Ut extends T {
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
        const s = this.getElementSelector(r);
        this.setupScrollContainer(r, s);
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
      acceptNode: (s) => {
        const i = s;
        if (!i.isConnected || !i.offsetParent)
          return NodeFilter.FILTER_SKIP;
        const o = getComputedStyle(i);
        return o.overflowY === "auto" || o.overflowY === "scroll" || o.overflow === "auto" || o.overflow === "scroll" ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      }
    });
    let r;
    for (; (r = t.nextNode()) && e.length < 10; ) {
      const s = r;
      this.isElementScrollable(s) && e.push(s);
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
      const r = t.className.split(" ").filter((s) => s.trim())[0];
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
    const s = this.getScrollTop(e), i = this.calculateScrollDepth(
      s,
      this.getScrollHeight(e),
      this.getViewportHeight(e)
    ), o = this.determineIfPrimary(e), a = {
      element: e,
      selector: t,
      isPrimary: o,
      lastScrollPos: s,
      lastDepth: i,
      lastDirection: B.DOWN,
      lastEventTime: 0,
      firstScrollEventTime: null,
      maxDepthReached: i,
      debounceTimer: null,
      listener: null
    }, c = () => {
      this.get("suppressNextScroll") || (a.firstScrollEventTime === null && (a.firstScrollEventTime = Date.now()), this.clearContainerTimer(a), a.debounceTimer = window.setTimeout(() => {
        const u = this.calculateScrollData(a);
        if (u) {
          const m = Date.now();
          this.processScrollEvent(a, u, m);
        }
        a.debounceTimer = null;
      }, 250));
    };
    a.listener = c, this.containers.push(a), e === window ? window.addEventListener("scroll", c, { passive: !0 }) : e.addEventListener("scroll", c, { passive: !0 });
  }
  processScrollEvent(e, t, r) {
    if (!this.shouldEmitScrollEvent(e, t, r))
      return;
    e.lastEventTime = r, e.lastDepth = t.depth, e.lastDirection = t.direction;
    const s = this.get("scrollEventCount") ?? 0;
    this.set("scrollEventCount", s + 1), this.eventManager.track({
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
    this.limitWarningLogged || (this.limitWarningLogged = !0, l("warn", "Max scroll events per session reached", {
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
    const s = t - r;
    return Math.min(100, Math.max(0, Math.floor(e / s * 100)));
  }
  calculateScrollData(e) {
    const { element: t, lastScrollPos: r, lastEventTime: s } = e, i = this.getScrollTop(t), o = Date.now(), a = Math.abs(i - r);
    if (a < 10 || t === window && !this.isWindowScrollable())
      return null;
    const c = this.getViewportHeight(t), u = this.getScrollHeight(t), m = this.getScrollDirection(i, r), E = this.calculateScrollDepth(i, u, c);
    let p;
    s > 0 ? p = o - s : e.firstScrollEventTime !== null ? p = o - e.firstScrollEventTime : p = 250;
    const S = Math.round(a / p * 1e3);
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
    const t = getComputedStyle(e), r = t.overflowY === "auto" || t.overflowY === "scroll" || t.overflow === "auto" || t.overflow === "scroll", s = e.scrollHeight > e.clientHeight;
    return r && s;
  }
  applyPrimaryScrollSelector(e) {
    let t;
    if (e === "window")
      t = window;
    else {
      const s = document.querySelector(e);
      if (!(s instanceof HTMLElement)) {
        l("warn", `Selector "${e}" did not match an HTMLElement`);
        return;
      }
      t = s;
    }
    this.containers.forEach((s) => {
      this.updateContainerPrimary(s, s.element === t);
    }), !this.containers.some((s) => s.element === t) && t instanceof HTMLElement && this.isElementScrollable(t) && this.setupScrollContainer(t, e);
  }
  updateContainerPrimary(e, t) {
    e.isPrimary = t;
  }
}
class Ht extends T {
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
      l("warn", "ViewportHandler: Invalid threshold, must be between 0 and 1");
      return;
    }
    if (r < 0) {
      l("warn", "ViewportHandler: Invalid minDwellTime, must be non-negative");
      return;
    }
    if (typeof IntersectionObserver > "u") {
      l("warn", "ViewportHandler: IntersectionObserver not supported in this browser");
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
        const s = document.querySelectorAll(r.selector);
        for (const i of Array.from(s)) {
          if (t >= e) {
            l("warn", "ViewportHandler: Maximum tracked elements reached", {
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
      } catch (s) {
        l("warn", `ViewportHandler: Invalid selector "${r.selector}"`, { error: s });
      }
    l("debug", "ViewportHandler: Elements tracked", {
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
      const s = this.trackedElements.get(r.target);
      s && (r.isIntersecting ? s.startTime === null && (s.startTime = performance.now(), s.timeoutId = window.setTimeout(() => {
        const i = Math.round(r.intersectionRatio * 100) / 100;
        this.fireViewportEvent(s, i);
      }, t)) : s.startTime !== null && (s.timeoutId !== null && (window.clearTimeout(s.timeoutId), s.timeoutId = null), s.startTime = null));
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
    const s = this.config?.cooldownPeriod ?? 6e4, i = Date.now();
    if (e.lastFiredTime !== null && i - e.lastFiredTime < s) {
      l("debug", "ViewportHandler: Event suppressed by cooldown period", {
        data: {
          selector: e.selector,
          cooldownRemaining: s - (i - e.lastFiredTime)
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
        l("warn", "ViewportHandler: document.body not available, skipping MutationObserver setup");
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
      const r = t, s = this.trackedElements.get(r);
      s && (s.timeoutId !== null && window.clearTimeout(s.timeoutId), this.observer?.unobserve(r), this.trackedElements.delete(r)), Array.from(this.trackedElements.keys()).filter((o) => r.contains(o)).forEach((o) => {
        const a = this.trackedElements.get(o);
        a && a.timeoutId !== null && window.clearTimeout(a.timeoutId), this.observer?.unobserve(o), this.trackedElements.delete(o);
      });
    });
  }
}
class xt extends T {
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
        l("error", "Google Analytics initialization failed", { error: r });
      }
  }
  trackEvent(e, t) {
    if (!(!e?.trim() || !this.isInitialized || typeof window.gtag != "function"))
      try {
        const r = Array.isArray(t) ? { items: t } : t;
        window.gtag("event", e, r);
      } catch (r) {
        l("error", "Google Analytics event tracking failed", { error: r });
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
      const s = document.createElement("script");
      s.id = "tracelog-ga-script", s.async = !0, s.src = `https://www.googletagmanager.com/gtag/js?id=${e}`, s.onload = () => {
        t();
      }, s.onerror = () => {
        r(new Error("Failed to load Google Analytics script"));
      }, document.head.appendChild(s);
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
class Ft {
  storage;
  sessionStorageRef;
  fallbackStorage = /* @__PURE__ */ new Map();
  fallbackSessionStorage = /* @__PURE__ */ new Map();
  hasQuotaExceededError = !1;
  constructor() {
    this.storage = this.initializeStorage("localStorage"), this.sessionStorageRef = this.initializeStorage("sessionStorage"), this.storage || l("warn", "localStorage not available, using memory fallback"), this.sessionStorageRef || l("warn", "sessionStorage not available, using memory fallback");
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
        if (this.hasQuotaExceededError = !0, l("warn", "localStorage quota exceeded, attempting cleanup", {
          data: { key: e, valueSize: t.length }
        }), this.cleanupOldData())
          try {
            if (this.storage) {
              this.storage.setItem(e, t);
              return;
            }
          } catch (i) {
            l("error", "localStorage quota exceeded even after cleanup - data will not persist", {
              error: i,
              data: { key: e, valueSize: t.length }
            });
          }
        else
          l("error", "localStorage quota exceeded and no data to cleanup - data will not persist", {
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
      l("error", "Failed to clear storage", { error: e }), this.fallbackStorage.clear();
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
      const r = ["tracelog_session_", "tracelog_user_id", "tracelog_device_id", "tracelog_config"], s = e.filter((i) => !r.some((o) => i.startsWith(o)));
      return s.length > 0 ? (s.slice(0, 5).forEach((o) => {
        try {
          this.storage.removeItem(o);
        } catch {
        }
      }), !0) : !1;
    } catch (e) {
      return l("error", "Failed to cleanup old data", { error: e }), !1;
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
      r instanceof DOMException && r.name === "QuotaExceededError" && l("error", "sessionStorage quota exceeded - data will not persist", {
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
class $t extends T {
  eventManager;
  reportedByNav = /* @__PURE__ */ new Map();
  navigationHistory = [];
  // FIFO queue for tracking navigation order
  observers = [];
  vitalThresholds;
  lastLongTaskSentAt = 0;
  constructor(e) {
    super(), this.eventManager = e, this.vitalThresholds = ye(ne);
  }
  async startTracking() {
    const e = this.get("config"), t = e?.webVitalsMode ?? ne;
    this.vitalThresholds = ye(t), e?.webVitalsThresholds && (this.vitalThresholds = { ...this.vitalThresholds, ...e.webVitalsThresholds }), await this.initWebVitals(), this.observeLongTasks();
  }
  stopTracking() {
    this.observers.forEach((e, t) => {
      try {
        e.disconnect();
      } catch (r) {
        l("warn", "Failed to disconnect performance observer", { error: r, data: { observerIndex: t } });
      }
    }), this.observers.length = 0, this.reportedByNav.clear(), this.navigationHistory.length = 0;
  }
  observeWebVitalsFallback() {
    this.reportTTFB(), this.safeObserve(
      "largest-contentful-paint",
      (r) => {
        const s = r.getEntries(), i = s[s.length - 1];
        i && this.sendVital({ type: "LCP", value: Number(i.startTime.toFixed(2)) });
      },
      { type: "largest-contentful-paint", buffered: !0 },
      !0
    );
    let e = 0, t = this.getNavigationId();
    this.safeObserve(
      "layout-shift",
      (r) => {
        const s = this.getNavigationId();
        s !== t && (e = 0, t = s);
        const i = r.getEntries();
        for (const o of i) {
          if (o.hadRecentInput === !0)
            continue;
          const a = typeof o.value == "number" ? o.value : 0;
          e += a;
        }
        this.sendVital({ type: "CLS", value: Number(e.toFixed(2)) });
      },
      { type: "layout-shift", buffered: !0 }
    ), this.safeObserve(
      "paint",
      (r) => {
        for (const s of r.getEntries())
          s.name === "first-contentful-paint" && this.sendVital({ type: "FCP", value: Number(s.startTime.toFixed(2)) });
      },
      { type: "paint", buffered: !0 },
      !0
    ), this.safeObserve(
      "event",
      (r) => {
        let s = 0;
        const i = r.getEntries();
        for (const o of i) {
          const a = (o.processingEnd ?? 0) - (o.startTime ?? 0);
          s = Math.max(s, a);
        }
        s > 0 && this.sendVital({ type: "INP", value: Number(s.toFixed(2)) });
      },
      { type: "event", buffered: !0 }
    );
  }
  async initWebVitals() {
    try {
      const { onLCP: e, onCLS: t, onFCP: r, onTTFB: s, onINP: i } = await Promise.resolve().then(() => ur), o = (a) => (c) => {
        const u = Number(c.value.toFixed(2));
        this.sendVital({ type: a, value: u });
      };
      e(o("LCP"), { reportAllChanges: !1 }), t(o("CLS"), { reportAllChanges: !1 }), r(o("FCP"), { reportAllChanges: !1 }), s(o("TTFB"), { reportAllChanges: !1 }), i(o("INP"), { reportAllChanges: !1 });
    } catch (e) {
      l("warn", "Failed to load web-vitals library, using fallback", { error: e }), this.observeWebVitalsFallback();
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
      l("warn", "Failed to report TTFB", { error: e });
    }
  }
  observeLongTasks() {
    this.safeObserve(
      "longtask",
      (e) => {
        const t = e.getEntries();
        for (const r of t) {
          const s = Number(r.duration.toFixed(2)), i = Date.now();
          i - this.lastLongTaskSentAt >= ht && (this.shouldSendVital("LONG_TASK", s) && this.trackWebVital("LONG_TASK", s), this.lastLongTaskSentAt = i);
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
      else if (this.reportedByNav.set(t, /* @__PURE__ */ new Set([e.type])), this.navigationHistory.push(t), this.navigationHistory.length > ft) {
        const i = this.navigationHistory.shift();
        i && this.reportedByNav.delete(i);
      }
    }
    this.trackWebVital(e.type, e.value);
  }
  trackWebVital(e, t) {
    if (!Number.isFinite(t)) {
      l("warn", "Invalid web vital value", { data: { type: e, value: t } });
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
      const t = e.startTime || performance.now(), r = Math.random().toString(36).substr(2, 5);
      return `${t.toFixed(2)}_${window.location.pathname}_${r}`;
    } catch (e) {
      return l("warn", "Failed to get navigation ID", { error: e }), null;
    }
  }
  isObserverSupported(e) {
    if (typeof PerformanceObserver > "u") return !1;
    const t = PerformanceObserver.supportedEntryTypes;
    return !t || t.includes(e);
  }
  safeObserve(e, t, r, s = !1) {
    try {
      if (!this.isObserverSupported(e))
        return !1;
      const i = new PerformanceObserver((o, a) => {
        try {
          t(o, a);
        } catch (c) {
          l("warn", "Observer callback failed", {
            error: c,
            data: { type: e }
          });
        }
        if (s)
          try {
            a.disconnect();
          } catch {
          }
      });
      return i.observe(r ?? { type: e, buffered: !0 }), s || this.observers.push(i), !0;
    } catch (i) {
      return l("warn", "Failed to create performance observer", {
        error: i,
        data: { type: e }
      }), !1;
    }
  }
  shouldSendVital(e, t) {
    if (typeof t != "number" || !Number.isFinite(t))
      return l("warn", "Invalid web vital value", { data: { type: e, value: t } }), !1;
    const r = this.vitalThresholds[e];
    return !(typeof r == "number" && t <= r);
  }
}
class Bt extends T {
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
    if (e - this.burstWindowStart > st && (this.errorBurstCounter = 0, this.burstWindowStart = e), this.errorBurstCounter++, this.errorBurstCounter > it)
      return this.burstBackoffUntil = e + Te, l("warn", "Error burst detected - entering cooldown", {
        data: {
          errorsInWindow: this.errorBurstCounter,
          cooldownMs: Te
        }
      }), !1;
    const r = this.get("config")?.errorSampling ?? Ve;
    return Math.random() < r;
  }
  handleError = (e) => {
    if (!this.shouldSample())
      return;
    const t = this.sanitize(e.message || "Unknown error");
    this.shouldSuppressError(V.JS_ERROR, t) || this.eventManager.track({
      type: d.ERROR,
      error_data: {
        type: V.JS_ERROR,
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
    this.shouldSuppressError(V.PROMISE_REJECTION, r) || this.eventManager.track({
      type: d.ERROR,
      error_data: {
        type: V.PROMISE_REJECTION,
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
    let t = e.length > pe ? e.slice(0, pe) + "..." : e;
    for (const r of De) {
      const s = new RegExp(r.source, r.flags);
      t = t.replace(s, "[REDACTED]");
    }
    return t;
  }
  shouldSuppressError(e, t) {
    const r = Date.now(), s = `${e}:${t}`, i = this.recentErrors.get(s);
    return i && r - i < Se ? (this.recentErrors.set(s, r), !0) : (this.recentErrors.set(s, r), this.recentErrors.size > nt ? (this.recentErrors.clear(), this.recentErrors.set(s, r), !1) : (this.recentErrors.size > W && this.pruneOldErrors(), !1));
  }
  pruneOldErrors() {
    const e = Date.now();
    for (const [s, i] of this.recentErrors.entries())
      e - i > Se && this.recentErrors.delete(s);
    if (this.recentErrors.size <= W)
      return;
    const t = Array.from(this.recentErrors.entries()).sort((s, i) => s[1] - i[1]), r = this.recentErrors.size - W;
    for (let s = 0; s < r; s += 1) {
      const i = t[s];
      i && this.recentErrors.delete(i[0]);
    }
  }
}
class Wt extends T {
  isInitialized = !1;
  suppressNextScrollTimer = null;
  emitter = new Rt();
  transformers = {};
  managers = {};
  handlers = {};
  integrations = {};
  get initialized() {
    return this.isInitialized;
  }
  async init(e = {}) {
    if (!this.isInitialized) {
      this.managers.storage = new Ft();
      try {
        this.setupState(e), await this.setupIntegrations(), this.managers.event = new Ct(
          this.managers.storage,
          this.integrations.googleAnalytics,
          this.emitter,
          this.transformers
        ), this.initializeHandlers(), await this.managers.event.recoverPersistedEvents().catch((t) => {
          l("warn", "Failed to recover persisted events", { error: t });
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
    const { valid: s, error: i, sanitizedMetadata: o } = Mt(e, r);
    if (!s) {
      if (this.get("mode") === U.QA)
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
  destroy(e = !1) {
    !this.isInitialized && !e || (this.integrations.googleAnalytics?.cleanup(), Object.values(this.handlers).filter(Boolean).forEach((t) => {
      try {
        t.stopTracking();
      } catch (r) {
        l("warn", "Failed to stop tracking", { error: r });
      }
    }), this.suppressNextScrollTimer && (clearTimeout(this.suppressNextScrollTimer), this.suppressNextScrollTimer = null), this.managers.event?.flushImmediatelySync(), this.managers.event?.stop(), this.emitter.removeAllListeners(), this.transformers.beforeSend = void 0, this.transformers.beforeBatch = void 0, this.set("hasStartSession", !1), this.set("suppressNextScroll", !1), this.set("sessionId", null), this.isInitialized = !1, this.handlers = {});
  }
  setupState(e = {}) {
    this.set("config", e);
    const t = Ot.getId(this.managers.storage);
    this.set("userId", t);
    const r = Tt(e);
    this.set("collectApiUrls", r);
    const s = rt();
    this.set("device", s);
    const i = se(window.location.href, e.sensitiveQueryParams);
    this.set("pageUrl", i);
    const o = mt() ? U.QA : void 0;
    o && this.set("mode", o);
  }
  async setupIntegrations() {
    if (this.get("config").integrations?.googleAnalytics?.measurementId?.trim())
      try {
        this.integrations.googleAnalytics = new xt(), await this.integrations.googleAnalytics.initialize();
      } catch {
        this.integrations.googleAnalytics = void 0;
      }
  }
  initializeHandlers() {
    const e = this.get("config"), t = e.disabledEvents ?? [];
    this.handlers.session = new Dt(
      this.managers.storage,
      this.managers.event
    ), this.handlers.session.startTracking();
    const r = () => {
      this.set("suppressNextScroll", !0), this.suppressNextScrollTimer && clearTimeout(this.suppressNextScrollTimer), this.suppressNextScrollTimer = window.setTimeout(() => {
        this.set("suppressNextScroll", !1);
      }, 500);
    };
    this.handlers.pageView = new Vt(this.managers.event, r), this.handlers.pageView.startTracking(), this.handlers.click = new kt(this.managers.event), this.handlers.click.startTracking(), t.includes("scroll") || (this.handlers.scroll = new Ut(this.managers.event), this.handlers.scroll.startTracking()), t.includes("web_vitals") || (this.handlers.performance = new $t(this.managers.event), this.handlers.performance.startTracking().catch((s) => {
      l("warn", "Failed to start performance tracking", { error: s });
    })), t.includes("error") || (this.handlers.error = new Bt(this.managers.event), this.handlers.error.startTracking()), e.viewport && (this.handlers.viewport = new Ht(this.managers.event), this.handlers.viewport.startTracking());
  }
}
const N = [], y = [];
let g = null, R = !1, P = !1;
const Gt = async (n) => {
  if (!(typeof window > "u" || typeof document > "u") && window.__traceLogDisabled !== !0 && !g && !R) {
    R = !0;
    try {
      const e = yt(n ?? {}), t = new Wt();
      try {
        N.forEach(({ event: i, callback: o }) => {
          t.on(i, o);
        }), N.length = 0, y.forEach(({ hook: i, fn: o }) => {
          i === "beforeSend" ? t.setTransformer("beforeSend", o) : t.setTransformer("beforeBatch", o);
        }), y.length = 0;
        const r = t.init(e), s = new Promise((i, o) => {
          setTimeout(() => {
            o(new Error("[TraceLog] Initialization timeout after 10000ms"));
          }, 1e4);
        });
        await Promise.race([r, s]), g = t;
      } catch (r) {
        try {
          t.destroy(!0);
        } catch (s) {
          l("error", "Failed to cleanup partially initialized app", { error: s });
        }
        throw r;
      }
    } catch (e) {
      throw g = null, e;
    } finally {
      R = !1;
    }
  }
}, Xt = (n, e) => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!g)
      throw new Error("[TraceLog] TraceLog not initialized. Please call init() first.");
    if (P)
      throw new Error("[TraceLog] Cannot send events while TraceLog is being destroyed");
    g.sendCustomEvent(n, e);
  }
}, zt = (n, e) => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!g || R) {
      N.push({ event: n, callback: e });
      return;
    }
    g.on(n, e);
  }
}, jt = (n, e) => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!g) {
      const t = N.findIndex((r) => r.event === n && r.callback === e);
      t !== -1 && N.splice(t, 1);
      return;
    }
    g.off(n, e);
  }
};
function Qt(n, e) {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!g || R) {
      const t = y.findIndex((r) => r.hook === n);
      t !== -1 && y.splice(t, 1), y.push({ hook: n, fn: e });
      return;
    }
    if (P)
      throw new Error("[TraceLog] Cannot set transformers while TraceLog is being destroyed");
    n === "beforeSend" ? g.setTransformer("beforeSend", e) : g.setTransformer("beforeBatch", e);
  }
}
const Kt = (n) => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!g) {
      const e = y.findIndex((t) => t.hook === n);
      e !== -1 && y.splice(e, 1);
      return;
    }
    if (P)
      throw new Error("[TraceLog] Cannot remove transformers while TraceLog is being destroyed");
    g.removeTransformer(n);
  }
}, Yt = () => typeof window > "u" || typeof document > "u" ? !1 : g !== null, qt = () => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (P)
      throw new Error("[TraceLog] Destroy operation already in progress");
    if (!g)
      throw new Error("[TraceLog] App not initialized");
    P = !0;
    try {
      g.destroy(), g = null, R = !1, N.length = 0, y.length = 0;
    } catch (n) {
      g = null, R = !1, N.length = 0, y.length = 0, l("warn", "Error during destroy, forced cleanup completed", { error: n });
    } finally {
      P = !1;
    }
  }
}, Zt = (n) => {
  typeof window > "u" || typeof document > "u" || gt(n);
}, Ar = {
  init: Gt,
  event: Xt,
  on: zt,
  off: jt,
  setTransformer: Qt,
  removeTransformer: Kt,
  isInitialized: Yt,
  destroy: qt,
  setQaMode: Zt
};
var oe, Fe = -1, D = function(n) {
  addEventListener("pageshow", (function(e) {
    e.persisted && (Fe = e.timeStamp, n(e));
  }), !0);
}, he = function() {
  var n = self.performance && performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
  if (n && n.responseStart > 0 && n.responseStart < performance.now()) return n;
}, z = function() {
  var n = he();
  return n && n.activationStart || 0;
}, v = function(n, e) {
  var t = he(), r = "navigate";
  return Fe >= 0 ? r = "back-forward-cache" : t && (document.prerendering || z() > 0 ? r = "prerender" : document.wasDiscarded ? r = "restore" : t.type && (r = t.type.replace(/_/g, "-"))), { name: n, value: e === void 0 ? -1 : e, rating: "good", delta: 0, entries: [], id: "v4-".concat(Date.now(), "-").concat(Math.floor(8999999999999 * Math.random()) + 1e12), navigationType: r };
}, x = function(n, e, t) {
  try {
    if (PerformanceObserver.supportedEntryTypes.includes(n)) {
      var r = new PerformanceObserver((function(s) {
        Promise.resolve().then((function() {
          e(s.getEntries());
        }));
      }));
      return r.observe(Object.assign({ type: n, buffered: !0 }, t || {})), r;
    }
  } catch {
  }
}, I = function(n, e, t, r) {
  var s, i;
  return function(o) {
    e.value >= 0 && (o || r) && ((i = e.value - (s || 0)) || s === void 0) && (s = e.value, e.delta = i, e.rating = (function(a, c) {
      return a > c[1] ? "poor" : a > c[0] ? "needs-improvement" : "good";
    })(e.value, t), n(e));
  };
}, fe = function(n) {
  requestAnimationFrame((function() {
    return requestAnimationFrame((function() {
      return n();
    }));
  }));
}, j = function(n) {
  document.addEventListener("visibilitychange", (function() {
    document.visibilityState === "hidden" && n();
  }));
}, me = function(n) {
  var e = !1;
  return function() {
    e || (n(), e = !0);
  };
}, O = -1, Re = function() {
  return document.visibilityState !== "hidden" || document.prerendering ? 1 / 0 : 0;
}, X = function(n) {
  document.visibilityState === "hidden" && O > -1 && (O = n.type === "visibilitychange" ? n.timeStamp : 0, Jt());
}, Ne = function() {
  addEventListener("visibilitychange", X, !0), addEventListener("prerenderingchange", X, !0);
}, Jt = function() {
  removeEventListener("visibilitychange", X, !0), removeEventListener("prerenderingchange", X, !0);
}, $e = function() {
  return O < 0 && (O = Re(), Ne(), D((function() {
    setTimeout((function() {
      O = Re(), Ne();
    }), 0);
  }))), { get firstHiddenTime() {
    return O;
  } };
}, Q = function(n) {
  document.prerendering ? addEventListener("prerenderingchange", (function() {
    return n();
  }), !0) : n();
}, ae = [1800, 3e3], Be = function(n, e) {
  e = e || {}, Q((function() {
    var t, r = $e(), s = v("FCP"), i = x("paint", (function(o) {
      o.forEach((function(a) {
        a.name === "first-contentful-paint" && (i.disconnect(), a.startTime < r.firstHiddenTime && (s.value = Math.max(a.startTime - z(), 0), s.entries.push(a), t(!0)));
      }));
    }));
    i && (t = I(n, s, ae, e.reportAllChanges), D((function(o) {
      s = v("FCP"), t = I(n, s, ae, e.reportAllChanges), fe((function() {
        s.value = performance.now() - o.timeStamp, t(!0);
      }));
    })));
  }));
}, le = [0.1, 0.25], er = function(n, e) {
  e = e || {}, Be(me((function() {
    var t, r = v("CLS", 0), s = 0, i = [], o = function(c) {
      c.forEach((function(u) {
        if (!u.hadRecentInput) {
          var m = i[0], E = i[i.length - 1];
          s && u.startTime - E.startTime < 1e3 && u.startTime - m.startTime < 5e3 ? (s += u.value, i.push(u)) : (s = u.value, i = [u]);
        }
      })), s > r.value && (r.value = s, r.entries = i, t());
    }, a = x("layout-shift", o);
    a && (t = I(n, r, le, e.reportAllChanges), j((function() {
      o(a.takeRecords()), t(!0);
    })), D((function() {
      s = 0, r = v("CLS", 0), t = I(n, r, le, e.reportAllChanges), fe((function() {
        return t();
      }));
    })), setTimeout(t, 0));
  })));
}, We = 0, q = 1 / 0, $ = 0, tr = function(n) {
  n.forEach((function(e) {
    e.interactionId && (q = Math.min(q, e.interactionId), $ = Math.max($, e.interactionId), We = $ ? ($ - q) / 7 + 1 : 0);
  }));
}, Ge = function() {
  return oe ? We : performance.interactionCount || 0;
}, rr = function() {
  "interactionCount" in performance || oe || (oe = x("event", tr, { type: "event", buffered: !0, durationThreshold: 0 }));
}, _ = [], G = /* @__PURE__ */ new Map(), Xe = 0, nr = function() {
  var n = Math.min(_.length - 1, Math.floor((Ge() - Xe) / 50));
  return _[n];
}, sr = [], ir = function(n) {
  if (sr.forEach((function(s) {
    return s(n);
  })), n.interactionId || n.entryType === "first-input") {
    var e = _[_.length - 1], t = G.get(n.interactionId);
    if (t || _.length < 10 || n.duration > e.latency) {
      if (t) n.duration > t.latency ? (t.entries = [n], t.latency = n.duration) : n.duration === t.latency && n.startTime === t.entries[0].startTime && t.entries.push(n);
      else {
        var r = { id: n.interactionId, latency: n.duration, entries: [n] };
        G.set(r.id, r), _.push(r);
      }
      _.sort((function(s, i) {
        return i.latency - s.latency;
      })), _.length > 10 && _.splice(10).forEach((function(s) {
        return G.delete(s.id);
      }));
    }
  }
}, ze = function(n) {
  var e = self.requestIdleCallback || self.setTimeout, t = -1;
  return n = me(n), document.visibilityState === "hidden" ? n() : (t = e(n), j(n)), t;
}, ce = [200, 500], or = function(n, e) {
  "PerformanceEventTiming" in self && "interactionId" in PerformanceEventTiming.prototype && (e = e || {}, Q((function() {
    var t;
    rr();
    var r, s = v("INP"), i = function(a) {
      ze((function() {
        a.forEach(ir);
        var c = nr();
        c && c.latency !== s.value && (s.value = c.latency, s.entries = c.entries, r());
      }));
    }, o = x("event", i, { durationThreshold: (t = e.durationThreshold) !== null && t !== void 0 ? t : 40 });
    r = I(n, s, ce, e.reportAllChanges), o && (o.observe({ type: "first-input", buffered: !0 }), j((function() {
      i(o.takeRecords()), r(!0);
    })), D((function() {
      Xe = Ge(), _.length = 0, G.clear(), s = v("INP"), r = I(n, s, ce, e.reportAllChanges);
    })));
  })));
}, ue = [2500, 4e3], Z = {}, ar = function(n, e) {
  e = e || {}, Q((function() {
    var t, r = $e(), s = v("LCP"), i = function(c) {
      e.reportAllChanges || (c = c.slice(-1)), c.forEach((function(u) {
        u.startTime < r.firstHiddenTime && (s.value = Math.max(u.startTime - z(), 0), s.entries = [u], t());
      }));
    }, o = x("largest-contentful-paint", i);
    if (o) {
      t = I(n, s, ue, e.reportAllChanges);
      var a = me((function() {
        Z[s.id] || (i(o.takeRecords()), o.disconnect(), Z[s.id] = !0, t(!0));
      }));
      ["keydown", "click"].forEach((function(c) {
        addEventListener(c, (function() {
          return ze(a);
        }), { once: !0, capture: !0 });
      })), j(a), D((function(c) {
        s = v("LCP"), t = I(n, s, ue, e.reportAllChanges), fe((function() {
          s.value = performance.now() - c.timeStamp, Z[s.id] = !0, t(!0);
        }));
      }));
    }
  }));
}, de = [800, 1800], lr = function n(e) {
  document.prerendering ? Q((function() {
    return n(e);
  })) : document.readyState !== "complete" ? addEventListener("load", (function() {
    return n(e);
  }), !0) : setTimeout(e, 0);
}, cr = function(n, e) {
  e = e || {};
  var t = v("TTFB"), r = I(n, t, de, e.reportAllChanges);
  lr((function() {
    var s = he();
    s && (t.value = Math.max(s.responseStart - z(), 0), t.entries = [s], r(!0), D((function() {
      t = v("TTFB", 0), (r = I(n, t, de, e.reportAllChanges))(!0);
    })));
  }));
};
const ur = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  CLSThresholds: le,
  FCPThresholds: ae,
  INPThresholds: ce,
  LCPThresholds: ue,
  TTFBThresholds: de,
  onCLS: er,
  onFCP: Be,
  onINP: or,
  onLCP: ar,
  onTTFB: cr
}, Symbol.toStringTag, { value: "Module" }));
export {
  h as AppConfigValidationError,
  dr as DEFAULT_SESSION_TIMEOUT,
  ne as DEFAULT_WEB_VITALS_MODE,
  L as DeviceType,
  ee as EmitterEvent,
  V as ErrorType,
  d as EventType,
  wr as InitializationTimeoutError,
  M as IntegrationValidationError,
  _r as MAX_ARRAY_LENGTH,
  gr as MAX_CUSTOM_EVENT_ARRAY_SIZE,
  mr as MAX_CUSTOM_EVENT_KEYS,
  hr as MAX_CUSTOM_EVENT_NAME_LENGTH,
  fr as MAX_CUSTOM_EVENT_STRING_SIZE,
  pr as MAX_METADATA_NESTING_DEPTH,
  Er as MAX_NESTED_OBJECT_KEYS,
  Sr as MAX_STRING_LENGTH,
  Tr as MAX_STRING_LENGTH_IN_ARRAY,
  U as Mode,
  De as PII_PATTERNS,
  C as PermanentError,
  ge as SamplingRateValidationError,
  B as ScrollDirection,
  Je as SessionTimeoutValidationError,
  J as SpecialApiUrl,
  H as TraceLogValidationError,
  yr as WEB_VITALS_GOOD_THRESHOLDS,
  we as WEB_VITALS_NEEDS_IMPROVEMENT_THRESHOLDS,
  dt as WEB_VITALS_POOR_THRESHOLDS,
  ye as getWebVitalsThresholds,
  vr as isPrimaryScrollEvent,
  Ir as isSecondaryScrollEvent,
  Ar as tracelog
};
