import { test, expect } from '@playwright/test';
import { EventType } from '../../src/types';

test.describe('Duplicate Events - Demo Mode', () => {
  test('should process single click normally', async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[TraceLog]')) {
        consoleLogs.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Single normal click
    await page.getByTestId('test-button').click();
    await page.waitForTimeout(200);

    const clickLogs = consoleLogs.filter((log) => log.includes(`"type":"${EventType.CLICK}"`));
    
    expect(clickLogs).toHaveLength(1);
  });

  test('should allow distinct clicks separated by sufficient time', async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[TraceLog]')) {
        consoleLogs.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Two clicks separated by more than 1 second
    await page.getByTestId('test-button').click();
    await page.waitForTimeout(1100); // Wait more than deduplication threshold
    await page.getByTestId('test-button').click();
    await page.waitForTimeout(200);

    const clickLogs = consoleLogs.filter((log) => log.includes(`"type":"${EventType.CLICK}"`));
    
    expect(clickLogs).toHaveLength(2);
  });

  test('should track rapid clicks as separate events (current behavior)', async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[TraceLog]')) {
        consoleLogs.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Two clicks with minimal delay - currently these are tracked as separate events
    await page.getByTestId('test-button').click();
    await page.waitForTimeout(50); // Small delay
    await page.getByTestId('test-button').click();
    await page.waitForTimeout(200);

    const clickLogs = consoleLogs.filter((log) => log.includes(`"type":"${EventType.CLICK}"`));    

    expect(clickLogs).toHaveLength(2);
    
    const event1 = JSON.parse(clickLogs[0].split('click event: ')[1]);
    const event2 = JSON.parse(clickLogs[1].split('click event: ')[1]);
    
    expect(event1.timestamp).not.toBe(event2.timestamp);
    expect(Math.abs(event1.timestamp - event2.timestamp)).toBeLessThan(200);
  });
});