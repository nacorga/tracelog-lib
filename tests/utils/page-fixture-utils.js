/**
 * Shared utilities for test page fixtures
 * These functions are used across different test pages to eliminate duplication
 */

/**
 * Error handling utilities
 */
export function getErrorMessage(error) {
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
 * DOM manipulation utilities
 */
export function updateStatus(elementId, status, isError = false) {
    const element = document.querySelector(`[data-testid="${elementId}"]`);
    if (element) {
        element.textContent = status;
        
        // Handle error/success styling if element supports it
        if (element.className) {
            element.className = element.className.replace(/\b(error|success)\b/g, '');
            element.classList.add(isError ? 'error' : 'success');
        }
    }
}

/**
 * Console logging utilities
 */
export function createLogger(prefix = 'E2E Test') {
    return {
        log: (message, type = 'log') => {
            console[type](`[${prefix}] ${message}`);
        },
        info: (message) => {
            console.info(`[${prefix}] ${message}`);
        },
        error: (message) => {
            console.error(`[${prefix}] ${message}`);
        },
        warn: (message) => {
            console.warn(`[${prefix}] ${message}`);
        }
    };
}

export function createTimestampedLogger(prefix = 'E2E Test') {
    return {
        log: (message, type = 'info') => {
            const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
            const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
            console[type](logEntry);
            
            // Also display in console div if available
            const consoleDiv = document.querySelector('[data-testid="console-log"]');
            if (consoleDiv) {
                consoleDiv.innerHTML += `<div class="${type}">${logEntry}</div>`;
                consoleDiv.scrollTop = consoleDiv.scrollHeight;
            }
        }
    };
}

/**
 * TraceLog specific utilities
 */
export function makeTraceLogGlobal(TraceLog) {
    if (typeof window !== 'undefined') {
        window.TraceLog = TraceLog;
    }
}

export function createTraceLogInitializer(defaultConfig = { id: 'test' }) {
    return async function(config = defaultConfig) {
        try {
            await window.TraceLog.init(config);
            return { success: true, error: null };
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            return { success: false, error: errorMessage };
        }
    };
}

/**
 * Test execution utilities
 */
export function createTestRunner(logger, updateStatusFn) {
    return {
        async runTest(testName, testFunction, statusElementId) {
            logger.log(`Testing ${testName}...`);
            updateStatusFn(statusElementId, `Testing: ${testName}`);
            
            try {
                const result = await testFunction();
                
                if (result.success) {
                    logger.log(`SUCCESS: ${testName} passed`);
                    updateStatusFn(statusElementId, `PASS: ${testName}`, false);
                } else {
                    logger.log(`EXPECTED FAILURE: ${testName} - ${result.error}`);
                    updateStatusFn(statusElementId, `PASS: ${testName} (expected failure)`, false);
                }
                
                return result;
            } catch (error) {
                const errorMessage = getErrorMessage(error);
                logger.error(`UNEXPECTED ERROR: ${testName} - ${errorMessage}`);
                updateStatusFn(statusElementId, `FAIL: ${testName} - ${errorMessage}`, true);
                return { success: false, error: errorMessage };
            }
        }
    };
}

/**
 * DOMContentLoaded handler factory
 */
export function createDOMReadyHandler(readyMessage = 'Test page loaded and ready', statusElementId = null, readyStatus = null) {
    return function() {
        const logger = createLogger();
        logger.log(readyMessage);
        
        if (statusElementId && readyStatus) {
            updateStatus(statusElementId, readyStatus);
        }
    };
}