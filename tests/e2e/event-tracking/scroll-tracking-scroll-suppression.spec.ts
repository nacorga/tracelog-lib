import { test, expect } from '@playwright/test';
import { TestUtils } from '../../utils';

test.describe('Scroll Tracking - Scroll Suppression', () => {
  test.describe('Basic scroll suppression after PAGE_VIEW events', () => {
    test('should suppress scroll events immediately after page navigation', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create a tall page to enable scrolling
        await page.evaluate(() => {
          const tallDiv = document.createElement('div');
          tallDiv.style.height = '3000px';
          tallDiv.style.background = 'linear-gradient(to bottom, #ff0000, #0000ff)';
          document.body.appendChild(tallDiv);
        });

        // Test scroll suppression immediately after PAGE_VIEW
        const result = await TestUtils.testScrollSuppressionAfterPageView(page);

        expect(result.pageViewTriggered).toBe(true);
        expect(result.scrollEventsSuppressed).toBe(true);
        expect(result.scrollEventsCount).toBe(0);
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should suppress multiple rapid scroll events after navigation', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create a tall page
        await page.evaluate(() => {
          const tallDiv = document.createElement('div');
          tallDiv.style.height = '5000px';
          tallDiv.style.background = 'repeating-linear-gradient(45deg, red, blue 100px)';
          document.body.appendChild(tallDiv);
        });

        // Test multiple rapid scrolls after page view
        const result = await TestUtils.testRapidScrollSuppressionAfterPageView(page, [100, 200, 300, 500, 800]);

        expect(result.pageViewTriggered).toBe(true);
        // With suppression + debouncing, we should have very few events (at most 1-2)
        expect(result.scrollEventsCount).toBeLessThanOrEqual(2);
        expect(result.scrollPositionsTested).toBe(5);
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should suppress scroll events triggered by browser during navigation', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        // Navigate to a page and scroll down first
        await TestUtils.navigateAndWaitForReady(page, '/');
        let initResult = await TestUtils.initializeTraceLog(page);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create tall page and scroll down
        await page.evaluate(() => {
          const tallDiv = document.createElement('div');
          tallDiv.style.height = '4000px';
          tallDiv.style.background = 'linear-gradient(to bottom, green, yellow)';
          document.body.appendChild(tallDiv);
        });

        // Wait for suppression to clear
        await page.waitForTimeout(600);

        // Scroll to a position
        await page.evaluate(() => window.scrollTo(0, 1000));
        await page.waitForTimeout(300);

        // Now navigate again (which might trigger browser-induced scroll)
        await TestUtils.navigateAndWaitForReady(page, '/');
        initResult = await TestUtils.initializeTraceLog(page);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Test that automatic browser scroll is suppressed
        const result = await TestUtils.testBrowserScrollSuppression(page);

        expect(result.navigationCompleted).toBe(true);
        expect(result.automaticScrollSuppressed).toBe(true);
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Suppression timeout behavior', () => {
    test('should have appropriate suppression timeout duration (500ms)', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create scrollable content
        await page.evaluate(() => {
          const tallDiv = document.createElement('div');
          tallDiv.style.height = '3000px';
          tallDiv.style.background = 'linear-gradient(to bottom, purple, orange)';
          document.body.appendChild(tallDiv);
        });

        // Test suppression timeout duration
        const result = await TestUtils.testScrollSuppressionTimeout(page);

        // Should be approximately 500ms + scroll processing time
        expect(result.suppressionDuration).toBeGreaterThanOrEqual(800);
        expect(result.suppressionDuration).toBeLessThanOrEqual(1000);
        expect(result.suppressionCleared).toBe(true);
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should clear suppression after timeout allowing legitimate scroll events', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create scrollable content
        await page.evaluate(() => {
          const tallDiv = document.createElement('div');
          tallDiv.style.height = '3000px';
          tallDiv.style.background = 'linear-gradient(to bottom, cyan, magenta)';
          document.body.appendChild(tallDiv);
        });

        // Test that scroll events work after suppression timeout
        const result = await TestUtils.testScrollEventsAfterSuppressionTimeout(page);

        expect(result.suppressionInitiallyActive).toBe(true);
        expect(result.scrollEventCapturedAfterTimeout).toBe(true);
        expect(result.scrollData).toBeDefined();
        expect(result.scrollData?.depth).toBeGreaterThan(0);
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should reset suppression timer on subsequent page views', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create scrollable content
        await page.evaluate(() => {
          const tallDiv = document.createElement('div');
          tallDiv.style.height = '3000px';
          tallDiv.style.background = 'repeating-linear-gradient(90deg, red, blue 50px)';
          document.body.appendChild(tallDiv);
        });

        // Test suppression timer reset behavior
        const result = await TestUtils.testSuppressionTimerReset(page);

        expect(result.firstSuppressionActivated).toBe(true);
        expect(result.secondSuppressionActivated).toBe(true);
        expect(result.timerReset).toBe(true);
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('User-initiated scroll events after suppression', () => {
    test('should capture legitimate user scroll events after suppression period', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Setup scrollable page
        await TestUtils.setupScrollTrackingTest(page, 3000);

        // Test user scroll after suppression
        const result = await TestUtils.testUserScrollAfterSuppression(page, 500);

        expect(result.suppressionRespected).toBe(true);
        expect(result.userScrollCaptured).toBe(true);
        expect(result.scrollData?.depth).toBeGreaterThan(0);
        expect(result.scrollData?.direction).toBe('down');
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle scroll direction changes properly after suppression', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Setup scrollable page
        await TestUtils.setupScrollTrackingTest(page, 4000);

        // Test scroll direction changes after suppression
        const result = await TestUtils.testScrollDirectionAfterSuppression(page, [800, 200, 1200]);

        expect(result.suppressionRespected).toBe(true);
        expect(result.directionsDetected.length).toBeGreaterThan(0);
        expect(result.directionsDetected).toContain('down');
        expect(result.directionsDetected).toContain('up');
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should maintain scroll depth accuracy after suppression period', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Setup scrollable page
        const { pageInfo } = await TestUtils.setupScrollTrackingTest(page, 2000);

        // Test scroll depth accuracy after suppression
        const testPositions = [
          { position: pageInfo.maxScrollTop * 0.25, expectedRange: [20, 30] as [number, number] },
          { position: pageInfo.maxScrollTop * 0.5, expectedRange: [45, 55] as [number, number] },
          { position: pageInfo.maxScrollTop * 0.75, expectedRange: [70, 80] as [number, number] },
          { position: pageInfo.maxScrollTop, expectedRange: [95, 100] as [number, number] },
        ];

        const result = await TestUtils.testScrollDepthAccuracyAfterSuppression(page, testPositions);

        expect(result.suppressionRespected).toBe(true);
        expect(result.allDepthsAccurate).toBe(true);
        expect(result.capturedEvents.length).toBe(testPositions.length);
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Rapid navigation suppression behavior', () => {
    test('should handle suppression during rapid page navigation', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        // Test rapid navigation with scroll suppression
        const result = await TestUtils.testRapidNavigationScrollSuppression(page, 3);

        expect(result.navigationsCompleted).toBe(3);
        expect(result.suppressionActivatedEachTime).toBe(true);
        expect(result.scrollEventsSuppressed).toBe(true);
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should maintain suppression consistency across multiple navigation events', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        // Test multiple navigations to ensure consistent suppression
        const result = await TestUtils.testMultipleNavigationSuppressionConsistency(page, 5);

        expect(result.totalNavigations).toBe(5);
        expect(result.suppressionConsistent).toBe(true);
        expect(result.allScrollEventsSuppressed).toBe(true);
        expect(result.noLeakedEvents).toBe(true);
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle navigation-induced scroll restoration suppression', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        // Test browser scroll restoration suppression
        const result = await TestUtils.testScrollRestorationSuppression(page);

        expect(result.scrollPositionChanged).toBe(true);
        expect(result.navigationCompleted).toBe(true);
        expect(result.restorationScrollSuppressed).toBe(true);
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Other event types during scroll suppression', () => {
    test('should not affect click events during scroll suppression', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Setup page with clickable element and scrollable content
        await page.evaluate(() => {
          const button = document.createElement('button');
          button.textContent = 'Click Me';
          button.id = 'test-button';
          button.style.cssText = 'padding: 10px; margin: 20px; position: fixed; top: 10px; left: 10px; z-index: 1000;';
          document.body.appendChild(button);

          const tallDiv = document.createElement('div');
          tallDiv.style.height = '3000px';
          tallDiv.style.background = 'linear-gradient(to bottom, lightblue, lightgreen)';
          document.body.appendChild(tallDiv);
        });

        // Test click events during scroll suppression
        const result = await TestUtils.testClickEventsDuringScrollSuppression(page, '#test-button');

        expect(result.suppressionActive).toBe(true);
        expect(result.clickEventCaptured).toBe(true);
        expect(result.scrollEventsSuppressed).toBe(true);
        expect(result.clickData).toBeDefined();
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should not affect custom events during scroll suppression', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Setup scrollable content
        await page.evaluate(() => {
          const tallDiv = document.createElement('div');
          tallDiv.style.height = '3000px';
          tallDiv.style.background = 'repeating-linear-gradient(45deg, yellow, pink 100px)';
          document.body.appendChild(tallDiv);
        });

        // Test custom events during scroll suppression
        const result = await TestUtils.testCustomEventsDuringScrollSuppression(page, 'test-action', { key: 'value' });

        expect(result.suppressionActive).toBe(true);
        expect(result.customEventCaptured).toBe(true);
        expect(result.scrollEventsSuppressed).toBe(true);
        expect(result.customEventData).toBeDefined();
        expect(result.customEventData.metadata.key).toBe('value');
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle performance events normally during scroll suppression', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Setup scrollable content
        await page.evaluate(() => {
          const tallDiv = document.createElement('div');
          tallDiv.style.height = '3000px';
          tallDiv.style.background = 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)';
          document.body.appendChild(tallDiv);
        });

        // Test that performance events work during scroll suppression
        const result = await TestUtils.testPerformanceEventsDuringScrollSuppression(page);

        expect(result.suppressionActive).toBe(true);
        expect(result.performanceEventsProcessed).toBe(true);
        expect(result.scrollEventsSuppressed).toBe(true);
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Suppression state management', () => {
    test('should properly reset suppression state after timeout', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Setup scrollable content
        await page.evaluate(() => {
          const tallDiv = document.createElement('div');
          tallDiv.style.height = '3000px';
          tallDiv.style.background = 'radial-gradient(circle, red, blue)';
          document.body.appendChild(tallDiv);
        });

        // Test suppression state reset
        const result = await TestUtils.testSuppressionStateReset(page);

        expect(result.initialSuppressionActive).toBe(true);
        expect(result.suppressionCleared).toBe(true);
        expect(result.scrollEventCapturedAfterReset).toBe(true);
        expect(result.stateResetProperly).toBe(true);
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle suppression during edge cases and cleanup', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Test edge cases and cleanup
        const result = await TestUtils.testSuppressionEdgeCasesAndCleanup(page);

        expect(result.suppressionHandledProperly).toBe(true);
        expect(result.cleanupExecuted).toBe(true);
        expect(result.noMemoryLeaks).toBe(true);
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should validate suppression flag state transitions', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Setup scrollable content
        await page.evaluate(() => {
          const tallDiv = document.createElement('div');
          tallDiv.style.height = '3000px';
          tallDiv.style.background = 'linear-gradient(45deg, orange, purple)';
          document.body.appendChild(tallDiv);
        });

        // Test suppression flag transitions
        const result = await TestUtils.testSuppressionFlagTransitions(page);

        expect(result.initialStateCorrect).toBe(true);
        expect(result.flagSetOnPageView).toBe(true);
        expect(result.flagClearedAfterTimeout).toBe(true);
        expect(result.transitionsValid).toBe(true);
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });
});
