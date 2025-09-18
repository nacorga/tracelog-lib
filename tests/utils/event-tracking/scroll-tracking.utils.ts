import { Page } from '@playwright/test';
import { createConsoleMonitor, navigateAndWaitForReady, initializeTraceLog } from '../common.utils';
import { ConsoleMonitor } from '../../types';

/**
 * Scroll Tracking Testing Helpers
 * Functions for testing standard window scroll event functionality
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

  // Create tall page with exact height and get dimensions
  const pageInfo = await page.evaluate((height) => {
    // Clear existing content first
    document.body.innerHTML = '';

    const tallDiv = document.createElement('div');
    tallDiv.style.height = `${height}px`;
    tallDiv.style.background = 'linear-gradient(to bottom, red, blue)';
    tallDiv.innerHTML = `<div style="height: 50px; margin-top: ${height / 2}px;">Middle marker</div>`;
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

  // First, clear existing content and make page non-scrollable
  await page.evaluate((height) => {
    // Clear existing content
    document.body.innerHTML = '';

    // Set body and html to exact height to prevent scrolling
    document.body.style.height = `${height}px`;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.height = `${height}px`;
    document.documentElement.style.overflow = 'hidden';

    // Add minimal content
    const shortDiv = document.createElement('div');
    shortDiv.style.height = `${height}px`;
    shortDiv.style.overflow = 'hidden';
    shortDiv.innerHTML = `<div style="height: 100%; background: red;">Short content</div>`;
    document.body.appendChild(shortDiv);
  }, pageHeight);

  // Now initialize TraceLog on a truly non-scrollable page
  const initResult = await initializeTraceLog(page);

  if (!initResult.success) {
    throw new Error('TraceLog initialization failed');
  }

  // Wait for suppressNextScroll to be cleared
  await page.waitForTimeout(600);

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
    // Clean up any existing content before each test case
    await page.evaluate(() => {
      // Remove any existing test content
      const existingDivs = document.querySelectorAll('div[style*="height"]');
      existingDivs.forEach((div) => div.remove());
    });

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
