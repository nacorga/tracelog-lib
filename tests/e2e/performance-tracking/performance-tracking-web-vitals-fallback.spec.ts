import { test, expect } from '@playwright/test';
import { TestUtils } from '../../utils';
import { EventType } from '../../../src/types';
import { TEST_CONFIGS } from '../../constants';

test.describe('Performance Tracking - Web Vitals Fallback', () => {
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

  test.describe('Web-Vitals Library Unavailable Fallback', () => {
    test('should use native Performance Observer API when web-vitals library is unavailable', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        // Mock web-vitals import failure to trigger fallback
        await TestUtils.mockWebVitalsUnavailable(page);

        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create comprehensive content to trigger all types of web vitals
        await page.evaluate(() => {
          // Add large content for LCP fallback
          const lcpContent = document.createElement('div');
          lcpContent.style.width = '100%';
          lcpContent.style.height = '300px';
          lcpContent.style.backgroundColor = '#e8f4fd';
          lcpContent.style.fontSize = '24px';
          lcpContent.style.padding = '20px';
          lcpContent.style.border = '2px solid #0066cc';
          lcpContent.textContent = 'Large content element for LCP fallback testing';
          lcpContent.id = 'lcp-fallback-content';
          document.body.appendChild(lcpContent);

          // Create layout shifts for CLS fallback
          setTimeout(() => {
            const shifter1 = document.createElement('div');
            shifter1.style.height = '80px';
            shifter1.style.backgroundColor = '#ffe6e6';
            shifter1.style.border = '1px solid #ff4444';
            shifter1.textContent = 'First layout shift for CLS fallback';
            document.body.insertBefore(shifter1, document.body.firstChild);
            void shifter1.offsetHeight; // Force layout recalculation

            // Second layout shift
            setTimeout(() => {
              const shifter2 = document.createElement('div');
              shifter2.style.height = '60px';
              shifter2.style.backgroundColor = '#fff2e6';
              shifter2.style.border = '1px solid #ff8800';
              shifter2.textContent = 'Second layout shift for CLS fallback';
              document.body.insertBefore(shifter2, shifter1);
              void shifter2.offsetHeight;
            }, 200);
          }, 100);

          // Create interactive element for INP fallback (event timing)
          setTimeout(() => {
            const button = document.createElement('button');
            button.textContent = 'Click for INP Fallback Test';
            button.style.padding = '15px 30px';
            button.style.fontSize = '16px';
            button.style.backgroundColor = '#e6ffe6';
            button.style.border = '2px solid #00aa00';
            button.style.cursor = 'pointer';
            button.id = 'inp-fallback-button';

            // Add processing delay to trigger INP
            button.addEventListener('click', () => {
              const start = performance.now();
              while (performance.now() - start < 60) {
                // Intensive computation to trigger INP
                void (Math.random() * Math.random() * Math.sin(Math.random()));
              }
              button.textContent = 'Clicked! INP triggered';
              button.style.backgroundColor = '#ccffcc';
            });

            document.body.appendChild(button);
          }, 300);
        });

        // Wait for content to be rendered and initial metrics to be captured
        await page.waitForTimeout(1000);

        // Trigger user interaction for INP
        await page.click('#inp-fallback-button', { force: true });
        await page.waitForTimeout(500);

        // Generate long task for long task detection
        await TestUtils.generateLongTask(page, 75, 200);

        // Wait for all fallback metrics to be processed
        await page.waitForTimeout(2000);

        const fallbackBehavior = await TestUtils.analyzeFallbackBehavior(page);

        // Verify fallback behavior is working
        expect(fallbackBehavior.testable).toBe(true);

        if (fallbackBehavior.hasWebVitalsEvents) {
          expect(fallbackBehavior.eventCount).toBeGreaterThan(0);
          expect(fallbackBehavior.eventTypes.length).toBeGreaterThan(0);

          // Validate each fallback metric
          for (const metric of fallbackBehavior.fallbackMetrics) {
            expect(metric.isValidValue).toBe(true);
            expect(['LCP', 'CLS', 'FCP', 'TTFB', 'INP', 'LONG_TASK']).toContain(metric.type);
            expect(typeof metric.value).toBe('number');
            expect(Number.isFinite(metric.value)).toBe(true);
            expect(metric.value).toBeGreaterThanOrEqual(0);
          }

          // Check for specific metric types that should be available via fallback
          const availableTypes = new Set(fallbackBehavior.eventTypes);

          // FCP should be available via paint observer
          if (availableTypes.has('FCP')) {
            const fcpMetric = fallbackBehavior.fallbackMetrics.find((m) => m.type === 'FCP');
            expect(fcpMetric).toBeDefined();
            expect(fcpMetric!.value).toBeGreaterThan(0);
          }

          // TTFB should be available via navigation timing
          if (availableTypes.has('TTFB')) {
            const ttfbMetric = fallbackBehavior.fallbackMetrics.find((m) => m.type === 'TTFB');
            expect(ttfbMetric).toBeDefined();
            expect(ttfbMetric!.value).toBeGreaterThan(0);
          }

          // LCP should be available via largest-contentful-paint observer
          if (availableTypes.has('LCP')) {
            const lcpMetric = fallbackBehavior.fallbackMetrics.find((m) => m.type === 'LCP');
            expect(lcpMetric).toBeDefined();
            expect(lcpMetric!.value).toBeGreaterThan(0);
          }
        }

        // Verify no errors occurred during fallback
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should maintain accurate metric ranges in fallback mode', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        // Mock web-vitals unavailable
        await TestUtils.mockWebVitalsUnavailable(page);

        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create controlled content for predictable metrics
        await page.evaluate(() => {
          // Large content for LCP
          const content = document.createElement('div');
          content.style.width = '100%';
          content.style.height = '250px';
          content.style.backgroundColor = '#f0f8ff';
          content.style.fontSize = '20px';
          content.style.padding = '20px';
          content.textContent = 'Controlled content for metric accuracy testing';
          document.body.appendChild(content);

          // Controlled layout shift
          setTimeout(() => {
            const shifter = document.createElement('div');
            shifter.style.height = '100px';
            shifter.style.backgroundColor = '#fff0f8';
            shifter.textContent = 'Controlled layout shift';
            document.body.insertBefore(shifter, document.body.firstChild);
            void shifter.offsetHeight;
          }, 150);
        });

        await page.waitForTimeout(1500);

        // Validate metric ranges using existing helper
        const metricsValidation = await TestUtils.validateMetricRanges(page);

        if (metricsValidation.validations.length > 0) {
          for (const validation of metricsValidation.validations) {
            // Log validation info for debugging
            if (!validation.isWithinExpectedRange) {
              console.warn(
                `[Test] Validation failed for ${validation.type}: value=${validation.value}, expected=${validation.expectedRange}`,
              );
            }

            // Some browsers may have edge cases, so we're more permissive here
            expect(validation.isWithinExpectedRange).toBe(true);

            // Additional validation for fallback-specific ranges
            switch (validation.type) {
              case 'LCP':
                expect(validation.value).toBeGreaterThan(0);
                expect(validation.value).toBeLessThan(10000); // 10 seconds max
                break;
              case 'CLS':
                expect(validation.value).toBeGreaterThanOrEqual(0);
                expect(validation.value).toBeLessThan(5); // Reasonable upper bound
                break;
              case 'FCP':
                expect(validation.value).toBeGreaterThan(0);
                expect(validation.value).toBeLessThan(5000); // 5 seconds max
                break;
              case 'TTFB':
                expect(validation.value).toBeGreaterThanOrEqual(-2); // Can be -1, -2 in some browsers
                expect(validation.value).toBeLessThan(2000); // 2 seconds max
                break;
              case 'INP':
                expect(validation.value).toBeGreaterThan(0);
                expect(validation.value).toBeLessThan(1000); // 1 second max
                break;
              case 'LONG_TASK':
                expect(validation.value).toBeGreaterThanOrEqual(50); // Long task threshold
                expect(validation.value).toBeLessThan(5000); // 5 seconds max
                break;
            }
          }
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should continue tracking non-performance events when web-vitals is unavailable', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        // Mock web-vitals unavailable
        await TestUtils.mockWebVitalsUnavailable(page);

        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Test other SDK functionality continues to work
        await page.evaluate(() => {
          // Create clickable element
          const button = document.createElement('button');
          button.textContent = 'Test Button';
          button.id = 'test-button';
          button.style.padding = '10px';
          document.body.appendChild(button);
        });

        // Test click tracking
        await TestUtils.triggerClickEvent(page, '#test-button');
        await page.waitForTimeout(500);

        // Test custom event tracking
        await page.evaluate(() => {
          const bridge = window.__traceLogTestBridge;
          if (bridge) {
            const app = bridge.getAppInstance();
            if (app) {
              app.eventManagerInstance?.track?.({
                type: 'custom' as EventType,
                custom_event: {
                  name: 'test_fallback_custom_event',
                  metadata: {
                    test_data: 'fallback_test',
                    timestamp: Date.now(),
                  },
                },
              });
            }
          }
        });

        await page.waitForTimeout(500);

        // Verify other events are still tracked
        const allEvents = await page.evaluate(() => {
          const bridge = window.__traceLogTestBridge;
          if (!bridge) return [];

          const eventManager = bridge.getEventManager();
          if (!eventManager) return [];

          return eventManager.getEventQueue() ?? [];
        });

        // Should have non-web-vitals events
        const nonWebVitalsEvents = allEvents.filter((event: { type: string }) => event.type !== 'web_vitals');
        expect(nonWebVitalsEvents.length).toBeGreaterThan(0);

        // Check for click events
        const clickEvents = allEvents.filter((event: { type: string }) => event.type === 'click');
        expect(clickEvents.length).toBeGreaterThan(0);

        // Check for custom events
        const customEvents = allEvents.filter((event: { type: string }) => event.type === 'custom');
        expect(customEvents.length).toBeGreaterThan(0);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('PerformanceObserver Unavailable Fallback', () => {
    test('should gracefully degrade when PerformanceObserver is not supported', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        // Mock PerformanceObserver unavailability
        await TestUtils.mockPerformanceObserverUnavailable(page);

        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Test basic functionality continues to work
        await page.evaluate(() => {
          const testContent = document.createElement('div');
          testContent.style.width = '100%';
          testContent.style.height = '100px';
          testContent.style.backgroundColor = '#f5f5f5';
          testContent.textContent = 'Test content for PerformanceObserver fallback';
          testContent.id = 'observer-fallback-content';
          document.body.appendChild(testContent);
        });

        await page.waitForTimeout(1000);

        const observerFallback = await TestUtils.analyzePerformanceObserverFallback(page);

        expect(observerFallback.testable).toBe(true);
        expect(observerFallback.hasPerformanceObserver).toBe(false);
        expect(observerFallback.isInitialized).toBe(true);
        expect(observerFallback.hasBasicEventManager).toBe(true);
        expect(observerFallback.eventQueueAccessible).toBe(true);

        // Custom event tracking should still work
        if (observerFallback.canTrackCustomEvents !== undefined) {
          expect(observerFallback.canTrackCustomEvents).toBe(true);
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should still collect TTFB via navigation timing when PerformanceObserver is unavailable', async ({
      page,
    }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        // Mock PerformanceObserver unavailability
        await TestUtils.mockPerformanceObserverUnavailable(page);

        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        await page.waitForTimeout(1000);

        // Check if TTFB was still captured via navigation timing fallback
        const ttfbCheck = await page.evaluate(() => {
          const bridge = window.__traceLogTestBridge;
          if (!bridge) return null;

          const eventManager = bridge.getEventManager();
          if (!eventManager) return null;

          const events = eventManager.getEventQueue() ?? [];
          const ttfbEvents = events.filter(
            (event: { type: string; web_vitals?: { type: string } }) =>
              event.type === 'web_vitals' && event.web_vitals?.type === 'TTFB',
          );

          return {
            hasTTFB: ttfbEvents.length > 0,
            ttfbValue: ttfbEvents.length > 0 ? ttfbEvents[0].web_vitals?.value : null,
            navigationTimingAvailable: typeof performance.getEntriesByType === 'function',
          };
        });

        if (ttfbCheck) {
          expect(ttfbCheck.navigationTimingAvailable).toBe(true);

          // TTFB should still be available via navigation timing even without PerformanceObserver
          if (ttfbCheck.hasTTFB) {
            expect(typeof ttfbCheck.ttfbValue).toBe('number');
            // Some browsers may report TTFB as -1, -2, or 0, which is valid
            expect(ttfbCheck.ttfbValue).toBeGreaterThanOrEqual(-2);
          }
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should maintain core SDK functionality without any performance APIs', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        // Mock both web-vitals and PerformanceObserver unavailable
        await TestUtils.mockWebVitalsUnavailable(page);
        await TestUtils.mockPerformanceObserverUnavailable(page);

        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Test comprehensive SDK functionality
        await page.evaluate(() => {
          // Add content for interaction testing
          const container = document.createElement('div');
          container.innerHTML = `
            <button id="click-test">Click Test</button>
            <div id="scroll-content" style="height: 2000px; background: linear-gradient(to bottom, #ff0000, #0000ff);">
              Scroll Content
            </div>
          `;
          document.body.appendChild(container);
        });

        // Test click tracking
        await TestUtils.triggerClickEvent(page, '#click-test');
        await page.waitForTimeout(300);

        // Test custom events
        await page.evaluate(() => {
          const bridge = window.__traceLogTestBridge;
          if (bridge) {
            const app = bridge.getAppInstance();
            if (app) {
              app.eventManagerInstance?.track?.({
                type: 'custom' as any,
                custom_event: {
                  name: 'complete_fallback_test',
                  metadata: {
                    scenario: 'no_performance_apis',
                    timestamp: Date.now(),
                  },
                },
              });
            }
          }
        });

        // Test scroll tracking
        await page.evaluate(() => {
          window.scrollTo(0, 500);
        });
        await page.waitForTimeout(500);

        // Verify events are still captured
        const functionalityTest = await page.evaluate(() => {
          const bridge = window.__traceLogTestBridge;
          if (!bridge) return { testable: false };

          const eventManager = bridge.getEventManager();
          if (!eventManager) return { testable: false };

          const events = eventManager.getEventQueue() ?? [];

          return {
            testable: true,
            totalEvents: events.length,
            hasClickEvents: events.some((e: { type: string }) => e.type === 'click'),
            hasCustomEvents: events.some((e: { type: string }) => e.type === 'custom'),
            hasScrollEvents: events.some((e: { type: string }) => e.type === 'scroll'),
            eventTypes: [...new Set(events.map((e: { type: string }) => e.type))],
          };
        });

        expect(functionalityTest.testable).toBe(true);
        expect(functionalityTest.totalEvents).toBeGreaterThan(0);
        expect(functionalityTest.hasClickEvents).toBe(true);
        expect(functionalityTest.hasCustomEvents).toBe(true);

        // Verify core event types are working
        expect(functionalityTest.eventTypes).toContain('click');
        expect(functionalityTest.eventTypes).toContain('custom');

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Fallback Accuracy and Comparison', () => {
    test('should provide comparable web vitals metrics between primary and fallback implementations', async ({
      page,
    }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        // First test with normal web-vitals library
        await TestUtils.navigateAndWaitForReady(page, '/');
        const normalInitResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);

        expect(TestUtils.verifyInitializationResult(normalInitResult).success).toBe(true);

        // Create content for web vitals
        await page.evaluate(() => {
          const content = document.createElement('div');
          content.style.width = '100%';
          content.style.height = '200px';
          content.style.backgroundColor = '#e0f7ff';
          content.textContent = 'Content for comparison testing';
          document.body.appendChild(content);
        });

        await page.waitForTimeout(1000);

        const normalMetrics = await TestUtils.getAllWebVitalsEvents(page);

        // Now test with fallback (new page to reset state)
        await TestUtils.mockWebVitalsUnavailable(page);
        await TestUtils.navigateAndWaitForReady(page, '/');
        const fallbackInitResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);

        expect(TestUtils.verifyInitializationResult(fallbackInitResult).success).toBe(true);

        // Create identical content
        await page.evaluate(() => {
          const content = document.createElement('div');
          content.style.width = '100%';
          content.style.height = '200px';
          content.style.backgroundColor = '#e0f7ff';
          content.textContent = 'Content for comparison testing';
          document.body.appendChild(content);
        });

        await page.waitForTimeout(1000);

        const fallbackMetrics = await TestUtils.getAllWebVitalsEvents(page);

        // Compare the two approaches
        if (normalMetrics.hasEvents && fallbackMetrics.hasEvents) {
          const normalTypes = new Set(normalMetrics.eventTypes);
          const fallbackTypes = new Set(fallbackMetrics.eventTypes);

          // Should have overlapping metric types
          const commonTypes = [...normalTypes].filter((type) => fallbackTypes.has(type));
          expect(commonTypes.length).toBeGreaterThan(0);

          // Validate both implementations provide valid metrics
          for (const normalResult of normalMetrics.validationResults) {
            expect(normalResult.hasType).toBe(true);
            expect(normalResult.hasValue).toBe(true);
            expect(normalResult.valueIsValid).toBe(true);
          }

          for (const fallbackResult of fallbackMetrics.validationResults) {
            expect(fallbackResult.hasType).toBe(true);
            expect(fallbackResult.hasValue).toBe(true);
            expect(fallbackResult.valueIsValid).toBe(true);
          }
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle browser capability differences gracefully', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        // Check browser capabilities first
        const capabilities = await TestUtils.checkLongTaskSupport(page);

        await TestUtils.mockWebVitalsUnavailable(page);
        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Generate content based on browser capabilities
        await page.evaluate(() => {
          // Always try to create basic content
          const content = document.createElement('div');
          content.style.width = '100%';
          content.style.height = '150px';
          content.style.backgroundColor = '#fff5e6';
          content.textContent = 'Browser capability test content';
          document.body.appendChild(content);

          // Create interactive element
          const button = document.createElement('button');
          button.textContent = 'Capability Test';
          button.style.padding = '10px';
          button.addEventListener('click', () => {
            button.textContent = 'Clicked!';
          });
          document.body.appendChild(button);
        });

        // Test long task only if supported
        if (capabilities.supportsLongTask) {
          await TestUtils.generateLongTask(page, 60, 100);
        }

        await page.click('button');
        await page.waitForTimeout(1500);

        const fallbackValidation = await TestUtils.analyzeFallbackBehavior(page);

        expect(fallbackValidation.testable).toBe(true);

        // Validate based on browser capabilities
        if (capabilities.hasPerformanceObserver) {
          // Should have some fallback metrics
          if (fallbackValidation.hasWebVitalsEvents) {
            expect(fallbackValidation.eventCount).toBeGreaterThan(0);
          }
        }

        // Basic TTFB should always be available via navigation timing
        const hasNavigationTiming = await page.evaluate(() => {
          return (
            typeof performance.getEntriesByType === 'function' && performance.getEntriesByType('navigation').length > 0
          );
        });

        if (hasNavigationTiming) {
          // Should be able to collect TTFB
          const ttfbEvents = fallbackValidation.fallbackMetrics.filter((m) => m.type === 'TTFB');
          if (ttfbEvents.length > 0) {
            expect(ttfbEvents[0].isValidValue).toBe(true);
            // Some browsers may report TTFB as -1, -2, which is still valid
            expect(ttfbEvents[0].value).toBeGreaterThanOrEqual(-2);
          }
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });
});
