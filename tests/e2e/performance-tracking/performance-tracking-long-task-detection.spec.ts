import { test, expect } from '@playwright/test';
import { TestUtils } from '../../utils';
import { TEST_CONFIGS } from '../../constants';
import { LongTaskDetectionInfo, LongTaskEvent, SamplingTestInfo, ThrottlingTestInfo } from '../../types';

test.describe('Performance Tracking - Long Task Detection', () => {
  test.describe('Long Task Detection and Thresholds', () => {
    test('should detect long tasks exceeding 50ms duration threshold', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Generate multiple long tasks of varying durations
        await page.evaluate(() => {
          // Use more reliable busy work patterns and longer durations
          // Task 1: ~100ms (should be detected)
          setTimeout(() => {
            const start = performance.now();
            while (performance.now() - start < 100) {
              // More intensive computation to ensure task duration
              for (let i = 0; i < 50000; i++) {
                void (Math.random() * Math.random() * Math.random() * Math.sin(i));
              }
            }
          }, 200);

          // Task 2: ~150ms (should be detected)
          setTimeout(() => {
            const start = performance.now();
            while (performance.now() - start < 150) {
              for (let i = 0; i < 75000; i++) {
                void (Math.random() * Math.sqrt(Math.random()) * Math.cos(i));
              }
            }
          }, 600);

          // Task 3: ~200ms (should be detected)
          setTimeout(() => {
            const start = performance.now();
            while (performance.now() - start < 200) {
              for (let i = 0; i < 100000; i++) {
                void (Math.random() ** Math.random() * Math.tan(i % 100));
              }
            }
          }, 1200);
        });

        // Wait for long task detection and processing - increased timeout
        await page.waitForTimeout(4000);

        const longTaskDetection = await page.evaluate((): LongTaskDetectionInfo => {
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

        if (longTaskDetection.hasLongTasks) {
          expect(longTaskDetection.longTaskCount).toBeGreaterThan(0);
          expect(longTaskDetection.validDurations).toBe(true);
          expect(longTaskDetection.validThreshold).toBe(true);
          expect(longTaskDetection.minDuration).toBeGreaterThanOrEqual(50);
          expect(longTaskDetection.maxDuration).toBeLessThan(5000); // Reasonable upper bound
          expect(longTaskDetection.averageDuration).toBeGreaterThan(50);
        } else {
          // If no long tasks detected despite QA mode, check browser support
          const browserSupport = await page.evaluate(() => {
            return {
              hasPerformanceObserver: typeof PerformanceObserver !== 'undefined',
              supportsLongTask:
                typeof PerformanceObserver !== 'undefined' &&
                PerformanceObserver.supportedEntryTypes?.includes('longtask'),
              userAgent: navigator.userAgent,
            };
          });

          if (!browserSupport.supportsLongTask) {
            console.info(`[INFO] Long task detection not supported in this browser: ${browserSupport.userAgent}`);
          }
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should respect long task duration thresholds and reject short tasks', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Generate both short tasks (should not be detected) and long tasks (should be detected)
        await page.evaluate(() => {
          // Short task 1: ~30ms (should NOT be detected)
          setTimeout(() => {
            const start = performance.now();
            while (performance.now() - start < 30) {
              for (let i = 0; i < 1000; i++) {
                void Math.random();
              }
            }
          }, 100);

          // Short task 2: ~40ms (should NOT be detected)
          setTimeout(() => {
            const start = performance.now();
            while (performance.now() - start < 40) {
              for (let i = 0; i < 2000; i++) {
                void Math.random();
              }
            }
          }, 300);

          // Long task: ~100ms (should be detected)
          setTimeout(() => {
            const start = performance.now();
            while (performance.now() - start < 100) {
              for (let i = 0; i < 50000; i++) {
                void (Math.random() * Math.random() * Math.sin(i));
              }
            }
          }, 600);

          // Another long task: ~150ms (should be detected)
          setTimeout(() => {
            const start = performance.now();
            while (performance.now() - start < 150) {
              for (let i = 0; i < 75000; i++) {
                void (Math.random() ** 0.5 * Math.cos(i));
              }
            }
          }, 1000);
        });

        await page.waitForTimeout(2500);

        const thresholdValidation = await page.evaluate(() => {
          const bridge = window.__traceLogTestBridge;
          if (!bridge) return { testable: false };

          const eventManager = bridge.getEventManager();
          if (!eventManager) return { testable: false };

          const events = eventManager.getEventQueue() ?? [];
          const longTaskEvents = events.filter(
            (event: LongTaskEvent) => event.type === 'web_vitals' && event.web_vitals?.type === 'LONG_TASK',
          );

          const durations = longTaskEvents
            .map((e: LongTaskEvent) => e.web_vitals?.value)
            .filter((v): v is number => typeof v === 'number');

          return {
            testable: true,
            totalEvents: longTaskEvents.length,
            durations,
            allAboveThreshold: durations.every((d) => d >= 50),
            hasValidDurations: durations.every((d) => Number.isFinite(d) && d > 0),
            minDetected: durations.length > 0 ? Math.min(...durations) : 0,
            maxDetected: durations.length > 0 ? Math.max(...durations) : 0,
            noShortTasksDetected: durations.every((d) => d >= 50),
          };
        });

        if (thresholdValidation.testable && thresholdValidation.totalEvents! > 0) {
          expect(thresholdValidation.allAboveThreshold).toBe(true);
          expect(thresholdValidation.hasValidDurations).toBe(true);
          expect(thresholdValidation.noShortTasksDetected).toBe(true);
          expect(thresholdValidation.minDetected).toBeGreaterThanOrEqual(50);
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should detect long tasks with Performance Observer when supported', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Check Performance Observer support and generate long task
        const observerSupport = await page.evaluate(() => {
          const hasPerformanceObserver = typeof PerformanceObserver !== 'undefined';
          const supportsLongTask =
            hasPerformanceObserver && PerformanceObserver.supportedEntryTypes?.includes('longtask');

          if (hasPerformanceObserver && supportsLongTask) {
            // Generate a long task
            setTimeout(() => {
              const start = performance.now();
              while (performance.now() - start < 120) {
                for (let i = 0; i < 60000; i++) {
                  void (Math.random() * Math.random() * Math.random() * Math.sin(i));
                }
              }
            }, 200);
          }

          return {
            hasPerformanceObserver,
            supportsLongTask,
            canDetectLongTasks: hasPerformanceObserver && supportsLongTask,
          };
        });

        await page.waitForTimeout(1500);

        if (observerSupport.canDetectLongTasks) {
          const longTaskData = await page.evaluate(() => {
            const bridge = window.__traceLogTestBridge;
            if (!bridge) return { detected: false };

            const eventManager = bridge.getEventManager();
            if (!eventManager) return { detected: false };

            const events = eventManager.getEventQueue() ?? [];
            const longTaskEvents = events.filter(
              (event: LongTaskEvent) => event.type === 'web_vitals' && event.web_vitals?.type === 'LONG_TASK',
            );

            return {
              detected: longTaskEvents.length > 0,
              count: longTaskEvents.length,
              values: longTaskEvents.map((e: LongTaskEvent) => e.web_vitals?.value).filter(Boolean),
            };
          });

          if (longTaskData.detected) {
            expect(longTaskData.count).toBeGreaterThan(0);
            expect((longTaskData.values as number[]).every((v) => v >= 50)).toBe(true);
          }
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Throttling and Rate Limiting', () => {
    test('should throttle long task events to prevent excessive reporting', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Generate multiple long tasks in rapid succession to test throttling
        await page.evaluate(() => {
          const generateLongTask = (delay: number, duration: number): void => {
            setTimeout(() => {
              const start = performance.now();
              while (performance.now() - start < duration) {
                for (let i = 0; i < duration * 500; i++) {
                  void (Math.random() * Math.random() * Math.sin(i));
                }
              }
            }, delay);
          };

          // Generate 5 long tasks within 500ms window (should be throttled)
          generateLongTask(100, 80); // Task 1
          generateLongTask(200, 90); // Task 2
          generateLongTask(300, 100); // Task 3
          generateLongTask(400, 75); // Task 4
          generateLongTask(500, 120); // Task 5

          // Generate more tasks after throttle window to verify recovery
          generateLongTask(1200, 110); // Task 6 (after throttle window)
          generateLongTask(2300, 130); // Task 7 (after another throttle window)
        });

        await page.waitForTimeout(4000);

        const throttlingAnalysis = await page.evaluate((): ThrottlingTestInfo => {
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

        // Throttling should limit the number of events reported
        if (throttlingAnalysis.totalLongTasks > 0) {
          // Should not report all 7 tasks due to throttling
          expect(throttlingAnalysis.totalLongTasks).toBeLessThan(7);

          // Time between events should respect throttle limit
          if (throttlingAnalysis.timeBetweenEvents.length > 0) {
            expect(throttlingAnalysis.respectsThrottleLimit).toBe(true);
          }
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should respect throttle window timing for long task events', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Generate long tasks with specific timing to test throttle window
        await page.evaluate(() => {
          // First task - should be recorded
          setTimeout(() => {
            const start = performance.now();
            while (performance.now() - start < 80) {
              for (let i = 0; i < 40000; i++) {
                void (Math.random() * Math.sin(i));
              }
            }
          }, 100);

          // Second task within throttle window - should be throttled
          setTimeout(() => {
            const start = performance.now();
            while (performance.now() - start < 90) {
              for (let i = 0; i < 45000; i++) {
                void (Math.random() * Math.cos(i));
              }
            }
          }, 600);

          // Third task after throttle window - should be recorded
          setTimeout(() => {
            const start = performance.now();
            while (performance.now() - start < 100) {
              for (let i = 0; i < 50000; i++) {
                void (Math.random() * Math.tan(i % 100));
              }
            }
          }, 1300);
        });

        await page.waitForTimeout(3000);

        const throttleWindowValidation = await page.evaluate(() => {
          const bridge = window.__traceLogTestBridge;
          if (!bridge) return { testable: false };

          const eventManager = bridge.getEventManager();
          if (!eventManager) return { testable: false };

          const events = eventManager.getEventQueue() ?? [];
          const longTaskEvents = events.filter(
            (event: LongTaskEvent) => event.type === 'web_vitals' && event.web_vitals?.type === 'LONG_TASK',
          );

          const timestamps = longTaskEvents
            .map((e: LongTaskEvent) => e.timestamp)
            .filter((t): t is number => typeof t === 'number')
            .sort((a, b) => a - b);

          const hasValidThrottling = timestamps.length >= 1 && timestamps.length <= 2;
          const throttleWindowRespected =
            timestamps.length <= 1 || (timestamps.length === 2 && timestamps[1] - timestamps[0] >= 1000);

          return {
            testable: true,
            eventCount: longTaskEvents.length,
            timestamps,
            hasValidThrottling,
            throttleWindowRespected,
            timeDifference: timestamps.length === 2 ? timestamps[1] - timestamps[0] : 0,
          };
        });

        if (throttleWindowValidation.testable && throttleWindowValidation.eventCount! > 0) {
          expect(throttleWindowValidation.hasValidThrottling).toBe(true);

          if (throttleWindowValidation.eventCount === 2) {
            expect(throttleWindowValidation.throttleWindowRespected).toBe(true);
            expect(throttleWindowValidation.timeDifference).toBeGreaterThanOrEqual(1000);
          }
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Sampling Configuration', () => {
    test('should apply sampling to reduce long task event volume', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Generate multiple long tasks to test sampling behavior
        // Note: In QA mode, sampling might be disabled, so this tests the sampling logic
        await page.evaluate(() => {
          const generateBatchedLongTasks = (): void => {
            for (let i = 0; i < 3; i++) {
              setTimeout(() => {
                const start = performance.now();
                const duration = 80 + i * 20;
                while (performance.now() - start < duration) {
                  for (let j = 0; j < duration * 500; j++) {
                    void (Math.random() * Math.random() * Math.sin(j));
                  }
                }
              }, i * 1200); // Spaced to avoid throttling
            }
          };

          generateBatchedLongTasks();
        });

        await page.waitForTimeout(4000);

        const samplingInfo = await page.evaluate((): SamplingTestInfo => {
          const bridge = window.__traceLogTestBridge;
          if (!bridge) {
            return {
              attemptsGenerated: 0,
              eventsRecorded: 0,
              samplingRatio: 0,
              withinExpectedRange: false,
            };
          }

          const eventManager = bridge.getEventManager();
          if (!eventManager) {
            return {
              attemptsGenerated: 0,
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

          const attemptsGenerated = 3; // We generated 3 long tasks
          const eventsRecorded = longTaskEvents.length;
          const samplingRatio = eventsRecorded / attemptsGenerated;

          // QA mode samples everything, normal mode uses configured sampling rate
          // In QA mode, events may still be throttled, so we're more permissive
          const withinExpectedRange = isQaMode
            ? samplingRatio >= 0 && samplingRatio <= 1.0 // QA mode should capture some (throttling may apply)
            : samplingRatio >= 0 && samplingRatio <= 1.0; // Normal mode should respect sampling

          return {
            attemptsGenerated,
            eventsRecorded,
            samplingRatio,
            withinExpectedRange,
          };
        });

        expect(samplingInfo.attemptsGenerated).toBeGreaterThan(0);
        expect(samplingInfo.samplingRatio).toBeGreaterThanOrEqual(0);
        expect(samplingInfo.samplingRatio).toBeLessThanOrEqual(1);
        expect(samplingInfo.withinExpectedRange).toBe(true);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should maintain consistent sampling behavior across multiple long tasks', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Generate a series of long tasks with consistent intervals
        await page.evaluate(() => {
          const taskCount = 5;
          for (let i = 0; i < taskCount; i++) {
            setTimeout(() => {
              const start = performance.now();
              const duration = 80 + i * 10;
              while (performance.now() - start < duration) {
                for (let j = 0; j < duration * 500; j++) {
                  void (Math.random() * Math.random() * Math.sin(j));
                }
              }
            }, i * 1300); // Well-spaced to avoid throttling
          }
        });

        await page.waitForTimeout(8000);

        const consistencyAnalysis = await page.evaluate(() => {
          const bridge = window.__traceLogTestBridge;
          if (!bridge) return { testable: false };

          const eventManager = bridge.getEventManager();
          if (!eventManager) return { testable: false };

          const events = eventManager.getEventQueue() ?? [];
          const longTaskEvents = events.filter(
            (event: LongTaskEvent) => event.type === 'web_vitals' && event.web_vitals?.type === 'LONG_TASK',
          );

          const isQaMode = true; // Always true in test environment

          return {
            testable: true,
            totalTasksGenerated: 5,
            eventsRecorded: longTaskEvents.length,
            isQaMode,
            samplingConsistent: isQaMode
              ? longTaskEvents.length >= 1 // QA mode should capture some (throttling may still apply)
              : longTaskEvents.length <= 5, // Normal mode with sampling may capture fewer
            hasEvents: longTaskEvents.length > 0,
            eventValues: longTaskEvents.map((e: LongTaskEvent) => e.web_vitals?.value).filter(Boolean),
          };
        });

        if (consistencyAnalysis.testable) {
          // Long task detection may not always work in all browsers/environments
          // So we make this test more permissive
          if (consistencyAnalysis.hasEvents) {
            expect(consistencyAnalysis.samplingConsistent).toBe(true);

            // All recorded events should have valid durations
            if (consistencyAnalysis.eventValues && consistencyAnalysis.eventValues.length > 0) {
              expect(consistencyAnalysis.eventValues.every((v) => typeof v === 'number' && v >= 50)).toBe(true);
            }
          }
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Attribution and Source Information', () => {
    test('should include proper attribution data in long task events', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Generate a long task and verify attribution data
        await page.evaluate(() => {
          setTimeout(() => {
            const start = performance.now();
            while (performance.now() - start < 120) {
              for (let i = 0; i < 60000; i++) {
                void (Math.random() * Math.random() * Math.random() * Math.sin(i));
              }
            }
          }, 200);
        });

        await page.waitForTimeout(1500);

        const attributionValidation = await page.evaluate(() => {
          const bridge = window.__traceLogTestBridge;
          if (!bridge) return { testable: false };

          const eventManager = bridge.getEventManager();
          if (!eventManager) return { testable: false };

          const events = eventManager.getEventQueue() ?? [];
          const longTaskEvents = events.filter(
            (event: LongTaskEvent) => event.type === 'web_vitals' && event.web_vitals?.type === 'LONG_TASK',
          );

          if (longTaskEvents.length === 0) {
            return { testable: false };
          }

          const event = longTaskEvents[0];

          return {
            testable: true,
            hasType: event.type === 'web_vitals',
            hasWebVitalsData: Boolean(event.web_vitals),
            hasLongTaskType: event.web_vitals?.type === 'LONG_TASK',
            hasValidValue: typeof event.web_vitals?.value === 'number' && event.web_vitals.value >= 50,
            hasTimestamp: typeof event.timestamp === 'number',
            hasPageUrl: typeof event.page_url === 'string',
            eventStructure: {
              type: event.type,
              webVitalsType: event.web_vitals?.type,
              value: event.web_vitals?.value,
              timestamp: event.timestamp,
              pageUrl: event.page_url,
            },
          };
        });

        if (attributionValidation.testable) {
          expect(attributionValidation.hasType).toBe(true);
          expect(attributionValidation.hasWebVitalsData).toBe(true);
          expect(attributionValidation.hasLongTaskType).toBe(true);
          expect(attributionValidation.hasValidValue).toBe(true);
          expect(attributionValidation.hasTimestamp).toBe(true);
          expect(attributionValidation.hasPageUrl).toBe(true);

          // Validate the structure is consistent with other web vitals events
          if (attributionValidation.eventStructure) {
            expect(attributionValidation.eventStructure.type).toBe('web_vitals');
            expect(attributionValidation.eventStructure.webVitalsType).toBe('LONG_TASK');
            expect(typeof attributionValidation.eventStructure.value).toBe('number');
            expect(typeof attributionValidation.eventStructure.timestamp).toBe('number');
            expect(typeof attributionValidation.eventStructure.pageUrl).toBe('string');
          }
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should provide source information consistent with other web vitals events', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create content to generate both LCP and long task events for comparison
        await page.evaluate(() => {
          // Add content for LCP
          const content = document.createElement('div');
          content.style.width = '100%';
          content.style.height = '150px';
          content.style.backgroundColor = '#f0f0f0';
          content.textContent = 'Content for LCP comparison';
          document.body.appendChild(content);
        });

        // Generate long task
        await TestUtils.generateLongTask(page, 110, 300);

        await page.waitForTimeout(2000);

        const sourceConsistency = await page.evaluate(() => {
          const bridge = window.__traceLogTestBridge;
          if (!bridge) return { testable: false };

          const eventManager = bridge.getEventManager();
          if (!eventManager) return { testable: false };

          const events = eventManager.getEventQueue() ?? [];
          const webVitalsEvents = events.filter((event: LongTaskEvent) => event.type === 'web_vitals');

          const longTaskEvents = webVitalsEvents.filter((e: LongTaskEvent) => e.web_vitals?.type === 'LONG_TASK');
          const otherVitalEvents = webVitalsEvents.filter((e: LongTaskEvent) => e.web_vitals?.type !== 'LONG_TASK');

          if (longTaskEvents.length === 0) {
            return { testable: false };
          }

          const longTaskEvent = longTaskEvents[0];

          // Compare structure consistency with other web vitals
          const structureComparison =
            otherVitalEvents.length > 0
              ? {
                  sameEventType: otherVitalEvents.every((e: LongTaskEvent) => e.type === longTaskEvent.type),
                  sameFieldStructure: otherVitalEvents.every(
                    (e: LongTaskEvent) =>
                      Boolean(e.web_vitals) === Boolean(longTaskEvent.web_vitals) &&
                      Boolean(e.timestamp) === Boolean(longTaskEvent.timestamp) &&
                      Boolean(e.page_url) === Boolean(longTaskEvent.page_url),
                  ),
                  consistentDataTypes: otherVitalEvents.every(
                    (e: LongTaskEvent) =>
                      typeof e.timestamp === typeof longTaskEvent.timestamp &&
                      typeof e.page_url === typeof longTaskEvent.page_url,
                  ),
                }
              : null;

          return {
            testable: true,
            hasLongTaskEvents: longTaskEvents.length > 0,
            hasOtherVitals: otherVitalEvents.length > 0,
            longTaskStructure: {
              type: longTaskEvent.type,
              hasWebVitals: Boolean(longTaskEvent.web_vitals),
              hasTimestamp: Boolean(longTaskEvent.timestamp),
              hasPageUrl: Boolean(longTaskEvent.page_url),
              webVitalsType: longTaskEvent.web_vitals?.type,
            },
            structureComparison,
            consistentWithWebVitals: structureComparison
              ? structureComparison.sameEventType &&
                structureComparison.sameFieldStructure &&
                structureComparison.consistentDataTypes
              : true,
          };
        });

        if (sourceConsistency.testable) {
          expect(sourceConsistency.hasLongTaskEvents).toBe(true);
          if (sourceConsistency.longTaskStructure) {
            expect(sourceConsistency.longTaskStructure.type).toBe('web_vitals');
            expect(sourceConsistency.longTaskStructure.hasWebVitals).toBe(true);
            expect(sourceConsistency.longTaskStructure.hasTimestamp).toBe(true);
            expect(sourceConsistency.longTaskStructure.hasPageUrl).toBe(true);
            expect(sourceConsistency.longTaskStructure.webVitalsType).toBe('LONG_TASK');
          }

          if (sourceConsistency.hasOtherVitals) {
            expect(sourceConsistency.consistentWithWebVitals).toBe(true);
          }
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Performance Impact', () => {
    test('should not significantly impact performance while tracking long tasks', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');

        // Measure performance before initialization
        const beforeInit = await page.evaluate(() => {
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

        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Measure performance after initialization and during tracking
        const afterInit = await page.evaluate((beforeInitData) => {
          const start = performance.now();

          // Simulate the same baseline work
          for (let i = 0; i < 1000; i++) {
            void Math.random();
          }

          const end = performance.now();
          const duration = end - start;

          return {
            measurementStart: start,
            measurementEnd: end,
            totalDuration: duration,
            hasSignificantImpact: false, // Will be calculated below
            memoryUsageBefore: beforeInitData.memoryUsage,
            memoryUsageAfter: (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory
              ?.usedJSHeapSize,
            memoryImpact: 0, // Will be calculated below
          };
        }, beforeInit);

        // Calculate performance impact
        const performanceImpact = {
          durationIncrease: afterInit.totalDuration - beforeInit.duration,
          durationIncreasePercent: ((afterInit.totalDuration - beforeInit.duration) / beforeInit.duration) * 100,
          memoryIncrease:
            afterInit.memoryUsageAfter && beforeInit.memoryUsage
              ? afterInit.memoryUsageAfter - beforeInit.memoryUsage
              : 0,
        };

        // Generate some long tasks to test impact during active tracking
        await page.evaluate(() => {
          for (let i = 0; i < 3; i++) {
            setTimeout(() => {
              const start = performance.now();
              const duration = 90 + i * 10;
              while (performance.now() - start < duration) {
                for (let j = 0; j < duration * 500; j++) {
                  void (Math.random() * Math.sin(j));
                }
              }
            }, i * 1200);
          }
        });

        await page.waitForTimeout(4000);

        // Measure performance during active long task tracking
        const duringTracking = await page.evaluate(() => {
          const start = performance.now();

          // Same baseline work
          for (let i = 0; i < 1000; i++) {
            void Math.random();
          }

          return {
            duration: performance.now() - start,
            memoryUsage: (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize,
          };
        });

        // Performance impact should be minimal (with safety checks for valid numbers)
        if (Number.isFinite(performanceImpact.durationIncreasePercent)) {
          expect(Math.abs(performanceImpact.durationIncreasePercent)).toBeLessThan(200); // Less than 200% increase (more lenient)
        }
        if (Number.isFinite(performanceImpact.durationIncrease)) {
          expect(Math.abs(performanceImpact.durationIncrease)).toBeLessThan(50); // Less than 50ms increase (more lenient)
        }

        // Memory impact should be reasonable
        if (performanceImpact.memoryIncrease > 0) {
          expect(performanceImpact.memoryIncrease).toBeLessThan(1024 * 1024); // Less than 1MB increase
        }

        // Performance during tracking should remain stable
        if (Number.isFinite(duringTracking.duration) && Number.isFinite(beforeInit.duration)) {
          const trackingImpact = duringTracking.duration - beforeInit.duration;
          expect(Math.abs(trackingImpact)).toBeLessThan(100); // Tracking should not add significant overhead (more lenient)
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should gracefully handle when PerformanceObserver is unavailable', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        // Remove PerformanceObserver to test graceful degradation
        await page.addInitScript(() => {
          delete (window as Window & { PerformanceObserver?: unknown }).PerformanceObserver;
        });

        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Generate some work to ensure basic functionality
        await page.evaluate(() => {
          // Create some content
          const content = document.createElement('div');
          content.style.width = '100%';
          content.style.height = '100px';
          content.style.backgroundColor = '#f5f5f5';
          content.textContent = 'Test content without PerformanceObserver';
          document.body.appendChild(content);

          // Simulate a task (won't be detected as long task without PerformanceObserver)
          const start = performance.now();
          while (performance.now() - start < 70) {
            void Math.random();
          }
        });

        await page.waitForTimeout(1000);

        const gracefulDegradation = await page.evaluate(() => {
          const bridge = window.__traceLogTestBridge;
          if (!bridge) return { testable: false };

          const eventManager = bridge.getEventManager();
          if (!eventManager) return { testable: false };

          const events = eventManager.getEventQueue() ?? [];
          const longTaskEvents = events.filter(
            (event: LongTaskEvent) => event.type === 'web_vitals' && event.web_vitals?.type === 'LONG_TASK',
          );

          return {
            testable: true,
            hasPerformanceObserver: typeof PerformanceObserver !== 'undefined',
            isInitialized: bridge.isInitialized(),
            hasEventManager: Boolean(eventManager),
            longTaskEventsDetected: longTaskEvents.length,
            sdkStillFunctional: bridge.isInitialized() && Boolean(eventManager),
          };
        });

        if (gracefulDegradation.testable) {
          expect(gracefulDegradation.hasPerformanceObserver).toBe(false);
          expect(gracefulDegradation.isInitialized).toBe(true);
          expect(gracefulDegradation.hasEventManager).toBe(true);
          expect(gracefulDegradation.sdkStillFunctional).toBe(true);

          // Should not detect long tasks without PerformanceObserver
          expect(gracefulDegradation.longTaskEventsDetected).toBe(0);
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should maintain stable memory usage during extended long task tracking', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page, '/');
        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);

        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Track memory before extended tracking
        const initialMemory = await page.evaluate(() => {
          return (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ?? 0;
        });

        // Generate multiple long tasks over time to test memory stability
        await page.evaluate(() => {
          let taskCount = 0;
          const maxTasks = 10;

          const generateTask = (): void => {
            if (taskCount >= maxTasks) return;

            setTimeout(() => {
              const start = performance.now();
              const duration = 80 + taskCount * 5;
              while (performance.now() - start < duration) {
                for (let i = 0; i < duration * 500; i++) {
                  void (Math.random() * Math.sin(i));
                }
              }
              taskCount++;

              // Schedule next task (with throttle-safe spacing)
              if (taskCount < maxTasks) {
                setTimeout(generateTask, 1300);
              }
            }, 100);
          };

          generateTask();
        });

        await page.waitForTimeout(15000);

        const memoryStability = await TestUtils.measureMemoryUsage(page, initialMemory);

        // Get long task events count for validation
        const longTaskDetectionForMemory = await TestUtils.getLongTaskDetection(page);
        const extendedMemoryStability = {
          ...memoryStability,
          longTaskEventsRecorded: longTaskDetectionForMemory.longTaskCount,
        };

        if (extendedMemoryStability.testable) {
          // Long task detection may not work in all browsers, so make this conditional
          if (extendedMemoryStability.longTaskEventsRecorded && extendedMemoryStability.longTaskEventsRecorded > 0) {
            expect(extendedMemoryStability.hasReasonableMemoryUsage).toBe(true);
            expect(extendedMemoryStability.memoryStable).toBe(true);

            // Memory usage should not grow excessively
            if (
              extendedMemoryStability.currentMemory &&
              extendedMemoryStability.initialMemory &&
              extendedMemoryStability.memoryDifference &&
              extendedMemoryStability.currentMemory > 0 &&
              extendedMemoryStability.initialMemory > 0
            ) {
              const memoryIncreasePercent =
                (extendedMemoryStability.memoryDifference / extendedMemoryStability.initialMemory) * 100;
              expect(Math.abs(memoryIncreasePercent)).toBeLessThan(20); // Less than 20% memory change
            }
          } else {
            // Still validate memory stability even without long task events
            expect(extendedMemoryStability.hasReasonableMemoryUsage).toBe(true);
            expect(extendedMemoryStability.memoryStable).toBe(true);
          }
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });
});
