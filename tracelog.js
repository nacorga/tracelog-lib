const ur = 9e5;
const dr = 120, hr = 49152, fr = 100, mr = 500, gr = 200;
const Er = 1e3, pr = 500, Sr = 1e3;
const b = "data-tlog", bt = [
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
], At = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"], Lt = [
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
const E = {
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
  INVALID_VIEWPORT_MAX_TRACKED_ELEMENTS: "Viewport maxTrackedElements must be a positive number",
  INVALID_SEND_INTERVAL: "Send interval must be between 1000ms (1 second) and 60000ms (60 seconds)"
}, Mt = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<embed\b[^>]*>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi
], I = "tlog", X = `${I}:qa_mode`, Te = `${I}:uid`, rt = "tlog_mode", Ue = "qa", He = "qa_off", Ct = (r) => r ? `${I}:${r}:queue` : `${I}:queue`, Rt = (r) => r ? `${I}:${r}:session` : `${I}:session`, Nt = (r) => r ? `${I}:${r}:broadcast` : `${I}:broadcast`, Fe = (r, e) => `${I}:${r}:session_counts:${e}`, xe = 10080 * 60 * 1e3, $e = `${I}:session_counts_last_cleanup`, Be = 3600 * 1e3, fe = (r) => r ? `${I}:${r}:identity` : `${I}:identity`, U = `${I}:pending_identity`;
var $ = /* @__PURE__ */ ((r) => (r.Localhost = "localhost:8080", r.Fail = "localhost:9999", r))($ || {}), L = /* @__PURE__ */ ((r) => (r.Mobile = "mobile", r.Tablet = "tablet", r.Desktop = "desktop", r.Unknown = "unknown", r))(L || {}), se = /* @__PURE__ */ ((r) => (r.EVENT = "event", r.QUEUE = "queue", r))(se || {});
class O extends Error {
  constructor(e, t) {
    super(e), this.statusCode = t, this.name = "PermanentError", Error.captureStackTrace && Error.captureStackTrace(this, O);
  }
  statusCode;
}
class re extends Error {
  constructor(e) {
    super(e), this.name = "RateLimitError", Error.captureStackTrace && Error.captureStackTrace(this, re);
  }
}
class ne extends Error {
  constructor(e) {
    super(e), this.name = "TimeoutError", Error.captureStackTrace && Error.captureStackTrace(this, ne);
  }
}
var d = /* @__PURE__ */ ((r) => (r.PAGE_VIEW = "page_view", r.CLICK = "click", r.SCROLL = "scroll", r.SESSION_START = "session_start", r.CUSTOM = "custom", r.WEB_VITALS = "web_vitals", r.ERROR = "error", r.VIEWPORT_VISIBLE = "viewport_visible", r))(d || {}), Z = /* @__PURE__ */ ((r) => (r.UP = "up", r.DOWN = "down", r))(Z || {}), B = /* @__PURE__ */ ((r) => (r.JS_ERROR = "js_error", r.PROMISE_REJECTION = "promise_rejection", r))(B || {}), ie = /* @__PURE__ */ ((r) => (r.QA = "qa", r))(ie || {});
const Tr = (r) => r.type === d.SCROLL && "scroll_data" in r && r.scroll_data.is_primary === !0, Ir = (r) => r.type === d.SCROLL && "scroll_data" in r && r.scroll_data.is_primary === !1;
class j extends Error {
  constructor(e, t, s) {
    super(e), this.errorCode = t, this.layer = s, this.name = this.constructor.name, Error.captureStackTrace && Error.captureStackTrace(this, this.constructor);
  }
  errorCode;
  layer;
}
class m extends j {
  constructor(e, t = "config") {
    super(e, "APP_CONFIG_INVALID", t);
  }
}
class Ot extends j {
  constructor(e, t = "config") {
    super(e, "SESSION_TIMEOUT_INVALID", t);
  }
}
class We extends j {
  constructor(e, t = "config") {
    super(e, "SAMPLING_RATE_INVALID", t);
  }
}
class N extends j {
  constructor(e, t = "config") {
    super(e, "INTEGRATION_INVALID", t);
  }
}
class vr extends j {
  constructor(e, t, s = "runtime") {
    super(e, "INITIALIZATION_TIMEOUT", s), this.timeoutMs = t;
  }
  timeoutMs;
}
const nt = "background: #ff9800; color: white; font-weight: bold; padding: 2px 8px; border-radius: 3px;", it = "background: #9e9e9e; color: white; font-weight: bold; padding: 2px 8px; border-radius: 3px;", Pt = "background: #d32f2f; color: white; font-weight: bold; padding: 2px 8px; border-radius: 3px;", Dt = (r, e) => {
  if (e) {
    if (e instanceof Error) {
      const t = e.message.replace(/\s+at\s+.*$/gm, "").replace(/\s*\([^()]+:\d+:\d+\)/g, "");
      return `[TraceLog] ${r}: ${t}`;
    }
    if (e instanceof Error)
      return `[TraceLog] ${r}: ${e.message}`;
    if (typeof e == "string")
      return `[TraceLog] ${r}: ${e}`;
    if (typeof e == "object")
      try {
        return `[TraceLog] ${r}: ${JSON.stringify(e)}`;
      } catch {
        return `[TraceLog] ${r}: [Unable to serialize error]`;
      }
    return `[TraceLog] ${r}: ${String(e)}`;
  }
  return `[TraceLog] ${r}`;
}, kt = () => {
  if (typeof window > "u" || typeof sessionStorage > "u")
    return !1;
  try {
    return sessionStorage.getItem(X) === "true";
  } catch {
    return !1;
  }
}, a = (r, e, t) => {
  const { error: s, data: n, showToClient: i = !1, style: o, visibility: l } = t ?? {}, c = s ? Dt(e, s) : `[TraceLog] ${e}`, u = r === "error" ? "error" : r === "warn" ? "warn" : "log";
  if (!Vt(l, i))
    return;
  const g = Ut(l, o), T = n !== void 0 ? Ie(n) : void 0;
  Ht(u, c, g, T);
}, Vt = (r, e) => r === "critical" ? !0 : r === "qa" || e ? kt() : !1, Ut = (r, e) => e !== void 0 && e !== "" ? e : r === "critical" ? Pt : "", Ht = (r, e, t, s) => {
  const n = t !== void 0 && t !== "", i = n ? `%c${e}` : e;
  s !== void 0 ? n ? console[r](i, t, s) : console[r](i, s) : n ? console[r](i, t) : console[r](i);
}, Ie = (r) => {
  const e = {}, t = ["token", "password", "secret", "key", "apikey", "api_key", "sessionid", "session_id"];
  for (const [s, n] of Object.entries(r)) {
    const i = s.toLowerCase();
    if (t.some((o) => i.includes(o))) {
      e[s] = "[REDACTED]";
      continue;
    }
    n !== null && typeof n == "object" && !Array.isArray(n) ? e[s] = Ie(n) : Array.isArray(n) ? e[s] = n.map(
      (o) => o !== null && typeof o == "object" && !Array.isArray(o) ? Ie(o) : o
    ) : e[s] = n;
  }
  return e;
};
let ve, ot;
const Ft = () => {
  typeof window < "u" && !ve && (ve = window.matchMedia("(pointer: coarse)"), ot = window.matchMedia("(hover: none)"));
}, oe = "Unknown", xt = (r) => {
  const e = r.userAgentData?.platform;
  if (e != null && e !== "") {
    if (/windows/i.test(e)) return "Windows";
    if (/macos/i.test(e)) return "macOS";
    if (/android/i.test(e)) return "Android";
    if (/linux/i.test(e)) return "Linux";
    if (/chromeos/i.test(e)) return "ChromeOS";
    if (/ios/i.test(e)) return "iOS";
  }
  const t = navigator.userAgent;
  return /Windows/i.test(t) ? "Windows" : /iPhone|iPad|iPod/i.test(t) ? "iOS" : /Mac OS X|Macintosh/i.test(t) ? "macOS" : /Android/i.test(t) ? "Android" : /CrOS/i.test(t) ? "ChromeOS" : /Linux/i.test(t) ? "Linux" : oe;
}, $t = (r) => {
  const e = r.userAgentData?.brands;
  if (e != null && e.length > 0) {
    const n = e.filter((i) => !/not.?a.?brand|chromium/i.test(i.brand))[0];
    if (n != null) {
      const i = n.brand;
      return /google chrome/i.test(i) ? "Chrome" : /microsoft edge/i.test(i) ? "Edge" : /opera/i.test(i) ? "Opera" : i;
    }
  }
  const t = navigator.userAgent;
  return /Edg\//i.test(t) ? "Edge" : /OPR\//i.test(t) ? "Opera" : /Chrome/i.test(t) ? "Chrome" : /Firefox/i.test(t) ? "Firefox" : /Safari/i.test(t) && !/Chrome/i.test(t) ? "Safari" : oe;
}, Bt = () => {
  try {
    const r = navigator;
    if (r.userAgentData != null && typeof r.userAgentData.mobile == "boolean") {
      const c = r.userAgentData.platform;
      return c != null && c !== "" && /ipad|tablet/i.test(c) ? L.Tablet : r.userAgentData.mobile ? L.Mobile : L.Desktop;
    }
    Ft();
    const e = window.innerWidth, t = ve?.matches ?? !1, s = ot?.matches ?? !1, n = "ontouchstart" in window || navigator.maxTouchPoints > 0, i = navigator.userAgent.toLowerCase(), o = /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/.test(i), l = /tablet|ipad|android(?!.*mobile)/.test(i);
    return e <= 767 || o && n ? L.Mobile : e >= 768 && e <= 1024 || l || t && s && n ? L.Tablet : L.Desktop;
  } catch (r) {
    return a("debug", "Device detection failed, defaulting to desktop", { error: r }), L.Desktop;
  }
}, Wt = () => {
  try {
    const r = navigator;
    return {
      type: Bt(),
      os: xt(r),
      browser: $t(r)
    };
  } catch (r) {
    return a("debug", "Device info detection failed, using defaults", { error: r }), {
      type: L.Desktop,
      os: oe,
      browser: oe
    };
  }
}, at = [
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
  /:\/\/[^:/]+:([^@]+)@/gi,
  // Sensitive URL query parameters (token=, password=, auth=, secret=, api_key=, etc.)
  /[?&](token|password|passwd|auth|secret|secret_key|private_key|auth_key|api_key|apikey|access_token)=[^&\s]+/gi
], Xe = 500, Ge = 2e3, je = 5e3, ee = 50, Xt = ee * 2, lt = 1, Gt = 1e3, jt = 10, ze = 5e3, zt = 6e4, _r = {
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
}, Qe = {
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
}, Qt = {
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
}, _e = "needs-improvement", Ke = (r = _e) => {
  switch (r) {
    case "all":
      return { LCP: 0, FCP: 0, CLS: 0, INP: 0, TTFB: 0, LONG_TASK: 0 };
    // Track everything
    case "needs-improvement":
      return Qe;
    case "poor":
      return Qt;
    default:
      return Qe;
  }
}, Kt = 1e3, Yt = 50, qt = "2.8.2", Jt = qt, ct = () => typeof window < "u" && typeof sessionStorage < "u", Zt = () => {
  try {
    const r = new URLSearchParams(window.location.search);
    r.delete(rt);
    const e = r.toString(), t = window.location.pathname + (e ? "?" + e : "") + window.location.hash;
    window.history.replaceState({}, "", t);
  } catch {
  }
}, es = () => {
  if (!ct())
    return !1;
  try {
    const e = new URLSearchParams(window.location.search).get(rt), t = sessionStorage.getItem(X);
    let s = null;
    return e === Ue ? (s = !0, sessionStorage.setItem(X, "true"), a("info", "QA Mode ACTIVE", {
      visibility: "qa",
      style: nt
    })) : e === He && (s = !1, sessionStorage.setItem(X, "false"), a("info", "QA Mode DISABLED", {
      visibility: "qa",
      style: it
    })), (e === Ue || e === He) && Zt(), s ?? t === "true";
  } catch {
    return !1;
  }
}, ts = (r) => {
  if (ct())
    try {
      sessionStorage.setItem(X, r ? "true" : "false"), a("info", r ? "QA Mode ACTIVE" : "QA Mode DISABLED", {
        visibility: "qa",
        style: r ? nt : it
      });
    } catch {
      a("debug", "Cannot set QA mode: sessionStorage unavailable");
    }
}, ss = [
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
], Ye = (r) => {
  const e = r.toLowerCase().split(".");
  if (e.length <= 2)
    return r.toLowerCase();
  const t = e.slice(-2).join(".");
  return ss.includes(t) ? e.slice(-3).join(".") : e.slice(-2).join(".");
}, rs = (r, e) => r === e ? !0 : Ye(r) === Ye(e), me = () => {
  const r = document.referrer;
  if (!r)
    return "Direct";
  try {
    const e = new URL(r).hostname.toLowerCase(), t = window.location.hostname.toLowerCase();
    return rs(e, t) ? "Direct" : r;
  } catch (e) {
    return a("debug", "Failed to parse referrer URL, using raw value", { error: e, data: { referrer: r } }), r;
  }
}, ge = () => {
  const r = new URLSearchParams(window.location.search), e = {};
  return At.forEach((s) => {
    const n = r.get(s);
    if (n) {
      const i = s.split("utm_")[1];
      e[i] = n;
    }
  }), Object.keys(e).length ? e : void 0;
}, ut = () => typeof crypto < "u" && crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (r) => {
  const e = Math.random() * 16 | 0;
  return (r === "x" ? e : e & 3 | 8).toString(16);
});
let Y = 0, q = 0;
const ns = () => {
  let r = Date.now();
  r < q && (r = q), r === q ? Y = (Y + 1) % 1e3 : Y = 0, q = r;
  const e = Y.toString().padStart(3, "0");
  let t = "";
  try {
    if (typeof crypto < "u" && crypto.getRandomValues) {
      const s = crypto.getRandomValues(new Uint8Array(3));
      s && (t = Array.from(s, (n) => n.toString(16).padStart(2, "0")).join(""));
    }
  } catch {
  }
  return t || (t = Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")), `${r}-${e}-${t}`;
}, dt = (r, e = !1) => {
  try {
    const t = new URL(r), s = t.protocol === "https:", n = t.protocol === "http:";
    return s || e && n;
  } catch {
    return !1;
  }
}, is = (r) => {
  try {
    const t = new URL(window.location.href).hostname;
    if (!t || typeof t != "string")
      throw new Error("Invalid hostname");
    if (t === "localhost" || t === "127.0.0.1" || /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(t))
      throw new Error(
        "SaaS integration not supported on localhost or IP addresses. Use custom backend integration instead."
      );
    const s = t.split(".");
    if (!s || !Array.isArray(s) || s.length === 0 || s.length === 1 && s[0] === "")
      throw new Error("Invalid hostname structure");
    if (s.length === 1)
      throw new Error("Single-part domain not supported for SaaS integration");
    let n;
    if (s.length === 2 ? n = s.join(".") : n = s.slice(-2).join("."), !n || n.split(".").length < 2)
      throw new Error("Invalid domain structure for SaaS");
    const i = `https://${r}.${n}/collect`;
    if (!dt(i))
      throw new Error("Generated URL failed validation");
    return i;
  } catch (e) {
    throw new Error(`Invalid SaaS URL configuration: ${e instanceof Error ? e.message : String(e)}`);
  }
}, os = (r) => {
  const e = {};
  r.integrations?.tracelog?.projectId && (e.saas = is(r.integrations.tracelog.projectId));
  const t = r.integrations?.custom?.collectApiUrl;
  if (t) {
    const s = r.integrations?.custom?.allowHttp ?? !1;
    if (!dt(t, s))
      throw new Error("Invalid custom API URL");
    e.custom = t;
  }
  return e;
}, ye = (r, e = []) => {
  if (!r || typeof r != "string")
    return a("warn", "Invalid URL provided to normalizeUrl", { data: { type: typeof r } }), r || "";
  try {
    const t = new URL(r), s = t.searchParams, n = [.../* @__PURE__ */ new Set([...Lt, ...e])];
    let i = !1;
    const o = [];
    return n.forEach((c) => {
      s.has(c) && (s.delete(c), i = !0, o.push(c));
    }), !i && r.includes("?") ? r : (t.search = s.toString(), t.toString());
  } catch (t) {
    return a("warn", "URL normalization failed, returning original", { error: t, data: { urlLength: r?.length } }), r;
  }
}, qe = (r) => {
  if (!r || typeof r != "string" || r.trim().length === 0)
    return "";
  let e = r;
  r.length > 1e3 && (e = r.slice(0, Math.max(0, 1e3)));
  let t = 0;
  for (const n of Mt) {
    const i = e;
    e = e.replace(n, ""), i !== e && t++;
  }
  return t > 0 && a("warn", "XSS patterns detected and removed", {
    data: {
      patternMatches: t,
      valueLength: r.length
    }
  }), e.trim();
}, we = (r, e = 0) => {
  if (r == null)
    return null;
  if (typeof r == "string")
    return qe(r);
  if (typeof r == "number")
    return !Number.isFinite(r) || r < -Number.MAX_SAFE_INTEGER || r > Number.MAX_SAFE_INTEGER ? 0 : r;
  if (typeof r == "boolean")
    return r;
  if (e > 10)
    return null;
  if (Array.isArray(r))
    return r.slice(0, 1e3).map((n) => we(n, e + 1)).filter((n) => n !== null);
  if (typeof r == "object") {
    const t = {}, n = Object.entries(r).slice(0, 200);
    for (const [i, o] of n) {
      const l = qe(i);
      if (l) {
        const c = we(o, e + 1);
        c !== null && (t[l] = c);
      }
    }
    return t;
  }
  return null;
}, as = (r) => {
  if (typeof r != "object" || r === null)
    return {};
  try {
    const e = we(r);
    return typeof e == "object" && e !== null ? e : {};
  } catch (e) {
    const t = e instanceof Error ? e.message : String(e);
    throw new Error(`[TraceLog] Metadata sanitization failed: ${t}`);
  }
}, ls = (r) => {
  if (r !== void 0 && (r === null || typeof r != "object"))
    throw new m("Configuration must be an object", "config");
  if (r) {
    if (r.sessionTimeout !== void 0 && (typeof r.sessionTimeout != "number" || r.sessionTimeout < 3e4 || r.sessionTimeout > 864e5))
      throw new Ot(E.INVALID_SESSION_TIMEOUT, "config");
    if (r.globalMetadata !== void 0 && (typeof r.globalMetadata != "object" || r.globalMetadata === null))
      throw new m(E.INVALID_GLOBAL_METADATA, "config");
    if (r.integrations && us(r.integrations), r.sensitiveQueryParams !== void 0) {
      if (!Array.isArray(r.sensitiveQueryParams))
        throw new m(E.INVALID_SENSITIVE_QUERY_PARAMS, "config");
      for (const e of r.sensitiveQueryParams)
        if (typeof e != "string")
          throw new m("All sensitive query params must be strings", "config");
    }
    if (r.errorSampling !== void 0 && (typeof r.errorSampling != "number" || r.errorSampling < 0 || r.errorSampling > 1))
      throw new We(E.INVALID_ERROR_SAMPLING_RATE, "config");
    if (r.samplingRate !== void 0 && (typeof r.samplingRate != "number" || r.samplingRate < 0 || r.samplingRate > 1))
      throw new We(E.INVALID_SAMPLING_RATE, "config");
    if (r.primaryScrollSelector !== void 0) {
      if (typeof r.primaryScrollSelector != "string" || !r.primaryScrollSelector.trim())
        throw new m(E.INVALID_PRIMARY_SCROLL_SELECTOR, "config");
      if (r.primaryScrollSelector !== "window")
        try {
          document.querySelector(r.primaryScrollSelector);
        } catch {
          throw new m(
            `${E.INVALID_PRIMARY_SCROLL_SELECTOR_SYNTAX}: "${r.primaryScrollSelector}"`,
            "config"
          );
        }
    }
    if (r.pageViewThrottleMs !== void 0 && (typeof r.pageViewThrottleMs != "number" || r.pageViewThrottleMs < 0))
      throw new m(E.INVALID_PAGE_VIEW_THROTTLE, "config");
    if (r.clickThrottleMs !== void 0 && (typeof r.clickThrottleMs != "number" || r.clickThrottleMs < 0))
      throw new m(E.INVALID_CLICK_THROTTLE, "config");
    if (r.maxSameEventPerMinute !== void 0 && (typeof r.maxSameEventPerMinute != "number" || r.maxSameEventPerMinute <= 0))
      throw new m(E.INVALID_MAX_SAME_EVENT_PER_MINUTE, "config");
    if (r.sendIntervalMs !== void 0 && (!Number.isFinite(r.sendIntervalMs) || r.sendIntervalMs < 1e3 || r.sendIntervalMs > 6e4))
      throw new m(E.INVALID_SEND_INTERVAL, "config");
    if (r.viewport !== void 0 && cs(r.viewport), r.webVitalsMode !== void 0) {
      if (typeof r.webVitalsMode != "string")
        throw new m(
          `Invalid webVitalsMode type: ${typeof r.webVitalsMode}. Must be a string`,
          "config"
        );
      const e = ["all", "needs-improvement", "poor"];
      if (!e.includes(r.webVitalsMode))
        throw new m(
          `Invalid webVitalsMode: "${r.webVitalsMode}". Must be one of: ${e.join(", ")}`,
          "config"
        );
    }
    if (r.webVitalsThresholds !== void 0) {
      if (typeof r.webVitalsThresholds != "object" || r.webVitalsThresholds === null || Array.isArray(r.webVitalsThresholds))
        throw new m("webVitalsThresholds must be an object", "config");
      const e = ["LCP", "FCP", "CLS", "INP", "TTFB", "LONG_TASK"];
      for (const [t, s] of Object.entries(r.webVitalsThresholds)) {
        if (!e.includes(t))
          throw new m(
            `Invalid Web Vitals threshold key: "${t}". Must be one of: ${e.join(", ")}`,
            "config"
          );
        if (typeof s != "number" || !Number.isFinite(s) || s < 0)
          throw new m(
            `Invalid Web Vitals threshold value for ${t}: ${s}. Must be a non-negative finite number`,
            "config"
          );
      }
    }
  }
}, cs = (r) => {
  if (typeof r != "object" || r === null)
    throw new m(E.INVALID_VIEWPORT_CONFIG, "config");
  if (!r.elements || !Array.isArray(r.elements))
    throw new m(E.INVALID_VIEWPORT_ELEMENTS, "config");
  if (r.elements.length === 0)
    throw new m(E.INVALID_VIEWPORT_ELEMENTS, "config");
  const e = /* @__PURE__ */ new Set();
  for (const t of r.elements) {
    if (!t.selector || typeof t.selector != "string" || !t.selector.trim())
      throw new m(E.INVALID_VIEWPORT_ELEMENT, "config");
    const s = t.selector.trim();
    if (e.has(s))
      throw new m(
        `Duplicate viewport selector found: "${s}". Each selector should appear only once.`,
        "config"
      );
    if (e.add(s), t.id !== void 0 && (typeof t.id != "string" || !t.id.trim()))
      throw new m(E.INVALID_VIEWPORT_ELEMENT_ID, "config");
    if (t.name !== void 0 && (typeof t.name != "string" || !t.name.trim()))
      throw new m(E.INVALID_VIEWPORT_ELEMENT_NAME, "config");
  }
  if (r.threshold !== void 0 && (typeof r.threshold != "number" || r.threshold < 0 || r.threshold > 1))
    throw new m(E.INVALID_VIEWPORT_THRESHOLD, "config");
  if (r.minDwellTime !== void 0 && (typeof r.minDwellTime != "number" || r.minDwellTime < 0))
    throw new m(E.INVALID_VIEWPORT_MIN_DWELL_TIME, "config");
  if (r.cooldownPeriod !== void 0 && (typeof r.cooldownPeriod != "number" || r.cooldownPeriod < 0))
    throw new m(E.INVALID_VIEWPORT_COOLDOWN_PERIOD, "config");
  if (r.maxTrackedElements !== void 0 && (typeof r.maxTrackedElements != "number" || r.maxTrackedElements <= 0))
    throw new m(E.INVALID_VIEWPORT_MAX_TRACKED_ELEMENTS, "config");
}, us = (r) => {
  if (r) {
    if (r.tracelog && (!r.tracelog.projectId || typeof r.tracelog.projectId != "string" || r.tracelog.projectId.trim() === ""))
      throw new N(E.INVALID_TRACELOG_PROJECT_ID, "config");
    if (r.custom) {
      if (!r.custom.collectApiUrl || typeof r.custom.collectApiUrl != "string" || r.custom.collectApiUrl.trim() === "")
        throw new N(E.INVALID_CUSTOM_API_URL, "config");
      if (r.custom.allowHttp !== void 0 && typeof r.custom.allowHttp != "boolean")
        throw new N("allowHttp must be a boolean", "config");
      const e = r.custom.collectApiUrl.trim();
      if (!e.startsWith("http://") && !e.startsWith("https://"))
        throw new N('Custom API URL must start with "http://" or "https://"', "config");
      if (!(r.custom.allowHttp ?? !1) && e.startsWith("http://"))
        throw new N(
          "Custom API URL must use HTTPS in production. Set allowHttp: true in integration config to allow HTTP (not recommended)",
          "config"
        );
      if (r.custom.fetchCredentials !== void 0 && !["include", "same-origin", "omit"].includes(r.custom.fetchCredentials))
        throw new N('fetchCredentials must be "include", "same-origin", or "omit"', "config");
    }
    if (r.tracelog?.shopify !== void 0 && typeof r.tracelog.shopify != "boolean")
      throw new N("tracelog.shopify must be a boolean", "config");
  }
}, ds = (r) => {
  ls(r);
  const e = {
    ...r ?? {},
    sessionTimeout: r?.sessionTimeout ?? 9e5,
    globalMetadata: r?.globalMetadata ?? {},
    sensitiveQueryParams: r?.sensitiveQueryParams ?? [],
    errorSampling: r?.errorSampling ?? lt,
    samplingRate: r?.samplingRate ?? 1,
    pageViewThrottleMs: r?.pageViewThrottleMs ?? 1e3,
    clickThrottleMs: r?.clickThrottleMs ?? 300,
    maxSameEventPerMinute: r?.maxSameEventPerMinute ?? 60,
    sendIntervalMs: r?.sendIntervalMs ?? 1e4
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
}, be = (r, e = /* @__PURE__ */ new Set()) => {
  if (r == null)
    return !0;
  const t = typeof r;
  return t === "string" || t === "number" || t === "boolean" ? !0 : t === "function" || t === "symbol" || t === "bigint" || e.has(r) ? !1 : (e.add(r), Array.isArray(r) ? r.every((s) => be(s, e)) : t === "object" ? Object.values(r).every((s) => be(s, e)) : !1);
}, hs = (r) => typeof r != "object" || r === null ? !1 : be(r), ht = (r) => {
  if (typeof r != "object" || r === null || Array.isArray(r)) return;
  const e = {};
  for (const [t, s] of Object.entries(r))
    typeof s == "string" && (e[t] = s);
  return Object.keys(e).length > 0 ? e : void 0;
}, fs = (r) => typeof r != "string" ? {
  valid: !1,
  error: "Event name must be a string"
} : r.length === 0 ? {
  valid: !1,
  error: "Event name cannot be empty"
} : r.length > 120 ? {
  valid: !1,
  error: "Event name is too long (max 120 characters)"
} : r.includes("<") || r.includes(">") || r.includes("&") ? {
  valid: !1,
  error: "Event name contains invalid characters"
} : ["constructor", "prototype", "__proto__", "eval", "function", "var", "let", "const"].includes(r.toLowerCase()) ? {
  valid: !1,
  error: "Event name cannot be a reserved word"
} : { valid: !0 }, Je = (r, e, t) => {
  const s = as(e), n = t && t === "customEvent" ? `${t} "${r}" metadata error` : `${r} metadata error`;
  if (!hs(s))
    return {
      valid: !1,
      error: `${n}: object has invalid types. Valid types are string, number, boolean or string arrays.`
    };
  let i;
  try {
    i = JSON.stringify(s);
  } catch {
    return {
      valid: !1,
      error: `${n}: object contains circular references or cannot be serialized.`
    };
  }
  if (new TextEncoder().encode(i).byteLength > 49152)
    return {
      valid: !1,
      error: `${n}: object is too large (max ${49152 / 1024} KB).`
    };
  if (Object.keys(s).length > 100)
    return {
      valid: !1,
      error: `${n}: object has too many keys (max 100 keys).`
    };
  for (const [c, u] of Object.entries(s)) {
    if (Array.isArray(u)) {
      if (u.length > 500)
        return {
          valid: !1,
          error: `${n}: array property "${c}" is too large (max 500 items).`
        };
      for (const f of u)
        if (typeof f == "string" && f.length > 500)
          return {
            valid: !1,
            error: `${n}: array property "${c}" contains strings that are too long (max 500 characters).`
          };
    }
    if (typeof u == "string" && u.length > 1e3)
      return {
        valid: !1,
        error: `${n}: property "${c}" is too long (max 1000 characters).`
      };
  }
  return {
    valid: !0,
    sanitizedMetadata: s
  };
}, ft = (r, e, t) => {
  if (Array.isArray(e)) {
    const s = [], n = t && t === "customEvent" ? `${t} "${r}" metadata error` : `${r} metadata error`;
    for (let i = 0; i < e.length; i++) {
      const o = e[i];
      if (typeof o != "object" || o === null || Array.isArray(o))
        return {
          valid: !1,
          error: `${n}: array item at index ${i} must be an object.`
        };
      const l = Je(r, o, t);
      if (!l.valid)
        return {
          valid: !1,
          error: `${n}: array item at index ${i} is invalid: ${l.error}`
        };
      l.sanitizedMetadata && s.push(l.sanitizedMetadata);
    }
    return {
      valid: !0,
      sanitizedMetadata: s
    };
  }
  return Je(r, e, t);
}, ms = (r, e) => {
  const t = fs(r);
  if (!t.valid)
    return a("error", "Event name validation failed", {
      data: { eventName: r, error: t.error }
    }), t;
  if (!e)
    return { valid: !0 };
  const s = ft(r, e, "customEvent");
  return s.valid || a("error", "Event metadata validation failed", {
    data: {
      eventName: r,
      error: s.error
    }
  }), s;
};
class gs {
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
    const s = this.listeners.get(e);
    if (s) {
      const n = s.indexOf(t);
      n > -1 && s.splice(n, 1);
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
    const s = this.listeners.get(e);
    s && s.forEach((n) => {
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
function mt(r, e, t) {
  try {
    const s = e(r);
    return s === null ? null : typeof s == "object" && s !== null && "type" in s ? s : (a("warn", `beforeSend transformer returned invalid data, using original [${t}]`), r);
  } catch (s) {
    return a("error", `beforeSend transformer threw error, using original event [${t}]`, {
      error: s,
      visibility: "critical"
    }), r;
  }
}
function Es(r, e, t) {
  return r.map((s) => mt(s, e, t)).filter((s) => s !== null);
}
function gt(r, e, t) {
  try {
    const s = e(r);
    return s === null ? (a("debug", `Batch filtered by beforeBatch transformer [${t}]`, {
      data: { eventCount: r.events.length }
    }), null) : typeof s == "object" && s !== null && Array.isArray(s.events) ? s : (a("warn", `beforeBatch transformer returned invalid data, using original [${t}]`, {
      data: { eventCount: r.events.length }
    }), r);
  } catch (s) {
    return a("error", `beforeBatch transformer threw error, using original batch [${t}]`, {
      error: s,
      data: { eventCount: r.events.length },
      visibility: "critical"
    }), r;
  }
}
const Ee = { config: {} };
class _ {
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
    return Ee[e];
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
    Ee[e] = t;
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
    return { ...Ee };
  }
}
class Ze extends _ {
  storeManager;
  integrationId;
  apiUrl;
  transformers;
  staticHeaders;
  customHeadersProvider;
  lastPermanentErrorLog = null;
  recoveryInProgress = !1;
  lastMetadataTimestamp = 0;
  fetchCredentials;
  pendingControllers = /* @__PURE__ */ new Set();
  /**
   * Counts consecutive fetch() rejections where no HTTP response was received
   * (DNS failure, connection refused, etc.). Resets on success.
   * When this reaches MAX_CONSECUTIVE_NETWORK_FAILURES the circuit opens and
   * further send attempts are skipped until CIRCUIT_BREAKER_COOLDOWN_MS elapses,
   * at which point a single probe request is allowed (half-open state).
   */
  consecutiveNetworkFailures = 0;
  circuitOpenedAt = 0;
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
   * @param staticHeaders - Optional static HTTP headers (from config)
   * @param customHeadersProvider - Optional callback for dynamic headers
   * @throws Error if integrationId and apiUrl are not both provided or both undefined
   */
  constructor(e, t, s, n = {}, i = {}, o, l = "include") {
    if (super(), t && !s || !t && s)
      throw new Error("SenderManager: integrationId and apiUrl must either both be provided or both be undefined");
    this.storeManager = e, this.integrationId = t, this.apiUrl = s, this.transformers = n, this.staticHeaders = i, this.customHeadersProvider = o, this.fetchCredentials = l;
  }
  /**
   * Get the integration ID for this sender
   * @returns The integration ID ('saas' or 'custom') or undefined if not set
   */
  getIntegrationId() {
    return this.integrationId;
  }
  /**
   * Sets the custom headers provider callback.
   * Only applies to 'custom' integration (ignored for 'saas').
   *
   * @param provider - Callback function that returns custom headers
   */
  setCustomHeadersProvider(e) {
    this.customHeadersProvider = e;
  }
  /**
   * Removes the custom headers provider callback.
   */
  removeCustomHeadersProvider() {
    this.customHeadersProvider = void 0;
  }
  /**
   * Builds custom headers by merging static headers with dynamic headers from provider.
   * Only applies to 'custom' integration (returns empty object for 'saas').
   *
   * @returns Merged custom headers object (dynamic headers override static)
   * @private
   */
  getCustomHeaders() {
    if (this.integrationId !== "custom")
      return {};
    let e = {};
    if (this.customHeadersProvider)
      try {
        const t = this.customHeadersProvider();
        typeof t == "object" && t !== null && !Array.isArray(t) ? e = t : a("warn", "Custom headers provider returned invalid value, expected object", {
          data: { received: typeof t }
        });
      } catch (t) {
        a("warn", "Custom headers provider threw an error, using static headers only", { error: t });
      }
    return { ...this.staticHeaders, ...e };
  }
  getQueueStorageKey() {
    const e = this.get("userId") || "anonymous", t = Ct(e);
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
   * - Persists to localStorage on beacon failure/size overflow for later recovery
   *
   * **Return Values**:
   * - `true`: Send succeeded OR skipped (standalone mode)
   * - `false`: Send failed (network error, browser rejected beacon)
   *
   * **Important**: No retry mechanism. Failed events are persisted to localStorage for
   * recovery on next page load via `recoverPersistedEvents()`.
   *
   * **Custom Headers Limitation**: Custom headers set via `setCustomHeaders()` are NOT applied
   * to sendBeacon requests due to browser API limitations. The sendBeacon API only supports
   * Content-Type header via Blob. For scenarios requiring custom headers, ensure async
   * sends complete before page unload.
   *
   * **Credentials Limitation**: The `fetchCredentials` config option is NOT applied to
   * sendBeacon requests. `sendBeacon()` always sends cookies (equivalent to `credentials: 'include'`)
   * regardless of the configured value. If `fetchCredentials` is set to `'omit'` or `'same-origin'`,
   * only async `fetch()` calls honor that setting.
   *
   * @param body - Event queue to send
   * @returns `true` if send succeeded or was skipped, `false` if failed
   *
   * @see sendEventsQueue for async send with persistence
   * @see src/managers/README.md (lines 82-139) for send details
   */
  sendEventsQueueSync(e) {
    return this.shouldSkipSend() ? !0 : this.apiUrl?.includes($.Fail) ? (a(
      "warn",
      `Fail mode: simulating network failure (sync)${this.integrationId ? ` [${this.integrationId}]` : ""}`,
      {
        data: { events: e.events.length }
      }
    ), !1) : this.apiUrl?.includes($.Localhost) ? (a(
      "debug",
      `Success mode: simulating successful send (sync)${this.integrationId ? ` [${this.integrationId}]` : ""}`,
      {
        data: { events: e.events.length }
      }
    ), !0) : this.sendQueueSyncInternal(e);
  }
  /**
   * Persists events to localStorage for recovery without sending.
   *
   * Used when an async send is already in-flight to avoid sending the same
   * events through two paths (fetch + sendBeacon) with different idempotency tokens.
   * `ensureBatchMetadata()` assigns a stable token before persisting.
   * On next page load, `recoverPersistedEvents()` sends with the persisted token.
   *
   * @param body - Event queue to persist
   */
  persistForRecovery(e) {
    if (this.shouldSkipSend()) return;
    const t = this.ensureBatchMetadata(e);
    this.persistEventsWithFailureCount(t, 0, !0);
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
   * - **Timeout errors**: Events persisted for retry with the same batch idempotency token
   * - **Transient errors** (5xx, network, mixed): Events persisted for recovery
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
    const s = this.ensureBatchMetadata(e);
    try {
      const n = await this.send(s);
      return n ? (this.clearPersistedEvents(), t?.onSuccess?.(s.events.length, s.events, s)) : (this.persistEvents(s), t?.onFailure?.()), n;
    } catch (n) {
      return n instanceof O ? (this.logPermanentError("Permanent error, not retrying", n), this.clearPersistedEvents(), t?.onFailure?.(), !1) : (this.persistEvents(s), t?.onFailure?.(), !1);
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
    let t = null, s = 0;
    try {
      const n = this.getPersistedData();
      if (!n || !this.isDataRecent(n) || n.events.length === 0) {
        this.clearPersistedEvents();
        return;
      }
      const i = n.recoveryFailures;
      if (s = typeof i == "number" && Number.isFinite(i) && i >= 0 ? i : 0, s >= 3) {
        a(
          "debug",
          `Discarding persisted events after ${s} failed recovery attempts${this.integrationId ? ` [${this.integrationId}]` : ""}`
        ), this.clearPersistedEvents(), e?.onFailure?.();
        return;
      }
      t = this.ensureBatchMetadata(this.createRecoveryBody(n)), await this.send(t) ? (this.clearPersistedEvents(), e?.onSuccess?.(n.events.length, n.events, t)) : (this.persistEventsWithFailureCount(t, s + 1, !0), e?.onFailure?.());
    } catch (n) {
      if (n instanceof O) {
        this.logPermanentError("Permanent error during recovery, clearing persisted events", n), this.clearPersistedEvents(), e?.onFailure?.();
        return;
      }
      a("error", "Failed to recover persisted events", { error: n }), t && this.persistEventsWithFailureCount(t, s + 1, !0), e?.onFailure?.();
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
    const s = Es(
      e.events,
      t,
      this.integrationId || "SenderManager"
    );
    return s.length === 0 ? null : {
      ...e,
      events: s
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
    return t ? gt(e, t, this.integrationId || "SenderManager") : e;
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
    const t = 100 * Math.pow(2, e), s = Math.random() * 100, n = t + s;
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
    const s = this.applyBeforeBatchTransformer(t);
    if (!s)
      return !0;
    const n = this.ensureBatchMetadata(s, e._metadata?.idempotency_token);
    if (this.apiUrl?.includes($.Fail))
      return a("debug", `Fail mode: simulating network failure${this.integrationId ? ` [${this.integrationId}]` : ""}`, {
        data: { events: n.events.length }
      }), !1;
    if (this.apiUrl?.includes($.Localhost))
      return a("debug", `Success mode: simulating successful send${this.integrationId ? ` [${this.integrationId}]` : ""}`, {
        data: { events: n.events.length }
      }), !0;
    if (this.consecutiveNetworkFailures >= 3) {
      const u = Date.now() - this.circuitOpenedAt;
      if (u < 12e4)
        return a("debug", `Network circuit open, skipping send${this.integrationId ? ` [${this.integrationId}]` : ""}`, {
          data: {
            consecutiveNetworkFailures: this.consecutiveNetworkFailures,
            cooldownRemainingMs: 12e4 - u
          }
        }), !1;
    }
    const { url: i, payload: o } = this.prepareRequest(n);
    let l = !0, c = !1;
    for (let u = 1; u <= 3; u++)
      try {
        return (await this.sendWithTimeout(i, o)).ok ? (u > 1 && a(
          "info",
          `Send succeeded after ${u - 1} retry attempt(s)${this.integrationId ? ` [${this.integrationId}]` : ""}`,
          {
            data: { events: n.events.length, attempt: u }
          }
        ), this.consecutiveNetworkFailures = 0, this.circuitOpenedAt = 0, !0) : !1;
      } catch (f) {
        const g = u === 3;
        if (f instanceof O)
          throw this.consecutiveNetworkFailures = 0, this.circuitOpenedAt = 0, f;
        if (f instanceof re) {
          this.consecutiveNetworkFailures = 0, this.circuitOpenedAt = 0, l = !1, c = !0, a("warn", `Rate limited, skipping retries${this.integrationId ? ` [${this.integrationId}]` : ""}`, {
            data: { events: e.events.length, attempt: u }
          });
          break;
        }
        if (f instanceof ne || (l = !1), f instanceof TypeError || (c = !0), a(
          g ? "error" : "warn",
          `Send attempt ${u} failed${this.integrationId ? ` [${this.integrationId}]` : ""}${g ? " (all retries exhausted)" : ", will retry"}`,
          {
            error: f,
            data: {
              events: e.events.length,
              url: i.replace(/\/\/[^/]+/, "//[DOMAIN]"),
              attempt: u,
              maxAttempts: 3
            }
          }
        ), !g) {
          await this.backoffDelay(u);
          continue;
        }
        return l ? (a(
          "debug",
          `All retry attempts timed out, preserving batch for retry${this.integrationId ? ` [${this.integrationId}]` : ""}`,
          {
            data: { events: n.events.length }
          }
        ), !1) : (c ? (this.consecutiveNetworkFailures = 0, this.circuitOpenedAt = 0) : (this.consecutiveNetworkFailures = Math.min(
          this.consecutiveNetworkFailures + 1,
          3
        ), this.consecutiveNetworkFailures >= 3 && (this.circuitOpenedAt = Date.now())), !1);
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
   * - Aborted requests throw TimeoutError
   *
   * **Error Classification**:
   * - 4xx (except 408, 429): PermanentError thrown → no retries
   * - Timeout: TimeoutError thrown → caller treats it as a retryable failure
   * - 408, 429, 5xx, network: Standard Error thrown → triggers retry
   *
   * @param url - API endpoint URL
   * @param payload - JSON-stringified EventsQueue body
   * @returns Response object if successful
   * @throws PermanentError for unrecoverable 4xx errors
   * @throws TimeoutError when request times out
   * @throws Error for transient errors (5xx, network)
   * @private
   */
  async sendWithTimeout(e, t) {
    const s = new AbortController();
    this.pendingControllers.add(s);
    let n = !1;
    const i = setTimeout(() => {
      n = !0, s.abort();
    }, 15e3);
    try {
      const o = this.getCustomHeaders(), l = await fetch(e, {
        method: "POST",
        body: t,
        keepalive: !0,
        credentials: this.fetchCredentials,
        signal: s.signal,
        headers: {
          ...o,
          "Content-Type": "application/json"
        }
      });
      if (!l.ok)
        throw l.status >= 400 && l.status < 500 && l.status !== 408 && l.status !== 429 ? new O(`HTTP ${l.status}: ${l.statusText}`, l.status) : l.status === 429 ? new re(`HTTP 429: ${l.statusText}`) : new Error(`HTTP ${l.status}: ${l.statusText}`);
      return l;
    } catch (o) {
      throw o instanceof O ? o : n ? new ne("Request timed out") : o;
    } finally {
      clearTimeout(i), this.pendingControllers.delete(s);
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
   * @returns `true` on success, `false` on failure (events persisted for recovery)
   * @private
   */
  sendQueueSyncInternal(e) {
    const t = this.ensureBatchMetadata(e), s = this.applyBeforeSendTransformer(t);
    if (!s)
      return !0;
    const n = this.applyBeforeBatchTransformer(s);
    if (!n)
      return !0;
    const i = this.ensureBatchMetadata(n, t._metadata?.idempotency_token), { url: o, payload: l } = this.prepareRequest(i);
    if (l.length > 65536)
      return a(
        "warn",
        `Payload exceeds sendBeacon limit, persisting for recovery${this.integrationId ? ` [${this.integrationId}]` : ""}`,
        {
          data: {
            size: l.length,
            limit: 65536,
            events: i.events.length
          }
        }
      ), this.persistEvents(t), !1;
    const c = new Blob([l], { type: "application/json" });
    if (!this.isSendBeaconAvailable())
      return a(
        "warn",
        `sendBeacon not available, persisting events for recovery${this.integrationId ? ` [${this.integrationId}]` : ""}`
      ), this.persistEvents(t), !1;
    const u = navigator.sendBeacon(o, c);
    return u || (a(
      "warn",
      `sendBeacon rejected request, persisting events for recovery${this.integrationId ? ` [${this.integrationId}]` : ""}`
    ), this.persistEvents(t)), u;
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
   * **Idempotency Token**:
   * - Set upstream by ensureBatchMetadata() before this method is called
   * - Fallback computeContentToken() is defensive only (should not trigger in normal flow)
   * - Same token persists across all retry attempts of the same batch
   * - Backend uses this to deduplicate retries
   *
   * @param body - EventsQueue to send
   * @returns Object with `url` (API endpoint) and `payload` (JSON string)
   * @private
   */
  prepareRequest(e) {
    let t = Date.now();
    t < this.lastMetadataTimestamp && (t = this.lastMetadataTimestamp), this.lastMetadataTimestamp = t;
    const s = {
      ...e,
      _metadata: {
        ...e._metadata,
        idempotency_token: e._metadata?.idempotency_token ?? this.computeContentToken(e),
        referer: typeof window < "u" ? window.location.href : void 0,
        timestamp: t,
        client_version: Jt
      }
    };
    return {
      url: this.apiUrl || "",
      payload: JSON.stringify(s)
    };
  }
  ensureBatchMetadata(e, t) {
    const s = e._metadata?.idempotency_token ?? t ?? this.computeContentToken(e);
    return e._metadata?.idempotency_token === s ? e : {
      ...e,
      _metadata: {
        ...e._metadata,
        idempotency_token: s
      }
    };
  }
  /**
   * Deterministic 32-bit FNV-1a hash of sorted event IDs, salted with
   * `user_id` and `session_id`.
   *
   * **Purpose**: Produces the same idempotency token for the same set of events
   * across retries, so the backend's success cache catches in-session retries
   * before any MongoDB work. Replaces a random token that caused the API to
   * treat retried batches as new and emit `high_duplicate_rate` warnings.
   *
   * **Salting**: Scoping the hash by `user_id` + `session_id` ensures that
   * batches from different users/sessions cannot share a token even if their
   * event IDs hypothetically collided, eliminating cross-scope dedup risk
   * regardless of how the backend keys its success cache.
   *
   * @param body - Event queue whose events determine the token
   * @returns 8-char hex string
   * @private
   */
  computeContentToken(e) {
    const t = e.events.map((i) => i.id).sort().join(","), s = `${e.user_id}|${e.session_id}|${t}`;
    let n = 2166136261;
    for (let i = 0; i < s.length; i++)
      n ^= s.charCodeAt(i), n = Math.imul(n, 16777619) >>> 0;
    return n.toString(16).padStart(8, "0");
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
      a("debug", `Failed to parse persisted data${this.integrationId ? ` [${this.integrationId}]` : ""}`, { error: e }), this.clearPersistedEvents();
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
    const { timestamp: t, recoveryFailures: s, ...n } = e;
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
    return this.persistEventsWithFailureCount(e, 0);
  }
  /**
   * Persists failed events to localStorage, recording how many consecutive
   * cross-session recovery attempts have already been made for this batch.
   *
   * When `recoveryFailures` reaches MAX_RECOVERY_FAILURES on the next page load,
   * the batch is discarded rather than retried, preventing an infinite persistence
   * loop caused by a permanently unreachable backend URL.
   *
   * @param body - EventsQueue to persist
   * @param recoveryFailures - Number of failed recovery attempts already made
   * @param skipThrottle - Bypass the multi-tab throttle (used during recovery re-persistence)
   * @returns `true` on successful persistence or throttled write, `false` on error
   * @private
   */
  persistEventsWithFailureCount(e, t, s = !1) {
    try {
      const n = this.getPersistedData();
      if (!s && n && n.timestamp) {
        const l = Date.now() - n.timestamp;
        if (l < 1e3)
          return a(
            "debug",
            `Skipping persistence, another tab recently persisted events${this.integrationId ? ` [${this.integrationId}]` : ""}`,
            {
              data: { timeSinceExisting: l }
            }
          ), !0;
      }
      const i = {
        ...e,
        timestamp: Date.now(),
        ...t > 0 && { recoveryFailures: t }
      }, o = this.getQueueStorageKey();
      return this.storeManager.setItem(o, JSON.stringify(i)), !!this.storeManager.getItem(o);
    } catch (n) {
      return a("debug", `Failed to persist events${this.integrationId ? ` [${this.integrationId}]` : ""}`, { error: n }), !1;
    }
  }
  clearPersistedEvents() {
    try {
      const e = this.getQueueStorageKey();
      this.storeManager.removeItem(e);
    } catch (e) {
      a("debug", `Failed to clear persisted events${this.integrationId ? ` [${this.integrationId}]` : ""}`, {
        error: e
      });
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
    const s = Date.now();
    (!this.lastPermanentErrorLog || this.lastPermanentErrorLog.statusCode !== t.statusCode || s - this.lastPermanentErrorLog.timestamp >= zt) && (a("error", `${e}${this.integrationId ? ` [${this.integrationId}]` : ""}`, {
      data: { status: t.statusCode, message: t.message }
    }), this.lastPermanentErrorLog = { statusCode: t.statusCode, timestamp: s });
  }
}
class ps extends _ {
  bootTime;
  bootTimestamp;
  hasPerformanceNow;
  lastClockSkewCheck = 0;
  detectedSkew = 0;
  /**
   * Creates a TimeManager instance and establishes boot time reference.
   *
   * **Initialization**:
   * 1. Captures `performance.now()` as boot time (monotonic clock)
   * 2. Captures `Date.now()` as boot timestamp (wall clock)
   * 3. Detects if `performance.now()` is available (for fallback)
   *
   * **Boot Time**: Reference point for all subsequent timestamp calculations
   * - All timestamps are relative to this boot time
   * - Immune to system clock changes after initialization
   *
   * **SSR Safety**: In non-browser environments (Node.js, SSR), falls back to Date.now()
   */
  constructor() {
    if (super(), typeof window > "u") {
      this.hasPerformanceNow = !1, this.bootTime = 0, this.bootTimestamp = 0;
      return;
    }
    this.hasPerformanceNow = typeof performance < "u" && typeof performance.now == "function", this.hasPerformanceNow ? (this.bootTime = performance.now(), this.bootTimestamp = Date.now(), a("debug", "TimeManager initialized with monotonic clock", {
      data: {
        bootTime: this.bootTime.toFixed(3),
        bootTimestamp: this.bootTimestamp
      }
    })) : (this.bootTime = 0, this.bootTimestamp = Date.now(), a("debug", "performance.now() not available, falling back to Date.now()"));
  }
  /**
   * Returns current timestamp in milliseconds since epoch.
   *
   * **Calculation**:
   * - If `performance.now()` available: `bootTimestamp + (performance.now() - bootTime)`
   * - Otherwise: `Date.now()` (fallback)
   *
   * **Advantages over Date.now()**:
   * - Immune to system clock changes during session
   * - More accurate (microsecond precision)
   * - Prevents future timestamp errors from clock adjustments
   *
   * @returns Timestamp in milliseconds since Unix epoch
   *
   * @example
   * ```typescript
   * const eventTimestamp = timeManager.now();
   * // Always accurate relative to boot time, even if system clock changes
   * ```
   */
  now() {
    if (!this.hasPerformanceNow)
      return Date.now();
    const e = performance.now() - this.bootTime;
    return Math.round(this.bootTimestamp + e);
  }
  /**
   * Detects clock skew by comparing monotonic time vs system time.
   *
   * **Purpose**: Identifies when the system clock has changed during the session.
   *
   * **Detection Method**:
   * 1. Calculate expected timestamp using monotonic clock: `now()`
   * 2. Compare with actual system time: `Date.now()`
   * 3. Difference is the clock skew
   *
   * **Clock Skew Scenarios**:
   * - Positive skew: System clock jumped forward (e.g., NTP correction)
   * - Negative skew: System clock jumped backward (rare, usually manual adjustment)
   * - Near zero: No significant clock drift
   *
   * **Throttling**: Only checks every 5 seconds to avoid performance impact
   *
   * @returns Clock skew in milliseconds (positive = clock ahead, negative = clock behind)
   *
   * @example
   * ```typescript
   * const skew = timeManager.getClockSkew();
   * if (Math.abs(skew) > 30000) {
   *   console.warn(`System clock drifted by ${skew}ms`);
   * }
   * ```
   */
  getClockSkew() {
    if (!this.hasPerformanceNow)
      return 0;
    const e = Date.now();
    if (e - this.lastClockSkewCheck < 5e3)
      return this.detectedSkew;
    this.lastClockSkewCheck = e;
    const t = this.now(), s = Date.now();
    return this.detectedSkew = s - t, Math.abs(this.detectedSkew) > 3e4 && a("warn", "Significant clock skew detected", {
      data: {
        skewMs: this.detectedSkew,
        skewMinutes: (this.detectedSkew / 1e3 / 60).toFixed(2),
        monotonicTime: new Date(t).toISOString(),
        systemTime: new Date(s).toISOString()
      }
    }), this.detectedSkew;
  }
  /**
   * Validates if a timestamp is reasonable (not too far in the future).
   *
   * **Purpose**: Client-side validation to catch obviously wrong timestamps
   * before sending to backend.
   *
   * **Validation Rules**:
   * - Timestamp must not be >2 minutes in the future (relative to monotonic clock)
   * - Prevents backend rejections due to clock skew
   * - More lenient than backend (allows up to 2 min vs backend's 3 min)
   *
   * **Use Case**: Validate event timestamps before adding to queue
   *
   * @param timestamp - Timestamp to validate (milliseconds since epoch)
   * @returns Object with `valid` boolean and optional `error` message
   *
   * @example
   * ```typescript
   * const validation = timeManager.validateTimestamp(eventTimestamp);
   * if (!validation.valid) {
   *   console.error('Invalid timestamp:', validation.error);
   * }
   * ```
   */
  validateTimestamp(e) {
    const s = this.now(), n = e - s;
    return n > 12e4 ? {
      valid: !1,
      error: `Timestamp is ${(n / 1e3 / 60).toFixed(2)} minutes in the future (max allowed: 2 minutes)`
    } : { valid: !0 };
  }
  /**
   * Returns boot time information for debugging.
   *
   * **Purpose**: Diagnostic utility for troubleshooting timestamp issues.
   *
   * @returns Object with boot time details
   */
  getBootInfo() {
    return {
      bootTime: this.bootTime,
      bootTimestamp: this.bootTimestamp,
      hasPerformanceNow: this.hasPerformanceNow,
      clockSkew: this.getClockSkew()
    };
  }
}
const Ss = new Set(Object.values(d));
class Ts extends _ {
  dataSenders;
  emitter;
  transformers;
  timeManager;
  recentEventFingerprints = /* @__PURE__ */ new Map();
  perEventRateLimits = /* @__PURE__ */ new Map();
  eventsQueue = [];
  pendingEventsBuffer = [];
  sendTimeoutId = null;
  sendInProgress = !1;
  consecutiveSendFailures = 0;
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
   * @param staticHeaders - Optional static HTTP headers for custom backend (from config)
   * @param customHeadersProvider - Optional callback for dynamic headers
   * @param fetchCredentials - Fetch credentials mode for custom backend. @default 'include'
   */
  constructor(e, t = null, s = {}, n = {}, i, o = "include") {
    super(), this.emitter = t, this.transformers = s, this.timeManager = new ps(), this.dataSenders = [];
    const l = this.get("collectApiUrls");
    l?.saas && this.dataSenders.push(new Ze(e, "saas", l.saas, s)), l?.custom && this.dataSenders.push(
      new Ze(
        e,
        "custom",
        l.custom,
        s,
        n,
        i,
        o
      )
    ), this.saveSessionCountsDebounced = this.debounce((c) => {
      this.saveSessionCounts(c);
    }, 500), this.cleanupExpiredSessionCounts();
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
        onSuccess: (s, n, i) => {
          if (n && n.length > 0) {
            const o = n.map((l) => l.id);
            this.removeProcessedEvents(o), i && this.emitEventsQueue(i);
          }
        },
        onFailure: () => {
          a("debug", "Failed to recover persisted events");
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
    from_page_url: s,
    scroll_data: n,
    click_data: i,
    custom_event: o,
    web_vitals: l,
    error_data: c,
    viewport_data: u,
    page_view: f
  }) {
    if (!e) {
      a("error", "Event type is required - event will be ignored");
      return;
    }
    if (!Ss.has(e)) {
      a("error", "Invalid event type - event will be ignored", {
        data: { type: e }
      });
      return;
    }
    const g = this.get("sessionId");
    if (!g) {
      this.pendingEventsBuffer.length >= 100 && (this.pendingEventsBuffer.shift(), a("debug", "Pending events buffer full - dropping oldest event", {
        data: { maxBufferSize: 100 }
      })), this.pendingEventsBuffer.push({
        type: e,
        page_url: t,
        from_page_url: s,
        scroll_data: n,
        click_data: i,
        custom_event: o,
        web_vitals: l,
        error_data: c,
        viewport_data: u,
        page_view: f
      });
      return;
    }
    this.lastSessionId !== g && (this.lastSessionId = g, this.sessionEventCounts = this.loadSessionCounts(g));
    const T = e === d.SESSION_START;
    if (T && a("debug", "Processing SESSION_START event", {
      data: { sessionId: g }
    }), !T && !this.checkRateLimit())
      return;
    const p = e;
    if (!T) {
      if (this.sessionEventCounts.total >= 1e3) {
        a("warn", "Session event limit reached", {
          data: {
            type: p,
            total: this.sessionEventCounts.total,
            limit: 1e3
          }
        });
        return;
      }
      const v = this.getTypeLimitForEvent(p);
      if (v) {
        const he = this.sessionEventCounts[p];
        if (he !== void 0 && he >= v) {
          a("warn", "Session event type limit reached", {
            data: {
              type: p,
              count: he,
              limit: v
            }
          });
          return;
        }
      }
    }
    if (p === d.CUSTOM && o?.name) {
      const v = this.get("config")?.maxSameEventPerMinute ?? 60;
      if (!this.checkPerEventRateLimit(o.name, v))
        return;
    }
    const Ve = p === d.SESSION_START, K = t || this.get("pageUrl"), x = this.buildEventPayload({
      type: p,
      page_url: K,
      from_page_url: s,
      scroll_data: n,
      click_data: i,
      custom_event: o,
      web_vitals: l,
      error_data: c,
      viewport_data: u,
      page_view: f
    });
    if (x && !(!T && !this.shouldSample())) {
      if (Ve) {
        const v = this.get("sessionId");
        if (!v) {
          a("error", "Session start event requires sessionId - event will be ignored");
          return;
        }
        if (this.get("hasStartSession")) {
          a("debug", "Duplicate session_start detected", {
            data: { sessionId: v }
          });
          return;
        }
        this.set("hasStartSession", !0);
      }
      if (!this.isDuplicateEvent(x)) {
        if (this.get("mode") === ie.QA) {
          if (p === d.CUSTOM && o) {
            a("info", `Custom Event: ${o.name}`, {
              visibility: "qa",
              data: {
                name: o.name,
                ...o.metadata && { metadata: o.metadata }
              }
            }), this.emitEvent(x);
            return;
          }
          if (p === d.VIEWPORT_VISIBLE && u) {
            const v = u.name || u.id || u.selector;
            a("info", `Viewport Visible: ${v}`, {
              visibility: "qa",
              data: {
                selector: u.selector,
                ...u.name && { name: u.name },
                ...u.id && { id: u.id },
                visibilityRatio: u.visibilityRatio,
                dwellTime: u.dwellTime
              }
            }), this.emitEvent(x);
            return;
          }
        }
        if (this.addToQueue(x), !T) {
          this.sessionEventCounts.total++, this.sessionEventCounts[p] !== void 0 && this.sessionEventCounts[p]++;
          const v = this.get("sessionId");
          v && this.saveSessionCountsDebounced && this.saveSessionCountsDebounced(v);
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
    this.clearSendTimeout(), this.sendInProgress = !1, this.consecutiveSendFailures = 0;
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
   * Sets the custom headers provider callback for the custom integration.
   * Only affects requests to custom backend (not TraceLog SaaS).
   *
   * @param provider - Callback function that returns custom headers
   */
  setCustomHeadersProvider(e) {
    for (const t of this.dataSenders)
      t.getIntegrationId() === "custom" && t.setCustomHeadersProvider(e);
  }
  /**
   * Removes the custom headers provider callback from the custom integration.
   */
  removeCustomHeadersProvider() {
    for (const e of this.dataSenders)
      e.getIntegrationId() === "custom" && e.removeCustomHeadersProvider();
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
      a("debug", "Cannot flush pending events: session not initialized - keeping in buffer", {
        data: { bufferedEventCount: this.pendingEventsBuffer.length }
      });
      return;
    }
    const t = [...this.pendingEventsBuffer];
    this.pendingEventsBuffer = [], t.forEach((s) => {
      this.track(s);
    });
  }
  clearSendTimeout() {
    this.sendTimeoutId !== null && (clearTimeout(this.sendTimeoutId), this.sendTimeoutId = null);
  }
  isSuccessfulResult(e) {
    return e.status === "fulfilled" && e.value === !0;
  }
  flushEvents(e) {
    if (this.eventsQueue.length === 0)
      return e ? !0 : Promise.resolve(!0);
    if (!e && this.sendInProgress)
      return a("debug", "Async flush skipped: send already in progress"), Promise.resolve(!1);
    const t = this.buildEventsPayload(), s = [...this.eventsQueue], n = s.map((i) => i.id);
    if (this.dataSenders.length === 0)
      return this.removeProcessedEvents(n), this.clearSendTimeout(), this.emitEventsQueue(t), e ? !0 : Promise.resolve(!0);
    if (e && this.sendInProgress) {
      for (const i of this.dataSenders)
        i.persistForRecovery(t);
      return a("debug", "Sync flush deferred: async send in progress, events persisted for recovery", {
        data: { eventCount: n.length }
      }), !0;
    }
    if (e) {
      const o = this.dataSenders.map((l) => l.sendEventsQueueSync(t)).some((l) => l);
      return o ? (this.removeProcessedEvents(n), this.clearSendTimeout(), this.emitEventsQueue(t)) : (this.clearSendTimeout(), a("debug", "Sync flush complete failure, events kept in queue for retry", {
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
        return l ? (this.removeProcessedEvents(n), this.clearSendTimeout(), this.emitEventsQueue(t)) : a("debug", "Async flush complete failure, events kept in queue for retry", {
          data: { eventCount: s.length }
        }), l;
      });
    }
  }
  async sendEventsQueue() {
    if (!(!this.get("sessionId") || this.eventsQueue.length === 0 || this.sendInProgress)) {
      this.sendInProgress = !0;
      try {
        const e = this.buildEventsPayload();
        if (this.dataSenders.length === 0) {
          this.emitEventsQueue(e);
          return;
        }
        const t = [...this.eventsQueue], s = t.map((l) => l.id), n = this.dataSenders.map(
          async (l) => l.sendEventsQueue(e, {
            onSuccess: () => {
            },
            onFailure: () => {
            }
          })
        ), i = await Promise.allSettled(n);
        if (i.some((l) => this.isSuccessfulResult(l))) {
          this.consecutiveSendFailures = 0, this.removeProcessedEvents(s), this.emitEventsQueue(e);
          const l = i.filter((c) => !this.isSuccessfulResult(c)).length;
          l > 0 && a("debug", "Periodic send completed with some failures, removed from queue and persisted per-integration", {
            data: { eventCount: t.length, failedCount: l }
          });
        } else
          this.consecutiveSendFailures = Math.min(this.consecutiveSendFailures + 1, 5), a("debug", "Periodic send complete failure, events kept in queue for retry", {
            data: { eventCount: t.length }
          });
        this.eventsQueue.length === 0 ? this.clearSendTimeout() : this.scheduleSendTimeout();
      } finally {
        this.sendInProgress = !1;
      }
    }
  }
  buildEventsPayload() {
    const e = /* @__PURE__ */ new Map(), t = [];
    for (const c of this.eventsQueue) {
      const u = this.createEventSignature(c);
      e.has(u) || t.push(u), e.set(u, c);
    }
    const s = t.map((c) => e.get(c)).filter((c) => !!c).sort((c, u) => c.type === d.SESSION_START && u.type !== d.SESSION_START ? -1 : u.type === d.SESSION_START && c.type !== d.SESSION_START ? 1 : c.timestamp - u.timestamp);
    let n = {
      user_id: this.get("userId"),
      session_id: this.get("sessionId"),
      device: this.get("device"),
      events: s,
      ...this.get("config")?.globalMetadata && { global_metadata: this.get("config")?.globalMetadata },
      ...this.get("identity") && { identify: this.get("identity") }
    };
    const i = this.get("collectApiUrls"), o = !!(i?.custom || i?.saas), l = this.transformers.beforeBatch;
    if (!o && l) {
      const c = gt(n, l, "EventManager");
      c !== null && (n = c);
    }
    return n;
  }
  buildEventPayload(e) {
    const t = e.page_url ?? this.get("pageUrl"), s = this.timeManager.now(), n = this.timeManager.validateTimestamp(s);
    n.valid || a("warn", "Event timestamp validation failed", {
      data: { type: e.type, error: n.error }
    });
    const i = this.get("sessionReferrer"), o = this.get("sessionUtm");
    let l = {
      id: ns(),
      type: e.type,
      page_url: t,
      timestamp: s,
      ...i && { referrer: i },
      ...e.from_page_url && { from_page_url: e.from_page_url },
      ...e.scroll_data && { scroll_data: e.scroll_data },
      ...e.click_data && { click_data: e.click_data },
      ...e.custom_event && { custom_event: e.custom_event },
      ...e.web_vitals && { web_vitals: e.web_vitals },
      ...e.error_data && { error_data: e.error_data },
      ...e.viewport_data && { viewport_data: e.viewport_data },
      ...e.page_view && { page_view: e.page_view },
      ...o && { utm: o }
    };
    const c = this.get("collectApiUrls"), u = !!c?.custom, f = !!c?.saas, g = u || f, T = u && f, p = this.transformers.beforeSend;
    if (p && (!g || u && !T)) {
      const K = mt(l, p, "EventManager");
      if (K === null)
        return null;
      l = K;
    }
    return l;
  }
  isDuplicateEvent(e) {
    const t = Date.now(), s = this.createEventFingerprint(e), n = this.recentEventFingerprints.get(s);
    return n && t - n < 1e3 ? (this.recentEventFingerprints.set(s, t), !0) : (this.recentEventFingerprints.set(s, t), this.recentEventFingerprints.size > 1500 && this.pruneOldFingerprints(), this.recentEventFingerprints.size > 3e3 && (this.recentEventFingerprints.clear(), this.recentEventFingerprints.set(s, t), a("debug", "Event fingerprint cache exceeded hard limit, cleared", {
      data: { hardLimit: 3e3 }
    })), !1);
  }
  pruneOldFingerprints() {
    const e = Date.now(), t = 1e3 * 10;
    for (const [s, n] of this.recentEventFingerprints.entries())
      e - n > t && this.recentEventFingerprints.delete(s);
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
      const s = Math.round((e.click_data.x || 0) / 10) * 10, n = Math.round((e.click_data.y || 0) / 10) * 10;
      t += `_click_${s}_${n}`;
    }
    return e.scroll_data && (t += `_scroll_${e.scroll_data.depth}_${e.scroll_data.direction}`), e.custom_event && (t += `_custom_${e.custom_event.name}`, e.custom_event.metadata && (t += `_${this.stableStringify(e.custom_event.metadata)}`)), e.web_vitals && (t += `_vitals_${e.web_vitals.type}`), e.error_data && (t += `_error_${e.error_data.type}_${e.error_data.message}`), t;
  }
  createEventSignature(e) {
    return this.createEventFingerprint(e);
  }
  /** Deterministic JSON string with sorted keys to ensure consistent fingerprints regardless of property insertion order */
  stableStringify(e) {
    return JSON.stringify(e, (t, s) => s && typeof s == "object" && !Array.isArray(s) ? Object.keys(s).sort().reduce((n, i) => (n[i] = s[i], n), {}) : s);
  }
  addToQueue(e) {
    if (this.emitEvent(e), this.eventsQueue.push(e), this.eventsQueue.length > 100) {
      const t = this.eventsQueue.findIndex((n) => n.type !== d.SESSION_START), s = t >= 0 ? this.eventsQueue.splice(t, 1)[0] : this.eventsQueue.shift();
      a("warn", "Event queue overflow, oldest non-critical event removed", {
        data: {
          maxLength: 100,
          currentLength: this.eventsQueue.length,
          removedEventType: s?.type,
          wasCritical: s?.type === d.SESSION_START
        }
      });
    }
    this.scheduleSendTimeout(), this.eventsQueue.length >= 50 && this.consecutiveSendFailures < 5 && this.sendEventsQueue();
  }
  scheduleSendTimeout() {
    if (this.sendTimeoutId !== null) return;
    const e = this.calculateSendDelay();
    this.sendTimeoutId = window.setTimeout(() => {
      this.sendTimeoutId = null, this.eventsQueue.length > 0 && this.sendEventsQueue();
    }, e);
  }
  calculateSendDelay() {
    const e = this.get("config")?.sendIntervalMs ?? 1e4;
    if (this.consecutiveSendFailures === 0) return e;
    const t = e * Math.pow(2, this.consecutiveSendFailures);
    return Math.min(t, 12e4);
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
    const s = Date.now(), i = (this.perEventRateLimits.get(e) ?? []).filter((o) => s - o < 6e4);
    return i.length >= t ? (a("warn", "Per-event rate limit exceeded for custom event", {
      data: {
        eventName: e,
        limit: t,
        window: `${6e4 / 1e3}s`
      }
    }), !1) : (i.push(s), this.perEventRateLimits.set(e, i), !0);
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
    this.eventsQueue = this.eventsQueue.filter((s) => !t.has(s.id));
  }
  emitEvent(e) {
    this.emitter && this.emitter.emit(se.EVENT, e);
  }
  emitEventsQueue(e) {
    this.emitter && this.emitter.emit(se.QUEUE, e);
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
    let s = null;
    return ((...n) => {
      s !== null && clearTimeout(s), s = setTimeout(() => {
        e(...n), s = null;
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
    const t = this.get("userId") || "anonymous", s = Fe(t, e);
    try {
      const n = localStorage.getItem(s);
      if (!n)
        return this.getInitialCounts();
      const i = JSON.parse(n);
      return i._timestamp && Date.now() - i._timestamp > xe ? (a("debug", "Session counts expired, clearing", {
        data: { sessionId: e, age: Date.now() - i._timestamp }
      }), localStorage.removeItem(s), this.getInitialCounts()) : typeof i.total == "number" && typeof i[d.CLICK] == "number" && typeof i[d.PAGE_VIEW] == "number" && typeof i[d.CUSTOM] == "number" && typeof i[d.VIEWPORT_VISIBLE] == "number" && typeof i[d.SCROLL] == "number" ? {
        total: i.total,
        [d.CLICK]: i[d.CLICK],
        [d.PAGE_VIEW]: i[d.PAGE_VIEW],
        [d.CUSTOM]: i[d.CUSTOM],
        [d.VIEWPORT_VISIBLE]: i[d.VIEWPORT_VISIBLE],
        [d.SCROLL]: i[d.SCROLL]
      } : (a("warn", "Invalid session counts structure in localStorage, resetting", {
        data: { sessionId: e, parsed: i }
      }), localStorage.removeItem(s), a("debug", "Session counts removed due to invalid/corrupted data", {
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
    if (!(typeof window > "u" || typeof localStorage > "u"))
      try {
        const e = localStorage.getItem($e);
        if (e) {
          const i = Date.now() - parseInt(e, 10);
          if (i < Be) {
            a("debug", "Skipping session counts cleanup (throttled)", {
              data: { timeSinceLastCleanup: i, throttleMs: Be }
            });
            return;
          }
        }
        const t = this.get("userId") || "anonymous", s = `${I}:${t}:session_counts:`, n = [];
        for (let i = 0; i < localStorage.length; i++) {
          const o = localStorage.key(i);
          if (o?.startsWith(s))
            try {
              const l = localStorage.getItem(o);
              if (l) {
                const c = JSON.parse(l);
                c._timestamp && Date.now() - c._timestamp > xe && n.push(o);
              }
            } catch {
            }
        }
        n.forEach((i) => {
          localStorage.removeItem(i), a("debug", "Cleaned up expired session counts", { data: { key: i } });
        }), n.length > 0 && a("info", `Cleaned up ${n.length} expired session counts entries`), localStorage.setItem($e, Date.now().toString());
      } catch (e) {
        a("warn", "Failed to cleanup expired session counts", { error: e });
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
  saveSessionCounts(e) {
    const t = this.get("userId") || "anonymous", s = Fe(t, e);
    try {
      const n = {
        ...this.sessionEventCounts,
        _timestamp: Date.now(),
        _version: 1
      };
      localStorage.setItem(s, JSON.stringify(n));
    } catch (n) {
      a("warn", "Failed to persist session counts to localStorage", {
        error: n,
        data: { sessionId: e }
      });
    }
  }
}
class Is {
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
    const t = e.getItem(Te);
    if (t)
      return t;
    const s = ut();
    return e.setItem(Te, s), s;
  }
}
const vs = /^\d{13}-[a-z0-9]{9}$/;
class _s extends _ {
  storageManager;
  eventManager;
  projectId;
  activityHandler = null;
  visibilityChangeHandler = null;
  sessionTimeoutId = null;
  broadcastChannel = null;
  isTracking = !1;
  needsRenewal = !1;
  /**
   * Creates a SessionManager instance.
   *
   * @param storageManager - Storage manager for session persistence
   * @param eventManager - Event manager for SESSION_START events
   * @param projectId - Project identifier for namespacing session storage
   */
  constructor(e, t, s) {
    super(), this.storageManager = e, this.eventManager = t, this.projectId = s;
  }
  initCrossTabSync() {
    if (typeof BroadcastChannel > "u") {
      a("debug", "BroadcastChannel not supported");
      return;
    }
    const e = this.getProjectId();
    this.broadcastChannel = new BroadcastChannel(Nt(e)), this.broadcastChannel.onmessage = (t) => {
      const { action: s, sessionId: n, timestamp: i, projectId: o } = t.data ?? {};
      o === e && (s === "session_start" && n && typeof i == "number" && i > Date.now() - 5e3 ? (this.set("sessionId", n), this.persistSession(n, i), this.isTracking && this.setupSessionTimeout()) : s && s !== "session_start" && a("debug", "Ignored BroadcastChannel message with unknown action", { data: { action: s } }));
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
  cleanupCrossTabSync() {
    this.broadcastChannel && (typeof this.broadcastChannel.close == "function" && this.broadcastChannel.close(), this.broadcastChannel = null);
  }
  recoverSession() {
    const e = this.loadStoredSession();
    if (!e)
      return null;
    if (!vs.test(e.id))
      return a("warn", "Invalid session ID format recovered from storage, clearing", {
        data: { sessionId: e.id }
      }), this.clearStoredSession(), null;
    const t = this.get("config")?.sessionTimeout ?? 9e5;
    return Date.now() - e.lastActivity > t ? (this.clearStoredSession(), null) : e.id;
  }
  persistSession(e, t = Date.now(), s, n) {
    this.saveStoredSession({
      id: e,
      lastActivity: t,
      ...s && { referrer: s },
      ...n && { utm: n }
    });
  }
  clearStoredSession() {
    const e = this.getSessionStorageKey();
    this.storageManager.removeItem(e);
  }
  loadStoredSession() {
    const e = this.getSessionStorageKey(), t = this.storageManager.getItem(e);
    if (t !== null)
      try {
        const n = JSON.parse(t);
        if (n.id && typeof n.lastActivity == "number")
          return n;
      } catch {
        this.storageManager.removeItem(e);
      }
    const s = this.storageManager.getSessionItem(e);
    if (s !== null)
      try {
        const n = JSON.parse(s);
        if (n.id && typeof n.lastActivity == "number")
          return n;
      } catch {
        this.storageManager.removeSessionItem(e);
      }
    return null;
  }
  saveStoredSession(e) {
    const t = this.getSessionStorageKey(), s = JSON.stringify(e);
    this.storageManager.setItem(t, s), this.storageManager.setSessionItem(t, s);
  }
  getSessionStorageKey() {
    return Rt(this.getProjectId());
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
      a("debug", "Session tracking already active");
      return;
    }
    const e = this.recoverSession(), t = e ?? this.generateSessionId();
    let s, n;
    if (e) {
      const i = this.loadStoredSession();
      s = i?.referrer ?? me(), n = i?.utm ?? ge();
    } else
      s = me(), n = ge();
    a("debug", "Session tracking initialized", {
      data: {
        sessionId: t,
        wasRecovered: !!e,
        willEmitSessionStart: !e,
        sessionReferrer: s,
        hasUtm: !!n
      }
    }), this.isTracking = !0;
    try {
      this.set("sessionId", t), this.set("sessionReferrer", s), this.set("sessionUtm", n), this.persistSession(t, Date.now(), s, n), this.initCrossTabSync(), this.shareSession(t), e ? a("debug", "Session recovered, skipping SESSION_START", {
        data: { sessionId: t }
      }) : (a("debug", "Emitting SESSION_START event", {
        data: { sessionId: t }
      }), this.eventManager.track({
        type: d.SESSION_START
      })), this.setupSessionTimeout(), this.setupActivityListeners(), this.setupLifecycleListeners();
    } catch (i) {
      throw this.isTracking = !1, this.clearSessionTimeout(), this.cleanupActivityListeners(), this.cleanupLifecycleListeners(), this.cleanupCrossTabSync(), this.set("sessionId", null), i;
    }
  }
  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
  setupSessionTimeout() {
    this.clearSessionTimeout();
    const e = this.get("config")?.sessionTimeout ?? 9e5;
    this.sessionTimeoutId = setTimeout(() => {
      this.enterRenewalMode();
    }, e);
  }
  resetSessionTimeout() {
    this.setupSessionTimeout();
    const e = this.get("sessionId");
    e && this.persistSession(e, Date.now(), this.get("sessionReferrer"), this.get("sessionUtm"));
  }
  clearSessionTimeout() {
    this.sessionTimeoutId && (clearTimeout(this.sessionTimeoutId), this.sessionTimeoutId = null);
  }
  setupActivityListeners() {
    this.activityHandler = () => {
      this.needsRenewal ? this.renewSession() : this.resetSessionTimeout();
    }, document.addEventListener("click", this.activityHandler, { passive: !0 }), document.addEventListener("keydown", this.activityHandler, { passive: !0 }), document.addEventListener("scroll", this.activityHandler, { passive: !0 });
  }
  /**
   * Renews the session after timeout when user returns.
   * Creates a new session ID and emits SESSION_START.
   */
  renewSession() {
    this.needsRenewal = !1;
    const e = this.generateSessionId(), t = me(), s = ge();
    a("debug", "Renewing session after timeout", {
      data: { newSessionId: e }
    }), this.set("sessionId", e), this.set("sessionReferrer", t), this.set("sessionUtm", s), this.persistSession(e, Date.now(), t, s), this.cleanupCrossTabSync(), this.initCrossTabSync(), this.shareSession(e), this.eventManager.track({
      type: d.SESSION_START
    }), this.eventManager.flushPendingEvents(), this.setupSessionTimeout();
  }
  cleanupActivityListeners() {
    this.activityHandler && (document.removeEventListener("click", this.activityHandler), document.removeEventListener("keydown", this.activityHandler), document.removeEventListener("scroll", this.activityHandler), this.activityHandler = null);
  }
  setupLifecycleListeners() {
    this.visibilityChangeHandler || (this.visibilityChangeHandler = () => {
      if (document.hidden)
        this.clearSessionTimeout();
      else {
        if (this.isSessionStale()) {
          a("debug", "Session expired during suspend, entering renewal mode"), this.enterRenewalMode();
          return;
        }
        this.get("sessionId") && this.setupSessionTimeout();
      }
    }, document.addEventListener("visibilitychange", this.visibilityChangeHandler));
  }
  /**
   * Checks if the current session has become stale (expired during browser suspend).
   * This handles the case where JavaScript timers are paused during suspend/hibernate.
   */
  isSessionStale() {
    if (this.needsRenewal || !this.get("sessionId"))
      return !1;
    const t = this.loadStoredSession();
    if (!t)
      return !1;
    const s = this.get("config")?.sessionTimeout ?? 9e5;
    return Date.now() - t.lastActivity > s;
  }
  cleanupLifecycleListeners() {
    this.visibilityChangeHandler && (document.removeEventListener("visibilitychange", this.visibilityChangeHandler), this.visibilityChangeHandler = null);
  }
  /**
   * Enters renewal mode after session timeout.
   * Keeps activity listeners active to detect when user returns.
   * Called by session timeout timer.
   */
  enterRenewalMode() {
    this.clearSessionTimeout(), this.cleanupCrossTabSync(), this.clearStoredSession(), this.set("sessionId", null), this.set("hasStartSession", !1), this.set("sessionReferrer", void 0), this.set("sessionUtm", void 0), this.needsRenewal = !0, a("debug", "Session timed out, entering renewal mode");
  }
  /**
   * Fully resets session state and cleans up all resources.
   * Called by stopTracking() for explicit session termination.
   */
  resetSessionState() {
    this.clearSessionTimeout(), this.cleanupActivityListeners(), this.cleanupLifecycleListeners(), this.cleanupCrossTabSync(), this.clearStoredSession(), this.set("sessionId", null), this.set("hasStartSession", !1), this.set("sessionReferrer", void 0), this.set("sessionUtm", void 0), this.needsRenewal = !1, this.isTracking = !1;
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
    this.clearSessionTimeout(), this.cleanupActivityListeners(), this.cleanupCrossTabSync(), this.cleanupLifecycleListeners(), this.isTracking = !1, this.needsRenewal = !1, this.set("hasStartSession", !1);
  }
}
class ys extends _ {
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
      a("debug", "Cannot start tracking on destroyed handler");
      return;
    }
    const t = this.get("config")?.integrations?.tracelog?.projectId ?? "custom";
    try {
      this.sessionManager = new _s(this.storageManager, this.eventManager, t), this.sessionManager.startTracking(), this.eventManager.flushPendingEvents();
    } catch (s) {
      if (this.sessionManager) {
        try {
          this.sessionManager.destroy();
        } catch {
        }
        this.sessionManager = null;
      }
      throw a("error", "Failed to start session tracking", { error: s }), s;
    }
  }
  isActive() {
    return this.sessionManager !== null && !this.destroyed;
  }
  cleanupSessionManager() {
    this.sessionManager && (this.sessionManager.stopTracking(), this.sessionManager.destroy(), this.sessionManager = null);
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
    this.destroyed || (this.sessionManager && (this.sessionManager.destroy(), this.sessionManager = null), this.destroyed = !0);
  }
}
class ws extends _ {
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
    e === "pushState" && !this.originalPushState ? this.originalPushState = t : e === "replaceState" && !this.originalReplaceState && (this.originalReplaceState = t), window.history[e] = (...s) => {
      t.apply(window.history, s), this.trackCurrentPage();
    };
  }
  trackCurrentPage = () => {
    const e = window.location.href, t = ye(e, this.get("config").sensitiveQueryParams);
    if (this.get("pageUrl") === t)
      return;
    const s = Date.now(), n = this.get("config").pageViewThrottleMs ?? 1e3;
    if (s - this.lastPageViewTime < n)
      return;
    this.lastPageViewTime = s, this.onTrack();
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
    const e = ye(window.location.href, this.get("config").sensitiveQueryParams), t = this.extractPageViewData();
    this.lastPageViewTime = Date.now(), this.eventManager.track({
      type: d.PAGE_VIEW,
      page_url: e,
      ...t && { page_view: t }
    }), this.onTrack();
  }
  extractPageViewData() {
    const { pathname: e, search: t, hash: s } = window.location, { referrer: n } = document, { title: i } = document;
    return !n && !i && !e && !t && !s ? void 0 : {
      ...n && { referrer: n },
      ...i && { title: i },
      ...e && { pathname: e },
      ...t && { search: t },
      ...s && { hash: s }
    };
  }
}
class bs extends _ {
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
      const t = e, s = t.target, n = typeof HTMLElement < "u" && s instanceof HTMLElement ? s : typeof HTMLElement < "u" && s instanceof Node && s.parentElement instanceof HTMLElement ? s.parentElement : null;
      if (!n) {
        a("debug", "Click target not found or not an element");
        return;
      }
      if (this.shouldIgnoreElement(n))
        return;
      const i = this.get("config")?.clickThrottleMs ?? 300;
      if (i > 0 && !this.checkClickThrottle(n, i))
        return;
      const o = this.findTrackingElement(n), l = this.getRelevantClickElement(n), c = this.calculateClickCoordinates(t, n);
      if (o) {
        const f = this.extractTrackingData(o);
        if (f) {
          const g = this.createCustomEventData(f);
          this.eventManager.track({
            type: d.CUSTOM,
            custom_event: {
              name: g.name,
              ...g.value && { metadata: { value: g.value } }
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
    return e.hasAttribute(`${b}-ignore`) ? !0 : e.closest(`[${b}-ignore]`) !== null;
  }
  /**
   * Checks per-element click throttling to prevent double-clicks and rapid spam
   * Returns true if the click should be tracked, false if throttled
   */
  checkClickThrottle(e, t) {
    const s = this.getElementSignature(e), n = Date.now();
    this.pruneThrottleCache(n);
    const i = this.lastClickTimes.get(s);
    return i !== void 0 && n - i < t ? (a("debug", "ClickHandler: Click suppressed by throttle", {
      data: {
        signature: s,
        throttleRemaining: t - (n - i)
      }
    }), !1) : (this.lastClickTimes.set(s, n), !0);
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
    for (const [s, n] of this.lastClickTimes.entries())
      n < t && this.lastClickTimes.delete(s);
    if (this.lastClickTimes.size > 1e3) {
      const s = Array.from(this.lastClickTimes.entries()).sort((o, l) => o[1] - l[1]), n = this.lastClickTimes.size - 1e3, i = s.slice(0, n);
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
    const s = e.getAttribute(`${b}-name`);
    return s ? `[${b}-name="${s}"]` : this.getElementPath(e);
  }
  /**
   * Generates a DOM path for an element (e.g., "body>div>button")
   */
  getElementPath(e) {
    const t = [];
    let s = e;
    for (; s && s !== document.body; ) {
      let n = s.tagName.toLowerCase();
      if (s.className) {
        const i = s.className.split(" ")[0];
        i && (n += `.${i}`);
      }
      t.unshift(n), s = s.parentElement;
    }
    return t.join(">") || "unknown";
  }
  findTrackingElement(e) {
    return e.hasAttribute(`${b}-name`) ? e : e.closest(`[${b}-name]`);
  }
  getRelevantClickElement(e) {
    for (const t of bt)
      try {
        if (e.matches(t))
          return e;
        const s = e.closest(t);
        if (s)
          return s;
      } catch (s) {
        a("debug", "Invalid selector in element search", { error: s, data: { selector: t } });
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
    const s = t.getBoundingClientRect(), n = e.clientX, i = e.clientY, o = s.width > 0 ? this.clamp((n - s.left) / s.width) : 0, l = s.height > 0 ? this.clamp((i - s.top) / s.height) : 0;
    return { x: n, y: i, relativeX: o, relativeY: l };
  }
  extractTrackingData(e) {
    const t = e.getAttribute(`${b}-name`), s = e.getAttribute(`${b}-value`);
    if (t)
      return {
        element: e,
        name: t,
        ...s && { value: s }
      };
  }
  generateClickData(e, t, s) {
    const { x: n, y: i, relativeX: o, relativeY: l } = s, c = this.getRelevantText(e, t), u = this.extractElementAttributes(t);
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
    for (const s of at) {
      const n = new RegExp(s.source, s.flags);
      t = t.replace(n, "[REDACTED]");
    }
    return t;
  }
  getRelevantText(e, t) {
    const s = e.textContent?.trim() ?? "", n = t.textContent?.trim() ?? "";
    if (!s && !n)
      return "";
    let i = "";
    return s && s.length <= 255 ? i = s : n.length <= 255 ? i = n : i = n.slice(0, 252) + "...", this.sanitizeText(i);
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
    ], s = {};
    for (const n of t) {
      const i = e.getAttribute(n);
      i && (s[n] = i);
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
class As extends _ {
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
      for (const s of t) {
        const n = this.getElementSelector(s);
        this.setupScrollContainer(s, n);
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
    let s;
    for (; (s = t.nextNode()) && e.length < 10; ) {
      const n = s;
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
      const s = t.className.split(" ").filter((n) => n.trim())[0];
      if (s)
        return `.${s}`;
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
      lastDirection: Z.DOWN,
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
  processScrollEvent(e, t, s) {
    if (!this.shouldEmitScrollEvent(e, t, s))
      return;
    e.lastEventTime = s, e.lastDepth = t.depth, e.lastDirection = t.direction;
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
  shouldEmitScrollEvent(e, t, s) {
    return this.hasReachedSessionLimit() ? (this.logLimitOnce(), !1) : !(!this.hasElapsedMinimumInterval(e, s) || !this.hasSignificantDepthChange(e, t.depth));
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
    this.limitWarningLogged || (this.limitWarningLogged = !0, a("debug", "Max scroll events per session reached", {
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
    return e > t ? Z.DOWN : Z.UP;
  }
  calculateScrollDepth(e, t, s) {
    if (t <= s)
      return 0;
    const n = t - s;
    return Math.min(100, Math.max(0, Math.floor(e / n * 100)));
  }
  calculateScrollData(e) {
    const { element: t, lastScrollPos: s, lastEventTime: n } = e, i = this.getScrollTop(t), o = Date.now(), l = Math.abs(i - s);
    if (l < 10 || t === window && !this.isWindowScrollable())
      return null;
    const c = this.getViewportHeight(t), u = this.getScrollHeight(t), f = this.getScrollDirection(i, s), g = this.calculateScrollDepth(i, u, c);
    let T;
    n > 0 ? T = o - n : e.firstScrollEventTime !== null ? T = o - e.firstScrollEventTime : T = 250;
    const p = Math.round(l / T * 1e3);
    return g > e.maxDepthReached && (e.maxDepthReached = g), e.lastScrollPos = i, {
      depth: g,
      direction: f,
      velocity: p,
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
    const t = getComputedStyle(e), s = t.overflowY === "auto" || t.overflowY === "scroll" || t.overflow === "auto" || t.overflow === "scroll", n = e.scrollHeight > e.clientHeight;
    return s && n;
  }
  applyPrimaryScrollSelector(e) {
    let t;
    if (e === "window")
      t = window;
    else {
      const n = document.querySelector(e);
      if (!(n instanceof HTMLElement)) {
        a("debug", `Selector "${e}" did not match an HTMLElement`);
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
class Ls extends _ {
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
    const t = this.config.threshold ?? 0.5, s = this.config.minDwellTime ?? 1e3;
    if (t < 0 || t > 1) {
      a("debug", "ViewportHandler: Invalid threshold, must be between 0 and 1");
      return;
    }
    if (s < 0) {
      a("debug", "ViewportHandler: Invalid minDwellTime, must be non-negative");
      return;
    }
    if (typeof IntersectionObserver > "u") {
      a("debug", "ViewportHandler: IntersectionObserver not supported in this browser");
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
    for (const s of this.config.elements)
      try {
        const n = document.querySelectorAll(s.selector);
        for (const i of Array.from(n)) {
          if (t >= e) {
            a("debug", "ViewportHandler: Maximum tracked elements reached", {
              data: {
                limit: e,
                selector: s.selector,
                message: "Some elements will not be tracked. Consider more specific selectors."
              }
            });
            return;
          }
          i.hasAttribute(`${b}-ignore`) || this.trackedElements.has(i) || (this.trackedElements.set(i, {
            element: i,
            selector: s.selector,
            id: s.id,
            name: s.name,
            startTime: null,
            timeoutId: null,
            lastFiredTime: null
          }), this.observer?.observe(i), t++);
        }
      } catch (n) {
        a("debug", `ViewportHandler: Invalid selector "${s.selector}"`, { error: n });
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
    for (const s of e) {
      const n = this.trackedElements.get(s.target);
      n && (s.isIntersecting ? n.startTime === null && (n.startTime = performance.now(), n.timeoutId = window.setTimeout(() => {
        const i = Math.round(s.intersectionRatio * 100) / 100;
        this.fireViewportEvent(n, i);
      }, t)) : n.startTime !== null && (n.timeoutId !== null && (window.clearTimeout(n.timeoutId), n.timeoutId = null), n.startTime = null));
    }
  };
  /**
   * Fires a viewport visible event
   */
  fireViewportEvent(e, t) {
    if (e.startTime === null) return;
    const s = Math.round(performance.now() - e.startTime);
    if (e.element.hasAttribute(`${b}-ignore`))
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
      dwellTime: s,
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
        a("debug", "ViewportHandler: document.body not available, skipping MutationObserver setup");
        return;
      }
      this.mutationObserver = new MutationObserver((e) => {
        let t = !1;
        for (const s of e)
          s.type === "childList" && (s.addedNodes.length > 0 && (t = !0), s.removedNodes.length > 0 && this.cleanupRemovedNodes(s.removedNodes));
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
      const s = t, n = this.trackedElements.get(s);
      n && (n.timeoutId !== null && window.clearTimeout(n.timeoutId), this.observer?.unobserve(s), this.trackedElements.delete(s)), Array.from(this.trackedElements.keys()).filter((o) => s.contains(o)).forEach((o) => {
        const l = this.trackedElements.get(o);
        l && l.timeoutId !== null && window.clearTimeout(l.timeoutId), this.observer?.unobserve(o), this.trackedElements.delete(o);
      });
    });
  }
}
const Ms = "tracelog_session_id";
class Cs extends _ {
  visibilityHandler = null;
  lastSyncedSessionId = null;
  activate() {
    this.cleanupVisibilityListener(), this.syncCartAttribute(), this.setupVisibilityListener();
  }
  deactivate() {
    this.cleanupVisibilityListener(), this.lastSyncedSessionId = null;
  }
  /** Re-syncs the cart attribute when session rotates (called by App on SESSION_START). */
  onSessionChange() {
    this.syncCartAttribute();
  }
  syncCartAttribute() {
    const e = this.get("sessionId");
    !e || e === this.lastSyncedSessionId || (this.lastSyncedSessionId = e, this.postCartUpdate(e));
  }
  postCartUpdate(e) {
    try {
      fetch("/cart/update.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attributes: { [Ms]: e } }),
        credentials: "same-origin"
      }).then((t) => {
        t.ok || (this.lastSyncedSessionId = null, a("debug", "Shopify cart attribute update failed", { data: { status: t.status } }));
      }).catch(() => {
        this.lastSyncedSessionId = null, a("debug", "Shopify cart attribute update failed");
      });
    } catch {
      this.lastSyncedSessionId = null, a("debug", "Shopify cart attribute update failed");
    }
  }
  setupVisibilityListener() {
    this.visibilityHandler = () => {
      document.hidden || this.syncCartAttribute();
    }, document.addEventListener("visibilitychange", this.visibilityHandler);
  }
  cleanupVisibilityListener() {
    this.visibilityHandler && (document.removeEventListener("visibilitychange", this.visibilityHandler), this.visibilityHandler = null);
  }
}
class Rs {
  storage;
  sessionStorageRef;
  fallbackStorage = /* @__PURE__ */ new Map();
  fallbackSessionStorage = /* @__PURE__ */ new Map();
  hasQuotaExceededError = !1;
  constructor() {
    this.storage = this.initializeStorage("localStorage"), this.sessionStorageRef = this.initializeStorage("sessionStorage"), this.storage || a("debug", "localStorage not available, using memory fallback"), this.sessionStorageRef || a("debug", "sessionStorage not available, using memory fallback");
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
    } catch (s) {
      if (s instanceof DOMException && s.name === "QuotaExceededError" || s instanceof Error && s.name === "QuotaExceededError")
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
            error: s,
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
        const s = this.storage.key(t);
        s?.startsWith("tracelog_") && e.push(s);
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
      const s = ["tracelog_session_", "tracelog_user_id", "tracelog_device_id", "tracelog_config"], n = e.filter((i) => !s.some((o) => i.startsWith(o)));
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
      const t = e === "localStorage" ? window.localStorage : window.sessionStorage, s = "__tracelog_test__";
      return t.setItem(s, "test"), t.removeItem(s), t;
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
    } catch (s) {
      (s instanceof DOMException && s.name === "QuotaExceededError" || s instanceof Error && s.name === "QuotaExceededError") && a("error", "sessionStorage quota exceeded - data will not persist", {
        error: s,
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
class Ns extends _ {
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
    super(), this.eventManager = e, this.vitalThresholds = Ke(_e);
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
    const e = this.get("config"), t = e?.webVitalsMode ?? _e;
    this.vitalThresholds = Ke(t), e?.webVitalsThresholds && (this.vitalThresholds = { ...this.vitalThresholds, ...e.webVitalsThresholds }), await this.initWebVitals(), this.observeLongTasks();
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
      } catch (s) {
        a("debug", "Failed to disconnect performance observer", { error: s, data: { observerIndex: t } });
      }
    }), this.observers.length = 0, this.reportedByNav.clear(), this.navigationHistory.length = 0;
  }
  observeWebVitalsFallback() {
    this.reportTTFB(), this.safeObserve(
      "largest-contentful-paint",
      (s) => {
        const n = s.getEntries(), i = n[n.length - 1];
        i && this.sendVital({ type: "LCP", value: Number(i.startTime.toFixed(2)) });
      },
      { type: "largest-contentful-paint", buffered: !0 },
      !0
    );
    let e = 0, t = this.getNavigationId();
    this.safeObserve(
      "layout-shift",
      (s) => {
        const n = this.getNavigationId();
        n !== t && (e = 0, t = n);
        const i = s.getEntries();
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
      (s) => {
        for (const n of s.getEntries())
          n.name === "first-contentful-paint" && this.sendVital({ type: "FCP", value: Number(n.startTime.toFixed(2)) });
      },
      { type: "paint", buffered: !0 },
      !0
    ), this.safeObserve(
      "event",
      (s) => {
        let n = 0;
        const i = s.getEntries();
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
      const { onLCP: e, onCLS: t, onFCP: s, onTTFB: n, onINP: i } = await Promise.resolve().then(() => cr), o = (l) => (c) => {
        const u = Number(c.value.toFixed(2));
        this.sendVital({ type: l, value: u });
      };
      e(o("LCP"), { reportAllChanges: !1 }), t(o("CLS"), { reportAllChanges: !1 }), s(o("FCP"), { reportAllChanges: !1 }), n(o("TTFB"), { reportAllChanges: !1 }), i(o("INP"), { reportAllChanges: !1 });
    } catch (e) {
      a("debug", "Failed to load web-vitals library, using fallback", { error: e }), this.observeWebVitalsFallback();
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
      a("debug", "Failed to report TTFB", { error: e });
    }
  }
  observeLongTasks() {
    this.safeObserve(
      "longtask",
      (e) => {
        const t = e.getEntries();
        for (const s of t) {
          const n = Number(s.duration.toFixed(2)), i = Date.now();
          i - this.lastLongTaskSentAt >= Kt && (this.shouldSendVital("LONG_TASK", n) && this.trackWebVital("LONG_TASK", n), this.lastLongTaskSentAt = i);
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
      const s = this.reportedByNav.get(t);
      if (s?.has(e.type))
        return;
      if (s)
        s.add(e.type);
      else if (this.reportedByNav.set(t, /* @__PURE__ */ new Set([e.type])), this.navigationHistory.push(t), this.navigationHistory.length > Yt) {
        const i = this.navigationHistory.shift();
        i && this.reportedByNav.delete(i);
      }
    }
    this.trackWebVital(e.type, e.value);
  }
  trackWebVital(e, t) {
    if (!Number.isFinite(t)) {
      a("debug", "Invalid web vital value", { data: { type: e, value: t } });
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
      const t = e.startTime || performance.now(), s = ++this.navigationCounter, n = `${t.toFixed(2)}_${window.location.pathname}`;
      return s > 1 ? `${n}_${s}` : n;
    } catch (e) {
      return a("debug", "Failed to get navigation ID", { error: e }), null;
    }
  }
  isObserverSupported(e) {
    if (typeof PerformanceObserver > "u") return !1;
    const t = PerformanceObserver.supportedEntryTypes;
    return !t || t.includes(e);
  }
  safeObserve(e, t, s, n = !1) {
    try {
      if (!this.isObserverSupported(e))
        return !1;
      const i = new PerformanceObserver((o, l) => {
        try {
          t(o, l);
        } catch (c) {
          a("debug", "Observer callback failed", {
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
      return i.observe(s ?? { type: e, buffered: !0 }), n || this.observers.push(i), !0;
    } catch (i) {
      return a("debug", "Failed to create performance observer", {
        error: i,
        data: { type: e }
      }), !1;
    }
  }
  shouldSendVital(e, t) {
    if (typeof t != "number" || !Number.isFinite(t))
      return a("debug", "Invalid web vital value", { data: { type: e, value: t } }), !1;
    const s = this.vitalThresholds[e];
    return !(typeof s == "number" && t <= s);
  }
}
class ae extends _ {
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
    if (e - this.burstWindowStart > Gt && (this.errorBurstCounter = 0, this.burstWindowStart = e), this.errorBurstCounter++, this.errorBurstCounter > jt)
      return this.burstBackoffUntil = e + ze, a("debug", "Error burst detected - entering cooldown", {
        data: {
          errorsInWindow: this.errorBurstCounter,
          cooldownMs: ze
        }
      }), !1;
    const s = this.get("config").errorSampling ?? lt;
    return Math.random() < s;
  }
  handleError = (e) => {
    if (!this.shouldSample())
      return;
    const t = this.sanitize(e.message || "Unknown error");
    if (this.shouldSuppressError(B.JS_ERROR, t))
      return;
    const s = typeof e.error?.stack == "string" ? this.truncateStack(e.error.stack) : void 0;
    this.eventManager.track({
      type: d.ERROR,
      error_data: {
        type: B.JS_ERROR,
        message: t,
        ...e.filename !== "" && { filename: e.filename },
        ...e.lineno !== 0 && { line: e.lineno },
        ...e.colno !== 0 && { column: e.colno },
        ...s !== void 0 && { stack: s }
      }
    });
  };
  handleRejection = (e) => {
    if (!this.shouldSample())
      return;
    const t = this.extractRejectionMessage(e.reason), s = this.sanitize(t);
    if (this.shouldSuppressError(B.PROMISE_REJECTION, s))
      return;
    const n = e.reason instanceof Error && typeof e.reason.stack == "string" ? this.truncateStack(e.reason.stack) : void 0;
    this.eventManager.track({
      type: d.ERROR,
      error_data: {
        type: B.PROMISE_REJECTION,
        message: s,
        ...n !== void 0 && { stack: n }
      }
    });
  };
  extractRejectionMessage(e) {
    if (e == null) return "Unknown rejection";
    if (typeof e == "string") return e;
    if (e instanceof Error)
      return e.message;
    if (typeof e == "object" && "message" in e)
      return String(e.message);
    try {
      return JSON.stringify(e);
    } catch {
      return "Unserializable rejection";
    }
  }
  sanitize(e) {
    const t = e.length > Xe ? e.slice(0, Xe) + "..." : e;
    return this.sanitizePii(t);
  }
  sanitizePii(e) {
    let t = e;
    for (const s of at) {
      const n = new RegExp(s.source, s.flags);
      t = t.replace(n, "[REDACTED]");
    }
    return t;
  }
  shouldSuppressError(e, t) {
    const s = Date.now(), n = `${e}:${t}`, i = this.recentErrors.get(n);
    return i !== void 0 && s - i < je ? (this.recentErrors.set(n, s), !0) : (this.recentErrors.set(n, s), this.recentErrors.size > Xt ? (this.recentErrors.clear(), this.recentErrors.set(n, s), !1) : (this.recentErrors.size > ee && this.pruneOldErrors(), !1));
  }
  static TRUNCATION_SUFFIX = `
...truncated`;
  truncateStack(e) {
    if (e.length <= Ge) return this.sanitizePii(e);
    const t = Ge - ae.TRUNCATION_SUFFIX.length, s = e.slice(0, t) + ae.TRUNCATION_SUFFIX;
    return this.sanitizePii(s);
  }
  pruneOldErrors() {
    const e = Date.now();
    for (const [n, i] of this.recentErrors.entries())
      e - i > je && this.recentErrors.delete(n);
    if (this.recentErrors.size <= ee)
      return;
    const t = Array.from(this.recentErrors.entries()).sort((n, i) => n[1] - i[1]), s = this.recentErrors.size - ee;
    for (let n = 0; n < s; n += 1) {
      const i = t[n];
      i && this.recentErrors.delete(i[0]);
    }
  }
}
class Os extends _ {
  isInitialized = !1;
  suppressNextScrollTimer = null;
  pageUnloadHandler = null;
  emitter = new gs();
  transformers = {};
  customHeadersProvider;
  managers = {};
  handlers = {};
  integrationInstances = {};
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
    if (this.isInitialized)
      return { sessionId: this.get("sessionId") ?? "" };
    this.managers.storage = new Rs();
    try {
      this.setupState(e);
      const t = e.integrations?.custom?.headers ?? {}, s = e.integrations?.custom?.fetchCredentials ?? "include";
      return this.managers.event = new Ts(
        this.managers.storage,
        this.emitter,
        this.transformers,
        t,
        this.customHeadersProvider,
        s
      ), this.loadPersistedIdentity(), this.initializeHandlers(), this.setupPageLifecycleListeners(), await this.managers.event.recoverPersistedEvents().catch((n) => {
        a("warn", "Failed to recover persisted events", { error: n });
      }), this.isInitialized = !0, { sessionId: this.get("sessionId") ?? "" };
    } catch (t) {
      this.destroy(!0);
      const s = t instanceof Error ? t.message : String(t);
      throw new Error(`[TraceLog] TraceLog initialization failed: ${s}`);
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
    let s = t;
    t && typeof t == "object" && !Array.isArray(t) && Object.getPrototypeOf(t) !== Object.prototype && (s = Object.assign({}, t));
    const { valid: n, error: i, sanitizedMetadata: o } = ms(e, s);
    if (!n) {
      if (this.get("mode") === ie.QA)
        throw new Error(`[TraceLog] Custom event "${e}" validation failed: ${i}`);
      a("warn", `Custom event "${e}" dropped: ${i}`);
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
   * Sets a callback to provide custom HTTP headers for requests to custom backends.
   * Only applies to custom backend integration (not TraceLog SaaS).
   *
   * @param provider - Callback function that returns custom headers
   * @throws {Error} If provider is not a function
   * @internal Called from api.setCustomHeaders()
   */
  setCustomHeaders(e) {
    if (typeof e != "function")
      throw new Error(`[TraceLog] Custom headers provider must be a function, received: ${typeof e}`);
    this.customHeadersProvider = e, this.managers.event && this.managers.event.setCustomHeadersProvider(e);
  }
  /**
   * Removes the custom headers provider callback.
   *
   * @internal Called from api.removeCustomHeaders()
   */
  removeCustomHeaders() {
    this.customHeadersProvider = void 0, this.managers.event && this.managers.event.removeCustomHeadersProvider();
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
      } catch (s) {
        a("warn", "Failed to stop tracking", { error: s });
      }
    }), this.suppressNextScrollTimer && (clearTimeout(this.suppressNextScrollTimer), this.suppressNextScrollTimer = null), this.pageUnloadHandler && (window.removeEventListener("pagehide", this.pageUnloadHandler), window.removeEventListener("beforeunload", this.pageUnloadHandler), this.pageUnloadHandler = null), this.managers.event?.flushImmediatelySync(), this.managers.event?.stop(), this.emitter.removeAllListeners(), this.transformers.beforeSend = void 0, this.transformers.beforeBatch = void 0, this.customHeadersProvider = void 0, this.set("suppressNextScroll", !1), this.set("sessionId", null), this.set("identity", void 0), this.clearPersistedIdentity(), this.integrationInstances.shopifyCartLinker?.deactivate(), this.integrationInstances = {}, this.isInitialized = !1, this.handlers = {}, this.managers = {});
  }
  setupState(e = {}) {
    this.set("config", e);
    const t = Is.getId(this.managers.storage);
    this.set("userId", t);
    const s = os(e);
    this.set("collectApiUrls", s);
    const n = Wt();
    this.set("device", n);
    const i = ye(window.location.href, e.sensitiveQueryParams);
    this.set("pageUrl", i), es() && this.set("mode", ie.QA);
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
   * Returns the current session ID.
   *
   * @returns The session ID string, or null if not yet initialized
   * @internal Used by api.getSessionId()
   */
  getSessionId() {
    return this.get("sessionId");
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
    const t = ft("Global", e, "globalMetadata");
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
    const s = this.get("config"), i = {
      ...s.globalMetadata ?? {},
      ...e
    }, o = {
      ...s,
      globalMetadata: i
    };
    this.set("config", o), a("debug", "Global metadata updated (merged)", { data: { keys: Object.keys(e) } });
  }
  /**
   * Associates the current anonymous visitor with a known user identity.
   *
   * Identity is persisted to localStorage (project-scoped) and included in every
   * subsequent batch payload so the backend always has the latest identity.
   *
   * Validation is duplicated here (also in api.ts) as defense-in-depth since
   * TestBridge and internal callers bypass the API layer.
   *
   * @param userId - External user identifier (email, customer_id, etc.)
   * @param traits - Optional user attributes (name, email, plan, etc.)
   * @internal Called from api.identify()
   */
  identify(e, t) {
    if (!e || typeof e != "string" || e.trim().length === 0) {
      a("warn", "identify() called with invalid userId", {
        data: { type: typeof e, length: typeof e == "string" ? e.trim().length : 0 }
      });
      return;
    }
    if (e.trim().length > 256) {
      a("warn", "identify() userId exceeds 256 characters", { data: { length: e.trim().length } });
      return;
    }
    const s = e.trim(), n = ht(t), i = {
      userId: s,
      ...n ? { traits: n } : {}
    };
    this.set("identity", i), this.persistIdentity(i), a("debug", "Visitor identified", {
      data: { userIdLength: s.length, traitKeys: n ? Object.keys(n) : [] }
    });
  }
  /**
   * Clears identity, regenerates UUID, and starts a new session.
   *
   * Used for logout flows. The previous visitor profile with its identity
   * remains in MongoDB — this method ensures the next user in the same browser
   * gets a fresh anonymous profile.
   *
   * @internal Called from api.resetIdentity()
   */
  async resetIdentity() {
    await this.managers.event?.flushImmediately(), this.set("identity", void 0), this.clearPersistedIdentity();
    const e = ut();
    this.managers.storage.setItem(Te, e), this.set("userId", e), this.set("hasStartSession", !1), this.set("sessionId", null), this.handlers.session?.stopTracking(), this.handlers.session?.startTracking(), a("debug", "Identity reset, new UUID generated");
  }
  /**
   * Returns the project ID used for identity storage scoping.
   * Matches the same logic used by SessionHandler.
   */
  getProjectId() {
    return this.get("config")?.integrations?.tracelog?.projectId ?? "custom";
  }
  /**
   * Persists identity to localStorage under the project-scoped key.
   */
  persistIdentity(e) {
    try {
      const t = this.getProjectId(), s = fe(t);
      this.managers.storage.setItem(s, JSON.stringify(e));
    } catch {
      a("debug", "Failed to persist identity to localStorage");
    }
  }
  /**
   * Loads identity from localStorage on init.
   * Also migrates pending identity (set before init) to the project-scoped key.
   */
  loadPersistedIdentity() {
    const e = this.managers.storage, t = this.getProjectId(), s = fe(t);
    try {
      const n = e.getItem(U);
      if (n) {
        const i = JSON.parse(n);
        if (e.removeItem(U), !this.isValidIdentityData(i)) {
          a("debug", "Invalid pending identity in localStorage, discarded");
          return;
        }
        const o = { ...i, userId: i.userId.trim() };
        e.setItem(s, JSON.stringify(o)), this.set("identity", o), a("debug", "Migrated pending identity to project-scoped key");
        return;
      }
    } catch {
      e.removeItem(U);
    }
    try {
      const n = e.getItem(s);
      if (n) {
        const i = JSON.parse(n);
        if (!this.isValidIdentityData(i)) {
          e.removeItem(s), a("debug", "Invalid persisted identity in localStorage, discarded");
          return;
        }
        const o = { ...i, userId: i.userId.trim() };
        this.set("identity", o), a("debug", "Loaded persisted identity");
      }
    } catch {
      a("debug", "Failed to load persisted identity");
    }
  }
  /**
   * Validates identity data loaded from localStorage.
   * Guards against tampered or corrupted localStorage values.
   */
  isValidIdentityData(e) {
    if (!e || typeof e != "object") return !1;
    const { userId: t, traits: s } = e;
    if (typeof t != "string" || t.trim().length === 0 || t.trim().length > 256) return !1;
    if (s !== void 0) {
      if (typeof s != "object" || s === null || Array.isArray(s)) return !1;
      for (const n of Object.values(s))
        if (typeof n != "string") return !1;
    }
    return !0;
  }
  /**
   * Clears persisted identity from localStorage.
   */
  clearPersistedIdentity() {
    try {
      const e = this.managers.storage, t = this.getProjectId();
      e.removeItem(fe(t)), e.removeItem(U);
    } catch {
      a("debug", "Failed to clear persisted identity");
    }
  }
  setupPageLifecycleListeners() {
    this.pageUnloadHandler = () => {
      this.managers.event?.flushImmediatelySync();
    }, window.addEventListener("pagehide", this.pageUnloadHandler), window.addEventListener("beforeunload", this.pageUnloadHandler);
  }
  initializeHandlers() {
    const e = this.get("config");
    this.handlers.session = new ys(
      this.managers.storage,
      this.managers.event
    ), this.handlers.session.startTracking();
    const t = () => {
      this.set("suppressNextScroll", !0), this.suppressNextScrollTimer && clearTimeout(this.suppressNextScrollTimer), this.suppressNextScrollTimer = window.setTimeout(() => {
        this.set("suppressNextScroll", !1);
      }, 500);
    };
    if (this.handlers.pageView = new ws(this.managers.event, t), this.handlers.pageView.startTracking(), this.handlers.click = new bs(this.managers.event), this.handlers.click.startTracking(), this.handlers.scroll = new As(this.managers.event), this.handlers.scroll.startTracking(), this.handlers.performance = new Ns(this.managers.event), this.handlers.performance.startTracking().catch((s) => {
      a("warn", "Failed to start performance tracking", { error: s });
    }), this.handlers.error = new ae(this.managers.event), this.handlers.error.startTracking(), e.viewport && (this.handlers.viewport = new Ls(this.managers.event), this.handlers.viewport.startTracking()), e.integrations?.tracelog?.shopify) {
      const s = new Cs();
      s.activate(), this.integrationInstances.shopifyCartLinker = s, this.emitter.on(se.EVENT, (n) => {
        n.type === d.SESSION_START && s.onSessionChange();
      });
    }
  }
}
const k = [], M = [];
let D = null, h = null, R = !1, S = !1, P = null;
const Ps = async (r) => typeof window > "u" || typeof document > "u" ? { sessionId: "" } : (S = !1, window.__traceLogDisabled === !0 ? { sessionId: "" } : h ? { sessionId: h.getSessionId() ?? "" } : (R && P || (R = !0, P = (async () => {
  try {
    const e = ds(r ?? {}), t = new Os();
    try {
      k.forEach(({ event: o, callback: l }) => {
        t.on(o, l);
      }), k.length = 0, M.forEach(({ hook: o, fn: l }) => {
        o === "beforeSend" ? t.setTransformer("beforeSend", l) : t.setTransformer("beforeBatch", l);
      }), M.length = 0, D && (t.setCustomHeaders(D), D = null);
      const s = t.init(e), n = new Promise((o, l) => {
        setTimeout(() => {
          l(new Error("[TraceLog] Initialization timeout after 10000ms"));
        }, 1e4);
      }), i = await Promise.race([s, n]);
      return h = t, i;
    } catch (s) {
      try {
        t.destroy(!0);
      } catch (n) {
        a("error", "Failed to cleanup partially initialized app", { error: n });
      }
      throw s;
    }
  } catch (e) {
    throw h = null, e;
  } finally {
    R = !1, P = null;
  }
})()), P)), Ds = (r, e) => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!h)
      throw new Error("[TraceLog] TraceLog not initialized. Please call init() first.");
    if (S)
      throw new Error("[TraceLog] Cannot send events while TraceLog is being destroyed");
    h.sendCustomEvent(r, e);
  }
}, ks = (r, e) => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!h || R) {
      k.push({ event: r, callback: e });
      return;
    }
    h.on(r, e);
  }
}, Vs = (r, e) => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!h) {
      const t = k.findIndex((s) => s.event === r && s.callback === e);
      t !== -1 && k.splice(t, 1);
      return;
    }
    h.off(r, e);
  }
};
function Us(r, e) {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (typeof e != "function")
      throw new Error(`[TraceLog] Transformer must be a function, received: ${typeof e}`);
    if (!h || R) {
      const t = M.findIndex((s) => s.hook === r);
      t !== -1 && M.splice(t, 1), M.push({ hook: r, fn: e });
      return;
    }
    if (S)
      throw new Error("[TraceLog] Cannot set transformers while TraceLog is being destroyed");
    r === "beforeSend" ? h.setTransformer("beforeSend", e) : h.setTransformer("beforeBatch", e);
  }
}
const Hs = (r) => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!h) {
      const e = M.findIndex((t) => t.hook === r);
      e !== -1 && M.splice(e, 1);
      return;
    }
    if (S)
      throw new Error("[TraceLog] Cannot remove transformers while TraceLog is being destroyed");
    h.removeTransformer(r);
  }
}, Fs = (r) => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (typeof r != "function")
      throw new Error(`[TraceLog] Custom headers provider must be a function, received: ${typeof r}`);
    if (!h || R) {
      D = r;
      return;
    }
    if (S)
      throw new Error("[TraceLog] Cannot set custom headers while TraceLog is being destroyed");
    h.setCustomHeaders(r);
  }
}, xs = () => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!h) {
      D = null;
      return;
    }
    if (S)
      throw new Error("[TraceLog] Cannot remove custom headers while TraceLog is being destroyed");
    h.removeCustomHeaders();
  }
}, $s = () => typeof window > "u" || typeof document > "u" ? !1 : h !== null, Bs = () => typeof window > "u" || typeof document > "u" || !h ? null : h.getSessionId(), Ws = () => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (S)
      throw new Error("[TraceLog] Destroy operation already in progress");
    if (!h) {
      S = !1;
      return;
    }
    S = !0;
    try {
      h.destroy(), h = null, R = !1, P = null, k.length = 0, M.length = 0, D = null, S = !1;
    } catch (r) {
      h = null, R = !1, P = null, k.length = 0, M.length = 0, D = null, S = !1, a("warn", "Error during destroy, forced cleanup completed", { error: r });
    }
  }
}, Xs = (r) => {
  typeof window > "u" || typeof document > "u" || ts(r);
}, Gs = (r) => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!h)
      throw new Error("[TraceLog] TraceLog not initialized. Please call init() first.");
    if (S)
      throw new Error("[TraceLog] Cannot update metadata while TraceLog is being destroyed");
    h.updateGlobalMetadata(r);
  }
}, js = (r) => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!h)
      throw new Error("[TraceLog] TraceLog not initialized. Please call init() first.");
    if (S)
      throw new Error("[TraceLog] Cannot update metadata while TraceLog is being destroyed");
    h.mergeGlobalMetadata(r);
  }
}, zs = (r, e) => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!r || typeof r != "string" || r.trim().length === 0) {
      a("warn", "identify() called with invalid userId");
      return;
    }
    if (r.trim().length > 256) {
      a("warn", "identify() userId exceeds 256 characters");
      return;
    }
    if (S) {
      a("warn", "Cannot identify while TraceLog is being destroyed");
      return;
    }
    if (h) {
      h.identify(r, e);
      return;
    }
    try {
      const t = ht(e), s = {
        userId: r.trim(),
        ...t ? { traits: t } : {}
      };
      localStorage.setItem(U, JSON.stringify(s)), a("debug", "Identity persisted pre-init (will be applied on init)");
    } catch {
      a("debug", "Failed to persist pre-init identity");
    }
  }
}, Qs = async () => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!h) {
      try {
        localStorage.removeItem(U);
      } catch {
      }
      return;
    }
    if (S)
      throw new Error("[TraceLog] Cannot reset identity while TraceLog is being destroyed");
    await h.resetIdentity();
  }
}, yr = {
  init: Ps,
  event: Ds,
  on: ks,
  off: Vs,
  setTransformer: Us,
  removeTransformer: Hs,
  setCustomHeaders: Fs,
  removeCustomHeaders: xs,
  isInitialized: $s,
  getSessionId: Bs,
  destroy: Ws,
  setQaMode: Xs,
  updateGlobalMetadata: Gs,
  mergeGlobalMetadata: js,
  identify: zs,
  resetIdentity: Qs
};
var Ae, C, G, Et, le, pt = -1, V = function(r) {
  addEventListener("pageshow", (function(e) {
    e.persisted && (pt = e.timeStamp, r(e));
  }), !0);
}, Pe = function() {
  var r = self.performance && performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
  if (r && r.responseStart > 0 && r.responseStart < performance.now()) return r;
}, ue = function() {
  var r = Pe();
  return r && r.activationStart || 0;
}, y = function(r, e) {
  var t = Pe(), s = "navigate";
  return pt >= 0 ? s = "back-forward-cache" : t && (document.prerendering || ue() > 0 ? s = "prerender" : document.wasDiscarded ? s = "restore" : t.type && (s = t.type.replace(/_/g, "-"))), { name: r, value: e === void 0 ? -1 : e, rating: "good", delta: 0, entries: [], id: "v4-".concat(Date.now(), "-").concat(Math.floor(8999999999999 * Math.random()) + 1e12), navigationType: s };
}, F = function(r, e, t) {
  try {
    if (PerformanceObserver.supportedEntryTypes.includes(r)) {
      var s = new PerformanceObserver((function(n) {
        Promise.resolve().then((function() {
          e(n.getEntries());
        }));
      }));
      return s.observe(Object.assign({ type: r, buffered: !0 }, t || {})), s;
    }
  } catch {
  }
}, w = function(r, e, t, s) {
  var n, i;
  return function(o) {
    e.value >= 0 && (o || s) && ((i = e.value - (n || 0)) || n === void 0) && (n = e.value, e.delta = i, e.rating = (function(l, c) {
      return l > c[1] ? "poor" : l > c[0] ? "needs-improvement" : "good";
    })(e.value, t), r(e));
  };
}, De = function(r) {
  requestAnimationFrame((function() {
    return requestAnimationFrame((function() {
      return r();
    }));
  }));
}, z = function(r) {
  document.addEventListener("visibilitychange", (function() {
    document.visibilityState === "hidden" && r();
  }));
}, de = function(r) {
  var e = !1;
  return function() {
    e || (r(), e = !0);
  };
}, H = -1, et = function() {
  return document.visibilityState !== "hidden" || document.prerendering ? 1 / 0 : 0;
}, ce = function(r) {
  document.visibilityState === "hidden" && H > -1 && (H = r.type === "visibilitychange" ? r.timeStamp : 0, Ks());
}, tt = function() {
  addEventListener("visibilitychange", ce, !0), addEventListener("prerenderingchange", ce, !0);
}, Ks = function() {
  removeEventListener("visibilitychange", ce, !0), removeEventListener("prerenderingchange", ce, !0);
}, ke = function() {
  return H < 0 && (H = et(), tt(), V((function() {
    setTimeout((function() {
      H = et(), tt();
    }), 0);
  }))), { get firstHiddenTime() {
    return H;
  } };
}, Q = function(r) {
  document.prerendering ? addEventListener("prerenderingchange", (function() {
    return r();
  }), !0) : r();
}, Le = [1800, 3e3], St = function(r, e) {
  e = e || {}, Q((function() {
    var t, s = ke(), n = y("FCP"), i = F("paint", (function(o) {
      o.forEach((function(l) {
        l.name === "first-contentful-paint" && (i.disconnect(), l.startTime < s.firstHiddenTime && (n.value = Math.max(l.startTime - ue(), 0), n.entries.push(l), t(!0)));
      }));
    }));
    i && (t = w(r, n, Le, e.reportAllChanges), V((function(o) {
      n = y("FCP"), t = w(r, n, Le, e.reportAllChanges), De((function() {
        n.value = performance.now() - o.timeStamp, t(!0);
      }));
    })));
  }));
}, Me = [0.1, 0.25], Ys = function(r, e) {
  e = e || {}, St(de((function() {
    var t, s = y("CLS", 0), n = 0, i = [], o = function(c) {
      c.forEach((function(u) {
        if (!u.hadRecentInput) {
          var f = i[0], g = i[i.length - 1];
          n && u.startTime - g.startTime < 1e3 && u.startTime - f.startTime < 5e3 ? (n += u.value, i.push(u)) : (n = u.value, i = [u]);
        }
      })), n > s.value && (s.value = n, s.entries = i, t());
    }, l = F("layout-shift", o);
    l && (t = w(r, s, Me, e.reportAllChanges), z((function() {
      o(l.takeRecords()), t(!0);
    })), V((function() {
      n = 0, s = y("CLS", 0), t = w(r, s, Me, e.reportAllChanges), De((function() {
        return t();
      }));
    })), setTimeout(t, 0));
  })));
}, Tt = 0, pe = 1 / 0, J = 0, qs = function(r) {
  r.forEach((function(e) {
    e.interactionId && (pe = Math.min(pe, e.interactionId), J = Math.max(J, e.interactionId), Tt = J ? (J - pe) / 7 + 1 : 0);
  }));
}, It = function() {
  return Ae ? Tt : performance.interactionCount || 0;
}, Js = function() {
  "interactionCount" in performance || Ae || (Ae = F("event", qs, { type: "event", buffered: !0, durationThreshold: 0 }));
}, A = [], te = /* @__PURE__ */ new Map(), vt = 0, Zs = function() {
  var r = Math.min(A.length - 1, Math.floor((It() - vt) / 50));
  return A[r];
}, er = [], tr = function(r) {
  if (er.forEach((function(n) {
    return n(r);
  })), r.interactionId || r.entryType === "first-input") {
    var e = A[A.length - 1], t = te.get(r.interactionId);
    if (t || A.length < 10 || r.duration > e.latency) {
      if (t) r.duration > t.latency ? (t.entries = [r], t.latency = r.duration) : r.duration === t.latency && r.startTime === t.entries[0].startTime && t.entries.push(r);
      else {
        var s = { id: r.interactionId, latency: r.duration, entries: [r] };
        te.set(s.id, s), A.push(s);
      }
      A.sort((function(n, i) {
        return i.latency - n.latency;
      })), A.length > 10 && A.splice(10).forEach((function(n) {
        return te.delete(n.id);
      }));
    }
  }
}, _t = function(r) {
  var e = self.requestIdleCallback || self.setTimeout, t = -1;
  return r = de(r), document.visibilityState === "hidden" ? r() : (t = e(r), z(r)), t;
}, Ce = [200, 500], sr = function(r, e) {
  "PerformanceEventTiming" in self && "interactionId" in PerformanceEventTiming.prototype && (e = e || {}, Q((function() {
    var t;
    Js();
    var s, n = y("INP"), i = function(l) {
      _t((function() {
        l.forEach(tr);
        var c = Zs();
        c && c.latency !== n.value && (n.value = c.latency, n.entries = c.entries, s());
      }));
    }, o = F("event", i, { durationThreshold: (t = e.durationThreshold) !== null && t !== void 0 ? t : 40 });
    s = w(r, n, Ce, e.reportAllChanges), o && (o.observe({ type: "first-input", buffered: !0 }), z((function() {
      i(o.takeRecords()), s(!0);
    })), V((function() {
      vt = It(), A.length = 0, te.clear(), n = y("INP"), s = w(r, n, Ce, e.reportAllChanges);
    })));
  })));
}, Re = [2500, 4e3], Se = {}, rr = function(r, e) {
  e = e || {}, Q((function() {
    var t, s = ke(), n = y("LCP"), i = function(c) {
      e.reportAllChanges || (c = c.slice(-1)), c.forEach((function(u) {
        u.startTime < s.firstHiddenTime && (n.value = Math.max(u.startTime - ue(), 0), n.entries = [u], t());
      }));
    }, o = F("largest-contentful-paint", i);
    if (o) {
      t = w(r, n, Re, e.reportAllChanges);
      var l = de((function() {
        Se[n.id] || (i(o.takeRecords()), o.disconnect(), Se[n.id] = !0, t(!0));
      }));
      ["keydown", "click"].forEach((function(c) {
        addEventListener(c, (function() {
          return _t(l);
        }), { once: !0, capture: !0 });
      })), z(l), V((function(c) {
        n = y("LCP"), t = w(r, n, Re, e.reportAllChanges), De((function() {
          n.value = performance.now() - c.timeStamp, Se[n.id] = !0, t(!0);
        }));
      }));
    }
  }));
}, Ne = [800, 1800], nr = function r(e) {
  document.prerendering ? Q((function() {
    return r(e);
  })) : document.readyState !== "complete" ? addEventListener("load", (function() {
    return r(e);
  }), !0) : setTimeout(e, 0);
}, ir = function(r, e) {
  e = e || {};
  var t = y("TTFB"), s = w(r, t, Ne, e.reportAllChanges);
  nr((function() {
    var n = Pe();
    n && (t.value = Math.max(n.responseStart - ue(), 0), t.entries = [n], s(!0), V((function() {
      t = y("TTFB", 0), (s = w(r, t, Ne, e.reportAllChanges))(!0);
    })));
  }));
}, W = { passive: !0, capture: !0 }, or = /* @__PURE__ */ new Date(), st = function(r, e) {
  C || (C = e, G = r, Et = /* @__PURE__ */ new Date(), wt(removeEventListener), yt());
}, yt = function() {
  if (G >= 0 && G < Et - or) {
    var r = { entryType: "first-input", name: C.type, target: C.target, cancelable: C.cancelable, startTime: C.timeStamp, processingStart: C.timeStamp + G };
    le.forEach((function(e) {
      e(r);
    })), le = [];
  }
}, ar = function(r) {
  if (r.cancelable) {
    var e = (r.timeStamp > 1e12 ? /* @__PURE__ */ new Date() : performance.now()) - r.timeStamp;
    r.type == "pointerdown" ? (function(t, s) {
      var n = function() {
        st(t, s), o();
      }, i = function() {
        o();
      }, o = function() {
        removeEventListener("pointerup", n, W), removeEventListener("pointercancel", i, W);
      };
      addEventListener("pointerup", n, W), addEventListener("pointercancel", i, W);
    })(e, r) : st(e, r);
  }
}, wt = function(r) {
  ["mousedown", "keydown", "touchstart", "pointerdown"].forEach((function(e) {
    return r(e, ar, W);
  }));
}, Oe = [100, 300], lr = function(r, e) {
  e = e || {}, Q((function() {
    var t, s = ke(), n = y("FID"), i = function(c) {
      c.startTime < s.firstHiddenTime && (n.value = c.processingStart - c.startTime, n.entries.push(c), t(!0));
    }, o = function(c) {
      c.forEach(i);
    }, l = F("first-input", o);
    t = w(r, n, Oe, e.reportAllChanges), l && (z(de((function() {
      o(l.takeRecords()), l.disconnect();
    }))), V((function() {
      var c;
      n = y("FID"), t = w(r, n, Oe, e.reportAllChanges), le = [], G = -1, C = null, wt(addEventListener), c = i, le.push(c), yt();
    })));
  }));
};
const cr = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  CLSThresholds: Me,
  FCPThresholds: Le,
  FIDThresholds: Oe,
  INPThresholds: Ce,
  LCPThresholds: Re,
  TTFBThresholds: Ne,
  onCLS: Ys,
  onFCP: St,
  onFID: lr,
  onINP: sr,
  onLCP: rr,
  onTTFB: ir
}, Symbol.toStringTag, { value: "Module" }));
export {
  m as AppConfigValidationError,
  ur as DEFAULT_SESSION_TIMEOUT,
  _e as DEFAULT_WEB_VITALS_MODE,
  L as DeviceType,
  se as EmitterEvent,
  B as ErrorType,
  d as EventType,
  vr as InitializationTimeoutError,
  N as IntegrationValidationError,
  Sr as MAX_ARRAY_LENGTH,
  mr as MAX_CUSTOM_EVENT_ARRAY_SIZE,
  fr as MAX_CUSTOM_EVENT_KEYS,
  dr as MAX_CUSTOM_EVENT_NAME_LENGTH,
  hr as MAX_CUSTOM_EVENT_STRING_SIZE,
  gr as MAX_NESTED_OBJECT_KEYS,
  Er as MAX_STRING_LENGTH,
  pr as MAX_STRING_LENGTH_IN_ARRAY,
  ie as Mode,
  at as PII_PATTERNS,
  O as PermanentError,
  re as RateLimitError,
  We as SamplingRateValidationError,
  Z as ScrollDirection,
  Ot as SessionTimeoutValidationError,
  $ as SpecialApiUrl,
  ne as TimeoutError,
  j as TraceLogValidationError,
  _r as WEB_VITALS_GOOD_THRESHOLDS,
  Qe as WEB_VITALS_NEEDS_IMPROVEMENT_THRESHOLDS,
  Qt as WEB_VITALS_POOR_THRESHOLDS,
  Ke as getWebVitalsThresholds,
  Tr as isPrimaryScrollEvent,
  Ir as isSecondaryScrollEvent,
  yr as tracelog
};
