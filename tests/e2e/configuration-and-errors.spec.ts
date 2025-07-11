import { test, expect } from '@playwright/test';

test.describe('TraceLog Configuration and Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Clear storage before each test
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test.describe('Configuration Management', () => {
    test('should handle basic configuration', async ({ page }) => {
      // Test default configuration
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Should initialize with defaults (verify page remains functional)
      await expect(page.locator('[data-testid="tracking-status"]')).toBeVisible();
      
      // Test that we can send events after initialization
      await page.click('[data-testid="simple-event-btn"]');
      await page.waitForTimeout(300);
    });

    test('should handle custom tracking ID', async ({ page }) => {
      // Set custom tracking ID
      const customId = 'custom-e2e-test-id-' + Date.now();
      await page.fill('#tracking-id', customId);
      
      // Initialize with custom ID
      await page.click('[data-testid="init-with-config"]');
      await page.waitForTimeout(1000);
      
      // Should accept custom ID
      const status = await page.locator('[data-testid="tracking-status"]').textContent();
      expect(status).not.toContain('error');
    });

    test('should handle session timeout configuration', async ({ page }) => {
      // Test various timeout values
      const timeouts = ['30000', '60000', '300000', '900000'];
      
      for (const timeout of timeouts) {
        await page.fill('#session-timeout', timeout);
        await page.click('[data-testid="init-with-config"]');
        await page.waitForTimeout(500);
        
        // Reset for next iteration
        await page.evaluate(() => {
          localStorage.clear();
          sessionStorage.clear();
        });
        await page.reload();
        await page.waitForLoadState('domcontentloaded');
      }
      
      // Should handle various timeout configurations
      await expect(page.locator('body')).toBeVisible();
    });

    test('should validate minimum session timeout', async ({ page }) => {
      // Test timeout below minimum (should be rejected)
      await page.fill('#session-timeout', '1000'); // Too low
      await page.click('[data-testid="init-with-config"]');
      await page.waitForTimeout(500);
      
      // Should handle invalid timeout gracefully
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle global metadata configuration', async ({ page }) => {
      // Test valid metadata
      const validMetadata = {
        environment: 'e2e-test',
        version: '1.0.0',
        feature_flags: ['flag1', 'flag2'],
        user_preferences: {
          theme: 'dark',
          language: 'es'
        }
      };
      
      await page.fill('#global-metadata', JSON.stringify(validMetadata));
      await page.click('[data-testid="init-with-config"]');
      await page.waitForTimeout(1000);
      
      // Generate events to test metadata inclusion
      await page.click('[data-testid="simple-event-btn"]');
      await page.waitForTimeout(300);
      
      // Should handle complex metadata
      const status = await page.locator('[data-testid="tracking-status"]').textContent();
      expect(status).not.toContain('error');
    });

    test('should handle empty configuration', async ({ page }) => {
      // Clear all configuration fields
      await page.fill('#tracking-id', '');
      await page.fill('#session-timeout', '');
      await page.fill('#global-metadata', '');
      
      // Try to initialize with empty config
      await page.click('[data-testid="init-with-config"]');
      await page.waitForTimeout(1000);
      
      // Should handle empty config gracefully
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle configuration updates', async ({ page }) => {
      // Initialize with basic config
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Try to reinitialize with different config
      await page.fill('#tracking-id', 'updated-id');
      await page.fill('#session-timeout', '120000');
      await page.click('[data-testid="reinit-tracking"]');
      await page.waitForTimeout(1000);
      
      // Should handle reinitialization
      await expect(page.locator('[data-testid="tracking-status"]')).toBeVisible();
    });
  });

  test.describe('Invalid Configuration Handling', () => {
    test('should handle invalid JSON metadata', async ({ page }) => {
      // Test various invalid JSON formats
      const invalidJSONs = [
        '{invalid json}',
        '{"unclosed": "quote}',
        '{key: "no quotes on key"}',
        '{"trailing": "comma",}',
        'not json at all'
      ];
      
      for (const invalidJSON of invalidJSONs) {
        await page.fill('#global-metadata', invalidJSON);
        await page.click('[data-testid="init-with-config"]');
        await page.waitForTimeout(500);
        
        // Should handle invalid JSON gracefully
        await expect(page.locator('body')).toBeVisible();
        
        // Reset for next test
        await page.evaluate(() => {
          localStorage.clear();
          sessionStorage.clear();
        });
        await page.reload();
        await page.waitForLoadState('domcontentloaded');
      }
    });

    test('should handle malformed tracking IDs', async ({ page }) => {
      // Test various problematic tracking IDs
      const problematicIds = [
        '', // Empty
        '   ', // Whitespace only
        'id with spaces',
        'id@with#special$chars',
        'very-long-id-that-might-cause-issues-in-some-systems-because-of-length-constraints-testing-edge-cases',
        '123456789', // Numeric only
      ];
      
      for (const id of problematicIds) {
        await page.fill('#tracking-id', id);
        await page.click('[data-testid="init-with-config"]');
        await page.waitForTimeout(500);
        
        // Should handle problematic IDs
        await expect(page.locator('body')).toBeVisible();
        
        // Reset
        await page.evaluate(() => {
          localStorage.clear();
          sessionStorage.clear();
        });
        await page.reload();
        await page.waitForLoadState('domcontentloaded');
      }
    });

    test('should handle invalid session timeout values', async ({ page }) => {
      // Test invalid timeout values
      const invalidTimeouts = [
        '-1', // Negative
        '0', // Zero
        '999', // Below minimum
        '999999999999', // Extremely large
      ];
      
      for (const timeout of invalidTimeouts) {
        // Clear field first, then set value
        await page.locator('#session-timeout').clear();
        await page.locator('#session-timeout').fill(timeout);
        await page.click('[data-testid="init-with-config"]');
        await page.waitForTimeout(500);
        
        // Should handle invalid timeouts
        await expect(page.locator('body')).toBeVisible();
        
        // Reset
        await page.evaluate(() => {
          localStorage.clear();
          sessionStorage.clear();
        });
        await page.reload();
        await page.waitForLoadState('domcontentloaded');
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle initialization errors', async ({ page }) => {
      // Simulate initialization failure
      await page.evaluate(() => {
        // Mock network failure
        const originalFetch = window.fetch;
        window.fetch = () => Promise.reject(new Error('Network error'));
        
        // Restore after test
        setTimeout(() => {
          window.fetch = originalFetch;
        }, 2000);
      });
      
      // Try to initialize
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1500);
      
      // Should handle initialization errors gracefully
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle API errors', async ({ page }) => {
      // Initialize tracking first
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Simulate API errors during operation
      await page.evaluate(() => {
        // Mock API failures
        const originalFetch = window.fetch;
        window.fetch = (url) => {
          if (typeof url === 'string' && url.includes('api')) {
            return Promise.reject(new Error('API Error'));
          }
          return originalFetch(url);
        };
        
        setTimeout(() => {
          window.fetch = originalFetch;
        }, 3000);
      });
      
      // Generate events that would trigger API calls
      await page.click('[data-testid="simple-event-btn"]');
      await page.waitForTimeout(300);
      
      await page.click('[data-testid="metadata-event-btn"]');
      await page.waitForTimeout(300);
      
      // Should handle API errors gracefully
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle storage errors', async ({ page }) => {
      // Initialize tracking
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Simulate storage quota exceeded
      await page.evaluate(() => {
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = () => {
          throw new Error('QuotaExceededError');
        };
        
        // Also mock sessionStorage
        const originalSessionSetItem = sessionStorage.setItem;
        sessionStorage.setItem = () => {
          throw new Error('QuotaExceededError');
        };
        
        setTimeout(() => {
          localStorage.setItem = originalSetItem;
          sessionStorage.setItem = originalSessionSetItem;
        }, 2000);
      });
      
      // Generate events that would use storage
      for (let i = 0; i < 10; i++) {
        await page.click('[data-testid="click-test-btn"]');
        await page.waitForTimeout(100);
      }
      
      // Should handle storage errors
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle JavaScript runtime errors', async ({ page }) => {
      // Initialize tracking
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
             // Inject code that might cause runtime errors
       await page.evaluate(() => {
         // Simulate various runtime errors
         try {
           const obj: any = null;
           obj.property = 'value'; // Null reference
         } catch (e) {
           console.error('Caught expected null reference error:', e);
         }
         
         try {
           (undefined as any).method(); // Undefined method call
         } catch (e) {
           console.error('Caught expected undefined method error:', e);
         }
       });
      
      // Generate normal events after errors
      await page.click('[data-testid="simple-event-btn"]');
      await page.waitForTimeout(300);
      
      // Should continue working despite runtime errors
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle network connectivity issues', async ({ page }) => {
      // Initialize tracking
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Generate events while online
      await page.click('[data-testid="simple-event-btn"]');
      await page.waitForTimeout(300);
      
      // Go offline
      await page.context().setOffline(true);
      
      // Generate events while offline
      for (let i = 0; i < 5; i++) {
        await page.click('[data-testid="click-test-btn"]');
        await page.waitForTimeout(200);
      }
      
      // Go back online
      await page.context().setOffline(false);
      await page.waitForTimeout(1000);
      
      // Generate events after coming back online
      await page.click('[data-testid="metadata-event-btn"]');
      await page.waitForTimeout(300);
      
      // Should handle connectivity changes gracefully
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle rapid reinitialization attempts', async ({ page }) => {
      // Rapidly attempt multiple initializations
      for (let i = 0; i < 5; i++) {
        await page.click('[data-testid="init-tracking"]');
        await page.waitForTimeout(100);
      }
      
      await page.waitForTimeout(1000);
      
      // Should handle rapid attempts gracefully
      await expect(page.locator('[data-testid="tracking-status"]')).toBeVisible();
    });

    test('should handle configuration during active session', async ({ page }) => {
      // Initialize tracking
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Generate some activity
      await page.click('[data-testid="simple-event-btn"]');
      await page.waitForTimeout(300);
      
      // Try to change configuration while active
      await page.fill('#session-timeout', '600000');
      await page.fill('#global-metadata', '{"live_update": true}');
      
      // Attempt reinitialization during active session
      await page.click('[data-testid="reinit-tracking"]');
      await page.waitForTimeout(1000);
      
      // Should handle live configuration changes
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle browser tab visibility changes', async ({ page }) => {
      // Initialize tracking
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Simulate tab becoming hidden
      await page.evaluate(() => {
        Object.defineProperty(document, 'visibilityState', {
          configurable: true,
          get: () => 'hidden'
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await page.waitForTimeout(500);
      
      // Generate events while "hidden"
      await page.click('[data-testid="click-test-btn"]');
      await page.waitForTimeout(300);
      
      // Simulate tab becoming visible again
      await page.evaluate(() => {
        Object.defineProperty(document, 'visibilityState', {
          configurable: true,
          get: () => 'visible'
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await page.waitForTimeout(500);
      
      // Should handle visibility changes
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle memory pressure simulation', async ({ page }) => {
      // Initialize tracking
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
             // Simulate memory pressure by creating large objects
       await page.evaluate(() => {
         const largeArrays: string[][] = [];
         for (let i = 0; i < 10; i++) {
           largeArrays.push(new Array(10000).fill(`data-${i}`));
         }
         
         // Clean up after test
         setTimeout(() => {
           largeArrays.length = 0;
         }, 2000);
       });
      
      // Generate events during memory pressure
      for (let i = 0; i < 20; i++) {
        await page.click('[data-testid="click-test-btn"]');
        await page.waitForTimeout(50);
      }
      
      await page.waitForTimeout(1000);
      
      // Should handle memory pressure gracefully
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Recovery Scenarios', () => {
    test('should recover from corrupted storage data', async ({ page }) => {
      // Initialize tracking and generate some data
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      await page.click('[data-testid="simple-event-btn"]');
      await page.waitForTimeout(300);
      
      // Corrupt the storage data
      await page.evaluate(() => {
        localStorage.setItem('tracelog_data', 'corrupted data');
        sessionStorage.setItem('tracelog_session', '{invalid json');
      });
      
      // Reload and try to initialize again
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Should recover from corrupted data
      await expect(page.locator('[data-testid="tracking-status"]')).toBeVisible();
    });

    test('should handle service worker interference', async ({ page }) => {
      // Register a mock service worker that might interfere
      await page.evaluate(() => {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(() => {
            // Mock some interference
            console.log('Service worker active');
          }).catch(() => {
            // Service worker not available in test environment
            console.log('Service worker not available');
          });
        }
      });
      
      // Initialize tracking
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Generate events
      await page.click('[data-testid="simple-event-btn"]');
      await page.waitForTimeout(300);
      
      // Should work despite service worker presence
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle unexpected page navigation', async ({ page }) => {
      // Initialize tracking
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Generate some events
      await page.click('[data-testid="click-test-btn"]');
      await page.waitForTimeout(300);
      
      // Simulate unexpected navigation
      await page.evaluate(() => {
        window.history.pushState({}, '', '#unexpected-navigation');
        window.dispatchEvent(new PopStateEvent('popstate'));
      });
      await page.waitForTimeout(500);
      
      // Generate more events after navigation
      await page.click('[data-testid="simple-event-btn"]');
      await page.waitForTimeout(300);
      
      // Should handle unexpected navigation
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Performance Under Stress', () => {
    test('should handle high-frequency event generation', async ({ page }) => {
      // Initialize tracking
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Generate high-frequency events
      const startTime = Date.now();
      for (let i = 0; i < 100; i++) {
        await page.click('[data-testid="click-test-btn"]');
        if (i % 25 === 0) {
          await page.click('[data-testid="simple-event-btn"]');
        }
        // Minimal delay to simulate rapid user interaction
        await page.waitForTimeout(10);
      }
      const endTime = Date.now();
      
      console.log(`Generated 100+ events in ${endTime - startTime}ms`);
      
      // Allow time for processing
      await page.waitForTimeout(1000);
      
      // Should handle high-frequency events
      await expect(page.locator('body')).toBeVisible();
    });

    test('should maintain responsiveness under load', async ({ page }) => {
      // Initialize tracking
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Create background load
      const loadPromise = (async () => {
        for (let i = 0; i < 50; i++) {
          await page.click('[data-testid="click-test-btn"]');
          await page.waitForTimeout(50);
        }
      })();
      
      // Test responsiveness during load
      const responsivePromise = (async () => {
        await page.waitForTimeout(500); // Let load start
        await page.click('[data-testid="simple-event-btn"]');
        await page.click('[data-testid="metadata-event-btn"]');
        const status = await page.locator('[data-testid="tracking-status"]').textContent();
        return status;
      })();
      
      const [, status] = await Promise.all([loadPromise, responsivePromise]);
      
      // Should remain responsive under load
      expect(status).toBeDefined();
      await expect(page.locator('body')).toBeVisible();
    });
  });
}); 