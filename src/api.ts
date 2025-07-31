import { App } from './app';
import { MetadataType } from './types/common.types';
import { AppConfig } from './types/config.types';
import { log } from './utils/log.utils';

let app: App | null = null;
let isInitializing = false;

/**
 * Initializes the tracelog app with the provided configuration.
 * @param appConfig - The configuration object for the app
 * @throws {Error} If the app is already initialized or initialization is in progress
 * @example
 * await init({ id: 'my-project-id', sessionTimeout: 600000 });
 */
export const init = async (appConfig: AppConfig): Promise<void> => {
  try {
    if (app) {
      throw new Error('App is already initialized. Call getApp() to get the existing instance.');
    }

    if (isInitializing) {
      throw new Error('App initialization is already in progress');
    }

    isInitializing = true;

    const instance = new App();

    await instance.init(appConfig);

    app = instance;
  } catch (error) {
    app = null;

    log('error', `Initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  } finally {
    isInitializing = false;
  }
};

/**
 * Sends a custom event with the specified name and metadata.
 * @param name - The name of the custom event.
 * @param metadata - Optional metadata to attach to the event.
 * * @throws Will throw an error if the app is not initialized or if the event validation fails.
 * @throws Will throw an error if the event validation fails in QA mode.
 * @example
 * // Send a custom event with metadata
 * event('user_signup', { method: 'email', plan: 'premium' });
 * @example
 * // Send a custom event without metadata
 * event('user_login');
 * @example
 * // Send a custom event with invalid metadata (will throw an error in QA mode)
 * event('user_signup', { method: 'email', plan: 123 }); // Invalid metadata type
 * @throws {Error} If the app is not initialized or if the event validation fails.
 * @throws {Error} If the event validation fails in QA mode.
 * @returns {void}
 * @remarks
 * This function is used to track custom events in the application. It validates the event name and metadata before sending it to the event manager.
 * If the event is valid, it is tracked; otherwise, an error is thrown if the app is in QA mode.
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
  }
};

/**
 * Destroys the current app instance and cleans up resources.
 * @example
 * destroy(); // Safely cleanup the app
 */
export const destroy = (): void => {
  try {
    if (app) {
      app.destroy();
      app = null;
    }

    isInitializing = false;
  } catch (error) {
    log('error', `Cleanup failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};
