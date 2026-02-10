const Br = 9e5;
const Wr = 120, Gr = 8192, Xr = 10, Qr = 10, jr = 20;
const zr = 1e3, Kr = 500, Yr = 100;
const w = "data-tlog", lt = [
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
], ct = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"], ut = [
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
const m = {
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
}, dt = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<embed\b[^>]*>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi
], I = "tlog", F = `${I}:qa_mode`, be = `${I}:uid`, Ge = "tlog_mode", Le = "qa", Ae = "qa_off", ht = (s) => s ? `${I}:${s}:queue` : `${I}:queue`, ft = (s) => s ? `${I}:${s}:session` : `${I}:session`, mt = (s) => s ? `${I}:${s}:broadcast` : `${I}:broadcast`, Me = (s, e) => `${I}:${s}:session_counts:${e}`, Ce = 10080 * 60 * 1e3, Re = `${I}:session_counts_last_cleanup`, Ne = 3600 * 1e3;
var H = /* @__PURE__ */ ((s) => (s.Localhost = "localhost:8080", s.Fail = "localhost:9999", s))(H || {}), A = /* @__PURE__ */ ((s) => (s.Mobile = "mobile", s.Tablet = "tablet", s.Desktop = "desktop", s.Unknown = "unknown", s))(A || {}), le = /* @__PURE__ */ ((s) => (s.EVENT = "event", s.QUEUE = "queue", s))(le || {});
class P extends Error {
  constructor(e, t) {
    super(e), this.statusCode = t, this.name = "PermanentError", Error.captureStackTrace && Error.captureStackTrace(this, P);
  }
}
var d = /* @__PURE__ */ ((s) => (s.PAGE_VIEW = "page_view", s.CLICK = "click", s.SCROLL = "scroll", s.SESSION_START = "session_start", s.CUSTOM = "custom", s.WEB_VITALS = "web_vitals", s.ERROR = "error", s.VIEWPORT_VISIBLE = "viewport_visible", s))(d || {}), j = /* @__PURE__ */ ((s) => (s.UP = "up", s.DOWN = "down", s))(j || {}), x = /* @__PURE__ */ ((s) => (s.JS_ERROR = "js_error", s.PROMISE_REJECTION = "promise_rejection", s))(x || {}), Y = /* @__PURE__ */ ((s) => (s.QA = "qa", s))(Y || {});
const qr = (s) => s.type === d.SCROLL && "scroll_data" in s && s.scroll_data.is_primary === !0, Jr = (s) => s.type === d.SCROLL && "scroll_data" in s && s.scroll_data.is_primary === !1;
class $ extends Error {
  constructor(e, t, r) {
    super(e), this.errorCode = t, this.layer = r, this.name = this.constructor.name, Error.captureStackTrace && Error.captureStackTrace(this, this.constructor);
  }
}
class f extends $ {
  constructor(e, t = "config") {
    super(e, "APP_CONFIG_INVALID", t);
  }
}
class gt extends $ {
  constructor(e, t = "config") {
    super(e, "SESSION_TIMEOUT_INVALID", t);
  }
}
class Oe extends $ {
  constructor(e, t = "config") {
    super(e, "SAMPLING_RATE_INVALID", t);
  }
}
class U extends $ {
  constructor(e, t = "config") {
    super(e, "INTEGRATION_INVALID", t);
  }
}
class Zr extends $ {
  constructor(e, t, r = "runtime") {
    super(e, "INITIALIZATION_TIMEOUT", r), this.timeoutMs = t;
  }
}
const Xe = "background: #ff9800; color: white; font-weight: bold; padding: 2px 8px; border-radius: 3px;", Qe = "background: #9e9e9e; color: white; font-weight: bold; padding: 2px 8px; border-radius: 3px;", Et = "background: #d32f2f; color: white; font-weight: bold; padding: 2px 8px; border-radius: 3px;", St = (s, e) => {
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
}, pt = () => {
  if (typeof window > "u" || typeof sessionStorage > "u")
    return !1;
  try {
    return sessionStorage.getItem(F) === "true";
  } catch {
    return !1;
  }
}, a = (s, e, t) => {
  const { error: r, data: n, showToClient: i = !1, style: o, visibility: l } = t ?? {}, c = r ? St(e, r) : `[TraceLog] ${e}`, u = s === "error" ? "error" : s === "warn" ? "warn" : "log";
  if (!Tt(l, i))
    return;
  const g = _t(l, o), p = n !== void 0 ? ce(n) : void 0;
  vt(u, c, g, p);
}, Tt = (s, e) => s === "critical" ? !0 : s === "qa" || e ? pt() : !1, _t = (s, e) => e !== void 0 && e !== "" ? e : s === "critical" ? Et : "", vt = (s, e, t, r) => {
  const n = t !== void 0 && t !== "", i = n ? `%c${e}` : e;
  r !== void 0 ? n ? console[s](i, t, r) : console[s](i, r) : n ? console[s](i, t) : console[s](i);
}, ce = (s) => {
  const e = {}, t = ["token", "password", "secret", "key", "apikey", "api_key", "sessionid", "session_id"];
  for (const [r, n] of Object.entries(s)) {
    const i = r.toLowerCase();
    if (t.some((o) => i.includes(o))) {
      e[r] = "[REDACTED]";
      continue;
    }
    n !== null && typeof n == "object" && !Array.isArray(n) ? e[r] = ce(n) : Array.isArray(n) ? e[r] = n.map(
      (o) => o !== null && typeof o == "object" && !Array.isArray(o) ? ce(o) : o
    ) : e[r] = n;
  }
  return e;
};
let ue, je;
const It = () => {
  typeof window < "u" && !ue && (ue = window.matchMedia("(pointer: coarse)"), je = window.matchMedia("(hover: none)"));
}, q = "Unknown", wt = (s) => {
  const e = s.userAgentData?.platform;
  if (e != null && e !== "") {
    if (/windows/i.test(e)) return "Windows";
    if (/macos/i.test(e)) return "macOS";
    if (/android/i.test(e)) return "Android";
    if (/linux/i.test(e)) return "Linux";
    if (/chromeos/i.test(e)) return "ChromeOS";
    if (/ios/i.test(e)) return "iOS";
  }
  const t = navigator.userAgent;
  return /Windows/i.test(t) ? "Windows" : /iPhone|iPad|iPod/i.test(t) ? "iOS" : /Mac OS X|Macintosh/i.test(t) ? "macOS" : /Android/i.test(t) ? "Android" : /CrOS/i.test(t) ? "ChromeOS" : /Linux/i.test(t) ? "Linux" : q;
}, yt = (s) => {
  const e = s.userAgentData?.brands;
  if (e != null && e.length > 0) {
    const n = e.filter((i) => !/not.?a.?brand|chromium/i.test(i.brand))[0];
    if (n != null) {
      const i = n.brand;
      return /google chrome/i.test(i) ? "Chrome" : /microsoft edge/i.test(i) ? "Edge" : /opera/i.test(i) ? "Opera" : i;
    }
  }
  const t = navigator.userAgent;
  return /Edg\//i.test(t) ? "Edge" : /OPR\//i.test(t) ? "Opera" : /Chrome/i.test(t) ? "Chrome" : /Firefox/i.test(t) ? "Firefox" : /Safari/i.test(t) && !/Chrome/i.test(t) ? "Safari" : q;
}, bt = () => {
  try {
    const s = navigator;
    if (s.userAgentData != null && typeof s.userAgentData.mobile == "boolean") {
      const c = s.userAgentData.platform;
      return c != null && c !== "" && /ipad|tablet/i.test(c) ? A.Tablet : s.userAgentData.mobile ? A.Mobile : A.Desktop;
    }
    It();
    const e = window.innerWidth, t = ue?.matches ?? !1, r = je?.matches ?? !1, n = "ontouchstart" in window || navigator.maxTouchPoints > 0, i = navigator.userAgent.toLowerCase(), o = /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/.test(i), l = /tablet|ipad|android(?!.*mobile)/.test(i);
    return e <= 767 || o && n ? A.Mobile : e >= 768 && e <= 1024 || l || t && r && n ? A.Tablet : A.Desktop;
  } catch (s) {
    return a("debug", "Device detection failed, defaulting to desktop", { error: s }), A.Desktop;
  }
}, Lt = () => {
  try {
    const s = navigator;
    return {
      type: bt(),
      os: wt(s),
      browser: yt(s)
    };
  } catch (s) {
    return a("debug", "Device info detection failed, using defaults", { error: s }), {
      type: A.Desktop,
      os: q,
      browser: q
    };
  }
}, ze = [
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
], Pe = 500, De = 5e3, z = 50, At = z * 2, Ke = 1, Mt = 1e3, Ct = 10, Ve = 5e3, Rt = 6e4, es = {
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
}, ke = {
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
}, Nt = {
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
}, de = "needs-improvement", Ue = (s = de) => {
  switch (s) {
    case "all":
      return { LCP: 0, FCP: 0, CLS: 0, INP: 0, TTFB: 0, LONG_TASK: 0 };
    // Track everything
    case "needs-improvement":
      return ke;
    case "poor":
      return Nt;
    default:
      return ke;
  }
}, Ot = 1e3, Pt = 50, Dt = "2.3.1", Vt = Dt, Ye = () => typeof window < "u" && typeof sessionStorage < "u", kt = () => {
  try {
    const s = new URLSearchParams(window.location.search);
    s.delete(Ge);
    const e = s.toString(), t = window.location.pathname + (e ? "?" + e : "") + window.location.hash;
    window.history.replaceState({}, "", t);
  } catch {
  }
}, Ut = () => {
  if (!Ye())
    return !1;
  try {
    const e = new URLSearchParams(window.location.search).get(Ge), t = sessionStorage.getItem(F);
    let r = null;
    return e === Le ? (r = !0, sessionStorage.setItem(F, "true"), a("info", "QA Mode ACTIVE", {
      visibility: "qa",
      style: Xe
    })) : e === Ae && (r = !1, sessionStorage.setItem(F, "false"), a("info", "QA Mode DISABLED", {
      visibility: "qa",
      style: Qe
    })), (e === Le || e === Ae) && kt(), r ?? t === "true";
  } catch {
    return !1;
  }
}, Ht = (s) => {
  if (Ye())
    try {
      sessionStorage.setItem(F, s ? "true" : "false"), a("info", s ? "QA Mode ACTIVE" : "QA Mode DISABLED", {
        visibility: "qa",
        style: s ? Xe : Qe
      });
    } catch {
      a("debug", "Cannot set QA mode: sessionStorage unavailable");
    }
}, xt = [
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
], He = (s) => {
  const e = s.toLowerCase().split(".");
  if (e.length <= 2)
    return s.toLowerCase();
  const t = e.slice(-2).join(".");
  return xt.includes(t) ? e.slice(-3).join(".") : e.slice(-2).join(".");
}, Ft = (s, e) => s === e ? !0 : He(s) === He(e), se = () => {
  const s = document.referrer;
  if (!s)
    return "Direct";
  try {
    const e = new URL(s).hostname.toLowerCase(), t = window.location.hostname.toLowerCase();
    return Ft(e, t) ? "Direct" : s;
  } catch (e) {
    return a("debug", "Failed to parse referrer URL, using raw value", { error: e, data: { referrer: s } }), s;
  }
}, ne = () => {
  const s = new URLSearchParams(window.location.search), e = {};
  return ct.forEach((r) => {
    const n = s.get(r);
    if (n) {
      const i = r.split("utm_")[1];
      e[i] = n;
    }
  }), Object.keys(e).length ? e : void 0;
}, $t = () => typeof crypto < "u" && crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (s) => {
  const e = Math.random() * 16 | 0;
  return (s === "x" ? e : e & 3 | 8).toString(16);
});
let G = 0, X = 0;
const Bt = () => {
  let s = Date.now();
  s < X && (s = X), s === X ? G = (G + 1) % 1e3 : G = 0, X = s;
  const e = G.toString().padStart(3, "0");
  let t = "";
  try {
    if (typeof crypto < "u" && crypto.getRandomValues) {
      const r = crypto.getRandomValues(new Uint8Array(3));
      r && (t = Array.from(r, (n) => n.toString(16).padStart(2, "0")).join(""));
    }
  } catch {
  }
  return t || (t = Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")), `${s}-${e}-${t}`;
}, qe = (s, e = !1) => {
  try {
    const t = new URL(s), r = t.protocol === "https:", n = t.protocol === "http:";
    return r || e && n;
  } catch {
    return !1;
  }
}, Wt = (s) => {
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
    if (!qe(i))
      throw new Error("Generated URL failed validation");
    return i;
  } catch (e) {
    throw new Error(`Invalid SaaS URL configuration: ${e instanceof Error ? e.message : String(e)}`);
  }
}, Gt = (s) => {
  const e = {};
  s.integrations?.tracelog?.projectId && (e.saas = Wt(s.integrations.tracelog.projectId));
  const t = s.integrations?.custom?.collectApiUrl;
  if (t) {
    const r = s.integrations?.custom?.allowHttp ?? !1;
    if (!qe(t, r))
      throw new Error("Invalid custom API URL");
    e.custom = t;
  }
  return e;
}, he = (s, e = []) => {
  if (!s || typeof s != "string")
    return a("warn", "Invalid URL provided to normalizeUrl", { data: { type: typeof s } }), s || "";
  try {
    const t = new URL(s), r = t.searchParams, n = [.../* @__PURE__ */ new Set([...ut, ...e])];
    let i = !1;
    const o = [];
    return n.forEach((c) => {
      r.has(c) && (r.delete(c), i = !0, o.push(c));
    }), !i && s.includes("?") ? s : (t.search = r.toString(), t.toString());
  } catch (t) {
    return a("warn", "URL normalization failed, returning original", { error: t, data: { urlLength: s?.length } }), s;
  }
}, xe = (s) => {
  if (!s || typeof s != "string" || s.trim().length === 0)
    return "";
  let e = s;
  s.length > 1e3 && (e = s.slice(0, Math.max(0, 1e3)));
  let t = 0;
  for (const n of dt) {
    const i = e;
    e = e.replace(n, ""), i !== e && t++;
  }
  return t > 0 && a("warn", "XSS patterns detected and removed", {
    data: {
      patternMatches: t,
      valueLength: s.length
    }
  }), e.trim();
}, fe = (s, e = 0) => {
  if (s == null)
    return null;
  if (typeof s == "string")
    return xe(s);
  if (typeof s == "number")
    return !Number.isFinite(s) || s < -Number.MAX_SAFE_INTEGER || s > Number.MAX_SAFE_INTEGER ? 0 : s;
  if (typeof s == "boolean")
    return s;
  if (e > 10)
    return null;
  if (Array.isArray(s))
    return s.slice(0, 100).map((n) => fe(n, e + 1)).filter((n) => n !== null);
  if (typeof s == "object") {
    const t = {}, n = Object.entries(s).slice(0, 20);
    for (const [i, o] of n) {
      const l = xe(i);
      if (l) {
        const c = fe(o, e + 1);
        c !== null && (t[l] = c);
      }
    }
    return t;
  }
  return null;
}, Xt = (s) => {
  if (typeof s != "object" || s === null)
    return {};
  try {
    const e = fe(s);
    return typeof e == "object" && e !== null ? e : {};
  } catch (e) {
    const t = e instanceof Error ? e.message : String(e);
    throw new Error(`[TraceLog] Metadata sanitization failed: ${t}`);
  }
}, Qt = (s) => {
  if (s !== void 0 && (s === null || typeof s != "object"))
    throw new f("Configuration must be an object", "config");
  if (s) {
    if (s.sessionTimeout !== void 0 && (typeof s.sessionTimeout != "number" || s.sessionTimeout < 3e4 || s.sessionTimeout > 864e5))
      throw new gt(m.INVALID_SESSION_TIMEOUT, "config");
    if (s.globalMetadata !== void 0 && (typeof s.globalMetadata != "object" || s.globalMetadata === null))
      throw new f(m.INVALID_GLOBAL_METADATA, "config");
    if (s.integrations && zt(s.integrations), s.sensitiveQueryParams !== void 0) {
      if (!Array.isArray(s.sensitiveQueryParams))
        throw new f(m.INVALID_SENSITIVE_QUERY_PARAMS, "config");
      for (const e of s.sensitiveQueryParams)
        if (typeof e != "string")
          throw new f("All sensitive query params must be strings", "config");
    }
    if (s.errorSampling !== void 0 && (typeof s.errorSampling != "number" || s.errorSampling < 0 || s.errorSampling > 1))
      throw new Oe(m.INVALID_ERROR_SAMPLING_RATE, "config");
    if (s.samplingRate !== void 0 && (typeof s.samplingRate != "number" || s.samplingRate < 0 || s.samplingRate > 1))
      throw new Oe(m.INVALID_SAMPLING_RATE, "config");
    if (s.primaryScrollSelector !== void 0) {
      if (typeof s.primaryScrollSelector != "string" || !s.primaryScrollSelector.trim())
        throw new f(m.INVALID_PRIMARY_SCROLL_SELECTOR, "config");
      if (s.primaryScrollSelector !== "window")
        try {
          document.querySelector(s.primaryScrollSelector);
        } catch {
          throw new f(
            `${m.INVALID_PRIMARY_SCROLL_SELECTOR_SYNTAX}: "${s.primaryScrollSelector}"`,
            "config"
          );
        }
    }
    if (s.pageViewThrottleMs !== void 0 && (typeof s.pageViewThrottleMs != "number" || s.pageViewThrottleMs < 0))
      throw new f(m.INVALID_PAGE_VIEW_THROTTLE, "config");
    if (s.clickThrottleMs !== void 0 && (typeof s.clickThrottleMs != "number" || s.clickThrottleMs < 0))
      throw new f(m.INVALID_CLICK_THROTTLE, "config");
    if (s.maxSameEventPerMinute !== void 0 && (typeof s.maxSameEventPerMinute != "number" || s.maxSameEventPerMinute <= 0))
      throw new f(m.INVALID_MAX_SAME_EVENT_PER_MINUTE, "config");
    if (s.sendIntervalMs !== void 0 && (!Number.isFinite(s.sendIntervalMs) || s.sendIntervalMs < 1e3 || s.sendIntervalMs > 6e4))
      throw new f(m.INVALID_SEND_INTERVAL, "config");
    if (s.viewport !== void 0 && jt(s.viewport), s.webVitalsMode !== void 0) {
      if (typeof s.webVitalsMode != "string")
        throw new f(
          `Invalid webVitalsMode type: ${typeof s.webVitalsMode}. Must be a string`,
          "config"
        );
      const e = ["all", "needs-improvement", "poor"];
      if (!e.includes(s.webVitalsMode))
        throw new f(
          `Invalid webVitalsMode: "${s.webVitalsMode}". Must be one of: ${e.join(", ")}`,
          "config"
        );
    }
    if (s.webVitalsThresholds !== void 0) {
      if (typeof s.webVitalsThresholds != "object" || s.webVitalsThresholds === null || Array.isArray(s.webVitalsThresholds))
        throw new f("webVitalsThresholds must be an object", "config");
      const e = ["LCP", "FCP", "CLS", "INP", "TTFB", "LONG_TASK"];
      for (const [t, r] of Object.entries(s.webVitalsThresholds)) {
        if (!e.includes(t))
          throw new f(
            `Invalid Web Vitals threshold key: "${t}". Must be one of: ${e.join(", ")}`,
            "config"
          );
        if (typeof r != "number" || !Number.isFinite(r) || r < 0)
          throw new f(
            `Invalid Web Vitals threshold value for ${t}: ${r}. Must be a non-negative finite number`,
            "config"
          );
      }
    }
  }
}, jt = (s) => {
  if (typeof s != "object" || s === null)
    throw new f(m.INVALID_VIEWPORT_CONFIG, "config");
  if (!s.elements || !Array.isArray(s.elements))
    throw new f(m.INVALID_VIEWPORT_ELEMENTS, "config");
  if (s.elements.length === 0)
    throw new f(m.INVALID_VIEWPORT_ELEMENTS, "config");
  const e = /* @__PURE__ */ new Set();
  for (const t of s.elements) {
    if (!t.selector || typeof t.selector != "string" || !t.selector.trim())
      throw new f(m.INVALID_VIEWPORT_ELEMENT, "config");
    const r = t.selector.trim();
    if (e.has(r))
      throw new f(
        `Duplicate viewport selector found: "${r}". Each selector should appear only once.`,
        "config"
      );
    if (e.add(r), t.id !== void 0 && (typeof t.id != "string" || !t.id.trim()))
      throw new f(m.INVALID_VIEWPORT_ELEMENT_ID, "config");
    if (t.name !== void 0 && (typeof t.name != "string" || !t.name.trim()))
      throw new f(m.INVALID_VIEWPORT_ELEMENT_NAME, "config");
  }
  if (s.threshold !== void 0 && (typeof s.threshold != "number" || s.threshold < 0 || s.threshold > 1))
    throw new f(m.INVALID_VIEWPORT_THRESHOLD, "config");
  if (s.minDwellTime !== void 0 && (typeof s.minDwellTime != "number" || s.minDwellTime < 0))
    throw new f(m.INVALID_VIEWPORT_MIN_DWELL_TIME, "config");
  if (s.cooldownPeriod !== void 0 && (typeof s.cooldownPeriod != "number" || s.cooldownPeriod < 0))
    throw new f(m.INVALID_VIEWPORT_COOLDOWN_PERIOD, "config");
  if (s.maxTrackedElements !== void 0 && (typeof s.maxTrackedElements != "number" || s.maxTrackedElements <= 0))
    throw new f(m.INVALID_VIEWPORT_MAX_TRACKED_ELEMENTS, "config");
}, zt = (s) => {
  if (s) {
    if (s.tracelog && (!s.tracelog.projectId || typeof s.tracelog.projectId != "string" || s.tracelog.projectId.trim() === ""))
      throw new U(m.INVALID_TRACELOG_PROJECT_ID, "config");
    if (s.custom) {
      if (!s.custom.collectApiUrl || typeof s.custom.collectApiUrl != "string" || s.custom.collectApiUrl.trim() === "")
        throw new U(m.INVALID_CUSTOM_API_URL, "config");
      if (s.custom.allowHttp !== void 0 && typeof s.custom.allowHttp != "boolean")
        throw new U("allowHttp must be a boolean", "config");
      const e = s.custom.collectApiUrl.trim();
      if (!e.startsWith("http://") && !e.startsWith("https://"))
        throw new U('Custom API URL must start with "http://" or "https://"', "config");
      if (!(s.custom.allowHttp ?? !1) && e.startsWith("http://"))
        throw new U(
          "Custom API URL must use HTTPS in production. Set allowHttp: true in integration config to allow HTTP (not recommended)",
          "config"
        );
    }
  }
}, Kt = (s) => {
  Qt(s);
  const e = {
    ...s ?? {},
    sessionTimeout: s?.sessionTimeout ?? 9e5,
    globalMetadata: s?.globalMetadata ?? {},
    sensitiveQueryParams: s?.sensitiveQueryParams ?? [],
    errorSampling: s?.errorSampling ?? Ke,
    samplingRate: s?.samplingRate ?? 1,
    pageViewThrottleMs: s?.pageViewThrottleMs ?? 1e3,
    clickThrottleMs: s?.clickThrottleMs ?? 300,
    maxSameEventPerMinute: s?.maxSameEventPerMinute ?? 60,
    sendIntervalMs: s?.sendIntervalMs ?? 1e4
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
}, me = (s, e = /* @__PURE__ */ new Set()) => {
  if (s == null)
    return !0;
  const t = typeof s;
  return t === "string" || t === "number" || t === "boolean" ? !0 : t === "function" || t === "symbol" || t === "bigint" || e.has(s) ? !1 : (e.add(s), Array.isArray(s) ? s.every((r) => me(r, e)) : t === "object" ? Object.values(s).every((r) => me(r, e)) : !1);
}, Yt = (s) => typeof s != "object" || s === null ? !1 : me(s), qt = (s) => typeof s != "string" ? {
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
} : { valid: !0 }, Fe = (s, e, t) => {
  const r = Xt(e), n = t && t === "customEvent" ? `${t} "${s}" metadata error` : `${s} metadata error`;
  if (!Yt(r))
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
}, Je = (s, e, t) => {
  if (Array.isArray(e)) {
    const r = [], n = t && t === "customEvent" ? `${t} "${s}" metadata error` : `${s} metadata error`;
    for (let i = 0; i < e.length; i++) {
      const o = e[i];
      if (typeof o != "object" || o === null || Array.isArray(o))
        return {
          valid: !1,
          error: `${n}: array item at index ${i} must be an object.`
        };
      const l = Fe(s, o, t);
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
  return Fe(s, e, t);
}, Jt = (s, e) => {
  const t = qt(s);
  if (!t.valid)
    return a("error", "Event name validation failed", {
      data: { eventName: s, error: t.error }
    }), t;
  if (!e)
    return { valid: !0 };
  const r = Je(s, e, "customEvent");
  return r.valid || a("error", "Event metadata validation failed", {
    data: {
      eventName: s,
      error: r.error
    }
  }), r;
};
class Zt {
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
function Ze(s, e, t) {
  try {
    const r = e(s);
    return r === null ? null : typeof r == "object" && r !== null && "type" in r ? r : (a("warn", `beforeSend transformer returned invalid data, using original [${t}]`), s);
  } catch (r) {
    return a("error", `beforeSend transformer threw error, using original event [${t}]`, {
      error: r,
      visibility: "critical"
    }), s;
  }
}
function er(s, e, t) {
  return s.map((r) => Ze(r, e, t)).filter((r) => r !== null);
}
function et(s, e, t) {
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
      data: { eventCount: s.events.length },
      visibility: "critical"
    }), s;
  }
}
const ie = {};
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
    return ie[e];
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
    ie[e] = t;
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
    return { ...ie };
  }
}
class $e extends v {
  storeManager;
  integrationId;
  apiUrl;
  transformers;
  staticHeaders;
  customHeadersProvider;
  lastPermanentErrorLog = null;
  recoveryInProgress = !1;
  lastMetadataTimestamp = 0;
  pendingControllers = /* @__PURE__ */ new Set();
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
  constructor(e, t, r, n = {}, i = {}, o) {
    if (super(), t && !r || !t && r)
      throw new Error("SenderManager: integrationId and apiUrl must either both be provided or both be undefined");
    this.storeManager = e, this.integrationId = t, this.apiUrl = r, this.transformers = n, this.staticHeaders = i, this.customHeadersProvider = o;
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
    const e = this.get("userId") || "anonymous", t = ht(e);
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
   * **Custom Headers Limitation**: Custom headers set via `setCustomHeaders()` are NOT applied
   * to sendBeacon requests due to browser API limitations. The sendBeacon API only supports
   * Content-Type header via Blob. For scenarios requiring custom headers, ensure async
   * sends complete before page unload.
   *
   * @param body - Event queue to send
   * @returns `true` if send succeeded or was skipped, `false` if failed
   *
   * @see sendEventsQueue for async send with persistence
   * @see src/managers/README.md (lines 82-139) for send details
   */
  sendEventsQueueSync(e) {
    return this.shouldSkipSend() ? !0 : this.apiUrl?.includes(H.Fail) ? (a(
      "warn",
      `Fail mode: simulating network failure (sync)${this.integrationId ? ` [${this.integrationId}]` : ""}`,
      {
        data: { events: e.events.length }
      }
    ), !1) : this.apiUrl?.includes(H.Localhost) ? (a(
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
      return r instanceof P ? (this.logPermanentError("Permanent error, not retrying", r), this.clearPersistedEvents(), t?.onFailure?.(), !1) : (this.persistEvents(e), t?.onFailure?.(), !1);
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
      if (t instanceof P) {
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
    const r = er(
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
    return t ? et(e, t, this.integrationId || "SenderManager") : e;
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
    if (this.apiUrl?.includes(H.Fail))
      return a("debug", `Fail mode: simulating network failure${this.integrationId ? ` [${this.integrationId}]` : ""}`, {
        data: { events: r.events.length }
      }), !1;
    if (this.apiUrl?.includes(H.Localhost))
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
        if (l instanceof P)
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
    const r = new AbortController();
    this.pendingControllers.add(r);
    const n = setTimeout(() => {
      r.abort();
    }, 15e3);
    try {
      const i = this.getCustomHeaders(), o = await fetch(e, {
        method: "POST",
        body: t,
        keepalive: !0,
        credentials: "include",
        signal: r.signal,
        headers: {
          ...i,
          "Content-Type": "application/json"
        }
      });
      if (!o.ok)
        throw o.status >= 400 && o.status < 500 && o.status !== 408 && o.status !== 429 ? new P(`HTTP ${o.status}: ${o.statusText}`, o.status) : new Error(`HTTP ${o.status}: ${o.statusText}`);
      return o;
    } finally {
      clearTimeout(n), this.pendingControllers.delete(r);
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
   * **Idempotency Token**:
   * - Generated in this method using generateEventId()
   * - Same token persists across all retry attempts of the same batch (same payload string)
   * - Backend can use this to distinguish retries from genuine duplicates
   *
   * @param body - EventsQueue to send
   * @returns Object with `url` (API endpoint) and `payload` (JSON string)
   * @private
   */
  prepareRequest(e) {
    let t = Date.now();
    t < this.lastMetadataTimestamp && (t = this.lastMetadataTimestamp), this.lastMetadataTimestamp = t;
    const r = {
      ...e,
      _metadata: {
        referer: typeof window < "u" ? window.location.href : void 0,
        timestamp: t,
        client_version: Vt
      }
    };
    return {
      url: this.apiUrl || "",
      payload: JSON.stringify(r)
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
      return a("debug", `Failed to persist events${this.integrationId ? ` [${this.integrationId}]` : ""}`, { error: t }), !1;
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
    const r = Date.now();
    (!this.lastPermanentErrorLog || this.lastPermanentErrorLog.statusCode !== t.statusCode || r - this.lastPermanentErrorLog.timestamp >= Rt) && (a("error", `${e}${this.integrationId ? ` [${this.integrationId}]` : ""}`, {
      data: { status: t.statusCode, message: t.message }
    }), this.lastPermanentErrorLog = { statusCode: t.statusCode, timestamp: r });
  }
}
class tr extends v {
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
    const t = this.now(), r = Date.now();
    return this.detectedSkew = r - t, Math.abs(this.detectedSkew) > 3e4 && a("warn", "Significant clock skew detected", {
      data: {
        skewMs: this.detectedSkew,
        skewMinutes: (this.detectedSkew / 1e3 / 60).toFixed(2),
        monotonicTime: new Date(t).toISOString(),
        systemTime: new Date(r).toISOString()
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
    const r = this.now(), n = e - r;
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
const rr = new Set(Object.values(d));
class sr extends v {
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
   */
  constructor(e, t = null, r = {}, n = {}, i) {
    super(), this.emitter = t, this.transformers = r, this.timeManager = new tr(), this.dataSenders = [];
    const o = this.get("collectApiUrls");
    o?.saas && this.dataSenders.push(new $e(e, "saas", o.saas, r)), o?.custom && this.dataSenders.push(
      new $e(
        e,
        "custom",
        o.custom,
        r,
        n,
        i
      )
    ), this.saveSessionCountsDebounced = this.debounce((l) => {
      this.saveSessionCounts(l);
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
        onSuccess: (r, n, i) => {
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
    from_page_url: r,
    scroll_data: n,
    click_data: i,
    custom_event: o,
    web_vitals: l,
    error_data: c,
    viewport_data: u,
    page_view: S
  }) {
    if (!e) {
      a("error", "Event type is required - event will be ignored");
      return;
    }
    if (!rr.has(e)) {
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
        from_page_url: r,
        scroll_data: n,
        click_data: i,
        custom_event: o,
        web_vitals: l,
        error_data: c,
        viewport_data: u,
        page_view: S
      });
      return;
    }
    this.lastSessionId !== g && (this.lastSessionId = g, this.sessionEventCounts = this.loadSessionCounts(g));
    const p = e === d.SESSION_START;
    if (p && a("debug", "Processing SESSION_START event", {
      data: { sessionId: g }
    }), !p && !this.checkRateLimit())
      return;
    const E = e;
    if (!p) {
      if (this.sessionEventCounts.total >= 1e3) {
        a("warn", "Session event limit reached", {
          data: {
            type: E,
            total: this.sessionEventCounts.total,
            limit: 1e3
          }
        });
        return;
      }
      const T = this.getTypeLimitForEvent(E);
      if (T) {
        const re = this.sessionEventCounts[E];
        if (re !== void 0 && re >= T) {
          a("warn", "Session event type limit reached", {
            data: {
              type: E,
              count: re,
              limit: T
            }
          });
          return;
        }
      }
    }
    if (E === d.CUSTOM && o?.name) {
      const T = this.get("config")?.maxSameEventPerMinute ?? 60;
      if (!this.checkPerEventRateLimit(o.name, T))
        return;
    }
    const ye = E === d.SESSION_START, W = t || this.get("pageUrl"), k = this.buildEventPayload({
      type: E,
      page_url: W,
      from_page_url: r,
      scroll_data: n,
      click_data: i,
      custom_event: o,
      web_vitals: l,
      error_data: c,
      viewport_data: u,
      page_view: S
    });
    if (k && !(!p && !this.shouldSample())) {
      if (ye) {
        const T = this.get("sessionId");
        if (!T) {
          a("error", "Session start event requires sessionId - event will be ignored");
          return;
        }
        if (this.get("hasStartSession")) {
          a("debug", "Duplicate session_start detected", {
            data: { sessionId: T }
          });
          return;
        }
        this.set("hasStartSession", !0);
      }
      if (!this.isDuplicateEvent(k)) {
        if (this.get("mode") === Y.QA) {
          if (E === d.CUSTOM && o) {
            a("info", `Custom Event: ${o.name}`, {
              visibility: "qa",
              data: {
                name: o.name,
                ...o.metadata && { metadata: o.metadata }
              }
            }), this.emitEvent(k);
            return;
          }
          if (E === d.VIEWPORT_VISIBLE && u) {
            const T = u.name || u.id || u.selector;
            a("info", `Viewport Visible: ${T}`, {
              visibility: "qa",
              data: {
                selector: u.selector,
                ...u.name && { name: u.name },
                ...u.id && { id: u.id },
                visibilityRatio: u.visibilityRatio,
                dwellTime: u.dwellTime
              }
            }), this.emitEvent(k);
            return;
          }
        }
        if (this.addToQueue(k), !p) {
          this.sessionEventCounts.total++, this.sessionEventCounts[E] !== void 0 && this.sessionEventCounts[E]++;
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
    this.pendingEventsBuffer = [], t.forEach((r) => {
      this.track(r);
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
    const t = this.buildEventsPayload(), r = [...this.eventsQueue], n = r.map((i) => i.id);
    if (this.dataSenders.length === 0)
      return this.removeProcessedEvents(n), this.clearSendTimeout(), this.emitEventsQueue(t), e ? !0 : Promise.resolve(!0);
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
          data: { eventCount: r.length }
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
        const t = [...this.eventsQueue], r = t.map((l) => l.id), n = this.dataSenders.map(
          async (l) => l.sendEventsQueue(e, {
            onSuccess: () => {
            },
            onFailure: () => {
            }
          })
        ), i = await Promise.allSettled(n);
        if (i.some((l) => this.isSuccessfulResult(l))) {
          this.consecutiveSendFailures = 0, this.removeProcessedEvents(r), this.emitEventsQueue(e);
          const l = i.filter((c) => !this.isSuccessfulResult(c)).length;
          l > 0 && a("debug", "Periodic send completed with some failures, removed from queue and persisted per-integration", {
            data: { eventCount: t.length, failedCount: l }
          });
        } else
          this.consecutiveSendFailures++, a("debug", "Periodic send complete failure, events kept in queue for retry", {
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
    const r = t.map((c) => e.get(c)).filter((c) => !!c).sort((c, u) => c.type === d.SESSION_START && u.type !== d.SESSION_START ? -1 : u.type === d.SESSION_START && c.type !== d.SESSION_START ? 1 : c.timestamp - u.timestamp);
    let n = {
      user_id: this.get("userId"),
      session_id: this.get("sessionId"),
      device: this.get("device"),
      events: r,
      ...this.get("config")?.globalMetadata && { global_metadata: this.get("config")?.globalMetadata }
    };
    const i = this.get("collectApiUrls"), o = !!(i?.custom || i?.saas), l = this.transformers.beforeBatch;
    if (!o && l) {
      const c = et(n, l, "EventManager");
      c !== null && (n = c);
    }
    return n;
  }
  buildEventPayload(e) {
    const t = e.page_url ?? this.get("pageUrl"), r = this.timeManager.now(), n = this.timeManager.validateTimestamp(r);
    n.valid || a("warn", "Event timestamp validation failed", {
      data: { type: e.type, error: n.error }
    });
    const i = this.get("sessionReferrer"), o = this.get("sessionUtm");
    let l = {
      id: Bt(),
      type: e.type,
      page_url: t,
      timestamp: r,
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
    const c = this.get("collectApiUrls"), u = !!c?.custom, S = !!c?.saas, g = u || S, p = u && S, E = this.transformers.beforeSend;
    if (E && (!g || u && !p)) {
      const W = Ze(l, E, "EventManager");
      if (W === null)
        return null;
      l = W;
    }
    return l;
  }
  isDuplicateEvent(e) {
    const t = Date.now(), r = this.createEventFingerprint(e), n = this.recentEventFingerprints.get(r);
    return n && t - n < 1e3 ? (this.recentEventFingerprints.set(r, t), !0) : (this.recentEventFingerprints.set(r, t), this.recentEventFingerprints.size > 1500 && this.pruneOldFingerprints(), this.recentEventFingerprints.size > 3e3 && (this.recentEventFingerprints.clear(), this.recentEventFingerprints.set(r, t), a("debug", "Event fingerprint cache exceeded hard limit, cleared", {
      data: { hardLimit: 3e3 }
    })), !1);
  }
  pruneOldFingerprints() {
    const e = Date.now(), t = 1e3 * 10;
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
      const t = this.eventsQueue.findIndex((n) => n.type !== d.SESSION_START), r = t >= 0 ? this.eventsQueue.splice(t, 1)[0] : this.eventsQueue.shift();
      a("warn", "Event queue overflow, oldest non-critical event removed", {
        data: {
          maxLength: 100,
          currentLength: this.eventsQueue.length,
          removedEventType: r?.type,
          wasCritical: r?.type === d.SESSION_START
        }
      });
    }
    this.consecutiveSendFailures >= 5 && (this.consecutiveSendFailures = 0), this.scheduleSendTimeout(), this.eventsQueue.length >= 50 && this.sendEventsQueue();
  }
  scheduleSendTimeout() {
    if (this.sendTimeoutId !== null || this.consecutiveSendFailures >= 5) return;
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
    this.emitter && this.emitter.emit(le.EVENT, e);
  }
  emitEventsQueue(e) {
    this.emitter && this.emitter.emit(le.QUEUE, e);
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
    const t = this.get("userId") || "anonymous", r = Me(t, e);
    try {
      const n = localStorage.getItem(r);
      if (!n)
        return this.getInitialCounts();
      const i = JSON.parse(n);
      return i._timestamp && Date.now() - i._timestamp > Ce ? (a("debug", "Session counts expired, clearing", {
        data: { sessionId: e, age: Date.now() - i._timestamp }
      }), localStorage.removeItem(r), this.getInitialCounts()) : typeof i.total == "number" && typeof i[d.CLICK] == "number" && typeof i[d.PAGE_VIEW] == "number" && typeof i[d.CUSTOM] == "number" && typeof i[d.VIEWPORT_VISIBLE] == "number" && typeof i[d.SCROLL] == "number" ? {
        total: i.total,
        [d.CLICK]: i[d.CLICK],
        [d.PAGE_VIEW]: i[d.PAGE_VIEW],
        [d.CUSTOM]: i[d.CUSTOM],
        [d.VIEWPORT_VISIBLE]: i[d.VIEWPORT_VISIBLE],
        [d.SCROLL]: i[d.SCROLL]
      } : (a("warn", "Invalid session counts structure in localStorage, resetting", {
        data: { sessionId: e, parsed: i }
      }), localStorage.removeItem(r), a("debug", "Session counts removed due to invalid/corrupted data", {
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
        const e = localStorage.getItem(Re);
        if (e) {
          const i = Date.now() - parseInt(e, 10);
          if (i < Ne) {
            a("debug", "Skipping session counts cleanup (throttled)", {
              data: { timeSinceLastCleanup: i, throttleMs: Ne }
            });
            return;
          }
        }
        const t = this.get("userId") || "anonymous", r = `${I}:${t}:session_counts:`, n = [];
        for (let i = 0; i < localStorage.length; i++) {
          const o = localStorage.key(i);
          if (o?.startsWith(r))
            try {
              const l = localStorage.getItem(o);
              if (l) {
                const c = JSON.parse(l);
                c._timestamp && Date.now() - c._timestamp > Ce && n.push(o);
              }
            } catch {
            }
        }
        n.forEach((i) => {
          localStorage.removeItem(i), a("debug", "Cleaned up expired session counts", { data: { key: i } });
        }), n.length > 0 && a("info", `Cleaned up ${n.length} expired session counts entries`), localStorage.setItem(Re, Date.now().toString());
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
    const t = this.get("userId") || "anonymous", r = Me(t, e);
    try {
      const n = {
        ...this.sessionEventCounts,
        _timestamp: Date.now(),
        _version: 1
      };
      localStorage.setItem(r, JSON.stringify(n));
    } catch (n) {
      a("warn", "Failed to persist session counts to localStorage", {
        error: n,
        data: { sessionId: e }
      });
    }
  }
}
class nr {
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
    const t = e.getItem(be);
    if (t)
      return t;
    const r = $t();
    return e.setItem(be, r), r;
  }
}
const ir = /^\d{13}-[a-z0-9]{9}$/;
class or extends v {
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
  constructor(e, t, r) {
    super(), this.storageManager = e, this.eventManager = t, this.projectId = r;
  }
  initCrossTabSync() {
    if (typeof BroadcastChannel > "u") {
      a("debug", "BroadcastChannel not supported");
      return;
    }
    const e = this.getProjectId();
    this.broadcastChannel = new BroadcastChannel(mt(e)), this.broadcastChannel.onmessage = (t) => {
      const { action: r, sessionId: n, timestamp: i, projectId: o } = t.data ?? {};
      o === e && (r === "session_start" && n && typeof i == "number" && i > Date.now() - 5e3 ? (this.set("sessionId", n), this.persistSession(n, i), this.isTracking && this.setupSessionTimeout()) : r && r !== "session_start" && a("debug", "Ignored BroadcastChannel message with unknown action", { data: { action: r } }));
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
    if (!ir.test(e.id))
      return a("warn", "Invalid session ID format recovered from storage, clearing", {
        data: { sessionId: e.id }
      }), this.clearStoredSession(), null;
    const t = this.get("config")?.sessionTimeout ?? 9e5;
    return Date.now() - e.lastActivity > t ? (this.clearStoredSession(), null) : e.id;
  }
  persistSession(e, t = Date.now(), r, n) {
    this.saveStoredSession({
      id: e,
      lastActivity: t,
      ...r && { referrer: r },
      ...n && { utm: n }
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
    return ft(this.getProjectId());
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
      a("debug", "Session tracking already active");
      return;
    }
    const e = this.recoverSession(), t = e ?? this.generateSessionId();
    let r, n;
    if (e) {
      const i = this.loadStoredSession();
      r = i?.referrer ?? se(), n = i?.utm ?? ne();
    } else
      r = se(), n = ne();
    a("debug", "Session tracking initialized", {
      data: {
        sessionId: t,
        wasRecovered: !!e,
        willEmitSessionStart: !e,
        sessionReferrer: r,
        hasUtm: !!n
      }
    }), this.isTracking = !0;
    try {
      this.set("sessionId", t), this.set("sessionReferrer", r), this.set("sessionUtm", n), this.persistSession(t, Date.now(), r, n), this.initCrossTabSync(), this.shareSession(t), e ? a("debug", "Session recovered, skipping SESSION_START", {
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
    const e = this.generateSessionId(), t = se(), r = ne();
    a("debug", "Renewing session after timeout", {
      data: { newSessionId: e }
    }), this.set("sessionId", e), this.set("sessionReferrer", t), this.set("sessionUtm", r), this.persistSession(e, Date.now(), t, r), this.cleanupCrossTabSync(), this.initCrossTabSync(), this.shareSession(e), this.eventManager.track({
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
    const r = this.get("config")?.sessionTimeout ?? 9e5;
    return Date.now() - t.lastActivity > r;
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
class ar extends v {
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
      this.sessionManager = new or(this.storageManager, this.eventManager, t), this.sessionManager.startTracking(), this.eventManager.flushPendingEvents();
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
class lr extends v {
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
    const e = window.location.href, t = he(e, this.get("config").sensitiveQueryParams);
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
    const e = he(window.location.href, this.get("config").sensitiveQueryParams), t = this.extractPageViewData();
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
class cr extends v {
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
        const S = this.extractTrackingData(o);
        if (S) {
          const g = this.createCustomEventData(S);
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
    for (const t of lt)
      try {
        if (e.matches(t))
          return e;
        const r = e.closest(t);
        if (r)
          return r;
      } catch (r) {
        a("debug", "Invalid selector in element search", { error: r, data: { selector: t } });
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
    const t = e.getAttribute(`${w}-name`), r = e.getAttribute(`${w}-value`);
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
    for (const r of ze) {
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
class ur extends v {
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
          const S = Date.now();
          this.processScrollEvent(l, u, S);
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
    return e > t ? j.DOWN : j.UP;
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
    const c = this.getViewportHeight(t), u = this.getScrollHeight(t), S = this.getScrollDirection(i, r), g = this.calculateScrollDepth(i, u, c);
    let p;
    n > 0 ? p = o - n : e.firstScrollEventTime !== null ? p = o - e.firstScrollEventTime : p = 250;
    const E = Math.round(l / p * 1e3);
    return g > e.maxDepthReached && (e.maxDepthReached = g), e.lastScrollPos = i, {
      depth: g,
      direction: S,
      velocity: E,
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
class dr extends v {
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
      a("debug", "ViewportHandler: Invalid threshold, must be between 0 and 1");
      return;
    }
    if (r < 0) {
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
    for (const r of this.config.elements)
      try {
        const n = document.querySelectorAll(r.selector);
        for (const i of Array.from(n)) {
          if (t >= e) {
            a("debug", "ViewportHandler: Maximum tracked elements reached", {
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
        a("debug", `ViewportHandler: Invalid selector "${r.selector}"`, { error: n });
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
    if (e.element.hasAttribute(`${w}-ignore`))
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
        a("debug", "ViewportHandler: document.body not available, skipping MutationObserver setup");
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
class hr {
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
class fr extends v {
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
    super(), this.eventManager = e, this.vitalThresholds = Ue(de);
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
    const e = this.get("config"), t = e?.webVitalsMode ?? de;
    this.vitalThresholds = Ue(t), e?.webVitalsThresholds && (this.vitalThresholds = { ...this.vitalThresholds, ...e.webVitalsThresholds }), await this.initWebVitals(), this.observeLongTasks();
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
        a("debug", "Failed to disconnect performance observer", { error: r, data: { observerIndex: t } });
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
      const { onLCP: e, onCLS: t, onFCP: r, onTTFB: n, onINP: i } = await Promise.resolve().then(() => $r), o = (l) => (c) => {
        const u = Number(c.value.toFixed(2));
        this.sendVital({ type: l, value: u });
      };
      e(o("LCP"), { reportAllChanges: !1 }), t(o("CLS"), { reportAllChanges: !1 }), r(o("FCP"), { reportAllChanges: !1 }), n(o("TTFB"), { reportAllChanges: !1 }), i(o("INP"), { reportAllChanges: !1 });
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
        for (const r of t) {
          const n = Number(r.duration.toFixed(2)), i = Date.now();
          i - this.lastLongTaskSentAt >= Ot && (this.shouldSendVital("LONG_TASK", n) && this.trackWebVital("LONG_TASK", n), this.lastLongTaskSentAt = i);
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
      else if (this.reportedByNav.set(t, /* @__PURE__ */ new Set([e.type])), this.navigationHistory.push(t), this.navigationHistory.length > Pt) {
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
      const t = e.startTime || performance.now(), r = ++this.navigationCounter, n = `${t.toFixed(2)}_${window.location.pathname}`;
      return r > 1 ? `${n}_${r}` : n;
    } catch (e) {
      return a("debug", "Failed to get navigation ID", { error: e }), null;
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
      return i.observe(r ?? { type: e, buffered: !0 }), n || this.observers.push(i), !0;
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
    const r = this.vitalThresholds[e];
    return !(typeof r == "number" && t <= r);
  }
}
class mr extends v {
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
    if (e - this.burstWindowStart > Mt && (this.errorBurstCounter = 0, this.burstWindowStart = e), this.errorBurstCounter++, this.errorBurstCounter > Ct)
      return this.burstBackoffUntil = e + Ve, a("debug", "Error burst detected - entering cooldown", {
        data: {
          errorsInWindow: this.errorBurstCounter,
          cooldownMs: Ve
        }
      }), !1;
    const r = this.get("config")?.errorSampling ?? Ke;
    return Math.random() < r;
  }
  handleError = (e) => {
    if (!this.shouldSample())
      return;
    const t = this.sanitize(e.message || "Unknown error");
    this.shouldSuppressError(x.JS_ERROR, t) || this.eventManager.track({
      type: d.ERROR,
      error_data: {
        type: x.JS_ERROR,
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
    this.shouldSuppressError(x.PROMISE_REJECTION, r) || this.eventManager.track({
      type: d.ERROR,
      error_data: {
        type: x.PROMISE_REJECTION,
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
    let t = e.length > Pe ? e.slice(0, Pe) + "..." : e;
    for (const r of ze) {
      const n = new RegExp(r.source, r.flags);
      t = t.replace(n, "[REDACTED]");
    }
    return t;
  }
  shouldSuppressError(e, t) {
    const r = Date.now(), n = `${e}:${t}`, i = this.recentErrors.get(n);
    return i && r - i < De ? (this.recentErrors.set(n, r), !0) : (this.recentErrors.set(n, r), this.recentErrors.size > At ? (this.recentErrors.clear(), this.recentErrors.set(n, r), !1) : (this.recentErrors.size > z && this.pruneOldErrors(), !1));
  }
  pruneOldErrors() {
    const e = Date.now();
    for (const [n, i] of this.recentErrors.entries())
      e - i > De && this.recentErrors.delete(n);
    if (this.recentErrors.size <= z)
      return;
    const t = Array.from(this.recentErrors.entries()).sort((n, i) => n[1] - i[1]), r = this.recentErrors.size - z;
    for (let n = 0; n < r; n += 1) {
      const i = t[n];
      i && this.recentErrors.delete(i[0]);
    }
  }
}
class gr extends v {
  isInitialized = !1;
  suppressNextScrollTimer = null;
  pageUnloadHandler = null;
  emitter = new Zt();
  transformers = {};
  customHeadersProvider;
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
    if (this.isInitialized)
      return { sessionId: this.get("sessionId") ?? "" };
    this.managers.storage = new hr();
    try {
      this.setupState(e);
      const t = e.integrations?.custom?.headers ?? {};
      return this.managers.event = new sr(
        this.managers.storage,
        this.emitter,
        this.transformers,
        t,
        this.customHeadersProvider
      ), this.initializeHandlers(), this.setupPageLifecycleListeners(), await this.managers.event.recoverPersistedEvents().catch((r) => {
        a("warn", "Failed to recover persisted events", { error: r });
      }), this.isInitialized = !0, { sessionId: this.get("sessionId") ?? "" };
    } catch (t) {
      this.destroy(!0);
      const r = t instanceof Error ? t.message : String(t);
      throw new Error(`[TraceLog] TraceLog initialization failed: ${r}`);
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
    const { valid: n, error: i, sanitizedMetadata: o } = Jt(e, r);
    if (!n) {
      if (this.get("mode") === Y.QA)
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
      } catch (r) {
        a("warn", "Failed to stop tracking", { error: r });
      }
    }), this.suppressNextScrollTimer && (clearTimeout(this.suppressNextScrollTimer), this.suppressNextScrollTimer = null), this.pageUnloadHandler && (window.removeEventListener("pagehide", this.pageUnloadHandler), window.removeEventListener("beforeunload", this.pageUnloadHandler), this.pageUnloadHandler = null), this.managers.event?.flushImmediatelySync(), this.managers.event?.stop(), this.emitter.removeAllListeners(), this.transformers.beforeSend = void 0, this.transformers.beforeBatch = void 0, this.customHeadersProvider = void 0, this.set("suppressNextScroll", !1), this.set("sessionId", null), this.isInitialized = !1, this.handlers = {}, this.managers = {});
  }
  setupState(e = {}) {
    this.set("config", e);
    const t = nr.getId(this.managers.storage);
    this.set("userId", t);
    const r = Gt(e);
    this.set("collectApiUrls", r);
    const n = Lt();
    this.set("device", n);
    const i = he(window.location.href, e.sensitiveQueryParams);
    this.set("pageUrl", i), Ut() && this.set("mode", Y.QA);
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
    const t = Je("Global", e, "globalMetadata");
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
  setupPageLifecycleListeners() {
    this.pageUnloadHandler = () => {
      this.managers.event?.flushImmediatelySync();
    }, window.addEventListener("pagehide", this.pageUnloadHandler), window.addEventListener("beforeunload", this.pageUnloadHandler);
  }
  initializeHandlers() {
    const e = this.get("config");
    this.handlers.session = new ar(
      this.managers.storage,
      this.managers.event
    ), this.handlers.session.startTracking();
    const t = () => {
      this.set("suppressNextScroll", !0), this.suppressNextScrollTimer && clearTimeout(this.suppressNextScrollTimer), this.suppressNextScrollTimer = window.setTimeout(() => {
        this.set("suppressNextScroll", !1);
      }, 500);
    };
    this.handlers.pageView = new lr(this.managers.event, t), this.handlers.pageView.startTracking(), this.handlers.click = new cr(this.managers.event), this.handlers.click.startTracking(), this.handlers.scroll = new ur(this.managers.event), this.handlers.scroll.startTracking(), this.handlers.performance = new fr(this.managers.event), this.handlers.performance.startTracking().catch((r) => {
      a("warn", "Failed to start performance tracking", { error: r });
    }), this.handlers.error = new mr(this.managers.event), this.handlers.error.startTracking(), e.viewport && (this.handlers.viewport = new dr(this.managers.event), this.handlers.viewport.startTracking());
  }
}
const O = [], M = [];
let N = null, h = null, C = !1, _ = !1, R = null;
const Er = async (s) => typeof window > "u" || typeof document > "u" ? { sessionId: "" } : (_ = !1, window.__traceLogDisabled === !0 ? { sessionId: "" } : h ? { sessionId: h.getSessionId() ?? "" } : (C && R || (C = !0, R = (async () => {
  try {
    const e = Kt(s ?? {}), t = new gr();
    try {
      O.forEach(({ event: o, callback: l }) => {
        t.on(o, l);
      }), O.length = 0, M.forEach(({ hook: o, fn: l }) => {
        o === "beforeSend" ? t.setTransformer("beforeSend", l) : t.setTransformer("beforeBatch", l);
      }), M.length = 0, N && (t.setCustomHeaders(N), N = null);
      const r = t.init(e), n = new Promise((o, l) => {
        setTimeout(() => {
          l(new Error("[TraceLog] Initialization timeout after 10000ms"));
        }, 1e4);
      }), i = await Promise.race([r, n]);
      return h = t, i;
    } catch (r) {
      try {
        t.destroy(!0);
      } catch (n) {
        a("error", "Failed to cleanup partially initialized app", { error: n });
      }
      throw r;
    }
  } catch (e) {
    throw h = null, e;
  } finally {
    C = !1, R = null;
  }
})()), R)), Sr = (s, e) => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!h)
      throw new Error("[TraceLog] TraceLog not initialized. Please call init() first.");
    if (_)
      throw new Error("[TraceLog] Cannot send events while TraceLog is being destroyed");
    h.sendCustomEvent(s, e);
  }
}, pr = (s, e) => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!h || C) {
      O.push({ event: s, callback: e });
      return;
    }
    h.on(s, e);
  }
}, Tr = (s, e) => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!h) {
      const t = O.findIndex((r) => r.event === s && r.callback === e);
      t !== -1 && O.splice(t, 1);
      return;
    }
    h.off(s, e);
  }
};
function _r(s, e) {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (typeof e != "function")
      throw new Error(`[TraceLog] Transformer must be a function, received: ${typeof e}`);
    if (!h || C) {
      const t = M.findIndex((r) => r.hook === s);
      t !== -1 && M.splice(t, 1), M.push({ hook: s, fn: e });
      return;
    }
    if (_)
      throw new Error("[TraceLog] Cannot set transformers while TraceLog is being destroyed");
    s === "beforeSend" ? h.setTransformer("beforeSend", e) : h.setTransformer("beforeBatch", e);
  }
}
const vr = (s) => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!h) {
      const e = M.findIndex((t) => t.hook === s);
      e !== -1 && M.splice(e, 1);
      return;
    }
    if (_)
      throw new Error("[TraceLog] Cannot remove transformers while TraceLog is being destroyed");
    h.removeTransformer(s);
  }
}, Ir = (s) => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (typeof s != "function")
      throw new Error(`[TraceLog] Custom headers provider must be a function, received: ${typeof s}`);
    if (!h || C) {
      N = s;
      return;
    }
    if (_)
      throw new Error("[TraceLog] Cannot set custom headers while TraceLog is being destroyed");
    h.setCustomHeaders(s);
  }
}, wr = () => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!h) {
      N = null;
      return;
    }
    if (_)
      throw new Error("[TraceLog] Cannot remove custom headers while TraceLog is being destroyed");
    h.removeCustomHeaders();
  }
}, yr = () => typeof window > "u" || typeof document > "u" ? !1 : h !== null, br = () => typeof window > "u" || typeof document > "u" || !h ? null : h.getSessionId(), Lr = () => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (_)
      throw new Error("[TraceLog] Destroy operation already in progress");
    if (!h) {
      _ = !1;
      return;
    }
    _ = !0;
    try {
      h.destroy(), h = null, C = !1, R = null, O.length = 0, M.length = 0, N = null, _ = !1;
    } catch (s) {
      h = null, C = !1, R = null, O.length = 0, M.length = 0, N = null, _ = !1, a("warn", "Error during destroy, forced cleanup completed", { error: s });
    }
  }
}, Ar = (s) => {
  typeof window > "u" || typeof document > "u" || Ht(s);
}, Mr = (s) => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!h)
      throw new Error("[TraceLog] TraceLog not initialized. Please call init() first.");
    if (_)
      throw new Error("[TraceLog] Cannot update metadata while TraceLog is being destroyed");
    h.updateGlobalMetadata(s);
  }
}, Cr = (s) => {
  if (!(typeof window > "u" || typeof document > "u")) {
    if (!h)
      throw new Error("[TraceLog] TraceLog not initialized. Please call init() first.");
    if (_)
      throw new Error("[TraceLog] Cannot update metadata while TraceLog is being destroyed");
    h.mergeGlobalMetadata(s);
  }
}, ts = {
  init: Er,
  event: Sr,
  on: pr,
  off: Tr,
  setTransformer: _r,
  removeTransformer: vr,
  setCustomHeaders: Ir,
  removeCustomHeaders: wr,
  isInitialized: yr,
  getSessionId: br,
  destroy: Lr,
  setQaMode: Ar,
  updateGlobalMetadata: Mr,
  mergeGlobalMetadata: Cr
};
var ge, tt = -1, V = function(s) {
  addEventListener("pageshow", (function(e) {
    e.persisted && (tt = e.timeStamp, s(e));
  }), !0);
}, ve = function() {
  var s = self.performance && performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
  if (s && s.responseStart > 0 && s.responseStart < performance.now()) return s;
}, Z = function() {
  var s = ve();
  return s && s.activationStart || 0;
}, b = function(s, e) {
  var t = ve(), r = "navigate";
  return tt >= 0 ? r = "back-forward-cache" : t && (document.prerendering || Z() > 0 ? r = "prerender" : document.wasDiscarded ? r = "restore" : t.type && (r = t.type.replace(/_/g, "-"))), { name: s, value: e === void 0 ? -1 : e, rating: "good", delta: 0, entries: [], id: "v4-".concat(Date.now(), "-").concat(Math.floor(8999999999999 * Math.random()) + 1e12), navigationType: r };
}, B = function(s, e, t) {
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
}, L = function(s, e, t, r) {
  var n, i;
  return function(o) {
    e.value >= 0 && (o || r) && ((i = e.value - (n || 0)) || n === void 0) && (n = e.value, e.delta = i, e.rating = (function(l, c) {
      return l > c[1] ? "poor" : l > c[0] ? "needs-improvement" : "good";
    })(e.value, t), s(e));
  };
}, Ie = function(s) {
  requestAnimationFrame((function() {
    return requestAnimationFrame((function() {
      return s();
    }));
  }));
}, ee = function(s) {
  document.addEventListener("visibilitychange", (function() {
    document.visibilityState === "hidden" && s();
  }));
}, we = function(s) {
  var e = !1;
  return function() {
    e || (s(), e = !0);
  };
}, D = -1, Be = function() {
  return document.visibilityState !== "hidden" || document.prerendering ? 1 / 0 : 0;
}, J = function(s) {
  document.visibilityState === "hidden" && D > -1 && (D = s.type === "visibilitychange" ? s.timeStamp : 0, Rr());
}, We = function() {
  addEventListener("visibilitychange", J, !0), addEventListener("prerenderingchange", J, !0);
}, Rr = function() {
  removeEventListener("visibilitychange", J, !0), removeEventListener("prerenderingchange", J, !0);
}, rt = function() {
  return D < 0 && (D = Be(), We(), V((function() {
    setTimeout((function() {
      D = Be(), We();
    }), 0);
  }))), { get firstHiddenTime() {
    return D;
  } };
}, te = function(s) {
  document.prerendering ? addEventListener("prerenderingchange", (function() {
    return s();
  }), !0) : s();
}, Ee = [1800, 3e3], st = function(s, e) {
  e = e || {}, te((function() {
    var t, r = rt(), n = b("FCP"), i = B("paint", (function(o) {
      o.forEach((function(l) {
        l.name === "first-contentful-paint" && (i.disconnect(), l.startTime < r.firstHiddenTime && (n.value = Math.max(l.startTime - Z(), 0), n.entries.push(l), t(!0)));
      }));
    }));
    i && (t = L(s, n, Ee, e.reportAllChanges), V((function(o) {
      n = b("FCP"), t = L(s, n, Ee, e.reportAllChanges), Ie((function() {
        n.value = performance.now() - o.timeStamp, t(!0);
      }));
    })));
  }));
}, Se = [0.1, 0.25], Nr = function(s, e) {
  e = e || {}, st(we((function() {
    var t, r = b("CLS", 0), n = 0, i = [], o = function(c) {
      c.forEach((function(u) {
        if (!u.hadRecentInput) {
          var S = i[0], g = i[i.length - 1];
          n && u.startTime - g.startTime < 1e3 && u.startTime - S.startTime < 5e3 ? (n += u.value, i.push(u)) : (n = u.value, i = [u]);
        }
      })), n > r.value && (r.value = n, r.entries = i, t());
    }, l = B("layout-shift", o);
    l && (t = L(s, r, Se, e.reportAllChanges), ee((function() {
      o(l.takeRecords()), t(!0);
    })), V((function() {
      n = 0, r = b("CLS", 0), t = L(s, r, Se, e.reportAllChanges), Ie((function() {
        return t();
      }));
    })), setTimeout(t, 0));
  })));
}, nt = 0, oe = 1 / 0, Q = 0, Or = function(s) {
  s.forEach((function(e) {
    e.interactionId && (oe = Math.min(oe, e.interactionId), Q = Math.max(Q, e.interactionId), nt = Q ? (Q - oe) / 7 + 1 : 0);
  }));
}, it = function() {
  return ge ? nt : performance.interactionCount || 0;
}, Pr = function() {
  "interactionCount" in performance || ge || (ge = B("event", Or, { type: "event", buffered: !0, durationThreshold: 0 }));
}, y = [], K = /* @__PURE__ */ new Map(), ot = 0, Dr = function() {
  var s = Math.min(y.length - 1, Math.floor((it() - ot) / 50));
  return y[s];
}, Vr = [], kr = function(s) {
  if (Vr.forEach((function(n) {
    return n(s);
  })), s.interactionId || s.entryType === "first-input") {
    var e = y[y.length - 1], t = K.get(s.interactionId);
    if (t || y.length < 10 || s.duration > e.latency) {
      if (t) s.duration > t.latency ? (t.entries = [s], t.latency = s.duration) : s.duration === t.latency && s.startTime === t.entries[0].startTime && t.entries.push(s);
      else {
        var r = { id: s.interactionId, latency: s.duration, entries: [s] };
        K.set(r.id, r), y.push(r);
      }
      y.sort((function(n, i) {
        return i.latency - n.latency;
      })), y.length > 10 && y.splice(10).forEach((function(n) {
        return K.delete(n.id);
      }));
    }
  }
}, at = function(s) {
  var e = self.requestIdleCallback || self.setTimeout, t = -1;
  return s = we(s), document.visibilityState === "hidden" ? s() : (t = e(s), ee(s)), t;
}, pe = [200, 500], Ur = function(s, e) {
  "PerformanceEventTiming" in self && "interactionId" in PerformanceEventTiming.prototype && (e = e || {}, te((function() {
    var t;
    Pr();
    var r, n = b("INP"), i = function(l) {
      at((function() {
        l.forEach(kr);
        var c = Dr();
        c && c.latency !== n.value && (n.value = c.latency, n.entries = c.entries, r());
      }));
    }, o = B("event", i, { durationThreshold: (t = e.durationThreshold) !== null && t !== void 0 ? t : 40 });
    r = L(s, n, pe, e.reportAllChanges), o && (o.observe({ type: "first-input", buffered: !0 }), ee((function() {
      i(o.takeRecords()), r(!0);
    })), V((function() {
      ot = it(), y.length = 0, K.clear(), n = b("INP"), r = L(s, n, pe, e.reportAllChanges);
    })));
  })));
}, Te = [2500, 4e3], ae = {}, Hr = function(s, e) {
  e = e || {}, te((function() {
    var t, r = rt(), n = b("LCP"), i = function(c) {
      e.reportAllChanges || (c = c.slice(-1)), c.forEach((function(u) {
        u.startTime < r.firstHiddenTime && (n.value = Math.max(u.startTime - Z(), 0), n.entries = [u], t());
      }));
    }, o = B("largest-contentful-paint", i);
    if (o) {
      t = L(s, n, Te, e.reportAllChanges);
      var l = we((function() {
        ae[n.id] || (i(o.takeRecords()), o.disconnect(), ae[n.id] = !0, t(!0));
      }));
      ["keydown", "click"].forEach((function(c) {
        addEventListener(c, (function() {
          return at(l);
        }), { once: !0, capture: !0 });
      })), ee(l), V((function(c) {
        n = b("LCP"), t = L(s, n, Te, e.reportAllChanges), Ie((function() {
          n.value = performance.now() - c.timeStamp, ae[n.id] = !0, t(!0);
        }));
      }));
    }
  }));
}, _e = [800, 1800], xr = function s(e) {
  document.prerendering ? te((function() {
    return s(e);
  })) : document.readyState !== "complete" ? addEventListener("load", (function() {
    return s(e);
  }), !0) : setTimeout(e, 0);
}, Fr = function(s, e) {
  e = e || {};
  var t = b("TTFB"), r = L(s, t, _e, e.reportAllChanges);
  xr((function() {
    var n = ve();
    n && (t.value = Math.max(n.responseStart - Z(), 0), t.entries = [n], r(!0), V((function() {
      t = b("TTFB", 0), (r = L(s, t, _e, e.reportAllChanges))(!0);
    })));
  }));
};
const $r = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  CLSThresholds: Se,
  FCPThresholds: Ee,
  INPThresholds: pe,
  LCPThresholds: Te,
  TTFBThresholds: _e,
  onCLS: Nr,
  onFCP: st,
  onINP: Ur,
  onLCP: Hr,
  onTTFB: Fr
}, Symbol.toStringTag, { value: "Module" }));
export {
  f as AppConfigValidationError,
  Br as DEFAULT_SESSION_TIMEOUT,
  de as DEFAULT_WEB_VITALS_MODE,
  A as DeviceType,
  le as EmitterEvent,
  x as ErrorType,
  d as EventType,
  Zr as InitializationTimeoutError,
  U as IntegrationValidationError,
  Yr as MAX_ARRAY_LENGTH,
  Qr as MAX_CUSTOM_EVENT_ARRAY_SIZE,
  Xr as MAX_CUSTOM_EVENT_KEYS,
  Wr as MAX_CUSTOM_EVENT_NAME_LENGTH,
  Gr as MAX_CUSTOM_EVENT_STRING_SIZE,
  jr as MAX_NESTED_OBJECT_KEYS,
  zr as MAX_STRING_LENGTH,
  Kr as MAX_STRING_LENGTH_IN_ARRAY,
  Y as Mode,
  ze as PII_PATTERNS,
  P as PermanentError,
  Oe as SamplingRateValidationError,
  j as ScrollDirection,
  gt as SessionTimeoutValidationError,
  H as SpecialApiUrl,
  $ as TraceLogValidationError,
  es as WEB_VITALS_GOOD_THRESHOLDS,
  ke as WEB_VITALS_NEEDS_IMPROVEMENT_THRESHOLDS,
  Nt as WEB_VITALS_POOR_THRESHOLDS,
  Ue as getWebVitalsThresholds,
  qr as isPrimaryScrollEvent,
  Jr as isSecondaryScrollEvent,
  ts as tracelog
};
