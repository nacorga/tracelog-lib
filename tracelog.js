const _n = 9e5;
const yn = 120, In = 49152, wn = 100, An = 500, Ln = 200;
const bn = 1e3, Mn = 500, Cn = 1e3;
const L = "data-tlog", vt = [
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
], Tt = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"], _t = [
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
const y = {
  INVALID_SESSION_TIMEOUT: "Session timeout must be between 30000ms (30 seconds) and 86400000ms (24 hours)",
  INVALID_SAMPLING_RATE: "Sampling rate must be between 0 and 1",
  INVALID_ERROR_SAMPLING_RATE: "Error sampling must be between 0 and 1",
  INVALID_TRACELOG_PROJECT_ID: "TraceLog project ID is required when integration is enabled",
  INVALID_GLOBAL_METADATA: "Global metadata must be an object",
  INVALID_SENSITIVE_QUERY_PARAMS: "Sensitive query params must be an array of strings",
  INVALID_PAGE_VIEW_THROTTLE: "Page view throttle must be a non-negative number",
  INVALID_CLICK_THROTTLE: "Click throttle must be a non-negative number",
  INVALID_MAX_SAME_EVENT_PER_MINUTE: "Max same event per minute must be a positive number",
  INVALID_SEND_INTERVAL: "Send interval must be between 1000ms (1 second) and 60000ms (60 seconds)"
}, yt = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<embed\b[^>]*>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi
], g = "tlog", Y = `${g}:qa_mode`, Ee = `${g}:uid`, nt = "tlog_mode", Ue = "qa", Fe = "qa_off", le = (n) => n ? `${g}:${n}:queue` : `${g}:queue`, ue = (n) => n ? `${g}:${n}:rate_limit` : `${g}:rate_limit`, It = (n, e) => `${g}:beacon:${n}:${e}`, wt = (n) => n ? `${g}:${n}:session` : `${g}:session`, At = (n) => n ? `${g}:${n}:broadcast` : `${g}:broadcast`, Ve = (n, e) => `${g}:${n}:session_counts:${e}`, He = 10080 * 60 * 1e3, xe = `${g}:session_counts_last_cleanup`, Be = 3600 * 1e3, de = (n) => n ? `${g}:${n}:identity` : `${g}:identity`, P = `${g}:pending_identity`;
var M = /* @__PURE__ */ ((n) => (n.Localhost = "localhost:8080", n.Fail = "localhost:9999", n))(M || {}), w = /* @__PURE__ */ ((n) => (n.Mobile = "mobile", n.Tablet = "tablet", n.Desktop = "desktop", n.Unknown = "unknown", n))(w || {}), V = /* @__PURE__ */ ((n) => (n.EVENT = "event", n.QUEUE = "queue", n))(V || {});
class C extends Error {
  constructor(e, t, s) {
    super(e), this.statusCode = t, this.responseCode = s, this.name = "PermanentError", Error.captureStackTrace && Error.captureStackTrace(this, C);
  }
  statusCode;
  responseCode;
}
class Z extends Error {
  constructor(e) {
    super(e), this.name = "RateLimitError", Error.captureStackTrace && Error.captureStackTrace(this, Z);
  }
}
class ee extends Error {
  constructor(e) {
    super(e), this.name = "TimeoutError", Error.captureStackTrace && Error.captureStackTrace(this, ee);
  }
}
var d = /* @__PURE__ */ ((n) => (n.PAGE_VIEW = "page_view", n.CLICK = "click", n.SCROLL = "scroll", n.SESSION_START = "session_start", n.CUSTOM = "custom", n.WEB_VITALS = "web_vitals", n.ERROR = "error", n))(d || {}), ve = /* @__PURE__ */ ((n) => (n.UP = "up", n.DOWN = "down", n))(ve || {}), x = /* @__PURE__ */ ((n) => (n.JS_ERROR = "js_error", n.PROMISE_REJECTION = "promise_rejection", n))(x || {}), te = /* @__PURE__ */ ((n) => (n.QA = "qa", n))(te || {});
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
class Lt extends j {
  constructor(e, t = "config") {
    super(e, "SESSION_TIMEOUT_INVALID", t);
  }
}
class $e extends j {
  constructor(e, t = "config") {
    super(e, "SAMPLING_RATE_INVALID", t);
  }
}
class je extends j {
  constructor(e, t = "config") {
    super(e, "INTEGRATION_INVALID", t);
  }
}
class Nn extends j {
  constructor(e, t, s = "runtime") {
    super(e, "INITIALIZATION_TIMEOUT", s), this.timeoutMs = t;
  }
  timeoutMs;
}
const bt = ["gclid", "gbraid", "wbraid", "fbclid", "ttclid"], he = () => {
  const n = new URLSearchParams(window.location.search), e = {};
  return bt.forEach((s) => {
    const r = n.get(s);
    r && (e[s] = r);
  }), Object.keys(e).length ? e : void 0;
}, Mt = "https://ingest.tracelog.io", Ct = "background: #ff9800; color: white; font-weight: bold; padding: 2px 8px; border-radius: 3px;", Nt = "background: #9e9e9e; color: white; font-weight: bold; padding: 2px 8px; border-radius: 3px;", Rt = "background: #d32f2f; color: white; font-weight: bold; padding: 2px 8px; border-radius: 3px;", Ot = (n, e) => {
  if (e) {
    if (e instanceof Error) {
      const t = e.message.replace(/\s+at\s+.*$/gm, "").replace(/\s*\([^()]+:\d+:\d+\)/g, "");
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
}, Pt = () => {
  if (typeof window > "u" || typeof sessionStorage > "u")
    return !1;
  try {
    return sessionStorage.getItem(Y) === "true";
  } catch {
    return !1;
  }
}, a = (n, e, t) => {
  const { error: s, data: r, showToClient: i = !1, style: o, visibility: c } = t ?? {}, l = s ? Ot(e, s) : `[TraceLog] ${e}`, u = n === "error" ? "error" : n === "warn" ? "warn" : "log";
  if (!kt(c, i))
    return;
  const p = Dt(c, o), S = r !== void 0 ? Te(r) : void 0;
  Ut(u, l, p, S);
}, kt = (n, e) => n === "critical" ? !0 : n === "qa" || e ? Pt() : !1, Dt = (n, e) => e !== void 0 && e !== "" ? e : n === "critical" ? Rt : "", Ut = (n, e, t, s) => {
  const r = t !== void 0 && t !== "", i = r ? `%c${e}` : e;
  s !== void 0 ? r ? console[n](i, t, s) : console[n](i, s) : r ? console[n](i, t) : console[n](i);
}, Te = (n) => {
  const e = {}, t = ["token", "password", "secret", "key", "apikey", "api_key", "sessionid", "session_id"];
  for (const [s, r] of Object.entries(n)) {
    const i = s.toLowerCase();
    if (t.some((o) => i.includes(o))) {
      e[s] = "[REDACTED]";
      continue;
    }
    r !== null && typeof r == "object" && !Array.isArray(r) ? e[s] = Te(r) : Array.isArray(r) ? e[s] = r.map(
      (o) => o !== null && typeof o == "object" && !Array.isArray(o) ? Te(o) : o
    ) : e[s] = r;
  }
  return e;
};
let _e, rt;
const Ft = () => {
  typeof window < "u" && !_e && (_e = window.matchMedia("(pointer: coarse)"), rt = window.matchMedia("(hover: none)"));
}, se = "Unknown", Vt = (n) => {
  const e = n.userAgentData?.platform;
  if (e != null && e !== "") {
    if (/windows/i.test(e)) return "Windows";
    if (/macos/i.test(e)) return "macOS";
    if (/android/i.test(e)) return "Android";
    if (/linux/i.test(e)) return "Linux";
    if (/chromeos/i.test(e)) return "ChromeOS";
    if (/ios/i.test(e)) return "iOS";
  }
  const t = navigator.userAgent;
  return /Windows/i.test(t) ? "Windows" : /iPhone|iPad|iPod/i.test(t) ? "iOS" : /Mac OS X|Macintosh/i.test(t) ? "macOS" : /Android/i.test(t) ? "Android" : /CrOS/i.test(t) ? "ChromeOS" : /Linux/i.test(t) ? "Linux" : se;
}, Ht = (n) => {
  const e = n.userAgentData?.brands;
  if (e != null && e.length > 0) {
    const r = e.filter((i) => !/not.?a.?brand|chromium/i.test(i.brand))[0];
    if (r != null) {
      const i = r.brand;
      return /google chrome/i.test(i) ? "Chrome" : /microsoft edge/i.test(i) ? "Edge" : /opera/i.test(i) ? "Opera" : i;
    }
  }
  const t = navigator.userAgent;
  return /Edg\//i.test(t) ? "Edge" : /OPR\//i.test(t) ? "Opera" : /Chrome/i.test(t) ? "Chrome" : /Firefox/i.test(t) ? "Firefox" : /Safari/i.test(t) && !/Chrome/i.test(t) ? "Safari" : se;
}, xt = () => {
  try {
    const n = navigator;
    if (n.userAgentData != null && typeof n.userAgentData.mobile == "boolean") {
      const l = n.userAgentData.platform;
      return l != null && l !== "" && /ipad|tablet/i.test(l) ? w.Tablet : n.userAgentData.mobile ? w.Mobile : w.Desktop;
    }
    Ft();
    const e = window.innerWidth, t = _e?.matches ?? !1, s = rt?.matches ?? !1, r = "ontouchstart" in window || navigator.maxTouchPoints > 0, i = navigator.userAgent.toLowerCase(), o = /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/.test(i), c = /tablet|ipad|android(?!.*mobile)/.test(i);
    return e <= 767 || o && r ? w.Mobile : e >= 768 && e <= 1024 || c || t && s && r ? w.Tablet : w.Desktop;
  } catch (n) {
    return a("debug", "Device detection failed, defaulting to desktop", { error: n }), w.Desktop;
  }
}, Bt = () => {
  try {
    const n = navigator;
    return {
      type: xt(),
      os: Vt(n),
      browser: Ht(n)
    };
  } catch (n) {
    return a("debug", "Device info detection failed, using defaults", { error: n }), {
      type: w.Desktop,
      os: se,
      browser: se
    };
  }
}, Xe = 500, Ge = 2e3, We = 5e3, q = 50, $t = q * 2, it = 1, jt = 1e3, Xt = 10, Ke = 5e3, Gt = 3, Wt = 200, Kt = 6e4, zt = 64, Qt = 10 * 6e4, Yt = 200, Rn = {
  LCP: 2500,
  FCP: 1800,
  CLS: 0.1,
  INP: 200,
  TTFB: 800
}, qt = {
  LCP: 2500,
  FCP: 1800,
  CLS: 0.1,
  INP: 200,
  TTFB: 800
}, Jt = {
  LCP: 4e3,
  FCP: 3e3,
  CLS: 0.25,
  INP: 500,
  TTFB: 1800
}, ze = {
  LCP: Number.NEGATIVE_INFINITY,
  FCP: Number.NEGATIVE_INFINITY,
  CLS: Number.NEGATIVE_INFINITY,
  INP: Number.NEGATIVE_INFINITY,
  TTFB: Number.NEGATIVE_INFINITY
}, ye = "all", Qe = (n = ye) => {
  switch (n) {
    case "all":
      return ze;
    case "needs-improvement":
      return qt;
    case "poor":
      return Jt;
    default:
      return ze;
  }
}, Zt = 50, es = "3.4.1", ts = es, ss = () => typeof window < "u" && typeof sessionStorage < "u", ns = () => {
  try {
    const n = new URLSearchParams(window.location.search);
    n.delete(nt);
    const e = n.toString(), t = window.location.pathname + (e ? "?" + e : "") + window.location.hash;
    window.history.replaceState({}, "", t);
  } catch {
  }
}, rs = () => {
  if (!ss())
    return !1;
  try {
    const e = new URLSearchParams(window.location.search).get(nt), t = sessionStorage.getItem(Y);
    let s = null;
    return e === Ue ? (s = !0, sessionStorage.setItem(Y, "true"), a("info", "QA Mode ACTIVE", {
      visibility: "qa",
      style: Ct
    })) : e === Fe && (s = !1, sessionStorage.setItem(Y, "false"), a("info", "QA Mode DISABLED", {
      visibility: "qa",
      style: Nt
    })), (e === Ue || e === Fe) && ns(), s ?? t === "true";
  } catch {
    return !1;
  }
}, ot = () => typeof document < "u" && document.prerendering === !0, is = (n) => {
  try {
    return new URL(n).protocol === "https:";
  } catch {
    return !1;
  }
}, os = (n) => `${Mt}/p/${encodeURIComponent(n)}/collect`, as = (n) => {
  try {
    const t = new URL(window.location.href).hostname;
    if (!t || typeof t != "string")
      throw new Error("Invalid hostname");
    if (t === "localhost" || t === "127.0.0.1" || /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(t))
      throw new Error(
        "SaaS integration requires a domain hostname; localhost and IP addresses are not supported. For local development, omit `integrations.tracelog` to run in standalone mode (events emitted locally, no network requests), or test against a staging domain that resolves to your dev machine via /etc/hosts."
      );
    const s = t.split(".");
    if (!s || !Array.isArray(s) || s.length === 0 || s.length === 1 && s[0] === "")
      throw new Error("Invalid hostname structure");
    if (s.length === 1)
      throw new Error("Single-part domain not supported for SaaS integration");
    const r = s.length === 2 ? s.join(".") : s.slice(-2).join(".");
    if (!r || r.split(".").length < 2)
      throw new Error("Invalid domain structure for SaaS");
    const i = `https://${n}.${r}/collect`;
    if (!is(i))
      throw new Error("Generated URL failed validation");
    return i;
  } catch (e) {
    throw new Error(`Invalid SaaS URL configuration: ${e instanceof Error ? e.message : String(e)}`, {
      cause: e
    });
  }
}, cs = (n) => {
  const e = {}, t = n.integrations?.tracelog;
  return t?.projectId && (e.saas = t.firstParty ? as(t.projectId) : os(t.projectId)), e;
}, D = (n, e = []) => {
  if (!n || typeof n != "string")
    return a("warn", "Invalid URL provided to normalizeUrl", { data: { type: typeof n } }), n || "";
  try {
    let t, s = !1;
    try {
      t = new URL(n);
    } catch {
      const c = window.location.href;
      t = new URL(n, c), s = t.origin === new URL(c).origin;
    }
    const r = t.searchParams, i = [.../* @__PURE__ */ new Set([..._t, ...e])];
    let o = !1;
    for (const c of i)
      r.has(c) && (r.delete(c), o = !0);
    return !o && (s || n.includes("?")) ? n : (t.search = r.toString(), s ? `${t.pathname}${t.search}${t.hash}` : t.toString());
  } catch (t) {
    return a("warn", "URL normalization failed, returning original", { error: t, data: { urlLength: n?.length } }), n;
  }
}, ls = [
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
], Ye = (n) => {
  const e = n.toLowerCase().split(".");
  if (e.length <= 2)
    return n.toLowerCase();
  const t = e.slice(-2).join(".");
  return ls.includes(t) ? e.slice(-3).join(".") : e.slice(-2).join(".");
}, us = (n, e) => n === e ? !0 : Ye(n) === Ye(e), fe = (n = []) => {
  const e = document.referrer;
  if (!e)
    return "Direct";
  try {
    const t = new URL(e).hostname.toLowerCase(), s = window.location.hostname.toLowerCase();
    return us(t, s) ? "Direct" : D(e, n);
  } catch (t) {
    return a("debug", "Failed to parse referrer URL, using raw value", { error: t, data: { referrer: e } }), e;
  }
}, ge = () => {
  const n = new URLSearchParams(window.location.search), e = {};
  return Tt.forEach((s) => {
    const r = n.get(s);
    if (r) {
      const i = s.split("utm_")[1];
      e[i] = r;
    }
  }), Object.keys(e).length ? e : void 0;
}, at = () => typeof crypto < "u" && crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (n) => {
  const e = Math.random() * 16 | 0;
  return (n === "x" ? e : e & 3 | 8).toString(16);
});
let K = 0, z = 0;
const ds = () => {
  let n = Date.now();
  n < z && (n = z), n === z ? K = (K + 1) % 1e3 : K = 0, z = n;
  const e = K.toString().padStart(3, "0");
  let t = "";
  try {
    if (typeof crypto < "u" && crypto.getRandomValues) {
      const s = crypto.getRandomValues(new Uint8Array(3));
      s && (t = Array.from(s, (r) => r.toString(16).padStart(2, "0")).join(""));
    }
  } catch {
  }
  return t || (t = Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")), `${n}-${e}-${t}`;
}, qe = (n) => {
  if (!n || typeof n != "string" || n.trim().length === 0)
    return "";
  let e = n;
  n.length > 1e3 && (e = n.slice(0, Math.max(0, 1e3)));
  let t = 0;
  for (const r of yt) {
    const i = e;
    e = e.replace(r, ""), i !== e && t++;
  }
  return t > 0 && a("warn", "XSS patterns detected and removed", {
    data: {
      patternMatches: t,
      valueLength: n.length
    }
  }), e.trim();
}, Ie = (n, e = 0) => {
  if (n == null)
    return null;
  if (typeof n == "string")
    return qe(n);
  if (typeof n == "number")
    return !Number.isFinite(n) || n < -Number.MAX_SAFE_INTEGER || n > Number.MAX_SAFE_INTEGER ? 0 : n;
  if (typeof n == "boolean")
    return n;
  if (e > 10)
    return null;
  if (Array.isArray(n))
    return n.slice(0, 1e3).map((r) => Ie(r, e + 1)).filter((r) => r !== null);
  if (typeof n == "object") {
    const t = {}, r = Object.entries(n).slice(0, 200);
    for (const [i, o] of r) {
      const c = qe(i);
      if (c) {
        const l = Ie(o, e + 1);
        l !== null && (t[c] = l);
      }
    }
    return t;
  }
  return null;
}, hs = (n) => {
  if (typeof n != "object" || n === null)
    return {};
  try {
    const e = Ie(n);
    return typeof e == "object" && e !== null ? e : {};
  } catch (e) {
    const t = e instanceof Error ? e.message : String(e);
    throw new Error(`[TraceLog] Metadata sanitization failed: ${t}`, { cause: e });
  }
}, fs = [
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
], U = (n) => {
  let e = n;
  for (const t of fs)
    e = e.replace(t, "[REDACTED]");
  return e;
}, gs = (n) => {
  if (n !== void 0 && (n === null || typeof n != "object"))
    throw new m("Configuration must be an object", "config");
  if (n) {
    if (n.sessionTimeout !== void 0 && (typeof n.sessionTimeout != "number" || n.sessionTimeout < 3e4 || n.sessionTimeout > 864e5))
      throw new Lt(y.INVALID_SESSION_TIMEOUT, "config");
    if (n.globalMetadata !== void 0 && (typeof n.globalMetadata != "object" || n.globalMetadata === null))
      throw new m(y.INVALID_GLOBAL_METADATA, "config");
    if (n.integrations && ms(n.integrations), n.sensitiveQueryParams !== void 0) {
      if (!Array.isArray(n.sensitiveQueryParams))
        throw new m(y.INVALID_SENSITIVE_QUERY_PARAMS, "config");
      for (const e of n.sensitiveQueryParams)
        if (typeof e != "string")
          throw new m("All sensitive query params must be strings", "config");
    }
    if (n.errorSampling !== void 0 && (typeof n.errorSampling != "number" || n.errorSampling < 0 || n.errorSampling > 1))
      throw new $e(y.INVALID_ERROR_SAMPLING_RATE, "config");
    if (n.samplingRate !== void 0 && (typeof n.samplingRate != "number" || n.samplingRate < 0 || n.samplingRate > 1))
      throw new $e(y.INVALID_SAMPLING_RATE, "config");
    if (n.pageViewThrottleMs !== void 0 && (typeof n.pageViewThrottleMs != "number" || n.pageViewThrottleMs < 0))
      throw new m(y.INVALID_PAGE_VIEW_THROTTLE, "config");
    if (n.clickThrottleMs !== void 0 && (typeof n.clickThrottleMs != "number" || n.clickThrottleMs < 0))
      throw new m(y.INVALID_CLICK_THROTTLE, "config");
    if (n.maxSameEventPerMinute !== void 0 && (typeof n.maxSameEventPerMinute != "number" || n.maxSameEventPerMinute <= 0))
      throw new m(y.INVALID_MAX_SAME_EVENT_PER_MINUTE, "config");
    if (n.sendIntervalMs !== void 0 && (!Number.isFinite(n.sendIntervalMs) || n.sendIntervalMs < 1e3 || n.sendIntervalMs > 6e4))
      throw new m(y.INVALID_SEND_INTERVAL, "config");
    if (n.flushOnSpaNavigation !== void 0 && typeof n.flushOnSpaNavigation != "boolean")
      throw new m(
        `Invalid flushOnSpaNavigation type: ${typeof n.flushOnSpaNavigation}. Must be a boolean`,
        "config"
      );
    if (n.flushOnPageHidden !== void 0 && typeof n.flushOnPageHidden != "boolean")
      throw new m(
        `Invalid flushOnPageHidden type: ${typeof n.flushOnPageHidden}. Must be a boolean`,
        "config"
      );
    if (n.webVitalsMode !== void 0) {
      if (typeof n.webVitalsMode != "string")
        throw new m(
          `Invalid webVitalsMode type: ${typeof n.webVitalsMode}. Must be a string`,
          "config"
        );
      const e = ["all", "needs-improvement", "poor"];
      if (!e.includes(n.webVitalsMode))
        throw new m(
          `Invalid webVitalsMode: "${n.webVitalsMode}". Must be one of: ${e.join(", ")}`,
          "config"
        );
    }
    if (n.webVitalsThresholds !== void 0) {
      if (typeof n.webVitalsThresholds != "object" || n.webVitalsThresholds === null || Array.isArray(n.webVitalsThresholds))
        throw new m("webVitalsThresholds must be an object", "config");
      const e = ["LCP", "FCP", "CLS", "INP", "TTFB"];
      for (const [t, s] of Object.entries(n.webVitalsThresholds)) {
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
}, ms = (n) => {
  if (n && n.tracelog) {
    if (!n.tracelog.projectId || typeof n.tracelog.projectId != "string" || n.tracelog.projectId.trim() === "")
      throw new je(y.INVALID_TRACELOG_PROJECT_ID, "config");
    if (n.tracelog.shopify !== void 0 && typeof n.tracelog.shopify != "boolean")
      throw new je("tracelog.shopify must be a boolean", "config");
  }
}, ps = (n) => (gs(n), {
  ...n ?? {},
  sessionTimeout: n?.sessionTimeout ?? 9e5,
  globalMetadata: n?.globalMetadata ?? {},
  sensitiveQueryParams: n?.sensitiveQueryParams ?? [],
  errorSampling: n?.errorSampling ?? it,
  samplingRate: n?.samplingRate ?? 1,
  pageViewThrottleMs: n?.pageViewThrottleMs ?? 1e3,
  clickThrottleMs: n?.clickThrottleMs ?? 300,
  maxSameEventPerMinute: n?.maxSameEventPerMinute ?? 60,
  sendIntervalMs: n?.sendIntervalMs ?? 1e4,
  flushOnSpaNavigation: n?.flushOnSpaNavigation ?? !1,
  flushOnPageHidden: n?.flushOnPageHidden ?? !0
}), we = (n, e = /* @__PURE__ */ new Set()) => {
  if (n == null)
    return !0;
  const t = typeof n;
  return t === "string" || t === "number" || t === "boolean" ? !0 : t === "function" || t === "symbol" || t === "bigint" || e.has(n) ? !1 : (e.add(n), Array.isArray(n) ? n.every((s) => we(s, e)) : t === "object" ? Object.values(n).every((s) => we(s, e)) : !1);
}, Ss = (n) => typeof n != "object" || n === null ? !1 : we(n), Ae = (n) => {
  if (typeof n != "object" || n === null || Array.isArray(n)) return;
  const e = {};
  for (const [t, s] of Object.entries(n))
    typeof s == "string" && (e[t] = s);
  return Object.keys(e).length > 0 ? e : void 0;
}, Es = (n) => typeof n != "string" ? {
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
} : { valid: !0 }, Je = (n, e, t) => {
  const s = hs(e), r = `${t} "${n}" metadata error`;
  if (!Ss(s))
    return {
      valid: !1,
      error: `${r}: object has invalid types. Valid types are string, number, boolean or string arrays.`
    };
  let i;
  try {
    i = JSON.stringify(s);
  } catch {
    return {
      valid: !1,
      error: `${r}: object contains circular references or cannot be serialized.`
    };
  }
  if (new TextEncoder().encode(i).byteLength > 49152)
    return {
      valid: !1,
      error: `${r}: object is too large (max ${49152 / 1024} KB).`
    };
  if (Object.keys(s).length > 100)
    return {
      valid: !1,
      error: `${r}: object has too many keys (max 100 keys).`
    };
  for (const [l, u] of Object.entries(s)) {
    if (Array.isArray(u)) {
      if (u.length > 500)
        return {
          valid: !1,
          error: `${r}: array property "${l}" is too large (max 500 items).`
        };
      for (const h of u)
        if (typeof h == "string" && h.length > 500)
          return {
            valid: !1,
            error: `${r}: array property "${l}" contains strings that are too long (max 500 characters).`
          };
    }
    if (typeof u == "string" && u.length > 1e3)
      return {
        valid: !1,
        error: `${r}: property "${l}" is too long (max 1000 characters).`
      };
  }
  return {
    valid: !0,
    sanitizedMetadata: s
  };
}, vs = (n, e, t) => {
  if (Array.isArray(e)) {
    const s = [], r = `${t} "${n}" metadata error`;
    for (let i = 0; i < e.length; i++) {
      const o = e[i];
      if (typeof o != "object" || o === null || Array.isArray(o))
        return {
          valid: !1,
          error: `${r}: array item at index ${i} must be an object.`
        };
      const c = Je(n, o, t);
      if (!c.valid)
        return {
          valid: !1,
          error: `${r}: array item at index ${i} is invalid: ${c.error}`
        };
      c.sanitizedMetadata && s.push(c.sanitizedMetadata);
    }
    return {
      valid: !0,
      sanitizedMetadata: s
    };
  }
  return Je(n, e, t);
}, Ts = (n, e) => {
  const t = Es(n);
  if (!t.valid)
    return a("error", "Event name validation failed", {
      data: { eventName: n, error: t.error }
    }), t;
  if (!e)
    return { valid: !0 };
  const s = vs(n, e, "customEvent");
  return s.valid || a("error", "Event metadata validation failed", {
    data: {
      eventName: n,
      error: s.error
    }
  }), s;
};
class _s {
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
      const r = s.indexOf(t);
      r > -1 && s.splice(r, 1);
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
    s && s.forEach((r) => {
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
const ys = /https?:\/\/\S+/g, Is = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ws = /0x[0-9a-fA-F]{4,}/g, As = /(?<!\d)\d{4,}(?!\d)/g, Ls = /(['"])[^'"]{20,}\1/g;
function bs(n) {
  return n.replace(ys, "[URL]").replace(Is, "[ID]").replace(ws, "[ADDR]").replace(As, "[N]").replace(Ls, "$1[VAR]$1").toLowerCase().trim();
}
function Ze(n) {
  const e = n.search(/[?#]/);
  return e === -1 ? n : n.slice(0, e);
}
function Ms(n, e) {
  const t = Ze((n ?? "").trim());
  if (!t) return "";
  let s;
  try {
    s = new URL(t);
  } catch {
    return t;
  }
  if (s.protocol !== "http:" && s.protocol !== "https:") return "";
  const r = Ze((e ?? "").trim());
  return r && t === r ? s.origin : t;
}
function Cs(n) {
  const e = bs(n.message), t = Ms(n.filename, n.page_url), s = n.line == null ? "" : String(n.line);
  return `${e}|${t}|${s}`;
}
const me = { config: {} };
class T {
  /**
   * Retrieves a value from global state.
   */
  get(e) {
    return me[e];
  }
  /**
   * Sets a value in global state.
   */
  set(e, t) {
    me[e] = t;
  }
  /**
   * Returns an immutable snapshot of the entire global state.
   */
  getState() {
    return { ...me };
  }
}
const Ns = "UNKNOWN_PROJECT";
function Rs(n) {
  return typeof n == "string" && n.length > 0 && n.length <= zt;
}
class Os extends T {
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
  recoveryInProgress = !1;
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
  constructor(e, t) {
    super(), this.storeManager = e, this.apiUrl = t, this.migrateLegacyV2Keys(), this.rateLimitedUntil = this.loadRateLimitCooldown();
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
    const e = this.get("userId") || "anonymous", t = `${le(e)}:saas`, s = `${le(e)}:custom`, r = `${ue(e)}:saas`, i = `${ue(e)}:custom`;
    try {
      const o = this.storeManager.getItem(t);
      if (o) {
        const c = this.getQueueStorageKey(), l = this.storeManager.getItem(c);
        l ? this.mergeLegacyIntoCurrent(c, o, l) : (this.storeManager.setItem(c, o), a("debug", "Migrated v2 SaaS queue to v3 unscoped key")), this.storeManager.removeItem(t);
      }
    } catch (o) {
      a("debug", "Failed to migrate v2 SaaS queue, discarding legacy key", { error: o });
      try {
        this.storeManager.removeItem(t);
      } catch {
      }
    }
    [s, r, i].forEach((o) => {
      try {
        this.storeManager.getItem(o) !== null && this.storeManager.removeItem(o);
      } catch {
      }
    });
  }
  mergeLegacyIntoCurrent(e, t, s) {
    try {
      const r = JSON.parse(t), i = JSON.parse(s);
      if (!Array.isArray(r?.events) || !Array.isArray(i?.events)) {
        a("debug", "Legacy or current queue malformed, keeping current only");
        return;
      }
      const o = new Set(i.events.map((u) => u.id)), c = [
        ...i.events,
        ...r.events.filter((u) => typeof u.id == "string" && !o.has(u.id))
      ], l = {
        ...i,
        events: c,
        timestamp: typeof i.timestamp == "number" && typeof r.timestamp == "number" ? Math.min(i.timestamp, r.timestamp) : i.timestamp ?? r.timestamp ?? Date.now(),
        recoveryFailures: Math.max(i.recoveryFailures ?? 0, r.recoveryFailures ?? 0) || void 0
      };
      this.storeManager.setItem(e, JSON.stringify(l)), a("debug", "Merged v2 SaaS queue into existing v3 queue", {
        data: { added: c.length - i.events.length, total: c.length }
      });
    } catch (r) {
      a("debug", "Failed to merge legacy queue, keeping current", { error: r });
    }
  }
  getQueueStorageKey() {
    const e = this.get("userId") || "anonymous";
    return le(e);
  }
  getRateLimitStorageKey() {
    const e = this.get("userId") || "anonymous";
    return ue(e);
  }
  getActiveRateLimitKey() {
    return this.rateLimitStorageKeyAtArm ?? this.getRateLimitStorageKey();
  }
  armRateLimitCooldown(e) {
    this.rateLimitedUntil = e, this.rateLimitStorageKeyAtArm = this.getRateLimitStorageKey(), this.persistRateLimitCooldown(e);
  }
  loadRateLimitCooldown() {
    const e = this.getRateLimitStorageKey();
    try {
      const t = this.storeManager.getItem(e);
      if (!t) return 0;
      const s = Number(t);
      return !Number.isFinite(s) || s <= Date.now() ? (this.storeManager.removeItem(e), 0) : (this.rateLimitStorageKeyAtArm = e, s);
    } catch {
      return 0;
    }
  }
  persistRateLimitCooldown(e) {
    const t = this.getActiveRateLimitKey();
    try {
      const s = this.storeManager.getItem(t);
      if (s) {
        const r = Number(s);
        if (Number.isFinite(r) && r >= e)
          return;
      }
      this.storeManager.setItem(t, String(e));
    } catch {
    }
  }
  clearRateLimitCooldown() {
    const e = this.getActiveRateLimitKey();
    try {
      const t = this.storeManager.getItem(e);
      if (t) {
        const s = Number(t);
        if (Number.isFinite(s) && s > Date.now()) {
          this.rateLimitedUntil = s;
          return;
        }
      }
      this.storeManager.removeItem(e);
    } catch {
    }
    this.rateLimitedUntil = 0, this.rateLimitStorageKeyAtArm = null;
  }
  isRateLimited() {
    return this.rateLimitedUntil === 0 && (this.rateLimitedUntil = this.loadRateLimitCooldown()), !(this.rateLimitedUntil === 0 || Date.now() >= this.rateLimitedUntil && (this.clearRateLimitCooldown(), this.rateLimitedUntil === 0));
  }
  /**
   * Sends events synchronously using `navigator.sendBeacon()`.
   *
   * Falls back to localStorage persistence on rate-limit cooldown, beacon
   * rejection, or oversized payloads.
   */
  sendEventsQueueSync(e) {
    if (this.isRateLimited()) {
      a("debug", "Rate-limit cooldown active, skipping sync send", {
        data: {
          cooldownRemainingMs: this.rateLimitedUntil - Date.now(),
          events: e.events.length
        }
      });
      const t = this.ensureBatchMetadata(e), s = this.getPersistedData(), r = typeof s?.recoveryFailures == "number" && Number.isFinite(s.recoveryFailures) ? s.recoveryFailures : 0;
      return this.persistEventsWithFailureCount(t, r, !0), !1;
    }
    return this.apiUrl.includes(M.Fail) ? (a("warn", "Fail mode: simulating network failure (sync)", { data: { events: e.events.length } }), !1) : this.apiUrl.includes(M.Localhost) ? (a("debug", "Success mode: simulating successful send (sync)", { data: { events: e.events.length } }), !0) : this.sendQueueSyncInternal(e);
  }
  /**
   * Sends events asynchronously using `fetch()` with retry, circuit breaker, and 429 cooldown.
   * Persists on failure for recovery on next page load.
   */
  async sendEventsQueue(e, t) {
    const s = this.ensureBatchMetadata(e);
    try {
      const r = await this.send(s);
      return r ? (this.clearPersistedEvents(), t?.onSuccess?.(s.events.length, s.events, s)) : (this.persistEvents(s), t?.onFailure?.()), r;
    } catch (r) {
      return r instanceof C ? (this.logPermanentError("Permanent error, not retrying", r), this.clearPersistedEvents(), t?.onFailure?.(), !1) : (this.persistEvents(s), t?.onFailure?.(), !1);
    }
  }
  /**
   * Recovers and attempts to resend events persisted from a previous session.
   *
   * Idempotent: safe to call multiple times (recovery flag prevents concurrent attempts).
   */
  async recoverPersistedEvents(e) {
    if (this.recoveryInProgress) {
      a("debug", "Recovery already in progress, skipping duplicate attempt");
      return;
    }
    this.recoveryInProgress = !0;
    let t = null, s = 0;
    try {
      const r = this.getPersistedData();
      if (!r || !this.isDataRecent(r) || r.events.length === 0) {
        this.clearPersistedEvents();
        return;
      }
      const i = r.recoveryFailures;
      if (s = typeof i == "number" && Number.isFinite(i) && i >= 0 ? i : 0, s >= 3) {
        a("debug", `Discarding persisted events after ${s} failed recovery attempts`), this.clearPersistedEvents(), e?.onFailure?.();
        return;
      }
      if (this.isRateLimited()) {
        a("debug", "Rate-limit cooldown active, deferring recovery", {
          data: { cooldownRemainingMs: this.rateLimitedUntil - Date.now() }
        }), e?.onFailure?.();
        return;
      }
      if (t = this.ensureBatchMetadata(this.createRecoveryBody(r)), t.events.length === 0) {
        a("debug", "All persisted events exceeded the recovery age cutoff; discarding batch"), this.clearPersistedEvents();
        return;
      }
      await this.send(t) ? (this.clearPersistedEvents(), e?.onSuccess?.(r.events.length, r.events, t)) : (this.persistEventsWithFailureCount(t, s + 1, !0), e?.onFailure?.());
    } catch (r) {
      if (r instanceof C) {
        this.logPermanentError("Permanent error during recovery, clearing persisted events", r), this.clearPersistedEvents(), e?.onFailure?.();
        return;
      }
      a("error", "Failed to recover persisted events", { error: r }), t && this.persistEventsWithFailureCount(t, s + 1, !0), e?.onFailure?.();
    } finally {
      this.recoveryInProgress = !1;
    }
  }
  /**
   * Cleanup method called during `App.destroy()`. No-op — persisted events
   * intentionally kept in localStorage for recovery.
   */
  stop() {
  }
  async backoffDelay(e) {
    const t = 100 * Math.pow(2, e), s = Math.random() * 100;
    return new Promise((r) => setTimeout(r, t + s));
  }
  async send(e) {
    const t = this.ensureBatchMetadata(e, e._metadata?.idempotency_token);
    if (this.apiUrl.includes(M.Fail))
      return a("debug", "Fail mode: simulating network failure", { data: { events: t.events.length } }), !1;
    if (this.apiUrl.includes(M.Localhost))
      return a("debug", "Success mode: simulating successful send", { data: { events: t.events.length } }), !0;
    if (this.isRateLimited())
      return a("debug", "Rate-limit cooldown active, skipping send", {
        data: {
          cooldownRemainingMs: this.rateLimitedUntil - Date.now(),
          events: t.events.length
        }
      }), !1;
    if (this.consecutiveNetworkFailures >= 3) {
      const c = Date.now() - this.circuitOpenedAt;
      if (c < 12e4)
        return a("debug", "Network circuit open, skipping send", {
          data: {
            consecutiveNetworkFailures: this.consecutiveNetworkFailures,
            cooldownRemainingMs: 12e4 - c
          }
        }), !1;
    }
    const { url: s, payload: r } = this.prepareRequest(t);
    let i = !0, o = !1;
    for (let c = 1; c <= 3; c++)
      try {
        return (await this.sendWithTimeout(s, r)).ok ? (c > 1 && a("info", `Send succeeded after ${c - 1} retry attempt(s)`, {
          data: { events: t.events.length, attempt: c }
        }), this.consecutiveNetworkFailures = 0, this.circuitOpenedAt = 0, !0) : !1;
      } catch (l) {
        const u = c === 3;
        if (l instanceof C)
          throw this.consecutiveNetworkFailures = 0, this.circuitOpenedAt = 0, l.statusCode === 403 ? this.emitHealthBeacon("events_blocked", l.message) : l.statusCode === 404 && l.responseCode === Ns && this.emitHealthBeacon("unknown_project", l.message), l;
        if (l instanceof Z) {
          this.consecutiveNetworkFailures = 0, this.circuitOpenedAt = 0, this.armRateLimitCooldown(Date.now() + 6e4), a("warn", "Rate limited, skipping retries", {
            data: { events: e.events.length, attempt: c, cooldownMs: 6e4 }
          });
          break;
        }
        if (l instanceof ee || (i = !1), l instanceof TypeError || (o = !0), a(
          u ? "error" : "warn",
          `Send attempt ${c} failed${u ? " (all retries exhausted)" : ", will retry"}`,
          {
            error: l,
            data: {
              events: e.events.length,
              url: s.replace(/\/\/[^/]+/, "//[DOMAIN]"),
              attempt: c,
              maxAttempts: 3
            }
          }
        ), !u) {
          await this.backoffDelay(c);
          continue;
        }
        return i ? (a("debug", "All retry attempts timed out, preserving batch for retry", {
          data: { events: t.events.length }
        }), !1) : (o ? (this.consecutiveNetworkFailures = 0, this.circuitOpenedAt = 0) : (this.consecutiveNetworkFailures = Math.min(
          this.consecutiveNetworkFailures + 1,
          3
        ), this.consecutiveNetworkFailures >= 3 && (this.circuitOpenedAt = Date.now())), !1);
      }
    return !1;
  }
  async sendWithTimeout(e, t) {
    const s = new AbortController();
    this.pendingControllers.add(s);
    let r = !1;
    const i = setTimeout(() => {
      r = !0, s.abort();
    }, 15e3);
    try {
      const o = await fetch(e, {
        method: "POST",
        body: t,
        keepalive: !0,
        credentials: "include",
        signal: s.signal,
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (!o.ok) {
        if (o.status >= 400 && o.status < 500 && o.status !== 408 && o.status !== 429) {
          const l = await this.readTraceLogErrorCode(o), u = l ? `HTTP ${o.status}: ${o.statusText} (${l})` : `HTTP ${o.status}: ${o.statusText}`;
          throw new C(u, o.status, l);
        }
        throw o.status === 429 ? new Z(`HTTP 429: ${o.statusText}`) : new Error(`HTTP ${o.status}: ${o.statusText}`);
      }
      return o;
    } catch (o) {
      throw o instanceof C ? o : r ? new ee("Request timed out") : o;
    } finally {
      clearTimeout(i), this.pendingControllers.delete(s);
    }
  }
  /**
   * Extracts the application error code from a 4xx body, and with it the proof that a TraceLog
   * host — not an arbitrary server answering the same name — produced the response.
   *
   * Only the ingest error envelope is accepted: `{ statusCode, error, message, timestamp, path }`,
   * the single shape every rejection arrives in (tracelog-middleware's `AllExceptionsFilter`, which
   * renders an exception's own `code` into `error`). `error` counts only when `statusCode` echoes
   * the HTTP status — that pairing is the envelope's signature, and neither a generic
   * `{"error":"Not Found"}` nor a bare `{"code":"..."}` from a foreign host can produce it.
   *
   * An uncorroborated code is deliberately NOT read: a code is both a log detail and the authorship
   * proof {@link HealthBeaconReason} `unknown_project` gates on, so accepting one nobody vouched for
   * would let any responder authorize a claim about TraceLog's own records. `undefined` therefore
   * means exactly "nothing here identifies the responder as TraceLog".
   */
  async readTraceLogErrorCode(e) {
    try {
      const t = await e.clone().json();
      if (t.statusCode === e.status && Rs(t.error))
        return t.error;
    } catch {
    }
  }
  sendQueueSyncInternal(e) {
    const t = this.ensureBatchMetadata(e), s = this.ensureBatchMetadata(t, t._metadata?.idempotency_token), { url: r, payload: i } = this.prepareRequest(s);
    if (i.length > 65536)
      return a("warn", "Payload exceeds sendBeacon limit, persisting for recovery", {
        data: { size: i.length, limit: 65536, events: s.events.length }
      }), this.persistEvents(t), !1;
    const o = new Blob([i], { type: "application/json" });
    if (!this.isSendBeaconAvailable())
      return a("warn", "sendBeacon not available, persisting events for recovery"), this.persistEvents(t), !1;
    const c = navigator.sendBeacon(r, o);
    return c || (a("warn", "sendBeacon rejected request, persisting events for recovery"), this.persistEvents(t)), c;
  }
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
        client_version: ts
      }
    };
    return {
      url: this.apiUrl,
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
   * `user_id` and `session_id`. Produces the same idempotency token for the
   * same set of events across retries.
   */
  computeContentToken(e) {
    const t = e.events.map((i) => i.id).sort().join(","), s = `${e.user_id}|${e.session_id}|${t}`;
    let r = 2166136261;
    for (let i = 0; i < s.length; i++)
      r ^= s.charCodeAt(i), r = Math.imul(r, 16777619) >>> 0;
    return r.toString(16).padStart(8, "0");
  }
  getPersistedData() {
    try {
      const e = this.getQueueStorageKey(), t = this.storeManager.getItem(e);
      if (t)
        return JSON.parse(t);
    } catch (e) {
      a("debug", "Failed to parse persisted data", { error: e }), this.clearPersistedEvents();
    }
    return null;
  }
  isDataRecent(e) {
    return !e.timestamp || typeof e.timestamp != "number" ? !1 : (Date.now() - e.timestamp) / (1e3 * 60 * 60) < 2;
  }
  createRecoveryBody(e) {
    const { timestamp: t, recoveryFailures: s, ...r } = e, i = r.events ?? [], o = Date.now() - 5184e5, c = i.filter((l) => {
      const u = typeof l.timestamp == "number" ? l.timestamp : new Date(l.timestamp).getTime();
      return Number.isFinite(u) && u >= o;
    });
    return c.length < i.length && a("debug", "Recovery dropped stale events", {
      data: {
        dropped: i.length - c.length,
        kept: c.length
      }
    }), { ...r, events: c };
  }
  persistEvents(e) {
    const t = this.getPersistedData(), s = typeof t?.recoveryFailures == "number" && Number.isFinite(t.recoveryFailures) ? t.recoveryFailures : 0;
    return this.persistEventsWithFailureCount(e, s);
  }
  persistEventsWithFailureCount(e, t, s = !1) {
    try {
      const r = this.getPersistedData();
      if (!s && typeof r?.timestamp == "number") {
        const c = Date.now() - r.timestamp;
        if (c < 1e3)
          return a("debug", "Skipping persistence, another tab recently persisted events", {
            data: { timeSinceExisting: c }
          }), !0;
      }
      const i = {
        ...e,
        timestamp: Date.now(),
        ...t > 0 && { recoveryFailures: t }
      }, o = this.getQueueStorageKey();
      return this.storeManager.setItem(o, JSON.stringify(i)), !!this.storeManager.getItem(o);
    } catch (r) {
      return a("debug", "Failed to persist events", { error: r }), !1;
    }
  }
  clearPersistedEvents() {
    try {
      const e = this.getQueueStorageKey();
      this.storeManager.removeItem(e);
    } catch (e) {
      a("debug", "Failed to clear persisted events", { error: e });
    }
  }
  isSendBeaconAvailable() {
    return typeof navigator < "u" && typeof navigator.sendBeacon == "function";
  }
  logPermanentError(e, t) {
    const s = Date.now(), r = `${t.statusCode ?? "unknown"}:${t.responseCode ?? ""}`;
    (this.lastPermanentErrorLog?.key !== r || s - this.lastPermanentErrorLog.timestamp >= Kt) && (a("error", e, {
      data: { status: t.statusCode, code: t.responseCode, message: t.message }
    }), this.lastPermanentErrorLog = { key: r, timestamp: s });
  }
  /**
   * Emits a low-frequency, deduplicated diagnostic "health beacon" to the gate-bypassing
   * `/client-error` endpoint. Best-effort and silent: never blocks, never throws, never logs to the
   * host page. Opt out via `integrations.tracelog.healthBeacon: false`.
   */
  emitHealthBeacon(e, t) {
    try {
      const s = this.get("config")?.integrations?.tracelog;
      if (!s?.projectId || s.healthBeacon === !1) return;
      const r = this.resolveBeaconUrl();
      if (!r) return;
      const i = typeof window < "u" && window.location ? window.location.origin : "";
      if (!i || !this.markBeaconEmitted(s.projectId, e)) return;
      const o = JSON.stringify({
        projectId: s.projectId,
        reason: e,
        origin: i,
        ...t ? { lastError: t.slice(0, Yt) } : {}
      });
      this.postBeacon(r, o);
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
  markBeaconEmitted(e, t) {
    const s = Date.now(), r = It(e, t);
    let i = this.lastBeaconAt[t] ?? 0;
    try {
      const o = Number(this.storeManager.getItem(r));
      Number.isFinite(o) && o > i && (i = o);
    } catch {
    }
    if (s - i < Qt) return !1;
    this.lastBeaconAt[t] = s;
    try {
      this.storeManager.setItem(r, String(s));
    } catch {
    }
    return !0;
  }
  /** The collect URL the lib already derived, with the path swapped to the diagnostics route. */
  resolveBeaconUrl() {
    return this.apiUrl.includes(M.Localhost) || this.apiUrl.includes(M.Fail) || !/\/collect$/.test(this.apiUrl) ? null : this.apiUrl.replace(/\/collect$/, "/client-error");
  }
  postBeacon(e, t) {
    if (this.isSendBeaconAvailable()) {
      const s = new Blob([t], { type: "application/json" });
      if (navigator.sendBeacon(e, s)) return;
    }
    typeof fetch == "function" && fetch(e, {
      method: "POST",
      body: t,
      keepalive: !0,
      headers: { "Content-Type": "application/json" }
    }).catch(() => {
    });
  }
}
class Ps extends T {
  bootTime;
  bootTimestamp;
  hasPerformanceNow;
  constructor() {
    if (super(), typeof window > "u") {
      this.hasPerformanceNow = !1, this.bootTime = 0, this.bootTimestamp = 0;
      return;
    }
    this.hasPerformanceNow = typeof performance < "u" && typeof performance.now == "function", this.hasPerformanceNow ? (this.bootTime = performance.now(), this.bootTimestamp = Date.now()) : (this.bootTime = 0, this.bootTimestamp = Date.now(), a("debug", "performance.now() not available, falling back to Date.now()"));
  }
  /**
   * Returns current timestamp in milliseconds since epoch, immune to clock
   * changes during the session.
   */
  now() {
    if (!this.hasPerformanceNow)
      return Date.now();
    const e = performance.now() - this.bootTime;
    return Math.round(this.bootTimestamp + e);
  }
  /**
   * Validates a timestamp is not more than 2 minutes in the future relative
   * to the monotonic clock. Backend allows 3 minutes — keep client tighter
   * so obvious clock-skew events are flagged before they hit the wire.
   */
  validateTimestamp(e) {
    const s = e - this.now();
    return s > 12e4 ? {
      valid: !1,
      error: `Timestamp is ${(s / 1e3 / 60).toFixed(2)} minutes in the future (max allowed: 2 minutes)`
    } : { valid: !0 };
  }
}
const ks = new Set(Object.values(d));
class Ds extends T {
  dataSenders;
  emitter;
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
  // Set when a sync flush is requested mid-async-send; drained by the async
  // finally block. See `drainPendingSyncFlush` for the full rationale.
  pendingSyncFlush = !1;
  sessionEventCounts = {
    total: 0,
    [d.CLICK]: 0,
    [d.PAGE_VIEW]: 0,
    [d.CUSTOM]: 0,
    [d.SCROLL]: 0
  };
  saveSessionCountsDebounced = null;
  /**
   * Creates an EventManager instance.
   *
   * @param storeManager - Storage manager for persistence
   * @param emitter - Optional event emitter for local event consumption
   */
  constructor(e, t = null) {
    super(), this.emitter = t, this.timeManager = new Ps(), this.dataSenders = [];
    const s = this.get("collectApiUrls");
    s?.saas && this.dataSenders.push(new Os(e, s.saas)), this.saveSessionCountsDebounced = this.debounce((r) => {
      this.saveSessionCounts(r);
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
        onSuccess: (s, r, i) => {
          if (r && r.length > 0) {
            const o = r.map((c) => c.id);
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
    scroll_data: r,
    click_data: i,
    custom_event: o,
    web_vitals: c,
    error_data: l,
    page_view: u
  }) {
    if (!e) {
      a("error", "Event type is required - event will be ignored");
      return;
    }
    if (!ks.has(e)) {
      a("error", "Invalid event type - event will be ignored", {
        data: { type: e }
      });
      return;
    }
    const h = this.get("sessionId");
    if (!h) {
      this.pendingEventsBuffer.length >= 100 && (this.pendingEventsBuffer.shift(), a("debug", "Pending events buffer full - dropping oldest event", {
        data: { maxBufferSize: 100 }
      })), this.pendingEventsBuffer.push({
        type: e,
        page_url: t,
        from_page_url: s,
        scroll_data: r,
        click_data: i,
        custom_event: o,
        web_vitals: c,
        error_data: l,
        page_view: u
      });
      return;
    }
    this.lastSessionId !== h && (this.lastSessionId = h, this.sessionEventCounts = this.loadSessionCounts(h));
    const p = e === d.SESSION_START;
    if (p && a("debug", "Processing SESSION_START event", {
      data: { sessionId: h }
    }), !p && !this.checkRateLimit())
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
      const _ = this.getTypeLimitForEvent(S);
      if (_) {
        const ce = this.sessionEventCounts[S];
        if (ce !== void 0 && ce >= _) {
          a("warn", "Session event type limit reached", {
            data: {
              type: S,
              count: ce,
              limit: _
            }
          });
          return;
        }
      }
    }
    if (S === d.CUSTOM && o?.name) {
      const _ = this.get("config")?.maxSameEventPerMinute ?? 60;
      if (!this.checkPerEventRateLimit(o.name, _))
        return;
    }
    const St = S === d.SESSION_START, Et = t || this.get("pageUrl"), W = this.buildEventPayload({
      type: S,
      page_url: Et,
      from_page_url: s,
      scroll_data: r,
      click_data: i,
      custom_event: o,
      web_vitals: c,
      error_data: l,
      page_view: u
    });
    if (W && !(!p && S !== d.WEB_VITALS && !this.shouldSample())) {
      if (St) {
        const _ = this.get("sessionId");
        if (!_) {
          a("error", "Session start event requires sessionId - event will be ignored");
          return;
        }
        if (this.get("hasStartSession")) {
          a("debug", "Duplicate session_start detected", {
            data: { sessionId: _ }
          });
          return;
        }
        this.set("hasStartSession", !0);
      }
      if (!this.isDuplicateEvent(W)) {
        if (this.get("mode") === te.QA && S === d.CUSTOM && o) {
          a("info", `Custom Event: ${o.name}`, {
            visibility: "qa",
            data: {
              name: o.name,
              ...o.metadata && { metadata: o.metadata }
            }
          }), this.emitEvent(W);
          return;
        }
        if (this.addToQueue(W), !p) {
          this.sessionEventCounts.total++, this.sessionEventCounts[S] !== void 0 && this.sessionEventCounts[S]++;
          const _ = this.get("sessionId");
          _ && this.saveSessionCountsDebounced && this.saveSessionCountsDebounced(_);
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
    this.clearSendTimeout(), this.sendInProgress = !1, this.pendingSyncFlush = !1, this.consecutiveSendFailures = 0;
    const e = this.get("sessionId");
    e && this.saveSessionCounts(e), this.eventsQueue = [], this.pendingEventsBuffer = [], this.recentEventFingerprints.clear(), this.rateLimitCounter = 0, this.rateLimitWindowStart = 0, this.perEventRateLimits.clear(), this.sessionEventCounts = {
      total: 0,
      [d.CLICK]: 0,
      [d.PAGE_VIEW]: 0,
      [d.CUSTOM]: 0,
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
    return this.eventsQueue.map(({ _session_id: e, ...t }) => t);
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
    const e = /* @__PURE__ */ new Map(), t = [];
    for (const s of this.eventsQueue) {
      if (!s._session_id) {
        a("debug", "Queued event missing _session_id, dropping", {
          data: { eventId: s.id, type: s.type }
        }), t.push(s.id);
        continue;
      }
      const r = e.get(s._session_id);
      r ? r.push(s) : e.set(s._session_id, [s]);
    }
    return t.length > 0 && this.removeProcessedEvents(t), e;
  }
  /**
   * Builds a parallel list of `(batch, eventIds)` for sending. The eventIds are
   * the original `_session_id`-tagged event IDs in the queue that map to this
   * batch — used for optimistic removal. We can't read them off the wrapper's
   * `events[]` because dedup may have removed some signatures.
   */
  buildBatchesWithIds() {
    const e = this.groupQueuedEventsBySession();
    if (e.size === 0) return [];
    const t = [];
    for (const [s, r] of e)
      t.push({
        batch: this.buildBatchFromGroup(s, r),
        eventIds: r.map((i) => i.id)
      });
    return t;
  }
  flushEvents(e) {
    if (this.eventsQueue.length === 0)
      return e ? !0 : Promise.resolve(!0);
    if (!e && this.sendInProgress)
      return a("debug", "Async flush skipped: send already in progress"), Promise.resolve(!1);
    const t = this.buildBatchesWithIds();
    if (t.length === 0)
      return e ? !0 : Promise.resolve(!0);
    if (this.dataSenders.length === 0) {
      for (const { batch: s, eventIds: r } of t)
        this.removeProcessedEvents(r), this.emitEventsQueue(s);
      return this.clearSendTimeout(), e ? !0 : Promise.resolve(!0);
    }
    if (e && this.sendInProgress) {
      const s = t.reduce((r, i) => r + i.eventIds.length, 0);
      return this.pendingSyncFlush = !0, a("debug", "Sync flush deferred: async send in-flight, will retry on settle", {
        data: { eventCount: s }
      }), !1;
    }
    if (e) {
      const s = t.map(({ batch: r, eventIds: i }) => this.sendBatchSync(r, i));
      return this.settleSendTimeout(), s.some(Boolean);
    }
    return this.sendInProgress = !0, (async () => {
      try {
        const s = await Promise.all(
          t.map(async ({ batch: r, eventIds: i }) => this.sendBatchAsync(r, i))
        );
        return this.settleSendTimeout(), s.some(Boolean);
      } finally {
        this.sendInProgress = !1, this.drainPendingSyncFlush();
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
    this.eventsQueue.length === 0 ? this.clearSendTimeout() : this.scheduleSendTimeout();
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
    this.pendingSyncFlush && (this.pendingSyncFlush = !1, this.flushImmediatelySync());
  }
  /**
   * Sends one batch synchronously across all integrations (sendBeacon path).
   * Optimistic removal: if any integration succeeds, we remove the batch's
   * events from the queue and emit it locally. Failures persist per-integration.
   */
  sendBatchSync(e, t) {
    const r = this.dataSenders.map((i) => i.sendEventsQueueSync(e)).some((i) => i);
    return r ? (this.removeProcessedEvents(t), this.emitEventsQueue(e)) : a("debug", "Sync send complete failure, events kept in queue for retry", {
      data: { eventCount: t.length, sessionId: e.session_id }
    }), r;
  }
  /**
   * Sends one batch asynchronously across all integrations (fetch path).
   */
  async sendBatchAsync(e, t) {
    const s = this.dataSenders.map(
      async (o) => o.sendEventsQueue(e, {
        onSuccess: () => {
        },
        onFailure: () => {
        }
      })
    ), r = await Promise.allSettled(s), i = r.some((o) => this.isSuccessfulResult(o));
    if (i) {
      this.removeProcessedEvents(t), this.emitEventsQueue(e);
      const o = r.filter((c) => !this.isSuccessfulResult(c)).length;
      o > 0 && a("debug", "Async send completed with some failures, removed from queue and persisted per-integration", {
        data: { eventCount: t.length, failedCount: o, sessionId: e.session_id }
      });
    } else
      a("debug", "Async send complete failure, events kept in queue for retry", {
        data: { eventCount: t.length, sessionId: e.session_id }
      });
    return i;
  }
  async sendEventsQueue() {
    if (!(this.eventsQueue.length === 0 || this.sendInProgress)) {
      this.sendInProgress = !0;
      try {
        const e = this.buildBatchesWithIds();
        if (e.length === 0) return;
        if (this.dataSenders.length === 0) {
          for (const { batch: r } of e)
            this.emitEventsQueue(r);
          return;
        }
        (await Promise.all(
          e.map(async ({ batch: r, eventIds: i }) => this.sendBatchAsync(r, i))
        )).some(Boolean) ? this.consecutiveSendFailures = 0 : this.consecutiveSendFailures = Math.min(this.consecutiveSendFailures + 1, 5), this.eventsQueue.length === 0 ? this.clearSendTimeout() : this.scheduleSendTimeout();
      } finally {
        this.sendInProgress = !1, this.drainPendingSyncFlush();
      }
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
  buildBatchFromGroup(e, t) {
    const s = /* @__PURE__ */ new Map(), r = [];
    for (const u of t) {
      const h = this.createEventSignature(u);
      s.has(h) || r.push(h), s.set(h, u);
    }
    const i = r.map((u) => s.get(u)).filter((u) => !!u).sort((u, h) => u.type === d.SESSION_START && h.type !== d.SESSION_START ? -1 : h.type === d.SESSION_START && u.type !== d.SESSION_START ? 1 : u.timestamp - h.timestamp).map(({ _session_id: u, ...h }) => h), o = this.get("config")?.globalMetadata, c = this.get("identity");
    return {
      user_id: this.get("userId"),
      session_id: e,
      device: this.get("device"),
      events: i,
      ...o && { global_metadata: o },
      ...c && { identify: c }
    };
  }
  buildEventPayload(e) {
    const t = this.get("sessionId");
    if (!t)
      return a("error", "buildEventPayload reached without sessionId — event dropped", {
        data: { type: e.type },
        visibility: "critical"
      }), null;
    const s = e.page_url ?? this.get("pageUrl"), r = typeof s == "string" && s.length > 0 ? s : "unknown", i = this.timeManager.now(), o = this.timeManager.validateTimestamp(i);
    o.valid || a("warn", "Event timestamp validation failed", {
      data: { type: e.type, error: o.error }
    });
    const c = this.get("sessionReferrer"), l = this.get("sessionUtm"), u = this.get("sessionClickIds");
    return { ...{
      id: ds(),
      type: e.type,
      page_url: r,
      timestamp: i,
      ...c && { referrer: c },
      ...e.from_page_url && { from_page_url: e.from_page_url },
      ...e.scroll_data && { scroll_data: e.scroll_data },
      ...e.click_data && { click_data: e.click_data },
      ...e.custom_event && { custom_event: e.custom_event },
      ...e.web_vitals && { web_vitals: e.web_vitals },
      ...e.error_data && { error_data: e.error_data },
      ...e.page_view && { page_view: e.page_view },
      ...l && { utm: l },
      ...u && { click_ids: u }
    }, _session_id: t };
  }
  isDuplicateEvent(e) {
    const t = Date.now(), s = this.createEventFingerprint(e), r = this.recentEventFingerprints.get(s);
    return r && t - r < 1e3 ? (this.recentEventFingerprints.set(s, t), !0) : (this.recentEventFingerprints.set(s, t), this.recentEventFingerprints.size > 1500 && this.pruneOldFingerprints(), this.recentEventFingerprints.size > 3e3 && (this.recentEventFingerprints.clear(), this.recentEventFingerprints.set(s, t), a("debug", "Event fingerprint cache exceeded hard limit, cleared", {
      data: { hardLimit: 3e3 }
    })), !1);
  }
  pruneOldFingerprints() {
    const e = Date.now(), t = 1e3 * 10;
    for (const [s, r] of this.recentEventFingerprints.entries())
      e - r > t && this.recentEventFingerprints.delete(s);
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
      const s = Math.round((e.click_data.x || 0) / 10) * 10, r = Math.round((e.click_data.y || 0) / 10) * 10;
      t += `_click_${s}_${r}`;
    }
    return e.scroll_data && (t += `_scroll_${e.scroll_data.depth}_${e.scroll_data.direction}`), e.custom_event && (t += `_custom_${e.custom_event.name}`, e.custom_event.metadata && (t += `_${this.stableStringify(e.custom_event.metadata)}`)), e.web_vitals && (t += `_vitals_${this.stableStringify(e.web_vitals)}`), e.error_data && (t += `_error_${e.error_data.type}_${e.error_data.message}`), t;
  }
  createEventSignature(e) {
    return this.createEventFingerprint(e);
  }
  /** Deterministic JSON string with sorted keys to ensure consistent fingerprints regardless of property insertion order */
  stableStringify(e) {
    return JSON.stringify(e, (t, s) => s && typeof s == "object" && !Array.isArray(s) ? Object.keys(s).sort().reduce((r, i) => (r[i] = s[i], r), {}) : s);
  }
  addToQueue(e) {
    if (this.emitEvent(e), this.eventsQueue.push(e), this.eventsQueue.length > 100) {
      const t = this.eventsQueue.findIndex((r) => r.type !== d.SESSION_START), s = t >= 0 ? this.eventsQueue.splice(t, 1)[0] : this.eventsQueue.shift();
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
      [d.SCROLL]: 120
    }[e] ?? null;
  }
  removeProcessedEvents(e) {
    const t = new Set(e);
    this.eventsQueue = this.eventsQueue.filter((s) => !t.has(s.id));
  }
  emitEvent(e) {
    if (this.emitter) {
      const { _session_id: t, ...s } = e;
      this.emitter.emit(V.EVENT, s);
    }
  }
  emitEventsQueue(e) {
    this.emitter && this.emitter.emit(V.QUEUE, e);
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
    return ((...r) => {
      s !== null && clearTimeout(s), s = setTimeout(() => {
        e(...r), s = null;
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
    const t = this.get("userId") || "anonymous", s = Ve(t, e);
    try {
      const r = localStorage.getItem(s);
      if (!r)
        return this.getInitialCounts();
      const i = JSON.parse(r);
      return i._timestamp && Date.now() - i._timestamp > He ? (a("debug", "Session counts expired, clearing", {
        data: { sessionId: e, age: Date.now() - i._timestamp }
      }), localStorage.removeItem(s), this.getInitialCounts()) : typeof i.total == "number" && typeof i[d.CLICK] == "number" && typeof i[d.PAGE_VIEW] == "number" && typeof i[d.CUSTOM] == "number" && typeof i[d.SCROLL] == "number" ? {
        total: i.total,
        [d.CLICK]: i[d.CLICK],
        [d.PAGE_VIEW]: i[d.PAGE_VIEW],
        [d.CUSTOM]: i[d.CUSTOM],
        [d.SCROLL]: i[d.SCROLL]
      } : (a("warn", "Invalid session counts structure in localStorage, resetting", {
        data: { sessionId: e, parsed: i }
      }), localStorage.removeItem(s), a("debug", "Session counts removed due to invalid/corrupted data", {
        data: { sessionId: e, parsed: i }
      }), this.getInitialCounts());
    } catch (r) {
      return a("warn", "Failed to load session counts from localStorage", {
        error: r,
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
        const e = localStorage.getItem(xe);
        if (e) {
          const i = Date.now() - parseInt(e, 10);
          if (i < Be) {
            a("debug", "Skipping session counts cleanup (throttled)", {
              data: { timeSinceLastCleanup: i, throttleMs: Be }
            });
            return;
          }
        }
        const t = this.get("userId") || "anonymous", s = `${g}:${t}:session_counts:`, r = [];
        for (let i = 0; i < localStorage.length; i++) {
          const o = localStorage.key(i);
          if (o?.startsWith(s))
            try {
              const c = localStorage.getItem(o);
              if (c) {
                const l = JSON.parse(c);
                l._timestamp && Date.now() - l._timestamp > He && r.push(o);
              }
            } catch {
            }
        }
        r.forEach((i) => {
          localStorage.removeItem(i), a("debug", "Cleaned up expired session counts", { data: { key: i } });
        }), r.length > 0 && a("info", `Cleaned up ${r.length} expired session counts entries`), localStorage.setItem(xe, Date.now().toString());
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
    const t = this.get("userId") || "anonymous", s = Ve(t, e);
    try {
      const r = {
        ...this.sessionEventCounts,
        _timestamp: Date.now(),
        _version: 1
      };
      localStorage.setItem(s, JSON.stringify(r));
    } catch (r) {
      a("warn", "Failed to persist session counts to localStorage", {
        error: r,
        data: { sessionId: e }
      });
    }
  }
}
class Us {
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
    const s = at();
    return e.setItem(Ee, s), s;
  }
}
const Fs = /^\d{13}-[a-z0-9]{9}$/;
class Vs extends T {
  storageManager;
  eventManager;
  projectId;
  activityHandler = null;
  visibilityChangeHandler = null;
  sessionTimeoutId = null;
  broadcastChannel = null;
  isTracking = !1;
  needsRenewal = !1;
  prerenderActivationHandler = null;
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
    this.broadcastChannel = new BroadcastChannel(At(e)), this.broadcastChannel.onmessage = (t) => {
      const { action: s, sessionId: r, timestamp: i, projectId: o } = t.data ?? {};
      if (o === e)
        if (s === "session_start" && r && typeof i == "number" && i > Date.now() - 5e3) {
          this.set("sessionId", r);
          const c = this.loadStoredSession();
          this.set("sessionReferrer", c?.referrer), this.set("sessionUtm", c?.utm), this.set("sessionClickIds", c?.clickIds), this.persistSession(r, i, c?.referrer, c?.utm, c?.clickIds), this.isTracking && this.setupSessionTimeout();
        } else s && s !== "session_start" && a("debug", "Ignored BroadcastChannel message with unknown action", { data: { action: s } });
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
    if (!Fs.test(e.id))
      return a("warn", "Invalid session ID format recovered from storage, clearing", {
        data: { sessionId: e.id }
      }), this.clearStoredSession(), null;
    const t = this.get("config")?.sessionTimeout ?? 9e5;
    return Date.now() - e.lastActivity > t ? (this.clearStoredSession(), null) : e.id;
  }
  persistSession(e, t = Date.now(), s, r, i) {
    this.saveStoredSession({
      id: e,
      lastActivity: t,
      ...s && { referrer: s },
      ...r && { utm: r },
      ...i && { clickIds: i }
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
        const r = JSON.parse(t);
        if (r.id && typeof r.lastActivity == "number")
          return r;
      } catch {
        this.storageManager.removeItem(e);
      }
    const s = this.storageManager.getSessionItem(e);
    if (s !== null)
      try {
        const r = JSON.parse(s);
        if (r.id && typeof r.lastActivity == "number")
          return r;
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
    return wt(this.getProjectId());
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
      a("debug", "Session tracking already active");
      return;
    }
    const e = this.recoverSession(), t = e ?? this.generateSessionId();
    let s, r, i;
    if (e) {
      const o = this.loadStoredSession();
      s = o?.referrer ?? fe(this.get("config").sensitiveQueryParams), r = o?.utm ?? ge(), i = o?.clickIds ?? he();
    } else
      s = fe(this.get("config").sensitiveQueryParams), r = ge(), i = he();
    a("debug", "Session tracking initialized", {
      data: {
        sessionId: t,
        wasRecovered: !!e,
        willEmitSessionStart: !e,
        sessionReferrer: s,
        hasUtm: !!r,
        hasClickIds: !!i
      }
    }), this.isTracking = !0;
    try {
      if (this.set("sessionId", t), this.set("sessionReferrer", s), this.set("sessionUtm", r), this.set("sessionClickIds", i), ot()) {
        this.prerenderActivationHandler = () => {
          this.prerenderActivationHandler = null, this.activateSession(t, e, s, r, i);
        }, document.addEventListener("prerenderingchange", this.prerenderActivationHandler, { once: !0 });
        return;
      }
      this.activateSession(t, e, s, r, i);
    } catch (o) {
      throw this.isTracking = !1, this.clearSessionTimeout(), this.cleanupActivityListeners(), this.cleanupLifecycleListeners(), this.cleanupCrossTabSync(), this.set("sessionId", null), o;
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
  activateSession(e, t, s, r, i) {
    this.persistSession(e, Date.now(), s, r, i), this.initCrossTabSync(), this.shareSession(e), t ? a("debug", "Session recovered, skipping SESSION_START", { data: { sessionId: e } }) : (a("debug", "Emitting SESSION_START event", { data: { sessionId: e } }), this.eventManager.track({ type: d.SESSION_START })), this.setupSessionTimeout(), this.setupActivityListeners(), this.setupLifecycleListeners();
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
    e && this.persistSession(
      e,
      Date.now(),
      this.get("sessionReferrer"),
      this.get("sessionUtm"),
      this.get("sessionClickIds")
    );
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
    const e = this.generateSessionId(), t = fe(this.get("config").sensitiveQueryParams), s = ge(), r = he();
    a("debug", "Renewing session after timeout", {
      data: { newSessionId: e }
    }), this.set("sessionId", e), this.set("sessionReferrer", t), this.set("sessionUtm", s), this.set("sessionClickIds", r), this.persistSession(e, Date.now(), t, s, r), this.cleanupCrossTabSync(), this.initCrossTabSync(), this.shareSession(e), this.eventManager.track({
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
    this.clearSessionTimeout(), this.cleanupCrossTabSync(), this.clearStoredSession(), this.set("sessionId", null), this.set("hasStartSession", !1), this.set("sessionReferrer", void 0), this.set("sessionUtm", void 0), this.set("sessionClickIds", void 0), this.needsRenewal = !0, a("debug", "Session timed out, entering renewal mode");
  }
  /**
   * Fully resets session state and cleans up all resources.
   * Called by stopTracking() for explicit session termination.
   */
  resetSessionState() {
    this.clearSessionTimeout(), this.cleanupActivityListeners(), this.cleanupLifecycleListeners(), this.cleanupCrossTabSync(), this.cleanupPrerenderActivation(), this.clearStoredSession(), this.set("sessionId", null), this.set("hasStartSession", !1), this.set("sessionReferrer", void 0), this.set("sessionUtm", void 0), this.set("sessionClickIds", void 0), this.needsRenewal = !1, this.isTracking = !1;
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
    this.clearSessionTimeout(), this.cleanupActivityListeners(), this.cleanupCrossTabSync(), this.cleanupLifecycleListeners(), this.cleanupPrerenderActivation(), this.isTracking = !1, this.needsRenewal = !1, this.set("hasStartSession", !1);
  }
  /**
   * Removes the pending `prerenderingchange` listener when the manager is torn
   * down before activation (the discarded-prerender case). On the activation path
   * `{ once: true }` removes the listener and the handler nulls its own reference,
   * so this is a no-op then.
   */
  cleanupPrerenderActivation() {
    this.prerenderActivationHandler && (document.removeEventListener("prerenderingchange", this.prerenderActivationHandler), this.prerenderActivationHandler = null);
  }
}
class Hs extends T {
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
      this.sessionManager = new Vs(this.storageManager, this.eventManager, t), this.sessionManager.startTracking(), this.eventManager.flushPendingEvents();
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
class xs extends T {
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
    const e = window.location.href, t = D(e, this.get("config").sensitiveQueryParams);
    if (this.get("pageUrl") === t)
      return;
    const s = Date.now(), r = this.get("config").pageViewThrottleMs ?? 1e3;
    if (s - this.lastPageViewTime < r)
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
    }), this.get("config").flushOnSpaNavigation === !0 && this.eventManager.flushImmediately();
  };
  trackInitialPageView() {
    const e = D(window.location.href, this.get("config").sensitiveQueryParams), t = this.extractPageViewData();
    this.lastPageViewTime = Date.now(), this.eventManager.track({
      type: d.PAGE_VIEW,
      page_url: e,
      ...t && { page_view: t }
    }), this.onTrack();
  }
  extractPageViewData() {
    const e = document.referrer ? D(document.referrer, this.get("config").sensitiveQueryParams) : "", { title: t } = document;
    if (!(!e && !t))
      return {
        ...e && { referrer: e },
        ...t && { title: t }
      };
  }
}
class Bs extends T {
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
      const t = e, s = t.target, r = typeof HTMLElement < "u" && s instanceof HTMLElement ? s : typeof HTMLElement < "u" && s instanceof Node && s.parentElement instanceof HTMLElement ? s.parentElement : null;
      if (!r) {
        a("debug", "Click target not found or not an element");
        return;
      }
      if (this.shouldIgnoreElement(r))
        return;
      const i = this.get("config")?.clickThrottleMs ?? 300;
      if (i > 0 && !this.checkClickThrottle(r, i))
        return;
      const o = this.findTrackingElement(r), c = this.getRelevantClickElement(r), l = this.calculateClickCoordinates(t);
      if (o) {
        const h = this.extractTrackingData(o);
        if (h) {
          const p = this.createCustomEventData(h);
          this.eventManager.track({
            type: d.CUSTOM,
            custom_event: {
              name: p.name,
              ...p.value && { metadata: { value: p.value } }
            }
          });
        }
      }
      if (!l) {
        a("debug", "Click skipped: invalid coordinates (likely synthetic)");
        return;
      }
      const u = this.generateClickData(r, c, l);
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
    return e.hasAttribute(`${L}-ignore`) ? !0 : e.closest(`[${L}-ignore]`) !== null;
  }
  /**
   * Checks per-element click throttling to prevent double-clicks and rapid spam
   * Returns true if the click should be tracked, false if throttled
   */
  checkClickThrottle(e, t) {
    const s = this.getElementSignature(e), r = Date.now();
    this.pruneThrottleCache(r);
    const i = this.lastClickTimes.get(s);
    return i !== void 0 && r - i < t ? (a("debug", "ClickHandler: Click suppressed by throttle", {
      data: {
        signature: s,
        throttleRemaining: t - (r - i)
      }
    }), !1) : (this.lastClickTimes.set(s, r), !0);
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
    for (const [s, r] of this.lastClickTimes.entries())
      r < t && this.lastClickTimes.delete(s);
    if (this.lastClickTimes.size > 1e3) {
      const s = Array.from(this.lastClickTimes.entries()).sort((o, c) => o[1] - c[1]), r = this.lastClickTimes.size - 1e3, i = s.slice(0, r);
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
    const s = e.getAttribute(`${L}-name`);
    return s ? `[${L}-name="${s}"]` : this.getElementPath(e);
  }
  /**
   * Generates a DOM path for an element (e.g., "body>div>button")
   */
  getElementPath(e) {
    const t = [];
    let s = e;
    for (; s && s !== document.body; ) {
      let r = s.tagName.toLowerCase();
      if (s.className) {
        const i = s.className.split(" ")[0];
        i && (r += `.${i}`);
      }
      t.unshift(r), s = s.parentElement;
    }
    return t.join(">") || "unknown";
  }
  findTrackingElement(e) {
    return e.hasAttribute(`${L}-name`) ? e : e.closest(`[${L}-name]`);
  }
  getRelevantClickElement(e) {
    for (const t of vt)
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
  calculateClickCoordinates(e) {
    const t = e.clientX, s = e.clientY;
    return typeof t != "number" || typeof s != "number" || !Number.isFinite(t) || !Number.isFinite(s) || t === 0 && s === 0 && !e.isTrusted ? null : { x: t, y: s };
  }
  extractTrackingData(e) {
    const t = e.getAttribute(`${L}-name`), s = e.getAttribute(`${L}-value`);
    if (t)
      return {
        element: e,
        name: t,
        ...s && { value: s }
      };
  }
  generateClickData(e, t, s) {
    const { x: r, y: i } = s, o = this.getRelevantText(e, t), c = t.getAttribute("href"), l = c ? D(c, this.get("config").sensitiveQueryParams) : void 0;
    return {
      x: r,
      y: i,
      tag: t.tagName.toLowerCase(),
      ...t.id && { id: U(t.id) },
      ...t.className && { class: U(t.className) },
      ...o && { text: o },
      ...l && { href: l }
    };
  }
  getRelevantText(e, t) {
    const s = e.textContent?.trim() ?? "", r = t.textContent?.trim() ?? "";
    if (!s && !r)
      return "";
    let i;
    return s && s.length <= 255 ? i = s : r.length <= 255 ? i = r : i = r.slice(0, 252) + "...", U(i);
  }
  createCustomEventData(e) {
    return {
      name: e.name,
      ...e.value && { value: e.value }
    };
  }
}
class $s extends T {
  eventManager;
  containers = [];
  limitWarningLogged = !1;
  containerDiscoveryTimeoutId = null;
  constructor(e) {
    super(), this.eventManager = e;
  }
  startTracking() {
    this.limitWarningLogged = !1, this.set("scrollEventCount", 0), this.tryDetectScrollContainers(0);
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
      for (const s of t) {
        const r = this.getElementSelector(s);
        this.setupScrollContainer(s, r);
      }
      return;
    }
    if (e < 5) {
      this.containerDiscoveryTimeoutId = window.setTimeout(() => {
        this.containerDiscoveryTimeoutId = null, this.tryDetectScrollContainers(e + 1);
      }, 200);
      return;
    }
    this.containers.length === 0 && this.setupScrollContainer(window, "window");
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
    let s;
    for (; (s = t.nextNode()) && e.length < 10; ) {
      const r = s;
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
      const s = t.className.split(" ").filter((r) => r.trim())[0];
      if (s)
        return `.${s}`;
    }
    return t.tagName.toLowerCase();
  }
  setupScrollContainer(e, t) {
    if (this.containers.some((l) => l.element === e) || e !== window && !this.isElementScrollable(e))
      return;
    const r = this.getScrollTop(e), i = this.calculateScrollDepth(
      r,
      this.getScrollHeight(e),
      this.getViewportHeight(e)
    ), o = {
      element: e,
      selector: t,
      lastScrollPos: r,
      lastDepth: i,
      lastEventTime: 0,
      debounceTimer: null,
      listener: null
    }, c = () => {
      this.get("suppressNextScroll") || (this.clearContainerTimer(o), o.debounceTimer = window.setTimeout(() => {
        const l = this.calculateScrollData(o);
        l && this.processScrollEvent(o, l, Date.now()), o.debounceTimer = null;
      }, 250));
    };
    o.listener = c, this.containers.push(o), e === window ? window.addEventListener("scroll", c, { passive: !0 }) : e.addEventListener("scroll", c, { passive: !0 });
  }
  processScrollEvent(e, t, s) {
    if (!this.shouldEmitScrollEvent(e, t, s))
      return;
    e.lastEventTime = s, e.lastDepth = t.depth;
    const r = this.get("scrollEventCount") ?? 0;
    this.set("scrollEventCount", r + 1), this.eventManager.track({
      type: d.SCROLL,
      scroll_data: {
        ...t,
        container_selector: e.selector
      }
    });
  }
  shouldEmitScrollEvent(e, t, s) {
    return this.hasReachedSessionLimit() ? (this.logLimitOnce(), !1) : !(!this.hasElapsedMinimumInterval(e, s) || !this.hasSignificantDepthChange(e, t.depth));
  }
  hasReachedSessionLimit() {
    return (this.get("scrollEventCount") ?? 0) >= 120;
  }
  hasElapsedMinimumInterval(e, t) {
    return e.lastEventTime === 0 ? !0 : t - e.lastEventTime >= 500;
  }
  hasSignificantDepthChange(e, t) {
    return Math.abs(t - e.lastDepth) >= 5;
  }
  logLimitOnce() {
    this.limitWarningLogged || (this.limitWarningLogged = !0, a("debug", "Max scroll events per session reached", {
      data: { limit: 120 }
    }));
  }
  isWindowScrollable() {
    return document.documentElement.scrollHeight > window.innerHeight;
  }
  clearContainerTimer(e) {
    e.debounceTimer !== null && (clearTimeout(e.debounceTimer), e.debounceTimer = null);
  }
  getScrollDirection(e, t) {
    return e > t ? ve.DOWN : ve.UP;
  }
  calculateScrollDepth(e, t, s) {
    if (t <= s)
      return 0;
    const r = t - s;
    return Math.min(100, Math.max(0, Math.floor(e / r * 100)));
  }
  calculateScrollData(e) {
    const { element: t, lastScrollPos: s } = e, r = this.getScrollTop(t);
    if (Math.abs(r - s) < 10 || t === window && !this.isWindowScrollable())
      return null;
    const o = this.getViewportHeight(t), c = this.getScrollHeight(t), l = this.getScrollDirection(r, s), u = this.calculateScrollDepth(r, c, o);
    return e.lastScrollPos = r, { depth: u, direction: l };
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
    const t = getComputedStyle(e), s = t.overflowY === "auto" || t.overflowY === "scroll" || t.overflow === "auto" || t.overflow === "scroll", r = e.scrollHeight > e.clientHeight;
    return s && r;
  }
}
const js = "tracelog_session_id", Xs = "tracelog_user_id";
class Gs extends T {
  visibilityHandler = null;
  pageshowHandler = null;
  lastSyncedKey = null;
  activate() {
    this.cleanupListeners(), this.syncCartAttribute(), this.setupListeners();
  }
  deactivate() {
    this.cleanupListeners(), this.lastSyncedKey = null;
  }
  /** Re-syncs cart attributes when session rotates (called by App on SESSION_START). */
  onSessionChange() {
    this.syncCartAttribute();
  }
  syncCartAttribute() {
    const e = this.get("sessionId");
    if (!e) return;
    const t = this.get("userId"), s = typeof t == "string" && t.length > 0 ? t : "", r = `${e}|${s}`;
    r !== this.lastSyncedKey && (this.lastSyncedKey = r, this.postCartUpdate(e, s));
  }
  postCartUpdate(e, t) {
    const s = { [js]: e };
    t.length > 0 && (s[Xs] = t);
    try {
      fetch("/cart/update.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attributes: s }),
        credentials: "same-origin"
      }).then((r) => {
        r.ok || (this.lastSyncedKey = null, a("debug", "Shopify cart attribute update failed", { data: { status: r.status } }));
      }).catch(() => {
        this.lastSyncedKey = null, a("debug", "Shopify cart attribute update failed");
      });
    } catch {
      this.lastSyncedKey = null, a("debug", "Shopify cart attribute update failed");
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
      document.hidden || this.syncCartAttribute();
    }, document.addEventListener("visibilitychange", this.visibilityHandler), this.pageshowHandler = (e) => {
      e.persisted && this.syncCartAttribute();
    }, window.addEventListener("pageshow", this.pageshowHandler);
  }
  cleanupListeners() {
    this.visibilityHandler && (document.removeEventListener("visibilitychange", this.visibilityHandler), this.visibilityHandler = null), this.pageshowHandler && (window.removeEventListener("pageshow", this.pageshowHandler), this.pageshowHandler = null);
  }
}
class Ws {
  storage;
  sessionStorageRef;
  fallbackStorage = /* @__PURE__ */ new Map();
  fallbackSessionStorage = /* @__PURE__ */ new Map();
  constructor() {
    this.storage = this.initializeStorage("localStorage"), this.sessionStorageRef = this.initializeStorage("sessionStorage"), this.storage || a("debug", "localStorage not available, using memory fallback"), this.sessionStorageRef || a("debug", "sessionStorage not available, using memory fallback");
  }
  getItem(e) {
    try {
      return this.storage ? this.storage.getItem(e) : this.fallbackStorage.get(e) ?? null;
    } catch {
      return this.fallbackStorage.get(e) ?? null;
    }
  }
  setItem(e, t) {
    if (this.fallbackStorage.set(e, t), !!this.storage)
      try {
        this.storage.setItem(e, t);
        return;
      } catch (s) {
        if (!(s instanceof DOMException && s.name === "QuotaExceededError" || s instanceof Error && s.name === "QuotaExceededError"))
          return;
        if (a("warn", "localStorage quota exceeded, attempting cleanup", {
          data: { key: e, valueSize: t.length }
        }), !this.cleanupOldData()) {
          a("error", "localStorage quota exceeded and no data to cleanup - data will not persist", {
            error: s,
            data: { key: e, valueSize: t.length }
          });
          return;
        }
        try {
          this.storage.setItem(e, t);
        } catch (i) {
          a("error", "localStorage quota exceeded even after cleanup - data will not persist", {
            error: i,
            data: { key: e, valueSize: t.length }
          });
        }
      }
  }
  removeItem(e) {
    try {
      this.storage && this.storage.removeItem(e);
    } catch {
    }
    this.fallbackStorage.delete(e);
  }
  /**
   * Single-pass cleanup for QuotaExceededError. Purges persisted-events keys
   * (largest, safe to discard — recoverable) and up to 5 other non-critical
   * tracelog_* keys in one pass. Preserves session/user/device/config keys.
   */
  cleanupOldData() {
    if (!this.storage)
      return !1;
    try {
      const e = ["tracelog_session_", "tracelog_user_id", "tracelog_device_id", "tracelog_config"], t = [], s = [];
      for (let i = 0; i < this.storage.length; i++) {
        const o = this.storage.key(i);
        o?.startsWith("tracelog_") && (o.startsWith("tracelog_persisted_events_") ? t.push(o) : e.some((c) => o.startsWith(c)) || s.push(o));
      }
      const r = [...t, ...s.slice(0, 5)];
      return r.length === 0 ? !1 : (r.forEach((i) => {
        try {
          this.storage.removeItem(i);
        } catch {
        }
      }), !0);
    } catch (e) {
      return a("error", "Failed to cleanup old data", { error: e }), !1;
    }
  }
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
  getSessionItem(e) {
    try {
      return this.sessionStorageRef ? this.sessionStorageRef.getItem(e) : this.fallbackSessionStorage.get(e) ?? null;
    } catch {
      return this.fallbackSessionStorage.get(e) ?? null;
    }
  }
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
  removeSessionItem(e) {
    try {
      this.sessionStorageRef && this.sessionStorageRef.removeItem(e);
    } catch {
    }
    this.fallbackSessionStorage.delete(e);
  }
}
class Ks extends T {
  eventManager;
  seenNavIds = /* @__PURE__ */ new Set();
  navigationHistory = [];
  // FIFO queue for tracking navigation order
  observers = [];
  vitalThresholds;
  navigationCounter = 0;
  // Suffix counter for repeat navigations to the same path (SPA A→B→A)
  currentNavBase = null;
  currentNavId = null;
  // Metrics measured for the navigation currently being buffered, keyed by
  // type (last value wins — CLS/INP fallback observers can re-report a
  // running total for the same type before flush). Flushed as ONE
  // consolidated event on pagehide/hidden or when a new navigation starts.
  currentBuffer = /* @__PURE__ */ new Map();
  currentBufferNavId = null;
  isTracking = !1;
  lifecycleListenersRegistered = !1;
  pageHideHandler = () => {
    this.flushAndDeliver(!0);
  };
  visibilityHandler = () => {
    typeof document < "u" && document.hidden && this.flushAndDeliver(this.get("config").flushOnPageHidden !== !1);
  };
  constructor(e) {
    super(), this.eventManager = e, this.vitalThresholds = Qe(ye);
  }
  /**
   * Starts tracking Web Vitals and performance metrics.
   *
   * Loads the web-vitals library, then registers the consolidation lifecycle
   * listeners (see `registerLifecycleListeners` for why that order matters).
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
    const e = this.get("config"), t = e?.webVitalsMode ?? ye;
    this.vitalThresholds = Qe(t), e?.webVitalsThresholds && (this.vitalThresholds = { ...this.vitalThresholds, ...e.webVitalsThresholds }), this.isTracking = !0;
    try {
      await this.initWebVitals();
    } finally {
      this.registerLifecycleListeners();
    }
  }
  /**
   * Registers the `pagehide` / `visibilitychange` listeners that flush the
   * consolidated buffer. Two properties make one honest event per navigation:
   *
   * 1. **Registered AFTER `initWebVitals()`**, so on the same lifecycle
   *    dispatch the `web-vitals` library's own hidden/pagehide callbacks — its
   *    listeners were registered while the import resolved, therefore earlier —
   *    finalize LCP/CLS/INP into the buffer BEFORE this flush reads it.
   *    Registering first (or in the constructor) splits every navigation into
   *    two events: the early metrics (TTFB/FCP) and the late ones. The wire
   *    payload carries no navigation id, so the server cannot merge that split
   *    back into one navigation.
   * 2. **Each flush drains the queue itself** (`flushAndDeliver`) rather than
   *    relying on `App`'s page-lifecycle listeners running afterwards. `App`
   *    registers those during `init()`, but on a prerendered page it defers
   *    handler startup to `prerenderingchange` — inverting the order, so
   *    `App`'s `sendBeacon` would drain the queue before the vitals event was
   *    ever added to it, and the event would die with the page.
   *
   * Idempotent, and a no-op once `stopTracking()` has run — `startTracking()`
   * is async, so teardown can land while the import is still in flight.
   */
  registerLifecycleListeners() {
    !this.isTracking || this.lifecycleListenersRegistered || (this.lifecycleListenersRegistered = !0, window.addEventListener("pagehide", this.pageHideHandler), document.addEventListener("visibilitychange", this.visibilityHandler));
  }
  /**
   * Stops tracking Web Vitals and cleans up resources.
   *
   * Flushes any buffered (not-yet-shipped) vitals for the current navigation
   * first — called from `App.destroy()` before the final
   * `flushImmediatelySync()`, so a partial buffer is never silently dropped.
   * Then disconnects all Performance Observers and clears internal state:
   * - Removes the consolidation lifecycle listeners
   * - Disconnects all active observers (web-vitals and long task)
   * - Clears navigation-boundary tracking and history
   * - Prevents memory leaks in long-running applications
   */
  stopTracking() {
    this.isTracking = !1, this.lifecycleListenersRegistered = !1, this.flushConsolidatedVitals(), window.removeEventListener("pagehide", this.pageHideHandler), document.removeEventListener("visibilitychange", this.visibilityHandler), this.observers.forEach((e, t) => {
      try {
        e.disconnect();
      } catch (s) {
        a("debug", "Failed to disconnect performance observer", { error: s, data: { observerIndex: t } });
      }
    }), this.observers.length = 0, this.seenNavIds.clear(), this.navigationHistory.length = 0, this.navigationCounter = 0, this.currentNavBase = null, this.currentNavId = null, this.currentBuffer.clear(), this.currentBufferNavId = null;
  }
  observeWebVitalsFallback() {
    this.reportTTFB(), this.safeObserve(
      "largest-contentful-paint",
      (s) => {
        const r = s.getEntries(), i = r[r.length - 1];
        i && this.sendVital({ type: "LCP", value: Number(i.startTime.toFixed(2)) });
      },
      { type: "largest-contentful-paint", buffered: !0 },
      !0
    );
    let e = 0, t = this.getNavigationId();
    this.safeObserve(
      "layout-shift",
      (s) => {
        const r = this.getNavigationId();
        r !== t && (e = 0, t = r);
        const i = s.getEntries();
        for (const o of i) {
          if (o.hadRecentInput === !0)
            continue;
          const c = typeof o.value == "number" ? o.value : 0;
          e += c;
        }
        this.sendVital({ type: "CLS", value: Number(e.toFixed(2)) });
      },
      { type: "layout-shift", buffered: !0 }
    ), this.safeObserve(
      "paint",
      (s) => {
        for (const r of s.getEntries())
          r.name === "first-contentful-paint" && this.sendVital({ type: "FCP", value: Number(r.startTime.toFixed(2)) });
      },
      { type: "paint", buffered: !0 },
      !0
    ), this.safeObserve(
      "event",
      (s) => {
        let r = 0;
        const i = s.getEntries();
        for (const o of i) {
          const c = (o.processingEnd ?? 0) - (o.startTime ?? 0);
          r = Math.max(r, c);
        }
        r > 0 && this.sendVital({ type: "INP", value: Number(r.toFixed(2)) });
      },
      { type: "event", buffered: !0 }
    );
  }
  async initWebVitals() {
    try {
      const { onLCP: e, onCLS: t, onFCP: s, onTTFB: r, onINP: i } = await Promise.resolve().then(() => Tn), o = (c) => (l) => {
        const u = Number(l.value.toFixed(2));
        this.sendVital({ type: c, value: u });
      };
      e(o("LCP"), { reportAllChanges: !1 }), t(o("CLS"), { reportAllChanges: !1 }), s(o("FCP"), { reportAllChanges: !1 }), r(o("TTFB"), { reportAllChanges: !1 }), i(o("INP"), { reportAllChanges: !1 });
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
  /**
   * Buffers a measured metric for the current navigation, ready for
   * consolidation into ONE event. Runs the threshold filter FIRST — a
   * filtered-out sample must never touch navigation-boundary bookkeeping —
   * then, on a genuine navigation-boundary change (a new navId the buffer
   * isn't already tracking), flushes whatever was buffered for the previous
   * navigation before starting a fresh one: SPA route changes never fire
   * `pagehide`, so that's the only chance to ship it.
   *
   * When no navigation id is available (navigation timing unsupported), the
   * sample is still buffered — boundaries just stop being detectable, so the
   * buffer ships on the next lifecycle flush instead. Degraded, never silent.
   */
  sendVital(e) {
    if (!this.shouldSendVital(e.type, e.value))
      return;
    const t = this.getNavigationId();
    if (t) {
      if (!this.seenNavIds.has(t) && (this.seenNavIds.add(t), this.navigationHistory.push(t), this.navigationHistory.length > Zt)) {
        const s = this.navigationHistory.shift();
        s && this.seenNavIds.delete(s);
      }
      t !== this.currentBufferNavId && (this.flushConsolidatedVitals(), this.currentBufferNavId = t);
    }
    this.currentBuffer.set(e.type, e.value);
  }
  /**
   * Consolidates whatever is currently buffered into ONE `WEB_VITALS` event
   * and clears the buffer. No-op when nothing is buffered — safe to call
   * from both lifecycle listeners on every `pagehide`/hidden transition, and
   * from `sendVital` on every navigation-boundary change.
   *
   * @returns `true` when an event was tracked, `false` when the buffer was empty
   */
  flushConsolidatedVitals() {
    if (this.currentBuffer.size === 0)
      return !1;
    const e = Array.from(this.currentBuffer, ([t, s]) => ({ type: t, value: s })).sort(
      (t, s) => t.type.localeCompare(s.type)
    );
    return this.currentBuffer.clear(), this.eventManager.track({
      type: d.WEB_VITALS,
      web_vitals: {
        schema: "consolidated",
        metrics: e
      }
    }), !0;
  }
  /**
   * Flushes the buffer and, when it produced an event, delivers it right away
   * instead of leaving it for the next batch interval — the page is going away.
   *
   * `App` drains on the same transitions, but its listeners run BEFORE this one
   * (see `registerLifecycleListeners`), so by the time the consolidated event is
   * queued that drain has already happened. Draining here is what gets it out.
   *
   * @param canDeliver `false` when the caller must honour `flushOnPageHidden`
   *        being disabled — the event is still queued and ships on the
   *        `pagehide` drain instead.
   */
  flushAndDeliver(e) {
    !this.flushConsolidatedVitals() || !e || this.eventManager.flushImmediatelySync();
  }
  /**
   * Generates a deterministic navigation identifier for deduplication.
   *
   * **Purpose**: Every call within the same navigation must return the SAME id,
   * so the vitals buffer can collapse repeat reports of the same metric type
   * into one buffered value per navigation — critical for the fallback
   * observers, which fire per entry batch.
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
      const e = performance.getEntriesByType("navigation")[0];
      if (!e)
        return null;
      const t = `${e.startTime.toFixed(2)}_${window.location.pathname}`;
      return t === this.currentNavBase && this.currentNavId !== null ? this.currentNavId : (this.currentNavBase = t, this.currentNavId = this.seenNavIds.has(t) ? `${t}_${++this.navigationCounter}` : t, this.currentNavId);
    } catch (e) {
      return a("debug", "Failed to get navigation ID", { error: e }), null;
    }
  }
  isObserverSupported(e) {
    if (typeof PerformanceObserver > "u") return !1;
    const t = PerformanceObserver.supportedEntryTypes;
    return !t || t.includes(e);
  }
  safeObserve(e, t, s, r = !1) {
    try {
      if (!this.isObserverSupported(e))
        return !1;
      const i = new PerformanceObserver((o, c) => {
        try {
          t(o, c);
        } catch (l) {
          a("debug", "Observer callback failed", {
            error: l,
            data: { type: e }
          });
        }
        if (r)
          try {
            c.disconnect();
          } catch {
          }
      });
      return i.observe(s ?? { type: e, buffered: !0 }), r || this.observers.push(i), !0;
    } catch (i) {
      return a("debug", "Failed to create performance observer", {
        error: i,
        data: { type: e }
      }), !1;
    }
  }
  /**
   * `<=`: a value exactly AT the "good" boundary is good, matching web.dev's
   * classification — an LCP of exactly 2500 ms is not "needs improvement".
   *
   * 'all' mode keeps everything not by relying on that comparison but by having
   * no floor at all (`WEB_VITALS_ALL_THRESHOLDS` is `-Infinity`), so the
   * legitimate zeros survive: CLS is exactly `0` on a page that never shifts,
   * and TTFB reads `0` in Mobile Safari when the response is served from cache
   * (see `reportTTFB`'s comment).
   */
  shouldSendVital(e, t) {
    if (typeof t != "number" || !Number.isFinite(t))
      return a("debug", "Invalid web vital value", { data: { type: e, value: t } }), !1;
    const s = this.vitalThresholds[e];
    return !(typeof s == "number" && t <= s);
  }
}
class ne extends T {
  eventManager;
  emitter;
  recentErrors = /* @__PURE__ */ new Map();
  pageviewSignatureCounts = /* @__PURE__ */ new Map();
  errorBurstCounter = 0;
  burstWindowStart = 0;
  burstBackoffUntil = 0;
  pagehideHandler = null;
  pageviewResetListener = null;
  constructor(e, t) {
    super(), this.eventManager = e, this.emitter = t;
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
    window.addEventListener("error", this.handleError), window.addEventListener("unhandledrejection", this.handleRejection), this.pagehideHandler = () => {
      this.resetPageviewCounter();
    }, window.addEventListener("pagehide", this.pagehideHandler, { passive: !0 }), this.emitter && (this.pageviewResetListener = (e) => {
      (e.type === d.SESSION_START || e.type === d.PAGE_VIEW) && this.resetPageviewCounter();
    }, this.emitter.on(V.EVENT, this.pageviewResetListener));
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
    window.removeEventListener("error", this.handleError), window.removeEventListener("unhandledrejection", this.handleRejection), this.pagehideHandler && (window.removeEventListener("pagehide", this.pagehideHandler), this.pagehideHandler = null), this.emitter && this.pageviewResetListener && (this.emitter.off(V.EVENT, this.pageviewResetListener), this.pageviewResetListener = null), this.recentErrors.clear(), this.pageviewSignatureCounts.clear(), this.errorBurstCounter = 0, this.burstWindowStart = 0, this.burstBackoffUntil = 0;
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
    const e = Date.now();
    if (e < this.burstBackoffUntil)
      return !1;
    if (e - this.burstWindowStart > jt && (this.errorBurstCounter = 0, this.burstWindowStart = e), this.errorBurstCounter++, this.errorBurstCounter > Xt)
      return this.burstBackoffUntil = e + Ke, a("debug", "Error burst detected - entering cooldown", {
        data: {
          errorsInWindow: this.errorBurstCounter,
          cooldownMs: Ke
        }
      }), !1;
    const s = this.get("config").errorSampling ?? it;
    return Math.random() < s;
  }
  /**
   * Returns true when the per-pageview signature cap has been hit for this error.
   * Dropped errors do not increment the counter — the 5s suppression window already
   * silences identical repeats, and double-counting here would skew the cap for any
   * later signature that recycles the same map key after a counter reset.
   */
  shouldThrottleBySignature(e) {
    const t = Cs(e), s = this.pageviewSignatureCounts.get(t) ?? 0;
    if (s >= Gt)
      return a("debug", "Error throttled (pageview cap)", {
        data: { signature: t, count: s }
      }), !0;
    const r = s + 1;
    return this.pageviewSignatureCounts.set(t, r), this.pageviewSignatureCounts.size > Wt && (this.pageviewSignatureCounts.clear(), this.pageviewSignatureCounts.set(t, r)), !1;
  }
  handleError = (e) => {
    if (!this.shouldSample())
      return;
    const t = this.sanitizeMessage(e.message, "Unknown error");
    if (this.shouldSuppressError(x.JS_ERROR, t) || this.shouldThrottleBySignature({
      message: t,
      filename: e.filename,
      line: e.lineno,
      // Inline-script errors report the page URL as `filename`; passing the current
      // page URL lets buildErrorSignatureKey collapse them to origin, matching the
      // normalized input the server hashes for cap/dedup. normalizeFilename strips
      // query/hash internally.
      page_url: window.location.href
    }))
      return;
    const s = typeof e.error?.stack == "string" ? this.truncateStack(e.error.stack) : void 0, r = typeof e.error?.name == "string" && e.error.name !== "Error" ? e.error.name : void 0;
    this.eventManager.track({
      type: d.ERROR,
      error_data: {
        type: x.JS_ERROR,
        message: t,
        ...r !== void 0 && { name: r },
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
    const t = this.extractRejectionMessage(e.reason), s = this.sanitizeMessage(t, "Unknown rejection");
    if (this.shouldSuppressError(x.PROMISE_REJECTION, s) || this.shouldThrottleBySignature({ message: s }))
      return;
    const r = e.reason instanceof Error && typeof e.reason.stack == "string" ? this.truncateStack(e.reason.stack) : void 0, i = e.reason instanceof Error && e.reason.name !== "Error" ? e.reason.name : void 0;
    this.eventManager.track({
      type: d.ERROR,
      error_data: {
        type: x.PROMISE_REJECTION,
        message: s,
        ...i !== void 0 && { name: i },
        ...r !== void 0 && { stack: r }
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
    return U(t);
  }
  /**
   * Sanitizes an error message and guarantees a non-empty result.
   *
   * An empty `error_data.message` (from a `Promise.reject('')`, `new Error('')`,
   * or `{ message: '' }` reason — all of which stringify to '') is rejected by
   * the ingestion DTO, which 400s the whole batch and drops the co-traveling
   * events. Every error path must fall back to a non-empty placeholder.
   */
  sanitizeMessage(e, t) {
    return this.sanitize(e) || t;
  }
  shouldSuppressError(e, t) {
    const s = Date.now(), r = `${e}:${t}`, i = this.recentErrors.get(r);
    return i !== void 0 && s - i < We ? (this.recentErrors.set(r, s), !0) : (this.recentErrors.set(r, s), this.recentErrors.size > $t ? (this.recentErrors.clear(), this.recentErrors.set(r, s), !1) : (this.recentErrors.size > q && this.pruneOldErrors(), !1));
  }
  static TRUNCATION_SUFFIX = `
...truncated`;
  truncateStack(e) {
    if (e.length <= Ge) return U(e);
    const t = Ge - ne.TRUNCATION_SUFFIX.length, s = e.slice(0, t) + ne.TRUNCATION_SUFFIX;
    return U(s);
  }
  pruneOldErrors() {
    const e = Date.now();
    for (const [r, i] of this.recentErrors.entries())
      e - i > We && this.recentErrors.delete(r);
    if (this.recentErrors.size <= q)
      return;
    const t = Array.from(this.recentErrors.entries()).sort((r, i) => r[1] - i[1]), s = this.recentErrors.size - q;
    for (let r = 0; r < s; r += 1) {
      const i = t[r];
      i && this.recentErrors.delete(i[0]);
    }
  }
}
class zs extends T {
  isInitialized = !1;
  suppressNextScrollTimer = null;
  pageUnloadHandler = null;
  pageShowHandler = null;
  visibilityFlushHandler = null;
  prerenderActivationHandler = null;
  emitter = new _s();
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
  async init(e = {}) {
    if (this.isInitialized)
      return { sessionId: this.get("sessionId") ?? "" };
    this.managers.storage = new Ws();
    try {
      return this.setupState(e), this.managers.event = new Ds(this.managers.storage, this.emitter), this.loadPersistedIdentity(), this.initializeHandlers(), this.setupPageLifecycleListeners(), await this.managers.event.recoverPersistedEvents().catch((t) => {
        a("warn", "Failed to recover persisted events", { error: t });
      }), this.isInitialized = !0, { sessionId: this.get("sessionId") ?? "" };
    } catch (t) {
      this.destroy(!0);
      const s = t instanceof Error ? t.message : String(t);
      throw new Error(`[TraceLog] TraceLog initialization failed: ${s}`, { cause: t });
    }
  }
  /**
   * Sends a custom event with optional metadata and options.
   *
   * @internal Called from api.event()
   */
  sendCustomEvent(e, t, s) {
    if (!this.managers.event) {
      a("warn", "Cannot send custom event: TraceLog not initialized", { data: { name: e } });
      return;
    }
    let r = t;
    t && typeof t == "object" && !Array.isArray(t) && Object.getPrototypeOf(t) !== Object.prototype && (r = Object.assign({}, t));
    const { valid: i, error: o, sanitizedMetadata: c } = Ts(e, r);
    if (!i) {
      if (this.get("mode") === te.QA)
        throw new Error(`[TraceLog] Custom event "${e}" validation failed: ${o}`);
      a("warn", `Custom event "${e}" dropped: ${o}`);
      return;
    }
    this.managers.event.track({
      type: d.CUSTOM,
      custom_event: {
        name: e,
        ...c && { metadata: c }
      }
    }), s?.critical === !0 && (this.managers.event.flushImmediatelySync() || a("debug", "Critical event flush returned false (deferred to in-flight send or empty queue)", {
      data: { name: e }
    }));
  }
  on(e, t) {
    this.emitter.on(e, t);
  }
  off(e, t) {
    this.emitter.off(e, t);
  }
  /**
   * Destroys the TraceLog instance and cleans up all resources.
   *
   * @internal Called from api.destroy()
   */
  destroy(e = !1) {
    !this.isInitialized && !e || (Object.values(this.handlers).filter(Boolean).forEach((t) => {
      try {
        t.stopTracking();
      } catch (s) {
        a("warn", "Failed to stop tracking", { error: s });
      }
    }), this.suppressNextScrollTimer && (clearTimeout(this.suppressNextScrollTimer), this.suppressNextScrollTimer = null), this.pageUnloadHandler && (window.removeEventListener("pagehide", this.pageUnloadHandler), window.removeEventListener("beforeunload", this.pageUnloadHandler), this.pageUnloadHandler = null), this.pageShowHandler && (window.removeEventListener("pageshow", this.pageShowHandler), this.pageShowHandler = null), this.visibilityFlushHandler && (document.removeEventListener("visibilitychange", this.visibilityFlushHandler), this.visibilityFlushHandler = null), this.prerenderActivationHandler && (document.removeEventListener("prerenderingchange", this.prerenderActivationHandler), this.prerenderActivationHandler = null), this.managers.event?.flushImmediatelySync(), this.managers.event?.stop(), this.emitter.removeAllListeners(), this.set("suppressNextScroll", !1), this.set("sessionId", null), this.set("identity", void 0), this.clearPersistedIdentity(), this.integrationInstances.shopifyCartLinker?.deactivate(), this.integrationInstances = {}, this.isInitialized = !1, this.handlers = {}, this.managers = {});
  }
  setupState(e = {}) {
    this.set("config", e);
    const t = Us.getId(this.managers.storage);
    this.set("userId", t);
    const s = cs(e);
    this.set("collectApiUrls", s);
    const r = Bt();
    this.set("device", r);
    const i = D(window.location.href, e.sensitiveQueryParams);
    this.set("pageUrl", i), rs() && this.set("mode", te.QA);
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
    const s = e.trim(), r = Ae(t), i = {
      userId: s,
      ...r ? { traits: r } : {}
    };
    this.set("identity", i), this.persistIdentity(i), a("debug", "Visitor identified", {
      data: { userIdLength: s.length, traitKeys: r ? Object.keys(r) : [] }
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
    await this.managers.event?.flushImmediately().catch((t) => (a("debug", "Failed to flush before identity reset", { error: t }), !1)), this.set("identity", void 0), this.clearPersistedIdentity();
    const e = at();
    this.managers.storage.setItem(Ee, e), this.set("userId", e), this.set("hasStartSession", !1), this.set("sessionId", null), this.handlers.session?.stopTracking(), this.handlers.session?.startTracking(), a("debug", "Identity reset, new UUID generated");
  }
  /**
   * Returns the project ID used for identity storage scoping.
   */
  getProjectId() {
    return this.get("config")?.integrations?.tracelog?.projectId ?? "custom";
  }
  /**
   * Persists identity to localStorage under the project-scoped key.
   */
  persistIdentity(e) {
    try {
      const t = this.getProjectId(), s = de(t);
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
    const e = this.managers.storage, t = this.getProjectId(), s = de(t);
    try {
      const r = e.getItem(P);
      if (r) {
        const i = JSON.parse(r);
        if (e.removeItem(P), !this.isValidIdentityData(i)) {
          a("debug", "Invalid pending identity in localStorage, discarded");
          return;
        }
        const o = this.normalizePersistedIdentity(i);
        e.setItem(s, JSON.stringify(o)), this.set("identity", o), a("debug", "Migrated pending identity to project-scoped key");
        return;
      }
    } catch {
      e.removeItem(P);
    }
    try {
      const r = e.getItem(s);
      if (r) {
        const i = JSON.parse(r);
        if (!this.isValidIdentityData(i)) {
          e.removeItem(s), a("debug", "Invalid persisted identity in localStorage, discarded");
          return;
        }
        const o = this.normalizePersistedIdentity(i);
        this.set("identity", o), a("debug", "Loaded persisted identity");
      }
    } catch {
      a("debug", "Failed to load persisted identity");
    }
  }
  /**
   * Validates identity data loaded from localStorage. `traits` is intentionally
   * accepted as `unknown` here: `normalizePersistedIdentity()` runs it through
   * `sanitizeTraits()` so tampered values are dropped silently instead of
   * rejecting an otherwise-valid identity.
   */
  isValidIdentityData(e) {
    if (!e || typeof e != "object") return !1;
    const { userId: t } = e;
    return !(typeof t != "string" || t.trim().length === 0 || t.trim().length > 256);
  }
  /**
   * Trims the `userId` and re-sanitizes `traits` through the same gate
   * `identify()` uses at call time, defending later batches against tampered
   * localStorage values.
   */
  normalizePersistedIdentity(e) {
    const t = Ae(e.traits);
    return {
      userId: e.userId.trim(),
      ...t ? { traits: t } : {}
    };
  }
  /**
   * Clears persisted identity from localStorage.
   */
  clearPersistedIdentity() {
    try {
      const e = this.managers.storage, t = this.getProjectId();
      e.removeItem(de(t)), e.removeItem(P);
    } catch {
      a("debug", "Failed to clear persisted identity");
    }
  }
  setupPageLifecycleListeners() {
    this.pageUnloadHandler = () => {
      this.managers.event?.flushImmediatelySync();
    }, this.pageShowHandler = (e) => {
      e.persisted && this.managers.event?.recoverPersistedEvents().catch((t) => {
        a("warn", "Failed to recover persisted events on bfcache restore", { error: t });
      });
    }, this.visibilityFlushHandler = () => {
      typeof document > "u" || !document.hidden || this.get("config").flushOnPageHidden !== !1 && this.managers.event?.flushImmediatelySync();
    }, window.addEventListener("pagehide", this.pageUnloadHandler), window.addEventListener("beforeunload", this.pageUnloadHandler), window.addEventListener("pageshow", this.pageShowHandler), document.addEventListener("visibilitychange", this.visibilityFlushHandler);
  }
  initializeHandlers() {
    const e = this.get("config");
    this.handlers.session = new Hs(
      this.managers.storage,
      this.managers.event
    ), this.handlers.session.startTracking();
    const t = () => {
      this.set("suppressNextScroll", !0), this.suppressNextScrollTimer && clearTimeout(this.suppressNextScrollTimer), this.suppressNextScrollTimer = window.setTimeout(() => {
        this.set("suppressNextScroll", !1);
      }, 500);
    };
    this.handlers.pageView = new xs(this.managers.event, t), this.handlers.click = new Bs(this.managers.event), this.handlers.scroll = new $s(this.managers.event), this.handlers.performance = new Ks(this.managers.event), this.handlers.error = new ne(this.managers.event, this.emitter);
    const s = () => {
      if (this.handlers.pageView?.startTracking(), this.handlers.click?.startTracking(), this.handlers.scroll?.startTracking(), this.handlers.performance?.startTracking().catch((r) => {
        a("warn", "Failed to start performance tracking", { error: r });
      }), this.handlers.error?.startTracking(), e.integrations?.tracelog?.shopify) {
        const r = new Gs();
        r.activate(), this.integrationInstances.shopifyCartLinker = r, this.emitter.on(V.EVENT, (i) => {
          i.type === d.SESSION_START && r.onSessionChange();
        });
      }
    };
    ot() ? (this.prerenderActivationHandler = () => {
      this.prerenderActivationHandler = null, s();
    }, document.addEventListener("prerenderingchange", this.prerenderActivationHandler, { once: !0 })) : s();
  }
}
const R = [];
let f = null, F = !1, A = !1, N = null;
const Qs = async (n) => typeof window > "u" || typeof document > "u" ? { sessionId: "" } : (A = !1, window.__traceLogDisabled === !0 ? { sessionId: "" } : f ? { sessionId: f.getSessionId() ?? "" } : (F && N || (F = !0, N = (async () => {
  try {
    const e = ps(n ?? {}), t = new zs();
    try {
      R.forEach(({ event: o, callback: c }) => {
        t.on(o, c);
      }), R.length = 0;
      const s = t.init(e), r = new Promise((o, c) => {
        setTimeout(() => {
          c(new Error("[TraceLog] Initialization timeout after 10000ms"));
        }, 1e4);
      }), i = await Promise.race([s, r]);
      return f = t, i;
    } catch (s) {
      try {
        t.destroy(!0);
      } catch (r) {
        a("error", "Failed to cleanup partially initialized app", { error: r });
      }
      throw s;
    }
  } catch (e) {
    throw f = null, e;
  } finally {
    F = !1, N = null;
  }
})()), N)), Ys = (n, e, t) => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!f)
      throw new Error("[TraceLog] TraceLog not initialized. Please call init() first.");
    if (A)
      throw new Error("[TraceLog] Cannot send events while TraceLog is being destroyed");
    f.sendCustomEvent(n, e, t);
  }
}, qs = (n, e) => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!f || F) {
      R.push({ event: n, callback: e });
      return;
    }
    f.on(n, e);
  }
}, Js = (n, e) => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!f) {
      const t = R.findIndex((s) => s.event === n && s.callback === e);
      t !== -1 && R.splice(t, 1);
      return;
    }
    f.off(n, e);
  }
}, Zs = () => typeof window > "u" || typeof document > "u" ? !1 : f !== null, en = () => typeof window > "u" || typeof document > "u" || !f ? null : f.getSessionId(), tn = () => typeof window > "u" || typeof document > "u" || !f ? null : f.getUserId(), sn = () => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (A)
      throw new Error("[TraceLog] Destroy operation already in progress");
    if (!f) {
      A = !1;
      return;
    }
    A = !0;
    try {
      f.destroy(), f = null, F = !1, N = null, R.length = 0, A = !1;
    } catch (n) {
      f = null, F = !1, N = null, R.length = 0, A = !1, a("warn", "Error during destroy, forced cleanup completed", { error: n });
    }
  }
}, nn = (n, e) => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!n || typeof n != "string" || n.trim().length === 0) {
      a("warn", "identify() called with invalid userId");
      return;
    }
    if (n.trim().length > 256) {
      a("warn", "identify() userId exceeds 256 characters");
      return;
    }
    if (A) {
      a("warn", "Cannot identify while TraceLog is being destroyed");
      return;
    }
    if (f) {
      f.identify(n, e);
      return;
    }
    try {
      const t = Ae(e), s = {
        userId: n.trim(),
        ...t ? { traits: t } : {}
      };
      localStorage.setItem(P, JSON.stringify(s)), a("debug", "Identity persisted pre-init (will be applied on init)");
    } catch {
      a("debug", "Failed to persist pre-init identity");
    }
  }
}, rn = async () => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!f) {
      try {
        localStorage.removeItem(P);
      } catch {
      }
      return;
    }
    if (A)
      throw new Error("[TraceLog] Cannot reset identity while TraceLog is being destroyed");
    await f.resetIdentity();
  }
}, On = {
  init: Qs,
  event: Ys,
  on: qs,
  off: Js,
  isInitialized: Zs,
  getSessionId: en,
  getUserId: tn,
  destroy: sn,
  identify: nn,
  resetIdentity: rn
};
var Le, b, $, ct, re, lt = -1, O = function(n) {
  addEventListener("pageshow", (function(e) {
    e.persisted && (lt = e.timeStamp, n(e));
  }), !0);
}, Pe = function() {
  var n = self.performance && performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
  if (n && n.responseStart > 0 && n.responseStart < performance.now()) return n;
}, oe = function() {
  var n = Pe();
  return n && n.activationStart || 0;
}, E = function(n, e) {
  var t = Pe(), s = "navigate";
  return lt >= 0 ? s = "back-forward-cache" : t && (document.prerendering || oe() > 0 ? s = "prerender" : document.wasDiscarded ? s = "restore" : t.type && (s = t.type.replace(/_/g, "-"))), { name: n, value: e === void 0 ? -1 : e, rating: "good", delta: 0, entries: [], id: "v4-".concat(Date.now(), "-").concat(Math.floor(8999999999999 * Math.random()) + 1e12), navigationType: s };
}, H = function(n, e, t) {
  try {
    if (PerformanceObserver.supportedEntryTypes.includes(n)) {
      var s = new PerformanceObserver((function(r) {
        Promise.resolve().then((function() {
          e(r.getEntries());
        }));
      }));
      return s.observe(Object.assign({ type: n, buffered: !0 }, t || {})), s;
    }
  } catch {
  }
}, v = function(n, e, t, s) {
  var r, i;
  return function(o) {
    e.value >= 0 && (o || s) && ((i = e.value - (r || 0)) || r === void 0) && (r = e.value, e.delta = i, e.rating = (function(c, l) {
      return c > l[1] ? "poor" : c > l[0] ? "needs-improvement" : "good";
    })(e.value, t), n(e));
  };
}, ke = function(n) {
  requestAnimationFrame((function() {
    return requestAnimationFrame((function() {
      return n();
    }));
  }));
}, X = function(n) {
  document.addEventListener("visibilitychange", (function() {
    document.visibilityState === "hidden" && n();
  }));
}, ae = function(n) {
  var e = !1;
  return function() {
    e || (n(), e = !0);
  };
}, k = -1, et = function() {
  return document.visibilityState !== "hidden" || document.prerendering ? 1 / 0 : 0;
}, ie = function(n) {
  document.visibilityState === "hidden" && k > -1 && (k = n.type === "visibilitychange" ? n.timeStamp : 0, on());
}, tt = function() {
  addEventListener("visibilitychange", ie, !0), addEventListener("prerenderingchange", ie, !0);
}, on = function() {
  removeEventListener("visibilitychange", ie, !0), removeEventListener("prerenderingchange", ie, !0);
}, De = function() {
  return k < 0 && (k = et(), tt(), O((function() {
    setTimeout((function() {
      k = et(), tt();
    }), 0);
  }))), { get firstHiddenTime() {
    return k;
  } };
}, G = function(n) {
  document.prerendering ? addEventListener("prerenderingchange", (function() {
    return n();
  }), !0) : n();
}, be = [1800, 3e3], ut = function(n, e) {
  e = e || {}, G((function() {
    var t, s = De(), r = E("FCP"), i = H("paint", (function(o) {
      o.forEach((function(c) {
        c.name === "first-contentful-paint" && (i.disconnect(), c.startTime < s.firstHiddenTime && (r.value = Math.max(c.startTime - oe(), 0), r.entries.push(c), t(!0)));
      }));
    }));
    i && (t = v(n, r, be, e.reportAllChanges), O((function(o) {
      r = E("FCP"), t = v(n, r, be, e.reportAllChanges), ke((function() {
        r.value = performance.now() - o.timeStamp, t(!0);
      }));
    })));
  }));
}, Me = [0.1, 0.25], an = function(n, e) {
  e = e || {}, ut(ae((function() {
    var t, s = E("CLS", 0), r = 0, i = [], o = function(l) {
      l.forEach((function(u) {
        if (!u.hadRecentInput) {
          var h = i[0], p = i[i.length - 1];
          r && u.startTime - p.startTime < 1e3 && u.startTime - h.startTime < 5e3 ? (r += u.value, i.push(u)) : (r = u.value, i = [u]);
        }
      })), r > s.value && (s.value = r, s.entries = i, t());
    }, c = H("layout-shift", o);
    c && (t = v(n, s, Me, e.reportAllChanges), X((function() {
      o(c.takeRecords()), t(!0);
    })), O((function() {
      r = 0, s = E("CLS", 0), t = v(n, s, Me, e.reportAllChanges), ke((function() {
        return t();
      }));
    })), setTimeout(t, 0));
  })));
}, dt = 0, pe = 1 / 0, Q = 0, cn = function(n) {
  n.forEach((function(e) {
    e.interactionId && (pe = Math.min(pe, e.interactionId), Q = Math.max(Q, e.interactionId), dt = Q ? (Q - pe) / 7 + 1 : 0);
  }));
}, ht = function() {
  return Le ? dt : performance.interactionCount || 0;
}, ln = function() {
  "interactionCount" in performance || Le || (Le = H("event", cn, { type: "event", buffered: !0, durationThreshold: 0 }));
}, I = [], J = /* @__PURE__ */ new Map(), ft = 0, un = function() {
  var n = Math.min(I.length - 1, Math.floor((ht() - ft) / 50));
  return I[n];
}, dn = [], hn = function(n) {
  if (dn.forEach((function(r) {
    return r(n);
  })), n.interactionId || n.entryType === "first-input") {
    var e = I[I.length - 1], t = J.get(n.interactionId);
    if (t || I.length < 10 || n.duration > e.latency) {
      if (t) n.duration > t.latency ? (t.entries = [n], t.latency = n.duration) : n.duration === t.latency && n.startTime === t.entries[0].startTime && t.entries.push(n);
      else {
        var s = { id: n.interactionId, latency: n.duration, entries: [n] };
        J.set(s.id, s), I.push(s);
      }
      I.sort((function(r, i) {
        return i.latency - r.latency;
      })), I.length > 10 && I.splice(10).forEach((function(r) {
        return J.delete(r.id);
      }));
    }
  }
}, gt = function(n) {
  var e = self.requestIdleCallback || self.setTimeout, t = -1;
  return n = ae(n), document.visibilityState === "hidden" ? n() : (t = e(n), X(n)), t;
}, Ce = [200, 500], fn = function(n, e) {
  "PerformanceEventTiming" in self && "interactionId" in PerformanceEventTiming.prototype && (e = e || {}, G((function() {
    var t;
    ln();
    var s, r = E("INP"), i = function(c) {
      gt((function() {
        c.forEach(hn);
        var l = un();
        l && l.latency !== r.value && (r.value = l.latency, r.entries = l.entries, s());
      }));
    }, o = H("event", i, { durationThreshold: (t = e.durationThreshold) !== null && t !== void 0 ? t : 40 });
    s = v(n, r, Ce, e.reportAllChanges), o && (o.observe({ type: "first-input", buffered: !0 }), X((function() {
      i(o.takeRecords()), s(!0);
    })), O((function() {
      ft = ht(), I.length = 0, J.clear(), r = E("INP"), s = v(n, r, Ce, e.reportAllChanges);
    })));
  })));
}, Ne = [2500, 4e3], Se = {}, gn = function(n, e) {
  e = e || {}, G((function() {
    var t, s = De(), r = E("LCP"), i = function(l) {
      e.reportAllChanges || (l = l.slice(-1)), l.forEach((function(u) {
        u.startTime < s.firstHiddenTime && (r.value = Math.max(u.startTime - oe(), 0), r.entries = [u], t());
      }));
    }, o = H("largest-contentful-paint", i);
    if (o) {
      t = v(n, r, Ne, e.reportAllChanges);
      var c = ae((function() {
        Se[r.id] || (i(o.takeRecords()), o.disconnect(), Se[r.id] = !0, t(!0));
      }));
      ["keydown", "click"].forEach((function(l) {
        addEventListener(l, (function() {
          return gt(c);
        }), { once: !0, capture: !0 });
      })), X(c), O((function(l) {
        r = E("LCP"), t = v(n, r, Ne, e.reportAllChanges), ke((function() {
          r.value = performance.now() - l.timeStamp, Se[r.id] = !0, t(!0);
        }));
      }));
    }
  }));
}, Re = [800, 1800], mn = function n(e) {
  document.prerendering ? G((function() {
    return n(e);
  })) : document.readyState !== "complete" ? addEventListener("load", (function() {
    return n(e);
  }), !0) : setTimeout(e, 0);
}, pn = function(n, e) {
  e = e || {};
  var t = E("TTFB"), s = v(n, t, Re, e.reportAllChanges);
  mn((function() {
    var r = Pe();
    r && (t.value = Math.max(r.responseStart - oe(), 0), t.entries = [r], s(!0), O((function() {
      t = E("TTFB", 0), (s = v(n, t, Re, e.reportAllChanges))(!0);
    })));
  }));
}, B = { passive: !0, capture: !0 }, Sn = /* @__PURE__ */ new Date(), st = function(n, e) {
  b || (b = e, $ = n, ct = /* @__PURE__ */ new Date(), pt(removeEventListener), mt());
}, mt = function() {
  if ($ >= 0 && $ < ct - Sn) {
    var n = { entryType: "first-input", name: b.type, target: b.target, cancelable: b.cancelable, startTime: b.timeStamp, processingStart: b.timeStamp + $ };
    re.forEach((function(e) {
      e(n);
    })), re = [];
  }
}, En = function(n) {
  if (n.cancelable) {
    var e = (n.timeStamp > 1e12 ? /* @__PURE__ */ new Date() : performance.now()) - n.timeStamp;
    n.type == "pointerdown" ? (function(t, s) {
      var r = function() {
        st(t, s), o();
      }, i = function() {
        o();
      }, o = function() {
        removeEventListener("pointerup", r, B), removeEventListener("pointercancel", i, B);
      };
      addEventListener("pointerup", r, B), addEventListener("pointercancel", i, B);
    })(e, n) : st(e, n);
  }
}, pt = function(n) {
  ["mousedown", "keydown", "touchstart", "pointerdown"].forEach((function(e) {
    return n(e, En, B);
  }));
}, Oe = [100, 300], vn = function(n, e) {
  e = e || {}, G((function() {
    var t, s = De(), r = E("FID"), i = function(l) {
      l.startTime < s.firstHiddenTime && (r.value = l.processingStart - l.startTime, r.entries.push(l), t(!0));
    }, o = function(l) {
      l.forEach(i);
    }, c = H("first-input", o);
    t = v(n, r, Oe, e.reportAllChanges), c && (X(ae((function() {
      o(c.takeRecords()), c.disconnect();
    }))), O((function() {
      var l;
      r = E("FID"), t = v(n, r, Oe, e.reportAllChanges), re = [], $ = -1, b = null, pt(addEventListener), l = i, re.push(l), mt();
    })));
  }));
};
const Tn = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  CLSThresholds: Me,
  FCPThresholds: be,
  FIDThresholds: Oe,
  INPThresholds: Ce,
  LCPThresholds: Ne,
  TTFBThresholds: Re,
  onCLS: an,
  onFCP: ut,
  onFID: vn,
  onINP: fn,
  onLCP: gn,
  onTTFB: pn
}, Symbol.toStringTag, { value: "Module" }));
export {
  m as AppConfigValidationError,
  _n as DEFAULT_SESSION_TIMEOUT,
  ye as DEFAULT_WEB_VITALS_MODE,
  w as DeviceType,
  V as EmitterEvent,
  x as ErrorType,
  d as EventType,
  Nn as InitializationTimeoutError,
  je as IntegrationValidationError,
  Cn as MAX_ARRAY_LENGTH,
  An as MAX_CUSTOM_EVENT_ARRAY_SIZE,
  wn as MAX_CUSTOM_EVENT_KEYS,
  yn as MAX_CUSTOM_EVENT_NAME_LENGTH,
  In as MAX_CUSTOM_EVENT_STRING_SIZE,
  Ln as MAX_NESTED_OBJECT_KEYS,
  bn as MAX_STRING_LENGTH,
  Mn as MAX_STRING_LENGTH_IN_ARRAY,
  te as Mode,
  fs as PII_PATTERNS,
  C as PermanentError,
  Z as RateLimitError,
  $e as SamplingRateValidationError,
  ve as ScrollDirection,
  Lt as SessionTimeoutValidationError,
  M as SpecialApiUrl,
  ee as TimeoutError,
  j as TraceLogValidationError,
  Rn as WEB_VITALS_GOOD_THRESHOLDS,
  qt as WEB_VITALS_NEEDS_IMPROVEMENT_THRESHOLDS,
  Jt as WEB_VITALS_POOR_THRESHOLDS,
  Qe as getWebVitalsThresholds,
  On as tracelog
};
