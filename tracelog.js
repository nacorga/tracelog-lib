const jt = 120, Yt = 8192, Kt = 10, qt = 10, Zt = 20, Jt = 1;
const er = 1e3, tr = 500, rr = 100;
const v = "data-tlog", Ue = [
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
], He = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"], xe = [
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
const h = {
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
}, Fe = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<embed\b[^>]*>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi
];
var q = /* @__PURE__ */ ((n) => (n.Localhost = "localhost:8080", n.Fail = "localhost:9999", n))(q || {}), w = /* @__PURE__ */ ((n) => (n.Mobile = "mobile", n.Tablet = "tablet", n.Desktop = "desktop", n.Unknown = "unknown", n))(w || {}), Z = /* @__PURE__ */ ((n) => (n.EVENT = "event", n.QUEUE = "queue", n))(Z || {});
class R extends Error {
  constructor(e, t) {
    super(e), this.statusCode = t, this.name = "PermanentError", Error.captureStackTrace && Error.captureStackTrace(this, R);
  }
}
var u = /* @__PURE__ */ ((n) => (n.PAGE_VIEW = "page_view", n.CLICK = "click", n.SCROLL = "scroll", n.SESSION_START = "session_start", n.SESSION_END = "session_end", n.CUSTOM = "custom", n.WEB_VITALS = "web_vitals", n.ERROR = "error", n.VIEWPORT_VISIBLE = "viewport_visible", n))(u || {}), H = /* @__PURE__ */ ((n) => (n.UP = "up", n.DOWN = "down", n))(H || {}), P = /* @__PURE__ */ ((n) => (n.JS_ERROR = "js_error", n.PROMISE_REJECTION = "promise_rejection", n))(P || {}), D = /* @__PURE__ */ ((n) => (n.QA = "qa", n))(D || {});
function nr(n) {
  return n.type === u.SCROLL && "scroll_data" in n && n.scroll_data.is_primary === !0;
}
function sr(n) {
  return n.type === u.SCROLL && "scroll_data" in n && n.scroll_data.is_primary === !1;
}
class V extends Error {
  constructor(e, t, r) {
    super(e), this.errorCode = t, this.layer = r, this.name = this.constructor.name, Error.captureStackTrace && Error.captureStackTrace(this, this.constructor);
  }
}
class E extends V {
  constructor(e, t = "config") {
    super(e, "APP_CONFIG_INVALID", t);
  }
}
class Ge extends V {
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
class ir extends V {
  constructor(e, t, r = "runtime") {
    super(e, "INITIALIZATION_TIMEOUT", r), this.timeoutMs = t;
  }
}
const We = (n, e) => {
  if (e) {
    if (e instanceof Error) {
      const t = e.message.replace(/\s+at\s+.*$/gm, "").replace(/\(.*?:\d+:\d+\)/g, "");
      return `[TraceLog] ${n}: ${t}`;
    }
    return `[TraceLog] ${n}: ${e instanceof Error ? e.message : "Unknown error"}`;
  }
  return `[TraceLog] ${n}`;
}, a = (n, e, t) => {
  const { error: r, data: s, showToClient: i = !1 } = t ?? {}, o = r ? We(e, r) : `[TraceLog] ${e}`, l = n === "error" ? "error" : n === "warn" ? "warn" : "log";
  if (!(n === "debug" || n === "info" && !i))
    if (s !== void 0) {
      const c = Be(s);
      console[l](o, c);
    } else s !== void 0 ? console[l](o, s) : console[l](o);
}, Be = (n) => {
  const e = {}, t = ["token", "password", "secret", "key", "apikey", "api_key", "sessionid", "session_id"];
  for (const [r, s] of Object.entries(n)) {
    const i = r.toLowerCase();
    t.some((o) => i.includes(o)) ? e[r] = "[REDACTED]" : e[r] = s;
  }
  return e;
};
let J, we;
const Xe = () => {
  typeof window < "u" && !J && (J = window.matchMedia("(pointer: coarse)"), we = window.matchMedia("(hover: none)"));
}, $e = () => {
  try {
    const n = navigator;
    if (n.userAgentData && typeof n.userAgentData.mobile == "boolean")
      return n.userAgentData.platform && /ipad|tablet/i.test(n.userAgentData.platform) ? w.Tablet : n.userAgentData.mobile ? w.Mobile : w.Desktop;
    Xe();
    const e = window.innerWidth, t = J?.matches ?? !1, r = we?.matches ?? !1, s = "ontouchstart" in window || navigator.maxTouchPoints > 0, i = navigator.userAgent.toLowerCase(), o = /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/.test(i), l = /tablet|ipad|android(?!.*mobile)/.test(i);
    return e <= 767 || o && s ? w.Mobile : e >= 768 && e <= 1024 || l || t && r && s ? w.Tablet : w.Desktop;
  } catch (n) {
    return a("warn", "Device detection failed, defaulting to desktop", { error: n }), w.Desktop;
  }
}, y = "tlog", Ee = `${y}:qa_mode`, ze = `${y}:uid`, Qe = (n) => n ? `${y}:${n}:queue` : `${y}:queue`, je = (n) => n ? `${y}:${n}:session` : `${y}:session`, Ye = (n) => n ? `${y}:${n}:broadcast` : `${y}:broadcast`, ye = {
  LCP: 4e3,
  FCP: 1800,
  CLS: 0.25,
  INP: 200,
  TTFB: 800,
  LONG_TASK: 50
}, Ke = 1e3, le = [
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
], fe = 500, ge = 5e3, x = 50, qe = x * 2, Le = 1, Ze = 1e3, Je = 10, me = 5e3, et = 6e4, Se = "tlog_mode", tt = "qa", rt = () => {
  if (sessionStorage.getItem(Ee) === "true")
    return !0;
  const e = new URLSearchParams(window.location.search), r = e.get(Se) === tt;
  if (r) {
    sessionStorage.setItem(Ee, "true"), e.delete(Se);
    const s = e.toString(), i = `${window.location.pathname}${s ? "?" + s : ""}${window.location.hash}`;
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
}, _e = () => {
  const n = new URLSearchParams(window.location.search), e = {};
  return He.forEach((r) => {
    const s = n.get(r);
    if (s) {
      const i = r.split("utm_")[1];
      e[i] = s;
    }
  }), Object.keys(e).length ? e : void 0;
}, nt = () => typeof crypto < "u" && crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (n) => {
  const e = Math.random() * 16 | 0;
  return (n === "x" ? e : e & 3 | 8).toString(16);
}), st = () => {
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
}, Te = (n, e = !1) => {
  try {
    const t = new URL(n), r = t.protocol === "https:", s = t.protocol === "http:";
    return r || e && s;
  } catch {
    return !1;
  }
}, it = (n) => {
  if (n.integrations?.tracelog?.projectId) {
    const s = new URL(window.location.href).hostname.split(".");
    if (s.length === 0)
      throw new Error("Invalid URL");
    const i = n.integrations.tracelog.projectId, o = s.slice(-2).join("."), l = `https://${i}.${o}/collect`;
    if (!Te(l))
      throw new Error("Invalid URL");
    return l;
  }
  const e = n.integrations?.custom?.collectApiUrl;
  if (e) {
    const t = n.integrations?.custom?.allowHttp ?? !1;
    if (!Te(e, t))
      throw new Error("Invalid URL");
    return e;
  }
  return "";
}, ee = (n, e = []) => {
  try {
    const t = new URL(n), r = t.searchParams, s = [.../* @__PURE__ */ new Set([...xe, ...e])];
    let i = !1;
    const o = [];
    return s.forEach((c) => {
      r.has(c) && (r.delete(c), i = !0, o.push(c));
    }), !i && n.includes("?") ? n : (t.search = r.toString(), t.toString());
  } catch (t) {
    return a("warn", "URL normalization failed, returning original", { error: t, data: { url: n.slice(0, 100) } }), n;
  }
}, pe = (n) => {
  if (!n || typeof n != "string" || n.trim().length === 0)
    return "";
  let e = n;
  n.length > 1e3 && (e = n.slice(0, Math.max(0, 1e3)));
  let t = 0;
  for (const s of Fe) {
    const i = e;
    e = e.replace(s, ""), i !== e && t++;
  }
  return t > 0 && a("warn", "XSS patterns detected and removed", {
    data: {
      patternMatches: t,
      originalValue: n.slice(0, 100)
    }
  }), e = e.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#x27;").replaceAll("/", "&#x2F;"), e.trim();
}, te = (n, e = 0) => {
  if (e > 3 || n == null)
    return null;
  if (typeof n == "string")
    return pe(n);
  if (typeof n == "number")
    return !Number.isFinite(n) || n < -Number.MAX_SAFE_INTEGER || n > Number.MAX_SAFE_INTEGER ? 0 : n;
  if (typeof n == "boolean")
    return n;
  if (Array.isArray(n))
    return n.slice(0, 100).map((s) => te(s, e + 1)).filter((s) => s !== null);
  if (typeof n == "object") {
    const t = {}, s = Object.entries(n).slice(0, 20);
    for (const [i, o] of s) {
      const l = pe(i);
      if (l) {
        const c = te(o, e + 1);
        c !== null && (t[l] = c);
      }
    }
    return t;
  }
  return null;
}, ot = (n) => {
  if (typeof n != "object" || n === null)
    return {};
  try {
    const e = te(n);
    return typeof e == "object" && e !== null ? e : {};
  } catch (e) {
    const t = e instanceof Error ? e.message : String(e);
    throw new Error(`[TraceLog] Metadata sanitization failed: ${t}`);
  }
}, at = (n) => {
  if (n !== void 0 && (n === null || typeof n != "object"))
    throw new E("Configuration must be an object", "config");
  if (n) {
    if (n.sessionTimeout !== void 0 && (typeof n.sessionTimeout != "number" || n.sessionTimeout < 3e4 || n.sessionTimeout > 864e5))
      throw new Ge(h.INVALID_SESSION_TIMEOUT, "config");
    if (n.globalMetadata !== void 0 && (typeof n.globalMetadata != "object" || n.globalMetadata === null))
      throw new E(h.INVALID_GLOBAL_METADATA, "config");
    if (n.integrations && ct(n.integrations), n.sensitiveQueryParams !== void 0) {
      if (!Array.isArray(n.sensitiveQueryParams))
        throw new E(h.INVALID_SENSITIVE_QUERY_PARAMS, "config");
      for (const e of n.sensitiveQueryParams)
        if (typeof e != "string")
          throw new E("All sensitive query params must be strings", "config");
    }
    if (n.errorSampling !== void 0 && (typeof n.errorSampling != "number" || n.errorSampling < 0 || n.errorSampling > 1))
      throw new he(h.INVALID_ERROR_SAMPLING_RATE, "config");
    if (n.samplingRate !== void 0 && (typeof n.samplingRate != "number" || n.samplingRate < 0 || n.samplingRate > 1))
      throw new he(h.INVALID_SAMPLING_RATE, "config");
    if (n.primaryScrollSelector !== void 0) {
      if (typeof n.primaryScrollSelector != "string" || !n.primaryScrollSelector.trim())
        throw new E(h.INVALID_PRIMARY_SCROLL_SELECTOR, "config");
      if (n.primaryScrollSelector !== "window")
        try {
          document.querySelector(n.primaryScrollSelector);
        } catch {
          throw new E(
            `${h.INVALID_PRIMARY_SCROLL_SELECTOR_SYNTAX}: "${n.primaryScrollSelector}"`,
            "config"
          );
        }
    }
    if (n.pageViewThrottleMs !== void 0 && (typeof n.pageViewThrottleMs != "number" || n.pageViewThrottleMs < 0))
      throw new E(h.INVALID_PAGE_VIEW_THROTTLE, "config");
    if (n.clickThrottleMs !== void 0 && (typeof n.clickThrottleMs != "number" || n.clickThrottleMs < 0))
      throw new E(h.INVALID_CLICK_THROTTLE, "config");
    if (n.maxSameEventPerMinute !== void 0 && (typeof n.maxSameEventPerMinute != "number" || n.maxSameEventPerMinute <= 0))
      throw new E(h.INVALID_MAX_SAME_EVENT_PER_MINUTE, "config");
    n.viewport !== void 0 && lt(n.viewport);
  }
}, lt = (n) => {
  if (typeof n != "object" || n === null)
    throw new E(h.INVALID_VIEWPORT_CONFIG, "config");
  if (!n.elements || !Array.isArray(n.elements))
    throw new E(h.INVALID_VIEWPORT_ELEMENTS, "config");
  if (n.elements.length === 0)
    throw new E(h.INVALID_VIEWPORT_ELEMENTS, "config");
  const e = /* @__PURE__ */ new Set();
  for (const t of n.elements) {
    if (!t.selector || typeof t.selector != "string" || !t.selector.trim())
      throw new E(h.INVALID_VIEWPORT_ELEMENT, "config");
    const r = t.selector.trim();
    if (e.has(r))
      throw new E(
        `Duplicate viewport selector found: "${r}". Each selector should appear only once.`,
        "config"
      );
    if (e.add(r), t.id !== void 0 && (typeof t.id != "string" || !t.id.trim()))
      throw new E(h.INVALID_VIEWPORT_ELEMENT_ID, "config");
    if (t.name !== void 0 && (typeof t.name != "string" || !t.name.trim()))
      throw new E(h.INVALID_VIEWPORT_ELEMENT_NAME, "config");
  }
  if (n.threshold !== void 0 && (typeof n.threshold != "number" || n.threshold < 0 || n.threshold > 1))
    throw new E(h.INVALID_VIEWPORT_THRESHOLD, "config");
  if (n.minDwellTime !== void 0 && (typeof n.minDwellTime != "number" || n.minDwellTime < 0))
    throw new E(h.INVALID_VIEWPORT_MIN_DWELL_TIME, "config");
  if (n.cooldownPeriod !== void 0 && (typeof n.cooldownPeriod != "number" || n.cooldownPeriod < 0))
    throw new E(h.INVALID_VIEWPORT_COOLDOWN_PERIOD, "config");
  if (n.maxTrackedElements !== void 0 && (typeof n.maxTrackedElements != "number" || n.maxTrackedElements <= 0))
    throw new E(h.INVALID_VIEWPORT_MAX_TRACKED_ELEMENTS, "config");
}, ct = (n) => {
  if (n) {
    if (n.tracelog && (!n.tracelog.projectId || typeof n.tracelog.projectId != "string" || n.tracelog.projectId.trim() === ""))
      throw new M(h.INVALID_TRACELOG_PROJECT_ID, "config");
    if (n.custom) {
      if (!n.custom.collectApiUrl || typeof n.custom.collectApiUrl != "string" || n.custom.collectApiUrl.trim() === "")
        throw new M(h.INVALID_CUSTOM_API_URL, "config");
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
        throw new M(h.INVALID_GOOGLE_ANALYTICS_ID, "config");
      if (!n.googleAnalytics.measurementId.trim().match(/^(G-|UA-)/))
        throw new M('Google Analytics measurement ID must start with "G-" or "UA-"', "config");
    }
  }
}, ut = (n) => {
  at(n);
  const e = {
    ...n ?? {},
    sessionTimeout: n?.sessionTimeout ?? 9e5,
    globalMetadata: n?.globalMetadata ?? {},
    sensitiveQueryParams: n?.sensitiveQueryParams ?? [],
    errorSampling: n?.errorSampling ?? Le,
    samplingRate: n?.samplingRate ?? 1,
    pageViewThrottleMs: n?.pageViewThrottleMs ?? 1e3,
    clickThrottleMs: n?.clickThrottleMs ?? 300,
    maxSameEventPerMinute: n?.maxSameEventPerMinute ?? 60
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
}, dt = (n) => {
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
}, Me = (n, e = 0) => {
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
        } else if (!t.every((o) => dt(o)))
          return !1;
        continue;
      }
      if (r === "object" && e === 0) {
        if (!Me(t, e + 1))
          return !1;
        continue;
      }
      return !1;
    }
  }
  return !0;
}, ht = (n) => typeof n != "string" ? {
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
} : { valid: !0 }, Ie = (n, e, t) => {
  const r = ot(e), s = `${t} "${n}" metadata error`;
  if (!Me(r))
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
  for (const [l, c] of Object.entries(r)) {
    if (Array.isArray(c)) {
      if (c.length > 10)
        return {
          valid: !1,
          error: `${s}: array property "${l}" is too large (max 10 items).`
        };
      for (const d of c)
        if (typeof d == "string" && d.length > 500)
          return {
            valid: !1,
            error: `${s}: array property "${l}" contains strings that are too long (max 500 characters).`
          };
    }
    if (typeof c == "string" && c.length > 1e3)
      return {
        valid: !1,
        error: `${s}: property "${l}" is too long (max 1000 characters).`
      };
  }
  return {
    valid: !0,
    sanitizedMetadata: r
  };
}, Et = (n, e, t) => {
  if (Array.isArray(e)) {
    const r = [], s = `${t} "${n}" metadata error`;
    for (let i = 0; i < e.length; i++) {
      const o = e[i];
      if (typeof o != "object" || o === null || Array.isArray(o))
        return {
          valid: !1,
          error: `${s}: array item at index ${i} must be an object.`
        };
      const l = Ie(n, o, t);
      if (!l.valid)
        return {
          valid: !1,
          error: `${s}: array item at index ${i} is invalid: ${l.error}`
        };
      l.sanitizedMetadata && r.push(l.sanitizedMetadata);
    }
    return {
      valid: !0,
      sanitizedMetadata: r
    };
  }
  return Ie(n, e, t);
}, ft = (n, e) => {
  const t = ht(n);
  if (!t.valid)
    return a("error", "Event name validation failed", {
      showToClient: !0,
      data: { eventName: n, error: t.error }
    }), t;
  if (!e)
    return { valid: !0 };
  const r = Et(n, e, "customEvent");
  return r.valid || a("error", "Event metadata validation failed", {
    showToClient: !0,
    data: {
      eventName: n,
      error: r.error
    }
  }), r;
};
class gt {
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
const j = {};
class S {
  get(e) {
    return j[e];
  }
  set(e, t) {
    j[e] = t;
  }
  getState() {
    return { ...j };
  }
}
class mt extends S {
  storeManager;
  lastPermanentErrorLog = null;
  constructor(e) {
    super(), this.storeManager = e;
  }
  getQueueStorageKey() {
    const e = this.get("userId") || "anonymous";
    return Qe(e);
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
    const { url: r, payload: s } = this.prepareRequest(e);
    try {
      return (await this.sendWithTimeout(r, s)).ok;
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
        throw i.status >= 400 && i.status < 500 ? new R(`HTTP ${i.status}: ${i.statusText}`, i.status) : new Error(`HTTP ${i.status}: ${i.statusText}`);
      return i;
    } finally {
      clearTimeout(s);
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
    const s = new Blob([r], { type: "application/json" });
    if (!this.isSendBeaconAvailable())
      return a("warn", "sendBeacon not available, persisting events for recovery"), this.persistEvents(e), !1;
    const i = navigator.sendBeacon(t, s);
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
    return {
      user_id: e.userId,
      session_id: e.sessionId,
      device: e.device,
      events: e.events,
      ...e.global_metadata && { global_metadata: e.global_metadata }
    };
  }
  persistEvents(e) {
    try {
      const t = {
        userId: e.user_id,
        sessionId: e.session_id,
        device: e.device,
        events: e.events,
        timestamp: Date.now(),
        ...e.global_metadata && { global_metadata: e.global_metadata }
      }, r = this.getQueueStorageKey();
      return this.storeManager.setItem(r, JSON.stringify(t)), !!this.storeManager.getItem(r);
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
    (!this.lastPermanentErrorLog || this.lastPermanentErrorLog.statusCode !== t.statusCode || r - this.lastPermanentErrorLog.timestamp >= et) && (a("error", e, {
      data: { status: t.statusCode, message: t.message }
    }), this.lastPermanentErrorLog = { statusCode: t.statusCode, timestamp: r });
  }
}
class St extends S {
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
    super(), this.googleAnalytics = t, this.dataSender = new mt(e), this.emitter = r;
  }
  async recoverPersistedEvents() {
    await this.dataSender.recoverPersistedEvents({
      onSuccess: (e, t, r) => {
        if (t && t.length > 0) {
          const s = t.map((i) => i.id);
          this.removeProcessedEvents(s), r && this.emitEventsQueue(r);
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
    scroll_data: s,
    click_data: i,
    custom_event: o,
    web_vitals: l,
    error_data: c,
    session_end_reason: d,
    viewport_data: _
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
        scroll_data: s,
        click_data: i,
        custom_event: o,
        web_vitals: l,
        error_data: c,
        session_end_reason: d,
        viewport_data: _
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
    const L = e === u.SESSION_START || e === u.SESSION_END;
    if (!L && !this.checkRateLimit())
      return;
    const m = e;
    if (!L) {
      if (this.sessionEventCounts.total >= 1e3) {
        a("warn", "Session event limit reached", {
          data: {
            type: m,
            total: this.sessionEventCounts.total,
            limit: 1e3
          }
        });
        return;
      }
      const A = this.getTypeLimitForEvent(m);
      if (A) {
        const Q = this.sessionEventCounts[m];
        if (Q !== void 0 && Q >= A) {
          a("warn", "Session event type limit reached", {
            data: {
              type: m,
              count: Q,
              limit: A
            }
          });
          return;
        }
      }
    }
    if (m === u.CUSTOM && o?.name) {
      const A = this.get("config")?.maxSameEventPerMinute ?? 60;
      if (!this.checkPerEventRateLimit(o.name, A))
        return;
    }
    const Ve = m === u.SESSION_START, ke = t || this.get("pageUrl"), z = this.buildEventPayload({
      type: m,
      page_url: ke,
      from_page_url: r,
      scroll_data: s,
      click_data: i,
      custom_event: o,
      web_vitals: l,
      error_data: c,
      session_end_reason: d,
      viewport_data: _
    });
    if (!(!L && !this.shouldSample())) {
      if (Ve) {
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
        if (this.get("mode") === D.QA && m === u.CUSTOM && o) {
          console.log("[TraceLog] Event", {
            name: o.name,
            ...o.metadata && { metadata: o.metadata }
          }), this.emitEvent(z);
          return;
        }
        this.addToQueue(z), L || (this.sessionEventCounts.total++, this.sessionEventCounts[m] !== void 0 && this.sessionEventCounts[m]++);
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
    const t = this.buildEventsPayload(), r = [...this.eventsQueue], s = r.map((i) => i.id);
    if (e) {
      const i = this.dataSender.sendEventsQueueSync(t);
      return i && (this.removeProcessedEvents(s), this.clearSendInterval(), this.emitEventsQueue(t)), i;
    } else
      return this.dataSender.sendEventsQueue(t, {
        onSuccess: () => {
          this.removeProcessedEvents(s), this.clearSendInterval(), this.emitEventsQueue(t);
        },
        onFailure: () => {
          a("warn", "Async flush failed", {
            data: { eventCount: r.length }
          });
        }
      });
  }
  async sendEventsQueue() {
    if (!this.get("sessionId") || this.eventsQueue.length === 0)
      return;
    const e = this.buildEventsPayload(), t = [...this.eventsQueue], r = t.map((s) => s.id);
    await this.dataSender.sendEventsQueue(e, {
      onSuccess: () => {
        this.removeProcessedEvents(r), this.emitEventsQueue(e);
      },
      onFailure: () => {
        a("warn", "Events send failed, keeping in queue", {
          data: { eventCount: t.length }
        });
      }
    });
  }
  buildEventsPayload() {
    const e = /* @__PURE__ */ new Map(), t = [];
    for (const s of this.eventsQueue) {
      const i = this.createEventSignature(s);
      e.has(i) || t.push(i), e.set(i, s);
    }
    const r = t.map((s) => e.get(s)).filter((s) => !!s).sort((s, i) => s.timestamp - i.timestamp);
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
      id: st(),
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
      ...t && _e() && { utm: _e() }
    };
  }
  /**
   * Checks if event is a duplicate using time-based cache
   * Tracks recent event fingerprints with timestamp-based cleanup
   */
  isDuplicateEvent(e) {
    const t = Date.now(), r = this.createEventFingerprint(e), s = this.recentEventFingerprints.get(r);
    return s && t - s < 500 ? (this.recentEventFingerprints.set(r, t), !0) : (this.recentEventFingerprints.set(r, t), this.recentEventFingerprints.size > 1e3 && this.pruneOldFingerprints(), this.recentEventFingerprints.size > 2e3 && (this.recentEventFingerprints.clear(), this.recentEventFingerprints.set(r, t), a("warn", "Event fingerprint cache exceeded hard limit, cleared", {
      data: { hardLimit: 2e3 }
    })), !1);
  }
  /**
   * Prunes old fingerprints from cache based on timestamp
   * Removes entries older than 10x the duplicate threshold (5 seconds)
   */
  pruneOldFingerprints() {
    const e = Date.now(), t = 500 * 10;
    for (const [r, s] of this.recentEventFingerprints.entries())
      e - s > t && this.recentEventFingerprints.delete(r);
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
        (s) => s.type !== u.SESSION_START && s.type !== u.SESSION_END
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
class _t {
  /**
   * Gets or creates a unique user ID for the given project.
   * The user ID is persisted in localStorage and reused across sessions.
   *
   * @param storageManager - Storage manager instance
   * @param projectId - Project identifier for namespacing
   * @returns Persistent unique user ID
   */
  static getId(e) {
    const t = ze, r = e.getItem(t);
    if (r)
      return r;
    const s = nt();
    return e.setItem(t, s), s;
  }
}
class Tt extends S {
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
    this.broadcastChannel = new BroadcastChannel(Ye(e)), this.broadcastChannel.onmessage = (t) => {
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
    return je(this.getProjectId());
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
class pt extends S {
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
      this.sessionManager = new Tt(this.storageManager, this.eventManager, t), this.sessionManager.startTracking(), this.eventManager.flushPendingEvents();
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
class It extends S {
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
    const e = window.location.href, t = ee(e, this.get("config").sensitiveQueryParams);
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
      type: u.PAGE_VIEW,
      page_url: this.get("pageUrl"),
      from_page_url: i,
      ...o && { page_view: o }
    });
  };
  trackInitialPageView() {
    const e = ee(window.location.href, this.get("config").sensitiveQueryParams), t = this.extractPageViewData();
    this.lastPageViewTime = Date.now(), this.eventManager.track({
      type: u.PAGE_VIEW,
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
class vt extends S {
  eventManager;
  clickHandler;
  lastClickTimes = /* @__PURE__ */ new Map();
  constructor(e) {
    super(), this.eventManager = e;
  }
  startTracking() {
    this.clickHandler || (this.clickHandler = (e) => {
      const t = e, r = t.target, s = typeof HTMLElement < "u" && r instanceof HTMLElement ? r : typeof HTMLElement < "u" && r instanceof Node && r.parentElement instanceof HTMLElement ? r.parentElement : null;
      if (!s) {
        a("warn", "Click target not found or not an element");
        return;
      }
      if (this.shouldIgnoreElement(s))
        return;
      const i = this.get("config")?.clickThrottleMs ?? 300;
      if (i > 0 && !this.checkClickThrottle(s, i))
        return;
      const o = this.findTrackingElement(s), l = this.getRelevantClickElement(s), c = this.calculateClickCoordinates(t, s);
      if (o) {
        const _ = this.extractTrackingData(o);
        if (_) {
          const g = this.createCustomEventData(_);
          this.eventManager.track({
            type: u.CUSTOM,
            custom_event: {
              name: g.name,
              ...g.value && { metadata: { value: g.value } }
            }
          });
        }
      }
      const d = this.generateClickData(s, l, c);
      this.eventManager.track({
        type: u.CLICK,
        click_data: d
      });
    }, window.addEventListener("click", this.clickHandler, !0));
  }
  stopTracking() {
    this.clickHandler && (window.removeEventListener("click", this.clickHandler, !0), this.clickHandler = void 0), this.lastClickTimes.clear();
  }
  shouldIgnoreElement(e) {
    return e.hasAttribute(`${v}-ignore`) ? !0 : e.closest(`[${v}-ignore]`) !== null;
  }
  /**
   * Checks per-element click throttling to prevent double-clicks and rapid spam
   * Returns true if the click should be tracked, false if throttled
   */
  checkClickThrottle(e, t) {
    const r = this.getElementSignature(e), s = Date.now(), i = this.lastClickTimes.get(r);
    return i !== void 0 && s - i < t ? (a("debug", "ClickHandler: Click suppressed by throttle", {
      data: {
        signature: r,
        throttleRemaining: t - (s - i)
      }
    }), !1) : (this.lastClickTimes.set(r, s), !0);
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
    const r = e.getAttribute(`${v}-name`);
    return r ? `[${v}-name="${r}"]` : this.getElementPath(e);
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
    return e.hasAttribute(`${v}-name`) ? e : e.closest(`[${v}-name]`);
  }
  getRelevantClickElement(e) {
    for (const t of Ue)
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
    const r = t.getBoundingClientRect(), s = e.clientX, i = e.clientY, o = r.width > 0 ? this.clamp((s - r.left) / r.width) : 0, l = r.height > 0 ? this.clamp((i - r.top) / r.height) : 0;
    return { x: s, y: i, relativeX: o, relativeY: l };
  }
  extractTrackingData(e) {
    const t = e.getAttribute(`${v}-name`), r = e.getAttribute(`${v}-value`);
    if (t)
      return {
        element: e,
        name: t,
        ...r && { value: r }
      };
  }
  generateClickData(e, t, r) {
    const { x: s, y: i, relativeX: o, relativeY: l } = r, c = this.getRelevantText(e, t), d = this.extractElementAttributes(t);
    return {
      x: s,
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
    for (const r of le) {
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
class At extends S {
  eventManager;
  containers = [];
  limitWarningLogged = !1;
  minDepthChange = 5;
  minIntervalMs = 500;
  maxEventsPerSession = 120;
  windowScrollableCache = null;
  retryTimeoutId = null;
  constructor(e) {
    super(), this.eventManager = e;
  }
  startTracking() {
    this.limitWarningLogged = !1, this.applyConfigOverrides(), this.set("scrollEventCount", 0), this.tryDetectScrollContainers(0);
  }
  stopTracking() {
    this.retryTimeoutId !== null && (clearTimeout(this.retryTimeoutId), this.retryTimeoutId = null);
    for (const e of this.containers)
      this.clearContainerTimer(e), e.element instanceof Window ? window.removeEventListener("scroll", e.listener) : e.element.removeEventListener("scroll", e.listener);
    this.containers.length = 0, this.set("scrollEventCount", 0), this.limitWarningLogged = !1, this.windowScrollableCache = null;
  }
  tryDetectScrollContainers(e) {
    const t = this.findScrollableElements();
    if (t.length > 0) {
      for (const r of t) {
        const s = this.getElementSelector(r);
        this.setupScrollContainer(r, s);
      }
      this.applyPrimaryScrollSelectorIfConfigured();
      return;
    }
    if (e < 5) {
      this.retryTimeoutId = window.setTimeout(() => {
        this.retryTimeoutId = null, this.tryDetectScrollContainers(e + 1);
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
    if (this.containers.some((d) => d.element === e) || e !== window && !this.isElementScrollable(e))
      return;
    const s = () => {
      this.get("suppressNextScroll") || (this.clearContainerTimer(c), c.debounceTimer = window.setTimeout(() => {
        const d = this.calculateScrollData(c);
        if (d) {
          const _ = Date.now();
          this.processScrollEvent(c, d, _);
        }
        c.debounceTimer = null;
      }, 250));
    }, i = this.getScrollTop(e), o = this.calculateScrollDepth(
      i,
      this.getScrollHeight(e),
      this.getViewportHeight(e)
    ), l = this.determineIfPrimary(e), c = {
      element: e,
      selector: t,
      isPrimary: l,
      lastScrollPos: i,
      lastDepth: o,
      lastDirection: H.DOWN,
      lastEventTime: 0,
      maxDepthReached: o,
      debounceTimer: null,
      listener: s
    };
    this.containers.push(c), e instanceof Window ? window.addEventListener("scroll", s, { passive: !0 }) : e.addEventListener("scroll", s, { passive: !0 });
  }
  processScrollEvent(e, t, r) {
    if (!this.shouldEmitScrollEvent(e, t, r))
      return;
    e.lastEventTime = r, e.lastDepth = t.depth, e.lastDirection = t.direction;
    const s = this.get("scrollEventCount") ?? 0;
    this.set("scrollEventCount", s + 1), this.eventManager.track({
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
    return this.windowScrollableCache !== null ? this.windowScrollableCache : (this.windowScrollableCache = document.documentElement.scrollHeight > window.innerHeight, this.windowScrollableCache);
  }
  clearContainerTimer(e) {
    e.debounceTimer !== null && (clearTimeout(e.debounceTimer), e.debounceTimer = null);
  }
  getScrollDirection(e, t) {
    return e > t ? H.DOWN : H.UP;
  }
  calculateScrollDepth(e, t, r) {
    if (t <= r)
      return 0;
    const s = t - r;
    return Math.min(100, Math.max(0, Math.floor(e / s * 100)));
  }
  calculateScrollData(e) {
    const { element: t, lastScrollPos: r, lastEventTime: s } = e, i = this.getScrollTop(t), o = Date.now(), l = Math.abs(i - r);
    if (l < 10 || t === window && !this.isWindowScrollable())
      return null;
    const c = this.getViewportHeight(t), d = this.getScrollHeight(t), _ = this.getScrollDirection(i, r), g = this.calculateScrollDepth(i, d, c), L = s > 0 ? o - s : 0, m = L > 0 ? Math.round(l / L * 1e3) : 0;
    return g > e.maxDepthReached && (e.maxDepthReached = g), e.lastScrollPos = i, {
      depth: g,
      direction: _,
      velocity: m,
      max_depth_reached: e.maxDepthReached
    };
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
    const t = getComputedStyle(e), r = t.overflowY === "auto" || t.overflowY === "scroll" || t.overflowX === "auto" || t.overflowX === "scroll" || t.overflow === "auto" || t.overflow === "scroll", s = e.scrollHeight > e.clientHeight || e.scrollWidth > e.clientWidth;
    return r && s;
  }
  applyPrimaryScrollSelector(e) {
    let t;
    if (e === "window")
      t = window;
    else {
      const s = document.querySelector(e);
      if (!(s instanceof HTMLElement)) {
        a("warn", `Selector "${e}" did not match an HTMLElement`);
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
class wt extends S {
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
        const s = document.querySelectorAll(r.selector);
        for (const i of Array.from(s)) {
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
          i.hasAttribute(`${v}-ignore`) || this.trackedElements.has(i) || (this.trackedElements.set(i, {
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
        a("warn", `ViewportHandler: Invalid selector "${r.selector}"`, { error: s });
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
      const s = this.trackedElements.get(r.target);
      s && (r.isIntersecting ? s.startTime === null && (s.startTime = performance.now(), s.timeoutId = window.setTimeout(() => {
        this.fireViewportEvent(s, r.intersectionRatio);
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
      a("debug", "ViewportHandler: Event suppressed by cooldown period", {
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
      const r = t, s = this.trackedElements.get(r);
      s && (s.timeoutId !== null && window.clearTimeout(s.timeoutId), this.observer?.unobserve(r), this.trackedElements.delete(r)), Array.from(this.trackedElements.keys()).filter((o) => r.contains(o)).forEach((o) => {
        const l = this.trackedElements.get(o);
        l && l.timeoutId !== null && window.clearTimeout(l.timeoutId), this.observer?.unobserve(o), this.trackedElements.delete(o);
      });
    });
  }
}
class yt extends S {
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
class Lt {
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
      const r = ["tracelog_session_", "tracelog_user_id", "tracelog_device_id", "tracelog_config"], s = e.filter((i) => !r.some((o) => i.startsWith(o)));
      return s.length > 0 ? (s.slice(0, 5).forEach((o) => {
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
class Mt extends S {
  eventManager;
  reportedByNav = /* @__PURE__ */ new Map();
  observers = [];
  lastLongTaskSentAt = 0;
  vitalThresholds = ye;
  constructor(e) {
    super(), this.eventManager = e;
  }
  async startTracking() {
    await this.initWebVitals(), this.observeLongTasks();
  }
  stopTracking() {
    this.observers.forEach((e, t) => {
      try {
        e.disconnect();
      } catch (r) {
        a("warn", "Failed to disconnect performance observer", { error: r, data: { observerIndex: t } });
      }
    }), this.observers.length = 0, this.reportedByNav.clear();
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
          const l = typeof o.value == "number" ? o.value : 0;
          e += l;
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
          const l = (o.processingEnd ?? 0) - (o.startTime ?? 0);
          s = Math.max(s, l);
        }
        s > 0 && this.sendVital({ type: "INP", value: Number(s.toFixed(2)) });
      },
      { type: "event", buffered: !0 }
    );
  }
  async initWebVitals() {
    try {
      const { onLCP: e, onCLS: t, onFCP: r, onTTFB: s, onINP: i } = await Promise.resolve().then(() => Qt), o = (l) => (c) => {
        const d = Number(c.value.toFixed(2));
        this.sendVital({ type: l, value: d });
      };
      e(o("LCP"), { reportAllChanges: !1 }), t(o("CLS"), { reportAllChanges: !1 }), r(o("FCP"), { reportAllChanges: !1 }), s(o("TTFB"), { reportAllChanges: !1 }), i(o("INP"), { reportAllChanges: !1 });
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
          const s = Number(r.duration.toFixed(2)), i = Date.now();
          i - this.lastLongTaskSentAt >= Ke && (this.shouldSendVital("LONG_TASK", s) && this.trackWebVital("LONG_TASK", s), this.lastLongTaskSentAt = i);
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
      r ? r.add(e.type) : this.reportedByNav.set(t, /* @__PURE__ */ new Set([e.type]));
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
  safeObserve(e, t, r, s = !1) {
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
        if (s)
          try {
            l.disconnect();
          } catch {
          }
      });
      return i.observe(r ?? { type: e, buffered: !0 }), s || this.observers.push(i), !0;
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
class Nt extends S {
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
    if (e - this.burstWindowStart > Ze && (this.errorBurstCounter = 0, this.burstWindowStart = e), this.errorBurstCounter++, this.errorBurstCounter > Je)
      return this.burstBackoffUntil = e + me, a("warn", "Error burst detected - entering cooldown", {
        data: {
          errorsInWindow: this.errorBurstCounter,
          cooldownMs: me
        }
      }), !1;
    const r = this.get("config")?.errorSampling ?? Le;
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
    let t = e.length > fe ? e.slice(0, fe) + "..." : e;
    for (const r of le) {
      const s = new RegExp(r.source, r.flags);
      t = t.replace(s, "[REDACTED]");
    }
    return t;
  }
  shouldSuppressError(e, t) {
    const r = Date.now(), s = `${e}:${t}`, i = this.recentErrors.get(s);
    return i && r - i < ge ? (this.recentErrors.set(s, r), !0) : (this.recentErrors.set(s, r), this.recentErrors.size > qe ? (this.recentErrors.clear(), this.recentErrors.set(s, r), !1) : (this.recentErrors.size > x && this.pruneOldErrors(), !1));
  }
  pruneOldErrors() {
    const e = Date.now();
    for (const [s, i] of this.recentErrors.entries())
      e - i > ge && this.recentErrors.delete(s);
    if (this.recentErrors.size <= x)
      return;
    const t = Array.from(this.recentErrors.entries()).sort((s, i) => s[1] - i[1]), r = this.recentErrors.size - x;
    for (let s = 0; s < r; s += 1) {
      const i = t[s];
      i && this.recentErrors.delete(i[0]);
    }
  }
}
class Rt extends S {
  isInitialized = !1;
  suppressNextScrollTimer = null;
  emitter = new gt();
  managers = {};
  handlers = {};
  integrations = {};
  get initialized() {
    return this.isInitialized;
  }
  async init(e = {}) {
    if (!this.isInitialized) {
      this.managers.storage = new Lt();
      try {
        this.setupState(e), await this.setupIntegrations(), this.managers.event = new St(this.managers.storage, this.integrations.googleAnalytics, this.emitter), this.initializeHandlers(), await this.managers.event.recoverPersistedEvents().catch((t) => {
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
    const { valid: r, error: s, sanitizedMetadata: i } = ft(e, t);
    if (!r) {
      if (this.get("mode") === D.QA)
        throw new Error(`[TraceLog] Custom event "${e}" validation failed: ${s}`);
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
    const t = _t.getId(this.managers.storage);
    this.set("userId", t);
    const r = it(e);
    this.set("collectApiUrl", r);
    const s = $e();
    this.set("device", s);
    const i = ee(window.location.href, e.sensitiveQueryParams);
    this.set("pageUrl", i);
    const o = rt() ? D.QA : void 0;
    o && this.set("mode", o);
  }
  async setupIntegrations() {
    if (this.get("config").integrations?.googleAnalytics?.measurementId?.trim())
      try {
        this.integrations.googleAnalytics = new yt(), await this.integrations.googleAnalytics.initialize();
      } catch {
        this.integrations.googleAnalytics = void 0;
      }
  }
  initializeHandlers() {
    this.handlers.session = new pt(
      this.managers.storage,
      this.managers.event
    ), this.handlers.session.startTracking();
    const e = () => {
      this.set("suppressNextScroll", !0), this.suppressNextScrollTimer && clearTimeout(this.suppressNextScrollTimer), this.suppressNextScrollTimer = window.setTimeout(() => {
        this.set("suppressNextScroll", !1);
      }, 500);
    };
    this.handlers.pageView = new It(this.managers.event, e), this.handlers.pageView.startTracking(), this.handlers.click = new vt(this.managers.event), this.handlers.click.startTracking(), this.handlers.scroll = new At(this.managers.event), this.handlers.scroll.startTracking(), this.handlers.performance = new Mt(this.managers.event), this.handlers.performance.startTracking().catch((t) => {
      a("warn", "Failed to start performance tracking", { error: t });
    }), this.handlers.error = new Nt(this.managers.event), this.handlers.error.startTracking(), this.get("config").viewport && (this.handlers.viewport = new wt(this.managers.event), this.handlers.viewport.startTracking());
  }
}
const N = [];
let f = null, b = !1, F = !1;
const Ot = async (n) => {
  if (typeof window > "u" || typeof document > "u")
    throw new Error("[TraceLog] This library can only be used in a browser environment");
  if (!window.__traceLogDisabled && !f && !b) {
    b = !0;
    try {
      const e = ut(n ?? {}), t = new Rt();
      try {
        N.forEach(({ event: i, callback: o }) => {
          t.on(i, o);
        }), N.length = 0;
        const r = t.init(e), s = new Promise((i, o) => {
          setTimeout(() => {
            o(new Error("[TraceLog] Initialization timeout after 10000ms"));
          }, 1e4);
        });
        await Promise.race([r, s]), f = t;
      } catch (r) {
        try {
          t.destroy(!0);
        } catch (s) {
          a("error", "Failed to cleanup partially initialized app", { error: s });
        }
        throw r;
      }
    } catch (e) {
      throw f = null, e;
    } finally {
      b = !1;
    }
  }
}, bt = (n, e) => {
  if (!f)
    throw new Error("[TraceLog] TraceLog not initialized. Please call init() first.");
  if (F)
    throw new Error("[TraceLog] Cannot send events while TraceLog is being destroyed");
  f.sendCustomEvent(n, e);
}, Ct = (n, e) => {
  if (!f || b) {
    N.push({ event: n, callback: e });
    return;
  }
  f.on(n, e);
}, Pt = (n, e) => {
  if (!f) {
    const t = N.findIndex((r) => r.event === n && r.callback === e);
    t !== -1 && N.splice(t, 1);
    return;
  }
  f.off(n, e);
}, Dt = () => f !== null, Vt = () => {
  if (F)
    throw new Error("[TraceLog] Destroy operation already in progress");
  if (!f)
    throw new Error("[TraceLog] App not initialized");
  F = !0;
  try {
    f.destroy(), f = null, b = !1, N.length = 0;
  } catch (n) {
    f = null, b = !1, N.length = 0, a("warn", "Error during destroy, forced cleanup completed", { error: n });
  } finally {
    F = !1;
  }
}, or = {
  WEB_VITALS_THRESHOLDS: ye
  // Business thresholds for performance analysis
}, ar = {
  PII_PATTERNS: le
  // Patterns for sensitive data protection
}, lr = {
  LOW_ACTIVITY_EVENT_COUNT: 50,
  HIGH_ACTIVITY_EVENT_COUNT: 1e3,
  MIN_EVENTS_FOR_DYNAMIC_CALCULATION: 100,
  MIN_EVENTS_FOR_TREND_ANALYSIS: 30,
  BOUNCE_RATE_SESSION_THRESHOLD: 1,
  // Sessions with 1 page view = bounce
  MIN_ENGAGED_SESSION_DURATION_MS: 30 * 1e3,
  MIN_SCROLL_DEPTH_ENGAGEMENT: 25
  // 25% scroll depth for engagement
}, cr = {
  INACTIVITY_TIMEOUT_MS: 1800 * 1e3,
  // 30min for analytics (vs 15min client)
  SHORT_SESSION_THRESHOLD_MS: 30 * 1e3,
  MEDIUM_SESSION_THRESHOLD_MS: 300 * 1e3,
  LONG_SESSION_THRESHOLD_MS: 1800 * 1e3,
  MAX_REALISTIC_SESSION_DURATION_MS: 480 * 60 * 1e3
  // Filter outliers
}, ur = {
  MOBILE_MAX_WIDTH: 768,
  TABLET_MAX_WIDTH: 1024,
  MOBILE_PERFORMANCE_FACTOR: 1.5,
  // Mobile typically 1.5x slower
  TABLET_PERFORMANCE_FACTOR: 1.2
}, dr = {
  MIN_TEXT_LENGTH_FOR_ANALYSIS: 10,
  MIN_CLICKS_FOR_HOT_ELEMENT: 10,
  // Popular element threshold
  MIN_SCROLL_COMPLETION_PERCENT: 80,
  // Page consumption threshold
  MIN_TIME_ON_PAGE_FOR_READ_MS: 15 * 1e3
}, hr = {
  SIGNIFICANT_CHANGE_PERCENT: 20,
  MAJOR_CHANGE_PERCENT: 50,
  MIN_EVENTS_FOR_INSIGHT: 100,
  MIN_SESSIONS_FOR_INSIGHT: 10,
  MIN_CORRELATION_STRENGTH: 0.7,
  // Strong correlation threshold
  LOW_ERROR_RATE_PERCENT: 1,
  HIGH_ERROR_RATE_PERCENT: 5,
  CRITICAL_ERROR_RATE_PERCENT: 10
}, Er = {
  SHORT_TERM_TREND_HOURS: 24,
  MEDIUM_TERM_TREND_DAYS: 7,
  LONG_TERM_TREND_DAYS: 30,
  MIN_DATA_POINTS_FOR_TREND: 5,
  WEEKLY_PATTERN_MIN_WEEKS: 4,
  DAILY_PATTERN_MIN_DAYS: 14
}, fr = {
  MIN_SEGMENT_SIZE: 10,
  MIN_COHORT_SIZE: 5,
  COHORT_ANALYSIS_DAYS: [1, 3, 7, 14, 30],
  MIN_FUNNEL_EVENTS: 20
}, gr = {
  DEFAULT_EVENTS_LIMIT: 5,
  DEFAULT_SESSIONS_LIMIT: 5,
  DEFAULT_PAGES_LIMIT: 5,
  MAX_EVENTS_FOR_DEEP_ANALYSIS: 1e4,
  MAX_TIME_RANGE_DAYS: 365,
  ANALYTICS_BATCH_SIZE: 1e3
  // For historical analysis
}, mr = {
  ANOMALY_THRESHOLD_SIGMA: 2.5,
  STRONG_ANOMALY_THRESHOLD_SIGMA: 3,
  TRAFFIC_DROP_ALERT_PERCENT: -30,
  TRAFFIC_SPIKE_ALERT_PERCENT: 200,
  MIN_BASELINE_DAYS: 7,
  MIN_EVENTS_FOR_ANOMALY_DETECTION: 50
}, Sr = {
  PAGE_URL_EXCLUDED: "excluded",
  PAGE_URL_UNKNOWN: "unknown"
}, _r = {
  init: Ot,
  event: bt,
  on: Ct,
  off: Pt,
  isInitialized: Dt,
  destroy: Vt
};
var re, Ne = -1, C = function(n) {
  addEventListener("pageshow", (function(e) {
    e.persisted && (Ne = e.timeStamp, n(e));
  }), !0);
}, ce = function() {
  var n = self.performance && performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
  if (n && n.responseStart > 0 && n.responseStart < performance.now()) return n;
}, B = function() {
  var n = ce();
  return n && n.activationStart || 0;
}, p = function(n, e) {
  var t = ce(), r = "navigate";
  return Ne >= 0 ? r = "back-forward-cache" : t && (document.prerendering || B() > 0 ? r = "prerender" : document.wasDiscarded ? r = "restore" : t.type && (r = t.type.replace(/_/g, "-"))), { name: n, value: e === void 0 ? -1 : e, rating: "good", delta: 0, entries: [], id: "v4-".concat(Date.now(), "-").concat(Math.floor(8999999999999 * Math.random()) + 1e12), navigationType: r };
}, k = function(n, e, t) {
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
    e.value >= 0 && (o || r) && ((i = e.value - (s || 0)) || s === void 0) && (s = e.value, e.delta = i, e.rating = (function(l, c) {
      return l > c[1] ? "poor" : l > c[0] ? "needs-improvement" : "good";
    })(e.value, t), n(e));
  };
}, ue = function(n) {
  requestAnimationFrame((function() {
    return requestAnimationFrame((function() {
      return n();
    }));
  }));
}, X = function(n) {
  document.addEventListener("visibilitychange", (function() {
    document.visibilityState === "hidden" && n();
  }));
}, de = function(n) {
  var e = !1;
  return function() {
    e || (n(), e = !0);
  };
}, O = -1, ve = function() {
  return document.visibilityState !== "hidden" || document.prerendering ? 1 / 0 : 0;
}, W = function(n) {
  document.visibilityState === "hidden" && O > -1 && (O = n.type === "visibilitychange" ? n.timeStamp : 0, kt());
}, Ae = function() {
  addEventListener("visibilitychange", W, !0), addEventListener("prerenderingchange", W, !0);
}, kt = function() {
  removeEventListener("visibilitychange", W, !0), removeEventListener("prerenderingchange", W, !0);
}, Re = function() {
  return O < 0 && (O = ve(), Ae(), C((function() {
    setTimeout((function() {
      O = ve(), Ae();
    }), 0);
  }))), { get firstHiddenTime() {
    return O;
  } };
}, $ = function(n) {
  document.prerendering ? addEventListener("prerenderingchange", (function() {
    return n();
  }), !0) : n();
}, ne = [1800, 3e3], Oe = function(n, e) {
  e = e || {}, $((function() {
    var t, r = Re(), s = p("FCP"), i = k("paint", (function(o) {
      o.forEach((function(l) {
        l.name === "first-contentful-paint" && (i.disconnect(), l.startTime < r.firstHiddenTime && (s.value = Math.max(l.startTime - B(), 0), s.entries.push(l), t(!0)));
      }));
    }));
    i && (t = I(n, s, ne, e.reportAllChanges), C((function(o) {
      s = p("FCP"), t = I(n, s, ne, e.reportAllChanges), ue((function() {
        s.value = performance.now() - o.timeStamp, t(!0);
      }));
    })));
  }));
}, se = [0.1, 0.25], Ut = function(n, e) {
  e = e || {}, Oe(de((function() {
    var t, r = p("CLS", 0), s = 0, i = [], o = function(c) {
      c.forEach((function(d) {
        if (!d.hadRecentInput) {
          var _ = i[0], g = i[i.length - 1];
          s && d.startTime - g.startTime < 1e3 && d.startTime - _.startTime < 5e3 ? (s += d.value, i.push(d)) : (s = d.value, i = [d]);
        }
      })), s > r.value && (r.value = s, r.entries = i, t());
    }, l = k("layout-shift", o);
    l && (t = I(n, r, se, e.reportAllChanges), X((function() {
      o(l.takeRecords()), t(!0);
    })), C((function() {
      s = 0, r = p("CLS", 0), t = I(n, r, se, e.reportAllChanges), ue((function() {
        return t();
      }));
    })), setTimeout(t, 0));
  })));
}, be = 0, Y = 1 / 0, U = 0, Ht = function(n) {
  n.forEach((function(e) {
    e.interactionId && (Y = Math.min(Y, e.interactionId), U = Math.max(U, e.interactionId), be = U ? (U - Y) / 7 + 1 : 0);
  }));
}, Ce = function() {
  return re ? be : performance.interactionCount || 0;
}, xt = function() {
  "interactionCount" in performance || re || (re = k("event", Ht, { type: "event", buffered: !0, durationThreshold: 0 }));
}, T = [], G = /* @__PURE__ */ new Map(), Pe = 0, Ft = function() {
  var n = Math.min(T.length - 1, Math.floor((Ce() - Pe) / 50));
  return T[n];
}, Gt = [], Wt = function(n) {
  if (Gt.forEach((function(s) {
    return s(n);
  })), n.interactionId || n.entryType === "first-input") {
    var e = T[T.length - 1], t = G.get(n.interactionId);
    if (t || T.length < 10 || n.duration > e.latency) {
      if (t) n.duration > t.latency ? (t.entries = [n], t.latency = n.duration) : n.duration === t.latency && n.startTime === t.entries[0].startTime && t.entries.push(n);
      else {
        var r = { id: n.interactionId, latency: n.duration, entries: [n] };
        G.set(r.id, r), T.push(r);
      }
      T.sort((function(s, i) {
        return i.latency - s.latency;
      })), T.length > 10 && T.splice(10).forEach((function(s) {
        return G.delete(s.id);
      }));
    }
  }
}, De = function(n) {
  var e = self.requestIdleCallback || self.setTimeout, t = -1;
  return n = de(n), document.visibilityState === "hidden" ? n() : (t = e(n), X(n)), t;
}, ie = [200, 500], Bt = function(n, e) {
  "PerformanceEventTiming" in self && "interactionId" in PerformanceEventTiming.prototype && (e = e || {}, $((function() {
    var t;
    xt();
    var r, s = p("INP"), i = function(l) {
      De((function() {
        l.forEach(Wt);
        var c = Ft();
        c && c.latency !== s.value && (s.value = c.latency, s.entries = c.entries, r());
      }));
    }, o = k("event", i, { durationThreshold: (t = e.durationThreshold) !== null && t !== void 0 ? t : 40 });
    r = I(n, s, ie, e.reportAllChanges), o && (o.observe({ type: "first-input", buffered: !0 }), X((function() {
      i(o.takeRecords()), r(!0);
    })), C((function() {
      Pe = Ce(), T.length = 0, G.clear(), s = p("INP"), r = I(n, s, ie, e.reportAllChanges);
    })));
  })));
}, oe = [2500, 4e3], K = {}, Xt = function(n, e) {
  e = e || {}, $((function() {
    var t, r = Re(), s = p("LCP"), i = function(c) {
      e.reportAllChanges || (c = c.slice(-1)), c.forEach((function(d) {
        d.startTime < r.firstHiddenTime && (s.value = Math.max(d.startTime - B(), 0), s.entries = [d], t());
      }));
    }, o = k("largest-contentful-paint", i);
    if (o) {
      t = I(n, s, oe, e.reportAllChanges);
      var l = de((function() {
        K[s.id] || (i(o.takeRecords()), o.disconnect(), K[s.id] = !0, t(!0));
      }));
      ["keydown", "click"].forEach((function(c) {
        addEventListener(c, (function() {
          return De(l);
        }), { once: !0, capture: !0 });
      })), X(l), C((function(c) {
        s = p("LCP"), t = I(n, s, oe, e.reportAllChanges), ue((function() {
          s.value = performance.now() - c.timeStamp, K[s.id] = !0, t(!0);
        }));
      }));
    }
  }));
}, ae = [800, 1800], $t = function n(e) {
  document.prerendering ? $((function() {
    return n(e);
  })) : document.readyState !== "complete" ? addEventListener("load", (function() {
    return n(e);
  }), !0) : setTimeout(e, 0);
}, zt = function(n, e) {
  e = e || {};
  var t = p("TTFB"), r = I(n, t, ae, e.reportAllChanges);
  $t((function() {
    var s = ce();
    s && (t.value = Math.max(s.responseStart - B(), 0), t.entries = [s], r(!0), C((function() {
      t = p("TTFB", 0), (r = I(n, t, ae, e.reportAllChanges))(!0);
    })));
  }));
};
const Qt = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  CLSThresholds: se,
  FCPThresholds: ne,
  INPThresholds: ie,
  LCPThresholds: oe,
  TTFBThresholds: ae,
  onCLS: Ut,
  onFCP: Oe,
  onINP: Bt,
  onLCP: Xt,
  onTTFB: zt
}, Symbol.toStringTag, { value: "Module" }));
export {
  gr as ANALYTICS_QUERY_LIMITS,
  mr as ANOMALY_DETECTION,
  E as AppConfigValidationError,
  dr as CONTENT_ANALYTICS,
  ar as DATA_PROTECTION,
  ur as DEVICE_ANALYTICS,
  w as DeviceType,
  lr as ENGAGEMENT_THRESHOLDS,
  Z as EmitterEvent,
  P as ErrorType,
  u as EventType,
  hr as INSIGHT_THRESHOLDS,
  ir as InitializationTimeoutError,
  M as IntegrationValidationError,
  rr as MAX_ARRAY_LENGTH,
  qt as MAX_CUSTOM_EVENT_ARRAY_SIZE,
  Kt as MAX_CUSTOM_EVENT_KEYS,
  jt as MAX_CUSTOM_EVENT_NAME_LENGTH,
  Yt as MAX_CUSTOM_EVENT_STRING_SIZE,
  Jt as MAX_METADATA_NESTING_DEPTH,
  Zt as MAX_NESTED_OBJECT_KEYS,
  er as MAX_STRING_LENGTH,
  tr as MAX_STRING_LENGTH_IN_ARRAY,
  D as Mode,
  or as PERFORMANCE_CONFIG,
  R as PermanentError,
  fr as SEGMENTATION_ANALYTICS,
  cr as SESSION_ANALYTICS,
  Sr as SPECIAL_PAGE_URLS,
  he as SamplingRateValidationError,
  H as ScrollDirection,
  Ge as SessionTimeoutValidationError,
  q as SpecialApiUrl,
  Er as TEMPORAL_ANALYSIS,
  V as TraceLogValidationError,
  nr as isPrimaryScrollEvent,
  sr as isSecondaryScrollEvent,
  _r as tracelog
};
