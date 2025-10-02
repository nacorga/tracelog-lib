import { App } from './app';
import { MetadataType, AppConfig, EmitterCallback, EmitterMap } from './types';
import { debugLog, validateAndNormalizeConfig } from './utils';
import { TestBridge } from './test-bridge';
import './types/window.types';

let app: App | null = null;
let isInitializing = false;
let isDestroying = false;

export const init = async (appConfig: AppConfig): Promise<void> => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('This library can only be used in a browser environment');
  }

  if (window.__traceLogDisabled) {
    return;
  }

  if (app) {
    debugLog.debug('API', 'Library already initialized, skipping duplicate initialization');
    return;
  }

  if (isInitializing) {
    debugLog.warn('API', 'Initialization already in progress');
    throw new Error('Initialization already in progress');
  }

  isInitializing = true;

  try {
    debugLog.info('API', 'Initializing TraceLog', { projectId: appConfig.id });

    const validatedConfig = validateAndNormalizeConfig(appConfig);
    const instance = new App();

    try {
      await instance.init(validatedConfig);
      app = instance;

      debugLog.info('API', 'TraceLog initialized successfully', { projectId: validatedConfig.id });
    } catch (error) {
      try {
        await instance.destroy(true);
      } catch (cleanupError) {
        debugLog.warn('API', 'Failed to cleanup partially initialized app', { cleanupError });
      }
      throw error;
    }
  } catch (error) {
    app = null;
    debugLog.error('API', 'Initialization failed', { error });
    throw error;
  } finally {
    isInitializing = false;
  }
};

export const event = (name: string, metadata?: Record<string, MetadataType> | Record<string, MetadataType>[]): void => {
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

export const on = <K extends keyof EmitterMap>(event: K, callback: EmitterCallback<EmitterMap[K]>): void => {
  if (!app) {
    throw new Error('TraceLog not initialized. Please call init() first.');
  }

  app.on(event, callback);
};

export const off = <K extends keyof EmitterMap>(event: K, callback: EmitterCallback<EmitterMap[K]>): void => {
  if (!app) {
    throw new Error('TraceLog not initialized. Please call init() first.');
  }

  app.off(event, callback);
};

export const isInitialized = (): boolean => {
  return app !== null;
};

export const destroy = async (): Promise<void> => {
  if (!app) {
    throw new Error('App not initialized');
  }

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
