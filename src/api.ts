import { App } from './app';
import { MetadataType } from './types/common.types';
import { AppConfig } from './types/config.types';
import { logUnknown } from './utils';
import { validateAndNormalizeConfig } from './utils/validations';

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
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      throw new Error('This library can only be used in a browser environment');
    }

    if (app) {
      return;
    }

    if (isInitializing) {
      // Instead of throwing, wait for the ongoing initialization to complete
      let retries = 0;
      const maxRetries = 20; // 2 seconds maximum wait (reduced for better performance)

      while (isInitializing && retries < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 50)); // Shorter intervals for faster response
        retries++;
      }

      if (app) {
        return; // Initialization completed successfully
      }

      if (isInitializing) {
        throw new Error('App initialization timeout - concurrent initialization took too long');
      }
    }

    isInitializing = true;

    const validatedConfig = validateAndNormalizeConfig(appConfig);
    const instance = new App();

    await instance.init(validatedConfig);

    app = instance;
  } catch (error) {
    app = null;

    logUnknown('error', 'Initialization failed', error);

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
      throw new Error('App not initialized');
    }

    app.sendCustomEvent(name, metadata);
  } catch (error) {
    logUnknown('error', 'Event tracking failed', error);

    if (error instanceof Error && error.message === 'App not initialized') {
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
    if (!app) {
      throw new Error('App not initialized');
    }

    app.destroy();
    app = null;
    isInitializing = false;
  } catch (error) {
    logUnknown('error', 'Cleanup failed', error);
  }
};
