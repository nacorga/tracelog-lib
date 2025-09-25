import { EventManager } from '../managers/event.manager';
import { StateManager } from '../managers/state.manager';
import { EventType, WebVitalType, NavigationId, VitalSample } from '../types';
import { LONG_TASK_THROTTLE_MS } from '../constants';
import { PRECISION_TWO_DECIMALS } from '../constants';
import { debugLog } from '../utils/logging';

type LayoutShiftEntry = PerformanceEntry & { value?: number; hadRecentInput?: boolean };

export class PerformanceHandler extends StateManager {
  private readonly eventManager: EventManager;
  private readonly reportedByNav: Map<NavigationId, Set<string>> = new Map();

  private readonly observers: PerformanceObserver[] = [];
  private lastLongTaskSentAt = 0;

  constructor(eventManager: EventManager) {
    super();
    this.eventManager = eventManager;
  }

  async startTracking(): Promise<void> {
    debugLog.debug('PerformanceHandler', 'Starting performance tracking');

    await this.initWebVitals();
    this.observeLongTasks();
  }

  stopTracking(): void {
    debugLog.debug('PerformanceHandler', 'Stopping performance tracking', { observersCount: this.observers.length });

    this.observers.forEach((obs, index) => {
      try {
        obs.disconnect();
      } catch (error) {
        debugLog.warn('PerformanceHandler', 'Failed to disconnect performance observer', {
          error: error instanceof Error ? error.message : 'Unknown error',
          observerIndex: index,
        });
      }
    });

    this.observers.length = 0;
    this.reportedByNav.clear();

    debugLog.debug('PerformanceHandler', 'Performance tracking cleanup completed', {
      remainingObservers: this.observers.length,
      clearedNavReports: true,
    });
  }

  private observeWebVitalsFallback(): void {
    // TTFB - should be captured immediately as it's available from navigation timing
    this.reportTTFB();

    // LCP
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

    // CLS (layout-shift)
    let clsValue = 0;
    let currentNavId = this.getNavigationId();

    this.safeObserve(
      'layout-shift',
      (list) => {
        const navId = this.getNavigationId();

        // Reset CLS on navigation change
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

    // FCP
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

    // INP via performance event timing (where supported)
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
        (type: VitalSample['type']) =>
        (metric: { value: number }): void => {
          const value = Number(metric.value.toFixed(PRECISION_TWO_DECIMALS));
          this.sendVital({ type, value });
        };

      onLCP(report('LCP'));
      onCLS(report('CLS'));
      onFCP(report('FCP'));
      onTTFB(report('TTFB'));
      onINP(report('INP'));

      debugLog.debug('PerformanceHandler', 'Web-vitals library loaded successfully');
    } catch (error) {
      debugLog.warn('PerformanceHandler', 'Failed to load web-vitals library, using fallback', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      this.observeWebVitalsFallback();
    }
  }

  private reportTTFB(): void {
    try {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;

      if (!nav) {
        debugLog.debug('PerformanceHandler', 'Navigation timing not available for TTFB');
        return;
      }

      const ttfb = nav.responseStart;

      // TTFB can be 0 in some browsers (especially Mobile Safari) when:
      // - Response is served from cache
      // - Connection is reused
      // - Browser cannot determine exact timing
      // We still report it as it's a valid measurement
      if (typeof ttfb === 'number' && Number.isFinite(ttfb)) {
        this.sendVital({ type: 'TTFB', value: Number(ttfb.toFixed(PRECISION_TWO_DECIMALS)) });
      } else {
        debugLog.debug('PerformanceHandler', 'TTFB value is not a valid number', { ttfb });
      }
    } catch (error) {
      debugLog.warn('PerformanceHandler', 'Failed to report TTFB', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private observeLongTasks(): void {
    this.safeObserve(
      'longtask',
      (list) => {
        const entries = list.getEntries() as Array<{ duration: number }>;

        for (const entry of entries) {
          const duration = Number(entry.duration.toFixed(PRECISION_TWO_DECIMALS));
          const now = Date.now();

          if (now - this.lastLongTaskSentAt >= LONG_TASK_THROTTLE_MS) {
            this.trackWebVital('LONG_TASK', duration);
            this.lastLongTaskSentAt = now;
          }
        }
      },
      { type: 'longtask', buffered: true },
    );
  }

  private sendVital(sample: VitalSample): void {
    const navId = this.getNavigationId();

    // Check for duplicates if we have a navigation ID
    if (navId) {
      const reportedForNav = this.reportedByNav.get(navId);
      const isDuplicate = reportedForNav?.has(sample.type);

      if (isDuplicate) {
        return;
      }

      // Initialize or update reported vitals for this navigation
      if (!reportedForNav) {
        this.reportedByNav.set(navId, new Set([sample.type]));
      } else {
        reportedForNav.add(sample.type);
      }
    }

    this.trackWebVital(sample.type, sample.value);
  }

  private trackWebVital(type: WebVitalType, value?: number): void {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      debugLog.warn('PerformanceHandler', 'Invalid web vital value', { type, value });
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

  private getNavigationId(): string | null {
    try {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;

      if (!nav) {
        return null;
      }

      // Use more precise timestamp and add random component to prevent collisions
      const timestamp = nav.startTime || performance.now();
      const random = Math.random().toString(36).substr(2, 5);
      return `${timestamp.toFixed(2)}_${window.location.pathname}_${random}`;
    } catch (error) {
      debugLog.warn('PerformanceHandler', 'Failed to get navigation ID', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
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
        debugLog.debug('PerformanceHandler', 'Observer type not supported', { type });
        return false;
      }

      const obs = new PerformanceObserver((list, observer) => {
        try {
          cb(list, observer);
        } catch (callbackError) {
          debugLog.warn('PerformanceHandler', 'Observer callback failed', {
            type,
            error: callbackError instanceof Error ? callbackError.message : 'Unknown error',
          });
        }

        if (once) {
          try {
            observer.disconnect();
          } catch {
            // Disconnect errors are safe to ignore
          }
        }
      });

      obs.observe(options ?? { type, buffered: true });

      if (!once) {
        this.observers.push(obs);
      }

      return true;
    } catch (error) {
      debugLog.warn('PerformanceHandler', 'Failed to create performance observer', {
        type,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }
}
