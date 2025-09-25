import { Page, Locator } from '@playwright/test';
import { TraceLogTestPage } from '../fixtures/tracelog-fixtures';

/**
 * Page Object for TraceLog Playground interactions
 *
 * This class provides high-level methods for interacting with the
 * playground environment, including clicking elements, scrolling,
 * and triggering various user interactions.
 */
export class PlaygroundPage {
  private readonly traceLogPage: TraceLogTestPage;

  // Locators for common playground elements
  readonly addToCartButtons: Locator;
  readonly ctaViewProductsButton: Locator;
  readonly heroSection: Locator;
  readonly productsGrid: Locator;
  readonly featuresSection: Locator;
  readonly newsletterForm: Locator;

  constructor(traceLogPage: TraceLogTestPage) {
    this.traceLogPage = traceLogPage;
    const page = traceLogPage.page;

    // Initialize locators for playground elements
    this.addToCartButtons = page.locator('[data-testid^="add-cart-"]');
    this.ctaViewProductsButton = page.locator('[data-testid="cta-ver-productos"]');
    this.heroSection = page.locator('.hero');
    this.productsGrid = page.locator('.products-grid');
    this.featuresSection = page.locator('.features');
    this.newsletterForm = page.locator('#newsletter-form');
  }

  /**
   * Get underlying page instance
   */
  get page(): Page {
    return this.traceLogPage.page;
  }

  /**
   * Click "Add to Cart" button for specific product
   */
  async addProductToCart(productId: number): Promise<void> {
    const button = this.page.locator(`[data-testid="add-cart-${productId}"]`);
    await button.click();
  }

  /**
   * Click the main CTA "Ver Productos" button
   */
  async clickViewProducts(): Promise<void> {
    const browserName = this.page.context().browser()?.browserType().name();

    // Handle Safari-specific clicking issues
    if (browserName === 'webkit') {
      await this.ctaViewProductsButton.click({ force: true });
    } else {
      await this.ctaViewProductsButton.click();
    }
  }

