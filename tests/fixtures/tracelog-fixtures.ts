import { test as base, Page, expect } from '@playwright/test';
import { TestUtils } from '../utils';
import { Config, SpecialProjectId } from '../../src/types';
import { EventCapture } from 'tests/utils/event-capture.utils';
import { ConsoleMonitor, InitializationResult } from '../types/common.types';
import { EventLogDispatch } from '../types/event-capture.types';
import '../matchers/tracelog-matchers';

// Timeout constants
const TIMEOUTS = {
  INITIALIZATION: 10000,
};

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

    const result = await TestUtils.initializeTraceLog(this.page, finalConfig);

    if (!result.success) {
      // Take screenshot for debugging
      await this.screenshot('initialization-failed');
    }

    return result;
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
  async getTrackedEvents(): Promise<any[]> {
    if (!this.eventCapture) {
      throw new Error('Event capture not started. Call startEventCapture() first.');
    }

    // Get debug logs from EventCapture
    const debugLogs = this.eventCapture.getEvents();

    // Extract TraceLog events from debug logs
    const traceLogEvents = this.extractTraceLogEventsFromDebugLogs(debugLogs);

    return traceLogEvents;
  }

  /**
   * Extract real TraceLog events from debug logs
   */
  private extractTraceLogEventsFromDebugLogs(debugLogs: EventLogDispatch[]): any[] {
    const events: any[] = [];

    debugLogs.forEach((log) => {
      try {
        // Look for EventManager logs with event data
        if (log.namespace === 'EventManager' && log.data) {
          let eventData = null;

          // Try different event data structures with proper type checking
          const logData = log.data as any;
          if (logData.type) {
            eventData = logData;
          } else if (logData.event?.type) {
            eventData = logData.event;
          } else if (logData.eventData) {
            eventData = logData.eventData;
          }

          // Only include events with valid timestamps
          if (eventData?.timestamp) {
            events.push(eventData);
          }
        }
      } catch (error) {
        console.warn('[TraceLogTestPage] Error extracting event from debug log:', error);
      }
    });

    return events;
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
      if (window.__createFreshTraceLogBridge) {
        window.__createFreshTraceLogBridge();
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
  async sendCustomEvent(name: string, data?: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
    try {
      this.ensureSetup();

      const result = await this.page.evaluate(
        ({ name, data }) => {
          try {
            const bridge = window.__traceLogBridge;
            if (!bridge) {
              throw new Error('TraceLog bridge not available');
            }

            bridge.sendCustomEvent(name, data);
            return { success: true, error: null };
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : String(error),
            };
          }
        },
        { name, data },
      );

      return result.success ? { success: true } : { success: false, error: result.error || 'Unknown error' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Check if TraceLog is initialized
   */
  async isInitialized(): Promise<boolean> {
    this.ensureSetup();

    return this.page.evaluate(() => {
      const bridge = window.__traceLogBridge;
      return bridge?.initialized === true;
    });
  }

  /**
   * Get initialization status with detailed info
   */
  async getInitializationStatus(): Promise<{
    isInitialized: boolean;
    isInitializing: boolean;
    hasInstance: boolean;
  }> {
    this.ensureSetup();

    return this.page.evaluate(() => {
      const bridge = window.__traceLogBridge;

      return {
        isInitialized: bridge?.initialized === true,
        isInitializing: typeof bridge?.isInitializing === 'function' ? bridge.isInitializing() === true : false,
        hasInstance: !!bridge,
      };
    });
  }

  /**
   * Get configuration from TraceLog
   */
  async getConfig(): Promise<any> {
    this.ensureSetup();

    return this.page.evaluate(() => {
      const bridge = window.__traceLogBridge;
      return bridge?.get?.('config');
    });
  }

  /**
   * Destroy TraceLog instance
   */
  async destroy(): Promise<void> {
    this.ensureSetup();

    await this.page.evaluate(async () => {
      const bridge = window.__traceLogBridge;
      if (bridge && typeof bridge.destroy === 'function') {
        await bridge.destroy();
      }
    });
  }

  /**
   * Click element on the page
   */
  async clickElement(selector: string): Promise<void> {
    this.ensureSetup();

    // Check if element exists and is visible
    const elementInfo = await this.page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (!element) return { exists: false };

      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);

      return {
        exists: true,
        visible: rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden',
        disabled: (element as HTMLButtonElement).disabled,
        text: element.textContent?.trim(),
        position: { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
      };
    }, selector);

    if (!elementInfo.exists) {
      await this.screenshot(`element-not-found-${selector.replace(/[^a-zA-Z0-9]/g, '_')}`);
      throw new Error(`Element not found: ${selector}`);
    }

    if (!elementInfo.visible) {
      await this.screenshot(`element-not-visible-${selector.replace(/[^a-zA-Z0-9]/g, '_')}`);
      throw new Error(`Element not visible: ${selector}`);
    }

    if (elementInfo.disabled) {
      await this.screenshot(`element-disabled-${selector.replace(/[^a-zA-Z0-9]/g, '_')}`);
      throw new Error(`Element is disabled: ${selector}`);
    }

    // Enhanced click stability for SPA navigation
    try {
      await this.page.click(selector, {
        timeout: 15000,
        force: false,
        trial: false,
      });
    } catch (error) {
      // If click is intercepted, try with force as fallback (SPA navigation issue)
      if ((error as Error).message.includes('intercepts pointer events')) {
        await this.page.click(selector, {
          timeout: 15000,
          force: true,
          trial: false,
        });
      } else {
        throw error;
      }
    }

    // Wait a bit after click to ensure navigation starts
    await this.page.waitForTimeout(200);
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
    const result: {
      consoleMessages: number;
      traceLogErrors: number;
      traceLogWarnings: number;
      debugLogs: number;
      anomalies: string[];
      eventsCaptured?: number;
    } = {
      consoleMessages: summary.total,
      traceLogErrors: this.monitor.traceLogErrors.length,
      traceLogWarnings: this.monitor.traceLogWarnings.length,
      debugLogs: this.monitor.debugLogs.length,
      anomalies: this.monitor.getAnomalies(),
    };

    if (this.eventCapture) {
      result.eventsCaptured = this.eventCapture.getEvents().length;
    }

    return result;
  }

  /**
   * Validate page state for TechShop SPA
   */
  async validatePageState(expectedPage?: string): Promise<{
    currentHash: string;
    currentPage: string;
    elementsVisible: Record<string, boolean>;
    readyState: string;
  }> {
    this.ensureSetup();

    const state = await this.page.evaluate(() => {
      const hash = window.location.hash;
      const currentPage = hash.replace('#', '') || 'inicio';

      // Check key elements based on page
      const elementsToCheck: Record<string, string[]> = {
        inicio: ['.hero-section', '[data-testid="cta-ver-productos"]'],
        productos: ['.products-grid', '[data-testid="add-cart-1"]', '[data-testid="cart-count"]'],
        nosotros: ['.page.active'],
        contacto: ['[data-testid="form-name"]', '[data-testid="form-email"]'],
      };

      const elementsVisible: Record<string, boolean> = {};
      const elementsForPage = elementsToCheck[currentPage] || [];

      elementsForPage.forEach((selector) => {
        const element = document.querySelector(selector);
        if (element) {
          const style = window.getComputedStyle(element);
          // More lenient visibility check - element exists and is not hidden
          elementsVisible[selector] =
            (element as HTMLElement).offsetParent !== null && style.display !== 'none' && style.visibility !== 'hidden';
        } else {
          elementsVisible[selector] = false;
        }
      });

      return {
        currentHash: hash,
        currentPage,
        elementsVisible,
        readyState: document.readyState,
      };
    });

    if (expectedPage && state.currentPage !== expectedPage) {
      await this.screenshot(`page-state-mismatch-expected-${expectedPage}-got-${state.currentPage}`);
    }

    return state;
  }

  /**
   * Wait for page navigation and validate state
   */
  async waitForPageNavigation(expectedPage: string, timeout = 5000): Promise<void> {
    this.ensureSetup();

    // Wait for hash to change
    await this.page.waitForFunction((page) => window.location.hash === `#${page}`, expectedPage, { timeout });

    // Wait for the page to become active (crucial for SPA)
    await this.page.waitForFunction(
      (page) => {
        const pageElement = document.getElementById(`page-${page}`);
        return pageElement?.classList.contains('active') === true;
      },
      expectedPage,
      { timeout },
    );

    // Small delay to ensure page is stable
    await this.page.waitForTimeout(300);

    const state = await this.validatePageState(expectedPage);

    // Check if key elements are visible
    const hasInvisibleElements = Object.entries(state.elementsVisible).some(([, visible]) => !visible);

    if (hasInvisibleElements) {
      await this.screenshot(`page-navigation-incomplete-${expectedPage}`);
      // Note: Some elements may not be immediately visible in SPA navigation, which is acceptable
    }
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
