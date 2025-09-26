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
  projectId: urlParams.get('project-id') || (isE2ETest ? 'e2e-test-project' : 'playground-test-project')
};

const state = {
  currentPage: 'inicio',
  cartCount: 0,
  queueCount: 0,
  events: [],
  testMode: TEST_MODE,
};

// ============================================================================
// TRACELOG HELPERS
// ============================================================================

// Helper function to access TraceLog consistently through __traceLogBridge
function getTraceLogInstance() {
  return window.__traceLogBridge || window.TraceLog;
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

function updateQueueCount(count) {
  document.getElementById('queue-count').textContent = count;
}

function updateQueueStatus(icon) {
  document.getElementById('queue-status').textContent = icon;
}

function addEventToMonitor(eventType, status = '⏳') {
  // Skip monitor updates during E2E tests
  if (isE2ETest) return null;

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
      : 'skip';

    await TraceLog.init({ id: projectId });
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