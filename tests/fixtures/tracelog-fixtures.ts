import { test as base, Page, expect } from '@playwright/test';
import { TestUtils } from '../utils';
import { ConsoleMonitor, InitializationResult } from '../types';
import { Config, SpecialProjectId } from '../../src/types';
import { TIMEOUTS } from '../constants';
import { EventCapture } from 'tests/utils/event-capture.utils';
import '../matchers/tracelog-matchers';

/**
 * TraceLog Test Page - High-level abstraction for TraceLog testing
 *
 * This class encapsulates common TraceLog testing patterns, providing:
 * - Automatic setup and teardown
 * - Consistent initialization patterns
 * - Resource management (monitors, captures)
 * - Error handling and debugging utilities
 */
export class TraceLogTestPage {
  private readonly monitor: ConsoleMonitor;
  private eventCapture?: EventCapture;
  private isSetup = false;
  private resources: (() => void | Promise<void>)[] = [];

  constructor(public readonly page: Page) {
    this.monitor = TestUtils.createConsoleMonitor(page);
    this.resources.push(() => this.monitor.cleanup());
  }

  /**
   * Setup the page for TraceLog testing
   * Navigates to test URL and waits for bridge availability
   */
  async setup(): Promise<void> {
    if (this.isSetup) return;

    try {
      await this.page.goto('/?e2e=true');
      await this.page.waitForLoadState('networkidle');
      await this.page.waitForFunction(() => !!window.__traceLogBridge, { timeout: TIMEOUTS.INITIALIZATION });
      this.isSetup = true;
    } catch (error) {
      await this.cleanup();
      throw new Error(`TraceLogTestPage setup failed: ${error}`);
    }
  }

  /**
   * Initialize TraceLog with given configuration
   */
  async initializeTraceLog(config?: Partial<Config>): Promise<InitializationResult> {
    this.ensureSetup();

    const finalConfig = {
      id: SpecialProjectId.Skip,
      ...config,
    };

    return TestUtils.initializeTraceLog(this.page, finalConfig);
  }

  /**
   * Create and start event capture
   */
  async startEventCapture(options?: { maxEvents?: number }): Promise<EventCapture> {
    this.ensureSetup();

    if (this.eventCapture) {
      throw new Error('Event capture already started');
    }

    this.eventCapture = TestUtils.createEventCapture(options);
    await this.eventCapture.startCapture(this.page);
    this.resources.push(() => this.eventCapture?.stopCapture());

    return this.eventCapture;
  }

  /**
   * Get current event capture instance
   */
  getEventCapture(): EventCapture {
    if (!this.eventCapture) {
      throw new Error('Event capture not started. Call startEventCapture() first.');
    }
    return this.eventCapture;
  }

  /**
   * Get tracked events (convenience method)
   */
  async getTrackedEvents() {
    // This is a placeholder - actual implementation depends on EventCapture
    if (!this.eventCapture) {
      throw new Error('Event capture not started. Call startEventCapture() first.');
    }
    return this.eventCapture.getEvents();
  }

  /**
   * Get console monitor instance
   */
  getConsoleMonitor(): ConsoleMonitor {
    return this.monitor;
  }

  /**
   * Create fresh bridge instance (useful for tests that need clean state)
   */
  async createFreshBridge(): Promise<void> {
    this.ensureSetup();

    await this.page.evaluate(() => {
      if ((window as any).__createFreshTraceLogBridge) {
        (window as any).__createFreshTraceLogBridge();
      }
    });
  }

  /**
   * Execute bridge method safely with proper typing
   */
  async executeBridgeMethod<T = any>(method: string, ...args: any[]): Promise<T> {
    this.ensureSetup();

    return this.page.evaluate(
      ({ method, args }) => {
        const bridge = window.__traceLogBridge;
        if (!bridge) {
          throw new Error('TraceLog bridge not available');
        }

        const methodFn = (bridge as any)[method];
        if (typeof methodFn !== 'function') {
          throw new Error(`Method ${method} not found on bridge`);
        }

        return methodFn.apply(bridge, args);
      },
      { method, args },
    );
  }

  /**
   * Send custom event through bridge
   */
  async sendCustomEvent(name: string, data?: Record<string, unknown>): Promise<void> {
    return this.executeBridgeMethod('sendCustomEvent', name, data);
  }

  /**
   * Click element on the page (simple wrapper around page.click)
   */
  async clickElement(selector: string): Promise<void> {
    this.ensureSetup();
    await this.page.click(selector);
  }

