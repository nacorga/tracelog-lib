import { test, expect } from '@playwright/test';
import { TestUtils } from '../../utils';
import { TEST_CONFIGS } from '../../constants';

test.describe('Scroll Tracking - Custom Container Scroll', () => {
  test.describe('Custom container tracking', () => {
    test('should track scroll events within configured custom containers', async ({ page }) => {
      const { monitor } = await TestUtils.setupCustomContainerTest(page, ['.scrollable-container']);

      try {
        const result = await TestUtils.testContainerScrollAndCapture(page, '.scrollable-container', 200);

        expect(result.success).toBe(true);
        expect(result.containerSelector).toBe('.scrollable-container');
        expect(result.scrollData).toBeDefined();
        expect(result.scrollData?.depth).toBeGreaterThan(0);
        expect(['up', 'down']).toContain(result.scrollData?.direction);
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle scroll events in containers with different CSS properties', async ({ page }) => {
      const containerSelectors = ['.vertical-scroll', '.horizontal-scroll', '.both-scroll'];
      const { monitor } = await TestUtils.setupCustomContainerTest(page, containerSelectors);

      try {
        const results = [];

        // Test vertical scroll container
        results.push(await TestUtils.testContainerScrollAndCapture(page, '.vertical-scroll', 150));

        // Test container with different scroll properties
        results.push(await TestUtils.testContainerScrollAndCapture(page, '.both-scroll', 100));

        for (const result of results) {
          expect(result.success).toBe(true);
          expect(result.scrollData).toBeDefined();
          expect(typeof result.scrollData?.depth).toBe('number');
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should not track scroll events in non-scrollable containers', async ({ page }) => {
      const { monitor } = await TestUtils.setupCustomContainerTest(page, ['.non-scrollable'], false);

      try {
        const result = await TestUtils.testContainerScrollAndCapture(page, '.non-scrollable', 50);

        // Should not generate scroll events for non-scrollable containers
        expect(result.success).toBe(false);
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Container selector configuration', () => {
    test('should correctly match single CSS selector', async ({ page }) => {
      const selector = '#main-content';
      const { monitor } = await TestUtils.setupCustomContainerTest(page, [selector]);

      try {
        const result = await TestUtils.validateContainerSelection(page, selector);

        expect(result.found).toBe(true);
        expect(result.isScrollable).toBe(true);
        expect(result.selector).toBe(selector);
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle multiple CSS selectors correctly', async ({ page }) => {
      const selectors = ['.sidebar', '.content-area', '#footer-scroll'];
      const { monitor } = await TestUtils.setupCustomContainerTest(page, selectors);

      try {
        const results = await TestUtils.validateMultipleContainerSelection(page, selectors);

        expect(results.length).toBe(selectors.length);
        expect(results.every((r) => r.found)).toBe(true);
        expect(results.some((r) => r.isScrollable)).toBe(true);
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should fall back to window when no valid containers found', async ({ page }) => {
      const invalidSelectors = ['.non-existent', '.also-missing'];
      const { monitor } = await TestUtils.setupCustomContainerTest(page, invalidSelectors, false);

      try {
        const result = await TestUtils.testWindowScrollFallback(page);

        expect(result.usesWindowFallback).toBe(true);
        expect(result.scrollEventGenerated).toBe(true);
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle invalid CSS selectors gracefully', async ({ page }) => {
      const invalidSelectors = ['>>invalid<<', ':not()', '[unclosed'];
      const { monitor } = await TestUtils.setupCustomContainerTest(page, invalidSelectors, false);

      try {
        // Test that TraceLog initialization succeeds with invalid selectors (they are ignored)
        const initResult = await TestUtils.initializeTraceLog(page, {
          id: TEST_CONFIGS.DEFAULT.id,
          scrollContainerSelectors: invalidSelectors,
        });

        // The initialization should succeed (invalid selectors are ignored gracefully)
        expect(initResult.success).toBe(true);
        expect(initResult.error).toBeNull();

        // The fact that initialization succeeded with warnings logged demonstrates that
        // invalid CSS selectors are handled gracefully - they are ignored and the system
        // falls back to window scrolling behavior
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Multiple container tracking', () => {
    test('should track scroll events in multiple containers simultaneously', async ({ page }) => {
      const containers = ['.container-one', '.container-two', '.container-three'];
      const { monitor } = await TestUtils.setupCustomContainerTest(page, containers);

      try {
        const result = await TestUtils.testMultipleContainerScrolling(page, containers);

        expect(result.totalEvents).toBeGreaterThan(0);
        expect(result.containerResults.length).toBe(containers.length);
        expect(result.containerResults.every((c) => c.scrollDetected)).toBe(true);
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should maintain separate scroll states for each container', async ({ page }) => {
      const containers = ['.independent-one', '.independent-two'];
      const { monitor } = await TestUtils.setupCustomContainerTest(page, containers);

      try {
        const result = await TestUtils.testIndependentContainerScrollStates(page, containers);

        expect(result.container1Events).toBeGreaterThan(0);
        expect(result.container2Events).toBeGreaterThan(0);
        expect(result.statesIndependent).toBe(true);
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle containers with different scroll heights', async ({ page }) => {
      const containers = ['.short-container', '.medium-container', '.tall-container'];
      const { monitor } = await TestUtils.setupCustomContainerTest(page, containers);

      try {
        const result = await TestUtils.testContainersWithVariedHeights(page, containers);

        expect(result.results.length).toBe(containers.length);
        expect(result.results.every((r) => r.depthCalculated)).toBe(true);
        expect(result.results.some((r) => r.maxDepth > 50)).toBe(true); // At least one should be scrollable
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Container-specific calculations', () => {
    test('should calculate correct scroll depth for container elements', async ({ page }) => {
      const { monitor } = await TestUtils.setupCustomContainerTest(page, ['.depth-test-container']);

      try {
        const testCases: Array<{
          scrollTo: number | string;
          expectedDepth?: number;
          expectedRange?: [number, number];
        }> = [
          { scrollTo: 0, expectedDepth: 0 },
          { scrollTo: 'middle', expectedRange: [45, 55] as [number, number] },
          { scrollTo: 'bottom', expectedRange: [95, 100] as [number, number] },
        ];

        const results = await TestUtils.testContainerScrollDepthCalculations(page, '.depth-test-container', testCases);

        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          const testCase = testCases[i];

          if (typeof testCase.expectedDepth === 'number') {
            expect(result.depth).toBe(testCase.expectedDepth);
          } else if (testCase.expectedRange) {
            expect(result.depth).toBeGreaterThanOrEqual(testCase.expectedRange[0]);
            expect(result.depth).toBeLessThanOrEqual(testCase.expectedRange[1]);
          }
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should ensure depth never exceeds bounds for containers', async ({ page }) => {
      const { monitor } = await TestUtils.setupCustomContainerTest(page, ['.bounds-test-container']);

      try {
        const result = await TestUtils.testContainerScrollDepthBounds(page, '.bounds-test-container');

        expect(result.allDepthsValid).toBe(true);
        expect(result.minDepth).toBeGreaterThanOrEqual(0);
        expect(result.maxDepth).toBeLessThanOrEqual(100);
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should calculate container-relative positions correctly', async ({ page }) => {
      const { monitor } = await TestUtils.setupCustomContainerTest(page, ['.position-test-container']);

      try {
        const result = await TestUtils.testContainerPositionCalculations(page, '.position-test-container');

        expect(result.positionsAccurate).toBe(true);
        expect(result.relativeToContainer).toBe(true);
        expect(result.notRelativeToWindow).toBe(true);
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Scroll direction tracking within containers', () => {
    test('should correctly detect downward scroll in containers', async ({ page }) => {
      const { monitor } = await TestUtils.setupCustomContainerTest(page, ['.direction-test-container']);

      try {
        const result = await TestUtils.testContainerScrollDirection(page, '.direction-test-container', 0, 200);

        expect(result.success).toBe(true);
        expect(result.direction).toBe('down');
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should correctly detect upward scroll in containers', async ({ page }) => {
      const { monitor } = await TestUtils.setupCustomContainerTest(page, ['.direction-test-container']);

      try {
        const result = await TestUtils.testContainerScrollDirection(page, '.direction-test-container', 300, 100);

        expect(result.success).toBe(true);
        expect(result.direction).toBe('up');
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle direction changes within containers', async ({ page }) => {
      const { monitor } = await TestUtils.setupCustomContainerTest(page, ['.direction-change-container']);

      try {
        const scrollSequence = [0, 200, 50, 300];
        const result = await TestUtils.testContainerScrollDirectionChanges(
          page,
          '.direction-change-container',
          scrollSequence,
        );

        expect(result.directions.length).toBeGreaterThan(0);
        expect(result.directions).toContain('down');
        expect(result.directions).toContain('up');
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Container vs window differentiation', () => {
    test('should differentiate between container and window scroll events', async ({ page }) => {
      const { monitor } = await TestUtils.setupCustomContainerTest(page, ['.differentiation-container']);

      try {
        const result = await TestUtils.testContainerVsWindowScrollDifferentiation(page, '.differentiation-container');

        expect(result.containerEventsDetected).toBe(true);
        // When container is configured, window scroll should not be tracked
        expect(result.windowEventsDetected).toBe(false);
        expect(result.eventsProperlyDifferentiated).toBe(true);
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should prioritize container scroll over window scroll when both occur', async ({ page }) => {
      const { monitor } = await TestUtils.setupCustomContainerTest(page, ['.priority-container']);

      try {
        const result = await TestUtils.testScrollEventPriority(page, '.priority-container');

        expect(result.containerEventsCaptured).toBeGreaterThan(0);
        expect(result.bothScrollTypesHandled).toBe(true);
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Dynamic container cleanup', () => {
    test('should properly clean up event listeners when containers are removed', async ({ page }) => {
      const { monitor } = await TestUtils.setupCustomContainerTest(page, ['.cleanup-container']);

      try {
        const result = await TestUtils.testDynamicContainerCleanup(page, '.cleanup-container');

        expect(result.initialSetupSuccessful).toBe(true);
        expect(result.containerRemoved).toBe(true);
        expect(result.listenersCleanedUp).toBe(true);
        expect(result.noMemoryLeaks).toBe(true);
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle container element changes during runtime', async ({ page }) => {
      const { monitor } = await TestUtils.setupCustomContainerTest(page, ['.runtime-change-container']);

      try {
        const result = await TestUtils.testRuntimeContainerChanges(page, '.runtime-change-container');

        expect(result.initialTrackingWorking).toBe(true);
        expect(result.handledElementChanges).toBe(true);
        expect(result.trackingContinuesAfterChanges).toBe(true);
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should prevent memory leaks from orphaned scroll handlers', async ({ page }) => {
      const { monitor } = await TestUtils.setupCustomContainerTest(page, ['.memory-test-container']);

      try {
        const result = await TestUtils.testScrollHandlerMemoryManagement(page);

        expect(result.noOrphanedHandlers).toBe(true);
        expect(result.properCleanupSequence).toBe(true);
        expect(result.memoryUsageStable).toBe(true);
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });
});
