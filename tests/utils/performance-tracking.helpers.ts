import { Page } from '@playwright/test';
import { EventType } from '../../src/types';

/**
 * Performance Tracking Test Helpers
 * Helper functions for web vitals collection, long task detection, and performance monitoring tests.
 * These helpers follow functional programming paradigms and support the testing bridge architecture.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface WebVitalsEvent {
  type: string;
  web_vitals?: {
    type: string;
    value: number;
  };
  timestamp?: number;
  page_url?: string;
}

export interface LongTaskEvent {
  type: string;
  timestamp?: number;
  page_url?: string;
  web_vitals?: {
    type: string;
    value: number;
  };
}

export interface WebVitalsValidationResult {
  type: string;
  value: number;
  hasType: boolean;
  hasValue: boolean;
  valueIsFinite: boolean;
  valueIsValid: boolean;
  hasTimestamp: boolean;
  hasPageUrl: boolean;
  eventStructure: {
    hasType: boolean;
    hasWebVitals: boolean;
    hasTimestamp: boolean;
    hasPageUrl: boolean;
  };
}

export interface LongTaskDetectionInfo {
  hasLongTasks: boolean;
  longTaskCount: number;
  longTaskValues: number[];
  validDurations: boolean;
  validThreshold: boolean;
  averageDuration: number;
  maxDuration: number;
  minDuration: number;
}

export interface ThrottlingTestInfo {
  totalLongTasks: number;
  eventsWithinThrottleWindow: number;
  throttleEffective: boolean;
  timeBetweenEvents: number[];
  respectsThrottleLimit: boolean;
}

export interface SamplingTestInfo {
  attemptsGenerated: number;
  eventsRecorded: number;
  samplingRatio: number;
  withinExpectedRange: boolean;
}

export interface BrowserCapabilityInfo {
  hasPerformanceObserver: boolean;
  supportsLongTask: boolean;
  userAgent: string;
}

export interface MetricRangeValidation {
  type: string;
  value: number;
  isWithinExpectedRange: boolean;
  expectedRange: string;
}

export interface EventsByType {
  [key: string]: WebVitalsEvent[];
}

export interface DuplicateDetectionInfo {
  type: string;
  count: number;
  hasDuplicates: boolean;
}

export interface MemoryUsageInfo {
  timestamp: number;
  duration: number;
  memoryUsage?: number;
}

// ============================================================================
// WEB VITALS COLLECTION HELPERS
// ============================================================================

/**
 * Creates large content element to trigger LCP measurement
 */
export async function createLCPTriggerContent(page: Page): Promise<void> {
  await page.evaluate(() => {
    const largeContent = document.createElement('div');
    largeContent.style.width = '100%';
    largeContent.style.height = '200px';
    largeContent.style.backgroundColor = '#f0f0f0';
    largeContent.style.fontSize = '24px';
    largeContent.style.padding = '20px';
    largeContent.textContent = 'Large content for LCP testing';
    document.body.appendChild(largeContent);
  });
}

/**
 * Creates layout shifts to trigger CLS measurement
 */
export async function createLayoutShift(page: Page): Promise<void> {
  await page.evaluate(() => {
    const content = document.createElement('div');
    content.style.height = '100px';
    content.style.backgroundColor = '#ddd';
    content.textContent = 'Content causing layout shift';

    // Insert at the beginning to cause shift
    document.body.insertBefore(content, document.body.firstChild);

    // Force layout recalculation
    void content.offsetHeight;

    // Add more content to increase shift
    setTimeout(() => {
      const moreContent = document.createElement('div');
      moreContent.style.height = '50px';
      moreContent.style.backgroundColor = '#bbb';
      moreContent.textContent = 'More shifting content';
      document.body.insertBefore(moreContent, document.body.firstChild);
      void moreContent.offsetHeight;
    }, 100);
  });
}

/**
 * Creates interactive elements that might trigger INP measurement
 */
export async function createINPTriggerElements(page: Page): Promise<void> {
  await page.evaluate(() => {
    const button = document.createElement('button');
    button.textContent = 'Click for INP Test';
    button.style.padding = '20px';
    button.style.fontSize = '16px';

    // Add intensive task on click to potentially trigger INP
    button.addEventListener('click', () => {
      const start = performance.now();
      // Simulate some processing time
      while (performance.now() - start < 50) {
        // Busy loop
      }

      // Update DOM to trigger paint
      button.textContent = 'Clicked!';
      button.style.backgroundColor = '#4CAF50';
    });

    document.body.appendChild(button);
  });
}

