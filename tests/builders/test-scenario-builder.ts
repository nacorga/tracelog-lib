import { expect } from '@playwright/test';
import { TraceLogTestPage } from '../fixtures/tracelog-fixtures';
import { PlaygroundPage } from '../pages/playground-page';
import { Config } from '../../src/types';
import { InitializationResult } from '../types';
import { EventCapture } from 'tests/utils/event-capture.utils';

/**
 * Fluent API Builder for TraceLog Test Scenarios
 *
 * This builder provides a fluent, readable API for constructing complex
 * test scenarios without boilerplate code. It handles common patterns
 * like initialization, event capture, user interactions, and assertions.
 *
 * @example
 * ```typescript
 * await TraceLogTestBuilder
 *   .create(traceLogPage)
 *   .withConfig({ id: 'test-project' })
 *   .expectInitialization()
 *   .startEventCapture()
 *   .simulateUserJourney('purchase_intent')
 *   .expectEvents(['CLICK', 'CUSTOM'])
 *   .expectNoErrors()
 *   .run();
 * ```
 */
export class TraceLogTestBuilder {
  private readonly traceLogPage: TraceLogTestPage;
  private readonly playgroundPage: PlaygroundPage;
  private config?: Partial<Config>;
  private eventCapture?: EventCapture;
  private expectedEvents: string[] = [];
  private expectedEventCount?: number;
  private shouldExpectInitialization = false;
  private shouldExpectNoErrors = false;
  private readonly customActions: (() => Promise<void>)[] = [];
  private readonly customAssertions: (() => Promise<void>)[] = [];

  private constructor(traceLogPage: TraceLogTestPage) {
    this.traceLogPage = traceLogPage;
    this.playgroundPage = new PlaygroundPage(traceLogPage);
  }

  /**
   * Create a new test scenario builder
   */
  static create(traceLogPage: TraceLogTestPage): TraceLogTestBuilder {
    return new TraceLogTestBuilder(traceLogPage);
  }

  /**
   * Set TraceLog configuration for initialization
   */
  withConfig(config: Partial<Config>): TraceLogTestBuilder {
    this.config = config;
    return this;
  }

  /**
   * Expect successful initialization
   */
  expectInitialization(): TraceLogTestBuilder {
    this.shouldExpectInitialization = true;
    return this;
  }

  /**
   * Start event capture before running test actions
   */
  startEventCapture(options?: { maxEvents?: number }): TraceLogTestBuilder {
    this.customActions.unshift(async () => {
      this.eventCapture = await this.traceLogPage.startEventCapture(options);
    });
    return this;
  }

  /**
   * Expect specific event types to be captured
   */
  expectEvents(eventTypes: string[]): TraceLogTestBuilder {
    this.expectedEvents = eventTypes;
    return this;
  }

  /**
   * Expect specific number of events to be captured
   */
  expectEventCount(count: number): TraceLogTestBuilder {
    this.expectedEventCount = count;
    return this;
  }

  /**
   * Expect no TraceLog errors
   */
  expectNoErrors(): TraceLogTestBuilder {
    this.shouldExpectNoErrors = true;
    return this;
  }

  /**
   * Expect specific number of errors (for error injection tests)
   */
  expectErrors(count: number): TraceLogTestBuilder {
    this.customAssertions.push(async () => {
      await this.traceLogPage.expectTraceLogErrors(count);
    });
    return this;
  }

  /**
   * Perform playground user journey simulation
   */
  simulateUserJourney(pattern?: 'quick_browse' | 'detailed_exploration' | 'purchase_intent'): TraceLogTestBuilder {
    this.customActions.push(async () => {
      if (pattern) {
        await this.playgroundPage.simulateActivityPattern(pattern);
      } else {
        await this.playgroundPage.simulateUserJourney();
      }
    });
    return this;
  }

  /**
   * Click specific playground elements
   */
  clickElement(element: 'cta' | 'add-to-cart' | 'product'): TraceLogTestBuilder {
    this.customActions.push(async () => {
      switch (element) {
        case 'cta':
          await this.playgroundPage.clickViewProducts();
          break;
        case 'add-to-cart':
          await this.playgroundPage.addProductToCart(1);
          break;
        case 'product':
          await this.playgroundPage.interactWithProduct(1, ['click']);
          break;
      }
    });
    return this;
  }

