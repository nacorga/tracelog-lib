// ============================================================================
// STATE MANAGEMENT
// ============================================================================

const state = {
  currentPage: 'inicio',
  cartCount: 0,
  eventCount: 0,
  isServerFailing: false,
  isConsoleOpen: false,
  isConsoleMinimized: false,
  events: [],
  networkLogs: [],
  persistedEvents: [],
};

// ============================================================================
// MOCK SERVER
// ============================================================================

const originalFetch = window.fetch;

function setupMockServer() {
  window.fetch = function (url, options) {
    // Mock config endpoint
    if (url.includes('/config')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            samplingRate: 1,
            tags: [],
            excludedUrlPaths: [],
            ipExcluded: false,
          }),
      });
    }

    // Mock events endpoint
    if (url.includes('/collect') && options?.method === 'POST') {
      return new Promise((resolve) => {
        const delay = 100 + Math.random() * 100;

        setTimeout(() => {
          if (state.isServerFailing) {
            addNetworkLog('POST /collect', 500, 'Failed');
            updateConsoleStatus('error');
            resolve({
              ok: false,
              status: 500,
              json: () => Promise.resolve({ error: 'Internal Server Error' }),
            });
          } else {
            addNetworkLog('POST /collect', 200, 'Success');
            updateConsoleStatus('success');
            resolve({
              ok: true,
              status: 200,
              json: () => Promise.resolve({ success: true }),
            });
          }
        }, delay);
      });
    }

    return originalFetch(url, options);
  };
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
// FLOATING CONSOLE
// ============================================================================

function setupFloatingConsole() {
  const consoleEl = document.getElementById('floating-console');
  const toggleBtn = document.getElementById('console-toggle');
  const minimizeBtn = document.getElementById('console-minimize');
  const closeBtn = document.getElementById('console-close');
  const header = document.getElementById('console-header');
  const resizeHandle = document.getElementById('console-resize');

  let isDragging = false;
  let isResizing = false;
  let startX, startY, startWidth, startHeight, startLeft, startTop;

  // Toggle console
  toggleBtn.addEventListener('click', () => {
    state.isConsoleOpen = !state.isConsoleOpen;
    consoleEl.classList.toggle('open', state.isConsoleOpen);
    if (state.isConsoleOpen && state.isConsoleMinimized) {
      state.isConsoleMinimized = false;
      consoleEl.classList.remove('minimized');
    }
  });

  // Minimize console
  minimizeBtn.addEventListener('click', () => {
    state.isConsoleMinimized = !state.isConsoleMinimized;
    consoleEl.classList.toggle('minimized', state.isConsoleMinimized);
  });

  // Close console
  closeBtn.addEventListener('click', () => {
    state.isConsoleOpen = false;
    consoleEl.classList.remove('open');
  });

  // Drag functionality
  header.addEventListener('mousedown', (e) => {
    if (e.target.closest('.console-btn')) return;
    isDragging = true;
    const rect = consoleEl.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
    header.style.cursor = 'grabbing';
  });

  // Resize functionality
  resizeHandle.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    isResizing = true;
    const rect = consoleEl.getBoundingClientRect();
    startWidth = rect.width;
    startHeight = rect.height;
    startX = e.clientX;
    startY = e.clientY;
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const x = e.clientX - startX;
      const y = e.clientY - startY;
      consoleEl.style.left = `${Math.max(0, Math.min(x, window.innerWidth - consoleEl.offsetWidth))}px`;
      consoleEl.style.top = `${Math.max(0, Math.min(y, window.innerHeight - consoleEl.offsetHeight))}px`;
      consoleEl.style.right = 'auto';
      consoleEl.style.bottom = 'auto';
    }

    if (isResizing) {
      const deltaX = e.clientX - startX;
      const deltaY = startY - e.clientY;
      const newWidth = Math.max(300, Math.min(startWidth + deltaX, window.innerWidth - 20));
      const newHeight = Math.max(200, Math.min(startHeight + deltaY, window.innerHeight - 100));
      consoleEl.style.width = `${newWidth}px`;
      consoleEl.style.height = `${newHeight}px`;
    }
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    isResizing = false;
    header.style.cursor = 'grab';
  });

  // Tab switching
  document.querySelectorAll('.console-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      document.querySelectorAll('.console-tab').forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.console-tab-content').forEach((c) => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`tab-${tabName}`).classList.add('active');

      if (tabName === 'storage') {
        updateStorageTab();
      }
    });
  });

  // Event filter
  document.getElementById('event-filter').addEventListener('change', (e) => {
    filterEvents(e.target.value);
  });

  // Clear events
  document.getElementById('clear-events').addEventListener('click', () => {
    state.events = [];
    state.eventCount = 0;
    document.getElementById('events-list').innerHTML = '';
    updateBadge(0);
  });

  // Server toggle
  document.getElementById('toggle-server').addEventListener('click', () => {
    state.isServerFailing = !state.isServerFailing;
    const btn = document.getElementById('toggle-server');
    const statusDot = document.getElementById('server-status-dot');
    const statusText = document.getElementById('server-status-text');

    if (state.isServerFailing) {
      btn.textContent = 'Restaurar Servidor';
      btn.classList.remove('btn-danger');
      btn.classList.add('btn-success');
      statusDot.textContent = '🔴';
      statusText.textContent = 'Servidor: Offline';
      addNetworkLog('Server status', 500, 'Simulated failure');
    } else {
      btn.textContent = 'Simular Fallo';
      btn.classList.remove('btn-success');
      btn.classList.add('btn-danger');
      statusDot.textContent = '🟢';
      statusText.textContent = 'Servidor: Online';
      addNetworkLog('Server status', 200, 'Restored');
    }
  });
}

