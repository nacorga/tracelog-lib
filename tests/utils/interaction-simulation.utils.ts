import { Page, Locator } from '@playwright/test';
import { TIMEOUTS } from '../constants';

/**
 * User interaction simulation utilities for TraceLog E2E testing
 *
 * This module provides high-level utilities for simulating realistic user
 * interactions that are commonly tested in the TraceLog event tracking system.
 * All functions include proper waiting and error handling for reliable tests.
 *
 * @example
 * ```typescript
 * import { InteractionUtils } from '../utils';
 *
 * // Simulate click with custom data attributes
 * await InteractionUtils.clickElement(page, 'button[data-tl-name="test"]');
 *
 * // Simulate scroll with depth tracking
 * await InteractionUtils.scrollToDepth(page, 75);
 *
 * // Simulate navigation events
 * await InteractionUtils.simulatePageNavigation(page, '/new-page');
 * ```
 */

/**
 * Options for element interaction
 */
export interface ElementInteractionOptions {
  /** Maximum time to wait for element */
  timeout?: number;
  /** Whether to wait for element to be visible */
  waitForVisible?: boolean;
  /** Whether to scroll element into view */
  scrollIntoView?: boolean;
  /** Force interaction even if element is not actionable */
  force?: boolean;
  /** Custom position for click interactions */
  position?: { x: number; y: number };
}

/**
 * Options for scroll simulation
 */
export interface ScrollOptions {
  /** Scroll duration in milliseconds */
  duration?: number;
  /** Number of scroll steps for smooth scrolling */
  steps?: number;
  /** Whether to scroll smoothly or instantly */
  smooth?: boolean;
  /** CSS selector for scroll container (defaults to window) */
  container?: string;
}

/**
 * Options for navigation simulation
 */
export interface NavigationOptions {
  /** Whether to use history.pushState */
  usePushState?: boolean;
  /** Whether to use history.replaceState */
  useReplaceState?: boolean;
  /** Whether to trigger popstate event */
  triggerPopstate?: boolean;
  /** Whether to update hash only */
  hashOnly?: boolean;
  /** Wait time after navigation */
  waitAfter?: number;
}

/**
 * Options for form interaction
 */
export interface FormInteractionOptions {
  /** Whether to trigger input events */
  triggerEvents?: boolean;
  /** Delay between keystrokes in milliseconds */
  keystrokeDelay?: number;
  /** Whether to clear input before typing */
  clearFirst?: boolean;
  /** Whether to trigger blur after input */
  triggerBlur?: boolean;
}

/**
 * Options for touch/mobile simulation
 */
export interface TouchOptions {
  /** Number of touch points */
  touchPoints?: number;
  /** Touch duration in milliseconds */
  duration?: number;
  /** Touch pressure (0-1) */
  pressure?: number;
}

/**
 * Smart element interaction utilities
 */
export class ElementUtils {
  /**
   * Finds an element using multiple strategies (id, data attributes, text content)
   *
   * @param page - Playwright page instance
   * @param identifier - Element identifier (selector, text, or data attribute)
   * @param options - Search options
   * @returns Promise resolving to the located element
   */
  static async findElement(
    page: Page,
    identifier: string,
    options: { timeout?: number; strict?: boolean } = {},
  ): Promise<Locator> {
    const { timeout = TIMEOUTS.SHORT, strict = true } = options;

    // Strategy 1: Try as CSS selector
    try {
      const element = page.locator(identifier);
      await element.waitFor({ timeout: timeout / 3 });
      return element;
    } catch {
      // Continue to next strategy
    }

    // Strategy 2: Try as data-testid
    try {
      const element = page.locator(`[data-testid="${identifier}"]`);
      await element.waitFor({ timeout: timeout / 3 });
      return element;
    } catch {
      // Continue to next strategy
    }

    // Strategy 3: Try as text content
    try {
      const element = page.getByText(identifier, { exact: false });
      await element.waitFor({ timeout: timeout / 3 });
      return element;
    } catch {
      // All strategies failed
    }

    if (strict) {
      throw new Error(`Element not found using identifier: ${identifier}`);
    }

    // Return the first selector attempt for non-strict mode
    return page.locator(identifier);
  }

