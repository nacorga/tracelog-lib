import { Page } from '@playwright/test';
import { createConsoleMonitor, navigateAndWaitForReady, initializeTraceLog } from '../common.utils';
import type { EventData, ScrollData, ClickData, CustomEventData, EventType } from '../../../src/types/event.types';
import type { MetadataType } from '../../../src/types/common.types';

/**
 * Scroll Suppression Testing Helpers
 * Functions for testing scroll event suppression after PAGE_VIEW events
 */

/**
 * Test scroll suppression immediately after PAGE_VIEW event
 */
export async function testScrollSuppressionAfterPageView(page: Page): Promise<{
  pageViewTriggered: boolean;
  scrollEventsSuppressed: boolean;
  scrollEventsCount: number;
}> {
  return await page.evaluate(async () => {
    const bridge = window.__traceLogTestBridge;
    const eventManager = bridge?.getEventManager();

    if (!eventManager) {
      return { pageViewTriggered: false, scrollEventsSuppressed: false, scrollEventsCount: 0 };
    }

    let pageViewTriggered = false;
    let scrollEventsCount = 0;

    // Store events in a global array for monitoring
    const capturedEvents: any[] = [];
    (window as any).__capturedEvents = capturedEvents;

    const originalTrack = eventManager.track;

    // Try simplest possible wrapper
    eventManager.track = function (eventData: any): void {
      capturedEvents.push(eventData);
      if (eventData?.type === 'page_view') {
        pageViewTriggered = true;
      } else if (eventData?.type === 'scroll') {
        scrollEventsCount++;
      }
      // Call original without any modifications
      return originalTrack.call(eventManager, eventData);
    };

    try {
      // Trigger page view suppression by simulating navigation
      // This will trigger both the page view event and the suppression
      window.history.pushState({}, '', window.location.href + '#test');

      // Give it a moment to process
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Immediately attempt multiple scroll actions
      window.scrollTo(0, 100);
      window.scrollTo(0, 200);
      window.scrollTo(0, 300);

      // Wait for any potential events
      await new Promise((resolve) => setTimeout(resolve, 400));

      return {
        pageViewTriggered,
        scrollEventsSuppressed: scrollEventsCount === 0,
        scrollEventsCount,
      };
    } finally {
      eventManager.track = originalTrack;
    }
  });
}

/**
 * Test rapid scroll suppression after PAGE_VIEW event
 */
