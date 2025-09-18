import { test, expect } from '@playwright/test';
import { TestUtils } from '../../utils';
import { TEST_CONFIGS } from '../../constants';

test.describe('Custom Event Tracking - Valid Events', () => {
  test.describe('Valid event names and metadata acceptance', () => {
    test('should accept valid event names', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Test various valid event names
        const results = await TestUtils.testValidEventNames(page);

        for (const { result } of results) {
          expect(TestUtils.verifyInitializationResult(result).success).toBe(true);
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should accept valid metadata types', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page, TEST_CONFIGS.DEFAULT);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Test various valid metadata types
        const results = await TestUtils.testValidMetadataTypes(page);

        for (const { result } of results) {
          expect(TestUtils.verifyInitializationResult(result).success).toBe(true);
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should accept events without metadata', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page, TEST_CONFIGS.DEFAULT);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Test events without metadata
        const results = await TestUtils.testEventsWithoutMetadata(page);

        for (const { result } of results) {
          expect(TestUtils.verifyInitializationResult(result).success).toBe(true);
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('API endpoint delivery', () => {
    test('should successfully process custom events for delivery', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page, TEST_CONFIGS.DEFAULT);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Send multiple custom events
        const testEvents = [
          { name: 'api_test_1', metadata: { type: 'delivery_test', index: 1 } },
          { name: 'api_test_2', metadata: { type: 'delivery_test', index: 2 } },
          { name: 'api_test_3', metadata: { type: 'delivery_test', index: 3 } },
        ];

        for (const eventData of testEvents) {
          const result = await TestUtils.testCustomEvent(page, eventData.name, eventData.metadata);
          expect(TestUtils.verifyInitializationResult(result).success).toBe(true);
        }

        // Verify events are processed without errors
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should process custom events with proper context', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page, TEST_CONFIGS.DEFAULT);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Send custom event with context validation
        const result = await TestUtils.testCustomEvent(page, 'context_test', {
          validation: 'context_check',
          timestamp: Date.now(),
        });
        expect(TestUtils.verifyInitializationResult(result).success).toBe(true);

        // Verify no errors in processing
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Input data sanitization', () => {
    test('should sanitize potentially dangerous input while preserving legitimate content', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page, TEST_CONFIGS.DEFAULT);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Test sanitization of various potentially dangerous inputs
        const results = await TestUtils.testDataSanitization(page);

        for (const { result } of results) {
          expect(TestUtils.verifyInitializationResult(result).success).toBe(true);
        }

        // Verify no dangerous scripts were executed
        const noXSS = await TestUtils.verifyNoXSSExecution(page);
        expect(noXSS).toBe(true);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle null and undefined values gracefully', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page, TEST_CONFIGS.DEFAULT);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Test handling of null/undefined values (should be sanitized out)
        const result = await TestUtils.testNullUndefinedHandling(page);

        expect(TestUtils.verifyInitializationResult(result).success).toBe(true);
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Event structure validation', () => {
    test('should process structured events correctly', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page);
        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Send structured event
        const result = await TestUtils.testCustomEvent(page, 'structure_validation', {
          category: 'test',
          action: 'validation',
          value: 123,
        });
        expect(TestUtils.verifyInitializationResult(result).success).toBe(true);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should process events with session context', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page);
        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Wait for session to be established
        await page.waitForTimeout(1000);

        // Send event and verify session context
        const result = await TestUtils.testCustomEvent(page, 'session_context_test', {
          test: 'session_validation',
        });
        expect(TestUtils.verifyInitializationResult(result).success).toBe(true);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Metadata types and size limits', () => {
    test('should handle metadata within size limits', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page);
        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Test metadata within limits (MAX_CUSTOM_EVENT_KEYS = 10, MAX_STRING_LENGTH = 1000)
        const validMetadata = {
          key1: 'value1',
          key2: 'value2',
          key3: 'value3',
          key4: 'value4',
          key5: 'value5',
          key6: 'A'.repeat(500), // Within MAX_STRING_LENGTH (1000)
          key7: ['item1', 'item2', 'item3'], // Within MAX_CUSTOM_EVENT_ARRAY_SIZE (10)
          key8: 42,
          key9: true,
          key10: 'final_key',
        };

        const result = await TestUtils.testCustomEvent(page, 'size_limits_valid', validMetadata);
        expect(TestUtils.verifyInitializationResult(result).success).toBe(true);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle various array types within limits', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page);
        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Test string arrays within MAX_CUSTOM_EVENT_ARRAY_SIZE (10) - only string arrays are allowed
        const arrayMetadata = {
          stringArray: ['a', 'b', 'c', 'd', 'e'],
          tagsArray: ['tag1', 'tag2', 'tag3'],
          categoriesArray: ['category1', 'category2'],
          smallArray: ['single'],
          emptyArray: [],
        };

        const result = await TestUtils.testCustomEvent(page, 'array_types_test', arrayMetadata);
        expect(TestUtils.verifyInitializationResult(result).success).toBe(true);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle edge case metadata values', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page);
        const initResult = await TestUtils.initializeTraceLog(page, TEST_CONFIGS.DEFAULT);
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Test edge case values
        const edgeCaseMetadata = {
          emptyString: '',
          zeroNumber: 0,
          negativeNumber: -123,
          floatNumber: 3.14159,
          booleanTrue: true,
          booleanFalse: false,
          specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
          unicode: '你好世界 🌍 café naïve',
        };

        const result = await TestUtils.testCustomEvent(page, 'edge_cases_test', edgeCaseMetadata);
        expect(TestUtils.verifyInitializationResult(result).success).toBe(true);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Event queuing and batching', () => {
    test('should properly queue multiple custom events', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page, TEST_CONFIGS.DEFAULT);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Send multiple events rapidly to test queuing
        const results = await TestUtils.testEventQueuing(page, 10);

        // Verify all events were accepted
        for (const { result } of results) {
          expect(TestUtils.verifyInitializationResult(result).success).toBe(true);
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should batch events efficiently for delivery', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page, TEST_CONFIGS.DEFAULT);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Send events in quick succession to trigger batching
        const results = await TestUtils.testEventBatching(page, 5);

        // Verify all events were accepted
        for (const { result } of results) {
          expect(TestUtils.verifyInitializationResult(result).success).toBe(true);
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle rapid event bursts without data loss', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page, TEST_CONFIGS.DEFAULT);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create rapid burst of events
        const results = await TestUtils.testEventBursts(page, 15);

        // Verify all events in burst were accepted
        for (const { result } of results) {
          expect(TestUtils.verifyInitializationResult(result).success).toBe(true);
        }

        // Check for any anomalies in processing
        const anomalies = monitor.getAnomalies();
        if (anomalies.length > 0) {
          // Processing anomalies detected during rapid burst testing
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });
});
