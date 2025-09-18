import { App } from './app';
import { EventManager } from './managers/event.manager';
import { MetadataType } from './types/common.types';
import { AppConfig } from './types/config.types';
import { debugLog } from './utils/logging';
import { validateAndNormalizeConfig } from './utils/validations';
import './types/window.types';

export * as Types from './app.types';
export * as Constants from './app.constants';

let app: App | null = null;
let isInitializing = false;

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
    debugLog.info('API', 'SDK initialization started', { id: appConfig.id, mode: appConfig.mode });

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
      debugLog.debug('API', 'SDK already initialized, skipping duplicate initialization', { projectId: appConfig.id });
      return;
    }

    if (isInitializing) {
      debugLog.debug('API', 'Concurrent initialization detected, waiting for completion', { projectId: appConfig.id });
      // Instead of throwing, wait for the ongoing initialization to complete
      let retries = 0;
      const maxRetries = 20; // 2 seconds maximum wait (reduced for better performance)

      while (isInitializing && retries < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 50)); // Shorter intervals for faster response
        retries++;
      }

      if (app) {
        debugLog.debug('API', 'Concurrent initialization completed successfully', {
          projectId: appConfig.id,
          retriesUsed: retries,
        });
        return; // Initialization completed successfully
      }

      if (isInitializing) {
        debugLog.error('API', 'Initialization timeout - concurrent initialization took too long', {
          projectId: appConfig.id,
          retriesUsed: retries,
          maxRetries,
        });
        throw new Error('App initialization timeout - concurrent initialization took too long');
      }
    }

    isInitializing = true;

    debugLog.debug('API', 'Validating and normalizing configuration', { projectId: appConfig.id });
    const validatedConfig = validateAndNormalizeConfig(appConfig);

    debugLog.debug('API', 'Creating App instance', { projectId: validatedConfig.id });
    const instance = new App();

    await instance.init(validatedConfig);

    app = instance;
    debugLog.info('API', 'SDK initialization completed successfully', {
      projectId: validatedConfig.id,
      mode: validatedConfig.mode,
    });
  } catch (error) {
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
      debugLog.clientError('API', 'Custom event failed - SDK not initialized. Please call TraceLog.init() first', {
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
export const destroy = (): void => {
  try {
    debugLog.info('API', 'SDK cleanup initiated');

    if (!app) {
      debugLog.warn('API', 'Cleanup called but SDK was not initialized');
      throw new Error('App not initialized');
    }

    app.destroy();
    app = null;
    isInitializing = false;
    debugLog.info('API', 'SDK cleanup completed successfully');
  } catch (error) {
    debugLog.error('API', 'Cleanup failed', { error, hadApp: !!app, wasInitializing: isInitializing });
  }
};

// Auto-inject testing bridge only in development/testing environments
if (process.env.NODE_ENV === 'e2e') {
  if (typeof window !== 'undefined') {
    // Wait for DOM to be ready before injecting
    const injectTestingBridge = (): void => {
      window.__traceLogTestBridge = {
        /**
         * Get the event manager instance for testing
         * @returns EventManager instance or null if not initialized
         */
        getEventManager: (): EventManager | null => app?.eventManagerInstance ?? null,

        /**
         * Check if TraceLog is properly initialized
         * @returns true if initialized, false otherwise
         */
        isInitialized: (): boolean => !!app && !isInitializing,

        /**
         * Get the current app instance for advanced testing
         * @returns App instance or null if not initialized
         */
        getAppInstance: (): App | null => app ?? null,

        /**
         * Get the scroll handler instance for testing
         * @returns ScrollHandler instance or null if not initialized
         */
        getScrollHandler: () => app?.scrollHandlerInstance ?? null,

        /**
         * Check if initialization is in progress
         * @returns true if initializing, false otherwise
         */
        isInitializing: (): boolean => isInitializing,

        /**
         * Environment detection for debugging
         * @returns object with environment flags
         */
        getEnvironmentInfo: () => ({
          hostname: window.location.hostname,
          hasTestIds: !!document.querySelector('[data-testid]'),
          hasPlaywright: !!(window as any).__playwright,
          userAgent: navigator.userAgent,
          nodeEnv: process.env.NODE_ENV,
        }),
      };
    };

    // Inject immediately if DOM is ready, otherwise wait
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', injectTestingBridge);
    } else {
      injectTestingBridge();
    }
  }
}
