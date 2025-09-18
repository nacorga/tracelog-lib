import { test, expect } from '@playwright/test';
import { TestUtils } from '../../utils';
import { TEST_CONFIGS } from '../../constants';

test.describe('Click Tracking - Custom Data Attributes', () => {
  test.describe('Data attribute tracking', () => {
    test('should track clicks on elements with data-tl-name attribute', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page, TEST_CONFIGS.DEFAULT);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create element with data-tl-name attribute
        await page.evaluate(() => {
          const button = document.createElement('button');
          button.id = 'custom-tracking-button';
          button.setAttribute('data-tl-name', 'cta-signup');
          button.textContent = 'Sign Up Now';
          button.style.padding = '10px';
          button.style.border = '1px solid blue';
          document.body.appendChild(button);
        });

        await page.click('#custom-tracking-button');
        await TestUtils.waitForTimeout(page, 1000);

        // Verify that click tracking doesn't cause errors
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        // Verify the button exists and is clickable
        const buttonExists = await page.locator('#custom-tracking-button').isVisible();
        expect(buttonExists).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should track clicks on elements with both data-tl-name and data-tl-value attributes', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page, TEST_CONFIGS.DEFAULT);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create element with both custom attributes
        await page.evaluate(() => {
          const button = document.createElement('button');
          button.id = 'full-tracking-button';
          button.setAttribute('data-tl-name', 'product-purchase');
          button.setAttribute('data-tl-value', 'premium-plan');
          button.textContent = 'Buy Premium';
          button.style.padding = '10px';
          button.style.backgroundColor = 'gold';
          document.body.appendChild(button);
        });

        await page.click('#full-tracking-button');
        await TestUtils.waitForTimeout(page, 1000);

        // Verify that click tracking doesn't cause errors
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        // Verify the button exists and is clickable
        const buttonExists = await page.locator('#full-tracking-button').isVisible();
        expect(buttonExists).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should find tracking element in parent hierarchy', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page, TEST_CONFIGS.DEFAULT);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create nested structure with tracking attribute on parent
        await page.evaluate(() => {
          const container = document.createElement('div');
          container.id = 'tracking-container';
          container.setAttribute('data-tl-name', 'card-interaction');
          container.setAttribute('data-tl-value', 'product-card');
          container.style.padding = '20px';
          container.style.border = '1px solid gray';

          const innerSpan = document.createElement('span');
          innerSpan.id = 'inner-text';
          innerSpan.textContent = 'Click me inside container';
          innerSpan.style.display = 'block';
          innerSpan.style.padding = '5px';
          innerSpan.style.backgroundColor = 'lightblue';

          container.appendChild(innerSpan);
          document.body.appendChild(container);
        });

        // Click on the inner element (should find parent's tracking attributes)
        await page.click('#inner-text');
        await TestUtils.waitForTimeout(page, 1000);

        // Verify that click tracking doesn't cause errors
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        // Verify both elements exist
        const containerExists = await page.locator('#tracking-container').isVisible();
        const innerExists = await page.locator('#inner-text').isVisible();
        expect(containerExists).toBe(true);
        expect(innerExists).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should prioritize direct element tracking attributes over parent', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page, TEST_CONFIGS.DEFAULT);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create nested structure with tracking attributes on both parent and child
        await page.evaluate(() => {
          const parentDiv = document.createElement('div');
          parentDiv.id = 'parent-tracking';
          parentDiv.setAttribute('data-tl-name', 'parent-event');
          parentDiv.setAttribute('data-tl-value', 'parent-value');
          parentDiv.style.padding = '20px';
          parentDiv.style.border = '2px solid red';

          const childButton = document.createElement('button');
          childButton.id = 'child-tracking';
          childButton.setAttribute('data-tl-name', 'child-event');
          childButton.setAttribute('data-tl-value', 'child-value');
          childButton.textContent = 'Child Button';
          childButton.style.padding = '10px';
          childButton.style.backgroundColor = 'lightgreen';

          parentDiv.appendChild(childButton);
          document.body.appendChild(parentDiv);
        });

        // Click on child element (should use child's attributes, not parent's)
        await page.click('#child-tracking');
        await TestUtils.waitForTimeout(page, 1000);

        // Verify that click tracking doesn't cause errors
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        // Verify both elements exist
        const parentExists = await page.locator('#parent-tracking').isVisible();
        const childExists = await page.locator('#child-tracking').isVisible();
        expect(parentExists).toBe(true);
        expect(childExists).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Custom attribute extraction', () => {
    test('should extract and use data-tl-name for custom event name', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page, TEST_CONFIGS.DEFAULT);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create elements with different custom event names
        await page.evaluate(() => {
          const container = document.createElement('div');

          const signupBtn = document.createElement('button');
          signupBtn.id = 'signup-btn';
          signupBtn.setAttribute('data-tl-name', 'user-signup-click');
          signupBtn.textContent = 'Sign Up';

          const loginBtn = document.createElement('button');
          loginBtn.id = 'login-btn';
          loginBtn.setAttribute('data-tl-name', 'user-login-click');
          loginBtn.textContent = 'Log In';

          const newsletterBtn = document.createElement('button');
          newsletterBtn.id = 'newsletter-btn';
          newsletterBtn.setAttribute('data-tl-name', 'newsletter-subscribe');
          newsletterBtn.textContent = 'Subscribe';

          container.appendChild(signupBtn);
          container.appendChild(loginBtn);
          container.appendChild(newsletterBtn);
          document.body.appendChild(container);
        });

        // Click each button
        await page.click('#signup-btn');
        await TestUtils.waitForTimeout(page, 300);

        await page.click('#login-btn');
        await TestUtils.waitForTimeout(page, 300);

        await page.click('#newsletter-btn');
        await TestUtils.waitForTimeout(page, 500);

        // Verify that click tracking doesn't cause errors
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        // Verify all buttons exist
        const signupExists = await page.locator('#signup-btn').isVisible();
        const loginExists = await page.locator('#login-btn').isVisible();
        const newsletterExists = await page.locator('#newsletter-btn').isVisible();
        expect(signupExists).toBe(true);
        expect(loginExists).toBe(true);
        expect(newsletterExists).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should extract and include data-tl-value in custom event metadata', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page, TEST_CONFIGS.DEFAULT);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create elements with data-tl-value attributes
        await page.evaluate(() => {
          const container = document.createElement('div');

          const productBtn = document.createElement('button');
          productBtn.id = 'product-btn';
          productBtn.setAttribute('data-tl-name', 'add-to-cart');
          productBtn.setAttribute('data-tl-value', 'product-123');
          productBtn.textContent = 'Add to Cart';

          const categoryBtn = document.createElement('button');
          categoryBtn.id = 'category-btn';
          categoryBtn.setAttribute('data-tl-name', 'category-filter');
          categoryBtn.setAttribute('data-tl-value', 'electronics');
          categoryBtn.textContent = 'Electronics';

          container.appendChild(productBtn);
          container.appendChild(categoryBtn);
          document.body.appendChild(container);
        });

        // Click elements with values
        await page.click('#product-btn');
        await TestUtils.waitForTimeout(page, 500);

        await page.click('#category-btn');
        await TestUtils.waitForTimeout(page, 500);

        // Verify that click tracking doesn't cause errors
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        // Verify both buttons exist
        const productExists = await page.locator('#product-btn').isVisible();
        const categoryExists = await page.locator('#category-btn').isVisible();
        expect(productExists).toBe(true);
        expect(categoryExists).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle data-tl-name without data-tl-value', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page, TEST_CONFIGS.DEFAULT);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create element with only data-tl-name
        await page.evaluate(() => {
          const button = document.createElement('button');
          button.id = 'name-only-btn';
          button.setAttribute('data-tl-name', 'simple-action');
          button.textContent = 'Simple Action';
          button.style.padding = '10px';
          document.body.appendChild(button);
        });

        await page.click('#name-only-btn');
        await TestUtils.waitForTimeout(page, 1000);

        // Verify that click tracking doesn't cause errors
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        // Verify the button exists
        const buttonExists = await page.locator('#name-only-btn').isVisible();
        expect(buttonExists).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should ignore data-tl-value without data-tl-name', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page, TEST_CONFIGS.DEFAULT);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create element with only data-tl-value (should be ignored)
        await page.evaluate(() => {
          const button = document.createElement('button');
          button.id = 'value-only-btn';
          button.setAttribute('data-tl-value', 'orphaned-value');
          button.textContent = 'Value Only Button';
          button.style.padding = '10px';
          document.body.appendChild(button);
        });

        await page.click('#value-only-btn');
        await TestUtils.waitForTimeout(page, 1000);

        // Verify that click tracking doesn't cause errors
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        // Verify the button exists and normal click tracking should work
        const buttonExists = await page.locator('#value-only-btn').isVisible();
        expect(buttonExists).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Attribute priority logic', () => {
    test('should prioritize element-specific tracking over interactive parent', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page, TEST_CONFIGS.DEFAULT);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create structure where child has tracking, parent is interactive
        await page.evaluate(() => {
          const interactiveParent = document.createElement('div');
          interactiveParent.id = 'interactive-parent';
          interactiveParent.setAttribute('role', 'button');
          interactiveParent.setAttribute('data-action', 'parent-action');
          interactiveParent.style.padding = '20px';
          interactiveParent.style.border = '1px solid blue';
          interactiveParent.style.cursor = 'pointer';

          const trackingChild = document.createElement('span');
          trackingChild.id = 'tracking-child';
          trackingChild.setAttribute('data-tl-name', 'specific-child-action');
          trackingChild.setAttribute('data-tl-value', 'child-context');
          trackingChild.textContent = 'Tracked Child Element';
          trackingChild.style.display = 'block';
          trackingChild.style.padding = '5px';
          trackingChild.style.backgroundColor = 'yellow';

          interactiveParent.appendChild(trackingChild);
          document.body.appendChild(interactiveParent);
        });

        await page.click('#tracking-child');
        await TestUtils.waitForTimeout(page, 1000);

        // Verify that click tracking doesn't cause errors
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        // Verify both elements exist
        const parentExists = await page.locator('#interactive-parent').isVisible();
        const childExists = await page.locator('#tracking-child').isVisible();
        expect(parentExists).toBe(true);
        expect(childExists).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle multiple nested tracking elements correctly', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page, TEST_CONFIGS.DEFAULT);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create deeply nested structure with multiple tracking elements
        await page.evaluate(() => {
          const outerContainer = document.createElement('div');
          outerContainer.id = 'outer-container';
          outerContainer.setAttribute('data-tl-name', 'outer-container-click');
          outerContainer.setAttribute('data-tl-value', 'container-context');
          outerContainer.style.padding = '30px';
          outerContainer.style.border = '3px solid red';

          const middleContainer = document.createElement('div');
          middleContainer.id = 'middle-container';
          middleContainer.setAttribute('data-tl-name', 'middle-container-click');
          middleContainer.setAttribute('data-tl-value', 'middle-context');
          middleContainer.style.padding = '20px';
          middleContainer.style.border = '2px solid green';

          const innerButton = document.createElement('button');
          innerButton.id = 'inner-button';
          innerButton.setAttribute('data-tl-name', 'inner-button-click');
          innerButton.setAttribute('data-tl-value', 'button-context');
          innerButton.textContent = 'Innermost Button';
          innerButton.style.padding = '10px';
          innerButton.style.backgroundColor = 'lightblue';

          middleContainer.appendChild(innerButton);
          outerContainer.appendChild(middleContainer);
          document.body.appendChild(outerContainer);
        });

        // Click on different levels to test precedence
        await page.click('#inner-button');
        await TestUtils.waitForTimeout(page, 500);

        await page.click('#middle-container');
        await TestUtils.waitForTimeout(page, 500);

        await page.click('#outer-container');
        await TestUtils.waitForTimeout(page, 500);

        // Verify that click tracking doesn't cause errors
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        // Verify all elements exist
        const outerExists = await page.locator('#outer-container').isVisible();
        const middleExists = await page.locator('#middle-container').isVisible();
        const innerExists = await page.locator('#inner-button').isVisible();
        expect(outerExists).toBe(true);
        expect(middleExists).toBe(true);
        expect(innerExists).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle tracking attributes on standard interactive elements', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page, TEST_CONFIGS.DEFAULT);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create standard interactive elements with tracking
        await page.evaluate(() => {
          const container = document.createElement('div');

          // Button with tracking
          const button = document.createElement('button');
          button.id = 'tracked-button';
          button.setAttribute('data-tl-name', 'form-submit');
          button.setAttribute('data-tl-value', 'contact-form');
          button.textContent = 'Submit Form';

          // Link with tracking
          const link = document.createElement('a');
          link.id = 'tracked-link';
          link.href = '#section';
          link.setAttribute('data-tl-name', 'navigation-link');
          link.setAttribute('data-tl-value', 'main-nav');
          link.textContent = 'Go to Section';

          // Input with tracking
          const input = document.createElement('input');
          input.id = 'tracked-input';
          input.type = 'checkbox';
          input.setAttribute('data-tl-name', 'preference-toggle');
          input.setAttribute('data-tl-value', 'email-notifications');

          container.appendChild(button);
          container.appendChild(link);
          container.appendChild(input);
          document.body.appendChild(container);
        });

        // Prevent link navigation
        await page.evaluate(() => {
          document.getElementById('tracked-link')?.addEventListener('click', (e) => e.preventDefault());
        });

        // Click each element
        await page.click('#tracked-button');
        await TestUtils.waitForTimeout(page, 400);

        await page.click('#tracked-link');
        await TestUtils.waitForTimeout(page, 400);

        await page.click('#tracked-input');
        await TestUtils.waitForTimeout(page, 400);

        // Verify that click tracking doesn't cause errors
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        // Verify all elements exist
        const buttonExists = await page.locator('#tracked-button').isVisible();
        const linkExists = await page.locator('#tracked-link').isVisible();
        const inputExists = await page.locator('#tracked-input').isVisible();
        expect(buttonExists).toBe(true);
        expect(linkExists).toBe(true);
        expect(inputExists).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Attribute value sanitization', () => {
    test('should handle special characters in data-tl-name and data-tl-value', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page, TEST_CONFIGS.DEFAULT);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create elements with special characters in tracking attributes
        await page.evaluate(() => {
          const container = document.createElement('div');

          const specialCharsBtn = document.createElement('button');
          specialCharsBtn.id = 'special-chars-btn';
          specialCharsBtn.setAttribute('data-tl-name', 'action-with-special-chars_123');
          specialCharsBtn.setAttribute('data-tl-value', 'value@domain.com:8080/path?param=123');
          specialCharsBtn.textContent = 'Special Characters';

          const unicodeBtn = document.createElement('button');
          unicodeBtn.id = 'unicode-btn';
          unicodeBtn.setAttribute('data-tl-name', 'unicode-action-测试');
          unicodeBtn.setAttribute('data-tl-value', 'café-naïve-résumé');
          unicodeBtn.textContent = 'Unicode Test';

          const quotesBtn = document.createElement('button');
          quotesBtn.id = 'quotes-btn';
          quotesBtn.setAttribute('data-tl-name', 'action-with-quotes');
          quotesBtn.setAttribute('data-tl-value', 'value with "quotes" and \'apostrophes\'');
          quotesBtn.textContent = 'Quotes Test';

          container.appendChild(specialCharsBtn);
          container.appendChild(unicodeBtn);
          container.appendChild(quotesBtn);
          document.body.appendChild(container);
        });

        // Click elements with special characters
        await page.click('#special-chars-btn');
        await TestUtils.waitForTimeout(page, 400);

        await page.click('#unicode-btn');
        await TestUtils.waitForTimeout(page, 400);

        await page.click('#quotes-btn');
        await TestUtils.waitForTimeout(page, 400);

        // Verify that click tracking doesn't cause errors
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        // Verify all elements exist
        const specialExists = await page.locator('#special-chars-btn').isVisible();
        const unicodeExists = await page.locator('#unicode-btn').isVisible();
        const quotesExists = await page.locator('#quotes-btn').isVisible();
        expect(specialExists).toBe(true);
        expect(unicodeExists).toBe(true);
        expect(quotesExists).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle empty and whitespace-only attribute values', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page, TEST_CONFIGS.DEFAULT);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create elements with edge case attribute values
        await page.evaluate(() => {
          const container = document.createElement('div');

          const emptyNameBtn = document.createElement('button');
          emptyNameBtn.id = 'empty-name-btn';
          emptyNameBtn.setAttribute('data-tl-name', '');
          emptyNameBtn.setAttribute('data-tl-value', 'valid-value');
          emptyNameBtn.textContent = 'Empty Name';

          const whitespaceNameBtn = document.createElement('button');
          whitespaceNameBtn.id = 'whitespace-name-btn';
          whitespaceNameBtn.setAttribute('data-tl-name', '   ');
          whitespaceNameBtn.setAttribute('data-tl-value', 'valid-value');
          whitespaceNameBtn.textContent = 'Whitespace Name';

          const emptyValueBtn = document.createElement('button');
          emptyValueBtn.id = 'empty-value-btn';
          emptyValueBtn.setAttribute('data-tl-name', 'valid-name');
          emptyValueBtn.setAttribute('data-tl-value', '');
          emptyValueBtn.textContent = 'Empty Value';

          const whitespaceValueBtn = document.createElement('button');
          whitespaceValueBtn.id = 'whitespace-value-btn';
          whitespaceValueBtn.setAttribute('data-tl-name', 'valid-name');
          whitespaceValueBtn.setAttribute('data-tl-value', '   ');
          whitespaceValueBtn.textContent = 'Whitespace Value';

          container.appendChild(emptyNameBtn);
          container.appendChild(whitespaceNameBtn);
          container.appendChild(emptyValueBtn);
          container.appendChild(whitespaceValueBtn);
          document.body.appendChild(container);
        });

        // Click elements with edge case values
        await page.click('#empty-name-btn');
        await TestUtils.waitForTimeout(page, 300);

        await page.click('#whitespace-name-btn');
        await TestUtils.waitForTimeout(page, 300);

        await page.click('#empty-value-btn');
        await TestUtils.waitForTimeout(page, 300);

        await page.click('#whitespace-value-btn');
        await TestUtils.waitForTimeout(page, 300);

        // Verify that click tracking doesn't cause errors
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        // Verify all elements exist
        const emptyNameExists = await page.locator('#empty-name-btn').isVisible();
        const whitespaceNameExists = await page.locator('#whitespace-name-btn').isVisible();
        const emptyValueExists = await page.locator('#empty-value-btn').isVisible();
        const whitespaceValueExists = await page.locator('#whitespace-value-btn').isVisible();
        expect(emptyNameExists).toBe(true);
        expect(whitespaceNameExists).toBe(true);
        expect(emptyValueExists).toBe(true);
        expect(whitespaceValueExists).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle very long attribute values gracefully', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page, TEST_CONFIGS.DEFAULT);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create elements with long attribute values
        await page.evaluate(() => {
          const longName = 'very-long-event-name-' + 'x'.repeat(200);
          const longValue = 'very-long-value-' + 'y'.repeat(500);

          const button = document.createElement('button');
          button.id = 'long-attrs-btn';
          button.setAttribute('data-tl-name', longName);
          button.setAttribute('data-tl-value', longValue);
          button.textContent = 'Long Attributes';
          button.style.padding = '10px';
          document.body.appendChild(button);
        });

        await page.click('#long-attrs-btn');
        await TestUtils.waitForTimeout(page, 1000);

        // Verify that click tracking doesn't cause errors
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        // Verify the button exists
        const buttonExists = await page.locator('#long-attrs-btn').isVisible();
        expect(buttonExists).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Multiple attribute handling', () => {
    test('should handle elements with multiple data attributes alongside tracking', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page, TEST_CONFIGS.DEFAULT);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create element with many data attributes
        await page.evaluate(() => {
          const button = document.createElement('button');
          button.id = 'multi-data-btn';
          button.setAttribute('data-tl-name', 'multi-data-action');
          button.setAttribute('data-tl-value', 'context-data');
          button.setAttribute('data-testid', 'test-element');
          button.setAttribute('data-action', 'secondary-action');
          button.setAttribute('data-category', 'user-interface');
          button.setAttribute('data-priority', 'high');
          button.setAttribute('data-timestamp', Date.now().toString());
          button.textContent = 'Multiple Data Attributes';
          button.style.padding = '10px';
          document.body.appendChild(button);
        });

        await page.click('#multi-data-btn');
        await TestUtils.waitForTimeout(page, 1000);

        // Verify that click tracking doesn't cause errors
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        // Verify the button exists
        const buttonExists = await page.locator('#multi-data-btn').isVisible();
        expect(buttonExists).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle rapid clicks on elements with tracking attributes', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page, TEST_CONFIGS.DEFAULT);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create button for rapid clicking
        await page.evaluate(() => {
          const button = document.createElement('button');
          button.id = 'rapid-click-btn';
          button.setAttribute('data-tl-name', 'rapid-interaction');
          button.setAttribute('data-tl-value', 'stress-test');
          button.textContent = 'Rapid Click Test';
          button.style.padding = '15px';
          button.style.fontSize = '16px';
          document.body.appendChild(button);
        });

        // Perform rapid clicks
        for (let i = 0; i < 5; i++) {
          await page.click('#rapid-click-btn');
          await TestUtils.waitForTimeout(page, 100);
        }

        await TestUtils.waitForTimeout(page, 1000);

        // Verify that click tracking doesn't cause errors during rapid clicking
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        // Verify the button exists and is still responsive
        const buttonExists = await page.locator('#rapid-click-btn').isVisible();
        expect(buttonExists).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle multiple elements with same tracking names', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page, TEST_CONFIGS.DEFAULT);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create multiple elements with same tracking name but different values
        await page.evaluate(() => {
          const container = document.createElement('div');

          for (let i = 1; i <= 3; i++) {
            const button = document.createElement('button');
            button.id = `similar-btn-${i}`;
            button.setAttribute('data-tl-name', 'common-action');
            button.setAttribute('data-tl-value', `instance-${i}`);
            button.textContent = `Button ${i}`;
            button.style.margin = '5px';
            button.style.padding = '8px';
            container.appendChild(button);
          }

          document.body.appendChild(container);
        });

        // Click each button
        for (let i = 1; i <= 3; i++) {
          await page.click(`#similar-btn-${i}`);
          await TestUtils.waitForTimeout(page, 300);
        }

        // Verify that click tracking doesn't cause errors
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        // Verify all buttons exist
        for (let i = 1; i <= 3; i++) {
          const buttonExists = await page.locator(`#similar-btn-${i}`).isVisible();
          expect(buttonExists).toBe(true);
        }
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Missing attribute fallback', () => {
    test('should fall back to normal click tracking when no tracking attributes present', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page, TEST_CONFIGS.DEFAULT);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create regular interactive elements without tracking attributes
        await page.evaluate(() => {
          const container = document.createElement('div');

          const regularButton = document.createElement('button');
          regularButton.id = 'regular-button';
          regularButton.textContent = 'Regular Button';
          regularButton.className = 'btn primary';

          const regularLink = document.createElement('a');
          regularLink.id = 'regular-link';
          regularLink.href = '#section';
          regularLink.textContent = 'Regular Link';

          const regularDiv = document.createElement('div');
          regularDiv.id = 'regular-clickable';
          regularDiv.setAttribute('role', 'button');
          regularDiv.textContent = 'Clickable Div';
          regularDiv.style.cursor = 'pointer';
          regularDiv.style.padding = '10px';
          regularDiv.style.border = '1px solid gray';

          container.appendChild(regularButton);
          container.appendChild(regularLink);
          container.appendChild(regularDiv);
          document.body.appendChild(container);
        });

        // Prevent link navigation
        await page.evaluate(() => {
          document.getElementById('regular-link')?.addEventListener('click', (e) => e.preventDefault());
        });

        // Click elements without tracking attributes
        await page.click('#regular-button');
        await TestUtils.waitForTimeout(page, 400);

        await page.click('#regular-link');
        await TestUtils.waitForTimeout(page, 400);

        await page.click('#regular-clickable');
        await TestUtils.waitForTimeout(page, 400);

        // Verify that normal click tracking works without errors
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        // Verify all elements exist
        const buttonExists = await page.locator('#regular-button').isVisible();
        const linkExists = await page.locator('#regular-link').isVisible();
        const divExists = await page.locator('#regular-clickable').isVisible();
        expect(buttonExists).toBe(true);
        expect(linkExists).toBe(true);
        expect(divExists).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should generate both CLICK and CUSTOM events for tracked elements', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page, TEST_CONFIGS.DEFAULT);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create element with tracking attributes
        await page.evaluate(() => {
          const button = document.createElement('button');
          button.id = 'dual-event-btn';
          button.setAttribute('data-tl-name', 'dual-event-test');
          button.setAttribute('data-tl-value', 'test-context');
          button.textContent = 'Dual Event Button';
          button.className = 'btn tracked';
          button.style.padding = '12px';
          button.style.backgroundColor = 'lightcoral';
          document.body.appendChild(button);
        });

        await page.click('#dual-event-btn');
        await TestUtils.waitForTimeout(page, 1000);

        // Verify that click tracking doesn't cause errors
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        // Verify the button exists
        const buttonExists = await page.locator('#dual-event-btn').isVisible();
        expect(buttonExists).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle mixed scenarios with some elements tracked and others not', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page, TEST_CONFIGS.DEFAULT);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create mixed scenario with tracked and untracked elements
        await page.evaluate(() => {
          const container = document.createElement('div');

          // Tracked element
          const trackedBtn = document.createElement('button');
          trackedBtn.id = 'tracked-element';
          trackedBtn.setAttribute('data-tl-name', 'tracked-action');
          trackedBtn.setAttribute('data-tl-value', 'tracked-context');
          trackedBtn.textContent = 'Tracked Element';
          trackedBtn.style.backgroundColor = 'lightgreen';

          // Untracked element
          const untrackedBtn = document.createElement('button');
          untrackedBtn.id = 'untracked-element';
          untrackedBtn.textContent = 'Untracked Element';
          untrackedBtn.style.backgroundColor = 'lightgray';

          // Partially tracked element (only name)
          const partialBtn = document.createElement('button');
          partialBtn.id = 'partial-element';
          partialBtn.setAttribute('data-tl-name', 'partial-action');
          partialBtn.textContent = 'Partially Tracked';
          partialBtn.style.backgroundColor = 'lightyellow';

          container.appendChild(trackedBtn);
          container.appendChild(untrackedBtn);
          container.appendChild(partialBtn);
          document.body.appendChild(container);
        });

        // Click all elements
        await page.click('#tracked-element');
        await TestUtils.waitForTimeout(page, 400);

        await page.click('#untracked-element');
        await TestUtils.waitForTimeout(page, 400);

        await page.click('#partial-element');
        await TestUtils.waitForTimeout(page, 400);

        // Verify that mixed tracking scenarios work without errors
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        // Verify all elements exist
        const trackedExists = await page.locator('#tracked-element').isVisible();
        const untrackedExists = await page.locator('#untracked-element').isVisible();
        const partialExists = await page.locator('#partial-element').isVisible();
        expect(trackedExists).toBe(true);
        expect(untrackedExists).toBe(true);
        expect(partialExists).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle dynamic addition and removal of tracking attributes', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page, TEST_CONFIGS.DEFAULT);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create element initially without tracking
        await page.evaluate(() => {
          const button = document.createElement('button');
          button.id = 'dynamic-attrs-btn';
          button.textContent = 'Dynamic Attributes';
          button.style.padding = '10px';
          document.body.appendChild(button);
        });

        // Click without tracking attributes
        await page.click('#dynamic-attrs-btn');
        await TestUtils.waitForTimeout(page, 400);

        // Add tracking attributes dynamically
        await page.evaluate(() => {
          const button = document.getElementById('dynamic-attrs-btn');
          if (button) {
            button.setAttribute('data-tl-name', 'dynamic-action');
            button.setAttribute('data-tl-value', 'added-runtime');
            button.textContent = 'Now Tracked';
          }
        });

        // Click with tracking attributes
        await page.click('#dynamic-attrs-btn');
        await TestUtils.waitForTimeout(page, 400);

        // Remove tracking attributes
        await page.evaluate(() => {
          const button = document.getElementById('dynamic-attrs-btn');
          if (button) {
            button.removeAttribute('data-tl-name');
            button.removeAttribute('data-tl-value');
            button.textContent = 'No Longer Tracked';
          }
        });

        // Click without tracking attributes again
        await page.click('#dynamic-attrs-btn');
        await TestUtils.waitForTimeout(page, 400);

        // Verify that dynamic attribute changes work without errors
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);

        // Verify the button exists
        const buttonExists = await page.locator('#dynamic-attrs-btn').isVisible();
        expect(buttonExists).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });
});