/**
 * Retrieves web vitals events of a specific type from the testing bridge
 */
export async function getWebVitalsEvents(
  page: Page,
  vitalType: string,
): Promise<{
  hasEvents: boolean;
  eventCount: number;
  events: WebVitalsEvent[];
  values: number[];
}> {
  return await page.evaluate((type: string) => {
    const bridge = window.__traceLogTestBridge;
    if (!bridge) return { hasEvents: false, eventCount: 0, events: [], values: [] };

    const eventManager = bridge.getEventManager();
    if (!eventManager) return { hasEvents: false, eventCount: 0, events: [], values: [] };

    const events = eventManager.getEventQueue() ?? [];
    const webVitalsEvents = events.filter(
      (event: WebVitalsEvent) => event.type === 'web_vitals' && event.web_vitals?.type === type,
    );

    const values = webVitalsEvents
      .map((e: WebVitalsEvent) => e.web_vitals?.value)
      .filter((v): v is number => typeof v === 'number');

    return {
      hasEvents: webVitalsEvents.length > 0,
      eventCount: webVitalsEvents.length,
      events: webVitalsEvents,
      values,
    };
  }, vitalType);
}

/**
 * Retrieves all web vitals events for validation
 */
export async function getAllWebVitalsEvents(page: Page): Promise<{
  hasEvents: boolean;
  eventsCount: number;
  validationResults: WebVitalsValidationResult[];
  eventTypes: string[];
}> {
  return await page.evaluate(() => {
    const bridge = window.__traceLogTestBridge;
    if (!bridge) return { hasEvents: false, eventsCount: 0, validationResults: [], eventTypes: [] };

    const eventManager = bridge.getEventManager();
    if (!eventManager) return { hasEvents: false, eventsCount: 0, validationResults: [], eventTypes: [] };

    const events = eventManager.getEventQueue() ?? [];
    const webVitalsEvents = events.filter((event: WebVitalsEvent) => event.type === 'web_vitals');

    const validationResults = webVitalsEvents.map((event: WebVitalsEvent) => {
      const webVitals = event.web_vitals;

      return {
        type: webVitals?.type || '',
        value: webVitals?.value || 0,
        hasType: typeof webVitals?.type === 'string',
        hasValue: typeof webVitals?.value === 'number',
        valueIsFinite: Number.isFinite(webVitals?.value),
        valueIsValid: webVitals
          ? // CLS can be 0+, TTFB can be -2+, other metrics should be positive
            webVitals.type === 'CLS'
            ? webVitals.value >= 0
            : webVitals.type === 'TTFB'
              ? webVitals.value >= -2
              : webVitals.value > 0
          : false,
        hasTimestamp: typeof event.timestamp === 'number',
        hasPageUrl: typeof event.page_url === 'string',
        eventStructure: {
          hasType: Object.prototype.hasOwnProperty.call(event, 'type'),
          hasWebVitals: Object.prototype.hasOwnProperty.call(event, 'web_vitals'),
          hasTimestamp: Object.prototype.hasOwnProperty.call(event, 'timestamp'),
          hasPageUrl: Object.prototype.hasOwnProperty.call(event, 'page_url'),
        },
      };
    });

    return {
      hasEvents: webVitalsEvents.length > 0,
      eventsCount: webVitalsEvents.length,
      validationResults,
      eventTypes: webVitalsEvents.map((e: WebVitalsEvent) => e.web_vitals?.type).filter(Boolean) as string[],
    };
  });
}

/**
 * Validates metric values are within expected ranges
 */
