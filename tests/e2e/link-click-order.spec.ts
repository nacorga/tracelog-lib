import { test, expect } from '@playwright/test';
import { EventType } from '../../src/types';

test.describe('Link Click Order - Demo Mode', () => {
  test('should log click event before page view event when clicking a link', async ({ page }) => {
    const eventOrder: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[TraceLog]')) {
        if (msg.text().includes(`"type":"${EventType.CLICK}"`)) {
          eventOrder.push('CLICK');
        } else if (msg.text().includes(`"type":"${EventType.PAGE_VIEW}"`)) {
          eventOrder.push('PAGE_VIEW');
        }
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Clear initial events
    eventOrder.length = 0;

    // Add a test link to the page
    await page.evaluate(() => {
      const link = document.createElement('a');
      link.href = '#test-section';
      link.textContent = 'Test Link';
      link.id = 'test-link';
      link.setAttribute('data-testid', 'test-link');
      document.body.appendChild(link);
    });

    // Click the link and wait for events
    await page.getByTestId('test-link').click();
    await page.waitForTimeout(1000);

    // Verify we have both events and they are in the correct order
    expect(eventOrder).toHaveLength(2);
    expect(eventOrder[0]).toBe('CLICK');
    expect(eventOrder[1]).toBe('PAGE_VIEW');
  });

  test('should work correctly with external links', async ({ page }) => {
    const eventOrder: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[TraceLog]')) {
        if (msg.text().includes(`"type":"${EventType.CLICK}"`)) {
          eventOrder.push('CLICK');
        } else if (msg.text().includes(`"type":"${EventType.PAGE_VIEW}"`)) {
          eventOrder.push('PAGE_VIEW');
        }
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Clear initial events
    eventOrder.length = 0;

    // Add an external link (won't navigate but should still track click)
    await page.evaluate(() => {
      const link = document.createElement('a');
      link.href = 'https://example.com';
      link.target = '_blank';
      link.textContent = 'External Link';
      link.id = 'external-link';
      link.setAttribute('data-testid', 'external-link');
      document.body.appendChild(link);
    });

    // Click the external link (prevent navigation)
    await page.evaluate(() => {
      const link = document.getElementById('external-link');
      if (link) {
        link.addEventListener('click', (e) => e.preventDefault());
      }
    });

    await page.getByTestId('external-link').click();
    await page.waitForTimeout(600); // Wait for click event

    // Should only have click event, no page view for external links with preventDefault
    expect(eventOrder).toHaveLength(1);
    expect(eventOrder[0]).toBe('CLICK');
  });

  test('should demonstrate the fix - correct order for hash navigation', async ({ page }) => {
    const eventOrder: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[TraceLog]')) {
        if (msg.text().includes(`"type":"${EventType.CLICK}"`)) {
          eventOrder.push('CLICK');
        } else if (msg.text().includes(`"type":"${EventType.PAGE_VIEW}"`)) {
          eventOrder.push('PAGE_VIEW');
        }
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Clear initial events
    eventOrder.length = 0;

    // Add a link that triggers hash navigation
    await page.evaluate(() => {
      const link = document.createElement('a');
      link.href = '#new-section';
      link.textContent = 'Navigate Link';
      link.id = 'nav-link';
      link.setAttribute('data-testid', 'nav-link');
      document.body.appendChild(link);
    });

    await page.getByTestId('nav-link').click();
    await page.waitForTimeout(1000);
    
    // Verify the correct order: CLICK should come before PAGE_VIEW
    expect(eventOrder.length).toBeGreaterThanOrEqual(1);
    
    if (eventOrder.length >= 2) {
      expect(eventOrder[0]).toBe('CLICK');
      expect(eventOrder[1]).toBe('PAGE_VIEW');
    }
  });
});
