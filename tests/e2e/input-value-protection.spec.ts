/**
 * Input Value Protection Test
 *
 * Validates that TraceLog NEVER captures values from input fields, textareas, or selects.
 * This is a critical security guarantee for PII protection.
 */

import { test, expect } from '@playwright/test';
import { navigateToPlayground } from './utils/environment.utils';

test.describe('Input Value Protection', () => {
  test('should NOT capture input field values in click events', async ({ page }) => {
    await navigateToPlayground(page);

    const result = await page.evaluate(async () => {
      // Wait for bridge
      let retries = 0;
      while (!window.__traceLogBridge && retries < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        retries++;
      }

      if (!window.__traceLogBridge) {
        throw new Error('TraceLog bridge not available');
      }

      const clickEvents: any[] = [];

      // Listen for click events
      window.__traceLogBridge.on('event', (data: any) => {
        if (data.type === 'click') {
          clickEvents.push(data);
        }
      });

      await window.__traceLogBridge.init();
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Create a test input field with sensitive value
      const input = document.createElement('input');
      input.type = 'text';
      input.id = 'test-sensitive-input';
      input.value = 'secret-password-123';
      input.setAttribute('data-testid', 'sensitive-input');
      document.body.appendChild(input);

      // Click on the input field
      input.click();
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Cleanup
      input.remove();

      return {
        clickEvents,
        initialized: window.__traceLogBridge.initialized,
      };
    });

    expect(result.initialized).toBe(true);
    expect(result.clickEvents.length).toBeGreaterThan(0);

    // Verify NO click event contains the input value
    result.clickEvents.forEach((event) => {
      const eventJson = JSON.stringify(event);
      expect(eventJson).not.toContain('secret-password-123');
      expect(event.click_data?.value).toBeUndefined();
    });
  });

  test('should NOT capture textarea values in click events', async ({ page }) => {
    await navigateToPlayground(page);

    const result = await page.evaluate(async () => {
      let retries = 0;
      while (!window.__traceLogBridge && retries < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        retries++;
      }

      if (!window.__traceLogBridge) {
        throw new Error('TraceLog bridge not available');
      }

      const clickEvents: any[] = [];

      window.__traceLogBridge.on('event', (data: any) => {
        if (data.type === 'click') {
          clickEvents.push(data);
        }
      });

      await window.__traceLogBridge.init();
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Create a test textarea with sensitive content
      const textarea = document.createElement('textarea');
      textarea.id = 'test-message';
      textarea.value = 'My credit card is 4532-1111-2222-3333 and email is user@example.com';
      textarea.setAttribute('data-testid', 'message-field');
      document.body.appendChild(textarea);

      textarea.click();
      await new Promise((resolve) => setTimeout(resolve, 300));

      textarea.remove();

      return {
        clickEvents,
        initialized: window.__traceLogBridge.initialized,
      };
    });

    expect(result.initialized).toBe(true);
    expect(result.clickEvents.length).toBeGreaterThan(0);

    // Verify NO click event contains textarea value or PII
    result.clickEvents.forEach((event) => {
      const eventJson = JSON.stringify(event);
      expect(eventJson).not.toContain('4532-1111-2222-3333');
      expect(eventJson).not.toContain('user@example.com');
      expect(event.click_data?.value).toBeUndefined();
    });
  });

  test('should NOT capture select dropdown values in click events', async ({ page }) => {
    await navigateToPlayground(page);

    const result = await page.evaluate(async () => {
      let retries = 0;
      while (!window.__traceLogBridge && retries < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        retries++;
      }

      if (!window.__traceLogBridge) {
        throw new Error('TraceLog bridge not available');
      }

      const clickEvents: any[] = [];

      window.__traceLogBridge.on('event', (data: any) => {
        if (data.type === 'click') {
          clickEvents.push(data);
        }
      });

      await window.__traceLogBridge.init();
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Create a select dropdown with options
      const select = document.createElement('select');
      select.id = 'test-country';
      select.innerHTML = `
        <option value="us">United States</option>
        <option value="es" selected>Spain</option>
        <option value="fr">France</option>
      `;
      select.setAttribute('data-testid', 'country-select');
      document.body.appendChild(select);

      select.click();
      await new Promise((resolve) => setTimeout(resolve, 300));

      select.remove();

      return {
        clickEvents,
        initialized: window.__traceLogBridge.initialized,
      };
    });

    expect(result.initialized).toBe(true);
    expect(result.clickEvents.length).toBeGreaterThan(0);

    // Verify NO click event contains select value
    result.clickEvents.forEach((event) => {
      expect(event.click_data?.value).toBeUndefined();
      // Select element itself is OK to track, but not the selected value
      expect(event.click_data?.tag).toBe('select');
    });
  });

  test('should allow custom events with form data in metadata (correct pattern)', async ({ page }) => {
    await navigateToPlayground(page);

    const result = await page.evaluate(async () => {
      let retries = 0;
      while (!window.__traceLogBridge && retries < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        retries++;
      }

      if (!window.__traceLogBridge) {
        throw new Error('TraceLog bridge not available');
      }

      const customEvents: any[] = [];

      window.__traceLogBridge.on('event', (data: any) => {
        if (data.type === 'custom') {
          customEvents.push(data);
        }
      });

      await window.__traceLogBridge.init();
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Correct pattern: Explicitly send form data via custom event metadata
      // (No need to create actual DOM inputs - just demonstrate the pattern)
      window.__traceLogBridge.sendCustomEvent('form_submit', {
        name: 'John Doe',
        email: 'john@example.com',
      });

      await new Promise((resolve) => setTimeout(resolve, 300));

      return {
        customEvents,
        initialized: window.__traceLogBridge.initialized,
      };
    });

    expect(result.initialized).toBe(true);
    expect(result.customEvents.length).toBeGreaterThan(0);

    // Verify custom event DOES contain metadata (this is the correct pattern)
    const formSubmitEvent = result.customEvents.find((e) => e.custom_event?.name === 'form_submit');
    expect(formSubmitEvent).toBeDefined();
    expect(formSubmitEvent.custom_event.metadata.name).toBe('John Doe');
    expect(formSubmitEvent.custom_event.metadata.email).toBe('john@example.com');
  });

  test('should NOT capture input values when clicking submit button near inputs', async ({ page }) => {
    await navigateToPlayground(page);

    const result = await page.evaluate(async () => {
      let retries = 0;
      while (!window.__traceLogBridge && retries < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        retries++;
      }

      if (!window.__traceLogBridge) {
        throw new Error('TraceLog bridge not available');
      }

      const clickEvents: any[] = [];

      window.__traceLogBridge.on('event', (data: any) => {
        if (data.type === 'click') {
          clickEvents.push(data);
        }
      });

      await window.__traceLogBridge.init();
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Create container with password input and submit button
      const container = document.createElement('div');
      container.innerHTML = `
        <input type="password" id="password" value="SuperSecret123!" style="position: absolute; top: -9999px;">
        <button type="button" id="submit-btn" style="padding: 10px;">Submit</button>
      `;
      document.body.appendChild(container);

      // Click the submit button (NOT the input)
      const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
      submitBtn.click();

      await new Promise((resolve) => setTimeout(resolve, 500));

      container.remove();

      return {
        clickEvents,
        initialized: window.__traceLogBridge.initialized,
      };
    });

    expect(result.initialized).toBe(true);
    expect(result.clickEvents.length).toBeGreaterThan(0);

    // Verify click on submit button does NOT leak nearby input values
    result.clickEvents.forEach((event) => {
      const eventJson = JSON.stringify(event);
      expect(eventJson).not.toContain('SuperSecret123!');
      expect(event.click_data?.value).toBeUndefined();
    });

    // Verify button click was tracked correctly
    const submitClick = result.clickEvents.find((e) => e.click_data?.tag === 'button');
    expect(submitClick).toBeDefined();
    expect(submitClick.click_data.text).toBe('Submit');
  });
});
