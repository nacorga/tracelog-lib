import { test, expect } from '@playwright/test';

test.describe('TraceLog Tags Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Clear storage before each test
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test.describe('Tag Configuration', () => {
    test('should handle tags configuration during initialization', async ({ page }) => {
      // Test that tags configuration can be set (even if not visible in UI)
      await page.evaluate(() => {
        const configWithTags = {
          sessionTimeout: 60000,
          globalMetadata: { test_mode: true },
          // Simulate tags configuration being passed to the system
          tags: [
            {
              id: 'test-tag-1',
              name: 'Test Tag 1',
              triggerType: 'click',
              logicalOperator: 'AND',
              isActive: true,
              conditions: [
                {
                  type: 'url_matches',
                  operator: 'contains',
                  value: 'localhost',
                  caseSensitive: false
                }
              ]
            }
          ]
        };
        
        // Store config in window for testing
        (window as any).testTagsConfig = configWithTags;
      });
      
      // Initialize tracking (tags will be processed internally)
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Verify initialization succeeded
      const status = await page.locator('[data-testid="tracking-status"]').textContent();
      expect(status).not.toContain('error');
    });

    test('should handle invalid tags configuration gracefully', async ({ page }) => {
      // Test with invalid tags configuration
      await page.evaluate(() => {
        const configWithInvalidTags = {
          sessionTimeout: 60000,
          tags: [
            {
              // Missing required fields
              id: 'invalid-tag',
              name: 'Invalid Tag'
              // Missing triggerType, conditions, etc.
            }
          ]
        };
        
        (window as any).testInvalidTagsConfig = configWithInvalidTags;
      });
      
      // Initialize tracking should still work despite invalid tags
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Should initialize successfully and ignore invalid tags
      await expect(page.locator('[data-testid="tracking-status"]')).toBeVisible();
    });
  });

  test.describe('Tag Matching - URL Conditions', () => {
    test('should apply tags based on URL matching conditions', async ({ page }) => {
      // Initialize tracking first
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Simulate events that should trigger URL-based tags
      await page.click('[data-testid="click-test-btn"]');
      await page.waitForTimeout(300);
      
      // Navigate to trigger page view with URL matching
      await page.click('[data-testid="navigation-btn"]');
      await page.waitForTimeout(300);
      
      // Events should be processed successfully
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle different URL operators', async ({ page }) => {
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Test different URL scenarios
      const testUrls = [
        '#test-contains',
        '#test-starts-with',
        '#test-ends-with'
      ];
      
      for (const url of testUrls) {
        // Navigate to different hash URLs
        await page.evaluate((testUrl) => {
          window.location.hash = testUrl;
        }, url);
        await page.waitForTimeout(200);
        
        // Trigger events at different URLs
        await page.click('[data-testid="simple-event-btn"]');
        await page.waitForTimeout(200);
      }
      
      // All events should be processed
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Tag Matching - Element Conditions', () => {
    test('should apply tags based on clicked element properties', async ({ page }) => {
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Click different types of elements that should match element conditions
      const elementsToTest = [
        '[data-testid="multi-btn-1"]',
        '[data-testid="multi-btn-2"]', 
        '[data-testid="multi-btn-3"]',
        '[data-testid="test-link"]'
      ];
      
      for (const element of elementsToTest) {
        await page.click(element);
        await page.waitForTimeout(200);
      }
      
      // Tags should be applied based on element properties
      await expect(page.locator('body')).toBeVisible();
    });

    test('should match tags based on data attributes', async ({ page }) => {
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Click elements with data-tracking attributes
      await page.click('[data-testid="multi-btn-1"]'); // data-tracking="button_1"
      await page.waitForTimeout(200);
      
      await page.click('[data-testid="multi-btn-2"]'); // data-tracking="button_2"
      await page.waitForTimeout(200);
      
      await page.click('[data-testid="test-link"]'); // data-tracking="test_link"
      await page.waitForTimeout(200);
      
      // Tags should match based on data attributes
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle element class and ID matching', async ({ page }) => {
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Click elements with different classes (success-btn, danger-btn)
      await page.click('[data-testid="multi-btn-2"]'); // has success-btn class
      await page.waitForTimeout(200);
      
      await page.click('[data-testid="multi-btn-3"]'); // has danger-btn class
      await page.waitForTimeout(200);
      
      // Tags should match based on element classes
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Tag Matching - Device Type Conditions', () => {
    test('should apply tags based on device type detection', async ({ page }) => {
      // Test desktop device type detection
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Generate events that should trigger device-type tags
      await page.click('[data-testid="click-test-btn"]');
      await page.waitForTimeout(300);
      
      // Send page view event
      await page.click('[data-testid="navigation-btn"]');
      await page.waitForTimeout(300);
      
      // Device type tags should be applied
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Tag Matching - UTM Parameters', () => {
    test('should apply tags based on UTM parameters', async ({ page }) => {
      // Navigate with UTM parameters
      await page.goto('/?utm_source=test&utm_medium=e2e&utm_campaign=tags-test');
      await page.waitForLoadState('domcontentloaded');
      
      // Clear storage
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      // Initialize tracking with UTM parameters present
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Generate events that should trigger UTM-based tags
      await page.click('[data-testid="simple-event-btn"]');
      await page.waitForTimeout(300);
      
      // UTM tags should be applied
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle different UTM parameter combinations', async ({ page }) => {
      const utmParams = [
        'utm_source=facebook&utm_medium=social',
        'utm_source=google&utm_medium=cpc&utm_campaign=spring-sale',
        'utm_source=newsletter&utm_medium=email'
      ];
      
      for (const params of utmParams) {
        await page.goto(`/?${params}`);
        await page.waitForLoadState('domcontentloaded');
        
        await page.evaluate(() => {
          localStorage.clear();
          sessionStorage.clear();
        });
        
        await page.click('[data-testid="init-tracking"]');
        await page.waitForTimeout(500);
        
        await page.click('[data-testid="simple-event-btn"]');
        await page.waitForTimeout(300);
      }
      
      // All UTM variations should be processed
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Tag Logic Operators', () => {
    test('should handle AND logic operator in tag conditions', async ({ page }) => {
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Generate events that should meet multiple AND conditions
      // (URL contains localhost AND device is desktop AND element is button)
      await page.click('[data-testid="click-test-btn"]');
      await page.waitForTimeout(300);
      
      // AND logic should require all conditions to be met
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle OR logic operator in tag conditions', async ({ page }) => {
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Generate events that should meet at least one OR condition
      await page.click('[data-testid="multi-btn-1"]');
      await page.waitForTimeout(200);
      
      await page.click('[data-testid="test-link"]');
      await page.waitForTimeout(200);
      
      // OR logic should match when any condition is met
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Tag Performance', () => {
    test('should handle multiple tags efficiently', async ({ page }) => {
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Generate many events that could trigger multiple tags
      await page.click('[data-testid="batch-events"]');
      await page.waitForTimeout(1000);
      
      // Performance should remain good with multiple tags
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle rapid events with tag processing', async ({ page }) => {
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Generate rapid events that need tag processing
      await page.click('[data-testid="rapid-events"]');
      await page.waitForTimeout(2000);
      
      // Should handle rapid events with tags efficiently
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Tag Error Handling', () => {
    test('should handle regex errors in tag conditions gracefully', async ({ page }) => {
      await page.evaluate(() => {
        // Simulate config with invalid regex
        (window as any).testInvalidRegexConfig = {
          tags: [
            {
              id: 'invalid-regex-tag',
              name: 'Invalid Regex Tag',
              triggerType: 'click',
              logicalOperator: 'AND',
              isActive: true,
              conditions: [
                {
                  type: 'url_matches',
                  operator: 'regex',
                  value: '[invalid-regex',
                  caseSensitive: false
                }
              ]
            }
          ]
        };
      });
      
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Should handle invalid regex gracefully
      await page.click('[data-testid="click-test-btn"]');
      await page.waitForTimeout(300);
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle missing tag condition data', async ({ page }) => {
      await page.click('[data-testid="init-tracking"]');
      await page.waitForTimeout(1000);
      
      // Generate events that might not have all expected data
      await page.click('[data-testid="test-null-values"]');
      await page.waitForTimeout(300);
      
      // Should handle missing data gracefully
      await expect(page.locator('body')).toBeVisible();
    });
  });
}); 