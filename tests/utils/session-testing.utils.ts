import { Page, BrowserContext } from '@playwright/test';
import { TIMEOUTS } from '../constants';

/**
 * Session management testing utilities for TraceLog E2E testing
 *
 * This module provides specialized utilities for testing TraceLog's session
 * management features including lifecycle, timeouts, recovery, and cross-tab
 * coordination. Essential for validating session-related test scenarios.
 *
 * @example
 * ```typescript
 * import { SessionUtils } from '../utils';
 *
 * // Test session lifecycle
 * await SessionUtils.triggerUserActivity(page);
 * await SessionUtils.waitForSessionStart(page);
 *
 * // Test session timeout
 * await SessionUtils.simulateInactivity(page, 16 * 60 * 1000);
 *
 * // Test cross-tab coordination
 * const tabs = await SessionUtils.createMultipleTabs(context, 3);
 * await SessionUtils.testCrossTabCoordination(tabs);
 * ```
 */

/**
 * Session data structure for testing
 */
export interface SessionData {
  /** Session ID */
  id: string;
  /** Whether session is active */
  isActive: boolean;
  /** Session start timestamp */
  startTime: number;
  /** Last activity timestamp */
  lastActivity: number;
  /** Session timeout value */
  timeout: number;
  /** Whether session was recovered */
  isRecovered?: boolean;
  /** Session metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Session testing options
 */
export interface SessionTestingOptions {
  /** Custom session timeout for testing */
  customTimeout?: number;
  /** Whether to enable debug logging */
  enableDebugLogging?: boolean;
  /** Activity simulation interval */
  activityInterval?: number;
  /** Maximum wait time for session events */
  maxWaitTime?: number;
}

/**
 * Activity types for session testing
 */
export type ActivityType = 'mouse' | 'keyboard' | 'touch' | 'scroll' | 'click' | 'focus' | 'visibility';

/**
 * Cross-tab testing result
 */
export interface CrossTabTestResult {
  /** Number of tabs tested */
  tabCount: number;
  /** Session coordination success */
  coordinationSuccess: boolean;
  /** Session synchronization results */
  synchronization: {
    allTabsSynced: boolean;
    syncTime: number;
    conflicts: string[];
  };
}

/**
 * Core session lifecycle utilities
 */
export class SessionLifecycle {
  /**
   * Triggers user activity to start a session
   */
  static async triggerUserActivity(page: Page, activityType: ActivityType = 'mouse'): Promise<void> {
    switch (activityType) {
      case 'mouse':
        await page.mouse.move(100, 100);
        await page.mouse.move(200, 200);
        break;

      case 'keyboard':
        await page.keyboard.press('Space');
        break;

      case 'touch':
        await page.touchscreen.tap(150, 150);
        break;

      case 'scroll':
        await page.evaluate(() => {
          window.scrollBy(0, 100);
        });
        break;

      case 'click':
        // Click on body if no specific element
        await page.locator('body').click({ position: { x: 100, y: 100 } });
        break;

      case 'focus':
        await page.evaluate(() => {
          window.focus();
        });
        break;

      case 'visibility':
        await page.evaluate(() => {
          document.dispatchEvent(new Event('visibilitychange'));
        });
        break;
    }

    // Small delay to ensure activity is registered
    await page.waitForTimeout(100);
  }

  /**
   * Waits for a session to start and returns session data
   */
  static async waitForSessionStart(page: Page, timeout: number = TIMEOUTS.MEDIUM): Promise<SessionData | null> {
    const result = await page.waitForFunction(
      () => {
        const bridge = window.__traceLogBridge;
        if (!bridge?.getSessionData) {
          return null;
        }

        const sessionData = bridge.getSessionData();
        return sessionData?.isActive ? sessionData : null;
      },
      {},
      { timeout },
    );

    const data = (await result.jsonValue()) as Record<string, unknown> | null;
    return data as SessionData | null;
  }

  /**
   * Retrieves current session data
   */
  static async getSessionData(page: Page): Promise<SessionData | null> {
    const data = await page.evaluate(() => {
      const bridge = window.__traceLogBridge;
      return bridge?.getSessionData() ?? null;
    });
    return data as SessionData | null;
  }

