import { EventManager } from '../managers/event.manager';
import { StateManager } from '../managers/state.manager';
import { EventType, WebVitalMetric, WebVitalType } from '../types';
import {
  MAX_NAVIGATION_HISTORY,
  PRECISION_TWO_DECIMALS,
  getWebVitalsThresholds,
  DEFAULT_WEB_VITALS_MODE,
} from '../constants';
import { log } from '../utils';

type LayoutShiftEntry = PerformanceEntry & { value?: number; hadRecentInput?: boolean };

/**
 * Captures Web Vitals and performance metrics using the web-vitals library with fallback to native Performance Observer API.
 *
 * **Features**:
 * - Configurable filtering modes: 'all' (default), 'needs-improvement', 'poor'
 * - Custom threshold overrides via webVitalsThresholds config
 * - Buffers metrics per navigation and consolidates them into ONE event (see "Consolidation" below)
 * - Navigation-boundary detection with 50-navigation FIFO history
 * - CLS accumulation with reset on navigation change
 * - Automatic fallback to Performance Observer if web-vitals library fails
 * - Final values only (reportAllChanges: false for all metrics)
 *
 * **Events Generated**: `web_vitals` (consolidated shape: `{ schema: 'consolidated', metrics: [...] }`)
 *
 * **Metrics Captured**:
 * - LCP (Largest Contentful Paint): Main content loading time
 * - CLS (Cumulative Layout Shift): Visual stability score
 * - FCP (First Contentful Paint): Initial rendering time
 * - TTFB (Time to First Byte): Server response time
 * - INP (Interaction to Next Paint): Responsiveness measure
 *
 * **Consolidation**: metrics for the current navigation are buffered (not sent
 * individually) and flushed as ONE `WEB_VITALS` event carrying every metric
 * measured so far. The buffer flushes on `pagehide` / `visibilitychange`
 * (document hidden) and on a navigation-boundary change (SPA route change,
 * which never fires `pagehide`). This is what makes capturing every metric,
 * including good ones, affordable: up to 5 per-metric events collapse into 1.
 *
 * **Flush ordering**: the lifecycle listeners are registered only AFTER the
 * `web-vitals` library has registered its own, and each flush drains the event
 * queue itself. Both halves are load-bearing — see `registerLifecycleListeners`.
 *
 * **Filtering Modes**:
 * - 'all': Track every measured value, including good ones (no threshold; default)
 * - 'needs-improvement': Track metrics exceeding good thresholds (censors good values)
 * - 'poor': Track only critical performance issues (most heavily censored)
 *
 * @example
 * ```typescript
 * const handler = new PerformanceHandler(eventManager);
 * await handler.startTracking();
 * // Web Vitals are now being tracked with default 'all' mode
 * handler.stopTracking();
 * ```
 */
export class PerformanceHandler extends StateManager {
  private readonly eventManager: EventManager;
  private readonly seenNavIds: Set<string> = new Set();
  private readonly navigationHistory: string[] = []; // FIFO queue for tracking navigation order
  private readonly observers: PerformanceObserver[] = [];
  private vitalThresholds: Record<WebVitalType, number>;
  private navigationCounter = 0; // Suffix counter for repeat navigations to the same path (SPA A→B→A)
  private currentNavBase: string | null = null;
  private currentNavId: string | null = null;

  // Metrics measured for the navigation currently being buffered, keyed by
  // type (last value wins — CLS/INP fallback observers can re-report a
  // running total for the same type before flush). Flushed as ONE
  // consolidated event on pagehide/hidden or when a new navigation starts.
  private readonly currentBuffer: Map<WebVitalType, number> = new Map();
  private currentBufferNavId: string | null = null;

  private isTracking = false;
  private lifecycleListenersRegistered = false;

  private readonly pageHideHandler = (): void => {
    // Unconditional: `flushOnPageHidden` opts out of beaconing when the tab is
    // merely hidden, not when the page is being torn down. `App`'s own
    // `pagehide` drain is unconditional for the same reason.
    this.flushAndDeliver(true);
  };

  private readonly visibilityHandler = (): void => {
    if (typeof document !== 'undefined' && document.hidden) {
      this.flushAndDeliver(this.get('config').flushOnPageHidden !== false);
    }
  };

