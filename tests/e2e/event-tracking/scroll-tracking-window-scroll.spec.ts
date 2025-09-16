import { test, expect } from '@playwright/test';
import { TestUtils } from '../../utils';

test.describe('Scroll Tracking - Window Scroll', () => {
  test.describe('Scroll event triggering', () => {
    test('should trigger scroll events when window is scrolled', async ({ page }) => {
      const { monitor } = await TestUtils.setupScrollTrackingTest(page);

      try {
        // Test scroll with proper encapsulation
        const result = await TestUtils.testScrollToPositionAndCapture(page, 500);

        expect(result.success).toBe(true);
        expect(result.actualPosition).toBe(500);
        expect(result.scrollData).toBeDefined();
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle multiple rapid scroll events with proper debouncing', async ({ page }) => {
      const { monitor } = await TestUtils.setupScrollTrackingTest(page);

      try {
        // Create scroll positions (not functions)
        const scrollPositions = Array.from({ length: 10 }, (_, i) => (i + 1) * 50);

        const result = await TestUtils.countScrollEventsDuringRapidScroll(page, scrollPositions, 30);

        // Due to debouncing (250ms), we should have fewer events than scroll actions
        expect(result.eventCount).toBeLessThan(10);
        expect(result.eventCount).toBeGreaterThan(0);

        // Check timing between events (should be at least ~250ms apart)
        if (result.eventTimes.length > 1) {
          for (let i = 1; i < result.eventTimes.length; i++) {
            const timeDiff = result.eventTimes[i] - result.eventTimes[i - 1];
            expect(timeDiff).toBeGreaterThanOrEqual(200);
          }
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should only trigger events for significant scroll distances', async ({ page }) => {
      const { monitor } = await TestUtils.setupScrollTrackingTest(page);

      try {
        // Test small scroll (< SIGNIFICANT_SCROLL_DELTA = 10px)
        let result = await TestUtils.testScrollToPositionAndCapture(page, 5);
        expect(result.success).toBe(false); // Should not trigger for small scroll

        // Test significant scroll (> SIGNIFICANT_SCROLL_DELTA = 10px)
        result = await TestUtils.testScrollToPositionAndCapture(page, 50);
        expect(result.success).toBe(true); // Should trigger for significant scroll

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Scroll depth calculation', () => {
    test('should calculate correct scroll depth at page top (0%)', async ({ page }) => {
      const { monitor } = await TestUtils.setupScrollTrackingTest(page);

      try {
        // Start from middle and scroll to top to ensure movement
        await page.evaluate(() => window.scrollTo(0, 1000));
        await page.waitForTimeout(350);

        const result = await TestUtils.testScrollToPositionAndCapture(page, 0);

        expect(result.success).toBe(true);
        expect(result.scrollData?.depth).toBe(0);
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should calculate correct scroll depth at page bottom (100%)', async ({ page }) => {
      const { monitor, pageInfo } = await TestUtils.setupScrollTrackingTest(page, 2000);

      try {
        const bottomPosition = pageInfo.maxScrollTop;
        const result = await TestUtils.testScrollToPositionAndCapture(page, bottomPosition);

        expect(result.success).toBe(true);
        // Allow small tolerance for browser differences (Firefox might return 99%)
        expect(result.scrollData?.depth).toBeGreaterThanOrEqual(99);
        expect(result.scrollData?.depth).toBeLessThanOrEqual(100);
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should calculate correct scroll depth at middle positions', async ({ page }) => {
      const { monitor, pageInfo } = await TestUtils.setupScrollTrackingTest(page);

      try {
        const midPosition = Math.floor(pageInfo.maxScrollTop / 2);
        const result = await TestUtils.testScrollToPositionAndCapture(page, midPosition);

        expect(result.success).toBe(true);
        expect(result.scrollData?.depth).toBeGreaterThanOrEqual(45);
        expect(result.scrollData?.depth).toBeLessThanOrEqual(55);
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Scroll position tracking', () => {
    test('should track vertical scroll position accurately', async ({ page }) => {
      const { monitor } = await TestUtils.setupScrollTrackingTest(page);

      try {
        // Test various scroll positions
        const testPositions = [100, 500, 1000, 1500];
        const results = await TestUtils.testMultipleScrollPositions(page, testPositions);

        for (const result of results) {
          expect(result.actualPosition).toBe(result.position);
          expect(result.scrollData).toBeDefined();
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle scroll position at page boundaries correctly', async ({ page }) => {
      const { monitor } = await TestUtils.setupNonScrollablePageTest(page);

      try {
        // Try to scroll - should not trigger event for non-scrollable page (no actual movement)
        const result = await TestUtils.testScrollToPositionAndCapture(page, 100);

        // Non-scrollable page should not trigger scroll events
        expect(result.success).toBe(false);
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Scroll percentage calculations', () => {
    test('should calculate percentage correctly for various page heights', async ({ page }) => {
      const testCases = [
        { height: 2000, scrollTo: 0, expectedDepth: 0 },
        { height: 2000, scrollTo: 500, expectedRange: [20, 40] as [number, number] }, // Around 25-35%
        { height: 4000, scrollTo: 1000, expectedRange: [20, 40] as [number, number] }, // Around 25-35%
        { height: 1000, scrollTo: 300, expectedRange: [60, 90] as [number, number] }, // Around 70-85% (Mobile Safari can be lower ~62%)
      ];

      const results = await TestUtils.testScrollPercentageCalculations(page, testCases);

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const testCase = testCases[i];

        if (testCase.expectedDepth !== undefined) {
          expect(result.scrollDepth).toBe(testCase.expectedDepth);
        } else if (testCase.expectedRange) {
          expect(result.scrollDepth).toBeGreaterThanOrEqual(testCase.expectedRange[0]);
          expect(result.scrollDepth).toBeLessThanOrEqual(testCase.expectedRange[1]);
        }
      }
    });

    test('should ensure percentage never exceeds 100% or goes below 0%', async ({ page }) => {
      // Test various scroll positions including edge cases
      const positions = [0, 100, 1000, 2000, 3000, 4000];
      const result = await TestUtils.testScrollDepthBounds(page, positions);

      try {
        // Verify all depths are within valid range
        expect(result.allWithinBounds).toBe(true);
        expect(result.capturedDepths.length).toBeGreaterThan(0);

        // Individual verification for clarity
        for (const depth of result.capturedDepths) {
          expect(depth).toBeGreaterThanOrEqual(0);
          expect(depth).toBeLessThanOrEqual(100);
        }

        expect(TestUtils.verifyNoTraceLogErrors(result.monitor.traceLogErrors)).toBe(true);
      } finally {
        result.monitor.cleanup();
      }
    });
  });

  test.describe('Scroll direction detection', () => {
    test('should correctly detect downward scroll direction', async ({ page }) => {
      const result = await TestUtils.testScrollDirection(page, 0, 500);

      try {
        expect(result.success).toBe(true);
        expect(result.direction).toBe('down');
        expect(TestUtils.verifyNoTraceLogErrors(result.monitor.traceLogErrors)).toBe(true);
      } finally {
        result.monitor.cleanup();
      }
    });

    test('should correctly detect upward scroll direction', async ({ page }) => {
      const result = await TestUtils.testScrollDirection(page, 1000, 200);

      try {
        expect(result.success).toBe(true);
        expect(result.direction).toBe('up');
        expect(TestUtils.verifyNoTraceLogErrors(result.monitor.traceLogErrors)).toBe(true);
      } finally {
        result.monitor.cleanup();
      }
    });

    test('should handle direction changes correctly', async ({ page }) => {
      // Perform sequence: start at 0, down to 800, up to 200, down to 1200
      const scrollSequence = [0, 800, 200, 1200];
      const result = await TestUtils.testScrollDirectionChanges(page, scrollSequence);

      try {
        expect(result.directions.length).toBeGreaterThan(0);
        expect(result.directions).toContain('down');
        expect(result.directions).toContain('up');
        expect(TestUtils.verifyNoTraceLogErrors(result.monitor.traceLogErrors)).toBe(true);
      } finally {
        result.monitor.cleanup();
      }
    });
  });

  test.describe('Scroll event throttling', () => {
    test('should respect debounce timing of 250ms', async ({ page }) => {
      const scrollPositions = [100, 200, 300, 400, 500];
      const result = await TestUtils.testScrollEventThrottling(page, scrollPositions, 50);

      try {
        // Due to 250ms debouncing, we should have fewer events than scroll actions
        expect(result.eventCount).toBeLessThan(5);
        expect(result.eventCount).toBeGreaterThan(0);

        // Check timing between events (should be at least ~250ms apart)
        if (result.eventTimes.length > 1) {
          for (let i = 1; i < result.eventTimes.length; i++) {
            const timeDiff = result.eventTimes[i] - result.eventTimes[i - 1];
            expect(timeDiff).toBeGreaterThanOrEqual(200); // Allow some tolerance
          }
        }

        expect(TestUtils.verifyNoTraceLogErrors(result.monitor.traceLogErrors)).toBe(true);
      } finally {
        result.monitor.cleanup();
      }
    });

    test('should include proper timing information in events', async ({ page }) => {
      const result = await TestUtils.testScrollEventDataStructure(page, 500);

      try {
        expect(result.success).toBe(true);
        expect(result.eventData).toBeDefined();
        expect(result.eventData.type).toBe('scroll');
        expect(result.eventData.scroll_data).toBeDefined();
        expect(result.eventData.scroll_data.depth).toBeDefined();
        expect(result.eventData.scroll_data.direction).toBeDefined();

        // Validate scroll data structure
        expect(result.eventData.scroll_data?.depth).toBeDefined();
        expect(typeof result.eventData.scroll_data.depth).toBe('number');
        expect(['up', 'down']).toContain(result.eventData.scroll_data.direction);
        expect(result.eventData.scroll_data.depth).toBeGreaterThanOrEqual(0);
        expect(result.eventData.scroll_data.depth).toBeLessThanOrEqual(100);

        expect(TestUtils.verifyNoTraceLogErrors(result.monitor.traceLogErrors)).toBe(true);
      } finally {
        result.monitor.cleanup();
      }
    });

    test('should prevent excessive events during continuous scrolling', async ({ page }) => {
      // Simulate continuous scrolling over 2 seconds
      const scrollDuration = 2000;
      const scrollInterval = 25; // Every 25ms
      const result = await TestUtils.testContinuousScrollingEventPrevention(page, scrollDuration, scrollInterval);

      try {
        // Should have significantly fewer events than scroll actions due to throttling
        expect(result.eventCount).toBeLessThan(result.scrollSteps / 2);
        expect(result.eventCount).toBeGreaterThan(0);

        // Should be reasonable number for 2 seconds of scrolling (considering 250ms debounce)
        expect(result.eventCount).toBeLessThan(15); // At most ~8-10 events expected

        expect(TestUtils.verifyNoTraceLogErrors(result.monitor.traceLogErrors)).toBe(true);
      } finally {
        result.monitor.cleanup();
      }
    });
  });
});