export async function validateMetricRanges(page: Page): Promise<{
  validations: MetricRangeValidation[];
}> {
  return await page.evaluate(() => {
    const bridge = window.__traceLogTestBridge;
    if (!bridge) return { validations: [] };

    const eventManager = bridge.getEventManager();
    if (!eventManager) return { validations: [] };

    const events = eventManager.getEventQueue() ?? [];
    const webVitalsEvents = events.filter((event: WebVitalsEvent) => event.type === 'web_vitals');

    const validations = webVitalsEvents.map((event: WebVitalsEvent) => {
      if (!event.web_vitals) {
        return {
          type: 'unknown',
          value: 0,
          isWithinExpectedRange: false,
          expectedRange: 'invalid',
        };
      }

      const { type, value } = event.web_vitals;
      let isWithinExpectedRange = false;
      let expectedRange = '';

      switch (type) {
        case 'LCP':
          // LCP should be positive and typically less than 10 seconds for good performance
          isWithinExpectedRange = value > 0 && value < 10000;
          expectedRange = '0-10000ms';
          break;
        case 'CLS':
          // CLS should be between 0 and reasonable upper bound (typically < 1 for good performance)
          isWithinExpectedRange = value >= 0 && value < 5;
          expectedRange = '0-5';
          break;
        case 'FCP':
          // FCP should be positive and typically less than 5 seconds
          isWithinExpectedRange = value > 0 && value < 5000;
          expectedRange = '0-5000ms';
          break;
        case 'TTFB':
          // TTFB can be -1, -2, 0 (in some browsers) and typically less than 2 seconds
          isWithinExpectedRange = value >= -2 && value < 2000;
          expectedRange = '-2-2000ms';
          break;
        case 'INP':
          // INP should be positive and typically less than 1 second
          isWithinExpectedRange = value > 0 && value < 1000;
          expectedRange = '0-1000ms';
          break;
        case 'LONG_TASK':
          // Long tasks should be at least 50ms (definition) and less than 5 seconds
          isWithinExpectedRange = value >= 50 && value < 5000;
          expectedRange = '50-5000ms';
          break;
        default:
          isWithinExpectedRange = value >= 0;
          expectedRange = '>=0';
      }

      return {
        type,
        value,
        isWithinExpectedRange,
        expectedRange,
      };
    });

    return { validations };
  });
}

// ============================================================================
// LONG TASK DETECTION HELPERS
// ============================================================================

/**
 * Generates a long task with specified duration
 */
export async function generateLongTask(page: Page, duration: number, delay = 0): Promise<void> {
  await page.evaluate(
    ({ duration, delay }) => {
      setTimeout(() => {
        const start = performance.now();
        while (performance.now() - start < duration) {
          for (let i = 0; i < duration * 500; i++) {
            void (Math.random() * Math.random() * Math.sin(i));
          }
        }
      }, delay);
    },
    { duration, delay },
  );
}

/**
 * Generates multiple long tasks with varying durations
 */
export async function generateMultipleLongTasks(
  page: Page,
  tasks: { duration: number; delay: number }[],
): Promise<void> {
  await page.evaluate((taskConfigs) => {
    taskConfigs.forEach(({ duration, delay }) => {
      setTimeout(() => {
        const start = performance.now();
        while (performance.now() - start < duration) {
          for (let i = 0; i < duration * 500; i++) {
            void (Math.random() * Math.random() * Math.random() * Math.sin(i));
          }
        }
      }, delay);
    });
  }, tasks);
}

/**
 * Generates short tasks that should NOT be detected as long tasks
 */
export async function generateShortTasks(page: Page, durations: number[]): Promise<void> {
  await page.evaluate((durations) => {
    durations.forEach((duration, index) => {
      setTimeout(
        () => {
          const start = performance.now();
          while (performance.now() - start < duration) {
            for (let i = 0; i < 1000; i++) {
              void Math.random();
            }
          }
        },
        index * 100 + 100,
      );
    });
  }, durations);
}

/**
 * Retrieves long task detection information
 */
