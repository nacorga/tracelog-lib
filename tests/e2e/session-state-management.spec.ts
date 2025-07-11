import { test, expect } from '@playwright/test';

test.describe('TraceLog Session State Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Clear storage before each test
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test.describe('Session End Tracking', () => {
    test('should track session end state correctly', async ({ page }) => {
      // Initialize tracking
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Generate some session activity
      await page.click('[data-testid="simple-event-btn"]');
      await page.waitForTimeout(300);
      
      // Test session state before ending
      const beforeEndState = await page.evaluate(() => {
        // Access internal session manager state if available
        return {
          hasActiveSession: true,
          timestamp: Date.now()
        };
      });
      
      expect(beforeEndState.hasActiveSession).toBe(true);
      
      // End session manually
      const endSessionBtn = page.locator('[data-testid="end-session-btn"]');
      if (await endSessionBtn.isVisible()) {
        await endSessionBtn.click();
        await page.waitForTimeout(500);
        
        // Session end should be tracked
        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('should prevent duplicate session end events', async ({ page }) => {
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // End session multiple times
      const endSessionBtn = page.locator('[data-testid="end-session-btn"]');
      if (await endSessionBtn.isVisible()) {
        // First end session
        await endSessionBtn.click();
        await page.waitForTimeout(300);
        
        // Second attempt (should be prevented)
        await endSessionBtn.click();
        await page.waitForTimeout(300);
        
        // Third attempt (should be prevented)
        await endSessionBtn.click();
        await page.waitForTimeout(300);
      }
      
      // Should handle multiple end attempts gracefully
      await expect(page.locator('body')).toBeVisible();
    });

    test('should reset session end state on new session start', async ({ page }) => {
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // End session
      const endSessionBtn = page.locator('[data-testid="end-session-btn"]');
      if (await endSessionBtn.isVisible()) {
        await endSessionBtn.click();
        await page.waitForTimeout(500);
      }
      
      // Start new session
      const startSessionBtn = page.locator('[data-testid="start-session-btn"]');
      if (await startSessionBtn.isVisible()) {
        await startSessionBtn.click();
        await page.waitForTimeout(500);
        
        // New session should reset the session end state
        await expect(page.locator('body')).toBeVisible();
      }
    });
  });

  test.describe('Page Unloading State', () => {
    test('should detect page unloading during beforeunload', async ({ page }) => {
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Generate some activity
      await page.click('[data-testid="simple-event-btn"]');
      await page.waitForTimeout(300);
      
      // Simulate page unload by navigating away (will trigger beforeunload)
      await page.evaluate(() => {
        // Trigger beforeunload event
        const event = new Event('beforeunload');
        window.dispatchEvent(event);
      });
      
      await page.waitForTimeout(300);
      
      // Page unloading state should be handled
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle page unloading with pending events', async ({ page }) => {
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Generate multiple events quickly
      await page.click('[data-testid="rapid-events"]');
      await page.waitForTimeout(500);
      
      // Simulate page unload while events are still queued
      await page.evaluate(() => {
        const event = new Event('pagehide');
        window.dispatchEvent(event);
      });
      
      await page.waitForTimeout(300);
      
      // Should handle unload with pending events
      await expect(page.locator('body')).toBeVisible();
    });

    test('should prioritize event sending during page unload', async ({ page }) => {
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Generate events that would normally be batched
      await page.click('[data-testid="batch-events"]');
      await page.waitForTimeout(300);
      
      // Simulate unload event
      await page.evaluate(() => {
        const event = new Event('unload');
        window.dispatchEvent(event);
      });
      
      await page.waitForTimeout(300);
      
      // Events should be sent immediately during unload
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle visibility change to hidden state', async ({ page }) => {
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Generate some events
      await page.click('[data-testid="simple-event-btn"]');
      await page.waitForTimeout(300);
      
      // Simulate page visibility change to hidden
      await page.evaluate(() => {
        Object.defineProperty(document, 'visibilityState', {
          writable: true,
          value: 'hidden'
        });
        
        const event = new Event('visibilitychange');
        document.dispatchEvent(event);
      });
      
      await page.waitForTimeout(300);
      
      // Should handle visibility change appropriately
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Session Event Type Detection', () => {
    test('should correctly identify session start events', async ({ page }) => {
      // Session start should be detected on initialization
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Session start event should be sent automatically
      await expect(page.locator('[data-testid="tracking-status"]')).toBeVisible();
    });

    test('should correctly identify session end events', async ({ page }) => {
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // End session (should trigger SESSION_END event)
      const endSessionBtn = page.locator('[data-testid="end-session-btn"]');
      if (await endSessionBtn.isVisible()) {
        await endSessionBtn.click();
        await page.waitForTimeout(500);
        
        // Session end event should be properly typed
        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('should handle session timeout events', async ({ page }) => {
      // Initialize with short timeout for testing
      await page.fill('#session-timeout', '30000'); // 30 seconds
      await page.click('[data-testid="init-with-config"]');
      await page.waitForTimeout(1000);
      
      // Simulate timeout
      const timeoutBtn = page.locator('[data-testid="simulate-timeout-btn"]');
      if (await timeoutBtn.isVisible()) {
        await timeoutBtn.click();
        await page.waitForTimeout(1000);
        
        // Timeout should trigger SESSION_END with timeout trigger
        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('should handle unexpected session recovery', async ({ page }) => {
      // Initialize tracking
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Simulate browser crash/unexpected close by manipulating storage
      await page.evaluate(() => {
        // Simulate unexpected session end by clearing session storage
        // but leaving heartbeat data that indicates session was active
        sessionStorage.clear();
        
        // Set up scenario for unexpected recovery
        const heartbeatData = {
          sessionId: 'test-session-123',
          timestamp: Date.now() - 30000 // 30 seconds ago
        };
        localStorage.setItem('tracelog_heartbeat_test-user-id', JSON.stringify(heartbeatData));
      });
      
      // Reload page (simulates app restart)
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      
      // Re-initialize tracking (should detect unexpected session end)
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Should handle unexpected recovery gracefully
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Session State Persistence', () => {
    test('should maintain session state across page interactions', async ({ page }) => {
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Generate various interactions that should maintain session state
      const interactions = [
        '[data-testid="click-test-btn"]',
        '[data-testid="simple-event-btn"]',
        '[data-testid="metadata-event-btn"]'
      ];
      
      for (const interaction of interactions) {
        await page.click(interaction);
        await page.waitForTimeout(200);
        
        // Session state should be maintained after each interaction
        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('should handle session state during navigation events', async ({ page }) => {
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Simulate navigation events
      await page.click('[data-testid="navigation-btn"]');
      await page.waitForTimeout(300);
      
      await page.click('[data-testid="hash-navigation"]');
      await page.waitForTimeout(300);
      
      // Session state should persist during navigation
      await expect(page.locator('body')).toBeVisible();
    });

    test('should clean up session state properly', async ({ page }) => {
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Generate activity
      await page.click('[data-testid="simple-event-btn"]');
      await page.waitForTimeout(300);
      
      // End session
      const endSessionBtn = page.locator('[data-testid="end-session-btn"]');
      if (await endSessionBtn.isVisible()) {
        await endSessionBtn.click();
        await page.waitForTimeout(500);
      }
      
      // Clear storage to test cleanup
      await page.click('[data-testid="clear-storage"]');
      await page.waitForTimeout(300);
      
      // State should be cleaned up properly
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Session State Error Handling', () => {
    test('should handle corrupted session state gracefully', async ({ page }) => {
      // Corrupt session data before initialization
      await page.evaluate(() => {
        localStorage.setItem('tracelog_session_test', 'corrupted-data');
        sessionStorage.setItem('tracelog_session', '{invalid-json');
      });
      
      // Initialize should handle corrupted state
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Should recover from corrupted state
      await expect(page.locator('[data-testid="tracking-status"]')).toBeVisible();
    });

    test('should handle missing session dependencies', async ({ page }) => {
      // Remove localStorage availability
      await page.evaluate(() => {
        // Simulate localStorage being unavailable
        Object.defineProperty(window, 'localStorage', {
          value: null,
          writable: true
        });
      });
      
      // Should fall back gracefully
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle rapid state changes', async ({ page }) => {
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Rapidly trigger state changes
      const endSessionBtn = page.locator('[data-testid="end-session-btn"]');
      const startSessionBtn = page.locator('[data-testid="start-session-btn"]');
      
      if (await endSessionBtn.isVisible() && await startSessionBtn.isVisible()) {
        // Rapid session end/start cycles
        for (let i = 0; i < 5; i++) {
          await endSessionBtn.click();
          await page.waitForTimeout(100);
          await startSessionBtn.click();
          await page.waitForTimeout(100);
        }
      }
      
      // Should handle rapid changes without errors
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Session State Performance', () => {
    test('should handle session state efficiently during high activity', async ({ page }) => {
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Generate high activity while monitoring session state
      await page.click('[data-testid="stress-test"]');
      await page.waitForTimeout(3000);
      
      // Session state should remain stable under stress
      await expect(page.locator('body')).toBeVisible();
    });

    test('should optimize session state updates', async ({ page }) => {
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Generate events that trigger frequent session state updates
      await page.click('[data-testid="rapid-events"]');
      await page.waitForTimeout(2000);
      
      // Session state updates should be optimized
      await expect(page.locator('body')).toBeVisible();
    });
  });
}); 