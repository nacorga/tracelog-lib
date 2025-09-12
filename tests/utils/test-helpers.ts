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
   * Cross-tab session testing utilities
   */
  static async createMultipleTabsWithSameContext(
    browser: Browser,
    tabCount: number,
  ): Promise<{ pages: Page[]; cleanup: () => Promise<void> }> {
    const context = await browser.newContext();
    const pages: Page[] = [];

    for (let i = 0; i < tabCount; i++) {
      const page = await context.newPage();
      pages.push(page);
    }

    return {
      pages,
      cleanup: async (): Promise<void> => await context.close(),
    };
  }

  static async getAllTabsInfo(
    page: Page,
    projectId = 'test',
  ): Promise<{
    sessionContext: Record<string, unknown> | null;
    allTabInfos: Array<Record<string, unknown>>;
    regularSessionId: string | null;
    hasBroadcastChannel: boolean;
  }> {
    return await page.evaluate((projectId) => {
      const crossTabSessionKey = `tl:${projectId}:cross_tab_session`;
      const regularSessionKey = `tl:${projectId}:session`;

      let sessionContext = null;
      let regularSession = null;
      const allTabInfos: Array<Record<string, unknown>> = [];

      try {
        const sessionData = localStorage.getItem(crossTabSessionKey);
        sessionContext = sessionData ? JSON.parse(sessionData) : null;
      } catch {
        // Continue if parsing fails
      }

      // Find all tab info entries
      try {
        const tabKeyPrefix = `tl:${projectId}:tab:`;
        const tabKeySuffix = ':info';

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(tabKeyPrefix) && key.endsWith(tabKeySuffix)) {
            const tabData = localStorage.getItem(key);
            if (tabData) {
              const parsedTabInfo = JSON.parse(tabData);
              allTabInfos.push(parsedTabInfo);
            }
          }
        }
      } catch {
        // Continue if parsing fails
      }

      try {
        const regSessionData = localStorage.getItem(regularSessionKey);
        regularSession = regSessionData ? JSON.parse(regSessionData) : null;
      } catch {
        // Continue if parsing fails
      }

      return {
        sessionContext,
        allTabInfos,
        regularSessionId: regularSession?.sessionId ?? null,
        hasBroadcastChannel: typeof BroadcastChannel !== 'undefined',
      };
    }, projectId);
  }

  static async getCrossTabSessionInfo(
    page: Page,
    projectId = 'test',
  ): Promise<{
    sessionId: string | null;
    isLeader: boolean;
    tabId: string | null;
    sessionContext: Record<string, unknown> | null;
    tabInfo: Record<string, unknown> | null;
    hasSessionStorage: boolean;
    hasCrossTabStorage: boolean;
    hasTabInfoStorage: boolean;
    regularSessionId: string | null;
    hasBroadcastChannel: boolean;
  }> {
    return await page.evaluate((projectId) => {
      const crossTabSessionKey = `tl:${projectId}:cross_tab_session`;
      const regularSessionKey = `tl:${projectId}:session`;

      let sessionContext = null;
      let tabInfo = null;
      let regularSession = null;

      try {
        const sessionData = localStorage.getItem(crossTabSessionKey);
        sessionContext = sessionData ? JSON.parse(sessionData) : null;
      } catch {
        // Continue if parsing fails
      }

      // Find this page's tab info by looking for tab-specific keys
      // The new format is tl:${projectId}:tab:${tabId}:info
      try {
        const tabKeyPrefix = `tl:${projectId}:tab:`;
        const tabKeySuffix = ':info';

        // Search through localStorage for tab-specific keys
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(tabKeyPrefix) && key.endsWith(tabKeySuffix)) {
            const tabData = localStorage.getItem(key);
            if (tabData) {
              const parsedTabInfo = JSON.parse(tabData);
              // For now, take the first one we find - in practice each page will have different tabs
              tabInfo ??= parsedTabInfo;
            }
          }
        }
      } catch {
        // Continue if parsing fails
      }

      try {
        const regSessionData = localStorage.getItem(regularSessionKey);
        regularSession = regSessionData ? JSON.parse(regSessionData) : null;
      } catch {
        // Continue if parsing fails
      }

      return {
        sessionId: sessionContext?.sessionId ?? null,
        isLeader: tabInfo?.isLeader ?? false,
        tabId: tabInfo?.id ?? null,
        sessionContext,
        tabInfo,
        hasSessionStorage: !!sessionContext,
        hasCrossTabStorage: !!localStorage.getItem(crossTabSessionKey),
        hasTabInfoStorage: !!tabInfo,
        regularSessionId: regularSession?.sessionId ?? null,
        hasBroadcastChannel: typeof BroadcastChannel !== 'undefined',
      };
    }, projectId);
  }

  static async waitForCrossTabSessionCoordination(
    page: Page,
    expectedSessionId?: string,
    timeoutMs = 5000,
  ): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const sessionInfo = await TestHelpers.getCrossTabSessionInfo(page);

      if (sessionInfo.hasSessionStorage && sessionInfo.sessionId) {
        if (!expectedSessionId || sessionInfo.sessionId === expectedSessionId) {
          return;
        }
      }

      await page.waitForTimeout(100);
    }

    throw new Error(`Cross-tab session coordination not established within ${timeoutMs}ms`);
  }

  static async simulateUserActivity(page: Page): Promise<void> {
    // Simulate various user activities to trigger session activity
    await page.mouse.move(100, 100);
    await page.waitForTimeout(100);
    await TestHelpers.triggerClickEvent(page);
    await page.waitForTimeout(200);
  }

  static async waitForLeaderElection(
    pages: Page[],
    timeoutMs = 5000,
  ): Promise<{
    leaderPage: Page | null;
    leaderIndex: number;
    sessionId: string | null;
  }> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      // Check all pages for session info
      const allSessionInfos = await Promise.all(
        pages.map((page) => TestHelpers.getCrossTabSessionInfo(page))
      );

      // Find a leader or any page with a session
      for (let i = 0; i < allSessionInfos.length; i++) {
        const sessionInfo = allSessionInfos[i];
        if (sessionInfo.isLeader && sessionInfo.sessionId) {
          return {
            leaderPage: pages[i],
            leaderIndex: i,
            sessionId: sessionInfo.sessionId,
          };
        }
      }

      // If no leader found, check if any page has a session and could become leader
      for (let i = 0; i < allSessionInfos.length; i++) {
        const sessionInfo = allSessionInfos[i];
        if (sessionInfo.sessionId && sessionInfo.hasTabInfoStorage) {
          // Force leader election by triggering activity
          await TestHelpers.simulateUserActivity(pages[i]);
          await pages[i].waitForTimeout(500); // Give time for election
          
          // Check again after activity
          const updatedInfo = await TestHelpers.getCrossTabSessionInfo(pages[i]);
          if (updatedInfo.isLeader) {
            return {
              leaderPage: pages[i],
              leaderIndex: i,
              sessionId: updatedInfo.sessionId,
            };
          }
        }
      }

      await pages[0].waitForTimeout(200);
    }

    return {
      leaderPage: null,
      leaderIndex: -1,
      sessionId: null,
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
  static verifyInitializationResult(result: unknown): { success: boolean; error: unknown; hasError: boolean } {
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid initialization result structure');
    }

    const typedResult = result as { success?: unknown; error?: unknown };

    return {
      success: typedResult.success === true,
      error: typedResult.error,
      hasError: typedResult.error !== null && typedResult.error !== undefined,
    };
  }

  static verifyConsoleMessages(consoleMessages: string[], expectedMessage: string): boolean {
    return consoleMessages.some((msg) => msg.includes(expectedMessage));
  }

  static verifyNoTraceLogErrors(traceLogErrors: string[]): boolean {
    return traceLogErrors.length === 0;
  }
}
