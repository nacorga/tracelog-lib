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
import '../../src/types/window.types';
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

/**
 * Text extraction specific test helpers
 */

/**
 * Setup text extraction test page
 */
export async function setupTextExtractionTest(page: Page): Promise<ConsoleMonitor> {
  const monitor = createConsoleMonitor(page);
  await navigateAndWaitForReady(page, '/pages/text-extraction/');
  const initResult = await initializeTraceLog(page, DEFAULT_CONFIG);

  // Log any initialization errors for debugging
  if (!initResult.success) {
    console.log('TraceLog initialization failed:', initResult.error);
  }

  // Verify initialization using the auto-injected testing bridge
  const isInitialized = await page.evaluate(() => {
    const bridge = window.__traceLogTestBridge;
    return bridge ? bridge.isInitialized() : false;
  });

  if (!isInitialized) {
    throw new Error('TraceLog failed to initialize properly');
  }

  return monitor;
}

/**
 * Click element and capture the generated click event data
 */
export async function clickElementAndCaptureData(
  page: Page,
  selector: string,
): Promise<{ text?: string; tag: string; success: boolean }> {
  return await page.evaluate(async (sel) => {
    const element = document.querySelector(sel);
    if (!element) {
      return { success: false, tag: '', text: undefined };
    }

    let capturedData: any = null;
    const bridge = window.__traceLogTestBridge;

    if (!bridge) {
      return { success: false, tag: element.tagName.toLowerCase(), text: undefined };
    }

    const eventManager = bridge.getEventManager();

    if (!eventManager) {
      return { success: false, tag: element.tagName.toLowerCase(), text: undefined };
    }

    const originalTrack = eventManager.track;

    if (!originalTrack || typeof originalTrack !== 'function') {
      return { success: false, tag: element.tagName.toLowerCase(), text: undefined };
    }

    // Override the track method to capture click events
    eventManager.track = function (eventData: any): any {
      if (eventData.type === 'click') {
        capturedData = eventData.click_data;
      }
      return originalTrack.call(this, eventData);
    };

    // Trigger the click
    (element as HTMLElement).click();

    // Wait a bit for the event to be processed
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Restore original method
    eventManager.track = originalTrack;

    return {
      success: capturedData !== null,
      tag: capturedData?.tag || element.tagName.toLowerCase(),
      text: capturedData?.text,
    };
  }, selector);
}

/**
 * Get element's computed text content for comparison
 */
export async function getElementTextContent(page: Page, selector: string): Promise<string> {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    return element?.textContent?.trim() || '';
  }, selector);
}

/**
 * Test text extraction from multiple elements
 */
export async function testTextExtractionFromElements(
  page: Page,
  elements: Array<{ selector: string; expectedBehavior: string }>,
): Promise<Array<{ selector: string; result: any; expectedBehavior: string }>> {
  const results = [];

  for (const { selector, expectedBehavior } of elements) {
    const result = await clickElementAndCaptureData(page, selector);
    results.push({ selector, result, expectedBehavior });
  }

  return results;
}

/**
 * Verify text length constraints
 */
export function verifyTextLength(text: string | undefined, maxLength = 255): boolean {
  if (!text) return true;
  // Text should never exceed maxLength, even with ellipsis
  return text.length <= maxLength;
}

/**
 * Verify text truncation behavior
 */
export function verifyTextTruncation(
  originalText: string,
  extractedText: string | undefined,
  maxLength = 255,
): { isValid: boolean; reason: string } {
  if (!extractedText) {
    return { isValid: true, reason: 'No text extracted' };
  }

  if (originalText.length <= maxLength) {
    return {
      isValid: extractedText === originalText,
      reason: 'Short text should be preserved exactly',
    };
  }

  const hasTruncationIndicator = extractedText.endsWith('...');
  const shouldBeTruncated = extractedText.length <= maxLength;

  return {
    isValid: shouldBeTruncated && (hasTruncationIndicator || extractedText.length < originalText.length),
    reason: 'Long text should be truncated with proper indicators',
  };
}

/**
 * Verify text sanitization
 */
