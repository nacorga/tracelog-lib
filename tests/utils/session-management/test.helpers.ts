import { Page } from '@playwright/test';
import { TestHelpers as BaseTestHelpers } from '../test.helpers';

/**
 * Session Management specific test constants
 */
export class SessionManagementConstants {
  // Test URLs
  static readonly TEST_PAGE_URL = '/';
  static readonly SECOND_PAGE_URL = '/pages/page-unload/second-page.html';

  // Test configurations
  static readonly DEFAULT_TEST_CONFIG = { id: 'test', qaMode: true };
  static readonly QA_CONFIG = { id: 'test', qaMode: true };

  // Session timeout bounds (from src/constants/limits.constants.ts)
  static readonly MIN_SESSION_TIMEOUT_MS = 30000; // 30 seconds
  static readonly MAX_SESSION_TIMEOUT_MS = 86400000; // 24 hours
  static readonly DEFAULT_SESSION_TIMEOUT_MS = 900000; // 15 minutes

  // Test timing constants
  static readonly SESSION_START_WAIT_MS = 2500; // Wait for session to start
  static readonly CROSS_TAB_COORDINATION_WAIT_MS = 3000; // Wait for cross-tab coordination
  static readonly UNLOAD_DETECTION_TIMEOUT_MS = 2000; // Page unload detection
  static readonly SESSION_RECOVERY_WAIT_MS = 5000; // Session recovery wait

  // Session validation requirements
  static readonly SESSION_VALIDATION_REQUIREMENTS = {
    hasSessionId: true,
    hasStartTime: true,
    hasTimingField: true,
    minSessionIdLength: 36, // UUID length
  };
}

/**
 * Session Management specific test helpers extending base functionality
 */
export class SessionManagementHelpers extends BaseTestHelpers {
  /**
   * Setup a session management test with proper initialization and session creation
   */
  static async setupSessionTest(
    page: Page,
    config = SessionManagementConstants.DEFAULT_TEST_CONFIG,
    testUrl = SessionManagementConstants.TEST_PAGE_URL,
  ): Promise<{
    monitor: ReturnType<typeof BaseTestHelpers.createConsoleMonitor>;
    sessionInfo: Awaited<ReturnType<typeof BaseTestHelpers.getSessionDataFromStorage>>;
  }> {
    const monitor = BaseTestHelpers.createConsoleMonitor(page);

    await BaseTestHelpers.navigateAndWaitForReady(page, testUrl);
    await BaseTestHelpers.initializeTraceLog(page, config);
    await BaseTestHelpers.waitForTimeout(page, SessionManagementConstants.SESSION_START_WAIT_MS);
    await BaseTestHelpers.triggerClickEvent(page);
    await BaseTestHelpers.waitForTimeout(page, 500);

    const sessionInfo = await BaseTestHelpers.getSessionDataFromStorage(page);

    return { monitor, sessionInfo };
  }

