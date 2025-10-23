/**
 * Fixtures Helper
 *
 * Test data fixtures for creating consistent test data
 */

import type { Config } from '@/types/config.types';
import type { EventData, EventType } from '@/types/event.types';
import type { EventsQueue } from '@/types/sender.types';

/**
 * Create mock configuration with default values
 */
export function createMockConfig(overrides?: Partial<Config>): Config {
  return {
    sessionTimeout: 900000, // 15 minutes
    globalMetadata: {},
    scrollContainerSelectors: [],
    sensitiveQueryParams: [],
    samplingRate: 1.0,
    errorSampling: 1.0,
    allowHttp: false,
    disabledEvents: [],
    waitForConsent: false,
    integrations: {},
    ...overrides,
  };
}

/**
 * Create mock event data
 */
export function createMockEvent(type: EventType, overrides?: Partial<EventData>): EventData {
  const baseEvent: EventData = {
    type,
    timestamp: Date.now(),
    page_url: 'http://localhost:3000/',
    page_title: 'Test Page',
    referrer: '',
    user_agent: 'Mozilla/5.0 (Test)',
    viewport_width: 1920,
    viewport_height: 1080,
    screen_width: 1920,
    screen_height: 1080,
    device_type: 'desktop',
    language: 'en-US',
    timezone: 'UTC',
  };

  // Add type-specific data
  switch (type) {
    case 'CLICK':
      return {
        ...baseEvent,
        click: {
          element_tag: 'button',
          element_id: 'test-button',
          element_classes: ['btn', 'btn-primary'],
          element_text: 'Click Me',
          x: 100,
          y: 200,
        },
        ...overrides,
      };

    case 'SCROLL':
      return {
        ...baseEvent,
        scroll: {
          depth_percentage: 50,
          depth_pixels: 500,
          max_depth_percentage: 50,
          max_depth_pixels: 500,
          direction: 'down',
          velocity: 10,
          container_selector: null,
        },
        ...overrides,
      };

    case 'PAGE_VIEW':
      return {
        ...baseEvent,
        page_view: {
          path: '/',
          utm_source: null,
          utm_medium: null,
          utm_campaign: null,
          utm_term: null,
          utm_content: null,
        },
        ...overrides,
      };

    case 'SESSION_START':
      return {
        ...baseEvent,
        session: {
          is_new_user: false,
          session_count: 1,
        },
        ...overrides,
      };

    case 'SESSION_END':
      return {
        ...baseEvent,
        session: {
          duration_ms: 30000,
          page_views: 5,
          events_count: 20,
        },
        ...overrides,
      };

    case 'CUSTOM':
      return {
        ...baseEvent,
        custom_event: {
          name: 'test_event',
          metadata: { key: 'value' },
        },
        ...overrides,
      };

    case 'WEB_VITALS':
      return {
        ...baseEvent,
        web_vitals: {
          name: 'LCP',
          value: 2500,
          rating: 'good',
          delta: 2500,
          id: 'test-id',
        },
        ...overrides,
      };

    case 'ERROR':
      return {
        ...baseEvent,
        error: {
          message: 'Test error',
          stack: 'Error: Test error\n    at test.js:1:1',
          type: 'Error',
          filename: 'test.js',
          lineno: 1,
          colno: 1,
        },
        ...overrides,
      };

    default:
      return {
        ...baseEvent,
        ...overrides,
      };
  }
}

/**
 * Create mock events queue
 */
export function createMockQueue(events: EventData[] = [], overrides?: Partial<EventsQueue>): EventsQueue {
  return {
    session_id: 'test-session-id',
    user_id: 'test-user-id',
    events: events.length > 0 ? events : [createMockEvent('CLICK')],
    ...overrides,
  };
}

/**
 * Create multiple mock events
 */
export function createMockEvents(count: number, type: EventType = 'CLICK'): EventData[] {
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
  return data ? JSON.parse(data) : null;
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
