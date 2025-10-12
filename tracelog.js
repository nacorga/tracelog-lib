const Ft = 120, Gt = 8192, $t = 10, zt = 10, Qt = 20, Bt = 1;
const jt = 1e3, Xt = 500, Wt = 100;
const A = "data-tlog", Pe = [
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
], De = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"], ke = [
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
const S = {
  INVALID_SESSION_TIMEOUT: "Session timeout must be between 30000ms (30 seconds) and 86400000ms (24 hours)",
  INVALID_SAMPLING_RATE: "Sampling rate must be between 0 and 1",
  INVALID_ERROR_SAMPLING_RATE: "Error sampling must be between 0 and 1",
  INVALID_TRACELOG_PROJECT_ID: "TraceLog project ID is required when integration is enabled",
  INVALID_CUSTOM_API_URL: "Custom API URL is required when integration is enabled",
  INVALID_GOOGLE_ANALYTICS_ID: "Google Analytics measurement ID is required when integration is enabled",
  INVALID_GLOBAL_METADATA: "Global metadata must be an object",
  INVALID_SENSITIVE_QUERY_PARAMS: "Sensitive query params must be an array of strings",
  INVALID_PRIMARY_SCROLL_SELECTOR: "Primary scroll selector must be a non-empty string",
  INVALID_PRIMARY_SCROLL_SELECTOR_SYNTAX: "Invalid CSS selector syntax for primaryScrollSelector"
}, Ue = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<embed\b[^>]*>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi
];
var Y = /* @__PURE__ */ ((s) => (s.Localhost = "localhost:8080", s.Fail = "localhost:9999", s))(Y || {}), T = /* @__PURE__ */ ((s) => (s.Mobile = "mobile", s.Tablet = "tablet", s.Desktop = "desktop", s.Unknown = "unknown", s))(T || {}), K = /* @__PURE__ */ ((s) => (s.EVENT = "event", s.QUEUE = "queue", s))(K || {});
class M extends Error {
  constructor(e, t) {
    super(e), this.statusCode = t, this.name = "PermanentError", Error.captureStackTrace && Error.captureStackTrace(this, M);
  }
}
var d = /* @__PURE__ */ ((s) => (s.PAGE_VIEW = "page_view", s.CLICK = "click", s.SCROLL = "scroll", s.SESSION_START = "session_start", s.SESSION_END = "session_end", s.CUSTOM = "custom", s.WEB_VITALS = "web_vitals", s.ERROR = "error", s))(d || {}), U = /* @__PURE__ */ ((s) => (s.UP = "up", s.DOWN = "down", s))(U || {}), b = /* @__PURE__ */ ((s) => (s.JS_ERROR = "js_error", s.PROMISE_REJECTION = "promise_rejection", s))(b || {});
function Yt(s) {
  return s.type === "scroll" && "scroll_data" in s && s.scroll_data.is_primary === !0;
}
function Kt(s) {
  return s.type === "scroll" && "scroll_data" in s && s.scroll_data.is_primary === !1;
}
var C = /* @__PURE__ */ ((s) => (s.QA = "qa", s))(C || {});
class O extends Error {
  constructor(e, t, r) {
    super(e), this.errorCode = t, this.layer = r, this.name = this.constructor.name, Error.captureStackTrace && Error.captureStackTrace(this, this.constructor);
  }
}
class w extends O {
  constructor(e, t = "config") {
    super(e, "APP_CONFIG_INVALID", t);
  }
}
class He extends O {
  constructor(e, t = "config") {
    super(e, "SESSION_TIMEOUT_INVALID", t);
  }
}
class de extends O {
  constructor(e, t = "config") {
    super(e, "SAMPLING_RATE_INVALID", t);
  }
}
class v extends O {
  constructor(e, t = "config") {
    super(e, "INTEGRATION_INVALID", t);
  }
}
class qt extends O {
  constructor(e, t, r = "runtime") {
    super(e, "INITIALIZATION_TIMEOUT", r), this.timeoutMs = t;
  }
}
const xe = (s, e) => {
  if (e) {
    if (e instanceof Error) {
      const t = e.message.replace(/\s+at\s+.*$/gm, "").replace(/\(.*?:\d+:\d+\)/g, "");
      return `[TraceLog] ${s}: ${t}`;
    }
    return `[TraceLog] ${s}: ${e instanceof Error ? e.message : "Unknown error"}`;
  }
  return `[TraceLog] ${s}`;
}, l = (s, e, t) => {
  const { error: r, data: n, showToClient: i = !1 } = t ?? {}, a = r ? xe(e, r) : `[TraceLog] ${e}`, o = s === "error" ? "error" : s === "warn" ? "warn" : "log";
  if (!(s === "debug" || s === "info" && !i))
    if (n !== void 0) {
      const c = Ve(n);
      console[o](a, c);
    } else n !== void 0 ? console[o](a, n) : console[o](a);
}, Ve = (s) => {
  const e = {}, t = ["token", "password", "secret", "key", "apikey", "api_key", "sessionid", "session_id"];
  for (const [r, n] of Object.entries(s)) {
    const i = r.toLowerCase();
    t.some((a) => i.includes(a)) ? e[r] = "[REDACTED]" : e[r] = n;
  }
  return e;
};
let q, ve;
const Fe = () => {
  typeof window < "u" && !q && (q = window.matchMedia("(pointer: coarse)"), ve = window.matchMedia("(hover: none)"));
}, Ge = () => {
  try {
    const s = navigator;
    if (s.userAgentData && typeof s.userAgentData.mobile == "boolean")
      return s.userAgentData.platform && /ipad|tablet/i.test(s.userAgentData.platform) ? T.Tablet : s.userAgentData.mobile ? T.Mobile : T.Desktop;
    Fe();
    const e = window.innerWidth, t = q?.matches ?? !1, r = ve?.matches ?? !1, n = "ontouchstart" in window || navigator.maxTouchPoints > 0, i = navigator.userAgent.toLowerCase(), a = /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/.test(i), o = /tablet|ipad|android(?!.*mobile)/.test(i);
    return e <= 767 || a && n ? T.Mobile : e >= 768 && e <= 1024 || o || t && r && n ? T.Tablet : T.Desktop;
  } catch (s) {
    return l("warn", "Device detection failed, defaulting to desktop", { error: s }), T.Desktop;
  }
}, I = "tlog", he = `${I}:qa_mode`, $e = `${I}:uid`, ze = (s) => s ? `${I}:${s}:queue` : `${I}:queue`, Qe = (s) => s ? `${I}:${s}:session` : `${I}:session`, Be = (s) => s ? `${I}:${s}:broadcast` : `${I}:broadcast`, ye = {
  LCP: 4e3,
  FCP: 1800,
  CLS: 0.25,
  INP: 200,
  TTFB: 800,
  LONG_TASK: 50
}, je = 1e3, ae = [
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
], fe = 500, ge = 5e3, H = 50, Xe = H * 2, Ae = 1, We = 6e4, Se = "tlog_mode", Ye = "qa", Ke = () => {
  if (sessionStorage.getItem(he) === "true")
    return !0;
  const e = new URLSearchParams(window.location.search), r = e.get(Se) === Ye;
  if (r) {
    sessionStorage.setItem(he, "true"), e.delete(Se);
    const n = e.toString(), i = `${window.location.pathname}${n ? "?" + n : ""}${window.location.hash}`;
    try {
      window.history.replaceState({}, "", i);
    } catch (a) {
      l("warn", "History API not available, cannot replace URL", { error: a });
    }
    console.log(
      "%c[TraceLog] QA Mode ACTIVE",
      "background: #ff9800; color: white; font-weight: bold; padding: 2px 8px; border-radius: 3px;"
    );
  }
  return r;
}, Ee = () => {
  const s = new URLSearchParams(window.location.search), e = {};
  return De.forEach((r) => {
    const n = s.get(r);
    if (n) {
      const i = r.split("utm_")[1];
      e[i] = n;
    }
  }), Object.keys(e).length ? e : void 0;
}, qe = () => typeof crypto < "u" && crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (s) => {
  const e = Math.random() * 16 | 0;
  return (s === "x" ? e : e & 3 | 8).toString(16);
}), Je = () => {
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
}, me = (s, e = !1) => {
  try {
    const t = new URL(s), r = t.protocol === "https:", n = t.protocol === "http:";
    return r || e && n;
  } catch {
    return !1;
  }
}, Ze = (s) => {
  if (s.integrations?.tracelog?.projectId) {
    const n = new URL(window.location.href).hostname.split(".");
    if (n.length === 0)
      throw new Error("Invalid URL");
    const i = s.integrations.tracelog.projectId, a = n.slice(-2).join("."), o = `https://${i}.${a}/collect`;
    if (!me(o))
      throw new Error("Invalid URL");
    return o;
  }
  const e = s.integrations?.custom?.collectApiUrl;
  if (e) {
    const t = s.integrations?.custom?.allowHttp ?? !1;
    if (!me(e, t))
      throw new Error("Invalid URL");
    return e;
  }
  return "";
}, J = (s, e = []) => {
  try {
    const t = new URL(s), r = t.searchParams, n = [.../* @__PURE__ */ new Set([...ke, ...e])];
    let i = !1;
    const a = [];
    return n.forEach((c) => {
      r.has(c) && (r.delete(c), i = !0, a.push(c));
    }), !i && s.includes("?") ? s : (t.search = r.toString(), t.toString());
  } catch (t) {
    return l("warn", "URL normalization failed, returning original", { error: t, data: { url: s.slice(0, 100) } }), s;
  }
}, pe = (s) => {
  if (!s || typeof s != "string" || s.trim().length === 0)
    return "";
  let e = s;
  s.length > 1e3 && (e = s.slice(0, Math.max(0, 1e3)));
  let t = 0;
  for (const n of Ue) {
    const i = e;
    e = e.replace(n, ""), i !== e && t++;
  }
  return t > 0 && l("warn", "XSS patterns detected and removed", {
    data: {
      patternMatches: t,
      originalValue: s.slice(0, 100)
    }
  }), e = e.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#x27;").replaceAll("/", "&#x2F;"), e.trim();
}, Z = (s, e = 0) => {
  if (e > 3 || s == null)
    return null;
  if (typeof s == "string")
    return pe(s);
  if (typeof s == "number")
    return !Number.isFinite(s) || s < -Number.MAX_SAFE_INTEGER || s > Number.MAX_SAFE_INTEGER ? 0 : s;
  if (typeof s == "boolean")
    return s;
  if (Array.isArray(s))
    return s.slice(0, 100).map((n) => Z(n, e + 1)).filter((n) => n !== null);
  if (typeof s == "object") {
    const t = {}, n = Object.entries(s).slice(0, 20);
    for (const [i, a] of n) {
      const o = pe(i);
      if (o) {
        const c = Z(a, e + 1);
        c !== null && (t[o] = c);
      }
    }
    return t;
  }
  return null;
}, et = (s) => {
  if (typeof s != "object" || s === null)
    return {};
  try {
    const e = Z(s);
    return typeof e == "object" && e !== null ? e : {};
  } catch (e) {
    const t = e instanceof Error ? e.message : String(e);
    throw new Error(`[TraceLog] Metadata sanitization failed: ${t}`);
  }
}, tt = (s) => {
  if (s !== void 0 && (s === null || typeof s != "object"))
    throw new w("Configuration must be an object", "config");
  if (s) {
    if (s.sessionTimeout !== void 0 && (typeof s.sessionTimeout != "number" || s.sessionTimeout < 3e4 || s.sessionTimeout > 864e5))
      throw new He(S.INVALID_SESSION_TIMEOUT, "config");
    if (s.globalMetadata !== void 0 && (typeof s.globalMetadata != "object" || s.globalMetadata === null))
      throw new w(S.INVALID_GLOBAL_METADATA, "config");
    if (s.integrations && rt(s.integrations), s.sensitiveQueryParams !== void 0) {
      if (!Array.isArray(s.sensitiveQueryParams))
        throw new w(S.INVALID_SENSITIVE_QUERY_PARAMS, "config");
      for (const e of s.sensitiveQueryParams)
        if (typeof e != "string")
          throw new w("All sensitive query params must be strings", "config");
    }
    if (s.errorSampling !== void 0 && (typeof s.errorSampling != "number" || s.errorSampling < 0 || s.errorSampling > 1))
      throw new de(S.INVALID_ERROR_SAMPLING_RATE, "config");
    if (s.samplingRate !== void 0 && (typeof s.samplingRate != "number" || s.samplingRate < 0 || s.samplingRate > 1))
      throw new de(S.INVALID_SAMPLING_RATE, "config");
    if (s.primaryScrollSelector !== void 0) {
      if (typeof s.primaryScrollSelector != "string" || !s.primaryScrollSelector.trim())
        throw new w(S.INVALID_PRIMARY_SCROLL_SELECTOR, "config");
      if (s.primaryScrollSelector !== "window")
        try {
          document.querySelector(s.primaryScrollSelector);
        } catch {
          throw new w(
            `${S.INVALID_PRIMARY_SCROLL_SELECTOR_SYNTAX}: "${s.primaryScrollSelector}"`,
            "config"
          );
        }
    }
  }
}, rt = (s) => {
  if (s) {
    if (s.tracelog && (!s.tracelog.projectId || typeof s.tracelog.projectId != "string" || s.tracelog.projectId.trim() === ""))
      throw new v(S.INVALID_TRACELOG_PROJECT_ID, "config");
    if (s.custom) {
      if (!s.custom.collectApiUrl || typeof s.custom.collectApiUrl != "string" || s.custom.collectApiUrl.trim() === "")
        throw new v(S.INVALID_CUSTOM_API_URL, "config");
      if (s.custom.allowHttp !== void 0 && typeof s.custom.allowHttp != "boolean")
        throw new v("allowHttp must be a boolean", "config");
      const e = s.custom.collectApiUrl.trim();
      if (!e.startsWith("http://") && !e.startsWith("https://"))
        throw new v('Custom API URL must start with "http://" or "https://"', "config");
      if (!(s.custom.allowHttp ?? !1) && e.startsWith("http://"))
        throw new v(
          "Custom API URL must use HTTPS in production. Set allowHttp: true in integration config to allow HTTP (not recommended)",
          "config"
        );
    }
    if (s.googleAnalytics) {
      if (!s.googleAnalytics.measurementId || typeof s.googleAnalytics.measurementId != "string" || s.googleAnalytics.measurementId.trim() === "")
        throw new v(S.INVALID_GOOGLE_ANALYTICS_ID, "config");
      if (!s.googleAnalytics.measurementId.trim().match(/^(G-|UA-)/))
        throw new v('Google Analytics measurement ID must start with "G-" or "UA-"', "config");
    }
  }
}, st = (s) => {
  tt(s);
  const e = {
    ...s ?? {},
    sessionTimeout: s?.sessionTimeout ?? 9e5,
    globalMetadata: s?.globalMetadata ?? {},
    sensitiveQueryParams: s?.sensitiveQueryParams ?? [],
    errorSampling: s?.errorSampling ?? Ae,
    samplingRate: s?.samplingRate ?? 1
  };
  return e.integrations?.custom && (e.integrations.custom = {
    ...e.integrations.custom,
    allowHttp: e.integrations.custom.allowHttp ?? !1
  }), e;
}, nt = (s) => {
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
}, we = (s, e = 0) => {
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
          if (!t.every((a) => typeof a == "string"))
            return !1;
        } else if (!t.every((a) => nt(a)))
          return !1;
        continue;
      }
      if (r === "object" && e === 0) {
        if (!we(t, e + 1))
          return !1;
        continue;
      }
      return !1;
    }
  }
  return !0;
}, it = (s) => typeof s != "string" ? {
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
} : { valid: !0 }, _e = (s, e, t) => {
  const r = et(e), n = `${t} "${s}" metadata error`;
  if (!we(r))
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
  for (const [o, c] of Object.entries(r)) {
    if (Array.isArray(c)) {
      if (c.length > 10)
        return {
          valid: !1,
          error: `${n}: array property "${o}" is too large (max 10 items).`
        };
      for (const u of c)
        if (typeof u == "string" && u.length > 500)
          return {
            valid: !1,
            error: `${n}: array property "${o}" contains strings that are too long (max 500 characters).`
          };
    }
    if (typeof c == "string" && c.length > 1e3)
      return {
        valid: !1,
        error: `${n}: property "${o}" is too long (max 1000 characters).`
      };
  }
  return {
    valid: !0,
    sanitizedMetadata: r
  };
}, at = (s, e, t) => {
  if (Array.isArray(e)) {
    const r = [], n = `${t} "${s}" metadata error`;
    for (let i = 0; i < e.length; i++) {
      const a = e[i];
      if (typeof a != "object" || a === null || Array.isArray(a))
        return {
          valid: !1,
          error: `${n}: array item at index ${i} must be an object.`
        };
      const o = _e(s, a, t);
      if (!o.valid)
        return {
          valid: !1,
          error: `${n}: array item at index ${i} is invalid: ${o.error}`
        };
      o.sanitizedMetadata && r.push(o.sanitizedMetadata);
    }
    return {
      valid: !0,
      sanitizedMetadata: r
    };
  }
  return _e(s, e, t);
}, ot = (s, e) => {
  const t = it(s);
  if (!t.valid)
    return l("error", "Event name validation failed", {
      showToClient: !0,
      data: { eventName: s, error: t.error }
    }), t;
  if (!e)
    return { valid: !0 };
  const r = at(s, e, "customEvent");
  return r.valid || l("error", "Event metadata validation failed", {
    showToClient: !0,
    data: {
      eventName: s,
      error: r.error
    }
  }), r;
};
class lt {
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
const j = {};
class g {
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
class ct extends g {
  storeManager;
  lastPermanentErrorLog = null;
  constructor(e) {
    super(), this.storeManager = e;
  }
  getQueueStorageKey() {
    const e = this.get("userId") || "anonymous";
    return ze(e);
  }
  sendEventsQueueSync(e) {
    return this.shouldSkipSend() ? !0 : this.get("config")?.integrations?.custom?.collectApiUrl === Y.Fail ? (l("warn", "Fail mode: simulating network failure (sync)", {
      data: { events: e.events.length }
    }), !1) : this.sendQueueSyncInternal(e);
  }
  async sendEventsQueue(e, t) {
    try {
      const r = await this.send(e);
      return r ? (this.clearPersistedEvents(), t?.onSuccess?.(e.events.length, e.events, e)) : (this.persistEvents(e), t?.onFailure?.()), r;
    } catch (r) {
      return r instanceof M ? (this.logPermanentError("Permanent error, not retrying", r), this.clearPersistedEvents(), t?.onFailure?.(), !1) : (this.persistEvents(e), t?.onFailure?.(), !1);
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
      if (t instanceof M) {
        this.logPermanentError("Permanent error during recovery, clearing persisted events", t), this.clearPersistedEvents(), e?.onFailure?.();
        return;
      }
      l("error", "Failed to recover persisted events", { error: t });
    }
  }
  stop() {
  }
  async send(e) {
    if (this.shouldSkipSend())
      return this.simulateSuccessfulSend();
    if (this.get("config")?.integrations?.custom?.collectApiUrl === Y.Fail)
      return l("warn", "Fail mode: simulating network failure", {
        data: { events: e.events.length }
      }), !1;
    const { url: r, payload: n } = this.prepareRequest(e);
    try {
      return (await this.sendWithTimeout(r, n)).ok;
    } catch (i) {
      if (i instanceof M)
        throw i;
      return l("error", "Send request failed", {
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
        throw i.status >= 400 && i.status < 500 ? new M(`HTTP ${i.status}: ${i.statusText}`, i.status) : new Error(`HTTP ${i.status}: ${i.statusText}`);
      return i;
    } finally {
      clearTimeout(n);
    }
  }
  sendQueueSyncInternal(e) {
    const { url: t, payload: r } = this.prepareRequest(e), n = new Blob([r], { type: "application/json" });
    if (!this.isSendBeaconAvailable())
      return l("warn", "sendBeacon not available, persisting events for recovery"), this.persistEvents(e), !1;
    const i = navigator.sendBeacon(t, n);
    return i || (l("warn", "sendBeacon rejected request, persisting events for recovery"), this.persistEvents(e)), i;
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
      l("warn", "Failed to parse persisted data", { error: e }), this.clearPersistedEvents();
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
      return l("warn", "Failed to persist events", { error: t }), !1;
    }
  }
  clearPersistedEvents() {
    try {
      const e = this.getQueueStorageKey();
      this.storeManager.removeItem(e);
    } catch (e) {
      l("warn", "Failed to clear persisted events", { error: e });
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
    (!this.lastPermanentErrorLog || this.lastPermanentErrorLog.statusCode !== t.statusCode || r - this.lastPermanentErrorLog.timestamp >= We) && (l("error", e, {
      data: { status: t.statusCode, message: t.message }
    }), this.lastPermanentErrorLog = { statusCode: t.statusCode, timestamp: r });
  }
}
class ut extends g {
  googleAnalytics;
  dataSender;
  emitter;
  eventsQueue = [];
  pendingEventsBuffer = [];
  lastEventFingerprint = null;
  lastEventTime = 0;
  sendIntervalId = null;
  rateLimitCounter = 0;
  rateLimitWindowStart = 0;
  constructor(e, t = null, r = null) {
    super(), this.googleAnalytics = t, this.dataSender = new ct(e), this.emitter = r;
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
        l("warn", "Failed to recover persisted events");
      }
    });
  }
  track({
    type: e,
    page_url: t,
    from_page_url: r,
    scroll_data: n,
    click_data: i,
    custom_event: a,
    web_vitals: o,
    error_data: c,
    session_end_reason: u
  }) {
    if (!e) {
      l("error", "Event type is required - event will be ignored");
      return;
    }
    if (!this.get("sessionId")) {
      this.pendingEventsBuffer.length >= 100 && (this.pendingEventsBuffer.shift(), l("warn", "Pending events buffer full - dropping oldest event", {
        data: { maxBufferSize: 100 }
      })), this.pendingEventsBuffer.push({
        type: e,
        page_url: t,
        from_page_url: r,
        scroll_data: n,
        click_data: i,
        custom_event: a,
        web_vitals: o,
        error_data: c,
        session_end_reason: u
      });
      return;
    }
    const f = e === d.SESSION_START || e === d.SESSION_END;
    if (!f && !this.checkRateLimit())
      return;
    const _ = e, D = _ === d.SESSION_START, Q = t || this.get("pageUrl"), B = this.buildEventPayload({
      type: _,
      page_url: Q,
      from_page_url: r,
      scroll_data: n,
      click_data: i,
      custom_event: a,
      web_vitals: o,
      error_data: c,
      session_end_reason: u
    });
    if (!(!f && !this.shouldSample())) {
      if (D) {
        const ue = this.get("sessionId");
        if (!ue) {
          l("error", "Session start event requires sessionId - event will be ignored");
          return;
        }
        if (this.get("hasStartSession")) {
          l("warn", "Duplicate session_start detected", {
            data: { sessionId: ue }
          });
          return;
        }
        this.set("hasStartSession", !0);
      }
      if (!this.isDuplicateEvent(B)) {
        if (this.get("mode") === C.QA && _ === d.CUSTOM && a) {
          console.log("[TraceLog] Event", {
            name: a.name,
            ...a.metadata && { metadata: a.metadata }
          }), this.emitEvent(B);
          return;
        }
        this.addToQueue(B);
      }
    }
  }
  stop() {
    this.sendIntervalId && (clearInterval(this.sendIntervalId), this.sendIntervalId = null), this.eventsQueue = [], this.pendingEventsBuffer = [], this.lastEventFingerprint = null, this.lastEventTime = 0, this.rateLimitCounter = 0, this.rateLimitWindowStart = 0, this.dataSender.stop();
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
  flushEvents(e) {
    if (this.eventsQueue.length === 0)
      return e ? !0 : Promise.resolve(!0);
    const t = this.buildEventsPayload(), r = [...this.eventsQueue], n = r.map((i) => i.id);
    if (e) {
      const i = this.dataSender.sendEventsQueueSync(t);
      return i && (this.removeProcessedEvents(n), this.clearSendInterval(), this.emitEventsQueue(t)), i;
    } else
      return this.dataSender.sendEventsQueue(t, {
        onSuccess: () => {
          this.removeProcessedEvents(n), this.clearSendInterval(), this.emitEventsQueue(t);
        },
        onFailure: () => {
          l("warn", "Async flush failed", {
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
        l("warn", "Events send failed, keeping in queue", {
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
    const t = e.type === d.SESSION_START, r = e.page_url ?? this.get("pageUrl");
    return {
      id: Je(),
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
      ...t && Ee() && { utm: Ee() }
    };
  }
  isDuplicateEvent(e) {
    const t = Date.now(), r = this.createEventFingerprint(e);
    return this.lastEventFingerprint === r && t - this.lastEventTime < 500 ? !0 : (this.lastEventFingerprint = r, this.lastEventTime = t, !1);
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
        (n) => n.type !== d.SESSION_START && n.type !== d.SESSION_END
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
    this.sendIntervalId || this.startSendInterval(), this.handleGoogleAnalyticsIntegration(e);
  }
  startSendInterval() {
    this.sendIntervalId = window.setInterval(() => {
      this.eventsQueue.length > 0 && this.sendEventsQueue();
    }, 1e4);
  }
  handleGoogleAnalyticsIntegration(e) {
    if (this.googleAnalytics && e.type === d.CUSTOM && e.custom_event) {
      if (this.get("mode") === C.QA)
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
    return e - this.rateLimitWindowStart > 1e3 && (this.rateLimitCounter = 0, this.rateLimitWindowStart = e), this.rateLimitCounter >= 200 ? !1 : (this.rateLimitCounter++, !0);
  }
  removeProcessedEvents(e) {
    const t = new Set(e);
    this.eventsQueue = this.eventsQueue.filter((r) => !t.has(r.id));
  }
  emitEvent(e) {
    this.emitter && this.emitter.emit(K.EVENT, e);
  }
  emitEventsQueue(e) {
    this.emitter && this.emitter.emit(K.QUEUE, e);
  }
}
class dt {
  /**
   * Gets or creates a unique user ID for the given project.
   * The user ID is persisted in localStorage and reused across sessions.
   *
   * @param storageManager - Storage manager instance
   * @param projectId - Project identifier for namespacing
   * @returns Persistent unique user ID
   */
  static getId(e) {
    const t = $e, r = e.getItem(t);
    if (r)
      return r;
    const n = qe();
    return e.setItem(t, n), n;
  }
}
class ht extends g {
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
    this.broadcastChannel = new BroadcastChannel(Be(e)), this.broadcastChannel.onmessage = (t) => {
      const { action: r, sessionId: n, timestamp: i, projectId: a } = t.data ?? {};
      if (a === e) {
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
    return Qe(this.getProjectId());
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
class ft extends g {
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
      this.sessionManager = new ht(this.storageManager, this.eventManager, t), this.sessionManager.startTracking(), this.eventManager.flushPendingEvents();
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
class gt extends g {
  eventManager;
  onTrack;
  originalPushState;
  originalReplaceState;
  constructor(e, t) {
    super(), this.eventManager = e, this.onTrack = t;
  }
  startTracking() {
    this.trackInitialPageView(), window.addEventListener("popstate", this.trackCurrentPage, !0), window.addEventListener("hashchange", this.trackCurrentPage, !0), this.patchHistory("pushState"), this.patchHistory("replaceState");
  }
  stopTracking() {
    window.removeEventListener("popstate", this.trackCurrentPage, !0), window.removeEventListener("hashchange", this.trackCurrentPage, !0), this.originalPushState && (window.history.pushState = this.originalPushState), this.originalReplaceState && (window.history.replaceState = this.originalReplaceState);
  }
  patchHistory(e) {
    const t = window.history[e];
    e === "pushState" && !this.originalPushState ? this.originalPushState = t : e === "replaceState" && !this.originalReplaceState && (this.originalReplaceState = t), window.history[e] = (...r) => {
      t.apply(window.history, r), this.trackCurrentPage();
    };
  }
  trackCurrentPage = () => {
    const e = window.location.href, t = J(e, this.get("config").sensitiveQueryParams);
    if (this.get("pageUrl") === t)
      return;
    this.onTrack();
    const r = this.get("pageUrl");
    this.set("pageUrl", t);
    const n = this.extractPageViewData();
    this.eventManager.track({
      type: d.PAGE_VIEW,
      page_url: this.get("pageUrl"),
      from_page_url: r,
      ...n && { page_view: n }
    });
  };
  trackInitialPageView() {
    const e = J(window.location.href, this.get("config").sensitiveQueryParams), t = this.extractPageViewData();
    this.eventManager.track({
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
class St extends g {
  eventManager;
  clickHandler;
  constructor(e) {
    super(), this.eventManager = e;
  }
  startTracking() {
    this.clickHandler || (this.clickHandler = (e) => {
      const t = e, r = t.target, n = typeof HTMLElement < "u" && r instanceof HTMLElement ? r : typeof HTMLElement < "u" && r instanceof Node && r.parentElement instanceof HTMLElement ? r.parentElement : null;
      if (!n) {
        l("warn", "Click target not found or not an element");
        return;
      }
      if (this.shouldIgnoreElement(n))
        return;
      const i = this.findTrackingElement(n), a = this.getRelevantClickElement(n), o = this.calculateClickCoordinates(t, n);
      if (i) {
        const u = this.extractTrackingData(i);
        if (u) {
          const f = this.createCustomEventData(u);
          this.eventManager.track({
            type: d.CUSTOM,
            custom_event: {
              name: f.name,
              ...f.value && { metadata: { value: f.value } }
            }
          });
        }
      }
      const c = this.generateClickData(n, a, o);
      this.eventManager.track({
        type: d.CLICK,
        click_data: c
      });
    }, window.addEventListener("click", this.clickHandler, !0));
  }
  stopTracking() {
    this.clickHandler && (window.removeEventListener("click", this.clickHandler, !0), this.clickHandler = void 0);
  }
  shouldIgnoreElement(e) {
    return e.hasAttribute(`${A}-ignore`) ? !0 : e.closest(`[${A}-ignore]`) !== null;
  }
  findTrackingElement(e) {
    return e.hasAttribute(`${A}-name`) ? e : e.closest(`[${A}-name]`);
  }
  getRelevantClickElement(e) {
    for (const t of Pe)
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
    const r = t.getBoundingClientRect(), n = e.clientX, i = e.clientY, a = r.width > 0 ? this.clamp((n - r.left) / r.width) : 0, o = r.height > 0 ? this.clamp((i - r.top) / r.height) : 0;
    return { x: n, y: i, relativeX: a, relativeY: o };
  }
  extractTrackingData(e) {
    const t = e.getAttribute(`${A}-name`), r = e.getAttribute(`${A}-value`);
    if (t)
      return {
        element: e,
        name: t,
        ...r && { value: r }
      };
  }
  generateClickData(e, t, r) {
    const { x: n, y: i, relativeX: a, relativeY: o } = r, c = this.getRelevantText(e, t), u = this.extractElementAttributes(t);
    return {
      x: n,
      y: i,
      relativeX: a,
      relativeY: o,
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
    for (const r of ae) {
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
class Et extends g {
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
        const n = this.getElementSelector(r);
        this.setupScrollContainer(r, n);
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
      acceptNode: (n) => {
        const i = n;
        if (!i.isConnected || !i.offsetParent)
          return NodeFilter.FILTER_SKIP;
        const a = getComputedStyle(i);
        return a.overflowY === "auto" || a.overflowY === "scroll" || a.overflow === "auto" || a.overflow === "scroll" ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
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
    const n = () => {
      this.get("suppressNextScroll") || (this.clearContainerTimer(c), c.debounceTimer = window.setTimeout(() => {
        const u = this.calculateScrollData(c);
        if (u) {
          const f = Date.now();
          this.processScrollEvent(c, u, f);
        }
        c.debounceTimer = null;
      }, 250));
    }, i = this.getScrollTop(e), a = this.calculateScrollDepth(
      i,
      this.getScrollHeight(e),
      this.getViewportHeight(e)
    ), o = this.determineIfPrimary(e), c = {
      element: e,
      selector: t,
      isPrimary: o,
      lastScrollPos: i,
      lastDepth: a,
      lastDirection: U.DOWN,
      lastEventTime: 0,
      maxDepthReached: a,
      debounceTimer: null,
      listener: n
    };
    this.containers.push(c), e instanceof Window ? window.addEventListener("scroll", n, { passive: !0 }) : e.addEventListener("scroll", n, { passive: !0 });
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
    this.limitWarningLogged || (this.limitWarningLogged = !0, l("warn", "Max scroll events per session reached", {
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
    return e > t ? U.DOWN : U.UP;
  }
  calculateScrollDepth(e, t, r) {
    if (t <= r)
      return 0;
    const n = t - r;
    return Math.min(100, Math.max(0, Math.floor(e / n * 100)));
  }
  calculateScrollData(e) {
    const { element: t, lastScrollPos: r, lastEventTime: n } = e, i = this.getScrollTop(t), a = Date.now(), o = Math.abs(i - r);
    if (o < 10 || t === window && !this.isWindowScrollable())
      return null;
    const c = this.getViewportHeight(t), u = this.getScrollHeight(t), f = this.getScrollDirection(i, r), _ = this.calculateScrollDepth(i, u, c), D = n > 0 ? a - n : 0, Q = D > 0 ? Math.round(o / D * 1e3) : 0;
    return _ > e.maxDepthReached && (e.maxDepthReached = _), e.lastScrollPos = i, {
      depth: _,
      direction: f,
      velocity: Q,
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
    const t = getComputedStyle(e), r = t.overflowY === "auto" || t.overflowY === "scroll" || t.overflowX === "auto" || t.overflowX === "scroll" || t.overflow === "auto" || t.overflow === "scroll", n = e.scrollHeight > e.clientHeight || e.scrollWidth > e.clientWidth;
    return r && n;
  }
  applyPrimaryScrollSelector(e) {
    let t;
    if (e === "window")
      t = window;
    else {
      const n = document.querySelector(e);
      if (!(n instanceof HTMLElement)) {
        l("warn", `Selector "${e}" did not match an HTMLElement`);
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
class mt extends g {
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
class pt {
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
        const a = this.storage.key(i);
        a?.startsWith("tracelog_") && (e.push(a), a.startsWith("tracelog_persisted_events_") && t.push(a));
      }
      if (t.length > 0)
        return t.forEach((i) => {
          try {
            this.storage.removeItem(i);
          } catch {
          }
        }), !0;
      const r = ["tracelog_session_", "tracelog_user_id", "tracelog_device_id", "tracelog_config"], n = e.filter((i) => !r.some((a) => i.startsWith(a)));
      return n.length > 0 ? (n.slice(0, 5).forEach((a) => {
        try {
          this.storage.removeItem(a);
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
class _t extends g {
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
        l("warn", "Failed to disconnect performance observer", { error: r, data: { observerIndex: t } });
      }
    }), this.observers.length = 0, this.reportedByNav.clear();
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
        for (const a of i) {
          if (a.hadRecentInput === !0)
            continue;
          const o = typeof a.value == "number" ? a.value : 0;
          e += o;
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
        for (const a of i) {
          const o = (a.processingEnd ?? 0) - (a.startTime ?? 0);
          n = Math.max(n, o);
        }
        n > 0 && this.sendVital({ type: "INP", value: Number(n.toFixed(2)) });
      },
      { type: "event", buffered: !0 }
    );
  }
  async initWebVitals() {
    try {
      const { onLCP: e, onCLS: t, onFCP: r, onTTFB: n, onINP: i } = await Promise.resolve().then(() => Vt), a = (o) => (c) => {
        const u = Number(c.value.toFixed(2));
        this.sendVital({ type: o, value: u });
      };
      e(a("LCP")), t(a("CLS")), r(a("FCP")), n(a("TTFB")), i(a("INP"));
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
          const n = Number(r.duration.toFixed(2)), i = Date.now();
          i - this.lastLongTaskSentAt >= je && (this.shouldSendVital("LONG_TASK", n) && this.trackWebVital("LONG_TASK", n), this.lastLongTaskSentAt = i);
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
  safeObserve(e, t, r, n = !1) {
    try {
      if (!this.isObserverSupported(e))
        return !1;
      const i = new PerformanceObserver((a, o) => {
        try {
          t(a, o);
        } catch (c) {
          l("warn", "Observer callback failed", {
            error: c,
            data: { type: e }
          });
        }
        if (n)
          try {
            o.disconnect();
          } catch {
          }
      });
      return i.observe(r ?? { type: e, buffered: !0 }), n || this.observers.push(i), !0;
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
class Tt extends g {
  eventManager;
  recentErrors = /* @__PURE__ */ new Map();
  constructor(e) {
    super(), this.eventManager = e;
  }
  startTracking() {
    window.addEventListener("error", this.handleError), window.addEventListener("unhandledrejection", this.handleRejection);
  }
  stopTracking() {
    window.removeEventListener("error", this.handleError), window.removeEventListener("unhandledrejection", this.handleRejection), this.recentErrors.clear();
  }
  shouldSample() {
    const t = this.get("config")?.errorSampling ?? Ae;
    return Math.random() < t;
  }
  handleError = (e) => {
    if (!this.shouldSample())
      return;
    const t = this.sanitize(e.message || "Unknown error");
    this.shouldSuppressError(b.JS_ERROR, t) || this.eventManager.track({
      type: d.ERROR,
      error_data: {
        type: b.JS_ERROR,
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
    this.shouldSuppressError(b.PROMISE_REJECTION, r) || this.eventManager.track({
      type: d.ERROR,
      error_data: {
        type: b.PROMISE_REJECTION,
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
    for (const r of ae) {
      const n = new RegExp(r.source, r.flags);
      t = t.replace(n, "[REDACTED]");
    }
    return t;
  }
  shouldSuppressError(e, t) {
    const r = Date.now(), n = `${e}:${t}`, i = this.recentErrors.get(n);
    return i && r - i < ge ? (this.recentErrors.set(n, r), !0) : (this.recentErrors.set(n, r), this.recentErrors.size > Xe ? (this.recentErrors.clear(), this.recentErrors.set(n, r), !1) : (this.recentErrors.size > H && this.pruneOldErrors(), !1));
  }
  pruneOldErrors() {
    const e = Date.now();
    for (const [n, i] of this.recentErrors.entries())
      e - i > ge && this.recentErrors.delete(n);
    if (this.recentErrors.size <= H)
      return;
    const t = Array.from(this.recentErrors.entries()).sort((n, i) => n[1] - i[1]), r = this.recentErrors.size - H;
    for (let n = 0; n < r; n += 1) {
      const i = t[n];
      i && this.recentErrors.delete(i[0]);
    }
  }
}
class It extends g {
  isInitialized = !1;
  suppressNextScrollTimer = null;
  emitter = new lt();
  managers = {};
  handlers = {};
  integrations = {};
  get initialized() {
    return this.isInitialized;
  }
  async init(e = {}) {
    if (!this.isInitialized) {
      this.managers.storage = new pt();
      try {
        this.setupState(e), await this.setupIntegrations(), this.managers.event = new ut(this.managers.storage, this.integrations.googleAnalytics, this.emitter), this.initializeHandlers(), await this.managers.event.recoverPersistedEvents().catch((t) => {
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
    const { valid: r, error: n, sanitizedMetadata: i } = ot(e, t);
    if (!r) {
      if (this.get("mode") === C.QA)
        throw new Error(`[TraceLog] Custom event "${e}" validation failed: ${n}`);
      return;
    }
    this.managers.event.track({
      type: d.CUSTOM,
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
        l("warn", "Failed to stop tracking", { error: r });
      }
    }), this.suppressNextScrollTimer && (clearTimeout(this.suppressNextScrollTimer), this.suppressNextScrollTimer = null), this.managers.event?.flushImmediatelySync(), this.managers.event?.stop(), this.emitter.removeAllListeners(), this.set("hasStartSession", !1), this.set("suppressNextScroll", !1), this.set("sessionId", null), this.isInitialized = !1, this.handlers = {});
  }
  setupState(e = {}) {
    this.set("config", e);
    const t = dt.getId(this.managers.storage);
    this.set("userId", t);
    const r = Ze(e);
    this.set("collectApiUrl", r);
    const n = Ge();
    this.set("device", n);
    const i = J(window.location.href, e.sensitiveQueryParams);
    this.set("pageUrl", i);
    const a = Ke() ? C.QA : void 0;
    a && this.set("mode", a);
  }
  async setupIntegrations() {
    if (this.get("config").integrations?.googleAnalytics?.measurementId?.trim())
      try {
        this.integrations.googleAnalytics = new mt(), await this.integrations.googleAnalytics.initialize();
      } catch {
        this.integrations.googleAnalytics = void 0;
      }
  }
  initializeHandlers() {
    this.handlers.session = new ft(
      this.managers.storage,
      this.managers.event
    ), this.handlers.session.startTracking();
    const e = () => {
      this.set("suppressNextScroll", !0), this.suppressNextScrollTimer && clearTimeout(this.suppressNextScrollTimer), this.suppressNextScrollTimer = window.setTimeout(() => {
        this.set("suppressNextScroll", !1);
      }, 500);
    };
    this.handlers.pageView = new gt(this.managers.event, e), this.handlers.pageView.startTracking(), this.handlers.click = new St(this.managers.event), this.handlers.click.startTracking(), this.handlers.scroll = new Et(this.managers.event), this.handlers.scroll.startTracking(), this.handlers.performance = new _t(this.managers.event), this.handlers.performance.startTracking().catch((t) => {
      l("warn", "Failed to start performance tracking", { error: t });
    }), this.handlers.error = new Tt(this.managers.event), this.handlers.error.startTracking();
  }
}
const y = [];
let h = null, L = !1, x = !1;
const vt = async (s) => {
  if (typeof window > "u" || typeof document > "u")
    throw new Error("[TraceLog] This library can only be used in a browser environment");
  if (!window.__traceLogDisabled && !h && !L) {
    L = !0;
    try {
      const e = st(s ?? {}), t = new It();
      try {
        y.forEach(({ event: i, callback: a }) => {
          t.on(i, a);
        }), y.length = 0;
        const r = t.init(e), n = new Promise((i, a) => {
          setTimeout(() => {
            a(new Error("[TraceLog] Initialization timeout after 10000ms"));
          }, 1e4);
        });
        await Promise.race([r, n]), h = t;
      } catch (r) {
        try {
          t.destroy(!0);
        } catch (n) {
          l("error", "Failed to cleanup partially initialized app", { error: n });
        }
        throw r;
      }
    } catch (e) {
      throw h = null, e;
    } finally {
      L = !1;
    }
  }
}, yt = (s, e) => {
  if (!h)
    throw new Error("[TraceLog] TraceLog not initialized. Please call init() first.");
  if (x)
    throw new Error("[TraceLog] Cannot send events while TraceLog is being destroyed");
  h.sendCustomEvent(s, e);
}, At = (s, e) => {
  if (!h || L) {
    y.push({ event: s, callback: e });
    return;
  }
  h.on(s, e);
}, wt = (s, e) => {
  if (!h) {
    const t = y.findIndex((r) => r.event === s && r.callback === e);
    t !== -1 && y.splice(t, 1);
    return;
  }
  h.off(s, e);
}, Mt = () => h !== null, Nt = () => {
  if (x)
    throw new Error("[TraceLog] Destroy operation already in progress");
  if (!h)
    throw new Error("[TraceLog] App not initialized");
  x = !0;
  try {
    h.destroy(), h = null, L = !1, y.length = 0;
  } catch (s) {
    h = null, L = !1, y.length = 0, l("warn", "Error during destroy, forced cleanup completed", { error: s });
  } finally {
    x = !1;
  }
}, Jt = {
  WEB_VITALS_THRESHOLDS: ye
  // Business thresholds for performance analysis
}, Zt = {
  PII_PATTERNS: ae
  // Patterns for sensitive data protection
}, er = {
  LOW_ACTIVITY_EVENT_COUNT: 50,
  HIGH_ACTIVITY_EVENT_COUNT: 1e3,
  MIN_EVENTS_FOR_DYNAMIC_CALCULATION: 100,
  MIN_EVENTS_FOR_TREND_ANALYSIS: 30,
  BOUNCE_RATE_SESSION_THRESHOLD: 1,
  // Sessions with 1 page view = bounce
  MIN_ENGAGED_SESSION_DURATION_MS: 30 * 1e3,
  MIN_SCROLL_DEPTH_ENGAGEMENT: 25
  // 25% scroll depth for engagement
}, tr = {
  INACTIVITY_TIMEOUT_MS: 1800 * 1e3,
  // 30min for analytics (vs 15min client)
  SHORT_SESSION_THRESHOLD_MS: 30 * 1e3,
  MEDIUM_SESSION_THRESHOLD_MS: 300 * 1e3,
  LONG_SESSION_THRESHOLD_MS: 1800 * 1e3,
  MAX_REALISTIC_SESSION_DURATION_MS: 480 * 60 * 1e3
  // Filter outliers
}, rr = {
  MOBILE_MAX_WIDTH: 768,
  TABLET_MAX_WIDTH: 1024,
  MOBILE_PERFORMANCE_FACTOR: 1.5,
  // Mobile typically 1.5x slower
  TABLET_PERFORMANCE_FACTOR: 1.2
}, sr = {
  MIN_TEXT_LENGTH_FOR_ANALYSIS: 10,
  MIN_CLICKS_FOR_HOT_ELEMENT: 10,
  // Popular element threshold
  MIN_SCROLL_COMPLETION_PERCENT: 80,
  // Page consumption threshold
  MIN_TIME_ON_PAGE_FOR_READ_MS: 15 * 1e3
}, nr = {
  SIGNIFICANT_CHANGE_PERCENT: 20,
  MAJOR_CHANGE_PERCENT: 50,
  MIN_EVENTS_FOR_INSIGHT: 100,
  MIN_SESSIONS_FOR_INSIGHT: 10,
  MIN_CORRELATION_STRENGTH: 0.7,
  // Strong correlation threshold
  LOW_ERROR_RATE_PERCENT: 1,
  HIGH_ERROR_RATE_PERCENT: 5,
  CRITICAL_ERROR_RATE_PERCENT: 10
}, ir = {
  SHORT_TERM_TREND_HOURS: 24,
  MEDIUM_TERM_TREND_DAYS: 7,
  LONG_TERM_TREND_DAYS: 30,
  MIN_DATA_POINTS_FOR_TREND: 5,
  WEEKLY_PATTERN_MIN_WEEKS: 4,
  DAILY_PATTERN_MIN_DAYS: 14
}, ar = {
  MIN_SEGMENT_SIZE: 10,
  MIN_COHORT_SIZE: 5,
  COHORT_ANALYSIS_DAYS: [1, 3, 7, 14, 30],
  MIN_FUNNEL_EVENTS: 20
}, or = {
  DEFAULT_EVENTS_LIMIT: 5,
  DEFAULT_SESSIONS_LIMIT: 5,
  DEFAULT_PAGES_LIMIT: 5,
  MAX_EVENTS_FOR_DEEP_ANALYSIS: 1e4,
  MAX_TIME_RANGE_DAYS: 365,
  ANALYTICS_BATCH_SIZE: 1e3
  // For historical analysis
}, lr = {
  ANOMALY_THRESHOLD_SIGMA: 2.5,
  STRONG_ANOMALY_THRESHOLD_SIGMA: 3,
  TRAFFIC_DROP_ALERT_PERCENT: -30,
  TRAFFIC_SPIKE_ALERT_PERCENT: 200,
  MIN_BASELINE_DAYS: 7,
  MIN_EVENTS_FOR_ANOMALY_DETECTION: 50
}, cr = {
  PAGE_URL_EXCLUDED: "excluded",
  PAGE_URL_UNKNOWN: "unknown"
}, ur = {
  init: vt,
  event: yt,
  on: At,
  off: wt,
  isInitialized: Mt,
  destroy: Nt
};
var ee, Me = -1, R = function(s) {
  addEventListener("pageshow", (function(e) {
    e.persisted && (Me = e.timeStamp, s(e));
  }), !0);
}, oe = function() {
  var s = self.performance && performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
  if (s && s.responseStart > 0 && s.responseStart < performance.now()) return s;
}, G = function() {
  var s = oe();
  return s && s.activationStart || 0;
}, m = function(s, e) {
  var t = oe(), r = "navigate";
  return Me >= 0 ? r = "back-forward-cache" : t && (document.prerendering || G() > 0 ? r = "prerender" : document.wasDiscarded ? r = "restore" : t.type && (r = t.type.replace(/_/g, "-"))), { name: s, value: e === void 0 ? -1 : e, rating: "good", delta: 0, entries: [], id: "v4-".concat(Date.now(), "-").concat(Math.floor(8999999999999 * Math.random()) + 1e12), navigationType: r };
}, P = function(s, e, t) {
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
}, p = function(s, e, t, r) {
  var n, i;
  return function(a) {
    e.value >= 0 && (a || r) && ((i = e.value - (n || 0)) || n === void 0) && (n = e.value, e.delta = i, e.rating = (function(o, c) {
      return o > c[1] ? "poor" : o > c[0] ? "needs-improvement" : "good";
    })(e.value, t), s(e));
  };
}, le = function(s) {
  requestAnimationFrame((function() {
    return requestAnimationFrame((function() {
      return s();
    }));
  }));
}, $ = function(s) {
  document.addEventListener("visibilitychange", (function() {
    document.visibilityState === "hidden" && s();
  }));
}, ce = function(s) {
  var e = !1;
  return function() {
    e || (s(), e = !0);
  };
}, N = -1, Te = function() {
  return document.visibilityState !== "hidden" || document.prerendering ? 1 / 0 : 0;
}, F = function(s) {
  document.visibilityState === "hidden" && N > -1 && (N = s.type === "visibilitychange" ? s.timeStamp : 0, Lt());
}, Ie = function() {
  addEventListener("visibilitychange", F, !0), addEventListener("prerenderingchange", F, !0);
}, Lt = function() {
  removeEventListener("visibilitychange", F, !0), removeEventListener("prerenderingchange", F, !0);
}, Ne = function() {
  return N < 0 && (N = Te(), Ie(), R((function() {
    setTimeout((function() {
      N = Te(), Ie();
    }), 0);
  }))), { get firstHiddenTime() {
    return N;
  } };
}, z = function(s) {
  document.prerendering ? addEventListener("prerenderingchange", (function() {
    return s();
  }), !0) : s();
}, te = [1800, 3e3], Le = function(s, e) {
  e = e || {}, z((function() {
    var t, r = Ne(), n = m("FCP"), i = P("paint", (function(a) {
      a.forEach((function(o) {
        o.name === "first-contentful-paint" && (i.disconnect(), o.startTime < r.firstHiddenTime && (n.value = Math.max(o.startTime - G(), 0), n.entries.push(o), t(!0)));
      }));
    }));
    i && (t = p(s, n, te, e.reportAllChanges), R((function(a) {
      n = m("FCP"), t = p(s, n, te, e.reportAllChanges), le((function() {
        n.value = performance.now() - a.timeStamp, t(!0);
      }));
    })));
  }));
}, re = [0.1, 0.25], Rt = function(s, e) {
  e = e || {}, Le(ce((function() {
    var t, r = m("CLS", 0), n = 0, i = [], a = function(c) {
      c.forEach((function(u) {
        if (!u.hadRecentInput) {
          var f = i[0], _ = i[i.length - 1];
          n && u.startTime - _.startTime < 1e3 && u.startTime - f.startTime < 5e3 ? (n += u.value, i.push(u)) : (n = u.value, i = [u]);
        }
      })), n > r.value && (r.value = n, r.entries = i, t());
    }, o = P("layout-shift", a);
    o && (t = p(s, r, re, e.reportAllChanges), $((function() {
      a(o.takeRecords()), t(!0);
    })), R((function() {
      n = 0, r = m("CLS", 0), t = p(s, r, re, e.reportAllChanges), le((function() {
        return t();
      }));
    })), setTimeout(t, 0));
  })));
}, Re = 0, X = 1 / 0, k = 0, bt = function(s) {
  s.forEach((function(e) {
    e.interactionId && (X = Math.min(X, e.interactionId), k = Math.max(k, e.interactionId), Re = k ? (k - X) / 7 + 1 : 0);
  }));
}, be = function() {
  return ee ? Re : performance.interactionCount || 0;
}, Ct = function() {
  "interactionCount" in performance || ee || (ee = P("event", bt, { type: "event", buffered: !0, durationThreshold: 0 }));
}, E = [], V = /* @__PURE__ */ new Map(), Ce = 0, Ot = function() {
  var s = Math.min(E.length - 1, Math.floor((be() - Ce) / 50));
  return E[s];
}, Pt = [], Dt = function(s) {
  if (Pt.forEach((function(n) {
    return n(s);
  })), s.interactionId || s.entryType === "first-input") {
    var e = E[E.length - 1], t = V.get(s.interactionId);
    if (t || E.length < 10 || s.duration > e.latency) {
      if (t) s.duration > t.latency ? (t.entries = [s], t.latency = s.duration) : s.duration === t.latency && s.startTime === t.entries[0].startTime && t.entries.push(s);
      else {
        var r = { id: s.interactionId, latency: s.duration, entries: [s] };
        V.set(r.id, r), E.push(r);
      }
      E.sort((function(n, i) {
        return i.latency - n.latency;
      })), E.length > 10 && E.splice(10).forEach((function(n) {
        return V.delete(n.id);
      }));
    }
  }
}, Oe = function(s) {
  var e = self.requestIdleCallback || self.setTimeout, t = -1;
  return s = ce(s), document.visibilityState === "hidden" ? s() : (t = e(s), $(s)), t;
}, se = [200, 500], kt = function(s, e) {
  "PerformanceEventTiming" in self && "interactionId" in PerformanceEventTiming.prototype && (e = e || {}, z((function() {
    var t;
    Ct();
    var r, n = m("INP"), i = function(o) {
      Oe((function() {
        o.forEach(Dt);
        var c = Ot();
        c && c.latency !== n.value && (n.value = c.latency, n.entries = c.entries, r());
      }));
    }, a = P("event", i, { durationThreshold: (t = e.durationThreshold) !== null && t !== void 0 ? t : 40 });
    r = p(s, n, se, e.reportAllChanges), a && (a.observe({ type: "first-input", buffered: !0 }), $((function() {
      i(a.takeRecords()), r(!0);
    })), R((function() {
      Ce = be(), E.length = 0, V.clear(), n = m("INP"), r = p(s, n, se, e.reportAllChanges);
    })));
  })));
}, ne = [2500, 4e3], W = {}, Ut = function(s, e) {
  e = e || {}, z((function() {
    var t, r = Ne(), n = m("LCP"), i = function(c) {
      e.reportAllChanges || (c = c.slice(-1)), c.forEach((function(u) {
        u.startTime < r.firstHiddenTime && (n.value = Math.max(u.startTime - G(), 0), n.entries = [u], t());
      }));
    }, a = P("largest-contentful-paint", i);
    if (a) {
      t = p(s, n, ne, e.reportAllChanges);
      var o = ce((function() {
        W[n.id] || (i(a.takeRecords()), a.disconnect(), W[n.id] = !0, t(!0));
      }));
      ["keydown", "click"].forEach((function(c) {
        addEventListener(c, (function() {
          return Oe(o);
        }), { once: !0, capture: !0 });
      })), $(o), R((function(c) {
        n = m("LCP"), t = p(s, n, ne, e.reportAllChanges), le((function() {
          n.value = performance.now() - c.timeStamp, W[n.id] = !0, t(!0);
        }));
      }));
    }
  }));
}, ie = [800, 1800], Ht = function s(e) {
  document.prerendering ? z((function() {
    return s(e);
  })) : document.readyState !== "complete" ? addEventListener("load", (function() {
    return s(e);
  }), !0) : setTimeout(e, 0);
}, xt = function(s, e) {
  e = e || {};
  var t = m("TTFB"), r = p(s, t, ie, e.reportAllChanges);
  Ht((function() {
    var n = oe();
    n && (t.value = Math.max(n.responseStart - G(), 0), t.entries = [n], r(!0), R((function() {
      t = m("TTFB", 0), (r = p(s, t, ie, e.reportAllChanges))(!0);
    })));
  }));
};
const Vt = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  CLSThresholds: re,
  FCPThresholds: te,
  INPThresholds: se,
  LCPThresholds: ne,
  TTFBThresholds: ie,
  onCLS: Rt,
  onFCP: Le,
  onINP: kt,
  onLCP: Ut,
  onTTFB: xt
}, Symbol.toStringTag, { value: "Module" }));
export {
  or as ANALYTICS_QUERY_LIMITS,
  lr as ANOMALY_DETECTION,
  w as AppConfigValidationError,
  sr as CONTENT_ANALYTICS,
  Zt as DATA_PROTECTION,
  rr as DEVICE_ANALYTICS,
  T as DeviceType,
  er as ENGAGEMENT_THRESHOLDS,
  K as EmitterEvent,
  b as ErrorType,
  d as EventType,
  nr as INSIGHT_THRESHOLDS,
  qt as InitializationTimeoutError,
  v as IntegrationValidationError,
  Wt as MAX_ARRAY_LENGTH,
  zt as MAX_CUSTOM_EVENT_ARRAY_SIZE,
  $t as MAX_CUSTOM_EVENT_KEYS,
  Ft as MAX_CUSTOM_EVENT_NAME_LENGTH,
  Gt as MAX_CUSTOM_EVENT_STRING_SIZE,
  Bt as MAX_METADATA_NESTING_DEPTH,
  Qt as MAX_NESTED_OBJECT_KEYS,
  jt as MAX_STRING_LENGTH,
  Xt as MAX_STRING_LENGTH_IN_ARRAY,
  C as Mode,
  Jt as PERFORMANCE_CONFIG,
  M as PermanentError,
  ar as SEGMENTATION_ANALYTICS,
  tr as SESSION_ANALYTICS,
  cr as SPECIAL_PAGE_URLS,
  de as SamplingRateValidationError,
  U as ScrollDirection,
  He as SessionTimeoutValidationError,
  Y as SpecialApiUrl,
  ir as TEMPORAL_ANALYSIS,
  O as TraceLogValidationError,
  Yt as isPrimaryScrollEvent,
  Kt as isSecondaryScrollEvent,
  ur as tracelog
};
