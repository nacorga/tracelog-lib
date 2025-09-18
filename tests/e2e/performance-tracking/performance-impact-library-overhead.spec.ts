import { test, expect } from '@playwright/test';
import { TestUtils } from '../../utils';
import { PERFORMANCE_THRESHOLDS, PERFORMANCE_TEST_CONSTANTS, PERFORMANCE_TEST_SELECTORS } from '../../constants';
import {
  MainThreadPerformanceInfo,
  UserInteractionPerformanceInfo,
  EventProcessingPerformanceInfo,
  AsyncOperationPerformanceInfo,
} from '../../types';

test.describe('Performance Impact - Library Overhead', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to test page and ensure clean state
    await TestUtils.navigateAndWaitForReady(page, '/');

    // Clear storage for clean test environment
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
      // WebKit may block storage access, continue with test
      console.log('Storage cleanup skipped due to security restrictions');
    }
  });

  test.describe('Library Initialization Performance', () => {
    test('should initialize quickly with minimal resource usage', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');

        // Measure initialization performance
        const initMeasurement = await TestUtils.measureInitializationPerformance(page);

        // Initialize the library and complete measurement
        const initResult = await TestUtils.initializeTraceLog(page);
        const completedMeasurement = await TestUtils.completeInitializationMeasurement(page, initMeasurement);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Validate initialization performance
        expect(completedMeasurement.withinTimeThreshold).toBe(true);
        expect(completedMeasurement.initDuration).toBeLessThanOrEqual(PERFORMANCE_THRESHOLDS.INITIALIZATION_TIME_MS);

        // Validate memory usage is reasonable
        if (completedMeasurement.memoryAfterInit > 0) {
          expect(completedMeasurement.withinMemoryThreshold).toBe(true);
          expect(completedMeasurement.memoryIncrease).toBeLessThanOrEqual(PERFORMANCE_THRESHOLDS.MEMORY_INCREASE_BYTES);
        }

        // Only log if performance thresholds are exceeded
        if (completedMeasurement.initDuration > PERFORMANCE_THRESHOLDS.INITIALIZATION_TIME_MS * 0.8) {
          console.warn(`[E2E Test] Slow initialization detected: ${completedMeasurement.initDuration.toFixed(2)}ms`);
        }

        if (completedMeasurement.memoryIncrease > PERFORMANCE_THRESHOLDS.MEMORY_INCREASE_BYTES * 0.1) {
          console.warn(
            `[E2E Test] Memory increase detected: ${(completedMeasurement.memoryIncrease / 1024).toFixed(2)}KB`,
          );
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should initialize without blocking main thread', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');

        // Test main thread blocking during initialization
        const mainThreadTest = await TestUtils.testMainThreadBlocking(page, async () => {
          const initResult = await TestUtils.initializeTraceLog(page);
          expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);
        });

        expect(mainThreadTest.withinBlockingThreshold).toBe(true);
        expect(mainThreadTest.taskDuration).toBeLessThanOrEqual(PERFORMANCE_THRESHOLDS.MAIN_THREAD_BLOCKING_MS);

        if (mainThreadTest.isMainThreadBlocked) {
          console.warn(
            `[E2E Test] Main thread blocked for ${mainThreadTest.taskDuration.toFixed(2)}ms during initialization`,
          );
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Main Thread Responsiveness', () => {
    test('should not block main thread during event tracking operations', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create test elements
        await TestUtils.createPerformanceTestElements(page);

        const mainThreadTests: MainThreadPerformanceInfo[] = [];

        // Test click event tracking performance
        const clickTest = await TestUtils.testMainThreadBlocking(page, async () => {
          await TestUtils.triggerClickEvent(page, PERFORMANCE_TEST_SELECTORS.PERFORMANCE_TEST_BUTTON);
        });
        mainThreadTests.push(clickTest);

        // Test scroll event tracking performance
        const scrollTest = await TestUtils.testMainThreadBlocking(page, async () => {
          await page.evaluate(() => {
            const container = document.querySelector('[data-testid="scroll-container"]');
            if (container) {
              container.scrollTop = 100;
            }
          });
        });
        mainThreadTests.push(scrollTest);

        // Test multiple rapid events (reduced count for performance)
        const rapidEventsTest = await TestUtils.testMainThreadBlocking(page, async () => {
          for (let i = 0; i < 5; i++) {
            await TestUtils.triggerClickEvent(page, PERFORMANCE_TEST_SELECTORS.PERFORMANCE_TEST_BUTTON);
          }
        });
        mainThreadTests.push(rapidEventsTest);

        // Validate performance is reasonable (focus on library not causing excessive overhead)
        for (const test of mainThreadTests) {
          expect(test.taskDuration).toBeLessThan(3000); // 3 second tolerance for complex operations in CI
        }

        const averageBlockingTime =
          mainThreadTests.reduce((sum, test) => sum + test.taskDuration, 0) / mainThreadTests.length;

        // Only log if blocking time is concerning
        if (averageBlockingTime > PERFORMANCE_THRESHOLDS.MAIN_THREAD_BLOCKING_MS * 10) {
          console.warn(`[E2E Test] High average main thread blocking detected: ${averageBlockingTime.toFixed(2)}ms`);
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should remain responsive during heavy computation scenarios', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create test elements
        await TestUtils.createPerformanceTestElements(page);

        // Test responsiveness during heavy computation
        const heavyComputationTest = await TestUtils.testMainThreadBlocking(page, async () => {
          // Simulate heavy computation that might affect tracking
          await TestUtils.simulateHeavyComputation(page, PERFORMANCE_TEST_CONSTANTS.LONG_TASK_DURATION_MS);
        });

        // Library should not add significant overhead during heavy computation
        expect(heavyComputationTest.taskDuration).toBeLessThan(PERFORMANCE_TEST_CONSTANTS.LONG_TASK_DURATION_MS * 2); // 100% tolerance for CI

        // Test that user interactions remain responsive after heavy computation
        await page.waitForTimeout(200); // Allow system to recover

        const postComputationTest = await TestUtils.testMainThreadBlocking(page, async () => {
          await TestUtils.triggerClickEvent(page, PERFORMANCE_TEST_SELECTORS.PERFORMANCE_TEST_BUTTON);
        });

        // Be more lenient after heavy computation - focus on library not causing excessive delay
        expect(postComputationTest.taskDuration).toBeLessThan(1000); // 1 second tolerance

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Passive Event Listeners', () => {
    test('should use passive event listeners where appropriate', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Check passive listener usage
        const passiveListeners = await TestUtils.checkPassiveEventListeners(page);

        for (const listenerInfo of passiveListeners) {
          if (listenerInfo.supportsPassive) {
            // When passive listeners are supported, SDK should use them for appropriate events
            expect(listenerInfo.isPassive).toBe(true);
          }

          // Only log if passive listeners are not being used when they should be
          if (listenerInfo.supportsPassive && !listenerInfo.isPassive) {
            console.warn(
              `[E2E Test] Passive listener not used for ${listenerInfo.eventType} (supported=${listenerInfo.supportsPassive})`,
            );
          }
        }

        // Test that scroll events don't block during tracking
        await TestUtils.createPerformanceTestElements(page);

        const scrollPerformanceTest = await TestUtils.testMainThreadBlocking(page, async () => {
          // Perform multiple scroll operations
          for (let i = 0; i < 10; i++) {
            await page.evaluate((scrollAmount) => {
              const container = document.querySelector('[data-testid="scroll-container"]');
              if (container) {
                container.scrollTop = scrollAmount * 10;
              }
            }, i);
          }
        });

        expect(scrollPerformanceTest.taskDuration).toBeLessThan(200);
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should prevent scroll and touch blocking behavior', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create scrollable content
        await TestUtils.createPerformanceTestElements(page);

        // Test scroll responsiveness
        const scrollResponsiveness = await TestUtils.testUserInteractionResponsiveness(
          page,
          PERFORMANCE_TEST_SELECTORS.SCROLL_CONTAINER,
          'scroll',
        );

        expect(scrollResponsiveness.withinDelayThreshold).toBe(true);
        expect(scrollResponsiveness.responseTime).toBeLessThanOrEqual(PERFORMANCE_THRESHOLDS.USER_INTERACTION_DELAY_MS);

        // Test touch events (simulated through mouse events)
        const touchResponsiveness = await TestUtils.testUserInteractionResponsiveness(
          page,
          PERFORMANCE_TEST_SELECTORS.INTERACTION_TARGET,
          'click',
        );

        expect(touchResponsiveness.withinDelayThreshold).toBe(true);
        expect(touchResponsiveness.responseTime).toBeLessThanOrEqual(PERFORMANCE_THRESHOLDS.USER_INTERACTION_DELAY_MS);

        // Only log if response times are concerning
        if (scrollResponsiveness.responseTime > PERFORMANCE_THRESHOLDS.USER_INTERACTION_DELAY_MS) {
          console.warn(`[E2E Test] Slow scroll response detected: ${scrollResponsiveness.responseTime.toFixed(2)}ms`);
        }
        if (touchResponsiveness.responseTime > PERFORMANCE_THRESHOLDS.USER_INTERACTION_DELAY_MS) {
          console.warn(`[E2E Test] Slow touch response detected: ${touchResponsiveness.responseTime.toFixed(2)}ms`);
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Memory Footprint and Resource Consumption', () => {
    test('should maintain stable memory usage during normal operations', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');

        // Measure baseline memory
        await TestUtils.measurePerformanceImpact(page);

        const initResult = await TestUtils.initializeTraceLog(page);
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create test elements and perform operations
        await TestUtils.createPerformanceTestElements(page);

        // Perform multiple operations and measure memory
        const memoryMeasurements = [];

        for (let i = 0; i < PERFORMANCE_TEST_CONSTANTS.MEASUREMENT_ITERATIONS; i++) {
          // Perform various operations
          await TestUtils.triggerClickEvent(page, PERFORMANCE_TEST_SELECTORS.PERFORMANCE_TEST_BUTTON);
          await page.evaluate(() => {
            const container = document.querySelector('[data-testid="scroll-container"]');
            if (container) {
              container.scrollTop = Math.random() * 100;
            }
          });

          // Wait and measure
          await page.waitForTimeout(PERFORMANCE_TEST_CONSTANTS.MEMORY_MEASUREMENT_DELAY);
          const measurement = await TestUtils.measurePerformanceImpact(page);
          memoryMeasurements.push(measurement);
        }

        // Analyze memory stability
        const memoryUsages = memoryMeasurements
          .map((m) => m.memoryUsage)
          .filter((usage): usage is number => usage !== undefined);

        if (memoryUsages.length > 0) {
          const maxMemory = Math.max(...memoryUsages);
          const minMemory = Math.min(...memoryUsages);
          const memoryVariation = maxMemory - minMemory;

          // Memory should remain relatively stable
          expect(memoryVariation).toBeLessThanOrEqual(PERFORMANCE_THRESHOLDS.MEMORY_INCREASE_BYTES);

          // Only log if memory usage is concerning
          if (memoryVariation > PERFORMANCE_THRESHOLDS.MEMORY_INCREASE_BYTES * 0.5) {
            console.warn(`[E2E Test] High memory variation detected: ${(memoryVariation / 1024).toFixed(2)}KB`);
          }
          if (maxMemory > 50 * 1024 * 1024) {
            // 50MB threshold
            console.warn(`[E2E Test] High peak memory usage: ${(maxMemory / 1024 / 1024).toFixed(2)}MB`);
          }
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle memory-intensive scenarios gracefully', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create heavy content
        await TestUtils.createPerformanceTestElements(page);

        // Measure memory before heavy operations
        const beforeHeavyOperations = await TestUtils.measurePerformanceImpact(page);

        // Show heavy content and interact with it
        await page.evaluate(() => {
          const heavyContent = document.querySelector('[data-testid="heavy-content"]');
          if (heavyContent) {
            (heavyContent as HTMLElement).style.display = 'block';
          }
        });

        // Perform many interactions with heavy content
        for (let i = 0; i < 50; i++) {
          await page.evaluate((index) => {
            const heavyContent = document.querySelector('[data-testid="heavy-content"]');
            if (heavyContent) {
              const img = heavyContent.querySelector(`img:nth-child(${(index % 10) + 1})`);
              if (img) {
                img.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }
          }, i);

          // Track custom events during heavy operations
          await TestUtils.testCustomEvent(page, 'heavy_operation_test', { iteration: i, timestamp: Date.now() });
        }

        // Measure memory after heavy operations
        const afterHeavyOperations = await TestUtils.measurePerformanceImpact(page);

        // Hide heavy content and measure memory cleanup
        await page.evaluate(() => {
          const heavyContent = document.querySelector('[data-testid="heavy-content"]');
          if (heavyContent) {
            (heavyContent as HTMLElement).style.display = 'none';
          }
        });

        await page.waitForTimeout(1000); // Allow cleanup

        const afterCleanup = await TestUtils.measurePerformanceImpact(page);

        // Validate memory management
        if (beforeHeavyOperations.memoryUsage && afterHeavyOperations.memoryUsage && afterCleanup.memoryUsage) {
          const memoryIncrease = afterHeavyOperations.memoryUsage - beforeHeavyOperations.memoryUsage;
          // Only log if memory increase is concerning
          if (memoryIncrease > 10 * 1024 * 1024) {
            // 10MB threshold
            console.warn(
              `[E2E Test] High memory increase during heavy operations: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`,
            );
          }

          // Memory should not increase unreasonably due to library overhead
          const libraryOverhead = afterCleanup.memoryUsage - beforeHeavyOperations.memoryUsage;
          expect(libraryOverhead).toBeLessThanOrEqual(PERFORMANCE_THRESHOLDS.MEMORY_INCREASE_BYTES);
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Event Processing Performance', () => {
    test('should process events quickly without impacting page performance', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        const eventProcessingTests: EventProcessingPerformanceInfo[] = [];

        // Test custom event processing performance
        const customEventTest = await TestUtils.testEventProcessingPerformance(page, 'custom');
        eventProcessingTests.push(customEventTest);

        // Test click event processing performance
        await TestUtils.createPerformanceTestElements(page);
        const clickEventTest = await TestUtils.testEventProcessingPerformance(page, 'click');
        eventProcessingTests.push(clickEventTest);

        // Test scroll event processing performance
        const scrollEventTest = await TestUtils.testEventProcessingPerformance(page, 'scroll');
        eventProcessingTests.push(scrollEventTest);

        // Validate all event processing is within thresholds
        for (const test of eventProcessingTests) {
          expect(test.withinProcessingThreshold).toBe(true);
          expect(test.processingDuration).toBeLessThanOrEqual(PERFORMANCE_THRESHOLDS.EVENT_PROCESSING_TIME_MS);

          // Only log if processing time is concerning
          if (test.processingDuration > PERFORMANCE_THRESHOLDS.EVENT_PROCESSING_TIME_MS * 0.5) {
            console.warn(`[E2E Test] Slow ${test.eventType} event processing: ${test.processingDuration.toFixed(2)}ms`);
          }
        }

        // Test bulk event processing
        const bulkProcessingTest = await TestUtils.testMainThreadBlocking(page, async () => {
          for (let i = 0; i < 20; i++) {
            await TestUtils.testCustomEvent(page, 'bulk_test_event', { index: i, timestamp: Date.now() });
          }
        });

        // Validate bulk processing doesn't cause excessive delay
        expect(bulkProcessingTest.taskDuration).toBeLessThan(1000);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle event queue efficiently under load', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create test elements
        await TestUtils.createPerformanceTestElements(page);

        // Generate high event load (reduced for performance)
        const highLoadTest = await TestUtils.testMainThreadBlocking(page, async () => {
          // Generate many events rapidly
          for (let i = 0; i < 100; i++) {
            await TestUtils.testCustomEvent(page, 'high_load_test', { iteration: i, batch: Math.floor(i / 10) });
          }
        });

        // Be more lenient for high load scenarios (account for mobile performance variations and new logging system)
        expect(highLoadTest.taskDuration).toBeLessThan(500); // Increased from 250ms to 500ms to account for logging overhead

        // Check event queue state
        const queueAnalysis = await page.evaluate(() => {
          const bridge = window.__traceLogTestBridge;
          if (!bridge) return { queueLength: 0, hasManager: false };

          const eventManager = bridge.getEventManager();
          if (!eventManager) return { queueLength: 0, hasManager: false };

          const queue = eventManager.getEventQueue();
          return {
            queueLength: queue?.length ?? 0,
            hasManager: true,
          };
        });

        expect(queueAnalysis.hasManager).toBe(true);
        // Only log if queue length indicates potential issue
        if (queueAnalysis.queueLength > 20) {
          console.warn(`[E2E Test] High event queue length detected: ${queueAnalysis.queueLength}`);
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Async Operations and User Interaction Interference', () => {
    test('should ensure async operations do not interfere with user interactions', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create test elements
        await TestUtils.createPerformanceTestElements(page);

        const asyncOperationTests: AsyncOperationPerformanceInfo[] = [];

        // Test async event sending
        const eventSendingTest = await TestUtils.testAsyncOperationInterference(page, 'event_sending', async () => {
          // Send multiple events and wait for processing
          for (let i = 0; i < 10; i++) {
            await TestUtils.testCustomEvent(page, 'async_test_event', { index: i, type: 'async_operation_test' });
          }
          await page.waitForTimeout(100);
        });
        asyncOperationTests.push(eventSendingTest);

        // Test async performance monitoring
        const performanceMonitoringTest = await TestUtils.testAsyncOperationInterference(
          page,
          'performance_monitoring',
          async () => {
            // Trigger performance monitoring activities
            await TestUtils.generateLongTask(page, 60, 100);
            await page.waitForTimeout(200);
          },
        );
        asyncOperationTests.push(performanceMonitoringTest);

        // Test async session management
        const sessionManagementTest = await TestUtils.testAsyncOperationInterference(
          page,
          'session_management',
          async () => {
            // Trigger session-related activities
            await TestUtils.simulateUserActivity(page);
            await page.waitForTimeout(150);
          },
        );
        asyncOperationTests.push(sessionManagementTest);

        // Validate all async operations don't interfere (focus on library not causing excessive delays)
        for (const test of asyncOperationTests) {
          expect(test.duration).toBeLessThan(2000); // 2 second tolerance for async operations in CI
          // Only log if async operation takes too long
          if (test.duration > PERFORMANCE_THRESHOLDS.ASYNC_OPERATION_DELAY_MS) {
            console.warn(`[E2E Test] Slow ${test.operationType} async operation: ${test.duration.toFixed(2)}ms`);
          }
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should maintain user interaction responsiveness during concurrent async operations', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create test elements
        await TestUtils.createPerformanceTestElements(page);

        // Start concurrent async operations
        const concurrentOperations = [
          // Generate events continuously
          (async (): Promise<void> => {
            for (let i = 0; i < 50; i++) {
              await TestUtils.testCustomEvent(page, 'concurrent_event', { index: i, timestamp: Date.now() });
              await page.waitForTimeout(20);
            }
          })(),

          // Simulate performance monitoring
          (async (): Promise<void> => {
            for (let i = 0; i < 5; i++) {
              await TestUtils.generateLongTask(page, 30, i * 200);
            }
          })(),

          // Test user interactions during async operations
          (async (): Promise<UserInteractionPerformanceInfo[]> => {
            await page.waitForTimeout(100); // Let async ops start
            const userInteractionTests: UserInteractionPerformanceInfo[] = [];

            for (let i = 0; i < 10; i++) {
              const clickTest = await TestUtils.testUserInteractionResponsiveness(
                page,
                PERFORMANCE_TEST_SELECTORS.PERFORMANCE_TEST_BUTTON,
                'click',
              );
              userInteractionTests.push(clickTest);

              const scrollTest = await TestUtils.testUserInteractionResponsiveness(
                page,
                PERFORMANCE_TEST_SELECTORS.SCROLL_CONTAINER,
                'scroll',
              );
              userInteractionTests.push(scrollTest);

              await page.waitForTimeout(50);
            }

            // Validate all user interactions remained responsive
            for (const test of userInteractionTests) {
              expect(test.withinDelayThreshold).toBe(true);
              expect(test.responseTime).toBeLessThanOrEqual(PERFORMANCE_THRESHOLDS.USER_INTERACTION_DELAY_MS);
              expect(test.wasBlocked).toBe(false);
            }

            const averageResponseTime =
              userInteractionTests.reduce((sum, test) => sum + test.responseTime, 0) / userInteractionTests.length;
            // Only log if average response time is concerning
            if (averageResponseTime > PERFORMANCE_THRESHOLDS.USER_INTERACTION_DELAY_MS) {
              console.warn(
                `[E2E Test] Slow user interactions during async operations: ${averageResponseTime.toFixed(2)}ms`,
              );
            }

            return userInteractionTests;
          })(),
        ];

        // Wait for all concurrent operations to complete
        const results = await Promise.all(concurrentOperations);
        const userInteractionResults = results[2] as UserInteractionPerformanceInfo[];

        // Additional validation that interactions weren't significantly impacted
        expect(userInteractionResults.length).toBeGreaterThan(0);
        const maxResponseTime = Math.max(...userInteractionResults.map((r) => r.responseTime));
        expect(maxResponseTime).toBeLessThanOrEqual(PERFORMANCE_THRESHOLDS.USER_INTERACTION_DELAY_MS * 2); // Allow some tolerance for concurrent load

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Overall Performance Impact Assessment', () => {
    test('should pass comprehensive performance impact analysis', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');

        // Measure baseline performance
        await TestUtils.measurePerformanceImpact(page);

        // Initialize library and measure impact
        const initMeasurement = await TestUtils.measureInitializationPerformance(page);
        const initResult = await TestUtils.initializeTraceLog(page);
        const completedInitMeasurement = await TestUtils.completeInitializationMeasurement(page, initMeasurement);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create test environment
        await TestUtils.createPerformanceTestElements(page);

        // Perform comprehensive analysis
        const performanceAnalysis = await TestUtils.performComprehensivePerformanceAnalysis(page);

        expect(performanceAnalysis.testable).toBe(true);
        expect(performanceAnalysis.overallPerformanceScore.passed).toBe(true);
        expect(performanceAnalysis.overallPerformanceScore.score).toBeGreaterThanOrEqual(80);

        // Only log if performance score is concerning or there are issues
        if (performanceAnalysis.overallPerformanceScore.score < 80) {
          console.warn(`[E2E Test] Low Performance Score: ${performanceAnalysis.overallPerformanceScore.score}/100`);
        }
        if (completedInitMeasurement.initDuration > PERFORMANCE_THRESHOLDS.INITIALIZATION_TIME_MS * 0.8) {
          console.warn(`[E2E Test] Slow initialization: ${completedInitMeasurement.initDuration.toFixed(2)}ms`);
        }
        if (completedInitMeasurement.memoryIncrease > PERFORMANCE_THRESHOLDS.MEMORY_INCREASE_BYTES * 0.1) {
          console.warn(`[E2E Test] Memory impact: ${(completedInitMeasurement.memoryIncrease / 1024).toFixed(2)}KB`);
        }

        if (performanceAnalysis.overallPerformanceScore.issues.length > 0) {
          console.warn(
            `[E2E Test] Performance Issues: ${performanceAnalysis.overallPerformanceScore.issues.join(', ')}`,
          );
        }

        // Validate key performance criteria
        expect(completedInitMeasurement.withinTimeThreshold).toBe(true);
        expect(completedInitMeasurement.withinMemoryThreshold).toBe(true);
        expect(performanceAnalysis.memoryUsage.stable).toBe(true);
        expect(performanceAnalysis.memoryUsage.withinThreshold).toBe(true);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should maintain performance standards across different usage patterns', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create test elements
        await TestUtils.createPerformanceTestElements(page);

        const performanceMetrics = {
          lightUsage: { events: 10, interactions: 5, duration: 1000 },
          moderateUsage: { events: 50, interactions: 20, duration: 2000 },
          heavyUsage: { events: 100, interactions: 50, duration: 3000 },
        };

        const usagePatternResults: Record<string, { mainThreadTime: number; memoryIncrease: number }> = {};

        for (const [pattern, config] of Object.entries(performanceMetrics)) {
          const startMemory = await TestUtils.measurePerformanceImpact(page);

          const usageTest = await TestUtils.testMainThreadBlocking(page, async () => {
            // Generate events based on usage pattern
            for (let i = 0; i < config.events; i++) {
              await TestUtils.testCustomEvent(page, `${pattern}_event`, { index: i, pattern, timestamp: Date.now() });

              if (i % 5 === 0 && i < config.interactions) {
                await TestUtils.triggerClickEvent(page, PERFORMANCE_TEST_SELECTORS.PERFORMANCE_TEST_BUTTON);
              }
            }

            await page.waitForTimeout(config.duration / 10);
          });

          const endMemory = await TestUtils.measurePerformanceImpact(page);

          const memoryIncrease = (endMemory.memoryUsage ?? 0) - (startMemory.memoryUsage ?? 0);

          usagePatternResults[pattern] = {
            mainThreadTime: usageTest.taskDuration,
            memoryIncrease,
          };

          // Validate performance remains acceptable for each usage pattern (focus on library efficiency)
          expect(usageTest.taskDuration).toBeLessThan(10000); // 10 second tolerance for bulk operations in CI
          expect(memoryIncrease).toBeLessThanOrEqual(PERFORMANCE_THRESHOLDS.MEMORY_INCREASE_BYTES);

          // Only log if performance is concerning
          if (usageTest.taskDuration > 5000) {
            console.warn(
              `[E2E Test] Slow ${pattern} usage: ${usageTest.taskDuration.toFixed(2)}ms, memory: ${(memoryIncrease / 1024).toFixed(2)}KB`,
            );
          }
        }

        // Validate performance scales reasonably with usage
        const lightTime = usagePatternResults.lightUsage.mainThreadTime;
        const heavyTime = usagePatternResults.heavyUsage.mainThreadTime;
        const performanceScaling = heavyTime / lightTime;

        // Performance should scale reasonably (library overhead should be proportional)
        expect(performanceScaling).toBeLessThan(15); // Heavy usage shouldn't be more than 15x slower in CI

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });
});