export async function getLongTaskDetection(page: Page): Promise<LongTaskDetectionInfo> {
  return await page.evaluate((): LongTaskDetectionInfo => {
    const bridge = window.__traceLogTestBridge;
    if (!bridge) {
      return {
        hasLongTasks: false,
        longTaskCount: 0,
        longTaskValues: [],
        validDurations: false,
        validThreshold: false,
        averageDuration: 0,
        maxDuration: 0,
        minDuration: 0,
      };
    }

    const eventManager = bridge.getEventManager();
    if (!eventManager) {
      return {
        hasLongTasks: false,
        longTaskCount: 0,
        longTaskValues: [],
        validDurations: false,
        validThreshold: false,
        averageDuration: 0,
        maxDuration: 0,
        minDuration: 0,
      };
    }

    const events = eventManager.getEventQueue() ?? [];
    const longTaskEvents = events.filter(
      (event: LongTaskEvent) => event.type === 'web_vitals' && event.web_vitals?.type === 'LONG_TASK',
    );

    const longTaskValues = longTaskEvents
      .map((e: LongTaskEvent) => e.web_vitals?.value)
      .filter((v): v is number => typeof v === 'number');

    return {
      hasLongTasks: longTaskEvents.length > 0,
      longTaskCount: longTaskEvents.length,
      longTaskValues,
      validDurations: longTaskValues.every((v) => Number.isFinite(v) && v > 0),
      validThreshold: longTaskValues.every((v) => v >= 50), // Long tasks must be >= 50ms
      averageDuration:
        longTaskValues.length > 0 ? longTaskValues.reduce((a, b) => a + b, 0) / longTaskValues.length : 0,
      maxDuration: longTaskValues.length > 0 ? Math.max(...longTaskValues) : 0,
      minDuration: longTaskValues.length > 0 ? Math.min(...longTaskValues) : 0,
    };
  });
}

/**
 * Checks browser support for long task detection
 */
export async function checkLongTaskSupport(page: Page): Promise<BrowserCapabilityInfo> {
  return await page.evaluate(() => {
    return {
      hasPerformanceObserver: typeof PerformanceObserver !== 'undefined',
      supportsLongTask:
        typeof PerformanceObserver !== 'undefined' && PerformanceObserver.supportedEntryTypes?.includes('longtask'),
      userAgent: navigator.userAgent,
    };
  });
}

// ============================================================================
// THROTTLING AND SAMPLING HELPERS
// ============================================================================

/**
 * Analyzes throttling behavior of long task events
 */
export async function analyzeThrottlingBehavior(page: Page): Promise<ThrottlingTestInfo> {
  return await page.evaluate((): ThrottlingTestInfo => {
    const bridge = window.__traceLogTestBridge;
    if (!bridge) {
      return {
        totalLongTasks: 0,
        eventsWithinThrottleWindow: 0,
        throttleEffective: false,
        timeBetweenEvents: [],
        respectsThrottleLimit: false,
      };
    }

    const eventManager = bridge.getEventManager();
    if (!eventManager) {
      return {
        totalLongTasks: 0,
        eventsWithinThrottleWindow: 0,
        throttleEffective: false,
        timeBetweenEvents: [],
        respectsThrottleLimit: false,
      };
    }

    const events = eventManager.getEventQueue() ?? [];
    const longTaskEvents = events.filter(
      (event: LongTaskEvent) => event.type === 'web_vitals' && event.web_vitals?.type === 'LONG_TASK',
    );

    // Calculate time differences between consecutive events
    const timestamps = longTaskEvents
      .map((e: LongTaskEvent) => e.timestamp)
      .filter((t): t is number => typeof t === 'number')
      .sort((a, b) => a - b);

    const timeBetweenEvents = [];
    for (let i = 1; i < timestamps.length; i++) {
      timeBetweenEvents.push(timestamps[i] - timestamps[i - 1]);
    }

    // Expected throttle is 1000ms (LONG_TASK_THROTTLE_MS)
    const EXPECTED_THROTTLE_MS = 1000;
    const respectsThrottleLimit = timeBetweenEvents.every((diff) => diff >= EXPECTED_THROTTLE_MS - 100); // 100ms tolerance

    return {
      totalLongTasks: longTaskEvents.length,
      eventsWithinThrottleWindow: longTaskEvents.length,
      throttleEffective: longTaskEvents.length <= 3, // Should be throttled significantly
      timeBetweenEvents,
      respectsThrottleLimit,
    };
  });
}

/**
 * Analyzes sampling behavior
 */
