import { TraceLog } from '../../tracelog.js';

// Configuration constants
const DEFAULT_CONFIG = { id: 'test' }; // IMPORTANT: ID for testing. Don't change this value.
const STATUS_ELEMENT_ID = 'init-status';
const READY_STATUS = 'Status: Ready for testing';
const SUCCESS_STATUS = 'Status: Initialized successfully';

// Make TraceLog available globally
window.TraceLog = TraceLog;

// Utility functions with improved error handling
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

// State management
let currentConfig = DEFAULT_CONFIG;
let isInitialized = false;

/**
 * Initialize TraceLog with enhanced error handling and status management
 */
window.initializeTraceLog = async function(config = currentConfig) {
    try {
        await TraceLog.init(config);
        isInitialized = true;
        updateStatus(STATUS_ELEMENT_ID, SUCCESS_STATUS);
        logToConsole('TraceLog initialized successfully');
        return { success: true, error: null };
    } catch (error) {
        isInitialized = false;
        const errorMessage = getErrorMessage(error);
        const failureStatus = `Status: Initialization failed - ${errorMessage}`;
        updateStatus(STATUS_ELEMENT_ID, failureStatus);
        logToConsole(`Error initializing TraceLog: ${errorMessage}`, 'error');
        return { success: false, error: errorMessage };
    }
};

/**
 * Expose utilities globally for test access
 */
window.updateStatus = updateStatus;
window.logToConsole = logToConsole;
window.getErrorMessage = getErrorMessage;
window.getCurrentConfig = () => currentConfig;
window.isCurrentlyInitialized = () => isInitialized;

/**
 * Initialize page when DOM is ready (improved with constants)
 */
document.addEventListener('DOMContentLoaded', () => {
    updateStatus(STATUS_ELEMENT_ID, READY_STATUS);
    logToConsole('Test page loaded and ready');
});