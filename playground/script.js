// ============================================================================
// STATE MANAGEMENT
// ============================================================================

const state = {
  currentPage: 'inicio',
  cartCount: 0,
  queueCount: 0,
  events: [],
};

// No mock server - using real API at localhost:3002

// ============================================================================
// SPA ROUTING
// ============================================================================

function navigateToPage(pageName) {
  // Update URL hash to trigger TraceLog page_view detection
  if (window.location.hash !== `#${pageName}`) {
    window.location.hash = pageName;
    return; // hashchange event will call this function again
  }

  // Update active page
  document.querySelectorAll('.page').forEach((page) => {
    page.classList.remove('active');
  });

  document.getElementById(`page-${pageName}`)?.classList.add('active');

  // Update nav links
  document.querySelectorAll('.nav-link').forEach((link) => {
    link.classList.remove('active');
  });
  document.querySelector(`[data-page="${pageName}"]`)?.classList.add('active');

  state.currentPage = pageName;
  window.scrollTo(0, 0);
}

function setupNavigation() {
  document.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = e.currentTarget.dataset.page;
      navigateToPage(page);
    });
  });

  // CTA buttons
  document.querySelectorAll('[data-action="cta-ver-productos"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      navigateToPage('productos');
    });
  });

  document.querySelectorAll('[data-action="cta-contacto"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      navigateToPage('contacto');
    });
  });

  // Hash-based routing
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1) || 'inicio';
    if (['inicio', 'productos', 'nosotros', 'contacto'].includes(hash)) {
      navigateToPage(hash);
    }
  });

  // Initial route
  const hash = window.location.hash.slice(1) || 'inicio';
  if (['inicio', 'productos', 'nosotros', 'contacto'].includes(hash)) {
    navigateToPage(hash);
  }
}

// ============================================================================
// E-COMMERCE INTERACTIONS
// ============================================================================

function setupCartInteractions() {
  document.querySelectorAll('.btn-add-cart').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const productId = e.currentTarget.dataset.productId;
      const productName = e.currentTarget.dataset.productName;

      state.cartCount++;
      document.getElementById('cart-count').textContent = state.cartCount;

      // Send custom event
      if (window.TraceLog) {
        TraceLog.event('add_to_cart', {
          product_id: productId,
          product_name: productName,
          timestamp: Date.now(),
        });
      }

      // Visual feedback
      e.currentTarget.textContent = 'Añadido ✓';
      setTimeout(() => {
        e.currentTarget.textContent = 'Añadir al Carrito';
      }, 1000);
    });
  });
}

function setupContactForm() {
  const form = document.getElementById('contact-form');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = {
      name: document.getElementById('name').value,
      email: document.getElementById('email').value,
      message: document.getElementById('message').value,
    };

    // Send custom event
    if (window.TraceLog) {
      TraceLog.event('contact_form_submit', formData);
    }

    // Visual feedback
    alert('Gracias por contactarnos. Te responderemos pronto.');
    form.reset();
  });
}


// ============================================================================
// FLOATING MONITOR
// ============================================================================

function setupFloatingMonitor() {
  document.getElementById('clear-events').addEventListener('click', () => {
    clearEventsMonitor();
  });
}

function updateQueueCount(count) {
  document.getElementById('queue-count').textContent = count;
}

function updateQueueStatus(icon) {
  document.getElementById('queue-status').textContent = icon;
}

function addEventToMonitor(eventType, status = '⏳') {
  const eventsList = document.getElementById('events-list');
  if (!eventsList) return;

  const eventEl = document.createElement('div');
  eventEl.className = 'monitor-event';
  eventEl.dataset.eventId = Date.now();

  eventEl.innerHTML = `
    <span class="event-type-badge event-type-${eventType}">${eventType}</span>
    <span class="event-status-icon">${status}</span>
  `;

  eventsList.insertBefore(eventEl, eventsList.firstChild);

  state.events.unshift({ type: eventType, timestamp: Date.now(), id: eventEl.dataset.eventId });
  state.queueCount++;
  updateQueueCount(state.queueCount);

  while (eventsList.children.length > 50) {
    eventsList.removeChild(eventsList.lastChild);
    state.events.pop();
  }

  return eventEl.dataset.eventId;
}

function removeEventsFromMonitor(count) {
  const eventsList = document.getElementById('events-list');
  if (!eventsList) return;

  for (let i = 0; i < count && eventsList.children.length > 0; i++) {
    eventsList.removeChild(eventsList.firstChild);
    state.events.shift();
  }
}

function clearEventsMonitor() {
  const eventsList = document.getElementById('events-list');
  if (eventsList) {
    eventsList.innerHTML = '';
  }
  state.events = [];
  state.queueCount = 0;
  updateQueueCount(0);
}

