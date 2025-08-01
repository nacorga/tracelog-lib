import { test, expect } from '@playwright/test';
import { EventType } from '../../src/types';

test.describe('Queue Logging - Test Mode', () => {
  test('should log queue structure following real interval-based batching and verify Queue interface compliance', async ({ page }) => {
    const consoleLogs: string[] = [];
    const queueLogs: string[] = [];
    const eventLogs: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[TraceLog]')) {
        consoleLogs.push(msg.text());
        
        if (msg.text().includes('Queue structure:')) {
          queueLogs.push(msg.text());
        }
        
        if (msg.text().includes('event:')) {
          eventLogs.push(msg.text());
        }
      }
    });

    // Step 1: Initialize (triggers session_start and page_view)
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Step 2: Perform multiple actions within the test interval (2500ms)
    // This simulates real user behavior where events accumulate before being sent
    await page.getByTestId('test-button').click();
    await page.waitForTimeout(300);

    await page.evaluate(() => window.scrollTo(0, 200));
    await page.waitForTimeout(300);

    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(300);

    // Step 3: Wait for the test interval (2500ms) to trigger queue send
    // In test mode, events are batched and sent every 2500ms
    await page.waitForTimeout(3000);

    // Step 4: Perform more actions to create another batch
    await page.getByTestId('custom-event-btn').click();
    await page.waitForTimeout(300);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);

    // Step 5: Wait for another interval
    await page.waitForTimeout(3000);

    // Step 6: Trigger session end which forces immediate queue send
    await page.goto('about:blank');
    await page.waitForTimeout(1000);

    // Verify we have queue structure logs (should have multiple due to interval-based sending)
    expect(queueLogs.length).toBeGreaterThan(0);

    // Verify individual event types were logged
    const sessionStartLogs = eventLogs.filter((log) => log.includes(EventType.SESSION_START));
    const pageViewLogs = eventLogs.filter((log) => log.includes(EventType.PAGE_VIEW));
    const clickLogs = eventLogs.filter((log) => log.includes(EventType.CLICK));
    const scrollLogs = eventLogs.filter((log) => log.includes(EventType.SCROLL));
    const customLogs = eventLogs.filter((log) => log.includes(EventType.CUSTOM));
    const sessionEndLogs = eventLogs.filter((log) => log.includes(EventType.SESSION_END));

    expect(sessionStartLogs.length).toBeGreaterThan(0);
    expect(pageViewLogs.length).toBeGreaterThan(0);
    expect(clickLogs.length).toBeGreaterThan(0);
    expect(scrollLogs.length).toBeGreaterThan(0);
    expect(customLogs.length).toBeGreaterThan(0);
    expect(sessionEndLogs.length).toBeGreaterThan(0);

    // Parse and verify queue structure for each batch
    let totalEventsProcessed = 0;
    for (const [index, queueLog] of queueLogs.entries()) {
      // Extract JSON from log message
      const queueStructureMatch = queueLog.match(/Queue structure: (.+)$/);
      expect(queueStructureMatch).not.toBeNull();
      
      const queueStructureJson = queueStructureMatch![1];
      const queueStructure = JSON.parse(queueStructureJson);

      // Verify Queue interface compliance
      expect(queueStructure).toHaveProperty('user_id');
      expect(queueStructure).toHaveProperty('session_id');
      expect(queueStructure).toHaveProperty('device');
      expect(queueStructure).toHaveProperty('events_count');
      expect(queueStructure).toHaveProperty('has_global_metadata');

      // Verify data types match Queue interface
      expect(typeof queueStructure.user_id).toBe('string');
      expect(typeof queueStructure.session_id).toBe('string');
      expect(typeof queueStructure.device).toBe('string');
      expect(typeof queueStructure.events_count).toBe('number');
      expect(typeof queueStructure.has_global_metadata).toBe('boolean');

      // Verify required fields are not empty (as per Queue interface)
      expect(queueStructure.user_id).toBeTruthy();
      expect(queueStructure.session_id).toBeTruthy();
      expect(queueStructure.device).toBeTruthy();

      // Verify events_count is a positive number (Queue.events is non-empty array)
      expect(queueStructure.events_count).toBeGreaterThan(0);

      totalEventsProcessed += queueStructure.events_count;
    }

    // Verify that interval-based batching occurred
    // We should have multiple queue sends due to the 2500ms test interval
    expect(queueLogs.length).toBeGreaterThanOrEqual(2);
    
    // Verify total events processed across all batches
    expect(totalEventsProcessed).toBeGreaterThan(5); // session_start, page_view, click, scrolls, custom, session_end
  });

  test('should demonstrate realistic interval-based queue batching with proper timing', async ({ page }) => {
    const consoleLogs: string[] = [];
    const queueTimestamps: number[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[TraceLog]')) {
        consoleLogs.push(msg.text());
        
        // Track when queue structures are logged (indicates queue send)
        if (msg.text().includes('Queue structure:')) {
          queueTimestamps.push(Date.now());
        }
      }
    });

    // Initialize
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Generate events rapidly (simulating real user interaction)
    await page.getByTestId('test-button').click();
    await page.waitForTimeout(100);
    
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(100);
    
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(100);

    // Wait for first interval (test mode: 2500ms)
    await page.waitForTimeout(3000);
    
    // Generate more events
    await page.getByTestId('custom-event-btn').click();
    await page.waitForTimeout(100);
    
    await page.evaluate(() => window.scrollTo(0, 900));
    await page.waitForTimeout(100);

    // Wait for second interval
    await page.waitForTimeout(3000);

    // Force immediate send with session end
    await page.goto('about:blank');
    await page.waitForTimeout(1000);

    // Verify timing behavior
    expect(queueTimestamps.length).toBeGreaterThanOrEqual(2);
    
    // Verify intervals are approximately 2500ms apart (with some tolerance)
    if (queueTimestamps.length >= 2) {
      const intervalDuration = queueTimestamps[1] - queueTimestamps[0];

      expect(intervalDuration).toBeGreaterThan(2000); // At least 2 seconds
      expect(intervalDuration).toBeLessThan(4000); // Less than 4 seconds (accounting for processing time)
    }

    // Verify that events were batched (not sent individually)
    const queueLogs = consoleLogs.filter(log => log.includes('Queue structure:'));
    const eventLogs = consoleLogs.filter(log => log.includes('event:') && !log.includes('Queue structure:'));
    
    // Should have more individual events than queue sends (proving batching)
    expect(eventLogs.length).toBeGreaterThan(queueLogs.length);
  });

  test('should verify queue structure accuracy against actual Queue interface during session lifecycle', async ({ page }) => {
    const consoleLogs: string[] = [];
    const sessionPhases: { phase: string; timestamp: number; queueStructure?: any }[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[TraceLog]')) {
        consoleLogs.push(msg.text());
      }
    });

    // Phase 1: Session initialization
    sessionPhases.push({ phase: 'pre-init', timestamp: Date.now() });
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    
    sessionPhases.push({ phase: 'post-init', timestamp: Date.now() });

    // Phase 2: User interactions (should accumulate in queue)
    await page.getByTestId('test-button').click();
    await page.waitForTimeout(200);
    
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(200);
    
    sessionPhases.push({ phase: 'post-interactions', timestamp: Date.now() });

    // Phase 3: Wait for interval-based send (2500ms in test mode)
    await page.waitForTimeout(3000);
    
    // Capture first queue send
    const firstQueueLog = consoleLogs.find(log => log.includes('Queue structure:'));

    if (firstQueueLog) {
      const match = firstQueueLog.match(/Queue structure: (.+)$/);

      if (match) {
        sessionPhases.push({ 
          phase: 'first-queue-send', 
          timestamp: Date.now(), 
          queueStructure: JSON.parse(match[1]) 
        });
      }
    }

    // Phase 4: More interactions
    await page.getByTestId('custom-event-btn').click();
    await page.waitForTimeout(200);
    
    sessionPhases.push({ phase: 'additional-interactions', timestamp: Date.now() });

    // Phase 5: Force session end (immediate send)
    await page.goto('about:blank');
    await page.waitForTimeout(1000);
    
    sessionPhases.push({ phase: 'session-end', timestamp: Date.now() });

    // Analyze session lifecycle
    const queueLogs = consoleLogs.filter(log => log.includes('Queue structure:'));
    
    for (const [index, queueLog] of queueLogs.entries()) {
      const match = queueLog.match(/Queue structure: (.+)$/);

      if (match) {
        const structure = JSON.parse(match[1]);
        
        // Verify Queue interface compliance throughout session lifecycle
        expect(structure).toHaveProperty('user_id');
        expect(structure).toHaveProperty('session_id');
        expect(structure).toHaveProperty('device');
        expect(structure).toHaveProperty('events_count');
        expect(structure).toHaveProperty('has_global_metadata');
        
        // Verify all queue structures in the session have the same session_id
        if (index === 0) {
          sessionPhases.forEach(phase => {
            if (phase.queueStructure) {
              expect(phase.queueStructure.session_id).toBe(structure.session_id);
            }
          });
        }
      }
    }

    // Print session timeline for debugging
    // Verify realistic session behavior
    expect(queueLogs.length).toBeGreaterThanOrEqual(2); // At least initial batch and session end
    
    // Verify session consistency
    const allSessionIds = queueLogs.map(log => {
      const match = log.match(/Queue structure: (.+)$/);
      return match ? JSON.parse(match[1]).session_id : null;
    }).filter(Boolean);
    
    const uniqueSessionIds = new Set(allSessionIds);

    expect(uniqueSessionIds.size).toBe(1); // All queue sends should have the same session_id
  });
});