  /**
   * Scroll to specific section of the page
   */
  async scrollToSection(section: 'hero' | 'products' | 'features' | 'bottom'): Promise<void> {
    switch (section) {
      case 'hero':
        await this.heroSection.scrollIntoViewIfNeeded();
        break;
      case 'products':
        await this.productsGrid.scrollIntoViewIfNeeded();
        break;
      case 'features':
        await this.featuresSection.scrollIntoViewIfNeeded();
        break;
      case 'bottom':
        await this.page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });
        break;
    }
  }

  /**
   * Scroll by percentage of page height
   */
  async scrollByPercentage(percentage: number): Promise<void> {
    await this.page.evaluate((pct) => {
      const scrollHeight = document.body.scrollHeight;
      const targetPosition = scrollHeight * (pct / 100);
      window.scrollTo(0, targetPosition);
    }, percentage);
  }

  /**
   * Perform smooth scrolling animation
   */
  async smoothScroll(fromPercentage: number, toPercentage: number, steps = 5): Promise<void> {
    const increment = (toPercentage - fromPercentage) / steps;

    for (let i = 0; i <= steps; i++) {
      const currentPercentage = fromPercentage + increment * i;
      await this.scrollByPercentage(currentPercentage);
      await this.page.waitForTimeout(100); // Small delay for smooth animation
    }
  }

  /**
   * Simulate realistic user journey through the page
   */
  async simulateUserJourney(): Promise<void> {
    // Start at top
    await this.scrollToSection('hero');
    await this.page.waitForTimeout(500);

    // Click CTA button
    await this.clickViewProducts();
    await this.page.waitForTimeout(300);

    // Browse products
    await this.scrollToSection('products');
    await this.page.waitForTimeout(800);

    // Add some products to cart
    await this.addProductToCart(1);
    await this.page.waitForTimeout(200);

    await this.addProductToCart(3);
    await this.page.waitForTimeout(200);

    // Scroll to features
    await this.scrollToSection('features');
    await this.page.waitForTimeout(600);

    // Scroll to bottom
    await this.scrollToSection('bottom');
    await this.page.waitForTimeout(400);
  }

  /**
   * Interact with specific product card
   */
  async interactWithProduct(productIndex: number, actions: ('hover' | 'click' | 'addToCart')[]): Promise<void> {
    const productCard = this.page.locator(`.product-card:nth-child(${productIndex})`);

    for (const action of actions) {
      switch (action) {
        case 'hover':
          await productCard.hover();
          await this.page.waitForTimeout(200);
          break;
        case 'click':
          await productCard.click();
          await this.page.waitForTimeout(300);
          break;
        case 'addToCart':
          await this.addProductToCart(productIndex);
          await this.page.waitForTimeout(200);
          break;
      }
    }
  }

  /**
   * Fill and submit newsletter form
   */
  async subscribeToNewsletter(email: string): Promise<void> {
    const emailInput = this.page.locator('#newsletter-email');
    const submitButton = this.page.locator('#newsletter-submit');

    await emailInput.fill(email);
    await submitButton.click();
  }

  /**
   * Simulate mobile-specific interactions
   */
  async performMobileInteractions(): Promise<void> {
    // Touch scroll
    await this.page.touchscreen.tap(200, 300);
    await this.scrollByPercentage(25);

    // Swipe gesture simulation
    await this.page.touchscreen.tap(200, 400);
    await this.page.waitForTimeout(100);

    // Tap products
    await this.addProductToCart(2);
  }

  /**
   * Test responsive behavior by changing viewport
   */
  async testResponsiveBehavior(): Promise<void> {
    const originalViewport = this.page.viewportSize();

    try {
      // Test mobile view
      await this.page.setViewportSize({ width: 375, height: 667 });
      await this.page.waitForTimeout(200);
      await this.performMobileInteractions();

      // Test tablet view
      await this.page.setViewportSize({ width: 768, height: 1024 });
      await this.page.waitForTimeout(200);
      await this.scrollByPercentage(50);

      // Test desktop view
      await this.page.setViewportSize({ width: 1920, height: 1080 });
      await this.page.waitForTimeout(200);
      await this.clickViewProducts();
    } finally {
      // Restore original viewport
      if (originalViewport) {
        await this.page.setViewportSize(originalViewport);
      }
    }
  }

  /**
   * Trigger custom events for testing
   */
  async triggerCustomTestEvents(): Promise<void> {
    await this.traceLogPage.sendCustomEvent('user_journey_started', {
      timestamp: Date.now(),
      page: 'playground',
    });

    await this.clickViewProducts();

    await this.traceLogPage.sendCustomEvent('cta_clicked', {
      buttonType: 'view_products',
      location: 'hero_section',
    });

    await this.addProductToCart(1);

    await this.traceLogPage.sendCustomEvent('product_interaction', {
      action: 'add_to_cart',
      productId: 1,
    });
  }

  /**
   * Generate realistic user activity patterns
   */
  async simulateActivityPattern(pattern: 'quick_browse' | 'detailed_exploration' | 'purchase_intent'): Promise<void> {
    switch (pattern) {
      case 'quick_browse':
        await this.scrollByPercentage(20);
        await this.page.waitForTimeout(300);
        await this.scrollByPercentage(60);
        await this.page.waitForTimeout(500);
        await this.scrollByPercentage(100);
        break;

      case 'detailed_exploration':
        await this.scrollToSection('hero');
        await this.page.waitForTimeout(1000);
        await this.clickViewProducts();
        await this.page.waitForTimeout(800);
        await this.interactWithProduct(1, ['hover', 'click']);
        await this.interactWithProduct(2, ['hover']);
        await this.scrollToSection('features');
        await this.page.waitForTimeout(1200);
        await this.scrollToSection('bottom');
        break;

      case 'purchase_intent':
        await this.clickViewProducts();
        await this.scrollToSection('products');
        await this.page.waitForTimeout(600);
        await this.addProductToCart(1);
        await this.page.waitForTimeout(300);
        await this.addProductToCart(3);
        await this.page.waitForTimeout(300);
        await this.addProductToCart(5);
        break;
    }
  }
}

export default PlaygroundPage;
