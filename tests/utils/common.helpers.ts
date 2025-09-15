import { Page, Browser } from '@playwright/test';
import { Config } from '../../src/types';

/**
 * Core shared utilities for TraceLog E2E tests
 * This file contains all common functionality that can be reused across different test domains.
 */

// Test configuration constants
export const TEST_ID = 'test';

export const DEFAULT_CONFIG: Config = { id: TEST_ID };

export const TEST_URLS = {
  INITIALIZATION_PAGE: '/',
  VALIDATION_PAGE: '/pages/validation/index.html',
  PAGE_UNLOAD_PAGE_URL: '/pages/page-unload/index.html',
  PAGE_UNLOAD_SECOND_PAGE_URL: '/pages/page-unload/second-page.html',
} as const;

export const STATUS_TEXTS = {
  READY: 'Status: Ready for testing',
  INITIALIZED: 'Status: Initialized successfully',
  VALIDATION_PASS: 'PASS: Valid project ID accepted',
} as const;

export const ERROR_MESSAGES = {
  ID_REQUIRED: 'Project ID is required',
  INVALID_APP_CONFIG: 'Project ID is required',
  UNDEFINED_CONFIG: 'Configuration must be an object',
  APP_NOT_INITIALIZED: 'App not initialized',
} as const;

/**
 * Console message monitoring utilities
 */
export interface ConsoleMonitor {
  consoleMessages: string[];
  traceLogErrors: string[];
  traceLogWarnings: string[];
  traceLogInfo: string[];
  debugLogs: string[];
  cleanup: () => void;
  getAnomalies: () => string[];
}

export function createConsoleMonitor(page: Page): ConsoleMonitor {
  const consoleMessages: string[] = [];
  const traceLogErrors: string[] = [];
  const traceLogWarnings: string[] = [];
  const traceLogInfo: string[] = [];
  const debugLogs: string[] = [];

  const monitor = (msg: any): void => {
    const text = msg.text();
    const type = msg.type();
    consoleMessages.push(text);

    // Categorize TraceLog messages
    if (text.includes('[TraceLog]')) {
      debugLogs.push(`[${type.toUpperCase()}] ${text}`);

      if (type === 'error') {
        traceLogErrors.push(text);
      } else if (type === 'warn' || type === 'warning') {
        traceLogWarnings.push(text);
      } else if (type === 'info' || type === 'log') {
        traceLogInfo.push(text);
      }
    } else if (type === 'error') {
      // Only track TraceLog-specific errors, not resource loading errors
      if (text.includes('TraceLog') || text.includes('[E2E Test]') || text.includes('Initialization failed')) {
        traceLogErrors.push(text);
      }
    }
  };

  const getAnomalies = (): string[] => {
    const anomalies: string[] = [];

    // Detect excessive cross-tab communication (real performance issue)
    const electionLogs = debugLogs.filter(
      (log) =>
        log.includes('election_request') || log.includes('election_response') || log.includes('Acknowledging tab'),
    );
    if (electionLogs.length > 20) {
      anomalies.push(`Excessive leader election activity: ${electionLogs.length} messages (threshold: 20)`);
    }

    // Detect heartbeat flooding (performance issue)
    const heartbeatLogs = debugLogs.filter((log) => log.includes('heartbeat'));
    if (heartbeatLogs.length > 30) {
      anomalies.push(`Heartbeat flooding detected: ${heartbeatLogs.length} heartbeats (threshold: 30)`);
    }

    // Detect multiple concurrent initializations (race condition)
    const initProgressLogs = debugLogs.filter(
      (log) => log.includes('already in progress') || log.includes('initialization in progress'),
    );
    if (initProgressLogs.length > 3) {
      anomalies.push(`Concurrent initialization conflicts: ${initProgressLogs.length} conflicts (threshold: 3)`);
    }

    // Detect storage operation failures (functional issue)
    const storageLogs = debugLogs.filter(
      (log) => log.includes('storage') && (log.includes('failed') || log.includes('error') || log.includes('quota')),
    );
    if (storageLogs.length > 5) {
      anomalies.push(`Storage operation failures: ${storageLogs.length} failures (threshold: 5)`);
    }

    // Detect excessive session recreation (performance issue)
    const sessionStartLogs = debugLogs.filter(
      (log) => log.includes('session started') || log.includes('New session started'),
    );
    if (sessionStartLogs.length > 3) {
      anomalies.push(`Excessive session recreation: ${sessionStartLogs.length} sessions (threshold: 3)`);
    }

    // Detect memory leaks or excessive event queuing
    const queueLogs = debugLogs.filter((log) => log.includes('queue') && log.includes('length'));
    const excessiveQueue = queueLogs.find((log) => {
      const match = log.match(/queue.*length.*(\d+)/i);
      return match && parseInt(match[1]) > 100;
    });
    if (excessiveQueue) {
      anomalies.push(`Excessive event queue detected: ${excessiveQueue}`);
    }

    return anomalies;
  };

  page.on('console', monitor);

  return {
    consoleMessages,
    traceLogErrors,
    traceLogWarnings,
    traceLogInfo,
    debugLogs,
    cleanup: () => page.off('console', monitor),
    getAnomalies,
  };
}

