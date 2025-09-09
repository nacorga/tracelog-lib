import { TraceLog } from './tracelog.js';

// Make TraceLog available globally
window.TraceLog = TraceLog;

// Test state management
let currentConfig = { id: 'test' };
let isInitialized = false;
let qaMode = false;

// Utility functions
function updateStatus(elementId, status) {
    const element = document.querySelector(`[data-testid="${elementId}"]`);
    if (element) {
        element.textContent = status;
    }
}

function logToConsole(message, type = 'log') {
    console[type](`[E2E Test] ${message}`);
}

function getErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    if (error && typeof error === 'object' && error.message) {
        return error.message;
    }
    return 'Unknown error';
}

// Initialize TraceLog with default config
async function initializeTraceLog() {
    try {
        await TraceLog.init(currentConfig);
        isInitialized = true;
        updateStatus('init-status', 'Status: Initialized successfully');
        logToConsole('TraceLog initialized successfully');
        updateCurrentUrl();
    } catch (error) {
        const errorMessage = getErrorMessage(error);
        updateStatus('init-status', `Status: Initialization failed - ${errorMessage}`);
        logToConsole(`Error initializing TraceLog: ${errorMessage}`, 'error');
    }
}

function updateCurrentUrl() {
    const urlElement = document.getElementById('current-url-display');
    if (urlElement) {
        urlElement.textContent = window.location.href;
    }
}

// Event handlers for initialization tests
document.getElementById('init-valid')?.addEventListener('click', async () => {
    currentConfig = { id: 'test-valid-id', qaMode: qaMode };
    await initializeTraceLog();
});

document.getElementById('init-invalid')?.addEventListener('click', async () => {
    try {
        await TraceLog.init({ id: '' });
        updateStatus('init-status', 'Status: Should have failed but succeeded');
    } catch (error) {
        const errorMessage = getErrorMessage(error);
        updateStatus('init-status', `Status: Correctly failed - ${errorMessage}`);
        logToConsole(`Expected error caught: ${errorMessage}`);
    }
});

document.getElementById('init-duplicate')?.addEventListener('click', async () => {
    if (!isInitialized) {
        await initializeTraceLog();
    }
    // Try to initialize again
    try {
        await TraceLog.init({ id: 'duplicate-test' });
        updateStatus('init-status', 'Status: Duplicate init handled');
    } catch (error) {
        const errorMessage = getErrorMessage(error);
        updateStatus('init-status', `Status: Duplicate init error - ${errorMessage}`);
    }
});

document.getElementById('destroy-lib')?.addEventListener('click', () => {
    try {
        TraceLog.destroy();
        isInitialized = false;
        updateStatus('init-status', 'Status: Library destroyed');
        logToConsole('Library destroyed successfully');
    } catch (error) {
        const errorMessage = getErrorMessage(error);
        logToConsole(`Error destroying library: ${errorMessage}`, 'error');
    }
});

// Session management handlers
document.getElementById('start-session')?.addEventListener('click', () => {
    updateStatus('session-info', `Session Info: New session started at ${new Date().toLocaleTimeString()}`);
    logToConsole('New session started manually');
});

document.getElementById('end-session')?.addEventListener('click', () => {
    updateStatus('session-info', 'Session Info: Session ended manually');
    logToConsole('Session ended manually');
});

document.getElementById('simulate-timeout')?.addEventListener('click', () => {
    updateStatus('session-info', 'Session Info: Simulating timeout in 5 seconds');
    setTimeout(() => {
        updateStatus('session-info', 'Session Info: Session timeout simulated');
        logToConsole('Session timeout simulated');
    }, 5000);
});

// Custom event handlers
document.getElementById('send-custom-event')?.addEventListener('click', () => {
    const eventName = document.getElementById('event-name').value || 'test_event';
    let metadata = {};
    
    try {
        const metadataInput = document.getElementById('event-metadata').value;
        if (metadataInput) {
            metadata = JSON.parse(metadataInput);
        }
    } catch (error) {
        metadata = { error: 'Invalid JSON', originalInput: document.getElementById('event-metadata').value };
    }
    
    try {
        TraceLog.event(eventName, metadata);
        logToConsole(`Custom event sent: ${eventName}`, 'info');
    } catch (error) {
        const errorMessage = getErrorMessage(error);
        logToConsole(`Error sending custom event: ${errorMessage}`, 'error');
    }
});