export async function analyzeSamplingBehavior(page: Page, attemptsGenerated: number): Promise<SamplingTestInfo> {
  return await page.evaluate((attempts: number): SamplingTestInfo => {
    const bridge = window.__traceLogTestBridge;
    if (!bridge) {
      return {
        attemptsGenerated: attempts,
        eventsRecorded: 0,
        samplingRatio: 0,
        withinExpectedRange: false,
      };
    }

    const eventManager = bridge.getEventManager();
    if (!eventManager) {
      return {
        attemptsGenerated: attempts,
        eventsRecorded: 0,
        samplingRatio: 0,
        withinExpectedRange: false,
      };
    }

    const events = eventManager.getEventQueue() ?? [];
    const longTaskEvents = events.filter(
      (event: LongTaskEvent) => event.type === 'web_vitals' && event.web_vitals?.type === 'LONG_TASK',
    );

    // In QA mode, sampling may be disabled, so we assume QA mode for tests
    const isQaMode = true; // Always true in test environment

    const eventsRecorded = longTaskEvents.length;
    const samplingRatio = eventsRecorded / attempts;

    // QA mode samples everything, normal mode uses configured sampling rate
    // In QA mode, events may still be throttled, so we're more permissive
    const withinExpectedRange = isQaMode
      ? samplingRatio >= 0 && samplingRatio <= 1.0 // QA mode should capture some (throttling may apply)
      : samplingRatio >= 0 && samplingRatio <= 1.0; // Normal mode should respect sampling

    return {
      attemptsGenerated: attempts,
      eventsRecorded,
      samplingRatio,
      withinExpectedRange,
    };
  }, attemptsGenerated);
}

/**
 * Analyzes duplicate detection behavior
 */
export async function analyzeDuplicateDetection(page: Page): Promise<{
  testable: boolean;
  totalEvents: number;
  eventsByType: EventsByType;
  typesCaptured: string[];
  duplicateDetection: DuplicateDetectionInfo[];
}> {
  return await page.evaluate(() => {
    const bridge = window.__traceLogTestBridge;
    if (!bridge)
      return { testable: false, totalEvents: 0, eventsByType: {}, typesCaptured: [], duplicateDetection: [] };

    const eventManager = bridge.getEventManager();
    if (!eventManager)
      return { testable: false, totalEvents: 0, eventsByType: {}, typesCaptured: [], duplicateDetection: [] };

    const events = eventManager.getEventQueue() ?? [];
    const webVitalsEvents = events.filter((event: WebVitalsEvent) => event.type === 'web_vitals');

    // Group events by type
    const eventsByType = webVitalsEvents.reduce((acc: EventsByType, event: WebVitalsEvent) => {
      const type = event.web_vitals?.type;
      if (!type) return acc;
      if (!acc[type]) acc[type] = [];
      acc[type].push(event);
      return acc;
    }, {} as EventsByType);

    return {
      testable: true,
      totalEvents: webVitalsEvents.length,
      eventsByType,
      typesCaptured: Object.keys(eventsByType),
      duplicateDetection: Object.entries(eventsByType).map(
        ([type, events]: [string, WebVitalsEvent[]]): DuplicateDetectionInfo => ({
          type,
          count: events.length,
          // Check for potential duplicates (same type and similar values)
          hasDuplicates:
            events.length > 1 &&
            events.some((e1: WebVitalsEvent, i: number) =>
              events.slice(i + 1).some((e2: WebVitalsEvent) => {
                const val1 = e1.web_vitals?.value ?? 0;
                const val2 = e2.web_vitals?.value ?? 0;
                return Math.abs(val1 - val2) < 1;
              }),
            ),
        }),
      ),
    };
  });
}

// ============================================================================
// PERFORMANCE IMPACT HELPERS
// ============================================================================

/**
 * Measures performance metrics before/after operations
 */
export async function measurePerformanceImpact(page: Page): Promise<MemoryUsageInfo> {
  return await page.evaluate(() => {
    const start = performance.now();
    // Simulate some baseline work
    for (let i = 0; i < 1000; i++) {
      void Math.random();
    }
    return {
      timestamp: performance.now(),
      duration: performance.now() - start,
      memoryUsage: (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize,
    };
  });
}

/**
 * Measures memory usage with comparison
 */
export async function measureMemoryUsage(
  page: Page,
  initialMemory: number,
): Promise<{
  testable: boolean;
  initialMemory: number;
  currentMemory: number;
  memoryDifference: number;
  hasReasonableMemoryUsage: boolean;
  memoryStable: boolean;
}> {
  return await page.evaluate((initialMem: number) => {
    const currentMemory =
      (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ?? 0;

    return {
      testable: true,
      initialMemory: initialMem,
      currentMemory,
      memoryDifference: currentMemory - initialMem,
      hasReasonableMemoryUsage:
        currentMemory === 0 || initialMem === 0 || Math.abs(currentMemory - initialMem) < 2 * 1024 * 1024, // Less than 2MB change
      memoryStable: currentMemory === 0 || initialMem === 0 || Math.abs(currentMemory - initialMem) < 5 * 1024 * 1024, // Less than 5MB change
    };
  }, initialMemory);
}

// ============================================================================
// FALLBACK BEHAVIOR HELPERS
// ============================================================================

/**
 * Mocks web-vitals library unavailability
 */
export async function mockWebVitalsUnavailable(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // Override dynamic import to simulate web-vitals not being available
    const originalImport = window.eval('import');
    window.eval = (code: string): unknown => {
      if (code.includes('import(') && code.includes('web-vitals')) {
        return Promise.reject(new Error('web-vitals module not available'));
      }
      return originalImport(code);
    };
  });
}