/**
 * Page navigation and initialization utilities
 */
export async function navigateAndWaitForReady(
  page: Page,
  url: string = TEST_URLS.INITIALIZATION_PAGE,
  statusSelector?: string,
): Promise<void> {
  await page.goto(url);
  await page.waitForLoadState('domcontentloaded');

  // Wait for either init-status or validation-status depending on the page
  const selector = statusSelector ?? '[data-testid="init-status"], [data-testid="validation-status"]';
  await page.locator(selector).waitFor();
}

export async function waitForReadyStatus(page: Page): Promise<void> {
  await page.waitForSelector('[data-testid="init-status"]:has-text("Status: Ready for testing")');
}

export async function waitForValidationReadyStatus(page: Page): Promise<void> {
  await page.waitForSelector('[data-testid="validation-status"]:has-text("Ready for validation testing")');
}

/**
 * TraceLog API interaction utilities
 */
export async function verifyTraceLogAvailability(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    return (
      typeof (window as any).TraceLog !== 'undefined' &&
      typeof (window as any).TraceLog.init === 'function' &&
      typeof (window as any).TraceLog.event === 'function' &&
      typeof (window as any).TraceLog.isInitialized === 'function'
    );
  });
}

export async function initializeTraceLog(page: Page, config: Config = DEFAULT_CONFIG): Promise<any> {
  return await page.evaluate(async (config) => {
    return await (window as any).initializeTraceLog(config);
  }, config);
}

export async function isTraceLogInitialized(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    return (window as any).TraceLog.isInitialized();
  });
}

/**
 * Status verification utilities
 */
export async function verifyInitializationStatus(page: Page, expectedStatus: string): Promise<void> {
  await page.waitForSelector(`[data-testid="init-status"]:has-text("${expectedStatus}")`);
}

export async function verifyValidationStatus(page: Page, expectedStatus: string): Promise<void> {
  await page.waitForSelector(`[data-testid="validation-status"]:has-text("${expectedStatus}")`);
}

/**
 * LocalStorage utilities
 */