export function verifyTextSanitization(extractedText: string | undefined): { isValid: boolean; reason: string } {
  if (!extractedText) {
    return { isValid: true, reason: 'No text to sanitize' };
  }

  // When text is extracted via textContent, HTML entities are decoded to their text representation
  // This is expected behavior - the text "<script>" is safe as plain text
  // Only executable script tags in HTML would be dangerous

  // Check for patterns that would indicate actual executable HTML rather than plain text
  const hasExecutableScript = /<script[^>]*>.*<\/script>/gi.test(extractedText);
  const hasExecutableHTML = /<[a-z][^>]*>/gi.test(extractedText) && extractedText.includes('javascript:');

  if (hasExecutableScript || hasExecutableHTML) {
    return { isValid: false, reason: 'Executable HTML/JavaScript detected' };
  }

  return { isValid: true, reason: 'Text appears properly sanitized' };
}

/**
 * Scroll tracking specific test helpers
 */

/**
 * Capture scroll event data with proper encapsulation
 */
export async function captureScrollEventData(
  page: Page,
  scrollAction: () => Promise<void>,
): Promise<{
  captured: boolean;
  scrollData?: {
    depth: number;
    direction: 'up' | 'down';
    [key: string]: any;
  };
}> {
  return await page.evaluate(async (scrollActionStr) => {
    const bridge = window.__traceLogTestBridge;
    const eventManager = bridge?.getEventManager();

    if (!eventManager) {
      return { captured: false };
    }

    let capturedData: any = null;
    const originalTrack = eventManager.track;

    // Override track method to capture scroll events
    eventManager.track = function (eventData: any): any {
      if (eventData.type === 'scroll') {
        capturedData = eventData.scroll_data;
      }
      return originalTrack.call(this, eventData);
    };

    try {
      // Execute the scroll action
      const scrollAction = new Function('return ' + scrollActionStr)();
      await scrollAction();

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 350));

      return {
        captured: capturedData !== null,
        scrollData: capturedData,
      };
    } finally {
      // Restore original method
      eventManager.track = originalTrack;
    }
  }, scrollAction.toString());
}

/**
 * Count scroll events during rapid scrolling
 */
export async function countScrollEventsDuringRapidScroll(
  page: Page,
  scrollPositions: number[],
  intervalMs = 50,
): Promise<{
  eventCount: number;
  eventTimes: number[];
}> {
  return await page.evaluate(
    async ({ positions, interval }: { positions: number[]; interval: number }) => {
      const bridge = window.__traceLogTestBridge;
      const eventManager = bridge?.getEventManager();

      if (!eventManager) {
        return { eventCount: 0, eventTimes: [] };
      }

      const eventTimes: number[] = [];
      const originalTrack = eventManager.track;

      // Override track method to count scroll events
      eventManager.track = function (eventData: any): any {
        if (eventData.type === 'scroll') {
          eventTimes.push(Date.now());
        }
        return originalTrack.call(this, eventData);
      };

      try {
        // Execute rapid scroll actions
        for (const position of positions) {
          window.scrollTo(0, position);
          await new Promise((resolve) => setTimeout(resolve, interval));
        }

        // Wait for debounce to complete
        await new Promise((resolve) => setTimeout(resolve, 400));

        return {
          eventCount: eventTimes.length,
          eventTimes,
        };
      } finally {
        // Restore original method
        eventManager.track = originalTrack;
      }
    },
    {
      positions: scrollPositions,
      interval: intervalMs,
    },
  );
}

/**
 * Test scroll event with specific position and capture result
 */
export async function testScrollToPositionAndCapture(
  page: Page,
  targetPosition: number,
): Promise<{
  success: boolean;
  actualPosition: number;
  scrollData?: {
    depth: number;
    direction: 'up' | 'down';
    [key: string]: any;
  };
}> {
  return await page.evaluate(async (position) => {
    const bridge = window.__traceLogTestBridge;
    const eventManager = bridge?.getEventManager();

    if (!eventManager) {
      return { success: false, actualPosition: 0 };
    }

    let capturedData: any = null;
    const originalTrack = eventManager.track;

    // Override track method to capture scroll events
    eventManager.track = function (eventData: any): any {
      if (eventData.type === 'scroll') {
        capturedData = eventData.scroll_data;
      }
      return originalTrack.call(this, eventData);
    };

    try {
      // Scroll to position
      window.scrollTo(0, position);

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 350));

      return {
        success: capturedData !== null,
        actualPosition: window.scrollY,
        scrollData: capturedData,
      };
    } finally {
      // Restore original method
      eventManager.track = originalTrack;
    }
  }, targetPosition);
}