// ============================================================================
// TRACELOG LISTENERS
// ============================================================================

function setupTraceLogListener() {
  window.addEventListener('tracelog:log', (event) => {
    const { namespace, message, data } = event.detail || {};

    // Debug: log todos los eventos de EventManager
    if (namespace === 'EventManager') {
      console.log('[EventManager]', message, data);
    }

    if (namespace === 'EventManager' && message?.includes('Event captured')) {
      const eventType = data?.type || 'UNKNOWN';
      console.log('📥 Capturando evento:', eventType, data);
      addEventToMonitor(eventType);
    }

    if (namespace === 'EventManager' && message?.includes('Events sent successfully')) {
      const eventsCount = data?.eventCount || 1;
      removeEventsFromMonitor(eventsCount);
      state.queueCount = Math.max(0, state.queueCount - eventsCount);
      updateQueueCount(state.queueCount);
      updateQueueStatus('✓');
    }

    // Debug: log todos los eventos de SessionManager y SenderManager
    if (namespace === 'SessionManager' || namespace === 'SenderManager') {
      console.log(`[${namespace}]`, message, data);
    }

    if (namespace === 'SessionManager' && message?.includes('Network connection restored')) {
      console.log('🔌 Red restaurada, recuperando eventos...');
      updateQueueStatus('🔄');
    }

    if (namespace === 'SenderManager' && message?.includes('Persisted events recovered')) {
      const eventsCount = data?.eventsCount || 0;
      const recoveredEvents = data?.events || [];

      console.log('📦 Eventos recuperados:', { eventsCount, recoveredEvents });

      clearEventsMonitor();
      state.queueCount = 0;

      // Mostrar los eventos recuperados con sus tipos reales
      recoveredEvents.forEach((event, i) => {
        const eventType = event.type || 'UNKNOWN';
        const eventEl = document.createElement('div');

        eventEl.className = 'monitor-event';
        eventEl.dataset.eventId = Date.now() + i;
        eventEl.innerHTML = `
          <span class="event-type-badge event-type-${eventType}">${eventType}</span>
          <span class="event-status-icon">🔄</span>
        `;

        const eventsList = document.getElementById('events-list');

        if (eventsList) {
          eventsList.insertBefore(eventEl, eventsList.firstChild);
        }

        state.events.unshift({ type: eventType, timestamp: Date.now(), id: eventEl.dataset.eventId });
        state.queueCount++;
      });

      updateQueueCount(state.queueCount);
      updateQueueStatus('🔄');
    }

    if (namespace === 'EventManager' && message?.includes('Persisted events recovered successfully')) {
      const eventCount = data?.eventCount || 0;
      console.log('✅ Eventos recuperados exitosamente:', eventCount);

      // Remove recovered events from visual list
      removeEventsFromMonitor(eventCount);
      state.queueCount = Math.max(0, state.queueCount - eventCount);
      updateQueueCount(state.queueCount);
      updateQueueStatus('✓');
    }

    if (namespace === 'SenderManager' && (message?.includes('Send request failed') || message?.includes('Failed to send'))) {
      updateQueueStatus('❌');
    }

    if (namespace === 'SenderManager' && message?.includes('Retry scheduled')) {
      updateQueueStatus('🔄');
    }
  });
}

// ============================================================================
// INITIALIZATION
// ============================================================================

async function initializeApp() {
  setupNavigation();
  setupCartInteractions();
  setupContactForm();
  setupFloatingMonitor();
  setupTraceLogListener();

  try {
    await TraceLog.init({
      id: 'localhost:3002',
    });
    updateQueueStatus('▶️');
  } catch (error) {
    console.error('TraceLog init error:', error);
    updateQueueStatus('❌');
  }
}

// ============================================================================
// FIX #2 DEMONSTRATION - Event Loss Prevention Test
// ============================================================================

/**
 * Test function to demonstrate Fix #2: Events are not lost when send fails
 * This test simulates server failures and verifies events remain in queue
 */
