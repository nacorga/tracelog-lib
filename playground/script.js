// Global state
let isInitialized = false;
let eventCount = 0;
let realEventCount = 0;

// DOM elements
const statusIndicator = document.getElementById('status-indicator');
const initBtn = document.getElementById('init-btn');
const destroyBtn = document.getElementById('destroy-btn');
const customEventName = document.getElementById('custom-event-name');
const sendCustomEventBtn = document.getElementById('send-custom-event');
const logContent = document.getElementById('log-content');
const clearLogsBtn = document.getElementById('clear-logs');
const alertsContainer = document.getElementById('alerts-container');

// Real-time events DOM elements
const realTimeContent = document.getElementById('real-time-content');
const realEventCounter = document.getElementById('real-event-counter');
const clearRealEventsBtn = document.getElementById('clear-real-events');

// Mock server setup
let mockServerEnabled = true;
const originalFetch = window.fetch;

function setupMockServer() {
    if (!mockServerEnabled) {
        window.fetch = originalFetch;
        return;
    }

    window.fetch = function(url, options) {
        // Mock config endpoint
        if (url.includes('/config')) {
            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({
                    samplingRate: 1,
                    tags: [],
                    excludedUrlPaths: [],
                    ipExcluded: false
                })
            });
        }

        // Mock events endpoint
        if (url.includes('/events') && options?.method === 'POST') {
            // Simulate network delay
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve({
                        ok: true,
                        status: 200,
                        json: () => Promise.resolve({ success: true })
                    });
                }, 100 + Math.random() * 200);
            });
        }

        // Fallback to original fetch for other requests
        return originalFetch(url, options);
    };
}

// Initialize mock server
setupMockServer();

// Update UI state
function updateStatus(initialized) {
    isInitialized = initialized;

    if (initialized) {
        statusIndicator.textContent = 'Initialized';
        statusIndicator.className = 'status-indicator status-initialized';
        initBtn.disabled = true;
        destroyBtn.disabled = false;
        customEventName.disabled = false;
        sendCustomEventBtn.disabled = false;
    } else {
        statusIndicator.textContent = 'Not Initialized';
        statusIndicator.className = 'status-indicator status-not-initialized';
        initBtn.disabled = false;
        destroyBtn.disabled = true;
        customEventName.disabled = true;
        sendCustomEventBtn.disabled = true;
    }
}

// Show alert
function showAlert(message, type = 'warning') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alertsContainer.appendChild(alert);

    setTimeout(() => {
        if (alert.parentNode) {
            alert.parentNode.removeChild(alert);
        }
    }, 5000);
}

// Log event to console
function logEvent(eventType, data) {
    eventCount++;
    const timestamp = new Date().toLocaleTimeString();

    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.innerHTML = `
        <div class="log-timestamp">[${timestamp}] Event #${eventCount}</div>
        <div><strong>Type:</strong> ${eventType}</div>
        <div><strong>Data:</strong> ${JSON.stringify(data, null, 2)}</div>
    `;

    logContent.appendChild(logEntry);
    logContent.scrollTop = logContent.scrollHeight;
}

// Log real-time event from TraceLog dispatchEvent
function logRealTimeEvent(eventData) {
    realEventCount++;
    const timestamp = new Date().toLocaleTimeString();

    const realEventEntry = document.createElement('div');
    realEventEntry.className = 'real-event-entry';

    // Extract key information from TraceLog event
    const level = eventData.level || 'INFO';
    const namespace = eventData.namespace || 'Unknown';
    const message = eventData.message || '';
    const data = eventData.data;

    // Create display content
    let displayContent = `${level}: ${namespace}`;
    if (message) {
        displayContent += `\n${message}`;
    }
    if (data) {
        displayContent += `\n${JSON.stringify(data, null, 2)}`;
    }

    realEventEntry.innerHTML = `
        <div class="real-event-type">${level} - ${namespace}</div>
        <div class="real-event-time">${timestamp}</div>
        <div class="real-event-data">${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}</div>
    `;

    // Insert at the beginning (most recent first)
    realTimeContent.insertBefore(realEventEntry, realTimeContent.firstChild);

    // Reset scroll to top to show the latest event
    realTimeContent.scrollTop = 0;

    // Update counter
    realEventCounter.textContent = realEventCount;
}

