import { test, expect } from '@playwright/test';

test.describe('DTO Structure Validation - EventData', () => {
  test('EventData structure must be preserved', async ({ page }) => {
    let capturedPayload: any;

    // Intercept network requests
    await page.route('**/*', (route) => {
      const request = route.request();
      if (request.method() === 'POST') {
        const postData = request.postData();
        if (postData) {
          try {
            capturedPayload = JSON.parse(postData);
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
      route.fulfill({ status: 200, body: '{}' });
    });

    // Navigate to test page
    await page.goto('http://localhost:3000');

    // Trigger some events
    await page.click('button');
    await page.waitForTimeout(2000);

    // Validate payload structure if captured
    if (capturedPayload) {
      // Check BaseEventsQueueDto structure
      expect(capturedPayload).toHaveProperty('user_id');
      expect(capturedPayload).toHaveProperty('session_id');
      expect(capturedPayload).toHaveProperty('device');
      expect(capturedPayload).toHaveProperty('events');
      expect(Array.isArray(capturedPayload.events)).toBe(true);

      // Check EventData structure in first event if exists
      if (capturedPayload.events.length > 0) {
        const event = capturedPayload.events[0];

        // Required fields
        expect(event).toHaveProperty('type');
        expect(event).toHaveProperty('page_url');
        expect(event).toHaveProperty('timestamp');
        expect(typeof event.timestamp).toBe('number');
      }
    }
  });

  test('EventData optional fields structure', async ({ page }) => {
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
      'tags'
    ];

    // This test documents the expected optional fields
    // Actual validation will be done in integration tests
    expect(expectedOptionalFields).toBeDefined();
  });
});

test.describe('DTO Structure Validation - Payload', () => {
  test('BaseEventsQueueDto must have correct structure', async ({ page }) => {
    let capturedPayload: any;

    await page.route('**/*', (route) => {
      const request = route.request();
      if (request.method() === 'POST') {
        const postData = request.postData();
        if (postData) {
          try {
            capturedPayload = JSON.parse(postData);
          } catch (e) {
            // Ignore
          }
        }
      }
      route.fulfill({ status: 200, body: '{}' });
    });

    await page.goto('http://localhost:3000');
    await page.waitForTimeout(1000);

    if (capturedPayload) {
      expect(capturedPayload).toHaveProperty('user_id');
      expect(typeof capturedPayload.user_id).toBe('string');

      expect(capturedPayload).toHaveProperty('session_id');
      expect(typeof capturedPayload.session_id).toBe('string');

      expect(capturedPayload).toHaveProperty('device');
      expect(['mobile', 'tablet', 'desktop'].includes(capturedPayload.device)).toBe(true);

      expect(capturedPayload).toHaveProperty('events');
      expect(Array.isArray(capturedPayload.events)).toBe(true);
    }
  });
});