  /**
   * Clicks an element with enhanced error handling and waiting
   */
  static async clickElement(page: Page, identifier: string, options: ElementInteractionOptions = {}): Promise<void> {
    const {
      timeout = TIMEOUTS.MEDIUM,
      waitForVisible = true,
      scrollIntoView = true,
      force = false,
      position,
    } = options;

    const element = await this.findElement(page, identifier, { timeout });

    if (waitForVisible) {
      await element.waitFor({ state: 'visible', timeout });
    }

    if (scrollIntoView) {
      await element.scrollIntoViewIfNeeded({ timeout });
    }

    const clickOptions: Parameters<Locator['click']>[0] = {
      timeout,
      force,
      ...(position && { position }),
    };

    await element.click(clickOptions);
  }

  /**
   * Clicks an element with custom TraceLog data attributes
   */
  static async clickWithCustomData(
    page: Page,
    identifier: string,
    customName: string,
    customValue?: string,
    options: ElementInteractionOptions = {},
  ): Promise<void> {
    const element = await this.findElement(page, identifier, options);

    // Set custom data attributes
    await element.evaluate(
      (el, { name, value }) => {
        el.setAttribute('data-tl-name', name);
        if (value) {
          el.setAttribute('data-tl-value', value);
        }
      },
      { name: customName, value: customValue },
    );

    await this.clickElement(page, identifier, options);
  }

  /**
   * Extracts text content from clicked elements for testing
   */
  static async getElementTextContent(page: Page, identifier: string): Promise<string> {
    const element = await this.findElement(page, identifier);
    const textContent = await element.textContent();
    return textContent?.trim() ?? '';
  }

  /**
   * Gets element position and coordinates for testing
   */
  static async getElementCoordinates(
    page: Page,
    identifier: string,
  ): Promise<{ x: number; y: number; width: number; height: number }> {
    const element = await this.findElement(page, identifier);
    const boundingBox = await element.boundingBox();

    if (!boundingBox) {
      throw new Error(`Element ${identifier} has no bounding box`);
    }

    return {
      x: boundingBox.x + boundingBox.width / 2,
      y: boundingBox.y + boundingBox.height / 2,
      width: boundingBox.width,
      height: boundingBox.height,
    };
  }
}

/**
 * Scroll simulation utilities
 */
export class ScrollUtils {
  /**
   * Scrolls to a specific depth percentage of the page
   */
  static async scrollToDepth(page: Page, depthPercentage: number, options: ScrollOptions = {}): Promise<void> {
    const { duration = 500, steps = 10, smooth = true, container } = options;

    if (depthPercentage < 0 || depthPercentage > 100) {
      throw new Error('Depth percentage must be between 0 and 100');
    }

    await page.evaluate(
      ({ depth, duration, steps, smooth, container }) => {
        const scrollTarget = container ? document.querySelector(container) : window;
        if (!scrollTarget) {
          throw new Error(`Scroll container not found: ${container}`);
        }

        const scrollHeight =
          scrollTarget === window
            ? document.documentElement.scrollHeight - window.innerHeight
            : (scrollTarget as Element).scrollHeight - (scrollTarget as Element).clientHeight;

        const targetPosition = (scrollHeight * depth) / 100;

        if (!smooth) {
          if (scrollTarget === window) {
            window.scrollTo(0, targetPosition);
          } else {
            (scrollTarget as Element).scrollTop = targetPosition;
          }
          return;
        }

        // Smooth scrolling implementation
        const startPosition = scrollTarget === window ? window.scrollY : (scrollTarget as Element).scrollTop;
        const distance = targetPosition - startPosition;
        const stepDistance = distance / steps;
        const stepDuration = duration / steps;

        let currentStep = 0;

        const scroll = (): void => {
          if (currentStep < steps) {
            const newPosition = startPosition + stepDistance * currentStep;
            if (scrollTarget === window) {
              window.scrollTo(0, newPosition);
            } else {
              (scrollTarget as Element).scrollTop = newPosition;
            }
            currentStep++;
            setTimeout(scroll, stepDuration);
          }
        };

        scroll();
      },
      { depth: depthPercentage, duration, steps, smooth, container },
    );

    // Wait for scroll to complete
    await page.waitForTimeout(duration + 100);
  }