document.getElementById('send-invalid-event')?.addEventListener('click', () => {
    try {
        TraceLog.event('', { test: 'invalid event name' });
    } catch (error) {
        const errorMessage = getErrorMessage(error);
        logToConsole(`Expected error for invalid event: ${errorMessage}`);
    }
});

document.getElementById('send-large-event')?.addEventListener('click', () => {
    const largeData = {
        largeString: 'x'.repeat(10000),
        largeArray: new Array(1000).fill('test'),
        timestamp: Date.now()
    };
    
    try {
        TraceLog.event('large_event_test', largeData);
        logToConsole('Large event sent successfully');
    } catch (error) {
        const errorMessage = getErrorMessage(error);
        logToConsole(`Error with large event: ${errorMessage}`, 'error');
    }
});

document.getElementById('send-xss-event')?.addEventListener('click', () => {
    const xssData = {
        maliciousScript: '<script>alert("xss")<\/script>',
        htmlContent: '<img src="x" onerror="alert(1)">',
        jsCode: 'javascript:alert("xss")'
    };
    
    try {
        TraceLog.event('xss_test_event', xssData);
        logToConsole('XSS test event sent (should be sanitized)');
    } catch (error) {
        const errorMessage = getErrorMessage(error);
        logToConsole(`XSS event error: ${errorMessage}`, 'error');
    }
});

// Scroll helpers
document.getElementById('scroll-to-25')?.addEventListener('click', () => {
    const scrollTarget = document.body.scrollHeight * 0.25;
    window.scrollTo({ top: scrollTarget, behavior: 'smooth' });
    logToConsole('Scrolling to 25%');
});

document.getElementById('scroll-to-50')?.addEventListener('click', () => {
    const scrollTarget = document.body.scrollHeight * 0.5;
    window.scrollTo({ top: scrollTarget, behavior: 'smooth' });
    logToConsole('Scrolling to 50%');
});

document.getElementById('scroll-to-100')?.addEventListener('click', () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    logToConsole('Scrolling to bottom');
});

// Navigation helpers
document.getElementById('history-push')?.addEventListener('click', () => {
    history.pushState({ test: true }, 'Test Page', '?test=push');
    updateCurrentUrl();
    logToConsole('History push state executed');
});

document.getElementById('history-replace')?.addEventListener('click', () => {
    history.replaceState({ test: true }, 'Test Page', '?test=replace');
    updateCurrentUrl();
    logToConsole('History replace state executed');
});

document.getElementById('hash-change')?.addEventListener('click', () => {
    window.location.hash = '#test-hash-' + Date.now();
    updateCurrentUrl();
    logToConsole('Hash changed');
});

document.getElementById('navigate-away')?.addEventListener('click', () => {
    logToConsole('Navigating away from page');
    setTimeout(() => {
        window.location.href = 'about:blank';
    }, 1000);
});

// Performance test handlers
document.getElementById('trigger-lcp')?.addEventListener('click', () => {
    const img = document.createElement('img');
    img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    img.style.width = '100px';
    img.style.height = '100px';
    document.body.appendChild(img);
    logToConsole('LCP element added');
});

document.getElementById('create-long-task')?.addEventListener('click', () => {
    logToConsole('Creating long task...');
    const start = performance.now();
    while (performance.now() - start < 100) {
        // Simulate long task
    }
    logToConsole('Long task completed');
});

document.getElementById('heavy-animation')?.addEventListener('click', () => {
    const element = document.getElementById('animation-element');
    element.classList.toggle('hidden');
    element.classList.toggle('performance-heavy');
    logToConsole('Heavy animation toggled');
});

// Error handlers
document.getElementById('js-error')?.addEventListener('click', () => {
    logToConsole('Triggering JavaScript error');
    // Intentionally cause an error
    window.nonExistentObject.someProperty;
});

