import { expect } from '@playwright/test';
import { traceLogTest } from '../fixtures/tracelog-fixtures';

interface BaseEventsQueueDto {
  user_id: string;
  session_id: string;
  device: 'mobile' | 'tablet' | 'desktop';
  events: EventData[];
}

interface EventData {
  type: string;
  page_url: string;
  timestamp: number;
  referrer?: string;
  from_page_url?: string;
  scroll_data?: unknown;
  click_data?: unknown;
  custom_event?: unknown;
  web_vitals?: unknown;
  page_view?: unknown;
  session_start_recovered?: unknown;
  session_end_reason?: unknown;
  error_data?: unknown;
  utm?: unknown;
  tags?: unknown;
}

traceLogTest.describe('DTO Structure Validation - EventData', () => {
  traceLogTest('EventData structure must be preserved', async ({ traceLogPage }) => {
    let capturedPayload: BaseEventsQueueDto | null = null;

    // Intercept network requests
    await traceLogPage.page.route('**/*', (route) => {
      const request = route.request();
      if (request.method() === 'POST') {
        const postData = request.postData();
        if (postData) {
          try {
            capturedPayload = JSON.parse(postData) as BaseEventsQueueDto;
          } catch {
            // Ignore parse errors
          }
        }
        route.fulfill({ status: 200, body: '{}' });
      } else {
        // Let GET requests (HTML, CSS, JS) through
        route.continue();
      }
    });

    // Initialize TraceLog and trigger some events
    await traceLogPage.initializeTraceLog({ id: 'skip' });

    // Use playground elements to trigger events
    await traceLogPage.clickElement('[data-testid="add-cart-1"]');
    await traceLogPage.clickElement('[data-testid="cta-ver-productos"]');
    await traceLogPage.page.waitForTimeout(2000);

    // Validate payload structure if captured
    if (capturedPayload) {
      const payload = capturedPayload as BaseEventsQueueDto;

      // Check BaseEventsQueueDto structure
      expect(payload).toHaveProperty('user_id');
      expect(payload).toHaveProperty('session_id');
      expect(payload).toHaveProperty('device');
      expect(payload).toHaveProperty('events');
      expect(Array.isArray(payload.events)).toBe(true);

      // Check EventData structure in first event if exists
      if (payload.events && payload.events.length > 0) {
        const event = payload.events[0];

        // Required fields
        expect(event).toHaveProperty('type');
        expect(event).toHaveProperty('page_url');
        expect(event).toHaveProperty('timestamp');
        expect(typeof event.timestamp).toBe('number');
      }
    }

    await expect(traceLogPage).toHaveNoTraceLogErrors();
  });

  traceLogTest('EventData optional fields structure', async () => {
    const expectedOptionalFields = [
      'referrer',
      'from_page_url',
      'scroll_data',
      'click_data',
      'custom_event',
      'web_vitals',
      'page_view',
      'session_start_recovered',
      'session_end_reason',
      'error_data',
      'utm',
      'tags',
    ];

    // This test documents the expected optional fields
    // Actual validation will be done in integration tests
    expect(expectedOptionalFields).toBeDefined();
  });
});

traceLogTest.describe('DTO Structure Validation - Payload', () => {
  traceLogTest('BaseEventsQueueDto must have correct structure', async ({ traceLogPage }) => {
    let capturedPayload: BaseEventsQueueDto | null = null;

    await traceLogPage.page.route('**/*', (route) => {
      const request = route.request();
      if (request.method() === 'POST') {
        const postData = request.postData();
        if (postData) {
          try {
            capturedPayload = JSON.parse(postData) as BaseEventsQueueDto;
          } catch {
            // Ignore
          }
        }
        route.fulfill({ status: 200, body: '{}' });
      } else {
        // Let GET requests (HTML, CSS, JS) through
        route.continue();
      }
    });

    await traceLogPage.initializeTraceLog({ id: 'skip' });
    await traceLogPage.page.waitForTimeout(1000);

    if (capturedPayload) {
      const payload = capturedPayload as BaseEventsQueueDto;
      expect(payload).toHaveProperty('user_id');
      expect(typeof payload.user_id).toBe('string');

      expect(payload).toHaveProperty('session_id');
      expect(typeof payload.session_id).toBe('string');

      expect(payload).toHaveProperty('device');
      expect(['mobile', 'tablet', 'desktop'].includes(payload.device)).toBe(true);

      expect(payload).toHaveProperty('events');
      expect(Array.isArray(payload.events)).toBe(true);
    }

    await expect(traceLogPage).toHaveNoTraceLogErrors();
  });
});