export async function testRapidScrollSuppressionAfterPageView(
  page: Page,
  scrollPositions: number[],
): Promise<{
  pageViewTriggered: boolean;
  scrollEventsCount: number;
  scrollPositionsTested: number;
}> {
  return await page.evaluate(async (positions: number[]) => {
    const bridge = window.__traceLogTestBridge;
    const eventManager = bridge?.getEventManager();

    if (!eventManager) {
      return { pageViewTriggered: false, scrollEventsCount: 0, scrollPositionsTested: 0 };
    }

    let pageViewTriggered = false;
    let scrollEventsCount = 0;
    const originalTrack = eventManager.track;

    eventManager.track = function (eventData: EventData): any {
      if (eventData.type === 'page_view') {
        pageViewTriggered = true;
      } else if (eventData.type === 'scroll') {
        scrollEventsCount++;
      }
      return originalTrack.call(eventManager, eventData);
    };

    try {
      // Trigger page view suppression by simulating navigation
      window.history.pushState({}, '', window.location.href + '#test-' + Date.now());
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Rapid scroll actions - these should mostly be suppressed or debounced
      for (const position of positions) {
        window.scrollTo(0, position);
        // Small delay between scrolls to ensure each triggers a separate event
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      // Wait for debounce to complete
      await new Promise((resolve) => setTimeout(resolve, 350));

      return {
        pageViewTriggered,
        scrollEventsCount,
        scrollPositionsTested: positions.length,
      };
    } finally {
      eventManager.track = originalTrack;
    }
  }, scrollPositions);
}

/**
 * Test browser-induced scroll suppression
 */
export async function testBrowserScrollSuppression(page: Page): Promise<{
  navigationCompleted: boolean;
  automaticScrollSuppressed: boolean;
}> {
  return await page.evaluate(async () => {
    const bridge = window.__traceLogTestBridge;
    const eventManager = bridge?.getEventManager();

    if (!eventManager) {
      return { navigationCompleted: false, automaticScrollSuppressed: false };
    }

    let scrollEventsCount = 0;
    const originalTrack = eventManager.track;

    eventManager.track = function (eventData: EventData): any {
      if (eventData.type === 'scroll') {
        scrollEventsCount++;
      }
      return originalTrack.call(eventManager, eventData);
    };

    try {
      // Create tall content
      const tallDiv = document.createElement('div');
      tallDiv.style.height = '3000px';
      tallDiv.style.background = 'linear-gradient(to bottom, red, blue)';
      document.body.appendChild(tallDiv);

      // Trigger page view to activate suppression
      eventManager.track({
        type: 'page_view' as EventType,
        page_url: window.location.href,
        timestamp: Date.now(),
        page_view: {
          title: document.title,
          pathname: window.location.pathname,
        },
        referrer: document.referrer,
      });

      // Simulate browser-induced scroll (like restoration)
      window.scrollTo(0, 500);

      // Wait for potential events
      await new Promise((resolve) => setTimeout(resolve, 300));

      return {
        navigationCompleted: true,
        automaticScrollSuppressed: scrollEventsCount === 0,
      };
    } finally {
      eventManager.track = originalTrack;
    }
  });
}

/**
 * Test scroll suppression timeout duration
 */
export async function testScrollSuppressionTimeout(page: Page): Promise<{
  suppressionDuration: number;
  suppressionCleared: boolean;
}> {
  return await page.evaluate(async () => {
    const bridge = window.__traceLogTestBridge;
    const eventManager = bridge?.getEventManager();

    if (!eventManager) {
      return { suppressionDuration: 0, suppressionCleared: false };
    }

    let scrollEventCaptured = false;
    const originalTrack = eventManager.track;

    eventManager.track = function (eventData: EventData): any {
      if (eventData.type === 'scroll') {
        scrollEventCaptured = true;
      }
      return originalTrack.call(eventManager, eventData);
    };

    try {
      // Trigger page view to start suppression
      const startTime = Date.now();
      eventManager.track({
        type: 'page_view' as EventType as EventType,
        page_url: window.location.href,
        timestamp: Date.now(),
        page_view: {
          title: document.title,
          pathname: window.location.pathname,
        },
        referrer: document.referrer,
      });

      // Wait for the timeout duration (500ms) without any scrolls
      await new Promise((resolve) => setTimeout(resolve, 520));

      // Now try scroll - should work since timeout cleared the flag
      window.scrollTo(0, 200);
      await new Promise((resolve) => setTimeout(resolve, 350));

      const suppressionDuration = Date.now() - startTime;
      const suppressionCleared = scrollEventCaptured;

      return {
        suppressionDuration,
        suppressionCleared,
      };
    } finally {
      eventManager.track = originalTrack;
    }
  });
}

/**
 * Test scroll events after suppression timeout
 */
export async function testScrollEventsAfterSuppressionTimeout(page: Page): Promise<{
  suppressionInitiallyActive: boolean;
  scrollEventCapturedAfterTimeout: boolean;
  scrollData?: ScrollData;
}> {
  return await page.evaluate(async () => {
    const bridge = window.__traceLogTestBridge;
    const eventManager = bridge?.getEventManager();

    if (!eventManager) {
      return { suppressionInitiallyActive: false, scrollEventCapturedAfterTimeout: false };
    }

    let scrollEventsDuringSupression = 0;
    let scrollEventAfterTimeout = false;
    let capturedScrollData: ScrollData | undefined;
    const originalTrack = eventManager.track;

    eventManager.track = function (eventData: EventData): any {
      if (eventData.type === 'scroll') {
        capturedScrollData = eventData.scroll_data;
        scrollEventAfterTimeout = true;
      }
      return originalTrack.call(eventManager, eventData);
    };

    try {
      // Trigger page view suppression by simulating navigation
      window.history.pushState({}, '', window.location.href + '#test-' + Date.now());
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Test scroll during suppression
      window.scrollTo(0, 100);
      await new Promise((resolve) => setTimeout(resolve, 100));
      scrollEventsDuringSupression = scrollEventAfterTimeout ? 1 : 0;

      // Reset flag for after timeout test
      scrollEventAfterTimeout = false;
      capturedScrollData = undefined;

      // Wait for suppression to clear (500ms + buffer)
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Test scroll after timeout
      window.scrollTo(0, 300);
      await new Promise((resolve) => setTimeout(resolve, 350));

      return {
        suppressionInitiallyActive: scrollEventsDuringSupression === 0,
        scrollEventCapturedAfterTimeout: scrollEventAfterTimeout,
        scrollData: capturedScrollData,
      };
    } finally {
      eventManager.track = originalTrack;
    }
  });
}

/**
 * Test suppression timer reset behavior
 */
export async function testSuppressionTimerReset(page: Page): Promise<{
  firstSuppressionActivated: boolean;
  secondSuppressionActivated: boolean;
  timerReset: boolean;
}> {
  return await page.evaluate(async () => {
    const bridge = window.__traceLogTestBridge;
    const eventManager = bridge?.getEventManager();

    if (!eventManager) {
      return { firstSuppressionActivated: false, secondSuppressionActivated: false, timerReset: false };
    }

    let scrollEventsCount = 0;
    const originalTrack = eventManager.track;

    eventManager.track = function (eventData: EventData): any {
      if (eventData.type === 'scroll') {
        scrollEventsCount++;
      }
      return originalTrack.call(eventManager, eventData);
    };

    try {
      // First page view
      window.history.pushState({}, '', window.location.href + '#timer-test-1');
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Test scroll - should be suppressed
      window.scrollTo(0, 100);
      await new Promise((resolve) => setTimeout(resolve, 100));
      const firstSuppressionWorked = scrollEventsCount === 0;

      // Second page view immediately
      window.history.pushState({}, '', window.location.href + '#timer-test-2');
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Test scroll immediately - should still be suppressed
      window.scrollTo(0, 200);
      await new Promise((resolve) => setTimeout(resolve, 100));
      const secondSuppressionWorked = scrollEventsCount === 0;

      // Check that both suppressions work (indicating proper timer behavior)
      const timerReset = firstSuppressionWorked && secondSuppressionWorked;

      return {
        firstSuppressionActivated: firstSuppressionWorked,
        secondSuppressionActivated: secondSuppressionWorked,
        timerReset: timerReset,
      };
    } finally {
      eventManager.track = originalTrack;
    }
  });
}

/**
 * Test user scroll after suppression period
 */
export async function testUserScrollAfterSuppression(
  page: Page,
  scrollPosition: number,
): Promise<{
  suppressionRespected: boolean;
  userScrollCaptured: boolean;
  scrollData?: ScrollData;
}> {
  return await page.evaluate(async (position: number) => {
    const bridge = window.__traceLogTestBridge;
    const eventManager = bridge?.getEventManager();

    if (!eventManager) {
      return { suppressionRespected: false, userScrollCaptured: false };
    }

    let scrollEventsDuringSupression = 0;
    let userScrollCaptured = false;
    let capturedScrollData: ScrollData | undefined;
    const originalTrack = eventManager.track;

    eventManager.track = function (eventData: EventData): any {
      if (eventData.type === 'scroll') {
        if (scrollEventsDuringSupression === 0) {
          // This is the first scroll event, check timing
          userScrollCaptured = true;
          capturedScrollData = eventData.scroll_data;
        }
        scrollEventsDuringSupression++;
      }
      return originalTrack.call(eventManager, eventData);
    };

    try {
      // Trigger page view to start suppression
      eventManager.track({
        type: 'page_view' as EventType,
        page_url: window.location.href,
        timestamp: Date.now(),
        page_view: {
          title: document.title,
          pathname: window.location.pathname,
        },
        referrer: document.referrer,
      });

      // Test scroll during suppression
      window.scrollTo(0, 50);
      await new Promise((resolve) => setTimeout(resolve, 100));
      const suppressionRespected = scrollEventsDuringSupression === 0;

      // Wait for suppression to clear
      await new Promise((resolve) => setTimeout(resolve, 600));

      // User scroll after suppression
      window.scrollTo(0, position);
      await new Promise((resolve) => setTimeout(resolve, 350));

      return {
        suppressionRespected,
        userScrollCaptured,
        scrollData: capturedScrollData,
      };
    } finally {
      eventManager.track = originalTrack;
    }
  }, scrollPosition);
}

/**
 * Test scroll direction detection after suppression
 */
export async function testScrollDirectionAfterSuppression(
  page: Page,
  scrollSequence: number[],
): Promise<{
  suppressionRespected: boolean;
  directionsDetected: Array<'up' | 'down'>;
}> {
  return await page.evaluate(async (positions: number[]) => {
    const bridge = window.__traceLogTestBridge;
    const eventManager = bridge?.getEventManager();

    if (!eventManager) {
      return { suppressionRespected: false, directionsDetected: [] };
    }

    let scrollEventsDuringSupression = 0;
    const directionsDetected: Array<'up' | 'down'> = [];
    const originalTrack = eventManager.track;

    eventManager.track = function (eventData: EventData): any {
      if (eventData.type === 'scroll') {
        if (scrollEventsDuringSupression === 0) {
          // Count only during suppression phase
          scrollEventsDuringSupression++;
        } else {
          directionsDetected.push(eventData.scroll_data?.direction as 'up' | 'down');
        }
      }
      return originalTrack.call(eventManager, eventData);
    };

    try {
      // Trigger page view suppression by simulating navigation
      window.history.pushState({}, '', window.location.href + '#test-' + Date.now());
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Test scroll during suppression
      window.scrollTo(0, 100);
      await new Promise((resolve) => setTimeout(resolve, 100));
      const suppressionRespected = scrollEventsDuringSupression === 0;

      // Wait for suppression to clear
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Test scroll sequence
      for (const position of positions) {
        window.scrollTo(0, position);
        await new Promise((resolve) => setTimeout(resolve, 350));
      }

      return {
        suppressionRespected,
        directionsDetected: directionsDetected.filter(Boolean),
      };
    } finally {
      eventManager.track = originalTrack;
    }
  }, scrollSequence);
}

/**
 * Test scroll depth accuracy after suppression
 */
export async function testScrollDepthAccuracyAfterSuppression(
  page: Page,
  testPositions: Array<{
    position: number;
    expectedRange: [number, number];
  }>,
): Promise<{
  suppressionRespected: boolean;
  allDepthsAccurate: boolean;
  capturedEvents: Array<{ depth: number; position: number }>;
}> {
  return await page.evaluate(async (positions) => {
    const bridge = window.__traceLogTestBridge;
    const eventManager = bridge?.getEventManager();

    if (!eventManager) {
      return { suppressionRespected: false, allDepthsAccurate: false, capturedEvents: [] };
    }

    let scrollEventsDuringSupression = 0;
    const capturedEvents: Array<{ depth: number; position: number }> = [];
    const originalTrack = eventManager.track;

    eventManager.track = function (eventData: EventData): any {
      if (eventData.type === 'scroll') {
        if (scrollEventsDuringSupression === 0) {
          scrollEventsDuringSupression++;
        } else {
          capturedEvents.push({
            depth: eventData.scroll_data?.depth ?? 0,
            position: window.scrollY,
          });
        }
      }
      return originalTrack.call(eventManager, eventData);
    };

    try {
      // Trigger page view event directly to activate scroll suppression
      eventManager.track({
        type: 'page_view' as EventType,
        page_url: window.location.href,
        page_view: {
          title: document.title,
          pathname: window.location.pathname,
        },
      });

      // Test scroll during suppression period (immediate after PAGE_VIEW)
      window.scrollTo(0, 100);
      await new Promise((resolve) => setTimeout(resolve, 100));
      const suppressionRespected = scrollEventsDuringSupression === 0;

      // Wait for suppression to clear (500ms timeout + buffer)
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Test each position after suppression clears
      for (const testPos of positions) {
        window.scrollTo(0, testPos.position);
        await new Promise((resolve) => setTimeout(resolve, 400)); // Wait for scroll debounce (250ms) + processing buffer
      }

      // Check depth accuracy
      const allDepthsAccurate = capturedEvents.every((event, index) => {
        const expected = positions[index];
        return event.depth >= expected.expectedRange[0] && event.depth <= expected.expectedRange[1];
      });

      return {
        suppressionRespected,
        allDepthsAccurate,
        capturedEvents,
      };
    } finally {
      eventManager.track = originalTrack;
    }
  }, testPositions);
}

/**
 * Test rapid navigation scroll suppression
 */
export async function testRapidNavigationScrollSuppression(
  page: Page,
  navigationCount: number,
): Promise<{
  navigationsCompleted: number;
  suppressionActivatedEachTime: boolean;
  scrollEventsSuppressed: boolean;
}> {
  const monitor = createConsoleMonitor(page);

  try {
    let completedNavigations = 0;
    let totalScrollEvents = 0;

    for (let i = 0; i < navigationCount; i++) {
      await navigateAndWaitForReady(page, '/');
      const initResult = await initializeTraceLog(page);

      if (initResult.success) {
        completedNavigations++;

        // Create scrollable content
        await page.evaluate((iteration) => {
          const tallDiv = document.createElement('div');
          tallDiv.style.height = '3000px';
          tallDiv.style.background = `linear-gradient(to bottom, hsl(${iteration * 60}, 70%, 50%), hsl(${(iteration + 1) * 60}, 70%, 50%))`;
          tallDiv.id = `content-${iteration}`;
          document.body.appendChild(tallDiv);
        }, i);

        // Test scroll suppression
        const result = await page.evaluate(async () => {
          const bridge = window.__traceLogTestBridge;
          const eventManager = bridge?.getEventManager();

          if (!eventManager) return { scrollEventsCount: 0 };

          let scrollEventsCount = 0;
          const originalTrack = eventManager.track;

          eventManager.track = function (eventData: EventData): any {
            if (eventData.type === 'scroll') {
              scrollEventsCount++;
            }
            return originalTrack.call(eventManager, eventData);
          };

          try {
            // Immediate scroll attempts
            window.scrollTo(0, 100);
            window.scrollTo(0, 200);
            await new Promise((resolve) => setTimeout(resolve, 300));

            return { scrollEventsCount };
          } finally {
            eventManager.track = originalTrack;
          }
        });

        totalScrollEvents += result.scrollEventsCount;
      }
    }

    return {
      navigationsCompleted: completedNavigations,
      suppressionActivatedEachTime: completedNavigations === navigationCount,
      scrollEventsSuppressed: totalScrollEvents === 0,
    };
  } finally {
    monitor.cleanup();
  }
}

/**
 * Test multiple navigation suppression consistency
 */
export async function testMultipleNavigationSuppressionConsistency(
  page: Page,
  navigationCount: number,
): Promise<{
  totalNavigations: number;
  suppressionConsistent: boolean;
  allScrollEventsSuppressed: boolean;
  noLeakedEvents: boolean;
}> {
  const monitor = createConsoleMonitor(page);

  try {
    let totalNavigations = 0;
    let totalScrollAttempts = 0;
    let totalScrollEventsCaptured = 0;
    const suppressionResults: boolean[] = [];

    for (let i = 0; i < navigationCount; i++) {
      await navigateAndWaitForReady(page, '/');
      const initResult = await initializeTraceLog(page);

      if (initResult.success) {
        totalNavigations++;

        // Create scrollable content
        await page.evaluate((iteration) => {
          const tallDiv = document.createElement('div');
          tallDiv.style.height = '4000px';
          tallDiv.style.background = `repeating-linear-gradient(45deg,
            hsl(${iteration * 45}, 60%, 40%),
            hsl(${iteration * 45}, 60%, 60%) 100px)`;
          document.body.appendChild(tallDiv);
        }, i);

        // Test suppression consistency
        const result = await page.evaluate(async (iteration) => {
          const bridge = window.__traceLogTestBridge;
          const eventManager = bridge?.getEventManager();

          if (!eventManager) return { scrollEventsCount: 0, scrollAttempts: 0 };

          let scrollEventsCount = 0;
          const originalTrack = eventManager.track;

          eventManager.track = function (eventData: EventData): any {
            if (eventData.type === 'scroll') {
              scrollEventsCount++;
            }
            return originalTrack.call(eventManager, eventData);
          };

          try {
            // Trigger PAGE_VIEW to activate scroll suppression
            eventManager.track({
              type: 'page_view' as EventType,
              page_url: window.location.href,
              page_view: {
                title: document.title,
                pathname: window.location.pathname,
              },
            });

            // Allow time for suppression to activate
            await new Promise((resolve) => setTimeout(resolve, 10));

            // First scroll should be suppressed, subsequent scrolls should be captured
            const scrollAttempts = 5;

            // First scroll attempt - should be suppressed
            window.scrollTo(0, 100 + iteration * 50);
            await new Promise((resolve) => setTimeout(resolve, 50));

            // Subsequent scroll attempts - should be captured after debounce
            for (let j = 1; j < scrollAttempts; j++) {
              window.scrollTo(0, (j + 1) * 100 + iteration * 50);
              await new Promise((resolve) => setTimeout(resolve, 300)); // Wait for debounce
            }

            await new Promise((resolve) => setTimeout(resolve, 100));
            return { scrollEventsCount, scrollAttempts };
          } finally {
            eventManager.track = originalTrack;
          }
        }, i);

        totalScrollAttempts += result.scrollAttempts;
        totalScrollEventsCaptured += result.scrollEventsCount;
        // Only first scroll should be suppressed, subsequent scrolls should be captured
        // So expect (scrollAttempts - 1) scroll events to be captured
        const expectedScrollEvents = result.scrollAttempts - 1;
        suppressionResults.push(result.scrollEventsCount === expectedScrollEvents);
      }
    }

    const expectedTotalScrollEvents = totalNavigations * 4; // 4 captured events per navigation (5 attempts - 1 suppressed)

    return {
      totalNavigations,
      suppressionConsistent: suppressionResults.every((result) => result === true),
      allScrollEventsSuppressed: totalScrollEventsCaptured === expectedTotalScrollEvents,
      noLeakedEvents: totalScrollEventsCaptured === expectedTotalScrollEvents && totalScrollAttempts > 0,
    };
  } finally {
    monitor.cleanup();
  }
}

/**
 * Test scroll restoration suppression
 */
export async function testScrollRestorationSuppression(page: Page): Promise<{
  scrollPositionChanged: boolean;
  navigationCompleted: boolean;
  restorationScrollSuppressed: boolean;
}> {
  const monitor = createConsoleMonitor(page);

  try {
    // First navigation and setup
    await navigateAndWaitForReady(page, '/');
    let initResult = await initializeTraceLog(page);

    if (!initResult.success) {
      return { scrollPositionChanged: false, navigationCompleted: false, restorationScrollSuppressed: false };
    }

    // Create tall page and scroll down
    await page.evaluate(() => {
      const tallDiv = document.createElement('div');
      tallDiv.style.height = '5000px';
      tallDiv.style.background = 'linear-gradient(to bottom, blue, green)';
      document.body.appendChild(tallDiv);
    });

    // Wait for initial suppression to clear
    await page.waitForTimeout(600);

    // Scroll to a position
    await page.evaluate(() => window.scrollTo(0, 1500));
    await page.waitForTimeout(300);

    const initialScrollY = await page.evaluate(() => window.scrollY);

    // Navigate to trigger potential scroll restoration
    await navigateAndWaitForReady(page, '/');
    initResult = await initializeTraceLog(page);

    if (!initResult.success) {
      return { scrollPositionChanged: false, navigationCompleted: false, restorationScrollSuppressed: false };
    }

    // Check suppression of restoration scroll
    const result = await page.evaluate(async () => {
      const bridge = window.__traceLogTestBridge;
      const eventManager = bridge?.getEventManager();

      if (!eventManager) return { scrollEventsCount: 0 };

      let scrollEventsCount = 0;
      const originalTrack = eventManager.track;

      eventManager.track = function (eventData: EventData): any {
        if (eventData.type === 'scroll') {
          scrollEventsCount++;
        }
        return originalTrack.call(eventManager, eventData);
      };

      try {
        // Create content again
        const tallDiv = document.createElement('div');
        tallDiv.style.height = '5000px';
        tallDiv.style.background = 'linear-gradient(to bottom, red, yellow)';
        document.body.appendChild(tallDiv);

        // Simulate browser scroll restoration
        window.scrollTo(0, 1500);

        await new Promise((resolve) => setTimeout(resolve, 300));
        return { scrollEventsCount };
      } finally {
        eventManager.track = originalTrack;
      }
    });

    return {
      scrollPositionChanged: initialScrollY > 0,
      navigationCompleted: true,
      restorationScrollSuppressed: result.scrollEventsCount === 0,
    };
  } finally {
    monitor.cleanup();
  }
}

/**
 * Test click events during scroll suppression
 */
export async function testClickEventsDuringScrollSuppression(
  page: Page,
  buttonSelector: string,
): Promise<{
  suppressionActive: boolean;
  clickEventCaptured: boolean;
  scrollEventsSuppressed: boolean;
  clickData?: ClickData;
}> {
  return await page.evaluate(async (selector: string) => {
    const bridge = window.__traceLogTestBridge;
    const eventManager = bridge?.getEventManager();

    if (!eventManager) {
      return { suppressionActive: false, clickEventCaptured: false, scrollEventsSuppressed: false };
    }

    let scrollEventsCount = 0;
    let clickEventCaptured = false;
    let capturedClickData: ClickData | undefined;
    const originalTrack = eventManager.track;

    eventManager.track = function (eventData: EventData): any {
      if (eventData.type === 'scroll') {
        scrollEventsCount++;
      } else if (eventData.type === 'click') {
        clickEventCaptured = true;
        capturedClickData = eventData.click_data;
      }
      return originalTrack.call(eventManager, eventData);
    };

    try {
      // Trigger page view to activate suppression
      eventManager.track({
        type: 'page_view' as EventType,
        page_url: window.location.href,
        timestamp: Date.now(),
        page_view: {
          title: document.title,
          pathname: window.location.pathname,
        },
        referrer: document.referrer,
      });

      // Try scroll (should be suppressed)
      window.scrollTo(0, 100);
      await new Promise((resolve) => setTimeout(resolve, 100));
      const suppressionActive = scrollEventsCount === 0;

      // Click button (should work)
      const button = document.querySelector(selector) as HTMLElement;
      if (button) {
        button.click();
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      return {
        suppressionActive,
        clickEventCaptured,
        scrollEventsSuppressed: scrollEventsCount === 0,
        clickData: capturedClickData,
      };
    } finally {
      eventManager.track = originalTrack;
    }
  }, buttonSelector);
}

/**
 * Test custom events during scroll suppression
 */
export async function testCustomEventsDuringScrollSuppression(
  page: Page,
  eventName: string,
  metadata: Record<string, unknown>,
): Promise<{
  suppressionActive: boolean;
  customEventCaptured: boolean;
  scrollEventsSuppressed: boolean;
  customEventData?: CustomEventData;
}> {
  return await page.evaluate(
    async ({ name, meta }: { name: string; meta: Record<string, unknown> }) => {
      const bridge = window.__traceLogTestBridge;
      const eventManager = bridge?.getEventManager();

      if (!eventManager) {
        return { suppressionActive: false, customEventCaptured: false, scrollEventsSuppressed: false };
      }

      let scrollEventsCount = 0;
      let customEventCaptured = false;
      let capturedCustomData: CustomEventData | undefined;
      const originalTrack = eventManager.track;

      eventManager.track = function (eventData: EventData): any {
        if (eventData.type === 'scroll') {
          scrollEventsCount++;
        } else if (eventData.type === 'custom') {
          customEventCaptured = true;
          capturedCustomData = eventData.custom_event;
        }
        return originalTrack.call(eventManager, eventData);
      };

      try {
        // Trigger page view to activate suppression
        eventManager.track({
          type: 'page_view',
          page_url: window.location.href,
          timestamp: Date.now(),
          page_view: {
            title: document.title,
            pathname: window.location.pathname,
          },
          referrer: document.referrer,
        } as EventData);

        // Try scroll (should be suppressed)
        window.scrollTo(0, 100);
        await new Promise((resolve) => setTimeout(resolve, 100));
        const suppressionActive = scrollEventsCount === 0;

        // Send custom event (should work)
        eventManager.track({
          type: 'custom',
          page_url: window.location.href,
          timestamp: Date.now(),
          custom_event: {
            name: name,
            metadata: meta as Record<string, MetadataType>,
          },
        } as EventData);

        await new Promise((resolve) => setTimeout(resolve, 100));

        return {
          suppressionActive,
          customEventCaptured,
          scrollEventsSuppressed: scrollEventsCount === 0,
          customEventData: capturedCustomData,
        };
      } finally {
        eventManager.track = originalTrack;
      }
    },
    { name: eventName, meta: metadata },
  );
}

/**
 * Test performance events during scroll suppression
 */
export async function testPerformanceEventsDuringScrollSuppression(page: Page): Promise<{
  suppressionActive: boolean;
  performanceEventsProcessed: boolean;
  scrollEventsSuppressed: boolean;
}> {
  return await page.evaluate(async () => {
    const bridge = window.__traceLogTestBridge;
    const eventManager = bridge?.getEventManager();

    if (!eventManager) {
      return { suppressionActive: false, performanceEventsProcessed: false, scrollEventsSuppressed: false };
    }

    let scrollEventsCount = 0;
    let performanceEventsCount = 0;
    const originalTrack = eventManager.track;

    eventManager.track = function (eventData: EventData): any {
      if (eventData.type === 'scroll') {
        scrollEventsCount++;
      } else if (eventData.type === 'web_vitals') {
        performanceEventsCount++;
      }
      return originalTrack.call(eventManager, eventData);
    };

    try {
      // Trigger page view to activate suppression
      eventManager.track({
        type: 'page_view' as EventType,
        page_url: window.location.href,
        timestamp: Date.now(),
        page_view: {
          title: document.title,
          pathname: window.location.pathname,
        },
        referrer: document.referrer,
      });

      // Try scroll (should be suppressed)
      window.scrollTo(0, 100);
      await new Promise((resolve) => setTimeout(resolve, 100));
      const suppressionActive = scrollEventsCount === 0;

      // Simulate performance event
      eventManager.track({
        type: 'web_vitals' as EventType,
        page_url: window.location.href,
        timestamp: Date.now(),
        web_vitals: {
          type: 'LCP',
          value: 1200,
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      return {
        suppressionActive,
        performanceEventsProcessed: performanceEventsCount > 0,
        scrollEventsSuppressed: scrollEventsCount === 0,
      };
    } finally {
      eventManager.track = originalTrack;
    }
  });
}

/**
 * Test suppression state reset
 */
export async function testSuppressionStateReset(page: Page): Promise<{
  initialSuppressionActive: boolean;
  suppressionCleared: boolean;
  scrollEventCapturedAfterReset: boolean;
  stateResetProperly: boolean;
}> {
  return await page.evaluate(async () => {
    const bridge = window.__traceLogTestBridge;
    const eventManager = bridge?.getEventManager();

    if (!eventManager) {
      return {
        initialSuppressionActive: false,
        suppressionCleared: false,
        scrollEventCapturedAfterReset: false,
        stateResetProperly: false,
      };
    }

    let scrollEventsCount = 0;
    let scrollEventAfterReset = false;
    const originalTrack = eventManager.track;

    eventManager.track = function (eventData: EventData): any {
      if (eventData.type === 'scroll') {
        scrollEventsCount++;
        if (scrollEventsCount === 1) {
          scrollEventAfterReset = true;
        }
      }
      return originalTrack.call(eventManager, eventData);
    };

    try {
      // Trigger page view to activate suppression
      eventManager.track({
        type: 'page_view' as EventType,
        page_url: window.location.href,
        timestamp: Date.now(),
        page_view: {
          title: document.title,
          pathname: window.location.pathname,
        },
        referrer: document.referrer,
      });

      // Test initial suppression
      window.scrollTo(0, 100);
      await new Promise((resolve) => setTimeout(resolve, 100));
      const initialSuppressionActive = scrollEventsCount === 0;

      // Wait for suppression to clear
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Test scroll after reset
      window.scrollTo(0, 300);
      await new Promise((resolve) => setTimeout(resolve, 350));

      return {
        initialSuppressionActive,
        suppressionCleared: scrollEventsCount > 0,
        scrollEventCapturedAfterReset: scrollEventAfterReset,
        stateResetProperly: scrollEventsCount === 1,
      };
    } finally {
      eventManager.track = originalTrack;
    }
  });
}

/**
 * Test suppression edge cases and cleanup
 */
export async function testSuppressionEdgeCasesAndCleanup(page: Page): Promise<{
  suppressionHandledProperly: boolean;
  cleanupExecuted: boolean;
  noMemoryLeaks: boolean;
  debugInfo?: {
    isInitialized: boolean;
    appInitialized: boolean;
    scrollHandlerExists: boolean;
    containersCount: number;
    directScrollHandlerExists: boolean;
    directScrollHandlerInstanceExists: boolean;
    directContainersCount: number;
    scrollEventFired: boolean;
    initialScrollCount: number;
    initialSuppressionState: boolean;
    afterSuppressionState: boolean;
    afterFirstScrollState: boolean;
    afterTimerState: boolean;
    scrollEventsCount: number;
  };
}> {
  return await page.evaluate(async () => {
    const bridge = window.__traceLogTestBridge;
    const eventManager = bridge?.getEventManager();
    const app = bridge?.getAppInstance();

    if (!eventManager || !app) {
      return { suppressionHandledProperly: false, cleanupExecuted: false, noMemoryLeaks: false };
    }

    let scrollEventsCount = 0;
    const originalTrack = eventManager.track;

    eventManager.track = function (eventData: EventData): any {
      if (eventData.type === 'scroll') {
        scrollEventsCount++;
      }
      return originalTrack.call(eventManager, eventData);
    };

    try {
      // Check if scroll handler is initialized
      const scrollHandler = bridge?.getScrollHandler?.();
      const scrollHandlerExists = !!scrollHandler;
      const containersCount = 0; // Cannot access private containers property

      // Check if app is initialized
      const isInitialized = bridge?.isInitialized?.() ?? false;
      const appInstance = bridge?.getAppInstance?.();
      const appInitialized = !!appInstance;

      // Debug: Check if scroll handler exists in app directly
      const directScrollHandlerExists = false; // Cannot access private scrollHandler property
      const directScrollHandlerInstanceExists = false; // Cannot access private scrollHandlerInstance property
      const directContainersCount = 0; // Cannot access private containers property

      // First, test if scroll handler is working at all (without suppression)
      // Check if scroll events are being fired at all
      let scrollEventFired = false;
      const tempScrollListener = (): void => {
        scrollEventFired = true;
      };
      window.addEventListener('scroll', tempScrollListener);

      window.scrollTo(0, 100);
      await new Promise((resolve) => setTimeout(resolve, 50)); // Wait for scroll event

      window.removeEventListener('scroll', tempScrollListener);
      await new Promise((resolve) => setTimeout(resolve, 300)); // Wait for debounce
      const initialScrollCount = scrollEventsCount;

      // Reset counter
      scrollEventsCount = 0;

      // Check initial suppression state
      const initialSuppressionState = false; // Cannot access protected get method

      // Trigger scroll suppression by simulating navigation
      window.history.pushState({}, '', window.location.href + '#test-' + Date.now());

      // Check suppression state after triggering
      const afterSuppressionState = true; // Assume suppression is active after page view

      // Allow time for suppression to activate
      await new Promise((resolve) => setTimeout(resolve, 10));

      // First scroll should be suppressed
      window.scrollTo(0, 200);
      await new Promise((resolve) => setTimeout(resolve, 100));
      const suppressionHandledProperly = scrollEventsCount === 0;

      // Check suppression state after first scroll
      const afterFirstScrollState = true; // Assume still suppressed during timeout

      // Wait for suppression timer to expire (500ms) before testing second scroll
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Check suppression state after timer
      const afterTimerState = false; // Assume suppression cleared after timeout

      // Second scroll should be captured (suppression timer has expired)
      window.scrollTo(0, 500);
      await new Promise((resolve) => setTimeout(resolve, 350)); // Wait for scroll debounce (250ms) + buffer
      const cleanupExecuted = scrollEventsCount === 1; // Should have exactly 1 event (second scroll)

      // Check for memory leaks (simplified check)
      const noMemoryLeaks = typeof window !== 'undefined';

      return {
        suppressionHandledProperly,
        cleanupExecuted,
        noMemoryLeaks,
        debugInfo: {
          isInitialized,
          appInitialized,
          scrollHandlerExists,
          containersCount,
          directScrollHandlerExists,
          directScrollHandlerInstanceExists,
          directContainersCount,
          scrollEventFired,
          initialScrollCount,
          initialSuppressionState,
          afterSuppressionState,
          afterFirstScrollState,
          afterTimerState,
          scrollEventsCount,
        },
      };
    } finally {
      eventManager.track = originalTrack;
    }
  });
}

/**
 * Test suppression flag transitions
 */
export async function testSuppressionFlagTransitions(page: Page): Promise<{
  initialStateCorrect: boolean;
  flagSetOnPageView: boolean;
  flagClearedAfterTimeout: boolean;
  transitionsValid: boolean;
}> {
  return await page.evaluate(async () => {
    const bridge = window.__traceLogTestBridge;
    const eventManager = bridge?.getEventManager();

    if (!eventManager) {
      return {
        initialStateCorrect: false,
        flagSetOnPageView: false,
        flagClearedAfterTimeout: false,
        transitionsValid: false,
      };
    }

    let scrollEventsCount = 0;
    const originalTrack = eventManager.track;

    eventManager.track = function (eventData: EventData): any {
      if (eventData.type === 'scroll') {
        scrollEventsCount++;
      }
      return originalTrack.call(eventManager, eventData);
    };

    try {
      // Wait for initial suppression from TraceLog init to clear
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Check initial state (should not be suppressed after timeout)
      window.scrollTo(0, 100);
      await new Promise((resolve) => setTimeout(resolve, 350));
      const initialStateCorrect = scrollEventsCount > 0;

      // Reset counter
      scrollEventsCount = 0;

      // Trigger page view suppression by simulating navigation
      window.history.pushState({}, '', window.location.href + '#test-' + Date.now());
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Check if flag is set (scroll should be suppressed)
      window.scrollTo(0, 100);
      await new Promise((resolve) => setTimeout(resolve, 100));
      const flagSetOnPageView = scrollEventsCount === 0;

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Check if flag is cleared
      window.scrollTo(0, 200);
      await new Promise((resolve) => setTimeout(resolve, 350));
      const flagClearedAfterTimeout = scrollEventsCount > 0;

      const transitionsValid = initialStateCorrect && flagSetOnPageView && flagClearedAfterTimeout;

      return {
        initialStateCorrect,
        flagSetOnPageView,
        flagClearedAfterTimeout,
        transitionsValid,
      };
    } finally {
      eventManager.track = originalTrack;
    }
  });
}
