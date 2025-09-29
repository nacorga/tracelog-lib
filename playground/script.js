// ============================================================================
// STATE MANAGEMENT & TEST MODE DETECTION
// ============================================================================

// Auto-detect E2E test mode and parse URL parameters
const urlParams = new URLSearchParams(window.location.search);
const isE2ETest = navigator.userAgent.includes('HeadlessChrome') ||
                 navigator.userAgent.includes('Playwright') ||
                 urlParams.get('e2e') === 'true';

// Remove floating monitor in E2E test mode
if (isE2ETest) {
  const removeMonitor = () => document.getElementById('floating-monitor')?.remove();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', removeMonitor);
  } else {
    removeMonitor();
  }
}

const TEST_MODE = {
  enabled: urlParams.get('mode') === 'test' || isE2ETest,
  scenario: urlParams.get('scenario') || 'basic',
  autoInit: urlParams.get('auto-init') === 'true' || isE2ETest,
  hideUI: urlParams.get('hide-ui') === 'true',
  projectId: urlParams.get('project-id') || (isE2ETest ? 'e2e-test-project' : 'skip')
};

const state = {
  currentPage: 'inicio',
  cartCount: 0,
  testMode: TEST_MODE,
  queueCount: 0,
  lastSentTime: null,
};

// ============================================================================
// TRACELOG HELPERS
// ============================================================================

// Helper function to access TraceLog consistently through __traceLogBridge
function getTraceLogInstance() {
  return window.__traceLogBridge || window.tracelog;
}

// Helper function to send custom events
function sendTraceLogEvent(eventName, eventData) {
  const traceLog = getTraceLogInstance();
  if (traceLog?.sendCustomEvent) {
    return traceLog.sendCustomEvent(eventName, eventData);
  }
}

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
      sendTraceLogEvent('add_to_cart', {
        product_id: productId,
        product_name: productName,
        timestamp: Date.now(),
      });

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
    sendTraceLogEvent('contact_form_submit', formData);

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

function updateQueueStatus(icon) {
  document.getElementById('queue-status').textContent = icon;
}

function updateQueueCount(count) {
  state.queueCount = count;
  document.getElementById('queue-count').textContent = count;
}

function updateLastSent() {
  state.lastSentTime = Date.now();
  updateLastSentDisplay();
}

function updateLastSentDisplay() {
  const lastSentEl = document.getElementById('last-sent');
  if (!state.lastSentTime) {
    lastSentEl.textContent = '-';
    return;
  }

  const secondsAgo = Math.floor((Date.now() - state.lastSentTime) / 1000);

  if (secondsAgo < 60) {
    lastSentEl.textContent = `hace ${secondsAgo}s`;
  } else {
    const minutesAgo = Math.floor(secondsAgo / 60);
    lastSentEl.textContent = `hace ${minutesAgo}m`;
  }
}

// Update the "last sent" display every second
setInterval(updateLastSentDisplay, 1000);

function addEventToMonitor(eventType, status = '⏳', eventData = null) {
  // Skip monitor updates during E2E tests
  if (isE2ETest) return null;

  const eventsList = document.getElementById('events-list');
  if (!eventsList) return;

  const eventEl = document.createElement('div');
  eventEl.className = 'monitor-event';
  eventEl.dataset.eventId = Date.now();

  // Extract additional info from event data
  let extraInfo = '';
  if (eventData) {
    if (eventData.custom_event) {
      extraInfo = `<span class="event-detail">${eventData.custom_event.name}</span>`;
    } else if (eventData.click_data) {
      extraInfo = `<span class="event-detail">x:${eventData.click_data.x}, y:${eventData.click_data.y}</span>`;
    } else if (eventData.scroll_data) {
      extraInfo = `<span class="event-detail">${eventData.scroll_data.depth}%</span>`;
    } else if (eventData.page_url) {
      const url = new URL(eventData.page_url);
      extraInfo = `<span class="event-detail">${url.pathname}</span>`;
    }
  }

  const timestamp = new Date().toLocaleTimeString();

  eventEl.innerHTML = `
    <div class="event-main">
      <span class="event-type-badge event-type-${eventType}">${eventType}</span>
      <span class="event-status-icon">${status}</span>
    </div>
    <div class="event-details">
      <span class="event-timestamp">${timestamp}</span>
      ${extraInfo}
    </div>
  `;

  eventsList.insertBefore(eventEl, eventsList.firstChild);

  // Mantener un máximo de 100 eventos para evitar problemas de rendimiento
  while (eventsList.children.length > 100) {
    eventsList.removeChild(eventsList.lastChild);
  }

  return eventEl.dataset.eventId;
}

// Función eliminada - ya no removemos eventos automáticamente