/**
 * Setup scroll tracking test with proper page height
 */
export async function setupScrollTrackingTest(
  page: Page,
  pageHeight = 3000,
): Promise<{
  monitor: ConsoleMonitor;
  pageInfo: {
    scrollHeight: number;
    viewportHeight: number;
    maxScrollTop: number;
  };
}> {
  const monitor = createConsoleMonitor(page);

  await navigateAndWaitForReady(page, '/');
  const initResult = await initializeTraceLog(page);

  if (!initResult.success) {
    throw new Error('TraceLog initialization failed');
  }

  // Wait for suppressNextScroll to be cleared
  await page.waitForTimeout(600);

  // Create tall page and get dimensions
  const pageInfo = await page.evaluate((height) => {
    const tallDiv = document.createElement('div');
    tallDiv.style.height = `${height}px`;
    tallDiv.style.background = 'linear-gradient(to bottom, #red, #blue)';
    tallDiv.innerHTML = `<h2 style="padding-top: ${height / 2}px;">Middle of page</h2>`;
    document.body.appendChild(tallDiv);

    return {
      scrollHeight: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight,
      maxScrollTop: document.documentElement.scrollHeight - window.innerHeight,
    };
  }, pageHeight);

  return { monitor, pageInfo };
}

/**
 * Test multiple scroll positions and capture all results
 */
export async function testMultipleScrollPositions(
  page: Page,
  positions: number[],
): Promise<
  Array<{
    position: number;
    success: boolean;
    actualPosition: number;
    scrollData?: {
      depth: number;
      direction: 'up' | 'down';
      [key: string]: any;
    };
  }>
> {
  const results = [];

  for (const position of positions) {
    const result = await testScrollToPositionAndCapture(page, position);
    results.push({
      position,
      ...result,
    });
  }

  return results;
}

/**
 * Setup a non-scrollable page test
 */
export async function setupNonScrollablePageTest(
  page: Page,
  pageHeight = 200,
): Promise<{
  monitor: ConsoleMonitor;
}> {
  const monitor = createConsoleMonitor(page);

  await navigateAndWaitForReady(page, '/');
  const initResult = await initializeTraceLog(page);

  if (!initResult.success) {
    throw new Error('TraceLog initialization failed');
  }

  // Wait for suppressNextScroll to be cleared
  await page.waitForTimeout(600);

  // Create short page (no scrolling possible)
  await page.evaluate((height) => {
    const shortDiv = document.createElement('div');
    shortDiv.style.height = `${height}px`;
    shortDiv.innerHTML = `<div style="height: 100%; background: red;">Short content</div>`;
    document.body.appendChild(shortDiv);
  }, pageHeight);

  return { monitor };
}

/**
 * Test scroll percentage calculations for various page heights
 */
export async function testScrollPercentageCalculations(
  page: Page,
  testCases: Array<{
    height: number;
    scrollTo: number;
    expectedDepth?: number;
    expectedRange?: [number, number];
  }>,
): Promise<
  Array<{
    height: number;
    scrollTo: number;
    scrollDepth: number | null;
    success: boolean;
  }>
> {
  const results = [];

  for (const testCase of testCases) {
    const { monitor } = await setupScrollTrackingTest(page, testCase.height);

    try {
      let result;

      // For scrollTo 0, we need to scroll from a different position first to create movement
      if (testCase.scrollTo === 0) {
        // First scroll to a middle position to establish a starting point
        await page.evaluate(() => window.scrollTo(0, 800));
        await page.waitForTimeout(350);

        // Then scroll to 0 to trigger the event
        result = await testScrollToPositionAndCapture(page, testCase.scrollTo);
      } else {
        // For non-zero positions, scroll from 0
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(100);
        result = await testScrollToPositionAndCapture(page, testCase.scrollTo);
      }

      results.push({
        height: testCase.height,
        scrollTo: testCase.scrollTo,
        scrollDepth: result.scrollData?.depth ?? null,
        success: result.success,
      });
    } finally {
      monitor.cleanup();
    }
  }

  return results;
}

