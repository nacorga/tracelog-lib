// TraceLog Page Unload Test Script
import { TraceLog } from '../../tracelog.js';

// Make TraceLog available globally
// Testing utilities will be auto-injected as __traceLogTestBridge
window.TraceLog = TraceLog;

let traceLogInstance = null;
let sessionStarted = false;
let eventCounter = 0;

// Console logging utility
function logToConsole(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const logElement = document.querySelector('[data-testid="console-log"]');
  const className = type === 'error' ? 'error' : type === 'success' ? 'success' : '';

  logElement.innerHTML += `<div class="${className}">[${timestamp}] ${message}</div>`;
  logElement.scrollTop = logElement.scrollHeight;

  // Also log to browser console for debugging
  console.log(`[Page Unload Test] ${message}`);
}

// Initialize TraceLog
async function initializeTraceLog(config = { id: 'page-unload-test', qaMode: true }) {
  try {
    logToConsole('Initializing TraceLog...');

    if (typeof TraceLog === 'undefined') {
      throw new Error('TraceLog not available');
    }

    await TraceLog.init(config);
    traceLogInstance = TraceLog;

    logToConsole('TraceLog initialized successfully', 'success');
    updateInitStatus('Initialized');
    return { success: true, error: null };
  } catch (error) {
    logToConsole(`TraceLog initialization failed: ${error.message}`, 'error');
    updateInitStatus(`Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Update initialization status
function updateInitStatus(status) {
  const statusElement = document.querySelector('[data-testid="init-status"]');
  statusElement.textContent = `Status: ${status}`;
}

// Start session
function startSession() {
  if (!traceLogInstance) {
    logToConsole('TraceLog not initialized', 'error');
    return;
  }

  try {
    // Trigger activity to start session
    triggerActivity();
    sessionStarted = true;
    logToConsole('Session started via activity trigger', 'success');
    updateSessionInfo();
  } catch (error) {
    logToConsole(`Failed to start session: ${error.message}`, 'error');
  }
}

// Trigger user activity
function triggerActivity() {
  if (!traceLogInstance) {
    logToConsole('TraceLog not initialized', 'error');
    return;
  }

  try {
    // Simulate click event to trigger activity
    document.body.click();
    logToConsole('Activity triggered (click simulation)', 'success');
    updateSessionInfo();
  } catch (error) {
    logToConsole(`Failed to trigger activity: ${error.message}`, 'error');
  }
}

// End session manually
function endSessionManual() {
  if (!traceLogInstance) {
    logToConsole('TraceLog not initialized', 'error');
    return;
  }

  try {
    // Access internal session manager if available for testing
    const app = traceLogInstance._app;
    if (app && app.sessionHandler && app.sessionHandler.sessionManager) {
      const result = app.sessionHandler.sessionManager.endSessionSafely('manual_stop');
      logToConsole(`Manual session end result: ${JSON.stringify(result)}`, 'success');
    } else {
      logToConsole('Session manager not accessible for manual end', 'error');
    }
    updateSessionInfo();
  } catch (error) {
    logToConsole(`Failed to end session manually: ${error.message}`, 'error');
  }
}

// Track custom event
function trackCustomEvent() {
  if (!traceLogInstance) {
    logToConsole('TraceLog not initialized', 'error');
    return;
  }

  try {
    eventCounter++;
    const eventData = {
      event_name: 'page_unload_test_event',
      event_id: eventCounter,
      timestamp: Date.now(),
    };

    traceLogInstance.event('custom_event', eventData);
    logToConsole(`Custom event tracked: ${JSON.stringify(eventData)}`, 'success');
    updateSessionInfo();
  } catch (error) {
    logToConsole(`Failed to track custom event: ${error.message}`, 'error');
  }
}

// Flush events
function flushEvents() {
  if (!traceLogInstance) {
    logToConsole('TraceLog not initialized', 'error');
    return;
  }

  try {
    const app = traceLogInstance._app;
    if (app && app.eventManager) {
      app.eventManager.flushImmediately().then((success) => {
        logToConsole(`Events flushed: ${success}`, success ? 'success' : 'error');
        updateSessionInfo();
      });
    } else {
      logToConsole('Event manager not accessible for flush', 'error');
    }
  } catch (error) {
    logToConsole(`Failed to flush events: ${error.message}`, 'error');
  }
}

// Update session info display
function updateSessionInfo() {
  if (!traceLogInstance) {
    document.getElementById('session-id').textContent = 'Not initialized';
    document.getElementById('session-active').textContent = 'false';
    document.getElementById('events-queued').textContent = '0';
    document.getElementById('last-event').textContent = 'None';
    return;
  }

  try {
    const app = traceLogInstance._app;

    // Get session ID
    const sessionId = app && app.sessionHandler ? app.sessionHandler.get('sessionId') || 'None' : 'Unknown';
    document.getElementById('session-id').textContent = sessionId;

    // Get session active status
    const isActive =
      app && app.sessionHandler && app.sessionHandler.sessionManager
        ? app.sessionHandler.sessionManager.isSessionActive
        : false;
    document.getElementById('session-active').textContent = isActive.toString();

    // Get events queue length
    const queueLength = app && app.eventManager ? app.eventManager.getQueueLength() : 0;
    document.getElementById('events-queued').textContent = queueLength.toString();

    // Update last event
    document.getElementById('last-event').textContent = new Date().toLocaleTimeString();
  } catch (error) {
    logToConsole(`Failed to update session info: ${error.message}`, 'error');
  }
}

// Navigation functions for testing page unload
function navigateAway() {
  logToConsole('Navigating away (will trigger page unload)...', 'info');
  // Give a moment for the log to appear before navigation
  setTimeout(() => {
    window.location.href = 'about:blank';
  }, 100);
}

function navigateToSecondPage() {
  logToConsole('Navigating to second page (will trigger page unload)...', 'info');
  setTimeout(() => {
    window.location.href = './second-page.html';
  }, 100);
}

function reloadPage() {
  logToConsole('Reloading page (will trigger page unload)...', 'info');
  setTimeout(() => {
    window.location.reload();
  }, 100);
}

function closeWindow() {
  logToConsole('Attempting to close window (will trigger page unload)...', 'info');
  setTimeout(() => {
    window.close();
  }, 100);
}

// Set up page unload monitoring for testing
function setupPageUnloadMonitoring() {
  let unloadStarted = false;

  const logUnloadEvent = (eventType) => {
    if (unloadStarted) return;
    unloadStarted = true;

    logToConsole(`Page unload detected: ${eventType}`, 'info');

    // Try to get final session info
    try {
      updateSessionInfo();

      if (traceLogInstance && traceLogInstance._app) {
        const app = traceLogInstance._app;
        const sessionId = app.sessionHandler ? app.sessionHandler.get('sessionId') : null;
        const queueLength = app.eventManager ? app.eventManager.getQueueLength() : 0;

        logToConsole(`Final state - Session: ${sessionId}, Queue: ${queueLength}`, 'info');
      }
    } catch (error) {
      logToConsole(`Error getting final state: ${error.message}`, 'error');
    }
  };

  // Monitor all unload events
  window.addEventListener('beforeunload', () => logUnloadEvent('beforeunload'));
  window.addEventListener('pagehide', () => logUnloadEvent('pagehide'));
  window.addEventListener('unload', () => logUnloadEvent('unload'));

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      logUnloadEvent('visibilitychange-hidden');
    }
  });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  logToConsole('Page loaded, setting up monitoring...', 'info');
  setupPageUnloadMonitoring();

  // Auto-update session info every 2 seconds
  setInterval(updateSessionInfo, 2000);
});

// Make initializeTraceLog available globally first
window.initializeTraceLog = initializeTraceLog;

// Global functions for testing
window.startSession = startSession;
window.triggerActivity = triggerActivity;
window.endSessionManual = endSessionManual;
window.trackCustomEvent = trackCustomEvent;
window.flushEvents = flushEvents;
window.updateSessionInfo = updateSessionInfo;
window.navigateAway = navigateAway;
window.navigateToSecondPage = navigateToSecondPage;
window.reloadPage = reloadPage;
window.closeWindow = closeWindow;