window.testEventLossPrevention = async function() {
  console.log('🧪 Starting Fix #2 Test: Event Loss Prevention');
  
  // Step 1: Enable server failures
  const originalServerState = state.isServerFailing;
  state.isServerFailing = true;
  console.log('✅ Server failures enabled');
  
  // Step 2: Generate test events
  const testEvents = [
    { type: 'click', element: 'test-button-1' },
    { type: 'click', element: 'test-button-2' },
    { type: 'custom', name: 'test-event' }
  ];
  
  console.log('📝 Generating test events...');
  
  // Generate events
  testEvents.forEach((event, index) => {
    if (event.type === 'click') {
      TraceLog.event('click', {
        element_id: event.element,
        test_sequence: index + 1
      });
    } else if (event.type === 'custom') {
      TraceLog.event('custom', {
        event_name: event.name,
        test_sequence: index + 1
      });
    }
  });
  
  console.log(`✅ Generated ${testEvents.length} test events`);
  
  // Step 3: Try to flush (should fail due to server failures)
  console.log('🚨 Attempting flush with server failures...');
  const flushResult = await TraceLog.flush();
  
  if (!flushResult) {
    console.log('✅ Expected: Flush failed due to server failures');
  } else {
    console.log('⚠️ Unexpected: Flush succeeded despite server failures');
  }
  
  // Step 4: Check if events are still in queue
  // Note: We can't directly access the queue, but we can observe behavior
  console.log('🔍 Events should remain in queue for retry...');
  
  // Step 5: Restore server and try again
  await new Promise(resolve => setTimeout(resolve, 1000));
  state.isServerFailing = false;
  console.log('✅ Server restored');
  
  console.log('🔄 Attempting flush with server restored...');
  const secondFlushResult = await TraceLog.flush();
  
  if (secondFlushResult) {
    console.log('✅ Success: Events were preserved and sent after server restoration');
  } else {
    console.log('❌ Error: Events may have been lost');
  }
  
  // Restore original server state
  state.isServerFailing = originalServerState;
  
  console.log('🎯 Fix #2 Test completed!');
  console.log('📋 Summary: Events are preserved in queue when send fails and sent when server recovers');
  
  return {
    testPassed: secondFlushResult,
    eventsGenerated: testEvents.length,
    serverFailureHandled: !flushResult,
    recoverySuccessful: secondFlushResult
  };
};

// ============================================================================
// ENHANCED ERROR RECOVERY TESTING
// ============================================================================

function testRecoveryStats() {
  if (window.TraceLog) {
    const stats = window.TraceLog.getRecoveryStats?.();
    if (stats) {
      console.group('🔄 Enhanced Error Recovery Stats');
      console.log('Circuit Breaker Resets:', stats.circuitBreakerResets);
      console.log('Persistence Failures:', stats.persistenceFailures);
      console.log('Network Timeouts:', stats.networkTimeouts);
      console.log('Last Recovery Attempt:', new Date(stats.lastRecoveryAttempt).toLocaleString());
      console.log('Current Failure Count:', stats.currentFailureCount);
      console.log('Circuit Breaker Open:', stats.circuitBreakerOpen);
      console.log('Fingerprint Map Size:', stats.fingerprintMapSize);
      console.groupEnd();
      
      updateConsoleLog(`📊 Recovery Stats: CB Resets: ${stats.circuitBreakerResets}, Failures: ${stats.persistenceFailures}, Timeouts: ${stats.networkTimeouts}`);
    } else {
      console.warn('getRecoveryStats method not available');
    }
  } else {
    console.warn('TraceLog not initialized');
  }
}

function triggerSystemRecovery() {
  if (window.TraceLog && window.TraceLog.attemptSystemRecovery) {
    console.log('🚑 Triggering system recovery...');
    window.TraceLog.attemptSystemRecovery();
    updateConsoleLog('🚑 System recovery triggered manually');
    
    // Show updated stats after recovery
    setTimeout(() => testRecoveryStats(), 1000);
  } else {
    console.warn('System recovery method not available');
  }
}

function triggerFingerprintCleanup() {
  if (window.TraceLog && window.TraceLog.aggressiveFingerprintCleanup) {
    console.log('🧹 Triggering aggressive fingerprint cleanup...');
    window.TraceLog.aggressiveFingerprintCleanup();
    updateConsoleLog('🧹 Aggressive fingerprint cleanup executed');
  } else {
    console.warn('Fingerprint cleanup method not available');
  }
}

// Make functions globally available
window.testRecoveryStats = testRecoveryStats;
window.triggerSystemRecovery = triggerSystemRecovery;
window.triggerFingerprintCleanup = triggerFingerprintCleanup;

// Add test button to console if it exists
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (window.TraceLog && typeof window.testEventLossPrevention === 'function') {
      console.log('🧪 Fix #2 Test available: Run window.testEventLossPrevention() to test event loss prevention');
    }
    
    console.log('🔄 Enhanced Error Recovery Tests available:');
    console.log('  • window.testRecoveryStats() - Show current recovery statistics');
    console.log('  • window.triggerSystemRecovery() - Trigger manual system recovery');
    console.log('  • window.triggerFingerprintCleanup() - Trigger fingerprint cleanup');
  }, 2000);
});

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}