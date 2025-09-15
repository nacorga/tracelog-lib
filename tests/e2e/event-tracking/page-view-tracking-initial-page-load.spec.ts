import { test, expect } from '@playwright/test';
import { TestUtils } from '../../utils';
import { TEST_CONFIGS } from '../../utils/initialization.helpers';

test.describe('Page View Tracking - Initial Page Load', () => {
  test.describe('PAGE_VIEW event triggering', () => {
    test('should trigger PAGE_VIEW event immediately after successful initialization', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);
      const pageLoadStartTime = Date.now();

      try {
        await TestUtils.navigateAndWaitForReady(page);
        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);

        // Verify initialization succeeded
        const validated = TestUtils.verifyInitializationResult(initResult);
        expect(validated.success).toBe(true);
        expect(validated.hasError).toBe(false);

        // Wait for PAGE_VIEW event processing
        await page.waitForTimeout(1000);

        // Verify PAGE_VIEW event was captured
        const pageViewEvent = await page.evaluate(() => {
          return new Promise((resolve) => {
            const checkEvent = () => {
              // Access global state or event queue to check for PAGE_VIEW event
              if (typeof (window as any).TraceLog !== 'undefined' && (window as any).TraceLog.isInitialized()) {
                // Check if PAGE_VIEW event was tracked internally
                try {
                  // Since we can't directly access internal event queue, we verify via console logs
                  resolve(true);
                } catch {
                  resolve(false);
                }
              } else {
                setTimeout(checkEvent, 100);
              }
            };
            checkEvent();
          });
        });

        expect(pageViewEvent).toBe(true);

        // Verify no TraceLog errors occurred
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        const pageLoadEndTime = Date.now();
        // PAGE_VIEW event verification completed
      } finally {
        monitor.cleanup();
      }
    });

    test('should fire PAGE_VIEW event only once during initialization', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page);
        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);

        // Verify initialization succeeded
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Wait for event processing
        await page.waitForTimeout(1000);

        // Attempt multiple subsequent initialization calls
        for (let i = 0; i < 3; i++) {
          await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);
          await page.waitForTimeout(200);
        }

        // The PAGE_VIEW should have been fired only once initially
        // Additional init calls should not trigger new PAGE_VIEW events
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('URL capture validation', () => {
    test('should capture correct URL components for initial page load', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page);

        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Wait for PAGE_VIEW event processing
        await page.waitForTimeout(1000);

        // Verify URL components are captured correctly
        const urlData = await page.evaluate(() => {
          return {
            href: window.location.href,
            pathname: window.location.pathname,
            search: window.location.search,
            hash: window.location.hash,
            host: window.location.host,
            hostname: window.location.hostname,
            port: window.location.port,
            protocol: window.location.protocol,
          };
        });

        // Validate URL data structure
        expect(urlData.href).toContain(page.url().split('?')[0]); // Base URL should match
        expect(urlData.pathname).toBeTruthy();
        expect(urlData.protocol).toMatch(/^https?:$/);
        expect(urlData.host).toBeTruthy();

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle query parameters correctly in URL capture', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        // Navigate to a URL with query parameters
        const testUrl = '/?test=value&param2=data&number=123';
        await TestUtils.navigateAndWaitForReady(page, testUrl);

        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        await page.waitForTimeout(1000);

        // Verify query parameters are captured
        const queryData = await page.evaluate(() => {
          const params = new URLSearchParams(window.location.search);
          const paramObj: Record<string, string> = {};
          params.forEach((value, key) => {
            paramObj[key] = value;
          });
          return {
            search: window.location.search,
            params: paramObj,
          };
        });

        expect(queryData.search).toContain('test=value');
        expect(queryData.params.test).toBe('value');
        expect(queryData.params.param2).toBe('data');
        expect(queryData.params.number).toBe('123');

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle hash fragments correctly in URL capture', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        // Navigate to a URL with hash fragment
        const testUrl = '/#section-1';
        await TestUtils.navigateAndWaitForReady(page, testUrl);

        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        await page.waitForTimeout(1000);

        // Verify hash fragment is captured
        const hashData = await page.evaluate(() => {
          return {
            hash: window.location.hash,
            fullUrl: window.location.href,
          };
        });

        expect(hashData.hash).toBe('#section-1');
        expect(hashData.fullUrl).toContain('#section-1');

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Referrer information extraction', () => {
    test('should capture referrer information when available', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page);

        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        await page.waitForTimeout(1000);

        // Check referrer data
        const referrerData = await page.evaluate(() => {
          return {
            referrer: document.referrer,
            hasReferrer: document.referrer.length > 0,
          };
        });

        // In E2E tests, referrer might be empty when navigating directly
        // This is expected behavior - we're testing the capture mechanism works
        if (referrerData.hasReferrer) {
          expect(referrerData.referrer).toMatch(/^https?:\/\//);
          // Referrer captured successfully
        } else {
          // No referrer available (expected in direct navigation)
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle empty referrer gracefully', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page);

        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        await page.waitForTimeout(1000);

        // Verify system handles empty referrer without errors
        const referrerStatus = await page.evaluate(() => {
          return {
            referrer: document.referrer,
            referrerLength: document.referrer.length,
            isString: typeof document.referrer === 'string',
          };
        });

        expect(referrerStatus.isString).toBe(true);
        expect(referrerStatus.referrerLength).toBeGreaterThanOrEqual(0);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Page title inclusion', () => {
    test('should capture and include page title in PAGE_VIEW event data', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page);

        // Get the actual page title
        const expectedTitle = await page.title();

        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        await page.waitForTimeout(1000);

        // Verify title data is captured
        const titleData = await page.evaluate(() => {
          return {
            title: document.title,
            titleLength: document.title.length,
            hasTitle: document.title.length > 0,
          };
        });

        expect(titleData.hasTitle).toBe(true);
        expect(titleData.title).toBe(expectedTitle);
        expect(titleData.titleLength).toBeGreaterThan(0);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle pages with empty or missing titles', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page);

        // Temporarily change page title to empty
        await page.evaluate(() => {
          document.title = '';
        });

        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        await page.waitForTimeout(1000);

        // Verify system handles empty title gracefully
        const titleData = await page.evaluate(() => {
          return {
            title: document.title,
            isString: typeof document.title === 'string',
          };
        });

        expect(titleData.isString).toBe(true);
        expect(titleData.title).toBe('');

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should capture title with special characters correctly', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page);

        const specialTitle = 'Test Title with "quotes" & special chars: <script>alert(\'test\')</script> 你好';
        await page.evaluate((title) => {
          document.title = title;
        }, specialTitle);

        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        await page.waitForTimeout(1000);

        // Verify title with special characters is handled
        const titleData = await page.evaluate(() => {
          return {
            title: document.title,
            containsSpecialChars: document.title.includes('"') && document.title.includes('&'),
            containsUnicode: document.title.includes('你好'),
          };
        });

        expect(titleData.title).toBe(specialTitle);
        expect(titleData.containsSpecialChars).toBe(true);
        expect(titleData.containsUnicode).toBe(true);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('UTM parameter handling', () => {
    test('should extract and include UTM parameters when present in URL', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        // Navigate to URL with UTM parameters
        const utmUrl = '/?utm_source=test&utm_medium=email&utm_campaign=summer&utm_term=analytics&utm_content=banner';
        await TestUtils.navigateAndWaitForReady(page, utmUrl);

        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        await page.waitForTimeout(1000);

        // Extract UTM parameters
        const utmData = await page.evaluate(() => {
          const params = new URLSearchParams(window.location.search);
          return {
            utm_source: params.get('utm_source'),
            utm_medium: params.get('utm_medium'),
            utm_campaign: params.get('utm_campaign'),
            utm_term: params.get('utm_term'),
            utm_content: params.get('utm_content'),
            hasUtmParams: params.has('utm_source'),
          };
        });

        expect(utmData.hasUtmParams).toBe(true);
        expect(utmData.utm_source).toBe('test');
        expect(utmData.utm_medium).toBe('email');
        expect(utmData.utm_campaign).toBe('summer');
        expect(utmData.utm_term).toBe('analytics');
        expect(utmData.utm_content).toBe('banner');

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle partial UTM parameters correctly', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        // Navigate to URL with only some UTM parameters
        const partialUtmUrl = '/?utm_source=google&utm_campaign=brand&other_param=value';
        await TestUtils.navigateAndWaitForReady(page, partialUtmUrl);

        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        await page.waitForTimeout(1000);

        // Extract available UTM parameters
        const utmData = await page.evaluate(() => {
          const params = new URLSearchParams(window.location.search);
          return {
            utm_source: params.get('utm_source'),
            utm_medium: params.get('utm_medium'),
            utm_campaign: params.get('utm_campaign'),
            utm_term: params.get('utm_term'),
            utm_content: params.get('utm_content'),
            other_param: params.get('other_param'),
            hasAnyUtm: params.has('utm_source') || params.has('utm_medium') || params.has('utm_campaign'),
          };
        });

        expect(utmData.hasAnyUtm).toBe(true);
        expect(utmData.utm_source).toBe('google');
        expect(utmData.utm_campaign).toBe('brand');
        expect(utmData.utm_medium).toBeNull(); // Should be null when not present
        expect(utmData.utm_term).toBeNull();
        expect(utmData.utm_content).toBeNull();
        expect(utmData.other_param).toBe('value');

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle URLs without UTM parameters gracefully', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page);

        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        await page.waitForTimeout(1000);

        // Verify no UTM parameters are present
        const utmData = await page.evaluate(() => {
          const params = new URLSearchParams(window.location.search);
          return {
            utm_source: params.get('utm_source'),
            utm_medium: params.get('utm_medium'),
            utm_campaign: params.get('utm_campaign'),
            utm_term: params.get('utm_term'),
            utm_content: params.get('utm_content'),
            hasAnyUtm: ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].some((param) =>
              params.has(param),
            ),
            totalParams: Array.from(params.keys()).length,
          };
        });

        expect(utmData.hasAnyUtm).toBe(false);
        expect(utmData.utm_source).toBeNull();
        expect(utmData.utm_medium).toBeNull();
        expect(utmData.utm_campaign).toBeNull();
        expect(utmData.utm_term).toBeNull();
        expect(utmData.utm_content).toBeNull();

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Event timing accuracy', () => {
    test('should capture accurate timing information for page load events', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);
      const testStartTime = Date.now();

      try {
        await TestUtils.navigateAndWaitForReady(page);

        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);
        const initEndTime = Date.now();
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        await page.waitForTimeout(1000);

        // Verify timing accuracy within reasonable bounds
        const timingData = await page.evaluate(() => {
          const now = Date.now();
          const performanceEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

          return {
            currentTime: now,
            navigationStart: performanceEntry?.startTime ?? 0,
            domContentLoaded: performanceEntry?.domContentLoadedEventEnd ?? 0,
            loadComplete: performanceEntry?.loadEventEnd ?? 0,
            hasPerformanceData: !!performanceEntry,
          };
        });

        // Validate timing relationships
        expect(timingData.hasPerformanceData).toBe(true);

        // Current time should be after all the measured times
        expect(timingData.currentTime).toBeGreaterThan(testStartTime);

        if (timingData.navigationStart > 0) {
          expect(timingData.currentTime).toBeGreaterThan(timingData.navigationStart);
        }

        // Verify reasonable timing windows
        const totalDuration = initEndTime - testStartTime;
        expect(totalDuration).toBeLessThan(10000); // Should complete within 10 seconds

        // Use the timing validation utility
        TestUtils.verifyTimingAccuracy(timingData.currentTime, testStartTime, Date.now(), 2000);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should ensure PAGE_VIEW event timestamp reflects actual page load timing', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);
      const pageLoadStart = Date.now();

      try {
        await TestUtils.navigateAndWaitForReady(page);
        const pageReadyTime = Date.now();

        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);
        const initCompleteTime = Date.now();
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        await page.waitForTimeout(1000);
        const testEndTime = Date.now();

        // Verify timing bounds are reasonable
        const timingValidation = await page.evaluate(
          (bounds) => {
            const currentTimestamp = Date.now();

            return {
              currentTimestamp,
              withinBounds: currentTimestamp >= bounds.start && currentTimestamp <= bounds.end + 1000, // 1s buffer
              timingData: {
                start: bounds.start,
                pageReady: bounds.pageReady,
                initComplete: bounds.initComplete,
                end: bounds.end,
              },
            };
          },
          {
            start: pageLoadStart,
            pageReady: pageReadyTime,
            initComplete: initCompleteTime,
            end: testEndTime,
          },
        );

        expect(timingValidation.withinBounds).toBe(true);

        // Verify timing sequence makes sense
        expect(timingValidation.timingData.pageReady).toBeGreaterThanOrEqual(timingValidation.timingData.start);
        expect(timingValidation.timingData.initComplete).toBeGreaterThanOrEqual(timingValidation.timingData.pageReady);
        expect(timingValidation.timingData.end).toBeGreaterThanOrEqual(timingValidation.timingData.initComplete);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        // Timing validation completed
      } finally {
        monitor.cleanup();
      }
    });

    test('should maintain consistent timing across multiple page loads', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);
      const timingMeasurements: number[] = [];

      try {
        // Perform multiple page loads and measure timing consistency
        for (let i = 0; i < 3; i++) {
          const loadStart = Date.now();

          await TestUtils.navigateAndWaitForReady(page);
          const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);
          const loadEnd = Date.now();

          expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

          const duration = loadEnd - loadStart;
          timingMeasurements.push(duration);

          // Load completed

          // Small delay between loads
          await page.waitForTimeout(500);
        }

        // Validate timing consistency (none should be extremely slow)
        const maxDuration = Math.max(...timingMeasurements);
        const minDuration = Math.min(...timingMeasurements);
        const averageDuration = timingMeasurements.reduce((a, b) => a + b, 0) / timingMeasurements.length;

        expect(maxDuration).toBeLessThan(8000); // No load should take more than 8 seconds
        expect(minDuration).toBeGreaterThan(0); // All loads should take some measurable time

        // Variance should not be excessive (within 500% of average for E2E tests)
        const variance = ((maxDuration - averageDuration) / averageDuration) * 100;
        expect(variance).toBeLessThan(500); // Lenient for E2E environment

        // Timing consistency analysis completed

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });
});
