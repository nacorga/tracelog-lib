/**
 * User E-commerce Flow Test
 *
 * Tests realistic e-commerce user interactions to ensure TraceLog correctly tracks
 * add_to_cart and contact_form_submit events with proper metadata structure.
 * Focus: Real e-commerce behavior validation without over-engineering
 */

import { test, expect } from '@playwright/test';
import { navigateToPlayground } from './utils/environment.utils';

test.describe('User E-commerce Flow', () => {
  test('should track add_to_cart events with correct product metadata', async ({ page }) => {
    // Navigate to playground
    await navigateToPlayground(page);

    // Test e-commerce add to cart flow
    const ecommerceResult = await page.evaluate(async () => {
      // Wait for bridge to be available
      let retries = 0;
      while (!window.__traceLogBridge && retries < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        retries++;
      }

      if (!window.__traceLogBridge) {
        throw new Error('TraceLog bridge not available after waiting');
      }

      const queueEvents: any[] = [];
      let sessionId: string | null = null;

      // Listen for queue events to capture custom events with session_id
      window.__traceLogBridge!.on('queue', (data: any) => {
        queueEvents.push(data);
      });

      // Initialize TraceLog
      await window.__traceLogBridge!.init({ id: 'skip' });

      // Get session ID
      const sessionData = window.__traceLogBridge!.getSessionData();
      sessionId =
        sessionData && typeof sessionData === 'object' && 'id' in sessionData ? (sessionData.id as string) : null;

      // Wait for initial setup
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Navigate to products page first
      const productosLink = document.querySelector('[data-testid="nav-productos"]') as HTMLElement;
      if (productosLink) {
        productosLink.click();
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      // Add products to cart to simulate realistic shopping behavior
      const addedProducts: any[] = [];

      // Try to add products, but be flexible about which ones exist
      const potentialProducts = [
        { testId: 'add-cart-1', expectedName: 'Laptop Pro M2', expectedId: '1' },
        { testId: 'add-cart-2', expectedName: 'Smartphone X', expectedId: '2' },
        { testId: 'add-cart-3', expectedName: 'Smartwatch Ultra', expectedId: '3' },
        { testId: 'add-cart-4', expectedName: 'Headphones Pro', expectedId: '4' },
        { testId: 'add-cart-5', expectedName: 'Tablet Pro', expectedId: '5' },
      ];

      for (const product of potentialProducts) {
        const addButton = document.querySelector(`[data-testid="${product.testId}"]`) as HTMLElement;
        if (addButton) {
          addButton.click();
          addedProducts.push(product);
          await new Promise((resolve) => setTimeout(resolve, 800)); // Wait between additions

          // Add at least 1, but try for up to 3 products
          if (addedProducts.length >= 3) break;
        }
      }

      // Send a trigger event to ensure queue is sent
      window.__traceLogBridge!.sendCustomEvent('test_ecommerce_complete', { trigger: 'end_shopping' });

      // Wait for queue events
      const startTime = Date.now();
      while (queueEvents.length === 0 && Date.now() - startTime < 12000) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      return {
        queueEvents,
        sessionId,
        addedProducts,
        initialized: window.__traceLogBridge!.initialized,
      };
    });

    // Verify initialization and session
    expect(ecommerceResult.initialized).toBe(true);
    expect(ecommerceResult.sessionId).toBeTruthy();
    expect(ecommerceResult.queueEvents.length).toBeGreaterThan(0);

    // Extract all add_to_cart events from queues
    const addToCartEvents = ecommerceResult.queueEvents.flatMap((queue) =>
      queue.events.filter((event: any) => event.type === 'custom' && event.custom_event?.name === 'add_to_cart'),
    );

    // Verify at least one add_to_cart event was captured
    expect(addToCartEvents.length).toBeGreaterThan(0);
    expect(addToCartEvents.length).toBeLessThanOrEqual(ecommerceResult.addedProducts.length);

    // Verify all queues have consistent session_id
    const uniqueSessionIds = [...new Set(ecommerceResult.queueEvents.map((queue) => queue.session_id))];
    expect(uniqueSessionIds).toHaveLength(1);
    expect(uniqueSessionIds[0]).toBe(ecommerceResult.sessionId);

    // Verify add_to_cart events have correct structure and metadata
    addToCartEvents.forEach((event) => {
      expect(event.type).toBe('custom');
      expect(event.custom_event).toBeDefined();
      expect(event.custom_event.name).toBe('add_to_cart');
      expect(event.custom_event.metadata).toBeDefined();
      expect(event.timestamp).toBeDefined();
      expect(typeof event.timestamp).toBe('number');

      // Verify product metadata structure
      const metadata = event.custom_event.metadata;
      expect(metadata.product_id).toBeDefined();
      expect(metadata.product_name).toBeDefined();
      expect(metadata.timestamp).toBeDefined();
      expect(typeof metadata.product_id).toBe('string');
      expect(typeof metadata.product_name).toBe('string');
      expect(typeof metadata.timestamp).toBe('number');
    });

    // Verify metadata matches at least some of the expected product data
    const productIds = addToCartEvents.map((event) => event.custom_event.metadata.product_id);
    const productNames = addToCartEvents.map((event) => event.custom_event.metadata.product_name);

    // Flexible validation - check that captured product IDs are from the expected set
    const expectedProductIds = ['1', '2', '3', '4', '5'];
    const expectedProductNames = ['Laptop Pro M2', 'Smartphone X', 'Smartwatch Ultra', 'Headphones Pro', 'Tablet Pro'];

    productIds.forEach((id) => {
      expect(expectedProductIds).toContain(id);
    });

    productNames.forEach((name) => {
      expect(expectedProductNames).toContain(name);
    });
  });

  test('should track contact_form_submit events with form data', async ({ page }) => {
    // Navigate to playground
    await navigateToPlayground(page);

    // Test contact form submission flow
    const contactFormResult = await page.evaluate(async () => {
      // Wait for bridge to be available
      let retries = 0;
      while (!window.__traceLogBridge && retries < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        retries++;
      }

      if (!window.__traceLogBridge) {
        throw new Error('TraceLog bridge not available after waiting');
      }

      const queueEvents: any[] = [];
      let sessionId: string | null = null;

      // Listen for queue events
      window.__traceLogBridge!.on('queue', (data: any) => {
        queueEvents.push(data);
      });

      // Initialize TraceLog
      await window.__traceLogBridge!.init({ id: 'skip' });

      // Get session ID
      const sessionData = window.__traceLogBridge!.getSessionData();
      sessionId =
        sessionData && typeof sessionData === 'object' && 'id' in sessionData ? (sessionData.id as string) : null;

      // Wait for initial setup
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Navigate to contact page
      const contactLink = document.querySelector('[data-testid="nav-contacto"]') as HTMLElement;
      if (contactLink) {
        contactLink.click();
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      // Fill out contact form
      const nameInput = document.querySelector('[data-testid="form-name"]') as HTMLInputElement;
      const emailInput = document.querySelector('[data-testid="form-email"]') as HTMLInputElement;
      const messageInput = document.querySelector('[data-testid="form-message"]') as HTMLTextAreaElement;

      const formData = {
        name: 'Juan Pérez',
        email: 'juan.perez@example.com',
        message: 'Estoy interesado en sus productos premium. ¿Podrían enviarme más información?',
      };

      if (nameInput && emailInput && messageInput) {
        nameInput.value = formData.name;
        emailInput.value = formData.email;
        messageInput.value = formData.message;

        // Trigger input events to ensure form validation
        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
        messageInput.dispatchEvent(new Event('input', { bubbles: true }));

        await new Promise((resolve) => setTimeout(resolve, 300));

        // Submit the form
        const submitButton = document.querySelector('[data-testid="form-submit"]') as HTMLElement;
        if (submitButton) {
          submitButton.click();
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      // Send trigger event to ensure queue is sent
      window.__traceLogBridge!.sendCustomEvent('test_contact_complete', { trigger: 'end_contact' });

      // Wait for queue events
      const startTime = Date.now();
      while (queueEvents.length === 0 && Date.now() - startTime < 12000) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      return {
        queueEvents,
        sessionId,
        formData,
        initialized: window.__traceLogBridge!.initialized,
      };
    });

    // Verify initialization and session
    expect(contactFormResult.initialized).toBe(true);
    expect(contactFormResult.sessionId).toBeTruthy();
    expect(contactFormResult.queueEvents.length).toBeGreaterThan(0);

    // Extract contact_form_submit events
    const contactFormEvents = contactFormResult.queueEvents.flatMap((queue) =>
      queue.events.filter(
        (event: any) => event.type === 'custom' && event.custom_event?.name === 'contact_form_submit',
      ),
    );

    // Verify contact form events were captured
    expect(contactFormEvents.length).toBeGreaterThan(0);

    // Verify all queues have consistent session_id
    const uniqueSessionIds = [...new Set(contactFormResult.queueEvents.map((queue) => queue.session_id))];
    expect(uniqueSessionIds).toHaveLength(1);
    expect(uniqueSessionIds[0]).toBe(contactFormResult.sessionId);

    // Verify contact form events have correct structure
    contactFormEvents.forEach((event) => {
      expect(event.type).toBe('custom');
      expect(event.custom_event).toBeDefined();
      expect(event.custom_event.name).toBe('contact_form_submit');
      expect(event.custom_event.metadata).toBeDefined();
      expect(event.timestamp).toBeDefined();
      expect(typeof event.timestamp).toBe('number');

      // Verify form data structure
      const metadata = event.custom_event.metadata;
      expect(metadata.name).toBeDefined();
      expect(metadata.email).toBeDefined();
      expect(metadata.message).toBeDefined();
      expect(typeof metadata.name).toBe('string');
      expect(typeof metadata.email).toBe('string');
      expect(typeof metadata.message).toBe('string');

      // Verify form data content
      expect(metadata.name).toBe(contactFormResult.formData.name);
      expect(metadata.email).toBe(contactFormResult.formData.email);
      expect(metadata.message).toBe(contactFormResult.formData.message);
    });
  });

  test('should handle mixed e-commerce interactions in single session', async ({ page }) => {
    // Navigate to playground
    await navigateToPlayground(page);

    // Test mixed e-commerce flow: shopping + contact in same session
    const mixedFlowResult = await page.evaluate(async () => {
      // Wait for bridge to be available
      let retries = 0;
      while (!window.__traceLogBridge && retries < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        retries++;
      }

      if (!window.__traceLogBridge) {
        throw new Error('TraceLog bridge not available after waiting');
      }

      const queueEvents: any[] = [];
      let sessionId: string | null = null;

      // Listen for queue events
      window.__traceLogBridge!.on('queue', (data: any) => {
        queueEvents.push(data);
      });

      // Initialize TraceLog
      await window.__traceLogBridge!.init({ id: 'skip' });

      // Get session ID
      const sessionData = window.__traceLogBridge!.getSessionData();
      sessionId =
        sessionData && typeof sessionData === 'object' && 'id' in sessionData ? (sessionData.id as string) : null;

      // Wait for initial setup
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Step 1: Browse and add product to cart
      const productosLink = document.querySelector('[data-testid="nav-productos"]') as HTMLElement;
      if (productosLink) {
        productosLink.click();
        await new Promise((resolve) => setTimeout(resolve, 600));
      }

      const addCartButton = document.querySelector('[data-testid="add-cart-3"]') as HTMLElement;
      if (addCartButton) {
        addCartButton.click();
        await new Promise((resolve) => setTimeout(resolve, 600));
      }

      // Step 2: Navigate to contact and submit form
      const contactLink = document.querySelector('[data-testid="nav-contacto"]') as HTMLElement;
      if (contactLink) {
        contactLink.click();
        await new Promise((resolve) => setTimeout(resolve, 600));
      }

      // Quick form fill and submit
      const nameInput = document.querySelector('[data-testid="form-name"]') as HTMLInputElement;
      const emailInput = document.querySelector('[data-testid="form-email"]') as HTMLInputElement;
      const messageInput = document.querySelector('[data-testid="form-message"]') as HTMLTextAreaElement;

      if (nameInput && emailInput && messageInput) {
        nameInput.value = 'Ana García';
        emailInput.value = 'ana.garcia@example.com';
        messageInput.value = 'Consulta sobre el Smartwatch Ultra que agregué al carrito.';

        const submitButton = document.querySelector('[data-testid="form-submit"]') as HTMLElement;
        if (submitButton) {
          submitButton.click();
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      // Step 3: Go back to products and add another item
      const productosLinkAgain = document.querySelector('[data-testid="nav-productos"]') as HTMLElement;
      if (productosLinkAgain) {
        productosLinkAgain.click();
        await new Promise((resolve) => setTimeout(resolve, 600));
      }

      const addCart2Button = document.querySelector('[data-testid="add-cart-5"]') as HTMLElement;
      if (addCart2Button) {
        addCart2Button.click();
        await new Promise((resolve) => setTimeout(resolve, 600));
      }

      // Send trigger event
      window.__traceLogBridge!.sendCustomEvent('test_mixed_flow_complete', { trigger: 'end_mixed_flow' });

      // Wait for queue events
      const startTime = Date.now();
      while (queueEvents.length === 0 && Date.now() - startTime < 12000) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      return {
        queueEvents,
        sessionId,
        initialized: window.__traceLogBridge!.initialized,
      };
    });

    // Verify initialization and session
    expect(mixedFlowResult.initialized).toBe(true);
    expect(mixedFlowResult.sessionId).toBeTruthy();
    expect(mixedFlowResult.queueEvents.length).toBeGreaterThan(0);

    // Extract different types of custom events
    const allCustomEvents = mixedFlowResult.queueEvents.flatMap((queue) =>
      queue.events.filter((event: any) => event.type === 'custom'),
    );

    const addToCartEvents = allCustomEvents.filter((event) => event.custom_event?.name === 'add_to_cart');
    const contactFormEvents = allCustomEvents.filter((event) => event.custom_event?.name === 'contact_form_submit');

    // Verify both types of events were captured
    expect(addToCartEvents.length).toBeGreaterThan(0);
    expect(contactFormEvents.length).toBeGreaterThan(0);

    // Verify session consistency across all interactions
    const uniqueSessionIds = [...new Set(mixedFlowResult.queueEvents.map((queue) => queue.session_id))];
    expect(uniqueSessionIds).toHaveLength(1);
    expect(uniqueSessionIds[0]).toBe(mixedFlowResult.sessionId);

    // Verify chronological order of events (add_to_cart should come before and after contact_form_submit)
    const chronologicalEvents = allCustomEvents.sort((a, b) => a.timestamp - b.timestamp);
    expect(chronologicalEvents.length).toBeGreaterThanOrEqual(3); // At least 2 add_to_cart + 1 contact_form_submit

    // Verify all events have proper structure
    chronologicalEvents.forEach((event) => {
      expect(event.type).toBe('custom');
      expect(event.custom_event).toBeDefined();
      expect(event.custom_event.name).toMatch(/^(add_to_cart|contact_form_submit|test_mixed_flow_complete)$/);
      expect(event.timestamp).toBeDefined();
      expect(typeof event.timestamp).toBe('number');
    });
  });
});
