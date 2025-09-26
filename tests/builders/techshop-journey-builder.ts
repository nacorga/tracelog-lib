import { TraceLogTestPage } from '../fixtures/tracelog-fixtures';
import { TECHSHOP_DATA, TECHSHOP_HELPERS, TECHSHOP_SELECTORS } from '../config/test-config';

/**
 * TechShop Journey Builder - Realistic E2E User Flow Patterns
 *
 * Provides fluent interface for creating realistic TechShop user journeys
 * with proper event sequence validation and data integrity checking.
 * Based on the actual playground implementation.
 *
 * @example
 * ```typescript
 * const journey = TechShopJourney.create(traceLogPage);
 *
 * await journey
 *   .navigateToProducts()
 *   .addProductToCart("1")
 *   .expectCartCount(1)
 *   .navigateToContact()
 *   .fillContactForm(TECHSHOP_DATA.FORM_DATA.valid)
 *   .submitForm();
 *
 * const events = await journey.getEvents();
 * await expect(events).toHaveEventSequence(TECHSHOP_DATA.EXPECTED_SEQUENCES.PURCHASE_FLOW);
 * ```
 */
export class TechShopJourney {
  private events: any[] | null = null;

  private constructor(private readonly traceLogPage: TraceLogTestPage) {}

  /**
   * Create a new TechShop journey builder
   */
  static create(traceLogPage: TraceLogTestPage): TechShopJourney {
    return new TechShopJourney(traceLogPage);
  }

  // ===========================================
  // NAVIGATION METHODS
  // ===========================================

  /**
   * Navigate to a specific TechShop page by name with validation
   */
  async navigateToPage(pageName: string): Promise<TechShopJourney> {
    const page = TECHSHOP_HELPERS.getPage(pageName);

    await this.traceLogPage.clickElement(`[data-testid="${page.testId}"]`);

    // Use the new validation method
    await this.traceLogPage.waitForPageNavigation(pageName);

    return this;
  }

  /**
   * Navigate to products page using the main CTA
   */
  async navigateToProducts(): Promise<TechShopJourney> {
    await this.traceLogPage.clickElement(TECHSHOP_SELECTORS.CTAS.VIEW_PRODUCTS);

    // Use the new validation method
    await this.traceLogPage.waitForPageNavigation('productos');

    return this;
  }

  /**
   * Explore all main pages with natural delays
   */
  async exploreAllPages(delayBetween = 300): Promise<TechShopJourney> {
    const pages = ['productos', 'nosotros', 'contacto'];

    for (const pageName of pages) {
      await this.navigateToPage(pageName);
      await this.wait(delayBetween);
    }

    return this;
  }

  // ===========================================
  // E-COMMERCE METHODS
  // ===========================================

  /**
   * Add a specific product to cart with enhanced validation
   */
  async addProductToCart(productId: string): Promise<TechShopJourney> {
    const product = TECHSHOP_HELPERS.getProduct(productId);
    const buttonSelector = `[data-testid="${product.testId}"]`;

    // Validate current page state
    const currentState = await this.traceLogPage.validatePageState();

    // Ensure we're on the products page
    if (currentState.currentPage !== 'productos') {
      await this.navigateToProducts();
    }

    // Wait for the specific button to be visible and stable within the active page
    const activePageSelector = `#page-productos.active ${buttonSelector}`;
    await this.traceLogPage.page.waitForSelector(activePageSelector, {
      state: 'visible',
      timeout: 10000,
    });

    // Additional check that button is enabled and not disabled
    await this.traceLogPage.page.waitForFunction((selector) => {
      const button = document.querySelector(selector) as HTMLButtonElement;
      return button && !button.disabled && (button as HTMLElement).offsetParent !== null;
    }, activePageSelector);

    await this.traceLogPage.clickElement(activePageSelector);

    // Wait for visual feedback (button text change to "Añadido") with increased timeout
    await this.traceLogPage.page.waitForFunction(
      (selector) => {
        const button = document.querySelector(selector);
        return button?.textContent?.includes('Añadido') || false;
      },
      activePageSelector,
      { timeout: 8000 },
    ); // Increased timeout for stability

    return this;
  }

  /**
   * Add multiple products with realistic delays
   */
  async addMultipleProducts(productIds: string[], delay = 500): Promise<TechShopJourney> {
    for (const productId of productIds) {
      await this.addProductToCart(productId);
      await this.wait(delay);
    }

    return this;
  }

