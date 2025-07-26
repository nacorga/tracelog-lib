import { Tracking } from './tracking';
import { Config, MetadataType } from './types';
import { logError } from './utils';

export * as Types from './types';

let trackingInstance: Tracking | undefined;

/**
 * Initialize tracking with configuration
 * @param id - Tracking ID
 * @param config - Optional configuration
 */
export const init = (config: Config): void => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  if (trackingInstance) {
    return;
  }

  if (!config?.id) {
    logError('Tracking ID is required');
    return;
  }

  if (config?.sessionTimeout && config.sessionTimeout < 30_000) {
    logError('Session timeout must be at least 30 seconds');
    return;
  }

  try {
    trackingInstance = new Tracking(config);
  } catch (error) {
    logError(`Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Create custom event
 * @param name - Event name
 * @param metadata - Optional metadata
 */
export const event = (name: string, metadata?: Record<string, MetadataType>): void => {
  if (!trackingInstance) {
    logError('Not initialized. Call init() first.');
    return;
  }

  try {
    trackingInstance.customEventHandler(name, metadata).catch((error) => {
      logError(`Custom event failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    });
  } catch (error) {
    logError(`Custom event failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
