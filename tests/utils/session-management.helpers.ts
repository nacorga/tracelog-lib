import { Page } from '@playwright/test';
import {
  createConsoleMonitor,
  ConsoleMonitor,
  navigateAndWaitForReady,
  initializeTraceLog,
  triggerClickEvent,
  simulateUserActivity,
  waitForTimeout,
  waitForCrossTabSessionCoordination,
  getCrossTabSessionInfo,
  getSessionDataFromStorage,
  validateSessionStructure,
  validateSessionTimeout,
} from './common.helpers';
import '../../src/types/window.types';
import { TEST_CONFIGS, TEST_CONSTANTS } from './initialization.helpers';
import { Config } from '../../src/types';

/**
 * Session Management specific test constants
 */

// Session timeout bounds (from src/constants/limits.constants.ts)
export const MIN_SESSION_TIMEOUT_MS = 30000; // 30 seconds
export const MAX_SESSION_TIMEOUT_MS = 86400000; // 24 hours
export const DEFAULT_SESSION_TIMEOUT_MS = 900000; // 15 minutes

// Test timing constants
export const SESSION_START_WAIT_MS = 2500; // Wait for session to start
export const CROSS_TAB_COORDINATION_WAIT_MS = 3000; // Wait for cross-tab coordination
export const UNLOAD_DETECTION_TIMEOUT_MS = 2000; // Page unload detection
export const SESSION_RECOVERY_WAIT_MS = 5000; // Session recovery wait

// Session validation requirements
export const SESSION_VALIDATION_REQUIREMENTS = {
  hasSessionId: true,
  hasStartTime: true,
  hasTimingField: true,
  minSessionIdLength: 36, // UUID length
};

/**
 * Session Management specific test helpers
 */

/**
 * Setup a session management test with proper initialization and session creation
 */
export async function setupSessionTest(
  page: Page,
  config: Config = TEST_CONFIGS.DEFAULT,
  testUrl: string = TEST_CONSTANTS.URLS.INITIALIZATION_PAGE,
): Promise<{
  monitor: ConsoleMonitor;
  sessionInfo: Awaited<ReturnType<typeof getSessionDataFromStorage>>;
}> {
  const monitor = createConsoleMonitor(page);

  await navigateAndWaitForReady(page, testUrl);
  await initializeTraceLog(page, config);
  await waitForTimeout(page, SESSION_START_WAIT_MS);
  await triggerClickEvent(page);
  await waitForTimeout(page, 500);

  const sessionInfo = await getSessionDataFromStorage(page);

  return { monitor, sessionInfo };
}

/**
 * Common session data evaluation pattern used across multiple tests
 */
export async function evaluateSessionData(page: Page): Promise<{
  sessionExists: boolean;
  sessionId: string | null;
  sessionData: any;
  isInitialized: boolean;
  storageKeyCount: number;
}> {
  return await page.evaluate(() => {
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

    return {
      sessionExists: !!sessionData,
      sessionId: sessionData?.sessionId ?? null,
      sessionData,
      isInitialized: (window as Record<string, any>).TraceLog?.isInitialized?.() ?? false,
      storageKeyCount: Object.keys(localStorage).filter((k) => k.startsWith('tl:')).length,
    };
  });
}

/**
 * Common session structure validation with timing fields
 */
export async function validateSessionDataStructure(sessionData: any): Promise<boolean> {
  if (!sessionData) return false;

  const hasSessionId = typeof sessionData.sessionId === 'string' && sessionData.sessionId.length >= 36;
  const hasStartTime = typeof sessionData.startTime === 'number' && sessionData.startTime > 0;
  const hasTimingField = ['lastHeartbeat', 'lastActivity', 'timestamp'].some(
    (field) => typeof sessionData[field] === 'number' && sessionData[field] > 0,
  );

  return hasSessionId && hasStartTime && hasTimingField;
}

/**
 * Mock fetch for capturing events in tests
 */
export async function setupEventCapture(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as any).capturedEvents = [];
    const originalFetch = window.fetch;

    window.fetch = async function (url: string | URL | Request, options?: RequestInit): Promise<Response> {
      if (options && options.method === 'POST' && options.body) {
        try {
          const body = JSON.parse(options.body as string);
          if (body.events && Array.isArray(body.events)) {
            (window as any).capturedEvents.push(...body.events);
          }
        } catch {
          // Continue if parsing fails
        }
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
        text: () => Promise.resolve('OK'),
      } as Response);
    };

    (window as any).originalFetch = originalFetch;
  });
}