  /**
   * Common session data evaluation pattern used across multiple tests
   */
  static async evaluateSessionData(page: Page): Promise<{
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
  static async validateSessionDataStructure(sessionData: any): Promise<boolean> {
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
  static async setupEventCapture(page: Page): Promise<void> {
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
  static async restoreOriginalFetch(page: Page): Promise<void> {
    await page.evaluate(() => {
      if ((window as any).originalFetch) {
        window.fetch = (window as any).originalFetch;
      }
    });
  }

  /**
   * Setup session end event monitoring
   */
  static async setupSessionEndMonitoring(page: Page, useEventsArray = false): Promise<void> {
    await page.evaluate((useArray) => {
      if (useArray) {
        (window as any).sessionEndEvents = [];
      }

      const app = (window as any).TraceLog._app;
      if (app?.eventManager) {
        const originalTrack = app.eventManager.track.bind(app.eventManager);
        app.eventManager.track = function (eventData: any): any {
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
  static async setupCrossTabSessionTest(
    page: Page,
    config = SessionManagementConstants.DEFAULT_TEST_CONFIG,
    testUrl = SessionManagementConstants.TEST_PAGE_URL,
  ): Promise<{
    monitor: ReturnType<typeof BaseTestHelpers.createConsoleMonitor>;
    sessionInfo: Awaited<ReturnType<typeof BaseTestHelpers.getCrossTabSessionInfo>>;
  }> {
    const monitor = BaseTestHelpers.createConsoleMonitor(page);

    await BaseTestHelpers.navigateAndWaitForReady(page, testUrl);
    await BaseTestHelpers.initializeTraceLog(page, config);
    await BaseTestHelpers.simulateUserActivity(page);
    await BaseTestHelpers.waitForTimeout(page, SessionManagementConstants.CROSS_TAB_COORDINATION_WAIT_MS);
    await BaseTestHelpers.waitForCrossTabSessionCoordination(page);

    const sessionInfo = await BaseTestHelpers.getCrossTabSessionInfo(page);

    return { monitor, sessionInfo };
  }

  /**
   * Cleanup session test resources
   */
  static async cleanupSessionTest(monitor: ReturnType<typeof BaseTestHelpers.createConsoleMonitor>): Promise<void> {
    monitor.cleanup();
  }

  /**
   * Validate session timeout configuration
   */
  static async validateSessionTimeoutConfig(
    page: Page,
    expectedTimeout?: number,
  ): Promise<{
    hasSession: boolean;
    sessionId: string | null;
    configTimeout?: number;
    isValid: boolean;
  }> {
    return await BaseTestHelpers.validateSessionTimeout(page, expectedTimeout);
  }

  /**
   * Get session data with enhanced validation for session management tests
   */
  static async getEnhancedSessionData(
    page: Page,
    requirements = SessionManagementConstants.SESSION_VALIDATION_REQUIREMENTS,
  ): Promise<{
    sessionId: string | null;
    sessionData: any;
    hasSession: boolean;
    isValid: boolean;
  }> {
    const sessionInfo = await BaseTestHelpers.getSessionDataFromStorage(page);
    const isValid = await BaseTestHelpers.validateSessionStructure(sessionInfo.sessionData, requirements);

    return {
      ...sessionInfo,
      isValid,
    };
  }

  /**
   * Wait for session timeout to occur
   */
  static async waitForSessionTimeout(
    page: Page,
    customTimeout?: number,
    checkInterval = 1000,
  ): Promise<{
    timedOut: boolean;
    sessionStillExists: boolean;
    finalSessionData: any;
  }> {
    const timeoutMs = customTimeout ?? SessionManagementConstants.DEFAULT_SESSION_TIMEOUT_MS;
    const startTime = Date.now();
    let sessionData = null;

    while (Date.now() - startTime < timeoutMs + 5000) {
      // Add 5s buffer
      const sessionInfo = await BaseTestHelpers.getSessionDataFromStorage(page);

      if (!sessionInfo.hasSession) {
        return {
          timedOut: true,
          sessionStillExists: false,
          finalSessionData: null,
        };
      }

      sessionData = sessionInfo.sessionData;
      await BaseTestHelpers.waitForTimeout(page, checkInterval);
    }

    return {
      timedOut: false,
      sessionStillExists: true,
      finalSessionData: sessionData,
    };
  }
}

// Re-export base helpers and constants for convenience
export { TestHelpers as BaseTestHelpers, TestConstants, TestAssertions } from '../test.helpers';

// Export enhanced session management helpers as primary TestHelpers
export { SessionManagementHelpers as TestHelpers };

// Export session management specific constants and helpers as defaults
export const TEST_PAGE_URL = SessionManagementConstants.TEST_PAGE_URL;
export const DEFAULT_TEST_CONFIG = SessionManagementConstants.DEFAULT_TEST_CONFIG as { id: string; qaMode: boolean };
export const MIN_SESSION_TIMEOUT_MS = SessionManagementConstants.MIN_SESSION_TIMEOUT_MS;
export const MAX_SESSION_TIMEOUT_MS = SessionManagementConstants.MAX_SESSION_TIMEOUT_MS;
