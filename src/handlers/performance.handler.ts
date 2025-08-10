import { EventManager } from '../managers/event.manager';
import { StateManager } from '../managers/state.manager';
import { EventType, WebVitalType, NavigationId, VitalSample } from '../types';

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
      } catch (error) {
        void error;
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
        if (!last) return;
        this.sendVital({ type: 'LCP', value: last.startTime });
      },
      { type: 'largest-contentful-paint', buffered: true },
      true,
    );

    // CLS (layout-shift)
    let clsValue = 0;
    this.safeObserve(
      'layout-shift',
      (list) => {
        for (const entry of list.getEntries() as PerformanceEntry[] & { value?: number; hadRecentInput?: boolean }[]) {
          const e = entry as PerformanceEntry & { value?: number; hadRecentInput?: boolean };
          if ((e.hadRecentInput as boolean | undefined) === true) continue;
          const v = typeof e.value === 'number' ? e.value : 0;
          clsValue += v;
        }
        this.sendVital({ type: 'CLS', value: Number(clsValue.toFixed(4)) });
      },
      { type: 'layout-shift', buffered: true },
    );

    // FCP
    this.safeObserve(
      'paint',
      (list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.sendVital({ type: 'FCP', value: entry.startTime });
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
          this.sendVital({ type: 'INP', value: Number(worst.toFixed(2)) });
        }
      },
      { type: 'event', buffered: true },
    );
  }

  private async initWebVitals(): Promise<void> {
    try {
      const webVitals = (await import('web-vitals')) as unknown as {
        onLCP: (cb: (metric: { value: number }) => void) => void;
        onCLS: (cb: (metric: { value: number }) => void) => void;
        onFCP: (cb: (metric: { value: number }) => void) => void;
        onTTFB: (cb: (metric: { value: number }) => void) => void;
        onINP: (cb: (metric: { value: number }) => void) => void;
      };

      const report =
        (type: VitalSample['type']) =>
        (metric: { value: number }): void => {
          const value = Number(metric.value.toFixed(2));
          this.sendVital({ type, value });
        };

      webVitals.onLCP(report('LCP'));
      webVitals.onCLS(report('CLS'));
      webVitals.onFCP(report('FCP'));
      webVitals.onTTFB(report('TTFB'));
      webVitals.onINP(report('INP'));
    } catch {
      this.observeWebVitalsFallback();
    }
  }

  private reportTTFB(): void {
    try {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      if (!nav) return;
      const ttfb = nav.responseStart;
      this.sendVital({ type: 'TTFB', value: Number(ttfb.toFixed(2)) });
    } catch (error) {
      void error;
    }
  }

  private observeLongTasks(): void {
    this.safeObserve(
      'longtask',
      (list) => {
        const entries = list.getEntries() as Array<{ duration: number }>;
        for (const entry of entries) {
          const duration = Number(entry.duration.toFixed(2));
          const now = Date.now();
          if (now - this.lastLongTaskSentAt >= 1000) {
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
      if (!this.reportedByNav.has(navId)) this.reportedByNav.set(navId, new Set());
      const sent = this.reportedByNav.get(navId)!;
      if (sent.has(key)) return;
      sent.add(key);
    }
    this.trackWebVital(sample.type, sample.value);
  }

  private trackWebVital(type: WebVitalType, value?: number): void {
    this.eventManager.track({
      type: EventType.WEB_VITALS,
      web_vitals: { type, ...(typeof value === 'number' ? { value } : {}) },
    });
  }

  private getNavigationId(): string | null {
    try {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      if (!nav) return null;
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
      const supported = (PerformanceObserver as unknown as { supportedEntryTypes?: readonly string[] })
        .supportedEntryTypes as string[] | undefined;
      if (supported && !supported.includes(type)) return;
      const obs = new PerformanceObserver((list, observer) => {
        cb(list, observer);
        if (once) {
          try {
            observer.disconnect();
          } catch (error) {
            void error;
          }
        }
      });
      obs.observe((options ?? { type, buffered: true }) as PerformanceObserverInit);
      this.observers.push(obs);
    } catch (error) {
      void error;
    }
  }
}
