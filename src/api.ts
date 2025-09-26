import { App } from './app';
import { MetadataType } from './types/common.types';
import { AppConfig } from './types/config.types';
import { debugLog } from './utils/logging';
import { validateAndNormalizeConfig } from './utils/validations';
import { TestBridge } from './test-bridge';
import './types/window.types';

export * as Types from './app.types';
export * as Constants from './app.constants';

let app: App | null = null;
let isInitializing = false;
let isDestroying = false;

/**
 * Initializes the tracelog app with the provided configuration.
 * If already initialized, this function returns early without error.
 * @param appConfig - The configuration object for the app
 * @throws {Error} If initialization fails or environment is invalid
 * @example
 * await init({ id: 'my-project-id' });
 */
export const init = async (appConfig: AppConfig): Promise<void> => {
  // Browser environment check
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('This library can only be used in a browser environment');
  }

  // Already initialized - safe to return
  if (app) {
    debugLog.debug('API', 'Library already initialized, skipping duplicate initialization');
    return;
  }

  // Prevent concurrent initialization
  if (isInitializing) {
    debugLog.warn('API', 'Initialization already in progress');
    throw new Error('Initialization already in progress');
  }

  isInitializing = true;

  try {
    debugLog.info('API', 'Initializing TraceLog', { projectId: appConfig.id });

    const validatedConfig = validateAndNormalizeConfig(appConfig);
    const instance = new App();

    await instance.init(validatedConfig);
    app = instance;

    debugLog.info('API', 'TraceLog initialized successfully', { projectId: validatedConfig.id });
  } catch (error) {
    // Cleanup on failure
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
  if (!app) {
    throw new Error('TraceLog not initialized. Please call init() first.');
  }

  try {
    app.sendCustomEvent(name, metadata);
  } catch (error) {
    debugLog.error('API', 'Failed to send custom event', { eventName: name, error });
    throw error;
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
 * Destroys the current app instance and cleans up resources.
 * @throws {Error} If not initialized or already destroying
 */
export const destroy = async (): Promise<void> => {
  // Check if app was never initialized
  if (!app) {
    throw new Error('App not initialized');
  }

  // Prevent concurrent destroy operations
  if (isDestroying) {
    throw new Error('Destroy operation already in progress');
  }

  isDestroying = true;

  try {
    debugLog.info('API', 'Destroying TraceLog instance');
    await app.destroy();
    app = null;
    isInitializing = false;
    debugLog.info('API', 'TraceLog destroyed successfully');
  } catch (error) {
    // Force cleanup even if destroy fails
    app = null;
    isInitializing = false;
    debugLog.error('API', 'Error during destroy, forced cleanup', { error });
    throw error;
  } finally {
    isDestroying = false;
  }
};

// Auto-inject testing bridge in development environments
if (process.env.NODE_ENV === 'dev' && typeof window !== 'undefined') {
  const injectTestingBridge = (): void => {
    window.__traceLogBridge = new TestBridge(isInitializing, isDestroying);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectTestingBridge);
  } else {
    injectTestingBridge();
  }
}