function updateEventsAsSent(count) {
  // Skip monitor updates during E2E tests
  if (isE2ETest) return;

  const eventsList = document.getElementById('events-list');
  if (!eventsList) return;

  // Update the first 'count' events to show they were sent
  const eventElements = eventsList.querySelectorAll('.monitor-event');
  for (let i = 0; i < Math.min(count, eventElements.length); i++) {
    const eventEl = eventElements[i];
    const statusIcon = eventEl.querySelector('.event-status-icon');
    if (statusIcon) {
      statusIcon.textContent = '✅';
    }
    // Keep events visible but slightly faded to show they were sent
    eventEl.style.opacity = '0.8';
  }

  // NO eliminar eventos automáticamente - mantener el historial
}

function clearEventsMonitor() {
  const eventsList = document.getElementById('events-list');
  if (eventsList) {
    eventsList.innerHTML = '';
  }
  // Reset queue info when clearing
  updateQueueCount(0);
  updateQueueStatus('⏸');
}

// ============================================================================
// TRACELOG LISTENERS
// ============================================================================

function setupTraceLogListener() {
  // Listen for real-time events directly from EventManager.track()
  tracelog.on('realtime', (data) => {
    const { type, data: eventData, queueLength } = data;

    console.log('📥 TraceLog Event:', type, eventData);
    addEventToMonitor(type, '⏳', eventData);
    updateQueueCount(queueLength || 0);
    updateQueueStatus('⏳');
  });

  // Listen for events sent successfully
  tracelog.on('sent', (data) => {
    const { eventCount, queueLength } = data;

    console.log('✅ TraceLog Events Sent:', eventCount);
    updateEventsAsSent(eventCount);
    updateQueueCount(queueLength || 0);
    updateQueueStatus('✓');
    updateLastSent();
  });
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// ============================================================================
// TEST MODE SETUP
// ============================================================================

function setupTestMode() {
  if (!state.testMode.enabled) return;

  console.log('🧪 Test mode enabled:', state.testMode);

  // Remove floating monitor during E2E tests to prevent click interception
  if (isE2ETest || state.testMode.hideUI) {
    const monitor = document.getElementById('floating-monitor');
    if (monitor) monitor.remove();
  }

  // Add test data attributes to key elements
  document.body.setAttribute('data-testid', 'playground-body');
  document.body.setAttribute('data-test-mode', 'true');
  document.body.setAttribute('data-test-scenario', state.testMode.scenario);

  // Add test indicator
  if (!state.testMode.hideUI) {
    const indicator = document.createElement('div');
    indicator.style.cssText = 'position:fixed;top:10px;right:10px;background:#ff6b35;color:white;padding:8px 12px;border-radius:4px;font-size:12px;font-weight:bold;z-index:10000;pointer-events:none;';
    indicator.textContent = `TEST MODE: ${state.testMode.scenario.toUpperCase()}`;
    indicator.setAttribute('data-testid', 'test-mode-indicator');
    document.body.appendChild(indicator);
  }

  // Test helpers for E2E compatibility
  window.testHelpers = {
    sendCustomEvent: (name, data) => sendTraceLogEvent(name, data)
  };
}

function triggerTestScenario(scenario = state.testMode.scenario) {
  console.log('🎬 Triggering test scenario:', scenario);

  const actions = {
    basic: () => document.querySelector('.btn-primary')?.click(),
    navigation: () => {
      setTimeout(() => navigateToPage('productos'), 100);
      setTimeout(() => navigateToPage('nosotros'), 500);
    },
    ecommerce: () => document.querySelector('.btn-add-cart')?.click(),
  };

  const action = actions[scenario];
  if (action) {
    setTimeout(action, 100);
  }
}

function waitForTraceLogReady(timeout = 5000) {
  return new Promise((resolve, reject) => {
    const traceLog = getTraceLogInstance();
    if (traceLog) {
      resolve(traceLog);
      return;
    }

    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      const traceLog = getTraceLogInstance();
      if (traceLog) {
        clearInterval(checkInterval);
        resolve(traceLog);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        reject(new Error('TraceLog not ready within timeout'));
      }
    }, 50);
  });
}

async function initializeApp() {
  setupTestMode();
  setupNavigation();
  setupCartInteractions();
  setupContactForm();
  setupFloatingMonitor();
  setupTraceLogListener();

  // Initialize TraceLog
  try {
    await waitForTraceLogReady();
    const projectId = (state.testMode.enabled && state.testMode.autoInit)
      ? state.testMode.projectId
      : 'skip'; // Always use 'skip' for playground to simulate realistic flow

    await tracelog.init({ id: projectId });
    updateQueueStatus('▶️');

    if (state.testMode.enabled && state.testMode.autoInit) {
      console.log('🧪 TraceLog auto-initialized for testing');
      setTimeout(() => triggerTestScenario(), 500);
    }
  } catch (error) {
    console.error('TraceLog init error:', error);
    updateQueueStatus('❌');
  }
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}