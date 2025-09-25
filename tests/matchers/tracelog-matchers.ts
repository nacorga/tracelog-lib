import { expect } from '@playwright/test';
import { TraceLogTestPage } from '../fixtures/tracelog-fixtures';

// Local type definitions
interface EventLogDispatch {
  type: string;
  name?: string;
  message?: string;
  namespace?: string;
  data?: any;
  custom_event?: {
    name: string;
  };
}

interface InitializationResult {
  success: boolean;
  error?: string;
}

/**
 * Custom matchers for TraceLog-specific assertions
 *
 * These matchers provide expressive, domain-specific assertions
 * that make test code more readable and maintainable.
 */

// Extend Playwright's expect interface
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace PlaywrightTest {
    interface Matchers<R> {
      // Event-related matchers
      toHaveEvent(eventType: string): R;
      toHaveEventWithData(eventType: string, data: Record<string, any>): R;
      toHaveEventCount(count: number): R;
      toHaveEventsInOrder(eventTypes: string[]): R;

      // TraceLog-specific matchers
      toBeSuccessfullyInitialized(): R;
      toHaveNoTraceLogErrors(): R;
      toHaveTraceLogErrors(count: number): R;
      toHaveSessionId(): R;
      toBeInState(state: string): R;

      // Console and monitoring matchers
      toHaveConsoleMessage(pattern: string | RegExp): R;
      toHaveAnomalies(maxCount?: number): R;

      // Performance matchers
      toHaveWebVitalsEvent(): R;
      toHavePerformanceMetrics(): R;

      // Custom event matchers
      toHaveCustomEvent(eventName: string): R;
      toHaveCustomEventWithProperties(eventName: string, properties: Record<string, any>): R;
    }
  }
}

/**
 * Event-related matcher implementations
 */
expect.extend({
  /**
   * Check if events array contains specific event type
   */
  toHaveEvent(received: EventLogDispatch[], eventType: string) {
    const matchingEvents = received.filter(
      (event) =>
        event.message?.toUpperCase().includes(eventType.toUpperCase()) ||
        event.namespace?.toUpperCase().includes(eventType.toUpperCase()),
    );

    const pass = matchingEvents.length > 0;

    return {
      message: () =>
        pass
          ? `Expected events not to contain type "${eventType}"`
          : `Expected events to contain type "${eventType}". Available events: ${received.map((e) => `${e.namespace}:${e.message}`).join(', ')}`,
      pass,
    };
  },

  /**
   * Check if events array contains specific event with matching data
   */
  toHaveEventWithData(received: EventLogDispatch[], eventType: string, expectedData: Record<string, any>) {
    const matchingEvents = received.filter((event) => {
      const typeMatches =
        event.message?.toUpperCase().includes(eventType.toUpperCase()) ||
        event.namespace?.toUpperCase().includes(eventType.toUpperCase());

      if (!typeMatches) return false;

      // Check if event data contains expected properties
      const eventData = event.data || {};
      return Object.entries(expectedData).every(([key, value]) => {
        return (eventData as Record<string, any>)[key] === value;
      });
    });

    const pass = matchingEvents.length > 0;

    return {
      message: () =>
        pass
          ? `Expected events not to contain type "${eventType}" with data ${JSON.stringify(expectedData)}`
          : `Expected events to contain type "${eventType}" with data ${JSON.stringify(expectedData)}. Available events: ${received.map((e) => `${e.namespace}:${e.message} (${JSON.stringify(e.data || {})})`).join(', ')}`,
      pass,
    };
  },

  /**
   * Check exact event count
   */
  toHaveEventCount(received: EventLogDispatch[], expectedCount: number) {
    const actualCount = received.length;
    const pass = actualCount === expectedCount;

    return {
      message: () =>
        pass
          ? `Expected events not to have count ${expectedCount}`
          : `Expected ${expectedCount} events but received ${actualCount}. Events: ${received.map((e) => `${e.namespace}:${e.message}`).join(', ')}`,
      pass,
    };
  },

  /**
   * Check if events occur in specific order
   */
  toHaveEventsInOrder(received: EventLogDispatch[], expectedOrder: string[]) {
    const eventTypes = received.map((event) => event.message?.toUpperCase() || event.namespace?.toUpperCase() || '');

    let lastFoundIndex = -1;
    const foundEvents: string[] = [];

    for (const expectedType of expectedOrder) {
      const index = eventTypes.findIndex(
        (type, idx) => idx > lastFoundIndex && type.includes(expectedType.toUpperCase()),
      );

      if (index === -1) {
        break;
      }

      foundEvents.push(expectedType);
      lastFoundIndex = index;
    }

    const pass = foundEvents.length === expectedOrder.length;

    return {
      message: () =>
        pass
          ? `Expected events not to occur in order [${expectedOrder.join(', ')}]`
          : `Expected events in order [${expectedOrder.join(', ')}] but found [${foundEvents.join(', ')}]. All events: [${eventTypes.join(', ')}]`,
      pass,
    };
  },
});