  /**
   * Waits for a session to end
   */
  static async waitForSessionEnd(page: Page, timeout: number = TIMEOUTS.MEDIUM): Promise<boolean> {
    try {
      await page.waitForFunction(
        () => {
          const bridge = window.__traceLogBridge;
          if (!bridge?.getSessionData) {
            return false;
          }

          const sessionData = bridge.getSessionData();
          return !sessionData?.isActive;
        },
        {},
        { timeout },
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Simulates user inactivity for session timeout testing
   */
  static async simulateInactivity(page: Page, duration: number): Promise<void> {
    // Stop any ongoing activity
    await page.evaluate(() => {
      // Clear any intervals that might be generating activity
      for (let i = 1; i < 1000; i++) {
        clearInterval(i);
        clearTimeout(i);
      }
    });

    // Wait for the specified duration without any activity
    await page.waitForTimeout(duration);
  }

  /**
   * Tests session recovery after page reload
   */
  static async testSessionRecovery(page: Page): Promise<{
    originalSession: SessionData | null;
    recoveredSession: SessionData | null;
    recoverySuccess: boolean;
  }> {
    // Get original session data
    const originalSession = await this.getSessionData(page);

    // Reload the page
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Wait for TraceLog to reinitialize
    await page.waitForFunction(
      () => {
        return !!window.__traceLogBridge;
      },
      {},
      { timeout: TIMEOUTS.MEDIUM },
    );

    // Get recovered session data
    const recoveredSession = await this.getSessionData(page);

    const recoverySuccess = !!(
      originalSession &&
      recoveredSession &&
      originalSession.id === recoveredSession.id &&
      recoveredSession.isRecovered
    );

    return {
      originalSession,
      recoveredSession,
      recoverySuccess,
    };
  }
}

/**
 * Session timeout testing utilities
 */
export class SessionTimeout {
  /**
   * Sets a custom session timeout for testing
   */
  static async setCustomTimeout(page: Page, timeoutMs: number): Promise<void> {
    await page.evaluate((timeout) => {
      const bridge = window.__traceLogBridge;
      if (bridge?.setSessionTimeout) {
        bridge.setSessionTimeout(timeout);
      }
    }, timeoutMs);
  }

  /**
   * Tests session timeout with custom duration
   */
  static async testSessionTimeout(
    page: Page,
    timeoutMs: number,
    options: SessionTestingOptions = {},
  ): Promise<{
    timeoutOccurred: boolean;
    actualTimeoutDuration: number;
    sessionEndReason: string | null;
  }> {
    const { maxWaitTime = timeoutMs + 5000 } = options;

    // Set custom timeout
    await this.setCustomTimeout(page, timeoutMs);

    // Start a session
    await SessionLifecycle.triggerUserActivity(page);
    await SessionLifecycle.waitForSessionStart(page);

    const startTime = Date.now();

    // Wait for session to timeout
    const timeoutOccurred = await SessionLifecycle.waitForSessionEnd(page, maxWaitTime);
    const actualTimeoutDuration = Date.now() - startTime;

    // Get session end reason from logs or session data
    const sessionEndReason = await page.evaluate(() => {
      // This would depend on how the session end reason is exposed
      // For now, we'll return a placeholder
      return 'inactivity';
    });

    return {
      timeoutOccurred,
      actualTimeoutDuration,
      sessionEndReason,
    };
  }

  /**
   * Tests that activity prevents session timeout
   */
  static async testActivityPreventsTimeout(
    page: Page,
    timeoutMs: number,
    activityInterval: number = timeoutMs / 3,
  ): Promise<boolean> {
    // Set custom timeout
    await this.setCustomTimeout(page, timeoutMs);

    // Start a session
    await SessionLifecycle.triggerUserActivity(page);
    await SessionLifecycle.waitForSessionStart(page);

    // Keep session active with periodic activity
    const activityPromise = this.keepSessionActive(page, timeoutMs + 1000, activityInterval);

    // Check if session is still active after timeout period
    await page.waitForTimeout(timeoutMs + 500);
    const sessionData = await SessionLifecycle.getSessionData(page);

    // Stop activity
    await activityPromise;

    return !!sessionData?.isActive;
  }

  /**
   * Keeps session active with periodic activity
   */
  private static async keepSessionActive(page: Page, duration: number, interval: number): Promise<void> {
    const startTime = Date.now();
    const activityTypes: ActivityType[] = ['mouse', 'keyboard', 'scroll'];

    while (Date.now() - startTime < duration) {
      const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      await SessionLifecycle.triggerUserActivity(page, activityType);
      await page.waitForTimeout(interval);
    }
  }
}

/**
 * Cross-tab session coordination testing
 */
export class CrossTabTesting {
  /**
   * Creates multiple tabs for cross-tab testing
   */
  static async createMultipleTabs(context: BrowserContext, tabCount: number, url = '/'): Promise<Page[]> {
    const tabs: Page[] = [];

    for (let i = 0; i < tabCount; i++) {
      const page = await context.newPage();
      await page.goto(url);

      // Wait for TraceLog to be available
      await page.waitForFunction(() => !!window.__traceLogBridge, {}, { timeout: TIMEOUTS.MEDIUM });

      tabs.push(page);
    }

    return tabs;
  }

  /**
   * Tests cross-tab session coordination
   */
  static async testCrossTabCoordination(tabs: Page[]): Promise<CrossTabTestResult> {
    if (tabs.length < 2) {
      throw new Error('At least 2 tabs required for cross-tab testing');
    }

    // Initialize sessions in all tabs
    for (const tab of tabs) {
      await SessionLifecycle.triggerUserActivity(tab);
      await SessionLifecycle.waitForSessionStart(tab);
    }

    // Wait for coordination to settle
    await tabs[0].waitForTimeout(1000);

    // Check session coordination
    const sessionIds = await Promise.all(
      tabs.map(async (tab) => {
        const sessionData = await SessionLifecycle.getSessionData(tab);
        return sessionData?.id ?? null;
      }),
    );

    // All tabs should share the same session ID
    const coordinationSuccess = sessionIds.every((id) => id === sessionIds[0] && id !== null);

    // Test synchronization
    const synchronization = await this.testSynchronization(tabs);

    return {
      tabCount: tabs.length,
      coordinationSuccess,
      synchronization,
    };
  }

  /**
   * Tests session synchronization across tabs
   */
  static async testSynchronization(tabs: Page[]): Promise<CrossTabTestResult['synchronization']> {
    const startTime = Date.now();

    // Generate activity in first tab and check if it syncs to others
    await SessionLifecycle.triggerUserActivity(tabs[0]);

    // Wait for synchronization
    await tabs[0].waitForTimeout(500);

    // Check if all tabs have synchronized session data
    const sessionDataArray = await Promise.all(tabs.map((tab) => SessionLifecycle.getSessionData(tab)));

    const lastActivityTimes = sessionDataArray.map((data) => data?.lastActivity ?? 0);
    const conflicts: string[] = [];

    // Check for synchronization conflicts
    const maxActivityTime = Math.max(...lastActivityTimes);
    const minActivityTime = Math.min(...lastActivityTimes.filter((time) => time > 0));

    if (maxActivityTime - minActivityTime > 1000) {
      conflicts.push('Activity time synchronization drift detected');
    }

    const allTabsSynced =
      conflicts.length === 0 && sessionDataArray.every((data) => data && data.isActive && data.lastActivity > 0);

    return {
      allTabsSynced,
      syncTime: Date.now() - startTime,
      conflicts,
    };
  }

  /**
   * Tests session persistence when tabs are closed
   */
  static async testTabClosureBehavior(
    context: BrowserContext,
    initialTabCount = 3,
  ): Promise<{
    sessionPersisted: boolean;
    finalActiveTab: number;
    sessionEndTriggered: boolean;
  }> {
    // Create multiple tabs
    const tabs = await this.createMultipleTabs(context, initialTabCount);

    // Initialize sessions
    for (const tab of tabs) {
      await SessionLifecycle.triggerUserActivity(tab);
      await SessionLifecycle.waitForSessionStart(tab);
    }

    // Close tabs one by one, leaving one open
    for (let i = tabs.length - 1; i > 0; i--) {
      await tabs[i].close();
      await tabs[0].waitForTimeout(500); // Wait for coordination update
    }

    // Check if session persisted in the remaining tab
    const remainingTab = tabs[0];
    const sessionData = await SessionLifecycle.getSessionData(remainingTab);
    const sessionPersisted = !!sessionData?.isActive;

    // Close the final tab
    await remainingTab.close();

    return {
      sessionPersisted,
      finalActiveTab: 0,
      sessionEndTriggered: !sessionPersisted,
    };
  }
}

/**
 * Session storage testing utilities
 */
export class SessionStorage {
  /**
   * Tests session data persistence in localStorage
   */
  static async testSessionPersistence(page: Page): Promise<{
    sessionSaved: boolean;
    sessionRestored: boolean;
    dataIntegrity: boolean;
  }> {
    // Start a session and generate some data
    await SessionLifecycle.triggerUserActivity(page);
    await SessionLifecycle.waitForSessionStart(page);

    const originalSession = await SessionLifecycle.getSessionData(page);

    // Check if session is saved to localStorage
    const sessionSaved = await page.evaluate(() => {
      const sessionKey = Object.keys(localStorage).find((key) => key.includes('tracelog-session'));
      return !!sessionKey && !!localStorage.getItem(sessionKey);
    });

    // Simulate page reload
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Wait for TraceLog to reinitialize
    await page.waitForFunction(() => !!window.__traceLogBridge, {}, { timeout: TIMEOUTS.MEDIUM });

    const restoredSession = await SessionLifecycle.getSessionData(page);

    const sessionRestored = !!restoredSession?.isRecovered;
    const dataIntegrity = !!(originalSession && restoredSession && originalSession.id === restoredSession.id);

    return {
      sessionSaved,
      sessionRestored,
      dataIntegrity,
    };
  }

  /**
   * Tests behavior when localStorage is unavailable
   */
  static async testStorageUnavailable(page: Page): Promise<{
    gracefulDegradation: boolean;
    sessionStillWorks: boolean;
  }> {
    // Disable localStorage
    await page.evaluate(() => {
      Object.defineProperty(window, 'localStorage', {
        value: null,
        writable: false,
      });
    });

    let gracefulDegradation = true;
    let sessionStillWorks = false;

    try {
      // Try to start a session
      await SessionLifecycle.triggerUserActivity(page);
      const session = await SessionLifecycle.waitForSessionStart(page, TIMEOUTS.SHORT);
      sessionStillWorks = !!session;
    } catch {
      gracefulDegradation = false;
    }

    return {
      gracefulDegradation,
      sessionStillWorks,
    };
  }
}

/**
 * Combined session testing utilities namespace
 */
export const SessionUtils = {
  // Lifecycle utilities
  triggerUserActivity: SessionLifecycle.triggerUserActivity,
  waitForSessionStart: SessionLifecycle.waitForSessionStart,
  getSessionData: SessionLifecycle.getSessionData,
  waitForSessionEnd: SessionLifecycle.waitForSessionEnd,
  simulateInactivity: SessionLifecycle.simulateInactivity,
  testSessionRecovery: SessionLifecycle.testSessionRecovery,

  // Timeout utilities
  setCustomTimeout: SessionTimeout.setCustomTimeout,
  testSessionTimeout: SessionTimeout.testSessionTimeout,
  testActivityPreventsTimeout: SessionTimeout.testActivityPreventsTimeout,

  // Cross-tab utilities
  createMultipleTabs: CrossTabTesting.createMultipleTabs,
  testCrossTabCoordination: CrossTabTesting.testCrossTabCoordination,
  testSynchronization: CrossTabTesting.testSynchronization,
  testTabClosureBehavior: CrossTabTesting.testTabClosureBehavior,

  // Storage utilities
  testSessionPersistence: SessionStorage.testSessionPersistence,
  testStorageUnavailable: SessionStorage.testStorageUnavailable,
} as const;