/**
 * Restore original fetch after event capture
 */
export async function restoreOriginalFetch(page: Page): Promise<void> {
  await page.evaluate(() => {
    if ((window as any).originalFetch) {
      window.fetch = (window as any).originalFetch;
    }
  });
}

/**
 * Setup session end event monitoring
 */
export async function setupSessionEndMonitoring(page: Page, useEventsArray = false): Promise<void> {
  await page.evaluate((useArray) => {
    if (useArray) {
      (window as any).sessionEndEvents = [];
    }

    const bridge = window.__traceLogTestBridge;
    const eventManager = bridge?.getEventManager();
    if (eventManager) {
      const originalTrack = eventManager.track.bind(eventManager);
      eventManager.track = function (eventData: any): any {
        if (eventData.type === 'SESSION_END') {
          if (useArray) {
            (window as any).sessionEndEvents.push({
              reason: eventData.session_end_reason,
              timestamp: Date.now(),
            });
          } else {
            (window as any).sessionEndData = {
              reason: eventData.session_end_reason,
              timestamp: Date.now(),
              detected: true,
            };
          }
        }
        return originalTrack(eventData);
      };
    }
  }, useEventsArray);
}

/**
 * Setup a cross-tab session test with proper coordination
 */
export async function setupCrossTabSessionTest(
  page: Page,
  config: Config = TEST_CONFIGS.DEFAULT,
  testUrl: string = TEST_CONSTANTS.URLS.INITIALIZATION_PAGE,
): Promise<{
  monitor: ConsoleMonitor;
  sessionInfo: Awaited<ReturnType<typeof getCrossTabSessionInfo>>;
}> {
  const monitor = createConsoleMonitor(page);

  await navigateAndWaitForReady(page, testUrl);
  await initializeTraceLog(page, config);
  await simulateUserActivity(page);
  await waitForTimeout(page, CROSS_TAB_COORDINATION_WAIT_MS);
  await waitForCrossTabSessionCoordination(page);

  const sessionInfo = await getCrossTabSessionInfo(page);

  return { monitor, sessionInfo };
}

/**
 * Cleanup session test resources
 */
export async function cleanupSessionTest(monitor: ConsoleMonitor): Promise<void> {
  monitor.cleanup();
}

/**
 * Validate session timeout configuration
 */
export async function validateSessionTimeoutConfig(
  page: Page,
  expectedTimeout?: number,
): Promise<{
  hasSession: boolean;
  sessionId: string | null;
  configTimeout?: number;
  isValid: boolean;
}> {
  return await validateSessionTimeout(page, expectedTimeout);
}

/**
 * Get session data with enhanced validation for session management tests
 */
export async function getEnhancedSessionData(
  page: Page,
  requirements = SESSION_VALIDATION_REQUIREMENTS,
): Promise<{
  sessionId: string | null;
  sessionData: any;
  hasSession: boolean;
  isValid: boolean;
}> {
  const sessionInfo = await getSessionDataFromStorage(page);
  const isValid = await validateSessionStructure(sessionInfo.sessionData, requirements);

  return {
    ...sessionInfo,
    isValid,
  };
}

/**
 * Wait for session timeout to occur
 */
export async function waitForSessionTimeout(
  page: Page,
  customTimeout?: number,
  checkInterval = 1000,
): Promise<{
  timedOut: boolean;
  sessionStillExists: boolean;
  finalSessionData: any;
}> {
  const timeoutMs = customTimeout ?? DEFAULT_SESSION_TIMEOUT_MS;
  const startTime = Date.now();
  let sessionData = null;

  while (Date.now() - startTime < timeoutMs + 5000) {
    // Add 5s buffer
    const sessionInfo = await getSessionDataFromStorage(page);

    if (!sessionInfo.hasSession) {
      return {
        timedOut: true,
        sessionStillExists: false,
        finalSessionData: null,
      };
    }

    sessionData = sessionInfo.sessionData;
    await waitForTimeout(page, checkInterval);
  }

  return {
    timedOut: false,
    sessionStillExists: true,
    finalSessionData: sessionData,
  };
}
