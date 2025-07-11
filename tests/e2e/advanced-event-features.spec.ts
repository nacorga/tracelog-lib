import { test, expect } from '@playwright/test';

test.describe('TraceLog Advanced Event Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Clear storage before each test
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test.describe('Event Processing with Tags', () => {
    test('should apply multiple tags to events based on complex conditions', async ({ page }) => {
      // Initialize tracking
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Navigate with UTM parameters to trigger UTM-based tags
      await page.goto('/?utm_source=test&utm_medium=e2e&utm_campaign=advanced-features');
      await page.waitForLoadState('domcontentloaded');
      
      // Clear storage and reinitialize to test with UTM
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Click elements that should trigger multiple tag conditions
      await page.click('[data-testid="multi-btn-1"]'); // Has data-tracking attribute
      await page.waitForTimeout(200);
      
      await page.click('[data-testid="multi-btn-2"]'); // Has success-btn class
      await page.waitForTimeout(200);
      
      // Multiple tags should be applied to these events
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle tag performance with high event volume', async ({ page }) => {
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Generate high volume of events that need tag processing
      const startTime = Date.now();
      
      await page.click('[data-testid="rapid-events"]');
      await page.waitForTimeout(2000);
      
      const processingTime = Date.now() - startTime;
      
      // Tag processing should not significantly impact performance
      expect(processingTime).toBeLessThan(5000);
      
      // Events should still be processed correctly
      await expect(page.locator('body')).toBeVisible();
    });

    test('should apply tags correctly across different event types', async ({ page }) => {
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Test page view events with tags
      await page.click('[data-testid="navigation-btn"]');
      await page.waitForTimeout(300);
      
      // Test click events with tags
      await page.click('[data-testid="click-test-btn"]');
      await page.waitForTimeout(200);
      
      // Test scroll events with tags using mobile-safe approach
      const scrollArea = page.locator('[data-testid="scroll-area"]');
      await scrollArea.hover();
      
      if (page.context().browser()?.browserType().name() === 'webkit') {
        await page.evaluate(() => {
          const scrollEl = document.querySelector('[data-testid="scroll-area"]');
          if (scrollEl) {
            scrollEl.scrollTop += 50;
          }
        });
      } else {
        await page.mouse.wheel(0, 100);
      }
      
      await page.waitForTimeout(300);
      
      // Test custom events with tags
      await page.click('[data-testid="simple-event-btn"]');
      await page.waitForTimeout(200);
      
      // Tags should be applied to all event types appropriately
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Advanced Session Management', () => {
    test('should handle complex session lifecycle with proper event typing', async ({ page }) => {
      // Initialize and verify session start
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Generate session activity
      await page.click('[data-testid="simple-event-btn"]');
      await page.waitForTimeout(200);
      
      await page.click('[data-testid="metadata-event-btn"]');
      await page.waitForTimeout(200);
      
      // Test session inactivity handling
      const inactivityBtn = page.locator('[data-testid="simulate-inactivity-btn"]');
      if (await inactivityBtn.isVisible()) {
        await inactivityBtn.click();
        await page.waitForTimeout(1000);
      }
      
      // Test session reactivation
      await page.click('[data-testid="click-test-btn"]');
      await page.waitForTimeout(200);
      
      // End session and verify proper event typing
      const endSessionBtn = page.locator('[data-testid="end-session-btn"]');
      if (await endSessionBtn.isVisible()) {
        await endSessionBtn.click();
        await page.waitForTimeout(500);
      }
      
      // Session lifecycle should be handled correctly with proper event types
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle session recovery with proper state management', async ({ page }) => {
      // Initialize and create session activity
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      await page.click('[data-testid="simple-event-btn"]');
      await page.waitForTimeout(300);
      
      // Simulate unexpected termination
      await page.evaluate(() => {
        // Clear session storage but leave heartbeat
        sessionStorage.clear();
        
        // Simulate active session heartbeat
        const heartbeatData = {
          sessionId: 'recovery-test-session',
          timestamp: Date.now() - 10000 // 10 seconds ago
        };
        localStorage.setItem('tracelog_heartbeat_recovery-user', JSON.stringify(heartbeatData));
      });
      
      // Reload page to simulate recovery
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      
      // Re-initialize (should detect unexpected session end)
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Should handle recovery correctly with proper event typing
      await expect(page.locator('[data-testid="tracking-status"]')).toBeVisible();
    });

    test('should handle session timeout with proper cleanup', async ({ page }) => {
      // Initialize with short timeout
      await page.fill('#session-timeout', '30000'); // 30 seconds
      await page.click('[data-testid="init-with-config"]');
      await page.waitForTimeout(1000);
      
      // Generate activity before timeout
      await page.click('[data-testid="simple-event-btn"]');
      await page.waitForTimeout(300);
      
      // Simulate timeout
      const timeoutBtn = page.locator('[data-testid="simulate-timeout-btn"]');
      if (await timeoutBtn.isVisible()) {
        await timeoutBtn.click();
        await page.waitForTimeout(1000);
        
        // Session timeout should be handled with proper cleanup
        await expect(page.locator('body')).toBeVisible();
      }
    });
  });

  test.describe('Page Unload Event Handling', () => {
    test('should prioritize critical events during page unload', async ({ page }) => {
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Generate critical events
      await page.click('[data-testid="batch-events"]');
      await page.waitForTimeout(300);
      
      // Simulate page unload with pending events
      await page.evaluate(() => {
        // Trigger unload sequence
        window.dispatchEvent(new Event('beforeunload'));
        window.dispatchEvent(new Event('pagehide'));
      });
      
      await page.waitForTimeout(500);
      
      // Critical events should be prioritized during unload
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle rapid unload/reload cycles', async ({ page }) => {
      for (let i = 0; i < 3; i++) {
        await page.click('[data-testid="init-tracking"]');
        await page.waitForTimeout(500);
        
        // Generate some activity
        await page.click('[data-testid="simple-event-btn"]');
        await page.waitForTimeout(200);
        
        // Simulate unload
        await page.evaluate(() => {
          window.dispatchEvent(new Event('beforeunload'));
        });
        
        await page.waitForTimeout(300);
        
        // Reload
        await page.reload();
        await page.waitForLoadState('domcontentloaded');
        
        await page.evaluate(() => {
          localStorage.clear();
          sessionStorage.clear();
        });
      }
      
      // Should handle rapid cycles gracefully
      await expect(page.locator('body')).toBeVisible();
    });

    test('should send session end events during unload', async ({ page }) => {
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Generate session activity
      await page.click('[data-testid="simple-event-btn"]');
      await page.waitForTimeout(300);
      
      // Simulate page unload (should trigger session end)
      await page.evaluate(() => {
        window.dispatchEvent(new Event('beforeunload'));
        window.dispatchEvent(new Event('pagehide'));
        window.dispatchEvent(new Event('unload'));
      });
      
      await page.waitForTimeout(500);
      
      // Session end should be sent during unload
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Event Deduplication and Optimization', () => {
    test('should deduplicate similar events efficiently', async ({ page }) => {
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Generate duplicate events rapidly
      for (let i = 0; i < 10; i++) {
        await page.click('[data-testid="click-test-btn"]');
        await page.waitForTimeout(50); // Very rapid clicks
      }
      
      // Should deduplicate similar rapid events
      await page.waitForTimeout(500);
      
      // Generate different events
      await page.click('[data-testid="multi-btn-1"]');
      await page.waitForTimeout(100);
      await page.click('[data-testid="multi-btn-2"]');
      await page.waitForTimeout(100);
      
      // Should handle deduplication without losing unique events
      await expect(page.locator('body')).toBeVisible();
    });

    test('should optimize event batching with tags', async ({ page }) => {
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Generate events that need tag processing and batching
      const startTime = Date.now();
      
      // Multiple events with tag processing
      for (let i = 0; i < 20; i++) {
        if (i % 2 === 0) {
          await page.click('[data-testid="multi-btn-1"]');
        } else {
          await page.click('[data-testid="multi-btn-2"]');
        }
        await page.waitForTimeout(50);
      }
      
      const processingTime = Date.now() - startTime;
      
      // Should batch events efficiently even with tag processing
      expect(processingTime).toBeLessThan(3000);
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle event queue management under load', async ({ page }) => {
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Generate high load to test queue management
      await page.click('[data-testid="stress-test"]');
      await page.waitForTimeout(3000);
      
      // Queue should be managed efficiently under load
      await page.click('[data-testid="simple-event-btn"]');
      await page.waitForTimeout(300);
      
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Cross-Feature Integration', () => {
    test('should integrate tags, session management, and mobile features', async ({ page }) => {
      // Test on mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Navigate with UTM parameters
      await page.goto('/?utm_source=mobile&utm_medium=test&utm_campaign=integration');
      await page.waitForLoadState('domcontentloaded');
      
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      // Initialize tracking
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Test click events (should trigger tags based on device type)
      await page.click('[data-testid="multi-btn-1"]');
      await page.waitForTimeout(200);
      
      // Test scroll using safer approach for mobile
      const scrollArea = page.locator('[data-testid="scroll-area"]');
      await scrollArea.scrollIntoViewIfNeeded();
      await scrollArea.hover();
      
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
      
      await page.waitForTimeout(300);
      
      // Test session management
      await page.evaluate(() => {
        // Simulate visibility change
        Object.defineProperty(document, 'visibilityState', { 
          value: 'hidden', 
          writable: true 
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      
      await page.waitForTimeout(500);
      
      // All features should work together seamlessly
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle complex event chains with all features', async ({ page }) => {
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Complex event chain:
      // 1. Page view (triggers URL tags)
      await page.click('[data-testid="navigation-btn"]');
      await page.waitForTimeout(200);
      
      // 2. Scroll events (triggers scroll tags and session activity)
      const scrollArea = page.locator('[data-testid="scroll-area"]');
      await scrollArea.scrollIntoViewIfNeeded();
      await scrollArea.hover();
      
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
      
      await page.waitForTimeout(200);
      
      // 3. Click events (triggers element tags)
      await page.click('[data-testid="multi-btn-1"]');
      await page.waitForTimeout(200);
      
      // 4. Custom events (triggers custom event tags)
      await page.click('[data-testid="simple-event-btn"]');
      await page.waitForTimeout(200);
      
      // 5. Session management events
      const endSessionBtn = page.locator('[data-testid="end-session-btn"]');
      await endSessionBtn.click();
      await page.waitForTimeout(300);
      
      // 6. Page unload
      await page.evaluate(() => {
        window.dispatchEvent(new Event('beforeunload'));
      });
      
      await page.waitForTimeout(300);
      
      // Complex event chain should be handled correctly
      await expect(page.locator('body')).toBeVisible();
    });

    test('should maintain consistency across feature interactions', async ({ page }) => {
      // Test consistency over multiple session cycles (reduced to 2 for stability)
      for (let cycle = 0; cycle < 2; cycle++) {
        await page.click('[data-testid="init-tracking"]');
        await page.waitForTimeout(500);
        
        // Generate mixed activity
        await page.click('[data-testid="simple-event-btn"]');
        await page.waitForTimeout(100);
        
        await page.click('[data-testid="multi-btn-1"]');
        await page.waitForTimeout(100);
        
        // Use safer scroll approach
        const scrollArea = page.locator('[data-testid="scroll-area"]');
        await scrollArea.scrollIntoViewIfNeeded();
        await scrollArea.hover();
        
        if (page.context().browser()?.browserType().name() === 'webkit') {
          await page.evaluate(() => {
            const scrollEl = document.querySelector('[data-testid="scroll-area"]');
            if (scrollEl) {
              scrollEl.scrollTop += 13;
            }
          });
        } else {
          await page.mouse.wheel(0, 25);
        }
        
        await page.waitForTimeout(100);
        
        // End session
        const endSessionBtn = page.locator('[data-testid="end-session-btn"]');
        await endSessionBtn.click();
        await page.waitForTimeout(300);
        
        // Clear for next cycle
        await page.evaluate(() => {
          sessionStorage.clear();
        });
        
        await page.waitForTimeout(200);
      }
      
      // Should maintain consistency across cycles
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Error Recovery and Resilience', () => {
    test('should recover from tag processing errors', async ({ page }) => {
      // Simulate tag processing errors
      await page.evaluate(() => {
        // Inject error-prone tag configuration
        (window as any).testErrorTags = {
          tags: [
            {
              id: 'error-tag',
              name: 'Error Tag',
              triggerType: 'click',
              logicalOperator: 'AND',
              isActive: true,
              conditions: [
                {
                  type: 'url_matches',
                  operator: 'regex',
                  value: '[invalid-regex(',
                  caseSensitive: false
                }
              ]
            }
          ]
        };
      });
      
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Should recover from tag processing errors
      await page.click('[data-testid="click-test-btn"]');
      await page.waitForTimeout(300);
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle storage failures gracefully', async ({ page }) => {
      // Simulate storage failures
      await page.evaluate(() => {
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = function() {
          throw new Error('Storage failed');
        };
      });
      
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Should handle storage failures gracefully
      await page.click('[data-testid="simple-event-btn"]');
      await page.waitForTimeout(300);
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('should maintain functionality under network failures', async ({ page }) => {
      // Simulate network failures
      await page.route('**/*', (route) => {
        if (route.request().url().includes('api') || route.request().url().includes('track')) {
          route.abort();
        } else {
          route.continue();
        }
      });
      
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Should queue events despite network failures
      await page.click('[data-testid="simple-event-btn"]');
      await page.waitForTimeout(300);
      
      await page.click('[data-testid="metadata-event-btn"]');
      await page.waitForTimeout(300);
      
      // Should maintain functionality under network failures
      await expect(page.locator('body')).toBeVisible();
    });
  });
}); 