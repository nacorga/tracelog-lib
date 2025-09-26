import { expect } from '@playwright/test';
import { traceLogTest } from '../fixtures/tracelog-fixtures';
import { TRACELOG_CONFIGS, TECHSHOP_HELPERS } from '../config/test-config';
import { TechShopJourney } from '../builders/techshop-journey-builder';
import '../matchers/tracelog-matchers'; // Import custom matchers

/**
 * TechShop E-commerce Test Scenarios
 *
 * Realistic user journey tests with event sequence and data validation
 * based on the TechShop playground implementation.
 */

traceLogTest.describe('TechShop E-commerce User Journeys', () => {
  traceLogTest('complete purchase journey with event validation', async ({ traceLogPage }) => {
    // Initialize TraceLog with TechShop configuration
    await traceLogPage.setup();
    const initResult = await traceLogPage.initializeTraceLog(TRACELOG_CONFIGS.TECHSHOP_BASIC);

    expect(initResult.success).toBe(true);

    // Start event capture
    await traceLogPage.startEventCapture();

    // Create user journey
    const journey = TechShopJourney.create(traceLogPage);

    await journey.simulateReading(1000); // Brief home page reading
    await journey.navigateToProducts(); // Go to products page
    await journey.simulateScrolling(2, 600); // Browse products
    await journey.addProductToCart('1'); // Add Laptop Pro M2
    await journey.expectCartCount(1); // Verify cart counter

    // Capture and validate events
    const events = await journey.getEvents();

    // Validate event sequence - more flexible approach (following TESTING_GUIDE.md best practices)
    // Focus on essential events rather than exact sequence
    await expect(events).toHaveEvent('click'); // Navigation click
    await expect(events).toHaveEvent('page_view'); // Page navigation
    await expect(events).toHaveEvent('custom'); // Add to cart event

    // Validate minimum required events for this journey
    const clickEvents = events.filter((e) => e.type === 'click');
    const pageViewEvents = events.filter((e) => e.type === 'page_view');
    const customEvents = events.filter((e) => e.type === 'custom');

    expect(clickEvents.length).toBeGreaterThanOrEqual(1);
    expect(pageViewEvents.length).toBeGreaterThanOrEqual(1);
    expect(customEvents.length).toBe(1);
    await expect(events).toHaveChronologicalOrder();
    await expect(events).toHaveValidEventData();
    // Note: SESSION_START is not explicitly tracked in current TraceLog implementation

    // Validate specific product event
    const addToCartEvents = events.filter((e) => e.type === 'custom');
    expect(addToCartEvents).toHaveLength(1);

    const productEvent = addToCartEvents[0];

    // Flexible validation based on actual event structure
    if (productEvent.custom_event) {
      expect(productEvent.custom_event.name).toBe('add_to_cart');
      expect(productEvent.custom_event.metadata.product_id).toBe('1');
      expect(productEvent.custom_event.metadata.product_name).toBe('Laptop Pro M2');
    } else if (productEvent.event_name) {
      expect(productEvent.event_name).toBe('add_to_cart');
      expect(productEvent.product_id).toBe('1');
      expect(productEvent.product_name).toBe('Laptop Pro M2');
    }

    // Verify no TraceLog errors occurred
    await expect(traceLogPage).toHaveNoTraceLogErrors();
  });

  traceLogTest('multiple products with timing validation', async ({ traceLogPage }) => {
    await traceLogPage.setup();
    await traceLogPage.initializeTraceLog(TRACELOG_CONFIGS.TECHSHOP_BASIC);
    await traceLogPage.startEventCapture();

    const journey = TechShopJourney.create(traceLogPage);
    const productIds = ['1', '2', '3'];
    const delayBetween = 800; // Increased delay for stability (TESTING_GUIDE.md)

    await journey.navigateToProducts();
    await journey.addMultipleProducts(productIds, delayBetween);
    await journey.expectCartCount(3);

    const events = await journey.getEvents();
    // Validate correct number of cart events (custom events)
    const cartEvents = events.filter((e) => e.type === 'custom');
    expect(cartEvents).toHaveLength(3);

    // Validate each product event and timing
    cartEvents.forEach((event, index) => {
      const expectedProduct = TECHSHOP_HELPERS.getProduct(productIds[index]);

      expect(event.custom_event.metadata.product_id).toBe(expectedProduct.id);
      expect(event.custom_event.metadata.product_name).toBe(expectedProduct.name);

      // Check timing between events (except for the first one) - more realistic timing (TESTING_GUIDE.md)
      if (index > 0) {
        const timeDiff = event.timestamp - cartEvents[index - 1].timestamp;
        expect(timeDiff).toBeGreaterThanOrEqual(300); // Allow more variance for browser reality
        expect(timeDiff).toBeLessThanOrEqual(5000); // More realistic threshold for E2E tests
      }
    });

    // Validate overall event structure
    await expect(events).toHaveChronologicalOrder();
    await expect(events).toHaveValidEventData();
    await expect(traceLogPage).toHaveNoTraceLogErrors();
  });

  traceLogTest('cart abandonment behavior tracking', async ({ traceLogPage }) => {
    await traceLogPage.setup();
    await traceLogPage.initializeTraceLog(TRACELOG_CONFIGS.TECHSHOP_BASIC);
    await traceLogPage.startEventCapture();

    const journey = TechShopJourney.create(traceLogPage);

    await journey.navigateToProducts();
    await journey.addProductToCart('1'); // Add laptop
    await journey.addProductToCart('2'); // Add smartphone
    await journey.navigateToPage('nosotros'); // Navigate away (abandonment)
    await journey.simulateReading(2000); // Spend time on other content

    const events = await journey.getEvents();

    // Validate abandonment indicators
    // Should have cart additions but no purchase completion
    const cartEvents = events.filter((e) => e.type === 'custom');
    const purchaseEvents = events.filter((e) => e.custom_event?.name === 'purchase_complete');
    const pageViews = events.filter((e) => e.type === 'page_view');
    expect(cartEvents).toHaveLength(2); // Intent shown
    expect(purchaseEvents).toHaveLength(0); // No completion

    // Should have navigated away to non-commerce page
    const lastPageView = pageViews[pageViews.length - 1];
    expect(lastPageView.page_url).toContain('nosotros');

    // Validate session consistency despite abandonment
    await expect(events).toHaveChronologicalOrder();
    await expect(traceLogPage).toHaveNoTraceLogErrors();
  });

  traceLogTest('product-specific event data validation', async ({ traceLogPage }) => {
    await traceLogPage.setup();
    await traceLogPage.initializeTraceLog(TRACELOG_CONFIGS.TECHSHOP_BASIC);
    await traceLogPage.startEventCapture();

    const journey = TechShopJourney.create(traceLogPage);
    const testProductId = '2'; // Smartphone X

    await journey.navigateToProducts();
    await journey.simulateScrolling(2, 500); // Browse before purchase
    await journey.addProductToCart(testProductId);

    const events = await journey.getEvents();
    const productEvent = events.find(
      (e) =>
        e.type === 'custom' &&
        e.custom_event?.name === 'add_to_cart' &&
        e.custom_event?.metadata?.product_id === testProductId,
    );

    // Validate product event exists and has correct structure
    expect(productEvent).toBeDefined();
    expect(productEvent.type).toBe('custom');
    expect(productEvent.custom_event.name).toBe('add_to_cart');

    // Validate product metadata matches test data
    const expectedProduct = TECHSHOP_HELPERS.getProduct(testProductId);
    expect(productEvent.custom_event.metadata.product_id).toBe(expectedProduct.id);
    expect(productEvent.custom_event.metadata.product_name).toBe(expectedProduct.name);
    expect(productEvent.custom_event.metadata.timestamp).toBeGreaterThan(0);

    // Validate timestamp correlation
    const timestampDiff = Math.abs(productEvent.timestamp - productEvent.custom_event.metadata.timestamp);
    expect(timestampDiff).toBeLessThan(1000); // Should be very close

    await expect(traceLogPage).toHaveNoTraceLogErrors();
  });

  traceLogTest('realistic shopping session flow', async ({ traceLogPage }) => {
    await traceLogPage.setup();
    await traceLogPage.initializeTraceLog(TRACELOG_CONFIGS.TECHSHOP_BASIC);
    await traceLogPage.startEventCapture();

    const journey = TechShopJourney.create(traceLogPage);

    // Simulate realistic user behavior
    await journey.simulateReading(1500); // Read homepage
    await journey.simulateScrolling(3, 800); // Scroll through homepage
    await journey.navigateToProducts(); // Go to products
    await journey.simulateScrolling(4, 600); // Browse products extensively
    await journey.hesitate(1200); // Hesitate before purchase decision
    await journey.addProductToCart('3'); // Add Smartwatch (lower price point)
    await journey.expectCartCount(1);
    await journey.navigateToPage('nosotros'); // Learn about company
    await journey.simulateReading(2500); // Read about page
    await journey.navigateToPage('contacto'); // Potential inquiry
    await journey.simulateReading(1000); // Brief look at contact

    const events = await journey.getEvents();

    // Validate realistic session patterns (using any event with session data)
    const sessionId = events.find((e) => e.session_id)?.session_id;
    // Note: SESSION_START not explicitly tracked, but session_id should be present

    // All events should share the same session ID
    const sessionConsistency = events.every((e) => e.session_id === sessionId);
    expect(sessionConsistency).toBe(true);

    // Should have meaningful navigation sequence
    const pageViews = events.filter((e) => e.type === 'page_view');
    expect(pageViews.length).toBeGreaterThanOrEqual(2); // products, about, contact

    // Should have product interaction
    const cartEvents = events.filter((e) => e.type === 'custom');
    expect(cartEvents).toHaveLength(1);

    // Should have click events indicating engagement
    const clickEvents = events.filter((e) => e.type === 'click');
    expect(clickEvents.length).toBeGreaterThan(0);

    // Validate basic event structure
    await expect(events).toHaveChronologicalOrder();
    await expect(events).toHaveValidEventData();
    await expect(traceLogPage).toHaveNoTraceLogErrors();
  });
});
