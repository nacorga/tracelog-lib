import { EventManager } from '../managers/event.manager';
import { StateManager } from '../managers/state.manager';
import { EventType, WebVitalType, NavigationId, VitalSample } from '../types';
import { LONG_TASK_THROTTLE_MS } from '../constants';
import { PRECISION_FOUR_DECIMALS, PRECISION_TWO_DECIMALS } from '../constants';

type LayoutShiftEntry = PerformanceEntry & { value?: number; hadRecentInput?: boolean };

export class PerformanceHandler extends StateManager {
  private readonly eventManager: EventManager;
  private readonly reportedByNav: Map<NavigationId, Set<string>> = new Map();

  private observers: PerformanceObserver[] = [];
  private lastLongTaskSentAt = 0;

  constructor(eventManager: EventManager) {
    super();
    this.eventManager = eventManager;
  }

  async startTracking(): Promise<void> {
    await this.initWebVitals();
    this.observeLongTasks();
    this.reportTTFB();
  }

  stopTracking(): void {
    for (const obs of this.observers) {
      try {
        obs.disconnect();
      } catch {
        // Intentionally ignore disconnect errors
      }
    }

    this.observers = [];

    this.reportedByNav.clear();
  }

  private observeWebVitalsFallback(): void {
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

    this.safeObserve(
      'layout-shift',
      (list) => {
        const entries = list.getEntries() as LayoutShiftEntry[];

        for (const entry of entries) {
          if (entry.hadRecentInput === true) {
            continue;
          }

          const value = typeof entry.value === 'number' ? entry.value : 0;
          clsValue += value;
        }

        this.sendVital({ type: 'CLS', value: Number(clsValue.toFixed(PRECISION_FOUR_DECIMALS)) });
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
    } catch {
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

      this.sendVital({ type: 'TTFB', value: Number(ttfb.toFixed(PRECISION_TWO_DECIMALS)) });
    } catch {
      // Intentionally ignored
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
    const key = `${sample.type}`;

    if (navId) {
      if (!this.reportedByNav.has(navId)) {
        this.reportedByNav.set(navId, new Set());
      }

      const sent = this.reportedByNav.get(navId)!;

      if (sent.has(key)) {
        return;
      }

      sent.add(key);
    }

    this.trackWebVital(sample.type, sample.value);
  }

  private trackWebVital(type: WebVitalType, value?: number): void {
    if (typeof value !== 'number') {
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

      return `${Math.round(nav.startTime)}_${window.location.pathname}`;
    } catch {
      return null;
    }
  }

  private safeObserve(
    type: string,
    cb: PerformanceObserverCallback,
    options?: PerformanceObserverInit,
    once = false,
  ): void {
    try {
      if (typeof PerformanceObserver === 'undefined') return;
      const supported = PerformanceObserver.supportedEntryTypes;

      if (supported && !supported.includes(type)) return;

      const obs = new PerformanceObserver((list, observer) => {
        cb(list, observer);

        if (once) {
          try {
            observer.disconnect();
          } catch {
            // Intentionally ignored
          }
        }
      });

      obs.observe((options ?? { type, buffered: true }) as PerformanceObserverInit);

      if (!once) {
        this.observers.push(obs);
      }
    } catch {
      // Intentionally ignored
    }
  }
}