export async function getTraceLogStorageKeys(page: Page): Promise<string[]> {
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
export async function triggerClickEvent(page: Page, selector = 'h1[data-testid="title"]'): Promise<void> {
  await page.click(selector);
  await page.waitForTimeout(500);
}

export async function triggerScrollEvent(page: Page): Promise<void> {
  const userAgent = await page.evaluate(() => navigator.userAgent);
  // Only test mouse wheel on desktop browsers, not mobile Safari
  if (!userAgent.includes('Mobile') || !userAgent.includes('Safari')) {
    await page.mouse.wheel(0, 100);
  }
  await page.waitForTimeout(500);
}

export async function testCustomEvent(
  page: Page,
  eventName = 'test_event',
  metadata: any = { test: true },
): Promise<any> {
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
 * Context and tab management utilities
 */
export async function createIsolatedContext(browser: Browser): Promise<{ page: Page; cleanup: () => Promise<void> }> {
  const context = await browser.newContext();
  const page = await context.newPage();

  return {
    page,
    cleanup: async (): Promise<void> => await context.close(),
  };
}

export async function createMultipleTabsWithSameContext(
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

/**
 * Session data retrieval utilities
 */
export async function getSessionDataFromStorage(page: Page): Promise<{
  sessionId: string | null;
  sessionData: any;
  hasSession: boolean;
}> {
  return await page.evaluate(() => {
    let sessionId = null;
    let sessionData = null;
    let hasSession = false;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.includes('session') && key.startsWith('tl:')) {
        hasSession = true;
        try {
          const data = localStorage.getItem(key);
          if (data) {
            sessionData = JSON.parse(data);
            if (sessionData.sessionId) {
              sessionId = sessionData.sessionId;
            }
          }
        } catch {
          // Continue if parsing fails
        }
      }
    }

    return { sessionId, sessionData, hasSession };
  });
}

export async function validateSessionStructure(
  sessionData: any,
  requirements: {
    hasSessionId?: boolean;
    hasStartTime?: boolean;
    hasTimingField?: boolean;
    minSessionIdLength?: number;
  } = {},
): Promise<boolean> {
  if (!sessionData) return false;

  const { hasSessionId = true, hasStartTime = true, hasTimingField = true, minSessionIdLength = 36 } = requirements;

  if (hasSessionId && (!sessionData.sessionId || typeof sessionData.sessionId !== 'string')) {
    return false;
  }

  if (hasSessionId && sessionData.sessionId.length < minSessionIdLength) {
    return false;
  }

  if (hasStartTime && (typeof sessionData.startTime !== 'number' || sessionData.startTime <= 0)) {
    return false;
  }

  if (hasTimingField) {
    const timingFields = ['lastHeartbeat', 'lastActivity', 'timestamp'];
    const hasValidTiming = timingFields.some(
      (field) => typeof sessionData[field] === 'number' && sessionData[field] > 0,
    );
    if (!hasValidTiming) {
      return false;
    }
  }

  return true;
}

/**
 * Cross-tab session utilities
 */
export async function getAllTabsInfo(
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

export async function getCrossTabSessionInfo(
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

    // Find ALL tab info entries and return a combined view
    const allTabInfos: any[] = [];
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
            allTabInfos.push(parsedTabInfo);
          }
        }
      }

      // Return aggregated info from all tabs
      if (allTabInfos.length > 0) {
        // Find a leader if any exists
        const leader = allTabInfos.find((tab) => tab.isLeader);
        if (leader) {
          tabInfo = leader;
        } else {
          // If no leader, return the most recent tab (highest startTime)
          tabInfo = allTabInfos.reduce((latest, current) => (current.startTime > latest.startTime ? current : latest));
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

export async function waitForCrossTabSessionCoordination(
  page: Page,
  expectedSessionId?: string,
  timeoutMs = 5000,
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const sessionInfo = await getCrossTabSessionInfo(page);

    if (sessionInfo.hasSessionStorage && sessionInfo.sessionId) {
      if (!expectedSessionId || sessionInfo.sessionId === expectedSessionId) {
        return;
      }
    }

    await page.waitForTimeout(100);
  }

  throw new Error(`Cross-tab session coordination not established within ${timeoutMs}ms`);
}

export async function waitForTabCountUpdate(pages: Page[], expectedTabCount: number, timeoutMs = 5000): Promise<void> {
  const startTime = Date.now();
  let lastKnownCounts: number[] = [];

  while (Date.now() - startTime < timeoutMs) {
    // Check all pages for updated tab count
    const sessionInfos = await Promise.all(pages.map((page) => getCrossTabSessionInfo(page)));
    const currentCounts: number[] = [];

    for (const sessionInfo of sessionInfos) {
      if (
        sessionInfo.sessionContext &&
        typeof sessionInfo.sessionContext === 'object' &&
        'tabCount' in sessionInfo.sessionContext
      ) {
        const tabCount = (sessionInfo.sessionContext as { tabCount?: number }).tabCount;
        if (typeof tabCount === 'number') {
          currentCounts.push(tabCount);
          if (tabCount === expectedTabCount) {
            return;
          }
        }
      }
    }

    lastKnownCounts = currentCounts;

    // Use progressive backoff for polling interval
    const elapsed = Date.now() - startTime;
    const interval = elapsed < 1000 ? 100 : elapsed < 3000 ? 200 : 500;
    await pages[0].waitForTimeout(interval);
  }

  throw new Error(
    `Tab count did not update to ${expectedTabCount} within ${timeoutMs}ms. Last known counts: ${lastKnownCounts.join(', ')}`,
  );
}

export async function simulateUserActivity(page: Page): Promise<void> {
  // Simulate various user activities to trigger session activity
  await page.mouse.move(100, 100);
  await page.waitForTimeout(100);
  await triggerClickEvent(page);
  await page.waitForTimeout(200);
}

export async function waitForLeaderElection(
  pages: Page[],
  timeoutMs = 15000, // Increased timeout for more reliable leader election
): Promise<{
  leaderPage: Page | null;
  leaderIndex: number;
  sessionId: string | null;
}> {
  const startTime = Date.now();
  let attemptCount = 0;
  const maxAttempts = Math.floor(timeoutMs / 500); // Check every 500ms

  while (Date.now() - startTime < timeoutMs && attemptCount < maxAttempts) {
    attemptCount++;

    // Check all pages for session info
    const allSessionInfos = await Promise.all(pages.map((page) => getCrossTabSessionInfo(page)));

    // First, look for an existing leader
    for (let i = 0; i < allSessionInfos.length; i++) {
      const sessionInfo = allSessionInfos[i];
      if (sessionInfo.isLeader && sessionInfo.sessionId) {
        // Double-check by waiting a bit and verifying leadership is stable
        await pages[0].waitForTimeout(200);
        const recheck = await getCrossTabSessionInfo(pages[i]);
        if (recheck.isLeader && recheck.sessionId) {
          return {
            leaderPage: pages[i],
            leaderIndex: i,
            sessionId: recheck.sessionId,
          };
        }
      }
    }

    // If no leader found, try to trigger leader election on all pages
    const pagesWithSessions = allSessionInfos
      .map((info, index) => ({ info, index }))
      .filter(({ info }) => info.sessionId || info.hasTabInfoStorage);

    if (pagesWithSessions.length > 0) {
      // Trigger activity on all pages with sessions to encourage leader election
      await Promise.all(
        pagesWithSessions.map(async ({ index }) => {
          try {
            await simulateUserActivity(pages[index]);
            // Add a small random delay to avoid synchronization issues
            await pages[index].waitForTimeout(100 + Math.random() * 200);
          } catch (error) {
            // Continue if activity simulation fails
            console.warn(`Failed to simulate activity on page ${index}:`, error);
          }
        }),
      );

      // Wait a bit longer for election to complete
      await pages[0].waitForTimeout(800);

      // Check again after triggering activities
      const updatedSessionInfos = await Promise.all(pages.map((page) => getCrossTabSessionInfo(page)));

      for (let i = 0; i < updatedSessionInfos.length; i++) {
        const sessionInfo = updatedSessionInfos[i];
        if (sessionInfo.isLeader && sessionInfo.sessionId) {
          return {
            leaderPage: pages[i],
            leaderIndex: i,
            sessionId: sessionInfo.sessionId,
          };
        }
      }

      // If still no leader, try forcing leadership on the first page with a session
      const firstPageWithSession = pagesWithSessions[0];
      if (firstPageWithSession) {
        try {
          // Trigger multiple activities to force leader election
          for (let attempt = 0; attempt < 3; attempt++) {
            await simulateUserActivity(pages[firstPageWithSession.index]);
            await pages[firstPageWithSession.index].waitForTimeout(300);

            const forcedElectionInfo = await getCrossTabSessionInfo(pages[firstPageWithSession.index]);
            if (forcedElectionInfo.isLeader && forcedElectionInfo.sessionId) {
              return {
                leaderPage: pages[firstPageWithSession.index],
                leaderIndex: firstPageWithSession.index,
                sessionId: forcedElectionInfo.sessionId,
              };
            }
          }
        } catch (error) {
          console.warn('Failed to force leader election:', error);
        }
      }
    } else {
      // No pages have sessions yet, wait a bit longer for initialization
      await pages[0].waitForTimeout(500);
    }

    // Progressive backoff - wait longer on later attempts
    const waitTime = Math.min(200 + attemptCount * 50, 1000);
    await pages[0].waitForTimeout(waitTime);
  }

  // Final attempt: get session info for debugging
  const finalSessionInfos = await Promise.all(pages.map((page) => getCrossTabSessionInfo(page)));
  console.warn('Leader election failed. Final session states:', JSON.stringify(finalSessionInfos, null, 2));

  // Check if any page has BroadcastChannel support
  const hasBroadcastChannel = finalSessionInfos.some((info) => info.hasBroadcastChannel);
  if (!hasBroadcastChannel) {
    console.warn('BroadcastChannel not supported - this may cause leader election issues');
  }

  // Check for multiple leaders (conflict detection)
  const leaders = finalSessionInfos.filter((info) => info.isLeader);
  if (leaders.length > 1) {
    console.warn(`Multiple leaders detected: ${leaders.length} tabs claim leadership`);
  }

  return {
    leaderPage: null,
    leaderIndex: -1,
    sessionId: null,
  };
}

/**
 * Session timeout validation utilities
 */
export async function validateSessionTimeout(
  page: Page,
  expectedTimeout?: number,
): Promise<{
  hasSession: boolean;
  sessionId: string | null;
  configTimeout?: number;
  isValid: boolean;
}> {
  return await page.evaluate((_expectedTimeout) => {
    let sessionData = null;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.includes('session') && key.startsWith('tl:')) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            sessionData = JSON.parse(data);
            break;
          }
        } catch {
          // Continue if parsing fails
        }
      }
    }

    const traceLogConfig = (window as any).TraceLog?.getConfig?.();

    return {
      hasSession: !!sessionData,
      sessionId: sessionData?.sessionId ?? null,
      configTimeout: traceLogConfig?.sessionTimeout,
      isValid: !!sessionData?.sessionId && typeof sessionData.sessionId === 'string',
    };
  }, expectedTimeout);
}