  /**
   * Performs multiple scroll actions to test scroll tracking
   */
  static async performScrollSequence(
    page: Page,
    depths: number[],
    options: ScrollOptions & { delayBetween?: number } = {},
  ): Promise<void> {
    const { delayBetween = 500 } = options;

    for (let i = 0; i < depths.length; i++) {
      await this.scrollToDepth(page, depths[i], options);
      if (i < depths.length - 1) {
        await page.waitForTimeout(delayBetween);
      }
    }
  }

  /**
   * Scrolls within a custom container element
   */
  static async scrollInContainer(
    page: Page,
    containerSelector: string,
    scrollAmount: number,
    options: { direction?: 'up' | 'down'; smooth?: boolean } = {},
  ): Promise<void> {
    const { direction = 'down', smooth = true } = options;
    const scrollValue = direction === 'up' ? -Math.abs(scrollAmount) : Math.abs(scrollAmount);

    await page.evaluate(
      ({ selector, amount, smooth }) => {
        const container = document.querySelector(selector);
        if (!container) {
          throw new Error(`Container not found: ${selector}`);
        }

        if (smooth) {
          container.scrollBy({ top: amount, behavior: 'smooth' });
        } else {
          container.scrollTop += amount;
        }
      },
      { selector: containerSelector, amount: scrollValue, smooth },
    );

    await page.waitForTimeout(300);
  }
}

/**
 * Page navigation simulation utilities
 */
export class NavigationUtils {
  /**
   * Simulates various types of page navigation for testing page view events
   */
  static async simulatePageNavigation(
    page: Page,
    url: string,
    options: NavigationOptions = {},
  ): Promise<{ fromUrl: string; toUrl: string }> {
    const {
      usePushState = false,
      useReplaceState = false,
      triggerPopstate = false,
      hashOnly = false,
      waitAfter = 100,
    } = options;

    const fromUrl = await page.url();

    if (hashOnly) {
      // Hash-only navigation
      await page.evaluate((newUrl) => {
        window.location.hash = newUrl.startsWith('#') ? newUrl.slice(1) : newUrl;
      }, url);
    } else if (usePushState) {
      // History API pushState navigation
      await page.evaluate((newUrl) => {
        window.history.pushState({}, '', newUrl);
        window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
      }, url);
    } else if (useReplaceState) {
      // History API replaceState navigation
      await page.evaluate((newUrl) => {
        window.history.replaceState({}, '', newUrl);
        window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
      }, url);
    } else if (triggerPopstate) {
      // Manual popstate event
      await page.evaluate(() => {
        window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
      });
    } else {
      // Standard navigation
      await page.goto(url, { waitUntil: 'domcontentloaded' });
    }

    if (waitAfter > 0) {
      await page.waitForTimeout(waitAfter);
    }

    const toUrl = await page.url();
    return { fromUrl, toUrl };
  }

  /**
   * Simulates browser back/forward navigation
   */
  static async simulateHistoryNavigation(page: Page, direction: 'back' | 'forward', steps = 1): Promise<void> {
    await page.evaluate(
      ({ direction, steps }) => {
        if (direction === 'back') {
          window.history.go(-steps);
        } else {
          window.history.go(steps);
        }
      },
      { direction, steps },
    );

    await page.waitForTimeout(200);
  }
}

/**
 * Form interaction utilities
 */
export class FormUtils {
  /**
   * Types text into an input with realistic keystroke simulation
   */
  static async typeInInput(
    page: Page,
    inputSelector: string,
    text: string,
    options: FormInteractionOptions = {},
  ): Promise<void> {
    const { triggerEvents = true, keystrokeDelay = 50, clearFirst = true, triggerBlur = false } = options;

    const input = await ElementUtils.findElement(page, inputSelector);

    if (clearFirst) {
      await input.clear();
    }

    if (triggerEvents) {
      await input.focus();
      await input.pressSequentially(text, { delay: keystrokeDelay });
    } else {
      await input.fill(text);
    }

    if (triggerBlur) {
      await input.blur();
    }
  }