// Setup real-time event listener for TraceLog dispatchEvent
function setupRealTimeEventListener() {
    // Listen for TraceLog QA events dispatched by the library
    window.addEventListener('tracelog:qa', (event) => {
        if (event.detail) {
            logRealTimeEvent(event.detail);
        }
    });
}

// Get configuration from form
function getConfig() {
    const projectId = document.getElementById('project-id').value;
    const sessionTimeout = parseInt(document.getElementById('session-timeout').value);
    const globalMetadataText = document.getElementById('global-metadata').value;
    mockServerEnabled = document.getElementById('mock-server').checked;

    let globalMetadata = {};
    if (globalMetadataText.trim()) {
        try {
            globalMetadata = JSON.parse(globalMetadataText);
        } catch (e) {
            throw new Error('Invalid JSON in Global Metadata field');
        }
    }

    return {
        id: projectId,
        mode: 'qa', // Always use QA mode to see dispatchEvent
        sessionTimeout: sessionTimeout,
        globalMetadata: globalMetadata,
        allowHttp: true // Allow HTTP for local testing
    };
}

// Event handlers
initBtn.addEventListener('click', async () => {
    try {
        setupMockServer();
        const config = getConfig();

        showAlert('Initializing TraceLog...', 'warning');

        await TraceLog.init(config);

        updateStatus(true);
        showAlert('TraceLog initialized successfully!', 'success');
        logEvent('INIT', config);

    } catch (error) {
        showAlert(`Initialization failed: ${error.message}`, 'error');
        console.error('TraceLog initialization error:', error);
    }
});

destroyBtn.addEventListener('click', () => {
    try {
        TraceLog.destroy();
        updateStatus(false);
        showAlert('TraceLog destroyed successfully!', 'success');
        logEvent('DESTROY', {});
    } catch (error) {
        showAlert(`Destroy failed: ${error.message}`, 'error');
        console.error('TraceLog destroy error:', error);
    }
});

sendCustomEventBtn.addEventListener('click', () => {
    const eventName = customEventName.value.trim();
    if (!eventName) {
        showAlert('Please enter an event name', 'warning');
        return;
    }

    try {
        const eventData = {
            name: eventName,
            timestamp: Date.now(),
            source: 'playground'
        };

        TraceLog.event(eventName, eventData);
        logEvent('CUSTOM', { name: eventName, data: eventData });
        showAlert(`Custom event "${eventName}" sent!`, 'success');

        // Clear the input
        customEventName.value = '';
    } catch (error) {
        showAlert(`Failed to send custom event: ${error.message}`, 'error');
        console.error('Custom event error:', error);
    }
});

clearLogsBtn.addEventListener('click', () => {
    logContent.innerHTML = '';
    eventCount = 0;
});

// Clear real-time events
clearRealEventsBtn.addEventListener('click', () => {
    realTimeContent.innerHTML = '';
    realEventCount = 0;
    realEventCounter.textContent = '0';
});

// Demo element event listeners
document.getElementById('demo-click').addEventListener('click', () => {
    if (isInitialized) {
        logEvent('DEMO_CLICK', { target: 'demo-click-button' });
    }
});

document.getElementById('demo-input').addEventListener('input', (e) => {
    if (isInitialized) {
        logEvent('DEMO_INPUT', { value: e.target.value, length: e.target.value.length });
    }
});

// Handle mock server checkbox
document.getElementById('mock-server').addEventListener('change', (e) => {
    mockServerEnabled = e.target.checked;
    setupMockServer();

    if (mockServerEnabled) {
        showAlert('Mock server enabled - API calls will be simulated', 'success');
    } else {
        showAlert('Mock server disabled - real API calls will be made', 'warning');
    }
});

// Auto-fill some demo metadata
document.getElementById('global-metadata').value = JSON.stringify({
    environment: 'playground',
    version: '1.0.0',
    user_type: 'developer'
}, null, 2);

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 'i':
                e.preventDefault();
                if (!isInitialized) initBtn.click();
                break;
            case 'd':
                e.preventDefault();
                if (isInitialized) destroyBtn.click();
                break;
            case 'l':
                e.preventDefault();
                clearLogsBtn.click();
                break;
        }
    }
});

// Initialize real-time event listener
setupRealTimeEventListener();

// Show keyboard shortcuts info
showAlert('Keyboard shortcuts: Ctrl/Cmd + I (Init), Ctrl/Cmd + D (Destroy), Ctrl/Cmd + L (Clear logs)', 'success');

// Initialize UI state
updateStatus(false);