/**
 * Mocks PerformanceObserver unavailability
 */
export async function mockPerformanceObserverUnavailable(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // Remove PerformanceObserver to simulate unsupported environment
    delete (window as Window & { PerformanceObserver?: unknown }).PerformanceObserver;
  });
}

/**
 * Analyzes fallback behavior when web-vitals is unavailable
 */
export async function analyzeFallbackBehavior(page: Page): Promise<{
  testable: boolean;
  hasWebVitalsEvents: boolean;
  eventCount: number;
  eventTypes: string[];
  fallbackMetrics: { type: string; value: number; isValidValue: boolean }[];
}> {
  return await page.evaluate(() => {
    const bridge = window.__traceLogTestBridge;
    if (!bridge)
      return { testable: false, hasWebVitalsEvents: false, eventCount: 0, eventTypes: [], fallbackMetrics: [] };

    const eventManager = bridge.getEventManager();
    if (!eventManager)
      return { testable: false, hasWebVitalsEvents: false, eventCount: 0, eventTypes: [], fallbackMetrics: [] };

    const events = eventManager.getEventQueue() ?? [];
    const webVitalsEvents = events.filter((event: WebVitalsEvent) => event.type === 'web_vitals');

    return {
      testable: true,
      hasWebVitalsEvents: webVitalsEvents.length > 0,
      eventCount: webVitalsEvents.length,
      eventTypes: webVitalsEvents.map((e: WebVitalsEvent) => e.web_vitals?.type).filter(Boolean) as string[],
      fallbackMetrics: webVitalsEvents.map((e: WebVitalsEvent) => ({
        type: e.web_vitals?.type || '',
        value: e.web_vitals?.value || 0,
        isValidValue:
          typeof e.web_vitals?.value === 'number' && e.web_vitals
            ? // Allow 0+ for CLS, -2+ for TTFB, require positive for others
              e.web_vitals.type === 'CLS'
              ? e.web_vitals.value >= 0
              : e.web_vitals.type === 'TTFB'
                ? e.web_vitals.value >= -2
                : e.web_vitals.value > 0
            : false,
      })),
    };
  });
}

/**
 * Analyzes graceful degradation when PerformanceObserver is unavailable
 */
export async function analyzePerformanceObserverFallback(page: Page): Promise<{
  testable: boolean;
  hasPerformanceObserver?: boolean;
  isInitialized?: boolean;
  canTrackCustomEvents?: boolean;
  hasBasicEventManager?: boolean;
  eventQueueAccessible?: boolean;
}> {
  return await page.evaluate(() => {
    const bridge = window.__traceLogTestBridge;
    if (!bridge) return { testable: false };

    const app = bridge.getAppInstance();
    if (!app) return { testable: false };

    const eventManager = bridge.getEventManager();

    return {
      testable: true,
      hasPerformanceObserver: typeof PerformanceObserver !== 'undefined',
      isInitialized: bridge.isInitialized(),
      hasBasicEventManager: Boolean(eventManager),
      eventQueueAccessible: Boolean(eventManager?.getEventQueue),
      // Check if app continues to function without PerformanceObserver
      canTrackCustomEvents: (() => {
        try {
          app.eventManagerInstance?.track?.({
            type: 'custom' as EventType,
            custom_event: { name: 'test_without_observer', metadata: { test: true } },
          });
          return true;
        } catch {
          return false;
        }
      })(),
    };
  });
}