  /**
   * Interacts with form elements and triggers various events
   */
  static async interactWithForm(
    page: Page,
    formSelector: string,
    interactions: Array<{
      selector: string;
      action: 'type' | 'click' | 'select';
      value?: string;
      options?: FormInteractionOptions;
    }>,
  ): Promise<void> {
    const form = await ElementUtils.findElement(page, formSelector);
    await form.waitFor({ state: 'visible' });

    for (const interaction of interactions) {
      const element = await ElementUtils.findElement(page, interaction.selector);

      switch (interaction.action) {
        case 'type':
          if (interaction.value) {
            await this.typeInInput(page, interaction.selector, interaction.value, interaction.options);
          }
          break;
        case 'click':
          await ElementUtils.clickElement(page, interaction.selector);
          break;
        case 'select':
          if (interaction.value) {
            await element.selectOption(interaction.value);
          }
          break;
      }

      await page.waitForTimeout(100);
    }
  }
}

/**
 * Touch and mobile interaction utilities
 */
export class TouchUtils {
  /**
   * Simulates touch interactions for mobile testing
   */
  static async simulateTouch(
    page: Page,
    element: string,
    action: 'tap' | 'longpress' | 'swipe',
    options: TouchOptions & { direction?: 'up' | 'down' | 'left' | 'right'; distance?: number } = {},
  ): Promise<void> {
    const { duration = 200, direction = 'right', distance = 100 } = options;

    const locator = await ElementUtils.findElement(page, element);
    const boundingBox = await locator.boundingBox();

    if (!boundingBox) {
      throw new Error(`Element ${element} has no bounding box for touch interaction`);
    }

    const centerX = boundingBox.x + boundingBox.width / 2;
    const centerY = boundingBox.y + boundingBox.height / 2;

    switch (action) {
      case 'tap':
        await page.touchscreen.tap(centerX, centerY);
        break;

      case 'longpress':
        await page.touchscreen.tap(centerX, centerY);
        await page.waitForTimeout(duration);
        break;

      case 'swipe': {
        let endX = centerX;
        let endY = centerY;

        switch (direction) {
          case 'up':
            endY -= distance;
            break;
          case 'down':
            endY += distance;
            break;
          case 'left':
            endX -= distance;
            break;
          case 'right':
            endX += distance;
            break;
        }

        await page.touchscreen.tap(centerX, centerY);
        await page.mouse.move(endX, endY);
        await page.touchscreen.tap(endX, endY);
        break;
      }
    }

    await page.waitForTimeout(100);
  }

  /**
   * Simulates pinch zoom gesture
   */
  static async simulatePinchZoom(
    page: Page,
    element: string,
    _scale: number,
    options: { duration?: number } = {},
  ): Promise<void> {
    const { duration = 500 } = options;

    await page.evaluate(
      ({ selector, duration }) => {
        const el = document.querySelector(selector);
        if (!el) {
          throw new Error(`Element not found: ${selector}`);
        }

        // Simulate touch events for pinch zoom
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const touchStart = new TouchEvent('touchstart', {
          touches: [
            new Touch({
              identifier: 0,
              target: el,
              clientX: centerX - 50,
              clientY: centerY,
            }),
            new Touch({
              identifier: 1,
              target: el,
              clientX: centerX + 50,
              clientY: centerY,
            }),
          ],
        });

        const touchEnd = new TouchEvent('touchend', {
          touches: [],
        });

        el.dispatchEvent(touchStart);

        setTimeout(() => {
          el.dispatchEvent(touchEnd);
        }, duration);
      },
      { selector: element, duration },
    );

    await page.waitForTimeout(duration + 100);
  }
}

/**
 * Combined interaction utilities namespace
 */
export const InteractionUtils = {
  // Element utilities
  findElement: ElementUtils.findElement,
  clickElement: ElementUtils.clickElement,
  clickWithCustomData: ElementUtils.clickWithCustomData,
  getElementTextContent: ElementUtils.getElementTextContent,
  getElementCoordinates: ElementUtils.getElementCoordinates,

  // Scroll utilities
  scrollToDepth: ScrollUtils.scrollToDepth,
  performScrollSequence: ScrollUtils.performScrollSequence,
  scrollInContainer: ScrollUtils.scrollInContainer,

  // Navigation utilities
  simulatePageNavigation: NavigationUtils.simulatePageNavigation,
  simulateHistoryNavigation: NavigationUtils.simulateHistoryNavigation,

  // Form utilities
  typeInInput: FormUtils.typeInInput,
  interactWithForm: FormUtils.interactWithForm,

  // Touch utilities
  simulateTouch: TouchUtils.simulateTouch,
  simulatePinchZoom: TouchUtils.simulatePinchZoom,
} as const;
