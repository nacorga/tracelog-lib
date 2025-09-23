import { test, expect } from '@playwright/test';
import { TestUtils } from '../utils';
import { SpecialProjectId } from '../../src/types/api.types';

test.describe('Scroll Container Tracking', () => {
  test('should track mat-sidenav-content with dynamic element and delayed overflow', async ({ page, browserName }) => {
    const monitor = TestUtils.createConsoleMonitor(page);
    const isFirefox = browserName === 'firefox';

    try {
      await TestUtils.navigateAndWaitForReady(page, { url: '/' });

      const initResult = await TestUtils.initializeTraceLog(page, {
        id: SpecialProjectId.HttpSkip,
        scrollContainerSelectors: '.mat-sidenav-content',
      });

      expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

      await page.waitForTimeout(isFirefox ? 1000 : 500);

      await page.evaluate(() => {
        const container = document.createElement('div');
        container.className = 'mat-sidenav-content';
        container.style.cssText = 'height: 300px;';
        container.innerHTML = '<div style="height: 1500px;">Dynamic content</div>';
        document.body.appendChild(container);
      });

      await page.waitForTimeout(isFirefox ? 2000 : 1500);

      await page.evaluate(() => {
        const container = document.querySelector('.mat-sidenav-content');
        if (container) {
          (container as HTMLElement).style.overflowY = 'auto';
        }
      });

      await page.waitForTimeout(isFirefox ? 1000 : 500);

      await page.evaluate(() => {
        const container = document.querySelector('.mat-sidenav-content');
        if (container) container.scrollTop = 400;
      });

      await page.waitForTimeout(isFirefox ? 1000 : 700);

      const hasScrollLog = monitor.debugLogs.some((log) => log.includes('Event captured: scroll'));
      expect(hasScrollLog).toBe(true);

      expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should use window fallback when selector never appears', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      await TestUtils.navigateAndWaitForReady(page, { url: '/' });

      await page.evaluate(() => {
        const content = document.createElement('div');
        content.style.cssText = 'height: 3000px;';
        content.textContent = 'Scrollable content';
        document.body.appendChild(content);
      });

      const initResult = await TestUtils.initializeTraceLog(page, {
        id: SpecialProjectId.HttpSkip,
        scrollContainerSelectors: '.never-exists-selector',
      });

      expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

      await page.waitForTimeout(3600);

      const hasFallbackLog = monitor.debugLogs.some(
        (log) => log.includes('window fallback') || log.includes('Selector not found after max retries'),
      );
      expect(hasFallbackLog).toBe(true);

      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(700);

      const hasScrollLog = monitor.debugLogs.some((log) => log.includes('Event captured: scroll'));
      expect(hasScrollLog).toBe(true);

      expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should track element that becomes scrollable after content loads', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      await TestUtils.navigateAndWaitForReady(page, { url: '/' });

      await page.evaluate(() => {
        const container = document.createElement('div');
        container.id = 'lazy-container';
        container.style.cssText = 'height: 200px; overflow-y: auto;';

        const content = document.createElement('div');
        content.id = 'lazy-content';
        content.style.height = '50px';
        content.textContent = 'Small content';

        container.appendChild(content);
        document.body.appendChild(container);
      });

      const initResult = await TestUtils.initializeTraceLog(page, {
        id: SpecialProjectId.HttpSkip,
        scrollContainerSelectors: '#lazy-container',
      });

      expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

      await page.waitForTimeout(500);

      await page.evaluate(() => {
        const container = document.getElementById('lazy-container');
        if (container) container.scrollTop = 100;
      });

      await page.waitForTimeout(700);

      const initialScrollLogs = monitor.debugLogs.filter((log) => log.includes('Event captured: scroll'));
      expect(initialScrollLogs.length).toBe(0);

      await page.evaluate(() => {
        const content = document.getElementById('lazy-content');
        if (content) {
          (content as HTMLElement).style.height = '1500px';
        }
      });

      await page.waitForTimeout(300);

      await page.evaluate(() => {
        const container = document.getElementById('lazy-container');
        if (container) container.scrollTop = 300;
      });

      await page.waitForTimeout(700);

      const finalScrollLogs = monitor.debugLogs.filter((log) => log.includes('Event captured: scroll'));
      expect(finalScrollLogs.length).toBeGreaterThan(0);

      expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should track multiple containers with mixed selectors', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      await TestUtils.navigateAndWaitForReady(page, { url: '/' });

      await page.evaluate(() => {
        const container1 = document.createElement('div');
        container1.id = 'container-1';
        container1.style.cssText = 'height: 200px; overflow-y: auto;';
        container1.innerHTML = '<div style="height: 1000px;">Container 1</div>';
        document.body.appendChild(container1);
      });

      const initResult = await TestUtils.initializeTraceLog(page, {
        id: SpecialProjectId.HttpSkip,
        scrollContainerSelectors: ['#container-1', '#container-2', '.never-exists'],
      });

      expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

      await page.waitForTimeout(1000);

      await page.evaluate(() => {
        const container2 = document.createElement('div');
        container2.id = 'container-2';
        container2.style.cssText = 'height: 200px; overflow-y: auto;';
        container2.innerHTML = '<div style="height: 1000px;">Container 2</div>';
        document.body.appendChild(container2);
      });

      await page.waitForTimeout(1500);

      await page.evaluate(() => {
        const c1 = document.getElementById('container-1');
        if (c1) c1.scrollTop = 200;
      });

      await page.waitForTimeout(700);

      const c1ScrollLogs = monitor.debugLogs.filter((log) => log.includes('Event captured: scroll'));
      expect(c1ScrollLogs.length).toBeGreaterThan(0);

      await page.evaluate(() => {
        const c2 = document.getElementById('container-2');
        if (c2) c2.scrollTop = 200;
      });

      await page.waitForTimeout(700);

      const c2ScrollLogs = monitor.debugLogs.filter((log) => log.includes('Event captured: scroll'));
      expect(c2ScrollLogs.length).toBeGreaterThan(c1ScrollLogs.length);

      expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should NOT apply window fallback when at least one container is found', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      await TestUtils.navigateAndWaitForReady(page, { url: '/' });

      await page.evaluate(() => {
        const windowContent = document.createElement('div');
        windowContent.style.cssText = 'height: 3000px;';
        windowContent.textContent = 'Window scrollable content';
        document.body.appendChild(windowContent);

        const container = document.createElement('div');
        container.id = 'found-container';
        container.style.cssText = 'height: 200px; overflow-y: auto;';
        container.innerHTML = '<div style="height: 1000px;">Container content</div>';
        document.body.appendChild(container);
      });

      const initResult = await TestUtils.initializeTraceLog(page, {
        id: SpecialProjectId.HttpSkip,
        scrollContainerSelectors: ['#found-container', '.never-exists'],
      });

      expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

      await page.waitForTimeout(3600);

      await page.evaluate(() => {
        const container = document.getElementById('found-container');
        if (container) container.scrollTop = 200;
      });

      await page.waitForTimeout(700);

      const containerScrollLogs = monitor.debugLogs.filter((log) => log.includes('Event captured: scroll'));
      expect(containerScrollLogs.length).toBeGreaterThan(0);

      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(700);

      const allScrollLogs = monitor.debugLogs.filter((log) => log.includes('Event captured: scroll'));

      expect(allScrollLogs.length).toBe(containerScrollLogs.length);

      expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });

  test('should track containers with different overflow directions', async ({ page }) => {
    const monitor = TestUtils.createConsoleMonitor(page);

    try {
      await TestUtils.navigateAndWaitForReady(page, { url: '/' });

      await page.evaluate(() => {
        const verticalContainer = document.createElement('div');
        verticalContainer.id = 'vertical-container';
        verticalContainer.style.cssText = 'height: 200px; overflow-y: auto; overflow-x: hidden;';
        verticalContainer.innerHTML = '<div style="height: 1000px;">Vertical only</div>';
        document.body.appendChild(verticalContainer);

        const bothContainer = document.createElement('div');
        bothContainer.id = 'both-container';
        bothContainer.style.cssText = 'height: 200px; width: 300px; overflow: auto;';
        bothContainer.innerHTML = '<div style="height: 1000px; width: 1500px;">Both directions</div>';
        document.body.appendChild(bothContainer);
      });

      const initResult = await TestUtils.initializeTraceLog(page, {
        id: SpecialProjectId.HttpSkip,
        scrollContainerSelectors: ['#vertical-container', '#both-container'],
      });

      expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

      await page.waitForTimeout(500);

      await page.evaluate(() => {
        const v = document.getElementById('vertical-container');
        if (v) v.scrollTop = 200;
      });

      await page.waitForTimeout(700);

      const verticalScrollLogs = monitor.debugLogs.filter((log) => log.includes('Event captured: scroll'));
      expect(verticalScrollLogs.length).toBeGreaterThan(0);

      await page.evaluate(() => {
        const b = document.getElementById('both-container');
        if (b) b.scrollTop = 200;
      });

      await page.waitForTimeout(700);

      const bothScrollLogs = monitor.debugLogs.filter((log) => log.includes('Event captured: scroll'));
      expect(bothScrollLogs.length).toBeGreaterThan(verticalScrollLogs.length);

      expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
    } finally {
      monitor.cleanup();
    }
  });
});