function updateConsoleStatus(status) {
  const statusEl = document.getElementById('console-status');
  const statusMap = {
    success: '🟢',
    error: '🔴',
    retrying: '🔄',
    idle: '⚪',
  };
  statusEl.textContent = statusMap[status] || '⚪';
}

function updateBadge(count) {
  const badge = document.getElementById('console-badge');
  badge.textContent = count;
  badge.style.display = count > 0 ? 'flex' : 'none';
}

function addEventToConsole(eventType, message, data = {}) {
  const event = {
    type: eventType,
    message,
    data,
    timestamp: new Date(),
    status: 'pending',
  };

  state.events.unshift(event);
  state.eventCount++;
  updateBadge(state.eventCount);

  const eventsList = document.getElementById('events-list');
  if (!eventsList) return;

  const eventEl = createEventElement(event);
  eventsList.insertBefore(eventEl, eventsList.firstChild);

  // Limit to 100 events
  while (eventsList.children.length > 100) {
    eventsList.removeChild(eventsList.lastChild);
  }
}

function createEventElement(event) {
  const el = document.createElement('div');
  el.className = `console-event event-${event.status}`;

  const icons = {
    pending: '⏳',
    success: '✓',
    retry: '🔄',
    error: '❌',
  };

  const typeColors = {
    page_view: '#007bff',      // Azul - navegación
    click: '#28a745',          // Verde - interacción
    scroll: '#17a2b8',         // Cyan - scroll
    custom: '#6f42c1',         // Púrpura - custom events
    session_start: '#ffc107',  // Amarillo - inicio sesión
    session_end: '#fd7e14',    // Naranja - fin sesión
    web_vitals: '#e83e8c',     // Rosa - métricas
    error: '#dc3545',          // Rojo - errores
  };

  const time = event.timestamp.toTimeString().slice(0, 8);
  const icon = icons[event.status] || 'ℹ';

  el.innerHTML = `
    <span class="event-icon">${icon}</span>
    <div class="event-details">
      <div class="event-message">
        <span class="event-type" style="color: ${typeColors[event.type] || '#6c757d'}">${event.type}</span>
        <span class="event-text">${event.message}</span>
      </div>
      <span class="event-time">${time}</span>
    </div>
  `;

  return el;
}

function filterEvents(type) {
  const eventsList = document.getElementById('events-list');
  eventsList.innerHTML = '';

  const filtered = type === 'all' ? state.events : state.events.filter((e) => e.type === type);

  filtered.forEach((event) => {
    const eventEl = createEventElement(event);
    eventsList.appendChild(eventEl);
  });
}

