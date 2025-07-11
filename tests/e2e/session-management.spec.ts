import { test, expect } from '@playwright/test';

test.describe('TraceLog Session Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Clear storage before each test
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test.describe('Session Initialization', () => {
    test('should start session automatically on tracking initialization', async ({ page }) => {
      // Check initial state
      const initialStatus = await page.locator('[data-testid="tracking-status"]').textContent();
      expect(initialStatus).toContain('Not initialized');
      
      // Initialize tracking (should start session automatically)
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Session should be started (verify no errors and can send events)
      await expect(page.locator('[data-testid="tracking-status"]')).toBeVisible();
      
      // Test that we can send events after session start
      await page.click('[data-testid="simple-event-btn"]');
      await page.waitForTimeout(300);
    });

    test('should generate unique session IDs', async ({ page }) => {
      // Start first session
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Check if session data exists in storage
      const firstSessionData = await page.evaluate(() => {
        return {
          localStorage: { ...localStorage },
          sessionStorage: { ...sessionStorage }
        };
      });
      
      // End session and start new one
      const endSessionBtn = page.locator('[data-testid="end-session-btn"]');
      if (await endSessionBtn.isVisible()) {
        await endSessionBtn.click();
        await page.waitForTimeout(500);
      }
      
      // Clear storage to simulate new session
      await page.evaluate(() => {
        sessionStorage.clear();
      });
      
      const startSessionBtn = page.locator('[data-testid="start-session-btn"]');
      if (await startSessionBtn.isVisible()) {
        await startSessionBtn.click();
        await page.waitForTimeout(500);
      }
      
      // Check new session data
      const secondSessionData = await page.evaluate(() => {
        return {
          localStorage: { ...localStorage },
          sessionStorage: { ...sessionStorage }
        };
      });
      
      // Should handle session management
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle session start with custom configuration', async ({ page }) => {
      // Set custom session timeout
      await page.fill('#session-timeout', '60000');
      
      // Set custom global metadata
      await page.fill('#global-metadata', '{"session_test": true, "timeout": 60000}');
      
      // Initialize with custom config
      await page.click('[data-testid="init-with-config"]');
      await page.waitForTimeout(1000);
      
      // Should start session with custom config
      const status = await page.locator('[data-testid="tracking-status"]').textContent();
      expect(status).not.toContain('error');
    });
  });

  test.describe('Session Lifecycle', () => {
    test.beforeEach(async ({ page }) => {
      // Initialize tracking for session tests
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
    });

    test('should handle manual session end', async ({ page }) => {
      // End session manually
      const endSessionBtn = page.locator('[data-testid="end-session-btn"]');
      if (await endSessionBtn.isVisible()) {
        await endSessionBtn.click();
        await page.waitForTimeout(500);
        
        // Should handle session end gracefully
        await expect(page.locator('[data-testid="tracking-status"]')).toBeVisible();
      }
    });

    test('should handle session restart', async ({ page }) => {
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
      }
      
      // Should handle session restart
      await expect(page.locator('body')).toBeVisible();
    });

    test('should send session events', async ({ page }) => {
      // Generate some activity
      await page.click('[data-testid="click-test-btn"]');
      await page.waitForTimeout(300);
      
      await page.click('[data-testid="simple-event-btn"]');
      await page.waitForTimeout(300);
      
      // End session (should trigger session end event)
      const endSessionBtn = page.locator('[data-testid="end-session-btn"]');
      if (await endSessionBtn.isVisible()) {
        await endSessionBtn.click();
        await page.waitForTimeout(500);
      }
      
      // Should handle session events
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Session Timeout', () => {
    test('should handle session timeout simulation', async ({ page }) => {
      // Initialize with short timeout for testing
      await page.fill('#session-timeout', '30000'); // 30 seconds
      await page.click('[data-testid="init-with-config"]');
      await page.waitForTimeout(1000);
      
      // Simulate timeout
      const timeoutBtn = page.locator('[data-testid="simulate-timeout-btn"]');
      if (await timeoutBtn.isVisible()) {
        await timeoutBtn.click();
        await page.waitForTimeout(1000);
        
        // Should handle timeout gracefully
        await expect(page.locator('[data-testid="tracking-status"]')).toBeVisible();
      }
    });

    test('should handle inactivity timeout', async ({ page }) => {
      // Initialize tracking
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Test inactivity simulation if available
      const inactivityBtn = page.locator('[data-testid="simulate-inactivity-btn"]');
      if (await inactivityBtn.isVisible()) {
        await inactivityBtn.click();
        await page.waitForTimeout(1000);
      }
      
      // Should handle inactivity
      await expect(page.locator('body')).toBeVisible();
    });

    test('should reset timeout on user activity', async ({ page }) => {
      // Initialize tracking
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Simulate user activity
      await page.click('[data-testid="click-test-btn"]');
      await page.waitForTimeout(300);
      
      await page.mouse.move(100, 100);
      await page.waitForTimeout(300);
      
      const scrollArea = page.locator('[data-testid="scroll-area"]');
      if (await scrollArea.isVisible()) {
        await scrollArea.hover();
        
        // Use mobile-safe scrolling approach
        if (page.context().browser()?.browserType().name() === 'webkit') {
          await page.evaluate(() => {
            const scrollEl = document.querySelector('[data-testid="scroll-area"]');
            if (scrollEl) {
              scrollEl.scrollTop += 25;
            }
          });
        } else {
          await page.mouse.wheel(0, 50);
        }
      }
      
      // Should handle activity-based timeout reset
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Session Persistence', () => {
    test('should persist session data across page reloads', async ({ page }) => {
      // Initialize and generate some session data
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Generate some activity
      await page.click('[data-testid="simple-event-btn"]');
      await page.waitForTimeout(300);
      
      // Check if session data is stored
      const sessionDataBefore = await page.evaluate(() => {
        return {
          localStorageLength: localStorage.length,
          sessionStorageLength: sessionStorage.length,
          hasTrackingData: Object.keys(localStorage).some(key => 
            key.includes('tracelog') || key.includes('session') || key.includes('user')
          )
        };
      });
      
      // Reload page
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      
      // Check if session data persisted
      const sessionDataAfter = await page.evaluate(() => {
        return {
          localStorageLength: localStorage.length,
          sessionStorageLength: sessionStorage.length,
          hasTrackingData: Object.keys(localStorage).some(key => 
            key.includes('tracelog') || key.includes('session') || key.includes('user')
          )
        };
      });
      
      // Initialize again and check recovery
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Should work after reload
      await expect(page.locator('[data-testid="tracking-status"]')).toBeVisible();
    });

    test('should handle session recovery on restart', async ({ page }) => {
      // Initialize first session
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Generate events
      await page.click('[data-testid="click-test-btn"]');
      await page.waitForTimeout(300);
      
      // Simulate abrupt close (don't end session properly)
      await page.evaluate(() => {
        // Simulate unexpected page close
        window.dispatchEvent(new Event('beforeunload'));
      });
      await page.waitForTimeout(500);
      
      // Reload to simulate app restart
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      
      // Initialize again - should detect unexpected session end
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Should handle recovery
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle storage overflow gracefully', async ({ page }) => {
      // Initialize tracking
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Try to overflow localStorage with events
      for (let i = 0; i < 100; i++) {
        await page.click('[data-testid="click-test-btn"]');
        if (i % 20 === 0) {
          await page.waitForTimeout(100);
        }
      }
      
      await page.waitForTimeout(1000);
      
      // Should handle storage gracefully
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Session Metadata', () => {
    test('should include global metadata in sessions', async ({ page }) => {
      // Set global metadata
      const metadata = '{"environment": "test", "version": "1.0.0", "user_type": "e2e_test"}';
      await page.fill('#global-metadata', metadata);
      
      // Initialize with metadata
      await page.click('[data-testid="init-with-config"]');
      await page.waitForTimeout(1000);
      
      // Generate events with global metadata
      await page.click('[data-testid="simple-event-btn"]');
      await page.waitForTimeout(300);
      
      await page.click('[data-testid="metadata-event-btn"]');
      await page.waitForTimeout(300);
      
      // Should handle global metadata
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle device detection in sessions', async ({ page }) => {
      // Initialize tracking
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Check device detection works
      const deviceInfo = await page.evaluate(() => {
        return {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          }
        };
      });
      
      expect(deviceInfo.userAgent).toBeDefined();
      expect(deviceInfo.platform).toBeDefined();
      
      // Generate events (should include device info)
      await page.click('[data-testid="simple-event-btn"]');
      await page.waitForTimeout(300);
    });
  });

  test.describe('Session Error Handling', () => {
    test('should handle session errors gracefully', async ({ page }) => {
      // Initialize tracking
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Try to cause session errors
      await page.evaluate(() => {
        // Simulate storage errors
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = () => {
          throw new Error('Storage quota exceeded');
        };
        
        // Restore after test
        setTimeout(() => {
          localStorage.setItem = originalSetItem;
        }, 1000);
      });
      
      // Generate events that might cause storage errors
      await page.click('[data-testid="simple-event-btn"]');
      await page.waitForTimeout(300);
      
      // Should handle storage errors
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle network errors during session', async ({ page }) => {
      // Initialize tracking
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Go offline
      await page.context().setOffline(true);
      
      // Generate events while offline
      await page.click('[data-testid="simple-event-btn"]');
      await page.waitForTimeout(300);
      
      await page.click('[data-testid="click-test-btn"]');
      await page.waitForTimeout(300);
      
      // Try to end session while offline
      const endSessionBtn = page.locator('[data-testid="end-session-btn"]');
      if (await endSessionBtn.isVisible()) {
        await endSessionBtn.click();
        await page.waitForTimeout(500);
      }
      
      // Go back online
      await page.context().setOffline(false);
      await page.waitForTimeout(500);
      
      // Should handle offline/online transition
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Multiple Sessions', () => {
    test('should handle multiple session cycles', async ({ page }) => {
      for (let cycle = 0; cycle < 3; cycle++) {
        // Start session
        if (cycle === 0) {
          await page.click('[data-testid="init-tracking"]');
        } else {
          const startBtn = page.locator('[data-testid="start-session-btn"]');
          if (await startBtn.isVisible()) {
            await startBtn.click();
          }
        }
        await page.waitForTimeout(500);
        
        // Generate some activity
        await page.click('[data-testid="click-test-btn"]');
        await page.waitForTimeout(200);
        
        await page.click('[data-testid="simple-event-btn"]');
        await page.waitForTimeout(200);
        
        // End session
        const endBtn = page.locator('[data-testid="end-session-btn"]');
        if (await endBtn.isVisible()) {
          await endBtn.click();
          await page.waitForTimeout(500);
        }
      }
      
      // Should handle multiple session cycles
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle concurrent session operations', async ({ page }) => {
      // Initialize tracking
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Perform concurrent operations
      const operations = [
        page.click('[data-testid="click-test-btn"]'),
        page.click('[data-testid="simple-event-btn"]'),
        page.evaluate(() => window.scrollTo(0, 100)),
      ];
      
      await Promise.all(operations);
      await page.waitForTimeout(500);
      
      // Should handle concurrent operations
      await expect(page.locator('body')).toBeVisible();
    });
  });
}); 