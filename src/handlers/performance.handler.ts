import { EventManager } from '../managers/event.manager';
import { StateManager } from '../managers/state.manager';
import { EventType, WebVitalType } from '../types';
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
 * - Configurable filtering modes: 'all', 'needs-improvement' (default), 'poor'
 * - Custom threshold overrides via webVitalsThresholds config
 * - Navigation-based deduplication with 50-navigation FIFO history
 * - CLS accumulation with reset on navigation change
 * - Automatic fallback to Performance Observer if web-vitals library fails
 * - Final values only (reportAllChanges: false for all metrics)
 *
 * **Events Generated**: `web_vitals`
 *
 * **Metrics Captured**:
 * - LCP (Largest Contentful Paint): Main content loading time
 * - CLS (Cumulative Layout Shift): Visual stability score
 * - FCP (First Contentful Paint): Initial rendering time
 * - TTFB (Time to First Byte): Server response time
 * - INP (Interaction to Next Paint): Responsiveness measure
 *
 * **Filtering Modes**:
 * - 'all': Track all positive metric values (threshold = 0)
 * - 'needs-improvement': Track metrics exceeding good thresholds (default)
 * - 'poor': Track only critical performance issues
 *
 * @example
 * ```typescript
 * const handler = new PerformanceHandler(eventManager);
 * await handler.startTracking();
 * // Web Vitals are now being tracked with default 'needs-improvement' mode
 * handler.stopTracking();
 * ```
 */
export class PerformanceHandler extends StateManager {
  private readonly eventManager: EventManager;
  private readonly reportedByNav: Map<string, Set<string>> = new Map();
  private readonly navigationHistory: string[] = []; // FIFO queue for tracking navigation order
  private readonly observers: PerformanceObserver[] = [];
  private vitalThresholds: Record<WebVitalType, number>;
  private navigationCounter = 0; // Suffix counter for repeat navigations to the same path (SPA A→B→A)
  private currentNavBase: string | null = null;
  private currentNavId: string | null = null;

  constructor(eventManager: EventManager) {
    super();
    this.eventManager = eventManager;
    this.vitalThresholds = getWebVitalsThresholds(DEFAULT_WEB_VITALS_MODE);
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
  async startTracking(): Promise<void> {
    const config = this.get('config');
    const mode = config?.webVitalsMode ?? DEFAULT_WEB_VITALS_MODE;

    this.vitalThresholds = getWebVitalsThresholds(mode);

    if (config?.webVitalsThresholds) {
      this.vitalThresholds = { ...this.vitalThresholds, ...config.webVitalsThresholds };
    }

    await this.initWebVitals();
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
  stopTracking(): void {
    this.observers.forEach((obs, index) => {
      try {
        obs.disconnect();
      } catch (error) {
        log('debug', 'Failed to disconnect performance observer', { error, data: { observerIndex: index } });
      }
    });

    this.observers.length = 0;
    this.reportedByNav.clear();
    this.navigationHistory.length = 0;
    this.navigationCounter = 0;
    this.currentNavBase = null;
    this.currentNavId = null;
  }

  private observeWebVitalsFallback(): void {
    this.reportTTFB();

    this.safeObserve(
      'largest-contentful-paint',
      (list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1] as (PerformanceEntry & { startTime: number }) | undefined;

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
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;

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

  private sendVital(sample: { type: WebVitalType; value: number }): void {
    if (!this.shouldSendVital(sample.type, sample.value)) {
      return;
    }

    const navId = this.getNavigationId();

    if (navId) {
      const reportedForNav = this.reportedByNav.get(navId);
      const isDuplicate = reportedForNav?.has(sample.type);

      if (isDuplicate) {
        return;
      }

      if (!reportedForNav) {
        this.reportedByNav.set(navId, new Set([sample.type]));
        this.navigationHistory.push(navId);

        if (this.navigationHistory.length > MAX_NAVIGATION_HISTORY) {
          const oldestNav = this.navigationHistory.shift();
          if (oldestNav) {
            this.reportedByNav.delete(oldestNav);
          }
        }
      } else {
        reportedForNav.add(sample.type);
      }
    }

    this.trackWebVital(sample.type, sample.value);
  }

  private trackWebVital(type: WebVitalType, value: number): void {
    if (!Number.isFinite(value)) {
      log('debug', 'Invalid web vital value', { data: { type, value } });
      return;
    }

    this.eventManager.track({
      type: EventType.WEB_VITALS,
      web_vitals: {
        type,
        value,
      },
    });
  }

  /**
   * Generates a deterministic navigation identifier for deduplication.
   *
   * **Purpose**: Every call within the same navigation must return the SAME id,
   * so `reportedByNav` can collapse duplicate Web Vitals (one emission per
   * metric type per navigation — critical for the fallback observers, which
   * fire per entry batch).
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
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;

      if (!nav) {
        return null;
      }

      const baseId = `${nav.startTime.toFixed(2)}_${window.location.pathname}`;

      if (baseId === this.currentNavBase && this.currentNavId !== null) {
        return this.currentNavId;
      }

      this.currentNavBase = baseId;
      this.currentNavId = this.reportedByNav.has(baseId) ? `${baseId}_${++this.navigationCounter}` : baseId;

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
