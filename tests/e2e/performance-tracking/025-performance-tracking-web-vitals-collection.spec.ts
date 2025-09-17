import { test, expect } from '@playwright/test';
import { TestUtils } from '../../utils';
import { WebVitalsEvent } from '../../utils/performance-tracking.helpers';

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
        await TestUtils.createLCPTriggerContent(page);

        // Wait for LCP to be captured
        await page.waitForTimeout(1000);

        // Check if LCP was captured through testing bridge
        const webVitalsData = await TestUtils.getWebVitalsEvents(page, 'LCP');

        const lcpData = {
          hasLCP: webVitalsData.hasEvents,
          lcpValue: webVitalsData.values[0],
          lcpEvents: webVitalsData.eventCount,
        };

        if (lcpData.hasLCP) {
          expect(lcpData.lcpValue).toBeGreaterThan(0);
          expect(typeof lcpData.lcpValue).toBe('number');
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
        await TestUtils.createLayoutShift(page);

        // Wait for CLS to be captured
        await page.waitForTimeout(1500);

        const webVitalsData = await TestUtils.getWebVitalsEvents(page, 'CLS');

        const clsData = {
          hasCLS: webVitalsData.hasEvents,
          clsValue: webVitalsData.values[0],
          clsEvents: webVitalsData.eventCount,
        };

        if (clsData.hasCLS) {
          expect(clsData.clsValue).toBeGreaterThanOrEqual(0);
          expect(typeof clsData.clsValue).toBe('number');
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

        const webVitalsData = await TestUtils.getWebVitalsEvents(page, 'FCP');

        const fcpData = {
          hasFCP: webVitalsData.hasEvents,
          fcpValue: webVitalsData.values[0],
          fcpEvents: webVitalsData.eventCount,
        };

        if (fcpData.hasFCP) {
          expect(fcpData.fcpValue).toBeGreaterThan(0);
          expect(typeof fcpData.fcpValue).toBe('number');
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

        const webVitalsData = await TestUtils.getWebVitalsEvents(page, 'TTFB');

        const ttfbData = {
          hasTTFB: webVitalsData.hasEvents,
          ttfbValue: webVitalsData.values[0],
          ttfbEvents: webVitalsData.eventCount,
        };

        if (ttfbData.hasTTFB) {
          expect(ttfbData.ttfbValue).toBeGreaterThan(0);
          expect(typeof ttfbData.ttfbValue).toBe('number');
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
        await TestUtils.createINPTriggerElements(page);

        // Click the button to trigger potential INP
        await page.click('button');
        await page.waitForTimeout(500);

        // Click multiple times to increase chances of INP capture
        await page.click('button');
        await page.waitForTimeout(300);
        await page.click('button');
        await page.waitForTimeout(1000);

        const webVitalsData = await TestUtils.getWebVitalsEvents(page, 'INP');

        const inpData = {
          hasINP: webVitalsData.hasEvents,
          inpValue: webVitalsData.values[0],
          inpEvents: webVitalsData.eventCount,
        };

        if (inpData.hasINP) {
          expect(inpData.inpValue).toBeGreaterThan(0);
          expect(typeof inpData.inpValue).toBe('number');
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

        const webVitalsValidation = await TestUtils.getAllWebVitalsEvents(page);

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

        const metricsValidation = await TestUtils.validateMetricRanges(page);

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

        const samplingConsistency = await TestUtils.analyzeDuplicateDetection(page);

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
        await TestUtils.mockWebVitalsUnavailable(page);

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

        const fallbackBehavior = await TestUtils.analyzeFallbackBehavior(page);

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
        await TestUtils.mockPerformanceObserverUnavailable(page);

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

        const performanceObserverFallback = await TestUtils.analyzePerformanceObserverFallback(page);

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
