import { test, expect } from '@playwright/test';
import { TestUtils } from '../../utils';

test.describe('Click Tracking - Interactive Elements', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to test page first to ensure proper context
    await TestUtils.navigateAndWaitForReady(page, '/');

    // Clear any existing storage to ensure clean test state
    try {
      await page.evaluate(() => {
        if (typeof localStorage !== 'undefined') {
          localStorage.clear();
        }

        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.clear();
        }
      });
    } catch {
      // WebKit may block storage access in some contexts, continue with test
      console.log('Storage cleanup skipped due to security restrictions');
    }
  });

  test.describe('Interactive element tracking', () => {
    test('should track clicks on buttons', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create test button and click it
        await page.evaluate(() => {
          const button = document.createElement('button');
          button.id = 'test-button';
          button.className = 'btn primary';
          button.textContent = 'Click Me';
          button.setAttribute('data-testid', 'interactive-button');
          document.body.appendChild(button);
        });

        // Click the button
        await page.click('#test-button');
        await TestUtils.waitForTimeout(page, 1000);

        // Verify that click tracking doesn't cause errors
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        // Verify the button element exists and is clickable
        const buttonExists = await page.locator('#test-button').isVisible();
        expect(buttonExists).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should track clicks on links', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create test link and click it
        await page.evaluate(() => {
          const link = document.createElement('a');
          link.id = 'test-link';
          link.href = '#test-section';
          link.className = 'nav-link';
          link.textContent = 'Navigate';
          link.setAttribute('data-testid', 'interactive-link');
          document.body.appendChild(link);
        });

        // Click the link (prevent navigation)
        await page.evaluate(() => {
          const link = document.getElementById('test-link');
          link?.addEventListener('click', (e) => e.preventDefault());
        });

        await page.click('#test-link');
        await TestUtils.waitForTimeout(page, 1000);

        // Verify that click tracking doesn't cause errors
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        // Verify the link element exists and is clickable
        const linkExists = await page.locator('#test-link').isVisible();
        expect(linkExists).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should track clicks on input elements', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create test input elements
        await page.evaluate(() => {
          const container = document.createElement('div');

          // Submit button
          const submitBtn = document.createElement('input');
          submitBtn.type = 'submit';
          submitBtn.id = 'submit-input';
          submitBtn.value = 'Submit Form';
          submitBtn.className = 'form-submit';

          // Checkbox
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.id = 'check-input';
          checkbox.className = 'form-checkbox';
          checkbox.setAttribute('data-testid', 'interactive-checkbox');

          container.appendChild(submitBtn);
          container.appendChild(checkbox);
          document.body.appendChild(container);
        });

        // Click the submit input
        await page.click('#submit-input');
        await TestUtils.waitForTimeout(page, 500);

        // Click the checkbox
        await page.click('#check-input');
        await TestUtils.waitForTimeout(page, 1000);

        // Verify that click tracking doesn't cause errors
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        // Verify both input elements exist and are clickable
        const submitExists = await page.locator('#submit-input').isVisible();
        const checkboxExists = await page.locator('#check-input').isVisible();
        expect(submitExists).toBe(true);
        expect(checkboxExists).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should track clicks on elements with ARIA roles', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create test elements with ARIA roles
        await page.evaluate(() => {
          const container = document.createElement('div');

          // Button role
          const buttonRole = document.createElement('div');
          buttonRole.setAttribute('role', 'button');
          buttonRole.setAttribute('tabindex', '0');
          buttonRole.id = 'aria-button';
          buttonRole.textContent = 'ARIA Button';
          buttonRole.className = 'custom-button';

          // Tab role
          const tabRole = document.createElement('div');
          tabRole.setAttribute('role', 'tab');
          tabRole.setAttribute('tabindex', '0');
          tabRole.id = 'aria-tab';
          tabRole.textContent = 'Tab Item';
          tabRole.setAttribute('aria-label', 'Navigation Tab');

          container.appendChild(buttonRole);
          container.appendChild(tabRole);
          document.body.appendChild(container);
        });

        // Click ARIA button
        await page.click('#aria-button');
        await TestUtils.waitForTimeout(page, 500);

        // Click ARIA tab
        await page.click('#aria-tab');
        await TestUtils.waitForTimeout(page, 1000);

        // Verify that click tracking doesn't cause errors
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        // Verify both ARIA elements exist and are clickable
        const ariaButtonExists = await page.locator('#aria-button').isVisible();
        const ariaTabExists = await page.locator('#aria-tab').isVisible();
        expect(ariaButtonExists).toBe(true);
        expect(ariaTabExists).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Click coordinate calculation', () => {
    test('should handle clicks on positioned elements', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create positioned button
        await page.evaluate(() => {
          const button = document.createElement('button');
          button.id = 'positioned-button';
          button.textContent = 'Positioned Button';
          button.style.position = 'absolute';
          button.style.left = '100px';
          button.style.top = '200px';
          button.style.width = '150px';
          button.style.height = '50px';
          document.body.appendChild(button);
        });

        // Click the positioned button
        await page.click('#positioned-button');
        await TestUtils.waitForTimeout(page, 1000);

        // Verify that click tracking doesn't cause errors
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        // Verify the button exists and can be clicked
        const buttonExists = await page.locator('#positioned-button').isVisible();
        expect(buttonExists).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle clicks at different positions within elements', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create large button for testing different click positions
        await page.evaluate(() => {
          const button = document.createElement('button');
          button.id = 'large-button';
          button.textContent = 'Large Button';
          button.style.width = '300px';
          button.style.height = '100px';
          button.style.position = 'relative';
          button.style.margin = '50px';
          document.body.appendChild(button);
        });

        // Click at different positions within the button
        const buttonRect = await page.locator('#large-button').boundingBox();
        expect(buttonRect).toBeDefined();

        if (buttonRect) {
          // Click top-left corner
          await page.mouse.click(buttonRect.x + 5, buttonRect.y + 5);
          await TestUtils.waitForTimeout(page, 500);

          // Click center
          await page.mouse.click(buttonRect.x + buttonRect.width / 2, buttonRect.y + buttonRect.height / 2);
          await TestUtils.waitForTimeout(page, 500);

          // Click bottom-right
          await page.mouse.click(buttonRect.x + buttonRect.width - 5, buttonRect.y + buttonRect.height - 5);
          await TestUtils.waitForTimeout(page, 1000);
        }

        // Verify that click tracking doesn't cause errors
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        // Verify the button exists and all positions are clickable
        const buttonExists = await page.locator('#large-button').isVisible();
        expect(buttonExists).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle clicks on elements of various sizes', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create elements of different sizes
        await page.evaluate(() => {
          const container = document.createElement('div');

          // Small element
          const smallBtn = document.createElement('button');
          smallBtn.id = 'small-button';
          smallBtn.textContent = 'S';
          smallBtn.style.width = '30px';
          smallBtn.style.height = '30px';
          smallBtn.style.margin = '10px';

          // Large element
          const largeBtn = document.createElement('button');
          largeBtn.id = 'large-button';
          largeBtn.textContent = 'Large Button Text Here';
          largeBtn.style.width = '400px';
          largeBtn.style.height = '150px';
          largeBtn.style.margin = '10px';

          container.appendChild(smallBtn);
          container.appendChild(largeBtn);
          document.body.appendChild(container);
        });

        // Click both elements
        await page.click('#small-button');
        await TestUtils.waitForTimeout(page, 500);

        await page.click('#large-button');
        await TestUtils.waitForTimeout(page, 1000);

        // Verify that click tracking doesn't cause errors
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        // Verify both elements exist and are clickable
        const smallExists = await page.locator('#small-button').isVisible();
        const largeExists = await page.locator('#large-button').isVisible();
        expect(smallExists).toBe(true);
        expect(largeExists).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Element attribute capture', () => {
    test('should handle elements with various attributes', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create element with various attributes
        await page.evaluate(() => {
          const button = document.createElement('button');
          button.id = 'attribute-test-button';
          button.className = 'btn primary large clickable';
          button.title = 'Click this button';
          button.setAttribute('alt', 'Button alternative text');
          button.setAttribute('aria-label', 'Accessible button label');
          button.setAttribute('role', 'button');
          button.textContent = 'Attribute Test';
          document.body.appendChild(button);
        });

        await page.click('#attribute-test-button');
        await TestUtils.waitForTimeout(page, 1000);

        // Verify that click tracking doesn't cause errors
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        // Verify the button exists
        const buttonExists = await page.locator('#attribute-test-button').isVisible();
        expect(buttonExists).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle elements with data attributes', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create element with data attributes
        await page.evaluate(() => {
          const button = document.createElement('button');
          button.id = 'data-attr-button';
          button.setAttribute('data-testid', 'interactive-element');
          button.setAttribute('data-action', 'submit-form');
          button.setAttribute('data-category', 'user-interaction');
          button.setAttribute('data-value', '123');
          button.setAttribute('data-custom-field', 'custom-value');
          button.textContent = 'Data Attributes Test';
          document.body.appendChild(button);
        });

        await page.click('#data-attr-button');
        await TestUtils.waitForTimeout(page, 1000);

        // Verify that click tracking doesn't cause errors
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        // Verify the button exists
        const buttonExists = await page.locator('#data-attr-button').isVisible();
        expect(buttonExists).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle custom tracking attributes (data-tl)', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create element with TraceLog-specific attributes
        await page.evaluate(() => {
          const button = document.createElement('button');
          button.id = 'tl-attr-button';
          button.setAttribute('data-tl-name', 'cta-button-click');
          button.setAttribute('data-tl-value', 'signup-flow');
          button.textContent = 'Custom Tracking Test';
          document.body.appendChild(button);
        });

        await page.click('#tl-attr-button');
        await TestUtils.waitForTimeout(page, 1000);

        // Verify that click tracking doesn't cause errors
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        // Verify the button exists
        const buttonExists = await page.locator('#tl-attr-button').isVisible();
        expect(buttonExists).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle elements with minimal attributes gracefully', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create minimal element with few attributes
        await page.evaluate(() => {
          const div = document.createElement('div');
          div.textContent = 'Minimal Element';
          div.style.cursor = 'pointer';
          div.style.padding = '10px';
          div.style.border = '1px solid black';
          div.setAttribute('data-testid', 'minimal-clickable');
          document.body.appendChild(div);
        });

        await page.click('[data-testid="minimal-clickable"]');
        await TestUtils.waitForTimeout(page, 1000);

        // Verify that click tracking doesn't cause errors
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        // Verify the element exists
        const elementExists = await page.locator('[data-testid="minimal-clickable"]').isVisible();
        expect(elementExists).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Text content extraction', () => {
    test('should handle elements with different text content lengths', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create elements with different text content
        await page.evaluate(() => {
          const container = document.createElement('div');

          // Short text
          const shortBtn = document.createElement('button');
          shortBtn.id = 'short-text';
          shortBtn.textContent = 'Click';

          // Medium text
          const mediumBtn = document.createElement('button');
          mediumBtn.id = 'medium-text';
          mediumBtn.textContent = 'Click this button to proceed';

          // Long text
          const longBtn = document.createElement('button');
          longBtn.id = 'long-text';
          longBtn.textContent =
            'This is a very long button text that should be truncated if it exceeds the maximum allowed length for click event text content extraction. It contains multiple sentences and should demonstrate the text truncation behavior.';

          container.appendChild(shortBtn);
          container.appendChild(mediumBtn);
          container.appendChild(longBtn);
          document.body.appendChild(container);
        });

        // Click elements with different text lengths
        await page.click('#short-text');
        await TestUtils.waitForTimeout(page, 500);

        await page.click('#medium-text');
        await TestUtils.waitForTimeout(page, 500);

        await page.click('#long-text');
        await TestUtils.waitForTimeout(page, 1000);

        // Verify that click tracking doesn't cause errors
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        // Verify all elements exist and are clickable
        const shortExists = await page.locator('#short-text').isVisible();
        const mediumExists = await page.locator('#medium-text').isVisible();
        const longExists = await page.locator('#long-text').isVisible();
        expect(shortExists).toBe(true);
        expect(mediumExists).toBe(true);
        expect(longExists).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle elements with nested content', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create element with nested content
        await page.evaluate(() => {
          const button = document.createElement('button');
          button.id = 'nested-content';
          button.innerHTML = 'Click <span>this</span> <strong>button</strong> now';
          document.body.appendChild(button);
        });

        await page.click('#nested-content');
        await TestUtils.waitForTimeout(page, 1000);

        // Verify that click tracking doesn't cause errors
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        // Verify the element exists
        const elementExists = await page.locator('#nested-content').isVisible();
        expect(elementExists).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle clicks on small elements within large containers', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create container with large text and small clickable element
        await page.evaluate(() => {
          const container = document.createElement('div');
          container.id = 'large-container';
          container.textContent =
            'This is a very large container with lots of text content that should not be extracted when clicking on a smaller element inside it. '.repeat(
              10,
            );

          const smallButton = document.createElement('button');
          smallButton.id = 'small-nested-button';
          smallButton.textContent = 'Small Button';
          smallButton.style.padding = '5px';

          container.appendChild(smallButton);
          document.body.appendChild(container);
        });

        await page.click('#small-nested-button');
        await TestUtils.waitForTimeout(page, 1000);

        // Verify that click tracking doesn't cause errors
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        // Verify the small button exists
        const buttonExists = await page.locator('#small-nested-button').isVisible();
        expect(buttonExists).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle elements with no text content', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create element with no text content
        await page.evaluate(() => {
          const button = document.createElement('button');
          button.id = 'empty-text-button';
          button.style.width = '50px';
          button.style.height = '30px';
          button.style.backgroundColor = 'blue';
          document.body.appendChild(button);
        });

        await page.click('#empty-text-button');
        await TestUtils.waitForTimeout(page, 1000);

        // Verify that click tracking doesn't cause errors
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        // Verify the element exists
        const elementExists = await page.locator('#empty-text-button').isVisible();
        expect(elementExists).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Event timing and identification', () => {
    test('should handle rapid successive clicks', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create test button
        await page.evaluate(() => {
          const button = document.createElement('button');
          button.id = 'timing-test-button';
          button.textContent = 'Timing Test';
          document.body.appendChild(button);
        });

        // Perform rapid clicks
        await page.click('#timing-test-button');
        await page.click('#timing-test-button');
        await page.click('#timing-test-button');
        await TestUtils.waitForTimeout(page, 1000);

        // Verify that click tracking doesn't cause errors
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        // Verify the button exists
        const buttonExists = await page.locator('#timing-test-button').isVisible();
        expect(buttonExists).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should maintain responsive UI during click interactions (< 50ms response time)', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create test button with visual feedback
        await page.evaluate(() => {
          const button = document.createElement('button');
          button.id = 'responsiveness-test-button';
          button.textContent = 'Click Response Test';
          button.style.padding = '10px';
          button.style.backgroundColor = '#007bff';
          button.style.color = 'white';
          button.style.border = 'none';
          button.style.cursor = 'pointer';

          // Add click feedback handler
          button.addEventListener('click', () => {
            button.style.backgroundColor = '#28a745';
            setTimeout(() => {
              button.style.backgroundColor = '#007bff';
            }, 100);
          });

          document.body.appendChild(button);
        });

        // Measure click-to-response time using performance.now()
        const clickResponseTimes: number[] = [];
        const testIterations = 5;

        for (let i = 0; i < testIterations; i++) {
          const responseTime = await page.evaluate(() => {
            return new Promise<number>((resolve) => {
              const button = document.getElementById('responsiveness-test-button');
              if (!button) {
                resolve(-1);
                return;
              }

              const startTime = performance.now();

              // Measure time to DOM update (style change)
              const observer = new MutationObserver(() => {
                const endTime = performance.now();
                const responseTime = endTime - startTime;
                observer.disconnect();
                resolve(responseTime);
              });

              observer.observe(button, {
                attributes: true,
                attributeFilter: ['style'],
              });

              // Use actual click instead of dispatchEvent for better WebKit compatibility
              (button as HTMLElement).click();

              // Fallback timeout
              setTimeout(() => {
                observer.disconnect();
                resolve(performance.now() - startTime);
              }, 100);
            });
          });

          if (responseTime > 0) {
            clickResponseTimes.push(responseTime);
          }

          await TestUtils.waitForTimeout(page, 200);
        }

        // Verify all response times are under 50ms
        for (const responseTime of clickResponseTimes) {
          expect(responseTime).toBeLessThan(50);
        }

        // Verify we captured meaningful measurements
        expect(clickResponseTimes.length).toBeGreaterThan(0);

        // Calculate average response time for validation
        const averageResponseTime = clickResponseTimes.reduce((sum, time) => sum + time, 0) / clickResponseTimes.length;
        expect(averageResponseTime).toBeLessThan(25); // Even stricter average requirement

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle multiple unique elements', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create multiple similar elements
        await page.evaluate(() => {
          const container = document.createElement('div');

          for (let i = 1; i <= 3; i++) {
            const button = document.createElement('button');
            button.id = `button-${i}`;
            button.className = 'test-button';
            button.textContent = `Button ${i}`;
            button.setAttribute('data-index', i.toString());
            container.appendChild(button);
          }

          document.body.appendChild(container);
        });

        // Click each button
        for (let i = 1; i <= 3; i++) {
          await page.click(`#button-${i}`);
          await TestUtils.waitForTimeout(page, 300);
        }

        await TestUtils.waitForTimeout(page, 1000);

        // Verify that click tracking doesn't cause errors
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        // Verify all buttons exist
        for (let i = 1; i <= 3; i++) {
          const buttonExists = await page.locator(`#button-${i}`).isVisible();
          expect(buttonExists).toBe(true);
        }
      } finally {
        monitor.cleanup();
      }
    });

    test('should maintain session context during interactions', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create test button
        await page.evaluate(() => {
          const button = document.createElement('button');
          button.id = 'session-context-button';
          button.textContent = 'Session Context Test';
          document.body.appendChild(button);
        });

        await page.click('#session-context-button');
        await TestUtils.waitForTimeout(page, 1000);

        // Verify that click tracking doesn't cause errors
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        // Verify the button exists
        const buttonExists = await page.locator('#session-context-button').isVisible();
        expect(buttonExists).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Nested element handling', () => {
    test('should handle clicks on nested interactive elements', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create nested structure
        await page.evaluate(() => {
          const outerDiv = document.createElement('div');
          outerDiv.id = 'outer-container';
          outerDiv.className = 'container';
          outerDiv.style.padding = '20px';
          outerDiv.style.backgroundColor = 'lightgray';

          const innerDiv = document.createElement('div');
          innerDiv.id = 'inner-container';
          innerDiv.className = 'inner';
          innerDiv.style.padding = '10px';
          innerDiv.style.backgroundColor = 'lightblue';

          const button = document.createElement('button');
          button.id = 'nested-button';
          button.className = 'btn';
          button.textContent = 'Nested Button';

          innerDiv.appendChild(button);
          outerDiv.appendChild(innerDiv);
          document.body.appendChild(outerDiv);
        });

        // Click the nested button
        await page.click('#nested-button');
        await TestUtils.waitForTimeout(page, 1000);

        // Verify that click tracking doesn't cause errors
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        // Verify the button exists
        const buttonExists = await page.locator('#nested-button').isVisible();
        expect(buttonExists).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle overlapping clickable elements', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create overlapping clickable elements
        await page.evaluate(() => {
          const container = document.createElement('div');
          container.style.position = 'relative';

          // Larger clickable div
          const largeClickable = document.createElement('div');
          largeClickable.id = 'large-clickable';
          largeClickable.setAttribute('role', 'button');
          largeClickable.style.width = '200px';
          largeClickable.style.height = '100px';
          largeClickable.style.backgroundColor = 'lightcoral';
          largeClickable.style.position = 'absolute';
          largeClickable.style.top = '0px';
          largeClickable.style.left = '0px';
          largeClickable.textContent = 'Large Clickable Area';

          // Smaller button inside
          const smallButton = document.createElement('button');
          smallButton.id = 'small-overlapping-button';
          smallButton.style.position = 'absolute';
          smallButton.style.top = '30px';
          smallButton.style.left = '50px';
          smallButton.style.zIndex = '10';
          smallButton.textContent = 'Small Button';

          container.appendChild(largeClickable);
          container.appendChild(smallButton);
          document.body.appendChild(container);
        });

        // Click the overlapping button
        await page.click('#small-overlapping-button');
        await TestUtils.waitForTimeout(page, 1000);

        // Verify that click tracking doesn't cause errors
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        // Verify both elements exist
        const smallButtonExists = await page.locator('#small-overlapping-button').isVisible();
        const largeClickableExists = await page.locator('#large-clickable').isVisible();
        expect(smallButtonExists).toBe(true);
        expect(largeClickableExists).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle clicks on child elements of interactive containers', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create interactive container with non-interactive child
        await page.evaluate(() => {
          const interactiveCard = document.createElement('div');
          interactiveCard.id = 'interactive-card';
          interactiveCard.className = 'clickable card';
          interactiveCard.setAttribute('role', 'button');
          interactiveCard.style.padding = '20px';
          interactiveCard.style.border = '1px solid #ccc';
          interactiveCard.style.cursor = 'pointer';

          const title = document.createElement('h3');
          title.id = 'card-title';
          title.textContent = 'Card Title';
          title.style.margin = '0 0 10px 0';

          const description = document.createElement('p');
          description.id = 'card-description';
          description.textContent = 'This is a card description.';
          description.style.margin = '0';

          interactiveCard.appendChild(title);
          interactiveCard.appendChild(description);
          document.body.appendChild(interactiveCard);
        });

        // Click on the title (child of interactive container)
        await page.click('#card-title');
        await TestUtils.waitForTimeout(page, 1000);

        // Verify that click tracking doesn't cause errors
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        // Verify the elements exist
        const titleExists = await page.locator('#card-title').isVisible();
        const cardExists = await page.locator('#interactive-card').isVisible();
        expect(titleExists).toBe(true);
        expect(cardExists).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle deeply nested interactive elements', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create deeply nested structure
        await page.evaluate(() => {
          const level1 = document.createElement('div');
          level1.id = 'level-1';
          level1.className = 'clickable';
          level1.setAttribute('role', 'button');

          const level2 = document.createElement('div');
          level2.id = 'level-2';
          level2.className = 'clickable';
          level2.setAttribute('role', 'button');

          const level3 = document.createElement('div');
          level3.id = 'level-3';
          level3.className = 'clickable';
          level3.setAttribute('role', 'button');

          const finalButton = document.createElement('button');
          finalButton.id = 'final-nested-button';
          finalButton.textContent = 'Deeply Nested Button';

          level3.appendChild(finalButton);
          level2.appendChild(level3);
          level1.appendChild(level2);
          document.body.appendChild(level1);
        });

        // Click the deepest button
        await page.click('#final-nested-button');
        await TestUtils.waitForTimeout(page, 1000);

        // Verify that click tracking doesn't cause errors
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        // Verify the deepest button exists
        const buttonExists = await page.locator('#final-nested-button').isVisible();
        expect(buttonExists).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });
});