/**
 * Timing and error utilities
 */
export async function detectRuntimeErrors(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    // Check if any uncaught errors occurred
    return window.onerror !== null || window.onunhandledrejection !== null;
  });
}

export async function waitForTimeout(page: Page, timeout = 1000): Promise<void> {
  await page.waitForTimeout(timeout);
}

/**
 * Common test constants
 */
export const TEST_CONSTANTS = {
  SESSION_REQUIREMENTS: {
    MIN_SESSION_ID_LENGTH: 36, // UUID length
    MAX_SESSION_START_TIME: 1000, // <1000ms for session initialization
    STORAGE_KEY_PREFIX: 'tl:', // TraceLog localStorage prefix
    EXPECTED_SESSION_METADATA_FIELDS: [
      'sessionId',
      'startTime',
      'lastActivity',
      'tabCount',
      'recoveryAttempts',
      'metadata',
    ],
  },
  // Session timeout bounds (from src/constants/limits.constants.ts)
  MIN_SESSION_TIMEOUT_MS: 30000, // 30 seconds
  MAX_SESSION_TIMEOUT_MS: 86400000, // 24 hours
} as const;

/**
 * Common assertions for TraceLog tests
 */

export function verifyInitializationResult(result: unknown): { success: boolean; error: unknown; hasError: boolean } {
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

export function verifyConsoleMessages(consoleMessages: string[], expectedMessage: string): boolean {
  return consoleMessages.some((msg) => msg.includes(expectedMessage));
}

export function verifyNoTraceLogErrors(traceLogErrors: string[]): boolean {
  return traceLogErrors.length === 0;
}

export function verifySessionId(sessionId: string | null): void {
  if (!sessionId) {
    throw new Error('Session ID is null or undefined');
  }
  if (typeof sessionId !== 'string') {
    throw new Error(`Session ID must be string, got ${typeof sessionId}`);
  }
  if (sessionId.length < TEST_CONSTANTS.SESSION_REQUIREMENTS.MIN_SESSION_ID_LENGTH) {
    throw new Error(
      `Session ID length ${sessionId.length} is less than minimum ${TEST_CONSTANTS.SESSION_REQUIREMENTS.MIN_SESSION_ID_LENGTH}`,
    );
  }
}

export function verifySessionStructure(sessionData: any): void {
  if (!sessionData) {
    throw new Error('Session data is null or undefined');
  }
  if (!sessionData.sessionId) {
    throw new Error('Session data missing sessionId field');
  }
  if (typeof sessionData.sessionId !== 'string') {
    throw new Error(`sessionId must be string, got ${typeof sessionData.sessionId}`);
  }
}

export function verifyTimingAccuracy(timestamp: number, startTime: number, endTime: number, buffer = 1000): void {
  if (timestamp < startTime - buffer) {
    throw new Error(`Timestamp ${timestamp} is before start time ${startTime} (buffer: ${buffer}ms)`);
  }
  if (timestamp > endTime + buffer) {
    throw new Error(`Timestamp ${timestamp} is after end time ${endTime} (buffer: ${buffer}ms)`);
  }
}
