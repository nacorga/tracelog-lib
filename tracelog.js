const P = "data-tlog", be = [
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
], Oe = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
const m = {
  INVALID_SESSION_TIMEOUT: "Session timeout must be between 30000ms (30 seconds) and 86400000ms (24 hours)",
  INVALID_SAMPLING_RATE: "Sampling rate must be between 0 and 1",
  INVALID_ERROR_SAMPLING_RATE: "Error sampling must be between 0 and 1",
  INVALID_TRACELOG_PROJECT_ID: "TraceLog project ID is required when integration is enabled",
  INVALID_CUSTOM_API_URL: "Custom API URL is required when integration is enabled",
  INVALID_GOOGLE_ANALYTICS_ID: "Google Analytics measurement ID is required when integration is enabled",
  INVALID_SCROLL_CONTAINER_SELECTORS: "Scroll container selectors must be valid CSS selectors",
  INVALID_GLOBAL_METADATA: "Global metadata must be an object",
  INVALID_SENSITIVE_QUERY_PARAMS: "Sensitive query params must be an array of strings"
}, Pe = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<embed\b[^>]*>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi
];
var X = /* @__PURE__ */ ((s) => (s.Localhost = "localhost:8080", s.Fail = "localhost:9999", s))(X || {}), _ = /* @__PURE__ */ ((s) => (s.Mobile = "mobile", s.Tablet = "tablet", s.Desktop = "desktop", s.Unknown = "unknown", s))(_ || {}), W = /* @__PURE__ */ ((s) => (s.EVENT = "event", s.QUEUE = "queue", s))(W || {});
class I extends Error {
  constructor(e, t) {
    super(e), this.statusCode = t, this.name = "PermanentError", Error.captureStackTrace && Error.captureStackTrace(this, I);
  }
}
var d = /* @__PURE__ */ ((s) => (s.PAGE_VIEW = "page_view", s.CLICK = "click", s.SCROLL = "scroll", s.SESSION_START = "session_start", s.SESSION_END = "session_end", s.CUSTOM = "custom", s.WEB_VITALS = "web_vitals", s.ERROR = "error", s))(d || {}), k = /* @__PURE__ */ ((s) => (s.UP = "up", s.DOWN = "down", s))(k || {}), R = /* @__PURE__ */ ((s) => (s.JS_ERROR = "js_error", s.PROMISE_REJECTION = "promise_rejection", s))(R || {}), C = /* @__PURE__ */ ((s) => (s.QA = "qa", s))(C || {});
class b extends Error {
  constructor(e, t, r) {
    super(e), this.errorCode = t, this.layer = r, this.name = this.constructor.name, Error.captureStackTrace && Error.captureStackTrace(this, this.constructor);
  }
}
class A extends b {
  constructor(e, t = "config") {
    super(e, "APP_CONFIG_INVALID", t);
  }
}
class De extends b {
  constructor(e, t = "config") {
    super(e, "SESSION_TIMEOUT_INVALID", t);
  }
}
class ce extends b {
  constructor(e, t = "config") {
    super(e, "SAMPLING_RATE_INVALID", t);
  }
}
class v extends b {
  constructor(e, t = "config") {
    super(e, "INTEGRATION_INVALID", t);
  }
}
class Ft extends b {
  constructor(e, t, r = "runtime") {
    super(e, "INITIALIZATION_TIMEOUT", r), this.timeoutMs = t;
  }
}
const ke = (s, e) => {
  if (e) {
    if (e instanceof Error) {
      const t = e.message.replace(/\s+at\s+.*$/gm, "").replace(/\(.*?:\d+:\d+\)/g, "");
      return `[TraceLog] ${s}: ${t}`;
    }
    return `[TraceLog] ${s}: ${e instanceof Error ? e.message : "Unknown error"}`;
  }
  return `[TraceLog] ${s}`;
}, o = (s, e, t) => {
  const { error: r, data: n, showToClient: i = !1 } = t ?? {}, a = r ? ke(e, r) : `[TraceLog] ${e}`, c = s === "error" ? "error" : s === "warn" ? "warn" : "log";
  if (!(s === "debug" || s === "info" && !i))
    if (n !== void 0) {
      const l = Ue(n);
      console[c](a, l);
    } else n !== void 0 ? console[c](a, n) : console[c](a);
}, Ue = (s) => {
  const e = {}, t = ["token", "password", "secret", "key", "apikey", "api_key", "sessionid", "session_id"];
  for (const [r, n] of Object.entries(s)) {
    const i = r.toLowerCase();
    t.some((a) => i.includes(a)) ? e[r] = "[REDACTED]" : e[r] = n;
  }
  return e;
};
let Y, _e;
const He = () => {
  typeof window < "u" && !Y && (Y = window.matchMedia("(pointer: coarse)"), _e = window.matchMedia("(hover: none)"));
}, xe = () => {
  try {
    const s = navigator;
    if (s.userAgentData && typeof s.userAgentData.mobile == "boolean")
      return s.userAgentData.platform && /ipad|tablet/i.test(s.userAgentData.platform) ? _.Tablet : s.userAgentData.mobile ? _.Mobile : _.Desktop;
    He();
    const e = window.innerWidth, t = Y?.matches ?? !1, r = _e?.matches ?? !1, n = "ontouchstart" in window || navigator.maxTouchPoints > 0, i = navigator.userAgent.toLowerCase(), a = /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/.test(i), c = /tablet|ipad|android(?!.*mobile)/.test(i);
    return e <= 767 || a && n ? _.Mobile : e >= 768 && e <= 1024 || c || t && r && n ? _.Tablet : _.Desktop;
  } catch (s) {
    return o("warn", "Device detection failed, defaulting to desktop", { error: s }), _.Desktop;
  }
}, T = "tlog", le = `${T}:qa_mode`, Ve = `${T}:uid`, Fe = (s) => s ? `${T}:${s}:queue` : `${T}:queue`, Ge = (s) => s ? `${T}:${s}:session` : `${T}:session`, ze = (s) => s ? `${T}:${s}:broadcast` : `${T}:broadcast`, Te = {
  LCP: 4e3,
  FCP: 1800,
  CLS: 0.25,
  INP: 200,
  TTFB: 800,
  LONG_TASK: 50
}, $e = 1e3, ve = [
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
], ue = 500, de = 5e3, U = 50, Qe = U * 2, Be = 6e4, he = "tlog_mode", je = "qa", Xe = () => {
  if (sessionStorage.getItem(le) === "true")
    return !0;
  const e = new URLSearchParams(window.location.search), r = e.get(he) === je;
  if (r) {
    sessionStorage.setItem(le, "true"), e.delete(he);
    const n = e.toString(), i = `${window.location.pathname}${n ? "?" + n : ""}${window.location.hash}`;
    try {
      window.history.replaceState({}, "", i);
    } catch (a) {
      o("warn", "History API not available, cannot replace URL", { error: a });
    }
    console.log(
      "%c[TraceLog] QA Mode ACTIVE",
      "background: #ff9800; color: white; font-weight: bold; padding: 2px 8px; border-radius: 3px;"
    );
  }
  return r;
}, fe = () => {
  const s = new URLSearchParams(window.location.search), e = {};
  return Oe.forEach((r) => {
    const n = s.get(r);
    if (n) {
      const i = r.split("utm_")[1];
      e[i] = n;
    }
  }), Object.keys(e).length ? e : void 0;
}, We = () => typeof crypto < "u" && crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (s) => {
  const e = Math.random() * 16 | 0;
  return (s === "x" ? e : e & 3 | 8).toString(16);
}), Ye = () => {
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
}, ge = (s, e = !1) => {
  try {
    const t = new URL(s), r = t.protocol === "https:", n = t.protocol === "http:";
    return r || e && n;
  } catch {
    return !1;
  }
}, Ke = (s) => {
  if (s.integrations?.tracelog?.projectId) {
    const n = new URL(window.location.href).hostname.split(".");
    if (n.length === 0)
      throw new Error("Invalid URL");
    const i = s.integrations.tracelog.projectId, a = n.slice(-2).join("."), c = `https://${i}.${a}/collect`;
    if (!ge(c))
      throw new Error("Invalid URL");
    return c;
  }
  const e = s.integrations?.custom?.collectApiUrl;
  if (e) {
    const t = s.integrations?.custom?.allowHttp ?? !1;
    if (!ge(e, t))
      throw new Error("Invalid URL");
    return e;
  }
  return "";
}, K = (s, e = []) => {
  try {
    const t = new URL(s), r = t.searchParams;
    let n = !1;
    const i = [];
    return e.forEach((c) => {
      r.has(c) && (r.delete(c), n = !0, i.push(c));
    }), !n && s.includes("?") ? s : (t.search = r.toString(), t.toString());
  } catch (t) {
    return o("warn", "URL normalization failed, returning original", { error: t, data: { url: s.slice(0, 100) } }), s;
  }
}, Se = (s) => {
  if (!s || typeof s != "string" || s.trim().length === 0)
    return "";
  let e = s;
  s.length > 1e3 && (e = s.slice(0, Math.max(0, 1e3)));
  let t = 0;
  for (const n of Pe) {
    const i = e;
    e = e.replace(n, ""), i !== e && t++;
  }
  return t > 0 && o("warn", "XSS patterns detected and removed", {
    data: {
      patternMatches: t,
      originalValue: s.slice(0, 100)
    }
  }), e = e.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#x27;").replaceAll("/", "&#x2F;"), e.trim();
}, q = (s, e = 0) => {
  if (e > 3 || s == null)
    return null;
  if (typeof s == "string")
    return Se(s);
  if (typeof s == "number")
    return !Number.isFinite(s) || s < -Number.MAX_SAFE_INTEGER || s > Number.MAX_SAFE_INTEGER ? 0 : s;
  if (typeof s == "boolean")
    return s;
  if (Array.isArray(s))
    return s.slice(0, 100).map((n) => q(n, e + 1)).filter((n) => n !== null);
  if (typeof s == "object") {
    const t = {}, n = Object.entries(s).slice(0, 20);
    for (const [i, a] of n) {
      const c = Se(i);
      if (c) {
        const l = q(a, e + 1);
        l !== null && (t[c] = l);
      }
    }
    return t;
  }
  return null;
}, qe = (s) => {
  if (typeof s != "object" || s === null)
    return {};
  try {
    const e = q(s);
    return typeof e == "object" && e !== null ? e : {};
  } catch (e) {
    const t = e instanceof Error ? e.message : String(e);
    throw new Error(`[TraceLog] Metadata sanitization failed: ${t}`);
  }
}, Ze = (s) => {
  if (s !== void 0 && (s === null || typeof s != "object"))
    throw new A("Configuration must be an object", "config");
  if (s) {
    if (s.sessionTimeout !== void 0 && (typeof s.sessionTimeout != "number" || s.sessionTimeout < 3e4 || s.sessionTimeout > 864e5))
      throw new De(m.INVALID_SESSION_TIMEOUT, "config");
    if (s.globalMetadata !== void 0 && (typeof s.globalMetadata != "object" || s.globalMetadata === null))
      throw new A(m.INVALID_GLOBAL_METADATA, "config");
    if (s.scrollContainerSelectors !== void 0 && et(s.scrollContainerSelectors), s.integrations && tt(s.integrations), s.sensitiveQueryParams !== void 0) {
      if (!Array.isArray(s.sensitiveQueryParams))
        throw new A(m.INVALID_SENSITIVE_QUERY_PARAMS, "config");
      for (const e of s.sensitiveQueryParams)
        if (typeof e != "string")
          throw new A("All sensitive query params must be strings", "config");
    }
    if (s.errorSampling !== void 0 && (typeof s.errorSampling != "number" || s.errorSampling < 0 || s.errorSampling > 1))
      throw new ce(m.INVALID_ERROR_SAMPLING_RATE, "config");
    if (s.samplingRate !== void 0 && (typeof s.samplingRate != "number" || s.samplingRate < 0 || s.samplingRate > 1))
      throw new ce(m.INVALID_SAMPLING_RATE, "config");
  }
}, Je = (s) => {
  if (s.includes("<") || s.includes(">") || /on\w+\s*=/i.test(s) || !/^[a-zA-Z0-9\-_#.[\]="':, >+~*()]+$/.test(s))
    return !1;
  let t = 0;
  for (const n of s)
    if (n === "(" && t++, n === ")" && t--, t < 0) return !1;
  if (t !== 0) return !1;
  let r = 0;
  for (const n of s)
    if (n === "[" && r++, n === "]" && r--, r < 0) return !1;
  return r === 0;
}, et = (s) => {
  const e = Array.isArray(s) ? s : [s];
  for (const t of e) {
    if (typeof t != "string" || t.trim() === "")
      throw o("error", "Invalid scroll container selector", {
        showToClient: !0,
        data: {
          selector: t,
          type: typeof t,
          isEmpty: t === "" || typeof t == "string" && t.trim() === ""
        }
      }), new A(m.INVALID_SCROLL_CONTAINER_SELECTORS, "config");
    if (!Je(t))
      throw o("error", "Invalid or potentially unsafe CSS selector", {
        showToClient: !0,
        data: {
          selector: t,
          reason: "Failed security validation"
        }
      }), new A("Invalid or potentially unsafe CSS selector", "config");
  }
}, tt = (s) => {
  if (s) {
    if (s.tracelog && (!s.tracelog.projectId || typeof s.tracelog.projectId != "string" || s.tracelog.projectId.trim() === ""))
      throw new v(m.INVALID_TRACELOG_PROJECT_ID, "config");
    if (s.custom) {
      if (!s.custom.collectApiUrl || typeof s.custom.collectApiUrl != "string" || s.custom.collectApiUrl.trim() === "")
        throw new v(m.INVALID_CUSTOM_API_URL, "config");
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
        throw new v(m.INVALID_GOOGLE_ANALYTICS_ID, "config");
      if (!s.googleAnalytics.measurementId.trim().match(/^(G-|UA-)/))
        throw new v('Google Analytics measurement ID must start with "G-" or "UA-"', "config");
    }
  }
}, rt = (s) => {
  Ze(s);
  const e = {
    ...s ?? {},
    sessionTimeout: s?.sessionTimeout ?? 9e5,
    globalMetadata: s?.globalMetadata ?? {},
    sensitiveQueryParams: s?.sensitiveQueryParams ?? [],
    errorSampling: s?.errorSampling ?? 1,
    samplingRate: s?.samplingRate ?? 1
  };
  return e.integrations?.custom && (e.integrations.custom = {
    ...e.integrations.custom,
    allowHttp: e.integrations.custom.allowHttp ?? !1
  }), e;
}, st = (s) => {
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
}, nt = (s) => {
  if (typeof s != "object" || s === null)
    return !1;
  for (const e of Object.values(s)) {
    if (e == null)
      continue;
    const t = typeof e;
    if (!(t === "string" || t === "number" || t === "boolean")) {
      if (Array.isArray(e)) {
        if (e.length === 0)
          continue;
        if (typeof e[0] == "string") {
          if (!e.every((i) => typeof i == "string"))
            return !1;
        } else if (!e.every((i) => st(i)))
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
} : { valid: !0 }, Ee = (s, e, t) => {
  const r = qe(e), n = `${t} "${s}" metadata error`;
  if (!nt(r))
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
  for (const [c, l] of Object.entries(r)) {
    if (Array.isArray(l)) {
      if (l.length > 10)
        return {
          valid: !1,
          error: `${n}: array property "${c}" is too large (max 10 items).`
        };
      for (const u of l)
        if (typeof u == "string" && u.length > 500)
          return {
            valid: !1,
            error: `${n}: array property "${c}" contains strings that are too long (max 500 characters).`
          };
    }
    if (typeof l == "string" && l.length > 1e3)
      return {
        valid: !1,
        error: `${n}: property "${c}" is too long (max 1000 characters).`
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
      const c = Ee(s, a, t);
      if (!c.valid)
        return {
          valid: !1,
          error: `${n}: array item at index ${i} is invalid: ${c.error}`
        };
      c.sanitizedMetadata && r.push(c.sanitizedMetadata);
    }
    return {
      valid: !0,
      sanitizedMetadata: r
    };
  }
  return Ee(s, e, t);
}, ot = (s, e) => {
  const t = it(s);
  if (!t.valid)
    return o("error", "Event name validation failed", {
      showToClient: !0,
      data: { eventName: s, error: t.error }
    }), t;
  if (!e)
    return { valid: !0 };
  const r = at(s, e, "customEvent");
  return r.valid || o("error", "Event metadata validation failed", {
    showToClient: !0,
    data: {
      eventName: s,
      error: r.error
    }
  }), r;
};
class ct {
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
    r && r.forEach((n) => n(t));
  }
  removeAllListeners() {
    this.listeners.clear();
  }
}
const Q = {};
class f {
  get(e) {
    return Q[e];
  }
  set(e, t) {
    Q[e] = t;
  }
  getState() {
    return { ...Q };
  }
}
class lt extends f {
  storeManager;
  retryTimeoutId = null;
  retryCount = 0;
  isRetrying = !1;
  lastPermanentErrorLog = null;
  constructor(e) {
    super(), this.storeManager = e;
  }
  getQueueStorageKey() {
    const e = this.get("userId") || "anonymous";
    return Fe(e);
  }
  sendEventsQueueSync(e) {
    if (this.shouldSkipSend())
      return this.resetRetryState(), !0;
    if (this.get("config")?.integrations?.custom?.collectApiUrl === X.Fail)
      return o("warn", "Fail mode: simulating network failure (sync)", {
        data: { events: e.events.length }
      }), !1;
    const r = this.sendQueueSyncInternal(e);
    return r && this.resetRetryState(), r;
  }
  async sendEventsQueue(e, t) {
    this.shouldSkipSend() || this.persistEvents(e) || o("warn", "Failed to persist events, attempting immediate send");
    try {
      const r = await this.send(e);
      return r ? (this.clearPersistedEvents(), this.resetRetryState(), t?.onSuccess?.(e.events.length, e.events, e)) : (this.scheduleRetry(e, t), t?.onFailure?.()), r;
    } catch (r) {
      if (r instanceof I)
        return this.logPermanentError("Permanent error, not retrying", r), this.clearPersistedEvents(), this.resetRetryState(), t?.onFailure?.(), !1;
      throw r;
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
      await this.send(r) ? (this.clearPersistedEvents(), this.resetRetryState(), e?.onSuccess?.(t.events.length, t.events, r)) : (this.scheduleRetry(r, e), e?.onFailure?.());
    } catch (t) {
      if (t instanceof I) {
        this.logPermanentError("Permanent error during recovery, clearing persisted events", t), this.clearPersistedEvents(), this.resetRetryState(), e?.onFailure?.();
        return;
      }
      o("error", "Failed to recover persisted events", { error: t }), this.clearPersistedEvents();
    }
  }
  persistEventsForRecovery(e) {
    return this.persistEvents(e);
  }
  async sendEventsQueueAsync(e) {
    return this.sendEventsQueue(e);
  }
  stop() {
    this.clearRetryTimeout(), this.resetRetryState();
  }
  async send(e) {
    if (this.shouldSkipSend())
      return this.simulateSuccessfulSend();
    if (this.get("config")?.integrations?.custom?.collectApiUrl === X.Fail)
      return o("warn", "Fail mode: simulating network failure", {
        data: { events: e.events.length }
      }), !1;
    const { url: r, payload: n } = this.prepareRequest(e);
    try {
      return (await this.sendWithTimeout(r, n)).ok;
    } catch (i) {
      if (i instanceof I)
        throw i;
      return o("error", "Send request failed", {
        error: i,
        data: {
          events: e.events.length,
          url: r.replace(/\/\/[^/]+/, "//[DOMAIN]")
        }
      }), !1;
    }
  }
  async sendWithTimeout(e, t) {
    const r = new AbortController(), n = setTimeout(() => r.abort(), 1e4);
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
        throw i.status >= 400 && i.status < 500 ? new I(`HTTP ${i.status}: ${i.statusText}`, i.status) : new Error(`HTTP ${i.status}: ${i.statusText}`);
      return i;
    } finally {
      clearTimeout(n);
    }
  }
  sendQueueSyncInternal(e) {
    const { url: t, payload: r } = this.prepareRequest(e), n = new Blob([r], { type: "application/json" });
    if (this.isSendBeaconAvailable()) {
      if (navigator.sendBeacon(t, n))
        return !0;
      o("warn", "sendBeacon failed, persisting events for recovery");
    } else
      o("warn", "sendBeacon not available, persisting events for recovery");
    return this.persistEventsForRecovery(e), !1;
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
      o("warn", "Failed to parse persisted data", { error: e }), this.clearPersistedEvents();
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
      return o("warn", "Failed to persist events", { error: t }), !1;
    }
  }
  clearPersistedEvents() {
    try {
      const e = this.getQueueStorageKey();
      this.storeManager.removeItem(e);
    } catch (e) {
      o("warn", "Failed to clear persisted events", { error: e });
    }
  }
  resetRetryState() {
    this.retryCount = 0, this.isRetrying = !1, this.clearRetryTimeout();
  }
  scheduleRetry(e, t) {
    if (this.retryTimeoutId !== null || this.isRetrying)
      return;
    if (this.retryCount >= 3) {
      o("warn", "Max retries reached, giving up", { data: { retryCount: this.retryCount } }), this.clearPersistedEvents(), this.resetRetryState(), t?.onFailure?.();
      return;
    }
    const r = 5e3 * Math.pow(2, this.retryCount);
    this.isRetrying = !0, this.retryTimeoutId = window.setTimeout(async () => {
      this.retryTimeoutId = null, this.retryCount++;
      try {
        await this.send(e) ? (this.clearPersistedEvents(), this.resetRetryState(), t?.onSuccess?.(e.events.length)) : this.retryCount >= 3 ? (this.clearPersistedEvents(), this.resetRetryState(), t?.onFailure?.()) : this.scheduleRetry(e, t);
      } catch (n) {
        if (n instanceof I) {
          this.logPermanentError("Permanent error detected during retry, giving up", n), this.clearPersistedEvents(), this.resetRetryState(), t?.onFailure?.();
          return;
        }
        this.retryCount >= 3 ? (this.clearPersistedEvents(), this.resetRetryState(), t?.onFailure?.()) : this.scheduleRetry(e, t);
      } finally {
        this.isRetrying = !1;
      }
    }, r);
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
  clearRetryTimeout() {
    this.retryTimeoutId !== null && (clearTimeout(this.retryTimeoutId), this.retryTimeoutId = null);
  }
  logPermanentError(e, t) {
    const r = Date.now();
    (!this.lastPermanentErrorLog || this.lastPermanentErrorLog.statusCode !== t.statusCode || r - this.lastPermanentErrorLog.timestamp >= Be) && (o("error", e, {
      data: { status: t.statusCode, message: t.message }
    }), this.lastPermanentErrorLog = { statusCode: t.statusCode, timestamp: r });
  }
}
class ut extends f {
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
    super(), this.googleAnalytics = t, this.dataSender = new lt(e), this.emitter = r;
  }
  async recoverPersistedEvents() {
    await this.dataSender.recoverPersistedEvents({
      onSuccess: (e, t, r) => {
        if (t && t.length > 0) {
          const n = t.map((i) => i.id);
          this.removeProcessedEvents(n), r && this.emitEventsQueue(r);
        }
      },
      onFailure: async () => {
        o("warn", "Failed to recover persisted events");
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
    web_vitals: c,
    error_data: l,
    session_end_reason: u
  }) {
    if (!e) {
      o("error", "Event type is required - event will be ignored");
      return;
    }
    if (!this.get("sessionId")) {
      this.pendingEventsBuffer.length >= 100 && (this.pendingEventsBuffer.shift(), o("warn", "Pending events buffer full - dropping oldest event", {
        data: { maxBufferSize: 100 }
      })), this.pendingEventsBuffer.push({
        type: e,
        page_url: t,
        from_page_url: r,
        scroll_data: n,
        click_data: i,
        custom_event: a,
        web_vitals: c,
        error_data: l,
        session_end_reason: u
      });
      return;
    }
    const p = e === d.SESSION_START || e === d.SESSION_END;
    if (!p && !this.checkRateLimit())
      return;
    const N = e, Re = N === d.SESSION_START, Ce = t || this.get("pageUrl"), $ = this.buildEventPayload({
      type: N,
      page_url: Ce,
      from_page_url: r,
      scroll_data: n,
      click_data: i,
      custom_event: a,
      web_vitals: c,
      error_data: l,
      session_end_reason: u
    });
    if (!(!p && !this.shouldSample())) {
      if (Re) {
        const oe = this.get("sessionId");
        if (!oe) {
          o("error", "Session start event requires sessionId - event will be ignored");
          return;
        }
        if (this.get("hasStartSession")) {
          o("warn", "Duplicate session_start detected", {
            data: { sessionId: oe }
          });
          return;
        }
        this.set("hasStartSession", !0);
      }
      if (!this.isDuplicateEvent($)) {
        if (this.get("mode") === C.QA && N === d.CUSTOM && a) {
          console.log("[TraceLog] Event", {
            name: a.name,
            ...a.metadata && { metadata: a.metadata }
          }), this.emitEvent($);
          return;
        }
        this.addToQueue($);
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
      o("warn", "Cannot flush pending events: session not initialized - keeping in buffer", {
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
          o("warn", "Async flush failed", {
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
      onFailure: async () => {
        o("warn", "Events send failed, keeping in queue", {
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
      id: Ye(),
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
      ...t && fe() && { utm: fe() }
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
      o("warn", "Event queue overflow, oldest non-critical event removed", {
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
    this.emitter && this.emitter.emit(W.EVENT, e);
  }
  emitEventsQueue(e) {
    this.emitter && this.emitter.emit(W.QUEUE, e);
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
    const t = Ve, r = e.getItem(t);
    if (r)
      return r;
    const n = We();
    return e.setItem(t, n), n;
  }
}
class ht extends f {
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
      o("warn", "BroadcastChannel not supported");
      return;
    }
    const e = this.getProjectId();
    this.broadcastChannel = new BroadcastChannel(ze(e)), this.broadcastChannel.onmessage = (t) => {
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
    e && this.broadcastChannel && typeof this.broadcastChannel.postMessage == "function" && this.broadcastChannel.postMessage({
      action: "session_end",
      projectId: this.getProjectId(),
      sessionId: e,
      reason: t,
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
    return Ge(this.getProjectId());
  }
  getProjectId() {
    return this.projectId;
  }
  async startTracking() {
    if (this.isTracking) {
      o("warn", "Session tracking already active");
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
    this.activityHandler = () => this.resetSessionTimeout(), document.addEventListener("click", this.activityHandler, { passive: !0 }), document.addEventListener("keydown", this.activityHandler, { passive: !0 }), document.addEventListener("scroll", this.activityHandler, { passive: !0 });
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
  async endSession(e) {
    const t = this.get("sessionId");
    if (!t) {
      o("warn", "endSession called without active session", { data: { reason: e } }), this.resetSessionState(e);
      return;
    }
    this.eventManager.track({
      type: d.SESSION_END,
      session_end_reason: e
    });
    const r = () => {
      this.broadcastSessionEnd(t, e), this.resetSessionState(e);
    };
    if (this.eventManager.flushImmediatelySync()) {
      r();
      return;
    }
    try {
      await this.eventManager.flushImmediately(), r();
    } catch (i) {
      o("warn", "Async flush failed during session end", { error: i }), r();
    }
  }
  resetSessionState(e) {
    this.clearSessionTimeout(), this.cleanupActivityListeners(), this.cleanupLifecycleListeners(), this.cleanupCrossTabSync(), e !== "page_unload" && this.clearStoredSession(), this.set("sessionId", null), this.set("hasStartSession", !1), this.isTracking = !1;
  }
  async stopTracking() {
    await this.endSession("manual_stop");
  }
  destroy() {
    this.clearSessionTimeout(), this.cleanupActivityListeners(), this.cleanupCrossTabSync(), this.cleanupLifecycleListeners(), this.isTracking = !1, this.set("hasStartSession", !1);
  }
}
class ft extends f {
  eventManager;
  storageManager;
  sessionManager = null;
  destroyed = !1;
  constructor(e, t) {
    super(), this.eventManager = t, this.storageManager = e;
  }
  async startTracking() {
    if (this.isActive())
      return;
    if (this.destroyed) {
      o("warn", "Cannot start tracking on destroyed handler");
      return;
    }
    const e = this.get("config"), t = e?.integrations?.tracelog?.projectId ?? e?.integrations?.custom?.collectApiUrl ?? "default";
    if (!t)
      throw new Error("Cannot start session tracking: config not available");
    try {
      this.sessionManager = new ht(this.storageManager, this.eventManager, t), await this.sessionManager.startTracking(), this.eventManager.flushPendingEvents();
    } catch (r) {
      if (this.sessionManager) {
        try {
          this.sessionManager.destroy();
        } catch {
        }
        this.sessionManager = null;
      }
      throw o("error", "Failed to start session tracking", { error: r }), r;
    }
  }
  isActive() {
    return this.sessionManager !== null && !this.destroyed;
  }
  async cleanupSessionManager() {
    this.sessionManager && (await this.sessionManager.stopTracking(), this.sessionManager.destroy(), this.sessionManager = null);
  }
  async stopTracking() {
    await this.cleanupSessionManager();
  }
  destroy() {
    this.destroyed || (this.sessionManager && (this.sessionManager.destroy(), this.sessionManager = null), this.destroyed = !0, this.set("hasStartSession", !1));
  }
}
class gt extends f {
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
  trackCurrentPage = async () => {
    const e = window.location.href, t = K(e, this.get("config").sensitiveQueryParams);
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
    const e = K(window.location.href, this.get("config").sensitiveQueryParams), t = this.extractPageViewData();
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
class St extends f {
  eventManager;
  clickHandler;
  constructor(e) {
    super(), this.eventManager = e;
  }
  startTracking() {
    this.clickHandler || (this.clickHandler = (e) => {
      const t = e, r = t.target, n = typeof HTMLElement < "u" && r instanceof HTMLElement ? r : typeof HTMLElement < "u" && r instanceof Node && r.parentElement instanceof HTMLElement ? r.parentElement : null;
      if (!n) {
        o("warn", "Click target not found or not an element");
        return;
      }
      const i = this.findTrackingElement(n), a = this.getRelevantClickElement(n), c = this.calculateClickCoordinates(t, n);
      if (i) {
        const u = this.extractTrackingData(i);
        if (u) {
          const p = this.createCustomEventData(u);
          this.eventManager.track({
            type: d.CUSTOM,
            custom_event: {
              name: p.name,
              ...p.value && { metadata: { value: p.value } }
            }
          });
        }
      }
      const l = this.generateClickData(n, a, c);
      this.eventManager.track({
        type: d.CLICK,
        click_data: l
      });
    }, window.addEventListener("click", this.clickHandler, !0));
  }
  stopTracking() {
    this.clickHandler && (window.removeEventListener("click", this.clickHandler, !0), this.clickHandler = void 0);
  }
  findTrackingElement(e) {
    return e.hasAttribute(`${P}-name`) ? e : e.closest(`[${P}-name]`) || void 0;
  }
  getRelevantClickElement(e) {
    for (const t of be)
      try {
        if (e.matches(t))
          return e;
        const r = e.closest(t);
        if (r)
          return r;
      } catch (r) {
        o("warn", "Invalid selector in element search", { error: r, data: { selector: t } });
        continue;
      }
    return e;
  }
  clamp(e) {
    return Math.max(0, Math.min(1, Number(e.toFixed(3))));
  }
  calculateClickCoordinates(e, t) {
    const r = t.getBoundingClientRect(), n = e.clientX, i = e.clientY, a = r.width > 0 ? this.clamp((n - r.left) / r.width) : 0, c = r.height > 0 ? this.clamp((i - r.top) / r.height) : 0;
    return { x: n, y: i, relativeX: a, relativeY: c };
  }
  extractTrackingData(e) {
    const t = e.getAttribute(`${P}-name`), r = e.getAttribute(`${P}-value`);
    if (t)
      return {
        element: e,
        name: t,
        ...r && { value: r }
      };
  }
  generateClickData(e, t, r) {
    const { x: n, y: i, relativeX: a, relativeY: c } = r, l = this.getRelevantText(e, t), u = this.extractElementAttributes(t);
    return {
      x: n,
      y: i,
      relativeX: a,
      relativeY: c,
      tag: t.tagName.toLowerCase(),
      ...t.id && { id: t.id },
      ...t.className && { class: t.className },
      ...l && { text: l },
      ...u.href && { href: u.href },
      ...u.title && { title: u.title },
      ...u.alt && { alt: u.alt },
      ...u.role && { role: u.role },
      ...u["aria-label"] && { ariaLabel: u["aria-label"] },
      ...Object.keys(u).length > 0 && { dataAttributes: u }
    };
  }
  getRelevantText(e, t) {
    const r = e.textContent?.trim() ?? "", n = t.textContent?.trim() ?? "";
    return !r && !n ? "" : r && r.length <= 255 ? r : n.length <= 255 ? n : n.slice(0, 252) + "...";
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
class Et extends f {
  eventManager;
  containers = [];
  limitWarningLogged = !1;
  minDepthChange = 5;
  minIntervalMs = 500;
  maxEventsPerSession = 120;
  constructor(e) {
    super(), this.eventManager = e;
  }
  startTracking() {
    this.limitWarningLogged = !1, this.applyConfigOverrides(), this.set("scrollEventCount", 0);
    const e = this.get("config").scrollContainerSelectors, t = Array.isArray(e) ? e : typeof e == "string" ? [e] : [];
    t.length === 0 ? this.setupScrollContainer(window) : this.trySetupContainers(t, 0);
  }
  stopTracking() {
    for (const e of this.containers)
      this.clearContainerTimer(e), e.element instanceof Window ? window.removeEventListener("scroll", e.listener) : e.element.removeEventListener("scroll", e.listener);
    this.containers.length = 0, this.set("scrollEventCount", 0), this.limitWarningLogged = !1;
  }
  trySetupContainers(e, t) {
    const r = e.map((n) => this.safeQuerySelector(n)).filter(
      (n) => n != null && typeof HTMLElement < "u" && n instanceof HTMLElement
    );
    if (r.length > 0) {
      for (const n of r)
        this.containers.some((a) => a.element === n) || this.setupScrollContainer(n);
      return;
    }
    if (t < 5) {
      setTimeout(() => this.trySetupContainers(e, t + 1), 200);
      return;
    }
    this.containers.length === 0 && this.setupScrollContainer(window);
  }
  setupScrollContainer(e) {
    if (e !== window && !this.isElementScrollable(e))
      return;
    const t = () => {
      this.get("suppressNextScroll") || (this.clearContainerTimer(n), n.debounceTimer = window.setTimeout(() => {
        const i = this.calculateScrollData(n);
        if (i) {
          const a = Date.now();
          this.processScrollEvent(n, i, a);
        }
        n.debounceTimer = null;
      }, 250));
    }, r = this.getScrollTop(e), n = {
      element: e,
      lastScrollPos: r,
      lastDepth: this.calculateScrollDepth(
        r,
        this.getScrollHeight(e),
        this.getViewportHeight(e)
      ),
      lastDirection: k.DOWN,
      lastEventTime: 0,
      debounceTimer: null,
      listener: t
    };
    this.containers.push(n), e instanceof Window ? window.addEventListener("scroll", t, { passive: !0 }) : e.addEventListener("scroll", t, { passive: !0 });
  }
  processScrollEvent(e, t, r) {
    if (!this.shouldEmitScrollEvent(e, t, r))
      return;
    e.lastEventTime = r, e.lastDepth = t.depth, e.lastDirection = t.direction;
    const n = this.get("scrollEventCount") ?? 0;
    this.set("scrollEventCount", n + 1), this.eventManager.track({
      type: d.SCROLL,
      scroll_data: t
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
    this.limitWarningLogged || (this.limitWarningLogged = !0, o("warn", "Max scroll events per session reached", {
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
    return e > t ? k.DOWN : k.UP;
  }
  calculateScrollDepth(e, t, r) {
    if (t <= r)
      return 0;
    const n = t - r;
    return Math.min(100, Math.max(0, Math.floor(e / n * 100)));
  }
  calculateScrollData(e) {
    const { element: t, lastScrollPos: r } = e, n = this.getScrollTop(t);
    if (Math.abs(n - r) < 10 || t === window && !this.isWindowScrollable())
      return null;
    const a = this.getViewportHeight(t), c = this.getScrollHeight(t), l = this.getScrollDirection(n, r), u = this.calculateScrollDepth(n, c, a);
    return e.lastScrollPos = n, { depth: u, direction: l };
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
  safeQuerySelector(e) {
    try {
      return document.querySelector(e);
    } catch (t) {
      return o("warn", "Invalid CSS selector", {
        error: t,
        data: { selector: e },
        showToClient: !0
      }), null;
    }
  }
}
class mt extends f {
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
        o("error", "Google Analytics initialization failed", { error: r });
      }
  }
  trackEvent(e, t) {
    if (!(!e?.trim() || !this.isInitialized || typeof window.gtag != "function"))
      try {
        const r = Array.isArray(t) ? { items: t } : t;
        window.gtag("event", e, r);
      } catch (r) {
        o("error", "Google Analytics event tracking failed", { error: r });
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
      n.id = "tracelog-ga-script", n.async = !0, n.src = `https://www.googletagmanager.com/gtag/js?id=${e}`, n.onload = () => t(), n.onerror = () => r(new Error("Failed to load Google Analytics script")), document.head.appendChild(n);
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
    this.storage = this.initializeStorage("localStorage"), this.sessionStorageRef = this.initializeStorage("sessionStorage"), this.storage || o("warn", "localStorage not available, using memory fallback"), this.sessionStorageRef || o("warn", "sessionStorage not available, using memory fallback");
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
        if (this.hasQuotaExceededError = !0, o("warn", "localStorage quota exceeded, attempting cleanup", {
          data: { key: e, valueSize: t.length }
        }), this.cleanupOldData())
          try {
            if (this.storage) {
              this.storage.setItem(e, t);
              return;
            }
          } catch (i) {
            o("error", "localStorage quota exceeded even after cleanup - data will not persist", {
              error: i,
              data: { key: e, valueSize: t.length }
            });
          }
        else
          o("error", "localStorage quota exceeded and no data to cleanup - data will not persist", {
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
      e.forEach((t) => this.storage.removeItem(t)), this.fallbackStorage.clear();
    } catch (e) {
      o("error", "Failed to clear storage", { error: e }), this.fallbackStorage.clear();
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
      return o("error", "Failed to cleanup old data", { error: e }), !1;
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
      r instanceof DOMException && r.name === "QuotaExceededError" && o("error", "sessionStorage quota exceeded - data will not persist", {
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
class _t extends f {
  eventManager;
  reportedByNav = /* @__PURE__ */ new Map();
  observers = [];
  lastLongTaskSentAt = 0;
  vitalThresholds = Te;
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
        o("warn", "Failed to disconnect performance observer", { error: r, data: { observerIndex: t } });
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
          const c = typeof a.value == "number" ? a.value : 0;
          e += c;
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
          const c = (a.processingEnd ?? 0) - (a.startTime ?? 0);
          n = Math.max(n, c);
        }
        n > 0 && this.sendVital({ type: "INP", value: Number(n.toFixed(2)) });
      },
      { type: "event", buffered: !0 }
    );
  }
  async initWebVitals() {
    try {
      const { onLCP: e, onCLS: t, onFCP: r, onTTFB: n, onINP: i } = await Promise.resolve().then(() => Vt), a = (c) => (l) => {
        const u = Number(l.value.toFixed(2));
        this.sendVital({ type: c, value: u });
      };
      e(a("LCP")), t(a("CLS")), r(a("FCP")), n(a("TTFB")), i(a("INP"));
    } catch (e) {
      o("warn", "Failed to load web-vitals library, using fallback", { error: e }), this.observeWebVitalsFallback();
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
      o("warn", "Failed to report TTFB", { error: e });
    }
  }
  observeLongTasks() {
    this.safeObserve(
      "longtask",
      (e) => {
        const t = e.getEntries();
        for (const r of t) {
          const n = Number(r.duration.toFixed(2)), i = Date.now();
          i - this.lastLongTaskSentAt >= $e && (this.shouldSendVital("LONG_TASK", n) && this.trackWebVital("LONG_TASK", n), this.lastLongTaskSentAt = i);
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
      o("warn", "Invalid web vital value", { data: { type: e, value: t } });
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
      return o("warn", "Failed to get navigation ID", { error: e }), null;
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
      const i = new PerformanceObserver((a, c) => {
        try {
          t(a, c);
        } catch (l) {
          o("warn", "Observer callback failed", {
            error: l,
            data: { type: e }
          });
        }
        if (n)
          try {
            c.disconnect();
          } catch {
          }
      });
      return i.observe(r ?? { type: e, buffered: !0 }), n || this.observers.push(i), !0;
    } catch (i) {
      return o("warn", "Failed to create performance observer", {
        error: i,
        data: { type: e }
      }), !1;
    }
  }
  shouldSendVital(e, t) {
    if (typeof t != "number" || !Number.isFinite(t))
      return o("warn", "Invalid web vital value", { data: { type: e, value: t } }), !1;
    const r = this.vitalThresholds[e];
    return !(typeof r == "number" && t <= r);
  }
}
class Tt extends f {
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
    const t = this.get("config")?.errorSampling ?? 0.1;
    return Math.random() < t;
  }
  handleError = (e) => {
    if (!this.shouldSample())
      return;
    const t = this.sanitize(e.message || "Unknown error");
    this.shouldSuppressError(R.JS_ERROR, t) || this.eventManager.track({
      type: d.ERROR,
      error_data: {
        type: R.JS_ERROR,
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
    this.shouldSuppressError(R.PROMISE_REJECTION, r) || this.eventManager.track({
      type: d.ERROR,
      error_data: {
        type: R.PROMISE_REJECTION,
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
    let t = e.length > ue ? e.slice(0, ue) + "..." : e;
    for (const r of ve) {
      const n = new RegExp(r.source, r.flags);
      t = t.replace(n, "[REDACTED]");
    }
    return t;
  }
  shouldSuppressError(e, t) {
    const r = Date.now(), n = `${e}:${t}`, i = this.recentErrors.get(n);
    return i && r - i < de ? (this.recentErrors.set(n, r), !0) : (this.recentErrors.set(n, r), this.recentErrors.size > Qe ? (this.recentErrors.clear(), this.recentErrors.set(n, r), !1) : (this.recentErrors.size > U && this.pruneOldErrors(), !1));
  }
  pruneOldErrors() {
    const e = Date.now();
    for (const [n, i] of this.recentErrors.entries())
      e - i > de && this.recentErrors.delete(n);
    if (this.recentErrors.size <= U)
      return;
    const t = Array.from(this.recentErrors.entries()).sort((n, i) => n[1] - i[1]), r = this.recentErrors.size - U;
    for (let n = 0; n < r; n += 1) {
      const i = t[n];
      i && this.recentErrors.delete(i[0]);
    }
  }
}
class vt extends f {
  isInitialized = !1;
  suppressNextScrollTimer = null;
  emitter = new ct();
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
        this.setupState(e), await this.setupIntegrations(), this.managers.event = new ut(this.managers.storage, this.integrations.googleAnalytics, this.emitter), await this.initializeHandlers(), await this.managers.event.recoverPersistedEvents().catch((t) => {
          o("warn", "Failed to recover persisted events", { error: t });
        }), this.isInitialized = !0;
      } catch (t) {
        await this.destroy(!0);
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
  async destroy(e = !1) {
    if (!this.isInitialized && !e)
      return;
    this.integrations.googleAnalytics?.cleanup();
    const t = Object.values(this.handlers).filter(Boolean).map(async (r) => {
      try {
        await r.stopTracking();
      } catch (n) {
        o("warn", "Failed to stop tracking", { error: n });
      }
    });
    await Promise.allSettled(t), this.suppressNextScrollTimer && (clearTimeout(this.suppressNextScrollTimer), this.suppressNextScrollTimer = null), this.managers.event?.flushImmediatelySync(), this.managers.event?.stop(), this.emitter.removeAllListeners(), this.set("hasStartSession", !1), this.set("suppressNextScroll", !1), this.set("sessionId", null), this.isInitialized = !1, this.handlers = {};
  }
  setupState(e = {}) {
    this.set("config", e);
    const t = dt.getId(this.managers.storage);
    this.set("userId", t);
    const r = Ke(e);
    this.set("collectApiUrl", r);
    const n = xe();
    this.set("device", n);
    const i = K(window.location.href, e.sensitiveQueryParams);
    this.set("pageUrl", i);
    const a = Xe() ? C.QA : void 0;
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
  async initializeHandlers() {
    this.handlers.session = new ft(
      this.managers.storage,
      this.managers.event
    ), await this.handlers.session.startTracking();
    const e = () => {
      this.set("suppressNextScroll", !0), this.suppressNextScrollTimer && clearTimeout(this.suppressNextScrollTimer), this.suppressNextScrollTimer = window.setTimeout(() => {
        this.set("suppressNextScroll", !1);
      }, 250 * 2);
    };
    this.handlers.pageView = new gt(this.managers.event, e), this.handlers.pageView.startTracking(), this.handlers.click = new St(this.managers.event), this.handlers.click.startTracking(), this.handlers.scroll = new Et(this.managers.event), this.handlers.scroll.startTracking(), this.handlers.performance = new _t(this.managers.event), this.handlers.performance.startTracking().catch((t) => {
      o("warn", "Failed to start performance tracking", { error: t });
    }), this.handlers.error = new Tt(this.managers.event), this.handlers.error.startTracking();
  }
}
const y = [];
let h = null, M = !1, H = !1;
const It = async (s) => {
  if (typeof window > "u" || typeof document > "u")
    throw new Error("[TraceLog] This library can only be used in a browser environment");
  if (!window.__traceLogDisabled && !h && !M) {
    M = !0;
    try {
      const e = rt(s ?? {}), t = new vt();
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
          await t.destroy(!0);
        } catch (n) {
          o("error", "Failed to cleanup partially initialized app", { error: n });
        }
        throw r;
      }
    } catch (e) {
      throw h = null, e;
    } finally {
      M = !1;
    }
  }
}, yt = (s, e) => {
  if (!h)
    throw new Error("[TraceLog] TraceLog not initialized. Please call init() first.");
  if (H)
    throw new Error("[TraceLog] Cannot send events while TraceLog is being destroyed");
  h.sendCustomEvent(s, e);
}, At = (s, e) => {
  if (!h || M) {
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
}, Mt = () => h !== null, Lt = async () => {
  if (!h)
    throw new Error("[TraceLog] App not initialized");
  if (H)
    throw new Error("[TraceLog] Destroy operation already in progress");
  H = !0;
  try {
    await h.destroy(), h = null, M = !1, y.length = 0;
  } catch (s) {
    h = null, M = !1, y.length = 0, o("warn", "Error during destroy, forced cleanup completed", { error: s });
  } finally {
    H = !1;
  }
}, Gt = {
  WEB_VITALS_THRESHOLDS: Te
  // Business thresholds for performance analysis
}, zt = {
  PII_PATTERNS: ve
  // Patterns for sensitive data protection
}, $t = {
  LOW_ACTIVITY_EVENT_COUNT: 50,
  HIGH_ACTIVITY_EVENT_COUNT: 1e3,
  MIN_EVENTS_FOR_DYNAMIC_CALCULATION: 100,
  MIN_EVENTS_FOR_TREND_ANALYSIS: 30,
  BOUNCE_RATE_SESSION_THRESHOLD: 1,
  // Sessions with 1 page view = bounce
  MIN_ENGAGED_SESSION_DURATION_MS: 30 * 1e3,
  MIN_SCROLL_DEPTH_ENGAGEMENT: 25
  // 25% scroll depth for engagement
}, Qt = {
  INACTIVITY_TIMEOUT_MS: 30 * 60 * 1e3,
  // 30min for analytics (vs 15min client)
  SHORT_SESSION_THRESHOLD_MS: 30 * 1e3,
  MEDIUM_SESSION_THRESHOLD_MS: 5 * 60 * 1e3,
  LONG_SESSION_THRESHOLD_MS: 30 * 60 * 1e3,
  MAX_REALISTIC_SESSION_DURATION_MS: 8 * 60 * 60 * 1e3
  // Filter outliers
}, Bt = {
  MOBILE_MAX_WIDTH: 768,
  TABLET_MAX_WIDTH: 1024,
  MOBILE_PERFORMANCE_FACTOR: 1.5,
  // Mobile typically 1.5x slower
  TABLET_PERFORMANCE_FACTOR: 1.2
}, jt = {
  MIN_TEXT_LENGTH_FOR_ANALYSIS: 10,
  MIN_CLICKS_FOR_HOT_ELEMENT: 10,
  // Popular element threshold
  MIN_SCROLL_COMPLETION_PERCENT: 80,
  // Page consumption threshold
  MIN_TIME_ON_PAGE_FOR_READ_MS: 15 * 1e3
}, Xt = {
  SIGNIFICANT_CHANGE_PERCENT: 20,
  MAJOR_CHANGE_PERCENT: 50,
  MIN_EVENTS_FOR_INSIGHT: 100,
  MIN_SESSIONS_FOR_INSIGHT: 10,
  MIN_CORRELATION_STRENGTH: 0.7,
  // Strong correlation threshold
  LOW_ERROR_RATE_PERCENT: 1,
  HIGH_ERROR_RATE_PERCENT: 5,
  CRITICAL_ERROR_RATE_PERCENT: 10
}, Wt = {
  SHORT_TERM_TREND_HOURS: 24,
  MEDIUM_TERM_TREND_DAYS: 7,
  LONG_TERM_TREND_DAYS: 30,
  MIN_DATA_POINTS_FOR_TREND: 5,
  WEEKLY_PATTERN_MIN_WEEKS: 4,
  DAILY_PATTERN_MIN_DAYS: 14
}, Yt = {
  MIN_SEGMENT_SIZE: 10,
  MIN_COHORT_SIZE: 5,
  COHORT_ANALYSIS_DAYS: [1, 3, 7, 14, 30],
  MIN_FUNNEL_EVENTS: 20
}, Kt = {
  DEFAULT_EVENTS_LIMIT: 5,
  DEFAULT_SESSIONS_LIMIT: 5,
  DEFAULT_PAGES_LIMIT: 5,
  MAX_EVENTS_FOR_DEEP_ANALYSIS: 1e4,
  MAX_TIME_RANGE_DAYS: 365,
  ANALYTICS_BATCH_SIZE: 1e3
  // For historical analysis
}, qt = {
  ANOMALY_THRESHOLD_SIGMA: 2.5,
  STRONG_ANOMALY_THRESHOLD_SIGMA: 3,
  TRAFFIC_DROP_ALERT_PERCENT: -30,
  TRAFFIC_SPIKE_ALERT_PERCENT: 200,
  MIN_BASELINE_DAYS: 7,
  MIN_EVENTS_FOR_ANOMALY_DETECTION: 50
}, Zt = {
  PAGE_URL_EXCLUDED: "excluded",
  PAGE_URL_UNKNOWN: "unknown"
}, Jt = {
  init: It,
  event: yt,
  on: At,
  off: wt,
  isInitialized: Mt,
  destroy: Lt
};
var Z, Ie = -1, L = function(s) {
  addEventListener("pageshow", function(e) {
    e.persisted && (Ie = e.timeStamp, s(e));
  }, !0);
}, ne = function() {
  var s = self.performance && performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
  if (s && s.responseStart > 0 && s.responseStart < performance.now()) return s;
}, F = function() {
  var s = ne();
  return s && s.activationStart || 0;
}, S = function(s, e) {
  var t = ne(), r = "navigate";
  return Ie >= 0 ? r = "back-forward-cache" : t && (document.prerendering || F() > 0 ? r = "prerender" : document.wasDiscarded ? r = "restore" : t.type && (r = t.type.replace(/_/g, "-"))), { name: s, value: e === void 0 ? -1 : e, rating: "good", delta: 0, entries: [], id: "v4-".concat(Date.now(), "-").concat(Math.floor(8999999999999 * Math.random()) + 1e12), navigationType: r };
}, O = function(s, e, t) {
  try {
    if (PerformanceObserver.supportedEntryTypes.includes(s)) {
      var r = new PerformanceObserver(function(n) {
        Promise.resolve().then(function() {
          e(n.getEntries());
        });
      });
      return r.observe(Object.assign({ type: s, buffered: !0 }, t || {})), r;
    }
  } catch {
  }
}, E = function(s, e, t, r) {
  var n, i;
  return function(a) {
    e.value >= 0 && (a || r) && ((i = e.value - (n || 0)) || n === void 0) && (n = e.value, e.delta = i, e.rating = function(c, l) {
      return c > l[1] ? "poor" : c > l[0] ? "needs-improvement" : "good";
    }(e.value, t), s(e));
  };
}, ie = function(s) {
  requestAnimationFrame(function() {
    return requestAnimationFrame(function() {
      return s();
    });
  });
}, G = function(s) {
  document.addEventListener("visibilitychange", function() {
    document.visibilityState === "hidden" && s();
  });
}, ae = function(s) {
  var e = !1;
  return function() {
    e || (s(), e = !0);
  };
}, w = -1, me = function() {
  return document.visibilityState !== "hidden" || document.prerendering ? 1 / 0 : 0;
}, V = function(s) {
  document.visibilityState === "hidden" && w > -1 && (w = s.type === "visibilitychange" ? s.timeStamp : 0, Nt());
}, pe = function() {
  addEventListener("visibilitychange", V, !0), addEventListener("prerenderingchange", V, !0);
}, Nt = function() {
  removeEventListener("visibilitychange", V, !0), removeEventListener("prerenderingchange", V, !0);
}, ye = function() {
  return w < 0 && (w = me(), pe(), L(function() {
    setTimeout(function() {
      w = me(), pe();
    }, 0);
  })), { get firstHiddenTime() {
    return w;
  } };
}, z = function(s) {
  document.prerendering ? addEventListener("prerenderingchange", function() {
    return s();
  }, !0) : s();
}, J = [1800, 3e3], Ae = function(s, e) {
  e = e || {}, z(function() {
    var t, r = ye(), n = S("FCP"), i = O("paint", function(a) {
      a.forEach(function(c) {
        c.name === "first-contentful-paint" && (i.disconnect(), c.startTime < r.firstHiddenTime && (n.value = Math.max(c.startTime - F(), 0), n.entries.push(c), t(!0)));
      });
    });
    i && (t = E(s, n, J, e.reportAllChanges), L(function(a) {
      n = S("FCP"), t = E(s, n, J, e.reportAllChanges), ie(function() {
        n.value = performance.now() - a.timeStamp, t(!0);
      });
    }));
  });
}, ee = [0.1, 0.25], Rt = function(s, e) {
  e = e || {}, Ae(ae(function() {
    var t, r = S("CLS", 0), n = 0, i = [], a = function(l) {
      l.forEach(function(u) {
        if (!u.hadRecentInput) {
          var p = i[0], N = i[i.length - 1];
          n && u.startTime - N.startTime < 1e3 && u.startTime - p.startTime < 5e3 ? (n += u.value, i.push(u)) : (n = u.value, i = [u]);
        }
      }), n > r.value && (r.value = n, r.entries = i, t());
    }, c = O("layout-shift", a);
    c && (t = E(s, r, ee, e.reportAllChanges), G(function() {
      a(c.takeRecords()), t(!0);
    }), L(function() {
      n = 0, r = S("CLS", 0), t = E(s, r, ee, e.reportAllChanges), ie(function() {
        return t();
      });
    }), setTimeout(t, 0));
  }));
}, we = 0, B = 1 / 0, D = 0, Ct = function(s) {
  s.forEach(function(e) {
    e.interactionId && (B = Math.min(B, e.interactionId), D = Math.max(D, e.interactionId), we = D ? (D - B) / 7 + 1 : 0);
  });
}, Me = function() {
  return Z ? we : performance.interactionCount || 0;
}, bt = function() {
  "interactionCount" in performance || Z || (Z = O("event", Ct, { type: "event", buffered: !0, durationThreshold: 0 }));
}, g = [], x = /* @__PURE__ */ new Map(), Le = 0, Ot = function() {
  var s = Math.min(g.length - 1, Math.floor((Me() - Le) / 50));
  return g[s];
}, Pt = [], Dt = function(s) {
  if (Pt.forEach(function(n) {
    return n(s);
  }), s.interactionId || s.entryType === "first-input") {
    var e = g[g.length - 1], t = x.get(s.interactionId);
    if (t || g.length < 10 || s.duration > e.latency) {
      if (t) s.duration > t.latency ? (t.entries = [s], t.latency = s.duration) : s.duration === t.latency && s.startTime === t.entries[0].startTime && t.entries.push(s);
      else {
        var r = { id: s.interactionId, latency: s.duration, entries: [s] };
        x.set(r.id, r), g.push(r);
      }
      g.sort(function(n, i) {
        return i.latency - n.latency;
      }), g.length > 10 && g.splice(10).forEach(function(n) {
        return x.delete(n.id);
      });
    }
  }
}, Ne = function(s) {
  var e = self.requestIdleCallback || self.setTimeout, t = -1;
  return s = ae(s), document.visibilityState === "hidden" ? s() : (t = e(s), G(s)), t;
}, te = [200, 500], kt = function(s, e) {
  "PerformanceEventTiming" in self && "interactionId" in PerformanceEventTiming.prototype && (e = e || {}, z(function() {
    var t;
    bt();
    var r, n = S("INP"), i = function(c) {
      Ne(function() {
        c.forEach(Dt);
        var l = Ot();
        l && l.latency !== n.value && (n.value = l.latency, n.entries = l.entries, r());
      });
    }, a = O("event", i, { durationThreshold: (t = e.durationThreshold) !== null && t !== void 0 ? t : 40 });
    r = E(s, n, te, e.reportAllChanges), a && (a.observe({ type: "first-input", buffered: !0 }), G(function() {
      i(a.takeRecords()), r(!0);
    }), L(function() {
      Le = Me(), g.length = 0, x.clear(), n = S("INP"), r = E(s, n, te, e.reportAllChanges);
    }));
  }));
}, re = [2500, 4e3], j = {}, Ut = function(s, e) {
  e = e || {}, z(function() {
    var t, r = ye(), n = S("LCP"), i = function(l) {
      e.reportAllChanges || (l = l.slice(-1)), l.forEach(function(u) {
        u.startTime < r.firstHiddenTime && (n.value = Math.max(u.startTime - F(), 0), n.entries = [u], t());
      });
    }, a = O("largest-contentful-paint", i);
    if (a) {
      t = E(s, n, re, e.reportAllChanges);
      var c = ae(function() {
        j[n.id] || (i(a.takeRecords()), a.disconnect(), j[n.id] = !0, t(!0));
      });
      ["keydown", "click"].forEach(function(l) {
        addEventListener(l, function() {
          return Ne(c);
        }, { once: !0, capture: !0 });
      }), G(c), L(function(l) {
        n = S("LCP"), t = E(s, n, re, e.reportAllChanges), ie(function() {
          n.value = performance.now() - l.timeStamp, j[n.id] = !0, t(!0);
        });
      });
    }
  });
}, se = [800, 1800], Ht = function s(e) {
  document.prerendering ? z(function() {
    return s(e);
  }) : document.readyState !== "complete" ? addEventListener("load", function() {
    return s(e);
  }, !0) : setTimeout(e, 0);
}, xt = function(s, e) {
  e = e || {};
  var t = S("TTFB"), r = E(s, t, se, e.reportAllChanges);
  Ht(function() {
    var n = ne();
    n && (t.value = Math.max(n.responseStart - F(), 0), t.entries = [n], r(!0), L(function() {
      t = S("TTFB", 0), (r = E(s, t, se, e.reportAllChanges))(!0);
    }));
  });
};
const Vt = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  CLSThresholds: ee,
  FCPThresholds: J,
  INPThresholds: te,
  LCPThresholds: re,
  TTFBThresholds: se,
  onCLS: Rt,
  onFCP: Ae,
  onINP: kt,
  onLCP: Ut,
  onTTFB: xt
}, Symbol.toStringTag, { value: "Module" }));
export {
  Kt as ANALYTICS_QUERY_LIMITS,
  qt as ANOMALY_DETECTION,
  A as AppConfigValidationError,
  jt as CONTENT_ANALYTICS,
  zt as DATA_PROTECTION,
  Bt as DEVICE_ANALYTICS,
  _ as DeviceType,
  $t as ENGAGEMENT_THRESHOLDS,
  W as EmitterEvent,
  R as ErrorType,
  d as EventType,
  Xt as INSIGHT_THRESHOLDS,
  Ft as InitializationTimeoutError,
  v as IntegrationValidationError,
  C as Mode,
  Gt as PERFORMANCE_CONFIG,
  I as PermanentError,
  Yt as SEGMENTATION_ANALYTICS,
  Qt as SESSION_ANALYTICS,
  Zt as SPECIAL_PAGE_URLS,
  ce as SamplingRateValidationError,
  k as ScrollDirection,
  De as SessionTimeoutValidationError,
  X as SpecialApiUrl,
  Wt as TEMPORAL_ANALYSIS,
  b as TraceLogValidationError,
  Jt as tracelog
};