document.getElementById('promise-rejection')?.addEventListener('click', () => {
    logToConsole('Triggering promise rejection');
    Promise.reject(new Error('Test promise rejection from E2E test'));
});

document.getElementById('network-error')?.addEventListener('click', () => {
    logToConsole('Triggering network error');
    fetch('/e2e-test-nonexistent-endpoint').catch(error => {
        const errorMessage = getErrorMessage(error);
        logToConsole(`Network error caught: ${errorMessage}`);
    });
});

document.getElementById('xhr-error')?.addEventListener('click', () => {
    logToConsole('Triggering XHR error');
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/e2e-test-xhr-error');
    xhr.onerror = () => logToConsole('XHR error occurred');
    xhr.send();
});

document.getElementById('pii-error')?.addEventListener('click', () => {
    logToConsole('Triggering error with PII data');
    try {
        throw new Error('Error containing email: user@example.com and phone: 555-123-4567');
    } catch (error) {
        console.error(error.message);
    }
});

// Storage handlers
document.getElementById('clear-storage')?.addEventListener('click', () => {
    localStorage.clear();
    updateStatus('storage-info', 'Storage Info: All storage cleared');
    logToConsole('Local storage cleared');
});

document.getElementById('check-storage')?.addEventListener('click', () => {
    const keys = Object.keys(localStorage);
    const traceLogKeys = keys.filter(key => key.startsWith('tl:'));
    updateStatus('storage-info', `Storage Info: ${traceLogKeys.length} TraceLog keys found`);
    logToConsole(`Storage check: ${traceLogKeys.length} TraceLog keys`);
});

// Multi-tab handlers
document.getElementById('open-new-tab')?.addEventListener('click', () => {
    window.open(window.location.href, '_blank');
    logToConsole('New tab opened');
});

// Security handlers
document.getElementById('test-xss-sanitization')?.addEventListener('click', () => {
    const xssInput = document.getElementById('xss-input').value;
    try {
        TraceLog.event('xss_sanitization_test', { 
            userInput: xssInput,
            timestamp: Date.now()
        });
        logToConsole('XSS sanitization test event sent');
    } catch (error) {
        const errorMessage = getErrorMessage(error);
        logToConsole(`XSS sanitization error: ${errorMessage}`, 'error');
    }
});

document.getElementById('test-pii-detection')?.addEventListener('click', () => {
    const piiData = {
        email: 'test@example.com',
        phone: '555-123-4567',
        ssn: '123-45-6789',
        creditCard: '4111-1111-1111-1111'
    };
    
    try {
        TraceLog.event('pii_detection_test', piiData);
        logToConsole('PII detection test event sent');
    } catch (error) {
        const errorMessage = getErrorMessage(error);
        logToConsole(`PII detection error: ${errorMessage}`, 'error');
    }
});

// Activity detection handlers
document.getElementById('simulate-activity')?.addEventListener('click', () => {
    // Simulate various activity types
    document.dispatchEvent(new Event('mousemove'));
    document.dispatchEvent(new KeyboardEvent('keypress', { key: 'a' }));
    updateStatus('activity-info', 'Activity Status: Activity simulated');
    logToConsole('User activity simulated');
});

// QA Mode toggle
document.getElementById('toggle-qa-mode')?.addEventListener('click', () => {
    qaMode = !qaMode;
    updateStatus('init-status', `Status: QA Mode ${qaMode ? 'enabled' : 'disabled'}`);
    logToConsole(`QA Mode ${qaMode ? 'enabled' : 'disabled'}`);
});

// Form handlers
document.getElementById('test-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    logToConsole('Form submitted');
});

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTraceLog);
} else {
    initializeTraceLog();
}

// Update URL display on changes
window.addEventListener('popstate', updateCurrentUrl);

// Set up visibility change handler for tab coordination testing
document.addEventListener('visibilitychange', () => {
    logToConsole(`Visibility changed: ${document.hidden ? 'hidden' : 'visible'}`);
});