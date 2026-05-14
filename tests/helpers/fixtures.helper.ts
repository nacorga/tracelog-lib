/**
 * Fixtures Helper
 *
 * Test data fixtures for creating consistent test data
 */

import type { Config } from '../../src/types/config.types';
import { EventType, ScrollDirection, ErrorType } from '../../src/types/event.types';
import type { EventData } from '../../src/types/event.types';
import type { EventsQueue } from '../../src/types/queue.types';
import { DeviceType, type DeviceInfo } from '../../src/types/device.types';

/** Default mock device info for tests */
export const MOCK_DEVICE_INFO: DeviceInfo = {
  type: DeviceType.Desktop,
  os: 'macOS',
  browser: 'Chrome',
};

/**
 * Create mock configuration with default values
 */
export function createMockConfig(overrides?: Partial<Config>): Config {
  return {
    sessionTimeout: 900000, // 15 minutes
    globalMetadata: {},
    sensitiveQueryParams: [],
    samplingRate: 1.0,
    errorSampling: 1.0,
    webVitalsMode: 'needs-improvement',
    pageViewThrottleMs: 1000,
    clickThrottleMs: 300,
    maxSameEventPerMinute: 60,
    integrations: {},
    ...overrides,
  };
}

/**
 * Create mock event data
 */
export function createMockEvent(type: EventType, overrides?: Partial<EventData>): EventData {
  const baseEvent: Partial<EventData> = {
    id: `evt_${Date.now()}`,
    type,
    timestamp: Date.now(),
    page_url: 'http://localhost:3000/',
    referrer: '',
  };

  // Add type-specific data
  let typeSpecificData: Partial<EventData> = {};

  if (type === EventType.CLICK) {
    typeSpecificData = {
      click_data: {
        x: 100,
        y: 200,
        id: 'test-button',
        class: 'btn btn-primary',
        tag: 'button',
        text: 'Click Me',
      },
    };
  } else if (type === EventType.SCROLL) {
    typeSpecificData = {
      scroll_data: {
        depth: 50,
        direction: ScrollDirection.DOWN,
        container_selector: 'body',
      },
    };
  } else if (type === EventType.PAGE_VIEW) {
    typeSpecificData = {
      page_view: {
        title: 'Test Page',
        referrer: '',
      },
    };
  } else if (type === EventType.SESSION_START) {
    // Session start events don't have additional data
  } else if (type === EventType.CUSTOM) {
    typeSpecificData = {
      custom_event: {
        name: 'test_event',
        metadata: { key: 'value' },
      },
    };
  } else if (type === EventType.WEB_VITALS) {
    typeSpecificData = {
      web_vitals: {
        type: 'LCP',
        value: 2500,
      },
    };
  } else {
    typeSpecificData = {
      error_data: {
        type: ErrorType.JS_ERROR,
        message: 'Test error',
        filename: 'test.js',
        line: 1,
        column: 1,
      },
    };
  }

  return {
    ...baseEvent,
    ...typeSpecificData,
    ...overrides,
  } as EventData;
}

/**
 * Create mock events queue
 */
export function createMockQueue(events: EventData[] = [], overrides?: Partial<EventsQueue>): EventsQueue {
  return {
    session_id: 'test-session-id',
    user_id: 'test-user-id',
    device: MOCK_DEVICE_INFO,
    events: events.length > 0 ? events : [createMockEvent(EventType.CLICK)],
    ...overrides,
  };
}

/**
 * Create multiple mock events
 */
export function createMockEvents(count: number, type: EventType = EventType.CLICK): EventData[] {
  return Array.from({ length: count }, (_, i) =>
    createMockEvent(type, {
      timestamp: Date.now() + i * 1000,
    }),
  );
}

/**
 * Create mock session data
 */
export function createMockSession(overrides?: any): any {
  return {
    sessionId: 'test-session-id',
    userId: 'test-user-id',
    startTime: Date.now() - 60000,
    lastActivity: Date.now(),
    isNew: false,
    ...overrides,
  };
}

/**
 * Create mock state
 */
export function createMockState(overrides?: any): any {
  return {
    config: createMockConfig(),
    sessionId: 'test-session-id',
    userId: 'test-user-id',
    isInitialized: false,
    collectApiUrls: {},
    pageUrl: 'http://localhost:3000/',
    referrer: '',
    mode: null,
    ...overrides,
  };
}

/**
 * Create mock click event (DOM)
 */
export function createMockClickEvent(target?: HTMLElement, options?: MouseEventInit): MouseEvent {
  const element = target || document.createElement('button');
  element.id = 'test-button';
  element.textContent = 'Test Button';

  return new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    clientX: 100,
    clientY: 200,
    button: 0,
    ...options,
  });
}

/**
 * Create mock scroll event (DOM)
 */
export function createMockScrollEvent(options?: EventInit): Event {
  return new Event('scroll', {
    bubbles: true,
    cancelable: true,
    ...options,
  });
}

/**
 * Create mock error event (DOM)
 */
export function createMockErrorEvent(message = 'Test error', filename = 'test.js', lineno = 1, colno = 1): ErrorEvent {
  return new ErrorEvent('error', {
    message,
    filename,
    lineno,
    colno,
    error: new Error(message),
  });
}

/**
 * Create mock HTML element
 */
export function createMockElement(
  tag = 'button',
  attributes: Record<string, string> = {},
  textContent = 'Test',
): HTMLElement {
  const element = document.createElement(tag);

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });

  element.textContent = textContent;

  return element;
}

/**
 * Create mock form with inputs
 */
export function createMockForm(): HTMLFormElement {
  const form = document.createElement('form');

  const emailInput = document.createElement('input');
  emailInput.type = 'email';
  emailInput.name = 'email';
  emailInput.id = 'email';
  emailInput.value = 'test@example.com';

  const passwordInput = document.createElement('input');
  passwordInput.type = 'password';
  passwordInput.name = 'password';
  passwordInput.id = 'password';
  passwordInput.value = 'secret123';

  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.textContent = 'Submit';

  form.appendChild(emailInput);
  form.appendChild(passwordInput);
  form.appendChild(submitButton);

  return form;
}

/**
 * Create mock storage data
 */
export function createMockStorageData(key: string, data: any): void {
  localStorage.setItem(key, JSON.stringify(data));
}

/**
 * Get mock storage data
 */
export function getMockStorageData(key: string): any {
  const data = localStorage.getItem(key);
  return data !== null ? JSON.parse(data) : null;
}

/**
 * Create mock consent state
 */
export function createMockConsentState(granted = true): any {
  return {
    analytics: granted,
    marketing: granted,
    preferences: granted,
    timestamp: Date.now(),
  };
}

/**
 * Create mock Web Vitals metric
 */
export function createMockWebVitalsMetric(name: 'CLS' | 'FID' | 'FCP' | 'INP' | 'LCP' | 'TTFB', value = 1000): any {
  return {
    name,
    value,
    rating: value < 2500 ? 'good' : 'needs-improvement',
    delta: value,
    id: `test-${name.toLowerCase()}-id`,
    entries: [],
  };
}