  /**
   * Expect cart counter to show specific count
   */
  async expectCartCount(expectedCount: number): Promise<TechShopJourney> {
    const actualCount = await this.traceLogPage.page.textContent(TECHSHOP_SELECTORS.PRODUCTS.CART_COUNTER);
    const count = parseInt(actualCount?.trim() || '0', 10);

    if (count !== expectedCount) {
      throw new Error(`Expected cart count ${expectedCount}, but got ${count}`);
    }

    return this;
  }

  // ===========================================
  // FORM INTERACTION METHODS
  // ===========================================

  /**
   * Fill the contact form with provided data and validation
   */
  async fillContactForm(formData: { name: string; email: string; message: string }): Promise<TechShopJourney> {
    // Validate current page state
    const currentState = await this.traceLogPage.validatePageState();

    // Ensure we're on the contact page
    if (currentState.currentPage !== 'contacto') {
      await this.navigateToPage('contacto');
    }

    // Fill form fields (using page.fill which is the standard Playwright method)
    await this.traceLogPage.page.fill(TECHSHOP_SELECTORS.CONTACT_FORM.NAME, formData.name);
    await this.traceLogPage.page.fill(TECHSHOP_SELECTORS.CONTACT_FORM.EMAIL, formData.email);
    await this.traceLogPage.page.fill(TECHSHOP_SELECTORS.CONTACT_FORM.MESSAGE, formData.message);

    return this;
  }

  /**
   * Submit the contact form and handle success dialog
   */
  async submitForm(): Promise<TechShopJourney> {
    // Handle the alert dialog that appears on successful form submission
    this.traceLogPage.page.on('dialog', (dialog) => dialog.accept());

    await this.traceLogPage.clickElement(TECHSHOP_SELECTORS.CONTACT_FORM.SUBMIT);

    // Wait for form to reset (indicates successful submission)
    await this.traceLogPage.page.waitForFunction(() => {
      const nameField = document.querySelector('[data-testid="form-name"]') as HTMLInputElement;
      return nameField?.value === '';
    });

    return this;
  }

  /**
   * Abandon form by filling partial data and navigating away
   */
  async abandonForm(partialData: { name: string; email: string; message: string }): Promise<TechShopJourney> {
    await this.fillContactForm(partialData);
    await this.navigateToPage('productos'); // Navigate away without submitting

    return this;
  }

  // ===========================================
  // BEHAVIOR SIMULATION METHODS
  // ===========================================

  /**
   * Simulate natural scrolling behavior
   */
  async simulateScrolling(steps = 3, delayBetween = 500): Promise<TechShopJourney> {
    const scrollHeight = await this.traceLogPage.page.evaluate(() =>
      Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
    );

    for (let step = 1; step <= steps; step++) {
      const scrollY = Math.floor((scrollHeight / steps) * step);
      await this.traceLogPage.page.evaluate((y) => window.scrollTo(0, y), scrollY);
      await this.wait(delayBetween);
    }

    return this;
  }

  /**
   * Simulate reading/viewing time
   */
  async simulateReading(readingTime = 1500): Promise<TechShopJourney> {
    await this.wait(readingTime);
    return this;
  }

  /**
   * Simulate user hesitation/decision time
   */
  async hesitate(hesitationTime = 1000): Promise<TechShopJourney> {
    await this.wait(hesitationTime);
    return this;
  }

  // ===========================================
  // COMPLEX USER JOURNEY FLOWS
  // ===========================================

  /**
   * Complete purchase journey: home → products → add to cart
   */
  async completePurchaseJourney(productIds: string[]): Promise<TechShopJourney> {
    await this.simulateReading(1500); // Read home page
    await this.navigateToProducts(); // Go to products
    await this.simulateScrolling(3, 800); // Browse products

    for (const productId of productIds) {
      await this.addProductToCart(productId);
      await this.wait(500); // Natural delay between purchases
    }

    return this;
  }

  /**
   * Information gathering flow: about → contact → form submission
   */
  async exploreCompanyInfo(formData = TECHSHOP_DATA.FORM_DATA.valid): Promise<TechShopJourney> {
    await this.navigateToPage('nosotros'); // About page
    await this.simulateScrolling(2, 600); // Read content
    await this.simulateReading(2000); // Spend time reading
    await this.navigateToPage('contacto'); // Contact page
    await this.fillContactForm(formData); // Fill form
    await this.submitForm(); // Submit

    return this;
  }

