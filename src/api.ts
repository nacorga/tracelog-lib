import { App } from './app';
import { MetadataType } from './types/common.types';
import { AppConfig } from './types/config.types';
import { debugLog } from './utils/logging';
import { validateAndNormalizeConfig } from './utils/validations';
import { INITIALIZATION_CONSTANTS } from './constants';
import './types/window.types';
import { TraceLogTestBridge } from './types/window.types';
import { InitializationTimeoutError } from './types/validation-error.types';

export * as Types from './app.types';
export * as Constants from './app.constants';

let app: App | null = null;
let isInitializing = false;
let isDestroying = false;

/**
 * Initializes the tracelog app with the provided configuration.
 * If already initialized, this function returns early without error.
 * @param appConfig - The configuration object for the app
 * @throws {Error} If initialization is currently in progress
 * @example
 * await init({ id: 'my-project-id' });
 */
export const init = async (appConfig: AppConfig): Promise<void> => {
  try {
    debugLog.info('API', 'Library initialization started', { id: appConfig.id });

    if (typeof window === 'undefined' || typeof document === 'undefined') {
      debugLog.clientError(
        'API',
        'Browser environment required - this library can only be used in a browser environment',
        {
          hasWindow: typeof window !== 'undefined',
          hasDocument: typeof document !== 'undefined',
        },
      );

      throw new Error('This library can only be used in a browser environment');
    }

    if (app) {
      debugLog.debug('API', 'Library already initialized, skipping duplicate initialization', {
        projectId: appConfig.id,
      });

      return;
    }

    if (isInitializing) {
      debugLog.debug('API', 'Concurrent initialization detected, waiting for completion', { projectId: appConfig.id });

      const maxRetries = INITIALIZATION_CONSTANTS.MAX_CONCURRENT_RETRIES;
      const retryDelay = INITIALIZATION_CONSTANTS.CONCURRENT_RETRY_DELAY_MS;
      const globalTimeout = INITIALIZATION_CONSTANTS.INITIALIZATION_TIMEOUT_MS;

      const retryPromise = (async (): Promise<number> => {
        let retries = 0;

        while (isInitializing && retries < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          retries++;
        }

        return retries;
      })();

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(
            new InitializationTimeoutError(
              `Initialization exceeded ${globalTimeout}ms timeout - concurrent initialization took too long`,
              globalTimeout,
            ),
          );
        }, globalTimeout);
      });

      try {
        const retries = await Promise.race([retryPromise, timeoutPromise]);

        if (app) {
          debugLog.debug('API', 'Concurrent initialization completed successfully', {
            projectId: appConfig.id,
            retriesUsed: retries,
          });

          return;
        }

        if (isInitializing) {
          debugLog.error('API', 'Initialization timeout - concurrent initialization took too long', {
            projectId: appConfig.id,
            retriesUsed: retries,
            maxRetries,
          });

          throw new Error('App initialization timeout - concurrent initialization took too long');
        }
      } catch (error) {
        if (error instanceof InitializationTimeoutError) {
          debugLog.error('API', 'Initialization global timeout exceeded', {
            projectId: appConfig.id,
            timeoutMs: globalTimeout,
          });
        }

        throw error;
      }
    }

    isInitializing = true;

    debugLog.debug('API', 'Validating and normalizing configuration', { projectId: appConfig.id });
    const validatedConfig = validateAndNormalizeConfig(appConfig);

    debugLog.debug('API', 'Creating App instance', { projectId: validatedConfig.id });
    const instance = new App();

    await instance.init(validatedConfig);

    app = instance;

    debugLog.info('API', 'Library initialization completed successfully', {
      projectId: validatedConfig.id,
    });
  } catch (error) {
    // Ensure complete cleanup on initialization failure
    if (app && !app.initialized) {
      try {
        await app.destroy();
      } catch (cleanupError) {
        debugLog.warn('API', 'Failed to cleanup partially initialized app', { cleanupError });
      }
    }

    app = null;

    debugLog.error('API', 'Initialization failed', { error });

    throw error;
  } finally {
    isInitializing = false;
  }
};

/**
 * Sends a custom event with the specified name and metadata.
 * @param name - The name of the custom event.
 * @param metadata - Optional metadata to attach to the event.
 * @example
 * // Send a custom event with metadata
 * event('user_signup', { method: 'email', plan: 'premium' });
 * @example
 * // Send a custom event without metadata
 * event('user_login');
 * @remarks
 * This function should be called after the app has been initialized using the `init` function.
 */
export const event = (name: string, metadata?: Record<string, MetadataType>): void => {
  try {
    if (!app) {
      debugLog.clientError('API', 'Custom event failed - Library not initialized. Please call TraceLog.init() first', {
        eventName: name,
        hasMetadata: !!metadata,
      });
      throw new Error('App not initialized');
    }

    debugLog.debug('API', 'Sending custom event', {
      eventName: name,
      hasMetadata: !!metadata,
      metadataKeys: metadata ? Object.keys(metadata) : [],
    });
    app.sendCustomEvent(name, metadata);
  } catch (error) {
    debugLog.error('API', 'Event tracking failed', { eventName: name, error, hasMetadata: !!metadata });

    if (
      error instanceof Error &&
      (error.message === 'App not initialized' || error.message.includes('validation failed'))
    ) {
      throw error;
    }
  }
};

