/**
 * PerformanceHandler Tests
 * Focus: Web Vitals tracking
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';
import { initTestBridge, destroyTestBridge, getHandlers } from '../../helpers/bridge.helper';
import { PerformanceHandler } from '../../../src/handlers/performance.handler';
import { EventManager } from '../../../src/managers/event.manager';
import { StorageManager } from '../../../src/managers/storage.manager';
import type { TraceLogTestBridge } from '../../../src/types';
import { EventType } from '../../../src/types';

describe('PerformanceHandler - degraded environments', () => {
  let bridge: TraceLogTestBridge;

  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();
  });

  // Vitals are the one signal TraceLog can afford to lose. A browser without PerformanceObserver
  // (older Safari, or a privacy extension that strips it) must degrade to emitting nothing rather
  // than throwing out of init — an unhandled throw here takes SESSION_START and every purchase
  // event down with it, turning a missing performance metric into missing revenue.
  it('initialises and tears down cleanly when PerformanceObserver is unavailable', async () => {
    delete (window as any).PerformanceObserver;

    bridge = await initTestBridge({ webVitalsMode: 'all' });
    const { performance: perfHandler } = getHandlers(bridge);

    expect(perfHandler).toBeDefined();
    expect(() => perfHandler?.stopTracking()).not.toThrow();
  });
});

describe('PerformanceHandler - Navigation ID & Consolidation', () => {
  let handler: PerformanceHandler;
  let eventManager: EventManager;
  let storageManager: StorageManager;
  let trackSpy: ReturnType<typeof vi.spyOn>;
  let originalLocation: Location;

  interface TrackedWebVitalsPayload {
    type: EventType;
    web_vitals?: { schema: string; metrics: { type: string; value: number }[] };
  }

  // Typed view of the private members the tests drive directly, so spies keep
  // their real signatures instead of collapsing to `any`.
  interface PerformanceHandlerInternals {
    initWebVitals: () => Promise<void>;
  }

  const internals = (): PerformanceHandlerInternals => handler as unknown as PerformanceHandlerInternals;

  const setPathname = (pathname: string): void => {
    Object.defineProperty(window, 'location', {
      value: { pathname, href: `http://localhost:3000${pathname}`, hostname: 'localhost' },
      configurable: true,
      writable: true,
    });
  };

  const getNavId = (): string | null => (handler as any).getNavigationId();
  const sendVital = (type: string, value: number): void => (handler as any).sendVital({ type, value });
  const flush = (): void => (handler as any).flushConsolidatedVitals();

  const trackedPayloads = (): TrackedWebVitalsPayload[] =>
    trackSpy.mock.calls
      .map((call: unknown[]) => call[0] as TrackedWebVitalsPayload)
      .filter((e: TrackedWebVitalsPayload) => e.type === EventType.WEB_VITALS);

  const trackedVitals = (type?: string): unknown[] =>
    trackedPayloads()
      .flatMap((e: TrackedWebVitalsPayload) => e.web_vitals?.metrics ?? [])
      .filter((m: { type: string }) => !type || m.type === type);

  beforeEach(() => {
    setupTestEnvironment();
    originalLocation = window.location;

    const mockNavEntry = {
      entryType: 'navigation',
      name: 'document',
      startTime: 0,
      duration: 1000,
      responseStart: 150.5,
    };

    (window as any).performance.getEntriesByType = vi.fn((type: string) => {
      if (type === 'navigation') {
        return [mockNavEntry];
      }
      return [];
    });

    setPathname('/');

    storageManager = new StorageManager();
    eventManager = new EventManager(storageManager, null);
    handler = new PerformanceHandler(eventManager);
    trackSpy = vi.spyOn(eventManager, 'track');
  });

  afterEach(() => {
    handler.stopTracking();
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      configurable: true,
      writable: true,
    });
    cleanupTestEnvironment();
  });

  it('should return the same navigation id across multiple calls (deterministic)', () => {
    const first = getNavId();
    const second = getNavId();
    const third = getNavId();

    expect(first).not.toBeNull();
    expect(second).toBe(first);
    expect(third).toBe(first);
    expect(first).not.toMatch(/_\d+$/); // No counter suffix without a collision
  });

  it('should produce a new id after SPA navigation to a different path', () => {
    const homeId = getNavId();

    setPathname('/checkout');
    const checkoutId = getNavId();

    expect(checkoutId).not.toBe(homeId);
    expect(checkoutId).toContain('/checkout');
  });

  describe('threshold filtering', () => {
    const startWithMode = async (mode: string): Promise<void> => {
      (handler as any).set('config', { webVitalsMode: mode });
      vi.spyOn(internals(), 'initWebVitals').mockResolvedValue(undefined);
      await handler.startTracking();
    };

    describe('default "all" mode', () => {
      it('keeps a CLS of exactly 0', () => {
        expect((handler as any).shouldSendVital('CLS', 0)).toBe(true);
      });

      it('keeps a TTFB of exactly 0 (legitimate on a Mobile Safari cached response)', () => {
        expect((handler as any).shouldSendVital('TTFB', 0)).toBe(true);
      });

      it('keeps any other finite non-negative value', () => {
        expect((handler as any).shouldSendVital('LCP', 1)).toBe(true);
        expect((handler as any).shouldSendVital('INP', 0)).toBe(true);
      });

      it('rejects a non-finite value', () => {
        expect((handler as any).shouldSendVital('LCP', Number.NaN)).toBe(false);
        expect((handler as any).shouldSendVital('LCP', Number.POSITIVE_INFINITY)).toBe(false);
        expect((handler as any).shouldSendVital('LCP', undefined)).toBe(false);
      });
    });

    describe('narrowing modes classify the boundary as web.dev does', () => {
      it('drops a value exactly AT the good threshold in "needs-improvement" mode', async () => {
        await startWithMode('needs-improvement');

        expect((handler as any).shouldSendVital('LCP', 2500)).toBe(false);
        expect((handler as any).shouldSendVital('CLS', 0.1)).toBe(false);
        expect((handler as any).shouldSendVital('LCP', 2500.01)).toBe(true);
      });

      it('drops a value exactly AT the poor threshold in "poor" mode', async () => {
        await startWithMode('poor');

        expect((handler as any).shouldSendVital('LCP', 4000)).toBe(false);
        expect((handler as any).shouldSendVital('LCP', 4000.01)).toBe(true);
      });

      it('falls back to the uncensored default rather than censoring on an unrecognized mode', async () => {
        await startWithMode('nonsense-mode');

        expect((handler as any).shouldSendVital('CLS', 0)).toBe(true);
        expect((handler as any).shouldSendVital('LCP', 1)).toBe(true);
      });
    });
  });

  describe('buffering', () => {
    it('does not track anything until a flush is triggered', () => {
      sendVital('LCP', 5000);
      sendVital('FCP', 900);

      expect(trackSpy).not.toHaveBeenCalled();
    });

    it('collapses repeated reports of the same vital type into the latest value', () => {
      sendVital('LCP', 5000);
      sendVital('LCP', 5200);
      sendVital('LCP', 5400);

      flush();

      expect(trackedVitals('LCP')).toEqual([{ type: 'LCP', value: 5400 }]);
      expect(trackSpy).toHaveBeenCalledTimes(1);
    });

    it('consolidates all five metrics for one navigation into exactly one event', () => {
      sendVital('LCP', 2000);
      sendVital('FCP', 900);
      sendVital('TTFB', 300);
      sendVital('CLS', 0.05);
      sendVital('INP', 150);

      flush();

      expect(trackSpy).toHaveBeenCalledTimes(1);
      const payload = trackedPayloads()[0];
      expect(payload).toBeDefined();
      expect(payload?.web_vitals?.schema).toBe('consolidated');
      expect(payload?.web_vitals?.metrics).toHaveLength(5);
      expect(payload?.web_vitals?.metrics?.map((m: { type: string }) => m.type).sort()).toEqual([
        'CLS',
        'FCP',
        'INP',
        'LCP',
        'TTFB',
      ]);
    });

    it('is a no-op when nothing is buffered', () => {
      flush();
      flush();

      expect(trackSpy).not.toHaveBeenCalled();
    });

    it('emits metrics sorted by type regardless of the order they arrived in', () => {
      sendVital('INP', 150);
      sendVital('TTFB', 300);
      sendVital('CLS', 0.05);
      sendVital('LCP', 2000);
      sendVital('FCP', 900);

      flush();

      expect(trackedPayloads()[0]?.web_vitals?.metrics.map((m: { type: string }) => m.type)).toEqual([
        'CLS',
        'FCP',
        'INP',
        'LCP',
        'TTFB',
      ]);
    });

    it('should suffix only on a real collision (SPA revisit to the same path), shipping each navigation as its own event', () => {
      sendVital('LCP', 5000); // Buffers the first navigation ('/')
      const firstId = getNavId();

      setPathname('/other');
      getNavId();

      setPathname('/');
      const revisitId = getNavId();

      expect(revisitId).not.toBe(firstId);
      expect(revisitId).toMatch(/_\d+$/);

      // Reporting for the new (suffixed) navId is a navigation-boundary change:
      // it flushes the first navigation's buffered event before starting a new buffer.
      sendVital('LCP', 4800);
      expect(trackedVitals('LCP')).toEqual([{ type: 'LCP', value: 5000 }]);

      // The revisit's own buffer ships on its own flush — NOT suppressed by
      // the first visit's entries (dedup fingerprint fix).
      flush();
      expect(trackedVitals('LCP')).toEqual([
        { type: 'LCP', value: 5000 },
        { type: 'LCP', value: 4800 },
      ]);
    });
  });

  describe('lifecycle flush triggers', () => {
    it('flushes the buffer when the pagehide handler fires', () => {
      sendVital('LCP', 3000);
      expect(trackSpy).not.toHaveBeenCalled();

      (handler as any).pageHideHandler();

      expect(trackedVitals('LCP')).toEqual([{ type: 'LCP', value: 3000 }]);
    });

    it('flushes the buffer when the visibility handler fires and the document is hidden', () => {
      sendVital('FCP', 1200);
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });

      (handler as any).visibilityHandler();

      expect(trackedVitals('FCP')).toEqual([{ type: 'FCP', value: 1200 }]);
    });

    it('does NOT flush when the visibility handler fires and the document is visible', () => {
      sendVital('FCP', 1200);
      Object.defineProperty(document, 'hidden', { configurable: true, value: false });

      (handler as any).visibilityHandler();

      expect(trackSpy).not.toHaveBeenCalled();
    });

    it('registers pagehide and visibilitychange listeners on startTracking()', async () => {
      const windowAddSpy = vi.spyOn(window, 'addEventListener');
      const docAddSpy = vi.spyOn(document, 'addEventListener');

      await handler.startTracking();

      expect(windowAddSpy).toHaveBeenCalledWith('pagehide', (handler as any).pageHideHandler);
      expect(docAddSpy).toHaveBeenCalledWith('visibilitychange', (handler as any).visibilityHandler);
    });

    it('registers its listeners only AFTER web-vitals registered its own, so one navigation ships one event', async () => {
      const webVitalsListener = (): void => {};
      const docAddSpy = vi.spyOn(document, 'addEventListener');

      // Stands in for the web-vitals library: it registers its own hidden/pagehide
      // callbacks (which finalize LCP/CLS/INP) while the dynamic import resolves.
      vi.spyOn(internals(), 'initWebVitals').mockImplementation(async (): Promise<void> => {
        await Promise.resolve();
        document.addEventListener('visibilitychange', webVitalsListener);
      });

      await handler.startTracking();

      const visibilityListeners = docAddSpy.mock.calls
        .filter(([type]) => type === 'visibilitychange')
        .map(([, listener]) => listener);

      expect(visibilityListeners).toEqual([webVitalsListener, (handler as any).visibilityHandler]);

      document.removeEventListener('visibilitychange', webVitalsListener);
    });

    it('does not register listeners when stopTracking() lands while initialization is in flight', async () => {
      let resolveInit: (() => void) | undefined;
      const pendingInit = new Promise<void>((resolve) => {
        resolveInit = resolve;
      });

      vi.spyOn(internals(), 'initWebVitals').mockReturnValue(pendingInit);

      const docAddSpy = vi.spyOn(document, 'addEventListener');
      const startPromise = handler.startTracking();

      handler.stopTracking();
      resolveInit?.();
      await startPromise;

      expect(docAddSpy).not.toHaveBeenCalledWith('visibilitychange', (handler as any).visibilityHandler);
    });

    it('removes the SAME listener references it registered on stopTracking()', async () => {
      const windowAddSpy = vi.spyOn(window, 'addEventListener');
      const docAddSpy = vi.spyOn(document, 'addEventListener');

      await handler.startTracking();

      const registeredPageHide = windowAddSpy.mock.calls.find(([type]) => type === 'pagehide')?.[1];
      const registeredVisibility = docAddSpy.mock.calls.find(([type]) => type === 'visibilitychange')?.[1];

      const windowRemoveSpy = vi.spyOn(window, 'removeEventListener');
      const docRemoveSpy = vi.spyOn(document, 'removeEventListener');

      handler.stopTracking();

      // Identity, not `expect.any(Function)`: removing a different reference than
      // was added is the classic listener leak, and it would satisfy a loose matcher.
      expect(registeredPageHide).toBeDefined();
      expect(registeredVisibility).toBeDefined();
      expect(windowRemoveSpy).toHaveBeenCalledWith('pagehide', registeredPageHide);
      expect(docRemoveSpy).toHaveBeenCalledWith('visibilitychange', registeredVisibility);
    });

    it('flushes any buffered metrics on stopTracking() (no data loss on destroy)', () => {
      sendVital('CLS', 0.2);

      handler.stopTracking();

      expect(trackedVitals('CLS')).toEqual([{ type: 'CLS', value: 0.2 }]);
    });
  });

  describe('delivery on lifecycle flush', () => {
    let flushSyncSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      flushSyncSpy = vi.spyOn(eventManager, 'flushImmediatelySync').mockReturnValue(true);
    });

    it('drains the queue on pagehide, instead of relying on App draining afterwards', () => {
      sendVital('LCP', 3000);

      (handler as any).pageHideHandler();

      expect(trackSpy).toHaveBeenCalledTimes(1);
      expect(flushSyncSpy).toHaveBeenCalledTimes(1);
    });

    it('drains the queue when the document is hidden', () => {
      sendVital('FCP', 1200);
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });

      (handler as any).visibilityHandler();

      expect(flushSyncSpy).toHaveBeenCalledTimes(1);
    });

    it('does not drain when nothing was buffered', () => {
      (handler as any).pageHideHandler();

      expect(trackSpy).not.toHaveBeenCalled();
      expect(flushSyncSpy).not.toHaveBeenCalled();
    });

    it('queues without draining on hidden when flushOnPageHidden is disabled', () => {
      (handler as any).set('config', { flushOnPageHidden: false });
      sendVital('FCP', 1200);
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });

      (handler as any).visibilityHandler();

      expect(trackedVitals('FCP')).toEqual([{ type: 'FCP', value: 1200 }]);
      expect(flushSyncSpy).not.toHaveBeenCalled();
    });

    it('still drains on pagehide even when flushOnPageHidden is disabled', () => {
      (handler as any).set('config', { flushOnPageHidden: false });
      sendVital('FCP', 1200);

      (handler as any).pageHideHandler();

      expect(flushSyncSpy).toHaveBeenCalledTimes(1);
    });

    it('does not drain on an SPA navigation boundary — the page is not going away', () => {
      sendVital('LCP', 5000);

      setPathname('/checkout');
      sendVital('LCP', 2000);

      expect(trackSpy).toHaveBeenCalledTimes(1);
      expect(flushSyncSpy).not.toHaveBeenCalled();
    });
  });

  it('should stop the fallback observers from flooding repeated CLS/INP emissions into more than one buffered value', () => {
    const triggers = new Map<string, (entries: unknown[]) => void>();

    class MockPerformanceObserver {
      static supportedEntryTypes = ['largest-contentful-paint', 'layout-shift', 'paint', 'event', 'navigation'];
      private readonly cb: PerformanceObserverCallback;

      constructor(cb: PerformanceObserverCallback) {
        this.cb = cb;
      }

      observe(options?: { type?: string }): void {
        if (options?.type) {
          triggers.set(options.type, (entries: unknown[]) => {
            this.cb({ getEntries: () => entries } as unknown as PerformanceObserverEntryList, this);
          });
        }
      }

      disconnect(): void {}
      takeRecords(): PerformanceEntry[] {
        return [];
      }
    }

    (window as any).PerformanceObserver = MockPerformanceObserver;

    (handler as any).observeWebVitalsFallback();

    // Each observer batch fires the callback again — this must collapse into
    // one buffered value per type, not one tracked event per batch.
    const clsEntry = { value: 0.5, hadRecentInput: false };
    triggers.get('layout-shift')?.([clsEntry]);
    triggers.get('layout-shift')?.([clsEntry]);
    triggers.get('layout-shift')?.([clsEntry]);

    const inpEntry = { startTime: 0, processingEnd: 600 };
    triggers.get('event')?.([inpEntry]);
    triggers.get('event')?.([inpEntry]);
    triggers.get('event')?.([inpEntry]);

    // Nothing shipped yet — still buffered until a flush trigger.
    expect(trackSpy).not.toHaveBeenCalled();

    flush();

    expect(trackSpy).toHaveBeenCalledTimes(1);
    expect(trackedVitals('CLS')).toEqual([{ type: 'CLS', value: 1.5 }]); // 3 x 0.5 accumulated
    expect(trackedVitals('INP')).toEqual([{ type: 'INP', value: 600 }]);
  });
});
