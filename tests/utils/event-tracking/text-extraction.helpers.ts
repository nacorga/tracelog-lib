import { Page } from '@playwright/test';
import {
  createConsoleMonitor,
  ConsoleMonitor,
  navigateAndWaitForReady,
  initializeTraceLog,
  DEFAULT_CONFIG,
} from '../common.helpers';

/**
 * Text Extraction Testing Helpers
 * Functions for testing DOM element text extraction functionality
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