  /**
   * Scroll to specific section or percentage
   */
  scroll(target: 'hero' | 'products' | 'features' | 'bottom' | number): TraceLogTestBuilder {
    this.customActions.push(async () => {
      if (typeof target === 'number') {
        await this.playgroundPage.scrollByPercentage(target);
      } else {
        await this.playgroundPage.scrollToSection(target);
      }
    });
    return this;
  }

  /**
   * Send custom events
   */
  sendCustomEvent(name: string, data?: Record<string, unknown>): TraceLogTestBuilder {
    this.customActions.push(async () => {
      await this.traceLogPage.sendCustomEvent(name, data);
    });
    return this;
  }

  /**
   * Trigger intentional error for resilience testing
   */
  triggerError(message?: string): TraceLogTestBuilder {
    this.customActions.push(async () => {
      await this.traceLogPage.triggerTestError(message);
    });
    return this;
  }

  /**
   * Force bridge simulation methods
   */
  forceBridgeState(state: 'initLock', enabled = true): TraceLogTestBuilder {
    this.customActions.push(async () => {
      await this.traceLogPage.createFreshBridge();

      if (state === 'initLock') {
        await this.traceLogPage.executeBridgeMethod('forceInitLock', enabled);
      }
    });
    return this;
  }

  /**
   * Wait for specific time (use sparingly)
   */
  wait(ms: number): TraceLogTestBuilder {
    this.customActions.push(async () => {
      await this.traceLogPage.page.waitForTimeout(ms);
    });
    return this;
  }

  /**
   * Add custom action
   */
  customAction(
    action: (traceLogPage: TraceLogTestPage, playgroundPage: PlaygroundPage) => Promise<void>,
  ): TraceLogTestBuilder {
    this.customActions.push(() => action(this.traceLogPage, this.playgroundPage));
    return this;
  }

  /**
   * Add custom assertion
   */
  customAssertion(
    assertion: (
      traceLogPage: TraceLogTestPage,
      playgroundPage: PlaygroundPage,
      eventCapture?: EventCapture,
    ) => Promise<void>,
  ): TraceLogTestBuilder {
    this.customAssertions.push(() => assertion(this.traceLogPage, this.playgroundPage, this.eventCapture));
    return this;
  }

  /**
   * Take screenshot during execution (useful for debugging)
   */
  screenshot(name: string): TraceLogTestBuilder {
    this.customActions.push(async () => {
      await this.traceLogPage.screenshot(name);
    });
    return this;
  }

  /**
   * Test mobile-specific behavior
   */
  testMobileBehavior(): TraceLogTestBuilder {
    this.customActions.push(async () => {
      await this.playgroundPage.performMobileInteractions();
    });
    return this;
  }

  /**
   * Test responsive behavior across viewports
   */
  testResponsive(): TraceLogTestBuilder {
    this.customActions.push(async () => {
      await this.playgroundPage.testResponsiveBehavior();
    });
    return this;
  }

  /**
   * Execute the built scenario
   */
  async run(): Promise<{
    initResult?: InitializationResult;
    eventCapture?: EventCapture;
    testSummary: any;
  }> {
    let initResult: InitializationResult | undefined;

    try {
      // Initialize TraceLog if config provided
      if (this.config || this.shouldExpectInitialization) {
        initResult = await this.traceLogPage.initializeTraceLog(this.config);

        if (this.shouldExpectInitialization && initResult) {
          expect(initResult.success).toBe(true);
        }
      }

      // Execute all custom actions in order
      for (const action of this.customActions) {
        await action();
      }

      // Wait a bit for events to be processed
      if (this.eventCapture || this.expectedEvents.length > 0 || this.expectedEventCount) {
        await this.traceLogPage.page.waitForTimeout(500);
      }

      // Execute assertions
      await this.runAssertions();

      return {
        initResult,
        eventCapture: this.eventCapture,
        testSummary: this.traceLogPage.getTestSummary(),
      };
    } catch (error) {
      // Take screenshot on failure for debugging
      await this.traceLogPage.screenshot('failure');
      throw error;
    }
  }