/**
 * Test scroll depth bounds validation (0-100%)
 */
export async function testScrollDepthBounds(
  page: Page,
  positions: number[],
  pageHeight = 5000,
): Promise<{
  capturedDepths: number[];
  allWithinBounds: boolean;
  monitor: ConsoleMonitor;
}> {
  const monitor = createConsoleMonitor(page);

  await navigateAndWaitForReady(page, '/');
  const initResult = await initializeTraceLog(page);

  if (!initResult.success) {
    throw new Error('TraceLog initialization failed');
  }

  // Wait for suppressNextScroll to be cleared
  await page.waitForTimeout(600);

  // Create a tall page
  await page.evaluate((height) => {
    const tallDiv = document.createElement('div');
    tallDiv.style.height = `${height}px`;
    tallDiv.innerHTML = '<div style="height: 100%; background: linear-gradient(to bottom, red, blue);"></div>';
    document.body.appendChild(tallDiv);
  }, pageHeight);

  const capturedDepths = await page.evaluate(async (testPositions) => {
    const depths: number[] = [];
    const bridge = window.__traceLogTestBridge;
    const eventManager = bridge?.getEventManager();

    if (!eventManager) {
      return depths;
    }

    const originalTrack = eventManager.track;

    // Override track method to capture scroll events
    eventManager.track = function (eventData: any): any {
      if (eventData.type === 'scroll') {
        if (eventData.scroll_data?.depth !== undefined) {
          depths.push(eventData.scroll_data.depth);
        }
      }
      return originalTrack.call(this, eventData);
    };

    try {
      // Test various scroll positions including edge cases
      for (const position of testPositions) {
        window.scrollTo(0, position);
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      // Scroll to bottom
      window.scrollTo(0, document.documentElement.scrollHeight);
      await new Promise((resolve) => setTimeout(resolve, 300));

      return depths;
    } finally {
      // Restore original method
      eventManager.track = originalTrack;
    }
  }, positions);

  const allWithinBounds = capturedDepths.every((depth) => depth >= 0 && depth <= 100);

  return { capturedDepths, allWithinBounds, monitor };
}

/**
 * Test scroll direction detection
 */
export async function testScrollDirection(
  page: Page,
  fromPosition: number,
  toPosition: number,
): Promise<{
  success: boolean;
  direction: 'up' | 'down' | null;
  monitor: ConsoleMonitor;
}> {
  const { monitor } = await setupScrollTrackingTest(page);

  // Start from the initial position and wait for it to settle
  await page.evaluate((pos) => window.scrollTo(0, pos), fromPosition);
  await page.waitForTimeout(350); // Wait longer for scroll to settle

  // Now scroll to the target position and capture the direction
  const result = await testScrollToPositionAndCapture(page, toPosition);

  return {
    success: result.success,
    direction: result.scrollData?.direction || null,
    monitor,
  };
}

/**
 * Test multiple scroll direction changes
 */
export async function testScrollDirectionChanges(
  page: Page,
  scrollSequence: number[],
): Promise<{
  directions: Array<'up' | 'down' | null>;
  monitor: ConsoleMonitor;
}> {
  const { monitor } = await setupScrollTrackingTest(page);
  const directions: Array<'up' | 'down' | null> = [];

  for (let i = 1; i < scrollSequence.length; i++) {
    const result = await testScrollToPositionAndCapture(page, scrollSequence[i]);
    directions.push(result.scrollData?.direction || null);
  }

  return { directions, monitor };
}

/**
 * Test scroll event throttling with timing validation
 */
export async function testScrollEventThrottling(
  page: Page,
  scrollPositions: number[],
  intervalMs = 50,
): Promise<{
  eventTimes: number[];
  eventCount: number;
  monitor: ConsoleMonitor;
}> {
  const { monitor } = await setupScrollTrackingTest(page);

  const result = await page.evaluate(
    async ({ positions, interval }: { positions: number[]; interval: number }) => {
      const eventTimes: number[] = [];
      const bridge = window.__traceLogTestBridge;
      const eventManager = bridge?.getEventManager();

      if (!eventManager) {
        return { eventTimes: [], eventCount: 0 };
      }

      const originalTrack = eventManager.track;

      eventManager.track = function (eventData: any): any {
        if (eventData.type === 'scroll') {
          eventTimes.push(Date.now());
        }
        return originalTrack.call(this, eventData);
      };

      try {
        for (const position of positions) {
          window.scrollTo(0, position);
          await new Promise((resolve) => setTimeout(resolve, interval));
        }

        // Wait for debounce to complete
        await new Promise((resolve) => setTimeout(resolve, 400));

        return {
          eventTimes,
          eventCount: eventTimes.length,
        };
      } finally {
        eventManager.track = originalTrack;
      }
    },
    { positions: scrollPositions, interval: intervalMs },
  );

  return {
    ...result,
    monitor,
  };
}

/**
 * Test scroll event data structure validation
 */
export async function testScrollEventDataStructure(
  page: Page,
  scrollPosition: number,
): Promise<{
  success: boolean;
  eventData: any;
  hasTimestamp: boolean;
  monitor: ConsoleMonitor;
}> {
  const { monitor } = await setupScrollTrackingTest(page);

  const result = await page.evaluate(async (position: number) => {
    const bridge = window.__traceLogTestBridge;
    const eventManager = bridge?.getEventManager();

    if (!eventManager) {
      return { success: false, eventData: null, hasTimestamp: false };
    }

    let capturedEventData: any = null;
    const originalTrack = eventManager.track;

    eventManager.track = function (eventData: any): any {
      if (eventData.type === 'scroll') {
        capturedEventData = {
          type: eventData.type,
          scroll_data: eventData.scroll_data,
          hasTimestamp: 'timestamp' in eventData || 'time' in eventData,
        };
      }
      return originalTrack.call(this, eventData);
    };

    try {
      window.scrollTo(0, position);
      await new Promise((resolve) => setTimeout(resolve, 350));

      return {
        success: capturedEventData !== null,
        eventData: capturedEventData,
        hasTimestamp: capturedEventData?.hasTimestamp || false,
      };
    } finally {
      eventManager.track = originalTrack;
    }
  }, scrollPosition);

  return {
    ...result,
    monitor,
  };
}

/**
 * Test continuous scrolling event prevention
 */
export async function testContinuousScrollingEventPrevention(
  page: Page,
  scrollDuration = 2000,
  scrollInterval = 25,
): Promise<{
  eventCount: number;
  scrollSteps: number;
  monitor: ConsoleMonitor;
}> {
  const { monitor } = await setupScrollTrackingTest(page, 10000); // Very tall page

  const scrollSteps = scrollDuration / scrollInterval;

  const result = await page.evaluate(
    async ({ duration, interval }: { duration: number; interval: number }) => {
      let eventCount = 0;
      const steps = duration / interval;
      const bridge = window.__traceLogTestBridge;
      const eventManager = bridge?.getEventManager();

      if (!eventManager) {
        return { eventCount: 0 };
      }

      const originalTrack = eventManager.track;

      eventManager.track = function (eventData: any): any {
        if (eventData.type === 'scroll') {
          eventCount++;
        }
        return originalTrack.call(this, eventData);
      };

      try {
        for (let i = 1; i <= steps; i++) {
          window.scrollTo(0, i * 50);
          await new Promise((resolve) => setTimeout(resolve, interval));
        }

        // Wait for debounce to complete
        await new Promise((resolve) => setTimeout(resolve, 400));

        return { eventCount };
      } finally {
        eventManager.track = originalTrack;
      }
    },
    { duration: scrollDuration, interval: scrollInterval },
  );

  return {
    eventCount: result.eventCount,
    scrollSteps,
    monitor,
  };
}
