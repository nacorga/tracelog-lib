import { App } from './app';
import { MetadataType } from './types/common.types';
import { AppConfig } from './types/config.types';
import { log } from './utils';
import { validateAndNormalizeConfig } from './utils/validations';

export * as Types from './app.types';
export * as Constants from './app.constants';

let app: App | null = null;
let isInitializing = false;

/**
 * Initializes the tracelog app with the provided configuration.
 * @param appConfig - The configuration object for the app
 * @throws {Error} If the app is already initialized or initialization is in progress
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
      throw new Error('App initialization is already in progress');
    }

    isInitializing = true;

    const validatedConfig = validateAndNormalizeConfig(appConfig);
    const instance = new App();

    await instance.init(validatedConfig);

    app = instance;
  } catch (error) {
    app = null;

    log('error', `Initialization failed: ${error instanceof Error ? error.message : String(error)}`);
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
    log('error', `Event tracking failed: ${error instanceof Error ? error.message : String(error)}`);

    if (error instanceof Error && error.message === 'App not initialized') {
      throw error;
    }
  }
};

/**
 * Destroys the current app instance and cleans up resources.
 * @example
 * destroy(); // Safely cleanup the app
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
    log('error', `Cleanup failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};
