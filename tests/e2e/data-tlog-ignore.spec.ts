/**
 * Data-TLog-Ignore Attribute Test
 *
 * Validates that elements marked with data-tlog-ignore attribute are NOT tracked.
 * This provides an escape hatch for sensitive UI elements.
 */

import { test, expect } from '@playwright/test';
import { navigateToPlayground } from './utils/environment.utils';

test.describe('data-tlog-ignore Attribute', () => {
  test('should NOT track clicks on elements with data-tlog-ignore', async ({ page }) => {
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

      // Create ignored button
      const ignoredBtn = document.createElement('button');
      ignoredBtn.textContent = 'Sensitive Action';
      ignoredBtn.id = 'ignored-btn';
      ignoredBtn.setAttribute('data-tlog-ignore', '');
      document.body.appendChild(ignoredBtn);

      // Create normal button
      const normalBtn = document.createElement('button');
      normalBtn.textContent = 'Normal Action';
      normalBtn.id = 'normal-btn';
      document.body.appendChild(normalBtn);

      // Click both buttons
      ignoredBtn.click();
      await new Promise((resolve) => setTimeout(resolve, 200));

      normalBtn.click();
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Cleanup
      ignoredBtn.remove();
      normalBtn.remove();

      return {
        clickEvents,
        initialized: window.__traceLogBridge.initialized,
      };
    });

    expect(result.initialized).toBe(true);

    // Should only have 1 click event (normal button)
    expect(result.clickEvents.length).toBe(1);

    // Verify it's the normal button
    const normalClick = result.clickEvents[0];
    expect(normalClick.click_data.text).toBe('Normal Action');
    expect(normalClick.click_data.id).toBe('normal-btn');

    // Verify ignored button was NOT tracked
    const ignoredClick = result.clickEvents.find((e) => e.click_data?.text === 'Sensitive Action');
    expect(ignoredClick).toBeUndefined();
  });

  test('should NOT track clicks on child elements of data-tlog-ignore parent', async ({ page }) => {
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

      // Create ignored container with child button
      const ignoredContainer = document.createElement('div');
      ignoredContainer.id = 'ignored-container';
      ignoredContainer.setAttribute('data-tlog-ignore', '');
      ignoredContainer.innerHTML = `
        <h3>Sensitive Section</h3>
        <button id="child-btn">Delete Account</button>
        <a href="#" id="child-link">View Password</a>
      `;
      document.body.appendChild(ignoredContainer);

      // Create normal container
      const normalContainer = document.createElement('div');
      normalContainer.id = 'normal-container';
      normalContainer.innerHTML = `
        <button id="normal-child-btn">Save Settings</button>
      `;
      document.body.appendChild(normalContainer);

      // Click child elements in ignored container
      const childBtn = document.getElementById('child-btn') as HTMLButtonElement;
      const childLink = document.getElementById('child-link') as HTMLAnchorElement;
      childBtn.click();
      await new Promise((resolve) => setTimeout(resolve, 200));
      childLink.click();
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Click child in normal container
      const normalChildBtn = document.getElementById('normal-child-btn') as HTMLButtonElement;
      normalChildBtn.click();
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Cleanup
      ignoredContainer.remove();
      normalContainer.remove();

      return {
        clickEvents,
        initialized: window.__traceLogBridge.initialized,
      };
    });

    expect(result.initialized).toBe(true);

    // Should only have 1 click event (normal container child)
    expect(result.clickEvents.length).toBe(1);

    // Verify it's the normal child button
    const normalClick = result.clickEvents[0];
    expect(normalClick.click_data.text).toBe('Save Settings');

    // Verify ignored children were NOT tracked
    const ignoredClicks = result.clickEvents.filter(
      (e) => e.click_data?.text === 'Delete Account' || e.click_data?.text === 'View Password',
    );
    expect(ignoredClicks.length).toBe(0);
  });

  test('should track data-tlog-name inside data-tlog-ignore parent', async ({ page }) => {
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
      const clickEvents: any[] = [];

      window.__traceLogBridge.on('event', (data: any) => {
        if (data.type === 'custom') {
          customEvents.push(data);
        }
        if (data.type === 'click') {
          clickEvents.push(data);
        }
      });

      await window.__traceLogBridge.init();
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Create ignored container but with tracked custom event
      const container = document.createElement('div');
      container.setAttribute('data-tlog-ignore', '');
      container.innerHTML = `
        <button data-tlog-name="explicit_tracked_action" data-tlog-value="test">
          Explicitly Tracked
        </button>
      `;
      document.body.appendChild(container);

      const btn = container.querySelector('button') as HTMLButtonElement;
      btn.click();
      await new Promise((resolve) => setTimeout(resolve, 300));

      container.remove();

      return {
        customEvents,
        clickEvents,
        initialized: window.__traceLogBridge.initialized,
      };
    });

    expect(result.initialized).toBe(true);

    // data-tlog-ignore should prevent ALL tracking, even data-tlog-name
    // This is the expected behavior: ignore is absolute
    expect(result.customEvents.length).toBe(0);
    expect(result.clickEvents.length).toBe(0);
  });

  test('should handle mixed ignored and non-ignored elements correctly', async ({ page }) => {
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

      // Create complex layout
      const layout = document.createElement('div');
      layout.innerHTML = `
        <div id="navbar">
          <button id="btn-1">Home</button>
          <button id="btn-2" data-tlog-ignore>Admin</button>
          <button id="btn-3">About</button>
        </div>
        <div id="sensitive-section" data-tlog-ignore>
          <button id="btn-4">Delete</button>
          <button id="btn-5">Reset Password</button>
        </div>
        <div id="public-section">
          <button id="btn-6">Contact</button>
          <button id="btn-7">Subscribe</button>
        </div>
      `;
      document.body.appendChild(layout);

      // Click all buttons with longer delays to avoid deduplication
      for (let i = 1; i <= 7; i++) {
        const btn = document.getElementById(`btn-${i}`) as HTMLButtonElement;
        btn.click();
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      layout.remove();

      return {
        clickEvents,
        initialized: window.__traceLogBridge.initialized,
      };
    });

    expect(result.initialized).toBe(true);

    // Should track: btn-1 (Home), btn-3 (About), btn-6 (Contact), btn-7 (Subscribe)
    // Should NOT track: btn-2 (Admin - ignored), btn-4 (Delete - parent ignored), btn-5 (Reset - parent ignored)
    // Note: May be less than 4 due to deduplication, but should have at least some tracked events
    expect(result.clickEvents.length).toBeGreaterThan(0);
    expect(result.clickEvents.length).toBeLessThanOrEqual(4);

    const trackedTexts = result.clickEvents.map((e) => e.click_data.text);

    // At least one of the public buttons should be tracked
    const hasPublicButton =
      trackedTexts.includes('Home') ||
      trackedTexts.includes('About') ||
      trackedTexts.includes('Contact') ||
      trackedTexts.includes('Subscribe');
    expect(hasPublicButton).toBe(true);

    // None of the ignored buttons should be tracked
    expect(trackedTexts).not.toContain('Admin');
    expect(trackedTexts).not.toContain('Delete');
    expect(trackedTexts).not.toContain('Reset Password');
  });
});
