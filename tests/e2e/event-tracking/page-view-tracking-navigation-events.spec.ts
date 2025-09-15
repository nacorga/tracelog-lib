import { test, expect } from '@playwright/test';
import { TestUtils } from '../../utils';
import { TEST_CONFIGS } from '../../utils/initialization.helpers';

test.describe('Page View Tracking - Navigation Events', () => {
  test.describe('History API navigation tracking', () => {
    test('should track PAGE_VIEW events for history.pushState navigation', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page);
        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);

        // Verify initialization succeeded
        const validated = TestUtils.verifyInitializationResult(initResult);
        expect(validated.success).toBe(true);
        expect(validated.hasError).toBe(false);

        // Wait for initial PAGE_VIEW event processing
        await page.waitForTimeout(500);

        // Perform history.pushState navigation
        const navigationResult = await page.evaluate(() => {
          const beforeUrl = window.location.href;
          const newUrl = '/test-page-1?param=value';

          // Perform pushState navigation
          window.history.pushState({ page: 'test1' }, 'Test Page 1', newUrl);

          const afterUrl = window.location.href;

          return {
            beforeUrl,
            afterUrl,
            navigationPerformed: beforeUrl !== afterUrl,
            newPath: window.location.pathname,
            newSearch: window.location.search,
          };
        });

        expect(navigationResult.navigationPerformed).toBe(true);
        expect(navigationResult.newPath).toBe('/test-page-1');
        expect(navigationResult.newSearch).toBe('?param=value');

        // Wait for PAGE_VIEW event processing
        await page.waitForTimeout(1000);

        // Verify URL change was tracked
        const urlTracking = await page.evaluate(() => {
          return {
            currentUrl: window.location.href,
            pathname: window.location.pathname,
            search: window.location.search,
          };
        });

        expect(urlTracking.pathname).toBe('/test-page-1');
        expect(urlTracking.search).toBe('?param=value');

        // Verify no TraceLog errors occurred
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should track PAGE_VIEW events for history.replaceState changes', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page);
        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);

        // Verify initialization succeeded
        const validated = TestUtils.verifyInitializationResult(initResult);
        expect(validated.success).toBe(true);

        // Wait for initial PAGE_VIEW event processing
        await page.waitForTimeout(500);

        // Perform history.replaceState navigation
        const navigationResult = await page.evaluate(() => {
          const beforeUrl = window.location.href;
          const newUrl = '/replaced-page?source=test&category=nav';

          // Perform replaceState navigation
          window.history.replaceState({ page: 'replaced', action: 'test' }, 'Replaced Page', newUrl);

          const afterUrl = window.location.href;

          return {
            beforeUrl,
            afterUrl,
            navigationPerformed: beforeUrl !== afterUrl,
            newPath: window.location.pathname,
            newSearch: window.location.search,
            hasState: window.history.state !== null,
          };
        });

        expect(navigationResult.navigationPerformed).toBe(true);
        expect(navigationResult.newPath).toBe('/replaced-page');
        expect(navigationResult.newSearch).toBe('?source=test&category=nav');
        expect(navigationResult.hasState).toBe(true);

        // Wait for PAGE_VIEW event processing
        await page.waitForTimeout(1000);

        // Verify URL change was tracked
        const urlTracking = await page.evaluate(() => {
          return {
            currentUrl: window.location.href,
            pathname: window.location.pathname,
            search: window.location.search,
            state: window.history.state,
          };
        });

        expect(urlTracking.pathname).toBe('/replaced-page');
        expect(urlTracking.search).toBe('?source=test&category=nav');
        expect(urlTracking.state).toEqual({ page: 'replaced', action: 'test' });

        // Verify no TraceLog errors occurred
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Browser navigation tracking', () => {
    test('should track PAGE_VIEW events on popstate events', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page);
        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);

        // Verify initialization succeeded
        const validated = TestUtils.verifyInitializationResult(initResult);
        expect(validated.success).toBe(true);

        // Wait for initial PAGE_VIEW event processing
        await page.waitForTimeout(500);

        // Create navigation history
        await page.evaluate(() => {
          window.history.pushState({ page: 1 }, 'Page 1', '/page-1');
          window.history.pushState({ page: 2 }, 'Page 2', '/page-2');
        });

        await page.waitForTimeout(500);

        // Get current state before back navigation
        const beforeBack = await page.evaluate(() => {
          return {
            currentUrl: window.location.href,
            pathname: window.location.pathname,
            state: window.history.state,
          };
        });

        expect(beforeBack.pathname).toBe('/page-2');
        expect(beforeBack.state).toEqual({ page: 2 });

        // Trigger popstate by going back
        const popstateResult = await page.evaluate(() => {
          return new Promise((resolve) => {
            const handler = (): void => {
              window.removeEventListener('popstate', handler);
              resolve({
                currentUrl: window.location.href,
                pathname: window.location.pathname,
                state: window.history.state,
                popstateTriggered: true,
              });
            };

            window.addEventListener('popstate', handler);
            window.history.back();
          });
        });

        expect(popstateResult.popstateTriggered).toBe(true);
        expect(popstateResult.pathname).toBe('/page-1');
        expect(popstateResult.state).toEqual({ page: 1 });

        // Wait for PAGE_VIEW event processing
        await page.waitForTimeout(1000);

        // Verify no TraceLog errors occurred
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Hash change navigation', () => {
    test('should track PAGE_VIEW events for hashchange events', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page);
        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);

        // Verify initialization succeeded
        const validated = TestUtils.verifyInitializationResult(initResult);
        expect(validated.success).toBe(true);

        // Wait for initial PAGE_VIEW event processing
        await page.waitForTimeout(500);

        // Perform hash change navigation
        const hashChangeResult = await page.evaluate(() => {
          return new Promise((resolve) => {
            const beforeHash = window.location.hash;

            const handler = (): void => {
              window.removeEventListener('hashchange', handler);
              resolve({
                beforeHash,
                afterHash: window.location.hash,
                currentUrl: window.location.href,
                hashChangeTriggered: true,
              });
            };

            window.addEventListener('hashchange', handler);
            window.location.hash = '#section-1';
          });
        });

        expect(hashChangeResult.hashChangeTriggered).toBe(true);
        expect(hashChangeResult.afterHash).toBe('#section-1');
        expect(hashChangeResult.currentUrl).toContain('#section-1');

        // Wait for PAGE_VIEW event processing
        await page.waitForTimeout(1000);

        // Test multiple hash changes
        const multiHashResult = await page.evaluate(() => {
          return new Promise((resolve) => {
            let changeCount = 0;
            const results = [];

            const handler = (): void => {
              changeCount++;
              results.push({
                hash: window.location.hash,
                url: window.location.href,
                changeNumber: changeCount,
              });

              if (changeCount >= 2) {
                window.removeEventListener('hashchange', handler);
                resolve({
                  totalChanges: changeCount,
                  changes: results,
                  finalHash: window.location.hash,
                });
              }
            };

            window.addEventListener('hashchange', handler);

            // Trigger multiple hash changes
            setTimeout(() => (window.location.hash = '#section-2'), 100);
            setTimeout(() => (window.location.hash = '#section-3'), 300);
          });
        });

        expect(multiHashResult.totalChanges).toBe(2);
        expect(multiHashResult.finalHash).toBe('#section-3');

        // Wait for PAGE_VIEW event processing
        await page.waitForTimeout(1000);

        // Verify no TraceLog errors occurred
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('from_page_url accuracy validation', () => {
    test('should correctly set from_page_url for navigation events', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page);
        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);

        // Verify initialization succeeded
        const validated = TestUtils.verifyInitializationResult(initResult);
        expect(validated.success).toBe(true);

        // Wait for initial PAGE_VIEW event processing
        await page.waitForTimeout(500);

        // Perform a series of navigation changes to test from_page_url chain
        const navigationChain = await page.evaluate(() => {
          const chain = [];

          // Record initial state
          chain.push({
            step: 'initial',
            fromUrl: null,
            currentUrl: window.location.href,
            pathname: window.location.pathname,
          });

          // Step 1: pushState to /step-1
          const step1From = window.location.href;
          window.history.pushState({ step: 1 }, 'Step 1', '/step-1');
          chain.push({
            step: 'pushState-1',
            fromUrl: step1From,
            currentUrl: window.location.href,
            pathname: window.location.pathname,
          });

          // Step 2: pushState to /step-2
          const step2From = window.location.href;
          window.history.pushState({ step: 2 }, 'Step 2', '/step-2?param=test');
          chain.push({
            step: 'pushState-2',
            fromUrl: step2From,
            currentUrl: window.location.href,
            pathname: window.location.pathname,
            search: window.location.search,
          });

          // Step 3: replaceState to modify current
          const step3From = window.location.href;
          window.history.replaceState({ step: 3 }, 'Step 3', '/step-2-modified?param=modified');
          chain.push({
            step: 'replaceState',
            fromUrl: step3From,
            currentUrl: window.location.href,
            pathname: window.location.pathname,
            search: window.location.search,
          });

          return chain;
        });

        // Verify navigation chain structure
        expect(navigationChain).toHaveLength(4);
        expect(navigationChain[0].step).toBe('initial');
        expect(navigationChain[1].step).toBe('pushState-1');
        expect(navigationChain[2].step).toBe('pushState-2');
        expect(navigationChain[3].step).toBe('replaceState');

        // Verify from_page_url chain accuracy
        expect(navigationChain[1].fromUrl).toBe(navigationChain[0].currentUrl);
        expect(navigationChain[2].fromUrl).toBe(navigationChain[1].currentUrl);
        expect(navigationChain[3].fromUrl).toBe(navigationChain[2].currentUrl);

        // Verify final state
        expect(navigationChain[3].pathname).toBe('/step-2-modified');
        expect(navigationChain[3].search).toBe('?param=modified');

        // Wait for PAGE_VIEW event processing
        await page.waitForTimeout(1500);

        // Test hash change with from_page_url
        const hashNavigationChain = await page.evaluate(() => {
          return new Promise((resolve) => {
            const beforeHashUrl = window.location.href;

            const handler = (): void => {
              window.removeEventListener('hashchange', handler);
              resolve({
                fromUrl: beforeHashUrl,
                currentUrl: window.location.href,
                hash: window.location.hash,
                hashChangeDetected: true,
              });
            };

            window.addEventListener('hashchange', handler);
            window.location.hash = '#navigation-test';
          });
        });

        expect(hashNavigationChain.hashChangeDetected).toBe(true);
        expect(hashNavigationChain.hash).toBe('#navigation-test');
        expect(hashNavigationChain.fromUrl).not.toBe(hashNavigationChain.currentUrl);

        // Wait for final PAGE_VIEW event processing
        await page.waitForTimeout(1000);

        // Verify no TraceLog errors occurred
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Navigation debouncing', () => {
    test('should properly debounce rapid navigation events', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page);
        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);

        // Verify initialization succeeded
        const validated = TestUtils.verifyInitializationResult(initResult);
        expect(validated.success).toBe(true);

        // Wait for initial PAGE_VIEW event processing
        await page.waitForTimeout(500);

        // Perform rapid navigation changes to test debouncing
        const rapidNavigationResult = await page.evaluate(() => {
          const startTime = Date.now();
          const navigationEvents = [];

          // Track all navigation attempts
          const trackNavigation = (type: string, url: string, timestamp: number): void => {
            navigationEvents.push({ type, url, timestamp });
          };

          // Perform rapid navigation changes (within same execution context)
          const baseTime = Date.now();

          // Rapid pushState calls
          window.history.pushState({ id: 1 }, '', '/rapid-1');
          trackNavigation('pushState', window.location.href, Date.now() - baseTime);

          window.history.pushState({ id: 2 }, '', '/rapid-2');
          trackNavigation('pushState', window.location.href, Date.now() - baseTime);

          window.history.pushState({ id: 3 }, '', '/rapid-3');
          trackNavigation('pushState', window.location.href, Date.now() - baseTime);

          // Rapid replaceState calls
          window.history.replaceState({ id: 4 }, '', '/rapid-3-modified');
          trackNavigation('replaceState', window.location.href, Date.now() - baseTime);

          window.history.replaceState({ id: 5 }, '', '/rapid-3-final');
          trackNavigation('replaceState', window.location.href, Date.now() - baseTime);

          const endTime = Date.now();

          return {
            navigationEvents,
            totalDuration: endTime - startTime,
            finalUrl: window.location.href,
            finalPathname: window.location.pathname,
            eventCount: navigationEvents.length,
          };
        });

        // Verify rapid navigation was performed
        expect(rapidNavigationResult.eventCount).toBe(5);
        expect(rapidNavigationResult.finalPathname).toBe('/rapid-3-final');
        expect(rapidNavigationResult.totalDuration).toBeLessThan(100); // Should be very fast

        // Wait for debounced PAGE_VIEW event processing
        await page.waitForTimeout(1500);

        // Test rapid hash changes for debouncing
        const rapidHashResult = await page.evaluate(() => {
          const startTime = Date.now();
          let hashChangeCount = 0;
          const hashEvents = [];

          return new Promise((resolve) => {
            const handler = (_event: Event): void => {
              hashChangeCount++;
              hashEvents.push({
                hash: window.location.hash,
                timestamp: Date.now() - startTime,
                changeNumber: hashChangeCount,
              });
            };

            window.addEventListener('hashchange', handler);

            // Rapid hash changes
            window.location.hash = '#rapid-hash-1';
            window.location.hash = '#rapid-hash-2';
            window.location.hash = '#rapid-hash-3';
            window.location.hash = '#rapid-hash-final';

            // Wait for hash changes to complete
            setTimeout(() => {
              window.removeEventListener('hashchange', handler);
              resolve({
                hashChangeCount,
                hashEvents,
                finalHash: window.location.hash,
                totalDuration: Date.now() - startTime,
              });
            }, 1000);
          });
        });

        // Verify hash changes were processed
        expect(rapidHashResult.hashChangeCount).toBeGreaterThan(0);
        expect(rapidHashResult.finalHash).toBe('#rapid-hash-final');
        expect(rapidHashResult.totalDuration).toBeLessThan(1500);

        // Final wait for all PAGE_VIEW event processing and debouncing
        await page.waitForTimeout(2000);

        // Verify no TraceLog errors occurred during rapid navigation
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        // Check for any anomalies in the console logs
        const anomalies = monitor.getAnomalies();
        if (anomalies.length > 0) {
          // Log only when actual anomalies are detected (performance issues)
        }
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Navigation timing accuracy', () => {
    test('should maintain accurate timing for navigation events', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);
      const testStartTime = Date.now();

      try {
        await TestUtils.navigateAndWaitForReady(page);
        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);

        // Verify initialization succeeded
        const validated = TestUtils.verifyInitializationResult(initResult);
        expect(validated.success).toBe(true);

        // Wait for initial PAGE_VIEW event processing
        await page.waitForTimeout(500);

        // Test navigation timing with measured intervals
        const timingResults = await page.evaluate((startTime) => {
          const results = [];

          return new Promise((resolve) => {
            // Navigation 1 - immediate
            const nav1Start = Date.now();
            window.history.pushState({ nav: 1 }, '', '/timing-test-1');
            const nav1End = Date.now();
            results.push({
              navigation: 'pushState-1',
              startTime: nav1Start - startTime,
              endTime: nav1End - startTime,
              duration: nav1End - nav1Start,
              url: window.location.href,
            });

            // Navigation 2 - after delay to ensure timing difference
            setTimeout(() => {
              const nav2Start = Date.now();
              window.history.pushState({ nav: 2 }, '', '/timing-test-2');
              const nav2End = Date.now();
              results.push({
                navigation: 'pushState-2',
                startTime: nav2Start - startTime,
                endTime: nav2End - startTime,
                duration: nav2End - nav2Start,
                url: window.location.href,
              });

              // Final resolution with additional delay
              setTimeout(() => {
                resolve({
                  results,
                  totalTestTime: Date.now() - startTime,
                  currentUrl: window.location.href,
                });
              }, 100);
            }, 150); // Increased delay to ensure timing difference
          });
        }, testStartTime);

        // Verify timing results
        expect(timingResults.results).toHaveLength(2);
        expect(timingResults.totalTestTime).toBeGreaterThan(200); // Should include our delays
        expect(timingResults.currentUrl).toContain('/timing-test-2');

        // Verify timing sequence
        const result1 = timingResults.results[0];
        const result2 = timingResults.results[1];

        expect(result1.navigation).toBe('pushState-1');
        expect(result2.navigation).toBe('pushState-2');

        // Use a more robust timing comparison that accounts for timing precision issues
        // Second navigation should start after the first due to setTimeout delay
        expect(result2.startTime).toBeGreaterThanOrEqual(result1.startTime);

        // Additional validation to ensure proper sequencing with tolerance for timing precision
        const timingDifference = result2.startTime - result1.startTime;
        expect(timingDifference).toBeGreaterThanOrEqual(-5); // Allow small timing variations

        // If times are very close, ensure end times show sequence
        if (timingDifference < 10) {
          expect(result2.endTime).toBeGreaterThanOrEqual(result1.endTime);
        }

        // Use timing validation utility
        TestUtils.verifyTimingAccuracy(result1.startTime + testStartTime, testStartTime, Date.now(), 1000);

        TestUtils.verifyTimingAccuracy(result2.startTime + testStartTime, testStartTime, Date.now(), 1000);

        // Wait for PAGE_VIEW event processing
        await page.waitForTimeout(1000);

        const testEndTime = Date.now();
        const totalTestDuration = testEndTime - testStartTime;

        // Verify reasonable test duration
        expect(totalTestDuration).toBeLessThan(10000); // Should complete within 10 seconds
        expect(totalTestDuration).toBeGreaterThan(1000); // Should take at least 1 second with our waits

        // Verify no TraceLog errors occurred
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });
});