  /**
   * Execute all assertions
   */
  private async runAssertions(): Promise<void> {
    // Event-related assertions
    if (this.eventCapture && this.expectedEvents.length > 0) {
      for (const eventType of this.expectedEvents) {
        const events = this.eventCapture
          .getEvents()
          .filter(
            (e) =>
              e.message?.toUpperCase().includes(eventType.toUpperCase()) ||
              e.namespace?.toUpperCase().includes(eventType.toUpperCase()),
          );
        expect(events.length).toBeGreaterThan(0);
      }
    }

    if (this.eventCapture && this.expectedEventCount !== undefined) {
      const events = this.eventCapture.getEvents();
      expect(events.length).toBe(this.expectedEventCount);
    }

    // Error-related assertions
    if (this.shouldExpectNoErrors) {
      await this.traceLogPage.expectNoTraceLogErrors();
    }

    // Custom assertions
    for (const assertion of this.customAssertions) {
      await assertion();
    }
  }
}

/**
 * Convenience functions for common test scenarios
 */
export class TraceLogScenarios {
  /**
   * Basic initialization test
   */
  static async basicInitialization(traceLogPage: TraceLogTestPage, config?: Partial<Config>) {
    return TraceLogTestBuilder.create(traceLogPage)
      .withConfig(config as Partial<Config>)
      .expectInitialization()
      .expectNoErrors()
      .run();
  }

  /**
   * User interaction flow test
   */
  static async userInteractionFlow(
    traceLogPage: TraceLogTestPage,
    pattern?: 'quick_browse' | 'detailed_exploration' | 'purchase_intent',
  ) {
    return TraceLogTestBuilder.create(traceLogPage)
      .withConfig({ id: 'test-interaction' })
      .expectInitialization()
      .startEventCapture({ maxEvents: 100 })
      .simulateUserJourney(pattern)
      .expectEvents(['CLICK', 'SCROLL'])
      .expectNoErrors()
      .run();
  }

  /**
   * Error resilience test
   */
  static async errorResilienceTest(traceLogPage: TraceLogTestPage) {
    return TraceLogTestBuilder.create(traceLogPage)
      .withConfig({ id: 'test-resilience' })
      .expectInitialization()
      .startEventCapture()
      .clickElement('cta')
      .triggerError('Test resilience error')
      .expectErrors(1)
      .run();
  }

  /**
   * Custom event validation test
   */
  static async customEventValidation(traceLogPage: TraceLogTestPage) {
    return TraceLogTestBuilder.create(traceLogPage)
      .withConfig({ id: 'test-custom-events' })
      .expectInitialization()
      .startEventCapture()
      .sendCustomEvent('test_start', { phase: 'validation' })
      .clickElement('cta')
      .sendCustomEvent('test_interaction', { type: 'click' })
      .expectEvents(['CUSTOM', 'CLICK'])
      .expectNoErrors()
      .run();
  }

  /**
   * Performance and web vitals test
   */
  static async performanceTest(traceLogPage: TraceLogTestPage) {
    return TraceLogTestBuilder.create(traceLogPage)
      .withConfig({ id: 'test-performance' })
      .expectInitialization()
      .startEventCapture()
      .simulateUserJourney('detailed_exploration')
      .wait(1000) // Allow time for vitals to be captured
      .expectEvents(['WEB_VITALS', 'PERFORMANCE'])
      .expectNoErrors()
      .run();
  }

  /**
   * Mobile-specific test scenario
   */
  static async mobileScenario(traceLogPage: TraceLogTestPage) {
    return TraceLogTestBuilder.create(traceLogPage)
      .withConfig({ id: 'test-mobile' })
      .expectInitialization()
      .startEventCapture()
      .testMobileBehavior()
      .expectEvents(['CLICK', 'SCROLL'])
      .expectNoErrors()
      .run();
  }
}

export default TraceLogTestBuilder;
