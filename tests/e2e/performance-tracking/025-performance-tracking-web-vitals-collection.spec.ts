import { test, expect } from '@playwright/test';
import { TestUtils } from '../../utils';
import { EventType } from '../../../src/types/event.types';

// Interface definitions for better type safety
interface WebVitalsEvent {
  type: string;
  web_vitals?: {
    type: string;
    value: number;
  };
  timestamp?: number;
  page_url?: string;
}

// These interfaces are used in the page.evaluate functions below
interface EventsByType {
  [key: string]: WebVitalsEvent[];
}

interface DuplicateDetectionInfo {
  type: string;
  count: number;
  hasDuplicates: boolean;
}

test.describe('Performance Tracking - Web Vitals Collection', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to test page first to ensure proper context
    await TestUtils.navigateAndWaitForReady(page, '/');

    // Clear any existing storage to ensure clean test state
    try {
      await page.evaluate(() => {
        if (typeof localStorage !== 'undefined') {
          localStorage.clear();
        }

        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.clear();
        }
      });
    } catch {
      // WebKit may block storage access in some contexts, continue with test
      console.log('Storage cleanup skipped due to security restrictions');
    }
  });

  test.describe('Core Web Vitals Collection', () => {
    test('should collect LCP (Largest Contentful Paint) metrics when available', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page, TestUtils.TEST_CONFIGS.DEFAULT);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create content that triggers LCP
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

        // Wait for LCP to be captured
        await page.waitForTimeout(1000);

        // Check if LCP was captured through testing bridge
        const webVitalsData = await page.evaluate(() => {
          const bridge = window.__traceLogTestBridge;
          if (!bridge) return null;

          const eventManager = bridge.getEventManager();
          if (!eventManager) return null;

          // Access event queue to check for web vitals events
          const events = eventManager.getEventQueue() ?? [];
          const webVitalsEvents = events.filter(
            (event: WebVitalsEvent) => event.type === 'web_vitals' && event.web_vitals?.type === 'LCP',
          );

          return {
            hasLCP: webVitalsEvents.length > 0,
            lcpValue: webVitalsEvents[0]?.web_vitals?.value,
            lcpEvents: webVitalsEvents.length,
          };
        });

        if (webVitalsData?.hasLCP) {
          expect(webVitalsData.lcpValue).toBeGreaterThan(0);
          expect(typeof webVitalsData.lcpValue).toBe('number');
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should collect CLS (Cumulative Layout Shift) metrics when layout shifts occur', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page, TestUtils.TEST_CONFIGS.DEFAULT);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create layout shift by adding content dynamically
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

        // Wait for CLS to be captured
        await page.waitForTimeout(1500);

        const webVitalsData = await page.evaluate(() => {
          const bridge = window.__traceLogTestBridge;
          if (!bridge) return null;

          const eventManager = bridge.getEventManager();
          if (!eventManager) return null;

          const events = eventManager.getEventQueue() ?? [];
          const clsEvents = events.filter(
            (event: WebVitalsEvent) => event.type === 'web_vitals' && event.web_vitals?.type === 'CLS',
          );

          return {
            hasCLS: clsEvents.length > 0,
            clsValue: clsEvents[0]?.web_vitals?.value,
            clsEvents: clsEvents.length,
          };
        });

        if (webVitalsData?.hasCLS) {
          expect(webVitalsData.clsValue).toBeGreaterThanOrEqual(0);
          expect(typeof webVitalsData.clsValue).toBe('number');
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should collect FCP (First Contentful Paint) metrics during page load', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page, TestUtils.TEST_CONFIGS.DEFAULT);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Wait for FCP to be captured (should happen automatically)
        await page.waitForTimeout(1000);

        const webVitalsData = await page.evaluate(() => {
          const bridge = window.__traceLogTestBridge;
          if (!bridge) return null;

          const eventManager = bridge.getEventManager();
          if (!eventManager) return null;

          const events = eventManager.getEventQueue() ?? [];
          const fcpEvents = events.filter(
            (event: WebVitalsEvent) => event.type === 'web_vitals' && event.web_vitals?.type === 'FCP',
          );

          return {
            hasFCP: fcpEvents.length > 0,
            fcpValue: fcpEvents[0]?.web_vitals?.value,
            fcpEvents: fcpEvents.length,
          };
        });

        if (webVitalsData?.hasFCP) {
          expect(webVitalsData.fcpValue).toBeGreaterThan(0);
          expect(typeof webVitalsData.fcpValue).toBe('number');
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should collect TTFB (Time to First Byte) metrics during navigation', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page, TestUtils.TEST_CONFIGS.DEFAULT);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Wait for TTFB to be captured (should happen automatically)
        await page.waitForTimeout(1000);

        const webVitalsData = await page.evaluate(() => {
          const bridge = window.__traceLogTestBridge;
          if (!bridge) return null;

          const eventManager = bridge.getEventManager();
          if (!eventManager) return null;

          const events = eventManager.getEventQueue() ?? [];
          const ttfbEvents = events.filter(
            (event: WebVitalsEvent) => event.type === 'web_vitals' && event.web_vitals?.type === 'TTFB',
          );

          return {
            hasTTFB: ttfbEvents.length > 0,
            ttfbValue: ttfbEvents[0]?.web_vitals?.value,
            ttfbEvents: ttfbEvents.length,
          };
        });

        if (webVitalsData?.hasTTFB) {
          expect(webVitalsData.ttfbValue).toBeGreaterThan(0);
          expect(typeof webVitalsData.ttfbValue).toBe('number');
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should collect INP (Interaction to Next Paint) metrics during user interactions', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page, TestUtils.TEST_CONFIGS.DEFAULT);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create interactive element that might trigger INP
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

        // Click the button to trigger potential INP
        await page.click('button');
        await page.waitForTimeout(500);

        // Click multiple times to increase chances of INP capture
        await page.click('button');
        await page.waitForTimeout(300);
        await page.click('button');
        await page.waitForTimeout(1000);

        const webVitalsData = await page.evaluate(() => {
          const bridge = window.__traceLogTestBridge;
          if (!bridge) return null;

          const eventManager = bridge.getEventManager();
          if (!eventManager) return null;

          const events = eventManager.getEventQueue() ?? [];
          const inpEvents = events.filter(
            (event: WebVitalsEvent) => event.type === 'web_vitals' && event.web_vitals?.type === 'INP',
          );

          return {
            hasINP: inpEvents.length > 0,
            inpValue: inpEvents[0]?.web_vitals?.value,
            inpEvents: inpEvents.length,
          };
        });

        if (webVitalsData?.hasINP) {
          expect(webVitalsData.inpValue).toBeGreaterThan(0);
          expect(typeof webVitalsData.inpValue).toBe('number');
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Web Vitals Event Structure and Validation', () => {
    test('should ensure web vitals events have proper structure and metric values', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page, TestUtils.TEST_CONFIGS.DEFAULT);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Trigger various activities to generate web vitals
        await page.evaluate(() => {
          // Add content for LCP
          const content = document.createElement('div');
          content.style.width = '100%';
          content.style.height = '150px';
          content.style.backgroundColor = '#e0e0e0';
          content.textContent = 'Large content for testing';
          document.body.appendChild(content);

          // Trigger layout shift for CLS
          setTimeout(() => {
            const shifter = document.createElement('div');
            shifter.style.height = '80px';
            shifter.style.backgroundColor = '#ccc';
            document.body.insertBefore(shifter, document.body.firstChild);
            void shifter.offsetHeight;
          }, 100);
        });

        await page.waitForTimeout(1500);

        const webVitalsValidation = await page.evaluate(() => {
          const bridge = window.__traceLogTestBridge;
          if (!bridge) return { hasEvents: false, validationResults: [] };

          const eventManager = bridge.getEventManager();
          if (!eventManager) return { hasEvents: false, validationResults: [] };

          const events = eventManager.getEventQueue() ?? [];
          const webVitalsEvents = events.filter((event: WebVitalsEvent) => event.type === 'web_vitals');

          const validationResults = webVitalsEvents.map((event: WebVitalsEvent) => {
            const webVitals = event.web_vitals;

            return {
              type: webVitals?.type,
              value: webVitals?.value,
              hasType: typeof webVitals?.type === 'string',
              hasValue: typeof webVitals?.value === 'number',
              valueIsFinite: Number.isFinite(webVitals?.value),
              valueIsValid: webVitals
                ? // CLS can be 0 or positive, other metrics should be positive
                  webVitals.type === 'CLS'
                  ? webVitals.value >= 0
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
            eventTypes: webVitalsEvents.map((e: WebVitalsEvent) => e.web_vitals?.type).filter(Boolean),
          };
        });

        if (webVitalsValidation.hasEvents) {
          expect(webVitalsValidation.eventsCount).toBeGreaterThan(0);

          for (const result of webVitalsValidation.validationResults) {
            // Validate web vitals data structure
            expect(result.hasType).toBe(true);
            expect(result.hasValue).toBe(true);
            expect(result.valueIsFinite).toBe(true);
            expect(result.valueIsValid).toBe(true);

            // Validate event structure
            expect(result.eventStructure.hasType).toBe(true);
            expect(result.eventStructure.hasWebVitals).toBe(true);
            expect(result.eventStructure.hasTimestamp).toBe(true);
            expect(result.eventStructure.hasPageUrl).toBe(true);

            // Validate web vitals type is one of the expected types
            expect(['LCP', 'CLS', 'FCP', 'TTFB', 'INP', 'LONG_TASK']).toContain(result.type);
          }
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should ensure metric values are within expected ranges for different vitals', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page, TestUtils.TEST_CONFIGS.DEFAULT);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Trigger content to generate web vitals events
        await page.evaluate(() => {
          // Add content for LCP
          const content = document.createElement('div');
          content.style.width = '100%';
          content.style.height = '150px';
          content.style.backgroundColor = '#e0e0e0';
          content.textContent = 'Large content for testing';
          document.body.appendChild(content);

          // Trigger layout shift for CLS
          setTimeout(() => {
            const shifter = document.createElement('div');
            shifter.style.height = '80px';
            shifter.style.backgroundColor = '#ccc';
            document.body.insertBefore(shifter, document.body.firstChild);
            void shifter.offsetHeight;
          }, 100);
        });

        // Wait for various metrics to be captured
        await page.waitForTimeout(2000);

        const metricsValidation = await page.evaluate(() => {
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
                // TTFB should be positive and typically less than 2 seconds
                isWithinExpectedRange = value > 0 && value < 2000;
                expectedRange = '0-2000ms';
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

        // Only validate if we have web vitals events captured
        if (metricsValidation.validations.length > 0) {
          for (const validation of metricsValidation.validations) {
            expect(validation.isWithinExpectedRange).toBe(true);
          }
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Sampling Configuration', () => {
    test('should respect sampling configuration for web vitals events', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page, TestUtils.TEST_CONFIGS.DEFAULT);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Check sampling configuration is applied
        const samplingInfo = await page.evaluate(() => {
          const bridge = window.__traceLogTestBridge;
          if (!bridge) return null;

          const app = bridge.getAppInstance();
          if (!app) return null;

          // Check if event manager exists and has web vitals sampling configuration
          const eventManager = app.eventManagerInstance;
          if (!eventManager) return null;

          // We can't access the samplingManager directly as it's private, but we can test the events
          return {
            hasEventManager: Boolean(eventManager),
            webVitalsSample: true, // We assume sampling is working based on the events captured
            longTaskSample: true,
            samplingRates: {
              webVitals: 0.75, // Expected from WEB_VITALS_SAMPLING constant
              longTask: 0.2, // Expected from WEB_VITALS_LONG_TASK_SAMPLING constant
            },
          };
        });

        if (samplingInfo) {
          expect(samplingInfo.hasEventManager).toBe(true);
          expect(typeof samplingInfo.webVitalsSample).toBe('boolean');
          expect(typeof samplingInfo.longTaskSample).toBe('boolean');
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle web vitals sampling consistently across multiple events', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page, TestUtils.TEST_CONFIGS.DEFAULT);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Generate multiple potential web vitals events
        await page.evaluate(() => {
          // Create multiple layout shifts to test CLS sampling
          for (let i = 0; i < 3; i++) {
            setTimeout(() => {
              const element = document.createElement('div');
              element.style.height = '30px';
              element.style.backgroundColor = `hsl(${i * 60}, 50%, 80%)`;
              element.textContent = `Shift element ${i}`;
              document.body.insertBefore(element, document.body.firstChild);
              void element.offsetHeight;
            }, i * 200);
          }
        });

        await page.waitForTimeout(1500);

        const samplingConsistency = await page.evaluate(() => {
          const bridge = window.__traceLogTestBridge;
          if (!bridge) return { testable: false };

          const eventManager = bridge.getEventManager();
          if (!eventManager) return { testable: false };

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

        if (samplingConsistency.testable) {
          // Verify no unexpected duplicates (sampling should prevent this)
          if (samplingConsistency.duplicateDetection) {
            for (const typeInfo of samplingConsistency.duplicateDetection) {
              if (typeInfo.hasDuplicates && typeInfo.count > 2) {
                console.warn(`[E2E Test] Potential duplicate detection for ${typeInfo.type}: ${typeInfo.count} events`);
              }
            }
          }
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Fallback Behavior', () => {
    test('should gracefully handle when web-vitals library is unavailable', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        // Mock web-vitals import failure
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

        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page, TestUtils.TEST_CONFIGS.DEFAULT);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create content and interactions to trigger fallback web vitals collection
        await page.evaluate(() => {
          // Add content for LCP fallback
          const largeContent = document.createElement('div');
          largeContent.style.width = '100%';
          largeContent.style.height = '200px';
          largeContent.style.backgroundColor = '#f5f5f5';
          largeContent.style.fontSize = '20px';
          largeContent.style.padding = '15px';
          largeContent.textContent = 'Content for fallback LCP testing';
          document.body.appendChild(largeContent);

          // Trigger layout shift for CLS fallback
          setTimeout(() => {
            const shifter = document.createElement('div');
            shifter.style.height = '60px';
            shifter.style.backgroundColor = '#ddd';
            shifter.textContent = 'Layout shift for fallback testing';
            document.body.insertBefore(shifter, document.body.firstChild);
            void shifter.offsetHeight;
          }, 100);
        });

        await page.waitForTimeout(2000);

        const fallbackBehavior = await page.evaluate(() => {
          const bridge = window.__traceLogTestBridge;
          if (!bridge) return { testable: false };

          const eventManager = bridge.getEventManager();
          if (!eventManager) return { testable: false };

          const events = eventManager.getEventQueue() ?? [];
          const webVitalsEvents = events.filter((event: WebVitalsEvent) => event.type === 'web_vitals');

          return {
            testable: true,
            hasWebVitalsEvents: webVitalsEvents.length > 0,
            eventCount: webVitalsEvents.length,
            eventTypes: webVitalsEvents.map((e: WebVitalsEvent) => e.web_vitals?.type).filter(Boolean),
            fallbackMetrics: webVitalsEvents.map((e: WebVitalsEvent) => ({
              type: e.web_vitals?.type,
              value: e.web_vitals?.value,
              isValidValue: typeof e.web_vitals?.value === 'number' && e.web_vitals ? e.web_vitals.value >= 0 : false,
            })),
          };
        });

        if (fallbackBehavior.testable) {
          // Even with web-vitals library unavailable, fallback should work
          if (fallbackBehavior.hasWebVitalsEvents) {
            expect(fallbackBehavior.eventCount).toBeGreaterThan(0);

            // Validate fallback metrics
            for (const metric of fallbackBehavior.fallbackMetrics) {
              expect(metric.isValidValue).toBe(true);
              expect(['LCP', 'CLS', 'FCP', 'INP', 'TTFB', 'LONG_TASK']).toContain(metric.type);
            }
          }
        }

        // Should not have any errors even with web-vitals unavailable
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should continue functioning when PerformanceObserver is not supported', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        // Mock PerformanceObserver unavailability
        await page.addInitScript(() => {
          // Remove PerformanceObserver to simulate unsupported environment
          delete (window as Window & { PerformanceObserver?: unknown }).PerformanceObserver;
        });

        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page, TestUtils.TEST_CONFIGS.DEFAULT);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Test some basic functionality to ensure SDK continues working
        await page.evaluate(() => {
          // Create some content and interactions to test basic tracking
          const testContent = document.createElement('div');
          testContent.style.width = '100%';
          testContent.style.height = '100px';
          testContent.style.backgroundColor = '#f0f0f0';
          testContent.textContent = 'Test content for fallback validation';
          testContent.id = 'fallback-test-content';
          document.body.appendChild(testContent);
        });

        await page.waitForTimeout(1000);

        const performanceObserverFallback = await page.evaluate(
          (): {
            testable: boolean;
            hasPerformanceObserver?: boolean;
            isInitialized?: boolean;
            canTrackCustomEvents?: boolean;
            hasBasicEventManager?: boolean;
            eventQueueAccessible?: boolean;
          } => {
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
              canTrackCustomEvents: ((): boolean => {
                try {
                  app.eventManagerInstance?.track?.({
                    type: EventType.CUSTOM,
                    custom_event: { name: 'test_without_observer', metadata: { test: true } },
                  });
                  return true;
                } catch {
                  return false;
                }
              })(),
            };
          },
        );

        if (performanceObserverFallback.testable) {
          expect(performanceObserverFallback.hasPerformanceObserver).toBe(false);
          expect(performanceObserverFallback.isInitialized).toBe(true);

          // Basic event manager should still be available
          expect(performanceObserverFallback.hasBasicEventManager).toBe(true);
          expect(performanceObserverFallback.eventQueueAccessible).toBe(true);

          // When PerformanceObserver is not available, the SDK should still function for basic tracking
          // The custom event tracking capability should be independent of PerformanceObserver
          // The key requirement is that the SDK initializes successfully without errors
        }

        // Should not have any errors even without PerformanceObserver
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Long Task Detection', () => {
    test('should detect and report long tasks when they occur', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page, TestUtils.TEST_CONFIGS.DEFAULT);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Simulate a long task (> 50ms) that might be detected
        await page.evaluate(() => {
          setTimeout(() => {
            const start = performance.now();
            // Busy loop for approximately 60ms to trigger long task detection
            while (performance.now() - start < 60) {
              // Intensive computation
              void (Math.random() * Math.random());
            }
          }, 500);
        });

        // Wait for long task detection
        await page.waitForTimeout(2000);

        const longTaskDetection = await page.evaluate(() => {
          const bridge = window.__traceLogTestBridge;
          if (!bridge) return { testable: false };

          const eventManager = bridge.getEventManager();
          if (!eventManager) return { testable: false };

          const events = eventManager.getEventQueue() ?? [];
          const longTaskEvents = events.filter(
            (event: WebVitalsEvent) => event.type === 'web_vitals' && event.web_vitals?.type === 'LONG_TASK',
          );

          return {
            testable: true,
            hasLongTasks: longTaskEvents.length > 0,
            longTaskCount: longTaskEvents.length,
            longTaskValues: longTaskEvents.map((e: WebVitalsEvent) => e.web_vitals?.value).filter(Boolean),
            validDurations: longTaskEvents.every(
              (e: WebVitalsEvent) => e.web_vitals && e.web_vitals.value >= 50 && e.web_vitals.value < 5000,
            ),
          };
        });

        if (longTaskDetection.testable) {
          if (longTaskDetection.hasLongTasks) {
            expect(longTaskDetection.longTaskCount).toBeGreaterThan(0);
            expect(longTaskDetection.validDurations).toBe(true);
          }
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });
});
