// ============================================================================
// STATE MANAGEMENT
// ============================================================================

// Detect if running in E2E test environment (Playwright will initialize manually)
const urlParams = new URLSearchParams(window.location.search);
const isE2ETest = urlParams.get('auto-init') === 'false';

const state = {
  currentPage: 'inicio',
  cartCount: 0,
  queueCount: 0,
  lastSentTime: null,
  traceLogListenersAttached: false,
  autoInit: !isE2ETest, // Auto-init unless explicitly disabled
};

// ============================================================================
// TRACELOG HELPERS
// ============================================================================

// Helper function to access TraceLog public API
function getTraceLogInstance() {
  return window.tracelog;
}

// Helper function to send custom events using public API
function sendTraceLogEvent(eventName, eventData) {
  const traceLog = getTraceLogInstance();
  if (traceLog?.event) {
    return traceLog.event(eventName, eventData);
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
      const button = e.currentTarget;
      button.textContent = 'Añadido ✓';
      setTimeout(() => {
        button.textContent = 'Añadir al Carrito';
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
  const monitor = document.getElementById('floating-monitor');
  if (!monitor) return;

  const clearButton = document.getElementById('clear-events');
  if (clearButton) {
    clearButton.addEventListener('click', () => {
      clearEventsMonitor();
    });
  }

  const header = monitor.querySelector('.monitor-header');
  const events = monitor.querySelector('.monitor-events');
  if (!header || !events) return;

  ensureLastSentIndicator(monitor);

  let isMinimized = false;
  header.addEventListener('click', (e) => {
    const target = e.target;
    if (target instanceof HTMLElement && target.id === 'clear-events') return;

    isMinimized = !isMinimized;
    events.style.display = isMinimized ? 'none' : 'block';
    monitor.classList.toggle('minimized', isMinimized);
  });
}

function ensureLastSentIndicator(monitor) {
  const queueInfo = monitor.querySelector('.monitor-queue-info');
  if (!queueInfo) return;

  const existingIndicator = monitor.querySelector('#last-sent');
  if (existingIndicator instanceof HTMLElement) {
    existingIndicator.textContent = 'nunca';
    existingIndicator.className = 'last-sent-never';
    return;
  }

  const lastSentWrapper = document.createElement('span');
  lastSentWrapper.id = 'last-sent';
  lastSentWrapper.textContent = 'nunca';
  lastSentWrapper.className = 'last-sent-never';
  queueInfo.appendChild(lastSentWrapper);
}

function updateQueueStatus(status) {
  const statusEl = document.getElementById('queue-status');
  if (!statusEl) return;
  const statusMap = {
    'idle': { icon: '⏸', color: '#94a3b8' },
    'collecting': { icon: '📥', color: '#3b82f6' },
    'queued': { icon: '⏳', color: '#f59e0b' },
    'sending': { icon: '📤', color: '#8b5cf6' },
    'sent': { icon: '✅', color: '#10b981' },
    'error': { icon: '❌', color: '#ef4444' }
  };

  const config = statusMap[status] || { icon: status, color: '#6b7280' };
  statusEl.textContent = config.icon;
  statusEl.style.color = config.color;
}

function updateQueueCount(count) {
  state.queueCount = count;
  const queueEl = document.getElementById('queue-count');
  if (!queueEl) return;
  queueEl.textContent = count;

  // Visual feedback for queue size
  queueEl.className = count > 0 ? 'queue-active' : 'queue-empty';
}

function updateLastSent() {
  state.lastSentTime = Date.now();
  updateLastSentDisplay();
}

function updateLastSentDisplay() {
  const lastSentEl = document.getElementById('last-sent');
  if (!lastSentEl) return;

  if (!state.lastSentTime) {
    lastSentEl.textContent = 'nunca';
    lastSentEl.className = 'last-sent-never';
    return;
  }

  const secondsAgo = Math.floor((Date.now() - state.lastSentTime) / 1000);
  let displayText, className;

  if (secondsAgo < 1) {
    displayText = 'ahora';
    className = 'last-sent-now';
  } else if (secondsAgo < 60) {
    displayText = `${secondsAgo}s`;
    className = 'last-sent-recent';
  } else {
    const minutesAgo = Math.floor(secondsAgo / 60);
    displayText = `${minutesAgo}m`;
    className = 'last-sent-old';
  }

  lastSentEl.textContent = displayText;
  lastSentEl.className = className;
}

// Update the "last sent" display every second
setInterval(updateLastSentDisplay, 1000);

function addEventToMonitor(eventType, status = 'queued', eventData = null) {
  const eventsList = document.getElementById('events-list');
  if (!eventsList) return;

  const eventId = `event-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  const eventEl = document.createElement('div');
  eventEl.className = `monitor-event status-${status}`;
  eventEl.dataset.eventId = eventId;

  // Extract and format event details
  let eventDetails = '';
  let eventPayload = '';

  if (eventData) {
    if (eventData.custom_event) {
      eventDetails = eventData.custom_event.name;
      eventPayload = JSON.stringify(eventData.custom_event.metadata || {}, null, 2);
    } else if (eventData.click_data) {
      eventDetails = `${eventData.click_data.element || 'elemento'} (${eventData.click_data.x}, ${eventData.click_data.y})`;
      eventPayload = JSON.stringify(eventData.click_data, null, 2);
    } else if (eventData.scroll_data) {
      eventDetails = `${eventData.scroll_data.depth}% de profundidad`;
      eventPayload = JSON.stringify(eventData.scroll_data, null, 2);
    } else if (eventData.page_url) {
      try {
        const url = new URL(eventData.page_url);
        eventDetails = url.pathname + (url.hash || '');
      } catch {
        eventDetails = eventData.page_url;
      }
      eventPayload = JSON.stringify(eventData, null, 2);
    } else {
      eventPayload = JSON.stringify(eventData, null, 2);
    }
  }

  const timestamp = new Date().toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 1
  });

  const statusConfig = {
    'queued': { icon: '⏳', text: 'En cola', color: '#f59e0b' },
    'sending': { icon: '📤', text: 'Enviando', color: '#8b5cf6' },
    'sent': { icon: '✅', text: 'Enviado', color: '#10b981' },
    'error': { icon: '❌', text: 'Error', color: '#ef4444' }
  };

  const statusInfo = statusConfig[status] || statusConfig.queued;

  eventEl.innerHTML = `
    <div class="event-header">
      <div class="event-type-badge event-type-${eventType.toLowerCase()}">${eventType}</div>
      <div class="event-status" style="color: ${statusInfo.color}">
        <span class="event-status-icon">${statusInfo.icon}</span>
        <span class="event-status-text">${statusInfo.text}</span>
      </div>
      <div class="event-timestamp">${timestamp}</div>
    </div>
    <div class="event-details">
      ${eventDetails ? `<div class="event-summary">${eventDetails}</div>` : ''}
    </div>
    ${eventPayload ? `<div class="event-payload" style="display: none;"><pre><code>${eventPayload}</code></pre></div>` : ''}
  `;

  // Add click handler to toggle payload visibility
  eventEl.addEventListener('click', () => {
    const payload = eventEl.querySelector('.event-payload');
    if (payload) {
      const isVisible = payload.style.display !== 'none';
      payload.style.display = isVisible ? 'none' : 'block';
      eventEl.classList.toggle('expanded', !isVisible);
    }
  });

  eventsList.insertBefore(eventEl, eventsList.firstChild);

  // Mantener un máximo de 50 eventos para mejor rendimiento
  while (eventsList.children.length > 50) {
    eventsList.removeChild(eventsList.lastChild);
  }

  return eventId;
}

function updateEventStatus(eventId, newStatus, details = '') {
  const eventEl = document.querySelector(`[data-event-id="${eventId}"]`);
  if (!eventEl) return;

  const statusConfig = {
    'queued': { icon: '⏳', text: 'En cola', color: '#f59e0b' },
    'sending': { icon: '📤', text: 'Enviando', color: '#8b5cf6' },
    'sent': { icon: '✅', text: 'Enviado', color: '#10b981' },
    'error': { icon: '❌', text: 'Error', color: '#ef4444' }
  };

  const statusInfo = statusConfig[newStatus] || statusConfig.queued;

  // Update status visuals
  eventEl.className = `monitor-event status-${newStatus}`;
  const statusIcon = eventEl.querySelector('.event-status-icon');
  const statusText = eventEl.querySelector('.event-status-text');

  if (statusIcon) statusIcon.textContent = statusInfo.icon;
  if (statusText) statusText.textContent = statusInfo.text;

  const statusEl = eventEl.querySelector('.event-status');
  if (statusEl) statusEl.style.color = statusInfo.color;

  // Add details if error
  if (newStatus === 'error' && details) {
    let errorDetails = eventEl.querySelector('.event-error-details');
    if (!errorDetails) {
      errorDetails = document.createElement('div');
      errorDetails.className = 'event-error-details';
      eventEl.querySelector('.event-details').appendChild(errorDetails);
    }
    errorDetails.textContent = details;
  }
}

function updateEventsAsSent(eventIds) {
  if (Array.isArray(eventIds)) {
    eventIds.forEach(id => updateEventStatus(id, 'sent'));
  } else {
    // Legacy: update first N events if passed a count
    const eventsList = document.getElementById('events-list');
    if (!eventsList) return;

    const queuedEvents = eventsList.querySelectorAll('.status-queued, .status-sending');
    const count = Math.min(eventIds || 0, queuedEvents.length);

    for (let i = 0; i < count; i++) {
      const eventId = queuedEvents[i].dataset.eventId;
      updateEventStatus(eventId, 'sent');
    }
  }
}

function clearEventsMonitor() {
  const eventsList = document.getElementById('events-list');
  if (eventsList) {
    eventsList.innerHTML = '';
  }

  // Clear the event queue
  eventQueue.clear();

  // Reset queue info when clearing
  updateQueueCount(0);
  updateQueueStatus('idle');
  const lastSentEl = document.getElementById('last-sent');
  if (lastSentEl) {
    lastSentEl.textContent = 'nunca';
    lastSentEl.className = 'last-sent-never';
  }
}

// ============================================================================
// TRACELOG LISTENERS
// ============================================================================

// Global event queue for tracking events across listeners
const eventQueue = new Map();

function setupTraceLogListener(traceLog) {
  if (!traceLog || state.traceLogListenersAttached) return;

  // Event tracking
  traceLog.on('event', (eventData) => {
    const { type } = eventData;
    console.log('📥 TraceLog Event:', eventData);

    // Add to monitor and track
    const eventId = addEventToMonitor(type, 'queued', eventData);
    if (eventId) {
      eventQueue.set(eventId, { type, data: eventData, timestamp: Date.now() });
    }

    // Update queue count based on local queue size
    updateQueueCount(eventQueue.size);
    updateQueueStatus('collecting');
  });

  // Queue events - when events are sent or processed (BaseEventsQueueDto)
  traceLog.on('queue', (data) => {
    // data is a BaseEventsQueueDto: { user_id, session_id, device, events, global_metadata? }
    const eventCount = data.events ? data.events.length : 0;
    console.log('📤 TraceLog Queue:', data);

    // Mark events as sending immediately
    updateQueueStatus('sending');

    // Mark oldest events as sending
    const events = Array.from(eventQueue.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, eventCount);

    events.forEach(([eventId]) => {
      updateEventStatus(eventId, 'sending');
    });

    // Mark them as sent and remove from queue immediately
    events.forEach(([eventId]) => {
      updateEventStatus(eventId, 'sent');
      eventQueue.delete(eventId);
    });

    // Update queue count based on remaining events in local queue
    updateQueueCount(eventQueue.size);
    updateQueueStatus('idle');
    updateLastSent();
  });

  state.traceLogListenersAttached = true;
}

// ============================================================================
// INITIALIZATION
// ============================================================================

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
  setupNavigation();
  setupCartInteractions();
  setupContactForm();
  setupFloatingMonitor();

  try {
    const traceLog = await waitForTraceLogReady();

    // Auto-init if enabled (normal playground use with visual monitor)
    if (state.autoInit) {
      // Clear only TraceLog data from localStorage to ensure fresh session (demo mode)
      // This preserves any other localStorage data from other apps on the same domain
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('tlog')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      setupTraceLogListener(traceLog); // Setup listeners BEFORE init to capture initial events
      await traceLog.init();
      updateQueueStatus('idle');
      return;
    }

    updateQueueStatus('idle');
  } catch (error) {
    updateQueueStatus('error');
  }
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}