  constructor(eventManager: EventManager) {
    super();
    this.eventManager = eventManager;
    this.vitalThresholds = getWebVitalsThresholds(DEFAULT_WEB_VITALS_MODE);
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
  async startTracking(): Promise<void> {
    const config = this.get('config');
    const mode = config?.webVitalsMode ?? DEFAULT_WEB_VITALS_MODE;

    this.vitalThresholds = getWebVitalsThresholds(mode);

    if (config?.webVitalsThresholds) {
      this.vitalThresholds = { ...this.vitalThresholds, ...config.webVitalsThresholds };
    }

    this.isTracking = true;

    try {
      await this.initWebVitals();
    } finally {
      // `finally`, not a plain trailing call: if the web-vitals import rejects
      // in a way the fallback rethrows, the buffer would otherwise fill with
      // metrics nothing ever flushes.
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
  private registerLifecycleListeners(): void {
    if (!this.isTracking || this.lifecycleListenersRegistered) {
      return;
    }

    this.lifecycleListenersRegistered = true;

    window.addEventListener('pagehide', this.pageHideHandler);
    document.addEventListener('visibilitychange', this.visibilityHandler);
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
  stopTracking(): void {
    this.isTracking = false;
    this.lifecycleListenersRegistered = false;

    this.flushConsolidatedVitals();

    window.removeEventListener('pagehide', this.pageHideHandler);
    document.removeEventListener('visibilitychange', this.visibilityHandler);

    this.observers.forEach((obs, index) => {
      try {
        obs.disconnect();
      } catch (error) {
        log('debug', 'Failed to disconnect performance observer', { error, data: { observerIndex: index } });
      }
    });

    this.observers.length = 0;
    this.seenNavIds.clear();
    this.navigationHistory.length = 0;
    this.navigationCounter = 0;
    this.currentNavBase = null;
    this.currentNavId = null;
    this.currentBuffer.clear();
    this.currentBufferNavId = null;
  }

  private observeWebVitalsFallback(): void {
    this.reportTTFB();

    this.safeObserve(
      'largest-contentful-paint',
      (list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];

        if (!last) {
          return;
        }

        this.sendVital({ type: 'LCP', value: Number(last.startTime.toFixed(PRECISION_TWO_DECIMALS)) });
      },
      { type: 'largest-contentful-paint', buffered: true },
      true,
    );

    let clsValue = 0;
    let currentNavId = this.getNavigationId();

    this.safeObserve(
      'layout-shift',
      (list) => {
        const navId = this.getNavigationId();

        if (navId !== currentNavId) {
          clsValue = 0;
          currentNavId = navId;
        }

        const entries = list.getEntries() as LayoutShiftEntry[];

        for (const entry of entries) {
          if (entry.hadRecentInput === true) {
            continue;
          }

          const value = typeof entry.value === 'number' ? entry.value : 0;
          clsValue += value;
        }

        this.sendVital({ type: 'CLS', value: Number(clsValue.toFixed(PRECISION_TWO_DECIMALS)) });
      },
      { type: 'layout-shift', buffered: true },
    );

    this.safeObserve(
      'paint',
      (list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.sendVital({ type: 'FCP', value: Number(entry.startTime.toFixed(PRECISION_TWO_DECIMALS)) });
          }
        }
      },
      { type: 'paint', buffered: true },
      true,
    );

    this.safeObserve(
      'event',
      (list) => {
        let worst = 0;
        const entries = list.getEntries() as Array<{ startTime: number; processingEnd?: number }>;

        for (const entry of entries) {
          const dur = (entry.processingEnd ?? 0) - (entry.startTime ?? 0);
          worst = Math.max(worst, dur);
        }

        if (worst > 0) {
          this.sendVital({ type: 'INP', value: Number(worst.toFixed(PRECISION_TWO_DECIMALS)) });
        }
      },
      { type: 'event', buffered: true },
    );
  }

  private async initWebVitals(): Promise<void> {
    try {
      const { onLCP, onCLS, onFCP, onTTFB, onINP } = await import('web-vitals');

      const report =
        (type: WebVitalType) =>
        (metric: { value: number }): void => {
          const value = Number(metric.value.toFixed(PRECISION_TWO_DECIMALS));
          this.sendVital({ type, value });
        };

      onLCP(report('LCP'), { reportAllChanges: false });
      onCLS(report('CLS'), { reportAllChanges: false });
      onFCP(report('FCP'), { reportAllChanges: false });
      onTTFB(report('TTFB'), { reportAllChanges: false });
      onINP(report('INP'), { reportAllChanges: false });
    } catch (error) {
      log('debug', 'Failed to load web-vitals library, using fallback', { error });
      this.observeWebVitalsFallback();
    }
  }

  private reportTTFB(): void {
    try {
      const nav = performance.getEntriesByType('navigation')[0];

      if (!nav) {
        return;
      }

      const ttfb = nav.responseStart;

      // TTFB can be 0 in Mobile Safari when response is served from cache
      if (typeof ttfb === 'number' && Number.isFinite(ttfb)) {
        this.sendVital({ type: 'TTFB', value: Number(ttfb.toFixed(PRECISION_TWO_DECIMALS)) });
      }
    } catch (error) {
      log('debug', 'Failed to report TTFB', { error });
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
  private sendVital(sample: { type: WebVitalType; value: number }): void {
    if (!this.shouldSendVital(sample.type, sample.value)) {
      return;
    }

    const navId = this.getNavigationId();

    if (navId) {
      if (!this.seenNavIds.has(navId)) {
        this.seenNavIds.add(navId);
        this.navigationHistory.push(navId);

        if (this.navigationHistory.length > MAX_NAVIGATION_HISTORY) {
          const oldestNav = this.navigationHistory.shift();
          if (oldestNav) {
            this.seenNavIds.delete(oldestNav);
          }
        }
      }

      if (navId !== this.currentBufferNavId) {
        this.flushConsolidatedVitals();
        this.currentBufferNavId = navId;
      }
    }

    this.currentBuffer.set(sample.type, sample.value);
  }

  /**
   * Consolidates whatever is currently buffered into ONE `WEB_VITALS` event
   * and clears the buffer. No-op when nothing is buffered — safe to call
   * from both lifecycle listeners on every `pagehide`/hidden transition, and
   * from `sendVital` on every navigation-boundary change.
   *
   * @returns `true` when an event was tracked, `false` when the buffer was empty
   */
  private flushConsolidatedVitals(): boolean {
    if (this.currentBuffer.size === 0) {
      return false;
    }

    // Sorted by type, not left in arrival order: the payload is a wire contract,
    // and a canonical order makes two samples directly comparable — including by
    // `EventManager`'s dedup fingerprint, which stringifies this object and would
    // otherwise treat the same measurements as different when they arrived in a
    // different sequence. Arrival order carries no meaning downstream (the API
    // validates one entry per type, never position).
    const metrics: WebVitalMetric[] = Array.from(this.currentBuffer, ([type, value]) => ({ type, value })).sort(
      (a, b) => a.type.localeCompare(b.type),
    );
    this.currentBuffer.clear();

    this.eventManager.track({
      type: EventType.WEB_VITALS,
      web_vitals: {
        schema: 'consolidated',
        metrics,
      },
    });

    return true;
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
  private flushAndDeliver(canDeliver: boolean): void {
    if (!this.flushConsolidatedVitals() || !canDeliver) {
      return;
    }

    this.eventManager.flushImmediatelySync();
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
  private getNavigationId(): string | null {
    try {
      const nav = performance.getEntriesByType('navigation')[0];

      if (!nav) {
        return null;
      }

      const baseId = `${nav.startTime.toFixed(2)}_${window.location.pathname}`;

      if (baseId === this.currentNavBase && this.currentNavId !== null) {
        return this.currentNavId;
      }

      this.currentNavBase = baseId;
      this.currentNavId = this.seenNavIds.has(baseId) ? `${baseId}_${++this.navigationCounter}` : baseId;

      return this.currentNavId;
    } catch (error) {
      log('debug', 'Failed to get navigation ID', { error });
      return null;
    }
  }

  private isObserverSupported(type: string): boolean {
    if (typeof PerformanceObserver === 'undefined') return false;
    const supported = PerformanceObserver.supportedEntryTypes;
    return !supported || supported.includes(type);
  }

  private safeObserve(
    type: string,
    cb: PerformanceObserverCallback,
    options?: PerformanceObserverInit,
    once = false,
  ): boolean {
    try {
      if (!this.isObserverSupported(type)) {
        return false;
      }

      const obs = new PerformanceObserver((list, observer) => {
        try {
          cb(list, observer);
        } catch (callbackError) {
          log('debug', 'Observer callback failed', {
            error: callbackError,
            data: { type },
          });
        }

        if (once) {
          try {
            observer.disconnect();
          } catch {
            /* empty */
          }
        }
      });

      obs.observe(options ?? { type, buffered: true });

      if (!once) {
        this.observers.push(obs);
      }

      return true;
    } catch (error) {
      log('debug', 'Failed to create performance observer', {
        error,
        data: { type },
      });
      return false;
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
  private shouldSendVital(type: WebVitalType, value?: number): boolean {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      log('debug', 'Invalid web vital value', { data: { type, value } });
      return false;
    }

    const threshold = this.vitalThresholds[type];

    if (typeof threshold === 'number' && value <= threshold) {
      return false;
    }

    return true;
  }
}