  /**
   * Trigger intentional error for resilience testing
   */
  async triggerTestError(message = 'Test error for resilience validation'): Promise<void> {
    this.ensureSetup();

    try {
      await this.page.evaluate((msg) => {
        throw new Error(msg);
      }, message);
    } catch {
      // Expected error - this should fail
    }
  }

  /**
   * Wait for specific initialization state
   */
  async waitForInitialization(timeout = TIMEOUTS.INITIALIZATION): Promise<void> {
    this.ensureSetup();

    await TestUtils.waitForCondition(
      async () => {
        try {
          const bridge = await TestUtils.getAppInstance(this.page);
          return bridge?.initialized === true;
        } catch {
          return false;
        }
      },
      { timeout, interval: 100 },
    );
  }

  /**
   * Assert no TraceLog errors occurred
   */
  async expectNoTraceLogErrors(): Promise<void> {
    const hasErrors = TestUtils.verifyNoTraceLogErrors(this.monitor.traceLogErrors);
    expect(hasErrors).toBe(true);
  }

  /**
   * Assert specific number of TraceLog errors (useful for error injection tests)
   */
  async expectTraceLogErrors(expectedCount: number): Promise<void> {
    expect(this.monitor.traceLogErrors.length).toBe(expectedCount);
  }

  /**
   * Get comprehensive test summary for debugging
   */
  getTestSummary(): {
    consoleMessages: number;
    traceLogErrors: number;
    traceLogWarnings: number;
    debugLogs: number;
    anomalies: string[];
    eventsCaptured?: number;
  } {
    const summary = this.monitor.getSummary();
    const result = {
      consoleMessages: summary.total,
      traceLogErrors: this.monitor.traceLogErrors.length,
      traceLogWarnings: this.monitor.traceLogWarnings.length,
      debugLogs: this.monitor.debugLogs.length,
      anomalies: this.monitor.getAnomalies(),
    };

    if (this.eventCapture) {
      (result as any).eventsCaptured = this.eventCapture.getEvents().length;
    }

    return result;
  }

  /**
   * Take screenshot with descriptive name (useful for debugging)
   */
  async screenshot(name: string): Promise<void> {
    const timestamp = Date.now();
    await this.page.screenshot({
      path: `test-results/screenshots/${name}-${timestamp}.png`,
      fullPage: true,
    });
  }

  /**
   * Cleanup all resources
   */
  async cleanup(): Promise<void> {
    // Execute cleanup functions in reverse order
    const cleanupPromises = this.resources.reverse().map(async (cleanupFn) => {
      try {
        await cleanupFn();
      } catch (error) {
        console.warn('Cleanup function failed:', error);
      }
    });

    await Promise.allSettled(cleanupPromises);
    this.resources = [];
    this.isSetup = false;
  }

  private ensureSetup(): void {
    if (!this.isSetup) {
      throw new Error('TraceLogTestPage not setup. Call setup() first.');
    }
  }
}

/**
 * Extended test fixtures for TraceLog testing
 */
interface TraceLogTestFixtures {
  traceLogPage: TraceLogTestPage;
}

/**
 * TraceLog-specific test function with custom fixtures
 *
 * This provides automatic setup/teardown for TraceLog testing scenarios,
 * eliminating boilerplate and ensuring consistent resource management.
 *
 * @example
 * ```typescript
 * traceLogTest('should initialize successfully', async ({ traceLogPage }) => {
 *   const result = await traceLogPage.initializeTraceLog();
 *   expect(result.success).toBe(true);
 *
 *   await traceLogPage.expectNoTraceLogErrors();
 * });
 * ```
 */
export const traceLogTest = base.extend<TraceLogTestFixtures>({
  traceLogPage: async ({ page }, use) => {
    const traceLogPage = new TraceLogTestPage(page);

    try {
      await traceLogPage.setup();
      await use(traceLogPage);
    } finally {
      // Log summary for debugging if test failed
      try {
        const summary = traceLogPage.getTestSummary();
        if (summary.traceLogErrors > 0 || summary.anomalies.length > 0) {
          console.log('TraceLog Test Summary:', JSON.stringify(summary, null, 2));
        }
      } catch (error) {
        console.warn('Failed to generate test summary:', error);
      }

      await traceLogPage.cleanup();
    }
  },
});

/**
 * Describe function for TraceLog test suites
 */
export const traceLogDescribe = traceLogTest.describe;

/**
 * Export traceLogTest as default for convenience
 */
export default traceLogTest;