/**
 * TraceLog-specific matchers
 */
expect.extend({
  /**
   * Check if initialization result is successful
   */
  toBeSuccessfullyInitialized(received: InitializationResult) {
    const pass = received.success === true;

    return {
      message: () =>
        pass
          ? `Expected initialization not to be successful`
          : `Expected initialization to be successful but got: ${JSON.stringify(received)}`,
      pass,
    };
  },

  /**
   * Check if TraceLog page has no errors
   */
  async toHaveNoTraceLogErrors(received: TraceLogTestPage) {
    const monitor = received.getConsoleMonitor();
    const hasNoErrors = monitor.traceLogErrors.length === 0;

    return {
      message: () =>
        hasNoErrors
          ? `Expected TraceLog to have errors`
          : `Expected no TraceLog errors but found ${monitor.traceLogErrors.length}: ${monitor.traceLogErrors.slice(0, 3).join(', ')}${monitor.traceLogErrors.length > 3 ? '...' : ''}`,
      pass: hasNoErrors,
    };
  },

  /**
   * Check if TraceLog page has specific number of errors
   */
  async toHaveTraceLogErrors(received: TraceLogTestPage, expectedCount: number) {
    const monitor = received.getConsoleMonitor();
    const actualCount = monitor.traceLogErrors.length;
    const pass = actualCount === expectedCount;

    return {
      message: () =>
        pass
          ? `Expected not to have ${expectedCount} TraceLog errors`
          : `Expected ${expectedCount} TraceLog errors but found ${actualCount}. Errors: ${monitor.traceLogErrors.join(', ')}`,
      pass,
    };
  },

  /**
   * Check if TraceLog has valid session ID
   */
  async toHaveSessionId(received: TraceLogTestPage) {
    try {
      const sessionData = await received.executeBridgeMethod('getSessionData');
      const hasSessionId = sessionData?.id && typeof sessionData.id === 'string';

      return {
        message: () =>
          hasSessionId
            ? `Expected not to have session ID`
            : `Expected to have session ID but got: ${JSON.stringify(sessionData)}`,
        pass: !!hasSessionId,
      };
    } catch (error) {
      return {
        message: () => `Failed to check session ID: ${error}`,
        pass: false,
      };
    }
  },

  /**
   * Check if TraceLog is in specific state
   */
  async toBeInState(received: TraceLogTestPage, expectedState: string) {
    try {
      const bridge = await received.executeBridgeMethod('getAppInstance');
      const currentState = bridge?.initialized ? 'initialized' : 'not_initialized';
      const pass = currentState === expectedState;

      return {
        message: () =>
          pass
            ? `Expected not to be in state "${expectedState}"`
            : `Expected to be in state "${expectedState}" but was in "${currentState}"`,
        pass,
      };
    } catch (error) {
      return {
        message: () => `Failed to check state: ${error}`,
        pass: false,
      };
    }
  },
});

/**
 * Console and monitoring matchers
 */
expect.extend({
  /**
   * Check if console contains specific message
   */
  toHaveConsoleMessage(received: TraceLogTestPage, pattern: string | RegExp) {
    const monitor = received.getConsoleMonitor();
    const messages = monitor.consoleMessages;

    const hasMessage = messages.some((message) => {
      if (typeof pattern === 'string') {
        return message.includes(pattern);
      } else {
        return pattern.test(message);
      }
    });

    return {
      message: () =>
        hasMessage
          ? `Expected console not to contain message matching "${pattern}"`
          : `Expected console to contain message matching "${pattern}". Recent messages: ${messages.slice(-5).join(', ')}`,
      pass: hasMessage,
    };
  },

  /**
   * Check if there are anomalies detected
   */
  toHaveAnomalies(received: TraceLogTestPage, maxCount = 0) {
    const monitor = received.getConsoleMonitor();
    const anomalies = monitor.getAnomalies();
    const pass = maxCount === 0 ? anomalies.length === 0 : anomalies.length <= maxCount;

    return {
      message: () =>
        pass
          ? maxCount === 0
            ? `Expected to have anomalies`
            : `Expected to have more than ${maxCount} anomalies`
          : maxCount === 0
            ? `Expected no anomalies but found ${anomalies.length}: ${anomalies.slice(0, 3).join(', ')}`
            : `Expected at most ${maxCount} anomalies but found ${anomalies.length}: ${anomalies.slice(0, 3).join(', ')}`,
      pass,
    };
  },
});

/**
 * Performance matchers
 */
