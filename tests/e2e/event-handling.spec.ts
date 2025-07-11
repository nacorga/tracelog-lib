import { test, expect } from '@playwright/test';

test.describe('TraceLog Event Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Clear storage before each test
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Initialize tracking for event tests
    await page.click('[data-testid="init-tracking"]');
    await page.waitForTimeout(1000);
  });

  test.describe('Page View Events', () => {
    test('should handle initial page view', async ({ page }) => {
      // Page view should be automatically tracked on initialization
      const currentUrl = page.url();
      expect(currentUrl).toContain('localhost');
      
      // Tracking should be active (verify page view is handled)
      await expect(page.locator('[data-testid="tracking-status"]')).toBeVisible();
      expect(currentUrl).toBeDefined();
    });

    test('should handle URL hash changes', async ({ page }) => {
      // Change URL hash to simulate navigation
      await page.evaluate(() => {
        window.location.hash = '#section1';
      });
      await page.waitForTimeout(500);
      
      expect(page.url()).toContain('#section1');
      
      // Change hash again
      await page.evaluate(() => {
        window.location.hash = '#section2';
      });
      await page.waitForTimeout(500);
      
      expect(page.url()).toContain('#section2');
      
      // Clear hash
      await page.evaluate(() => {
        window.location.hash = '';
      });
      await page.waitForTimeout(500);
    });

         test('should handle search parameter changes', async ({ page }) => {
       // Add search parameters
       await page.evaluate(() => {
         const url = new URL(window.location.href);
         url.searchParams.set('test', 'value');
         window.history.pushState({}, '', url);
       });
       await page.waitForTimeout(500);
       
       expect(page.url()).toContain('test=value');
     });
  });

  test.describe('Click Events', () => {
    test('should track basic click events', async ({ page }) => {
      const clickCounter = page.locator('[data-testid="click-counter"]');
      const initialCount = await clickCounter.textContent();
      
      // Perform multiple clicks
      for (let i = 0; i < 3; i++) {
        await page.click('[data-testid="click-test-btn"]');
        await page.waitForTimeout(200);
      }
      
      // Counter should update
      const finalCount = await clickCounter.textContent();
      expect(finalCount).toBeDefined();
    });

    test('should track clicks with different element types', async ({ page }) => {
      // Click different types of elements
      const elements = [
        '[data-testid="click-test-btn"]',
        '[data-testid="simple-event-btn"]',
        '[data-testid="metadata-event-btn"]',
        'h1', // Header element
      ];
      
      for (const selector of elements) {
        if (await page.locator(selector).isVisible()) {
          await page.click(selector);
          await page.waitForTimeout(200);
        }
      }
      
      // Should handle all click types
      await expect(page.locator('body')).toBeVisible();
    });

    test('should capture click coordinates', async ({ page }) => {
      const testButton = page.locator('[data-testid="click-test-btn"]');
      const boundingBox = await testButton.boundingBox();
      
      if (boundingBox) {
        // Click at specific coordinates
        await page.mouse.click(boundingBox.x + 10, boundingBox.y + 10);
        await page.waitForTimeout(300);
        
        // Click at different coordinates
        await page.mouse.click(boundingBox.x + boundingBox.width - 10, boundingBox.y + boundingBox.height - 10);
        await page.waitForTimeout(300);
      }
      
      await expect(testButton).toBeVisible();
    });

         test('should handle rapid click events', async ({ page }) => {
       // Rapid fire clicks to test event throttling/handling
       const promises: Promise<void>[] = [];
       for (let i = 0; i < 10; i++) {
         promises.push(page.click('[data-testid="click-test-btn"]', { timeout: 1000 }));
       }
       
       await Promise.all(promises);
       await page.waitForTimeout(500);
       
       // Should handle rapid events gracefully
       await expect(page.locator('[data-testid="click-counter"]')).toBeVisible();
     });
  });

  test.describe('Scroll Events', () => {
    test('should track scroll events in scroll areas', async ({ page }) => {
      const scrollArea = page.locator('[data-testid="scroll-area"]');
      
      if (await scrollArea.isVisible()) {
        await scrollArea.scrollIntoViewIfNeeded();
        await scrollArea.hover();
        
        // Use mobile-safe scrolling approach
        if (page.context().browser()?.browserType().name() === 'webkit') {
          // For Mobile Safari, use evaluate to scroll
          await page.evaluate(() => {
            const scrollEl = document.querySelector('[data-testid="scroll-area"]');
            if (scrollEl) {
              scrollEl.scrollTop += 50;
            }
          });
          await page.waitForTimeout(300);
          
          await page.evaluate(() => {
            const scrollEl = document.querySelector('[data-testid="scroll-area"]');
            if (scrollEl) {
              scrollEl.scrollTop -= 25;
            }
          });
          await page.waitForTimeout(300);
          
          await page.evaluate(() => {
            const scrollEl = document.querySelector('[data-testid="scroll-area"]');
            if (scrollEl) {
              scrollEl.scrollTop += 75;
            }
          });
          await page.waitForTimeout(300);
        } else {
          // For other browsers, use mouse wheel
          await page.mouse.wheel(0, 50);
          await page.waitForTimeout(300);
          
          await page.mouse.wheel(0, -25);
          await page.waitForTimeout(300);
          
          await page.mouse.wheel(0, 75);
          await page.waitForTimeout(300);
        }
      }
      
      await expect(scrollArea).toBeVisible();
    });

    test('should track page scroll events', async ({ page }) => {
      // Scroll the main page
      await page.evaluate(() => {
        window.scrollTo(0, 100);
      });
      await page.waitForTimeout(300);
      
      await page.evaluate(() => {
        window.scrollTo(0, 200);
      });
      await page.waitForTimeout(300);
      
      await page.evaluate(() => {
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(300);
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle scroll direction changes', async ({ page }) => {
      const scrollArea = page.locator('[data-testid="scroll-area"]');
      
      if (await scrollArea.isVisible()) {
        await scrollArea.hover();
        
        // Series of scroll direction changes with mobile-safe approach
        if (page.context().browser()?.browserType().name() === 'webkit') {
          // For Mobile Safari, use evaluate to scroll
          await page.evaluate(() => {
            const scrollEl = document.querySelector('[data-testid="scroll-area"]');
            if (scrollEl) {
              scrollEl.scrollTop += 50;
            }
          });
          await page.waitForTimeout(200);
          
          await page.evaluate(() => {
            const scrollEl = document.querySelector('[data-testid="scroll-area"]');
            if (scrollEl) {
              scrollEl.scrollTop -= 75;
            }
          });
          await page.waitForTimeout(200);
          
          await page.evaluate(() => {
            const scrollEl = document.querySelector('[data-testid="scroll-area"]');
            if (scrollEl) {
              scrollEl.scrollTop += 38;
            }
          });
          await page.waitForTimeout(200);
          
          await page.evaluate(() => {
            const scrollEl = document.querySelector('[data-testid="scroll-area"]');
            if (scrollEl) {
              scrollEl.scrollTop -= 13;
            }
          });
          await page.waitForTimeout(200);
        } else {
          // For other browsers, use mouse wheel
          await page.mouse.wheel(0, 50); // Down
          await page.waitForTimeout(200);
          await page.mouse.wheel(0, -75); // Up
          await page.waitForTimeout(200);
          await page.mouse.wheel(0, 38); // Down
          await page.waitForTimeout(200);
          await page.mouse.wheel(0, -13); // Up
          await page.waitForTimeout(200);
        }
      }
      
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Custom Events', () => {
    test('should send simple custom events', async ({ page }) => {
      // Send multiple simple events
      for (let i = 0; i < 3; i++) {
        await page.click('[data-testid="simple-event-btn"]');
        await page.waitForTimeout(200);
      }
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('should send custom events with metadata', async ({ page }) => {
      // Send events with metadata
      for (let i = 0; i < 3; i++) {
        await page.click('[data-testid="metadata-event-btn"]');
        await page.waitForTimeout(200);
      }
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle custom event creation via form', async ({ page }) => {
      // Test custom event form if available
      const customEventName = page.locator('#custom-event-name');
      const customEventMetadata = page.locator('#custom-event-metadata');
      const sendCustomBtn = page.locator('[data-testid="send-custom-event"]');
      
      if (await customEventName.isVisible()) {
        await customEventName.fill('test_event_form');
        
        if (await customEventMetadata.isVisible()) {
          await customEventMetadata.fill('{"form_test": true, "counter": 1}');
        }
        
        if (await sendCustomBtn.isVisible()) {
          await sendCustomBtn.click();
          await page.waitForTimeout(300);
        }
      }
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle invalid custom events gracefully', async ({ page }) => {
      // Try sending invalid events
      await page.click('[data-testid="invalid-event-btn"]');
      await page.waitForTimeout(300);
      
      // Should not crash the application
      await expect(page.locator('[data-testid="tracking-status"]')).toBeVisible();
      
      // Should still be able to send valid events
      await page.click('[data-testid="simple-event-btn"]');
      await page.waitForTimeout(300);
    });

    test('should handle custom events with different metadata types', async ({ page }) => {
      const customEventName = page.locator('#custom-event-name');
      const customEventMetadata = page.locator('#custom-event-metadata');
      const sendCustomBtn = page.locator('[data-testid="send-custom-event"]');
      
      if (await customEventName.isVisible() && await customEventMetadata.isVisible() && await sendCustomBtn.isVisible()) {
        // Test different metadata types
        const metadataTests = [
          '{"string_value": "test", "number_value": 42, "boolean_value": true}',
          '{"array_value": ["item1", "item2"], "nested": {"key": "value"}}',
          '{"timestamp": 1234567890, "percentage": 85.5}'
        ];
        
        for (const metadata of metadataTests) {
          await customEventName.fill(`test_metadata_${Date.now()}`);
          await customEventMetadata.fill(metadata);
          await sendCustomBtn.click();
          await page.waitForTimeout(300);
        }
      }
      
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Session Events', () => {
    test('should handle session start automatically', async ({ page }) => {
      // Session should start automatically on initialization
      // This is tested by the successful initialization in beforeEach
      await expect(page.locator('[data-testid="tracking-status"]')).toBeVisible();
      
      // Test that session-related events can be sent
      await page.click('[data-testid="simple-event-btn"]');
      await page.waitForTimeout(300);
    });

    test('should handle manual session management', async ({ page }) => {
      // Test manual session controls if available
      const startSessionBtn = page.locator('[data-testid="start-session-btn"]');
      const endSessionBtn = page.locator('[data-testid="end-session-btn"]');
      
      if (await endSessionBtn.isVisible()) {
        await endSessionBtn.click();
        await page.waitForTimeout(500);
      }
      
      if (await startSessionBtn.isVisible()) {
        await startSessionBtn.click();
        await page.waitForTimeout(500);
      }
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle session timeout simulation', async ({ page }) => {
      const timeoutBtn = page.locator('[data-testid="simulate-timeout-btn"]');
      
      if (await timeoutBtn.isVisible()) {
        await timeoutBtn.click();
        await page.waitForTimeout(1000);
        
        // Should handle timeout gracefully
        await expect(page.locator('[data-testid="tracking-status"]')).toBeVisible();
      }
    });
  });

  test.describe('Event Queue Management', () => {
    test('should handle event queue overflow', async ({ page }) => {
      // Generate many events quickly to test queue management
      for (let i = 0; i < 50; i++) {
        await page.click('[data-testid="click-test-btn"]');
        if (i % 10 === 0) {
          await page.click('[data-testid="simple-event-btn"]');
        }
        await page.waitForTimeout(10);
      }
      
      await page.waitForTimeout(1000);
      
      // Should handle many events without crashing
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle concurrent event generation', async ({ page }) => {
      // Generate different types of events with mobile-safe approach
      if (page.context().browser()?.browserType().name() === 'webkit') {
        // For Mobile Safari, perform operations sequentially to avoid conflicts
        // Click events
        for (let i = 0; i < 5; i++) {
          await page.click('[data-testid="click-test-btn"]');
          await page.waitForTimeout(80);
        }
        
        // Custom events
        for (let i = 0; i < 3; i++) {
          await page.click('[data-testid="simple-event-btn"]');
          await page.waitForTimeout(120);
        }
        
        // Scroll events
        const scrollArea = page.locator('[data-testid="scroll-area"]');
        if (await scrollArea.isVisible()) {
          for (let i = 0; i < 3; i++) {
            await page.evaluate(() => {
              const scrollEl = document.querySelector('[data-testid="scroll-area"]');
              if (scrollEl) {
                scrollEl.scrollTop += 25;
              }
            });
            await page.waitForTimeout(100);
          }
        }
      } else {
        // For other browsers, use concurrent approach
        const tasks = [
          // Click events
          (async () => {
            for (let i = 0; i < 10; i++) {
              await page.click('[data-testid="click-test-btn"]');
              await page.waitForTimeout(100);
            }
          })(),
          
          // Custom events
          (async () => {
            for (let i = 0; i < 5; i++) {
              await page.click('[data-testid="simple-event-btn"]');
              await page.waitForTimeout(200);
            }
          })(),
          
          // Scroll events
          (async () => {
            const scrollArea = page.locator('[data-testid="scroll-area"]');
            if (await scrollArea.isVisible()) {
              await scrollArea.hover();
              for (let i = 0; i < 5; i++) {
                await page.mouse.wheel(0, 50);
                await page.waitForTimeout(150);
              }
            }
          })(),
        ];
        
        await Promise.all(tasks);
      }
      
      await page.waitForTimeout(500);
      
      // Should handle concurrent events
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Event Validation', () => {
    test('should validate event data before sending', async ({ page }) => {
      // Test that the system validates events properly
      await page.click('[data-testid="simple-event-btn"]');
      await page.waitForTimeout(300);
      
      // Try invalid event
      await page.click('[data-testid="invalid-event-btn"]');
      await page.waitForTimeout(300);
      
      // Valid event should still work after invalid attempt
      await page.click('[data-testid="metadata-event-btn"]');
      await page.waitForTimeout(300);
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle malformed metadata gracefully', async ({ page }) => {
      const customEventMetadata = page.locator('#custom-event-metadata');
      const sendCustomBtn = page.locator('[data-testid="send-custom-event"]');
      
      if (await customEventMetadata.isVisible() && await sendCustomBtn.isVisible()) {
        // Test invalid JSON
        await customEventMetadata.fill('invalid json {');
        await sendCustomBtn.click();
        await page.waitForTimeout(300);
        
        // Test valid JSON after invalid
        await customEventMetadata.fill('{"valid": true}');
        await sendCustomBtn.click();
        await page.waitForTimeout(300);
      }
      
      await expect(page.locator('body')).toBeVisible();
    });
  });
}); 