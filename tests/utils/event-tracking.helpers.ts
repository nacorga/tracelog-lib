import { Page } from '@playwright/test';
import {
  createConsoleMonitor,
  ConsoleMonitor,
  navigateAndWaitForReady,
  initializeTraceLog,
  testCustomEvent,
  triggerClickEvent,
  triggerScrollEvent,
  waitForTimeout,
  DEFAULT_CONFIG,
  TEST_URLS,
} from './common.helpers';
import { Config } from '../../src/types';

/**
 * Event Tracking specific test constants
 */

// Event validation limits (from src/constants/limits.constants.ts)
export const MAX_CUSTOM_EVENT_NAME_LENGTH = 120;
export const MAX_CUSTOM_EVENT_STRING_SIZE = 8 * 1024; // 8KB
export const MAX_CUSTOM_EVENT_KEYS = 10;
export const MAX_CUSTOM_EVENT_ARRAY_SIZE = 10;
export const MAX_STRING_LENGTH = 1000;

// Test timing constants
export const EVENT_PROCESSING_WAIT_MS = 1000;
export const BATCH_PROCESSING_WAIT_MS = 2000;
export const BURST_PROCESSING_WAIT_MS = 4000;

// Test data sets
export const VALID_EVENT_NAMES = [
  'user_signup',
  'button_click',
  'page_view_custom',
  'form_submit',
  'video_play',
  'download_started',
  'search_performed',
  'cart_item_added',
  'checkout_completed',
  'user_login',
];

export const EDGE_CASE_METADATA = {
  emptyString: '',
  zeroNumber: 0,
  negativeNumber: -123,
  floatNumber: 3.14159,
  booleanTrue: true,
  booleanFalse: false,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  unicode: '你好世界 🌍 café naïve',
};

export const SANITIZATION_TEST_CASES = [
  {
    name: 'html_content',
    metadata: {
      content: 'Normal text <script>alert("xss")</script> more text',
      description: 'This should be sanitized',
    },
  },
  {
    name: 'special_chars',
    metadata: {
      message: 'User input with "quotes" and \'apostrophes\' and symbols @#$%',
      data: 'Normal content should remain',
    },
  },
  {
    name: 'unicode_content',
    metadata: {
      text: 'Unicode content: 你好 🎉 café naïve résumé',
      emoji: '😀🎯🚀',
    },
  },
];

/**
 * Event Tracking specific test helpers
 */
/**
 * Setup a standard event tracking test with initialization
 */
export async function setupEventTrackingTest(
  page: Page,
  config: Config = DEFAULT_CONFIG,
  testUrl: string = TEST_URLS.INITIALIZATION_PAGE,
): Promise<{
  monitor: ConsoleMonitor;
  initResult: unknown;
}> {
  const monitor = createConsoleMonitor(page);

  await navigateAndWaitForReady(page, testUrl);
  const initResult = await initializeTraceLog(page, config);

  return { monitor, initResult };
}

/**
 * Test multiple valid event names
 */
export async function testValidEventNames(
  page: Page,
  eventNames: string[] = VALID_EVENT_NAMES,
): Promise<Array<{ name: string; result: unknown }>> {
  const results = [];

  for (const eventName of eventNames) {
    const result = await testCustomEvent(page, eventName, { test: true });
    results.push({ name: eventName, result });
  }

  return results;
}

/**
 * Test various metadata types
 */
export async function testValidMetadataTypes(page: Page): Promise<Array<{ name: string; result: unknown }>> {
  const validMetadataTests = [
    { name: 'string_metadata', metadata: { category: 'user_action', source: 'button' } },
    { name: 'number_metadata', metadata: { value: 123, price: 19.99, quantity: 5 } },
    { name: 'boolean_metadata', metadata: { success: true, authenticated: false } },
    { name: 'array_metadata', metadata: { tags: ['important', 'urgent', 'user'], categories: ['A', 'B'] } },
    { name: 'mixed_metadata', metadata: { id: 'user_123', count: 42, active: true, labels: ['new', 'premium'] } },
  ];

  const results = [];

  for (const testCase of validMetadataTests) {
    const result = await testCustomEvent(page, testCase.name, testCase.metadata);
    results.push({ name: testCase.name, result });
  }

  return results;
}

/**
 * Test events without metadata
 */