expect.extend({
  /**
   * Check if events contain web vitals data
   */
  toHaveWebVitalsEvent(received: EventLogDispatch[]) {
    const hasWebVitals = received.some(
      (event) =>
        event.message?.toLowerCase().includes('vitals') ||
        event.namespace?.toLowerCase().includes('performance') ||
        (event.data &&
          typeof event.data === 'object' &&
          event.data !== null &&
          ('lcp' in event.data || 'inp' in event.data || 'cls' in event.data)),
    );

    return {
      message: () =>
        hasWebVitals
          ? `Expected events not to contain web vitals data`
          : `Expected events to contain web vitals data. Available events: ${received.map((e) => `${e.namespace}:${e.message}`).join(', ')}`,
      pass: hasWebVitals,
    };
  },

  /**
   * Check if events contain performance metrics
   */
  toHavePerformanceMetrics(received: EventLogDispatch[]) {
    const hasPerformance = received.some(
      (event) =>
        event.message?.toLowerCase().includes('performance') ||
        event.namespace?.toLowerCase().includes('performance') ||
        (event.data &&
          typeof event.data === 'object' &&
          event.data !== null &&
          ('timing' in event.data || 'metrics' in event.data)),
    );

    return {
      message: () =>
        hasPerformance
          ? `Expected events not to contain performance metrics`
          : `Expected events to contain performance metrics. Available events: ${received.map((e) => `${e.namespace}:${e.message}`).join(', ')}`,
      pass: hasPerformance,
    };
  },
});

/**
 * Custom event matchers
 */
expect.extend({
  /**
   * Check if events contain specific custom event
   */
  toHaveCustomEvent(received: EventLogDispatch[], eventName: string) {
    const hasCustomEvent = received.some(
      (event) =>
        event.message?.toLowerCase().includes('custom') &&
        ((event.data as any)?.name === eventName || (event.data as any)?.eventName === eventName),
    );

    return {
      message: () =>
        hasCustomEvent
          ? `Expected events not to contain custom event "${eventName}"`
          : `Expected events to contain custom event "${eventName}". Available custom events: ${received
              .filter((e) => e.message?.toLowerCase().includes('custom'))
              .map((e) => (e.data as any)?.name || (e.data as any)?.eventName || 'unnamed')
              .join(', ')}`,
      pass: hasCustomEvent,
    };
  },

  /**
   * Check if custom event has specific properties
   */
  toHaveCustomEventWithProperties(
    received: EventLogDispatch[],
    eventName: string,
    expectedProperties: Record<string, any>,
  ) {
    const matchingEvent = received.find(
      (event) =>
        event.message?.toLowerCase().includes('custom') &&
        ((event.data as any)?.name === eventName || (event.data as any)?.eventName === eventName),
    );

    if (!matchingEvent) {
      return {
        message: () => `Expected to find custom event "${eventName}" but none found`,
        pass: false,
      };
    }

    const eventData = matchingEvent.data || {};
    const hasAllProperties = Object.entries(expectedProperties).every(([key, value]) => {
      return (eventData as Record<string, any>)[key] === value;
    });

    return {
      message: () =>
        hasAllProperties
          ? `Expected custom event "${eventName}" not to have properties ${JSON.stringify(expectedProperties)}`
          : `Expected custom event "${eventName}" to have properties ${JSON.stringify(expectedProperties)} but got ${JSON.stringify(eventData)}`,
      pass: hasAllProperties,
    };
  },
});

/**
 * Utility function to get matcher usage examples
 */
export function getMatcherExamples(): Record<string, string> {
  return {
    'Event matchers': `
      await expect(eventCapture.getEvents()).toHaveEvent('CLICK');
      await expect(eventCapture.getEvents()).toHaveEventCount(5);
      await expect(eventCapture.getEvents()).toHaveEventsInOrder(['INIT', 'CLICK', 'SCROLL']);
    `,
    'TraceLog matchers': `
      await expect(initResult).toBeSuccessfullyInitialized();
      await expect(traceLogPage).toHaveNoTraceLogErrors();
      await expect(traceLogPage).toHaveSessionId();
      await expect(traceLogPage).toBeInState('initialized');
    `,
    'Console matchers': `
      await expect(traceLogPage).toHaveConsoleMessage('Initialization completed');
      await expect(traceLogPage).toHaveAnomalies(0);
    `,
    'Performance matchers': `
      await expect(eventCapture.getEvents()).toHaveWebVitalsEvent();
      await expect(eventCapture.getEvents()).toHavePerformanceMetrics();
    `,
    'Custom event matchers': `
      await expect(eventCapture.getEvents()).toHaveCustomEvent('user_action');
      await expect(eventCapture.getEvents()).toHaveCustomEventWithProperties('purchase', { productId: '123' });
    `,
  };
}

export default expect;
