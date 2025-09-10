import { Page, Browser } from '@playwright/test';

/**
 * Common test utilities for TraceLog E2E tests
 */
export class TestHelpers {
  /**
   * Console message monitoring utilities
   */
  static createConsoleMonitor(page: Page): {
    consoleMessages: string[];
    traceLogErrors: string[];
    cleanup: () => void;
  } {
    const consoleMessages: string[] = [];
    const traceLogErrors: string[] = [];

    const monitor = (msg: any): void => {
      const text = msg.text();
      consoleMessages.push(text);

      if (msg.type() === 'error') {
        // Only track TraceLog-specific errors, not resource loading errors
        if (text.includes('TraceLog') || text.includes('[E2E Test]') || text.includes('Initialization failed')) {
          traceLogErrors.push(text);
        }
      }
    };

    page.on('console', monitor);

    return {
      consoleMessages,
      traceLogErrors,
      cleanup: () => page.off('console', monitor),
    };
  }

  /**
   * Page initialization utilities
   */
  static async navigateAndWaitForReady(page: Page, url: string, statusSelector?: string): Promise<void> {
    await page.goto(url);
    await page.waitForLoadState('domcontentloaded');

    // Wait for either init-status or validation-status depending on the page
    const selector = statusSelector ?? '[data-testid="init-status"], [data-testid="validation-status"]';
    await page.locator(selector).waitFor();
  }

  static async waitForReadyStatus(page: Page): Promise<void> {
    await page.waitForSelector('[data-testid="init-status"]:has-text("Status: Ready for testing")');
  }

  static async waitForValidationReadyStatus(page: Page): Promise<void> {
    await page.waitForSelector('[data-testid="validation-status"]:has-text("Ready for validation testing")');
  }

  /**
   * TraceLog initialization utilities
   */
  static async verifyTraceLogAvailability(page: Page): Promise<boolean> {
    return await page.evaluate(() => {
      return (
        typeof (window as any).TraceLog !== 'undefined' &&
        typeof (window as any).TraceLog.init === 'function' &&
        typeof (window as any).TraceLog.event === 'function' &&
        typeof (window as any).TraceLog.isInitialized === 'function'
      );
    });
  }

  static async initializeTraceLog(page: Page, config = { id: 'test' }): Promise<any> {
    return await page.evaluate(async (config) => {
      return await (window as any).initializeTraceLog(config);
    }, config);
  }

  static async isTraceLogInitialized(page: Page): Promise<boolean> {
    return await page.evaluate(() => {
      return (window as any).TraceLog.isInitialized();
    });
  }

  /**
   * Status verification utilities
   */
  static async verifyInitializationStatus(page: Page, expectedStatus: string): Promise<void> {
    await page.waitForSelector(`[data-testid="init-status"]:has-text("${expectedStatus}")`);
  }

  static async verifyValidationStatus(page: Page, expectedStatus: string): Promise<void> {
    await page.waitForSelector(`[data-testid="validation-status"]:has-text("${expectedStatus}")`);
  }

  /**
   * LocalStorage utilities
   */
  static async getTraceLogStorageKeys(page: Page): Promise<string[]> {
    return await page.evaluate(() => {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('tl:')) {
          keys.push(key);
        }
      }
      return keys;
    });
  }

  /**
   * Event testing utilities
   */
  static async triggerClickEvent(page: Page, selector = 'h1[data-testid="title"]'): Promise<void> {
    await page.click(selector);
    await page.waitForTimeout(500);
  }

  static async triggerScrollEvent(page: Page): Promise<void> {
    const userAgent = await page.evaluate(() => navigator.userAgent);
    // Only test mouse wheel on desktop browsers, not mobile Safari
    if (!userAgent.includes('Mobile') || !userAgent.includes('Safari')) {
      await page.mouse.wheel(0, 100);
    }
    await page.waitForTimeout(500);
  }

  static async testCustomEvent(page: Page, eventName = 'test_event', metadata: any = { test: true }): Promise<any> {
    return await page.evaluate(
      ({ eventName, metadata }) => {
        try {
          (window as any).TraceLog.event(eventName, metadata);
          return { success: true, error: null };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
      { eventName, metadata },
    );
  }

  /**
   * Context management utilities
   */
  static async createIsolatedContext(browser: Browser): Promise<{ page: Page; cleanup: () => Promise<void> }> {
    const context = await browser.newContext();
    const page = await context.newPage();

    return {
      page,
      cleanup: async (): Promise<void> => await context.close(),
    };
  }

  /**
   * Error detection utilities
   */
  static async detectRuntimeErrors(page: Page): Promise<boolean> {
    return await page.evaluate(() => {
      // Check if any uncaught errors occurred
      return window.onerror !== null || window.onunhandledrejection !== null;
    });
  }

  /**
   * Timeout utilities
   */
  static async waitForTimeout(page: Page, timeout = 1000): Promise<void> {
    await page.waitForTimeout(timeout);
  }
}

/**
 * Common assertions for TraceLog tests
 */
export class TestAssertions {
  static verifyInitializationResult(result: any): { success: boolean; error: any; hasError: boolean } {
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid initialization result structure');
    }

    return {
      success: result.success === true,
      error: result.error,
      hasError: result.error !== null && result.error !== undefined,
    };
  }

  static verifyConsoleMessages(consoleMessages: string[], expectedMessage: string): boolean {
    return consoleMessages.some((msg) => msg.includes(expectedMessage));
  }

  static verifyNoTraceLogErrors(traceLogErrors: string[]): boolean {
    return traceLogErrors.length === 0;
  }
}
