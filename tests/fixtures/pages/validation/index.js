import { TraceLog } from '../../tracelog.js';

// Configuration constants
const STATUS_ELEMENT_ID = 'validation-status';
const READY_STATUS = 'Ready for validation testing';
const VALID_TEST_CONFIG = { id: 'test' };

// Make TraceLog available globally for testing
window.TraceLog = TraceLog;

// Enhanced console logging utility with timestamps
function logToConsole(message, type = 'info') {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    
    console[type](logEntry);
    
    // Also display in the UI
    const consoleDiv = document.querySelector('[data-testid="console-log"]');
    if (consoleDiv) {
        consoleDiv.innerHTML += `<div class="${type}">${logEntry}</div>`;
        consoleDiv.scrollTop = consoleDiv.scrollHeight;
    }
}

// Enhanced update status utility with error styling
function updateStatus(elementId, message, isError = false) {
    const element = document.querySelector(`[data-testid="${elementId}"]`);
    if (element) {
        element.textContent = message;
        element.className = element.className.replace(/\b(error|success)\b/g, '');
        element.classList.add(isError ? 'error' : 'success');
    }
}

// Enhanced error message extraction
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

/**
 * Validation test functions using clean patterns
 */
class ValidationTests {
    static async testNoProjectId() {
        const testName = 'No Project ID';
        logToConsole(`Testing initialization without project ID...`);
        updateStatus(STATUS_ELEMENT_ID, `Testing: ${testName}`);
        
        try {
            await TraceLog.init({});
            logToConsole('ERROR: Should have failed but succeeded', 'error');
            updateStatus(STATUS_ELEMENT_ID, `FAIL: Validation did not catch missing project ID`, true);
            return { success: true, error: null };
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            logToConsole(`SUCCESS: Caught expected error: ${errorMessage}`);
            updateStatus(STATUS_ELEMENT_ID, `PASS: Validation caught missing project ID - ${errorMessage}`);
            return { success: false, error: errorMessage };
        }
    }

    static async testEmptyProjectId() {
        const testName = 'Empty Project ID';
        logToConsole('Testing initialization with empty project ID...');
        updateStatus(STATUS_ELEMENT_ID, `Testing: ${testName}`);
        
        try {
            await TraceLog.init({ id: '' });
            logToConsole('ERROR: Should have failed but succeeded', 'error');
            updateStatus(STATUS_ELEMENT_ID, 'FAIL: Validation did not catch empty project ID', true);
            return { success: true, error: null };
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            logToConsole(`SUCCESS: Caught expected error: ${errorMessage}`);
            updateStatus(STATUS_ELEMENT_ID, `PASS: Validation caught empty project ID - ${errorMessage}`);
            return { success: false, error: errorMessage };
        }
    }

    static async testValidProjectId() {
        const testName = 'Valid Project ID';
        logToConsole('Testing initialization with valid project ID...');
        updateStatus(STATUS_ELEMENT_ID, `Testing: ${testName}`);
        
        try {
            // Check if already initialized (from previous tests)
            const wasAlreadyInitialized = TraceLog.isInitialized();
            
            await TraceLog.init(VALID_TEST_CONFIG);
            
            // Check if it's now initialized (should be true either way)
            const isInitialized = TraceLog.isInitialized();
            
            if (isInitialized) {
                const statusMessage = wasAlreadyInitialized 
                    ? 'PASS: Valid project ID accepted (already initialized)'
                    : 'PASS: Valid project ID accepted';
                    
                const logMessage = wasAlreadyInitialized
                    ? 'SUCCESS: Valid project ID accepted (was already initialized)'
                    : 'SUCCESS: Valid project ID accepted';
                    
                logToConsole(logMessage);
                updateStatus(STATUS_ELEMENT_ID, statusMessage);
                return { success: true, error: null };
            } else {
                logToConsole('ERROR: Initialization did not complete properly', 'error');
                updateStatus(STATUS_ELEMENT_ID, 'FAIL: Initialization did not complete', true);
                return { success: false, error: 'Initialization did not complete' };
            }
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            logToConsole(`ERROR: Valid project ID was rejected: ${errorMessage}`, 'error');
            updateStatus(STATUS_ELEMENT_ID, `FAIL: Valid project ID rejected - ${errorMessage}`, true);
            return { success: false, error: errorMessage };
        }
    }
}

// Expose test functions globally for backward compatibility
window.testNoProjectId = ValidationTests.testNoProjectId;
window.testEmptyProjectId = ValidationTests.testEmptyProjectId;
window.testValidProjectId = ValidationTests.testValidProjectId;

/**
 * Initialize page when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    logToConsole('Validation test page loaded and ready');
    updateStatus(STATUS_ELEMENT_ID, READY_STATUS);
});