/**
 * Checks if the app has been initialized.
 * @returns true if the app is initialized, false otherwise
 */
export const isInitialized = (): boolean => {
  return app !== null;
};

/**
 * Gets the current initialization status for debugging purposes.
 * @returns Object with detailed initialization state
 */
export const getInitializationStatus = (): {
  isInitialized: boolean;
  isInitializing: boolean;
  hasInstance: boolean;
} => {
  return {
    isInitialized: app !== null,
    isInitializing: isInitializing,
    hasInstance: app !== null,
  };
};

/**
 * Destroys the current app instance and cleans up resources.
 */
export const destroy = async (): Promise<void> => {
  try {
    debugLog.info('API', 'Library cleanup initiated');

    if (isDestroying) {
      debugLog.warn('API', 'Cleanup already in progress, skipping duplicate cleanup');
      return;
    }

    if (!app) {
      debugLog.warn('API', 'Cleanup called but Library was not initialized');
      throw new Error('App not initialized');
    }

    isDestroying = true;

    try {
      debugLog.debug('API', 'Calling app.destroy()');
      await app.destroy();
      debugLog.debug('API', 'app.destroy() completed successfully');
    } catch (destroyError) {
      debugLog.error('API', 'app.destroy() failed, performing forced cleanup', { destroyError });

      try {
        debugLog.debug('API', 'Forcing app cleanup');
        if (app) {
          app = null;
        }
        debugLog.debug('API', 'Forced cleanup completed');
      } catch (cleanupError) {
        debugLog.error('API', 'Forced cleanup failed', { cleanupError });
      }

      throw destroyError;
    }

    debugLog.debug('API', 'Nullifying app instance');
    app = null;

    debugLog.debug('API', 'Resetting initialization flags');
    isInitializing = false;

    debugLog.info('API', 'Library cleanup completed successfully');
  } catch (error) {
    debugLog.error('API', 'Cleanup failed', { error, hadApp: !!app, wasInitializing: isInitializing });
    throw error;
  } finally {
    isDestroying = false;
  }
};

/**
 * Gets current error recovery statistics for monitoring purposes.
 * @returns Object with recovery statistics and system status, or null if not initialized
 * @example
 * const stats = getRecoveryStats();
 * if (stats) {
 *   console.log('Circuit breaker resets:', stats.circuitBreakerResets);
 *   console.log('Network timeouts:', stats.networkTimeouts);
 * }
 */
export const getRecoveryStats = (): {
  circuitBreakerResets: number;
  persistenceFailures: number;
  networkTimeouts: number;
  lastRecoveryAttempt: number;
  currentFailureCount: number;
  circuitBreakerOpen: boolean;
  fingerprintMapSize: number;
} | null => {
  try {
    if (!app) {
      debugLog.warn('API', 'Recovery stats requested but Library was not initialized');
      return null;
    }

    return app.getRecoveryStats();
  } catch (error) {
    debugLog.error('API', 'Failed to get recovery stats', { error });
    return null;
  }
};

/**
 * Triggers manual system recovery to attempt fixing error states.
 * This can help recover from stuck circuit breakers, failed event persistence, or other error conditions.
 * @returns Promise that resolves when recovery attempt is complete
 * @example
 * await attemptSystemRecovery();
 * console.log('Recovery attempt completed');
 */
export const attemptSystemRecovery = async (): Promise<void> => {
  try {
    if (!app) {
      debugLog.warn('API', 'System recovery attempted but Library was not initialized');
      throw new Error('App not initialized');
    }

    debugLog.info('API', 'Manual system recovery initiated');
    await app.attemptSystemRecovery();
    debugLog.info('API', 'Manual system recovery completed');
  } catch (error) {
    debugLog.error('API', 'System recovery failed', { error });
    throw error;
  }
};

/**
 * Triggers aggressive fingerprint cleanup to free memory.
 * This removes old event fingerprints to prevent memory leaks in long-running sessions.
 * @example
 * aggressiveFingerprintCleanup();
 * console.log('Fingerprint cleanup completed');
 */
export const aggressiveFingerprintCleanup = (): void => {
  try {
    if (!app) {
      debugLog.warn('API', 'Fingerprint cleanup attempted but Library was not initialized');
      throw new Error('App not initialized');
    }

    debugLog.info('API', 'Manual fingerprint cleanup initiated');
    app.aggressiveFingerprintCleanup();
    debugLog.info('API', 'Manual fingerprint cleanup completed');
  } catch (error) {
    debugLog.error('API', 'Fingerprint cleanup failed', { error });
    throw error;
  }
};

class TestBridge extends App implements TraceLogTestBridge {
  isInitializing(): boolean {
    return isInitializing;
  }
}

// Auto-inject testing bridge only in development/testing environments
if (process.env.NODE_ENV === 'dev') {
  if (typeof window !== 'undefined') {
    const injectTestingBridge = (): void => {
      window.__traceLogBridge = new TestBridge();
    };

    // Inject immediately if DOM is ready, otherwise wait
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', injectTestingBridge);
    } else {
      injectTestingBridge();
    }
  }
}