export async function testEventsWithoutMetadata(page: Page): Promise<Array<{ name: string; result: unknown }>> {
  const eventNamesOnly = ['simple_event', 'no_metadata_event', 'basic_tracking'];
  const results = [];

  for (const eventName of eventNamesOnly) {
    const result = await page.evaluate((name) => {
      try {
        (window as any).TraceLog.event(name);
        return { success: true, error: null };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }, eventName);
    results.push({ name: eventName, result });
  }

  return results;
}

/**
 * Test data sanitization scenarios
 */
export async function testDataSanitization(page: Page): Promise<Array<{ name: string; result: unknown }>> {
  const results = [];

  for (const testCase of SANITIZATION_TEST_CASES) {
    const result = await testCustomEvent(page, testCase.name, testCase.metadata);
    results.push({ name: testCase.name, result });
  }

  return results;
}

/**
 * Test null/undefined handling
 */
export async function testNullUndefinedHandling(page: Page): Promise<unknown> {
  return await page.evaluate(() => {
    try {
      (window as any).TraceLog.event('null_test', {
        validField: 'valid_value',
        nullField: null,
        undefinedField: undefined,
        emptyString: '',
        zeroValue: 0,
        falseValue: false,
      });
      return { success: true, error: null };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}

/**
 * Test metadata within size limits
 */
export async function testMetadataWithinLimits(page: Page): Promise<unknown> {
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

  return await testCustomEvent(page, 'size_limits_valid', validMetadata);
}

/**
 * Test string arrays within limits
 */
export async function testStringArraysWithinLimits(page: Page): Promise<unknown> {
  // Test string arrays within MAX_CUSTOM_EVENT_ARRAY_SIZE (10) - only string arrays are allowed
  const arrayMetadata = {
    stringArray: ['a', 'b', 'c', 'd', 'e'],
    tagsArray: ['tag1', 'tag2', 'tag3'],
    categoriesArray: ['category1', 'category2'],
    smallArray: ['single'],
    emptyArray: [],
  };

  return await testCustomEvent(page, 'array_types_test', arrayMetadata);
}

/**
 * Test edge case metadata values
 */
export async function testEdgeCaseMetadata(page: Page): Promise<unknown> {
  return await testCustomEvent(page, 'edge_cases_test', EDGE_CASE_METADATA);
}

/**
 * Test multiple events rapidly for queuing
 */
export async function testEventQueuing(page: Page, eventCount = 10): Promise<Array<{ name: string; result: unknown }>> {
  const eventPromises = [];
  for (let i = 0; i < eventCount; i++) {
    eventPromises.push(
      testCustomEvent(page, `queue_test_${i}`, {
        index: i,
        batch: 'queuing_test',
        timestamp: Date.now(),
      }),
    );
  }

  const results = await Promise.all(eventPromises);
  return results.map((result, index) => ({ name: `queue_test_${index}`, result }));
}

/**
 * Test event batching
 */
export async function testEventBatching(page: Page, batchSize = 5): Promise<Array<{ name: string; result: unknown }>> {
  const results = [];

  for (let i = 0; i < batchSize; i++) {
    const result = await testCustomEvent(page, `batch_test_${i}`, {
      batchId: 'efficiency_test',
      sequence: i,
    });
    results.push({ name: `batch_test_${i}`, result });
  }

  // Trigger additional interactions to potentially flush the batch
  await triggerClickEvent(page);
  await triggerScrollEvent(page);

  return results;
}

/**
 * Test rapid event bursts
 */
export async function testEventBursts(page: Page, burstSize = 15): Promise<Array<{ name: string; result: unknown }>> {
  const startTime = Date.now();

  const burstPromises = Array.from({ length: burstSize }, (_, i) =>
    testCustomEvent(page, `burst_test_${i}`, {
      burstId: 'rapid_burst',
      eventIndex: i,
      burstStart: startTime,
    }),
  );

  const results = await Promise.all(burstPromises);
  return results.map((result, index) => ({ name: `burst_test_${index}`, result }));
}

/**
 * Verify no XSS was executed during sanitization tests
 */
export async function verifyNoXSSExecution(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    // Check if any alert was triggered (would indicate XSS)
    return !(window as any).alertTriggered;
  });
}

/**
 * Wait for event processing
 */
export async function waitForEventProcessing(
  page: Page,
  type: 'standard' | 'batch' | 'burst' = 'standard',
): Promise<void> {
  const waitTime = {
    standard: EVENT_PROCESSING_WAIT_MS,
    batch: BATCH_PROCESSING_WAIT_MS,
    burst: BURST_PROCESSING_WAIT_MS,
  }[type];

  await waitForTimeout(page, waitTime);
}