  /**
   * Window shopping flow: products → add item → browse → abandon
   */
  async simulateWindowShopping(): Promise<TechShopJourney> {
    await this.navigateToProducts(); // Browse products
    await this.simulateScrolling(4, 700); // Extensive browsing
    await this.addProductToCart('2'); // Add something
    await this.simulateReading(1000); // Consider purchase
    await this.navigateToPage('nosotros'); // Navigate away (abandon)

    return this;
  }

  // ===========================================
  // EVENT CAPTURE AND VALIDATION
  // ===========================================

  /**
   * Capture current events from TraceLog
   */
  async captureEvents(): Promise<TechShopJourney> {
    this.events = await this.traceLogPage.getTrackedEvents();
    return this;
  }

  /**
   * Get captured events (captures if not already done)
   */
  async getEvents(): Promise<any[]> {
    if (!this.events) {
      await this.captureEvents();
    }
    return this.events || [];
  }

  /**
   * Validate events match expected sequence
   */
  async validateEvents(expectedSequence: string[]): Promise<TechShopJourney> {
    const events = await this.getEvents();

    // Import matchers dynamically to avoid circular dependencies
    const { expect } = await import('@playwright/test');
    await import('../matchers/tracelog-matchers');

    await expect(events).toHaveEventSequence(expectedSequence);

    return this;
  }

  // ===========================================
  // UTILITY METHODS
  // ===========================================

  /**
   * Wait for specified time
   */
  async wait(ms: number): Promise<TechShopJourney> {
    await this.traceLogPage.page.waitForTimeout(ms);
    return this;
  }

  /**
   * Execute custom action with access to internal state
   */
  async customAction(
    action: (journey: TechShopJourney, traceLogPage: TraceLogTestPage) => Promise<void>,
  ): Promise<TechShopJourney> {
    await action(this, this.traceLogPage);
    return this;
  }

  /**
   * Get current page hash
   */
  async getCurrentPage(): Promise<string> {
    const hash = await this.traceLogPage.page.evaluate(() => window.location.hash);
    return hash.replace('#', '');
  }

  /**
   * Expect to be on specific page
   */
  async expectCurrentPage(expectedPage: string): Promise<TechShopJourney> {
    const currentPage = await this.getCurrentPage();
    if (currentPage !== expectedPage) {
      throw new Error(`Expected to be on page "${expectedPage}", but was on "${currentPage}"`);
    }
    return this;
  }
}

/**
 * Predefined TechShop Journey Patterns
 * Quick access to common realistic user flows
 */
export class TechShopJourneyPatterns {
  /**
   * Basic e-commerce flow: discover product → add to cart
   */
  static async basicPurchase(traceLogPage: TraceLogTestPage, productId = '1') {
    const journey = TechShopJourney.create(traceLogPage);
    await journey.navigateToProducts();
    await journey.addProductToCart(productId);
    await journey.expectCartCount(1);
    return journey;
  }

  /**
   * Multi-product shopping flow
   */
  static async multiProductShopping(traceLogPage: TraceLogTestPage, productIds = ['1', '2']) {
    const journey = TechShopJourney.create(traceLogPage);
    await journey.completePurchaseJourney(productIds);
    await journey.expectCartCount(productIds.length);
    return journey;
  }

  /**
   * Complete site exploration
   */
  static async fullSiteExploration(traceLogPage: TraceLogTestPage) {
    const journey = TechShopJourney.create(traceLogPage);
    await journey.exploreAllPages(300);
    await journey.simulateReading(1000);
    return journey;
  }

  /**
   * Contact form completion flow
   */
  static async contactInquiry(traceLogPage: TraceLogTestPage, formData = TECHSHOP_DATA.FORM_DATA.valid) {
    const journey = TechShopJourney.create(traceLogPage);
    await journey.exploreCompanyInfo(formData);
    return journey;
  }

  /**
   * Cart abandonment simulation
   */
  static async cartAbandonment(traceLogPage: TraceLogTestPage) {
    const journey = TechShopJourney.create(traceLogPage);
    await journey.simulateWindowShopping();
    return journey;
  }
}

export default TechShopJourney;