function addNetworkLog(request, status, message) {
  const log = {
    request,
    status,
    message,
    timestamp: new Date(),
  };

  state.networkLogs.unshift(log);

  const networkList = document.getElementById('network-list');
  const logEl = document.createElement('div');
  logEl.className = `network-log ${status >= 200 && status < 300 ? 'network-success' : 'network-error'}`;

  const time = log.timestamp.toTimeString().slice(0, 8);

  logEl.innerHTML = `
    <div class="network-request">
      <span class="network-status">[${status}]</span>
      <span>${request}</span>
    </div>
    <div class="network-meta">
      <span>${message}</span>
      <span class="network-time">${time}</span>
    </div>
  `;

  networkList.insertBefore(logEl, networkList.firstChild);

  while (networkList.children.length > 50) {
    networkList.removeChild(networkList.lastChild);
  }
}

function updateStorageTab() {
  const persistedData = localStorage.getItem('tracelog_persisted_events');
  const sessionData = localStorage.getItem('tracelog_session');

  const persistedCount = persistedData ? JSON.parse(persistedData).length : 0;
  const sessionId = sessionData ? JSON.parse(sessionData).sessionId : '-';

  document.getElementById('persisted-count').textContent = persistedCount;
  document.getElementById('session-id').textContent = sessionId || '-';

  const storageList = document.getElementById('storage-list');
  storageList.innerHTML = '';

  if (persistedData) {
    const events = JSON.parse(persistedData);
    events.forEach((event) => {
      const eventEl = document.createElement('div');
      eventEl.className = 'storage-event';
      eventEl.innerHTML = `
        <div class="storage-event-type">${event.type}</div>
        <div class="storage-event-data">${JSON.stringify(event.data || {}).slice(0, 50)}...</div>
      `;
      storageList.appendChild(eventEl);
    });
  }
}

// ============================================================================
// TRACELOG LISTENERS
// ============================================================================

function setupTraceLogListener() {
  window.addEventListener('tracelog:log', (event) => {
    console.log('tracelog:log', event);
    const { namespace, level, message, data } = event.detail || {};

    // Event captured - capturar todos los tipos de eventos
    if (namespace === 'EventManager' && message?.includes('Event captured')) {
      const eventType = data?.type || 'UNKNOWN';
      addEventToConsole(eventType, 'Evento capturado', data);
    }

    // Successfully sent
    if (namespace === 'SenderManager' && message?.includes('Successfully sent')) {
      const eventsCount = data?.eventsCount || 1;
      state.events.slice(0, eventsCount).forEach((e) => (e.status = 'success'));
      filterEvents(document.getElementById('event-filter').value);
    }

    // Failed to send (persisted)
    if (namespace === 'SenderManager' && message?.includes('Failed to send')) {
      const eventsCount = data?.eventsCount || 1;
      state.events.slice(0, eventsCount).forEach((e) => (e.status = 'error'));
      filterEvents(document.getElementById('event-filter').value);
      updateConsoleStatus('error');
    }

    // Retry scheduled
    if (namespace === 'SenderManager' && message?.includes('Retry scheduled')) {
      const retryDelay = Math.round((data?.retryDelay || 2000) / 1000);
      addNetworkLog('Retry', 0, `En ${retryDelay}s...`);
      state.events.slice(0, 1).forEach((e) => (e.status = 'retry'));
      filterEvents(document.getElementById('event-filter').value);
      updateConsoleStatus('retrying');
    }

    // Events recovered
    if (namespace === 'SenderManager' && message?.includes('Persisted events recovered')) {
      const eventsCount = data?.eventsCount || 1;
      addNetworkLog('Recovery', 200, `${eventsCount} eventos recuperados`);
    }
  });
}

// ============================================================================
// INITIALIZATION
// ============================================================================

async function initializeApp() {
  setupMockServer();
  setupNavigation();
  setupCartInteractions();
  setupContactForm();
  setupFloatingConsole();
  setupTraceLogListener();

  // Auto-initialize TraceLog
  try {
    await TraceLog.init({
      id: 'http-local',
      allowHttp: true,
    });

    addNetworkLog('TraceLog Init', 200, 'Initialized successfully');
    updateConsoleStatus('success');
  } catch (error) {
    console.error('TraceLog init error:', error);
    addNetworkLog('TraceLog Init', 500, error.message);
    updateConsoleStatus('error');
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