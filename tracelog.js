const ln = 9e5;
const cn = 120, un = 49152, dn = 100, hn = 500, fn = 200;
const gn = 1e3, mn = 500, pn = 1e3;
const b = "data-tlog", pt = [
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
], St = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"], Et = [
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
}, vt = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<embed\b[^>]*>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi
], g = "tlog", z = `${g}:qa_mode`, pe = `${g}:uid`, tt = "tlog_mode", ke = "qa", Ue = "qa_off", le = (n) => n ? `${g}:${n}:queue` : `${g}:queue`, ce = (n) => n ? `${g}:${n}:rate_limit` : `${g}:rate_limit`, Tt = (n) => n ? `${g}:${n}:session` : `${g}:session`, _t = (n) => n ? `${g}:${n}:broadcast` : `${g}:broadcast`, Fe = (n, e) => `${g}:${n}:session_counts:${e}`, Ve = 10080 * 60 * 1e3, He = `${g}:session_counts_last_cleanup`, xe = 3600 * 1e3, ue = (n) => n ? `${g}:${n}:identity` : `${g}:identity`, O = `${g}:pending_identity`;
var F = /* @__PURE__ */ ((n) => (n.Localhost = "localhost:8080", n.Fail = "localhost:9999", n))(F || {}), w = /* @__PURE__ */ ((n) => (n.Mobile = "mobile", n.Tablet = "tablet", n.Desktop = "desktop", n.Unknown = "unknown", n))(w || {}), k = /* @__PURE__ */ ((n) => (n.EVENT = "event", n.QUEUE = "queue", n))(k || {});
class M extends Error {
  constructor(e, t, s) {
    super(e), this.statusCode = t, this.responseCode = s, this.name = "PermanentError", Error.captureStackTrace && Error.captureStackTrace(this, M);
  }
  statusCode;
  responseCode;
}
class J extends Error {
  constructor(e) {
    super(e), this.name = "RateLimitError", Error.captureStackTrace && Error.captureStackTrace(this, J);
  }
}
class Z extends Error {
  constructor(e) {
    super(e), this.name = "TimeoutError", Error.captureStackTrace && Error.captureStackTrace(this, Z);
  }
}
var d = /* @__PURE__ */ ((n) => (n.PAGE_VIEW = "page_view", n.CLICK = "click", n.SCROLL = "scroll", n.SESSION_START = "session_start", n.CUSTOM = "custom", n.WEB_VITALS = "web_vitals", n.ERROR = "error", n))(d || {}), Se = /* @__PURE__ */ ((n) => (n.UP = "up", n.DOWN = "down", n))(Se || {}), V = /* @__PURE__ */ ((n) => (n.JS_ERROR = "js_error", n.PROMISE_REJECTION = "promise_rejection", n))(V || {}), ee = /* @__PURE__ */ ((n) => (n.QA = "qa", n))(ee || {});
class $ extends Error {
  constructor(e, t, s) {
    super(e), this.errorCode = t, this.layer = s, this.name = this.constructor.name, Error.captureStackTrace && Error.captureStackTrace(this, this.constructor);
  }
  errorCode;
  layer;
}
class m extends $ {
  constructor(e, t = "config") {
    super(e, "APP_CONFIG_INVALID", t);
  }
}
class yt extends $ {
  constructor(e, t = "config") {
    super(e, "SESSION_TIMEOUT_INVALID", t);
  }
}
class $e extends $ {
  constructor(e, t = "config") {
    super(e, "SAMPLING_RATE_INVALID", t);
  }
}
class Be extends $ {
  constructor(e, t = "config") {
    super(e, "INTEGRATION_INVALID", t);
  }
}
class Sn extends $ {
  constructor(e, t, s = "runtime") {
    super(e, "INITIALIZATION_TIMEOUT", s), this.timeoutMs = t;
  }
  timeoutMs;
}
const It = "background: #ff9800; color: white; font-weight: bold; padding: 2px 8px; border-radius: 3px;", wt = "background: #9e9e9e; color: white; font-weight: bold; padding: 2px 8px; border-radius: 3px;", At = "background: #d32f2f; color: white; font-weight: bold; padding: 2px 8px; border-radius: 3px;", bt = (n, e) => {
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
}, Lt = () => {
  if (typeof window > "u" || typeof sessionStorage > "u")
    return !1;
  try {
    return sessionStorage.getItem(z) === "true";
  } catch {
    return !1;
  }
}, a = (n, e, t) => {
  const { error: s, data: r, showToClient: i = !1, style: o, visibility: l } = t ?? {}, c = s ? bt(e, s) : `[TraceLog] ${e}`, u = n === "error" ? "error" : n === "warn" ? "warn" : "log";
  if (!Mt(l, i))
    return;
  const p = Rt(l, o), S = r !== void 0 ? Ee(r) : void 0;
  Ct(u, c, p, S);
}, Mt = (n, e) => n === "critical" ? !0 : n === "qa" || e ? Lt() : !1, Rt = (n, e) => e !== void 0 && e !== "" ? e : n === "critical" ? At : "", Ct = (n, e, t, s) => {
  const r = t !== void 0 && t !== "", i = r ? `%c${e}` : e;
  s !== void 0 ? r ? console[n](i, t, s) : console[n](i, s) : r ? console[n](i, t) : console[n](i);
}, Ee = (n) => {
  const e = {}, t = ["token", "password", "secret", "key", "apikey", "api_key", "sessionid", "session_id"];
  for (const [s, r] of Object.entries(n)) {
    const i = s.toLowerCase();
    if (t.some((o) => i.includes(o))) {
      e[s] = "[REDACTED]";
      continue;
    }
    r !== null && typeof r == "object" && !Array.isArray(r) ? e[s] = Ee(r) : Array.isArray(r) ? e[s] = r.map(
      (o) => o !== null && typeof o == "object" && !Array.isArray(o) ? Ee(o) : o
    ) : e[s] = r;
  }
  return e;
};
let ve, st;
const Nt = () => {
  typeof window < "u" && !ve && (ve = window.matchMedia("(pointer: coarse)"), st = window.matchMedia("(hover: none)"));
}, te = "Unknown", Ot = (n) => {
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
  return /Windows/i.test(t) ? "Windows" : /iPhone|iPad|iPod/i.test(t) ? "iOS" : /Mac OS X|Macintosh/i.test(t) ? "macOS" : /Android/i.test(t) ? "Android" : /CrOS/i.test(t) ? "ChromeOS" : /Linux/i.test(t) ? "Linux" : te;
}, Pt = (n) => {
  const e = n.userAgentData?.brands;
  if (e != null && e.length > 0) {
    const r = e.filter((i) => !/not.?a.?brand|chromium/i.test(i.brand))[0];
    if (r != null) {
      const i = r.brand;
      return /google chrome/i.test(i) ? "Chrome" : /microsoft edge/i.test(i) ? "Edge" : /opera/i.test(i) ? "Opera" : i;
    }
  }
  const t = navigator.userAgent;
  return /Edg\//i.test(t) ? "Edge" : /OPR\//i.test(t) ? "Opera" : /Chrome/i.test(t) ? "Chrome" : /Firefox/i.test(t) ? "Firefox" : /Safari/i.test(t) && !/Chrome/i.test(t) ? "Safari" : te;
}, Dt = () => {
  try {
    const n = navigator;
    if (n.userAgentData != null && typeof n.userAgentData.mobile == "boolean") {
      const c = n.userAgentData.platform;
      return c != null && c !== "" && /ipad|tablet/i.test(c) ? w.Tablet : n.userAgentData.mobile ? w.Mobile : w.Desktop;
    }
    Nt();
    const e = window.innerWidth, t = ve?.matches ?? !1, s = st?.matches ?? !1, r = "ontouchstart" in window || navigator.maxTouchPoints > 0, i = navigator.userAgent.toLowerCase(), o = /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/.test(i), l = /tablet|ipad|android(?!.*mobile)/.test(i);
    return e <= 767 || o && r ? w.Mobile : e >= 768 && e <= 1024 || l || t && s && r ? w.Tablet : w.Desktop;
  } catch (n) {
    return a("debug", "Device detection failed, defaulting to desktop", { error: n }), w.Desktop;
  }
}, kt = () => {
  try {
    const n = navigator;
    return {
      type: Dt(),
      os: Ot(n),
      browser: Pt(n)
    };
  } catch (n) {
    return a("debug", "Device info detection failed, using defaults", { error: n }), {
      type: w.Desktop,
      os: te,
      browser: te
    };
  }
}, Xe = 500, Ge = 2e3, We = 5e3, Q = 50, Ut = Q * 2, nt = 1, Ft = 1e3, Vt = 10, je = 5e3, Ht = 3, xt = 200, $t = 6e4, Bt = 64, En = {
  LCP: 2500,
  FCP: 1800,
  CLS: 0.1,
  INP: 200,
  TTFB: 800
}, Ke = {
  LCP: 2500,
  FCP: 1800,
  CLS: 0.1,
  INP: 200,
  TTFB: 800
}, Xt = {
  LCP: 4e3,
  FCP: 3e3,
  CLS: 0.25,
  INP: 500,
  TTFB: 1800
}, Te = "needs-improvement", ze = (n = Te) => {
  switch (n) {
    case "all":
      return { LCP: 0, FCP: 0, CLS: 0, INP: 0, TTFB: 0 };
    case "needs-improvement":
      return Ke;
    case "poor":
      return Xt;
    default:
      return Ke;
  }
}, Gt = 50, Wt = "2.10.0", jt = Wt, Kt = () => typeof window < "u" && typeof sessionStorage < "u", zt = () => {
  try {
    const n = new URLSearchParams(window.location.search);
    n.delete(tt);
    const e = n.toString(), t = window.location.pathname + (e ? "?" + e : "") + window.location.hash;
    window.history.replaceState({}, "", t);
  } catch {
  }
}, Qt = () => {
  if (!Kt())
    return !1;
  try {
    const e = new URLSearchParams(window.location.search).get(tt), t = sessionStorage.getItem(z);
    let s = null;
    return e === ke ? (s = !0, sessionStorage.setItem(z, "true"), a("info", "QA Mode ACTIVE", {
      visibility: "qa",
      style: It
    })) : e === Ue && (s = !1, sessionStorage.setItem(z, "false"), a("info", "QA Mode DISABLED", {
      visibility: "qa",
      style: wt
    })), (e === ke || e === Ue) && zt(), s ?? t === "true";
  } catch {
    return !1;
  }
}, Yt = [
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
], Qe = (n) => {
  const e = n.toLowerCase().split(".");
  if (e.length <= 2)
    return n.toLowerCase();
  const t = e.slice(-2).join(".");
  return Yt.includes(t) ? e.slice(-3).join(".") : e.slice(-2).join(".");
}, qt = (n, e) => n === e ? !0 : Qe(n) === Qe(e), de = () => {
  const n = document.referrer;
  if (!n)
    return "Direct";
  try {
    const e = new URL(n).hostname.toLowerCase(), t = window.location.hostname.toLowerCase();
    return qt(e, t) ? "Direct" : n;
  } catch (e) {
    return a("debug", "Failed to parse referrer URL, using raw value", { error: e, data: { referrer: n } }), n;
  }
}, he = () => {
  const n = new URLSearchParams(window.location.search), e = {};
  return St.forEach((s) => {
    const r = n.get(s);
    if (r) {
      const i = s.split("utm_")[1];
      e[i] = r;
    }
  }), Object.keys(e).length ? e : void 0;
}, rt = () => typeof crypto < "u" && crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (n) => {
  const e = Math.random() * 16 | 0;
  return (n === "x" ? e : e & 3 | 8).toString(16);
});
let W = 0, j = 0;
const Jt = () => {
  let n = Date.now();
  n < j && (n = j), n === j ? W = (W + 1) % 1e3 : W = 0, j = n;
  const e = W.toString().padStart(3, "0");
  let t = "";
  try {
    if (typeof crypto < "u" && crypto.getRandomValues) {
      const s = crypto.getRandomValues(new Uint8Array(3));
      s && (t = Array.from(s, (r) => r.toString(16).padStart(2, "0")).join(""));
    }
  } catch {
  }
  return t || (t = Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")), `${n}-${e}-${t}`;
}, Zt = (n) => {
  try {
    return new URL(n).protocol === "https:";
  } catch {
    return !1;
  }
}, es = (n) => {
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
    if (!Zt(i))
      throw new Error("Generated URL failed validation");
    return i;
  } catch (e) {
    throw new Error(`Invalid SaaS URL configuration: ${e instanceof Error ? e.message : String(e)}`);
  }
}, ts = (n) => {
  const e = {};
  return n.integrations?.tracelog?.projectId && (e.saas = es(n.integrations.tracelog.projectId)), e;
}, _e = (n, e = []) => {
  if (!n || typeof n != "string")
    return a("warn", "Invalid URL provided to normalizeUrl", { data: { type: typeof n } }), n || "";
  try {
    const t = new URL(n), s = t.searchParams, r = [.../* @__PURE__ */ new Set([...Et, ...e])];
    let i = !1;
    const o = [];
    return r.forEach((l) => {
      s.has(l) && (s.delete(l), i = !0, o.push(l));
    }), !i && n.includes("?") ? n : (t.search = s.toString(), t.toString());
  } catch (t) {
    return a("warn", "URL normalization failed, returning original", { error: t, data: { urlLength: n?.length } }), n;
  }
}, Ye = (n) => {
  if (!n || typeof n != "string" || n.trim().length === 0)
    return "";
  let e = n;
  n.length > 1e3 && (e = n.slice(0, Math.max(0, 1e3)));
  let t = 0;
  for (const r of vt) {
    const i = e;
    e = e.replace(r, ""), i !== e && t++;
  }
  return t > 0 && a("warn", "XSS patterns detected and removed", {
    data: {
      patternMatches: t,
      valueLength: n.length
    }
  }), e.trim();
}, ye = (n, e = 0) => {
  if (n == null)
    return null;
  if (typeof n == "string")
    return Ye(n);
  if (typeof n == "number")
    return !Number.isFinite(n) || n < -Number.MAX_SAFE_INTEGER || n > Number.MAX_SAFE_INTEGER ? 0 : n;
  if (typeof n == "boolean")
    return n;
  if (e > 10)
    return null;
  if (Array.isArray(n))
    return n.slice(0, 1e3).map((r) => ye(r, e + 1)).filter((r) => r !== null);
  if (typeof n == "object") {
    const t = {}, r = Object.entries(n).slice(0, 200);
    for (const [i, o] of r) {
      const l = Ye(i);
      if (l) {
        const c = ye(o, e + 1);
        c !== null && (t[l] = c);
      }
    }
    return t;
  }
  return null;
}, ss = (n) => {
  if (typeof n != "object" || n === null)
    return {};
  try {
    const e = ye(n);
    return typeof e == "object" && e !== null ? e : {};
  } catch (e) {
    const t = e instanceof Error ? e.message : String(e);
    throw new Error(`[TraceLog] Metadata sanitization failed: ${t}`);
  }
}, ns = [
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
], Y = (n) => {
  let e = n;
  for (const t of ns)
    e = e.replace(t, "[REDACTED]");
  return e;
}, rs = (n) => {
  if (n !== void 0 && (n === null || typeof n != "object"))
    throw new m("Configuration must be an object", "config");
  if (n) {
    if (n.sessionTimeout !== void 0 && (typeof n.sessionTimeout != "number" || n.sessionTimeout < 3e4 || n.sessionTimeout > 864e5))
      throw new yt(y.INVALID_SESSION_TIMEOUT, "config");
    if (n.globalMetadata !== void 0 && (typeof n.globalMetadata != "object" || n.globalMetadata === null))
      throw new m(y.INVALID_GLOBAL_METADATA, "config");
    if (n.integrations && is(n.integrations), n.sensitiveQueryParams !== void 0) {
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
}, is = (n) => {
  if (n && n.tracelog) {
    if (!n.tracelog.projectId || typeof n.tracelog.projectId != "string" || n.tracelog.projectId.trim() === "")
      throw new Be(y.INVALID_TRACELOG_PROJECT_ID, "config");
    if (n.tracelog.shopify !== void 0 && typeof n.tracelog.shopify != "boolean")
      throw new Be("tracelog.shopify must be a boolean", "config");
  }
}, os = (n) => (rs(n), {
  ...n ?? {},
  sessionTimeout: n?.sessionTimeout ?? 9e5,
  globalMetadata: n?.globalMetadata ?? {},
  sensitiveQueryParams: n?.sensitiveQueryParams ?? [],
  errorSampling: n?.errorSampling ?? nt,
  samplingRate: n?.samplingRate ?? 1,
  pageViewThrottleMs: n?.pageViewThrottleMs ?? 1e3,
  clickThrottleMs: n?.clickThrottleMs ?? 300,
  maxSameEventPerMinute: n?.maxSameEventPerMinute ?? 60,
  sendIntervalMs: n?.sendIntervalMs ?? 1e4,
  flushOnSpaNavigation: n?.flushOnSpaNavigation ?? !1,
  flushOnPageHidden: n?.flushOnPageHidden ?? !0
}), Ie = (n, e = /* @__PURE__ */ new Set()) => {
  if (n == null)
    return !0;
  const t = typeof n;
  return t === "string" || t === "number" || t === "boolean" ? !0 : t === "function" || t === "symbol" || t === "bigint" || e.has(n) ? !1 : (e.add(n), Array.isArray(n) ? n.every((s) => Ie(s, e)) : t === "object" ? Object.values(n).every((s) => Ie(s, e)) : !1);
}, as = (n) => typeof n != "object" || n === null ? !1 : Ie(n), we = (n) => {
  if (typeof n != "object" || n === null || Array.isArray(n)) return;
  const e = {};
  for (const [t, s] of Object.entries(n))
    typeof s == "string" && (e[t] = s);
  return Object.keys(e).length > 0 ? e : void 0;
}, ls = (n) => typeof n != "string" ? {
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
} : { valid: !0 }, qe = (n, e, t) => {
  const s = ss(e), r = `${t} "${n}" metadata error`;
  if (!as(s))
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
  for (const [c, u] of Object.entries(s)) {
    if (Array.isArray(u)) {
      if (u.length > 500)
        return {
          valid: !1,
          error: `${r}: array property "${c}" is too large (max 500 items).`
        };
      for (const h of u)
        if (typeof h == "string" && h.length > 500)
          return {
            valid: !1,
            error: `${r}: array property "${c}" contains strings that are too long (max 500 characters).`
          };
    }
    if (typeof u == "string" && u.length > 1e3)
      return {
        valid: !1,
        error: `${r}: property "${c}" is too long (max 1000 characters).`
      };
  }
  return {
    valid: !0,
    sanitizedMetadata: s
  };
}, cs = (n, e, t) => {
  if (Array.isArray(e)) {
    const s = [], r = `${t} "${n}" metadata error`;
    for (let i = 0; i < e.length; i++) {
      const o = e[i];
      if (typeof o != "object" || o === null || Array.isArray(o))
        return {
          valid: !1,
          error: `${r}: array item at index ${i} must be an object.`
        };
      const l = qe(n, o, t);
      if (!l.valid)
        return {
          valid: !1,
          error: `${r}: array item at index ${i} is invalid: ${l.error}`
        };
      l.sanitizedMetadata && s.push(l.sanitizedMetadata);
    }
    return {
      valid: !0,
      sanitizedMetadata: s
    };
  }
  return qe(n, e, t);
}, us = (n, e) => {
  const t = ls(n);
  if (!t.valid)
    return a("error", "Event name validation failed", {
      data: { eventName: n, error: t.error }
    }), t;
  if (!e)
    return { valid: !0 };
  const s = cs(n, e, "customEvent");
  return s.valid || a("error", "Event metadata validation failed", {
    data: {
      eventName: n,
      error: s.error
    }
  }), s;
};
class ds {
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
const hs = /https?:\/\/\S+/g, fs = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, gs = /0x[0-9a-fA-F]{4,}/g, ms = /(?<!\d)\d{4,}(?!\d)/g, ps = /(['"])[^'"]{20,}\1/g;
function Ss(n) {
  return n.replace(hs, "[URL]").replace(fs, "[ID]").replace(gs, "[ADDR]").replace(ms, "[N]").replace(ps, "$1[VAR]$1").toLowerCase().trim();
}
function Es(n) {
  const e = Ss(n.message), t = (n.filename ?? "").trim(), s = t.search(/[?#]/), r = s === -1 ? t : t.slice(0, s), i = n.line == null ? "" : String(n.line);
  return `${e}|${r}|${i}`;
}
const fe = { config: {} };
class T {
  /**
   * Retrieves a value from global state.
   */
  get(e) {
    return fe[e];
  }
  /**
   * Sets a value in global state.
   */
  set(e, t) {
    fe[e] = t;
  }
  /**
   * Returns an immutable snapshot of the entire global state.
   */
  getState() {
    return { ...fe };
  }
}
class vs extends T {
  storeManager;
  apiUrl;
  lastPermanentErrorLog = null;
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
    const e = this.get("userId") || "anonymous", t = `${le(e)}:saas`, s = `${le(e)}:custom`, r = `${ce(e)}:saas`, i = `${ce(e)}:custom`;
    try {
      const o = this.storeManager.getItem(t);
      if (o) {
        const l = this.getQueueStorageKey(), c = this.storeManager.getItem(l);
        c ? this.mergeLegacyIntoCurrent(l, o, c) : (this.storeManager.setItem(l, o), a("debug", "Migrated v2 SaaS queue to v3 unscoped key")), this.storeManager.removeItem(t);
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
      const o = new Set(i.events.map((u) => u.id)), l = [
        ...i.events,
        ...r.events.filter((u) => typeof u.id == "string" && !o.has(u.id))
      ], c = {
        ...i,
        events: l,
        timestamp: typeof i.timestamp == "number" && typeof r.timestamp == "number" ? Math.min(i.timestamp, r.timestamp) : i.timestamp ?? r.timestamp ?? Date.now(),
        recoveryFailures: Math.max(i.recoveryFailures ?? 0, r.recoveryFailures ?? 0) || void 0
      };
      this.storeManager.setItem(e, JSON.stringify(c)), a("debug", "Merged v2 SaaS queue into existing v3 queue", {
        data: { added: l.length - i.events.length, total: l.length }
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
    return ce(e);
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
    return this.apiUrl.includes(F.Fail) ? (a("warn", "Fail mode: simulating network failure (sync)", { data: { events: e.events.length } }), !1) : this.apiUrl.includes(F.Localhost) ? (a("debug", "Success mode: simulating successful send (sync)", { data: { events: e.events.length } }), !0) : this.sendQueueSyncInternal(e);
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
      return r instanceof M ? (this.logPermanentError("Permanent error, not retrying", r), this.clearPersistedEvents(), t?.onFailure?.(), !1) : (this.persistEvents(s), t?.onFailure?.(), !1);
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
      if (r instanceof M) {
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
    if (this.apiUrl.includes(F.Fail))
      return a("debug", "Fail mode: simulating network failure", { data: { events: t.events.length } }), !1;
    if (this.apiUrl.includes(F.Localhost))
      return a("debug", "Success mode: simulating successful send", { data: { events: t.events.length } }), !0;
    if (this.isRateLimited())
      return a("debug", "Rate-limit cooldown active, skipping send", {
        data: {
          cooldownRemainingMs: this.rateLimitedUntil - Date.now(),
          events: t.events.length
        }
      }), !1;
    if (this.consecutiveNetworkFailures >= 3) {
      const l = Date.now() - this.circuitOpenedAt;
      if (l < 12e4)
        return a("debug", "Network circuit open, skipping send", {
          data: {
            consecutiveNetworkFailures: this.consecutiveNetworkFailures,
            cooldownRemainingMs: 12e4 - l
          }
        }), !1;
    }
    const { url: s, payload: r } = this.prepareRequest(t);
    let i = !0, o = !1;
    for (let l = 1; l <= 3; l++)
      try {
        return (await this.sendWithTimeout(s, r)).ok ? (l > 1 && a("info", `Send succeeded after ${l - 1} retry attempt(s)`, {
          data: { events: t.events.length, attempt: l }
        }), this.consecutiveNetworkFailures = 0, this.circuitOpenedAt = 0, !0) : !1;
      } catch (c) {
        const u = l === 3;
        if (c instanceof M)
          throw this.consecutiveNetworkFailures = 0, this.circuitOpenedAt = 0, c;
        if (c instanceof J) {
          this.consecutiveNetworkFailures = 0, this.circuitOpenedAt = 0, i = !1, o = !0, this.armRateLimitCooldown(Date.now() + 6e4), a("warn", "Rate limited, skipping retries", {
            data: { events: e.events.length, attempt: l, cooldownMs: 6e4 }
          });
          break;
        }
        if (c instanceof Z || (i = !1), c instanceof TypeError || (o = !0), a(
          u ? "error" : "warn",
          `Send attempt ${l} failed${u ? " (all retries exhausted)" : ", will retry"}`,
          {
            error: c,
            data: {
              events: e.events.length,
              url: s.replace(/\/\/[^/]+/, "//[DOMAIN]"),
              attempt: l,
              maxAttempts: 3
            }
          }
        ), !u) {
          await this.backoffDelay(l);
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
          const c = await this.readTraceLogErrorCode(o), u = c ? `HTTP ${o.status}: ${o.statusText} (${c})` : `HTTP ${o.status}: ${o.statusText}`;
          throw new M(u, o.status, c);
        }
        throw o.status === 429 ? new J(`HTTP 429: ${o.statusText}`) : new Error(`HTTP ${o.status}: ${o.statusText}`);
      }
      return o;
    } catch (o) {
      throw o instanceof M ? o : r ? new Z("Request timed out") : o;
    } finally {
      clearTimeout(i), this.pendingControllers.delete(s);
    }
  }
  async readTraceLogErrorCode(e) {
    try {
      const t = await e.clone().json();
      if (typeof t.code == "string" && t.code.length > 0 && t.code.length <= Bt)
        return t.code;
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
    const l = navigator.sendBeacon(r, o);
    return l || (a("warn", "sendBeacon rejected request, persisting events for recovery"), this.persistEvents(t)), l;
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
        client_version: jt
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
    const { timestamp: t, recoveryFailures: s, ...r } = e, i = r.events ?? [], o = Date.now() - 5184e5, l = i.filter((c) => {
      const u = typeof c.timestamp == "number" ? c.timestamp : new Date(c.timestamp).getTime();
      return Number.isFinite(u) && u >= o;
    });
    return l.length < i.length && a("debug", "Recovery dropped stale events", {
      data: {
        dropped: i.length - l.length,
        kept: l.length
      }
    }), { ...r, events: l };
  }
  persistEvents(e) {
    const t = this.getPersistedData(), s = typeof t?.recoveryFailures == "number" && Number.isFinite(t.recoveryFailures) ? t.recoveryFailures : 0;
    return this.persistEventsWithFailureCount(e, s);
  }
  persistEventsWithFailureCount(e, t, s = !1) {
    try {
      const r = this.getPersistedData();
      if (!s && r && r.timestamp) {
        const l = Date.now() - r.timestamp;
        if (l < 1e3)
          return a("debug", "Skipping persistence, another tab recently persisted events", {
            data: { timeSinceExisting: l }
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
    (!this.lastPermanentErrorLog || this.lastPermanentErrorLog.key !== r || s - this.lastPermanentErrorLog.timestamp >= $t) && (a("error", e, {
      data: { status: t.statusCode, code: t.responseCode, message: t.message }
    }), this.lastPermanentErrorLog = { key: r, timestamp: s });
  }
}
class Ts extends T {
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
const _s = new Set(Object.values(d));
class ys extends T {
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
    super(), this.emitter = t, this.timeManager = new Ts(), this.dataSenders = [];
    const s = this.get("collectApiUrls");
    s?.saas && this.dataSenders.push(new vs(e, s.saas)), this.saveSessionCountsDebounced = this.debounce((r) => {
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
            const o = r.map((l) => l.id);
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
    web_vitals: l,
    error_data: c,
    page_view: u
  }) {
    if (!e) {
      a("error", "Event type is required - event will be ignored");
      return;
    }
    if (!_s.has(e)) {
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
        web_vitals: l,
        error_data: c,
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
        const ae = this.sessionEventCounts[S];
        if (ae !== void 0 && ae >= _) {
          a("warn", "Session event type limit reached", {
            data: {
              type: S,
              count: ae,
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
    const gt = S === d.SESSION_START, mt = t || this.get("pageUrl"), G = this.buildEventPayload({
      type: S,
      page_url: mt,
      from_page_url: s,
      scroll_data: r,
      click_data: i,
      custom_event: o,
      web_vitals: l,
      error_data: c,
      page_view: u
    });
    if (G && !(!p && !this.shouldSample())) {
      if (gt) {
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
      if (!this.isDuplicateEvent(G)) {
        if (this.get("mode") === ee.QA && S === d.CUSTOM && o) {
          a("info", `Custom Event: ${o.name}`, {
            visibility: "qa",
            data: {
              name: o.name,
              ...o.metadata && { metadata: o.metadata }
            }
          }), this.emitEvent(G);
          return;
        }
        if (this.addToQueue(G), !p) {
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
      const o = r.filter((l) => !this.isSuccessfulResult(l)).length;
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
    const i = r.map((u) => s.get(u)).filter((u) => !!u).sort((u, h) => u.type === d.SESSION_START && h.type !== d.SESSION_START ? -1 : h.type === d.SESSION_START && u.type !== d.SESSION_START ? 1 : u.timestamp - h.timestamp).map(({ _session_id: u, ...h }) => h), o = this.get("config")?.globalMetadata, l = this.get("identity");
    return {
      user_id: this.get("userId"),
      session_id: e,
      device: this.get("device"),
      events: i,
      ...o && { global_metadata: o },
      ...l && { identify: l }
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
    const l = this.get("sessionReferrer"), c = this.get("sessionUtm");
    return { ...{
      id: Jt(),
      type: e.type,
      page_url: r,
      timestamp: i,
      ...l && { referrer: l },
      ...e.from_page_url && { from_page_url: e.from_page_url },
      ...e.scroll_data && { scroll_data: e.scroll_data },
      ...e.click_data && { click_data: e.click_data },
      ...e.custom_event && { custom_event: e.custom_event },
      ...e.web_vitals && { web_vitals: e.web_vitals },
      ...e.error_data && { error_data: e.error_data },
      ...e.page_view && { page_view: e.page_view },
      ...c && { utm: c }
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
    return e.scroll_data && (t += `_scroll_${e.scroll_data.depth}_${e.scroll_data.direction}`), e.custom_event && (t += `_custom_${e.custom_event.name}`, e.custom_event.metadata && (t += `_${this.stableStringify(e.custom_event.metadata)}`)), e.web_vitals && (t += `_vitals_${e.web_vitals.type}`), e.error_data && (t += `_error_${e.error_data.type}_${e.error_data.message}`), t;
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
      this.emitter.emit(k.EVENT, s);
    }
  }
  emitEventsQueue(e) {
    this.emitter && this.emitter.emit(k.QUEUE, e);
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
    const t = this.get("userId") || "anonymous", s = Fe(t, e);
    try {
      const r = localStorage.getItem(s);
      if (!r)
        return this.getInitialCounts();
      const i = JSON.parse(r);
      return i._timestamp && Date.now() - i._timestamp > Ve ? (a("debug", "Session counts expired, clearing", {
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
        const e = localStorage.getItem(He);
        if (e) {
          const i = Date.now() - parseInt(e, 10);
          if (i < xe) {
            a("debug", "Skipping session counts cleanup (throttled)", {
              data: { timeSinceLastCleanup: i, throttleMs: xe }
            });
            return;
          }
        }
        const t = this.get("userId") || "anonymous", s = `${g}:${t}:session_counts:`, r = [];
        for (let i = 0; i < localStorage.length; i++) {
          const o = localStorage.key(i);
          if (o?.startsWith(s))
            try {
              const l = localStorage.getItem(o);
              if (l) {
                const c = JSON.parse(l);
                c._timestamp && Date.now() - c._timestamp > Ve && r.push(o);
              }
            } catch {
            }
        }
        r.forEach((i) => {
          localStorage.removeItem(i), a("debug", "Cleaned up expired session counts", { data: { key: i } });
        }), r.length > 0 && a("info", `Cleaned up ${r.length} expired session counts entries`), localStorage.setItem(He, Date.now().toString());
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
    const t = e.getItem(pe);
    if (t)
      return t;
    const s = rt();
    return e.setItem(pe, s), s;
  }
}
const ws = /^\d{13}-[a-z0-9]{9}$/;
class As extends T {
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
    this.broadcastChannel = new BroadcastChannel(_t(e)), this.broadcastChannel.onmessage = (t) => {
      const { action: s, sessionId: r, timestamp: i, projectId: o } = t.data ?? {};
      o === e && (s === "session_start" && r && typeof i == "number" && i > Date.now() - 5e3 ? (this.set("sessionId", r), this.persistSession(r, i), this.isTracking && this.setupSessionTimeout()) : s && s !== "session_start" && a("debug", "Ignored BroadcastChannel message with unknown action", { data: { action: s } }));
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
    if (!ws.test(e.id))
      return a("warn", "Invalid session ID format recovered from storage, clearing", {
        data: { sessionId: e.id }
      }), this.clearStoredSession(), null;
    const t = this.get("config")?.sessionTimeout ?? 9e5;
    return Date.now() - e.lastActivity > t ? (this.clearStoredSession(), null) : e.id;
  }
  persistSession(e, t = Date.now(), s, r) {
    this.saveStoredSession({
      id: e,
      lastActivity: t,
      ...s && { referrer: s },
      ...r && { utm: r }
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
    return Tt(this.getProjectId());
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
    let s, r;
    if (e) {
      const i = this.loadStoredSession();
      s = i?.referrer ?? de(), r = i?.utm ?? he();
    } else
      s = de(), r = he();
    a("debug", "Session tracking initialized", {
      data: {
        sessionId: t,
        wasRecovered: !!e,
        willEmitSessionStart: !e,
        sessionReferrer: s,
        hasUtm: !!r
      }
    }), this.isTracking = !0;
    try {
      this.set("sessionId", t), this.set("sessionReferrer", s), this.set("sessionUtm", r), this.persistSession(t, Date.now(), s, r), this.initCrossTabSync(), this.shareSession(t), e ? a("debug", "Session recovered, skipping SESSION_START", {
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
    const e = this.generateSessionId(), t = de(), s = he();
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
class bs extends T {
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
      this.sessionManager = new As(this.storageManager, this.eventManager, t), this.sessionManager.startTracking(), this.eventManager.flushPendingEvents();
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
class Ls extends T {
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
    const e = window.location.href, t = _e(e, this.get("config").sensitiveQueryParams);
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
    const e = _e(window.location.href, this.get("config").sensitiveQueryParams), t = this.extractPageViewData();
    this.lastPageViewTime = Date.now(), this.eventManager.track({
      type: d.PAGE_VIEW,
      page_url: e,
      ...t && { page_view: t }
    }), this.onTrack();
  }
  extractPageViewData() {
    const { referrer: e } = document, { title: t } = document;
    if (!(!e && !t))
      return {
        ...e && { referrer: e },
        ...t && { title: t }
      };
  }
}
class Ms extends T {
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
      const o = this.findTrackingElement(r), l = this.getRelevantClickElement(r), c = this.calculateClickCoordinates(t);
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
      if (!c) {
        a("debug", "Click skipped: invalid coordinates (likely synthetic)");
        return;
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
    return e.hasAttribute(`${b}-ignore`) ? !0 : e.closest(`[${b}-ignore]`) !== null;
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
      const s = Array.from(this.lastClickTimes.entries()).sort((o, l) => o[1] - l[1]), r = this.lastClickTimes.size - 1e3, i = s.slice(0, r);
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
    return e.hasAttribute(`${b}-name`) ? e : e.closest(`[${b}-name]`);
  }
  getRelevantClickElement(e) {
    for (const t of pt)
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
    const t = e.getAttribute(`${b}-name`), s = e.getAttribute(`${b}-value`);
    if (t)
      return {
        element: e,
        name: t,
        ...s && { value: s }
      };
  }
  generateClickData(e, t, s) {
    const { x: r, y: i } = s, o = this.getRelevantText(e, t), l = t.getAttribute("href") ?? void 0;
    return {
      x: r,
      y: i,
      tag: t.tagName.toLowerCase(),
      ...t.id && { id: t.id },
      ...t.className && { class: t.className },
      ...o && { text: o },
      ...l && { href: l }
    };
  }
  getRelevantText(e, t) {
    const s = e.textContent?.trim() ?? "", r = t.textContent?.trim() ?? "";
    if (!s && !r)
      return "";
    let i = "";
    return s && s.length <= 255 ? i = s : r.length <= 255 ? i = r : i = r.slice(0, 252) + "...", Y(i);
  }
  createCustomEventData(e) {
    return {
      name: e.name,
      ...e.value && { value: e.value }
    };
  }
}
class Rs extends T {
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
    if (this.containers.some((c) => c.element === e) || e !== window && !this.isElementScrollable(e))
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
    }, l = () => {
      this.get("suppressNextScroll") || (this.clearContainerTimer(o), o.debounceTimer = window.setTimeout(() => {
        const c = this.calculateScrollData(o);
        c && this.processScrollEvent(o, c, Date.now()), o.debounceTimer = null;
      }, 250));
    };
    o.listener = l, this.containers.push(o), e === window ? window.addEventListener("scroll", l, { passive: !0 }) : e.addEventListener("scroll", l, { passive: !0 });
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
    return e > t ? Se.DOWN : Se.UP;
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
    const o = this.getViewportHeight(t), l = this.getScrollHeight(t), c = this.getScrollDirection(r, s), u = this.calculateScrollDepth(r, l, o);
    return e.lastScrollPos = r, { depth: u, direction: c };
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
const Cs = "tracelog_session_id", Ns = "tracelog_user_id";
class Os extends T {
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
    const s = { [Cs]: e };
    t.length > 0 && (s[Ns] = t);
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
class Ps {
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
        o?.startsWith("tracelog_") && (o.startsWith("tracelog_persisted_events_") ? t.push(o) : e.some((l) => o.startsWith(l)) || s.push(o));
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
class Ds extends T {
  eventManager;
  reportedByNav = /* @__PURE__ */ new Map();
  navigationHistory = [];
  // FIFO queue for tracking navigation order
  observers = [];
  vitalThresholds;
  navigationCounter = 0;
  // Counter for handling simultaneous navigations edge case
  constructor(e) {
    super(), this.eventManager = e, this.vitalThresholds = ze(Te);
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
   *
   * @returns Promise that resolves when tracking is initialized
   */
  async startTracking() {
    const e = this.get("config"), t = e?.webVitalsMode ?? Te;
    this.vitalThresholds = ze(t), e?.webVitalsThresholds && (this.vitalThresholds = { ...this.vitalThresholds, ...e.webVitalsThresholds }), await this.initWebVitals();
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
          const l = typeof o.value == "number" ? o.value : 0;
          e += l;
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
      const { onLCP: e, onCLS: t, onFCP: s, onTTFB: r, onINP: i } = await Promise.resolve().then(() => an), o = (l) => (c) => {
        const u = Number(c.value.toFixed(2));
        this.sendVital({ type: l, value: u });
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
      else if (this.reportedByNav.set(t, /* @__PURE__ */ new Set([e.type])), this.navigationHistory.push(t), this.navigationHistory.length > Gt) {
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
      const t = e.startTime || performance.now(), s = ++this.navigationCounter, r = `${t.toFixed(2)}_${window.location.pathname}`;
      return s > 1 ? `${r}_${s}` : r;
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
      const i = new PerformanceObserver((o, l) => {
        try {
          t(o, l);
        } catch (c) {
          a("debug", "Observer callback failed", {
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
      return i.observe(s ?? { type: e, buffered: !0 }), r || this.observers.push(i), !0;
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
class se extends T {
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
    }, this.emitter.on(k.EVENT, this.pageviewResetListener));
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
    window.removeEventListener("error", this.handleError), window.removeEventListener("unhandledrejection", this.handleRejection), this.pagehideHandler && (window.removeEventListener("pagehide", this.pagehideHandler), this.pagehideHandler = null), this.emitter && this.pageviewResetListener && (this.emitter.off(k.EVENT, this.pageviewResetListener), this.pageviewResetListener = null), this.recentErrors.clear(), this.pageviewSignatureCounts.clear(), this.errorBurstCounter = 0, this.burstWindowStart = 0, this.burstBackoffUntil = 0;
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
    if (e - this.burstWindowStart > Ft && (this.errorBurstCounter = 0, this.burstWindowStart = e), this.errorBurstCounter++, this.errorBurstCounter > Vt)
      return this.burstBackoffUntil = e + je, a("debug", "Error burst detected - entering cooldown", {
        data: {
          errorsInWindow: this.errorBurstCounter,
          cooldownMs: je
        }
      }), !1;
    const s = this.get("config").errorSampling ?? nt;
    return Math.random() < s;
  }
  /**
   * Returns true when the per-pageview signature cap has been hit for this error.
   * Dropped errors do not increment the counter — the 5s suppression window already
   * silences identical repeats, and double-counting here would skew the cap for any
   * later signature that recycles the same map key after a counter reset.
   */
  shouldThrottleBySignature(e) {
    const t = Es({
      message: e.message,
      filename: e.filename,
      line: e.line
    }), s = this.pageviewSignatureCounts.get(t) ?? 0;
    if (s >= Ht)
      return a("debug", "Error throttled (pageview cap)", {
        data: { signature: t, count: s }
      }), !0;
    const r = s + 1;
    return this.pageviewSignatureCounts.set(t, r), this.pageviewSignatureCounts.size > xt && (this.pageviewSignatureCounts.clear(), this.pageviewSignatureCounts.set(t, r)), !1;
  }
  handleError = (e) => {
    if (!this.shouldSample())
      return;
    const t = this.sanitize(e.message || "Unknown error");
    if (this.shouldSuppressError(V.JS_ERROR, t) || this.shouldThrottleBySignature({
      message: t,
      filename: e.filename,
      line: e.lineno
    }))
      return;
    const s = typeof e.error?.stack == "string" ? this.truncateStack(e.error.stack) : void 0, r = typeof e.error?.name == "string" && e.error.name !== "Error" ? e.error.name : void 0;
    this.eventManager.track({
      type: d.ERROR,
      error_data: {
        type: V.JS_ERROR,
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
    const t = this.extractRejectionMessage(e.reason), s = this.sanitize(t);
    if (this.shouldSuppressError(V.PROMISE_REJECTION, s) || this.shouldThrottleBySignature({ message: s }))
      return;
    const r = e.reason instanceof Error && typeof e.reason.stack == "string" ? this.truncateStack(e.reason.stack) : void 0, i = e.reason instanceof Error && e.reason.name !== "Error" ? e.reason.name : void 0;
    this.eventManager.track({
      type: d.ERROR,
      error_data: {
        type: V.PROMISE_REJECTION,
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
    return Y(t);
  }
  shouldSuppressError(e, t) {
    const s = Date.now(), r = `${e}:${t}`, i = this.recentErrors.get(r);
    return i !== void 0 && s - i < We ? (this.recentErrors.set(r, s), !0) : (this.recentErrors.set(r, s), this.recentErrors.size > Ut ? (this.recentErrors.clear(), this.recentErrors.set(r, s), !1) : (this.recentErrors.size > Q && this.pruneOldErrors(), !1));
  }
  static TRUNCATION_SUFFIX = `
...truncated`;
  truncateStack(e) {
    if (e.length <= Ge) return Y(e);
    const t = Ge - se.TRUNCATION_SUFFIX.length, s = e.slice(0, t) + se.TRUNCATION_SUFFIX;
    return Y(s);
  }
  pruneOldErrors() {
    const e = Date.now();
    for (const [r, i] of this.recentErrors.entries())
      e - i > We && this.recentErrors.delete(r);
    if (this.recentErrors.size <= Q)
      return;
    const t = Array.from(this.recentErrors.entries()).sort((r, i) => r[1] - i[1]), s = this.recentErrors.size - Q;
    for (let r = 0; r < s; r += 1) {
      const i = t[r];
      i && this.recentErrors.delete(i[0]);
    }
  }
}
class ks extends T {
  isInitialized = !1;
  suppressNextScrollTimer = null;
  pageUnloadHandler = null;
  pageShowHandler = null;
  visibilityFlushHandler = null;
  emitter = new ds();
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
    this.managers.storage = new Ps();
    try {
      return this.setupState(e), this.managers.event = new ys(this.managers.storage, this.emitter), this.loadPersistedIdentity(), this.initializeHandlers(), this.setupPageLifecycleListeners(), await this.managers.event.recoverPersistedEvents().catch((t) => {
        a("warn", "Failed to recover persisted events", { error: t });
      }), this.isInitialized = !0, { sessionId: this.get("sessionId") ?? "" };
    } catch (t) {
      this.destroy(!0);
      const s = t instanceof Error ? t.message : String(t);
      throw new Error(`[TraceLog] TraceLog initialization failed: ${s}`);
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
    const { valid: i, error: o, sanitizedMetadata: l } = us(e, r);
    if (!i) {
      if (this.get("mode") === ee.QA)
        throw new Error(`[TraceLog] Custom event "${e}" validation failed: ${o}`);
      a("warn", `Custom event "${e}" dropped: ${o}`);
      return;
    }
    this.managers.event.track({
      type: d.CUSTOM,
      custom_event: {
        name: e,
        ...l && { metadata: l }
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
    }), this.suppressNextScrollTimer && (clearTimeout(this.suppressNextScrollTimer), this.suppressNextScrollTimer = null), this.pageUnloadHandler && (window.removeEventListener("pagehide", this.pageUnloadHandler), window.removeEventListener("beforeunload", this.pageUnloadHandler), this.pageUnloadHandler = null), this.pageShowHandler && (window.removeEventListener("pageshow", this.pageShowHandler), this.pageShowHandler = null), this.visibilityFlushHandler && (document.removeEventListener("visibilitychange", this.visibilityFlushHandler), this.visibilityFlushHandler = null), this.managers.event?.flushImmediatelySync(), this.managers.event?.stop(), this.emitter.removeAllListeners(), this.set("suppressNextScroll", !1), this.set("sessionId", null), this.set("identity", void 0), this.clearPersistedIdentity(), this.integrationInstances.shopifyCartLinker?.deactivate(), this.integrationInstances = {}, this.isInitialized = !1, this.handlers = {}, this.managers = {});
  }
  setupState(e = {}) {
    this.set("config", e);
    const t = Is.getId(this.managers.storage);
    this.set("userId", t);
    const s = ts(e);
    this.set("collectApiUrls", s);
    const r = kt();
    this.set("device", r);
    const i = _e(window.location.href, e.sensitiveQueryParams);
    this.set("pageUrl", i), Qt() && this.set("mode", ee.QA);
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
    const s = e.trim(), r = we(t), i = {
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
    const e = rt();
    this.managers.storage.setItem(pe, e), this.set("userId", e), this.set("hasStartSession", !1), this.set("sessionId", null), this.handlers.session?.stopTracking(), this.handlers.session?.startTracking(), a("debug", "Identity reset, new UUID generated");
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
      const t = this.getProjectId(), s = ue(t);
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
    const e = this.managers.storage, t = this.getProjectId(), s = ue(t);
    try {
      const r = e.getItem(O);
      if (r) {
        const i = JSON.parse(r);
        if (e.removeItem(O), !this.isValidIdentityData(i)) {
          a("debug", "Invalid pending identity in localStorage, discarded");
          return;
        }
        const o = this.normalizePersistedIdentity(i);
        e.setItem(s, JSON.stringify(o)), this.set("identity", o), a("debug", "Migrated pending identity to project-scoped key");
        return;
      }
    } catch {
      e.removeItem(O);
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
    const t = we(e.traits);
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
      e.removeItem(ue(t)), e.removeItem(O);
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
    this.handlers.session = new bs(
      this.managers.storage,
      this.managers.event
    ), this.handlers.session.startTracking();
    const t = () => {
      this.set("suppressNextScroll", !0), this.suppressNextScrollTimer && clearTimeout(this.suppressNextScrollTimer), this.suppressNextScrollTimer = window.setTimeout(() => {
        this.set("suppressNextScroll", !1);
      }, 500);
    };
    if (this.handlers.pageView = new Ls(this.managers.event, t), this.handlers.pageView.startTracking(), this.handlers.click = new Ms(this.managers.event), this.handlers.click.startTracking(), this.handlers.scroll = new Rs(this.managers.event), this.handlers.scroll.startTracking(), this.handlers.performance = new Ds(this.managers.event), this.handlers.performance.startTracking().catch((s) => {
      a("warn", "Failed to start performance tracking", { error: s });
    }), this.handlers.error = new se(this.managers.event, this.emitter), this.handlers.error.startTracking(), e.integrations?.tracelog?.shopify) {
      const s = new Os();
      s.activate(), this.integrationInstances.shopifyCartLinker = s, this.emitter.on(k.EVENT, (r) => {
        r.type === d.SESSION_START && s.onSessionChange();
      });
    }
  }
}
const C = [];
let f = null, D = !1, A = !1, R = null;
const Us = async (n) => typeof window > "u" || typeof document > "u" ? { sessionId: "" } : (A = !1, window.__traceLogDisabled === !0 ? { sessionId: "" } : f ? { sessionId: f.getSessionId() ?? "" } : (D && R || (D = !0, R = (async () => {
  try {
    const e = os(n ?? {}), t = new ks();
    try {
      C.forEach(({ event: o, callback: l }) => {
        t.on(o, l);
      }), C.length = 0;
      const s = t.init(e), r = new Promise((o, l) => {
        setTimeout(() => {
          l(new Error("[TraceLog] Initialization timeout after 10000ms"));
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
    D = !1, R = null;
  }
})()), R)), Fs = (n, e, t) => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!f)
      throw new Error("[TraceLog] TraceLog not initialized. Please call init() first.");
    if (A)
      throw new Error("[TraceLog] Cannot send events while TraceLog is being destroyed");
    f.sendCustomEvent(n, e, t);
  }
}, Vs = (n, e) => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!f || D) {
      C.push({ event: n, callback: e });
      return;
    }
    f.on(n, e);
  }
}, Hs = (n, e) => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!f) {
      const t = C.findIndex((s) => s.event === n && s.callback === e);
      t !== -1 && C.splice(t, 1);
      return;
    }
    f.off(n, e);
  }
}, xs = () => typeof window > "u" || typeof document > "u" ? !1 : f !== null, $s = () => typeof window > "u" || typeof document > "u" || !f ? null : f.getSessionId(), Bs = () => typeof window > "u" || typeof document > "u" || !f ? null : f.getUserId(), Xs = () => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (A)
      throw new Error("[TraceLog] Destroy operation already in progress");
    if (!f) {
      A = !1;
      return;
    }
    A = !0;
    try {
      f.destroy(), f = null, D = !1, R = null, C.length = 0, A = !1;
    } catch (n) {
      f = null, D = !1, R = null, C.length = 0, A = !1, a("warn", "Error during destroy, forced cleanup completed", { error: n });
    }
  }
}, Gs = (n, e) => {
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
      const t = we(e), s = {
        userId: n.trim(),
        ...t ? { traits: t } : {}
      };
      localStorage.setItem(O, JSON.stringify(s)), a("debug", "Identity persisted pre-init (will be applied on init)");
    } catch {
      a("debug", "Failed to persist pre-init identity");
    }
  }
}, Ws = async () => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!f) {
      try {
        localStorage.removeItem(O);
      } catch {
      }
      return;
    }
    if (A)
      throw new Error("[TraceLog] Cannot reset identity while TraceLog is being destroyed");
    await f.resetIdentity();
  }
}, vn = {
  init: Us,
  event: Fs,
  on: Vs,
  off: Hs,
  isInitialized: xs,
  getSessionId: $s,
  getUserId: Bs,
  destroy: Xs,
  identify: Gs,
  resetIdentity: Ws
};
var Ae, L, x, it, ne, ot = -1, N = function(n) {
  addEventListener("pageshow", (function(e) {
    e.persisted && (ot = e.timeStamp, n(e));
  }), !0);
}, Oe = function() {
  var n = self.performance && performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
  if (n && n.responseStart > 0 && n.responseStart < performance.now()) return n;
}, ie = function() {
  var n = Oe();
  return n && n.activationStart || 0;
}, E = function(n, e) {
  var t = Oe(), s = "navigate";
  return ot >= 0 ? s = "back-forward-cache" : t && (document.prerendering || ie() > 0 ? s = "prerender" : document.wasDiscarded ? s = "restore" : t.type && (s = t.type.replace(/_/g, "-"))), { name: n, value: e === void 0 ? -1 : e, rating: "good", delta: 0, entries: [], id: "v4-".concat(Date.now(), "-").concat(Math.floor(8999999999999 * Math.random()) + 1e12), navigationType: s };
}, U = function(n, e, t) {
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
    e.value >= 0 && (o || s) && ((i = e.value - (r || 0)) || r === void 0) && (r = e.value, e.delta = i, e.rating = (function(l, c) {
      return l > c[1] ? "poor" : l > c[0] ? "needs-improvement" : "good";
    })(e.value, t), n(e));
  };
}, Pe = function(n) {
  requestAnimationFrame((function() {
    return requestAnimationFrame((function() {
      return n();
    }));
  }));
}, B = function(n) {
  document.addEventListener("visibilitychange", (function() {
    document.visibilityState === "hidden" && n();
  }));
}, oe = function(n) {
  var e = !1;
  return function() {
    e || (n(), e = !0);
  };
}, P = -1, Je = function() {
  return document.visibilityState !== "hidden" || document.prerendering ? 1 / 0 : 0;
}, re = function(n) {
  document.visibilityState === "hidden" && P > -1 && (P = n.type === "visibilitychange" ? n.timeStamp : 0, js());
}, Ze = function() {
  addEventListener("visibilitychange", re, !0), addEventListener("prerenderingchange", re, !0);
}, js = function() {
  removeEventListener("visibilitychange", re, !0), removeEventListener("prerenderingchange", re, !0);
}, De = function() {
  return P < 0 && (P = Je(), Ze(), N((function() {
    setTimeout((function() {
      P = Je(), Ze();
    }), 0);
  }))), { get firstHiddenTime() {
    return P;
  } };
}, X = function(n) {
  document.prerendering ? addEventListener("prerenderingchange", (function() {
    return n();
  }), !0) : n();
}, be = [1800, 3e3], at = function(n, e) {
  e = e || {}, X((function() {
    var t, s = De(), r = E("FCP"), i = U("paint", (function(o) {
      o.forEach((function(l) {
        l.name === "first-contentful-paint" && (i.disconnect(), l.startTime < s.firstHiddenTime && (r.value = Math.max(l.startTime - ie(), 0), r.entries.push(l), t(!0)));
      }));
    }));
    i && (t = v(n, r, be, e.reportAllChanges), N((function(o) {
      r = E("FCP"), t = v(n, r, be, e.reportAllChanges), Pe((function() {
        r.value = performance.now() - o.timeStamp, t(!0);
      }));
    })));
  }));
}, Le = [0.1, 0.25], Ks = function(n, e) {
  e = e || {}, at(oe((function() {
    var t, s = E("CLS", 0), r = 0, i = [], o = function(c) {
      c.forEach((function(u) {
        if (!u.hadRecentInput) {
          var h = i[0], p = i[i.length - 1];
          r && u.startTime - p.startTime < 1e3 && u.startTime - h.startTime < 5e3 ? (r += u.value, i.push(u)) : (r = u.value, i = [u]);
        }
      })), r > s.value && (s.value = r, s.entries = i, t());
    }, l = U("layout-shift", o);
    l && (t = v(n, s, Le, e.reportAllChanges), B((function() {
      o(l.takeRecords()), t(!0);
    })), N((function() {
      r = 0, s = E("CLS", 0), t = v(n, s, Le, e.reportAllChanges), Pe((function() {
        return t();
      }));
    })), setTimeout(t, 0));
  })));
}, lt = 0, ge = 1 / 0, K = 0, zs = function(n) {
  n.forEach((function(e) {
    e.interactionId && (ge = Math.min(ge, e.interactionId), K = Math.max(K, e.interactionId), lt = K ? (K - ge) / 7 + 1 : 0);
  }));
}, ct = function() {
  return Ae ? lt : performance.interactionCount || 0;
}, Qs = function() {
  "interactionCount" in performance || Ae || (Ae = U("event", zs, { type: "event", buffered: !0, durationThreshold: 0 }));
}, I = [], q = /* @__PURE__ */ new Map(), ut = 0, Ys = function() {
  var n = Math.min(I.length - 1, Math.floor((ct() - ut) / 50));
  return I[n];
}, qs = [], Js = function(n) {
  if (qs.forEach((function(r) {
    return r(n);
  })), n.interactionId || n.entryType === "first-input") {
    var e = I[I.length - 1], t = q.get(n.interactionId);
    if (t || I.length < 10 || n.duration > e.latency) {
      if (t) n.duration > t.latency ? (t.entries = [n], t.latency = n.duration) : n.duration === t.latency && n.startTime === t.entries[0].startTime && t.entries.push(n);
      else {
        var s = { id: n.interactionId, latency: n.duration, entries: [n] };
        q.set(s.id, s), I.push(s);
      }
      I.sort((function(r, i) {
        return i.latency - r.latency;
      })), I.length > 10 && I.splice(10).forEach((function(r) {
        return q.delete(r.id);
      }));
    }
  }
}, dt = function(n) {
  var e = self.requestIdleCallback || self.setTimeout, t = -1;
  return n = oe(n), document.visibilityState === "hidden" ? n() : (t = e(n), B(n)), t;
}, Me = [200, 500], Zs = function(n, e) {
  "PerformanceEventTiming" in self && "interactionId" in PerformanceEventTiming.prototype && (e = e || {}, X((function() {
    var t;
    Qs();
    var s, r = E("INP"), i = function(l) {
      dt((function() {
        l.forEach(Js);
        var c = Ys();
        c && c.latency !== r.value && (r.value = c.latency, r.entries = c.entries, s());
      }));
    }, o = U("event", i, { durationThreshold: (t = e.durationThreshold) !== null && t !== void 0 ? t : 40 });
    s = v(n, r, Me, e.reportAllChanges), o && (o.observe({ type: "first-input", buffered: !0 }), B((function() {
      i(o.takeRecords()), s(!0);
    })), N((function() {
      ut = ct(), I.length = 0, q.clear(), r = E("INP"), s = v(n, r, Me, e.reportAllChanges);
    })));
  })));
}, Re = [2500, 4e3], me = {}, en = function(n, e) {
  e = e || {}, X((function() {
    var t, s = De(), r = E("LCP"), i = function(c) {
      e.reportAllChanges || (c = c.slice(-1)), c.forEach((function(u) {
        u.startTime < s.firstHiddenTime && (r.value = Math.max(u.startTime - ie(), 0), r.entries = [u], t());
      }));
    }, o = U("largest-contentful-paint", i);
    if (o) {
      t = v(n, r, Re, e.reportAllChanges);
      var l = oe((function() {
        me[r.id] || (i(o.takeRecords()), o.disconnect(), me[r.id] = !0, t(!0));
      }));
      ["keydown", "click"].forEach((function(c) {
        addEventListener(c, (function() {
          return dt(l);
        }), { once: !0, capture: !0 });
      })), B(l), N((function(c) {
        r = E("LCP"), t = v(n, r, Re, e.reportAllChanges), Pe((function() {
          r.value = performance.now() - c.timeStamp, me[r.id] = !0, t(!0);
        }));
      }));
    }
  }));
}, Ce = [800, 1800], tn = function n(e) {
  document.prerendering ? X((function() {
    return n(e);
  })) : document.readyState !== "complete" ? addEventListener("load", (function() {
    return n(e);
  }), !0) : setTimeout(e, 0);
}, sn = function(n, e) {
  e = e || {};
  var t = E("TTFB"), s = v(n, t, Ce, e.reportAllChanges);
  tn((function() {
    var r = Oe();
    r && (t.value = Math.max(r.responseStart - ie(), 0), t.entries = [r], s(!0), N((function() {
      t = E("TTFB", 0), (s = v(n, t, Ce, e.reportAllChanges))(!0);
    })));
  }));
}, H = { passive: !0, capture: !0 }, nn = /* @__PURE__ */ new Date(), et = function(n, e) {
  L || (L = e, x = n, it = /* @__PURE__ */ new Date(), ft(removeEventListener), ht());
}, ht = function() {
  if (x >= 0 && x < it - nn) {
    var n = { entryType: "first-input", name: L.type, target: L.target, cancelable: L.cancelable, startTime: L.timeStamp, processingStart: L.timeStamp + x };
    ne.forEach((function(e) {
      e(n);
    })), ne = [];
  }
}, rn = function(n) {
  if (n.cancelable) {
    var e = (n.timeStamp > 1e12 ? /* @__PURE__ */ new Date() : performance.now()) - n.timeStamp;
    n.type == "pointerdown" ? (function(t, s) {
      var r = function() {
        et(t, s), o();
      }, i = function() {
        o();
      }, o = function() {
        removeEventListener("pointerup", r, H), removeEventListener("pointercancel", i, H);
      };
      addEventListener("pointerup", r, H), addEventListener("pointercancel", i, H);
    })(e, n) : et(e, n);
  }
}, ft = function(n) {
  ["mousedown", "keydown", "touchstart", "pointerdown"].forEach((function(e) {
    return n(e, rn, H);
  }));
}, Ne = [100, 300], on = function(n, e) {
  e = e || {}, X((function() {
    var t, s = De(), r = E("FID"), i = function(c) {
      c.startTime < s.firstHiddenTime && (r.value = c.processingStart - c.startTime, r.entries.push(c), t(!0));
    }, o = function(c) {
      c.forEach(i);
    }, l = U("first-input", o);
    t = v(n, r, Ne, e.reportAllChanges), l && (B(oe((function() {
      o(l.takeRecords()), l.disconnect();
    }))), N((function() {
      var c;
      r = E("FID"), t = v(n, r, Ne, e.reportAllChanges), ne = [], x = -1, L = null, ft(addEventListener), c = i, ne.push(c), ht();
    })));
  }));
};
const an = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  CLSThresholds: Le,
  FCPThresholds: be,
  FIDThresholds: Ne,
  INPThresholds: Me,
  LCPThresholds: Re,
  TTFBThresholds: Ce,
  onCLS: Ks,
  onFCP: at,
  onFID: on,
  onINP: Zs,
  onLCP: en,
  onTTFB: sn
}, Symbol.toStringTag, { value: "Module" }));
export {
  m as AppConfigValidationError,
  ln as DEFAULT_SESSION_TIMEOUT,
  Te as DEFAULT_WEB_VITALS_MODE,
  w as DeviceType,
  k as EmitterEvent,
  V as ErrorType,
  d as EventType,
  Sn as InitializationTimeoutError,
  Be as IntegrationValidationError,
  pn as MAX_ARRAY_LENGTH,
  hn as MAX_CUSTOM_EVENT_ARRAY_SIZE,
  dn as MAX_CUSTOM_EVENT_KEYS,
  cn as MAX_CUSTOM_EVENT_NAME_LENGTH,
  un as MAX_CUSTOM_EVENT_STRING_SIZE,
  fn as MAX_NESTED_OBJECT_KEYS,
  gn as MAX_STRING_LENGTH,
  mn as MAX_STRING_LENGTH_IN_ARRAY,
  ee as Mode,
  ns as PII_PATTERNS,
  M as PermanentError,
  J as RateLimitError,
  $e as SamplingRateValidationError,
  Se as ScrollDirection,
  yt as SessionTimeoutValidationError,
  F as SpecialApiUrl,
  Z as TimeoutError,
  $ as TraceLogValidationError,
  En as WEB_VITALS_GOOD_THRESHOLDS,
  Ke as WEB_VITALS_NEEDS_IMPROVEMENT_THRESHOLDS,
  Xt as WEB_VITALS_POOR_THRESHOLDS,
  ze as getWebVitalsThresholds,
  vn as tracelog
};
